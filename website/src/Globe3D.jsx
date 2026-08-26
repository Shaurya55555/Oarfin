import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Reusable atmosphere-glow fresnel shader — cheap approximation of the
// reference site's sunlit-limb look. Important fix: the top (warm) and
// bottom (cool) glows are two INDEPENDENT falloffs that each fade to zero
// well before reaching the opposite pole, combined additively -- not a
// single mix(bottomColor, topColor, t) sweeping across the whole sphere.
// Linearly interpolating orange toward blue in RGB passes through muddy
// red/magenta/purple at the midpoint (that's a real color-mixing artifact,
// not a rendering bug), which is exactly the "rainbow border" look that
// didn't match the reference. The reference doesn't blend hue-to-hue at
// all -- each glow fades to plain darkness on its own before they'd ever
// meet, so the sides of the globe stay near-black.
const GLOW_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GLOW_FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 peakColor;
  uniform float intensityMul;
  void main() {
    float rim = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    float topGlow = smoothstep(2.0, 8.0, vPosition.y);
    float peak = smoothstep(5.0, 9.5, vPosition.y);
    float bottomGlow = 1.0 - smoothstep(-8.0, -2.0, vPosition.y);
    vec3 warm = mix(topColor, peakColor, peak);
    vec3 glowColor = warm * topGlow + bottomColor * bottomGlow;
    float alpha = rim * clamp(topGlow + bottomGlow, 0.0, 1.0) * intensityMul;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// Several concentric copies of the glow shell, each larger and dimmer than
// the last, approximate the soft blurred "bloom" halo the reference site
// has around its rim -- real post-processing bloom (UnrealBloomPass)
// rendered fully black in this environment for reasons that didn't throw
// any catchable error, so this layered-shell technique (a well-established
// fallback for faking bloom in cheap Three.js scenes) gets the same soft
// falloff without depending on a fragile render-target pipeline.
function buildGlowShells(baseRadius, topColor, bottomColor, peakColor) {
  const layers = [
    { radius: baseRadius, intensity: 1.0 },
    { radius: baseRadius * 1.09, intensity: 0.45 },
    { radius: baseRadius * 1.22, intensity: 0.22 },
    { radius: baseRadius * 1.4, intensity: 0.1 },
  ];
  return layers.map(({ radius, intensity }) => new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
      uniforms: {
        topColor: { value: new THREE.Color(topColor) },
        bottomColor: { value: new THREE.Color(bottomColor) },
        peakColor: { value: new THREE.Color(peakColor) },
        intensityMul: { value: intensity },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  ));
}

// Dot-matrix layer shader: samples the same rasterized land texture as
// before, but modulates each dot's color/brightness by how close it sits to
// the sphere's silhouette edge (the same fresnel term the atmosphere shell
// uses) -- dots near the horizon pick up the rim's tint and glow brighter,
// dots facing the camera stay their plain white/pale color. Same
// independent-falloff approach as the glow shell above, for the same reason.
const DOT_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const DOT_FRAGMENT = `
  uniform sampler2D dotMap;
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(dotMap, vUv);
    if (tex.a < 0.1) discard;
    float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    float topGlow = smoothstep(2.0, 8.0, vPosition.y);
    float bottomGlow = 1.0 - smoothstep(-8.0, -2.0, vPosition.y);
    vec3 tint = topColor * topGlow + bottomColor * bottomGlow;
    float tintAmount = rim * clamp(topGlow + bottomGlow, 0.0, 1.0);
    vec3 finalColor = mix(tex.rgb, tint, tintAmount * 0.8);
    gl_FragColor = vec4(finalColor * (1.0 + rim * 1.4), tex.a);
  }
`;

// Thin decorative orbit rings around the globe. Earlier tilt values (near
// Math.PI/2, i.e. nearly edge-on to the camera) made these render as
// straight-looking diagonal lines cutting across the globe instead of
// visible ellipses -- keeping tiltX well short of edge-on (~35-55 deg from
// face-on) keeps them readable as rings from the camera's fixed viewpoint.
function buildOrbitRing(radius, tiltX, tiltZ, color) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(128).map(p => new THREE.Vector3(p.x, p.y, 0));
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const ring = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
  ring.rotation.x = tiltX;
  ring.rotation.z = tiltZ;
  return ring;
}

function buildStarfield(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 60 + Math.random() * 140;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.7, sizeAttenuation: true }));
}

// Rasterizes real land-polygon GeoJSON (fetched from /world-land.geojson,
// Natural Earth 110m land data) into an equirectangular dot-matrix canvas
// texture — the actual "stippled world map" look, using real coastlines
// instead of an approximation.
function rasterizeLandToDots(geojson) {
  const W = 1400, H = 700;
  const landCanvas = document.createElement('canvas');
  landCanvas.width = W; landCanvas.height = H;
  const lctx = landCanvas.getContext('2d');
  lctx.fillStyle = '#fff';
  // Rasterize with the standard equirectangular seam at lon=+-180 (mostly
  // open ocean/Bering Strait -- safe for polygon fill: a ring that crosses
  // this seam jumps from x~W to x~0 mid-path, and Canvas2D's lineTo just
  // draws a stray connecting line across the fill for whatever it clips).
  // A first attempt at the THREE-UV alignment fix (see below) baked a +90
  // degree offset directly into this coordinate, which relocated that same
  // seam-crossing hazard to lon=-90 -- right through North America instead
  // of the Pacific -- tearing up that landmass's shape. The alignment
  // shift is applied afterwards instead, as a pure pixel offset on the
  // already-rasterized dot image, which can't corrupt any vector paths.
  const toXY = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];

  const drawRing = (ring) => {
    ring.forEach(([lon, lat], i) => {
      const [x, y] = toXY(lon, lat);
      i === 0 ? lctx.moveTo(x, y) : lctx.lineTo(x, y);
    });
  };
  const drawPolygon = (rings) => rings.forEach(drawRing);

  lctx.beginPath();
  geojson.features.forEach(f => {
    const g = f.geometry;
    if (g.type === 'Polygon') drawPolygon(g.coordinates);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(drawPolygon);
  });
  lctx.fill('evenodd');
  const landData = lctx.getImageData(0, 0, W, H).data;

  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = W; dotCanvas.height = H;
  const dctx = dotCanvas.getContext('2d');
  dctx.fillStyle = '#eaf2ff';
  const step = 6;
  // See note above: (lon+90)/360 is THREE's actual UV convention, which is
  // this toXY's (lon+180)/360 shifted by -90deg (=-0.25 of the width, i.e.
  // +0.75W mod W) -- applied here per-dot on already-rasterized alpha data,
  // not as a coordinate change during path construction.
  const shiftPx = Math.round(W * 0.75);
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const idx = (y * W + x) * 4;
      if (landData[idx + 3] > 128) {
        const jx = ((x + shiftPx) % W) + (Math.random() - 0.5) * 1.5;
        const jy = y + (Math.random() - 0.5) * 1.5;
        dctx.beginPath();
        dctx.arc(jx, jy, 1, 0, Math.PI * 2);
        dctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(dotCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Glowing flight-path arc between two surface points, lifted above the
// sphere at its midpoint (quadratic bezier), plus a small traveling light
// particle that animates along it — the "flight route" look from the
// reference site's global network visualization.
function buildArc(p1, p2, color) {
  const chord = p1.distanceTo(p2);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const liftFactor = 1 + (chord / (2 * p1.length())) * 0.55;
  mid.normalize().multiplyScalar(p1.length() * liftFactor);
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const points = curve.getPoints(48);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
  );
  return { line, particle, curve };
}

// Point-in-polygon (ray casting) test against a GeoJSON ring, used for the
// hover-to-country-name lookup below -- real per-country boundary matching,
// not an approximation.
function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function pointInPolygon(pt, rings) {
  if (!pointInRing(pt, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) if (pointInRing(pt, rings[k])) return false;
  return true;
}
function findCountryAt(countries, lon, lat) {
  const pt = [lon, lat];
  for (const f of countries) {
    const g = f.geometry;
    if (g.type === 'Polygon') { if (pointInPolygon(pt, g.coordinates)) return f.properties.name; }
    else if (g.type === 'MultiPolygon') { for (const poly of g.coordinates) if (pointInPolygon(pt, poly)) return f.properties.name; }
  }
  return null;
}

function latLonToVector3(radius, latDeg, lonDeg) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon)
  );
}

// Marker dot + soft glow halo, placed on the sphere surface via spherical
// coordinates so it rotates naturally with the globe as a child of it.
function buildMarker(radius, latDeg, lonDeg, colorHex) {
  const pos = latLonToVector3(radius, latDeg, lonDeg);
  const group = new THREE.Group();
  group.position.copy(pos);
  group.lookAt(pos.clone().multiplyScalar(2));

  const color = new THREE.Color(colorHex);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color }));
  group.add(dot);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
  );
  group.add(halo);

  return { group, halo, localPos: pos };
}

/**
 * Full-bleed animated hero background: a rotating globe (offset well to the
 * right of the viewport so it never sits under the headline column) with a
 * real dot-matrix world map (rasterized from actual coastline data), orbit
 * shipping-route trails, a starfield, and real markers on the globe surface
 * for each entry in `markers` ({ color, label }). Each marker gets a
 * floating HTML label (like the reference site's country-name pills) that
 * fades in only while that marker is rotated toward the camera. The globe
 * auto-rotates, pulls back on scroll, and can be dragged with the cursor
 * (mouse/touch) to spin it manually, with momentum on release.
 */
export default function Globe3D({ scrollContainerId, markers = [] }) {
  const mountRef = useRef(null);
  const markersKey = markers.map(m => `${m.color}${m.label}${m.lat}${m.lon}`).join(',');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(0, 0, 34);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    mount.style.cursor = 'grab';

    // Everything planet-related lives in one group, offset well to the
    // right so the globe sits clear of the headline column.
    const planetGroup = new THREE.Group();
    planetGroup.position.x = 29;
    planetGroup.position.y = -2.5;
    planetGroup.scale.setScalar(1.35);
    scene.add(planetGroup);

    // Globe body — mostly-dark sphere, matching the reference's night-side look.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x050b16 })
    );
    planetGroup.add(globe);

    // Dot-matrix world map shell — filled in asynchronously once the real
    // land geometry loads (see fetch below); starts blank so nothing pops.
    // Seeded with a 1x1 transparent texture rather than null so the sampler
    // is never unbound (avoids a WebGL "texture unit" warning every frame).
    const blankTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    blankTexture.needsUpdate = true;
    const dotEarth = new THREE.Mesh(
      new THREE.SphereGeometry(10.03, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: DOT_VERTEX,
        fragmentShader: DOT_FRAGMENT,
        uniforms: {
          dotMap: { value: blankTexture },
          topColor: { value: new THREE.Color(0xff8a3d) },
          bottomColor: { value: new THREE.Color(0x1a8cff) },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
    );
    globe.add(dotEarth);

    let dotTexture = null;
    fetch('/world-land.geojson')
      .then(r => r.json())
      .then(geojson => {
        if (cancelled) return;
        dotTexture = rasterizeLandToDots(geojson);
        dotEarth.material.uniforms.dotMap.value = dotTexture;
        dotEarth.material.needsUpdate = true;
      })
      .catch(() => { /* decorative only — fine to skip if it fails to load */ });

    // Real per-country boundaries (Natural Earth 110m admin-0, trimmed to
    // just name+geometry) for the hover-to-country-name lookup below.
    let countries = [];
    fetch('/world-countries.geojson')
      .then(r => r.json())
      .then(geojson => { if (!cancelled) countries = geojson.features; })
      .catch(() => { /* hover label just won't resolve names if this fails */ });

    // Real disaster markers on the globe surface, at each disaster's actual
    // reported lat/lon (see the `markers` prop -- fetched live from GDACS
    // by the parent, same feed the Dashboard's map uses).
    const labelEls = [];
    const markerObjs = markers.map((m) => {
      const { group, halo, localPos } = buildMarker(10.15, m.lat, m.lon, m.color);
      globe.add(group);

      // Solid dark pill badge, matching the reference site's actual label
      // style (confirmed directly against a reference screenshot -- multiple
      // labels visible at once, solid background, not hover-gated).
      const el = document.createElement('div');
      el.textContent = m.label;
      el.style.cssText = `
        position: absolute; top: 0; left: 0; transform: translate(-50%, -130%);
        background: rgba(10,14,26,0.85); color: #fff; font-size: 11px; font-weight: 700;
        letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px;
        border: 1px solid ${m.color}; white-space: nowrap; pointer-events: none;
        transition: opacity 0.3s ease; opacity: 0;
      `;
      mount.appendChild(el);
      labelEls.push(el);

      return { halo, localPos, el };
    });

    // Flight-path arcs connecting each marker to the next (closing the loop
    // once there are 3+), each with a traveling light particle -- children
    // of `globe` so they rotate together with the markers they connect.
    const arcs = [];
    if (markerObjs.length >= 2) {
      const pairCount = markerObjs.length >= 3 ? markerObjs.length : 1;
      for (let i = 0; i < pairCount; i++) {
        const a = markerObjs[i].localPos;
        const b = markerObjs[(i + 1) % markerObjs.length].localPos;
        const { line, particle, curve } = buildArc(a, b, 0xff8a3d);
        globe.add(line);
        globe.add(particle);
        arcs.push({ curve, line, particle, phase: i / pairCount, speed: 0.18 });
      }
    }

    // Atmosphere glow: neon blue at the bottom, through vivid orange, up to
    // a warm yellow-white peak highlight at the top crest -- layered as
    // multiple concentric shells (see buildGlowShells) to fake a soft
    // bloom-like blur around the rim.
    const glowShells = buildGlowShells(10.6, 0xffa64d, 0x0066ff, 0xffe9b0);
    glowShells.forEach(shell => planetGroup.add(shell));

    // Decorative orbit rings, tilted enough to read clearly as ellipses
    // rather than the near-edge-on lines the earlier tilt values produced.
    // Child of `globe` (not `planetGroup`) so drag-to-rotate -- which only
    // touches globe.rotation -- carries the rings along with it, instead of
    // them sitting still while the dots/markers/arcs spin underneath.
    const orbitGroup = new THREE.Group();
    orbitGroup.add(buildOrbitRing(13.5, 1.05, 0.35, 0xff8a3d));
    orbitGroup.add(buildOrbitRing(15.5, 0.85, -0.5, 0xffb066));
    globe.add(orbitGroup);

    // Starfield stays centered on the whole viewport, not offset with the planet.
    const stars = buildStarfield(1800);
    scene.add(stars);

    let raf = null;
    let scrollProgress = 0; // 0 = top of hero, 1 = scrolled a full viewport past it

    const computeScroll = () => {
      const el = scrollContainerId ? document.getElementById(scrollContainerId) : mount;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      scrollProgress = Math.min(1, Math.max(0, -rect.top / vh));
    };
    const onScroll = () => computeScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    computeScroll();

    // ── Drag-to-rotate ──────────────────────────────────────────────────
    let dragging = false;
    let lastX = 0, lastY = 0;
    let velY = 0;

    const onPointerDown = (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      velY = 0;
      mount.style.cursor = 'grabbing';
      mount.setPointerCapture?.(e.pointerId);
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const rotY = dx * 0.006;
      globe.rotation.y += rotY;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + dy * 0.006, -1.1, 1.1);
      velY = rotY;
      lastX = e.clientX; lastY = e.clientY;
      e.preventDefault();
    };
    const onPointerUp = () => {
      dragging = false;
      mount.style.cursor = 'grab';
      document.body.style.userSelect = '';
    };
    // Belt-and-suspenders: selectstart fires regardless of which input path
    // (real pointer, plain mouse, or automated/CDP-simulated events) drove
    // the gesture, so this is the one reliable place to kill text selection
    // for the duration of a drag no matter how it was initiated.
    const onSelectStart = (e) => { if (dragging) e.preventDefault(); };
    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('mousedown', onPointerDown);
    document.addEventListener('selectstart', onSelectStart);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // ── Mouse-follow tilt — a gentle passive tilt of the whole planet
    // group (separate from the globe's own spin/drag rotation) that eases
    // toward the cursor position, suspended while actively dragging.
    let targetTiltX = 0, targetTiltY = 0;
    const onMouseTilt = (e) => {
      if (dragging) return;
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.12;
      targetTiltX = THREE.MathUtils.clamp(-ny, -1, 1) * 0.08;
    };
    mount.addEventListener('mousemove', onMouseTilt);

    // ── Hover-to-country-name — raycasts the cursor against the actual dot
    // sphere, converts the 3D hit point back to lat/lon, and looks that up
    // against real country boundaries (not the 3 disaster markers -- any
    // country dot anywhere on the globe). Transparent text, no background
    // card, positioned right above the cursor; throttled to ~10/sec since
    // the point-in-polygon search walks up to 177 countries' rings.
    const countryRaycaster = new THREE.Raycaster();
    const countryNDC = new THREE.Vector2(-10, -10);
    let hoverX = 0, hoverY = 0;
    const onCountryHoverMove = (e) => {
      const rect = mount.getBoundingClientRect();
      hoverX = e.clientX - rect.left;
      hoverY = e.clientY - rect.top;
      countryNDC.x = (hoverX / rect.width) * 2 - 1;
      countryNDC.y = -(hoverY / rect.height) * 2 + 1;
    };
    const onCountryHoverLeave = () => { countryNDC.set(-10, -10); };
    mount.addEventListener('mousemove', onCountryHoverMove);
    mount.addEventListener('mouseleave', onCountryHoverLeave);

    const countryLabelEl = document.createElement('div');
    countryLabelEl.style.cssText = `
      position: absolute; top: 0; left: 0; transform: translate(-50%, -140%);
      background: transparent; color: #fff; font-size: 12px; font-weight: 700;
      letter-spacing: 0.04em; text-transform: uppercase; padding: 0; border: none;
      white-space: nowrap; pointer-events: none; z-index: 2;
      text-shadow: 0 1px 3px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.75);
      transition: opacity 0.12s ease; opacity: 0;
    `;
    mount.appendChild(countryLabelEl);
    const hitPointLocal = new THREE.Vector3();
    let lastCountryCheck = 0;

    const clock = new THREE.Clock();
    const worldPos = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    let elapsed = 0;

    const animate = () => {
      // Always reschedule first: if anything below throws on some frame, a
      // hand-rolled raf loop otherwise dies permanently (the reschedule call
      // never runs), freezing the globe until the next full page reload.
      raf = requestAnimationFrame(animate);
      try {
        renderFrame();
      } catch (err) {
        console.error('Globe3D render frame error:', err);
      }
    };

    const renderFrame = () => {
      const dt = clock.getDelta();
      elapsed += dt;

      if (dragging) {
        // rotation already applied directly in the pointermove handler
      } else {
        globe.rotation.y += dt * (0.09 + scrollProgress * 0.4) + velY;
        velY *= 0.92; // momentum decay after release
      }
      orbitGroup.rotation.y += dt * 0.03;
      stars.rotation.y += dt * 0.005;

      planetGroup.rotation.x += (targetTiltX - planetGroup.rotation.x) * 0.05;
      planetGroup.rotation.y += (targetTiltY - planetGroup.rotation.y) * 0.05;

      arcs.forEach(a => {
        const t = (elapsed * a.speed + a.phase) % 1;
        a.curve.getPoint(t, a.particle.position);
      });

      camera.position.z = 34 + scrollProgress * 18;
      camera.position.y = -scrollProgress * 6;
      camera.lookAt(planetGroup.position.x * 0.4, 0, 0);
      camera.getWorldDirection(camDir);

      const mountRect = mount.getBoundingClientRect();
      markerObjs.forEach((m, i) => {
        const pulse = 0.85 + 0.25 * Math.sin(elapsed * 2 + i * 2);
        m.halo.scale.setScalar(pulse);

        // Only show the label while this marker faces roughly toward the camera.
        worldPos.copy(m.localPos);
        globe.localToWorld(worldPos);
        worldNormal.copy(m.localPos).normalize();
        worldNormal.transformDirection(globe.matrixWorld);
        const facing = worldNormal.dot(camDir) < -0.15;

        if (facing && mountRect.width > 0) {
          const proj = worldPos.clone().project(camera);
          const sx = (proj.x * 0.5 + 0.5) * mountRect.width;
          const sy = (-proj.y * 0.5 + 0.5) * mountRect.height;
          m.el.style.left = `${sx}px`;
          m.el.style.top = `${sy}px`;
          m.el.style.opacity = '1';
        } else {
          m.el.style.opacity = '0';
        }
      });

      if (elapsed - lastCountryCheck > 0.1) {
        lastCountryCheck = elapsed;
        countryRaycaster.setFromCamera(countryNDC, camera);
        const hit = countryRaycaster.intersectObject(dotEarth, false)[0];
        let name = null;
        if (hit && countries.length > 0) {
          hitPointLocal.copy(hit.point);
          dotEarth.worldToLocal(hitPointLocal);
          const r = hitPointLocal.length();
          const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(hitPointLocal.y / r, -1, 1)));
          const lon = THREE.MathUtils.radToDeg(Math.atan2(hitPointLocal.x, hitPointLocal.z));
          name = findCountryAt(countries, lon, lat);
        }
        if (name) {
          countryLabelEl.textContent = name;
          countryLabelEl.style.left = `${hoverX}px`;
          countryLabelEl.style.top = `${hoverY}px`;
          countryLabelEl.style.opacity = '1';
        } else {
          countryLabelEl.style.opacity = '0';
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      document.body.style.userSelect = '';
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('selectstart', onSelectStart);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      mount.removeEventListener('mousemove', onMouseTilt);
      mount.removeEventListener('mousemove', onCountryHoverMove);
      mount.removeEventListener('mouseleave', onCountryHoverLeave);
      mount.removeChild(renderer.domElement);
      labelEls.forEach(el => el.remove());
      countryLabelEl.remove();
      dotTexture?.dispose();
      blankTexture.dispose();
      const disposables = [globe, dotEarth, stars, ...orbitGroup.children, ...glowShells];
      arcs.forEach(a => { disposables.push(a.line, a.particle); });
      globe.children.forEach(child => { if (child !== dotEarth) child.children.forEach(c => disposables.push(c)); });
      disposables.forEach(obj => {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material?.dispose();
      });
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerId, markersKey]);

  return <div ref={mountRef} style={{
    position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
    maskImage: 'linear-gradient(to right, transparent 0%, transparent 22%, black 34%)',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 22%, black 34%)',
  }} aria-hidden="true" />;
}

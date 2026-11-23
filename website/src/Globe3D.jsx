import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Decorative equatorial orbit ring around the globe. Earlier tilt values
// (near Math.PI/2, i.e. nearly edge-on to the camera) made this render as
// a straight-looking diagonal line cutting across the globe instead of a
// visible ellipse -- keeping tiltX well short of edge-on (~35-55 deg from
// face-on) keeps it readable as a ring from the camera's fixed viewpoint.
// Built as a thin TubeGeometry rather than a plain Line: browsers ignore
// LineBasicMaterial's linewidth (always render 1px) regardless of what's
// set, so a genuinely thicker ring needs real 3D geometry -- a modest tube
// radius, not thick enough to read as Saturn-style rings.
function buildOrbitRing(radius, tiltX, tiltZ, color, tubeRadius = 0.035) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(128).map(p => new THREE.Vector3(p.x, p.y, 0));
  const path = new THREE.CatmullRomCurve3(points, true);
  const geo = new THREE.TubeGeometry(path, 128, tubeRadius, 8, true);
  const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 }));
  ring.rotation.x = tiltX;
  ring.rotation.z = tiltZ;
  return ring;
}

// Soft radial-gradient glow sprite (always faces the camera, unlike a
// sphere) -- bright center smoothly fading to fully transparent. Used for
// the sun's outer corona: a handful of overlapping SphereGeometry shells
// each has a hard silhouette edge and reads as flat concentric rings
// rather than a real photographic glow, this gives a genuinely smooth
// falloff instead.
function makeRadialGlowTexture(colorHex) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const color = new THREE.Color(colorHex);
  const hex = `#${color.getHexString()}`;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, hex + 'e6');
  grad.addColorStop(0.25, hex);
  grad.addColorStop(0.6, hex + '55');
  grad.addColorStop(1, hex + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function buildGlowSprite(size, colorHex) {
  const tex = makeRadialGlowTexture(colorHex);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sprite.scale.setScalar(size);
  return sprite;
}

// Sun + the seven other planets (Earth is the real textured globe itself,
// not rebuilt here) — the decorative payoff for the Ctrl+scroll/pinch
// "zoom out" gesture. Everything starts fully transparent (opacity 0) so
// it stays invisible and inert in the normal close-up hero view, then
// fades in as the render loop drives opacity up with zoomLevel. Not to
// real relative scale/distance (nothing here is) -- sized and spaced for
// a clean readable silhouette, echoing the "whole solar system" reveal
// look rather than a scientifically accurate orrery.
function buildSun(radius) {
  const group = new THREE.Group();
  // Camera-facing photographed disc (NASA imagery, same asset as the
  // portfolio site) with soft corona sprites behind it.
  const core = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  group.add(core);
  const halos = [
    buildGlowSprite(radius * 4.2, 0xffbe6e),
    buildGlowSprite(radius * 7.5, 0xff9640),
  ];
  halos.forEach(h => group.add(h));
  return { group, core, halos };
}

// Photo planet: a camera-facing plane showing the real NASA photograph, with
// the side away from the sun darkened -- the same look as the portfolio
// site's orbit map. The shader reads the sun's direction on screen each
// frame (uLight) so the shading always faces the sun.
const PLANET_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const PLANET_FRAG = `
  uniform sampler2D uMap; uniform float uOpacity; uniform vec2 uLight; uniform float uWide;
  varying vec2 vUv;
  void main(){
    vec4 tex = texture2D(uMap, vUv);
    vec2 p = vUv - 0.5; p.x *= uWide;
    vec2 c = uLight * 0.3;
    float R = length(vec2(0.5 + abs(c.x), 0.5 + abs(c.y)));
    float shade = 0.78 * smoothstep(0.32, 0.82, length(p - c) / R);
    gl_FragColor = vec4(tex.rgb * (1.0 - shade), tex.a * uOpacity);
    #include <colorspace_fragment>
  }`;

function buildOrbitPlanet(orbitRadius, planetRadius, color, opts = {}) {
  const { wide = 1 } = opts;
  const group = new THREE.Group();
  // Thin, neutral orbit line (opacity driven by the render loop).
  const ring = buildOrbitRing(orbitRadius, 0, 0, 0x8a97ad, 0.09);
  ring.material.opacity = 0;
  group.add(ring);
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  blank.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: blank }, uOpacity: { value: 0 }, uLight: { value: new THREE.Vector2(0, 0) }, uWide: { value: wide } },
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG,
    transparent: true,
    depthWrite: false,
  });
  // For ringed Saturn the plane is wider than the disc (rings extend past it).
  const planet = new THREE.Mesh(new THREE.PlaneGeometry(planetRadius * 2 * wide, planetRadius * 2), material);
  group.add(planet);
  return { group, ring, planet, orbitRadius, angle: 0, color };
}

function buildStarPoints(count, size, opacity, colorHex) {
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
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: colorHex, size, transparent: true, opacity, sizeAttenuation: true }));
}

// Three layered star fields (dense/dim, mid, sparse/bright) instead of one
// uniform field -- reads as genuine depth in a starfield rather than a flat
// scatter of identical dots. The bright layer also gets a gentle twinkle
// (opacity oscillation) in the render loop below.
function buildStarfield(darkMode = true) {
  const group = new THREE.Group();
  // Warm gold/cream tones in light mode instead of cool white/blue --
  // plain white specks read as noise/snow against a bright orange sky,
  // gold flecks read as sunlit sparkle instead.
  const dim = buildStarPoints(2600, 0.16, darkMode ? 0.45 : 0.35, darkMode ? 0xffffff : 0xffdca0);
  const mid = buildStarPoints(700, 0.32, darkMode ? 0.7 : 0.55, darkMode ? 0xcfe0ff : 0xffc978);
  const bright = buildStarPoints(70, 0.75, darkMode ? 0.9 : 0.75, darkMode ? 0xffffff : 0xfff2d6);
  group.add(dim, mid, bright);
  return { group, dim, mid, bright };
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

// Matches THREE.SphereGeometry's own UV convention (phi = u * 2π, u=0.5 at
// the texture's center seam) so lat/lon placed here line up with where the
// equirectangular earth_map.jpg actually paints that location.
function latLonToVector3(radius, latDeg, lonDeg) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon)
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
 * right of the viewport so it never sits under the headline column) textured
 * with a real photographic Earth map, plus orbit/flight-path trails, a
 * starfield, and real markers on the globe surface for each entry in
 * `markers` ({ color, label, lat, lon }). Each marker gets a floating HTML
 * label (like the reference site's country-name pills) that fades in only
 * while that marker is rotated toward the camera. Hovering anywhere on the
 * globe also shows the real country name under the cursor (point-in-polygon
 * lookup against Natural Earth boundaries). The globe auto-rotates, pulls
 * back on scroll, and can be dragged with the cursor (mouse/touch) to spin
 * it manually, with momentum on release.
 */
export default function Globe3D({ scrollContainerId, markers = [], darkMode = true }) {
  const mountRef = useRef(null);
  const markersKey = markers.map(m => `${m.color}${m.label}${m.lat}${m.lon}`).join(',');
  // Persists across the effect re-running (the GDACS live-marker fetch
  // resolving after mount changes `markersKey`, which re-triggers this
  // whole effect) so the intro plays exactly once per real page load,
  // not a second time once real marker data replaces the fallback pins.
  const introPlayedRef = useRef(false);

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

    // Globe body — real photographic Earth imagery (three.js's own bundled
    // NASA-imagery example texture, a standard equirectangular map with the
    // prime meridian at the texture's horizontal center) instead of the
    // dot-matrix look used earlier this session. latLonToVector3 below is
    // derived from THREE.SphereGeometry's own UV formula so markers/hover
    // line up with what the texture actually paints at that lat/lon.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshBasicMaterial({ color: darkMode ? 0x050b16 : 0xf3ddb2 })
    );
    planetGroup.add(globe);

    let earthTexture = null;
    if (darkMode) {
      new THREE.TextureLoader().load('/earth_map.jpg', tex => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        earthTexture = tex;
        globe.material.map = tex;
        globe.material.color.set(0xffffff);
        globe.material.needsUpdate = true;
      });
    } else {
      // Ocean gets screen-blended to light blue (a plain multiply can't
      // lighten near-black deep-ocean pixels at all); land is darkened
      // slightly instead of left untouched. Two earlier classifiers both
      // failed on this specific texture: luminance alone (dark rainforest
      // canopy is just as dark as deep ocean) and simple blue-dominance
      // (this "earth_atmos" texture has an atmospheric blue haze that
      // shifts ALL dark pixels -- forest included -- toward blue, so
      // plain "b > r" still misclassified the Amazon/Congo/Siberia as
      // ocean). Verified against real sampled pixels: true ocean is
      // [~25,~35,~60] (g meaningfully above r, and a big r->g->b climb);
      // hazy dark forest is [~32,~35,~52] (g roughly equal to r). The
      // g-r gap is what actually separates them, not raw blueness.
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const screen = (base, tint) => 255 - ((255 - base) * (255 - tint)) / 255;
        const OCEAN = [150, 205, 235];
        const LAND_DARKEN = 0.78;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const isOcean = b > r + 6 && b > g + 2;
          if (isOcean) {
            d[i] = screen(r, OCEAN[0]);
            d[i + 1] = screen(g, OCEAN[1]);
            d[i + 2] = screen(b, OCEAN[2]);
          } else {
            d[i] = r * LAND_DARKEN;
            d[i + 1] = g * LAND_DARKEN;
            d[i + 2] = b * LAND_DARKEN;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        earthTexture = tex;
        globe.material.map = tex;
        globe.material.color.set(0xffffff);
        globe.material.needsUpdate = true;
      };
      img.src = '/earth_map.jpg';
    }

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
        border: none; white-space: nowrap; pointer-events: none;
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

    // Single decorative equatorial orbit ring, tilted enough to read
    // clearly as an ellipse rather than a near-edge-on line. Child of
    // `globe` (not `planetGroup`) so drag-to-rotate -- which only touches
    // globe.rotation -- carries the ring along with it, instead of it
    // sitting still while the dots/markers/arcs spin underneath.
    const orbitGroup = new THREE.Group();
    orbitGroup.add(buildOrbitRing(13.5, 1.05, 0.35, 0xff8a3d));
    globe.add(orbitGroup);

    // Starfield stays centered on the whole viewport, not offset with the planet.
    const { group: stars, bright: brightStars } = buildStarfield(darkMode);
    scene.add(stars);

    // Sun + the other seven planets, parked well behind and to the side of
    // Earth so pulling the camera back (the zoom-out gesture below) brings
    // the whole system into frame alongside a shrinking Earth, selling
    // "you were looking at one planet in a solar system all along". Lives
    // directly in `scene` (not `planetGroup`) so it doesn't inherit
    // Earth's own mouse-tilt/drag rotation. rotation.x tilts the whole
    // thing so the flat orbit rings/planet paths read as ellipses seen at
    // an angle rather than edge-on lines, same trick as the equatorial
    // ring around Earth itself, and echoing the angled top-down look of
    // the reference "solar system at real scale" reveal shots.
    const planetQuat = new THREE.Quaternion();
    const planetWorld = new THREE.Vector3();
    const sunWorld = new THREE.Vector3();
    const solarGroup = new THREE.Group();
    solarGroup.position.set(planetGroup.position.x - 20, planetGroup.position.y + 10, -230);
    solarGroup.rotation.x = 1.15;
    scene.add(solarGroup);
    const sun = buildSun(15);
    solarGroup.add(sun.group);
    // Orbit radius / planet size / color roughly ordered like the real
    // solar system (not to real relative scale -- Jupiter/Saturn sized up
    // for a readable silhouette); Earth's own slot (~40) is intentionally
    // left as a gap since the real textured globe sits near there already.
    const solarPlanets = [
      buildOrbitPlanet(22, 1.7, 0x9c9c94), // Mercury
      buildOrbitPlanet(29, 2.6, 0xe0c088), // Venus
      buildOrbitPlanet(48, 2.1, 0xc1440e), // Mars
      buildOrbitPlanet(62, 7.8, 0xd8ae82), // Jupiter
      buildOrbitPlanet(80, 6.4, 0xead6a8, { wide: 900 / 368 }), // Saturn (photo includes rings)
      buildOrbitPlanet(96, 4.4, 0xace5ee), // Uranus
      buildOrbitPlanet(110, 4.2, 0x3f5efb), // Neptune
    ];
    // Staggered (not random) starting angles, fanned out on roughly the
    // same side of the sun -- reads as a clean line-up at first glance
    // (closer to the reference "solar system" reveal shot) rather than
    // planets scattered arbitrarily around their orbits, while the render
    // loop's per-frame angle update still lets them drift naturally after.
    solarPlanets.forEach((p, i) => { p.angle = -0.12 * i; solarGroup.add(p.group); });

    // Real NASA-imagery equirectangular texture maps for the seven other
    // planets (same open-source-bundled asset family as the Earth globe's
    // own /earth_map.jpg), loaded async and swapped in once ready --
    // replaces the flat placeholder color set in buildOrbitPlanet above.
    const planetTextureLoader = new THREE.TextureLoader();
    const loadPhoto = (url, apply) => {
      planetTextureLoader.load(url, tex => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        apply(tex);
      });
    };
    ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].forEach((name, i) =>
      loadPhoto(`/solar/${name}.webp`, tex => { solarPlanets[i].planet.material.uniforms.uMap.value = tex; }));
    loadPhoto('/solar/sun.webp', tex => { sun.core.material.map = tex; sun.core.material.needsUpdate = true; });

    // Hover targets + display names for the sun/planet name label below --
    // tagged via userData rather than a parallel lookup array so the
    // raycast hit can read its own name directly.
    const PLANET_NAMES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    sun.core.userData.label = 'The Sun';
    solarPlanets.forEach((p, i) => { p.planet.userData.label = PLANET_NAMES[i]; });
    const planetHoverTargets = [sun.core, ...solarPlanets.map(p => p.planet)];

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

    // ── Mouse-follow tilt — passive rotation of the whole planet group
    // (separate from the globe's own auto-spin/drag rotation) that eases
    // toward the cursor position, suspended while actively dragging. Kept
    // to a subtle +-0.35rad range on both axes -- a full 360deg swing was
    // tried and reverted, it read as too much motion for a passive nudge.
    let targetTiltX = 0, targetTiltY = 0;
    const onMouseTilt = (e) => {
      if (dragging) return;
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.35;
      targetTiltX = THREE.MathUtils.clamp(-ny, -1, 1) * 0.35;
    };
    // Ease back to the default aligned axis (0, 0) once the cursor leaves
    // the hero -- without this the globe just stayed wherever the last
    // mousemove left it, even with no one actually pointing at it anymore.
    const onMouseTiltLeave = () => { targetTiltX = 0; targetTiltY = 0; hovering = false; };
    let hovering = false;
    const onMouseEnter = () => { hovering = true; };
    mount.addEventListener('mousemove', onMouseTilt);
    mount.addEventListener('mouseleave', onMouseTiltLeave);
    mount.addEventListener('mouseenter', onMouseEnter);

    // ── Zoom-out gesture — pinch-zoom on a trackpad (Chrome reports this as
    // a wheel event with ctrlKey set) or Ctrl+scroll on a mouse pulls the
    // camera back to reveal the sun and two more planets behind Earth.
    // Gated behind ctrlKey specifically so plain scrolling over the hero
    // still scrolls the page normally instead of being hijacked.
    // ── Opening intro — start already fully zoomed out on the solar
    // system (not eased in from Earth first), hold briefly, then zoom
    // into Earth, once per real page load. `shouldPlayIntro` is computed
    // once per effect invocation and only ever read here -- the actual
    // "has it played" flag is set later, from inside the hold timer, so
    // React StrictMode's dev-only mount->cleanup->mount double-invoke
    // can't have its throwaway first run claim the intro played and
    // leave the real, kept run thinking it should skip it (the
    // throwaway run's cleanup cancels its timer before that ever fires).
    const shouldPlayIntro = !introPlayedRef.current;
    let zoomTarget = shouldPlayIntro ? 1 : 0;
    let zoomLevel = shouldPlayIntro ? 1 : 0;
    const onWheelZoom = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoomTarget = THREE.MathUtils.clamp(zoomTarget + e.deltaY * 0.0025, 0, 1);
    };
    mount.addEventListener('wheel', onWheelZoom, { passive: false });

    const introTimers = [];
    if (shouldPlayIntro) {
      introTimers.push(setTimeout(() => {
        if (cancelled) return;
        introPlayedRef.current = true;
        zoomTarget = 0;
      }, 2200));
    }

    // Small discoverability hint for the gesture above -- otherwise nothing
    // on screen suggests it exists. Only shown while hovering the globe and
    // still fully zoomed in.
    const hintEl = document.createElement('div');
    hintEl.textContent = 'Ctrl + scroll to zoom out';
    hintEl.style.cssText = `
      position: absolute; right: 14px; bottom: 14px; color: rgba(255,255,255,0.5);
      font-size: 11px; font-weight: 600; letter-spacing: 0.03em; pointer-events: none;
      transition: opacity 0.3s ease; opacity: 0; z-index: 2;
    `;
    mount.appendChild(hintEl);

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
      brightStars.material.opacity = 0.75 + 0.2 * Math.sin(elapsed * 1.3);

      planetGroup.rotation.x += (targetTiltX - planetGroup.rotation.x) * 0.05;
      planetGroup.rotation.y += (targetTiltY - planetGroup.rotation.y) * 0.05;

      arcs.forEach(a => {
        const t = (elapsed * a.speed + a.phase) % 1;
        a.curve.getPoint(t, a.particle.position);
      });

      zoomLevel += (zoomTarget - zoomLevel) * 0.06;
      hintEl.style.opacity = (hovering && zoomLevel < 0.05) ? '1' : '0';

      planetGroup.scale.setScalar(1.35 - zoomLevel * 0.85);
      const sunFade = zoomLevel;
      sun.core.material.opacity = Math.min(1, sunFade * 1.3);
      sun.group.getWorldQuaternion(planetQuat).invert().multiply(camera.quaternion);
      sun.core.quaternion.copy(planetQuat);
      sun.halos.forEach((h, i) => { h.material.opacity = sunFade * (0.5 - i * 0.15); });
      solarPlanets.forEach(p => {
        // Rough Keplerian feel: closer orbits move visibly faster than
        // farther ones, instead of every planet crawling at the same rate.
        p.angle += dt * (1.6 / Math.sqrt(p.orbitRadius));
        p.planet.position.set(Math.cos(p.angle) * p.orbitRadius, Math.sin(p.angle) * p.orbitRadius, 0);
        p.planet.material.uniforms.uOpacity.value = sunFade;
        p.ring.material.opacity = sunFade * 0.35;
        // face the camera, and point the shading toward the sun on screen
        p.group.getWorldQuaternion(planetQuat).invert().multiply(camera.quaternion);
        p.planet.quaternion.copy(planetQuat);
        p.planet.getWorldPosition(planetWorld).project(camera);
        sun.group.getWorldPosition(sunWorld).project(camera);
        const lx = (sunWorld.x - planetWorld.x) * camera.aspect;
        const ly = sunWorld.y - planetWorld.y;
        const ll = Math.hypot(lx, ly) || 1;
        p.planet.material.uniforms.uLight.value.set(lx / ll, ly / ll);
      });

      camera.position.z = 34 + scrollProgress * 18 + zoomLevel * 150;
      camera.position.y = -scrollProgress * 6 - zoomLevel * 12;
      camera.lookAt(planetGroup.position.x * 0.4 * (1 - zoomLevel * 0.7), 0, -zoomLevel * 100);
      // Widen the field of view as the zoom-out progresses so the whole
      // system (Neptune's orbit is ~110 units out) actually fits in frame
      // at max zoom, instead of pulling the camera back so far that
      // Earth/the sun shrink to near-invisible dots just to include the
      // outer orbit rings. (First pass pulled the camera back much
      // farther *and* widened the FOV a lot -- the two compounded and
      // shrank everything to tiny specks; this is a smaller nudge on both.)
      const targetFov = 45 + zoomLevel * 10;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
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
        let name = null;
        // Only worth testing the sun/planets once they're actually
        // visible/faded in -- at zoomLevel 0 they're invisible, tiny
        // placeholder-colored spheres sitting behind the hero content, and
        // raycasting them there would pop up a name label with nothing
        // for it to point at.
        if (zoomLevel > 0.12) {
          const planetHit = countryRaycaster.intersectObjects(planetHoverTargets, false)[0];
          if (planetHit) name = planetHit.object.userData.label;
        }
        if (!name) {
          const hit = countryRaycaster.intersectObject(globe, false)[0];
          if (hit && countries.length > 0) {
            hitPointLocal.copy(hit.point);
            globe.worldToLocal(hitPointLocal);
            const r = hitPointLocal.length();
            const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(hitPointLocal.y / r, -1, 1)));
            const lon = THREE.MathUtils.radToDeg(Math.atan2(-hitPointLocal.z, hitPointLocal.x));
            name = findCountryAt(countries, lon, lat);
          }
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
      introTimers.forEach(clearTimeout);
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
      mount.removeEventListener('mouseleave', onMouseTiltLeave);
      mount.removeEventListener('mouseenter', onMouseEnter);
      mount.removeEventListener('wheel', onWheelZoom);
      mount.removeEventListener('mousemove', onCountryHoverMove);
      mount.removeEventListener('mouseleave', onCountryHoverLeave);
      mount.removeChild(renderer.domElement);
      labelEls.forEach(el => el.remove());
      countryLabelEl.remove();
      hintEl.remove();
      earthTexture?.dispose();
      const disposables = [globe, ...stars.children, ...orbitGroup.children, sun.core, ...sun.halos];
      arcs.forEach(a => { disposables.push(a.line, a.particle); });
      solarPlanets.forEach(p => { disposables.push(p.ring, p.planet); });
      globe.children.forEach(child => { child.children.forEach(c => disposables.push(c)); });
      disposables.forEach(obj => {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => { m?.map?.dispose(); m?.dispose(); });
      });
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerId, markersKey, darkMode]);

  return <div ref={mountRef} style={{
    position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
    maskImage: 'linear-gradient(to right, transparent 0%, transparent 22%, black 34%)',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 22%, black 34%)',
  }} aria-hidden="true" />;
}

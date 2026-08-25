import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Reusable atmosphere-glow fresnel shader — cheap approximation of the
// reference site's sunlit-limb look: warm orange near the top of the sphere
// fading to cool blue toward the bottom, blended by object-space Y so the
// "light direction" stays fixed in place while the globe spins underneath it.
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
  void main() {
    float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    float t = smoothstep(-8.0, 4.0, vPosition.y);
    vec3 glowColor = mix(bottomColor, topColor, t);
    gl_FragColor = vec4(glowColor, intensity);
  }
`;

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
  dctx.fillStyle = '#bcd4ff';
  const step = 6;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const idx = (y * W + x) * 4;
      if (landData[idx + 3] > 128) {
        const jx = x + (Math.random() - 0.5) * 1.5;
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
  const markersKey = markers.map(m => m.color + m.label).join(',');

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
    planetGroup.position.x = 25;
    planetGroup.scale.setScalar(1.3);
    scene.add(planetGroup);

    // Globe body — mostly-dark sphere, matching the reference's night-side look.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x050b16 })
    );
    planetGroup.add(globe);

    // Dot-matrix world map shell — filled in asynchronously once the real
    // land geometry loads (see fetch below); starts blank so nothing pops.
    const dotEarth = new THREE.Mesh(
      new THREE.SphereGeometry(10.03, 64, 64),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
    );
    globe.add(dotEarth);

    let dotTexture = null;
    fetch('/world-land.geojson')
      .then(r => r.json())
      .then(geojson => {
        if (cancelled) return;
        dotTexture = rasterizeLandToDots(geojson);
        dotEarth.material.map = dotTexture;
        dotEarth.material.needsUpdate = true;
      })
      .catch(() => { /* decorative only — fine to skip if it fails to load */ });

    // Real disaster-type markers on the globe surface, spread across
    // different hemispheres so rotation reveals them one at a time.
    const markerLatLon = [
      [24, -20], [-18, 60], [34, 140],
    ];
    const labelEls = [];
    const markerObjs = markers.slice(0, markerLatLon.length).map((m, i) => {
      const [lat, lon] = markerLatLon[i];
      const { group, halo, localPos } = buildMarker(10.15, lat, lon, m.color);
      globe.add(group);

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

    // Atmosphere glow shell (fresnel rim light), warm at the top fading to
    // cool blue at the bottom -- additive-blended, matching the reference's
    // sunlit-limb globe rather than a flat single-color glow.
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(10.6, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms: {
          topColor: { value: new THREE.Color(0xffab5c) },
          bottomColor: { value: new THREE.Color(0x2f6bff) },
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      })
    );
    planetGroup.add(glow);

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
      stars.rotation.y += dt * 0.005;

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
      mount.removeChild(renderer.domElement);
      labelEls.forEach(el => el.remove());
      dotTexture?.dispose();
      const disposables = [globe, dotEarth, glow, stars];
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
    maskImage: 'linear-gradient(to right, transparent 0%, transparent 36%, black 54%)',
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 36%, black 54%)',
  }} aria-hidden="true" />;
}

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Reusable atmosphere-glow fresnel shader — cheap approximation of the
// "blue-glowing planet" look without a full PBR/atmospheric-scattering pass.
const GLOW_VERTEX = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GLOW_FRAGMENT = `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
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

function buildOrbitRing(radius, tiltX, tiltZ, color) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(128).map(p => new THREE.Vector3(p.x, p.y, 0));
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const ring = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }));
  ring.rotation.x = tiltX;
  ring.rotation.z = tiltZ;
  return ring;
}

// Rough continent outlines (lon, lat degrees) — stylized, not survey-accurate.
// Good enough to read as "the world" once rasterized into a dot pattern, which
// is the actual reference look (a stippled dot-matrix map on the sphere, not
// a photographic earth texture).
const CONTINENTS = [
  [[-165, 70], [-70, 70], [-52, 60], [-60, 45], [-80, 25], [-97, 18], [-115, 32], [-125, 49], [-140, 60], [-165, 70]], // N. America
  [[-80, 10], [-35, -5], [-35, -20], [-58, -38], [-73, -45], [-75, -20], [-80, 10]], // S. America
  [[-17, 20], [35, 32], [45, 12], [40, -25], [15, -35], [10, -5], [-10, 10], [-17, 20]], // Africa
  [[-10, 45], [10, 55], [30, 58], [40, 45], [20, 38], [0, 38], [-10, 45]], // Europe
  [[35, 45], [60, 55], [100, 65], [140, 60], [145, 35], [120, 20], [95, 10], [70, 10], [60, 25], [45, 30], [35, 45]], // Asia
  [[113, -12], [135, -12], [153, -25], [145, -38], [130, -32], [115, -22], [113, -12]], // Australia
];

// Rasterizes CONTINENTS into an equirectangular dot-matrix canvas texture —
// this is what actually reads as "a map" on the rotating sphere.
function buildDotEarthTexture() {
  const W = 1024, H = 512;
  const landCanvas = document.createElement('canvas');
  landCanvas.width = W; landCanvas.height = H;
  const lctx = landCanvas.getContext('2d');
  lctx.fillStyle = '#fff';
  const toXY = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  CONTINENTS.forEach(poly => {
    lctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const [x, y] = toXY(lon, lat);
      i === 0 ? lctx.moveTo(x, y) : lctx.lineTo(x, y);
    });
    lctx.closePath();
    lctx.fill();
  });
  const landData = lctx.getImageData(0, 0, W, H).data;

  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = W; dotCanvas.height = H;
  const dctx = dotCanvas.getContext('2d');
  dctx.fillStyle = '#bcd4ff';
  const step = 7;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const idx = (y * W + x) * 4;
      if (landData[idx + 3] > 128) {
        const jx = x + (Math.random() - 0.5) * 2;
        const jy = y + (Math.random() - 0.5) * 2;
        dctx.beginPath();
        dctx.arc(jx, jy, 1.1, 0, Math.PI * 2);
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
 * Full-bleed animated hero background: a rotating globe (offset toward the
 * right side of the viewport) with a dot-matrix continent texture, orbit
 * shipping-route trails, a starfield, and real markers on the globe surface
 * for each entry in `markers` ({ color, label }). Each marker gets a
 * floating HTML label (like the reference site's country-name pills) that
 * fades in only while that marker is rotated toward the camera. Camera
 * pulls back on scroll. Renders behind the hero's real DOM content.
 */
export default function Globe3D({ scrollContainerId, markers = [] }) {
  const mountRef = useRef(null);
  const markersKey = markers.map(m => m.color + m.label).join(',');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(0, 0, 34);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Everything planet-related lives in one group, offset to the right so
    // the globe sits beside the headline column rather than behind it.
    const planetGroup = new THREE.Group();
    planetGroup.position.x = 9;
    scene.add(planetGroup);

    // Globe body — mostly-dark sphere, matching the reference's night-side look.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x050b16 })
    );
    planetGroup.add(globe);

    // Dot-matrix continent map, laid over the sphere as a slightly larger,
    // additively-blended shell so the dots glow instead of looking flat.
    const dotTexture = buildDotEarthTexture();
    const dotEarth = new THREE.Mesh(
      new THREE.SphereGeometry(10.03, 64, 64),
      new THREE.MeshBasicMaterial({ map: dotTexture, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
    );
    globe.add(dotEarth);

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

    // Atmosphere glow shell (fresnel rim light), additive-blended.
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(10.6, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms: { glowColor: { value: new THREE.Color(0x2f6bff) } },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      })
    );
    planetGroup.add(glow);

    // A second, tighter warm rim to echo the reference's orange edge light.
    const warmRim = new THREE.Mesh(
      new THREE.SphereGeometry(10.15, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms: { glowColor: { value: new THREE.Color(0xff8a3d) } },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      })
    );
    warmRim.scale.set(1.001, 1.001, 1.001);
    planetGroup.add(warmRim);

    const orbitGroup = new THREE.Group();
    orbitGroup.add(buildOrbitRing(14, Math.PI / 2.3, 0.4, 0xff8a3d));
    orbitGroup.add(buildOrbitRing(16.5, Math.PI / 2.1, -0.6, 0xff8a3d));
    orbitGroup.add(buildOrbitRing(12.5, Math.PI / 2.6, 1.1, 0x4a86ff));
    planetGroup.add(orbitGroup);

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

    const clock = new THREE.Clock();
    const worldPos = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    let elapsed = 0;

    const animate = () => {
      const dt = clock.getDelta();
      elapsed += dt;
      globe.rotation.y += dt * (0.09 + scrollProgress * 0.4);
      orbitGroup.rotation.y += dt * 0.03;
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
      raf = requestAnimationFrame(animate);
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
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      mount.removeChild(renderer.domElement);
      labelEls.forEach(el => el.remove());
      dotTexture.dispose();
      const disposables = [globe, dotEarth, glow, warmRim, stars, ...orbitGroup.children];
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

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }} aria-hidden="true" />;
}

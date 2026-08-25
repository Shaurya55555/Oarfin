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

// Marker dot + soft glow halo, placed on the sphere surface via spherical
// coordinates so it rotates naturally with the globe as a child of it.
function buildMarker(radius, latDeg, lonDeg, colorHex) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const pos = new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon)
  );

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

  return { group, halo };
}

/**
 * Full-bleed animated hero background: a glowing globe (offset toward the
 * right side of the viewport, out of the way of the headline column) with
 * orbit-trail rings, a starfield, and real markers on the globe surface for
 * each entry in `markers` ({ color, label }) — rotating with the globe.
 * Camera pulls back on scroll. Renders behind the hero's real DOM content.
 */
export default function Globe3D({ scrollContainerId, markers = [] }) {
  const mountRef = useRef(null);
  const markersKey = markers.map(m => m.color).join(',');

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

    // Real disaster-type markers on the globe surface, evenly spread and
    // rotating with it (children of `globe`, not the outer group).
    const markerFallbackLatLon = [
      [18, -40], [-8, 25], [32, 95],
    ];
    const markerObjs = markers.slice(0, markerFallbackLatLon.length).map((m, i) => {
      const [lat, lon] = markerFallbackLatLon[i];
      const { group, halo } = buildMarker(10.15, lat, lon, m.color);
      globe.add(group);
      return { halo };
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
    let elapsed = 0;
    const animate = () => {
      const dt = clock.getDelta();
      elapsed += dt;
      globe.rotation.y += dt * (0.09 + scrollProgress * 0.4);
      orbitGroup.rotation.y += dt * 0.03;
      stars.rotation.y += dt * 0.005;

      markerObjs.forEach((m, i) => {
        const pulse = 0.85 + 0.25 * Math.sin(elapsed * 2 + i * 2);
        m.halo.scale.setScalar(pulse);
      });

      camera.position.z = 34 + scrollProgress * 18;
      camera.position.y = -scrollProgress * 6;
      camera.lookAt(planetGroup.position.x * 0.4, 0, 0);

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
      const disposables = [globe, glow, warmRim, stars, ...orbitGroup.children];
      globe.children.forEach(markerGroup => markerGroup.children.forEach(c => disposables.push(c)));
      disposables.forEach(obj => {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material?.dispose();
      });
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerId, markersKey]);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true" />;
}

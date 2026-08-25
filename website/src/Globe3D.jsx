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

/**
 * Full-bleed animated hero background: a glowing globe with orbit-trail
 * rings and a starfield, rotating slowly and responding to page scroll
 * (rotation speeds up + camera pulls back as the hero scrolls out of view).
 * Renders behind the hero's real content (headline, CTAs, live incident
 * panel) which stays in normal DOM flow on top of this canvas.
 */
export default function Globe3D({ scrollContainerId }) {
  const mountRef = useRef(null);

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

    // Globe body — mostly-dark sphere, matching the reference's night-side look.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x050b16 })
    );
    scene.add(globe);

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
    scene.add(glow);

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
    scene.add(warmRim);

    const orbitGroup = new THREE.Group();
    orbitGroup.add(buildOrbitRing(14, Math.PI / 2.3, 0.4, 0xff8a3d));
    orbitGroup.add(buildOrbitRing(16.5, Math.PI / 2.1, -0.6, 0xff8a3d));
    orbitGroup.add(buildOrbitRing(12.5, Math.PI / 2.6, 1.1, 0x4a86ff));
    scene.add(orbitGroup);

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
    const animate = () => {
      const dt = clock.getDelta();
      globe.rotation.y += dt * (0.06 + scrollProgress * 0.4);
      glow.rotation.y = globe.rotation.y;
      warmRim.rotation.y = globe.rotation.y;
      orbitGroup.rotation.y += dt * 0.03;
      stars.rotation.y += dt * 0.005;

      camera.position.z = 34 + scrollProgress * 18;
      camera.position.y = -scrollProgress * 6;
      camera.lookAt(0, 0, 0);

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
      [globe, glow, warmRim, stars, ...orbitGroup.children].forEach(obj => {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material?.dispose();
      });
      renderer.dispose();
    };
  }, [scrollContainerId]);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true" />;
}

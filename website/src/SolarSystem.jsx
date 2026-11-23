import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Orbit map ported from the portfolio site: the sun in the middle, the eight
// planets on elliptical orbits in real order, inner worlds moving faster
// (Kepler), each planet shaded on the side facing away from the sun.
// Images are NASA / ESA photographs (via Wikimedia Commons).

const BODIES = [
  { key: 'mercury', name: 'Mercury', n: '01', ring: 0.26, size: 0.5, a0: 0.4 },
  { key: 'venus', name: 'Venus', n: '02', ring: 0.38, size: 0.85, a0: 2.6 },
  { key: 'earth', name: 'Earth', n: '03', ring: 0.5, size: 0.9, a0: 4.9, home: true },
  { key: 'mars', name: 'Mars', n: '04', ring: 0.62, size: 0.65, a0: 1.3 },
  { key: 'jupiter', name: 'Jupiter', n: '05', ring: 0.75, size: 2.0, a0: 3.7 },
  { key: 'saturn', name: 'Saturn', n: '06', ring: 0.87, size: 1.6, a0: 5.7, wide: 2.45 },
  { key: 'uranus', name: 'Uranus', n: '07', ring: 0.96, size: 1.2, a0: 0.9 },
  { key: 'neptune', name: 'Neptune', n: '08', ring: 1, size: 1.15, a0: 3.2 },
];

const COPY = {
  en: { eyebrow: 'Our solar system', title: 'One planet worth protecting', body: 'Oarfin watches live disasters on Earth, the only world with people on it.', hint: 'Hover a planet', home: 'Home. Where Oarfin keeps people safe.', planet: 'Planet' },
  hi: { eyebrow: 'हमारा सौरमंडल', title: 'एक ग्रह, जिसकी रक्षा ज़रूरी है', body: 'Oarfin पृथ्वी पर लाइव आपदाओं पर नज़र रखता है, जो इंसानों वाला एकमात्र ग्रह है।', hint: 'किसी ग्रह पर होवर करें', home: 'हमारा घर। यहीं Oarfin लोगों को सुरक्षित रखता है।', planet: 'ग्रह' },
};

const RINGS = BODIES.map((b) => b.ring);

export default function SolarSystem({ lang = 'English' }) {
  const t = COPY[lang === 'Hindi' ? 'hi' : 'en'];
  const box = useRef(null);
  const els = useRef([]);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);
  const hoverRef = useRef(null);
  const angles = useRef(BODIES.map((b) => b.a0));
  hoverRef.current = hover;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDim({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDim({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const wide = dim.w >= 768;
  const cx = dim.w * (wide ? 0.7 : 0.5);
  const cy = dim.h * (wide ? 0.52 : 0.7);
  const rx = wide ? Math.min(dim.w * 0.27, 560) : dim.w * 0.44;
  const ry = rx * (wide ? 0.42 : 0.5);
  const unit = wide ? 38 : 21;
  const px = (b) => Math.max(wide ? 30 : 22, Math.round(unit * b.size));
  const sun = wide ? 112 : 58;

  useEffect(() => {
    if (!dim.w) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();
    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const paused = hoverRef.current !== null;
      BODIES.forEach((b, i) => {
        if (!still && !paused) angles.current[i] += dt * 0.0597 * Math.pow(b.ring, -1.5);
        const a = angles.current[i];
        const x = cx + Math.cos(a) * rx * b.ring;
        const y = cy + Math.sin(a) * ry * b.ring;
        const depth = (Math.sin(a) + 1) / 2; // 1 = in front
        const s = 0.88 + depth * 0.24;
        const el = els.current[i];
        if (el) {
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
          el.style.zIndex = String(Math.round(depth * 10) + 1);
          const dx = cx - x;
          const dy = cy - y;
          const len = Math.hypot(dx, dy) || 1;
          el.style.setProperty('--sx', `${(dx / len) * 30}%`);
          el.style.setProperty('--sy', `${(dy / len) * 30}%`);
          el.dataset.x = String(x);
          el.dataset.y = String(y);
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw(last);
    return () => cancelAnimationFrame(raf);
  }, [dim.w, dim.h, cx, cy, rx, ry]);

  const h = hover !== null ? BODIES[hover] : null;

  return (
    <section
      id="solar-section"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: wide ? 640 : 560,
        background: 'radial-gradient(ellipse at 70% 55%, #0c1024 0%, #05060f 50%, #000 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ position: 'relative', zIndex: 3, maxWidth: 1200, margin: '0 auto', padding: wide ? '5rem 2rem 0' : '3rem 1.25rem 0', pointerEvents: 'none' }}>
        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{t.eyebrow}</p>
        <h2 style={{ color: '#fff', fontSize: wide ? '2.4rem' : '1.7rem', fontWeight: 800, lineHeight: 1.1, margin: '0.6rem 0 0.8rem', maxWidth: wide ? 420 : 300 }}>{t.title}</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0, maxWidth: wide ? 380 : 300 }}>{t.body}</p>
      </div>

      <div ref={box} aria-label="The solar system" style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
        {dim.w > 0 && (
          <>
            <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {RINGS.map((r) => (
                <ellipse key={r} cx={cx} cy={cy} rx={rx * r} ry={ry * r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              ))}
            </svg>

            {/* the sun: soft corona behind a photographed disc */}
            <div aria-hidden style={{ position: 'absolute', left: cx, top: cy, width: sun, height: sun, transform: 'translate(-50%,-50%)' }}>
              <div
                style={{
                  position: 'absolute', left: '50%', top: '50%', borderRadius: '50%',
                  width: sun * 4.2, height: sun * 4.2, transform: 'translate(-50%,-50%)',
                  background: 'radial-gradient(circle, rgba(255,190,110,0.55) 0%, rgba(255,150,60,0.28) 22%, rgba(255,120,40,0.1) 40%, transparent 62%)',
                }}
              />
              <img src="/solar/sun.webp" alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', userSelect: 'none', boxShadow: '0 0 40px 8px rgba(255,150,60,0.6)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, transparent 55%, rgba(120,30,0,0.55) 100%)' }} />
            </div>

            {BODIES.map((b, i) => {
              const size = px(b);
              return (
                <button
                  key={b.key}
                  ref={(el) => { els.current[i] = el; }}
                  type="button"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover((c) => (c === i ? null : c))}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover((c) => (c === i ? null : c))}
                  aria-label={b.name}
                  style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, padding: 0, border: 'none', background: 'none', cursor: 'default', outline: 'none', willChange: 'transform' }}
                >
                  <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%', transition: 'transform 0.2s', transform: hover === i ? 'scale(1.25)' : 'none' }}>
                    <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                      <img
                        src={`/solar/${b.key}.webp`}
                        alt=""
                        draggable={false}
                        style={b.wide
                          ? { position: 'absolute', left: '50%', top: '50%', maxWidth: 'none', width: `${b.wide * 100}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none', userSelect: 'none' }
                          : { width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }}
                      />
                    </span>
                    <span
                      aria-hidden
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle at calc(50% + var(--sx, 0%)) calc(50% + var(--sy, 0%)), transparent 32%, rgba(0,0,0,0.78) 82%)' }}
                    />
                    {b.home && (
                      <span aria-hidden style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '1.5px solid rgba(91,143,255,0.85)', boxShadow: '0 0 14px rgba(91,143,255,0.7)', pointerEvents: 'none' }} />
                    )}
                  </span>
                  {wide && (
                    <span
                      style={{
                        position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                        marginTop: b.key === 'saturn' ? size * 0.25 + 4 : 4, fontFamily: 'ui-monospace, monospace', fontSize: 8,
                        letterSpacing: '0.14em', textTransform: 'uppercase', color: hover === i ? '#fff' : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {b.name}
                    </span>
                  )}
                </button>
              );
            })}

            {h && (
              <div
                style={{
                  position: 'absolute', zIndex: 20, width: 220, padding: '0.85rem', borderRadius: 12, pointerEvents: 'none',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                  left: Math.min(Math.max(Number(els.current[hover]?.dataset.x ?? cx) - 110, 8), dim.w - 228),
                  top: Math.max(8, Number(els.current[hover]?.dataset.y ?? cy) - px(h) - 80),
                }}
              >
                <p style={{ margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff' }}>
                  {t.planet} {h.n} · {h.name}
                </p>
                {h.home && <p style={{ margin: '0.4rem 0 0', fontSize: 13, lineHeight: 1.4, color: '#fff' }}>{t.home}</p>}
              </div>
            )}

            {wide && (
              <p style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                {t.hint}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

import { useState } from 'react';

// Public safety videos, grouped by hazard. Every entry was checked against
// YouTube (it exists and is public) and comes from an official agency where
// one was available: NDMA, NIDM and MoES/INCOIS in India, plus UNDRR, CDC and
// Indian news channels. Thumbnails come from YouTube's image CDN; clicking a
// card opens the video on YouTube.
const HAZARDS = [
  {
    key: 'earthquake', en: 'Earthquake', hi: 'भूकंप', icon: 'fa-house-crack',
    videos: [
      { id: 'XLrp2czggB8', title: "Do's and don'ts before, during and after an earthquake", channel: 'National Institute of Disaster Management' },
      { id: 'W3DjmIcLB-I', title: "Dos and don'ts during an earthquake", channel: 'Times of India' },
    ],
  },
  {
    key: 'flood', en: 'Flood', hi: 'बाढ़', icon: 'fa-water',
    videos: [
      { id: 'MPOEuU5cffw', title: 'Flood warning: how to protect yourself during heavy rains', channel: 'National Disaster Management Authority' },
      { id: 'WtUYQZuZ4tU', title: "Top do's and don'ts during floods", channel: 'Tips For Life' },
    ],
  },
  {
    key: 'landslide', en: 'Landslide', hi: 'भूस्खलन', icon: 'fa-mountain',
    videos: [
      { id: '-qQulxTy_bc', title: 'Floods and landslides: awareness, rescue and relief (Hindi)', channel: 'DD News' },
      { id: 'vb6cjukLA8Q', title: 'Stay alert and protect yourself from landslides and mudslides', channel: 'CDC' },
    ],
  },
  {
    key: 'drought', en: 'Drought', hi: 'सूखा', icon: 'fa-sun',
    videos: [
      { id: '28Uy2npyKv4', title: 'Socioeconomic drought management through community engagement', channel: 'National Institute of Disaster Management' },
      { id: 'iwqWiemjWeM', title: 'Flash drought: understanding risk and building resilience', channel: 'National Institute of Disaster Management' },
    ],
  },
  {
    key: 'cyclone', en: 'Cyclone', hi: 'चक्रवात', icon: 'fa-hurricane',
    videos: [
      { id: 'B9qR2e3xyJo', title: 'What to do before and during a cyclone', channel: 'National Disaster Management Authority of India' },
      { id: 'RrRQhSIwK8s', title: "How to prepare for a cyclone: dos and don'ts", channel: 'Kaumudy Global' },
    ],
  },
  {
    key: 'heatwave', en: 'Heatwave', hi: 'लू', icon: 'fa-temperature-high',
    videos: [
      { id: 'xI52AR3RTNU', title: "Do's and don'ts for travellers during a heatwave", channel: 'National Disaster Management Authority of India' },
      { id: 'igTDLHtviTk', title: "Heat wave: do's and don'ts", channel: 'Indiatimes' },
    ],
  },
  {
    key: 'tsunami', en: 'Tsunami', hi: 'सुनामी', icon: 'fa-wave-square',
    videos: [
      { id: 'idB5b33EJSg', title: 'Indian Tsunami Early Warning System (INCOIS)', channel: 'MoES, Government of India' },
      { id: 'efNMm-eMLUk', title: 'How to survive a tsunami: recognise the signs and get to safety', channel: 'UNDRR' },
    ],
  },
  {
    key: 'lightning', en: 'Lightning', hi: 'बिजली गिरना', icon: 'fa-bolt',
    videos: [
      { id: 'LzUQ1V7YjF0', title: 'How to stay safe when lightning strikes', channel: 'India Today' },
      { id: 'E3IMQ0_VeKQ', title: "India's Lightning Detection Network", channel: 'MoES, Government of India' },
    ],
  },
];

const COPY = {
  en: { title: 'Learn how to protect yourself', desc: 'Short videos from NDMA, NIDM and other trusted sources, grouped by disaster. Select a video to watch it on YouTube.', watch: 'Watch on YouTube' },
  hi: { title: 'खुद को सुरक्षित रखना सीखें', desc: 'NDMA, NIDM और अन्य भरोसेमंद स्रोतों के छोटे वीडियो, आपदा के अनुसार। देखने के लिए वीडियो चुनें।', watch: 'YouTube पर देखें' },
};

export default function SafetyVideos({ lang }) {
  const k = lang === 'Hindi' ? 'hi' : 'en';
  const c = COPY[k];
  const [active, setActive] = useState(HAZARDS[0].key);
  const hazard = HAZARDS.find((h) => h.key === active);

  return (
    <div style={{ marginTop: '2.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>{c.title}</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>{c.desc}</p>

      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {HAZARDS.map((h) => {
          const on = h.key === active;
          return (
            <button key={h.key} role="tab" aria-selected={on} onClick={() => setActive(h.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600,
                padding: '0.45rem 0.9rem', borderRadius: 999, transition: 'all 0.2s',
                border: `1px solid ${on ? 'var(--color-primary)' : 'var(--card-border)'}`,
                background: on ? 'var(--color-primary)' : 'var(--bg-card)',
                color: on ? '#fff' : 'var(--text-secondary)',
              }}>
              <i className={`fa-solid ${h.icon}`} style={{ fontSize: '0.8rem' }}></i>{h[k]}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {hazard.videos.map((v) => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
            className="card-hover"
            style={{ display: 'block', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', transition: 'background 0.4s ease' }}>
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b1020' }}>
              <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent 60%)' }}>
                <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '2px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-play" style={{ color: '#fff', fontSize: '1rem', marginLeft: 3 }}></i>
                </span>
              </span>
            </div>
            <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{v.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-brands fa-youtube" style={{ color: '#FF0000' }}></i>{v.channel}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

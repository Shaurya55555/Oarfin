import { useEffect, useState } from 'react';
import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const RADIUS_OPTIONS = [
  { label: '25 km', value: 25000 },
  { label: '50 km', value: 50000 },
  { label: '100 km', value: 100000 },
  { label: '200 km', value: 200000 },
];

const TYPE_ICONS = {
  shelter: 'fa-house', hospital: 'fa-hospital', clinic: 'fa-stethoscope',
  fire_station: 'fa-fire-extinguisher', police: 'fa-shield-halved', assembly_point: 'fa-location-dot',
  bunker: 'fa-shield', default: 'fa-map-pin',
};

const TYPE_COLORS = {
  shelter: '#1E3A5F', hospital: '#1E3A5F', clinic: '#1E3A5F',
  fire_station: '#1E3A5F', police: '#1E3A5F', assembly_point: '#1E3A5F',
  bunker: '#1E3A5F', default: '#1E3A5F',
};

const EVENT_LABELS = { EQ: 'Earthquake', FL: 'Flood', TC: 'Cyclone', VO: 'Volcano', WF: 'Wildfire', DR: 'Drought' };
const ALERT_COLORS = { Red: '#D32F2F', Orange: '#E65100', Green: '#2E7D32' };

export default function DisasterDetailPanel({ disaster, onClose, onShowShelters }) {
  const [radius, setRadius] = useState(50000);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const p = disaster?.properties || {};
  const coords = disaster?.geometry?.coordinates;
  const lat = coords?.[1];
  const lng = coords?.[0];
  const alertColor = ALERT_COLORS[p.alertlevel] || '#616161';
  const eventLabel = EVENT_LABELS[p.eventtype] || p.eventtype || 'Event';

  // Auto-fetch when disaster or radius changes
  useEffect(() => {
    if (!lat || !lng) return;
    fetchShelters(radius);
  }, [disaster, radius]);

  async function fetchShelters(r) {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${SERVER_URL}/api/shelters/nearby`, {
        params: { lat, lng, radius: r },
      });
      setShelters(res.data.shelters || []);
      setFetched(true);
      // Pass shelter markers up to map
      if (onShowShelters) onShowShelters(res.data.shelters || []);
    } catch (err) {
      setError('Could not load shelters. Check if the server is running.');
    } finally {
      setLoading(false);
    }
  }

  if (!disaster) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 340, background: '#fff', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
      zIndex: 1000, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      animation: 'slideIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .shelter-card:hover { background: #F5F7FA !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#1E3A5F', padding: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <span style={{ background: alertColor, color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 2 }}>
                {p.alertlevel?.toUpperCase() || 'ALERT'}
              </span>
              <span style={{ color: '#aac4e0', fontSize: '0.78rem' }}>{eventLabel}</span>
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
              {p.htmldescription || p.title || 'Unknown Event'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aac4e0', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0 0 0.5rem', flexShrink: 0 }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Coordinates */}
        <div style={{ marginTop: '0.6rem', display: 'flex', gap: '1rem' }}>
          <span style={{ color: '#aac4e0', fontSize: '0.75rem' }}>
            <i className="fa-solid fa-location-dot" style={{ marginRight: '0.3rem' }}></i>
            {lat?.toFixed(4)}°, {lng?.toFixed(4)}°
          </span>
          {p.eventid && (
            <span style={{ color: '#aac4e0', fontSize: '0.75rem' }}>ID: {p.eventid}</span>
          )}
        </div>
      </div>

      {/* Radius selector */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E0E0E0', background: '#F5F7FA', flexShrink: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E3A5F', marginBottom: '0.4rem' }}>
          <i className="fa-solid fa-circle-dot" style={{ marginRight: '0.3rem', color: '#005EA2' }}></i>
          Search radius for safe locations:
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {RADIUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setRadius(opt.value)}
              style={{
                flex: 1, padding: '0.3rem 0', fontSize: '0.75rem', borderRadius: 3,
                border: `1px solid ${radius === opt.value ? '#005EA2' : '#BDBDBD'}`,
                background: radius === opt.value ? '#005EA2' : '#fff',
                color: radius === opt.value ? '#fff' : '#424242',
                fontWeight: radius === opt.value ? 700 : 400, cursor: 'pointer',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shelters list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0.75rem 1rem 0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E3A5F' }}>
            <i className="fa-solid fa-house-medical" style={{ marginRight: '0.3rem', color: '#2E7D32' }}></i>
            Nearby Safe Locations
          </span>
          {fetched && !loading && (
            <span style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>{shelters.length} found</span>
          )}
        </div>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0E0E0', borderTopColor: '#005EA2', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }}></div>
            <div style={{ fontSize: '0.82rem', color: '#616161' }}>Searching OpenStreetMap...</div>
            <div style={{ fontSize: '0.75rem', color: '#9E9E9E', marginTop: '0.3rem' }}>within {RADIUS_OPTIONS.find(o => o.value === radius)?.label}</div>
          </div>
        )}

        {error && (
          <div style={{ margin: '0.75rem 1rem', background: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 4, padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#E65100' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.3rem' }}></i>{error}
          </div>
        )}

        {!loading && fetched && shelters.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9E9E9E' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
            <div style={{ fontSize: '0.85rem' }}>No shelters found within {RADIUS_OPTIONS.find(o => o.value === radius)?.label}</div>
            <div style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>Try increasing the radius</div>
          </div>
        )}

        {!loading && shelters.map((s, i) => {
          const icon = TYPE_ICONS[s.type] || TYPE_ICONS.default;
          const color = TYPE_COLORS[s.type] || TYPE_COLORS.default;
          return (
            <div key={s.id || i} className="shelter-card"
              style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #F0F0F0', cursor: 'default', background: '#fff', transition: 'background 0.1s' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: color + '18', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa-solid ${icon}`} style={{ color, fontSize: '0.8rem' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#212121', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', background: color + '18', color, padding: '0.1rem 0.35rem', borderRadius: 2, fontWeight: 600 }}>
                      {s.typeLabel || s.type}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: s.verified ? '#2E7D32' : '#9E9E9E' }}>
                      {s.verified ? 'Verified' : 'User reported'}
                    </span>
                  </div>
                  {s.address && <div style={{ fontSize: '0.72rem', color: '#9E9E9E', marginBottom: '0.15rem' }}>{s.address}</div>}
                  {s.phone && <div style={{ fontSize: '0.72rem', color: '#005EA2' }}><i className="fa-solid fa-phone" style={{ marginRight: '0.2rem' }}></i>{s.phone}</div>}
                  {s.capacity && <div style={{ fontSize: '0.72rem', color: '#616161' }}>Capacity: {s.capacity}</div>}
                  <div style={{ fontSize: '0.68rem', color: '#BDBDBD', marginTop: '0.2rem' }}>
                    {s.lat?.toFixed(4)}°, {s.lng?.toFixed(4)}° · {s.source}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid #E0E0E0', background: '#F5F7FA', flexShrink: 0 }}>
        <div style={{ fontSize: '0.72rem', color: '#9E9E9E', textAlign: 'center' }}>
          <i className="fa-brands fa-openstreetmap" style={{ marginRight: '0.3rem' }}></i>
          Safe location data from OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}

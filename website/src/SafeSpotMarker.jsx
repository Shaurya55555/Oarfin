import React, { useState } from 'react';

const inp = {
  width: '100%',
  padding: '0.45rem 0.65rem',
  border: '1px solid var(--border-active)',
  borderRadius: '8px',
  fontSize: '0.78rem',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const btn = (bg) => ({
  width: '100%',
  padding: '0.45rem',
  fontSize: '0.78rem',
  background: bg,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'opacity 0.2s, transform 0.15s',
});

const label = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const SafeSpotMarker = ({ safeSpots, onAddSafeSpot, onRemoveSafeSpot, onClearSafeSpots, onSendToBackend, onClickPosition }) => {
  const [formData, setFormData] = useState({ lat: '', lng: '', name: '', eventid: '' });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.lat && formData.lng) {
      onAddSafeSpot({
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        name: formData.name || `Safe Spot ${safeSpots.length + 1}`,
        eventid: formData.eventid || `safespot-${Date.now()}`,
      });
      setFormData({ lat: '', lng: '', name: '', eventid: '' });
    }
  };

  const handleSendToBackend = () => {
    onSendToBackend({
      safeSpots: safeSpots.map(spot => ({
        latitude: spot.position.lat,
        longitude: spot.position.lng,
        name: spot.name,
        eventId: spot.eventid,
      })),
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '0.85rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      backdropFilter: 'blur(8px)',
      flex: 1,
      fontSize: '0.8rem',
    }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <i className="fa-solid fa-map-pin" style={{ color: 'var(--color-safe)' }}></i> Safe Spots Manager
      </h3>

      {onClickPosition && (
        <div style={{ marginBottom: '0.65rem', padding: '0.5rem 0.65rem', background: 'var(--bg-section)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.73rem' }}>
          <p style={{ margin: '0 0 0.3rem 0', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Clicked:</strong><br />
            Lat: {onClickPosition.lat.toFixed(6)}<br />
            Lng: {onClickPosition.lng.toFixed(6)}
          </p>
          <button onClick={() => setFormData(prev => ({ ...prev, lat: onClickPosition.lat.toFixed(6), lng: onClickPosition.lng.toFixed(6) }))}
            style={{ ...btn('#2563EB'), width: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.7rem', borderRadius: '6px' }}>
            Use This Position
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '0.6rem' }}>
        {[
          { key: 'lat', label: 'Latitude:', type: 'number' },
          { key: 'lng', label: 'Longitude:', type: 'number' },
          { key: 'eventid', label: 'Event ID (required):', type: 'text', placeholder: 'Add event id of disaster whose safe spot is marked' },
          { key: 'name', label: 'Name (optional):', type: 'text' },
        ].map(({ key, label: lbl, type, placeholder }) => (
          <div key={key} style={{ marginBottom: '0.5rem' }}>
            <label style={label}>{lbl}</label>
            <input
              type={type}
              name={key}
              value={formData[key]}
              onChange={handleInputChange}
              placeholder={placeholder || ''}
              step={type === 'number' ? 'any' : undefined}
              required={key === 'lat' || key === 'lng'}
              style={{ ...inp, borderColor: errors[key] ? 'var(--color-critical)' : undefined }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = errors[key] ? 'var(--color-critical)' : 'var(--border-active)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors[key] && <span style={{ color: 'var(--color-critical)', fontSize: '0.7rem' }}>{errors[key]}</span>}
          </div>
        ))}
        <button type="submit" style={{ ...btn('var(--color-safe)'), marginTop: '0.25rem' }}>
          <i className="fa-solid fa-plus" style={{ marginRight: '0.3rem' }}></i>Add Safe Spot
        </button>
      </form>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <button onClick={() => setFormData({ lat: '20', lng: '0', name: `Sample Spot ${safeSpots.length + 1}`, eventid: `sample-${Date.now().toString().slice(-4)}` })}
          style={{ ...btn('#2563EB'), flex: 1 }}>Sample</button>
        <button onClick={onClearSafeSpots} style={{ ...btn('var(--color-critical)'), flex: 1 }}>Clear All</button>
      </div>

      <button onClick={handleSendToBackend} style={btn('#7C3AED')}>
        <i className="fa-solid fa-paper-plane" style={{ marginRight: '0.3rem' }}></i>Send to Backend
      </button>

      {safeSpots.length > 0 && (
        <div style={{ marginTop: '0.75rem', maxHeight: '120px', overflowY: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.78rem', margin: '0 0 0.4rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Saved Spots ({safeSpots.length}):
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeSpots.map(spot => (
              <li key={spot.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{spot.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {spot.position.lat.toFixed(4)}, {spot.position.lng.toFixed(4)}<br />ID: {spot.eventid}
                  </div>
                </div>
                <button onClick={() => onRemoveSafeSpot(spot.id)} style={{ background: 'none', border: 'none', color: 'var(--color-critical)', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SafeSpotMarker;

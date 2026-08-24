import React from 'react';

const DISASTER_NAMES = { EQ: 'Earthquake', FL: 'Flood', TC: 'Cyclone', VO: 'Volcano', DR: 'Drought', WF: 'Wildfire' };
const DISASTER_COLORS = { EQ: '#F59E0B', FL: '#3B82F6', TC: '#8B5CF6', VO: '#EF4444', DR: '#D97706', WF: '#F97316' };

const DisasterFilter = ({ filters, setFilters, disasterCounts }) => {
  const toggle = (type) => setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  const toggleAll = (val) => setFilters(Object.fromEntries(Object.keys(filters).map(k => [k, val])));

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '0.75rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      backdropFilter: 'blur(8px)',
      marginBottom: '0.5rem',
    }}>
      <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <i className="fa-solid fa-sliders" style={{ color: 'var(--color-primary)' }}></i> Filter Disasters
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem', marginBottom: '0.6rem' }}>
        {Object.entries(filters).map(([type, isActive]) => (
          <label key={type} onClick={() => toggle(type)} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.75rem', cursor: 'pointer', padding: '0.3rem 0.4rem',
            borderRadius: '6px', border: `1px solid ${isActive ? DISASTER_COLORS[type] + '55' : 'var(--border-subtle)'}`,
            background: isActive ? DISASTER_COLORS[type] + '12' : 'var(--bg-section)',
            transition: 'all 0.2s', userSelect: 'none',
          }}>
            <input type="checkbox" checked={isActive} onChange={() => toggle(type)} style={{ accentColor: DISASTER_COLORS[type], margin: 0, cursor: 'pointer' }} />
            <span style={{ color: isActive ? DISASTER_COLORS[type] : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400, flex: 1 }}>
              {DISASTER_NAMES[type]}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '0 4px', borderRadius: '4px', fontWeight: 600 }}>
              {disasterCounts[type] || 0}
            </span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button onClick={() => toggleAll(true)} style={{
          flex: 1, padding: '0.3rem', fontSize: '0.72rem', borderRadius: '7px',
          border: '1px solid var(--border-active)', background: 'var(--bg-section)',
          color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary)' && (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-section)'; e.currentTarget.style.color = 'var(--text-primary)'; }}>
          Select All
        </button>
        <button onClick={() => toggleAll(false)} style={{
          flex: 1, padding: '0.3rem', fontSize: '0.72rem', borderRadius: '7px',
          border: '1px solid var(--border-active)', background: 'var(--bg-section)',
          color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
        }}>
          Deselect All
        </button>
      </div>
    </div>
  );
};

export default DisasterFilter;

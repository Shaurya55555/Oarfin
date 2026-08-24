import { useState } from 'react';
import DisasterNewsBanner from './DisasterNewsBanner';
import DisasterMap from './DisasterMap';
import NewsArticles from './NewsArticles';
import RedditVideos from './RedditVideos';

export default function Dashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('map');

  const tabs = [
    { id: 'map', label: 'Disaster Map', icon: 'fa-map-location-dot' },
    { id: 'news', label: 'News Articles', icon: 'fa-newspaper' },
    { id: 'videos', label: 'Reddit Videos', icon: 'fa-video' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', flexDirection: 'column' }}>
      {/* Dashboard Navbar */}
      <nav style={{ background: '#1E3A5F', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 56, gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '0.05em' }}>OARFIN</span>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)}
                style={{ background: activeView === tab.id ? 'rgba(255,255,255,0.15)' : 'none', border: 'none', color: activeView === tab.id ? '#fff' : '#aac4e0', padding: '0.4rem 0.85rem', borderRadius: 4, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className={`fa-solid ${tab.icon}`}></i>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <span style={{ color: '#aac4e0', fontSize: '0.82rem' }}>
              <i className="fa-solid fa-user" style={{ marginRight: '0.3rem' }}></i>
              {user?.firstName || user?.displayName || user?.email || 'User'}
            </span>
            <button onClick={onLogout}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, color: '#fff', padding: '0.3rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Alert Banner */}
      <DisasterNewsBanner />

      {/* Content */}
      <div style={{ flex: 1 }}>
        {activeView === 'map' && <DisasterMap />}
        {activeView === 'news' && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
            <NewsArticles />
          </div>
        )}
        {activeView === 'videos' && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
            <RedditVideos />
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .tab-label { display: none; }
        }
      `}</style>
    </div>
  );
}

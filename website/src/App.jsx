import { useState, useEffect } from 'react';
import HomePage from './HomePage';
import Dashboard from './Dashboard';
import './global.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('oarfin_user');
    const token = localStorage.getItem('oarfin_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* invalid */ }
    }
    setChecking(false);
  }, []);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('oarfin_token');
    localStorage.removeItem('oarfin_user');
    setUser(null);
  };

  if (checking) return null;

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <HomePage onLogin={handleLogin} />;
}

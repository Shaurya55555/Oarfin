import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export default function AIChatBox({ disasterContext, sheltersContext, userLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Disaster Assistant. How can I help you stay safe today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUserMsg, setLastUserMsg] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (userMsg) => {
    setLoading(true);

    try {
      const locStr = userLocation
        ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
        : 'Unknown';
      const eventType = disasterContext?.properties?.eventtype || 'General Emergency';
      const eventName = disasterContext?.properties?.eventname || disasterContext?.properties?.title || '';
      const disStr = disasterContext ? `${eventType} - ${eventName}` : 'General Emergency';

      const res = await axios.post(
        `${SERVER_URL}/api/ai/chat`,
        { message: userMsg, location: locStr, disaster: disStr, shelters: sheltersContext || [] },
        { timeout: 30000 }
      );

      const { reply, error } = res.data;

      if (error === 'rate_limited') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: reply,
            isError: true,
            retryMsg: userMsg,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
      }
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: isTimeout
            ? 'Request timed out. The AI server may be slow. Please try again.'
            : 'Unable to reach the AI server. Please make sure the backend is running.',
          isError: true,
          retryMsg: userMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setLastUserMsg(userMsg);
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    await sendMessage(userMsg);
  };

  const handleRetry = async (retryMsg) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: retryMsg }]);
    await sendMessage(retryMsg);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="animate-slide-up hover:scale-105"
        style={{
          position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999,
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), #4F46E5)',
          color: 'white', border: 'none',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.5)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <i className={isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-robot'}></i>
      </button>

      {isOpen && (
        <div
          className="glass animate-fade-in"
          style={{
            position: 'fixed', bottom: '100px', left: '24px', zIndex: 9998,
            width: '380px', height: '520px', borderRadius: '16px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'var(--bg-primary)'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'var(--color-primary)', color: 'white', padding: '16px',
            fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <i className="fa-solid fa-robot" style={{ fontSize: '1.2rem' }}></i> Surakshayan AI
          </div>

          {/* Context Banner */}
          {disasterContext && (
            <div style={{
              fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3',
              padding: '8px 12px', textAlign: 'center',
              borderBottom: '1px solid #c7d2fe', fontWeight: '600'
            }}>
              <i className="fa-solid fa-location-crosshairs"></i> Context synced:{' '}
              {disasterContext.properties?.eventtype} in radius •{' '}
              {sheltersContext?.length || 0} shelters loaded
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1, padding: '16px', overflowY: 'auto',
            background: 'var(--bg-section)', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: m.role === 'user'
                    ? 'var(--color-primary)'
                    : m.isError ? '#FEF2F2' : 'white',
                  color: m.role === 'user'
                    ? 'white'
                    : m.isError ? '#991B1B' : 'var(--text-primary)',
                  padding: '12px 16px', borderRadius: '16px', maxWidth: '85%',
                  fontSize: '0.9rem', lineHeight: 1.5,
                  borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: m.role === 'ai' ? '4px' : '16px',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  border: m.role === 'ai'
                    ? m.isError ? '1px solid #FECACA' : '1px solid var(--border-subtle)'
                    : 'none'
                }}>
                  {m.role === 'ai' && (
                    <i
                      className={m.isError ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-sparkles'}
                      style={{ color: m.isError ? '#EF4444' : '#F59E0B', marginRight: '6px', fontSize: '0.8rem' }}
                    ></i>
                  )}
                  {m.text}
                </div>
                {/* Retry button for error messages */}
                {m.isError && m.retryMsg && (
                  <button
                    onClick={() => handleRetry(m.retryMsg)}
                    disabled={loading}
                    style={{
                      marginTop: '6px', padding: '4px 12px', fontSize: '0.78rem',
                      background: loading ? '#cbd5e1' : 'var(--color-primary)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <i className="fa-solid fa-rotate-right" style={{ marginRight: '4px' }}></i>
                    Retry
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start', background: 'white',
                border: '1px solid var(--border-subtle)', padding: '12px 16px',
                borderRadius: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)'
              }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            display: 'flex', padding: '12px',
            background: 'white', borderTop: '1px solid var(--border-subtle)'
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={disasterContext ? 'Ask about this emergency...' : 'Ask what to pack or where to go...'}
              disabled={loading}
              style={{
                flex: 1, border: '1px solid var(--border-subtle)',
                background: 'var(--bg-section)', padding: '12px 16px',
                borderRadius: '24px', fontSize: '0.95rem', outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? 'var(--color-primary)' : '#cbd5e1',
                color: 'white', border: 'none',
                width: '46px', height: '46px', borderRadius: '50%', marginLeft: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              <i className="fa-solid fa-paper-plane" style={{ transform: 'translateX(-1px)' }}></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

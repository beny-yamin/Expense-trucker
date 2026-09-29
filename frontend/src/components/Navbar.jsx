import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useExpenses } from '../context/ExpenseContext.jsx';

export default function Navbar({ onOpenAddModal, onToggleSidebar, activePage }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const { backendConnected } = useExpenses();

  return (
    <header className="navbar glass-card" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '0.875rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          style={{ display: 'none' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.1rem',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
          }}>
            E
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              Expenssor
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {activePage}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Backend status badge */}
        <div
          title={backendConnected ? 'Backend API connected' : 'Local storage fallback active'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            background: backendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: backendConnected ? 'var(--success)' : 'var(--warning)',
            border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: backendConnected ? 'var(--success)' : 'var(--warning)',
            boxShadow: `0 0 6px ${backendConnected ? 'var(--success)' : 'var(--warning)'}`,
          }} />
          <span className="hide-on-mobile">{backendConnected ? 'API Online' : 'Local Mode'}</span>
        </div>

        {/* Theme toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Quick Add Expense button */}
        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <span>+</span>
          <span className="hide-on-mobile">Add Expense</span>
        </button>

        {/* User profile dropdown / avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
            <img
              src={user.avatar}
              alt={user.name}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--primary)',
              }}
            />
            <div className="hide-on-mobile" style={{ fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>{user.name}</div>
              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: inline-flex !important; }
          .hide-on-mobile { display: none !important; }
          .navbar { padding: 0.75rem 1rem !important; }
        }
      `}</style>
    </header>
  );
}

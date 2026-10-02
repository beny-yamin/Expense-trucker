import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useExpenses } from '../context/ExpenseContext.jsx';

export default function Navbar({ onOpenAddModal, onToggleSidebar, activePage, onNavigate }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const { backendConnected } = useExpenses();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

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

        {/* User profile button & dropdown menu */}
        {user && (
          <div
            ref={profileMenuRef}
            style={{
              position: 'relative',
              paddingLeft: '0.5rem',
              borderLeft: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setIsProfileOpen(prev => !prev)}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              title="Click to view account and sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isProfileOpen ? 'var(--bg-card)' : 'transparent',
                border: '1px solid',
                borderColor: isProfileOpen ? 'var(--primary)' : 'transparent',
                borderRadius: '9999px',
                padding: '0.2rem 0.5rem 0.2rem 0.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isProfileOpen) {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProfileOpen) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              />
              <div
                className="hide-on-mobile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  textAlign: 'left',
                }}
              >
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  ▼
                </span>
              </div>
            </button>

            {/* Profile Dropdown Popover */}
            {isProfileOpen && (
              <div
                className="glass-card profile-dropdown-menu"
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '240px',
                  maxWidth: 'calc(100vw - 2rem)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-lg, 14px)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.2)',
                  zIndex: 100,
                }}
              >
                {/* User info card */}
                <div style={{
                  padding: '0.4rem 0.5rem 0.75rem 0.5rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.name}
                    </div>
                    {user.email && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}>
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0' }}>
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('settings');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-input)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>⚙️</span>
                      <span>Settings & Profile</span>
                    </button>
                  )}

                  {onNavigate && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('dashboard');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-input)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>📊</span>
                      <span>Dashboard</span>
                    </button>
                  )}
                </div>

                {/* Prominent Sign Out Button */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--danger, #ef4444)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--danger, #ef4444)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = 'var(--danger, #ef4444)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = 'var(--danger, #ef4444)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                    }}
                  >
                    <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes profileDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .profile-dropdown-menu {
          animation: profileDropdownFade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: inline-flex !important; }
          .hide-on-mobile { display: none !important; }
          .navbar { padding: 0.75rem 1rem !important; }
        }
      `}</style>
    </header>
  );
}

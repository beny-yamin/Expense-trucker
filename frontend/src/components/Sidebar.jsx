import React from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expenses', label: 'Expenses', icon: '💳' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ activePage, setActivePage, isOpen, onClose }) {
  const { expenses } = useExpenses();
  const { monthlyBudget, formatCurrency } = useSettings();

  const totalSpent = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const budgetPercent = Math.min(Math.round((totalSpent / (monthlyBudget || 1)) * 100), 100);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
          }}
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>💎</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              Expenssor
            </span>
          </div>
          <button
            className="btn btn-ghost btn-icon mobile-close-btn"
            onClick={onClose}
            style={{ display: 'none' }}
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: '0 0.75rem', flex: 1 }}>
          <div style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-subtle)',
            padding: '0.5rem 0.75rem',
            fontWeight: 700,
          }}>
            Menu
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActivePage(item.id);
                      if (onClose) onClose();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--primary)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      border: 'none',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-input)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Budget Progress Widget in Sidebar footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div className="glass-card" style={{ padding: '1rem', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Monthly Budget</span>
              <span style={{ fontWeight: 700, color: budgetPercent > 90 ? 'var(--danger)' : 'var(--success)' }}>
                {budgetPercent}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: `${budgetPercent}%`,
                height: '100%',
                background: budgetPercent > 90
                  ? 'var(--danger)'
                  : 'linear-gradient(90deg, #10b981, #6366f1)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{formatCurrency(totalSpent)}</span>
              <span>of {formatCurrency(monthlyBudget)}</span>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </>
  );
}

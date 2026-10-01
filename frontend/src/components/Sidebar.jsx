import React, { useEffect, useRef, useCallback } from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expenses', label: 'Expenses', icon: '💳' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Swipe detection thresholds
const EDGE_ZONE = 30;        // px from left edge to start a swipe-open
const SWIPE_THRESHOLD = 60;  // min px to complete a swipe
const SIDEBAR_WIDTH = 260;

export default function Sidebar({ activePage, setActivePage, isOpen, onClose }) {
  const { expenses } = useExpenses();
  const { monthlyBudget, formatCurrency } = useSettings();

  const totalSpent = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const budgetPercent = Math.min(Math.round((totalSpent / (monthlyBudget || 1)) * 100), 100);

  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, currentX: 0, swiping: false, direction: null });

  // Stable callback refs to avoid stale closures in touch listeners
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [isOpen]);

  // Set up swipe-from-left gesture on the whole document (mobile only)
  const handleOpen = useCallback(() => {
    // We need a way to open the sidebar from outside — use a custom event
    // dispatched on the document, caught by App.jsx's state
    // But since we receive isOpen as a prop, we fire the toggle via the
    // Navbar's onToggleSidebar. Instead, dispatch a custom event.
    document.dispatchEvent(new CustomEvent('sidebar:open'));
  }, []);

  useEffect(() => {
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

    const onTouchStart = (e) => {
      if (!isMobile()) return;
      const touch = e.touches[0];
      const t = touchRef.current;
      t.startX = touch.clientX;
      t.startY = touch.clientY;
      t.currentX = touch.clientX;
      t.swiping = false;
      t.direction = null;

      // Only start tracking if: near left edge (to open) OR sidebar is open (to close)
      if (touch.clientX <= EDGE_ZONE || isOpenRef.current) {
        t.swiping = true;
      }
    };

    const onTouchMove = (e) => {
      const t = touchRef.current;
      if (!t.swiping || !isMobile()) return;

      const touch = e.touches[0];
      const dx = touch.clientX - t.startX;
      const dy = touch.clientY - t.startY;

      // Determine direction on first significant move
      if (!t.direction) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          t.direction = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        }
      }

      // Abort if vertical scroll
      if (t.direction === 'vertical') {
        t.swiping = false;
        return;
      }

      t.currentX = touch.clientX;

      // Live drag feedback on the sidebar element
      const sidebar = sidebarRef.current;
      const overlay = overlayRef.current;
      if (!sidebar) return;

      if (isOpenRef.current) {
        // Dragging to close: allow only leftward drag
        const offset = Math.min(0, dx);
        sidebar.style.transition = 'none';
        sidebar.style.transform = `translateX(${offset}px)`;
        if (overlay) {
          const progress = Math.max(0, 1 + offset / SIDEBAR_WIDTH);
          overlay.style.opacity = String(progress);
        }
      } else {
        // Dragging to open: allow only rightward drag from left edge
        const offset = Math.min(dx, SIDEBAR_WIDTH) - SIDEBAR_WIDTH;
        if (dx > 0) {
          sidebar.style.transition = 'none';
          sidebar.style.transform = `translateX(${Math.max(offset, -SIDEBAR_WIDTH)}px)`;
          if (overlay) {
            overlay.style.display = 'block';
            const progress = Math.max(0, dx / SIDEBAR_WIDTH);
            overlay.style.opacity = String(Math.min(progress, 1));
          }
        }
      }
    };

    const onTouchEnd = () => {
      const t = touchRef.current;
      if (!t.swiping || t.direction !== 'horizontal' || !isMobile()) {
        t.swiping = false;
        return;
      }

      const dx = t.currentX - t.startX;
      const sidebar = sidebarRef.current;
      const overlay = overlayRef.current;

      // Reset inline transition styles
      if (sidebar) {
        sidebar.style.transition = '';
        sidebar.style.transform = '';
      }
      if (overlay) {
        overlay.style.opacity = '';
        overlay.style.display = '';
      }

      if (isOpenRef.current) {
        // Close if swiped left enough
        if (dx < -SWIPE_THRESHOLD) {
          onCloseRef.current?.();
        }
      } else {
        // Open if swiped right enough
        if (dx > SWIPE_THRESHOLD) {
          handleOpen();
        }
      }

      t.swiping = false;
      t.direction = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
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
            style={{ display: 'none', minWidth: '44px', minHeight: '44px' }}
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

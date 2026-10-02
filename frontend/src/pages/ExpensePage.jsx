import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import expenseService, {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  subscribeToExpenses,
} from '../services/expenseService.js';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExportModal from '../components/ExportModal.jsx';

/**
 * ExpensePage.jsx
 *
 * Connects directly with expenseService.js to provide:
 * 1. Live real-time UI updates via pub/sub subscriber events
 * 2. Background live auto-refresh polling with a toggle
 * 3. Optimistic UI updates on addition, editing, and deletion
 * 4. Real-time connection status (Live Backend vs Offline cache)
 * 5. Standalone or context-integrated execution
 */
export default function ExpensePage({
  onOpenAddModal: externalOpenAddModal,
  onEditExpense: externalEditExpense,
  onDeleteExpense: externalDeleteExpense,
}) {
  // Context fallbacks if mounted within ExpenseProvider & SettingsProvider
  const context = useExpenses();
  const settings = useSettings();

  const categories = context?.categories || [
    { id: 'Food', name: 'Food & Dining', icon: '🍔', badgeClass: 'cat-food' },
    { id: 'Transportation', name: 'Transportation', icon: '🚗', badgeClass: 'cat-transport' },
    { id: 'Housing', name: 'Housing & Rent', icon: '🏠', badgeClass: 'cat-housing' },
    { id: 'Entertainment', name: 'Entertainment', icon: '🎬', badgeClass: 'cat-entertainment' },
    { id: 'Utilities', name: 'Utilities & Bills', icon: '⚡', badgeClass: 'cat-utilities' },
    { id: 'Healthcare', name: 'Healthcare', icon: '💊', badgeClass: 'cat-healthcare' },
    { id: 'Shopping', name: 'Shopping', icon: '🛍️', badgeClass: 'cat-shopping' },
    { id: 'Personal', name: 'Personal Care', icon: '✨', badgeClass: 'cat-personal' },
    { id: 'Other', name: 'Other', icon: '📦', badgeClass: 'cat-other' },
  ];

  const formatCurrency = settings?.formatCurrency || ((amt) => `$${Number(amt || 0).toFixed(2)}`);

  // Local live state for expenses
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [isAutoSyncActive, setIsAutoSyncActive] = useState(true);
  const [syncFeedback, setSyncFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Filtering & Sorting State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Standalone Internal Modal State (used if no external modal handler is provided)
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [internalEditingItem, setInternalEditingItem] = useState(null);
  const [internalDeleteConfirm, setInternalDeleteConfirm] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference to avoid stale closures in polling
  const isMountedRef = useRef(true);
  const internalModalBodyRef = useRef(null);
  const internalSubmitBtnRef = useRef(null);

  const handleInternalScrollToBottom = () => {
    if (internalSubmitBtnRef.current) {
      internalSubmitBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (internalModalBodyRef.current) {
      internalModalBodyRef.current.scrollTo({
        top: internalModalBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  /**
   * Fetch latest expenses directly from expenseService
   */
  const fetchLiveExpenses = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    setErrorMessage('');

    try {
      const data = await expenseService.getAll();
      if (!isMountedRef.current) return;

      if (Array.isArray(data)) {
        setExpenses(data);
        setBackendConnected(true);
        setLastSynced(new Date());
        if (!silent) {
          setSyncFeedback('Live sync completed');
          setTimeout(() => setSyncFeedback(''), 2500);
        }
      }
    } catch (err) {
      console.warn('[ExpensePage] Live fetch error:', err.message);
      if (!isMountedRef.current) return;
      setBackendConnected(false);
      setErrorMessage(`Live sync unreachable (${err.message}). Using current local view.`);
      // If we don't have expenses yet, fallback to context or local storage
      if (expenses.length === 0 && context?.expenses?.length > 0) {
        setExpenses(context.expenses);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [context?.expenses, expenses.length]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    fetchLiveExpenses(false);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Real-time subscription to expenseService events
   * Handles live UI updates whenever any item is created, edited, or deleted
   */
  useEffect(() => {
    const unsubscribe = subscribeToExpenses((event) => {
      const { action, payload } = event;

      if (action === 'create' && payload) {
        setExpenses((prev) => {
          if (prev.some((item) => item._id === payload._id)) return prev;
          return [payload, ...prev];
        });
        setLastSynced(new Date());
        setSyncFeedback(`Live update: Added "${payload.title}"`);
        setTimeout(() => setSyncFeedback(''), 3000);
      } else if (action === 'update' && payload) {
        setExpenses((prev) =>
          prev.map((item) => (item._id === payload._id ? { ...item, ...payload } : item))
        );
        setLastSynced(new Date());
        setSyncFeedback(`Live update: Updated "${payload.title}"`);
        setTimeout(() => setSyncFeedback(''), 3000);
      } else if (action === 'delete' && payload?.id) {
        setExpenses((prev) => prev.filter((item) => item._id !== payload.id));
        setLastSynced(new Date());
        setSyncFeedback('Live update: Expense deleted');
        setTimeout(() => setSyncFeedback(''), 3000);
      } else if (action === 'refresh') {
        fetchLiveExpenses(true);
      }
    });

    return unsubscribe;
  }, [fetchLiveExpenses]);

  /**
   * Periodic background polling for live updates across tabs or external changes
   */
  useEffect(() => {
    if (!isAutoSyncActive) return;

    const interval = setInterval(() => {
      fetchLiveExpenses(true);
    }, 12000); // 12 seconds auto-refresh interval

    return () => clearInterval(interval);
  }, [isAutoSyncActive, fetchLiveExpenses]);

  // Synchronize with parent context if provided and context changes externally
  useEffect(() => {
    if (context?.expenses && context.expenses.length > 0 && expenses.length === 0) {
      setExpenses(context.expenses);
    }
  }, [context?.expenses]);

  /**
   * Category metadata resolver
   */
  const getCategoryMeta = (catId) => {
    return (
      categories.find((c) => c.id === catId) || {
        name: catId || 'Other',
        icon: '📦',
        badgeClass: 'cat-other',
      }
    );
  };

  /**
   * Live Optimistic Delete Handler
   */
  const handleDeleteExpense = async (expense) => {
    if (!expense?._id) return;

    if (externalDeleteExpense) {
      // Delegate to external handler if supplied
      externalDeleteExpense(expense);
      return;
    }

    // Direct standalone delete with optimistic UI update
    const prevList = [...expenses];
    setExpenses((prev) => prev.filter((item) => item._id !== expense._id));
    setInternalDeleteConfirm(null);

    try {
      await expenseService.delete(expense._id);
      setSyncFeedback(`Deleted "${expense.title}"`);
      setTimeout(() => setSyncFeedback(''), 2500);
    } catch (err) {
      // Rollback on error
      console.error('[ExpensePage] Delete failed, rolling back:', err);
      setExpenses(prevList);
      setErrorMessage(`Failed to delete "${expense.title}": ${err.message}`);
    }
  };

  /**
   * Open Add Expense Modal (external or internal fallback)
   */
  const handleOpenAdd = () => {
    if (externalOpenAddModal) {
      externalOpenAddModal();
      return;
    }
    setInternalEditingItem(null);
    setFormTitle('');
    setFormAmount('');
    setFormCategory(categories[0]?.id || 'Food');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setInternalModalOpen(true);
  };

  /**
   * Open Edit Expense Modal (external or internal fallback)
   */
  const handleOpenEdit = (expense) => {
    if (externalEditExpense) {
      externalEditExpense(expense);
      return;
    }
    setInternalEditingItem(expense);
    setFormTitle(expense.title || '');
    setFormAmount(expense.amount || '');
    setFormCategory(expense.category || categories[0]?.id || 'Food');
    const d = expense.date ? new Date(expense.date).toISOString().split('T')[0] : '';
    setFormDate(d || new Date().toISOString().split('T')[0]);
    setFormError('');
    setInternalModalOpen(true);
  };

  /**
   * Internal Modal Submit for standalone mode
   */
  const handleInternalModalSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(formAmount);
    if (!formTitle.trim()) {
      setFormError('Please enter a description or title.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        amount: parsedAmount,
        category: formCategory,
        date: new Date(formDate).toISOString(),
      };

      if (internalEditingItem?._id) {
        // Live Update
        const updated = await expenseService.update(internalEditingItem._id, payload);
        // Optimistic update in case subscription didn't trigger
        setExpenses((prev) =>
          prev.map((item) => (item._id === internalEditingItem._id ? { ...item, ...updated } : item))
        );
      } else {
        // Live Create
        const created = await expenseService.create(payload);
        // Optimistic update
        setExpenses((prev) => {
          if (prev.some((item) => item._id === created._id)) return prev;
          return [created, ...prev];
        });
      }

      setInternalModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Callback when a new expense is successfully created via ExpenseForm
   */
  const handleExpenseAdded = useCallback((newExpense) => {
    if (newExpense) {
      setExpenses((prev) => {
        if (prev.some((item) => item._id === newExpense._id)) return prev;
        return [newExpense, ...prev];
      });
      setLastSynced(new Date());
    }
  }, []);

  /**
   * Reactive Filter & Sort
   */
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        if (sortBy === 'amount-asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        return 0;
      });
  }, [expenses, search, selectedCategory, sortBy]);

  const filteredTotal = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  /**
   * CSV export handler
   */
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = filteredExpenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      `"${(exp.title || '').replace(/"/g, '""')}"`,
      exp.category,
      exp.amount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Title & Live Action Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0 }}>
              Expenses Ledger
            </h1>

            {/* Real-time Connection Status Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: backendConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: backendConnected ? 'var(--success)' : 'var(--warning)',
                border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}
              title={backendConnected ? 'Connected directly to /api/expenses' : 'Backend offline, using local store'}
            >
              <span className={backendConnected ? 'pulse-dot-online' : 'pulse-dot-offline'} />
              <span>{backendConnected ? 'Live Connected' : 'Offline Mode'}</span>
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Live updates via <code style={{ color: 'var(--primary)', fontWeight: 600 }}>expenseService.js</code>
            {lastSynced && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.82rem', opacity: 0.85 }}>
                • Last synced: {lastSynced.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Live Controls & Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Live Auto-Refresh Toggle */}
          <button
            className="btn btn-secondary"
            onClick={() => setIsAutoSyncActive(!isAutoSyncActive)}
            title={isAutoSyncActive ? 'Click to pause live polling' : 'Click to resume live polling'}
            style={{ fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
          >
            <span>{isAutoSyncActive ? '🟢 Live Auto-Sync' : '⏸️ Polling Paused'}</span>
          </button>

          {/* Manual Refresh / Sync Button */}
          <button
            className="btn btn-secondary"
            onClick={() => fetchLiveExpenses(false)}
            disabled={isRefreshing}
            title="Fetch latest updates from server now"
            style={{ fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
          >
            <span className={isRefreshing ? 'spin-animation' : ''}>🔄</span>
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsExportModalOpen(true)}
            disabled={expenses.length === 0}
            style={{ fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
            title="Export reports as printable PDF, CSV, JSON, or shareable text summary"
          >
            <span>📤</span>
            <span>Export & Share</span>
          </button>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <span>+</span>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Live sync notification toast / banner */}
      {syncFeedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <span>⚡</span>
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Error state banner */}
      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--warning-light)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--warning)',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            className="btn btn-secondary"
            onClick={() => fetchLiveExpenses(false)}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Quick Add Expense Form with Category, Description, Amount, and Submit button */}
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div>
            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date-desc">Date: Newest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="amount-desc">Amount: Highest First</option>
              <option value="amount-asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredExpenses.length}</strong> of{' '}
            {expenses.length} records
          </span>
          <span>
            Subtotal:{' '}
            <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>
              {formatCurrency(filteredTotal)}
            </strong>
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            <span className="spin-animation" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
              🔄
            </span>
            <p style={{ margin: 0, fontWeight: 500 }}>Connecting to backend & fetching live expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</p>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No matching expenses found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Try adjusting your search filters or add a new expense.
            </p>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              + Add Expense
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-input)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '1rem 1.25rem' }}>Date</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Description</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Category</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center', width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp, idx) => {
                  const cat = getCategoryMeta(exp.category);
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={exp._id || `exp-${idx}`}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isEven ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isEven
                          ? 'transparent'
                          : 'rgba(255, 255, 255, 0.015)')
                      }
                    >
                      <td
                        style={{
                          padding: '1rem 1.25rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {exp.date
                          ? new Date(exp.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {exp.title}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${cat.badgeClass}`}>
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '1rem 1.25rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatCurrency(exp.amount)}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Edit expense"
                            onClick={() => handleOpenEdit(exp)}
                            style={{ width: '32px', height: '32px' }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Delete expense"
                            onClick={() => {
                              if (externalDeleteExpense) {
                                externalDeleteExpense(exp);
                              } else {
                                setInternalDeleteConfirm(exp);
                              }
                            }}
                            style={{ width: '32px', height: '32px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internal Modal for Standalone Usage: Add / Edit Expense */}
      {internalModalOpen && (
        <div className="modal-overlay" onClick={() => setInternalModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {internalEditingItem ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button
                  type="button"
                  id="internal-scroll-to-bottom-btn"
                  className="btn btn-secondary"
                  onClick={handleInternalScrollToBottom}
                  title="Scroll directly to the bottom / Submit button"
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.3rem 0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <span>Scroll to Bottom</span>
                  <span>↓</span>
                </button>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setInternalModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleInternalModalSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" ref={internalModalBodyRef}>
                {formError && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--danger-light)',
                      color: 'var(--danger)',
                      fontSize: '0.85rem',
                      marginBottom: '1.25rem',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Amount Input */}
                <div className="form-group">
                  <label className="form-label">Amount of money</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    style={{ fontSize: '1.25rem', fontWeight: 600 }}
                    required
                    autoFocus
                  />
                </div>

                {/* Description / Title */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Grocery run"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Category Selection */}
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <div
                    className="category-scroll-container"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      maxHeight: '165px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '6px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {categories.map((cat) => {
                      const isSelected = formCategory === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setFormCategory(cat.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.65rem 0.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                            color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{cat.icon}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Input */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInternalModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  ref={internalSubmitBtnRef}
                  type="submit"
                  id="internal-modal-submit-btn"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spin-animation" style={{ display: 'inline-block' }}>
                        🔄
                      </span>
                      <span>Submitting...</span>
                    </>
                  ) : internalEditingItem ? (
                    'Save Changes'
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Delete Confirmation Modal */}
      {internalDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setInternalDeleteConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--danger)' }}>
                Confirm Deletion
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setInternalDeleteConfirm(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Are you sure you want to delete this expense?
              </p>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                "{internalDeleteConfirm.title}" ({formatCurrency(internalDeleteConfirm.amount)})
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                This record will be permanently deleted via expenseService.js.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInternalDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteExpense(internalDeleteConfirm)}
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export & Share Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

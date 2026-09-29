import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function ExpenseModal({ isOpen, onClose, expenseToEdit = null }) {
  const { categories, addExpense, updateExpense } = useExpenses();
  const { activeCurrency } = useSettings();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const modalBodyRef = useRef(null);
  const submitButtonRef = useRef(null);

  const scrollToBottom = () => {
    if (submitButtonRef.current) {
      submitButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({
        top: modalBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setAmount(expenseToEdit.amount || '');
      setCategory(expenseToEdit.category || categories[0]?.id || 'Food');
      const d = expenseToEdit.date ? new Date(expenseToEdit.date).toISOString().split('T')[0] : '';
      setDate(d || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setAmount('');
      setCategory(categories[0]?.id || 'Food');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [expenseToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category || !String(category).trim()) {
      setError('Please select a category.');
      return;
    }

    if (!title || !title.trim()) {
      setError('Please provide a description.');
      return;
    }

    const trimmedAmount = String(amount).trim();
    const parsedAmount = parseFloat(trimmedAmount);

    if (trimmedAmount === '' || isNaN(parsedAmount) || !isFinite(parsedAmount)) {
      setError('Please enter a valid number for the amount of money.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Amount of money must be greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        amount: parsedAmount,
        category: String(category).trim(),
        date: new Date(date).toISOString(),
      };

      if (expenseToEdit?._id) {
        await updateExpense(expenseToEdit._id, payload);
      } else {
        await addExpense(payload);
      }

      // Clear input fields after successful submission
      setTitle('');
      setAmount('');
      setCategory(categories[0]?.id || 'Food');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');

      onClose();
    } catch (err) {
      setError(err?.message || 'An error occurred while submitting the expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <button
              type="button"
              id="scroll-to-bottom-btn"
              className="btn btn-secondary"
              onClick={scrollToBottom}
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
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" ref={modalBodyRef}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                {error}
              </div>
            )}

            {/* Amount Input */}
            <div className="form-group">
              <label className="form-label">Amount of money ({activeCurrency.symbol})</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                }}>
                  {activeCurrency.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ paddingLeft: '2.4rem', fontSize: '1.25rem', fontWeight: 600 }}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Description / Title */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Grocery run at Whole Foods"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category selection */}
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
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
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
                        transition: 'var(--transition)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{cat.icon}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              id="modal-submit-expense-btn"
              data-testid="modal-submit-expense-btn"
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
              ) : expenseToEdit ? (
                'Save Changes'
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

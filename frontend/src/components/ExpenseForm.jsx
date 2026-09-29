import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

/**
 * ExpenseForm Component
 *
 * Form containing three inputs:
 * 1. Category
 * 2. Description
 * 3. Amount of money
 *
 * And a Submit button that:
 * 1. Validates all required fields are completed
 * 2. Validates amount is a valid number (> 0)
 * 3. Adds the expense to the existing expense data/list
 * 4. Clears input fields after a successful submission
 * 5. Shows clear loading / disabled state while submitting
 * 6. Displays an appropriate error message if submission fails
 */
export default function ExpenseForm({ onExpenseAdded = null, className = '' }) {
  const { categories, addExpense } = useExpenses();
  const settings = useSettings();
  const currencySymbol = settings?.activeCurrency?.symbol || '$';

  const defaultCategory = categories?.[0]?.id || 'Food';

  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 1. Validate that all required fields are completed
    if (!category || !category.trim()) {
      setError('Please select a category.');
      return;
    }

    if (!description || !description.trim()) {
      setError('Please provide a description.');
      return;
    }

    if (amount === '' || amount === null || amount === undefined) {
      setError('Please enter the amount of money.');
      return;
    }

    // 2. Make sure the amount is a valid number
    const trimmedAmount = String(amount).trim();
    const parsedAmount = parseFloat(trimmedAmount);

    if (isNaN(parsedAmount) || !isFinite(parsedAmount)) {
      setError('Please enter a valid number for the amount of money.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Amount of money must be greater than 0.');
      return;
    }

    try {
      // 5. Show a clear loading or disabled state while submitting
      setIsSubmitting(true);

      const payload = {
        title: description.trim(),
        amount: parsedAmount,
        category: category.trim(),
        date: new Date().toISOString(),
      };

      // 3. Add the expense to the existing expense data/list
      let createdExpense = null;
      if (typeof addExpense === 'function') {
        createdExpense = await addExpense(payload);
      }

      if (typeof onExpenseAdded === 'function') {
        onExpenseAdded(createdExpense || payload);
      }

      // 4. Clear the input fields after a successful submission
      setDescription('');
      setAmount('');
      setCategory(defaultCategory);
      setError('');
      setSuccessMessage('Expense successfully added!');

      setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (err) {
      // 6. Display an appropriate error message if the submission fails
      console.error('[ExpenseForm] Submission failed:', err);
      setError(err?.message || 'Failed to submit expense. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`glass-card ${className}`}
      style={{
        padding: '1.5rem',
        marginBottom: '1.5rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            ➕
          </span>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Add New Expense
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Fill in the category, description, and amount to submit a new entry.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div
          id="expense-form-error"
          data-testid="expense-form-error"
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div
          id="expense-form-success"
          data-testid="expense-form-success"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-light)',
            color: 'var(--success)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form
        id="expense-form"
        data-testid="expense-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          {/* Input 1: Category */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="expense-category">
              Category
            </label>
            <select
              id="expense-category"
              name="category"
              data-testid="expense-category-input"
              className="form-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (error) setError('');
              }}
              disabled={isSubmitting}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input 2: Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="expense-description">
              Description
            </label>
            <input
              id="expense-description"
              name="description"
              data-testid="expense-description-input"
              type="text"
              className="form-input"
              placeholder="e.g. Weekly grocery shopping"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError('');
              }}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Input 3: Amount of money */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="expense-amount">
              Amount of money ({currencySymbol})
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              >
                {currencySymbol}
              </span>
              <input
                id="expense-amount"
                name="amount"
                data-testid="expense-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                style={{ paddingLeft: '2rem' }}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              id="submit-expense-btn"
              data-testid="submit-expense-button"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '42px',
                opacity: isSubmitting ? 0.75 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spin-animation" style={{ display: 'inline-block' }}>
                    🔄
                  </span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

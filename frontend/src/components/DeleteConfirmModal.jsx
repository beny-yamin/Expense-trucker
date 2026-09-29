import React from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, expenseTitle }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--danger)' }}>
            Confirm Deletion
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            Are you sure you want to delete this expense?
          </p>
          {expenseTitle && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--text-main)',
            }}>
              "{expenseTitle}"
            </div>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            This action cannot be undone and will remove the record from your database.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete Expense
          </button>
        </div>
      </div>
    </div>
  );
}

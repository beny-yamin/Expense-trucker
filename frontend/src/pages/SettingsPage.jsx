import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenses } from '../context/ExpenseContext.jsx';

export default function SettingsPage() {
  const { theme, toggleTheme, currency, updateSettings, monthlyBudget, currencies } = useSettings();
  const { user, updateProfile, logout } = useAuth();
  const { categories, addCategory, addToast, backendConnected } = useExpenses();

  const [name, setName] = useState(user?.name || '');
  const [budgetInput, setBudgetInput] = useState(monthlyBudget || 3000);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({ name });
    addToast('Profile updated successfully!', 'success');
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      updateSettings({ monthlyBudget: val });
      addToast('Monthly budget updated!', 'success');
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const id = newCatName.trim().replace(/\s+/g, '_');
    const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addCategory({
      id,
      name: newCatName.trim(),
      icon: newCatIcon || '🏷️',
      badgeClass: 'cat-personal',
      color: randomColor,
    });

    setNewCatName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
          Settings & Preferences
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Customize your experience, currency, budget limits, and categories.
        </p>
      </div>

      {/* 1. Appearance & Theme */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Appearance & Display
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Interface Theme</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Choose between dark mode and light mode
            </div>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            <span>{theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* 2. Currency & Budget */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Financial Preferences
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Currency selection */}
          <div className="form-group">
            <label className="form-label">Default Currency</label>
            <select
              className="form-select"
              value={currency}
              onChange={(e) => {
                updateSettings({ currency: e.target.value });
                addToast(`Currency changed to ${e.target.value}`, 'info');
              }}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Budget */}
          <form onSubmit={handleSaveBudget} className="form-group">
            <label className="form-label">Monthly Target Budget</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                min="100"
                step="50"
                className="form-input"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Category Manager */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Categories
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Current categories used for tagging expenses.
        </p>

        {/* Existing categories list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.5rem' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`badge ${cat.badgeClass}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Add Category form */}
        <form onSubmit={handleAddCategory} style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '1rem',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <input
            type="text"
            className="form-input"
            placeholder="Emoji (e.g. 🎮)"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            style={{ width: '80px', textAlign: 'center' }}
            maxLength={3}
          />
          <input
            type="text"
            className="form-input"
            placeholder="New Category Name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            style={{ flex: 1, minWidth: '180px' }}
          />
          <button type="submit" className="btn btn-primary">
            + Add Category
          </button>
        </form>
      </div>

      {/* 4. User Profile */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          User Profile
        </h2>

        {user ? (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                Save Profile
              </button>
              <button type="button" className="btn btn-danger" onClick={logout}>
                Log Out
              </button>
            </div>
          </form>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No user logged in.</p>
        )}
      </div>

      {/* 5. System Connection Status */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
              Backend API Status
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Connected to <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}</code>
            </div>
          </div>
          <span className={`badge ${backendConnected ? 'cat-utilities' : 'cat-shopping'}`}>
            {backendConnected ? 'Online (MongoDB)' : 'Offline (Local Sync)'}
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CategoryDonutChart, SpendingTrendBarChart } from '../components/SimpleCharts.jsx';

export default function DashboardPage({ onOpenAddModal, onEditExpense, onDeleteExpense, onNavigate }) {
  const { expenses, categories, loading } = useExpenses();
  const { monthlyBudget, formatCurrency } = useSettings();
  const { user } = useAuth();

  // Metrics
  const totalSpent = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetPercent = Math.min(Math.round((totalSpent / (monthlyBudget || 1)) * 100), 100);
  const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  // Recent 5 transactions
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const getCategoryMeta = (catId) => {
    return categories.find((c) => c.id === catId) || {
      name: catId,
      icon: '📦',
      badgeClass: 'cat-other',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Here is what's happening with your expenses today.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <span>+</span>
          <span>Add Expense</span>
        </button>
      </div>

      {/* 4 Stat Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Card 1: Total Spent */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Spending
            </span>
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              💰
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {formatCurrency(totalSpent)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            Across {expenses.length} total transactions
          </div>
        </div>

        {/* Card 2: Budget Status */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Remaining Budget
            </span>
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: remainingBudget >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: remainingBudget >= 0 ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              {remainingBudget >= 0 ? '🎯' : '⚠️'}
            </span>
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginTop: '0.5rem',
            color: remainingBudget >= 0 ? 'var(--text-main)' : 'var(--danger)',
          }}>
            {formatCurrency(remainingBudget)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            {budgetPercent}% of {formatCurrency(monthlyBudget)} budget used
          </div>
        </div>

        {/* Card 3: Average Expense */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Ticket
            </span>
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              ⚖️
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {formatCurrency(avgExpense)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            Per logged transaction
          </div>
        </div>

        {/* Card 4: Top Category */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Categories
            </span>
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              🏷️
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {new Set(expenses.map(e => e.category)).size} Categories
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            Available in category engine
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Category Breakdown Donut */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Category Breakdown</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Share of total spending</span>
            </div>
            <span style={{ fontSize: '1.25rem' }}>🍩</span>
          </div>
          <CategoryDonutChart expenses={expenses} />
        </div>

        {/* 7-Day Trend Bar Chart */}
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>7-Day Spending Trend</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily expenses breakdown</span>
            </div>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
          </div>
          <div style={{ flex: 1, minHeight: '220px' }}>
            <SpendingTrendBarChart expenses={expenses} />
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Recent Expenses</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest entries in your ledger</span>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
            onClick={() => onNavigate('expenses')}
          >
            <span>View All</span>
            <span>→</span>
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Loading expenses...
          </p>
        ) : recentExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No expenses recorded yet.</p>
            <button className="btn btn-primary" onClick={onOpenAddModal}>
              + Add First Expense
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentExpenses.map((expense) => {
              const cat = getCategoryMeta(expense.category);
              return (
                <div
                  key={expense._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                        {expense.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
                        <span className={`badge ${cat.badgeClass}`}>
                          {cat.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          {new Date(expense.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                    }}>
                      {formatCurrency(expense.amount)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit expense"
                        onClick={() => onEditExpense(expense)}
                        style={{ width: '32px', height: '32px' }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Delete expense"
                        onClick={() => onDeleteExpense(expense)}
                        style={{ width: '32px', height: '32px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

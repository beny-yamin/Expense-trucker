import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { CategoryDonutChart } from '../components/SimpleCharts.jsx';

export default function ReportsPage() {
  const { expenses, categories } = useExpenses();
  const { formatCurrency, monthlyBudget } = useSettings();

  const [period, setPeriod] = useState('ALL'); // 'ALL', '30D', 'MONTH'

  const filteredExpenses = expenses.filter((exp) => {
    if (period === 'ALL') return true;
    const now = new Date();
    const itemDate = new Date(exp.date);
    if (period === '30D') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return itemDate >= thirtyDaysAgo;
    }
    if (period === 'MONTH') {
      return (
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Highest single expense
  const highestExpense = filteredExpenses.reduce(
    (max, curr) => (Number(curr.amount) > Number(max.amount || 0) ? curr : max),
    {}
  );

  // Group by category
  const categoryStats = {};
  filteredExpenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, count: 0 };
    }
    categoryStats[cat].total += Number(exp.amount) || 0;
    categoryStats[cat].count += 1;
  });

  const categoryReportList = Object.entries(categoryStats)
    .map(([catId, stats]) => {
      const meta = categories.find((c) => c.id === catId) || {
        name: catId,
        color: '#94a3b8',
        icon: '📦',
        badgeClass: 'cat-other',
      };
      const percentage = totalSpent > 0 ? (stats.total / totalSpent) * 100 : 0;
      return {
        id: catId,
        name: meta.name,
        icon: meta.icon,
        color: meta.color,
        badgeClass: meta.badgeClass,
        total: stats.total,
        count: stats.count,
        avg: stats.total / (stats.count || 1),
        percentage,
      };
    })
    .sort((a, b) => b.total - a.total);

  const topCategory = categoryReportList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header and Filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
            Financial Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Detailed breakdown, category distribution, and spending insights.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: '30D', label: 'Last 30 Days' },
            { id: 'MONTH', label: 'This Month' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: period === tab.id ? 'var(--primary)' : 'transparent',
                color: period === tab.id ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Period Spending
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {formatCurrency(totalSpent)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Based on {filteredExpenses.length} transactions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Top Expense Category
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {topCategory ? `${topCategory.icon} ${topCategory.name}` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            {topCategory ? `${formatCurrency(topCategory.total)} (${topCategory.percentage.toFixed(0)}%)` : 'No data'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Largest Single Expense
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {highestExpense.amount ? formatCurrency(highestExpense.amount) : '$0.00'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            {highestExpense.title || 'No transactions'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Monthly Budget Pacing
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginTop: '0.5rem',
            color: totalSpent > monthlyBudget ? 'var(--danger)' : 'var(--success)',
          }}>
            {Math.round((totalSpent / (monthlyBudget || 1)) * 100)}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Against {formatCurrency(monthlyBudget)} limit
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Category Breakdown Table with Progress Bars */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Category Distribution
          </h2>

          {categoryReportList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No expense records found for this period.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {categoryReportList.map((cat) => (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({cat.count} txns)</span>
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {formatCurrency(cat.total)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-input)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${cat.percentage}%`,
                      height: '100%',
                      backgroundColor: cat.color,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual Chart Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Proportion Overview
          </h2>
          <CategoryDonutChart expenses={filteredExpenses} />
        </div>
      </div>
    </div>
  );
}

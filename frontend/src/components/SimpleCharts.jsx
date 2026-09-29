import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useExpenses } from '../context/ExpenseContext.jsx';

/**
 * Donut Chart for Category Breakdown
 */
export function CategoryDonutChart({ expenses = [] }) {
  const { formatCurrency } = useSettings();
  const { categories } = useExpenses();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Group by category
  const categoryTotals = {};
  let grandTotal = 0;

  expenses.forEach((item) => {
    const amt = Number(item.amount) || 0;
    const cat = item.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    grandTotal += amt;
  });

  const categoryEntries = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const catMeta = categories.find((c) => c.id === catId) || {
        name: catId,
        color: '#94a3b8',
        icon: '📦',
      };
      const percent = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
      return {
        id: catId,
        name: catMeta.name,
        color: catMeta.color,
        icon: catMeta.icon,
        amount,
        percent,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  if (categoryEntries.length === 0 || grandTotal === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</p>
        <p>No expense data available for charts yet.</p>
      </div>
    );
  }

  // SVG calculations for donut slices
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
          {categoryEntries.map((entry, idx) => {
            const strokeDasharray = `${(entry.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedOffset;
            accumulatedOffset += (entry.percent / 100) * circumference;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={entry.id}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={entry.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  cursor: 'pointer',
                  opacity: hoveredIdx === null || isHovered ? 1 : 0.45,
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {hoveredIdx !== null ? categoryEntries[hoveredIdx].name : 'Total'}
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {hoveredIdx !== null
              ? formatCurrency(categoryEntries[hoveredIdx].amount)
              : formatCurrency(grandTotal)}
          </span>
          <span style={{ fontSize: '0.72rem', color: hoveredIdx !== null ? categoryEntries[hoveredIdx].color : 'var(--text-subtle)' }}>
            {hoveredIdx !== null ? `${categoryEntries[hoveredIdx].percent.toFixed(1)}%` : `${categoryEntries.length} categories`}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {categoryEntries.map((cat, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={cat.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: isHovered ? 'var(--bg-input)' : 'transparent',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: cat.color,
                flexShrink: 0,
              }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatCurrency(cat.amount)} ({cat.percent.toFixed(0)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Trend Bar Chart for Spending over recent days
 */
export function SpendingTrendBarChart({ expenses = [] }) {
  const { formatCurrency } = useSettings();
  const [hoveredDay, setHoveredDay] = useState(null);

  // Group last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  const dayTotals = days.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const sum = expenses
      .filter((exp) => {
        const itemDate = new Date(exp.date);
        return itemDate >= day && itemDate <= dayEnd;
      })
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      date: day,
      dayLabel: day.toLocaleDateString(undefined, { weekday: 'short' }),
      dateLabel: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: sum,
    };
  });

  const maxAmount = Math.max(...dayTotals.map((d) => d.amount), 50);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flex: 1,
        minHeight: '180px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '1rem 0.5rem 0.5rem 0.5rem',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
      }}>
        {dayTotals.map((day, idx) => {
          const heightPercent = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
          const isHovered = hoveredDay === idx;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredDay(idx)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: '-32px',
                  background: 'var(--bg-sidebar)',
                  color: 'var(--text-main)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border)',
                  zIndex: 10,
                }}>
                  {formatCurrency(day.amount)}
                </div>
              )}

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${Math.max(heightPercent, 4)}%`,
                  background: isHovered
                    ? 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)'
                    : day.amount > 0
                    ? 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)'
                    : 'var(--bg-input)',
                  borderRadius: '6px 6px 2px 2px',
                  transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease',
                  boxShadow: isHovered && day.amount > 0 ? '0 0 12px var(--primary-glow)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Axis Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.5rem 0 0.5rem' }}>
        {dayTotals.map((day, idx) => (
          <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {day.dayLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

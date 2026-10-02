import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  generateHtmlReport,
  generateTextSummary,
  openPrintableReport,
  downloadCsvExport,
  downloadJsonExport,
} from '../utils/reportGenerator.js';

export default function ExportModal({ isOpen, onClose }) {
  const { expenses, categories, addToast } = useExpenses();
  const { formatCurrency, activeCurrency } = useSettings();
  const { user } = useAuth();

  const [period, setPeriod] = useState('ALL'); // 'ALL', '30D', 'MONTH', 'YEAR'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  // Filter expenses based on modal options
  const filtered = expenses.filter((exp) => {
    // Category filter
    if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
      return false;
    }

    // Period filter
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
    if (period === 'YEAR') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalSpent = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Highest expense
  const highestExpense = filtered.reduce(
    (max, curr) => (Number(curr.amount) > Number(max.amount || 0) ? curr : max),
    {}
  );

  // Category breakdown for summary
  const categoryStatsMap = {};
  filtered.forEach((exp) => {
    const cat = exp.category || 'Other';
    if (!categoryStatsMap[cat]) categoryStatsMap[cat] = { total: 0, count: 0 };
    categoryStatsMap[cat].total += Number(exp.amount) || 0;
    categoryStatsMap[cat].count += 1;
  });

  const categoryStats = Object.entries(categoryStatsMap)
    .map(([catId, stats]) => {
      const meta = categories.find((c) => c.id === catId) || {
        name: catId,
        icon: '📦',
      };
      return {
        id: catId,
        name: meta.name,
        icon: meta.icon,
        total: stats.total,
        count: stats.count,
        percentage: totalSpent > 0 ? (stats.total / totalSpent) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const periodLabels = {
    ALL: 'All Time',
    '30D': 'Last 30 Days',
    MONTH: 'This Month',
    YEAR: 'This Year',
  };

  const reportPayload = {
    expenses: filtered,
    totalSpent,
    formatCurrency,
    user,
    periodLabel: periodLabels[period] || 'All Time',
    categoryStats,
    highestExpense,
  };

  // Handlers
  const handlePrintPdf = () => {
    if (filtered.length === 0) {
      addToast('No expenses found for the selected filter.', 'warning');
      return;
    }
    const html = generateHtmlReport(reportPayload);
    openPrintableReport(html);
    addToast('Opening print-ready report in new tab…', 'info');
  };

  const handleCopyText = async () => {
    if (filtered.length === 0) {
      addToast('No expenses found for the selected filter.', 'warning');
      return;
    }
    const summary = generateTextSummary(reportPayload);
    try {
      await navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      addToast('Report summary copied to clipboard! Ready to share.', 'success');
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      addToast('Failed to copy to clipboard automatically.', 'error');
    }
  };

  const handleDownloadCsv = () => {
    if (filtered.length === 0) {
      addToast('No expenses found for the selected filter.', 'warning');
      return;
    }
    downloadCsvExport(filtered, activeCurrency.code);
    addToast('CSV export downloaded successfully!', 'success');
  };

  const handleDownloadJson = () => {
    if (filtered.length === 0) {
      addToast('No expenses found for the selected filter.', 'warning');
      return;
    }
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email },
      currency: activeCurrency.code,
      totalSpent,
      transactionCount: filtered.length,
      period: periodLabels[period],
      categoriesSummary: categoryStats,
      expenses: filtered,
    };
    downloadJsonExport(
      exportData,
      `expenssor_report_${period.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`
    );
    addToast('JSON report backup downloaded!', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card"
        style={{ maxWidth: '640px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📤</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Export & Share Report
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Generate reports other people can view, download, or print as PDF.
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Time Range</label>
              <select
                className="form-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="ALL">All Time</option>
                <option value="30D">Last 30 Days</option>
                <option value="MONTH">This Month</option>
                <option value="YEAR">This Year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Preview Card */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Selected Report Total
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                {formatCurrency(totalSpent)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div><strong>{filtered.length}</strong> transactions</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Currency: {activeCurrency.code} ({activeCurrency.symbol})</div>
            </div>
          </div>

          {/* Export Action Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
            {/* 1. PDF / Printable Report */}
            <div
              className="glass-card"
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>🖨️</span>
                  <span>Print / Save as PDF</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                  Opens a styled, visual report document other people can view or save as PDF.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handlePrintPdf}
                disabled={filtered.length === 0}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
              >
                <span>View & Print PDF</span>
              </button>
            </div>

            {/* 2. Copy Shareable Summary */}
            <div
              className="glass-card"
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>📋</span>
                  <span>Shareable Summary</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                  Copy formatted text report to paste into Telegram, WhatsApp, Email, or Slack.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleCopyText}
                disabled={filtered.length === 0}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
              >
                <span>{copySuccess ? '✓ Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
            </div>

            {/* 3. CSV Spreadsheet */}
            <div
              className="glass-card"
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>📊</span>
                  <span>CSV Spreadsheet</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                  Download Excel & Google Sheets compatible CSV data file.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleDownloadCsv}
                disabled={filtered.length === 0}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
              >
                <span>Download CSV</span>
              </button>
            </div>

            {/* 4. JSON Backup */}
            <div
              className="glass-card"
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>💾</span>
                  <span>JSON Data Backup</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', lineHeight: 1.4 }}>
                  Full structured JSON payload including metadata and categories.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleDownloadJson}
                disabled={filtered.length === 0}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
              >
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'flex-end', paddingTop: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

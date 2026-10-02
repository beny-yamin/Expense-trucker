import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext.jsx';

import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';

// Lazy-loaded pages for Vite dynamic chunk code-splitting
const AuthPage = React.lazy(() => import('./pages/AuthPage.jsx'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.jsx'));
const ExpensesPage = React.lazy(() => import('./pages/ExpensesPage.jsx'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage.jsx'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.jsx'));

// Lazy-loaded modals for lighter initial payload
const ExpenseModal = React.lazy(() => import('./components/ExpenseModal.jsx'));
const DeleteConfirmModal = React.lazy(() => import('./components/DeleteConfirmModal.jsx'));

function PageFallback() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid var(--border, #334155)',
          borderTopColor: 'var(--primary, #3b82f6)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>Loading view…</p>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const { deleteExpense } = useExpenses();

  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Listen for swipe-to-open custom event from Sidebar touch gestures
  React.useEffect(() => {
    const handleSidebarOpen = () => setIsSidebarOpen(true);
    document.addEventListener('sidebar:open', handleSidebarOpen);
    return () => document.removeEventListener('sidebar:open', handleSidebarOpen);
  }, []);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Wait for Firebase to resolve persisted auth session before rendering
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<PageFallback />}>
        <AuthPage />
      </React.Suspense>
    );
  }

  const handleOpenAdd = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenDelete = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (expenseToDelete?._id) {
      await deleteExpense(expenseToDelete._id);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          activePage={activePage}
          onOpenAddModal={handleOpenAdd}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigate={(page) => setActivePage(page)}
        />

        <main className="page-container">
          <React.Suspense fallback={<PageFallback />}>
            {activePage === 'dashboard' && (
              <DashboardPage
                onOpenAddModal={handleOpenAdd}
                onEditExpense={handleOpenEdit}
                onDeleteExpense={handleOpenDelete}
                onNavigate={(page) => setActivePage(page)}
              />
            )}

            {activePage === 'expenses' && (
              <ExpensesPage
                onOpenAddModal={handleOpenAdd}
                onEditExpense={handleOpenEdit}
                onDeleteExpense={handleOpenDelete}
              />
            )}

            {activePage === 'reports' && (
              <ReportsPage />
            )}

            {activePage === 'settings' && (
              <SettingsPage />
            )}
          </React.Suspense>
        </main>
      </div>

      {/* Add / Edit Expense Modal (Lazy loaded on demand) */}
      <React.Suspense fallback={null}>
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          expenseToEdit={expenseToEdit}
        />

        {/* Delete Confirmation Modal (Lazy loaded on demand) */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          expenseTitle={expenseToDelete?.title}
        />
      </React.Suspense>

      {/* Toast Feedback */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ExpenseProvider>
          <MainApp />
        </ExpenseProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

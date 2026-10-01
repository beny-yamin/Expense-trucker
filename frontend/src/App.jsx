import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext.jsx';

import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import ExpenseModal from './components/ExpenseModal.jsx';
import DeleteConfirmModal from './components/DeleteConfirmModal.jsx';
import Toast from './components/Toast.jsx';

import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

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
    return <AuthPage />;
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
        />

        <main className="page-container">
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
        </main>
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        expenseTitle={expenseToDelete?.title}
      />

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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import expenseService from '../services/expenseService.js';

const ExpenseContext = createContext();

export const DEFAULT_CATEGORIES = [
  { id: 'Food', name: 'Food & Dining', icon: '🍔', badgeClass: 'cat-food', color: '#f97316' },
  { id: 'Transportation', name: 'Transportation', icon: '🚗', badgeClass: 'cat-transport', color: '#3b82f6' },
  { id: 'Housing', name: 'Housing & Rent', icon: '🏠', badgeClass: 'cat-housing', color: '#a855f7' },
  { id: 'Entertainment', name: 'Entertainment', icon: '🎬', badgeClass: 'cat-entertainment', color: '#ec4899' },
  { id: 'Utilities', name: 'Utilities & Bills', icon: '⚡', badgeClass: 'cat-utilities', color: '#14b8a6' },
  { id: 'Healthcare', name: 'Healthcare', icon: '💊', badgeClass: 'cat-healthcare', color: '#ef4444' },
  { id: 'Shopping', name: 'Shopping', icon: '🛍️', badgeClass: 'cat-shopping', color: '#eab308' },
  { id: 'Personal', name: 'Personal Care', icon: '✨', badgeClass: 'cat-personal', color: '#818cf8' },
  { id: 'Other', name: 'Other', icon: '📦', badgeClass: 'cat-other', color: '#94a3b8' },
];

const SEED_DATA = [
  { _id: 'seed-1', title: 'Monthly Apartment Rent', amount: 1250, category: 'Housing', date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { _id: 'seed-2', title: 'Whole Foods Groceries', amount: 142.80, category: 'Food', date: new Date(Date.now() - 86400000 * 3).toISOString() },
  { _id: 'seed-3', title: 'Uber ride downtown', amount: 28.50, category: 'Transportation', date: new Date(Date.now() - 86400000 * 4).toISOString() },
  { _id: 'seed-4', title: 'Fiber Internet Bill', amount: 75.00, category: 'Utilities', date: new Date(Date.now() - 86400000 * 6).toISOString() },
  { _id: 'seed-5', title: 'Movie Theater Tickets', amount: 38.00, category: 'Entertainment', date: new Date(Date.now() - 86400000 * 8).toISOString() },
  { _id: 'seed-6', title: 'New Running Shoes', amount: 119.99, category: 'Shopping', date: new Date(Date.now() - 86400000 * 10).toISOString() },
  { _id: 'seed-7', title: 'Pharmacy Prescription', amount: 35.40, category: 'Healthcare', date: new Date(Date.now() - 86400000 * 12).toISOString() },
  { _id: 'seed-8', title: 'Barber & Grooming', amount: 45.00, category: 'Personal', date: new Date(Date.now() - 86400000 * 14).toISOString() },
];

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expenseService.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setExpenses(data);
      } else if (Array.isArray(data)) {
        // Backend returned empty array
        setExpenses(data);
      } else {
        setExpenses(SEED_DATA);
      }
      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend unavailable, using local mock data:', err.message);
      setBackendConnected(false);
      const cached = localStorage.getItem('expenssor_local_expenses');
      setExpenses(cached ? JSON.parse(cached) : SEED_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Subscribe to live expense updates from expenseService
  useEffect(() => {
    const unsubscribe = expenseService.subscribe((event) => {
      if (event.action === 'create' && event.payload) {
        setExpenses(prev => {
          if (prev.some(item => item._id === event.payload._id)) return prev;
          return [event.payload, ...prev];
        });
      } else if (event.action === 'update' && event.payload) {
        setExpenses(prev =>
          prev.map(item => (item._id === event.payload._id ? { ...item, ...event.payload } : item))
        );
      } else if (event.action === 'delete' && event.payload?.id) {
        setExpenses(prev => prev.filter(item => item._id !== event.payload.id));
      } else if (event.action === 'refresh') {
        loadExpenses();
      }
    });

    return unsubscribe;
  }, [loadExpenses]);

  // Persist locally as fallback
  useEffect(() => {
    try {
      localStorage.setItem('expenssor_local_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  const addExpense = async (expenseData) => {
    try {
      let created;
      try {
        created = await expenseService.create(expenseData);
        setBackendConnected(true);
      } catch (backendErr) {
        console.warn('Backend unavailable during create, storing locally:', backendErr.message);
        setBackendConnected(false);
        created = {
          _id: `local_${Date.now()}`,
          ...expenseData,
          date: expenseData.date || new Date().toISOString(),
        };
        setExpenses(prev => [created, ...prev]);
      }
      addToast(`Added "${expenseData.title}" successfully!`, 'success');
      return created;
    } catch (err) {
      addToast(err.message || 'Failed to add expense', 'error');
      throw err;
    }
  };

  const updateExpense = async (id, updatedData) => {
    try {
      let updated;
      try {
        if (!id.startsWith('local_') && !id.startsWith('seed-')) {
          updated = await expenseService.update(id, updatedData);
          setBackendConnected(true);
        } else {
          updated = { _id: id, ...updatedData };
          setExpenses(prev => prev.map(item => (item._id === id ? { ...item, ...updated } : item)));
        }
      } catch (backendErr) {
        console.warn('Backend unavailable during update, updating locally:', backendErr.message);
        setBackendConnected(false);
        updated = { _id: id, ...updatedData };
        setExpenses(prev => prev.map(item => (item._id === id ? { ...item, ...updated } : item)));
      }
      addToast(`Updated "${updatedData.title}" successfully!`, 'success');
      return updated;
    } catch (err) {
      addToast(err.message || 'Failed to update expense', 'error');
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    try {
      try {
        if (!id.startsWith('local_') && !id.startsWith('seed-')) {
          await expenseService.delete(id);
          setBackendConnected(true);
        }
      } catch (backendErr) {
        console.warn('Backend unavailable during delete, removing locally:', backendErr.message);
        setBackendConnected(false);
      }
      setExpenses(prev => prev.filter(item => item._id !== id));
      addToast('Expense deleted successfully!', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to delete expense', 'error');
      throw err;
    }
  };

  const addCategory = (category) => {
    setCategories(prev => [...prev, category]);
    addToast(`Added category "${category.name}"`, 'success');
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        categories,
        loading,
        backendConnected,
        toasts,
        addToast,
        removeToast,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        refreshExpenses: loadExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    // Graceful fallback if used outside Provider
    return {
      expenses: [],
      categories: DEFAULT_CATEGORIES,
      loading: false,
      backendConnected: false,
      addToast: () => {},
      removeToast: () => {},
      addExpense: async () => {},
      updateExpense: async () => {},
      deleteExpense: async () => {},
      addCategory: () => {},
      refreshExpenses: async () => {},
    };
  }
  return context;
}

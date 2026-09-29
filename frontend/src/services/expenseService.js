import apiClient from './apiClient.js';

/**
 * expenseService.js
 * Bridges frontend components to backend /api/expenses endpoints.
 * Supports pub/sub subscriptions for real-time live UI updates across components.
 */

const ENDPOINT = '/expenses';

// Real-time live update subscribers
const subscribers = new Set();

/**
 * Subscribe to expense change events (create, update, delete, refresh).
 *
 * @param {Function} callback - Function called on expense updates: ({ action, payload, timestamp }) => void
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToExpenses(callback) {
  if (typeof callback === 'function') {
    subscribers.add(callback);
  }
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Broadcast an event to all live subscribers.
 *
 * @param {string} action - 'create' | 'update' | 'delete' | 'refresh'
 * @param {any} payload - The relevant data or object
 */
export function notifySubscribers(action, payload) {
  const event = { action, payload, timestamp: Date.now() };
  subscribers.forEach((callback) => {
    try {
      callback(event);
    } catch (err) {
      console.error('[expenseService] Subscriber error:', err);
    }
  });
}

/**
 * Fetch all expenses from backend.
 * Backend route: GET /api/expenses
 * 
 * @returns {Promise<Array>} List of expense objects
 */
export async function getAllExpenses() {
  const response = await apiClient.get(ENDPOINT);
  // Backend returns { success: true, count: N, data: [...] }
  const expenses = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];
  return expenses;
}

/**
 * Fetch a single expense by its ID.
 * Backend route: GET /api/expenses/:id
 * 
 * @param {string} id - Expense ID
 * @returns {Promise<object>} The requested expense object
 */
export async function getExpenseById(id) {
  if (!id) throw new Error('Expense ID is required');
  const response = await apiClient.get(`${ENDPOINT}/${id}`);
  return response?.data || response;
}

/**
 * Create a new expense.
 * Backend route: POST /api/expenses
 * 
 * @param {object} expenseData
 * @param {string} expenseData.title - Expense title/name
 * @param {number} expenseData.amount - Expense amount
 * @param {string} expenseData.category - Expense category (e.g. Food, Transport, Bills)
 * @param {string|Date} [expenseData.date] - Optional date of the expense
 * @returns {Promise<object>} The newly created expense object
 */
export async function createExpense(expenseData) {
  const response = await apiClient.post(ENDPOINT, expenseData);
  const created = response?.data || response;
  notifySubscribers('create', created);
  return created;
}

/**
 * Update an existing expense by ID.
 * Backend route: PUT /api/expenses/:id
 * 
 * @param {string} id - Expense ID
 * @param {object} expenseData - Updated fields ({ title, amount, category, date })
 * @returns {Promise<object>} The updated expense object
 */
export async function updateExpense(id, expenseData) {
  if (!id) throw new Error('Expense ID is required');
  const response = await apiClient.put(`${ENDPOINT}/${id}`, expenseData);
  const updated = response?.data || response;
  notifySubscribers('update', updated);
  return updated;
}

/**
 * Delete an expense by ID.
 * Backend route: DELETE /api/expenses/:id
 * 
 * @param {string} id - Expense ID
 * @returns {Promise<object>} Deletion confirmation response
 */
export async function deleteExpense(id) {
  if (!id) throw new Error('Expense ID is required');
  const response = await apiClient.delete(`${ENDPOINT}/${id}`);
  notifySubscribers('delete', { id });
  return response;
}

const expenseService = {
  getAll: getAllExpenses,
  getById: getExpenseById,
  create: createExpense,
  update: updateExpense,
  delete: deleteExpense,
  subscribe: subscribeToExpenses,
  notify: notifySubscribers,
};

export default expenseService;

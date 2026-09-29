/**
 * services/index.js
 * Unified export point for all frontend API communication services.
 */

export { default as apiClient } from './apiClient.js';
export {
  default as expenseService,
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  subscribeToExpenses,
  notifySubscribers,
} from './expenseService.js';

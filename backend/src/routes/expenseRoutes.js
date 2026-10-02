import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Retain exact existing behavior: return all expenses sorted by date (-1).
    // If an email query param is provided, leverage the indexed userEmail field.
    const query = req.query.email ? { userEmail: req.query.email.toLowerCase() } : {};
    const expenses = await Expense.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch expenses',
      error: error.message,
    });
  }
});

// @route   GET /api/expenses/export/csv
// @desc    Download CSV export of expenses
// @access  Public / Authenticated
router.get('/export/csv', async (req, res) => {
  try {
    const userEmail = req.firebaseUser?.email || req.query.email;
    const query = userEmail ? { userEmail: userEmail.toLowerCase() } : {};
    const expenses = await Expense.find(query).sort({ date: -1 });

    const headers = ['Date', 'Description', 'Category', 'Amount', 'UserEmail'];
    const rows = expenses.map((exp) => [
      new Date(exp.date).toISOString().split('T')[0],
      `"${(exp.title || '').replace(/"/g, '""')}"`,
      `"${(exp.category || '').replace(/"/g, '""')}"`,
      exp.amount,
      `"${(exp.userEmail || '').replace(/"/g, '""')}"`,
    ]);

    const csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expenses_export_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV export',
      error: error.message,
    });
  }
});

// @route   GET /api/expenses/export/json
// @desc    Download JSON backup of expenses
// @access  Public / Authenticated
router.get('/export/json', async (req, res) => {
  try {
    const userEmail = req.firebaseUser?.email || req.query.email;
    const query = userEmail ? { userEmail: userEmail.toLowerCase() } : {};
    const expenses = await Expense.find(query).sort({ date: -1 });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expenses_backup_${new Date().toISOString().split('T')[0]}.json"`
    );
    res.status(200).json({
      exportedAt: new Date().toISOString(),
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate JSON export',
      error: error.message,
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch expense',
      error: error.message,
    });
  }
});

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    // Validate required fields
    if (!title || amount === undefined || amount === null || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, and category',
      });
    }

    const userEmail = (req.firebaseUser?.email || req.body.userEmail || '').trim().toLowerCase() || undefined;

    const newExpense = new Expense({
      title,
      amount,
      category,
      date: date || Date.now(),
      userEmail,
    });

    const savedExpense = await newExpense.save();

    res.status(201).json({
      success: true,
      data: savedExpense,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to add expense',
      error: error.message,
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an existing expense
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, amount, category, date },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to update expense',
      error: error.message,
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to delete expense',
      error: error.message,
    });
  }
});

export default router;

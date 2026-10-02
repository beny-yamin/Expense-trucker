import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

// Compound index for querying user's expenses by date
expenseSchema.index({ userEmail: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;

const db = require('../utils/db');

const getExpenses = async (req, res) => {
  try {
    const expenses = await db('expenses')
      .leftJoin('users', 'expenses.created_by', 'users.id')
      .select('expenses.*', 'users.username as creator_name')
      .orderBy('expenses.expense_date', 'desc');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
};

const getExpenseById = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await db('expenses').where({ id }).first();
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense', error: error.message });
  }
};

const createExpense = async (req, res) => {
  const { expense_type, amount, notes, expense_date } = req.body;
  const userId = req.user.id;

  if (!expense_type || !amount) {
    return res.status(400).json({ message: 'expense_type and amount are required' });
  }

  try {
    const [expense] = await db('expenses').insert({
      expense_type,
      amount,
      notes,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      created_by: userId
    }).returning('*');

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense record', error: error.message });
  }
};

const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { expense_type, amount, notes, expense_date } = req.body;

  try {
    const updatedRows = await db('expenses').where({ id }).update({
      expense_type,
      amount,
      notes,
      expense_date,
      updated_at: db.fn.now()
    });

    if (!updatedRows) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    const updatedExpense = await db('expenses').where({ id }).first();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense record', error: error.message });
  }
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db('expenses').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ message: 'Expense record not found' });
    }
    res.json({ message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense record', error: error.message });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};


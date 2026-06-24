const express = require('express');
const { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'Manager']), getExpenses);
router.get('/:id', authenticate, authorize(['Admin', 'Manager']), getExpenseById);
router.post('/', authenticate, authorize(['Admin', 'Manager']), createExpense);
router.put('/:id', authenticate, authorize(['Admin', 'Manager']), updateExpense);
router.delete('/:id', authenticate, authorize(['Admin']), deleteExpense);

module.exports = router;

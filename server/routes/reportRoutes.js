
const express = require('express');
const { getSalesReport, getPurchaseReport, getProfitReport, getStockReport, getExpiryReport, getDashboardStats } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', authenticate, getDashboardStats);
router.get('/sales', authenticate, authorize(['Admin', 'Manager']), getSalesReport);
router.get('/purchases', authenticate, authorize(['Admin', 'Manager']), getPurchaseReport);
router.get('/profit', authenticate, authorize(['Admin', 'Manager']), getProfitReport);
router.get('/stock', authenticate, authorize(['Admin', 'Manager']), getStockReport);
router.get('/expiry', authenticate, authorize(['Admin', 'Manager']), getExpiryReport);

module.exports = router;

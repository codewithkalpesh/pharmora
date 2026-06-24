const express = require('express');
const { getPurchases, getPurchaseById, createPurchase, returnPurchase } = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['Admin', 'Manager']), getPurchases);
router.get('/:id', authenticate, authorize(['Admin', 'Manager']), getPurchaseById);
router.post('/', authenticate, authorize(['Admin', 'Manager']), createPurchase);
router.post('/:id/return', authenticate, authorize(['Admin', 'Manager']), returnPurchase);

module.exports = router;

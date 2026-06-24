const express = require('express');
const { getSales, getSaleById, createSale, returnSale } = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getSales);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSale);
router.post('/:id/refund', authenticate, authorize(['Admin', 'Manager', 'Pharmacist']), returnSale);

module.exports = router;

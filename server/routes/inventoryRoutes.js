const express = require('express');
const { getInventory, getLowStock, getNearExpiry, getBatchesByMedicine, adjustStock } = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getInventory);
router.get('/low-stock', authenticate, getLowStock);
router.get('/near-expiry', authenticate, getNearExpiry);
router.get('/batches/:medicine_id', authenticate, getBatchesByMedicine);
router.post('/adjust', authenticate, authorize(['Admin', 'Manager', 'Pharmacist']), adjustStock);

module.exports = router;

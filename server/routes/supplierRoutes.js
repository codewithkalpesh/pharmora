const express = require('express');
const { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getSuppliers);
router.get('/:id', authenticate, getSupplierById);
router.post('/', authenticate, authorize(['Admin', 'Manager']), createSupplier);
router.put('/:id', authenticate, authorize(['Admin', 'Manager']), updateSupplier);
router.delete('/:id', authenticate, authorize(['Admin']), deleteSupplier);

module.exports = router;

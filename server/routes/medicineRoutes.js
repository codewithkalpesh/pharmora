const express = require('express');
const { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getMedicines);
router.get('/:id', authenticate, getMedicineById);
router.post('/', authenticate, authorize(['Admin', 'Manager']), createMedicine);
router.put('/:id', authenticate, authorize(['Admin', 'Manager']), updateMedicine);
router.delete('/:id', authenticate, authorize(['Admin']), deleteMedicine);

module.exports = router;

const express = require('express');
const { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getCustomers);
router.get('/:id', authenticate, getCustomerById);
router.post('/', authenticate, createCustomer);
router.put('/:id', authenticate, updateCustomer);
router.delete('/:id', authenticate, authorize(['Admin']), deleteCustomer);

module.exports = router;

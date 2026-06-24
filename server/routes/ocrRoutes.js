const express = require('express');
const multer = require('multer');
const { scanInvoice } = require('../controllers/ocrController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer configured to write to server/uploads/ temp directory
const upload = multer({ dest: 'uploads/' });

router.post('/scan', authenticate, authorize(['Admin', 'Manager']), upload.single('invoice'), scanInvoice);

module.exports = router;

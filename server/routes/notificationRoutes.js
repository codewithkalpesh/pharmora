const express = require('express');
const { getNotifications, markAsRead, scanForAlerts } = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.post('/scan', authenticate, authorize(['Admin', 'Manager', 'Pharmacist']), scanForAlerts);

module.exports = router;

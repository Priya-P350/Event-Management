const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireStaffOrAdmin } = require('../middleware/rbac');
const { scanLimiter } = require('../middleware/rateLimiter');

router.post('/scan', scanLimiter, optionalAuth, checkinController.scanTicket);
router.get('/events/:id/attendance', authenticateToken, requireStaffOrAdmin, checkinController.getEventAttendance);

module.exports = router;

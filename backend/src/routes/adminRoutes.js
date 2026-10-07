const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireStaffOrAdmin } = require('../middleware/rbac');

router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboardStats);
router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);
router.post('/users', authenticateToken, requireAdmin, adminController.createUser);
router.put('/users/:id/role', authenticateToken, requireAdmin, adminController.updateUserRole);
router.delete('/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);

router.get('/registrations', authenticateToken, requireAdmin, adminController.getAllRegistrations);
router.get('/payments', authenticateToken, requireAdmin, adminController.getAllPayments);
router.get('/attendance', authenticateToken, requireStaffOrAdmin, adminController.getAllAttendance);

router.get('/export/registrations', authenticateToken, requireAdmin, adminController.exportRegistrationsCSV);
router.get('/export/payments', authenticateToken, requireAdmin, adminController.exportPaymentsCSV);

router.post('/refund', authenticateToken, requireAdmin, adminController.initiateRefund);

module.exports = router;

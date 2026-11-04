const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticateToken } = require('../middleware/auth');

router.post('/generate', authenticateToken, qrController.generateAndEmailQrCode);
router.get('/member-pass', authenticateToken, qrController.getMemberPass);
router.post('/member-pass/regenerate', authenticateToken, qrController.regenerateMemberPass);

module.exports = router;

const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticateToken } = require('../middleware/auth');

router.post('/generate', authenticateToken, qrController.generateAndEmailQrCode);

module.exports = router;

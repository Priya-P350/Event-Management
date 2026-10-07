const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/verify', paymentController.verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;

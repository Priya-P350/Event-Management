const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/my-tickets', authenticateToken, ticketController.getMyTickets);
router.get('/:token', optionalAuth, ticketController.getTicketByToken);

module.exports = router;

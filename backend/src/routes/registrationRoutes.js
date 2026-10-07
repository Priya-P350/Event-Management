const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, registrationController.createRegistration);
router.get('/my-registrations', authenticateToken, registrationController.getMyRegistrations);
router.get('/:id', optionalAuth, registrationController.getRegistrationById);

module.exports = router;

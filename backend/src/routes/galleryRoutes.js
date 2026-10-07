const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

router.get('/events/:id/images', optionalAuth, galleryController.getEventImages);
router.post('/events/:id/images', authenticateToken, requireAdmin, galleryController.addEventImage);
router.delete('/events/:id/images/:imageId', authenticateToken, requireAdmin, galleryController.deleteEventImage);

module.exports = router;

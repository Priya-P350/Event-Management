const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');

async function getEventImages(req, res, next) {
    try {
        const eventId = req.params.id;
        const images = await dbQuery.getEventImages(eventId);
        res.json({ success: true, count: images.length, images });
    } catch (err) {
        next(err);
    }
}

async function addEventImage(req, res, next) {
    try {
        const eventId = req.params.id;
        const { image_url, caption } = req.body;

        if (!image_url) {
            return res.status(400).json({ success: false, message: 'Image URL is required.' });
        }

        const newImage = {
            id: uuidv4(),
            event_id: eventId,
            image_url,
            caption: caption || '',
            uploaded_by: req.user ? req.user.id : null
        };

        await dbQuery.addEventImage(newImage);
        res.status(201).json({ success: true, message: 'Event photo added to gallery.', image: newImage });
    } catch (err) {
        next(err);
    }
}

async function deleteEventImage(req, res, next) {
    try {
        const { imageId } = req.params;
        await dbQuery.deleteEventImage(imageId);
        res.json({ success: true, message: 'Image removed from gallery.' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getEventImages,
    addEventImage,
    deleteEventImage
};

const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');

async function getEvents(req, res, next) {
    try {
        const events = await dbQuery.getEvents(req.query);
        res.json({ success: true, count: events.length, events });
    } catch (err) {
        next(err);
    }
}

async function getEventById(req, res, next) {
    try {
        const event = await dbQuery.getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        res.json({ success: true, event });
    } catch (err) {
        next(err);
    }
}

async function createEvent(req, res, next) {
    try {
        const {
            title, description, category, cover_image_url,
            event_date, start_time, end_time, venue, address,
            google_maps_url, ticket_price, capacity, registration_open_at,
            registration_close_at, status,
            iti_trade, iti_institute, iti_eligibility
        } = req.body;

        if (!title || !event_date || !venue || !address) {
            return res.status(400).json({ success: false, message: 'Title, event date, venue, and address are required.' });
        }

        let finalDescription = description || '';
        if (iti_trade || iti_institute || iti_eligibility) {
            const metaStr = JSON.stringify({
                trade: iti_trade || '',
                institute: iti_institute || '',
                eligibility: iti_eligibility || ''
            });
            finalDescription = finalDescription.replace(/---ITI_META---[\s\S]*?---END_ITI_META---\n?/g, '');
            finalDescription = `---ITI_META---\n${metaStr}\n---END_ITI_META---\n${finalDescription.trim()}`;
        }

        const newEvent = {
            id: uuidv4(),
            title,
            description: finalDescription,
            category: category || 'General',
            cover_image_url: cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
            event_date,
            start_time: start_time || '09:00:00',
            end_time: end_time || '17:00:00',
            venue,
            address,
            google_maps_url: google_maps_url || 'https://maps.google.com',
            ticket_price: parseFloat(ticket_price || 0),
            capacity: parseInt(capacity || 100, 10),
            registration_open_at: registration_open_at || new Date().toISOString(),
            registration_close_at: registration_close_at || null,
            status: status || 'registration_open',
            created_by: req.user ? req.user.id : null
        };

        const created = await dbQuery.createEvent(newEvent);
        res.status(201).json({ success: true, message: 'Event created successfully.', event: created });
    } catch (err) {
        next(err);
    }
}

async function updateEvent(req, res, next) {
    try {
        const { iti_trade, iti_institute, iti_eligibility, description, ...otherBody } = req.body;
        let updates = { ...otherBody };

        if (description !== undefined || iti_trade !== undefined || iti_institute !== undefined || iti_eligibility !== undefined) {
            // Fetch existing to preserve or update description
            const existing = await dbQuery.getEventById(req.params.id);
            let baseDesc = description !== undefined ? description : (existing ? existing.description : '');
            
            let trade = iti_trade !== undefined ? iti_trade : (existing ? existing.iti_trade : '');
            let institute = iti_institute !== undefined ? iti_institute : (existing ? existing.iti_institute : '');
            let eligibility = iti_eligibility !== undefined ? iti_eligibility : (existing ? existing.iti_eligibility : '');

            if (trade || institute || eligibility) {
                const metaStr = JSON.stringify({ trade, institute, eligibility });
                baseDesc = baseDesc.replace(/---ITI_META---[\s\S]*?---END_ITI_META---\n?/g, '');
                updates.description = `---ITI_META---\n${metaStr}\n---END_ITI_META---\n${baseDesc.trim()}`;
            } else if (description !== undefined) {
                updates.description = description.replace(/---ITI_META---[\s\S]*?---END_ITI_META---\n?/g, '').trim();
            }
        }

        const updated = await dbQuery.updateEvent(req.params.id, updates);
        res.json({ success: true, message: 'Event updated successfully.', event: updated });
    } catch (err) {
        next(err);
    }
}

async function deleteEvent(req, res, next) {
    try {
        await dbQuery.updateEvent(req.params.id, { status: 'cancelled' });
        res.json({ success: true, message: 'Event cancelled successfully.' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};

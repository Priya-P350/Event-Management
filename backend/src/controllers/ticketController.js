const dbQuery = require('../config/db');

async function getMyTickets(req, res, next) {
    try {
        const registrations = await dbQuery.getUserRegistrations(req.user.id);
        const tickets = registrations
            .filter(r => r.ticket)
            .map(r => ({
                ...r.ticket,
                event: r.event,
                guest_name: r.guest_name,
                guest_email: r.guest_email,
                guest_phone: r.guest_phone,
                payment_status: r.payment ? r.payment.status : 'pending'
            }));

        res.json({ success: true, count: tickets.length, tickets });
    } catch (err) {
        next(err);
    }
}

async function getTicketByToken(req, res, next) {
    try {
        const token = req.params.token;
        const ticket = await dbQuery.getTicketByToken(token);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }
        res.json({ success: true, ticket });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getMyTickets,
    getTicketByToken
};

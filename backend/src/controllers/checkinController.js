const dbQuery = require('../config/db');

async function scanTicket(req, res, next) {
    try {
        let { ticketToken, eventId, deviceInfo } = req.body;

        if (!ticketToken) {
            return res.status(400).json({ success: false, message: 'Ticket token is required.' });
        }

        // Clean raw scanned text if prefix "EVENT-TICKET:" is included
        if (ticketToken.includes('EVENT-TICKET:')) {
            ticketToken = ticketToken.split('EVENT-TICKET:')[1].trim();
        }

        const ticket = await dbQuery.getTicketByToken(ticketToken);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                code: 'INVALID_TICKET',
                title: 'INVALID TICKET',
                message: 'No active ticket record found matching this QR code token.'
            });
        }

        // Event association check
        if (eventId && ticket.event_id !== eventId) {
            return res.status(400).json({
                success: false,
                code: 'WRONG_EVENT',
                title: 'INVALID EVENT TICKET',
                message: `This ticket belongs to another event: "${ticket.event ? ticket.event.title : 'Different Event'}"`,
                ticket
            });
        }

        // Check if ticket status is cancelled or refunded
        if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
            return res.status(400).json({
                success: false,
                code: 'TICKET_CANCELLED',
                title: 'TICKET CANCELLED',
                message: `This ticket is marked as ${ticket.status.toUpperCase()} and cannot be used for entry.`
            });
        }

        // Check payment status
        const registration = ticket.registration || await dbQuery.getRegistrationById(ticket.registration_id);

        if (registration && registration.registration_status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                code: 'PAYMENT_NOT_VERIFIED',
                title: 'PAYMENT NOT VERIFIED',
                message: 'This registration has not been paid or confirmed.',
                guestName: registration ? registration.guest_name : 'Guest'
            });
        }

        // Atomic Check-in Process
        const staffUserId = req.user ? req.user.id : null;
        const result = await dbQuery.processCheckinAtomic(
            ticket.id,
            ticket.event_id,
            ticket.registration_id,
            staffUserId,
            deviceInfo || 'Gate Camera Scanner'
        );

        if (!result.success) {
            if (result.reason === 'ALREADY_USED') {
                const checkinTime = result.existingCheckin ? new Date(result.existingCheckin.checked_in_at || result.existingCheckin.checkedInAt).toLocaleTimeString() : 'Earlier Today';
                return res.status(409).json({
                    success: false,
                    code: 'ALREADY_USED',
                    title: 'TICKET ALREADY USED',
                    message: `This QR ticket was already scanned and checked in at ${checkinTime}. Duplicate entry denied.`,
                    originalCheckinTime: result.existingCheckin ? (result.existingCheckin.checked_in_at || result.existingCheckin.checkedInAt) : null,
                    guestName: registration ? registration.guest_name : (ticket.user ? ticket.user.name : 'Guest'),
                    ticketNumber: ticket.ticket_number
                });
            }

            return res.status(400).json({
                success: false,
                code: 'CHECKIN_FAILED',
                title: 'ENTRY DENIED',
                message: result.reason || 'Check-in validation failed.'
            });
        }

        // Success response
        const guestName = registration ? registration.guest_name : (ticket.user ? ticket.user.name : 'Guest');
        const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        res.json({
            success: true,
            code: 'ENTRY_APPROVED',
            title: 'ENTRY APPROVED',
            message: 'Guest verified and checked in successfully.',
            guestName,
            guestEmail: registration ? registration.guest_email : '',
            ticketNumber: ticket.ticket_number,
            eventTitle: ticket.event ? ticket.event.title : 'Event',
            checkinTime,
            attendanceId: result.checkin ? result.checkin.id : null
        });

    } catch (err) {
        next(err);
    }
}

async function getEventAttendance(req, res, next) {
    try {
        const eventId = req.params.id;
        const attendanceList = await dbQuery.getEventAttendance(eventId);
        res.json({ success: true, count: attendanceList.length, attendance: attendanceList });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    scanTicket,
    getEventAttendance
};

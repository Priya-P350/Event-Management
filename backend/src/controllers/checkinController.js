const dbQuery = require('../config/db');

async function scanTicket(req, res, next) {
    try {
        let { ticketToken, eventId, deviceInfo } = req.body;

        if (!ticketToken) {
            return res.status(400).json({ success: false, message: 'Ticket token or QR payload is required.' });
        }

        let cleanText = String(ticketToken).trim();
        let parsedJson = null;

        // 1. Try parsing JSON payload (if QR encodes JSON object)
        if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
            try {
                parsedJson = JSON.parse(cleanText);
            } catch (e) {
                // Not valid JSON, continue with raw text
            }
        }

        // 2. Extract potential identifiers
        let candidateIdOrToken = cleanText;
        if (parsedJson) {
            candidateIdOrToken = parsedJson.token || parsedJson.secureToken || parsedJson.uniqueId || parsedJson.memberId || parsedJson.ticketNumber || cleanText;
        } else if (cleanText.includes('EVENTHUB-MEMBER:')) {
            candidateIdOrToken = cleanText.split('EVENTHUB-MEMBER:')[1].trim();
        } else if (cleanText.includes('EVENT-TICKET:')) {
            candidateIdOrToken = cleanText.split('EVENT-TICKET:')[1].trim();
        } else if (cleanText.includes('EVENTHUB-VERIFY:')) {
            candidateIdOrToken = cleanText.split('EVENTHUB-VERIFY:')[1].split(':')[0].trim();
        }

        // Clean any sub-segments (e.g. if MEM-2026-XXXX:TOKEN:Name)
        if (candidateIdOrToken.includes(':')) {
            candidateIdOrToken = candidateIdOrToken.split(':')[0].trim();
        }

        const isMemberHint = (parsedJson && parsedJson.type === 'member_pass') ||
                             cleanText.includes('EVENTHUB-MEMBER:') ||
                             candidateIdOrToken.startsWith('MEM-');

        // Check for Member Pass
        let member = null;
        if (isMemberHint || candidateIdOrToken.startsWith('MEM-')) {
            member = await dbQuery.findUserByMemberIdOrToken(candidateIdOrToken) ||
                     (parsedJson?.uniqueId ? await dbQuery.findUserByMemberIdOrToken(parsedJson.uniqueId) : null) ||
                     (parsedJson?.email ? await dbQuery.findUserByEmail(parsedJson.email) : null);
        }

        if (member) {
            // Check if Member QR Pass is already expired
            if (member.qr_status === 'expired') {
                const expiredTime = member.qr_scanned_at ? new Date(member.qr_scanned_at).toLocaleString() : 'Earlier';
                return res.status(409).json({
                    success: false,
                    code: 'ALREADY_USED',
                    title: 'QR EXPIRED - ALREADY SCANNED',
                    message: `This Member QR code was already scanned by Admin on ${expiredTime} and is now EXPIRED. Duplicate entry denied.`,
                    originalCheckinTime: member.qr_scanned_at,
                    guestName: member.name,
                    guestEmail: member.email,
                    uniqueId: member.member_id || member.id,
                    ticketNumber: member.member_id || member.id,
                    status: 'expired'
                });
            }

            // Valid active member pass: mark as EXPIRED upon Admin scanning
            const adminIdentifier = req.user ? (req.user.name || req.user.email) : 'Authorized Admin';
            const checkinResult = await dbQuery.processMemberCheckinAtomic(
                member.id,
                adminIdentifier,
                deviceInfo || 'Gate Camera Scanner'
            );

            if (!checkinResult.success) {
                if (checkinResult.reason === 'ALREADY_USED') {
                    return res.status(409).json({
                        success: false,
                        code: 'ALREADY_USED',
                        title: 'QR EXPIRED - ALREADY SCANNED',
                        message: 'This Member QR code was already scanned by Admin and is now EXPIRED.',
                        guestName: member.name,
                        uniqueId: member.member_id || member.id,
                        status: 'expired'
                    });
                }
                return res.status(400).json({
                    success: false,
                    code: 'CHECKIN_FAILED',
                    title: 'ENTRY DENIED',
                    message: checkinResult.reason || 'Check-in validation failed.'
                });
            }

            const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return res.json({
                success: true,
                code: 'ENTRY_APPROVED',
                title: 'ENTRY APPROVED — QR NOW EXPIRED',
                message: 'Member QR code verified and expired. Single admission granted.',
                guestName: member.name,
                guestEmail: member.email,
                guestPhone: member.phone,
                uniqueId: member.member_id || member.id,
                ticketNumber: member.member_id || member.id,
                eventTitle: 'Member Gate Admission',
                passType: 'Member Pass',
                role: member.role,
                checkinTime,
                status: 'expired'
            });
        }

        // Look for Event Ticket
        let ticket = await dbQuery.getTicketByToken(candidateIdOrToken);
        if (!ticket && parsedJson?.ticketNumber) {
            ticket = await dbQuery.getTicketByToken(parsedJson.ticketNumber);
        }
        if (!ticket && parsedJson?.secureToken) {
            ticket = await dbQuery.getTicketByToken(parsedJson.secureToken);
        }
        if (!ticket && cleanText !== candidateIdOrToken) {
            ticket = await dbQuery.getTicketByToken(cleanText);
        }

        // If ticket not found, try member lookup as fallback in case it didn't have MEM prefix
        if (!ticket) {
            const fallbackMember = await dbQuery.findUserByMemberIdOrToken(candidateIdOrToken) ||
                                   await dbQuery.findUserByEmailOrPhone(candidateIdOrToken);
            if (fallbackMember) {
                if (fallbackMember.qr_status === 'expired') {
                    const expiredTime = fallbackMember.qr_scanned_at ? new Date(fallbackMember.qr_scanned_at).toLocaleString() : 'Earlier';
                    return res.status(409).json({
                        success: false,
                        code: 'ALREADY_USED',
                        title: 'QR EXPIRED - ALREADY SCANNED',
                        message: `This Member QR code was already scanned by Admin on ${expiredTime} and is now EXPIRED. Duplicate entry denied.`,
                        originalCheckinTime: fallbackMember.qr_scanned_at,
                        guestName: fallbackMember.name,
                        uniqueId: fallbackMember.member_id || fallbackMember.id,
                        status: 'expired'
                    });
                }

                const adminIdentifier = req.user ? (req.user.name || req.user.email) : 'Authorized Admin';
                await dbQuery.processMemberCheckinAtomic(fallbackMember.id, adminIdentifier, deviceInfo || 'Gate Camera Scanner');
                const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return res.json({
                    success: true,
                    code: 'ENTRY_APPROVED',
                    title: 'ENTRY APPROVED — QR NOW EXPIRED',
                    message: 'Member QR code verified and expired. Single admission granted.',
                    guestName: fallbackMember.name,
                    guestEmail: fallbackMember.email,
                    guestPhone: fallbackMember.phone,
                    uniqueId: fallbackMember.member_id || fallbackMember.id,
                    ticketNumber: fallbackMember.member_id || fallbackMember.id,
                    eventTitle: 'Member Gate Admission',
                    passType: 'Member Pass',
                    role: fallbackMember.role,
                    checkinTime,
                    status: 'expired'
                });
            }

            return res.status(404).json({
                success: false,
                code: 'INVALID_TICKET',
                title: 'INVALID QR CODE',
                message: 'No active member pass or event ticket record found matching this QR code.'
            });
        }

        // Event association check (if a specific event filter is selected)
        if (eventId && eventId !== 'all' && eventId !== 'ALL' && ticket.event_id !== eventId) {
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

        // Check if ticket status is already expired or has attendance record
        if (ticket.status === 'expired' || ticket.attendance) {
            const checkinTime = ticket.attendance ? new Date(ticket.attendance.checked_in_at || ticket.attendance.checkedInAt).toLocaleString() : 'Earlier';
            return res.status(409).json({
                success: false,
                code: 'ALREADY_USED',
                title: 'QR EXPIRED - ALREADY SCANNED',
                message: `This QR ticket was already scanned by Admin on ${checkinTime} and is now EXPIRED. Duplicate entry denied.`,
                originalCheckinTime: ticket.attendance ? (ticket.attendance.checked_in_at || ticket.attendance.checkedInAt) : null,
                guestName: ticket.registration ? ticket.registration.guest_name : (ticket.user ? ticket.user.name : 'Guest'),
                uniqueId: ticket.ticket_number,
                ticketNumber: ticket.ticket_number,
                status: 'expired'
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

        // Atomic Check-in Process (Sets ticket status to 'expired')
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
                    title: 'QR EXPIRED - ALREADY SCANNED',
                    message: `This QR ticket was already scanned by Admin at ${checkinTime} and is now EXPIRED. Duplicate entry denied.`,
                    originalCheckinTime: result.existingCheckin ? (result.existingCheckin.checked_in_at || result.existingCheckin.checkedInAt) : null,
                    guestName: registration ? registration.guest_name : (ticket.user ? ticket.user.name : 'Guest'),
                    uniqueId: ticket.ticket_number,
                    ticketNumber: ticket.ticket_number,
                    status: 'expired'
                });
            }

            return res.status(400).json({
                success: false,
                code: 'CHECKIN_FAILED',
                title: 'ENTRY DENIED',
                message: result.reason || 'Check-in validation failed.'
            });
        }

        // Success response — QR is now expired!
        const guestName = registration ? registration.guest_name : (ticket.user ? ticket.user.name : 'Guest');
        const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        res.json({
            success: true,
            code: 'ENTRY_APPROVED',
            title: 'ENTRY APPROVED — QR NOW EXPIRED',
            message: 'Guest verified and checked in successfully. QR ticket is now EXPIRED.',
            guestName,
            guestEmail: registration ? registration.guest_email : '',
            ticketNumber: ticket.ticket_number,
            uniqueId: ticket.ticket_number,
            eventTitle: ticket.event ? ticket.event.title : 'Event',
            checkinTime,
            status: 'expired',
            attendanceId: result.attendance ? result.attendance.id : null
        });

    } catch (err) {
        next(err);
    }
}

async function getEventAttendance(req, res, next) {
    try {
        const eventId = req.params.id;
        const event = await dbQuery.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const creatorId = event.created_by || event.createdBy;
        if (req.user && req.user.role !== 'super_admin' && creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You do not have permission to view attendance for this event.'
            });
        }

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

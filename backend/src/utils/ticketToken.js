const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generates an unpredictable, secure ticket token and unique ticket ID for event registration.
 */
function generateTicketToken(extra = {}) {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const secureToken = `EVT-TK-${randomHex}`;
    const ticketNumber = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // JSON payload encoding person details and unique ID
    const payloadObj = {
        type: 'event_ticket',
        uniqueId: ticketNumber,
        ticketNumber: ticketNumber,
        secureToken: secureToken,
        guestName: extra.guestName || extra.name || '',
        guestEmail: extra.guestEmail || extra.email || '',
        guestPhone: extra.guestPhone || extra.phone || '',
        eventTitle: extra.eventTitle || '',
        eventId: extra.eventId || '',
        issuedAt: new Date().toISOString()
    };

    const qrPayload = JSON.stringify(payloadObj);

    return {
        secureToken,
        ticketNumber,
        qrPayload,
        uniqueId: ticketNumber
    };
}

/**
 * Generates a unique member ID, token, and payload with their details for self-registering members.
 */
function generateMemberToken(user = {}) {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const secureToken = `MEM-TK-${randomHex}`;
    const memberId = `MEM-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const payloadObj = {
        type: 'member_pass',
        uniqueId: memberId,
        memberId: memberId,
        token: secureToken,
        name: user.name || 'Valued Member',
        email: (user.email || '').toLowerCase(),
        phone: user.phone || '',
        role: user.role || 'guest',
        issuedAt: new Date().toISOString()
    };

    const qrPayload = JSON.stringify(payloadObj);

    return {
        secureToken,
        memberId,
        qrPayload,
        uniqueId: memberId
    };
}

/**
 * Generates a unique admin identifier (e.g. ADM-2026-123456).
 */
function generateAdminId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `ADM-2026-${randomNum}`;
}

module.exports = {
    generateTicketToken,
    generateMemberToken,
    generateAdminId
};


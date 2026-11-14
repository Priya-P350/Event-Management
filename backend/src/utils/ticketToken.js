const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generates an unpredictable, secure ticket token and unique ticket ID for event registration.
 * Encodes all guest details fetched from the database into the QR payload.
 */
function generateTicketToken(extra = {}) {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const secureToken = `EVT-TK-${randomHex}`;
    const ticketNumber = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationString = `EVENTHUB-VERIFY:${ticketNumber}:${secureToken}`;
    
    // JSON payload encoding person details and unique ID fetched from database
    const payloadObj = {
        type: 'event_ticket',
        uniqueId: ticketNumber,
        ticketNumber: ticketNumber,
        registrationNumber: extra.registrationNumber || '',
        secureToken: secureToken,
        verificationString: verificationString,
        guestName: extra.guestName || extra.name || '',
        guestEmail: (extra.guestEmail || extra.email || '').toLowerCase(),
        guestPhone: extra.guestPhone || extra.phone || '',
        eventTitle: extra.eventTitle || '',
        eventId: extra.eventId || '',
        eventDate: extra.eventDate || '',
        startTime: extra.startTime || '',
        venue: extra.venue || '',
        address: extra.address || '',
        customAnswers: extra.customAnswers || {},
        issuedAt: new Date().toISOString()
    };

    const qrPayload = JSON.stringify(payloadObj);

    return {
        secureToken,
        ticketNumber,
        verificationString,
        qrPayload,
        uniqueId: ticketNumber,
        payloadObj
    };
}

/**
 * Generates a unique member ID, token, and payload with their details for self-registering members.
 */
function generateMemberToken(user = {}) {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const secureToken = `MEM-TK-${randomHex}`;
    const memberId = `MEM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationString = `EVENTHUB-MEMBER:${memberId}:${secureToken}`;

    const payloadObj = {
        type: 'member_pass',
        uniqueId: memberId,
        memberId: memberId,
        token: secureToken,
        verificationString: verificationString,
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
        verificationString,
        qrPayload,
        uniqueId: memberId,
        payloadObj
    };
}

/**
 * Generates a unique member token with collision check retry loop.
 */
async function generateUniqueMemberToken(user = {}, isTakenFn = null, maxAttempts = 5) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const tokenData = generateMemberToken(user);
        if (!isTakenFn) return tokenData;
        const taken = await isTakenFn(tokenData.memberId);
        if (!taken) return tokenData;
    }
    throw new Error('Failed to generate a unique member ID after maximum retry attempts.');
}

/**
 * Generates an unpredictable, unique admin ID matching ^ADM-2026-\d{6}$
 */
function generateAdminId() {
    const randomNum = crypto.randomInt(100000, 1000000);
    return `ADM-2026-${randomNum}`;
}

/**
 * Generates a unique admin identifier with collision check retry loop.
 */
async function generateUniqueAdminId(isTakenFn = null, maxAttempts = 5) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const adminId = generateAdminId();
        if (!isTakenFn) return adminId;
        const taken = await isTakenFn(adminId);
        if (!taken) return adminId;
    }
    throw new Error('Failed to generate a unique admin ID after maximum retry attempts.');
}

module.exports = {
    generateTicketToken,
    generateMemberToken,
    generateUniqueMemberToken,
    generateAdminId,
    generateUniqueAdminId
};


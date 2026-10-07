const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generates an unpredictable, secure ticket token and ticket number.
 */
function generateTicketToken() {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const secureToken = `EVT-TK-${randomHex}`;
    const ticketNumber = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrPayload = `EVENT-TICKET:${secureToken}`;
    return {
        secureToken,
        ticketNumber,
        qrPayload
    };
}

module.exports = {
    generateTicketToken
};

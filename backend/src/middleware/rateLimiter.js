const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 login/register requests per windowMs
    message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const scanLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 120, // 120 scan checks per minute
    message: { success: false, message: 'Rate limit exceeded for QR scanner gate. Please slow down.' }
});

module.exports = {
    authLimiter,
    scanLimiter
};

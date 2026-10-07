const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_eventhub_2026_antigravity';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
        req.user = decoded;
        next();
    });
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next();

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (!err) req.user = decoded;
        next();
    });
}

module.exports = {
    authenticateToken,
    optionalAuth,
    jwtSecret
};

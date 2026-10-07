/**
 * Role-Based Access Control (RBAC) middleware
 * Allowed Roles: super_admin, event_admin, scanner_staff, guest
 */
function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole) && userRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role: '${userRole}'`
            });
        }

        next();
    };
}

function requireStaffOrAdmin(req, res, next) {
    return requireRole(['super_admin', 'event_admin', 'scanner_staff'])(req, res, next);
}

function requireAdmin(req, res, next) {
    return requireRole(['super_admin', 'event_admin'])(req, res, next);
}

module.exports = {
    requireRole,
    requireStaffOrAdmin,
    requireAdmin
};

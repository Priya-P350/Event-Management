const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');
const { jwtSecret } = require('../middleware/auth');
const { generateTicketToken, generateMemberToken, generateAdminId } = require('../utils/ticketToken');
const { generateQRCodeDataUrl } = require('../services/qrService');
const { sendQRTicketEmail, sendMemberPassEmail, sendOtpEmail } = require('../services/emailService');

async function sendOtp(req, res, next) {
    try {
        const { email, name, purpose = 'registration' } = req.body;
        if (!email || !String(email).includes('@')) {
            return res.status(400).json({ success: false, message: 'A valid email address is required.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        // For registration purpose, verify if email is already taken
        if (purpose === 'registration') {
            const existingUser = await dbQuery.findUserByEmail(cleanEmail);
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An account with this email address already exists. Please sign in instead.' 
                });
            }
        }

        // Generate high-entropy 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await dbQuery.saveOtp({
            email: cleanEmail,
            otp,
            purpose,
            ttlMs: 10 * 60 * 1000 // 10 minutes expiry
        });

        // Dispatch Email via Resend
        await sendOtpEmail({
            email: cleanEmail,
            otp,
            name: name || 'User'
        });

        res.json({
            success: true,
            message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
            email: cleanEmail,
            expiresInSeconds: 600
        });
    } catch (err) {
        next(err);
    }
}

async function verifyOtp(req, res, next) {
    try {
        const { email, otp, purpose = 'registration' } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const savedOtpRecord = await dbQuery.getOtp({ email: cleanEmail, purpose });

        if (!savedOtpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired OTP. Please request a new verification code.' 
            });
        }

        if (savedOtpRecord.otp !== String(otp).trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Incorrect verification code. Please check the OTP sent to your email.' 
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully.',
            verified: true
        });
    } catch (err) {
        next(err);
    }
}

async function resendOtp(req, res, next) {
    return sendOtp(req, res, next);
}

async function register(req, res, next) {
    try {
        const { name, email, phone, password, role, eventId, otp } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        // 1. Mandatory Email OTP Verification
        if (!otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email verification required. Please enter the 6-digit OTP sent to your email.' 
            });
        }

        const savedOtpRecord = await dbQuery.getOtp({ email: cleanEmail, purpose: 'registration' });
        if (!savedOtpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'Verification code expired or not found. Please request a new OTP.' 
            });
        }

        if (savedOtpRecord.otp !== String(otp).trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Incorrect verification code. Please check your email for the correct OTP.' 
            });
        }

        // OTP is valid - consume it immediately
        await dbQuery.deleteOtp({ email: cleanEmail, purpose: 'registration' });

        const existingUser = await dbQuery.findUserByEmail(cleanEmail);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        // Server-side role mapping & authorization (prevent unauthorized super_admin escalation)
        let userRole = 'guest';
        if (role === 'organizer' || role === 'event_admin') {
            userRole = 'event_admin';
        } else if (role === 'gate_staff' || role === 'scanner_staff') {
            userRole = 'scanner_staff';
        } else if (role === 'attendee' || role === 'guest') {
            userRole = 'guest';
        }

        const isAttendee = (userRole === 'guest');
        const isOrganizer = ['event_admin', 'super_admin'].includes(userRole);
        const isStaff = (userRole === 'scanner_staff');

        let memberId = null;
        const newUserId = uuidv4();
        const adminId = isOrganizer ? generateAdminId() : null;

        // Store user login credentials securely in the database
        const newUser = {
            id: newUserId,
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            password_hash,
            role: userRole,
            admin_id: adminId,
            adminId: adminId
        };

        const createdUser = await dbQuery.createUser(newUser);

        const token = jwt.sign(
            { id: newUser.id, admin_id: adminId, name: newUser.name, email: newUser.email, role: newUser.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        let successMessage = 'User registered successfully.';
        if (isAttendee) {
            successMessage = 'Account created successfully! Explore upcoming events and register at your convenience.';
        } else if (isOrganizer) {
            successMessage = 'Organizer account created successfully! Welcome to the Event Creator console.';
        } else if (isStaff) {
            successMessage = 'Gate scanner staff account created successfully!';
        }

        res.status(201).json({
            success: true,
            message: successMessage,
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                admin_id: adminId,
                adminId: adminId
            }
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, loginInput, identifier, password } = req.body;
        const userInput = (email || loginInput || identifier || '').trim();

        if (!userInput || !password) {
            return res.status(400).json({ success: false, message: 'Email or phone number and password are required.' });
        }

        const user = await dbQuery.findUserByEmailOrPhone(userInput);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User account not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
        }

        // Ensure ONLY attendee guests have member ID and QR pass generated (organizers & staff do not get admission passes)
        if (user.role === 'guest' && (!user.member_id || !user.qr_code_data)) {
            const { memberId, secureToken, qrPayload } = generateMemberToken(user);
            const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);
            await dbQuery.updateUserMemberPass(user.id, {
                member_id: memberId,
                qr_token: secureToken,
                qr_code_data: qrCodeDataUrl,
                qr_status: user.qr_status || 'active'
            });
            user.member_id = memberId;
            user.memberId = memberId;
            user.qr_token = secureToken;
            user.qr_code_data = qrCodeDataUrl;
            user.qr_status = user.qr_status || 'active';
        }

        // Ensure admin has unique admin_id assigned
        if (['event_admin', 'super_admin'].includes(user.role) && !user.admin_id) {
            const assignedAdminId = user.role === 'super_admin' ? 'ADM-0001' : generateAdminId();
            await dbQuery.updateUserAdminId(user.id, assignedAdminId);
            user.admin_id = assignedAdminId;
            user.adminId = assignedAdminId;
        }

        const token = jwt.sign(
            { id: user.id, admin_id: user.admin_id || user.adminId || null, name: user.name, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Logged in successfully.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                admin_id: user.admin_id || user.adminId || null,
                adminId: user.admin_id || user.adminId || null,
                member_id: user.member_id || user.memberId,
                memberId: user.member_id || user.memberId,
                qr_code_data: user.qr_code_data,
                qr_token: user.qr_token,
                qr_status: user.qr_status || 'active',
                qr_scanned_at: user.qr_scanned_at || null,
                qr_scanned_by: user.qr_scanned_by || null
            }
        });
    } catch (err) {
        next(err);
    }
}

async function getMe(req, res, next) {
    try {
        let user = await dbQuery.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Auto-generate member pass for any member who registered earlier
        if (!user.member_id || !user.qr_code_data) {
            const { memberId, secureToken, qrPayload } = generateMemberToken(user);
            const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);
            await dbQuery.updateUserMemberPass(user.id, {
                member_id: memberId,
                qr_token: secureToken,
                qr_code_data: qrCodeDataUrl,
                qr_status: user.qr_status || 'active'
            });
            user.member_id = memberId;
            user.memberId = memberId;
            user.qr_token = secureToken;
            user.qr_code_data = qrCodeDataUrl;
            user.qr_status = user.qr_status || 'active';
        }

        // Auto-generate admin_id for any admin missing one
        if (['event_admin', 'super_admin'].includes(user.role) && !user.admin_id) {
            const assignedAdminId = user.role === 'super_admin' ? 'ADM-0001' : generateAdminId();
            await dbQuery.updateUserAdminId(user.id, assignedAdminId);
            user.admin_id = assignedAdminId;
            user.adminId = assignedAdminId;
        }

        res.json({
            success: true,
            user: {
                ...user,
                admin_id: user.admin_id || user.adminId || null,
                adminId: user.admin_id || user.adminId || null,
                member_id: user.member_id || user.memberId,
                memberId: user.member_id || user.memberId,
                qr_code_data: user.qr_code_data,
                qr_token: user.qr_token,
                qr_status: user.qr_status || 'active',
                qr_scanned_at: user.qr_scanned_at || null,
                qr_scanned_by: user.qr_scanned_by || null
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    sendOtp,
    verifyOtp,
    resendOtp,
    register,
    login,
    getMe
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');
const { jwtSecret } = require('../middleware/auth');
const { generateMemberToken } = require('../utils/ticketToken');
const { generateQRCodeDataUrl } = require('../services/qrService');
const { sendMemberPassEmail } = require('../services/emailService');

async function register(req, res, next) {
    try {
        const { name, email, phone, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
        }

        const existingUser = await dbQuery.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role && ['guest', 'scanner_staff', 'event_admin', 'super_admin'].includes(role) ? role : 'guest';

        // Generate Unique Member ID, secure token, and QR Payload with details
        const { memberId, secureToken, qrPayload } = generateMemberToken({
            name,
            email,
            phone: phone || '',
            role: userRole
        });

        // Generate QR code Data URL image
        const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

        const newUser = {
            id: uuidv4(),
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            password_hash,
            role: userRole,
            member_id: memberId,
            memberId: memberId,
            qr_token: secureToken,
            qr_code_data: qrCodeDataUrl,
            qr_status: 'active'
        };

        const createdUser = await dbQuery.createUser(newUser);

        // Send Member QR Pass email in background
        sendMemberPassEmail({
            email: newUser.email,
            name: newUser.name,
            memberId,
            secureToken,
            qrCodeDataUrl,
            role: userRole
        }).catch(err => console.error('[Member Pass Email Dispatch Error]', err.message));

        const token = jwt.sign(
            { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Member QR pass generated.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                member_id: memberId,
                memberId: memberId,
                qr_token: secureToken,
                qr_code_data: qrCodeDataUrl,
                qr_status: 'active'
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

        // Ensure user has member ID and QR pass generated
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

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
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

        res.json({
            success: true,
            user: {
                ...user,
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
    register,
    login,
    getMe
};

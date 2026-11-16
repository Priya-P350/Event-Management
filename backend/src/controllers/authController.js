const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');
const { jwtSecret } = require('../middleware/auth');
const { generateTicketToken, generateMemberToken, generateAdminId } = require('../utils/ticketToken');
const { generateQRCodeDataUrl } = require('../services/qrService');
const { sendQRTicketEmail, sendMemberPassEmail } = require('../services/emailService');

async function register(req, res, next) {
    try {
        const { name, email, phone, password, role, eventId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
        }

        const existingUser = await dbQuery.findUserByEmail(email);
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
        let secureToken = null;
        let verificationString = null;
        let qrCodeDataUrl = null;
        let targetEvent = null;
        let createdTicket = null;
        let createdRegistration = null;

        const newUserId = uuidv4();
        const adminId = isOrganizer ? generateAdminId() : null;

        // ONLY generate Event QR Ticket for Attendees (Event Creators & Gate Staff do not get admission passes)
        if (isAttendee) {
            // Find the particular event the attendee is registering for
            if (eventId) {
                targetEvent = await dbQuery.getEventById(eventId);
            }
            if (!targetEvent) {
                const allEvents = await dbQuery.getAllEvents();
                targetEvent = (allEvents || []).find(e => ['registration_open', 'published'].includes(e.status)) || (allEvents && allEvents[0]) || null;
            }

            if (targetEvent) {
                // 1. Generate unique registration record for this event
                const registrationNumber = `REG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
                const regId = uuidv4();

                createdRegistration = {
                    id: regId,
                    event_id: targetEvent.id,
                    user_id: newUserId,
                    registration_number: registrationNumber,
                    guest_name: name,
                    guest_email: email.toLowerCase(),
                    guest_phone: phone || '',
                    custom_answers: {},
                    registration_status: 'confirmed'
                };

                // 2. Generate Event-Specific Ticket Token & Scannable QR Pass
                const ticketTokenData = generateTicketToken({
                    guestName: name,
                    guestEmail: email,
                    guestPhone: phone || '',
                    registrationNumber,
                    registrationId: regId,
                    userId: newUserId,
                    eventTitle: targetEvent.title,
                    eventId: targetEvent.id,
                    eventDate: targetEvent.event_date,
                    startTime: targetEvent.start_time,
                    venue: targetEvent.venue,
                    address: targetEvent.address
                });

                secureToken = ticketTokenData.secureToken;
                verificationString = ticketTokenData.verificationString;
                qrCodeDataUrl = await generateQRCodeDataUrl(ticketTokenData.qrPayload);

                createdTicket = {
                    id: uuidv4(),
                    registration_id: regId,
                    event_id: targetEvent.id,
                    user_id: newUserId,
                    ticket_number: ticketTokenData.ticketNumber,
                    secure_token: secureToken,
                    qr_code_data: qrCodeDataUrl,
                    status: 'active'
                };
            } else {
                // Fallback Member Token if no events exist in the platform
                const memberTokenData = generateMemberToken({
                    name,
                    email,
                    phone: phone || '',
                    role: userRole
                });
                memberId = memberTokenData.memberId;
                secureToken = memberTokenData.secureToken;
                verificationString = memberTokenData.verificationString;
                qrCodeDataUrl = await generateQRCodeDataUrl(memberTokenData.qrPayload);
            }
        }

        // Store user login credentials securely in the database
        const newUser = {
            id: newUserId,
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            password_hash,
            role: userRole,
            admin_id: adminId,
            adminId: adminId,
            member_id: memberId,
            memberId: memberId,
            qr_token: secureToken,
            qr_code_data: qrCodeDataUrl,
            qr_status: isAttendee ? 'active' : null
        };

        const createdUser = await dbQuery.createUser(newUser);

        // Save registration, payment, and ticket records in database
        if (createdRegistration && targetEvent) {
            await dbQuery.createRegistration(createdRegistration);

            const payment = {
                id: uuidv4(),
                registration_id: createdRegistration.id,
                razorpay_order_id: `PASS_ORDER_${createdRegistration.id.substring(0, 8)}`,
                razorpay_payment_id: `PASS_PAY_${createdRegistration.id.substring(0, 8)}`,
                amount: Number(targetEvent.ticket_price || 0),
                currency: 'INR',
                status: 'paid',
                paid_at: new Date().toISOString()
            };
            await dbQuery.createPayment(payment);

            if (createdTicket) {
                await dbQuery.createTicket(createdTicket);

                // Dispatch QR Ticket Email directly to attendee's Gmail
                sendQRTicketEmail({
                    guestEmail: newUser.email,
                    guestName: newUser.name,
                    guestPhone: newUser.phone,
                    registrationNumber: createdRegistration.registration_number,
                    eventTitle: targetEvent.title,
                    eventDate: targetEvent.event_date,
                    startTime: targetEvent.start_time,
                    venue: targetEvent.venue,
                    address: targetEvent.address,
                    ticketNumber: createdTicket.ticket_number,
                    secureToken,
                    verificationString,
                    qrCodeDataUrl
                }).catch(err => console.error('[Event QR Ticket Email Error]', err.message));
            }
        } else if (isAttendee && qrCodeDataUrl) {
            sendMemberPassEmail({
                email: newUser.email,
                name: newUser.name,
                memberId,
                secureToken,
                verificationString,
                qrCodeDataUrl,
                role: userRole
            }).catch(err => console.error('[Member Pass Email Dispatch Error]', err.message));
        }

        const token = jwt.sign(
            { id: newUser.id, admin_id: adminId, name: newUser.name, email: newUser.email, role: newUser.role },
            jwtSecret,
            { expiresIn: '7d' }
        );

        let successMessage = 'User registered successfully.';
        if (isAttendee) {
            successMessage = targetEvent
                ? `Registration successful! Your QR admission ticket for "${targetEvent.title}" has been sent to your Gmail and is displayed on screen.`
                : 'Registration successful! Your admission QR pass has been sent to your email and is displayed on screen.';
        } else if (isOrganizer) {
            successMessage = 'Organizer account created successfully! Welcome to the Event Creator console.';
        } else if (isStaff) {
            successMessage = 'Gate scanner staff account created successfully!';
        }

        res.status(201).json({
            success: true,
            message: successMessage,
            token,
            event: targetEvent,
            ticket: createdTicket,
            registration: createdRegistration,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                admin_id: adminId,
                adminId: adminId,
                member_id: memberId,
                memberId: memberId,
                qr_token: secureToken,
                qr_code_data: qrCodeDataUrl,
                qr_status: newUser.qr_status,
                ticket_number: createdTicket?.ticket_number || null
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
    register,
    login,
    getMe
};

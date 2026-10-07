const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');
const { createOrder } = require('../config/razorpay');

async function createRegistration(req, res, next) {
    try {
        const { eventId, name, email, phone, customAnswers } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!eventId || !name || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Event ID, name, email, and phone number are required.' });
        }

        const event = await dbQuery.getEventById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        if (['cancelled', 'completed', 'draft'].includes(event.status)) {
            return res.status(400).json({ success: false, message: `Registration is not open for this event (Current Status: ${event.status}).` });
        }

        // Capacity check
        if (event.seats_remaining <= 0) {
            return res.status(400).json({ success: false, message: 'SOLD OUT: This event has reached maximum seating capacity.' });
        }

        // Registration deadline check
        if (event.registration_close_at) {
            const deadline = new Date(event.registration_close_at);
            if (new Date() > deadline) {
                return res.status(400).json({ success: false, message: 'REGISTRATION CLOSED: The registration deadline for this event has passed.' });
            }
        }

        // Check duplicate active registration if user logged in
        let effectiveUserId = userId;
        if (!effectiveUserId) {
            // Find or create guest user
            let guestUser = await dbQuery.findUserByEmail(email);
            if (!guestUser) {
                const passwordHash = require('bcryptjs').hashSync('Guest@123', 10);
                guestUser = await dbQuery.createUser({
                    id: uuidv4(),
                    name,
                    email: email.toLowerCase(),
                    phone,
                    password_hash: passwordHash,
                    role: 'guest'
                });
            }
            effectiveUserId = guestUser.id;
        }

        // Check if user already registered
        const existingRegs = await dbQuery.getUserRegistrations(effectiveUserId);
        const duplicate = existingRegs.find(r => r.event_id === eventId && r.registration_status !== 'cancelled');
        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event.',
                registration: duplicate
            });
        }

        // Handle FREE Event (ticket_price === 0)
        if (Number(event.ticket_price) === 0) {
            const registrationNumber = `REG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
            const regId = uuidv4();

            const registration = {
                id: regId,
                event_id: eventId,
                user_id: effectiveUserId,
                registration_number: registrationNumber,
                guest_name: name,
                guest_email: email.toLowerCase(),
                guest_phone: phone,
                custom_answers: customAnswers || {},
                registration_status: 'confirmed'
            };

            await dbQuery.createRegistration(registration);

            // Record zero-amount payment
            const payment = {
                id: uuidv4(),
                registration_id: regId,
                razorpay_order_id: `FREE_ORDER_${regId.substring(0, 8)}`,
                razorpay_payment_id: `FREE_PAY_${regId.substring(0, 8)}`,
                amount: 0,
                currency: 'INR',
                status: 'paid',
                paid_at: new Date().toISOString()
            };
            await dbQuery.createPayment(payment);

            // Generate Ticket & QR Pass
            const { generateTicketToken } = require('../utils/ticketToken');
            const { generateQRCodeDataUrl } = require('../services/qrService');
            const { sendQRTicketEmail } = require('../services/emailService');

            const { secureToken, ticketNumber, qrPayload } = generateTicketToken();
            const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

            const ticketData = {
                id: uuidv4(),
                registration_id: regId,
                event_id: eventId,
                user_id: effectiveUserId,
                ticket_number: ticketNumber,
                secure_token: secureToken,
                qr_code_data: qrCodeDataUrl,
                status: 'active'
            };

            const createdTicket = await dbQuery.createTicket(ticketData);

            // Send QR pass email
            sendQRTicketEmail({
                guestEmail: email.toLowerCase(),
                guestName: name,
                eventTitle: event.title,
                eventDate: event.event_date,
                startTime: event.start_time,
                venue: event.venue,
                address: event.address,
                ticketNumber,
                secureToken,
                qrCodeDataUrl
            }).catch(err => console.error('[Free Registration Email Error]', err));

            return res.status(201).json({
                success: true,
                isFree: true,
                message: 'Registration successful! Your free QR ticket has been generated and emailed to you.',
                registrationId: regId,
                registrationNumber,
                ticket: createdTicket,
                ticketNumber,
                secureToken
            });
        }

        // Create pending registration for paid event
        const registrationNumber = `REG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const regId = uuidv4();

        const registration = {
            id: regId,
            event_id: eventId,
            user_id: effectiveUserId,
            registration_number: registrationNumber,
            guest_name: name,
            guest_email: email.toLowerCase(),
            guest_phone: phone,
            custom_answers: customAnswers || {},
            registration_status: 'pending'
        };

        await dbQuery.createRegistration(registration);

        // Create Razorpay Order
        const razorpayOrder = await createOrder(event.ticket_price, 'INR', registrationNumber);

        // Save Payment record
        const payment = {
            id: uuidv4(),
            registration_id: regId,
            razorpay_order_id: razorpayOrder.id,
            amount: event.ticket_price,
            currency: 'INR',
            status: 'pending'
        };

        await dbQuery.createPayment(payment);

        res.status(201).json({
            success: true,
            isFree: false,
            message: 'Registration initiated successfully. Proceed to Razorpay payment.',
            registrationId: regId,
            registrationNumber,
            event,
            razorpayOrder,
            ticketPrice: event.ticket_price
        });
    } catch (err) {
        next(err);
    }
}

async function getMyRegistrations(req, res, next) {
    try {
        const registrations = await dbQuery.getUserRegistrations(req.user.id);
        res.json({ success: true, count: registrations.length, registrations });
    } catch (err) {
        next(err);
    }
}

async function getRegistrationById(req, res, next) {
    try {
        const registration = await dbQuery.getRegistrationById(req.params.id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }
        res.json({ success: true, registration });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createRegistration,
    getMyRegistrations,
    getRegistrationById
};

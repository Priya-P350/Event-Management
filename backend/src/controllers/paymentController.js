const { v4: uuidv4 } = require('uuid');
const dbQuery = require('../config/db');
const { verifyPaymentSignature, verifyWebhookSignature } = require('../config/razorpay');
const { generateTicketToken } = require('../utils/ticketToken');
const { generateQRCodeDataUrl } = require('../services/qrService');
const { sendQRTicketEmail } = require('../services/emailService');

/**
 * Handles Razorpay Payment Verification from Frontend
 */
async function verifyPayment(req, res, next) {
    try {
        const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!registrationId || !razorpay_order_id || !razorpay_payment_id) {
            return res.status(400).json({ success: false, message: 'Registration ID, order ID, and payment ID are required.' });
        }

        // Signature check
        const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature || '');
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid Razorpay signature.' });
        }

        // Fetch registration & payment
        const registration = await dbQuery.getRegistrationById(registrationId);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration record not found.' });
        }

        // Idempotency: Check if ticket already generated
        if (registration.ticket && registration.payment && registration.payment.status === 'paid') {
            return res.json({
                success: true,
                message: 'Payment already verified and ticket issued.',
                ticket: registration.ticket,
                registration
            });
        }

        // Update payment status via Drizzle ORM
        await dbQuery.updatePayment(razorpay_order_id, {
            razorpay_payment_id,
            razorpay_signature: razorpay_signature || 'mock_sig',
            status: 'paid',
            paid_at: new Date().toISOString()
        });

        // Update registration status to confirmed via Drizzle ORM
        await dbQuery.updateRegistrationStatus(registrationId, 'confirmed');

        // Generate Ticket & QR Code
        const { secureToken, ticketNumber, qrPayload } = generateTicketToken();
        const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

        const ticketData = {
            id: uuidv4(),
            registration_id: registrationId,
            event_id: registration.event_id,
            user_id: registration.user_id,
            ticket_number: ticketNumber,
            secure_token: secureToken,
            qr_code_data: qrCodeDataUrl,
            status: 'active'
        };

        const createdTicket = await dbQuery.createTicket(ticketData);

        // Fetch event info for email
        const event = registration.event || await dbQuery.getEventById(registration.event_id);

        // Trigger Black & Slate HTML email ticket
        sendQRTicketEmail({
            guestEmail: registration.guest_email,
            guestName: registration.guest_name,
            eventTitle: event ? event.title : 'Event',
            eventDate: event ? event.event_date : '',
            startTime: event ? event.start_time : '',
            venue: event ? event.venue : '',
            address: event ? event.address : '',
            ticketNumber,
            secureToken,
            qrCodeDataUrl
        }).catch(err => console.error('[Email Dispatch Error]', err));

        res.json({
            success: true,
            message: 'Payment verified successfully! Your ticket has been generated and sent to your email.',
            ticket: createdTicket,
            registrationId,
            ticketNumber,
            secureToken
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Handles Razorpay Webhook Callbacks (Server-to-Server Confirmation)
 */
async function handleWebhook(req, res, next) {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret_key';

        const isVerified = verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature, webhookSecret);
        if (!isVerified) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
        }

        const payload = req.body;
        const eventType = payload.event;
        const eventId = payload.contains ? payload.contains[0] : (payload.id || `evt_${Date.now()}`);

        // Idempotency check using webhook_events table via Drizzle ORM
        const existing = await dbQuery.getWebhookEvent(eventId);
        if (existing) {
            console.log(`[Webhook] Event ${eventId} already processed.`);
            return res.json({ success: true, message: 'Webhook event already processed.' });
        }

        await dbQuery.createWebhookEvent({ id: uuidv4(), event_id: eventId, event_type: eventType, payload });

        if (eventType === 'payment.captured' || eventType === 'order.paid') {
            const paymentEntity = payload.payload.payment.entity;
            const razorpay_order_id = paymentEntity.order_id;
            const razorpay_payment_id = paymentEntity.id;

            const existingPayment = await dbQuery.getPaymentByOrderId(razorpay_order_id);
            if (existingPayment && existingPayment.status !== 'paid') {
                const reg = await dbQuery.getRegistrationById(existingPayment.registration_id);
                if (reg && !reg.ticket) {
                    await dbQuery.updatePayment(razorpay_order_id, {
                        razorpay_payment_id,
                        status: 'paid',
                        paid_at: new Date().toISOString()
                    });

                    // Update registration via Drizzle ORM
                    await dbQuery.updateRegistrationStatus(reg.id, 'confirmed');

                    // Generate ticket
                    const { secureToken, ticketNumber, qrPayload } = generateTicketToken();
                    const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

                    await dbQuery.createTicket({
                        id: uuidv4(),
                        registration_id: reg.id,
                        event_id: reg.event_id,
                        user_id: reg.user_id,
                        ticket_number: ticketNumber,
                        secure_token: secureToken,
                        qr_code_data: qrCodeDataUrl,
                        status: 'active'
                    });

                    const event = reg.event || await dbQuery.getEventById(reg.event_id);
                    sendQRTicketEmail({
                        guestEmail: reg.guest_email,
                        guestName: reg.guest_name,
                        eventTitle: event ? event.title : 'Event',
                        eventDate: event ? event.event_date : '',
                        startTime: event ? event.start_time : '',
                        venue: event ? event.venue : '',
                        address: event ? event.address : '',
                        ticketNumber,
                        secureToken,
                        qrCodeDataUrl
                    }).catch(e => console.error('[Webhook Email Error]', e));
                }
            }
        }

        res.json({ success: true, message: 'Webhook processed successfully.' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    verifyPayment,
    handleWebhook
};

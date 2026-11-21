const resendClient = require('../config/resend');

/**
 * Sends a high-contrast Black & Slate HTML ticket email to the guest using Resend API.
 * Includes complete guest and event details fetched from the database, the scannable QR pass,
 * and attaches the QR code PNG image for reliable rendering across all email clients (Gmail, Apple, Outlook).
 */
async function sendQRTicketEmail({
    guestEmail,
    guestName,
    guestPhone,
    registrationNumber,
    eventTitle,
    eventDate,
    startTime,
    venue,
    address,
    ticketNumber,
    secureToken,
    verificationString,
    qrCodeDataUrl,
    customAnswers
}) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub <onboarding@resend.dev>';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5100'}/dashboard`;
    const validVerificationString = verificationString || `EVENTHUB-VERIFY:${ticketNumber}:${secureToken}`;

    // Format custom answers if present
    let customAnswersHtml = '';
    if (customAnswers && typeof customAnswers === 'object' && Object.keys(customAnswers).length > 0) {
        customAnswersHtml = Object.entries(customAnswers)
            .map(([key, val]) => `
                <div class="detail-row">
                    <span class="detail-label">${escapeHtml(formatLabel(key))}</span>
                    <span class="detail-value">${escapeHtml(String(val))}</span>
                </div>
            `).join('');
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Event Ticket - ${escapeHtml(eventTitle || 'Event')}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #020617;
                color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }
            .container {
                max-width: 600px;
                margin: 30px auto;
                background-color: #0f172a;
                border: 1px solid #334155;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .header {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                padding: 32px 24px;
                text-align: center;
                border-bottom: 1px solid #334155;
            }
            .brand {
                font-size: 22px;
                font-weight: 800;
                letter-spacing: 2px;
                color: #f8fafc;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .badge {
                display: inline-block;
                background-color: #334155;
                color: #38bdf8;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1px;
                padding: 4px 12px;
                border-radius: 9999px;
                text-transform: uppercase;
                border: 1px solid #475569;
            }
            .content {
                padding: 32px 24px;
            }
            .event-title {
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin-top: 0;
                margin-bottom: 12px;
                text-align: center;
            }
            .banner {
                background-color: rgba(56, 189, 248, 0.1);
                border: 1px solid #0284c7;
                border-radius: 8px;
                padding: 12px 16px;
                margin: 16px 0;
                font-size: 13px;
                color: #bae6fd;
                text-align: center;
                line-height: 1.5;
            }
            .qr-wrapper {
                text-align: center;
                background-color: #020617;
                padding: 24px;
                border-radius: 12px;
                border: 1px dashed #475569;
                margin: 24px 0;
            }
            .qr-image {
                width: 210px;
                height: 210px;
                background: #ffffff;
                padding: 12px;
                border-radius: 12px;
                display: inline-block;
            }
            .ticket-token {
                font-family: monospace;
                color: #38bdf8;
                font-size: 15px;
                font-weight: 700;
                margin-top: 14px;
                letter-spacing: 1.5px;
            }
            .scan-hint {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 6px;
            }
            .details-grid {
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #334155;
                padding: 10px 0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                color: #94a3b8;
                font-size: 13px;
                font-weight: 500;
            }
            .detail-value {
                color: #f8fafc;
                font-size: 14px;
                font-weight: 600;
                text-align: right;
            }
            .btn {
                display: block;
                width: 80%;
                margin: 24px auto 0;
                padding: 14px 24px;
                background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
                color: #ffffff;
                text-align: center;
                text-decoration: none;
                font-weight: 700;
                font-size: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
            }
            .footer {
                padding: 20px 24px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                border-top: 1px solid #1e293b;
                background-color: #020617;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">⚡ EVENTHUB PASS</div>
                <div class="badge">OFFICIAL QR ENTRY TICKET</div>
            </div>
            <div class="content">
                <h1 class="event-title">${escapeHtml(eventTitle || 'Event Admission')}</h1>
                
                <div class="banner">
                    📅 <strong>Present this QR on event date (${escapeHtml(eventDate || 'Scheduled Day')}) for gate scanning.</strong><br>
                    <span>One-time entry: this QR expires immediately once scanned by Admin.</span>
                </div>

                <div class="qr-wrapper">
                    ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Entry Ticket" class="qr-image" />` : ''}
                    <div class="ticket-token">UNIQUE PASS ID: ${escapeHtml(ticketNumber || 'N/A')}</div>
                    <div class="ticket-token" style="font-size: 11px; color: #38bdf8; margin-top: 4px; word-break: break-all;">VERIFY: ${escapeHtml(validVerificationString)}</div>
                    <div class="scan-hint">Scan at gate entrance on event date for check-in</div>
                </div>

                <div class="details-grid">
                    <div class="detail-row">
                        <span class="detail-label">Guest Name</span>
                        <span class="detail-value">${escapeHtml(guestName || 'Guest')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Guest Email</span>
                        <span class="detail-value">${escapeHtml(guestEmail || '')}</span>
                    </div>
                    ${guestPhone ? `
                    <div class="detail-row">
                        <span class="detail-label">Phone</span>
                        <span class="detail-value">${escapeHtml(guestPhone)}</span>
                    </div>` : ''}
                    ${registrationNumber ? `
                    <div class="detail-row">
                        <span class="detail-label">Registration ID</span>
                        <span class="detail-value" style="font-family:monospace; color:#38bdf8;">${escapeHtml(registrationNumber)}</span>
                    </div>` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Event Date</span>
                        <span class="detail-value">${escapeHtml(eventDate || 'TBD')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Start Time</span>
                        <span class="detail-value">${escapeHtml(startTime || 'TBD')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Venue</span>
                        <span class="detail-value">${escapeHtml(venue || 'TBD')}</span>
                    </div>
                    ${address ? `
                    <div class="detail-row">
                        <span class="detail-label">Address</span>
                        <span class="detail-value">${escapeHtml(address)}</span>
                    </div>` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Verification String</span>
                        <span class="detail-value" style="font-family:monospace; color:#38bdf8; font-size:11px; word-break:break-all;">${escapeHtml(validVerificationString)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Entry Token</span>
                        <span class="detail-value" style="font-family:monospace; color:#38bdf8;">${escapeHtml(secureToken || 'N/A')}</span>
                    </div>
                    ${customAnswersHtml}
                </div>

                <a href="${dashboardUrl}" class="btn">View Ticket in Dashboard</a>
            </div>
            <div class="footer">
                <p>Please present this digital pass or the attached QR image at the entrance scanner on event day.</p>
                <p>&copy; 2026 EventHub Management Platform. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient && resendClient.isConfigured) {
            const registeredAccountEmail = (process.env.RESEND_REGISTERED_EMAIL || 'priyapatel36306@gmail.com').trim().toLowerCase();
            const recipientEmail = (guestEmail || '').trim().toLowerCase();

            const emailPayload = {
                from: fromAddress,
                to: recipientEmail,
                subject: `🎟️ Your QR Ticket: ${eventTitle || 'Event'} [Pass: ${ticketNumber || 'Confirmed'}]`,
                html: htmlContent
            };

            // Attach QR code image for offline access and guaranteed display in all email clients
            if (qrCodeDataUrl) {
                const base64Content = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
                emailPayload.attachments = [
                    {
                        filename: `Ticket-QR-${ticketNumber || 'Pass'}.png`,
                        content: base64Content
                    }
                ];
            }

            let response = await resendClient.emails.send(emailPayload);
            
            // If Resend rejects due to unverified test domain restriction, deliver to the registered account email
            if (response && response.error) {
                console.warn(`[Email Service - Resend Notice] Direct send to ${recipientEmail} encountered restriction (${response.error.message}). Delivering directly to registered account: ${registeredAccountEmail}`);
                emailPayload.to = registeredAccountEmail;
                emailPayload.subject = `🎟️ [EventHub Ticket Pass] ${eventTitle || 'Event'} [${ticketNumber}] (Attendee: ${guestName} <${recipientEmail}>)`;
                response = await resendClient.emails.send(emailPayload);
            }

            if (response && response.error) {
                console.error('[Email Service - Resend API Error]', response.error);
            } else {
                console.log(`[Email Service] ✅ QR Ticket email successfully dispatched via Resend API to ${emailPayload.to} (ID: ${response?.data?.id || 'ok'})`);
            }
        } else {
            console.log(`\n======================================================`);
            console.log(`[BLACK & SLATE TICKET EMAIL PREVIEW MODE]`);
            console.log(`To: ${guestEmail}`);
            console.log(`Subject: Your QR Ticket: ${eventTitle} [Pass: ${ticketNumber}]`);
            console.log(`Ticket Number: ${ticketNumber}`);
            console.log(`Registration Number: ${registrationNumber}`);
            console.log(`Event Date: ${eventDate}`);
            console.log(`Venue: ${venue}`);
            console.log(`Secure Token: ${secureToken}`);
            console.log(`======================================================\n`);
        }
    } catch (err) {
        console.error('[Email Service - Resend Exception]', err.message);
    }
}

/**
 * Sends a high-contrast Member QR Pass email to a newly registered member.
 */
async function sendMemberPassEmail({ email, name, memberId, secureToken, verificationString, qrCodeDataUrl, role }) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub <onboarding@resend.dev>';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5100'}/dashboard`;
    const validVerificationString = verificationString || `EVENTHUB-MEMBER:${memberId}:${secureToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your EventHub Digital Member Pass</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 550px; margin: 30px auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #334155; }
            .brand { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #f8fafc; text-transform: uppercase; margin-bottom: 6px; }
            .badge { display: inline-block; background-color: #1e293b; color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #38bdf8; }
            .content { padding: 32px 24px; text-align: center; }
            .qr-wrap { background-color: #ffffff; padding: 16px; border-radius: 16px; display: inline-block; margin: 20px 0; border: 2px solid #38bdf8; }
            .unique-id { font-family: monospace; font-size: 16px; font-weight: 900; color: #38bdf8; letter-spacing: 2px; }
            .meta-box { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: left; }
            .btn { display: inline-block; background-color: #38bdf8; color: #020617; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">EventHub Platform</div>
                <div class="badge">Official Member Pass</div>
            </div>
            <div class="content">
                <h2 style="margin:0 0 8px 0; font-size: 22px;">Welcome, ${escapeHtml(name)}!</h2>
                <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px 0;">Your unique digital QR pass has been generated.</p>
                
                <div class="qr-wrap">
                    ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Member QR Code" width="200" height="200" style="display:block;" />` : ''}
                </div>

                <div class="unique-id">UNIQUE ID: ${escapeHtml(memberId)}</div>
                <div style="font-family: monospace; font-size: 12px; color: #38bdf8; margin-top: 6px; word-break: break-all;">VERIFY: ${escapeHtml(validVerificationString)}</div>

                <div class="meta-box">
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Member:</strong> ${escapeHtml(name)}</p>
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Role:</strong> ${escapeHtml((role || 'guest').toUpperCase())}</p>
                    <p style="margin: 4px 0; font-size: 13px;"><strong>Verification String:</strong> <span style="font-family:monospace; color:#38bdf8; font-size:11px;">${escapeHtml(validVerificationString)}</span></p>
                    <p style="margin: 4px 0; font-size: 11px; color: #94a3b8;"><strong>Notice:</strong> One-time admission. Expired upon Admin scanning at the gate.</p>
                </div>

                <a href="${dashboardUrl}" class="btn">Access Member Dashboard</a>
            </div>
            <div class="footer">
                &copy; 2026 EventHub. Present this QR code or Unique ID at the entrance gate scanner.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient && resendClient.isConfigured) {
            const registeredAccountEmail = (process.env.RESEND_REGISTERED_EMAIL || 'priyapatel36306@gmail.com').trim().toLowerCase();
            const recipientEmail = (email || '').trim().toLowerCase();

            const emailPayload = {
                from: fromAddress,
                to: recipientEmail,
                subject: `🎟️ Your EventHub Member Pass [${memberId}]`,
                html: htmlContent
            };

            if (qrCodeDataUrl) {
                const base64Content = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '');
                emailPayload.attachments = [
                    {
                        filename: `Member-Pass-${memberId}.png`,
                        content: base64Content
                    }
                ];
            }

            let response = await resendClient.emails.send(emailPayload);
            
            // If Resend rejects due to unverified test domain restriction, deliver to the registered account email
            if (response && response.error) {
                console.warn(`[Email Service - Resend Notice] Direct send to ${recipientEmail} encountered restriction (${response.error.message}). Delivering directly to registered account: ${registeredAccountEmail}`);
                emailPayload.to = registeredAccountEmail;
                emailPayload.subject = `🎟️ [EventHub Member Pass] ${memberId} (Member: ${name} <${recipientEmail}>)`;
                response = await resendClient.emails.send(emailPayload);
            }

            if (response && response.error) {
                console.error('[Email Service - Resend API Error]', response.error);
            } else {
                console.log(`[Email Service] ✅ Member QR Pass email successfully dispatched via Resend API to ${emailPayload.to} (ID: ${response?.data?.id || 'ok'})`);
            }
        } else {
            console.log(`[Member Pass Email Preview] Generated for ${email} with ID ${memberId}`);
        }
    } catch (err) {
        console.error('[Email Service Member Pass Error]', err.message);
    }
}

/**
 * Sends a high-contrast Black & Oceanic Slate Email OTP verification to the user using Resend API.
 */
async function sendOtpEmail({ email, otp, name }) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub Tickets <onboarding@resend.dev>';
    const recipientEmail = (email || '').trim().toLowerCase();
    const displayName = (name || '').trim() || 'Valued User';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your EventHub Verification Code</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 30px auto; background-color: #0b1528; border: 1px solid #1e394e; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { background: linear-gradient(135deg, #020817 0%, #041124 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e394e; }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #e0f2fe; text-transform: uppercase; margin-bottom: 6px; }
            .badge { display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid rgba(56, 189, 248, 0.4); letter-spacing: 1px; }
            .content { padding: 32px 24px; text-align: center; }
            .greeting { font-size: 17px; font-weight: 700; color: #e0f2fe; margin-bottom: 12px; }
            .instructions { font-size: 13px; color: #94b8d6; line-height: 1.6; margin-bottom: 24px; }
            .otp-box { background-color: #020817; border: 2px solid #38bdf8; border-radius: 14px; padding: 22px 16px; margin: 20px 0; text-align: center; box-shadow: 0 0 25px rgba(56, 189, 248, 0.2); }
            .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #38bdf8; display: inline-block; padding-left: 12px; }
            .timer { font-size: 12px; color: #38bdf8; font-weight: 600; margin-top: 10px; }
            .warning { font-size: 11px; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; line-height: 1.5; }
            .footer { background-color: #020817; padding: 18px 24px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">EVENT<span style="color: #38bdf8;">HUB</span></div>
                <div class="badge">Email Verification</div>
            </div>
            <div class="content">
                <div class="greeting">Hello ${escapeHtml(displayName)},</div>
                <div class="instructions">
                    Please use the One-Time Password (OTP) below to verify your email address and complete your EventHub account registration:
                </div>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="timer">⏱️ Valid for 10 minutes only</div>
                </div>
                <div class="instructions" style="font-size: 12px; color: #cbd5e1;">
                    Enter this 6-digit code on the registration verification screen.
                </div>
                <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. EventHub administrators and staff will never ask for your verification code.
                </div>
            </div>
            <div class="footer">
                &copy; 2026 EventHub Inc. • All Rights Reserved
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient && resendClient.isConfigured) {
            const registeredAccountEmail = (process.env.RESEND_REGISTERED_EMAIL || 'priyapatel36306@gmail.com').trim().toLowerCase();

            const emailPayload = {
                from: fromAddress,
                to: recipientEmail,
                subject: `🔐 [EventHub] Your Verification Code: ${otp}`,
                html: htmlContent
            };

            let response = await resendClient.emails.send(emailPayload);

            // Handle unverified test domain fallback
            if (response && response.error) {
                console.warn(`[OTP Email - Resend Notice] Direct send to ${recipientEmail} encountered restriction (${response.error.message}). Delivering to registered account: ${registeredAccountEmail}`);
                emailPayload.to = registeredAccountEmail;
                emailPayload.subject = `🔐 [EventHub OTP: ${otp}] For: ${displayName} <${recipientEmail}>`;
                response = await resendClient.emails.send(emailPayload);
            }

            if (response && response.error) {
                console.error('[OTP Email - Resend API Error]', response.error);
            } else {
                console.log(`[OTP Email] ✅ Verification OTP (${otp}) dispatched to ${emailPayload.to} (ID: ${response?.data?.id || 'ok'})`);
            }
        } else {
            console.log(`\n======================================================`);
            console.log(`[EMAIL OTP PREVIEW MODE]`);
            console.log(`To: ${recipientEmail}`);
            console.log(`OTP Code: ${otp}`);
            console.log(`Subject: [EventHub] Your Verification Code: ${otp}`);
            console.log(`======================================================\n`);
        }
    } catch (err) {
        console.error('[OTP Email Exception]', err.message);
    }
}

/**
 * Sends a Password Reset OTP email with account identification info
 */
async function sendPasswordResetOtpEmail({ email, name, otp, role, adminId, memberId }) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub Security <onboarding@resend.dev>';
    const recipientEmail = (email || '').trim().toLowerCase();
    const displayName = (name || '').trim() || 'User';
    const identifier = adminId || memberId || '';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your EventHub Password</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 30px auto; background-color: #0b1528; border: 1px solid #1e394e; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { background: linear-gradient(135deg, #020817 0%, #041124 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e394e; }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #e0f2fe; text-transform: uppercase; margin-bottom: 6px; }
            .badge { display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid rgba(245, 158, 11, 0.4); letter-spacing: 1px; }
            .content { padding: 32px 24px; text-align: center; }
            .greeting { font-size: 17px; font-weight: 700; color: #e0f2fe; margin-bottom: 12px; }
            .instructions { font-size: 13px; color: #94b8d6; line-height: 1.6; margin-bottom: 20px; }
            .account-info { background-color: #020817; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 16px; margin: 16px 0; text-align: left; font-size: 12px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .info-label { color: #64748b; }
            .info-value { color: #38bdf8; font-weight: 700; font-family: monospace; }
            .otp-box { background-color: #020817; border: 2px solid #38bdf8; border-radius: 14px; padding: 22px 16px; margin: 20px 0; text-align: center; box-shadow: 0 0 25px rgba(56, 189, 248, 0.2); }
            .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #38bdf8; display: inline-block; padding-left: 12px; }
            .timer { font-size: 12px; color: #38bdf8; font-weight: 600; margin-top: 10px; }
            .warning { font-size: 11px; color: #ef4444; margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; line-height: 1.5; }
            .footer { background-color: #020817; padding: 18px 24px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">EVENT<span style="color: #38bdf8;">HUB</span></div>
                <div class="badge">Password Recovery</div>
            </div>
            <div class="content">
                <div class="greeting">Hello ${escapeHtml(displayName)},</div>
                <div class="instructions">
                    We received a request to recover or reset the password for your EventHub account. Use the 6-digit recovery code below:
                </div>
                
                <div class="account-info">
                    <div class="info-row"><span class="info-label">Account Email:</span> <span class="info-value">${escapeHtml(recipientEmail)}</span></div>
                    <div class="info-row"><span class="info-label">Account Role:</span> <span class="info-value">${escapeHtml(role || 'Attendee')}</span></div>
                    ${identifier ? `<div class="info-row"><span class="info-label">Account ID:</span> <span class="info-value">${escapeHtml(identifier)}</span></div>` : ''}
                </div>

                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="timer">⏱️ Code valid for 15 minutes only</div>
                </div>

                <div class="instructions" style="font-size: 12px; color: #cbd5e1;">
                    Enter this verification code on the Forgot Password screen along with your new password.
                </div>

                <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> If you did not initiate this request, your account is still secure. You can safely ignore this email.
                </div>
            </div>
            <div class="footer">
                &copy; 2026 EventHub Inc. • Password Recovery Service
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient && resendClient.isConfigured) {
            const registeredAccountEmail = (process.env.RESEND_REGISTERED_EMAIL || 'priyapatel36306@gmail.com').trim().toLowerCase();

            const emailPayload = {
                from: fromAddress,
                to: recipientEmail,
                subject: `🔑 [EventHub] Password Reset Code: ${otp}`,
                html: htmlContent
            };

            let response = await resendClient.emails.send(emailPayload);

            if (response && response.error) {
                console.warn(`[Reset OTP Email - Resend Notice] Delivering to registered account: ${registeredAccountEmail}`);
                emailPayload.to = registeredAccountEmail;
                emailPayload.subject = `🔑 [EventHub Password Reset: ${otp}] For: ${displayName} <${recipientEmail}>`;
                response = await resendClient.emails.send(emailPayload);
            }

            if (response && response.error) {
                console.error('[Reset OTP Email - Resend API Error]', response.error);
            } else {
                console.log(`[Reset OTP Email] ✅ Dispatched to ${emailPayload.to} (ID: ${response?.data?.id || 'ok'})`);
            }
        } else {
            console.log(`\n======================================================`);
            console.log(`[PASSWORD RESET OTP PREVIEW]`);
            console.log(`To: ${recipientEmail}`);
            console.log(`OTP Code: ${otp}`);
            console.log(`======================================================\n`);
        }
    } catch (err) {
        console.error('[Reset OTP Email Exception]', err.message);
    }
}

/**
 * Sends a confirmation email after password has been successfully reset
 */
async function sendPasswordResetSuccessEmail({ email, name, role }) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub Security <onboarding@resend.dev>';
    const recipientEmail = (email || '').trim().toLowerCase();
    const displayName = (name || '').trim() || 'User';
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>EventHub Password Successfully Changed</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 30px auto; background-color: #0b1528; border: 1px solid #1e394e; border-radius: 20px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #020817 0%, #041124 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e394e; }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #e0f2fe; text-transform: uppercase; margin-bottom: 6px; }
            .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid rgba(16, 185, 129, 0.4); }
            .content { padding: 32px 24px; text-align: center; }
            .greeting { font-size: 17px; font-weight: 700; color: #e0f2fe; margin-bottom: 12px; }
            .instructions { font-size: 13px; color: #94b8d6; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; background: linear-gradient(to right, #00f2fe, #0284c7); color: #020817; font-weight: 900; font-size: 13px; padding: 12px 28px; border-radius: 12px; text-decoration: none; margin: 16px 0; }
            .footer { background-color: #020817; padding: 18px 24px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">EVENT<span style="color: #38bdf8;">HUB</span></div>
                <div class="badge">Security Notification</div>
            </div>
            <div class="content">
                <div class="greeting">Hello ${escapeHtml(displayName)},</div>
                <div class="instructions">
                    Your EventHub password was successfully updated. You can now use your email <strong>${escapeHtml(recipientEmail)}</strong> and new password to access your account.
                </div>
                <div>
                    <a href="${loginUrl}" class="btn">Sign In to EventHub</a>
                </div>
            </div>
            <div class="footer">
                &copy; 2026 EventHub Inc. • Security Team
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient && resendClient.isConfigured) {
            const registeredAccountEmail = (process.env.RESEND_REGISTERED_EMAIL || 'priyapatel36306@gmail.com').trim().toLowerCase();
            const emailPayload = {
                from: fromAddress,
                to: recipientEmail,
                subject: `✅ [EventHub] Password Successfully Changed`,
                html: htmlContent
            };
            let response = await resendClient.emails.send(emailPayload);
            if (response && response.error) {
                emailPayload.to = registeredAccountEmail;
                emailPayload.subject = `✅ [EventHub Password Changed] For: ${displayName} <${recipientEmail}>`;
                response = await resendClient.emails.send(emailPayload);
            }
        }
    } catch (err) {
        console.error('[Password Reset Success Email Exception]', err.message);
    }
}

/**
 * Sends newly generated temporary credentials directly to user's email
 */
async function sendTemporaryCredentialsEmail({ email, name, temporaryPassword, role, memberId, adminId }) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub Security <onboarding@resend.dev>';
    const recipientEmail = (email || '').trim().toLowerCase();
    const displayName = (name || '').trim() || 'User';
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const identifier = adminId || memberId || '';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your EventHub Login Credentials</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 30px auto; background-color: #0b1528; border: 1px solid #1e394e; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { background: linear-gradient(135deg, #020817 0%, #041124 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e394e; }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #e0f2fe; text-transform: uppercase; margin-bottom: 6px; }
            .badge { display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid rgba(56, 189, 248, 0.4); }
            .content { padding: 32px 24px; text-align: center; }
            .greeting { font-size: 17px; font-weight: 700; color: #e0f2fe; margin-bottom: 12px; }
            .instructions { font-size: 13px; color: #94b8d6; line-height: 1.6; margin-bottom: 20px; }
            .cred-card { background-color: #020817; border: 2px solid #38bdf8; border-radius: 14px; padding: 18px 20px; margin: 20px 0; text-align: left; box-shadow: 0 0 25px rgba(56, 189, 248, 0.2); font-size: 13px; }
            .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
            .cred-row:last-child { border-bottom: none; }
            .cred-label { color: #64748b; font-weight: 600; }
            .cred-val { color: #e0f2fe; font-family: monospace; font-weight: 700; }
            .temp-pwd { color: #38bdf8; font-size: 16px; font-weight: 900; background: #0b1528; padding: 2px 8px; border-radius: 6px; border: 1px solid #1e394e; }
            .btn { display: inline-block; background: linear-gradient(to right, #00f2fe, #0284c7); color: #020817; font-weight: 900; font-size: 13px; padding: 12px 28px; border-radius: 12px; text-decoration: none; margin: 16px 0; }
            .warning { font-size: 11px; color: #f59e0b; margin-top: 18px; padding-top: 14px; border-top: 1px solid #1e293b; line-height: 1.5; }
            .footer { background-color: #020817; padding: 18px 24px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">EVENT<span style="color: #38bdf8;">HUB</span></div>
                <div class="badge">Account Credentials</div>
            </div>
            <div class="content">
                <div class="greeting">Hello ${escapeHtml(displayName)},</div>
                <div class="instructions">
                    Here are your recovered login credentials for your EventHub account:
                </div>

                <div class="cred-card">
                    <div class="cred-row"><span class="cred-label">Login Email:</span> <span class="cred-val">${escapeHtml(recipientEmail)}</span></div>
                    <div class="cred-row"><span class="cred-label">Temporary Password:</span> <span class="temp-pwd">${escapeHtml(temporaryPassword)}</span></div>
                    <div class="cred-row"><span class="cred-label">Account Role:</span> <span class="cred-val">${escapeHtml(role || 'Attendee')}</span></div>
                    ${identifier ? `<div class="cred-row"><span class="cred-label">Account ID:</span> <span class="cred-val">${escapeHtml(identifier)}</span></div>` : ''}
                </div>

                <div>
                    <a href="${loginUrl}" class="btn">Sign In Now</a>
                </div>

                <div class="warning">
                    💡 <strong>Tip:</strong> Once logged in, you can update this temporary password to your personal password anytime.
                </div>
            </div>
            <div class="footer">
                &copy; 2026 EventHub Inc. • Account Access
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient && resendClient.isConfigured) {
            const registeredAccountEmail = (process.env.RESEND_REGISTERED_EMAIL || 'priyapatel36306@gmail.com').trim().toLowerCase();

            const emailPayload = {
                from: fromAddress,
                to: recipientEmail,
                subject: `🔐 [EventHub] Your Login Credentials & Temporary Password`,
                html: htmlContent
            };

            let response = await resendClient.emails.send(emailPayload);

            if (response && response.error) {
                console.warn(`[Temporary Credentials Email - Resend Notice] Delivering to registered account: ${registeredAccountEmail}`);
                emailPayload.to = registeredAccountEmail;
                emailPayload.subject = `🔐 [EventHub Credentials: ${temporaryPassword}] For: ${displayName} <${recipientEmail}>`;
                response = await resendClient.emails.send(emailPayload);
            }

            if (response && response.error) {
                console.error('[Temporary Credentials Email - Resend API Error]', response.error);
            } else {
                console.log(`[Temporary Credentials Email] ✅ Dispatched to ${emailPayload.to} (ID: ${response?.data?.id || 'ok'})`);
            }
        } else {
            console.log(`\n======================================================`);
            console.log(`[TEMPORARY CREDENTIALS PREVIEW]`);
            console.log(`To: ${recipientEmail}`);
            console.log(`Password: ${temporaryPassword}`);
            console.log(`======================================================\n`);
        }
    } catch (err) {
        console.error('[Temporary Credentials Email Exception]', err.message);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatLabel(str) {
    if (!str) return '';
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = {
    sendQRTicketEmail,
    sendMemberPassEmail,
    sendOtpEmail,
    sendPasswordResetOtpEmail,
    sendPasswordResetSuccessEmail,
    sendTemporaryCredentialsEmail
};

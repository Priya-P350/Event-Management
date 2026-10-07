const resendClient = require('../config/resend');

/**
 * Sends a high-contrast Black & Slate HTML ticket email to the guest using Resend API.
 */
async function sendQRTicketEmail({ guestEmail, guestName, eventTitle, eventDate, startTime, venue, address, ticketNumber, secureToken, qrCodeDataUrl }) {
    const fromAddress = process.env.EMAIL_FROM || 'EventHub <onboarding@resend.dev>';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5100'}/dashboard`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Event Ticket - ${eventTitle}</title>
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
                margin-bottom: 16px;
                text-align: center;
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
                width: 200px;
                height: 200px;
                background: #ffffff;
                padding: 12px;
                border-radius: 8px;
            }
            .ticket-token {
                font-family: monospace;
                color: #94a3b8;
                font-size: 13px;
                margin-top: 12px;
                letter-spacing: 1px;
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
                <h1 class="event-title">${eventTitle}</h1>
                
                <div class="qr-wrapper">
                    <img src="${qrCodeDataUrl}" alt="QR Ticket Code" class="qr-image" />
                    <div class="ticket-token">TICKET ID: ${ticketNumber}</div>
                    <div style="font-size:11px; color:#64748b; margin-top:4px;">Scan at gate for instant check-in</div>
                </div>

                <div class="details-grid">
                    <div class="detail-row">
                        <span class="detail-label">Guest Name</span>
                        <span class="detail-value">${guestName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Event Date</span>
                        <span class="detail-value">${eventDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Start Time</span>
                        <span class="detail-value">${startTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Venue</span>
                        <span class="detail-value">${venue}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address</span>
                        <span class="detail-value">${address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Entry Token</span>
                        <span class="detail-value" style="font-family:monospace; color:#38bdf8;">${secureToken}</span>
                    </div>
                </div>

                <a href="${dashboardUrl}" class="btn">View Ticket in Dashboard</a>
            </div>
            <div class="footer">
                <p>Please present this digital pass at the entrance scanner on event day.</p>
                <p>&copy; 2026 EventHub Management Platform. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        if (resendClient) {
            const data = await resendClient.emails.send({
                from: fromAddress,
                to: guestEmail,
                subject: `🎟️ Your QR Ticket: ${eventTitle}`,
                html: htmlContent
            });
            console.log(`[Email Service] Sent QR Ticket email via Resend API to ${guestEmail} (ID: ${data.id || 'ok'})`);
        } else {
            console.log(`\n======================================================`);
            console.log(`[BLACK & SLATE TICKET EMAIL PREVIEW MODE]`);
            console.log(`To: ${guestEmail}`);
            console.log(`Subject: Your QR Ticket: ${eventTitle}`);
            console.log(`Ticket Number: ${ticketNumber}`);
            console.log(`Secure Token: ${secureToken}`);
            console.log(`======================================================\n`);
        }
    } catch (err) {
        console.error('[Email Service - Resend Exception]', err.message);
    }
}

module.exports = {
    sendQRTicketEmail
};

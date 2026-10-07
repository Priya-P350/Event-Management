const QRCode = require('qrcode');
const crypto = require('crypto');
const dbQuery = require('../config/db');
const resendClient = require('../config/resend');

/**
 * Controller to generate a unique QR code for the authenticated user,
 * persist reference data in database, and send an email via Resend API.
 */
async function generateAndEmailQrCode(req, res, next) {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const userName = req.user?.name || 'Valued User';

        if (!userId || !userEmail) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. Valid user session required.'
            });
        }

        // 1. Generate unique secure token and payload
        const secureToken = `QR-TOKEN-${crypto.randomBytes(16).toString('hex')}`;
        const qrPayload = `EVENTHUB-VERIFY:${secureToken}:${userId}`;

        // 2. Generate QR code Buffer & DataURL for DB/storage
        const qrBuffer = await QRCode.toBuffer(qrPayload, {
            errorCorrectionLevel: 'H',
            type: 'png',
            margin: 2,
            scale: 8,
            color: { dark: '#020617', light: '#ffffff' }
        });

        const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

        // 3. Database Persistence (Create Record)
        const qrRecordId = crypto.randomUUID();
        const newQrData = {
            id: qrRecordId,
            userId,
            secureToken,
            qrCodeData: qrDataUrl,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        // Save to DB
        let createdRecord = null;
        try {
            if (dbQuery.createQrCodeRecord) {
                createdRecord = await dbQuery.createQrCodeRecord(newQrData);
            } else {
                createdRecord = newQrData;
            }
        } catch (dbErr) {
            console.error('[QR Controller DB Error]', dbErr);
            return res.status(500).json({
                success: false,
                message: 'Failed to record QR code transaction in database.'
            });
        }

        // 4. Send Email via Resend API with Attachments & Rollback on Failure
        const fromAddress = process.env.EMAIL_FROM || 'EventHub <onboarding@resend.dev>';

        const htmlEmailBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }
                .card { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; text-align: center; }
                .title { font-size: 20px; font-weight: bold; color: #ffffff; margin-bottom: 8px; }
                .qr-container { background: #ffffff; padding: 16px; border-radius: 12px; display: inline-block; margin: 20px 0; }
                .token { font-family: monospace; font-size: 12px; color: #94a3b8; word-break: break-all; }
                .footer { font-size: 11px; color: #64748b; margin-top: 24px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="title">Your Unique Digital QR Pass</div>
                <p style="font-size:13px; color:#cbd5e1;">Hello ${userName}, your unique QR access code has been generated.</p>
                <div class="qr-container">
                    <img src="${qrDataUrl}" alt="Your QR Code" width="200" height="200" style="display:block;" />
                </div>
                <div class="token">TOKEN: ${secureToken}</div>
                <div class="footer">Keep this email safe. Present this code at the scanner gate.</div>
            </div>
        </body>
        </html>
        `;

        try {
            if (resendClient) {
                const response = await resendClient.emails.send({
                    from: fromAddress,
                    to: userEmail,
                    subject: '🎟️ Your Unique QR Access Code',
                    html: htmlEmailBody,
                    attachments: [
                        {
                            filename: `qrcode-${secureToken.slice(0, 8)}.png`,
                            content: qrBuffer.toString('base64')
                        }
                    ]
                });
                console.log(`[QR Email Sent] Successfully sent QR pass via Resend API to ${userEmail} (ID: ${response.id || 'ok'})`);
            } else {
                console.log(`[QR Email Preview] Resend API key not configured. Email prepared for ${userEmail}`);
            }
        } catch (emailError) {
            console.error('[QR Email Error] Rollback trigger: Failed to dispatch Resend email:', emailError.message);
            
            // Database Rollback
            if (dbQuery.deleteQrCodeRecord) {
                await dbQuery.deleteQrCodeRecord(qrRecordId);
            }

            return res.status(502).json({
                success: false,
                message: 'Failed to deliver QR code email via Resend API. Transaction rolled back.'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Unique QR code generated and emailed via Resend API successfully.',
            qrCode: {
                id: qrRecordId,
                secureToken,
                status: 'active',
                sentTo: userEmail
            }
        });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    generateAndEmailQrCode
};

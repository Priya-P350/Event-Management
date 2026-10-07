const nodemailer = require('nodemailer');

const emailHost = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

let transporter = null;

if (emailUser && emailPassword) {
    transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for 587 or 2525
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });
    console.log(`[Email Service] Configured live Nodemailer SMTP transporter (${emailHost}:${emailPort}) for: ${emailUser}`);
} else {
    console.log('[Email Service] SMTP credentials not set. Email service will run in Console Preview Mode.');
}

module.exports = transporter;

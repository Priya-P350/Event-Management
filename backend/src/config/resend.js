const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;

let resendClient = null;

if (apiKey && apiKey !== 'your_resend_api_key') {
    resendClient = new Resend(apiKey);
    console.log('[Email Service] Configured live Resend API Client.');
} else {
    console.log('[Email Service] RESEND_API_KEY not set. Email service will run in Console Preview Mode.');
}

module.exports = resendClient;

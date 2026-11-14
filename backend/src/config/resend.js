const { Resend } = require('resend');

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== 'your_resend_api_key' && apiKey.trim().length > 0) {
        return new Resend(apiKey.trim());
    }
    return null;
}

const resendProxy = new Proxy({}, {
    get(target, prop) {
        const client = getResendClient();
        if (prop === 'isConfigured') {
            return !!client;
        }
        if (prop === 'client' || prop === 'getClient') {
            return client;
        }
        if (!client) {
            return undefined;
        }
        return client[prop];
    }
});

module.exports = resendProxy;

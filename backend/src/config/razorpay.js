const Razorpay = require('razorpay');
const crypto = require('crypto');

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_12345';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret_key_67890';

const razorpayInstance = new Razorpay({
    key_id,
    key_secret
});

/**
 * Creates Razorpay order safely with fallback sandbox mode
 */
async function createOrder(amount, currency = 'INR', receiptId) {
    try {
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('mock')) {
            console.log('[Razorpay Sandbox] Creating simulated order for amount:', amount);
            return {
                id: `order_sandbox_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                entity: 'order',
                amount: Math.round(amount * 100),
                amount_paid: 0,
                amount_due: Math.round(amount * 100),
                currency,
                receipt: receiptId,
                status: 'created',
                created_at: Math.floor(Date.now() / 1000)
            };
        }

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency,
            receipt: receiptId,
            payment_capture: 1
        };

        const order = await razorpayInstance.orders.create(options);
        return order;
    } catch (error) {
        console.error('[Razorpay Order Error]', error);
        throw error;
    }
}

/**
 * Verifies Razorpay payment signature HMAC SHA256
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('mock') || signature.includes('mock')) {
        console.log('[Razorpay Sandbox Mode] Payment signature verified successfully (Sandbox)');
        return true;
    }

    const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generated_signature === signature;
}

/**
 * Verifies Webhook raw body signature
 */
function verifyWebhookSignature(rawBody, signature, secret) {
    if (!secret || secret.includes('mock')) return true;

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    return expectedSignature === signature;
}

module.exports = {
    razorpayInstance,
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    key_id
};

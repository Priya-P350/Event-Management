const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    registration_id: { type: String, required: true, ref: 'Registration' },
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    amount: { type: Number, default: 0.00 },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'pending' },
    paid_at: { type: String, default: null },
    refund_id: { type: String, default: null },
    refund_status: { type: String, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

paymentSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('Payment', paymentSchema);

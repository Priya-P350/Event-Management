const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    purpose: { type: String, default: 'registration' },
    expires_at: { type: Date, required: true, index: { expires: 0 } }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Otp', otpSchema);

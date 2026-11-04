const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    password_hash: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['guest', 'scanner_staff', 'event_admin', 'super_admin'], 
        default: 'guest' 
    },
    admin_id: { type: String, sparse: true, index: true, unique: true },
    member_id: { type: String, sparse: true, index: true },
    qr_code_data: { type: String, default: '' },
    qr_token: { type: String, sparse: true, index: true },
    qr_status: { 
        type: String, 
        enum: ['active', 'expired', 'suspended'], 
        default: 'active' 
    },
    qr_scanned_at: { type: String, default: null },
    qr_scanned_by: { type: String, default: null },
    qr_device_info: { type: String, default: null }
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

// Virtual id getter
userSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('User', userSchema);

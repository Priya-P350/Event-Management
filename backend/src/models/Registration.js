const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    event_id: { type: String, required: true, ref: 'Event' },
    user_id: { type: String, required: true, ref: 'User' },
    registration_number: { type: String, required: true, unique: true },
    guest_name: { type: String, required: true },
    guest_email: { type: String, required: true },
    guest_phone: { type: String, default: '' },
    custom_answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    registration_status: { type: String, default: 'pending' }
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

registrationSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('Registration', registrationSchema);

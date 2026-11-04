const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    registration_id: { type: String, required: true, ref: 'Registration' },
    event_id: { type: String, required: true, ref: 'Event' },
    user_id: { type: String, required: true, ref: 'User' },
    ticket_number: { type: String, required: true, unique: true },
    secure_token: { type: String, required: true, unique: true },
    qr_code_data: { type: String, required: true },
    status: { type: String, default: 'active' }
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

ticketSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('Ticket', ticketSchema);

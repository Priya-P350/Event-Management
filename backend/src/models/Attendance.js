const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    ticket_id: { type: String, default: null, ref: 'Ticket' },
    event_id: { type: String, default: null, ref: 'Event' },
    registration_id: { type: String, default: null, ref: 'Registration' },
    user_id: { type: String, default: null, ref: 'User' },
    member_id: { type: String, default: null },
    checked_in_by: { type: String, default: null },
    checked_in_at: { type: String, default: () => new Date().toISOString() },
    status: { type: String, default: 'expired' },
    device_info: { type: String, default: 'Gate Camera' }
}, {
    timestamps: false,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

attendanceSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('Attendance', attendanceSchema);

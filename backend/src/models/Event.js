const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    cover_image_url: { type: String, default: '' },
    event_date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    venue: { type: String, required: true },
    address: { type: String, default: '' },
    google_maps_url: { type: String, default: '' },
    ticket_price: { type: Number, default: 0.00 },
    capacity: { type: Number, default: 100 },
    registration_open_at: { type: String, default: null },
    registration_close_at: { type: String, default: null },
    status: { type: String, default: 'draft' },
    created_by: { type: String, default: null },
    iti_trade: { type: String, default: '' },
    iti_institute: { type: String, default: '' },
    iti_eligibility: { type: String, default: '' }
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

eventSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('Event', eventSchema);

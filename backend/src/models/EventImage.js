const mongoose = require('mongoose');

const eventImageSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    event_id: { type: String, required: true, ref: 'Event' },
    image_url: { type: String, required: true },
    caption: { type: String, default: '' },
    uploaded_by: { type: String, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

eventImageSchema.virtual('id').get(function() {
    return this._id;
});

module.exports = mongoose.model('EventImage', eventImageSchema);

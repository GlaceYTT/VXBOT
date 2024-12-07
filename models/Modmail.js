const { Schema, model } = require('mongoose');

const modmailSchema = new Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    channelId: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
}, { timestamps: true });

module.exports = model('Modmail', modmailSchema);

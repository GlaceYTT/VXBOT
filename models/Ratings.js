const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    userType: { type: String, enum: ['Free', 'Premium'], required: true },
    transactionFlow: { type: String, required: true }, // Example: "Crypto → Currency"
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating between 1 and 5
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rating', ratingSchema);

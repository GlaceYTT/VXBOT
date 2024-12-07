const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: String,
    username: String,
    serverId: String,
    serverName: String,
    ownerId: String,
    ownerName: String,
    country: String,
    receiveCountry: String,
    currency: String,
    sendMethod: String,
    receiveMethod: String,
    amount: Number,
    paymentMethod: String,
    transactionId: String,
    status: String,
    type: { type: String, enum: ['Currency', 'Crypto'] }, // Make it optional
    cryptoType: { type: String }, // Type of cryptocurrency if 'Crypto'
    sendNetwork: { type: String }, // Network for sending, e.g., TRC-20/Bitcoin
    receiveNetwork: { type: String }, // Network for receiving
    sendingDetails: { type: Object, default: {} }, // Separate field for sending details
    receivingDetails: { type: Object, default: {} }, // Separate field for receiving details
    userType: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);

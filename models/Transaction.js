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
    sendCurrency: { type: String }, 
    receiveCurrency: { type: String },
    sendMethod: String,
    receiveMethod: String,
    amount: Number,
    paymentMethod: String,
    transactionId: String,
    status: String,
    type: { type: String, enum: ['Currency', 'Crypto'] }, 
    sendingCryptoType: { type: String },
    receivingCryptoType: { type: String },
    sendNetwork: { type: String }, 
    receiveNetwork: { type: String }, 
    sendingDetails: { type: Object, default: {} }, 
    receivingDetails: { type: Object, default: {} }, 
    userType: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const premiumServerSchema = new mongoose.Schema({
    serverId: { type: String, required: true, unique: true },
    serverName: { type: String, required: true },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PremiumServer', premiumServerSchema);

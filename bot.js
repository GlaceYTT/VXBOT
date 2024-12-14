// Load required modules
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('🌟 Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Load Rating Model
const Rating = require('./models/Ratings');
const Transaction = require('./models/Transaction');

// Discord Bot Logic
client.commands = new Collection();
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}!`);
    client.user.setActivity('Currency', {
        type: 'STREAMING',
        url: 'https://www.twitch.tv/YourTwitchChannel',
    });
});

// Load commands dynamically
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Load event handlers dynamically
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
}

// Define API Route to Fetch Ratings
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Rating.find();
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
// Define API Route to Fetch Transactions
app.get('/api/transactions', async (req, res) => {
    try {
        // Fetch transactions with status "Completed"
        const completedTransactions = await Transaction.find({ status: "Completed" });
        res.json(completedTransactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});


// Root Route to Check Server
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html'); 
    res.sendFile(filePath);
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Express server running at: http://localhost:${PORT}`);
});

// Log in to Discord
client.login(process.env.TOKEN);

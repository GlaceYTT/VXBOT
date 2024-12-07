const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const { registerCommands } = require('./routes/register');
require('dotenv').config();
const path = require('path');
const { ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,] });

// Load commands into the client
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Load event handlers
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
    
}
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}!`);

    // Set the bot's streaming activity
    client.user.setActivity('Currecny', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/YourTwitchChannel'
    });

    console.log('🎥 Bot is now streaming!');
});
const express = require("express");
const app = express();
const port = 3000;
app.get('/', (req, res) => {
  const imagePath = path.join(__dirname, 'index.html');
  res.sendFile(imagePath);
});
app.listen(port, () => {
  console.log(`🔗 Listening to GlaceYT : http://localhost:${port}`);
});
registerCommands();

// Log in to Discord
client.login(process.env.TOKEN);

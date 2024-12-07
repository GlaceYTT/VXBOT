const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// Function to register commands globally
async function registerCommands() {
    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    // Load all commands dynamically
    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('Started refreshing application (/) commands globally.');

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });

        console.log('Successfully reloaded application (/) commands globally.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

module.exports = { registerCommands };

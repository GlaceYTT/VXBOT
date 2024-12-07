const { SlashCommandBuilder } = require('discord.js');
const PremiumServer = require('../models/PremiumServer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-premium-server')
        .setDescription('Add a server to the premium list.')
        .addStringOption(option =>
            option
                .setName('serverid')
                .setDescription('The ID of the server to mark as premium.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const serverId = interaction.options.getString('serverid');

        try {
            // Check if the server is already in the premium list
            const existingServer = await PremiumServer.findOne({ serverId });

            if (existingServer) {
                return interaction.reply({
                    content: `Server with ID **${serverId}** is already marked as premium.`,
                    ephemeral: true,
                });
            }

            // Fetch server details using the client
            const guild = await interaction.client.guilds.fetch(serverId).catch(() => null);

            if (!guild) {
                return interaction.reply({
                    content: `Could not fetch details for server ID **${serverId}**. Make sure the bot is in the server.`,
                    ephemeral: true,
                });
            }

            // Fetch owner details
            const owner = await guild.fetchOwner();

            // Save server to the premium list
            const premiumServer = new PremiumServer({
                serverId: guild.id,
                serverName: guild.name,
                ownerId: owner.id,
                ownerName: owner.user.tag,
            });
            await premiumServer.save();

            return interaction.reply({
                content: `Server **${guild.name}** has been successfully added to the premium list.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error adding premium server:', error);
            return interaction.reply({
                content: 'An error occurred while adding the server to the premium list.',
                ephemeral: true,
            });
        }
    },
};

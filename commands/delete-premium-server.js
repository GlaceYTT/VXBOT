const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const PremiumServer = require('../models/PremiumServer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-premium-server')
        .setDescription('Remove a server from the premium list.')
        .addStringOption(option =>
            option
                .setName('serverid')
                .setDescription('The ID of the server to remove from the premium list.')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command. Only Administrators can execute this command.',
                ephemeral: true,
            });
        }
        const serverId = interaction.options.getString('serverid');

        try {
            const deletedServer = await PremiumServer.findOneAndDelete({ serverId });

            if (!deletedServer) {
                return interaction.reply({
                    content: `Server with ID **${serverId}** was not found in the premium list.`,
                    ephemeral: true,
                });
            }

            return interaction.reply({
                content: `Server **${deletedServer.serverName}** has been removed from the premium list.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error deleting premium server:', error);
            return interaction.reply({
                content: 'An error occurred while removing the server from the premium list.',
                ephemeral: true,
            });
        }
    },
};

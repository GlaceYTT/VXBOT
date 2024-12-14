const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PremiumServer = require('../models/PremiumServer');
const { PermissionFlagsBits } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('view-premium-servers')
        .setDescription('View all premium servers.'),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command. Only Administrators can execute this command.',
                ephemeral: true,
            });
        }
        try {
            const premiumServers = await PremiumServer.find();

            if (premiumServers.length === 0) {
                return interaction.reply({ content: 'No premium servers found.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Premium Servers')
                .setColor(0x00AE86);

            premiumServers.forEach(server => {
                embed.addFields({
                    name: server.serverName,
                    value: `**Server ID:** ${server.serverId}\n**Owner:** ${server.ownerName} (${server.ownerId})\n**Added At:** ${server.addedAt.toLocaleString()}`,
                });
            });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error fetching premium servers:', error);
            return interaction.reply({
                content: 'An error occurred while fetching premium servers.',
                ephemeral: true,
            });
        }
    },
};

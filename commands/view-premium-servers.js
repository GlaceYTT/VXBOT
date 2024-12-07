const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PremiumServer = require('../models/PremiumServer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view-premium-servers')
        .setDescription('View all premium servers.'),

    async execute(interaction) {
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

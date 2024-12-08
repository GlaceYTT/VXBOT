const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Rating = require('../models/Ratings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratings')
        .setDescription('View all ratings.'),
    async execute(interaction) {
        try {
            const ratings = await Rating.find();

            if (ratings.length === 0) {
                return interaction.reply({ content: 'No ratings found.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Ratings List')
                .setColor(0x00AE86);

            ratings.forEach((rating, index) => {
                embed.addFields({
                    name: `Rating ${index + 1}`,
                    value: `
                    **User:** ${rating.username} (ID: ${rating.userId})
                    **User Type:** ${rating.userType}
                    **Transaction Flow:** ${rating.transactionFlow}
                    **Rating:** ${'⭐'.repeat(rating.rating)}
                    **Created At:** ${rating.createdAt.toLocaleString()}
                    `,
                });
            });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error handling ratings command:', error.message);
            return interaction.reply({
                content: 'An error occurred while fetching ratings.',
                ephemeral: true,
            });
        }
    },
};

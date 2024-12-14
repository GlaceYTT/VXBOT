const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Modmail = require('../models/Modmail');

module.exports = async (client, message) => {
    if (message.author.bot) return;

    const isDM = !message.guild;

    if (isDM) {
        // Check for an existing modmail session
        let modmail = await Modmail.findOne({ userId: message.author.id, status: 'Open' });

        if (!modmail) {
            // Send embed with Yes/No buttons
            const embed = new EmbedBuilder()
                .setTitle('Start Modmail')
                .setDescription(
                    'It seems like you want to reach out to our support team. Would you like to start a modmail session?'
                )
                .setColor('Blue');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('modmail_start_yes')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('modmail_start_no')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Danger)
            );

            return message.author.send({ embeds: [embed], components: [row] }).catch(console.error);
        } else {
            // Forward the user's message to the modmail channel
            const channel = await client.channels.fetch(modmail.channelId).catch(console.error);

            if (channel) {
                await channel.send(`**${message.author.tag}:** ${message.content}`);
            } else {
                console.error(`Channel for modmail session ${modmail.channelId} not found.`);
            }
        }
    } else {
        // Handle messages from staff in modmail channels
        const modmail = await Modmail.findOne({ channelId: message.channel.id, status: 'Open' });

        if (modmail) {
            const user = await client.users.fetch(modmail.userId).catch(console.error);

            if (user) {
                await user.send(`**Staff:** ${message.content}`).catch(console.error);
            } else {
                console.error(`User ${modmail.userId} not found.`);
            }
        }
    }
};

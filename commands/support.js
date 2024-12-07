const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { secureIcon } = require('../UI/icons');
const interfaceIcons = require('../UI/icons');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Displays the support options for the bot.'),
    async execute(interaction) {
        const modmailButton = new ButtonBuilder()
            .setCustomId('start_modmail')
            .setLabel('Start Modmail')
            .setStyle(ButtonStyle.Primary);

        const joinServerButton = new ButtonBuilder()
            .setLabel('Join our server')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/MBMbvcuegG');

        const row = new ActionRowBuilder().addComponents(modmailButton, joinServerButton);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Support Options')
            .setDescription(
                'We’re here to help! Choose one of the options below to get support:\n\n' +
                '💬 **[Join our Support Server](https://discord.gg/MBMbvcuegG)**\n' +
                'Connect with our team and get assistance quickly.\n\n' +
                'Alternatively, click the button below to start a modmail session.'
            )
            .setThumbnail('https://example.com/image.png')
            .setFooter({ text: 'We’re here to assist you!', iconURL: interfaceIcons.secureIcon });

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
        });
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Modmail = require('../models/Modmail');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail')
        .setDescription('Manage modmail in the current transaction channel.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Open a modmail session in this channel.')
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('The ID of the user to open modmail with.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the modmail session in this channel.')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.channel;

        if (subcommand === 'open') {
            const userId = interaction.options.getString('userid');
            const user = await interaction.client.users.fetch(userId).catch(() => null);

            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            let modmail = await Modmail.findOne({ channelId: channel.id });

            if (modmail && modmail.status === 'Open') {
                return interaction.reply({ content: 'A modmail session is already active in this channel.', ephemeral: true });
            }

            if (!modmail) {
                // Create a new modmail session
                modmail = new Modmail({
                    userId: user.id,
                    username: user.username,
                    channelId: channel.id,
                    status: 'Open',
                });
            } else {
                // Reuse existing session
                modmail.status = 'Open';
            }

            await modmail.save();

            // Notify the user
            const userEmbed = new EmbedBuilder()
                .setTitle('Modmail Started')
                .setDescription('Staff have initiated a modmail session with you. You can reply directly to this DM.')
                .setColor('Green');

            await user.send({ embeds: [userEmbed] }).catch(console.error);

            // Notify the staff in the channel
            const staffEmbed = new EmbedBuilder()
                .setTitle('Modmail Opened')
                .setDescription(`Modmail session started with ${user.tag}. Messages will sync between this channel and their DMs.`)
                .setColor('Blue');

            return interaction.reply({ embeds: [staffEmbed], ephemeral: true });
        }

        if (subcommand === 'close') {
            const modmail = await Modmail.findOne({ channelId: channel.id, status: 'Open' });

            if (!modmail) {
                return interaction.reply({ content: 'No active modmail session found in this channel.', ephemeral: true });
            }

            modmail.status = 'Closed';
            await modmail.save();

            const user = await interaction.client.users.fetch(modmail.userId).catch(() => null);

            if (user) {
                const userEmbed = new EmbedBuilder()
                    .setTitle('Modmail Closed')
                    .setDescription('Your modmail session has been closed by staff.')
                    .setColor('Red');

                await user.send({ embeds: [userEmbed] }).catch(console.error);
            }

            const staffEmbed = new EmbedBuilder()
                .setTitle('Modmail Closed')
                .setDescription('The modmail session has been closed.')
                .setColor('Red');

            return interaction.reply({ embeds: [staffEmbed], ephemeral: true });
        }
    },
};

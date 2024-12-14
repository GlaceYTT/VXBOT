const { EmbedBuilder } = require('discord.js');
const Modmail = require('../models/Modmail');

async function startModmail(client, interaction) {
    const user = interaction.user;
    const guild = client.guilds.cache.get('1311747616429576313'); // Replace with your server ID
    const modmailCategory = guild.channels.cache.find(c => c.name === 'Modmail' && c.type === 4); // Ensure category exists

    if (!modmailCategory) {
        return interaction.reply({
            content: 'Modmail category not found. Please contact an admin.',
            ephemeral: true,
        });
    }

    // Check if the user already has an active modmail session
    let modmail = await Modmail.findOne({ userId: user.id, status: 'Open' });

    // if (modmail) {
    //     return interaction.reply({
    //         content: 'You already have an active modmail session.',
    //         ephemeral: true,
    //     });
    // }

    // Create a new modmail channel under the category
    const channel = await guild.channels.create({
        name: `modmail-${user.username}`,
        type: 0,
        parent: modmailCategory.id,
        permissionOverwrites: [
            { id: guild.id, deny: ['ViewChannel'] },
            { id: user.id, allow: ['ViewChannel', 'SendMessages'] },
        ],
    });

    // Save the session in the database
    modmail = new Modmail({
        userId: user.id,
        username: user.username,
        channelId: channel.id,
        status: 'Open',
    });
    await modmail.save();

    // Notify the user via DMs
    const userEmbed = new EmbedBuilder()
        .setTitle('Modmail Started')
        .setDescription('Staff have initiated a modmail session with you. You can reply directly in this channel.')
        .setColor('Green');

    await interaction.reply({
        content: 'Modmail session started. Please check your DMs.',
        ephemeral: true,
    });
    await user.send({ embeds: [userEmbed] }).catch(console.error);

    // Notify staff in the newly created modmail channel
    const staffEmbed = new EmbedBuilder()
        .setTitle('New Modmail Session')
        .setDescription(`Modmail session started with ${user.tag}. Messages will sync here.`)
        .setColor('Blue');

    await channel.send({ embeds: [staffEmbed] });

    console.log(`[MODMAIL] New session started for user ${user.tag} (${user.id}).`);
}

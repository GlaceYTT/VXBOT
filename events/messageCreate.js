const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Modmail = require('../models/Modmail');

module.exports = async (client, message) => {
    if (message.author.bot) return;

    const isDM = !message.guild;

    if (isDM) {
        // Handle messages from users in DMs
        let modmail = await Modmail.findOne({ userId: message.author.id, status: 'Open' });

        if (!modmail) {
            console.log(`No active modmail session found for user ${message.author.tag}`);
            return message.author.send(
                'No active modmail session was found. Use the /modmail command to start a new session.'
            ).catch(console.error);
        }

        let channel = await client.channels.fetch(modmail.channelId).catch(err => {
            console.error(`Failed to fetch channel: ${err}`);
            return null;
        });

        if (!channel) {
            console.error(`Modmail channel (${modmail.channelId}) not found for user ${message.author.tag}.`);

            // Close the old session
            modmail.status = 'Closed';
            await modmail.save();

            // Notify the user
            await message.author.send(
                'Your previous modmail session was closed because the linked channel was not found. A new session will now be started.'
            ).catch(console.error);

            // Start a new session
            const guild = client.guilds.cache.get('1311747616429576313'); // Replace with your server ID
            const modmailCategory = guild.channels.cache.find(
                c => c.name === 'Modmail' && c.type === 4
            );

            if (!modmailCategory) {
                return message.author.send(
                    'The modmail system is currently unavailable. Please contact an admin.'
                ).catch(console.error);
            }

            const newChannel = await guild.channels.create({
                name: `modmail-${message.author.username}`,
                type: 0,
                parent: modmailCategory.id,
                permissionOverwrites: [
                    { id: guild.id, deny: ['ViewChannel'] },
                    { id: message.author.id, allow: ['ViewChannel', 'SendMessages'] },
                ],
            }).catch(err => {
                console.error('Failed to create modmail channel:', err);
                return null;
            });

            if (!newChannel) {
                return message.author.send(
                    'Failed to create a new modmail session. Please contact an admin.'
                ).catch(console.error);
            }

            // Create a new modmail session
            modmail = new Modmail({
                userId: message.author.id,
                username: message.author.username,
                channelId: newChannel.id,
                status: 'Open',
            });
            await modmail.save();

            // Notify staff in the new channel
            const staffEmbed = new EmbedBuilder()
                .setTitle('New Modmail Session')
                .setDescription(`Modmail session started with ${message.author.tag}.`)
                .setColor('Blue');

            await newChannel.send({ embeds: [staffEmbed] });

            // Forward the user's message to the new channel
            const sentMessage = await newChannel.send(`**${message.author.tag}:** ${message.content}`);
            //await sentMessage.react('1313885111762292848'); // Reaction for "Received"
            console.log(`[MODMAIL] New session started for user ${message.author.tag} (${message.author.id}).`);
        } else {
            // Forward the user's message to the modmail channel
            const sentMessage = await channel.send(`**${message.author.tag}:** ${message.content}`);
            //await sentMessage.react('1313885111762292848'); // Reaction for "Received"
        }
    } else {
        // Handle messages from staff in guild channels
        const modmail = await Modmail.findOne({ channelId: message.channel.id, status: 'Open' });

        if (!modmail) {
            //console.log('No active modmail session in this channel.');
            return;
        }

        const user = await client.users.fetch(modmail.userId).catch(err => {
            //console.error(`Failed to fetch user (${modmail.userId}): ${err}`);
            return null;
        });

        if (!user) {
            //console.error(`User (${modmail.userId}) not found for this modmail session.`);
            return;
        }

        // Forward the staff's message to the user
        const sentMessage = await user.send(`**Staff:** ${message.content}`).catch(err => {
            //console.error('Failed to send staff message to the user:', err);
            //message.channel.send('Failed to send the message to the user.').catch(console.error);
        });

        if (sentMessage) {
            // Reaction for "Send" on the admin side
            //await message.react('1313885083383627846');
        }

        // Reaction for "Send" on the user side
        //await sentMessage.react('1313885083383627846').catch(console.error);
    }
};

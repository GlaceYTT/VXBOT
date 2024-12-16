const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const countries = require('../data/countries.json');
const cryptos = require('../data/cryptos.json');
const PremiumServer = require('../models/PremiumServer');
const Transaction = require('../models/Transaction');
const interfaceIcons = require('../UI/icons');
const tempData = require('../data/tempData');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('exchange')
        .setDescription('Initiate a currency or cryptocurrency exchange transaction.'),

    async execute(interaction) {
        const user = interaction.user;
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
        }

        let isPremium;
        try {
            isPremium = await PremiumServer.findOne({ serverId: guild.id });
        } catch (error) {
            console.error('Error checking premium status:', error);
            return interaction.reply({
                content: 'An error occurred while verifying the server status.',
                ephemeral: true
            });
        }

        // Fetch server and owner details
        const serverDetails = {
            serverId: guild.id,
            serverName: guild.name,
            ownerId: guild.ownerId,
            ownerName: (await guild.fetchOwner()).user.tag,
            userType: isPremium ? 'Premium' : 'Free'
        };

        // Create a new transaction for the user
        const transaction = new Transaction({
            userId: user.id,
            username: user.username,
            serverId: serverDetails.serverId,
            serverName: serverDetails.serverName,
            ownerId: serverDetails.ownerId,
            ownerName: serverDetails.ownerName,
            status: 'Pending',
            userType: serverDetails.userType
        });

        await transaction.save();

        // Respond based on the server type
        const serverMessage = isPremium
            ? 'You are using <a:d1:1312681838640365669> **Premium Version**.\n- **No extra commission fees apply!**'
            : 'You are using <a:918203450498629692:1312685580395479110> **Free Version**.\n- **Extra commission fees may apply**.';

        const embed1 = new EmbedBuilder()
            .setDescription(`- ${serverMessage}\n- Please check your DMs to continue the process.`)
            .setColor(isPremium ? 0xFFD700 : 0x00AE86)
            .setAuthor({
                name: 'Currency Exchange',
                iconURL: interfaceIcons.currencyIcon
            })
            .setFooter({
                text: interaction.user.tag,
                iconURL: interaction.user.avatarURL()
            })
            .setTimestamp();

        const l1 = new ButtonBuilder()
            .setLabel('Get Premium!')
            .setURL('https://discord.gg/4m8sN3wnPg')
            .setEmoji('1312683621190205440')
            .setStyle(ButtonStyle.Link);

        const l2 = new ButtonBuilder()
            .setLabel('Support Server')
            .setURL('https://discord.gg/4m8sN3wnPg')
            .setEmoji('1312683396220190770')
            .setStyle(ButtonStyle.Link);

        const row1 = new ActionRowBuilder().addComponents(l1, l2);

        await interaction.reply({
            embeds: [embed1],
            components: [row1],
            ephemeral: true
        });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'VX Bot',
                iconURL: interfaceIcons.vxIcon
            })
            .setDescription(
                `- You are initiating a transaction in **${serverDetails.serverName}**.\n` +
                `- **Server Type:** ${isPremium ? '<a:d1:1312681838640365669> Premium Version' : '<a:918203450498629692:1312685580395479110> Free Version'}\n` +
                `- **Server ID:** ${serverDetails.serverId}\n` +
                `- **Owner:** ${serverDetails.ownerName} (${serverDetails.ownerId})\n\n` +
                '- Select **Currency** or **Crypto** to proceed with the exchange process.'
            )
            .setFooter({
                text: 'Safe, Secure & Fast!',
                iconURL: interfaceIcons.secureIcon
            })
            .setTimestamp()
            .setColor(isPremium ? 0xFFD700 : 0x00AE86);

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_transaction_type')
                    .setPlaceholder('Choose Currency or Crypto')
                    .addOptions([
                        { label: 'Currency', value: 'Currency', emoji: '💵' },
                        { label: 'Crypto', value: 'Crypto', emoji: '🪙' }
                    ])
            );

        try {


            // Save the embed message ID in tempData (instead of the transaction directly)
            const message = await user.send({ embeds: [embed], components: [row] });
            const tempKey = `${transaction.userId}_${transaction.status}`;
            tempData.set(tempKey, message.id); // Save using consistent key
            console.log('Saved Message ID in tempData:', tempKey, message.id);
            
            // transaction.embedMessageId = message.id;
            // console.log('Embed Message ID:', message.id);  
            // await transaction.save();
            // console.log('DEBUG: Found Transaction:', transaction);

            const messageId = tempData.get(transaction._id.toString()); // Retrieve using string key
            if (!messageId) {
                console.error('Message ID not found in tempData for transaction:', transaction._id.toString());
            } else {
                console.log('Retrieved Message ID from tempData:', messageId);
            }
        } catch (err) {
            console.error('Failed to send DM:', err);
            await interaction.followUp({
                content: 'I could not send you a DM. Please enable DMs and try again.',
                ephemeral: true
            });
        }
    }
};

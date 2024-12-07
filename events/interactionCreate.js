const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const Transaction = require('../models/Transaction');
const countries = require('../data/countries.json');
const cryptos = require('../data/cryptos.json');
const tempData = require('../data/tempData');
const TARGET_SERVER_ID = '1311747616429576313';
const interfaceIcons = require('../UI/icons');
const modmailHandler = require('../handlers/modmailHandler');
module.exports = async (client, interaction) => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
        }
    }

    if (interaction.isStringSelectMenu()) {
        const { customId, values, user } = interaction;
        if (customId === 'select_transaction_type') {
            const transactionType = values[0];
            
            // Save temporary data for flow direction
            const serverDetails = tempData.get(user.id) || {};
            serverDetails.flowType = transactionType;
            tempData.set(user.id, serverDetails);
        
            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: 'Select Sending Type', 
                    iconURL: interfaceIcons.selectIcon 
                })
                .setDescription('Choose the type of sending method for your transaction.')
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_sending_type')
                    .setPlaceholder('Choose sending method')
                    .addOptions([
                        { label: transactionType === 'Currency' ? 'Currency' : 'Cryptocurrency', value: transactionType },
                        { label: transactionType === 'Currency' ? 'Cryptocurrency' : 'Currency', value: transactionType === 'Currency' ? 'Crypto' : 'Currency' }
                    ])
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_sending_type') {
            const sendingType = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.sendingType = sendingType;
            tempData.set(user.id, serverDetails);
        
            // Handling sending type selection based on transaction flow
            if (sendingType === 'Currency') {
                // Currency sending flow
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Select Continent', iconURL: interfaceIcons.continentIcon })
                    .setDescription('Choose a **continent** to start your currency transaction.')
                    .setColor(0x00AE86);
        
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_sending_continent')
                        .setPlaceholder('Choose a continent')
                        .addOptions(Object.keys(countries.continents).map(continent => {
                            const emoji = countries.emojiMappings[continent] || ''; 
                            return {
                                label: `${emoji} ${continent}`, 
                                value: continent 
                            };
                        }))
                );
        
                await interaction.update({ embeds: [embed], components: [row] });
            } else {
                // Crypto sending flow
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Select Cryptocurrency', iconURL: interfaceIcons.cryptoIcon })
                    .setDescription('Choose a **cryptocurrency** to start your transaction.')
                    .setColor(0x00AE86);
        
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_sending_crypto')
                        .setPlaceholder('Choose a cryptocurrency')
                        .addOptions(Object.keys(cryptos.cryptos).map((crypto) => ({
                            label: crypto,
                            value: crypto,
                        })))
                );
        
                await interaction.update({ embeds: [embed], components: [row] });
            }
        }
        
        if (customId === 'select_sending_crypto') {
            const sendingCrypto = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.sendingCrypto = sendingCrypto;
            tempData.set(user.id, serverDetails);
        
            const paymentMethods = cryptos.cryptos[sendingCrypto].send;
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Choose Sending Method - ${sendingCrypto}`, iconURL: interfaceIcons.paymentIcon })
                .setDescription(`Select a **payment method** for ${sendingCrypto}.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_crypto_sending_method')
                    .setPlaceholder('Choose a payment method')
                    .addOptions(
                        paymentMethods.map((method) => ({
                            label: method,
                            value: method,
                        }))
                    )
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_crypto_sending_method') {
            const sendingMethod = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.sendingMethod = sendingMethod;
            tempData.set(user.id, serverDetails);
        
            // Determine the receiving type based on the original transaction type
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Select Receiving Type', iconURL: interfaceIcons.continentIcon })
                .setDescription('Choose how you want to receive the transaction.')
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_receiving_type')
                    .setPlaceholder('Choose receiving method')
                    .addOptions([
                        { label: 'Currency', value: 'Currency' },
                        { label: 'Cryptocurrency', value: 'Crypto' }
                    ])
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_sending_continent') {
            const sendingContinent = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.sendingContinent = sendingContinent;
            tempData.set(user.id, serverDetails);
        
            const countriesList = countries.continents[sendingContinent];
        
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Continent - ${sendingContinent}`,
                    iconURL: interfaceIcons.continentIcon,
                })
                .setDescription(`- Select a **country** in **${sendingContinent}** to proceed.\n- Please choose correctly.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_sending_country')
                    .setPlaceholder('Choose your country')
                    .addOptions(
                        countriesList.map((country) => {
                            const emoji = countries.emojiMappings[country] || '';
                            return {
                                label: `${emoji} ${country}`,
                                value: country,
                            };
                        })
                    )
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_sending_country') {
            const sendingCountry = values[0];
            const currency = countries.currencies[sendingCountry];
            const serverDetails = tempData.get(user.id);
        
            // Create transaction with initial details
            const transaction = new Transaction({
                userId: user.id,
                username: user.username,
                serverId: serverDetails.serverId,
                serverName: serverDetails.serverName,
                ownerId: serverDetails.ownerId,
                ownerName: serverDetails.ownerName,
                country: sendingCountry,
                currency: currency,
                status: 'Pending',
                type: serverDetails.flowType,
                userType: serverDetails.isPremium ? 'Premium' : 'Free'
            });
            await transaction.save();
        
            const paymentMethods = countries.paymentMethods[sendingCountry];
        
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Choose Sending Method - ${sendingCountry}`,
                    iconURL: interfaceIcons.currencyIcon,
                })
                .setDescription(`You selected **${sendingCountry}** with currency **${currency}**.\n\nChoose a **sending method** to proceed.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_currency_sending_method')
                    .setPlaceholder('Choose your sending method')
                    .addOptions(
                        paymentMethods.send.map((method) => ({
                            label: method,
                            value: method,
                        }))
                    )
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_currency_sending_method') {
            const sendingMethod = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            transaction.sendMethod = sendingMethod;
            await transaction.save();
        
            // Decide receiving type based on original transaction flow
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Select Receiving Type', iconURL: interfaceIcons.continentIcon })
                .setDescription('Choose how you want to receive the transaction.')
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_receiving_type')
                    .setPlaceholder('Choose receiving method')
                    .addOptions([
                        { label: 'Currency', value: 'Currency' },
                        { label: 'Cryptocurrency', value: 'Crypto' }
                    ])
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_receiving_type') {
            const receivingType = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.receivingType = receivingType;
            tempData.set(user.id, serverDetails);
        
            if (receivingType === 'Currency') {
                // Currency receiving flow
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Select Receiving Continent', iconURL: interfaceIcons.continentIcon })
                    .setDescription('Choose a **continent** to receive your transaction.')
                    .setColor(0x00AE86);
        
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_receiving_continent')
                        .setPlaceholder('Choose a continent')
                        .addOptions(Object.keys(countries.continents).map(continent => {
                            const emoji = countries.emojiMappings[continent] || ''; 
                            return {
                                label: `${emoji} ${continent}`, 
                                value: continent 
                            };
                        }))
                );
        
                await interaction.update({ embeds: [embed], components: [row] });
            } else {
                // Crypto receiving flow
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Select Receiving Cryptocurrency', iconURL: interfaceIcons.cryptoIcon })
                    .setDescription('Choose a **cryptocurrency** to receive.')
                    .setColor(0x00AE86);
        
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_receiving_crypto')
                        .setPlaceholder('Choose a cryptocurrency')
                        .addOptions(Object.keys(cryptos.cryptos).map((crypto) => ({
                            label: crypto,
                            value: crypto,
                        })))
                );
        
                await interaction.update({ embeds: [embed], components: [row] });
            }
        }
        if (customId === 'select_receiving_crypto') {
            const receivingCrypto = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.receivingCrypto = receivingCrypto;
            tempData.set(user.id, serverDetails);
        
            // Get the available receiving methods for the selected cryptocurrency
            const paymentMethods = cryptos.cryptos[receivingCrypto].receive;
        
            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: `Choose Receiving Method - ${receivingCrypto}`, 
                    iconURL: interfaceIcons.paymentIcon 
                })
                .setDescription(`Select a **receiving method** for ${receivingCrypto}.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_crypto_receiving_method')
                    .setPlaceholder('Choose a receiving method')
                    .addOptions(
                        paymentMethods.map((method) => ({
                            label: method,
                            value: method,
                        }))
                    )
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_crypto_receiving_method') {
            const receiveMethod = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({
                    content: 'Transaction not found. Please restart the process.',
                    components: [],
                });
            }
        
            // Save the receiving cryptocurrency and method
            transaction.cryptoType = tempData.get(user.id).receivingCrypto;
            transaction.receiveMethod = receiveMethod;
        
            // Determine the network if applicable
            const cryptoDetails = cryptos.cryptos[transaction.cryptoType];
            transaction.receiveNetwork = cryptoDetails?.receiveDetails?.network_type || 'Not Set';
        
            await transaction.save();
        
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Transaction Summary',
                    iconURL: interfaceIcons.transactionIcon,
                })
                .setDescription(
                    `Your transaction details:\n\n` +
                    `- **Sending Type:** ${transaction.country || transaction.cryptoType || 'Not Set'}\n` +
                    `- **Sending Method:** ${transaction.sendMethod || 'Not Set'}\n\n` +
                    `- **Receiving Type:** ${transaction.receiveCountry || transaction.cryptoType || 'Not Set'}\n` +
                    `- **Receiving Method:** ${transaction.receiveMethod || 'Not Set'}\n` +
                    `- **Receiving Network:** ${transaction.receiveNetwork || 'Not Set'}\n\n` +
                    'Use the buttons below to enter additional details or finalize the transaction.'
                )
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('enter_sending_details')
                    .setLabel('Enter Sending Details')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('enter_receiving_details')
                    .setLabel('Enter Receiving Details')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('finish_transaction')
                    .setLabel('Finish Transaction')
                    .setStyle(ButtonStyle.Success)
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_receiving_continent') { // Corrected customId
            const receivingContinent = values[0];
            const serverDetails = tempData.get(user.id);
            serverDetails.receivingContinent = receivingContinent; // Save to tempData
            tempData.set(user.id, serverDetails);
        
            const countriesList = countries.continents[receivingContinent];
        
            if (!countriesList || countriesList.length === 0) {
                return interaction.update({
                    content: `No countries available in **${receivingContinent}**. Please start again.`,
                    components: [],
                });
            }
        
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Continent - ${receivingContinent}`,
                    iconURL: interfaceIcons.continentIcon,
                })
                .setDescription(`Select a **country** in **${receivingContinent}** to proceed.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_receiving_country') // Correct ID
                    .setPlaceholder('Choose your receiving country')
                    .addOptions(
                        countriesList.map((country) => {
                            const emoji = countries.emojiMappings[country] || '';
                            return {
                                label: `${emoji} ${country}`,
                                value: country,
                            };
                        })
                    )
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        
        if (customId === 'select_receiving_country') {
            const receivingCountry = values[0]; // Extract selected receiving country
            const currency = countries.currencies[receivingCountry];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({
                    content: 'Transaction not found. Please restart the process.',
                    components: [],
                });
            }
        
            // Save the receiving country and currency
            transaction.receiveCountry = receivingCountry;
            transaction.currency = currency; // Update the currency for receiving
            await transaction.save(); // Save changes to the database
        
            const paymentMethods = countries.paymentMethods[receivingCountry]?.receive || [];
            if (!paymentMethods.length) {
                return interaction.update({
                    content: `No receiving methods available for **${receivingCountry}**.`,
                    components: [],
                });
            }
        
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Choose Receiving Method - ${receivingCountry}`,
                    iconURL: interfaceIcons.currencyIcon,
                })
                .setDescription(
                    `You selected **${receivingCountry}** with currency **${currency}**.\n\nChoose a **receiving method** to proceed.`
                )
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('final_receive_method') // Ensure this matches the next handler
                    .setPlaceholder('Select a receiving method')
                    .addOptions(
                        paymentMethods.map((method) => ({
                            label: method,
                            value: method,
                        }))
                    )
            );
        
            // Ensure single response
            if (!interaction.replied) {
                await interaction.update({ embeds: [embed], components: [row] });
            }
        }
        
        
        if (customId === 'final_receive_method') {
            console.log('Triggered customId:', customId); // Debugging log
            const receiveMethod = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({
                    content: 'Transaction not found. Please restart the process.',
                    components: [],
                });
            }
        
            // Save the receiving method
            transaction.receiveMethod = receiveMethod;
            await transaction.save();
        
            const sendMethodDetails = countries.methodDetails[transaction.sendMethod] || 'No details available.';
            const receiveMethodDetails = countries.methodDetails[transaction.receiveMethod] || 'No details available.';
        
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Transaction Summary',
                    iconURL: interfaceIcons.transactionIcon,
                })
                .setDescription(
                    `Your transaction details:\n\n` +
                    `- **Sending Country/Crypto:** ${transaction.country || transaction.cryptoType || 'Not Set'}\n` +
                    `- **Sending Method:** ${transaction.sendMethod || 'Not Set'}\n` +
                    `- **Details:** ${sendMethodDetails}\n\n` +
                    `- **Receiving Country:** ${transaction.receiveCountry || 'Not Set'}\n` +
                    `- **Receiving Method:** ${transaction.receiveMethod || 'Not Set'}\n` +
                    `- **Details:** ${receiveMethodDetails}\n\n` +
                    'Use the buttons below to enter additional details or finalize the transaction.'
                )
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('enter_sending_details')
                    .setLabel('Enter Sending Details')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('enter_receiving_details')
                    .setLabel('Enter Receiving Details')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('finish_transaction')
                    .setLabel('Finish Transaction')
                    .setStyle(ButtonStyle.Success)
            );
        
            if (!interaction.replied) {
                await interaction.update({ embeds: [embed], components: [row] });
            }
        }
        
        
    }

    if (interaction.isButton()) {
        const { customId, user } = interaction;
        //console.log('\x1b[36m[ INTERACTION HANDLER ]\x1b[0m', '\x1b[32mButton interaction system active ✅\x1b[0m');
        //console.log('[BUTTON INTERACTION]', interaction.customId);

        // Route the button interaction based on its custom ID
        if (interaction.customId === 'start_modmail') {
            await modmailHandler.startModmail(client, interaction);
        }

       if (customId === 'enter_sending_details') {
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });

            if (!transaction) {
                return interaction.reply({
                    content: 'No pending transaction found. Please restart the process.',
                    ephemeral: true,
                });
            }

            // Determine the question source
            const isCrypto = transaction.type === 'Crypto';
            const dataset = isCrypto ? cryptos.cryptoModalQuestions : countries.modalQuestions;
            const identifier = isCrypto ? transaction.cryptoType : transaction.country;

            // Log details for debugging
            console.log('Dataset:', dataset);
            console.log('Identifier:', identifier);

            // Get the relevant questions, ensuring fallback to default
            const questions = dataset?.sendingDetails?.[identifier] || dataset?.sendingDetails?.default || [];

            if (!questions.length) {
                return interaction.reply({
                    content: 'No questions available for the selected sending method. Please contact support.',
                    ephemeral: true,
                });
            }

            // Build the modal
            const modal = new ModalBuilder()
                .setCustomId('sending_details_modal')
                .setTitle(`Enter ${isCrypto ? 'Crypto' : 'Currency'} Sending Details`);

            questions.forEach((question) => {
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId(question.id)
                            .setLabel(question.label)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(question.required)
                    )
                );
            });

            await interaction.showModal(modal);
        }


       
        
            if (customId === 'enter_receiving_details') {
                const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });

                if (!transaction) {
                    return interaction.reply({
                        content: 'No pending transaction found. Please restart the process.',
                        ephemeral: true,
                    });
                }

                // Determine the question source
                const isCrypto = transaction.receivingType === 'Crypto';
                const dataset = isCrypto ? cryptos.cryptoModalQuestions : countries.modalQuestions;
                const identifier = isCrypto ? transaction.cryptoType : transaction.receiveCountry;

                // Log details for debugging
                console.log('Dataset:', dataset);
                console.log('Identifier:', identifier);

                // Get the relevant questions, ensuring fallback to default
                const questions = dataset?.receivingDetails?.[identifier] || dataset?.receivingDetails?.default || [];

                if (!questions.length) {
                    return interaction.reply({
                        content: 'No questions available for the selected receiving method. Please contact support.',
                        ephemeral: true,
                    });
                }

                // Build the modal
                const modal = new ModalBuilder()
                    .setCustomId('receiving_details_modal')
                    .setTitle(`Enter ${isCrypto ? 'Crypto' : 'Currency'} Receiving Details`);

                questions.forEach((question) => {
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId(question.id)
                                .setLabel(question.label)
                                .setStyle(TextInputStyle.Short)
                                .setRequired(question.required)
                        )
                    );
                });

                await interaction.showModal(modal);
            }

      
        
        if (customId === 'cancel_transaction') {
            await Transaction.deleteOne({ userId: user.id, status: 'Pending' });
            await interaction.reply({ content: 'Transaction canceled successfully.', ephemeral: true });
        }
        if (['mark_processing', 'mark_on_hold', 'mark_completed', 'mark_canceled', 'mark_as_read'].includes(customId)) {
            const adminChannel = interaction.channel;
        
            if (!adminChannel.topic) {
                return interaction.reply({ content: 'This channel is not linked to a transaction.', ephemeral: true });
            }
        
            const transactionId = adminChannel.topic.split('Transaction ID: ')[1];
            const transaction = await Transaction.findById(transactionId);
        
            if (!transaction) {
                return interaction.reply({ content: 'Transaction not found.', ephemeral: true });
            }
        
            let newStatus, userMessage;
        
            switch (customId) {
                case 'mark_processing':
                    newStatus = 'Processing';
                    userMessage = '<a:process:1312705388134531072> Your transaction is now **Processing**.';
                    break;
                case 'mark_on_hold':
                    newStatus = 'On Hold';
                    userMessage = '<a:onhold:1312706100620951632> Your transaction is currently **On Hold**.';
                    break;
                case 'mark_completed':
                    newStatus = 'Completed';
                    userMessage = '<a:read:1312706994242584607> Your transaction has been **Completed**. Thank you!';

                    

                    const specificChannelId = '1313135236724293675'; // Replace with your specific channel ID.
    const specificChannel = await client.channels.fetch(specificChannelId).catch(console.error);

    if (specificChannel) {
        const completedEmbed = new EmbedBuilder()
            .setAuthor({
                name: '🎉 Transaction Successful',
                iconURL: interfaceIcons.tickIcon,
            })
            .setDescription(`**Transaction has been completed.**\n\n**Details:**`)
            .addFields(
                { name: 'User', value: `<@${transaction.userId}>`, inline: true },
                { name: 'Initiating Country', value: transaction.country || 'N/A', inline: true },
                { name: 'Currency', value: transaction.currency || 'N/A', inline: true },
                { name: 'Receiving Country', value: transaction.receiveCountry || 'Not Set' , inline: true},
                { name: 'User Type', value: transaction.userType === 'Premium' ? '🌟 Premium' : '🆓 Free', inline: true },
                { name: 'Handled By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Send Method', value: transaction.sendMethod || 'N/A', inline: true },
                { name: 'Receive Method', value: transaction.receiveMethod || 'N/A', inline: true },
            )
            .setColor(0x00FF00)
            .setFooter({
                text: 'Safe, Secure & Fast! | Order Completed',
                iconURL: interfaceIcons.secureIcon,
            })
            .setTimestamp();

                        await specificChannel.send({ embeds: [completedEmbed] });
                    } else {
                        console.error(`Failed to fetch the specific channel: ${specificChannelId}`);
                    }
                    break;
                case 'mark_canceled':
                    newStatus = 'Canceled';
                    userMessage = '<a:cancel:1312706577068720178> Your transaction has been **Canceled**.';
                    break;
                case 'mark_as_read':
                    newStatus = 'Read';
                    userMessage = '<a:maread:1312742596166029332> Your transaction has been marked as **Read**.';
                    break;
            }
        
            transaction.status = newStatus;
            await transaction.save();
        
            const adminMessages = await adminChannel.messages.fetch();
            const adminMessage = adminMessages.find((msg) =>
                msg.embeds[0]?.title === 'New Transaction from ' + transaction.username
            );
        
            if (adminMessage) {
                const updatedEmbed = EmbedBuilder.from(adminMessage.embeds[0]);
                updatedEmbed.spliceFields(
                    updatedEmbed.data.fields.findIndex((field) => field.name === 'Status'),
                    1,
                    { name: 'Status', value: `**${newStatus}**` }
                );
                await adminMessage.edit({ embeds: [updatedEmbed] });
            }
        
            try {
                const userToNotify = await client.users.fetch(transaction.userId);
        
                const userEmbed = new EmbedBuilder()
                    .setAuthor({
                        name: 'Transaction Update!',
                        iconURL: interfaceIcons.notifyIcon,
                    })
                    .setDescription(userMessage)
                    .addFields(
                        { name: 'Send Method', value: transaction.sendMethod || 'N/A', inline: true },
                        { name: 'Receive Method', value: transaction.receiveMethod || 'N/A', inline: true },
                        { name: 'Country', value: transaction.country, inline: true },
                        { name: 'Currency', value: transaction.currency, inline: true }
                    )
                    .setFooter({
                        text: 'Safe, Secure & Fast!',
                        iconURL: interfaceIcons.secureIcon,
                    })
                    .setColor(
                        newStatus === 'Completed' ? 0x00FF00 :
                        newStatus === 'Canceled' ? 0xFF0000 :
                        newStatus === 'Read' ? 0x0000FF :
                        0x00AE86
                    );
        
                await userToNotify.send({ embeds: [userEmbed] });
            } catch (error) {
                console.error(`Failed to send DM to user: ${transaction.userId}`, error);
            }
        
            await interaction.reply({ content: `Transaction status updated to **${newStatus}** and the user has been notified.`, ephemeral: true });
        }
        if (customId === 'finish_transaction') {
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });

            if (!transaction) {
                return interaction.reply({
                    content: 'No pending transaction found. Please restart the process.',
                    ephemeral: true,
                });
            }
        
            // Validate that both sendingDetails and receivingDetails are filled
            if (!transaction.sendingDetails || Object.keys(transaction.sendingDetails).length === 0) {
                return interaction.reply({
                    content: 'Please enter the Sending Details before finalizing the transaction.',
                    ephemeral: true,
                });
            }
        
            if (!transaction.receivingDetails || Object.keys(transaction.receivingDetails).length === 0) {
                return interaction.reply({
                    content: 'Please enter the Receiving Details before finalizing the transaction.',
                    ephemeral: true,
                });
            }
        
            // Mark the transaction as "Processing"
            transaction.status = 'Processing';
            await transaction.save();
        
            // Disable all buttons
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('enter_sending_details')
                    .setLabel('Enter Sending Details')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true), // Disabled
                new ButtonBuilder()
                    .setCustomId('enter_receiving_details')
                    .setLabel('Enter Receiving Details')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true), // Disabled
                new ButtonBuilder()
                    .setCustomId('finish_transaction')
                    .setLabel('Finish Transaction')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true) // Disabled
            );
        
            // Notify the user
            await interaction.update({
                content: 'Your transaction is now being processed.',
                components: [disabledRow],
            });
        
            // Fetch the guild using guildId
            const guild = await client.guilds.fetch(TARGET_SERVER_ID);
        
            // Create a channel for this transaction
            const categoryName = transaction.userType === 'Free' ? 'Free' : 'Premium';
        
            // Check if the category exists
            let category = guild.channels.cache.find(
                (channel) => channel.type === ChannelType.GuildCategory && channel.name === categoryName
            );
        
            // If the category doesn't exist, create it
            if (!category) {
                category = await guild.channels.create({
                    name: categoryName,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: ['ViewChannel'], // Default deny for everyone
                        },
                    ],
                });
            }
        
            // Create the transaction channel inside the appropriate category
            const adminChannel = await guild.channels.create({
                name: `transaction-${transaction._id}`,
                type: ChannelType.GuildText,
                topic: `Transaction ID: ${transaction._id}`,
                parent: category.id, // Place inside the category
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['ViewChannel'], // Hide the channel from everyone
                    },
                    {
                        id: guild.ownerId,
                        allow: ['ViewChannel', 'SendMessages', 'ManageMessages'], // Allow the guild owner
                    },
                ],
            });
        
            // Save the adminChannel ID in the transaction
            transaction.adminChannelId = adminChannel.id;
            await transaction.save();
        
            // Build the transaction summary embed
            const adminEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Transaction Summary', iconURL: interfaceIcons.transactionIcon })
            .setColor(0x00AE86)
            .setDescription('Here are the details of your transaction:')
            .setTimestamp();

        // Include user and server information
        adminEmbed.addFields(
            { name: 'User ID', value: transaction.userId || 'Not Set', inline: true },
            { name: 'Username', value: transaction.username || 'Not Set', inline: true },
            { name: 'Server ID', value: transaction.serverId || 'Not Set', inline: true },
            { name: 'Server Name', value: transaction.serverName || 'Not Set', inline: true },
            { name: 'Owner ID', value: transaction.ownerId || 'Not Set', inline: true },
            { name: 'Owner Name', value: transaction.ownerName || 'Not Set', inline: true }
        );

        // Include transaction overview
        adminEmbed.addFields(
            { name: 'Transaction Type', value: transaction.type || 'Not Set', inline: true },
            { name: 'User Type', value: transaction.userType || 'Not Set', inline: true },
            { name: 'Currency', value: transaction.currency || 'Not Set', inline: true },
            { name: 'Crypto Type', value: transaction.cryptoType || 'Not Set', inline: true },
            { name: 'Send Network', value: transaction.sendNetwork || 'Not Set', inline: true },
            { name: 'Receive Network', value: transaction.receiveNetwork || 'Not Set', inline: true },
            { name: 'Status', value: transaction.status || 'Not Set', inline: true }
        );

        // Add sending details
        const validSendingDetails = Object.entries(transaction.sendingDetails || {}).filter(
            ([key, value]) => key && value
        );
        adminEmbed.addFields(
            { name: 'Sending Details', value: '---', inline: false },
            ...validSendingDetails.map(([key, value]) => ({
                name: `Sending: ${key}`,
                value: value || 'N/A',
                inline: true,
            }))
        );

        // Add receiving details
        const validReceivingDetails = Object.entries(transaction.receivingDetails || {}).filter(
            ([key, value]) => key && value
        );
        adminEmbed.addFields(
            { name: 'Receiving Details', value: '---', inline: false },
            ...validReceivingDetails.map(([key, value]) => ({
                name: `Receiving: ${key}`,
                value: value || 'N/A',
                inline: true,
            }))
        )
            .setColor(0x00AE86);
        
            // Action row with transaction controls for admins
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId('mark_as_read')
                .setLabel('Mark as Read')
                .setEmoji('1312742596166029332')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('mark_processing')
                .setLabel('Processing')
                .setEmoji('1312705388134531072')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('mark_on_hold')
                .setLabel('On Hold')
                .setEmoji('1312706100620951632')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('mark_completed')
                .setLabel('Completed')
                .setEmoji('1312706994242584607')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('mark_canceled')
                .setLabel('Cancel')
                .setEmoji('1312743491327098941')
                .setStyle(ButtonStyle.Danger)
            );
        
            // Send the transaction details to the admin channel
            await adminChannel.send({ embeds: [adminEmbed], components: [row] });
        
            // Inform the user that the transaction is successfully submitted
            // const userEmbed = new EmbedBuilder()
            //     .setTitle('Transaction Submitted')
            //     .setDescription('Your transaction details have been submitted and are now processing.')
            //     .setColor(0x00AE86);
        
            // await interaction.reply({ embeds: [userEmbed], ephemeral: true });
        }
        
    }
   
    
    if (interaction.isModalSubmit()) {
        const { customId, user } = interaction;
    if (customId === 'sending_details_modal') {
        const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });

        if (!transaction) {
            return interaction.reply({
                content: 'No pending transaction found. Please restart the process.',
                ephemeral: true,
            });
        }

        // Collect responses
        const sendingDetails = {};
        interaction.fields.fields.forEach((field) => {
            sendingDetails[field.customId] = field.value;
        });

        // Save to transaction
        transaction.sendingDetails = sendingDetails;
        await transaction.save();

        console.log('Sending Details Saved:', transaction);

        return interaction.reply({
            content: 'Sending details saved successfully!',
            ephemeral: true,
        });
    }
    if (customId === 'receiving_details_modal') {
        const transaction = await Transaction.findOne({ userId: interaction.user.id, status: 'Pending' });
    
        if (!transaction) {
            return interaction.reply({
                content: 'No pending transaction found. Please restart the process.',
                ephemeral: true,
            });
        }
    
        // Debug receiving type
        console.log('Transaction Receiving Type:', transaction.receivingType);
    
        // Ensure receivingType and related fields are correctly set
        const isCrypto = transaction.receivingType === 'Crypto';
        const dataset = isCrypto ? cryptos.cryptoModalQuestions : countries.modalQuestions;
        const identifier = isCrypto ? transaction.cryptoType : transaction.receiveCountry || 'default';
    
        // Debug identifiers
        console.log('Dataset:', dataset);
        console.log('Identifier:', identifier);
    
        if (!identifier) {
            return interaction.reply({
                content: 'Unable to determine receiving identifier. Please restart the process.',
                ephemeral: true,
            });
        }
    
        // Collect responses
        const receivingDetails = {};
        interaction.fields.fields.forEach((field) => {
            receivingDetails[field.customId] = field.value;
        });
    
        // Save receiving details to the transaction
        transaction.receivingDetails = receivingDetails;
        await transaction.save();
    
        console.log('Receiving Details Saved:', transaction);
    
        return interaction.reply({
            content: 'Receiving details saved successfully!',
            ephemeral: true,
        });
    }
    
    
    }
    
};

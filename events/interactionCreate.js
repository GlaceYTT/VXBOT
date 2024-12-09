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
const Rating = require('../models/Ratings');
const countries = require('../data/countries.json');
const cryptos = require('../data/cryptos.json');
const tempData = require('../data/tempData');
const interfaceIcons = require('../UI/icons');
const modmailHandler = require('../handlers/modmailHandler');
const VOUCH_CHANNEL_ID = '1311777230669479946';
const ADMIN_TARGET_SERVER_ID = '1312775999934562374';
const RATING_GUILD_ID = '1311305017499848827';
const RATING_CHANNEL_ID = '1315226548596637756';
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
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            transaction.type = transactionType;
            await transaction.save();
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Select Sending Type', iconURL: interfaceIcons.selectIcon })
                .setDescription('Choose the type of sending method for your transaction.')
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_sending_type')
                    .setPlaceholder('Choose sending method')
                    .addOptions([
                        { label: 'Currency', value: 'Currency', emoji: '💵' },
                        { label: 'Cryptocurrency', value: 'Crypto', emoji: '🪙' }
                    ])
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        
        if (customId === 'select_sending_type') {
            const sendingType = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ 
                    content: 'Transaction not found. Please restart the process.', 
                    components: [] 
                });
            }
        
            // Update the transaction with the selected sending type
            transaction.type = sendingType; // Update the main type (Currency/Crypto)
            await transaction.save();
        
            if (sendingType === 'Currency') {
                // Currency flow: Present continent options dynamically
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Select Continent', iconURL: interfaceIcons.continentIcon })
                    .setDescription('Choose a continent for your currency transaction.')
                    .setColor(0x00AE86);
        
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_sending_continent')
                        .setPlaceholder('Choose a continent')
                        .addOptions(
                            Object.keys(countries.continents).map(continent => ({
                                label: `${countries.emojiMappings[continent] || ''} ${continent}`,
                                value: continent
                            }))
                        )
                );
        
                await interaction.update({ embeds: [embed], components: [row] });
            } else {
                // Crypto flow: Present cryptocurrency options dynamically
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Select Cryptocurrency', iconURL: interfaceIcons.cryptoIcon })
                    .setDescription('Choose a cryptocurrency for your transaction.')
                    .setColor(0x00AE86);
        
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_sending_crypto')
                        .setPlaceholder('Choose a cryptocurrency')
                        .addOptions(
                            Object.keys(cryptos.cryptos).map(crypto => ({
                                label: crypto,
                                value: crypto
                            }))
                        )
                );
        
                await interaction.update({ embeds: [embed], components: [row] });
            }
        }
        
        
        if (customId === 'select_sending_crypto') {
            const sendingCrypto = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            // Save the sending cryptocurrency type
            transaction.sendingCryptoType = sendingCrypto;
            await transaction.save();
        
            const paymentMethods = cryptos.cryptos[sendingCrypto].send;
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Choose Sending Method - ${sendingCrypto}`, iconURL: interfaceIcons.paymentIcon })
                .setDescription(`Select a **payment method** for ${sendingCrypto}.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_crypto_sending_method')
                    .setPlaceholder('Choose a payment method')
                    .addOptions(paymentMethods.map(method => ({ label: method, value: method })))
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        
        if (customId === 'select_crypto_sending_method') {
            const sendingMethod = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            // Save the sending method
            transaction.sendMethod = sendingMethod;
            await transaction.save();
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Select Receiving Type', iconURL: interfaceIcons.paymentIcon })
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
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            transaction.sendingDetails.continent = sendingContinent;
            await transaction.save();
        
            const countriesList = countries.continents[sendingContinent];
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Continent - ${sendingContinent}`, iconURL: interfaceIcons.continentIcon })
                .setDescription(`Select a **country** in **${sendingContinent}** to proceed.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_sending_country')
                    .setPlaceholder('Choose your country')
                    .addOptions(countriesList.map(country => ({
                        label: `${countries.emojiMappings[country] || ''} ${country}`,
                        value: country
                    })))
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        if (customId === 'select_sending_country') {
            const sendingCountry = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            transaction.country = sendingCountry;
            transaction.sendCurrency = countries.currencies[sendingCountry]; // Set sendCurrency
            await transaction.save();
        
            const paymentMethods = countries.paymentMethods[sendingCountry]?.send || [];
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Choose Sending Method - ${sendingCountry}`, iconURL: interfaceIcons.currencyIcon })
                .setDescription(
                    `You selected **${sendingCountry}** with currency **${transaction.sendCurrency}**.\nChoose a sending method to proceed.`
                )
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_currency_sending_method')
                    .setPlaceholder('Choose your sending method')
                    .addOptions(paymentMethods.map(method => ({ label: method, value: method })))
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        
        if (customId === 'select_currency_sending_method') {
            const sendingMethod = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            transaction.sendMethod = sendingMethod;
            await transaction.save();
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Select Receiving Type', iconURL: interfaceIcons.currencyIcon })
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
        
            // Fetch the transaction associated with the user
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({
                    content: 'Transaction not found. Please restart the process.',
                    components: []
                });
            }
        
            // Save the receiving type to the transaction
            transaction.receiveMethod = receivingType;
            await transaction.save();
        
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
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            // Save the receiving cryptocurrency type
            transaction.receivingCryptoType = receivingCrypto;
            await transaction.save();
        
            const paymentMethods = cryptos.cryptos[receivingCrypto].receive;
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Choose Receiving Method - ${receivingCrypto}`, iconURL: interfaceIcons.paymentIcon })
                .setDescription(`Select a **receiving method** for ${receivingCrypto}.`)
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_crypto_receiving_method')
                    .setPlaceholder('Choose a receiving method')
                    .addOptions(paymentMethods.map(method => ({ label: method, value: method })))
            );
        
            await interaction.update({ embeds: [embed], components: [row] });
        }
        
        
        if (customId === 'select_crypto_receiving_method') {
            const receiveMethod = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({ content: 'Transaction not found. Please restart.', components: [] });
            }
        
            // Save the receiving method and network
            transaction.receiveMethod = receiveMethod;
            transaction.receiveNetwork = receiveMethod.includes('TRC-20') ? 'TRC-20' :
                                         receiveMethod.includes('ERC-20') ? 'ERC-20' :
                                         'Unknown';
            await transaction.save();
        
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Transaction Summary', iconURL: interfaceIcons.transactionIcon })
                .setDescription(
                    `Your transaction details:\n\n` +
                    `- **Sending Crypto:** ${transaction.sendingCryptoType || 'Not Set'}\n` +
                    `- **Sending Method:** ${transaction.sendMethod || 'Not Set'}\n` +
                    `- **Receiving Crypto:** ${transaction.receivingCryptoType || 'Not Set'}\n` +
                    `- **Receiving Method:** ${transaction.receiveMethod || 'Not Set'}\n` +
                    `- **Receiving Network:** ${transaction.receiveNetwork || 'Unknown'}\n\n` +
                    'Finalize or modify your transaction.'
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
        
        
        if (customId === 'select_receiving_continent') {
            const receivingContinent = values[0];
        
            // Fetch the pending transaction for the user
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({
                    content: 'Transaction not found. Please restart the process.',
                    components: []
                });
            }
        
            // Save the receiving continent to the transaction
            transaction.receivingDetails.continent = receivingContinent;
            await transaction.save();
        
            // Fetch the countries in the selected continent
            const countriesList = countries.continents[receivingContinent];
        
            if (!countriesList || countriesList.length === 0) {
                return interaction.update({
                    content: `No countries available in **${receivingContinent}**. Please start again.`,
                    components: []
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
            const receivingCountry = values[0];
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                return interaction.update({
                    content: 'Transaction not found. Please restart the process.',
                    components: [],
                });
            }
        
            transaction.receiveCountry = receivingCountry;
            transaction.receiveCurrency = countries.currencies[receivingCountry]; // Set receiveCurrency
            await transaction.save();
        
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
                    `You selected **${receivingCountry}** with currency **${transaction.receiveCurrency}**.\n\nChoose a **receiving method** to proceed.`
                )
                .setColor(0x00AE86);
        
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('final_receive_method')
                    .setPlaceholder('Select a receiving method')
                    .addOptions(
                        paymentMethods.map((method) => ({
                            label: method,
                            value: method,
                        }))
                    )
            );
        
            if (!interaction.replied) {
                await interaction.update({ embeds: [embed], components: [row] });
            }
        }
        
        
        
        if (customId === 'final_receive_method') {
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
                    `- **Sending Country:** ${transaction.country || 'Not Set'}\n` +
                    `- **Sending Currency:** ${transaction.sendCurrency || 'Not Set'}\n` +
                    `- **Sending Method:** ${transaction.sendMethod || 'Not Set'}\n\n` +
                    `- **Details:** ${sendMethodDetails}\n\n` +
                    `- **Receiving Country:** ${transaction.receiveCountry || 'Not Set'}\n` +
                    `- **Receiving Currency:** ${transaction.receiveCurrency || 'Not Set'}\n` +
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
                console.log('DEBUG: No pending transaction found for user:', user.id);
                return interaction.reply({
                    content: 'No pending transaction found. Please restart the process.',
                    ephemeral: true,
                });
            }
        
            console.log('DEBUG: Found Transaction:', transaction);
        
            // Detect the flow
            const isCryptoToCrypto = transaction.sendingCryptoType && transaction.receivingCryptoType;
            const isCryptoToCurrency = transaction.sendingCryptoType && transaction.receiveCountry;
            const isCurrencyToCrypto = transaction.currency && transaction.receivingCryptoType;
            const isCurrencyToCurrency = transaction.currency && transaction.receiveCountry;
        
            let flowType = '';
            if (isCryptoToCrypto) flowType = 'crypto_to_crypto';
            else if (isCryptoToCurrency) flowType = 'crypto_to_currency';
            else if (isCurrencyToCrypto) flowType = 'currency_to_crypto';
            else if (isCurrencyToCurrency) flowType = 'currency_to_currency';
        
            console.log('DEBUG: Detected Flow:', flowType);
        
            // Select dataset based on the flow
            const dataset =
                flowType === 'crypto_to_crypto' || flowType === 'crypto_to_currency'
                    ? cryptos.cryptoModalQuestions
                    : countries.modalQuestions;
        
            console.log('DEBUG: Selected Dataset:', dataset);
        
            // Resolve the identifier
            let identifier;
            if (flowType === 'crypto_to_crypto' || flowType === 'crypto_to_currency') {
                identifier = transaction.sendingCryptoType; // Use Crypto type
            } else {
                identifier = transaction.country; // Use Country for currency transactions
            }
        
            console.log('DEBUG: Identifier for Sending Details:', identifier);
        
            // Fetch questions from the dataset
            const questions = dataset?.sendingDetails?.[identifier] || dataset?.sendingDetails?.default || [];
            console.log('DEBUG: Questions for Sending Details:', questions);
        
            if (!questions.length) {
                return interaction.reply({
                    content: 'No questions available for the selected sending method. Please contact support.',
                    ephemeral: true,
                });
            }
        
            // Build and show the modal
            const modal = new ModalBuilder()
                .setCustomId('sending_details_modal')
                .setTitle(`Enter Sending Details for ${identifier || 'Details'}`);
        
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
                console.log('DEBUG: No pending transaction found for user:', user.id);
                return interaction.reply({
                    content: 'No pending transaction found. Please restart the process.',
                    ephemeral: true,
                });
            }
        
            console.log('DEBUG: Found Transaction:', transaction);
        
            // Detect the flow
            const isCryptoToCrypto = transaction.sendingCryptoType && transaction.receivingCryptoType;
            const isCryptoToCurrency = transaction.sendingCryptoType && transaction.receiveCountry;
            const isCurrencyToCrypto = transaction.currency && transaction.receivingCryptoType;
            const isCurrencyToCurrency = transaction.currency && transaction.receiveCountry;
        
            let flowType = '';
            if (isCryptoToCrypto) flowType = 'crypto_to_crypto';
            else if (isCryptoToCurrency) flowType = 'crypto_to_currency';
            else if (isCurrencyToCrypto) flowType = 'currency_to_crypto';
            else if (isCurrencyToCurrency) flowType = 'currency_to_currency';
        
            console.log('DEBUG: Detected Flow:', flowType);
        
            // Select dataset based on the flow
            const dataset =
                flowType === 'crypto_to_crypto' ? cryptos.cryptoModalQuestions : countries.modalQuestions;
        
            console.log('DEBUG: Selected Dataset:', dataset);
        
            // Resolve the identifier
            let identifier;
            if (flowType === 'crypto_to_crypto' || flowType === 'crypto_to_currency') {
                identifier = transaction.receivingCryptoType || transaction.receiveCountry;
            } else {
                identifier = transaction.receiveCountry;
            }
        
            console.log('DEBUG: Identifier for Receiving Details:', identifier);
        
            // Fetch questions from the dataset
            const questions = dataset?.receivingDetails?.[identifier] || dataset?.receivingDetails?.default || [];
            console.log('DEBUG: Questions for Receiving Details:', questions);
        
            if (!questions.length) {
                return interaction.reply({
                    content: 'No questions available for the selected receiving method. Please contact support.',
                    ephemeral: true,
                });
            }
        
            // Build and show the modal
            const modal = new ModalBuilder()
                .setCustomId('receiving_details_modal')
                .setTitle(`Enter Receiving Details for ${identifier || 'Details'}`);
        
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
            const guild = await client.guilds.fetch(ADMIN_TARGET_SERVER_ID);
        
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
                });
            }
        
            // Create the transaction channel inside the appropriate category
            const adminChannel = await guild.channels.create({
                name: `transaction-${transaction._id}`,
                type: ChannelType.GuildText,
                topic: `Transaction ID: ${transaction._id}`,
                parent: category.id,
            });
        
            // Save the adminChannel ID in the transaction
            transaction.adminChannelId = adminChannel.id;
            await transaction.save();
        
            // Build the transaction summary embed
                    // Build the transaction summary embed
                    const adminEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Transaction Summary', iconURL: interfaceIcons.transactionIcon })
                    .setColor(0x00AE86)
                    .setDescription('Here are the details of your transaction:')
                    .setTimestamp();
                
                // Include user and server information if available
                const userFields = [
                    { name: 'User ID', value: transaction.userId, inline: true },
                    { name: 'Username', value: transaction.username, inline: true },
                    { name: 'Server ID', value: transaction.serverId, inline: true },
                    { name: 'Server Name', value: transaction.serverName, inline: true },
                    { name: 'Owner ID', value: transaction.ownerId, inline: true },
                    { name: 'Owner Name', value: transaction.ownerName, inline: true },
                ].filter(field => field.value); // Include only fields with valid data
                
                adminEmbed.addFields(...userFields);
                
                // Include transaction overview
                const transactionOverview = [
                    { name: 'Transaction Type', value: transaction.type, inline: true },
                    { name: 'User Type', value: transaction.userType, inline: true },
                    { name: 'Status', value: transaction.status, inline: true },
                    // Dynamically add send and receive country with currency when available
                    ...(transaction.country && transaction.sendCurrency ? [
                        { name: 'Send Country', value: `${transaction.country} (${transaction.sendCurrency})`, inline: true }
                    ] : []),
                    ...(transaction.receiveCountry && transaction.receiveCurrency ? [
                        { name: 'Receive Country', value: `${transaction.receiveCountry} (${transaction.receiveCurrency})`, inline: true }
                    ] : []),
                    { name: 'Sending Crypto', value: transaction.sendingCryptoType, inline: true },
                    { name: 'Receiving Crypto', value: transaction.receivingCryptoType, inline: true },
                    { name: 'Send Network', value: transaction.sendNetwork, inline: true },
                    { name: 'Receive Network', value: transaction.receiveNetwork, inline: true },
                ].filter(field => field.value); // Include only fields with valid data
                
                adminEmbed.addFields(...transactionOverview);
                
                // Add sending details
                const validSendingDetails = Object.entries(transaction.sendingDetails || {}).filter(
                    ([key, value]) => key && value
                );
                if (validSendingDetails.length > 0) {
                    adminEmbed.addFields(
                        { name: 'Sending Details', value: '---', inline: false },
                        ...validSendingDetails.map(([key, value]) => ({
                            name: `Sending: ${key}`,
                            value: value,
                            inline: true,
                        }))
                    );
                }
                
                // Add receiving details
                const validReceivingDetails = Object.entries(transaction.receivingDetails || {}).filter(
                    ([key, value]) => key && value
                );
                if (validReceivingDetails.length > 0) {
                    adminEmbed.addFields(
                        { name: 'Receiving Details', value: '---', inline: false },
                        ...validReceivingDetails.map(([key, value]) => ({
                            name: `Receiving: ${key}`,
                            value: value,
                            inline: true,
                        }))
                    );
                }
                
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
                
                    const specificChannelId = VOUCH_CHANNEL_ID; // Replace with your specific channel ID.
                    const specificChannel = await client.channels.fetch(specificChannelId).catch(console.error);
                
                    if (specificChannel) {
                        // Determine the transaction flow
                        let transactionFlow;
                        if (transaction.sendingCryptoType && transaction.receiveCurrency) {
                            transactionFlow = `${transaction.sendingCryptoType} (Crypto) → ${transaction.receiveCurrency} (Currency)`;
                        } else if (transaction.sendCurrency && transaction.receiveCurrency) {
                            transactionFlow = `${transaction.sendCurrency} (Currency) → ${transaction.receiveCurrency} (Currency)`;
                        } else if (transaction.sendingCryptoType && transaction.receivingCryptoType) {
                            transactionFlow = `${transaction.sendingCryptoType} (Crypto) → ${transaction.receivingCryptoType} (Crypto)`;
                        } else if (transaction.sendCurrency && transaction.receivingCryptoType) {
                            transactionFlow = `${transaction.sendCurrency} (Currency) → ${transaction.receivingCryptoType} (Crypto)`;
                        } else {
                            transactionFlow = 'Transaction flow data not available';
                        }
                
                        const completedEmbed = new EmbedBuilder()
                            .setAuthor({
                                name: '🎉 Transaction Successful',
                                iconURL: interfaceIcons.tickIcon,
                            })
                            .setDescription(`**Transaction has been completed.**\n\n**Details:**`)
                            .addFields(
                                { name: 'User', value: `<@${transaction.userId}>`, inline: true },
                                { name: 'Transaction Flow', value: transactionFlow, inline: false }, // Add transaction flow
                                ...(transaction.country ? [{ name: 'Initiating Country', value: transaction.country, inline: true }] : []),
                                ...(transaction.sendMethod ? [{ name: 'Send Method', value: transaction.sendMethod, inline: true }] : []),
                                ...(transaction.receiveCountry ? [{ name: 'Receiving Country', value: transaction.receiveCountry, inline: true }] : []),
                                ...(transaction.receiveMethod ? [{ name: 'Receive Method', value: transaction.receiveMethod, inline: true }] : []),
                                { name: 'User Type', value: transaction.userType === 'Premium' ? '🌟 Premium' : '🆓 Free', inline: true },
                                { name: 'Handled By', value: `<@${interaction.user.id}>`, inline: true }
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
                // Fetch the user to notify
                const userToNotify = await client.users.fetch(transaction.userId);
            
                // Determine the embed color based on status
                const embedColor =
                    newStatus === 'Completed' ? 0x00FF00 :
                    newStatus === 'Canceled' ? 0xFF0000 :
                    newStatus === 'Processing' ? 0xFFFF00 : // Yellow for processing
                    newStatus === 'On Hold' ? 0xFFA500 : // Orange for on-hold
                    newStatus === 'Read' ? 0x0000FF : // Blue for read
                    0x00AE86; // Default color
            
                // Construct the embed message
                const userEmbed = new EmbedBuilder()
                    .setAuthor({
                        name: 'Transaction Update!',
                        iconURL: interfaceIcons.notifyIcon,
                    })
                    .setDescription(userMessage)
                    .addFields(
                        ...(transaction.sendMethod ? [{ name: 'Send Method', value: transaction.sendMethod, inline: true }] : []),
                        ...(transaction.receiveMethod ? [{ name: 'Receive Method', value: transaction.receiveMethod, inline: true }] : []),
                        ...(transaction.country ? [{ name: 'Initiating Country', value: transaction.country, inline: true }] : []),
                        ...(transaction.receiveCountry ? [{ name: 'Receiving Country', value: transaction.receiveCountry, inline: true }] : []),
                        ...(transaction.sendCurrency ? [{ name: 'Send Currency', value: transaction.sendCurrency, inline: true }] : []),
                        ...(transaction.receiveCurrency ? [{ name: 'Receive Currency', value: transaction.receiveCurrency, inline: true }] : [])
                    )
                    .setFooter({
                        text: 'Safe, Secure & Fast!',
                        iconURL: interfaceIcons.secureIcon,
                    })
                    .setColor(embedColor)
                    .setTimestamp();

            
                const row = new ActionRowBuilder().addComponents(
                                [1, 2, 3, 4, 5].map((rating) =>
                                    new ButtonBuilder()
                                        .setCustomId(`rate_${rating}_${transaction._id}`) // Custom ID for identifying the rating
                                        .setLabel(`${rating} ⭐`)
                                        .setStyle(ButtonStyle.Secondary)
                                )
                            );
                    
                await user.send({ embeds: [userEmbed], components: [row] });
            
            } catch (error) {
                console.error(`Failed to send DM to user: ${transaction.userId}`, error);
            }
            
        
            await interaction.reply({ content: `Transaction status updated to **${newStatus}** and the user has been notified.`, ephemeral: true });
        }
        const [action, rating, transactionId] = interaction.customId.split('_');
        if (action !== 'rate') return;
    
        // Disable buttons after submission
        const row = new ActionRowBuilder().addComponents(
            interaction.message.components[0].components.map((button) =>
                ButtonBuilder.from(button).setDisabled(true)
            )
        );
    
        // Acknowledge the interaction and disable buttons
        await interaction.update({ components: [row] });
    
        // Save the rating to the database
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return;
    
        const transactionFlow =
            transaction.sendingCryptoType && transaction.receiveCurrency
                ? `${transaction.sendingCryptoType} (Crypto) → ${transaction.receiveCurrency} (Currency)`
                : transaction.sendCurrency && transaction.receiveCurrency
                ? `${transaction.sendCurrency} (Currency) → ${transaction.receiveCurrency} (Currency)`
                : transaction.sendingCryptoType && transaction.receivingCryptoType
                ? `${transaction.sendingCryptoType} (Crypto) → ${transaction.receivingCryptoType} (Crypto)`
                : transaction.sendCurrency && transaction.receivingCryptoType
                ? `${transaction.sendCurrency} (Currency) → ${transaction.receivingCryptoType} (Crypto)`
                : 'Transaction flow data not available';
    
        const newRating = new Rating({
            transactionId: transaction._id,
            userId: transaction.userId,
            username: transaction.username,
            userType: transaction.userType,
            transactionFlow: transactionFlow,
            rating: parseInt(rating, 10),
        });
    
        await newRating.save();
    
        // Notify the user about the rating submission
        await interaction.followUp({
            content: `Thank you for rating this transaction with ${rating} ⭐!`,
            ephemeral: true,
        });
    
        // Send the rating details to a specific guild and channel
        const guildId = RATING_GUILD_ID; // Replace with your guild ID
        const channelId = RATING_CHANNEL_ID; // Replace with your channel ID
    
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`Guild with ID ${guildId} not found.`);
            return;
        }
    
        const channel = guild.channels.cache.get(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            console.error(`Channel with ID ${channelId} not found or is not a text channel.`);
            return;
        }
    
        const starRating = '⭐'.repeat(rating); // Generate stars dynamically based on the rating

        const ratingEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'New Transaction Rating Submitted',
                iconURL: interfaceIcons.ratingIcon,
            })
            .setDescription(
                `- A user has rated their transaction! Here's a summary:\n\n` +
                `**User:** <@${transaction.userId}>\n` +
                `**User Type:** ${transaction.userType === 'Premium' ? '🌟 Premium' : '🆓 Free'}\n` +
                `**Transaction Flow:** ${transactionFlow}\n\n` +
                `**Rating:** ${starRating}`
            )
            .setColor(0x00AE86)
            .setFooter({
                text: 'Thank you for using our service!',
                iconURL: interfaceIcons.heartIcon,
            })
            .setTimestamp();
        
        try {
            // Send the embed to the specified channel
            await channel.send({ embeds: [ratingEmbed] });
        } catch (error) {
            console.error(`Failed to send rating details to channel: ${channelId}`, error);
        }
        

      
        
    }
   
    
    if (interaction.isModalSubmit()) {
        const { customId, user } = interaction;


        if (customId === 'sending_details_modal') {
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                console.log('DEBUG: No pending transaction found for user:', user.id);
                return interaction.reply({
                    content: 'No pending transaction found. Please restart the process.',
                    ephemeral: true,
                });
            }
        
            const sendingDetails = {};
            interaction.fields.fields.forEach((field) => {
                sendingDetails[field.customId] = field.value;
            });
        
            transaction.sendingDetails = sendingDetails;
            await transaction.save();
        
            console.log('DEBUG: Updated Transaction with Sending Details:', transaction);
        
            return interaction.reply({
                content: 'Sending details saved successfully!',
                ephemeral: true,
            });
        }
        
        // Handle Saving Receiving Details
        if (customId === 'receiving_details_modal') {
            const transaction = await Transaction.findOne({ userId: user.id, status: 'Pending' });
        
            if (!transaction) {
                console.log('DEBUG: No pending transaction found for user:', user.id);
                return interaction.reply({
                    content: 'No pending transaction found. Please restart the process.',
                    ephemeral: true,
                });
            }
        
            const receivingDetails = {};
            interaction.fields.fields.forEach((field) => {
                receivingDetails[field.customId] = field.value;
            });
        
            transaction.receivingDetails = receivingDetails;
            await transaction.save();
        
            console.log('DEBUG: Updated Transaction with Receiving Details:', transaction);
        
            return interaction.reply({
                content: 'Receiving details saved successfully!',
                ephemeral: true,
            });
        }
    
    }
    
};


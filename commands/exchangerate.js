const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exchangerate')
        .setDescription('View cryptocurrency and fiat currency rates.'),
    async execute(interaction) {
        await interaction.deferReply();

        // Fetch cryptocurrency and fiat currency data
        const cryptoData = await fetchCryptoData();
        const currencyData = await fetchCurrencyData();
        if (!cryptoData || !currencyData) {
            return interaction.editReply({
                content: 'Failed to fetch data. Please try again later.',
                ephemeral: true,
            });
        }

        // Pagination setup
        let currentPage = 0;
        const itemsPerPage = 10; // Number of items per page
        const cryptoPages = paginate(cryptoData, itemsPerPage);
        const currencyPages = paginate(currencyData, itemsPerPage);
        let isCryptoView = true;

        // Create embed and buttons
        const embed = createCryptoEmbed(cryptoPages[currentPage], currentPage + 1, cryptoPages.length);
        const row = createNavigationButtons();

        // Send initial message
        const message = await interaction.editReply({
            embeds: [embed],
            components: [row],
        });

        // Create a collector for button interactions
        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000, // 5-minute timeout
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({
                    content: "You're not allowed to use these buttons.",
                    ephemeral: true,
                });
            }

            // Handle button interactions
            if (buttonInteraction.customId === 'next') {
                currentPage = (currentPage + 1) % (isCryptoView ? cryptoPages.length : currencyPages.length);
            } else if (buttonInteraction.customId === 'previous') {
                currentPage =
                    (currentPage - 1 + (isCryptoView ? cryptoPages.length : currencyPages.length)) %
                    (isCryptoView ? cryptoPages.length : currencyPages.length);
            } else if (buttonInteraction.customId === 'view_currencies') {
                isCryptoView = false;
                currentPage = 0;
            } else if (buttonInteraction.customId === 'view_cryptos') {
                isCryptoView = true;
                currentPage = 0;
            }

            // Update the embed
            const newEmbed = isCryptoView
                ? createCryptoEmbed(cryptoPages[currentPage], currentPage + 1, cryptoPages.length)
                : createCurrencyEmbed(currencyPages[currentPage], currentPage + 1, currencyPages.length);

            await buttonInteraction.update({ embeds: [newEmbed] });
        });

        collector.on('end', () => {
            // Disable buttons after timeout
            const disabledRow = createNavigationButtons(true);
            message.edit({ components: [disabledRow] });
        });
    },
};

// Helper: Fetch cryptocurrency data
// Helper: Fetch cryptocurrency data
async function fetchCryptoData() {
    try {
        const response = await axios.get('https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
        });

        return response.data.data.map((c) => ({
            name: c.name, // Ensure correct mapping
            symbol: c.symbol, // Ensure correct mapping
            price: `$${parseFloat(c.quote.USD.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            change: c.quote.USD.percent_change_24h.toFixed(2),
        }));
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        return null;
    }
}


// Helper: Fetch fiat currency data
async function fetchCurrencyData() {
    try {
        const response = await axios.get('http://data.fixer.io/api/latest', {
            params: {
                access_key: process.env.FIXER_API_KEY,
                symbols: 'USD,EUR,GBP,INR,JPY,CNY,AUD,CAD,CHF,NZD',
            },
        });

        if (response.data && response.data.success) {
            const rates = response.data.rates;
            const usdRate = rates.USD;

            return Object.keys(rates).map((currency) => ({
                name: currency,
                price: `${(rates[currency] / usdRate).toFixed(4)} USD`,
            }));
        }
        return null;
    } catch (error) {
        console.error('Error fetching currency data:', error);
        return null;
    }
}

// Helper: Paginate data
function paginate(data, itemsPerPage) {
    const pages = [];
    for (let i = 0; i < data.length; i += itemsPerPage) {
        pages.push(data.slice(i, i + itemsPerPage));
    }
    return pages;
}

function createCryptoEmbed(data, page, totalPages) {
    const embed = new EmbedBuilder()
        .setTitle(`📈 Cryptocurrency Prices (Page ${page}/${totalPages})`)
        .setColor('#FFD700')
        .setFooter({ text: 'Source: CoinMarketCap' })
        .setDescription('Here are the latest cryptocurrency prices and their 24-hour changes.');

    // Add each cryptocurrency as a field
    data.forEach((crypto) => {
        embed.addFields([
            {
                name: `${crypto.name} (${crypto.symbol})`,
                value: `**Price:** ${crypto.price}\n**24h Change:** ${crypto.change > 0 ? '+' : ''}${crypto.change}%`,
                inline: true,
            },
        ]);
    });

    return embed;
}


// Helper: Create fiat currency embed
function createCurrencyEmbed(data, page, totalPages) {
    return new EmbedBuilder()
        .setTitle(`Fiat Currency Exchange Rates (Page ${page}/${totalPages})`)
        .setColor('#00FFFF')
        .setDescription(data.map((c) => `**${c.name}:** ${c.price}`).join('\n'))
        .setFooter({ text: 'Source: Fixer API' });
}

// Helper: Create navigation buttons
function createNavigationButtons(disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('view_cryptos')
            .setLabel('View Cryptocurrencies')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('view_currencies')
            .setLabel('View Currencies')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
    );
}

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exchangelist')
        .setDescription('View exchange information by continent and country.'),

    async execute(interaction) {
        // Load data from countries.json
        let data;
        try {
            const rawData = fs.readFileSync('./data/countries.json');
            data = JSON.parse(rawData);
        } catch (err) {
            console.error('Error reading countries.json:', err);
            return interaction.reply({
                content: 'Failed to load country data. Please try again later.',
                ephemeral: true
            });
        }

        // Generate menu for continents
        const continentOptions = Object.keys(data.continents).map(continent => ({
            label: continent,
            value: continent
        }));

        const continentMenu = new StringSelectMenuBuilder()
            .setCustomId('select-continent')
            .setPlaceholder('Select a continent')
            .addOptions(continentOptions);

        const continentRow = new ActionRowBuilder().addComponents(continentMenu);

        await interaction.reply({
            content: '🌍 **Select a continent to explore exchange options.**',
            components: [continentRow],
            ephemeral: true
        });

        // Listen for continent selection
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === 'select-continent' && i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async i => {
            const selectedContinent = i.values[0];
            const countries = data.continents[selectedContinent];

            if (!countries || countries.length === 0) {
                return i.reply({
                    content: `No countries available for ${selectedContinent}.`,
                    ephemeral: true
                });
            }

            // Generate menu for countries
            const countryOptions = countries.map(country => ({
                label: `${country} (${data.currencies[country] || 'N/A'})`,
                value: country
            }));

            const countryMenu = new StringSelectMenuBuilder()
                .setCustomId('select-country')
                .setPlaceholder('Select a country')
                .addOptions(countryOptions);

            const countryRow = new ActionRowBuilder().addComponents(countryMenu);

            await i.reply({
                content: `🌏 **Select a country in ${selectedContinent} to view details.**`,
                components: [countryRow],
                ephemeral: true
            });

            // Listen for country selection
            const countryCollector = i.channel.createMessageComponentCollector({
                filter: ii => ii.customId === 'select-country' && ii.user.id === interaction.user.id,
                time: 60000
            });

            countryCollector.on('collect', async ii => {
                const selectedCountry = ii.values[0];
                const paymentMethods = data.paymentMethods[selectedCountry] || { send: [], receive: [] };
                const currency = data.currencies[selectedCountry] || 'N/A';
                const emoji = data.emojiMappings[selectedCountry] || '';

                const embed = new EmbedBuilder()
                    .setTitle(`${emoji} ${selectedCountry} - ${currency}`)
                    .setDescription(`Detailed exchange options for **${selectedCountry}**`)
                    .addFields(
                        { name: 'Send', value: paymentMethods.send.join(', ') || 'N/A', inline: true },
                        { name: 'Receive', value: paymentMethods.receive.join(', ') || 'N/A', inline: true }
                    )
                    .setColor(0x00AE86)
                    .setAuthor({
                        name: 'Exchange Information',
                        iconURL: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' // Use a relevant icon URL
                    })
                    .setFooter({
                        text: 'Exchange System | Powered by ExchangeBot',
                        iconURL: interaction.client.user.displayAvatarURL() // Bot avatar
                    })
                    .setTimestamp();

                await ii.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            });

            countryCollector.on('end', () => {
                console.log('Country selection collector ended.');
            });
        });

        collector.on('end', () => {
            console.log('Continent selection collector ended.');
        });
    }
};

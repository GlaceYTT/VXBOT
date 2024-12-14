const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands.'),
    async execute(interaction) {
        try {
            // Assuming commands are stored in the ./commands directory
            const commandsPath = path.join(__dirname, '../commands');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            const commands = commandFiles.map(file => {
                const command = require(`${commandsPath}/${file}`);
                return `**/${command.data.name}** - ${command.data.description}`;
            });

            const helpEmbed = {
                color: 0x0099ff,
                title: 'Available Commands',
                description: commands.join('\n'),
                footer: { text: 'Use /[command] to execute a command.' },
            };

            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
        } catch (error) {
            console.error('Error fetching commands:', error);
            await interaction.reply({
                content: 'An error occurred while fetching the command list.',
                ephemeral: true,
            });
        }
    },
};

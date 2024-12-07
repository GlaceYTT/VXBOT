const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Transaction = require('../models/Transaction');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transactions')
        .setDescription('View and manage all transactions.')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('view')
                .setDescription('View all transactions.')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('delete')
                .setDescription('Delete a transaction by index.')
                .addIntegerOption((option) =>
                    option
                        .setName('index')
                        .setDescription('The index of the transaction to delete.')
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('deleteall')
                .setDescription('Delete all transactions.')
        ),

    async execute(interaction) {
        try{
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'view') {
            const transactions = await Transaction.find();

            if (transactions.length === 0) {
                return interaction.reply({ content: 'No transactions found.', ephemeral: true });
            }

            const itemsPerPage = 5; // Customize this to control how many transactions per page
            const pages = Math.ceil(transactions.length / itemsPerPage);

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const embed = new EmbedBuilder()
                    .setTitle(`Transactions List (Page ${page + 1}/${pages})`)
                    .setColor(0x00AE86);
            
                transactions.slice(start, end).forEach((transaction, index) => {
                    embed.addFields(
                        {
                            name: `Transaction ${start + index + 1}`,
                            value: `
                            **Transaction ID**: ${transaction._id}
                            **User**: ${transaction.username} (ID: ${transaction.userId})
                            **Server**: ${transaction.serverName} (ID: ${transaction.serverId})
                            **Owner**: ${transaction.ownerName} (ID: ${transaction.ownerId})
                            **Server Type**: ${transaction.userType || 'Free'}
                            **Country**: ${transaction.country}
                            **Currency**: ${transaction.currency}
                            **Send Method**: ${transaction.sendMethod || 'N/A'}
                            **Receive Method**: ${transaction.receiveMethod || 'N/A'}
                            **Status**: ${transaction.status}
                            **Created At**: ${transaction.createdAt.toLocaleString()}
                            `,
                        },
                        // Include Sending Details
                        { name: 'Sending Details', value: '---', inline: false },
                        ...Object.entries(transaction.sendingDetails).map(([key, value]) => ({
                            name: `Sending: ${key}`,
                            value: value || 'N/A',
                            inline: true,
                        })),
                        // Include Receiving Details
                        { name: 'Receiving Details', value: '---', inline: false },
                        ...Object.entries(transaction.receivingDetails).map(([key, value]) => ({
                            name: `Receiving: ${key}`,
                            value: value || 'N/A',
                            inline: true,
                        }))
                    );
                });
            
                return embed;
            };            

            let currentPage = 0;
            const message = await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                components: pages > 1 ? [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Primary)
                    ),
                ] : [],
                ephemeral: true,
                fetchReply: true,
            });

            const collector = message.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                time: 60000,
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev') currentPage--;
                if (i.customId === 'next') currentPage++;

                await i.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('◀')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('▶')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === pages - 1)
                        ),
                    ],
                });
            });
            collector.on('end', async () => {
                try {
                    await message.edit({
                        components: [],
                    });
                } catch (error) {
                    //console.error('Failed to edit message after collector ended:', error.message);
                }
            });
        }

        if (subcommand === 'delete') {
            const index = interaction.options.getInteger('index');
            const transactions = await Transaction.find();

            if (index < 0 || index >= transactions.length) {
                return interaction.reply({ content: `Invalid index. Please choose a value between 0 and ${transactions.length - 1}.`, ephemeral: true });
            }

            const transactionToDelete = transactions[index];
            await Transaction.findByIdAndDelete(transactionToDelete._id);

            return interaction.reply({
                content: `Transaction with index **${index}** and ID **${transactionToDelete._id}** has been deleted.`,
                ephemeral: true,
            });
        }

        if (subcommand === 'deleteall') {
            const transactionsCount = await Transaction.countDocuments();
            if (transactionsCount === 0) {
                return interaction.reply({ content: 'No transactions to delete.', ephemeral: true });
            }

            await Transaction.deleteMany();

            return interaction.reply({
                content: `All ${transactionsCount} transactions have been successfully deleted.`,
                ephemeral: true,
            });
        }
    }catch{
        //console.log("X");
    }
    },

};

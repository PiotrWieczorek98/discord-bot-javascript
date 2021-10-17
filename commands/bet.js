const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const LeagueBetting = require('../helpers/LeagueBetting');

// --------------------------------------------------------------------
// Bet some cash
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet')
		.setDescription('Bet on someone')
		.addIntegerOption(option => option
			.setName('value')
			.setDescription('Value of your bet')
			.setRequired(true))
		.addStringOption(option => option
			.setName('summoner')
			.setDescription('Summoner name of the target')
			.setRequired(true)),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {

		const bet = interaction.options.getInteger('value');
		const summoner = interaction.options.getString('summoner');
		const message = `${bet},  ${summoner}`;
		await interaction.reply('bip');
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

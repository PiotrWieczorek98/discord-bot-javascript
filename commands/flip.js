const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

// --------------------------------------------------------------------
// Flips a coin
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('flip')
		.setDescription('Flip a coin'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const randNum = Math.random();
		let result = null;
		if (randNum < 0.5) {
			result = ':coin: Heads!';
		}
		else {
			result = ':coin: Tails!';
		}
		await interaction.reply(result);

	},
};

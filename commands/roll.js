const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const { floor } = require('lodash');

// --------------------------------------------------------------------
// Rolls a die
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll a die')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Maximum number')),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		let max = interaction.options.getInteger('number');
		if (!max) max = 101;
		else max += 1;
		const min = 0;
		let randNum = Math.random() * (max - min) + min;
		randNum = floor(randNum);
		const message = `🎲 Rolled: **${randNum}**`;
		await interaction.reply(message);
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

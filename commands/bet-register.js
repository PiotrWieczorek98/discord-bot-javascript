const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const LeagueBetting = require('../helpers/LeagueBetting');

// --------------------------------------------------------------------
// Flips a coin
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet-register')
		.setDescription('Register for League of legends bets'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {

		await LeagueBetting.addBetter(interaction.member, interaction.client);
		const message = `Successfuly registered **${interaction.member.displayName}** for League of Legends betting. You've got: **${LeagueBetting.initialCredits}** credits.`;
		await interaction.reply(message);
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

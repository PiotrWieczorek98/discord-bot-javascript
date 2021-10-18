const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const LeagueBetting = require('../helpers/LeagueBetting');

// --------------------------------------------------------------------
// Register for betting
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet-register')
		.setDescription('Register for League of legends bets'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {

		let message = null;
		// Check if already registered
		const gamblerCredits = LeagueBetting.getGamblerCredits(interaction.member);
		if (gamblerCredits == undefined) {
			await LeagueBetting.addGambler(interaction.member, interaction.client);
			message = `Successfuly registered **${interaction.member.displayName}** for League of Legends betting. You've got: **${LeagueBetting.initialCredits}** credits.`;

		}
		else {
			message = `**${interaction.member.displayName}** is already registered! You've got: **${gamblerCredits}** credits.`;
		}

		await interaction.reply(message);
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

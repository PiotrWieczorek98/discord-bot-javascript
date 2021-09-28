const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

// --------------------------------------------------------------------
// Sends guild info
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Server info'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const message = `**Server name:** ${interaction.guild.name}\n
		**Total members:** ${interaction.guild.memberCount}\n
		**Created At:** ${interaction.guild.createdAt}\n 
		**Verification Level:** ${interaction.guild.verificationLevel}`;
		await interaction.reply(message);
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

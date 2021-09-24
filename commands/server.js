const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Server info'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: 
		${interaction.guild.memberCount}\nCreated At: ${interaction.guild.createdAt}\n 
		Verification Level: ${interaction.guild.verificationLevel}`);
	},
};

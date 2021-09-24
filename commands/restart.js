const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reboot')
		.setDescription('Restart the bot'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.reply('Rebooting...');
		process.exit();
	},
};

const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('It\'s time to stop!'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const audioPlayer = interaction.client.globalQueue.get(interaction.guildId).player;
		const message = '⏹ Stopped player';
		interaction.client.globalQueue.delete(interaction.guild.id);
		audioPlayer.stop();

		await interaction.reply({ content: message, ephemeral: true });
		console.log(message);
	},
};

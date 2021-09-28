const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

// --------------------------------------------------------------------
// Skips currently played audio
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip whatever is playing'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const message = '⏭ Skipping song';
		const player = interaction.client.globalQueue.get(interaction.guildId).player;
		player.stop();
		await interaction.reply({ content: message, ephemeral: true });
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

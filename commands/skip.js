const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip whatever is playing'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const player = interaction.client.globalQueue.get(interaction.guildId).player;
		player.stop();
		await interaction.reply({ content: '⏭ Skipping song', ephemeral: true });

	},
};

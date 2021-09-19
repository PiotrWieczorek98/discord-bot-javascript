const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop whatever is playing'),
	async execute(interaction) {
		const player = interaction.client.globalQueue.get(interaction.guildId).player;
		player.stop();
		await interaction.reply('Yikes...');

	},
};

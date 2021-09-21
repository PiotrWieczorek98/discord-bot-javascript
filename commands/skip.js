const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip whatever is playing'),
	async execute(interaction) {
		const player = interaction.client.globalQueue.get(interaction.guildId).player;
		player.stop();
		await interaction.reply({ content: '⏭ Skipping song', ephemeral: true });

	},
};

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reboot')
		.setDescription('Restart the bot'),
	async execute(interaction) {
		await interaction.reply('Rebooting...');
		process.exit();
	},
};

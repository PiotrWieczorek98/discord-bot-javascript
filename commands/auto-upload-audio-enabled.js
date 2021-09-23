const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auto-upload-audio-enabled')
		.setDescription('Set whether to upload sounds automatically or not'),
	async execute(interaction) {
		// TODO

	},
};

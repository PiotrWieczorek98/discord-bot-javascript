const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auto-upload-audio-channel')
		.setDescription('Specify which channel should be tracked for uploaded sound files. Default is any channel'),
	async execute(interaction) {
		// TODO
	},
};

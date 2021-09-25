const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

// --------------------------------------------------------------------
// Sets flag to enable auto upload
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auto-upload-audio-enabled')
		.setDescription('Set whether to upload sounds automatically or not'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		// TODO

	},
};

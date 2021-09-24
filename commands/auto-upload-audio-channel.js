const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auto-upload-audio-channel')
		.setDescription('Specify which channel should be tracked for uploaded sound files. Default is any channel'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		// TODO
	},
};

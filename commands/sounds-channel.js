const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const Azure = require('../helpers/Azure');
const DataManager = require('../helpers/GuildDataManager');

// --------------------------------------------------------------------
// Sets channel used for auto-upload
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sounds-channel')
		.setDescription('Specify which channel should be tracked for uploaded sound files. Default is any channel')
		.addStringOption(option => option
			.setName('channel-id')
			.setDescription('Id of the channel where sent sounds will be auto uploaded to storage')
			.setRequired(true)),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const option = interaction.options.getString('channel-id');
		let message = null;

		// Regex for channel id
		const regex = /[0-9]{18}/i;
		const results = option.match(regex);
		if (!results || !interaction.guild.channels.cache.has(results[0])) {
			message = '❌ Channel id is incorrect!';
			interaction.reply({ content: message, ephermal: true });
			console.log(message);
			return;
		}
		const channelId = results[0];
		const filePath = `${interaction.client.paths.DATA}/${interaction.client.vars.FILE_SOUNDS_CHANNEL}`;
		interaction.client.soundsChannel.set(interaction.guild.id, channelId);
		const resolve = await DataManager.writeMapToFile(interaction.client.soundsChannel, filePath);
		if (!resolve) {
			message = '❌ Error writing data!';
			interaction.reply({ content: message, ephermal: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
		}
		await Azure.uploadBlob(interaction.client.vars.CONTAINER_DATA, filePath, undefined, true);

		message = '✅ Channel set!';
		interaction.reply({ content: message, ephermal: true });
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

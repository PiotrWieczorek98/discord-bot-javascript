// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');
const Azure = require('../helpers/Azure');
const DataManager = require('../helpers/GuildDataManager');

// --------------------------------------------------------------------
// When bot leaves guild
// --------------------------------------------------------------------

module.exports = {
	name: 'guildDelete',
	once: false,
	/**
	 * When bot leaves guild
	 * @param {Guild} guild
	 */
	execute(guild) {
		(async () => {
		// Prepare data and upload
			const client = guild.client;
			client.autoUploadSoundChannel.delete(guild.id);

			const filePath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
			await DataManager.writeMapToFile(client.autoUploadSoundChannel, filePath);
			await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
			await Azure.deleteContainer(guild.id);
			console.log(`Guild: ${guild.id} added!`);
		})();
	},
};
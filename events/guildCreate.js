// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');
const Azure = require('../classes/Azure');
const DataManager = require('../classes/GuildDataManager');

// --------------------------------------------------------------------
// When bot joins new guild
// --------------------------------------------------------------------

module.exports = {
	name: 'guildCreate',
	once: false,
	/**
	 * When bot joins new guild
	 * @param {Guild} guild
	 */
	execute(guild) {
		(async () => {
			const client = guild.client;
			client.autoUploadSoundChannel.set(guild.id, null);

			const filePath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
			await DataManager.writeMapToFile(client.autoUploadSoundChannel, filePath);
			await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
			console.log(`Guild: ${guild.id} added!`);
		})();
	},
};
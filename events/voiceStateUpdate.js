// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');
const Azure = require('../helpers/Azure');
const DataManager = require('../helpers/GuildDataManager');

// --------------------------------------------------------------------
// When bot joins new guild
// --------------------------------------------------------------------

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	/**
	 * When someone joins or leaves vs
	 * @param {User} oldUser
     * @param {User} newUser
	 */
	execute(oldUser, newUser) {
		(async () => {
			// const client = guild.client;
			// client.autoUploadSoundChannel.set(guild.id, null);

			// const filePath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
			// await DataManager.writeMapToFile(client.autoUploadSoundChannel, filePath);
			// await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
			// console.log(`Guild: ${guild.id} added!`);
		})();
	},
};
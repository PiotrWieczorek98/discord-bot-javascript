// eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const GuildDataManager = require('../helpers/GuildDataManager');
const Azure = require('../helpers/Azure');

// --------------------------------------------------------------------
// When message is sent
// --------------------------------------------------------------------

module.exports = {
	name: 'messageCreate',
	once: false,
	/**
     * When message is sent
     * @param {Message} message
     */
	execute(message) {
		const client = message.client;
		// Check for sound upload
		for (const attachment of message.attachments) {
			if (attachment[1].contentType == 'audio/mpeg') {
				const soundsChannel = client.soundsChannel.get(message.guildId);
				if (soundsChannel == null || soundsChannel == message.channelId) {
					// Download file to upload it to Azure
					const filePath = `${client.paths.SOUNDS}/${message.guildId}/${attachment[1].name}`;
					GuildDataManager.downloadFromUrl(attachment[1].url, filePath, async () => {
						const response = await Azure.uploadBlob(message.guildId, filePath);
						message.react(response);

						// Update sound list
						const guildSoundList = client.globalSoundList.get(message.guildId);
						guildSoundList.downloadSounds();
					});
				}
			}
		}
	},
};
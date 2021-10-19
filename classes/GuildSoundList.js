const Azure = require('./Azure.js');

/**
 * Class represents guild's sound list stored in Azure.
 * Used to play sounds in voice chat.
 */
class GuildSoundList {
	/**
     * Constructs GuildSoundList object
     * @param {String} guildId
     * @param {String} path path where sounds will be downloaded
     */
	constructor(guildId, path) {
		this.guildId = guildId,
		this.soundList = null,
		this.path = path;
	}

	async downloadSounds() {
		this.soundList = await Azure.downloadAllBlobs(this.guildId, this.path);
	}
}

module.exports = GuildSoundList;
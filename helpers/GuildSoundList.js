const Azure = require('./azure-storage.js');

class GuildSoundList {
	/**
     * Guild sound list class
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
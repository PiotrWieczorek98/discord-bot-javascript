const { createAudioPlayer } = require('@discordjs/voice');

class GuildQueue {
	constructor(textChannel, voiceChannel) {
		this.textChannel = textChannel,
		this.voiceChannel = voiceChannel,
		this.connection = null,
		this.player = createAudioPlayer(),
		this.songs = [];
	}
}

module.exports = GuildQueue;
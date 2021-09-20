const { createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');

class GuildQueue {
	constructor(textChannel, voiceChannel) {
		this.textChannel = textChannel,
		this.voiceChannel = voiceChannel,
		this.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		}),
		this.player = createAudioPlayer(),
		this.songs = [];
	}
}

module.exports = GuildQueue;
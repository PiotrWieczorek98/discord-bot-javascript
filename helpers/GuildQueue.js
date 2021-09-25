const { createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
// eslint-disable-next-line no-unused-vars
const { TextChannel, VoiceChannel } = require('discord.js');

/**
 * Class represents queue for audio player in voice chats.
 * Each guild has a seperate queue.
 */
class GuildQueue {
	/**
	 * Constructs GuildQueue object
	 * @param {TextChannel} textChannel
	 * @param {VoiceChannel} voiceChannel
	 */
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
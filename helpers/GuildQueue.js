const { createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
// eslint-disable-next-line no-unused-vars
const { TextChannel, VoiceChannel } = require('discord.js');

class GuildQueue {
	/**
	 * Guild queue class
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
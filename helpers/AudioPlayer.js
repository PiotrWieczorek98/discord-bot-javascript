const ytdl = require('ytdl-core');
const { createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

class ClientPlayer {
	/**
	 * Get next audio in queue
	 * @param {Interaction} interaction
	 * @param {*} guildQueue
	 * @param {*} song
	 * @param {AudioPlayer} audioPlayer
	 */
	static playNextResource(interaction, guildQueue, audioPlayer) {
		guildQueue.songs.shift();
		if (guildQueue.songs.length > 0) {
			const song = guildQueue.songs[0];
			let resource = null;
			if (song.url) {
				resource = createAudioResource(ytdl(song.url));
			}
			else if (song.path) {
				resource = createAudioResource(song.path);
			}
			audioPlayer.play(resource);
			guildQueue.textChannel.send(`🎶 Start playing: ${guildQueue.songs[0].title}`);
		}
		else {
			audioPlayer.stop();
			interaction.client.globalQueue.delete(interaction.guild.id);
		}
	}

	/**
     * Play audio from youtube video
     * @param {Interaction} interaction
     * @param {*} guildQueue
	 * @param {String} source Either 'youtube' or 'soundList'
     */
	static async playAudio(interaction, guildQueue) {
		const song = guildQueue.songs[0];
		if (!song) {
			guildQueue.voiceChannel.leave();
			guildQueue.player.stop();
			interaction.client.globalQueue.delete(interaction.guild.id);
			return;
		}

		let resource = null;
		if (song.url) {
			resource = createAudioResource(ytdl(song.url));
		}
		else if (song.path) {
			resource = createAudioResource(song.path);
		}
		else {
			throw 'Wrong source given!';
		}
		const audioPlayer = guildQueue.player;
		guildQueue.connection.subscribe(audioPlayer);
		audioPlayer.play(resource);

		await interaction.reply(`🎶 Start playing: ${song.title}`);
		console.log(`🎶 Start playing: ${song.title}`);

		audioPlayer.on('error', error => {
			console.error(error);
		});

		// After finish play next audio from queue
		audioPlayer.on(AudioPlayerStatus.Idle, () => {
			this.playNextResource(interaction, guildQueue, audioPlayer);
		});

		// Handle error
		audioPlayer.on('error', error => {
			console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
			this.playNextResource(interaction, guildQueue, audioPlayer);
		});
	}
}

module.exports = ClientPlayer;
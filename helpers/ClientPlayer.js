// eslint-disable-next-line no-unused-vars
const GuildQueue = require('./GuildQueue');
// eslint-disable-next-line no-unused-vars
const { createAudioResource, AudioPlayerStatus, AudioPlayer, StreamType } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { AudioSourceYoutube, AudioSourceLocal } = require('./AudioSource');

class ClientPlayer {
	/**
	 * Get next audio in queue
	 * @todo: for some reason audioPlayer gets stuck on buffering when switching resource from
	 * local source to youtube (on local machine) or vice versa (on heroku)
	 * @param {Interaction} interaction
	 * @param {GuildQueue} guildQueue
	 * @param {AudioPlayer} discordPlayer
	 */
	static playNextResource(interaction, guildQueue, discordPlayer) {
		if (guildQueue.songs.length > 1) {
			const oldSource = guildQueue.songs.shift();
			const newSource = guildQueue.songs[0];
			let resource = null;

			// Ugly workaround for problem mentioned above
			if (oldSource.constructor != newSource.constructor) {
				guildQueue.textChannel.send('Biblioteka nie ogarnia zmiany youtube<=>plik więc odpal jeszcze raz');
			}

			if (newSource instanceof AudioSourceYoutube) {
				resource = createAudioResource(
					ytdl(newSource.url, { filter: 'audioonly' }), { inputType: StreamType.Arbitrary, silencePaddingFrames: 10 });
			}
			else if (newSource instanceof AudioSourceLocal) {
				resource = createAudioResource(newSource.path, { inputType: StreamType.Arbitrary, silencePaddingFrames: 10 });
			}
			discordPlayer.play(resource);

			guildQueue.textChannel.send(`🔊 Playing: ${newSource.title}`);
			console.log(`🔊 Playing: ${newSource.title}`);
		}
		else {
			// Delete the queue
			interaction.client.globalQueue.delete(interaction.guild.id);
			discordPlayer.stop();
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
		if (song instanceof AudioSourceYoutube) {
			resource = createAudioResource(
				ytdl(song.url, { filter: 'audioonly' }), { inputType: StreamType.Arbitrary, silencePaddingFrames: 10 });
		}
		else if (song instanceof AudioSourceLocal) {
			resource = createAudioResource(song.path, { inputType: StreamType.Arbitrary, silencePaddingFrames: 10 });
		}
		const audioPlayer = guildQueue.player;
		guildQueue.connection.subscribe(audioPlayer);
		audioPlayer.play(resource);

		await interaction.reply(`🎶 Playing: **${song.title}**`);
		console.log(`🎶Playing: ${song.title}`);

		audioPlayer.on('error', error => {
			console.error(error);
		});

		// After finish play next audio from queue
		audioPlayer.on(AudioPlayerStatus.Idle, () => {
			if (guildQueue) {
				this.playNextResource(interaction, guildQueue, audioPlayer);
			}
		});

		// Handle error
		audioPlayer.on('error', error => {
			console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
			this.playNextResource(interaction, guildQueue, audioPlayer);
		});
	}
}

module.exports = ClientPlayer;
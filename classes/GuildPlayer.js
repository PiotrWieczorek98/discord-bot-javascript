// eslint-disable-next-line no-unused-vars
const GuildQueue = require('./GuildQueue');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { createAudioResource, AudioPlayerStatus, AudioPlayer, StreamType } = require('@discordjs/voice');
const { AudioSourceYoutube, AudioSourceLocal } = require('./AudioSource');
const playDl = require('play-dl') ;

/**
 * Class responsible for audio player functions in voice channels
 */
class GuildPlayer {
	/**
	 * Get next audio in queue
	 * @todo: for some reason audioPlayer gets stuck on buffering when switching resource from
	 * local source to youtube (on local machine) or vice versa (on heroku)
	 * @param {Interaction} interaction
	 * @param {GuildQueue} guildQueue
	 * @param {AudioPlayer} discordPlayer
	 */
	static async playNextResource(interaction, guildQueue, discordPlayer) {
		if (guildQueue.songs.length > 1) {
			const oldSource = guildQueue.songs.shift();
			const newSource = guildQueue.songs[0];
			let resource = null;
			let message = null;

			// Ugly workaround for problem mentioned above
			if (oldSource.constructor != newSource.constructor) {
				guildQueue.textChannel.send('Biblioteka nie ogarnia zmiany youtube<=>plik więc odpal jeszcze raz');
			}

			if (newSource instanceof AudioSourceYoutube) {
				try {
					const stream = await playDl.stream(newSource.url);
					resource = createAudioResource(stream.stream, { inputType : stream.type });
				}
				catch (er) {
					console.error(er);
					message = 'Error caused by play-dl library! Try again.';
					guildQueue.textChannel.send(message);
					return;
				}

			}
			else if (newSource instanceof AudioSourceLocal) {
				resource = createAudioResource(newSource.path, { inputType: StreamType.Arbitrary });
			}
			discordPlayer.play(resource);

			message = `🔊 Playing: **${newSource.title}**`;
			guildQueue.textChannel.send(message);
			console.log(message);
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
		let message = null;
		if (song instanceof AudioSourceYoutube) {
			const stream = await playDl.stream(song.url);
			resource = createAudioResource(stream.stream, { inputType : stream.type });
		}
		else if (song instanceof AudioSourceLocal) {
			resource = createAudioResource(song.path, { inputType: StreamType.Arbitrary });
		}
		const audioPlayer = guildQueue.player;
		guildQueue.connection.subscribe(audioPlayer);
		audioPlayer.play(resource);
		// guildQueue.connection.rejoin({ selfDeaf: false });

		message = `🔊 Playing: **${song.title}**`;
		await interaction.reply(message);
		console.log(message);

		audioPlayer.on('error', error => {
			console.error(error);
		});

		// After finish play next audio from queue
		audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			if (guildQueue) {
				await this.playNextResource(interaction, guildQueue, audioPlayer);
			}
		});

		// Handle error
		audioPlayer.on('error', error => {
			console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
			this.playNextResource(interaction, guildQueue, audioPlayer);
		});
	}
}

module.exports = GuildPlayer;
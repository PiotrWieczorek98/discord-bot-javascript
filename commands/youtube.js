const { Util } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
const search = require('youtube-search');
const { envs } = require('../helpers/env-vars.js');
const ClientPlayer = require('../helpers/AudioPlayer.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('youtube')
		.setDescription('Granie na żądanie')
		.addStringOption(option => option
			.setName('url')
			.setDescription('Link to youtube video.')
			.setRequired(true)),
	async execute(interaction) {
		// Check for abnormalities
		if (!interaction.member.voice) {
			await interaction.reply('Join voice channel first.');
			return;
		}
		const channel = interaction.member.voice.channel;
		const permissions = channel.permissionsFor(interaction.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			await interaction.reply('Not sufficient permissions!');
			return;
		}

		// Search youtube
		const url = interaction.options.getString('url');
		const opts = {
			maxResults: 1,
			key: envs.YOUTUBE_API_TOKEN,
			type: 'video',
		};

		await search(url.replace(/<(.+)>/g, '$1'), opts, async function(err, results) {
			if (err) {
				return console.log(err);
			}
			console.log(`Found: ${results[0].title}`);
			const ytSong = {
				id: results[0].id,
				title: Util.escapeMarkdown(results[0].title),
				url: results[0].link,
			};

			// Add to queue
			let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);
			if (guildQueue) {
				guildQueue.songs.push(ytSong);
				console.log(guildQueue.songs);
				await interaction.reply(`✅ **${ytSong.title}** has been added to the queue!`);
				return;
			}

			// Create queue if doesn't exist
			guildQueue = {
				textChannel: interaction.channel,
				voiceChannel: channel,
				connection: null,
				player: createAudioPlayer(),
				songs: [],
			};
			interaction.client.globalQueue.set(interaction.guild.id, guildQueue);
			guildQueue.songs.push(ytSong);

			// Call function
			try {
				const connection = joinVoiceChannel({
					channelId: channel.id,
					guildId: channel.guild.id,
					adapterCreator: channel.guild.voiceAdapterCreator,
				});
				guildQueue.connection = connection;
				ClientPlayer.playAudio(interaction, guildQueue);
			}
			catch (error) {
				console.error(`I could not join the voice channel: ${error}`);
				interaction.client.globalQueue.delete(interaction.guild.id);
				await channel.leave();
				await interaction.reply(`I could not join the voice channel: ${error}`);
				return;
			}
		});
	},
};

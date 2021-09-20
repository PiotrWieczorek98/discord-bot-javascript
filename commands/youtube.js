const { Util } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');
const search = require('youtube-search');
const { envs } = require('../helpers/env-vars.js');
const ClientPlayer = require('../helpers/ClientPlayer.js');
const GuildQueue = require('../helpers/GuildQueue.js');
const { AudioSourceYoutube } = require('../helpers/AudioSource.js');

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
		const voiceChannel = interaction.member.voice.channel;
		const permissions = voiceChannel.permissionsFor(interaction.client.user);
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
			const result = results[0];
			const ytSong = new AudioSourceYoutube(result.id, Util.escapeMarkdown(result.title), result.link);

			// Add to queue
			let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);
			if (guildQueue) {
				guildQueue.songs.push(ytSong);
				await interaction.reply(`✅ **${ytSong.title}** has been added to the queue`);
				console.log(`✅ ${ytSong.title} has been added to the queue`);
				return;
			}

			// Join VC
			try {
				// Create queue if doesn't exist
				guildQueue = new GuildQueue(interaction.channel, voiceChannel);
				interaction.client.globalQueue.set(interaction.guild.id, guildQueue);
				guildQueue.songs.push(ytSong);
				// Call player function
				ClientPlayer.playAudio(interaction, guildQueue);
			}
			catch (error) {
				console.error(`I could not join the voice channel: ${error}`);
				interaction.client.globalQueue.delete(interaction.guild.id);
				await voiceChannel.leave();
				await interaction.reply(`I could not join the voice channel: ${error}`);
				return;
			}
		});
	},
};

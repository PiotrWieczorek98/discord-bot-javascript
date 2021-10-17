const { Util } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const search = require('youtube-search');
const { envs } = require('../helpers/env-vars.js');
const GuildPlayer = require('../helpers/GuildPlayer.js');
const GuildQueue = require('../helpers/GuildQueue.js');
const { AudioSourceYoutube } = require('../helpers/AudioSource.js');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

// --------------------------------------------------------------------
// Plays sound from youtube in voice chat or adds to queue
// --------------------------------------------------------------------

/**
 * @todo add option to play in specified channel
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('youtube')
		.setDescription('Play youtube video')
		.addStringOption(option => option
			.setName('phrase')
			.setDescription('Phrase to search or link')
			.setRequired(true)),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		let phrase = interaction.options.getString('phrase');
		let message = null;

		// Check for abnormalities
		const voiceChannel = interaction.member.voice.channel;
		if (!voiceChannel) {
			message = 'Join voice channel first.';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}
		const permissions = voiceChannel.permissionsFor(interaction.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			message = '❌ Not sufficient permissions!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}

		// Check if phrase contains video id
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		const videoId = phrase.match(regex);
		if (videoId) {
			// Replace phrase to only contain video id, whole url gives bad results
			phrase = videoId[1];
		}

		// Search youtube
		let video = null;
		const opts = {
			maxResults: 1,
			key: envs.YOUTUBE_API_TOKEN,
			type: 'video',
		};

		const videos = await search(phrase.replace(/<(.+)>/g, '$1'), opts);
		video = videos.results[0];

		if (!video) {
			message = '❌ No results!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}

		// Add to queue
		const audio = new AudioSourceYoutube(video.id, Util.escapeMarkdown(video.title), video.link);
		let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);
		if (guildQueue) {
			guildQueue.songs.push(audio);
			message = `☑️ **${audio.title}** has been added to the queue`;
			await interaction.reply(message);
			console.log(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}

		// Join VC
		try {
			// Create queue if doesn't exist
			guildQueue = new GuildQueue(interaction.channel, voiceChannel);
			interaction.client.globalQueue.set(interaction.guild.id, guildQueue);
			guildQueue.songs.push(audio);
			// Call player function
			GuildPlayer.playAudio(interaction, guildQueue);
		}
		catch (error) {
			message = `I could not join the voice channel: ${error}`;
			console.error(`Guild ${interaction.guild.id}: ${message}`);
			interaction.client.globalQueue.delete(interaction.guild.id);
			await voiceChannel.leave();
			await interaction.reply(message);
			return;
		}
	},
};

const { Util } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const search = require('youtube-search');
const { envs } = require('../helpers/env-vars.js');
const GuildPlayer = require('../helpers/GuildPlayer.js');
const GuildQueue = require('../helpers/GuildQueue.js');
const { AudioSourceYoutube } = require('../helpers/AudioSource.js');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

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
		// Check for abnormalities
		if (!interaction.member.voice) {
			await interaction.reply('Join voice channel first.');
			return;
		}
		const voiceChannel = interaction.member.voice.channel;
		const permissions = voiceChannel.permissionsFor(interaction.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			await interaction.reply({ content: '❌ Not sufficient permissions!', ephemeral: true });
			console.log('❌ Not sufficient permissions!');
			return;
		}

		// Check if phrase contains video id
		let phrase = interaction.options.getString('phrase');
		const regex = /\?v=([-_0-9A-Za-z]{11})'/i;
		const videoId = phrase.match(regex);
		if (videoId) {
			// Replace phrase to only contain video id, whole url gives bad results
			phrase = videoId;
		}

		// Search youtube
		let video = null;
		const opts = {
			maxResults: 1,
			key: envs.YOUTUBE_API_TOKEN,
			type: 'video',
		};

		await search(phrase.replace(/<(.+)>/g, '$1'), opts, async function(err, results) {
			if (err) {
				console.log(err);
			}
			video = results[0];

			if (!video) {
				await interaction.reply({ content: '❌ No results!', ephemeral: true });
				console.log('❌ No results!');
				return;
			}

			// Add to queue
			const audio = new AudioSourceYoutube(video.id, Util.escapeMarkdown(video.title), video.link);
			let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);
			if (guildQueue) {
				guildQueue.songs.push(audio);
				await interaction.reply(`☑️ **${audio.title}** has been added to the queue`);
				console.log(`☑️ ${audio.title} has been added to the queue`);
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
				console.error(`I could not join the voice channel: ${error}`);
				interaction.client.globalQueue.delete(interaction.guild.id);
				await voiceChannel.leave();
				await interaction.reply(`I could not join the voice channel: ${error}`);
				return;
			}
		});
	},
};

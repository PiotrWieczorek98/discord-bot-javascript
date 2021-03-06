const { SlashCommandBuilder } = require('@discordjs/builders');
const GuildPlayer = require('../classes/GuildPlayer.js');
const { AudioSourceLocal } = require('../classes/AudioSource.js');
const GuildQueue = require('../classes/GuildQueue.js');
// eslint-disable-next-line no-unused-vars
const { Interaction, GuildMember } = require('discord.js');

// --------------------------------------------------------------------
// Plays sound from sound list in voice chat or adds to queue
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sound')
		.setDescription('Play sound from the list')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Number from the list')
			.setRequired(true)),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const number = interaction.options.getInteger('number');
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

		// Get Guild's sound list
		const soundList = interaction.client.globalSoundList.get(interaction.guildId).soundList;
		if (!soundList) {
			message = '❌ Error while getting guild\'s sound list!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
		}

		// Get the sound
		const soundName = soundList.get(number);
		let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);

		if (!soundName) {
			message = '❌ Sike! That\'s a wrooong number! 🔥';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}

		// Add to queue
		const fullPath = `${interaction.client.paths.SOUNDS}${interaction.member.guild.id}/${soundName}`;
		const audio = new AudioSourceLocal(fullPath, soundName);
		if (guildQueue) {
			guildQueue.songs.push(audio);
			message = `☑️ **${soundName}** has been added to the queue`;
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
			GuildPlayer.playAudio(interaction, guildQueue);
		}
		catch (error) {
			interaction.client.globalQueue.delete(interaction.guild.id);
			await voiceChannel.leave();
			message = `❌I could not join the voice channel: ${error}`;
			await interaction.reply({ content: message, ephemeral: true });
			console.error(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}

	},
};

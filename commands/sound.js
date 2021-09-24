const { SlashCommandBuilder } = require('@discordjs/builders');
const GuildPlayer = require('../helpers/GuildPlayer.js');
const { AudioSourceLocal } = require('../helpers/AudioSource.js');
const GuildQueue = require('../helpers/GuildQueue.js');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

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

		// Check for abnormalities
		const voiceChannel = interaction.member.voice.channel;
		if (!voiceChannel) {
			await interaction.reply({ content: 'Join voice channel first.', ephemeral: true });
			return;
		}
		const permissions = voiceChannel.permissionsFor(interaction.client.user);
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			await interaction.reply({ content: '❌ Not sufficient permissions!', ephemeral: true });
			console.log('❌ Not sufficient permissions!');
			return;
		}

		// Get Guild's sound list
		let soundList = null;
		for (const guildSoundList of interaction.client.globalSoundList) {
			if (guildSoundList.guildId == interaction.member.guild.id) {
				soundList = guildSoundList.soundList;
			}
		}
		if (!soundList) {
			await interaction.reply('❌ Error while getting guild\'s sound list!');
			console.log('❌ Error while getting guild\'s sound list!');
		}

		// Get the sound
		const soundName = soundList.get(number);
		let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);

		if (!soundName) {
			await interaction.reply({ content: '❌ Sike! That\'s a wrooong number! 🔥', ephemeral: true });
			console.log('❌ Sike! That\'s a wrooong number! 🔥');
			return;
		}

		// Add to queue
		const fullPath = `${interaction.client.paths.SOUNDS}${interaction.member.guild.id}/${soundName}`;
		const audio = new AudioSourceLocal(fullPath, soundName);
		if (guildQueue) {
			guildQueue.songs.push(audio);
			await interaction.reply(`☑️ **${soundName}** has been added to the queue`);
			console.log(`☑️ ${soundName} has been added to the queue`);
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
			await interaction.reply({ content: `❌I could not join the voice channel: ${error}`, ephemeral: true });
			console.error(`❌I could not join the voice channel: ${error}`);
			return;
		}

	},
};

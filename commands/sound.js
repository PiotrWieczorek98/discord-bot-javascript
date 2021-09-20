const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');
const ClientPlayer = require('../helpers/ClientPlayer.js');
const { AudioSourceLocal } = require('../helpers/AudioSource.js');
const GuildQueue = require('../helpers/GuildQueue.js');
const root = require('../helpers/root.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sound')
		.setDescription('Play sound from the list')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Number from the list.')
			.setRequired(true)),
	async execute(interaction) {
		const number = interaction.options.getInteger('number');
		let soundList = null;

		for (const guildSoundList of interaction.client.globalSoundList) {
			if (guildSoundList.guildId == interaction.member.guild.id) {
				soundList = guildSoundList.soundList;
			}
		}
		if (!soundList) {
			console.log('Error while getting guild\'s sound list!');
			await interaction.reply('Error while getting guild\'s sound list!');
		}

		const soundName = soundList.get(number);
		let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);

		if (!soundName) {
			await interaction.reply('Sike! That\'s a wrooong number!');
			return;
		}

		// Add to queue
		const fullPath = `${root}/sounds/${interaction.member.guild.id}/${soundName}`;
		const sound = new AudioSourceLocal(fullPath, soundName);
		if (guildQueue) {
			guildQueue.songs.push(sound);
			await interaction.reply(`✅ **${soundName}** has been added to the queue`);
			console.log(`✅ ${soundName} has been added to the queue`);
			return;
		}

		// Join VC
		const voiceChannel = interaction.member.voice.channel;
		try {
			// Create queue if doesn't exist
			guildQueue = new GuildQueue(interaction.channel, voiceChannel);
			interaction.client.globalQueue.set(interaction.guild.id, guildQueue);
			guildQueue.songs.push(sound);
			ClientPlayer.playAudio(interaction, guildQueue);
		}
		catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			interaction.client.globalQueue.delete(interaction.guild.id);
			await voiceChannel.leave();
			await interaction.reply(`I could not join the voice channel: ${error}`);
			return;
		}

	},
};

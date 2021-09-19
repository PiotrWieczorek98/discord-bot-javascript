const { SlashCommandBuilder } = require('@discordjs/builders');
const { createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
const ClientPlayer = require('../helpers/AudioPlayer.js');
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
		const soundName = soundList.get(number);
		let guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);

		if (!soundName) {
			await interaction.reply('Sike! That\'s a wrooong number!');
			return;
		}

		// Add to queue
		const fullPath = `${root}\\sounds\\${interaction.member.guild.id}\\${soundName}`;
		const sound = {
			path: fullPath,
			title: soundName,
		};
		if (guildQueue) {
			guildQueue.songs.push(sound);
			console.log(guildQueue.songs);
			await interaction.reply(`✅ **${soundName}** has been added to the queue!`);
			return;
		}

		// Create queue if doesn't exist
		const channel = interaction.member.voice.channel;
		guildQueue = {
			textChannel: interaction.channel,
			voiceChannel: channel,
			connection: null,
			player: createAudioPlayer(),
			songs: [],
		};
		interaction.client.globalQueue.set(interaction.guild.id, guildQueue);
		guildQueue.songs.push(sound);

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

	},
};

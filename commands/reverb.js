const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');

const fs = require('fs');
const opus = require('prism-media');
const { pipeline } = require('stream');

// --------------------------------------------------------------------
// WORK IN PROGRESS
// --------------------------------------------------------------------

/**
 * @todo record and add effects to voice
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reverb')
		.setDescription('reverb test'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		// const ffmpeg = require('ffmpeg');
		const channel = interaction.member.voice.channel;

		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});

		const opusStream = connection.receiver.subscribe(interaction.member.id, {
			end: {
				behavior: EndBehaviorType.AfterSilence,
				duration: 100,
			},
		});
		const filename = 'test.ogg';
		const out = fs.createWriteStream(filename);
		const oggStream = new opus.OggLogicalBitstream({
			opusHead: new opus.OpusHead({
				channelCount: 2,
				sampleRate: 48000,
			}),
			pageSizeControl: {
				maxPackets: 10,
			},
		});
		console.log(`👂 Started recording ${filename}`);

		pipeline(opusStream, oggStream, out, (err) => {
			if (err) {
				console.warn(`❌ Error recording file ${filename} - ${err.message}`);
			}
			else {
				console.log(`✅ Recorded ${filename}`);
			}
		});
	},
};

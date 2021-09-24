const { Client, Collection } = require('discord.js');
const { Intents } = require('discord.js');

class ClientExtended extends Client {
	constructor() {
		super({
			disableMentions: 'everyone',
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
		});
		// globalQueue entry looks like:
		// {
		//  guildId: guild.id,
		//  guildQueue: {
		// 		textChannel: interaction.channel,
		// 		voiceChannel: channel,
		// 		connection: null,
		// 		player: createAudioPlayer(),
		// 		songs: [],
		// 	};
		// }
		this.globalQueue = new Map();

		// globalSoundList entry looks like:
		// {
		// 	guildId: guildId,
		// 	soundList: [],
		//  path: filePath;
		// };
		this.globalSoundList = [];

		// All commands are stored here
		this.commands = new Collection();

		// Dedicate specific channel for auto upload sounds
		// if channelId is not specified default is any channel
		// Map is {<guildId>, <channelId>}
		this.autoUploadSoundChannel = new Map();

		// Store all paths to not scatter it across the app
		this.paths = {
			COMMANDS: './commands/',
			SOUNDS: './sounds/',
			DATA: './data/',
		};

		// Store global variables here
		this.vars = {
			CONTAINER_DATA: 'data',
			FILE_AUTO_UPLOAD: 'auto-upload.json',
		};
	}
}

// Expand Client class
module.exports = ClientExtended;
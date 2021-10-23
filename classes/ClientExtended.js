const { Client, Collection } = require('discord.js');
const { Intents } = require('discord.js');

/**
 * This is an extension for Client class.
 * Contains addidional fields
 */
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
		// Map is {<guildId>, <GuildSoundList>}
		this.globalSoundList = new Map();

		// All commands are stored here
		this.commands = new Collection();

		// Dedicate specific channel for auto upload sounds
		// if channelId is not specified default is any channel
		// Map is {<guildId>, <channelId>}
		this.soundsChannel = new Map();

		// Store all paths to not scatter it across the app
		this.paths = {
			COMMANDS: './commands/',
			SOUNDS: './sounds/',
			DATA: './data/',
		};

		// Store global variables here
		this.vars = {
			HEROKU_APP: 'discord-js-boi-bot',
			HEROKU_DINO: 'worker',
			CONTAINER_DATA: 'data',
			FILE_SOUNDS_CHANNEL: 'sounds-channel.json',
			FILE_GAMBLERS: 'gamblers.json',
			FILE_BETS: 'bets.csv',
		};

		// For gambling
		this.gambleConfig = {
			initialCredits: 100,
			port: 3000,
			timeLimit: 60000,
			fileGamblersPath: `${this.paths.DATA}/${this.vars.FILE_GAMBLERS}`,
			fileHistoryPath: `${this.paths.DATA}/${this.vars.FILE_BETS}`,
		};
	}
}

// Expand Client class
module.exports = ClientExtended;
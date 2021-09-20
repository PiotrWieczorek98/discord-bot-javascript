const { Client, Collection } = require('discord.js');
const { Intents } = require('discord.js');

// Expand Client class
module.exports = class extends Client {
	constructor() {
		super({
			disableMentions: 'everyone',
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES],
		});
		// globalQueue entry looks like this:
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
		// globalSoundList entry looks like this:
		// {
		// 	guildId: guildId,
		// 	soundList: [],
		//  path: filePath;
		// };
		this.globalSoundList = [];
		this.commands = new Collection();
	}
};
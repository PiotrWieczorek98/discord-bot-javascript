const { Client, Collection } = require('discord.js');
const { Intents } = require('discord.js');

// Expand Client class
module.exports = class extends Client {
	constructor() {
		super({
			disableMentions: 'everyone',
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES],
		});

		this.commands = new Collection();
		this.cooldowns = new Collection();
		// Global queue costists of guilds' id and per-guild queues
		this.globalQueue = new Map();
	}
};
// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { envs } = require('./config.js');
// const cloud = require('./helpers/azure-storage.js');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Yahalo!');
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	}
	else if (commandName === 'server') {
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: 
		${interaction.guild.memberCount}\nCreated At: ${interaction.guild.createdAt}\n 
		Verification Level: ${interaction.guild.verificationLevel}`);
	}
	else if (commandName === 'user') {
		await interaction.reply('User info.');
	}
});

// Login to Discord with your client's token
client.login(envs.TOKEN);

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { envs } = require('./env-vars.js');
const fs = require('fs');

const commandsJSON = [];
const commandFiles = fs.readdirSync(__dirname + '/../commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	commandsJSON.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(envs.TOKEN);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(envs.CLIENT_ID, envs.GUILD_ID),
			{ body: commandsJSON },
		);

		console.log('Successfully registered application commands.');
	}
	catch (error) {
		console.error(error);
	}
})();
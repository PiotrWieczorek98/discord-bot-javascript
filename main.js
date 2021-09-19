// Require the necessary discord.js classes
const { envs } = require('./helpers/env-vars.js');
const fs = require('fs');
const Client = require('./helpers/Client.js');
const Azure = require('./helpers/azure-storage.js');

// Create a new client instance
const client = new Client();

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Yahalo!');
	if (!fs.existsSync('./sounds')) {
		fs.mkdirSync('./sounds');
	}

	// Async function to allow await
	(async () => {
		// Prepare container for all guilds;
		const guilds = await Azure.listContainers();
		client.guilds.cache.forEach(guild => {
			if (!guilds.includes(guild.id)) {
				(async () => {
					await Azure.createContainer(guild.id);
				})();
			}
		});
		// Download all sounds
		for (const guildId of guilds) {
			const path = `${__dirname}/sounds/${guildId}`;
			if (!fs.existsSync(path)) {
				fs.mkdirSync(path);
			}

			const guildSoundList = {
				guildId: guildId,
				soundList: await Azure.downloadAllBlobs(guildId, path),
			};

			client.globalSoundList.push(guildSoundList);
		}
		console.log(client.globalSoundList);
	})();

});


// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Listen for commands
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Login to Discord with your client's token
client.login(envs.TOKEN);

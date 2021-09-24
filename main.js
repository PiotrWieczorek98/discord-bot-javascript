// Require the necessary discord.js classes
const { envs } = require('./helpers/env-vars.js');
const fs = require('fs');
const readline = require('readline');
const ClientExtended = require('./helpers/ClientExtended.js');
const Azure = require('./helpers/Azure.js');
const GuildSoundList = require('./helpers/GuildSoundList.js');

// Create a new client instance
const client = new ClientExtended();

// Download sounds from Azure
async function getSoundsFromContainers() {
	// Check directories
	if (!fs.existsSync(client.paths.SOUNDS)) {
		fs.mkdirSync(client.paths.SOUNDS);
	}
	// Check containers for every guild
	const containers = await Azure.listContainers();
	for (const entry of client.guilds.cache) {
		const guild = entry[1];

		// Create one if didn't find
		if (!containers.includes(guild.id)) {
			(async () => {
				await Azure.createContainer(guild.id);
			})();
		}

		// Download all sounds
		const path = `${client.paths.SOUNDS}${guild.id}`;
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}

		const guildSoundList = new GuildSoundList(guild.id, path);
		await guildSoundList.downloadSounds();

		client.globalSoundList.push(guildSoundList);
	}
}

async function getDataFromContainer() {
	const containers = await Azure.listContainers();
	// Check directory
	if (!fs.existsSync(client.paths.DATA)) {
		fs.mkdirSync(client.paths.DATA);
	}

	// Check container
	if (!containers.includes(client.vars.CONTAINER_DATA)) {
		await Azure.createContainer(client.vars.CONTAINER_DATA);
	}

	// Download files
	const filesMap = await Azure.downloadAllBlobs(client.vars.CONTAINER_DATA, client.paths.DATA);
	const files = [... filesMap.values()];

	// Load data
	const fileAutoUpladPath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
	let guilds = null;
	if (files.includes(client.vars.FILE_AUTO_UPLOAD)) {
		fs.readFile(fileAutoUpladPath, function(err, data) {

			guilds = JSON.parse(data);
			guilds.forEach((value) => {
				client.autoUploadSoundChannel.set(value[0], value[1]);
			});
		});
	}
	else {
		// Prepare data and upload
		guilds = new Map();
		client.guilds.cache.forEach((guild) => {
			guilds.set(guild.id, -1);
			client.autoUploadSoundChannel.set(guild.id, -1);
		});

		const serializedGuilds = JSON.stringify([...guilds.entries()]);
		fs.writeFile(fileAutoUpladPath, serializedGuilds,
			async function(err) {
				if (err) {
					console.error('Error writing file! ', err);
				}
				await Azure.uploadBlob(client.vars.CONTAINER_DATA, fileAutoUpladPath);
			},
		);
	}
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
	client.user.setActivity('Loading...');

	// Get sounds
	(async () => {
		await getSoundsFromContainers();
		await getDataFromContainer();
		console.log(`
		⡿⠋⠄⣀⣀⣤⣴⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣌⠻⣿⣿
		⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠹⣿
		⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠹
		⣿⣿⡟⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡛⢿⣿⣿⣿⣮⠛⣿⣿⣿⣿⣿⣿⡆
		⡟⢻⡇⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣣⠄⡀⢬⣭⣻⣷⡌⢿⣿⣿⣿⣿⣿
		⠃⣸⡀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠈⣆⢹⣿⣿⣿⡈⢿⣿⣿⣿⣿
		⠄⢻⡇⠄⢛⣛⣻⣿⣿⣿⣿⣿⣿⣿⣿⡆⠹⣿⣆⠸⣆⠙⠛⠛⠃⠘⣿⣿⣿⣿
		⠄⠸⣡⠄⡈⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠁⣠⣉⣤⣴⣿⣿⠿⠿⠿⡇⢸⣿⣿⣿
		⠄⡄⢿⣆⠰⡘⢿⣿⠿⢛⣉⣥⣴⣶⣿⣿⣿⣿⣻⠟⣉⣤⣶⣶⣾⣿⡄⣿⡿⢸
		⠄⢰⠸⣿⠄⢳⣠⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣼⣿⣿⣿⣿⣿⣿⡇⢻⡇⢸
		⢷⡈⢣⣡⣶⠿⠟⠛⠓⣚⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⢸⠇⠘
		⡀⣌⠄⠻⣧⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠛⠛⠛⢿⣿⣿⣿⣿⣿⡟⠘⠄⠄
		⣷⡘⣷⡀⠘⣿⣿⣿⣿⣿⣿⣿⣿⡋⢀⣠⣤⣶⣶⣾⡆⣿⣿⣿⠟⠁⠄⠄⠄⠄
		⣿⣷⡘⣿⡀⢻⣿⣿⣿⣿⣿⣿⣿⣧⠸⣿⣿⣿⣿⣿⣷⡿⠟⠉⠄⠄⠄⠄⡄⢀
		⣿⣿⣷⡈⢷⡀⠙⠛⠻⠿⠿⠿⠿⠿⠷⠾⠿⠟⣛⣋⣥⣶⣄⠄⢀⣄⠹⣦⢹⣿
		            BOT IS READY!`);
	})();

	client.user.setActivity('Dick Size Contest', { type: 'COMPETING' });
});


// Load commands
const commandFiles = fs.readdirSync(client.paths.COMMANDS).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`${client.paths.COMMANDS}${file}`);
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
		await interaction.reply({ content: '😬 There was an error while executing this command!', ephemeral: true });
		console.error(error);
	}
});

// Login to Discord with your client's token
client.login(envs.TOKEN);

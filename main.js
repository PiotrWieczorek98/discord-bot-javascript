const { envs } = require('./helpers/env-vars.js');
const fs = require('fs');
const ClientExtended = require('./helpers/ClientExtended.js');
const LeagueBetting = require('./helpers/LeagueBetting.js');

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------

// Create a new client instance
const client = new ClientExtended();

// Load commands
const commandFiles = fs.readdirSync(client.paths.COMMANDS).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`${client.paths.COMMANDS}${file}`);
	client.commands.set(command.data.name, command);
}

// -------------------------------------------------------------
// Listeners
// -------------------------------------------------------------

// Command listeners
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		console.log(`Guild ${interaction.guild.id}: ${interaction.commandName}`);
		await command.execute(interaction);
	}
	catch (error) {
		await interaction.reply({ content: '😬 There was an error while executing this command!', ephemeral: true });
		console.log(`Guild ${interaction.guild.id}: ${error}`);
	}
});

// Event listeners
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Set endpoints
LeagueBetting.setListener(3000);

// -------------------------------------------------------------
// Login to Discord with client's token
// -------------------------------------------------------------
client.login(envs.TOKEN);

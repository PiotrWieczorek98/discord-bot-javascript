// eslint-disable-next-line no-unused-vars
const ClientExtended = require('../helpers/ClientExtended.js');
const GuildSoundList = require('../helpers/GuildSoundList.js');
const fs = require('fs');
const Azure = require('../helpers/Azure');
const GuildDataManager = require('../helpers/GuildDataManager');
const LeagueBetting = require('../helpers/LeagueBetting.js');

// --------------------------------------------------------------------
// Run once bot is ready
// --------------------------------------------------------------------


module.exports = {
	name: 'ready',
	once: true,
	/**
     * Run once bot is ready
     * @param {ClientExtended} client
     */
	execute(client) {
		client.user.setActivity('Loading...');
		(async () => {
			// ---------------------------------------------------------
			// Download Sounds from Azure
			// ---------------------------------------------------------
			console.log('\nGetting guilds\' sounds from container');
			// Check directories
			if (!fs.existsSync(client.paths.SOUNDS)) {
				fs.mkdirSync(client.paths.SOUNDS);
			}
			// Check containers for every guild
			const containers = await Azure.listContainers();
			for (const entry of client.guilds.cache) {
				const guild = entry[1];
				console.log(`Guild's ${guild.id} sounds: \n`);

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

				client.globalSoundList.set(guild.id, guildSoundList);
			}

			// ------------------------------------------------------------
			// Download guilds' data
			// -------------------------------------------------------------
			console.log('\nGetting guilds\' data from container');
			// Check directory
			if (!fs.existsSync(client.paths.DATA)) {
				fs.mkdirSync(client.paths.DATA);
			}

			// Check container
			if (!containers.includes(client.vars.CONTAINER_DATA)) {
				await Azure.createContainer(client.vars.CONTAINER_DATA);
			}

			// Download files
			const filesMap = await Azure.downloadAllBlobs(client.vars.CONTAINER_DATA, client.paths.DATA, true);
			const files = [... filesMap.values()];

			// Load sound channels data
			let fileName = client.vars.FILE_SOUNDS_CHANNEL;
			let filePath = `${client.paths.DATA}/${fileName}`;
			let guilds = null;
			if (files.includes(fileName)) {
				guilds = await GuildDataManager.readMapFromFile(filePath);
				guilds.forEach((value) => {
					client.soundsChannel.set(value[0], value[1]);
				});
			}
			else {
				// Prepare data and upload
				guilds = new Map();
				client.guilds.cache.forEach((guild) => {
					guilds.set(guild.id, null);
					client.soundsChannel.set(guild.id, null);
				});
				await GuildDataManager.writeMapToFile(guilds, filePath);
				await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
			}

			// DELETE THIS IF YOU FORKED THIS REPO
			// Load League betting data
			LeagueBetting.constructor(client, 100);
			fileName = client.vars.FILE_BETTERS;
			filePath = `${client.paths.DATA}/${fileName}`;
			let betters = null;
			if (files.includes(fileName)) {
				betters = await GuildDataManager.readMapFromFile(filePath);
				betters.forEach((value) => {
					LeagueBetting.betters.set(value[0], value[1]);
				});
			}
			else {
				// Prepare empty data and upload
				betters = new Map();
				await GuildDataManager.writeMapToFile(betters, filePath);
				await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
			}

			console.log('Guilds\' data loaded\n');

			// ------------------------------------------------------------
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
			client.user.setActivity('Dick Size Contest', { type: 'COMPETING' });

		})();
	},
};
// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');
// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');

const fs = require('fs');
const Azure = require('./Azure');
const GuildSoundList = require('./GuildSoundList');

/**
 * Class used to retrieve data from cloud each time it is restarted.
 * Used because many hosting services use ephermal storage
 */
class Initializer {
	/**
     * Download guilds' sounds from Azure
     * @param {ClientExtended} client
     */
	static async getSoundsFromContainers(client) {
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

			client.globalSoundList.push(guildSoundList);
		}
	}

	/**
     * Downloads guilds' data from Azure
     * @param {ClientExtended} client
     */
	static async getDataFromContainer(client) {
		console.log('\nGetting guilds\' data from container');
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
		console.log('Guilds\' data loaded\n');
	}

	/**
	 * Adds new guild's data
	 * @param {Guild} newGuild
	 */
	static async addNewGuild(newGuild) {
		// Prepare data and upload
		const client = newGuild.client;
		client.autoUploadSoundChannel.set(newGuild.id, -1);

		const fileAutoUpladPath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
		const serializedGuilds = JSON.stringify([...client.autoUploadSoundChannel.entries()]);
		fs.writeFile(fileAutoUpladPath, serializedGuilds,
			async function(err) {
				if (err) {
					console.error('Error writing file! ', err);
				}
				await Azure.uploadBlob(client.vars.CONTAINER_DATA, fileAutoUpladPath);
			},
		);
	}

	/**
	 * Adds new guild's data
	 * @param {Guild} oldGuild
	 */
	static async removeGuild(oldGuild) {
		// Prepare data and upload
		const client = oldGuild.client;
		client.autoUploadSoundChannel.delete(oldGuild.id);

		const fileAutoUpladPath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
		const serializedGuilds = JSON.stringify([...client.autoUploadSoundChannel.entries()]);
		fs.writeFile(fileAutoUpladPath, serializedGuilds,
			async function(err) {
				if (err) {
					console.error('Error writing file! ', err);
				}
				await Azure.uploadBlob(client.vars.CONTAINER_DATA, fileAutoUpladPath);
			},
		);
		await Azure.deleteContainer(oldGuild.id);
	}
}

module.exports = Initializer;
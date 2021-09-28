// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');
// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');

const fs = require('fs');
const fsPromises = require('fs').promises;
const Azure = require('./Azure');
const GuildSoundList = require('./GuildSoundList');

/**
 * Class used to retrieve and upload data from cloud and manage local files.
 * Prepared for usage with ephermal storage
 */
class DataManager {

	/**
	 * Writes map object to file
	 * @param {Map} map
	 * @param {String} filePath
	 * @returns {Promise<Boolean>}
	 */
	static async writeMapToFile(map, filePath) {
		const serializedGuilds = JSON.stringify([...map.entries()]);
		await fsPromises.writeFile(filePath, serializedGuilds,
			function(err) {
				if (err) {
					console.error('Error writing file! ', err);
					return new Promise((reject) => {
						reject(false);
					});
				}
			},
		);
		return new Promise((resolve) => {
			resolve(true);
		});
	}

	/**
	 * Reads map from JSON
	 * @param {String} filePath
	 * @returns {Promise<Map<String, String>>}
	 */
	static async readMap(filePath) {
		const data = await fsPromises.readFile(filePath,
			function(err) {
				if (err) {
					console.error('Error writing file! ', err);
					return new Promise((reject) => {
						reject(null);
					});
				}
			},
		);

		const result = JSON.parse(data);
		return new Promise((resolve) => {
			resolve(result);
		});
	}

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
		const filesMap = await Azure.downloadAllBlobs(client.vars.CONTAINER_DATA, client.paths.DATA, true);
		const files = [... filesMap.values()];

		// Load data
		const filePath = `${client.paths.DATA}/${client.vars.FILE_SOUNDS_CHANNEL}`;
		let guilds = null;
		if (files.includes(client.vars.FILE_SOUNDS_CHANNEL)) {
			guilds = await this.readMap(filePath);
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
			await this.writeMapToFile(guilds, filePath);
			await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
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
		client.autoUploadSoundChannel.set(newGuild.id, null);

		const filePath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
		await this.writeMapToFile(client.autoUploadSoundChannel, filePath);
		await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
	}

	/**
	 * Adds new guild's data
	 * @param {Guild} oldGuild
	 */
	static async removeGuild(oldGuild) {
		// Prepare data and upload
		const client = oldGuild.client;
		client.autoUploadSoundChannel.delete(oldGuild.id);

		const filePath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
		await this.writeMapToFile(client.autoUploadSoundChannel, filePath);
		await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
		await Azure.deleteContainer(oldGuild.id);
	}
}

module.exports = DataManager;
// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');
// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');
const fs = require('fs').promises;
const Azure = require('./Azure');

/**
 * Class used to retrieve and upload data from cloud and manage local files.
 * Prepared for usage with ephermal storage
 */
class GuildDataManager {

	/**
	 * Writes map object to file
	 * @param {Map} map
	 * @param {String} filePath
	 * @returns {Promise<Boolean>}
	 */
	static async writeMapToFile(map, filePath) {
		const serializedGuilds = JSON.stringify([...map.entries()]);
		await fs.writeFile(filePath, serializedGuilds,
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
		const data = await fs.readFile(filePath,
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

module.exports = GuildDataManager;
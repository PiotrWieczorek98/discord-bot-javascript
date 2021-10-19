// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');
// eslint-disable-next-line no-unused-vars
const { Guild } = require('discord.js');
const fsPromises = require('fs').promises;
const https = require('https');
const fs = require('fs');

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
	static async readMapFromFile(filePath) {
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
	 * Download file from given url to local storage
	 * @param {String} url
	 * @param {String} filePath
	 * @param {function()} onFinish
	 */
	static async downloadFromUrl(url, filePath, onFinish) {
		const file = fs.createWriteStream(filePath);
		https.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close(onFinish);
			});
		}).on('error', function(err) {
			fs.unlink(filePath);
			if (onFinish) onFinish(err.message);
		});
	}
}

module.exports = GuildDataManager;
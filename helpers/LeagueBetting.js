const { GuildMember } = require('discord.js');
const express = require('express');
const Azure = require('./Azure');
const ClientExtended = require('./ClientExtended');
const GuildDataManager = require('./GuildDataManager');

/**
 * PERSONAL FUNCTION, REQUIRES SEPERATE CLIENT FOR USERS
 * This struct allows betting on player's death
 */
const LeagueBetting = {

	app: express(),
	betters: new Map(),
	initialCredits: null,
	// client: null,
	fileName: null,
	filePath: null,
	container: null,

	/**
	 * Singleton constructor
	 * @param {ClientExtended} client
	 * @param {number} credits
	 */
	constructor: function(client, credits) {
		// this.client = client;
		this.fileName = client.vars.FILE_BETTERS;
		this.filePath = `${client.paths.DATA}/${this.fileName}`;
		this.container = client.vars.CONTAINER_DATA;
		this.initialCredits = credits;
	},

	/**
	 * Add a member to betters list
	 * @param {GuildMember} better
	 */
	addBetter: async function(better) {
		this.betters.set(better.id, this.initialCredits);

		await GuildDataManager.writeMapToFile(LeagueBetting.betters, this.filePath);
		await Azure.uploadBlob(this.container, this.filePath, undefined, true);
	},

	/**
	 * Update betting data
	 * @param {Map<string, number>} betters
	 */
	updateBetters: async function(betters) {
		for (const better in betters) {
			this.betters.set(better[0], better[1]);
		}

		await GuildDataManager.writeMapToFile(LeagueBetting.betters, this.filePath);
		await Azure.uploadBlob(this.container, this.filePath, undefined, true);
		console.log('Betters list updated.');
	},

	/**
     * @todo Odpalenie betowani
     * @param {string} username
     */
	startBetting: async function(username) {
		console.log('Started Betting for: ', username);

	},

	/**
     *
     * @param {number} port
     */
	setListener: async function(port) {
		this.app.use(express.json());

		this.app.post('/death', (req, res) => {
			const events = req.body.Events;
			console.log(events);
			res.send(events);

		});
		this.app.post('/game_started', (req, res) => {

			const events = req.body.name;
			console.log(req.body.name);
			res.send(events);

		});

		this.app.listen(process.env.PORT || port, () => console.log('Listening on port: ', port));
	},

};

module.exports = LeagueBetting;
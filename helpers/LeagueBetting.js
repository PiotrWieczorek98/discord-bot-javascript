const { GuildMember, Interaction } = require('discord.js');
const express = require('express');
const Azure = require('./Azure');
const ClientExtended = require('./ClientExtended');
const GuildDataManager = require('./GuildDataManager');


class LiveBet {
	/**
	 *
	 * @param {string} summonerName
	 */
	constructor(summonerName) {
		this.summonerName = summonerName;
		this.isActive = true;
		this.jackpot = 0;
	}

}

/**
 * PERSONAL FUNCTION, REQUIRES SEPERATE CLIENT FOR USERS
 * This struct allows betting on player's death
 */
const LeagueBetting = {

	app: express(),
	betters: new Map(),
	liveBets: [],
	initialCredits: null,
	fileName: null,
	filePath: null,
	container: null,

	/**
	 * Singleton constructor
	 * @param {ClientExtended} client
	 * @param {number} credits
	 */
	constructor: function(client, credits) {
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
     * @param {string} summonerName
     */
	startBetting: async function(summonerName) {
		console.log('Started Betting for: ', summonerName);

		const newBet = new LiveBet(summonerName);
		this.liveBets.push(newBet);
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
			res.send('ok');

		});
		this.app.post('/game_started', (req, res) => {

			const events = req.body;
			console.log(events);
			res.send(events);

		});

		const listeningPort = process.env.PORT || port;
		this.app.listen(listeningPort, () => console.log('Listening on port: ', listeningPort));
	},

};

module.exports = LeagueBetting;
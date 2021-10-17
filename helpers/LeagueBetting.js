const { GuildMember, Interaction } = require('discord.js');
const express = require('express');
const { toInteger } = require('lodash');
const Azure = require('./Azure');
const ClientExtended = require('./ClientExtended');
const GuildDataManager = require('./GuildDataManager');


class BettingEntry {
	/**
	 *
	 * @param {string} summonerName
	 * @param {string} channelId
	 */
	constructor(summonerName, channelId) {
		this.summonerName = summonerName;
		this.isActive = true;
		this.jackpot = 0;
		// const bet = {
		//	 betterId: better.id,
		// betterName: name,
		//	 value: betValue,
		//	 minute: minute,
		// };
		// <id, betMinute>
		this.bets = [];
		this.channelId = channelId;
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
	client: null,

	/**
	 * Singleton constructor
	 * @param {ClientExtended} client
	 * @param {number} credits
	 */
	constructor: function(client, credits) {
		this.app.use(express.json());
		this.fileName = client.vars.FILE_BETTERS;
		this.filePath = `${client.paths.DATA}/${this.fileName}`;
		this.container = client.vars.CONTAINER_DATA;
		this.initialCredits = credits;
		this.client = client;
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
	 * @param {{}} betters
	 */
	updateBetters: async function() {
		await GuildDataManager.writeMapToFile(LeagueBetting.betters, this.filePath);
		await Azure.uploadBlob(this.container, this.filePath, undefined, true);
		console.log('Betters list updated.');
	},

	/**
     * @todo Odpalenie betowani
     * @param {string} summonerName
     * @param {string} channelId
     */
	startBetting: async function(summonerName, channelId) {
		console.log('Started Betting for: ', summonerName);

		const newBetting = new BettingEntry(summonerName, channelId);
		this.liveBets.push(newBetting);
	},

	/**
	 *
	 * @param {GuildMember} better
	 * @param {number} betValue
	 * @param {string} targetSummoner
	 * @param {number} minute
	 */
	addBetToJackpot: function(better, betValue, targetSummoner, minute) {
		let message = null;

		for (const liveBet of this.liveBets) {
			if (liveBet.summonerName == targetSummoner && liveBet.isActive) {
				const betterCredits = this.betters.get(better.id);

				// Check credit account
				if (betterCredits < betValue) {
					message = 'Not enough credits!';
					return message;
				}

				this.betters.set(better.id, betterCredits - betValue);
				liveBet.jackpot += betValue;

				const bet = {
					betterId: better.id,
					betterName: better.displayName,
					value: betValue,
					minute: minute,
				};
				liveBet.bets.push(bet);

				message = `**${better.displayName}** bets **${betValue}**, that **${targetSummoner}** will die in **${minute}** minutes.`;


			}
		}

		return message;
	},

	/**
	 *
	 * @param {string} targetSummoner
	 * @param {number} minute
	 * @returns
	 */
	endBetting: function(targetSummoner, deathMinute) {
		let message = null;
		if (deathMinute == 0) {
			message = `Pog, ${targetSummoner} didn't die! Everyone lost!`;
			return message;
		}
		// const bet = {
		//	 betterId: better.id,
		//	 betterName: better.name,
		//	 value: betValue,
		//	 minute: minute,
		// };

		for (const liveBet of this.liveBets) {
			// Find betting
			if (liveBet.summonerName == targetSummoner && liveBet.isActive) {
				liveBet.isActive = false;

				if (liveBet.bets.length < 2) {
					message = `**${targetSummoner}** died at **${deathMinute}** minute but not enough bets were sent!`;
					// Return bets
					if (liveBet.bets.length == 1) {
						const better = liveBet.bets[0];
						const credits = this.betters.get(better.id) + better.betValue;
						this.betters.set(credits);
						this.updateBetters();
					}
					return message;
				}
				message = `**${targetSummoner}** died at **${deathMinute}** minute!`;

				// Find winners
				let winners = [];
				const losers = [];
				for (const entry of liveBet.bets) {
					if (winners[0] == null || Math.abs(entry.minute - deathMinute) < Math.abs(winners[0].minute - deathMinute)) {

						for (const nowLoser of winners) {
							losers.push(nowLoser);
						}
						winners = [];
						winners.push(entry);
					}
					else if (Math.abs(entry.minute - deathMinute) == Math.abs(winners.minute - deathMinute)) {
						winners.push(entry);
					}
					else {
						losers.push(entry);
					}
				}

				// Calculate prize
				let denominator = 0;
				for (const winner of winners) {
					denominator += winner.value;
				}

				// Give prize
				message += '\n**Winners: **';
				for (const winner of winners) {
					const multiplier = winner.value / denominator;
					const prize = liveBet.jackpot * multiplier;
					const newCredits = this.betters.get(winner.betterId) + prize;
					this.betters.set(winner.betterId, newCredits);
					message += ` **${winner.betterName}**, won: **${prize}**,`;
				}

				message += '**\nLosers: **';
				for (const loser of losers) {
					message += ` **${loser.betterName}**, lost **${loser.value}**,`;
				}

				this.updateBetters();

			}
			break;
		}

		return message;
	},

	// ------------------------------------------------------------------------------------
	// ENDPOINTS
	// ------------------------------------------------------------------------------------

	/**
     *
     * @param {number} port
     */
	setListener: async function(port) {

		this.app.post('/game_started', (req, res) => {
			const data = req.body;
			const summoner = data.SummonerName;
			const channelId = data.ChannelId;
			let message = null;
			// Avoid duplicate
			let foundDuplicate = false;
			for (const entry of this.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					foundDuplicate = true;
				}
			}

			if (!foundDuplicate) {
				this.startBetting(summoner, channelId);

				message = `Started betting for: **${summoner}**`;
				console.log('Received /game_started request for ', summoner);
			}
			else {
				message = `Duplicate betting for: **${summoner}**, Betting cancelled`;
				console.log('Received duplicate /game_started request for ', summoner);
			}


			// SEND CHANNEL MESSAGE
			this.client.channels.cache.get(channelId).send(message);

			res.send({ status: 'ok' });

		});

		this.app.post('/death', (req, res) => {
			const data = req.body;
			const summoner = data.VictimName;

			for (const entry of this.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					const time = parseInt(data.EventTime);
					const minute = Math.ceil(time / 60);
					const message = this.endBetting(summoner, minute);

					// SEND CHANNEL MESSAGE
					this.client.channels.cache.get(entry.channelId).send(message);
					break;
				}
			}

			console.log('Received /death request for ', summoner);
			res.send({ status: 'ok' });

		});

		this.app.post('/game_ended', (req, res) => {
			const data = req.body;
			const summoner = data.VictimName;

			for (const entry of this.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					const message = this.endBetting(summoner, 0);

					// SEND CHANNEL MESSAGE
					this.client.channels.cache.get(entry.channelId).send(message);
				}
			}

			console.log('Received /death request for ', summoner);
			res.send({ status: 'ok' });
		});

		this.app.post('/ping', (req, res) => {
			const data = req.body;

			console.log('Received /ping request for ', data);
			res.send(data);
		});

		const listeningPort = process.env.PORT || port;
		this.app.listen(listeningPort, () => console.log('Listening on port: ', listeningPort));
	},

};

module.exports = LeagueBetting;
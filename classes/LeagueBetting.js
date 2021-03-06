// eslint-disable-next-line no-unused-vars
const { GuildMember } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');
const Azure = require('./Azure');
const GuildDataManager = require('./GuildDataManager');
const wait = require('../helpers/wait');

// ------------------------------------------------------------------------------------
// PERSONAL FUNCTIONALITY, REQUIRES SEPERATE CLIENT FOR USERS
// DELETE THIS FILE IF UNCERTAIN
// ------------------------------------------------------------------------------------


/**
 * Class representing a single betting event
 */
class BettingEntry {
	/**
	 *this.betArrayEntry = {
	 * gamblerId: gambler.id,
	 * gamblerName: name,
	 * value: betValue,
	 * minute: minute,};
	 * @param {string} summonerName
	 * @param {string} channelId
	 */
	constructor(summonerName, channelId, timeLimit) {
		this.summonerName = summonerName;
		this.isActive = true;
		this.bettingAllowed = true;
		this.jackpot = 0;
		this.bets = [];
		this.channelId = channelId;
		this.startTimer(timeLimit);
	}

	/**
	 * Allow betting for a limited time
	 * @param {number} time
	 */
	async startTimer(time) {
		await wait(time);
		this.bettingAllowed = false;
		if (this.bets.length < 2) {
			LeagueBetting.cancelBetting(this);
			const message = `Betting on **${this.summonerName}** canceled - not enough bets were sent!`;
			LeagueBetting.client.channels.cache.get(this.channelId).send(message);
			console.log(message);
		}
	}
}

/**
 * Singleton used to process betting system
 * This struct allows betting on player's death
 */
const LeagueBetting = {
	// <id, credits>
	gamblers: new Map(),
	// [BettingEntry]
	liveBets: [],
	container: null,
	client: null,

	/**
	 * Singleton constructor
	 * @param {ClientExtended} client
	 * @param {number} credits
	 */
	constructor: function(client) {
		this.client = client;
	},

	/**
	 * Add a member to gamblers list
	 * @param {GuildMember} gambler
	 */
	addGambler: async function(gambler) {
		this.gamblers.set(gambler.id, this.initialCredits);

		await GuildDataManager.writeMapToFile(LeagueBetting.gamblers, this.client.gambleConfig.fileGamblersPath);
		await Azure.uploadBlob(this.client.vars.CONTAINER_DATA, this.client.gambleConfig.fileGamblersPath, true);
	},

	/**
	 *
	 * @param {string} gambler
	 */
	getGamblerCredits: function(gamblerId) {
		const result = this.gamblers.get(gamblerId);
		return result;
	},

	/**
	 * Update betting data
	 */
	uploadGamblersToAzure: async function() {
		await GuildDataManager.writeMapToFile(LeagueBetting.gamblers, this.client.gambleConfig.fileGamblersPath);
		await Azure.uploadBlob(this.client.vars.CONTAINER_DATA, this.client.gambleConfig.fileGamblersPath, true);
		console.log('Betters list updated.');
	},

	/**
	 *
	 * @param {GuildMember} gambler
	 * @param {number} betValue
	 * @param {string} targetSummoner
	 * @param {number} minute
	 */
	addBetToJackpot: function(gambler, betValue, targetSummoner, minute) {
		let message = 'Betting not found!';
		let summonerName = null;

		for (const liveBet of this.liveBets) {
			if (liveBet.summonerName.toLowerCase() == targetSummoner.toLowerCase() && liveBet.isActive) {
				const gamblerCredits = this.getGamblerCredits(gambler.id);
				summonerName = liveBet.summonerName;

				// Check if gambler is registered
				if (gamblerCredits == undefined) {
					message = 'Not yet registered!';
					return message;
				}
				// Check if gambler has enough credits
				if (gamblerCredits < betValue) {
					message = 'Not enough credits!';
					return message;
				}

				// check if gambler already put a bet
				for (const bet of liveBet.bets) {
					if (bet.gamblerId == gambler.id) {
						message = 'Already sent a bet!';
						return message;
					}
				}

				// check if bets are accepted
				if (!liveBet.bettingAllowed) {
					message = 'Bets no longer accepted!';
					return message;
				}

				// Send a bet
				this.gamblers.set(gambler.id, gamblerCredits - betValue);
				liveBet.jackpot += betValue;

				const bet = {
					gamblerId: gambler.id,
					gamblerName: gambler.displayName,
					value: betValue,
					minute: minute.toFixed(2),
				};
				liveBet.bets.push(bet);

				message = `**${gambler.displayName}** bets **${betValue}** credits, that **${summonerName}** will die in **${bet.minute}** minute.`;


			}
		}

		return message;
	},

	/**
	 * Return bet for single gambler
	 * @param {BettingEntry} liveBet
	 */
	cancelBetting: function(liveBet) {
		liveBet.isActive = false;
		if (liveBet.bets.length == 1) {
			const gambler = liveBet.bets[0];
			const credits = this.getGamblerCredits(gambler.id) + gambler.betValue;
			this.gamblers.set(credits);
			this.uploadGamblersToAzure();
		}
	},

	/**
     * @todo Start new betting event
     * @param {string} summonerName
     * @param {string} channelId
     */
	startBetting: async function(summonerName, channelId) {
		console.log('Started Betting for: ', summonerName);

		const newBetting = new BettingEntry(summonerName, channelId, this.client.gambleConfig.timeLimit);
		this.liveBets.push(newBetting);
	},

	/**
	 *
	 * @param {string} targetSummoner
	 * @param {number} minute
	 * @returns
	 */
	endBetting: function(targetSummoner, deathMinute) {
		let message = null;
		for (const liveBet of this.liveBets) {
			// Find betting
			if (liveBet.summonerName == targetSummoner && liveBet.isActive) {
				liveBet.isActive = false;

				if (deathMinute == -1) {
					message = `Pog, ${targetSummoner} didn't die! Everyone lost!`;
					return message;
				}

				if (liveBet.bets.length < 2) {
					message = `**${targetSummoner}** died in **${deathMinute}** minute but not enough bets were sent!`;
					this.cancelBetting(liveBet);
				}
				message = `**${targetSummoner}** died in **${deathMinute}** minute!`;

				// Find winners
				let winners = '\n????__**Winners:????**__\t';
				let losers = '\n__**????Losers:????**__\t';

				for (const entry of liveBet.bets) {
					const multiplier = -(2 * Math.log(Math.abs(entry.minute - deathMinute)) + 1.5);
					const prize = Math.floor(entry.value * multiplier);
					const newCredits = this.gamblers.get(entry.gamblerId) + prize;
					this.gamblers.set(entry.gamblerId, newCredits);
					if (multiplier > 1) {
						winners += ` ** ${entry.gamblerName}** - ${prize}cr,`;
					}
					else {
						losers += ` ** ${entry.gamblerName}** - ${prize}cr,`;
					}
				}
				this.uploadGamblersToAzure(liveBet);
				this.logBetting(liveBet);
				message = winners + losers;
				break;
			}
		}

		if (message == null) {
			message = 'Something went wrong in endBetting!';
		}
		return message;
	},

	logBetting: function(liveBet) {
		const fs = require('fs');
		let row = `${liveBet.summonerName};`;
		for (const entry of liveBet.bets) {
			row += `${entry.gamblerName};${entry.value};${entry.minute};`;
		}
		row += '\n';

		fs.appendFile(this.client.gambleConfig.fileHistoryPath, row, function(err) {
			if (err) throw err;
			console.log('Saved log: ', row);
		});

		Azure.uploadBlob(this.client.vars.CONTAINER_DATA, this.client.gambleConfig.fileHistoryPath, true);
	},

};

module.exports = LeagueBetting;
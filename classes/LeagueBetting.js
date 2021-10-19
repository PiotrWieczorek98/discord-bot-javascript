// eslint-disable-next-line no-unused-vars
const { GuildMember, Interaction } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');
const Azure = require('./Azure');
const GuildDataManager = require('./GuildDataManager');
const ordinalSuffixOf = require('../helpers/ordinalSuffixOf');
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
	constructor(summonerName, channelId) {
		this.summonerName = summonerName;
		this.isActive = true;
		this.bettingAllowed = true;
		this.jackpot = 0;
		this.bets = [];
		this.channelId = channelId;
		this.startTimer(60000);
	}

	async startTimer(time) {
		await wait(time);
		this.bettingAllowed = false;
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
	initialCredits: null,
	fileGamblersPath: null,
	fileHistoryPath: null,
	container: null,
	client: null,

	/**
	 * Singleton constructor
	 * @param {ClientExtended} client
	 * @param {number} credits
	 */
	constructor: function(client, credits) {
		this.fileGamblersPath = `${client.paths.DATA}/${client.vars.FILE_GAMBLERS}`;
		this.fileHistoryPath = `${client.paths.DATA}/${client.vars.FILE_BETS}`;
		this.container = client.vars.CONTAINER_DATA;
		this.initialCredits = credits;
	},

	/**
	 * Add a member to gamblers list
	 * @param {GuildMember} gambler
	 */
	addGambler: async function(gambler) {
		this.gamblers.set(gambler.id, this.initialCredits);

		await GuildDataManager.writeMapToFile(LeagueBetting.gamblers, this.fileGamblersPath);
		await Azure.uploadBlob(this.container, this.fileGamblersPath, true);
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
		await GuildDataManager.writeMapToFile(LeagueBetting.gamblers, this.fileGamblersPath);
		await Azure.uploadBlob(this.container, this.fileGamblersPath, true);
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

		for (const liveBet of this.liveBets) {
			if (liveBet.summonerName == targetSummoner && liveBet.isActive) {
				const gamblerCredits = this.getGamblerCredits(gambler.id);

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
					minute: minute,
				};
				liveBet.bets.push(bet);

				message = `**${gambler.displayName}** bets **${betValue}** credits, that **${targetSummoner}** will die in **${ordinalSuffixOf(minute)}** minute.`;


			}
		}

		return message;
	},

	/**
     * @todo Odpalenie betowania
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
	 * @param {string} targetSummoner
	 * @param {number} minute
	 * @returns
	 */
	endBetting: function(targetSummoner, deathMinute) {
		let message = 'Something went wrong in endBetting!';
		for (const liveBet of this.liveBets) {
			// Find betting
			if (liveBet.summonerName == targetSummoner && liveBet.isActive) {
				liveBet.isActive = false;

				if (deathMinute == 0) {
					message = `Pog, ${targetSummoner} didn't die! Everyone lost!`;
					return message;
				}

				if (liveBet.bets.length < 2) {
					message = `**${targetSummoner}** died in **${ordinalSuffixOf(deathMinute)}** minute but not enough bets were sent!`;
					// Return bet for single gambler
					if (liveBet.bets.length == 1) {
						const gambler = liveBet.bets[0];
						const credits = this.getGamblerCredits(gambler.id) + gambler.betValue;
						this.gamblers.set(credits);
						this.uploadGamblersToAzure();
					}
					return message;
				}
				message = `**${targetSummoner}** died in **${ordinalSuffixOf(deathMinute)}** minute!`;

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
					else if (Math.abs(entry.minute - deathMinute) == Math.abs(winners[0].minute - deathMinute)) {
						winners.push(entry);
					}
					else {
						losers.push(entry);
					}
				}

				// Calculate prize
				// let denominator = 0;
				// for (const winner of winners) {
				// 	denominator += winner.value;
				// }

				// Give prize
				message += '\n💰__**Winners:💰**__\t';
				for (const winner of winners) {
					// const multiplier = winner.value / denominator;
					// const prize = Math.ceil(liveBet.jackpot * multiplier);
					const prize = winner.value;
					const newCredits = this.gamblers.get(winner.gamblerId) + prize;
					this.gamblers.set(winner.gamblerId, newCredits);
					message += ` ** ${winner.gamblerName}** - ${prize},`;
				}

				message += '\n__**🐵Losers:🐵**__\t';
				for (const loser of losers) {
					message += ` ** ${loser.gamblerName}** - ${loser.value},`;
				}

				this.uploadGamblersToAzure(liveBet);
				this.logBetting(liveBet);
				break;
			}
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

		fs.appendFile(this.fileHistoryPath, row, function(err) {
			if (err) throw err;
			console.log('Saved log: ', row);
		});

		Azure.uploadBlob(this.container, this.fileHistoryPath, true);
	},

};

module.exports = LeagueBetting;
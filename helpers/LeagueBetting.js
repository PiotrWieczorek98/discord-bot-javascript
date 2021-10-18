const { GuildMember, Interaction } = require('discord.js');
const express = require('express');
const Azure = require('./Azure');
const ClientExtended = require('./ClientExtended');
const GuildDataManager = require('./GuildDataManager');
const ordinalSuffixOf = require('./ordinalSuffixOf');
const { MessageEmbed } = require('discord.js');
const wait = require('./wait');

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

	app: express(),
	// <id, credits>
	gamblers: new Map(),
	// [BettingEntry]
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
	 * Add a member to gamblers list
	 * @param {GuildMember} gambler
	 */
	addGambler: async function(gambler) {
		this.gamblers.set(gambler.id, this.initialCredits);

		await GuildDataManager.writeMapToFile(LeagueBetting.gamblers, this.filePath);
		await Azure.uploadBlob(this.container, this.filePath, undefined, true);
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
	 * @param {{}} gamblers
	 */
	updateGamblers: async function() {
		await GuildDataManager.writeMapToFile(LeagueBetting.gamblers, this.filePath);
		await Azure.uploadBlob(this.container, this.filePath, undefined, true);
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
						this.updateGamblers();
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

				this.updateGamblers();
				break;
			}
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

			const bettingEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`💸 Betting for ${summoner}'s death! 💸`)
				.setDescription('Use /bet to enter the gamble!')
				.setThumbnail('https://i.imgur.com/qpIocsj.png')
				.setTimestamp()
				.setFooter('Not worth it...', 'https://i.imgur.com/L8gH1y8.png');

			// Avoid duplicate
			let foundDuplicate = false;
			for (const entry of this.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					foundDuplicate = true;
				}
			}

			if (!foundDuplicate) {
				this.startBetting(summoner, channelId);
				console.log('Received /game_started request for ', summoner);
				// SEND CHANNEL MESSAGE
				this.client.channels.cache.get(channelId).send({ embeds: [bettingEmbed] });
			}
			else {
				console.log('Received duplicate /game_started request for ', summoner);
			}

			res.send({ status: 'ok' });

		});

		this.app.post('/death', (req, res) => {
			let message = 'Something went wrong!';
			const data = req.body;
			const summoner = data.VictimName;

			let foundBetting = false;
			for (const entry of this.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					foundBetting = true;
					const time = parseInt(data.EventTime);
					const minute = Math.ceil(time / 60);
					message = this.endBetting(summoner, minute);

					// SEND CHANNEL MESSAGE
					const bettingEmbed = new MessageEmbed()
						.setColor('#0099ff')
						.setTitle(`💸 ${summoner}  died! 💸`)
						.setDescription(message)
						.setThumbnail('https://i.imgur.com/qpIocsj.png')
						.setTimestamp()
						.setFooter('Not worth it...', 'https://i.imgur.com/L8gH1y8.png');
					this.client.channels.cache.get(entry.channelId).send({ embeds: [bettingEmbed] });
					break;
				}
			}

			if (!foundBetting) {
				message = `Received false /death request for ${summoner}`;
			}

			console.log(message);
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
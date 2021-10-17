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

		for (const liveBet in this.liveBets) {
			if (liveBet.summonerName == targetSummoner && liveBet.isActive == true) {
				const betterCredits = this.betters.get(better.id);

				// Check credit account
				if (betterCredits < betValue) {
					message = 'Not enough credits!';
				}
				else {
					this.betters.set(better.id, betterCredits - betValue);
					liveBet.jackpot += betValue;

					const bet = {
						betterId: better.id,
						betterName: better.displayName,
						value: betValue,
						minute: minute,
					};
					liveBet.bets.push(bet);

					message = `**${better.displayName}** bets **${betValue}**, that **${targetSummoner}** will die in **${minute}** minute.`;
				}

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

		for (const liveBet in this.liveBets) {
			// Find betting
			if (liveBet.summonerName == targetSummoner && !liveBet.isActive) {
				liveBet.isActive = false;

				if (liveBet.bets.length == 0) {
					message = 'No bets sent!';
					return message;
				}


				// Find winners
				let winners = [this.liveBets.bets[0]];
				const losers = [];
				for (const entry in this.liveBets.bets) {
					if (Math.abs(entry.minute - deathMinute) < Math.abs(winners[0].minute - deathMinute)) {

						for (const nowLoser in winners) {
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
				for (const winner in winners) {
					denominator += winner.value;
				}

				// Give prize
				message = '**Winners:**';
				for (const winner in winners) {
					const multiplier = winner.value / denominator;
					const prize = liveBet.jackpot * multiplier;
					const newCredits = this.betters.get(winner.betterId) + prize;
					this.betters.set(winner.betterId, newCredits);
					message += ` ${winner.betterName}, won ${prize},`;
				}

				message += '**\nLosers:**';
				for (const loser in losers) {
					message += ` ${loser.betterName}, lost ${loser.value},`;
				}

				this.updateBetters();

			}
			break;
		}

		return message;
	},

	/**
     *
     * @param {number} port
     */
	setListener: async function(port) {

		this.app.post('/game_started', (req, res) => {
			const data = JSON.parse(req.body);
			const summoner = data.SummonerName;
			const channelId = data.ChannelId;

			this.startBetting(summoner, channelId);

			const message = `Started betting for: **${summoner}**`;
			console.log('Received /game_started request for ', summoner);

			// SEND CHANNEL MESSAGE
			this.client.channels.cache.get(channelId).send(message);

			res.send({ status: 'ok' });

		});

		this.app.post('/death', (req, res) => {
			const data = JSON.parse(req.body);
			const summoner = data.VictimName;

			for (const entry in this.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					const time = parseInt(data.EventTime);
					const minute = Math.ceil(time / 60);
					const message = this.endBetting(summoner, minute);

					// SEND CHANNEL MESSAGE
					this.client.channels.cache.get(entry.channelId).send(message);
				}
			}

			console.log('Received /death request for ', summoner);
			res.send({ status: 'ok' });

		});

		this.app.post('/game_ended', (req, res) => {
			const data = JSON.parse(req.body);
			const summoner = data.VictimName;

			for (const entry in this.liveBets) {
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
			const data = JSON.parse(req.body);

			console.log('Received /ping request for ', data);
			res.send(data);
		});

		const listeningPort = process.env.PORT || port;
		this.app.listen(listeningPort, () => console.log('Listening on port: ', listeningPort));
	},

};

module.exports = LeagueBetting;
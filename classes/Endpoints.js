const { MessageEmbed } = require('discord.js');
const LeagueBetting = require('./LeagueBetting');
const express = require('express');
// eslint-disable-next-line no-unused-vars
const ClientExtended = require('./ClientExtended');

const Endpoints = {

	// ------------------------------------------------------------------------------------
	// Web http endpoints
	// ------------------------------------------------------------------------------------

	app: express(),
	client: null,

	/**
	 * Initialize gambling system
	 * @param {ClientExtended} client
	 */
	constructor: function(client) {
		this.app.use(express.json());
		this.client = client;
		Endpoints.setListener(client.gambleConfig.port);
	},
	/**
     * React to web requests
     * @param {number} port
     */
	setListener: async function(port) {

		this.app.post('/game_started', (req, res) => {
			const data = req.body;
			const summonerName = data.SummonerName;
			const channelId = data.ChannelId;

			const bettingEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`💸 Betting for ${summonerName}'s death! 💸`)
				.setDescription('Use /bet to enter the gamble!')
				.setThumbnail('https://i.imgur.com/qpIocsj.png')
				.setTimestamp()
				.setFooter('Not worth it...', 'https://i.imgur.com/L8gH1y8.png');

			// Avoid duplicate
			let foundDuplicate = false;
			for (const entry of LeagueBetting.liveBets) {
				if (entry.summonerName == summonerName && entry.isActive) {
					foundDuplicate = true;
				}
			}

			if (!foundDuplicate) {
				LeagueBetting.startBetting(summonerName, channelId);
				console.log('Received /game_started request for ', summonerName);
				// SEND CHANNEL MESSAGE
				this.client.channels.cache.get(channelId).send({ embeds: [bettingEmbed] });
			}
			else {
				console.log('Received duplicate /game_started request for ', summonerName);
			}

			res.send({ status: 'ok' });

		});

		this.app.post('/death', (req, res) => {
			let message = 'Something went wrong!';
			const data = req.body;
			const summonerName = data.VictimName;

			let foundBetting = false;
			for (const entry of LeagueBetting.liveBets) {
				if (entry.summonerName == summonerName && entry.isActive) {
					foundBetting = true;
					const time = parseInt(data.EventTime);
					const minute = (time / 60).toFixed(2);
					message = LeagueBetting.endBetting(summonerName, minute);

					// SEND CHANNEL MESSAGE
					const bettingEmbed = new MessageEmbed()
						.setColor('#0099ff')
						.setTitle(`💸 ${summonerName}  died! 💸`)
						.setDescription(message)
						.setThumbnail('https://i.imgur.com/qpIocsj.png')
						.setTimestamp()
						.setFooter('Not worth it...', 'https://i.imgur.com/L8gH1y8.png');
					this.client.channels.cache.get(entry.channelId).send({ embeds: [bettingEmbed] });
					break;
				}
			}

			if (!foundBetting) {
				message = `Received false /death request for ${summonerName}`;
			}

			console.log(message);
			res.send({ status: 'ok' });

		});

		this.app.post('/game_ended', (req, res) => {
			const data = req.body;
			const summonerName = data.VictimName;

			for (const entry of LeagueBetting.liveBets) {
				if (entry.summonerName == summonerName && entry.isActive) {
					const message = LeagueBetting.endBetting(summonerName, -1);

					// SEND CHANNEL MESSAGE
					this.client.channels.cache.get(entry.channelId).send(message);
				}
			}

			console.log('Received /death request for ', summonerName);
			res.send({ status: 'ok' });
		});

		this.app.get('/ping', (req, res) => {
			let data = req.body;
			data ??= { status: 'ok' };

			console.log('Received /ping request for ', data);
			res.send(data);
		});

		const listeningPort = process.env.PORT || port;
		this.app.listen(listeningPort, () => {
			const wakeUpDyno = require('../helpers/wakeUpDyno');
			const DYNO_URL = 'https://discord-js-boi-bot.herokuapp.com/ping';

			wakeUpDyno(DYNO_URL);
			console.log('Listening on port: ', listeningPort);
		});
	},
};

module.exports = Endpoints;
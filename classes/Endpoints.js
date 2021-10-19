const { MessageEmbed } = require('discord.js');
const LeagueBetting = require('./LeagueBetting');
const express = require('express');

const Endpoints = {

	// ------------------------------------------------------------------------------------
	// Web http endpoints
	// ------------------------------------------------------------------------------------

	app: express(),
	client: null,

	constructor: function(client) {
		this.app.use(express.json());
		this.client = client;
	},
	/**
     * React to web requests
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
			for (const entry of LeagueBetting.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					foundDuplicate = true;
				}
			}

			if (!foundDuplicate) {
				LeagueBetting.startBetting(summoner, channelId);
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
			for (const entry of LeagueBetting.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					foundBetting = true;
					const time = parseInt(data.EventTime);
					const minute = Math.ceil(time / 60);
					message = LeagueBetting.endBetting(summoner, minute);

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

			for (const entry of LeagueBetting.liveBets) {
				if (entry.summonerName == summoner && entry.isActive) {
					const message = LeagueBetting.endBetting(summoner, 0);

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

module.exports = Endpoints;
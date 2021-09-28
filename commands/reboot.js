const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const Heroku = require('heroku-client');
const { envs } = require('../helpers/env-vars.js');

// --------------------------------------------------------------------
// Restarts Heroku dyno
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reboot')
		.setDescription('Restart the bot'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const message = 'Rebooting...';
		await interaction.reply(message);
		console.log(`Guild ${interaction.guild.id}: ${message}`);
		const heroku = new Heroku({ token: envs.HEROKU_API_TOKEN });
		heroku.delete(`/apps/${interaction.client.vars.HEROKU_APP}/dynos/${interaction.client.vars.HEROKU_DINO}`);
	},
};

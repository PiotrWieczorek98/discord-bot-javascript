const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('List of songs in queue.'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);
		let message = null;
		if (!guildQueue) {
			message = 'There is nothing playing.';
			await interaction.reply(message);
			console.log(message);
		}
		else {
			message = '**Queue:**\n';
			let i = 0;
			for (const song of guildQueue.songs) {
				i += 1;
				message += `${i}. ${song.title}\n`;
			}
			message += `\n**Now playing:** ${guildQueue.songs[0].title}`;
			await interaction.reply(message);
			console.log(message);
		}
	},
};

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Sounds list'),
	async execute(interaction) {
		let soundList = null;
		for (const entry of interaction.client.globalSoundList) {
			if (entry.guildId == interaction.guildId) {
				soundList = entry.soundList;
			}
		}
		await interaction.reply('The Boys proudly presents...\n');

		let message = '```css\n[Sound List:]\n';

		for (const entry of soundList) {
			const newLine = `${entry[0]}. ${entry[1]}\n`;
			// Split messages due to char limit
			if (message.length + newLine.length < 2000) {
				message += newLine;
			}
			else {
				message += '```';
				await interaction.channel.send(message);
				message = '```css\n';
			}
		}

		message += '```';
		await interaction.channel.send(message);
	},
};

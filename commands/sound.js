const { SlashCommandBuilder } = require('@discordjs/builders');
const Azure = require('../helpers/azure-storage.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Sounds list')
		.addStringOption(option => option
			.setName('number')
			.setDescription('Number from the list.')
			.setRequired(true)),
	async execute(interaction) {
		const number = interaction.options.getString('number');
		const soundName = interaction.client.soundList.get(number);
		if (!soundName) {
			await interaction.reply('Sike! That\'s a wrooong number!');
			return;
		}

		// Download sound
		const path = '../tmp/';
		Azure.downloadBlob('mp3', path, soundName, 'sound.mp3', 'overwrite');
		await interaction.reply(`▶️ Playing: ${soundName}`);

        

	},
};

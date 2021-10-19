const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');
const Azure = require('../classes/Azure.js');

// --------------------------------------------------------------------
// Delete sound from sound list and Azure
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Delete sound from the list')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Number from the list')
			.setRequired(true)),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		const number = interaction.options.getInteger('number');
		let message = null;

		// Get Guild's sound list
		const guildSoundList = interaction.client.globalSoundList.get(interaction.guildId);
		if (!guildSoundList) {
			message = '❌ Error while getting guild\'s sound list!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
		}

		// Get the sound
		const soundName = guildSoundList.soundList.get(number);
		if (!soundName) {
			message = '❌ Sike! That\'s a wrooong number! 🔥';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${interaction.guild.id}: ${message}`);
			return;
		}

		// Delete from Azure and update
		await Azure.deleteBlob(interaction.guildId, soundName);
		guildSoundList.downloadSounds();

		message = `✅ Deleted ${soundName}`;
		await interaction.reply(message);
		console.log(`Guild ${interaction.guild.id}: ${message}`);
	},
};

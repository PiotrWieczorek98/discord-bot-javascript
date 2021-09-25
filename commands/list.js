const { SlashCommandBuilder } = require('@discordjs/builders');
// eslint-disable-next-line no-unused-vars
const { Interaction } = require('discord.js');

// --------------------------------------------------------------------
// Sends guild's sound list
// --------------------------------------------------------------------

/**
 * Discord's message limit is 2000 characters
 * @param {Interaction} interaction
 * @param {String} message
 * @param {String} newLine
 * @returns
 */
async function checkCharacterLimit(interaction, message, newLine) {
	// Split messages due to char limit
	if (message.length + newLine.length < 2000) {
		message += newLine;
	}
	else {
		message += '```';
		await interaction.channel.send(message);
		message = '```css\n';
	}
	return message;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Sounds list'),
	/**
	 * @param {Interaction} interaction
	 */
	async execute(interaction) {
		let soundList = null;
		for (const entry of interaction.client.globalSoundList) {
			if (entry.guildId == interaction.guildId) {
				soundList = entry.soundList;
			}
		}
		await interaction.reply({ content: '🙉', ephemeral: true });
		console.log(`Sent sound list for ${interaction.guildId}`);

		let message = '```css\n[SOUND LIST:]\n';
		let previousWord = soundList.get(1).split('_')[0];
		for (const entry of soundList) {
			let newLine = `${entry[0]}. ${entry[1]}\n`;
			const nextWord = entry[1].split('_')[0];
			if (previousWord != nextWord) {
				previousWord = nextWord;
				newLine = '\n' + newLine;
			}
			message = await checkCharacterLimit(interaction, message, newLine);
		}

		message += '```';
		await interaction.channel.send(message);
	},
};

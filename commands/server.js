const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Server info'),
	async execute(interaction) {
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: 
		${interaction.guild.memberCount}\nCreated At: ${interaction.guild.createdAt}\n 
		Verification Level: ${interaction.guild.verificationLevel}`);
	},
};

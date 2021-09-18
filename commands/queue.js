const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('List of songs in queue.'),
	async execute(interaction) {
		const guildQueue = interaction.client.globalQueue.get(interaction.member.guild.id);
		if (!guildQueue) {
			await interaction.reply('There is nothing playing.');
		}
		else {
			await interaction.reply(`
            __**Song queue:**__
            ${guildQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
            **Now playing:** ${guildQueue.songs[0].title}
                    `);
		}
	},
};

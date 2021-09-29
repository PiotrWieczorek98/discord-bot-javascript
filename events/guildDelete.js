const DataManager = require('../helpers/GuildDataManager');

// --------------------------------------------------------------------
// When bot leaves guild
// --------------------------------------------------------------------

module.exports = {
	name: 'guildDelete',
	once: false,
	execute(guild) {
		(async () => {
			await DataManager.removeGuild(guild);
			console.log(`Guild: ${guild.id} added!`);
		})();
	},
};
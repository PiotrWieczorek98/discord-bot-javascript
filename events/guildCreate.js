const DataManager = require('../helpers/GuildDataManager');

// --------------------------------------------------------------------
// When bot joins new guild
// --------------------------------------------------------------------

module.exports = {
	name: 'guildCreate',
	once: false,
	execute(guild) {
		(async () => {
			await DataManager.addNewGuild(guild);
			console.log(`Guild: ${guild.id} added!`);
		})();
	},
};
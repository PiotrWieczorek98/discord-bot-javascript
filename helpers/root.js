const path = require('path');
// Get app's root directory
// Example of usage: const root = require('root');
module.exports = (function() {
	return path.dirname(require.main.filename || process.mainModule.filename);
})();


// ---------------------------------------------------------
// Wait ms amount of time
// Example of usage: const wait = require('wait.js');
// await wait(1000);
// ---------------------------------------------------------

const wait = ms => new Promise(res => setTimeout(res, ms));
module.exports = wait;
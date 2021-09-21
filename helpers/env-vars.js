const dotenv = require('dotenv');
const _ = require('lodash');

// Script to get enviormental variables for localhost and heroku
// Example of usage: const { envs } = require('./helpers/env-vars.js');
// envs.ENV_VAR
const result = dotenv.config();
let envs;

if (!('error' in result)) {
	envs = result.parsed;
}
else {
	envs = {};
	_.each(process.env, (value, key) => envs[key] = value);
}
module.exports.envs = envs;

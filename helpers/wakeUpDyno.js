const fetch = require('node-fetch');

const wakeUpDyno = (url, interval = 25, callback) => {
	const milliseconds = interval * 60000;
	setTimeout(() => {

		try {
			console.log('setTimeout called.');
			// HTTP GET request to the dyno's url
			fetch(url).then(() => console.log(`Fetching ${url}.`));
		}
		catch (err) {
			console.log(`Error fetching ${url}: ${err.message} 
            Will try again in ${interval} minutes...`);
		}
		finally {

			try {
				callback();
			}
			catch (e) {
				callback ? console.log('Callback failed: ', e.message) : null;
			}
			finally {
				// eslint-disable-next-line no-unsafe-finally
				return wakeUpDyno(url, interval, callback);
			}

		}

	}, milliseconds);
};

module.exports = wakeUpDyno;
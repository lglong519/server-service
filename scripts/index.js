require('./sign.js');

const schedule = require('node-schedule');
const debug = require('debug')('server:sign');
const moment = require('moment');

function scheduleCronstyle () {
	schedule.scheduleJob('0 15 * * * *', () => {
		debug(`\ncheck mongod status ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
		require('./mongod.js');
	});
}

scheduleCronstyle();

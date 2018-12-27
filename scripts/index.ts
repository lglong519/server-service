require('../modules/Debug').enable('task:*');
const schedule = require('node-schedule');
const debug = require('../modules/Debug').default('task:index');
const mongod = require('./mongod.js');
const reset = require('./reset.js');
const updateLogs = require('./updateLogs.js');
let sign;
try {
	sign = require('./sign.js');
} catch (e) {
	sign = function () {
		debug('sign.js', e);
	};
	sign();
}
debug('tasks started');
function scheduleCronstyle () {
	const rule = new schedule.RecurrenceRule();
	rule.minute = [0, 15, 30, 45];
	schedule.scheduleJob(rule, () => {
		mongod();
	});

	schedule.scheduleJob('10 0 0 * * *', () => {
		updateLogs();
	});

	schedule.scheduleJob('40 0 0 * * *', () => {
		reset();
	});

	schedule.scheduleJob('0 10 * * * *', () => {
		sign();
	});
}

scheduleCronstyle();

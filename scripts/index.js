require('../modules/Debug').enable('task:*');
const schedule = require('node-schedule');
const debug = require('../modules/Debug')('task:index');
const mongod = require('./mongod.js');
const reset = require('./reset.js');
const sign = require('./sign.js');

debug('tasks started');
function scheduleCronstyle () {
	const rule = new schedule.RecurrenceRule();
	rule.minute = [0, 15, 30, 45];
	schedule.scheduleJob(rule, () => {
		mongod();
	});

	schedule.scheduleJob('10 0 0 * * *', () => {
		reset();
	});

	schedule.scheduleJob('0 10 * * * *', () => {
		sign();
	});
}

scheduleCronstyle();

const schedule = require('node-schedule');
const dbs = require('./index');
const debug = require('debug')('server:sign');
const TiebaService = require('../services/TiebaService');
const moment = require('moment');

function scheduleCronstyle () {
	schedule.scheduleJob('0 0 0 * * *', () => {
		debug(`reset all ${moment().format('YYYY-MM-DD HH:mm:SS')}`);
		const db = dbs.service;
		db.model('TiebaAccount').find({}).exec().then(results => {
			results.forEach(account => {
				let tb = new TiebaService({ db, user: account.user });
				tb.tiebaAccount = account;
				tb.resetAll();
			});
		});
	});
	for (let i = 1; i < 24; i++) {
		schedule.scheduleJob(`0 0 ${i} * * *`, () => {
			debug(`sign all ${moment().format('YYYY-MM-DD HH:mm:SS')}`);
			const db = dbs.service;
			db.model('TiebaAccount').find({}).exec().then(results => {
				results.forEach(account => {
					let tb = new TiebaService({ db, user: account.user });
					tb.tiebaAccount = account;
					tb.signAll();
				});
			});
		});
	}
}

scheduleCronstyle();

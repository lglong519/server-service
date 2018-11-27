const schedule = require('node-schedule');
const dbs = require('./connections');
const debug = require('debug')('server:sign');
const TiebaService = require('../services/TiebaService');
const moment = require('moment');

function scheduleCronstyle () {
	schedule.scheduleJob('10 0 0 * * *', () => {
		debug(`\nreset all ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
		require('./reset.js');
	});
	schedule.scheduleJob('0 10 * * * *', () => {
		debug(`\nsign all ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
		const db = dbs.service;
		db.model('Tieba').find({
			active: true,
			void: false,
			status: {
				$ne: 'resolve'
			}
		}).populate('tiebaAccount').sort('sequence').limit(400).exec().then(results => {
			results.forEach(tieba => {
				let tb = new TiebaService({ db });
				tb.tiebaAccount = tieba.tiebaAccount;
				tb.signOne(tieba).catch(err => debug(err));
			});
		}).catch(err => {
			debug(err);
		});
	});
}

scheduleCronstyle();

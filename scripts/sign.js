const schedule = require('node-schedule');
const dbs = require('./index');
const debug = require('debug')('server:sign');
const TiebaService = require('../services/TiebaService');
const moment = require('moment');

function scheduleCronstyle () {
	schedule.scheduleJob('0 0 0 * * *', () => {
		debug(`reset all ${moment().format('YYYY-MM-DD HH:mm:SS')}`);
		const db = dbs.service;
		db.model('Tieba').update(
			{
				active: true,
				void: false,
			},
			{
				status: 'pendding',
				desc: '',
			},
			{ multi: true }
		).catch(err => {
			debug(err);
		});
	});
	for (let i = 1; i < 24; i++) {
		schedule.scheduleJob(`0 0 ${i} * * *`, () => {
			debug(`sign all ${moment().format('YYYY-MM-DD HH:mm:SS')}`);
			const db = dbs.service;
			db.model('Tieba').find({
				active: true,
				void: false,
			}).populate('tiebaAccount').sort('sequence').limit(2000).exec().then(results => {
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
}

scheduleCronstyle();

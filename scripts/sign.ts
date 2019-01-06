const connections = require('./connections');
const debug = require('debug')('task:sign');
const TiebaService = require('../services/TiebaService');
const moment = require('moment');

export = () => {
	debug(`\nsign all ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
	let db;
	connections.then(results => {
		db = results[0].service;
		return db.model('Tieba').find({
			$or: [
				{
					void: false,
					active: true,
					status: {
						$ne: 'resolve'
					}
				},
				{
					status: 'resolve',
					updatedAt: {
						$lt: new Date(`${new Date().toLocaleDateString()} 00:00`)
					},
					void: false,
					active: true,
				}
			]
		}).populate('tiebaAccount').sort('sequence').limit(400).exec();
	}).then(results => {
		results.forEach(tieba => {
			let tb = new TiebaService({ db });
			tb.tiebaAccount = tieba.tiebaAccount;
			tb.signOne(tieba).catch(err => debug(tieba._id, err));
		});
	}).catch(err => {
		debug(err);
	});
};

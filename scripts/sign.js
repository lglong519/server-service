const dbs = require('./connections');
const debug = require('debug')('task:sign');
const TiebaService = require('../services/TiebaService');
const moment = require('moment');

module.exports = () => {
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
			tb.signOne(tieba).catch(err => debug(tieba._id, err));
		});
	}).catch(err => {
		debug(err);
	});
};

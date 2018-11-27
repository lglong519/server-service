const TiebaService = require('../../services/TiebaService');
const restifyMongoose = require('restify-mongoose');
const Joi = require('joi');
const debug = require('debug')('server:tieba');
const Errors = require('restify-errors');

const handler = restifyMongoose('Tieba', {
	pageSize: 10,
	sort: '-cur_score'
});

const insert = (req, res, next) => {

};

const sync = (req, res, next) => {
	let tb = new TiebaService({ db: req.db });
	req.db.model('TiebaAccount').findById(req.params.id).exec().then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_ACCOUNT_NOT_FOUND');
		}
		if (!result.active) {
			throw Error('INVALID_BDUSS');
		}
		tb.tiebaAccount = result;
		tb.getAll();
		res.send(204);
		next();
	}).catch(err => {
		next(err);
	});
};

const sign = (req, res, next) => {
	let tb = new TiebaService({ db: req.db, user: req.session.user });
	req.db.model('Tieba').findById(req.params.id).populate('tiebaAccount').then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_NOT_FOUND');
		}
		tb.tiebaAccount = result.tiebaAccount;
		return tb.signOne(result);
	}).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

const reset = (req, res, next) => {
	req.db.model('TiebaAccount').findById(req.params.id).exec().then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_ACCOUNT_NOT_FOUND');
		}
		if (!result.active) {
			throw Error('INVALID_BDUSS');
		}
		return this.db.model('Tieba').update(
			{
				user: result.user,
				tiebaAccount: result._id,
				active: true,
				void: false,
				status: {
					$ne: 'pendding'
				}
			},
			{
				status: 'pendding',
				desc: '',
			},
			{
				multi: true
			}
		);
	}).then(() => {
		res.send(204);
		next();
	}).catch(err => {
		next(err);
	});
};

module.exports = {
	reset,
	sync,
	sign,
	insert,
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

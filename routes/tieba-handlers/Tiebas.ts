import TiebaService from '../../services/TiebaService';
const restifyMongoose = require('restify-mongoose');
const debug = require('Debug').default('server:tieba');
import * as Joi from 'joi';
import * as Errors from 'restify-errors';

const handler = restifyMongoose('Tieba', {
	pageSize: 10,
	sort: '-cur_score'
});

const insert = (req, res, next) => {
	const schema = Joi.object().keys({
		user: Joi.string().required(),
		tiebaAccount: Joi.string().required(),
		kw: Joi.string().required(),
	}).required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug('insert validate.error', validate.error);
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	const params = validate.value;
	let tb = new TiebaService({ db: req.db });
	req.db.model('TiebaAccount').findById(params.tiebaAccount).exec().then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_ACCOUNT_NOT_FOUND');
		}
		if (!result.active) {
			throw Error('INVALID_BDUSS');
		}
		tb.tiebaAccount = result;
		return tb.getFid(params.kw);
	}).then(result => {
		return req.db.model('Tieba').findOneAndUpdate(
			{
				...result,
				...params
			},
			{},
			{
				upsert: true,
				new: true,
				setDefaultsOnInsert: true
			}
		);
	}).then(() => {
		res.send(204);
		next();
	}).catch(err => {
		next(err);
	});

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
	let tb = new TiebaService({ db: req.db });
	req.db.model('Tieba').findById(req.params.id).populate('tiebaAccount').then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_NOT_FOUND');
		}
		tb.tiebaAccount = result.tiebaAccount;
		return tb.signOne(result, 1);
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
		return req.db.model('Tieba').updateMany(
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
				desc: new Date().toLocaleDateString(),
			}
		);
	}).then(() => {
		res.send(204);
		next();
	}).catch(err => {
		next(err);
	});
};

const resetAll = (req, res, next) => {
	let tb = new TiebaService({ db: req.db });
	tb.resetAll().then(() => {
		res.send(204);
		next();
	}).catch(err => {
		next(err);
	});
};

const summarize = (req, res, next) => {
	let Tieba = req.db.model('Tieba');
	let info: {
		total?: number;
		void?: number;
		pendding?: number;
		resolve?: number;
		reject?: number;
		invalid?: number;
	} = {};
	let query = function () {
		return Tieba.find({});
	};
	Promise.all([
		Tieba.countDocuments({}).then(sum => {
			info.total = sum;
		}),
		query().where({
			void: true,
			active: true,
		}).then(results => {
			info.void = results.length;
		}),
		query().where({
			$or: [
				{
					status: 'pendding',
					void: false,
					active: true,
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
		}).then(results => {
			info.pendding = results.length;
		}),
		query().where({
			updatedAt: {
				$gte: new Date(`${new Date().toLocaleDateString()} 00:00`)
			},
			status: 'resolve',
			void: false,
			active: true,
		}).then(results => {
			info.resolve = results.length;
		}),
		query().where({
			status: 'reject',
			void: false,
			active: true,
		}).then(results => {
			info.reject = results.length;
		}),
		query().where({
			active: false,
		}).then(results => {
			info.invalid = results.length;
		}),
	]).then(() => {
		res.json(info);
	}).catch(err => {
		next(err);
	});
};

export = {
	summarize,
	resetAll,
	reset,
	sync,
	sign,
	insert,
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

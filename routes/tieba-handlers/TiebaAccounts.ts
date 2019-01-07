const restifyMongoose = require('restify-mongoose');
import TiebaService from '../../services/TiebaService';
import * as Joi from 'joi';
const debug = require('debug')('server:tieba');
const Errors = require('restify-errors');
import * as _ from 'lodash';

const handler = restifyMongoose('TiebaAccount', {
	pageSize: 10,
	sort: '-createdAt',
});

const insert = (req, res, next) => {
	const schema = Joi.object().keys({
		BDUSS: Joi.string().required(),
		user: Joi.string().required(),
	}).unknown().required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug(validate.error);
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	let params = validate.value;
	let tb = new TiebaService({ db: req.db });
	tb.init(params.BDUSS, params.user).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

const beforeDelete = (req, model) => {
	return req.db.model('Tieba').remove({
		tiebaAccount: model._id
	});
};

const sign = (req, res, next) => {
	debug('start to sign all');
	let tb = new TiebaService({ db: req.db });
	req.db.model('TiebaAccount').findById(req.params.id).exec().then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_ACCOUNT_NOT_FOUND');
		}
		if (!result.active) {
			throw Error('INVALID_BDUSS');
		}
		tb.tiebaAccount = result;
		return tb.signAll();
	}).then(() => {
		res.json(204);
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
		return Tieba.find({
			tiebaAccount: req.params.id
		});
	};
	Promise.all([
		Tieba.countDocuments({
			tiebaAccount: req.params.id
		}).then(sum => {
			info.total = sum;
		}),
		query().where({
			void: true,
			active: true,
		}).then(results => {
			info.void = results.length;
		}),
		query().where({
			status: 'pendding',
			void: false,
			active: true,
		}).then(results => {
			info.pendding = results.length;
		}),
		query().where({
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

const beforeSave = (req, model, cb) => {
	if (!model.BDUSS) {
		model.active = false;
		return cb();
	}
	let tb = new TiebaService({ db: req.db });
	tb.tiebaAccount = model;
	tb.checkBDUSS().finally(() => {
		cb();
	});
};

const userHandler = restifyMongoose('User', {
	pageSize: 10,
	sort: '-createdAt',
	projection,
	filterAsync (req) {
		return req.db.model('TiebaAccount').find({}).distinct('user').lean().exec().then(users => {
			return {
				_id: {
					$in: users
				}
			};
		});
	}
});

function projection (req, model, cb) {
	let output = {
		accounts: 0,
		tiebas: 0,
	};
	req.db.model('TiebaAccount').countDocuments({
		user: model._id
	}).then(count => {
		output.accounts = count;
		return req.db.model('Tieba').countDocuments({
			user: model._id
		});
	}).then(count => {
		output.tiebas = count;
		cb(null, Object.assign(output, _.pick(model, [
			'_id',
			'inc',
			'username',
			'client',
			'email',
			'phone',
			'image',
			'updatedAt',
			'createdAt'
		])));
	});

}

export = {
	users: userHandler.query(),
	summarize,
	sign,
	insert,
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update({ beforeSave }),
	delete: handler.delete({ beforeDelete }),
};

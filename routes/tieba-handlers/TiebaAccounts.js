const restifyMongoose = require('restify-mongoose');
const TiebaService = require('../../services/TiebaService');
const Joi = require('joi');
const debug = require('debug')('server:tieba');
const Errors = require('restify-errors');

const handler = restifyMongoose('TiebaAccount', {
	pageSize: 10,
	sort: '-createdAt',
});

const insert = (req, res, next) => {
	const schema = Joi.object().keys({
		BDUSS: Joi.string().required(),
	}).unknown().required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug(validate.error);
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	let params = validate.value;
	let tb = new TiebaService({ db: req.db });
	tb.init(params.BDUSS, req.session.user).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

const beforeDelete = (req, model) => {
	return req.db.model('Tieba').remove({
		user: req.session.user,
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
		tb.signAll();
		res.json(204);
		next();
	}).catch(err => {
		next(err);
	});
};

const sumarize = (req, res, next) => {
	let Tieba = req.db.model('Tieba');
	let info = {};
	let query = function () {
		return Tieba.find({
			user: req.session.user,
			tiebaAccount: req.params.id
		});
	};
	Promise.all([
		Tieba.countDocuments({
			user: req.session.user,
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

module.exports = {
	sumarize,
	sign,
	insert,
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update({ beforeSave }),
	delete: handler.delete({ beforeDelete }),
};

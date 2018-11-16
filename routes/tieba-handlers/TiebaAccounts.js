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
		account: Joi.string().required(),
		BDUSS: Joi.string().required(),
	}).unknown().required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug(validate.error);
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	let params = validate.value;
	let tb = new TiebaService(req);
	tb.init(params).then(result => {
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
	let tb = new TiebaService(req);
	req.db.model('TiebaAccount').findById(req.params.id).exec().then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_ACCOUNT_NOT_FOUND');
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
			void: true
		}).then(results => {
			info.void = results.length;
		}),
		query().where({
			status: {
				$in: ['pendding', undefined]
			},
			void: {
				$ne: true
			}
		}).then(results => {
			info.pendding = results.length;
		}),
		query().where({
			status: 'resolve',
			void: {
				$ne: true
			}
		}).then(results => {
			info.resolve = results.length;
		}),
		query().where({
			status: 'reject',
			void: {
				$ne: true
			}
		}).then(results => {
			info.reject = results.length;
		}),
	]).then(() => {
		res.json(info);
	}).catch(err => {
		next(err);
	});
};

module.exports = {
	sumarize,
	sign,
	insert,
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete({ beforeDelete }),
};

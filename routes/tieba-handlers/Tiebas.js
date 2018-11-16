const TiebaService = require('../../services/TiebaService');
const restifyMongoose = require('restify-mongoose');
const Joi = require('joi');
const debug = require('debug')('server:tieba');
const Errors = require('restify-errors');

const handler = restifyMongoose('Tieba', {
	pageSize: 10,
	sort: '-createdAt'
});

const insert = (req, res, next) => {

};

const sync = (req, res, next) => {
	const schema = Joi.object().keys({
		account: Joi.string().required(),
	}).required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug(validate.error);
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	let params = validate.value;

	let tb = new TiebaService(req, params);
	tb.getAccount().then(() => {
		tb.getAll();
		res.send(204);
		next();
	}).catch(err => {
		next(err);
	});

};

const sign = (req, res, next) => {
	let tb = new TiebaService(req);
	let tieba;
	req.db.model('Tieba').findById(req.params.id).populate('tiebaAccount').then(result => {
		if (!result) {
			throw Error('ERR_TIEBA_NOT_FOUND');
		}
		tieba = result;
		tb.account = result.tiebaAccount.account;
		return tb.getAccount();
	}).then(() => {
		return tb.signOne(tieba);
	}).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

module.exports = {
	sync,
	sign,
	insert,
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

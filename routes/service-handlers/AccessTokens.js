const RedisService = require('services/RedisService');
const regExp = require('common/regExp');
const Joi = require('joi');
const Errors = require('restify-errors');
const Model = require('common/Model');

const User = Model('User');
const Log = Model('Log');

const create = (req, res, next) => {
	const schema = Joi.object().keys({
		login: Joi.alternatives().try(
			Joi.string().regex(regExp.account),
			Joi.string().email(),
			Joi.string().regex(regExp.CHNPhone)
		).required(),
		password: Joi.string().regex(regExp.password).required(),
		client: Joi.string().required(),
	}).required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	const params = validate.value;
	const options = {
		password: params.password,
	};

	if (regExp.account.test(params.login)) {
		options.username = params.login;
	} else	if (regExp.CHNPhone.test(params.login)) {
		options.phone = params.login;
	} else {
		options.email = params.login;
	}

	let token;
	User(req).findOneAndUpdate(
		options,
		{
			$inc: { inc: 1 }
		}, {
			new: true
		}
	).exec().then(result => {
		if (!result) {
			throw new Errors.InvalidContentError('USER_NOT_FOUND');
		}
		return RedisService.create({
			user: result._id,
			client: params.client,
			return: 'accessToken'
		});
	}).then(result => {
		token = result;
		return Log(req).create({
			event: 'login',
			model: 'User',
			id: token.user,
			data: params
		});
	}).then(result => {
		res.json(token);
		next();
	}).catch(err => {
		next(err);
	});
};

module.exports = {
	create
};

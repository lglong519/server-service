const RedisService = require('services/RedisService');
const regExp = require('common/regExp');
const Joi = require('joi');
const Errors = require('restify-errors');
const Model = require('common/Model');
const debug = require('debug')('server:api');

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
		client: Joi.string().valid('CNS').required(),
	}).required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug('validate.error', validate.error);
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	const params = validate.value;
	const options: any = {};

	// username 不区分大小写
	if (regExp.account.test(params.login)) {
		options.username = {
			'$regex': `^${params.login}$`,
			'$options': '$i'
		};
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
		if (result.password !== params.password) {
			throw new Errors.InvalidContentError('INVALID_PASSWORD');
		}
		if (result.role != 'admin') {
			throw new Errors.ForbiddenError('NO_PERMISSION');
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
	}).then(() => {
		res.json(token);
		next();
	}).catch(err => {
		debug('AccessTokens create error', err);
		next(err);
	});
};

const remove = (req, res, next) => {
	const { 'x-access-token': accessToken } = req.headers;
	RedisService.remove(accessToken).then(() => {
		res.send(204);
		next();
	}).catch(err => {
		debug('AccessTokens remove error', err);
		next(err);
	});
};

const check = (req, res, next) => {
	const { 'x-access-token': accessToken } = req.headers;
	let payload = {
		code: '2000',
		user: undefined
	};
	RedisService.get(accessToken).then(result => {
		if (result) {
			return User(req).findById(result.user).exec();
		}
		payload.code = '4000';
	}).then(result => {
		if (result) {
			payload.user = result.username;
		}
		res.send(payload);
		next();
	}).catch(err => {
		debug('AccessTokens check error', err);
		next(err);
	});
};
export = {
	create,
	remove,
	check,
};

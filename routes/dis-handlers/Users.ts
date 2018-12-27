const restifyMongoose = require('restify-mongoose');
const _ = require('lodash');
const regExp = require('common/regExp');
const Errors = require('restify-errors');
import * as Joi from 'joi';
const RedisService = require('services/RedisService');

const projection = (req, model, cb) => {
	cb(null, _.pick(model, ['_id', 'inc', 'username', 'client', 'email', 'phone', 'image', 'updatedAt', 'createdAt']));
};

const handler = restifyMongoose('User', {
	filter (req) {
		return {
			user: _.get(req, 'session.user')
		};
	},
	listProjection: projection,
	detailProjection: projection,
});
const insert = (req, res, next) => {
	const schema = Joi.object().keys({
		username: Joi.string().regex(regExp.account).required(),
		email: Joi.string().email().allow('').lowercase(),
		phone: Joi.string().regex(regExp.CHNPhone),
		password: Joi.string().regex(regExp.password).required(),
		client: Joi.string().valid('ACC').default('ACC').required().required(),
	}).unknown().required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	const params = validate.value;
	const User = req.db.model('User');
	User.findOne({
		username: {
			'$regex': `^${params.username}$`,
			'$options': '$i'
		}
	}).exec().then(result => {
		if (result) {
			throw new Errors.InvalidArgumentError('USER_EXISTS');
		}
		params.role = 'user';
		return User.create(params);
	}).then(result => {
		return RedisService.create({
			user: result._id,
			client: params.client,
			return: 'accessToken'
		});
	}).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};
const beforeDelete = (req, model) => {
	if (String(req.session.user) == String(model._id)) {
		return Promise.reject(Error('cannot delete current user'));
	}
	return Promise.resolve();
};

export = {
	insert,
	detail: handler.detail(),
	delete: handler.delete({ beforeDelete }),
};

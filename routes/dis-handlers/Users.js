const restifyMongoose = require('restify-mongoose');
const Joi = require('joi');
const _ = require('lodash');
const regExp = require('common/regExp');
const Errors = require('restify-errors');

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
const beforeSave = (req, model, cb) => {
	const schema = Joi.object().keys({
		username: Joi.string().regex(regExp.account).required(),
		email: Joi.string().email().required(),
		phone: Joi.string().regex(regExp.CHNPhone),
		password: Joi.string().regex(regExp.password).required(),
		client: Joi.string().valid('ACC').default('ACC').required().required(),
	}).unknown().required();
	const validate = Joi.validate(model, schema);
	if (validate.error) {
		return cb(new Errors.InvalidArgumentError(validate.error));
	}
	req.db.model('User').findOne({
		username: {
			'$regex': `^${model.username}$`,
			'$options': '$i'
		}
	}).exec().then(result => {
		if (result) {
			cb(new Errors.InvalidArgumentError('USER_EXISTS'));
		} else {
			model.role = 'user';
			cb();
		}
	}).catch(err => {
		cb(err);
	});
};
const beforeDelete = (req, model) => {
	if (String(req.session.user) == String(model._id)) {
		return Promise.reject(Error('cannot delete current user'));
	}
	return Promise.resolve();
};

module.exports = {
	insert: handler.insert({ beforeSave }),
	detail: handler.detail(),
	delete: handler.delete({ beforeDelete }),
};

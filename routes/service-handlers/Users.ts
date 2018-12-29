const restifyMongoose = require('restify-mongoose');
const Joi = require('joi');
const _ = require('lodash');
const regExp = require('common/regExp');
const Errors = require('restify-errors');
const { Users } = require('../dis-handlers/Users');

const projection = (req, model, cb) => {
	cb(null, _.pick(model, ['_id', 'inc', 'username', 'client', 'email', 'phone', 'image', 'updatedAt', 'createdAt']));
};

const handler = restifyMongoose('User', {
	listProjection: projection,
	detailProjection: projection,
});

const beforeSave = (req, model, cb) => {
	const schema = Joi.object().keys({
		username: Joi.string().regex(regExp.account).required(),
		email: Joi.string().email().required(),
		phone: Joi.string().regex(regExp.CHNPhone),
		password: Joi.string().regex(regExp.password).required(),
		client: Joi.string().required().required(),
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
			cb();
		}
	}).catch(err => {
		cb(err);
	});
};

class Update extends Users {

	constructor () {
		super();
		return <any> ((req, res, next) => {
			const validate = this.validate(req.body);
			if (validate.error) {
				return next(new Errors.InvalidArgumentError(validate.error));
			}
			const params = validate.value;
			this.User = req.db.model('User');
			let user;
			console.log('current id', req.params.id);

			this.User.findById(req.params.id).then(result => {
				if (!result) {
					throw new Errors.InvalidArgumentError('USER_NOT_FOUND');
				}
				user = result;
				return Promise.all([
					this.checkUsername(user._id, params),
					this.checkEmail(user._id, params),
					this.checkPhone(user._id, params),
				]);
			}).then(() => {
				user.set(params);
				return user.save();
			}).then(result => {
				res.json(result);
				next();
			}).catch(err => {
				next(err);
			});
		});
	}
	public validate (body) {
		const schema = Joi.object().keys({
			username: Joi.string().regex(regExp.account),
			client: Joi.string(),
			email: Joi.string().email().allow('').lowercase(),
			phone: Joi.string().regex(regExp.CHNPhone),
			image: Joi.string()
		}).required();
		return Joi.validate(body, schema);
	}

}

const beforeDelete = (req, model) => {
	if (String(req.session.user) == String(model._id)) {
		return Promise.reject(Error('cannot delete current user'));
	}
	return Promise.resolve();
};
export = {
	insert: handler.insert({ beforeSave }),
	query: handler.query(),
	detail: handler.detail(),
	update: new Update(),
	delete: handler.delete({ beforeDelete }),
};

const restifyMongoose = require('restify-mongoose');
import * as _ from 'lodash';
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

class Users {

	User: any;
	constructor () {}
	public main (req, res, next) {

		const validate = this.validate(req.body);
		if (validate.error) {
			return next(new Errors.InvalidArgumentError(validate.error));
		}
		const params = validate.value;
		this.User = req.db.model('User');
		Promise.all([
			this.checkUsername(req.session.user, params),
			this.checkEmail(req.session.user, params),
			this.checkPhone(req.session.user, params),
		]).then(() => {
			params.role = 'user';
			return this.User.create(params);
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
	}
	public validate (body): Joi.ValidationResult<any> {
		const schema = Joi.object().keys({
			username: Joi.string().regex(regExp.account).required(),
			email: Joi.string().email().allow('').lowercase(),
			phone: Joi.string().regex(regExp.CHNPhone),
			password: Joi.string().regex(regExp.password).required(),
			client: Joi.string().valid('ACC').default('ACC').required().required(),
		}).unknown().required();
		return Joi.validate(body, schema);
	}
	public checkUsername (user, params): Promise<any> {
		return this.User.findOne({
			username: {
				'$regex': `^${params.username}$`,
				'$options': '$i'
			}
		}).exec().then(result => {
			this.throwErr(user, result, 'ACCOUNT_IS_USED');
		});
	}
	public checkEmail (user, { email }: {email?: string}): Promise<any> {
		if (!email) {
			return Promise.resolve();
		}
		return this.User.findOne({
			email
		}).exec().then(result => {
			this.throwErr(user, result, 'EMAIL_IS_USED');
		});
	}
	public checkPhone (user, { phone }: {phone?: string}): Promise<any> {
		if (!phone) {
			return Promise.resolve();
		}
		return this.User.findOne({
			phone
		}).exec().then(result => {
			console.log(phone);

			this.throwErr(user, result, 'PHONE_IS_USED');
		});
	}
	private throwErr (user, result, msg) {
		if (result) {
			console.log(user, result._id);

			if (user && String(result._id) == String(user)) {
				return;
			}
			throw new Errors.InvalidArgumentError(msg);
		}
	}

}
const beforeDelete = (req, model) => {
	if (String(req.session.user) == String(model._id)) {
		return Promise.reject(Error('cannot delete current user'));
	}
	return Promise.resolve();
};

class Update extends Users {

	constructor () {
		super();
		return <any>((req, res, next) => {
			const validate = this.validate(req.body);
			if (validate.error) {
				return next(new Errors.InvalidArgumentError(validate.error));
			}
			const params = validate.value;
			this.User = req.db.model('User');
			Promise.all([
				super.checkEmail.call(this, req.session.user, params),
				super.checkPhone.call(this, req.session.user, params),
			]).then(() => {
				return this.User.findByIdAndUpdate(req.session.user, params);
			}).then(result => {
				res.json(result);
				next();
			}).catch(err => {
				next(err);
			});
		});

	}
	public validate (body): Joi.ValidationResult<any> {
		const schema = Joi.object().keys({
			email: Joi.string().email().allow('').lowercase(),
			phone: Joi.string().regex(regExp.CHNPhone),
			image: Joi.string()
		}).required();
		return Joi.validate(body, schema);
	}

}

const users = new Users();
export = {
	Users,
	insert: users.main.bind(users),
	detail: handler.detail(),
	update: new Update(),
	delete: handler.delete({ beforeDelete }),
};

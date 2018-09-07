const restifyMongoose = require('restify-mongoose');
const Joi = require('joi');
const regExp = require('common/regExp');
const Errors = require('restify-errors');

const handler = restifyMongoose('User');
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
	cb();
};
module.exports = {
	insert: handler.insert({ beforeSave }),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

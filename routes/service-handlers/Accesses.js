const restifyMongoose = require('common/restify-mongoose');
const Model = require('common/Model');
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment');

const Errors = require('restify-errors');

const Access = Model('Access');

const insert = (req, res, next) => {
	const schema = Joi.object().keys({
		action: Joi.string().required(),
		ip: Joi.string().required(),
		resource: Joi.string().required(),
		host: Joi.string().required(),
	}).unknown().required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		return next(new Errors.InvalidArgumentError(validate.error));
	}
	let params = validate.value;
	Access(req).findOneAndUpdate({
		action: params.action,
		ip: params.ip,
		host: params.host,
	}, {
		$inc: { inc: 1 }
	}, {
		new: true
	}).exec().then(result => {
		let options = _.omit(params, ['resources', 'referers', 'clients', 'inc']);
		if (result) {
			result.set(options);
		} else {
			result = Access(req)(options);
		}
		result.client = params.client.slice(0, 20);
		let now = moment().format('YYYY-MM-DD HH:mm:SS');
		processArr(params.resource, result.resources, now);
		processArr(params.referer, result.referers, now);
		processArr(params.client, result.clients, now);
		return result.save();
	}).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

function processArr (item, items, now) {
	if (item) {
		if (items.indexOf(item) < 0) {
			items.push(item);
			items.push(now);
		}
	}
}

module.exports = {
	insert
};

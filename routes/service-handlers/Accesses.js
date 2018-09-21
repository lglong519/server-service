const restifyMongoose = require('restify-mongoose');
const Model = require('common/Model');
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('server:api');
const Errors = require('restify-errors');
const getClient = require('common/getClient');

const Access = Model('Access');

const insert = (req, res, next) => {
	const schema = Joi.object().keys({
		action: Joi.string().required(),
		ip: Joi.string().required(),
		resource: Joi.string().required(),
		host: Joi.string(),
		client: Joi.string().default(''),
	}).unknown().required();
	const validate = Joi.validate(req.body, schema);
	if (validate.error) {
		debug(req.body);
		debug('validate.error', validate.error);
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
		let options = _.omit(params, ['resources', 'referers', 'clients', 'bodies', 'inc']);
		if (result) {
			result.set(options);
		} else {
			result = Access(req)(options);
		}
		result.client = getClient(params.client);
		let now = moment().format('YYYY-MM-DD HH:mm:SS');
		processArr(result, 'resources', params.resource, now);
		processArr(result, 'referers', params.referer, now);
		processArr(result, 'clients', params.client, now);
		processArr(result, 'bodies', params.body, now);
		return result.save();
	}).then(result => {
		req.query.return === 'true' ? res.json(result) : res.send(204);
		next();
	}).catch(err => {
		debug(req.body);
		debug('Access insert error', err);
		next(err);
	});
};

function processArr (data, items, item, now) {
	if (item) {
		if (typeof item === 'object' && Object.keys(item) < 1) {
			return;
		}
		if (!_.isEmpty(data[items])) {
			if (data[items].indexOf(item) < 0) {
				data[items].push(item);
				data[items].push(now);
			}
		} else {
			data[items] = [item, now];
		}
		let _tmp = [...data[items]];
		data[items] = undefined;
		data[items] = _tmp;
	}
}

module.exports = {
	insert
};

const restifyMongoose = require('restify-mongoose');
const Model = require('common/Model');
import * as Joi from 'joi';
import * as _ from 'lodash';
import * as moment from 'moment';
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

	let options = _.omit(params, ['resources', 'referers', 'clients', 'bodies', 'inc']);

	let access = Access(req)(options);
	access.client = getClient(params.client);
	let now = moment().format('YYYY-MM-DD HH:mm:SS');
	processArr(access, 'clients', params.client, now);
	access.save().then(result => {
		req.query.return === '1' ? res.json(result) : res.send(204);
		next();
	}).catch(err => {
		debug(req.body);
		debug('Access insert error', err);
		next(err);
	});
};

function processArr (data, items, item, now) {
	if (item) {
		if (typeof item === 'object' && Object.keys(item).length < 1) {
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

const handle = restifyMongoose('Access', {
	pageSize: 10,
	sort: '-updatedAt'
});

export = {
	insert,
	query: handle.query(),
	get (req, res, next) {
		res.send(204);
		next();
	},
};

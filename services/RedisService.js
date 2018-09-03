const Redis = require('ioredis');
const Joi = require('joi');
const RandToken = require('rand-token');
const _ = require('lodash');
const nconf = require('nconf');

nconf.required([
	'REDIS_URI',
	'REDIS_EXPIRE_SECONDS'
]);

const client = new Redis(nconf.get('REDIS_URI'));

/**
 * @description
 * @param {Object} values
 * @param {String} [id] 唯一凭证，默认:随机生成
 * @param {String} [return] 返回的凭证名称，默认：id
 * @param {Object} options 选项
 * @param {Object} type 类型：[default,a-z,alpha,A-Z,ALPHA,0-9,numeric,base32]
 * @param {Object} length 长度，默认：9
 * @return {Object} {id:PQ78OmsAsz,num: 9527} or {key:PQ78OmsAsz,num: 9527}
 */
const create = (values, options) => {
	const schema = Joi.object().min(1).required();
	const defaultOptions = {
		type: 'default',
		length: 13,
		expire: nconf.get('REDIS_EXPIRE_SECONDS')
	};
	options = Object.assign(defaultOptions, options);
	const rand = RandToken.generator({
		chars: options.type
	});

	if (!values.id) {
		values.id = rand.generate(options.length);
	}
	let doc = _.omit(values, ['id', 'return']);
	if (values.return) {
		doc[values.return] = values.id;
	} else {
		doc.id = values.id;
	}
	schema.validate(doc, (err, value) => {
		if (err) {
			throw err;
		}
	});
	return client.multi().hmset(values.id, doc).expire(values.id, options.expire).hgetall(values.id).exec().then(result => {
		return _.get(result, '[2][1]');
	}).catch(err => {
		console.error('RedisService create', err);
	});
};

const get = key => {
	return client.hgetall(key).then(result => {
		return result;
	}).catch(err => {
		console.error('RedisService get', err);
	});
};

module.exports = {
	create,
	get
};

const Redis = require('ioredis');
const Joi = require('joi');
const RandToken = require('rand-token');
const _ = require('lodash');
const nconf = require('nconf');
const debug = require('debug');
const DateTime = require('../common/dateTime');
const debugErr = debug('server:redis');

nconf.required([
	'REDIS_URI',
	'REDIS_EXPIRE_SECONDS'
]);

const client = new Redis(nconf.get('REDIS_URI'));
const expire = nconf.get('REDIS_EXPIRE_SECONDS');

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
		expire
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
	const expireAt = new DateTime().offsetInSeconds(options.expire);
	doc.expireAt = expireAt;
	return client.multi().hmset(values.id, doc).expire(values.id, options.expire).hgetall(values.id).exec().then(result => {
		return _.get(result, '[2][1]');
	}).catch(err => {
		debugErr('RedisService create', err);
	});
};

const get = key => {
	return client.hgetall(key).then(result => {
		return result;
	}).catch(err => {
		debugErr('RedisService get', err);
	});
};

const fetch = key => {
	return client.multi().expire(key, expire).hgetall(key).exec().then(result => {
		let doc = _.get(result, '[1][1]');
		if (_.isEmpty(doc)) {
			throw Error('Doc is expired or not found.');
		}
		doc.expireAt = new DateTime().offsetInSeconds(expire);
		return doc;
	}).catch(err => {
		debugErr('RedisService fetch', err);
	});
};

module.exports = {
	create,
	fetch,
	get,
};

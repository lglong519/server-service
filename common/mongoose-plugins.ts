const Joi = require('joi');
const _ = require('lodash');
const nconf = require('nconf');
const crypto = require('crypto');
const ALGORITHM = 'aes-256-cbc';
const MAGIC_PREFIX = 'ENC__';
const CHECK_MAGIC_PREFIX = new RegExp(`^${MAGIC_PREFIX}`);
const debug = require('debug')('server:mongoose-plugins');

nconf.required(['ENC_KEY']);

const encrypt = (str, key, checkPrefix = false) => {
	if (checkPrefix && CHECK_MAGIC_PREFIX.test(str)) {
		return str;
	}
	const cipher = crypto.createCipher(ALGORITHM, key);
	let encrypted = cipher.update(str, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return checkPrefix ? MAGIC_PREFIX + encrypted : encrypted;
};
const decrypt = (str, key, checkPrefix = false) => {
	if (checkPrefix && !CHECK_MAGIC_PREFIX.test(str)) {
		return str;
	}
	let prefixLength = checkPrefix ? MAGIC_PREFIX.length : 0;
	const decipher = crypto.createDecipher(ALGORITHM, key);
	let decrypted;
	try {
		decrypted = decipher.update(str.slice(prefixLength), 'hex', 'utf8');
		decrypted += decipher.final('utf8');
	} catch (e) {
		debug(_.get(e, 'message') || 'UNKNOWN ERROR');
		decrypted = _.get(e, 'message') || 'UNKNOWN ERROR';
	}
	return decrypted;
};

const encryptPlugin = (schema, options) => {
	const paths = options.paths;
	const key = options.key || nconf.get('ENC_KEY');
	const Joi_schema = Joi.object().keys({
		key: Joi.string().required(),
		paths: Joi.array().items(Joi.string()),
	});
	Joi.validate({ paths, key }, Joi_schema, (err, value) => {
		if (err) {
			throw err;
		}
	});
	const setter = rawValue => {
		if (!rawValue) {
			return rawValue;
		}
		return encrypt(rawValue, key, true);
	};

	const getter = value => {
		if (!value) {
			return value;
		}
		return decrypt(value, key, true);
	};

	if (!paths || !paths.length) {
		// paths = Object.keys(schema.obj);
		return;
	}
	paths.forEach(path => {
		let pathMeta = schema.paths[path];
		if (!pathMeta || pathMeta.options.type !== String) {
			throw new Error(`Path "${path}" is of type "${pathMeta.options.type.name}".Not a String property.`);
		}
		schema.path(path).set(setter);
		schema.path(path).get(getter);
	});
};

module.exports = {
	encrypt: encryptPlugin
};
export { };

const nconf = require('nconf');
nconf.required(['MONGO_URI']);

const _ = require('lodash');
const mongoose = require('mongoose');
const MONGO_URI = nconf.get('MONGO_URI');
const require_dir = require('require-dir');
const models = require_dir('../models');
const Promise = require('bluebird');
mongoose.Promise = Promise;

const promises = [];
const DATABASES = {};

_.each(nconf.get('DATABASES'), (val, key) => {
	DATABASES[key] = mongoose.createConnection(MONGO_URI + val, { autoIndex: true, useNewUrlParser: true });
	DATABASES[key].on('connected', () => {
		console.log(`Mongoose connect to ${MONGO_URI}${val}`);
	});
	DATABASES[key].on('error', () => {
		console.error('MongoDB connection error:', val);
	});
	_.each(models, item => item(DATABASES[key]));
	promises.push(DATABASES[key]);
});
Promise.all(promises).then(() => {
	console.log('connections done');
}).catch(error => {
	console.error(error);
	process.exit();
});

mongoose.set('debug', true);

module.exports = {
	dbs: DATABASES,
	dbsParser (req, res, next) {
		req.dbs = DATABASES;
		let { 'x-serve': serve } = req.headers;
		serve || (serve = 'service');
		req.db = DATABASES[serve];
		if (!req.db) {
			return next(Error(`Invalid x-serve:${serve}`));
		}
		next();
	}
};

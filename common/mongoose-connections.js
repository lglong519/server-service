const nconf = require('nconf');
nconf.required(['MONGO_URI']);

const debug = require('Debug')('server:connections');
const debugErr = require('debug')('connections:Error');
const _ = require('lodash');
const mongoose = require('mongoose');
const MONGO_URI = nconf.get('MONGO_URI');
const timestamps = require('mongoose-timestamp');
mongoose.plugin(timestamps);
const require_dir = require('require-dir');
const models = require_dir('../models');
const Promise = require('bluebird');
const Q = require('q');

mongoose.Promise = Promise;
mongoose.set('debug', true);

const DATABASES = {};
const promises = [DATABASES];

_.each(nconf.get('DATABASES'), (val, key) => {
	const deferred = Q.defer();
	DATABASES[key] = mongoose.createConnection(MONGO_URI + val, {
		autoIndex: true,
		useNewUrlParser: true,
		autoReconnect: true,
		reconnectTries: 30,
		reconnectInterval: 10000
	});
	DATABASES[key].on('connected', () => {
		debug(`Mongoose connect to ${MONGO_URI}${val}`, new Date().toLocaleString());
		deferred.resolve();
	});
	DATABASES[key].on('error', () => {
		deferred.reject(`MongoDB connection error: ${val}`);
	});
	DATABASES[key].on('disconnected', () => {
		deferred.reject(`MongoDB disconnected: ${val}`);
	});
	_.each(models, item => item(DATABASES[key]));
	promises.push(deferred.promise);
});

module.exports = {
	connections: Promise.all(promises),
	dbsParser (req, res, next) {
		req.session = {};
		req.dbs = DATABASES;
		req.db = null;
		let { 'x-serve': serve } = req.headers;
		req.params.serve && (serve = req.params.serve);
		if (!serve) {
			if (req.method === 'GET' && req.query.db) {
				serve = req.query.db;
			} else {
				serve = 'pass';
				req.session.pass = true;
				console.error(`\x1B[31mInvalid x-serve:${serve}\x1B[39m`);
			}
		}
		req.db = req.dbs[serve];
		if (!req.db) {
			return next(Error(`Invalid x-serve:${serve}`));
		}
		next();
	}
};

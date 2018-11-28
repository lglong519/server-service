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

mongoose.Promise = Promise;
mongoose.set('debug', true);

const promises = [];
const DATABASES = {};

_.each(nconf.get('DATABASES'), (val, key) => {
	DATABASES[key] = mongoose.createConnection(MONGO_URI + val, { autoIndex: true,
		useNewUrlParser: true,
		autoReconnect: true,
		reconnectTries: 30,
		reconnectInterval: 10000 });
	DATABASES[key].on('connected', () => {
		debug(`Mongoose connect to ${MONGO_URI}${val}`, new Date().toLocaleString());
	});
	DATABASES[key].on('error', () => {
		debugErr('MongoDB connection error:', val, new Date().toLocaleString());
		process.exit(-1);
	});
	DATABASES[key].on('disconnected', () => {
		debugErr('MongoDB disconnected!', new Date().toLocaleString());
	});
	_.each(models, item => item(DATABASES[key]));
	promises.push(DATABASES[key]);
});
Promise.all(promises).then(() => {
	debug('\nconnections done\n');
}).catch(error => {
	debugErr(error);
	process.exit();
});

module.exports = {
	dbs: DATABASES,
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

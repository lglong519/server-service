const Errors = require('restify-errors');
const RedisService = require('services/RedisService');
const debug = require('debug')('server:initToken');

module.exports = (req, res, next) => {
	if (process.env.NODE_ENV == 'localhost') {
		req.session = { user: '5b8e55871cb0e6125a9c0314' };
		return next();
	}
	const { 'x-access-token': accessToken } = req.headers;
	if (!accessToken) {
		next(new Errors.UnauthorizedError('Unauthorized'));
	} else {
		RedisService.fetch(accessToken).then(result => {
			if (!result) {
				throw new Errors.UnauthorizedError('INVALID_TOKEN');
			}
			req.session = Object.assign(req.session, result);
			debug(req.session);
			next();
		}).catch(err => {
			next(err);
		});
	}
};

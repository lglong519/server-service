/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('service-handlers');
const SERVICES_API = '/services/';

const router = new RestifyRouter();

router.post(SERVICES_API + 'accesses', handlers.Accesses.insert);
router.post(SERVICES_API + 'access-tokens', handlers.AccessTokens.create);

module.exports = server => {
	router.applyRoutes(server);
};

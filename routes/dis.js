/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('dis-handlers');
const middleWares = require('require-dir')('middleWares');
const COMMON_API = '/dis/';

const public = new RestifyRouter();
public.post(COMMON_API + 'access-tokens', handlers.AccessTokens.create);
public.get(COMMON_API + 'access-tokens', handlers.AccessTokens.check);

const router = new RestifyRouter();
router.use(middleWares.initToken);

module.exports = server => {
	public.applyRoutes(server);
	router.applyRoutes(server);
};

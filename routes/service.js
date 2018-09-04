/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('service-handlers');
const SERVICES_API = '/services/';

const router = new RestifyRouter();

router.post(SERVICES_API + 'accesses', handlers.Accesses.insert);
router.post(SERVICES_API + 'access-tokens', handlers.AccessTokens.create);

const authRouter = new RestifyRouter();

authRouter.post(SERVICES_API + 'users', handlers.Users.insert);
authRouter.get(SERVICES_API + 'users', handlers.Users.query);
authRouter.get(SERVICES_API + 'users/:id', handlers.Users.detail);
authRouter.patch(SERVICES_API + 'users/:id', handlers.Users.update);
authRouter.del(SERVICES_API + 'users/:id', handlers.Users.delete);

module.exports = server => {
	router.applyRoutes(server);
	authRouter.applyRoutes(server);
};

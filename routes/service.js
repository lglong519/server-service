/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('service-handlers');
const middleWares = require('require-dir')('middleWares');
const SERVICES_API = '/services/';

const publicRouter = new RestifyRouter();

publicRouter.post(SERVICES_API + 'accesses', handlers.Accesses.insert);
publicRouter.post(SERVICES_API + 'access-tokens', handlers.AccessTokens.create);
publicRouter.get(SERVICES_API + 'access-tokens', handlers.AccessTokens.check);
publicRouter.get(SERVICES_API + 'packages', handlers.Packages.query);
publicRouter.get(SERVICES_API + 'packages/:id', handlers.Packages.detail);

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.del(SERVICES_API + 'access-tokens', handlers.AccessTokens.remove);
router.get(SERVICES_API + 'accesses', handlers.Accesses.query);
router.get(SERVICES_API + 'me', handlers.Me.profile);

router.post(SERVICES_API + 'users', handlers.Users.insert);
router.get(SERVICES_API + 'users', handlers.Users.query);
router.get(SERVICES_API + 'users/:id', handlers.Users.detail);
router.patch(SERVICES_API + 'users/:id', handlers.Users.update);
router.del(SERVICES_API + 'users/:id', handlers.Users.delete);

router.post(SERVICES_API + 'packages', handlers.Packages.insert);
router.patch(SERVICES_API + 'packages/:id', handlers.Packages.update);
router.del(SERVICES_API + 'packages/:id', handlers.Packages.delete);

router.post(SERVICES_API + 'press-ups', handlers.PressUps.insert);
router.get(SERVICES_API + 'press-ups', handlers.PressUps.query);
router.get(SERVICES_API + 'press-ups/:id', handlers.PressUps.detail);
router.patch(SERVICES_API + 'press-ups/:id', handlers.PressUps.update);
router.del(SERVICES_API + 'press-ups/:id', handlers.PressUps.delete);

router.post(SERVICES_API + 'squats', handlers.Squats.insert);
router.get(SERVICES_API + 'squats', handlers.Squats.query);
router.get(SERVICES_API + 'squats/:id', handlers.Squats.detail);
router.patch(SERVICES_API + 'squats/:id', handlers.Squats.update);
router.del(SERVICES_API + 'squats/:id', handlers.Squats.delete);

router.get(SERVICES_API + 'aggregation', handlers.Aggregation.query);
router.get(SERVICES_API + 'aggregation/git', handlers.Aggregation.git);

module.exports = server => {
	server.use(middleWares.InitProps);
	publicRouter.applyRoutes(server);
	router.applyRoutes(server);
};

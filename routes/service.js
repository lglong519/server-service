/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('service-handlers');
const middleWares = require('require-dir')('middleWares');
const SERVICES_API = '/services/';

const publicRouter = new RestifyRouter();

publicRouter.post(SERVICES_API + 'accesses', handlers.Accesses.insert);
publicRouter.get(SERVICES_API + 'accesses/:serve', handlers.Accesses.get);
publicRouter.post(SERVICES_API + 'access-tokens', handlers.AccessTokens.create);
publicRouter.get(SERVICES_API + 'access-tokens', handlers.AccessTokens.check);
publicRouter.get(SERVICES_API + 'packages', handlers.Packages.query);
publicRouter.get(SERVICES_API + 'packages/:id', handlers.Packages.detail);
publicRouter.get(SERVICES_API + 'test', handlers.Test);
publicRouter.post(SERVICES_API + 'test', handlers.Test);

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

router.post(SERVICES_API + 'waists', handlers.Waists.insert);
router.get(SERVICES_API + 'waists', handlers.Waists.query);
router.get(SERVICES_API + 'waists/:id', handlers.Waists.detail);
router.patch(SERVICES_API + 'waists/:id', handlers.Waists.update);
router.del(SERVICES_API + 'waists/:id', handlers.Waists.delete);

router.get(SERVICES_API + 'aggregation', handlers.Aggregation.query);
router.get(SERVICES_API + 'aggregation/git/:owner', handlers.Aggregation.git);
router.get(SERVICES_API + 'weather/:city', handlers.Weather.detail);

router.post(SERVICES_API + 'expenses', handlers.Expenses.insert);
router.get(SERVICES_API + 'expenses', handlers.Expenses.query);
router.get(SERVICES_API + 'expenses/:id', handlers.Expenses.detail);
router.patch(SERVICES_API + 'expenses/:id', handlers.Expenses.update);
router.del(SERVICES_API + 'expenses/:id', handlers.Expenses.delete);

router.post(SERVICES_API + 'entertainments', handlers.Entertainments.insert);
router.get(SERVICES_API + 'entertainments', handlers.Entertainments.query);
router.get(SERVICES_API + 'entertainments/:id', handlers.Entertainments.detail);
router.patch(SERVICES_API + 'entertainments/:id', handlers.Entertainments.update);
router.del(SERVICES_API + 'entertainments/:id', handlers.Entertainments.delete);

router.post(SERVICES_API + 'favorites', handlers.Favorites.insert);
publicRouter.get(SERVICES_API + 'favorite', handlers.Favorites.insert);
router.get(SERVICES_API + 'favorites', handlers.Favorites.query);
router.get(SERVICES_API + 'favorites/:id', handlers.Favorites.detail);
router.patch(SERVICES_API + 'favorites/:id', handlers.Favorites.update);
router.del(SERVICES_API + 'favorites/:id', handlers.Favorites.delete);

router.get(SERVICES_API + 'auditlogs', handlers.Auditlogs.query);
router.get(SERVICES_API + 'auditlogs/:id', handlers.Auditlogs.detail);

module.exports = server => {
	server.use(middleWares.InitProps);
	publicRouter.applyRoutes(server);
	router.applyRoutes(server);
};

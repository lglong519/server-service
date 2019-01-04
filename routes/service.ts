const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('service-handlers');
const commonHandlers = require('require-dir')('common-handlers');
const middleWares = require('require-dir')('middleWares');
const SERVICES_API = '/services/';

const publicRouter = new RestifyRouter();

publicRouter.post('accesses', handlers.Accesses.insert);
publicRouter.get('accesses/:serve', handlers.Accesses.get);
publicRouter.post('access-tokens', handlers.AccessTokens.create);
publicRouter.get('access-tokens', handlers.AccessTokens.check);
publicRouter.get('packages', handlers.Packages.query);
publicRouter.get('packages/:id', handlers.Packages.detail);
publicRouter.get('test', handlers.Test);
publicRouter.post('test', handlers.Test);

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.del('access-tokens', handlers.AccessTokens.remove);
router.get('accesses', handlers.Accesses.query);
router.get('me', commonHandlers.Me.profile);

router.post('users', handlers.Users.insert);
router.get('users', handlers.Users.query);
router.get('users/:id', handlers.Users.detail);
router.patch('users/:id', handlers.Users.update);
router.del('users/:id', handlers.Users.delete);

router.post('packages', handlers.Packages.insert);
router.patch('packages/:id', handlers.Packages.update);
router.del('packages/:id', handlers.Packages.delete);

router.post('press-ups', handlers.PressUps.insert);
router.get('press-ups', handlers.PressUps.query);
router.get('press-ups/:id', handlers.PressUps.detail);
router.patch('press-ups/:id', handlers.PressUps.update);
router.del('press-ups/:id', handlers.PressUps.delete);

router.post('squats', handlers.Squats.insert);
router.get('squats', handlers.Squats.query);
router.get('squats/:id', handlers.Squats.detail);
router.patch('squats/:id', handlers.Squats.update);
router.del('squats/:id', handlers.Squats.delete);

router.post('waists', handlers.Waists.insert);
router.get('waists', handlers.Waists.query);
router.get('waists/:id', handlers.Waists.detail);
router.patch('waists/:id', handlers.Waists.update);
router.del('waists/:id', handlers.Waists.delete);

router.get('aggregation', handlers.Aggregation.query);
router.get('aggregation/git/:owner', handlers.Aggregation.git);
router.get('weather/:city', commonHandlers.Weather.byCity);
router.get('weather', commonHandlers.Weather.detail);
router.get('address', commonHandlers.Address.detail);

router.post('expenses', handlers.Expenses.insert);
router.get('expenses', handlers.Expenses.query);
router.get('expenses/:id', handlers.Expenses.detail);
router.patch('expenses/:id', handlers.Expenses.update);
router.del('expenses/:id', handlers.Expenses.delete);

router.post('entertainments', handlers.Entertainments.insert);
router.get('entertainments', handlers.Entertainments.query);
router.get('entertainments/:id', handlers.Entertainments.detail);
router.patch('entertainments/:id', handlers.Entertainments.update);
router.del('entertainments/:id', handlers.Entertainments.delete);

router.post('favorites', handlers.Favorites.insert);
publicRouter.get('favorite', handlers.Favorites.insert);
router.get('favorites', handlers.Favorites.query);
router.get('favorites/:id', handlers.Favorites.detail);
router.patch('favorites/:id', handlers.Favorites.update);
router.del('favorites/:id', handlers.Favorites.delete);

router.get('auditlogs', handlers.Auditlogs.query);
router.get('auditlogs/:id', handlers.Auditlogs.detail);

export default server => {
	server.use(middleWares.InitProps);
	publicRouter.applyRoutes(server, SERVICES_API);
	router.applyRoutes(server, SERVICES_API);
};

const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('dis-handlers');
const tiebaHandlers = require('require-dir')('dis-tieba-handlers');
const middleWares = require('require-dir')('middleWares');
const commonHandlers = require('require-dir')('common-handlers');
const COMMON_API = '/dis/';

const exposed = new RestifyRouter();
exposed.post('access-tokens', handlers.AccessTokens.create);
exposed.get('access-tokens', handlers.AccessTokens.check);
exposed.post('users', handlers.Users.insert);

const router = new RestifyRouter();
router.use(middleWares.accToken);
router.del('access-tokens', handlers.AccessTokens.remove);
router.get('me', commonHandlers.Me.profile);
router.get('weather/:city', commonHandlers.Weather.detail);
router.patch('me', handlers.Users.update);

router.post('tieba-accounts', tiebaHandlers.TiebaAccounts.insert);
router.get('tieba-accounts', tiebaHandlers.TiebaAccounts.query);
router.get('tieba-accounts/:id', tiebaHandlers.TiebaAccounts.detail);
router.patch('tieba-accounts/:id', tiebaHandlers.TiebaAccounts.update);
router.del('tieba-accounts/:id', tiebaHandlers.TiebaAccounts.delete);
router.post('tieba-accounts/:id/sign', tiebaHandlers.TiebaAccounts.sign);
router.get('tieba-accounts/:id/sumarize', tiebaHandlers.TiebaAccounts.sumarize);

router.post('tieba-accounts/:id/tiebas/sync', tiebaHandlers.Tiebas.sync);
router.post('tieba-accounts/:id/tiebas/reset', tiebaHandlers.Tiebas.reset);
router.post('tiebas', tiebaHandlers.Tiebas.insert);
router.get('tiebas', tiebaHandlers.Tiebas.query);
router.get('tiebas/:id', tiebaHandlers.Tiebas.detail);
router.post('tiebas/:id/sign', tiebaHandlers.Tiebas.sign);
router.patch('tiebas/:id', tiebaHandlers.Tiebas.update);
router.del('tiebas/:id', tiebaHandlers.Tiebas.delete);

export default server => {
	exposed.applyRoutes(server, COMMON_API);
	router.applyRoutes(server, COMMON_API);
};

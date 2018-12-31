/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('tieba-handlers');
const middleWares = require('require-dir')('middleWares');
const TB_API = '/tieba/';

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.post('tieba-accounts', handlers.TiebaAccounts.insert);
router.get('tieba-accounts', handlers.TiebaAccounts.query);
router.get('tieba-accounts/:id', handlers.TiebaAccounts.detail);
router.patch('tieba-accounts/:id', handlers.TiebaAccounts.update);
router.del('tieba-accounts/:id', handlers.TiebaAccounts.delete);
router.post('tieba-accounts/:id/sign', handlers.TiebaAccounts.sign);
router.get('tieba-accounts/:id/summarize', handlers.TiebaAccounts.summarize);
router.get('tieba-accounts/users', handlers.TiebaAccounts.users);

router.post('tieba-accounts/:id/tiebas/sync', handlers.Tiebas.sync);
router.post('tieba-accounts/:id/tiebas/reset', handlers.Tiebas.reset);
router.post('tiebas', handlers.Tiebas.insert);
router.get('tiebas', handlers.Tiebas.query);
router.get('tiebas/:id', handlers.Tiebas.detail);
router.post('tiebas/:id/sign', handlers.Tiebas.sign);
router.patch('tiebas/:id', handlers.Tiebas.update);
router.del('tiebas/:id', handlers.Tiebas.delete);
router.post('tiebas/reset', handlers.Tiebas.resetAll);
router.get('tiebas/summarize', handlers.Tiebas.summarize);

export default server => {
	router.applyRoutes(server, TB_API);
};

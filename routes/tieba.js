/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('tieba-handlers');
const middleWares = require('require-dir')('middleWares');
const TB_API = '/tieba/';

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.post(TB_API + 'tieba-accounts', handlers.TiebaAccounts.insert);
router.get(TB_API + 'tieba-accounts', handlers.TiebaAccounts.query);
router.get(TB_API + 'tieba-accounts/:id', handlers.TiebaAccounts.detail);
router.patch(TB_API + 'tieba-accounts/:id', handlers.TiebaAccounts.update);
router.del(TB_API + 'tieba-accounts/:id', handlers.TiebaAccounts.delete);
router.post(TB_API + 'tieba-accounts/:id/sign', handlers.TiebaAccounts.sign);
router.get(TB_API + 'tieba-accounts/:id/sumarize', handlers.TiebaAccounts.sumarize);

router.post(TB_API + 'tieba-accounts/:id/tiebas/sync', handlers.Tiebas.sync);
router.post(TB_API + 'tiebas', handlers.Tiebas.insert);
router.get(TB_API + 'tiebas', handlers.Tiebas.query);
router.get(TB_API + 'tiebas/:id', handlers.Tiebas.detail);
router.post(TB_API + 'tiebas/:id/sign', handlers.Tiebas.sign);
router.patch(TB_API + 'tiebas/:id', handlers.Tiebas.update);
router.del(TB_API + 'tiebas/:id', handlers.Tiebas.delete);

module.exports = server => {
	router.applyRoutes(server);
};

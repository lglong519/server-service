/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('cfop-handlers');
const middleWares = require('require-dir')('middleWares');
const CFOP_API = '/cfop/';

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.post(CFOP_API + 'f2ls', handlers.F2Ls.insert);
router.get(CFOP_API + 'f2ls', handlers.F2Ls.query);
router.get(CFOP_API + 'f2ls/:id', handlers.F2Ls.detail);
router.patch(CFOP_API + 'f2ls/:id', handlers.F2Ls.update);
router.del(CFOP_API + 'f2ls/:id', handlers.F2Ls.delete);

router.post(CFOP_API + 'olls', handlers.OLLs.insert);
router.get(CFOP_API + 'olls', handlers.OLLs.query);
router.get(CFOP_API + 'olls/:id', handlers.OLLs.detail);
router.patch(CFOP_API + 'olls/:id', handlers.OLLs.update);
router.del(CFOP_API + 'olls/:id', handlers.OLLs.delete);

router.post(CFOP_API + 'plls', handlers.PLLs.insert);
router.get(CFOP_API + 'plls', handlers.PLLs.query);
router.get(CFOP_API + 'plls/:id', handlers.PLLs.detail);
router.patch(CFOP_API + 'plls/:id', handlers.PLLs.update);
router.del(CFOP_API + 'plls/:id', handlers.PLLs.delete);

module.exports = server => {
	router.applyRoutes(server);
};

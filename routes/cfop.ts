const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('cfop-handlers');
const middleWares = require('require-dir')('middleWares');
const CFOP_API = '/cfop/';

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.post('f2ls', handlers.F2Ls.insert);
router.get('f2ls', handlers.F2Ls.query);
router.get('f2ls/:id', handlers.F2Ls.detail);
router.patch('f2ls/:id', handlers.F2Ls.update);
router.del('f2ls/:id', handlers.F2Ls.delete);
router.post('f2ls/reorder', handlers.Reorder.F2Ls);

router.post('olls', handlers.OLLs.insert);
router.get('olls', handlers.OLLs.query);
router.get('olls/:id', handlers.OLLs.detail);
router.patch('olls/:id', handlers.OLLs.update);
router.del('olls/:id', handlers.OLLs.delete);
router.post('olls/reorder', handlers.Reorder.OLLs);

router.post('plls', handlers.PLLs.insert);
router.get('plls', handlers.PLLs.query);
router.get('plls/:id', handlers.PLLs.detail);
router.patch('plls/:id', handlers.PLLs.update);
router.del('plls/:id', handlers.PLLs.delete);
router.post('plls/reorder', handlers.Reorder.PLLs);

export default server => {
	router.applyRoutes(server, CFOP_API);
};

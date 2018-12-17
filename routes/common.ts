const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('common-handlers');
const middleWares = require('require-dir')('middleWares');
const COMMON_API = '/common/';

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.post('tags', handlers.Tags.insert);
router.get('tags', handlers.Tags.query);
router.get('tags/:id', handlers.Tags.detail);
router.patch('tags/:id', handlers.Tags.update);
router.del('tags/:id', handlers.Tags.delete);

export default server => {
	router.applyRoutes(server, COMMON_API);
};

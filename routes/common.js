/* eslint prefer-template:0 */
const RestifyRouter = require('restify-router').Router;
const handlers = require('require-dir')('common-handlers');
const middleWares = require('require-dir')('middleWares');
const COMMON_API = '/common/';

const router = new RestifyRouter();
router.use(middleWares.initToken);

router.post(COMMON_API + 'tags', handlers.Tags.insert);
router.get(COMMON_API + 'tags', handlers.Tags.query);
router.get(COMMON_API + 'tags/:id', handlers.Tags.detail);
router.patch(COMMON_API + 'tags/:id', handlers.Tags.update);
router.del(COMMON_API + 'tags/:id', handlers.Tags.delete);

module.exports = server => {
	server.use(middleWares.InitProps);
	router.applyRoutes(server);
};

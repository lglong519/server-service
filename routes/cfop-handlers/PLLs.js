const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('PLL', {
	pageSize: 10,
	sort: 'order'
});

module.exports = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

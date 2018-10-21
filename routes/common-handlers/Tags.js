const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('Tag', {
	pageSize: 10,
	sort: '-updatedAt'
});

module.exports = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

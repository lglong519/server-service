const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('Message', {
	pageSize: 10,
	sort: '-updatedAt'
});

export = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

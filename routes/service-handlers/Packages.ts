const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('Package', {
	pageSize: 10,
	sort: '-createdAt'
});

export = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

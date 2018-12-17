const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('F2L', {
	pageSize: 10,
	sort: 'order'
});

export = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

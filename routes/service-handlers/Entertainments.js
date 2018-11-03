const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('Entertainment', {
	pageSize: 10,
	sort: '-date'
});

module.exports = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('Expense', {
	pageSize: 10,
	sort: '-createdAt'
});

module.exports = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

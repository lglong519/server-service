const restifyMongoose = require('restify-mongoose');
const handler = restifyMongoose('PressUp');

module.exports = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};
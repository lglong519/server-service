const restifyMongoose = require('restify-mongoose');
const beforeSave = require('common/addUser');

const handler = restifyMongoose('Favorite', {
	pageSize: 10,
	sort: '-date'
});

module.exports = {
	insert: handler.insert({ beforeSave }),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

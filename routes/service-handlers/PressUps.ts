const restifyMongoose = require('restify-mongoose');
const beforeSave = require('common/addUser');

const handler = restifyMongoose('PressUp', {
	pageSize: 10,
	sort: '-createdAt'
});

export = {
	insert: handler.insert({ beforeSave }),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

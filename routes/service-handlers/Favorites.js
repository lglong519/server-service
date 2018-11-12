const restifyMongoose = require('restify-mongoose');
const request = require('request-promise');
const debug = require('debug')('server:Favorites');
const cheerio = require('cheerio');

const handler = restifyMongoose('Favorite', {
	pageSize: 10,
	sort: '-date',
	beforeSave
});

function beforeSave (req, model, cb) {
	if (!model.user) {
		model.user = req.session.user;
	}
	if (model.title) {
		return cb();
	}
	request.get(model.link).then(result => {
		model.title = cheerio.load(result)('title').text();
		cb();
	}).catch(err => {
		debug(err);
		cb();
	});
}

module.exports = {
	insert: handler.insert(),
	query: handler.query(),
	detail: handler.detail(),
	update: handler.update(),
	delete: handler.delete(),
};

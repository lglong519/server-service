const restifyMongoose = require('restify-mongoose');
const _ = require('lodash');

const handle = restifyMongoose('Auditlog', {
	pageSize: 10,
	sort: '-time',
	filter () {
		return {
			'req.method': 'GET',
			'req.url': '/services/accesses/service',
		};
	},
	projection
});

function projection (req, item, cb) {
	let json = item.toJSON();
	let referer = _.get(json, 'req.headers.referer') || '';
	let out = {
		_id: json._id,
		'ip': _.get(json, 'req.headers["x-real-ip"]') || json.remoteAddress,
		'action': 'GET',
		'resource': referer.replace(/http(s)?:\/\/([^/]*)?/i, ''),
		'host': _.get(referer.match(/http(s)?:\/\/([^/]*)?/i), '[0]') || '',
		statusCode: _.get(json, 'res.statusCode'),
		updatedAt: json.updatedAt,
	};
	cb(null, out);
}
module.exports = {
	query: handle.query(),
	detail: handle.detail(),
};

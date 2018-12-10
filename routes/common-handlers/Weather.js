
const request = require('request-promise');

const detail = (req, res, next) => {
	let options = {
		uri: 'https://www.baidu.com/home/other/data/weatherInfo',
		qs: {
			city: req.params.city,
			indextype: 'manht',
			_req_seqid: '0xc233fc0c000015dd',
			asyn: 1,
			t: '1539835932671',
			sid: '1437_21101_20697_26350_22073',
		},
		headers: {
			'User-Agent': req.serverName
		},
		json: true
	};
	request(options).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};
module.exports = {
	detail,
};

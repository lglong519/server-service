
import BaiduService from '../../services/BaiduService';
import ip from '../../common/ip';
const debug = require('debug')('server:Address');

export const detail = async (req, res, next) => {
	let bd = new BaiduService(ip(req));
	bd.address().then(result => {
		res.json(result);
		next();
	}).catch(err => {
		debug('address err', err);
		res.json({});
		next();
	});
};

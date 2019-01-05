
import BaiduService from '../../services/BaiduService';
import ip from '../../common/ip';
const debug = require('Debug').default('server:Weather');

export const detail = async (req, res, next) => {
	let bd = new BaiduService(ip(req));
	let address;
	bd.address().then(result => {
		address = result;
		if (result.city) {
			return bd.weather(result.city);
		}
		if (result.point) {
			return bd.geocoding(result.point);
		}
		throw Error('INVALID_CITY');
	}).then(result => {
		if (address.city) {
			return result;
		}
		address = result;
		if (result.city) {
			return bd.weather(result.city);
		}
		throw Error('INVALID_CITY');
	}).then(result => {
		if (address.city) {
			res.json(result);
			return next();
		}
		throw Error('INVALID_CITY');
	}).catch(err => {
		debug('detail ip', bd.ip);
		debug('detail err', err);
		res.json({});
		next();
	});
};

export const byCity = (req, res, next) => {
	debug('city', req.params.city);
	let bd = new BaiduService();
	bd.weather(req.params.city).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

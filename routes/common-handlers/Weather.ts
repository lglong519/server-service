
import BaiduService from '../../services/BaiduService';
import ip from '../../common/ip';

export const detail = async (req, res, next) => {
	let bd = new BaiduService(ip(req));
	let address;
	try {
		address = await bd.address();
	} catch (e) {
		address = '';
	}
	if (!address) {
		res.json({});
		return next();
	}
	bd.weather(address.city).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

export const byCity = (req, res, next) => {
	let bd = new BaiduService();
	bd.weather(req.params.city).then(result => {
		res.json(result);
		next();
	}).catch(err => {
		next(err);
	});
};

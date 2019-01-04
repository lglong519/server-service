import * as request from 'request-promise';
import * as nconf from 'nconf';

type address = {
	'address': 'CN|\u5317\u4eac|\u5317\u4eac|None|BAIDU|0|0';
	'content': {
		'address': '\u5317\u4eac\u5e02';
		'address_detail': {
			'city': '\u5317\u4eac\u5e02';
			'city_code': 131;
			'district': '';
			'province': '\u5317\u4eac\u5e02';
			'street': '';
			'street_number': '';
		};
		'point': {
			'x': '116.40387397';
			'y': '39.91488908';
		};
	};
	'status': 0;
};
type address_err = {'status': 1; 'message': 'Internal Service Error:ip[0.12.223.0] loc failed'};

export default class Location {

	constructor (public ip?: string) {}

	address () {
		let options = {
			uri: 'http://api.map.baidu.com/location/ip',
			qs: {
				ak: 'Ok7GhEjeeqAdvjaSFU8l37F9ior67zcP',
				ip: this.ip,
				coor: 'bd09ll',
			},
			headers: {
				'User-Agent': nconf.get('server')
			},
			json: true
		};
		return request(options).then(result => {
			if (result.status) {
				throw Error(result.message);
			}
			return Object.assign({
				...result
			}, {
				...result.content
			}, {
				...result.content.address_detail
			});
		});
	}

	weather (city: string) {
		let match = city.match(/(.*)?\u5e02$/u);
		if (match) {
			city = match[1];
		}
		let options = {
			uri: 'https://www.baidu.com/home/other/data/weatherInfo',
			qs: {
				city,
				indextype: 'manht',
				_req_seqid: '0xc233fc0c000015dd',
				asyn: 1,
				t: '1539835932671',
				sid: '1437_21101_20697_26350_22073',
			},
			headers: {
				'User-Agent': nconf.get('server')
			},
			json: true
		};
		return request(options);
	}

}

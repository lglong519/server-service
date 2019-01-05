import * as request from 'request-promise';
import * as nconf from 'nconf';
import * as _ from 'lodash';
const debug = require('Debug').default('server:BaiduService');

nconf.required([
	'BAIDU_AK',
]);

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

	address (): Promise<any> {
		debug('ip', this.ip);
		let options = {
			uri: 'https://api.map.baidu.com/location/ip',
			qs: {
				ak: nconf.get('BAIDU_AK'),
				ip: this.ip,
				coor: 'bd09ll',
			},
			headers: {
				'User-Agent': nconf.get('server')
			},
			json: true
		};
		return <any>request(options).then(result => {
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
	/**
	 *
	 * @param x 经度
	 * @param y 维度
	 */
	geocoding ({ y: lat, x: lng }: { x: number; y: number}): Promise<any> {
		debug('lng', lng, 'lat', lat);
		let options = {
			uri: 'http://api.map.baidu.com/geocoder/v2/',
			qs: {
				ak: nconf.get('BAIDU_AK'),
				location: `${lat},${lng}`,
				output: 'json',
			},
			headers: {
				'User-Agent': nconf.get('server')
			},
			json: true
		};
		return <any>request(options).then(result => {
			if (result.status) {
				throw Error(result.message);
			}
			return Object.assign({
				...result
			}, {
				..._.get(result, 'result') || {}
			}, {
				..._.get(result, 'result.addressComponent') || {}
			});
		});
	}

	weather (city: string): Promise<any> {
		debug('city', city);
		if (!city) {
			return Promise.reject(Error('INVALID_CITY'));
		}
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
		return <any>request(options);
	}

}

// let loc = new Location('163.142.50.172');
// loc.address().then(res => {
// 	console.log(res);
// });

/*
geocoding={
  "status": 0,
  "result": {
    "location": { "lng": 113.26999999999997, "lat": 23.131000011111455 },
    "formatted_address": "广东省广州市越秀区桂香街34号",
    "business": "大新,北京路,广卫",
    "addressComponent": {
      "country": "中国",
      "country_code": 0,
      "country_code_iso": "CHN",
      "country_code_iso2": "CN",
      "province": "广东省",
      "city": "广州市",
      "city_level": 2,
      "district": "越秀区",
      "town": "",
      "adcode": "440104",
      "street": "桂香街",
      "street_number": "34号",
      "direction": "附近",
      "distance": "44"
    },
    "pois": [],
    "roads": [],
    "poiRegions": [],
    "sematic_description": "百汇广场附近45米",
    "cityCode": 257
  }
}
*/


const request = require('request-promise');
const md5 = require('md5');
const debug = require('debug')('server:TiebaService');

class Tieba {

	constructor (req, page_size = 500) {
		this.req = req;
		this.page_size = page_size;
	}
	/**
	 * @description get userid from baidu,save to dbs
	 */
	init (account, BDUSS) {
		return request({
			uri: `http://tieba.baidu.com/home/get/panel?ie=utf-8&un=${account}`,
			json: true,
		}).then(result => {
			if (result.no == 0) {
				return this.req.db.model('TiebaAccount').findOneAndUpdate(
					{
						user: this.req.session.user,
						account: result.data.name
					},
					{
						user: this.req.session.user,
						account: result.data.name,
						uid: result.data.id,
						BDUSS
					},
					{
						upsert: true,
						new: true,
					}
				);
			}
			throw result;
		}).then(result => {
			this.tiebaAccount = result;
			return this._getAll();
		});
	}
	/**
	 * @description get tiebas from baidu,save to dbs
	 */
	_getAll () {
		let now = Date.now();
		let options = {
			method: 'POST',
			uri: 'http://c.tieba.baidu.com/c/f/forum/like?',
			headers: {
				'User-Agent': 'Mozilla/5.0 (SymbianOS/9.3; Series60/3.2 NokiaE72-1/021.021; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 BrowserNG/7.1.16352',
				'Content-Type': 'application/x-www-form-urlencoded',
				Cookie: `BDUSS=${this.tiebaAccount.BDUSS}`,
			},
			json: true,
		};
		let params = {
			'_client_id': `wappc_${now}_258`,
			'_client_type': 2,
			'_client_version': '6.5.8',
			'_phone_imei': '357143042411618',
			'from': 'baidu_appstore',
			'is_guest': 1,
			'model': 'H60-L01',
			'page_no': 1,
			'page_size': this.page_size,
			'timestamp': `${now}903`,
			'uid': this.tiebaAccount.uid
		};

		options.uri += this._serialize(params);

		return request(options).then(result => {
			let forum_list = result.forum_list['non-gconforum'];
			if (result.error_code != '0' || !forum_list) {
				throw result;
			}
			let promises = forum_list.map(item => {
				return this.req.db.model('Tieba').findOneAndUpdate(
					{
						user: this.req.session.user,
						tiebaAccount: this.tiebaAccount._id,
						fid: item.id,
					},
					{
						user: this.req.session.user,
						tiebaAccount: this.tiebaAccount._id,
						fid: item.id,
						kw: item.name,
						level_id: item.level_id,
						cur_score: item.cur_score,
						avatar: item.avatar,
					},
					{
						upsert: true,
						new: true,
					}
				);
			});
			return Promise.all(promises);
		}).then(results => {
			this.tiebas = results;
		});
	}
	/**
	 * @description query tieba account from dbs
	 */
	getAccount () {
		if (this.tiebaAccount) {
			return Promise.resolve();
		}
		return this.req.db.model('TiebaAccount').findOne({
			user: this.req.session.user
		}).exec().then(result => {
			if (!result) {
				throw Error('ERROR_NOT_FOUND');
			}
			this.tiebaAccount = result;
		});
	}
	/**
	 * @description query tiebas from dbs
	 */
	query () {
		if (this.tiebas) {
			return Promise.resolve();
		}
		return this.getAccount().then(() => {
			return this.req.db.model('Tieba').find({
				user: this.req.session.user,
				tiebaAccount: this.tiebaAccount._id
			}).exec();
		}).then(result => {
			this.tiebas = result;
		});
	}

	/**
	 * @description get tbs for sign
	 */
	getTbs () {
		let options = {
			uri: 'http://tieba.baidu.com/dc/common/tbs',
			headers: {
				Host: 'tieba.baidu.com',
				Pragma: 'no-cache',
				'Upgrade-Insecure-Requests': 1,
				'User-Agent': 'fuck phone',
				'Referer': 'http://tieba.baidu.com/',
				'X-Forwarded-For': `115.28.1.${Math.random() * 254}` >> 0,
				Cookie: `BDUSS=${this.tiebaAccount.BDUSS}`
			},
			json: true,
		};
		return request(options);
	}
	/**
	 * @description sign one
	 * @param {Object} tieba
	 * @returns void
	 */
	signOne (tieba) {
		let options = {
			method: 'POST',
			uri: 'http://c.tieba.baidu.com/c/c/forum/sign?',
			headers: {
				'User-Agent': 'mc iPhone/1.0 BadApple/99.1',
				Cookie: `BDUSS=${this.tiebaAccount.BDUSS}`
			},
			json: true
		};
		this.getTbs().then(result => {
			let params = {
				'BDUSS': this.tiebaAccount.BDUSS,
				'fid': tieba.fid,
				'kw': encodeURI(tieba.kw),
				'tbs': result.tbs,
			};
			options.uri += this._serialize(params);
			return request(options);
		}).then(result => {
			if (result.error_code != '0') {
				throw result;
			}
			tieba.status = 'resolve';
			tieba.desc = '';
			return tieba.save();
		}).catch(err => {
			tieba.status = 'reject';
			tieba.desc = err.error_msg || err.message || 'UNKNOWN_ERROR';
			debug(err);
			return tieba.save();
		});
	}
	/**
	 * @description sign all
	 */
	signAll () {
		this.query().then(() => {
			this.tiebas.forEach(item => {
				this.signOne(item);
			});
		}).catch(err => {
			debug(err);
		});
	}
	/**
	 * @description serialize params
	 */
	_serialize (params) {
		let query = '';
		Object.keys(params).forEach(item => {
			query += `${item}=${params[item]}&`;
		});
		let sign = md5(`${decodeURI(query.replace(/&/g, ''))}tiebaclient!!!`).toUpperCase();
		return `${query}sign=${sign}`;
	}

}
module.exports = Tieba;

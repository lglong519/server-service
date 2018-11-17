
const request = require('request-promise');
const md5 = require('md5');
const debug = require('debug')('server:TiebaService');

class Tieba {

	constructor ({ db, user, account, page_size = 200 } = {}) {
		this.db = db;
		this.user = user;
		this.page_size = page_size;
		this.account = account;
		this.pn = 1;
		this.tiebas = [];
	}
	/**
	 * @description get userid from baidu,save to dbs
	 */
	init ({ account, BDUSS }) {
		return request({
			uri: `http://tieba.baidu.com/home/get/panel?ie=utf-8&un=${encodeURIComponent(account)}`,
			json: true,
		}).then(result => {
			if (result.no == 0) {
				return this.db.model('TiebaAccount').findOneAndUpdate(
					{
						user: this.user,
						account: result.data.name
					},
					{
						user: this.user,
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
			return result;
		});
	}
	/**
	 * @description get tiebas from baidu,save to dbs
	 */
	getAll () {
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
			'page_no': this.pn,
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
			if (result.has_more == '1') {
				this.pn++;
				this.getAll();
			}
			let promises = forum_list.map(item => {
				return this.db.model('Tieba').findOneAndUpdate(
					{
						user: this.user,
						tiebaAccount: this.tiebaAccount._id,
						fid: item.id,
					},
					{
						user: this.user,
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
			this.tiebas = this.tiebas.concat(results);
		});
	}
	/**
	 * @description query tieba account from dbs
	 */
	getAccount () {
		if (this.tiebaAccount) {
			return Promise.resolve();
		}
		if (!this.account) {
			return Promise.reject('invalid account');
		}
		return this.db.model('TiebaAccount').findOne({
			user: this.user,
			account: this.account
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
		if (this.tiebas && this.tiebas.length) {
			return Promise.resolve();
		}
		return this.getAccount().then(() => {
			return this.db.model('Tieba').find({
				user: this.user,
				tiebaAccount: this.tiebaAccount._id,
				void: {
					$ne: true
				}
			}).exec();
		}).then(result => {
			this.tiebas = result;
		});
	}
	/**
	 * @description query unsigned from dbs
	 */
	queryPending () {
		if (this.tiebas && this.tiebas.length) {
			return Promise.resolve();
		}
		return this.getAccount().then(() => {
			return this.db.model('Tieba').find({
				status: {
					$ne: 'resolve'
				},
				user: this.user,
				tiebaAccount: this.tiebaAccount._id,
				void: {
					$ne: true
				}
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
		if (tieba.status == 'resolve' || tieba.void) {
			return Promise.resolve(tieba);
		}
		let options = {
			method: 'POST',
			uri: 'http://c.tieba.baidu.com/c/c/forum/sign?',
			headers: {
				'User-Agent': 'mc iPhone/1.0 BadApple/99.1',
				Cookie: `BDUSS=${this.tiebaAccount.BDUSS}`
			},
			json: true
		};
		return this.getTbs().then(result => {
			let params = {
				'BDUSS': this.tiebaAccount.BDUSS,
				'fid': tieba.fid,
				'kw': encodeURIComponent(tieba.kw),
				'tbs': result.tbs,
			};
			options.uri += this._serialize(params);
			return request(options);
		}).then(result => {
			if (result.error_code != '0' && result.error_code != '160002') {
				throw result;
			}

			tieba.status = 'resolve';
			tieba.desc = result.error_msg || '';
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
		return this.queryPending().then(() => {
			this.tiebas.forEach(item => {
				this.signOne(item);
			});
		}).catch(err => {
			debug(err);
		});
	}
	/**
	 * @description reset all tbs status
	 */
	resetAll () {
		return this.query().then(() => {
			this.tiebas.forEach(item => {
				item.status = 'pendding';
				item.desc = '';
				item.save().catch(err => {
					debug(`reset fail:${item._id}`, err);
				});
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
		let sign = md5(`${decodeURIComponent(query.replace(/&/g, ''))}tiebaclient!!!`).toUpperCase();
		return `${query}sign=${sign}`;
	}

}
module.exports = Tieba;


const request = require('request-promise');
const md5 = require('md5');
const debug = require('debug')('server:TiebaService');
const _ = require('lodash');

class Tieba {

	constructor ({ db, page_size = 200 } = {}) {
		this.db = db;
		this.page_size = page_size;
		this.pn = 1;
		this.tiebas = [];
	}
	/**
	 * @description 1.获取 un,2.创建帐号,3.save to dbs
	 */
	init (BDUSS, user) {
		if (!BDUSS) {
			return Promise.reject('INVALID_BDUSS');
		}
		return this.getUn(BDUSS).then(un => {
			return request({
				uri: `http://tieba.baidu.com/home/get/panel?ie=utf-8&un=${encodeURIComponent(un)}`,
				json: true,
			});
		}).then(result => {
			if (result.no == 0) {
				return this.getTbs(BDUSS).then(tbs => {
					let active = false;
					if (tbs.is_login == 1) {
						active = true;
					}
					let params = [
						{
							user,
							un: result.data.name
						},
						{
							user,
							un: result.data.name,
							uid: result.data.id,
							BDUSS,
							active
						},
						{
							upsert: true,
							new: true,
							setDefaultsOnInsert: true
						}
					];
					if (active) {
						this.db.model('Bduss').findOneAndUpdate(...params).catch(err => debug(err));
					}
					return this.db.model('TiebaAccount').findOneAndUpdate(...params);
				});
			}
			throw result;
		}).then(result => {
			this.tiebaAccount = result;
			return result;
		});
	}
	/**
	 * @description 检测 BDUSS 是否有效,无效将冻结所有 tb
	 */
	checkBDUSS () {
		return this.getTbs().then(result => {
			if (result.is_login != 1) {
				this.tiebaAccount.active = false;
				return this.tiebaAccount.save();
			}
			if (this.tiebaAccount.active != true) {
				this.tiebaAccount.active = true;
				return this.tiebaAccount.save();
			}
		}).then(() => {
			if (this.tiebaAccount.active != true) {
				return this.db.model('Tieba').update(
					{
						user: this.tiebaAccount.user,
						tiebaAccount: this.tiebaAccount._id,
						active: true
					},
					{
						active: false
					},
					{
						multi: true
					}
				);
			}
		}).then(result => {
			if (result) {
				throw Error('INVALID_BDUSS');
			}
		});
	}
	/**
	 * @description 1.checkBDUSS,2.get tiebas from baidu,3.save to dbs
	 * @requires tiebaAccount
	 * @requires tiebaAccount.BDUSS
	 * @requires tiebaAccount.active true
	 */
	getAll () {
		if (!this.tiebaAccount.active) {
			return Promise.reject('INVALID_BDUSS');
		}
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

		return this.checkBDUSS().then(() => {
			return request(options);
		}).then(result => {
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
						user: this.tiebaAccount.user,
						tiebaAccount: this.tiebaAccount._id,
						fid: item.id,
					},
					{
						user: this.tiebaAccount.user,
						tiebaAccount: this.tiebaAccount._id,
						fid: item.id,
						kw: item.name,
						level_id: item.level_id,
						cur_score: item.cur_score,
						avatar: item.avatar,
						active: true
					},
					{
						upsert: true,
						new: true,
						setDefaultsOnInsert: true
					}
				).catch(err => {
					debug(err);
				});
			});
			return Promise.all(promises);
		}).then(results => {
			this.tiebas = this.tiebas.concat(results);
			return this.db.model('Tieba').update(
				{
					user: this.tiebaAccount.user,
					tiebaAccount: this.tiebaAccount._id,
					updatedAt: {
						$lt: now - 30000
					}
				}, {
					active: false,
					desc: '无效'
				},
				{
					multi: true,
					setDefaultsOnInsert: true
				}
			);
		});
	}
	/**
	 * @description query tieba account from dbs
	 * @requires tiebaAccount
	 * @requires tiebaAccount.active true
	 * @or
	 * @requires user
	 * @requires un
	 */
	getAccount (user, un) {
		if (this.tiebaAccount) {
			if (!this.tiebaAccount.active) {
				return Promise.reject('INVALID_BDUSS');
			}
			return Promise.resolve();
		}
		if (!user) {
			return Promise.reject('USER_IS_REQUIRED');
		}
		if (!un) {
			return Promise.reject('UN_IS_REQUIRED');
		}
		return this.db.model('TiebaAccount').findOne({
			user: this.tiebaAccount.user,
			un: this.tiebaAccount.un
		}).exec().then(result => {
			if (!result) {
				throw Error('ERROR_NOT_FOUND');
			}
			if (!result.active) {
				throw Error('INVALID_BDUSS');
			}
			this.tiebaAccount = result;
		});
	}
	/**
	 * @description query tiebas from dbs
	 * @requires tiebaAccount
	 */
	query () {
		if (this.tiebas && this.tiebas.length) {
			return Promise.resolve();
		}
		if (!this.tiebaAccount) {
			return Promise.reject('INVALID_TB_ACCOUNT');
		}
		return this.db.model('Tieba').find({
			user: this.tiebaAccount.user,
			tiebaAccount: this.tiebaAccount._id,
			void: false,
			active: true
		}).exec().then(result => {
			this.tiebas = result;
		});
	}
	/**
	 * @description query unsigned from dbs
	 * @requires tiebaAccount
	 */
	queryPending () {
		if (this.tiebas && this.tiebas.length) {
			return Promise.resolve();
		}
		if (!this.tiebaAccount) {
			return Promise.reject('INVALID_TB_ACCOUNT');
		}
		return this.db.model('Tieba').find({
			status: {
				$ne: 'resolve'
			},
			user: this.tiebaAccount.user,
			tiebaAccount: this.tiebaAccount._id,
			void: false,
			active: true
		}).limit(1000).exec().then(result => {
			this.tiebas = result;
		});
	}
	/**
	 * @description get account's un
	 * @requires BDUSS||tiebaAccount.BDUSS
	 */
	getUn (BDUSS) {
		let options = {
			uri: 'http://wapp.baidu.com/',
			headers: {
				Cookie: `BDUSS=${BDUSS || this.tiebaAccount.BDUSS}`
			}
		};
		return request(options).then(result => {
			let match = result.match(/i\?un=([^">]*)?">/);
			if (match) {
				return match[1];
			}
			throw Error('INVALID_BDUSS');
		});
	}
	/**
	 * @description get tbs for sign
	 * @requires BDUSS||tiebaAccount.BDUSS
	 */
	getTbs (BDUSS) {
		if (!BDUSS && !_.get(this, 'tiebaAccount.BDUSS')) {
			return Promise.reject('INVALID_BDUSS');
		}
		let options = {
			uri: 'http://tieba.baidu.com/dc/common/tbs',
			headers: {
				Host: 'tieba.baidu.com',
				Pragma: 'no-cache',
				'Upgrade-Insecure-Requests': 1,
				'User-Agent': 'mc phone',
				'Referer': 'http://tieba.baidu.com/',
				'X-Forwarded-For': `115.28.1.${Math.random() * 254}` >> 0,
				Cookie: `BDUSS=${BDUSS || this.tiebaAccount.BDUSS}`
			},
			json: true,
		};
		return request(options);
	}
	/**
	 * @description sign one
	 * @param {Object} tieba
	 * @requires tiebaAccount.active
	 * @returns void
	 */
	signOne (tieba) {
		if (this.tiebaAccount && !this.tiebaAccount.active) {
			return Promise.reject('INVALID_BDUSS');
		}
		if (tieba.status == 'resolve' || tieba.void || !tieba.active) {
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
				'_client_id': '03-00-DA-59-05-00-72-96-06-00-01-00-04-00-4C-43-01-00-34-F4-02-00-BC-25-09-00-4E-36',
				'_client_type': '4',
				'_client_version': '1.2.1.17',
				'_phone_imei': '540b43b59d21b7a4824e1fd31b08e9a6',
				'fid': tieba.fid,
				'kw': encodeURIComponent(tieba.kw),
				'tbs': result.tbs,
			};
			let query = `BDUSS=${params.BDUSS}&_client_id=${params._client_id}&_client_type=${params._client_type}&_client_version=${params._client_version}&_phone_imei=${params._phone_imei}&fid=${params.fid}&kw=${params.kw}&tbs=${params.tbs}&`;
			let sign = md5(`${decodeURIComponent(query.replace(/&/g, ''))}tiebaclient!!!`).toUpperCase();
			options.uri += `${query}sign=${sign}`;
			return request(options);
		}).then(result => {
			debug(tieba.fid, tieba.kw, this.tiebaAccount._id);
			debug('sign result', result);
			if (result.error_code != '0' && result.error_code != '160002' && result.error_msg !== '亲，你之前已经签过了' && !result.error) {
				throw result;
			}
			tieba.status = 'resolve';
			tieba.desc = result.error_msg || '';
			return tieba.save();
		}).catch(err => {
			tieba.status = 'reject';
			tieba.desc = err.error_msg || err.message || _.get(err, 'error.errmsg') || _.get(err, 'error.usermsg') || 'UNKNOWN_ERROR';
			tieba.sequence = Date.now();
			debug(err);
			return Promise.all([err, tieba.save()]);
		}).then(results => {
			return Promise.reject(results[0]);
		});
	}
	/**
	 * @description sign all
	 */
	signAll () {
		return this.queryPending().then(() => {
			this.tiebas.forEach(item => {
				this.signOne(item).catch(err => debug(err));
			});
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

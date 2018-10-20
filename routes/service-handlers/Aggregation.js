
const request = require('request-promise');
const DateTime = require('common/dateTime');
const moment = require('moment');
const debug = require('debug')('server:Aggregation');
const nconf = require('nconf');
const ProcessService = require('services/ProcessService');
const localStorage = require('common/localStorage');

nconf.required([
	'ACCESS_TOKEN'
]);

const query = (req, res, next) => {
	let payload = {};
	Promise.all([
		req.db.model('Access').aggregate([
			{ $group: { _id: null, accesses: { $sum: '$inc' } } },
		]).exec().then(reusult => {
			Object.assign(payload, reusult[0]);
		}),
		req.db.model('Squat').aggregate([
			{ $group: { _id: null, squats: { $sum: '$count' } } },
		]).exec().then(reusult => {
			Object.assign(payload, reusult[0]);
		}),
		req.db.model('PressUp').aggregate([
			{ $group: { _id: null, pressUps: { $sum: '$count' } } },
		]).exec().then(reusult => {
			Object.assign(payload, reusult[0]);
		}),
	]).then(() => {
		res.json(payload);
		next();
	}).catch(err => {
		next(err);
	});
};

/**
 * @description 同一时间段内只允许一个处理进程,进程完成后缓存返回的数据,所有请求共享缓存的数据
 */
const git = (req, res, next) => {
	debug('git start');
	if (ProcessService.git.active) {
		return ProcessService.git.async.then(() => {
			res.json(localStorage.fetchItem(`git-cache-${req.params.owner}`));
			next();
		}).catch(() => {
			_gitOnlineFecth(req, res, next);
		});
	}
	let gitCache = localStorage.fetchItem(`git-cache-${req.params.owner}`);
	if (Date.now() - new Date(gitCache.entryDate) < 600000) {
		res.json(gitCache);
		return next();
	}
	_gitOnlineFecth(req, res, next);
};

function _gitOnlineFecth (req, res, next) {
	ProcessService.git.active = true;
	const owner = req.params.owner;
	const headers = {
		'User-Agent': req.serverName
	};
	const qs = {
		access_token: nconf.get('ACCESS_TOKEN').replace(/[A-Z]/g, '')
	};
	const format = 'YYYY-MM-DD';
	const payload = {
		entryDate: 0,
		repos: [],
		commits: {
			total: 0,
			today: 0,
			week: [0, 0, 0, 0, 0, 0, 0],
			list: {
				/*
				'xxx': {
					total: 0,
					today: 0,
					week: [],
				},
				*/
			}
		}
	};

	const reposOptions = {
		uri: `https://api.github.com/users/${owner}/repos`,
		qs,
		headers,
		json: true
	};
	ProcessService.git.async = request(reposOptions).then(results => {
		debug('repos count:', results.length);
		const promises = [];
		let n = 0;
		payload.repos = results.map((item, i) => {
			const commitOptions = {
				uri: `https://api.github.com/repos/${owner}/${item.name}/commits`,
				qs,
				headers,
				json: true
			};
			let storeName = `repo_${owner}_${item.name}`;
			// 获取每个分支的缓存,如果时间不小于3:20,就重新获取
			promises.push(localStorage.fetchItem(storeName, false).then(result => {
				// 判断分支缓存时间
				if (Date.now() - new Date(result.entryDate) < 200000) {
					return result;
				}
				return request(commitOptions);
			}).then(results => {
				// 判断是否缓存数据,只有缓存数据才有 results.results
				let _eachData;
				if (results.results) {
					_eachData = results;
				} else {
					_eachData = {
						entryDate: Date.now(),
						results
					};
					// 新数据重新缓存
					localStorage.setItem(storeName, JSON.stringify(_eachData));
				}
				let repo = {
					total: _eachData.results.length,
					today: 0,
					week: [0, 0, 0, 0, 0, 0, 0],
				};
				let dateTime = new DateTime(new Date(), format);
				let sevenDays = [];
				for (let i = 0; i < 7; i++) {
					sevenDays[i] = dateTime.offsetInDays(-1 * i);
				}
				let weekCommits = [];
				_eachData.results.forEach(elem => {
					let date = moment(elem.commit.committer.date).format(format);
					let index = sevenDays.indexOf(date);
					if (!weekCommits[index]) {
						weekCommits[index] = [];
					}
					if (index > -1) {
						weekCommits[index].push(elem);
					}
				});
				weekCommits.forEach((item, i) => {
					repo.week[i] = item.length;
					payload.commits.week[i] += repo.week[i];
				});
				repo.today = repo.week[0];
				repo.week.reverse();
				payload.commits.list[item.name] = repo;
				payload.commits.total += repo.total;
				payload.commits.today += repo.today;
				debug(`${++n} finish repo:`, item.name);
			}));
			return item.name;
		});
		setTimeout(() => {
			if (ProcessService.git.active) {
				ProcessService.git.active = false;
				debug('git timeout');
				next(Error('timeout'));
			}
		}, 180000);
		return Promise.all(promises);
	}).then(() => {
		payload.commits.week.reverse();
		payload.entryDate = Date.now();
		localStorage.setItem(`git-cache_${req.params.owner}`, JSON.stringify(payload));
		ProcessService.git.active = false;
		res.json(payload);
		next();
	}).catch(err => {
		ProcessService.git.active = false;
		next(err);
	});
}
module.exports = {
	query,
	git,
};

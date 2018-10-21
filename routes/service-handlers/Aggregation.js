
const request = require('request-promise');
const DateTime = require('common/dateTime');
const debug = require('debug')('server:Aggregation');
const nconf = require('nconf');
const _ = require('lodash');
const ProcessService = require('services/ProcessService');
const localStorage = require('common/localStorage');
const getWeekData = require('common/getWeekData');
const reduceWeekData = require('common/reduceWeekData');

nconf.required([
	'ACCESS_TOKEN',
	'GIT_API',
]);

const query = (req, res, next) => {
	let payload = {
		// exercise,
		// accesses,
	};
	const since = new Date(`${new DateTime(new Date(), 'YYYY-MM-DD').offsetInDays(-6)} 00:00:00`).toISOString();
	let accesses = {};
	let squats = {};
	let pressUps = {};
	let auditlogs = {};
	let expenses = {
		food: {},
		general: {}
	};
	Promise.all([
		// week
		req.db.model('Expense').find({
			type: 'food',
			createdAt: {
				$gte: since
			}
		}).exec().then(results => {
			expenses.food.week = reduceWeekData(results, 'createdAt', 'amount');
		}),
		// week
		req.db.model('Expense').find({
			type: 'general',
			createdAt: {
				$gte: since
			}
		}).exec().then(results => {
			expenses.general.week = reduceWeekData(results, 'createdAt', 'amount');
		}),
		// week
		req.db.model('Auditlog').find({
			time: {
				$gte: since
			}
		}).exec().then(results => {
			auditlogs.week = getWeekData(results, 'time');
		}),
		// week
		req.db.model('Access').find({
			updatedAt: {
				$gte: since
			}
		}).exec().then(results => {
			accesses.week = getWeekData(results, 'updatedAt', 'inc');
		}),
		// week
		req.db.model('Squat').find({
			referenceDate: {
				$gte: since
			}
		}).exec().then(results => {
			squats.week = reduceWeekData(results, 'referenceDate', 'count');
		}),
		// week
		req.db.model('PressUp').find({
			referenceDate: {
				$gte: since
			}
		}).exec().then(results => {
			pressUps.week = reduceWeekData(results, 'referenceDate', 'count');
		}),
		req.db.model('Access').aggregate([
			{ $group: { _id: null, accesses: { $sum: '$inc' } } },
		]).exec().then(reusult => {
			accesses.total = reusult[0].accesses;
		}),
		req.db.model('Squat').aggregate([
			{ $group: { _id: null, squats: { $sum: '$count' } } },
		]).exec().then(reusult => {
			squats.total = reusult[0].squats;
		}),
		req.db.model('PressUp').aggregate([
			{ $group: { _id: null, pressUps: { $sum: '$count' } } },
		]).exec().then(reusult => {
			pressUps.total = reusult[0].pressUps;
		}),
		req.db.model('Expense').aggregate([
			{ $group: { _id: null, expenses: { $sum: '$amount' } } },
		]).exec().then(reusult => {
			expenses.total = reusult[0].expenses;
		}),
	]).then(() => {
		payload.exercise = {
			total: squats.total + pressUps.total,
			squats,
			pressUps,
		};
		payload.accesses = accesses;
		payload.auditlogs = auditlogs;
		payload.expenses = expenses;
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
			res.json(localStorage.fetchItem(`git-cache_${req.params.owner}`));
			next();
		}).catch(() => {
			_gitOnlineFecth(req, res, next);
		});
	}
	let gitCache = localStorage.fetchItem(`git-cache_${req.params.owner}`);
	if (Date.now() - new Date(gitCache.entryDate) < 300000) {
		res.json(gitCache);
		return next();
	}
	_gitOnlineFecth(req, res, next);
};

function _gitOnlineFecth (req, res, next) {
	ProcessService.git.active = true;
	const owner = req.params.owner;
	const GIT_API = nconf.get('GIT_API');
	const headers = {
		'User-Agent': req.serverName
	};
	const qs = {
		access_token: nconf.get('ACCESS_TOKEN').replace(/[A-Z]/g, '')
	};
	const since = new Date(`${new DateTime(new Date(), 'YYYY-MM-DD').offsetInDays(-6)} 00:00:00`).toISOString();
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
		uri: `${GIT_API}/users/${owner}/repos`,
		qs,
		headers,
		json: true
	};
	ProcessService.git.async = request(reposOptions).then(results => {
		debug('repos count:', results.length);
		debug('since:', since);
		const promises = [];
		let n = 0;
		payload.repos = results.map(item => {
			const contributorsOptions = {
				uri: `${GIT_API}/repos/${owner}/${item.name}/contributors`,
				qs,
				headers,
				json: true
			};
			const commitOptions = {
				uri: `${GIT_API}/repos/${owner}/${item.name}/commits?since=${since}`,
				qs,
				headers,
				json: true
			};
			let contributorsCacheName = `${owner}_contributors_${item.name}`;
			let commitsCacheName = `${owner}_commits_${item.name}`;
			// 获取每个分支的缓存,如果时间不小于3:20,就重新获取
			let contributors;
			promises.push(_processContributors(contributorsCacheName, contributorsOptions).then(results => {
				// 如果 cts 是缓存数据,直接返回缓存 cms 数据
				if (!results.results) {
					contributors = {
						entryDate: new Date(),
						results
					};
				} else {
					contributors = results;
				}
				payload.commits.total += contributors.results[0].contributions;
				let commitsCache = localStorage.getItem(commitsCacheName);
				if (contributors.cache) {
					if (commitsCache) {
						return JSON.parse(commitsCache);
					}
					return request(commitOptions);
				}
				let oldData = localStorage.fetchItem(contributorsCacheName);
				// 新 cts 数据重新缓存
				localStorage.setItem(contributorsCacheName, JSON.stringify(contributors));
				// 判断 cms 是否有更新,如果没有更新直接返回缓存 cms
				if (oldData.results && oldData.results[0].contributions == contributors.results[0].contributions) {
					if (commitsCache) {
						return JSON.parse(commitsCache);
					}
				}
				return request(commitOptions);
			}).then(results => {
				if (!contributors.cache) {
					// 新 cms 数据重新缓存
					localStorage.setItem(commitsCacheName, JSON.stringify(results));
				}
				let repo = {
					total: contributors.results[0].contributions,
					today: 0,
					week: null,
				};
				repo.week = getWeekData(results, 'commit.committer.date');
				repo.today = repo.week[6];
				payload.commits.week = _.zipWith(payload.commits.week, repo.week, (a, b) => a + b);
				payload.commits.list[item.name] = repo;
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
		}, 60000);
		return Promise.all(promises);
	}).then(() => {
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

function _processContributors (contributorsCacheName, options) {
	return localStorage.fetchItem(contributorsCacheName, false).then(result => {
		// 判断分支缓存时间
		if (Date.now() - new Date(result.entryDate) < 300000) {
			result.cache = true;
			return result;
		}
		return request(options);
	});
}
module.exports = {
	query,
	git,
};

const request = require('request-promise');
const DateTime = require('common/dateTime');
const moment = require('moment');
const debug = require('debug')('server:Aggregation');
const nconf = require('nconf');

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

const git = (req, res, next) => {
	debug('git start');
	const owner = req.params.owner;
	const headers = {
		'User-Agent': req.serverName
	};
	const qs = {
		access_token: nconf.get('ACCESS_TOKEN').replace(/[A-Z]/g, '')
	};
	const format = 'YYYY-MM-DD';
	const payload = {
		entryDate: null,
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
	request(reposOptions).then(results => {
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
			promises.push(request(commitOptions).then(results => {
				let repo = {
					total: results.length,
					today: 0,
					week: [0, 0, 0, 0, 0, 0, 0],
				};
				let dateTime = new DateTime(new Date(), format);
				let sevenDays = [];
				for (let i = 0; i < 7; i++) {
					sevenDays[i] = dateTime.offsetInDays(-1 * i);
				}
				let weekCommits = [];
				results.forEach(elem => {
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
		return Promise.all(promises);
	}).then(() => {
		payload.commits.week.reverse();
		payload.entryDate = Date.now();
		res.json(payload);
		next();
	}).catch(err => {
		next(err);
	});
};
module.exports = {
	query,
	git,
};

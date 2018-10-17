
const request = require('request-promise');
const DateTime = require('common/dateTime');
const moment = require('moment');

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
	let payload = {
		weekCommits: []
	};

	let commitOptions = {
		uri: 'https://api.github.com/repos/lglong519/form-libs/commits',
		headers: {
			'User-Agent': 'MoFunc.com'
		},
		json: true
	};
	let promises = [
		request(commitOptions).then(results => {
			let format = 'YYYY-MM-DD';
			let dateTime = new DateTime(new Date(), format);
			let week = [];
			for (let i = 0; i < 7; i++) {
				week[i] = dateTime.offsetInDays(-1 * i);
			}
			let weekCommits = [];
			results.forEach(elem => {
				let date = moment(elem.commit.committer.date).format(format);
				let index = week.indexOf(date);
				if (index > -1) {
					if (!weekCommits[index]) {
						weekCommits[index] = [];
					}
					weekCommits[index].push(elem);
				}
			});
			weekCommits.forEach((item, i) => {
				payload.weekCommits[i] = item.length;
			});
			payload.weekCommits.reverse();
			payload.commits = {
				total: results.length
			};
		})
	];
	Promise.all(promises).then(() => {
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

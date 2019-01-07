const DateTime = require('./dateTime');
import * as moment from 'moment';
import * as _ from 'lodash';

const format = 'YYYY-MM-DD';

const getWeekData = (data, dateAttr) => {
	let today = new DateTime(new Date(), format);
	let sevenDays = [];
	let weekCount = [];
	for (let i = 0; i < 7; i++) {
		weekCount[i] = 0;
		sevenDays[i] = today.offsetInDays(-1 * i);
	}
	let weekCommits = [];
	data.forEach(elem => {
		let date = moment(_.get(elem, dateAttr)).format(format);
		let index = sevenDays.indexOf(date);
		if (!weekCommits[index]) {
			weekCommits[index] = [];
		}
		if (index > -1) {
			weekCommits[index].push(elem);
		}
	});
	weekCommits.forEach((item, i) => {
		weekCount[i] = item.length;
	});
	weekCount.reverse();
	return weekCount;
};

module.exports = getWeekData;
export { };

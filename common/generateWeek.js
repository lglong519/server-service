const DateTime = require('./dateTime');
const format = 'YYYY-MM-DD';

module.exports = () => {
	let today = new DateTime(new Date(), format);
	let sevenDays = [];
	let weekCount = [];
	for (let i = 0; i < 7; i++) {
		weekCount[i] = 0;
		sevenDays[i] = {
			$gte: new Date(`${today.offsetInDays(-1 * i)} 00:00`),
			$lt: new Date(`${today.offsetInDays(-1 * i + 1)} 00:00`),
		};
	}
	sevenDays.reverse();
	return sevenDays;
};

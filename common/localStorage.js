const LocalStorage = require('node-localstorage').LocalStorage;
LocalStorage.prototype.fetchItem = function (item) {
	let data = this.getItem(item);
	if (!data) {
		data = {
			entryDate: 0,
			repos: [],
			commits: {
				total: 0,
				today: 0,
				week: [0, 0, 0, 0, 0, 0, 0],
				list: {}
			}
		};
		this.setItem(item, JSON.stringify(data));
	} else {
		data = JSON.parse(data);
	}
	return data;
};
const localStorage = new LocalStorage('./.storage');
module.exports = localStorage;

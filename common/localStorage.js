const LocalStorage = require('node-localstorage').LocalStorage;
LocalStorage.prototype.fetchItem = function (item, async = true) {
	let data = this.getItem(item);
	if (!data) {
		data = {
			cache: true, // 判断数据的来源
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
	if (async) {
		return data;
	}
	return Promise.resolve(data);
};
const localStorage = new LocalStorage('./.storage');
module.exports = localStorage;

const MongoClient = require('mongodb').MongoClient;
const debug = require('../modules/Debug')('task:reset');
const moment = require('moment');

module.exports = () => {
	debug(`\nreset all ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
	let url = 'mongodb://127.0.0.1:27017';
	MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
		if (err) throw err;
		debug('数据库已连接');
		let db = client.db('service_db');
		db.collection('tiebas').updateMany({
			active: true,
			void: false,
			status: {
				$ne: 'pendding'
			}
		}, {
			$set: {
				status: 'pendding',
				desc: '',
				updatedAt: new Date()
			}
		}).then(() => {
			debug('reset success');
			client.close();
		}).catch(err => {
			debug(err);
			client.close();
		});
	});
};

if (process.env.res === '1') {
	module.exports();
}

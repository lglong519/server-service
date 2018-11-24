const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('server:sign');

let url = 'mongodb://127.0.0.1:27017';
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
	if (err) throw err;
	debug('数据库已连接');
	let db = client.db('service_db');
	db.collection('tiebas').updateMany({
		active: true,
		void: false,
	}, {
		$set: {
			status: 'pendding',
			desc: '',
		}
	}).then(() => {
		debug('reset success');
		client.close();
	}).catch(err => {
		debug(err);
		client.close();
	});
});

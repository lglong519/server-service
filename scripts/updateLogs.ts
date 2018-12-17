const debug = require('../modules/Debug').default('task:updateLogs');
const moment = require('moment');
const fs = require('fs');

export = () => {
	debug(`update logs ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
	const path = '/root/.pm2/logs/';
	const logs = [
		'task',
		'svc',
		'mongo',
		'ws',
		'yun',
	];
	logs.forEach(log => {
		let out = `${path + log}-out.log`;
		let error = `${path + log}-error.log`;
		if (fs.existsSync(out)) {
			fs.rename(out, `${path + moment().format('YYYY-MM-DD-') + log}-out.log`, err => {
				err && debug(out, err);
			});
		}
		if (fs.existsSync(error)) {
			fs.rename(error, `${path + moment().format('YYYY-MM-DD-') + log}-error.log`, err => {
				err && debug(error, err);
			});
		}
	});
};

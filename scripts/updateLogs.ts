const debug = require('../modules/Debug').default('task:updateLogs');
const moment = require('moment');
import * as fs from 'fs';

const updateLogs = () => {
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
			fs.renameSync(out, `${path + moment().format('YYYY-MM-DD-') + log}-out.log`);
		}
		fs.appendFileSync(out, '1');
		if (fs.existsSync(error)) {
			fs.renameSync(error, `${path + moment().format('YYYY-MM-DD-') + log}-error.log`);
		}
		fs.appendFileSync(error, '1');
	});
};
export = updateLogs;
if (process.env.res === '1') {
	updateLogs();
}

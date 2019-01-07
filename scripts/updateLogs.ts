const debug = require('../modules/Debug').default('task:updateLogs');
import * as moment from 'moment';
import * as fs from 'fs';
import * as child_process from 'child_process';

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
	child_process.exec('pm2 restart all', (err, stdout, stderr) => {
		err && debug('restart err', err);
	});
};
export = updateLogs;
if (process.env.res === '1') {
	updateLogs();
}

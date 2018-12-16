const net = require('net');
const debug = require('../modules/Debug')('server:listen');
const host = require('./getHost');
const nconf = require('nconf');

const listenWithoutOccupied = (app, port) => {
	// 创建服务并监听该端口
	let server = net.createServer().listen(port);
	server.on('listening', () => {
		server.close();
		let message;
		message = `\nready on \x1B[33mhttp://${host}:${port}\x1B[39m ,NODE_ENV: \x1B[32m${nconf.get('NODE_ENV')}\x1B[39m\n`;
		app.listen(port, () => {
			debug(message);
		});
	});

	server.on('error', err => {
		server.close();
		if (err.code === 'EADDRINUSE') {
			debug('端口已经被使用:', port);
			listenWithoutOccupied(app, ++port);
			return;
		}
		debug(err);
	});
};
module.exports = listenWithoutOccupied;

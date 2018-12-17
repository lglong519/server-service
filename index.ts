const restify = require('restify');
const nconf = require('nconf');
const CookieParser = require('restify-cookies');
require('debug').enable('*,-morgan');

require('app-module-path').addPath(__dirname);
require('app-module-path').addPath(`${__dirname}/modules`);

require('Debug').enable('server:*');
const debug = require('Debug').default('server:index');
const listenWithoutOccupied = require('common/listenWithoutOccupied');
const morgan = require('morgan');

nconf.file('.config').env();

nconf.required([
	'NODE_ENV',
	'HOST',
	'PORT',
	'CORS',
]);
process.env.NODE_ENV = nconf.get('NODE_ENV');

const server = restify.createServer({
	name: require(`${process.cwd()}/package`).name
});
server.server.setTimeout(120000);

const { connections, dbsParser } = require('common/mongoose-connections');
const corsMiddleware = require('restify-cors-middleware');
const cors = corsMiddleware(nconf.get('CORS'));

server.use(morgan('dev'));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.use(CookieParser.parse);
server.pre(cors.preflight);
server.use(cors.actual);
server.use(dbsParser);

import greetingRoutes from 'routes/greeting';
greetingRoutes(server);
import serviceRoutes from 'routes/service';
serviceRoutes(server);
import cfopRoutes from 'routes/cfop';
cfopRoutes(server);
import commonRoutes from 'routes/common';
commonRoutes(server);
import tiebaRoutes from 'routes/tieba';
tiebaRoutes(server);
import disRoutes from 'routes/dis';
disRoutes(server);

listenWithoutOccupied(server, nconf.get('PORT'));
server.on('error', err => {
	debug('server', err);
	if ((/EADDRINUSE/i).test(err.code)) {
		debug(`端口:${err.port} 被占用`);
	}
	throw err;
});

connections.catch(err => {
	debug('connections error', err);
	throw err;
});

server.on(
	'after',
	restify.plugins.auditLogger({
		log: require('./modules/bunyanLogger').createLogger({
			name: 'auditlogs',
			streams: [
				{
					type: 'rotating-file',
					path: './logs/auditlogs.log',
					period: '1d',
					count: 30,
					collection: 'auditlogs'
				}
			],
		}),
		body: true,
		event: 'after',
		server,
		printLog: true
	})
);

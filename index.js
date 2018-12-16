const restify = require('restify');
const nconf = require('nconf');
const CookieParser = require('restify-cookies');
require('debug').enable('*,-morgan');

require('app-module-path').addPath(__dirname);
require('app-module-path').addPath(`${__dirname}/modules`);

const debug = require('Debug')('server:index');
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
	name: require('package').name
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

const greetingRoutes = require('routes/greeting');
greetingRoutes(server);
const serviceRoutes = require('routes/service');
serviceRoutes(server);
const cfopRoutes = require('routes/cfop');
cfopRoutes(server);
const commonRoutes = require('routes/common');
commonRoutes(server);
const tiebaRoutes = require('routes/tieba');
tiebaRoutes(server);
const disRoutes = require('routes/dis');
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

const restify = require('restify');
const nconf = require('nconf');
const debug = require('debug')('server:index');
require('debug').enable('*,-morgan');

require('app-module-path').addPath(__dirname);
require('app-module-path').addPath(`${__dirname}/modules`);

const localhost = require('common/getHost');
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

const DATABASES = require('common/mongoose-connections');
const corsMiddleware = require('restify-cors-middleware');
const cors = corsMiddleware(nconf.get('CORS'));

server.use(morgan('dev'));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.pre(cors.preflight);
server.use(cors.actual);
server.use(DATABASES.dbsParser);

const greetingRoutes = require('routes/greeting');
greetingRoutes(server);
const serviceRoutes = require('routes/service');
serviceRoutes(server);
const cfopRoutes = require('routes/cfop');
cfopRoutes(server);

server.listen(nconf.get('PORT'), () => {
	debug('ready on \x1B[33m%s\x1B[39m ,NODE_ENV: \x1B[32m%s\x1B[39m ,localhost: \x1B[35m%s\x1B[39m', server.url, nconf.get('NODE_ENV'), localhost);
});
server.on('error', err => {
	debug(err);
	if ((/EADDRINUSE/i).test(err.code)) {
		debug(`端口:${err.port} 被占用`);
	}
	process.exit();
});

server.on(
	'after',
	restify.plugins.auditLogger({
		log: require('bunyanLogger').createLogger({
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

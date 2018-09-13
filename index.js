const restify = require('restify');
const nconf = require('nconf');
const debug = require('debug');
debug.enable('*,-morgan');

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

server.listen(nconf.get('PORT'), nconf.get('HOST'), () => {
	console.log('ready on \x1B[33m%s\x1B[39m ,NODE_ENV: \x1B[32m%s\x1B[39m ,localhost: \x1B[35m%s\x1B[39m', server.url, nconf.get('NODE_ENV'), localhost);
});

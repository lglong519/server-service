const restify = require('restify');
const nconf = require('nconf');
const localhost = require('./common/getHost');
const morgan = require('morgan');

require('app-module-path').addPath(__dirname);

nconf.file('.config').env();

nconf.required([
	'NODE_ENV',
	'HOST',
	'PORT',
	'CORS',
]);
process.env.NODE_ENV = nconf.get('NODE_ENV');

const server = restify.createServer({});

const DATABASES = require('./common/mongoose-connections');
const corsMiddleware = require('restify-cors-middleware');
const cors = corsMiddleware(nconf.get('CORS'));

server.use(morgan('\x1B[32m:method\x1B[39m :url :status :res[content-length] - :response-time ms HTTP/:http-version'));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.pre(cors.preflight);
server.use(cors.actual);
server.use(DATABASES.dbsParser);

const greetingRoutes = require('./routes/greeting');
greetingRoutes(server);
const serviceRoutes = require('./routes/service');
serviceRoutes(server);

server.listen(nconf.get('PORT'), nconf.get('HOST'), () => {
	console.log('ready on \x1B[33m%s\x1B[39m ,NODE_ENV: \x1B[32m%s\x1B[39m ,localhost: \x1B[35m%s\x1B[39m', server.url, nconf.get('NODE_ENV'), localhost);
});

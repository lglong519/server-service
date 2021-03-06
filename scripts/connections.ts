const nconf = require('nconf');
require('debug').enable('*,-morgan');

require('app-module-path').addPath(`${process.cwd()}/dist`);
require('app-module-path').addPath(`${process.cwd()}/dist/modules`);

nconf.file(`${process.cwd()}/.config`).env();

process.env.NODE_ENV = nconf.get('NODE_ENV');

module.exports = require('common/mongoose-connections').connections;

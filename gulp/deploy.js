const fs = require('fs');
const gulp = require('gulp');
const GulpSSH = require('gulp-ssh');
const nconf = require('nconf');
const replace = require('gulp-replace');

nconf.file('.config');
nconf.required([
	'SERVER',
	'SERVER_USERNAME',
	'SERVER_HOST',
	'SSH_PORT',
	'LOCAL_KEY',
	'PRIVATE_KEY',
]);

let privateKey;
let localKey = nconf.get('LOCAL_KEY');
if (fs.existsSync(localKey)) {
	privateKey = fs.readFileSync(localKey);
} else {
	privateKey = nconf.get('PRIVATE_KEY');
}
if (!privateKey) {
	throw new SyntaxError('Invalid privateKey');
}
const config = {
	host: nconf.get('SERVER_HOST'),
	port: nconf.get('SSH_PORT'),
	username: nconf.get('SERVER_USERNAME'),
	privateKey
};

const gulpSSH = new GulpSSH({
	ignoreErrors: false,
	sshConfig: config
});
const destGlobs = [
	'./**/*.*',
	'./**/*',
	'!**/node_modules/**',
	'!**/logs/**',
];
gulp.task('dest', () => gulp
	.src(destGlobs)
	.pipe(gulpSSH.dest(nconf.get('SERVER'))));

gulp.task('sftp-read-logs', () => {
	let pm2Logs = [
		'service-error.log',
		'service-out.log',
	];
	let promises = [];
	function cPromise (promises, path, logFile) {
		promises.push(new Promise((res, rej) => {
			gulpSSH.sftp('read', path + logFile, {
				filePath: logFile
			})
				.pipe(gulp.dest('logs')).on('finish', () => {
					res();
				}).on('error', err => {
					console.error(err);
					rej(err);
				});
		}));
	}
	pm2Logs.forEach(log => {
		cPromise(promises, '/root/.pm2/logs/', log);
	});
	return Promise.all(promises);
});

gulp.task('sftp-write', () => gulp.src('.config')
	.pipe(replace('"NODE_ENV": "localhost"', '"NODE_ENV": "development"'))
	.pipe(gulpSSH.sftp('write', `${nconf.get('SERVER')}.config`)));

gulp.task('start-server', () => gulpSSH.shell([
	`cd ${nconf.get('SERVER')}`,
	'pm2 start server.json'
], {
	filePath: 'shell.log'
}).pipe(gulp.dest('logs')));

gulp.task(
	'shell',
	gulp.series(
		'dest',
		() => gulpSSH
			.shell([
				`cd ${nconf.get('SERVER')}`,
				'npm install',
				'pm2 start server.json'
			], {
				filePath: 'shell.log'
			})
			.pipe(gulp.dest('logs'))
	)
);

gulp.task(
	'shell.slim',
	gulp.series(
		'dest',
		() => gulpSSH
			.shell([
				`cd ${nconf.get('SERVER')}`,
				'pm2 start server.json'
			], {
				filePath: 'shell.log'
			})
			.pipe(gulp.dest('logs'))
	)
);

gulp.task(
	'deploy',
	gulp.series('shell', 'sftp-read-logs')
);
gulp.task(
	'deploy:sl',
	gulp.series('shell.slim')
);

gulp.task('deploy:single', () => {
	if (process.env.file) {
		if (fs.existsSync(process.env.file)) {
			return gulp
				.src(process.env.file, { base: '.' })
				.pipe(gulpSSH.dest(nconf.get('SERVER')));
		}
		return Promise.reject('FILE_NOT_EXISTS');
	}
	return Promise.reject('MISSING_FILE');
});

gulp.task('sync', gulp.series('deploy:single', 'start-server'));

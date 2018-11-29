const debug = require('../modules/Debug')('task:mongod');
const child_process = require('child_process');
const moment = require('moment');

module.exports = () => {
	debug(`check mongod status ${moment().format('YYYY-MM-DD HH:mm:SS')}\n`);
	child_process.exec('service mongod status', (err, stdout, stderr) => {
		let msg = stdout && stdout.match(/active:(.*)?/i);
		debug(`\n${msg}`);
		if (msg && (/inactive\s*\(dead\)|failed\s*\(Result:/i).test(msg[1].trim())) {
			child_process.execSync('service mongod start');
			child_process.execSync('pm2 start all');
		}
	});
};

/* stdout
mongod.service - High-performance, schema-free document-oriented database
   Loaded: loaded (/lib/systemd/system/mongod.service; disabled; vendor preset: enabled)
   Active: active (running) since Wed 2018-11-28 10:02:05 CST; 6h ago
     Docs: https://docs.mongodb.org/manual
 Main PID: 31142 (mongod)
    Tasks: 45
   Memory: 153.6M
      CPU: 3min 7.842s
   CGroup: /system.slice/mongod.service
           └─31142 /usr/bin/mongod --config /etc/mongod.conf
*/
/*
{ Error: Command failed: service mongod status

    at ChildProcess.exithandler (child_process.js:275:12)
    at emitTwo (events.js:126:13)
    at ChildProcess.emit (events.js:214:7)
    at maybeClose (internal/child_process.js:925:16)
    at Socket.stream.socket.on (internal/child_process.js:346:11)
    at emitOne (events.js:116:13)
    at Socket.emit (events.js:211:7)
    at Pipe._handle.close [as _onclose] (net.js:557:12)
  killed: false,
  code: 3,
  signal: null,
  cmd: 'service mongod status' }
stdout ● mongod.service - High-performance, schema-free document-oriented database
   Loaded: loaded (/lib/systemd/system/mongod.service; disabled; vendor preset: enabled)
   Active: inactive (dead)
     Docs: https://docs.mongodb.org/manual
*/
/*
mongod.service - MongoDB Database Server
   Loaded: loaded (/lib/systemd/system/mongod.service; disabled; vendor preset: enabled)
   Active: failed (Result: signal) since Wed 2018-11-28 19:35:13 CST; 3min 12s ago
     Docs: https://docs.mongodb.org/manual
  Process: 2609 ExecStart=/usr/bin/mongod --config /etc/mongod.conf (code=killed, signal=KILL)
 Main PID: 2609 (code=killed, signal=KILL)
 */
let interfaces = require('os').networkInterfaces();
let values = Object.values(interfaces);
let address = '0.0.0.0';
for (let k of values) {
	if (address !== '0.0.0.0') {
		break;
	}
	for (let i of k) {
		if (!i.address.replace(/[.\d]*/g, '') && i.mac.replace(/[:\d]*/g, '')) {
			if (typeof i.address !== 'string') {
				throw Error(`Invalid Host:${i.address}`);
			}
			address = i.address;
			break;
		}
	}
}
module.exports = address;

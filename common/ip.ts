export default req => {
	let ip = req.headers['x-client-ip'] || req.headers['x-real-ip'] || req.connection.remoteAddress || '';
	ip && (ip = ip.replace(/[a-z:]/gi, ''));
	return ip;
};

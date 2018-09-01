function send (message) {
	return (req, res, next) => {
		res.send(message);
		return next();
	};
}
module.exports = server => {
	server.get('/', send('Welcome to: dev.mofunc.com'));
	server.get('/services', send('Welcome to: MoFunc Services'));
};

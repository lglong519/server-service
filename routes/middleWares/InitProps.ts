export = (req, res, next) => {
	res.header('access-control-allow-credentials', true);
	req.session = {};
	next();
};

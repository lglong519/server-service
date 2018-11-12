const beforeSave = (req, model, cb) => {
	if (!model.user) {
		model.user = req.session.user;
	}
	cb();
};
module.exports = beforeSave;

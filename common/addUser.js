const beforeSave = (req, model, cb) => {
	model.user = req.session.user;
	cb();
};
module.exports = beforeSave;

import * as _ from 'lodash';

const profile = (req, res, next) => {
	let User = req.db.model('User');
	User.findById(req.session.user).exec().then(result => {
		res.json(_.pick(result, User.NonPrivacy()));
		next();
	}).catch(err => {
		next(err);
	});
};
export = {
	profile
};

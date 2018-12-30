const _ = require('lodash');
export default (req, model, cb) => {
	cb(null, _.pick(model, ['_id', 'inc', 'username', 'client', 'email', 'phone', 'image', 'updatedAt', 'createdAt']));
};

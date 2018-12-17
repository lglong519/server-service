const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	var: {
		type: String,
		required: true,
	},
	link: {
		type: String,
		// required: true,
	},
	isActive: {
		type: Boolean,
		default: true
	}
});

module.exports = db => db.model('Package', mainSchema, 'packages');
module.exports(mongoose);
export { };

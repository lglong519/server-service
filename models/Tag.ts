const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	label: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		enum: ['primary', 'success', 'info', 'warning', 'danger'],
		default: 'primary'
	},
});

module.exports = db => db.model('Tag', mainSchema, 'tags');
module.exports(mongoose);
export { };

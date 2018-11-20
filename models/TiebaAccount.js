const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	account: {
		type: String,
		required: true,
	},
	uid: {
		type: Number,
		required: true,
	},
	BDUSS: {
		type: String,
	},
	active: {
		type: Boolean,
		default: false
	},
	sequence: {
		type: Number,
		default: Date.now,
		index: true
	},
});

module.exports = db => db.model('TiebaAccount', mainSchema, 'tiebaaccounts');
module.exports(mongoose);

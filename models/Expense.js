const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	amount: {
		type: Number,
		required: true,
		index: true,
	},
	type: {
		type: String,
		enum: ['food', 'general'],
		required: true,
	},
	note: {
		type: String,
		default: '',
	},
});

module.exports = db => db.model('Expense', mainSchema, 'expenses');
module.exports(mongoose);

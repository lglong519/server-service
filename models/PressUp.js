const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	count: {
		type: Number,
		required: true,
	},
	referenceDate: {
		type: Date,
		default: Date.now,
	}
});

module.exports = db => db.model('PressUp', mainSchema, 'pressups');
module.exports(mongoose);

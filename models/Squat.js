const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	count: {
		type: Number,
		required: true,
	},
	referenceDate: {
		type: Date,
		default: Date.now(),
	}
});

module.exports = db => db.model('Squat', mainSchema, 'squats');
module.exports(mongoose);

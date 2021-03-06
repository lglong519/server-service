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
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
});

module.exports = db => db.model('Waist', mainSchema, 'waists');
module.exports(mongoose);
export { };

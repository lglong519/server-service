const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	order: {
		type: Number,
		default: -1
	},
	number: {
		type: Number,
		required: true,
	},
	image: {
		type: String,
		required: true,
	},
	formula: {
		type: String,
		required: true,
	},
	reletive: {
		type: String,
		default: ''
	},
	video: {
		type: String,
	},
	description: {
		type: String,
		default: 'Orientation of last layer'
	},
});

module.exports = db => db.model('OLL', mainSchema, 'olls');
module.exports(mongoose);

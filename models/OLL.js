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
	from: {
		type: Schema.Types.ObjectId,
		ref: 'F2L'
	},
	to: {
		type: Schema.Types.ObjectId,
		ref: 'F2L'
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
	tags: [{
		type: Schema.Types.ObjectId,
		ref: 'Tag'
	}],
});

module.exports = db => db.model('OLL', mainSchema, 'olls');
module.exports(mongoose);

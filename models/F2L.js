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
		default: 'First 2 layers'
	},
	tags: [{
		type: Schema.Types.ObjectId,
		ref: 'Tag'
	}],
});

module.exports = db => db.model('F2L', mainSchema, 'f2ls');
module.exports(mongoose);

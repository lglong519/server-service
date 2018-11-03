const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	title: {
		type: String,
		required: true,
		index: true,
	},
	author: {
		type: String,
		default: '',
	},
	description: {
		type: String,
		default: '',
	},
	type: {
		type: String,
		enum: ['music', 'article', 'movie', 'fiction', 'novel'],
		required: true,
	},
	status: {
		type: String,
		default: '',
	},
	date: {
		type: Date,
		default: Date.now
	},
	link: {
		type: String,
	},
	note: {
		type: String,
		default: '',
	},
	tags: [{
		type: Schema.Types.ObjectId,
		ref: 'Tag'
	}],
	data: {
		type: Schema.Types.Mixed,
	},
});

module.exports = db => db.model('Entertainment', mainSchema, 'entertainments');
module.exports(mongoose);

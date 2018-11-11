const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	title: {
		type: String,
		required: true,
		index: true,
	},
	description: {
		type: String,
		default: '',
	},
	type: {
		type: String,
		enum: ['music', 'article', 'movie', 'fiction', 'novel', 'ev'],
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
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
});

module.exports = db => db.model('Favorite', mainSchema, 'favorites');
module.exports(mongoose);

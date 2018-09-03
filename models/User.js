const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const mainSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	phone: {
		type: String,
		unique: true,
		index: true,
	},
	password: {
		type: String,
		required: true,
	},
	client: {
		type: String,
		required: true,
	},
	inc: {
		type: Number,
		default: 0
	},
	data: {
		type: Schema.Types.Mixed
	},
});

mainSchema.plugin(timestamps);
module.exports = db => db.model('User', mainSchema, 'users');
module.exports(mongoose);

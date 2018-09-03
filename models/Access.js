const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const mainSchema = new Schema({
	action: {
		type: String,
		required: true
	},
	ip: {
		type: String,
		required: true
	},
	resource: {
		type: String,
		required: true
	},
	resources: [
		Schema.Types.Mixed,
	],
	host: {
		type: String
	},
	referer: {
		type: String
	},
	referers: [
		Schema.Types.Mixed,
	],
	client: {
		type: String
	},
	clients: [
		Schema.Types.Mixed,
	],
	inc: {
		type: Number,
		default: 1
	},
});

mainSchema.plugin(timestamps);
module.exports = db => db.model('Access', mainSchema, 'accesses');
module.exports(mongoose);

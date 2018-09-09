const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	action: {
		type: String,
		required: true
	},
	ip: {
		type: String,
		required: true
	},
	host: {
		type: String
	},
	resource: {
		type: String,
		required: true
	},
	resources: {
		type: Schema.Types.Mixed,
	},
	referer: {
		type: String
	},
	referers: {
		type: Schema.Types.Mixed,
	},
	client: {
		type: String
	},
	clients: {
		type: Schema.Types.Mixed,
	},
	bodies: {
		type: Schema.Types.Mixed,
	},
	inc: {
		type: Number,
		default: 1
	},
});

module.exports = db => db.model('Access', mainSchema, 'accesses');
module.exports(mongoose);

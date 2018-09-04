const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const mainSchema = new Schema({
	model: {
		type: String,
		required: true
	},
	data: {
		type: Schema.Types.Mixed,
		required: true
	}
});

mainSchema.plugin(timestamps);
module.exports = db => db.model('RecycleBin', mainSchema, 'recyclebins');
module.exports(mongoose);

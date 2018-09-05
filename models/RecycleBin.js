const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	model: {
		type: String,
		required: true
	},
	id: {
		type: Schema.Types.Mixed,
		required: true
	},
	data: {
		type: Schema.Types.Mixed,
		required: true
	}
});

module.exports = db => db.model('RecycleBin', mainSchema, 'recyclebins');
module.exports(mongoose);

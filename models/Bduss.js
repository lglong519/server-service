const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	un: {
		type: String,
	},
	uid: {
		type: Number,
	},
	BDUSS: {
		type: String,
	},
});

module.exports = db => db.model('Bduss', mainSchema, 'bdusses');
module.exports(mongoose);

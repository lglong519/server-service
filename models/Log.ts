const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	event: {
		type: String,
	},
	model: {
		type: String,
	},
	id: {
		type: Schema.Types.ObjectId,
	},
	data: {
		type: Schema.Types.Mixed
	},
});

module.exports = db => db.model('Log', mainSchema, 'logs');
module.exports(mongoose);
export { };

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	nickname: {
		type: String,
	},
	email: {
		type: String,
	},
	contents: {
		type: String,
	},
});

module.exports = db => db.model('Message', mainSchema, 'messages');
module.exports(mongoose);
export { };

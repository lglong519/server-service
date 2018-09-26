const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	count: {
		type: Number,
		default: 0
	},
});

module.exports = db => db.model('PressUp', mainSchema, 'pressups');
module.exports(mongoose);

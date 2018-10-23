const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	req: {
		type: Schema.Types.Mixed,
	},
	/*
	res: {
		type: Schema.Types.Mixed,
	},
	err: {
		type: Schema.Types.Mixed,
	},
	*/
	time: {
		type: Date,
		index: true,
	},
});

module.exports = db => db.model('Auditlog', mainSchema, 'auditlogs');
module.exports(mongoose);

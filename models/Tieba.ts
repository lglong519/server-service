const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	tiebaAccount: {
		type: Schema.Types.ObjectId,
		ref: 'TiebaAccount',
		required: true,
	},
	fid: {
		type: String,
		required: true,
	},
	kw: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ['pending', 'resolve', 'reject'],
		default: 'pending',
		required: true,
	},
	desc: {
		type: String,
		default: '',
	},
	level_id: {
		type: Number,
		default: 0,
	},
	cur_score: {
		type: Number,
		default: 0,
	},
	void: {
		type: Boolean,
		default: false,
	},
	active: {
		type: Boolean,
		default: true
	},
	sequence: {
		type: Number,
		default: Date.now,
		index: true
	},
});

module.exports = db => db.model('Tieba', mainSchema, 'tiebas');
module.exports(mongoose);
export { };

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
		enum: ['pendding', 'resolve', 'reject'],
		default: 'pendding',
		required: true,
	},
	desc: {
		type: String,
		default: '',
	},
	level_id: {
		type: Number,
	},
	cur_score: {
		type: Number,
	},
	avatar: {
		type: String,
	},
	void: {
		type: Boolean,
		default: false,
	},
});

module.exports = db => db.model('Tieba', mainSchema, 'tiebas');
module.exports(mongoose);

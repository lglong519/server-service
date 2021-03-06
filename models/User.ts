const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { encrypt } = require('common/mongoose-plugins');

const mainSchema = new Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	email: {
		type: String,
		unique: true,
		sparse: true,
		index: true,
	},
	phone: {
		type: String,
		unique: true,
		sparse: true,
		index: true,
	},
	password: {
		type: String,
		required: true,
	},
	client: {
		type: String,
		enum: ['ACC', 'CNS', 'BOOK'],
		required: true,
	},
	inc: {
		type: Number,
		default: 0
	},
	image: {
		type: String,
	},
	data: {
		type: Schema.Types.Mixed
	},
	sequence: {
		type: Number,
		default: Date.now,
		index: true
	},
	role: {
		type: String,
		enum: ['admin', 'user'],
		default: 'user'
	},
});

mainSchema.plugin(encrypt, { paths: ['email', 'phone', 'password'] });
module.exports = db => db.model('User', mainSchema, 'users');
module.exports(mongoose);
export { };

mainSchema.statics.NonPrivacy = () => [
	'_id',
	'username',
	'email',
	'phone',
	'inc',
	'client',
	'image',
	'data',
	'updatedAt',
	'createdAt',
];

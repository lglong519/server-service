
const Joi = require('joi');
const debug = require('debug')('server:cfop');
const Errors = require('restify-errors');

class Reorder {

	modeName: string;
	constructor (modeName: string) {
		this.modeName = modeName;
	}

	init () {
		return (req, res, next) => {
			const schema = Joi.array().items(Joi.alternatives(Joi.string(), Joi.object().keys({
				_id: Joi.string().required()
			}).unknown())).min(1).required();
			const validate = Joi.validate(req.body, schema);
			if (validate.error) {
				debug('validate.error', validate.error);
				return next(new Errors.InvalidArgumentError(validate.error));
			}
			let params = validate.value;
			console.log(typeof params);
			Promise.all(params.map((item, i) => {
				let id = item._id || item;
				return req.db.model(this.modeName).findByIdAndUpdate(
					id,
					{
						order: i
					},
					{
						new: true
					}
				).lean();
			})).then(results => {
				results.sort((a: any, b: any) => a.order - b.order);
				res.json(results);
				next();
			}).catch(err => {
				debug(err);
				next(err);
			});
		};
	}

}

export = {
	F2Ls: new Reorder('F2L').init(),
	OLLs: new Reorder('OLL').init(),
	PLLs: new Reorder('PLL').init(),
};

// 1. 传入一个时间生成一个对象
// 2. 计算时间差的接口
// offsetInDays
// offsetInHours
// offsetInMinutes
// offsetInSeconds
// format：'YYYY-MM-DD HH:mm:SS'
import * as Joi from 'joi';
import * as moment from 'moment';

/**
 * @param {Date} [time] 被计算的时间，默认：当前时间
 * @param {String} [format] 时间格式化的格式
 * @returns
 {
  _time: 2018-09-10T04:14:43.195Z,
  format: undefined,
  time: 2018-09-10T04:14:43.195Z
 }
 */
class DateTime {

	_time: Date;
	time: Date|string|number;
	_format?: string;
	constructor (time?: string|number, format?: string) {
		const validate = Joi.validate(time, Joi.date().default(Date.now()));
		if (validate.error) {
			throw validate.error;
		}
		this._time = new Date(validate.value);
		this._format = format;
		if (format) {
			this.time = moment(this._time).format(format);
		} else {
			this.time = this._time;
		}
	}
	offsetInDays (days: number) {
		const validate = Joi.validate(days, Joi.number().required());
		if (validate.error) {
			throw validate.error;
		}
		this.time = new Date(this._time.getTime() + days * 24 * 60 * 60 * 1000);
		if (this._format) {
			this.time = moment(this.time).format(this._format);
		}
		return this.time;
	}
	offsetInHours (hours: number) {
		const validate = Joi.validate(hours, Joi.number().required());
		if (validate.error) {
			throw validate.error;
		}
		this.time = new Date(this._time.getTime() + hours * 60 * 60 * 1000);
		if (this._format) {
			this.time = moment(this.time).format(this._format);
		}
		return this.time;
	}
	offsetInMinutes (minutes: number) {
		const validate = Joi.validate(minutes, Joi.number().required());
		if (validate.error) {
			throw validate.error;
		}
		this.time = new Date(this._time.getTime() + minutes * 60 * 1000);
		if (this._format) {
			this.time = moment(this.time).format(this._format);
		}
		return this.time;
	}
	offsetInSeconds (seconds: number) {
		const validate = Joi.validate(seconds, Joi.number().required());
		if (validate.error) {
			throw validate.error;
		}
		this.time = new Date(this._time.getTime() + seconds * 1000);
		if (this._format) {
			this.time = moment(this.time).format(this._format);
		}
		return this.time;
	}
	format (pattern: string) {
		const validate = Joi.validate(pattern, Joi.string().required());
		if (validate.error) {
			throw validate.error;
		}
		this._format = pattern;
		this.time = moment(this.time).format(this._format);
		return this.time;
	}

}

export = DateTime;

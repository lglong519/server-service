
/**
 *
 * @Description 邮件发送
 * 调用方法:sendMail('xx@xx.com','邮件测试标题', 'Hi,这是邮件测试内容，支持html');
 * @Author Amor
 * @Created 2018/09/01 15:10
 *
 */

const nodemailer = require('nodemailer');
const SmtpTransport = require('nodemailer-smtp-transport');
const nconf = require('nconf');

nconf.required([
	'MAIL_SERVICE:service',
	'MAIL_SERVICE:user',
	'MAIL_SERVICE:pass',
]);

const smtpTransport = nodemailer.createTransport(SmtpTransport({
	service: nconf.get('MAIL_SERVICE:service'),
	auth: {
		user: nconf.get('MAIL_SERVICE:user'),
		pass: nconf.get('MAIL_SERVICE:pass')
	}
}));

/**
 * @param {String} recipient 收件人
 * @param {String} subject 发送的主题
 * @param {String} html 发送的html内容
 * @returns {Object} response
 * {
 * 	accepted: [ '769141564@qq.com' ],
		rejected: [],
		response: '250 Ok: queued as ',
		envelope: { from: 'mofunc@qq.com', to: [ '769141564@qq.com' ] },
		messageId: '6c1c046e-910a-1843-1614-89f6373e98f0@qq.com'
	}
 */
const sendMail = function (recipient, subject, html) {
	return new Promise((res, rej) => {
		smtpTransport.sendMail({
			from: nconf.get('MAIL_SERVICE:user'),
			to: recipient,
			subject,
			html
		}, (error, response) => {
			if (error) {
				console.log(error);
				rej(error);
			} else {
				console.log('发送成功', response);
				res(response);
			}
		});
	});
};
export default sendMail;

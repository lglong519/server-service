const account = /^\w{3,15}$/;
const email = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
const CHNPhone = /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/;
const password = /^\w{6,18}$/;
const pwd_hard = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;
module.exports = {
	account,
	email,
	CHNPhone,
	password,
	pwd_hard,
};

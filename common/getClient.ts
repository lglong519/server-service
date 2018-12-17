const platformReg = /Android|iPhone|iPad|iOS/i;
const getPlatform = client => {
	let mobilePlatform = client.match(platformReg);
	if (mobilePlatform) {
		return `${mobilePlatform[0]} `;
	}
	let pcPlatform = client.match(/Macintosh|Windows|Linux/i);
	if (pcPlatform) {
		return `${pcPlatform[0]} `;
	}
	return '';
};
const getClient = client => {
	if (!client) {
		return;
	}
	let platform = getPlatform(client);
	let Mobile = '';
	if ((/Mobile/i).test(client)) {
		Mobile = ' Mobile';
	}
	if ((/MicroMessenger/i).test(client)) {
		return `${platform}wechat${Mobile}`;
	}
	if ((/UCBrowser/i).test(client)) {
		return `${platform}UCBrowser${Mobile}`;
	}
	if ((/Chrome\/[.0-9]*\s?(Mobile)?\s?Safari\/[.0-9]*?/i).test(client)) {
		return `${platform}Chrome${Mobile}`;
	}
	let bot = client.match(/\w*(bot|spider)/i);
	if (bot) {
		return bot[0];
	}
	let site = client.match(/http[s]?:[^)]*/i);
	if (site) {
		return `${platform}${site[0]}${Mobile}`;
	}
	return platform + client.slice(0, 20);
};
module.exports = getClient;
export { };

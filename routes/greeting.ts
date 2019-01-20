function send (message) {
	return (req, res, next) => {
		res.setHeader('Content-Type', 'text/html;charset=utf-8');
		res.writeHead(200);
		res.end(`
		<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAGbAAABmwGoxMJ2AAAAB3RJTUUH4wEMEhAUZAjktgAABQFJREFUWMO9l99vk1UYxz/nvG/bja1b1zLYDyZjwwBDyERQDDEIISqEREy8MIYtauIV3sB/4U1J1BsTrwAvNBEFTdRoFAkXBDGDZL9gyq8NZWMbXdfRte97zvHi7fbStV03EniSN21Pz3m+z/t9fh5xfMDh6KYAx/udLgNHgE4gxJORDHAF+OxYR+BUfMBBAMT7nZPAYZ6unDzWEegW8T6nC8GJx9VSZUNtUCCByYzhoVrW8S4bwUePA1xpCd5vtwhZ+eufDLoos2Q1R2xg63KADRC2BR8+axX9b5nSaQMVS9mpDLy6WhIJCqJBUXSPa8DVgACxNAMqZLkdjobtMcn2mODyhOa7YUXflC6694shl/U1goPNEr1EOuxyb32gWdIzaRibNUgBloCL45qQBTtikhnX0JswXBrXKAP/TBtupQz7my3OjyrSZYJSxPudorZmNbzeJDk/qgkHYIUtqLQgIMEWAgNklJkPuKyGlAvTjiGjwDFwaI3FH6OKjF4iA9p4aRUNCtprBOuqBZ119vKrjYbhGUNfQrO30eKHEYUllmDAngaLbVFRNgsc7T3KQMo1pByPAQEELai2YVWFoG2NhRTQusHm02sutljEgCqbouBzgL0JQ8+k5kHWIABRJtK1gTdbLNaHBQHp/WYxA4oVj6Fpw093Fe4j/1nCM8qY3OejOWXBrPINuDNjsCWssGBzRDKU1KUNSCuYyBhiIc/MUzcVY7Nm3mhHQ1OlYGe9oKFSEpCeMVYJJrTx64IysKtesDIEt1OG2zN+RuVlgSVgX6PkrwnD/Yy3HJLe2toqSYVVmvKUa0hmIa2htUqUDLo5mXLgXlrnB6EyEAkK7mc0jobdqyU7VxbWqrSC/oTmbtowkfGakDJ+XHTWSfY1eudupgyDU5p11YKNtb6u2gDUBmRhIbKER9/BZsnmSD54Igu/jyqGkgZbeIAAUnjPHPW7Vvnnfv5XMeN6HfPjPpfno5IdMUldsEQlfJCFLZFC8KGk4fSwIii9YlRK2sJewQLomdTMuN73SNA715fQ9ExqtkUlexqKMHB+TPNBW76zb6YMZ0Y88MVECnirxT97cVwjc4zGQmI+WIMSehOaa0lNgcoNYYEt8/391S1VNqgM8Fqjf/D7Eb8PxEKCS+OmaKMrMODl+vyl3+6pgqGjmESDsCkXZBMZw/Wkl8LaQGu1YLBEB81DE7kg9FML+hLl+6ot4b1235tf31bzQRkOQLWdz2pJAxbK5XG9aMCBV2jefsan6MywT31Gw656ybnR0j1ZLvTjo65uqFzc8a6B3Q2Sxty+v6cNN1Ie9VkNB5okF+7rReOn4P1upHxf9U5p3miS1AQK5z1l4IWo5MWYp2Iyazh9R82/yIEmyZ8ThodumcxZuPDLfz7UxhrJt8OarXWSLRFJUHrKlfGmob0NPvjn1xW2hLVVgkMtkl/vaZLOEuJn4cKsMtyYNrSFBc9FBCMPBRfGNK6B/U0WQ0nN3kZJbcDjdXTWcHZY88pqSXu14Js7ilvDZqlDKSLe76QXTsbawKEWi/awr2bGNVQtmCh+vKsZTHqzoMQvzcuQtA1cBV5aWNHOjiiiQcE7rd7l41Hwqw8M50bV/ORrLR94Tq6IeJ/zLoIvF78F+YNIJjeOPT5mXtZ1zV1OTwBdT/NmKuDk0Y5At4wPOBzrCHTnbscXgdkniDubwzh8tCPQHR9w+B+ApAgKYQcJfAAAAABJRU5ErkJggg=="/>
		<style> div,h5{ margin:0 auto; text-align:center; } h1{ display:inline; color:#22C0FF; } </style>
		<title>More Fun</title>
		<div> Welcome to <h1>${message}</h1> </div>
		<div><a href="http://mofunc.com">前往首页</a></div>
		`);
		return next();
	};
}
export default server => {
	server.get('/', send('dev.mofunc.com'));
	server.get('/services', send('MoFunc Services'));
};

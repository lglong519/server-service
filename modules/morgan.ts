/* !
 * morgan
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var auth = require('basic-auth')
var debug = require('./Debug').default('server:morgan')
var deprecate = require('depd')('morgan')
var onFinished = require('on-finished')
var onHeaders = require('on-headers')

/**
 * Default log buffer duration.
 * @private
 */

var DEFAULT_BUFFER_DURATION = 1000

interface Logger{
	(req: any, res: any, next: any): void;
}

type formater = string|object|undefined;
/**
 * Create a logger middleware.
 *
 * @public
 * @param {String|Function} format
 * @param {Object} [options]
 * @return {Function} middleware
 */

function morgan (format?: formater, options?): Logger {
	var fmt: formater = format
	var opts = options || {}

	if (format && typeof format === 'object') {
		opts = format
		fmt = opts.format || 'default'

		// smart deprecation message
		deprecate('morgan(options): use morgan(' + (typeof fmt === 'string' ? JSON.stringify(fmt) : 'format') + ', options) instead')
	}

	if (fmt === undefined) {
		deprecate('undefined format: specify a format')
	}

	// output on request instead of response
	var immediate = opts.immediate

	// check if log entry should be skipped
	var skip = opts.skip || false

	// format function
	var formatLine = typeof fmt !== 'function'
		? getFormatFunction(fmt)
		: fmt

	// stream
	var buffer = opts.buffer
	var stream = opts.stream || process.stdout

	// buffering support
	if (buffer) {
		deprecate('buffer option')

		// flush interval
		var interval = typeof buffer !== 'number'
			? DEFAULT_BUFFER_DURATION
			: buffer

		// swap the stream
		stream = createBufferStream(stream, interval)
	}

	return function logger (req, res, next) {
		// request data
		req._startAt = undefined
		req._startTime = undefined
		req._remoteAddress = getip(req)

		// response data
		res._startAt = undefined
		res._startTime = undefined

		// record request start
		recordStartTime.call(req)

		function logRequest () {
			if (skip !== false && skip(req, res)) {
				debug('skip request')
				return
			}

			var line = formatLine(morgan, req, res)

			if (line == null) {
				debug('skip line')
				return
			}

			// debug('log request')
			stream.write(line + '\n')
		}

		if (immediate) {
			// immediate log
			logRequest()
		} else {
			// record response start
			onHeaders(res, recordStartTime)

			// log when response finished
			onFinished(res, logRequest)
		}

		next()
	}
}

morgan.default = '';

/**
 * Define a format with the given name.
 *
 * @param {string} name
 * @param {string|function} fmt
 * @public
 */
morgan.format = format;
function format (name, fmt) {
	morgan[name] = fmt
	return this
}

/**
 * Define a token function with the given name,
 * and callback fn(req, res).
 *
 * @param {string} name
 * @param {function} fn
 * @public
 */
morgan.token = token;
function token (name, fn) {
	morgan[name] = fn
	return this
}

/**
 * Apache combined log format.
 */

morgan.format('combined', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"')

/**
 * Apache common log format.
 */

morgan.format('common', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]')

/**
 * Default format.
 */

morgan.format('default', ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"')
deprecate.property(morgan, 'default', 'default format: use combined format')

/**
 * Short format.
 */

morgan.format('short', ':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms')

/**
 * Tiny format.
 */

morgan.format('tiny', ':method :url :status :res[content-length] - :response-time ms')

/**
 * dev (colored)
 */

morgan.format('dev', function developmentFormatLine (tokens, req, res) {
	// get the status code if response written
	var status = headersSent(res)
		? res.statusCode
		: undefined

	// get status color
	var color = status >= 500 ? 31 // red
		: status >= 400 ? 33 // yellow
			: status >= 300 ? 36 // cyan
				: status >= 200 ? 32 // green
					: 0 // no color

	// get colored function
	var fn = developmentFormatLine[color]

	if (!fn) {
		// compile
		fn = developmentFormatLine[color] = compile('\x1b[' + color + 'm:method \x1b[0m:url \x1b[' +
      color + 'm:status \x1b[0m:response-time ms - :date[clf]\x1b[0m')
	}

	return fn(tokens, req, res)
})

/**
 * request url
 */

morgan.token('url', function getUrlToken (req) {
	return req.originalUrl || req.url
})

/**
 * request method
 */

morgan.token('method', function getMethodToken (req) {
	return req.method
})

/**
 * response time in milliseconds
 */

morgan.token('response-time', function getResponseTimeToken (req, res, digits) {
	if (!req._startAt || !res._startAt) {
		// missing request and/or response start time
		return
	}

	// calculate diff
	var ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6

	// return truncated value
	return ms.toFixed(digits === undefined ? 3 : digits)
})

/**
 * current date
 */

morgan.token('date', function getDateToken (req, res, format) {
	var date = new Date()

	switch (format || 'web') {
		case 'clf':
			return date.toLocaleString()
		case 'iso':
			return date.toISOString()
		case 'web':
			return date.toUTCString()
	}
})

/**
 * response status code
 */

morgan.token('status', function getStatusToken (req, res) {
	return headersSent(res)
		? String(res.statusCode)
		: undefined
})

/**
 * normalized referrer
 */

morgan.token('referrer', function getReferrerToken (req) {
	return req.headers['referer'] || req.headers['referrer']
})

/**
 * remote address
 */

morgan.token('remote-addr', getip)

/**
 * remote user
 */

morgan.token('remote-user', function getRemoteUserToken (req) {
	// parse basic credentials
	var credentials = auth(req)

	// return username
	return credentials
		? credentials.name
		: undefined
})

/**
 * HTTP version
 */

morgan.token('http-version', function getHttpVersionToken (req) {
	return req.httpVersionMajor + '.' + req.httpVersionMinor
})

/**
 * UA string
 */

morgan.token('user-agent', function getUserAgentToken (req) {
	return req.headers['user-agent']
})

/**
 * request header
 */

morgan.token('req', function getRequestToken (req, res, field) {
	// get header
	var header = req.headers[field.toLowerCase()]

	return Array.isArray(header)
		? header.join(', ')
		: header
})

/**
 * response header
 */

morgan.token('res', function getResponseHeader (req, res, field) {
	if (!headersSent(res)) {
		return undefined
	}

	// get header
	var header = res.getHeader(field)

	return Array.isArray(header)
		? header.join(', ')
		: header
})

/**
 * Compile a format string into a function.
 *
 * @param {string} format
 * @return {function}
 * @public
 */
morgan.compile = compile;
function compile (format) {
	if (typeof format !== 'string') {
		throw new TypeError('argument format must be a string')
	}

	var fmt = format.replace(/"/g, '\\"')
	var js = '  "use strict"\n  return "' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function (_, name, arg) {
		var tokenArguments = 'req, res'
		var tokenFunction = 'tokens[' + String(JSON.stringify(name)) + ']'

		if (arg !== undefined) {
			tokenArguments += ', ' + String(JSON.stringify(arg))
		}

		return '" +\n    (' + tokenFunction + '(' + tokenArguments + ') || "-") + "'
	}) + '"'

	// eslint-disable-next-line no-new-func
	return new Function('tokens, req, res', js)
}

/**
 * Create a basic buffering stream.
 *
 * @param {object} stream
 * @param {number} interval
 * @public
 */

function createBufferStream (stream, interval) {
	var buf = []
	var timer = null

	// flush function
	function flush () {
		timer = null
		stream.write(buf.join(''))
		buf.length = 0
	}

	// write function
	function write (str) {
		if (timer === null) {
			timer = setTimeout(flush, interval)
		}

		buf.push(str)
	}

	// return a minimal "stream"
	return { write }
}

/**
 * Lookup and compile a named format function.
 *
 * @param {string} name
 * @return {function}
 * @public
 */

function getFormatFunction (name) {
	// lookup format
	var fmt = morgan[name] || name || morgan.default

	// return compiled format
	return typeof fmt !== 'function'
		? compile(fmt)
		: fmt
}

/**
 * Get request IP address.
 *
 * @private
 * @param {IncomingMessage} req
 * @return {string}
 */

function getip (req) {
	return req.headers['x-client-ip'] || req.headers['x-real-ip'] || (req.connection && req.connection.remoteAddress) || req.ip || undefined;
	// return req.ip ||
	// req._remoteAddress ||
	// (req.connection && req.connection.remoteAddress) ||
	// undefined
}

/**
 * Determine if the response headers have been sent.
 *
 * @param {object} res
 * @returns {boolean}
 * @private
 */

function headersSent (res) {
	return typeof res.headersSent !== 'boolean'
		? Boolean(res._header)
		: res.headersSent
}

/**
 * Record the start time.
 * @private
 */

function recordStartTime () {
	this._startAt = process.hrtime()
	this._startTime = new Date()
}

/**
 * Module exports.
 * @public
 */

export = morgan;
// module.exports.getip = getip

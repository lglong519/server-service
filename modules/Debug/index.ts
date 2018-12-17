/**
 * Module dependencies.
 */

const util = require('util');

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

const ms = require('ms');
// import ms from 'ms';
export const humanize = ms;

/**
 * Active `debug` instances.
 */
export const instances = [];

/**
 * The currently active debug mode names, and names to skip.
 */

export let names = [];
export let skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

export const formatters: {
	'O'?: any;
	'o'?: any;
} = {};

export let colors = [6, 2, 3, 4, 5, 1];

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor (namespace) {
	let hash = 0, i;

	for (i in namespace) {
		hash = (hash << 5) - hash + namespace.charCodeAt(i);
		hash |= 0; // Convert to 32bit integer
	}

	return colors[Math.abs(hash) % colors.length];
}

interface Debug{
	(...params): void;
	diff: any;
	prev: any;
	curr: any;
	enabled: any;
	useColors: any;
	color: any;
	destroy: any;
	namespace: any;
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */
export default function createDebug (namespace) {

	let prevTime;
	let debug = <Debug> function (...params) {
		// disabled?
		if (!debug.enabled) return;

		let self: Debug = debug;

		// set `diff` timestamp
		let curr = +new Date();
		let ms = curr - (prevTime || curr);
		self.diff = ms;
		self.prev = prevTime;
		self.curr = curr;
		prevTime = curr;

		// turn the `arguments` into a proper Array
		let args = new Array(params.length);
		for (let i = 0; i < args.length; i++) {
			args[i] = params[i];
		}

		args[0] = coerce(args[0]);

		if ('string' !== typeof args[0]) {
			// anything else let's inspect with %O
			args.unshift('%O');
		}

		// apply any `formatters` transformations
		let index = 0;
		args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
			// if we encounter an escaped % then don't increase the array index
			if (match === '%%') return match;
			index++;
			let formatter = formatters[format];
			if ('function' === typeof formatter) {
				let val = args[index];
				match = formatter.call(self, val);

				// now we need to remove `args[index]` since it's inlined in the `format`
				args.splice(index, 1);
				index--;
			}
			return match;
		});

		// apply env-specific formatting (colors, etc.)
		formatArgs.call(self, args);
		args[0] && (args[0] = new Date().toLocaleString() + args[0]);
		let logFn = console.info.bind(console);// debug.log || exports.log ||
		logFn.apply(self, args);
	};
	debug.namespace = namespace;
	debug.enabled = enabled(namespace);
	debug.useColors = useColors();
	debug.color = selectColor(namespace);
	debug.destroy = destroy;

	// env-specific initialization logic for debug instances
	if ('function' === typeof init) {
		init(debug);
	}

	instances.push(debug);

	return debug;
}

function destroy () {
	let index = instances.indexOf(this);
	if (index !== -1) {
		instances.splice(index, 1);
		return true;
	}
	return false;

}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */
export function enable (namespaces) {
	save(namespaces);

	names = [];
	skips = [];

	let i;
	let split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
	let len = split.length;

	for (i = 0; i < len; i++) {
		if (!split[i]) continue; // ignore empty strings
		namespaces = split[i].replace(/\*/g, '.*?');
		if (namespaces[0] === '-') {
			skips.push(new RegExp(`^${namespaces.substr(1)}$`));
		} else {
			names.push(new RegExp(`^${namespaces}$`));
		}
	}

	for (i = 0; i < instances.length; i++) {
		let instance = instances[i];
		instance.enabled = enabled(instance.namespace);
	}
}

/**
 * Disable debug output.
 *
 * @api public
 */

export function disable () {
	enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

export function enabled (name) {
	if (name[name.length - 1] === '*') {
		return true;
	}
	let i, len;
	for (i = 0, len = skips.length; i < len; i++) {
		if (skips[i].test(name)) {
			return false;
		}
	}
	for (i = 0, len = names.length; i < len; i++) {
		if (names[i].test(name)) {
			return true;
		}
	}
	return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

export function coerce (val) {
	if (val instanceof Error) return val.stack || val.message;
	return val;
}

// ----------------------------------------------------------------------------

/**
 * This is the Node.js implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

// exps = module.exps = require('./debug');
// exps.init = init;
// exps.log = log;
// exps.formatArgs = formatArgs;
// exps.save = save;
// exps.load = load;
// exps.useColors = useColors;

/**
 * Colors.
 */

try {
	let supportsColor = require('supports-color');
	if (supportsColor && supportsColor.level >= 2) {
		colors = [
			20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68,
			69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134,
			135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
			172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204,
			205, 206, 207, 208, 209, 214, 215, 220, 221
		];
	}
} catch (err) {
	// swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

export const inspectOpts: { colors?: any; hideDate?: any } = Object.keys(process.env).filter(key => {
	return (/^debug_/i).test(key);
}).reduce((obj, key) => {
	// camel-case
	let prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// coerce string value into JS value
	let val: any = process.env[key];
	if ((/^(yes|on|true|enabled)$/i).test(val)) val = true;
	else if ((/^(no|off|false|disabled)$/i).test(val)) val = false;
	else if (val === 'null') val = null;
	else val = Number(val);

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

export function useColors () {
	if ('colors' in inspectOpts) {
		return Boolean(inspectOpts.colors);
	}
	let stderr: any = process.stderr;
	return stderr.fd;
}

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts)
		.split('\n').map(str => {
			return str.trim();
		}).join(' ');
};

/**
 * Map %o to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts);
};

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

export function formatArgs (args) {
	let name = this.namespace;
	let useColors = this.useColors;

	if (useColors) {
		let c = this.color;
		let colorCode = `\u001b[3${c < 8 ? c : `8;5;${c}`}`;
		let prefix = `  ${colorCode};1m${name} ` + '\u001b[0m';

		args[0] = prefix + args[0].split('\n').join(`\n${prefix}`);
		args.push(`${colorCode}m+${humanize(this.diff)}\u001b[0m`);
	} else {
		args[0] = `${getDate() + name} dd ${args[0]}`;
	}
}

function getDate () {
	if (inspectOpts.hideDate) {
		return '';
	}
	return `${new Date().toLocaleString()} `;

}

/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */

export function log (...args) {
	return process.stderr.write(`${util.format(...args)}\n`);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

export function save (namespaces) {
	if (null == namespaces) {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	} else {
		process.env.DEBUG = namespaces;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

export function load () {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

export function init (debug) {
	debug.inspectOpts = {};

	let keys = Object.keys(inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = inspectOpts[keys[i]];
	}
}

/**
 * Enable namespaces listed in `process.env.DEBUG` initially.
 */

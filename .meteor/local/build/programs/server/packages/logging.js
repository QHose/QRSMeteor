(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EJSON = Package.ejson.EJSON;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Log;

var require = meteorInstall({"node_modules":{"meteor":{"logging":{"logging.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/logging/logging.js                                                                                 //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  Log: () => Log
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const hasOwn = Object.prototype.hasOwnProperty;

function Log(...args) {
  Log.info(...args);
} /// FOR TESTING


let intercept = 0;
let interceptedLines = [];
let suppress = 0; // Intercept the next 'count' calls to a Log function. The actual
// lines printed to the console can be cleared and read by calling
// Log._intercepted().

Log._intercept = count => {
  intercept += count;
}; // Suppress the next 'count' calls to a Log function. Use this to stop
// tests from spamming the console, especially with red errors that
// might look like a failing test.


Log._suppress = count => {
  suppress += count;
}; // Returns intercepted lines and resets the intercept counter.


Log._intercepted = () => {
  const lines = interceptedLines;
  interceptedLines = [];
  intercept = 0;
  return lines;
}; // Either 'json' or 'colored-text'.
//
// When this is set to 'json', print JSON documents that are parsed by another
// process ('satellite' or 'meteor run'). This other process should call
// 'Log.format' for nice output.
//
// When this is set to 'colored-text', call 'Log.format' before printing.
// This should be used for logging from within satellite, since there is no
// other process that will be reading its standard output.


Log.outputFormat = 'json';
const LEVEL_COLORS = {
  debug: 'green',
  // leave info as the default color
  warn: 'magenta',
  error: 'red'
};
const META_COLOR = 'blue'; // Default colors cause readability problems on Windows Powershell,
// switch to bright variants. While still capable of millions of
// operations per second, the benchmark showed a 25%+ increase in
// ops per second (on Node 8) by caching "process.platform".

const isWin32 = typeof process === 'object' && process.platform === 'win32';

const platformColor = color => {
  if (isWin32 && typeof color === 'string' && !color.endsWith('Bright')) {
    return `${color}Bright`;
  }

  return color;
}; // XXX package


const RESTRICTED_KEYS = ['time', 'timeInexact', 'level', 'file', 'line', 'program', 'originApp', 'satellite', 'stderr'];
const FORMATTED_KEYS = [...RESTRICTED_KEYS, 'app', 'message'];

const logInBrowser = obj => {
  const str = Log.format(obj); // XXX Some levels should be probably be sent to the server

  const level = obj.level;

  if (typeof console !== 'undefined' && console[level]) {
    console[level](str);
  } else {
    // XXX Uses of Meteor._debug should probably be replaced by Log.debug or
    //     Log.info, and we should have another name for "do your best to
    //     call call console.log".
    Meteor._debug(str);
  }
}; // @returns {Object: { line: Number, file: String }}


Log._getCallerDetails = () => {
  const getStack = () => {
    // We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
    // pre-parsed stack) since it's impossible to compose it with the use of
    // Error.prepareStackTrace used on the server for source maps.
    const err = new Error();
    const stack = err.stack;
    return stack;
  };

  const stack = getStack();

  if (!stack) {
    return {};
  } // looking for the first line outside the logging package (or an
  // eval if we find that first)


  let line;
  const lines = stack.split('\n').slice(1);

  for (line of lines) {
    if (line.match(/^\s*at eval \(eval/)) {
      return {
        file: "eval"
      };
    }

    if (!line.match(/packages\/(?:local-test[:_])?logging(?:\/|\.js)/)) {
      break;
    }
  }

  const details = {}; // The format for FF is 'functionName@filePath:lineNumber'
  // The format for V8 is 'functionName (packages/logging/logging.js:81)' or
  //                      'packages/logging/logging.js:81'

  const match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line);

  if (!match) {
    return details;
  } // in case the matched block here is line:column


  details.line = match[2].split(':')[0]; // Possible format: https://foo.bar.com/scripts/file.js?random=foobar
  // XXX: if you can write the following in better way, please do it
  // XXX: what about evals?

  details.file = match[1].split('/').slice(-1)[0].split('?')[0];
  return details;
};

['debug', 'info', 'warn', 'error'].forEach(level => {
  // @param arg {String|Object}
  Log[level] = arg => {
    if (suppress) {
      suppress--;
      return;
    }

    let intercepted = false;

    if (intercept) {
      intercept--;
      intercepted = true;
    }

    let obj = arg === Object(arg) && !(arg instanceof RegExp) && !(arg instanceof Date) ? arg : {
      message: new String(arg).toString()
    };
    RESTRICTED_KEYS.forEach(key => {
      if (obj[key]) {
        throw new Error(`Can't set '${key}' in log message`);
      }
    });

    if (hasOwn.call(obj, 'message') && typeof obj.message !== 'string') {
      throw new Error("The 'message' field in log objects must be a string");
    }

    if (!obj.omitCallerDetails) {
      obj = (0, _objectSpread2.default)({}, Log._getCallerDetails(), obj);
    }

    obj.time = new Date();
    obj.level = level; // XXX allow you to enable 'debug', probably per-package

    if (level === 'debug') {
      return;
    }

    if (intercepted) {
      interceptedLines.push(EJSON.stringify(obj));
    } else if (Meteor.isServer) {
      if (Log.outputFormat === 'colored-text') {
        console.log(Log.format(obj, {
          color: true
        }));
      } else if (Log.outputFormat === 'json') {
        console.log(EJSON.stringify(obj));
      } else {
        throw new Error(`Unknown logging output format: ${Log.outputFormat}`);
      }
    } else {
      logInBrowser(obj);
    }
  };
}); // tries to parse line as EJSON. returns object if parse is successful, or null if not

Log.parse = line => {
  let obj = null;

  if (line && line.startsWith('{')) {
    // might be json generated from calling 'Log'
    try {
      obj = EJSON.parse(line);
    } catch (e) {}
  } // XXX should probably check fields other than 'time'


  if (obj && obj.time && obj.time instanceof Date) {
    return obj;
  } else {
    return null;
  }
}; // formats a log object into colored human and machine-readable text


Log.format = (obj, options = {}) => {
  obj = (0, _objectSpread2.default)({}, obj); // don't mutate the argument

  let {
    time,
    timeInexact,
    level = 'info',
    file,
    line: lineNumber,
    app: appName = '',
    originApp,
    message = '',
    program = '',
    satellite = '',
    stderr = ''
  } = obj;

  if (!(time instanceof Date)) {
    throw new Error("'time' must be a Date object");
  }

  FORMATTED_KEYS.forEach(key => {
    delete obj[key];
  });

  if (Object.keys(obj).length > 0) {
    if (message) {
      message += ' ';
    }

    message += EJSON.stringify(obj);
  }

  const pad2 = n => n.toString().padStart(2, '0');

  const pad3 = n => n.toString().padStart(3, '0');

  const dateStamp = time.getFullYear().toString() + pad2(time.getMonth() + 1
  /*0-based*/
  ) + pad2(time.getDate());
  const timeStamp = pad2(time.getHours()) + ':' + pad2(time.getMinutes()) + ':' + pad2(time.getSeconds()) + '.' + pad3(time.getMilliseconds()); // eg in San Francisco in June this will be '(-7)'

  const utcOffsetStr = `(${-(new Date().getTimezoneOffset() / 60)})`;
  let appInfo = '';

  if (appName) {
    appInfo += appName;
  }

  if (originApp && originApp !== appName) {
    appInfo += ` via ${originApp}`;
  }

  if (appInfo) {
    appInfo = `[${appInfo}] `;
  }

  const sourceInfoParts = [];

  if (program) {
    sourceInfoParts.push(program);
  }

  if (file) {
    sourceInfoParts.push(file);
  }

  if (lineNumber) {
    sourceInfoParts.push(lineNumber);
  }

  let sourceInfo = !sourceInfoParts.length ? '' : `(${sourceInfoParts.join(':')}) `;
  if (satellite) sourceInfo += `[${satellite}]`;
  const stderrIndicator = stderr ? '(STDERR) ' : '';
  const metaPrefix = [level.charAt(0).toUpperCase(), dateStamp, '-', timeStamp, utcOffsetStr, timeInexact ? '? ' : ' ', appInfo, sourceInfo, stderrIndicator].join('');

  const prettify = function (line, color) {
    return options.color && Meteor.isServer && color ? require('cli-color')[color](line) : line;
  };

  return prettify(metaPrefix, platformColor(options.metaColor || META_COLOR)) + prettify(message, platformColor(LEVEL_COLORS[level]));
}; // Turn a line of text into a loggable object.
// @param line {String}
// @param override {Object}


Log.objFromText = (line, override) => {
  return (0, _objectSpread2.default)({
    message: line,
    level: 'info',
    time: new Date(),
    timeInexact: true
  }, override);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"cli-color":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// node_modules/meteor/logging/node_modules/cli-color/package.json                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
exports.name = "cli-color";
exports.version = "0.2.3";
exports.main = "lib";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// node_modules/meteor/logging/node_modules/cli-color/lib/index.js                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
'use strict';

var d       = require('es5-ext/lib/Object/descriptor')
  , extend  = require('es5-ext/lib/Object/extend')
  , map     = require('es5-ext/lib/Object/map')
  , reduce  = require('es5-ext/lib/Object/reduce')
  , repeat  = require('es5-ext/lib/String/prototype/repeat')
  , memoize = require('memoizee')
  , tty     = require('tty')

  , join = Array.prototype.join, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties, abs = Math.abs
  , floor = Math.floor, max = Math.max, min = Math.min

  , mods, proto, getFn, getMove, xtermMatch
  , up, down, right, left, getHeight, memoized;

mods = extend({
	// Style
	bold:      { _bold: [1, 22] },
	italic:    { _italic: [3, 23] },
	underline: { _underline: [4, 24] },
	blink:     { _blink: [5, 25] },
	inverse:   { _inverse: [7, 27] },
	strike:    { _strike: [9, 29] }
},

	// Color
	['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
		.reduce(function (obj, color, index) {
		// foreground
		obj[color] = { _fg: [30 + index, 39] };
		obj[color + 'Bright'] = { _fg: [90 + index, 39] };

		// background
		obj['bg' + color[0].toUpperCase() + color.slice(1)] =
			{ _bg: [40 + index, 49] };
		obj['bg' + color[0].toUpperCase() + color.slice(1) + 'Bright'] =
			{ _bg: [100 + index, 49] };

		return obj;
	}, {}));

// Some use cli-color as: console.log(clc.red('Error!'));
// Which is inefficient as on each call it configures new clc object
// with memoization we reuse once created object
memoized = memoize(function (scope, mod) {
	return defineProperty(getFn(), '_cliColorData',
		d(extend({}, scope._cliColorData, mod)));
});

proto = Object.create(Function.prototype, extend(map(mods, function (mod) {
	return d.gs(function () { return memoized(this, mod); });
}), {
	// xterm (255) color
	xterm: d(memoize(function (code) {
		code = isNaN(code) ? 255 : min(max(code, 0), 255);
		return defineProperty(getFn(), '_cliColorData',
			d(extend({}, this._cliColorData, {
				_fg: [xtermMatch ? xtermMatch[code] : ('38;5;' + code), 39]
			})));
	}, { method: 'xterm' })),
	bgXterm: d(memoize(function (code) {
		code = isNaN(code) ? 255 : min(max(code, 0), 255);
		return defineProperty(getFn(), '_cliColorData',
			d(extend({}, this._cliColorData, {
				_bg: [xtermMatch ? (xtermMatch[code] + 10) : ('48;5;' + code), 49]
			})));
	}, { method: 'bgXterm' }))
}));

if (process.platform === 'win32') {
	xtermMatch = require('./_xterm-match');
}

getFn = function () {
	var fn = function (/*…msg*/) {
		var data = fn._cliColorData, close = '';
		return reduce(data, function (str, mod) {
			close = '\x1b[' + mod[1] + 'm' + close;
			return str + '\x1b[' + mod[0] + 'm';
		}, '', true) + join.call(arguments, ' ') + close;
	};
	fn.__proto__ = proto;
	return fn;
};

getMove = function (control) {
	return function (num) {
		num = isNaN(num) ? 0 : max(floor(num), 0);
		return num ? ('\x1b[' + num + control) : '';
	};
};

module.exports = defineProperties(getFn(), {
	width: d.gs(process.stdout.getWindowSize ? function () {
		return process.stdout.getWindowSize()[0];
	} : function () {
		return tty.getWindowSize ? tty.getWindowSize()[1] : 0;
	}),
	height: d.gs(getHeight = process.stdout.getWindowSize ? function () {
		return process.stdout.getWindowSize()[1];
	} : function () {
		return tty.getWindowSize ? tty.getWindowSize()[0] : 0;
	}),
	reset: d.gs(function () {
		return repeat.call('\n', getHeight() - 1) + '\x1bc';
	}),
	up: d(up = getMove('A')),
	down: d(down = getMove('B')),
	right: d(right = getMove('C')),
	left: d(left = getMove('D')),
	move: d(function (x, y) {
		x = isNaN(x) ? 0 : floor(x);
		y = isNaN(y) ? 0 : floor(y);
		return ((x > 0) ? right(x) : left(-x)) + ((y > 0) ? down(y) : up(-y));
	}),
	moveTo: d(function (x, y) {
		x = isNaN(x) ? 1 : (max(floor(x), 0) + 1);
		y = isNaN(y) ? 1 : (max(floor(y), 0) + 1);
		return '\x1b[' + y + ';' + x + 'H';
	}),
	bol: d(function (n/*, erase*/) {
		var dir;
		n = isNaN(n) ? 0 : Number(n);
		dir = (n >= 0) ? 'E' : 'F';
		n = floor(abs(n));
		return arguments[1] ?
				(((!n || (dir === 'F')) ? '\x1b[0E\x1bK' : '') +
					repeat.call('\x1b[1' + dir + '\x1b[K', n)) : '\x1b[' + n + dir;
	}),
	beep: d('\x07'),
	xtermSupported: d(!xtermMatch),
	_cliColorData: d({})
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/logging/logging.js");

/* Exports */
Package._define("logging", exports, {
  Log: Log
});

})();

//# sourceURL=meteor://💻app/packages/logging.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbG9nZ2luZy9sb2dnaW5nLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkxvZyIsIk1ldGVvciIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJoYXNPd24iLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImFyZ3MiLCJpbmZvIiwiaW50ZXJjZXB0IiwiaW50ZXJjZXB0ZWRMaW5lcyIsInN1cHByZXNzIiwiX2ludGVyY2VwdCIsImNvdW50IiwiX3N1cHByZXNzIiwiX2ludGVyY2VwdGVkIiwibGluZXMiLCJvdXRwdXRGb3JtYXQiLCJMRVZFTF9DT0xPUlMiLCJkZWJ1ZyIsIndhcm4iLCJlcnJvciIsIk1FVEFfQ09MT1IiLCJpc1dpbjMyIiwicHJvY2VzcyIsInBsYXRmb3JtIiwicGxhdGZvcm1Db2xvciIsImNvbG9yIiwiZW5kc1dpdGgiLCJSRVNUUklDVEVEX0tFWVMiLCJGT1JNQVRURURfS0VZUyIsImxvZ0luQnJvd3NlciIsIm9iaiIsInN0ciIsImZvcm1hdCIsImxldmVsIiwiY29uc29sZSIsIl9kZWJ1ZyIsIl9nZXRDYWxsZXJEZXRhaWxzIiwiZ2V0U3RhY2siLCJlcnIiLCJFcnJvciIsInN0YWNrIiwibGluZSIsInNwbGl0Iiwic2xpY2UiLCJtYXRjaCIsImZpbGUiLCJkZXRhaWxzIiwiZXhlYyIsImZvckVhY2giLCJhcmciLCJpbnRlcmNlcHRlZCIsIlJlZ0V4cCIsIkRhdGUiLCJtZXNzYWdlIiwiU3RyaW5nIiwidG9TdHJpbmciLCJrZXkiLCJjYWxsIiwib21pdENhbGxlckRldGFpbHMiLCJ0aW1lIiwicHVzaCIsIkVKU09OIiwic3RyaW5naWZ5IiwiaXNTZXJ2ZXIiLCJsb2ciLCJwYXJzZSIsInN0YXJ0c1dpdGgiLCJlIiwib3B0aW9ucyIsInRpbWVJbmV4YWN0IiwibGluZU51bWJlciIsImFwcCIsImFwcE5hbWUiLCJvcmlnaW5BcHAiLCJwcm9ncmFtIiwic2F0ZWxsaXRlIiwic3RkZXJyIiwia2V5cyIsImxlbmd0aCIsInBhZDIiLCJuIiwicGFkU3RhcnQiLCJwYWQzIiwiZGF0ZVN0YW1wIiwiZ2V0RnVsbFllYXIiLCJnZXRNb250aCIsImdldERhdGUiLCJ0aW1lU3RhbXAiLCJnZXRIb3VycyIsImdldE1pbnV0ZXMiLCJnZXRTZWNvbmRzIiwiZ2V0TWlsbGlzZWNvbmRzIiwidXRjT2Zmc2V0U3RyIiwiZ2V0VGltZXpvbmVPZmZzZXQiLCJhcHBJbmZvIiwic291cmNlSW5mb1BhcnRzIiwic291cmNlSW5mbyIsImpvaW4iLCJzdGRlcnJJbmRpY2F0b3IiLCJtZXRhUHJlZml4IiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJwcmV0dGlmeSIsIm1ldGFDb2xvciIsIm9iakZyb21UZXh0Iiwib3ZlcnJpZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsT0FBSSxNQUFJQTtBQUFULENBQWQ7QUFBNkIsSUFBSUMsTUFBSjtBQUFXSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNGLFNBQU9HLENBQVAsRUFBUztBQUFDSCxhQUFPRyxDQUFQO0FBQVM7O0FBQXBCLENBQXRDLEVBQTRELENBQTVEO0FBRXhDLE1BQU1DLFNBQVNDLE9BQU9DLFNBQVAsQ0FBaUJDLGNBQWhDOztBQUVBLFNBQVNSLEdBQVQsQ0FBYSxHQUFHUyxJQUFoQixFQUFzQjtBQUNwQlQsTUFBSVUsSUFBSixDQUFTLEdBQUdELElBQVo7QUFDRCxDLENBRUQ7OztBQUNBLElBQUlFLFlBQVksQ0FBaEI7QUFDQSxJQUFJQyxtQkFBbUIsRUFBdkI7QUFDQSxJQUFJQyxXQUFXLENBQWYsQyxDQUVBO0FBQ0E7QUFDQTs7QUFDQWIsSUFBSWMsVUFBSixHQUFrQkMsS0FBRCxJQUFXO0FBQzFCSixlQUFhSSxLQUFiO0FBQ0QsQ0FGRCxDLENBSUE7QUFDQTtBQUNBOzs7QUFDQWYsSUFBSWdCLFNBQUosR0FBaUJELEtB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a2FnZXMvbG9nZ2luZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG5jb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5mdW5jdGlvbiBMb2coLi4uYXJncykge1xuICBMb2cuaW5mbyguLi5hcmdzKTtcbn1cblxuLy8vIEZPUiBURVNUSU5HXG5sZXQgaW50ZXJjZXB0ID0gMDtcbmxldCBpbnRlcmNlcHRlZExpbmVzID0gW107XG5sZXQgc3VwcHJlc3MgPSAwO1xuXG4vLyBJbnRlcmNlcHQgdGhlIG5leHQgJ2NvdW50JyBjYWxscyB0byBhIExvZyBmdW5jdGlvbi4gVGhlIGFjdHVhbFxuLy8gbGluZXMgcHJpbnRlZCB0byB0aGUgY29uc29sZSBjYW4gYmUgY2xlYXJlZCBhbmQgcmVhZCBieSBjYWxsaW5nXG4vLyBMb2cuX2ludGVyY2VwdGVkKCkuXG5Mb2cuX2ludGVyY2VwdCA9IChjb3VudCkgPT4ge1xuICBpbnRlcmNlcHQgKz0gY291bnQ7XG59O1xuXG4vLyBTdXBwcmVzcyB0aGUgbmV4dCAnY291bnQnIGNhbGxzIHRvIGEgTG9nIGZ1bmN0aW9uLiBVc2UgdGhpcyB0byBzdG9wXG4vLyB0ZXN0cyBmcm9tIHNwYW1taW5nIHRoZSBjb25zb2xlLCBlc3BlY2lhbGx5IHdpdGggcmVkIGVycm9ycyB0aGF0XG4vLyBtaWdodCBsb29rIGxpa2UgYSBmYWlsaW5nIHRlc3QuXG5Mb2cuX3N1cHByZXNzID0gKGNvdW50KSA9PiB7XG4gIHN1cHByZXNzICs9IGNvdW50O1xufTtcblxuLy8gUmV0dXJucyBpbnRlcmNlcHRlZCBsaW5lcyBhbmQgcmVzZXRzIHRoZSBpbnRlcmNlcHQgY291bnRlci5cbkxvZy5faW50ZXJjZXB0ZWQgPSAoKSA9PiB7XG4gIGNvbnN0IGxpbmVzID0gaW50ZXJjZXB0ZWRMaW5lcztcbiAgaW50ZXJjZXB0ZWRMaW5lcyA9IFtdO1xuICBpbnRlcmNlcHQgPSAwO1xuICByZXR1cm4gbGluZXM7XG59O1xuXG4vLyBFaXRoZXIgJ2pzb24nIG9yICdjb2xvcmVkLXRleHQnLlxuLy9cbi8vIFdoZW4gdGhpcyBpcyBzZXQgdG8gJ2pzb24nLCBwcmludCBKU09OIGRvY3VtZW50cyB0aGF0IGFyZSBwYXJzZWQgYnkgYW5vdGhlclxuLy8gcHJvY2VzcyAoJ3NhdGVsbGl0ZScgb3IgJ21ldGVvciBydW4nKS4gVGhpcyBvdGhlciBwcm9jZXNzIHNob3VsZCBjYWxsXG4vLyAnTG9nLmZvcm1hdCcgZm9yIG5pY2Ugb3V0cHV0LlxuLy9cbi8vIFdoZW4gdGhpcyBpcyBzZXQgdG8gJ2NvbG9yZWQtdGV4dCcsIGNhbGwgJ0xvZy5mb3JtYXQnIGJlZm9yZSBwcmludGluZy5cbi8vIFRoaXMgc2hvdWxkIGJlIHVzZWQgZm9yIGxvZ2dpbmcgZnJvbSB3aXRoaW4gc2F0ZWxsaXRlLCBzaW5jZSB0aGVyZSBpcyBub1xuLy8gb3RoZXIgcHJvY2VzcyB0aGF0IHdpbGwgYmUgcmVhZGluZyBpdHMgc3RhbmRhcmQgb3V0cHV0LlxuTG9nLm91dHB1dEZvcm1hdCA9ICdqc29uJztcblxuY29uc3QgTEVWRUxfQ09MT1JTID0ge1xuICBkZWJ1ZzogJ2dyZWVuJyxcbiAgLy8gbGVhdmUgaW5mbyBhcyB0aGUgZGVmYXVsdCBjb2xvclxuICB3YXJuOiAnbWFnZW50YScsXG4gIGVycm9yOiAncmVkJ1xufTtcblxuY29uc3QgTUVUQV9DT0xPUiA9ICdibHVlJztcblxuLy8gRGVmYXVsdCBjb2xvcnMgY2F1c2UgcmVhZGFiaWxpdHkgcHJvYmxlbXMgb24gV2luZG93cyBQb3dlcnNoZWxsLFxuLy8gc3dpdGNoIHRvIGJyaWdodCB2YXJpYW50cy4gV2hpbGUgc3RpbGwgY2FwYWJsZSBvZiBtaWxsaW9ucyBvZlxuLy8gb3BlcmF0aW9ucyBwZXIgc2Vjb25kLCB0aGUgYmVuY2htYXJrIHNob3dlZCBhIDI1JSsgaW5jcmVhc2UgaW5cbi8vIG9wcyBwZXIgc2Vjb25kIChvbiBOb2RlIDgpIGJ5IGNhY2hpbmcgXCJwcm9jZXNzLnBsYXRmb3JtXCIuXG5jb25zdCBpc1dpbjMyID0gdHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XG5jb25zdCBwbGF0Zm9ybUNvbG9yID0gKGNvbG9yKSA9PiB7XG4gIGlmIChpc1dpbjMyICYmIHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycgJiYgIWNvbG9yLmVuZHNXaXRoKCdCcmlnaHQnKSkge1xuICAgIHJldHVybiBgJHtjb2xvcn1CcmlnaHRgO1xuICB9XG4gIHJldHVybiBjb2xvcjtcbn07XG5cbi8vIFhYWCBwYWNrYWdlXG5jb25zdCBSRVNUUklDVEVEX0tFWVMgPSBbJ3RpbWUnLCAndGltZUluZXhhY3QnLCAnbGV2ZWwnLCAnZmlsZScsICdsaW5lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdwcm9ncmFtJywgJ29yaWdpbkFwcCcsICdzYXRlbGxpdGUnLCAnc3RkZXJyJ107XG5cbmNvbnN0IEZPUk1BVFRFRF9LRVlTID0gWy4uLlJFU1RSSUNURURfS0VZUywgJ2FwcCcsICdtZXNzYWdlJ107XG5cbmNvbnN0IGxvZ0luQnJvd3NlciA9IG9iaiA9PiB7XG4gIGNvbnN0IHN0ciA9IExvZy5mb3JtYXQob2JqKTtcblxuICAvLyBYWFggU29tZSBsZXZlbHMgc2hvdWxkIGJlIHByb2JhYmx5IGJlIHNlbnQgdG8gdGhlIHNlcnZlclxuICBjb25zdCBsZXZlbCA9IG9iai5sZXZlbDtcblxuICBpZiAoKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykgJiYgY29uc29sZVtsZXZlbF0pIHtcbiAgICBjb25zb2xlW2xldmVsXShzdHIpO1xuICB9IGVsc2Uge1xuICAgIC8vIFhYWCBVc2VzIG9mIE1ldGVvci5fZGVidWcgc2hvdWxkIHByb2JhYmx5IGJlIHJlcGxhY2VkIGJ5IExvZy5kZWJ1ZyBvclxuICAgIC8vICAgICBMb2cuaW5mbywgYW5kIHdlIHNob3VsZCBoYXZlIGFub3RoZXIgbmFtZSBmb3IgXCJkbyB5b3VyIGJlc3QgdG9cbiAgICAvLyAgICAgY2FsbCBjYWxsIGNvbnNvbGUubG9nXCIuXG4gICAgTWV0ZW9yLl9kZWJ1ZyhzdHIpO1xuICB9XG59O1xuXG4vLyBAcmV0dXJucyB7T2JqZWN0OiB7IGxpbmU6IE51bWJlciwgZmlsZTogU3RyaW5nIH19XG5Mb2cuX2dldENhbGxlckRldGFpbHMgPSAoKSA9PiB7XG4gIGNvbnN0IGdldFN0YWNrID0gKCkgPT4ge1xuICAgIC8vIFdlIGRvIE5PVCB1c2UgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgaGVyZSAoYSBWOCBleHRlbnNpb24gdGhhdCBnZXRzIHVzIGFcbiAgICAvLyBwcmUtcGFyc2VkIHN0YWNrKSBzaW5jZSBpdCdzIGltcG9zc2libGUgdG8gY29tcG9zZSBpdCB3aXRoIHRoZSB1c2Ugb2ZcbiAgICAvLyBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSB1c2VkIG9uIHRoZSBzZXJ2ZXIgZm9yIHNvdXJjZSBtYXBzLlxuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcjtcbiAgICBjb25zdCBzdGFjayA9IGVyci5zdGFjaztcbiAgICByZXR1cm4gc3RhY2s7XG4gIH07XG5cbiAgY29uc3Qgc3RhY2sgPSBnZXRTdGFjaygpO1xuXG4gIGlmICghc3RhY2spIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICAvLyBsb29raW5nIGZvciB0aGUgZmlyc3QgbGluZSBvdXRzaWRlIHRoZSBsb2dnaW5nIHBhY2thZ2UgKG9yIGFuXG4gIC8vIGV2YWwgaWYgd2UgZmluZCB0aGF0IGZpcnN0KVxuICBsZXQgbGluZTtcbiAgY29uc3QgbGluZXMgPSBzdGFjay5zcGxpdCgnXFxuJykuc2xpY2UoMSk7XG4gIGZvciAobGluZSBvZiBsaW5lcykge1xuICAgIGlmIChsaW5lLm1hdGNoKC9eXFxzKmF0IGV2YWwgXFwoZXZhbC8pKSB7XG4gICAgICByZXR1cm4ge2ZpbGU6IFwiZXZhbFwifTtcbiAgICB9XG5cbiAgICBpZiAoIWxpbmUubWF0Y2goL3BhY2thZ2VzXFwvKD86bG9jYWwtdGVzdFs6X10pP2xvZ2dpbmcoPzpcXC98XFwuanMpLykpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRldGFpbHMgPSB7fTtcblxuICAvLyBUaGUgZm9ybWF0IGZvciBGRiBpcyAnZnVuY3Rpb25OYW1lQGZpbGVQYXRoOmxpbmVOdW1iZXInXG4gIC8vIFRoZSBmb3JtYXQgZm9yIFY4IGlzICdmdW5jdGlvbk5hbWUgKHBhY2thZ2VzL2xvZ2dpbmcvbG9nZ2luZy5qczo4MSknIG9yXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICdwYWNrYWdlcy9sb2dnaW5nL2xvZ2dpbmcuanM6ODEnXG4gIGNvbnN0IG1hdGNoID0gLyg/OltAKF18IGF0ICkoW14oXSs/KTooWzAtOTpdKykoPzpcXCl8JCkvLmV4ZWMobGluZSk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4gZGV0YWlscztcbiAgfVxuXG4gIC8vIGluIGNhc2UgdGhlIG1hdGNoZWQgYmxvY2sgaGVyZSBpcyBsaW5lOmNvbHVtblxuICBkZXRhaWxzLmxpbmUgPSBtYXRjaFsyXS5zcGxpdCgnOicpWzBdO1xuXG4gIC8vIFBvc3NpYmxlIGZvcm1hdDogaHR0cHM6Ly9mb28uYmFyLmNvbS9zY3JpcHRzL2ZpbGUuanM/cmFuZG9tPWZvb2JhclxuICAvLyBYWFg6IGlmIHlvdSBjYW4gd3JpdGUgdGhlIGZvbGxvd2luZyBpbiBiZXR0ZXIgd2F5LCBwbGVhc2UgZG8gaXRcbiAgLy8gWFhYOiB3aGF0IGFib3V0IGV2YWxzP1xuICBkZXRhaWxzLmZpbGUgPSBtYXRjaFsxXS5zcGxpdCgnLycpLnNsaWNlKC0xKVswXS5zcGxpdCgnPycpWzBdO1xuXG4gIHJldHVybiBkZXRhaWxzO1xufTtcblxuWydkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InXS5mb3JFYWNoKChsZXZlbCkgPT4ge1xuIC8vIEBwYXJhbSBhcmcge1N0cmluZ3xPYmplY3R9XG4gTG9nW2xldmVsXSA9IChhcmcpID0+IHtcbiAgaWYgKHN1cHByZXNzKSB7XG4gICAgc3VwcHJlc3MtLTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgaW50ZXJjZXB0ZWQgPSBmYWxzZTtcbiAgaWYgKGludGVyY2VwdCkge1xuICAgIGludGVyY2VwdC0tO1xuICAgIGludGVyY2VwdGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGxldCBvYmogPSAoYXJnID09PSBPYmplY3QoYXJnKVxuICAgICYmICEoYXJnIGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICYmICEoYXJnIGluc3RhbmNlb2YgRGF0ZSkpXG4gICAgPyBhcmdcbiAgICA6IHsgbWVzc2FnZTogbmV3IFN0cmluZyhhcmcpLnRvU3RyaW5nKCkgfTtcblxuICBSRVNUUklDVEVEX0tFWVMuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChvYmpba2V5XSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBzZXQgJyR7a2V5fScgaW4gbG9nIG1lc3NhZ2VgKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChoYXNPd24uY2FsbChvYmosICdtZXNzYWdlJykgJiYgdHlwZW9mIG9iai5tZXNzYWdlICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSAnbWVzc2FnZScgZmllbGQgaW4gbG9nIG9iamVjdHMgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgfVxuXG4gIGlmICghb2JqLm9taXRDYWxsZXJEZXRhaWxzKSB7XG4gICAgb2JqID0geyAuLi5Mb2cuX2dldENhbGxlckRldGFpbHMoKSwgLi4ub2JqIH07XG4gIH1cblxuICBvYmoudGltZSA9IG5ldyBEYXRlKCk7XG4gIG9iai5sZXZlbCA9IGxldmVsO1xuXG4gIC8vIFhYWCBhbGxvdyB5b3UgdG8gZW5hYmxlICdkZWJ1ZycsIHByb2JhYmx5IHBlci1wYWNrYWdlXG4gIGlmIChsZXZlbCA9PT0gJ2RlYnVnJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChpbnRlcmNlcHRlZCkge1xuICAgIGludGVyY2VwdGVkTGluZXMucHVzaChFSlNPTi5zdHJpbmdpZnkob2JqKSk7XG4gIH0gZWxzZSBpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgaWYgKExvZy5vdXRwdXRGb3JtYXQgPT09ICdjb2xvcmVkLXRleHQnKSB7XG4gICAgICBjb25zb2xlLmxvZyhMb2cuZm9ybWF0KG9iaiwge2NvbG9yOiB0cnVlfSkpO1xuICAgIH0gZWxzZSBpZiAoTG9nLm91dHB1dEZvcm1hdCA9PT0gJ2pzb24nKSB7XG4gICAgICBjb25zb2xlLmxvZyhFSlNPTi5zdHJpbmdpZnkob2JqKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBsb2dnaW5nIG91dHB1dCBmb3JtYXQ6ICR7TG9nLm91dHB1dEZvcm1hdH1gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbG9nSW5Ccm93c2VyKG9iaik7XG4gIH1cbn07XG59KTtcblxuXG4vLyB0cmllcyB0byBwYXJzZSBsaW5lIGFzIEVKU09OLiByZXR1cm5zIG9iamVjdCBpZiBwYXJzZSBpcyBzdWNjZXNzZnVsLCBvciBudWxsIGlmIG5vdFxuTG9nLnBhcnNlID0gKGxpbmUpID0+IHtcbiAgbGV0IG9iaiA9IG51bGw7XG4gIGlmIChsaW5lICYmIGxpbmUuc3RhcnRzV2l0aCgneycpKSB7IC8vIG1pZ2h0IGJlIGpzb24gZ2VuZXJhdGVkIGZyb20gY2FsbGluZyAnTG9nJ1xuICAgIHRyeSB7IG9iaiA9IEVKU09OLnBhcnNlKGxpbmUpOyB9IGNhdGNoIChlKSB7fVxuICB9XG5cbiAgLy8gWFhYIHNob3VsZCBwcm9iYWJseSBjaGVjayBmaWVsZHMgb3RoZXIgdGhhbiAndGltZSdcbiAgaWYgKG9iaiAmJiBvYmoudGltZSAmJiAob2JqLnRpbWUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgIHJldHVybiBvYmo7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cbi8vIGZvcm1hdHMgYSBsb2cgb2JqZWN0IGludG8gY29sb3JlZCBodW1hbiBhbmQgbWFjaGluZS1yZWFkYWJsZSB0ZXh0XG5Mb2cuZm9ybWF0ID0gKG9iaiwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gIG9iaiA9IHsgLi4ub2JqIH07IC8vIGRvbid0IG11dGF0ZSB0aGUgYXJndW1lbnRcbiAgbGV0IHtcbiAgICB0aW1lLFxuICAgIHRpbWVJbmV4YWN0LFxuICAgIGxldmVsID0gJ2luZm8nLFxuICAgIGZpbGUsXG4gICAgbGluZTogbGluZU51bWJlcixcbiAgICBhcHA6IGFwcE5hbWUgPSAnJyxcbiAgICBvcmlnaW5BcHAsXG4gICAgbWVzc2FnZSA9ICcnLFxuICAgIHByb2dyYW0gPSAnJyxcbiAgICBzYXRlbGxpdGUgPSAnJyxcbiAgICBzdGRlcnIgPSAnJyxcbiAgfSA9IG9iajtcblxuICBpZiAoISh0aW1lIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCIndGltZScgbXVzdCBiZSBhIERhdGUgb2JqZWN0XCIpO1xuICB9XG5cbiAgRk9STUFUVEVEX0tFWVMuZm9yRWFjaCgoa2V5KSA9PiB7IGRlbGV0ZSBvYmpba2V5XTsgfSk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID4gMCkge1xuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICBtZXNzYWdlICs9ICcgJztcbiAgICB9XG4gICAgbWVzc2FnZSArPSBFSlNPTi5zdHJpbmdpZnkob2JqKTtcbiAgfVxuXG4gIGNvbnN0IHBhZDIgPSBuID0+IG4udG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpO1xuICBjb25zdCBwYWQzID0gbiA9PiBuLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgJzAnKTtcblxuICBjb25zdCBkYXRlU3RhbXAgPSB0aW1lLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKSArXG4gICAgcGFkMih0aW1lLmdldE1vbnRoKCkgKyAxIC8qMC1iYXNlZCovKSArXG4gICAgcGFkMih0aW1lLmdldERhdGUoKSk7XG4gIGNvbnN0IHRpbWVTdGFtcCA9IHBhZDIodGltZS5nZXRIb3VycygpKSArXG4gICAgICAgICc6JyArXG4gICAgICAgIHBhZDIodGltZS5nZXRNaW51dGVzKCkpICtcbiAgICAgICAgJzonICtcbiAgICAgICAgcGFkMih0aW1lLmdldFNlY29uZHMoKSkgK1xuICAgICAgICAnLicgK1xuICAgICAgICBwYWQzKHRpbWUuZ2V0TWlsbGlzZWNvbmRzKCkpO1xuXG4gIC8vIGVnIGluIFNhbiBGcmFuY2lzY28gaW4gSnVuZSB0aGlzIHdpbGwgYmUgJygtNyknXG4gIGNvbnN0IHV0Y09mZnNldFN0ciA9IGAoJHsoLShuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MCkpfSlgO1xuXG4gIGxldCBhcHBJbmZvID0gJyc7XG4gIGlmIChhcHBOYW1lKSB7XG4gICAgYXBwSW5mbyArPSBhcHBOYW1lO1xuICB9XG4gIGlmIChvcmlnaW5BcHAgJiYgb3JpZ2luQXBwICE9PSBhcHBOYW1lKSB7XG4gICAgYXBwSW5mbyArPSBgIHZpYSAke29yaWdpbkFwcH1gO1xuICB9XG4gIGlmIChhcHBJbmZvKSB7XG4gICAgYXBwSW5mbyA9IGBbJHthcHBJbmZvfV0gYDtcbiAgfVxuXG4gIGNvbnN0IHNvdXJjZUluZm9QYXJ0cyA9IFtdO1xuICBpZiAocHJvZ3JhbSkge1xuICAgIHNvdXJjZUluZm9QYXJ0cy5wdXNoKHByb2dyYW0pO1xuICB9XG4gIGlmIChmaWxlKSB7XG4gICAgc291cmNlSW5mb1BhcnRzLnB1c2goZmlsZSk7XG4gIH1cbiAgaWYgKGxpbmVOdW1iZXIpIHtcbiAgICBzb3VyY2VJbmZvUGFydHMucHVzaChsaW5lTnVtYmVyKTtcbiAgfVxuXG4gIGxldCBzb3VyY2VJbmZvID0gIXNvdXJjZUluZm9QYXJ0cy5sZW5ndGggP1xuICAgICcnIDogYCgke3NvdXJjZUluZm9QYXJ0cy5qb2luKCc6Jyl9KSBgO1xuXG4gIGlmIChzYXRlbGxpdGUpXG4gICAgc291cmNlSW5mbyArPSBgWyR7c2F0ZWxsaXRlfV1gO1xuXG4gIGNvbnN0IHN0ZGVyckluZGljYXRvciA9IHN0ZGVyciA/ICcoU1RERVJSKSAnIDogJyc7XG5cbiAgY29uc3QgbWV0YVByZWZpeCA9IFtcbiAgICBsZXZlbC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSxcbiAgICBkYXRlU3RhbXAsXG4gICAgJy0nLFxuICAgIHRpbWVTdGFtcCxcbiAgICB1dGNPZmZzZXRTdHIsXG4gICAgdGltZUluZXhhY3QgPyAnPyAnIDogJyAnLFxuICAgIGFwcEluZm8sXG4gICAgc291cmNlSW5mbyxcbiAgICBzdGRlcnJJbmRpY2F0b3JdLmpvaW4oJycpO1xuXG4gIGNvbnN0IHByZXR0aWZ5ID0gZnVuY3Rpb24gKGxpbmUsIGNvbG9yKSB7XG4gICAgcmV0dXJuIChvcHRpb25zLmNvbG9yICYmIE1ldGVvci5pc1NlcnZlciAmJiBjb2xvcikgP1xuICAgICAgcmVxdWlyZSgnY2xpLWNvbG9yJylbY29sb3JdKGxpbmUpIDogbGluZTtcbiAgfTtcblxuICByZXR1cm4gcHJldHRpZnkobWV0YVByZWZpeCwgcGxhdGZvcm1Db2xvcihvcHRpb25zLm1ldGFDb2xvciB8fCBNRVRBX0NPTE9SKSkgK1xuICAgIHByZXR0aWZ5KG1lc3NhZ2UsIHBsYXRmb3JtQ29sb3IoTEVWRUxfQ09MT1JTW2xldmVsXSkpO1xufTtcblxuLy8gVHVybiBhIGxpbmUgb2YgdGV4dCBpbnRvIGEgbG9nZ2FibGUgb2JqZWN0LlxuLy8gQHBhcmFtIGxpbmUge1N0cmluZ31cbi8vIEBwYXJhbSBvdmVycmlkZSB7T2JqZWN0fVxuTG9nLm9iakZyb21UZXh0ID0gKGxpbmUsIG92ZXJyaWRlKSA9PiB7XG4gIHJldHVybiB7XG4gICAgbWVzc2FnZTogbGluZSxcbiAgICBsZXZlbDogJ2luZm8nLFxuICAgIHRpbWU6IG5ldyBEYXRlKCksXG4gICAgdGltZUluZXhhY3Q6IHRydWUsXG4gICAgLi4ub3ZlcnJpZGVcbiAgfTtcbn07XG5cbmV4cG9ydCB7IExvZyB9O1xuIl19

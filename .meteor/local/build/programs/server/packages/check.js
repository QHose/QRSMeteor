(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var check, Match;

var require = meteorInstall({"node_modules":{"meteor":{"check":{"match.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/check/match.js                                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  check: () => check,
  Match: () => Match
});
let isPlainObject;
module.watch(require("./isPlainObject"), {
  isPlainObject(v) {
    isPlainObject = v;
  }

}, 0);
// Things we explicitly do NOT support:
//    - heterogenous arrays
const currentArgumentChecker = new Meteor.EnvironmentVariable();
const hasOwn = Object.prototype.hasOwnProperty;
/**
 * @summary Check that a value matches a [pattern](#matchpatterns).
 * If the value does not match the pattern, throw a `Match.Error`.
 *
 * Particularly useful to assert that arguments to a function have the right
 * types and structure.
 * @locus Anywhere
 * @param {Any} value The value to check
 * @param {MatchPattern} pattern The pattern to match `value` against
 */

function check(value, pattern) {
  // Record that check got called, if somebody cared.
  //
  // We use getOrNullIfOutsideFiber so that it's OK to call check()
  // from non-Fiber server contexts; the downside is that if you forget to
  // bindEnvironment on some random callback in your method/publisher,
  // it might not find the argumentChecker and you'll get an error about
  // not checking an argument that it looks like you're checking (instead
  // of just getting a "Node code must run in a Fiber" error).
  const argChecker = currentArgumentChecker.getOrNullIfOutsideFiber();

  if (argChecker) {
    argChecker.checking(value);
  }

  const result = testSubtree(value, pattern);

  if (result) {
    const err = new Match.Error(result.message);

    if (result.path) {
      err.message += ` in field ${result.path}`;
      err.path = result.path;
    }

    throw err;
  }
}

;
/**
 * @namespace Match
 * @summary The namespace for all Match types and methods.
 */

const Match = {
  Optional: function (pattern) {
    return new Optional(pattern);
  },
  Maybe: function (pattern) {
    return new Maybe(pattern);
  },
  OneOf: function (...args) {
    return new OneOf(args);
  },
  Any: ['__any__'],
  Where: function (condition) {
    return new Where(condition);
  },
  ObjectIncluding: function (pattern) {
    return new ObjectIncluding(pattern);
  },
  ObjectWithValues: function (pattern) {
    return new ObjectWithValues(pattern);
  },
  // Matches only signed 32-bit integers
  Integer: ['__integer__'],
  // XXX matchers should know how to describe themselves for errors
  Error: Meteor.makeErrorType('Match.Error', function (msg) {
    this.message = `Match error: ${msg}`; // The path of the value that failed to match. Initially empty, this gets
    // populated by catching and rethrowing the exception as it goes back up the
    // stack.
    // E.g.: "vals[3].entity.created"

    this.path = ''; // If this gets sent over DDP, don't give full internal details but at least
    // provide something better than 500 Internal server error.

    this.sanitizedError = new Meteor.Error(400, 'Match failed');
  }),

  // Tests to see if value matches pattern. Unlike check, it merely returns true
  // or false (unless an error other than Match.Error was thrown). It does not
  // interact with _failIfArgumentsAreNotAllChecked.
  // XXX maybe also implement a Match.match which returns more information about
  //     failures but without using exception handling or doing what check()
  //     does with _failIfArgumentsAreNotAllChecked and Meteor.Error conversion

  /**
   * @summary Returns true if the value matches the pattern.
   * @locus Anywhere
   * @param {Any} value The value to check
   * @param {MatchPattern} pattern The pattern to match `value` against
   */
  test(value, pattern) {
    return !testSubtree(value, pattern);
  },

  // Runs `f.apply(context, args)`. If check() is not called on every element of
  // `args` (either directly or in the first level of an array), throws an error
  // (using `description` in the message).
  _failIfArgumentsAreNotAllChecked(f, context, args, description) {
    const argChecker = new ArgumentChecker(args, description);
    const result = currentArgumentChecker.withValue(argChecker, () => f.apply(context, args)); // If f didn't itself throw, make sure it checked all of its arguments.

    argChecker.throwUnlessAllArgumentsHaveBeenChecked();
    return result;
  }

};

class Optional {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

class Maybe {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

class OneOf {
  constructor(choices) {
    if (!choices || choices.length === 0) {
      throw new Error('Must provide at least one choice to Match.OneOf');
    }

    this.choices = choices;
  }

}

class Where {
  constructor(condition) {
    this.condition = condition;
  }

}

class ObjectIncluding {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

class ObjectWithValues {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

const stringForErrorMessage = (value, options = {}) => {
  if (value === null) {
    return 'null';
  }

  if (options.onlyShowType) {
    return typeof value;
  } // Your average non-object things.  Saves from doing the try/catch below for.


  if (typeof value !== 'object') {
    return EJSON.stringify(value);
  }

  try {
    // Find objects with circular references since EJSON doesn't support them yet (Issue #4778 + Unaccepted PR)
    // If the native stringify is going to choke, EJSON.stringify is going to choke too.
    JSON.stringify(value);
  } catch (stringifyError) {
    if (stringifyError.name === 'TypeError') {
      return typeof value;
    }
  }

  return EJSON.stringify(value);
};

const typeofChecks = [[String, 'string'], [Number, 'number'], [Boolean, 'boolean'], // While we don't allow undefined/function in EJSON, this is good for optional
// arguments with OneOf.
[Function, 'function'], [undefined, 'undefined']]; // Return `false` if it matches. Otherwise, return an object with a `message` and a `path` field.

const testSubtree = (value, pattern) => {
  // Match anything!
  if (pattern === Match.Any) {
    return false;
  } // Basic atomic types.
  // Do not match boxed objects (e.g. String, Boolean)


  for (let i = 0; i < typeofChecks.length; ++i) {
    if (pattern === typeofChecks[i][0]) {
      if (typeof value === typeofChecks[i][1]) {
        return false;
      }

      return {
        message: `Expected ${typeofChecks[i][1]}, got ${stringForErrorMessage(value, {
          onlyShowType: true
        })}`,
        path: ''
      };
    }
  }

  if (pattern === null) {
    if (value === null) {
      return false;
    }

    return {
      message: `Expected null, got ${stringForErrorMessage(value)}`,
      path: ''
    };
  } // Strings, numbers, and booleans match literally. Goes well with Match.OneOf.


  if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
    if (value === pattern) {
      return false;
    }

    return {
      message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`,
      path: ''
    };
  } // Match.Integer is special type encoded with array


  if (pattern === Match.Integer) {
    // There is no consistent and reliable way to check if variable is a 64-bit
    // integer. One of the popular solutions is to get reminder of division by 1
    // but this method fails on really large floats with big precision.
    // E.g.: 1.348192308491824e+23 % 1 === 0 in V8
    // Bitwise operators work consistantly but always cast variable to 32-bit
    // signed integer according to JavaScript specs.
    if (typeof value === 'number' && (value | 0) === value) {
      return false;
    }

    return {
      message: `Expected Integer, got ${stringForErrorMessage(value)}`,
      path: ''
    };
  } // 'Object' is shorthand for Match.ObjectIncluding({});


  if (pattern === Object) {
    pattern = Match.ObjectIncluding({});
  } // Array (checked AFTER Any, which is implemented as an Array).


  if (pattern instanceof Array) {
    if (pattern.length !== 1) {
      return {
        message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`,
        path: ''
      };
    }

    if (!Array.isArray(value) && !isArguments(value)) {
      return {
        message: `Expected array, got ${stringForErrorMessage(value)}`,
        path: ''
      };
    }

    for (let i = 0, length = value.length; i < length; i++) {
      const result = testSubtree(value[i], pattern[0]);

      if (result) {
        result.path = _prependPath(i, result.path);
        return result;
      }
    }

    return false;
  } // Arbitrary validation checks. The condition can return false or throw a
  // Match.Error (ie, it can internally use check()) to fail.


  if (pattern instanceof Where) {
    let result;

    try {
      result = pattern.condition(value);
    } catch (err) {
      if (!(err instanceof Match.Error)) {
        throw err;
      }

      return {
        message: err.message,
        path: err.path
      };
    }

    if (result) {
      return false;
    } // XXX this error is terrible


    return {
      message: 'Failed Match.Where validation',
      path: ''
    };
  }

  if (pattern instanceof Maybe) {
    pattern = Match.OneOf(undefined, null, pattern.pattern);
  } else if (pattern instanceof Optional) {
    pattern = Match.OneOf(undefined, pattern.pattern);
  }

  if (pattern instanceof OneOf) {
    for (let i = 0; i < pattern.choices.length; ++i) {
      const result = testSubtree(value, pattern.choices[i]);

      if (!result) {
        // No error? Yay, return.
        return false;
      } // Match errors just mean try another choice.

    } // XXX this error is terrible


    return {
      message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation',
      path: ''
    };
  } // A function that isn't something we special-case is assumed to be a
  // constructor.


  if (pattern instanceof Function) {
    if (value instanceof pattern) {
      return false;
    }

    return {
      message: `Expected ${pattern.name || 'particular constructor'}`,
      path: ''
    };
  }

  let unknownKeysAllowed = false;
  let unknownKeyPattern;

  if (pattern instanceof ObjectIncluding) {
    unknownKeysAllowed = true;
    pattern = pattern.pattern;
  }

  if (pattern instanceof ObjectWithValues) {
    unknownKeysAllowed = true;
    unknownKeyPattern = [pattern.pattern];
    pattern = {}; // no required keys
  }

  if (typeof pattern !== 'object') {
    return {
      message: 'Bad pattern: unknown pattern type',
      path: ''
    };
  } // An object, with required and optional keys. Note that this does NOT do
  // structural matches against objects of special types that happen to match
  // the pattern: this really needs to be a plain old {Object}!


  if (typeof value !== 'object') {
    return {
      message: `Expected object, got ${typeof value}`,
      path: ''
    };
  }

  if (value === null) {
    return {
      message: `Expected object, got null`,
      path: ''
    };
  }

  if (!isPlainObject(value)) {
    return {
      message: `Expected plain object`,
      path: ''
    };
  }

  const requiredPatterns = Object.create(null);
  const optionalPatterns = Object.create(null);
  Object.keys(pattern).forEach(key => {
    const subPattern = pattern[key];

    if (subPattern instanceof Optional || subPattern instanceof Maybe) {
      optionalPatterns[key] = subPattern.pattern;
    } else {
      requiredPatterns[key] = subPattern;
    }
  });

  for (let key in Object(value)) {
    const subValue = value[key];

    if (hasOwn.call(requiredPatterns, key)) {
      const result = testSubtree(subValue, requiredPatterns[key]);

      if (result) {
        result.path = _prependPath(key, result.path);
        return result;
      }

      delete requiredPatterns[key];
    } else if (hasOwn.call(optionalPatterns, key)) {
      const result = testSubtree(subValue, optionalPatterns[key]);

      if (result) {
        result.path = _prependPath(key, result.path);
        return result;
      }
    } else {
      if (!unknownKeysAllowed) {
        return {
          message: 'Unknown key',
          path: key
        };
      }

      if (unknownKeyPattern) {
        const result = testSubtree(subValue, unknownKeyPattern[0]);

        if (result) {
          result.path = _prependPath(key, result.path);
          return result;
        }
      }
    }
  }

  const keys = Object.keys(requiredPatterns);

  if (keys.length) {
    return {
      message: `Missing key '${keys[0]}'`,
      path: ''
    };
  }
};

class ArgumentChecker {
  constructor(args, description) {
    // Make a SHALLOW copy of the arguments. (We'll be doing identity checks
    // against its contents.)
    this.args = [...args]; // Since the common case will be to check arguments in order, and we splice
    // out arguments when we check them, make it so we splice out from the end
    // rather than the beginning.

    this.args.reverse();
    this.description = description;
  }

  checking(value) {
    if (this._checkingOneValue(value)) {
      return;
    } // Allow check(arguments, [String]) or check(arguments.slice(1), [String])
    // or check([foo, bar], [String]) to count... but only if value wasn't
    // itself an argument.


    if (Array.isArray(value) || isArguments(value)) {
      Array.prototype.forEach.call(value, this._checkingOneValue.bind(this));
    }
  }

  _checkingOneValue(value) {
    for (let i = 0; i < this.args.length; ++i) {
      // Is this value one of the arguments? (This can have a false positive if
      // the argument is an interned primitive, but it's still a good enough
      // check.)
      // (NaN is not === to itself, so we have to check specially.)
      if (value === this.args[i] || Number.isNaN(value) && Number.isNaN(this.args[i])) {
        this.args.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  throwUnlessAllArgumentsHaveBeenChecked() {
    if (this.args.length > 0) throw new Error(`Did not check() all arguments during ${this.description}`);
  }

}

const _jsKeywords = ['do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'false', 'null', 'this', 'true', 'void', 'with', 'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof']; // Assumes the base of path is already escaped properly
// returns key + base

const _prependPath = (key, base) => {
  if (typeof key === 'number' || key.match(/^[0-9]+$/)) {
    key = `[${key}]`;
  } else if (!key.match(/^[a-z_$][0-9a-z_$]*$/i) || _jsKeywords.indexOf(key) >= 0) {
    key = JSON.stringify([key]);
  }

  if (base && base[0] !== '[') {
    return `${key}.${base}`;
  }

  return key + base;
};

const isObject = value => typeof value === 'object' && value !== null;

const baseIsArguments = item => isObject(item) && Object.prototype.toString.call(item) === '[object Arguments]';

const isArguments = baseIsArguments(function () {
  return arguments;
}()) ? baseIsArguments : value => isObject(value) && typeof value.callee === 'function';
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isPlainObject.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/check/isPlainObject.js                                                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  isPlainObject: () => isPlainObject
});
// Copy of jQuery.isPlainObject for the server side from jQuery v3.1.1.
const class2type = {};
const toString = class2type.toString;
const hasOwn = Object.prototype.hasOwnProperty;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;

const isPlainObject = obj => {
  let proto;
  let Ctor; // Detect obvious negatives
  // Use toString instead of jQuery.type to catch host objects

  if (!obj || toString.call(obj) !== '[object Object]') {
    return false;
  }

  proto = getProto(obj); // Objects with no prototype (e.g., `Object.create( null )`) are plain

  if (!proto) {
    return true;
  } // Objects with prototype are plain iff they were constructed by a global Object function


  Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/check/match.js");

/* Exports */
Package._define("check", exports, {
  check: check,
  Match: Match
});

})();

//# sourceURL=meteor://💻app/packages/check.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2hlY2svbWF0Y2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NoZWNrL2lzUGxhaW5PYmplY3QuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiY2hlY2siLCJNYXRjaCIsImlzUGxhaW5PYmplY3QiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiY3VycmVudEFyZ3VtZW50Q2hlY2tlciIsIk1ldGVvciIsIkVudmlyb25tZW50VmFyaWFibGUiLCJoYXNPd24iLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsInZhbHVlIiwicGF0dGVybiIsImFyZ0NoZWNrZXIiLCJnZXRPck51bGxJZk91dHNpZGVGaWJlciIsImNoZWNraW5nIiwicmVzdWx0IiwidGVzdFN1YnRyZWUiLCJlcnIiLCJFcnJvciIsIm1lc3NhZ2UiLCJwYXRoIiwiT3B0aW9uYWwiLCJNYXliZSIsIk9uZU9mIiwiYXJncyIsIkFueSIsIldoZXJlIiwiY29uZGl0aW9uIiwiT2JqZWN0SW5jbHVkaW5nIiwiT2JqZWN0V2l0aFZhbHVlcyIsIkludGVnZXIiLCJtYWtlRXJyb3JUeXBlIiwibXNnIiwic2FuaXRpemVkRXJyb3IiLCJ0ZXN0IiwiX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQiLCJmIiwiY29udGV4dCIsImRlc2NyaXB0aW9uIiwiQXJndW1lbnRDaGVja2VyIiwid2l0aFZhbHVlIiwiYXBwbHkiLCJ0aHJvd1VubGVzc0FsbEFyZ3VtZW50c0hhdmVCZWVuQ2hlY2tlZCIsImNvbnN0cnVjdG9yIiwiY2hvaWNlcyIsImxlbmd0aCIsInN0cmluZ0ZvckVycm9yTWVzc2FnZSIsIm9wdGlvbnMiLCJvbmx5U2hvd1R5cGUiLCJFSlNPTiIsInN0cmluZ2lmeSIsIkpTT04iLCJzdHJpbmdpZnlFcnJvciIsIm5hbWUiLCJ0eXBlb2ZDaGVja3MiLCJTdHJpbmciLCJOdW1iZXIiLCJCb29sZWFuIiwiRnVuY3Rpb24iLCJ1bmRlZmluZWQiLCJpIiwiQXJyYXkiLCJpc0FycmF5IiwiaXNBcmd1bWVudHMiLCJfcHJlcGVuZFBhdGgiLCJ1bmtub3duS2V5c0FsbG93ZWQiLCJ1bmtub3duS2V5UGF0dGVybiIsInJlcXVpcmVkUGF0dGVybnMiLCJjcmVhdGUiLCJvcHRpb25hbFBhdHRlcm5zIiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzdWJQYXR0ZXJuIiwic3ViVmFsdWUiLCJjYWxsIiwicmV2ZXJzZSIsIl9jaGVja2luZ09uZVZhbHVlIiwiYmluZCIsImlzTmFOIiwic3BsaWNlIiwiX2pzS2V5d29yZHMiLCJiYXNlIiwibWF0Y2giLCJpbmRleE9mIiwiaXNPYmplY3QiLCJiYXNlSXNBcmd1bWVudHMiLCJpdGVtIiwidG9TdHJpbmciLCJhcmd1bWVudHMiLCJjYWxsZWUiLCJjbGFzczJ0eXBlIiwiZm5Ub1N0cmluZyIsIk9iamVjdEZ1bmN0aW9uU3RyaW5nIiwiZ2V0UHJvdG8iLCJnZXRQcm90b3R5cGVPZiIsIm9iaiIsInByb3RvIiwiQ3RvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLFNBQU0sTUFBSUEsS0FBWDtBQUFpQkMsU0FBTSxNQUFJQTtBQUEzQixDQUFkO0FBQWlELElBQUlDLGFBQUo7QUFBa0JKLE9BQU9LLEtBQVAsQ0FBYUMsUUFBUSxpQkFBUixDQUFiLEVBQXdDO0FBQUNGLGdCQUFjRyxDQUFkLEVBQWdCO0FBQUNILG9CQUFjRyxDQUFkO0FBQWdCOztBQUFsQyxDQUF4QyxFQUE0RSxDQUE1RTtBQUduRTtBQUNBO0FBRUEsTUFBTUMseUJBQXlCLElBQUlDLE9BQU9DLG1CQUFYLEVBQS9CO0FBQ0EsTUFBTUMsU0FBU0MsT0FBT0MsU0FBUCxDQUFpQkMsY0FBaEM7QUFFQTs7Ozs7Ozs7Ozs7QUFVTyxTQUFTWixLQUFULENBQWVhLEtBQWYsRUFBc0JDLE9BQXRCLEVBQStCO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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SWxDO0FBQ0E7O0FBQ0EsTUFBSSxDQUFDRixHQUFELElBQVFSLFNBQVNiLElBQVQsQ0FBY3FCLEdBQWQsTUFBdUIsaUJBQW5DLEVBQXNEO0FBQ3BELFdBQU8sS0FBUDtBQUNEOztBQUVEQyxVQUFRSCxTQUFTRSxHQUFULENBQVIsQ0FWa0MsQ0FZbEM7O0FBQ0EsTUFBSSxDQUFDQyxLQUFMLEVBQVk7QUFDVixXQUFPLElBQVA7QUFDRCxHQWZpQyxDQWlCbEM7OztBQUNBQyxTQUFPNUYsT0FBT3FFLElBQVAsQ0FBWXNCLEtBQVosRUFBbUIsYUFBbkIsS0FBcUNBLE1BQU10RCxXQUFsRDtBQUNBLFNBQU8sT0FBT3VELElBQVAsS0FBZ0IsVUFBaEIsSUFDTE4sV0FBV2pCLElBQVgsQ0FBZ0J1QixJQUFoQixNQUEwQkwsb0JBRDVCO0FBRUQsQ0FyQk0sQyIsImZpbGUiOiIvcGFja2FnZXMvY2hlY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBYWFggZG9jc1xuaW1wb3J0IHsgaXNQbGFpbk9iamVjdCB9IGZyb20gJy4vaXNQbGFpbk9iamVjdCc7XG5cbi8vIFRoaW5ncyB3ZSBleHBsaWNpdGx5IGRvIE5PVCBzdXBwb3J0OlxuLy8gICAgLSBoZXRlcm9nZW5vdXMgYXJyYXlzXG5cbmNvbnN0IGN1cnJlbnRBcmd1bWVudENoZWNrZXIgPSBuZXcgTWV0ZW9yLkVudmlyb25tZW50VmFyaWFibGU7XG5jb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEBzdW1tYXJ5IENoZWNrIHRoYXQgYSB2YWx1ZSBtYXRjaGVzIGEgW3BhdHRlcm5dKCNtYXRjaHBhdHRlcm5zKS5cbiAqIElmIHRoZSB2YWx1ZSBkb2VzIG5vdCBtYXRjaCB0aGUgcGF0dGVybiwgdGhyb3cgYSBgTWF0Y2guRXJyb3JgLlxuICpcbiAqIFBhcnRpY3VsYXJseSB1c2VmdWwgdG8gYXNzZXJ0IHRoYXQgYXJndW1lbnRzIHRvIGEgZnVuY3Rpb24gaGF2ZSB0aGUgcmlnaHRcbiAqIHR5cGVzIGFuZCBzdHJ1Y3R1cmUuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7QW55fSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAqIEBwYXJhbSB7TWF0Y2hQYXR0ZXJufSBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIG1hdGNoIGB2YWx1ZWAgYWdhaW5zdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2sodmFsdWUsIHBhdHRlcm4pIHtcbiAgLy8gUmVjb3JkIHRoYXQgY2hlY2sgZ290IGNhbGxlZCwgaWYgc29tZWJvZHkgY2FyZWQuXG4gIC8vXG4gIC8vIFdlIHVzZSBnZXRPck51bGxJZk91dHNpZGVGaWJlciBzbyB0aGF0IGl0J3MgT0sgdG8gY2FsbCBjaGVjaygpXG4gIC8vIGZyb20gbm9uLUZpYmVyIHNlcnZlciBjb250ZXh0czsgdGhlIGRvd25zaWRlIGlzIHRoYXQgaWYgeW91IGZvcmdldCB0b1xuICAvLyBiaW5kRW52aXJvbm1lbnQgb24gc29tZSByYW5kb20gY2FsbGJhY2sgaW4geW91ciBtZXRob2QvcHVibGlzaGVyLFxuICAvLyBpdCBtaWdodCBub3QgZmluZCB0aGUgYXJndW1lbnRDaGVja2VyIGFuZCB5b3UnbGwgZ2V0IGFuIGVycm9yIGFib3V0XG4gIC8vIG5vdCBjaGVja2luZyBhbiBhcmd1bWVudCB0aGF0IGl0IGxvb2tzIGxpa2UgeW91J3JlIGNoZWNraW5nIChpbnN0ZWFkXG4gIC8vIG9mIGp1c3QgZ2V0dGluZyBhIFwiTm9kZSBjb2RlIG11c3QgcnVuIGluIGEgRmliZXJcIiBlcnJvcikuXG4gIGNvbnN0IGFyZ0NoZWNrZXIgPSBjdXJyZW50QXJndW1lbnRDaGVja2VyLmdldE9yTnVsbElmT3V0c2lkZUZpYmVyKCk7XG4gIGlmIChhcmdDaGVja2VyKSB7XG4gICAgYXJnQ2hlY2tlci5jaGVja2luZyh2YWx1ZSk7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSB0ZXN0U3VidHJlZSh2YWx1ZSwgcGF0dGVybik7XG4gIGlmIChyZXN1bHQpIHtcbiAgICBjb25zdCBlcnIgPSBuZXcgTWF0Y2guRXJyb3IocmVzdWx0Lm1lc3NhZ2UpO1xuICAgIGlmIChyZXN1bHQucGF0aCkge1xuICAgICAgZXJyLm1lc3NhZ2UgKz0gYCBpbiBmaWVsZCAke3Jlc3VsdC5wYXRofWA7XG4gICAgICBlcnIucGF0aCA9IHJlc3VsdC5wYXRoO1xuICAgIH1cblxuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIE1hdGNoXG4gKiBAc3VtbWFyeSBUaGUgbmFtZXNwYWNlIGZvciBhbGwgTWF0Y2ggdHlwZXMgYW5kIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBjb25zdCBNYXRjaCA9IHtcbiAgT3B0aW9uYWw6IGZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgICByZXR1cm4gbmV3IE9wdGlvbmFsKHBhdHRlcm4pO1xuICB9LFxuXG4gIE1heWJlOiBmdW5jdGlvbihwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIG5ldyBNYXliZShwYXR0ZXJuKTtcbiAgfSxcblxuICBPbmVPZjogZnVuY3Rpb24oLi4uYXJncykge1xuICAgIHJldHVybiBuZXcgT25lT2YoYXJncyk7XG4gIH0sXG5cbiAgQW55OiBbJ19fYW55X18nXSxcbiAgV2hlcmU6IGZ1bmN0aW9uKGNvbmRpdGlvbikge1xuICAgIHJldHVybiBuZXcgV2hlcmUoY29uZGl0aW9uKTtcbiAgfSxcblxuICBPYmplY3RJbmNsdWRpbmc6IGZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdEluY2x1ZGluZyhwYXR0ZXJuKVxuICB9LFxuXG4gIE9iamVjdFdpdGhWYWx1ZXM6IGZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFdpdGhWYWx1ZXMocGF0dGVybik7XG4gIH0sXG5cbiAgLy8gTWF0Y2hlcyBvbmx5IHNpZ25lZCAzMi1iaXQgaW50ZWdlcnNcbiAgSW50ZWdlcjogWydfX2ludGVnZXJfXyddLFxuXG4gIC8vIFhYWCBtYXRjaGVycyBzaG91bGQga25vdyBob3cgdG8gZGVzY3JpYmUgdGhlbXNlbHZlcyBmb3IgZXJyb3JzXG4gIEVycm9yOiBNZXRlb3IubWFrZUVycm9yVHlwZSgnTWF0Y2guRXJyb3InLCBmdW5jdGlvbiAobXNnKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gYE1hdGNoIGVycm9yOiAke21zZ31gO1xuXG4gICAgLy8gVGhlIHBhdGggb2YgdGhlIHZhbHVlIHRoYXQgZmFpbGVkIHRvIG1hdGNoLiBJbml0aWFsbHkgZW1wdHksIHRoaXMgZ2V0c1xuICAgIC8vIHBvcHVsYXRlZCBieSBjYXRjaGluZyBhbmQgcmV0aHJvd2luZyB0aGUgZXhjZXB0aW9uIGFzIGl0IGdvZXMgYmFjayB1cCB0aGVcbiAgICAvLyBzdGFjay5cbiAgICAvLyBFLmcuOiBcInZhbHNbM10uZW50aXR5LmNyZWF0ZWRcIlxuICAgIHRoaXMucGF0aCA9ICcnO1xuXG4gICAgLy8gSWYgdGhpcyBnZXRzIHNlbnQgb3ZlciBERFAsIGRvbid0IGdpdmUgZnVsbCBpbnRlcm5hbCBkZXRhaWxzIGJ1dCBhdCBsZWFzdFxuICAgIC8vIHByb3ZpZGUgc29tZXRoaW5nIGJldHRlciB0aGFuIDUwMCBJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IuXG4gICAgdGhpcy5zYW5pdGl6ZWRFcnJvciA9IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCAnTWF0Y2ggZmFpbGVkJyk7XG4gIH0pLFxuXG4gIC8vIFRlc3RzIHRvIHNlZSBpZiB2YWx1ZSBtYXRjaGVzIHBhdHRlcm4uIFVubGlrZSBjaGVjaywgaXQgbWVyZWx5IHJldHVybnMgdHJ1ZVxuICAvLyBvciBmYWxzZSAodW5sZXNzIGFuIGVycm9yIG90aGVyIHRoYW4gTWF0Y2guRXJyb3Igd2FzIHRocm93bikuIEl0IGRvZXMgbm90XG4gIC8vIGludGVyYWN0IHdpdGggX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQuXG4gIC8vIFhYWCBtYXliZSBhbHNvIGltcGxlbWVudCBhIE1hdGNoLm1hdGNoIHdoaWNoIHJldHVybnMgbW9yZSBpbmZvcm1hdGlvbiBhYm91dFxuICAvLyAgICAgZmFpbHVyZXMgYnV0IHdpdGhvdXQgdXNpbmcgZXhjZXB0aW9uIGhhbmRsaW5nIG9yIGRvaW5nIHdoYXQgY2hlY2soKVxuICAvLyAgICAgZG9lcyB3aXRoIF9mYWlsSWZBcmd1bWVudHNBcmVOb3RBbGxDaGVja2VkIGFuZCBNZXRlb3IuRXJyb3IgY29udmVyc2lvblxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIHRydWUgaWYgdGhlIHZhbHVlIG1hdGNoZXMgdGhlIHBhdHRlcm4uXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge0FueX0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSB7TWF0Y2hQYXR0ZXJufSBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRvIG1hdGNoIGB2YWx1ZWAgYWdhaW5zdFxuICAgKi9cbiAgdGVzdCh2YWx1ZSwgcGF0dGVybikge1xuICAgIHJldHVybiAhdGVzdFN1YnRyZWUodmFsdWUsIHBhdHRlcm4pO1xuICB9LFxuXG4gIC8vIFJ1bnMgYGYuYXBwbHkoY29udGV4dCwgYXJncylgLiBJZiBjaGVjaygpIGlzIG5vdCBjYWxsZWQgb24gZXZlcnkgZWxlbWVudCBvZlxuICAvLyBgYXJnc2AgKGVpdGhlciBkaXJlY3RseSBvciBpbiB0aGUgZmlyc3QgbGV2ZWwgb2YgYW4gYXJyYXkpLCB0aHJvd3MgYW4gZXJyb3JcbiAgLy8gKHVzaW5nIGBkZXNjcmlwdGlvbmAgaW4gdGhlIG1lc3NhZ2UpLlxuICBfZmFpbElmQXJndW1lbnRzQXJlTm90QWxsQ2hlY2tlZChmLCBjb250ZXh0LCBhcmdzLCBkZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGFyZ0NoZWNrZXIgPSBuZXcgQXJndW1lbnRDaGVja2VyKGFyZ3MsIGRlc2NyaXB0aW9uKTtcbiAgICBjb25zdCByZXN1bHQgPSBjdXJyZW50QXJndW1lbnRDaGVja2VyLndpdGhWYWx1ZShcbiAgICAgIGFyZ0NoZWNrZXIsIFxuICAgICAgKCkgPT4gZi5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICk7XG5cbiAgICAvLyBJZiBmIGRpZG4ndCBpdHNlbGYgdGhyb3csIG1ha2Ugc3VyZSBpdCBjaGVja2VkIGFsbCBvZiBpdHMgYXJndW1lbnRzLlxuICAgIGFyZ0NoZWNrZXIudGhyb3dVbmxlc3NBbGxBcmd1bWVudHNIYXZlQmVlbkNoZWNrZWQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59O1xuXG5jbGFzcyBPcHRpb25hbCB7XG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4pIHtcbiAgICB0aGlzLnBhdHRlcm4gPSBwYXR0ZXJuO1xuICB9XG59XG5cbmNsYXNzIE1heWJlIHtcbiAgY29uc3RydWN0b3IocGF0dGVybikge1xuICAgIHRoaXMucGF0dGVybiA9IHBhdHRlcm47XG4gIH1cbn1cblxuY2xhc3MgT25lT2Yge1xuICBjb25zdHJ1Y3RvcihjaG9pY2VzKSB7XG4gICAgaWYgKCFjaG9pY2VzIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3QgcHJvdmlkZSBhdCBsZWFzdCBvbmUgY2hvaWNlIHRvIE1hdGNoLk9uZU9mJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jaG9pY2VzID0gY2hvaWNlcztcbiAgfVxufVxuXG5jbGFzcyBXaGVyZSB7XG4gIGNvbnN0cnVjdG9yKGNvbmRpdGlvbikge1xuICAgIHRoaXMuY29uZGl0aW9uID0gY29uZGl0aW9uO1xuICB9XG59XG5cbmNsYXNzIE9iamVjdEluY2x1ZGluZyB7XG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4pIHtcbiAgICB0aGlzLnBhdHRlcm4gPSBwYXR0ZXJuO1xuICB9XG59XG5cbmNsYXNzIE9iamVjdFdpdGhWYWx1ZXMge1xuICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgfVxufVxuXG5jb25zdCBzdHJpbmdGb3JFcnJvck1lc3NhZ2UgPSAodmFsdWUsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICBpZiAoIHZhbHVlID09PSBudWxsICkge1xuICAgIHJldHVybiAnbnVsbCc7XG4gIH1cblxuICBpZiAoIG9wdGlvbnMub25seVNob3dUeXBlICkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWU7XG4gIH1cblxuICAvLyBZb3VyIGF2ZXJhZ2Ugbm9uLW9iamVjdCB0aGluZ3MuICBTYXZlcyBmcm9tIGRvaW5nIHRoZSB0cnkvY2F0Y2ggYmVsb3cgZm9yLlxuICBpZiAoIHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgKSB7XG4gICAgcmV0dXJuIEVKU09OLnN0cmluZ2lmeSh2YWx1ZSlcbiAgfVxuXG4gIHRyeSB7XG5cbiAgICAvLyBGaW5kIG9iamVjdHMgd2l0aCBjaXJjdWxhciByZWZlcmVuY2VzIHNpbmNlIEVKU09OIGRvZXNuJ3Qgc3VwcG9ydCB0aGVtIHlldCAoSXNzdWUgIzQ3NzggKyBVbmFjY2VwdGVkIFBSKVxuICAgIC8vIElmIHRoZSBuYXRpdmUgc3RyaW5naWZ5IGlzIGdvaW5nIHRvIGNob2tlLCBFSlNPTi5zdHJpbmdpZnkgaXMgZ29pbmcgdG8gY2hva2UgdG9vLlxuICAgIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgfSBjYXRjaCAoc3RyaW5naWZ5RXJyb3IpIHtcbiAgICBpZiAoIHN0cmluZ2lmeUVycm9yLm5hbWUgPT09ICdUeXBlRXJyb3InICkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gRUpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbn07XG5cbmNvbnN0IHR5cGVvZkNoZWNrcyA9IFtcbiAgW1N0cmluZywgJ3N0cmluZyddLFxuICBbTnVtYmVyLCAnbnVtYmVyJ10sXG4gIFtCb29sZWFuLCAnYm9vbGVhbiddLFxuXG4gIC8vIFdoaWxlIHdlIGRvbid0IGFsbG93IHVuZGVmaW5lZC9mdW5jdGlvbiBpbiBFSlNPTiwgdGhpcyBpcyBnb29kIGZvciBvcHRpb25hbFxuICAvLyBhcmd1bWVudHMgd2l0aCBPbmVPZi5cbiAgW0Z1bmN0aW9uLCAnZnVuY3Rpb24nXSxcbiAgW3VuZGVmaW5lZCwgJ3VuZGVmaW5lZCddLFxuXTtcblxuLy8gUmV0dXJuIGBmYWxzZWAgaWYgaXQgbWF0Y2hlcy4gT3RoZXJ3aXNlLCByZXR1cm4gYW4gb2JqZWN0IHdpdGggYSBgbWVzc2FnZWAgYW5kIGEgYHBhdGhgIGZpZWxkLlxuY29uc3QgdGVzdFN1YnRyZWUgPSAodmFsdWUsIHBhdHRlcm4pID0+IHtcblxuICAvLyBNYXRjaCBhbnl0aGluZyFcbiAgaWYgKHBhdHRlcm4gPT09IE1hdGNoLkFueSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIEJhc2ljIGF0b21pYyB0eXBlcy5cbiAgLy8gRG8gbm90IG1hdGNoIGJveGVkIG9iamVjdHMgKGUuZy4gU3RyaW5nLCBCb29sZWFuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHR5cGVvZkNoZWNrcy5sZW5ndGg7ICsraSkge1xuICAgIGlmIChwYXR0ZXJuID09PSB0eXBlb2ZDaGVja3NbaV1bMF0pIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IHR5cGVvZkNoZWNrc1tpXVsxXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCAke3R5cGVvZkNoZWNrc1tpXVsxXX0sIGdvdCAke3N0cmluZ0ZvckVycm9yTWVzc2FnZSh2YWx1ZSwgeyBvbmx5U2hvd1R5cGU6IHRydWUgfSl9YCxcbiAgICAgICAgcGF0aDogJycsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGlmIChwYXR0ZXJuID09PSBudWxsKSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBudWxsLCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUpfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gU3RyaW5ncywgbnVtYmVycywgYW5kIGJvb2xlYW5zIG1hdGNoIGxpdGVyYWxseS4gR29lcyB3ZWxsIHdpdGggTWF0Y2guT25lT2YuXG4gIGlmICh0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHBhdHRlcm4gPT09ICdudW1iZXInIHx8IHR5cGVvZiBwYXR0ZXJuID09PSAnYm9vbGVhbicpIHtcbiAgICBpZiAodmFsdWUgPT09IHBhdHRlcm4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogYEV4cGVjdGVkICR7cGF0dGVybn0sIGdvdCAke3N0cmluZ0ZvckVycm9yTWVzc2FnZSh2YWx1ZSl9YCxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICAvLyBNYXRjaC5JbnRlZ2VyIGlzIHNwZWNpYWwgdHlwZSBlbmNvZGVkIHdpdGggYXJyYXlcbiAgaWYgKHBhdHRlcm4gPT09IE1hdGNoLkludGVnZXIpIHtcblxuICAgIC8vIFRoZXJlIGlzIG5vIGNvbnNpc3RlbnQgYW5kIHJlbGlhYmxlIHdheSB0byBjaGVjayBpZiB2YXJpYWJsZSBpcyBhIDY0LWJpdFxuICAgIC8vIGludGVnZXIuIE9uZSBvZiB0aGUgcG9wdWxhciBzb2x1dGlvbnMgaXMgdG8gZ2V0IHJlbWluZGVyIG9mIGRpdmlzaW9uIGJ5IDFcbiAgICAvLyBidXQgdGhpcyBtZXRob2QgZmFpbHMgb24gcmVhbGx5IGxhcmdlIGZsb2F0cyB3aXRoIGJpZyBwcmVjaXNpb24uXG4gICAgLy8gRS5nLjogMS4zNDgxOTIzMDg0OTE4MjRlKzIzICUgMSA9PT0gMCBpbiBWOFxuICAgIC8vIEJpdHdpc2Ugb3BlcmF0b3JzIHdvcmsgY29uc2lzdGFudGx5IGJ1dCBhbHdheXMgY2FzdCB2YXJpYWJsZSB0byAzMi1iaXRcbiAgICAvLyBzaWduZWQgaW50ZWdlciBhY2NvcmRpbmcgdG8gSmF2YVNjcmlwdCBzcGVjcy5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAodmFsdWUgfCAwKSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBJbnRlZ2VyLCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUpfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gJ09iamVjdCcgaXMgc2hvcnRoYW5kIGZvciBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe30pO1xuICBpZiAocGF0dGVybiA9PT0gT2JqZWN0KSB7XG4gICAgcGF0dGVybiA9IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7fSk7XG4gIH1cblxuICAvLyBBcnJheSAoY2hlY2tlZCBBRlRFUiBBbnksIHdoaWNoIGlzIGltcGxlbWVudGVkIGFzIGFuIEFycmF5KS5cbiAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmIChwYXR0ZXJuLmxlbmd0aCAhPT0gMSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogYEJhZCBwYXR0ZXJuOiBhcnJheXMgbXVzdCBoYXZlIG9uZSB0eXBlIGVsZW1lbnQgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UocGF0dGVybil9YCxcbiAgICAgICAgcGF0aDogJycsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgIWlzQXJndW1lbnRzKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogYEV4cGVjdGVkIGFycmF5LCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUpfWAsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRlc3RTdWJ0cmVlKHZhbHVlW2ldLCBwYXR0ZXJuWzBdKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0LnBhdGggPSBfcHJlcGVuZFBhdGgoaSwgcmVzdWx0LnBhdGgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBBcmJpdHJhcnkgdmFsaWRhdGlvbiBjaGVja3MuIFRoZSBjb25kaXRpb24gY2FuIHJldHVybiBmYWxzZSBvciB0aHJvdyBhXG4gIC8vIE1hdGNoLkVycm9yIChpZSwgaXQgY2FuIGludGVybmFsbHkgdXNlIGNoZWNrKCkpIHRvIGZhaWwuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgV2hlcmUpIHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBwYXR0ZXJuLmNvbmRpdGlvbih2YWx1ZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBNYXRjaC5FcnJvcikpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgcGF0aDogZXJyLnBhdGhcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFhYWCB0aGlzIGVycm9yIGlzIHRlcnJpYmxlXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgTWF0Y2guV2hlcmUgdmFsaWRhdGlvbicsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBNYXliZSkge1xuICAgIHBhdHRlcm4gPSBNYXRjaC5PbmVPZih1bmRlZmluZWQsIG51bGwsIHBhdHRlcm4ucGF0dGVybik7XG4gIH0gZWxzZSBpZiAocGF0dGVybiBpbnN0YW5jZW9mIE9wdGlvbmFsKSB7XG4gICAgcGF0dGVybiA9IE1hdGNoLk9uZU9mKHVuZGVmaW5lZCwgcGF0dGVybi5wYXR0ZXJuKTtcbiAgfVxuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgT25lT2YpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4uY2hvaWNlcy5sZW5ndGg7ICsraSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUodmFsdWUsIHBhdHRlcm4uY2hvaWNlc1tpXSk7XG4gICAgICBpZiAoIXJlc3VsdCkge1xuXG4gICAgICAgIC8vIE5vIGVycm9yPyBZYXksIHJldHVybi5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBNYXRjaCBlcnJvcnMganVzdCBtZWFuIHRyeSBhbm90aGVyIGNob2ljZS5cbiAgICB9XG5cbiAgICAvLyBYWFggdGhpcyBlcnJvciBpcyB0ZXJyaWJsZVxuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiAnRmFpbGVkIE1hdGNoLk9uZU9mLCBNYXRjaC5NYXliZSBvciBNYXRjaC5PcHRpb25hbCB2YWxpZGF0aW9uJyxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICAvLyBBIGZ1bmN0aW9uIHRoYXQgaXNuJ3Qgc29tZXRoaW5nIHdlIHNwZWNpYWwtY2FzZSBpcyBhc3N1bWVkIHRvIGJlIGFcbiAgLy8gY29uc3RydWN0b3IuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBwYXR0ZXJuKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCAke3BhdHRlcm4ubmFtZSB8fCAncGFydGljdWxhciBjb25zdHJ1Y3Rvcid9YCxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICBsZXQgdW5rbm93bktleXNBbGxvd2VkID0gZmFsc2U7XG4gIGxldCB1bmtub3duS2V5UGF0dGVybjtcbiAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBPYmplY3RJbmNsdWRpbmcpIHtcbiAgICB1bmtub3duS2V5c0FsbG93ZWQgPSB0cnVlO1xuICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnBhdHRlcm47XG4gIH1cblxuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIE9iamVjdFdpdGhWYWx1ZXMpIHtcbiAgICB1bmtub3duS2V5c0FsbG93ZWQgPSB0cnVlO1xuICAgIHVua25vd25LZXlQYXR0ZXJuID0gW3BhdHRlcm4ucGF0dGVybl07XG4gICAgcGF0dGVybiA9IHt9OyAgLy8gbm8gcmVxdWlyZWQga2V5c1xuICB9XG5cbiAgaWYgKHR5cGVvZiBwYXR0ZXJuICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiAnQmFkIHBhdHRlcm46IHVua25vd24gcGF0dGVybiB0eXBlJyxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICAvLyBBbiBvYmplY3QsIHdpdGggcmVxdWlyZWQgYW5kIG9wdGlvbmFsIGtleXMuIE5vdGUgdGhhdCB0aGlzIGRvZXMgTk9UIGRvXG4gIC8vIHN0cnVjdHVyYWwgbWF0Y2hlcyBhZ2FpbnN0IG9iamVjdHMgb2Ygc3BlY2lhbCB0eXBlcyB0aGF0IGhhcHBlbiB0byBtYXRjaFxuICAvLyB0aGUgcGF0dGVybjogdGhpcyByZWFsbHkgbmVlZHMgdG8gYmUgYSBwbGFpbiBvbGQge09iamVjdH0hXG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBvYmplY3QsIGdvdCAke3R5cGVvZiB2YWx1ZX1gLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgb2JqZWN0LCBnb3QgbnVsbGAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCEgaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogYEV4cGVjdGVkIHBsYWluIG9iamVjdGAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgcmVxdWlyZWRQYXR0ZXJucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGNvbnN0IG9wdGlvbmFsUGF0dGVybnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIE9iamVjdC5rZXlzKHBhdHRlcm4pLmZvckVhY2goa2V5ID0+IHtcbiAgICBjb25zdCBzdWJQYXR0ZXJuID0gcGF0dGVybltrZXldO1xuICAgIGlmIChzdWJQYXR0ZXJuIGluc3RhbmNlb2YgT3B0aW9uYWwgfHxcbiAgICAgICAgc3ViUGF0dGVybiBpbnN0YW5jZW9mIE1heWJlKSB7XG4gICAgICBvcHRpb25hbFBhdHRlcm5zW2tleV0gPSBzdWJQYXR0ZXJuLnBhdHRlcm47XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcXVpcmVkUGF0dGVybnNba2V5XSA9IHN1YlBhdHRlcm47XG4gICAgfVxuICB9KTtcblxuICBmb3IgKGxldCBrZXkgaW4gT2JqZWN0KHZhbHVlKSkge1xuICAgIGNvbnN0IHN1YlZhbHVlID0gdmFsdWVba2V5XTtcbiAgICBpZiAoaGFzT3duLmNhbGwocmVxdWlyZWRQYXR0ZXJucywga2V5KSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUoc3ViVmFsdWUsIHJlcXVpcmVkUGF0dGVybnNba2V5XSk7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdC5wYXRoID0gX3ByZXBlbmRQYXRoKGtleSwgcmVzdWx0LnBhdGgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICBkZWxldGUgcmVxdWlyZWRQYXR0ZXJuc1trZXldO1xuICAgIH0gZWxzZSBpZiAoaGFzT3duLmNhbGwob3B0aW9uYWxQYXR0ZXJucywga2V5KSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUoc3ViVmFsdWUsIG9wdGlvbmFsUGF0dGVybnNba2V5XSk7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdC5wYXRoID0gX3ByZXBlbmRQYXRoKGtleSwgcmVzdWx0LnBhdGgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdW5rbm93bktleXNBbGxvd2VkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbWVzc2FnZTogJ1Vua25vd24ga2V5JyxcbiAgICAgICAgICBwYXRoOiBrZXksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmICh1bmtub3duS2V5UGF0dGVybikge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0ZXN0U3VidHJlZShzdWJWYWx1ZSwgdW5rbm93bktleVBhdHRlcm5bMF0pO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0LnBhdGggPSBfcHJlcGVuZFBhdGgoa2V5LCByZXN1bHQucGF0aCk7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhyZXF1aXJlZFBhdHRlcm5zKTtcbiAgaWYgKGtleXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBNaXNzaW5nIGtleSAnJHtrZXlzWzBdfSdgLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxufTtcblxuY2xhc3MgQXJndW1lbnRDaGVja2VyIHtcbiAgY29uc3RydWN0b3IgKGFyZ3MsIGRlc2NyaXB0aW9uKSB7XG5cbiAgICAvLyBNYWtlIGEgU0hBTExPVyBjb3B5IG9mIHRoZSBhcmd1bWVudHMuIChXZSdsbCBiZSBkb2luZyBpZGVudGl0eSBjaGVja3NcbiAgICAvLyBhZ2FpbnN0IGl0cyBjb250ZW50cy4pXG4gICAgdGhpcy5hcmdzID0gWy4uLmFyZ3NdO1xuXG4gICAgLy8gU2luY2UgdGhlIGNvbW1vbiBjYXNlIHdpbGwgYmUgdG8gY2hlY2sgYXJndW1lbnRzIGluIG9yZGVyLCBhbmQgd2Ugc3BsaWNlXG4gICAgLy8gb3V0IGFyZ3VtZW50cyB3aGVuIHdlIGNoZWNrIHRoZW0sIG1ha2UgaXQgc28gd2Ugc3BsaWNlIG91dCBmcm9tIHRoZSBlbmRcbiAgICAvLyByYXRoZXIgdGhhbiB0aGUgYmVnaW5uaW5nLlxuICAgIHRoaXMuYXJncy5yZXZlcnNlKCk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICB9XG5cbiAgY2hlY2tpbmcodmFsdWUpIHtcbiAgICBpZiAodGhpcy5fY2hlY2tpbmdPbmVWYWx1ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBBbGxvdyBjaGVjayhhcmd1bWVudHMsIFtTdHJpbmddKSBvciBjaGVjayhhcmd1bWVudHMuc2xpY2UoMSksIFtTdHJpbmddKVxuICAgIC8vIG9yIGNoZWNrKFtmb28sIGJhcl0sIFtTdHJpbmddKSB0byBjb3VudC4uLiBidXQgb25seSBpZiB2YWx1ZSB3YXNuJ3RcbiAgICAvLyBpdHNlbGYgYW4gYXJndW1lbnQuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IGlzQXJndW1lbnRzKHZhbHVlKSkge1xuICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh2YWx1ZSwgdGhpcy5fY2hlY2tpbmdPbmVWYWx1ZS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICBfY2hlY2tpbmdPbmVWYWx1ZSh2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hcmdzLmxlbmd0aDsgKytpKSB7XG5cbiAgICAgIC8vIElzIHRoaXMgdmFsdWUgb25lIG9mIHRoZSBhcmd1bWVudHM/IChUaGlzIGNhbiBoYXZlIGEgZmFsc2UgcG9zaXRpdmUgaWZcbiAgICAgIC8vIHRoZSBhcmd1bWVudCBpcyBhbiBpbnRlcm5lZCBwcmltaXRpdmUsIGJ1dCBpdCdzIHN0aWxsIGEgZ29vZCBlbm91Z2hcbiAgICAgIC8vIGNoZWNrLilcbiAgICAgIC8vIChOYU4gaXMgbm90ID09PSB0byBpdHNlbGYsIHNvIHdlIGhhdmUgdG8gY2hlY2sgc3BlY2lhbGx5LilcbiAgICAgIGlmICh2YWx1ZSA9PT0gdGhpcy5hcmdzW2ldIHx8XG4gICAgICAgICAgKE51bWJlci5pc05hTih2YWx1ZSkgJiYgTnVtYmVyLmlzTmFOKHRoaXMuYXJnc1tpXSkpKSB7XG4gICAgICAgIHRoaXMuYXJncy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB0aHJvd1VubGVzc0FsbEFyZ3VtZW50c0hhdmVCZWVuQ2hlY2tlZCgpIHtcbiAgICBpZiAodGhpcy5hcmdzLmxlbmd0aCA+IDApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgY2hlY2soKSBhbGwgYXJndW1lbnRzIGR1cmluZyAke3RoaXMuZGVzY3JpcHRpb259YCk7XG4gIH1cbn1cblxuY29uc3QgX2pzS2V5d29yZHMgPSBbJ2RvJywgJ2lmJywgJ2luJywgJ2ZvcicsICdsZXQnLCAnbmV3JywgJ3RyeScsICd2YXInLCAnY2FzZScsXG4gICdlbHNlJywgJ2VudW0nLCAnZXZhbCcsICdmYWxzZScsICdudWxsJywgJ3RoaXMnLCAndHJ1ZScsICd2b2lkJywgJ3dpdGgnLFxuICAnYnJlYWsnLCAnY2F0Y2gnLCAnY2xhc3MnLCAnY29uc3QnLCAnc3VwZXInLCAndGhyb3cnLCAnd2hpbGUnLCAneWllbGQnLFxuICAnZGVsZXRlJywgJ2V4cG9ydCcsICdpbXBvcnQnLCAncHVibGljJywgJ3JldHVybicsICdzdGF0aWMnLCAnc3dpdGNoJyxcbiAgJ3R5cGVvZicsICdkZWZhdWx0JywgJ2V4dGVuZHMnLCAnZmluYWxseScsICdwYWNrYWdlJywgJ3ByaXZhdGUnLCAnY29udGludWUnLFxuICAnZGVidWdnZXInLCAnZnVuY3Rpb24nLCAnYXJndW1lbnRzJywgJ2ludGVyZmFjZScsICdwcm90ZWN0ZWQnLCAnaW1wbGVtZW50cycsXG4gICdpbnN0YW5jZW9mJ107XG5cbi8vIEFzc3VtZXMgdGhlIGJhc2Ugb2YgcGF0aCBpcyBhbHJlYWR5IGVzY2FwZWQgcHJvcGVybHlcbi8vIHJldHVybnMga2V5ICsgYmFzZVxuY29uc3QgX3ByZXBlbmRQYXRoID0gKGtleSwgYmFzZSkgPT4ge1xuICBpZiAoKHR5cGVvZiBrZXkpID09PSAnbnVtYmVyJyB8fCBrZXkubWF0Y2goL15bMC05XSskLykpIHtcbiAgICBrZXkgPSBgWyR7a2V5fV1gO1xuICB9IGVsc2UgaWYgKCFrZXkubWF0Y2goL15bYS16XyRdWzAtOWEtel8kXSokL2kpIHx8XG4gICAgICAgICAgICAgX2pzS2V5d29yZHMuaW5kZXhPZihrZXkpID49IDApIHtcbiAgICBrZXkgPSBKU09OLnN0cmluZ2lmeShba2V5XSk7XG4gIH1cblxuICBpZiAoYmFzZSAmJiBiYXNlWzBdICE9PSAnWycpIHtcbiAgICByZXR1cm4gYCR7a2V5fS4ke2Jhc2V9YDtcbiAgfVxuXG4gIHJldHVybiBrZXkgKyBiYXNlO1xufVxuXG5jb25zdCBpc09iamVjdCA9IHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGw7XG5cbmNvbnN0IGJhc2VJc0FyZ3VtZW50cyA9IGl0ZW0gPT5cbiAgaXNPYmplY3QoaXRlbSkgJiZcbiAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZW0pID09PSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuY29uc3QgaXNBcmd1bWVudHMgPSBiYXNlSXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSkgP1xuICBiYXNlSXNBcmd1bWVudHMgOlxuICB2YWx1ZSA9PiBpc09iamVjdCh2YWx1ZSkgJiYgdHlwZW9mIHZhbHVlLmNhbGxlZSA9PT0gJ2Z1bmN0aW9uJztcbiIsIi8vIENvcHkgb2YgalF1ZXJ5LmlzUGxhaW5PYmplY3QgZm9yIHRoZSBzZXJ2ZXIgc2lkZSBmcm9tIGpRdWVyeSB2My4xLjEuXG5cbmNvbnN0IGNsYXNzMnR5cGUgPSB7fTtcblxuY29uc3QgdG9TdHJpbmcgPSBjbGFzczJ0eXBlLnRvU3RyaW5nO1xuXG5jb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5jb25zdCBmblRvU3RyaW5nID0gaGFzT3duLnRvU3RyaW5nO1xuXG5jb25zdCBPYmplY3RGdW5jdGlvblN0cmluZyA9IGZuVG9TdHJpbmcuY2FsbChPYmplY3QpO1xuXG5jb25zdCBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZjtcblxuZXhwb3J0IGNvbnN0IGlzUGxhaW5PYmplY3QgPSBvYmogPT4ge1xuICBsZXQgcHJvdG87XG4gIGxldCBDdG9yO1xuXG4gIC8vIERldGVjdCBvYnZpb3VzIG5lZ2F0aXZlc1xuICAvLyBVc2UgdG9TdHJpbmcgaW5zdGVhZCBvZiBqUXVlcnkudHlwZSB0byBjYXRjaCBob3N0IG9iamVjdHNcbiAgaWYgKCFvYmogfHwgdG9TdHJpbmcuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByb3RvID0gZ2V0UHJvdG8ob2JqKTtcblxuICAvLyBPYmplY3RzIHdpdGggbm8gcHJvdG90eXBlIChlLmcuLCBgT2JqZWN0LmNyZWF0ZSggbnVsbCApYCkgYXJlIHBsYWluXG4gIGlmICghcHJvdG8pIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIE9iamVjdHMgd2l0aCBwcm90b3R5cGUgYXJlIHBsYWluIGlmZiB0aGV5IHdlcmUgY29uc3RydWN0ZWQgYnkgYSBnbG9iYWwgT2JqZWN0IGZ1bmN0aW9uXG4gIEN0b3IgPSBoYXNPd24uY2FsbChwcm90bywgJ2NvbnN0cnVjdG9yJykgJiYgcHJvdG8uY29uc3RydWN0b3I7XG4gIHJldHVybiB0eXBlb2YgQ3RvciA9PT0gJ2Z1bmN0aW9uJyAmJiBcbiAgICBmblRvU3RyaW5nLmNhbGwoQ3RvcikgPT09IE9iamVjdEZ1bmN0aW9uU3RyaW5nO1xufTtcbiJdfQ==

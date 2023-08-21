//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var DDP = Package['ddp-client'].DDP;
var HTTP = Package.http.HTTP;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var _ = Package.underscore._;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

/* Package-scope variables */
var denodeify, addReadyPromise, ReactivePromise, reactiveValue;

var require = meteorInstall({"node_modules":{"meteor":{"deanius:promise":{"client":{"denodeifyFunctions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/deanius_promise/client/denodeifyFunctions.js                                                        //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
// This implementation of denodeify, taken from
// https://github.com/matthew-andrews/denodeify/blob/bbc334a90a4b036f491f766ce335fca7bd274109/index.js
// works in ways that Promise.denodeify does not (meteor-promise-docs shows [Object object]),
// Probably because the Object type returned doesn't pass the test of `instanceof Promise`
denodeify = function () {
  function denodeify(nodeStyleFunction, filter) {
    'use strict';

    return function () {
      var self = this;
      var functionArguments = new Array(arguments.length + 1);

      for (var i = 0; i < arguments.length; i += 1) {
        functionArguments[i] = arguments[i];
      }

      function promiseHandler(resolve, reject) {
        function callbackFunction() {
          var args = new Array(arguments.length);

          for (var i = 0; i < args.length; i += 1) {
            args[i] = arguments[i];
          }

          if (filter) {
            args = filter.apply(self, args);
          }

          var error = args[0];
          var result = args[1];

          if (error) {
            return reject(error);
          }

          return resolve(result);
        }

        functionArguments[functionArguments.length - 1] = callbackFunction;
        nodeStyleFunction.apply(self, functionArguments);
      }

      return new Promise(promiseHandler);
    };
  }

  return denodeify;
}();
/**
   * @memberOf Meteor
   * @summary Gets a ES2015-compatible Promise for the result of a Meteor.promise
   * @param {String} name Name of method to invoke
   * @param {EJSONable} [arg1,arg2...] Optional method arguments
   * @returns {Promise}
   */


Meteor.callPromise = denodeify(Meteor.call);
Meteor.wrapPromise = denodeify;
HTTP.callPromise = denodeify(HTTP.call);
HTTP.getPromise = denodeify(HTTP.get);
HTTP.postPromise = denodeify(HTTP.post);
HTTP.putPromise = denodeify(HTTP.put);
HTTP.deletePromise = denodeify(HTTP.delete);

addReadyPromise = function (handle) {
  handle.readyPromise = function () {
    return new Promise(function (resolve) {
      Tracker.autorun(function (computation) {
        if (handle.ready()) {
          //resolving invokes 'then' steps async, just like computation invalidations
          resolve(true);
          computation.stop();
        }
      });
    });
  };
};

Meteor._subscribe = Meteor.subscribe;

Meteor.subscribe = function () {
  var handle = Meteor._subscribe.apply(Meteor, arguments);

  addReadyPromise(handle);
  return handle;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reactivePromise.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/deanius_promise/client/reactivePromise.js                                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
ReactivePromise = function (fn, loadingTextOrObj, errorTextOrFn) {
  var loadingText = loadingTextOrObj && loadingTextOrObj.pending || loadingTextOrObj || "",
      displayError = function (e) {
    var errorHandler = loadingTextOrObj.rejected || errorTextOrFn;
    return _.isFunction(errorHandler) ? errorHandler(e) : errorHandler || "";
  },
      refire = function (computation) {
    computation.isPromiseResolve = true;
    computation.depsNotDeleted = computation._onInvalidateCallbacks;
    computation._onInvalidateCallbacks = [];
    computation.invalidate();
  },
      cleanup = function (computation) {
    computation._onInvalidateCallbacks = computation.depsNotDeleted;
    delete computation.depsNotDeleted;
    delete computation.isPromiseResolve;
  },
      returnValues = {};

  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var promiseForResult;
    var result = null;
    args = args.slice(0, -1);
    /*remove spacebars, the final arg*/

    var argHash = EJSON.stringify(args, {
      canonical: true
    });
    var helperComputation = Tracker.currentComputation;

    if (helperComputation.isPromiseResolve) {
      cleanup(helperComputation);
      return returnValues[argHash];
    }

    reactiveValue = Tracker.autorun(function () {
      delete returnValues[argHash];
      result = fn.apply({}, args);
      returnValues[argHash] = result;
    });
    reactiveValue.onInvalidate(function () {
      if (!helperComputation.isPromiseResolve) {
        delete returnValues[argHash];
        helperComputation.invalidate();
      }
    });

    if (returnValues[argHash] instanceof Promise) {
      promiseForResult = result;
      promiseForResult.then(function (v) {
        returnValues[argHash] = v;
        refire(helperComputation);
        return v;
      }, function (e) {
        returnValues[argHash] = displayError(e);
        refire(helperComputation);
      }); //suppress display of [object Promise] message

      returnValues[argHash] = loadingText;
    }

    return returnValues[argHash];
  };
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"runAsync.browserify.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/deanius_promise/client/runAsync.browserify.js                                                       //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var co = require('co')

Meteor.runAsync = function (fn) {
  if (fn.constructor.name !== "GeneratorFunction")
    console.info("Meteor.runAsync can not tell if this is a generator function.")

  return co(fn)
}

},{"co":2}],2:[function(require,module,exports){

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

module.exports = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1)

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}

},{}]},{},[1])
//# sourceMappingURL=/packages/deanius_promise/client/runAsync.browserify.js

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".browserify.js"
  ]
});
require("/node_modules/meteor/deanius:promise/client/denodeifyFunctions.js");
require("/node_modules/meteor/deanius:promise/client/reactivePromise.js");
require("/node_modules/meteor/deanius:promise/client/runAsync.browserify.js");

/* Exports */
Package._define("deanius:promise", {
  ReactivePromise: ReactivePromise
});

})();

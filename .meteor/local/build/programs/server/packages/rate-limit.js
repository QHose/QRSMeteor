(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var RateLimiter;

var require = meteorInstall({"node_modules":{"meteor":{"rate-limit":{"rate-limit.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rate-limit/rate-limit.js                                                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  RateLimiter: () => RateLimiter
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);
// Default time interval (in milliseconds) to reset rate limit counters
const DEFAULT_INTERVAL_TIME_IN_MILLISECONDS = 1000; // Default number of events allowed per time interval

const DEFAULT_REQUESTS_PER_INTERVAL = 10;
const hasOwn = Object.prototype.hasOwnProperty; // A rule is defined by an options object that contains two fields,
// `numRequestsAllowed` which is the number of events allowed per interval, and
// an `intervalTime` which is the amount of time in milliseconds before the
// rate limit restarts its internal counters, and by a matchers object. A
// matchers object is a POJO that contains a set of keys with values that
// define the entire set of inputs that match for each key. The values can
// either be null (optional), a primitive or a function that returns a boolean
// of whether the provided input's value matches for this key.
//
// Rules are uniquely assigned an `id` and they store a dictionary of counters,
// which are records used to keep track of inputs that match the rule. If a
// counter reaches the `numRequestsAllowed` within a given `intervalTime`, a
// rate limit is reached and future inputs that map to that counter will
// result in errors being returned to the client.

class Rule {
  constructor(options, matchers) {
    this.id = Random.id();
    this.options = options;
    this._matchers = matchers;
    this._lastResetTime = new Date().getTime(); // Dictionary of input keys to counters

    this.counters = {};
  } // Determine if this rule applies to the given input by comparing all
  // rule.matchers. If the match fails, search short circuits instead of
  // iterating through all matchers.


  match(input) {
    return Object.entries(this._matchers).every(([key, matcher]) => {
      if (matcher !== null) {
        if (!hasOwn.call(input, key)) {
          return false;
        } else if (typeof matcher === 'function') {
          if (!matcher(input[key])) {
            return false;
          }
        } else if (matcher !== input[key]) {
          return false;
        }
      }

      return true;
    });
  } // Generates unique key string for provided input by concatenating all the
  // keys in the matcher with the corresponding values in the input.
  // Only called if rule matches input.


  _generateKeyString(input) {
    return Object.entries(this._matchers).filter(([key]) => this._matchers[key] !== null).reduce((returnString, [key, matcher]) => {
      if (typeof matcher === 'function') {
        if (matcher(input[key])) {
          returnString += key + input[key];
        }
      } else {
        returnString += key + input[key];
      }

      return returnString;
    }, '');
  } // Applies the provided input and returns the key string, time since counters
  // were last reset and time to next reset.


  apply(input) {
    const key = this._generateKeyString(input);

    const timeSinceLastReset = new Date().getTime() - this._lastResetTime;

    const timeToNextReset = this.options.intervalTime - timeSinceLastReset;
    return {
      key,
      timeSinceLastReset,
      timeToNextReset
    };
  } // Reset counter dictionary for this specific rule. Called once the
  // timeSinceLastReset has exceeded the intervalTime. _lastResetTime is
  // set to be the current time in milliseconds.


  resetCounter() {
    // Delete the old counters dictionary to allow for garbage collection
    this.counters = {};
    this._lastResetTime = new Date().getTime();
  }

  _executeCallback(reply, ruleInput) {
    try {
      if (this.options.callback) {
        this.options.callback(reply, ruleInput);
      }
    } catch (e) {
      // Do not throw error here
      console.error(e);
    }
  }

}

class RateLimiter {
  // Initialize rules to be an empty dictionary.
  constructor() {
    // Dictionary of all rules associated with this RateLimiter, keyed by their
    // id. Each rule object stores the rule pattern, number of events allowed,
    // last reset time and the rule reset interval in milliseconds.
    this.rules = {};
  }
  /**
  * Checks if this input has exceeded any rate limits.
  * @param  {object} input dictionary containing key-value pairs of attributes
  * that match to rules
  * @return {object} Returns object of following structure
  * { 'allowed': boolean - is this input allowed
  *   'timeToReset': integer | Infinity - returns time until counters are reset
  *                   in milliseconds
  *   'numInvocationsLeft': integer | Infinity - returns number of calls left
  *   before limit is reached
  * }
  * If multiple rules match, the least number of invocations left is returned.
  * If the rate limit has been reached, the longest timeToReset is returned.
  */


  check(input) {
    const reply = {
      allowed: true,
      timeToReset: 0,
      numInvocationsLeft: Infinity
    };

    const matchedRules = this._findAllMatchingRules(input);

    matchedRules.forEach(rule => {
      const ruleResult = rule.apply(input);
      let numInvocations = rule.counters[ruleResult.key];

      if (ruleResult.timeToNextReset < 0) {
        // Reset all the counters since the rule has reset
        rule.resetCounter();
        ruleResult.timeSinceLastReset = new Date().getTime() - rule._lastResetTime;
        ruleResult.timeToNextReset = rule.options.intervalTime;
        numInvocations = 0;
      }

      if (numInvocations > rule.options.numRequestsAllowed) {
        // Only update timeToReset if the new time would be longer than the
        // previously set time. This is to ensure that if this input triggers
        // multiple rules, we return the longest period of time until they can
        // successfully make another call
        if (reply.timeToReset < ruleResult.timeToNextReset) {
          reply.timeToReset = ruleResult.timeToNextReset;
        }

        reply.allowed = false;
        reply.numInvocationsLeft = 0;

        rule._executeCallback(reply, input);
      } else {
        // If this is an allowed attempt and we haven't failed on any of the
        // other rules that match, update the reply field.
        if (rule.options.numRequestsAllowed - numInvocations < reply.numInvocationsLeft && reply.allowed) {
          reply.timeToReset = ruleResult.timeToNextReset;
          reply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
        }

        rule._executeCallback(reply, input);
      }
    });
    return reply;
  }
  /**
  * Adds a rule to dictionary of rules that are checked against on every call.
  * Only inputs that pass all of the rules will be allowed. Returns unique rule
  * id that can be passed to `removeRule`.
  * @param {object} rule    Input dictionary defining certain attributes and
  * rules associated with them.
  * Each attribute's value can either be a value, a function or null. All
  * functions must return a boolean of whether the input is matched by that
  * attribute's rule or not
  * @param {integer} numRequestsAllowed Optional. Number of events allowed per
  * interval. Default = 10.
  * @param {integer} intervalTime Optional. Number of milliseconds before
  * rule's counters are reset. Default = 1000.
  * @param {function} callback Optional. Function to be called after a
  * rule is executed. Two objects will be passed to this function.
  * The first one is the result of RateLimiter.prototype.check
  * The second is the input object of the rule, it has the following structure:
  * {
  *   'type': string - either 'method' or 'subscription'
  *   'name': string - the name of the method or subscription being called
  *   'userId': string - the user ID attempting the method or subscription
  *   'connectionId': string - a string representing the user's DDP connection
  *   'clientAddress': string - the IP address of the user
  * }
  * @return {string} Returns unique rule id
  */


  addRule(rule, numRequestsAllowed, intervalTime, callback) {
    const options = {
      numRequestsAllowed: numRequestsAllowed || DEFAULT_REQUESTS_PER_INTERVAL,
      intervalTime: intervalTime || DEFAULT_INTERVAL_TIME_IN_MILLISECONDS,
      callback: callback && Meteor.bindEnvironment(callback)
    };
    const newRule = new Rule(options, rule);
    this.rules[newRule.id] = newRule;
    return newRule.id;
  }
  /**
  * Increment counters in every rule that match to this input
  * @param  {object} input Dictionary object containing attributes that may
  * match to rules
  */


  increment(input) {
    // Only increment rule counters that match this input
    const matchedRules = this._findAllMatchingRules(input);

    matchedRules.forEach(rule => {
      const ruleResult = rule.apply(input);

      if (ruleResult.timeSinceLastReset > rule.options.intervalTime) {
        // Reset all the counters since the rule has reset
        rule.resetCounter();
      } // Check whether the key exists, incrementing it if so or otherwise
      // adding the key and setting its value to 1


      if (hasOwn.call(rule.counters, ruleResult.key)) {
        rule.counters[ruleResult.key]++;
      } else {
        rule.counters[ruleResult.key] = 1;
      }
    });
  } // Returns an array of all rules that apply to provided input


  _findAllMatchingRules(input) {
    return Object.values(this.rules).filter(rule => rule.match(input));
  }
  /**
   * Provides a mechanism to remove rules from the rate limiter. Returns boolean
   * about success.
   * @param  {string} id Rule id returned from #addRule
   * @return {boolean} Returns true if rule was found and deleted, else false.
   */


  removeRule(id) {
    if (this.rules[id]) {
      delete this.rules[id];
      return true;
    }

    return false;
  }

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rate-limit/rate-limit.js");

/* Exports */
Package._define("rate-limit", exports, {
  RateLimiter: RateLimiter
});

})();

//# sourceURL=meteor://💻app/packages/rate-limit.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmF0ZS1saW1pdC9yYXRlLWxpbWl0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIlJhdGVMaW1pdGVyIiwiTWV0ZW9yIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlJhbmRvbSIsIkRFRkFVTFRfSU5URVJWQUxfVElNRV9JTl9NSUxMSVNFQ09ORFMiLCJERUZBVUxUX1JFUVVFU1RTX1BFUl9JTlRFUlZBTCIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiUnVsZSIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsIm1hdGNoZXJzIiwiaWQiLCJfbWF0Y2hlcnMiLCJfbGFzdFJlc2V0VGltZSIsIkRhdGUiLCJnZXRUaW1lIiwiY291bnRlcnMiLCJtYXRjaCIsImlucHV0IiwiZW50cmllcyIsImV2ZXJ5Iiwia2V5IiwibWF0Y2hlciIsImNhbGwiLCJfZ2VuZXJhdGVLZXlTdHJpbmciLCJmaWx0ZXIiLCJyZWR1Y2UiLCJyZXR1cm5TdHJpbmciLCJhcHBseSIsInRpbWVTaW5jZUxhc3RSZXNldCIsInRpbWVUb05leHRSZXNldCIsImludGVydmFsVGltZSIsInJlc2V0Q291bnRlciIsIl9leGVjdXRlQ2FsbGJhY2siLCJyZXBseSIsInJ1bGVJbnB1dCIsImNhbGxiYWNrIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInJ1bGVzIiwiY2hlY2siLCJhbGxvd2VkIiwidGltZVRvUmVzZXQiLCJudW1JbnZvY2F0aW9uc0xlZnQiLCJJbmZpbml0eSIsIm1hdGNoZWRSdWxlcyIsIl9maW5kQWxsTWF0Y2hpbmdSdWxlcyIsImZvckVhY2giLCJydWxlIiwicnVsZVJlc3VsdCIsIm51bUludm9jYXRpb25zIiwibnVtUmVxdWVzdHNBbGxvd2VkIiwiYWRkUnVsZSIsImJpbmRFbnZpcm9ubWVudCIsIm5ld1J1bGUiLCJpbmNyZW1lbnQiLCJ2YWx1ZXMiLCJyZW1vdmVSdWxlIl0sIm1hcHBp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S2hDLEtBQUwsQ0FBV0MsS0FBWCxDQUF6QyxDQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7QUFNQXdDLGFBQVcvQyxFQUFYLEVBQWU7QUFDYixRQUFJLEtBQUs2QixLQUFMLENBQVc3QixFQUFYLENBQUosRUFBb0I7QUFDbEIsYUFBTyxLQUFLNkIsS0FBTCxDQUFXN0IsRUFBWCxDQUFQO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7O0FBQ0QsV0FBTyxLQUFQO0FBQ0Q7O0FBeEplLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JhdGUtbGltaXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuXG4vLyBEZWZhdWx0IHRpbWUgaW50ZXJ2YWwgKGluIG1pbGxpc2Vjb25kcykgdG8gcmVzZXQgcmF0ZSBsaW1pdCBjb3VudGVyc1xuY29uc3QgREVGQVVMVF9JTlRFUlZBTF9USU1FX0lOX01JTExJU0VDT05EUyA9IDEwMDA7XG4vLyBEZWZhdWx0IG51bWJlciBvZiBldmVudHMgYWxsb3dlZCBwZXIgdGltZSBpbnRlcnZhbFxuY29uc3QgREVGQVVMVF9SRVFVRVNUU19QRVJfSU5URVJWQUwgPSAxMDtcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gQSBydWxlIGlzIGRlZmluZWQgYnkgYW4gb3B0aW9ucyBvYmplY3QgdGhhdCBjb250YWlucyB0d28gZmllbGRzLFxuLy8gYG51bVJlcXVlc3RzQWxsb3dlZGAgd2hpY2ggaXMgdGhlIG51bWJlciBvZiBldmVudHMgYWxsb3dlZCBwZXIgaW50ZXJ2YWwsIGFuZFxuLy8gYW4gYGludGVydmFsVGltZWAgd2hpY2ggaXMgdGhlIGFtb3VudCBvZiB0aW1lIGluIG1pbGxpc2Vjb25kcyBiZWZvcmUgdGhlXG4vLyByYXRlIGxpbWl0IHJlc3RhcnRzIGl0cyBpbnRlcm5hbCBjb3VudGVycywgYW5kIGJ5IGEgbWF0Y2hlcnMgb2JqZWN0LiBBXG4vLyBtYXRjaGVycyBvYmplY3QgaXMgYSBQT0pPIHRoYXQgY29udGFpbnMgYSBzZXQgb2Yga2V5cyB3aXRoIHZhbHVlcyB0aGF0XG4vLyBkZWZpbmUgdGhlIGVudGlyZSBzZXQgb2YgaW5wdXRzIHRoYXQgbWF0Y2ggZm9yIGVhY2gga2V5LiBUaGUgdmFsdWVzIGNhblxuLy8gZWl0aGVyIGJlIG51bGwgKG9wdGlvbmFsKSwgYSBwcmltaXRpdmUgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBib29sZWFuXG4vLyBvZiB3aGV0aGVyIHRoZSBwcm92aWRlZCBpbnB1dCdzIHZhbHVlIG1hdGNoZXMgZm9yIHRoaXMga2V5LlxuLy9cbi8vIFJ1bGVzIGFyZSB1bmlxdWVseSBhc3NpZ25lZCBhbiBgaWRgIGFuZCB0aGV5IHN0b3JlIGEgZGljdGlvbmFyeSBvZiBjb3VudGVycyxcbi8vIHdoaWNoIGFyZSByZWNvcmRzIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBpbnB1dHMgdGhhdCBtYXRjaCB0aGUgcnVsZS4gSWYgYVxuLy8gY291bnRlciByZWFjaGVzIHRoZSBgbnVtUmVxdWVzdHNBbGxvd2VkYCB3aXRoaW4gYSBnaXZlbiBgaW50ZXJ2YWxUaW1lYCwgYVxuLy8gcmF0ZSBsaW1pdCBpcyByZWFjaGVkIGFuZCBmdXR1cmUgaW5wdXRzIHRoYXQgbWFwIHRvIHRoYXQgY291bnRlciB3aWxsXG4vLyByZXN1bHQgaW4gZXJyb3JzIGJlaW5nIHJldHVybmVkIHRvIHRoZSBjbGllbnQuXG5jbGFzcyBSdWxlIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucywgbWF0Y2hlcnMpIHtcbiAgICB0aGlzLmlkID0gUmFuZG9tLmlkKCk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgdGhpcy5fbWF0Y2hlcnMgPSBtYXRjaGVycztcblxuICAgIHRoaXMuX2xhc3RSZXNldFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgIC8vIERpY3Rpb25hcnkgb2YgaW5wdXQga2V5cyB0byBjb3VudGVyc1xuICAgIHRoaXMuY291bnRlcnMgPSB7fTtcbiAgfVxuICAvLyBEZXRlcm1pbmUgaWYgdGhpcyBydWxlIGFwcGxpZXMgdG8gdGhlIGdpdmVuIGlucHV0IGJ5IGNvbXBhcmluZyBhbGxcbiAgLy8gcnVsZS5tYXRjaGVycy4gSWYgdGhlIG1hdGNoIGZhaWxzLCBzZWFyY2ggc2hvcnQgY2lyY3VpdHMgaW5zdGVhZCBvZlxuICAvLyBpdGVyYXRpbmcgdGhyb3VnaCBhbGwgbWF0Y2hlcnMuXG4gIG1hdGNoKGlucHV0KSB7XG4gICAgcmV0dXJuIE9iamVjdFxuICAgICAgLmVudHJpZXModGhpcy5fbWF0Y2hlcnMpXG4gICAgICAuZXZlcnkoKFtrZXksIG1hdGNoZXJdKSA9PiB7XG4gICAgICAgIGlmIChtYXRjaGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChpbnB1dCwga2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlmICghKG1hdGNoZXIoaW5wdXRba2V5XSkpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoZXIgIT09IGlucHV0W2tleV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRlcyB1bmlxdWUga2V5IHN0cmluZyBmb3IgcHJvdmlkZWQgaW5wdXQgYnkgY29uY2F0ZW5hdGluZyBhbGwgdGhlXG4gIC8vIGtleXMgaW4gdGhlIG1hdGNoZXIgd2l0aCB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMgaW4gdGhlIGlucHV0LlxuICAvLyBPbmx5IGNhbGxlZCBpZiBydWxlIG1hdGNoZXMgaW5wdXQuXG4gIF9nZW5lcmF0ZUtleVN0cmluZyhpbnB1dCkge1xuICAgIHJldHVybiBPYmplY3QuZW50cmllcyh0aGlzLl9tYXRjaGVycylcbiAgICAgIC5maWx0ZXIoKFtrZXldKSA9PiB0aGlzLl9tYXRjaGVyc1trZXldICE9PSBudWxsKVxuICAgICAgLnJlZHVjZSgocmV0dXJuU3RyaW5nLCBba2V5LCBtYXRjaGVyXSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAobWF0Y2hlcihpbnB1dFtrZXldKSkge1xuICAgICAgICAgICAgcmV0dXJuU3RyaW5nICs9IGtleSArIGlucHV0W2tleV07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVyblN0cmluZyArPSBrZXkgKyBpbnB1dFtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR1cm5TdHJpbmc7XG4gICAgICB9LCAnJyk7XG4gIH1cblxuICAvLyBBcHBsaWVzIHRoZSBwcm92aWRlZCBpbnB1dCBhbmQgcmV0dXJucyB0aGUga2V5IHN0cmluZywgdGltZSBzaW5jZSBjb3VudGVyc1xuICAvLyB3ZXJlIGxhc3QgcmVzZXQgYW5kIHRpbWUgdG8gbmV4dCByZXNldC5cbiAgYXBwbHkoaW5wdXQpIHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZW5lcmF0ZUtleVN0cmluZyhpbnB1dCk7XG4gICAgY29uc3QgdGltZVNpbmNlTGFzdFJlc2V0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aGlzLl9sYXN0UmVzZXRUaW1lO1xuICAgIGNvbnN0IHRpbWVUb05leHRSZXNldCA9IHRoaXMub3B0aW9ucy5pbnRlcnZhbFRpbWUgLSB0aW1lU2luY2VMYXN0UmVzZXQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleSxcbiAgICAgIHRpbWVTaW5jZUxhc3RSZXNldCxcbiAgICAgIHRpbWVUb05leHRSZXNldCxcbiAgICB9O1xuICB9XG5cbiAgLy8gUmVzZXQgY291bnRlciBkaWN0aW9uYXJ5IGZvciB0aGlzIHNwZWNpZmljIHJ1bGUuIENhbGxlZCBvbmNlIHRoZVxuICAvLyB0aW1lU2luY2VMYXN0UmVzZXQgaGFzIGV4Y2VlZGVkIHRoZSBpbnRlcnZhbFRpbWUuIF9sYXN0UmVzZXRUaW1lIGlzXG4gIC8vIHNldCB0byBiZSB0aGUgY3VycmVudCB0aW1lIGluIG1pbGxpc2Vjb25kcy5cbiAgcmVzZXRDb3VudGVyKCkge1xuICAgIC8vIERlbGV0ZSB0aGUgb2xkIGNvdW50ZXJzIGRpY3Rpb25hcnkgdG8gYWxsb3cgZm9yIGdhcmJhZ2UgY29sbGVjdGlvblxuICAgIHRoaXMuY291bnRlcnMgPSB7fTtcbiAgICB0aGlzLl9sYXN0UmVzZXRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxuICBfZXhlY3V0ZUNhbGxiYWNrKHJlcGx5LCBydWxlSW5wdXQpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jYWxsYmFjaykge1xuICAgICAgICB0aGlzLm9wdGlvbnMuY2FsbGJhY2socmVwbHksIHJ1bGVJbnB1dCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gRG8gbm90IHRocm93IGVycm9yIGhlcmVcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFJhdGVMaW1pdGVyIHtcbiAgLy8gSW5pdGlhbGl6ZSBydWxlcyB0byBiZSBhbiBlbXB0eSBkaWN0aW9uYXJ5LlxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBEaWN0aW9uYXJ5IG9mIGFsbCBydWxlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBSYXRlTGltaXRlciwga2V5ZWQgYnkgdGhlaXJcbiAgICAvLyBpZC4gRWFjaCBydWxlIG9iamVjdCBzdG9yZXMgdGhlIHJ1bGUgcGF0dGVybiwgbnVtYmVyIG9mIGV2ZW50cyBhbGxvd2VkLFxuICAgIC8vIGxhc3QgcmVzZXQgdGltZSBhbmQgdGhlIHJ1bGUgcmVzZXQgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzLlxuXG4gICAgdGhpcy5ydWxlcyA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICogQ2hlY2tzIGlmIHRoaXMgaW5wdXQgaGFzIGV4Y2VlZGVkIGFueSByYXRlIGxpbWl0cy5cbiAgKiBAcGFyYW0gIHtvYmplY3R9IGlucHV0IGRpY3Rpb25hcnkgY29udGFpbmluZyBrZXktdmFsdWUgcGFpcnMgb2YgYXR0cmlidXRlc1xuICAqIHRoYXQgbWF0Y2ggdG8gcnVsZXNcbiAgKiBAcmV0dXJuIHtvYmplY3R9IFJldHVybnMgb2JqZWN0IG9mIGZvbGxvd2luZyBzdHJ1Y3R1cmVcbiAgKiB7ICdhbGxvd2VkJzogYm9vbGVhbiAtIGlzIHRoaXMgaW5wdXQgYWxsb3dlZFxuICAqICAgJ3RpbWVUb1Jlc2V0JzogaW50ZWdlciB8IEluZmluaXR5IC0gcmV0dXJucyB0aW1lIHVudGlsIGNvdW50ZXJzIGFyZSByZXNldFxuICAqICAgICAgICAgICAgICAgICAgIGluIG1pbGxpc2Vjb25kc1xuICAqICAgJ251bUludm9jYXRpb25zTGVmdCc6IGludGVnZXIgfCBJbmZpbml0eSAtIHJldHVybnMgbnVtYmVyIG9mIGNhbGxzIGxlZnRcbiAgKiAgIGJlZm9yZSBsaW1pdCBpcyByZWFjaGVkXG4gICogfVxuICAqIElmIG11bHRpcGxlIHJ1bGVzIG1hdGNoLCB0aGUgbGVhc3QgbnVtYmVyIG9mIGludm9jYXRpb25zIGxlZnQgaXMgcmV0dXJuZWQuXG4gICogSWYgdGhlIHJhdGUgbGltaXQgaGFzIGJlZW4gcmVhY2hlZCwgdGhlIGxvbmdlc3QgdGltZVRvUmVzZXQgaXMgcmV0dXJuZWQuXG4gICovXG4gIGNoZWNrKGlucHV0KSB7XG4gICAgY29uc3QgcmVwbHkgPSB7XG4gICAgICBhbGxvd2VkOiB0cnVlLFxuICAgICAgdGltZVRvUmVzZXQ6IDAsXG4gICAgICBudW1JbnZvY2F0aW9uc0xlZnQ6IEluZmluaXR5LFxuICAgIH07XG5cbiAgICBjb25zdCBtYXRjaGVkUnVsZXMgPSB0aGlzLl9maW5kQWxsTWF0Y2hpbmdSdWxlcyhpbnB1dCk7XG4gICAgbWF0Y2hlZFJ1bGVzLmZvckVhY2goKHJ1bGUpID0+IHtcbiAgICAgIGNvbnN0IHJ1bGVSZXN1bHQgPSBydWxlLmFwcGx5KGlucHV0KTtcbiAgICAgIGxldCBudW1JbnZvY2F0aW9ucyA9IHJ1bGUuY291bnRlcnNbcnVsZVJlc3VsdC5rZXldO1xuXG4gICAgICBpZiAocnVsZVJlc3VsdC50aW1lVG9OZXh0UmVzZXQgPCAwKSB7XG4gICAgICAgIC8vIFJlc2V0IGFsbCB0aGUgY291bnRlcnMgc2luY2UgdGhlIHJ1bGUgaGFzIHJlc2V0XG4gICAgICAgIHJ1bGUucmVzZXRDb3VudGVyKCk7XG4gICAgICAgIHJ1bGVSZXN1bHQudGltZVNpbmNlTGFzdFJlc2V0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLVxuICAgICAgICAgIHJ1bGUuX2xhc3RSZXNldFRpbWU7XG4gICAgICAgIHJ1bGVSZXN1bHQudGltZVRvTmV4dFJlc2V0ID0gcnVsZS5vcHRpb25zLmludGVydmFsVGltZTtcbiAgICAgICAgbnVtSW52b2NhdGlvbnMgPSAwO1xuICAgICAgfVxuXG4gICAgICBpZiAobnVtSW52b2NhdGlvbnMgPiBydWxlLm9wdGlvbnMubnVtUmVxdWVzdHNBbGxvd2VkKSB7XG4gICAgICAgIC8vIE9ubHkgdXBkYXRlIHRpbWVUb1Jlc2V0IGlmIHRoZSBuZXcgdGltZSB3b3VsZCBiZSBsb25nZXIgdGhhbiB0aGVcbiAgICAgICAgLy8gcHJldmlvdXNseSBzZXQgdGltZS4gVGhpcyBpcyB0byBlbnN1cmUgdGhhdCBpZiB0aGlzIGlucHV0IHRyaWdnZXJzXG4gICAgICAgIC8vIG11bHRpcGxlIHJ1bGVzLCB3ZSByZXR1cm4gdGhlIGxvbmdlc3QgcGVyaW9kIG9mIHRpbWUgdW50aWwgdGhleSBjYW5cbiAgICAgICAgLy8gc3VjY2Vzc2Z1bGx5IG1ha2UgYW5vdGhlciBjYWxsXG4gICAgICAgIGlmIChyZXBseS50aW1lVG9SZXNldCA8IHJ1bGVSZXN1bHQudGltZVRvTmV4dFJlc2V0KSB7XG4gICAgICAgICAgcmVwbHkudGltZVRvUmVzZXQgPSBydWxlUmVzdWx0LnRpbWVUb05leHRSZXNldDtcbiAgICAgICAgfVxuICAgICAgICByZXBseS5hbGxvd2VkID0gZmFsc2U7XG4gICAgICAgIHJlcGx5Lm51bUludm9jYXRpb25zTGVmdCA9IDA7XG4gICAgICAgIHJ1bGUuX2V4ZWN1dGVDYWxsYmFjayhyZXBseSwgaW5wdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhbiBhbGxvd2VkIGF0dGVtcHQgYW5kIHdlIGhhdmVuJ3QgZmFpbGVkIG9uIGFueSBvZiB0aGVcbiAgICAgICAgLy8gb3RoZXIgcnVsZXMgdGhhdCBtYXRjaCwgdXBkYXRlIHRoZSByZXBseSBmaWVsZC5cbiAgICAgICAgaWYgKHJ1bGUub3B0aW9ucy5udW1SZXF1ZXN0c0FsbG93ZWQgLSBudW1JbnZvY2F0aW9ucyA8XG4gICAgICAgICAgcmVwbHkubnVtSW52b2NhdGlvbnNMZWZ0ICYmIHJlcGx5LmFsbG93ZWQpIHtcbiAgICAgICAgICByZXBseS50aW1lVG9SZXNldCA9IHJ1bGVSZXN1bHQudGltZVRvTmV4dFJlc2V0O1xuICAgICAgICAgIHJlcGx5Lm51bUludm9jYXRpb25zTGVmdCA9IHJ1bGUub3B0aW9ucy5udW1SZXF1ZXN0c0FsbG93ZWQgLVxuICAgICAgICAgICAgbnVtSW52b2NhdGlvbnM7XG4gICAgICAgIH1cbiAgICAgICAgcnVsZS5fZXhlY3V0ZUNhbGxiYWNrKHJlcGx5LCBpbnB1dCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcGx5O1xuICB9XG5cbiAgLyoqXG4gICogQWRkcyBhIHJ1bGUgdG8gZGljdGlvbmFyeSBvZiBydWxlcyB0aGF0IGFyZSBjaGVja2VkIGFnYWluc3Qgb24gZXZlcnkgY2FsbC5cbiAgKiBPbmx5IGlucHV0cyB0aGF0IHBhc3MgYWxsIG9mIHRoZSBydWxlcyB3aWxsIGJlIGFsbG93ZWQuIFJldHVybnMgdW5pcXVlIHJ1bGVcbiAgKiBpZCB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYHJlbW92ZVJ1bGVgLlxuICAqIEBwYXJhbSB7b2JqZWN0fSBydWxlICAgIElucHV0IGRpY3Rpb25hcnkgZGVmaW5pbmcgY2VydGFpbiBhdHRyaWJ1dGVzIGFuZFxuICAqIHJ1bGVzIGFzc29jaWF0ZWQgd2l0aCB0aGVtLlxuICAqIEVhY2ggYXR0cmlidXRlJ3MgdmFsdWUgY2FuIGVpdGhlciBiZSBhIHZhbHVlLCBhIGZ1bmN0aW9uIG9yIG51bGwuIEFsbFxuICAqIGZ1bmN0aW9ucyBtdXN0IHJldHVybiBhIGJvb2xlYW4gb2Ygd2hldGhlciB0aGUgaW5wdXQgaXMgbWF0Y2hlZCBieSB0aGF0XG4gICogYXR0cmlidXRlJ3MgcnVsZSBvciBub3RcbiAgKiBAcGFyYW0ge2ludGVnZXJ9IG51bVJlcXVlc3RzQWxsb3dlZCBPcHRpb25hbC4gTnVtYmVyIG9mIGV2ZW50cyBhbGxvd2VkIHBlclxuICAqIGludGVydmFsLiBEZWZhdWx0ID0gMTAuXG4gICogQHBhcmFtIHtpbnRlZ2VyfSBpbnRlcnZhbFRpbWUgT3B0aW9uYWwuIE51bWJlciBvZiBtaWxsaXNlY29uZHMgYmVmb3JlXG4gICogcnVsZSdzIGNvdW50ZXJzIGFyZSByZXNldC4gRGVmYXVsdCA9IDEwMDAuXG4gICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgT3B0aW9uYWwuIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhZnRlciBhXG4gICogcnVsZSBpcyBleGVjdXRlZC4gVHdvIG9iamVjdHMgd2lsbCBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbi5cbiAgKiBUaGUgZmlyc3Qgb25lIGlzIHRoZSByZXN1bHQgb2YgUmF0ZUxpbWl0ZXIucHJvdG90eXBlLmNoZWNrXG4gICogVGhlIHNlY29uZCBpcyB0aGUgaW5wdXQgb2JqZWN0IG9mIHRoZSBydWxlLCBpdCBoYXMgdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XG4gICoge1xuICAqICAgJ3R5cGUnOiBzdHJpbmcgLSBlaXRoZXIgJ21ldGhvZCcgb3IgJ3N1YnNjcmlwdGlvbidcbiAgKiAgICduYW1lJzogc3RyaW5nIC0gdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBvciBzdWJzY3JpcHRpb24gYmVpbmcgY2FsbGVkXG4gICogICAndXNlcklkJzogc3RyaW5nIC0gdGhlIHVzZXIgSUQgYXR0ZW1wdGluZyB0aGUgbWV0aG9kIG9yIHN1YnNjcmlwdGlvblxuICAqICAgJ2Nvbm5lY3Rpb25JZCc6IHN0cmluZyAtIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdXNlcidzIEREUCBjb25uZWN0aW9uXG4gICogICAnY2xpZW50QWRkcmVzcyc6IHN0cmluZyAtIHRoZSBJUCBhZGRyZXNzIG9mIHRoZSB1c2VyXG4gICogfVxuICAqIEByZXR1cm4ge3N0cmluZ30gUmV0dXJucyB1bmlxdWUgcnVsZSBpZFxuICAqL1xuICBhZGRSdWxlKHJ1bGUsIG51bVJlcXVlc3RzQWxsb3dlZCwgaW50ZXJ2YWxUaW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBudW1SZXF1ZXN0c0FsbG93ZWQ6IG51bVJlcXVlc3RzQWxsb3dlZCB8fCBERUZBVUxUX1JFUVVFU1RTX1BFUl9JTlRFUlZBTCxcbiAgICAgIGludGVydmFsVGltZTogaW50ZXJ2YWxUaW1lIHx8IERFRkFVTFRfSU5URVJWQUxfVElNRV9JTl9NSUxMSVNFQ09ORFMsXG4gICAgICBjYWxsYmFjazogY2FsbGJhY2sgJiYgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjayksXG4gICAgfTtcblxuICAgIGNvbnN0IG5ld1J1bGUgPSBuZXcgUnVsZShvcHRpb25zLCBydWxlKTtcbiAgICB0aGlzLnJ1bGVzW25ld1J1bGUuaWRdID0gbmV3UnVsZTtcbiAgICByZXR1cm4gbmV3UnVsZS5pZDtcbiAgfVxuXG4gIC8qKlxuICAqIEluY3JlbWVudCBjb3VudGVycyBpbiBldmVyeSBydWxlIHRoYXQgbWF0Y2ggdG8gdGhpcyBpbnB1dFxuICAqIEBwYXJhbSAge29iamVjdH0gaW5wdXQgRGljdGlvbmFyeSBvYmplY3QgY29udGFpbmluZyBhdHRyaWJ1dGVzIHRoYXQgbWF5XG4gICogbWF0Y2ggdG8gcnVsZXNcbiAgKi9cbiAgaW5jcmVtZW50KGlucHV0KSB7XG4gICAgLy8gT25seSBpbmNyZW1lbnQgcnVsZSBjb3VudGVycyB0aGF0IG1hdGNoIHRoaXMgaW5wdXRcbiAgICBjb25zdCBtYXRjaGVkUnVsZXMgPSB0aGlzLl9maW5kQWxsTWF0Y2hpbmdSdWxlcyhpbnB1dCk7XG4gICAgbWF0Y2hlZFJ1bGVzLmZvckVhY2goKHJ1bGUpID0+IHtcbiAgICAgIGNvbnN0IHJ1bGVSZXN1bHQgPSBydWxlLmFwcGx5KGlucHV0KTtcblxuICAgICAgaWYgKHJ1bGVSZXN1bHQudGltZVNpbmNlTGFzdFJlc2V0ID4gcnVsZS5vcHRpb25zLmludGVydmFsVGltZSkge1xuICAgICAgICAvLyBSZXNldCBhbGwgdGhlIGNvdW50ZXJzIHNpbmNlIHRoZSBydWxlIGhhcyByZXNldFxuICAgICAgICBydWxlLnJlc2V0Q291bnRlcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBrZXkgZXhpc3RzLCBpbmNyZW1lbnRpbmcgaXQgaWYgc28gb3Igb3RoZXJ3aXNlXG4gICAgICAvLyBhZGRpbmcgdGhlIGtleSBhbmQgc2V0dGluZyBpdHMgdmFsdWUgdG8gMVxuICAgICAgaWYgKGhhc093bi5jYWxsKHJ1bGUuY291bnRlcnMsIHJ1bGVSZXN1bHQua2V5KSkge1xuICAgICAgICBydWxlLmNvdW50ZXJzW3J1bGVSZXN1bHQua2V5XSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcnVsZS5jb3VudGVyc1tydWxlUmVzdWx0LmtleV0gPSAxO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBhbGwgcnVsZXMgdGhhdCBhcHBseSB0byBwcm92aWRlZCBpbnB1dFxuICBfZmluZEFsbE1hdGNoaW5nUnVsZXMoaW5wdXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyh0aGlzLnJ1bGVzKS5maWx0ZXIocnVsZSA9PiBydWxlLm1hdGNoKGlucHV0KSk7XG4gIH1cblxuICAvKipcbiAgICogUHJvdmlkZXMgYSBtZWNoYW5pc20gdG8gcmVtb3ZlIHJ1bGVzIGZyb20gdGhlIHJhdGUgbGltaXRlci4gUmV0dXJucyBib29sZWFuXG4gICAqIGFib3V0IHN1Y2Nlc3MuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gaWQgUnVsZSBpZCByZXR1cm5lZCBmcm9tICNhZGRSdWxlXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBydWxlIHdhcyBmb3VuZCBhbmQgZGVsZXRlZCwgZWxzZSBmYWxzZS5cbiAgICovXG4gIHJlbW92ZVJ1bGUoaWQpIHtcbiAgICBpZiAodGhpcy5ydWxlc1tpZF0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnJ1bGVzW2lkXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IHsgUmF0ZUxpbWl0ZXIgfTtcbiJdfQ==

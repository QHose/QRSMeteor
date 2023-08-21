(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Random;

var require = meteorInstall({"node_modules":{"meteor":{"random":{"random.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/random/random.js                                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
// We use cryptographically strong PRNGs (crypto.getRandomBytes() on the server,
// window.crypto.getRandomValues() in the browser) when available. If these
// PRNGs fail, we fall back to the Alea PRNG, which is not cryptographically
// strong, and we seed it with various sources such as the date, Math.random,
// and window size on the client.  When using crypto.getRandomValues(), our
// primitive is hexString(), from which we construct fraction(). When using
// window.crypto.getRandomValues() or alea, the primitive is fraction and we use
// that to construct hex string.
if (Meteor.isServer) var nodeCrypto = Npm.require('crypto'); // see http://baagoe.org/en/wiki/Better_random_numbers_for_javascript
// for a full discussion and Alea implementation.

var Alea = function () {
  function Mash() {
    var n = 0xefc8249d;

    var mash = function (data) {
      data = data.toString();

      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }

      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
  }

  return function (args) {
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    if (args.length == 0) {
      args = [+new Date()];
    }

    var mash = Mash();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);

      if (s0 < 0) {
        s0 += 1;
      }

      s1 -= mash(args[i]);

      if (s1 < 0) {
        s1 += 1;
      }

      s2 -= mash(args[i]);

      if (s2 < 0) {
        s2 += 1;
      }
    }

    mash = null;

    var random = function () {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32

      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };

    random.uint32 = function () {
      return random() * 0x100000000; // 2^32
    };

    random.fract53 = function () {
      return random() + (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };

    random.version = 'Alea 0.9';
    random.args = args;
    return random;
  }(Array.prototype.slice.call(arguments));
};

var UNMISTAKABLE_CHARS = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
var BASE64_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" + "0123456789-_"; // `type` is one of `RandomGenerator.Type` as defined below.
//
// options:
// - seeds: (required, only for RandomGenerator.Type.ALEA) an array
//   whose items will be `toString`ed and used as the seed to the Alea
//   algorithm

var RandomGenerator = function (type, options) {
  var self = this;
  self.type = type;

  if (!RandomGenerator.Type[type]) {
    throw new Error("Unknown random generator type: " + type);
  }

  if (type === RandomGenerator.Type.ALEA) {
    if (!options.seeds) {
      throw new Error("No seeds were provided for Alea PRNG");
    }

    self.alea = Alea.apply(null, options.seeds);
  }
}; // Types of PRNGs supported by the `RandomGenerator` class


RandomGenerator.Type = {
  // Use Node's built-in `crypto.getRandomBytes` (cryptographically
  // secure but not seedable, runs only on the server). Reverts to
  // `crypto.getPseudoRandomBytes` in the extremely uncommon case that
  // there isn't enough entropy yet
  NODE_CRYPTO: "NODE_CRYPTO",
  // Use non-IE browser's built-in `window.crypto.getRandomValues`
  // (cryptographically secure but not seedable, runs only in the
  // browser).
  BROWSER_CRYPTO: "BROWSER_CRYPTO",
  // Use the *fast*, seedaable and not cryptographically secure
  // Alea algorithm
  ALEA: "ALEA"
};
/**
 * @name Random.fraction
 * @summary Return a number between 0 and 1, like `Math.random`.
 * @locus Anywhere
 */

RandomGenerator.prototype.fraction = function () {
  var self = this;

  if (self.type === RandomGenerator.Type.ALEA) {
    return self.alea();
  } else if (self.type === RandomGenerator.Type.NODE_CRYPTO) {
    var numerator = parseInt(self.hexString(8), 16);
    return numerator * 2.3283064365386963e-10; // 2^-32
  } else if (self.type === RandomGenerator.Type.BROWSER_CRYPTO) {
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] * 2.3283064365386963e-10; // 2^-32
  } else {
    throw new Error('Unknown random generator type: ' + self.type);
  }
};
/**
 * @name Random.hexString
 * @summary Return a random string of `n` hexadecimal digits.
 * @locus Anywhere
 * @param {Number} n Length of the string
 */


RandomGenerator.prototype.hexString = function (digits) {
  var self = this;

  if (self.type === RandomGenerator.Type.NODE_CRYPTO) {
    var numBytes = Math.ceil(digits / 2);
    var bytes; // Try to get cryptographically strong randomness. Fall back to
    // non-cryptographically strong if not available.

    try {
      bytes = nodeCrypto.randomBytes(numBytes);
    } catch (e) {
      // XXX should re-throw any error except insufficient entropy
      bytes = nodeCrypto.pseudoRandomBytes(numBytes);
    }

    var result = bytes.toString("hex"); // If the number of digits is odd, we'll have generated an extra 4 bits
    // of randomness, so we need to trim the last digit.

    return result.substring(0, digits);
  } else {
    return this._randomString(digits, "0123456789abcdef");
  }
};

RandomGenerator.prototype._randomString = function (charsCount, alphabet) {
  var self = this;
  var digits = [];

  for (var i = 0; i < charsCount; i++) {
    digits[i] = self.choice(alphabet);
  }

  return digits.join("");
};
/**
 * @name Random.id
 * @summary Return a unique identifier, such as `"Jjwjg6gouWLXhMGKW"`, that is
 * likely to be unique in the whole world.
 * @locus Anywhere
 * @param {Number} [n] Optional length of the identifier in characters
 *   (defaults to 17)
 */


RandomGenerator.prototype.id = function (charsCount) {
  var self = this; // 17 characters is around 96 bits of entropy, which is the amount of
  // state in the Alea PRNG.

  if (charsCount === undefined) charsCount = 17;
  return self._randomString(charsCount, UNMISTAKABLE_CHARS);
};
/**
 * @name Random.secret
 * @summary Return a random string of printable characters with 6 bits of
 * entropy per character. Use `Random.secret` for security-critical secrets
 * that are intended for machine, rather than human, consumption.
 * @locus Anywhere
 * @param {Number} [n] Optional length of the secret string (defaults to 43
 *   characters, or 256 bits of entropy)
 */


RandomGenerator.prototype.secret = function (charsCount) {
  var self = this; // Default to 256 bits of entropy, or 43 characters at 6 bits per
  // character.

  if (charsCount === undefined) charsCount = 43;
  return self._randomString(charsCount, BASE64_CHARS);
};
/**
 * @name Random.choice
 * @summary Return a random element of the given array or string.
 * @locus Anywhere
 * @param {Array|String} arrayOrString Array or string to choose from
 */


RandomGenerator.prototype.choice = function (arrayOrString) {
  var index = Math.floor(this.fraction() * arrayOrString.length);
  if (typeof arrayOrString === "string") return arrayOrString.substr(index, 1);else return arrayOrString[index];
}; // instantiate RNG.  Heuristically collect entropy from various sources when a
// cryptographic PRNG isn't available.
// client sources


var height = typeof window !== 'undefined' && window.innerHeight || typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight || typeof document !== 'undefined' && document.body && document.body.clientHeight || 1;
var width = typeof window !== 'undefined' && window.innerWidth || typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth || typeof document !== 'undefined' && document.body && document.body.clientWidth || 1;
var agent = typeof navigator !== 'undefined' && navigator.userAgent || "";

function createAleaGeneratorWithGeneratedSeed() {
  return new RandomGenerator(RandomGenerator.Type.ALEA, {
    seeds: [new Date(), height, width, agent, Math.random()]
  });
}

;

if (Meteor.isServer) {
  Random = new RandomGenerator(RandomGenerator.Type.NODE_CRYPTO);
} else {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    Random = new RandomGenerator(RandomGenerator.Type.BROWSER_CRYPTO);
  } else {
    // On IE 10 and below, there's no browser crypto API
    // available. Fall back to Alea
    //
    // XXX looks like at the moment, we use Alea in IE 11 as well,
    // which has `window.msCrypto` instead of `window.crypto`.
    Random = createAleaGeneratorWithGeneratedSeed();
  }
} // Create a non-cryptographically secure PRNG with a given seed (using
// the Alea algorithm)


Random.createWithSeeds = function (...seeds) {
  if (seeds.length === 0) {
    throw new Error("No seeds were provided");
  }

  return new RandomGenerator(RandomGenerator.Type.ALEA, {
    seeds: seeds
  });
}; // Used like `Random`, but much faster and not cryptographically
// secure


Random.insecure = createAleaGeneratorWithGeneratedSeed();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/random/random.js");

/* Exports */
Package._define("random", {
  Random: Random
});

})();

//# sourceURL=meteor://💻app/packages/random.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmFuZG9tL3JhbmRvbS5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJpc1NlcnZlciIsIm5vZGVDcnlwdG8iLCJOcG0iLCJyZXF1aXJlIiwiQWxlYSIsIk1hc2giLCJuIiwibWFzaCIsImRhdGEiLCJ0b1N0cmluZyIsImkiLCJsZW5ndGgiLCJjaGFyQ29kZUF0IiwiaCIsInZlcnNpb24iLCJhcmdzIiwiczAiLCJzMSIsInMyIiwiYyIsIkRhdGUiLCJyYW5kb20iLCJ0IiwidWludDMyIiwiZnJhY3Q1MyIsIkFycmF5IiwicHJvdG90eXBlIiwic2xpY2UiLCJjYWxsIiwiYXJndW1lbnRzIiwiVU5NSVNUQUtBQkxFX0NIQVJTIiwiQkFTRTY0X0NIQVJTIiwiUmFuZG9tR2VuZXJhdG9yIiwidHlwZSIsIm9wdGlvbnMiLCJzZWxmIiwiVHlwZSIsIkVycm9yIiwiQUxFQSIsInNlZWRzIiwiYWxlYSIsImFwcGx5IiwiTk9ERV9DUllQVE8iLCJCUk9XU0VSX0NSWVBUTyIsImZyYWN0aW9uIiwibnVtZXJhdG9yIiwicGFyc2VJbnQiLCJoZXhTdHJpbmciLCJhcnJheSIsIlVpbnQzMkFycmF5Iiwid2luZG93IiwiY3J5cHRvIiwiZ2V0UmFuZG9tVmFsdWVzIiwiZGlnaXRzIiwibnVtQnl0ZXMiLCJNYXRoIiwiY2VpbCIsImJ5dGVzIiwicmFuZG9tQnl0ZXMiLCJlIiwicHNldWRvUmFuZG9tQnl0ZXMiLCJyZXN1bHQiLCJzdWJzdHJpbmciLCJfcmFuZG9tU3RyaW5nIiwiY2hhcnNDb3VudCIsImFscGhhYmV0IiwiY2hvaWNlIiwiam9pbiIsImlkIiwidW5kZWZpbmVkIiwic2VjcmV0IiwiYXJyYXlPclN0cmluZyIsImluZGV4IiwiZmxvb3IiLCJzdWJzdHIiLCJoZWlnaHQiLCJpbm5lckhlaWdodCIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50SGVpZ2h0IiwiYm9keSIsIndpZHRoIiwiaW5uZXJXaWR0aCIsImNsaWVudFdpZHRoIiwiYWdlbnQiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJjcmVhdGVBbGVhR2VuZXJhdG9yV2l0aEdlbmVyYXRlZFNlZWQiLCJSYW5kb20iLCJjcmVhdGVXaXRoU2VlZHMiLCJpbnNlY3VyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQSxJQUFJQSxPQUFPQyxRQUFYLEVBQ0UsSUFBSUMsYUFBYUMsSUFBSUMsT0FBSixDQUFZLFFBQVosQ0FBakIsQyxDQUVGO0FBQ0E7O0FBQ0EsSUFBSUMsT0FBTyxZQUFZO0FBQ3JCLFdBQVNDLElBQVQsR0FBZ0I7QUFDZCxRQUFJQyxJQUFJLFVBQVI7O0FBRUEsUUFBSUMsT0FBTyxVQUFTQyxJQUFULEVBQWU7QUFDeEJBLGFBQU9BLEtBQUtDLFFBQUwsRUFBUDs7QUFDQSxXQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUYsS0FBS0csTUFBekIsRUFBaUNELEdBQWpDLEVBQXNDO0FBQ3BDSixhQUFLRSxLQUFLSSxVQUFMLENBQWdCRixDQUFoQixDQUFMO0FBQ0EsWUFBSUcsSUFBSSxzQkFBc0JQLENBQTlCO0FBQ0FBLFlBQUlPLE1BQU0sQ0FBVjtBQUNBQSxhQUFLUCxDQUFMO0FBQ0FPLGFBQUtQLENBQUw7QUFDQUEsWUFBSU8sTUFBTSxDQUFWO0FBQ0FBLGFBQUtQLENBQUw7QUFDQUEsYUFBS08sSUFBSSxXQUFULENBUm9DLENBUWQ7QUFDdkI7O0FBQ0QsYUFBTyxDQUFDUCxNQUFNLENBQVAsSUFBWSxzQkFBbkIsQ0Fad0IsQ0FZbUI7QUFDNUMsS0FiRDs7QUFlQUMsU0FBS08sT0FBTCxHQUFlLFVBQWY7QUFDQSxXQUFPUCxJQUFQO0FBQ0Q7O0FBRUQsU0FBUSxVQUFVUSxJQUFWLEVBQWdCO0FBQ3RCLFFBQUlDLEtBQUssQ0FBVDtBQUNBLFFBQUlDLEtBQUssQ0FBVDtBQUNBLFFBQUlDLEtBQUssQ0FBVDtBQUNBLFFBQUlDLElBQUks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TEEsZ0JBQWdCSSxJQUFoQixDQUFxQkUsSUFEaEIsRUFFTDtBQUFDQyxXQUFPLENBQUMsSUFBSW5CLElBQUosRUFBRCxFQUFXdUQsTUFBWCxFQUFtQk0sS0FBbkIsRUFBMEJHLEtBQTFCLEVBQWlDN0IsS0FBS2xDLE1BQUwsRUFBakM7QUFBUixHQUZLLENBQVA7QUFHRDs7QUFBQTs7QUFFRCxJQUFJdEIsT0FBT0MsUUFBWCxFQUFxQjtBQUNuQndGLFdBQVMsSUFBSXhELGVBQUosQ0FBb0JBLGdCQUFnQkksSUFBaEIsQ0FBcUJNLFdBQXpDLENBQVQ7QUFDRCxDQUZELE1BRU87QUFDTCxNQUFJLE9BQU9RLE1BQVAsS0FBa0IsV0FBbEIsSUFBaUNBLE9BQU9DLE1BQXhDLElBQ0FELE9BQU9DLE1BQVAsQ0FBY0MsZUFEbEIsRUFDbUM7QUFDakNvQyxhQUFTLElBQUl4RCxlQUFKLENBQW9CQSxnQkFBZ0JJLElBQWhCLENBQXFCTyxjQUF6QyxDQUFUO0FBQ0QsR0FIRCxNQUdPO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBNkMsYUFBU0Qsc0NBQVQ7QUFDRDtBQUNGLEMsQ0FFRDtBQUNBOzs7QUFDQUMsT0FBT0MsZUFBUCxHQUF5QixVQUFVLEdBQUdsRCxLQUFiLEVBQW9CO0FBQzNDLE1BQUlBLE1BQU01QixNQUFOLEtBQWlCLENBQXJCLEVBQXdCO0FBQ3RCLFVBQU0sSUFBSTBCLEtBQUosQ0FBVSx3QkFBVixDQUFOO0FBQ0Q7O0FBQ0QsU0FBTyxJQUFJTCxlQUFKLENBQW9CQSxnQkFBZ0JJLElBQWhCLENBQXFCRSxJQUF6QyxFQUErQztBQUFDQyxXQUFPQTtBQUFSLEdBQS9DLENBQVA7QUFDRCxDQUxELEMsQ0FPQTtBQUNBOzs7QUFDQWlELE9BQU9FLFFBQVAsR0FBa0JILHNDQUFsQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yYW5kb20uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZSB1c2UgY3J5cHRvZ3JhcGhpY2FsbHkgc3Ryb25nIFBSTkdzIChjcnlwdG8uZ2V0UmFuZG9tQnl0ZXMoKSBvbiB0aGUgc2VydmVyLFxuLy8gd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMoKSBpbiB0aGUgYnJvd3Nlcikgd2hlbiBhdmFpbGFibGUuIElmIHRoZXNlXG4vLyBQUk5HcyBmYWlsLCB3ZSBmYWxsIGJhY2sgdG8gdGhlIEFsZWEgUFJORywgd2hpY2ggaXMgbm90IGNyeXB0b2dyYXBoaWNhbGx5XG4vLyBzdHJvbmcsIGFuZCB3ZSBzZWVkIGl0IHdpdGggdmFyaW91cyBzb3VyY2VzIHN1Y2ggYXMgdGhlIGRhdGUsIE1hdGgucmFuZG9tLFxuLy8gYW5kIHdpbmRvdyBzaXplIG9uIHRoZSBjbGllbnQuICBXaGVuIHVzaW5nIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoKSwgb3VyXG4vLyBwcmltaXRpdmUgaXMgaGV4U3RyaW5nKCksIGZyb20gd2hpY2ggd2UgY29uc3RydWN0IGZyYWN0aW9uKCkuIFdoZW4gdXNpbmdcbi8vIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKCkgb3IgYWxlYSwgdGhlIHByaW1pdGl2ZSBpcyBmcmFjdGlvbiBhbmQgd2UgdXNlXG4vLyB0aGF0IHRvIGNvbnN0cnVjdCBoZXggc3RyaW5nLlxuXG5pZiAoTWV0ZW9yLmlzU2VydmVyKVxuICB2YXIgbm9kZUNyeXB0byA9IE5wbS5yZXF1aXJlKCdjcnlwdG8nKTtcblxuLy8gc2VlIGh0dHA6Ly9iYWFnb2Uub3JnL2VuL3dpa2kvQmV0dGVyX3JhbmRvbV9udW1iZXJzX2Zvcl9qYXZhc2NyaXB0XG4vLyBmb3IgYSBmdWxsIGRpc2N1c3Npb24gYW5kIEFsZWEgaW1wbGVtZW50YXRpb24uXG52YXIgQWxlYSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTWFzaCgpIHtcbiAgICB2YXIgbiA9IDB4ZWZjODI0OWQ7XG5cbiAgICB2YXIgbWFzaCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbiArPSBkYXRhLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIHZhciBoID0gMC4wMjUxOTYwMzI4MjQxNjkzOCAqIG47XG4gICAgICAgIG4gPSBoID4+PiAwO1xuICAgICAgICBoIC09IG47XG4gICAgICAgIGggKj0gbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgbiArPSBoICogMHgxMDAwMDAwMDA7IC8vIDJeMzJcbiAgICAgIH1cbiAgICAgIHJldHVybiAobiA+Pj4gMCkgKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuICAgIH07XG5cbiAgICBtYXNoLnZlcnNpb24gPSAnTWFzaCAwLjknO1xuICAgIHJldHVybiBtYXNoO1xuICB9XG5cbiAgcmV0dXJuIChmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBzMCA9IDA7XG4gICAgdmFyIHMxID0gMDtcbiAgICB2YXIgczIgPSAwO1xuICAgIHZhciBjID0gMTtcblxuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAwKSB7XG4gICAgICBhcmdzID0gWytuZXcgRGF0ZV07XG4gICAgfVxuICAgIHZhciBtYXNoID0gTWFzaCgpO1xuICAgIHMwID0gbWFzaCgnICcpO1xuICAgIHMxID0gbWFzaCgnICcpO1xuICAgIHMyID0gbWFzaCgnICcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzMCAtPSBtYXNoKGFyZ3NbaV0pO1xuICAgICAgaWYgKHMwIDwgMCkge1xuICAgICAgICBzMCArPSAxO1xuICAgICAgfVxuICAgICAgczEgLT0gbWFzaChhcmdzW2ldKTtcbiAgICAgIGlmIChzMSA8IDApIHtcbiAgICAgICAgczEgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMyIC09IG1hc2goYXJnc1tpXSk7XG4gICAgICBpZiAoczIgPCAwKSB7XG4gICAgICAgIHMyICs9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIG1hc2ggPSBudWxsO1xuXG4gICAgdmFyIHJhbmRvbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHQgPSAyMDkxNjM5ICogczAgKyBjICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICAgIHMwID0gczE7XG4gICAgICBzMSA9IHMyO1xuICAgICAgcmV0dXJuIHMyID0gdCAtIChjID0gdCB8IDApO1xuICAgIH07XG4gICAgcmFuZG9tLnVpbnQzMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJhbmRvbSgpICogMHgxMDAwMDAwMDA7IC8vIDJeMzJcbiAgICB9O1xuICAgIHJhbmRvbS5mcmFjdDUzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmFuZG9tKCkgK1xuICAgICAgICAocmFuZG9tKCkgKiAweDIwMDAwMCB8IDApICogMS4xMTAyMjMwMjQ2MjUxNTY1ZS0xNjsgLy8gMl4tNTNcbiAgICB9O1xuICAgIHJhbmRvbS52ZXJzaW9uID0gJ0FsZWEgMC45JztcbiAgICByYW5kb20uYXJncyA9IGFyZ3M7XG4gICAgcmV0dXJuIHJhbmRvbTtcblxuICB9IChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG52YXIgVU5NSVNUQUtBQkxFX0NIQVJTID0gXCIyMzQ1Njc4OUFCQ0RFRkdISktMTU5QUVJTVFdYWVphYmNkZWZnaGlqa21ub3BxcnN0dXZ3eHl6XCI7XG52YXIgQkFTRTY0X0NIQVJTID0gXCJhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXCIgK1xuICBcIjAxMjM0NTY3ODktX1wiO1xuXG4vLyBgdHlwZWAgaXMgb25lIG9mIGBSYW5kb21HZW5lcmF0b3IuVHlwZWAgYXMgZGVmaW5lZCBiZWxvdy5cbi8vXG4vLyBvcHRpb25zOlxuLy8gLSBzZWVkczogKHJlcXVpcmVkLCBvbmx5IGZvciBSYW5kb21HZW5lcmF0b3IuVHlwZS5BTEVBKSBhbiBhcnJheVxuLy8gICB3aG9zZSBpdGVtcyB3aWxsIGJlIGB0b1N0cmluZ2BlZCBhbmQgdXNlZCBhcyB0aGUgc2VlZCB0byB0aGUgQWxlYVxuLy8gICBhbGdvcml0aG1cbnZhciBSYW5kb21HZW5lcmF0b3IgPSBmdW5jdGlvbiAodHlwZSwgb3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYudHlwZSA9IHR5cGU7XG5cbiAgaWYgKCFSYW5kb21HZW5lcmF0b3IuVHlwZVt0eXBlXSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gcmFuZG9tIGdlbmVyYXRvciB0eXBlOiBcIiArIHR5cGUpO1xuICB9XG5cbiAgaWYgKHR5cGUgPT09IFJhbmRvbUdlbmVyYXRvci5UeXBlLkFMRUEpIHtcbiAgICBpZiAoIW9wdGlvbnMuc2VlZHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHNlZWRzIHdlcmUgcHJvdmlkZWQgZm9yIEFsZWEgUFJOR1wiKTtcbiAgICB9XG4gICAgc2VsZi5hbGVhID0gQWxlYS5hcHBseShudWxsLCBvcHRpb25zLnNlZWRzKTtcbiAgfVxufTtcblxuLy8gVHlwZXMgb2YgUFJOR3Mgc3VwcG9ydGVkIGJ5IHRoZSBgUmFuZG9tR2VuZXJhdG9yYCBjbGFzc1xuUmFuZG9tR2VuZXJhdG9yLlR5cGUgPSB7XG4gIC8vIFVzZSBOb2RlJ3MgYnVpbHQtaW4gYGNyeXB0by5nZXRSYW5kb21CeXRlc2AgKGNyeXB0b2dyYXBoaWNhbGx5XG4gIC8vIHNlY3VyZSBidXQgbm90IHNlZWRhYmxlLCBydW5zIG9ubHkgb24gdGhlIHNlcnZlcikuIFJldmVydHMgdG9cbiAgLy8gYGNyeXB0by5nZXRQc2V1ZG9SYW5kb21CeXRlc2AgaW4gdGhlIGV4dHJlbWVseSB1bmNvbW1vbiBjYXNlIHRoYXRcbiAgLy8gdGhlcmUgaXNuJ3QgZW5vdWdoIGVudHJvcHkgeWV0XG4gIE5PREVfQ1JZUFRPOiBcIk5PREVfQ1JZUFRPXCIsXG5cbiAgLy8gVXNlIG5vbi1JRSBicm93c2VyJ3MgYnVpbHQtaW4gYHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzYFxuICAvLyAoY3J5cHRvZ3JhcGhpY2FsbHkgc2VjdXJlIGJ1dCBub3Qgc2VlZGFibGUsIHJ1bnMgb25seSBpbiB0aGVcbiAgLy8gYnJvd3NlcikuXG4gIEJST1dTRVJfQ1JZUFRPOiBcIkJST1dTRVJfQ1JZUFRPXCIsXG5cbiAgLy8gVXNlIHRoZSAqZmFzdCosIHNlZWRhYWJsZSBhbmQgbm90IGNyeXB0b2dyYXBoaWNhbGx5IHNlY3VyZVxuICAvLyBBbGVhIGFsZ29yaXRobVxuICBBTEVBOiBcIkFMRUFcIixcbn07XG5cbi8qKlxuICogQG5hbWUgUmFuZG9tLmZyYWN0aW9uXG4gKiBAc3VtbWFyeSBSZXR1cm4gYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxLCBsaWtlIGBNYXRoLnJhbmRvbWAuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqL1xuUmFuZG9tR2VuZXJhdG9yLnByb3RvdHlwZS5mcmFjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAoc2VsZi50eXBlID09PSBSYW5kb21HZW5lcmF0b3IuVHlwZS5BTEVBKSB7XG4gICAgcmV0dXJuIHNlbGYuYWxlYSgpO1xuICB9IGVsc2UgaWYgKHNlbGYudHlwZSA9PT0gUmFuZG9tR2VuZXJhdG9yLlR5cGUuTk9ERV9DUllQVE8pIHtcbiAgICB2YXIgbnVtZXJhdG9yID0gcGFyc2VJbnQoc2VsZi5oZXhTdHJpbmcoOCksIDE2KTtcbiAgICByZXR1cm4gbnVtZXJhdG9yICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgfSBlbHNlIGlmIChzZWxmLnR5cGUgPT09IFJhbmRvbUdlbmVyYXRvci5UeXBlLkJST1dTRVJfQ1JZUFRPKSB7XG4gICAgdmFyIGFycmF5ID0gbmV3IFVpbnQzMkFycmF5KDEpO1xuICAgIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFycmF5KTtcbiAgICByZXR1cm4gYXJyYXlbMF0gKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biByYW5kb20gZ2VuZXJhdG9yIHR5cGU6ICcgKyBzZWxmLnR5cGUpO1xuICB9XG59O1xuXG4vKipcbiAqIEBuYW1lIFJhbmRvbS5oZXhTdHJpbmdcbiAqIEBzdW1tYXJ5IFJldHVybiBhIHJhbmRvbSBzdHJpbmcgb2YgYG5gIGhleGFkZWNpbWFsIGRpZ2l0cy5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtOdW1iZXJ9IG4gTGVuZ3RoIG9mIHRoZSBzdHJpbmdcbiAqL1xuUmFuZG9tR2VuZXJhdG9yLnByb3RvdHlwZS5oZXhTdHJpbmcgPSBmdW5jdGlvbiAoZGlnaXRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYgKHNlbGYudHlwZSA9PT0gUmFuZG9tR2VuZXJhdG9yLlR5cGUuTk9ERV9DUllQVE8pIHtcbiAgICB2YXIgbnVtQnl0ZXMgPSBNYXRoLmNlaWwoZGlnaXRzIC8gMik7XG4gICAgdmFyIGJ5dGVzO1xuICAgIC8vIFRyeSB0byBnZXQgY3J5cHRvZ3JhcGhpY2FsbHkgc3Ryb25nIHJhbmRvbW5lc3MuIEZhbGwgYmFjayB0b1xuICAgIC8vIG5vbi1jcnlwdG9ncmFwaGljYWxseSBzdHJvbmcgaWYgbm90IGF2YWlsYWJsZS5cbiAgICB0cnkge1xuICAgICAgYnl0ZXMgPSBub2RlQ3J5cHRvLnJhbmRvbUJ5dGVzKG51bUJ5dGVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBYWFggc2hvdWxkIHJlLXRocm93IGFueSBlcnJvciBleGNlcHQgaW5zdWZmaWNpZW50IGVudHJvcHlcbiAgICAgIGJ5dGVzID0gbm9kZUNyeXB0by5wc2V1ZG9SYW5kb21CeXRlcyhudW1CeXRlcyk7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBieXRlcy50b1N0cmluZyhcImhleFwiKTtcbiAgICAvLyBJZiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBpcyBvZGQsIHdlJ2xsIGhhdmUgZ2VuZXJhdGVkIGFuIGV4dHJhIDQgYml0c1xuICAgIC8vIG9mIHJhbmRvbW5lc3MsIHNvIHdlIG5lZWQgdG8gdHJpbSB0aGUgbGFzdCBkaWdpdC5cbiAgICByZXR1cm4gcmVzdWx0LnN1YnN0cmluZygwLCBkaWdpdHMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9yYW5kb21TdHJpbmcoZGlnaXRzLCBcIjAxMjM0NTY3ODlhYmNkZWZcIik7XG4gIH1cbn07XG5cblJhbmRvbUdlbmVyYXRvci5wcm90b3R5cGUuX3JhbmRvbVN0cmluZyA9IGZ1bmN0aW9uIChjaGFyc0NvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFscGhhYmV0KSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRpZ2l0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJzQ291bnQ7IGkrKykge1xuICAgIGRpZ2l0c1tpXSA9IHNlbGYuY2hvaWNlKGFscGhhYmV0KTtcbiAgfVxuICByZXR1cm4gZGlnaXRzLmpvaW4oXCJcIik7XG59O1xuXG4vKipcbiAqIEBuYW1lIFJhbmRvbS5pZFxuICogQHN1bW1hcnkgUmV0dXJuIGEgdW5pcXVlIGlkZW50aWZpZXIsIHN1Y2ggYXMgYFwiSmp3amc2Z291V0xYaE1HS1dcImAsIHRoYXQgaXNcbiAqIGxpa2VseSB0byBiZSB1bmlxdWUgaW4gdGhlIHdob2xlIHdvcmxkLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge051bWJlcn0gW25dIE9wdGlvbmFsIGxlbmd0aCBvZiB0aGUgaWRlbnRpZmllciBpbiBjaGFyYWN0ZXJzXG4gKiAgIChkZWZhdWx0cyB0byAxNylcbiAqL1xuUmFuZG9tR2VuZXJhdG9yLnByb3RvdHlwZS5pZCA9IGZ1bmN0aW9uIChjaGFyc0NvdW50KSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgLy8gMTcgY2hhcmFjdGVycyBpcyBhcm91bmQgOTYgYml0cyBvZiBlbnRyb3B5LCB3aGljaCBpcyB0aGUgYW1vdW50IG9mXG4gIC8vIHN0YXRlIGluIHRoZSBBbGVhIFBSTkcuXG4gIGlmIChjaGFyc0NvdW50ID09PSB1bmRlZmluZWQpXG4gICAgY2hhcnNDb3VudCA9IDE3O1xuXG4gIHJldHVybiBzZWxmLl9yYW5kb21TdHJpbmcoY2hhcnNDb3VudCwgVU5NSVNUQUtBQkxFX0NIQVJTKTtcbn07XG5cbi8qKlxuICogQG5hbWUgUmFuZG9tLnNlY3JldFxuICogQHN1bW1hcnkgUmV0dXJuIGEgcmFuZG9tIHN0cmluZyBvZiBwcmludGFibGUgY2hhcmFjdGVycyB3aXRoIDYgYml0cyBvZlxuICogZW50cm9weSBwZXIgY2hhcmFjdGVyLiBVc2UgYFJhbmRvbS5zZWNyZXRgIGZvciBzZWN1cml0eS1jcml0aWNhbCBzZWNyZXRzXG4gKiB0aGF0IGFyZSBpbnRlbmRlZCBmb3IgbWFjaGluZSwgcmF0aGVyIHRoYW4gaHVtYW4sIGNvbnN1bXB0aW9uLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge051bWJlcn0gW25dIE9wdGlvbmFsIGxlbmd0aCBvZiB0aGUgc2VjcmV0IHN0cmluZyAoZGVmYXVsdHMgdG8gNDNcbiAqICAgY2hhcmFjdGVycywgb3IgMjU2IGJpdHMgb2YgZW50cm9weSlcbiAqL1xuUmFuZG9tR2VuZXJhdG9yLnByb3RvdHlwZS5zZWNyZXQgPSBmdW5jdGlvbiAoY2hhcnNDb3VudCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIC8vIERlZmF1bHQgdG8gMjU2IGJpdHMgb2YgZW50cm9weSwgb3IgNDMgY2hhcmFjdGVycyBhdCA2IGJpdHMgcGVyXG4gIC8vIGNoYXJhY3Rlci5cbiAgaWYgKGNoYXJzQ291bnQgPT09IHVuZGVmaW5lZClcbiAgICBjaGFyc0NvdW50ID0gNDM7XG4gIHJldHVybiBzZWxmLl9yYW5kb21TdHJpbmcoY2hhcnNDb3VudCwgQkFTRTY0X0NIQVJTKTtcbn07XG5cbi8qKlxuICogQG5hbWUgUmFuZG9tLmNob2ljZVxuICogQHN1bW1hcnkgUmV0dXJuIGEgcmFuZG9tIGVsZW1lbnQgb2YgdGhlIGdpdmVuIGFycmF5IG9yIHN0cmluZy5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IGFycmF5T3JTdHJpbmcgQXJyYXkgb3Igc3RyaW5nIHRvIGNob29zZSBmcm9tXG4gKi9cblJhbmRvbUdlbmVyYXRvci5wcm90b3R5cGUuY2hvaWNlID0gZnVuY3Rpb24gKGFycmF5T3JTdHJpbmcpIHtcbiAgdmFyIGluZGV4ID0gTWF0aC5mbG9vcih0aGlzLmZyYWN0aW9uKCkgKiBhcnJheU9yU3RyaW5nLmxlbmd0aCk7XG4gIGlmICh0eXBlb2YgYXJyYXlPclN0cmluZyA9PT0gXCJzdHJpbmdcIilcbiAgICByZXR1cm4gYXJyYXlPclN0cmluZy5zdWJzdHIoaW5kZXgsIDEpO1xuICBlbHNlXG4gICAgcmV0dXJuIGFycmF5T3JTdHJpbmdbaW5kZXhdO1xufTtcblxuLy8gaW5zdGFudGlhdGUgUk5HLiAgSGV1cmlzdGljYWxseSBjb2xsZWN0IGVudHJvcHkgZnJvbSB2YXJpb3VzIHNvdXJjZXMgd2hlbiBhXG4vLyBjcnlwdG9ncmFwaGljIFBSTkcgaXNuJ3QgYXZhaWxhYmxlLlxuXG4vLyBjbGllbnQgc291cmNlc1xudmFyIGhlaWdodCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuaW5uZXJIZWlnaHQpIHx8XG4gICAgICAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuICAgICAgICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHx8XG4gICAgICAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICYmIGRvY3VtZW50LmJvZHlcbiAgICAgICAmJiBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCkgfHxcbiAgICAgIDE7XG5cbnZhciB3aWR0aCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuaW5uZXJXaWR0aCkgfHxcbiAgICAgICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnXG4gICAgICAgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XG4gICAgICAgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKSB8fFxuICAgICAgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAmJiBkb2N1bWVudC5ib2R5XG4gICAgICAgJiYgZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCkgfHxcbiAgICAgIDE7XG5cbnZhciBhZ2VudCA9ICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBcIlwiO1xuXG5mdW5jdGlvbiBjcmVhdGVBbGVhR2VuZXJhdG9yV2l0aEdlbmVyYXRlZFNlZWQoKSB7XG4gIHJldHVybiBuZXcgUmFuZG9tR2VuZXJhdG9yKFxuICAgIFJhbmRvbUdlbmVyYXRvci5UeXBlLkFMRUEsXG4gICAge3NlZWRzOiBbbmV3IERhdGUsIGhlaWdodCwgd2lkdGgsIGFnZW50LCBNYXRoLnJhbmRvbSgpXX0pO1xufTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBSYW5kb20gPSBuZXcgUmFuZG9tR2VuZXJhdG9yKFJhbmRvbUdlbmVyYXRvci5UeXBlLk5PREVfQ1JZUFRPKTtcbn0gZWxzZSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5jcnlwdG8gJiZcbiAgICAgIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgUmFuZG9tID0gbmV3IFJhbmRvbUdlbmVyYXRvcihSYW5kb21HZW5lcmF0b3IuVHlwZS5CUk9XU0VSX0NSWVBUTyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT24gSUUgMTAgYW5kIGJlbG93LCB0aGVyZSdzIG5vIGJyb3dzZXIgY3J5cHRvIEFQSVxuICAgIC8vIGF2YWlsYWJsZS4gRmFsbCBiYWNrIHRvIEFsZWFcbiAgICAvL1xuICAgIC8vIFhYWCBsb29rcyBsaWtlIGF0IHRoZSBtb21lbnQsIHdlIHVzZSBBbGVhIGluIElFIDExIGFzIHdlbGwsXG4gICAgLy8gd2hpY2ggaGFzIGB3aW5kb3cubXNDcnlwdG9gIGluc3RlYWQgb2YgYHdpbmRvdy5jcnlwdG9gLlxuICAgIFJhbmRvbSA9IGNyZWF0ZUFsZWFHZW5lcmF0b3JXaXRoR2VuZXJhdGVkU2VlZCgpO1xuICB9XG59XG5cbi8vIENyZWF0ZSBhIG5vbi1jcnlwdG9ncmFwaGljYWxseSBzZWN1cmUgUFJORyB3aXRoIGEgZ2l2ZW4gc2VlZCAodXNpbmdcbi8vIHRoZSBBbGVhIGFsZ29yaXRobSlcblJhbmRvbS5jcmVhdGVXaXRoU2VlZHMgPSBmdW5jdGlvbiAoLi4uc2VlZHMpIHtcbiAgaWYgKHNlZWRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHNlZWRzIHdlcmUgcHJvdmlkZWRcIik7XG4gIH1cbiAgcmV0dXJuIG5ldyBSYW5kb21HZW5lcmF0b3IoUmFuZG9tR2VuZXJhdG9yLlR5cGUuQUxFQSwge3NlZWRzOiBzZWVkc30pO1xufTtcblxuLy8gVXNlZCBsaWtlIGBSYW5kb21gLCBidXQgbXVjaCBmYXN0ZXIgYW5kIG5vdCBjcnlwdG9ncmFwaGljYWxseVxuLy8gc2VjdXJlXG5SYW5kb20uaW5zZWN1cmUgPSBjcmVhdGVBbGVhR2VuZXJhdG9yV2l0aEdlbmVyYXRlZFNlZWQoKTtcbiJdfQ==

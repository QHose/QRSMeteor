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
var Base64;

var require = meteorInstall({"node_modules":{"meteor":{"base64":{"base64.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/base64/base64.js                                                              //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
module.export({
  Base64: () => Base64
});
// Base 64 encoding
const BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE_64_VALS = Object.create(null);

const getChar = val => BASE_64_CHARS.charAt(val);

const getVal = ch => ch === '=' ? -1 : BASE_64_VALS[ch];

for (let i = 0; i < BASE_64_CHARS.length; i++) {
  BASE_64_VALS[getChar(i)] = i;
}

;

const encode = array => {
  if (typeof array === "string") {
    const str = array;
    array = newBinary(str.length);

    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);

      if (ch > 0xFF) {
        throw new Error("Not ascii. Base64.encode can only take ascii strings.");
      }

      array[i] = ch;
    }
  }

  const answer = [];
  let a = null;
  let b = null;
  let c = null;
  let d = null;
  array.forEach((elm, i) => {
    switch (i % 3) {
      case 0:
        a = elm >> 2 & 0x3F;
        b = (elm & 0x03) << 4;
        break;

      case 1:
        b = b | elm >> 4 & 0xF;
        c = (elm & 0xF) << 2;
        break;

      case 2:
        c = c | elm >> 6 & 0x03;
        d = elm & 0x3F;
        answer.push(getChar(a));
        answer.push(getChar(b));
        answer.push(getChar(c));
        answer.push(getChar(d));
        a = null;
        b = null;
        c = null;
        d = null;
        break;
    }
  });

  if (a != null) {
    answer.push(getChar(a));
    answer.push(getChar(b));

    if (c == null) {
      answer.push('=');
    } else {
      answer.push(getChar(c));
    }

    if (d == null) {
      answer.push('=');
    }
  }

  return answer.join("");
}; // XXX This is a weird place for this to live, but it's used both by
// this package and 'ejson', and we can't put it in 'ejson' without
// introducing a circular dependency. It should probably be in its own
// package or as a helper in a package that both 'base64' and 'ejson'
// use.


const newBinary = len => {
  if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
    const ret = [];

    for (let i = 0; i < len; i++) {
      ret.push(0);
    }

    ret.$Uint8ArrayPolyfill = true;
    return ret;
  }

  return new Uint8Array(new ArrayBuffer(len));
};

const decode = str => {
  let len = Math.floor(str.length * 3 / 4);

  if (str.charAt(str.length - 1) == '=') {
    len--;

    if (str.charAt(str.length - 2) == '=') {
      len--;
    }
  }

  const arr = newBinary(len);
  let one = null;
  let two = null;
  let three = null;
  let j = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    const v = getVal(c);

    switch (i % 4) {
      case 0:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }

        one = v << 2;
        break;

      case 1:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }

        one = one | v >> 4;
        arr[j++] = one;
        two = (v & 0x0F) << 4;
        break;

      case 2:
        if (v >= 0) {
          two = two | v >> 2;
          arr[j++] = two;
          three = (v & 0x03) << 6;
        }

        break;

      case 3:
        if (v >= 0) {
          arr[j++] = three | v;
        }

        break;
    }
  }

  return arr;
};

const Base64 = {
  encode,
  decode,
  newBinary
};
////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/base64/base64.js");

/* Exports */
Package._define("base64", exports, {
  Base64: Base64
});

})();

//# sourceURL=meteor://💻app/packages/base64.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYmFzZTY0L2Jhc2U2NC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJCYXNlNjQiLCJCQVNFXzY0X0NIQVJTIiwiQkFTRV82NF9WQUxTIiwiT2JqZWN0IiwiY3JlYXRlIiwiZ2V0Q2hhciIsInZhbCIsImNoYXJBdCIsImdldFZhbCIsImNoIiwiaSIsImxlbmd0aCIsImVuY29kZSIsImFycmF5Iiwic3RyIiwibmV3QmluYXJ5IiwiY2hhckNvZGVBdCIsIkVycm9yIiwiYW5zd2VyIiwiYSIsImIiLCJjIiwiZCIsImZvckVhY2giLCJlbG0iLCJwdXNoIiwiam9pbiIsImxlbiIsIlVpbnQ4QXJyYXkiLCJBcnJheUJ1ZmZlciIsInJldCIsIiRVaW50OEFycmF5UG9seWZpbGwiLCJkZWNvZGUiLCJNYXRoIiwiZmxvb3IiLCJhcnIiLCJvbmUiLCJ0d28iLCJ0aHJlZSIsImoiLCJ2Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxVQUFPLE1BQUlBO0FBQVosQ0FBZDtBQUFBO0FBRUEsTUFBTUMsZ0JBQWdCLGtFQUF0QjtBQUVBLE1BQU1DLGVBQWVDLE9BQU9DLE1BQVAsQ0FBYyxJQUFkLENBQXJCOztBQUVBLE1BQU1DLFVBQVVDLE9BQU9MLGNBQWNNLE1BQWQsQ0FBcUJELEdBQXJCLENBQXZCOztBQUNBLE1BQU1FLFNBQVNDLE1BQU1BLE9BQU8sR0FBUCxHQUFhLENBQUMsQ0FBZCxHQUFrQlAsYUFBYU8sRUFBYixDQUF2Qzs7QUFFQSxLQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSVQsY0FBY1UsTUFBbEMsRUFBMENELEdBQTFDLEVBQStDO0FBQzdDUixlQUFhRyxRQUFRSyxDQUFSLENBQWIsSUFBMkJBLENBQTNCO0FBQ0Q7O0FBQUE7O0FBRUQsTUFBTUUsU0FBU0MsU0FBUztBQUN0QixNQUFJLE9BQU9BLEtBQVAsS0FBaUIsUUFB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LFdBQUssQ0FBTDtBQUNFLFlBQUlBLEtBQUssQ0FBVCxFQUFZO0FBQ1ZMLGNBQUlJLEdBQUosSUFBV0QsUUFBUUUsQ0FBbkI7QUFDRDs7QUFFRDtBQTlCSjtBQWdDRDs7QUFFRCxTQUFPTCxHQUFQO0FBQ0QsQ0F2REQ7O0FBeURPLE1BQU1uQyxTQUFTO0FBQUVZLFFBQUY7QUFBVW9CLFFBQVY7QUFBa0JqQjtBQUFsQixDQUFmLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2Jhc2U2NC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEJhc2UgNjQgZW5jb2RpbmdcblxuY29uc3QgQkFTRV82NF9DSEFSUyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiO1xuXG5jb25zdCBCQVNFXzY0X1ZBTFMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5jb25zdCBnZXRDaGFyID0gdmFsID0+IEJBU0VfNjRfQ0hBUlMuY2hhckF0KHZhbCk7XG5jb25zdCBnZXRWYWwgPSBjaCA9PiBjaCA9PT0gJz0nID8gLTEgOiBCQVNFXzY0X1ZBTFNbY2hdO1xuXG5mb3IgKGxldCBpID0gMDsgaSA8IEJBU0VfNjRfQ0hBUlMubGVuZ3RoOyBpKyspIHtcbiAgQkFTRV82NF9WQUxTW2dldENoYXIoaSldID0gaTtcbn07XG5cbmNvbnN0IGVuY29kZSA9IGFycmF5ID0+IHtcbiAgaWYgKHR5cGVvZiBhcnJheSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHN0ciA9IGFycmF5O1xuICAgIGFycmF5ID0gbmV3QmluYXJ5KHN0ci5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaCA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNoID4gMHhGRikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJOb3QgYXNjaWkuIEJhc2U2NC5lbmNvZGUgY2FuIG9ubHkgdGFrZSBhc2NpaSBzdHJpbmdzLlwiKTtcbiAgICAgIH1cblxuICAgICAgYXJyYXlbaV0gPSBjaDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBhbnN3ZXIgPSBbXTtcbiAgbGV0IGEgPSBudWxsO1xuICBsZXQgYiA9IG51bGw7XG4gIGxldCBjID0gbnVsbDtcbiAgbGV0IGQgPSBudWxsO1xuXG4gIGFycmF5LmZvckVhY2goKGVsbSwgaSkgPT4ge1xuICAgIHN3aXRjaCAoaSAlIDMpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgYSA9IChlbG0gPj4gMikgJiAweDNGO1xuICAgICAgICBiID0gKGVsbSAmIDB4MDMpIDw8IDQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxOlxuICAgICAgICBiID0gYiB8IChlbG0gPj4gNCkgJiAweEY7XG4gICAgICAgIGMgPSAoZWxtICYgMHhGKSA8PCAyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgYyA9IGMgfCAoZWxtID4+IDYpICYgMHgwMztcbiAgICAgICAgZCA9IGVsbSAmIDB4M0Y7XG4gICAgICAgIGFuc3dlci5wdXNoKGdldENoYXIoYSkpO1xuICAgICAgICBhbnN3ZXIucHVzaChnZXRDaGFyKGIpKTtcbiAgICAgICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihjKSk7XG4gICAgICAgIGFuc3dlci5wdXNoKGdldENoYXIoZCkpO1xuICAgICAgICBhID0gbnVsbDtcbiAgICAgICAgYiA9IG51bGw7XG4gICAgICAgIGMgPSBudWxsO1xuICAgICAgICBkID0gbnVsbDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9KTtcblxuICBpZiAoYSAhPSBudWxsKSB7XG4gICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihhKSk7XG4gICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihiKSk7XG4gICAgaWYgKGMgPT0gbnVsbCkge1xuICAgICAgYW5zd2VyLnB1c2goJz0nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYW5zd2VyLnB1c2goZ2V0Q2hhcihjKSk7XG4gICAgfVxuICAgIFxuICAgIGlmIChkID09IG51bGwpIHtcbiAgICAgIGFuc3dlci5wdXNoKCc9Jyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFuc3dlci5qb2luKFwiXCIpO1xufTtcblxuXG5cbi8vIFhYWCBUaGlzIGlzIGEgd2VpcmQgcGxhY2UgZm9yIHRoaXMgdG8gbGl2ZSwgYnV0IGl0J3MgdXNlZCBib3RoIGJ5XG4vLyB0aGlzIHBhY2thZ2UgYW5kICdlanNvbicsIGFuZCB3ZSBjYW4ndCBwdXQgaXQgaW4gJ2Vqc29uJyB3aXRob3V0XG4vLyBpbnRyb2R1Y2luZyBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuIEl0IHNob3VsZCBwcm9iYWJseSBiZSBpbiBpdHMgb3duXG4vLyBwYWNrYWdlIG9yIGFzIGEgaGVscGVyIGluIGEgcGFja2FnZSB0aGF0IGJvdGggJ2Jhc2U2NCcgYW5kICdlanNvbidcbi8vIHVzZS5cbmNvbnN0IG5ld0JpbmFyeSA9IGxlbiA9PiB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIEFycmF5QnVmZmVyID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnN0IHJldCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHJldC5wdXNoKDApO1xuICAgIH1cblxuICAgIHJldC4kVWludDhBcnJheVBvbHlmaWxsID0gdHJ1ZTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIHJldHVybiBuZXcgVWludDhBcnJheShuZXcgQXJyYXlCdWZmZXIobGVuKSk7XG59O1xuXG5jb25zdCBkZWNvZGUgPSBzdHIgPT4ge1xuICBsZXQgbGVuID0gTWF0aC5mbG9vcigoc3RyLmxlbmd0aCAqIDMpIC8gNCk7XG4gIGlmIChzdHIuY2hhckF0KHN0ci5sZW5ndGggLSAxKSA9PSAnPScpIHtcbiAgICBsZW4tLTtcbiAgICBpZiAoc3RyLmNoYXJBdChzdHIubGVuZ3RoIC0gMikgPT0gJz0nKSB7XG4gICAgICBsZW4tLTtcbiAgICB9XG4gIH1cbiAgXG4gIGNvbnN0IGFyciA9IG5ld0JpbmFyeShsZW4pO1xuXG4gIGxldCBvbmUgPSBudWxsO1xuICBsZXQgdHdvID0gbnVsbDtcbiAgbGV0IHRocmVlID0gbnVsbDtcblxuICBsZXQgaiA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjID0gc3RyLmNoYXJBdChpKTtcbiAgICBjb25zdCB2ID0gZ2V0VmFsKGMpO1xuICAgIHN3aXRjaCAoaSAlIDQpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgaWYgKHYgPCAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGJhc2U2NCBzdHJpbmcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9uZSA9IHYgPDwgMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGlmICh2IDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBiYXNlNjQgc3RyaW5nJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvbmUgPSBvbmUgfCAodiA+PiA0KTtcbiAgICAgICAgYXJyW2orK10gPSBvbmU7XG4gICAgICAgIHR3byA9ICh2ICYgMHgwRikgPDwgNDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGlmICh2ID49IDApIHtcbiAgICAgICAgICB0d28gPSB0d28gfCAodiA+PiAyKTtcbiAgICAgICAgICBhcnJbaisrXSA9IHR3bztcbiAgICAgICAgICB0aHJlZSA9ICh2ICYgMHgwMykgPDwgNjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBpZiAodiA+PSAwKSB7XG4gICAgICAgICAgYXJyW2orK10gPSB0aHJlZSB8IHY7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBhcnI7XG59O1xuXG5leHBvcnQgY29uc3QgQmFzZTY0ID0geyBlbmNvZGUsIGRlY29kZSwgbmV3QmluYXJ5IH07XG4iXX0=

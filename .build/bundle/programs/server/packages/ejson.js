(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Base64 = Package.base64.Base64;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var v, EJSON;

var require = meteorInstall({"node_modules":{"meteor":{"ejson":{"ejson.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ejson/ejson.js                                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                             //
                                                                                                                    //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                    //
                                                                                                                    //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                   //
                                                                                                                    //
module.export({                                                                                                     // 1
  EJSON: function () {                                                                                              // 1
    return EJSON;                                                                                                   // 1
  }                                                                                                                 // 1
});                                                                                                                 // 1
/**                                                                                                                 // 1
 * @namespace                                                                                                       //
 * @summary Namespace for EJSON functions                                                                           //
 */var EJSON = {}; // Custom type interface definition                                                              //
/**                                                                                                                 // 8
 * @class CustomType                                                                                                //
 * @instanceName customType                                                                                         //
 * @memberOf EJSON                                                                                                  //
 * @summary The interface that a class must satisfy to be able to become an                                         //
 * EJSON custom type via EJSON.addType.                                                                             //
 */ /**                                                                                                             //
     * @function typeName                                                                                           //
     * @memberOf EJSON.CustomType                                                                                   //
     * @summary Return the tag used to identify this type.  This must match the                                     //
     *          tag used to register this type with                                                                 //
     *          [`EJSON.addType`](#ejson_add_type).                                                                 //
     * @locus Anywhere                                                                                              //
     * @instance                                                                                                    //
     */ /**                                                                                                         //
         * @function toJSONValue                                                                                    //
         * @memberOf EJSON.CustomType                                                                               //
         * @summary Serialize this instance into a JSON-compatible value.                                           //
         * @locus Anywhere                                                                                          //
         * @instance                                                                                                //
         */ /**                                                                                                     //
             * @function clone                                                                                      //
             * @memberOf EJSON.CustomType                                                                           //
             * @summary Return a value `r` such that `this.equals(r)` is true, and                                  //
             *          modifications to `r` do not affect `this` and vice versa.                                   //
             * @locus Anywhere                                                                                      //
             * @instance                                                                                            //
             */ /**                                                                                                 //
                 * @function equals                                                                                 //
                 * @memberOf EJSON.CustomType                                                                       //
                 * @summary Return `true` if `other` has a value equal to `this`; `false`                           //
                 *          otherwise.                                                                              //
                 * @locus Anywhere                                                                                  //
                 * @param {Object} other Another object to compare this to.                                         //
                 * @instance                                                                                        //
                 */                                                                                                 //
var customTypes = {};                                                                                               // 53
                                                                                                                    //
var hasOwn = function (obj, prop) {                                                                                 // 55
  return {}.hasOwnProperty.call(obj, prop);                                                                         // 55
};                                                                                                                  // 55
                                                                                                                    //
var isArguments = function (obj) {                                                                                  // 57
  return obj != null && hasOwn(obj, 'callee');                                                                      // 57
};                                                                                                                  // 57
                                                                                                                    //
var isInfOrNan = function (obj) {                                                                                   // 59
  return Number.isNaN(obj) || obj === Infinity || obj === -Infinity;                                                // 60
}; // Add a custom type, using a method of your choice to get to and                                                // 60
// from a basic JSON-able representation.  The factory argument                                                     // 63
// is a function of JSON-able --> your object                                                                       // 64
// The type you add must have:                                                                                      // 65
// - A toJSONValue() method, so that Meteor can serialize it                                                        // 66
// - a typeName() method, to show how to look it up in our type table.                                              // 67
// It is okay if these methods are monkey-patched on.                                                               // 68
// EJSON.clone will use toJSONValue and the given factory to produce                                                // 69
// a clone, but you may specify a method clone() that will be                                                       // 70
// used instead.                                                                                                    // 71
// Similarly, EJSON.equals will use toJSONValue to make comparisons,                                                // 72
// but you may provide a method equals() instead.                                                                   // 73
/**                                                                                                                 // 74
 * @summary Add a custom datatype to EJSON.                                                                         //
 * @locus Anywhere                                                                                                  //
 * @param {String} name A tag for your custom type; must be unique among                                            //
 *                      custom data types defined in your project, and must                                         //
 *                      match the result of your type's `typeName` method.                                          //
 * @param {Function} factory A function that deserializes a JSON-compatible                                         //
 *                           value into an instance of your type.  This should                                      //
 *                           match the serialization performed by your                                              //
 *                           type's `toJSONValue` method.                                                           //
 */                                                                                                                 //
                                                                                                                    //
EJSON.addType = function (name, factory) {                                                                          // 85
  if (hasOwn(customTypes, name)) {                                                                                  // 86
    throw new Error("Type " + name + " already present");                                                           // 87
  }                                                                                                                 // 88
                                                                                                                    //
  customTypes[name] = factory;                                                                                      // 89
};                                                                                                                  // 90
                                                                                                                    //
var builtinConverters = [{                                                                                          // 92
  // Date                                                                                                           // 93
  matchJSONValue: function (obj) {                                                                                  // 94
    return hasOwn(obj, '$date') && Object.keys(obj).length === 1;                                                   // 95
  },                                                                                                                // 96
  matchObject: function (obj) {                                                                                     // 97
    return obj instanceof Date;                                                                                     // 98
  },                                                                                                                // 99
  toJSONValue: function (obj) {                                                                                     // 100
    return {                                                                                                        // 101
      $date: obj.getTime()                                                                                          // 101
    };                                                                                                              // 101
  },                                                                                                                // 102
  fromJSONValue: function (obj) {                                                                                   // 103
    return new Date(obj.$date);                                                                                     // 104
  }                                                                                                                 // 105
}, {                                                                                                                // 93
  // RegExp                                                                                                         // 107
  matchJSONValue: function (obj) {                                                                                  // 108
    return hasOwn(obj, '$regexp') && hasOwn(obj, '$flags') && Object.keys(obj).length === 2;                        // 109
  },                                                                                                                // 112
  matchObject: function (obj) {                                                                                     // 113
    return obj instanceof RegExp;                                                                                   // 114
  },                                                                                                                // 115
  toJSONValue: function (regexp) {                                                                                  // 116
    return {                                                                                                        // 117
      $regexp: regexp.source,                                                                                       // 118
      $flags: regexp.flags                                                                                          // 119
    };                                                                                                              // 117
  },                                                                                                                // 121
  fromJSONValue: function (obj) {                                                                                   // 122
    // Replaces duplicate / invalid flags.                                                                          // 123
    return new RegExp(obj.$regexp, obj.$flags // Cut off flags at 50 chars to avoid abusing RegExp for DOS.         // 124
    .slice(0, 50).replace(/[^gimuy]/g, '').replace(/(.)(?=.*\1)/g, ''));                                            // 126
  }                                                                                                                 // 132
}, {                                                                                                                // 107
  // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'                                           // 134
  // which we match.)                                                                                               // 135
  matchJSONValue: function (obj) {                                                                                  // 136
    return hasOwn(obj, '$InfNaN') && Object.keys(obj).length === 1;                                                 // 137
  },                                                                                                                // 138
  matchObject: isInfOrNan,                                                                                          // 139
  toJSONValue: function (obj) {                                                                                     // 140
    var sign = void 0;                                                                                              // 141
                                                                                                                    //
    if (Number.isNaN(obj)) {                                                                                        // 142
      sign = 0;                                                                                                     // 143
    } else if (obj === Infinity) {                                                                                  // 144
      sign = 1;                                                                                                     // 145
    } else {                                                                                                        // 146
      sign = -1;                                                                                                    // 147
    }                                                                                                               // 148
                                                                                                                    //
    return {                                                                                                        // 149
      $InfNaN: sign                                                                                                 // 149
    };                                                                                                              // 149
  },                                                                                                                // 150
  fromJSONValue: function (obj) {                                                                                   // 151
    return obj.$InfNaN / 0;                                                                                         // 152
  }                                                                                                                 // 153
}, {                                                                                                                // 134
  // Binary                                                                                                         // 155
  matchJSONValue: function (obj) {                                                                                  // 156
    return hasOwn(obj, '$binary') && Object.keys(obj).length === 1;                                                 // 157
  },                                                                                                                // 158
  matchObject: function (obj) {                                                                                     // 159
    return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && hasOwn(obj, '$Uint8ArrayPolyfill');
  },                                                                                                                // 162
  toJSONValue: function (obj) {                                                                                     // 163
    return {                                                                                                        // 164
      $binary: Base64.encode(obj)                                                                                   // 164
    };                                                                                                              // 164
  },                                                                                                                // 165
  fromJSONValue: function (obj) {                                                                                   // 166
    return Base64.decode(obj.$binary);                                                                              // 167
  }                                                                                                                 // 168
}, {                                                                                                                // 155
  // Escaping one level                                                                                             // 170
  matchJSONValue: function (obj) {                                                                                  // 171
    return hasOwn(obj, '$escape') && Object.keys(obj).length === 1;                                                 // 172
  },                                                                                                                // 173
  matchObject: function (obj) {                                                                                     // 174
    var match = false;                                                                                              // 175
                                                                                                                    //
    if (obj) {                                                                                                      // 176
      var keyCount = Object.keys(obj).length;                                                                       // 177
                                                                                                                    //
      if (keyCount === 1 || keyCount === 2) {                                                                       // 178
        match = builtinConverters.some(function (converter) {                                                       // 179
          return converter.matchJSONValue(obj);                                                                     // 180
        });                                                                                                         // 180
      }                                                                                                             // 181
    }                                                                                                               // 182
                                                                                                                    //
    return match;                                                                                                   // 183
  },                                                                                                                // 184
  toJSONValue: function (obj) {                                                                                     // 185
    var newObj = {};                                                                                                // 186
    Object.keys(obj).forEach(function (key) {                                                                       // 187
      newObj[key] = EJSON.toJSONValue(obj[key]);                                                                    // 188
    });                                                                                                             // 189
    return {                                                                                                        // 190
      $escape: newObj                                                                                               // 190
    };                                                                                                              // 190
  },                                                                                                                // 191
  fromJSONValue: function (obj) {                                                                                   // 192
    var newObj = {};                                                                                                // 193
    Object.keys(obj.$escape).forEach(function (key) {                                                               // 194
      newObj[key] = EJSON.fromJSONValue(obj.$escape[key]);                                                          // 195
    });                                                                                                             // 196
    return newObj;                                                                                                  // 197
  }                                                                                                                 // 198
}, {                                                                                                                // 170
  // Custom                                                                                                         // 200
  matchJSONValue: function (obj) {                                                                                  // 201
    return hasOwn(obj, '$type') && hasOwn(obj, '$value') && Object.keys(obj).length === 2;                          // 202
  },                                                                                                                // 204
  matchObject: function (obj) {                                                                                     // 205
    return EJSON._isCustomType(obj);                                                                                // 206
  },                                                                                                                // 207
  toJSONValue: function (obj) {                                                                                     // 208
    var jsonValue = Meteor._noYieldsAllowed(function () {                                                           // 209
      return obj.toJSONValue();                                                                                     // 209
    });                                                                                                             // 209
                                                                                                                    //
    return {                                                                                                        // 210
      $type: obj.typeName(),                                                                                        // 210
      $value: jsonValue                                                                                             // 210
    };                                                                                                              // 210
  },                                                                                                                // 211
  fromJSONValue: function (obj) {                                                                                   // 212
    var typeName = obj.$type;                                                                                       // 213
                                                                                                                    //
    if (!hasOwn(customTypes, typeName)) {                                                                           // 214
      throw new Error("Custom EJSON type " + typeName + " is not defined");                                         // 215
    }                                                                                                               // 216
                                                                                                                    //
    var converter = customTypes[typeName];                                                                          // 217
    return Meteor._noYieldsAllowed(function () {                                                                    // 218
      return converter(obj.$value);                                                                                 // 218
    });                                                                                                             // 218
  }                                                                                                                 // 219
}];                                                                                                                 // 200
                                                                                                                    //
EJSON._isCustomType = function (obj) {                                                                              // 223
  return obj && typeof obj.toJSONValue === 'function' && typeof obj.typeName === 'function' && hasOwn(customTypes, obj.typeName());
};                                                                                                                  // 223
                                                                                                                    //
EJSON._getTypes = function () {                                                                                     // 230
  return customTypes;                                                                                               // 230
};                                                                                                                  // 230
                                                                                                                    //
EJSON._getConverters = function () {                                                                                // 232
  return builtinConverters;                                                                                         // 232
}; // Either return the JSON-compatible version of the argument, or undefined (if                                   // 232
// the item isn't itself replaceable, but maybe some fields in it are)                                              // 235
                                                                                                                    //
                                                                                                                    //
var toJSONValueHelper = function (item) {                                                                           // 236
  for (var i = 0; i < builtinConverters.length; i++) {                                                              // 237
    var converter = builtinConverters[i];                                                                           // 238
                                                                                                                    //
    if (converter.matchObject(item)) {                                                                              // 239
      return converter.toJSONValue(item);                                                                           // 240
    }                                                                                                               // 241
  }                                                                                                                 // 242
                                                                                                                    //
  return undefined;                                                                                                 // 243
}; // for both arrays and objects, in-place modification.                                                           // 244
                                                                                                                    //
                                                                                                                    //
var adjustTypesToJSONValue = function (obj) {                                                                       // 247
  // Is it an atom that we need to adjust?                                                                          // 248
  if (obj === null) {                                                                                               // 249
    return null;                                                                                                    // 250
  }                                                                                                                 // 251
                                                                                                                    //
  var maybeChanged = toJSONValueHelper(obj);                                                                        // 253
                                                                                                                    //
  if (maybeChanged !== undefined) {                                                                                 // 254
    return maybeChanged;                                                                                            // 255
  } // Other atoms are unchanged.                                                                                   // 256
                                                                                                                    //
                                                                                                                    //
  if ((typeof obj === "undefined" ? "undefined" : (0, _typeof3.default)(obj)) !== 'object') {                       // 259
    return obj;                                                                                                     // 260
  } // Iterate over array or object structure.                                                                      // 261
                                                                                                                    //
                                                                                                                    //
  Object.keys(obj).forEach(function (key) {                                                                         // 264
    var value = obj[key];                                                                                           // 265
                                                                                                                    //
    if ((typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) !== 'object' && value !== undefined && !isInfOrNan(value)) {
      return; // continue                                                                                           // 268
    }                                                                                                               // 269
                                                                                                                    //
    var changed = toJSONValueHelper(value);                                                                         // 271
                                                                                                                    //
    if (changed) {                                                                                                  // 272
      obj[key] = changed;                                                                                           // 273
      return; // on to the next key                                                                                 // 274
    } // if we get here, value is an object but not adjustable                                                      // 275
    // at this level.  recurse.                                                                                     // 277
                                                                                                                    //
                                                                                                                    //
    adjustTypesToJSONValue(value);                                                                                  // 278
  });                                                                                                               // 279
  return obj;                                                                                                       // 280
};                                                                                                                  // 281
                                                                                                                    //
EJSON._adjustTypesToJSONValue = adjustTypesToJSONValue; /**                                                         // 283
                                                         * @summary Serialize an EJSON-compatible value into its plain JSON
                                                         *          representation.                                 //
                                                         * @locus Anywhere                                          //
                                                         * @param {EJSON} val A value to serialize to plain JSON.   //
                                                         */                                                         //
                                                                                                                    //
EJSON.toJSONValue = function (item) {                                                                               // 291
  var changed = toJSONValueHelper(item);                                                                            // 292
                                                                                                                    //
  if (changed !== undefined) {                                                                                      // 293
    return changed;                                                                                                 // 294
  }                                                                                                                 // 295
                                                                                                                    //
  var newItem = item;                                                                                               // 297
                                                                                                                    //
  if ((typeof item === "undefined" ? "undefined" : (0, _typeof3.default)(item)) === 'object') {                     // 298
    newItem = EJSON.clone(item);                                                                                    // 299
    adjustTypesToJSONValue(newItem);                                                                                // 300
  }                                                                                                                 // 301
                                                                                                                    //
  return newItem;                                                                                                   // 302
}; // Either return the argument changed to have the non-json                                                       // 303
// rep of itself (the Object version) or the argument itself.                                                       // 306
// DOES NOT RECURSE.  For actually getting the fully-changed value, use                                             // 307
// EJSON.fromJSONValue                                                                                              // 308
                                                                                                                    //
                                                                                                                    //
var fromJSONValueHelper = function (value) {                                                                        // 309
  if ((typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) === 'object' && value !== null) {
    var keys = Object.keys(value);                                                                                  // 311
                                                                                                                    //
    if (keys.length <= 2 && keys.every(function (k) {                                                               // 312
      return typeof k === 'string' && k.substr(0, 1) === '$';                                                       // 313
    })) {                                                                                                           // 313
      for (var i = 0; i < builtinConverters.length; i++) {                                                          // 314
        var converter = builtinConverters[i];                                                                       // 315
                                                                                                                    //
        if (converter.matchJSONValue(value)) {                                                                      // 316
          return converter.fromJSONValue(value);                                                                    // 317
        }                                                                                                           // 318
      }                                                                                                             // 319
    }                                                                                                               // 320
  }                                                                                                                 // 321
                                                                                                                    //
  return value;                                                                                                     // 322
}; // for both arrays and objects. Tries its best to just                                                           // 323
// use the object you hand it, but may return something                                                             // 326
// different if the object you hand it itself needs changing.                                                       // 327
                                                                                                                    //
                                                                                                                    //
var adjustTypesFromJSONValue = function (obj) {                                                                     // 328
  if (obj === null) {                                                                                               // 329
    return null;                                                                                                    // 330
  }                                                                                                                 // 331
                                                                                                                    //
  var maybeChanged = fromJSONValueHelper(obj);                                                                      // 333
                                                                                                                    //
  if (maybeChanged !== obj) {                                                                                       // 334
    return maybeChanged;                                                                                            // 335
  } // Other atoms are unchanged.                                                                                   // 336
                                                                                                                    //
                                                                                                                    //
  if ((typeof obj === "undefined" ? "undefined" : (0, _typeof3.default)(obj)) !== 'object') {                       // 339
    return obj;                                                                                                     // 340
  }                                                                                                                 // 341
                                                                                                                    //
  Object.keys(obj).forEach(function (key) {                                                                         // 343
    var value = obj[key];                                                                                           // 344
                                                                                                                    //
    if ((typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) === 'object') {                 // 345
      var changed = fromJSONValueHelper(value);                                                                     // 346
                                                                                                                    //
      if (value !== changed) {                                                                                      // 347
        obj[key] = changed;                                                                                         // 348
        return;                                                                                                     // 349
      } // if we get here, value is an object but not adjustable                                                    // 350
      // at this level.  recurse.                                                                                   // 352
                                                                                                                    //
                                                                                                                    //
      adjustTypesFromJSONValue(value);                                                                              // 353
    }                                                                                                               // 354
  });                                                                                                               // 355
  return obj;                                                                                                       // 356
};                                                                                                                  // 357
                                                                                                                    //
EJSON._adjustTypesFromJSONValue = adjustTypesFromJSONValue; /**                                                     // 359
                                                             * @summary Deserialize an EJSON value from its plain JSON representation.
                                                             * @locus Anywhere                                      //
                                                             * @param {JSONCompatible} val A value to deserialize into EJSON.
                                                             */                                                     //
                                                                                                                    //
EJSON.fromJSONValue = function (item) {                                                                             // 366
  var changed = fromJSONValueHelper(item);                                                                          // 367
                                                                                                                    //
  if (changed === item && (typeof item === "undefined" ? "undefined" : (0, _typeof3.default)(item)) === 'object') {
    changed = EJSON.clone(item);                                                                                    // 369
    adjustTypesFromJSONValue(changed);                                                                              // 370
  }                                                                                                                 // 371
                                                                                                                    //
  return changed;                                                                                                   // 372
}; /**                                                                                                              // 373
    * @summary Serialize a value to a string. For EJSON values, the serialization                                   //
    *          fully represents the value. For non-EJSON values, serializes the                                     //
    *          same way as `JSON.stringify`.                                                                        //
    * @locus Anywhere                                                                                               //
    * @param {EJSON} val A value to stringify.                                                                      //
    * @param {Object} [options]                                                                                     //
    * @param {Boolean | Integer | String} options.indent Indents objects and                                        //
    * arrays for easy readability.  When `true`, indents by 2 spaces; when an                                       //
    * integer, indents by that number of spaces; and when a string, uses the                                        //
    * string as the indentation pattern.                                                                            //
    * @param {Boolean} options.canonical When `true`, stringifies keys in an                                        //
    *                                    object in sorted order.                                                    //
    */                                                                                                              //
                                                                                                                    //
EJSON.stringify = function (item, options) {                                                                        // 389
  var serialized = void 0;                                                                                          // 390
  var json = EJSON.toJSONValue(item);                                                                               // 391
                                                                                                                    //
  if (options && (options.canonical || options.indent)) {                                                           // 392
    var canonicalStringify = void 0;                                                                                // 1
    module.watch(require("./stringify"), {                                                                          // 1
      "default": function (v) {                                                                                     // 1
        canonicalStringify = v;                                                                                     // 1
      }                                                                                                             // 1
    }, 0);                                                                                                          // 1
    serialized = canonicalStringify(json, options);                                                                 // 394
  } else {                                                                                                          // 395
    serialized = JSON.stringify(json);                                                                              // 396
  }                                                                                                                 // 397
                                                                                                                    //
  return serialized;                                                                                                // 398
}; /**                                                                                                              // 399
    * @summary Parse a string into an EJSON value. Throws an error if the string                                    //
    *          is not valid EJSON.                                                                                  //
    * @locus Anywhere                                                                                               //
    * @param {String} str A string to parse into an EJSON value.                                                    //
    */                                                                                                              //
                                                                                                                    //
EJSON.parse = function (item) {                                                                                     // 407
  if (typeof item !== 'string') {                                                                                   // 408
    throw new Error('EJSON.parse argument should be a string');                                                     // 409
  }                                                                                                                 // 410
                                                                                                                    //
  return EJSON.fromJSONValue(JSON.parse(item));                                                                     // 411
}; /**                                                                                                              // 412
    * @summary Returns true if `x` is a buffer of binary data, as returned from                                     //
    *          [`EJSON.newBinary`](#ejson_new_binary).                                                              //
    * @param {Object} x The variable to check.                                                                      //
    * @locus Anywhere                                                                                               //
    */                                                                                                              //
                                                                                                                    //
EJSON.isBinary = function (obj) {                                                                                   // 420
  return !!(typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && obj.$Uint8ArrayPolyfill);      // 421
}; /**                                                                                                              // 423
    * @summary Return true if `a` and `b` are equal to each other.  Return false                                    //
    *          otherwise.  Uses the `equals` method on `a` if present, otherwise                                    //
    *          performs a deep comparison.                                                                          //
    * @locus Anywhere                                                                                               //
    * @param {EJSON} a                                                                                              //
    * @param {EJSON} b                                                                                              //
    * @param {Object} [options]                                                                                     //
    * @param {Boolean} options.keyOrderSensitive Compare in key sensitive order,                                    //
    * if supported by the JavaScript implementation.  For example, `{a: 1, b: 2}`                                   //
    * is equal to `{b: 2, a: 1}` only when `keyOrderSensitive` is `false`.  The                                     //
    * default is `false`.                                                                                           //
    */                                                                                                              //
                                                                                                                    //
EJSON.equals = function (a, b, options) {                                                                           // 438
  var i = void 0;                                                                                                   // 439
  var keyOrderSensitive = !!(options && options.keyOrderSensitive);                                                 // 440
                                                                                                                    //
  if (a === b) {                                                                                                    // 441
    return true;                                                                                                    // 442
  } // This differs from the IEEE spec for NaN equality, b/c we don't want                                          // 443
  // anything ever with a NaN to be poisoned from becoming equal to anything.                                       // 446
                                                                                                                    //
                                                                                                                    //
  if (Number.isNaN(a) && Number.isNaN(b)) {                                                                         // 447
    return true;                                                                                                    // 448
  } // if either one is falsy, they'd have to be === to be equal                                                    // 449
                                                                                                                    //
                                                                                                                    //
  if (!a || !b) {                                                                                                   // 452
    return false;                                                                                                   // 453
  }                                                                                                                 // 454
                                                                                                                    //
  if (!((typeof a === "undefined" ? "undefined" : (0, _typeof3.default)(a)) === 'object' && (typeof b === "undefined" ? "undefined" : (0, _typeof3.default)(b)) === 'object')) {
    return false;                                                                                                   // 457
  }                                                                                                                 // 458
                                                                                                                    //
  if (a instanceof Date && b instanceof Date) {                                                                     // 460
    return a.valueOf() === b.valueOf();                                                                             // 461
  }                                                                                                                 // 462
                                                                                                                    //
  if (EJSON.isBinary(a) && EJSON.isBinary(b)) {                                                                     // 464
    if (a.length !== b.length) {                                                                                    // 465
      return false;                                                                                                 // 466
    }                                                                                                               // 467
                                                                                                                    //
    for (i = 0; i < a.length; i++) {                                                                                // 468
      if (a[i] !== b[i]) {                                                                                          // 469
        return false;                                                                                               // 470
      }                                                                                                             // 471
    }                                                                                                               // 472
                                                                                                                    //
    return true;                                                                                                    // 473
  }                                                                                                                 // 474
                                                                                                                    //
  if (typeof a.equals === 'function') {                                                                             // 476
    return a.equals(b, options);                                                                                    // 477
  }                                                                                                                 // 478
                                                                                                                    //
  if (typeof b.equals === 'function') {                                                                             // 480
    return b.equals(a, options);                                                                                    // 481
  }                                                                                                                 // 482
                                                                                                                    //
  if (a instanceof Array) {                                                                                         // 484
    if (!(b instanceof Array)) {                                                                                    // 485
      return false;                                                                                                 // 486
    }                                                                                                               // 487
                                                                                                                    //
    if (a.length !== b.length) {                                                                                    // 488
      return false;                                                                                                 // 489
    }                                                                                                               // 490
                                                                                                                    //
    for (i = 0; i < a.length; i++) {                                                                                // 491
      if (!EJSON.equals(a[i], b[i], options)) {                                                                     // 492
        return false;                                                                                               // 493
      }                                                                                                             // 494
    }                                                                                                               // 495
                                                                                                                    //
    return true;                                                                                                    // 496
  } // fallback for custom types that don't implement their own equals                                              // 497
                                                                                                                    //
                                                                                                                    //
  switch (EJSON._isCustomType(a) + EJSON._isCustomType(b)) {                                                        // 500
    case 1:                                                                                                         // 501
      return false;                                                                                                 // 501
                                                                                                                    //
    case 2:                                                                                                         // 502
      return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));                                              // 502
                                                                                                                    //
    default: // Do nothing                                                                                          // 503
  } // fall back to structural equality of objects                                                                  // 500
                                                                                                                    //
                                                                                                                    //
  var ret = void 0;                                                                                                 // 507
  var aKeys = Object.keys(a);                                                                                       // 508
  var bKeys = Object.keys(b);                                                                                       // 509
                                                                                                                    //
  if (keyOrderSensitive) {                                                                                          // 510
    i = 0;                                                                                                          // 511
    ret = aKeys.every(function (key) {                                                                              // 512
      if (i >= bKeys.length) {                                                                                      // 513
        return false;                                                                                               // 514
      }                                                                                                             // 515
                                                                                                                    //
      if (key !== bKeys[i]) {                                                                                       // 516
        return false;                                                                                               // 517
      }                                                                                                             // 518
                                                                                                                    //
      if (!EJSON.equals(a[key], b[bKeys[i]], options)) {                                                            // 519
        return false;                                                                                               // 520
      }                                                                                                             // 521
                                                                                                                    //
      i++;                                                                                                          // 522
      return true;                                                                                                  // 523
    });                                                                                                             // 524
  } else {                                                                                                          // 525
    i = 0;                                                                                                          // 526
    ret = aKeys.every(function (key) {                                                                              // 527
      if (!hasOwn(b, key)) {                                                                                        // 528
        return false;                                                                                               // 529
      }                                                                                                             // 530
                                                                                                                    //
      if (!EJSON.equals(a[key], b[key], options)) {                                                                 // 531
        return false;                                                                                               // 532
      }                                                                                                             // 533
                                                                                                                    //
      i++;                                                                                                          // 534
      return true;                                                                                                  // 535
    });                                                                                                             // 536
  }                                                                                                                 // 537
                                                                                                                    //
  return ret && i === bKeys.length;                                                                                 // 538
}; /**                                                                                                              // 539
    * @summary Return a deep copy of `val`.                                                                         //
    * @locus Anywhere                                                                                               //
    * @param {EJSON} val A value to copy.                                                                           //
    */                                                                                                              //
                                                                                                                    //
EJSON.clone = function (v) {                                                                                        // 546
  var ret = void 0;                                                                                                 // 547
                                                                                                                    //
  if ((typeof v === "undefined" ? "undefined" : (0, _typeof3.default)(v)) !== 'object') {                           // 548
    return v;                                                                                                       // 549
  }                                                                                                                 // 550
                                                                                                                    //
  if (v === null) {                                                                                                 // 552
    return null; // null has typeof "object"                                                                        // 553
  }                                                                                                                 // 554
                                                                                                                    //
  if (v instanceof Date) {                                                                                          // 556
    return new Date(v.getTime());                                                                                   // 557
  } // RegExps are not really EJSON elements (eg we don't define a serialization                                    // 558
  // for them), but they're immutable anyway, so we can support them in clone.                                      // 561
                                                                                                                    //
                                                                                                                    //
  if (v instanceof RegExp) {                                                                                        // 562
    return v;                                                                                                       // 563
  }                                                                                                                 // 564
                                                                                                                    //
  if (EJSON.isBinary(v)) {                                                                                          // 566
    ret = EJSON.newBinary(v.length);                                                                                // 567
                                                                                                                    //
    for (var i = 0; i < v.length; i++) {                                                                            // 568
      ret[i] = v[i];                                                                                                // 569
    }                                                                                                               // 570
                                                                                                                    //
    return ret;                                                                                                     // 571
  }                                                                                                                 // 572
                                                                                                                    //
  if (Array.isArray(v)) {                                                                                           // 574
    return v.map(function (value) {                                                                                 // 575
      return EJSON.clone(value);                                                                                    // 575
    });                                                                                                             // 575
  }                                                                                                                 // 576
                                                                                                                    //
  if (isArguments(v)) {                                                                                             // 578
    return Array.from(v).map(function (value) {                                                                     // 579
      return EJSON.clone(value);                                                                                    // 579
    });                                                                                                             // 579
  } // handle general user-defined typed Objects if they have a clone method                                        // 580
                                                                                                                    //
                                                                                                                    //
  if (typeof v.clone === 'function') {                                                                              // 583
    return v.clone();                                                                                               // 584
  } // handle other custom types                                                                                    // 585
                                                                                                                    //
                                                                                                                    //
  if (EJSON._isCustomType(v)) {                                                                                     // 588
    return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)), true);                                            // 589
  } // handle other objects                                                                                         // 590
                                                                                                                    //
                                                                                                                    //
  ret = {};                                                                                                         // 593
  Object.keys(v).forEach(function (key) {                                                                           // 594
    ret[key] = EJSON.clone(v[key]);                                                                                 // 595
  });                                                                                                               // 596
  return ret;                                                                                                       // 597
}; /**                                                                                                              // 598
    * @summary Allocate a new buffer of binary data that EJSON can serialize.                                       //
    * @locus Anywhere                                                                                               //
    * @param {Number} size The number of bytes of binary data to allocate.                                          //
    */ // EJSON.newBinary is the public documented API for this functionality,                                      //
// but the implementation is in the 'base64' package to avoid                                                       // 606
// introducing a circular dependency. (If the implementation were here,                                             // 607
// then 'base64' would have to use EJSON.newBinary, and 'ejson' would                                               // 608
// also have to use 'base64'.)                                                                                      // 609
                                                                                                                    //
                                                                                                                    //
EJSON.newBinary = Base64.newBinary;                                                                                 // 610
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stringify.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/ejson/stringify.js                                                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                             //
                                                                                                                    //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                    //
                                                                                                                    //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                   //
                                                                                                                    //
// Based on json2.js from https://github.com/douglascrockford/JSON-js                                               // 1
//                                                                                                                  // 2
//    json2.js                                                                                                      // 3
//    2012-10-08                                                                                                    // 4
//                                                                                                                  // 5
//    Public Domain.                                                                                                // 6
//                                                                                                                  // 7
//    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.                                                       // 8
function quote(string) {                                                                                            // 10
  return JSON.stringify(string);                                                                                    // 11
}                                                                                                                   // 12
                                                                                                                    //
var str = function (key, holder, singleIndent, outerIndent, canonical) {                                            // 14
  var value = holder[key]; // What happens next depends on the value's type.                                        // 15
                                                                                                                    //
  switch (typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) {                              // 18
    case 'string':                                                                                                  // 19
      return quote(value);                                                                                          // 20
                                                                                                                    //
    case 'number':                                                                                                  // 21
      // JSON numbers must be finite. Encode non-finite numbers as null.                                            // 22
      return isFinite(value) ? String(value) : 'null';                                                              // 23
                                                                                                                    //
    case 'boolean':                                                                                                 // 24
      return String(value);                                                                                         // 25
    // If the type is 'object', we might be dealing with an object or an array or                                   // 26
    // null.                                                                                                        // 27
                                                                                                                    //
    case 'object':                                                                                                  // 28
      // Due to a specification blunder in ECMAScript, typeof null is 'object',                                     // 29
      // so watch out for that case.                                                                                // 30
      if (!value) {                                                                                                 // 31
        return 'null';                                                                                              // 32
      } // Make an array to hold the partial results of stringifying this object                                    // 33
      // value.                                                                                                     // 35
                                                                                                                    //
                                                                                                                    //
      var innerIndent = outerIndent + singleIndent;                                                                 // 36
      var partial = []; // Is the value an array?                                                                   // 37
                                                                                                                    //
      if (Array.isArray(value) || {}.hasOwnProperty.call(value, 'callee')) {                                        // 40
        // The value is an array. Stringify every element. Use null as a                                            // 41
        // placeholder for non-JSON values.                                                                         // 42
        var length = value.length;                                                                                  // 43
                                                                                                                    //
        for (var i = 0; i < length; i += 1) {                                                                       // 44
          partial[i] = str(i, value, singleIndent, innerIndent, canonical) || 'null';                               // 45
        } // Join all of the elements together, separated with commas, and wrap                                     // 47
        // them in brackets.                                                                                        // 50
                                                                                                                    //
                                                                                                                    //
        var _v = void 0;                                                                                            // 51
                                                                                                                    //
        if (partial.length === 0) {                                                                                 // 52
          _v = '[]';                                                                                                // 53
        } else if (innerIndent) {                                                                                   // 54
          _v = '[\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + ']';                  // 55
        } else {                                                                                                    // 62
          _v = '[' + partial.join(',') + ']';                                                                       // 63
        }                                                                                                           // 64
                                                                                                                    //
        return _v;                                                                                                  // 65
      } // Iterate through all of the keys in the object.                                                           // 66
                                                                                                                    //
                                                                                                                    //
      var keys = Object.keys(value);                                                                                // 69
                                                                                                                    //
      if (canonical) {                                                                                              // 70
        keys = keys.sort();                                                                                         // 71
      }                                                                                                             // 72
                                                                                                                    //
      keys.forEach(function (k) {                                                                                   // 73
        v = str(k, value, singleIndent, innerIndent, canonical);                                                    // 74
                                                                                                                    //
        if (v) {                                                                                                    // 75
          partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);                                                  // 76
        }                                                                                                           // 77
      }); // Join all of the member texts together, separated with commas,                                          // 78
      // and wrap them in braces.                                                                                   // 81
                                                                                                                    //
      if (partial.length === 0) {                                                                                   // 82
        v = '{}';                                                                                                   // 83
      } else if (innerIndent) {                                                                                     // 84
        v = '{\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + '}';                     // 85
      } else {                                                                                                      // 92
        v = '{' + partial.join(',') + '}';                                                                          // 93
      }                                                                                                             // 94
                                                                                                                    //
      return v;                                                                                                     // 95
                                                                                                                    //
    default: // Do nothing                                                                                          // 97
  }                                                                                                                 // 18
}; // If the JSON object does not yet have a stringify method, give it one.                                         // 99
                                                                                                                    //
                                                                                                                    //
var canonicalStringify = function (value, options) {                                                                // 102
  // Make a fake root object containing our value under the key of ''.                                              // 103
  // Return the result of stringifying the value.                                                                   // 104
  var allOptions = Object.assign({                                                                                  // 105
    indent: '',                                                                                                     // 106
    canonical: false                                                                                                // 107
  }, options);                                                                                                      // 105
                                                                                                                    //
  if (allOptions.indent === true) {                                                                                 // 109
    allOptions.indent = '  ';                                                                                       // 110
  } else if (typeof allOptions.indent === 'number') {                                                               // 111
    var newIndent = '';                                                                                             // 112
                                                                                                                    //
    for (var i = 0; i < allOptions.indent; i++) {                                                                   // 113
      newIndent += ' ';                                                                                             // 114
    }                                                                                                               // 115
                                                                                                                    //
    allOptions.indent = newIndent;                                                                                  // 116
  }                                                                                                                 // 117
                                                                                                                    //
  return str('', {                                                                                                  // 118
    '': value                                                                                                       // 118
  }, allOptions.indent, '', allOptions.canonical);                                                                  // 118
};                                                                                                                  // 119
                                                                                                                    //
module.exportDefault(canonicalStringify);                                                                           // 1
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/ejson/ejson.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.ejson = exports, {
  EJSON: EJSON
});

})();

//# sourceMappingURL=ejson.js.map

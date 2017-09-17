(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var GeoJSON = Package['geojson-utils'].GeoJSON;
var IdMap = Package['id-map'].IdMap;
var MongoID = Package['mongo-id'].MongoID;
var OrderedDict = Package['ordered-dict'].OrderedDict;
var Random = Package.random.Random;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var subMatcher, MinimongoTest, MinimongoError, LocalCollection, Minimongo;

var require = meteorInstall({"node_modules":{"meteor":{"minimongo":{"minimongo_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/minimongo_server.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./minimongo_common.js"));                                                                        // 1
var hasOwn = void 0,                                                                                                   // 1
    isNumericKey = void 0,                                                                                             // 1
    isOperatorObject = void 0,                                                                                         // 1
    pathsToTree = void 0,                                                                                              // 1
    projectionDetails = void 0;                                                                                        // 1
module.watch(require("./common.js"), {                                                                                 // 1
  hasOwn: function (v) {                                                                                               // 1
    hasOwn = v;                                                                                                        // 1
  },                                                                                                                   // 1
  isNumericKey: function (v) {                                                                                         // 1
    isNumericKey = v;                                                                                                  // 1
  },                                                                                                                   // 1
  isOperatorObject: function (v) {                                                                                     // 1
    isOperatorObject = v;                                                                                              // 1
  },                                                                                                                   // 1
  pathsToTree: function (v) {                                                                                          // 1
    pathsToTree = v;                                                                                                   // 1
  },                                                                                                                   // 1
  projectionDetails: function (v) {                                                                                    // 1
    projectionDetails = v;                                                                                             // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
                                                                                                                       //
Minimongo._pathsElidingNumericKeys = function (paths) {                                                                // 10
  return paths.map(function (path) {                                                                                   // 10
    return path.split('.').filter(function (part) {                                                                    // 10
      return !isNumericKey(part);                                                                                      // 11
    }).join('.');                                                                                                      // 11
  });                                                                                                                  // 10
}; // Returns true if the modifier applied to some document may change the result                                      // 10
// of matching the document by selector                                                                                // 15
// The modifier is always in a form of Object:                                                                         // 16
//  - $set                                                                                                             // 17
//    - 'a.b.22.z': value                                                                                              // 18
//    - 'foo.bar': 42                                                                                                  // 19
//  - $unset                                                                                                           // 20
//    - 'abc.d': 1                                                                                                     // 21
                                                                                                                       //
                                                                                                                       //
Minimongo.Matcher.prototype.affectedByModifier = function (modifier) {                                                 // 22
  // safe check for $set/$unset being objects                                                                          // 23
  modifier = Object.assign({                                                                                           // 24
    $set: {},                                                                                                          // 24
    $unset: {}                                                                                                         // 24
  }, modifier);                                                                                                        // 24
                                                                                                                       //
  var meaningfulPaths = this._getPaths();                                                                              // 26
                                                                                                                       //
  var modifiedPaths = [].concat(Object.keys(modifier.$set), Object.keys(modifier.$unset));                             // 27
  return modifiedPaths.some(function (path) {                                                                          // 32
    var mod = path.split('.');                                                                                         // 33
    return meaningfulPaths.some(function (meaningfulPath) {                                                            // 35
      var sel = meaningfulPath.split('.');                                                                             // 36
      var i = 0,                                                                                                       // 38
          j = 0;                                                                                                       // 38
                                                                                                                       //
      while (i < sel.length && j < mod.length) {                                                                       // 40
        if (isNumericKey(sel[i]) && isNumericKey(mod[j])) {                                                            // 41
          // foo.4.bar selector affected by foo.4 modifier                                                             // 42
          // foo.3.bar selector unaffected by foo.4 modifier                                                           // 43
          if (sel[i] === mod[j]) {                                                                                     // 44
            i++;                                                                                                       // 45
            j++;                                                                                                       // 46
          } else {                                                                                                     // 47
            return false;                                                                                              // 48
          }                                                                                                            // 49
        } else if (isNumericKey(sel[i])) {                                                                             // 50
          // foo.4.bar selector unaffected by foo.bar modifier                                                         // 51
          return false;                                                                                                // 52
        } else if (isNumericKey(mod[j])) {                                                                             // 53
          j++;                                                                                                         // 54
        } else if (sel[i] === mod[j]) {                                                                                // 55
          i++;                                                                                                         // 56
          j++;                                                                                                         // 57
        } else {                                                                                                       // 58
          return false;                                                                                                // 59
        }                                                                                                              // 60
      } // One is a prefix of another, taking numeric fields into account                                              // 61
                                                                                                                       //
                                                                                                                       //
      return true;                                                                                                     // 64
    });                                                                                                                // 65
  });                                                                                                                  // 66
}; // @param modifier - Object: MongoDB-styled modifier with `$set`s and `$unsets`                                     // 67
//                           only. (assumed to come from oplog)                                                        // 70
// @returns - Boolean: if after applying the modifier, selector can start                                              // 71
//                     accepting the modified value.                                                                   // 72
// NOTE: assumes that document affected by modifier didn't match this Matcher                                          // 73
// before, so if modifier can't convince selector in a positive change it would                                        // 74
// stay 'false'.                                                                                                       // 75
// Currently doesn't support $-operators and numeric indices precisely.                                                // 76
                                                                                                                       //
                                                                                                                       //
Minimongo.Matcher.prototype.canBecomeTrueByModifier = function (modifier) {                                            // 77
  var _this = this;                                                                                                    // 77
                                                                                                                       //
  if (!this.affectedByModifier(modifier)) {                                                                            // 78
    return false;                                                                                                      // 79
  }                                                                                                                    // 80
                                                                                                                       //
  if (!this.isSimple()) {                                                                                              // 82
    return true;                                                                                                       // 83
  }                                                                                                                    // 84
                                                                                                                       //
  modifier = Object.assign({                                                                                           // 86
    $set: {},                                                                                                          // 86
    $unset: {}                                                                                                         // 86
  }, modifier);                                                                                                        // 86
  var modifierPaths = [].concat(Object.keys(modifier.$set), Object.keys(modifier.$unset));                             // 88
                                                                                                                       //
  if (this._getPaths().some(pathHasNumericKeys) || modifierPaths.some(pathHasNumericKeys)) {                           // 93
    return true;                                                                                                       // 95
  } // check if there is a $set or $unset that indicates something is an                                               // 96
  // object rather than a scalar in the actual object where we saw $-operator                                          // 99
  // NOTE: it is correct since we allow only scalars in $-operators                                                    // 100
  // Example: for selector {'a.b': {$gt: 5}} the modifier {'a.b.c':7} would                                            // 101
  // definitely set the result to false as 'a.b' appears to be an object.                                              // 102
                                                                                                                       //
                                                                                                                       //
  var expectedScalarIsObject = Object.keys(this._selector).some(function (path) {                                      // 103
    if (!isOperatorObject(_this._selector[path])) {                                                                    // 104
      return false;                                                                                                    // 105
    }                                                                                                                  // 106
                                                                                                                       //
    return modifierPaths.some(function (modifierPath) {                                                                // 108
      return modifierPath.startsWith(path + ".");                                                                      // 108
    });                                                                                                                // 108
  });                                                                                                                  // 111
                                                                                                                       //
  if (expectedScalarIsObject) {                                                                                        // 113
    return false;                                                                                                      // 114
  } // See if we can apply the modifier on the ideally matching object. If it                                          // 115
  // still matches the selector, then the modifier could have turned the real                                          // 118
  // object in the database into something matching.                                                                   // 119
                                                                                                                       //
                                                                                                                       //
  var matchingDocument = EJSON.clone(this.matchingDocument()); // The selector is too complex, anything can happen.    // 120
                                                                                                                       //
  if (matchingDocument === null) {                                                                                     // 123
    return true;                                                                                                       // 124
  }                                                                                                                    // 125
                                                                                                                       //
  try {                                                                                                                // 127
    LocalCollection._modify(matchingDocument, modifier);                                                               // 128
  } catch (error) {                                                                                                    // 129
    // Couldn't set a property on a field which is a scalar or null in the                                             // 130
    // selector.                                                                                                       // 131
    // Example:                                                                                                        // 132
    // real document: { 'a.b': 3 }                                                                                     // 133
    // selector: { 'a': 12 }                                                                                           // 134
    // converted selector (ideal document): { 'a': 12 }                                                                // 135
    // modifier: { $set: { 'a.b': 4 } }                                                                                // 136
    // We don't know what real document was like but from the error raised by                                          // 137
    // $set on a scalar field we can reason that the structure of real document                                        // 138
    // is completely different.                                                                                        // 139
    if (error.name === 'MinimongoError' && error.setPropertyError) {                                                   // 140
      return false;                                                                                                    // 141
    }                                                                                                                  // 142
                                                                                                                       //
    throw error;                                                                                                       // 144
  }                                                                                                                    // 145
                                                                                                                       //
  return this.documentMatches(matchingDocument).result;                                                                // 147
}; // Knows how to combine a mongo selector and a fields projection to a new fields                                    // 148
// projection taking into account active fields from the passed selector.                                              // 151
// @returns Object - projection object (same as fields option of mongo cursor)                                         // 152
                                                                                                                       //
                                                                                                                       //
Minimongo.Matcher.prototype.combineIntoProjection = function (projection) {                                            // 153
  var selectorPaths = Minimongo._pathsElidingNumericKeys(this._getPaths()); // Special case for $where operator in the selector - projection should depend
  // on all fields of the document. getSelectorPaths returns a list of paths                                           // 157
  // selector depends on. If one of the paths is '' (empty string) representing                                        // 158
  // the root or the whole document, complete projection should be returned.                                           // 159
                                                                                                                       //
                                                                                                                       //
  if (selectorPaths.includes('')) {                                                                                    // 160
    return {};                                                                                                         // 161
  }                                                                                                                    // 162
                                                                                                                       //
  return combineImportantPathsIntoProjection(selectorPaths, projection);                                               // 164
}; // Returns an object that would match the selector if possible or null if the                                       // 165
// selector is too complex for us to analyze                                                                           // 168
// { 'a.b': { ans: 42 }, 'foo.bar': null, 'foo.baz': "something" }                                                     // 169
// => { a: { b: { ans: 42 } }, foo: { bar: null, baz: "something" } }                                                  // 170
                                                                                                                       //
                                                                                                                       //
Minimongo.Matcher.prototype.matchingDocument = function () {                                                           // 171
  var _this2 = this;                                                                                                   // 171
                                                                                                                       //
  // check if it was computed before                                                                                   // 172
  if (this._matchingDocument !== undefined) {                                                                          // 173
    return this._matchingDocument;                                                                                     // 174
  } // If the analysis of this selector is too hard for our implementation                                             // 175
  // fallback to "YES"                                                                                                 // 178
                                                                                                                       //
                                                                                                                       //
  var fallback = false;                                                                                                // 179
  this._matchingDocument = pathsToTree(this._getPaths(), function (path) {                                             // 181
    var valueSelector = _this2._selector[path];                                                                        // 184
                                                                                                                       //
    if (isOperatorObject(valueSelector)) {                                                                             // 186
      // if there is a strict equality, there is a good                                                                // 187
      // chance we can use one of those as "matching"                                                                  // 188
      // dummy value                                                                                                   // 189
      if (valueSelector.$eq) {                                                                                         // 190
        return valueSelector.$eq;                                                                                      // 191
      }                                                                                                                // 192
                                                                                                                       //
      if (valueSelector.$in) {                                                                                         // 194
        var matcher = new Minimongo.Matcher({                                                                          // 195
          placeholder: valueSelector                                                                                   // 195
        }); // Return anything from $in that matches the whole selector for this                                       // 195
        // path. If nothing matches, returns `undefined` as nothing can make                                           // 198
        // this selector into `true`.                                                                                  // 199
                                                                                                                       //
        return valueSelector.$in.find(function (placeholder) {                                                         // 200
          return matcher.documentMatches({                                                                             // 200
            placeholder: placeholder                                                                                   // 201
          }).result;                                                                                                   // 201
        });                                                                                                            // 200
      }                                                                                                                // 203
                                                                                                                       //
      if (onlyContainsKeys(valueSelector, ['$gt', '$gte', '$lt', '$lte'])) {                                           // 205
        var lowerBound = -Infinity;                                                                                    // 206
        var upperBound = Infinity;                                                                                     // 207
        ['$lte', '$lt'].forEach(function (op) {                                                                        // 209
          if (hasOwn.call(valueSelector, op) && valueSelector[op] < upperBound) {                                      // 210
            upperBound = valueSelector[op];                                                                            // 212
          }                                                                                                            // 213
        });                                                                                                            // 214
        ['$gte', '$gt'].forEach(function (op) {                                                                        // 216
          if (hasOwn.call(valueSelector, op) && valueSelector[op] > lowerBound) {                                      // 217
            lowerBound = valueSelector[op];                                                                            // 219
          }                                                                                                            // 220
        });                                                                                                            // 221
        var middle = (lowerBound + upperBound) / 2;                                                                    // 223
                                                                                                                       //
        var _matcher = new Minimongo.Matcher({                                                                         // 224
          placeholder: valueSelector                                                                                   // 224
        });                                                                                                            // 224
                                                                                                                       //
        if (!_matcher.documentMatches({                                                                                // 226
          placeholder: middle                                                                                          // 226
        }).result && (middle === lowerBound || middle === upperBound)) {                                               // 226
          fallback = true;                                                                                             // 228
        }                                                                                                              // 229
                                                                                                                       //
        return middle;                                                                                                 // 231
      }                                                                                                                // 232
                                                                                                                       //
      if (onlyContainsKeys(valueSelector, ['$nin', '$ne'])) {                                                          // 234
        // Since this._isSimple makes sure $nin and $ne are not combined with                                          // 235
        // objects or arrays, we can confidently return an empty object as it                                          // 236
        // never matches any scalar.                                                                                   // 237
        return {};                                                                                                     // 238
      }                                                                                                                // 239
                                                                                                                       //
      fallback = true;                                                                                                 // 241
    }                                                                                                                  // 242
                                                                                                                       //
    return _this2._selector[path];                                                                                     // 244
  }, function (x) {                                                                                                    // 245
    return x;                                                                                                          // 246
  });                                                                                                                  // 246
                                                                                                                       //
  if (fallback) {                                                                                                      // 248
    this._matchingDocument = null;                                                                                     // 249
  }                                                                                                                    // 250
                                                                                                                       //
  return this._matchingDocument;                                                                                       // 252
}; // Minimongo.Sorter gets a similar method, which delegates to a Matcher it made                                     // 253
// for this exact purpose.                                                                                             // 256
                                                                                                                       //
                                                                                                                       //
Minimongo.Sorter.prototype.affectedByModifier = function (modifier) {                                                  // 257
  return this._selectorForAffectedByModifier.affectedByModifier(modifier);                                             // 258
};                                                                                                                     // 259
                                                                                                                       //
Minimongo.Sorter.prototype.combineIntoProjection = function (projection) {                                             // 261
  return combineImportantPathsIntoProjection(Minimongo._pathsElidingNumericKeys(this._getPaths()), projection);        // 262
};                                                                                                                     // 266
                                                                                                                       //
function combineImportantPathsIntoProjection(paths, projection) {                                                      // 268
  var details = projectionDetails(projection); // merge the paths to include                                           // 269
                                                                                                                       //
  var tree = pathsToTree(paths, function (path) {                                                                      // 272
    return true;                                                                                                       // 274
  }, function (node, path, fullPath) {                                                                                 // 274
    return true;                                                                                                       // 275
  }, details.tree);                                                                                                    // 275
  var mergedProjection = treeToPaths(tree);                                                                            // 278
                                                                                                                       //
  if (details.including) {                                                                                             // 280
    // both selector and projection are pointing on fields to include                                                  // 281
    // so we can just return the merged tree                                                                           // 282
    return mergedProjection;                                                                                           // 283
  } // selector is pointing at fields to include                                                                       // 284
  // projection is pointing at fields to exclude                                                                       // 287
  // make sure we don't exclude important paths                                                                        // 288
                                                                                                                       //
                                                                                                                       //
  var mergedExclProjection = {};                                                                                       // 289
  Object.keys(mergedProjection).forEach(function (path) {                                                              // 291
    if (!mergedProjection[path]) {                                                                                     // 292
      mergedExclProjection[path] = false;                                                                              // 293
    }                                                                                                                  // 294
  });                                                                                                                  // 295
  return mergedExclProjection;                                                                                         // 297
}                                                                                                                      // 298
                                                                                                                       //
function getPaths(selector) {                                                                                          // 300
  return Object.keys(new Minimongo.Matcher(selector)._paths); // XXX remove it?                                        // 301
  // return Object.keys(selector).map(k => {                                                                           // 304
  //   // we don't know how to handle $where because it can be anything                                                // 305
  //   if (k === '$where') {                                                                                           // 306
  //     return ''; // matches everything                                                                              // 307
  //   }                                                                                                               // 308
  //   // we branch from $or/$and/$nor operator                                                                        // 310
  //   if (['$or', '$and', '$nor'].includes(k)) {                                                                      // 311
  //     return selector[k].map(getPaths);                                                                             // 312
  //   }                                                                                                               // 313
  //   // the value is a literal or some comparison operator                                                           // 315
  //   return k;                                                                                                       // 316
  // })                                                                                                                // 317
  //   .reduce((a, b) => a.concat(b), [])                                                                              // 318
  //   .filter((a, b, c) => c.indexOf(a) === b);                                                                       // 319
} // A helper to ensure object has only certain keys                                                                   // 320
                                                                                                                       //
                                                                                                                       //
function onlyContainsKeys(obj, keys) {                                                                                 // 323
  return Object.keys(obj).every(function (k) {                                                                         // 324
    return keys.includes(k);                                                                                           // 324
  });                                                                                                                  // 324
}                                                                                                                      // 325
                                                                                                                       //
function pathHasNumericKeys(path) {                                                                                    // 327
  return path.split('.').some(isNumericKey);                                                                           // 328
} // Returns a set of key paths similar to                                                                             // 329
// { 'foo.bar': 1, 'a.b.c': 1 }                                                                                        // 332
                                                                                                                       //
                                                                                                                       //
function treeToPaths(tree) {                                                                                           // 333
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';                                 // 333
  var result = {};                                                                                                     // 334
  Object.keys(tree).forEach(function (key) {                                                                           // 336
    var value = tree[key];                                                                                             // 337
                                                                                                                       //
    if (value === Object(value)) {                                                                                     // 338
      Object.assign(result, treeToPaths(value, prefix + key + "."));                                                   // 339
    } else {                                                                                                           // 340
      result[prefix + key] = value;                                                                                    // 341
    }                                                                                                                  // 342
  });                                                                                                                  // 343
  return result;                                                                                                       // 345
}                                                                                                                      // 346
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/common.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");                                          //
                                                                                                                       //
var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);                                                 //
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  hasOwn: function () {                                                                                                // 1
    return hasOwn;                                                                                                     // 1
  },                                                                                                                   // 1
  ELEMENT_OPERATORS: function () {                                                                                     // 1
    return ELEMENT_OPERATORS;                                                                                          // 1
  },                                                                                                                   // 1
  compileDocumentSelector: function () {                                                                               // 1
    return compileDocumentSelector;                                                                                    // 1
  },                                                                                                                   // 1
  equalityElementMatcher: function () {                                                                                // 1
    return equalityElementMatcher;                                                                                     // 1
  },                                                                                                                   // 1
  expandArraysInBranches: function () {                                                                                // 1
    return expandArraysInBranches;                                                                                     // 1
  },                                                                                                                   // 1
  isIndexable: function () {                                                                                           // 1
    return isIndexable;                                                                                                // 1
  },                                                                                                                   // 1
  isNumericKey: function () {                                                                                          // 1
    return isNumericKey;                                                                                               // 1
  },                                                                                                                   // 1
  isOperatorObject: function () {                                                                                      // 1
    return isOperatorObject;                                                                                           // 1
  },                                                                                                                   // 1
  makeLookupFunction: function () {                                                                                    // 1
    return makeLookupFunction;                                                                                         // 1
  },                                                                                                                   // 1
  nothingMatcher: function () {                                                                                        // 1
    return nothingMatcher;                                                                                             // 1
  },                                                                                                                   // 1
  pathsToTree: function () {                                                                                           // 1
    return pathsToTree;                                                                                                // 1
  },                                                                                                                   // 1
  populateDocumentWithQueryFields: function () {                                                                       // 1
    return populateDocumentWithQueryFields;                                                                            // 1
  },                                                                                                                   // 1
  projectionDetails: function () {                                                                                     // 1
    return projectionDetails;                                                                                          // 1
  },                                                                                                                   // 1
  regexpElementMatcher: function () {                                                                                  // 1
    return regexpElementMatcher;                                                                                       // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var LocalCollection = void 0;                                                                                          // 1
module.watch(require("./local_collection.js"), {                                                                       // 1
  "default": function (v) {                                                                                            // 1
    LocalCollection = v;                                                                                               // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var hasOwn = Object.prototype.hasOwnProperty;                                                                          // 3
var ELEMENT_OPERATORS = {                                                                                              // 17
  $lt: makeInequality(function (cmpValue) {                                                                            // 18
    return cmpValue < 0;                                                                                               // 18
  }),                                                                                                                  // 18
  $gt: makeInequality(function (cmpValue) {                                                                            // 19
    return cmpValue > 0;                                                                                               // 19
  }),                                                                                                                  // 19
  $lte: makeInequality(function (cmpValue) {                                                                           // 20
    return cmpValue <= 0;                                                                                              // 20
  }),                                                                                                                  // 20
  $gte: makeInequality(function (cmpValue) {                                                                           // 21
    return cmpValue >= 0;                                                                                              // 21
  }),                                                                                                                  // 21
  $mod: {                                                                                                              // 22
    compileElementSelector: function (operand) {                                                                       // 23
      if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
        throw Error('argument to $mod must be an array of two numbers');                                               // 27
      } // XXX could require to be ints or round or something                                                          // 28
                                                                                                                       //
                                                                                                                       //
      var divisor = operand[0];                                                                                        // 31
      var remainder = operand[1];                                                                                      // 32
      return function (value) {                                                                                        // 33
        return typeof value === 'number' && value % divisor === remainder;                                             // 33
      };                                                                                                               // 33
    }                                                                                                                  // 36
  },                                                                                                                   // 22
  $in: {                                                                                                               // 38
    compileElementSelector: function (operand) {                                                                       // 39
      if (!Array.isArray(operand)) {                                                                                   // 40
        throw Error('$in needs an array');                                                                             // 41
      }                                                                                                                // 42
                                                                                                                       //
      var elementMatchers = operand.map(function (option) {                                                            // 44
        if (option instanceof RegExp) {                                                                                // 45
          return regexpElementMatcher(option);                                                                         // 46
        }                                                                                                              // 47
                                                                                                                       //
        if (isOperatorObject(option)) {                                                                                // 49
          throw Error('cannot nest $ under $in');                                                                      // 50
        }                                                                                                              // 51
                                                                                                                       //
        return equalityElementMatcher(option);                                                                         // 53
      });                                                                                                              // 54
      return function (value) {                                                                                        // 56
        // Allow {a: {$in: [null]}} to match when 'a' does not exist.                                                  // 57
        if (value === undefined) {                                                                                     // 58
          value = null;                                                                                                // 59
        }                                                                                                              // 60
                                                                                                                       //
        return elementMatchers.some(function (matcher) {                                                               // 62
          return matcher(value);                                                                                       // 62
        });                                                                                                            // 62
      };                                                                                                               // 63
    }                                                                                                                  // 64
  },                                                                                                                   // 38
  $size: {                                                                                                             // 66
    // {a: [[5, 5]]} must match {a: {$size: 1}} but not {a: {$size: 2}}, so we                                         // 67
    // don't want to consider the element [5,5] in the leaf array [[5,5]] as a                                         // 68
    // possible value.                                                                                                 // 69
    dontExpandLeafArrays: true,                                                                                        // 70
    compileElementSelector: function (operand) {                                                                       // 71
      if (typeof operand === 'string') {                                                                               // 72
        // Don't ask me why, but by experimentation, this seems to be what Mongo                                       // 73
        // does.                                                                                                       // 74
        operand = 0;                                                                                                   // 75
      } else if (typeof operand !== 'number') {                                                                        // 76
        throw Error('$size needs a number');                                                                           // 77
      }                                                                                                                // 78
                                                                                                                       //
      return function (value) {                                                                                        // 80
        return Array.isArray(value) && value.length === operand;                                                       // 80
      };                                                                                                               // 80
    }                                                                                                                  // 81
  },                                                                                                                   // 66
  $type: {                                                                                                             // 83
    // {a: [5]} must not match {a: {$type: 4}} (4 means array), but it should                                          // 84
    // match {a: {$type: 1}} (1 means number), and {a: [[5]]} must match {$a:                                          // 85
    // {$type: 4}}. Thus, when we see a leaf array, we *should* expand it but                                          // 86
    // should *not* include it itself.                                                                                 // 87
    dontIncludeLeafArrays: true,                                                                                       // 88
    compileElementSelector: function (operand) {                                                                       // 89
      if (typeof operand !== 'number') {                                                                               // 90
        throw Error('$type needs a number');                                                                           // 91
      }                                                                                                                // 92
                                                                                                                       //
      return function (value) {                                                                                        // 94
        return value !== undefined && LocalCollection._f._type(value) === operand;                                     // 94
      };                                                                                                               // 94
    }                                                                                                                  // 97
  },                                                                                                                   // 83
  $bitsAllSet: {                                                                                                       // 99
    compileElementSelector: function (operand) {                                                                       // 100
      var mask = getOperandBitmask(operand, '$bitsAllSet');                                                            // 101
      return function (value) {                                                                                        // 102
        var bitmask = getValueBitmask(value, mask.length);                                                             // 103
        return bitmask && mask.every(function (byte, i) {                                                              // 104
          return (bitmask[i] & byte) === byte;                                                                         // 104
        });                                                                                                            // 104
      };                                                                                                               // 105
    }                                                                                                                  // 106
  },                                                                                                                   // 99
  $bitsAnySet: {                                                                                                       // 108
    compileElementSelector: function (operand) {                                                                       // 109
      var mask = getOperandBitmask(operand, '$bitsAnySet');                                                            // 110
      return function (value) {                                                                                        // 111
        var bitmask = getValueBitmask(value, mask.length);                                                             // 112
        return bitmask && mask.some(function (byte, i) {                                                               // 113
          return (~bitmask[i] & byte) !== byte;                                                                        // 113
        });                                                                                                            // 113
      };                                                                                                               // 114
    }                                                                                                                  // 115
  },                                                                                                                   // 108
  $bitsAllClear: {                                                                                                     // 117
    compileElementSelector: function (operand) {                                                                       // 118
      var mask = getOperandBitmask(operand, '$bitsAllClear');                                                          // 119
      return function (value) {                                                                                        // 120
        var bitmask = getValueBitmask(value, mask.length);                                                             // 121
        return bitmask && mask.every(function (byte, i) {                                                              // 122
          return !(bitmask[i] & byte);                                                                                 // 122
        });                                                                                                            // 122
      };                                                                                                               // 123
    }                                                                                                                  // 124
  },                                                                                                                   // 117
  $bitsAnyClear: {                                                                                                     // 126
    compileElementSelector: function (operand) {                                                                       // 127
      var mask = getOperandBitmask(operand, '$bitsAnyClear');                                                          // 128
      return function (value) {                                                                                        // 129
        var bitmask = getValueBitmask(value, mask.length);                                                             // 130
        return bitmask && mask.some(function (byte, i) {                                                               // 131
          return (bitmask[i] & byte) !== byte;                                                                         // 131
        });                                                                                                            // 131
      };                                                                                                               // 132
    }                                                                                                                  // 133
  },                                                                                                                   // 126
  $regex: {                                                                                                            // 135
    compileElementSelector: function (operand, valueSelector) {                                                        // 136
      if (!(typeof operand === 'string' || operand instanceof RegExp)) {                                               // 137
        throw Error('$regex has to be a string or RegExp');                                                            // 138
      }                                                                                                                // 139
                                                                                                                       //
      var regexp = void 0;                                                                                             // 141
                                                                                                                       //
      if (valueSelector.$options !== undefined) {                                                                      // 142
        // Options passed in $options (even the empty string) always overrides                                         // 143
        // options in the RegExp object itself.                                                                        // 144
        // Be clear that we only support the JS-supported options, not extended                                        // 146
        // ones (eg, Mongo supports x and s). Ideally we would implement x and s                                       // 147
        // by transforming the regexp, but not today...                                                                // 148
        if (/[^gim]/.test(valueSelector.$options)) {                                                                   // 149
          throw new Error('Only the i, m, and g regexp options are supported');                                        // 150
        }                                                                                                              // 151
                                                                                                                       //
        var source = operand instanceof RegExp ? operand.source : operand;                                             // 153
        regexp = new RegExp(source, valueSelector.$options);                                                           // 154
      } else if (operand instanceof RegExp) {                                                                          // 155
        regexp = operand;                                                                                              // 156
      } else {                                                                                                         // 157
        regexp = new RegExp(operand);                                                                                  // 158
      }                                                                                                                // 159
                                                                                                                       //
      return regexpElementMatcher(regexp);                                                                             // 161
    }                                                                                                                  // 162
  },                                                                                                                   // 135
  $elemMatch: {                                                                                                        // 164
    dontExpandLeafArrays: true,                                                                                        // 165
    compileElementSelector: function (operand, valueSelector, matcher) {                                               // 166
      if (!LocalCollection._isPlainObject(operand)) {                                                                  // 167
        throw Error('$elemMatch need an object');                                                                      // 168
      }                                                                                                                // 169
                                                                                                                       //
      var isDocMatcher = !isOperatorObject(Object.keys(operand).filter(function (key) {                                // 171
        return !hasOwn.call(LOGICAL_OPERATORS, key);                                                                   // 173
      }).reduce(function (a, b) {                                                                                      // 173
        var _Object$assign;                                                                                            // 174
                                                                                                                       //
        return Object.assign(a, (_Object$assign = {}, _Object$assign[b] = operand[b], _Object$assign));                // 174
      }, {}), true);                                                                                                   // 174
                                                                                                                       //
      if (isDocMatcher) {                                                                                              // 177
        // This is NOT the same as compileValueSelector(operand), and not just                                         // 178
        // because of the slightly different calling convention.                                                       // 179
        // {$elemMatch: {x: 3}} means "an element has a field x:3", not                                                // 180
        // "consists only of a field x:3". Also, regexps and sub-$ are allowed.                                        // 181
        subMatcher = compileDocumentSelector(operand, matcher, {                                                       // 182
          inElemMatch: true                                                                                            // 183
        });                                                                                                            // 183
      } else {                                                                                                         // 184
        subMatcher = compileValueSelector(operand, matcher);                                                           // 185
      }                                                                                                                // 186
                                                                                                                       //
      return function (value) {                                                                                        // 188
        if (!Array.isArray(value)) {                                                                                   // 189
          return false;                                                                                                // 190
        }                                                                                                              // 191
                                                                                                                       //
        for (var i = 0; i < value.length; ++i) {                                                                       // 193
          var arrayElement = value[i];                                                                                 // 194
          var arg = void 0;                                                                                            // 195
                                                                                                                       //
          if (isDocMatcher) {                                                                                          // 196
            // We can only match {$elemMatch: {b: 3}} against objects.                                                 // 197
            // (We can also match against arrays, if there's numeric indices,                                          // 198
            // eg {$elemMatch: {'0.b': 3}} or {$elemMatch: {0: 3}}.)                                                   // 199
            if (!isIndexable(arrayElement)) {                                                                          // 200
              return false;                                                                                            // 201
            }                                                                                                          // 202
                                                                                                                       //
            arg = arrayElement;                                                                                        // 204
          } else {                                                                                                     // 205
            // dontIterate ensures that {a: {$elemMatch: {$gt: 5}}} matches                                            // 206
            // {a: [8]} but not {a: [[8]]}                                                                             // 207
            arg = [{                                                                                                   // 208
              value: arrayElement,                                                                                     // 208
              dontIterate: true                                                                                        // 208
            }];                                                                                                        // 208
          } // XXX support $near in $elemMatch by propagating $distance?                                               // 209
                                                                                                                       //
                                                                                                                       //
          if (subMatcher(arg).result) {                                                                                // 211
            return i; // specially understood to mean "use as arrayIndices"                                            // 212
          }                                                                                                            // 213
        }                                                                                                              // 214
                                                                                                                       //
        return false;                                                                                                  // 216
      };                                                                                                               // 217
    }                                                                                                                  // 218
  }                                                                                                                    // 164
};                                                                                                                     // 17
// Operators that appear at the top level of a document selector.                                                      // 222
var LOGICAL_OPERATORS = {                                                                                              // 223
  $and: function (subSelector, matcher, inElemMatch) {                                                                 // 224
    return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));                    // 225
  },                                                                                                                   // 228
  $or: function (subSelector, matcher, inElemMatch) {                                                                  // 230
    var matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch); // Special case: if there is only one matcher, use it directly, *preserving*
    // any arrayIndices it returns.                                                                                    // 238
                                                                                                                       //
    if (matchers.length === 1) {                                                                                       // 239
      return matchers[0];                                                                                              // 240
    }                                                                                                                  // 241
                                                                                                                       //
    return function (doc) {                                                                                            // 243
      var result = matchers.some(function (fn) {                                                                       // 244
        return fn(doc).result;                                                                                         // 244
      }); // $or does NOT set arrayIndices when it has multiple                                                        // 244
      // sub-expressions. (Tested against MongoDB.)                                                                    // 246
                                                                                                                       //
      return {                                                                                                         // 247
        result: result                                                                                                 // 247
      };                                                                                                               // 247
    };                                                                                                                 // 248
  },                                                                                                                   // 249
  $nor: function (subSelector, matcher, inElemMatch) {                                                                 // 251
    var matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);                                 // 252
    return function (doc) {                                                                                            // 257
      var result = matchers.every(function (fn) {                                                                      // 258
        return !fn(doc).result;                                                                                        // 258
      }); // Never set arrayIndices, because we only match if nothing in particular                                    // 258
      // 'matched' (and because this is consistent with MongoDB).                                                      // 260
                                                                                                                       //
      return {                                                                                                         // 261
        result: result                                                                                                 // 261
      };                                                                                                               // 261
    };                                                                                                                 // 262
  },                                                                                                                   // 263
  $where: function (selectorValue, matcher) {                                                                          // 265
    // Record that *any* path may be used.                                                                             // 266
    matcher._recordPathUsed('');                                                                                       // 267
                                                                                                                       //
    matcher._hasWhere = true;                                                                                          // 268
                                                                                                                       //
    if (!(selectorValue instanceof Function)) {                                                                        // 270
      // XXX MongoDB seems to have more complex logic to decide where or or not                                        // 271
      // to add 'return'; not sure exactly what it is.                                                                 // 272
      selectorValue = Function('obj', "return " + selectorValue);                                                      // 273
    } // We make the document available as both `this` and `obj`.                                                      // 274
    // // XXX not sure what we should do if this throws                                                                // 277
                                                                                                                       //
                                                                                                                       //
    return function (doc) {                                                                                            // 278
      return {                                                                                                         // 278
        result: selectorValue.call(doc, doc)                                                                           // 278
      };                                                                                                               // 278
    };                                                                                                                 // 278
  },                                                                                                                   // 279
  // This is just used as a comment in the query (in MongoDB, it also ends up in                                       // 281
  // query logs); it has no effect on the actual selection.                                                            // 282
  $comment: function () {                                                                                              // 283
    return function () {                                                                                               // 284
      return {                                                                                                         // 284
        result: true                                                                                                   // 284
      };                                                                                                               // 284
    };                                                                                                                 // 284
  }                                                                                                                    // 285
}; // Operators that (unlike LOGICAL_OPERATORS) pertain to individual paths in a                                       // 223
// document, but (unlike ELEMENT_OPERATORS) do not have a simple definition as                                         // 289
// "match each branched value independently and combine with                                                           // 290
// convertElementMatcherToBranchedMatcher".                                                                            // 291
                                                                                                                       //
var VALUE_OPERATORS = {                                                                                                // 292
  $eq: function (operand) {                                                                                            // 293
    return convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));                                    // 294
  },                                                                                                                   // 297
  $not: function (operand, valueSelector, matcher) {                                                                   // 298
    return invertBranchedMatcher(compileValueSelector(operand, matcher));                                              // 299
  },                                                                                                                   // 300
  $ne: function (operand) {                                                                                            // 301
    return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));             // 302
  },                                                                                                                   // 305
  $nin: function (operand) {                                                                                           // 306
    return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand)));
  },                                                                                                                   // 312
  $exists: function (operand) {                                                                                        // 313
    var exists = convertElementMatcherToBranchedMatcher(function (value) {                                             // 314
      return value !== undefined;                                                                                      // 315
    });                                                                                                                // 315
    return operand ? exists : invertBranchedMatcher(exists);                                                           // 317
  },                                                                                                                   // 318
  // $options just provides options for $regex; its logic is inside $regex                                             // 319
  $options: function (operand, valueSelector) {                                                                        // 320
    if (!hasOwn.call(valueSelector, '$regex')) {                                                                       // 321
      throw Error('$options needs a $regex');                                                                          // 322
    }                                                                                                                  // 323
                                                                                                                       //
    return everythingMatcher;                                                                                          // 325
  },                                                                                                                   // 326
  // $maxDistance is basically an argument to $near                                                                    // 327
  $maxDistance: function (operand, valueSelector) {                                                                    // 328
    if (!valueSelector.$near) {                                                                                        // 329
      throw Error('$maxDistance needs a $near');                                                                       // 330
    }                                                                                                                  // 331
                                                                                                                       //
    return everythingMatcher;                                                                                          // 333
  },                                                                                                                   // 334
  $all: function (operand, valueSelector, matcher) {                                                                   // 335
    if (!Array.isArray(operand)) {                                                                                     // 336
      throw Error('$all requires array');                                                                              // 337
    } // Not sure why, but this seems to be what MongoDB does.                                                         // 338
                                                                                                                       //
                                                                                                                       //
    if (operand.length === 0) {                                                                                        // 341
      return nothingMatcher;                                                                                           // 342
    }                                                                                                                  // 343
                                                                                                                       //
    var branchedMatchers = operand.map(function (criterion) {                                                          // 345
      // XXX handle $all/$elemMatch combination                                                                        // 346
      if (isOperatorObject(criterion)) {                                                                               // 347
        throw Error('no $ expressions in $all');                                                                       // 348
      } // This is always a regexp or equality selector.                                                               // 349
                                                                                                                       //
                                                                                                                       //
      return compileValueSelector(criterion, matcher);                                                                 // 352
    }); // andBranchedMatchers does NOT require all selectors to return true on the                                    // 353
    // SAME branch.                                                                                                    // 356
                                                                                                                       //
    return andBranchedMatchers(branchedMatchers);                                                                      // 357
  },                                                                                                                   // 358
  $near: function (operand, valueSelector, matcher, isRoot) {                                                          // 359
    if (!isRoot) {                                                                                                     // 360
      throw Error('$near can\'t be inside another $ operator');                                                        // 361
    }                                                                                                                  // 362
                                                                                                                       //
    matcher._hasGeoQuery = true; // There are two kinds of geodata in MongoDB: legacy coordinate pairs and             // 364
    // GeoJSON. They use different distance metrics, too. GeoJSON queries are                                          // 367
    // marked with a $geometry property, though legacy coordinates can be                                              // 368
    // matched using $geometry.                                                                                        // 369
                                                                                                                       //
    var maxDistance = void 0,                                                                                          // 370
        point = void 0,                                                                                                // 370
        distance = void 0;                                                                                             // 370
                                                                                                                       //
    if (LocalCollection._isPlainObject(operand) && hasOwn.call(operand, '$geometry')) {                                // 371
      // GeoJSON "2dsphere" mode.                                                                                      // 372
      maxDistance = operand.$maxDistance;                                                                              // 373
      point = operand.$geometry;                                                                                       // 374
                                                                                                                       //
      distance = function (value) {                                                                                    // 375
        // XXX: for now, we don't calculate the actual distance between, say,                                          // 376
        // polygon and circle. If people care about this use-case it will get                                          // 377
        // a priority.                                                                                                 // 378
        if (!value) {                                                                                                  // 379
          return null;                                                                                                 // 380
        }                                                                                                              // 381
                                                                                                                       //
        if (!value.type) {                                                                                             // 383
          return GeoJSON.pointDistance(point, {                                                                        // 384
            type: 'Point',                                                                                             // 386
            coordinates: pointToArray(value)                                                                           // 386
          });                                                                                                          // 386
        }                                                                                                              // 388
                                                                                                                       //
        if (value.type === 'Point') {                                                                                  // 390
          return GeoJSON.pointDistance(point, value);                                                                  // 391
        }                                                                                                              // 392
                                                                                                                       //
        return GeoJSON.geometryWithinRadius(value, point, maxDistance) ? 0 : maxDistance + 1;                          // 394
      };                                                                                                               // 397
    } else {                                                                                                           // 398
      maxDistance = valueSelector.$maxDistance;                                                                        // 399
                                                                                                                       //
      if (!isIndexable(operand)) {                                                                                     // 401
        throw Error('$near argument must be coordinate pair or GeoJSON');                                              // 402
      }                                                                                                                // 403
                                                                                                                       //
      point = pointToArray(operand);                                                                                   // 405
                                                                                                                       //
      distance = function (value) {                                                                                    // 407
        if (!isIndexable(value)) {                                                                                     // 408
          return null;                                                                                                 // 409
        }                                                                                                              // 410
                                                                                                                       //
        return distanceCoordinatePairs(point, value);                                                                  // 412
      };                                                                                                               // 413
    }                                                                                                                  // 414
                                                                                                                       //
    return function (branchedValues) {                                                                                 // 416
      // There might be multiple points in the document that match the given                                           // 417
      // field. Only one of them needs to be within $maxDistance, but we need to                                       // 418
      // evaluate all of them and use the nearest one for the implicit sort                                            // 419
      // specifier. (That's why we can't just use ELEMENT_OPERATORS here.)                                             // 420
      //                                                                                                               // 421
      // Note: This differs from MongoDB's implementation, where a document will                                       // 422
      // actually show up *multiple times* in the result set, with one entry for                                       // 423
      // each within-$maxDistance branching point.                                                                     // 424
      var result = {                                                                                                   // 425
        result: false                                                                                                  // 425
      };                                                                                                               // 425
      expandArraysInBranches(branchedValues).every(function (branch) {                                                 // 426
        // if operation is an update, don't skip branches, just return the first                                       // 427
        // one (#3599)                                                                                                 // 428
        var curDistance = void 0;                                                                                      // 429
                                                                                                                       //
        if (!matcher._isUpdate) {                                                                                      // 430
          if (!((0, _typeof3.default)(branch.value) === 'object')) {                                                   // 431
            return true;                                                                                               // 432
          }                                                                                                            // 433
                                                                                                                       //
          curDistance = distance(branch.value); // Skip branches that aren't real points or are too far away.          // 435
                                                                                                                       //
          if (curDistance === null || curDistance > maxDistance) {                                                     // 438
            return true;                                                                                               // 439
          } // Skip anything that's a tie.                                                                             // 440
                                                                                                                       //
                                                                                                                       //
          if (result.distance !== undefined && result.distance <= curDistance) {                                       // 443
            return true;                                                                                               // 444
          }                                                                                                            // 445
        }                                                                                                              // 446
                                                                                                                       //
        result.result = true;                                                                                          // 448
        result.distance = curDistance;                                                                                 // 449
                                                                                                                       //
        if (branch.arrayIndices) {                                                                                     // 451
          result.arrayIndices = branch.arrayIndices;                                                                   // 452
        } else {                                                                                                       // 453
          delete result.arrayIndices;                                                                                  // 454
        }                                                                                                              // 455
                                                                                                                       //
        return !matcher._isUpdate;                                                                                     // 457
      });                                                                                                              // 458
      return result;                                                                                                   // 460
    };                                                                                                                 // 461
  }                                                                                                                    // 462
}; // NB: We are cheating and using this function to implement 'AND' for both                                          // 292
// 'document matchers' and 'branched matchers'. They both return result objects                                        // 466
// but the argument is different: for the former it's a whole doc, whereas for                                         // 467
// the latter it's an array of 'branched values'.                                                                      // 468
                                                                                                                       //
function andSomeMatchers(subMatchers) {                                                                                // 469
  if (subMatchers.length === 0) {                                                                                      // 470
    return everythingMatcher;                                                                                          // 471
  }                                                                                                                    // 472
                                                                                                                       //
  if (subMatchers.length === 1) {                                                                                      // 474
    return subMatchers[0];                                                                                             // 475
  }                                                                                                                    // 476
                                                                                                                       //
  return function (docOrBranches) {                                                                                    // 478
    var match = {};                                                                                                    // 479
    match.result = subMatchers.every(function (fn) {                                                                   // 480
      var subResult = fn(docOrBranches); // Copy a 'distance' number out of the first sub-matcher that has             // 481
      // one. Yes, this means that if there are multiple $near fields in a                                             // 484
      // query, something arbitrary happens; this appears to be consistent with                                        // 485
      // Mongo.                                                                                                        // 486
                                                                                                                       //
      if (subResult.result && subResult.distance !== undefined && match.distance === undefined) {                      // 487
        match.distance = subResult.distance;                                                                           // 490
      } // Similarly, propagate arrayIndices from sub-matchers... but to match                                         // 491
      // MongoDB behavior, this time the *last* sub-matcher with arrayIndices                                          // 494
      // wins.                                                                                                         // 495
                                                                                                                       //
                                                                                                                       //
      if (subResult.result && subResult.arrayIndices) {                                                                // 496
        match.arrayIndices = subResult.arrayIndices;                                                                   // 497
      }                                                                                                                // 498
                                                                                                                       //
      return subResult.result;                                                                                         // 500
    }); // If we didn't actually match, forget any extra metadata we came up with.                                     // 501
                                                                                                                       //
    if (!match.result) {                                                                                               // 504
      delete match.distance;                                                                                           // 505
      delete match.arrayIndices;                                                                                       // 506
    }                                                                                                                  // 507
                                                                                                                       //
    return match;                                                                                                      // 509
  };                                                                                                                   // 510
}                                                                                                                      // 511
                                                                                                                       //
var andDocumentMatchers = andSomeMatchers;                                                                             // 513
var andBranchedMatchers = andSomeMatchers;                                                                             // 514
                                                                                                                       //
function compileArrayOfDocumentSelectors(selectors, matcher, inElemMatch) {                                            // 516
  if (!Array.isArray(selectors) || selectors.length === 0) {                                                           // 517
    throw Error('$and/$or/$nor must be nonempty array');                                                               // 518
  }                                                                                                                    // 519
                                                                                                                       //
  return selectors.map(function (subSelector) {                                                                        // 521
    if (!LocalCollection._isPlainObject(subSelector)) {                                                                // 522
      throw Error('$or/$and/$nor entries need to be full objects');                                                    // 523
    }                                                                                                                  // 524
                                                                                                                       //
    return compileDocumentSelector(subSelector, matcher, {                                                             // 526
      inElemMatch: inElemMatch                                                                                         // 526
    });                                                                                                                // 526
  });                                                                                                                  // 527
} // Takes in a selector that could match a full document (eg, the original                                            // 528
// selector). Returns a function mapping document->result object.                                                      // 531
//                                                                                                                     // 532
// matcher is the Matcher object we are compiling.                                                                     // 533
//                                                                                                                     // 534
// If this is the root document selector (ie, not wrapped in $and or the like),                                        // 535
// then isRoot is true. (This is used by $near.)                                                                       // 536
                                                                                                                       //
                                                                                                                       //
function compileDocumentSelector(docSelector, matcher) {                                                               // 537
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                                // 537
  var docMatchers = Object.keys(docSelector).map(function (key) {                                                      // 538
    var subSelector = docSelector[key];                                                                                // 539
                                                                                                                       //
    if (key.substr(0, 1) === '$') {                                                                                    // 541
      // Outer operators are either logical operators (they recurse back into                                          // 542
      // this function), or $where.                                                                                    // 543
      if (!hasOwn.call(LOGICAL_OPERATORS, key)) {                                                                      // 544
        throw new Error("Unrecognized logical operator: " + key);                                                      // 545
      }                                                                                                                // 546
                                                                                                                       //
      matcher._isSimple = false;                                                                                       // 548
      return LOGICAL_OPERATORS[key](subSelector, matcher, options.inElemMatch);                                        // 549
    } // Record this path, but only if we aren't in an elemMatcher, since in an                                        // 550
    // elemMatch this is a path inside an object in an array, not in the doc                                           // 553
    // root.                                                                                                           // 554
                                                                                                                       //
                                                                                                                       //
    if (!options.inElemMatch) {                                                                                        // 555
      matcher._recordPathUsed(key);                                                                                    // 556
    } // Don't add a matcher if subSelector is a function -- this is to match                                          // 557
    // the behavior of Meteor on the server (inherited from the node mongodb                                           // 560
    // driver), which is to ignore any part of a selector which is a function.                                         // 561
                                                                                                                       //
                                                                                                                       //
    if (typeof subSelector === 'function') {                                                                           // 562
      return undefined;                                                                                                // 563
    }                                                                                                                  // 564
                                                                                                                       //
    var lookUpByIndex = makeLookupFunction(key);                                                                       // 566
    var valueMatcher = compileValueSelector(subSelector, matcher, options.isRoot);                                     // 567
    return function (doc) {                                                                                            // 573
      return valueMatcher(lookUpByIndex(doc));                                                                         // 573
    };                                                                                                                 // 573
  }).filter(Boolean);                                                                                                  // 574
  return andDocumentMatchers(docMatchers);                                                                             // 576
}                                                                                                                      // 577
                                                                                                                       //
// Takes in a selector that could match a key-indexed value in a document; eg,                                         // 579
// {$gt: 5, $lt: 9}, or a regular expression, or any non-expression object (to                                         // 580
// indicate equality).  Returns a branched matcher: a function mapping                                                 // 581
// [branched value]->result object.                                                                                    // 582
function compileValueSelector(valueSelector, matcher, isRoot) {                                                        // 583
  if (valueSelector instanceof RegExp) {                                                                               // 584
    matcher._isSimple = false;                                                                                         // 585
    return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));                                // 586
  }                                                                                                                    // 589
                                                                                                                       //
  if (isOperatorObject(valueSelector)) {                                                                               // 591
    return operatorBranchedMatcher(valueSelector, matcher, isRoot);                                                    // 592
  }                                                                                                                    // 593
                                                                                                                       //
  return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));                                // 595
} // Given an element matcher (which evaluates a single value), returns a branched                                     // 598
// value (which evaluates the element matcher on all the branches and returns a                                        // 601
// more structured return value possibly including arrayIndices).                                                      // 602
                                                                                                                       //
                                                                                                                       //
function convertElementMatcherToBranchedMatcher(elementMatcher) {                                                      // 603
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                                // 603
  return function (branches) {                                                                                         // 604
    var expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);
    var match = {};                                                                                                    // 609
    match.result = expanded.some(function (element) {                                                                  // 610
      var matched = elementMatcher(element.value); // Special case for $elemMatch: it means "true, and use this as an array
      // index if I didn't already have one".                                                                          // 614
                                                                                                                       //
      if (typeof matched === 'number') {                                                                               // 615
        // XXX This code dates from when we only stored a single array index                                           // 616
        // (for the outermost array). Should we be also including deeper array                                         // 617
        // indices from the $elemMatch match?                                                                          // 618
        if (!element.arrayIndices) {                                                                                   // 619
          element.arrayIndices = [matched];                                                                            // 620
        }                                                                                                              // 621
                                                                                                                       //
        matched = true;                                                                                                // 623
      } // If some element matched, and it's tagged with array indices, include                                        // 624
      // those indices in our result object.                                                                           // 627
                                                                                                                       //
                                                                                                                       //
      if (matched && element.arrayIndices) {                                                                           // 628
        match.arrayIndices = element.arrayIndices;                                                                     // 629
      }                                                                                                                // 630
                                                                                                                       //
      return matched;                                                                                                  // 632
    });                                                                                                                // 633
    return match;                                                                                                      // 635
  };                                                                                                                   // 636
} // Helpers for $near.                                                                                                // 637
                                                                                                                       //
                                                                                                                       //
function distanceCoordinatePairs(a, b) {                                                                               // 640
  var pointA = pointToArray(a);                                                                                        // 641
  var pointB = pointToArray(b);                                                                                        // 642
  return Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);                                                     // 644
} // Takes something that is not an operator object and returns an element matcher                                     // 645
// for equality with that thing.                                                                                       // 648
                                                                                                                       //
                                                                                                                       //
function equalityElementMatcher(elementSelector) {                                                                     // 649
  if (isOperatorObject(elementSelector)) {                                                                             // 650
    throw Error('Can\'t create equalityValueSelector for operator object');                                            // 651
  } // Special-case: null and undefined are equal (if you got undefined in there                                       // 652
  // somewhere, or if you got it due to some branch being non-existent in the                                          // 655
  // weird special case), even though they aren't with EJSON.equals.                                                   // 656
  // undefined or null                                                                                                 // 657
                                                                                                                       //
                                                                                                                       //
  if (elementSelector == null) {                                                                                       // 658
    return function (value) {                                                                                          // 659
      return value == null;                                                                                            // 659
    };                                                                                                                 // 659
  }                                                                                                                    // 660
                                                                                                                       //
  return function (value) {                                                                                            // 662
    return LocalCollection._f._equal(elementSelector, value);                                                          // 662
  };                                                                                                                   // 662
}                                                                                                                      // 663
                                                                                                                       //
function everythingMatcher(docOrBranchedValues) {                                                                      // 665
  return {                                                                                                             // 666
    result: true                                                                                                       // 666
  };                                                                                                                   // 666
}                                                                                                                      // 667
                                                                                                                       //
function expandArraysInBranches(branches, skipTheArrays) {                                                             // 669
  var branchesOut = [];                                                                                                // 670
  branches.forEach(function (branch) {                                                                                 // 672
    var thisIsArray = Array.isArray(branch.value); // We include the branch itself, *UNLESS* we it's an array that we're going
    // to iterate and we're told to skip arrays.  (That's right, we include some                                       // 676
    // arrays even skipTheArrays is true: these are arrays that were found via                                         // 677
    // explicit numerical indices.)                                                                                    // 678
                                                                                                                       //
    if (!(skipTheArrays && thisIsArray && !branch.dontIterate)) {                                                      // 679
      branchesOut.push({                                                                                               // 680
        arrayIndices: branch.arrayIndices,                                                                             // 680
        value: branch.value                                                                                            // 680
      });                                                                                                              // 680
    }                                                                                                                  // 681
                                                                                                                       //
    if (thisIsArray && !branch.dontIterate) {                                                                          // 683
      branch.value.forEach(function (value, i) {                                                                       // 684
        branchesOut.push({                                                                                             // 685
          arrayIndices: (branch.arrayIndices || []).concat(i),                                                         // 686
          value: value                                                                                                 // 687
        });                                                                                                            // 685
      });                                                                                                              // 689
    }                                                                                                                  // 690
  });                                                                                                                  // 691
  return branchesOut;                                                                                                  // 693
}                                                                                                                      // 694
                                                                                                                       //
// Helpers for $bitsAllSet/$bitsAnySet/$bitsAllClear/$bitsAnyClear.                                                    // 696
function getOperandBitmask(operand, selector) {                                                                        // 697
  // numeric bitmask                                                                                                   // 698
  // You can provide a numeric bitmask to be matched against the operand field.                                        // 699
  // It must be representable as a non-negative 32-bit signed integer.                                                 // 700
  // Otherwise, $bitsAllSet will return an error.                                                                      // 701
  if (Number.isInteger(operand) && operand >= 0) {                                                                     // 702
    return new Uint8Array(new Int32Array([operand]).buffer);                                                           // 703
  } // bindata bitmask                                                                                                 // 704
  // You can also use an arbitrarily large BinData instance as a bitmask.                                              // 707
                                                                                                                       //
                                                                                                                       //
  if (EJSON.isBinary(operand)) {                                                                                       // 708
    return new Uint8Array(operand.buffer);                                                                             // 709
  } // position list                                                                                                   // 710
  // If querying a list of bit positions, each <position> must be a non-negative                                       // 713
  // integer. Bit positions start at 0 from the least significant bit.                                                 // 714
                                                                                                                       //
                                                                                                                       //
  if (Array.isArray(operand) && operand.every(function (x) {                                                           // 715
    return Number.isInteger(x) && x >= 0;                                                                              // 716
  })) {                                                                                                                // 716
    var buffer = new ArrayBuffer((Math.max.apply(Math, (0, _toConsumableArray3.default)(operand)) >> 3) + 1);          // 717
    var view = new Uint8Array(buffer);                                                                                 // 718
    operand.forEach(function (x) {                                                                                     // 720
      view[x >> 3] |= 1 << (x & 0x7);                                                                                  // 721
    });                                                                                                                // 722
    return view;                                                                                                       // 724
  } // bad operand                                                                                                     // 725
                                                                                                                       //
                                                                                                                       //
  throw Error("operand to " + selector + " must be a numeric bitmask (representable as a " + 'non-negative 32-bit signed integer), a bindata bitmask or an array with ' + 'bit positions (non-negative integers)');
}                                                                                                                      // 733
                                                                                                                       //
function getValueBitmask(value, length) {                                                                              // 735
  // The field value must be either numerical or a BinData instance. Otherwise,                                        // 736
  // $bits... will not match the current document.                                                                     // 737
  // numerical                                                                                                         // 739
  if (Number.isSafeInteger(value)) {                                                                                   // 740
    // $bits... will not match numerical values that cannot be represented as a                                        // 741
    // signed 64-bit integer. This can be the case if a value is either too                                            // 742
    // large or small to fit in a signed 64-bit integer, or if it has a                                                // 743
    // fractional component.                                                                                           // 744
    var buffer = new ArrayBuffer(Math.max(length, 2 * Uint32Array.BYTES_PER_ELEMENT));                                 // 745
    var view = new Uint32Array(buffer, 0, 2);                                                                          // 749
    view[0] = value % ((1 << 16) * (1 << 16)) | 0;                                                                     // 750
    view[1] = value / ((1 << 16) * (1 << 16)) | 0; // sign extension                                                   // 751
                                                                                                                       //
    if (value < 0) {                                                                                                   // 754
      view = new Uint8Array(buffer, 2);                                                                                // 755
      view.forEach(function (byte, i) {                                                                                // 756
        view[i] = 0xff;                                                                                                // 757
      });                                                                                                              // 758
    }                                                                                                                  // 759
                                                                                                                       //
    return new Uint8Array(buffer);                                                                                     // 761
  } // bindata                                                                                                         // 762
                                                                                                                       //
                                                                                                                       //
  if (EJSON.isBinary(value)) {                                                                                         // 765
    return new Uint8Array(value.buffer);                                                                               // 766
  } // no match                                                                                                        // 767
                                                                                                                       //
                                                                                                                       //
  return false;                                                                                                        // 770
} // Actually inserts a key value into the selector document                                                           // 771
// However, this checks there is no ambiguity in setting                                                               // 774
// the value for the given key, throws otherwise                                                                       // 775
                                                                                                                       //
                                                                                                                       //
function insertIntoDocument(document, key, value) {                                                                    // 776
  Object.keys(document).forEach(function (existingKey) {                                                               // 777
    if (existingKey.length > key.length && existingKey.indexOf(key) === 0 || key.length > existingKey.length && key.indexOf(existingKey) === 0) {
      throw new Error("cannot infer query fields to set, both paths '" + existingKey + "' and " + ("'" + key + "' are matched"));
    } else if (existingKey === key) {                                                                                  // 786
      throw new Error("cannot infer query fields to set, path '" + key + "' is matched twice");                        // 787
    }                                                                                                                  // 790
  });                                                                                                                  // 791
  document[key] = value;                                                                                               // 793
} // Returns a branched matcher that matches iff the given matcher does not.                                           // 794
// Note that this implicitly "deMorganizes" the wrapped function.  ie, it                                              // 797
// means that ALL branch values need to fail to match innerBranchedMatcher.                                            // 798
                                                                                                                       //
                                                                                                                       //
function invertBranchedMatcher(branchedMatcher) {                                                                      // 799
  return function (branchValues) {                                                                                     // 800
    // We explicitly choose to strip arrayIndices here: it doesn't make sense to                                       // 801
    // say "update the array element that does not match something", at least                                          // 802
    // in mongo-land.                                                                                                  // 803
    return {                                                                                                           // 804
      result: !branchedMatcher(branchValues).result                                                                    // 804
    };                                                                                                                 // 804
  };                                                                                                                   // 805
}                                                                                                                      // 806
                                                                                                                       //
function isIndexable(obj) {                                                                                            // 808
  return Array.isArray(obj) || LocalCollection._isPlainObject(obj);                                                    // 809
}                                                                                                                      // 810
                                                                                                                       //
function isNumericKey(s) {                                                                                             // 812
  return (/^[0-9]+$/.test(s)                                                                                           // 813
  );                                                                                                                   // 813
}                                                                                                                      // 814
                                                                                                                       //
function isOperatorObject(valueSelector, inconsistentOK) {                                                             // 819
  if (!LocalCollection._isPlainObject(valueSelector)) {                                                                // 820
    return false;                                                                                                      // 821
  }                                                                                                                    // 822
                                                                                                                       //
  var theseAreOperators = undefined;                                                                                   // 824
  Object.keys(valueSelector).forEach(function (selKey) {                                                               // 825
    var thisIsOperator = selKey.substr(0, 1) === '$';                                                                  // 826
                                                                                                                       //
    if (theseAreOperators === undefined) {                                                                             // 828
      theseAreOperators = thisIsOperator;                                                                              // 829
    } else if (theseAreOperators !== thisIsOperator) {                                                                 // 830
      if (!inconsistentOK) {                                                                                           // 831
        throw new Error("Inconsistent operator: " + JSON.stringify(valueSelector));                                    // 832
      }                                                                                                                // 835
                                                                                                                       //
      theseAreOperators = false;                                                                                       // 837
    }                                                                                                                  // 838
  });                                                                                                                  // 839
  return !!theseAreOperators; // {} has no operators                                                                   // 841
}                                                                                                                      // 842
                                                                                                                       //
// Helper for $lt/$gt/$lte/$gte.                                                                                       // 844
function makeInequality(cmpValueComparator) {                                                                          // 845
  return {                                                                                                             // 846
    compileElementSelector: function (operand) {                                                                       // 847
      // Arrays never compare false with non-arrays for any inequality.                                                // 848
      // XXX This was behavior we observed in pre-release MongoDB 2.5, but                                             // 849
      //     it seems to have been reverted.                                                                           // 850
      //     See https://jira.mongodb.org/browse/SERVER-11444                                                          // 851
      if (Array.isArray(operand)) {                                                                                    // 852
        return function () {                                                                                           // 853
          return false;                                                                                                // 853
        };                                                                                                             // 853
      } // Special case: consider undefined and null the same (so true with                                            // 854
      // $gte/$lte).                                                                                                   // 857
                                                                                                                       //
                                                                                                                       //
      if (operand === undefined) {                                                                                     // 858
        operand = null;                                                                                                // 859
      }                                                                                                                // 860
                                                                                                                       //
      var operandType = LocalCollection._f._type(operand);                                                             // 862
                                                                                                                       //
      return function (value) {                                                                                        // 864
        if (value === undefined) {                                                                                     // 865
          value = null;                                                                                                // 866
        } // Comparisons are never true among things of different type (except                                         // 867
        // null vs undefined).                                                                                         // 870
                                                                                                                       //
                                                                                                                       //
        if (LocalCollection._f._type(value) !== operandType) {                                                         // 871
          return false;                                                                                                // 872
        }                                                                                                              // 873
                                                                                                                       //
        return cmpValueComparator(LocalCollection._f._cmp(value, operand));                                            // 875
      };                                                                                                               // 876
    }                                                                                                                  // 877
  };                                                                                                                   // 846
} // makeLookupFunction(key) returns a lookup function.                                                                // 879
//                                                                                                                     // 882
// A lookup function takes in a document and returns an array of matching                                              // 883
// branches.  If no arrays are found while looking up the key, this array will                                         // 884
// have exactly one branches (possibly 'undefined', if some segment of the key                                         // 885
// was not found).                                                                                                     // 886
//                                                                                                                     // 887
// If arrays are found in the middle, this can have more than one element, since                                       // 888
// we 'branch'. When we 'branch', if there are more key segments to look up,                                           // 889
// then we only pursue branches that are plain objects (not arrays or scalars).                                        // 890
// This means we can actually end up with no branches!                                                                 // 891
//                                                                                                                     // 892
// We do *NOT* branch on arrays that are found at the end (ie, at the last                                             // 893
// dotted member of the key). We just return that array; if you want to                                                // 894
// effectively 'branch' over the array's values, post-process the lookup                                               // 895
// function with expandArraysInBranches.                                                                               // 896
//                                                                                                                     // 897
// Each branch is an object with keys:                                                                                 // 898
//  - value: the value at the branch                                                                                   // 899
//  - dontIterate: an optional bool; if true, it means that 'value' is an array                                        // 900
//    that expandArraysInBranches should NOT expand. This specifically happens                                         // 901
//    when there is a numeric index in the key, and ensures the                                                        // 902
//    perhaps-surprising MongoDB behavior where {'a.0': 5} does NOT                                                    // 903
//    match {a: [[5]]}.                                                                                                // 904
//  - arrayIndices: if any array indexing was done during lookup (either due to                                        // 905
//    explicit numeric indices or implicit branching), this will be an array of                                        // 906
//    the array indices used, from outermost to innermost; it is falsey or                                             // 907
//    absent if no array index is used. If an explicit numeric index is used,                                          // 908
//    the index will be followed in arrayIndices by the string 'x'.                                                    // 909
//                                                                                                                     // 910
//    Note: arrayIndices is used for two purposes. First, it is used to                                                // 911
//    implement the '$' modifier feature, which only ever looks at its first                                           // 912
//    element.                                                                                                         // 913
//                                                                                                                     // 914
//    Second, it is used for sort key generation, which needs to be able to tell                                       // 915
//    the difference between different paths. Moreover, it needs to                                                    // 916
//    differentiate between explicit and implicit branching, which is why                                              // 917
//    there's the somewhat hacky 'x' entry: this means that explicit and                                               // 918
//    implicit array lookups will have different full arrayIndices paths. (That                                        // 919
//    code only requires that different paths have different arrayIndices; it                                          // 920
//    doesn't actually 'parse' arrayIndices. As an alternative, arrayIndices                                           // 921
//    could contain objects with flags like 'implicit', but I think that only                                          // 922
//    makes the code surrounding them more complex.)                                                                   // 923
//                                                                                                                     // 924
//    (By the way, this field ends up getting passed around a lot without                                              // 925
//    cloning, so never mutate any arrayIndices field/var in this package!)                                            // 926
//                                                                                                                     // 927
//                                                                                                                     // 928
// At the top level, you may only pass in a plain object or array.                                                     // 929
//                                                                                                                     // 930
// See the test 'minimongo - lookup' for some examples of what lookup functions                                        // 931
// return.                                                                                                             // 932
                                                                                                                       //
                                                                                                                       //
function makeLookupFunction(key) {                                                                                     // 933
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                                // 933
  var parts = key.split('.');                                                                                          // 934
  var firstPart = parts.length ? parts[0] : '';                                                                        // 935
  var lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'));                                   // 936
                                                                                                                       //
  var omitUnnecessaryFields = function (result) {                                                                      // 941
    if (!result.dontIterate) {                                                                                         // 942
      delete result.dontIterate;                                                                                       // 943
    }                                                                                                                  // 944
                                                                                                                       //
    if (result.arrayIndices && !result.arrayIndices.length) {                                                          // 946
      delete result.arrayIndices;                                                                                      // 947
    }                                                                                                                  // 948
                                                                                                                       //
    return result;                                                                                                     // 950
  }; // Doc will always be a plain object or an array.                                                                 // 951
  // apply an explicit numeric index, an array.                                                                        // 954
                                                                                                                       //
                                                                                                                       //
  return function (doc) {                                                                                              // 955
    var arrayIndices = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];                         // 955
                                                                                                                       //
    if (Array.isArray(doc)) {                                                                                          // 956
      // If we're being asked to do an invalid lookup into an array (non-integer                                       // 957
      // or out-of-bounds), return no results (which is different from returning                                       // 958
      // a single undefined result, in that `null` equality checks won't match).                                       // 959
      if (!(isNumericKey(firstPart) && firstPart < doc.length)) {                                                      // 960
        return [];                                                                                                     // 961
      } // Remember that we used this array index. Include an 'x' to indicate that                                     // 962
      // the previous index came from being considered as an explicit array                                            // 965
      // index (not branching).                                                                                        // 966
                                                                                                                       //
                                                                                                                       //
      arrayIndices = arrayIndices.concat(+firstPart, 'x');                                                             // 967
    } // Do our first lookup.                                                                                          // 968
                                                                                                                       //
                                                                                                                       //
    var firstLevel = doc[firstPart]; // If there is no deeper to dig, return what we found.                            // 971
    //                                                                                                                 // 974
    // If what we found is an array, most value selectors will choose to treat                                         // 975
    // the elements of the array as matchable values in their own right, but                                           // 976
    // that's done outside of the lookup function. (Exceptions to this are $size                                       // 977
    // and stuff relating to $elemMatch.  eg, {a: {$size: 2}} does not match {a:                                       // 978
    // [[1, 2]]}.)                                                                                                     // 979
    //                                                                                                                 // 980
    // That said, if we just did an *explicit* array lookup (on doc) to find                                           // 981
    // firstLevel, and firstLevel is an array too, we do NOT want value                                                // 982
    // selectors to iterate over it.  eg, {'a.0': 5} does not match {a: [[5]]}.                                        // 983
    // So in that case, we mark the return value as 'don't iterate'.                                                   // 984
                                                                                                                       //
    if (!lookupRest) {                                                                                                 // 985
      return [omitUnnecessaryFields({                                                                                  // 986
        arrayIndices: arrayIndices,                                                                                    // 987
        dontIterate: Array.isArray(doc) && Array.isArray(firstLevel),                                                  // 988
        value: firstLevel                                                                                              // 989
      })];                                                                                                             // 986
    } // We need to dig deeper.  But if we can't, because what we've found is not                                      // 991
    // an array or plain object, we're done. If we just did a numeric index into                                       // 994
    // an array, we return nothing here (this is a change in Mongo 2.5 from                                            // 995
    // Mongo 2.4, where {'a.0.b': null} stopped matching {a: [5]}). Otherwise,                                         // 996
    // return a single `undefined` (which can, for example, match via equality                                         // 997
    // with `null`).                                                                                                   // 998
                                                                                                                       //
                                                                                                                       //
    if (!isIndexable(firstLevel)) {                                                                                    // 999
      if (Array.isArray(doc)) {                                                                                        // 1000
        return [];                                                                                                     // 1001
      }                                                                                                                // 1002
                                                                                                                       //
      return [omitUnnecessaryFields({                                                                                  // 1004
        arrayIndices: arrayIndices,                                                                                    // 1004
        value: undefined                                                                                               // 1004
      })];                                                                                                             // 1004
    }                                                                                                                  // 1005
                                                                                                                       //
    var result = [];                                                                                                   // 1007
                                                                                                                       //
    var appendToResult = function (more) {                                                                             // 1008
      result.push.apply(result, (0, _toConsumableArray3.default)(more));                                               // 1009
    }; // Dig deeper: look up the rest of the parts on whatever we've found.                                           // 1010
    // (lookupRest is smart enough to not try to do invalid lookups into                                               // 1013
    // firstLevel if it's an array.)                                                                                   // 1014
                                                                                                                       //
                                                                                                                       //
    appendToResult(lookupRest(firstLevel, arrayIndices)); // If we found an array, then in *addition* to potentially treating the next
    // part as a literal integer lookup, we should also 'branch': try to look up                                       // 1018
    // the rest of the parts on each array element in parallel.                                                        // 1019
    //                                                                                                                 // 1020
    // In this case, we *only* dig deeper into array elements that are plain                                           // 1021
    // objects. (Recall that we only got this far if we have further to dig.)                                          // 1022
    // This makes sense: we certainly don't dig deeper into non-indexable                                              // 1023
    // objects. And it would be weird to dig into an array: it's simpler to have                                       // 1024
    // a rule that explicit integer indexes only apply to an outer array, not to                                       // 1025
    // an array you find after a branching search.                                                                     // 1026
    //                                                                                                                 // 1027
    // In the special case of a numeric part in a *sort selector* (not a query                                         // 1028
    // selector), we skip the branching: we ONLY allow the numeric part to mean                                        // 1029
    // 'look up this index' in that case, not 'also look up this index in all                                          // 1030
    // the elements of the array'.                                                                                     // 1031
                                                                                                                       //
    if (Array.isArray(firstLevel) && !(isNumericKey(parts[1]) && options.forSort)) {                                   // 1032
      firstLevel.forEach(function (branch, arrayIndex) {                                                               // 1034
        if (LocalCollection._isPlainObject(branch)) {                                                                  // 1035
          appendToResult(lookupRest(branch, arrayIndices.concat(arrayIndex)));                                         // 1036
        }                                                                                                              // 1037
      });                                                                                                              // 1038
    }                                                                                                                  // 1039
                                                                                                                       //
    return result;                                                                                                     // 1041
  };                                                                                                                   // 1042
}                                                                                                                      // 1043
                                                                                                                       //
// Object exported only for unit testing.                                                                              // 1045
// Use it to export private functions to test in Tinytest.                                                             // 1046
MinimongoTest = {                                                                                                      // 1047
  makeLookupFunction: makeLookupFunction                                                                               // 1047
};                                                                                                                     // 1047
                                                                                                                       //
MinimongoError = function (message) {                                                                                  // 1048
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                                // 1048
                                                                                                                       //
  if (typeof message === 'string' && options.field) {                                                                  // 1049
    message += " for field '" + options.field + "'";                                                                   // 1050
  }                                                                                                                    // 1051
                                                                                                                       //
  var error = new Error(message);                                                                                      // 1053
  error.name = 'MinimongoError';                                                                                       // 1054
  return error;                                                                                                        // 1055
};                                                                                                                     // 1056
                                                                                                                       //
function nothingMatcher(docOrBranchedValues) {                                                                         // 1058
  return {                                                                                                             // 1059
    result: false                                                                                                      // 1059
  };                                                                                                                   // 1059
}                                                                                                                      // 1060
                                                                                                                       //
// Takes an operator object (an object with $ keys) and returns a branched                                             // 1062
// matcher for it.                                                                                                     // 1063
function operatorBranchedMatcher(valueSelector, matcher, isRoot) {                                                     // 1064
  // Each valueSelector works separately on the various branches.  So one                                              // 1065
  // operator can match one branch and another can match another branch.  This                                         // 1066
  // is OK.                                                                                                            // 1067
  var operatorMatchers = Object.keys(valueSelector).map(function (operator) {                                          // 1068
    var operand = valueSelector[operator];                                                                             // 1069
    var simpleRange = ['$lt', '$lte', '$gt', '$gte'].includes(operator) && typeof operand === 'number';                // 1071
    var simpleEquality = ['$ne', '$eq'].includes(operator) && operand !== Object(operand);                             // 1076
    var simpleInclusion = ['$in', '$nin'].includes(operator) && Array.isArray(operand) && !operand.some(function (x) {
      return x === Object(x);                                                                                          // 1084
    });                                                                                                                // 1084
                                                                                                                       //
    if (!(simpleRange || simpleInclusion || simpleEquality)) {                                                         // 1087
      matcher._isSimple = false;                                                                                       // 1088
    }                                                                                                                  // 1089
                                                                                                                       //
    if (hasOwn.call(VALUE_OPERATORS, operator)) {                                                                      // 1091
      return VALUE_OPERATORS[operator](operand, valueSelector, matcher, isRoot);                                       // 1092
    }                                                                                                                  // 1093
                                                                                                                       //
    if (hasOwn.call(ELEMENT_OPERATORS, operator)) {                                                                    // 1095
      var options = ELEMENT_OPERATORS[operator];                                                                       // 1096
      return convertElementMatcherToBranchedMatcher(options.compileElementSelector(operand, valueSelector, matcher), options);
    }                                                                                                                  // 1101
                                                                                                                       //
    throw new Error("Unrecognized operator: " + operator);                                                             // 1103
  });                                                                                                                  // 1104
  return andBranchedMatchers(operatorMatchers);                                                                        // 1106
} // paths - Array: list of mongo style paths                                                                          // 1107
// newLeafFn - Function: of form function(path) should return a scalar value to                                        // 1110
//                       put into list created for that path                                                           // 1111
// conflictFn - Function: of form function(node, path, fullPath) is called                                             // 1112
//                        when building a tree path for 'fullPath' node on                                             // 1113
//                        'path' was already a leaf with a value. Must return a                                        // 1114
//                        conflict resolution.                                                                         // 1115
// initial tree - Optional Object: starting tree.                                                                      // 1116
// @returns - Object: tree represented as a set of nested objects                                                      // 1117
                                                                                                                       //
                                                                                                                       //
function pathsToTree(paths, newLeafFn, conflictFn) {                                                                   // 1118
  var root = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};                                   // 1118
  paths.forEach(function (path) {                                                                                      // 1119
    var pathArray = path.split('.');                                                                                   // 1120
    var tree = root; // use .every just for iteration with break                                                       // 1121
                                                                                                                       //
    var success = pathArray.slice(0, -1).every(function (key, i) {                                                     // 1124
      if (!hasOwn.call(tree, key)) {                                                                                   // 1125
        tree[key] = {};                                                                                                // 1126
      } else if (tree[key] !== Object(tree[key])) {                                                                    // 1127
        tree[key] = conflictFn(tree[key], pathArray.slice(0, i + 1).join('.'), path); // break out of loop if we are failing for this path
                                                                                                                       //
        if (tree[key] !== Object(tree[key])) {                                                                         // 1135
          return false;                                                                                                // 1136
        }                                                                                                              // 1137
      }                                                                                                                // 1138
                                                                                                                       //
      tree = tree[key];                                                                                                // 1140
      return true;                                                                                                     // 1142
    });                                                                                                                // 1143
                                                                                                                       //
    if (success) {                                                                                                     // 1145
      var lastKey = pathArray[pathArray.length - 1];                                                                   // 1146
                                                                                                                       //
      if (hasOwn.call(tree, lastKey)) {                                                                                // 1147
        tree[lastKey] = conflictFn(tree[lastKey], path, path);                                                         // 1148
      } else {                                                                                                         // 1149
        tree[lastKey] = newLeafFn(path);                                                                               // 1150
      }                                                                                                                // 1151
    }                                                                                                                  // 1152
  });                                                                                                                  // 1153
  return root;                                                                                                         // 1155
}                                                                                                                      // 1156
                                                                                                                       //
// Makes sure we get 2 elements array and assume the first one to be x and                                             // 1158
// the second one to y no matter what user passes.                                                                     // 1159
// In case user passes { lon: x, lat: y } returns [x, y]                                                               // 1160
function pointToArray(point) {                                                                                         // 1161
  return Array.isArray(point) ? point.slice() : [point.x, point.y];                                                    // 1162
} // Creating a document from an upsert is quite tricky.                                                               // 1163
// E.g. this selector: {"$or": [{"b.foo": {"$all": ["bar"]}}]}, should result                                          // 1166
// in: {"b.foo": "bar"}                                                                                                // 1167
// But this selector: {"$or": [{"b": {"foo": {"$all": ["bar"]}}}]} should throw                                        // 1168
// an error                                                                                                            // 1169
// Some rules (found mainly with trial & error, so there might be more):                                               // 1171
// - handle all childs of $and (or implicit $and)                                                                      // 1172
// - handle $or nodes with exactly 1 child                                                                             // 1173
// - ignore $or nodes with more than 1 child                                                                           // 1174
// - ignore $nor and $not nodes                                                                                        // 1175
// - throw when a value can not be set unambiguously                                                                   // 1176
// - every value for $all should be dealt with as separate $eq-s                                                       // 1177
// - threat all children of $all as $eq setters (=> set if $all.length === 1,                                          // 1178
//   otherwise throw error)                                                                                            // 1179
// - you can not mix '$'-prefixed keys and non-'$'-prefixed keys                                                       // 1180
// - you can only have dotted keys on a root-level                                                                     // 1181
// - you can not have '$'-prefixed keys more than one-level deep in an object                                          // 1182
// Handles one key/value pair to put in the selector document                                                          // 1184
                                                                                                                       //
                                                                                                                       //
function populateDocumentWithKeyValue(document, key, value) {                                                          // 1185
  if (value && Object.getPrototypeOf(value) === Object.prototype) {                                                    // 1186
    populateDocumentWithObject(document, key, value);                                                                  // 1187
  } else if (!(value instanceof RegExp)) {                                                                             // 1188
    insertIntoDocument(document, key, value);                                                                          // 1189
  }                                                                                                                    // 1190
} // Handles a key, value pair to put in the selector document                                                         // 1191
// if the value is an object                                                                                           // 1194
                                                                                                                       //
                                                                                                                       //
function populateDocumentWithObject(document, key, value) {                                                            // 1195
  var keys = Object.keys(value);                                                                                       // 1196
  var unprefixedKeys = keys.filter(function (op) {                                                                     // 1197
    return op[0] !== '$';                                                                                              // 1197
  });                                                                                                                  // 1197
                                                                                                                       //
  if (unprefixedKeys.length > 0 || !keys.length) {                                                                     // 1199
    // Literal (possibly empty) object ( or empty object )                                                             // 1200
    // Don't allow mixing '$'-prefixed with non-'$'-prefixed fields                                                    // 1201
    if (keys.length !== unprefixedKeys.length) {                                                                       // 1202
      throw new Error("unknown operator: " + unprefixedKeys[0]);                                                       // 1203
    }                                                                                                                  // 1204
                                                                                                                       //
    validateObject(value, key);                                                                                        // 1206
    insertIntoDocument(document, key, value);                                                                          // 1207
  } else {                                                                                                             // 1208
    Object.keys(value).forEach(function (op) {                                                                         // 1209
      var object = value[op];                                                                                          // 1210
                                                                                                                       //
      if (op === '$eq') {                                                                                              // 1212
        populateDocumentWithKeyValue(document, key, object);                                                           // 1213
      } else if (op === '$all') {                                                                                      // 1214
        // every value for $all should be dealt with as separate $eq-s                                                 // 1215
        object.forEach(function (element) {                                                                            // 1216
          return populateDocumentWithKeyValue(document, key, element);                                                 // 1216
        });                                                                                                            // 1216
      }                                                                                                                // 1219
    });                                                                                                                // 1220
  }                                                                                                                    // 1221
} // Fills a document with certain fields from an upsert selector                                                      // 1222
                                                                                                                       //
                                                                                                                       //
function populateDocumentWithQueryFields(query) {                                                                      // 1225
  var document = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                               // 1225
                                                                                                                       //
  if (Object.getPrototypeOf(query) === Object.prototype) {                                                             // 1226
    // handle implicit $and                                                                                            // 1227
    Object.keys(query).forEach(function (key) {                                                                        // 1228
      var value = query[key];                                                                                          // 1229
                                                                                                                       //
      if (key === '$and') {                                                                                            // 1231
        // handle explicit $and                                                                                        // 1232
        value.forEach(function (element) {                                                                             // 1233
          return populateDocumentWithQueryFields(element, document);                                                   // 1233
        });                                                                                                            // 1233
      } else if (key === '$or') {                                                                                      // 1236
        // handle $or nodes with exactly 1 child                                                                       // 1237
        if (value.length === 1) {                                                                                      // 1238
          populateDocumentWithQueryFields(value[0], document);                                                         // 1239
        }                                                                                                              // 1240
      } else if (key[0] !== '$') {                                                                                     // 1241
        // Ignore other '$'-prefixed logical selectors                                                                 // 1242
        populateDocumentWithKeyValue(document, key, value);                                                            // 1243
      }                                                                                                                // 1244
    });                                                                                                                // 1245
  } else {                                                                                                             // 1246
    // Handle meteor-specific shortcut for selecting _id                                                               // 1247
    if (LocalCollection._selectorIsId(query)) {                                                                        // 1248
      insertIntoDocument(document, '_id', query);                                                                      // 1249
    }                                                                                                                  // 1250
  }                                                                                                                    // 1251
                                                                                                                       //
  return document;                                                                                                     // 1253
}                                                                                                                      // 1254
                                                                                                                       //
function projectionDetails(fields) {                                                                                   // 1262
  // Find the non-_id keys (_id is handled specially because it is included                                            // 1263
  // unless explicitly excluded). Sort the keys, so that our code to detect                                            // 1264
  // overlaps like 'foo' and 'foo.bar' can assume that 'foo' comes first.                                              // 1265
  var fieldsKeys = Object.keys(fields).sort(); // If _id is the only field in the projection, do not remove it, since it is
  // required to determine if this is an exclusion or exclusion. Also keep an                                          // 1269
  // inclusive _id, since inclusive _id follows the normal rules about mixing                                          // 1270
  // inclusive and exclusive fields. If _id is not the only field in the                                               // 1271
  // projection and is exclusive, remove it so it can be handled later by a                                            // 1272
  // special case, since exclusive _id is always allowed.                                                              // 1273
                                                                                                                       //
  if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id)) {          // 1274
    fieldsKeys = fieldsKeys.filter(function (key) {                                                                    // 1276
      return key !== '_id';                                                                                            // 1276
    });                                                                                                                // 1276
  }                                                                                                                    // 1277
                                                                                                                       //
  var including = null; // Unknown                                                                                     // 1279
                                                                                                                       //
  fieldsKeys.forEach(function (keyPath) {                                                                              // 1281
    var rule = !!fields[keyPath];                                                                                      // 1282
                                                                                                                       //
    if (including === null) {                                                                                          // 1284
      including = rule;                                                                                                // 1285
    } // This error message is copied from MongoDB shell                                                               // 1286
                                                                                                                       //
                                                                                                                       //
    if (including !== rule) {                                                                                          // 1289
      throw MinimongoError('You cannot currently mix including and excluding fields.');                                // 1290
    }                                                                                                                  // 1293
  });                                                                                                                  // 1294
  var projectionRulesTree = pathsToTree(fieldsKeys, function (path) {                                                  // 1296
    return including;                                                                                                  // 1298
  }, function (node, path, fullPath) {                                                                                 // 1298
    // Check passed projection fields' keys: If you have two rules such as                                             // 1300
    // 'foo.bar' and 'foo.bar.baz', then the result becomes ambiguous. If                                              // 1301
    // that happens, there is a probability you are doing something wrong,                                             // 1302
    // framework should notify you about such mistake earlier on cursor                                                // 1303
    // compilation step than later during runtime.  Note, that real mongo                                              // 1304
    // doesn't do anything about it and the later rule appears in projection                                           // 1305
    // project, more priority it takes.                                                                                // 1306
    //                                                                                                                 // 1307
    // Example, assume following in mongo shell:                                                                       // 1308
    // > db.coll.insert({ a: { b: 23, c: 44 } })                                                                       // 1309
    // > db.coll.find({}, { 'a': 1, 'a.b': 1 })                                                                        // 1310
    // {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23}}                                                   // 1311
    // > db.coll.find({}, { 'a.b': 1, 'a': 1 })                                                                        // 1312
    // {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23, "c": 44}}                                          // 1313
    //                                                                                                                 // 1314
    // Note, how second time the return set of keys is different.                                                      // 1315
    var currentPath = fullPath;                                                                                        // 1316
    var anotherPath = path;                                                                                            // 1317
    throw MinimongoError("both " + currentPath + " and " + anotherPath + " found in fields option, " + 'using both of them may trigger unexpected behavior. Did you mean to ' + 'use only one of them?');
  });                                                                                                                  // 1323
  return {                                                                                                             // 1325
    including: including,                                                                                              // 1325
    tree: projectionRulesTree                                                                                          // 1325
  };                                                                                                                   // 1325
}                                                                                                                      // 1326
                                                                                                                       //
function regexpElementMatcher(regexp) {                                                                                // 1329
  return function (value) {                                                                                            // 1330
    if (value instanceof RegExp) {                                                                                     // 1331
      return value.toString() === regexp.toString();                                                                   // 1332
    } // Regexps only work against strings.                                                                            // 1333
                                                                                                                       //
                                                                                                                       //
    if (typeof value !== 'string') {                                                                                   // 1336
      return false;                                                                                                    // 1337
    } // Reset regexp's state to avoid inconsistent matching for objects with the                                      // 1338
    // same value on consecutive calls of regexp.test. This happens only if the                                        // 1341
    // regexp has the 'g' flag. Also note that ES6 introduces a new flag 'y' for                                       // 1342
    // which we should *not* change the lastIndex but MongoDB doesn't support                                          // 1343
    // either of these flags.                                                                                          // 1344
                                                                                                                       //
                                                                                                                       //
    regexp.lastIndex = 0;                                                                                              // 1345
    return regexp.test(value);                                                                                         // 1347
  };                                                                                                                   // 1348
}                                                                                                                      // 1349
                                                                                                                       //
// Validates the key in a path.                                                                                        // 1351
// Objects that are nested more then 1 level cannot have dotted fields                                                 // 1352
// or fields starting with '$'                                                                                         // 1353
function validateKeyInPath(key, path) {                                                                                // 1354
  if (key.includes('.')) {                                                                                             // 1355
    throw new Error("The dotted field '" + key + "' in '" + path + "." + key + " is not valid for storage.");          // 1356
  }                                                                                                                    // 1359
                                                                                                                       //
  if (key[0] === '$') {                                                                                                // 1361
    throw new Error("The dollar ($) prefixed field  '" + path + "." + key + " is not valid for storage.");             // 1362
  }                                                                                                                    // 1365
} // Recursively validates an object that is nested more than one level deep                                           // 1366
                                                                                                                       //
                                                                                                                       //
function validateObject(object, path) {                                                                                // 1369
  if (object && Object.getPrototypeOf(object) === Object.prototype) {                                                  // 1370
    Object.keys(object).forEach(function (key) {                                                                       // 1371
      validateKeyInPath(key, path);                                                                                    // 1372
      validateObject(object[key], path + '.' + key);                                                                   // 1373
    });                                                                                                                // 1374
  }                                                                                                                    // 1375
}                                                                                                                      // 1376
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/cursor.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  "default": function () {                                                                                             // 1
    return Cursor;                                                                                                     // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var LocalCollection = void 0;                                                                                          // 1
module.watch(require("./local_collection.js"), {                                                                       // 1
  "default": function (v) {                                                                                            // 1
    LocalCollection = v;                                                                                               // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
                                                                                                                       //
var Cursor = function () {                                                                                             //
  // don't call this ctor directly.  use LocalCollection.find().                                                       // 6
  function Cursor(collection, selector) {                                                                              // 7
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                              // 7
    (0, _classCallCheck3.default)(this, Cursor);                                                                       // 7
    this.collection = collection;                                                                                      // 8
    this.sorter = null;                                                                                                // 9
    this.matcher = new Minimongo.Matcher(selector);                                                                    // 10
                                                                                                                       //
    if (LocalCollection._selectorIsIdPerhapsAsObject(selector)) {                                                      // 12
      // stash for fast _id and { _id }                                                                                // 13
      this._selectorId = selector._id || selector;                                                                     // 14
    } else {                                                                                                           // 15
      this._selectorId = undefined;                                                                                    // 16
                                                                                                                       //
      if (this.matcher.hasGeoQuery() || options.sort) {                                                                // 18
        this.sorter = new Minimongo.Sorter(options.sort || [], {                                                       // 19
          matcher: this.matcher                                                                                        // 21
        });                                                                                                            // 21
      }                                                                                                                // 23
    }                                                                                                                  // 24
                                                                                                                       //
    this.skip = options.skip || 0;                                                                                     // 26
    this.limit = options.limit;                                                                                        // 27
    this.fields = options.fields;                                                                                      // 28
    this._projectionFn = LocalCollection._compileProjection(this.fields || {});                                        // 30
    this._transform = LocalCollection.wrapTransform(options.transform); // by default, queries register w/ Tracker when it is available.
                                                                                                                       //
    if (typeof Tracker !== 'undefined') {                                                                              // 35
      this.reactive = options.reactive === undefined ? true : options.reactive;                                        // 36
    }                                                                                                                  // 37
  } /**                                                                                                                // 38
     * @summary Returns the number of documents that match a query.                                                    //
     * @memberOf Mongo.Cursor                                                                                          //
     * @method  count                                                                                                  //
     * @instance                                                                                                       //
     * @locus Anywhere                                                                                                 //
     * @returns {Number}                                                                                               //
     */                                                                                                                //
                                                                                                                       //
  Cursor.prototype.count = function () {                                                                               //
    function count() {                                                                                                 //
      if (this.reactive) {                                                                                             // 49
        // allow the observe to be unordered                                                                           // 50
        this._depend({                                                                                                 // 51
          added: true,                                                                                                 // 51
          removed: true                                                                                                // 51
        }, true);                                                                                                      // 51
      }                                                                                                                // 52
                                                                                                                       //
      return this._getRawObjects({                                                                                     // 54
        ordered: true                                                                                                  // 54
      }).length;                                                                                                       // 54
    }                                                                                                                  // 55
                                                                                                                       //
    return count;                                                                                                      //
  }(); /**                                                                                                             //
        * @summary Return all matching documents as an Array.                                                          //
        * @memberOf Mongo.Cursor                                                                                       //
        * @method  fetch                                                                                               //
        * @instance                                                                                                    //
        * @locus Anywhere                                                                                              //
        * @returns {Object[]}                                                                                          //
        */                                                                                                             //
                                                                                                                       //
  Cursor.prototype.fetch = function () {                                                                               //
    function fetch() {                                                                                                 //
      var result = [];                                                                                                 // 66
      this.forEach(function (doc) {                                                                                    // 68
        result.push(doc);                                                                                              // 69
      });                                                                                                              // 70
      return result;                                                                                                   // 72
    }                                                                                                                  // 73
                                                                                                                       //
    return fetch;                                                                                                      //
  }(); /**                                                                                                             //
        * @callback IterationCallback                                                                                  //
        * @param {Object} doc                                                                                          //
        * @param {Number} index                                                                                        //
        */ /**                                                                                                         //
            * @summary Call `callback` once for each matching document, sequentially and                               //
            *          synchronously.                                                                                  //
            * @locus Anywhere                                                                                          //
            * @method  forEach                                                                                         //
            * @instance                                                                                                //
            * @memberOf Mongo.Cursor                                                                                   //
            * @param {IterationCallback} callback Function to call. It will be called                                  //
            *                                     with three arguments: the document, a                                //
            *                                     0-based index, and <em>cursor</em>                                   //
            *                                     itself.                                                              //
            * @param {Any} [thisArg] An object which will be the value of `this` inside                                //
            *                        `callback`.                                                                       //
            */                                                                                                         //
                                                                                                                       //
  Cursor.prototype.forEach = function () {                                                                             //
    function forEach(callback, thisArg) {                                                                              //
      var _this = this;                                                                                                // 94
                                                                                                                       //
      if (this.reactive) {                                                                                             // 95
        this._depend({                                                                                                 // 96
          addedBefore: true,                                                                                           // 97
          removed: true,                                                                                               // 98
          changed: true,                                                                                               // 99
          movedBefore: true                                                                                            // 100
        });                                                                                                            // 96
      }                                                                                                                // 101
                                                                                                                       //
      this._getRawObjects({                                                                                            // 103
        ordered: true                                                                                                  // 103
      }).forEach(function (element, i) {                                                                               // 103
        // This doubles as a clone operation.                                                                          // 104
        element = _this._projectionFn(element);                                                                        // 105
                                                                                                                       //
        if (_this._transform) {                                                                                        // 107
          element = _this._transform(element);                                                                         // 108
        }                                                                                                              // 109
                                                                                                                       //
        callback.call(thisArg, element, i, _this);                                                                     // 111
      });                                                                                                              // 112
    }                                                                                                                  // 113
                                                                                                                       //
    return forEach;                                                                                                    //
  }();                                                                                                                 //
                                                                                                                       //
  Cursor.prototype.getTransform = function () {                                                                        //
    function getTransform() {                                                                                          //
      return this._transform;                                                                                          // 116
    }                                                                                                                  // 117
                                                                                                                       //
    return getTransform;                                                                                               //
  }(); /**                                                                                                             //
        * @summary Map callback over all matching documents.  Returns an Array.                                        //
        * @locus Anywhere                                                                                              //
        * @method map                                                                                                  //
        * @instance                                                                                                    //
        * @memberOf Mongo.Cursor                                                                                       //
        * @param {IterationCallback} callback Function to call. It will be called                                      //
        *                                     with three arguments: the document, a                                    //
        *                                     0-based index, and <em>cursor</em>                                       //
        *                                     itself.                                                                  //
        * @param {Any} [thisArg] An object which will be the value of `this` inside                                    //
        *                        `callback`.                                                                           //
        */                                                                                                             //
                                                                                                                       //
  Cursor.prototype.map = function () {                                                                                 //
    function map(callback, thisArg) {                                                                                  //
      var _this2 = this;                                                                                               // 132
                                                                                                                       //
      var result = [];                                                                                                 // 133
      this.forEach(function (doc, i) {                                                                                 // 135
        result.push(callback.call(thisArg, doc, i, _this2));                                                           // 136
      });                                                                                                              // 137
      return result;                                                                                                   // 139
    }                                                                                                                  // 140
                                                                                                                       //
    return map;                                                                                                        //
  }(); // options to contain:                                                                                          //
  //  * callbacks for observe():                                                                                       // 143
  //    - addedAt (document, atIndex)                                                                                  // 144
  //    - added (document)                                                                                             // 145
  //    - changedAt (newDocument, oldDocument, atIndex)                                                                // 146
  //    - changed (newDocument, oldDocument)                                                                           // 147
  //    - removedAt (document, atIndex)                                                                                // 148
  //    - removed (document)                                                                                           // 149
  //    - movedTo (document, oldIndex, newIndex)                                                                       // 150
  //                                                                                                                   // 151
  // attributes available on returned query handle:                                                                    // 152
  //  * stop(): end updates                                                                                            // 153
  //  * collection: the collection this query is querying                                                              // 154
  //                                                                                                                   // 155
  // iff x is a returned query handle, (x instanceof                                                                   // 156
  // LocalCollection.ObserveHandle) is true                                                                            // 157
  //                                                                                                                   // 158
  // initial results delivered through added callback                                                                  // 159
  // XXX maybe callbacks should take a list of objects, to expose transactions?                                        // 160
  // XXX maybe support field limiting (to limit what you're notified on)                                               // 161
  /**                                                                                                                  // 163
   * @summary Watch a query.  Receive callbacks as the result set changes.                                             //
   * @locus Anywhere                                                                                                   //
   * @memberOf Mongo.Cursor                                                                                            //
   * @instance                                                                                                         //
   * @param {Object} callbacks Functions to call to deliver the result set as it                                       //
   *                           changes                                                                                 //
   */                                                                                                                  //
                                                                                                                       //
  Cursor.prototype.observe = function () {                                                                             //
    function observe(options) {                                                                                        //
      return LocalCollection._observeFromObserveChanges(this, options);                                                // 172
    }                                                                                                                  // 173
                                                                                                                       //
    return observe;                                                                                                    //
  }(); /**                                                                                                             //
        * @summary Watch a query. Receive callbacks as the result set changes. Only                                    //
        *          the differences between the old and new documents are passed to                                     //
        *          the callbacks.                                                                                      //
        * @locus Anywhere                                                                                              //
        * @memberOf Mongo.Cursor                                                                                       //
        * @instance                                                                                                    //
        * @param {Object} callbacks Functions to call to deliver the result set as it                                  //
        *                           changes                                                                            //
        */                                                                                                             //
                                                                                                                       //
  Cursor.prototype.observeChanges = function () {                                                                      //
    function observeChanges(options) {                                                                                 //
      var _this3 = this;                                                                                               // 185
                                                                                                                       //
      var ordered = LocalCollection._observeChangesCallbacksAreOrdered(options); // there are several places that assume you aren't combining skip/limit with
      // unordered observe.  eg, update's EJSON.clone, and the "there are several"                                     // 189
      // comment in _modifyAndNotify                                                                                   // 190
      // XXX allow skip/limit with unordered observe                                                                   // 191
                                                                                                                       //
                                                                                                                       //
      if (!options._allow_unordered && !ordered && (this.skip || this.limit)) {                                        // 192
        throw new Error('must use ordered observe (ie, \'addedBefore\' instead of \'added\') ' + 'with skip or limit');
      }                                                                                                                // 197
                                                                                                                       //
      if (this.fields && (this.fields._id === 0 || this.fields._id === false)) {                                       // 199
        throw Error('You may not observe a cursor with {fields: {_id: 0}}');                                           // 200
      }                                                                                                                // 201
                                                                                                                       //
      var distances = this.matcher.hasGeoQuery() && ordered && new LocalCollection._IdMap();                           // 203
      var query = {                                                                                                    // 209
        cursor: this,                                                                                                  // 210
        dirty: false,                                                                                                  // 211
        distances: distances,                                                                                          // 212
        matcher: this.matcher,                                                                                         // 213
        // not fast pathed                                                                                             // 213
        ordered: ordered,                                                                                              // 214
        projectionFn: this._projectionFn,                                                                              // 215
        resultsSnapshot: null,                                                                                         // 216
        sorter: ordered && this.sorter                                                                                 // 217
      };                                                                                                               // 209
      var qid = void 0; // Non-reactive queries call added[Before] and then never call anything                        // 220
      // else.                                                                                                         // 223
                                                                                                                       //
      if (this.reactive) {                                                                                             // 224
        qid = this.collection.next_qid++;                                                                              // 225
        this.collection.queries[qid] = query;                                                                          // 226
      }                                                                                                                // 227
                                                                                                                       //
      query.results = this._getRawObjects({                                                                            // 229
        ordered: ordered,                                                                                              // 229
        distances: query.distances                                                                                     // 229
      });                                                                                                              // 229
                                                                                                                       //
      if (this.collection.paused) {                                                                                    // 231
        query.resultsSnapshot = ordered ? [] : new LocalCollection._IdMap();                                           // 232
      } // wrap callbacks we were passed. callbacks only fire when not paused and                                      // 233
      // are never undefined                                                                                           // 236
      // Filters out blacklisted fields according to cursor's projection.                                              // 237
      // XXX wrong place for this?                                                                                     // 238
      // furthermore, callbacks enqueue until the operation we're working on is                                        // 240
      // done.                                                                                                         // 241
                                                                                                                       //
                                                                                                                       //
      var wrapCallback = function (fn) {                                                                               // 242
        if (!fn) {                                                                                                     // 243
          return function () {};                                                                                       // 244
        }                                                                                                              // 245
                                                                                                                       //
        var self = _this3;                                                                                             // 247
        return function () /* args*/{                                                                                  // 248
          var _this4 = this;                                                                                           // 248
                                                                                                                       //
          if (self.collection.paused) {                                                                                // 249
            return;                                                                                                    // 250
          }                                                                                                            // 251
                                                                                                                       //
          var args = arguments;                                                                                        // 253
                                                                                                                       //
          self.collection._observeQueue.queueTask(function () {                                                        // 255
            fn.apply(_this4, args);                                                                                    // 256
          });                                                                                                          // 257
        };                                                                                                             // 258
      };                                                                                                               // 259
                                                                                                                       //
      query.added = wrapCallback(options.added);                                                                       // 261
      query.changed = wrapCallback(options.changed);                                                                   // 262
      query.removed = wrapCallback(options.removed);                                                                   // 263
                                                                                                                       //
      if (ordered) {                                                                                                   // 265
        query.addedBefore = wrapCallback(options.addedBefore);                                                         // 266
        query.movedBefore = wrapCallback(options.movedBefore);                                                         // 267
      }                                                                                                                // 268
                                                                                                                       //
      if (!options._suppress_initial && !this.collection.paused) {                                                     // 270
        var results = ordered ? query.results : query.results._map;                                                    // 271
        Object.keys(results).forEach(function (key) {                                                                  // 273
          var doc = results[key];                                                                                      // 274
          var fields = EJSON.clone(doc);                                                                               // 275
          delete fields._id;                                                                                           // 277
                                                                                                                       //
          if (ordered) {                                                                                               // 279
            query.addedBefore(doc._id, _this3._projectionFn(fields), null);                                            // 280
          }                                                                                                            // 281
                                                                                                                       //
          query.added(doc._id, _this3._projectionFn(fields));                                                          // 283
        });                                                                                                            // 284
      }                                                                                                                // 285
                                                                                                                       //
      var handle = Object.assign(new LocalCollection.ObserveHandle(), {                                                // 287
        collection: this.collection,                                                                                   // 288
        stop: function () {                                                                                            // 289
          if (_this3.reactive) {                                                                                       // 290
            delete _this3.collection.queries[qid];                                                                     // 291
          }                                                                                                            // 292
        }                                                                                                              // 293
      });                                                                                                              // 287
                                                                                                                       //
      if (this.reactive && Tracker.active) {                                                                           // 296
        // XXX in many cases, the same observe will be recreated when                                                  // 297
        // the current autorun is rerun.  we could save work by                                                        // 298
        // letting it linger across rerun and potentially get                                                          // 299
        // repurposed if the same observe is performed, using logic                                                    // 300
        // similar to that of Meteor.subscribe.                                                                        // 301
        Tracker.onInvalidate(function () {                                                                             // 302
          handle.stop();                                                                                               // 303
        });                                                                                                            // 304
      } // run the observe callbacks resulting from the initial contents                                               // 305
      // before we leave the observe.                                                                                  // 308
                                                                                                                       //
                                                                                                                       //
      this.collection._observeQueue.drain();                                                                           // 309
                                                                                                                       //
      return handle;                                                                                                   // 311
    }                                                                                                                  // 312
                                                                                                                       //
    return observeChanges;                                                                                             //
  }(); // Since we don't actually have a "nextObject" interface, there's really no                                     //
  // reason to have a "rewind" interface.  All it did was make multiple calls                                          // 315
  // to fetch/map/forEach return nothing the second time.                                                              // 316
  // XXX COMPAT WITH 0.8.1                                                                                             // 317
                                                                                                                       //
                                                                                                                       //
  Cursor.prototype.rewind = function () {                                                                              //
    function rewind() {}                                                                                               //
                                                                                                                       //
    return rewind;                                                                                                     //
  }(); // XXX Maybe we need a version of observe that just calls a callback if                                         //
  // anything changed.                                                                                                 // 321
                                                                                                                       //
                                                                                                                       //
  Cursor.prototype._depend = function () {                                                                             //
    function _depend(changers, _allow_unordered) {                                                                     //
      if (Tracker.active) {                                                                                            // 323
        var dependency = new Tracker.Dependency();                                                                     // 324
        var notify = dependency.changed.bind(dependency);                                                              // 325
        dependency.depend();                                                                                           // 327
        var options = {                                                                                                // 329
          _allow_unordered: _allow_unordered,                                                                          // 329
          _suppress_initial: true                                                                                      // 329
        };                                                                                                             // 329
        ['added', 'addedBefore', 'changed', 'movedBefore', 'removed'].forEach(function (fn) {                          // 331
          if (changers[fn]) {                                                                                          // 333
            options[fn] = notify;                                                                                      // 334
          }                                                                                                            // 335
        }); // observeChanges will stop() when this computation is invalidated                                         // 336
                                                                                                                       //
        this.observeChanges(options);                                                                                  // 339
      }                                                                                                                // 340
    }                                                                                                                  // 341
                                                                                                                       //
    return _depend;                                                                                                    //
  }();                                                                                                                 //
                                                                                                                       //
  Cursor.prototype._getCollectionName = function () {                                                                  //
    function _getCollectionName() {                                                                                    //
      return this.collection.name;                                                                                     // 344
    }                                                                                                                  // 345
                                                                                                                       //
    return _getCollectionName;                                                                                         //
  }(); // Returns a collection of matching objects, but doesn't deep copy them.                                        //
  //                                                                                                                   // 348
  // If ordered is set, returns a sorted array, respecting sorter, skip, and                                           // 349
  // limit properties of the query.  if sorter is falsey, no sort -- you get the                                       // 350
  // natural order.                                                                                                    // 351
  //                                                                                                                   // 352
  // If ordered is not set, returns an object mapping from ID to doc (sorter,                                          // 353
  // skip and limit should not be set).                                                                                // 354
  //                                                                                                                   // 355
  // If ordered is set and this cursor is a $near geoquery, then this function                                         // 356
  // will use an _IdMap to track each distance from the $near argument point in                                        // 357
  // order to use it as a sort key. If an _IdMap is passed in the 'distances'                                          // 358
  // argument, this function will clear it and use it for this purpose                                                 // 359
  // (otherwise it will just create its own _IdMap). The observeChanges                                                // 360
  // implementation uses this to remember the distances after this function                                            // 361
  // returns.                                                                                                          // 362
                                                                                                                       //
                                                                                                                       //
  Cursor.prototype._getRawObjects = function () {                                                                      //
    function _getRawObjects() {                                                                                        //
      var _this5 = this;                                                                                               // 363
                                                                                                                       //
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};                            // 363
      // XXX use OrderedDict instead of array, and make IdMap and OrderedDict                                          // 364
      // compatible                                                                                                    // 365
      var results = options.ordered ? [] : new LocalCollection._IdMap(); // fast path for single ID value              // 366
                                                                                                                       //
      if (this._selectorId !== undefined) {                                                                            // 369
        // If you have non-zero skip and ask for a single id, you get                                                  // 370
        // nothing. This is so it matches the behavior of the '{_id: foo}'                                             // 371
        // path.                                                                                                       // 372
        if (this.skip) {                                                                                               // 373
          return results;                                                                                              // 374
        }                                                                                                              // 375
                                                                                                                       //
        var selectedDoc = this.collection._docs.get(this._selectorId);                                                 // 377
                                                                                                                       //
        if (selectedDoc) {                                                                                             // 379
          if (options.ordered) {                                                                                       // 380
            results.push(selectedDoc);                                                                                 // 381
          } else {                                                                                                     // 382
            results.set(this._selectorId, selectedDoc);                                                                // 383
          }                                                                                                            // 384
        }                                                                                                              // 385
                                                                                                                       //
        return results;                                                                                                // 387
      } // slow path for arbitrary selector, sort, skip, limit                                                         // 388
      // in the observeChanges case, distances is actually part of the "query"                                         // 392
      // (ie, live results set) object.  in other cases, distances is only used                                        // 393
      // inside this function.                                                                                         // 394
                                                                                                                       //
                                                                                                                       //
      var distances = void 0;                                                                                          // 395
                                                                                                                       //
      if (this.matcher.hasGeoQuery() && options.ordered) {                                                             // 396
        if (options.distances) {                                                                                       // 397
          distances = options.distances;                                                                               // 398
          distances.clear();                                                                                           // 399
        } else {                                                                                                       // 400
          distances = new LocalCollection._IdMap();                                                                    // 401
        }                                                                                                              // 402
      }                                                                                                                // 403
                                                                                                                       //
      this.collection._docs.forEach(function (doc, id) {                                                               // 405
        var matchResult = _this5.matcher.documentMatches(doc);                                                         // 406
                                                                                                                       //
        if (matchResult.result) {                                                                                      // 408
          if (options.ordered) {                                                                                       // 409
            results.push(doc);                                                                                         // 410
                                                                                                                       //
            if (distances && matchResult.distance !== undefined) {                                                     // 412
              distances.set(id, matchResult.distance);                                                                 // 413
            }                                                                                                          // 414
          } else {                                                                                                     // 415
            results.set(id, doc);                                                                                      // 416
          }                                                                                                            // 417
        } // Fast path for limited unsorted queries.                                                                   // 418
        // XXX 'length' check here seems wrong for ordered                                                             // 421
                                                                                                                       //
                                                                                                                       //
        return !_this5.limit || _this5.skip || _this5.sorter || results.length !== _this5.limit;                       // 422
      });                                                                                                              // 428
                                                                                                                       //
      if (!options.ordered) {                                                                                          // 430
        return results;                                                                                                // 431
      }                                                                                                                // 432
                                                                                                                       //
      if (this.sorter) {                                                                                               // 434
        results.sort(this.sorter.getComparator({                                                                       // 435
          distances: distances                                                                                         // 435
        }));                                                                                                           // 435
      }                                                                                                                // 436
                                                                                                                       //
      if (!this.limit && !this.skip) {                                                                                 // 438
        return results;                                                                                                // 439
      }                                                                                                                // 440
                                                                                                                       //
      return results.slice(this.skip, this.limit ? this.limit + this.skip : results.length);                           // 442
    }                                                                                                                  // 446
                                                                                                                       //
    return _getRawObjects;                                                                                             //
  }();                                                                                                                 //
                                                                                                                       //
  Cursor.prototype._publishCursor = function () {                                                                      //
    function _publishCursor(subscription) {                                                                            //
      // XXX minimongo should not depend on mongo-livedata!                                                            // 449
      if (!Package.mongo) {                                                                                            // 450
        throw new Error('Can\'t publish from Minimongo without the `mongo` package.');                                 // 451
      }                                                                                                                // 454
                                                                                                                       //
      if (!this.collection.name) {                                                                                     // 456
        throw new Error('Can\'t publish a cursor from a collection without a name.');                                  // 457
      }                                                                                                                // 460
                                                                                                                       //
      return Package.mongo.Mongo.Collection._publishCursor(this, subscription, this.collection.name);                  // 462
    }                                                                                                                  // 467
                                                                                                                       //
    return _publishCursor;                                                                                             //
  }();                                                                                                                 //
                                                                                                                       //
  return Cursor;                                                                                                       //
}();                                                                                                                   //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"local_collection.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/local_collection.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");                                          //
                                                                                                                       //
var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);                                                 //
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");                          //
                                                                                                                       //
var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);                                 //
                                                                                                                       //
var _inherits2 = require("babel-runtime/helpers/inherits");                                                            //
                                                                                                                       //
var _inherits3 = _interopRequireDefault(_inherits2);                                                                   //
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  "default": function () {                                                                                             // 1
    return LocalCollection;                                                                                            // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var Cursor = void 0;                                                                                                   // 1
module.watch(require("./cursor.js"), {                                                                                 // 1
  "default": function (v) {                                                                                            // 1
    Cursor = v;                                                                                                        // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var ObserveHandle = void 0;                                                                                            // 1
module.watch(require("./observe_handle.js"), {                                                                         // 1
  "default": function (v) {                                                                                            // 1
    ObserveHandle = v;                                                                                                 // 1
  }                                                                                                                    // 1
}, 1);                                                                                                                 // 1
var hasOwn = void 0,                                                                                                   // 1
    isIndexable = void 0,                                                                                              // 1
    isNumericKey = void 0,                                                                                             // 1
    isOperatorObject = void 0,                                                                                         // 1
    populateDocumentWithQueryFields = void 0,                                                                          // 1
    projectionDetails = void 0;                                                                                        // 1
module.watch(require("./common.js"), {                                                                                 // 1
  hasOwn: function (v) {                                                                                               // 1
    hasOwn = v;                                                                                                        // 1
  },                                                                                                                   // 1
  isIndexable: function (v) {                                                                                          // 1
    isIndexable = v;                                                                                                   // 1
  },                                                                                                                   // 1
  isNumericKey: function (v) {                                                                                         // 1
    isNumericKey = v;                                                                                                  // 1
  },                                                                                                                   // 1
  isOperatorObject: function (v) {                                                                                     // 1
    isOperatorObject = v;                                                                                              // 1
  },                                                                                                                   // 1
  populateDocumentWithQueryFields: function (v) {                                                                      // 1
    populateDocumentWithQueryFields = v;                                                                               // 1
  },                                                                                                                   // 1
  projectionDetails: function (v) {                                                                                    // 1
    projectionDetails = v;                                                                                             // 1
  }                                                                                                                    // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
var LocalCollection = function () {                                                                                    //
  function LocalCollection(name) {                                                                                     // 16
    (0, _classCallCheck3.default)(this, LocalCollection);                                                              // 16
    this.name = name; // _id -> document (also containing id)                                                          // 17
                                                                                                                       //
    this._docs = new LocalCollection._IdMap();                                                                         // 19
    this._observeQueue = new Meteor._SynchronousQueue();                                                               // 21
    this.next_qid = 1; // live query id generator                                                                      // 23
    // qid -> live query object. keys:                                                                                 // 25
    //  ordered: bool. ordered queries have addedBefore/movedBefore callbacks.                                         // 26
    //  results: array (ordered) or object (unordered) of current results                                              // 27
    //    (aliased with this._docs!)                                                                                   // 28
    //  resultsSnapshot: snapshot of results. null if not paused.                                                      // 29
    //  cursor: Cursor object for the query.                                                                           // 30
    //  selector, sorter, (callbacks): functions                                                                       // 31
                                                                                                                       //
    this.queries = Object.create(null); // null if not saving originals; an IdMap from id to original document value   // 32
    // if saving originals. See comments before saveOriginals().                                                       // 35
                                                                                                                       //
    this._savedOriginals = null; // True when observers are paused and we should not send callbacks.                   // 36
                                                                                                                       //
    this.paused = false;                                                                                               // 39
  } // options may include sort, skip, limit, reactive                                                                 // 40
  // sort may be any of these forms:                                                                                   // 43
  //     {a: 1, b: -1}                                                                                                 // 44
  //     [["a", "asc"], ["b", "desc"]]                                                                                 // 45
  //     ["a", ["b", "desc"]]                                                                                          // 46
  //   (in the first form you're beholden to key enumeration order in                                                  // 47
  //   your javascript VM)                                                                                             // 48
  //                                                                                                                   // 49
  // reactive: if given, and false, don't register with Tracker (default                                               // 50
  // is true)                                                                                                          // 51
  //                                                                                                                   // 52
  // XXX possibly should support retrieving a subset of fields? and                                                    // 53
  // have it be a hint (ignored on the client, when not copying the                                                    // 54
  // doc?)                                                                                                             // 55
  //                                                                                                                   // 56
  // XXX sort does not yet support subkeys ('a.b') .. fix that!                                                        // 57
  // XXX add one more sort form: "key"                                                                                 // 58
  // XXX tests                                                                                                         // 59
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.find = function () {                                                                       //
    function find(selector, options) {                                                                                 //
      // default syntax for everything is to omit the selector argument.                                               // 61
      // but if selector is explicitly passed in as false or undefined, we                                             // 62
      // want a selector that matches nothing.                                                                         // 63
      if (arguments.length === 0) {                                                                                    // 64
        selector = {};                                                                                                 // 65
      }                                                                                                                // 66
                                                                                                                       //
      return new LocalCollection.Cursor(this, selector, options);                                                      // 68
    }                                                                                                                  // 69
                                                                                                                       //
    return find;                                                                                                       //
  }();                                                                                                                 //
                                                                                                                       //
  LocalCollection.prototype.findOne = function () {                                                                    //
    function findOne(selector) {                                                                                       //
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                            // 71
                                                                                                                       //
      if (arguments.length === 0) {                                                                                    // 72
        selector = {};                                                                                                 // 73
      } // NOTE: by setting limit 1 here, we end up using very inefficient                                             // 74
      // code that recomputes the whole query on each update. The upside is                                            // 77
      // that when you reactively depend on a findOne you only get                                                     // 78
      // invalidated when the found object changes, not any object in the                                              // 79
      // collection. Most findOne will be by id, which has a fast path, so                                             // 80
      // this might not be a big deal. In most cases, invalidation causes                                              // 81
      // the called to re-query anyway, so this should be a net performance                                            // 82
      // improvement.                                                                                                  // 83
                                                                                                                       //
                                                                                                                       //
      options.limit = 1;                                                                                               // 84
      return this.find(selector, options).fetch()[0];                                                                  // 86
    }                                                                                                                  // 87
                                                                                                                       //
    return findOne;                                                                                                    //
  }(); // XXX possibly enforce that 'undefined' does not appear (we assume                                             //
  // this in our handling of null and $exists)                                                                         // 90
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.insert = function () {                                                                     //
    function insert(doc, callback) {                                                                                   //
      var _this = this;                                                                                                // 91
                                                                                                                       //
      doc = EJSON.clone(doc);                                                                                          // 92
      assertHasValidFieldNames(doc); // if you really want to use ObjectIDs, set this global.                          // 94
      // Mongo.Collection specifies its own ids and does not use this code.                                            // 97
                                                                                                                       //
      if (!hasOwn.call(doc, '_id')) {                                                                                  // 98
        doc._id = LocalCollection._useOID ? new MongoID.ObjectID() : Random.id();                                      // 99
      }                                                                                                                // 100
                                                                                                                       //
      var id = doc._id;                                                                                                // 102
                                                                                                                       //
      if (this._docs.has(id)) {                                                                                        // 104
        throw MinimongoError("Duplicate _id '" + id + "'");                                                            // 105
      }                                                                                                                // 106
                                                                                                                       //
      this._saveOriginal(id, undefined);                                                                               // 108
                                                                                                                       //
      this._docs.set(id, doc);                                                                                         // 109
                                                                                                                       //
      var queriesToRecompute = []; // trigger live queries that match                                                  // 111
                                                                                                                       //
      Object.keys(this.queries).forEach(function (qid) {                                                               // 114
        var query = _this.queries[qid];                                                                                // 115
                                                                                                                       //
        if (query.dirty) {                                                                                             // 117
          return;                                                                                                      // 118
        }                                                                                                              // 119
                                                                                                                       //
        var matchResult = query.matcher.documentMatches(doc);                                                          // 121
                                                                                                                       //
        if (matchResult.result) {                                                                                      // 123
          if (query.distances && matchResult.distance !== undefined) {                                                 // 124
            query.distances.set(id, matchResult.distance);                                                             // 125
          }                                                                                                            // 126
                                                                                                                       //
          if (query.cursor.skip || query.cursor.limit) {                                                               // 128
            queriesToRecompute.push(qid);                                                                              // 129
          } else {                                                                                                     // 130
            LocalCollection._insertInResults(query, doc);                                                              // 131
          }                                                                                                            // 132
        }                                                                                                              // 133
      });                                                                                                              // 134
      queriesToRecompute.forEach(function (qid) {                                                                      // 136
        if (_this.queries[qid]) {                                                                                      // 137
          _this._recomputeResults(_this.queries[qid]);                                                                 // 138
        }                                                                                                              // 139
      });                                                                                                              // 140
                                                                                                                       //
      this._observeQueue.drain(); // Defer because the caller likely doesn't expect the callback to be run             // 142
      // immediately.                                                                                                  // 145
                                                                                                                       //
                                                                                                                       //
      if (callback) {                                                                                                  // 146
        Meteor.defer(function () {                                                                                     // 147
          callback(null, id);                                                                                          // 148
        });                                                                                                            // 149
      }                                                                                                                // 150
                                                                                                                       //
      return id;                                                                                                       // 152
    }                                                                                                                  // 153
                                                                                                                       //
    return insert;                                                                                                     //
  }(); // Pause the observers. No callbacks from observers will fire until                                             //
  // 'resumeObservers' is called.                                                                                      // 156
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.pauseObservers = function () {                                                             //
    function pauseObservers() {                                                                                        //
      var _this2 = this;                                                                                               // 157
                                                                                                                       //
      // No-op if already paused.                                                                                      // 158
      if (this.paused) {                                                                                               // 159
        return;                                                                                                        // 160
      } // Set the 'paused' flag such that new observer messages don't fire.                                           // 161
                                                                                                                       //
                                                                                                                       //
      this.paused = true; // Take a snapshot of the query results for each query.                                      // 164
                                                                                                                       //
      Object.keys(this.queries).forEach(function (qid) {                                                               // 167
        var query = _this2.queries[qid];                                                                               // 168
        query.resultsSnapshot = EJSON.clone(query.results);                                                            // 169
      });                                                                                                              // 170
    }                                                                                                                  // 171
                                                                                                                       //
    return pauseObservers;                                                                                             //
  }();                                                                                                                 //
                                                                                                                       //
  LocalCollection.prototype.remove = function () {                                                                     //
    function remove(selector, callback) {                                                                              //
      var _this3 = this;                                                                                               // 173
                                                                                                                       //
      // Easy special case: if we're not calling observeChanges callbacks and                                          // 174
      // we're not saving originals and we got asked to remove everything, then                                        // 175
      // just empty everything directly.                                                                               // 176
      if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {                                        // 177
        var _result = this._docs.size();                                                                               // 178
                                                                                                                       //
        this._docs.clear();                                                                                            // 180
                                                                                                                       //
        Object.keys(this.queries).forEach(function (qid) {                                                             // 182
          var query = _this3.queries[qid];                                                                             // 183
                                                                                                                       //
          if (query.ordered) {                                                                                         // 185
            query.results = [];                                                                                        // 186
          } else {                                                                                                     // 187
            query.results.clear();                                                                                     // 188
          }                                                                                                            // 189
        });                                                                                                            // 190
                                                                                                                       //
        if (callback) {                                                                                                // 192
          Meteor.defer(function () {                                                                                   // 193
            callback(null, _result);                                                                                   // 194
          });                                                                                                          // 195
        }                                                                                                              // 196
                                                                                                                       //
        return _result;                                                                                                // 198
      }                                                                                                                // 199
                                                                                                                       //
      var matcher = new Minimongo.Matcher(selector);                                                                   // 201
      var remove = [];                                                                                                 // 202
                                                                                                                       //
      this._eachPossiblyMatchingDoc(selector, function (doc, id) {                                                     // 204
        if (matcher.documentMatches(doc).result) {                                                                     // 205
          remove.push(id);                                                                                             // 206
        }                                                                                                              // 207
      });                                                                                                              // 208
                                                                                                                       //
      var queriesToRecompute = [];                                                                                     // 210
      var queryRemove = [];                                                                                            // 211
                                                                                                                       //
      var _loop = function (i) {                                                                                       // 173
        var removeId = remove[i];                                                                                      // 214
                                                                                                                       //
        var removeDoc = _this3._docs.get(removeId);                                                                    // 215
                                                                                                                       //
        Object.keys(_this3.queries).forEach(function (qid) {                                                           // 217
          var query = _this3.queries[qid];                                                                             // 218
                                                                                                                       //
          if (query.dirty) {                                                                                           // 220
            return;                                                                                                    // 221
          }                                                                                                            // 222
                                                                                                                       //
          if (query.matcher.documentMatches(removeDoc).result) {                                                       // 224
            if (query.cursor.skip || query.cursor.limit) {                                                             // 225
              queriesToRecompute.push(qid);                                                                            // 226
            } else {                                                                                                   // 227
              queryRemove.push({                                                                                       // 228
                qid: qid,                                                                                              // 228
                doc: removeDoc                                                                                         // 228
              });                                                                                                      // 228
            }                                                                                                          // 229
          }                                                                                                            // 230
        });                                                                                                            // 231
                                                                                                                       //
        _this3._saveOriginal(removeId, removeDoc);                                                                     // 233
                                                                                                                       //
        _this3._docs.remove(removeId);                                                                                 // 234
      };                                                                                                               // 173
                                                                                                                       //
      for (var i = 0; i < remove.length; i++) {                                                                        // 213
        _loop(i);                                                                                                      // 213
      } // run live query callbacks _after_ we've removed the documents.                                               // 235
                                                                                                                       //
                                                                                                                       //
      queryRemove.forEach(function (remove) {                                                                          // 238
        var query = _this3.queries[remove.qid];                                                                        // 239
                                                                                                                       //
        if (query) {                                                                                                   // 241
          query.distances && query.distances.remove(remove.doc._id);                                                   // 242
                                                                                                                       //
          LocalCollection._removeFromResults(query, remove.doc);                                                       // 243
        }                                                                                                              // 244
      });                                                                                                              // 245
      queriesToRecompute.forEach(function (qid) {                                                                      // 247
        var query = _this3.queries[qid];                                                                               // 248
                                                                                                                       //
        if (query) {                                                                                                   // 250
          _this3._recomputeResults(query);                                                                             // 251
        }                                                                                                              // 252
      });                                                                                                              // 253
                                                                                                                       //
      this._observeQueue.drain();                                                                                      // 255
                                                                                                                       //
      var result = remove.length;                                                                                      // 257
                                                                                                                       //
      if (callback) {                                                                                                  // 259
        Meteor.defer(function () {                                                                                     // 260
          callback(null, result);                                                                                      // 261
        });                                                                                                            // 262
      }                                                                                                                // 263
                                                                                                                       //
      return result;                                                                                                   // 265
    }                                                                                                                  // 266
                                                                                                                       //
    return remove;                                                                                                     //
  }(); // Resume the observers. Observers immediately receive change                                                   //
  // notifications to bring them to the current state of the                                                           // 269
  // database. Note that this is not just replaying all the changes that                                               // 270
  // happened during the pause, it is a smarter 'coalesced' diff.                                                      // 271
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.resumeObservers = function () {                                                            //
    function resumeObservers() {                                                                                       //
      var _this4 = this;                                                                                               // 272
                                                                                                                       //
      // No-op if not paused.                                                                                          // 273
      if (!this.paused) {                                                                                              // 274
        return;                                                                                                        // 275
      } // Unset the 'paused' flag. Make sure to do this first, otherwise                                              // 276
      // observer methods won't actually fire when we trigger them.                                                    // 279
                                                                                                                       //
                                                                                                                       //
      this.paused = false;                                                                                             // 280
      Object.keys(this.queries).forEach(function (qid) {                                                               // 282
        var query = _this4.queries[qid];                                                                               // 283
                                                                                                                       //
        if (query.dirty) {                                                                                             // 285
          query.dirty = false; // re-compute results will perform `LocalCollection._diffQueryChanges`                  // 286
          // automatically.                                                                                            // 289
                                                                                                                       //
          _this4._recomputeResults(query, query.resultsSnapshot);                                                      // 290
        } else {                                                                                                       // 291
          // Diff the current results against the snapshot and send to observers.                                      // 292
          // pass the query object for its observer callbacks.                                                         // 293
          LocalCollection._diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query, {              // 294
            projectionFn: query.projectionFn                                                                           // 299
          });                                                                                                          // 299
        }                                                                                                              // 301
                                                                                                                       //
        query.resultsSnapshot = null;                                                                                  // 303
      });                                                                                                              // 304
                                                                                                                       //
      this._observeQueue.drain();                                                                                      // 306
    }                                                                                                                  // 307
                                                                                                                       //
    return resumeObservers;                                                                                            //
  }();                                                                                                                 //
                                                                                                                       //
  LocalCollection.prototype.retrieveOriginals = function () {                                                          //
    function retrieveOriginals() {                                                                                     //
      if (!this._savedOriginals) {                                                                                     // 310
        throw new Error('Called retrieveOriginals without saveOriginals');                                             // 311
      }                                                                                                                // 312
                                                                                                                       //
      var originals = this._savedOriginals;                                                                            // 314
      this._savedOriginals = null;                                                                                     // 316
      return originals;                                                                                                // 318
    }                                                                                                                  // 319
                                                                                                                       //
    return retrieveOriginals;                                                                                          //
  }(); // To track what documents are affected by a piece of code, call                                                //
  // saveOriginals() before it and retrieveOriginals() after it.                                                       // 322
  // retrieveOriginals returns an object whose keys are the ids of the documents                                       // 323
  // that were affected since the call to saveOriginals(), and the values are                                          // 324
  // equal to the document's contents at the time of saveOriginals. (In the case                                       // 325
  // of an inserted document, undefined is the value.) You must alternate                                              // 326
  // between calls to saveOriginals() and retrieveOriginals().                                                         // 327
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.saveOriginals = function () {                                                              //
    function saveOriginals() {                                                                                         //
      if (this._savedOriginals) {                                                                                      // 329
        throw new Error('Called saveOriginals twice without retrieveOriginals');                                       // 330
      }                                                                                                                // 331
                                                                                                                       //
      this._savedOriginals = new LocalCollection._IdMap();                                                             // 333
    }                                                                                                                  // 334
                                                                                                                       //
    return saveOriginals;                                                                                              //
  }(); // XXX atomicity: if multi is true, and one modification fails, do                                              //
  // we rollback the whole operation, or what?                                                                         // 337
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.update = function () {                                                                     //
    function update(selector, mod, options, callback) {                                                                //
      var _this5 = this;                                                                                               // 338
                                                                                                                       //
      if (!callback && options instanceof Function) {                                                                  // 339
        callback = options;                                                                                            // 340
        options = null;                                                                                                // 341
      }                                                                                                                // 342
                                                                                                                       //
      if (!options) {                                                                                                  // 344
        options = {};                                                                                                  // 345
      }                                                                                                                // 346
                                                                                                                       //
      var matcher = new Minimongo.Matcher(selector, true); // Save the original results of any query that we might need to
      // _recomputeResults on, because _modifyAndNotify will mutate the objects in                                     // 351
      // it. (We don't need to save the original results of paused queries because                                     // 352
      // they already have a resultsSnapshot and we won't be diffing in                                                // 353
      // _recomputeResults.)                                                                                           // 354
                                                                                                                       //
      var qidToOriginalResults = {}; // We should only clone each document once, even if it appears in multiple        // 355
      // queries                                                                                                       // 358
                                                                                                                       //
      var docMap = new LocalCollection._IdMap();                                                                       // 359
                                                                                                                       //
      var idsMatched = LocalCollection._idsMatchedBySelector(selector);                                                // 360
                                                                                                                       //
      Object.keys(this.queries).forEach(function (qid) {                                                               // 362
        var query = _this5.queries[qid];                                                                               // 363
                                                                                                                       //
        if ((query.cursor.skip || query.cursor.limit) && !_this5.paused) {                                             // 365
          // Catch the case of a reactive `count()` on a cursor with skip                                              // 366
          // or limit, which registers an unordered observe. This is a                                                 // 367
          // pretty rare case, so we just clone the entire result set with                                             // 368
          // no optimizations for documents that appear in these result                                                // 369
          // sets and other queries.                                                                                   // 370
          if (query.results instanceof LocalCollection._IdMap) {                                                       // 371
            qidToOriginalResults[qid] = query.results.clone();                                                         // 372
            return;                                                                                                    // 373
          }                                                                                                            // 374
                                                                                                                       //
          if (!(query.results instanceof Array)) {                                                                     // 376
            throw new Error('Assertion failed: query.results not an array');                                           // 377
          } // Clones a document to be stored in `qidToOriginalResults`                                                // 378
          // because it may be modified before the new and old result sets                                             // 381
          // are diffed. But if we know exactly which document IDs we're                                               // 382
          // going to modify, then we only need to clone those.                                                        // 383
                                                                                                                       //
                                                                                                                       //
          var memoizedCloneIfNeeded = function (doc) {                                                                 // 384
            if (docMap.has(doc._id)) {                                                                                 // 385
              return docMap.get(doc._id);                                                                              // 386
            }                                                                                                          // 387
                                                                                                                       //
            var docToMemoize = idsMatched && !idsMatched.some(function (id) {                                          // 389
              return EJSON.equals(id, doc._id);                                                                        // 391
            }) ? doc : EJSON.clone(doc);                                                                               // 391
            docMap.set(doc._id, docToMemoize);                                                                         // 394
            return docToMemoize;                                                                                       // 396
          };                                                                                                           // 397
                                                                                                                       //
          qidToOriginalResults[qid] = query.results.map(memoizedCloneIfNeeded);                                        // 399
        }                                                                                                              // 400
      });                                                                                                              // 401
      var recomputeQids = {};                                                                                          // 403
      var updateCount = 0;                                                                                             // 405
                                                                                                                       //
      this._eachPossiblyMatchingDoc(selector, function (doc, id) {                                                     // 407
        var queryResult = matcher.documentMatches(doc);                                                                // 408
                                                                                                                       //
        if (queryResult.result) {                                                                                      // 410
          // XXX Should we save the original even if mod ends up being a no-op?                                        // 411
          _this5._saveOriginal(id, doc);                                                                               // 412
                                                                                                                       //
          _this5._modifyAndNotify(doc, mod, recomputeQids, queryResult.arrayIndices);                                  // 413
                                                                                                                       //
          ++updateCount;                                                                                               // 420
                                                                                                                       //
          if (!options.multi) {                                                                                        // 422
            return false; // break                                                                                     // 423
          }                                                                                                            // 424
        }                                                                                                              // 425
                                                                                                                       //
        return true;                                                                                                   // 427
      });                                                                                                              // 428
                                                                                                                       //
      Object.keys(recomputeQids).forEach(function (qid) {                                                              // 430
        var query = _this5.queries[qid];                                                                               // 431
                                                                                                                       //
        if (query) {                                                                                                   // 433
          _this5._recomputeResults(query, qidToOriginalResults[qid]);                                                  // 434
        }                                                                                                              // 435
      });                                                                                                              // 436
                                                                                                                       //
      this._observeQueue.drain(); // If we are doing an upsert, and we didn't modify any documents yet, then           // 438
      // it's time to do an insert. Figure out what document we are inserting, and                                     // 441
      // generate an id for it.                                                                                        // 442
                                                                                                                       //
                                                                                                                       //
      var insertedId = void 0;                                                                                         // 443
                                                                                                                       //
      if (updateCount === 0 && options.upsert) {                                                                       // 444
        var doc = LocalCollection._createUpsertDocument(selector, mod);                                                // 445
                                                                                                                       //
        if (!doc._id && options.insertedId) {                                                                          // 446
          doc._id = options.insertedId;                                                                                // 447
        }                                                                                                              // 448
                                                                                                                       //
        insertedId = this.insert(doc);                                                                                 // 450
        updateCount = 1;                                                                                               // 451
      } // Return the number of affected documents, or in the upsert case, an object                                   // 452
      // containing the number of affected docs and the id of the doc that was                                         // 455
      // inserted, if any.                                                                                             // 456
                                                                                                                       //
                                                                                                                       //
      var result = void 0;                                                                                             // 457
                                                                                                                       //
      if (options._returnObject) {                                                                                     // 458
        result = {                                                                                                     // 459
          numberAffected: updateCount                                                                                  // 459
        };                                                                                                             // 459
                                                                                                                       //
        if (insertedId !== undefined) {                                                                                // 461
          result.insertedId = insertedId;                                                                              // 462
        }                                                                                                              // 463
      } else {                                                                                                         // 464
        result = updateCount;                                                                                          // 465
      }                                                                                                                // 466
                                                                                                                       //
      if (callback) {                                                                                                  // 468
        Meteor.defer(function () {                                                                                     // 469
          callback(null, result);                                                                                      // 470
        });                                                                                                            // 471
      }                                                                                                                // 472
                                                                                                                       //
      return result;                                                                                                   // 474
    }                                                                                                                  // 475
                                                                                                                       //
    return update;                                                                                                     //
  }(); // A convenience wrapper on update. LocalCollection.upsert(sel, mod) is                                         //
  // equivalent to LocalCollection.update(sel, mod, {upsert: true,                                                     // 478
  // _returnObject: true}).                                                                                            // 479
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype.upsert = function () {                                                                     //
    function upsert(selector, mod, options, callback) {                                                                //
      if (!callback && typeof options === 'function') {                                                                // 481
        callback = options;                                                                                            // 482
        options = {};                                                                                                  // 483
      }                                                                                                                // 484
                                                                                                                       //
      return this.update(selector, mod, Object.assign({}, options, {                                                   // 486
        upsert: true,                                                                                                  // 489
        _returnObject: true                                                                                            // 489
      }), callback);                                                                                                   // 489
    }                                                                                                                  // 492
                                                                                                                       //
    return upsert;                                                                                                     //
  }(); // Iterates over a subset of documents that could match selector; calls                                         //
  // fn(doc, id) on each of them.  Specifically, if selector specifies                                                 // 495
  // specific _id's, it only looks at those.  doc is *not* cloned: it is the                                           // 496
  // same object that is in _docs.                                                                                     // 497
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype._eachPossiblyMatchingDoc = function () {                                                   //
    function _eachPossiblyMatchingDoc(selector, fn) {                                                                  //
      var _this6 = this;                                                                                               // 498
                                                                                                                       //
      var specificIds = LocalCollection._idsMatchedBySelector(selector);                                               // 499
                                                                                                                       //
      if (specificIds) {                                                                                               // 501
        specificIds.some(function (id) {                                                                               // 502
          var doc = _this6._docs.get(id);                                                                              // 503
                                                                                                                       //
          if (doc) {                                                                                                   // 505
            return fn(doc, id) === false;                                                                              // 506
          }                                                                                                            // 507
        });                                                                                                            // 508
      } else {                                                                                                         // 509
        this._docs.forEach(fn);                                                                                        // 510
      }                                                                                                                // 511
    }                                                                                                                  // 512
                                                                                                                       //
    return _eachPossiblyMatchingDoc;                                                                                   //
  }();                                                                                                                 //
                                                                                                                       //
  LocalCollection.prototype._modifyAndNotify = function () {                                                           //
    function _modifyAndNotify(doc, mod, recomputeQids, arrayIndices) {                                                 //
      var _this7 = this;                                                                                               // 514
                                                                                                                       //
      var matched_before = {};                                                                                         // 515
      Object.keys(this.queries).forEach(function (qid) {                                                               // 517
        var query = _this7.queries[qid];                                                                               // 518
                                                                                                                       //
        if (query.dirty) {                                                                                             // 520
          return;                                                                                                      // 521
        }                                                                                                              // 522
                                                                                                                       //
        if (query.ordered) {                                                                                           // 524
          matched_before[qid] = query.matcher.documentMatches(doc).result;                                             // 525
        } else {                                                                                                       // 526
          // Because we don't support skip or limit (yet) in unordered queries, we                                     // 527
          // can just do a direct lookup.                                                                              // 528
          matched_before[qid] = query.results.has(doc._id);                                                            // 529
        }                                                                                                              // 530
      });                                                                                                              // 531
      var old_doc = EJSON.clone(doc);                                                                                  // 533
                                                                                                                       //
      LocalCollection._modify(doc, mod, {                                                                              // 535
        arrayIndices: arrayIndices                                                                                     // 535
      });                                                                                                              // 535
                                                                                                                       //
      Object.keys(this.queries).forEach(function (qid) {                                                               // 537
        var query = _this7.queries[qid];                                                                               // 538
                                                                                                                       //
        if (query.dirty) {                                                                                             // 540
          return;                                                                                                      // 541
        }                                                                                                              // 542
                                                                                                                       //
        var afterMatch = query.matcher.documentMatches(doc);                                                           // 544
        var after = afterMatch.result;                                                                                 // 545
        var before = matched_before[qid];                                                                              // 546
                                                                                                                       //
        if (after && query.distances && afterMatch.distance !== undefined) {                                           // 548
          query.distances.set(doc._id, afterMatch.distance);                                                           // 549
        }                                                                                                              // 550
                                                                                                                       //
        if (query.cursor.skip || query.cursor.limit) {                                                                 // 552
          // We need to recompute any query where the doc may have been in the                                         // 553
          // cursor's window either before or after the update. (Note that if skip                                     // 554
          // or limit is set, "before" and "after" being true do not necessarily                                       // 555
          // mean that the document is in the cursor's output after skip/limit is                                      // 556
          // applied... but if they are false, then the document definitely is NOT                                     // 557
          // in the output. So it's safe to skip recompute if neither before or                                        // 558
          // after are true.)                                                                                          // 559
          if (before || after) {                                                                                       // 560
            recomputeQids[qid] = true;                                                                                 // 561
          }                                                                                                            // 562
        } else if (before && !after) {                                                                                 // 563
          LocalCollection._removeFromResults(query, doc);                                                              // 564
        } else if (!before && after) {                                                                                 // 565
          LocalCollection._insertInResults(query, doc);                                                                // 566
        } else if (before && after) {                                                                                  // 567
          LocalCollection._updateInResults(query, doc, old_doc);                                                       // 568
        }                                                                                                              // 569
      });                                                                                                              // 570
    }                                                                                                                  // 571
                                                                                                                       //
    return _modifyAndNotify;                                                                                           //
  }(); // Recomputes the results of a query and runs observe callbacks for the                                         //
  // difference between the previous results and the current results (unless                                           // 574
  // paused). Used for skip/limit queries.                                                                             // 575
  //                                                                                                                   // 576
  // When this is used by insert or remove, it can just use query.results for                                          // 577
  // the old results (and there's no need to pass in oldResults), because these                                        // 578
  // operations don't mutate the documents in the collection. Update needs to                                          // 579
  // pass in an oldResults which was deep-copied before the modifier was                                               // 580
  // applied.                                                                                                          // 581
  //                                                                                                                   // 582
  // oldResults is guaranteed to be ignored if the query is not paused.                                                // 583
                                                                                                                       //
                                                                                                                       //
  LocalCollection.prototype._recomputeResults = function () {                                                          //
    function _recomputeResults(query, oldResults) {                                                                    //
      if (this.paused) {                                                                                               // 585
        // There's no reason to recompute the results now as we're still paused.                                       // 586
        // By flagging the query as "dirty", the recompute will be performed                                           // 587
        // when resumeObservers is called.                                                                             // 588
        query.dirty = true;                                                                                            // 589
        return;                                                                                                        // 590
      }                                                                                                                // 591
                                                                                                                       //
      if (!this.paused && !oldResults) {                                                                               // 593
        oldResults = query.results;                                                                                    // 594
      }                                                                                                                // 595
                                                                                                                       //
      if (query.distances) {                                                                                           // 597
        query.distances.clear();                                                                                       // 598
      }                                                                                                                // 599
                                                                                                                       //
      query.results = query.cursor._getRawObjects({                                                                    // 601
        distances: query.distances,                                                                                    // 602
        ordered: query.ordered                                                                                         // 603
      });                                                                                                              // 601
                                                                                                                       //
      if (!this.paused) {                                                                                              // 606
        LocalCollection._diffQueryChanges(query.ordered, oldResults, query.results, query, {                           // 607
          projectionFn: query.projectionFn                                                                             // 612
        });                                                                                                            // 612
      }                                                                                                                // 614
    }                                                                                                                  // 615
                                                                                                                       //
    return _recomputeResults;                                                                                          //
  }();                                                                                                                 //
                                                                                                                       //
  LocalCollection.prototype._saveOriginal = function () {                                                              //
    function _saveOriginal(id, doc) {                                                                                  //
      // Are we even trying to save originals?                                                                         // 618
      if (!this._savedOriginals) {                                                                                     // 619
        return;                                                                                                        // 620
      } // Have we previously mutated the original (and so 'doc' is not actually                                       // 621
      // original)?  (Note the 'has' check rather than truth: we store undefined                                       // 624
      // here for inserted docs!)                                                                                      // 625
                                                                                                                       //
                                                                                                                       //
      if (this._savedOriginals.has(id)) {                                                                              // 626
        return;                                                                                                        // 627
      }                                                                                                                // 628
                                                                                                                       //
      this._savedOriginals.set(id, EJSON.clone(doc));                                                                  // 630
    }                                                                                                                  // 631
                                                                                                                       //
    return _saveOriginal;                                                                                              //
  }();                                                                                                                 //
                                                                                                                       //
  return LocalCollection;                                                                                              //
}();                                                                                                                   //
                                                                                                                       //
LocalCollection.Cursor = Cursor;                                                                                       // 634
LocalCollection.ObserveHandle = ObserveHandle; // XXX maybe move these into another ObserveHelpers package or something
// _CachingChangeObserver is an object which receives observeChanges callbacks                                         // 640
// and keeps a cache of the current cursor state up to date in this.docs. Users                                        // 641
// of this class should read the docs field but not modify it. You should pass                                         // 642
// the "applyChange" field as the callbacks to the underlying observeChanges                                           // 643
// call. Optionally, you can specify your own observeChanges callbacks which are                                       // 644
// invoked immediately before the docs field is updated; this object is made                                           // 645
// available as `this` to those callbacks.                                                                             // 646
                                                                                                                       //
LocalCollection._CachingChangeObserver = function () {                                                                 // 647
  function _CachingChangeObserver() {                                                                                  // 648
    var _this8 = this;                                                                                                 // 648
                                                                                                                       //
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};                              // 648
    (0, _classCallCheck3.default)(this, _CachingChangeObserver);                                                       // 648
                                                                                                                       //
    var orderedFromCallbacks = options.callbacks && LocalCollection._observeChangesCallbacksAreOrdered(options.callbacks);
                                                                                                                       //
    if (hasOwn.call(options, 'ordered')) {                                                                             // 654
      this.ordered = options.ordered;                                                                                  // 655
                                                                                                                       //
      if (options.callbacks && options.ordered !== orderedFromCallbacks) {                                             // 657
        throw Error('ordered option doesn\'t match callbacks');                                                        // 658
      }                                                                                                                // 659
    } else if (options.callbacks) {                                                                                    // 660
      this.ordered = orderedFromCallbacks;                                                                             // 661
    } else {                                                                                                           // 662
      throw Error('must provide ordered or callbacks');                                                                // 663
    }                                                                                                                  // 664
                                                                                                                       //
    var callbacks = options.callbacks || {};                                                                           // 666
                                                                                                                       //
    if (this.ordered) {                                                                                                // 668
      this.docs = new OrderedDict(MongoID.idStringify);                                                                // 669
      this.applyChange = {                                                                                             // 670
        addedBefore: function (id, fields, before) {                                                                   // 671
          var doc = EJSON.clone(fields);                                                                               // 672
          doc._id = id;                                                                                                // 674
                                                                                                                       //
          if (callbacks.addedBefore) {                                                                                 // 676
            callbacks.addedBefore.call(_this8, id, fields, before);                                                    // 677
          } // This line triggers if we provide added with movedBefore.                                                // 678
                                                                                                                       //
                                                                                                                       //
          if (callbacks.added) {                                                                                       // 681
            callbacks.added.call(_this8, id, fields);                                                                  // 682
          } // XXX could `before` be a falsy ID?  Technically                                                          // 683
          // idStringify seems to allow for them -- though                                                             // 686
          // OrderedDict won't call stringify on a falsy arg.                                                          // 687
                                                                                                                       //
                                                                                                                       //
          _this8.docs.putBefore(id, doc, before || null);                                                              // 688
        },                                                                                                             // 689
        movedBefore: function (id, before) {                                                                           // 690
          var doc = _this8.docs.get(id);                                                                               // 691
                                                                                                                       //
          if (callbacks.movedBefore) {                                                                                 // 693
            callbacks.movedBefore.call(_this8, id, before);                                                            // 694
          }                                                                                                            // 695
                                                                                                                       //
          _this8.docs.moveBefore(id, before || null);                                                                  // 697
        }                                                                                                              // 698
      };                                                                                                               // 670
    } else {                                                                                                           // 700
      this.docs = new LocalCollection._IdMap();                                                                        // 701
      this.applyChange = {                                                                                             // 702
        added: function (id, fields) {                                                                                 // 703
          var doc = EJSON.clone(fields);                                                                               // 704
                                                                                                                       //
          if (callbacks.added) {                                                                                       // 706
            callbacks.added.call(_this8, id, fields);                                                                  // 707
          }                                                                                                            // 708
                                                                                                                       //
          doc._id = id;                                                                                                // 710
                                                                                                                       //
          _this8.docs.set(id, doc);                                                                                    // 712
        }                                                                                                              // 713
      };                                                                                                               // 702
    } // The methods in _IdMap and OrderedDict used by these callbacks are                                             // 715
    // identical.                                                                                                      // 718
                                                                                                                       //
                                                                                                                       //
    this.applyChange.changed = function (id, fields) {                                                                 // 719
      var doc = _this8.docs.get(id);                                                                                   // 720
                                                                                                                       //
      if (!doc) {                                                                                                      // 722
        throw new Error("Unknown id for changed: " + id);                                                              // 723
      }                                                                                                                // 724
                                                                                                                       //
      if (callbacks.changed) {                                                                                         // 726
        callbacks.changed.call(_this8, id, EJSON.clone(fields));                                                       // 727
      }                                                                                                                // 728
                                                                                                                       //
      DiffSequence.applyChanges(doc, fields);                                                                          // 730
    };                                                                                                                 // 731
                                                                                                                       //
    this.applyChange.removed = function (id) {                                                                         // 733
      if (callbacks.removed) {                                                                                         // 734
        callbacks.removed.call(_this8, id);                                                                            // 735
      }                                                                                                                // 736
                                                                                                                       //
      _this8.docs.remove(id);                                                                                          // 738
    };                                                                                                                 // 739
  }                                                                                                                    // 740
                                                                                                                       //
  return _CachingChangeObserver;                                                                                       // 647
}();                                                                                                                   // 647
                                                                                                                       //
LocalCollection._IdMap = function (_IdMap2) {                                                                          // 743
  (0, _inherits3.default)(_IdMap, _IdMap2);                                                                            // 743
                                                                                                                       //
  function _IdMap() {                                                                                                  // 744
    (0, _classCallCheck3.default)(this, _IdMap);                                                                       // 744
    return (0, _possibleConstructorReturn3.default)(this, _IdMap2.call(this, MongoID.idStringify, MongoID.idParse));   // 744
  }                                                                                                                    // 746
                                                                                                                       //
  return _IdMap;                                                                                                       // 743
}(IdMap); // Wrap a transform function to return objects that have the _id field                                       // 743
// of the untransformed document. This ensures that subsystems such as                                                 // 750
// the observe-sequence package that call `observe` can keep track of                                                  // 751
// the documents identities.                                                                                           // 752
//                                                                                                                     // 753
// - Require that it returns objects                                                                                   // 754
// - If the return value has an _id field, verify that it matches the                                                  // 755
//   original _id field                                                                                                // 756
// - If the return value doesn't have an _id field, add it back.                                                       // 757
                                                                                                                       //
                                                                                                                       //
LocalCollection.wrapTransform = function (transform) {                                                                 // 758
  if (!transform) {                                                                                                    // 759
    return null;                                                                                                       // 760
  } // No need to doubly-wrap transforms.                                                                              // 761
                                                                                                                       //
                                                                                                                       //
  if (transform.__wrappedTransform__) {                                                                                // 764
    return transform;                                                                                                  // 765
  }                                                                                                                    // 766
                                                                                                                       //
  var wrapped = function (doc) {                                                                                       // 768
    if (!hasOwn.call(doc, '_id')) {                                                                                    // 769
      // XXX do we ever have a transform on the oplog's collection? because that                                       // 770
      // collection has no _id.                                                                                        // 771
      throw new Error('can only transform documents with _id');                                                        // 772
    }                                                                                                                  // 773
                                                                                                                       //
    var id = doc._id; // XXX consider making tracker a weak dependency and checking                                    // 775
    // Package.tracker here                                                                                            // 778
                                                                                                                       //
    var transformed = Tracker.nonreactive(function () {                                                                // 779
      return transform(doc);                                                                                           // 779
    });                                                                                                                // 779
                                                                                                                       //
    if (!LocalCollection._isPlainObject(transformed)) {                                                                // 781
      throw new Error('transform must return object');                                                                 // 782
    }                                                                                                                  // 783
                                                                                                                       //
    if (hasOwn.call(transformed, '_id')) {                                                                             // 785
      if (!EJSON.equals(transformed._id, id)) {                                                                        // 786
        throw new Error('transformed document can\'t have different _id');                                             // 787
      }                                                                                                                // 788
    } else {                                                                                                           // 789
      transformed._id = id;                                                                                            // 790
    }                                                                                                                  // 791
                                                                                                                       //
    return transformed;                                                                                                // 793
  };                                                                                                                   // 794
                                                                                                                       //
  wrapped.__wrappedTransform__ = true;                                                                                 // 796
  return wrapped;                                                                                                      // 798
}; // XXX the sorted-query logic below is laughably inefficient. we'll                                                 // 799
// need to come up with a better datastructure for this.                                                               // 802
//                                                                                                                     // 803
// XXX the logic for observing with a skip or a limit is even more                                                     // 804
// laughably inefficient. we recompute the whole results every time!                                                   // 805
// This binary search puts a value between any equal values, and the first                                             // 807
// lesser value.                                                                                                       // 808
                                                                                                                       //
                                                                                                                       //
LocalCollection._binarySearch = function (cmp, array, value) {                                                         // 809
  var first = 0;                                                                                                       // 810
  var range = array.length;                                                                                            // 811
                                                                                                                       //
  while (range > 0) {                                                                                                  // 813
    var halfRange = Math.floor(range / 2);                                                                             // 814
                                                                                                                       //
    if (cmp(value, array[first + halfRange]) >= 0) {                                                                   // 816
      first += halfRange + 1;                                                                                          // 817
      range -= halfRange + 1;                                                                                          // 818
    } else {                                                                                                           // 819
      range = halfRange;                                                                                               // 820
    }                                                                                                                  // 821
  }                                                                                                                    // 822
                                                                                                                       //
  return first;                                                                                                        // 824
};                                                                                                                     // 825
                                                                                                                       //
LocalCollection._checkSupportedProjection = function (fields) {                                                        // 827
  if (fields !== Object(fields) || Array.isArray(fields)) {                                                            // 828
    throw MinimongoError('fields option must be an object');                                                           // 829
  }                                                                                                                    // 830
                                                                                                                       //
  Object.keys(fields).forEach(function (keyPath) {                                                                     // 832
    if (keyPath.split('.').includes('$')) {                                                                            // 833
      throw MinimongoError('Minimongo doesn\'t support $ operator in projections yet.');                               // 834
    }                                                                                                                  // 837
                                                                                                                       //
    var value = fields[keyPath];                                                                                       // 839
                                                                                                                       //
    if ((typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) === 'object' && ['$elemMatch', '$meta', '$slice'].some(function (key) {
      return hasOwn.call(value, key);                                                                                  // 842
    })) {                                                                                                              // 842
      throw MinimongoError('Minimongo doesn\'t support operators in projections yet.');                                // 845
    }                                                                                                                  // 848
                                                                                                                       //
    if (![1, 0, true, false].includes(value)) {                                                                        // 850
      throw MinimongoError('Projection values should be one of 1, 0, true, or false');                                 // 851
    }                                                                                                                  // 854
  });                                                                                                                  // 855
}; // Knows how to compile a fields projection to a predicate function.                                                // 856
// @returns - Function: a closure that filters out an object according to the                                          // 859
//            fields projection rules:                                                                                 // 860
//            @param obj - Object: MongoDB-styled document                                                             // 861
//            @returns - Object: a document with the fields filtered out                                               // 862
//                       according to projection rules. Doesn't retain subfields                                       // 863
//                       of passed argument.                                                                           // 864
                                                                                                                       //
                                                                                                                       //
LocalCollection._compileProjection = function (fields) {                                                               // 865
  LocalCollection._checkSupportedProjection(fields);                                                                   // 866
                                                                                                                       //
  var _idProjection = fields._id === undefined ? true : fields._id;                                                    // 868
                                                                                                                       //
  var details = projectionDetails(fields); // returns transformed doc according to ruleTree                            // 869
                                                                                                                       //
  var transform = function (doc, ruleTree) {                                                                           // 872
    // Special case for "sets"                                                                                         // 873
    if (Array.isArray(doc)) {                                                                                          // 874
      return doc.map(function (subdoc) {                                                                               // 875
        return transform(subdoc, ruleTree);                                                                            // 875
      });                                                                                                              // 875
    }                                                                                                                  // 876
                                                                                                                       //
    var result = details.including ? {} : EJSON.clone(doc);                                                            // 878
    Object.keys(ruleTree).forEach(function (key) {                                                                     // 880
      if (!hasOwn.call(doc, key)) {                                                                                    // 881
        return;                                                                                                        // 882
      }                                                                                                                // 883
                                                                                                                       //
      var rule = ruleTree[key];                                                                                        // 885
                                                                                                                       //
      if (rule === Object(rule)) {                                                                                     // 887
        // For sub-objects/subsets we branch                                                                           // 888
        if (doc[key] === Object(doc[key])) {                                                                           // 889
          result[key] = transform(doc[key], rule);                                                                     // 890
        }                                                                                                              // 891
      } else if (details.including) {                                                                                  // 892
        // Otherwise we don't even touch this subfield                                                                 // 893
        result[key] = EJSON.clone(doc[key]);                                                                           // 894
      } else {                                                                                                         // 895
        delete result[key];                                                                                            // 896
      }                                                                                                                // 897
    });                                                                                                                // 898
    return result;                                                                                                     // 900
  };                                                                                                                   // 901
                                                                                                                       //
  return function (doc) {                                                                                              // 903
    var result = transform(doc, details.tree);                                                                         // 904
                                                                                                                       //
    if (_idProjection && hasOwn.call(doc, '_id')) {                                                                    // 906
      result._id = doc._id;                                                                                            // 907
    }                                                                                                                  // 908
                                                                                                                       //
    if (!_idProjection && hasOwn.call(result, '_id')) {                                                                // 910
      delete result._id;                                                                                               // 911
    }                                                                                                                  // 912
                                                                                                                       //
    return result;                                                                                                     // 914
  };                                                                                                                   // 915
}; // Calculates the document to insert in case we're doing an upsert and the                                          // 916
// selector does not match any elements                                                                                // 919
                                                                                                                       //
                                                                                                                       //
LocalCollection._createUpsertDocument = function (selector, modifier) {                                                // 920
  var selectorDocument = populateDocumentWithQueryFields(selector);                                                    // 921
                                                                                                                       //
  var isModify = LocalCollection._isModificationMod(modifier);                                                         // 922
                                                                                                                       //
  var newDoc = {};                                                                                                     // 924
                                                                                                                       //
  if (selectorDocument._id) {                                                                                          // 926
    newDoc._id = selectorDocument._id;                                                                                 // 927
    delete selectorDocument._id;                                                                                       // 928
  } // This double _modify call is made to help with nested properties (see issue                                      // 929
  // #8631). We do this even if it's a replacement for validation purposes (e.g.                                       // 932
  // ambiguous id's)                                                                                                   // 933
                                                                                                                       //
                                                                                                                       //
  LocalCollection._modify(newDoc, {                                                                                    // 934
    $set: selectorDocument                                                                                             // 934
  });                                                                                                                  // 934
                                                                                                                       //
  LocalCollection._modify(newDoc, modifier, {                                                                          // 935
    isInsert: true                                                                                                     // 935
  });                                                                                                                  // 935
                                                                                                                       //
  if (isModify) {                                                                                                      // 937
    return newDoc;                                                                                                     // 938
  } // Replacement can take _id from query document                                                                    // 939
                                                                                                                       //
                                                                                                                       //
  var replacement = Object.assign({}, modifier);                                                                       // 942
                                                                                                                       //
  if (newDoc._id) {                                                                                                    // 943
    replacement._id = newDoc._id;                                                                                      // 944
  }                                                                                                                    // 945
                                                                                                                       //
  return replacement;                                                                                                  // 947
};                                                                                                                     // 948
                                                                                                                       //
LocalCollection._diffObjects = function (left, right, callbacks) {                                                     // 950
  return DiffSequence.diffObjects(left, right, callbacks);                                                             // 951
}; // ordered: bool.                                                                                                   // 952
// old_results and new_results: collections of documents.                                                              // 955
//    if ordered, they are arrays.                                                                                     // 956
//    if unordered, they are IdMaps                                                                                    // 957
                                                                                                                       //
                                                                                                                       //
LocalCollection._diffQueryChanges = function (ordered, oldResults, newResults, observer, options) {                    // 958
  return DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);                            // 958
};                                                                                                                     // 958
                                                                                                                       //
LocalCollection._diffQueryOrderedChanges = function (oldResults, newResults, observer, options) {                      // 962
  return DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);                              // 962
};                                                                                                                     // 962
                                                                                                                       //
LocalCollection._diffQueryUnorderedChanges = function (oldResults, newResults, observer, options) {                    // 966
  return DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);                            // 966
};                                                                                                                     // 966
                                                                                                                       //
LocalCollection._findInOrderedResults = function (query, doc) {                                                        // 970
  if (!query.ordered) {                                                                                                // 971
    throw new Error('Can\'t call _findInOrderedResults on unordered query');                                           // 972
  }                                                                                                                    // 973
                                                                                                                       //
  for (var i = 0; i < query.results.length; i++) {                                                                     // 975
    if (query.results[i] === doc) {                                                                                    // 976
      return i;                                                                                                        // 977
    }                                                                                                                  // 978
  }                                                                                                                    // 979
                                                                                                                       //
  throw Error('object missing from query');                                                                            // 981
}; // If this is a selector which explicitly constrains the match by ID to a finite                                    // 982
// number of documents, returns a list of their IDs.  Otherwise returns                                                // 985
// null. Note that the selector may have other restrictions so it may not even                                         // 986
// match those document!  We care about $in and $and since those are generated                                         // 987
// access-controlled update and remove.                                                                                // 988
                                                                                                                       //
                                                                                                                       //
LocalCollection._idsMatchedBySelector = function (selector) {                                                          // 989
  // Is the selector just an ID?                                                                                       // 990
  if (LocalCollection._selectorIsId(selector)) {                                                                       // 991
    return [selector];                                                                                                 // 992
  }                                                                                                                    // 993
                                                                                                                       //
  if (!selector) {                                                                                                     // 995
    return null;                                                                                                       // 996
  } // Do we have an _id clause?                                                                                       // 997
                                                                                                                       //
                                                                                                                       //
  if (hasOwn.call(selector, '_id')) {                                                                                  // 1000
    // Is the _id clause just an ID?                                                                                   // 1001
    if (LocalCollection._selectorIsId(selector._id)) {                                                                 // 1002
      return [selector._id];                                                                                           // 1003
    } // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?                                                              // 1004
                                                                                                                       //
                                                                                                                       //
    if (selector._id && Array.isArray(selector._id.$in) && selector._id.$in.length && selector._id.$in.every(LocalCollection._selectorIsId)) {
      return selector._id.$in;                                                                                         // 1011
    }                                                                                                                  // 1012
                                                                                                                       //
    return null;                                                                                                       // 1014
  } // If this is a top-level $and, and any of the clauses constrain their                                             // 1015
  // documents, then the whole selector is constrained by any one clause's                                             // 1018
  // constraint. (Well, by their intersection, but that seems unlikely.)                                               // 1019
                                                                                                                       //
                                                                                                                       //
  if (Array.isArray(selector.$and)) {                                                                                  // 1020
    for (var i = 0; i < selector.$and.length; ++i) {                                                                   // 1021
      var subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);                                            // 1022
                                                                                                                       //
      if (subIds) {                                                                                                    // 1024
        return subIds;                                                                                                 // 1025
      }                                                                                                                // 1026
    }                                                                                                                  // 1027
  }                                                                                                                    // 1028
                                                                                                                       //
  return null;                                                                                                         // 1030
};                                                                                                                     // 1031
                                                                                                                       //
LocalCollection._insertInResults = function (query, doc) {                                                             // 1033
  var fields = EJSON.clone(doc);                                                                                       // 1034
  delete fields._id;                                                                                                   // 1036
                                                                                                                       //
  if (query.ordered) {                                                                                                 // 1038
    if (!query.sorter) {                                                                                               // 1039
      query.addedBefore(doc._id, query.projectionFn(fields), null);                                                    // 1040
      query.results.push(doc);                                                                                         // 1041
    } else {                                                                                                           // 1042
      var i = LocalCollection._insertInSortedList(query.sorter.getComparator({                                         // 1043
        distances: query.distances                                                                                     // 1044
      }), query.results, doc);                                                                                         // 1044
                                                                                                                       //
      var next = query.results[i + 1];                                                                                 // 1049
                                                                                                                       //
      if (next) {                                                                                                      // 1050
        next = next._id;                                                                                               // 1051
      } else {                                                                                                         // 1052
        next = null;                                                                                                   // 1053
      }                                                                                                                // 1054
                                                                                                                       //
      query.addedBefore(doc._id, query.projectionFn(fields), next);                                                    // 1056
    }                                                                                                                  // 1057
                                                                                                                       //
    query.added(doc._id, query.projectionFn(fields));                                                                  // 1059
  } else {                                                                                                             // 1060
    query.added(doc._id, query.projectionFn(fields));                                                                  // 1061
    query.results.set(doc._id, doc);                                                                                   // 1062
  }                                                                                                                    // 1063
};                                                                                                                     // 1064
                                                                                                                       //
LocalCollection._insertInSortedList = function (cmp, array, value) {                                                   // 1066
  if (array.length === 0) {                                                                                            // 1067
    array.push(value);                                                                                                 // 1068
    return 0;                                                                                                          // 1069
  }                                                                                                                    // 1070
                                                                                                                       //
  var i = LocalCollection._binarySearch(cmp, array, value);                                                            // 1072
                                                                                                                       //
  array.splice(i, 0, value);                                                                                           // 1074
  return i;                                                                                                            // 1076
};                                                                                                                     // 1077
                                                                                                                       //
LocalCollection._isModificationMod = function (mod) {                                                                  // 1079
  var isModify = false;                                                                                                // 1080
  var isReplace = false;                                                                                               // 1081
  Object.keys(mod).forEach(function (key) {                                                                            // 1083
    if (key.substr(0, 1) === '$') {                                                                                    // 1084
      isModify = true;                                                                                                 // 1085
    } else {                                                                                                           // 1086
      isReplace = true;                                                                                                // 1087
    }                                                                                                                  // 1088
  });                                                                                                                  // 1089
                                                                                                                       //
  if (isModify && isReplace) {                                                                                         // 1091
    throw new Error('Update parameter cannot have both modifier and non-modifier fields.');                            // 1092
  }                                                                                                                    // 1095
                                                                                                                       //
  return isModify;                                                                                                     // 1097
}; // XXX maybe this should be EJSON.isObject, though EJSON doesn't know about                                         // 1098
// RegExp                                                                                                              // 1101
// XXX note that _type(undefined) === 3!!!!                                                                            // 1102
                                                                                                                       //
                                                                                                                       //
LocalCollection._isPlainObject = function (x) {                                                                        // 1103
  return x && LocalCollection._f._type(x) === 3;                                                                       // 1104
}; // XXX need a strategy for passing the binding of $ into this                                                       // 1105
// function, from the compiled selector                                                                                // 1108
//                                                                                                                     // 1109
// maybe just {key.up.to.just.before.dollarsign: array_index}                                                          // 1110
//                                                                                                                     // 1111
// XXX atomicity: if one modification fails, do we roll back the whole                                                 // 1112
// change?                                                                                                             // 1113
//                                                                                                                     // 1114
// options:                                                                                                            // 1115
//   - isInsert is set when _modify is being called to compute the document to                                         // 1116
//     insert as part of an upsert operation. We use this primarily to figure                                          // 1117
//     out when to set the fields in $setOnInsert, if present.                                                         // 1118
                                                                                                                       //
                                                                                                                       //
LocalCollection._modify = function (doc, modifier) {                                                                   // 1119
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                                // 1119
                                                                                                                       //
  if (!LocalCollection._isPlainObject(modifier)) {                                                                     // 1120
    throw MinimongoError('Modifier must be an object');                                                                // 1121
  } // Make sure the caller can't mutate our data structures.                                                          // 1122
                                                                                                                       //
                                                                                                                       //
  modifier = EJSON.clone(modifier);                                                                                    // 1125
  var isModifier = isOperatorObject(modifier);                                                                         // 1127
  var newDoc = isModifier ? EJSON.clone(doc) : modifier;                                                               // 1128
                                                                                                                       //
  if (isModifier) {                                                                                                    // 1130
    // apply modifiers to the doc.                                                                                     // 1131
    Object.keys(modifier).forEach(function (operator) {                                                                // 1132
      // Treat $setOnInsert as $set if this is an insert.                                                              // 1133
      var setOnInsert = options.isInsert && operator === '$setOnInsert';                                               // 1134
      var modFunc = MODIFIERS[setOnInsert ? '$set' : operator];                                                        // 1135
      var operand = modifier[operator];                                                                                // 1136
                                                                                                                       //
      if (!modFunc) {                                                                                                  // 1138
        throw MinimongoError("Invalid modifier specified " + operator);                                                // 1139
      }                                                                                                                // 1140
                                                                                                                       //
      Object.keys(operand).forEach(function (keypath) {                                                                // 1142
        var arg = operand[keypath];                                                                                    // 1143
                                                                                                                       //
        if (keypath === '') {                                                                                          // 1145
          throw MinimongoError('An empty update path is not valid.');                                                  // 1146
        }                                                                                                              // 1147
                                                                                                                       //
        var keyparts = keypath.split('.');                                                                             // 1149
                                                                                                                       //
        if (!keyparts.every(Boolean)) {                                                                                // 1151
          throw MinimongoError("The update path '" + keypath + "' contains an empty field name, " + 'which is not allowed.');
        }                                                                                                              // 1156
                                                                                                                       //
        var target = findModTarget(newDoc, keyparts, {                                                                 // 1158
          arrayIndices: options.arrayIndices,                                                                          // 1159
          forbidArray: operator === '$rename',                                                                         // 1160
          noCreate: NO_CREATE_MODIFIERS[operator]                                                                      // 1161
        });                                                                                                            // 1158
        modFunc(target, keyparts.pop(), arg, keypath, newDoc);                                                         // 1164
      });                                                                                                              // 1165
    });                                                                                                                // 1166
                                                                                                                       //
    if (doc._id && !EJSON.equals(doc._id, newDoc._id)) {                                                               // 1168
      throw MinimongoError("After applying the update to the document {_id: \"" + doc._id + "\", ...}," + ' the (immutable) field \'_id\' was found to have been altered to ' + ("_id: \"" + newDoc._id + "\""));
    }                                                                                                                  // 1174
  } else {                                                                                                             // 1175
    if (doc._id && modifier._id && !EJSON.equals(doc._id, modifier._id)) {                                             // 1176
      throw MinimongoError("The _id field cannot be changed from {_id: \"" + doc._id + "\"} to " + ("{_id: \"" + modifier._id + "\"}"));
    } // replace the whole document                                                                                    // 1181
                                                                                                                       //
                                                                                                                       //
    assertHasValidFieldNames(modifier);                                                                                // 1184
  } // move new document into place.                                                                                   // 1185
                                                                                                                       //
                                                                                                                       //
  Object.keys(doc).forEach(function (key) {                                                                            // 1188
    // Note: this used to be for (var key in doc) however, this does not                                               // 1189
    // work right in Opera. Deleting from a doc while iterating over it                                                // 1190
    // would sometimes cause opera to skip some keys.                                                                  // 1191
    if (key !== '_id') {                                                                                               // 1192
      delete doc[key];                                                                                                 // 1193
    }                                                                                                                  // 1194
  });                                                                                                                  // 1195
  Object.keys(newDoc).forEach(function (key) {                                                                         // 1197
    doc[key] = newDoc[key];                                                                                            // 1198
  });                                                                                                                  // 1199
};                                                                                                                     // 1200
                                                                                                                       //
LocalCollection._observeFromObserveChanges = function (cursor, observeCallbacks) {                                     // 1202
  var transform = cursor.getTransform() || function (doc) {                                                            // 1203
    return doc;                                                                                                        // 1203
  };                                                                                                                   // 1203
                                                                                                                       //
  var suppressed = !!observeCallbacks._suppress_initial;                                                               // 1204
  var observeChangesCallbacks = void 0;                                                                                // 1206
                                                                                                                       //
  if (LocalCollection._observeCallbacksAreOrdered(observeCallbacks)) {                                                 // 1207
    // The "_no_indices" option sets all index arguments to -1 and skips the                                           // 1208
    // linear scans required to generate them.  This lets observers that don't                                         // 1209
    // need absolute indices benefit from the other features of this API --                                            // 1210
    // relative order, transforms, and applyChanges -- without the speed hit.                                          // 1211
    var indices = !observeCallbacks._no_indices;                                                                       // 1212
    observeChangesCallbacks = {                                                                                        // 1214
      addedBefore: function (id, fields, before) {                                                                     // 1215
        if (suppressed || !(observeCallbacks.addedAt || observeCallbacks.added)) {                                     // 1216
          return;                                                                                                      // 1217
        }                                                                                                              // 1218
                                                                                                                       //
        var doc = transform(Object.assign(fields, {                                                                    // 1220
          _id: id                                                                                                      // 1220
        }));                                                                                                           // 1220
                                                                                                                       //
        if (observeCallbacks.addedAt) {                                                                                // 1222
          observeCallbacks.addedAt(doc, indices ? before ? this.docs.indexOf(before) : this.docs.size() : -1, before);
        } else {                                                                                                       // 1232
          observeCallbacks.added(doc);                                                                                 // 1233
        }                                                                                                              // 1234
      },                                                                                                               // 1235
      changed: function (id, fields) {                                                                                 // 1236
        if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {                                               // 1237
          return;                                                                                                      // 1238
        }                                                                                                              // 1239
                                                                                                                       //
        var doc = EJSON.clone(this.docs.get(id));                                                                      // 1241
                                                                                                                       //
        if (!doc) {                                                                                                    // 1242
          throw new Error("Unknown id for changed: " + id);                                                            // 1243
        }                                                                                                              // 1244
                                                                                                                       //
        var oldDoc = transform(EJSON.clone(doc));                                                                      // 1246
        DiffSequence.applyChanges(doc, fields);                                                                        // 1248
                                                                                                                       //
        if (observeCallbacks.changedAt) {                                                                              // 1250
          observeCallbacks.changedAt(transform(doc), oldDoc, indices ? this.docs.indexOf(id) : -1);                    // 1251
        } else {                                                                                                       // 1256
          observeCallbacks.changed(transform(doc), oldDoc);                                                            // 1257
        }                                                                                                              // 1258
      },                                                                                                               // 1259
      movedBefore: function (id, before) {                                                                             // 1260
        if (!observeCallbacks.movedTo) {                                                                               // 1261
          return;                                                                                                      // 1262
        }                                                                                                              // 1263
                                                                                                                       //
        var from = indices ? this.docs.indexOf(id) : -1;                                                               // 1265
        var to = indices ? before ? this.docs.indexOf(before) : this.docs.size() : -1; // When not moving backwards, adjust for the fact that removing the
        // document slides everything back one slot.                                                                   // 1273
                                                                                                                       //
        if (to > from) {                                                                                               // 1274
          --to;                                                                                                        // 1275
        }                                                                                                              // 1276
                                                                                                                       //
        observeCallbacks.movedTo(transform(EJSON.clone(this.docs.get(id))), from, to, before || null);                 // 1278
      },                                                                                                               // 1284
      removed: function (id) {                                                                                         // 1285
        if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {                                               // 1286
          return;                                                                                                      // 1287
        } // technically maybe there should be an EJSON.clone here, but it's about                                     // 1288
        // to be removed from this.docs!                                                                               // 1291
                                                                                                                       //
                                                                                                                       //
        var doc = transform(this.docs.get(id));                                                                        // 1292
                                                                                                                       //
        if (observeCallbacks.removedAt) {                                                                              // 1294
          observeCallbacks.removedAt(doc, indices ? this.docs.indexOf(id) : -1);                                       // 1295
        } else {                                                                                                       // 1296
          observeCallbacks.removed(doc);                                                                               // 1297
        }                                                                                                              // 1298
      }                                                                                                                // 1299
    };                                                                                                                 // 1214
  } else {                                                                                                             // 1301
    observeChangesCallbacks = {                                                                                        // 1302
      added: function (id, fields) {                                                                                   // 1303
        if (!suppressed && observeCallbacks.added) {                                                                   // 1304
          observeCallbacks.added(transform(Object.assign(fields, {                                                     // 1305
            _id: id                                                                                                    // 1305
          })));                                                                                                        // 1305
        }                                                                                                              // 1306
      },                                                                                                               // 1307
      changed: function (id, fields) {                                                                                 // 1308
        if (observeCallbacks.changed) {                                                                                // 1309
          var oldDoc = this.docs.get(id);                                                                              // 1310
          var doc = EJSON.clone(oldDoc);                                                                               // 1311
          DiffSequence.applyChanges(doc, fields);                                                                      // 1313
          observeCallbacks.changed(transform(doc), transform(EJSON.clone(oldDoc)));                                    // 1315
        }                                                                                                              // 1319
      },                                                                                                               // 1320
      removed: function (id) {                                                                                         // 1321
        if (observeCallbacks.removed) {                                                                                // 1322
          observeCallbacks.removed(transform(this.docs.get(id)));                                                      // 1323
        }                                                                                                              // 1324
      }                                                                                                                // 1325
    };                                                                                                                 // 1302
  }                                                                                                                    // 1327
                                                                                                                       //
  var changeObserver = new LocalCollection._CachingChangeObserver({                                                    // 1329
    callbacks: observeChangesCallbacks                                                                                 // 1330
  });                                                                                                                  // 1329
  var handle = cursor.observeChanges(changeObserver.applyChange);                                                      // 1333
  suppressed = false;                                                                                                  // 1335
  return handle;                                                                                                       // 1337
};                                                                                                                     // 1338
                                                                                                                       //
LocalCollection._observeCallbacksAreOrdered = function (callbacks) {                                                   // 1340
  if (callbacks.added && callbacks.addedAt) {                                                                          // 1341
    throw new Error('Please specify only one of added() and addedAt()');                                               // 1342
  }                                                                                                                    // 1343
                                                                                                                       //
  if (callbacks.changed && callbacks.changedAt) {                                                                      // 1345
    throw new Error('Please specify only one of changed() and changedAt()');                                           // 1346
  }                                                                                                                    // 1347
                                                                                                                       //
  if (callbacks.removed && callbacks.removedAt) {                                                                      // 1349
    throw new Error('Please specify only one of removed() and removedAt()');                                           // 1350
  }                                                                                                                    // 1351
                                                                                                                       //
  return !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);                     // 1353
};                                                                                                                     // 1359
                                                                                                                       //
LocalCollection._observeChangesCallbacksAreOrdered = function (callbacks) {                                            // 1361
  if (callbacks.added && callbacks.addedBefore) {                                                                      // 1362
    throw new Error('Please specify only one of added() and addedBefore()');                                           // 1363
  }                                                                                                                    // 1364
                                                                                                                       //
  return !!(callbacks.addedBefore || callbacks.movedBefore);                                                           // 1366
};                                                                                                                     // 1367
                                                                                                                       //
LocalCollection._removeFromResults = function (query, doc) {                                                           // 1369
  if (query.ordered) {                                                                                                 // 1370
    var i = LocalCollection._findInOrderedResults(query, doc);                                                         // 1371
                                                                                                                       //
    query.removed(doc._id);                                                                                            // 1373
    query.results.splice(i, 1);                                                                                        // 1374
  } else {                                                                                                             // 1375
    var id = doc._id; // in case callback mutates doc                                                                  // 1376
                                                                                                                       //
    query.removed(doc._id);                                                                                            // 1378
    query.results.remove(id);                                                                                          // 1379
  }                                                                                                                    // 1380
}; // Is this selector just shorthand for lookup by _id?                                                               // 1381
                                                                                                                       //
                                                                                                                       //
LocalCollection._selectorIsId = function (selector) {                                                                  // 1384
  return typeof selector === 'number' || typeof selector === 'string' || selector instanceof MongoID.ObjectID;         // 1384
}; // Is the selector just lookup by _id (shorthand or not)?                                                           // 1384
                                                                                                                       //
                                                                                                                       //
LocalCollection._selectorIsIdPerhapsAsObject = function (selector) {                                                   // 1391
  return LocalCollection._selectorIsId(selector) || LocalCollection._selectorIsId(selector && selector._id) && Object.keys(selector).length === 1;
};                                                                                                                     // 1391
                                                                                                                       //
LocalCollection._updateInResults = function (query, doc, old_doc) {                                                    // 1397
  if (!EJSON.equals(doc._id, old_doc._id)) {                                                                           // 1398
    throw new Error('Can\'t change a doc\'s _id while updating');                                                      // 1399
  }                                                                                                                    // 1400
                                                                                                                       //
  var projectionFn = query.projectionFn;                                                                               // 1402
  var changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));                        // 1403
                                                                                                                       //
  if (!query.ordered) {                                                                                                // 1408
    if (Object.keys(changedFields).length) {                                                                           // 1409
      query.changed(doc._id, changedFields);                                                                           // 1410
      query.results.set(doc._id, doc);                                                                                 // 1411
    }                                                                                                                  // 1412
                                                                                                                       //
    return;                                                                                                            // 1414
  }                                                                                                                    // 1415
                                                                                                                       //
  var old_idx = LocalCollection._findInOrderedResults(query, doc);                                                     // 1417
                                                                                                                       //
  if (Object.keys(changedFields).length) {                                                                             // 1419
    query.changed(doc._id, changedFields);                                                                             // 1420
  }                                                                                                                    // 1421
                                                                                                                       //
  if (!query.sorter) {                                                                                                 // 1423
    return;                                                                                                            // 1424
  } // just take it out and put it back in again, and see if the index changes                                         // 1425
                                                                                                                       //
                                                                                                                       //
  query.results.splice(old_idx, 1);                                                                                    // 1428
                                                                                                                       //
  var new_idx = LocalCollection._insertInSortedList(query.sorter.getComparator({                                       // 1430
    distances: query.distances                                                                                         // 1431
  }), query.results, doc);                                                                                             // 1431
                                                                                                                       //
  if (old_idx !== new_idx) {                                                                                           // 1436
    var next = query.results[new_idx + 1];                                                                             // 1437
                                                                                                                       //
    if (next) {                                                                                                        // 1438
      next = next._id;                                                                                                 // 1439
    } else {                                                                                                           // 1440
      next = null;                                                                                                     // 1441
    }                                                                                                                  // 1442
                                                                                                                       //
    query.movedBefore && query.movedBefore(doc._id, next);                                                             // 1444
  }                                                                                                                    // 1445
};                                                                                                                     // 1446
                                                                                                                       //
var MODIFIERS = {                                                                                                      // 1448
  $currentDate: function (target, field, arg) {                                                                        // 1449
    if ((typeof arg === "undefined" ? "undefined" : (0, _typeof3.default)(arg)) === 'object' && hasOwn.call(arg, '$type')) {
      if (arg.$type !== 'date') {                                                                                      // 1451
        throw MinimongoError('Minimongo does currently only support the date type in ' + '$currentDate modifiers', {   // 1452
          field: field                                                                                                 // 1455
        });                                                                                                            // 1455
      }                                                                                                                // 1457
    } else if (arg !== true) {                                                                                         // 1458
      throw MinimongoError('Invalid $currentDate modifier', {                                                          // 1459
        field: field                                                                                                   // 1459
      });                                                                                                              // 1459
    }                                                                                                                  // 1460
                                                                                                                       //
    target[field] = new Date();                                                                                        // 1462
  },                                                                                                                   // 1463
  $min: function (target, field, arg) {                                                                                // 1464
    if (typeof arg !== 'number') {                                                                                     // 1465
      throw MinimongoError('Modifier $min allowed for numbers only', {                                                 // 1466
        field: field                                                                                                   // 1466
      });                                                                                                              // 1466
    }                                                                                                                  // 1467
                                                                                                                       //
    if (field in target) {                                                                                             // 1469
      if (typeof target[field] !== 'number') {                                                                         // 1470
        throw MinimongoError('Cannot apply $min modifier to non-number', {                                             // 1471
          field: field                                                                                                 // 1473
        });                                                                                                            // 1473
      }                                                                                                                // 1475
                                                                                                                       //
      if (target[field] > arg) {                                                                                       // 1477
        target[field] = arg;                                                                                           // 1478
      }                                                                                                                // 1479
    } else {                                                                                                           // 1480
      target[field] = arg;                                                                                             // 1481
    }                                                                                                                  // 1482
  },                                                                                                                   // 1483
  $max: function (target, field, arg) {                                                                                // 1484
    if (typeof arg !== 'number') {                                                                                     // 1485
      throw MinimongoError('Modifier $max allowed for numbers only', {                                                 // 1486
        field: field                                                                                                   // 1486
      });                                                                                                              // 1486
    }                                                                                                                  // 1487
                                                                                                                       //
    if (field in target) {                                                                                             // 1489
      if (typeof target[field] !== 'number') {                                                                         // 1490
        throw MinimongoError('Cannot apply $max modifier to non-number', {                                             // 1491
          field: field                                                                                                 // 1493
        });                                                                                                            // 1493
      }                                                                                                                // 1495
                                                                                                                       //
      if (target[field] < arg) {                                                                                       // 1497
        target[field] = arg;                                                                                           // 1498
      }                                                                                                                // 1499
    } else {                                                                                                           // 1500
      target[field] = arg;                                                                                             // 1501
    }                                                                                                                  // 1502
  },                                                                                                                   // 1503
  $inc: function (target, field, arg) {                                                                                // 1504
    if (typeof arg !== 'number') {                                                                                     // 1505
      throw MinimongoError('Modifier $inc allowed for numbers only', {                                                 // 1506
        field: field                                                                                                   // 1506
      });                                                                                                              // 1506
    }                                                                                                                  // 1507
                                                                                                                       //
    if (field in target) {                                                                                             // 1509
      if (typeof target[field] !== 'number') {                                                                         // 1510
        throw MinimongoError('Cannot apply $inc modifier to non-number', {                                             // 1511
          field: field                                                                                                 // 1513
        });                                                                                                            // 1513
      }                                                                                                                // 1515
                                                                                                                       //
      target[field] += arg;                                                                                            // 1517
    } else {                                                                                                           // 1518
      target[field] = arg;                                                                                             // 1519
    }                                                                                                                  // 1520
  },                                                                                                                   // 1521
  $set: function (target, field, arg) {                                                                                // 1522
    if (target !== Object(target)) {                                                                                   // 1523
      // not an array or an object                                                                                     // 1523
      var error = MinimongoError('Cannot set property on non-object field', {                                          // 1524
        field: field                                                                                                   // 1526
      });                                                                                                              // 1526
      error.setPropertyError = true;                                                                                   // 1528
      throw error;                                                                                                     // 1529
    }                                                                                                                  // 1530
                                                                                                                       //
    if (target === null) {                                                                                             // 1532
      var _error = MinimongoError('Cannot set property on null', {                                                     // 1533
        field: field                                                                                                   // 1533
      });                                                                                                              // 1533
                                                                                                                       //
      _error.setPropertyError = true;                                                                                  // 1534
      throw _error;                                                                                                    // 1535
    }                                                                                                                  // 1536
                                                                                                                       //
    assertHasValidFieldNames(arg);                                                                                     // 1538
    target[field] = arg;                                                                                               // 1540
  },                                                                                                                   // 1541
  $setOnInsert: function (target, field, arg) {// converted to `$set` in `_modify`                                     // 1542
  },                                                                                                                   // 1544
  $unset: function (target, field, arg) {                                                                              // 1545
    if (target !== undefined) {                                                                                        // 1546
      if (target instanceof Array) {                                                                                   // 1547
        if (field in target) {                                                                                         // 1548
          target[field] = null;                                                                                        // 1549
        }                                                                                                              // 1550
      } else {                                                                                                         // 1551
        delete target[field];                                                                                          // 1552
      }                                                                                                                // 1553
    }                                                                                                                  // 1554
  },                                                                                                                   // 1555
  $push: function (target, field, arg) {                                                                               // 1556
    if (target[field] === undefined) {                                                                                 // 1557
      target[field] = [];                                                                                              // 1558
    }                                                                                                                  // 1559
                                                                                                                       //
    if (!(target[field] instanceof Array)) {                                                                           // 1561
      throw MinimongoError('Cannot apply $push modifier to non-array', {                                               // 1562
        field: field                                                                                                   // 1562
      });                                                                                                              // 1562
    }                                                                                                                  // 1563
                                                                                                                       //
    if (!(arg && arg.$each)) {                                                                                         // 1565
      // Simple mode: not $each                                                                                        // 1566
      assertHasValidFieldNames(arg);                                                                                   // 1567
      target[field].push(arg);                                                                                         // 1569
      return;                                                                                                          // 1571
    } // Fancy mode: $each (and maybe $slice and $sort and $position)                                                  // 1572
                                                                                                                       //
                                                                                                                       //
    var toPush = arg.$each;                                                                                            // 1575
                                                                                                                       //
    if (!(toPush instanceof Array)) {                                                                                  // 1576
      throw MinimongoError('$each must be an array', {                                                                 // 1577
        field: field                                                                                                   // 1577
      });                                                                                                              // 1577
    }                                                                                                                  // 1578
                                                                                                                       //
    assertHasValidFieldNames(toPush); // Parse $position                                                               // 1580
                                                                                                                       //
    var position = undefined;                                                                                          // 1583
                                                                                                                       //
    if ('$position' in arg) {                                                                                          // 1584
      if (typeof arg.$position !== 'number') {                                                                         // 1585
        throw MinimongoError('$position must be a numeric value', {                                                    // 1586
          field: field                                                                                                 // 1586
        });                                                                                                            // 1586
      } // XXX should check to make sure integer                                                                       // 1587
                                                                                                                       //
                                                                                                                       //
      if (arg.$position < 0) {                                                                                         // 1590
        throw MinimongoError('$position in $push must be zero or positive', {                                          // 1591
          field: field                                                                                                 // 1593
        });                                                                                                            // 1593
      }                                                                                                                // 1595
                                                                                                                       //
      position = arg.$position;                                                                                        // 1597
    } // Parse $slice.                                                                                                 // 1598
                                                                                                                       //
                                                                                                                       //
    var slice = undefined;                                                                                             // 1601
                                                                                                                       //
    if ('$slice' in arg) {                                                                                             // 1602
      if (typeof arg.$slice !== 'number') {                                                                            // 1603
        throw MinimongoError('$slice must be a numeric value', {                                                       // 1604
          field: field                                                                                                 // 1604
        });                                                                                                            // 1604
      } // XXX should check to make sure integer                                                                       // 1605
                                                                                                                       //
                                                                                                                       //
      slice = arg.$slice;                                                                                              // 1608
    } // Parse $sort.                                                                                                  // 1609
                                                                                                                       //
                                                                                                                       //
    var sortFunction = undefined;                                                                                      // 1612
                                                                                                                       //
    if (arg.$sort) {                                                                                                   // 1613
      if (slice === undefined) {                                                                                       // 1614
        throw MinimongoError('$sort requires $slice to be present', {                                                  // 1615
          field: field                                                                                                 // 1615
        });                                                                                                            // 1615
      } // XXX this allows us to use a $sort whose value is an array, but that's                                       // 1616
      // actually an extension of the Node driver, so it won't work                                                    // 1619
      // server-side. Could be confusing!                                                                              // 1620
      // XXX is it correct that we don't do geo-stuff here?                                                            // 1621
                                                                                                                       //
                                                                                                                       //
      sortFunction = new Minimongo.Sorter(arg.$sort).getComparator();                                                  // 1622
      toPush.forEach(function (element) {                                                                              // 1624
        if (LocalCollection._f._type(element) !== 3) {                                                                 // 1625
          throw MinimongoError('$push like modifiers using $sort require all elements to be ' + 'objects', {           // 1626
            field: field                                                                                               // 1629
          });                                                                                                          // 1629
        }                                                                                                              // 1631
      });                                                                                                              // 1632
    } // Actually push.                                                                                                // 1633
                                                                                                                       //
                                                                                                                       //
    if (position === undefined) {                                                                                      // 1636
      toPush.forEach(function (element) {                                                                              // 1637
        target[field].push(element);                                                                                   // 1638
      });                                                                                                              // 1639
    } else {                                                                                                           // 1640
      var _target$field;                                                                                               // 1640
                                                                                                                       //
      var spliceArguments = [position, 0];                                                                             // 1641
      toPush.forEach(function (element) {                                                                              // 1643
        spliceArguments.push(element);                                                                                 // 1644
      });                                                                                                              // 1645
                                                                                                                       //
      (_target$field = target[field]).splice.apply(_target$field, spliceArguments);                                    // 1647
    } // Actually sort.                                                                                                // 1648
                                                                                                                       //
                                                                                                                       //
    if (sortFunction) {                                                                                                // 1651
      target[field].sort(sortFunction);                                                                                // 1652
    } // Actually slice.                                                                                               // 1653
                                                                                                                       //
                                                                                                                       //
    if (slice !== undefined) {                                                                                         // 1656
      if (slice === 0) {                                                                                               // 1657
        target[field] = []; // differs from Array.slice!                                                               // 1658
      } else if (slice < 0) {                                                                                          // 1659
        target[field] = target[field].slice(slice);                                                                    // 1660
      } else {                                                                                                         // 1661
        target[field] = target[field].slice(0, slice);                                                                 // 1662
      }                                                                                                                // 1663
    }                                                                                                                  // 1664
  },                                                                                                                   // 1665
  $pushAll: function (target, field, arg) {                                                                            // 1666
    if (!((typeof arg === "undefined" ? "undefined" : (0, _typeof3.default)(arg)) === 'object' && arg instanceof Array)) {
      throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only');                                       // 1668
    }                                                                                                                  // 1669
                                                                                                                       //
    assertHasValidFieldNames(arg);                                                                                     // 1671
    var toPush = target[field];                                                                                        // 1673
                                                                                                                       //
    if (toPush === undefined) {                                                                                        // 1675
      target[field] = arg;                                                                                             // 1676
    } else if (!(toPush instanceof Array)) {                                                                           // 1677
      throw MinimongoError('Cannot apply $pushAll modifier to non-array', {                                            // 1678
        field: field                                                                                                   // 1680
      });                                                                                                              // 1680
    } else {                                                                                                           // 1682
      toPush.push.apply(toPush, (0, _toConsumableArray3.default)(arg));                                                // 1683
    }                                                                                                                  // 1684
  },                                                                                                                   // 1685
  $addToSet: function (target, field, arg) {                                                                           // 1686
    var isEach = false;                                                                                                // 1687
                                                                                                                       //
    if ((typeof arg === "undefined" ? "undefined" : (0, _typeof3.default)(arg)) === 'object') {                        // 1689
      // check if first key is '$each'                                                                                 // 1690
      var keys = Object.keys(arg);                                                                                     // 1691
                                                                                                                       //
      if (keys[0] === '$each') {                                                                                       // 1692
        isEach = true;                                                                                                 // 1693
      }                                                                                                                // 1694
    }                                                                                                                  // 1695
                                                                                                                       //
    var values = isEach ? arg.$each : [arg];                                                                           // 1697
    assertHasValidFieldNames(values);                                                                                  // 1699
    var toAdd = target[field];                                                                                         // 1701
                                                                                                                       //
    if (toAdd === undefined) {                                                                                         // 1702
      target[field] = values;                                                                                          // 1703
    } else if (!(toAdd instanceof Array)) {                                                                            // 1704
      throw MinimongoError('Cannot apply $addToSet modifier to non-array', {                                           // 1705
        field: field                                                                                                   // 1707
      });                                                                                                              // 1707
    } else {                                                                                                           // 1709
      values.forEach(function (value) {                                                                                // 1710
        if (toAdd.some(function (element) {                                                                            // 1711
          return LocalCollection._f._equal(value, element);                                                            // 1711
        })) {                                                                                                          // 1711
          return;                                                                                                      // 1712
        }                                                                                                              // 1713
                                                                                                                       //
        toAdd.push(value);                                                                                             // 1715
      });                                                                                                              // 1716
    }                                                                                                                  // 1717
  },                                                                                                                   // 1718
  $pop: function (target, field, arg) {                                                                                // 1719
    if (target === undefined) {                                                                                        // 1720
      return;                                                                                                          // 1721
    }                                                                                                                  // 1722
                                                                                                                       //
    var toPop = target[field];                                                                                         // 1724
                                                                                                                       //
    if (toPop === undefined) {                                                                                         // 1726
      return;                                                                                                          // 1727
    }                                                                                                                  // 1728
                                                                                                                       //
    if (!(toPop instanceof Array)) {                                                                                   // 1730
      throw MinimongoError('Cannot apply $pop modifier to non-array', {                                                // 1731
        field: field                                                                                                   // 1731
      });                                                                                                              // 1731
    }                                                                                                                  // 1732
                                                                                                                       //
    if (typeof arg === 'number' && arg < 0) {                                                                          // 1734
      toPop.splice(0, 1);                                                                                              // 1735
    } else {                                                                                                           // 1736
      toPop.pop();                                                                                                     // 1737
    }                                                                                                                  // 1738
  },                                                                                                                   // 1739
  $pull: function (target, field, arg) {                                                                               // 1740
    if (target === undefined) {                                                                                        // 1741
      return;                                                                                                          // 1742
    }                                                                                                                  // 1743
                                                                                                                       //
    var toPull = target[field];                                                                                        // 1745
                                                                                                                       //
    if (toPull === undefined) {                                                                                        // 1746
      return;                                                                                                          // 1747
    }                                                                                                                  // 1748
                                                                                                                       //
    if (!(toPull instanceof Array)) {                                                                                  // 1750
      throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', {                                       // 1751
        field: field                                                                                                   // 1753
      });                                                                                                              // 1753
    }                                                                                                                  // 1755
                                                                                                                       //
    var out = void 0;                                                                                                  // 1757
                                                                                                                       //
    if (arg != null && (typeof arg === "undefined" ? "undefined" : (0, _typeof3.default)(arg)) === 'object' && !(arg instanceof Array)) {
      // XXX would be much nicer to compile this once, rather than                                                     // 1759
      // for each document we modify.. but usually we're not                                                           // 1760
      // modifying that many documents, so we'll let it slide for                                                      // 1761
      // now                                                                                                           // 1762
      // XXX Minimongo.Matcher isn't up for the job, because we need                                                   // 1764
      // to permit stuff like {$pull: {a: {$gt: 4}}}.. something                                                       // 1765
      // like {$gt: 4} is not normally a complete selector.                                                            // 1766
      // same issue as $elemMatch possibly?                                                                            // 1767
      var matcher = new Minimongo.Matcher(arg);                                                                        // 1768
      out = toPull.filter(function (element) {                                                                         // 1770
        return !matcher.documentMatches(element).result;                                                               // 1770
      });                                                                                                              // 1770
    } else {                                                                                                           // 1771
      out = toPull.filter(function (element) {                                                                         // 1772
        return !LocalCollection._f._equal(element, arg);                                                               // 1772
      });                                                                                                              // 1772
    }                                                                                                                  // 1773
                                                                                                                       //
    target[field] = out;                                                                                               // 1775
  },                                                                                                                   // 1776
  $pullAll: function (target, field, arg) {                                                                            // 1777
    if (!((typeof arg === "undefined" ? "undefined" : (0, _typeof3.default)(arg)) === 'object' && arg instanceof Array)) {
      throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only', {                                      // 1779
        field: field                                                                                                   // 1781
      });                                                                                                              // 1781
    }                                                                                                                  // 1783
                                                                                                                       //
    if (target === undefined) {                                                                                        // 1785
      return;                                                                                                          // 1786
    }                                                                                                                  // 1787
                                                                                                                       //
    var toPull = target[field];                                                                                        // 1789
                                                                                                                       //
    if (toPull === undefined) {                                                                                        // 1791
      return;                                                                                                          // 1792
    }                                                                                                                  // 1793
                                                                                                                       //
    if (!(toPull instanceof Array)) {                                                                                  // 1795
      throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', {                                       // 1796
        field: field                                                                                                   // 1798
      });                                                                                                              // 1798
    }                                                                                                                  // 1800
                                                                                                                       //
    target[field] = toPull.filter(function (object) {                                                                  // 1802
      return !arg.some(function (element) {                                                                            // 1802
        return LocalCollection._f._equal(object, element);                                                             // 1803
      });                                                                                                              // 1803
    });                                                                                                                // 1802
  },                                                                                                                   // 1805
  $rename: function (target, field, arg, keypath, doc) {                                                               // 1806
    // no idea why mongo has this restriction..                                                                        // 1807
    if (keypath === arg) {                                                                                             // 1808
      throw MinimongoError('$rename source must differ from target', {                                                 // 1809
        field: field                                                                                                   // 1809
      });                                                                                                              // 1809
    }                                                                                                                  // 1810
                                                                                                                       //
    if (target === null) {                                                                                             // 1812
      throw MinimongoError('$rename source field invalid', {                                                           // 1813
        field: field                                                                                                   // 1813
      });                                                                                                              // 1813
    }                                                                                                                  // 1814
                                                                                                                       //
    if (typeof arg !== 'string') {                                                                                     // 1816
      throw MinimongoError('$rename target must be a string', {                                                        // 1817
        field: field                                                                                                   // 1817
      });                                                                                                              // 1817
    }                                                                                                                  // 1818
                                                                                                                       //
    if (arg.includes('\0')) {                                                                                          // 1820
      // Null bytes are not allowed in Mongo field names                                                               // 1821
      // https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names                                 // 1822
      throw MinimongoError('The \'to\' field for $rename cannot contain an embedded null byte', {                      // 1823
        field: field                                                                                                   // 1825
      });                                                                                                              // 1825
    }                                                                                                                  // 1827
                                                                                                                       //
    if (target === undefined) {                                                                                        // 1829
      return;                                                                                                          // 1830
    }                                                                                                                  // 1831
                                                                                                                       //
    var object = target[field];                                                                                        // 1833
    delete target[field];                                                                                              // 1835
    var keyparts = arg.split('.');                                                                                     // 1837
    var target2 = findModTarget(doc, keyparts, {                                                                       // 1838
      forbidArray: true                                                                                                // 1838
    });                                                                                                                // 1838
                                                                                                                       //
    if (target2 === null) {                                                                                            // 1840
      throw MinimongoError('$rename target field invalid', {                                                           // 1841
        field: field                                                                                                   // 1841
      });                                                                                                              // 1841
    }                                                                                                                  // 1842
                                                                                                                       //
    target2[keyparts.pop()] = object;                                                                                  // 1844
  },                                                                                                                   // 1845
  $bit: function (target, field, arg) {                                                                                // 1846
    // XXX mongo only supports $bit on integers, and we only support                                                   // 1847
    // native javascript numbers (doubles) so far, so we can't support $bit                                            // 1848
    throw MinimongoError('$bit is not supported', {                                                                    // 1849
      field: field                                                                                                     // 1849
    });                                                                                                                // 1849
  }                                                                                                                    // 1850
};                                                                                                                     // 1448
var NO_CREATE_MODIFIERS = {                                                                                            // 1853
  $pop: true,                                                                                                          // 1854
  $pull: true,                                                                                                         // 1855
  $pullAll: true,                                                                                                      // 1856
  $rename: true,                                                                                                       // 1857
  $unset: true                                                                                                         // 1858
}; // Make sure field names do not contain Mongo restricted                                                            // 1853
// characters ('.', '$', '\0').                                                                                        // 1862
// https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names                                       // 1863
                                                                                                                       //
var invalidCharMsg = {                                                                                                 // 1864
  $: 'start with \'$\'',                                                                                               // 1865
  '.': 'contain \'.\'',                                                                                                // 1866
  '\0': 'contain null bytes'                                                                                           // 1867
}; // checks if all field names in an object are valid                                                                 // 1864
                                                                                                                       //
function assertHasValidFieldNames(doc) {                                                                               // 1871
  if (doc && (typeof doc === "undefined" ? "undefined" : (0, _typeof3.default)(doc)) === 'object') {                   // 1872
    JSON.stringify(doc, function (key, value) {                                                                        // 1873
      assertIsValidFieldName(key);                                                                                     // 1874
      return value;                                                                                                    // 1875
    });                                                                                                                // 1876
  }                                                                                                                    // 1877
}                                                                                                                      // 1878
                                                                                                                       //
function assertIsValidFieldName(key) {                                                                                 // 1880
  var match = void 0;                                                                                                  // 1881
                                                                                                                       //
  if (typeof key === 'string' && (match = key.match(/^\$|\.|\0/))) {                                                   // 1882
    throw MinimongoError("Key " + key + " must not " + invalidCharMsg[match[0]]);                                      // 1883
  }                                                                                                                    // 1884
} // for a.b.c.2.d.e, keyparts should be ['a', 'b', 'c', '2', 'd', 'e'],                                               // 1885
// and then you would operate on the 'e' property of the returned                                                      // 1888
// object.                                                                                                             // 1889
//                                                                                                                     // 1890
// if options.noCreate is falsey, creates intermediate levels of                                                       // 1891
// structure as necessary, like mkdir -p (and raises an exception if                                                   // 1892
// that would mean giving a non-numeric property to an array.) if                                                      // 1893
// options.noCreate is true, return undefined instead.                                                                 // 1894
//                                                                                                                     // 1895
// may modify the last element of keyparts to signal to the caller that it needs                                       // 1896
// to use a different value to index into the returned object (for example,                                            // 1897
// ['a', '01'] -> ['a', 1]).                                                                                           // 1898
//                                                                                                                     // 1899
// if forbidArray is true, return null if the keypath goes through an array.                                           // 1900
//                                                                                                                     // 1901
// if options.arrayIndices is set, use its first element for the (first) '$' in                                        // 1902
// the path.                                                                                                           // 1903
                                                                                                                       //
                                                                                                                       //
function findModTarget(doc, keyparts) {                                                                                // 1904
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                                // 1904
  var usedArrayIndex = false;                                                                                          // 1905
                                                                                                                       //
  for (var i = 0; i < keyparts.length; i++) {                                                                          // 1907
    var last = i === keyparts.length - 1;                                                                              // 1908
    var keypart = keyparts[i];                                                                                         // 1909
                                                                                                                       //
    if (!isIndexable(doc)) {                                                                                           // 1911
      if (options.noCreate) {                                                                                          // 1912
        return undefined;                                                                                              // 1913
      }                                                                                                                // 1914
                                                                                                                       //
      var error = MinimongoError("cannot use the part '" + keypart + "' to traverse " + doc);                          // 1916
      error.setPropertyError = true;                                                                                   // 1919
      throw error;                                                                                                     // 1920
    }                                                                                                                  // 1921
                                                                                                                       //
    if (doc instanceof Array) {                                                                                        // 1923
      if (options.forbidArray) {                                                                                       // 1924
        return null;                                                                                                   // 1925
      }                                                                                                                // 1926
                                                                                                                       //
      if (keypart === '$') {                                                                                           // 1928
        if (usedArrayIndex) {                                                                                          // 1929
          throw MinimongoError('Too many positional (i.e. \'$\') elements');                                           // 1930
        }                                                                                                              // 1931
                                                                                                                       //
        if (!options.arrayIndices || !options.arrayIndices.length) {                                                   // 1933
          throw MinimongoError('The positional operator did not find the match needed from the ' + 'query');           // 1934
        }                                                                                                              // 1938
                                                                                                                       //
        keypart = options.arrayIndices[0];                                                                             // 1940
        usedArrayIndex = true;                                                                                         // 1941
      } else if (isNumericKey(keypart)) {                                                                              // 1942
        keypart = parseInt(keypart);                                                                                   // 1943
      } else {                                                                                                         // 1944
        if (options.noCreate) {                                                                                        // 1945
          return undefined;                                                                                            // 1946
        }                                                                                                              // 1947
                                                                                                                       //
        throw MinimongoError("can't append to array using string field name [" + keypart + "]");                       // 1949
      }                                                                                                                // 1952
                                                                                                                       //
      if (last) {                                                                                                      // 1954
        keyparts[i] = keypart; // handle 'a.01'                                                                        // 1955
      }                                                                                                                // 1956
                                                                                                                       //
      if (options.noCreate && keypart >= doc.length) {                                                                 // 1958
        return undefined;                                                                                              // 1959
      }                                                                                                                // 1960
                                                                                                                       //
      while (doc.length < keypart) {                                                                                   // 1962
        doc.push(null);                                                                                                // 1963
      }                                                                                                                // 1964
                                                                                                                       //
      if (!last) {                                                                                                     // 1966
        if (doc.length === keypart) {                                                                                  // 1967
          doc.push({});                                                                                                // 1968
        } else if ((0, _typeof3.default)(doc[keypart]) !== 'object') {                                                 // 1969
          throw MinimongoError("can't modify field '" + keyparts[i + 1] + "' of list value " + JSON.stringify(doc[keypart]));
        }                                                                                                              // 1974
      }                                                                                                                // 1975
    } else {                                                                                                           // 1976
      assertIsValidFieldName(keypart);                                                                                 // 1977
                                                                                                                       //
      if (!(keypart in doc)) {                                                                                         // 1979
        if (options.noCreate) {                                                                                        // 1980
          return undefined;                                                                                            // 1981
        }                                                                                                              // 1982
                                                                                                                       //
        if (!last) {                                                                                                   // 1984
          doc[keypart] = {};                                                                                           // 1985
        }                                                                                                              // 1986
      }                                                                                                                // 1987
    }                                                                                                                  // 1988
                                                                                                                       //
    if (last) {                                                                                                        // 1990
      return doc;                                                                                                      // 1991
    }                                                                                                                  // 1992
                                                                                                                       //
    doc = doc[keypart];                                                                                                // 1994
  } // notreached                                                                                                      // 1995
                                                                                                                       //
}                                                                                                                      // 1998
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"matcher.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/matcher.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  "default": function () {                                                                                             // 1
    return Matcher;                                                                                                    // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var LocalCollection = void 0;                                                                                          // 1
module.watch(require("./local_collection.js"), {                                                                       // 1
  "default": function (v) {                                                                                            // 1
    LocalCollection = v;                                                                                               // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var compileDocumentSelector = void 0,                                                                                  // 1
    hasOwn = void 0,                                                                                                   // 1
    nothingMatcher = void 0;                                                                                           // 1
module.watch(require("./common.js"), {                                                                                 // 1
  compileDocumentSelector: function (v) {                                                                              // 1
    compileDocumentSelector = v;                                                                                       // 1
  },                                                                                                                   // 1
  hasOwn: function (v) {                                                                                               // 1
    hasOwn = v;                                                                                                        // 1
  },                                                                                                                   // 1
  nothingMatcher: function (v) {                                                                                       // 1
    nothingMatcher = v;                                                                                                // 1
  }                                                                                                                    // 1
}, 1);                                                                                                                 // 1
                                                                                                                       //
var Matcher = function () {                                                                                            //
  function Matcher(selector, isUpdate) {                                                                               // 29
    (0, _classCallCheck3.default)(this, Matcher);                                                                      // 29
    // A set (object mapping string -> *) of all of the document paths looked                                          // 30
    // at by the selector. Also includes the empty string if it may look at any                                        // 31
    // path (eg, $where).                                                                                              // 32
    this._paths = {}; // Set to true if compilation finds a $near.                                                     // 33
                                                                                                                       //
    this._hasGeoQuery = false; // Set to true if compilation finds a $where.                                           // 35
                                                                                                                       //
    this._hasWhere = false; // Set to false if compilation finds anything other than a simple equality                 // 37
    // or one or more of '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin' used                                       // 39
    // with scalars as operands.                                                                                       // 40
                                                                                                                       //
    this._isSimple = true; // Set to a dummy document which always matches this Matcher. Or set to null                // 41
    // if such document is too hard to find.                                                                           // 43
                                                                                                                       //
    this._matchingDocument = undefined; // A clone of the original selector. It may just be a function if the user     // 44
    // passed in a function; otherwise is definitely an object (eg, IDs are                                            // 46
    // translated into {_id: ID} first. Used by canBecomeTrueByModifier and                                            // 47
    // Sorter._useWithMatcher.                                                                                         // 48
                                                                                                                       //
    this._selector = null;                                                                                             // 49
    this._docMatcher = this._compileSelector(selector); // Set to true if selection is done for an update operation    // 50
    // Default is false                                                                                                // 52
    // Used for $near array update (issue #3599)                                                                       // 53
                                                                                                                       //
    this._isUpdate = isUpdate;                                                                                         // 54
  }                                                                                                                    // 55
                                                                                                                       //
  Matcher.prototype.documentMatches = function () {                                                                    //
    function documentMatches(doc) {                                                                                    //
      if (doc !== Object(doc)) {                                                                                       // 58
        throw Error('documentMatches needs a document');                                                               // 59
      }                                                                                                                // 60
                                                                                                                       //
      return this._docMatcher(doc);                                                                                    // 62
    }                                                                                                                  // 63
                                                                                                                       //
    return documentMatches;                                                                                            //
  }();                                                                                                                 //
                                                                                                                       //
  Matcher.prototype.hasGeoQuery = function () {                                                                        //
    function hasGeoQuery() {                                                                                           //
      return this._hasGeoQuery;                                                                                        // 66
    }                                                                                                                  // 67
                                                                                                                       //
    return hasGeoQuery;                                                                                                //
  }();                                                                                                                 //
                                                                                                                       //
  Matcher.prototype.hasWhere = function () {                                                                           //
    function hasWhere() {                                                                                              //
      return this._hasWhere;                                                                                           // 70
    }                                                                                                                  // 71
                                                                                                                       //
    return hasWhere;                                                                                                   //
  }();                                                                                                                 //
                                                                                                                       //
  Matcher.prototype.isSimple = function () {                                                                           //
    function isSimple() {                                                                                              //
      return this._isSimple;                                                                                           // 74
    }                                                                                                                  // 75
                                                                                                                       //
    return isSimple;                                                                                                   //
  }(); // Given a selector, return a function that takes one argument, a                                               //
  // document. It returns a result object.                                                                             // 78
                                                                                                                       //
                                                                                                                       //
  Matcher.prototype._compileSelector = function () {                                                                   //
    function _compileSelector(selector) {                                                                              //
      // you can pass a literal function instead of a selector                                                         // 80
      if (selector instanceof Function) {                                                                              // 81
        this._isSimple = false;                                                                                        // 82
        this._selector = selector;                                                                                     // 83
                                                                                                                       //
        this._recordPathUsed('');                                                                                      // 84
                                                                                                                       //
        return function (doc) {                                                                                        // 86
          return {                                                                                                     // 86
            result: !!selector.call(doc)                                                                               // 86
          };                                                                                                           // 86
        };                                                                                                             // 86
      } // shorthand -- scalar _id and {_id}                                                                           // 87
                                                                                                                       //
                                                                                                                       //
      if (LocalCollection._selectorIsIdPerhapsAsObject(selector)) {                                                    // 90
        var _id = selector._id || selector;                                                                            // 91
                                                                                                                       //
        this._selector = {                                                                                             // 93
          _id: _id                                                                                                     // 93
        };                                                                                                             // 93
                                                                                                                       //
        this._recordPathUsed('_id');                                                                                   // 94
                                                                                                                       //
        return function (doc) {                                                                                        // 96
          return {                                                                                                     // 96
            result: EJSON.equals(doc._id, _id)                                                                         // 96
          };                                                                                                           // 96
        };                                                                                                             // 96
      } // protect against dangerous selectors.  falsey and {_id: falsey} are both                                     // 97
      // likely programmer error, and not what you want, particularly for                                              // 100
      // destructive operations.                                                                                       // 101
                                                                                                                       //
                                                                                                                       //
      if (!selector || hasOwn.call(selector, '_id') && !selector._id) {                                                // 102
        this._isSimple = false;                                                                                        // 103
        return nothingMatcher;                                                                                         // 104
      } // Top level can't be an array or true or binary.                                                              // 105
                                                                                                                       //
                                                                                                                       //
      if (Array.isArray(selector) || EJSON.isBinary(selector) || typeof selector === 'boolean') {                      // 108
        throw new Error("Invalid selector: " + selector);                                                              // 111
      }                                                                                                                // 112
                                                                                                                       //
      this._selector = EJSON.clone(selector);                                                                          // 114
      return compileDocumentSelector(selector, this, {                                                                 // 116
        isRoot: true                                                                                                   // 116
      });                                                                                                              // 116
    }                                                                                                                  // 117
                                                                                                                       //
    return _compileSelector;                                                                                           //
  }(); // Returns a list of key paths the given selector is looking for. It includes                                   //
  // the empty string if there is a $where.                                                                            // 120
                                                                                                                       //
                                                                                                                       //
  Matcher.prototype._getPaths = function () {                                                                          //
    function _getPaths() {                                                                                             //
      return Object.keys(this._paths);                                                                                 // 122
    }                                                                                                                  // 123
                                                                                                                       //
    return _getPaths;                                                                                                  //
  }();                                                                                                                 //
                                                                                                                       //
  Matcher.prototype._recordPathUsed = function () {                                                                    //
    function _recordPathUsed(path) {                                                                                   //
      this._paths[path] = true;                                                                                        // 126
    }                                                                                                                  // 127
                                                                                                                       //
    return _recordPathUsed;                                                                                            //
  }();                                                                                                                 //
                                                                                                                       //
  return Matcher;                                                                                                      //
}();                                                                                                                   //
                                                                                                                       //
// helpers used by compiled selector code                                                                              // 130
LocalCollection._f = {                                                                                                 // 131
  // XXX for _all and _in, consider building 'inquery' at compile time..                                               // 132
  _type: function (v) {                                                                                                // 133
    if (typeof v === 'number') {                                                                                       // 134
      return 1;                                                                                                        // 135
    }                                                                                                                  // 136
                                                                                                                       //
    if (typeof v === 'string') {                                                                                       // 138
      return 2;                                                                                                        // 139
    }                                                                                                                  // 140
                                                                                                                       //
    if (typeof v === 'boolean') {                                                                                      // 142
      return 8;                                                                                                        // 143
    }                                                                                                                  // 144
                                                                                                                       //
    if (Array.isArray(v)) {                                                                                            // 146
      return 4;                                                                                                        // 147
    }                                                                                                                  // 148
                                                                                                                       //
    if (v === null) {                                                                                                  // 150
      return 10;                                                                                                       // 151
    } // note that typeof(/x/) === "object"                                                                            // 152
                                                                                                                       //
                                                                                                                       //
    if (v instanceof RegExp) {                                                                                         // 155
      return 11;                                                                                                       // 156
    }                                                                                                                  // 157
                                                                                                                       //
    if (typeof v === 'function') {                                                                                     // 159
      return 13;                                                                                                       // 160
    }                                                                                                                  // 161
                                                                                                                       //
    if (v instanceof Date) {                                                                                           // 163
      return 9;                                                                                                        // 164
    }                                                                                                                  // 165
                                                                                                                       //
    if (EJSON.isBinary(v)) {                                                                                           // 167
      return 5;                                                                                                        // 168
    }                                                                                                                  // 169
                                                                                                                       //
    if (v instanceof MongoID.ObjectID) {                                                                               // 171
      return 7;                                                                                                        // 172
    } // object                                                                                                        // 173
                                                                                                                       //
                                                                                                                       //
    return 3; // XXX support some/all of these:                                                                        // 176
    // 14, symbol                                                                                                      // 179
    // 15, javascript code with scope                                                                                  // 180
    // 16, 18: 32-bit/64-bit integer                                                                                   // 181
    // 17, timestamp                                                                                                   // 182
    // 255, minkey                                                                                                     // 183
    // 127, maxkey                                                                                                     // 184
  },                                                                                                                   // 185
  // deep equality test: use for literal document and array matches                                                    // 187
  _equal: function (a, b) {                                                                                            // 188
    return EJSON.equals(a, b, {                                                                                        // 189
      keyOrderSensitive: true                                                                                          // 189
    });                                                                                                                // 189
  },                                                                                                                   // 190
  // maps a type code to a value that can be used to sort values of different                                          // 192
  // types                                                                                                             // 193
  _typeorder: function (t) {                                                                                           // 194
    // http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types                                    // 195
    // XXX what is the correct sort position for Javascript code?                                                      // 196
    // ('100' in the matrix below)                                                                                     // 197
    // XXX minkey/maxkey                                                                                               // 198
    return [-1, // (not a type)                                                                                        // 199
    1, // number                                                                                                       // 201
    2, // string                                                                                                       // 202
    3, // object                                                                                                       // 203
    4, // array                                                                                                        // 204
    5, // binary                                                                                                       // 205
    -1, // deprecated                                                                                                  // 206
    6, // ObjectID                                                                                                     // 207
    7, // bool                                                                                                         // 208
    8, // Date                                                                                                         // 209
    0, // null                                                                                                         // 210
    9, // RegExp                                                                                                       // 211
    -1, // deprecated                                                                                                  // 212
    100, // JS code                                                                                                    // 213
    2, // deprecated (symbol)                                                                                          // 214
    100, // JS code                                                                                                    // 215
    1, // 32-bit int                                                                                                   // 216
    8, // Mongo timestamp                                                                                              // 217
    1 // 64-bit int                                                                                                    // 218
    ][t];                                                                                                              // 199
  },                                                                                                                   // 220
  // compare two values of unknown type according to BSON ordering                                                     // 222
  // semantics. (as an extension, consider 'undefined' to be less than                                                 // 223
  // any other value.) return negative if a is less, positive if b is                                                  // 224
  // less, or 0 if equal                                                                                               // 225
  _cmp: function (a, b) {                                                                                              // 226
    if (a === undefined) {                                                                                             // 227
      return b === undefined ? 0 : -1;                                                                                 // 228
    }                                                                                                                  // 229
                                                                                                                       //
    if (b === undefined) {                                                                                             // 231
      return 1;                                                                                                        // 232
    }                                                                                                                  // 233
                                                                                                                       //
    var ta = LocalCollection._f._type(a);                                                                              // 235
                                                                                                                       //
    var tb = LocalCollection._f._type(b);                                                                              // 236
                                                                                                                       //
    var oa = LocalCollection._f._typeorder(ta);                                                                        // 238
                                                                                                                       //
    var ob = LocalCollection._f._typeorder(tb);                                                                        // 239
                                                                                                                       //
    if (oa !== ob) {                                                                                                   // 241
      return oa < ob ? -1 : 1;                                                                                         // 242
    } // XXX need to implement this if we implement Symbol or integers, or                                             // 243
    // Timestamp                                                                                                       // 246
                                                                                                                       //
                                                                                                                       //
    if (ta !== tb) {                                                                                                   // 247
      throw Error('Missing type coercion logic in _cmp');                                                              // 248
    }                                                                                                                  // 249
                                                                                                                       //
    if (ta === 7) {                                                                                                    // 251
      // ObjectID                                                                                                      // 251
      // Convert to string.                                                                                            // 252
      ta = tb = 2;                                                                                                     // 253
      a = a.toHexString();                                                                                             // 254
      b = b.toHexString();                                                                                             // 255
    }                                                                                                                  // 256
                                                                                                                       //
    if (ta === 9) {                                                                                                    // 258
      // Date                                                                                                          // 258
      // Convert to millis.                                                                                            // 259
      ta = tb = 1;                                                                                                     // 260
      a = a.getTime();                                                                                                 // 261
      b = b.getTime();                                                                                                 // 262
    }                                                                                                                  // 263
                                                                                                                       //
    if (ta === 1) // double                                                                                            // 265
      return a - b;                                                                                                    // 266
    if (tb === 2) // string                                                                                            // 268
      return a < b ? -1 : a === b ? 0 : 1;                                                                             // 269
                                                                                                                       //
    if (ta === 3) {                                                                                                    // 271
      // Object                                                                                                        // 271
      // this could be much more efficient in the expected case ...                                                    // 272
      var toArray = function (object) {                                                                                // 273
        var result = [];                                                                                               // 274
        Object.keys(object).forEach(function (key) {                                                                   // 276
          result.push(key, object[key]);                                                                               // 277
        });                                                                                                            // 278
        return result;                                                                                                 // 280
      };                                                                                                               // 281
                                                                                                                       //
      return LocalCollection._f._cmp(toArray(a), toArray(b));                                                          // 283
    }                                                                                                                  // 284
                                                                                                                       //
    if (ta === 4) {                                                                                                    // 286
      // Array                                                                                                         // 286
      for (var i = 0;; i++) {                                                                                          // 287
        if (i === a.length) {                                                                                          // 288
          return i === b.length ? 0 : -1;                                                                              // 289
        }                                                                                                              // 290
                                                                                                                       //
        if (i === b.length) {                                                                                          // 292
          return 1;                                                                                                    // 293
        }                                                                                                              // 294
                                                                                                                       //
        var s = LocalCollection._f._cmp(a[i], b[i]);                                                                   // 296
                                                                                                                       //
        if (s !== 0) {                                                                                                 // 297
          return s;                                                                                                    // 298
        }                                                                                                              // 299
      }                                                                                                                // 300
    }                                                                                                                  // 301
                                                                                                                       //
    if (ta === 5) {                                                                                                    // 303
      // binary                                                                                                        // 303
      // Surprisingly, a small binary blob is always less than a large one in                                          // 304
      // Mongo.                                                                                                        // 305
      if (a.length !== b.length) {                                                                                     // 306
        return a.length - b.length;                                                                                    // 307
      }                                                                                                                // 308
                                                                                                                       //
      for (var _i = 0; _i < a.length; _i++) {                                                                          // 310
        if (a[_i] < b[_i]) {                                                                                           // 311
          return -1;                                                                                                   // 312
        }                                                                                                              // 313
                                                                                                                       //
        if (a[_i] > b[_i]) {                                                                                           // 315
          return 1;                                                                                                    // 316
        }                                                                                                              // 317
      }                                                                                                                // 318
                                                                                                                       //
      return 0;                                                                                                        // 320
    }                                                                                                                  // 321
                                                                                                                       //
    if (ta === 8) {                                                                                                    // 323
      // boolean                                                                                                       // 323
      if (a) {                                                                                                         // 324
        return b ? 0 : 1;                                                                                              // 325
      }                                                                                                                // 326
                                                                                                                       //
      return b ? -1 : 0;                                                                                               // 328
    }                                                                                                                  // 329
                                                                                                                       //
    if (ta === 10) // null                                                                                             // 331
      return 0;                                                                                                        // 332
    if (ta === 11) // regexp                                                                                           // 334
      throw Error('Sorting not supported on regular expression'); // XXX                                               // 335
    // 13: javascript code                                                                                             // 337
    // 14: symbol                                                                                                      // 338
    // 15: javascript code with scope                                                                                  // 339
    // 16: 32-bit integer                                                                                              // 340
    // 17: timestamp                                                                                                   // 341
    // 18: 64-bit integer                                                                                              // 342
    // 255: minkey                                                                                                     // 343
    // 127: maxkey                                                                                                     // 344
                                                                                                                       //
    if (ta === 13) // javascript code                                                                                  // 345
      throw Error('Sorting not supported on Javascript code'); // XXX                                                  // 346
                                                                                                                       //
    throw Error('Unknown type to sort');                                                                               // 348
  }                                                                                                                    // 349
};                                                                                                                     // 131
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"minimongo_common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/minimongo_common.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var LocalCollection_ = void 0;                                                                                         // 1
module.watch(require("./local_collection.js"), {                                                                       // 1
    "default": function (v) {                                                                                          // 1
        LocalCollection_ = v;                                                                                          // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Matcher = void 0;                                                                                                  // 1
module.watch(require("./matcher.js"), {                                                                                // 1
    "default": function (v) {                                                                                          // 1
        Matcher = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Sorter = void 0;                                                                                                   // 1
module.watch(require("./sorter.js"), {                                                                                 // 1
    "default": function (v) {                                                                                          // 1
        Sorter = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
LocalCollection = LocalCollection_;                                                                                    // 5
Minimongo = {                                                                                                          // 6
    LocalCollection: LocalCollection_,                                                                                 // 7
    Matcher: Matcher,                                                                                                  // 8
    Sorter: Sorter                                                                                                     // 9
};                                                                                                                     // 6
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_handle.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/observe_handle.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  "default": function () {                                                                                             // 1
    return ObserveHandle;                                                                                              // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
                                                                                                                       //
var ObserveHandle = function () {                                                                                      //
  function ObserveHandle() {                                                                                           //
    (0, _classCallCheck3.default)(this, ObserveHandle);                                                                //
  }                                                                                                                    //
                                                                                                                       //
  return ObserveHandle;                                                                                                //
}();                                                                                                                   //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sorter.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/sorter.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  "default": function () {                                                                                             // 1
    return Sorter;                                                                                                     // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var ELEMENT_OPERATORS = void 0,                                                                                        // 1
    equalityElementMatcher = void 0,                                                                                   // 1
    expandArraysInBranches = void 0,                                                                                   // 1
    hasOwn = void 0,                                                                                                   // 1
    isOperatorObject = void 0,                                                                                         // 1
    makeLookupFunction = void 0,                                                                                       // 1
    regexpElementMatcher = void 0;                                                                                     // 1
module.watch(require("./common.js"), {                                                                                 // 1
  ELEMENT_OPERATORS: function (v) {                                                                                    // 1
    ELEMENT_OPERATORS = v;                                                                                             // 1
  },                                                                                                                   // 1
  equalityElementMatcher: function (v) {                                                                               // 1
    equalityElementMatcher = v;                                                                                        // 1
  },                                                                                                                   // 1
  expandArraysInBranches: function (v) {                                                                               // 1
    expandArraysInBranches = v;                                                                                        // 1
  },                                                                                                                   // 1
  hasOwn: function (v) {                                                                                               // 1
    hasOwn = v;                                                                                                        // 1
  },                                                                                                                   // 1
  isOperatorObject: function (v) {                                                                                     // 1
    isOperatorObject = v;                                                                                              // 1
  },                                                                                                                   // 1
  makeLookupFunction: function (v) {                                                                                   // 1
    makeLookupFunction = v;                                                                                            // 1
  },                                                                                                                   // 1
  regexpElementMatcher: function (v) {                                                                                 // 1
    regexpElementMatcher = v;                                                                                          // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
                                                                                                                       //
var Sorter = function () {                                                                                             //
  function Sorter(spec) {                                                                                              // 25
    var _this = this;                                                                                                  // 25
                                                                                                                       //
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                              // 25
    (0, _classCallCheck3.default)(this, Sorter);                                                                       // 25
    this._sortSpecParts = [];                                                                                          // 26
    this._sortFunction = null;                                                                                         // 27
                                                                                                                       //
    var addSpecPart = function (path, ascending) {                                                                     // 29
      if (!path) {                                                                                                     // 30
        throw Error('sort keys must be non-empty');                                                                    // 31
      }                                                                                                                // 32
                                                                                                                       //
      if (path.charAt(0) === '$') {                                                                                    // 34
        throw Error("unsupported sort key: " + path);                                                                  // 35
      }                                                                                                                // 36
                                                                                                                       //
      _this._sortSpecParts.push({                                                                                      // 38
        ascending: ascending,                                                                                          // 39
        lookup: makeLookupFunction(path, {                                                                             // 40
          forSort: true                                                                                                // 40
        }),                                                                                                            // 40
        path: path                                                                                                     // 41
      });                                                                                                              // 38
    };                                                                                                                 // 43
                                                                                                                       //
    if (spec instanceof Array) {                                                                                       // 45
      spec.forEach(function (element) {                                                                                // 46
        if (typeof element === 'string') {                                                                             // 47
          addSpecPart(element, true);                                                                                  // 48
        } else {                                                                                                       // 49
          addSpecPart(element[0], element[1] !== 'desc');                                                              // 50
        }                                                                                                              // 51
      });                                                                                                              // 52
    } else if ((typeof spec === "undefined" ? "undefined" : (0, _typeof3.default)(spec)) === 'object') {               // 53
      Object.keys(spec).forEach(function (key) {                                                                       // 54
        addSpecPart(key, spec[key] >= 0);                                                                              // 55
      });                                                                                                              // 56
    } else if (typeof spec === 'function') {                                                                           // 57
      this._sortFunction = spec;                                                                                       // 58
    } else {                                                                                                           // 59
      throw Error("Bad sort specification: " + JSON.stringify(spec));                                                  // 60
    } // If a function is specified for sorting, we skip the rest.                                                     // 61
                                                                                                                       //
                                                                                                                       //
    if (this._sortFunction) {                                                                                          // 64
      return;                                                                                                          // 65
    } // To implement affectedByModifier, we piggy-back on top of Matcher's                                            // 66
    // affectedByModifier code; we create a selector that is affected by the                                           // 69
    // same modifiers as this sort order. This is only implemented on the                                              // 70
    // server.                                                                                                         // 71
                                                                                                                       //
                                                                                                                       //
    if (this.affectedByModifier) {                                                                                     // 72
      var selector = {};                                                                                               // 73
                                                                                                                       //
      this._sortSpecParts.forEach(function (spec) {                                                                    // 75
        selector[spec.path] = 1;                                                                                       // 76
      });                                                                                                              // 77
                                                                                                                       //
      this._selectorForAffectedByModifier = new Minimongo.Matcher(selector);                                           // 79
    }                                                                                                                  // 80
                                                                                                                       //
    this._keyComparator = composeComparators(this._sortSpecParts.map(function (spec, i) {                              // 82
      return _this._keyFieldComparator(i);                                                                             // 83
    })); // If you specify a matcher for this Sorter, _keyFilter may be set to a                                       // 83
    // function which selects whether or not a given "sort key" (tuple of values                                       // 87
    // for the different sort spec fields) is compatible with the selector.                                            // 88
                                                                                                                       //
    this._keyFilter = null;                                                                                            // 89
                                                                                                                       //
    if (options.matcher) {                                                                                             // 91
      this._useWithMatcher(options.matcher);                                                                           // 92
    }                                                                                                                  // 93
  }                                                                                                                    // 94
                                                                                                                       //
  Sorter.prototype.getComparator = function () {                                                                       //
    function getComparator(options) {                                                                                  //
      // If sort is specified or have no distances, just use the comparator from                                       // 97
      // the source specification (which defaults to "everything is equal".                                            // 98
      // issue #3599                                                                                                   // 99
      // https://docs.mongodb.com/manual/reference/operator/query/near/#sort-operation                                 // 100
      // sort effectively overrides $near                                                                              // 101
      if (this._sortSpecParts.length || !options || !options.distances) {                                              // 102
        return this._getBaseComparator();                                                                              // 103
      }                                                                                                                // 104
                                                                                                                       //
      var distances = options.distances; // Return a comparator which compares using $near distances.                  // 106
                                                                                                                       //
      return function (a, b) {                                                                                         // 109
        if (!distances.has(a._id)) {                                                                                   // 110
          throw Error("Missing distance for " + a._id);                                                                // 111
        }                                                                                                              // 112
                                                                                                                       //
        if (!distances.has(b._id)) {                                                                                   // 114
          throw Error("Missing distance for " + b._id);                                                                // 115
        }                                                                                                              // 116
                                                                                                                       //
        return distances.get(a._id) - distances.get(b._id);                                                            // 118
      };                                                                                                               // 119
    }                                                                                                                  // 120
                                                                                                                       //
    return getComparator;                                                                                              //
  }(); // Takes in two keys: arrays whose lengths match the number of spec                                             //
  // parts. Returns negative, 0, or positive based on using the sort spec to                                           // 123
  // compare fields.                                                                                                   // 124
                                                                                                                       //
                                                                                                                       //
  Sorter.prototype._compareKeys = function () {                                                                        //
    function _compareKeys(key1, key2) {                                                                                //
      if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {                  // 126
        throw Error('Key has wrong length');                                                                           // 128
      }                                                                                                                // 129
                                                                                                                       //
      return this._keyComparator(key1, key2);                                                                          // 131
    }                                                                                                                  // 132
                                                                                                                       //
    return _compareKeys;                                                                                               //
  }(); // Iterates over each possible "key" from doc (ie, over each branch), calling                                   //
  // 'cb' with the key.                                                                                                // 135
                                                                                                                       //
                                                                                                                       //
  Sorter.prototype._generateKeysFromDoc = function () {                                                                //
    function _generateKeysFromDoc(doc, cb) {                                                                           //
      if (this._sortSpecParts.length === 0) {                                                                          // 137
        throw new Error('can\'t generate keys without a spec');                                                        // 138
      }                                                                                                                // 139
                                                                                                                       //
      var pathFromIndices = function (indices) {                                                                       // 141
        return indices.join(',') + ",";                                                                                // 141
      };                                                                                                               // 141
                                                                                                                       //
      var knownPaths = null; // maps index -> ({'' -> value} or {path -> value})                                       // 143
                                                                                                                       //
      var valuesByIndexAndPath = this._sortSpecParts.map(function (spec) {                                             // 146
        // Expand any leaf arrays that we find, and ignore those arrays                                                // 147
        // themselves.  (We never sort based on an array itself.)                                                      // 148
        var branches = expandArraysInBranches(spec.lookup(doc), true); // If there are no values for a key (eg, key goes to an empty array),
        // pretend we found one null value.                                                                            // 152
                                                                                                                       //
        if (!branches.length) {                                                                                        // 153
          branches = [{                                                                                                // 154
            value: null                                                                                                // 154
          }];                                                                                                          // 154
        }                                                                                                              // 155
                                                                                                                       //
        var element = Object.create(null);                                                                             // 157
        var usedPaths = false;                                                                                         // 158
        branches.forEach(function (branch) {                                                                           // 160
          if (!branch.arrayIndices) {                                                                                  // 161
            // If there are no array indices for a branch, then it must be the                                         // 162
            // only branch, because the only thing that produces multiple branches                                     // 163
            // is the use of arrays.                                                                                   // 164
            if (branches.length > 1) {                                                                                 // 165
              throw Error('multiple branches but no array used?');                                                     // 166
            }                                                                                                          // 167
                                                                                                                       //
            element[''] = branch.value;                                                                                // 169
            return;                                                                                                    // 170
          }                                                                                                            // 171
                                                                                                                       //
          usedPaths = true;                                                                                            // 173
          var path = pathFromIndices(branch.arrayIndices);                                                             // 175
                                                                                                                       //
          if (hasOwn.call(element, path)) {                                                                            // 177
            throw Error("duplicate path: " + path);                                                                    // 178
          }                                                                                                            // 179
                                                                                                                       //
          element[path] = branch.value; // If two sort fields both go into arrays, they have to go into the            // 181
          // exact same arrays and we have to find the same paths.  This is                                            // 184
          // roughly the same condition that makes MongoDB throw this strange                                          // 185
          // error message.  eg, the main thing is that if sort spec is {a: 1,                                         // 186
          // b:1} then a and b cannot both be arrays.                                                                  // 187
          //                                                                                                           // 188
          // (In MongoDB it seems to be OK to have {a: 1, 'a.x.y': 1} where 'a'                                        // 189
          // and 'a.x.y' are both arrays, but we don't allow this for now.                                             // 190
          // #NestedArraySort                                                                                          // 191
          // XXX achieve full compatibility here                                                                       // 192
                                                                                                                       //
          if (knownPaths && !hasOwn.call(knownPaths, path)) {                                                          // 193
            throw Error('cannot index parallel arrays');                                                               // 194
          }                                                                                                            // 195
        });                                                                                                            // 196
                                                                                                                       //
        if (knownPaths) {                                                                                              // 198
          // Similarly to above, paths must match everywhere, unless this is a                                         // 199
          // non-array field.                                                                                          // 200
          if (!hasOwn.call(element, '') && Object.keys(knownPaths).length !== Object.keys(element).length) {           // 201
            throw Error('cannot index parallel arrays!');                                                              // 203
          }                                                                                                            // 204
        } else if (usedPaths) {                                                                                        // 205
          knownPaths = {};                                                                                             // 206
          Object.keys(element).forEach(function (path) {                                                               // 208
            knownPaths[path] = true;                                                                                   // 209
          });                                                                                                          // 210
        }                                                                                                              // 211
                                                                                                                       //
        return element;                                                                                                // 213
      });                                                                                                              // 214
                                                                                                                       //
      if (!knownPaths) {                                                                                               // 216
        // Easy case: no use of arrays.                                                                                // 217
        var soleKey = valuesByIndexAndPath.map(function (values) {                                                     // 218
          if (!hasOwn.call(values, '')) {                                                                              // 219
            throw Error('no value in sole key case?');                                                                 // 220
          }                                                                                                            // 221
                                                                                                                       //
          return values[''];                                                                                           // 223
        });                                                                                                            // 224
        cb(soleKey);                                                                                                   // 226
        return;                                                                                                        // 228
      }                                                                                                                // 229
                                                                                                                       //
      Object.keys(knownPaths).forEach(function (path) {                                                                // 231
        var key = valuesByIndexAndPath.map(function (values) {                                                         // 232
          if (hasOwn.call(values, '')) {                                                                               // 233
            return values[''];                                                                                         // 234
          }                                                                                                            // 235
                                                                                                                       //
          if (!hasOwn.call(values, path)) {                                                                            // 237
            throw Error('missing path?');                                                                              // 238
          }                                                                                                            // 239
                                                                                                                       //
          return values[path];                                                                                         // 241
        });                                                                                                            // 242
        cb(key);                                                                                                       // 244
      });                                                                                                              // 245
    }                                                                                                                  // 246
                                                                                                                       //
    return _generateKeysFromDoc;                                                                                       //
  }(); // Returns a comparator that represents the sort specification (but not                                         //
  // including a possible geoquery distance tie-breaker).                                                              // 249
                                                                                                                       //
                                                                                                                       //
  Sorter.prototype._getBaseComparator = function () {                                                                  //
    function _getBaseComparator() {                                                                                    //
      var _this2 = this;                                                                                               // 250
                                                                                                                       //
      if (this._sortFunction) {                                                                                        // 251
        return this._sortFunction;                                                                                     // 252
      } // If we're only sorting on geoquery distance and no specs, just say                                           // 253
      // everything is equal.                                                                                          // 256
                                                                                                                       //
                                                                                                                       //
      if (!this._sortSpecParts.length) {                                                                               // 257
        return function (doc1, doc2) {                                                                                 // 258
          return 0;                                                                                                    // 258
        };                                                                                                             // 258
      }                                                                                                                // 259
                                                                                                                       //
      return function (doc1, doc2) {                                                                                   // 261
        var key1 = _this2._getMinKeyFromDoc(doc1);                                                                     // 262
                                                                                                                       //
        var key2 = _this2._getMinKeyFromDoc(doc2);                                                                     // 263
                                                                                                                       //
        return _this2._compareKeys(key1, key2);                                                                        // 264
      };                                                                                                               // 265
    }                                                                                                                  // 266
                                                                                                                       //
    return _getBaseComparator;                                                                                         //
  }(); // Finds the minimum key from the doc, according to the sort specs.  (We say                                    //
  // "minimum" here but this is with respect to the sort spec, so "descending"                                         // 269
  // sort fields mean we're finding the max for that field.)                                                           // 270
  //                                                                                                                   // 271
  // Note that this is NOT "find the minimum value of the first field, the                                             // 272
  // minimum value of the second field, etc"... it's "choose the                                                       // 273
  // lexicographically minimum value of the key vector, allowing only keys which                                       // 274
  // you can find along the same paths".  ie, for a doc {a: [{x: 0, y: 5}, {x:                                         // 275
  // 1, y: 3}]} with sort spec {'a.x': 1, 'a.y': 1}, the only keys are [0,5] and                                       // 276
  // [1,3], and the minimum key is [0,5]; notably, [0,3] is NOT a key.                                                 // 277
                                                                                                                       //
                                                                                                                       //
  Sorter.prototype._getMinKeyFromDoc = function () {                                                                   //
    function _getMinKeyFromDoc(doc) {                                                                                  //
      var _this3 = this;                                                                                               // 278
                                                                                                                       //
      var minKey = null;                                                                                               // 279
                                                                                                                       //
      this._generateKeysFromDoc(doc, function (key) {                                                                  // 281
        if (!_this3._keyCompatibleWithSelector(key)) {                                                                 // 282
          return;                                                                                                      // 283
        }                                                                                                              // 284
                                                                                                                       //
        if (minKey === null) {                                                                                         // 286
          minKey = key;                                                                                                // 287
          return;                                                                                                      // 288
        }                                                                                                              // 289
                                                                                                                       //
        if (_this3._compareKeys(key, minKey) < 0) {                                                                    // 291
          minKey = key;                                                                                                // 292
        }                                                                                                              // 293
      }); // This could happen if our key filter somehow filters out all the keys even                                 // 294
      // though somehow the selector matches.                                                                          // 297
                                                                                                                       //
                                                                                                                       //
      if (minKey === null) {                                                                                           // 298
        throw Error('sort selector found no keys in doc?');                                                            // 299
      }                                                                                                                // 300
                                                                                                                       //
      return minKey;                                                                                                   // 302
    }                                                                                                                  // 303
                                                                                                                       //
    return _getMinKeyFromDoc;                                                                                          //
  }();                                                                                                                 //
                                                                                                                       //
  Sorter.prototype._getPaths = function () {                                                                           //
    function _getPaths() {                                                                                             //
      return this._sortSpecParts.map(function (part) {                                                                 // 306
        return part.path;                                                                                              // 306
      });                                                                                                              // 306
    }                                                                                                                  // 307
                                                                                                                       //
    return _getPaths;                                                                                                  //
  }();                                                                                                                 //
                                                                                                                       //
  Sorter.prototype._keyCompatibleWithSelector = function () {                                                          //
    function _keyCompatibleWithSelector(key) {                                                                         //
      return !this._keyFilter || this._keyFilter(key);                                                                 // 310
    }                                                                                                                  // 311
                                                                                                                       //
    return _keyCompatibleWithSelector;                                                                                 //
  }(); // Given an index 'i', returns a comparator that compares two key arrays based                                  //
  // on field 'i'.                                                                                                     // 314
                                                                                                                       //
                                                                                                                       //
  Sorter.prototype._keyFieldComparator = function () {                                                                 //
    function _keyFieldComparator(i) {                                                                                  //
      var invert = !this._sortSpecParts[i].ascending;                                                                  // 316
      return function (key1, key2) {                                                                                   // 318
        var compare = LocalCollection._f._cmp(key1[i], key2[i]);                                                       // 319
                                                                                                                       //
        return invert ? -compare : compare;                                                                            // 320
      };                                                                                                               // 321
    }                                                                                                                  // 322
                                                                                                                       //
    return _keyFieldComparator;                                                                                        //
  }(); // In MongoDB, if you have documents                                                                            //
  //    {_id: 'x', a: [1, 10]} and                                                                                     // 325
  //    {_id: 'y', a: [5, 15]},                                                                                        // 326
  // then C.find({}, {sort: {a: 1}}) puts x before y (1 comes before 5).                                               // 327
  // But  C.find({a: {$gt: 3}}, {sort: {a: 1}}) puts y before x (1 does not                                            // 328
  // match the selector, and 5 comes before 10).                                                                       // 329
  //                                                                                                                   // 330
  // The way this works is pretty subtle!  For example, if the documents                                               // 331
  // are instead {_id: 'x', a: [{x: 1}, {x: 10}]}) and                                                                 // 332
  //             {_id: 'y', a: [{x: 5}, {x: 15}]}),                                                                    // 333
  // then C.find({'a.x': {$gt: 3}}, {sort: {'a.x': 1}}) and                                                            // 334
  //      C.find({a: {$elemMatch: {x: {$gt: 3}}}}, {sort: {'a.x': 1}})                                                 // 335
  // both follow this rule (y before x).  (ie, you do have to apply this                                               // 336
  // through $elemMatch.)                                                                                              // 337
  //                                                                                                                   // 338
  // So if you pass a matcher to this sorter's constructor, we will attempt to                                         // 339
  // skip sort keys that don't match the selector. The logic here is pretty                                            // 340
  // subtle and undocumented; we've gotten as close as we can figure out based                                         // 341
  // on our understanding of Mongo's behavior.                                                                         // 342
                                                                                                                       //
                                                                                                                       //
  Sorter.prototype._useWithMatcher = function () {                                                                     //
    function _useWithMatcher(matcher) {                                                                                //
      var _this4 = this;                                                                                               // 343
                                                                                                                       //
      if (this._keyFilter) {                                                                                           // 344
        throw Error('called _useWithMatcher twice?');                                                                  // 345
      } // If we are only sorting by distance, then we're not going to bother to                                       // 346
      // build a key filter.                                                                                           // 349
      // XXX figure out how geoqueries interact with this stuff                                                        // 350
                                                                                                                       //
                                                                                                                       //
      if (!this._sortSpecParts.length) {                                                                               // 351
        return;                                                                                                        // 352
      }                                                                                                                // 353
                                                                                                                       //
      var selector = matcher._selector; // If the user just passed a literal function to find(), then we can't get a   // 355
      // key filter from it.                                                                                           // 358
                                                                                                                       //
      if (selector instanceof Function) {                                                                              // 359
        return;                                                                                                        // 360
      }                                                                                                                // 361
                                                                                                                       //
      var constraintsByPath = {};                                                                                      // 363
                                                                                                                       //
      this._sortSpecParts.forEach(function (spec) {                                                                    // 365
        constraintsByPath[spec.path] = [];                                                                             // 366
      });                                                                                                              // 367
                                                                                                                       //
      Object.keys(selector).forEach(function (key) {                                                                   // 369
        var subSelector = selector[key]; // XXX support $and and $or                                                   // 370
                                                                                                                       //
        var constraints = constraintsByPath[key];                                                                      // 373
                                                                                                                       //
        if (!constraints) {                                                                                            // 374
          return;                                                                                                      // 375
        } // XXX it looks like the real MongoDB implementation isn't "does the                                         // 376
        // regexp match" but "does the value fall into a range named by the                                            // 379
        // literal prefix of the regexp", ie "foo" in /^foo(bar|baz)+/  But                                            // 380
        // "does the regexp match" is a good approximation.                                                            // 381
                                                                                                                       //
                                                                                                                       //
        if (subSelector instanceof RegExp) {                                                                           // 382
          // As far as we can tell, using either of the options that both we and                                       // 383
          // MongoDB support ('i' and 'm') disables use of the key filter. This                                        // 384
          // makes sense: MongoDB mostly appears to be calculating ranges of an                                        // 385
          // index to use, which means it only cares about regexps that match                                          // 386
          // one range (with a literal prefix), and both 'i' and 'm' prevent the                                       // 387
          // literal prefix of the regexp from actually meaning one range.                                             // 388
          if (subSelector.ignoreCase || subSelector.multiline) {                                                       // 389
            return;                                                                                                    // 390
          }                                                                                                            // 391
                                                                                                                       //
          constraints.push(regexpElementMatcher(subSelector));                                                         // 393
          return;                                                                                                      // 394
        }                                                                                                              // 395
                                                                                                                       //
        if (isOperatorObject(subSelector)) {                                                                           // 397
          Object.keys(subSelector).forEach(function (operator) {                                                       // 398
            var operand = subSelector[operator];                                                                       // 399
                                                                                                                       //
            if (['$lt', '$lte', '$gt', '$gte'].includes(operator)) {                                                   // 401
              // XXX this depends on us knowing that these operators don't use any                                     // 402
              // of the arguments to compileElementSelector other than operand.                                        // 403
              constraints.push(ELEMENT_OPERATORS[operator].compileElementSelector(operand));                           // 404
            } // See comments in the RegExp block above.                                                               // 407
                                                                                                                       //
                                                                                                                       //
            if (operator === '$regex' && !subSelector.$options) {                                                      // 410
              constraints.push(ELEMENT_OPERATORS.$regex.compileElementSelector(operand, subSelector));                 // 411
            } // XXX support {$exists: true}, $mod, $type, $in, $elemMatch                                             // 417
                                                                                                                       //
          });                                                                                                          // 420
          return;                                                                                                      // 422
        } // OK, it's an equality thing.                                                                               // 423
                                                                                                                       //
                                                                                                                       //
        constraints.push(equalityElementMatcher(subSelector));                                                         // 426
      }); // It appears that the first sort field is treated differently from the                                      // 427
      // others; we shouldn't create a key filter unless the first sort field is                                       // 430
      // restricted, though after that point we can restrict the other sort fields                                     // 431
      // or not as we wish.                                                                                            // 432
                                                                                                                       //
      if (!constraintsByPath[this._sortSpecParts[0].path].length) {                                                    // 433
        return;                                                                                                        // 434
      }                                                                                                                // 435
                                                                                                                       //
      this._keyFilter = function (key) {                                                                               // 437
        return _this4._sortSpecParts.every(function (specPart, index) {                                                // 437
          return constraintsByPath[specPart.path].every(function (fn) {                                                // 438
            return fn(key[index]);                                                                                     // 439
          });                                                                                                          // 439
        });                                                                                                            // 438
      };                                                                                                               // 437
    }                                                                                                                  // 442
                                                                                                                       //
    return _useWithMatcher;                                                                                            //
  }();                                                                                                                 //
                                                                                                                       //
  return Sorter;                                                                                                       //
}();                                                                                                                   //
                                                                                                                       //
// Given an array of comparators                                                                                       // 445
// (functions (a,b)->(negative or positive or zero)), returns a single                                                 // 446
// comparator which uses each comparator in order and returns the first                                                // 447
// non-zero value.                                                                                                     // 448
function composeComparators(comparatorArray) {                                                                         // 449
  return function (a, b) {                                                                                             // 450
    for (var i = 0; i < comparatorArray.length; ++i) {                                                                 // 451
      var compare = comparatorArray[i](a, b);                                                                          // 452
                                                                                                                       //
      if (compare !== 0) {                                                                                             // 453
        return compare;                                                                                                // 454
      }                                                                                                                // 455
    }                                                                                                                  // 456
                                                                                                                       //
    return 0;                                                                                                          // 458
  };                                                                                                                   // 459
}                                                                                                                      // 460
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/minimongo/minimongo_server.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.minimongo = exports, {
  LocalCollection: LocalCollection,
  Minimongo: Minimongo,
  MinimongoTest: MinimongoTest,
  MinimongoError: MinimongoError
});

})();

//# sourceMappingURL=minimongo.js.map

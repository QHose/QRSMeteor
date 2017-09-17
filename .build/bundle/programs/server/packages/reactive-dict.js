(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var EJSON = Package.ejson.EJSON;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var ReactiveDict;

var require = meteorInstall({"node_modules":{"meteor":{"reactive-dict":{"reactive-dict.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/reactive-dict/reactive-dict.js                                                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");                                             //
                                                                                                                  //
var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);                                                    //
                                                                                                                  //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                           //
                                                                                                                  //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                  //
                                                                                                                  //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                 //
                                                                                                                  //
// XXX come up with a serialization method which canonicalizes object key                                         // 1
// order, which would allow us to use objects as values for equals.                                               // 2
var stringify = function (value) {                                                                                // 3
  if (value === undefined) return 'undefined';                                                                    // 4
  return EJSON.stringify(value);                                                                                  // 6
};                                                                                                                // 7
                                                                                                                  //
var parse = function (serialized) {                                                                               // 8
  if (serialized === undefined || serialized === 'undefined') return undefined;                                   // 9
  return EJSON.parse(serialized);                                                                                 // 11
};                                                                                                                // 12
                                                                                                                  //
var changed = function (v) {                                                                                      // 14
  v && v.changed();                                                                                               // 15
}; // XXX COMPAT WITH 0.9.1 : accept migrationData instead of dictName                                            // 16
                                                                                                                  //
                                                                                                                  //
ReactiveDict = function (dictName) {                                                                              // 19
  // this.keys: key -> value                                                                                      // 20
  if (dictName) {                                                                                                 // 21
    if (typeof dictName === 'string') {                                                                           // 22
      // the normal case, argument is a string name.                                                              // 23
      // _registerDictForMigrate will throw an error on duplicate name.                                           // 24
      ReactiveDict._registerDictForMigrate(dictName, this);                                                       // 25
                                                                                                                  //
      this.keys = ReactiveDict._loadMigratedDict(dictName) || {};                                                 // 26
      this.name = dictName;                                                                                       // 27
    } else if ((typeof dictName === "undefined" ? "undefined" : (0, _typeof3.default)(dictName)) === 'object') {  // 28
      // back-compat case: dictName is actually migrationData                                                     // 29
      this.keys = {};                                                                                             // 30
                                                                                                                  //
      for (var _iterator = Object.entries(dictName), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref3;                                                                                                // 31
                                                                                                                  //
        if (_isArray) {                                                                                           // 31
          if (_i >= _iterator.length) break;                                                                      // 31
          _ref3 = _iterator[_i++];                                                                                // 31
        } else {                                                                                                  // 31
          _i = _iterator.next();                                                                                  // 31
          if (_i.done) break;                                                                                     // 31
          _ref3 = _i.value;                                                                                       // 31
        }                                                                                                         // 31
                                                                                                                  //
        var _ref = _ref3;                                                                                         // 31
                                                                                                                  //
        var _ref2 = (0, _slicedToArray3.default)(_ref, 2);                                                        // 31
                                                                                                                  //
        var key = _ref2[0];                                                                                       // 31
        var value = _ref2[1];                                                                                     // 31
        this.keys[key] = stringify(value);                                                                        // 32
      }                                                                                                           // 33
    } else {                                                                                                      // 34
      throw new Error("Invalid ReactiveDict argument: " + dictName);                                              // 35
    }                                                                                                             // 36
  } else {                                                                                                        // 37
    // no name given; no migration will be performed                                                              // 38
    this.keys = {};                                                                                               // 39
  }                                                                                                               // 40
                                                                                                                  //
  this.allDeps = new Tracker.Dependency();                                                                        // 42
  this.keyDeps = {}; // key -> Dependency                                                                         // 43
                                                                                                                  //
  this.keyValueDeps = {}; // key -> Dependency                                                                    // 44
};                                                                                                                // 45
                                                                                                                  //
_.extend(ReactiveDict.prototype, {                                                                                // 47
  // set() began as a key/value method, but we are now overloading it                                             // 48
  // to take an object of key/value pairs, similar to backbone                                                    // 49
  // http://backbonejs.org/#Model-set                                                                             // 50
  set: function (keyOrObject, value) {                                                                            // 52
    var self = this;                                                                                              // 53
                                                                                                                  //
    if ((typeof keyOrObject === "undefined" ? "undefined" : (0, _typeof3.default)(keyOrObject)) === 'object' && value === undefined) {
      // Called as `dict.set({...})`                                                                              // 56
      self._setObject(keyOrObject);                                                                               // 57
                                                                                                                  //
      return;                                                                                                     // 58
    } // the input isn't an object, so it must be a key                                                           // 59
    // and we resume with the rest of the function                                                                // 61
                                                                                                                  //
                                                                                                                  //
    var key = keyOrObject;                                                                                        // 62
    value = stringify(value);                                                                                     // 64
                                                                                                                  //
    var keyExisted = _.has(self.keys, key);                                                                       // 66
                                                                                                                  //
    var oldSerializedValue = keyExisted ? self.keys[key] : 'undefined';                                           // 67
    var isNewValue = value !== oldSerializedValue;                                                                // 68
    self.keys[key] = value;                                                                                       // 70
                                                                                                                  //
    if (isNewValue || !keyExisted) {                                                                              // 72
      self.allDeps.changed();                                                                                     // 73
    }                                                                                                             // 74
                                                                                                                  //
    if (isNewValue) {                                                                                             // 76
      changed(self.keyDeps[key]);                                                                                 // 77
                                                                                                                  //
      if (self.keyValueDeps[key]) {                                                                               // 78
        changed(self.keyValueDeps[key][oldSerializedValue]);                                                      // 79
        changed(self.keyValueDeps[key][value]);                                                                   // 80
      }                                                                                                           // 81
    }                                                                                                             // 82
  },                                                                                                              // 83
  setDefault: function (keyOrObject, value) {                                                                     // 85
    var self = this;                                                                                              // 86
                                                                                                                  //
    if ((typeof keyOrObject === "undefined" ? "undefined" : (0, _typeof3.default)(keyOrObject)) === 'object' && value === undefined) {
      // Called as `dict.setDefault({...})`                                                                       // 89
      self._setDefaultObject(keyOrObject);                                                                        // 90
                                                                                                                  //
      return;                                                                                                     // 91
    } // the input isn't an object, so it must be a key                                                           // 92
    // and we resume with the rest of the function                                                                // 94
                                                                                                                  //
                                                                                                                  //
    var key = keyOrObject;                                                                                        // 95
                                                                                                                  //
    if (!_.has(self.keys, key)) {                                                                                 // 97
      self.set(key, value);                                                                                       // 98
    }                                                                                                             // 99
  },                                                                                                              // 100
  get: function (key) {                                                                                           // 102
    var self = this;                                                                                              // 103
                                                                                                                  //
    self._ensureKey(key);                                                                                         // 104
                                                                                                                  //
    self.keyDeps[key].depend();                                                                                   // 105
    return parse(self.keys[key]);                                                                                 // 106
  },                                                                                                              // 107
  equals: function (key, value) {                                                                                 // 109
    var self = this; // Mongo.ObjectID is in the 'mongo' package                                                  // 110
                                                                                                                  //
    var ObjectID = null;                                                                                          // 113
                                                                                                                  //
    if (Package.mongo) {                                                                                          // 114
      ObjectID = Package.mongo.Mongo.ObjectID;                                                                    // 115
    } // We don't allow objects (or arrays that might include objects) for                                        // 116
    // .equals, because JSON.stringify doesn't canonicalize object key                                            // 119
    // order. (We can make equals have the right return value by parsing the                                      // 120
    // current value and using EJSON.equals, but we won't have a canonical                                        // 121
    // element of keyValueDeps[key] to store the dependency.) You can still use                                   // 122
    // "EJSON.equals(reactiveDict.get(key), value)".                                                              // 123
    //                                                                                                            // 124
    // XXX we could allow arrays as long as we recursively check that there                                       // 125
    // are no objects                                                                                             // 126
                                                                                                                  //
                                                                                                                  //
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'undefined' && !(value instanceof Date) && !(ObjectID && value instanceof ObjectID) && value !== null) {
      throw new Error("ReactiveDict.equals: value must be scalar");                                               // 134
    }                                                                                                             // 135
                                                                                                                  //
    var serializedValue = stringify(value);                                                                       // 136
                                                                                                                  //
    if (Tracker.active) {                                                                                         // 138
      self._ensureKey(key);                                                                                       // 139
                                                                                                                  //
      if (!_.has(self.keyValueDeps[key], serializedValue)) self.keyValueDeps[key][serializedValue] = new Tracker.Dependency();
      var isNew = self.keyValueDeps[key][serializedValue].depend();                                               // 144
                                                                                                                  //
      if (isNew) {                                                                                                // 145
        Tracker.onInvalidate(function () {                                                                        // 146
          // clean up [key][serializedValue] if it's now empty, so we don't                                       // 147
          // use O(n) memory for n = values seen ever                                                             // 148
          if (!self.keyValueDeps[key][serializedValue].hasDependents()) delete self.keyValueDeps[key][serializedValue];
        });                                                                                                       // 151
      }                                                                                                           // 152
    }                                                                                                             // 153
                                                                                                                  //
    var oldValue = undefined;                                                                                     // 155
    if (_.has(self.keys, key)) oldValue = parse(self.keys[key]);                                                  // 156
    return EJSON.equals(oldValue, value);                                                                         // 157
  },                                                                                                              // 158
  all: function () {                                                                                              // 160
    this.allDeps.depend();                                                                                        // 161
    var ret = {};                                                                                                 // 162
                                                                                                                  //
    _.each(this.keys, function (value, key) {                                                                     // 163
      ret[key] = parse(value);                                                                                    // 164
    });                                                                                                           // 165
                                                                                                                  //
    return ret;                                                                                                   // 166
  },                                                                                                              // 167
  clear: function () {                                                                                            // 169
    var self = this;                                                                                              // 170
    var oldKeys = self.keys;                                                                                      // 172
    self.keys = {};                                                                                               // 173
    self.allDeps.changed();                                                                                       // 175
                                                                                                                  //
    _.each(oldKeys, function (value, key) {                                                                       // 177
      changed(self.keyDeps[key]);                                                                                 // 178
                                                                                                                  //
      if (self.keyValueDeps[key]) {                                                                               // 179
        changed(self.keyValueDeps[key][value]);                                                                   // 180
        changed(self.keyValueDeps[key]['undefined']);                                                             // 181
      }                                                                                                           // 182
    });                                                                                                           // 183
  },                                                                                                              // 185
  "delete": function (key) {                                                                                      // 187
    var self = this;                                                                                              // 188
    var didRemove = false;                                                                                        // 189
                                                                                                                  //
    if (_.has(self.keys, key)) {                                                                                  // 191
      var oldValue = self.keys[key];                                                                              // 192
      delete self.keys[key];                                                                                      // 193
      changed(self.keyDeps[key]);                                                                                 // 194
                                                                                                                  //
      if (self.keyValueDeps[key]) {                                                                               // 195
        changed(self.keyValueDeps[key][oldValue]);                                                                // 196
        changed(self.keyValueDeps[key]['undefined']);                                                             // 197
      }                                                                                                           // 198
                                                                                                                  //
      self.allDeps.changed();                                                                                     // 199
      didRemove = true;                                                                                           // 200
    }                                                                                                             // 201
                                                                                                                  //
    return didRemove;                                                                                             // 203
  },                                                                                                              // 204
  _setObject: function (object) {                                                                                 // 206
    var self = this;                                                                                              // 207
                                                                                                                  //
    _.each(object, function (value, key) {                                                                        // 209
      self.set(key, value);                                                                                       // 210
    });                                                                                                           // 211
  },                                                                                                              // 212
  _setDefaultObject: function (object) {                                                                          // 214
    var self = this;                                                                                              // 215
                                                                                                                  //
    _.each(object, function (value, key) {                                                                        // 217
      self.setDefault(key, value);                                                                                // 218
    });                                                                                                           // 219
  },                                                                                                              // 220
  _ensureKey: function (key) {                                                                                    // 222
    var self = this;                                                                                              // 223
                                                                                                                  //
    if (!(key in self.keyDeps)) {                                                                                 // 224
      self.keyDeps[key] = new Tracker.Dependency();                                                               // 225
      self.keyValueDeps[key] = {};                                                                                // 226
    }                                                                                                             // 227
  },                                                                                                              // 228
  // Get a JSON value that can be passed to the constructor to                                                    // 230
  // create a new ReactiveDict with the same contents as this one                                                 // 231
  _getMigrationData: function () {                                                                                // 232
    // XXX sanitize and make sure it's JSONible?                                                                  // 233
    return this.keys;                                                                                             // 234
  }                                                                                                               // 235
});                                                                                                               // 47
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"migration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/reactive-dict/migration.js                                                                            //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
ReactiveDict._migratedDictData = {}; // name -> data                                                              // 1
                                                                                                                  //
ReactiveDict._dictsToMigrate = {}; // name -> ReactiveDict                                                        // 2
                                                                                                                  //
ReactiveDict._loadMigratedDict = function (dictName) {                                                            // 4
  if (_.has(ReactiveDict._migratedDictData, dictName)) return ReactiveDict._migratedDictData[dictName];           // 5
  return null;                                                                                                    // 8
};                                                                                                                // 9
                                                                                                                  //
ReactiveDict._registerDictForMigrate = function (dictName, dict) {                                                // 11
  if (_.has(ReactiveDict._dictsToMigrate, dictName)) throw new Error("Duplicate ReactiveDict name: " + dictName);
  ReactiveDict._dictsToMigrate[dictName] = dict;                                                                  // 15
};                                                                                                                // 16
                                                                                                                  //
if (Meteor.isClient && Package.reload) {                                                                          // 18
  // Put old migrated data into ReactiveDict._migratedDictData,                                                   // 19
  // where it can be accessed by ReactiveDict._loadMigratedDict.                                                  // 20
  var migrationData = Package.reload.Reload._migrationData('reactive-dict');                                      // 21
                                                                                                                  //
  if (migrationData && migrationData.dicts) ReactiveDict._migratedDictData = migrationData.dicts; // On migration, assemble the data from all the dicts that have been
  // registered.                                                                                                  // 26
                                                                                                                  //
  Package.reload.Reload._onMigrate('reactive-dict', function () {                                                 // 27
    var dictsToMigrate = ReactiveDict._dictsToMigrate;                                                            // 28
    var dataToMigrate = {};                                                                                       // 29
                                                                                                                  //
    for (var dictName in meteorBabelHelpers.sanitizeForInObject(dictsToMigrate)) {                                // 31
      dataToMigrate[dictName] = dictsToMigrate[dictName]._getMigrationData();                                     // 32
    }                                                                                                             // 31
                                                                                                                  //
    return [true, {                                                                                               // 34
      dicts: dataToMigrate                                                                                        // 34
    }];                                                                                                           // 34
  });                                                                                                             // 35
}                                                                                                                 // 36
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("./node_modules/meteor/reactive-dict/reactive-dict.js");
require("./node_modules/meteor/reactive-dict/migration.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['reactive-dict'] = {}, {
  ReactiveDict: ReactiveDict
});

})();

//# sourceMappingURL=reactive-dict.js.map

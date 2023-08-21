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
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Session = Package.session.Session;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;

/* Package-scope variables */
var PersistentSession;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/u2622_persistent-session/lib/persistent_session.js                                                  //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
// This file uses code direct from Meteor's reactive-dict package, mostly from
// this file: https://github.com/meteor/meteor/blob/0ef65cc/packages/reactive-dict/reactive-dict.js
//
// helpers: https://github.com/meteor/meteor/blob/0ef65cc/packages/reactive-dict/reactive-dict.js#L1-L16
var stringify = function (value) {
  if (value === undefined)
    return 'undefined';
  return EJSON.stringify(value);
};
var parse = function (serialized) {
  if (serialized === undefined || serialized === 'undefined')
    return undefined;
  return EJSON.parse(serialized);
};

var changed = function (v) {
  v && v.changed();
};


PersistentSession = function (dictName) {
  if (_.isString(dictName)) {
    this._dictName = dictName;

    // when "session", use the existing dict
    if (dictName == "session") {
      this._dictName = ""   // we don't need a name for session
      this._dict = oldSession; // we also want to use the global (incase something was set previously)

    // not session? create a new dict
    } else {
      this._dict = new ReactiveDict(dictName);
    }

  } else {
    throw new Error("dictName must be a string");
  }


  /*
   * Used to determine if we need to migrate how the data is stored.
   * Each time the data format changes, change this number.
   *
   * It should match the current major + minor version:
   * EG: 0.3 = 3, 1.2 = 12, 2.0 = 20, or for 0.3.x: 3, or 1.x: 10
   *
   */
  var PSA_DATA_VERSION = 4;

  // === INITIALIZE KEY TRACKING ===
  this.psKeys     = {};
  this.psKeyList  = [];
  this.psaKeys    = {};
  this.psaKeyList = [];

  // initialize default method setting
  this.default_method = 'temporary'; // valid options: 'temporary', 'persistent', 'authenticated'
  if (Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.persistent_session) {
    this.default_method = Meteor.settings.public.persistent_session.default_method;
  }


  var self = this;

  // === HOUSEKEEPING ===
  /*
   * Converts previously stored values into EJSON compatible formats.
   */
  function migrateToEJSON() {
    if (amplify.store('__PSDATAVERSION__' + self._dictName) >= 1) {
      return;
    }

    var psKeyList = amplify.store('__PSKEYS__' + self._dictName);
    var psaKeyList = amplify.store('__PSAKEYS__' + self._dictName);

    _.each([psKeyList, psaKeyList], function(list) {
      _.each(list, function(key) {
        amplify.store(key, EJSON.stringify(amplify.store(key)));
      });
    });

    amplify.store('__PSDATAVERSION__' + self._dictName, 2);
  };

  function migrate3Xto4X() {
    if (amplify.store('__PSDATAVERSION__' + self._dictName) >= PSA_DATA_VERSION) {
      return;
    }

    var psKeyList = amplify.store('__PSKEYS__' + self._dictName);
    var psaKeyList = amplify.store('__PSAKEYS__' + self._dictName);

    _.each([psKeyList, psaKeyList], function(list) {
      _.each(list, function(key) {
        var invalid = false;
        try {
          EJSON.parse(amplify.store(self._dictName+key));
        } catch (error) {
          //The data is already in the format that we expect
          //Unfortunately there is no EJSON.canParse method
          invalid = true;
        }
        if (!invalid) {
          var parsed = EJSON.parse(amplify.store(self._dictName+key));
          var jsoned = EJSON.toJSONValue(parsed);
          amplify.store(self._dictName+key, jsoned);
        }
      });
    });

    amplify.store('__PSDATAVERSION__' + self._dictName, 4);
  }

  if (Meteor.isClient) {

    // --- on startup, load persistent data back into meteor session ---
    Meteor.startup(function(){
      var val;

      migrateToEJSON();
      migrate3Xto4X();

      // persistent data
      var psList = amplify.store('__PSKEYS__' + self._dictName);
      if ( typeof psList == "object" && psList.length!==undefined ) {
        for (var i=0; i<psList.length; i++) {
          if (!_.has(self._dict.keys, psList[i])) {
            val = self.get(psList[i]);
            self.set(psList[i], val, true, false);
          }
        }
      }

      // authenticated data
      var psaList = amplify.store('__PSAKEYS__' + self._dictName);
      if ( typeof psaList == "object" && psaList.length!==undefined ) {
        for (var i=0; i<psaList.length; i++) {
          if (!_.has(self._dict.keys, psaList[i])) {
            val = self.get(psaList[i]);
            self.setAuth(psaList[i], val, true, true);
          }
        }
      }

    });

  };

  Tracker.autorun(function () {
    // lazy check for accounts-base
    if (Meteor.userId) {
      var userId = Meteor.userId()
      if (userId) {
        // user is logged in, leave session in tacted
      } else {
        // user is unset, clear authencated keys
        self.clearAuth()
      }
    }
  });

  return this;
};

// === LOCAL STORAGE INTERACTION ===
PersistentSession.prototype.store = function _psStore(type, key, value) {
  // use dict name for uniqueness
  this.psKeyList  = amplify.store('__PSKEYS__' + this._dictName) || [];
  this.psaKeyList = amplify.store('__PSAKEYS__' + this._dictName)|| [];

  if (type == 'get') {
    return amplify.store(this._dictName + key);
  } else {

    this.psKeyList  = _.without(this.psKeyList, key);
    this.psaKeyList = _.without(this.psaKeyList, key);
    delete this.psKeys[key];
    delete this.psaKeys[key];

    if (value===undefined || value===null || type=='temporary') {
      value = null;

    } else if (type=='persistent') {
      this.psKeys[key] = EJSON.toJSONValue(value);
      this.psKeyList = _.union(this.psKeyList, [key]);

    } else if (type=='authenticated') {
      this.psaKeys[key] = EJSON.toJSONValue(value);
      this.psaKeyList = _.union(this.psaKeyList, [key]);
    }

    amplify.store('__PSKEYS__', this.psKeyList);
    amplify.store('__PSAKEYS__', this.psaKeyList);
    amplify.store(this._dictName + key, EJSON.toJSONValue(value));
  }
};


// === GET ===
// keep for backwards compability, redirect to this._dict
PersistentSession.prototype.old_get = function (/* arguments */){
  return this._dict.get.apply(this._dict, arguments);
};
PersistentSession.prototype.get = function _psGet(key) {
  var val = this.old_get(key);
  var psVal;
  var unparsedPsVal = this.store('get', key);
  if (unparsedPsVal !== undefined) {
    psVal = EJSON.fromJSONValue(this.store('get', key));
  }

  /*
   * We can't do `return psVal || val;` here, as when psVal = undefined and
   * val = 0, it will return undefined, even though 0 is the correct value.
   */
  if (psVal === undefined || psVal === null) {
    return val;
  }
  return psVal;
};


// === SET ===
PersistentSession.prototype.old_set = function (/* arguments */){
  // defaults to a persistent, non-authenticated variable
  return this._dict.set.apply(this._dict, arguments);
};
PersistentSession.prototype.set = function _psSet(keyOrObject, value, persist, auth) {

  // Taken from https://github.com/meteor/meteor/blob/107d858/packages/reactive-dict/reactive-dict.js
  if ((typeof keyOrObject === 'object') && (value === undefined)) {
    this._setObject(keyOrObject, persist, auth);
    return;
  }

  var key = keyOrObject;
  var type = 'temporary';
  if (persist || (persist===undefined && (this.default_method=='persistent' || this.default_method=='authenticated'))) {
    if (auth || (persist===undefined && auth===undefined && this.default_method=='authenticated')) {
      type = 'authenticated';
    } else {
      type = 'persistent';
    }
  }
  this.store(type, key, value);
  this.old_set(key, value);
};


// Taken from https://github.com/meteor/meteor/blob/0ef65cc/packages/reactive-dict/reactive-dict.js#L144-L151
// Backwords compat:
PersistentSession.prototype.all = function _psAll() {
  if (this._dict.allDeps) {
    this._dict.allDeps.depend();
  }
  var ret = {};
  _.each(this._dict.keys, function(value, key) {
    ret[key] = parse(value);
  });
  return ret;
}

PersistentSession.prototype._setObject = function _psSetObject(object, persist, auth) {
  var self = this;

  _.each(object, function (value, key){
    self.set(key, value, persist, auth);
  });
};

PersistentSession.prototype._ensureKey = function _psEnsureKey(key) {
  var self = this._dict;
  if (!(key in self.keyDeps)) {
    self.keyDeps[key] = new Tracker.Dependency;
    self.keyValueDeps[key] = {};
  }
}

// === EQUALS ===
// Taken from https://github.com/meteor/meteor/blob/0ef65cc/packages/reactive-dict/reactive-dict.js#L93-L137
PersistentSession.prototype.equals = function _psEquals(key, value) {

  // Mongo.ObjectID is in the 'mongo' package
  var ObjectID = null;
  if (Package.mongo) {
    ObjectID = Package.mongo.Mongo.ObjectID;
  }

  // We don't allow objects (or arrays that might include objects) for
  // .equals, because JSON.stringify doesn't canonicalize object key
  // order. (We can make equals have the right return value by parsing the
  // current value and using EJSON.equals, but we won't have a canonical
  // element of keyValueDeps[key] to store the dependency.) You can still use
  // "EJSON.equals(reactiveDict.get(key), value)".
  //
  // XXX we could allow arrays as long as we recursively check that there
  // are no objects
  if (typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean' &&
      typeof value !== 'undefined' &&
      !(value instanceof Date) &&
      !(ObjectID && value instanceof ObjectID) &&
      value !== null) {
    throw new Error("ReactiveDict.equals: value must be scalar");
  }
  var serializedValue = stringify(value);

  if (Tracker.active) {
    this._ensureKey(key);

    if (! _.has(this._dict.keyValueDeps[key], serializedValue))
      this._dict.keyValueDeps[key][serializedValue] = new Tracker.Dependency;

    var isNew = this._dict.keyValueDeps[key][serializedValue].depend();
    if (isNew) {
      var that = this;
      Tracker.onInvalidate(function () {
        // clean up [key][serializedValue] if it's now empty, so we don't
        // use O(n) memory for n = values seen ever
        if (! that._dict.keyValueDeps[key][serializedValue].hasDependents())
          delete that._dict.keyValueDeps[key][serializedValue];
      });
    }
  }

  var oldValue = this.get(key);

  return EJSON.equals(oldValue, value);
};

// === SET TEMPORARY ===
// alias to .set(); sets a non-persistent variable
PersistentSession.prototype.setTemporary = function _psSetTemp(keyOrObject, value) {
  this.set(keyOrObject, value, false, false);
};
PersistentSession.prototype.setTemp = function _psSetTemp(keyOrObject, value) {
  this.set(keyOrObject, value, false, false);
};

// === SET PERSISTENT ===
// alias to .set(); sets a persistent variable
PersistentSession.prototype.setPersistent = function _psSetPersistent(keyOrObject, value) {
  this.set(keyOrObject, value, true, false);
};

// === SET AUTHENTICATED ===
// alias to .set(); sets a persistent variable that will be removed on logout
PersistentSession.prototype.setAuth = function _psSetAuth(keyOrObject, value) {
  this.set(keyOrObject, value, true, true);
};


// === MAKE TEMP / PERSISTENT / AUTH ===
// change the type of session var
PersistentSession.prototype.makeTemp = function _psMakeTemp(key) {
  this.store('temporary', key);
};
PersistentSession.prototype.makePersistent = function _psMakePersistent(key) {
  var val = this.get(key);
  this.store('persistent', key, val);
};
PersistentSession.prototype.makeAuth = function _psMakeAuth(key) {
  var val = this.get(key);
  this.store('authenticated', key, val);
};



// === CLEAR ===
PersistentSession.prototype.old_clear = function (/* arguments */){
  return this._dict.clear.apply(this._dict, arguments);
};

// more or less how it's implemented in reactive dict, but add support for removing single or arrays of keys
// Derived from https://github.com/meteor/meteor/blob/0ef65cc/packages/reactive-dict/reactive-dict.js#L153-L167
PersistentSession.prototype.clear = function _psClear(key, list) {
  var self = this;
  var oldKeys = self._dict.keys;

  if ((key === undefined) && (list === undefined)) {
    list = oldKeys;
  } else if (!(key === undefined)) {
    list = [key]
  } else {
    // list = list
  }

  // okay, if it was an array of keys, find the old key pairings for reactivity
  if (_.isArray(list)){
    var oldList = list;
    var list = {}
    _.each(oldList, function (key) {
      list[key] = oldKeys[key];
    });
  }

  _.each(list, function(value, akey) {
    self.set(akey, undefined, false, false);

    changed(self._dict.keyDeps[akey]);
    if (self._dict.keyValueDeps[akey]) {
      changed(self._dict.keyValueDeps[akey][value]);
      changed(self._dict.keyValueDeps[akey]['undefined']);
    }

    delete self._dict.keys[akey]; // remove the key
  });

  // reactive-dict 1.1.0+
  if (self._dict.allDeps) {
    self._dict.allDeps.changed();
  }
};


// === CLEAR TEMP ===
// clears all the temporary keys
PersistentSession.prototype.clearTemp = function _psClearTemp() {
  this.clear(undefined, _.keys(_.omit(this._dict.keys, this.psKeys, this.psaKeys)));
};

// === CLEAR PERSISTENT ===
// clears all persistent keys
PersistentSession.prototype.clearPersistent = function _psClearPersistent() {
  this.clear(undefined, this.psKeys);
};

// === CLEAR AUTH ===
// clears all authenticated keys
PersistentSession.prototype.clearAuth = function _psClearAuth() {
  this.clear(undefined, this.psaKeys);
};




// === UPDATE ===
// updates the value of a session var without changing its type
PersistentSession.prototype.update = function _psUpdate(key, value) {
  var persist, auth;
  if ( _.indexOf(this.psaKeyList, key) >= 0 ) { auth = true; }
  if ( auth || _.indexOf(this.psKeyList, key) >= 0 ) { persist = true; }
  this.set(key, value, persist, auth);
};

// === SET DEFAULT ===
PersistentSession.prototype.old_setDefault = function (/* arguments */){
  return this._dict.setDefault.apply(this._dict, arguments);
};
PersistentSession.prototype.setDefault = function _psSetDefault(keyOrObject, value, persist, auth) {
  var self = this;

  if (_.isObject(keyOrObject)) {
    _.each(keyOrObject, function(value, key) {
      self.setDefault(key, value, persist, auth);
    });
    return;
  }

  if ( this.get(keyOrObject) === undefined) {
    this.set(keyOrObject, value, persist, auth);
  }
};

// === SET DEFAULT TEMP ===
PersistentSession.prototype.setDefaultTemp = function _psSetDefaultTemp(keyOrObject, value) {

  if (_.isObject(keyOrObject)) {
    value = undefined; 
  }

  this.setDefault(keyOrObject, value, false, false);
};

// === SET DEFAULT PERSISTENT ===
PersistentSession.prototype.setDefaultPersistent = function _psSetDefaultPersistent(keyOrObject, value) {

  if (_.isObject(keyOrObject)) {
    value = undefined; 
  }

  this.setDefault(keyOrObject, value, true, false);
};

// === SET DEFAULT AUTH ===
PersistentSession.prototype.setDefaultAuth = function _psSetDefaultAuth(keyOrObject, value) {

  if (_.isObject(keyOrObject)) {
    value = undefined; 
  }

  this.setDefault(keyOrObject, value, true, true);
};

// automatically apply PersistentSession to Session
var oldSession = _.clone(Session);
_.extend(Session, new PersistentSession("session"))

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("u2622:persistent-session", {
  PersistentSession: PersistentSession
});

})();

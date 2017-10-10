(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var check = Package.check.check;
var Match = Package.check.Match;
var EJSON = Package.ejson.EJSON;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var AllowDeny;

var require = meteorInstall({"node_modules":{"meteor":{"allow-deny":{"allow-deny.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/allow-deny/allow-deny.js                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
///                                                                                                                   // 1
/// Remote methods and access control.                                                                                // 2
///                                                                                                                   // 3
var hasOwn = Object.prototype.hasOwnProperty; // Restrict default mutators on collection. allow() and deny() take the
// same options:                                                                                                      // 8
//                                                                                                                    // 9
// options.insert {Function(userId, doc)}                                                                             // 10
//   return true to allow/deny adding this document                                                                   // 11
//                                                                                                                    // 12
// options.update {Function(userId, docs, fields, modifier)}                                                          // 13
//   return true to allow/deny updating these documents.                                                              // 14
//   `fields` is passed as an array of fields that are to be modified                                                 // 15
//                                                                                                                    // 16
// options.remove {Function(userId, docs)}                                                                            // 17
//   return true to allow/deny removing these documents                                                               // 18
//                                                                                                                    // 19
// options.fetch {Array}                                                                                              // 20
//   Fields to fetch for these validators. If any call to allow or deny                                               // 21
//   does not have this option then all fields are loaded.                                                            // 22
//                                                                                                                    // 23
// allow and deny can be called multiple times. The validators are                                                    // 24
// evaluated as follows:                                                                                              // 25
// - If neither deny() nor allow() has been called on the collection,                                                 // 26
//   then the request is allowed if and only if the "insecure" smart                                                  // 27
//   package is in use.                                                                                               // 28
// - Otherwise, if any deny() function returns true, the request is denied.                                           // 29
// - Otherwise, if any allow() function returns true, the request is allowed.                                         // 30
// - Otherwise, the request is denied.                                                                                // 31
//                                                                                                                    // 32
// Meteor may call your deny() and allow() functions in any order, and may not                                        // 33
// call all of them if it is able to make a decision without calling them all                                         // 34
// (so don't include side effects).                                                                                   // 35
                                                                                                                      //
AllowDeny = {                                                                                                         // 37
  CollectionPrototype: {}                                                                                             // 38
}; // In the `mongo` package, we will extend Mongo.Collection.prototype with these                                    // 37
// methods                                                                                                            // 42
                                                                                                                      //
var CollectionPrototype = AllowDeny.CollectionPrototype; /**                                                          // 43
                                                          * @summary Allow users to write directly to this collection from client code, subject to limitations you define.
                                                          * @locus Server                                             //
                                                          * @method allow                                             //
                                                          * @memberOf Mongo.Collection                                //
                                                          * @instance                                                 //
                                                          * @param {Object} options                                   //
                                                          * @param {Function} options.insert,update,remove Functions that look at a proposed modification to the database and return true if it should be allowed.
                                                          * @param {String[]} options.fetch Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your `update` and `remove` functions.
                                                          * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections).  Pass `null` to disable transformation.
                                                          */                                                          //
                                                                                                                      //
CollectionPrototype.allow = function (options) {                                                                      // 56
  addValidator(this, 'allow', options);                                                                               // 57
}; /**                                                                                                                // 58
    * @summary Override `allow` rules.                                                                                //
    * @locus Server                                                                                                   //
    * @method deny                                                                                                    //
    * @memberOf Mongo.Collection                                                                                      //
    * @instance                                                                                                       //
    * @param {Object} options                                                                                         //
    * @param {Function} options.insert,update,remove Functions that look at a proposed modification to the database and return true if it should be denied, even if an [allow](#allow) rule says otherwise.
    * @param {String[]} options.fetch Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your `update` and `remove` functions.
    * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections).  Pass `null` to disable transformation.
    */                                                                                                                //
                                                                                                                      //
CollectionPrototype.deny = function (options) {                                                                       // 71
  addValidator(this, 'deny', options);                                                                                // 72
};                                                                                                                    // 73
                                                                                                                      //
CollectionPrototype._defineMutationMethods = function (options) {                                                     // 75
  var self = this;                                                                                                    // 76
  options = options || {}; // set to true once we call any allow or deny methods. If true, use                        // 77
  // allow/deny semantics. If false, use insecure mode semantics.                                                     // 80
                                                                                                                      //
  self._restricted = false; // Insecure mode (default to allowing writes). Defaults to 'undefined' which              // 81
  // means insecure iff the insecure package is loaded. This property can be                                          // 84
  // overriden by tests or packages wishing to change insecure mode behavior of                                       // 85
  // their collections.                                                                                               // 86
                                                                                                                      //
  self._insecure = undefined;                                                                                         // 87
  self._validators = {                                                                                                // 89
    insert: {                                                                                                         // 90
      allow: [],                                                                                                      // 90
      deny: []                                                                                                        // 90
    },                                                                                                                // 90
    update: {                                                                                                         // 91
      allow: [],                                                                                                      // 91
      deny: []                                                                                                        // 91
    },                                                                                                                // 91
    remove: {                                                                                                         // 92
      allow: [],                                                                                                      // 92
      deny: []                                                                                                        // 92
    },                                                                                                                // 92
    upsert: {                                                                                                         // 93
      allow: [],                                                                                                      // 93
      deny: []                                                                                                        // 93
    },                                                                                                                // 93
    // dummy arrays; can't set these!                                                                                 // 93
    fetch: [],                                                                                                        // 94
    fetchAllFields: false                                                                                             // 95
  };                                                                                                                  // 89
  if (!self._name) return; // anonymous collection                                                                    // 98
  // XXX Think about method namespacing. Maybe methods should be                                                      // 101
  // "Meteor:Mongo:insert/NAME"?                                                                                      // 102
                                                                                                                      //
  self._prefix = '/' + self._name + '/'; // Mutation Methods                                                          // 103
  // Minimongo on the server gets no stubs; instead, by default                                                       // 106
  // it wait()s until its result is ready, yielding.                                                                  // 107
  // This matches the behavior of macromongo on the server better.                                                    // 108
  // XXX see #MeteorServerNull                                                                                        // 109
                                                                                                                      //
  if (self._connection && (self._connection === Meteor.server || Meteor.isClient)) {                                  // 110
    var m = {};                                                                                                       // 111
    ['insert', 'update', 'remove'].forEach(function (method) {                                                        // 113
      var methodName = self._prefix + method;                                                                         // 114
                                                                                                                      //
      if (options.useExisting) {                                                                                      // 116
        var handlerPropName = Meteor.isClient ? '_methodHandlers' : 'method_handlers'; // Do not try to create additional methods if this has already been called.
        // (Otherwise the .methods() call below will throw an error.)                                                 // 119
                                                                                                                      //
        if (self._connection[handlerPropName] && typeof self._connection[handlerPropName][methodName] === 'function') return;
      }                                                                                                               // 122
                                                                                                                      //
      m[methodName] = function () /* ... */{                                                                          // 124
        // All the methods do their own validation, instead of using check().                                         // 125
        check(arguments, [Match.Any]);                                                                                // 126
        var args = Array.from(arguments);                                                                             // 127
                                                                                                                      //
        try {                                                                                                         // 128
          // For an insert, if the client didn't specify an _id, generate one                                         // 129
          // now; because this uses DDP.randomStream, it will be consistent with                                      // 130
          // what the client generated. We generate it now rather than later so                                       // 131
          // that if (eg) an allow/deny rule does an insert to the same                                               // 132
          // collection (not that it really should), the generated _id will                                           // 133
          // still be the first use of the stream and will be consistent.                                             // 134
          //                                                                                                          // 135
          // However, we don't actually stick the _id onto the document yet,                                          // 136
          // because we want allow/deny rules to be able to differentiate                                             // 137
          // between arbitrary client-specified _id fields and merely                                                 // 138
          // client-controlled-via-randomSeed fields.                                                                 // 139
          var generatedId = null;                                                                                     // 140
                                                                                                                      //
          if (method === "insert" && !hasOwn.call(args[0], '_id')) {                                                  // 141
            generatedId = self._makeNewID();                                                                          // 142
          }                                                                                                           // 143
                                                                                                                      //
          if (this.isSimulation) {                                                                                    // 145
            // In a client simulation, you can do any mutation (even with a                                           // 146
            // complex selector).                                                                                     // 147
            if (generatedId !== null) args[0]._id = generatedId;                                                      // 148
            return self._collection[method].apply(self._collection, args);                                            // 150
          } // This is the server receiving a method call from the client.                                            // 152
          // We don't allow arbitrary selectors in mutations from the client: only                                    // 156
          // single-ID selectors.                                                                                     // 157
                                                                                                                      //
                                                                                                                      //
          if (method !== 'insert') throwIfSelectorIsNotId(args[0], method);                                           // 158
                                                                                                                      //
          if (self._restricted) {                                                                                     // 161
            // short circuit if there is no way it will pass.                                                         // 162
            if (self._validators[method].allow.length === 0) {                                                        // 163
              throw new Meteor.Error(403, "Access denied. No allow validators set on restricted " + "collection for method '" + method + "'.");
            }                                                                                                         // 167
                                                                                                                      //
            var validatedMethodName = '_validated' + method.charAt(0).toUpperCase() + method.slice(1);                // 169
            args.unshift(this.userId);                                                                                // 171
            method === 'insert' && args.push(generatedId);                                                            // 172
            return self[validatedMethodName].apply(self, args);                                                       // 173
          } else if (self._isInsecure()) {                                                                            // 174
            if (generatedId !== null) args[0]._id = generatedId; // In insecure mode, allow any mutation (with a simple selector).
            // XXX This is kind of bogus.  Instead of blindly passing whatever                                        // 178
            //     we get from the network to this function, we should actually                                       // 179
            //     know the correct arguments for the function and pass just                                          // 180
            //     them.  For example, if you have an extraneous extra null                                           // 181
            //     argument and this is Mongo on the server, the .wrapAsync'd                                         // 182
            //     functions like update will get confused and pass the                                               // 183
            //     "fut.resolver()" in the wrong slot, where _update will never                                       // 184
            //     invoke it. Bam, broken DDP connection.  Probably should just                                       // 185
            //     take this whole method and write it three times, invoking                                          // 186
            //     helpers for the common code.                                                                       // 187
                                                                                                                      //
            return self._collection[method].apply(self._collection, args);                                            // 188
          } else {                                                                                                    // 189
            // In secure mode, if we haven't called allow or deny, then nothing                                       // 190
            // is permitted.                                                                                          // 191
            throw new Meteor.Error(403, "Access denied");                                                             // 192
          }                                                                                                           // 193
        } catch (e) {                                                                                                 // 194
          if (e.name === 'MongoError' || e.name === 'MinimongoError') {                                               // 195
            throw new Meteor.Error(409, e.toString());                                                                // 196
          } else {                                                                                                    // 197
            throw e;                                                                                                  // 198
          }                                                                                                           // 199
        }                                                                                                             // 200
      };                                                                                                              // 201
    });                                                                                                               // 202
                                                                                                                      //
    self._connection.methods(m);                                                                                      // 204
  }                                                                                                                   // 205
};                                                                                                                    // 206
                                                                                                                      //
CollectionPrototype._updateFetch = function (fields) {                                                                // 208
  var self = this;                                                                                                    // 209
                                                                                                                      //
  if (!self._validators.fetchAllFields) {                                                                             // 211
    if (fields) {                                                                                                     // 212
      var union = Object.create(null);                                                                                // 213
                                                                                                                      //
      var add = function (names) {                                                                                    // 214
        return names && names.forEach(function (name) {                                                               // 214
          return union[name] = 1;                                                                                     // 214
        });                                                                                                           // 214
      };                                                                                                              // 214
                                                                                                                      //
      add(self._validators.fetch);                                                                                    // 215
      add(fields);                                                                                                    // 216
      self._validators.fetch = Object.keys(union);                                                                    // 217
    } else {                                                                                                          // 218
      self._validators.fetchAllFields = true; // clear fetch just to make sure we don't accidentally read it          // 219
                                                                                                                      //
      self._validators.fetch = null;                                                                                  // 221
    }                                                                                                                 // 222
  }                                                                                                                   // 223
};                                                                                                                    // 224
                                                                                                                      //
CollectionPrototype._isInsecure = function () {                                                                       // 226
  var self = this;                                                                                                    // 227
  if (self._insecure === undefined) return !!Package.insecure;                                                        // 228
  return self._insecure;                                                                                              // 230
};                                                                                                                    // 231
                                                                                                                      //
CollectionPrototype._validatedInsert = function (userId, doc, generatedId) {                                          // 233
  var self = this; // call user validators.                                                                           // 235
  // Any deny returns true means denied.                                                                              // 238
                                                                                                                      //
  if (self._validators.insert.deny.some(function (validator) {                                                        // 239
    return validator(userId, docToValidate(validator, doc, generatedId));                                             // 240
  })) {                                                                                                               // 241
    throw new Meteor.Error(403, "Access denied");                                                                     // 242
  } // Any allow returns true means proceed. Throw error if they all fail.                                            // 243
                                                                                                                      //
                                                                                                                      //
  if (self._validators.insert.allow.every(function (validator) {                                                      // 245
    return !validator(userId, docToValidate(validator, doc, generatedId));                                            // 246
  })) {                                                                                                               // 247
    throw new Meteor.Error(403, "Access denied");                                                                     // 248
  } // If we generated an ID above, insert it now: after the validation, but                                          // 249
  // before actually inserting.                                                                                       // 252
                                                                                                                      //
                                                                                                                      //
  if (generatedId !== null) doc._id = generatedId;                                                                    // 253
                                                                                                                      //
  self._collection.insert.call(self._collection, doc);                                                                // 256
}; // Simulate a mongo `update` operation while validating that the access                                            // 257
// control rules set by calls to `allow/deny` are satisfied. If all                                                   // 260
// pass, rewrite the mongo operation to use $in to set the list of                                                    // 261
// document ids to change ##ValidatedChange                                                                           // 262
                                                                                                                      //
                                                                                                                      //
CollectionPrototype._validatedUpdate = function (userId, selector, mutator, options) {                                // 263
  var self = this;                                                                                                    // 265
  check(mutator, Object);                                                                                             // 267
  options = Object.assign(Object.create(null), options);                                                              // 269
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) throw new Error("validated update should be of a single ID"); // We don't support upserts because they don't fit nicely into allow/deny
  // rules.                                                                                                           // 275
                                                                                                                      //
  if (options.upsert) throw new Meteor.Error(403, "Access denied. Upserts not " + "allowed in a restricted collection.");
  var noReplaceError = "Access denied. In a restricted collection you can only" + " update documents, not replace them. Use a Mongo update operator, such " + "as '$set'.";
  var mutatorKeys = Object.keys(mutator); // compute modified fields                                                  // 284
                                                                                                                      //
  var modifiedFields = {};                                                                                            // 287
                                                                                                                      //
  if (mutatorKeys.length === 0) {                                                                                     // 289
    throw new Meteor.Error(403, noReplaceError);                                                                      // 290
  }                                                                                                                   // 291
                                                                                                                      //
  mutatorKeys.forEach(function (op) {                                                                                 // 292
    var params = mutator[op];                                                                                         // 293
                                                                                                                      //
    if (op.charAt(0) !== '$') {                                                                                       // 294
      throw new Meteor.Error(403, noReplaceError);                                                                    // 295
    } else if (!hasOwn.call(ALLOWED_UPDATE_OPERATIONS, op)) {                                                         // 296
      throw new Meteor.Error(403, "Access denied. Operator " + op + " not allowed in a restricted collection.");      // 297
    } else {                                                                                                          // 299
      Object.keys(params).forEach(function (field) {                                                                  // 300
        // treat dotted fields as if they are replacing their                                                         // 301
        // top-level part                                                                                             // 302
        if (field.indexOf('.') !== -1) field = field.substring(0, field.indexOf('.')); // record the field we are trying to change
                                                                                                                      //
        modifiedFields[field] = true;                                                                                 // 307
      });                                                                                                             // 308
    }                                                                                                                 // 309
  });                                                                                                                 // 310
  var fields = Object.keys(modifiedFields);                                                                           // 312
  var findOptions = {                                                                                                 // 314
    transform: null                                                                                                   // 314
  };                                                                                                                  // 314
                                                                                                                      //
  if (!self._validators.fetchAllFields) {                                                                             // 315
    findOptions.fields = {};                                                                                          // 316
                                                                                                                      //
    self._validators.fetch.forEach(function (fieldName) {                                                             // 317
      findOptions.fields[fieldName] = 1;                                                                              // 318
    });                                                                                                               // 319
  }                                                                                                                   // 320
                                                                                                                      //
  var doc = self._collection.findOne(selector, findOptions);                                                          // 322
                                                                                                                      //
  if (!doc) // none satisfied!                                                                                        // 323
    return 0; // call user validators.                                                                                // 324
  // Any deny returns true means denied.                                                                              // 327
                                                                                                                      //
  if (self._validators.update.deny.some(function (validator) {                                                        // 328
    var factoriedDoc = transformDoc(validator, doc);                                                                  // 329
    return validator(userId, factoriedDoc, fields, mutator);                                                          // 330
  })) {                                                                                                               // 334
    throw new Meteor.Error(403, "Access denied");                                                                     // 335
  } // Any allow returns true means proceed. Throw error if they all fail.                                            // 336
                                                                                                                      //
                                                                                                                      //
  if (self._validators.update.allow.every(function (validator) {                                                      // 338
    var factoriedDoc = transformDoc(validator, doc);                                                                  // 339
    return !validator(userId, factoriedDoc, fields, mutator);                                                         // 340
  })) {                                                                                                               // 344
    throw new Meteor.Error(403, "Access denied");                                                                     // 345
  }                                                                                                                   // 346
                                                                                                                      //
  options._forbidReplace = true; // Back when we supported arbitrary client-provided selectors, we actually           // 348
  // rewrote the selector to include an _id clause before passing to Mongo to                                         // 351
  // avoid races, but since selector is guaranteed to already just be an ID, we                                       // 352
  // don't have to any more.                                                                                          // 353
                                                                                                                      //
  return self._collection.update.call(self._collection, selector, mutator, options);                                  // 355
}; // Only allow these operations in validated updates. Specifically                                                  // 357
// whitelist operations, rather than blacklist, so new complex                                                        // 360
// operations that are added aren't automatically allowed. A complex                                                  // 361
// operation is one that does more than just modify its target                                                        // 362
// field. For now this contains all update operations except '$rename'.                                               // 363
// http://docs.mongodb.org/manual/reference/operators/#update                                                         // 364
                                                                                                                      //
                                                                                                                      //
var ALLOWED_UPDATE_OPERATIONS = {                                                                                     // 365
  $inc: 1,                                                                                                            // 366
  $set: 1,                                                                                                            // 366
  $unset: 1,                                                                                                          // 366
  $addToSet: 1,                                                                                                       // 366
  $pop: 1,                                                                                                            // 366
  $pullAll: 1,                                                                                                        // 366
  $pull: 1,                                                                                                           // 366
  $pushAll: 1,                                                                                                        // 367
  $push: 1,                                                                                                           // 367
  $bit: 1                                                                                                             // 367
}; // Simulate a mongo `remove` operation while validating access control                                             // 365
// rules. See #ValidatedChange                                                                                        // 371
                                                                                                                      //
CollectionPrototype._validatedRemove = function (userId, selector) {                                                  // 372
  var self = this;                                                                                                    // 373
  var findOptions = {                                                                                                 // 375
    transform: null                                                                                                   // 375
  };                                                                                                                  // 375
                                                                                                                      //
  if (!self._validators.fetchAllFields) {                                                                             // 376
    findOptions.fields = {};                                                                                          // 377
                                                                                                                      //
    self._validators.fetch.forEach(function (fieldName) {                                                             // 378
      findOptions.fields[fieldName] = 1;                                                                              // 379
    });                                                                                                               // 380
  }                                                                                                                   // 381
                                                                                                                      //
  var doc = self._collection.findOne(selector, findOptions);                                                          // 383
                                                                                                                      //
  if (!doc) return 0; // call user validators.                                                                        // 384
  // Any deny returns true means denied.                                                                              // 388
                                                                                                                      //
  if (self._validators.remove.deny.some(function (validator) {                                                        // 389
    return validator(userId, transformDoc(validator, doc));                                                           // 390
  })) {                                                                                                               // 391
    throw new Meteor.Error(403, "Access denied");                                                                     // 392
  } // Any allow returns true means proceed. Throw error if they all fail.                                            // 393
                                                                                                                      //
                                                                                                                      //
  if (self._validators.remove.allow.every(function (validator) {                                                      // 395
    return !validator(userId, transformDoc(validator, doc));                                                          // 396
  })) {                                                                                                               // 397
    throw new Meteor.Error(403, "Access denied");                                                                     // 398
  } // Back when we supported arbitrary client-provided selectors, we actually                                        // 399
  // rewrote the selector to {_id: {$in: [ids that we found]}} before passing to                                      // 402
  // Mongo to avoid races, but since selector is guaranteed to already just be                                        // 403
  // an ID, we don't have to any more.                                                                                // 404
                                                                                                                      //
                                                                                                                      //
  return self._collection.remove.call(self._collection, selector);                                                    // 406
};                                                                                                                    // 407
                                                                                                                      //
CollectionPrototype._callMutatorMethod = function () {                                                                // 409
  function _callMutatorMethod(name, args, callback) {                                                                 // 409
    if (Meteor.isClient && !callback && !alreadyInSimulation()) {                                                     // 410
      // Client can't block, so it can't report errors by exception,                                                  // 411
      // only by callback. If they forget the callback, give them a                                                   // 412
      // default one that logs the error, so they aren't totally                                                      // 413
      // baffled if their writes don't work because their database is                                                 // 414
      // down.                                                                                                        // 415
      // Don't give a default callback in simulation, because inside stubs we                                         // 416
      // want to return the results from the local collection immediately and                                         // 417
      // not force a callback.                                                                                        // 418
      callback = function (err) {                                                                                     // 419
        if (err) Meteor._debug(name + " failed: " + (err.reason || err.stack));                                       // 420
      };                                                                                                              // 422
    } // For two out of three mutator methods, the first argument is a selector                                       // 423
                                                                                                                      //
                                                                                                                      //
    var firstArgIsSelector = name === "update" || name === "remove";                                                  // 426
                                                                                                                      //
    if (firstArgIsSelector && !alreadyInSimulation()) {                                                               // 427
      // If we're about to actually send an RPC, we should throw an error if                                          // 428
      // this is a non-ID selector, because the mutation methods only allow                                           // 429
      // single-ID selectors. (If we don't throw here, we'll see flicker.)                                            // 430
      throwIfSelectorIsNotId(args[0], name);                                                                          // 431
    }                                                                                                                 // 432
                                                                                                                      //
    var mutatorMethodName = this._prefix + name;                                                                      // 434
    return this._connection.apply(mutatorMethodName, args, {                                                          // 435
      returnStubValue: true                                                                                           // 436
    }, callback);                                                                                                     // 436
  }                                                                                                                   // 437
                                                                                                                      //
  return _callMutatorMethod;                                                                                          // 409
}();                                                                                                                  // 409
                                                                                                                      //
function transformDoc(validator, doc) {                                                                               // 439
  if (validator.transform) return validator.transform(doc);                                                           // 440
  return doc;                                                                                                         // 442
}                                                                                                                     // 443
                                                                                                                      //
function docToValidate(validator, doc, generatedId) {                                                                 // 445
  var ret = doc;                                                                                                      // 446
                                                                                                                      //
  if (validator.transform) {                                                                                          // 447
    ret = EJSON.clone(doc); // If you set a server-side transform on your collection, then you don't get              // 448
    // to tell the difference between "client specified the ID" and "server                                           // 450
    // generated the ID", because transforms expect to get _id.  If you want to                                       // 451
    // do that check, you can do it with a specific                                                                   // 452
    // `C.allow({insert: f, transform: null})` validator.                                                             // 453
                                                                                                                      //
    if (generatedId !== null) {                                                                                       // 454
      ret._id = generatedId;                                                                                          // 455
    }                                                                                                                 // 456
                                                                                                                      //
    ret = validator.transform(ret);                                                                                   // 457
  }                                                                                                                   // 458
                                                                                                                      //
  return ret;                                                                                                         // 459
}                                                                                                                     // 460
                                                                                                                      //
function addValidator(collection, allowOrDeny, options) {                                                             // 462
  // validate keys                                                                                                    // 463
  var validKeysRegEx = /^(?:insert|update|remove|fetch|transform)$/;                                                  // 464
  Object.keys(options).forEach(function (key) {                                                                       // 465
    if (!validKeysRegEx.test(key)) throw new Error(allowOrDeny + ": Invalid key: " + key);                            // 466
  });                                                                                                                 // 468
  collection._restricted = true;                                                                                      // 470
  ['insert', 'update', 'remove'].forEach(function (name) {                                                            // 472
    if (hasOwn.call(options, name)) {                                                                                 // 473
      if (!(options[name] instanceof Function)) {                                                                     // 474
        throw new Error(allowOrDeny + ": Value for `" + name + "` must be a function");                               // 475
      } // If the transform is specified at all (including as 'null') in this                                         // 476
      // call, then take that; otherwise, take the transform from the                                                 // 479
      // collection.                                                                                                  // 480
                                                                                                                      //
                                                                                                                      //
      if (options.transform === undefined) {                                                                          // 481
        options[name].transform = collection._transform; // already wrapped                                           // 482
      } else {                                                                                                        // 483
        options[name].transform = LocalCollection.wrapTransform(options.transform);                                   // 484
      }                                                                                                               // 486
                                                                                                                      //
      collection._validators[name][allowOrDeny].push(options[name]);                                                  // 488
    }                                                                                                                 // 489
  }); // Only update the fetch fields if we're passed things that affect                                              // 490
  // fetching. This way allow({}) and allow({insert: f}) don't result in                                              // 493
  // setting fetchAllFields                                                                                           // 494
                                                                                                                      //
  if (options.update || options.remove || options.fetch) {                                                            // 495
    if (options.fetch && !(options.fetch instanceof Array)) {                                                         // 496
      throw new Error(allowOrDeny + ": Value for `fetch` must be an array");                                          // 497
    }                                                                                                                 // 498
                                                                                                                      //
    collection._updateFetch(options.fetch);                                                                           // 499
  }                                                                                                                   // 500
}                                                                                                                     // 501
                                                                                                                      //
function throwIfSelectorIsNotId(selector, methodName) {                                                               // 503
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {                                                      // 504
    throw new Meteor.Error(403, "Not permitted. Untrusted code may only " + methodName + " documents by ID.");        // 505
  }                                                                                                                   // 508
}                                                                                                                     // 509
                                                                                                                      //
; // Determine if we are in a DDP method simulation                                                                   // 509
                                                                                                                      //
function alreadyInSimulation() {                                                                                      // 512
  var CurrentInvocation = DDP._CurrentMethodInvocation || // For backwards compatibility, as explained in this issue:
  // https://github.com/meteor/meteor/issues/8947                                                                     // 516
  DDP._CurrentInvocation;                                                                                             // 517
  var enclosing = CurrentInvocation.get();                                                                            // 519
  return enclosing && enclosing.isSimulation;                                                                         // 520
}                                                                                                                     // 521
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("./node_modules/meteor/allow-deny/allow-deny.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['allow-deny'] = {}, {
  AllowDeny: AllowDeny
});

})();

//# sourceMappingURL=allow-deny.js.map

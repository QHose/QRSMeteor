(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var NpmModuleMongodb = Package['npm-mongo'].NpmModuleMongodb;
var NpmModuleMongodbVersion = Package['npm-mongo'].NpmModuleMongodbVersion;
var AllowDeny = Package['allow-deny'].AllowDeny;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var MongoID = Package['mongo-id'].MongoID;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var MaxHeap = Package['binary-heap'].MaxHeap;
var MinHeap = Package['binary-heap'].MinHeap;
var MinMaxHeap = Package['binary-heap'].MinMaxHeap;
var Hook = Package['callback-hook'].Hook;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var MongoInternals, MongoTest, MongoConnection, CursorDescription, Cursor, listenAll, forEachTrigger, OPLOG_COLLECTION, idForOp, OplogHandle, ObserveMultiplexer, ObserveHandle, DocFetcher, PollingObserveDriver, OplogObserveDriver, LocalCollectionDriver, Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"mongo":{"mongo_driver.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/mongo_driver.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
/**                                                                                                                    // 1
 * Provide a synchronous Collection API using fibers, backed by                                                        //
 * MongoDB.  This is only for use on the server, and mostly identical                                                  //
 * to the client API.                                                                                                  //
 *                                                                                                                     //
 * NOTE: the public API methods must be run within a fiber. If you call                                                //
 * these outside of a fiber they will explode!                                                                         //
 */var path = Npm.require('path');                                                                                     //
                                                                                                                       //
var MongoDB = NpmModuleMongodb;                                                                                        // 11
                                                                                                                       //
var Future = Npm.require(path.join('fibers', 'future'));                                                               // 12
                                                                                                                       //
MongoInternals = {};                                                                                                   // 14
MongoTest = {};                                                                                                        // 15
MongoInternals.NpmModules = {                                                                                          // 17
  mongodb: {                                                                                                           // 18
    version: NpmModuleMongodbVersion,                                                                                  // 19
    module: MongoDB                                                                                                    // 20
  }                                                                                                                    // 18
}; // Older version of what is now available via                                                                       // 17
// MongoInternals.NpmModules.mongodb.module.  It was never documented, but                                             // 25
// people do use it.                                                                                                   // 26
// XXX COMPAT WITH 1.0.3.2                                                                                             // 27
                                                                                                                       //
MongoInternals.NpmModule = MongoDB; // This is used to add or remove EJSON from the beginning of everything nested     // 28
// inside an EJSON custom type. It should only be called on pure JSON!                                                 // 31
                                                                                                                       //
var replaceNames = function (filter, thing) {                                                                          // 32
  if ((typeof thing === "undefined" ? "undefined" : (0, _typeof3.default)(thing)) === "object") {                      // 33
    if (_.isArray(thing)) {                                                                                            // 34
      return _.map(thing, _.bind(replaceNames, null, filter));                                                         // 35
    }                                                                                                                  // 36
                                                                                                                       //
    var ret = {};                                                                                                      // 37
                                                                                                                       //
    _.each(thing, function (value, key) {                                                                              // 38
      ret[filter(key)] = replaceNames(filter, value);                                                                  // 39
    });                                                                                                                // 40
                                                                                                                       //
    return ret;                                                                                                        // 41
  }                                                                                                                    // 42
                                                                                                                       //
  return thing;                                                                                                        // 43
}; // Ensure that EJSON.clone keeps a Timestamp as a Timestamp (instead of just                                        // 44
// doing a structural clone).                                                                                          // 47
// XXX how ok is this? what if there are multiple copies of MongoDB loaded?                                            // 48
                                                                                                                       //
                                                                                                                       //
MongoDB.Timestamp.prototype.clone = function () {                                                                      // 49
  // Timestamps should be immutable.                                                                                   // 50
  return this;                                                                                                         // 51
};                                                                                                                     // 52
                                                                                                                       //
var makeMongoLegal = function (name) {                                                                                 // 54
  return "EJSON" + name;                                                                                               // 54
};                                                                                                                     // 54
                                                                                                                       //
var unmakeMongoLegal = function (name) {                                                                               // 55
  return name.substr(5);                                                                                               // 55
};                                                                                                                     // 55
                                                                                                                       //
var replaceMongoAtomWithMeteor = function (document) {                                                                 // 57
  if (document instanceof MongoDB.Binary) {                                                                            // 58
    var buffer = document.value(true);                                                                                 // 59
    return new Uint8Array(buffer);                                                                                     // 60
  }                                                                                                                    // 61
                                                                                                                       //
  if (document instanceof MongoDB.ObjectID) {                                                                          // 62
    return new Mongo.ObjectID(document.toHexString());                                                                 // 63
  }                                                                                                                    // 64
                                                                                                                       //
  if (document["EJSON$type"] && document["EJSON$value"] && _.size(document) === 2) {                                   // 65
    return EJSON.fromJSONValue(replaceNames(unmakeMongoLegal, document));                                              // 66
  }                                                                                                                    // 67
                                                                                                                       //
  if (document instanceof MongoDB.Timestamp) {                                                                         // 68
    // For now, the Meteor representation of a Mongo timestamp type (not a date!                                       // 69
    // this is a weird internal thing used in the oplog!) is the same as the                                           // 70
    // Mongo representation. We need to do this explicitly or else we would do a                                       // 71
    // structural clone and lose the prototype.                                                                        // 72
    return document;                                                                                                   // 73
  }                                                                                                                    // 74
                                                                                                                       //
  return undefined;                                                                                                    // 75
};                                                                                                                     // 76
                                                                                                                       //
var replaceMeteorAtomWithMongo = function (document) {                                                                 // 78
  if (EJSON.isBinary(document)) {                                                                                      // 79
    // This does more copies than we'd like, but is necessary because                                                  // 80
    // MongoDB.BSON only looks like it takes a Uint8Array (and doesn't actually                                        // 81
    // serialize it correctly).                                                                                        // 82
    return new MongoDB.Binary(new Buffer(document));                                                                   // 83
  }                                                                                                                    // 84
                                                                                                                       //
  if (document instanceof Mongo.ObjectID) {                                                                            // 85
    return new MongoDB.ObjectID(document.toHexString());                                                               // 86
  }                                                                                                                    // 87
                                                                                                                       //
  if (document instanceof MongoDB.Timestamp) {                                                                         // 88
    // For now, the Meteor representation of a Mongo timestamp type (not a date!                                       // 89
    // this is a weird internal thing used in the oplog!) is the same as the                                           // 90
    // Mongo representation. We need to do this explicitly or else we would do a                                       // 91
    // structural clone and lose the prototype.                                                                        // 92
    return document;                                                                                                   // 93
  }                                                                                                                    // 94
                                                                                                                       //
  if (EJSON._isCustomType(document)) {                                                                                 // 95
    return replaceNames(makeMongoLegal, EJSON.toJSONValue(document));                                                  // 96
  } // It is not ordinarily possible to stick dollar-sign keys into mongo                                              // 97
  // so we don't bother checking for things that need escaping at this time.                                           // 99
                                                                                                                       //
                                                                                                                       //
  return undefined;                                                                                                    // 100
};                                                                                                                     // 101
                                                                                                                       //
var replaceTypes = function (document, atomTransformer) {                                                              // 103
  if ((typeof document === "undefined" ? "undefined" : (0, _typeof3.default)(document)) !== 'object' || document === null) return document;
  var replacedTopLevelAtom = atomTransformer(document);                                                                // 107
  if (replacedTopLevelAtom !== undefined) return replacedTopLevelAtom;                                                 // 108
  var ret = document;                                                                                                  // 111
                                                                                                                       //
  _.each(document, function (val, key) {                                                                               // 112
    var valReplaced = replaceTypes(val, atomTransformer);                                                              // 113
                                                                                                                       //
    if (val !== valReplaced) {                                                                                         // 114
      // Lazy clone. Shallow copy.                                                                                     // 115
      if (ret === document) ret = _.clone(document);                                                                   // 116
      ret[key] = valReplaced;                                                                                          // 118
    }                                                                                                                  // 119
  });                                                                                                                  // 120
                                                                                                                       //
  return ret;                                                                                                          // 121
};                                                                                                                     // 122
                                                                                                                       //
MongoConnection = function (url, options) {                                                                            // 125
  var self = this;                                                                                                     // 126
  options = options || {};                                                                                             // 127
  self._observeMultiplexers = {};                                                                                      // 128
  self._onFailoverHook = new Hook();                                                                                   // 129
  var mongoOptions = Object.assign({                                                                                   // 131
    // Reconnect on error.                                                                                             // 132
    autoReconnect: true,                                                                                               // 133
    // Try to reconnect forever, instead of stopping after 30 tries (the                                               // 134
    // default), with each attempt separated by 1000ms.                                                                // 135
    reconnectTries: Infinity                                                                                           // 136
  }, Mongo._connectionOptions); // Disable the native parser by default, unless specifically enabled                   // 131
  // in the mongo URL.                                                                                                 // 140
  // - The native driver can cause errors which normally would be                                                      // 141
  //   thrown, caught, and handled into segfaults that take down the                                                   // 142
  //   whole app.                                                                                                      // 143
  // - Binary modules don't yet work when you bundle and move the bundle                                               // 144
  //   to a different platform (aka deploy)                                                                            // 145
  // We should revisit this after binary npm module support lands.                                                     // 146
                                                                                                                       //
  if (!/[\?&]native_?[pP]arser=/.test(url)) {                                                                          // 147
    mongoOptions.native_parser = false;                                                                                // 148
  } // Internally the oplog connections specify their own poolSize                                                     // 149
  // which we don't want to overwrite with any user defined value                                                      // 152
                                                                                                                       //
                                                                                                                       //
  if (_.has(options, 'poolSize')) {                                                                                    // 153
    // If we just set this for "server", replSet will override it. If we just                                          // 154
    // set it for replSet, it will be ignored if we're not using a replSet.                                            // 155
    mongoOptions.poolSize = options.poolSize;                                                                          // 156
  }                                                                                                                    // 157
                                                                                                                       //
  self.db = null; // We keep track of the ReplSet's primary, so that we can trigger hooks when                         // 159
  // it changes.  The Node driver's joined callback seems to fire way too                                              // 161
  // often, which is why we need to track it ourselves.                                                                // 162
                                                                                                                       //
  self._primary = null;                                                                                                // 163
  self._oplogHandle = null;                                                                                            // 164
  self._docFetcher = null;                                                                                             // 165
  var connectFuture = new Future();                                                                                    // 168
  MongoDB.connect(url, mongoOptions, Meteor.bindEnvironment(function (err, db) {                                       // 169
    if (err) {                                                                                                         // 174
      throw err;                                                                                                       // 175
    } // First, figure out what the current primary is, if any.                                                        // 176
                                                                                                                       //
                                                                                                                       //
    if (db.serverConfig.isMasterDoc) {                                                                                 // 179
      self._primary = db.serverConfig.isMasterDoc.primary;                                                             // 180
    }                                                                                                                  // 181
                                                                                                                       //
    db.serverConfig.on('joined', Meteor.bindEnvironment(function (kind, doc) {                                         // 183
      if (kind === 'primary') {                                                                                        // 185
        if (doc.primary !== self._primary) {                                                                           // 186
          self._primary = doc.primary;                                                                                 // 187
                                                                                                                       //
          self._onFailoverHook.each(function (callback) {                                                              // 188
            callback();                                                                                                // 189
            return true;                                                                                               // 190
          });                                                                                                          // 191
        }                                                                                                              // 192
      } else if (doc.me === self._primary) {                                                                           // 193
        // The thing we thought was primary is now something other than                                                // 194
        // primary.  Forget that we thought it was primary.  (This means                                               // 195
        // that if a server stops being primary and then starts being                                                  // 196
        // primary again without another server becoming primary in the                                                // 197
        // middle, we'll correctly count it as a failover.)                                                            // 198
        self._primary = null;                                                                                          // 199
      }                                                                                                                // 200
    })); // Allow the constructor to return.                                                                           // 201
                                                                                                                       //
    connectFuture['return'](db);                                                                                       // 204
  }, connectFuture.resolver() // onException                                                                           // 205
  )); // Wait for the connection to be successful; throws on failure.                                                  // 172
                                                                                                                       //
  self.db = connectFuture.wait();                                                                                      // 211
                                                                                                                       //
  if (options.oplogUrl && !Package['disable-oplog']) {                                                                 // 213
    self._oplogHandle = new OplogHandle(options.oplogUrl, self.db.databaseName);                                       // 214
    self._docFetcher = new DocFetcher(self);                                                                           // 215
  }                                                                                                                    // 216
};                                                                                                                     // 217
                                                                                                                       //
MongoConnection.prototype.close = function () {                                                                        // 219
  var self = this;                                                                                                     // 220
  if (!self.db) throw Error("close called before Connection created?"); // XXX probably untested                       // 222
                                                                                                                       //
  var oplogHandle = self._oplogHandle;                                                                                 // 226
  self._oplogHandle = null;                                                                                            // 227
  if (oplogHandle) oplogHandle.stop(); // Use Future.wrap so that errors get thrown. This happens to                   // 228
  // work even outside a fiber since the 'close' method is not                                                         // 232
  // actually asynchronous.                                                                                            // 233
                                                                                                                       //
  Future.wrap(_.bind(self.db.close, self.db))(true).wait();                                                            // 234
}; // Returns the Mongo Collection object; may yield.                                                                  // 235
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype.rawCollection = function (collectionName) {                                                  // 238
  var self = this;                                                                                                     // 239
  if (!self.db) throw Error("rawCollection called before Connection created?");                                        // 241
  var future = new Future();                                                                                           // 244
  self.db.collection(collectionName, future.resolver());                                                               // 245
  return future.wait();                                                                                                // 246
};                                                                                                                     // 247
                                                                                                                       //
MongoConnection.prototype._createCappedCollection = function (collectionName, byteSize, maxDocuments) {                // 249
  var self = this;                                                                                                     // 251
  if (!self.db) throw Error("_createCappedCollection called before Connection created?");                              // 253
  var future = new Future();                                                                                           // 256
  self.db.createCollection(collectionName, {                                                                           // 257
    capped: true,                                                                                                      // 259
    size: byteSize,                                                                                                    // 259
    max: maxDocuments                                                                                                  // 259
  }, future.resolver());                                                                                               // 259
  future.wait();                                                                                                       // 261
}; // This should be called synchronously with a write, to create a                                                    // 262
// transaction on the current write fence, if any. After we can read                                                   // 265
// the write, and after observers have been notified (or at least,                                                     // 266
// after the observer notifiers have added themselves to the write                                                     // 267
// fence), you should call 'committed()' on the object returned.                                                       // 268
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype._maybeBeginWrite = function () {                                                             // 269
  var fence = DDPServer._CurrentWriteFence.get();                                                                      // 270
                                                                                                                       //
  if (fence) {                                                                                                         // 271
    return fence.beginWrite();                                                                                         // 272
  } else {                                                                                                             // 273
    return {                                                                                                           // 274
      committed: function () {}                                                                                        // 274
    };                                                                                                                 // 274
  }                                                                                                                    // 275
}; // Internal interface: adds a callback which is called when the Mongo primary                                       // 276
// changes. Returns a stop handle.                                                                                     // 279
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype._onFailover = function (callback) {                                                          // 280
  return this._onFailoverHook.register(callback);                                                                      // 281
}; //////////// Public API //////////                                                                                  // 282
// The write methods block until the database has confirmed the write (it may                                          // 287
// not be replicated or stable on disk, but one server has confirmed it) if no                                         // 288
// callback is provided. If a callback is provided, then they call the callback                                        // 289
// when the write is confirmed. They return nothing on success, and raise an                                           // 290
// exception on failure.                                                                                               // 291
//                                                                                                                     // 292
// After making a write (with insert, update, remove), observers are                                                   // 293
// notified asynchronously. If you want to receive a callback once all                                                 // 294
// of the observer notifications have landed for your write, do the                                                    // 295
// writes inside a write fence (set DDPServer._CurrentWriteFence to a new                                              // 296
// _WriteFence, and then set a callback on the write fence.)                                                           // 297
//                                                                                                                     // 298
// Since our execution environment is single-threaded, this is                                                         // 299
// well-defined -- a write "has been made" if it's returned, and an                                                    // 300
// observer "has been notified" if its callback has returned.                                                          // 301
                                                                                                                       //
                                                                                                                       //
var writeCallback = function (write, refresh, callback) {                                                              // 303
  return function (err, result) {                                                                                      // 304
    if (!err) {                                                                                                        // 305
      // XXX We don't have to run this on error, right?                                                                // 306
      try {                                                                                                            // 307
        refresh();                                                                                                     // 308
      } catch (refreshErr) {                                                                                           // 309
        if (callback) {                                                                                                // 310
          callback(refreshErr);                                                                                        // 311
          return;                                                                                                      // 312
        } else {                                                                                                       // 313
          throw refreshErr;                                                                                            // 314
        }                                                                                                              // 315
      }                                                                                                                // 316
    }                                                                                                                  // 317
                                                                                                                       //
    write.committed();                                                                                                 // 318
                                                                                                                       //
    if (callback) {                                                                                                    // 319
      callback(err, result);                                                                                           // 320
    } else if (err) {                                                                                                  // 321
      throw err;                                                                                                       // 322
    }                                                                                                                  // 323
  };                                                                                                                   // 324
};                                                                                                                     // 325
                                                                                                                       //
var bindEnvironmentForWrite = function (callback) {                                                                    // 327
  return Meteor.bindEnvironment(callback, "Mongo write");                                                              // 328
};                                                                                                                     // 329
                                                                                                                       //
MongoConnection.prototype._insert = function (collection_name, document, callback) {                                   // 331
  var self = this;                                                                                                     // 333
                                                                                                                       //
  var sendError = function (e) {                                                                                       // 335
    if (callback) return callback(e);                                                                                  // 336
    throw e;                                                                                                           // 338
  };                                                                                                                   // 339
                                                                                                                       //
  if (collection_name === "___meteor_failure_test_collection") {                                                       // 341
    var e = new Error("Failure test");                                                                                 // 342
    e.expected = true;                                                                                                 // 343
    sendError(e);                                                                                                      // 344
    return;                                                                                                            // 345
  }                                                                                                                    // 346
                                                                                                                       //
  if (!(LocalCollection._isPlainObject(document) && !EJSON._isCustomType(document))) {                                 // 348
    sendError(new Error("Only plain objects may be inserted into MongoDB"));                                           // 350
    return;                                                                                                            // 352
  }                                                                                                                    // 353
                                                                                                                       //
  var write = self._maybeBeginWrite();                                                                                 // 355
                                                                                                                       //
  var refresh = function () {                                                                                          // 356
    Meteor.refresh({                                                                                                   // 357
      collection: collection_name,                                                                                     // 357
      id: document._id                                                                                                 // 357
    });                                                                                                                // 357
  };                                                                                                                   // 358
                                                                                                                       //
  callback = bindEnvironmentForWrite(writeCallback(write, refresh, callback));                                         // 359
                                                                                                                       //
  try {                                                                                                                // 360
    var collection = self.rawCollection(collection_name);                                                              // 361
    collection.insert(replaceTypes(document, replaceMeteorAtomWithMongo), {                                            // 362
      safe: true                                                                                                       // 363
    }, callback);                                                                                                      // 363
  } catch (err) {                                                                                                      // 364
    write.committed();                                                                                                 // 365
    throw err;                                                                                                         // 366
  }                                                                                                                    // 367
}; // Cause queries that may be affected by the selector to poll in this write                                         // 368
// fence.                                                                                                              // 371
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype._refresh = function (collectionName, selector) {                                             // 372
  var refreshKey = {                                                                                                   // 373
    collection: collectionName                                                                                         // 373
  }; // If we know which documents we're removing, don't poll queries that are                                         // 373
  // specific to other documents. (Note that multiple notifications here should                                        // 375
  // not cause multiple polls, since all our listener is doing is enqueueing a                                         // 376
  // poll.)                                                                                                            // 377
                                                                                                                       //
  var specificIds = LocalCollection._idsMatchedBySelector(selector);                                                   // 378
                                                                                                                       //
  if (specificIds) {                                                                                                   // 379
    _.each(specificIds, function (id) {                                                                                // 380
      Meteor.refresh(_.extend({                                                                                        // 381
        id: id                                                                                                         // 381
      }, refreshKey));                                                                                                 // 381
    });                                                                                                                // 382
  } else {                                                                                                             // 383
    Meteor.refresh(refreshKey);                                                                                        // 384
  }                                                                                                                    // 385
};                                                                                                                     // 386
                                                                                                                       //
MongoConnection.prototype._remove = function (collection_name, selector, callback) {                                   // 388
  var self = this;                                                                                                     // 390
                                                                                                                       //
  if (collection_name === "___meteor_failure_test_collection") {                                                       // 392
    var e = new Error("Failure test");                                                                                 // 393
    e.expected = true;                                                                                                 // 394
                                                                                                                       //
    if (callback) {                                                                                                    // 395
      return callback(e);                                                                                              // 396
    } else {                                                                                                           // 397
      throw e;                                                                                                         // 398
    }                                                                                                                  // 399
  }                                                                                                                    // 400
                                                                                                                       //
  var write = self._maybeBeginWrite();                                                                                 // 402
                                                                                                                       //
  var refresh = function () {                                                                                          // 403
    self._refresh(collection_name, selector);                                                                          // 404
  };                                                                                                                   // 405
                                                                                                                       //
  callback = bindEnvironmentForWrite(writeCallback(write, refresh, callback));                                         // 406
                                                                                                                       //
  try {                                                                                                                // 408
    var collection = self.rawCollection(collection_name);                                                              // 409
                                                                                                                       //
    var wrappedCallback = function (err, driverResult) {                                                               // 410
      callback(err, transformResult(driverResult).numberAffected);                                                     // 411
    };                                                                                                                 // 412
                                                                                                                       //
    collection.remove(replaceTypes(selector, replaceMeteorAtomWithMongo), {                                            // 413
      safe: true                                                                                                       // 414
    }, wrappedCallback);                                                                                               // 414
  } catch (err) {                                                                                                      // 415
    write.committed();                                                                                                 // 416
    throw err;                                                                                                         // 417
  }                                                                                                                    // 418
};                                                                                                                     // 419
                                                                                                                       //
MongoConnection.prototype._dropCollection = function (collectionName, cb) {                                            // 421
  var self = this;                                                                                                     // 422
                                                                                                                       //
  var write = self._maybeBeginWrite();                                                                                 // 424
                                                                                                                       //
  var refresh = function () {                                                                                          // 425
    Meteor.refresh({                                                                                                   // 426
      collection: collectionName,                                                                                      // 426
      id: null,                                                                                                        // 426
      dropCollection: true                                                                                             // 427
    });                                                                                                                // 426
  };                                                                                                                   // 428
                                                                                                                       //
  cb = bindEnvironmentForWrite(writeCallback(write, refresh, cb));                                                     // 429
                                                                                                                       //
  try {                                                                                                                // 431
    var collection = self.rawCollection(collectionName);                                                               // 432
    collection.drop(cb);                                                                                               // 433
  } catch (e) {                                                                                                        // 434
    write.committed();                                                                                                 // 435
    throw e;                                                                                                           // 436
  }                                                                                                                    // 437
}; // For testing only.  Slightly better than `c.rawDatabase().dropDatabase()`                                         // 438
// because it lets the test's fence wait for it to be complete.                                                        // 441
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype._dropDatabase = function (cb) {                                                              // 442
  var self = this;                                                                                                     // 443
                                                                                                                       //
  var write = self._maybeBeginWrite();                                                                                 // 445
                                                                                                                       //
  var refresh = function () {                                                                                          // 446
    Meteor.refresh({                                                                                                   // 447
      dropDatabase: true                                                                                               // 447
    });                                                                                                                // 447
  };                                                                                                                   // 448
                                                                                                                       //
  cb = bindEnvironmentForWrite(writeCallback(write, refresh, cb));                                                     // 449
                                                                                                                       //
  try {                                                                                                                // 451
    self.db.dropDatabase(cb);                                                                                          // 452
  } catch (e) {                                                                                                        // 453
    write.committed();                                                                                                 // 454
    throw e;                                                                                                           // 455
  }                                                                                                                    // 456
};                                                                                                                     // 457
                                                                                                                       //
MongoConnection.prototype._update = function (collection_name, selector, mod, options, callback) {                     // 459
  var self = this;                                                                                                     // 461
                                                                                                                       //
  if (!callback && options instanceof Function) {                                                                      // 463
    callback = options;                                                                                                // 464
    options = null;                                                                                                    // 465
  }                                                                                                                    // 466
                                                                                                                       //
  if (collection_name === "___meteor_failure_test_collection") {                                                       // 468
    var e = new Error("Failure test");                                                                                 // 469
    e.expected = true;                                                                                                 // 470
                                                                                                                       //
    if (callback) {                                                                                                    // 471
      return callback(e);                                                                                              // 472
    } else {                                                                                                           // 473
      throw e;                                                                                                         // 474
    }                                                                                                                  // 475
  } // explicit safety check. null and undefined can crash the mongo                                                   // 476
  // driver. Although the node driver and minimongo do 'support'                                                       // 479
  // non-object modifier in that they don't crash, they are not                                                        // 480
  // meaningful operations and do not do anything. Defensively throw an                                                // 481
  // error here.                                                                                                       // 482
                                                                                                                       //
                                                                                                                       //
  if (!mod || (typeof mod === "undefined" ? "undefined" : (0, _typeof3.default)(mod)) !== 'object') throw new Error("Invalid modifier. Modifier must be an object.");
                                                                                                                       //
  if (!(LocalCollection._isPlainObject(mod) && !EJSON._isCustomType(mod))) {                                           // 486
    throw new Error("Only plain objects may be used as replacement" + " documents in MongoDB");                        // 488
  }                                                                                                                    // 491
                                                                                                                       //
  if (!options) options = {};                                                                                          // 493
                                                                                                                       //
  var write = self._maybeBeginWrite();                                                                                 // 495
                                                                                                                       //
  var refresh = function () {                                                                                          // 496
    self._refresh(collection_name, selector);                                                                          // 497
  };                                                                                                                   // 498
                                                                                                                       //
  callback = writeCallback(write, refresh, callback);                                                                  // 499
                                                                                                                       //
  try {                                                                                                                // 500
    var collection = self.rawCollection(collection_name);                                                              // 501
    var mongoOpts = {                                                                                                  // 502
      safe: true                                                                                                       // 502
    }; // explictly enumerate options that minimongo supports                                                          // 502
                                                                                                                       //
    if (options.upsert) mongoOpts.upsert = true;                                                                       // 504
    if (options.multi) mongoOpts.multi = true; // Lets you get a more more full result from MongoDB. Use with caution:
    // might not work with C.upsert (as opposed to C.update({upsert:true}) or                                          // 507
    // with simulated upsert.                                                                                          // 508
                                                                                                                       //
    if (options.fullResult) mongoOpts.fullResult = true;                                                               // 509
    var mongoSelector = replaceTypes(selector, replaceMeteorAtomWithMongo);                                            // 511
    var mongoMod = replaceTypes(mod, replaceMeteorAtomWithMongo);                                                      // 512
                                                                                                                       //
    var isModify = LocalCollection._isModificationMod(mongoMod);                                                       // 514
                                                                                                                       //
    if (options._forbidReplace && !isModify) {                                                                         // 516
      var err = new Error("Invalid modifier. Replacements are forbidden.");                                            // 517
                                                                                                                       //
      if (callback) {                                                                                                  // 518
        return callback(err);                                                                                          // 519
      } else {                                                                                                         // 520
        throw err;                                                                                                     // 521
      }                                                                                                                // 522
    } // We've already run replaceTypes/replaceMeteorAtomWithMongo on                                                  // 523
    // selector and mod.  We assume it doesn't matter, as far as                                                       // 526
    // the behavior of modifiers is concerned, whether `_modify`                                                       // 527
    // is run on EJSON or on mongo-converted EJSON.                                                                    // 528
    // Run this code up front so that it fails fast if someone uses                                                    // 530
    // a Mongo update operator we don't support.                                                                       // 531
                                                                                                                       //
                                                                                                                       //
    var knownId = void 0;                                                                                              // 532
                                                                                                                       //
    if (options.upsert) {                                                                                              // 533
      try {                                                                                                            // 534
        var newDoc = LocalCollection._createUpsertDocument(selector, mod);                                             // 535
                                                                                                                       //
        knownId = newDoc._id;                                                                                          // 536
      } catch (err) {                                                                                                  // 537
        if (callback) {                                                                                                // 538
          return callback(err);                                                                                        // 539
        } else {                                                                                                       // 540
          throw err;                                                                                                   // 541
        }                                                                                                              // 542
      }                                                                                                                // 543
    }                                                                                                                  // 544
                                                                                                                       //
    if (options.upsert && !isModify && !knownId && options.insertedId && !(options.insertedId instanceof Mongo.ObjectID && options.generatedId)) {
      // In case of an upsert with a replacement, where there is no _id defined                                        // 552
      // in either the query or the replacement doc, mongo will generate an id itself.                                 // 553
      // Therefore we need this special strategy if we want to control the id ourselves.                               // 554
      // We don't need to do this when:                                                                                // 556
      // - This is not a replacement, so we can add an _id to $setOnInsert                                             // 557
      // - The id is defined by query or mod we can just add it to the replacement doc                                 // 558
      // - The user did not specify any id preference and the id is a Mongo ObjectId,                                  // 559
      //     then we can just let Mongo generate the id                                                                // 560
      simulateUpsertWithInsertedId(collection, mongoSelector, mongoMod, options, // This callback does not need to be bindEnvironment'ed because
      // simulateUpsertWithInsertedId() wraps it and then passes it through                                            // 565
      // bindEnvironmentForWrite.                                                                                      // 566
      function (error, result) {                                                                                       // 567
        // If we got here via a upsert() call, then options._returnObject will                                         // 568
        // be set and we should return the whole object. Otherwise, we should                                          // 569
        // just return the number of affected docs to match the mongo API.                                             // 570
        if (result && !options._returnObject) {                                                                        // 571
          callback(error, result.numberAffected);                                                                      // 572
        } else {                                                                                                       // 573
          callback(error, result);                                                                                     // 574
        }                                                                                                              // 575
      });                                                                                                              // 576
    } else {                                                                                                           // 578
      if (options.upsert && !knownId && options.insertedId && isModify) {                                              // 580
        if (!mongoMod.hasOwnProperty('$setOnInsert')) {                                                                // 581
          mongoMod.$setOnInsert = {};                                                                                  // 582
        }                                                                                                              // 583
                                                                                                                       //
        knownId = options.insertedId;                                                                                  // 584
        Object.assign(mongoMod.$setOnInsert, replaceTypes({                                                            // 585
          _id: options.insertedId                                                                                      // 585
        }, replaceMeteorAtomWithMongo));                                                                               // 585
      }                                                                                                                // 586
                                                                                                                       //
      collection.update(mongoSelector, mongoMod, mongoOpts, bindEnvironmentForWrite(function (err, result) {           // 588
        if (!err) {                                                                                                    // 591
          var meteorResult = transformResult(result);                                                                  // 592
                                                                                                                       //
          if (meteorResult && options._returnObject) {                                                                 // 593
            // If this was an upsert() call, and we ended up                                                           // 594
            // inserting a new doc and we know its id, then                                                            // 595
            // return that id as well.                                                                                 // 596
            if (options.upsert && meteorResult.insertedId) {                                                           // 597
              if (knownId) {                                                                                           // 598
                meteorResult.insertedId = knownId;                                                                     // 599
              } else if (meteorResult.insertedId instanceof MongoDB.ObjectID) {                                        // 600
                meteorResult.insertedId = new Mongo.ObjectID(meteorResult.insertedId.toHexString());                   // 601
              }                                                                                                        // 602
            }                                                                                                          // 603
                                                                                                                       //
            callback(err, meteorResult);                                                                               // 605
          } else {                                                                                                     // 606
            callback(err, meteorResult.numberAffected);                                                                // 607
          }                                                                                                            // 608
        } else {                                                                                                       // 609
          callback(err);                                                                                               // 610
        }                                                                                                              // 611
      }));                                                                                                             // 612
    }                                                                                                                  // 613
  } catch (e) {                                                                                                        // 614
    write.committed();                                                                                                 // 615
    throw e;                                                                                                           // 616
  }                                                                                                                    // 617
};                                                                                                                     // 618
                                                                                                                       //
var transformResult = function (driverResult) {                                                                        // 620
  var meteorResult = {                                                                                                 // 621
    numberAffected: 0                                                                                                  // 621
  };                                                                                                                   // 621
                                                                                                                       //
  if (driverResult) {                                                                                                  // 622
    var mongoResult = driverResult.result; // On updates with upsert:true, the inserted values come as a list of       // 623
    // upserted values -- even with options.multi, when the upsert does insert,                                        // 626
    // it only inserts one element.                                                                                    // 627
                                                                                                                       //
    if (mongoResult.upserted) {                                                                                        // 628
      meteorResult.numberAffected += mongoResult.upserted.length;                                                      // 629
                                                                                                                       //
      if (mongoResult.upserted.length == 1) {                                                                          // 631
        meteorResult.insertedId = mongoResult.upserted[0]._id;                                                         // 632
      }                                                                                                                // 633
    } else {                                                                                                           // 634
      meteorResult.numberAffected = mongoResult.n;                                                                     // 635
    }                                                                                                                  // 636
  }                                                                                                                    // 637
                                                                                                                       //
  return meteorResult;                                                                                                 // 639
};                                                                                                                     // 640
                                                                                                                       //
var NUM_OPTIMISTIC_TRIES = 3; // exposed for testing                                                                   // 643
                                                                                                                       //
MongoConnection._isCannotChangeIdError = function (err) {                                                              // 646
  // Mongo 3.2.* returns error as next Object:                                                                         // 648
  // {name: String, code: Number, errmsg: String}                                                                      // 649
  // Older Mongo returns:                                                                                              // 650
  // {name: String, code: Number, err: String}                                                                         // 651
  var error = err.errmsg || err.err; // We don't use the error code here                                               // 652
  // because the error code we observed it producing (16837) appears to be                                             // 655
  // a far more generic error code based on examining the source.                                                      // 656
                                                                                                                       //
  if (error.indexOf('The _id field cannot be changed') === 0 || error.indexOf("the (immutable) field '_id' was found to have been altered to _id") !== -1) {
    return true;                                                                                                       // 659
  }                                                                                                                    // 660
                                                                                                                       //
  return false;                                                                                                        // 662
};                                                                                                                     // 663
                                                                                                                       //
var simulateUpsertWithInsertedId = function (collection, selector, mod, options, callback) {                           // 665
  // STRATEGY: First try doing an upsert with a generated ID.                                                          // 667
  // If this throws an error about changing the ID on an existing document                                             // 668
  // then without affecting the database, we know we should probably try                                               // 669
  // an update without the generated ID. If it affected 0 documents,                                                   // 670
  // then without affecting the database, we the document that first                                                   // 671
  // gave the error is probably removed and we need to try an insert again                                             // 672
  // We go back to step one and repeat.                                                                                // 673
  // Like all "optimistic write" schemes, we rely on the fact that it's                                                // 674
  // unlikely our writes will continue to be interfered with under normal                                              // 675
  // circumstances (though sufficiently heavy contention with writers                                                  // 676
  // disagreeing on the existence of an object will cause writes to fail                                               // 677
  // in theory).                                                                                                       // 678
  var insertedId = options.insertedId; // must exist                                                                   // 680
                                                                                                                       //
  var mongoOptsForUpdate = {                                                                                           // 681
    safe: true,                                                                                                        // 682
    multi: options.multi                                                                                               // 683
  };                                                                                                                   // 681
  var mongoOptsForInsert = {                                                                                           // 685
    safe: true,                                                                                                        // 686
    upsert: true                                                                                                       // 687
  };                                                                                                                   // 685
  var replacementWithId = Object.assign(replaceTypes({                                                                 // 690
    _id: insertedId                                                                                                    // 691
  }, replaceMeteorAtomWithMongo), mod);                                                                                // 691
  var tries = NUM_OPTIMISTIC_TRIES;                                                                                    // 694
                                                                                                                       //
  var doUpdate = function () {                                                                                         // 696
    tries--;                                                                                                           // 697
                                                                                                                       //
    if (!tries) {                                                                                                      // 698
      callback(new Error("Upsert failed after " + NUM_OPTIMISTIC_TRIES + " tries."));                                  // 699
    } else {                                                                                                           // 700
      collection.update(selector, mod, mongoOptsForUpdate, bindEnvironmentForWrite(function (err, result) {            // 701
        if (err) {                                                                                                     // 703
          callback(err);                                                                                               // 704
        } else if (result && result.result.n != 0) {                                                                   // 705
          callback(null, {                                                                                             // 706
            numberAffected: result.result.n                                                                            // 707
          });                                                                                                          // 706
        } else {                                                                                                       // 709
          doConditionalInsert();                                                                                       // 710
        }                                                                                                              // 711
      }));                                                                                                             // 712
    }                                                                                                                  // 713
  };                                                                                                                   // 714
                                                                                                                       //
  var doConditionalInsert = function () {                                                                              // 716
    collection.update(selector, replacementWithId, mongoOptsForInsert, bindEnvironmentForWrite(function (err, result) {
      if (err) {                                                                                                       // 719
        // figure out if this is a                                                                                     // 720
        // "cannot change _id of document" error, and                                                                  // 721
        // if so, try doUpdate() again, up to 3 times.                                                                 // 722
        if (MongoConnection._isCannotChangeIdError(err)) {                                                             // 723
          doUpdate();                                                                                                  // 724
        } else {                                                                                                       // 725
          callback(err);                                                                                               // 726
        }                                                                                                              // 727
      } else {                                                                                                         // 728
        callback(null, {                                                                                               // 729
          numberAffected: result.result.upserted.length,                                                               // 730
          insertedId: insertedId                                                                                       // 731
        });                                                                                                            // 729
      }                                                                                                                // 733
    }));                                                                                                               // 734
  };                                                                                                                   // 735
                                                                                                                       //
  doUpdate();                                                                                                          // 737
};                                                                                                                     // 738
                                                                                                                       //
_.each(["insert", "update", "remove", "dropCollection", "dropDatabase"], function (method) {                           // 740
  MongoConnection.prototype[method] = function () /* arguments */{                                                     // 741
    var self = this;                                                                                                   // 742
    return Meteor.wrapAsync(self["_" + method]).apply(self, arguments);                                                // 743
  };                                                                                                                   // 744
}); // XXX MongoConnection.upsert() does not return the id of the inserted document                                    // 745
// unless you set it explicitly in the selector or modifier (as a replacement                                          // 748
// doc).                                                                                                               // 749
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype.upsert = function (collectionName, selector, mod, options, callback) {                       // 750
  var self = this;                                                                                                     // 752
                                                                                                                       //
  if (typeof options === "function" && !callback) {                                                                    // 753
    callback = options;                                                                                                // 754
    options = {};                                                                                                      // 755
  }                                                                                                                    // 756
                                                                                                                       //
  return self.update(collectionName, selector, mod, _.extend({}, options, {                                            // 758
    upsert: true,                                                                                                      // 760
    _returnObject: true                                                                                                // 761
  }), callback);                                                                                                       // 759
};                                                                                                                     // 763
                                                                                                                       //
MongoConnection.prototype.find = function (collectionName, selector, options) {                                        // 765
  var self = this;                                                                                                     // 766
  if (arguments.length === 1) selector = {};                                                                           // 768
  return new Cursor(self, new CursorDescription(collectionName, selector, options));                                   // 771
};                                                                                                                     // 773
                                                                                                                       //
MongoConnection.prototype.findOne = function (collection_name, selector, options) {                                    // 775
  var self = this;                                                                                                     // 777
  if (arguments.length === 1) selector = {};                                                                           // 778
  options = options || {};                                                                                             // 781
  options.limit = 1;                                                                                                   // 782
  return self.find(collection_name, selector, options).fetch()[0];                                                     // 783
}; // We'll actually design an index API later. For now, we just pass through to                                       // 784
// Mongo's, but make it synchronous.                                                                                   // 787
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype._ensureIndex = function (collectionName, index, options) {                                   // 788
  var self = this; // We expect this function to be called at startup, not from within a method,                       // 790
  // so we don't interact with the write fence.                                                                        // 793
                                                                                                                       //
  var collection = self.rawCollection(collectionName);                                                                 // 794
  var future = new Future();                                                                                           // 795
  var indexName = collection.ensureIndex(index, options, future.resolver());                                           // 796
  future.wait();                                                                                                       // 797
};                                                                                                                     // 798
                                                                                                                       //
MongoConnection.prototype._dropIndex = function (collectionName, index) {                                              // 799
  var self = this; // This function is only used by test code, not within a method, so we don't                        // 800
  // interact with the write fence.                                                                                    // 803
                                                                                                                       //
  var collection = self.rawCollection(collectionName);                                                                 // 804
  var future = new Future();                                                                                           // 805
  var indexName = collection.dropIndex(index, future.resolver());                                                      // 806
  future.wait();                                                                                                       // 807
}; // CURSORS                                                                                                          // 808
// There are several classes which relate to cursors:                                                                  // 812
//                                                                                                                     // 813
// CursorDescription represents the arguments used to construct a cursor:                                              // 814
// collectionName, selector, and (find) options.  Because it is used as a key                                          // 815
// for cursor de-dup, everything in it should either be JSON-stringifiable or                                          // 816
// not affect observeChanges output (eg, options.transform functions are not                                           // 817
// stringifiable but do not affect observeChanges).                                                                    // 818
//                                                                                                                     // 819
// SynchronousCursor is a wrapper around a MongoDB cursor                                                              // 820
// which includes fully-synchronous versions of forEach, etc.                                                          // 821
//                                                                                                                     // 822
// Cursor is the cursor object returned from find(), which implements the                                              // 823
// documented Mongo.Collection cursor API.  It wraps a CursorDescription and a                                         // 824
// SynchronousCursor (lazily: it doesn't contact Mongo until you call a method                                         // 825
// like fetch or forEach on it).                                                                                       // 826
//                                                                                                                     // 827
// ObserveHandle is the "observe handle" returned from observeChanges. It has a                                        // 828
// reference to an ObserveMultiplexer.                                                                                 // 829
//                                                                                                                     // 830
// ObserveMultiplexer allows multiple identical ObserveHandles to be driven by a                                       // 831
// single observe driver.                                                                                              // 832
//                                                                                                                     // 833
// There are two "observe drivers" which drive ObserveMultiplexers:                                                    // 834
//   - PollingObserveDriver caches the results of a query and reruns it when                                           // 835
//     necessary.                                                                                                      // 836
//   - OplogObserveDriver follows the Mongo operation log to directly observe                                          // 837
//     database changes.                                                                                               // 838
// Both implementations follow the same simple interface: when you create them,                                        // 839
// they start sending observeChanges callbacks (and a ready() invocation) to                                           // 840
// their ObserveMultiplexer, and you stop them by calling their stop() method.                                         // 841
                                                                                                                       //
                                                                                                                       //
CursorDescription = function (collectionName, selector, options) {                                                     // 843
  var self = this;                                                                                                     // 844
  self.collectionName = collectionName;                                                                                // 845
  self.selector = Mongo.Collection._rewriteSelector(selector);                                                         // 846
  self.options = options || {};                                                                                        // 847
};                                                                                                                     // 848
                                                                                                                       //
Cursor = function (mongo, cursorDescription) {                                                                         // 850
  var self = this;                                                                                                     // 851
  self._mongo = mongo;                                                                                                 // 853
  self._cursorDescription = cursorDescription;                                                                         // 854
  self._synchronousCursor = null;                                                                                      // 855
};                                                                                                                     // 856
                                                                                                                       //
_.each(['forEach', 'map', 'fetch', 'count'], function (method) {                                                       // 858
  Cursor.prototype[method] = function () {                                                                             // 859
    var self = this; // You can only observe a tailable cursor.                                                        // 860
                                                                                                                       //
    if (self._cursorDescription.options.tailable) throw new Error("Cannot call " + method + " on a tailable cursor");  // 863
                                                                                                                       //
    if (!self._synchronousCursor) {                                                                                    // 866
      self._synchronousCursor = self._mongo._createSynchronousCursor(self._cursorDescription, {                        // 867
        // Make sure that the "self" argument to forEach/map callbacks is the                                          // 869
        // Cursor, not the SynchronousCursor.                                                                          // 870
        selfForIteration: self,                                                                                        // 871
        useTransform: true                                                                                             // 872
      });                                                                                                              // 868
    }                                                                                                                  // 874
                                                                                                                       //
    return self._synchronousCursor[method].apply(self._synchronousCursor, arguments);                                  // 876
  };                                                                                                                   // 878
}); // Since we don't actually have a "nextObject" interface, there's really no                                        // 879
// reason to have a "rewind" interface.  All it did was make multiple calls                                            // 882
// to fetch/map/forEach return nothing the second time.                                                                // 883
// XXX COMPAT WITH 0.8.1                                                                                               // 884
                                                                                                                       //
                                                                                                                       //
Cursor.prototype.rewind = function () {};                                                                              // 885
                                                                                                                       //
Cursor.prototype.getTransform = function () {                                                                          // 888
  return this._cursorDescription.options.transform;                                                                    // 889
}; // When you call Meteor.publish() with a function that returns a Cursor, we need                                    // 890
// to transmute it into the equivalent subscription.  This is the function that                                        // 893
// does that.                                                                                                          // 894
                                                                                                                       //
                                                                                                                       //
Cursor.prototype._publishCursor = function (sub) {                                                                     // 896
  var self = this;                                                                                                     // 897
  var collection = self._cursorDescription.collectionName;                                                             // 898
  return Mongo.Collection._publishCursor(self, sub, collection);                                                       // 899
}; // Used to guarantee that publish functions return at most one cursor per                                           // 900
// collection. Private, because we might later have cursors that include                                               // 903
// documents from multiple collections somehow.                                                                        // 904
                                                                                                                       //
                                                                                                                       //
Cursor.prototype._getCollectionName = function () {                                                                    // 905
  var self = this;                                                                                                     // 906
  return self._cursorDescription.collectionName;                                                                       // 907
};                                                                                                                     // 908
                                                                                                                       //
Cursor.prototype.observe = function (callbacks) {                                                                      // 910
  var self = this;                                                                                                     // 911
  return LocalCollection._observeFromObserveChanges(self, callbacks);                                                  // 912
};                                                                                                                     // 913
                                                                                                                       //
Cursor.prototype.observeChanges = function (callbacks) {                                                               // 915
  var self = this;                                                                                                     // 916
  var methods = ['addedAt', 'added', 'changedAt', 'changed', 'removedAt', 'removed', 'movedTo'];                       // 917
                                                                                                                       //
  var ordered = LocalCollection._observeChangesCallbacksAreOrdered(callbacks); // XXX: Can we find out if callbacks are from observe?
                                                                                                                       //
                                                                                                                       //
  var exceptionName = ' observe/observeChanges callback';                                                              // 929
  methods.forEach(function (method) {                                                                                  // 930
    if (callbacks[method] && typeof callbacks[method] == "function") {                                                 // 931
      callbacks[method] = Meteor.bindEnvironment(callbacks[method], method + exceptionName);                           // 932
    }                                                                                                                  // 933
  });                                                                                                                  // 934
  return self._mongo._observeChanges(self._cursorDescription, ordered, callbacks);                                     // 936
};                                                                                                                     // 938
                                                                                                                       //
MongoConnection.prototype._createSynchronousCursor = function (cursorDescription, options) {                           // 940
  var self = this;                                                                                                     // 942
  options = _.pick(options || {}, 'selfForIteration', 'useTransform');                                                 // 943
  var collection = self.rawCollection(cursorDescription.collectionName);                                               // 945
  var cursorOptions = cursorDescription.options;                                                                       // 946
  var mongoOptions = {                                                                                                 // 947
    sort: cursorOptions.sort,                                                                                          // 948
    limit: cursorOptions.limit,                                                                                        // 949
    skip: cursorOptions.skip                                                                                           // 950
  }; // Do we want a tailable cursor (which only works on capped collections)?                                         // 947
                                                                                                                       //
  if (cursorOptions.tailable) {                                                                                        // 954
    // We want a tailable cursor...                                                                                    // 955
    mongoOptions.tailable = true; // ... and for the server to wait a bit if any getMore has no data (rather           // 956
    // than making us put the relevant sleeps in the client)...                                                        // 958
                                                                                                                       //
    mongoOptions.awaitdata = true; // ... and to keep querying the server indefinitely rather than just 5 times        // 959
    // if there's no more data.                                                                                        // 961
                                                                                                                       //
    mongoOptions.numberOfRetries = -1; // And if this is on the oplog collection and the cursor specifies a 'ts',      // 962
    // then set the undocumented oplog replay flag, which does a special scan to                                       // 964
    // find the first document (instead of creating an index on ts). This is a                                         // 965
    // very hard-coded Mongo flag which only works on the oplog collection and                                         // 966
    // only works with the ts field.                                                                                   // 967
                                                                                                                       //
    if (cursorDescription.collectionName === OPLOG_COLLECTION && cursorDescription.selector.ts) {                      // 968
      mongoOptions.oplogReplay = true;                                                                                 // 970
    }                                                                                                                  // 971
  }                                                                                                                    // 972
                                                                                                                       //
  var dbCursor = collection.find(replaceTypes(cursorDescription.selector, replaceMeteorAtomWithMongo), cursorOptions.fields, mongoOptions);
                                                                                                                       //
  if (typeof cursorOptions.maxTimeMs !== 'undefined') {                                                                // 978
    dbCursor = dbCursor.maxTimeMS(cursorOptions.maxTimeMs);                                                            // 979
  }                                                                                                                    // 980
                                                                                                                       //
  if (typeof cursorOptions.hint !== 'undefined') {                                                                     // 981
    dbCursor = dbCursor.hint(cursorOptions.hint);                                                                      // 982
  }                                                                                                                    // 983
                                                                                                                       //
  return new SynchronousCursor(dbCursor, cursorDescription, options);                                                  // 985
};                                                                                                                     // 986
                                                                                                                       //
var SynchronousCursor = function (dbCursor, cursorDescription, options) {                                              // 988
  var self = this;                                                                                                     // 989
  options = _.pick(options || {}, 'selfForIteration', 'useTransform');                                                 // 990
  self._dbCursor = dbCursor;                                                                                           // 992
  self._cursorDescription = cursorDescription; // The "self" argument passed to forEach/map callbacks. If we're wrapped
  // inside a user-visible Cursor, we want to provide the outer cursor!                                                // 995
                                                                                                                       //
  self._selfForIteration = options.selfForIteration || self;                                                           // 996
                                                                                                                       //
  if (options.useTransform && cursorDescription.options.transform) {                                                   // 997
    self._transform = LocalCollection.wrapTransform(cursorDescription.options.transform);                              // 998
  } else {                                                                                                             // 1000
    self._transform = null;                                                                                            // 1001
  } // Need to specify that the callback is the first argument to nextObject,                                          // 1002
  // since otherwise when we try to call it with no args the driver will                                               // 1005
  // interpret "undefined" first arg as an options hash and crash.                                                     // 1006
                                                                                                                       //
                                                                                                                       //
  self._synchronousNextObject = Future.wrap(dbCursor.nextObject.bind(dbCursor), 0);                                    // 1007
  self._synchronousCount = Future.wrap(dbCursor.count.bind(dbCursor));                                                 // 1009
  self._visitedIds = new LocalCollection._IdMap();                                                                     // 1010
};                                                                                                                     // 1011
                                                                                                                       //
_.extend(SynchronousCursor.prototype, {                                                                                // 1013
  _nextObject: function () {                                                                                           // 1014
    var self = this;                                                                                                   // 1015
                                                                                                                       //
    while (true) {                                                                                                     // 1017
      var doc = self._synchronousNextObject().wait();                                                                  // 1018
                                                                                                                       //
      if (!doc) return null;                                                                                           // 1020
      doc = replaceTypes(doc, replaceMongoAtomWithMeteor);                                                             // 1021
                                                                                                                       //
      if (!self._cursorDescription.options.tailable && _.has(doc, '_id')) {                                            // 1023
        // Did Mongo give us duplicate documents in the same cursor? If so,                                            // 1024
        // ignore this one. (Do this before the transform, since transform might                                       // 1025
        // return some unrelated value.) We don't do this for tailable cursors,                                        // 1026
        // because we want to maintain O(1) memory usage. And if there isn't _id                                       // 1027
        // for some reason (maybe it's the oplog), then we don't do this either.                                       // 1028
        // (Be careful to do this for falsey but existing _id, though.)                                                // 1029
        if (self._visitedIds.has(doc._id)) continue;                                                                   // 1030
                                                                                                                       //
        self._visitedIds.set(doc._id, true);                                                                           // 1031
      }                                                                                                                // 1032
                                                                                                                       //
      if (self._transform) doc = self._transform(doc);                                                                 // 1034
      return doc;                                                                                                      // 1037
    }                                                                                                                  // 1038
  },                                                                                                                   // 1039
  forEach: function (callback, thisArg) {                                                                              // 1041
    var self = this; // Get back to the beginning.                                                                     // 1042
                                                                                                                       //
    self._rewind(); // We implement the loop ourself instead of using self._dbCursor.each,                             // 1045
    // because "each" will call its callback outside of a fiber which makes it                                         // 1048
    // much more complex to make this function synchronous.                                                            // 1049
                                                                                                                       //
                                                                                                                       //
    var index = 0;                                                                                                     // 1050
                                                                                                                       //
    while (true) {                                                                                                     // 1051
      var doc = self._nextObject();                                                                                    // 1052
                                                                                                                       //
      if (!doc) return;                                                                                                // 1053
      callback.call(thisArg, doc, index++, self._selfForIteration);                                                    // 1054
    }                                                                                                                  // 1055
  },                                                                                                                   // 1056
  // XXX Allow overlapping callback executions if callback yields.                                                     // 1058
  map: function (callback, thisArg) {                                                                                  // 1059
    var self = this;                                                                                                   // 1060
    var res = [];                                                                                                      // 1061
    self.forEach(function (doc, index) {                                                                               // 1062
      res.push(callback.call(thisArg, doc, index, self._selfForIteration));                                            // 1063
    });                                                                                                                // 1064
    return res;                                                                                                        // 1065
  },                                                                                                                   // 1066
  _rewind: function () {                                                                                               // 1068
    var self = this; // known to be synchronous                                                                        // 1069
                                                                                                                       //
    self._dbCursor.rewind();                                                                                           // 1072
                                                                                                                       //
    self._visitedIds = new LocalCollection._IdMap();                                                                   // 1074
  },                                                                                                                   // 1075
  // Mostly usable for tailable cursors.                                                                               // 1077
  close: function () {                                                                                                 // 1078
    var self = this;                                                                                                   // 1079
                                                                                                                       //
    self._dbCursor.close();                                                                                            // 1081
  },                                                                                                                   // 1082
  fetch: function () {                                                                                                 // 1084
    var self = this;                                                                                                   // 1085
    return self.map(_.identity);                                                                                       // 1086
  },                                                                                                                   // 1087
  count: function () {                                                                                                 // 1089
    var applySkipLimit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;                    // 1089
    var self = this;                                                                                                   // 1090
    return self._synchronousCount(applySkipLimit).wait();                                                              // 1091
  },                                                                                                                   // 1092
  // This method is NOT wrapped in Cursor.                                                                             // 1094
  getRawObjects: function (ordered) {                                                                                  // 1095
    var self = this;                                                                                                   // 1096
                                                                                                                       //
    if (ordered) {                                                                                                     // 1097
      return self.fetch();                                                                                             // 1098
    } else {                                                                                                           // 1099
      var results = new LocalCollection._IdMap();                                                                      // 1100
      self.forEach(function (doc) {                                                                                    // 1101
        results.set(doc._id, doc);                                                                                     // 1102
      });                                                                                                              // 1103
      return results;                                                                                                  // 1104
    }                                                                                                                  // 1105
  }                                                                                                                    // 1106
});                                                                                                                    // 1013
                                                                                                                       //
MongoConnection.prototype.tail = function (cursorDescription, docCallback) {                                           // 1109
  var self = this;                                                                                                     // 1110
  if (!cursorDescription.options.tailable) throw new Error("Can only tail a tailable cursor");                         // 1111
                                                                                                                       //
  var cursor = self._createSynchronousCursor(cursorDescription);                                                       // 1114
                                                                                                                       //
  var stopped = false;                                                                                                 // 1116
  var lastTS;                                                                                                          // 1117
                                                                                                                       //
  var loop = function () {                                                                                             // 1118
    var doc = null;                                                                                                    // 1119
                                                                                                                       //
    while (true) {                                                                                                     // 1120
      if (stopped) return;                                                                                             // 1121
                                                                                                                       //
      try {                                                                                                            // 1123
        doc = cursor._nextObject();                                                                                    // 1124
      } catch (err) {                                                                                                  // 1125
        // There's no good way to figure out if this was actually an error                                             // 1126
        // from Mongo. Ah well. But either way, we need to retry the cursor                                            // 1127
        // (unless the failure was because the observe got stopped).                                                   // 1128
        doc = null;                                                                                                    // 1129
      } // Since cursor._nextObject can yield, we need to check again to see if                                        // 1130
      // we've been stopped before calling the callback.                                                               // 1132
                                                                                                                       //
                                                                                                                       //
      if (stopped) return;                                                                                             // 1133
                                                                                                                       //
      if (doc) {                                                                                                       // 1135
        // If a tailable cursor contains a "ts" field, use it to recreate the                                          // 1136
        // cursor on error. ("ts" is a standard that Mongo uses internally for                                         // 1137
        // the oplog, and there's a special flag that lets you do binary search                                        // 1138
        // on it instead of needing to use an index.)                                                                  // 1139
        lastTS = doc.ts;                                                                                               // 1140
        docCallback(doc);                                                                                              // 1141
      } else {                                                                                                         // 1142
        var newSelector = _.clone(cursorDescription.selector);                                                         // 1143
                                                                                                                       //
        if (lastTS) {                                                                                                  // 1144
          newSelector.ts = {                                                                                           // 1145
            $gt: lastTS                                                                                                // 1145
          };                                                                                                           // 1145
        }                                                                                                              // 1146
                                                                                                                       //
        cursor = self._createSynchronousCursor(new CursorDescription(cursorDescription.collectionName, newSelector, cursorDescription.options)); // Mongo failover takes many seconds.  Retry in a bit.  (Without this
        // setTimeout, we peg the CPU at 100% and never notice the actual                                              // 1152
        // failover.                                                                                                   // 1153
                                                                                                                       //
        Meteor.setTimeout(loop, 100);                                                                                  // 1154
        break;                                                                                                         // 1155
      }                                                                                                                // 1156
    }                                                                                                                  // 1157
  };                                                                                                                   // 1158
                                                                                                                       //
  Meteor.defer(loop);                                                                                                  // 1160
  return {                                                                                                             // 1162
    stop: function () {                                                                                                // 1163
      stopped = true;                                                                                                  // 1164
      cursor.close();                                                                                                  // 1165
    }                                                                                                                  // 1166
  };                                                                                                                   // 1162
};                                                                                                                     // 1168
                                                                                                                       //
MongoConnection.prototype._observeChanges = function (cursorDescription, ordered, callbacks) {                         // 1170
  var self = this;                                                                                                     // 1172
                                                                                                                       //
  if (cursorDescription.options.tailable) {                                                                            // 1174
    return self._observeChangesTailable(cursorDescription, ordered, callbacks);                                        // 1175
  } // You may not filter out _id when observing changes, because the id is a core                                     // 1176
  // part of the observeChanges API.                                                                                   // 1179
                                                                                                                       //
                                                                                                                       //
  if (cursorDescription.options.fields && (cursorDescription.options.fields._id === 0 || cursorDescription.options.fields._id === false)) {
    throw Error("You may not observe a cursor with {fields: {_id: 0}}");                                               // 1183
  }                                                                                                                    // 1184
                                                                                                                       //
  var observeKey = EJSON.stringify(_.extend({                                                                          // 1186
    ordered: ordered                                                                                                   // 1187
  }, cursorDescription));                                                                                              // 1187
  var multiplexer, observeDriver;                                                                                      // 1189
  var firstHandle = false; // Find a matching ObserveMultiplexer, or create a new one. This next block is              // 1190
  // guaranteed to not yield (and it doesn't call anything that can observe a                                          // 1193
  // new query), so no other calls to this function can interleave with it.                                            // 1194
                                                                                                                       //
  Meteor._noYieldsAllowed(function () {                                                                                // 1195
    if (_.has(self._observeMultiplexers, observeKey)) {                                                                // 1196
      multiplexer = self._observeMultiplexers[observeKey];                                                             // 1197
    } else {                                                                                                           // 1198
      firstHandle = true; // Create a new ObserveMultiplexer.                                                          // 1199
                                                                                                                       //
      multiplexer = new ObserveMultiplexer({                                                                           // 1201
        ordered: ordered,                                                                                              // 1202
        onStop: function () {                                                                                          // 1203
          delete self._observeMultiplexers[observeKey];                                                                // 1204
          observeDriver.stop();                                                                                        // 1205
        }                                                                                                              // 1206
      });                                                                                                              // 1201
      self._observeMultiplexers[observeKey] = multiplexer;                                                             // 1208
    }                                                                                                                  // 1209
  });                                                                                                                  // 1210
                                                                                                                       //
  var observeHandle = new ObserveHandle(multiplexer, callbacks);                                                       // 1212
                                                                                                                       //
  if (firstHandle) {                                                                                                   // 1214
    var matcher, sorter;                                                                                               // 1215
                                                                                                                       //
    var canUseOplog = _.all([function () {                                                                             // 1216
      // At a bare minimum, using the oplog requires us to have an oplog, to                                           // 1218
      // want unordered callbacks, and to not want a callback on the polls                                             // 1219
      // that won't happen.                                                                                            // 1220
      return self._oplogHandle && !ordered && !callbacks._testOnlyPollCallback;                                        // 1221
    }, function () {                                                                                                   // 1223
      // We need to be able to compile the selector. Fall back to polling for                                          // 1224
      // some newfangled $selector that minimongo doesn't support yet.                                                 // 1225
      try {                                                                                                            // 1226
        matcher = new Minimongo.Matcher(cursorDescription.selector);                                                   // 1227
        return true;                                                                                                   // 1228
      } catch (e) {                                                                                                    // 1229
        // XXX make all compilation errors MinimongoError or something                                                 // 1230
        //     so that this doesn't ignore unrelated exceptions                                                        // 1231
        return false;                                                                                                  // 1232
      }                                                                                                                // 1233
    }, function () {                                                                                                   // 1234
      // ... and the selector itself needs to support oplog.                                                           // 1235
      return OplogObserveDriver.cursorSupported(cursorDescription, matcher);                                           // 1236
    }, function () {                                                                                                   // 1237
      // And we need to be able to compile the sort, if any.  eg, can't be                                             // 1238
      // {$natural: 1}.                                                                                                // 1239
      if (!cursorDescription.options.sort) return true;                                                                // 1240
                                                                                                                       //
      try {                                                                                                            // 1242
        sorter = new Minimongo.Sorter(cursorDescription.options.sort, {                                                // 1243
          matcher: matcher                                                                                             // 1244
        });                                                                                                            // 1244
        return true;                                                                                                   // 1245
      } catch (e) {                                                                                                    // 1246
        // XXX make all compilation errors MinimongoError or something                                                 // 1247
        //     so that this doesn't ignore unrelated exceptions                                                        // 1248
        return false;                                                                                                  // 1249
      }                                                                                                                // 1250
    }], function (f) {                                                                                                 // 1251
      return f();                                                                                                      // 1251
    }); // invoke each function                                                                                        // 1251
                                                                                                                       //
                                                                                                                       //
    var driverClass = canUseOplog ? OplogObserveDriver : PollingObserveDriver;                                         // 1253
    observeDriver = new driverClass({                                                                                  // 1254
      cursorDescription: cursorDescription,                                                                            // 1255
      mongoHandle: self,                                                                                               // 1256
      multiplexer: multiplexer,                                                                                        // 1257
      ordered: ordered,                                                                                                // 1258
      matcher: matcher,                                                                                                // 1259
      // ignored by polling                                                                                            // 1259
      sorter: sorter,                                                                                                  // 1260
      // ignored by polling                                                                                            // 1260
      _testOnlyPollCallback: callbacks._testOnlyPollCallback                                                           // 1261
    }); // This field is only set for use in tests.                                                                    // 1254
                                                                                                                       //
    multiplexer._observeDriver = observeDriver;                                                                        // 1265
  } // Blocks until the initial adds have been sent.                                                                   // 1266
                                                                                                                       //
                                                                                                                       //
  multiplexer.addHandleAndSendInitialAdds(observeHandle);                                                              // 1269
  return observeHandle;                                                                                                // 1271
}; // Listen for the invalidation messages that will trigger us to poll the                                            // 1272
// database for changes. If this selector specifies specific IDs, specify them                                         // 1275
// here, so that updates to different specific IDs don't cause us to poll.                                             // 1276
// listenCallback is the same kind of (notification, complete) callback passed                                         // 1277
// to InvalidationCrossbar.listen.                                                                                     // 1278
                                                                                                                       //
                                                                                                                       //
listenAll = function (cursorDescription, listenCallback) {                                                             // 1280
  var listeners = [];                                                                                                  // 1281
  forEachTrigger(cursorDescription, function (trigger) {                                                               // 1282
    listeners.push(DDPServer._InvalidationCrossbar.listen(trigger, listenCallback));                                   // 1283
  });                                                                                                                  // 1285
  return {                                                                                                             // 1287
    stop: function () {                                                                                                // 1288
      _.each(listeners, function (listener) {                                                                          // 1289
        listener.stop();                                                                                               // 1290
      });                                                                                                              // 1291
    }                                                                                                                  // 1292
  };                                                                                                                   // 1287
};                                                                                                                     // 1294
                                                                                                                       //
forEachTrigger = function (cursorDescription, triggerCallback) {                                                       // 1296
  var key = {                                                                                                          // 1297
    collection: cursorDescription.collectionName                                                                       // 1297
  };                                                                                                                   // 1297
                                                                                                                       //
  var specificIds = LocalCollection._idsMatchedBySelector(cursorDescription.selector);                                 // 1298
                                                                                                                       //
  if (specificIds) {                                                                                                   // 1300
    _.each(specificIds, function (id) {                                                                                // 1301
      triggerCallback(_.extend({                                                                                       // 1302
        id: id                                                                                                         // 1302
      }, key));                                                                                                        // 1302
    });                                                                                                                // 1303
                                                                                                                       //
    triggerCallback(_.extend({                                                                                         // 1304
      dropCollection: true,                                                                                            // 1304
      id: null                                                                                                         // 1304
    }, key));                                                                                                          // 1304
  } else {                                                                                                             // 1305
    triggerCallback(key);                                                                                              // 1306
  } // Everyone cares about the database being dropped.                                                                // 1307
                                                                                                                       //
                                                                                                                       //
  triggerCallback({                                                                                                    // 1309
    dropDatabase: true                                                                                                 // 1309
  });                                                                                                                  // 1309
}; // observeChanges for tailable cursors on capped collections.                                                       // 1310
//                                                                                                                     // 1313
// Some differences from normal cursors:                                                                               // 1314
//   - Will never produce anything other than 'added' or 'addedBefore'. If you                                         // 1315
//     do update a document that has already been produced, this will not notice                                       // 1316
//     it.                                                                                                             // 1317
//   - If you disconnect and reconnect from Mongo, it will essentially restart                                         // 1318
//     the query, which will lead to duplicate results. This is pretty bad,                                            // 1319
//     but if you include a field called 'ts' which is inserted as                                                     // 1320
//     new MongoInternals.MongoTimestamp(0, 0) (which is initialized to the                                            // 1321
//     current Mongo-style timestamp), we'll be able to find the place to                                              // 1322
//     restart properly. (This field is specifically understood by Mongo with an                                       // 1323
//     optimization which allows it to find the right place to start without                                           // 1324
//     an index on ts. It's how the oplog works.)                                                                      // 1325
//   - No callbacks are triggered synchronously with the call (there's no                                              // 1326
//     differentiation between "initial data" and "later changes"; everything                                          // 1327
//     that matches the query gets sent asynchronously).                                                               // 1328
//   - De-duplication is not implemented.                                                                              // 1329
//   - Does not yet interact with the write fence. Probably, this should work by                                       // 1330
//     ignoring removes (which don't work on capped collections) and updates                                           // 1331
//     (which don't affect tailable cursors), and just keeping track of the ID                                         // 1332
//     of the inserted object, and closing the write fence once you get to that                                        // 1333
//     ID (or timestamp?).  This doesn't work well if the document doesn't match                                       // 1334
//     the query, though.  On the other hand, the write fence can close                                                // 1335
//     immediately if it does not match the query. So if we trust minimongo                                            // 1336
//     enough to accurately evaluate the query against the write fence, we                                             // 1337
//     should be able to do this...  Of course, minimongo doesn't even support                                         // 1338
//     Mongo Timestamps yet.                                                                                           // 1339
                                                                                                                       //
                                                                                                                       //
MongoConnection.prototype._observeChangesTailable = function (cursorDescription, ordered, callbacks) {                 // 1340
  var self = this; // Tailable cursors only ever call added/addedBefore callbacks, so it's an                          // 1342
  // error if you didn't provide them.                                                                                 // 1345
                                                                                                                       //
  if (ordered && !callbacks.addedBefore || !ordered && !callbacks.added) {                                             // 1346
    throw new Error("Can't observe an " + (ordered ? "ordered" : "unordered") + " tailable cursor without a " + (ordered ? "addedBefore" : "added") + " callback");
  }                                                                                                                    // 1351
                                                                                                                       //
  return self.tail(cursorDescription, function (doc) {                                                                 // 1353
    var id = doc._id;                                                                                                  // 1354
    delete doc._id; // The ts is an implementation detail. Hide it.                                                    // 1355
                                                                                                                       //
    delete doc.ts;                                                                                                     // 1357
                                                                                                                       //
    if (ordered) {                                                                                                     // 1358
      callbacks.addedBefore(id, doc, null);                                                                            // 1359
    } else {                                                                                                           // 1360
      callbacks.added(id, doc);                                                                                        // 1361
    }                                                                                                                  // 1362
  });                                                                                                                  // 1363
}; // XXX We probably need to find a better way to expose this. Right now                                              // 1364
// it's only used by tests, but in fact you need it in normal                                                          // 1367
// operation to interact with capped collections.                                                                      // 1368
                                                                                                                       //
                                                                                                                       //
MongoInternals.MongoTimestamp = MongoDB.Timestamp;                                                                     // 1369
MongoInternals.Connection = MongoConnection;                                                                           // 1371
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oplog_tailing.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/oplog_tailing.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Future = Npm.require('fibers/future');                                                                             // 1
                                                                                                                       //
OPLOG_COLLECTION = 'oplog.rs';                                                                                         // 3
var TOO_FAR_BEHIND = process.env.METEOR_OPLOG_TOO_FAR_BEHIND || 2000;                                                  // 5
                                                                                                                       //
var showTS = function (ts) {                                                                                           // 7
  return "Timestamp(" + ts.getHighBits() + ", " + ts.getLowBits() + ")";                                               // 8
};                                                                                                                     // 9
                                                                                                                       //
idForOp = function (op) {                                                                                              // 11
  if (op.op === 'd') return op.o._id;else if (op.op === 'i') return op.o._id;else if (op.op === 'u') return op.o2._id;else if (op.op === 'c') throw Error("Operator 'c' doesn't supply an object with id: " + EJSON.stringify(op));else throw Error("Unknown op: " + EJSON.stringify(op));
};                                                                                                                     // 23
                                                                                                                       //
OplogHandle = function (oplogUrl, dbName) {                                                                            // 25
  var self = this;                                                                                                     // 26
  self._oplogUrl = oplogUrl;                                                                                           // 27
  self._dbName = dbName;                                                                                               // 28
  self._oplogLastEntryConnection = null;                                                                               // 30
  self._oplogTailConnection = null;                                                                                    // 31
  self._stopped = false;                                                                                               // 32
  self._tailHandle = null;                                                                                             // 33
  self._readyFuture = new Future();                                                                                    // 34
  self._crossbar = new DDPServer._Crossbar({                                                                           // 35
    factPackage: "mongo-livedata",                                                                                     // 36
    factName: "oplog-watchers"                                                                                         // 36
  });                                                                                                                  // 35
  self._baseOplogSelector = {                                                                                          // 38
    ns: new RegExp('^' + Meteor._escapeRegExp(self._dbName) + '\\.'),                                                  // 39
    $or: [{                                                                                                            // 40
      op: {                                                                                                            // 41
        $in: ['i', 'u', 'd']                                                                                           // 41
      }                                                                                                                // 41
    }, // drop collection                                                                                              // 41
    {                                                                                                                  // 43
      op: 'c',                                                                                                         // 43
      'o.drop': {                                                                                                      // 43
        $exists: true                                                                                                  // 43
      }                                                                                                                // 43
    }, {                                                                                                               // 43
      op: 'c',                                                                                                         // 44
      'o.dropDatabase': 1                                                                                              // 44
    }]                                                                                                                 // 44
  }; // Data structures to support waitUntilCaughtUp(). Each oplog entry has a                                         // 38
  // MongoTimestamp object on it (which is not the same as a Date --- it's a                                           // 49
  // combination of time and an incrementing counter; see                                                              // 50
  // http://docs.mongodb.org/manual/reference/bson-types/#timestamps).                                                 // 51
  //                                                                                                                   // 52
  // _catchingUpFutures is an array of {ts: MongoTimestamp, future: Future}                                            // 53
  // objects, sorted by ascending timestamp. _lastProcessedTS is the                                                   // 54
  // MongoTimestamp of the last oplog entry we've processed.                                                           // 55
  //                                                                                                                   // 56
  // Each time we call waitUntilCaughtUp, we take a peek at the final oplog                                            // 57
  // entry in the db.  If we've already processed it (ie, it is not greater than                                       // 58
  // _lastProcessedTS), waitUntilCaughtUp immediately returns. Otherwise,                                              // 59
  // waitUntilCaughtUp makes a new Future and inserts it along with the final                                          // 60
  // timestamp entry that it read, into _catchingUpFutures. waitUntilCaughtUp                                          // 61
  // then waits on that future, which is resolved once _lastProcessedTS is                                             // 62
  // incremented to be past its timestamp by the worker fiber.                                                         // 63
  //                                                                                                                   // 64
  // XXX use a priority queue or something else that's faster than an array                                            // 65
                                                                                                                       //
  self._catchingUpFutures = [];                                                                                        // 66
  self._lastProcessedTS = null;                                                                                        // 67
  self._onSkippedEntriesHook = new Hook({                                                                              // 69
    debugPrintExceptions: "onSkippedEntries callback"                                                                  // 70
  });                                                                                                                  // 69
  self._entryQueue = new Meteor._DoubleEndedQueue();                                                                   // 73
  self._workerActive = false;                                                                                          // 74
                                                                                                                       //
  self._startTailing();                                                                                                // 76
};                                                                                                                     // 77
                                                                                                                       //
_.extend(OplogHandle.prototype, {                                                                                      // 79
  stop: function () {                                                                                                  // 80
    var self = this;                                                                                                   // 81
    if (self._stopped) return;                                                                                         // 82
    self._stopped = true;                                                                                              // 84
    if (self._tailHandle) self._tailHandle.stop(); // XXX should close connections too                                 // 85
  },                                                                                                                   // 88
  onOplogEntry: function (trigger, callback) {                                                                         // 89
    var self = this;                                                                                                   // 90
    if (self._stopped) throw new Error("Called onOplogEntry on stopped handle!"); // Calling onOplogEntry requires us to wait for the tailing to be ready.
                                                                                                                       //
    self._readyFuture.wait();                                                                                          // 95
                                                                                                                       //
    var originalCallback = callback;                                                                                   // 97
    callback = Meteor.bindEnvironment(function (notification) {                                                        // 98
      // XXX can we avoid this clone by making oplog.js careful?                                                       // 99
      originalCallback(EJSON.clone(notification));                                                                     // 100
    }, function (err) {                                                                                                // 101
      Meteor._debug("Error in oplog callback", err.stack);                                                             // 102
    });                                                                                                                // 103
                                                                                                                       //
    var listenHandle = self._crossbar.listen(trigger, callback);                                                       // 104
                                                                                                                       //
    return {                                                                                                           // 105
      stop: function () {                                                                                              // 106
        listenHandle.stop();                                                                                           // 107
      }                                                                                                                // 108
    };                                                                                                                 // 105
  },                                                                                                                   // 110
  // Register a callback to be invoked any time we skip oplog entries (eg,                                             // 111
  // because we are too far behind).                                                                                   // 112
  onSkippedEntries: function (callback) {                                                                              // 113
    var self = this;                                                                                                   // 114
    if (self._stopped) throw new Error("Called onSkippedEntries on stopped handle!");                                  // 115
    return self._onSkippedEntriesHook.register(callback);                                                              // 117
  },                                                                                                                   // 118
  // Calls `callback` once the oplog has been processed up to a point that is                                          // 119
  // roughly "now": specifically, once we've processed all ops that are                                                // 120
  // currently visible.                                                                                                // 121
  // XXX become convinced that this is actually safe even if oplogConnection                                           // 122
  // is some kind of pool                                                                                              // 123
  waitUntilCaughtUp: function () {                                                                                     // 124
    var self = this;                                                                                                   // 125
    if (self._stopped) throw new Error("Called waitUntilCaughtUp on stopped handle!"); // Calling waitUntilCaughtUp requries us to wait for the oplog connection to
    // be ready.                                                                                                       // 130
                                                                                                                       //
    self._readyFuture.wait();                                                                                          // 131
                                                                                                                       //
    var lastEntry;                                                                                                     // 132
                                                                                                                       //
    while (!self._stopped) {                                                                                           // 134
      // We need to make the selector at least as restrictive as the actual                                            // 135
      // tailing selector (ie, we need to specify the DB name) or else we might                                        // 136
      // find a TS that won't show up in the actual tail stream.                                                       // 137
      try {                                                                                                            // 138
        lastEntry = self._oplogLastEntryConnection.findOne(OPLOG_COLLECTION, self._baseOplogSelector, {                // 139
          fields: {                                                                                                    // 141
            ts: 1                                                                                                      // 141
          },                                                                                                           // 141
          sort: {                                                                                                      // 141
            $natural: -1                                                                                               // 141
          }                                                                                                            // 141
        });                                                                                                            // 141
        break;                                                                                                         // 142
      } catch (e) {                                                                                                    // 143
        // During failover (eg) if we get an exception we should log and retry                                         // 144
        // instead of crashing.                                                                                        // 145
        Meteor._debug("Got exception while reading last entry: " + e);                                                 // 146
                                                                                                                       //
        Meteor._sleepForMs(100);                                                                                       // 147
      }                                                                                                                // 148
    }                                                                                                                  // 149
                                                                                                                       //
    if (self._stopped) return;                                                                                         // 151
                                                                                                                       //
    if (!lastEntry) {                                                                                                  // 154
      // Really, nothing in the oplog? Well, we've processed everything.                                               // 155
      return;                                                                                                          // 156
    }                                                                                                                  // 157
                                                                                                                       //
    var ts = lastEntry.ts;                                                                                             // 159
    if (!ts) throw Error("oplog entry without ts: " + EJSON.stringify(lastEntry));                                     // 160
                                                                                                                       //
    if (self._lastProcessedTS && ts.lessThanOrEqual(self._lastProcessedTS)) {                                          // 163
      // We've already caught up to here.                                                                              // 164
      return;                                                                                                          // 165
    } // Insert the future into our list. Almost always, this will be at the end,                                      // 166
    // but it's conceivable that if we fail over from one primary to another,                                          // 170
    // the oplog entries we see will go backwards.                                                                     // 171
                                                                                                                       //
                                                                                                                       //
    var insertAfter = self._catchingUpFutures.length;                                                                  // 172
                                                                                                                       //
    while (insertAfter - 1 > 0 && self._catchingUpFutures[insertAfter - 1].ts.greaterThan(ts)) {                       // 173
      insertAfter--;                                                                                                   // 174
    }                                                                                                                  // 175
                                                                                                                       //
    var f = new Future();                                                                                              // 176
                                                                                                                       //
    self._catchingUpFutures.splice(insertAfter, 0, {                                                                   // 177
      ts: ts,                                                                                                          // 177
      future: f                                                                                                        // 177
    });                                                                                                                // 177
                                                                                                                       //
    f.wait();                                                                                                          // 178
  },                                                                                                                   // 179
  _startTailing: function () {                                                                                         // 180
    var self = this; // First, make sure that we're talking to the local database.                                     // 181
                                                                                                                       //
    var mongodbUri = Npm.require('mongodb-uri');                                                                       // 183
                                                                                                                       //
    if (mongodbUri.parse(self._oplogUrl).database !== 'local') {                                                       // 184
      throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of " + "a Mongo replica set");                 // 185
    } // We make two separate connections to Mongo. The Node Mongo driver                                              // 187
    // implements a naive round-robin connection pool: each "connection" is a                                          // 190
    // pool of several (5 by default) TCP connections, and each request is                                             // 191
    // rotated through the pools. Tailable cursor queries block on the server                                          // 192
    // until there is some data to return (or until a few seconds have                                                 // 193
    // passed). So if the connection pool used for tailing cursors is the same                                         // 194
    // pool used for other queries, the other queries will be delayed by seconds                                       // 195
    // 1/5 of the time.                                                                                                // 196
    //                                                                                                                 // 197
    // The tail connection will only ever be running a single tail command, so                                         // 198
    // it only needs to make one underlying TCP connection.                                                            // 199
                                                                                                                       //
                                                                                                                       //
    self._oplogTailConnection = new MongoConnection(self._oplogUrl, {                                                  // 200
      poolSize: 1                                                                                                      // 201
    }); // XXX better docs, but: it's to get monotonic results                                                         // 201
    // XXX is it safe to say "if there's an in flight query, just use its                                              // 203
    //     results"? I don't think so but should consider that                                                         // 204
                                                                                                                       //
    self._oplogLastEntryConnection = new MongoConnection(self._oplogUrl, {                                             // 205
      poolSize: 1                                                                                                      // 206
    }); // Now, make sure that there actually is a repl set here. If not, oplog                                        // 206
    // tailing won't ever find anything!                                                                               // 209
    // More on the isMasterDoc                                                                                         // 210
    // https://docs.mongodb.com/manual/reference/command/isMaster/                                                     // 211
                                                                                                                       //
    var f = new Future();                                                                                              // 212
                                                                                                                       //
    self._oplogLastEntryConnection.db.admin().command({                                                                // 213
      ismaster: 1                                                                                                      // 214
    }, f.resolver());                                                                                                  // 214
                                                                                                                       //
    var isMasterDoc = f.wait();                                                                                        // 215
                                                                                                                       //
    if (!(isMasterDoc && isMasterDoc.setName)) {                                                                       // 217
      throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of " + "a Mongo replica set");                 // 218
    } // Find the last oplog entry.                                                                                    // 220
                                                                                                                       //
                                                                                                                       //
    var lastOplogEntry = self._oplogLastEntryConnection.findOne(OPLOG_COLLECTION, {}, {                                // 223
      sort: {                                                                                                          // 224
        $natural: -1                                                                                                   // 224
      },                                                                                                               // 224
      fields: {                                                                                                        // 224
        ts: 1                                                                                                          // 224
      }                                                                                                                // 224
    });                                                                                                                // 224
                                                                                                                       //
    var oplogSelector = _.clone(self._baseOplogSelector);                                                              // 226
                                                                                                                       //
    if (lastOplogEntry) {                                                                                              // 227
      // Start after the last entry that currently exists.                                                             // 228
      oplogSelector.ts = {                                                                                             // 229
        $gt: lastOplogEntry.ts                                                                                         // 229
      }; // If there are any calls to callWhenProcessedLatest before any other                                         // 229
      // oplog entries show up, allow callWhenProcessedLatest to call its                                              // 231
      // callback immediately.                                                                                         // 232
                                                                                                                       //
      self._lastProcessedTS = lastOplogEntry.ts;                                                                       // 233
    }                                                                                                                  // 234
                                                                                                                       //
    var cursorDescription = new CursorDescription(OPLOG_COLLECTION, oplogSelector, {                                   // 236
      tailable: true                                                                                                   // 237
    });                                                                                                                // 237
    self._tailHandle = self._oplogTailConnection.tail(cursorDescription, function (doc) {                              // 239
      self._entryQueue.push(doc);                                                                                      // 241
                                                                                                                       //
      self._maybeStartWorker();                                                                                        // 242
    });                                                                                                                // 243
                                                                                                                       //
    self._readyFuture.return();                                                                                        // 245
  },                                                                                                                   // 246
  _maybeStartWorker: function () {                                                                                     // 248
    var self = this;                                                                                                   // 249
    if (self._workerActive) return;                                                                                    // 250
    self._workerActive = true;                                                                                         // 252
    Meteor.defer(function () {                                                                                         // 253
      try {                                                                                                            // 254
        while (!self._stopped && !self._entryQueue.isEmpty()) {                                                        // 255
          // Are we too far behind? Just tell our observers that they need to                                          // 256
          // repoll, and drop our queue.                                                                               // 257
          if (self._entryQueue.length > TOO_FAR_BEHIND) {                                                              // 258
            var lastEntry = self._entryQueue.pop();                                                                    // 259
                                                                                                                       //
            self._entryQueue.clear();                                                                                  // 260
                                                                                                                       //
            self._onSkippedEntriesHook.each(function (callback) {                                                      // 262
              callback();                                                                                              // 263
              return true;                                                                                             // 264
            }); // Free any waitUntilCaughtUp() calls that were waiting for us to                                      // 265
            // pass something that we just skipped.                                                                    // 268
                                                                                                                       //
                                                                                                                       //
            self._setLastProcessedTS(lastEntry.ts);                                                                    // 269
                                                                                                                       //
            continue;                                                                                                  // 270
          }                                                                                                            // 271
                                                                                                                       //
          var doc = self._entryQueue.shift();                                                                          // 273
                                                                                                                       //
          if (!(doc.ns && doc.ns.length > self._dbName.length + 1 && doc.ns.substr(0, self._dbName.length + 1) === self._dbName + '.')) {
            throw new Error("Unexpected ns");                                                                          // 278
          }                                                                                                            // 279
                                                                                                                       //
          var trigger = {                                                                                              // 281
            collection: doc.ns.substr(self._dbName.length + 1),                                                        // 281
            dropCollection: false,                                                                                     // 282
            dropDatabase: false,                                                                                       // 283
            op: doc                                                                                                    // 284
          }; // Is it a special command and the collection name is hidden somewhere                                    // 281
          // in operator?                                                                                              // 287
                                                                                                                       //
          if (trigger.collection === "$cmd") {                                                                         // 288
            if (doc.o.dropDatabase) {                                                                                  // 289
              delete trigger.collection;                                                                               // 290
              trigger.dropDatabase = true;                                                                             // 291
            } else if (_.has(doc.o, 'drop')) {                                                                         // 292
              trigger.collection = doc.o.drop;                                                                         // 293
              trigger.dropCollection = true;                                                                           // 294
              trigger.id = null;                                                                                       // 295
            } else {                                                                                                   // 296
              throw Error("Unknown command " + JSON.stringify(doc));                                                   // 297
            }                                                                                                          // 298
          } else {                                                                                                     // 299
            // All other ops have an id.                                                                               // 300
            trigger.id = idForOp(doc);                                                                                 // 301
          }                                                                                                            // 302
                                                                                                                       //
          self._crossbar.fire(trigger); // Now that we've processed this operation, process pending                    // 304
          // sequencers.                                                                                               // 307
                                                                                                                       //
                                                                                                                       //
          if (!doc.ts) throw Error("oplog entry without ts: " + EJSON.stringify(doc));                                 // 308
                                                                                                                       //
          self._setLastProcessedTS(doc.ts);                                                                            // 310
        }                                                                                                              // 311
      } finally {                                                                                                      // 312
        self._workerActive = false;                                                                                    // 313
      }                                                                                                                // 314
    });                                                                                                                // 315
  },                                                                                                                   // 316
  _setLastProcessedTS: function (ts) {                                                                                 // 317
    var self = this;                                                                                                   // 318
    self._lastProcessedTS = ts;                                                                                        // 319
                                                                                                                       //
    while (!_.isEmpty(self._catchingUpFutures) && self._catchingUpFutures[0].ts.lessThanOrEqual(self._lastProcessedTS)) {
      var sequencer = self._catchingUpFutures.shift();                                                                 // 321
                                                                                                                       //
      sequencer.future.return();                                                                                       // 322
    }                                                                                                                  // 323
  },                                                                                                                   // 324
  //Methods used on tests to dinamically change TOO_FAR_BEHIND                                                         // 326
  _defineTooFarBehind: function (value) {                                                                              // 327
    TOO_FAR_BEHIND = value;                                                                                            // 328
  },                                                                                                                   // 329
  _resetTooFarBehind: function () {                                                                                    // 330
    TOO_FAR_BEHIND = process.env.METEOR_OPLOG_TOO_FAR_BEHIND || 2000;                                                  // 331
  }                                                                                                                    // 332
});                                                                                                                    // 79
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_multiplex.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/observe_multiplex.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Future = Npm.require('fibers/future');                                                                             // 1
                                                                                                                       //
ObserveMultiplexer = function (options) {                                                                              // 3
  var self = this;                                                                                                     // 4
  if (!options || !_.has(options, 'ordered')) throw Error("must specified ordered");                                   // 6
  Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-multiplexers", 1);               // 9
  self._ordered = options.ordered;                                                                                     // 12
                                                                                                                       //
  self._onStop = options.onStop || function () {};                                                                     // 13
                                                                                                                       //
  self._queue = new Meteor._SynchronousQueue();                                                                        // 14
  self._handles = {};                                                                                                  // 15
  self._readyFuture = new Future();                                                                                    // 16
  self._cache = new LocalCollection._CachingChangeObserver({                                                           // 17
    ordered: options.ordered                                                                                           // 18
  }); // Number of addHandleAndSendInitialAdds tasks scheduled but not yet                                             // 17
  // running. removeHandle uses this to know if it's time to call the onStop                                           // 20
  // callback.                                                                                                         // 21
                                                                                                                       //
  self._addHandleTasksScheduledButNotPerformed = 0;                                                                    // 22
                                                                                                                       //
  _.each(self.callbackNames(), function (callbackName) {                                                               // 24
    self[callbackName] = function () /* ... */{                                                                        // 25
      self._applyCallback(callbackName, _.toArray(arguments));                                                         // 26
    };                                                                                                                 // 27
  });                                                                                                                  // 28
};                                                                                                                     // 29
                                                                                                                       //
_.extend(ObserveMultiplexer.prototype, {                                                                               // 31
  addHandleAndSendInitialAdds: function (handle) {                                                                     // 32
    var self = this; // Check this before calling runTask (even though runTask does the same                           // 33
    // check) so that we don't leak an ObserveMultiplexer on error by                                                  // 36
    // incrementing _addHandleTasksScheduledButNotPerformed and never                                                  // 37
    // decrementing it.                                                                                                // 38
                                                                                                                       //
    if (!self._queue.safeToRunTask()) throw new Error("Can't call observeChanges from an observe callback on the same query");
    ++self._addHandleTasksScheduledButNotPerformed;                                                                    // 41
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-handles", 1);                  // 43
                                                                                                                       //
    self._queue.runTask(function () {                                                                                  // 46
      self._handles[handle._id] = handle; // Send out whatever adds we have so far (whether or not we the              // 47
      // multiplexer is ready).                                                                                        // 49
                                                                                                                       //
      self._sendAdds(handle);                                                                                          // 50
                                                                                                                       //
      --self._addHandleTasksScheduledButNotPerformed;                                                                  // 51
    }); // *outside* the task, since otherwise we'd deadlock                                                           // 52
                                                                                                                       //
                                                                                                                       //
    self._readyFuture.wait();                                                                                          // 54
  },                                                                                                                   // 55
  // Remove an observe handle. If it was the last observe handle, call the                                             // 57
  // onStop callback; you cannot add any more observe handles after this.                                              // 58
  //                                                                                                                   // 59
  // This is not synchronized with polls and handle additions: this means that                                         // 60
  // you can safely call it from within an observe callback, but it also means                                         // 61
  // that we have to be careful when we iterate over _handles.                                                         // 62
  removeHandle: function (id) {                                                                                        // 63
    var self = this; // This should not be possible: you can only call removeHandle by having                          // 64
    // access to the ObserveHandle, which isn't returned to user code until the                                        // 67
    // multiplex is ready.                                                                                             // 68
                                                                                                                       //
    if (!self._ready()) throw new Error("Can't remove handles until the multiplex is ready");                          // 69
    delete self._handles[id];                                                                                          // 72
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-handles", -1);                 // 74
                                                                                                                       //
    if (_.isEmpty(self._handles) && self._addHandleTasksScheduledButNotPerformed === 0) {                              // 77
      self._stop();                                                                                                    // 79
    }                                                                                                                  // 80
  },                                                                                                                   // 81
  _stop: function (options) {                                                                                          // 82
    var self = this;                                                                                                   // 83
    options = options || {}; // It shouldn't be possible for us to stop when all our handles still                     // 84
    // haven't been returned from observeChanges!                                                                      // 87
                                                                                                                       //
    if (!self._ready() && !options.fromQueryError) throw Error("surprising _stop: not ready"); // Call stop callback (which kills the underlying process which sends us
    // callbacks and removes us from the connection's dictionary).                                                     // 92
                                                                                                                       //
    self._onStop();                                                                                                    // 93
                                                                                                                       //
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-multiplexers", -1); // Cause future addHandleAndSendInitialAdds calls to throw (but the onStop
    // callback should make our connection forget about us).                                                           // 98
                                                                                                                       //
    self._handles = null;                                                                                              // 99
  },                                                                                                                   // 100
  // Allows all addHandleAndSendInitialAdds calls to return, once all preceding                                        // 102
  // adds have been processed. Does not block.                                                                         // 103
  ready: function () {                                                                                                 // 104
    var self = this;                                                                                                   // 105
                                                                                                                       //
    self._queue.queueTask(function () {                                                                                // 106
      if (self._ready()) throw Error("can't make ObserveMultiplex ready twice!");                                      // 107
                                                                                                                       //
      self._readyFuture.return();                                                                                      // 109
    });                                                                                                                // 110
  },                                                                                                                   // 111
  // If trying to execute the query results in an error, call this. This is                                            // 113
  // intended for permanent errors, not transient network errors that could be                                         // 114
  // fixed. It should only be called before ready(), because if you called ready                                       // 115
  // that meant that you managed to run the query once. It will stop this                                              // 116
  // ObserveMultiplex and cause addHandleAndSendInitialAdds calls (and thus                                            // 117
  // observeChanges calls) to throw the error.                                                                         // 118
  queryError: function (err) {                                                                                         // 119
    var self = this;                                                                                                   // 120
                                                                                                                       //
    self._queue.runTask(function () {                                                                                  // 121
      if (self._ready()) throw Error("can't claim query has an error after it worked!");                               // 122
                                                                                                                       //
      self._stop({                                                                                                     // 124
        fromQueryError: true                                                                                           // 124
      });                                                                                                              // 124
                                                                                                                       //
      self._readyFuture.throw(err);                                                                                    // 125
    });                                                                                                                // 126
  },                                                                                                                   // 127
  // Calls "cb" once the effects of all "ready", "addHandleAndSendInitialAdds"                                         // 129
  // and observe callbacks which came before this call have been propagated to                                         // 130
  // all handles. "ready" must have already been called on this multiplexer.                                           // 131
  onFlush: function (cb) {                                                                                             // 132
    var self = this;                                                                                                   // 133
                                                                                                                       //
    self._queue.queueTask(function () {                                                                                // 134
      if (!self._ready()) throw Error("only call onFlush on a multiplexer that will be ready");                        // 135
      cb();                                                                                                            // 137
    });                                                                                                                // 138
  },                                                                                                                   // 139
  callbackNames: function () {                                                                                         // 140
    var self = this;                                                                                                   // 141
    if (self._ordered) return ["addedBefore", "changed", "movedBefore", "removed"];else return ["added", "changed", "removed"];
  },                                                                                                                   // 146
  _ready: function () {                                                                                                // 147
    return this._readyFuture.isResolved();                                                                             // 148
  },                                                                                                                   // 149
  _applyCallback: function (callbackName, args) {                                                                      // 150
    var self = this;                                                                                                   // 151
                                                                                                                       //
    self._queue.queueTask(function () {                                                                                // 152
      // If we stopped in the meantime, do nothing.                                                                    // 153
      if (!self._handles) return; // First, apply the change to the cache.                                             // 154
      // XXX We could make applyChange callbacks promise not to hang on to any                                         // 158
      // state from their arguments (assuming that their supplied callbacks                                            // 159
      // don't) and skip this clone. Currently 'changed' hangs on to state                                             // 160
      // though.                                                                                                       // 161
                                                                                                                       //
      self._cache.applyChange[callbackName].apply(null, EJSON.clone(args)); // If we haven't finished the initial adds, then we should only be getting
      // adds.                                                                                                         // 165
                                                                                                                       //
                                                                                                                       //
      if (!self._ready() && callbackName !== 'added' && callbackName !== 'addedBefore') {                              // 166
        throw new Error("Got " + callbackName + " during initial adds");                                               // 168
      } // Now multiplex the callbacks out to all observe handles. It's OK if                                          // 169
      // these calls yield; since we're inside a task, no other use of our queue                                       // 172
      // can continue until these are done. (But we do have to be careful to not                                       // 173
      // use a handle that got removed, because removeHandle does not use the                                          // 174
      // queue; thus, we iterate over an array of keys that we control.)                                               // 175
                                                                                                                       //
                                                                                                                       //
      _.each(_.keys(self._handles), function (handleId) {                                                              // 176
        var handle = self._handles && self._handles[handleId];                                                         // 177
        if (!handle) return;                                                                                           // 178
        var callback = handle['_' + callbackName]; // clone arguments so that callbacks can mutate their arguments     // 180
                                                                                                                       //
        callback && callback.apply(null, EJSON.clone(args));                                                           // 182
      });                                                                                                              // 183
    });                                                                                                                // 184
  },                                                                                                                   // 185
  // Sends initial adds to a handle. It should only be called from within a task                                       // 187
  // (the task that is processing the addHandleAndSendInitialAdds call). It                                            // 188
  // synchronously invokes the handle's added or addedBefore; there's no need to                                       // 189
  // flush the queue afterwards to ensure that the callbacks get out.                                                  // 190
  _sendAdds: function (handle) {                                                                                       // 191
    var self = this;                                                                                                   // 192
    if (self._queue.safeToRunTask()) throw Error("_sendAdds may only be called from within a task!");                  // 193
    var add = self._ordered ? handle._addedBefore : handle._added;                                                     // 195
    if (!add) return; // note: docs may be an _IdMap or an OrderedDict                                                 // 196
                                                                                                                       //
    self._cache.docs.forEach(function (doc, id) {                                                                      // 199
      if (!_.has(self._handles, handle._id)) throw Error("handle got removed before sending initial adds!");           // 200
      var fields = EJSON.clone(doc);                                                                                   // 202
      delete fields._id;                                                                                               // 203
      if (self._ordered) add(id, fields, null); // we're going in order, so add at end                                 // 204
      else add(id, fields);                                                                                            // 204
    });                                                                                                                // 208
  }                                                                                                                    // 209
});                                                                                                                    // 31
                                                                                                                       //
var nextObserveHandleId = 1;                                                                                           // 213
                                                                                                                       //
ObserveHandle = function (multiplexer, callbacks) {                                                                    // 214
  var self = this; // The end user is only supposed to call stop().  The other fields are                              // 215
  // accessible to the multiplexer, though.                                                                            // 217
                                                                                                                       //
  self._multiplexer = multiplexer;                                                                                     // 218
                                                                                                                       //
  _.each(multiplexer.callbackNames(), function (name) {                                                                // 219
    if (callbacks[name]) {                                                                                             // 220
      self['_' + name] = callbacks[name];                                                                              // 221
    } else if (name === "addedBefore" && callbacks.added) {                                                            // 222
      // Special case: if you specify "added" and "movedBefore", you get an                                            // 223
      // ordered observe where for some reason you don't get ordering data on                                          // 224
      // the adds.  I dunno, we wrote tests for it, there must have been a                                             // 225
      // reason.                                                                                                       // 226
      self._addedBefore = function (id, fields, before) {                                                              // 227
        callbacks.added(id, fields);                                                                                   // 228
      };                                                                                                               // 229
    }                                                                                                                  // 230
  });                                                                                                                  // 231
                                                                                                                       //
  self._stopped = false;                                                                                               // 232
  self._id = nextObserveHandleId++;                                                                                    // 233
};                                                                                                                     // 234
                                                                                                                       //
ObserveHandle.prototype.stop = function () {                                                                           // 235
  var self = this;                                                                                                     // 236
  if (self._stopped) return;                                                                                           // 237
  self._stopped = true;                                                                                                // 239
                                                                                                                       //
  self._multiplexer.removeHandle(self._id);                                                                            // 240
};                                                                                                                     // 241
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"doc_fetcher.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/doc_fetcher.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Fiber = Npm.require('fibers');                                                                                     // 1
                                                                                                                       //
var Future = Npm.require('fibers/future');                                                                             // 2
                                                                                                                       //
DocFetcher = function (mongoConnection) {                                                                              // 4
  var self = this;                                                                                                     // 5
  self._mongoConnection = mongoConnection; // Map from cache key -> [callback]                                         // 6
                                                                                                                       //
  self._callbacksForCacheKey = {};                                                                                     // 8
};                                                                                                                     // 9
                                                                                                                       //
_.extend(DocFetcher.prototype, {                                                                                       // 11
  // Fetches document "id" from collectionName, returning it or null if not                                            // 12
  // found.                                                                                                            // 13
  //                                                                                                                   // 14
  // If you make multiple calls to fetch() with the same cacheKey (a string),                                          // 15
  // DocFetcher may assume that they all return the same document. (It does                                            // 16
  // not check to see if collectionName/id match.)                                                                     // 17
  //                                                                                                                   // 18
  // You may assume that callback is never called synchronously (and in fact                                           // 19
  // OplogObserveDriver does so).                                                                                      // 20
  fetch: function (collectionName, id, cacheKey, callback) {                                                           // 21
    var self = this;                                                                                                   // 22
    check(collectionName, String); // id is some sort of scalar                                                        // 24
                                                                                                                       //
    check(cacheKey, String); // If there's already an in-progress fetch for this cache key, yield until                // 26
    // it's done and return whatever it returns.                                                                       // 29
                                                                                                                       //
    if (_.has(self._callbacksForCacheKey, cacheKey)) {                                                                 // 30
      self._callbacksForCacheKey[cacheKey].push(callback);                                                             // 31
                                                                                                                       //
      return;                                                                                                          // 32
    }                                                                                                                  // 33
                                                                                                                       //
    var callbacks = self._callbacksForCacheKey[cacheKey] = [callback];                                                 // 35
    Fiber(function () {                                                                                                // 37
      try {                                                                                                            // 38
        var doc = self._mongoConnection.findOne(collectionName, {                                                      // 39
          _id: id                                                                                                      // 40
        }) || null; // Return doc to all relevant callbacks. Note that this array can                                  // 40
        // continue to grow during callback excecution.                                                                // 42
                                                                                                                       //
        while (!_.isEmpty(callbacks)) {                                                                                // 43
          // Clone the document so that the various calls to fetch don't return                                        // 44
          // objects that are intertwingled with each other. Clone before                                              // 45
          // popping the future, so that if clone throws, the error gets passed                                        // 46
          // to the next callback.                                                                                     // 47
          var clonedDoc = EJSON.clone(doc);                                                                            // 48
          callbacks.pop()(null, clonedDoc);                                                                            // 49
        }                                                                                                              // 50
      } catch (e) {                                                                                                    // 51
        while (!_.isEmpty(callbacks)) {                                                                                // 52
          callbacks.pop()(e);                                                                                          // 53
        }                                                                                                              // 54
      } finally {                                                                                                      // 55
        // XXX consider keeping the doc around for a period of time before                                             // 56
        // removing from the cache                                                                                     // 57
        delete self._callbacksForCacheKey[cacheKey];                                                                   // 58
      }                                                                                                                // 59
    }).run();                                                                                                          // 60
  }                                                                                                                    // 61
});                                                                                                                    // 11
                                                                                                                       //
MongoTest.DocFetcher = DocFetcher;                                                                                     // 64
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"polling_observe_driver.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/polling_observe_driver.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
PollingObserveDriver = function (options) {                                                                            // 1
  var self = this;                                                                                                     // 2
  self._cursorDescription = options.cursorDescription;                                                                 // 4
  self._mongoHandle = options.mongoHandle;                                                                             // 5
  self._ordered = options.ordered;                                                                                     // 6
  self._multiplexer = options.multiplexer;                                                                             // 7
  self._stopCallbacks = [];                                                                                            // 8
  self._stopped = false;                                                                                               // 9
  self._synchronousCursor = self._mongoHandle._createSynchronousCursor(self._cursorDescription); // previous results snapshot.  on each poll cycle, diffs against
  // results drives the callbacks.                                                                                     // 15
                                                                                                                       //
  self._results = null; // The number of _pollMongo calls that have been added to self._taskQueue but                  // 16
  // have not started running. Used to make sure we never schedule more than one                                       // 19
  // _pollMongo (other than possibly the one that is currently running). It's                                          // 20
  // also used by _suspendPolling to pretend there's a poll scheduled. Usually,                                        // 21
  // it's either 0 (for "no polls scheduled other than maybe one currently                                             // 22
  // running") or 1 (for "a poll scheduled that isn't running yet"), but it can                                        // 23
  // also be 2 if incremented by _suspendPolling.                                                                      // 24
                                                                                                                       //
  self._pollsScheduledButNotStarted = 0;                                                                               // 25
  self._pendingWrites = []; // people to notify when polling completes                                                 // 26
  // Make sure to create a separately throttled function for each                                                      // 28
  // PollingObserveDriver object.                                                                                      // 29
                                                                                                                       //
  self._ensurePollIsScheduled = _.throttle(self._unthrottledEnsurePollIsScheduled, self._cursorDescription.options.pollingThrottleMs || 50 /* ms */); // XXX figure out if we still need a queue
                                                                                                                       //
  self._taskQueue = new Meteor._SynchronousQueue();                                                                    // 35
  var listenersHandle = listenAll(self._cursorDescription, function (notification) {                                   // 37
    // When someone does a transaction that might affect us, schedule a poll                                           // 39
    // of the database. If that transaction happens inside of a write fence,                                           // 40
    // block the fence until we've polled and notified observers.                                                      // 41
    var fence = DDPServer._CurrentWriteFence.get();                                                                    // 42
                                                                                                                       //
    if (fence) self._pendingWrites.push(fence.beginWrite()); // Ensure a poll is scheduled... but if we already know that one is,
    // don't hit the throttled _ensurePollIsScheduled function (which might                                            // 46
    // lead to us calling it unnecessarily in <pollingThrottleMs> ms).                                                 // 47
                                                                                                                       //
    if (self._pollsScheduledButNotStarted === 0) self._ensurePollIsScheduled();                                        // 48
  });                                                                                                                  // 50
                                                                                                                       //
  self._stopCallbacks.push(function () {                                                                               // 52
    listenersHandle.stop();                                                                                            // 52
  }); // every once and a while, poll even if we don't think we're dirty, for                                          // 52
  // eventual consistency with database writes from outside the Meteor                                                 // 55
  // universe.                                                                                                         // 56
  //                                                                                                                   // 57
  // For testing, there's an undocumented callback argument to observeChanges                                          // 58
  // which disables time-based polling and gets called at the beginning of each                                        // 59
  // poll.                                                                                                             // 60
                                                                                                                       //
                                                                                                                       //
  if (options._testOnlyPollCallback) {                                                                                 // 61
    self._testOnlyPollCallback = options._testOnlyPollCallback;                                                        // 62
  } else {                                                                                                             // 63
    var pollingInterval = self._cursorDescription.options.pollingIntervalMs || self._cursorDescription.options._pollingInterval || // COMPAT with 1.2
    10 * 1000;                                                                                                         // 67
    var intervalHandle = Meteor.setInterval(_.bind(self._ensurePollIsScheduled, self), pollingInterval);               // 68
                                                                                                                       //
    self._stopCallbacks.push(function () {                                                                             // 70
      Meteor.clearInterval(intervalHandle);                                                                            // 71
    });                                                                                                                // 72
  } // Make sure we actually poll soon!                                                                                // 73
                                                                                                                       //
                                                                                                                       //
  self._unthrottledEnsurePollIsScheduled();                                                                            // 76
                                                                                                                       //
  Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-polling", 1);            // 78
};                                                                                                                     // 80
                                                                                                                       //
_.extend(PollingObserveDriver.prototype, {                                                                             // 82
  // This is always called through _.throttle (except once at startup).                                                // 83
  _unthrottledEnsurePollIsScheduled: function () {                                                                     // 84
    var self = this;                                                                                                   // 85
    if (self._pollsScheduledButNotStarted > 0) return;                                                                 // 86
    ++self._pollsScheduledButNotStarted;                                                                               // 88
                                                                                                                       //
    self._taskQueue.queueTask(function () {                                                                            // 89
      self._pollMongo();                                                                                               // 90
    });                                                                                                                // 91
  },                                                                                                                   // 92
  // test-only interface for controlling polling.                                                                      // 94
  //                                                                                                                   // 95
  // _suspendPolling blocks until any currently running and scheduled polls are                                        // 96
  // done, and prevents any further polls from being scheduled. (new                                                   // 97
  // ObserveHandles can be added and receive their initial added callbacks,                                            // 98
  // though.)                                                                                                          // 99
  //                                                                                                                   // 100
  // _resumePolling immediately polls, and allows further polls to occur.                                              // 101
  _suspendPolling: function () {                                                                                       // 102
    var self = this; // Pretend that there's another poll scheduled (which will prevent                                // 103
    // _ensurePollIsScheduled from queueing any more polls).                                                           // 105
                                                                                                                       //
    ++self._pollsScheduledButNotStarted; // Now block until all currently running or scheduled polls are done.         // 106
                                                                                                                       //
    self._taskQueue.runTask(function () {}); // Confirm that there is only one "poll" (the fake one we're pretending to
    // have) scheduled.                                                                                                // 111
                                                                                                                       //
                                                                                                                       //
    if (self._pollsScheduledButNotStarted !== 1) throw new Error("_pollsScheduledButNotStarted is " + self._pollsScheduledButNotStarted);
  },                                                                                                                   // 115
  _resumePolling: function () {                                                                                        // 116
    var self = this; // We should be in the same state as in the end of _suspendPolling.                               // 117
                                                                                                                       //
    if (self._pollsScheduledButNotStarted !== 1) throw new Error("_pollsScheduledButNotStarted is " + self._pollsScheduledButNotStarted); // Run a poll synchronously (which will counteract the
    // ++_pollsScheduledButNotStarted from _suspendPolling).                                                           // 123
                                                                                                                       //
    self._taskQueue.runTask(function () {                                                                              // 124
      self._pollMongo();                                                                                               // 125
    });                                                                                                                // 126
  },                                                                                                                   // 127
  _pollMongo: function () {                                                                                            // 129
    var self = this;                                                                                                   // 130
    --self._pollsScheduledButNotStarted;                                                                               // 131
    if (self._stopped) return;                                                                                         // 133
    var first = false;                                                                                                 // 136
    var newResults;                                                                                                    // 137
    var oldResults = self._results;                                                                                    // 138
                                                                                                                       //
    if (!oldResults) {                                                                                                 // 139
      first = true; // XXX maybe use OrderedDict instead?                                                              // 140
                                                                                                                       //
      oldResults = self._ordered ? [] : new LocalCollection._IdMap();                                                  // 142
    }                                                                                                                  // 143
                                                                                                                       //
    self._testOnlyPollCallback && self._testOnlyPollCallback(); // Save the list of pending writes which this round will commit.
                                                                                                                       //
    var writesForCycle = self._pendingWrites;                                                                          // 148
    self._pendingWrites = []; // Get the new query results. (This yields.)                                             // 149
                                                                                                                       //
    try {                                                                                                              // 152
      newResults = self._synchronousCursor.getRawObjects(self._ordered);                                               // 153
    } catch (e) {                                                                                                      // 154
      if (first && typeof e.code === 'number') {                                                                       // 155
        // This is an error document sent to us by mongod, not a connection                                            // 156
        // error generated by the client. And we've never seen this query work                                         // 157
        // successfully. Probably it's a bad selector or something, so we should                                       // 158
        // NOT retry. Instead, we should halt the observe (which ends up calling                                       // 159
        // `stop` on us).                                                                                              // 160
        self._multiplexer.queryError(new Error("Exception while polling query " + JSON.stringify(self._cursorDescription) + ": " + e.message));
                                                                                                                       //
        return;                                                                                                        // 165
      } // getRawObjects can throw if we're having trouble talking to the                                              // 166
      // database.  That's fine --- we will repoll later anyway. But we should                                         // 169
      // make sure not to lose track of this cycle's writes.                                                           // 170
      // (It also can throw if there's just something invalid about this query;                                        // 171
      // unfortunately the ObserveDriver API doesn't provide a good way to                                             // 172
      // "cancel" the observe from the inside in this case.                                                            // 173
                                                                                                                       //
                                                                                                                       //
      Array.prototype.push.apply(self._pendingWrites, writesForCycle);                                                 // 174
                                                                                                                       //
      Meteor._debug("Exception while polling query " + JSON.stringify(self._cursorDescription) + ": " + e.stack);      // 175
                                                                                                                       //
      return;                                                                                                          // 177
    } // Run diffs.                                                                                                    // 178
                                                                                                                       //
                                                                                                                       //
    if (!self._stopped) {                                                                                              // 181
      LocalCollection._diffQueryChanges(self._ordered, oldResults, newResults, self._multiplexer);                     // 182
    } // Signals the multiplexer to allow all observeChanges calls that share this                                     // 184
    // multiplexer to return. (This happens asynchronously, via the                                                    // 187
    // multiplexer's queue.)                                                                                           // 188
                                                                                                                       //
                                                                                                                       //
    if (first) self._multiplexer.ready(); // Replace self._results atomically.  (This assignment is what makes `first`
    // stay through on the next cycle, so we've waited until after we've                                               // 193
    // committed to ready-ing the multiplexer.)                                                                        // 194
                                                                                                                       //
    self._results = newResults; // Once the ObserveMultiplexer has processed everything we've done in this             // 195
    // round, mark all the writes which existed before this call as                                                    // 198
    // commmitted. (If new writes have shown up in the meantime, there'll                                              // 199
    // already be another _pollMongo task scheduled.)                                                                  // 200
                                                                                                                       //
    self._multiplexer.onFlush(function () {                                                                            // 201
      _.each(writesForCycle, function (w) {                                                                            // 202
        w.committed();                                                                                                 // 203
      });                                                                                                              // 204
    });                                                                                                                // 205
  },                                                                                                                   // 206
  stop: function () {                                                                                                  // 208
    var self = this;                                                                                                   // 209
    self._stopped = true;                                                                                              // 210
                                                                                                                       //
    _.each(self._stopCallbacks, function (c) {                                                                         // 211
      c();                                                                                                             // 211
    }); // Release any write fences that are waiting on us.                                                            // 211
                                                                                                                       //
                                                                                                                       //
    _.each(self._pendingWrites, function (w) {                                                                         // 213
      w.committed();                                                                                                   // 214
    });                                                                                                                // 215
                                                                                                                       //
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-polling", -1);         // 216
  }                                                                                                                    // 218
});                                                                                                                    // 82
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oplog_observe_driver.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/oplog_observe_driver.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Future = Npm.require('fibers/future');                                                                             // 1
                                                                                                                       //
var PHASE = {                                                                                                          // 3
  QUERYING: "QUERYING",                                                                                                // 4
  FETCHING: "FETCHING",                                                                                                // 5
  STEADY: "STEADY"                                                                                                     // 6
}; // Exception thrown by _needToPollQuery which unrolls the stack up to the                                           // 3
// enclosing call to finishIfNeedToPollQuery.                                                                          // 10
                                                                                                                       //
var SwitchedToQuery = function () {};                                                                                  // 11
                                                                                                                       //
var finishIfNeedToPollQuery = function (f) {                                                                           // 12
  return function () {                                                                                                 // 13
    try {                                                                                                              // 14
      f.apply(this, arguments);                                                                                        // 15
    } catch (e) {                                                                                                      // 16
      if (!(e instanceof SwitchedToQuery)) throw e;                                                                    // 17
    }                                                                                                                  // 19
  };                                                                                                                   // 20
};                                                                                                                     // 21
                                                                                                                       //
var currentId = 0; // OplogObserveDriver is an alternative to PollingObserveDriver which follows                       // 23
// the Mongo operation log instead of just re-polling the query. It obeys the                                          // 26
// same simple interface: constructing it starts sending observeChanges                                                // 27
// callbacks (and a ready() invocation) to the ObserveMultiplexer, and you stop                                        // 28
// it by calling the stop() method.                                                                                    // 29
                                                                                                                       //
OplogObserveDriver = function (options) {                                                                              // 30
  var self = this;                                                                                                     // 31
  self._usesOplog = true; // tests look at this                                                                        // 32
                                                                                                                       //
  self._id = currentId;                                                                                                // 34
  currentId++;                                                                                                         // 35
  self._cursorDescription = options.cursorDescription;                                                                 // 37
  self._mongoHandle = options.mongoHandle;                                                                             // 38
  self._multiplexer = options.multiplexer;                                                                             // 39
                                                                                                                       //
  if (options.ordered) {                                                                                               // 41
    throw Error("OplogObserveDriver only supports unordered observeChanges");                                          // 42
  }                                                                                                                    // 43
                                                                                                                       //
  var sorter = options.sorter; // We don't support $near and other geo-queries so it's OK to initialize the            // 45
  // comparator only once in the constructor.                                                                          // 47
                                                                                                                       //
  var comparator = sorter && sorter.getComparator();                                                                   // 48
                                                                                                                       //
  if (options.cursorDescription.options.limit) {                                                                       // 50
    // There are several properties ordered driver implements:                                                         // 51
    // - _limit is a positive number                                                                                   // 52
    // - _comparator is a function-comparator by which the query is ordered                                            // 53
    // - _unpublishedBuffer is non-null Min/Max Heap,                                                                  // 54
    //                      the empty buffer in STEADY phase implies that the                                          // 55
    //                      everything that matches the queries selector fits                                          // 56
    //                      into published set.                                                                        // 57
    // - _published - Min Heap (also implements IdMap methods)                                                         // 58
    var heapOptions = {                                                                                                // 60
      IdMap: LocalCollection._IdMap                                                                                    // 60
    };                                                                                                                 // 60
    self._limit = self._cursorDescription.options.limit;                                                               // 61
    self._comparator = comparator;                                                                                     // 62
    self._sorter = sorter;                                                                                             // 63
    self._unpublishedBuffer = new MinMaxHeap(comparator, heapOptions); // We need something that can find Max value in addition to IdMap interface
                                                                                                                       //
    self._published = new MaxHeap(comparator, heapOptions);                                                            // 66
  } else {                                                                                                             // 67
    self._limit = 0;                                                                                                   // 68
    self._comparator = null;                                                                                           // 69
    self._sorter = null;                                                                                               // 70
    self._unpublishedBuffer = null;                                                                                    // 71
    self._published = new LocalCollection._IdMap();                                                                    // 72
  } // Indicates if it is safe to insert a new document at the end of the buffer                                       // 73
  // for this query. i.e. it is known that there are no documents matching the                                         // 76
  // selector those are not in published or buffer.                                                                    // 77
                                                                                                                       //
                                                                                                                       //
  self._safeAppendToBuffer = false;                                                                                    // 78
  self._stopped = false;                                                                                               // 80
  self._stopHandles = [];                                                                                              // 81
  Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-oplog", 1);              // 83
                                                                                                                       //
  self._registerPhaseChange(PHASE.QUERYING);                                                                           // 86
                                                                                                                       //
  self._matcher = options.matcher;                                                                                     // 88
  var projection = self._cursorDescription.options.fields || {};                                                       // 89
  self._projectionFn = LocalCollection._compileProjection(projection); // Projection function, result of combining important fields for selector and
  // existing fields projection                                                                                        // 92
                                                                                                                       //
  self._sharedProjection = self._matcher.combineIntoProjection(projection);                                            // 93
  if (sorter) self._sharedProjection = sorter.combineIntoProjection(self._sharedProjection);                           // 94
  self._sharedProjectionFn = LocalCollection._compileProjection(self._sharedProjection);                               // 96
  self._needToFetch = new LocalCollection._IdMap();                                                                    // 99
  self._currentlyFetching = null;                                                                                      // 100
  self._fetchGeneration = 0;                                                                                           // 101
  self._requeryWhenDoneThisQuery = false;                                                                              // 103
  self._writesToCommitWhenWeReachSteady = []; // If the oplog handle tells us that it skipped some entries (because it got
  // behind, say), re-poll.                                                                                            // 107
                                                                                                                       //
  self._stopHandles.push(self._mongoHandle._oplogHandle.onSkippedEntries(finishIfNeedToPollQuery(function () {         // 108
    self._needToPollQuery();                                                                                           // 110
  })));                                                                                                                // 111
                                                                                                                       //
  forEachTrigger(self._cursorDescription, function (trigger) {                                                         // 114
    self._stopHandles.push(self._mongoHandle._oplogHandle.onOplogEntry(trigger, function (notification) {              // 115
      Meteor._noYieldsAllowed(finishIfNeedToPollQuery(function () {                                                    // 117
        var op = notification.op;                                                                                      // 118
                                                                                                                       //
        if (notification.dropCollection || notification.dropDatabase) {                                                // 119
          // Note: this call is not allowed to block on anything (especially                                           // 120
          // on waiting for oplog entries to catch up) because that will block                                         // 121
          // onOplogEntry!                                                                                             // 122
          self._needToPollQuery();                                                                                     // 123
        } else {                                                                                                       // 124
          // All other operators should be handled depending on phase                                                  // 125
          if (self._phase === PHASE.QUERYING) {                                                                        // 126
            self._handleOplogEntryQuerying(op);                                                                        // 127
          } else {                                                                                                     // 128
            self._handleOplogEntrySteadyOrFetching(op);                                                                // 129
          }                                                                                                            // 130
        }                                                                                                              // 131
      }));                                                                                                             // 132
    }));                                                                                                               // 133
  }); // XXX ordering w.r.t. everything else?                                                                          // 135
                                                                                                                       //
  self._stopHandles.push(listenAll(self._cursorDescription, function (notification) {                                  // 138
    // If we're not in a pre-fire write fence, we don't have to do anything.                                           // 140
    var fence = DDPServer._CurrentWriteFence.get();                                                                    // 141
                                                                                                                       //
    if (!fence || fence.fired) return;                                                                                 // 142
                                                                                                                       //
    if (fence._oplogObserveDrivers) {                                                                                  // 145
      fence._oplogObserveDrivers[self._id] = self;                                                                     // 146
      return;                                                                                                          // 147
    }                                                                                                                  // 148
                                                                                                                       //
    fence._oplogObserveDrivers = {};                                                                                   // 150
    fence._oplogObserveDrivers[self._id] = self;                                                                       // 151
    fence.onBeforeFire(function () {                                                                                   // 153
      var drivers = fence._oplogObserveDrivers;                                                                        // 154
      delete fence._oplogObserveDrivers; // This fence cannot fire until we've caught up to "this point" in the        // 155
      // oplog, and all observers made it back to the steady state.                                                    // 158
                                                                                                                       //
      self._mongoHandle._oplogHandle.waitUntilCaughtUp();                                                              // 159
                                                                                                                       //
      _.each(drivers, function (driver) {                                                                              // 161
        if (driver._stopped) return;                                                                                   // 162
        var write = fence.beginWrite();                                                                                // 165
                                                                                                                       //
        if (driver._phase === PHASE.STEADY) {                                                                          // 166
          // Make sure that all of the callbacks have made it through the                                              // 167
          // multiplexer and been delivered to ObserveHandles before committing                                        // 168
          // writes.                                                                                                   // 169
          driver._multiplexer.onFlush(function () {                                                                    // 170
            write.committed();                                                                                         // 171
          });                                                                                                          // 172
        } else {                                                                                                       // 173
          driver._writesToCommitWhenWeReachSteady.push(write);                                                         // 174
        }                                                                                                              // 175
      });                                                                                                              // 176
    });                                                                                                                // 177
  })); // When Mongo fails over, we need to repoll the query, in case we processed an                                  // 178
  // oplog entry that got rolled back.                                                                                 // 182
                                                                                                                       //
                                                                                                                       //
  self._stopHandles.push(self._mongoHandle._onFailover(finishIfNeedToPollQuery(function () {                           // 183
    self._needToPollQuery();                                                                                           // 185
  }))); // Give _observeChanges a chance to add the new ObserveHandle to our                                           // 186
  // multiplexer, so that the added calls get streamed.                                                                // 189
                                                                                                                       //
                                                                                                                       //
  Meteor.defer(finishIfNeedToPollQuery(function () {                                                                   // 190
    self._runInitialQuery();                                                                                           // 191
  }));                                                                                                                 // 192
};                                                                                                                     // 193
                                                                                                                       //
_.extend(OplogObserveDriver.prototype, {                                                                               // 195
  _addPublished: function (id, doc) {                                                                                  // 196
    var self = this;                                                                                                   // 197
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 198
      var fields = _.clone(doc);                                                                                       // 199
                                                                                                                       //
      delete fields._id;                                                                                               // 200
                                                                                                                       //
      self._published.set(id, self._sharedProjectionFn(doc));                                                          // 201
                                                                                                                       //
      self._multiplexer.added(id, self._projectionFn(fields)); // After adding this document, the published set might be overflowed
      // (exceeding capacity specified by limit). If so, push the maximum                                              // 205
      // element to the buffer, we might want to save it in memory to reduce the                                       // 206
      // amount of Mongo lookups in the future.                                                                        // 207
                                                                                                                       //
                                                                                                                       //
      if (self._limit && self._published.size() > self._limit) {                                                       // 208
        // XXX in theory the size of published is no more than limit+1                                                 // 209
        if (self._published.size() !== self._limit + 1) {                                                              // 210
          throw new Error("After adding to published, " + (self._published.size() - self._limit) + " documents are overflowing the set");
        }                                                                                                              // 214
                                                                                                                       //
        var overflowingDocId = self._published.maxElementId();                                                         // 216
                                                                                                                       //
        var overflowingDoc = self._published.get(overflowingDocId);                                                    // 217
                                                                                                                       //
        if (EJSON.equals(overflowingDocId, id)) {                                                                      // 219
          throw new Error("The document just added is overflowing the published set");                                 // 220
        }                                                                                                              // 221
                                                                                                                       //
        self._published.remove(overflowingDocId);                                                                      // 223
                                                                                                                       //
        self._multiplexer.removed(overflowingDocId);                                                                   // 224
                                                                                                                       //
        self._addBuffered(overflowingDocId, overflowingDoc);                                                           // 225
      }                                                                                                                // 226
    });                                                                                                                // 227
  },                                                                                                                   // 228
  _removePublished: function (id) {                                                                                    // 229
    var self = this;                                                                                                   // 230
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 231
      self._published.remove(id);                                                                                      // 232
                                                                                                                       //
      self._multiplexer.removed(id);                                                                                   // 233
                                                                                                                       //
      if (!self._limit || self._published.size() === self._limit) return;                                              // 234
      if (self._published.size() > self._limit) throw Error("self._published got too big"); // OK, we are publishing less than the limit. Maybe we should look in the
      // buffer to find the next element past what we were publishing before.                                          // 241
                                                                                                                       //
      if (!self._unpublishedBuffer.empty()) {                                                                          // 243
        // There's something in the buffer; move the first thing in it to                                              // 244
        // _published.                                                                                                 // 245
        var newDocId = self._unpublishedBuffer.minElementId();                                                         // 246
                                                                                                                       //
        var newDoc = self._unpublishedBuffer.get(newDocId);                                                            // 247
                                                                                                                       //
        self._removeBuffered(newDocId);                                                                                // 248
                                                                                                                       //
        self._addPublished(newDocId, newDoc);                                                                          // 249
                                                                                                                       //
        return;                                                                                                        // 250
      } // There's nothing in the buffer.  This could mean one of a few things.                                        // 251
      // (a) We could be in the middle of re-running the query (specifically, we                                       // 255
      // could be in _publishNewResults). In that case, _unpublishedBuffer is                                          // 256
      // empty because we clear it at the beginning of _publishNewResults. In                                          // 257
      // this case, our caller already knows the entire answer to the query and                                        // 258
      // we don't need to do anything fancy here.  Just return.                                                        // 259
                                                                                                                       //
                                                                                                                       //
      if (self._phase === PHASE.QUERYING) return; // (b) We're pretty confident that the union of _published and       // 260
      // _unpublishedBuffer contain all documents that match selector. Because                                         // 264
      // _unpublishedBuffer is empty, that means we're confident that _published                                       // 265
      // contains all documents that match selector. So we have nothing to do.                                         // 266
                                                                                                                       //
      if (self._safeAppendToBuffer) return; // (c) Maybe there are other documents out there that should be in our     // 267
      // buffer. But in that case, when we emptied _unpublishedBuffer in                                               // 271
      // _removeBuffered, we should have called _needToPollQuery, which will                                           // 272
      // either put something in _unpublishedBuffer or set _safeAppendToBuffer                                         // 273
      // (or both), and it will put us in QUERYING for that whole time. So in                                          // 274
      // fact, we shouldn't be able to get here.                                                                       // 275
                                                                                                                       //
      throw new Error("Buffer inexplicably empty");                                                                    // 277
    });                                                                                                                // 278
  },                                                                                                                   // 279
  _changePublished: function (id, oldDoc, newDoc) {                                                                    // 280
    var self = this;                                                                                                   // 281
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 282
      self._published.set(id, self._sharedProjectionFn(newDoc));                                                       // 283
                                                                                                                       //
      var projectedNew = self._projectionFn(newDoc);                                                                   // 284
                                                                                                                       //
      var projectedOld = self._projectionFn(oldDoc);                                                                   // 285
                                                                                                                       //
      var changed = DiffSequence.makeChangedFields(projectedNew, projectedOld);                                        // 286
      if (!_.isEmpty(changed)) self._multiplexer.changed(id, changed);                                                 // 288
    });                                                                                                                // 290
  },                                                                                                                   // 291
  _addBuffered: function (id, doc) {                                                                                   // 292
    var self = this;                                                                                                   // 293
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 294
      self._unpublishedBuffer.set(id, self._sharedProjectionFn(doc)); // If something is overflowing the buffer, we just remove it from cache
                                                                                                                       //
                                                                                                                       //
      if (self._unpublishedBuffer.size() > self._limit) {                                                              // 298
        var maxBufferedId = self._unpublishedBuffer.maxElementId();                                                    // 299
                                                                                                                       //
        self._unpublishedBuffer.remove(maxBufferedId); // Since something matching is removed from cache (both published set and
        // buffer), set flag to false                                                                                  // 304
                                                                                                                       //
                                                                                                                       //
        self._safeAppendToBuffer = false;                                                                              // 305
      }                                                                                                                // 306
    });                                                                                                                // 307
  },                                                                                                                   // 308
  // Is called either to remove the doc completely from matching set or to move                                        // 309
  // it to the published set later.                                                                                    // 310
  _removeBuffered: function (id) {                                                                                     // 311
    var self = this;                                                                                                   // 312
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 313
      self._unpublishedBuffer.remove(id); // To keep the contract "buffer is never empty in STEADY phase unless the    // 314
      // everything matching fits into published" true, we poll everything as                                          // 316
      // soon as we see the buffer becoming empty.                                                                     // 317
                                                                                                                       //
                                                                                                                       //
      if (!self._unpublishedBuffer.size() && !self._safeAppendToBuffer) self._needToPollQuery();                       // 318
    });                                                                                                                // 320
  },                                                                                                                   // 321
  // Called when a document has joined the "Matching" results set.                                                     // 322
  // Takes responsibility of keeping _unpublishedBuffer in sync with _published                                        // 323
  // and the effect of limit enforced.                                                                                 // 324
  _addMatching: function (doc) {                                                                                       // 325
    var self = this;                                                                                                   // 326
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 327
      var id = doc._id;                                                                                                // 328
      if (self._published.has(id)) throw Error("tried to add something already published " + id);                      // 329
      if (self._limit && self._unpublishedBuffer.has(id)) throw Error("tried to add something already existed in buffer " + id);
      var limit = self._limit;                                                                                         // 334
      var comparator = self._comparator;                                                                               // 335
      var maxPublished = limit && self._published.size() > 0 ? self._published.get(self._published.maxElementId()) : null;
      var maxBuffered = limit && self._unpublishedBuffer.size() > 0 ? self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId()) : null; // The query is unlimited or didn't publish enough documents yet or the
      // new document would fit into published set pushing the maximum element                                         // 342
      // out, then we need to publish the doc.                                                                         // 343
                                                                                                                       //
      var toPublish = !limit || self._published.size() < limit || comparator(doc, maxPublished) < 0; // Otherwise we might need to buffer it (only in case of limited query).
      // Buffering is allowed if the buffer is not filled up yet and all                                               // 348
      // matching docs are either in the published set or in the buffer.                                               // 349
                                                                                                                       //
      var canAppendToBuffer = !toPublish && self._safeAppendToBuffer && self._unpublishedBuffer.size() < limit; // Or if it is small enough to be safely inserted to the middle or the
      // beginning of the buffer.                                                                                      // 354
                                                                                                                       //
      var canInsertIntoBuffer = !toPublish && maxBuffered && comparator(doc, maxBuffered) <= 0;                        // 355
      var toBuffer = canAppendToBuffer || canInsertIntoBuffer;                                                         // 358
                                                                                                                       //
      if (toPublish) {                                                                                                 // 360
        self._addPublished(id, doc);                                                                                   // 361
      } else if (toBuffer) {                                                                                           // 362
        self._addBuffered(id, doc);                                                                                    // 363
      } else {                                                                                                         // 364
        // dropping it and not saving to the cache                                                                     // 365
        self._safeAppendToBuffer = false;                                                                              // 366
      }                                                                                                                // 367
    });                                                                                                                // 368
  },                                                                                                                   // 369
  // Called when a document leaves the "Matching" results set.                                                         // 370
  // Takes responsibility of keeping _unpublishedBuffer in sync with _published                                        // 371
  // and the effect of limit enforced.                                                                                 // 372
  _removeMatching: function (id) {                                                                                     // 373
    var self = this;                                                                                                   // 374
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 375
      if (!self._published.has(id) && !self._limit) throw Error("tried to remove something matching but not cached " + id);
                                                                                                                       //
      if (self._published.has(id)) {                                                                                   // 379
        self._removePublished(id);                                                                                     // 380
      } else if (self._unpublishedBuffer.has(id)) {                                                                    // 381
        self._removeBuffered(id);                                                                                      // 382
      }                                                                                                                // 383
    });                                                                                                                // 384
  },                                                                                                                   // 385
  _handleDoc: function (id, newDoc) {                                                                                  // 386
    var self = this;                                                                                                   // 387
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 388
      var matchesNow = newDoc && self._matcher.documentMatches(newDoc).result;                                         // 389
                                                                                                                       //
      var publishedBefore = self._published.has(id);                                                                   // 391
                                                                                                                       //
      var bufferedBefore = self._limit && self._unpublishedBuffer.has(id);                                             // 392
                                                                                                                       //
      var cachedBefore = publishedBefore || bufferedBefore;                                                            // 393
                                                                                                                       //
      if (matchesNow && !cachedBefore) {                                                                               // 395
        self._addMatching(newDoc);                                                                                     // 396
      } else if (cachedBefore && !matchesNow) {                                                                        // 397
        self._removeMatching(id);                                                                                      // 398
      } else if (cachedBefore && matchesNow) {                                                                         // 399
        var oldDoc = self._published.get(id);                                                                          // 400
                                                                                                                       //
        var comparator = self._comparator;                                                                             // 401
                                                                                                                       //
        var minBuffered = self._limit && self._unpublishedBuffer.size() && self._unpublishedBuffer.get(self._unpublishedBuffer.minElementId());
                                                                                                                       //
        var maxBuffered;                                                                                               // 404
                                                                                                                       //
        if (publishedBefore) {                                                                                         // 406
          // Unlimited case where the document stays in published once it                                              // 407
          // matches or the case when we don't have enough matching docs to                                            // 408
          // publish or the changed but matching doc will stay in published                                            // 409
          // anyways.                                                                                                  // 410
          //                                                                                                           // 411
          // XXX: We rely on the emptiness of buffer. Be sure to maintain the                                          // 412
          // fact that buffer can't be empty if there are matching documents not                                       // 413
          // published. Notably, we don't want to schedule repoll and continue                                         // 414
          // relying on this property.                                                                                 // 415
          var staysInPublished = !self._limit || self._unpublishedBuffer.size() === 0 || comparator(newDoc, minBuffered) <= 0;
                                                                                                                       //
          if (staysInPublished) {                                                                                      // 420
            self._changePublished(id, oldDoc, newDoc);                                                                 // 421
          } else {                                                                                                     // 422
            // after the change doc doesn't stay in the published, remove it                                           // 423
            self._removePublished(id); // but it can move into buffered now, check it                                  // 424
                                                                                                                       //
                                                                                                                       //
            maxBuffered = self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId());                         // 426
            var toBuffer = self._safeAppendToBuffer || maxBuffered && comparator(newDoc, maxBuffered) <= 0;            // 429
                                                                                                                       //
            if (toBuffer) {                                                                                            // 432
              self._addBuffered(id, newDoc);                                                                           // 433
            } else {                                                                                                   // 434
              // Throw away from both published set and buffer                                                         // 435
              self._safeAppendToBuffer = false;                                                                        // 436
            }                                                                                                          // 437
          }                                                                                                            // 438
        } else if (bufferedBefore) {                                                                                   // 439
          oldDoc = self._unpublishedBuffer.get(id); // remove the old version manually instead of using _removeBuffered so
          // we don't trigger the querying immediately.  if we end this block                                          // 442
          // with the buffer empty, we will need to trigger the query poll                                             // 443
          // manually too.                                                                                             // 444
                                                                                                                       //
          self._unpublishedBuffer.remove(id);                                                                          // 445
                                                                                                                       //
          var maxPublished = self._published.get(self._published.maxElementId());                                      // 447
                                                                                                                       //
          maxBuffered = self._unpublishedBuffer.size() && self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId()); // the buffered doc was updated, it could move to published
                                                                                                                       //
          var toPublish = comparator(newDoc, maxPublished) < 0; // or stays in buffer even after the change            // 454
                                                                                                                       //
          var staysInBuffer = !toPublish && self._safeAppendToBuffer || !toPublish && maxBuffered && comparator(newDoc, maxBuffered) <= 0;
                                                                                                                       //
          if (toPublish) {                                                                                             // 461
            self._addPublished(id, newDoc);                                                                            // 462
          } else if (staysInBuffer) {                                                                                  // 463
            // stays in buffer but changes                                                                             // 464
            self._unpublishedBuffer.set(id, newDoc);                                                                   // 465
          } else {                                                                                                     // 466
            // Throw away from both published set and buffer                                                           // 467
            self._safeAppendToBuffer = false; // Normally this check would have been done in _removeBuffered but       // 468
            // we didn't use it, so we need to do it ourself now.                                                      // 470
                                                                                                                       //
            if (!self._unpublishedBuffer.size()) {                                                                     // 471
              self._needToPollQuery();                                                                                 // 472
            }                                                                                                          // 473
          }                                                                                                            // 474
        } else {                                                                                                       // 475
          throw new Error("cachedBefore implies either of publishedBefore or bufferedBefore is true.");                // 476
        }                                                                                                              // 477
      }                                                                                                                // 478
    });                                                                                                                // 479
  },                                                                                                                   // 480
  _fetchModifiedDocuments: function () {                                                                               // 481
    var self = this;                                                                                                   // 482
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 483
      self._registerPhaseChange(PHASE.FETCHING); // Defer, because nothing called from the oplog entry handler may yield,
      // but fetch() yields.                                                                                           // 486
                                                                                                                       //
                                                                                                                       //
      Meteor.defer(finishIfNeedToPollQuery(function () {                                                               // 487
        while (!self._stopped && !self._needToFetch.empty()) {                                                         // 488
          if (self._phase === PHASE.QUERYING) {                                                                        // 489
            // While fetching, we decided to go into QUERYING mode, and then we                                        // 490
            // saw another oplog entry, so _needToFetch is not empty. But we                                           // 491
            // shouldn't fetch these documents until AFTER the query is done.                                          // 492
            break;                                                                                                     // 493
          } // Being in steady phase here would be surprising.                                                         // 494
                                                                                                                       //
                                                                                                                       //
          if (self._phase !== PHASE.FETCHING) throw new Error("phase in fetchModifiedDocuments: " + self._phase);      // 497
          self._currentlyFetching = self._needToFetch;                                                                 // 500
          var thisGeneration = ++self._fetchGeneration;                                                                // 501
          self._needToFetch = new LocalCollection._IdMap();                                                            // 502
          var waiting = 0;                                                                                             // 503
          var fut = new Future(); // This loop is safe, because _currentlyFetching will not be updated                 // 504
          // during this loop (in fact, it is never mutated).                                                          // 506
                                                                                                                       //
          self._currentlyFetching.forEach(function (cacheKey, id) {                                                    // 507
            waiting++;                                                                                                 // 508
                                                                                                                       //
            self._mongoHandle._docFetcher.fetch(self._cursorDescription.collectionName, id, cacheKey, finishIfNeedToPollQuery(function (err, doc) {
              try {                                                                                                    // 512
                if (err) {                                                                                             // 513
                  Meteor._debug("Got exception while fetching documents: " + err); // If we get an error from the fetcher (eg, trouble
                  // connecting to Mongo), let's just abandon the fetch phase                                          // 517
                  // altogether and fall back to polling. It's not like we're                                          // 518
                  // getting live updates anyway.                                                                      // 519
                                                                                                                       //
                                                                                                                       //
                  if (self._phase !== PHASE.QUERYING) {                                                                // 520
                    self._needToPollQuery();                                                                           // 521
                  }                                                                                                    // 522
                } else if (!self._stopped && self._phase === PHASE.FETCHING && self._fetchGeneration === thisGeneration) {
                  // We re-check the generation in case we've had an explicit                                          // 525
                  // _pollQuery call (eg, in another fiber) which should                                               // 526
                  // effectively cancel this round of fetches.  (_pollQuery                                            // 527
                  // increments the generation.)                                                                       // 528
                  self._handleDoc(id, doc);                                                                            // 529
                }                                                                                                      // 530
              } finally {                                                                                              // 531
                waiting--; // Because fetch() never calls its callback synchronously,                                  // 532
                // this is safe (ie, we won't call fut.return() before the                                             // 534
                // forEach is done).                                                                                   // 535
                                                                                                                       //
                if (waiting === 0) fut.return();                                                                       // 536
              }                                                                                                        // 538
            }));                                                                                                       // 539
          });                                                                                                          // 540
                                                                                                                       //
          fut.wait(); // Exit now if we've had a _pollQuery call (here or in another fiber).                           // 541
                                                                                                                       //
          if (self._phase === PHASE.QUERYING) return;                                                                  // 543
          self._currentlyFetching = null;                                                                              // 545
        } // We're done fetching, so we can be steady, unless we've had a                                              // 546
        // _pollQuery call (here or in another fiber).                                                                 // 548
                                                                                                                       //
                                                                                                                       //
        if (self._phase !== PHASE.QUERYING) self._beSteady();                                                          // 549
      }));                                                                                                             // 551
    });                                                                                                                // 552
  },                                                                                                                   // 553
  _beSteady: function () {                                                                                             // 554
    var self = this;                                                                                                   // 555
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 556
      self._registerPhaseChange(PHASE.STEADY);                                                                         // 557
                                                                                                                       //
      var writes = self._writesToCommitWhenWeReachSteady;                                                              // 558
      self._writesToCommitWhenWeReachSteady = [];                                                                      // 559
                                                                                                                       //
      self._multiplexer.onFlush(function () {                                                                          // 560
        _.each(writes, function (w) {                                                                                  // 561
          w.committed();                                                                                               // 562
        });                                                                                                            // 563
      });                                                                                                              // 564
    });                                                                                                                // 565
  },                                                                                                                   // 566
  _handleOplogEntryQuerying: function (op) {                                                                           // 567
    var self = this;                                                                                                   // 568
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 569
      self._needToFetch.set(idForOp(op), op.ts.toString());                                                            // 570
    });                                                                                                                // 571
  },                                                                                                                   // 572
  _handleOplogEntrySteadyOrFetching: function (op) {                                                                   // 573
    var self = this;                                                                                                   // 574
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 575
      var id = idForOp(op); // If we're already fetching this one, or about to, we can't optimize;                     // 576
      // make sure that we fetch it again if necessary.                                                                // 578
                                                                                                                       //
      if (self._phase === PHASE.FETCHING && (self._currentlyFetching && self._currentlyFetching.has(id) || self._needToFetch.has(id))) {
        self._needToFetch.set(id, op.ts.toString());                                                                   // 582
                                                                                                                       //
        return;                                                                                                        // 583
      }                                                                                                                // 584
                                                                                                                       //
      if (op.op === 'd') {                                                                                             // 586
        if (self._published.has(id) || self._limit && self._unpublishedBuffer.has(id)) self._removeMatching(id);       // 587
      } else if (op.op === 'i') {                                                                                      // 590
        if (self._published.has(id)) throw new Error("insert found for already-existing ID in published");             // 591
        if (self._unpublishedBuffer && self._unpublishedBuffer.has(id)) throw new Error("insert found for already-existing ID in buffer"); // XXX what if selector yields?  for now it can't but later it could
        // have $where                                                                                                 // 597
                                                                                                                       //
        if (self._matcher.documentMatches(op.o).result) self._addMatching(op.o);                                       // 598
      } else if (op.op === 'u') {                                                                                      // 600
        // Is this a modifier ($set/$unset, which may require us to poll the                                           // 601
        // database to figure out if the whole document matches the selector) or                                       // 602
        // a replacement (in which case we can just directly re-evaluate the                                           // 603
        // selector)?                                                                                                  // 604
        var isReplace = !_.has(op.o, '$set') && !_.has(op.o, '$unset'); // If this modifier modifies something inside an EJSON custom type (ie,
        // anything with EJSON$), then we can't try to use                                                             // 607
        // LocalCollection._modify, since that just mutates the EJSON encoding,                                        // 608
        // not the actual object.                                                                                      // 609
                                                                                                                       //
        var canDirectlyModifyDoc = !isReplace && modifierCanBeDirectlyApplied(op.o);                                   // 610
                                                                                                                       //
        var publishedBefore = self._published.has(id);                                                                 // 613
                                                                                                                       //
        var bufferedBefore = self._limit && self._unpublishedBuffer.has(id);                                           // 614
                                                                                                                       //
        if (isReplace) {                                                                                               // 616
          self._handleDoc(id, _.extend({                                                                               // 617
            _id: id                                                                                                    // 617
          }, op.o));                                                                                                   // 617
        } else if ((publishedBefore || bufferedBefore) && canDirectlyModifyDoc) {                                      // 618
          // Oh great, we actually know what the document is, so we can apply                                          // 620
          // this directly.                                                                                            // 621
          var newDoc = self._published.has(id) ? self._published.get(id) : self._unpublishedBuffer.get(id);            // 622
          newDoc = EJSON.clone(newDoc);                                                                                // 624
          newDoc._id = id;                                                                                             // 626
                                                                                                                       //
          try {                                                                                                        // 627
            LocalCollection._modify(newDoc, op.o);                                                                     // 628
          } catch (e) {                                                                                                // 629
            if (e.name !== "MinimongoError") throw e; // We didn't understand the modifier.  Re-fetch.                 // 630
                                                                                                                       //
            self._needToFetch.set(id, op.ts.toString());                                                               // 633
                                                                                                                       //
            if (self._phase === PHASE.STEADY) {                                                                        // 634
              self._fetchModifiedDocuments();                                                                          // 635
            }                                                                                                          // 636
                                                                                                                       //
            return;                                                                                                    // 637
          }                                                                                                            // 638
                                                                                                                       //
          self._handleDoc(id, self._sharedProjectionFn(newDoc));                                                       // 639
        } else if (!canDirectlyModifyDoc || self._matcher.canBecomeTrueByModifier(op.o) || self._sorter && self._sorter.affectedByModifier(op.o)) {
          self._needToFetch.set(id, op.ts.toString());                                                                 // 643
                                                                                                                       //
          if (self._phase === PHASE.STEADY) self._fetchModifiedDocuments();                                            // 644
        }                                                                                                              // 646
      } else {                                                                                                         // 647
        throw Error("XXX SURPRISING OPERATION: " + op);                                                                // 648
      }                                                                                                                // 649
    });                                                                                                                // 650
  },                                                                                                                   // 651
  // Yields!                                                                                                           // 652
  _runInitialQuery: function () {                                                                                      // 653
    var self = this;                                                                                                   // 654
    if (self._stopped) throw new Error("oplog stopped surprisingly early");                                            // 655
                                                                                                                       //
    self._runQuery({                                                                                                   // 658
      initial: true                                                                                                    // 658
    }); // yields                                                                                                      // 658
                                                                                                                       //
                                                                                                                       //
    if (self._stopped) return; // can happen on queryError                                                             // 660
    // Allow observeChanges calls to return. (After this, it's possible for                                            // 663
    // stop() to be called.)                                                                                           // 664
                                                                                                                       //
    self._multiplexer.ready();                                                                                         // 665
                                                                                                                       //
    self._doneQuerying(); // yields                                                                                    // 667
                                                                                                                       //
  },                                                                                                                   // 668
  // In various circumstances, we may just want to stop processing the oplog and                                       // 670
  // re-run the initial query, just as if we were a PollingObserveDriver.                                              // 671
  //                                                                                                                   // 672
  // This function may not block, because it is called from an oplog entry                                             // 673
  // handler.                                                                                                          // 674
  //                                                                                                                   // 675
  // XXX We should call this when we detect that we've been in FETCHING for "too                                       // 676
  // long".                                                                                                            // 677
  //                                                                                                                   // 678
  // XXX We should call this when we detect Mongo failover (since that might                                           // 679
  // mean that some of the oplog entries we have processed have been rolled                                            // 680
  // back). The Node Mongo driver is in the middle of a bunch of huge                                                  // 681
  // refactorings, including the way that it notifies you when primary                                                 // 682
  // changes. Will put off implementing this until driver 1.4 is out.                                                  // 683
  _pollQuery: function () {                                                                                            // 684
    var self = this;                                                                                                   // 685
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 686
      if (self._stopped) return; // Yay, we get to forget about all the things we thought we had to fetch.             // 687
                                                                                                                       //
      self._needToFetch = new LocalCollection._IdMap();                                                                // 691
      self._currentlyFetching = null;                                                                                  // 692
      ++self._fetchGeneration; // ignore any in-flight fetches                                                         // 693
                                                                                                                       //
      self._registerPhaseChange(PHASE.QUERYING); // Defer so that we don't yield.  We don't need finishIfNeedToPollQuery
      // here because SwitchedToQuery is not thrown in QUERYING mode.                                                  // 697
                                                                                                                       //
                                                                                                                       //
      Meteor.defer(function () {                                                                                       // 698
        self._runQuery();                                                                                              // 699
                                                                                                                       //
        self._doneQuerying();                                                                                          // 700
      });                                                                                                              // 701
    });                                                                                                                // 702
  },                                                                                                                   // 703
  // Yields!                                                                                                           // 705
  _runQuery: function (options) {                                                                                      // 706
    var self = this;                                                                                                   // 707
    options = options || {};                                                                                           // 708
    var newResults, newBuffer; // This while loop is just to retry failures.                                           // 709
                                                                                                                       //
    while (true) {                                                                                                     // 712
      // If we've been stopped, we don't have to run anything any more.                                                // 713
      if (self._stopped) return;                                                                                       // 714
      newResults = new LocalCollection._IdMap();                                                                       // 717
      newBuffer = new LocalCollection._IdMap(); // Query 2x documents as the half excluded from the original query will go
      // into unpublished buffer to reduce additional Mongo lookups in cases                                           // 721
      // when documents are removed from the published set and need a                                                  // 722
      // replacement.                                                                                                  // 723
      // XXX needs more thought on non-zero skip                                                                       // 724
      // XXX 2 is a "magic number" meaning there is an extra chunk of docs for                                         // 725
      // buffer if such is needed.                                                                                     // 726
                                                                                                                       //
      var cursor = self._cursorForQuery({                                                                              // 727
        limit: self._limit * 2                                                                                         // 727
      });                                                                                                              // 727
                                                                                                                       //
      try {                                                                                                            // 728
        cursor.forEach(function (doc, i) {                                                                             // 729
          // yields                                                                                                    // 729
          if (!self._limit || i < self._limit) {                                                                       // 730
            newResults.set(doc._id, doc);                                                                              // 731
          } else {                                                                                                     // 732
            newBuffer.set(doc._id, doc);                                                                               // 733
          }                                                                                                            // 734
        });                                                                                                            // 735
        break;                                                                                                         // 736
      } catch (e) {                                                                                                    // 737
        if (options.initial && typeof e.code === 'number') {                                                           // 738
          // This is an error document sent to us by mongod, not a connection                                          // 739
          // error generated by the client. And we've never seen this query work                                       // 740
          // successfully. Probably it's a bad selector or something, so we                                            // 741
          // should NOT retry. Instead, we should halt the observe (which ends                                         // 742
          // up calling `stop` on us).                                                                                 // 743
          self._multiplexer.queryError(e);                                                                             // 744
                                                                                                                       //
          return;                                                                                                      // 745
        } // During failover (eg) if we get an exception we should log and retry                                       // 746
        // instead of crashing.                                                                                        // 749
                                                                                                                       //
                                                                                                                       //
        Meteor._debug("Got exception while polling query: " + e);                                                      // 750
                                                                                                                       //
        Meteor._sleepForMs(100);                                                                                       // 751
      }                                                                                                                // 752
    }                                                                                                                  // 753
                                                                                                                       //
    if (self._stopped) return;                                                                                         // 755
                                                                                                                       //
    self._publishNewResults(newResults, newBuffer);                                                                    // 758
  },                                                                                                                   // 759
  // Transitions to QUERYING and runs another query, or (if already in QUERYING)                                       // 761
  // ensures that we will query again later.                                                                           // 762
  //                                                                                                                   // 763
  // This function may not block, because it is called from an oplog entry                                             // 764
  // handler. However, if we were not already in the QUERYING phase, it throws                                         // 765
  // an exception that is caught by the closest surrounding                                                            // 766
  // finishIfNeedToPollQuery call; this ensures that we don't continue running                                         // 767
  // close that was designed for another phase inside PHASE.QUERYING.                                                  // 768
  //                                                                                                                   // 769
  // (It's also necessary whenever logic in this file yields to check that other                                       // 770
  // phases haven't put us into QUERYING mode, though; eg,                                                             // 771
  // _fetchModifiedDocuments does this.)                                                                               // 772
  _needToPollQuery: function () {                                                                                      // 773
    var self = this;                                                                                                   // 774
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 775
      if (self._stopped) return; // If we're not already in the middle of a query, we can query now                    // 776
      // (possibly pausing FETCHING).                                                                                  // 780
                                                                                                                       //
      if (self._phase !== PHASE.QUERYING) {                                                                            // 781
        self._pollQuery();                                                                                             // 782
                                                                                                                       //
        throw new SwitchedToQuery();                                                                                   // 783
      } // We're currently in QUERYING. Set a flag to ensure that we run another                                       // 784
      // query when we're done.                                                                                        // 787
                                                                                                                       //
                                                                                                                       //
      self._requeryWhenDoneThisQuery = true;                                                                           // 788
    });                                                                                                                // 789
  },                                                                                                                   // 790
  // Yields!                                                                                                           // 792
  _doneQuerying: function () {                                                                                         // 793
    var self = this;                                                                                                   // 794
    if (self._stopped) return;                                                                                         // 796
                                                                                                                       //
    self._mongoHandle._oplogHandle.waitUntilCaughtUp(); // yields                                                      // 798
                                                                                                                       //
                                                                                                                       //
    if (self._stopped) return;                                                                                         // 799
    if (self._phase !== PHASE.QUERYING) throw Error("Phase unexpectedly " + self._phase);                              // 801
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 804
      if (self._requeryWhenDoneThisQuery) {                                                                            // 805
        self._requeryWhenDoneThisQuery = false;                                                                        // 806
                                                                                                                       //
        self._pollQuery();                                                                                             // 807
      } else if (self._needToFetch.empty()) {                                                                          // 808
        self._beSteady();                                                                                              // 809
      } else {                                                                                                         // 810
        self._fetchModifiedDocuments();                                                                                // 811
      }                                                                                                                // 812
    });                                                                                                                // 813
  },                                                                                                                   // 814
  _cursorForQuery: function (optionsOverwrite) {                                                                       // 816
    var self = this;                                                                                                   // 817
    return Meteor._noYieldsAllowed(function () {                                                                       // 818
      // The query we run is almost the same as the cursor we are observing,                                           // 819
      // with a few changes. We need to read all the fields that are relevant to                                       // 820
      // the selector, not just the fields we are going to publish (that's the                                         // 821
      // "shared" projection). And we don't want to apply any transform in the                                         // 822
      // cursor, because observeChanges shouldn't use the transform.                                                   // 823
      var options = _.clone(self._cursorDescription.options); // Allow the caller to modify the options. Useful to specify different
      // skip and limit values.                                                                                        // 827
                                                                                                                       //
                                                                                                                       //
      _.extend(options, optionsOverwrite);                                                                             // 828
                                                                                                                       //
      options.fields = self._sharedProjection;                                                                         // 830
      delete options.transform; // We are NOT deep cloning fields or selector here, which should be OK.                // 831
                                                                                                                       //
      var description = new CursorDescription(self._cursorDescription.collectionName, self._cursorDescription.selector, options);
      return new Cursor(self._mongoHandle, description);                                                               // 837
    });                                                                                                                // 838
  },                                                                                                                   // 839
  // Replace self._published with newResults (both are IdMaps), invoking observe                                       // 842
  // callbacks on the multiplexer.                                                                                     // 843
  // Replace self._unpublishedBuffer with newBuffer.                                                                   // 844
  //                                                                                                                   // 845
  // XXX This is very similar to LocalCollection._diffQueryUnorderedChanges. We                                        // 846
  // should really: (a) Unify IdMap and OrderedDict into Unordered/OrderedDict                                         // 847
  // (b) Rewrite diff.js to use these classes instead of arrays and objects.                                           // 848
  _publishNewResults: function (newResults, newBuffer) {                                                               // 849
    var self = this;                                                                                                   // 850
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 851
      // If the query is limited and there is a buffer, shut down so it doesn't                                        // 853
      // stay in a way.                                                                                                // 854
      if (self._limit) {                                                                                               // 855
        self._unpublishedBuffer.clear();                                                                               // 856
      } // First remove anything that's gone. Be careful not to modify                                                 // 857
      // self._published while iterating over it.                                                                      // 860
                                                                                                                       //
                                                                                                                       //
      var idsToRemove = [];                                                                                            // 861
                                                                                                                       //
      self._published.forEach(function (doc, id) {                                                                     // 862
        if (!newResults.has(id)) idsToRemove.push(id);                                                                 // 863
      });                                                                                                              // 865
                                                                                                                       //
      _.each(idsToRemove, function (id) {                                                                              // 866
        self._removePublished(id);                                                                                     // 867
      }); // Now do adds and changes.                                                                                  // 868
      // If self has a buffer and limit, the new fetched result will be                                                // 871
      // limited correctly as the query has sort specifier.                                                            // 872
                                                                                                                       //
                                                                                                                       //
      newResults.forEach(function (doc, id) {                                                                          // 873
        self._handleDoc(id, doc);                                                                                      // 874
      }); // Sanity-check that everything we tried to put into _published ended up                                     // 875
      // there.                                                                                                        // 878
      // XXX if this is slow, remove it later                                                                          // 879
                                                                                                                       //
      if (self._published.size() !== newResults.size()) {                                                              // 880
        throw Error("The Mongo server and the Meteor query disagree on how " + "many documents match your query. Maybe it is hitting a Mongo " + "edge case? The query is: " + EJSON.stringify(self._cursorDescription.selector));
      }                                                                                                                // 886
                                                                                                                       //
      self._published.forEach(function (doc, id) {                                                                     // 887
        if (!newResults.has(id)) throw Error("_published has a doc that newResults doesn't; " + id);                   // 888
      }); // Finally, replace the buffer                                                                               // 890
                                                                                                                       //
                                                                                                                       //
      newBuffer.forEach(function (doc, id) {                                                                           // 893
        self._addBuffered(id, doc);                                                                                    // 894
      });                                                                                                              // 895
      self._safeAppendToBuffer = newBuffer.size() < self._limit;                                                       // 897
    });                                                                                                                // 898
  },                                                                                                                   // 899
  // This stop function is invoked from the onStop of the ObserveMultiplexer, so                                       // 901
  // it shouldn't actually be possible to call it until the multiplexer is                                             // 902
  // ready.                                                                                                            // 903
  //                                                                                                                   // 904
  // It's important to check self._stopped after every call in this file that                                          // 905
  // can yield!                                                                                                        // 906
  stop: function () {                                                                                                  // 907
    var self = this;                                                                                                   // 908
    if (self._stopped) return;                                                                                         // 909
    self._stopped = true;                                                                                              // 911
                                                                                                                       //
    _.each(self._stopHandles, function (handle) {                                                                      // 912
      handle.stop();                                                                                                   // 913
    }); // Note: we *don't* use multiplexer.onFlush here because this stop                                             // 914
    // callback is actually invoked by the multiplexer itself when it has                                              // 917
    // determined that there are no handles left. So nothing is actually going                                         // 918
    // to get flushed (and it's probably not valid to call methods on the                                              // 919
    // dying multiplexer).                                                                                             // 920
                                                                                                                       //
                                                                                                                       //
    _.each(self._writesToCommitWhenWeReachSteady, function (w) {                                                       // 921
      w.committed(); // maybe yields?                                                                                  // 922
    });                                                                                                                // 923
                                                                                                                       //
    self._writesToCommitWhenWeReachSteady = null; // Proactively drop references to potentially big things.            // 924
                                                                                                                       //
    self._published = null;                                                                                            // 927
    self._unpublishedBuffer = null;                                                                                    // 928
    self._needToFetch = null;                                                                                          // 929
    self._currentlyFetching = null;                                                                                    // 930
    self._oplogEntryHandle = null;                                                                                     // 931
    self._listenersHandle = null;                                                                                      // 932
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-oplog", -1);           // 934
  },                                                                                                                   // 936
  _registerPhaseChange: function (phase) {                                                                             // 938
    var self = this;                                                                                                   // 939
                                                                                                                       //
    Meteor._noYieldsAllowed(function () {                                                                              // 940
      var now = new Date();                                                                                            // 941
                                                                                                                       //
      if (self._phase) {                                                                                               // 943
        var timeDiff = now - self._phaseStartTime;                                                                     // 944
        Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "time-spent-in-" + self._phase + "-phase", timeDiff);
      }                                                                                                                // 947
                                                                                                                       //
      self._phase = phase;                                                                                             // 949
      self._phaseStartTime = now;                                                                                      // 950
    });                                                                                                                // 951
  }                                                                                                                    // 952
}); // Does our oplog tailing code support this cursor? For now, we are being very                                     // 195
// conservative and allowing only simple queries with simple options.                                                  // 956
// (This is a "static method".)                                                                                        // 957
                                                                                                                       //
                                                                                                                       //
OplogObserveDriver.cursorSupported = function (cursorDescription, matcher) {                                           // 958
  // First, check the options.                                                                                         // 959
  var options = cursorDescription.options; // Did the user say no explicitly?                                          // 960
  // underscored version of the option is COMPAT with 1.2                                                              // 963
                                                                                                                       //
  if (options.disableOplog || options._disableOplog) return false; // skip is not supported: to support it we would need to keep track of all
  // "skipped" documents or at least their ids.                                                                        // 968
  // limit w/o a sort specifier is not supported: current implementation needs a                                       // 969
  // deterministic way to order documents.                                                                             // 970
                                                                                                                       //
  if (options.skip || options.limit && !options.sort) return false; // If a fields projection option is given check if it is supported by
  // minimongo (some operators are not supported).                                                                     // 974
                                                                                                                       //
  if (options.fields) {                                                                                                // 975
    try {                                                                                                              // 976
      LocalCollection._checkSupportedProjection(options.fields);                                                       // 977
    } catch (e) {                                                                                                      // 978
      if (e.name === "MinimongoError") {                                                                               // 979
        return false;                                                                                                  // 980
      } else {                                                                                                         // 981
        throw e;                                                                                                       // 982
      }                                                                                                                // 983
    }                                                                                                                  // 984
  } // We don't allow the following selectors:                                                                         // 985
  //   - $where (not confident that we provide the same JS environment                                                 // 988
  //             as Mongo, and can yield!)                                                                             // 989
  //   - $near (has "interesting" properties in MongoDB, like the possibility                                          // 990
  //            of returning an ID multiple times, though even polling maybe                                           // 991
  //            have a bug there)                                                                                      // 992
  //           XXX: once we support it, we would need to think more on how we                                          // 993
  //           initialize the comparators when we create the driver.                                                   // 994
                                                                                                                       //
                                                                                                                       //
  return !matcher.hasWhere() && !matcher.hasGeoQuery();                                                                // 995
};                                                                                                                     // 996
                                                                                                                       //
var modifierCanBeDirectlyApplied = function (modifier) {                                                               // 998
  return _.all(modifier, function (fields, operation) {                                                                // 999
    return _.all(fields, function (value, field) {                                                                     // 1000
      return !/EJSON\$/.test(field);                                                                                   // 1001
    });                                                                                                                // 1002
  });                                                                                                                  // 1003
};                                                                                                                     // 1004
                                                                                                                       //
MongoInternals.OplogObserveDriver = OplogObserveDriver;                                                                // 1006
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"local_collection_driver.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/local_collection_driver.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
LocalCollectionDriver = function () {                                                                                  // 1
  var self = this;                                                                                                     // 2
  self.noConnCollections = {};                                                                                         // 3
};                                                                                                                     // 4
                                                                                                                       //
var ensureCollection = function (name, collections) {                                                                  // 6
  if (!(name in collections)) collections[name] = new LocalCollection(name);                                           // 7
  return collections[name];                                                                                            // 9
};                                                                                                                     // 10
                                                                                                                       //
_.extend(LocalCollectionDriver.prototype, {                                                                            // 12
  open: function (name, conn) {                                                                                        // 13
    var self = this;                                                                                                   // 14
    if (!name) return new LocalCollection();                                                                           // 15
                                                                                                                       //
    if (!conn) {                                                                                                       // 17
      return ensureCollection(name, self.noConnCollections);                                                           // 18
    }                                                                                                                  // 19
                                                                                                                       //
    if (!conn._mongo_livedata_collections) conn._mongo_livedata_collections = {}; // XXX is there a way to keep track of a connection's collections without
    // dangling it off the connection object?                                                                          // 23
                                                                                                                       //
    return ensureCollection(name, conn._mongo_livedata_collections);                                                   // 24
  }                                                                                                                    // 25
}); // singleton                                                                                                       // 12
                                                                                                                       //
                                                                                                                       //
LocalCollectionDriver = new LocalCollectionDriver();                                                                   // 29
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"remote_collection_driver.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/remote_collection_driver.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
MongoInternals.RemoteCollectionDriver = function (mongo_url, options) {                                                // 1
  var self = this;                                                                                                     // 3
  self.mongo = new MongoConnection(mongo_url, options);                                                                // 4
};                                                                                                                     // 5
                                                                                                                       //
_.extend(MongoInternals.RemoteCollectionDriver.prototype, {                                                            // 7
  open: function (name) {                                                                                              // 8
    var self = this;                                                                                                   // 9
    var ret = {};                                                                                                      // 10
                                                                                                                       //
    _.each(['find', 'findOne', 'insert', 'update', 'upsert', 'remove', '_ensureIndex', '_dropIndex', '_createCappedCollection', 'dropCollection', 'rawCollection'], function (m) {
      ret[m] = _.bind(self.mongo[m], self.mongo, name);                                                                // 16
    });                                                                                                                // 17
                                                                                                                       //
    return ret;                                                                                                        // 18
  }                                                                                                                    // 19
}); // Create the singleton RemoteCollectionDriver only on demand, so we                                               // 7
// only require Mongo configuration if it's actually used (eg, not if                                                  // 24
// you're only trying to receive data from a remote DDP server.)                                                       // 25
                                                                                                                       //
                                                                                                                       //
MongoInternals.defaultRemoteCollectionDriver = _.once(function () {                                                    // 26
  var connectionOptions = {};                                                                                          // 27
  var mongoUrl = process.env.MONGO_URL;                                                                                // 29
                                                                                                                       //
  if (process.env.MONGO_OPLOG_URL) {                                                                                   // 31
    connectionOptions.oplogUrl = process.env.MONGO_OPLOG_URL;                                                          // 32
  }                                                                                                                    // 33
                                                                                                                       //
  if (!mongoUrl) throw new Error("MONGO_URL must be set in environment");                                              // 35
  return new MongoInternals.RemoteCollectionDriver(mongoUrl, connectionOptions);                                       // 38
});                                                                                                                    // 39
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collection.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// options.connection, if given, is a LivedataClient or LivedataServer                                                 // 1
// XXX presently there is no way to destroy/clean up a Collection                                                      // 2
/**                                                                                                                    // 4
 * @summary Namespace for MongoDB-related items                                                                        //
 * @namespace                                                                                                          //
 */Mongo = {}; /**                                                                                                     //
                * @summary Constructor for a Collection                                                                //
                * @locus Anywhere                                                                                      //
                * @instancename collection                                                                             //
                * @class                                                                                               //
                * @param {String} name The name of the collection.  If null, creates an unmanaged (unsynchronized) local collection.
                * @param {Object} [options]                                                                            //
                * @param {Object} options.connection The server connection that will manage this collection. Uses the default connection if not specified.  Pass the return value of calling [`DDP.connect`](#ddp_connect) to specify a different server. Pass `null` to specify no connection. Unmanaged (`name` is null) collections cannot specify a connection.
                * @param {String} options.idGeneration The method of generating the `_id` fields of new documents in this collection.  Possible values:
                                                                                                                       //
                - **`'STRING'`**: random strings                                                                       //
                - **`'MONGO'`**:  random [`Mongo.ObjectID`](#mongo_object_id) values                                   //
                                                                                                                       //
               The default id generation technique is `'STRING'`.                                                      //
                * @param {Function} options.transform An optional transformation function. Documents will be passed through this function before being returned from `fetch` or `findOne`, and before being passed to callbacks of `observe`, `map`, `forEach`, `allow`, and `deny`. Transforms are *not* applied for the callbacks of `observeChanges` or to cursors returned from publish functions.
                * @param {Boolean} options.defineMutationMethods Set to `false` to skip setting up the mutation methods that enable insert/update/remove from client code. Default `true`.
                */                                                                                                     //
                                                                                                                       //
Mongo.Collection = function (name, options) {                                                                          // 27
  var self = this;                                                                                                     // 28
  if (!(self instanceof Mongo.Collection)) throw new Error('use "new" to construct a Mongo.Collection');               // 29
                                                                                                                       //
  if (!name && name !== null) {                                                                                        // 32
    Meteor._debug("Warning: creating anonymous collection. It will not be " + "saved or synchronized over the network. (Pass null for " + "the collection name to turn off this warning.)");
                                                                                                                       //
    name = null;                                                                                                       // 36
  }                                                                                                                    // 37
                                                                                                                       //
  if (name !== null && typeof name !== "string") {                                                                     // 39
    throw new Error("First argument to new Mongo.Collection must be a string or null");                                // 40
  }                                                                                                                    // 42
                                                                                                                       //
  if (options && options.methods) {                                                                                    // 44
    // Backwards compatibility hack with original signature (which passed                                              // 45
    // "connection" directly instead of in options. (Connections must have a "methods"                                 // 46
    // method.)                                                                                                        // 47
    // XXX remove before 1.0                                                                                           // 48
    options = {                                                                                                        // 49
      connection: options                                                                                              // 49
    };                                                                                                                 // 49
  } // Backwards compatibility: "connection" used to be called "manager".                                              // 50
                                                                                                                       //
                                                                                                                       //
  if (options && options.manager && !options.connection) {                                                             // 52
    options.connection = options.manager;                                                                              // 53
  }                                                                                                                    // 54
                                                                                                                       //
  options = _.extend({                                                                                                 // 55
    connection: undefined,                                                                                             // 56
    idGeneration: 'STRING',                                                                                            // 57
    transform: null,                                                                                                   // 58
    _driver: undefined,                                                                                                // 59
    _preventAutopublish: false                                                                                         // 60
  }, options);                                                                                                         // 55
                                                                                                                       //
  switch (options.idGeneration) {                                                                                      // 63
    case 'MONGO':                                                                                                      // 64
      self._makeNewID = function () {                                                                                  // 65
        var src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;                                    // 66
        return new Mongo.ObjectID(src.hexString(24));                                                                  // 67
      };                                                                                                               // 68
                                                                                                                       //
      break;                                                                                                           // 69
                                                                                                                       //
    case 'STRING':                                                                                                     // 70
    default:                                                                                                           // 71
      self._makeNewID = function () {                                                                                  // 72
        var src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;                                    // 73
        return src.id();                                                                                               // 74
      };                                                                                                               // 75
                                                                                                                       //
      break;                                                                                                           // 76
  }                                                                                                                    // 63
                                                                                                                       //
  self._transform = LocalCollection.wrapTransform(options.transform);                                                  // 79
  if (!name || options.connection === null) // note: nameless collections never have a connection                      // 81
    self._connection = null;else if (options.connection) self._connection = options.connection;else if (Meteor.isClient) self._connection = Meteor.connection;else self._connection = Meteor.server;
                                                                                                                       //
  if (!options._driver) {                                                                                              // 91
    // XXX This check assumes that webapp is loaded so that Meteor.server !==                                          // 92
    // null. We should fully support the case of "want to use a Mongo-backed                                           // 93
    // collection from Node code without webapp", but we don't yet.                                                    // 94
    // #MeteorServerNull                                                                                               // 95
    if (name && self._connection === Meteor.server && typeof MongoInternals !== "undefined" && MongoInternals.defaultRemoteCollectionDriver) {
      options._driver = MongoInternals.defaultRemoteCollectionDriver();                                                // 99
    } else {                                                                                                           // 100
      options._driver = LocalCollectionDriver;                                                                         // 101
    }                                                                                                                  // 102
  }                                                                                                                    // 103
                                                                                                                       //
  self._collection = options._driver.open(name, self._connection);                                                     // 105
  self._name = name;                                                                                                   // 106
  self._driver = options._driver;                                                                                      // 107
                                                                                                                       //
  if (self._connection && self._connection.registerStore) {                                                            // 109
    // OK, we're going to be a slave, replicating some remote                                                          // 110
    // database, except possibly with some temporary divergence while                                                  // 111
    // we have unacknowledged RPC's.                                                                                   // 112
    var ok = self._connection.registerStore(name, {                                                                    // 113
      // Called at the beginning of a batch of updates. batchSize is the number                                        // 114
      // of update calls to expect.                                                                                    // 115
      //                                                                                                               // 116
      // XXX This interface is pretty janky. reset probably ought to go back to                                        // 117
      // being its own function, and callers shouldn't have to calculate                                               // 118
      // batchSize. The optimization of not calling pause/remove should be                                             // 119
      // delayed until later: the first call to update() should buffer its                                             // 120
      // message, and then we can either directly apply it at endUpdate time if                                        // 121
      // it was the only update, or do pauseObservers/apply/apply at the next                                          // 122
      // update() if there's another one.                                                                              // 123
      beginUpdate: function (batchSize, reset) {                                                                       // 124
        // pause observers so users don't see flicker when updating several                                            // 125
        // objects at once (including the post-reconnect reset-and-reapply                                             // 126
        // stage), and so that a re-sorting of a query can take advantage of the                                       // 127
        // full _diffQuery moved calculation instead of applying change one at a                                       // 128
        // time.                                                                                                       // 129
        if (batchSize > 1 || reset) self._collection.pauseObservers();                                                 // 130
        if (reset) self._collection.remove({});                                                                        // 133
      },                                                                                                               // 135
      // Apply an update.                                                                                              // 137
      // XXX better specify this interface (not in terms of a wire message)?                                           // 138
      update: function (msg) {                                                                                         // 139
        var mongoId = MongoID.idParse(msg.id);                                                                         // 140
                                                                                                                       //
        var doc = self._collection.findOne(mongoId); // Is this a "replace the whole doc" message coming from the quiescence
        // of method writes to an object? (Note that 'undefined' is a valid                                            // 144
        // value meaning "remove it".)                                                                                 // 145
                                                                                                                       //
                                                                                                                       //
        if (msg.msg === 'replace') {                                                                                   // 146
          var replace = msg.replace;                                                                                   // 147
                                                                                                                       //
          if (!replace) {                                                                                              // 148
            if (doc) self._collection.remove(mongoId);                                                                 // 149
          } else if (!doc) {                                                                                           // 151
            self._collection.insert(replace);                                                                          // 152
          } else {                                                                                                     // 153
            // XXX check that replace has no $ ops                                                                     // 154
            self._collection.update(mongoId, replace);                                                                 // 155
          }                                                                                                            // 156
                                                                                                                       //
          return;                                                                                                      // 157
        } else if (msg.msg === 'added') {                                                                              // 158
          if (doc) {                                                                                                   // 159
            throw new Error("Expected not to find a document already present for an add");                             // 160
          }                                                                                                            // 161
                                                                                                                       //
          self._collection.insert(_.extend({                                                                           // 162
            _id: mongoId                                                                                               // 162
          }, msg.fields));                                                                                             // 162
        } else if (msg.msg === 'removed') {                                                                            // 163
          if (!doc) throw new Error("Expected to find a document already present for removed");                        // 164
                                                                                                                       //
          self._collection.remove(mongoId);                                                                            // 166
        } else if (msg.msg === 'changed') {                                                                            // 167
          if (!doc) throw new Error("Expected to find a document to change");                                          // 168
                                                                                                                       //
          if (!_.isEmpty(msg.fields)) {                                                                                // 170
            var modifier = {};                                                                                         // 171
                                                                                                                       //
            _.each(msg.fields, function (value, key) {                                                                 // 172
              if (value === undefined) {                                                                               // 173
                if (!modifier.$unset) modifier.$unset = {};                                                            // 174
                modifier.$unset[key] = 1;                                                                              // 176
              } else {                                                                                                 // 177
                if (!modifier.$set) modifier.$set = {};                                                                // 178
                modifier.$set[key] = value;                                                                            // 180
              }                                                                                                        // 181
            });                                                                                                        // 182
                                                                                                                       //
            self._collection.update(mongoId, modifier);                                                                // 183
          }                                                                                                            // 184
        } else {                                                                                                       // 185
          throw new Error("I don't know how to deal with this message");                                               // 186
        }                                                                                                              // 187
      },                                                                                                               // 189
      // Called at the end of a batch of updates.                                                                      // 191
      endUpdate: function () {                                                                                         // 192
        self._collection.resumeObservers();                                                                            // 193
      },                                                                                                               // 194
      // Called around method stub invocations to capture the original versions                                        // 196
      // of modified documents.                                                                                        // 197
      saveOriginals: function () {                                                                                     // 198
        self._collection.saveOriginals();                                                                              // 199
      },                                                                                                               // 200
      retrieveOriginals: function () {                                                                                 // 201
        return self._collection.retrieveOriginals();                                                                   // 202
      },                                                                                                               // 203
      // Used to preserve current versions of documents across a store reset.                                          // 205
      getDoc: function (id) {                                                                                          // 206
        return self.findOne(id);                                                                                       // 207
      },                                                                                                               // 208
      // To be able to get back to the collection from the store.                                                      // 210
      _getCollection: function () {                                                                                    // 211
        return self;                                                                                                   // 212
      }                                                                                                                // 213
    });                                                                                                                // 113
                                                                                                                       //
    if (!ok) {                                                                                                         // 216
      var message = "There is already a collection named \"" + name + "\"";                                            // 217
                                                                                                                       //
      if (options._suppressSameNameError === true) {                                                                   // 218
        // XXX In theory we do not have to throw when `ok` is falsy. The store is already defined                      // 219
        // for this collection name, but this will simply be another reference to it and everything                    // 220
        // should work. However, we have historically thrown an error here, so for now we will                         // 221
        // skip the error only when `_suppressSameNameError` is `true`, allowing people to opt in                      // 222
        // and give this some real world testing.                                                                      // 223
        console.warn ? console.warn(message) : console.log(message);                                                   // 224
      } else {                                                                                                         // 225
        throw new Error(message);                                                                                      // 226
      }                                                                                                                // 227
    }                                                                                                                  // 228
  } // XXX don't define these until allow or deny is actually used for this                                            // 229
  // collection. Could be hard if the security rules are only defined on the                                           // 232
  // server.                                                                                                           // 233
                                                                                                                       //
                                                                                                                       //
  if (options.defineMutationMethods !== false) {                                                                       // 234
    try {                                                                                                              // 235
      self._defineMutationMethods({                                                                                    // 236
        useExisting: options._suppressSameNameError === true                                                           // 236
      });                                                                                                              // 236
    } catch (error) {                                                                                                  // 237
      // Throw a more understandable error on the server for same collection name                                      // 238
      if (error.message === "A method named '/" + name + "/insert' is already defined") throw new Error("There is already a collection named \"" + name + "\"");
      throw error;                                                                                                     // 241
    }                                                                                                                  // 242
  } // autopublish                                                                                                     // 243
                                                                                                                       //
                                                                                                                       //
  if (Package.autopublish && !options._preventAutopublish && self._connection && self._connection.publish) {           // 246
    self._connection.publish(null, function () {                                                                       // 247
      return self.find();                                                                                              // 248
    }, {                                                                                                               // 249
      is_auto: true                                                                                                    // 249
    });                                                                                                                // 249
  }                                                                                                                    // 250
}; ///                                                                                                                 // 251
/// Main collection API                                                                                                // 254
///                                                                                                                    // 255
                                                                                                                       //
                                                                                                                       //
_.extend(Mongo.Collection.prototype, {                                                                                 // 258
  _getFindSelector: function (args) {                                                                                  // 260
    if (args.length == 0) return {};else return args[0];                                                               // 261
  },                                                                                                                   // 265
  _getFindOptions: function (args) {                                                                                   // 267
    var self = this;                                                                                                   // 268
                                                                                                                       //
    if (args.length < 2) {                                                                                             // 269
      return {                                                                                                         // 270
        transform: self._transform                                                                                     // 270
      };                                                                                                               // 270
    } else {                                                                                                           // 271
      check(args[1], Match.Optional(Match.ObjectIncluding({                                                            // 272
        fields: Match.Optional(Match.OneOf(Object, undefined)),                                                        // 273
        sort: Match.Optional(Match.OneOf(Object, Array, Function, undefined)),                                         // 274
        limit: Match.Optional(Match.OneOf(Number, undefined)),                                                         // 275
        skip: Match.Optional(Match.OneOf(Number, undefined))                                                           // 276
      })));                                                                                                            // 272
      return _.extend({                                                                                                // 279
        transform: self._transform                                                                                     // 280
      }, args[1]);                                                                                                     // 279
    }                                                                                                                  // 282
  },                                                                                                                   // 283
  /**                                                                                                                  // 285
   * @summary Find the documents in a collection that match the selector.                                              //
   * @locus Anywhere                                                                                                   //
   * @method find                                                                                                      //
   * @memberOf Mongo.Collection                                                                                        //
   * @instance                                                                                                         //
   * @param {MongoSelector} [selector] A query describing the documents to find                                        //
   * @param {Object} [options]                                                                                         //
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)                                      //
   * @param {Number} options.skip Number of results to skip at the beginning                                           //
   * @param {Number} options.limit Maximum number of results to return                                                 //
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.                            //
   * @param {Boolean} options.reactive (Client only) Default `true`; pass `false` to disable reactivity                //
   * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @param {Boolean} options.disableOplog (Server only) Pass true to disable oplog-tailing on this query. This affects the way server processes calls to `observe` on this query. Disabling the oplog can be useful when working with data that updates in large batches.
   * @param {Number} options.pollingIntervalMs (Server only) When oplog is disabled (through the use of `disableOplog` or when otherwise not available), the frequency (in milliseconds) of how often to poll this query when observing on the server. Defaults to 10000ms (10 seconds).
   * @param {Number} options.pollingThrottleMs (Server only) When oplog is disabled (through the use of `disableOplog` or when otherwise not available), the minimum time (in milliseconds) to allow between re-polling when observing on the server. Increasing this will save CPU and mongo load at the expense of slower updates to users. Decreasing this is not recommended. Defaults to 50ms.
   * @param {Number} options.maxTimeMs (Server only) If set, instructs MongoDB to set a time limit for this cursor's operations. If the operation reaches the specified time limit (in milliseconds) without the having been completed, an exception will be thrown. Useful to prevent an (accidental or malicious) unoptimized query from causing a full collection scan that would disrupt other database users, at the expense of needing to handle the resulting error.
   * @param {String|Object} options.hint (Server only) Overrides MongoDB's default index selection and query optimization process. Specify an index to force its use, either by its name or index specification. You can also specify `{ $natural : 1 }` to force a forwards collection scan, or `{ $natural : -1 }` for a reverse collection scan. Setting this is only recommended for advanced users.
   * @returns {Mongo.Cursor}                                                                                           //
   */find: function () /* selector, options */{                                                                        //
    // Collection.find() (return all docs) behaves differently                                                         // 307
    // from Collection.find(undefined) (return 0 docs).  so be                                                         // 308
    // careful about the length of arguments.                                                                          // 309
    var self = this;                                                                                                   // 310
                                                                                                                       //
    var argArray = _.toArray(arguments);                                                                               // 311
                                                                                                                       //
    return self._collection.find(self._getFindSelector(argArray), self._getFindOptions(argArray));                     // 312
  },                                                                                                                   // 314
  /**                                                                                                                  // 316
   * @summary Finds the first document that matches the selector, as ordered by sort and skip options. Returns `undefined` if no matching document is found.
   * @locus Anywhere                                                                                                   //
   * @method findOne                                                                                                   //
   * @memberOf Mongo.Collection                                                                                        //
   * @instance                                                                                                         //
   * @param {MongoSelector} [selector] A query describing the documents to find                                        //
   * @param {Object} [options]                                                                                         //
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)                                      //
   * @param {Number} options.skip Number of results to skip at the beginning                                           //
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.                            //
   * @param {Boolean} options.reactive (Client only) Default true; pass false to disable reactivity                    //
   * @param {Function} options.transform Overrides `transform` on the [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @returns {Object}                                                                                                 //
   */findOne: function () /* selector, options */{                                                                     //
    var self = this;                                                                                                   // 332
                                                                                                                       //
    var argArray = _.toArray(arguments);                                                                               // 333
                                                                                                                       //
    return self._collection.findOne(self._getFindSelector(argArray), self._getFindOptions(argArray));                  // 334
  }                                                                                                                    // 336
});                                                                                                                    // 258
                                                                                                                       //
Mongo.Collection._publishCursor = function (cursor, sub, collection) {                                                 // 340
  var observeHandle = cursor.observeChanges({                                                                          // 341
    added: function (id, fields) {                                                                                     // 342
      sub.added(collection, id, fields);                                                                               // 343
    },                                                                                                                 // 344
    changed: function (id, fields) {                                                                                   // 345
      sub.changed(collection, id, fields);                                                                             // 346
    },                                                                                                                 // 347
    removed: function (id) {                                                                                           // 348
      sub.removed(collection, id);                                                                                     // 349
    }                                                                                                                  // 350
  }); // We don't call sub.ready() here: it gets called in livedata_server, after                                      // 341
  // possibly calling _publishCursor on multiple returned cursors.                                                     // 354
  // register stop callback (expects lambda w/ no args).                                                               // 356
                                                                                                                       //
  sub.onStop(function () {                                                                                             // 357
    observeHandle.stop();                                                                                              // 357
  }); // return the observeHandle in case it needs to be stopped early                                                 // 357
                                                                                                                       //
  return observeHandle;                                                                                                // 360
}; // protect against dangerous selectors.  falsey and {_id: falsey} are both                                          // 361
// likely programmer error, and not what you want, particularly for destructive                                        // 364
// operations. If a falsey _id is sent in, a new string _id will be                                                    // 365
// generated and returned; if a fallbackId is provided, it will be returned                                            // 366
// instead.                                                                                                            // 367
                                                                                                                       //
                                                                                                                       //
Mongo.Collection._rewriteSelector = function (selector) {                                                              // 368
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},                                   // 368
      fallbackId = _ref.fallbackId;                                                                                    // 368
                                                                                                                       //
  // shorthand -- scalars match _id                                                                                    // 369
  if (LocalCollection._selectorIsId(selector)) selector = {                                                            // 370
    _id: selector                                                                                                      // 371
  };                                                                                                                   // 371
                                                                                                                       //
  if (_.isArray(selector)) {                                                                                           // 373
    // This is consistent with the Mongo console itself; if we don't do this                                           // 374
    // check passing an empty array ends up selecting all items                                                        // 375
    throw new Error("Mongo selector can't be an array.");                                                              // 376
  }                                                                                                                    // 377
                                                                                                                       //
  if (!selector || '_id' in selector && !selector._id) {                                                               // 379
    // can't match anything                                                                                            // 380
    return {                                                                                                           // 381
      _id: fallbackId || Random.id()                                                                                   // 381
    };                                                                                                                 // 381
  }                                                                                                                    // 382
                                                                                                                       //
  return selector;                                                                                                     // 384
}; // 'insert' immediately returns the inserted document's new _id.                                                    // 385
// The others return values immediately if you are in a stub, an in-memory                                             // 388
// unmanaged collection, or a mongo-backed collection and you don't pass a                                             // 389
// callback. 'update' and 'remove' return the number of affected                                                       // 390
// documents. 'upsert' returns an object with keys 'numberAffected' and, if an                                         // 391
// insert happened, 'insertedId'.                                                                                      // 392
//                                                                                                                     // 393
// Otherwise, the semantics are exactly like other methods: they take                                                  // 394
// a callback as an optional last argument; if no callback is                                                          // 395
// provided, they block until the operation is complete, and throw an                                                  // 396
// exception if it fails; if a callback is provided, then they don't                                                   // 397
// necessarily block, and they call the callback when they finish with error and                                       // 398
// result arguments.  (The insert method provides the document ID as its result;                                       // 399
// update and remove provide the number of affected docs as the result; upsert                                         // 400
// provides an object with numberAffected and maybe insertedId.)                                                       // 401
//                                                                                                                     // 402
// On the client, blocking is impossible, so if a callback                                                             // 403
// isn't provided, they just return immediately and any error                                                          // 404
// information is lost.                                                                                                // 405
//                                                                                                                     // 406
// There's one more tweak. On the client, if you don't provide a                                                       // 407
// callback, then if there is an error, a message will be logged with                                                  // 408
// Meteor._debug.                                                                                                      // 409
//                                                                                                                     // 410
// The intent (though this is actually determined by the underlying                                                    // 411
// drivers) is that the operations should be done synchronously, not                                                   // 412
// generating their result until the database has acknowledged                                                         // 413
// them. In the future maybe we should provide a flag to turn this                                                     // 414
// off.                                                                                                                // 415
/**                                                                                                                    // 417
 * @summary Insert a document in the collection.  Returns its unique _id.                                              //
 * @locus Anywhere                                                                                                     //
 * @method  insert                                                                                                     //
 * @memberOf Mongo.Collection                                                                                          //
 * @instance                                                                                                           //
 * @param {Object} doc The document to insert. May not yet have an _id attribute, in which case Meteor will generate one for you.
 * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the _id as the second.
 */                                                                                                                    //
                                                                                                                       //
Mongo.Collection.prototype.insert = function () {                                                                      // 426
  function insert(doc, callback) {                                                                                     // 426
    // Make sure we were passed a document to insert                                                                   // 427
    if (!doc) {                                                                                                        // 428
      throw new Error("insert requires an argument");                                                                  // 429
    } // Shallow-copy the document and possibly generate an ID                                                         // 430
                                                                                                                       //
                                                                                                                       //
    doc = _.extend({}, doc);                                                                                           // 433
                                                                                                                       //
    if ('_id' in doc) {                                                                                                // 435
      if (!doc._id || !(typeof doc._id === 'string' || doc._id instanceof Mongo.ObjectID)) {                           // 436
        throw new Error("Meteor requires document _id fields to be non-empty strings or ObjectIDs");                   // 437
      }                                                                                                                // 438
    } else {                                                                                                           // 439
      var generateId = true; // Don't generate the id if we're the client and the 'outermost' call                     // 440
      // This optimization saves us passing both the randomSeed and the id                                             // 443
      // Passing both is redundant.                                                                                    // 444
                                                                                                                       //
      if (this._isRemoteCollection()) {                                                                                // 445
        var enclosing = DDP._CurrentMethodInvocation.get();                                                            // 446
                                                                                                                       //
        if (!enclosing) {                                                                                              // 447
          generateId = false;                                                                                          // 448
        }                                                                                                              // 449
      }                                                                                                                // 450
                                                                                                                       //
      if (generateId) {                                                                                                // 452
        doc._id = this._makeNewID();                                                                                   // 453
      }                                                                                                                // 454
    } // On inserts, always return the id that we generated; on all other                                              // 455
    // operations, just return the result from the collection.                                                         // 458
                                                                                                                       //
                                                                                                                       //
    var chooseReturnValueFromCollectionResult = function (result) {                                                    // 459
      if (doc._id) {                                                                                                   // 460
        return doc._id;                                                                                                // 461
      } // XXX what is this for??                                                                                      // 462
      // It's some iteraction between the callback to _callMutatorMethod and                                           // 465
      // the return value conversion                                                                                   // 466
                                                                                                                       //
                                                                                                                       //
      doc._id = result;                                                                                                // 467
      return result;                                                                                                   // 469
    };                                                                                                                 // 470
                                                                                                                       //
    var wrappedCallback = wrapCallback(callback, chooseReturnValueFromCollectionResult);                               // 472
                                                                                                                       //
    if (this._isRemoteCollection()) {                                                                                  // 474
      var result = this._callMutatorMethod("insert", [doc], wrappedCallback);                                          // 475
                                                                                                                       //
      return chooseReturnValueFromCollectionResult(result);                                                            // 476
    } // it's my collection.  descend into the collection object                                                       // 477
    // and propagate any exception.                                                                                    // 480
                                                                                                                       //
                                                                                                                       //
    try {                                                                                                              // 481
      // If the user provided a callback and the collection implements this                                            // 482
      // operation asynchronously, then queryRet will be undefined, and the                                            // 483
      // result will be returned through the callback instead.                                                         // 484
      var _result = this._collection.insert(doc, wrappedCallback);                                                     // 485
                                                                                                                       //
      return chooseReturnValueFromCollectionResult(_result);                                                           // 486
    } catch (e) {                                                                                                      // 487
      if (callback) {                                                                                                  // 488
        callback(e);                                                                                                   // 489
        return null;                                                                                                   // 490
      }                                                                                                                // 491
                                                                                                                       //
      throw e;                                                                                                         // 492
    }                                                                                                                  // 493
  }                                                                                                                    // 494
                                                                                                                       //
  return insert;                                                                                                       // 426
}(); /**                                                                                                               // 426
      * @summary Modify one or more documents in the collection. Returns the number of matched documents.              //
      * @locus Anywhere                                                                                                //
      * @method update                                                                                                 //
      * @memberOf Mongo.Collection                                                                                     //
      * @instance                                                                                                      //
      * @param {MongoSelector} selector Specifies which documents to modify                                            //
      * @param {MongoModifier} modifier Specifies how to modify the documents                                          //
      * @param {Object} [options]                                                                                      //
      * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
      * @param {Boolean} options.upsert True to insert a document if no matching documents are found.                  //
      * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
      */                                                                                                               //
                                                                                                                       //
Mongo.Collection.prototype.update = function () {                                                                      // 509
  function update(selector, modifier) {                                                                                // 509
    for (var _len = arguments.length, optionsAndCallback = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      optionsAndCallback[_key - 2] = arguments[_key];                                                                  // 509
    }                                                                                                                  // 509
                                                                                                                       //
    var callback = popCallbackFromArgs(optionsAndCallback); // We've already popped off the callback, so we are left with an array
    // of one or zero items                                                                                            // 513
                                                                                                                       //
    var options = _.clone(optionsAndCallback[0]) || {};                                                                // 514
    var insertedId = void 0;                                                                                           // 515
                                                                                                                       //
    if (options && options.upsert) {                                                                                   // 516
      // set `insertedId` if absent.  `insertedId` is a Meteor extension.                                              // 517
      if (options.insertedId) {                                                                                        // 518
        if (!(typeof options.insertedId === 'string' || options.insertedId instanceof Mongo.ObjectID)) throw new Error("insertedId must be string or ObjectID");
        insertedId = options.insertedId;                                                                               // 521
      } else if (!selector || !selector._id) {                                                                         // 522
        insertedId = this._makeNewID();                                                                                // 523
        options.generatedId = true;                                                                                    // 524
        options.insertedId = insertedId;                                                                               // 525
      }                                                                                                                // 526
    }                                                                                                                  // 527
                                                                                                                       //
    selector = Mongo.Collection._rewriteSelector(selector, {                                                           // 529
      fallbackId: insertedId                                                                                           // 530
    });                                                                                                                // 530
    var wrappedCallback = wrapCallback(callback);                                                                      // 532
                                                                                                                       //
    if (this._isRemoteCollection()) {                                                                                  // 534
      var args = [selector, modifier, options];                                                                        // 535
      return this._callMutatorMethod("update", args, wrappedCallback);                                                 // 541
    } // it's my collection.  descend into the collection object                                                       // 542
    // and propagate any exception.                                                                                    // 545
                                                                                                                       //
                                                                                                                       //
    try {                                                                                                              // 546
      // If the user provided a callback and the collection implements this                                            // 547
      // operation asynchronously, then queryRet will be undefined, and the                                            // 548
      // result will be returned through the callback instead.                                                         // 549
      return this._collection.update(selector, modifier, options, wrappedCallback);                                    // 550
    } catch (e) {                                                                                                      // 552
      if (callback) {                                                                                                  // 553
        callback(e);                                                                                                   // 554
        return null;                                                                                                   // 555
      }                                                                                                                // 556
                                                                                                                       //
      throw e;                                                                                                         // 557
    }                                                                                                                  // 558
  }                                                                                                                    // 559
                                                                                                                       //
  return update;                                                                                                       // 509
}(); /**                                                                                                               // 509
      * @summary Remove documents from the collection                                                                  //
      * @locus Anywhere                                                                                                //
      * @method remove                                                                                                 //
      * @memberOf Mongo.Collection                                                                                     //
      * @instance                                                                                                      //
      * @param {MongoSelector} selector Specifies which documents to remove                                            //
      * @param {Function} [callback] Optional.  If present, called with an error object as its argument.               //
      */                                                                                                               //
                                                                                                                       //
Mongo.Collection.prototype.remove = function () {                                                                      // 570
  function remove(selector, callback) {                                                                                // 570
    selector = Mongo.Collection._rewriteSelector(selector);                                                            // 571
    var wrappedCallback = wrapCallback(callback);                                                                      // 573
                                                                                                                       //
    if (this._isRemoteCollection()) {                                                                                  // 575
      return this._callMutatorMethod("remove", [selector], wrappedCallback);                                           // 576
    } // it's my collection.  descend into the collection object                                                       // 577
    // and propagate any exception.                                                                                    // 580
                                                                                                                       //
                                                                                                                       //
    try {                                                                                                              // 581
      // If the user provided a callback and the collection implements this                                            // 582
      // operation asynchronously, then queryRet will be undefined, and the                                            // 583
      // result will be returned through the callback instead.                                                         // 584
      return this._collection.remove(selector, wrappedCallback);                                                       // 585
    } catch (e) {                                                                                                      // 586
      if (callback) {                                                                                                  // 587
        callback(e);                                                                                                   // 588
        return null;                                                                                                   // 589
      }                                                                                                                // 590
                                                                                                                       //
      throw e;                                                                                                         // 591
    }                                                                                                                  // 592
  }                                                                                                                    // 593
                                                                                                                       //
  return remove;                                                                                                       // 570
}(); // Determine if this collection is simply a minimongo representation of a real                                    // 570
// database on another server                                                                                          // 596
                                                                                                                       //
                                                                                                                       //
Mongo.Collection.prototype._isRemoteCollection = function () {                                                         // 597
  function _isRemoteCollection() {                                                                                     // 597
    // XXX see #MeteorServerNull                                                                                       // 598
    return this._connection && this._connection !== Meteor.server;                                                     // 599
  }                                                                                                                    // 600
                                                                                                                       //
  return _isRemoteCollection;                                                                                          // 597
}(); // Convert the callback to not return a result if there is an error                                               // 597
                                                                                                                       //
                                                                                                                       //
function wrapCallback(callback, convertResult) {                                                                       // 603
  if (!callback) {                                                                                                     // 604
    return;                                                                                                            // 605
  } // If no convert function was passed in, just use a "blank function"                                               // 606
                                                                                                                       //
                                                                                                                       //
  convertResult = convertResult || _.identity;                                                                         // 609
  return function (error, result) {                                                                                    // 611
    callback(error, !error && convertResult(result));                                                                  // 612
  };                                                                                                                   // 613
} /**                                                                                                                  // 614
   * @summary Modify one or more documents in the collection, or insert one if no matching documents were found. Returns an object with keys `numberAffected` (the number of documents modified)  and `insertedId` (the unique _id of the document that was inserted, if any).
   * @locus Anywhere                                                                                                   //
   * @param {MongoSelector} selector Specifies which documents to modify                                               //
   * @param {MongoModifier} modifier Specifies how to modify the documents                                             //
   * @param {Object} [options]                                                                                         //
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
   */                                                                                                                  //
                                                                                                                       //
Mongo.Collection.prototype.upsert = function () {                                                                      // 625
  function upsert(selector, modifier, options, callback) {                                                             // 625
    if (!callback && typeof options === "function") {                                                                  // 627
      callback = options;                                                                                              // 628
      options = {};                                                                                                    // 629
    }                                                                                                                  // 630
                                                                                                                       //
    var updateOptions = _.extend({}, options, {                                                                        // 632
      _returnObject: true,                                                                                             // 633
      upsert: true                                                                                                     // 634
    });                                                                                                                // 632
                                                                                                                       //
    return this.update(selector, modifier, updateOptions, callback);                                                   // 637
  }                                                                                                                    // 638
                                                                                                                       //
  return upsert;                                                                                                       // 625
}(); // We'll actually design an index API later. For now, we just pass through to                                     // 625
// Mongo's, but make it synchronous.                                                                                   // 641
                                                                                                                       //
                                                                                                                       //
Mongo.Collection.prototype._ensureIndex = function (index, options) {                                                  // 642
  var self = this;                                                                                                     // 643
  if (!self._collection._ensureIndex) throw new Error("Can only call _ensureIndex on server collections");             // 644
                                                                                                                       //
  self._collection._ensureIndex(index, options);                                                                       // 646
};                                                                                                                     // 647
                                                                                                                       //
Mongo.Collection.prototype._dropIndex = function (index) {                                                             // 648
  var self = this;                                                                                                     // 649
  if (!self._collection._dropIndex) throw new Error("Can only call _dropIndex on server collections");                 // 650
                                                                                                                       //
  self._collection._dropIndex(index);                                                                                  // 652
};                                                                                                                     // 653
                                                                                                                       //
Mongo.Collection.prototype._dropCollection = function () {                                                             // 654
  var self = this;                                                                                                     // 655
  if (!self._collection.dropCollection) throw new Error("Can only call _dropCollection on server collections");        // 656
                                                                                                                       //
  self._collection.dropCollection();                                                                                   // 658
};                                                                                                                     // 659
                                                                                                                       //
Mongo.Collection.prototype._createCappedCollection = function (byteSize, maxDocuments) {                               // 660
  var self = this;                                                                                                     // 661
  if (!self._collection._createCappedCollection) throw new Error("Can only call _createCappedCollection on server collections");
                                                                                                                       //
  self._collection._createCappedCollection(byteSize, maxDocuments);                                                    // 664
}; /**                                                                                                                 // 665
    * @summary Returns the [`Collection`](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html) object corresponding to this collection from the [npm `mongodb` driver module](https://www.npmjs.com/package/mongodb) which is wrapped by `Mongo.Collection`.
    * @locus Server                                                                                                    //
    */                                                                                                                 //
                                                                                                                       //
Mongo.Collection.prototype.rawCollection = function () {                                                               // 671
  var self = this;                                                                                                     // 672
                                                                                                                       //
  if (!self._collection.rawCollection) {                                                                               // 673
    throw new Error("Can only call rawCollection on server collections");                                              // 674
  }                                                                                                                    // 675
                                                                                                                       //
  return self._collection.rawCollection();                                                                             // 676
}; /**                                                                                                                 // 677
    * @summary Returns the [`Db`](http://mongodb.github.io/node-mongodb-native/2.2/api/Db.html) object corresponding to this collection's database connection from the [npm `mongodb` driver module](https://www.npmjs.com/package/mongodb) which is wrapped by `Mongo.Collection`.
    * @locus Server                                                                                                    //
    */                                                                                                                 //
                                                                                                                       //
Mongo.Collection.prototype.rawDatabase = function () {                                                                 // 683
  var self = this;                                                                                                     // 684
                                                                                                                       //
  if (!(self._driver.mongo && self._driver.mongo.db)) {                                                                // 685
    throw new Error("Can only call rawDatabase on server collections");                                                // 686
  }                                                                                                                    // 687
                                                                                                                       //
  return self._driver.mongo.db;                                                                                        // 688
}; /**                                                                                                                 // 689
    * @summary Create a Mongo-style `ObjectID`.  If you don't specify a `hexString`, the `ObjectID` will generated randomly (not using MongoDB's ID construction rules).
    * @locus Anywhere                                                                                                  //
    * @class                                                                                                           //
    * @param {String} [hexString] Optional.  The 24-character hexadecimal contents of the ObjectID to create           //
    */                                                                                                                 //
                                                                                                                       //
Mongo.ObjectID = MongoID.ObjectID; /**                                                                                 // 698
                                    * @summary To create a cursor, use find. To access the documents in a cursor, use forEach, map, or fetch.
                                    * @class                                                                           //
                                    * @instanceName cursor                                                             //
                                    */                                                                                 //
Mongo.Cursor = LocalCollection.Cursor; /**                                                                             // 705
                                        * @deprecated in 0.9.1                                                         //
                                        */                                                                             //
Mongo.Collection.Cursor = Mongo.Cursor; /**                                                                            // 710
                                         * @deprecated in 0.9.1                                                        //
                                         */                                                                            //
Mongo.Collection.ObjectID = Mongo.ObjectID; /**                                                                        // 715
                                             * @deprecated in 0.9.1                                                    //
                                             */                                                                        //
Meteor.Collection = Mongo.Collection; // Allow deny stuff is now in the allow-deny package                             // 720
                                                                                                                       //
_.extend(Meteor.Collection.prototype, AllowDeny.CollectionPrototype);                                                  // 723
                                                                                                                       //
function popCallbackFromArgs(args) {                                                                                   // 725
  // Pull off any callback (or perhaps a 'callback' variable that was passed                                           // 726
  // in undefined, like how 'upsert' does it).                                                                         // 727
  if (args.length && (args[args.length - 1] === undefined || args[args.length - 1] instanceof Function)) {             // 728
    return args.pop();                                                                                                 // 731
  }                                                                                                                    // 732
}                                                                                                                      // 733
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"connection_options.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/connection_options.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**                                                                                                                    // 1
 * @summary Allows for user specified connection options                                                               //
 * @example http://mongodb.github.io/node-mongodb-native/2.2/reference/connecting/connection-settings/                 //
 * @locus Server                                                                                                       //
 * @param {Object} options User specified Mongo connection options                                                     //
 */Mongo.setConnectionOptions = function () {                                                                          //
  function setConnectionOptions(options) {                                                                             // 7
    check(options, Object);                                                                                            // 8
    Mongo._connectionOptions = options;                                                                                // 9
  }                                                                                                                    // 10
                                                                                                                       //
  return setConnectionOptions;                                                                                         // 7
}();                                                                                                                   // 7
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("./node_modules/meteor/mongo/mongo_driver.js");
require("./node_modules/meteor/mongo/oplog_tailing.js");
require("./node_modules/meteor/mongo/observe_multiplex.js");
require("./node_modules/meteor/mongo/doc_fetcher.js");
require("./node_modules/meteor/mongo/polling_observe_driver.js");
require("./node_modules/meteor/mongo/oplog_observe_driver.js");
require("./node_modules/meteor/mongo/local_collection_driver.js");
require("./node_modules/meteor/mongo/remote_collection_driver.js");
require("./node_modules/meteor/mongo/collection.js");
require("./node_modules/meteor/mongo/connection_options.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.mongo = {}, {
  MongoInternals: MongoInternals,
  MongoTest: MongoTest,
  Mongo: Mongo
});

})();

//# sourceMappingURL=mongo.js.map

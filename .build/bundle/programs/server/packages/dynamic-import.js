(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

var require = meteorInstall({"node_modules":{"meteor":{"dynamic-import":{"server.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/dynamic-import/server.js                                                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");                                   //
                                                                                                                //
var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);                                          //
                                                                                                                //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                         //
                                                                                                                //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                //
                                                                                                                //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }               //
                                                                                                                //
var module1 = module;                                                                                           // 1
var assert = void 0;                                                                                            // 1
module1.watch(require("assert"), {                                                                              // 1
  "default": function (v) {                                                                                     // 1
    assert = v;                                                                                                 // 1
  }                                                                                                             // 1
}, 0);                                                                                                          // 1
var readFileSync = void 0;                                                                                      // 1
module1.watch(require("fs"), {                                                                                  // 1
  readFileSync: function (v) {                                                                                  // 1
    readFileSync = v;                                                                                           // 1
  }                                                                                                             // 1
}, 1);                                                                                                          // 1
var pathJoin = void 0,                                                                                          // 1
    pathNormalize = void 0;                                                                                     // 1
module1.watch(require("path"), {                                                                                // 1
  join: function (v) {                                                                                          // 1
    pathJoin = v;                                                                                               // 1
  },                                                                                                            // 1
  normalize: function (v) {                                                                                     // 1
    pathNormalize = v;                                                                                          // 1
  }                                                                                                             // 1
}, 2);                                                                                                          // 1
var check = void 0;                                                                                             // 1
module1.watch(require("meteor/check"), {                                                                        // 1
  check: function (v) {                                                                                         // 1
    check = v;                                                                                                  // 1
  }                                                                                                             // 1
}, 3);                                                                                                          // 1
module1.watch(require("./security.js"));                                                                        // 1
module1.watch(require("./client.js"));                                                                          // 1
var hasOwn = Object.prototype.hasOwnProperty;                                                                   // 13
Object.keys(dynamicImportInfo).forEach(function (platform) {                                                    // 15
  var info = dynamicImportInfo[platform];                                                                       // 16
                                                                                                                //
  if (info.dynamicRoot) {                                                                                       // 17
    info.dynamicRoot = pathNormalize(info.dynamicRoot);                                                         // 18
  }                                                                                                             // 19
});                                                                                                             // 20
Meteor.methods({                                                                                                // 22
  __dynamicImport: function (tree) {                                                                            // 23
    check(tree, Object);                                                                                        // 24
    this.unblock();                                                                                             // 25
    var platform = this.connection ? "web.browser" : "server";                                                  // 27
    var pathParts = [];                                                                                         // 28
                                                                                                                //
    function walk(node) {                                                                                       // 30
      if (node && (typeof node === "undefined" ? "undefined" : (0, _typeof3.default)(node)) === "object") {     // 31
        Object.keys(node).forEach(function (name) {                                                             // 32
          pathParts.push(name);                                                                                 // 33
          node[name] = walk(node[name]);                                                                        // 34
          assert.strictEqual(pathParts.pop(), name);                                                            // 35
        });                                                                                                     // 36
      } else {                                                                                                  // 37
        return read(pathParts, platform);                                                                       // 38
      }                                                                                                         // 39
                                                                                                                //
      return node;                                                                                              // 40
    }                                                                                                           // 41
                                                                                                                //
    return walk(tree);                                                                                          // 43
  }                                                                                                             // 44
});                                                                                                             // 22
                                                                                                                //
function read(pathParts, platform) {                                                                            // 47
  var dynamicRoot = dynamicImportInfo[platform].dynamicRoot;                                                    // 47
  var absPath = pathNormalize(pathJoin(dynamicRoot, pathJoin.apply(undefined, (0, _toConsumableArray3.default)(pathParts)).replace(/:/g, "_")));
                                                                                                                //
  if (!absPath.startsWith(dynamicRoot)) {                                                                       // 54
    throw new Meteor.Error("bad dynamic module path");                                                          // 55
  }                                                                                                             // 56
                                                                                                                //
  var cache = getCache(platform);                                                                               // 58
  return hasOwn.call(cache, absPath) ? cache[absPath] : cache[absPath] = readFileSync(absPath, "utf8");         // 59
}                                                                                                               // 62
                                                                                                                //
var cachesByPlatform = Object.create(null);                                                                     // 64
                                                                                                                //
function getCache(platform) {                                                                                   // 65
  return hasOwn.call(cachesByPlatform, platform) ? cachesByPlatform[platform] : cachesByPlatform[platform] = Object.create(null);
}                                                                                                               // 69
                                                                                                                //
process.on("message", function (msg) {                                                                          // 71
  // The cache for the "web.browser" platform needs to be discarded                                             // 72
  // whenever a client-only refresh occurs, so that new client code does                                        // 73
  // not receive stale module data from __dynamicImport. This code handles                                      // 74
  // the same message listened for by the autoupdate package.                                                   // 75
  if (msg && msg.refresh === "client") {                                                                        // 76
    delete cachesByPlatform["web.browser"];                                                                     // 77
  }                                                                                                             // 78
});                                                                                                             // 79
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cache.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/dynamic-import/cache.js                                                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
var hasOwn = Object.prototype.hasOwnProperty;                                                                   // 1
var dbPromise;                                                                                                  // 2
var canUseCache = // The server doesn't benefit from dynamic module fetching, and almost                        // 4
// certainly doesn't support IndexedDB.                                                                         // 6
Meteor.isClient && // Cordova bundles all modules into the monolithic initial bundle, so                        // 7
// the dynamic module cache won't be necessary.                                                                 // 9
!Meteor.isCordova && // Caching can be confusing in development, and is designed to be a                        // 10
// transparent optimization for production performance.                                                         // 12
Meteor.isProduction;                                                                                            // 13
                                                                                                                //
function getIDB() {                                                                                             // 15
  if (typeof indexedDB !== "undefined") return indexedDB;                                                       // 16
  if (typeof webkitIndexedDB !== "undefined") return webkitIndexedDB;                                           // 17
  if (typeof mozIndexedDB !== "undefined") return mozIndexedDB;                                                 // 18
  if (typeof OIndexedDB !== "undefined") return OIndexedDB;                                                     // 19
  if (typeof msIndexedDB !== "undefined") return msIndexedDB;                                                   // 20
}                                                                                                               // 21
                                                                                                                //
function withDB(callback) {                                                                                     // 23
  dbPromise = dbPromise || new Promise(function (resolve, reject) {                                             // 24
    var idb = getIDB();                                                                                         // 25
                                                                                                                //
    if (!idb) {                                                                                                 // 26
      throw new Error("IndexedDB not available");                                                               // 27
    } // Incrementing the version number causes all existing object stores                                      // 28
    // to be deleted and recreates those specified by objectStoreMap.                                           // 31
                                                                                                                //
                                                                                                                //
    var request = idb.open("MeteorDynamicImportCache", 2);                                                      // 32
                                                                                                                //
    request.onupgradeneeded = function (event) {                                                                // 34
      var db = event.target.result; // It's fine to delete existing object stores since onupgradeneeded         // 35
      // is only called when we change the DB version number, and the data                                      // 38
      // we're storing is disposable/reconstructible.                                                           // 39
                                                                                                                //
      Array.from(db.objectStoreNames).forEach(db.deleteObjectStore, db);                                        // 40
      Object.keys(objectStoreMap).forEach(function (name) {                                                     // 42
        db.createObjectStore(name, objectStoreMap[name]);                                                       // 43
      });                                                                                                       // 44
    };                                                                                                          // 45
                                                                                                                //
    request.onerror = makeOnError(reject, "indexedDB.open");                                                    // 47
                                                                                                                //
    request.onsuccess = function (event) {                                                                      // 48
      resolve(event.target.result);                                                                             // 49
    };                                                                                                          // 50
  });                                                                                                           // 51
  return dbPromise.then(callback, function (error) {                                                            // 53
    return callback(null);                                                                                      // 54
  });                                                                                                           // 55
}                                                                                                               // 56
                                                                                                                //
var objectStoreMap = {                                                                                          // 58
  sourcesByVersion: {                                                                                           // 59
    keyPath: "version"                                                                                          // 59
  }                                                                                                             // 59
};                                                                                                              // 58
                                                                                                                //
function makeOnError(reject, source) {                                                                          // 62
  return function (event) {                                                                                     // 63
    reject(new Error("IndexedDB failure in " + source + " " + JSON.stringify(event.target))); // Returning true from an onerror callback function prevents an
    // InvalidStateError in Firefox during Private Browsing. Silencing                                          // 70
    // that error is safe because we handle the error more gracefully by                                        // 71
    // passing it to the Promise reject function above.                                                         // 72
    // https://github.com/meteor/meteor/issues/8697                                                             // 73
                                                                                                                //
    return true;                                                                                                // 74
  };                                                                                                            // 75
}                                                                                                               // 76
                                                                                                                //
var checkCount = 0;                                                                                             // 78
                                                                                                                //
exports.checkMany = function (versions) {                                                                       // 80
  var ids = Object.keys(versions);                                                                              // 81
  var sourcesById = Object.create(null); // Initialize sourcesById with null values to indicate all sources are
  // missing (unless replaced with actual sources below).                                                       // 85
                                                                                                                //
  ids.forEach(function (id) {                                                                                   // 86
    sourcesById[id] = null;                                                                                     // 87
  });                                                                                                           // 88
                                                                                                                //
  if (!canUseCache) {                                                                                           // 90
    return Promise.resolve(sourcesById);                                                                        // 91
  }                                                                                                             // 92
                                                                                                                //
  return withDB(function (db) {                                                                                 // 94
    if (!db) {                                                                                                  // 95
      // We thought we could used IndexedDB, but something went wrong                                           // 96
      // while opening the database, so err on the side of safety.                                              // 97
      return sourcesById;                                                                                       // 98
    }                                                                                                           // 99
                                                                                                                //
    var txn = db.transaction(["sourcesByVersion"], "readonly");                                                 // 101
    var sourcesByVersion = txn.objectStore("sourcesByVersion");                                                 // 105
    ++checkCount;                                                                                               // 107
                                                                                                                //
    function finish() {                                                                                         // 109
      --checkCount;                                                                                             // 110
      return sourcesById;                                                                                       // 111
    }                                                                                                           // 112
                                                                                                                //
    return Promise.all(ids.map(function (id) {                                                                  // 114
      return new Promise(function (resolve, reject) {                                                           // 115
        var version = versions[id];                                                                             // 116
                                                                                                                //
        if (version) {                                                                                          // 117
          var sourceRequest = sourcesByVersion.get(versions[id]);                                               // 118
          sourceRequest.onerror = makeOnError(reject, "sourcesByVersion.get");                                  // 119
                                                                                                                //
          sourceRequest.onsuccess = function (event) {                                                          // 120
            var result = event.target.result;                                                                   // 121
                                                                                                                //
            if (result) {                                                                                       // 122
              sourcesById[id] = result.source;                                                                  // 123
            }                                                                                                   // 124
                                                                                                                //
            resolve();                                                                                          // 125
          };                                                                                                    // 126
        } else resolve();                                                                                       // 127
      });                                                                                                       // 128
    })).then(finish, finish);                                                                                   // 129
  });                                                                                                           // 130
};                                                                                                              // 131
                                                                                                                //
var pendingVersionsAndSourcesById = Object.create(null);                                                        // 133
                                                                                                                //
exports.setMany = function (versionsAndSourcesById) {                                                           // 135
  if (canUseCache) {                                                                                            // 136
    Object.assign(pendingVersionsAndSourcesById, versionsAndSourcesById); // Delay the call to flushSetMany so that it doesn't contribute to the
    // amount of time it takes to call module.dynamicImport.                                                    // 143
                                                                                                                //
    if (!flushSetMany.timer) {                                                                                  // 144
      flushSetMany.timer = setTimeout(flushSetMany, 100);                                                       // 145
    }                                                                                                           // 146
  }                                                                                                             // 147
};                                                                                                              // 148
                                                                                                                //
function flushSetMany() {                                                                                       // 150
  if (checkCount > 0) {                                                                                         // 151
    // If checkMany is currently underway, postpone the flush until later,                                      // 152
    // since updating the cache is less important than reading from it.                                         // 153
    return flushSetMany.timer = setTimeout(flushSetMany, 100);                                                  // 154
  }                                                                                                             // 155
                                                                                                                //
  flushSetMany.timer = null;                                                                                    // 157
  var versionsAndSourcesById = pendingVersionsAndSourcesById;                                                   // 159
  pendingVersionsAndSourcesById = Object.create(null);                                                          // 160
  return withDB(function (db) {                                                                                 // 162
    if (!db) {                                                                                                  // 163
      // We thought we could used IndexedDB, but something went wrong                                           // 164
      // while opening the database, so err on the side of safety.                                              // 165
      return;                                                                                                   // 166
    }                                                                                                           // 167
                                                                                                                //
    var setTxn = db.transaction(["sourcesByVersion"], "readwrite");                                             // 169
    var sourcesByVersion = setTxn.objectStore("sourcesByVersion");                                              // 173
    return Promise.all(Object.keys(versionsAndSourcesById).map(function (id) {                                  // 175
      var info = versionsAndSourcesById[id];                                                                    // 177
      return new Promise(function (resolve, reject) {                                                           // 178
        var request = sourcesByVersion.put({                                                                    // 179
          version: info.version,                                                                                // 180
          source: info.source                                                                                   // 181
        });                                                                                                     // 179
        request.onerror = makeOnError(reject, "sourcesByVersion.put");                                          // 183
        request.onsuccess = resolve;                                                                            // 184
      });                                                                                                       // 185
    }));                                                                                                        // 186
  });                                                                                                           // 188
}                                                                                                               // 189
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"client.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/dynamic-import/client.js                                                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                         //
                                                                                                                //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                //
                                                                                                                //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }               //
                                                                                                                //
var Module = module.constructor;                                                                                // 1
                                                                                                                //
var cache = require("./cache.js"); // Call module.dynamicImport(id) to fetch a module and any/all of its        // 2
// dependencies that have not already been fetched, and evaluate them as                                        // 5
// soon as they arrive. This runtime API makes it very easy to implement                                        // 6
// ECMAScript dynamic import(...) syntax.                                                                       // 7
                                                                                                                //
                                                                                                                //
Module.prototype.dynamicImport = function (id) {                                                                // 8
  var module = this;                                                                                            // 9
  return module.prefetch(id).then(function () {                                                                 // 10
    return getNamespace(module, id);                                                                            // 11
  });                                                                                                           // 12
}; // Called by Module.prototype.prefetch if there are any missing dynamic                                      // 13
// modules that need to be fetched.                                                                             // 16
                                                                                                                //
                                                                                                                //
meteorInstall.fetch = function (ids) {                                                                          // 17
  var tree = Object.create(null);                                                                               // 18
  var versions = Object.create(null);                                                                           // 19
                                                                                                                //
  var dynamicVersions = require("./dynamic-versions.js");                                                       // 20
                                                                                                                //
  var missing;                                                                                                  // 21
  Object.keys(ids).forEach(function (id) {                                                                      // 23
    var version = getFromTree(dynamicVersions, id);                                                             // 24
                                                                                                                //
    if (version) {                                                                                              // 25
      versions[id] = version;                                                                                   // 26
    } else {                                                                                                    // 27
      addToTree(missing = missing || Object.create(null), id, 1);                                               // 28
    }                                                                                                           // 29
  });                                                                                                           // 30
  return cache.checkMany(versions).then(function (sources) {                                                    // 32
    Object.keys(sources).forEach(function (id) {                                                                // 33
      var source = sources[id];                                                                                 // 34
                                                                                                                //
      if (source) {                                                                                             // 35
        var info = ids[id];                                                                                     // 36
        addToTree(tree, id, makeModuleFunction(id, source, info.options));                                      // 37
      } else {                                                                                                  // 38
        addToTree(missing = missing || Object.create(null), id, 1);                                             // 39
      }                                                                                                         // 40
    });                                                                                                         // 41
    return missing && fetchMissing(missing).then(function (results) {                                           // 43
      var versionsAndSourcesById = Object.create(null);                                                         // 44
      var flatResults = flattenModuleTree(results);                                                             // 45
      Object.keys(flatResults).forEach(function (id) {                                                          // 47
        var source = flatResults[id];                                                                           // 48
        var info = ids[id];                                                                                     // 49
        addToTree(tree, id, makeModuleFunction(id, source, info.options));                                      // 51
        var version = getFromTree(dynamicVersions, id);                                                         // 53
                                                                                                                //
        if (version) {                                                                                          // 54
          versionsAndSourcesById[id] = {                                                                        // 55
            version: version,                                                                                   // 56
            source: source                                                                                      // 57
          };                                                                                                    // 55
        }                                                                                                       // 59
      });                                                                                                       // 60
      cache.setMany(versionsAndSourcesById);                                                                    // 62
    });                                                                                                         // 63
  }).then(function () {                                                                                         // 65
    return tree;                                                                                                // 66
  });                                                                                                           // 67
};                                                                                                              // 68
                                                                                                                //
function flattenModuleTree(tree) {                                                                              // 70
  var parts = [""];                                                                                             // 71
  var result = Object.create(null);                                                                             // 72
                                                                                                                //
  function walk(t) {                                                                                            // 74
    if (t && (typeof t === "undefined" ? "undefined" : (0, _typeof3.default)(t)) === "object") {                // 75
      Object.keys(t).forEach(function (key) {                                                                   // 76
        parts.push(key);                                                                                        // 77
        walk(t[key]);                                                                                           // 78
        parts.pop();                                                                                            // 79
      });                                                                                                       // 80
    } else if (typeof t === "string") {                                                                         // 81
      result[parts.join("/")] = t;                                                                              // 82
    }                                                                                                           // 83
  }                                                                                                             // 84
                                                                                                                //
  walk(tree);                                                                                                   // 86
  return result;                                                                                                // 88
}                                                                                                               // 89
                                                                                                                //
function makeModuleFunction(id, source, options) {                                                              // 91
  // By calling (options && options.eval || eval) in a wrapper function,                                        // 92
  // we delay the cost of parsing and evaluating the module code until the                                      // 93
  // module is first imported.                                                                                  // 94
  return function () {                                                                                          // 95
    // If an options.eval function was provided in the second argument to                                       // 96
    // meteorInstall when this bundle was first installed, use that                                             // 97
    // function to parse and evaluate the dynamic module code in the scope                                      // 98
    // of the package. Otherwise fall back to indirect (global) eval.                                           // 99
    return (options && options.eval || eval)( // Wrap the function(require,exports,module){...} expression in   // 100
    // parentheses to force it to be parsed as an expression.                                                   // 102
    "(" + source + ")\n//# sourceURL=" + id).apply(this, arguments);                                            // 103
  };                                                                                                            // 105
}                                                                                                               // 106
                                                                                                                //
function fetchMissing(missingTree) {                                                                            // 108
  // Update lastFetchMissingPromise immediately, without waiting for                                            // 109
  // the results to be delivered.                                                                               // 110
  return new Promise(function (resolve, reject) {                                                               // 111
    Meteor.call("__dynamicImport", missingTree, function (error, resultsTree) {                                 // 112
      error ? reject(error) : resolve(resultsTree);                                                             // 116
    });                                                                                                         // 117
  });                                                                                                           // 119
}                                                                                                               // 120
                                                                                                                //
function getFromTree(tree, id) {                                                                                // 122
  id.split("/").every(function (part) {                                                                         // 123
    return !part || (tree = tree[part]);                                                                        // 124
  });                                                                                                           // 125
  return tree;                                                                                                  // 127
}                                                                                                               // 128
                                                                                                                //
function addToTree(tree, id, value) {                                                                           // 130
  var parts = id.split("/");                                                                                    // 131
  var lastIndex = parts.length - 1;                                                                             // 132
  parts.forEach(function (part, i) {                                                                            // 133
    if (part) {                                                                                                 // 134
      tree = tree[part] = tree[part] || (i < lastIndex ? Object.create(null) : value);                          // 135
    }                                                                                                           // 137
  });                                                                                                           // 138
}                                                                                                               // 139
                                                                                                                //
function getNamespace(module, id) {                                                                             // 141
  var namespace;                                                                                                // 142
  module.watch(module.require(id), {                                                                            // 144
    "*": function (ns) {                                                                                        // 145
      namespace = ns;                                                                                           // 146
    }                                                                                                           // 147
  }); // This helps with Babel interop, since we're not just returning the                                      // 144
  // module.exports object.                                                                                     // 151
                                                                                                                //
  Object.defineProperty(namespace, "__esModule", {                                                              // 152
    value: true,                                                                                                // 153
    enumerable: false                                                                                           // 154
  });                                                                                                           // 152
  return namespace;                                                                                             // 157
}                                                                                                               // 158
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dynamic-versions.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/dynamic-import/dynamic-versions.js                                                                  //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
// This magic double-underscored identifier gets replaced in                                                    // 1
// tools/isobuild/bundler.js with a tree of hashes of all dynamic                                               // 2
// modules, for use in client.js and cache.js.                                                                  // 3
module.exports = {};                                                                          // 4
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"security.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/dynamic-import/security.js                                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
var bpc = Package["browser-policy-content"];                                                                    // 1
var BP = bpc && bpc.BrowserPolicy;                                                                              // 2
var BPc = BP && BP.content;                                                                                     // 3
                                                                                                                //
if (BPc) {                                                                                                      // 4
  // The ability to evaluate new code is essential for loading dynamic                                          // 5
  // modules. Without eval, we would be forced to load modules using                                            // 6
  // <script src=...> tags, and then there would be no way to save those                                        // 7
  // modules to a local cache (or load them from the cache) without the                                         // 8
  // unique response caching abilities of service workers, which are not                                        // 9
  // available in all browsers, and cannot be polyfilled in a way that                                          // 10
  // satisfies Content Security Policy eval restrictions. Moreover, eval                                        // 11
  // allows us to evaluate dynamic module code in the original package                                          // 12
  // scope, which would never be possible using <script> tags. If you're                                        // 13
  // deploying an app in an environment that demands a Content Security                                         // 14
  // Policy that forbids eval, your only option is to bundle all dynamic                                        // 15
  // modules in the initial bundle. Fortunately, that works perfectly                                           // 16
  // well; you just won't get the performance benefits of dynamic module                                        // 17
  // fetching.                                                                                                  // 18
  BPc.allowEval();                                                                                              // 19
}                                                                                                               // 20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/dynamic-import/server.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['dynamic-import'] = exports;

})();

//# sourceMappingURL=dynamic-import.js.map

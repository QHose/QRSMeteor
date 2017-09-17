(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Log = Package.logging.Log;
var _ = Package.underscore._;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var Boilerplate = Package['boilerplate-generator'].Boilerplate;
var WebAppHashing = Package['webapp-hashing'].WebAppHashing;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var exports, WebApp, WebAppInternals, main;

var require = meteorInstall({"node_modules":{"meteor":{"webapp":{"webapp_server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/webapp_server.js                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                               //
                                                                                                                      //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                      //
                                                                                                                      //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                     //
                                                                                                                      //
var module1 = module;                                                                                                 // 1
module1.export({                                                                                                      // 1
  WebApp: function () {                                                                                               // 1
    return WebApp;                                                                                                    // 1
  },                                                                                                                  // 1
  WebAppInternals: function () {                                                                                      // 1
    return WebAppInternals;                                                                                           // 1
  }                                                                                                                   // 1
});                                                                                                                   // 1
var assert = void 0;                                                                                                  // 1
module1.watch(require("assert"), {                                                                                    // 1
  "default": function (v) {                                                                                           // 1
    assert = v;                                                                                                       // 1
  }                                                                                                                   // 1
}, 0);                                                                                                                // 1
var readFile = void 0;                                                                                                // 1
module1.watch(require("fs"), {                                                                                        // 1
  readFile: function (v) {                                                                                            // 1
    readFile = v;                                                                                                     // 1
  }                                                                                                                   // 1
}, 1);                                                                                                                // 1
var createServer = void 0;                                                                                            // 1
module1.watch(require("http"), {                                                                                      // 1
  createServer: function (v) {                                                                                        // 1
    createServer = v;                                                                                                 // 1
  }                                                                                                                   // 1
}, 2);                                                                                                                // 1
var pathJoin = void 0,                                                                                                // 1
    pathDirname = void 0;                                                                                             // 1
module1.watch(require("path"), {                                                                                      // 1
  join: function (v) {                                                                                                // 1
    pathJoin = v;                                                                                                     // 1
  },                                                                                                                  // 1
  dirname: function (v) {                                                                                             // 1
    pathDirname = v;                                                                                                  // 1
  }                                                                                                                   // 1
}, 3);                                                                                                                // 1
var parseUrl = void 0;                                                                                                // 1
module1.watch(require("url"), {                                                                                       // 1
  parse: function (v) {                                                                                               // 1
    parseUrl = v;                                                                                                     // 1
  }                                                                                                                   // 1
}, 4);                                                                                                                // 1
var createHash = void 0;                                                                                              // 1
module1.watch(require("crypto"), {                                                                                    // 1
  createHash: function (v) {                                                                                          // 1
    createHash = v;                                                                                                   // 1
  }                                                                                                                   // 1
}, 5);                                                                                                                // 1
var connect = void 0;                                                                                                 // 1
module1.watch(require("connect"), {                                                                                   // 1
  "default": function (v) {                                                                                           // 1
    connect = v;                                                                                                      // 1
  }                                                                                                                   // 1
}, 6);                                                                                                                // 1
var parseRequest = void 0;                                                                                            // 1
module1.watch(require("parseurl"), {                                                                                  // 1
  "default": function (v) {                                                                                           // 1
    parseRequest = v;                                                                                                 // 1
  }                                                                                                                   // 1
}, 7);                                                                                                                // 1
var lookupUserAgent = void 0;                                                                                         // 1
module1.watch(require("useragent"), {                                                                                 // 1
  lookup: function (v) {                                                                                              // 1
    lookupUserAgent = v;                                                                                              // 1
  }                                                                                                                   // 1
}, 8);                                                                                                                // 1
var send = void 0;                                                                                                    // 1
module1.watch(require("send"), {                                                                                      // 1
  "default": function (v) {                                                                                           // 1
    send = v;                                                                                                         // 1
  }                                                                                                                   // 1
}, 9);                                                                                                                // 1
var SHORT_SOCKET_TIMEOUT = 5 * 1000;                                                                                  // 15
var LONG_SOCKET_TIMEOUT = 120 * 1000;                                                                                 // 16
var WebApp = {};                                                                                                      // 18
var WebAppInternals = {};                                                                                             // 19
WebAppInternals.NpmModules = {                                                                                        // 21
  connect: {                                                                                                          // 22
    version: Npm.require('connect/package.json').version,                                                             // 23
    module: connect                                                                                                   // 24
  }                                                                                                                   // 22
};                                                                                                                    // 21
WebApp.defaultArch = 'web.browser'; // XXX maps archs to manifests                                                    // 28
                                                                                                                      //
WebApp.clientPrograms = {}; // XXX maps archs to program path on filesystem                                           // 31
                                                                                                                      //
var archPath = {};                                                                                                    // 34
                                                                                                                      //
var bundledJsCssUrlRewriteHook = function (url) {                                                                     // 36
  var bundledPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';                                           // 37
  return bundledPrefix + url;                                                                                         // 39
};                                                                                                                    // 40
                                                                                                                      //
var sha1 = function (contents) {                                                                                      // 42
  var hash = createHash('sha1');                                                                                      // 43
  hash.update(contents);                                                                                              // 44
  return hash.digest('hex');                                                                                          // 45
};                                                                                                                    // 46
                                                                                                                      //
var readUtf8FileSync = function (filename) {                                                                          // 48
  return Meteor.wrapAsync(readFile)(filename, 'utf8');                                                                // 49
}; // #BrowserIdentification                                                                                          // 50
//                                                                                                                    // 53
// We have multiple places that want to identify the browser: the                                                     // 54
// unsupported browser page, the appcache package, and, eventually                                                    // 55
// delivering browser polyfills only as needed.                                                                       // 56
//                                                                                                                    // 57
// To avoid detecting the browser in multiple places ad-hoc, we create a                                              // 58
// Meteor "browser" object. It uses but does not expose the npm                                                       // 59
// useragent module (we could choose a different mechanism to identify                                                // 60
// the browser in the future if we wanted to).  The browser object                                                    // 61
// contains                                                                                                           // 62
//                                                                                                                    // 63
// * `name`: the name of the browser in camel case                                                                    // 64
// * `major`, `minor`, `patch`: integers describing the browser version                                               // 65
//                                                                                                                    // 66
// Also here is an early version of a Meteor `request` object, intended                                               // 67
// to be a high-level description of the request without exposing                                                     // 68
// details of connect's low-level `req`.  Currently it contains:                                                      // 69
//                                                                                                                    // 70
// * `browser`: browser identification object described above                                                         // 71
// * `url`: parsed url, including parsed query params                                                                 // 72
//                                                                                                                    // 73
// As a temporary hack there is a `categorizeRequest` function on WebApp which                                        // 74
// converts a connect `req` to a Meteor `request`. This can go away once smart                                        // 75
// packages such as appcache are being passed a `request` object directly when                                        // 76
// they serve content.                                                                                                // 77
//                                                                                                                    // 78
// This allows `request` to be used uniformly: it is passed to the html                                               // 79
// attributes hook, and the appcache package can use it when deciding                                                 // 80
// whether to generate a 404 for the manifest.                                                                        // 81
//                                                                                                                    // 82
// Real routing / server side rendering will probably refactor this                                                   // 83
// heavily.                                                                                                           // 84
// e.g. "Mobile Safari" => "mobileSafari"                                                                             // 87
                                                                                                                      //
                                                                                                                      //
var camelCase = function (name) {                                                                                     // 88
  var parts = name.split(' ');                                                                                        // 89
  parts[0] = parts[0].toLowerCase();                                                                                  // 90
                                                                                                                      //
  for (var i = 1; i < parts.length; ++i) {                                                                            // 91
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substr(1);                                                 // 92
  }                                                                                                                   // 93
                                                                                                                      //
  return parts.join('');                                                                                              // 94
};                                                                                                                    // 95
                                                                                                                      //
var identifyBrowser = function (userAgentString) {                                                                    // 97
  var userAgent = lookupUserAgent(userAgentString);                                                                   // 98
  return {                                                                                                            // 99
    name: camelCase(userAgent.family),                                                                                // 100
    major: +userAgent.major,                                                                                          // 101
    minor: +userAgent.minor,                                                                                          // 102
    patch: +userAgent.patch                                                                                           // 103
  };                                                                                                                  // 99
}; // XXX Refactor as part of implementing real routing.                                                              // 105
                                                                                                                      //
                                                                                                                      //
WebAppInternals.identifyBrowser = identifyBrowser;                                                                    // 108
                                                                                                                      //
WebApp.categorizeRequest = function (req) {                                                                           // 110
  return _.extend({                                                                                                   // 111
    browser: identifyBrowser(req.headers['user-agent']),                                                              // 112
    url: parseUrl(req.url, true)                                                                                      // 113
  }, _.pick(req, 'dynamicHead', 'dynamicBody'));                                                                      // 111
}; // HTML attribute hooks: functions to be called to determine any attributes to                                     // 115
// be added to the '<html>' tag. Each function is passed a 'request' object (see                                      // 118
// #BrowserIdentification) and should return null or object.                                                          // 119
                                                                                                                      //
                                                                                                                      //
var htmlAttributeHooks = [];                                                                                          // 120
                                                                                                                      //
var getHtmlAttributes = function (request) {                                                                          // 121
  var combinedAttributes = {};                                                                                        // 122
                                                                                                                      //
  _.each(htmlAttributeHooks || [], function (hook) {                                                                  // 123
    var attributes = hook(request);                                                                                   // 124
    if (attributes === null) return;                                                                                  // 125
    if ((typeof attributes === "undefined" ? "undefined" : (0, _typeof3.default)(attributes)) !== 'object') throw Error("HTML attribute hook must return null or object");
                                                                                                                      //
    _.extend(combinedAttributes, attributes);                                                                         // 129
  });                                                                                                                 // 130
                                                                                                                      //
  return combinedAttributes;                                                                                          // 131
};                                                                                                                    // 132
                                                                                                                      //
WebApp.addHtmlAttributeHook = function (hook) {                                                                       // 133
  htmlAttributeHooks.push(hook);                                                                                      // 134
}; // Serve app HTML for this URL?                                                                                    // 135
                                                                                                                      //
                                                                                                                      //
var appUrl = function (url) {                                                                                         // 138
  if (url === '/favicon.ico' || url === '/robots.txt') return false; // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file name we have chosen to use for HTML5                                                    // 143
  // appcache URLs. It is included here to prevent using an appcache                                                  // 144
  // then removing it from poisoning an app permanently. Eventually,                                                  // 145
  // once we have server side routing, this won't be needed as                                                        // 146
  // unknown URLs with return a 404 automatically.                                                                    // 147
                                                                                                                      //
  if (url === '/app.manifest') return false; // Avoid serving app HTML for declared routes such as /sockjs/.          // 148
                                                                                                                      //
  if (RoutePolicy.classify(url)) return false; // we currently return app HTML on all URLs by default                 // 152
                                                                                                                      //
  return true;                                                                                                        // 156
}; // We need to calculate the client hash after all packages have loaded                                             // 157
// to give them a chance to populate __meteor_runtime_config__.                                                       // 161
//                                                                                                                    // 162
// Calculating the hash during startup means that packages can only                                                   // 163
// populate __meteor_runtime_config__ during load, not during startup.                                                // 164
//                                                                                                                    // 165
// Calculating instead it at the beginning of main after all startup                                                  // 166
// hooks had run would allow packages to also populate                                                                // 167
// __meteor_runtime_config__ during startup, but that's too late for                                                  // 168
// autoupdate because it needs to have the client hash at startup to                                                  // 169
// insert the auto update version itself into                                                                         // 170
// __meteor_runtime_config__ to get it to the client.                                                                 // 171
//                                                                                                                    // 172
// An alternative would be to give autoupdate a "post-start,                                                          // 173
// pre-listen" hook to allow it to insert the auto update version at                                                  // 174
// the right moment.                                                                                                  // 175
                                                                                                                      //
                                                                                                                      //
Meteor.startup(function () {                                                                                          // 177
  var calculateClientHash = WebAppHashing.calculateClientHash;                                                        // 178
                                                                                                                      //
  WebApp.clientHash = function (archName) {                                                                           // 179
    archName = archName || WebApp.defaultArch;                                                                        // 180
    return calculateClientHash(WebApp.clientPrograms[archName].manifest);                                             // 181
  };                                                                                                                  // 182
                                                                                                                      //
  WebApp.calculateClientHashRefreshable = function (archName) {                                                       // 184
    archName = archName || WebApp.defaultArch;                                                                        // 185
    return calculateClientHash(WebApp.clientPrograms[archName].manifest, function (name) {                            // 186
      return name === "css";                                                                                          // 188
    });                                                                                                               // 189
  };                                                                                                                  // 190
                                                                                                                      //
  WebApp.calculateClientHashNonRefreshable = function (archName) {                                                    // 191
    archName = archName || WebApp.defaultArch;                                                                        // 192
    return calculateClientHash(WebApp.clientPrograms[archName].manifest, function (name) {                            // 193
      return name !== "css";                                                                                          // 195
    });                                                                                                               // 196
  };                                                                                                                  // 197
                                                                                                                      //
  WebApp.calculateClientHashCordova = function () {                                                                   // 198
    var archName = 'web.cordova';                                                                                     // 199
    if (!WebApp.clientPrograms[archName]) return 'none';                                                              // 200
    return calculateClientHash(WebApp.clientPrograms[archName].manifest, null, _.pick(__meteor_runtime_config__, 'PUBLIC_SETTINGS'));
  };                                                                                                                  // 206
}); // When we have a request pending, we want the socket timeout to be long, to                                      // 207
// give ourselves a while to serve it, and to allow sockjs long polls to                                              // 212
// complete.  On the other hand, we want to close idle sockets relatively                                             // 213
// quickly, so that we can shut down relatively promptly but cleanly, without                                         // 214
// cutting off anyone's response.                                                                                     // 215
                                                                                                                      //
WebApp._timeoutAdjustmentRequestCallback = function (req, res) {                                                      // 216
  // this is really just req.socket.setTimeout(LONG_SOCKET_TIMEOUT);                                                  // 217
  req.setTimeout(LONG_SOCKET_TIMEOUT); // Insert our new finish listener to run BEFORE the existing one which removes
  // the response from the socket.                                                                                    // 220
                                                                                                                      //
  var finishListeners = res.listeners('finish'); // XXX Apparently in Node 0.12 this event was called 'prefinish'.    // 221
  // https://github.com/joyent/node/commit/7c9b6070                                                                   // 223
  // But it has switched back to 'finish' in Node v4:                                                                 // 224
  // https://github.com/nodejs/node/pull/1411                                                                         // 225
                                                                                                                      //
  res.removeAllListeners('finish');                                                                                   // 226
  res.on('finish', function () {                                                                                      // 227
    res.setTimeout(SHORT_SOCKET_TIMEOUT);                                                                             // 228
  });                                                                                                                 // 229
                                                                                                                      //
  _.each(finishListeners, function (l) {                                                                              // 230
    res.on('finish', l);                                                                                              // 230
  });                                                                                                                 // 230
}; // Will be updated by main before we listen.                                                                       // 231
// Map from client arch to boilerplate object.                                                                        // 235
// Boilerplate object has:                                                                                            // 236
//   - func: XXX                                                                                                      // 237
//   - baseData: XXX                                                                                                  // 238
                                                                                                                      //
                                                                                                                      //
var boilerplateByArch = {}; // Register a callback function that can selectively modify boilerplate                   // 239
// data given arguments (request, data, arch). The key should be a unique                                             // 242
// identifier, to prevent accumulating duplicate callbacks from the same                                              // 243
// call site over time. Callbacks will be called in the order they were                                               // 244
// registered. A callback should return false if it did not make any                                                  // 245
// changes affecting the boilerplate. Passing null deletes the callback.                                              // 246
// Any previous callback registered for this key will be returned.                                                    // 247
                                                                                                                      //
var boilerplateDataCallbacks = Object.create(null);                                                                   // 248
                                                                                                                      //
WebAppInternals.registerBoilerplateDataCallback = function (key, callback) {                                          // 249
  var previousCallback = boilerplateDataCallbacks[key];                                                               // 250
                                                                                                                      //
  if (typeof callback === "function") {                                                                               // 252
    boilerplateDataCallbacks[key] = callback;                                                                         // 253
  } else {                                                                                                            // 254
    assert.strictEqual(callback, null);                                                                               // 255
    delete boilerplateDataCallbacks[key];                                                                             // 256
  } // Return the previous callback in case the new callback needs to call                                            // 257
  // it; for example, when the new callback is a wrapper for the old.                                                 // 260
                                                                                                                      //
                                                                                                                      //
  return previousCallback || null;                                                                                    // 261
}; // Given a request (as returned from `categorizeRequest`), return the                                              // 262
// boilerplate HTML to serve for that request.                                                                        // 265
//                                                                                                                    // 266
// If a previous connect middleware has rendered content for the head or body,                                        // 267
// returns the boilerplate with that content patched in otherwise                                                     // 268
// memoizes on HTML attributes (used by, eg, appcache) and whether inline                                             // 269
// scripts are currently allowed.                                                                                     // 270
// XXX so far this function is always called with arch === 'web.browser'                                              // 271
                                                                                                                      //
                                                                                                                      //
var memoizedBoilerplate = {};                                                                                         // 272
                                                                                                                      //
function getBoilerplate(request, arch) {                                                                              // 274
  return getBoilerplateAsync(request, arch).await();                                                                  // 275
}                                                                                                                     // 276
                                                                                                                      //
function getBoilerplateAsync(request, arch) {                                                                         // 278
  var boilerplate = boilerplateByArch[arch];                                                                          // 279
  var data = Object.assign({}, boilerplate.baseData, {                                                                // 280
    htmlAttributes: getHtmlAttributes(request)                                                                        // 281
  }, _.pick(request, "dynamicHead", "dynamicBody"));                                                                  // 280
  var madeChanges = false;                                                                                            // 284
  var promise = Promise.resolve();                                                                                    // 285
  Object.keys(boilerplateDataCallbacks).forEach(function (key) {                                                      // 287
    promise = promise.then(function () {                                                                              // 288
      var callback = boilerplateDataCallbacks[key];                                                                   // 289
      return callback(request, data, arch);                                                                           // 290
    }).then(function (result) {                                                                                       // 291
      // Callbacks should return false if they did not make any changes.                                              // 292
      if (result !== false) {                                                                                         // 293
        madeChanges = true;                                                                                           // 294
      }                                                                                                               // 295
    });                                                                                                               // 296
  });                                                                                                                 // 297
  return promise.then(function () {                                                                                   // 299
    var useMemoized = !(data.dynamicHead || data.dynamicBody || madeChanges);                                         // 300
                                                                                                                      //
    if (!useMemoized) {                                                                                               // 306
      return boilerplate.toHTML(data);                                                                                // 307
    } // The only thing that changes from request to request (unless extra                                            // 308
    // content is added to the head or body, or boilerplateDataCallbacks                                              // 311
    // modified the data) are the HTML attributes (used by, eg, appcache)                                             // 312
    // and whether inline scripts are allowed, so memoize based on that.                                              // 313
                                                                                                                      //
                                                                                                                      //
    var memHash = JSON.stringify({                                                                                    // 314
      inlineScriptsAllowed: inlineScriptsAllowed,                                                                     // 315
      htmlAttributes: data.htmlAttributes,                                                                            // 316
      arch: arch                                                                                                      // 317
    });                                                                                                               // 314
                                                                                                                      //
    if (!memoizedBoilerplate[memHash]) {                                                                              // 320
      memoizedBoilerplate[memHash] = boilerplateByArch[arch].toHTML(data);                                            // 321
    }                                                                                                                 // 323
                                                                                                                      //
    return memoizedBoilerplate[memHash];                                                                              // 325
  });                                                                                                                 // 326
}                                                                                                                     // 327
                                                                                                                      //
WebAppInternals.generateBoilerplateInstance = function (arch, manifest, additionalOptions) {                          // 329
  additionalOptions = additionalOptions || {};                                                                        // 332
                                                                                                                      //
  var runtimeConfig = _.extend(_.clone(__meteor_runtime_config__), additionalOptions.runtimeConfigOverrides || {});   // 334
                                                                                                                      //
  return new Boilerplate(arch, manifest, _.extend({                                                                   // 338
    pathMapper: function (itemPath) {                                                                                 // 340
      return pathJoin(archPath[arch], itemPath);                                                                      // 341
    },                                                                                                                // 341
    baseDataExtension: {                                                                                              // 342
      additionalStaticJs: _.map(additionalStaticJs || [], function (contents, pathname) {                             // 343
        return {                                                                                                      // 346
          pathname: pathname,                                                                                         // 347
          contents: contents                                                                                          // 348
        };                                                                                                            // 346
      }),                                                                                                             // 350
      // Convert to a JSON string, then get rid of most weird characters, then                                        // 352
      // wrap in double quotes. (The outermost JSON.stringify really ought to                                         // 353
      // just be "wrap in double quotes" but we use it to be safe.) This might                                        // 354
      // end up inside a <script> tag so we need to be careful to not include                                         // 355
      // "</script>", but normal {{spacebars}} escaping escapes too much! See                                         // 356
      // https://github.com/meteor/meteor/issues/3730                                                                 // 357
      meteorRuntimeConfig: JSON.stringify(encodeURIComponent(JSON.stringify(runtimeConfig))),                         // 358
      rootUrlPathPrefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '',                                        // 360
      bundledJsCssUrlRewriteHook: bundledJsCssUrlRewriteHook,                                                         // 361
      inlineScriptsAllowed: WebAppInternals.inlineScriptsAllowed(),                                                   // 362
      inline: additionalOptions.inline                                                                                // 363
    }                                                                                                                 // 342
  }, additionalOptions));                                                                                             // 339
}; // A mapping from url path to "info". Where "info" has the following fields:                                       // 367
// - type: the type of file to be served                                                                              // 370
// - cacheable: optionally, whether the file should be cached or not                                                  // 371
// - sourceMapUrl: optionally, the url of the source map                                                              // 372
//                                                                                                                    // 373
// Info also contains one of the following:                                                                           // 374
// - content: the stringified content that should be served at this path                                              // 375
// - absolutePath: the absolute path on disk to the file                                                              // 376
                                                                                                                      //
                                                                                                                      //
var staticFiles; // Serve static files from the manifest or added with                                                // 378
// `addStaticJs`. Exported for tests.                                                                                 // 381
                                                                                                                      //
WebAppInternals.staticFilesMiddleware = function (staticFiles, req, res, next) {                                      // 382
  if ('GET' != req.method && 'HEAD' != req.method && 'OPTIONS' != req.method) {                                       // 383
    next();                                                                                                           // 384
    return;                                                                                                           // 385
  }                                                                                                                   // 386
                                                                                                                      //
  var pathname = parseRequest(req).pathname;                                                                          // 387
                                                                                                                      //
  try {                                                                                                               // 388
    pathname = decodeURIComponent(pathname);                                                                          // 389
  } catch (e) {                                                                                                       // 390
    next();                                                                                                           // 391
    return;                                                                                                           // 392
  }                                                                                                                   // 393
                                                                                                                      //
  var serveStaticJs = function (s) {                                                                                  // 395
    res.writeHead(200, {                                                                                              // 396
      'Content-type': 'application/javascript; charset=UTF-8'                                                         // 397
    });                                                                                                               // 396
    res.write(s);                                                                                                     // 399
    res.end();                                                                                                        // 400
  };                                                                                                                  // 401
                                                                                                                      //
  if (pathname === "/meteor_runtime_config.js" && !WebAppInternals.inlineScriptsAllowed()) {                          // 403
    serveStaticJs("__meteor_runtime_config__ = " + JSON.stringify(__meteor_runtime_config__) + ";");                  // 405
    return;                                                                                                           // 407
  } else if (_.has(additionalStaticJs, pathname) && !WebAppInternals.inlineScriptsAllowed()) {                        // 408
    serveStaticJs(additionalStaticJs[pathname]);                                                                      // 410
    return;                                                                                                           // 411
  }                                                                                                                   // 412
                                                                                                                      //
  if (!_.has(staticFiles, pathname)) {                                                                                // 414
    next();                                                                                                           // 415
    return;                                                                                                           // 416
  } // We don't need to call pause because, unlike 'static', once we call into                                        // 417
  // 'send' and yield to the event loop, we never call another handler with                                           // 420
  // 'next'.                                                                                                          // 421
                                                                                                                      //
                                                                                                                      //
  var info = staticFiles[pathname]; // Cacheable files are files that should never change. Typically                  // 423
  // named by their hash (eg meteor bundled js and css files).                                                        // 426
  // We cache them ~forever (1yr).                                                                                    // 427
                                                                                                                      //
  var maxAge = info.cacheable ? 1000 * 60 * 60 * 24 * 365 : 0; // Set the X-SourceMap header, which current Chrome, FireFox, and Safari
  // understand.  (The SourceMap header is slightly more spec-correct but FF                                          // 433
  // doesn't understand it.)                                                                                          // 434
  //                                                                                                                  // 435
  // You may also need to enable source maps in Chrome: open dev tools, click                                         // 436
  // the gear in the bottom right corner, and select "enable source maps".                                            // 437
                                                                                                                      //
  if (info.sourceMapUrl) {                                                                                            // 438
    res.setHeader('X-SourceMap', __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + info.sourceMapUrl);                 // 439
  }                                                                                                                   // 442
                                                                                                                      //
  if (info.type === "js" || info.type === "dynamic js") {                                                             // 444
    res.setHeader("Content-Type", "application/javascript; charset=UTF-8");                                           // 446
  } else if (info.type === "css") {                                                                                   // 447
    res.setHeader("Content-Type", "text/css; charset=UTF-8");                                                         // 448
  } else if (info.type === "json") {                                                                                  // 449
    res.setHeader("Content-Type", "application/json; charset=UTF-8");                                                 // 450
  }                                                                                                                   // 451
                                                                                                                      //
  if (info.hash) {                                                                                                    // 453
    res.setHeader('ETag', '"' + info.hash + '"');                                                                     // 454
  }                                                                                                                   // 455
                                                                                                                      //
  if (info.content) {                                                                                                 // 457
    res.write(info.content);                                                                                          // 458
    res.end();                                                                                                        // 459
  } else {                                                                                                            // 460
    send(req, info.absolutePath, {                                                                                    // 461
      maxage: maxAge,                                                                                                 // 462
      dotfiles: 'allow',                                                                                              // 463
      // if we specified a dotfile in the manifest, serve it                                                          // 463
      lastModified: false // don't set last-modified based on the file date                                           // 464
                                                                                                                      //
    }).on('error', function (err) {                                                                                   // 461
      Log.error("Error serving static file " + err);                                                                  // 466
      res.writeHead(500);                                                                                             // 467
      res.end();                                                                                                      // 468
    }).on('directory', function () {                                                                                  // 469
      Log.error("Unexpected directory " + info.absolutePath);                                                         // 471
      res.writeHead(500);                                                                                             // 472
      res.end();                                                                                                      // 473
    }).pipe(res);                                                                                                     // 474
  }                                                                                                                   // 476
};                                                                                                                    // 477
                                                                                                                      //
var getUrlPrefixForArch = function (arch) {                                                                           // 479
  // XXX we rely on the fact that arch names don't contain slashes                                                    // 480
  // in that case we would need to uri escape it                                                                      // 481
  // We add '__' to the beginning of non-standard archs to "scope" the url                                            // 483
  // to Meteor internals.                                                                                             // 484
  return arch === WebApp.defaultArch ? '' : '/' + '__' + arch.replace(/^web\./, '');                                  // 485
}; // parse port to see if its a Windows Server style named pipe. If so, return as-is (String), otherwise return as Int
                                                                                                                      //
                                                                                                                      //
WebAppInternals.parsePort = function (port) {                                                                         // 490
  if (/\\\\?.+\\pipe\\?.+/.test(port)) {                                                                              // 491
    return port;                                                                                                      // 492
  }                                                                                                                   // 493
                                                                                                                      //
  return parseInt(port);                                                                                              // 495
};                                                                                                                    // 496
                                                                                                                      //
function runWebAppServer() {                                                                                          // 498
  var shuttingDown = false;                                                                                           // 499
  var syncQueue = new Meteor._SynchronousQueue();                                                                     // 500
                                                                                                                      //
  var getItemPathname = function (itemUrl) {                                                                          // 502
    return decodeURIComponent(parseUrl(itemUrl).pathname);                                                            // 503
  };                                                                                                                  // 504
                                                                                                                      //
  WebAppInternals.reloadClientPrograms = function () {                                                                // 506
    syncQueue.runTask(function () {                                                                                   // 507
      staticFiles = {};                                                                                               // 508
                                                                                                                      //
      var generateClientProgram = function (clientPath, arch) {                                                       // 509
        // read the control for the client we'll be serving up                                                        // 510
        var clientJsonPath = pathJoin(__meteor_bootstrap__.serverDir, clientPath);                                    // 511
        var clientDir = pathDirname(clientJsonPath);                                                                  // 513
        var clientJson = JSON.parse(readUtf8FileSync(clientJsonPath));                                                // 514
        if (clientJson.format !== "web-program-pre1") throw new Error("Unsupported format for client assets: " + JSON.stringify(clientJson.format));
        if (!clientJsonPath || !clientDir || !clientJson) throw new Error("Client config file not parsed.");          // 519
        var urlPrefix = getUrlPrefixForArch(arch);                                                                    // 522
        var manifest = clientJson.manifest;                                                                           // 524
                                                                                                                      //
        _.each(manifest, function (item) {                                                                            // 525
          if (item.url && item.where === "client") {                                                                  // 526
            staticFiles[urlPrefix + getItemPathname(item.url)] = {                                                    // 527
              absolutePath: pathJoin(clientDir, item.path),                                                           // 528
              cacheable: item.cacheable,                                                                              // 529
              hash: item.hash,                                                                                        // 530
              // Link from source to its map                                                                          // 531
              sourceMapUrl: item.sourceMapUrl,                                                                        // 532
              type: item.type                                                                                         // 533
            };                                                                                                        // 527
                                                                                                                      //
            if (item.sourceMap) {                                                                                     // 536
              // Serve the source map too, under the specified URL. We assume all                                     // 537
              // source maps are cacheable.                                                                           // 538
              staticFiles[urlPrefix + getItemPathname(item.sourceMapUrl)] = {                                         // 539
                absolutePath: pathJoin(clientDir, item.sourceMap),                                                    // 540
                cacheable: true                                                                                       // 541
              };                                                                                                      // 539
            }                                                                                                         // 543
          }                                                                                                           // 544
        });                                                                                                           // 545
                                                                                                                      //
        var program = {                                                                                               // 547
          format: "web-program-pre1",                                                                                 // 548
          manifest: manifest,                                                                                         // 549
          version: process.env.AUTOUPDATE_VERSION || WebAppHashing.calculateClientHash(manifest, null, _.pick(__meteor_runtime_config__, "PUBLIC_SETTINGS")),
          cordovaCompatibilityVersions: clientJson.cordovaCompatibilityVersions,                                      // 556
          PUBLIC_SETTINGS: __meteor_runtime_config__.PUBLIC_SETTINGS                                                  // 557
        };                                                                                                            // 547
        WebApp.clientPrograms[arch] = program; // Serve the program as a string at /foo/<arch>/manifest.json          // 560
        // XXX change manifest.json -> program.json                                                                   // 563
                                                                                                                      //
        staticFiles[urlPrefix + getItemPathname('/manifest.json')] = {                                                // 564
          content: JSON.stringify(program),                                                                           // 565
          cacheable: false,                                                                                           // 566
          hash: program.version,                                                                                      // 567
          type: "json"                                                                                                // 568
        };                                                                                                            // 564
      };                                                                                                              // 570
                                                                                                                      //
      try {                                                                                                           // 572
        var clientPaths = __meteor_bootstrap__.configJson.clientPaths;                                                // 573
                                                                                                                      //
        _.each(clientPaths, function (clientPath, arch) {                                                             // 574
          archPath[arch] = pathDirname(clientPath);                                                                   // 575
          generateClientProgram(clientPath, arch);                                                                    // 576
        }); // Exported for tests.                                                                                    // 577
                                                                                                                      //
                                                                                                                      //
        WebAppInternals.staticFiles = staticFiles;                                                                    // 580
      } catch (e) {                                                                                                   // 581
        Log.error("Error reloading the client program: " + e.stack);                                                  // 582
        process.exit(1);                                                                                              // 583
      }                                                                                                               // 584
    });                                                                                                               // 585
  };                                                                                                                  // 586
                                                                                                                      //
  WebAppInternals.generateBoilerplate = function () {                                                                 // 588
    // This boilerplate will be served to the mobile devices when used with                                           // 589
    // Meteor/Cordova for the Hot-Code Push and since the file will be served by                                      // 590
    // the device's server, it is important to set the DDP url to the actual                                          // 591
    // Meteor server accepting DDP connections and not the device's file server.                                      // 592
    var defaultOptionsForArch = {                                                                                     // 593
      'web.cordova': {                                                                                                // 594
        runtimeConfigOverrides: {                                                                                     // 595
          // XXX We use absoluteUrl() here so that we serve https://                                                  // 596
          // URLs to cordova clients if force-ssl is in use. If we were                                               // 597
          // to use __meteor_runtime_config__.ROOT_URL instead of                                                     // 598
          // absoluteUrl(), then Cordova clients would immediately get a                                              // 599
          // HCP setting their DDP_DEFAULT_CONNECTION_URL to                                                          // 600
          // http://example.meteor.com. This breaks the app, because                                                  // 601
          // force-ssl doesn't serve CORS headers on 302                                                              // 602
          // redirects. (Plus it's undesirable to have clients                                                        // 603
          // connecting to http://example.meteor.com when force-ssl is                                                // 604
          // in use.)                                                                                                 // 605
          DDP_DEFAULT_CONNECTION_URL: process.env.MOBILE_DDP_URL || Meteor.absoluteUrl(),                             // 606
          ROOT_URL: process.env.MOBILE_ROOT_URL || Meteor.absoluteUrl()                                               // 608
        }                                                                                                             // 595
      }                                                                                                               // 594
    };                                                                                                                // 593
    syncQueue.runTask(function () {                                                                                   // 614
      _.each(WebApp.clientPrograms, function (program, archName) {                                                    // 615
        boilerplateByArch[archName] = WebAppInternals.generateBoilerplateInstance(archName, program.manifest, defaultOptionsForArch[archName]);
      }); // Clear the memoized boilerplate cache.                                                                    // 620
                                                                                                                      //
                                                                                                                      //
      memoizedBoilerplate = {}; // Configure CSS injection for the default arch                                       // 623
      // XXX implement the CSS injection for all archs?                                                               // 626
                                                                                                                      //
      var cssFiles = boilerplateByArch[WebApp.defaultArch].baseData.css; // Rewrite all CSS files (which are written directly to <style> tags)
      // by autoupdate_client to use the CDN prefix/etc                                                               // 629
                                                                                                                      //
      var allCss = _.map(cssFiles, function (cssFile) {                                                               // 630
        return {                                                                                                      // 631
          url: bundledJsCssUrlRewriteHook(cssFile.url)                                                                // 631
        };                                                                                                            // 631
      });                                                                                                             // 632
                                                                                                                      //
      WebAppInternals.refreshableAssets = {                                                                           // 633
        allCss: allCss                                                                                                // 633
      };                                                                                                              // 633
    });                                                                                                               // 634
  };                                                                                                                  // 635
                                                                                                                      //
  WebAppInternals.reloadClientPrograms(); // webserver                                                                // 637
                                                                                                                      //
  var app = connect(); // Packages and apps can add handlers that run before any other Meteor                         // 640
  // handlers via WebApp.rawConnectHandlers.                                                                          // 643
                                                                                                                      //
  var rawConnectHandlers = connect();                                                                                 // 644
  app.use(rawConnectHandlers); // Auto-compress any json, javascript, or text.                                        // 645
                                                                                                                      //
  app.use(connect.compress()); // We're not a proxy; reject (without crashing) attempts to treat us like              // 648
  // one. (See #1212.)                                                                                                // 651
                                                                                                                      //
  app.use(function (req, res, next) {                                                                                 // 652
    if (RoutePolicy.isValidUrl(req.url)) {                                                                            // 653
      next();                                                                                                         // 654
      return;                                                                                                         // 655
    }                                                                                                                 // 656
                                                                                                                      //
    res.writeHead(400);                                                                                               // 657
    res.write("Not a proxy");                                                                                         // 658
    res.end();                                                                                                        // 659
  }); // Strip off the path prefix, if it exists.                                                                     // 660
                                                                                                                      //
  app.use(function (request, response, next) {                                                                        // 663
    var pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;                                                  // 664
                                                                                                                      //
    var url = Npm.require('url').parse(request.url);                                                                  // 665
                                                                                                                      //
    var pathname = url.pathname; // check if the path in the url starts with the path prefix (and the part            // 666
    // after the path prefix must start with a / if it exists.)                                                       // 668
                                                                                                                      //
    if (pathPrefix && pathname.substring(0, pathPrefix.length) === pathPrefix && (pathname.length == pathPrefix.length || pathname.substring(pathPrefix.length, pathPrefix.length + 1) === "/")) {
      request.url = request.url.substring(pathPrefix.length);                                                         // 672
      next();                                                                                                         // 673
    } else if (pathname === "/favicon.ico" || pathname === "/robots.txt") {                                           // 674
      next();                                                                                                         // 675
    } else if (pathPrefix) {                                                                                          // 676
      response.writeHead(404);                                                                                        // 677
      response.write("Unknown path");                                                                                 // 678
      response.end();                                                                                                 // 679
    } else {                                                                                                          // 680
      next();                                                                                                         // 681
    }                                                                                                                 // 682
  }); // Parse the query string into res.query. Used by oauth_server, but it's                                        // 683
  // generally pretty handy..                                                                                         // 686
                                                                                                                      //
  app.use(connect.query()); // Serve static files from the manifest.                                                  // 687
  // This is inspired by the 'static' middleware.                                                                     // 690
                                                                                                                      //
  app.use(function (req, res, next) {                                                                                 // 691
    Promise.resolve().then(function () {                                                                              // 692
      WebAppInternals.staticFilesMiddleware(staticFiles, req, res, next);                                             // 693
    });                                                                                                               // 694
  }); // Packages and apps can add handlers to this via WebApp.connectHandlers.                                       // 695
  // They are inserted before our default handler.                                                                    // 698
                                                                                                                      //
  var packageAndAppHandlers = connect();                                                                              // 699
  app.use(packageAndAppHandlers);                                                                                     // 700
  var suppressConnectErrors = false; // connect knows it is an error handler because it has 4 arguments instead of    // 702
  // 3. go figure.  (It is not smart enough to find such a thing if it's hidden                                       // 704
  // inside packageAndAppHandlers.)                                                                                   // 705
                                                                                                                      //
  app.use(function (err, req, res, next) {                                                                            // 706
    if (!err || !suppressConnectErrors || !req.headers['x-suppress-error']) {                                         // 707
      next(err);                                                                                                      // 708
      return;                                                                                                         // 709
    }                                                                                                                 // 710
                                                                                                                      //
    res.writeHead(err.status, {                                                                                       // 711
      'Content-Type': 'text/plain'                                                                                    // 711
    });                                                                                                               // 711
    res.end("An error message");                                                                                      // 712
  });                                                                                                                 // 713
  app.use(function (req, res, next) {                                                                                 // 715
    Promise.resolve().then(function () {                                                                              // 716
      if (!appUrl(req.url)) {                                                                                         // 717
        return next();                                                                                                // 718
      }                                                                                                               // 719
                                                                                                                      //
      var headers = {                                                                                                 // 721
        'Content-Type': 'text/html; charset=utf-8'                                                                    // 722
      };                                                                                                              // 721
                                                                                                                      //
      if (shuttingDown) {                                                                                             // 725
        headers['Connection'] = 'Close';                                                                              // 726
      }                                                                                                               // 727
                                                                                                                      //
      var request = WebApp.categorizeRequest(req);                                                                    // 729
                                                                                                                      //
      if (request.url.query && request.url.query['meteor_css_resource']) {                                            // 731
        // In this case, we're requesting a CSS resource in the meteor-specific                                       // 732
        // way, but we don't have it.  Serve a static css file that indicates that                                    // 733
        // we didn't have it, so we can detect that and refresh.  Make sure                                           // 734
        // that any proxies or CDNs don't cache this error!  (Normally proxies                                        // 735
        // or CDNs are smart enough not to cache error pages, but in order to                                         // 736
        // make this hack work, we need to return the CSS file as a 200, which                                        // 737
        // would otherwise be cached.)                                                                                // 738
        headers['Content-Type'] = 'text/css; charset=utf-8';                                                          // 739
        headers['Cache-Control'] = 'no-cache';                                                                        // 740
        res.writeHead(200, headers);                                                                                  // 741
        res.write(".meteor-css-not-found-error { width: 0px;}");                                                      // 742
        res.end();                                                                                                    // 743
        return;                                                                                                       // 744
      }                                                                                                               // 745
                                                                                                                      //
      if (request.url.query && request.url.query['meteor_js_resource']) {                                             // 747
        // Similarly, we're requesting a JS resource that we don't have.                                              // 748
        // Serve an uncached 404. (We can't use the same hack we use for CSS,                                         // 749
        // because actually acting on that hack requires us to have the JS                                            // 750
        // already!)                                                                                                  // 751
        headers['Cache-Control'] = 'no-cache';                                                                        // 752
        res.writeHead(404, headers);                                                                                  // 753
        res.end("404 Not Found");                                                                                     // 754
        return;                                                                                                       // 755
      }                                                                                                               // 756
                                                                                                                      //
      if (request.url.query && request.url.query['meteor_dont_serve_index']) {                                        // 758
        // When downloading files during a Cordova hot code push, we need                                             // 759
        // to detect if a file is not available instead of inadvertently                                              // 760
        // downloading the default index page.                                                                        // 761
        // So similar to the situation above, we serve an uncached 404.                                               // 762
        headers['Cache-Control'] = 'no-cache';                                                                        // 763
        res.writeHead(404, headers);                                                                                  // 764
        res.end("404 Not Found");                                                                                     // 765
        return;                                                                                                       // 766
      } // /packages/asdfsad ... /__cordova/dafsdf.js                                                                 // 767
                                                                                                                      //
                                                                                                                      //
      var pathname = parseRequest(req).pathname;                                                                      // 770
      var archKey = pathname.split('/')[1];                                                                           // 771
      var archKeyCleaned = 'web.' + archKey.replace(/^__/, '');                                                       // 772
                                                                                                                      //
      if (!/^__/.test(archKey) || !_.has(archPath, archKeyCleaned)) {                                                 // 774
        archKey = WebApp.defaultArch;                                                                                 // 775
      } else {                                                                                                        // 776
        archKey = archKeyCleaned;                                                                                     // 777
      }                                                                                                               // 778
                                                                                                                      //
      return getBoilerplateAsync(request, archKey).then(function (boilerplate) {                                      // 780
        var statusCode = res.statusCode ? res.statusCode : 200;                                                       // 784
        res.writeHead(statusCode, headers);                                                                           // 785
        res.write(boilerplate);                                                                                       // 786
        res.end();                                                                                                    // 787
      }, function (error) {                                                                                           // 788
        Log.error("Error running template: " + error.stack);                                                          // 789
        res.writeHead(500, headers);                                                                                  // 790
        res.end();                                                                                                    // 791
      });                                                                                                             // 792
    });                                                                                                               // 793
  }); // Return 404 by default, if no other handlers serve this URL.                                                  // 794
                                                                                                                      //
  app.use(function (req, res) {                                                                                       // 797
    res.writeHead(404);                                                                                               // 798
    res.end();                                                                                                        // 799
  });                                                                                                                 // 800
  var httpServer = createServer(app);                                                                                 // 803
  var onListeningCallbacks = []; // After 5 seconds w/o data on a socket, kill it.  On the other hand, if             // 804
  // there's an outstanding request, give it a higher timeout instead (to avoid                                       // 807
  // killing long-polling requests)                                                                                   // 808
                                                                                                                      //
  httpServer.setTimeout(SHORT_SOCKET_TIMEOUT); // Do this here, and then also in livedata/stream_server.js, because   // 809
  // stream_server.js kills all the current request handlers when installing its                                      // 812
  // own.                                                                                                             // 813
                                                                                                                      //
  httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback); // If the client gave us a bad request, tell it instead of just closing the
  // socket. This lets load balancers in front of us differentiate between "a                                         // 817
  // server is randomly closing sockets for no reason" and "client sent a bad                                         // 818
  // request".                                                                                                        // 819
  //                                                                                                                  // 820
  // This will only work on Node 6; Node 4 destroys the socket before calling                                         // 821
  // this event. See https://github.com/nodejs/node/pull/4557/ for details.                                           // 822
                                                                                                                      //
  httpServer.on('clientError', function (err, socket) {                                                               // 823
    // Pre-Node-6, do nothing.                                                                                        // 824
    if (socket.destroyed) {                                                                                           // 825
      return;                                                                                                         // 826
    }                                                                                                                 // 827
                                                                                                                      //
    if (err.message === 'Parse Error') {                                                                              // 829
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');                                                                 // 830
    } else {                                                                                                          // 831
      // For other errors, use the default behavior as if we had no clientError                                       // 832
      // handler.                                                                                                     // 833
      socket.destroy(err);                                                                                            // 834
    }                                                                                                                 // 835
  }); // start up app                                                                                                 // 836
                                                                                                                      //
  _.extend(WebApp, {                                                                                                  // 839
    connectHandlers: packageAndAppHandlers,                                                                           // 840
    rawConnectHandlers: rawConnectHandlers,                                                                           // 841
    httpServer: httpServer,                                                                                           // 842
    connectApp: app,                                                                                                  // 843
    // For testing.                                                                                                   // 844
    suppressConnectErrors: function () {                                                                              // 845
      suppressConnectErrors = true;                                                                                   // 846
    },                                                                                                                // 847
    onListening: function (f) {                                                                                       // 848
      if (onListeningCallbacks) onListeningCallbacks.push(f);else f();                                                // 849
    }                                                                                                                 // 853
  }); // Let the rest of the packages (and Meteor.startup hooks) insert connect                                       // 839
  // middlewares and update __meteor_runtime_config__, then keep going to set up                                      // 857
  // actually serving HTML.                                                                                           // 858
                                                                                                                      //
                                                                                                                      //
  exports.main = function (argv) {                                                                                    // 859
    WebAppInternals.generateBoilerplate(); // only start listening after all the startup code has run.                // 860
                                                                                                                      //
    var localPort = WebAppInternals.parsePort(process.env.PORT) || 0;                                                 // 863
    var host = process.env.BIND_IP;                                                                                   // 864
    var localIp = host || '0.0.0.0';                                                                                  // 865
    httpServer.listen(localPort, localIp, Meteor.bindEnvironment(function () {                                        // 866
      if (process.env.METEOR_PRINT_ON_LISTEN) {                                                                       // 867
        console.log("LISTENING"); // must match run-app.js                                                            // 868
      }                                                                                                               // 869
                                                                                                                      //
      var callbacks = onListeningCallbacks;                                                                           // 871
      onListeningCallbacks = null;                                                                                    // 872
                                                                                                                      //
      _.each(callbacks, function (x) {                                                                                // 873
        x();                                                                                                          // 873
      });                                                                                                             // 873
    }, function (e) {                                                                                                 // 875
      console.error("Error listening:", e);                                                                           // 876
      console.error(e && e.stack);                                                                                    // 877
    }));                                                                                                              // 878
    return 'DAEMON';                                                                                                  // 880
  };                                                                                                                  // 881
}                                                                                                                     // 882
                                                                                                                      //
runWebAppServer();                                                                                                    // 885
var inlineScriptsAllowed = true;                                                                                      // 888
                                                                                                                      //
WebAppInternals.inlineScriptsAllowed = function () {                                                                  // 890
  return inlineScriptsAllowed;                                                                                        // 891
};                                                                                                                    // 892
                                                                                                                      //
WebAppInternals.setInlineScriptsAllowed = function (value) {                                                          // 894
  inlineScriptsAllowed = value;                                                                                       // 895
  WebAppInternals.generateBoilerplate();                                                                              // 896
};                                                                                                                    // 897
                                                                                                                      //
WebAppInternals.setBundledJsCssUrlRewriteHook = function (hookFn) {                                                   // 900
  bundledJsCssUrlRewriteHook = hookFn;                                                                                // 901
  WebAppInternals.generateBoilerplate();                                                                              // 902
};                                                                                                                    // 903
                                                                                                                      //
WebAppInternals.setBundledJsCssPrefix = function (prefix) {                                                           // 905
  var self = this;                                                                                                    // 906
  self.setBundledJsCssUrlRewriteHook(function (url) {                                                                 // 907
    return prefix + url;                                                                                              // 909
  });                                                                                                                 // 910
}; // Packages can call `WebAppInternals.addStaticJs` to specify static                                               // 911
// JavaScript to be included in the app. This static JS will be inlined,                                              // 914
// unless inline scripts have been disabled, in which case it will be                                                 // 915
// served under `/<sha1 of contents>`.                                                                                // 916
                                                                                                                      //
                                                                                                                      //
var additionalStaticJs = {};                                                                                          // 917
                                                                                                                      //
WebAppInternals.addStaticJs = function (contents) {                                                                   // 918
  additionalStaticJs["/" + sha1(contents) + ".js"] = contents;                                                        // 919
}; // Exported for tests                                                                                              // 920
                                                                                                                      //
                                                                                                                      //
WebAppInternals.getBoilerplate = getBoilerplate;                                                                      // 923
WebAppInternals.additionalStaticJs = additionalStaticJs;                                                              // 924
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"connect":{"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/connect/index.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //

module.exports = require('./lib/connect');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"parseurl":{"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/parseurl/index.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * parseurl
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var url = require('url')
var parse = url.parse
var Url = url.Url

/**
 * Pattern for a simple path case.
 * See: https://github.com/joyent/node/pull/7878
 */

var simplePathRegExp = /^(\/\/?(?!\/)[^\?#\s]*)(\?[^#\s]*)?$/

/**
 * Exports.
 */

module.exports = parseurl
module.exports.original = originalurl

/**
 * Parse the `req` url with memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @api public
 */

function parseurl(req) {
  var url = req.url

  if (url === undefined) {
    // URL is undefined
    return undefined
  }

  var parsed = req._parsedUrl

  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed
  }

  // Parse the URL
  parsed = fastparse(url)
  parsed._raw = url

  return req._parsedUrl = parsed
};

/**
 * Parse the `req` original url with fallback and memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @api public
 */

function originalurl(req) {
  var url = req.originalUrl

  if (typeof url !== 'string') {
    // Fallback
    return parseurl(req)
  }

  var parsed = req._parsedOriginalUrl

  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed
  }

  // Parse the URL
  parsed = fastparse(url)
  parsed._raw = url

  return req._parsedOriginalUrl = parsed
};

/**
 * Parse the `str` url with fast-path short-cut.
 *
 * @param {string} str
 * @return {Object}
 * @api private
 */

function fastparse(str) {
  // Try fast path regexp
  // See: https://github.com/joyent/node/pull/7878
  var simplePath = typeof str === 'string' && simplePathRegExp.exec(str)

  // Construct simple URL
  if (simplePath) {
    var pathname = simplePath[1]
    var search = simplePath[2] || null
    var url = Url !== undefined
      ? new Url()
      : {}
    url.path = str
    url.href = str
    url.pathname = pathname
    url.search = search
    url.query = search && search.substr(1)

    return url
  }

  return parse(str)
}

/**
 * Determine if parsed is still fresh for url.
 *
 * @param {string} url
 * @param {object} parsedUrl
 * @return {boolean}
 * @api private
 */

function fresh(url, parsedUrl) {
  return typeof parsedUrl === 'object'
    && parsedUrl !== null
    && (Url === undefined || parsedUrl instanceof Url)
    && parsedUrl._raw === url
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"useragent":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// ../npm/node_modules/useragent/package.json                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "useragent";
exports.version = "2.0.7";
exports.main = "./index.js";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/useragent/index.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
'use strict';

/**
 * This is where all the magic comes from, specially crafted for `useragent`.
 */
var regexps = require('./lib/regexps');

/**
 * Reduce references by storing the lookups.
 */
// OperatingSystem parsers:
var osparsers = regexps.os
  , osparserslength = osparsers.length;

// UserAgent parsers:
var agentparsers = regexps.browser
  , agentparserslength = agentparsers.length;

// Device parsers:
var deviceparsers = regexps.device
  , deviceparserslength = deviceparsers.length;

/**
 * The representation of a parsed user agent.
 *
 * @constructor
 * @param {String} family The name of the browser
 * @param {String} major Major version of the browser
 * @param {String} minor Minor version of the browser
 * @param {String} patch Patch version of the browser
 * @param {String} source The actual user agent string
 * @api public
 */
function Agent(family, major, minor, patch, source) {
  this.family = family || 'Other';
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
  this.source = source || '';
}

/**
 * OnDemand parsing of the Operating System.
 *
 * @type {OperatingSystem}
 * @api public
 */
Object.defineProperty(Agent.prototype, 'os', {
  get: function lazyparse() {
    var userAgent = this.source
      , length = osparserslength
      , parsers = osparsers
      , i = 0
      , parser
      , res;

    for (; i < length; i++) {
      if (res = parsers[i][0].exec(userAgent)) {
        parser = parsers[i];

        if (parser[1]) res[1] = parser[1].replace('$1', res[1]);
        break;
      }
    }

    return Object.defineProperty(this, 'os', {
        value: !parser || !res
          ? new OperatingSystem()
          : new OperatingSystem(
                res[1]
              , parser[2] || res[2]
              , parser[3] || res[3]
              , parser[4] || res[4]
            )
    }).os;
  },

  /**
   * Bypass the OnDemand parsing and set an OperatingSystem instance.
   *
   * @param {OperatingSystem} os
   * @api public
   */
  set: function set(os) {
    if (!(os instanceof OperatingSystem)) return false;

    return Object.defineProperty(this, 'os', {
      value: os
    }).os;
  }
});

/**
 * OnDemand parsing of the Device type.
 *
 * @type {Device}
 * @api public
 */
Object.defineProperty(Agent.prototype, 'device', {
  get: function lazyparse() {
    var userAgent = this.source
      , length = deviceparserslength
      , parsers = deviceparsers
      , i = 0
      , parser
      , res;

    for (; i < length; i++) {
      if (res = parsers[i][0].exec(userAgent)) {
        parser = parsers[i];

        if (parser[1]) res[1] = parser[1].replace('$1', res[1]);
        break;
      }
    }

    return Object.defineProperty(this, 'device', {
        value: !parser || !res
          ? new Device()
          : new Device(
                res[1]
              , parser[2] || res[2]
              , parser[3] || res[3]
              , parser[4] || res[4]
            )
    }).device;
  },

  /**
   * Bypass the OnDemand parsing and set an Device instance.
   *
   * @param {Device} device
   * @api public
   */
  set: function set(device) {
    if (!(device instanceof Device)) return false;

    return Object.defineProperty(this, 'device', {
      value: device
    }).device;
  }
});
/*** Generates a string output of the parsed user agent.
 *
 * @returns {String}
 * @api public
 */
Agent.prototype.toAgent = function toAgent() {
  var output = this.family
    , version = this.toVersion();

  if (version) output += ' '+ version;
  return output;
};

/**
 * Generates a string output of the parser user agent and operating system.
 *
 * @returns {String}  "UserAgent 0.0.0 / OS"
 * @api public
 */
Agent.prototype.toString = function toString() {
  var agent = this.toAgent()
    , os = this.os !== 'Other' ? this.os : false;

  return agent + (os ? ' / ' + os : '');
};

/**
 * Outputs a compiled veersion number of the user agent.
 *
 * @returns {String}
 * @api public
 */
Agent.prototype.toVersion = function toVersion() {
  var version = '';

  if (this.major) {
    version += this.major;

    if (this.minor) {
     version += '.' + this.minor;

     // Special case here, the patch can also be Alpha, Beta etc so we need
     // to check if it's a string or not.
     if (this.patch) {
      version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
     }
    }
  }

  return version;
};

/**
 * Outputs a JSON string of the Agent.
 *
 * @returns {String}
 * @api public
 */
Agent.prototype.toJSON = function toJSON() {
  return {
      family: this.family
    , major: this.major
    , minor: this.minor
    , patch: this.patch
    , device: this.device
    , os: this.os
  };
};

/**
 * The representation of a parsed Operating System.
 *
 * @constructor
 * @param {String} family The name of the os
 * @param {String} major Major version of the os
 * @param {String} minor Minor version of the os
 * @param {String} patch Patch version of the os
 * @api public
 */
function OperatingSystem(family, major, minor, patch) {
  this.family = family || 'Other';
  this.major = major || '';
  this.minor = minor || '';
  this.patch = patch || '';
}

/**
 * Generates a stringified version of the Operating System.
 *
 * @returns {String} "Operating System 0.0.0"
 * @api public
 */
OperatingSystem.prototype.toString = function toString() {
  var output = this.family
    , version = this.toVersion();

  if (version) output += ' '+ version;
  return output;
};

/**
 * Generates the version of the Operating System.
 *
 * @returns {String}
 * @api public
 */
OperatingSystem.prototype.toVersion = function toVersion() {
  var version = '';

  if (this.major) {
    version += this.major;

    if (this.minor) {
     version += '.' + this.minor;

     // Special case here, the patch can also be Alpha, Beta etc so we need
     // to check if it's a string or not.
     if (this.patch) {
      version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
     }
    }
  }

  return version;
};

/**
 * Outputs a JSON string of the OS, values are defaulted to undefined so they
 * are not outputed in the stringify.
 *
 * @returns {String}
 * @api public
 */
OperatingSystem.prototype.toJSON = function toJSON(){
  return {
      family: this.family
    , major: this.major || undefined
    , minor: this.minor || undefined
    , patch: this.patch || undefined
  };
};

/**
 * The representation of a parsed Device.
 *
 * @constructor
 * @param {String} family The name of the os
 * @api public
 */
function Device(family, major, minor, patch) {
  this.family = family || 'Other';
  this.major = major || '';
  this.minor = minor || '';
  this.patch = patch || '';
}

/**
 * Generates a stringified version of the Device.
 *
 * @returns {String} "Device 0.0.0"
 * @api public
 */
Device.prototype.toString = function toString() {
  var output = this.family
    , version = this.toVersion();

  if (version) output += ' '+ version;
  return output;
};

/**
 * Generates the version of the Device.
 *
 * @returns {String}
 * @api public
 */
Device.prototype.toVersion = function toVersion() {
  var version = '';

  if (this.major) {
    version += this.major;

    if (this.minor) {
     version += '.' + this.minor;

     // Special case here, the patch can also be Alpha, Beta etc so we need
     // to check if it's a string or not.
     if (this.patch) {
      version += (isNaN(+this.patch) ? ' ' : '.') + this.patch;
     }
    }
  }

  return version;
};

/**
 * Get string representation.
 *
 * @returns {String}
 * @api public
 */
Device.prototype.toString = function toString() {
  var output = this.family
    , version = this.toVersion();

  if (version) output += ' '+ version;
  return output;
};

/**
 * Outputs a JSON string of the Device, values are defaulted to undefined so they
 * are not outputed in the stringify.
 *
 * @returns {String}
 * @api public
 */
Device.prototype.toJSON = function toJSON() {
  return {
      family: this.family
    , major: this.major || undefined
    , minor: this.minor || undefined
    , patch: this.patch || undefined
  };
};

/**
 * Small nifty thick that allows us to download a fresh set regexs from t3h
 * Int3rNetz when we want to. We will be using the compiled version by default
 * but users can opt-in for updates.
 *
 * @param {Boolean} refresh Refresh the dataset from the remote
 * @api public
 */
module.exports = function updater() {
  try {
    require('./lib/update').update(function updating(err, results) {
      if (err) {
        console.log('[useragent] Failed to update the parsed due to an error:');
        console.log('[useragent] '+ (err.message ? err.message : err));
        return;
      }

      regexps = results;

      // OperatingSystem parsers:
      osparsers = regexps.os;
      osparserslength = osparsers.length;

      // UserAgent parsers:
      agentparsers = regexps.browser;
      agentparserslength = agentparsers.length;

      // Device parsers:
      deviceparsers = regexps.device;
      deviceparserslength = deviceparsers.length;
    });
  } catch (e) {
    console.error('[useragent] If you want to use automatic updating, please add:');
    console.error('[useragent]   - request (npm install request --save)');
    console.error('[useragent]   - yamlparser (npm install yamlparser --save)');
    console.error('[useragent] To your own package.json');
  }
};

// Override the exports with our newly set module.exports
exports = module.exports;

/**
 * Nao that we have setup all the different classes and configured it we can
 * actually start assembling and exposing everything.
 */
exports.Device = Device;
exports.OperatingSystem = OperatingSystem;
exports.Agent = Agent;

/**
 * Parses the user agent string with the generated parsers from the
 * ua-parser project on google code.
 *
 * @param {String} userAgent The user agent string
 * @param {String} jsAgent Optional UA from js to detect chrome frame
 * @returns {Agent}
 * @api public
 */
exports.parse = function parse(userAgent, jsAgent) {
  if (!userAgent) return new Agent();

  var length = agentparserslength
    , parsers = agentparsers
    , i = 0
    , parser
    , res;

  for (; i < length; i++) {
    if (res = parsers[i][0].exec(userAgent)) {
      parser = parsers[i];

      if (parser[1]) res[1] = parser[1].replace('$1', res[1]);
      if (!jsAgent) return new Agent(
          res[1]
        , parser[2] || res[2]
        , parser[3] || res[3]
        , parser[4] || res[4]
        , userAgent
      );

      break;
    }
  }

  // Return early if we didn't find an match, but might still be able to parse
  // the os and device, so make sure we supply it with the source
  if (!parser || !res) return new Agent('', '', '', '', userAgent);

  // Detect Chrome Frame, but make sure it's enabled! So we need to check for
  // the Chrome/ so we know that it's actually using Chrome under the hood.
  if (jsAgent && ~jsAgent.indexOf('Chrome/') && ~userAgent.indexOf('chromeframe')) {
    res[1] = 'Chrome Frame (IE '+ res[1] +'.'+ res[2] +')';

    // Run the JavaScripted userAgent string through the parser again so we can
    // update the version numbers;
    parser = parse(jsAgent);
    parser[2] = parser.major;
    parser[3] = parser.minor;
    parser[4] = parser.patch;
  }

  return new Agent(
      res[1]
    , parser[2] || res[2]
    , parser[3] || res[3]
    , parser[4] || res[4]
    , userAgent
  );
};

/**
 * If you are doing a lot of lookups you might want to cache the results of the
 * parsed user agent string instead, in memory.
 *
 * @TODO We probably want to create 2 dictionary's here 1 for the Agent
 * instances and one for the userAgent instance mapping so we can re-use simular
 * Agent instance and lower our memory consumption.
 *
 * @param {String} userAgent The user agent string
 * @param {String} jsAgent Optional UA from js to detect chrome frame
 * @api public
 */
var LRU = require('lru-cache')(5000);
exports.lookup = function lookup(userAgent, jsAgent) {
  var key = (userAgent || '')+(jsAgent || '')
    , cached = LRU.get(key);

  if (cached) return cached;
  LRU.set(key, (cached = exports.parse(userAgent, jsAgent)));

  return cached;
};

/**
 * Does a more inaccurate but more common check for useragents identification.
 * The version detection is from the jQuery.com library and is licensed under
 * MIT.
 *
 * @param {String} useragent The user agent
 * @returns {Object} matches
 * @api public
 */
exports.is = function is(useragent) {
  var ua = (useragent || '').toLowerCase()
    , details = {
        chrome: false
      , firefox: false
      , ie: false
      , mobile_safari: false
      , mozilla: false
      , opera: false
      , safari: false
      , webkit: false
      , version: (ua.match(exports.is.versionRE) || [0, "0"])[1]
    };

  if (~ua.indexOf('webkit')) {
    details.webkit = true;

    if (~ua.indexOf('chrome')) {
      details.chrome = true;
    } else if (~ua.indexOf('safari')) {
      details.safari = true;

      if (~ua.indexOf('mobile') && ~ua.indexOf('apple')) {
        details.mobile_safari = true;
      }
    }
  } else if (~ua.indexOf('opera')) {
    details.opera = true;
  } else if (~ua.indexOf('mozilla') && !~ua.indexOf('compatible')) {
    details.mozilla = true;

    if (~ua.indexOf('firefox')) details.firefox = true;
  } else if (~ua.indexOf('msie')) {
    details.ie = true;
  }

  return details;
};

/**
 * Parses out the version numbers.
 *
 * @type {RegExp}
 * @api private
 */
exports.is.versionRE = /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/;

/**
 * Transform a JSON object back to a valid userAgent string
 *
 * @param {Object} details
 * @returns {Agent}
 */
exports.fromJSON = function fromJSON(details) {
  if (typeof details === 'string') details = JSON.parse(details);

  var agent = new Agent(details.family, details.major, details.minor, details.patch)
    , os = details.os;

  // The device family was added in v2.0
  if ('device' in details) {
    agent.device = new Device(details.device.family);
  } else {
    agent.device = new Device();
  }

  if ('os' in details && os) {
    // In v1.1.0 we only parsed out the Operating System name, not the full
    // version which we added in v2.0. To provide backwards compatible we should
    // we should set the details.os as family
    if (typeof os === 'string') {
      agent.os = new OperatingSystem(os);
    } else {
      agent.os = new OperatingSystem(os.family, os.major, os.minor, os.patch);
    }
  }

  return agent;
};

/**
 * Library version.
 *
 * @type {String}
 * @api public
 */
exports.version = require('./package.json').version;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"send":{"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/send/index.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * send
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var createError = require('http-errors')
var debug = require('debug')('send')
var deprecate = require('depd')('send')
var destroy = require('destroy')
var escapeHtml = require('escape-html')
  , parseRange = require('range-parser')
  , Stream = require('stream')
  , mime = require('mime')
  , fresh = require('fresh')
  , path = require('path')
  , fs = require('fs')
  , normalize = path.normalize
  , join = path.join
var etag = require('etag')
var EventEmitter = require('events').EventEmitter;
var ms = require('ms');
var onFinished = require('on-finished')
var statuses = require('statuses')

/**
 * Variables.
 */
var extname = path.extname
var maxMaxAge = 60 * 60 * 24 * 365 * 1000; // 1 year
var resolve = path.resolve
var sep = path.sep
var toString = Object.prototype.toString
var upPathRegexp = /(?:^|[\\\/])\.\.(?:[\\\/]|$)/

/**
 * Module exports.
 * @public
 */

module.exports = send
module.exports.mime = mime

/**
 * Shim EventEmitter.listenerCount for node.js < 0.10
 */

/* istanbul ignore next */
var listenerCount = EventEmitter.listenerCount
  || function(emitter, type){ return emitter.listeners(type).length; };

/**
 * Return a `SendStream` for `req` and `path`.
 *
 * @param {object} req
 * @param {string} path
 * @param {object} [options]
 * @return {SendStream}
 * @public
 */

function send(req, path, options) {
  return new SendStream(req, path, options);
}

/**
 * Initialize a `SendStream` with the given `path`.
 *
 * @param {Request} req
 * @param {String} path
 * @param {object} [options]
 * @private
 */

function SendStream(req, path, options) {
  var opts = options || {}

  this.options = opts
  this.path = path
  this.req = req

  this._etag = opts.etag !== undefined
    ? Boolean(opts.etag)
    : true

  this._dotfiles = opts.dotfiles !== undefined
    ? opts.dotfiles
    : 'ignore'

  if (this._dotfiles !== 'ignore' && this._dotfiles !== 'allow' && this._dotfiles !== 'deny') {
    throw new TypeError('dotfiles option must be "allow", "deny", or "ignore"')
  }

  this._hidden = Boolean(opts.hidden)

  if (opts.hidden !== undefined) {
    deprecate('hidden: use dotfiles: \'' + (this._hidden ? 'allow' : 'ignore') + '\' instead')
  }

  // legacy support
  if (opts.dotfiles === undefined) {
    this._dotfiles = undefined
  }

  this._extensions = opts.extensions !== undefined
    ? normalizeList(opts.extensions, 'extensions option')
    : []

  this._index = opts.index !== undefined
    ? normalizeList(opts.index, 'index option')
    : ['index.html']

  this._lastModified = opts.lastModified !== undefined
    ? Boolean(opts.lastModified)
    : true

  this._maxage = opts.maxAge || opts.maxage
  this._maxage = typeof this._maxage === 'string'
    ? ms(this._maxage)
    : Number(this._maxage)
  this._maxage = !isNaN(this._maxage)
    ? Math.min(Math.max(0, this._maxage), maxMaxAge)
    : 0

  this._root = opts.root
    ? resolve(opts.root)
    : null

  if (!this._root && opts.from) {
    this.from(opts.from)
  }
}

/**
 * Inherits from `Stream.prototype`.
 */

SendStream.prototype.__proto__ = Stream.prototype;

/**
 * Enable or disable etag generation.
 *
 * @param {Boolean} val
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.etag = deprecate.function(function etag(val) {
  val = Boolean(val);
  debug('etag %s', val);
  this._etag = val;
  return this;
}, 'send.etag: pass etag as option');

/**
 * Enable or disable "hidden" (dot) files.
 *
 * @param {Boolean} path
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.hidden = deprecate.function(function hidden(val) {
  val = Boolean(val);
  debug('hidden %s', val);
  this._hidden = val;
  this._dotfiles = undefined
  return this;
}, 'send.hidden: use dotfiles option');

/**
 * Set index `paths`, set to a falsy
 * value to disable index support.
 *
 * @param {String|Boolean|Array} paths
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.index = deprecate.function(function index(paths) {
  var index = !paths ? [] : normalizeList(paths, 'paths argument');
  debug('index %o', paths);
  this._index = index;
  return this;
}, 'send.index: pass index as option');

/**
 * Set root `path`.
 *
 * @param {String} path
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.root = function(path){
  path = String(path);
  this._root = resolve(path)
  return this;
};

SendStream.prototype.from = deprecate.function(SendStream.prototype.root,
  'send.from: pass root as option');

SendStream.prototype.root = deprecate.function(SendStream.prototype.root,
  'send.root: pass root as option');

/**
 * Set max-age to `maxAge`.
 *
 * @param {Number} maxAge
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.maxage = deprecate.function(function maxage(maxAge) {
  maxAge = typeof maxAge === 'string'
    ? ms(maxAge)
    : Number(maxAge);
  if (isNaN(maxAge)) maxAge = 0;
  if (Infinity == maxAge) maxAge = 60 * 60 * 24 * 365 * 1000;
  debug('max-age %d', maxAge);
  this._maxage = maxAge;
  return this;
}, 'send.maxage: pass maxAge as option');

/**
 * Emit error with `status`.
 *
 * @param {number} status
 * @param {Error} [error]
 * @private
 */

SendStream.prototype.error = function error(status, error) {
  // emit if listeners instead of responding
  if (listenerCount(this, 'error') !== 0) {
    return this.emit('error', createError(error, status, {
      expose: false
    }))
  }

  var res = this.res
  var msg = statuses[status]

  // wipe all existing headers
  res._headers = null

  // send basic response
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
  res.setHeader('Content-Length', Buffer.byteLength(msg))
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(msg)
}

/**
 * Check if the pathname ends with "/".
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.hasTrailingSlash = function(){
  return '/' == this.path[this.path.length - 1];
};

/**
 * Check if this is a conditional GET request.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isConditionalGET = function(){
  return this.req.headers['if-none-match']
    || this.req.headers['if-modified-since'];
};

/**
 * Strip content-* header fields.
 *
 * @private
 */

SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields() {
  var res = this.res
  var headers = Object.keys(res._headers || {})

  for (var i = 0; i < headers.length; i++) {
    var header = headers[i]
    if (header.substr(0, 8) === 'content-' && header !== 'content-location') {
      res.removeHeader(header)
    }
  }
}

/**
 * Respond with 304 not modified.
 *
 * @api private
 */

SendStream.prototype.notModified = function(){
  var res = this.res;
  debug('not modified');
  this.removeContentHeaderFields();
  res.statusCode = 304;
  res.end();
};

/**
 * Raise error that headers already sent.
 *
 * @api private
 */

SendStream.prototype.headersAlreadySent = function headersAlreadySent(){
  var err = new Error('Can\'t set headers after they are sent.');
  debug('headers already sent');
  this.error(500, err);
};

/**
 * Check if the request is cacheable, aka
 * responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isCachable = function(){
  var res = this.res;
  return (res.statusCode >= 200 && res.statusCode < 300) || 304 == res.statusCode;
};

/**
 * Handle stat() error.
 *
 * @param {Error} error
 * @private
 */

SendStream.prototype.onStatError = function onStatError(error) {
  switch (error.code) {
    case 'ENAMETOOLONG':
    case 'ENOENT':
    case 'ENOTDIR':
      this.error(404, error)
      break
    default:
      this.error(500, error)
      break
  }
}

/**
 * Check if the cache is fresh.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isFresh = function(){
  return fresh(this.req.headers, this.res._headers);
};

/**
 * Check if the range is fresh.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isRangeFresh = function isRangeFresh(){
  var ifRange = this.req.headers['if-range'];

  if (!ifRange) return true;

  return ~ifRange.indexOf('"')
    ? ~ifRange.indexOf(this.res._headers['etag'])
    : Date.parse(this.res._headers['last-modified']) <= Date.parse(ifRange);
};

/**
 * Redirect to path.
 *
 * @param {string} path
 * @private
 */

SendStream.prototype.redirect = function redirect(path) {
  if (listenerCount(this, 'directory') !== 0) {
    this.emit('directory')
    return
  }

  if (this.hasTrailingSlash()) {
    this.error(403)
    return
  }

  var loc = path + '/'
  var msg = 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>\n'
  var res = this.res

  // redirect
  res.statusCode = 301
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Content-Length', Buffer.byteLength(msg))
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Location', loc)
  res.end(msg)
}

/**
 * Pipe to `res.
 *
 * @param {Stream} res
 * @return {Stream} res
 * @api public
 */

SendStream.prototype.pipe = function(res){
  var self = this
    , args = arguments
    , root = this._root;

  // references
  this.res = res;

  // decode the path
  var path = decode(this.path)
  if (path === -1) return this.error(400)

  // null byte(s)
  if (~path.indexOf('\0')) return this.error(400);

  var parts
  if (root !== null) {
    // malicious path
    if (upPathRegexp.test(normalize('.' + sep + path))) {
      debug('malicious path "%s"', path)
      return this.error(403)
    }

    // join / normalize from optional root dir
    path = normalize(join(root, path))
    root = normalize(root + sep)

    // explode path parts
    parts = path.substr(root.length).split(sep)
  } else {
    // ".." is malicious without "root"
    if (upPathRegexp.test(path)) {
      debug('malicious path "%s"', path)
      return this.error(403)
    }

    // explode path parts
    parts = normalize(path).split(sep)

    // resolve the path
    path = resolve(path)
  }

  // dotfile handling
  if (containsDotFile(parts)) {
    var access = this._dotfiles

    // legacy support
    if (access === undefined) {
      access = parts[parts.length - 1][0] === '.'
        ? (this._hidden ? 'allow' : 'ignore')
        : 'allow'
    }

    debug('%s dotfile "%s"', access, path)
    switch (access) {
      case 'allow':
        break
      case 'deny':
        return this.error(403)
      case 'ignore':
      default:
        return this.error(404)
    }
  }

  // index file support
  if (this._index.length && this.path[this.path.length - 1] === '/') {
    this.sendIndex(path);
    return res;
  }

  this.sendFile(path);
  return res;
};

/**
 * Transfer `path`.
 *
 * @param {String} path
 * @api public
 */

SendStream.prototype.send = function(path, stat){
  var len = stat.size;
  var options = this.options
  var opts = {}
  var res = this.res;
  var req = this.req;
  var ranges = req.headers.range;
  var offset = options.start || 0;

  if (res._header) {
    // impossible to send now
    return this.headersAlreadySent();
  }

  debug('pipe "%s"', path)

  // set header fields
  this.setHeader(path, stat);

  // set content-type
  this.type(path);

  // conditional GET support
  if (this.isConditionalGET()
    && this.isCachable()
    && this.isFresh()) {
    return this.notModified();
  }

  // adjust len to start/end options
  len = Math.max(0, len - offset);
  if (options.end !== undefined) {
    var bytes = options.end - offset + 1;
    if (len > bytes) len = bytes;
  }

  // Range support
  if (ranges) {
    ranges = parseRange(len, ranges);

    // If-Range support
    if (!this.isRangeFresh()) {
      debug('range stale');
      ranges = -2;
    }

    // unsatisfiable
    if (-1 == ranges) {
      debug('range unsatisfiable');
      res.setHeader('Content-Range', 'bytes */' + stat.size);
      return this.error(416);
    }

    // valid (syntactically invalid/multiple ranges are treated as a regular response)
    if (-2 != ranges && ranges.length === 1) {
      debug('range %j', ranges);

      // Content-Range
      res.statusCode = 206;
      res.setHeader('Content-Range', 'bytes '
        + ranges[0].start
        + '-'
        + ranges[0].end
        + '/'
        + len);

      offset += ranges[0].start;
      len = ranges[0].end - ranges[0].start + 1;
    }
  }

  // clone options
  for (var prop in options) {
    opts[prop] = options[prop]
  }

  // set read options
  opts.start = offset
  opts.end = Math.max(offset, offset + len - 1)

  // content-length
  res.setHeader('Content-Length', len);

  // HEAD support
  if ('HEAD' == req.method) return res.end();

  this.stream(path, opts)
};

/**
 * Transfer file for `path`.
 *
 * @param {String} path
 * @api private
 */
SendStream.prototype.sendFile = function sendFile(path) {
  var i = 0
  var self = this

  debug('stat "%s"', path);
  fs.stat(path, function onstat(err, stat) {
    if (err && err.code === 'ENOENT'
      && !extname(path)
      && path[path.length - 1] !== sep) {
      // not found, check extensions
      return next(err)
    }
    if (err) return self.onStatError(err)
    if (stat.isDirectory()) return self.redirect(self.path)
    self.emit('file', path, stat)
    self.send(path, stat)
  })

  function next(err) {
    if (self._extensions.length <= i) {
      return err
        ? self.onStatError(err)
        : self.error(404)
    }

    var p = path + '.' + self._extensions[i++]

    debug('stat "%s"', p)
    fs.stat(p, function (err, stat) {
      if (err) return next(err)
      if (stat.isDirectory()) return next()
      self.emit('file', p, stat)
      self.send(p, stat)
    })
  }
}

/**
 * Transfer index for `path`.
 *
 * @param {String} path
 * @api private
 */
SendStream.prototype.sendIndex = function sendIndex(path){
  var i = -1;
  var self = this;

  function next(err){
    if (++i >= self._index.length) {
      if (err) return self.onStatError(err);
      return self.error(404);
    }

    var p = join(path, self._index[i]);

    debug('stat "%s"', p);
    fs.stat(p, function(err, stat){
      if (err) return next(err);
      if (stat.isDirectory()) return next();
      self.emit('file', p, stat);
      self.send(p, stat);
    });
  }

  next();
};

/**
 * Stream `path` to the response.
 *
 * @param {String} path
 * @param {Object} options
 * @api private
 */

SendStream.prototype.stream = function(path, options){
  // TODO: this is all lame, refactor meeee
  var finished = false;
  var self = this;
  var res = this.res;
  var req = this.req;

  // pipe
  var stream = fs.createReadStream(path, options);
  this.emit('stream', stream);
  stream.pipe(res);

  // response finished, done with the fd
  onFinished(res, function onfinished(){
    finished = true;
    destroy(stream);
  });

  // error handling code-smell
  stream.on('error', function onerror(err){
    // request already finished
    if (finished) return;

    // clean up stream
    finished = true;
    destroy(stream);

    // error
    self.onStatError(err);
  });

  // end
  stream.on('end', function onend(){
    self.emit('end');
  });
};

/**
 * Set content-type based on `path`
 * if it hasn't been explicitly set.
 *
 * @param {String} path
 * @api private
 */

SendStream.prototype.type = function(path){
  var res = this.res;
  if (res.getHeader('Content-Type')) return;
  var type = mime.lookup(path);
  var charset = mime.charsets.lookup(type);
  debug('content-type %s', type);
  res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
};

/**
 * Set response header fields, most
 * fields may be pre-defined.
 *
 * @param {String} path
 * @param {Object} stat
 * @api private
 */

SendStream.prototype.setHeader = function setHeader(path, stat){
  var res = this.res;

  this.emit('headers', res, path, stat);

  if (!res.getHeader('Accept-Ranges')) res.setHeader('Accept-Ranges', 'bytes');
  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + Math.floor(this._maxage / 1000));

  if (this._lastModified && !res.getHeader('Last-Modified')) {
    var modified = stat.mtime.toUTCString()
    debug('modified %s', modified)
    res.setHeader('Last-Modified', modified)
  }

  if (this._etag && !res.getHeader('ETag')) {
    var val = etag(stat)
    debug('etag %s', val)
    res.setHeader('ETag', val)
  }
};

/**
 * Determine if path parts contain a dotfile.
 *
 * @api private
 */

function containsDotFile(parts) {
  for (var i = 0; i < parts.length; i++) {
    if (parts[i][0] === '.') {
      return true
    }
  }

  return false
}

/**
 * decodeURIComponent.
 *
 * Allows V8 to only deoptimize this fn instead of all
 * of send().
 *
 * @param {String} path
 * @api private
 */

function decode(path) {
  try {
    return decodeURIComponent(path)
  } catch (err) {
    return -1
  }
}

/**
 * Normalize the index option into an array.
 *
 * @param {boolean|string|array} val
 * @param {string} name
 * @private
 */

function normalizeList(val, name) {
  var list = [].concat(val || [])

  for (var i = 0; i < list.length; i++) {
    if (typeof list[i] !== 'string') {
      throw new TypeError(name + ' must be array of strings or false')
    }
  }

  return list
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/webapp/webapp_server.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.webapp = exports, {
  WebApp: WebApp,
  WebAppInternals: WebAppInternals,
  main: main
});

})();

//# sourceMappingURL=webapp.js.map

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

/* Package-scope variables */
var memoizedBoilerplate, exports, WebApp, WebAppInternals, main;

var require = meteorInstall({"node_modules":{"meteor":{"webapp":{"webapp_server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/webapp_server.js                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const module1 = module;
module1.export({
  WebApp: () => WebApp,
  WebAppInternals: () => WebAppInternals
});
let assert;
module1.watch(require("assert"), {
  default(v) {
    assert = v;
  }

}, 0);
let readFile;
module1.watch(require("fs"), {
  readFile(v) {
    readFile = v;
  }

}, 1);
let createServer;
module1.watch(require("http"), {
  createServer(v) {
    createServer = v;
  }

}, 2);
let pathJoin, pathDirname;
module1.watch(require("path"), {
  join(v) {
    pathJoin = v;
  },

  dirname(v) {
    pathDirname = v;
  }

}, 3);
let parseUrl;
module1.watch(require("url"), {
  parse(v) {
    parseUrl = v;
  }

}, 4);
let createHash;
module1.watch(require("crypto"), {
  createHash(v) {
    createHash = v;
  }

}, 5);
let connect;
module1.watch(require("./connect.js"), {
  connect(v) {
    connect = v;
  }

}, 6);
let compress;
module1.watch(require("compression"), {
  default(v) {
    compress = v;
  }

}, 7);
let cookieParser;
module1.watch(require("cookie-parser"), {
  default(v) {
    cookieParser = v;
  }

}, 8);
let query;
module1.watch(require("qs-middleware"), {
  default(v) {
    query = v;
  }

}, 9);
let parseRequest;
module1.watch(require("parseurl"), {
  default(v) {
    parseRequest = v;
  }

}, 10);
let basicAuth;
module1.watch(require("basic-auth-connect"), {
  default(v) {
    basicAuth = v;
  }

}, 11);
let lookupUserAgent;
module1.watch(require("useragent"), {
  lookup(v) {
    lookupUserAgent = v;
  }

}, 12);
let send;
module1.watch(require("send"), {
  default(v) {
    send = v;
  }

}, 13);
let removeExistingSocketFile, registerSocketFileCleanup;
module1.watch(require("./socket_file.js"), {
  removeExistingSocketFile(v) {
    removeExistingSocketFile = v;
  },

  registerSocketFileCleanup(v) {
    registerSocketFileCleanup = v;
  }

}, 14);
var SHORT_SOCKET_TIMEOUT = 5 * 1000;
var LONG_SOCKET_TIMEOUT = 120 * 1000;
const WebApp = {};
const WebAppInternals = {};
// backwards compat to 2.0 of connect
connect.basicAuth = basicAuth;
WebAppInternals.NpmModules = {
  connect: {
    version: Npm.require('connect/package.json').version,
    module: connect
  }
};
WebApp.defaultArch = 'web.browser'; // XXX maps archs to manifests

WebApp.clientPrograms = {}; // XXX maps archs to program path on filesystem

var archPath = {};

var bundledJsCssUrlRewriteHook = function (url) {
  var bundledPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
  return bundledPrefix + url;
};

var sha1 = function (contents) {
  var hash = createHash('sha1');
  hash.update(contents);
  return hash.digest('hex');
};

var readUtf8FileSync = function (filename) {
  return Meteor.wrapAsync(readFile)(filename, 'utf8');
}; // #BrowserIdentification
//
// We have multiple places that want to identify the browser: the
// unsupported browser page, the appcache package, and, eventually
// delivering browser polyfills only as needed.
//
// To avoid detecting the browser in multiple places ad-hoc, we create a
// Meteor "browser" object. It uses but does not expose the npm
// useragent module (we could choose a different mechanism to identify
// the browser in the future if we wanted to).  The browser object
// contains
//
// * `name`: the name of the browser in camel case
// * `major`, `minor`, `patch`: integers describing the browser version
//
// Also here is an early version of a Meteor `request` object, intended
// to be a high-level description of the request without exposing
// details of connect's low-level `req`.  Currently it contains:
//
// * `browser`: browser identification object described above
// * `url`: parsed url, including parsed query params
//
// As a temporary hack there is a `categorizeRequest` function on WebApp which
// converts a connect `req` to a Meteor `request`. This can go away once smart
// packages such as appcache are being passed a `request` object directly when
// they serve content.
//
// This allows `request` to be used uniformly: it is passed to the html
// attributes hook, and the appcache package can use it when deciding
// whether to generate a 404 for the manifest.
//
// Real routing / server side rendering will probably refactor this
// heavily.
// e.g. "Mobile Safari" => "mobileSafari"


var camelCase = function (name) {
  var parts = name.split(' ');
  parts[0] = parts[0].toLowerCase();

  for (var i = 1; i < parts.length; ++i) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substr(1);
  }

  return parts.join('');
};

var identifyBrowser = function (userAgentString) {
  var userAgent = lookupUserAgent(userAgentString);
  return {
    name: camelCase(userAgent.family),
    major: +userAgent.major,
    minor: +userAgent.minor,
    patch: +userAgent.patch
  };
}; // XXX Refactor as part of implementing real routing.


WebAppInternals.identifyBrowser = identifyBrowser;

WebApp.categorizeRequest = function (req) {
  return _.extend({
    browser: identifyBrowser(req.headers['user-agent']),
    url: parseUrl(req.url, true)
  }, _.pick(req, 'dynamicHead', 'dynamicBody', 'headers', 'cookies'));
}; // HTML attribute hooks: functions to be called to determine any attributes to
// be added to the '<html>' tag. Each function is passed a 'request' object (see
// #BrowserIdentification) and should return null or object.


var htmlAttributeHooks = [];

var getHtmlAttributes = function (request) {
  var combinedAttributes = {};

  _.each(htmlAttributeHooks || [], function (hook) {
    var attributes = hook(request);
    if (attributes === null) return;
    if (typeof attributes !== 'object') throw Error("HTML attribute hook must return null or object");

    _.extend(combinedAttributes, attributes);
  });

  return combinedAttributes;
};

WebApp.addHtmlAttributeHook = function (hook) {
  htmlAttributeHooks.push(hook);
}; // Serve app HTML for this URL?


var appUrl = function (url) {
  if (url === '/favicon.ico' || url === '/robots.txt') return false; // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file name we have chosen to use for HTML5
  // appcache URLs. It is included here to prevent using an appcache
  // then removing it from poisoning an app permanently. Eventually,
  // once we have server side routing, this won't be needed as
  // unknown URLs with return a 404 automatically.

  if (url === '/app.manifest') return false; // Avoid serving app HTML for declared routes such as /sockjs/.

  if (RoutePolicy.classify(url)) return false; // we currently return app HTML on all URLs by default

  return true;
}; // We need to calculate the client hash after all packages have loaded
// to give them a chance to populate __meteor_runtime_config__.
//
// Calculating the hash during startup means that packages can only
// populate __meteor_runtime_config__ during load, not during startup.
//
// Calculating instead it at the beginning of main after all startup
// hooks had run would allow packages to also populate
// __meteor_runtime_config__ during startup, but that's too late for
// autoupdate because it needs to have the client hash at startup to
// insert the auto update version itself into
// __meteor_runtime_config__ to get it to the client.
//
// An alternative would be to give autoupdate a "post-start,
// pre-listen" hook to allow it to insert the auto update version at
// the right moment.


Meteor.startup(function () {
  var calculateClientHash = WebAppHashing.calculateClientHash;

  WebApp.clientHash = function (archName) {
    archName = archName || WebApp.defaultArch;
    return calculateClientHash(WebApp.clientPrograms[archName].manifest);
  };

  WebApp.calculateClientHashRefreshable = function (archName) {
    archName = archName || WebApp.defaultArch;
    return calculateClientHash(WebApp.clientPrograms[archName].manifest, function (name) {
      return name === "css";
    });
  };

  WebApp.calculateClientHashNonRefreshable = function (archName) {
    archName = archName || WebApp.defaultArch;
    return calculateClientHash(WebApp.clientPrograms[archName].manifest, function (name) {
      return name !== "css";
    });
  };

  WebApp.calculateClientHashCordova = function () {
    var archName = 'web.cordova';
    if (!WebApp.clientPrograms[archName]) return 'none';
    return calculateClientHash(WebApp.clientPrograms[archName].manifest, null, _.pick(__meteor_runtime_config__, 'PUBLIC_SETTINGS'));
  };
}); // When we have a request pending, we want the socket timeout to be long, to
// give ourselves a while to serve it, and to allow sockjs long polls to
// complete.  On the other hand, we want to close idle sockets relatively
// quickly, so that we can shut down relatively promptly but cleanly, without
// cutting off anyone's response.

WebApp._timeoutAdjustmentRequestCallback = function (req, res) {
  // this is really just req.socket.setTimeout(LONG_SOCKET_TIMEOUT);
  req.setTimeout(LONG_SOCKET_TIMEOUT); // Insert our new finish listener to run BEFORE the existing one which removes
  // the response from the socket.

  var finishListeners = res.listeners('finish'); // XXX Apparently in Node 0.12 this event was called 'prefinish'.
  // https://github.com/joyent/node/commit/7c9b6070
  // But it has switched back to 'finish' in Node v4:
  // https://github.com/nodejs/node/pull/1411

  res.removeAllListeners('finish');
  res.on('finish', function () {
    res.setTimeout(SHORT_SOCKET_TIMEOUT);
  });

  _.each(finishListeners, function (l) {
    res.on('finish', l);
  });
}; // Will be updated by main before we listen.
// Map from client arch to boilerplate object.
// Boilerplate object has:
//   - func: XXX
//   - baseData: XXX


var boilerplateByArch = {}; // Register a callback function that can selectively modify boilerplate
// data given arguments (request, data, arch). The key should be a unique
// identifier, to prevent accumulating duplicate callbacks from the same
// call site over time. Callbacks will be called in the order they were
// registered. A callback should return false if it did not make any
// changes affecting the boilerplate. Passing null deletes the callback.
// Any previous callback registered for this key will be returned.

const boilerplateDataCallbacks = Object.create(null);

WebAppInternals.registerBoilerplateDataCallback = function (key, callback) {
  const previousCallback = boilerplateDataCallbacks[key];

  if (typeof callback === "function") {
    boilerplateDataCallbacks[key] = callback;
  } else {
    assert.strictEqual(callback, null);
    delete boilerplateDataCallbacks[key];
  } // Return the previous callback in case the new callback needs to call
  // it; for example, when the new callback is a wrapper for the old.


  return previousCallback || null;
}; // Given a request (as returned from `categorizeRequest`), return the
// boilerplate HTML to serve for that request.
//
// If a previous connect middleware has rendered content for the head or body,
// returns the boilerplate with that content patched in otherwise
// memoizes on HTML attributes (used by, eg, appcache) and whether inline
// scripts are currently allowed.
// XXX so far this function is always called with arch === 'web.browser'


function getBoilerplate(request, arch) {
  return getBoilerplateAsync(request, arch).await();
}

function getBoilerplateAsync(request, arch) {
  const boilerplate = boilerplateByArch[arch];
  const data = Object.assign({}, boilerplate.baseData, {
    htmlAttributes: getHtmlAttributes(request)
  }, _.pick(request, "dynamicHead", "dynamicBody"));
  let madeChanges = false;
  let promise = Promise.resolve();
  Object.keys(boilerplateDataCallbacks).forEach(key => {
    promise = promise.then(() => {
      const callback = boilerplateDataCallbacks[key];
      return callback(request, data, arch);
    }).then(result => {
      // Callbacks should return false if they did not make any changes.
      if (result !== false) {
        madeChanges = true;
      }
    });
  });
  return promise.then(() => ({
    stream: boilerplate.toHTMLStream(data),
    statusCode: data.statusCode,
    headers: data.headers
  }));
}

WebAppInternals.generateBoilerplateInstance = function (arch, manifest, additionalOptions) {
  additionalOptions = additionalOptions || {};

  var runtimeConfig = _.extend(_.clone(__meteor_runtime_config__), additionalOptions.runtimeConfigOverrides || {});

  return new Boilerplate(arch, manifest, _.extend({
    pathMapper: function (itemPath) {
      return pathJoin(archPath[arch], itemPath);
    },
    baseDataExtension: {
      additionalStaticJs: _.map(additionalStaticJs || [], function (contents, pathname) {
        return {
          pathname: pathname,
          contents: contents
        };
      }),
      // Convert to a JSON string, then get rid of most weird characters, then
      // wrap in double quotes. (The outermost JSON.stringify really ought to
      // just be "wrap in double quotes" but we use it to be safe.) This might
      // end up inside a <script> tag so we need to be careful to not include
      // "</script>", but normal {{spacebars}} escaping escapes too much! See
      // https://github.com/meteor/meteor/issues/3730
      meteorRuntimeConfig: JSON.stringify(encodeURIComponent(JSON.stringify(runtimeConfig))),
      rootUrlPathPrefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '',
      bundledJsCssUrlRewriteHook: bundledJsCssUrlRewriteHook,
      inlineScriptsAllowed: WebAppInternals.inlineScriptsAllowed(),
      inline: additionalOptions.inline
    }
  }, additionalOptions));
}; // A mapping from url path to "info". Where "info" has the following fields:
// - type: the type of file to be served
// - cacheable: optionally, whether the file should be cached or not
// - sourceMapUrl: optionally, the url of the source map
//
// Info also contains one of the following:
// - content: the stringified content that should be served at this path
// - absolutePath: the absolute path on disk to the file


var staticFiles; // Serve static files from the manifest or added with
// `addStaticJs`. Exported for tests.

WebAppInternals.staticFilesMiddleware = function (staticFiles, req, res, next) {
  if ('GET' != req.method && 'HEAD' != req.method && 'OPTIONS' != req.method) {
    next();
    return;
  }

  var pathname = parseRequest(req).pathname;

  try {
    pathname = decodeURIComponent(pathname);
  } catch (e) {
    next();
    return;
  }

  var serveStaticJs = function (s) {
    res.writeHead(200, {
      'Content-type': 'application/javascript; charset=UTF-8'
    });
    res.write(s);
    res.end();
  };

  if (pathname === "/meteor_runtime_config.js" && !WebAppInternals.inlineScriptsAllowed()) {
    serveStaticJs("__meteor_runtime_config__ = " + JSON.stringify(__meteor_runtime_config__) + ";");
    return;
  } else if (_.has(additionalStaticJs, pathname) && !WebAppInternals.inlineScriptsAllowed()) {
    serveStaticJs(additionalStaticJs[pathname]);
    return;
  }

  if (!_.has(staticFiles, pathname)) {
    next();
    return;
  } // We don't need to call pause because, unlike 'static', once we call into
  // 'send' and yield to the event loop, we never call another handler with
  // 'next'.


  var info = staticFiles[pathname]; // Cacheable files are files that should never change. Typically
  // named by their hash (eg meteor bundled js and css files).
  // We cache them ~forever (1yr).

  var maxAge = info.cacheable ? 1000 * 60 * 60 * 24 * 365 : 0; // Set the X-SourceMap header, which current Chrome, FireFox, and Safari
  // understand.  (The SourceMap header is slightly more spec-correct but FF
  // doesn't understand it.)
  //
  // You may also need to enable source maps in Chrome: open dev tools, click
  // the gear in the bottom right corner, and select "enable source maps".

  if (info.sourceMapUrl) {
    res.setHeader('X-SourceMap', __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + info.sourceMapUrl);
  }

  if (info.type === "js" || info.type === "dynamic js") {
    res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
  } else if (info.type === "css") {
    res.setHeader("Content-Type", "text/css; charset=UTF-8");
  } else if (info.type === "json") {
    res.setHeader("Content-Type", "application/json; charset=UTF-8");
  }

  if (info.hash) {
    res.setHeader('ETag', '"' + info.hash + '"');
  }

  if (info.content) {
    res.write(info.content);
    res.end();
  } else {
    send(req, info.absolutePath, {
      maxage: maxAge,
      dotfiles: 'allow',
      // if we specified a dotfile in the manifest, serve it
      lastModified: false // don't set last-modified based on the file date

    }).on('error', function (err) {
      Log.error("Error serving static file " + err);
      res.writeHead(500);
      res.end();
    }).on('directory', function () {
      Log.error("Unexpected directory " + info.absolutePath);
      res.writeHead(500);
      res.end();
    }).pipe(res);
  }
};

var getUrlPrefixForArch = function (arch) {
  // XXX we rely on the fact that arch names don't contain slashes
  // in that case we would need to uri escape it
  // We add '__' to the beginning of non-standard archs to "scope" the url
  // to Meteor internals.
  return arch === WebApp.defaultArch ? '' : '/' + '__' + arch.replace(/^web\./, '');
}; // Parse the passed in port value. Return the port as-is if it's a String
// (e.g. a Windows Server style named pipe), otherwise return the port as an
// integer.
//
// DEPRECATED: Direct use of this function is not recommended; it is no
// longer used internally, and will be removed in a future release.


WebAppInternals.parsePort = port => {
  let parsedPort = parseInt(port);

  if (Number.isNaN(parsedPort)) {
    parsedPort = port;
  }

  return parsedPort;
};

function runWebAppServer() {
  var shuttingDown = false;
  var syncQueue = new Meteor._SynchronousQueue();

  var getItemPathname = function (itemUrl) {
    return decodeURIComponent(parseUrl(itemUrl).pathname);
  };

  WebAppInternals.reloadClientPrograms = function () {
    syncQueue.runTask(function () {
      staticFiles = {};

      var generateClientProgram = function (clientPath, arch) {
        // read the control for the client we'll be serving up
        var clientJsonPath = pathJoin(__meteor_bootstrap__.serverDir, clientPath);
        var clientDir = pathDirname(clientJsonPath);
        var clientJson = JSON.parse(readUtf8FileSync(clientJsonPath));
        if (clientJson.format !== "web-program-pre1") throw new Error("Unsupported format for client assets: " + JSON.stringify(clientJson.format));
        if (!clientJsonPath || !clientDir || !clientJson) throw new Error("Client config file not parsed.");
        var urlPrefix = getUrlPrefixForArch(arch);
        var manifest = clientJson.manifest;

        _.each(manifest, function (item) {
          if (item.url && item.where === "client") {
            staticFiles[urlPrefix + getItemPathname(item.url)] = {
              absolutePath: pathJoin(clientDir, item.path),
              cacheable: item.cacheable,
              hash: item.hash,
              // Link from source to its map
              sourceMapUrl: item.sourceMapUrl,
              type: item.type
            };

            if (item.sourceMap) {
              // Serve the source map too, under the specified URL. We assume all
              // source maps are cacheable.
              staticFiles[urlPrefix + getItemPathname(item.sourceMapUrl)] = {
                absolutePath: pathJoin(clientDir, item.sourceMap),
                cacheable: true
              };
            }
          }
        });

        var program = {
          format: "web-program-pre1",
          manifest: manifest,
          version: process.env.AUTOUPDATE_VERSION || WebAppHashing.calculateClientHash(manifest, null, _.pick(__meteor_runtime_config__, "PUBLIC_SETTINGS")),
          cordovaCompatibilityVersions: clientJson.cordovaCompatibilityVersions,
          PUBLIC_SETTINGS: __meteor_runtime_config__.PUBLIC_SETTINGS
        };
        WebApp.clientPrograms[arch] = program; // Expose program details as a string reachable via the following
        // URL.

        const manifestUrlPrefix = "/__" + arch.replace(/^web\./, "");
        const manifestUrl = manifestUrlPrefix + getItemPathname("/manifest.json");
        staticFiles[manifestUrl] = {
          content: JSON.stringify(program),
          cacheable: false,
          hash: program.version,
          type: "json"
        };
      };

      try {
        var clientPaths = __meteor_bootstrap__.configJson.clientPaths;

        _.each(clientPaths, function (clientPath, arch) {
          archPath[arch] = pathDirname(clientPath);
          generateClientProgram(clientPath, arch);
        }); // Exported for tests.


        WebAppInternals.staticFiles = staticFiles;
      } catch (e) {
        Log.error("Error reloading the client program: " + e.stack);
        process.exit(1);
      }
    });
  };

  WebAppInternals.generateBoilerplate = function () {
    // This boilerplate will be served to the mobile devices when used with
    // Meteor/Cordova for the Hot-Code Push and since the file will be served by
    // the device's server, it is important to set the DDP url to the actual
    // Meteor server accepting DDP connections and not the device's file server.
    var defaultOptionsForArch = {
      'web.cordova': {
        runtimeConfigOverrides: {
          // XXX We use absoluteUrl() here so that we serve https://
          // URLs to cordova clients if force-ssl is in use. If we were
          // to use __meteor_runtime_config__.ROOT_URL instead of
          // absoluteUrl(), then Cordova clients would immediately get a
          // HCP setting their DDP_DEFAULT_CONNECTION_URL to
          // http://example.meteor.com. This breaks the app, because
          // force-ssl doesn't serve CORS headers on 302
          // redirects. (Plus it's undesirable to have clients
          // connecting to http://example.meteor.com when force-ssl is
          // in use.)
          DDP_DEFAULT_CONNECTION_URL: process.env.MOBILE_DDP_URL || Meteor.absoluteUrl(),
          ROOT_URL: process.env.MOBILE_ROOT_URL || Meteor.absoluteUrl()
        }
      }
    };
    syncQueue.runTask(function () {
      _.each(WebApp.clientPrograms, function (program, archName) {
        boilerplateByArch[archName] = WebAppInternals.generateBoilerplateInstance(archName, program.manifest, defaultOptionsForArch[archName]);
      }); // Clear the memoized boilerplate cache.


      memoizedBoilerplate = {}; // Configure CSS injection for the default arch
      // XXX implement the CSS injection for all archs?

      var cssFiles = boilerplateByArch[WebApp.defaultArch].baseData.css; // Rewrite all CSS files (which are written directly to <style> tags)
      // by autoupdate_client to use the CDN prefix/etc

      var allCss = _.map(cssFiles, function (cssFile) {
        return {
          url: bundledJsCssUrlRewriteHook(cssFile.url)
        };
      });

      WebAppInternals.refreshableAssets = {
        allCss
      };
    });
  };

  WebAppInternals.reloadClientPrograms(); // webserver

  var app = connect(); // Packages and apps can add handlers that run before any other Meteor
  // handlers via WebApp.rawConnectHandlers.

  var rawConnectHandlers = connect();
  app.use(rawConnectHandlers); // Auto-compress any json, javascript, or text.

  app.use(compress()); // parse cookies into an object

  app.use(cookieParser()); // We're not a proxy; reject (without crashing) attempts to treat us like
  // one. (See #1212.)

  app.use(function (req, res, next) {
    if (RoutePolicy.isValidUrl(req.url)) {
      next();
      return;
    }

    res.writeHead(400);
    res.write("Not a proxy");
    res.end();
  }); // Strip off the path prefix, if it exists.

  app.use(function (request, response, next) {
    var pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;

    var url = Npm.require('url').parse(request.url);

    var pathname = url.pathname; // check if the path in the url starts with the path prefix (and the part
    // after the path prefix must start with a / if it exists.)

    if (pathPrefix && pathname.substring(0, pathPrefix.length) === pathPrefix && (pathname.length == pathPrefix.length || pathname.substring(pathPrefix.length, pathPrefix.length + 1) === "/")) {
      request.url = request.url.substring(pathPrefix.length);
      next();
    } else if (pathname === "/favicon.ico" || pathname === "/robots.txt") {
      next();
    } else if (pathPrefix) {
      response.writeHead(404);
      response.write("Unknown path");
      response.end();
    } else {
      next();
    }
  }); // Parse the query string into res.query. Used by oauth_server, but it's
  // generally pretty handy..

  app.use(query()); // Serve static files from the manifest.
  // This is inspired by the 'static' middleware.

  app.use(function (req, res, next) {
    WebAppInternals.staticFilesMiddleware(staticFiles, req, res, next);
  }); // Core Meteor packages like dynamic-import can add handlers before
  // other handlers added by package and application code.

  app.use(WebAppInternals.meteorInternalHandlers = connect()); // Packages and apps can add handlers to this via WebApp.connectHandlers.
  // They are inserted before our default handler.

  var packageAndAppHandlers = connect();
  app.use(packageAndAppHandlers);
  var suppressConnectErrors = false; // connect knows it is an error handler because it has 4 arguments instead of
  // 3. go figure.  (It is not smart enough to find such a thing if it's hidden
  // inside packageAndAppHandlers.)

  app.use(function (err, req, res, next) {
    if (!err || !suppressConnectErrors || !req.headers['x-suppress-error']) {
      next(err);
      return;
    }

    res.writeHead(err.status, {
      'Content-Type': 'text/plain'
    });
    res.end("An error message");
  });
  app.use(function (req, res, next) {
    if (!appUrl(req.url)) {
      return next();
    } else {
      var headers = {
        'Content-Type': 'text/html; charset=utf-8'
      };

      if (shuttingDown) {
        headers['Connection'] = 'Close';
      }

      var request = WebApp.categorizeRequest(req);

      if (request.url.query && request.url.query['meteor_css_resource']) {
        // In this case, we're requesting a CSS resource in the meteor-specific
        // way, but we don't have it.  Serve a static css file that indicates that
        // we didn't have it, so we can detect that and refresh.  Make sure
        // that any proxies or CDNs don't cache this error!  (Normally proxies
        // or CDNs are smart enough not to cache error pages, but in order to
        // make this hack work, we need to return the CSS file as a 200, which
        // would otherwise be cached.)
        headers['Content-Type'] = 'text/css; charset=utf-8';
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(200, headers);
        res.write(".meteor-css-not-found-error { width: 0px;}");
        res.end();
        return;
      }

      if (request.url.query && request.url.query['meteor_js_resource']) {
        // Similarly, we're requesting a JS resource that we don't have.
        // Serve an uncached 404. (We can't use the same hack we use for CSS,
        // because actually acting on that hack requires us to have the JS
        // already!)
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(404, headers);
        res.end("404 Not Found");
        return;
      }

      if (request.url.query && request.url.query['meteor_dont_serve_index']) {
        // When downloading files during a Cordova hot code push, we need
        // to detect if a file is not available instead of inadvertently
        // downloading the default index page.
        // So similar to the situation above, we serve an uncached 404.
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(404, headers);
        res.end("404 Not Found");
        return;
      } // /packages/asdfsad ... /__cordova/dafsdf.js


      var pathname = parseRequest(req).pathname;
      var archKey = pathname.split('/')[1];
      var archKeyCleaned = 'web.' + archKey.replace(/^__/, '');

      if (!/^__/.test(archKey) || !_.has(archPath, archKeyCleaned)) {
        archKey = WebApp.defaultArch;
      } else {
        archKey = archKeyCleaned;
      }

      return getBoilerplateAsync(request, archKey).then(({
        stream,
        statusCode,
        headers: newHeaders
      }) => {
        if (!statusCode) {
          statusCode = res.statusCode ? res.statusCode : 200;
        }

        if (newHeaders) {
          Object.assign(headers, newHeaders);
        }

        res.writeHead(statusCode, headers);
        stream.pipe(res, {
          // End the response when the stream ends.
          end: true
        });
      }).catch(error => {
        Log.error("Error running template: " + error.stack);
        res.writeHead(500, headers);
        res.end();
      });
    }
  }); // Return 404 by default, if no other handlers serve this URL.

  app.use(function (req, res) {
    res.writeHead(404);
    res.end();
  });
  var httpServer = createServer(app);
  var onListeningCallbacks = []; // After 5 seconds w/o data on a socket, kill it.  On the other hand, if
  // there's an outstanding request, give it a higher timeout instead (to avoid
  // killing long-polling requests)

  httpServer.setTimeout(SHORT_SOCKET_TIMEOUT); // Do this here, and then also in livedata/stream_server.js, because
  // stream_server.js kills all the current request handlers when installing its
  // own.

  httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback); // If the client gave us a bad request, tell it instead of just closing the
  // socket. This lets load balancers in front of us differentiate between "a
  // server is randomly closing sockets for no reason" and "client sent a bad
  // request".
  //
  // This will only work on Node 6; Node 4 destroys the socket before calling
  // this event. See https://github.com/nodejs/node/pull/4557/ for details.

  httpServer.on('clientError', (err, socket) => {
    // Pre-Node-6, do nothing.
    if (socket.destroyed) {
      return;
    }

    if (err.message === 'Parse Error') {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    } else {
      // For other errors, use the default behavior as if we had no clientError
      // handler.
      socket.destroy(err);
    }
  }); // start up app

  _.extend(WebApp, {
    connectHandlers: packageAndAppHandlers,
    rawConnectHandlers: rawConnectHandlers,
    httpServer: httpServer,
    connectApp: app,
    // For testing.
    suppressConnectErrors: function () {
      suppressConnectErrors = true;
    },
    onListening: function (f) {
      if (onListeningCallbacks) onListeningCallbacks.push(f);else f();
    }
  }); // Let the rest of the packages (and Meteor.startup hooks) insert connect
  // middlewares and update __meteor_runtime_config__, then keep going to set up
  // actually serving HTML.


  exports.main = argv => {
    WebAppInternals.generateBoilerplate();

    const startHttpServer = listenOptions => {
      httpServer.listen(listenOptions, Meteor.bindEnvironment(() => {
        if (process.env.METEOR_PRINT_ON_LISTEN) {
          console.log("LISTENING");
        }

        const callbacks = onListeningCallbacks;
        onListeningCallbacks = null;
        callbacks.forEach(callback => {
          callback();
        });
      }, e => {
        console.error("Error listening:", e);
        console.error(e && e.stack);
      }));
    };

    let localPort = process.env.PORT || 0;
    const unixSocketPath = process.env.UNIX_SOCKET_PATH;

    if (unixSocketPath) {
      // Start the HTTP server using a socket file.
      removeExistingSocketFile(unixSocketPath);
      startHttpServer({
        path: unixSocketPath
      });
      registerSocketFileCleanup(unixSocketPath);
    } else {
      localPort = isNaN(Number(localPort)) ? localPort : Number(localPort);

      if (/\\\\?.+\\pipe\\?.+/.test(localPort)) {
        // Start the HTTP server using Windows Server style named pipe.
        startHttpServer({
          path: localPort
        });
      } else if (typeof localPort === "number") {
        // Start the HTTP server using TCP.
        startHttpServer({
          port: localPort,
          host: process.env.BIND_IP || "0.0.0.0"
        });
      } else {
        throw new Error("Invalid PORT specified");
      }
    }

    return "DAEMON";
  };
}

runWebAppServer();
var inlineScriptsAllowed = true;

WebAppInternals.inlineScriptsAllowed = function () {
  return inlineScriptsAllowed;
};

WebAppInternals.setInlineScriptsAllowed = function (value) {
  inlineScriptsAllowed = value;
  WebAppInternals.generateBoilerplate();
};

WebAppInternals.setBundledJsCssUrlRewriteHook = function (hookFn) {
  bundledJsCssUrlRewriteHook = hookFn;
  WebAppInternals.generateBoilerplate();
};

WebAppInternals.setBundledJsCssPrefix = function (prefix) {
  var self = this;
  self.setBundledJsCssUrlRewriteHook(function (url) {
    return prefix + url;
  });
}; // Packages can call `WebAppInternals.addStaticJs` to specify static
// JavaScript to be included in the app. This static JS will be inlined,
// unless inline scripts have been disabled, in which case it will be
// served under `/<sha1 of contents>`.


var additionalStaticJs = {};

WebAppInternals.addStaticJs = function (contents) {
  additionalStaticJs["/" + sha1(contents) + ".js"] = contents;
}; // Exported for tests


WebAppInternals.getBoilerplate = getBoilerplate;
WebAppInternals.additionalStaticJs = additionalStaticJs;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"connect.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/connect.js                                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  connect: () => connect
});
let npmConnect;
module.watch(require("connect"), {
  default(v) {
    npmConnect = v;
  }

}, 0);

function connect(...connectArgs) {
  const handlers = npmConnect.apply(this, connectArgs);
  const originalUse = handlers.use; // Wrap the handlers.use method so that any provided handler functions
  // alway run in a Fiber.

  handlers.use = function use(...useArgs) {
    const {
      stack
    } = this;
    const originalLength = stack.length;
    const result = originalUse.apply(this, useArgs); // If we just added anything to the stack, wrap each new entry.handle
    // with a function that calls Promise.asyncApply to ensure the
    // original handler runs in a Fiber.

    for (let i = originalLength; i < stack.length; ++i) {
      const entry = stack[i];
      const originalHandle = entry.handle;

      if (originalHandle.length >= 4) {
        // If the original handle had four (or more) parameters, the
        // wrapper must also have four parameters, since connect uses
        // handle.length to dermine whether to pass the error as the first
        // argument to the handle function.
        entry.handle = function handle(err, req, res, next) {
          return Promise.asyncApply(originalHandle, this, arguments);
        };
      } else {
        entry.handle = function handle(req, res, next) {
          return Promise.asyncApply(originalHandle, this, arguments);
        };
      }
    }

    return result;
  };

  return handlers;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"socket_file.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/socket_file.js                                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  removeExistingSocketFile: () => removeExistingSocketFile,
  registerSocketFileCleanup: () => registerSocketFileCleanup
});
let statSync, unlinkSync, existsSync;
module.watch(require("fs"), {
  statSync(v) {
    statSync = v;
  },

  unlinkSync(v) {
    unlinkSync = v;
  },

  existsSync(v) {
    existsSync = v;
  }

}, 0);

const removeExistingSocketFile = socketPath => {
  try {
    if (statSync(socketPath).isSocket()) {
      // Since a new socket file will be created, remove the existing
      // file.
      unlinkSync(socketPath);
    } else {
      throw new Error(`An existing file was found at "${socketPath}" and it is not ` + 'a socket file. Please confirm PORT is pointing to valid and ' + 'un-used socket file path.');
    }
  } catch (error) {
    // If there is no existing socket file to cleanup, great, we'll
    // continue normally. If the caught exception represents any other
    // issue, re-throw.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const registerSocketFileCleanup = (socketPath, eventEmitter = process) => {
  ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(signal => {
    eventEmitter.on(signal, Meteor.bindEnvironment(() => {
      if (existsSync(socketPath)) {
        unlinkSync(socketPath);
      }
    }));
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"connect":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/connect/package.json                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "connect";
exports.version = "3.6.5";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/connect/index.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * connect
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var debug = require('debug')('connect:dispatcher');
var EventEmitter = require('events').EventEmitter;
var finalhandler = require('finalhandler');
var http = require('http');
var merge = require('utils-merge');
var parseUrl = require('parseurl');

/**
 * Module exports.
 * @public
 */

module.exports = createServer;

/**
 * Module variables.
 * @private
 */

var env = process.env.NODE_ENV || 'development';
var proto = {};

/* istanbul ignore next */
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

/**
 * Create a new connect server.
 *
 * @return {function}
 * @public
 */

function createServer() {
  function app(req, res, next){ app.handle(req, res, next); }
  merge(app, proto);
  merge(app, EventEmitter.prototype);
  app.route = '/';
  app.stack = [];
  return app;
}

/**
 * Utilize the given middleware `handle` to the given `route`,
 * defaulting to _/_. This "route" is the mount-point for the
 * middleware, when given a value other than _/_ the middleware
 * is only effective when that segment is present in the request's
 * pathname.
 *
 * For example if we were to mount a function at _/admin_, it would
 * be invoked on _/admin_, and _/admin/settings_, however it would
 * not be invoked for _/_, or _/posts_.
 *
 * @param {String|Function|Server} route, callback or server
 * @param {Function|Server} callback or server
 * @return {Server} for chaining
 * @public
 */

proto.use = function use(route, fn) {
  var handle = fn;
  var path = route;

  // default route to '/'
  if (typeof route !== 'string') {
    handle = route;
    path = '/';
  }

  // wrap sub-apps
  if (typeof handle.handle === 'function') {
    var server = handle;
    server.route = path;
    handle = function (req, res, next) {
      server.handle(req, res, next);
    };
  }

  // wrap vanilla http.Servers
  if (handle instanceof http.Server) {
    handle = handle.listeners('request')[0];
  }

  // strip trailing slash
  if (path[path.length - 1] === '/') {
    path = path.slice(0, -1);
  }

  // add the middleware
  debug('use %s %s', path || '/', handle.name || 'anonymous');
  this.stack.push({ route: path, handle: handle });

  return this;
};

/**
 * Handle server requests, punting them down
 * the middleware stack.
 *
 * @private
 */

proto.handle = function handle(req, res, out) {
  var index = 0;
  var protohost = getProtohost(req.url) || '';
  var removed = '';
  var slashAdded = false;
  var stack = this.stack;

  // final function handler
  var done = out || finalhandler(req, res, {
    env: env,
    onerror: logerror
  });

  // store the original URL
  req.originalUrl = req.originalUrl || req.url;

  function next(err) {
    if (slashAdded) {
      req.url = req.url.substr(1);
      slashAdded = false;
    }

    if (removed.length !== 0) {
      req.url = protohost + removed + req.url.substr(protohost.length);
      removed = '';
    }

    // next callback
    var layer = stack[index++];

    // all done
    if (!layer) {
      defer(done, err);
      return;
    }

    // route data
    var path = parseUrl(req).pathname || '/';
    var route = layer.route;

    // skip this layer if the route doesn't match
    if (path.toLowerCase().substr(0, route.length) !== route.toLowerCase()) {
      return next(err);
    }

    // skip if route match does not border "/", ".", or end
    var c = path[route.length];
    if (c !== undefined && '/' !== c && '.' !== c) {
      return next(err);
    }

    // trim off the part of the url that matches the route
    if (route.length !== 0 && route !== '/') {
      removed = route;
      req.url = protohost + req.url.substr(protohost.length + removed.length);

      // ensure leading slash
      if (!protohost && req.url[0] !== '/') {
        req.url = '/' + req.url;
        slashAdded = true;
      }
    }

    // call the layer handle
    call(layer.handle, route, err, req, res, next);
  }

  next();
};

/**
 * Listen for connections.
 *
 * This method takes the same arguments
 * as node's `http.Server#listen()`.
 *
 * HTTP and HTTPS:
 *
 * If you run your application both as HTTP
 * and HTTPS you may wrap them individually,
 * since your Connect "server" is really just
 * a JavaScript `Function`.
 *
 *      var connect = require('connect')
 *        , http = require('http')
 *        , https = require('https');
 *
 *      var app = connect();
 *
 *      http.createServer(app).listen(80);
 *      https.createServer(options, app).listen(443);
 *
 * @return {http.Server}
 * @api public
 */

proto.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};

/**
 * Invoke a route handle.
 * @private
 */

function call(handle, route, err, req, res, next) {
  var arity = handle.length;
  var error = err;
  var hasError = Boolean(err);

  debug('%s %s : %s', handle.name || '<anonymous>', route, req.originalUrl);

  try {
    if (hasError && arity === 4) {
      // error-handling middleware
      handle(err, req, res, next);
      return;
    } else if (!hasError && arity < 4) {
      // request-handling middleware
      handle(req, res, next);
      return;
    }
  } catch (e) {
    // replace the error
    error = e;
  }

  // continue
  next(error);
}

/**
 * Log error using console.error.
 *
 * @param {Error} err
 * @private
 */

function logerror(err) {
  if (env !== 'test') console.error(err.stack || err.toString());
}

/**
 * Get get protocol + host for a URL.
 *
 * @param {string} url
 * @private
 */

function getProtohost(url) {
  if (url.length === 0 || url[0] === '/') {
    return undefined;
  }

  var searchIndex = url.indexOf('?');
  var pathLength = searchIndex !== -1
    ? searchIndex
    : url.length;
  var fqdnIndex = url.substr(0, pathLength).indexOf('://');

  return fqdnIndex !== -1
    ? url.substr(0, url.indexOf('/', 3 + fqdnIndex))
    : undefined;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"compression":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/compression/package.json                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "compression";
exports.version = "1.7.1";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/compression/index.js                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * compression
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var accepts = require('accepts')
var Buffer = require('safe-buffer').Buffer
var bytes = require('bytes')
var compressible = require('compressible')
var debug = require('debug')('compression')
var onHeaders = require('on-headers')
var vary = require('vary')
var zlib = require('zlib')

/**
 * Module exports.
 */

module.exports = compression
module.exports.filter = shouldCompress

/**
 * Module variables.
 * @private
 */

var cacheControlNoTransformRegExp = /(?:^|,)\s*?no-transform\s*?(?:,|$)/

/**
 * Compress response data with gzip / deflate.
 *
 * @param {Object} [options]
 * @return {Function} middleware
 * @public
 */

function compression (options) {
  var opts = options || {}

  // options
  var filter = opts.filter || shouldCompress
  var threshold = bytes.parse(opts.threshold)

  if (threshold == null) {
    threshold = 1024
  }

  return function compression (req, res, next) {
    var ended = false
    var length
    var listeners = []
    var stream

    var _end = res.end
    var _on = res.on
    var _write = res.write

    // flush
    res.flush = function flush () {
      if (stream) {
        stream.flush()
      }
    }

    // proxy

    res.write = function write (chunk, encoding) {
      if (ended) {
        return false
      }

      if (!this._header) {
        this._implicitHeader()
      }

      return stream
        ? stream.write(Buffer.from(chunk, encoding))
        : _write.call(this, chunk, encoding)
    }

    res.end = function end (chunk, encoding) {
      if (ended) {
        return false
      }

      if (!this._header) {
        // estimate the length
        if (!this.getHeader('Content-Length')) {
          length = chunkLength(chunk, encoding)
        }

        this._implicitHeader()
      }

      if (!stream) {
        return _end.call(this, chunk, encoding)
      }

      // mark ended
      ended = true

      // write Buffer for Node.js 0.8
      return chunk
        ? stream.end(Buffer.from(chunk, encoding))
        : stream.end()
    }

    res.on = function on (type, listener) {
      if (!listeners || type !== 'drain') {
        return _on.call(this, type, listener)
      }

      if (stream) {
        return stream.on(type, listener)
      }

      // buffer listeners for future stream
      listeners.push([type, listener])

      return this
    }

    function nocompress (msg) {
      debug('no compression: %s', msg)
      addListeners(res, _on, listeners)
      listeners = null
    }

    onHeaders(res, function onResponseHeaders () {
      // determine if request is filtered
      if (!filter(req, res)) {
        nocompress('filtered')
        return
      }

      // determine if the entity should be transformed
      if (!shouldTransform(req, res)) {
        nocompress('no transform')
        return
      }

      // vary
      vary(res, 'Accept-Encoding')

      // content-length below threshold
      if (Number(res.getHeader('Content-Length')) < threshold || length < threshold) {
        nocompress('size below threshold')
        return
      }

      var encoding = res.getHeader('Content-Encoding') || 'identity'

      // already encoded
      if (encoding !== 'identity') {
        nocompress('already encoded')
        return
      }

      // head
      if (req.method === 'HEAD') {
        nocompress('HEAD request')
        return
      }

      // compression method
      var accept = accepts(req)
      var method = accept.encoding(['gzip', 'deflate', 'identity'])

      // we really don't prefer deflate
      if (method === 'deflate' && accept.encoding(['gzip'])) {
        method = accept.encoding(['gzip', 'identity'])
      }

      // negotiation failed
      if (!method || method === 'identity') {
        nocompress('not acceptable')
        return
      }

      // compression stream
      debug('%s compression', method)
      stream = method === 'gzip'
        ? zlib.createGzip(opts)
        : zlib.createDeflate(opts)

      // add buffered listeners to stream
      addListeners(stream, stream.on, listeners)

      // header fields
      res.setHeader('Content-Encoding', method)
      res.removeHeader('Content-Length')

      // compression
      stream.on('data', function onStreamData (chunk) {
        if (_write.call(res, chunk) === false) {
          stream.pause()
        }
      })

      stream.on('end', function onStreamEnd () {
        _end.call(res)
      })

      _on.call(res, 'drain', function onResponseDrain () {
        stream.resume()
      })
    })

    next()
  }
}

/**
 * Add bufferred listeners to stream
 * @private
 */

function addListeners (stream, on, listeners) {
  for (var i = 0; i < listeners.length; i++) {
    on.apply(stream, listeners[i])
  }
}

/**
 * Get the length of a given chunk
 */

function chunkLength (chunk, encoding) {
  if (!chunk) {
    return 0
  }

  return !Buffer.isBuffer(chunk)
    ? Buffer.byteLength(chunk, encoding)
    : chunk.length
}

/**
 * Default filter function.
 * @private
 */

function shouldCompress (req, res) {
  var type = res.getHeader('Content-Type')

  if (type === undefined || !compressible(type)) {
    debug('%s not compressible', type)
    return false
  }

  return true
}

/**
 * Determine if the entity should be transformed.
 * @private
 */

function shouldTransform (req, res) {
  var cacheControl = res.getHeader('Cache-Control')

  // Don't compress for Cache-Control: no-transform
  // https://tools.ietf.org/html/rfc7234#section-5.2.2.4
  return !cacheControl ||
    !cacheControlNoTransformRegExp.test(cacheControl)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cookie-parser":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/cookie-parser/package.json                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "cookie-parser";
exports.version = "1.4.3";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/cookie-parser/index.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * cookie-parser
 * Copyright(c) 2014 TJ Holowaychuk
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var cookie = require('cookie');
var signature = require('cookie-signature');

/**
 * Module exports.
 * @public
 */

module.exports = cookieParser;
module.exports.JSONCookie = JSONCookie;
module.exports.JSONCookies = JSONCookies;
module.exports.signedCookie = signedCookie;
module.exports.signedCookies = signedCookies;

/**
 * Parse Cookie header and populate `req.cookies`
 * with an object keyed by the cookie names.
 *
 * @param {string|array} [secret] A string (or array of strings) representing cookie signing secret(s).
 * @param {Object} [options]
 * @return {Function}
 * @public
 */

function cookieParser(secret, options) {
  return function cookieParser(req, res, next) {
    if (req.cookies) {
      return next();
    }

    var cookies = req.headers.cookie;
    var secrets = !secret || Array.isArray(secret)
      ? (secret || [])
      : [secret];

    req.secret = secrets[0];
    req.cookies = Object.create(null);
    req.signedCookies = Object.create(null);

    // no cookies
    if (!cookies) {
      return next();
    }

    req.cookies = cookie.parse(cookies, options);

    // parse signed cookies
    if (secrets.length !== 0) {
      req.signedCookies = signedCookies(req.cookies, secrets);
      req.signedCookies = JSONCookies(req.signedCookies);
    }

    // parse JSON cookies
    req.cookies = JSONCookies(req.cookies);

    next();
  };
}

/**
 * Parse JSON cookie string.
 *
 * @param {String} str
 * @return {Object} Parsed object or undefined if not json cookie
 * @public
 */

function JSONCookie(str) {
  if (typeof str !== 'string' || str.substr(0, 2) !== 'j:') {
    return undefined;
  }

  try {
    return JSON.parse(str.slice(2));
  } catch (err) {
    return undefined;
  }
}

/**
 * Parse JSON cookies.
 *
 * @param {Object} obj
 * @return {Object}
 * @public
 */

function JSONCookies(obj) {
  var cookies = Object.keys(obj);
  var key;
  var val;

  for (var i = 0; i < cookies.length; i++) {
    key = cookies[i];
    val = JSONCookie(obj[key]);

    if (val) {
      obj[key] = val;
    }
  }

  return obj;
}

/**
 * Parse a signed cookie string, return the decoded value.
 *
 * @param {String} str signed cookie string
 * @param {string|array} secret
 * @return {String} decoded value
 * @public
 */

function signedCookie(str, secret) {
  if (typeof str !== 'string') {
    return undefined;
  }

  if (str.substr(0, 2) !== 's:') {
    return str;
  }

  var secrets = !secret || Array.isArray(secret)
    ? (secret || [])
    : [secret];

  for (var i = 0; i < secrets.length; i++) {
    var val = signature.unsign(str.slice(2), secrets[i]);

    if (val !== false) {
      return val;
    }
  }

  return false;
}

/**
 * Parse signed cookies, returning an object containing the decoded key/value
 * pairs, while removing the signed key from obj.
 *
 * @param {Object} obj
 * @param {string|array} secret
 * @return {Object}
 * @public
 */

function signedCookies(obj, secret) {
  var cookies = Object.keys(obj);
  var dec;
  var key;
  var ret = Object.create(null);
  var val;

  for (var i = 0; i < cookies.length; i++) {
    key = cookies[i];
    val = obj[key];
    dec = signedCookie(val, secret);

    if (val !== dec) {
      ret[key] = dec;
      delete obj[key];
    }
  }

  return ret;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"qs-middleware":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/qs-middleware/package.json                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "qs-middleware";
exports.version = "1.0.3";
exports.main = "./lib/qs-middleware.js";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"qs-middleware.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/qs-middleware/lib/qs-middleware.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
'use strict';

var url = require('url');
var qs = require('qs');

module.exports = qsMiddleware;

function qsMiddleware(options) {
	return function (request, response, next) {
		request.query = qs.parse(url.parse(request.url).query, options);
		next();
	};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"parseurl":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/parseurl/package.json                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "parseurl";
exports.version = "1.3.2";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/parseurl/index.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * parseurl
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var url = require('url')
var parse = url.parse
var Url = url.Url

/**
 * Module exports.
 * @public
 */

module.exports = parseurl
module.exports.original = originalurl

/**
 * Parse the `req` url with memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @public
 */

function parseurl (req) {
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

  return (req._parsedUrl = parsed)
};

/**
 * Parse the `req` original url with fallback and memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @public
 */

function originalurl (req) {
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

  return (req._parsedOriginalUrl = parsed)
};

/**
 * Parse the `str` url with fast-path short-cut.
 *
 * @param {string} str
 * @return {Object}
 * @private
 */

function fastparse (str) {
  if (typeof str !== 'string' || str.charCodeAt(0) !== 0x2f /* / */) {
    return parse(str)
  }

  var pathname = str
  var query = null
  var search = null

  // This takes the regexp from https://github.com/joyent/node/pull/7878
  // Which is /^(\/[^?#\s]*)(\?[^#\s]*)?$/
  // And unrolls it into a for loop
  for (var i = 1; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case 0x3f: /* ?  */
        if (search === null) {
          pathname = str.substring(0, i)
          query = str.substring(i + 1)
          search = str.substring(i)
        }
        break
      case 0x09: /* \t */
      case 0x0a: /* \n */
      case 0x0c: /* \f */
      case 0x0d: /* \r */
      case 0x20: /*    */
      case 0x23: /* #  */
      case 0xa0:
      case 0xfeff:
        return parse(str)
    }
  }

  var url = Url !== undefined
    ? new Url()
    : {}
  url.path = str
  url.href = str
  url.pathname = pathname
  url.query = query
  url.search = search

  return url
}

/**
 * Determine if parsed is still fresh for url.
 *
 * @param {string} url
 * @param {object} parsedUrl
 * @return {boolean}
 * @private
 */

function fresh (url, parsedUrl) {
  return typeof parsedUrl === 'object' &&
    parsedUrl !== null &&
    (Url === undefined || parsedUrl instanceof Url) &&
    parsedUrl._raw === url
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"basic-auth-connect":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/basic-auth-connect/package.json                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "basic-auth-connect";
exports.version = "1.0.0";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/basic-auth-connect/index.js                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var http = require('http');

/*!
 * Connect - basicAuth
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Basic Auth:
 *
 * Status: Deprecated. No bug reports or pull requests are welcomed
 * for this middleware. However, this middleware will not be removed.
 * Instead, you should use [basic-auth](https://github.com/visionmedia/node-basic-auth).
 *
 * Enfore basic authentication by providing a `callback(user, pass)`,
 * which must return `true` in order to gain access. Alternatively an async
 * method is provided as well, invoking `callback(user, pass, callback)`. Populates
 * `req.user`. The final alternative is simply passing username / password
 * strings.
 *
 *  Simple username and password
 *
 *     connect(connect.basicAuth('username', 'password'));
 *
 *  Callback verification
 *
 *     connect()
 *       .use(connect.basicAuth(function(user, pass){
 *         return 'tj' == user && 'wahoo' == pass;
 *       }))
 *
 *  Async callback verification, accepting `fn(err, user)`.
 *
 *     connect()
 *       .use(connect.basicAuth(function(user, pass, fn){
 *         User.authenticate({ user: user, pass: pass }, fn);
 *       }))
 *
 * @param {Function|String} callback or username
 * @param {String} realm
 * @api public
 */

module.exports = function basicAuth(callback, realm) {
  var username, password;

  // user / pass strings
  if ('string' == typeof callback) {
    username = callback;
    password = realm;
    if ('string' != typeof password) throw new Error('password argument required');
    realm = arguments[2];
    callback = function(user, pass){
      return user == username && pass == password;
    }
  }

  realm = realm || 'Authorization Required';

  return function(req, res, next) {
    var authorization = req.headers.authorization;

    if (req.user) return next();
    if (!authorization) return unauthorized(res, realm);

    var parts = authorization.split(' ');

    if (parts.length !== 2) return next(error(400));

    var scheme = parts[0]
      , credentials = new Buffer(parts[1], 'base64').toString()
      , index = credentials.indexOf(':');

    if ('Basic' != scheme || index < 0) return next(error(400));

    var user = credentials.slice(0, index)
      , pass = credentials.slice(index + 1);

    // async
    if (callback.length >= 3) {
      callback(user, pass, function(err, user){
        if (err || !user)  return unauthorized(res, realm);
        req.user = req.remoteUser = user;
        next();
      });
    // sync
    } else {
      if (callback(user, pass)) {
        req.user = req.remoteUser = user;
        next();
      } else {
        unauthorized(res, realm);
      }
    }
  }
};

/**
 * Respond with 401 "Unauthorized".
 *
 * @param {ServerResponse} res
 * @param {String} realm
 * @api private
 */

function unauthorized(res, realm) {
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
  res.end('Unauthorized');
};

/**
 * Generate an `Error` from the given status `code`
 * and optional `msg`.
 *
 * @param {Number} code
 * @param {String} msg
 * @return {Error}
 * @api private
 */

function error(code, msg){
  var err = new Error(msg || http.STATUS_CODES[code]);
  err.status = code;
  return err;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"useragent":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/useragent/package.json                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "useragent";
exports.version = "2.2.1";
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
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
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
 * @param {String} family The name of the device
 * @param {String} major Major version of the device
 * @param {String} minor Minor version of the device
 * @param {String} patch Patch version of the device
 * @api public
 */
function Device(family, major, minor, patch) {
  this.family = family || 'Other';
  this.major = major || '0';
  this.minor = minor || '0';
  this.patch = patch || '0';
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
 * Check if the userAgent is something we want to parse with regexp's.
 *
 * @param {String} userAgent The userAgent.
 * @returns {Boolean}
 */
function isSafe(userAgent) {
  var consecutive = 0
    , code = 0;

  for (var i = 0; i < userAgent.length; i++) {
    code = userAgent.charCodeAt(i);
    // numbers between 0 and 9, letters between a and z
    if ((code >= 48 && code <= 57) || (code >= 97 && code <= 122)) {
      consecutive++;
    } else {
      consecutive = 0;
    }

    if (consecutive >= 100) {
      return false;
    }
  }

  return true
}


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
  if (!userAgent || !isSafe(userAgent)) return new Agent();

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
      , android: false
      , version: (ua.match(exports.is.versionRE) || [0, "0"])[1]
    };

  if (~ua.indexOf('webkit')) {
    details.webkit = true;

    if (~ua.indexOf('android')){
      details.android = true;
    }

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
  } else if (~ua.indexOf('trident') || ~ua.indexOf('msie')) {
    details.ie = true;
  } else if (~ua.indexOf('mozilla') && !~ua.indexOf('compatible')) {
    details.mozilla = true;

    if (~ua.indexOf('firefox')) details.firefox = true;
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

}},"send":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/send/package.json                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
exports.name = "send";
exports.version = "0.16.1";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/send/index.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*!
 * send
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
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
var encodeUrl = require('encodeurl')
var escapeHtml = require('escape-html')
var etag = require('etag')
var fresh = require('fresh')
var fs = require('fs')
var mime = require('mime')
var ms = require('ms')
var onFinished = require('on-finished')
var parseRange = require('range-parser')
var path = require('path')
var statuses = require('statuses')
var Stream = require('stream')
var util = require('util')

/**
 * Path function references.
 * @private
 */

var extname = path.extname
var join = path.join
var normalize = path.normalize
var resolve = path.resolve
var sep = path.sep

/**
 * Regular expression for identifying a bytes Range header.
 * @private
 */

var BYTES_RANGE_REGEXP = /^ *bytes=/

/**
 * Maximum value allowed for the max age.
 * @private
 */

var MAX_MAXAGE = 60 * 60 * 24 * 365 * 1000 // 1 year

/**
 * Regular expression to match a path with a directory up component.
 * @private
 */

var UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

/**
 * Module exports.
 * @public
 */

module.exports = send
module.exports.mime = mime

/**
 * Return a `SendStream` for `req` and `path`.
 *
 * @param {object} req
 * @param {string} path
 * @param {object} [options]
 * @return {SendStream}
 * @public
 */

function send (req, path, options) {
  return new SendStream(req, path, options)
}

/**
 * Initialize a `SendStream` with the given `path`.
 *
 * @param {Request} req
 * @param {String} path
 * @param {object} [options]
 * @private
 */

function SendStream (req, path, options) {
  Stream.call(this)

  var opts = options || {}

  this.options = opts
  this.path = path
  this.req = req

  this._acceptRanges = opts.acceptRanges !== undefined
    ? Boolean(opts.acceptRanges)
    : true

  this._cacheControl = opts.cacheControl !== undefined
    ? Boolean(opts.cacheControl)
    : true

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

  this._immutable = opts.immutable !== undefined
    ? Boolean(opts.immutable)
    : false

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
    ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
    : 0

  this._root = opts.root
    ? resolve(opts.root)
    : null

  if (!this._root && opts.from) {
    this.from(opts.from)
  }
}

/**
 * Inherits from `Stream`.
 */

util.inherits(SendStream, Stream)

/**
 * Enable or disable etag generation.
 *
 * @param {Boolean} val
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.etag = deprecate.function(function etag (val) {
  this._etag = Boolean(val)
  debug('etag %s', this._etag)
  return this
}, 'send.etag: pass etag as option')

/**
 * Enable or disable "hidden" (dot) files.
 *
 * @param {Boolean} path
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.hidden = deprecate.function(function hidden (val) {
  this._hidden = Boolean(val)
  this._dotfiles = undefined
  debug('hidden %s', this._hidden)
  return this
}, 'send.hidden: use dotfiles option')

/**
 * Set index `paths`, set to a falsy
 * value to disable index support.
 *
 * @param {String|Boolean|Array} paths
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.index = deprecate.function(function index (paths) {
  var index = !paths ? [] : normalizeList(paths, 'paths argument')
  debug('index %o', paths)
  this._index = index
  return this
}, 'send.index: pass index as option')

/**
 * Set root `path`.
 *
 * @param {String} path
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.root = function root (path) {
  this._root = resolve(String(path))
  debug('root %s', this._root)
  return this
}

SendStream.prototype.from = deprecate.function(SendStream.prototype.root,
  'send.from: pass root as option')

SendStream.prototype.root = deprecate.function(SendStream.prototype.root,
  'send.root: pass root as option')

/**
 * Set max-age to `maxAge`.
 *
 * @param {Number} maxAge
 * @return {SendStream}
 * @api public
 */

SendStream.prototype.maxage = deprecate.function(function maxage (maxAge) {
  this._maxage = typeof maxAge === 'string'
    ? ms(maxAge)
    : Number(maxAge)
  this._maxage = !isNaN(this._maxage)
    ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
    : 0
  debug('max-age %d', this._maxage)
  return this
}, 'send.maxage: pass maxAge as option')

/**
 * Emit error with `status`.
 *
 * @param {number} status
 * @param {Error} [err]
 * @private
 */

SendStream.prototype.error = function error (status, err) {
  // emit if listeners instead of responding
  if (hasListeners(this, 'error')) {
    return this.emit('error', createError(status, err, {
      expose: false
    }))
  }

  var res = this.res
  var msg = statuses[status] || String(status)
  var doc = createHtmlDocument('Error', escapeHtml(msg))

  // clear existing headers
  clearHeaders(res)

  // add error headers
  if (err && err.headers) {
    setHeaders(res, err.headers)
  }

  // send basic response
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Content-Length', Buffer.byteLength(doc))
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(doc)
}

/**
 * Check if the pathname ends with "/".
 *
 * @return {boolean}
 * @private
 */

SendStream.prototype.hasTrailingSlash = function hasTrailingSlash () {
  return this.path[this.path.length - 1] === '/'
}

/**
 * Check if this is a conditional GET request.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isConditionalGET = function isConditionalGET () {
  return this.req.headers['if-match'] ||
    this.req.headers['if-unmodified-since'] ||
    this.req.headers['if-none-match'] ||
    this.req.headers['if-modified-since']
}

/**
 * Check if the request preconditions failed.
 *
 * @return {boolean}
 * @private
 */

SendStream.prototype.isPreconditionFailure = function isPreconditionFailure () {
  var req = this.req
  var res = this.res

  // if-match
  var match = req.headers['if-match']
  if (match) {
    var etag = res.getHeader('ETag')
    return !etag || (match !== '*' && parseTokenList(match).every(function (match) {
      return match !== etag && match !== 'W/' + etag && 'W/' + match !== etag
    }))
  }

  // if-unmodified-since
  var unmodifiedSince = parseHttpDate(req.headers['if-unmodified-since'])
  if (!isNaN(unmodifiedSince)) {
    var lastModified = parseHttpDate(res.getHeader('Last-Modified'))
    return isNaN(lastModified) || lastModified > unmodifiedSince
  }

  return false
}

/**
 * Strip content-* header fields.
 *
 * @private
 */

SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields () {
  var res = this.res
  var headers = getHeaderNames(res)

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

SendStream.prototype.notModified = function notModified () {
  var res = this.res
  debug('not modified')
  this.removeContentHeaderFields()
  res.statusCode = 304
  res.end()
}

/**
 * Raise error that headers already sent.
 *
 * @api private
 */

SendStream.prototype.headersAlreadySent = function headersAlreadySent () {
  var err = new Error('Can\'t set headers after they are sent.')
  debug('headers already sent')
  this.error(500, err)
}

/**
 * Check if the request is cacheable, aka
 * responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isCachable = function isCachable () {
  var statusCode = this.res.statusCode
  return (statusCode >= 200 && statusCode < 300) ||
    statusCode === 304
}

/**
 * Handle stat() error.
 *
 * @param {Error} error
 * @private
 */

SendStream.prototype.onStatError = function onStatError (error) {
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

SendStream.prototype.isFresh = function isFresh () {
  return fresh(this.req.headers, {
    'etag': this.res.getHeader('ETag'),
    'last-modified': this.res.getHeader('Last-Modified')
  })
}

/**
 * Check if the range is fresh.
 *
 * @return {Boolean}
 * @api private
 */

SendStream.prototype.isRangeFresh = function isRangeFresh () {
  var ifRange = this.req.headers['if-range']

  if (!ifRange) {
    return true
  }

  // if-range as etag
  if (ifRange.indexOf('"') !== -1) {
    var etag = this.res.getHeader('ETag')
    return Boolean(etag && ifRange.indexOf(etag) !== -1)
  }

  // if-range as modified date
  var lastModified = this.res.getHeader('Last-Modified')
  return parseHttpDate(lastModified) <= parseHttpDate(ifRange)
}

/**
 * Redirect to path.
 *
 * @param {string} path
 * @private
 */

SendStream.prototype.redirect = function redirect (path) {
  var res = this.res

  if (hasListeners(this, 'directory')) {
    this.emit('directory', res, path)
    return
  }

  if (this.hasTrailingSlash()) {
    this.error(403)
    return
  }

  var loc = encodeUrl(collapseLeadingSlashes(this.path + '/'))
  var doc = createHtmlDocument('Redirecting', 'Redirecting to <a href="' + escapeHtml(loc) + '">' +
    escapeHtml(loc) + '</a>')

  // redirect
  res.statusCode = 301
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Content-Length', Buffer.byteLength(doc))
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Location', loc)
  res.end(doc)
}

/**
 * Pipe to `res.
 *
 * @param {Stream} res
 * @return {Stream} res
 * @api public
 */

SendStream.prototype.pipe = function pipe (res) {
  // root path
  var root = this._root

  // references
  this.res = res

  // decode the path
  var path = decode(this.path)
  if (path === -1) {
    this.error(400)
    return res
  }

  // null byte(s)
  if (~path.indexOf('\0')) {
    this.error(400)
    return res
  }

  var parts
  if (root !== null) {
    // normalize
    if (path) {
      path = normalize('.' + sep + path)
    }

    // malicious path
    if (UP_PATH_REGEXP.test(path)) {
      debug('malicious path "%s"', path)
      this.error(403)
      return res
    }

    // explode path parts
    parts = path.split(sep)

    // join / normalize from optional root dir
    path = normalize(join(root, path))
    root = normalize(root + sep)
  } else {
    // ".." is malicious without "root"
    if (UP_PATH_REGEXP.test(path)) {
      debug('malicious path "%s"', path)
      this.error(403)
      return res
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
        this.error(403)
        return res
      case 'ignore':
      default:
        this.error(404)
        return res
    }
  }

  // index file support
  if (this._index.length && this.hasTrailingSlash()) {
    this.sendIndex(path)
    return res
  }

  this.sendFile(path)
  return res
}

/**
 * Transfer `path`.
 *
 * @param {String} path
 * @api public
 */

SendStream.prototype.send = function send (path, stat) {
  var len = stat.size
  var options = this.options
  var opts = {}
  var res = this.res
  var req = this.req
  var ranges = req.headers.range
  var offset = options.start || 0

  if (headersSent(res)) {
    // impossible to send now
    this.headersAlreadySent()
    return
  }

  debug('pipe "%s"', path)

  // set header fields
  this.setHeader(path, stat)

  // set content-type
  this.type(path)

  // conditional GET support
  if (this.isConditionalGET()) {
    if (this.isPreconditionFailure()) {
      this.error(412)
      return
    }

    if (this.isCachable() && this.isFresh()) {
      this.notModified()
      return
    }
  }

  // adjust len to start/end options
  len = Math.max(0, len - offset)
  if (options.end !== undefined) {
    var bytes = options.end - offset + 1
    if (len > bytes) len = bytes
  }

  // Range support
  if (this._acceptRanges && BYTES_RANGE_REGEXP.test(ranges)) {
    // parse
    ranges = parseRange(len, ranges, {
      combine: true
    })

    // If-Range support
    if (!this.isRangeFresh()) {
      debug('range stale')
      ranges = -2
    }

    // unsatisfiable
    if (ranges === -1) {
      debug('range unsatisfiable')

      // Content-Range
      res.setHeader('Content-Range', contentRange('bytes', len))

      // 416 Requested Range Not Satisfiable
      return this.error(416, {
        headers: {'Content-Range': res.getHeader('Content-Range')}
      })
    }

    // valid (syntactically invalid/multiple ranges are treated as a regular response)
    if (ranges !== -2 && ranges.length === 1) {
      debug('range %j', ranges)

      // Content-Range
      res.statusCode = 206
      res.setHeader('Content-Range', contentRange('bytes', len, ranges[0]))

      // adjust for requested range
      offset += ranges[0].start
      len = ranges[0].end - ranges[0].start + 1
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
  res.setHeader('Content-Length', len)

  // HEAD support
  if (req.method === 'HEAD') {
    res.end()
    return
  }

  this.stream(path, opts)
}

/**
 * Transfer file for `path`.
 *
 * @param {String} path
 * @api private
 */
SendStream.prototype.sendFile = function sendFile (path) {
  var i = 0
  var self = this

  debug('stat "%s"', path)
  fs.stat(path, function onstat (err, stat) {
    if (err && err.code === 'ENOENT' && !extname(path) && path[path.length - 1] !== sep) {
      // not found, check extensions
      return next(err)
    }
    if (err) return self.onStatError(err)
    if (stat.isDirectory()) return self.redirect(path)
    self.emit('file', path, stat)
    self.send(path, stat)
  })

  function next (err) {
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
SendStream.prototype.sendIndex = function sendIndex (path) {
  var i = -1
  var self = this

  function next (err) {
    if (++i >= self._index.length) {
      if (err) return self.onStatError(err)
      return self.error(404)
    }

    var p = join(path, self._index[i])

    debug('stat "%s"', p)
    fs.stat(p, function (err, stat) {
      if (err) return next(err)
      if (stat.isDirectory()) return next()
      self.emit('file', p, stat)
      self.send(p, stat)
    })
  }

  next()
}

/**
 * Stream `path` to the response.
 *
 * @param {String} path
 * @param {Object} options
 * @api private
 */

SendStream.prototype.stream = function stream (path, options) {
  // TODO: this is all lame, refactor meeee
  var finished = false
  var self = this
  var res = this.res

  // pipe
  var stream = fs.createReadStream(path, options)
  this.emit('stream', stream)
  stream.pipe(res)

  // response finished, done with the fd
  onFinished(res, function onfinished () {
    finished = true
    destroy(stream)
  })

  // error handling code-smell
  stream.on('error', function onerror (err) {
    // request already finished
    if (finished) return

    // clean up stream
    finished = true
    destroy(stream)

    // error
    self.onStatError(err)
  })

  // end
  stream.on('end', function onend () {
    self.emit('end')
  })
}

/**
 * Set content-type based on `path`
 * if it hasn't been explicitly set.
 *
 * @param {String} path
 * @api private
 */

SendStream.prototype.type = function type (path) {
  var res = this.res

  if (res.getHeader('Content-Type')) return

  var type = mime.lookup(path)

  if (!type) {
    debug('no content-type')
    return
  }

  var charset = mime.charsets.lookup(type)

  debug('content-type %s', type)
  res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''))
}

/**
 * Set response header fields, most
 * fields may be pre-defined.
 *
 * @param {String} path
 * @param {Object} stat
 * @api private
 */

SendStream.prototype.setHeader = function setHeader (path, stat) {
  var res = this.res

  this.emit('headers', res, path, stat)

  if (this._acceptRanges && !res.getHeader('Accept-Ranges')) {
    debug('accept ranges')
    res.setHeader('Accept-Ranges', 'bytes')
  }

  if (this._cacheControl && !res.getHeader('Cache-Control')) {
    var cacheControl = 'public, max-age=' + Math.floor(this._maxage / 1000)

    if (this._immutable) {
      cacheControl += ', immutable'
    }

    debug('cache-control %s', cacheControl)
    res.setHeader('Cache-Control', cacheControl)
  }

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
}

/**
 * Clear all headers from a response.
 *
 * @param {object} res
 * @private
 */

function clearHeaders (res) {
  var headers = getHeaderNames(res)

  for (var i = 0; i < headers.length; i++) {
    res.removeHeader(headers[i])
  }
}

/**
 * Collapse all leading slashes into a single slash
 *
 * @param {string} str
 * @private
 */
function collapseLeadingSlashes (str) {
  for (var i = 0; i < str.length; i++) {
    if (str[i] !== '/') {
      break
    }
  }

  return i > 1
    ? '/' + str.substr(i)
    : str
}

/**
 * Determine if path parts contain a dotfile.
 *
 * @api private
 */

function containsDotFile (parts) {
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i]
    if (part.length > 1 && part[0] === '.') {
      return true
    }
  }

  return false
}

/**
 * Create a Content-Range header.
 *
 * @param {string} type
 * @param {number} size
 * @param {array} [range]
 */

function contentRange (type, size, range) {
  return type + ' ' + (range ? range.start + '-' + range.end : '*') + '/' + size
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */

function createHtmlDocument (title, body) {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '<html>\n'
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

function decode (path) {
  try {
    return decodeURIComponent(path)
  } catch (err) {
    return -1
  }
}

/**
 * Get the header names on a respnse.
 *
 * @param {object} res
 * @returns {array[string]}
 * @private
 */

function getHeaderNames (res) {
  return typeof res.getHeaderNames !== 'function'
    ? Object.keys(res._headers || {})
    : res.getHeaderNames()
}

/**
 * Determine if emitter has listeners of a given type.
 *
 * The way to do this check is done three different ways in Node.js >= 0.8
 * so this consolidates them into a minimal set using instance methods.
 *
 * @param {EventEmitter} emitter
 * @param {string} type
 * @returns {boolean}
 * @private
 */

function hasListeners (emitter, type) {
  var count = typeof emitter.listenerCount !== 'function'
    ? emitter.listeners(type).length
    : emitter.listenerCount(type)

  return count > 0
}

/**
 * Determine if the response headers have been sent.
 *
 * @param {object} res
 * @returns {boolean}
 * @private
 */

function headersSent (res) {
  return typeof res.headersSent !== 'boolean'
    ? Boolean(res._header)
    : res.headersSent
}

/**
 * Normalize the index option into an array.
 *
 * @param {boolean|string|array} val
 * @param {string} name
 * @private
 */

function normalizeList (val, name) {
  var list = [].concat(val || [])

  for (var i = 0; i < list.length; i++) {
    if (typeof list[i] !== 'string') {
      throw new TypeError(name + ' must be array of strings or false')
    }
  }

  return list
}

/**
 * Parse an HTTP Date into a number.
 *
 * @param {string} date
 * @private
 */

function parseHttpDate (date) {
  var timestamp = date && Date.parse(date)

  return typeof timestamp === 'number'
    ? timestamp
    : NaN
}

/**
 * Parse a HTTP token list.
 *
 * @param {string} str
 * @private
 */

function parseTokenList (str) {
  var end = 0
  var list = []
  var start = 0

  // gather tokens
  for (var i = 0, len = str.length; i < len; i++) {
    switch (str.charCodeAt(i)) {
      case 0x20: /*   */
        if (start === end) {
          start = end = i + 1
        }
        break
      case 0x2c: /* , */
        list.push(str.substring(start, end))
        start = end = i + 1
        break
      default:
        end = i + 1
        break
    }
  }

  // final token
  list.push(str.substring(start, end))

  return list
}

/**
 * Set an object of headers on a response.
 *
 * @param {object} res
 * @param {object} headers
 * @private
 */

function setHeaders (res, headers) {
  var keys = Object.keys(headers)

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    res.setHeader(key, headers[key])
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/webapp/webapp_server.js");

/* Exports */
Package._define("webapp", exports, {
  WebApp: WebApp,
  WebAppInternals: WebAppInternals,
  main: main
});

})();

//# sourceURL=meteor://💻app/packages/webapp.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2ViYXBwL3dlYmFwcF9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dlYmFwcC9jb25uZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy93ZWJhcHAvc29ja2V0X2ZpbGUuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsImV4cG9ydCIsIldlYkFwcCIsIldlYkFwcEludGVybmFscyIsImFzc2VydCIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicmVhZEZpbGUiLCJjcmVhdGVTZXJ2ZXIiLCJwYXRoSm9pbiIsInBhdGhEaXJuYW1lIiwiam9pbiIsImRpcm5hbWUiLCJwYXJzZVVybCIsInBhcnNlIiwiY3JlYXRlSGFzaCIsImNvbm5lY3QiLCJjb21wcmVzcyIsImNvb2tpZVBhcnNlciIsInF1ZXJ5IiwicGFyc2VSZXF1ZXN0IiwiYmFzaWNBdXRoIiwibG9va3VwVXNlckFnZW50IiwibG9va3VwIiwic2VuZCIsInJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSIsInJlZ2lzdGVyU29ja2V0RmlsZUNsZWFudXAiLCJTSE9SVF9TT0NLRVRfVElNRU9VVCIsIkxPTkdfU09DS0VUX1RJTUVPVVQiLCJOcG1Nb2R1bGVzIiwidmVyc2lvbiIsIk5wbSIsImRlZmF1bHRBcmNoIiwiY2xpZW50UHJvZ3JhbXMiLCJhcmNoUGF0aCIsImJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rIiwidXJsIiwiYnVuZGxlZFByZWZpeCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsInNoYTEiLCJjb250ZW50cyIsImhhc2giLCJ1cGRhdGUiLCJkaWdlc3QiLCJyZWFkVXRmOEZpbGVTeW5jIiwiZmlsZW5hbWUiLCJNZXRlb3IiLCJ3cmFwQXN5bmMiLCJjYW1lbENhc2UiLCJuYW1lIiwicGFydHMiLCJzcGxpdCIsInRvTG93ZXJDYXNlIiwiaSIsImxlbmd0aCIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic3Vic3RyIiwiaWRlbnRpZnlCcm93c2VyIiwidXNlckFnZW50U3RyaW5nIiwidXNlckFnZW50IiwiZmFtaWx5IiwibWFqb3IiLCJtaW5vciIsInBhdGNoIiwiY2F0ZWdvcml6ZVJlcXVlc3QiLCJyZXEiLCJfIiwiZXh0ZW5kIiwiYnJvd3NlciIsImhlYWRlcnMiLCJwaWNrIiwiaHRtbEF0dHJpYnV0ZUhvb2tzIiwiZ2V0SHRtbEF0dHJpYnV0ZXMiLCJyZXF1ZXN0IiwiY29tYmluZWRBdHRyaWJ1dGVzIiwiZWFjaCIsImhvb2siLCJhdHRyaWJ1dGVzIiwiRXJyb3IiLCJhZGRIdG1sQXR0cmlidXRlSG9vayIsInB1c2giLCJhcHBVcmwiLCJSb3V0ZVBvbGljeSIsImNsYXNzaWZ5Iiwic3RhcnR1cCIsImNhbGN1bGF0ZUNsaWVudEhhc2giLCJXZWJBcHBIYXNoaW5nIiwiY2xpZW50SGFzaCIsImFyY2hOYW1lIiwibWFuaWZlc3QiLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoQ29yZG92YSIsIl90aW1lb3V0QWRqdXN0bWVudFJlcXVlc3RDYWxsYmFjayIsInJlcyIsInNldFRpbWVvdXQiLCJmaW5pc2hMaXN0ZW5lcnMiLCJsaXN0ZW5lcnMiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJvbiIsImwiLCJib2lsZXJwbGF0ZUJ5QXJjaCIsImJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrcyIsIk9iamVjdCIsImNyZWF0ZSIsInJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2siLCJrZXkiLCJjYWxsYmFjayIsInByZXZpb3VzQ2FsbGJhY2siLCJzdHJpY3RFcXVhbCIsImdldEJvaWxlcnBsYXRlIiwiYXJjaCIsImdldEJvaWxlcnBsYXRlQXN5bmMiLCJhd2FpdCIsImJvaWxlcnBsYXRlIiwiZGF0YSIsImFzc2lnbiIsImJhc2VEYXRhIiwiaHRtbEF0dHJpYnV0ZXMiLCJtYWRlQ2hhbmdlcyIsInByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsImtleXMiLCJmb3JFYWNoIiwidGhlbiIsInJlc3VsdCIsInN0cmVhbSIsInRvSFRNTFN0cmVhbSIsInN0YXR1c0NvZGUiLCJnZW5lcmF0ZUJvaWxlcnBsYXRlSW5zdGFuY2UiLCJhZGRpdGlvbmFsT3B0aW9ucyIsInJ1bnRpbWVDb25maWciLCJjbG9uZSIsInJ1bnRpbWVDb25maWdPdmVycmlkZXMiLCJCb2lsZXJwbGF0ZSIsInBhdGhNYXBwZXIiLCJpdGVtUGF0aCIsImJhc2VEYXRhRXh0ZW5zaW9uIiwiYWRkaXRpb25hbFN0YXRpY0pzIiwibWFwIiwicGF0aG5hbWUiLCJtZXRlb3JSdW50aW1lQ29uZmlnIiwiSlNPTiIsInN0cmluZ2lmeSIsImVuY29kZVVSSUNvbXBvbmVudCIsInJvb3RVcmxQYXRoUHJlZml4IiwiaW5saW5lU2NyaXB0c0FsbG93ZWQiLCJpbmxpbmUiLCJzdGF0aWNGaWxlcyIsInN0YXRpY0ZpbGVzTWlkZGxld2FyZSIsIm5leHQiLCJtZXRob2QiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwic2VydmVTdGF0aWNKcyIsInMiLCJ3cml0ZUhlYWQiLCJ3cml0ZSIsImVuZCIsImhhcyIsImluZm8iLCJtYXhBZ2UiLCJjYWNoZWFibGUiLCJzb3VyY2VNYXBVcmwiLCJzZXRIZWFkZXIiLCJ0eXBlIiwiY29udGVudCIsImFic29sdXRlUGF0aCIsIm1heGFnZSIsImRvdGZpbGVzIiwibGFzdE1vZGlmaWVkIiwiZXJyIiwiTG9nIiwiZXJyb3IiLCJwaXBlIiwiZ2V0VXJsUHJlZml4Rm9yQXJjaCIsInJlcGxhY2UiLCJwYXJzZVBvcnQiLCJwb3J0IiwicGFyc2VkUG9ydCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNOYU4iLCJydW5XZWJBcHBTZXJ2ZXIiLCJzaHV0dGluZ0Rvd24iLCJzeW5jUXVldWUiLCJfU3luY2hyb25vdXNRdWV1ZSIsImdldEl0ZW1QYXRobmFtZSIsIml0ZW1VcmwiLCJyZWxvYWRDbGllbnRQcm9ncmFtcyIsInJ1blRhc2siLCJnZW5lcmF0ZUNsaWVudFByb2dyYW0iLCJjbGllbnRQYXRoIiwiY2xpZW50SnNvblBhdGgiLCJfX21ldGVvcl9ib290c3RyYXBfXyIsInNlcnZlckRpciIsImNsaWVudERpciIsImNsaWVudEpzb24iLCJmb3JtYXQiLCJ1cmxQcmVmaXgiLCJpdGVtIiwid2hlcmUiLCJwYXRoIiwic291cmNlTWFwIiwicHJvZ3JhbSIsInByb2Nlc3MiLCJlbnYiLCJBVVRPVVBEQVRFX1ZFUlNJT04iLCJjb3Jkb3ZhQ29tcGF0aWJpbGl0eVZlcnNpb25zIiwiUFVCTElDX1NFVFRJTkdTIiwibWFuaWZlc3RVcmxQcmVmaXgiLCJtYW5pZmVzdFVybCIsImNsaWVudFBhdGhzIiwiY29uZmlnSnNvbiIsInN0YWNrIiwiZXhpdCIsImdlbmVyYXRlQm9pbGVycGxhdGUiLCJkZWZhdWx0T3B0aW9uc0ZvckFyY2giLCJERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCIsIk1PQklMRV9ERFBfVVJMIiwiYWJzb2x1dGVVcmwiLCJST09UX1VSTCIsIk1PQklMRV9ST09UX1VSTCIsIm1lbW9pemVkQm9pbGVycGxhdGUiLCJjc3NGaWxlcyIsImNzcyIsImFsbENzcyIsImNzc0ZpbGUiLCJyZWZyZXNoYWJsZUFzc2V0cyIsImFwcCIsInJhd0Nvbm5lY3RIYW5kbGVycyIsInVzZSIsImlzVmFsaWRVcmwiLCJyZXNwb25zZSIsInBhdGhQcmVmaXgiLCJzdWJzdHJpbmciLCJtZXRlb3JJbnRlcm5hbEhhbmRsZXJzIiwicGFja2FnZUFuZEFwcEhhbmRsZXJzIiwic3VwcHJlc3NDb25uZWN0RXJyb3JzIiwic3RhdHVzIiwiYXJjaEtleSIsImFyY2hLZXlDbGVhbmVkIiwidGVzdCIsIm5ld0hlYWRlcnMiLCJjYXRjaCIsImh0dHBTZXJ2ZXIiLCJvbkxpc3RlbmluZ0NhbGxiYWNrcyIsInNvY2tldCIsImRlc3Ryb3llZCIsIm1lc3NhZ2UiLCJkZXN0cm95IiwiY29ubmVjdEhhbmRsZXJzIiwiY29ubmVjdEFwcCIsIm9uTGlzdGVuaW5nIiwiZiIsImV4cG9ydHMiLCJtYWluIiwiYXJndiIsInN0YXJ0SHR0cFNlcnZlciIsImxpc3Rlbk9wdGlvbnMiLCJsaXN0ZW4iLCJiaW5kRW52aXJvbm1lbnQiLCJNRVRFT1JfUFJJTlRfT05fTElTVEVOIiwiY29uc29sZSIsImxvZyIsImNhbGxiYWNrcyIsImxvY2FsUG9ydCIsIlBPUlQiLCJ1bml4U29ja2V0UGF0aCIsIlVOSVhfU09DS0VUX1BBVEgiLCJob3N0IiwiQklORF9JUCIsInNldElubGluZVNjcmlwdHNBbGxvd2VkIiwidmFsdWUiLCJzZXRCdW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayIsImhvb2tGbiIsInNldEJ1bmRsZWRKc0Nzc1ByZWZpeCIsInByZWZpeCIsInNlbGYiLCJhZGRTdGF0aWNKcyIsIm5wbUNvbm5lY3QiLCJjb25uZWN0QXJncyIsImhhbmRsZXJzIiwiYXBwbHkiLCJvcmlnaW5hbFVzZSIsInVzZUFyZ3MiLCJvcmlnaW5hbExlbmd0aCIsImVudHJ5Iiwib3JpZ2luYWxIYW5kbGUiLCJoYW5kbGUiLCJhc3luY0FwcGx5IiwiYXJndW1lbnRzIiwic3RhdFN5bmMiLCJ1bmxpbmtTeW5jIiwiZXhpc3RzU3luYyIsInNvY2tldFBhdGgiLCJpc1NvY2tldCIsImNvZGUiLCJldmVudEVtaXR0ZXIiLCJzaWduYWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU1BLFVBQVFDLE1BQWQ7QUFBcUJELFFBQVFFLE1BQVIsQ0FBZTtBQUFDQyxVQUFPLE1BQUlBLE1BQVo7QUFBbUJDLG1CQUFnQixNQUFJQTtBQUF2QyxDQUFmO0FBQXdFLElBQUlDLE1BQUo7QUFBV0wsUUFBUU0sS0FBUixDQUFjQyxRQUFRLFFBQVIsQ0FBZCxFQUFnQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0osYUFBT0ksQ0FBUDtBQUFTOztBQUFyQixDQUFoQyxFQUF1RCxDQUF2RDtBQUEwRCxJQUFJQyxRQUFK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QztBQUN0QyxHQUFDLE1BQUQsRUFBUyxRQUFULEVBQW1CLFFBQW5CLEVBQTZCLFNBQTdCLEVBQXdDbEYsT0FBeEMsQ0FBZ0RnTCxVQUFVO0FBQ3hERCxpQkFBYXhNLEVBQWIsQ0FBZ0J5TSxNQUFoQixFQUF3Qi9QLE9BQU95TixlQUFQLENBQXVCLE1BQU07QUFDbkQsVUFBSWlDLFdBQVdDLFVBQVgsQ0FBSixFQUE0QjtBQUMxQkYsbUJBQVdFLFVBQVg7QUFDRDtBQUNGLEtBSnVCLENBQXhCO0FBS0QsR0FORDtBQU9ELENBVEksQyIsImZpbGUiOiIvcGFja2FnZXMvd2ViYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgY3JlYXRlU2VydmVyIH0gZnJvbSBcImh0dHBcIjtcbmltcG9ydCB7XG4gIGpvaW4gYXMgcGF0aEpvaW4sXG4gIGRpcm5hbWUgYXMgcGF0aERpcm5hbWUsXG59IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyBwYXJzZVVybCB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSBcIi4vY29ubmVjdC5qc1wiO1xuaW1wb3J0IGNvbXByZXNzIGZyb20gXCJjb21wcmVzc2lvblwiO1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tIFwiY29va2llLXBhcnNlclwiO1xuaW1wb3J0IHF1ZXJ5IGZyb20gXCJxcy1taWRkbGV3YXJlXCI7XG5pbXBvcnQgcGFyc2VSZXF1ZXN0IGZyb20gXCJwYXJzZXVybFwiO1xuaW1wb3J0IGJhc2ljQXV0aCBmcm9tIFwiYmFzaWMtYXV0aC1jb25uZWN0XCI7XG5pbXBvcnQgeyBsb29rdXAgYXMgbG9va3VwVXNlckFnZW50IH0gZnJvbSBcInVzZXJhZ2VudFwiO1xuaW1wb3J0IHNlbmQgZnJvbSBcInNlbmRcIjtcbmltcG9ydCB7XG4gIHJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSxcbiAgcmVnaXN0ZXJTb2NrZXRGaWxlQ2xlYW51cCxcbn0gZnJvbSAnLi9zb2NrZXRfZmlsZS5qcyc7XG5cbnZhciBTSE9SVF9TT0NLRVRfVElNRU9VVCA9IDUqMTAwMDtcbnZhciBMT05HX1NPQ0tFVF9USU1FT1VUID0gMTIwKjEwMDA7XG5cbmV4cG9ydCBjb25zdCBXZWJBcHAgPSB7fTtcbmV4cG9ydCBjb25zdCBXZWJBcHBJbnRlcm5hbHMgPSB7fTtcblxuLy8gYmFja3dhcmRzIGNvbXBhdCB0byAyLjAgb2YgY29ubmVjdFxuY29ubmVjdC5iYXNpY0F1dGggPSBiYXNpY0F1dGg7XG5cbldlYkFwcEludGVybmFscy5OcG1Nb2R1bGVzID0ge1xuICBjb25uZWN0OiB7XG4gICAgdmVyc2lvbjogTnBtLnJlcXVpcmUoJ2Nvbm5lY3QvcGFja2FnZS5qc29uJykudmVyc2lvbixcbiAgICBtb2R1bGU6IGNvbm5lY3QsXG4gIH1cbn07XG5cbldlYkFwcC5kZWZhdWx0QXJjaCA9ICd3ZWIuYnJvd3Nlcic7XG5cbi8vIFhYWCBtYXBzIGFyY2hzIHRvIG1hbmlmZXN0c1xuV2ViQXBwLmNsaWVudFByb2dyYW1zID0ge307XG5cbi8vIFhYWCBtYXBzIGFyY2hzIHRvIHByb2dyYW0gcGF0aCBvbiBmaWxlc3lzdGVtXG52YXIgYXJjaFBhdGggPSB7fTtcblxudmFyIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rID0gZnVuY3Rpb24gKHVybCkge1xuICB2YXIgYnVuZGxlZFByZWZpeCA9XG4gICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggfHwgJyc7XG4gIHJldHVybiBidW5kbGVkUHJlZml4ICsgdXJsO1xufTtcblxudmFyIHNoYTEgPSBmdW5jdGlvbiAoY29udGVudHMpIHtcbiAgdmFyIGhhc2ggPSBjcmVhdGVIYXNoKCdzaGExJyk7XG4gIGhhc2gudXBkYXRlKGNvbnRlbnRzKTtcbiAgcmV0dXJuIGhhc2guZGlnZXN0KCdoZXgnKTtcbn07XG5cbnZhciByZWFkVXRmOEZpbGVTeW5jID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gIHJldHVybiBNZXRlb3Iud3JhcEFzeW5jKHJlYWRGaWxlKShmaWxlbmFtZSwgJ3V0ZjgnKTtcbn07XG5cbi8vICNCcm93c2VySWRlbnRpZmljYXRpb25cbi8vXG4vLyBXZSBoYXZlIG11bHRpcGxlIHBsYWNlcyB0aGF0IHdhbnQgdG8gaWRlbnRpZnkgdGhlIGJyb3dzZXI6IHRoZVxuLy8gdW5zdXBwb3J0ZWQgYnJvd3NlciBwYWdlLCB0aGUgYXBwY2FjaGUgcGFja2FnZSwgYW5kLCBldmVudHVhbGx5XG4vLyBkZWxpdmVyaW5nIGJyb3dzZXIgcG9seWZpbGxzIG9ubHkgYXMgbmVlZGVkLlxuLy9cbi8vIFRvIGF2b2lkIGRldGVjdGluZyB0aGUgYnJvd3NlciBpbiBtdWx0aXBsZSBwbGFjZXMgYWQtaG9jLCB3ZSBjcmVhdGUgYVxuLy8gTWV0ZW9yIFwiYnJvd3NlclwiIG9iamVjdC4gSXQgdXNlcyBidXQgZG9lcyBub3QgZXhwb3NlIHRoZSBucG1cbi8vIHVzZXJhZ2VudCBtb2R1bGUgKHdlIGNvdWxkIGNob29zZSBhIGRpZmZlcmVudCBtZWNoYW5pc20gdG8gaWRlbnRpZnlcbi8vIHRoZSBicm93c2VyIGluIHRoZSBmdXR1cmUgaWYgd2Ugd2FudGVkIHRvKS4gIFRoZSBicm93c2VyIG9iamVjdFxuLy8gY29udGFpbnNcbi8vXG4vLyAqIGBuYW1lYDogdGhlIG5hbWUgb2YgdGhlIGJyb3dzZXIgaW4gY2FtZWwgY2FzZVxuLy8gKiBgbWFqb3JgLCBgbWlub3JgLCBgcGF0Y2hgOiBpbnRlZ2VycyBkZXNjcmliaW5nIHRoZSBicm93c2VyIHZlcnNpb25cbi8vXG4vLyBBbHNvIGhlcmUgaXMgYW4gZWFybHkgdmVyc2lvbiBvZiBhIE1ldGVvciBgcmVxdWVzdGAgb2JqZWN0LCBpbnRlbmRlZFxuLy8gdG8gYmUgYSBoaWdoLWxldmVsIGRlc2NyaXB0aW9uIG9mIHRoZSByZXF1ZXN0IHdpdGhvdXQgZXhwb3Npbmdcbi8vIGRldGFpbHMgb2YgY29ubmVjdCdzIGxvdy1sZXZlbCBgcmVxYC4gIEN1cnJlbnRseSBpdCBjb250YWluczpcbi8vXG4vLyAqIGBicm93c2VyYDogYnJvd3NlciBpZGVudGlmaWNhdGlvbiBvYmplY3QgZGVzY3JpYmVkIGFib3ZlXG4vLyAqIGB1cmxgOiBwYXJzZWQgdXJsLCBpbmNsdWRpbmcgcGFyc2VkIHF1ZXJ5IHBhcmFtc1xuLy9cbi8vIEFzIGEgdGVtcG9yYXJ5IGhhY2sgdGhlcmUgaXMgYSBgY2F0ZWdvcml6ZVJlcXVlc3RgIGZ1bmN0aW9uIG9uIFdlYkFwcCB3aGljaFxuLy8gY29udmVydHMgYSBjb25uZWN0IGByZXFgIHRvIGEgTWV0ZW9yIGByZXF1ZXN0YC4gVGhpcyBjYW4gZ28gYXdheSBvbmNlIHNtYXJ0XG4vLyBwYWNrYWdlcyBzdWNoIGFzIGFwcGNhY2hlIGFyZSBiZWluZyBwYXNzZWQgYSBgcmVxdWVzdGAgb2JqZWN0IGRpcmVjdGx5IHdoZW5cbi8vIHRoZXkgc2VydmUgY29udGVudC5cbi8vXG4vLyBUaGlzIGFsbG93cyBgcmVxdWVzdGAgdG8gYmUgdXNlZCB1bmlmb3JtbHk6IGl0IGlzIHBhc3NlZCB0byB0aGUgaHRtbFxuLy8gYXR0cmlidXRlcyBob29rLCBhbmQgdGhlIGFwcGNhY2hlIHBhY2thZ2UgY2FuIHVzZSBpdCB3aGVuIGRlY2lkaW5nXG4vLyB3aGV0aGVyIHRvIGdlbmVyYXRlIGEgNDA0IGZvciB0aGUgbWFuaWZlc3QuXG4vL1xuLy8gUmVhbCByb3V0aW5nIC8gc2VydmVyIHNpZGUgcmVuZGVyaW5nIHdpbGwgcHJvYmFibHkgcmVmYWN0b3IgdGhpc1xuLy8gaGVhdmlseS5cblxuXG4vLyBlLmcuIFwiTW9iaWxlIFNhZmFyaVwiID0+IFwibW9iaWxlU2FmYXJpXCJcbnZhciBjYW1lbENhc2UgPSBmdW5jdGlvbiAobmFtZSkge1xuICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcgJyk7XG4gIHBhcnRzWzBdID0gcGFydHNbMF0udG9Mb3dlckNhc2UoKTtcbiAgZm9yICh2YXIgaSA9IDE7ICBpIDwgcGFydHMubGVuZ3RoOyAgKytpKSB7XG4gICAgcGFydHNbaV0gPSBwYXJ0c1tpXS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHBhcnRzW2ldLnN1YnN0cigxKTtcbiAgfVxuICByZXR1cm4gcGFydHMuam9pbignJyk7XG59O1xuXG52YXIgaWRlbnRpZnlCcm93c2VyID0gZnVuY3Rpb24gKHVzZXJBZ2VudFN0cmluZykge1xuICB2YXIgdXNlckFnZW50ID0gbG9va3VwVXNlckFnZW50KHVzZXJBZ2VudFN0cmluZyk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogY2FtZWxDYXNlKHVzZXJBZ2VudC5mYW1pbHkpLFxuICAgIG1ham9yOiArdXNlckFnZW50Lm1ham9yLFxuICAgIG1pbm9yOiArdXNlckFnZW50Lm1pbm9yLFxuICAgIHBhdGNoOiArdXNlckFnZW50LnBhdGNoXG4gIH07XG59O1xuXG4vLyBYWFggUmVmYWN0b3IgYXMgcGFydCBvZiBpbXBsZW1lbnRpbmcgcmVhbCByb3V0aW5nLlxuV2ViQXBwSW50ZXJuYWxzLmlkZW50aWZ5QnJvd3NlciA9IGlkZW50aWZ5QnJvd3NlcjtcblxuV2ViQXBwLmNhdGVnb3JpemVSZXF1ZXN0ID0gZnVuY3Rpb24gKHJlcSkge1xuICByZXR1cm4gXy5leHRlbmQoe1xuICAgIGJyb3dzZXI6IGlkZW50aWZ5QnJvd3NlcihyZXEuaGVhZGVyc1sndXNlci1hZ2VudCddKSxcbiAgICB1cmw6IHBhcnNlVXJsKHJlcS51cmwsIHRydWUpXG4gIH0sIF8ucGljayhyZXEsICdkeW5hbWljSGVhZCcsICdkeW5hbWljQm9keScsICdoZWFkZXJzJywgJ2Nvb2tpZXMnKSk7XG59O1xuXG4vLyBIVE1MIGF0dHJpYnV0ZSBob29rczogZnVuY3Rpb25zIHRvIGJlIGNhbGxlZCB0byBkZXRlcm1pbmUgYW55IGF0dHJpYnV0ZXMgdG9cbi8vIGJlIGFkZGVkIHRvIHRoZSAnPGh0bWw+JyB0YWcuIEVhY2ggZnVuY3Rpb24gaXMgcGFzc2VkIGEgJ3JlcXVlc3QnIG9iamVjdCAoc2VlXG4vLyAjQnJvd3NlcklkZW50aWZpY2F0aW9uKSBhbmQgc2hvdWxkIHJldHVybiBudWxsIG9yIG9iamVjdC5cbnZhciBodG1sQXR0cmlidXRlSG9va3MgPSBbXTtcbnZhciBnZXRIdG1sQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gIHZhciBjb21iaW5lZEF0dHJpYnV0ZXMgID0ge307XG4gIF8uZWFjaChodG1sQXR0cmlidXRlSG9va3MgfHwgW10sIGZ1bmN0aW9uIChob29rKSB7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBob29rKHJlcXVlc3QpO1xuICAgIGlmIChhdHRyaWJ1dGVzID09PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIGlmICh0eXBlb2YgYXR0cmlidXRlcyAhPT0gJ29iamVjdCcpXG4gICAgICB0aHJvdyBFcnJvcihcIkhUTUwgYXR0cmlidXRlIGhvb2sgbXVzdCByZXR1cm4gbnVsbCBvciBvYmplY3RcIik7XG4gICAgXy5leHRlbmQoY29tYmluZWRBdHRyaWJ1dGVzLCBhdHRyaWJ1dGVzKTtcbiAgfSk7XG4gIHJldHVybiBjb21iaW5lZEF0dHJpYnV0ZXM7XG59O1xuV2ViQXBwLmFkZEh0bWxBdHRyaWJ1dGVIb29rID0gZnVuY3Rpb24gKGhvb2spIHtcbiAgaHRtbEF0dHJpYnV0ZUhvb2tzLnB1c2goaG9vayk7XG59O1xuXG4vLyBTZXJ2ZSBhcHAgSFRNTCBmb3IgdGhpcyBVUkw/XG52YXIgYXBwVXJsID0gZnVuY3Rpb24gKHVybCkge1xuICBpZiAodXJsID09PSAnL2Zhdmljb24uaWNvJyB8fCB1cmwgPT09ICcvcm9ib3RzLnR4dCcpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIE5PVEU6IGFwcC5tYW5pZmVzdCBpcyBub3QgYSB3ZWIgc3RhbmRhcmQgbGlrZSBmYXZpY29uLmljbyBhbmRcbiAgLy8gcm9ib3RzLnR4dC4gSXQgaXMgYSBmaWxlIG5hbWUgd2UgaGF2ZSBjaG9zZW4gdG8gdXNlIGZvciBIVE1MNVxuICAvLyBhcHBjYWNoZSBVUkxzLiBJdCBpcyBpbmNsdWRlZCBoZXJlIHRvIHByZXZlbnQgdXNpbmcgYW4gYXBwY2FjaGVcbiAgLy8gdGhlbiByZW1vdmluZyBpdCBmcm9tIHBvaXNvbmluZyBhbiBhcHAgcGVybWFuZW50bHkuIEV2ZW50dWFsbHksXG4gIC8vIG9uY2Ugd2UgaGF2ZSBzZXJ2ZXIgc2lkZSByb3V0aW5nLCB0aGlzIHdvbid0IGJlIG5lZWRlZCBhc1xuICAvLyB1bmtub3duIFVSTHMgd2l0aCByZXR1cm4gYSA0MDQgYXV0b21hdGljYWxseS5cbiAgaWYgKHVybCA9PT0gJy9hcHAubWFuaWZlc3QnKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBBdm9pZCBzZXJ2aW5nIGFwcCBIVE1MIGZvciBkZWNsYXJlZCByb3V0ZXMgc3VjaCBhcyAvc29ja2pzLy5cbiAgaWYgKFJvdXRlUG9saWN5LmNsYXNzaWZ5KHVybCkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIHdlIGN1cnJlbnRseSByZXR1cm4gYXBwIEhUTUwgb24gYWxsIFVSTHMgYnkgZGVmYXVsdFxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLy8gV2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIGNsaWVudCBoYXNoIGFmdGVyIGFsbCBwYWNrYWdlcyBoYXZlIGxvYWRlZFxuLy8gdG8gZ2l2ZSB0aGVtIGEgY2hhbmNlIHRvIHBvcHVsYXRlIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uXG4vL1xuLy8gQ2FsY3VsYXRpbmcgdGhlIGhhc2ggZHVyaW5nIHN0YXJ0dXAgbWVhbnMgdGhhdCBwYWNrYWdlcyBjYW4gb25seVxuLy8gcG9wdWxhdGUgX19tZXRlb3JfcnVudGltZV9jb25maWdfXyBkdXJpbmcgbG9hZCwgbm90IGR1cmluZyBzdGFydHVwLlxuLy9cbi8vIENhbGN1bGF0aW5nIGluc3RlYWQgaXQgYXQgdGhlIGJlZ2lubmluZyBvZiBtYWluIGFmdGVyIGFsbCBzdGFydHVwXG4vLyBob29rcyBoYWQgcnVuIHdvdWxkIGFsbG93IHBhY2thZ2VzIHRvIGFsc28gcG9wdWxhdGVcbi8vIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gZHVyaW5nIHN0YXJ0dXAsIGJ1dCB0aGF0J3MgdG9vIGxhdGUgZm9yXG4vLyBhdXRvdXBkYXRlIGJlY2F1c2UgaXQgbmVlZHMgdG8gaGF2ZSB0aGUgY2xpZW50IGhhc2ggYXQgc3RhcnR1cCB0b1xuLy8gaW5zZXJ0IHRoZSBhdXRvIHVwZGF0ZSB2ZXJzaW9uIGl0c2VsZiBpbnRvXG4vLyBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIHRvIGdldCBpdCB0byB0aGUgY2xpZW50LlxuLy9cbi8vIEFuIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIGdpdmUgYXV0b3VwZGF0ZSBhIFwicG9zdC1zdGFydCxcbi8vIHByZS1saXN0ZW5cIiBob29rIHRvIGFsbG93IGl0IHRvIGluc2VydCB0aGUgYXV0byB1cGRhdGUgdmVyc2lvbiBhdFxuLy8gdGhlIHJpZ2h0IG1vbWVudC5cblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xuICB2YXIgY2FsY3VsYXRlQ2xpZW50SGFzaCA9IFdlYkFwcEhhc2hpbmcuY2FsY3VsYXRlQ2xpZW50SGFzaDtcbiAgV2ViQXBwLmNsaWVudEhhc2ggPSBmdW5jdGlvbiAoYXJjaE5hbWUpIHtcbiAgICBhcmNoTmFtZSA9IGFyY2hOYW1lIHx8IFdlYkFwcC5kZWZhdWx0QXJjaDtcbiAgICByZXR1cm4gY2FsY3VsYXRlQ2xpZW50SGFzaChXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaE5hbWVdLm1hbmlmZXN0KTtcbiAgfTtcblxuICBXZWJBcHAuY2FsY3VsYXRlQ2xpZW50SGFzaFJlZnJlc2hhYmxlID0gZnVuY3Rpb24gKGFyY2hOYW1lKSB7XG4gICAgYXJjaE5hbWUgPSBhcmNoTmFtZSB8fCBXZWJBcHAuZGVmYXVsdEFyY2g7XG4gICAgcmV0dXJuIGNhbGN1bGF0ZUNsaWVudEhhc2goV2ViQXBwLmNsaWVudFByb2dyYW1zW2FyY2hOYW1lXS5tYW5pZmVzdCxcbiAgICAgIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBuYW1lID09PSBcImNzc1wiO1xuICAgICAgfSk7XG4gIH07XG4gIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUgPSBmdW5jdGlvbiAoYXJjaE5hbWUpIHtcbiAgICBhcmNoTmFtZSA9IGFyY2hOYW1lIHx8IFdlYkFwcC5kZWZhdWx0QXJjaDtcbiAgICByZXR1cm4gY2FsY3VsYXRlQ2xpZW50SGFzaChXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaE5hbWVdLm1hbmlmZXN0LFxuICAgICAgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IFwiY3NzXCI7XG4gICAgICB9KTtcbiAgfTtcbiAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hDb3Jkb3ZhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmNoTmFtZSA9ICd3ZWIuY29yZG92YSc7XG4gICAgaWYgKCEgV2ViQXBwLmNsaWVudFByb2dyYW1zW2FyY2hOYW1lXSlcbiAgICAgIHJldHVybiAnbm9uZSc7XG5cbiAgICByZXR1cm4gY2FsY3VsYXRlQ2xpZW50SGFzaChcbiAgICAgIFdlYkFwcC5jbGllbnRQcm9ncmFtc1thcmNoTmFtZV0ubWFuaWZlc3QsIG51bGwsIF8ucGljayhcbiAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXywgJ1BVQkxJQ19TRVRUSU5HUycpKTtcbiAgfTtcbn0pO1xuXG5cblxuLy8gV2hlbiB3ZSBoYXZlIGEgcmVxdWVzdCBwZW5kaW5nLCB3ZSB3YW50IHRoZSBzb2NrZXQgdGltZW91dCB0byBiZSBsb25nLCB0b1xuLy8gZ2l2ZSBvdXJzZWx2ZXMgYSB3aGlsZSB0byBzZXJ2ZSBpdCwgYW5kIHRvIGFsbG93IHNvY2tqcyBsb25nIHBvbGxzIHRvXG4vLyBjb21wbGV0ZS4gIE9uIHRoZSBvdGhlciBoYW5kLCB3ZSB3YW50IHRvIGNsb3NlIGlkbGUgc29ja2V0cyByZWxhdGl2ZWx5XG4vLyBxdWlja2x5LCBzbyB0aGF0IHdlIGNhbiBzaHV0IGRvd24gcmVsYXRpdmVseSBwcm9tcHRseSBidXQgY2xlYW5seSwgd2l0aG91dFxuLy8gY3V0dGluZyBvZmYgYW55b25lJ3MgcmVzcG9uc2UuXG5XZWJBcHAuX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrID0gZnVuY3Rpb24gKHJlcSwgcmVzKSB7XG4gIC8vIHRoaXMgaXMgcmVhbGx5IGp1c3QgcmVxLnNvY2tldC5zZXRUaW1lb3V0KExPTkdfU09DS0VUX1RJTUVPVVQpO1xuICByZXEuc2V0VGltZW91dChMT05HX1NPQ0tFVF9USU1FT1VUKTtcbiAgLy8gSW5zZXJ0IG91ciBuZXcgZmluaXNoIGxpc3RlbmVyIHRvIHJ1biBCRUZPUkUgdGhlIGV4aXN0aW5nIG9uZSB3aGljaCByZW1vdmVzXG4gIC8vIHRoZSByZXNwb25zZSBmcm9tIHRoZSBzb2NrZXQuXG4gIHZhciBmaW5pc2hMaXN0ZW5lcnMgPSByZXMubGlzdGVuZXJzKCdmaW5pc2gnKTtcbiAgLy8gWFhYIEFwcGFyZW50bHkgaW4gTm9kZSAwLjEyIHRoaXMgZXZlbnQgd2FzIGNhbGxlZCAncHJlZmluaXNoJy5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2NvbW1pdC83YzliNjA3MFxuICAvLyBCdXQgaXQgaGFzIHN3aXRjaGVkIGJhY2sgdG8gJ2ZpbmlzaCcgaW4gTm9kZSB2NDpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL3B1bGwvMTQxMVxuICByZXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdmaW5pc2gnKTtcbiAgcmVzLm9uKCdmaW5pc2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmVzLnNldFRpbWVvdXQoU0hPUlRfU09DS0VUX1RJTUVPVVQpO1xuICB9KTtcbiAgXy5lYWNoKGZpbmlzaExpc3RlbmVycywgZnVuY3Rpb24gKGwpIHsgcmVzLm9uKCdmaW5pc2gnLCBsKTsgfSk7XG59O1xuXG5cbi8vIFdpbGwgYmUgdXBkYXRlZCBieSBtYWluIGJlZm9yZSB3ZSBsaXN0ZW4uXG4vLyBNYXAgZnJvbSBjbGllbnQgYXJjaCB0byBib2lsZXJwbGF0ZSBvYmplY3QuXG4vLyBCb2lsZXJwbGF0ZSBvYmplY3QgaGFzOlxuLy8gICAtIGZ1bmM6IFhYWFxuLy8gICAtIGJhc2VEYXRhOiBYWFhcbnZhciBib2lsZXJwbGF0ZUJ5QXJjaCA9IHt9O1xuXG4vLyBSZWdpc3RlciBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgY2FuIHNlbGVjdGl2ZWx5IG1vZGlmeSBib2lsZXJwbGF0ZVxuLy8gZGF0YSBnaXZlbiBhcmd1bWVudHMgKHJlcXVlc3QsIGRhdGEsIGFyY2gpLiBUaGUga2V5IHNob3VsZCBiZSBhIHVuaXF1ZVxuLy8gaWRlbnRpZmllciwgdG8gcHJldmVudCBhY2N1bXVsYXRpbmcgZHVwbGljYXRlIGNhbGxiYWNrcyBmcm9tIHRoZSBzYW1lXG4vLyBjYWxsIHNpdGUgb3ZlciB0aW1lLiBDYWxsYmFja3Mgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIG9yZGVyIHRoZXkgd2VyZVxuLy8gcmVnaXN0ZXJlZC4gQSBjYWxsYmFjayBzaG91bGQgcmV0dXJuIGZhbHNlIGlmIGl0IGRpZCBub3QgbWFrZSBhbnlcbi8vIGNoYW5nZXMgYWZmZWN0aW5nIHRoZSBib2lsZXJwbGF0ZS4gUGFzc2luZyBudWxsIGRlbGV0ZXMgdGhlIGNhbGxiYWNrLlxuLy8gQW55IHByZXZpb3VzIGNhbGxiYWNrIHJlZ2lzdGVyZWQgZm9yIHRoaXMga2V5IHdpbGwgYmUgcmV0dXJuZWQuXG5jb25zdCBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuV2ViQXBwSW50ZXJuYWxzLnJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2sgPSBmdW5jdGlvbiAoa2V5LCBjYWxsYmFjaykge1xuICBjb25zdCBwcmV2aW91c0NhbGxiYWNrID0gYm9pbGVycGxhdGVEYXRhQ2FsbGJhY2tzW2tleV07XG5cbiAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgYm9pbGVycGxhdGVEYXRhQ2FsbGJhY2tzW2tleV0gPSBjYWxsYmFjaztcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwoY2FsbGJhY2ssIG51bGwpO1xuICAgIGRlbGV0ZSBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3Nba2V5XTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgcHJldmlvdXMgY2FsbGJhY2sgaW4gY2FzZSB0aGUgbmV3IGNhbGxiYWNrIG5lZWRzIHRvIGNhbGxcbiAgLy8gaXQ7IGZvciBleGFtcGxlLCB3aGVuIHRoZSBuZXcgY2FsbGJhY2sgaXMgYSB3cmFwcGVyIGZvciB0aGUgb2xkLlxuICByZXR1cm4gcHJldmlvdXNDYWxsYmFjayB8fCBudWxsO1xufTtcblxuLy8gR2l2ZW4gYSByZXF1ZXN0IChhcyByZXR1cm5lZCBmcm9tIGBjYXRlZ29yaXplUmVxdWVzdGApLCByZXR1cm4gdGhlXG4vLyBib2lsZXJwbGF0ZSBIVE1MIHRvIHNlcnZlIGZvciB0aGF0IHJlcXVlc3QuXG4vL1xuLy8gSWYgYSBwcmV2aW91cyBjb25uZWN0IG1pZGRsZXdhcmUgaGFzIHJlbmRlcmVkIGNvbnRlbnQgZm9yIHRoZSBoZWFkIG9yIGJvZHksXG4vLyByZXR1cm5zIHRoZSBib2lsZXJwbGF0ZSB3aXRoIHRoYXQgY29udGVudCBwYXRjaGVkIGluIG90aGVyd2lzZVxuLy8gbWVtb2l6ZXMgb24gSFRNTCBhdHRyaWJ1dGVzICh1c2VkIGJ5LCBlZywgYXBwY2FjaGUpIGFuZCB3aGV0aGVyIGlubGluZVxuLy8gc2NyaXB0cyBhcmUgY3VycmVudGx5IGFsbG93ZWQuXG4vLyBYWFggc28gZmFyIHRoaXMgZnVuY3Rpb24gaXMgYWx3YXlzIGNhbGxlZCB3aXRoIGFyY2ggPT09ICd3ZWIuYnJvd3NlcidcbmZ1bmN0aW9uIGdldEJvaWxlcnBsYXRlKHJlcXVlc3QsIGFyY2gpIHtcbiAgcmV0dXJuIGdldEJvaWxlcnBsYXRlQXN5bmMocmVxdWVzdCwgYXJjaCkuYXdhaXQoKTtcbn1cblxuZnVuY3Rpb24gZ2V0Qm9pbGVycGxhdGVBc3luYyhyZXF1ZXN0LCBhcmNoKSB7XG4gIGNvbnN0IGJvaWxlcnBsYXRlID0gYm9pbGVycGxhdGVCeUFyY2hbYXJjaF07XG4gIGNvbnN0IGRhdGEgPSBPYmplY3QuYXNzaWduKHt9LCBib2lsZXJwbGF0ZS5iYXNlRGF0YSwge1xuICAgIGh0bWxBdHRyaWJ1dGVzOiBnZXRIdG1sQXR0cmlidXRlcyhyZXF1ZXN0KSxcbiAgfSwgXy5waWNrKHJlcXVlc3QsIFwiZHluYW1pY0hlYWRcIiwgXCJkeW5hbWljQm9keVwiKSk7XG5cbiAgbGV0IG1hZGVDaGFuZ2VzID0gZmFsc2U7XG4gIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgT2JqZWN0LmtleXMoYm9pbGVycGxhdGVEYXRhQ2FsbGJhY2tzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgcHJvbWlzZSA9IHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBjYWxsYmFjayA9IGJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrc1trZXldO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHJlcXVlc3QsIGRhdGEsIGFyY2gpO1xuICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgIC8vIENhbGxiYWNrcyBzaG91bGQgcmV0dXJuIGZhbHNlIGlmIHRoZXkgZGlkIG5vdCBtYWtlIGFueSBjaGFuZ2VzLlxuICAgICAgaWYgKHJlc3VsdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgbWFkZUNoYW5nZXMgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gcHJvbWlzZS50aGVuKCgpID0+ICh7XG4gICAgc3RyZWFtOiBib2lsZXJwbGF0ZS50b0hUTUxTdHJlYW0oZGF0YSksXG4gICAgc3RhdHVzQ29kZTogZGF0YS5zdGF0dXNDb2RlLFxuICAgIGhlYWRlcnM6IGRhdGEuaGVhZGVycyxcbiAgfSkpO1xufVxuXG5XZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZUluc3RhbmNlID0gZnVuY3Rpb24gKGFyY2gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hbmlmZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRpdGlvbmFsT3B0aW9ucykge1xuICBhZGRpdGlvbmFsT3B0aW9ucyA9IGFkZGl0aW9uYWxPcHRpb25zIHx8IHt9O1xuXG4gIHZhciBydW50aW1lQ29uZmlnID0gXy5leHRlbmQoXG4gICAgXy5jbG9uZShfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fKSxcbiAgICBhZGRpdGlvbmFsT3B0aW9ucy5ydW50aW1lQ29uZmlnT3ZlcnJpZGVzIHx8IHt9XG4gICk7XG4gIHJldHVybiBuZXcgQm9pbGVycGxhdGUoYXJjaCwgbWFuaWZlc3QsXG4gICAgXy5leHRlbmQoe1xuICAgICAgcGF0aE1hcHBlcjogZnVuY3Rpb24gKGl0ZW1QYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSm9pbihhcmNoUGF0aFthcmNoXSwgaXRlbVBhdGgpOyB9LFxuICAgICAgYmFzZURhdGFFeHRlbnNpb246IHtcbiAgICAgICAgYWRkaXRpb25hbFN0YXRpY0pzOiBfLm1hcChcbiAgICAgICAgICBhZGRpdGlvbmFsU3RhdGljSnMgfHwgW10sXG4gICAgICAgICAgZnVuY3Rpb24gKGNvbnRlbnRzLCBwYXRobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcGF0aG5hbWU6IHBhdGhuYW1lLFxuICAgICAgICAgICAgICBjb250ZW50czogY29udGVudHNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICApLFxuICAgICAgICAvLyBDb252ZXJ0IHRvIGEgSlNPTiBzdHJpbmcsIHRoZW4gZ2V0IHJpZCBvZiBtb3N0IHdlaXJkIGNoYXJhY3RlcnMsIHRoZW5cbiAgICAgICAgLy8gd3JhcCBpbiBkb3VibGUgcXVvdGVzLiAoVGhlIG91dGVybW9zdCBKU09OLnN0cmluZ2lmeSByZWFsbHkgb3VnaHQgdG9cbiAgICAgICAgLy8ganVzdCBiZSBcIndyYXAgaW4gZG91YmxlIHF1b3Rlc1wiIGJ1dCB3ZSB1c2UgaXQgdG8gYmUgc2FmZS4pIFRoaXMgbWlnaHRcbiAgICAgICAgLy8gZW5kIHVwIGluc2lkZSBhIDxzY3JpcHQ+IHRhZyBzbyB3ZSBuZWVkIHRvIGJlIGNhcmVmdWwgdG8gbm90IGluY2x1ZGVcbiAgICAgICAgLy8gXCI8L3NjcmlwdD5cIiwgYnV0IG5vcm1hbCB7e3NwYWNlYmFyc319IGVzY2FwaW5nIGVzY2FwZXMgdG9vIG11Y2ghIFNlZVxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvMzczMFxuICAgICAgICBtZXRlb3JSdW50aW1lQ29uZmlnOiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkocnVudGltZUNvbmZpZykpKSxcbiAgICAgICAgcm9vdFVybFBhdGhQcmVmaXg6IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggfHwgJycsXG4gICAgICAgIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rOiBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayxcbiAgICAgICAgaW5saW5lU2NyaXB0c0FsbG93ZWQ6IFdlYkFwcEludGVybmFscy5pbmxpbmVTY3JpcHRzQWxsb3dlZCgpLFxuICAgICAgICBpbmxpbmU6IGFkZGl0aW9uYWxPcHRpb25zLmlubGluZVxuICAgICAgfVxuICAgIH0sIGFkZGl0aW9uYWxPcHRpb25zKVxuICApO1xufTtcblxuLy8gQSBtYXBwaW5nIGZyb20gdXJsIHBhdGggdG8gXCJpbmZvXCIuIFdoZXJlIFwiaW5mb1wiIGhhcyB0aGUgZm9sbG93aW5nIGZpZWxkczpcbi8vIC0gdHlwZTogdGhlIHR5cGUgb2YgZmlsZSB0byBiZSBzZXJ2ZWRcbi8vIC0gY2FjaGVhYmxlOiBvcHRpb25hbGx5LCB3aGV0aGVyIHRoZSBmaWxlIHNob3VsZCBiZSBjYWNoZWQgb3Igbm90XG4vLyAtIHNvdXJjZU1hcFVybDogb3B0aW9uYWxseSwgdGhlIHVybCBvZiB0aGUgc291cmNlIG1hcFxuLy9cbi8vIEluZm8gYWxzbyBjb250YWlucyBvbmUgb2YgdGhlIGZvbGxvd2luZzpcbi8vIC0gY29udGVudDogdGhlIHN0cmluZ2lmaWVkIGNvbnRlbnQgdGhhdCBzaG91bGQgYmUgc2VydmVkIGF0IHRoaXMgcGF0aFxuLy8gLSBhYnNvbHV0ZVBhdGg6IHRoZSBhYnNvbHV0ZSBwYXRoIG9uIGRpc2sgdG8gdGhlIGZpbGVcblxudmFyIHN0YXRpY0ZpbGVzO1xuXG4vLyBTZXJ2ZSBzdGF0aWMgZmlsZXMgZnJvbSB0aGUgbWFuaWZlc3Qgb3IgYWRkZWQgd2l0aFxuLy8gYGFkZFN0YXRpY0pzYC4gRXhwb3J0ZWQgZm9yIHRlc3RzLlxuV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzTWlkZGxld2FyZSA9IGZ1bmN0aW9uIChzdGF0aWNGaWxlcywgcmVxLCByZXMsIG5leHQpIHtcbiAgaWYgKCdHRVQnICE9IHJlcS5tZXRob2QgJiYgJ0hFQUQnICE9IHJlcS5tZXRob2QgJiYgJ09QVElPTlMnICE9IHJlcS5tZXRob2QpIHtcbiAgICBuZXh0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBwYXRobmFtZSA9IHBhcnNlUmVxdWVzdChyZXEpLnBhdGhuYW1lO1xuICB0cnkge1xuICAgIHBhdGhuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG5leHQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VydmVTdGF0aWNKcyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcbiAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdDsgY2hhcnNldD1VVEYtOCdcbiAgICB9KTtcbiAgICByZXMud3JpdGUocyk7XG4gICAgcmVzLmVuZCgpO1xuICB9O1xuXG4gIGlmIChwYXRobmFtZSA9PT0gXCIvbWV0ZW9yX3J1bnRpbWVfY29uZmlnLmpzXCIgJiZcbiAgICAgICEgV2ViQXBwSW50ZXJuYWxzLmlubGluZVNjcmlwdHNBbGxvd2VkKCkpIHtcbiAgICBzZXJ2ZVN0YXRpY0pzKFwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyA9IFwiICtcbiAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18pICsgXCI7XCIpO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChfLmhhcyhhZGRpdGlvbmFsU3RhdGljSnMsIHBhdGhuYW1lKSAmJlxuICAgICAgICAgICAgICAhIFdlYkFwcEludGVybmFscy5pbmxpbmVTY3JpcHRzQWxsb3dlZCgpKSB7XG4gICAgc2VydmVTdGF0aWNKcyhhZGRpdGlvbmFsU3RhdGljSnNbcGF0aG5hbWVdKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIV8uaGFzKHN0YXRpY0ZpbGVzLCBwYXRobmFtZSkpIHtcbiAgICBuZXh0KCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gV2UgZG9uJ3QgbmVlZCB0byBjYWxsIHBhdXNlIGJlY2F1c2UsIHVubGlrZSAnc3RhdGljJywgb25jZSB3ZSBjYWxsIGludG9cbiAgLy8gJ3NlbmQnIGFuZCB5aWVsZCB0byB0aGUgZXZlbnQgbG9vcCwgd2UgbmV2ZXIgY2FsbCBhbm90aGVyIGhhbmRsZXIgd2l0aFxuICAvLyAnbmV4dCcuXG5cbiAgdmFyIGluZm8gPSBzdGF0aWNGaWxlc1twYXRobmFtZV07XG5cbiAgLy8gQ2FjaGVhYmxlIGZpbGVzIGFyZSBmaWxlcyB0aGF0IHNob3VsZCBuZXZlciBjaGFuZ2UuIFR5cGljYWxseVxuICAvLyBuYW1lZCBieSB0aGVpciBoYXNoIChlZyBtZXRlb3IgYnVuZGxlZCBqcyBhbmQgY3NzIGZpbGVzKS5cbiAgLy8gV2UgY2FjaGUgdGhlbSB+Zm9yZXZlciAoMXlyKS5cbiAgdmFyIG1heEFnZSA9IGluZm8uY2FjaGVhYmxlXG4gICAgICAgID8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDM2NVxuICAgICAgICA6IDA7XG5cbiAgLy8gU2V0IHRoZSBYLVNvdXJjZU1hcCBoZWFkZXIsIHdoaWNoIGN1cnJlbnQgQ2hyb21lLCBGaXJlRm94LCBhbmQgU2FmYXJpXG4gIC8vIHVuZGVyc3RhbmQuICAoVGhlIFNvdXJjZU1hcCBoZWFkZXIgaXMgc2xpZ2h0bHkgbW9yZSBzcGVjLWNvcnJlY3QgYnV0IEZGXG4gIC8vIGRvZXNuJ3QgdW5kZXJzdGFuZCBpdC4pXG4gIC8vXG4gIC8vIFlvdSBtYXkgYWxzbyBuZWVkIHRvIGVuYWJsZSBzb3VyY2UgbWFwcyBpbiBDaHJvbWU6IG9wZW4gZGV2IHRvb2xzLCBjbGlja1xuICAvLyB0aGUgZ2VhciBpbiB0aGUgYm90dG9tIHJpZ2h0IGNvcm5lciwgYW5kIHNlbGVjdCBcImVuYWJsZSBzb3VyY2UgbWFwc1wiLlxuICBpZiAoaW5mby5zb3VyY2VNYXBVcmwpIHtcbiAgICByZXMuc2V0SGVhZGVyKCdYLVNvdXJjZU1hcCcsXG4gICAgICAgICAgICAgICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYICtcbiAgICAgICAgICAgICAgICAgIGluZm8uc291cmNlTWFwVXJsKTtcbiAgfVxuXG4gIGlmIChpbmZvLnR5cGUgPT09IFwianNcIiB8fFxuICAgICAgaW5mby50eXBlID09PSBcImR5bmFtaWMganNcIikge1xuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0OyBjaGFyc2V0PVVURi04XCIpO1xuICB9IGVsc2UgaWYgKGluZm8udHlwZSA9PT0gXCJjc3NcIikge1xuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L2NzczsgY2hhcnNldD1VVEYtOFwiKTtcbiAgfSBlbHNlIGlmIChpbmZvLnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9VVRGLThcIik7XG4gIH1cblxuICBpZiAoaW5mby5oYXNoKSB7XG4gICAgcmVzLnNldEhlYWRlcignRVRhZycsICdcIicgKyBpbmZvLmhhc2ggKyAnXCInKTtcbiAgfVxuXG4gIGlmIChpbmZvLmNvbnRlbnQpIHtcbiAgICByZXMud3JpdGUoaW5mby5jb250ZW50KTtcbiAgICByZXMuZW5kKCk7XG4gIH0gZWxzZSB7XG4gICAgc2VuZChyZXEsIGluZm8uYWJzb2x1dGVQYXRoLCB7XG4gICAgICAgIG1heGFnZTogbWF4QWdlLFxuICAgICAgICBkb3RmaWxlczogJ2FsbG93JywgLy8gaWYgd2Ugc3BlY2lmaWVkIGEgZG90ZmlsZSBpbiB0aGUgbWFuaWZlc3QsIHNlcnZlIGl0XG4gICAgICAgIGxhc3RNb2RpZmllZDogZmFsc2UgLy8gZG9uJ3Qgc2V0IGxhc3QtbW9kaWZpZWQgYmFzZWQgb24gdGhlIGZpbGUgZGF0ZVxuICAgICAgfSkub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBMb2cuZXJyb3IoXCJFcnJvciBzZXJ2aW5nIHN0YXRpYyBmaWxlIFwiICsgZXJyKTtcbiAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xuICAgICAgICByZXMuZW5kKCk7XG4gICAgICB9KVxuICAgICAgLm9uKCdkaXJlY3RvcnknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIExvZy5lcnJvcihcIlVuZXhwZWN0ZWQgZGlyZWN0b3J5IFwiICsgaW5mby5hYnNvbHV0ZVBhdGgpO1xuICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgIHJlcy5lbmQoKTtcbiAgICAgIH0pXG4gICAgICAucGlwZShyZXMpO1xuICB9XG59O1xuXG52YXIgZ2V0VXJsUHJlZml4Rm9yQXJjaCA9IGZ1bmN0aW9uIChhcmNoKSB7XG4gIC8vIFhYWCB3ZSByZWx5IG9uIHRoZSBmYWN0IHRoYXQgYXJjaCBuYW1lcyBkb24ndCBjb250YWluIHNsYXNoZXNcbiAgLy8gaW4gdGhhdCBjYXNlIHdlIHdvdWxkIG5lZWQgdG8gdXJpIGVzY2FwZSBpdFxuXG4gIC8vIFdlIGFkZCAnX18nIHRvIHRoZSBiZWdpbm5pbmcgb2Ygbm9uLXN0YW5kYXJkIGFyY2hzIHRvIFwic2NvcGVcIiB0aGUgdXJsXG4gIC8vIHRvIE1ldGVvciBpbnRlcm5hbHMuXG4gIHJldHVybiBhcmNoID09PSBXZWJBcHAuZGVmYXVsdEFyY2ggP1xuICAgICcnIDogJy8nICsgJ19fJyArIGFyY2gucmVwbGFjZSgvXndlYlxcLi8sICcnKTtcbn07XG5cbi8vIFBhcnNlIHRoZSBwYXNzZWQgaW4gcG9ydCB2YWx1ZS4gUmV0dXJuIHRoZSBwb3J0IGFzLWlzIGlmIGl0J3MgYSBTdHJpbmdcbi8vIChlLmcuIGEgV2luZG93cyBTZXJ2ZXIgc3R5bGUgbmFtZWQgcGlwZSksIG90aGVyd2lzZSByZXR1cm4gdGhlIHBvcnQgYXMgYW5cbi8vIGludGVnZXIuXG4vL1xuLy8gREVQUkVDQVRFRDogRGlyZWN0IHVzZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIG5vdCByZWNvbW1lbmRlZDsgaXQgaXMgbm9cbi8vIGxvbmdlciB1c2VkIGludGVybmFsbHksIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgcmVsZWFzZS5cbldlYkFwcEludGVybmFscy5wYXJzZVBvcnQgPSBwb3J0ID0+IHtcbiAgbGV0IHBhcnNlZFBvcnQgPSBwYXJzZUludChwb3J0KTtcbiAgaWYgKE51bWJlci5pc05hTihwYXJzZWRQb3J0KSkge1xuICAgIHBhcnNlZFBvcnQgPSBwb3J0O1xuICB9XG4gIHJldHVybiBwYXJzZWRQb3J0O1xufVxuXG5mdW5jdGlvbiBydW5XZWJBcHBTZXJ2ZXIoKSB7XG4gIHZhciBzaHV0dGluZ0Rvd24gPSBmYWxzZTtcbiAgdmFyIHN5bmNRdWV1ZSA9IG5ldyBNZXRlb3IuX1N5bmNocm9ub3VzUXVldWUoKTtcblxuICB2YXIgZ2V0SXRlbVBhdGhuYW1lID0gZnVuY3Rpb24gKGl0ZW1VcmwpIHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnNlVXJsKGl0ZW1VcmwpLnBhdGhuYW1lKTtcbiAgfTtcblxuICBXZWJBcHBJbnRlcm5hbHMucmVsb2FkQ2xpZW50UHJvZ3JhbXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgc3luY1F1ZXVlLnJ1blRhc2soZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0aWNGaWxlcyA9IHt9O1xuICAgICAgdmFyIGdlbmVyYXRlQ2xpZW50UHJvZ3JhbSA9IGZ1bmN0aW9uIChjbGllbnRQYXRoLCBhcmNoKSB7XG4gICAgICAgIC8vIHJlYWQgdGhlIGNvbnRyb2wgZm9yIHRoZSBjbGllbnQgd2UnbGwgYmUgc2VydmluZyB1cFxuICAgICAgICB2YXIgY2xpZW50SnNvblBhdGggPSBwYXRoSm9pbihfX21ldGVvcl9ib290c3RyYXBfXy5zZXJ2ZXJEaXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFBhdGgpO1xuICAgICAgICB2YXIgY2xpZW50RGlyID0gcGF0aERpcm5hbWUoY2xpZW50SnNvblBhdGgpO1xuICAgICAgICB2YXIgY2xpZW50SnNvbiA9IEpTT04ucGFyc2UocmVhZFV0ZjhGaWxlU3luYyhjbGllbnRKc29uUGF0aCkpO1xuICAgICAgICBpZiAoY2xpZW50SnNvbi5mb3JtYXQgIT09IFwid2ViLXByb2dyYW0tcHJlMVwiKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGZvcm1hdCBmb3IgY2xpZW50IGFzc2V0czogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShjbGllbnRKc29uLmZvcm1hdCkpO1xuXG4gICAgICAgIGlmICghIGNsaWVudEpzb25QYXRoIHx8ICEgY2xpZW50RGlyIHx8ICEgY2xpZW50SnNvbilcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGllbnQgY29uZmlnIGZpbGUgbm90IHBhcnNlZC5cIik7XG5cbiAgICAgICAgdmFyIHVybFByZWZpeCA9IGdldFVybFByZWZpeEZvckFyY2goYXJjaCk7XG5cbiAgICAgICAgdmFyIG1hbmlmZXN0ID0gY2xpZW50SnNvbi5tYW5pZmVzdDtcbiAgICAgICAgXy5lYWNoKG1hbmlmZXN0LCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtLnVybCAmJiBpdGVtLndoZXJlID09PSBcImNsaWVudFwiKSB7XG4gICAgICAgICAgICBzdGF0aWNGaWxlc1t1cmxQcmVmaXggKyBnZXRJdGVtUGF0aG5hbWUoaXRlbS51cmwpXSA9IHtcbiAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoOiBwYXRoSm9pbihjbGllbnREaXIsIGl0ZW0ucGF0aCksXG4gICAgICAgICAgICAgIGNhY2hlYWJsZTogaXRlbS5jYWNoZWFibGUsXG4gICAgICAgICAgICAgIGhhc2g6IGl0ZW0uaGFzaCxcbiAgICAgICAgICAgICAgLy8gTGluayBmcm9tIHNvdXJjZSB0byBpdHMgbWFwXG4gICAgICAgICAgICAgIHNvdXJjZU1hcFVybDogaXRlbS5zb3VyY2VNYXBVcmwsXG4gICAgICAgICAgICAgIHR5cGU6IGl0ZW0udHlwZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGl0ZW0uc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgIC8vIFNlcnZlIHRoZSBzb3VyY2UgbWFwIHRvbywgdW5kZXIgdGhlIHNwZWNpZmllZCBVUkwuIFdlIGFzc3VtZSBhbGxcbiAgICAgICAgICAgICAgLy8gc291cmNlIG1hcHMgYXJlIGNhY2hlYWJsZS5cbiAgICAgICAgICAgICAgc3RhdGljRmlsZXNbdXJsUHJlZml4ICsgZ2V0SXRlbVBhdGhuYW1lKGl0ZW0uc291cmNlTWFwVXJsKV0gPSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoOiBwYXRoSm9pbihjbGllbnREaXIsIGl0ZW0uc291cmNlTWFwKSxcbiAgICAgICAgICAgICAgICBjYWNoZWFibGU6IHRydWVcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBwcm9ncmFtID0ge1xuICAgICAgICAgIGZvcm1hdDogXCJ3ZWItcHJvZ3JhbS1wcmUxXCIsXG4gICAgICAgICAgbWFuaWZlc3Q6IG1hbmlmZXN0LFxuICAgICAgICAgIHZlcnNpb246IHByb2Nlc3MuZW52LkFVVE9VUERBVEVfVkVSU0lPTiB8fFxuICAgICAgICAgICAgV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoKFxuICAgICAgICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgXy5waWNrKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18sIFwiUFVCTElDX1NFVFRJTkdTXCIpXG4gICAgICAgICAgICApLFxuICAgICAgICAgIGNvcmRvdmFDb21wYXRpYmlsaXR5VmVyc2lvbnM6IGNsaWVudEpzb24uY29yZG92YUNvbXBhdGliaWxpdHlWZXJzaW9ucyxcbiAgICAgICAgICBQVUJMSUNfU0VUVElOR1M6IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUFVCTElDX1NFVFRJTkdTXG4gICAgICAgIH07XG5cbiAgICAgICAgV2ViQXBwLmNsaWVudFByb2dyYW1zW2FyY2hdID0gcHJvZ3JhbTtcblxuICAgICAgICAvLyBFeHBvc2UgcHJvZ3JhbSBkZXRhaWxzIGFzIGEgc3RyaW5nIHJlYWNoYWJsZSB2aWEgdGhlIGZvbGxvd2luZ1xuICAgICAgICAvLyBVUkwuXG4gICAgICAgIGNvbnN0IG1hbmlmZXN0VXJsUHJlZml4ID0gXCIvX19cIiArIGFyY2gucmVwbGFjZSgvXndlYlxcLi8sIFwiXCIpO1xuICAgICAgICBjb25zdCBtYW5pZmVzdFVybCA9IG1hbmlmZXN0VXJsUHJlZml4ICtcbiAgICAgICAgICBnZXRJdGVtUGF0aG5hbWUoXCIvbWFuaWZlc3QuanNvblwiKTtcblxuICAgICAgICBzdGF0aWNGaWxlc1ttYW5pZmVzdFVybF0gPSB7XG4gICAgICAgICAgY29udGVudDogSlNPTi5zdHJpbmdpZnkocHJvZ3JhbSksXG4gICAgICAgICAgY2FjaGVhYmxlOiBmYWxzZSxcbiAgICAgICAgICBoYXNoOiBwcm9ncmFtLnZlcnNpb24sXG4gICAgICAgICAgdHlwZTogXCJqc29uXCJcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBjbGllbnRQYXRocyA9IF9fbWV0ZW9yX2Jvb3RzdHJhcF9fLmNvbmZpZ0pzb24uY2xpZW50UGF0aHM7XG4gICAgICAgIF8uZWFjaChjbGllbnRQYXRocywgZnVuY3Rpb24gKGNsaWVudFBhdGgsIGFyY2gpIHtcbiAgICAgICAgICBhcmNoUGF0aFthcmNoXSA9IHBhdGhEaXJuYW1lKGNsaWVudFBhdGgpO1xuICAgICAgICAgIGdlbmVyYXRlQ2xpZW50UHJvZ3JhbShjbGllbnRQYXRoLCBhcmNoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLlxuICAgICAgICBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXMgPSBzdGF0aWNGaWxlcztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgTG9nLmVycm9yKFwiRXJyb3IgcmVsb2FkaW5nIHRoZSBjbGllbnQgcHJvZ3JhbTogXCIgKyBlLnN0YWNrKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUJvaWxlcnBsYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFRoaXMgYm9pbGVycGxhdGUgd2lsbCBiZSBzZXJ2ZWQgdG8gdGhlIG1vYmlsZSBkZXZpY2VzIHdoZW4gdXNlZCB3aXRoXG4gICAgLy8gTWV0ZW9yL0NvcmRvdmEgZm9yIHRoZSBIb3QtQ29kZSBQdXNoIGFuZCBzaW5jZSB0aGUgZmlsZSB3aWxsIGJlIHNlcnZlZCBieVxuICAgIC8vIHRoZSBkZXZpY2UncyBzZXJ2ZXIsIGl0IGlzIGltcG9ydGFudCB0byBzZXQgdGhlIEREUCB1cmwgdG8gdGhlIGFjdHVhbFxuICAgIC8vIE1ldGVvciBzZXJ2ZXIgYWNjZXB0aW5nIEREUCBjb25uZWN0aW9ucyBhbmQgbm90IHRoZSBkZXZpY2UncyBmaWxlIHNlcnZlci5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnNGb3JBcmNoID0ge1xuICAgICAgJ3dlYi5jb3Jkb3ZhJzoge1xuICAgICAgICBydW50aW1lQ29uZmlnT3ZlcnJpZGVzOiB7XG4gICAgICAgICAgLy8gWFhYIFdlIHVzZSBhYnNvbHV0ZVVybCgpIGhlcmUgc28gdGhhdCB3ZSBzZXJ2ZSBodHRwczovL1xuICAgICAgICAgIC8vIFVSTHMgdG8gY29yZG92YSBjbGllbnRzIGlmIGZvcmNlLXNzbCBpcyBpbiB1c2UuIElmIHdlIHdlcmVcbiAgICAgICAgICAvLyB0byB1c2UgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTCBpbnN0ZWFkIG9mXG4gICAgICAgICAgLy8gYWJzb2x1dGVVcmwoKSwgdGhlbiBDb3Jkb3ZhIGNsaWVudHMgd291bGQgaW1tZWRpYXRlbHkgZ2V0IGFcbiAgICAgICAgICAvLyBIQ1Agc2V0dGluZyB0aGVpciBERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCB0b1xuICAgICAgICAgIC8vIGh0dHA6Ly9leGFtcGxlLm1ldGVvci5jb20uIFRoaXMgYnJlYWtzIHRoZSBhcHAsIGJlY2F1c2VcbiAgICAgICAgICAvLyBmb3JjZS1zc2wgZG9lc24ndCBzZXJ2ZSBDT1JTIGhlYWRlcnMgb24gMzAyXG4gICAgICAgICAgLy8gcmVkaXJlY3RzLiAoUGx1cyBpdCdzIHVuZGVzaXJhYmxlIHRvIGhhdmUgY2xpZW50c1xuICAgICAgICAgIC8vIGNvbm5lY3RpbmcgdG8gaHR0cDovL2V4YW1wbGUubWV0ZW9yLmNvbSB3aGVuIGZvcmNlLXNzbCBpc1xuICAgICAgICAgIC8vIGluIHVzZS4pXG4gICAgICAgICAgRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkw6IHByb2Nlc3MuZW52Lk1PQklMRV9ERFBfVVJMIHx8XG4gICAgICAgICAgICBNZXRlb3IuYWJzb2x1dGVVcmwoKSxcbiAgICAgICAgICBST09UX1VSTDogcHJvY2Vzcy5lbnYuTU9CSUxFX1JPT1RfVVJMIHx8XG4gICAgICAgICAgICBNZXRlb3IuYWJzb2x1dGVVcmwoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHN5bmNRdWV1ZS5ydW5UYXNrKGZ1bmN0aW9uKCkge1xuICAgICAgXy5lYWNoKFdlYkFwcC5jbGllbnRQcm9ncmFtcywgZnVuY3Rpb24gKHByb2dyYW0sIGFyY2hOYW1lKSB7XG4gICAgICAgIGJvaWxlcnBsYXRlQnlBcmNoW2FyY2hOYW1lXSA9XG4gICAgICAgICAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGVJbnN0YW5jZShcbiAgICAgICAgICAgIGFyY2hOYW1lLCBwcm9ncmFtLm1hbmlmZXN0LFxuICAgICAgICAgICAgZGVmYXVsdE9wdGlvbnNGb3JBcmNoW2FyY2hOYW1lXSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gQ2xlYXIgdGhlIG1lbW9pemVkIGJvaWxlcnBsYXRlIGNhY2hlLlxuICAgICAgbWVtb2l6ZWRCb2lsZXJwbGF0ZSA9IHt9O1xuXG4gICAgICAvLyBDb25maWd1cmUgQ1NTIGluamVjdGlvbiBmb3IgdGhlIGRlZmF1bHQgYXJjaFxuICAgICAgLy8gWFhYIGltcGxlbWVudCB0aGUgQ1NTIGluamVjdGlvbiBmb3IgYWxsIGFyY2hzP1xuICAgICAgdmFyIGNzc0ZpbGVzID0gYm9pbGVycGxhdGVCeUFyY2hbV2ViQXBwLmRlZmF1bHRBcmNoXS5iYXNlRGF0YS5jc3M7XG4gICAgICAvLyBSZXdyaXRlIGFsbCBDU1MgZmlsZXMgKHdoaWNoIGFyZSB3cml0dGVuIGRpcmVjdGx5IHRvIDxzdHlsZT4gdGFncylcbiAgICAgIC8vIGJ5IGF1dG91cGRhdGVfY2xpZW50IHRvIHVzZSB0aGUgQ0ROIHByZWZpeC9ldGNcbiAgICAgIHZhciBhbGxDc3MgPSBfLm1hcChjc3NGaWxlcywgZnVuY3Rpb24oY3NzRmlsZSkge1xuICAgICAgICByZXR1cm4geyB1cmw6IGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rKGNzc0ZpbGUudXJsKSB9O1xuICAgICAgfSk7XG4gICAgICBXZWJBcHBJbnRlcm5hbHMucmVmcmVzaGFibGVBc3NldHMgPSB7IGFsbENzcyB9O1xuICAgIH0pO1xuICB9O1xuXG4gIFdlYkFwcEludGVybmFscy5yZWxvYWRDbGllbnRQcm9ncmFtcygpO1xuXG4gIC8vIHdlYnNlcnZlclxuICB2YXIgYXBwID0gY29ubmVjdCgpO1xuXG4gIC8vIFBhY2thZ2VzIGFuZCBhcHBzIGNhbiBhZGQgaGFuZGxlcnMgdGhhdCBydW4gYmVmb3JlIGFueSBvdGhlciBNZXRlb3JcbiAgLy8gaGFuZGxlcnMgdmlhIFdlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMuXG4gIHZhciByYXdDb25uZWN0SGFuZGxlcnMgPSBjb25uZWN0KCk7XG4gIGFwcC51c2UocmF3Q29ubmVjdEhhbmRsZXJzKTtcblxuICAvLyBBdXRvLWNvbXByZXNzIGFueSBqc29uLCBqYXZhc2NyaXB0LCBvciB0ZXh0LlxuICBhcHAudXNlKGNvbXByZXNzKCkpO1xuXG4gIC8vIHBhcnNlIGNvb2tpZXMgaW50byBhbiBvYmplY3RcbiAgYXBwLnVzZShjb29raWVQYXJzZXIoKSk7XG5cbiAgLy8gV2UncmUgbm90IGEgcHJveHk7IHJlamVjdCAod2l0aG91dCBjcmFzaGluZykgYXR0ZW1wdHMgdG8gdHJlYXQgdXMgbGlrZVxuICAvLyBvbmUuIChTZWUgIzEyMTIuKVxuICBhcHAudXNlKGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgaWYgKFJvdXRlUG9saWN5LmlzVmFsaWRVcmwocmVxLnVybCkpIHtcbiAgICAgIG5leHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVzLndyaXRlSGVhZCg0MDApO1xuICAgIHJlcy53cml0ZShcIk5vdCBhIHByb3h5XCIpO1xuICAgIHJlcy5lbmQoKTtcbiAgfSk7XG5cbiAgLy8gU3RyaXAgb2ZmIHRoZSBwYXRoIHByZWZpeCwgaWYgaXQgZXhpc3RzLlxuICBhcHAudXNlKGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSwgbmV4dCkge1xuICAgIHZhciBwYXRoUHJlZml4ID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWDtcbiAgICB2YXIgdXJsID0gTnBtLnJlcXVpcmUoJ3VybCcpLnBhcnNlKHJlcXVlc3QudXJsKTtcbiAgICB2YXIgcGF0aG5hbWUgPSB1cmwucGF0aG5hbWU7XG4gICAgLy8gY2hlY2sgaWYgdGhlIHBhdGggaW4gdGhlIHVybCBzdGFydHMgd2l0aCB0aGUgcGF0aCBwcmVmaXggKGFuZCB0aGUgcGFydFxuICAgIC8vIGFmdGVyIHRoZSBwYXRoIHByZWZpeCBtdXN0IHN0YXJ0IHdpdGggYSAvIGlmIGl0IGV4aXN0cy4pXG4gICAgaWYgKHBhdGhQcmVmaXggJiYgcGF0aG5hbWUuc3Vic3RyaW5nKDAsIHBhdGhQcmVmaXgubGVuZ3RoKSA9PT0gcGF0aFByZWZpeCAmJlxuICAgICAgIChwYXRobmFtZS5sZW5ndGggPT0gcGF0aFByZWZpeC5sZW5ndGhcbiAgICAgICAgfHwgcGF0aG5hbWUuc3Vic3RyaW5nKHBhdGhQcmVmaXgubGVuZ3RoLCBwYXRoUHJlZml4Lmxlbmd0aCArIDEpID09PSBcIi9cIikpIHtcbiAgICAgIHJlcXVlc3QudXJsID0gcmVxdWVzdC51cmwuc3Vic3RyaW5nKHBhdGhQcmVmaXgubGVuZ3RoKTtcbiAgICAgIG5leHQoKTtcbiAgICB9IGVsc2UgaWYgKHBhdGhuYW1lID09PSBcIi9mYXZpY29uLmljb1wiIHx8IHBhdGhuYW1lID09PSBcIi9yb2JvdHMudHh0XCIpIHtcbiAgICAgIG5leHQoKTtcbiAgICB9IGVsc2UgaWYgKHBhdGhQcmVmaXgpIHtcbiAgICAgIHJlc3BvbnNlLndyaXRlSGVhZCg0MDQpO1xuICAgICAgcmVzcG9uc2Uud3JpdGUoXCJVbmtub3duIHBhdGhcIik7XG4gICAgICByZXNwb25zZS5lbmQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dCgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gUGFyc2UgdGhlIHF1ZXJ5IHN0cmluZyBpbnRvIHJlcy5xdWVyeS4gVXNlZCBieSBvYXV0aF9zZXJ2ZXIsIGJ1dCBpdCdzXG4gIC8vIGdlbmVyYWxseSBwcmV0dHkgaGFuZHkuLlxuICBhcHAudXNlKHF1ZXJ5KCkpO1xuXG4gIC8vIFNlcnZlIHN0YXRpYyBmaWxlcyBmcm9tIHRoZSBtYW5pZmVzdC5cbiAgLy8gVGhpcyBpcyBpbnNwaXJlZCBieSB0aGUgJ3N0YXRpYycgbWlkZGxld2FyZS5cbiAgYXBwLnVzZShmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcbiAgICBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNNaWRkbGV3YXJlKHN0YXRpY0ZpbGVzLCByZXEsIHJlcywgbmV4dCk7XG4gIH0pO1xuXG4gIC8vIENvcmUgTWV0ZW9yIHBhY2thZ2VzIGxpa2UgZHluYW1pYy1pbXBvcnQgY2FuIGFkZCBoYW5kbGVycyBiZWZvcmVcbiAgLy8gb3RoZXIgaGFuZGxlcnMgYWRkZWQgYnkgcGFja2FnZSBhbmQgYXBwbGljYXRpb24gY29kZS5cbiAgYXBwLnVzZShXZWJBcHBJbnRlcm5hbHMubWV0ZW9ySW50ZXJuYWxIYW5kbGVycyA9IGNvbm5lY3QoKSk7XG5cbiAgLy8gUGFja2FnZXMgYW5kIGFwcHMgY2FuIGFkZCBoYW5kbGVycyB0byB0aGlzIHZpYSBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLlxuICAvLyBUaGV5IGFyZSBpbnNlcnRlZCBiZWZvcmUgb3VyIGRlZmF1bHQgaGFuZGxlci5cbiAgdmFyIHBhY2thZ2VBbmRBcHBIYW5kbGVycyA9IGNvbm5lY3QoKTtcbiAgYXBwLnVzZShwYWNrYWdlQW5kQXBwSGFuZGxlcnMpO1xuXG4gIHZhciBzdXBwcmVzc0Nvbm5lY3RFcnJvcnMgPSBmYWxzZTtcbiAgLy8gY29ubmVjdCBrbm93cyBpdCBpcyBhbiBlcnJvciBoYW5kbGVyIGJlY2F1c2UgaXQgaGFzIDQgYXJndW1lbnRzIGluc3RlYWQgb2ZcbiAgLy8gMy4gZ28gZmlndXJlLiAgKEl0IGlzIG5vdCBzbWFydCBlbm91Z2ggdG8gZmluZCBzdWNoIGEgdGhpbmcgaWYgaXQncyBoaWRkZW5cbiAgLy8gaW5zaWRlIHBhY2thZ2VBbmRBcHBIYW5kbGVycy4pXG4gIGFwcC51c2UoZnVuY3Rpb24gKGVyciwgcmVxLCByZXMsIG5leHQpIHtcbiAgICBpZiAoIWVyciB8fCAhc3VwcHJlc3NDb25uZWN0RXJyb3JzIHx8ICFyZXEuaGVhZGVyc1sneC1zdXBwcmVzcy1lcnJvciddKSB7XG4gICAgICBuZXh0KGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlcy53cml0ZUhlYWQoZXJyLnN0YXR1cywgeyAnQ29udGVudC1UeXBlJzogJ3RleHQvcGxhaW4nIH0pO1xuICAgIHJlcy5lbmQoXCJBbiBlcnJvciBtZXNzYWdlXCIpO1xuICB9KTtcblxuICBhcHAudXNlKGZ1bmN0aW9uIChyZXEsIHJlcywgbmV4dCkge1xuICAgIGlmICghIGFwcFVybChyZXEudXJsKSkge1xuICAgICAgcmV0dXJuIG5leHQoKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaGVhZGVycyA9IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgnXG4gICAgICB9O1xuXG4gICAgICBpZiAoc2h1dHRpbmdEb3duKSB7XG4gICAgICAgIGhlYWRlcnNbJ0Nvbm5lY3Rpb24nXSA9ICdDbG9zZSc7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXF1ZXN0ID0gV2ViQXBwLmNhdGVnb3JpemVSZXF1ZXN0KHJlcSk7XG5cbiAgICAgIGlmIChyZXF1ZXN0LnVybC5xdWVyeSAmJiByZXF1ZXN0LnVybC5xdWVyeVsnbWV0ZW9yX2Nzc19yZXNvdXJjZSddKSB7XG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSwgd2UncmUgcmVxdWVzdGluZyBhIENTUyByZXNvdXJjZSBpbiB0aGUgbWV0ZW9yLXNwZWNpZmljXG4gICAgICAgIC8vIHdheSwgYnV0IHdlIGRvbid0IGhhdmUgaXQuICBTZXJ2ZSBhIHN0YXRpYyBjc3MgZmlsZSB0aGF0IGluZGljYXRlcyB0aGF0XG4gICAgICAgIC8vIHdlIGRpZG4ndCBoYXZlIGl0LCBzbyB3ZSBjYW4gZGV0ZWN0IHRoYXQgYW5kIHJlZnJlc2guICBNYWtlIHN1cmVcbiAgICAgICAgLy8gdGhhdCBhbnkgcHJveGllcyBvciBDRE5zIGRvbid0IGNhY2hlIHRoaXMgZXJyb3IhICAoTm9ybWFsbHkgcHJveGllc1xuICAgICAgICAvLyBvciBDRE5zIGFyZSBzbWFydCBlbm91Z2ggbm90IHRvIGNhY2hlIGVycm9yIHBhZ2VzLCBidXQgaW4gb3JkZXIgdG9cbiAgICAgICAgLy8gbWFrZSB0aGlzIGhhY2sgd29yaywgd2UgbmVlZCB0byByZXR1cm4gdGhlIENTUyBmaWxlIGFzIGEgMjAwLCB3aGljaFxuICAgICAgICAvLyB3b3VsZCBvdGhlcndpc2UgYmUgY2FjaGVkLilcbiAgICAgICAgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAndGV4dC9jc3M7IGNoYXJzZXQ9dXRmLTgnO1xuICAgICAgICBoZWFkZXJzWydDYWNoZS1Db250cm9sJ10gPSAnbm8tY2FjaGUnO1xuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgaGVhZGVycyk7XG4gICAgICAgIHJlcy53cml0ZShcIi5tZXRlb3ItY3NzLW5vdC1mb3VuZC1lcnJvciB7IHdpZHRoOiAwcHg7fVwiKTtcbiAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXF1ZXN0LnVybC5xdWVyeSAmJiByZXF1ZXN0LnVybC5xdWVyeVsnbWV0ZW9yX2pzX3Jlc291cmNlJ10pIHtcbiAgICAgICAgLy8gU2ltaWxhcmx5LCB3ZSdyZSByZXF1ZXN0aW5nIGEgSlMgcmVzb3VyY2UgdGhhdCB3ZSBkb24ndCBoYXZlLlxuICAgICAgICAvLyBTZXJ2ZSBhbiB1bmNhY2hlZCA0MDQuIChXZSBjYW4ndCB1c2UgdGhlIHNhbWUgaGFjayB3ZSB1c2UgZm9yIENTUyxcbiAgICAgICAgLy8gYmVjYXVzZSBhY3R1YWxseSBhY3Rpbmcgb24gdGhhdCBoYWNrIHJlcXVpcmVzIHVzIHRvIGhhdmUgdGhlIEpTXG4gICAgICAgIC8vIGFscmVhZHkhKVxuICAgICAgICBoZWFkZXJzWydDYWNoZS1Db250cm9sJ10gPSAnbm8tY2FjaGUnO1xuICAgICAgICByZXMud3JpdGVIZWFkKDQwNCwgaGVhZGVycyk7XG4gICAgICAgIHJlcy5lbmQoXCI0MDQgTm90IEZvdW5kXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXF1ZXN0LnVybC5xdWVyeSAmJiByZXF1ZXN0LnVybC5xdWVyeVsnbWV0ZW9yX2RvbnRfc2VydmVfaW5kZXgnXSkge1xuICAgICAgICAvLyBXaGVuIGRvd25sb2FkaW5nIGZpbGVzIGR1cmluZyBhIENvcmRvdmEgaG90IGNvZGUgcHVzaCwgd2UgbmVlZFxuICAgICAgICAvLyB0byBkZXRlY3QgaWYgYSBmaWxlIGlzIG5vdCBhdmFpbGFibGUgaW5zdGVhZCBvZiBpbmFkdmVydGVudGx5XG4gICAgICAgIC8vIGRvd25sb2FkaW5nIHRoZSBkZWZhdWx0IGluZGV4IHBhZ2UuXG4gICAgICAgIC8vIFNvIHNpbWlsYXIgdG8gdGhlIHNpdHVhdGlvbiBhYm92ZSwgd2Ugc2VydmUgYW4gdW5jYWNoZWQgNDA0LlxuICAgICAgICBoZWFkZXJzWydDYWNoZS1Db250cm9sJ10gPSAnbm8tY2FjaGUnO1xuICAgICAgICByZXMud3JpdGVIZWFkKDQwNCwgaGVhZGVycyk7XG4gICAgICAgIHJlcy5lbmQoXCI0MDQgTm90IEZvdW5kXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIC9wYWNrYWdlcy9hc2Rmc2FkIC4uLiAvX19jb3Jkb3ZhL2RhZnNkZi5qc1xuICAgICAgdmFyIHBhdGhuYW1lID0gcGFyc2VSZXF1ZXN0KHJlcSkucGF0aG5hbWU7XG4gICAgICB2YXIgYXJjaEtleSA9IHBhdGhuYW1lLnNwbGl0KCcvJylbMV07XG4gICAgICB2YXIgYXJjaEtleUNsZWFuZWQgPSAnd2ViLicgKyBhcmNoS2V5LnJlcGxhY2UoL15fXy8sICcnKTtcblxuICAgICAgaWYgKCEvXl9fLy50ZXN0KGFyY2hLZXkpIHx8ICFfLmhhcyhhcmNoUGF0aCwgYXJjaEtleUNsZWFuZWQpKSB7XG4gICAgICAgIGFyY2hLZXkgPSBXZWJBcHAuZGVmYXVsdEFyY2g7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmNoS2V5ID0gYXJjaEtleUNsZWFuZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBnZXRCb2lsZXJwbGF0ZUFzeW5jKFxuICAgICAgICByZXF1ZXN0LFxuICAgICAgICBhcmNoS2V5XG4gICAgICApLnRoZW4oKHsgc3RyZWFtLCAgc3RhdHVzQ29kZSwgaGVhZGVyczogbmV3SGVhZGVycyB9KSA9PiB7XG4gICAgICAgIGlmICghc3RhdHVzQ29kZSkge1xuICAgICAgICAgIHN0YXR1c0NvZGUgPSByZXMuc3RhdHVzQ29kZSA/IHJlcy5zdGF0dXNDb2RlIDogMjAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld0hlYWRlcnMpIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGhlYWRlcnMsIG5ld0hlYWRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCBoZWFkZXJzKTtcblxuICAgICAgICBzdHJlYW0ucGlwZShyZXMsIHtcbiAgICAgICAgICAvLyBFbmQgdGhlIHJlc3BvbnNlIHdoZW4gdGhlIHN0cmVhbSBlbmRzLlxuICAgICAgICAgIGVuZDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgTG9nLmVycm9yKFwiRXJyb3IgcnVubmluZyB0ZW1wbGF0ZTogXCIgKyBlcnJvci5zdGFjayk7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCBoZWFkZXJzKTtcbiAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBSZXR1cm4gNDA0IGJ5IGRlZmF1bHQsIGlmIG5vIG90aGVyIGhhbmRsZXJzIHNlcnZlIHRoaXMgVVJMLlxuICBhcHAudXNlKGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgIHJlcy53cml0ZUhlYWQoNDA0KTtcbiAgICByZXMuZW5kKCk7XG4gIH0pO1xuXG5cbiAgdmFyIGh0dHBTZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXIoYXBwKTtcbiAgdmFyIG9uTGlzdGVuaW5nQ2FsbGJhY2tzID0gW107XG5cbiAgLy8gQWZ0ZXIgNSBzZWNvbmRzIHcvbyBkYXRhIG9uIGEgc29ja2V0LCBraWxsIGl0LiAgT24gdGhlIG90aGVyIGhhbmQsIGlmXG4gIC8vIHRoZXJlJ3MgYW4gb3V0c3RhbmRpbmcgcmVxdWVzdCwgZ2l2ZSBpdCBhIGhpZ2hlciB0aW1lb3V0IGluc3RlYWQgKHRvIGF2b2lkXG4gIC8vIGtpbGxpbmcgbG9uZy1wb2xsaW5nIHJlcXVlc3RzKVxuICBodHRwU2VydmVyLnNldFRpbWVvdXQoU0hPUlRfU09DS0VUX1RJTUVPVVQpO1xuXG4gIC8vIERvIHRoaXMgaGVyZSwgYW5kIHRoZW4gYWxzbyBpbiBsaXZlZGF0YS9zdHJlYW1fc2VydmVyLmpzLCBiZWNhdXNlXG4gIC8vIHN0cmVhbV9zZXJ2ZXIuanMga2lsbHMgYWxsIHRoZSBjdXJyZW50IHJlcXVlc3QgaGFuZGxlcnMgd2hlbiBpbnN0YWxsaW5nIGl0c1xuICAvLyBvd24uXG4gIGh0dHBTZXJ2ZXIub24oJ3JlcXVlc3QnLCBXZWJBcHAuX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrKTtcblxuICAvLyBJZiB0aGUgY2xpZW50IGdhdmUgdXMgYSBiYWQgcmVxdWVzdCwgdGVsbCBpdCBpbnN0ZWFkIG9mIGp1c3QgY2xvc2luZyB0aGVcbiAgLy8gc29ja2V0LiBUaGlzIGxldHMgbG9hZCBiYWxhbmNlcnMgaW4gZnJvbnQgb2YgdXMgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIFwiYVxuICAvLyBzZXJ2ZXIgaXMgcmFuZG9tbHkgY2xvc2luZyBzb2NrZXRzIGZvciBubyByZWFzb25cIiBhbmQgXCJjbGllbnQgc2VudCBhIGJhZFxuICAvLyByZXF1ZXN0XCIuXG4gIC8vXG4gIC8vIFRoaXMgd2lsbCBvbmx5IHdvcmsgb24gTm9kZSA2OyBOb2RlIDQgZGVzdHJveXMgdGhlIHNvY2tldCBiZWZvcmUgY2FsbGluZ1xuICAvLyB0aGlzIGV2ZW50LiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL3B1bGwvNDU1Ny8gZm9yIGRldGFpbHMuXG4gIGh0dHBTZXJ2ZXIub24oJ2NsaWVudEVycm9yJywgKGVyciwgc29ja2V0KSA9PiB7XG4gICAgLy8gUHJlLU5vZGUtNiwgZG8gbm90aGluZy5cbiAgICBpZiAoc29ja2V0LmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlcnIubWVzc2FnZSA9PT0gJ1BhcnNlIEVycm9yJykge1xuICAgICAgc29ja2V0LmVuZCgnSFRUUC8xLjEgNDAwIEJhZCBSZXF1ZXN0XFxyXFxuXFxyXFxuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBvdGhlciBlcnJvcnMsIHVzZSB0aGUgZGVmYXVsdCBiZWhhdmlvciBhcyBpZiB3ZSBoYWQgbm8gY2xpZW50RXJyb3JcbiAgICAgIC8vIGhhbmRsZXIuXG4gICAgICBzb2NrZXQuZGVzdHJveShlcnIpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gc3RhcnQgdXAgYXBwXG4gIF8uZXh0ZW5kKFdlYkFwcCwge1xuICAgIGNvbm5lY3RIYW5kbGVyczogcGFja2FnZUFuZEFwcEhhbmRsZXJzLFxuICAgIHJhd0Nvbm5lY3RIYW5kbGVyczogcmF3Q29ubmVjdEhhbmRsZXJzLFxuICAgIGh0dHBTZXJ2ZXI6IGh0dHBTZXJ2ZXIsXG4gICAgY29ubmVjdEFwcDogYXBwLFxuICAgIC8vIEZvciB0ZXN0aW5nLlxuICAgIHN1cHByZXNzQ29ubmVjdEVycm9yczogZnVuY3Rpb24gKCkge1xuICAgICAgc3VwcHJlc3NDb25uZWN0RXJyb3JzID0gdHJ1ZTtcbiAgICB9LFxuICAgIG9uTGlzdGVuaW5nOiBmdW5jdGlvbiAoZikge1xuICAgICAgaWYgKG9uTGlzdGVuaW5nQ2FsbGJhY2tzKVxuICAgICAgICBvbkxpc3RlbmluZ0NhbGxiYWNrcy5wdXNoKGYpO1xuICAgICAgZWxzZVxuICAgICAgICBmKCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBMZXQgdGhlIHJlc3Qgb2YgdGhlIHBhY2thZ2VzIChhbmQgTWV0ZW9yLnN0YXJ0dXAgaG9va3MpIGluc2VydCBjb25uZWN0XG4gIC8vIG1pZGRsZXdhcmVzIGFuZCB1cGRhdGUgX19tZXRlb3JfcnVudGltZV9jb25maWdfXywgdGhlbiBrZWVwIGdvaW5nIHRvIHNldCB1cFxuICAvLyBhY3R1YWxseSBzZXJ2aW5nIEhUTUwuXG4gIGV4cG9ydHMubWFpbiA9IGFyZ3YgPT4ge1xuICAgIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUJvaWxlcnBsYXRlKCk7XG5cbiAgICBjb25zdCBzdGFydEh0dHBTZXJ2ZXIgPSBsaXN0ZW5PcHRpb25zID0+IHtcbiAgICAgIGh0dHBTZXJ2ZXIubGlzdGVuKGxpc3Rlbk9wdGlvbnMsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTUVURU9SX1BSSU5UX09OX0xJU1RFTikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTElTVEVOSU5HXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IG9uTGlzdGVuaW5nQ2FsbGJhY2tzO1xuICAgICAgICBvbkxpc3RlbmluZ0NhbGxiYWNrcyA9IG51bGw7XG4gICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKGNhbGxiYWNrID0+IHsgY2FsbGJhY2soKTsgfSk7XG4gICAgICB9LCBlID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGxpc3RlbmluZzpcIiwgZSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSAmJiBlLnN0YWNrKTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgbGV0IGxvY2FsUG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMDtcbiAgICBjb25zdCB1bml4U29ja2V0UGF0aCA9IHByb2Nlc3MuZW52LlVOSVhfU09DS0VUX1BBVEg7XG5cbiAgICBpZiAodW5peFNvY2tldFBhdGgpIHtcbiAgICAgIC8vIFN0YXJ0IHRoZSBIVFRQIHNlcnZlciB1c2luZyBhIHNvY2tldCBmaWxlLlxuICAgICAgcmVtb3ZlRXhpc3RpbmdTb2NrZXRGaWxlKHVuaXhTb2NrZXRQYXRoKTtcbiAgICAgIHN0YXJ0SHR0cFNlcnZlcih7IHBhdGg6IHVuaXhTb2NrZXRQYXRoIH0pO1xuICAgICAgcmVnaXN0ZXJTb2NrZXRGaWxlQ2xlYW51cCh1bml4U29ja2V0UGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsUG9ydCA9IGlzTmFOKE51bWJlcihsb2NhbFBvcnQpKSA/IGxvY2FsUG9ydCA6IE51bWJlcihsb2NhbFBvcnQpO1xuICAgICAgaWYgKC9cXFxcXFxcXD8uK1xcXFxwaXBlXFxcXD8uKy8udGVzdChsb2NhbFBvcnQpKSB7XG4gICAgICAgIC8vIFN0YXJ0IHRoZSBIVFRQIHNlcnZlciB1c2luZyBXaW5kb3dzIFNlcnZlciBzdHlsZSBuYW1lZCBwaXBlLlxuICAgICAgICBzdGFydEh0dHBTZXJ2ZXIoeyBwYXRoOiBsb2NhbFBvcnQgfSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBsb2NhbFBvcnQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgLy8gU3RhcnQgdGhlIEhUVFAgc2VydmVyIHVzaW5nIFRDUC5cbiAgICAgICAgc3RhcnRIdHRwU2VydmVyKHtcbiAgICAgICAgICBwb3J0OiBsb2NhbFBvcnQsXG4gICAgICAgICAgaG9zdDogcHJvY2Vzcy5lbnYuQklORF9JUCB8fCBcIjAuMC4wLjBcIlxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgUE9SVCBzcGVjaWZpZWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiREFFTU9OXCI7XG4gIH07XG59XG5cblxucnVuV2ViQXBwU2VydmVyKCk7XG5cblxudmFyIGlubGluZVNjcmlwdHNBbGxvd2VkID0gdHJ1ZTtcblxuV2ViQXBwSW50ZXJuYWxzLmlubGluZVNjcmlwdHNBbGxvd2VkID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gaW5saW5lU2NyaXB0c0FsbG93ZWQ7XG59O1xuXG5XZWJBcHBJbnRlcm5hbHMuc2V0SW5saW5lU2NyaXB0c0FsbG93ZWQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaW5saW5lU2NyaXB0c0FsbG93ZWQgPSB2YWx1ZTtcbiAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcbn07XG5cblxuV2ViQXBwSW50ZXJuYWxzLnNldEJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rID0gZnVuY3Rpb24gKGhvb2tGbikge1xuICBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayA9IGhvb2tGbjtcbiAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcbn07XG5cbldlYkFwcEludGVybmFscy5zZXRCdW5kbGVkSnNDc3NQcmVmaXggPSBmdW5jdGlvbiAocHJlZml4KSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5zZXRCdW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayhcbiAgICBmdW5jdGlvbiAodXJsKSB7XG4gICAgICByZXR1cm4gcHJlZml4ICsgdXJsO1xuICB9KTtcbn07XG5cbi8vIFBhY2thZ2VzIGNhbiBjYWxsIGBXZWJBcHBJbnRlcm5hbHMuYWRkU3RhdGljSnNgIHRvIHNwZWNpZnkgc3RhdGljXG4vLyBKYXZhU2NyaXB0IHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhcHAuIFRoaXMgc3RhdGljIEpTIHdpbGwgYmUgaW5saW5lZCxcbi8vIHVubGVzcyBpbmxpbmUgc2NyaXB0cyBoYXZlIGJlZW4gZGlzYWJsZWQsIGluIHdoaWNoIGNhc2UgaXQgd2lsbCBiZVxuLy8gc2VydmVkIHVuZGVyIGAvPHNoYTEgb2YgY29udGVudHM+YC5cbnZhciBhZGRpdGlvbmFsU3RhdGljSnMgPSB7fTtcbldlYkFwcEludGVybmFscy5hZGRTdGF0aWNKcyA9IGZ1bmN0aW9uIChjb250ZW50cykge1xuICBhZGRpdGlvbmFsU3RhdGljSnNbXCIvXCIgKyBzaGExKGNvbnRlbnRzKSArIFwiLmpzXCJdID0gY29udGVudHM7XG59O1xuXG4vLyBFeHBvcnRlZCBmb3IgdGVzdHNcbldlYkFwcEludGVybmFscy5nZXRCb2lsZXJwbGF0ZSA9IGdldEJvaWxlcnBsYXRlO1xuV2ViQXBwSW50ZXJuYWxzLmFkZGl0aW9uYWxTdGF0aWNKcyA9IGFkZGl0aW9uYWxTdGF0aWNKcztcbiIsImltcG9ydCBucG1Db25uZWN0IGZyb20gXCJjb25uZWN0XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25uZWN0KC4uLmNvbm5lY3RBcmdzKSB7XG4gIGNvbnN0IGhhbmRsZXJzID0gbnBtQ29ubmVjdC5hcHBseSh0aGlzLCBjb25uZWN0QXJncyk7XG4gIGNvbnN0IG9yaWdpbmFsVXNlID0gaGFuZGxlcnMudXNlO1xuXG4gIC8vIFdyYXAgdGhlIGhhbmRsZXJzLnVzZSBtZXRob2Qgc28gdGhhdCBhbnkgcHJvdmlkZWQgaGFuZGxlciBmdW5jdGlvbnNcbiAgLy8gYWx3YXkgcnVuIGluIGEgRmliZXIuXG4gIGhhbmRsZXJzLnVzZSA9IGZ1bmN0aW9uIHVzZSguLi51c2VBcmdzKSB7XG4gICAgY29uc3QgeyBzdGFjayB9ID0gdGhpcztcbiAgICBjb25zdCBvcmlnaW5hbExlbmd0aCA9IHN0YWNrLmxlbmd0aDtcbiAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbFVzZS5hcHBseSh0aGlzLCB1c2VBcmdzKTtcblxuICAgIC8vIElmIHdlIGp1c3QgYWRkZWQgYW55dGhpbmcgdG8gdGhlIHN0YWNrLCB3cmFwIGVhY2ggbmV3IGVudHJ5LmhhbmRsZVxuICAgIC8vIHdpdGggYSBmdW5jdGlvbiB0aGF0IGNhbGxzIFByb21pc2UuYXN5bmNBcHBseSB0byBlbnN1cmUgdGhlXG4gICAgLy8gb3JpZ2luYWwgaGFuZGxlciBydW5zIGluIGEgRmliZXIuXG4gICAgZm9yIChsZXQgaSA9IG9yaWdpbmFsTGVuZ3RoOyBpIDwgc3RhY2subGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gc3RhY2tbaV07XG4gICAgICBjb25zdCBvcmlnaW5hbEhhbmRsZSA9IGVudHJ5LmhhbmRsZTtcblxuICAgICAgaWYgKG9yaWdpbmFsSGFuZGxlLmxlbmd0aCA+PSA0KSB7XG4gICAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCBoYW5kbGUgaGFkIGZvdXIgKG9yIG1vcmUpIHBhcmFtZXRlcnMsIHRoZVxuICAgICAgICAvLyB3cmFwcGVyIG11c3QgYWxzbyBoYXZlIGZvdXIgcGFyYW1ldGVycywgc2luY2UgY29ubmVjdCB1c2VzXG4gICAgICAgIC8vIGhhbmRsZS5sZW5ndGggdG8gZGVybWluZSB3aGV0aGVyIHRvIHBhc3MgdGhlIGVycm9yIGFzIHRoZSBmaXJzdFxuICAgICAgICAvLyBhcmd1bWVudCB0byB0aGUgaGFuZGxlIGZ1bmN0aW9uLlxuICAgICAgICBlbnRyeS5oYW5kbGUgPSBmdW5jdGlvbiBoYW5kbGUoZXJyLCByZXEsIHJlcywgbmV4dCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFzeW5jQXBwbHkob3JpZ2luYWxIYW5kbGUsIHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbnRyeS5oYW5kbGUgPSBmdW5jdGlvbiBoYW5kbGUocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hc3luY0FwcGx5KG9yaWdpbmFsSGFuZGxlLCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgcmV0dXJuIGhhbmRsZXJzO1xufVxuIiwiaW1wb3J0IHsgc3RhdFN5bmMsIHVubGlua1N5bmMsIGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5cbi8vIFNpbmNlIGEgbmV3IHNvY2tldCBmaWxlIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZSBIVFRQIHNlcnZlclxuLy8gc3RhcnRzIHVwLCBpZiBmb3VuZCByZW1vdmUgdGhlIGV4aXN0aW5nIGZpbGUuXG4vL1xuLy8gV0FSTklORzpcbi8vIFRoaXMgd2lsbCByZW1vdmUgdGhlIGNvbmZpZ3VyZWQgc29ja2V0IGZpbGUgd2l0aG91dCB3YXJuaW5nLiBJZlxuLy8gdGhlIGNvbmZpZ3VyZWQgc29ja2V0IGZpbGUgaXMgYWxyZWFkeSBpbiB1c2UgYnkgYW5vdGhlciBhcHBsaWNhdGlvbixcbi8vIGl0IHdpbGwgc3RpbGwgYmUgcmVtb3ZlZC4gTm9kZSBkb2VzIG5vdCBwcm92aWRlIGEgcmVsaWFibGUgd2F5IHRvXG4vLyBkaWZmZXJlbnRpYXRlIGJldHdlZW4gYSBzb2NrZXQgZmlsZSB0aGF0IGlzIGFscmVhZHkgaW4gdXNlIGJ5XG4vLyBhbm90aGVyIGFwcGxpY2F0aW9uIG9yIGEgc3RhbGUgc29ja2V0IGZpbGUgdGhhdCBoYXMgYmVlblxuLy8gbGVmdCBvdmVyIGFmdGVyIGEgU0lHS0lMTC4gU2luY2Ugd2UgaGF2ZSBubyByZWxpYWJsZSB3YXkgdG9cbi8vIGRpZmZlcmVudGlhdGUgYmV0d2VlbiB0aGVzZSB0d28gc2NlbmFyaW9zLCB0aGUgYmVzdCBjb3Vyc2Ugb2Zcbi8vIGFjdGlvbiBkdXJpbmcgc3RhcnR1cCBpcyB0byByZW1vdmUgYW55IGV4aXN0aW5nIHNvY2tldCBmaWxlLiBUaGlzXG4vLyBpcyBub3QgdGhlIHNhZmVzdCBjb3Vyc2Ugb2YgYWN0aW9uIGFzIHJlbW92aW5nIHRoZSBleGlzdGluZyBzb2NrZXRcbi8vIGZpbGUgY291bGQgaW1wYWN0IGFuIGFwcGxpY2F0aW9uIHVzaW5nIGl0LCBidXQgdGhpcyBhcHByb2FjaCBoZWxwc1xuLy8gZW5zdXJlIHRoZSBIVFRQIHNlcnZlciBjYW4gc3RhcnR1cCB3aXRob3V0IG1hbnVhbFxuLy8gaW50ZXJ2ZW50aW9uIChlLmcuIGFza2luZyBmb3IgdGhlIHZlcmlmaWNhdGlvbiBhbmQgY2xlYW51cCBvZiBzb2NrZXRcbi8vIGZpbGVzIGJlZm9yZSBhbGxvd2luZyB0aGUgSFRUUCBzZXJ2ZXIgdG8gYmUgc3RhcnRlZCkuXG4vL1xuLy8gVGhlIGFib3ZlIGJlaW5nIHNhaWQsIGFzIGxvbmcgYXMgdGhlIHNvY2tldCBmaWxlIHBhdGggaXNcbi8vIGNvbmZpZ3VyZWQgY2FyZWZ1bGx5IHdoZW4gdGhlIGFwcGxpY2F0aW9uIGlzIGRlcGxveWVkIChhbmQgZXh0cmFcbi8vIGNhcmUgaXMgdGFrZW4gdG8gbWFrZSBzdXJlIHRoZSBjb25maWd1cmVkIHBhdGggaXMgdW5pcXVlIGFuZCBkb2Vzbid0XG4vLyBjb25mbGljdCB3aXRoIGFub3RoZXIgc29ja2V0IGZpbGUgcGF0aCksIHRoZW4gdGhlcmUgc2hvdWxkIG5vdCBiZVxuLy8gYW55IGlzc3VlcyB3aXRoIHRoaXMgYXBwcm9hY2guXG5leHBvcnQgY29uc3QgcmVtb3ZlRXhpc3RpbmdTb2NrZXRGaWxlID0gKHNvY2tldFBhdGgpID0+IHtcbiAgdHJ5IHtcbiAgICBpZiAoc3RhdFN5bmMoc29ja2V0UGF0aCkuaXNTb2NrZXQoKSkge1xuICAgICAgLy8gU2luY2UgYSBuZXcgc29ja2V0IGZpbGUgd2lsbCBiZSBjcmVhdGVkLCByZW1vdmUgdGhlIGV4aXN0aW5nXG4gICAgICAvLyBmaWxlLlxuICAgICAgdW5saW5rU3luYyhzb2NrZXRQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQW4gZXhpc3RpbmcgZmlsZSB3YXMgZm91bmQgYXQgXCIke3NvY2tldFBhdGh9XCIgYW5kIGl0IGlzIG5vdCBgICtcbiAgICAgICAgJ2Egc29ja2V0IGZpbGUuIFBsZWFzZSBjb25maXJtIFBPUlQgaXMgcG9pbnRpbmcgdG8gdmFsaWQgYW5kICcgK1xuICAgICAgICAndW4tdXNlZCBzb2NrZXQgZmlsZSBwYXRoLidcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIGV4aXN0aW5nIHNvY2tldCBmaWxlIHRvIGNsZWFudXAsIGdyZWF0LCB3ZSdsbFxuICAgIC8vIGNvbnRpbnVlIG5vcm1hbGx5LiBJZiB0aGUgY2F1Z2h0IGV4Y2VwdGlvbiByZXByZXNlbnRzIGFueSBvdGhlclxuICAgIC8vIGlzc3VlLCByZS10aHJvdy5cbiAgICBpZiAoZXJyb3IuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufTtcblxuLy8gUmVtb3ZlIHRoZSBzb2NrZXQgZmlsZSB3aGVuIGRvbmUgdG8gYXZvaWQgbGVhdmluZyBiZWhpbmQgYSBzdGFsZSBvbmUuXG4vLyBOb3RlIC0gYSBzdGFsZSBzb2NrZXQgZmlsZSBpcyBzdGlsbCBsZWZ0IGJlaGluZCBpZiB0aGUgcnVubmluZyBub2RlXG4vLyBwcm9jZXNzIGlzIGtpbGxlZCB2aWEgc2lnbmFsIDkgLSBTSUdLSUxMLlxuZXhwb3J0IGNvbnN0IHJlZ2lzdGVyU29ja2V0RmlsZUNsZWFudXAgPVxuICAoc29ja2V0UGF0aCwgZXZlbnRFbWl0dGVyID0gcHJvY2VzcykgPT4ge1xuICAgIFsnZXhpdCcsICdTSUdJTlQnLCAnU0lHSFVQJywgJ1NJR1RFUk0nXS5mb3JFYWNoKHNpZ25hbCA9PiB7XG4gICAgICBldmVudEVtaXR0ZXIub24oc2lnbmFsLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoc29ja2V0UGF0aCkpIHtcbiAgICAgICAgICB1bmxpbmtTeW5jKHNvY2tldFBhdGgpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfSk7XG4gIH07XG4iXX0=

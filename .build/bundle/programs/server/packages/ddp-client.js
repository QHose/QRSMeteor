(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Retry = Package.retry.Retry;
var IdMap = Package['id-map'].IdMap;
var ECMAScript = Package.ecmascript.ECMAScript;
var Hook = Package['callback-hook'].Hook;
var DDPCommon = Package['ddp-common'].DDPCommon;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var MongoID = Package['mongo-id'].MongoID;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var toSockjsUrl, toWebsocketUrl, allConnections, DDP;

var require = meteorInstall({"node_modules":{"meteor":{"ddp-client":{"stream_client_nodejs.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/stream_client_nodejs.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var module1 = module;                                                                                                  // 1
var DDP = void 0,                                                                                                      // 1
    LivedataTest = void 0;                                                                                             // 1
module1.watch(require("./namespace.js"), {                                                                             // 1
  DDP: function (v) {                                                                                                  // 1
    DDP = v;                                                                                                           // 1
  },                                                                                                                   // 1
  LivedataTest: function (v) {                                                                                         // 1
    LivedataTest = v;                                                                                                  // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
                                                                                                                       //
// @param endpoint {String} URL to Meteor app                                                                          // 3
//   "http://subdomain.meteor.com/" or "/" or                                                                          // 4
//   "ddp+sockjs://foo-**.meteor.com/sockjs"                                                                           // 5
//                                                                                                                     // 6
// We do some rewriting of the URL to eventually make it "ws://" or "wss://",                                          // 7
// whatever was passed in.  At the very least, what Meteor.absoluteUrl() returns                                       // 8
// us should work.                                                                                                     // 9
//                                                                                                                     // 10
// We don't do any heartbeating. (The logic that did this in sockjs was removed,                                       // 11
// because it used a built-in sockjs mechanism. We could do it with WebSocket                                          // 12
// ping frames or with DDP-level messages.)                                                                            // 13
LivedataTest.ClientStream = function () {                                                                              // 14
  function ClientStream(endpoint, options) {                                                                           // 15
    (0, _classCallCheck3.default)(this, ClientStream);                                                                 // 15
    var self = this;                                                                                                   // 16
    options = options || {};                                                                                           // 17
    self.options = Object.assign({                                                                                     // 19
      retry: true                                                                                                      // 20
    }, options);                                                                                                       // 19
    self.client = null; // created in _launchConnection                                                                // 23
                                                                                                                       //
    self.endpoint = endpoint;                                                                                          // 24
    self.headers = self.options.headers || {};                                                                         // 26
    self.npmFayeOptions = self.options.npmFayeOptions || {};                                                           // 27
                                                                                                                       //
    self._initCommon(self.options); //// Kickoff!                                                                      // 29
                                                                                                                       //
                                                                                                                       //
    self._launchConnection();                                                                                          // 32
  } // data is a utf8 string. Data sent while not connected is dropped on                                              // 33
  // the floor, and it is up the user of this API to retransmit lost                                                   // 36
  // messages on 'reset'                                                                                               // 37
                                                                                                                       //
                                                                                                                       //
  ClientStream.prototype.send = function () {                                                                          // 14
    function send(data) {                                                                                              // 14
      var self = this;                                                                                                 // 39
                                                                                                                       //
      if (self.currentStatus.connected) {                                                                              // 40
        self.client.send(data);                                                                                        // 41
      }                                                                                                                // 42
    }                                                                                                                  // 43
                                                                                                                       //
    return send;                                                                                                       // 14
  }(); // Changes where this connection points                                                                         // 14
                                                                                                                       //
                                                                                                                       //
  ClientStream.prototype._changeUrl = function () {                                                                    // 14
    function _changeUrl(url) {                                                                                         // 14
      var self = this;                                                                                                 // 47
      self.endpoint = url;                                                                                             // 48
    }                                                                                                                  // 49
                                                                                                                       //
    return _changeUrl;                                                                                                 // 14
  }();                                                                                                                 // 14
                                                                                                                       //
  ClientStream.prototype._onConnect = function () {                                                                    // 14
    function _onConnect(client) {                                                                                      // 14
      var self = this;                                                                                                 // 52
                                                                                                                       //
      if (client !== self.client) {                                                                                    // 54
        // This connection is not from the last call to _launchConnection.                                             // 55
        // But _launchConnection calls _cleanup which closes previous connections.                                     // 56
        // It's our belief that this stifles future 'open' events, but maybe                                           // 57
        // we are wrong?                                                                                               // 58
        throw new Error("Got open from inactive client " + !!self.client);                                             // 59
      }                                                                                                                // 60
                                                                                                                       //
      if (self._forcedToDisconnect) {                                                                                  // 62
        // We were asked to disconnect between trying to open the connection and                                       // 63
        // actually opening it. Let's just pretend this never happened.                                                // 64
        self.client.close();                                                                                           // 65
        self.client = null;                                                                                            // 66
        return;                                                                                                        // 67
      }                                                                                                                // 68
                                                                                                                       //
      if (self.currentStatus.connected) {                                                                              // 70
        // We already have a connection. It must have been the case that we                                            // 71
        // started two parallel connection attempts (because we wanted to                                              // 72
        // 'reconnect now' on a hanging connection and we had no way to cancel the                                     // 73
        // connection attempt.) But this shouldn't happen (similarly to the client                                     // 74
        // !== self.client check above).                                                                               // 75
        throw new Error("Two parallel connections?");                                                                  // 76
      }                                                                                                                // 77
                                                                                                                       //
      self._clearConnectionTimer(); // update status                                                                   // 79
                                                                                                                       //
                                                                                                                       //
      self.currentStatus.status = "connected";                                                                         // 82
      self.currentStatus.connected = true;                                                                             // 83
      self.currentStatus.retryCount = 0;                                                                               // 84
      self.statusChanged(); // fire resets. This must come after status change so that clients                         // 85
      // can call send from within a reset callback.                                                                   // 88
                                                                                                                       //
      _.each(self.eventCallbacks.reset, function (callback) {                                                          // 89
        callback();                                                                                                    // 89
      });                                                                                                              // 89
    }                                                                                                                  // 90
                                                                                                                       //
    return _onConnect;                                                                                                 // 14
  }();                                                                                                                 // 14
                                                                                                                       //
  ClientStream.prototype._cleanup = function () {                                                                      // 14
    function _cleanup(maybeError) {                                                                                    // 14
      var self = this;                                                                                                 // 93
                                                                                                                       //
      self._clearConnectionTimer();                                                                                    // 95
                                                                                                                       //
      if (self.client) {                                                                                               // 96
        var client = self.client;                                                                                      // 97
        self.client = null;                                                                                            // 98
        client.close();                                                                                                // 99
                                                                                                                       //
        _.each(self.eventCallbacks.disconnect, function (callback) {                                                   // 101
          callback(maybeError);                                                                                        // 102
        });                                                                                                            // 103
      }                                                                                                                // 104
    }                                                                                                                  // 105
                                                                                                                       //
    return _cleanup;                                                                                                   // 14
  }();                                                                                                                 // 14
                                                                                                                       //
  ClientStream.prototype._clearConnectionTimer = function () {                                                         // 14
    function _clearConnectionTimer() {                                                                                 // 14
      var self = this;                                                                                                 // 108
                                                                                                                       //
      if (self.connectionTimer) {                                                                                      // 110
        clearTimeout(self.connectionTimer);                                                                            // 111
        self.connectionTimer = null;                                                                                   // 112
      }                                                                                                                // 113
    }                                                                                                                  // 114
                                                                                                                       //
    return _clearConnectionTimer;                                                                                      // 14
  }();                                                                                                                 // 14
                                                                                                                       //
  ClientStream.prototype._getProxyUrl = function () {                                                                  // 14
    function _getProxyUrl(targetUrl) {                                                                                 // 14
      var self = this; // Similar to code in tools/http-helpers.js.                                                    // 117
                                                                                                                       //
      var proxy = process.env.HTTP_PROXY || process.env.http_proxy || null; // if we're going to a secure url, try the https_proxy env variable first.
                                                                                                                       //
      if (targetUrl.match(/^wss:/)) {                                                                                  // 121
        proxy = process.env.HTTPS_PROXY || process.env.https_proxy || proxy;                                           // 122
      }                                                                                                                // 123
                                                                                                                       //
      return proxy;                                                                                                    // 124
    }                                                                                                                  // 125
                                                                                                                       //
    return _getProxyUrl;                                                                                               // 14
  }();                                                                                                                 // 14
                                                                                                                       //
  ClientStream.prototype._launchConnection = function () {                                                             // 14
    function _launchConnection() {                                                                                     // 14
      var self = this;                                                                                                 // 128
                                                                                                                       //
      self._cleanup(); // cleanup the old socket, if there was one.                                                    // 129
      // Since server-to-server DDP is still an experimental feature, we only                                          // 131
      // require the module if we actually create a server-to-server                                                   // 132
      // connection.                                                                                                   // 133
                                                                                                                       //
                                                                                                                       //
      var FayeWebSocket = Npm.require('faye-websocket');                                                               // 134
                                                                                                                       //
      var deflate = Npm.require('permessage-deflate');                                                                 // 135
                                                                                                                       //
      var targetUrl = toWebsocketUrl(self.endpoint);                                                                   // 137
      var fayeOptions = {                                                                                              // 138
        headers: self.headers,                                                                                         // 139
        extensions: [deflate]                                                                                          // 140
      };                                                                                                               // 138
      fayeOptions = _.extend(fayeOptions, self.npmFayeOptions);                                                        // 142
                                                                                                                       //
      var proxyUrl = self._getProxyUrl(targetUrl);                                                                     // 143
                                                                                                                       //
      if (proxyUrl) {                                                                                                  // 144
        fayeOptions.proxy = {                                                                                          // 145
          origin: proxyUrl                                                                                             // 145
        };                                                                                                             // 145
      }                                                                                                                // 146
                                                                                                                       //
      ; // We would like to specify 'ddp' as the subprotocol here. The npm module we                                   // 146
      // used to use as a client would fail the handshake if we ask for a                                              // 149
      // subprotocol and the server doesn't send one back (and sockjs doesn't).                                        // 150
      // Faye doesn't have that behavior; it's unclear from reading RFC 6455 if                                        // 151
      // Faye is erroneous or not.  So for now, we don't specify protocols.                                            // 152
                                                                                                                       //
      var subprotocols = [];                                                                                           // 153
      var client = self.client = new FayeWebSocket.Client(targetUrl, subprotocols, fayeOptions);                       // 155
                                                                                                                       //
      self._clearConnectionTimer();                                                                                    // 158
                                                                                                                       //
      self.connectionTimer = Meteor.setTimeout(function () {                                                           // 159
        self._lostConnection(new DDP.ConnectionError("DDP connection timed out"));                                     // 161
      }, self.CONNECT_TIMEOUT);                                                                                        // 163
      self.client.on('open', Meteor.bindEnvironment(function () {                                                      // 166
        return self._onConnect(client);                                                                                // 167
      }, "stream connect callback"));                                                                                  // 168
                                                                                                                       //
      var clientOnIfCurrent = function (event, description, f) {                                                       // 170
        self.client.on(event, Meteor.bindEnvironment(function () {                                                     // 171
          // Ignore events from any connection we've already cleaned up.                                               // 172
          if (client !== self.client) return;                                                                          // 173
          f.apply(this, arguments);                                                                                    // 175
        }, description));                                                                                              // 176
      };                                                                                                               // 177
                                                                                                                       //
      clientOnIfCurrent('error', 'stream error callback', function (error) {                                           // 179
        if (!self.options._dontPrintErrors) Meteor._debug("stream error", error.message); // Faye's 'error' object is not a JS error (and among other things,
        // doesn't stringify well). Convert it to one.                                                                 // 184
                                                                                                                       //
        self._lostConnection(new DDP.ConnectionError(error.message));                                                  // 185
      });                                                                                                              // 186
      clientOnIfCurrent('close', 'stream close callback', function () {                                                // 189
        self._lostConnection();                                                                                        // 190
      });                                                                                                              // 191
      clientOnIfCurrent('message', 'stream message callback', function (message) {                                     // 194
        // Ignore binary frames, where message.data is a Buffer                                                        // 195
        if (typeof message.data !== "string") return;                                                                  // 196
                                                                                                                       //
        _.each(self.eventCallbacks.message, function (callback) {                                                      // 199
          callback(message.data);                                                                                      // 200
        });                                                                                                            // 201
      });                                                                                                              // 202
    }                                                                                                                  // 203
                                                                                                                       //
    return _launchConnection;                                                                                          // 14
  }();                                                                                                                 // 14
                                                                                                                       //
  return ClientStream;                                                                                                 // 14
}();                                                                                                                   // 14
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stream_client_common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/stream_client_common.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var DDP = void 0,                                                                                                      // 1
    LivedataTest = void 0;                                                                                             // 1
module.watch(require("./namespace.js"), {                                                                              // 1
  DDP: function (v) {                                                                                                  // 1
    DDP = v;                                                                                                           // 1
  },                                                                                                                   // 1
  LivedataTest: function (v) {                                                                                         // 1
    LivedataTest = v;                                                                                                  // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
                                                                                                                       //
// XXX from Underscore.String (http://epeli.github.com/underscore.string/)                                             // 3
var startsWith = function (str, starts) {                                                                              // 4
  return str.length >= starts.length && str.substring(0, starts.length) === starts;                                    // 5
};                                                                                                                     // 7
                                                                                                                       //
var endsWith = function (str, ends) {                                                                                  // 8
  return str.length >= ends.length && str.substring(str.length - ends.length) === ends;                                // 9
}; // @param url {String} URL to Meteor app, eg:                                                                       // 11
//   "/" or "madewith.meteor.com" or "https://foo.meteor.com"                                                          // 14
//   or "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"                                                                 // 15
// @returns {String} URL to the endpoint with the specific scheme and subPath, e.g.                                    // 16
// for scheme "http" and subPath "sockjs"                                                                              // 17
//   "http://subdomain.meteor.com/sockjs" or "/sockjs"                                                                 // 18
//   or "https://ddp--1234-foo.meteor.com/sockjs"                                                                      // 19
                                                                                                                       //
                                                                                                                       //
var translateUrl = function (url, newSchemeBase, subPath) {                                                            // 20
  if (!newSchemeBase) {                                                                                                // 21
    newSchemeBase = "http";                                                                                            // 22
  }                                                                                                                    // 23
                                                                                                                       //
  var ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);                                                                // 25
  var httpUrlMatch = url.match(/^http(s?):\/\//);                                                                      // 26
  var newScheme;                                                                                                       // 27
                                                                                                                       //
  if (ddpUrlMatch) {                                                                                                   // 28
    // Remove scheme and split off the host.                                                                           // 29
    var urlAfterDDP = url.substr(ddpUrlMatch[0].length);                                                               // 30
    newScheme = ddpUrlMatch[1] === "i" ? newSchemeBase : newSchemeBase + "s";                                          // 31
    var slashPos = urlAfterDDP.indexOf('/');                                                                           // 32
    var host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);                                        // 33
    var rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos); // In the host (ONLY!), change '*' characters into random digits. This
    // allows different stream connections to connect to different hostnames                                           // 38
    // and avoid browser per-hostname connection limits.                                                               // 39
                                                                                                                       //
    host = host.replace(/\*/g, function () {                                                                           // 40
      return Math.floor(Random.fraction() * 10);                                                                       // 41
    });                                                                                                                // 42
    return newScheme + '://' + host + rest;                                                                            // 44
  } else if (httpUrlMatch) {                                                                                           // 45
    newScheme = !httpUrlMatch[1] ? newSchemeBase : newSchemeBase + "s";                                                // 46
    var urlAfterHttp = url.substr(httpUrlMatch[0].length);                                                             // 47
    url = newScheme + "://" + urlAfterHttp;                                                                            // 48
  } // Prefix FQDNs but not relative URLs                                                                              // 49
                                                                                                                       //
                                                                                                                       //
  if (url.indexOf("://") === -1 && !startsWith(url, "/")) {                                                            // 52
    url = newSchemeBase + "://" + url;                                                                                 // 53
  } // XXX This is not what we should be doing: if I have a site                                                       // 54
  // deployed at "/foo", then DDP.connect("/") should actually connect                                                 // 57
  // to "/", not to "/foo". "/" is an absolute path. (Contrast: if                                                     // 58
  // deployed at "/foo", it would be reasonable for DDP.connect("bar")                                                 // 59
  // to connect to "/foo/bar").                                                                                        // 60
  //                                                                                                                   // 61
  // We should make this properly honor absolute paths rather than                                                     // 62
  // forcing the path to be relative to the site root. Simultaneously,                                                 // 63
  // we should set DDP_DEFAULT_CONNECTION_URL to include the site                                                      // 64
  // root. See also client_convenience.js #RationalizingRelativeDDPURLs                                                // 65
                                                                                                                       //
                                                                                                                       //
  url = Meteor._relativeToSiteRootUrl(url);                                                                            // 66
  if (endsWith(url, "/")) return url + subPath;else return url + "/" + subPath;                                        // 68
};                                                                                                                     // 72
                                                                                                                       //
toSockjsUrl = function (url) {                                                                                         // 74
  return translateUrl(url, "http", "sockjs");                                                                          // 75
};                                                                                                                     // 76
                                                                                                                       //
toWebsocketUrl = function (url) {                                                                                      // 78
  var ret = translateUrl(url, "ws", "websocket");                                                                      // 79
  return ret;                                                                                                          // 80
};                                                                                                                     // 81
                                                                                                                       //
LivedataTest.toSockjsUrl = toSockjsUrl;                                                                                // 83
                                                                                                                       //
_.extend(LivedataTest.ClientStream.prototype, {                                                                        // 86
  // Register for callbacks.                                                                                           // 88
  on: function (name, callback) {                                                                                      // 89
    var self = this;                                                                                                   // 90
    if (name !== 'message' && name !== 'reset' && name !== 'disconnect') throw new Error("unknown event type: " + name);
    if (!self.eventCallbacks[name]) self.eventCallbacks[name] = [];                                                    // 95
    self.eventCallbacks[name].push(callback);                                                                          // 97
  },                                                                                                                   // 98
  _initCommon: function (options) {                                                                                    // 101
    var self = this;                                                                                                   // 102
    options = options || {}; //// Constants                                                                            // 103
    // how long to wait until we declare the connection attempt                                                        // 107
    // failed.                                                                                                         // 108
                                                                                                                       //
    self.CONNECT_TIMEOUT = options.connectTimeoutMs || 10000;                                                          // 109
    self.eventCallbacks = {}; // name -> [callback]                                                                    // 111
                                                                                                                       //
    self._forcedToDisconnect = false; //// Reactive status                                                             // 113
                                                                                                                       //
    self.currentStatus = {                                                                                             // 116
      status: "connecting",                                                                                            // 117
      connected: false,                                                                                                // 118
      retryCount: 0                                                                                                    // 119
    };                                                                                                                 // 116
    self.statusListeners = typeof Tracker !== 'undefined' && new Tracker.Dependency();                                 // 123
                                                                                                                       //
    self.statusChanged = function () {                                                                                 // 124
      if (self.statusListeners) self.statusListeners.changed();                                                        // 125
    }; //// Retry logic                                                                                                // 127
                                                                                                                       //
                                                                                                                       //
    self._retry = new Retry();                                                                                         // 130
    self.connectionTimer = null;                                                                                       // 131
  },                                                                                                                   // 133
  // Trigger a reconnect.                                                                                              // 135
  reconnect: function (options) {                                                                                      // 136
    var self = this;                                                                                                   // 137
    options = options || {};                                                                                           // 138
                                                                                                                       //
    if (options.url) {                                                                                                 // 140
      self._changeUrl(options.url);                                                                                    // 141
    }                                                                                                                  // 142
                                                                                                                       //
    if (options._sockjsOptions) {                                                                                      // 144
      self.options._sockjsOptions = options._sockjsOptions;                                                            // 145
    }                                                                                                                  // 146
                                                                                                                       //
    if (self.currentStatus.connected) {                                                                                // 148
      if (options._force || options.url) {                                                                             // 149
        // force reconnect.                                                                                            // 150
        self._lostConnection(new DDP.ForcedReconnectError());                                                          // 151
      } // else, noop.                                                                                                 // 152
                                                                                                                       //
                                                                                                                       //
      return;                                                                                                          // 153
    } // if we're mid-connection, stop it.                                                                             // 154
                                                                                                                       //
                                                                                                                       //
    if (self.currentStatus.status === "connecting") {                                                                  // 157
      // Pretend it's a clean close.                                                                                   // 158
      self._lostConnection();                                                                                          // 159
    }                                                                                                                  // 160
                                                                                                                       //
    self._retry.clear();                                                                                               // 162
                                                                                                                       //
    self.currentStatus.retryCount -= 1; // don't count manual retries                                                  // 163
                                                                                                                       //
    self._retryNow();                                                                                                  // 164
  },                                                                                                                   // 165
  disconnect: function (options) {                                                                                     // 167
    var self = this;                                                                                                   // 168
    options = options || {}; // Failed is permanent. If we're failed, don't let people go back                         // 169
    // online by calling 'disconnect' then 'reconnect'.                                                                // 172
                                                                                                                       //
    if (self._forcedToDisconnect) return; // If _permanent is set, permanently disconnect a stream. Once a stream      // 173
    // is forced to disconnect, it can never reconnect. This is for                                                    // 177
    // error cases such as ddp version mismatch, where trying again                                                    // 178
    // won't fix the problem.                                                                                          // 179
                                                                                                                       //
    if (options._permanent) {                                                                                          // 180
      self._forcedToDisconnect = true;                                                                                 // 181
    }                                                                                                                  // 182
                                                                                                                       //
    self._cleanup();                                                                                                   // 184
                                                                                                                       //
    self._retry.clear();                                                                                               // 185
                                                                                                                       //
    self.currentStatus = {                                                                                             // 187
      status: options._permanent ? "failed" : "offline",                                                               // 188
      connected: false,                                                                                                // 189
      retryCount: 0                                                                                                    // 190
    };                                                                                                                 // 187
    if (options._permanent && options._error) self.currentStatus.reason = options._error;                              // 193
    self.statusChanged();                                                                                              // 196
  },                                                                                                                   // 197
  // maybeError is set unless it's a clean protocol-level close.                                                       // 199
  _lostConnection: function (maybeError) {                                                                             // 200
    var self = this;                                                                                                   // 201
                                                                                                                       //
    self._cleanup(maybeError);                                                                                         // 203
                                                                                                                       //
    self._retryLater(maybeError); // sets status. no need to do it here.                                               // 204
                                                                                                                       //
  },                                                                                                                   // 205
  // fired when we detect that we've gone online. try to reconnect                                                     // 207
  // immediately.                                                                                                      // 208
  _online: function () {                                                                                               // 209
    // if we've requested to be offline by disconnecting, don't reconnect.                                             // 210
    if (this.currentStatus.status != "offline") this.reconnect();                                                      // 211
  },                                                                                                                   // 213
  _retryLater: function (maybeError) {                                                                                 // 215
    var self = this;                                                                                                   // 216
    var timeout = 0;                                                                                                   // 218
                                                                                                                       //
    if (self.options.retry || maybeError && maybeError.errorType === "DDP.ForcedReconnectError") {                     // 219
      timeout = self._retry.retryLater(self.currentStatus.retryCount, _.bind(self._retryNow, self));                   // 221
      self.currentStatus.status = "waiting";                                                                           // 225
      self.currentStatus.retryTime = new Date().getTime() + timeout;                                                   // 226
    } else {                                                                                                           // 227
      self.currentStatus.status = "failed";                                                                            // 228
      delete self.currentStatus.retryTime;                                                                             // 229
    }                                                                                                                  // 230
                                                                                                                       //
    self.currentStatus.connected = false;                                                                              // 232
    self.statusChanged();                                                                                              // 233
  },                                                                                                                   // 234
  _retryNow: function () {                                                                                             // 236
    var self = this;                                                                                                   // 237
    if (self._forcedToDisconnect) return;                                                                              // 239
    self.currentStatus.retryCount += 1;                                                                                // 242
    self.currentStatus.status = "connecting";                                                                          // 243
    self.currentStatus.connected = false;                                                                              // 244
    delete self.currentStatus.retryTime;                                                                               // 245
    self.statusChanged();                                                                                              // 246
                                                                                                                       //
    self._launchConnection();                                                                                          // 248
  },                                                                                                                   // 249
  // Get current status. Reactive.                                                                                     // 252
  status: function () {                                                                                                // 253
    var self = this;                                                                                                   // 254
    if (self.statusListeners) self.statusListeners.depend();                                                           // 255
    return self.currentStatus;                                                                                         // 257
  }                                                                                                                    // 258
});                                                                                                                    // 86
                                                                                                                       //
DDP.ConnectionError = Meteor.makeErrorType("DDP.ConnectionError", function (message) {                                 // 261
  var self = this;                                                                                                     // 263
  self.message = message;                                                                                              // 264
});                                                                                                                    // 265
DDP.ForcedReconnectError = Meteor.makeErrorType("DDP.ForcedReconnectError", function () {});                           // 267
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livedata_common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/livedata_common.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var DDP = void 0,                                                                                                      // 1
    LivedataTest = void 0;                                                                                             // 1
module.watch(require("./namespace.js"), {                                                                              // 1
  DDP: function (v) {                                                                                                  // 1
    DDP = v;                                                                                                           // 1
  },                                                                                                                   // 1
  LivedataTest: function (v) {                                                                                         // 1
    LivedataTest = v;                                                                                                  // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
LivedataTest.SUPPORTED_DDP_VERSIONS = DDPCommon.SUPPORTED_DDP_VERSIONS; // This is private but it's used in a few places. accounts-base uses
// it to get the current user. Meteor.setTimeout and friends clear                                                     // 6
// it. We can probably find a better way to factor this.                                                               // 7
                                                                                                                       //
DDP._CurrentMethodInvocation = new Meteor.EnvironmentVariable();                                                       // 8
DDP._CurrentPublicationInvocation = new Meteor.EnvironmentVariable(); // XXX: Keep DDP._CurrentInvocation for backwards-compatibility.
                                                                                                                       //
DDP._CurrentInvocation = DDP._CurrentMethodInvocation;                                                                 // 12
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"random_stream.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/random_stream.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var DDP = void 0;                                                                                                      // 1
module.watch(require("./namespace.js"), {                                                                              // 1
  DDP: function (v) {                                                                                                  // 1
    DDP = v;                                                                                                           // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
                                                                                                                       //
// Returns the named sequence of pseudo-random values.                                                                 // 3
// The scope will be DDP._CurrentMethodInvocation.get(), so the stream will produce                                    // 4
// consistent values for method calls on the client and server.                                                        // 5
DDP.randomStream = function (name) {                                                                                   // 6
  var scope = DDP._CurrentMethodInvocation.get();                                                                      // 7
                                                                                                                       //
  return DDPCommon.RandomStream.get(scope, name);                                                                      // 8
};                                                                                                                     // 9
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livedata_connection.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/livedata_connection.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var DDP = void 0,                                                                                                      // 1
    LivedataTest = void 0;                                                                                             // 1
module.watch(require("./namespace.js"), {                                                                              // 1
  DDP: function (v) {                                                                                                  // 1
    DDP = v;                                                                                                           // 1
  },                                                                                                                   // 1
  LivedataTest: function (v) {                                                                                         // 1
    LivedataTest = v;                                                                                                  // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var MongoIDMap = void 0;                                                                                               // 1
module.watch(require("./id_map.js"), {                                                                                 // 1
  MongoIDMap: function (v) {                                                                                           // 1
    MongoIDMap = v;                                                                                                    // 1
  }                                                                                                                    // 1
}, 1);                                                                                                                 // 1
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 4
  var Fiber = Npm.require('fibers');                                                                                   // 5
                                                                                                                       //
  var Future = Npm.require('fibers/future');                                                                           // 6
} // @param url {String|Object} URL to Meteor app,                                                                     // 7
//   or an object as a test hook (see code)                                                                            // 10
// Options:                                                                                                            // 11
//   reloadWithOutstanding: is it OK to reload if there are outstanding methods?                                       // 12
//   headers: extra headers to send on the websockets connection, for                                                  // 13
//     server-to-server DDP only                                                                                       // 14
//   _sockjsOptions: Specifies options to pass through to the sockjs client                                            // 15
//   onDDPNegotiationVersionFailure: callback when version negotiation fails.                                          // 16
//                                                                                                                     // 17
// XXX There should be a way to destroy a DDP connection, causing all                                                  // 18
// outstanding method calls to fail.                                                                                   // 19
//                                                                                                                     // 20
// XXX Our current way of handling failure and reconnection is great                                                   // 21
// for an app (where we want to tolerate being disconnected as an                                                      // 22
// expect state, and keep trying forever to reconnect) but cumbersome                                                  // 23
// for something like a command line tool that wants to make a                                                         // 24
// connection, call a method, and print an error if connection                                                         // 25
// fails. We should have better usability in the latter case (while                                                    // 26
// still transparently reconnecting if it's just a transient failure                                                   // 27
// or the server migrating us).                                                                                        // 28
                                                                                                                       //
                                                                                                                       //
var Connection = function (url, options) {                                                                             // 29
  var self = this;                                                                                                     // 30
  options = _.extend({                                                                                                 // 31
    onConnected: function () {},                                                                                       // 32
    onDDPVersionNegotiationFailure: function (description) {                                                           // 33
      Meteor._debug(description);                                                                                      // 34
    },                                                                                                                 // 35
    heartbeatInterval: 17500,                                                                                          // 36
    heartbeatTimeout: 15000,                                                                                           // 37
    npmFayeOptions: {},                                                                                                // 38
    // These options are only for testing.                                                                             // 39
    reloadWithOutstanding: false,                                                                                      // 40
    supportedDDPVersions: DDPCommon.SUPPORTED_DDP_VERSIONS,                                                            // 41
    retry: true,                                                                                                       // 42
    respondToPings: true,                                                                                              // 43
    // When updates are coming within this ms interval, batch them together.                                           // 44
    bufferedWritesInterval: 5,                                                                                         // 45
    // Flush buffers immediately if writes are happening continuously for more than this many ms.                      // 46
    bufferedWritesMaxAge: 500                                                                                          // 47
  }, options); // If set, called when we reconnect, queuing method calls _before_ the                                  // 31
  // existing outstanding ones.                                                                                        // 51
  // NOTE: This feature has been preserved for backwards compatibility. The                                            // 52
  // preferred method of setting a callback on reconnect is to use                                                     // 53
  // DDP.onReconnect.                                                                                                  // 54
                                                                                                                       //
  self.onReconnect = null; // as a test hook, allow passing a stream instead of a url.                                 // 55
                                                                                                                       //
  if ((typeof url === "undefined" ? "undefined" : (0, _typeof3.default)(url)) === "object") {                          // 58
    self._stream = url;                                                                                                // 59
  } else {                                                                                                             // 60
    self._stream = new LivedataTest.ClientStream(url, {                                                                // 61
      retry: options.retry,                                                                                            // 62
      headers: options.headers,                                                                                        // 63
      _sockjsOptions: options._sockjsOptions,                                                                          // 64
      // Used to keep some tests quiet, or for other cases in which                                                    // 65
      // the right thing to do with connection errors is to silently                                                   // 66
      // fail (e.g. sending package usage stats). At some point we                                                     // 67
      // should have a real API for handling client-stream-level                                                       // 68
      // errors.                                                                                                       // 69
      _dontPrintErrors: options._dontPrintErrors,                                                                      // 70
      connectTimeoutMs: options.connectTimeoutMs,                                                                      // 71
      npmFayeOptions: options.npmFayeOptions                                                                           // 72
    });                                                                                                                // 61
  }                                                                                                                    // 74
                                                                                                                       //
  self._lastSessionId = null;                                                                                          // 76
  self._versionSuggestion = null; // The last proposed DDP version.                                                    // 77
                                                                                                                       //
  self._version = null; // The DDP version agreed on by client and server.                                             // 78
                                                                                                                       //
  self._stores = {}; // name -> object with methods                                                                    // 79
                                                                                                                       //
  self._methodHandlers = {}; // name -> func                                                                           // 80
                                                                                                                       //
  self._nextMethodId = 1;                                                                                              // 81
  self._supportedDDPVersions = options.supportedDDPVersions;                                                           // 82
  self._heartbeatInterval = options.heartbeatInterval;                                                                 // 84
  self._heartbeatTimeout = options.heartbeatTimeout; // Tracks methods which the user has tried to call but which have not yet
  // called their user callback (ie, they are waiting on their result or for all                                       // 88
  // of their writes to be written to the local cache). Map from method ID to                                          // 89
  // MethodInvoker object.                                                                                             // 90
                                                                                                                       //
  self._methodInvokers = {}; // Tracks methods which the user has called but whose result messages have not            // 91
  // arrived yet.                                                                                                      // 94
  //                                                                                                                   // 95
  // _outstandingMethodBlocks is an array of blocks of methods. Each block                                             // 96
  // represents a set of methods that can run at the same time. The first block                                        // 97
  // represents the methods which are currently in flight; subsequent blocks                                           // 98
  // must wait for previous blocks to be fully finished before they can be sent                                        // 99
  // to the server.                                                                                                    // 100
  //                                                                                                                   // 101
  // Each block is an object with the following fields:                                                                // 102
  // - methods: a list of MethodInvoker objects                                                                        // 103
  // - wait: a boolean; if true, this block had a single method invoked with                                           // 104
  //         the "wait" option                                                                                         // 105
  //                                                                                                                   // 106
  // There will never be adjacent blocks with wait=false, because the only thing                                       // 107
  // that makes methods need to be serialized is a wait method.                                                        // 108
  //                                                                                                                   // 109
  // Methods are removed from the first block when their "result" is                                                   // 110
  // received. The entire first block is only removed when all of the in-flight                                        // 111
  // methods have received their results (so the "methods" list is empty) *AND*                                        // 112
  // all of the data written by those methods are visible in the local cache. So                                       // 113
  // it is possible for the first block's methods list to be empty, if we are                                          // 114
  // still waiting for some objects to quiesce.                                                                        // 115
  //                                                                                                                   // 116
  // Example:                                                                                                          // 117
  //  _outstandingMethodBlocks = [                                                                                     // 118
  //    {wait: false, methods: []},                                                                                    // 119
  //    {wait: true, methods: [<MethodInvoker for 'login'>]},                                                          // 120
  //    {wait: false, methods: [<MethodInvoker for 'foo'>,                                                             // 121
  //                            <MethodInvoker for 'bar'>]}]                                                           // 122
  // This means that there were some methods which were sent to the server and                                         // 123
  // which have returned their results, but some of the data written by                                                // 124
  // the methods may not be visible in the local cache. Once all that data is                                          // 125
  // visible, we will send a 'login' method. Once the login method has returned                                        // 126
  // and all the data is visible (including re-running subs if userId changes),                                        // 127
  // we will send the 'foo' and 'bar' methods in parallel.                                                             // 128
                                                                                                                       //
  self._outstandingMethodBlocks = []; // method ID -> array of objects with keys 'collection' and 'id', listing        // 129
  // documents written by a given method's stub. keys are associated with                                              // 132
  // methods whose stub wrote at least one document, and whose data-done message                                       // 133
  // has not yet been received.                                                                                        // 134
                                                                                                                       //
  self._documentsWrittenByStub = {}; // collection -> IdMap of "server document" object. A "server document" has:      // 135
  // - "document": the version of the document according the                                                           // 137
  //   server (ie, the snapshot before a stub wrote it, amended by any changes                                         // 138
  //   received from the server)                                                                                       // 139
  //   It is undefined if we think the document does not exist                                                         // 140
  // - "writtenByStubs": a set of method IDs whose stubs wrote to the document                                         // 141
  //   whose "data done" messages have not yet been processed                                                          // 142
                                                                                                                       //
  self._serverDocuments = {}; // Array of callbacks to be called after the next update of the local                    // 143
  // cache. Used for:                                                                                                  // 146
  //  - Calling methodInvoker.dataVisible and sub ready callbacks after                                                // 147
  //    the relevant data is flushed.                                                                                  // 148
  //  - Invoking the callbacks of "half-finished" methods after reconnect                                              // 149
  //    quiescence. Specifically, methods whose result was received over the old                                       // 150
  //    connection (so we don't re-send it) but whose data had not been made                                           // 151
  //    visible.                                                                                                       // 152
                                                                                                                       //
  self._afterUpdateCallbacks = []; // In two contexts, we buffer all incoming data messages and then process them      // 153
  // all at once in a single update:                                                                                   // 156
  //   - During reconnect, we buffer all data messages until all subs that had                                         // 157
  //     been ready before reconnect are ready again, and all methods that are                                         // 158
  //     active have returned their "data done message"; then                                                          // 159
  //   - During the execution of a "wait" method, we buffer all data messages                                          // 160
  //     until the wait method gets its "data done" message. (If the wait method                                       // 161
  //     occurs during reconnect, it doesn't get any special handling.)                                                // 162
  // all data messages are processed in one update.                                                                    // 163
  //                                                                                                                   // 164
  // The following fields are used for this "quiescence" process.                                                      // 165
  // This buffers the messages that aren't being processed yet.                                                        // 167
                                                                                                                       //
  self._messagesBufferedUntilQuiescence = []; // Map from method ID -> true. Methods are removed from this when their  // 168
  // "data done" message is received, and we will not quiesce until it is                                              // 170
  // empty.                                                                                                            // 171
                                                                                                                       //
  self._methodsBlockingQuiescence = {}; // map from sub ID -> true for subs that were ready (ie, called the sub        // 172
  // ready callback) before reconnect but haven't become ready again yet                                               // 174
                                                                                                                       //
  self._subsBeingRevived = {}; // map from sub._id -> true                                                             // 175
  // if true, the next data update should reset all stores. (set during                                                // 176
  // reconnect.)                                                                                                       // 177
                                                                                                                       //
  self._resetStores = false; // name -> array of updates for (yet to be created) collections                           // 178
                                                                                                                       //
  self._updatesForUnknownStores = {}; // if we're blocking a migration, the retry func                                 // 181
                                                                                                                       //
  self._retryMigrate = null;                                                                                           // 183
  self.__flushBufferedWrites = Meteor.bindEnvironment(self._flushBufferedWrites, "flushing DDP buffered writes", self); // Collection name -> array of messages.
                                                                                                                       //
  self._bufferedWrites = {}; // When current buffer of updates must be flushed at, in ms timestamp.                    // 188
                                                                                                                       //
  self._bufferedWritesFlushAt = null; // Timeout handle for the next processing of all pending writes                  // 190
                                                                                                                       //
  self._bufferedWritesFlushHandle = null;                                                                              // 192
  self._bufferedWritesInterval = options.bufferedWritesInterval;                                                       // 194
  self._bufferedWritesMaxAge = options.bufferedWritesMaxAge; // metadata for subscriptions.  Map from sub ID to object with keys:
  //   - id                                                                                                            // 198
  //   - name                                                                                                          // 199
  //   - params                                                                                                        // 200
  //   - inactive (if true, will be cleaned up if not reused in re-run)                                                // 201
  //   - ready (has the 'ready' message been received?)                                                                // 202
  //   - readyCallback (an optional callback to call when ready)                                                       // 203
  //   - errorCallback (an optional callback to call if the sub terminates with                                        // 204
  //                    an error, XXX COMPAT WITH 1.0.3.1)                                                             // 205
  //   - stopCallback (an optional callback to call when the sub terminates                                            // 206
  //     for any reason, with an error argument if an error triggered the stop)                                        // 207
                                                                                                                       //
  self._subscriptions = {}; // Reactive userId.                                                                        // 208
                                                                                                                       //
  self._userId = null;                                                                                                 // 211
  self._userIdDeps = new Tracker.Dependency(); // Block auto-reload while we're waiting for method responses.          // 212
                                                                                                                       //
  if (Meteor.isClient && Package.reload && !options.reloadWithOutstanding) {                                           // 215
    Package.reload.Reload._onMigrate(function (retry) {                                                                // 216
      if (!self._readyToMigrate()) {                                                                                   // 217
        if (self._retryMigrate) throw new Error("Two migrations in progress?");                                        // 218
        self._retryMigrate = retry;                                                                                    // 220
        return false;                                                                                                  // 221
      } else {                                                                                                         // 222
        return [true];                                                                                                 // 223
      }                                                                                                                // 224
    });                                                                                                                // 225
  }                                                                                                                    // 226
                                                                                                                       //
  var onMessage = function (raw_msg) {                                                                                 // 228
    try {                                                                                                              // 229
      var msg = DDPCommon.parseDDP(raw_msg);                                                                           // 230
    } catch (e) {                                                                                                      // 231
      Meteor._debug("Exception while parsing DDP", e);                                                                 // 232
                                                                                                                       //
      return;                                                                                                          // 233
    } // Any message counts as receiving a pong, as it demonstrates that                                               // 234
    // the server is still alive.                                                                                      // 237
                                                                                                                       //
                                                                                                                       //
    if (self._heartbeat) {                                                                                             // 238
      self._heartbeat.messageReceived();                                                                               // 239
    }                                                                                                                  // 240
                                                                                                                       //
    if (msg === null || !msg.msg) {                                                                                    // 242
      // XXX COMPAT WITH 0.6.6. ignore the old welcome message for back                                                // 243
      // compat.  Remove this 'if' once the server stops sending welcome                                               // 244
      // messages (stream_server.js).                                                                                  // 245
      if (!(msg && msg.server_id)) Meteor._debug("discarding invalid livedata message", msg);                          // 246
      return;                                                                                                          // 248
    }                                                                                                                  // 249
                                                                                                                       //
    if (msg.msg === 'connected') {                                                                                     // 251
      self._version = self._versionSuggestion;                                                                         // 252
                                                                                                                       //
      self._livedata_connected(msg);                                                                                   // 253
                                                                                                                       //
      options.onConnected();                                                                                           // 254
    } else if (msg.msg === 'failed') {                                                                                 // 255
      if (_.contains(self._supportedDDPVersions, msg.version)) {                                                       // 257
        self._versionSuggestion = msg.version;                                                                         // 258
                                                                                                                       //
        self._stream.reconnect({                                                                                       // 259
          _force: true                                                                                                 // 259
        });                                                                                                            // 259
      } else {                                                                                                         // 260
        var description = "DDP version negotiation failed; server requested version " + msg.version;                   // 261
                                                                                                                       //
        self._stream.disconnect({                                                                                      // 263
          _permanent: true,                                                                                            // 263
          _error: description                                                                                          // 263
        });                                                                                                            // 263
                                                                                                                       //
        options.onDDPVersionNegotiationFailure(description);                                                           // 264
      }                                                                                                                // 265
    } else if (msg.msg === 'ping' && options.respondToPings) {                                                         // 266
      self._send({                                                                                                     // 268
        msg: "pong",                                                                                                   // 268
        id: msg.id                                                                                                     // 268
      });                                                                                                              // 268
    } else if (msg.msg === 'pong') {// noop, as we assume everything's a pong                                          // 269
    } else if (_.include(['added', 'changed', 'removed', 'ready', 'updated'], msg.msg)) self._livedata_data(msg);else if (msg.msg === 'nosub') self._livedata_nosub(msg);else if (msg.msg === 'result') self._livedata_result(msg);else if (msg.msg === 'error') self._livedata_error(msg);else Meteor._debug("discarding unknown livedata message type", msg);
  };                                                                                                                   // 283
                                                                                                                       //
  var onReset = function () {                                                                                          // 285
    // Send a connect message at the beginning of the stream.                                                          // 286
    // NOTE: reset is called even on the first connection, so this is                                                  // 287
    // the only place we send this message.                                                                            // 288
    var msg = {                                                                                                        // 289
      msg: 'connect'                                                                                                   // 289
    };                                                                                                                 // 289
    if (self._lastSessionId) msg.session = self._lastSessionId;                                                        // 290
    msg.version = self._versionSuggestion || self._supportedDDPVersions[0];                                            // 292
    self._versionSuggestion = msg.version;                                                                             // 293
    msg.support = self._supportedDDPVersions;                                                                          // 294
                                                                                                                       //
    self._send(msg); // Mark non-retry calls as failed. This has to be done early as getting these methods out of the  // 295
    // current block is pretty important to making sure that quiescence is properly calculated, as                     // 298
    // well as possibly moving on to another useful block.                                                             // 299
    // Only bother testing if there is an outstandingMethodBlock (there might not be, especially if                    // 301
    // we are connecting for the first time.                                                                           // 302
                                                                                                                       //
                                                                                                                       //
    if (self._outstandingMethodBlocks.length > 0) {                                                                    // 303
      // If there is an outstanding method block, we only care about the first one as that is the                      // 304
      // one that could have already sent messages with no response, that are not allowed to retry.                    // 305
      var currentMethodBlock = self._outstandingMethodBlocks[0].methods;                                               // 306
      self._outstandingMethodBlocks[0].methods = currentMethodBlock.filter(function (methodInvoker) {                  // 307
        // Methods with 'noRetry' option set are not allowed to re-send after                                          // 309
        // recovering dropped connection.                                                                              // 310
        if (methodInvoker.sentMessage && methodInvoker.noRetry) {                                                      // 311
          // Make sure that the method is told that it failed.                                                         // 312
          methodInvoker.receiveResult(new Meteor.Error('invocation-failed', 'Method invocation might have failed due to dropped connection. ' + 'Failing because `noRetry` option was passed to Meteor.apply.'));
        } // Only keep a method if it wasn't sent or it's allowed to retry.                                            // 316
        // This may leave the block empty, but we don't move on to the next                                            // 319
        // block until the callback has been delivered, in _outstandingMethodFinished.                                 // 320
                                                                                                                       //
                                                                                                                       //
        return !(methodInvoker.sentMessage && methodInvoker.noRetry);                                                  // 321
      });                                                                                                              // 322
    } // Now, to minimize setup latency, go ahead and blast out all of                                                 // 323
    // our pending methods ands subscriptions before we've even taken                                                  // 326
    // the necessary RTT to know if we successfully reconnected. (1)                                                   // 327
    // They're supposed to be idempotent, and where they are not,                                                      // 328
    // they can block retry in apply; (2) even if we did reconnect,                                                    // 329
    // we're not sure what messages might have gotten lost                                                             // 330
    // (in either direction) since we were disconnected (TCP being                                                     // 331
    // sloppy about that.)                                                                                             // 332
    // If the current block of methods all got their results (but didn't all get                                       // 334
    // their data visible), discard the empty block now.                                                               // 335
                                                                                                                       //
                                                                                                                       //
    if (!_.isEmpty(self._outstandingMethodBlocks) && _.isEmpty(self._outstandingMethodBlocks[0].methods)) {            // 336
      self._outstandingMethodBlocks.shift();                                                                           // 338
    } // Mark all messages as unsent, they have not yet been sent on this                                              // 339
    // connection.                                                                                                     // 342
                                                                                                                       //
                                                                                                                       //
    _.each(self._methodInvokers, function (m) {                                                                        // 343
      m.sentMessage = false;                                                                                           // 344
    }); // If an `onReconnect` handler is set, call it first. Go through                                               // 345
    // some hoops to ensure that methods that are called from within                                                   // 348
    // `onReconnect` get executed _before_ ones that were originally                                                   // 349
    // outstanding (since `onReconnect` is used to re-establish auth                                                   // 350
    // certificates)                                                                                                   // 351
                                                                                                                       //
                                                                                                                       //
    self._callOnReconnectAndSendAppropriateOutstandingMethods(); // add new subscriptions at the end. this way they take effect after
    // the handlers and we don't see flicker.                                                                          // 355
                                                                                                                       //
                                                                                                                       //
    _.each(self._subscriptions, function (sub, id) {                                                                   // 356
      self._send({                                                                                                     // 357
        msg: 'sub',                                                                                                    // 358
        id: id,                                                                                                        // 359
        name: sub.name,                                                                                                // 360
        params: sub.params                                                                                             // 361
      });                                                                                                              // 357
    });                                                                                                                // 363
  };                                                                                                                   // 364
                                                                                                                       //
  var onDisconnect = function () {                                                                                     // 366
    if (self._heartbeat) {                                                                                             // 367
      self._heartbeat.stop();                                                                                          // 368
                                                                                                                       //
      self._heartbeat = null;                                                                                          // 369
    }                                                                                                                  // 370
  };                                                                                                                   // 371
                                                                                                                       //
  if (Meteor.isServer) {                                                                                               // 373
    self._stream.on('message', Meteor.bindEnvironment(onMessage, "handling DDP message"));                             // 374
                                                                                                                       //
    self._stream.on('reset', Meteor.bindEnvironment(onReset, "handling DDP reset"));                                   // 375
                                                                                                                       //
    self._stream.on('disconnect', Meteor.bindEnvironment(onDisconnect, "handling DDP disconnect"));                    // 376
  } else {                                                                                                             // 377
    self._stream.on('message', onMessage);                                                                             // 378
                                                                                                                       //
    self._stream.on('reset', onReset);                                                                                 // 379
                                                                                                                       //
    self._stream.on('disconnect', onDisconnect);                                                                       // 380
  }                                                                                                                    // 381
}; // A MethodInvoker manages sending a method to the server and calling the user's                                    // 382
// callbacks. On construction, it registers itself in the connection's                                                 // 385
// _methodInvokers map; it removes itself once the method is fully finished and                                        // 386
// the callback is invoked. This occurs when it has both received a result,                                            // 387
// and the data written by it is fully visible.                                                                        // 388
                                                                                                                       //
                                                                                                                       //
var MethodInvoker = function (options) {                                                                               // 389
  var self = this; // Public (within this file) fields.                                                                // 390
                                                                                                                       //
  self.methodId = options.methodId;                                                                                    // 393
  self.sentMessage = false;                                                                                            // 394
  self._callback = options.callback;                                                                                   // 396
  self._connection = options.connection;                                                                               // 397
  self._message = options.message;                                                                                     // 398
                                                                                                                       //
  self._onResultReceived = options.onResultReceived || function () {};                                                 // 399
                                                                                                                       //
  self._wait = options.wait;                                                                                           // 400
  self.noRetry = options.noRetry;                                                                                      // 401
  self._methodResult = null;                                                                                           // 402
  self._dataVisible = false; // Register with the connection.                                                          // 403
                                                                                                                       //
  self._connection._methodInvokers[self.methodId] = self;                                                              // 406
};                                                                                                                     // 407
                                                                                                                       //
_.extend(MethodInvoker.prototype, {                                                                                    // 408
  // Sends the method message to the server. May be called additional times if                                         // 409
  // we lose the connection and reconnect before receiving a result.                                                   // 410
  sendMessage: function () {                                                                                           // 411
    var self = this; // This function is called before sending a method (including resending on                        // 412
    // reconnect). We should only (re)send methods where we don't already have a                                       // 414
    // result!                                                                                                         // 415
                                                                                                                       //
    if (self.gotResult()) throw new Error("sendingMethod is called on method with result"); // If we're re-sending it, it doesn't matter if data was written the first
    // time.                                                                                                           // 421
                                                                                                                       //
    self._dataVisible = false;                                                                                         // 422
    self.sentMessage = true; // If this is a wait method, make all data messages be buffered until it is               // 423
    // done.                                                                                                           // 426
                                                                                                                       //
    if (self._wait) self._connection._methodsBlockingQuiescence[self.methodId] = true; // Actually send the message.   // 427
                                                                                                                       //
    self._connection._send(self._message);                                                                             // 431
  },                                                                                                                   // 432
  // Invoke the callback, if we have both a result and know that all data has                                          // 433
  // been written to the local cache.                                                                                  // 434
  _maybeInvokeCallback: function () {                                                                                  // 435
    var self = this;                                                                                                   // 436
                                                                                                                       //
    if (self._methodResult && self._dataVisible) {                                                                     // 437
      // Call the callback. (This won't throw: the callback was wrapped with                                           // 438
      // bindEnvironment.)                                                                                             // 439
      self._callback(self._methodResult[0], self._methodResult[1]); // Forget about this method.                       // 440
                                                                                                                       //
                                                                                                                       //
      delete self._connection._methodInvokers[self.methodId]; // Let the connection know that this method is finished, so it can try to
      // move on to the next block of methods.                                                                         // 446
                                                                                                                       //
      self._connection._outstandingMethodFinished();                                                                   // 447
    }                                                                                                                  // 448
  },                                                                                                                   // 449
  // Call with the result of the method from the server. Only may be called                                            // 450
  // once; once it is called, you should not call sendMessage again.                                                   // 451
  // If the user provided an onResultReceived callback, call it immediately.                                           // 452
  // Then invoke the main callback if data is also visible.                                                            // 453
  receiveResult: function (err, result) {                                                                              // 454
    var self = this;                                                                                                   // 455
    if (self.gotResult()) throw new Error("Methods should only receive results once");                                 // 456
    self._methodResult = [err, result];                                                                                // 458
                                                                                                                       //
    self._onResultReceived(err, result);                                                                               // 459
                                                                                                                       //
    self._maybeInvokeCallback();                                                                                       // 460
  },                                                                                                                   // 461
  // Call this when all data written by the method is visible. This means that                                         // 462
  // the method has returns its "data is done" message *AND* all server                                                // 463
  // documents that are buffered at that time have been written to the local                                           // 464
  // cache. Invokes the main callback if the result has been received.                                                 // 465
  dataVisible: function () {                                                                                           // 466
    var self = this;                                                                                                   // 467
    self._dataVisible = true;                                                                                          // 468
                                                                                                                       //
    self._maybeInvokeCallback();                                                                                       // 469
  },                                                                                                                   // 470
  // True if receiveResult has been called.                                                                            // 471
  gotResult: function () {                                                                                             // 472
    var self = this;                                                                                                   // 473
    return !!self._methodResult;                                                                                       // 474
  }                                                                                                                    // 475
});                                                                                                                    // 408
                                                                                                                       //
_.extend(Connection.prototype, {                                                                                       // 478
  // 'name' is the name of the data on the wire that should go in the                                                  // 479
  // store. 'wrappedStore' should be an object with methods beginUpdate, update,                                       // 480
  // endUpdate, saveOriginals, retrieveOriginals. see Collection for an example.                                       // 481
  registerStore: function (name, wrappedStore) {                                                                       // 482
    var self = this;                                                                                                   // 483
    if (name in self._stores) return false; // Wrap the input object in an object which makes any store method not     // 485
    // implemented by 'store' into a no-op.                                                                            // 489
                                                                                                                       //
    var store = {};                                                                                                    // 490
                                                                                                                       //
    _.each(['update', 'beginUpdate', 'endUpdate', 'saveOriginals', 'retrieveOriginals', 'getDoc', '_getCollection'], function (method) {
      store[method] = function () {                                                                                    // 494
        return wrappedStore[method] ? wrappedStore[method].apply(wrappedStore, arguments) : undefined;                 // 495
      };                                                                                                               // 498
    });                                                                                                                // 499
                                                                                                                       //
    self._stores[name] = store;                                                                                        // 501
    var queued = self._updatesForUnknownStores[name];                                                                  // 503
                                                                                                                       //
    if (queued) {                                                                                                      // 504
      store.beginUpdate(queued.length, false);                                                                         // 505
                                                                                                                       //
      _.each(queued, function (msg) {                                                                                  // 506
        store.update(msg);                                                                                             // 507
      });                                                                                                              // 508
                                                                                                                       //
      store.endUpdate();                                                                                               // 509
      delete self._updatesForUnknownStores[name];                                                                      // 510
    }                                                                                                                  // 511
                                                                                                                       //
    return true;                                                                                                       // 513
  },                                                                                                                   // 514
  /**                                                                                                                  // 516
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   * @summary Subscribe to a record set.  Returns a handle that provides                                               //
   * `stop()` and `ready()` methods.                                                                                   //
   * @locus Client                                                                                                     //
   * @param {String} name Name of the subscription.  Matches the name of the                                           //
   * server's `publish()` call.                                                                                        //
   * @param {EJSONable} [arg1,arg2...] Optional arguments passed to publisher                                          //
   * function on server.                                                                                               //
   * @param {Function|Object} [callbacks] Optional. May include `onStop`                                               //
   * and `onReady` callbacks. If there is an error, it is passed as an                                                 //
   * argument to `onStop`. If a function is passed instead of an object, it                                            //
   * is interpreted as an `onReady` callback.                                                                          //
   */subscribe: function (name /* .. [arguments] .. (callback|callbacks) */) {                                         //
    var self = this;                                                                                                   // 532
    var params = Array.prototype.slice.call(arguments, 1);                                                             // 534
    var callbacks = {};                                                                                                // 535
                                                                                                                       //
    if (params.length) {                                                                                               // 536
      var lastParam = params[params.length - 1];                                                                       // 537
                                                                                                                       //
      if (_.isFunction(lastParam)) {                                                                                   // 538
        callbacks.onReady = params.pop();                                                                              // 539
      } else if (lastParam && // XXX COMPAT WITH 1.0.3.1 onError used to exist, but now we use                         // 540
      // onStop with an error callback instead.                                                                        // 542
      _.any([lastParam.onReady, lastParam.onError, lastParam.onStop], _.isFunction)) {                                 // 543
        callbacks = params.pop();                                                                                      // 545
      }                                                                                                                // 546
    } // Is there an existing sub with the same name and param, run in an                                              // 547
    // invalidated Computation? This will happen if we are rerunning an                                                // 550
    // existing computation.                                                                                           // 551
    //                                                                                                                 // 552
    // For example, consider a rerun of:                                                                               // 553
    //                                                                                                                 // 554
    //     Tracker.autorun(function () {                                                                               // 555
    //       Meteor.subscribe("foo", Session.get("foo"));                                                              // 556
    //       Meteor.subscribe("bar", Session.get("bar"));                                                              // 557
    //     });                                                                                                         // 558
    //                                                                                                                 // 559
    // If "foo" has changed but "bar" has not, we will match the "bar"                                                 // 560
    // subcribe to an existing inactive subscription in order to not                                                   // 561
    // unsub and resub the subscription unnecessarily.                                                                 // 562
    //                                                                                                                 // 563
    // We only look for one such sub; if there are N apparently-identical subs                                         // 564
    // being invalidated, we will require N matching subscribe calls to keep                                           // 565
    // them all active.                                                                                                // 566
                                                                                                                       //
                                                                                                                       //
    var existing = _.find(self._subscriptions, function (sub) {                                                        // 567
      return sub.inactive && sub.name === name && EJSON.equals(sub.params, params);                                    // 568
    });                                                                                                                // 570
                                                                                                                       //
    var id;                                                                                                            // 572
                                                                                                                       //
    if (existing) {                                                                                                    // 573
      id = existing.id;                                                                                                // 574
      existing.inactive = false; // reactivate                                                                         // 575
                                                                                                                       //
      if (callbacks.onReady) {                                                                                         // 577
        // If the sub is not already ready, replace any ready callback with the                                        // 578
        // one provided now. (It's not really clear what users would expect for                                        // 579
        // an onReady callback inside an autorun; the semantics we provide is                                          // 580
        // that at the time the sub first becomes ready, we call the last                                              // 581
        // onReady callback provided, if any.)                                                                         // 582
        // If the sub is already ready, run the ready callback right away.                                             // 583
        // It seems that users would expect an onReady callback inside an                                              // 584
        // autorun to trigger once the the sub first becomes ready and also                                            // 585
        // when re-subs happens.                                                                                       // 586
        if (existing.ready) {                                                                                          // 587
          callbacks.onReady();                                                                                         // 588
        } else {                                                                                                       // 589
          existing.readyCallback = callbacks.onReady;                                                                  // 590
        }                                                                                                              // 591
      } // XXX COMPAT WITH 1.0.3.1 we used to have onError but now we call                                             // 592
      // onStop with an optional error argument                                                                        // 595
                                                                                                                       //
                                                                                                                       //
      if (callbacks.onError) {                                                                                         // 596
        // Replace existing callback if any, so that errors aren't                                                     // 597
        // double-reported.                                                                                            // 598
        existing.errorCallback = callbacks.onError;                                                                    // 599
      }                                                                                                                // 600
                                                                                                                       //
      if (callbacks.onStop) {                                                                                          // 602
        existing.stopCallback = callbacks.onStop;                                                                      // 603
      }                                                                                                                // 604
    } else {                                                                                                           // 605
      // New sub! Generate an id, save it locally, and send message.                                                   // 606
      id = Random.id();                                                                                                // 607
      self._subscriptions[id] = {                                                                                      // 608
        id: id,                                                                                                        // 609
        name: name,                                                                                                    // 610
        params: EJSON.clone(params),                                                                                   // 611
        inactive: false,                                                                                               // 612
        ready: false,                                                                                                  // 613
        readyDeps: new Tracker.Dependency(),                                                                           // 614
        readyCallback: callbacks.onReady,                                                                              // 615
        // XXX COMPAT WITH 1.0.3.1 #errorCallback                                                                      // 616
        errorCallback: callbacks.onError,                                                                              // 617
        stopCallback: callbacks.onStop,                                                                                // 618
        connection: self,                                                                                              // 619
        remove: function () {                                                                                          // 620
          delete this.connection._subscriptions[this.id];                                                              // 621
          this.ready && this.readyDeps.changed();                                                                      // 622
        },                                                                                                             // 623
        stop: function () {                                                                                            // 624
          this.connection._send({                                                                                      // 625
            msg: 'unsub',                                                                                              // 625
            id: id                                                                                                     // 625
          });                                                                                                          // 625
                                                                                                                       //
          this.remove();                                                                                               // 626
                                                                                                                       //
          if (callbacks.onStop) {                                                                                      // 628
            callbacks.onStop();                                                                                        // 629
          }                                                                                                            // 630
        }                                                                                                              // 631
      };                                                                                                               // 608
                                                                                                                       //
      self._send({                                                                                                     // 633
        msg: 'sub',                                                                                                    // 633
        id: id,                                                                                                        // 633
        name: name,                                                                                                    // 633
        params: params                                                                                                 // 633
      });                                                                                                              // 633
    } // return a handle to the application.                                                                           // 634
                                                                                                                       //
                                                                                                                       //
    var handle = {                                                                                                     // 637
      stop: function () {                                                                                              // 638
        if (!_.has(self._subscriptions, id)) return;                                                                   // 639
                                                                                                                       //
        self._subscriptions[id].stop();                                                                                // 642
      },                                                                                                               // 643
      ready: function () {                                                                                             // 644
        // return false if we've unsubscribed.                                                                         // 645
        if (!_.has(self._subscriptions, id)) return false;                                                             // 646
        var record = self._subscriptions[id];                                                                          // 648
        record.readyDeps.depend();                                                                                     // 649
        return record.ready;                                                                                           // 650
      },                                                                                                               // 651
      subscriptionId: id                                                                                               // 652
    };                                                                                                                 // 637
                                                                                                                       //
    if (Tracker.active) {                                                                                              // 655
      // We're in a reactive computation, so we'd like to unsubscribe when the                                         // 656
      // computation is invalidated... but not if the rerun just re-subscribes                                         // 657
      // to the same subscription!  When a rerun happens, we use onInvalidate                                          // 658
      // as a change to mark the subscription "inactive" so that it can                                                // 659
      // be reused from the rerun.  If it isn't reused, it's killed from                                               // 660
      // an afterFlush.                                                                                                // 661
      Tracker.onInvalidate(function (c) {                                                                              // 662
        if (_.has(self._subscriptions, id)) self._subscriptions[id].inactive = true;                                   // 663
        Tracker.afterFlush(function () {                                                                               // 666
          if (_.has(self._subscriptions, id) && self._subscriptions[id].inactive) handle.stop();                       // 667
        });                                                                                                            // 670
      });                                                                                                              // 671
    }                                                                                                                  // 672
                                                                                                                       //
    return handle;                                                                                                     // 674
  },                                                                                                                   // 675
  // options:                                                                                                          // 677
  // - onLateError {Function(error)} called if an error was received after the ready event.                            // 678
  //     (errors received before ready cause an error to be thrown)                                                    // 679
  _subscribeAndWait: function (name, args, options) {                                                                  // 680
    var self = this;                                                                                                   // 681
    var f = new Future();                                                                                              // 682
    var ready = false;                                                                                                 // 683
    var handle;                                                                                                        // 684
    args = args || [];                                                                                                 // 685
    args.push({                                                                                                        // 686
      onReady: function () {                                                                                           // 687
        ready = true;                                                                                                  // 688
        f['return']();                                                                                                 // 689
      },                                                                                                               // 690
      onError: function (e) {                                                                                          // 691
        if (!ready) f['throw'](e);else options && options.onLateError && options.onLateError(e);                       // 692
      }                                                                                                                // 696
    });                                                                                                                // 686
    handle = self.subscribe.apply(self, [name].concat(args));                                                          // 699
    f.wait();                                                                                                          // 700
    return handle;                                                                                                     // 701
  },                                                                                                                   // 702
  methods: function (methods) {                                                                                        // 704
    var self = this;                                                                                                   // 705
                                                                                                                       //
    _.each(methods, function (func, name) {                                                                            // 706
      if (typeof func !== 'function') throw new Error("Method '" + name + "' must be a function");                     // 707
      if (self._methodHandlers[name]) throw new Error("A method named '" + name + "' is already defined");             // 709
      self._methodHandlers[name] = func;                                                                               // 711
    });                                                                                                                // 712
  },                                                                                                                   // 713
  /**                                                                                                                  // 715
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   * @summary Invokes a method passing any number of arguments.                                                        //
   * @locus Anywhere                                                                                                   //
   * @param {String} name Name of method to invoke                                                                     //
   * @param {EJSONable} [arg1,arg2...] Optional method arguments                                                       //
   * @param {Function} [asyncCallback] Optional callback, which is called asynchronously with the error or result after the method is complete. If not provided, the method runs synchronously if possible (see below).
   */call: function (name /* .. [arguments] .. callback */) {                                                          //
    // if it's a function, the last argument is the result callback,                                                   // 725
    // not a parameter to the remote method.                                                                           // 726
    var args = Array.prototype.slice.call(arguments, 1);                                                               // 727
    if (args.length && typeof args[args.length - 1] === "function") var callback = args.pop();                         // 728
    return this.apply(name, args, callback);                                                                           // 730
  },                                                                                                                   // 731
  // @param options {Optional Object}                                                                                  // 733
  //   wait: Boolean - Should we wait to call this until all current methods                                           // 734
  //                   are fully finished, and block subsequent method calls                                           // 735
  //                   until this method is fully finished?                                                            // 736
  //                   (does not affect methods called from within this method)                                        // 737
  //   onResultReceived: Function - a callback to call as soon as the method                                           // 738
  //                                result is received. the data written by                                            // 739
  //                                the method may not yet be in the cache!                                            // 740
  //   returnStubValue: Boolean - If true then in cases where we would have                                            // 741
  //                              otherwise discarded the stub's return value                                          // 742
  //                              and returned undefined, instead we go ahead                                          // 743
  //                              and return it.  Specifically, this is any                                            // 744
  //                              time other than when (a) we are already                                              // 745
  //                              inside a stub or (b) we are in Node and no                                           // 746
  //                              callback was provided.  Currently we require                                         // 747
  //                              this flag to be explicitly passed to reduce                                          // 748
  //                              the likelihood that stub return values will                                          // 749
  //                              be confused with server return values; we                                            // 750
  //                              may improve this in future.                                                          // 751
  // @param callback {Optional Function}                                                                               // 752
  /**                                                                                                                  // 754
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   * @summary Invoke a method passing an array of arguments.                                                           //
   * @locus Anywhere                                                                                                   //
   * @param {String} name Name of method to invoke                                                                     //
   * @param {EJSONable[]} args Method arguments                                                                        //
   * @param {Object} [options]                                                                                         //
   * @param {Boolean} options.wait (Client only) If true, don't send this method until all previous method calls have completed, and don't send any subsequent method calls until this one is completed.
   * @param {Function} options.onResultReceived (Client only) This callback is invoked with the error or result of the method (just like `asyncCallback`) as soon as the error or result is available. The local cache may not yet reflect the writes performed by the method.
   * @param {Boolean} options.noRetry (Client only) if true, don't send this method again on reload, simply call the callback an error with the error code 'invocation-failed'.
   * @param {Boolean} options.throwStubExceptions (Client only) If true, exceptions thrown by method stubs will be thrown instead of logged, and the method will not be invoked on the server.
   * @param {Function} [asyncCallback] Optional callback; same semantics as in [`Meteor.call`](#meteor_call).          //
   */apply: function (name, args, options, callback) {                                                                 //
    var self = this; // We were passed 3 arguments. They may be either (name, args, options)                           // 769
    // or (name, args, callback)                                                                                       // 772
                                                                                                                       //
    if (!callback && typeof options === 'function') {                                                                  // 773
      callback = options;                                                                                              // 774
      options = {};                                                                                                    // 775
    }                                                                                                                  // 776
                                                                                                                       //
    options = options || {};                                                                                           // 777
                                                                                                                       //
    if (callback) {                                                                                                    // 779
      // XXX would it be better form to do the binding in stream.on,                                                   // 780
      // or caller, instead of here?                                                                                   // 781
      // XXX improve error message (and how we report it)                                                              // 782
      callback = Meteor.bindEnvironment(callback, "delivering result of invoking '" + name + "'");                     // 783
    } // Keep our args safe from mutation (eg if we don't send the message for a                                       // 787
    // while because of a wait method).                                                                                // 790
                                                                                                                       //
                                                                                                                       //
    args = EJSON.clone(args); // Lazily allocate method ID once we know that it'll be needed.                          // 791
                                                                                                                       //
    var methodId = function () {                                                                                       // 794
      var id;                                                                                                          // 795
      return function () {                                                                                             // 796
        if (id === undefined) id = '' + self._nextMethodId++;                                                          // 797
        return id;                                                                                                     // 799
      };                                                                                                               // 800
    }();                                                                                                               // 801
                                                                                                                       //
    var enclosing = DDP._CurrentMethodInvocation.get();                                                                // 803
                                                                                                                       //
    var alreadyInSimulation = enclosing && enclosing.isSimulation; // Lazily generate a randomSeed, only if it is requested by the stub.
    // The random streams only have utility if they're used on both the client                                         // 807
    // and the server; if the client doesn't generate any 'random' values                                              // 808
    // then we don't expect the server to generate any either.                                                         // 809
    // Less commonly, the server may perform different actions from the client,                                        // 810
    // and may in fact generate values where the client did not, but we don't                                          // 811
    // have any client-side values to match, so even here we may as well just                                          // 812
    // use a random seed on the server.  In that case, we don't pass the                                               // 813
    // randomSeed to save bandwidth, and we don't even generate it to save a                                           // 814
    // bit of CPU and to avoid consuming entropy.                                                                      // 815
                                                                                                                       //
    var randomSeed = null;                                                                                             // 816
                                                                                                                       //
    var randomSeedGenerator = function () {                                                                            // 817
      if (randomSeed === null) {                                                                                       // 818
        randomSeed = DDPCommon.makeRpcSeed(enclosing, name);                                                           // 819
      }                                                                                                                // 820
                                                                                                                       //
      return randomSeed;                                                                                               // 821
    }; // Run the stub, if we have one. The stub is supposed to make some                                              // 822
    // temporary writes to the database to give the user a smooth experience                                           // 825
    // until the actual result of executing the method comes back from the                                             // 826
    // server (whereupon the temporary writes to the database will be reversed                                         // 827
    // during the beginUpdate/endUpdate process.)                                                                      // 828
    //                                                                                                                 // 829
    // Normally, we ignore the return value of the stub (even if it is an                                              // 830
    // exception), in favor of the real return value from the server. The                                              // 831
    // exception is if the *caller* is a stub. In that case, we're not going                                           // 832
    // to do a RPC, so we use the return value of the stub as our return                                               // 833
    // value.                                                                                                          // 834
                                                                                                                       //
                                                                                                                       //
    var stub = self._methodHandlers[name];                                                                             // 836
                                                                                                                       //
    if (stub) {                                                                                                        // 837
      var setUserId = function (userId) {                                                                              // 838
        self.setUserId(userId);                                                                                        // 839
      };                                                                                                               // 840
                                                                                                                       //
      var invocation = new DDPCommon.MethodInvocation({                                                                // 842
        isSimulation: true,                                                                                            // 843
        userId: self.userId(),                                                                                         // 844
        setUserId: setUserId,                                                                                          // 845
        randomSeed: function () {                                                                                      // 846
          return randomSeedGenerator();                                                                                // 846
        }                                                                                                              // 846
      });                                                                                                              // 842
      if (!alreadyInSimulation) self._saveOriginals();                                                                 // 849
                                                                                                                       //
      try {                                                                                                            // 852
        // Note that unlike in the corresponding server code, we never audit                                           // 853
        // that stubs check() their arguments.                                                                         // 854
        var stubReturnValue = DDP._CurrentMethodInvocation.withValue(invocation, function () {                         // 855
          if (Meteor.isServer) {                                                                                       // 856
            // Because saveOriginals and retrieveOriginals aren't reentrant,                                           // 857
            // don't allow stubs to yield.                                                                             // 858
            return Meteor._noYieldsAllowed(function () {                                                               // 859
              // re-clone, so that the stub can't affect our caller's values                                           // 860
              return stub.apply(invocation, EJSON.clone(args));                                                        // 861
            });                                                                                                        // 862
          } else {                                                                                                     // 863
            return stub.apply(invocation, EJSON.clone(args));                                                          // 864
          }                                                                                                            // 865
        });                                                                                                            // 866
      } catch (e) {                                                                                                    // 867
        var exception = e;                                                                                             // 869
      }                                                                                                                // 870
                                                                                                                       //
      if (!alreadyInSimulation) self._retrieveAndStoreOriginals(methodId());                                           // 872
    } // If we're in a simulation, stop and return the result we have,                                                 // 874
    // rather than going on to do an RPC. If there was no stub,                                                        // 877
    // we'll end up returning undefined.                                                                               // 878
                                                                                                                       //
                                                                                                                       //
    if (alreadyInSimulation) {                                                                                         // 879
      if (callback) {                                                                                                  // 880
        callback(exception, stubReturnValue);                                                                          // 881
        return undefined;                                                                                              // 882
      }                                                                                                                // 883
                                                                                                                       //
      if (exception) throw exception;                                                                                  // 884
      return stubReturnValue;                                                                                          // 886
    } // If an exception occurred in a stub, and we're ignoring it                                                     // 887
    // because we're doing an RPC and want to use what the server                                                      // 890
    // returns instead, log it so the developer knows                                                                  // 891
    // (unless they explicitly ask to see the error).                                                                  // 892
    //                                                                                                                 // 893
    // Tests can set the 'expected' flag on an exception so it won't                                                   // 894
    // go to log.                                                                                                      // 895
                                                                                                                       //
                                                                                                                       //
    if (exception) {                                                                                                   // 896
      if (options.throwStubExceptions) {                                                                               // 897
        throw exception;                                                                                               // 898
      } else if (!exception.expected) {                                                                                // 899
        Meteor._debug("Exception while simulating the effect of invoking '" + name + "'", exception, exception.stack);
      }                                                                                                                // 902
    } // At this point we're definitely doing an RPC, and we're going to                                               // 903
    // return the value of the RPC to the caller.                                                                      // 907
    // If the caller didn't give a callback, decide what to do.                                                        // 909
                                                                                                                       //
                                                                                                                       //
    if (!callback) {                                                                                                   // 910
      if (Meteor.isClient) {                                                                                           // 911
        // On the client, we don't have fibers, so we can't block. The                                                 // 912
        // only thing we can do is to return undefined and discard the                                                 // 913
        // result of the RPC. If an error occurred then print the error                                                // 914
        // to the console.                                                                                             // 915
        callback = function (err) {                                                                                    // 916
          err && Meteor._debug("Error invoking Method '" + name + "':", err.message);                                  // 917
        };                                                                                                             // 919
      } else {                                                                                                         // 920
        // On the server, make the function synchronous. Throw on                                                      // 921
        // errors, return on success.                                                                                  // 922
        var future = new Future();                                                                                     // 923
        callback = future.resolver();                                                                                  // 924
      }                                                                                                                // 925
    } // Send the RPC. Note that on the client, it is important that the                                               // 926
    // stub have finished before we send the RPC, so that we know we have                                              // 928
    // a complete list of which local documents the stub wrote.                                                        // 929
                                                                                                                       //
                                                                                                                       //
    var message = {                                                                                                    // 930
      msg: 'method',                                                                                                   // 931
      method: name,                                                                                                    // 932
      params: args,                                                                                                    // 933
      id: methodId()                                                                                                   // 934
    }; // Send the randomSeed only if we used it                                                                       // 930
                                                                                                                       //
    if (randomSeed !== null) {                                                                                         // 938
      message.randomSeed = randomSeed;                                                                                 // 939
    }                                                                                                                  // 940
                                                                                                                       //
    var methodInvoker = new MethodInvoker({                                                                            // 942
      methodId: methodId(),                                                                                            // 943
      callback: callback,                                                                                              // 944
      connection: self,                                                                                                // 945
      onResultReceived: options.onResultReceived,                                                                      // 946
      wait: !!options.wait,                                                                                            // 947
      message: message,                                                                                                // 948
      noRetry: !!options.noRetry                                                                                       // 949
    });                                                                                                                // 942
                                                                                                                       //
    if (options.wait) {                                                                                                // 952
      // It's a wait method! Wait methods go in their own block.                                                       // 953
      self._outstandingMethodBlocks.push({                                                                             // 954
        wait: true,                                                                                                    // 955
        methods: [methodInvoker]                                                                                       // 955
      });                                                                                                              // 955
    } else {                                                                                                           // 956
      // Not a wait method. Start a new block if the previous block was a wait                                         // 957
      // block, and add it to the last block of methods.                                                               // 958
      if (_.isEmpty(self._outstandingMethodBlocks) || _.last(self._outstandingMethodBlocks).wait) self._outstandingMethodBlocks.push({
        wait: false,                                                                                                   // 961
        methods: []                                                                                                    // 961
      });                                                                                                              // 961
                                                                                                                       //
      _.last(self._outstandingMethodBlocks).methods.push(methodInvoker);                                               // 962
    } // If we added it to the first block, send it out now.                                                           // 963
                                                                                                                       //
                                                                                                                       //
    if (self._outstandingMethodBlocks.length === 1) methodInvoker.sendMessage(); // If we're using the default callback on the server,
    // block waiting for the result.                                                                                   // 970
                                                                                                                       //
    if (future) {                                                                                                      // 971
      return future.wait();                                                                                            // 972
    }                                                                                                                  // 973
                                                                                                                       //
    return options.returnStubValue ? stubReturnValue : undefined;                                                      // 974
  },                                                                                                                   // 975
  // Before calling a method stub, prepare all stores to track changes and allow                                       // 977
  // _retrieveAndStoreOriginals to get the original versions of changed                                                // 978
  // documents.                                                                                                        // 979
  _saveOriginals: function () {                                                                                        // 980
    var self = this;                                                                                                   // 981
    if (!self._waitingForQuiescence()) self._flushBufferedWrites();                                                    // 982
                                                                                                                       //
    _.each(self._stores, function (s) {                                                                                // 984
      s.saveOriginals();                                                                                               // 985
    });                                                                                                                // 986
  },                                                                                                                   // 987
  // Retrieves the original versions of all documents modified by the stub for                                         // 988
  // method 'methodId' from all stores and saves them to _serverDocuments (keyed                                       // 989
  // by document) and _documentsWrittenByStub (keyed by method ID).                                                    // 990
  _retrieveAndStoreOriginals: function (methodId) {                                                                    // 991
    var self = this;                                                                                                   // 992
    if (self._documentsWrittenByStub[methodId]) throw new Error("Duplicate methodId in _retrieveAndStoreOriginals");   // 993
    var docsWritten = [];                                                                                              // 996
                                                                                                                       //
    _.each(self._stores, function (s, collection) {                                                                    // 997
      var originals = s.retrieveOriginals(); // not all stores define retrieveOriginals                                // 998
                                                                                                                       //
      if (!originals) return;                                                                                          // 1000
      originals.forEach(function (doc, id) {                                                                           // 1002
        docsWritten.push({                                                                                             // 1003
          collection: collection,                                                                                      // 1003
          id: id                                                                                                       // 1003
        });                                                                                                            // 1003
        if (!_.has(self._serverDocuments, collection)) self._serverDocuments[collection] = new MongoIDMap();           // 1004
                                                                                                                       //
        var serverDoc = self._serverDocuments[collection].setDefault(id, {});                                          // 1006
                                                                                                                       //
        if (serverDoc.writtenByStubs) {                                                                                // 1007
          // We're not the first stub to write this doc. Just add our method ID                                        // 1008
          // to the record.                                                                                            // 1009
          serverDoc.writtenByStubs[methodId] = true;                                                                   // 1010
        } else {                                                                                                       // 1011
          // First stub! Save the original value and our method ID.                                                    // 1012
          serverDoc.document = doc;                                                                                    // 1013
          serverDoc.flushCallbacks = [];                                                                               // 1014
          serverDoc.writtenByStubs = {};                                                                               // 1015
          serverDoc.writtenByStubs[methodId] = true;                                                                   // 1016
        }                                                                                                              // 1017
      });                                                                                                              // 1018
    });                                                                                                                // 1019
                                                                                                                       //
    if (!_.isEmpty(docsWritten)) {                                                                                     // 1020
      self._documentsWrittenByStub[methodId] = docsWritten;                                                            // 1021
    }                                                                                                                  // 1022
  },                                                                                                                   // 1023
  // This is very much a private function we use to make the tests                                                     // 1025
  // take up fewer server resources after they complete.                                                               // 1026
  _unsubscribeAll: function () {                                                                                       // 1027
    var self = this;                                                                                                   // 1028
                                                                                                                       //
    _.each(_.clone(self._subscriptions), function (sub, id) {                                                          // 1029
      // Avoid killing the autoupdate subscription so that developers                                                  // 1030
      // still get hot code pushes when writing tests.                                                                 // 1031
      //                                                                                                               // 1032
      // XXX it's a hack to encode knowledge about autoupdate here,                                                    // 1033
      // but it doesn't seem worth it yet to have a special API for                                                    // 1034
      // subscriptions to preserve after unit tests.                                                                   // 1035
      if (sub.name !== 'meteor_autoupdate_clientVersions') {                                                           // 1036
        self._subscriptions[id].stop();                                                                                // 1037
      }                                                                                                                // 1038
    });                                                                                                                // 1039
  },                                                                                                                   // 1040
  // Sends the DDP stringification of the given message object                                                         // 1042
  _send: function (obj) {                                                                                              // 1043
    var self = this;                                                                                                   // 1044
                                                                                                                       //
    self._stream.send(DDPCommon.stringifyDDP(obj));                                                                    // 1045
  },                                                                                                                   // 1046
  // We detected via DDP-level heartbeats that we've lost the                                                          // 1048
  // connection.  Unlike `disconnect` or `close`, a lost connection                                                    // 1049
  // will be automatically retried.                                                                                    // 1050
  _lostConnection: function (error) {                                                                                  // 1051
    var self = this;                                                                                                   // 1052
                                                                                                                       //
    self._stream._lostConnection(error);                                                                               // 1053
  },                                                                                                                   // 1054
  /**                                                                                                                  // 1056
   * @summary Get the current connection status. A reactive data source.                                               //
   * @locus Client                                                                                                     //
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   */status: function () /*passthrough args*/{                                                                         //
    var self = this;                                                                                                   // 1063
    return self._stream.status.apply(self._stream, arguments);                                                         // 1064
  },                                                                                                                   // 1065
  /**                                                                                                                  // 1067
   * @summary Force an immediate reconnection attempt if the client is not connected to the server.                    //
   This method does nothing if the client is already connected.                                                        //
   * @locus Client                                                                                                     //
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   */reconnect: function () /*passthrough args*/{                                                                      //
    var self = this;                                                                                                   // 1076
    return self._stream.reconnect.apply(self._stream, arguments);                                                      // 1077
  },                                                                                                                   // 1078
  /**                                                                                                                  // 1080
   * @summary Disconnect the client from the server.                                                                   //
   * @locus Client                                                                                                     //
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   */disconnect: function () /*passthrough args*/{                                                                     //
    var self = this;                                                                                                   // 1087
    return self._stream.disconnect.apply(self._stream, arguments);                                                     // 1088
  },                                                                                                                   // 1089
  close: function () {                                                                                                 // 1091
    var self = this;                                                                                                   // 1092
    return self._stream.disconnect({                                                                                   // 1093
      _permanent: true                                                                                                 // 1093
    });                                                                                                                // 1093
  },                                                                                                                   // 1094
  ///                                                                                                                  // 1096
  /// Reactive user system                                                                                             // 1097
  ///                                                                                                                  // 1098
  userId: function () {                                                                                                // 1099
    var self = this;                                                                                                   // 1100
    if (self._userIdDeps) self._userIdDeps.depend();                                                                   // 1101
    return self._userId;                                                                                               // 1103
  },                                                                                                                   // 1104
  setUserId: function (userId) {                                                                                       // 1106
    var self = this; // Avoid invalidating dependents if setUserId is called with current value.                       // 1107
                                                                                                                       //
    if (self._userId === userId) return;                                                                               // 1109
    self._userId = userId;                                                                                             // 1111
    if (self._userIdDeps) self._userIdDeps.changed();                                                                  // 1112
  },                                                                                                                   // 1114
  // Returns true if we are in a state after reconnect of waiting for subs to be                                       // 1116
  // revived or early methods to finish their data, or we are waiting for a                                            // 1117
  // "wait" method to finish.                                                                                          // 1118
  _waitingForQuiescence: function () {                                                                                 // 1119
    var self = this;                                                                                                   // 1120
    return !_.isEmpty(self._subsBeingRevived) || !_.isEmpty(self._methodsBlockingQuiescence);                          // 1121
  },                                                                                                                   // 1123
  // Returns true if any method whose message has been sent to the server has                                          // 1125
  // not yet invoked its user callback.                                                                                // 1126
  _anyMethodsAreOutstanding: function () {                                                                             // 1127
    var self = this;                                                                                                   // 1128
    return _.any(_.pluck(self._methodInvokers, 'sentMessage'));                                                        // 1129
  },                                                                                                                   // 1130
  _livedata_connected: function (msg) {                                                                                // 1132
    var self = this;                                                                                                   // 1133
                                                                                                                       //
    if (self._version !== 'pre1' && self._heartbeatInterval !== 0) {                                                   // 1135
      self._heartbeat = new DDPCommon.Heartbeat({                                                                      // 1136
        heartbeatInterval: self._heartbeatInterval,                                                                    // 1137
        heartbeatTimeout: self._heartbeatTimeout,                                                                      // 1138
        onTimeout: function () {                                                                                       // 1139
          self._lostConnection(new DDP.ConnectionError("DDP heartbeat timed out"));                                    // 1140
        },                                                                                                             // 1142
        sendPing: function () {                                                                                        // 1143
          self._send({                                                                                                 // 1144
            msg: 'ping'                                                                                                // 1144
          });                                                                                                          // 1144
        }                                                                                                              // 1145
      });                                                                                                              // 1136
                                                                                                                       //
      self._heartbeat.start();                                                                                         // 1147
    } // If this is a reconnect, we'll have to reset all stores.                                                       // 1148
                                                                                                                       //
                                                                                                                       //
    if (self._lastSessionId) self._resetStores = true;                                                                 // 1151
                                                                                                                       //
    if (typeof msg.session === "string") {                                                                             // 1154
      var reconnectedToPreviousSession = self._lastSessionId === msg.session;                                          // 1155
      self._lastSessionId = msg.session;                                                                               // 1156
    }                                                                                                                  // 1157
                                                                                                                       //
    if (reconnectedToPreviousSession) {                                                                                // 1159
      // Successful reconnection -- pick up where we left off.  Note that right                                        // 1160
      // now, this never happens: the server never connects us to a previous                                           // 1161
      // session, because DDP doesn't provide enough data for the server to know                                       // 1162
      // what messages the client has processed. We need to improve DDP to make                                        // 1163
      // this possible, at which point we'll probably need more code here.                                             // 1164
      return;                                                                                                          // 1165
    } // Server doesn't have our data any more. Re-sync a new session.                                                 // 1166
    // Forget about messages we were buffering for unknown collections. They'll                                        // 1170
    // be resent if still relevant.                                                                                    // 1171
                                                                                                                       //
                                                                                                                       //
    self._updatesForUnknownStores = {};                                                                                // 1172
                                                                                                                       //
    if (self._resetStores) {                                                                                           // 1174
      // Forget about the effects of stubs. We'll be resetting all collections                                         // 1175
      // anyway.                                                                                                       // 1176
      self._documentsWrittenByStub = {};                                                                               // 1177
      self._serverDocuments = {};                                                                                      // 1178
    } // Clear _afterUpdateCallbacks.                                                                                  // 1179
                                                                                                                       //
                                                                                                                       //
    self._afterUpdateCallbacks = []; // Mark all named subscriptions which are ready (ie, we already called the        // 1182
    // ready callback) as needing to be revived.                                                                       // 1185
    // XXX We should also block reconnect quiescence until unnamed subscriptions                                       // 1186
    //     (eg, autopublish) are done re-publishing to avoid flicker!                                                  // 1187
                                                                                                                       //
    self._subsBeingRevived = {};                                                                                       // 1188
                                                                                                                       //
    _.each(self._subscriptions, function (sub, id) {                                                                   // 1189
      if (sub.ready) self._subsBeingRevived[id] = true;                                                                // 1190
    }); // Arrange for "half-finished" methods to have their callbacks run, and                                        // 1192
    // track methods that were sent on this connection so that we don't                                                // 1195
    // quiesce until they are all done.                                                                                // 1196
    //                                                                                                                 // 1197
    // Start by clearing _methodsBlockingQuiescence: methods sent before                                               // 1198
    // reconnect don't matter, and any "wait" methods sent on the new connection                                       // 1199
    // that we drop here will be restored by the loop below.                                                           // 1200
                                                                                                                       //
                                                                                                                       //
    self._methodsBlockingQuiescence = {};                                                                              // 1201
                                                                                                                       //
    if (self._resetStores) {                                                                                           // 1202
      _.each(self._methodInvokers, function (invoker) {                                                                // 1203
        if (invoker.gotResult()) {                                                                                     // 1204
          // This method already got its result, but it didn't call its callback                                       // 1205
          // because its data didn't become visible. We did not resend the                                             // 1206
          // method RPC. We'll call its callback when we get a full quiesce,                                           // 1207
          // since that's as close as we'll get to "data must be visible".                                             // 1208
          self._afterUpdateCallbacks.push(_.bind(invoker.dataVisible, invoker));                                       // 1209
        } else if (invoker.sentMessage) {                                                                              // 1210
          // This method has been sent on this connection (maybe as a resend                                           // 1211
          // from the last connection, maybe from onReconnect, maybe just very                                         // 1212
          // quickly before processing the connected message).                                                         // 1213
          //                                                                                                           // 1214
          // We don't need to do anything special to ensure its callbacks get                                          // 1215
          // called, but we'll count it as a method which is preventing                                                // 1216
          // reconnect quiescence. (eg, it might be a login method that was run                                        // 1217
          // from onReconnect, and we don't want to see flicker by seeing a                                            // 1218
          // logged-out state.)                                                                                        // 1219
          self._methodsBlockingQuiescence[invoker.methodId] = true;                                                    // 1220
        }                                                                                                              // 1221
      });                                                                                                              // 1222
    }                                                                                                                  // 1223
                                                                                                                       //
    self._messagesBufferedUntilQuiescence = []; // If we're not waiting on any methods or subs, we can reset the stores and
    // call the callbacks immediately.                                                                                 // 1228
                                                                                                                       //
    if (!self._waitingForQuiescence()) {                                                                               // 1229
      if (self._resetStores) {                                                                                         // 1230
        _.each(self._stores, function (s) {                                                                            // 1231
          s.beginUpdate(0, true);                                                                                      // 1232
          s.endUpdate();                                                                                               // 1233
        });                                                                                                            // 1234
                                                                                                                       //
        self._resetStores = false;                                                                                     // 1235
      }                                                                                                                // 1236
                                                                                                                       //
      self._runAfterUpdateCallbacks();                                                                                 // 1237
    }                                                                                                                  // 1238
  },                                                                                                                   // 1239
  _processOneDataMessage: function (msg, updates) {                                                                    // 1242
    var self = this; // Using underscore here so as not to need to capitalize.                                         // 1243
                                                                                                                       //
    self['_process_' + msg.msg](msg, updates);                                                                         // 1245
  },                                                                                                                   // 1246
  _livedata_data: function (msg) {                                                                                     // 1249
    var self = this;                                                                                                   // 1250
                                                                                                                       //
    if (self._waitingForQuiescence()) {                                                                                // 1252
      self._messagesBufferedUntilQuiescence.push(msg);                                                                 // 1253
                                                                                                                       //
      if (msg.msg === "nosub") delete self._subsBeingRevived[msg.id];                                                  // 1255
                                                                                                                       //
      _.each(msg.subs || [], function (subId) {                                                                        // 1258
        delete self._subsBeingRevived[subId];                                                                          // 1259
      });                                                                                                              // 1260
                                                                                                                       //
      _.each(msg.methods || [], function (methodId) {                                                                  // 1261
        delete self._methodsBlockingQuiescence[methodId];                                                              // 1262
      });                                                                                                              // 1263
                                                                                                                       //
      if (self._waitingForQuiescence()) return; // No methods or subs are blocking quiescence!                         // 1265
      // We'll now process and all of our buffered messages, reset all stores,                                         // 1269
      // and apply them all at once.                                                                                   // 1270
                                                                                                                       //
      _.each(self._messagesBufferedUntilQuiescence, function (bufferedMsg) {                                           // 1271
        self._processOneDataMessage(bufferedMsg, self._bufferedWrites);                                                // 1272
      });                                                                                                              // 1273
                                                                                                                       //
      self._messagesBufferedUntilQuiescence = [];                                                                      // 1274
    } else {                                                                                                           // 1275
      self._processOneDataMessage(msg, self._bufferedWrites);                                                          // 1276
    } // Immediately flush writes when:                                                                                // 1277
    //  1. Buffering is disabled. Or;                                                                                  // 1280
    //  2. any non-(added/changed/removed) message arrives.                                                            // 1281
                                                                                                                       //
                                                                                                                       //
    var standardWrite = _.include(['added', 'changed', 'removed'], msg.msg);                                           // 1282
                                                                                                                       //
    if (self._bufferedWritesInterval === 0 || !standardWrite) {                                                        // 1283
      self._flushBufferedWrites();                                                                                     // 1284
                                                                                                                       //
      return;                                                                                                          // 1285
    }                                                                                                                  // 1286
                                                                                                                       //
    if (self._bufferedWritesFlushAt === null) {                                                                        // 1288
      self._bufferedWritesFlushAt = new Date().valueOf() + self._bufferedWritesMaxAge;                                 // 1289
    } else if (self._bufferedWritesFlushAt < new Date().valueOf()) {                                                   // 1290
      self._flushBufferedWrites();                                                                                     // 1292
                                                                                                                       //
      return;                                                                                                          // 1293
    }                                                                                                                  // 1294
                                                                                                                       //
    if (self._bufferedWritesFlushHandle) {                                                                             // 1296
      clearTimeout(self._bufferedWritesFlushHandle);                                                                   // 1297
    }                                                                                                                  // 1298
                                                                                                                       //
    self._bufferedWritesFlushHandle = setTimeout(self.__flushBufferedWrites, self._bufferedWritesInterval);            // 1299
  },                                                                                                                   // 1301
  _flushBufferedWrites: function () {                                                                                  // 1303
    var self = this;                                                                                                   // 1304
                                                                                                                       //
    if (self._bufferedWritesFlushHandle) {                                                                             // 1305
      clearTimeout(self._bufferedWritesFlushHandle);                                                                   // 1306
      self._bufferedWritesFlushHandle = null;                                                                          // 1307
    }                                                                                                                  // 1308
                                                                                                                       //
    self._bufferedWritesFlushAt = null; // We need to clear the buffer before passing it to                            // 1310
    //  performWrites. As there's no guarantee that it                                                                 // 1312
    //  will exit cleanly.                                                                                             // 1313
                                                                                                                       //
    var writes = self._bufferedWrites;                                                                                 // 1314
    self._bufferedWrites = {};                                                                                         // 1315
                                                                                                                       //
    self._performWrites(writes);                                                                                       // 1316
  },                                                                                                                   // 1317
  _performWrites: function (updates) {                                                                                 // 1319
    var self = this;                                                                                                   // 1320
                                                                                                                       //
    if (self._resetStores || !_.isEmpty(updates)) {                                                                    // 1322
      // Begin a transactional update of each store.                                                                   // 1323
      _.each(self._stores, function (s, storeName) {                                                                   // 1324
        s.beginUpdate(_.has(updates, storeName) ? updates[storeName].length : 0, self._resetStores);                   // 1325
      });                                                                                                              // 1327
                                                                                                                       //
      self._resetStores = false;                                                                                       // 1328
                                                                                                                       //
      _.each(updates, function (updateMessages, storeName) {                                                           // 1330
        var store = self._stores[storeName];                                                                           // 1331
                                                                                                                       //
        if (store) {                                                                                                   // 1332
          _.each(updateMessages, function (updateMessage) {                                                            // 1333
            store.update(updateMessage);                                                                               // 1334
          });                                                                                                          // 1335
        } else {                                                                                                       // 1336
          // Nobody's listening for this data. Queue it up until                                                       // 1337
          // someone wants it.                                                                                         // 1338
          // XXX memory use will grow without bound if you forget to                                                   // 1339
          // create a collection or just don't care about it... going                                                  // 1340
          // to have to do something about that.                                                                       // 1341
          if (!_.has(self._updatesForUnknownStores, storeName)) self._updatesForUnknownStores[storeName] = [];         // 1342
          Array.prototype.push.apply(self._updatesForUnknownStores[storeName], updateMessages);                        // 1344
        }                                                                                                              // 1346
      }); // End update transaction.                                                                                   // 1347
                                                                                                                       //
                                                                                                                       //
      _.each(self._stores, function (s) {                                                                              // 1350
        s.endUpdate();                                                                                                 // 1350
      });                                                                                                              // 1350
    }                                                                                                                  // 1351
                                                                                                                       //
    self._runAfterUpdateCallbacks();                                                                                   // 1353
  },                                                                                                                   // 1354
  // Call any callbacks deferred with _runWhenAllServerDocsAreFlushed whose                                            // 1356
  // relevant docs have been flushed, as well as dataVisible callbacks at                                              // 1357
  // reconnect-quiescence time.                                                                                        // 1358
  _runAfterUpdateCallbacks: function () {                                                                              // 1359
    var self = this;                                                                                                   // 1360
    var callbacks = self._afterUpdateCallbacks;                                                                        // 1361
    self._afterUpdateCallbacks = [];                                                                                   // 1362
                                                                                                                       //
    _.each(callbacks, function (c) {                                                                                   // 1363
      c();                                                                                                             // 1364
    });                                                                                                                // 1365
  },                                                                                                                   // 1366
  _pushUpdate: function (updates, collection, msg) {                                                                   // 1368
    var self = this;                                                                                                   // 1369
                                                                                                                       //
    if (!_.has(updates, collection)) {                                                                                 // 1370
      updates[collection] = [];                                                                                        // 1371
    }                                                                                                                  // 1372
                                                                                                                       //
    updates[collection].push(msg);                                                                                     // 1373
  },                                                                                                                   // 1374
  _getServerDoc: function (collection, id) {                                                                           // 1376
    var self = this;                                                                                                   // 1377
    if (!_.has(self._serverDocuments, collection)) return null;                                                        // 1378
    var serverDocsForCollection = self._serverDocuments[collection];                                                   // 1380
    return serverDocsForCollection.get(id) || null;                                                                    // 1381
  },                                                                                                                   // 1382
  _process_added: function (msg, updates) {                                                                            // 1384
    var self = this;                                                                                                   // 1385
    var id = MongoID.idParse(msg.id);                                                                                  // 1386
                                                                                                                       //
    var serverDoc = self._getServerDoc(msg.collection, id);                                                            // 1387
                                                                                                                       //
    if (serverDoc) {                                                                                                   // 1388
      // Some outstanding stub wrote here.                                                                             // 1389
      var isExisting = serverDoc.document !== undefined;                                                               // 1390
      serverDoc.document = msg.fields || {};                                                                           // 1392
      serverDoc.document._id = id;                                                                                     // 1393
                                                                                                                       //
      if (self._resetStores) {                                                                                         // 1395
        // During reconnect the server is sending adds for existing ids.                                               // 1396
        // Always push an update so that document stays in the store after                                             // 1397
        // reset. Use current version of the document for this update, so                                              // 1398
        // that stub-written values are preserved.                                                                     // 1399
        var currentDoc = self._stores[msg.collection].getDoc(msg.id);                                                  // 1400
                                                                                                                       //
        if (currentDoc !== undefined) msg.fields = currentDoc;                                                         // 1401
                                                                                                                       //
        self._pushUpdate(updates, msg.collection, msg);                                                                // 1404
      } else if (isExisting) {                                                                                         // 1405
        throw new Error("Server sent add for existing id: " + msg.id);                                                 // 1406
      }                                                                                                                // 1407
    } else {                                                                                                           // 1408
      self._pushUpdate(updates, msg.collection, msg);                                                                  // 1409
    }                                                                                                                  // 1410
  },                                                                                                                   // 1411
  _process_changed: function (msg, updates) {                                                                          // 1413
    var self = this;                                                                                                   // 1414
                                                                                                                       //
    var serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));                                       // 1415
                                                                                                                       //
    if (serverDoc) {                                                                                                   // 1417
      if (serverDoc.document === undefined) throw new Error("Server sent changed for nonexisting id: " + msg.id);      // 1418
      DiffSequence.applyChanges(serverDoc.document, msg.fields);                                                       // 1420
    } else {                                                                                                           // 1421
      self._pushUpdate(updates, msg.collection, msg);                                                                  // 1422
    }                                                                                                                  // 1423
  },                                                                                                                   // 1424
  _process_removed: function (msg, updates) {                                                                          // 1426
    var self = this;                                                                                                   // 1427
                                                                                                                       //
    var serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));                                       // 1428
                                                                                                                       //
    if (serverDoc) {                                                                                                   // 1430
      // Some outstanding stub wrote here.                                                                             // 1431
      if (serverDoc.document === undefined) throw new Error("Server sent removed for nonexisting id:" + msg.id);       // 1432
      serverDoc.document = undefined;                                                                                  // 1434
    } else {                                                                                                           // 1435
      self._pushUpdate(updates, msg.collection, {                                                                      // 1436
        msg: 'removed',                                                                                                // 1437
        collection: msg.collection,                                                                                    // 1438
        id: msg.id                                                                                                     // 1439
      });                                                                                                              // 1436
    }                                                                                                                  // 1441
  },                                                                                                                   // 1442
  _process_updated: function (msg, updates) {                                                                          // 1444
    var self = this; // Process "method done" messages.                                                                // 1445
                                                                                                                       //
    _.each(msg.methods, function (methodId) {                                                                          // 1447
      _.each(self._documentsWrittenByStub[methodId], function (written) {                                              // 1448
        var serverDoc = self._getServerDoc(written.collection, written.id);                                            // 1449
                                                                                                                       //
        if (!serverDoc) throw new Error("Lost serverDoc for " + JSON.stringify(written));                              // 1450
        if (!serverDoc.writtenByStubs[methodId]) throw new Error("Doc " + JSON.stringify(written) + " not written by  method " + methodId);
        delete serverDoc.writtenByStubs[methodId];                                                                     // 1455
                                                                                                                       //
        if (_.isEmpty(serverDoc.writtenByStubs)) {                                                                     // 1456
          // All methods whose stubs wrote this method have completed! We can                                          // 1457
          // now copy the saved document to the database (reverting the stub's                                         // 1458
          // change if the server did not write to this object, or applying the                                        // 1459
          // server's writes if it did).                                                                               // 1460
          // This is a fake ddp 'replace' message.  It's just for talking                                              // 1462
          // between livedata connections and minimongo.  (We have to stringify                                        // 1463
          // the ID because it's supposed to look like a wire message.)                                                // 1464
          self._pushUpdate(updates, written.collection, {                                                              // 1465
            msg: 'replace',                                                                                            // 1466
            id: MongoID.idStringify(written.id),                                                                       // 1467
            replace: serverDoc.document                                                                                // 1468
          }); // Call all flush callbacks.                                                                             // 1465
                                                                                                                       //
                                                                                                                       //
          _.each(serverDoc.flushCallbacks, function (c) {                                                              // 1471
            c();                                                                                                       // 1472
          }); // Delete this completed serverDocument. Don't bother to GC empty                                        // 1473
          // IdMaps inside self._serverDocuments, since there probably aren't                                          // 1476
          // many collections and they'll be written repeatedly.                                                       // 1477
                                                                                                                       //
                                                                                                                       //
          self._serverDocuments[written.collection].remove(written.id);                                                // 1478
        }                                                                                                              // 1479
      });                                                                                                              // 1480
                                                                                                                       //
      delete self._documentsWrittenByStub[methodId]; // We want to call the data-written callback, but we can't do so until all
      // currently buffered messages are flushed.                                                                      // 1484
                                                                                                                       //
      var callbackInvoker = self._methodInvokers[methodId];                                                            // 1485
      if (!callbackInvoker) throw new Error("No callback invoker for method " + methodId);                             // 1486
                                                                                                                       //
      self._runWhenAllServerDocsAreFlushed(_.bind(callbackInvoker.dataVisible, callbackInvoker));                      // 1488
    });                                                                                                                // 1490
  },                                                                                                                   // 1491
  _process_ready: function (msg, updates) {                                                                            // 1493
    var self = this; // Process "sub ready" messages. "sub ready" messages don't take effect                           // 1494
    // until all current server documents have been flushed to the local                                               // 1496
    // database. We can use a write fence to implement this.                                                           // 1497
                                                                                                                       //
    _.each(msg.subs, function (subId) {                                                                                // 1498
      self._runWhenAllServerDocsAreFlushed(function () {                                                               // 1499
        var subRecord = self._subscriptions[subId]; // Did we already unsubscribe?                                     // 1500
                                                                                                                       //
        if (!subRecord) return; // Did we already receive a ready message? (Oops!)                                     // 1502
                                                                                                                       //
        if (subRecord.ready) return;                                                                                   // 1505
        subRecord.ready = true;                                                                                        // 1507
        subRecord.readyCallback && subRecord.readyCallback();                                                          // 1508
        subRecord.readyDeps.changed();                                                                                 // 1509
      });                                                                                                              // 1510
    });                                                                                                                // 1511
  },                                                                                                                   // 1512
  // Ensures that "f" will be called after all documents currently in                                                  // 1514
  // _serverDocuments have been written to the local cache. f will not be called                                       // 1515
  // if the connection is lost before then!                                                                            // 1516
  _runWhenAllServerDocsAreFlushed: function (f) {                                                                      // 1517
    var self = this;                                                                                                   // 1518
                                                                                                                       //
    var runFAfterUpdates = function () {                                                                               // 1519
      self._afterUpdateCallbacks.push(f);                                                                              // 1520
    };                                                                                                                 // 1521
                                                                                                                       //
    var unflushedServerDocCount = 0;                                                                                   // 1522
                                                                                                                       //
    var onServerDocFlush = function () {                                                                               // 1523
      --unflushedServerDocCount;                                                                                       // 1524
                                                                                                                       //
      if (unflushedServerDocCount === 0) {                                                                             // 1525
        // This was the last doc to flush! Arrange to run f after the updates                                          // 1526
        // have been applied.                                                                                          // 1527
        runFAfterUpdates();                                                                                            // 1528
      }                                                                                                                // 1529
    };                                                                                                                 // 1530
                                                                                                                       //
    _.each(self._serverDocuments, function (collectionDocs) {                                                          // 1531
      collectionDocs.forEach(function (serverDoc) {                                                                    // 1532
        var writtenByStubForAMethodWithSentMessage = _.any(serverDoc.writtenByStubs, function (dummy, methodId) {      // 1533
          var invoker = self._methodInvokers[methodId];                                                                // 1535
          return invoker && invoker.sentMessage;                                                                       // 1536
        });                                                                                                            // 1537
                                                                                                                       //
        if (writtenByStubForAMethodWithSentMessage) {                                                                  // 1538
          ++unflushedServerDocCount;                                                                                   // 1539
          serverDoc.flushCallbacks.push(onServerDocFlush);                                                             // 1540
        }                                                                                                              // 1541
      });                                                                                                              // 1542
    });                                                                                                                // 1543
                                                                                                                       //
    if (unflushedServerDocCount === 0) {                                                                               // 1544
      // There aren't any buffered docs --- we can call f as soon as the current                                       // 1545
      // round of updates is applied!                                                                                  // 1546
      runFAfterUpdates();                                                                                              // 1547
    }                                                                                                                  // 1548
  },                                                                                                                   // 1549
  _livedata_nosub: function (msg) {                                                                                    // 1551
    var self = this; // First pass it through _livedata_data, which only uses it to help get                           // 1552
    // towards quiescence.                                                                                             // 1555
                                                                                                                       //
    self._livedata_data(msg); // Do the rest of our processing immediately, with no                                    // 1556
    // buffering-until-quiescence.                                                                                     // 1559
    // we weren't subbed anyway, or we initiated the unsub.                                                            // 1561
                                                                                                                       //
                                                                                                                       //
    if (!_.has(self._subscriptions, msg.id)) return; // XXX COMPAT WITH 1.0.3.1 #errorCallback                         // 1562
                                                                                                                       //
    var errorCallback = self._subscriptions[msg.id].errorCallback;                                                     // 1566
    var stopCallback = self._subscriptions[msg.id].stopCallback;                                                       // 1567
                                                                                                                       //
    self._subscriptions[msg.id].remove();                                                                              // 1569
                                                                                                                       //
    var meteorErrorFromMsg = function (msgArg) {                                                                       // 1571
      return msgArg && msgArg.error && new Meteor.Error(msgArg.error.error, msgArg.error.reason, msgArg.error.details);
    }; // XXX COMPAT WITH 1.0.3.1 #errorCallback                                                                       // 1574
                                                                                                                       //
                                                                                                                       //
    if (errorCallback && msg.error) {                                                                                  // 1577
      errorCallback(meteorErrorFromMsg(msg));                                                                          // 1578
    }                                                                                                                  // 1579
                                                                                                                       //
    if (stopCallback) {                                                                                                // 1581
      stopCallback(meteorErrorFromMsg(msg));                                                                           // 1582
    }                                                                                                                  // 1583
  },                                                                                                                   // 1584
  _process_nosub: function () {// This is called as part of the "buffer until quiescence" process, but                 // 1586
    // nosub's effect is always immediate. It only goes in the buffer at all                                           // 1588
    // because it's possible for a nosub to be the thing that triggers                                                 // 1589
    // quiescence, if we were waiting for a sub to be revived and it dies                                              // 1590
    // instead.                                                                                                        // 1591
  },                                                                                                                   // 1592
  _livedata_result: function (msg) {                                                                                   // 1594
    // id, result or error. error has error (code), reason, details                                                    // 1595
    var self = this; // Lets make sure there are no buffered writes before returning result.                           // 1597
                                                                                                                       //
    if (!_.isEmpty(self._bufferedWrites)) {                                                                            // 1600
      self._flushBufferedWrites();                                                                                     // 1601
    } // find the outstanding request                                                                                  // 1602
    // should be O(1) in nearly all realistic use cases                                                                // 1605
                                                                                                                       //
                                                                                                                       //
    if (_.isEmpty(self._outstandingMethodBlocks)) {                                                                    // 1606
      Meteor._debug("Received method result but no methods outstanding");                                              // 1607
                                                                                                                       //
      return;                                                                                                          // 1608
    }                                                                                                                  // 1609
                                                                                                                       //
    var currentMethodBlock = self._outstandingMethodBlocks[0].methods;                                                 // 1610
    var m;                                                                                                             // 1611
                                                                                                                       //
    for (var i = 0; i < currentMethodBlock.length; i++) {                                                              // 1612
      m = currentMethodBlock[i];                                                                                       // 1613
      if (m.methodId === msg.id) break;                                                                                // 1614
    }                                                                                                                  // 1616
                                                                                                                       //
    if (!m) {                                                                                                          // 1618
      Meteor._debug("Can't match method response to original method call", msg);                                       // 1619
                                                                                                                       //
      return;                                                                                                          // 1620
    } // Remove from current method block. This may leave the block empty, but we                                      // 1621
    // don't move on to the next block until the callback has been delivered, in                                       // 1624
    // _outstandingMethodFinished.                                                                                     // 1625
                                                                                                                       //
                                                                                                                       //
    currentMethodBlock.splice(i, 1);                                                                                   // 1626
                                                                                                                       //
    if (_.has(msg, 'error')) {                                                                                         // 1628
      m.receiveResult(new Meteor.Error(msg.error.error, msg.error.reason, msg.error.details));                         // 1629
    } else {                                                                                                           // 1632
      // msg.result may be undefined if the method didn't return a                                                     // 1633
      // value                                                                                                         // 1634
      m.receiveResult(undefined, msg.result);                                                                          // 1635
    }                                                                                                                  // 1636
  },                                                                                                                   // 1637
  // Called by MethodInvoker after a method's callback is invoked.  If this was                                        // 1639
  // the last outstanding method in the current block, runs the next block. If                                         // 1640
  // there are no more methods, consider accepting a hot code push.                                                    // 1641
  _outstandingMethodFinished: function () {                                                                            // 1642
    var self = this;                                                                                                   // 1643
    if (self._anyMethodsAreOutstanding()) return; // No methods are outstanding. This should mean that the first block of
    // methods is empty. (Or it might not exist, if this was a method that                                             // 1648
    // half-finished before disconnect/reconnect.)                                                                     // 1649
                                                                                                                       //
    if (!_.isEmpty(self._outstandingMethodBlocks)) {                                                                   // 1650
      var firstBlock = self._outstandingMethodBlocks.shift();                                                          // 1651
                                                                                                                       //
      if (!_.isEmpty(firstBlock.methods)) throw new Error("No methods outstanding but nonempty block: " + JSON.stringify(firstBlock)); // Send the outstanding methods now in the first block.
                                                                                                                       //
      if (!_.isEmpty(self._outstandingMethodBlocks)) self._sendOutstandingMethods();                                   // 1657
    } // Maybe accept a hot code push.                                                                                 // 1659
                                                                                                                       //
                                                                                                                       //
    self._maybeMigrate();                                                                                              // 1662
  },                                                                                                                   // 1663
  // Sends messages for all the methods in the first block in                                                          // 1665
  // _outstandingMethodBlocks.                                                                                         // 1666
  _sendOutstandingMethods: function () {                                                                               // 1667
    var self = this;                                                                                                   // 1668
    if (_.isEmpty(self._outstandingMethodBlocks)) return;                                                              // 1669
                                                                                                                       //
    _.each(self._outstandingMethodBlocks[0].methods, function (m) {                                                    // 1671
      m.sendMessage();                                                                                                 // 1672
    });                                                                                                                // 1673
  },                                                                                                                   // 1674
  _livedata_error: function (msg) {                                                                                    // 1676
    Meteor._debug("Received error from server: ", msg.reason);                                                         // 1677
                                                                                                                       //
    if (msg.offendingMessage) Meteor._debug("For: ", msg.offendingMessage);                                            // 1678
  },                                                                                                                   // 1680
  _callOnReconnectAndSendAppropriateOutstandingMethods: function () {                                                  // 1682
    var self = this;                                                                                                   // 1683
    var oldOutstandingMethodBlocks = self._outstandingMethodBlocks;                                                    // 1684
    self._outstandingMethodBlocks = [];                                                                                // 1685
    self.onReconnect && self.onReconnect();                                                                            // 1687
                                                                                                                       //
    DDP._reconnectHook.each(function (callback) {                                                                      // 1688
      callback(self);                                                                                                  // 1689
      return true;                                                                                                     // 1690
    });                                                                                                                // 1691
                                                                                                                       //
    if (_.isEmpty(oldOutstandingMethodBlocks)) return; // We have at least one block worth of old outstanding methods to try
    // again. First: did onReconnect actually send anything? If not, we just                                           // 1697
    // restore all outstanding methods and run the first block.                                                        // 1698
                                                                                                                       //
    if (_.isEmpty(self._outstandingMethodBlocks)) {                                                                    // 1699
      self._outstandingMethodBlocks = oldOutstandingMethodBlocks;                                                      // 1700
                                                                                                                       //
      self._sendOutstandingMethods();                                                                                  // 1701
                                                                                                                       //
      return;                                                                                                          // 1702
    } // OK, there are blocks on both sides. Special case: merge the last block of                                     // 1703
    // the reconnect methods with the first block of the original methods, if                                          // 1706
    // neither of them are "wait" blocks.                                                                              // 1707
                                                                                                                       //
                                                                                                                       //
    if (!_.last(self._outstandingMethodBlocks).wait && !oldOutstandingMethodBlocks[0].wait) {                          // 1708
      _.each(oldOutstandingMethodBlocks[0].methods, function (m) {                                                     // 1710
        _.last(self._outstandingMethodBlocks).methods.push(m); // If this "last block" is also the first block, send the message.
                                                                                                                       //
                                                                                                                       //
        if (self._outstandingMethodBlocks.length === 1) m.sendMessage();                                               // 1714
      });                                                                                                              // 1716
                                                                                                                       //
      oldOutstandingMethodBlocks.shift();                                                                              // 1718
    } // Now add the rest of the original blocks on.                                                                   // 1719
                                                                                                                       //
                                                                                                                       //
    _.each(oldOutstandingMethodBlocks, function (block) {                                                              // 1722
      self._outstandingMethodBlocks.push(block);                                                                       // 1723
    });                                                                                                                // 1724
  },                                                                                                                   // 1725
  // We can accept a hot code push if there are no methods in flight.                                                  // 1727
  _readyToMigrate: function () {                                                                                       // 1728
    var self = this;                                                                                                   // 1729
    return _.isEmpty(self._methodInvokers);                                                                            // 1730
  },                                                                                                                   // 1731
  // If we were blocking a migration, see if it's now possible to continue.                                            // 1733
  // Call whenever the set of outstanding/blocked methods shrinks.                                                     // 1734
  _maybeMigrate: function () {                                                                                         // 1735
    var self = this;                                                                                                   // 1736
                                                                                                                       //
    if (self._retryMigrate && self._readyToMigrate()) {                                                                // 1737
      self._retryMigrate();                                                                                            // 1738
                                                                                                                       //
      self._retryMigrate = null;                                                                                       // 1739
    }                                                                                                                  // 1740
  }                                                                                                                    // 1741
});                                                                                                                    // 478
                                                                                                                       //
LivedataTest.Connection = Connection; // @param url {String} URL to Meteor app,                                        // 1744
//     e.g.:                                                                                                           // 1747
//     "subdomain.meteor.com",                                                                                         // 1748
//     "http://subdomain.meteor.com",                                                                                  // 1749
//     "/",                                                                                                            // 1750
//     "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"                                                                  // 1751
/**                                                                                                                    // 1753
 * @summary Connect to the server of a different Meteor application to subscribe to its document sets and invoke its remote methods.
 * @locus Anywhere                                                                                                     //
 * @param {String} url The URL of another Meteor application.                                                          //
 */                                                                                                                    //
                                                                                                                       //
DDP.connect = function (url, options) {                                                                                // 1758
  var ret = new Connection(url, options);                                                                              // 1759
  allConnections.push(ret); // hack. see below.                                                                        // 1760
                                                                                                                       //
  return ret;                                                                                                          // 1761
};                                                                                                                     // 1762
                                                                                                                       //
DDP._reconnectHook = new Hook({                                                                                        // 1764
  bindEnvironment: false                                                                                               // 1764
}); /**                                                                                                                // 1764
     * @summary Register a function to call as the first step of                                                       //
     * reconnecting. This function can call methods which will be executed before                                      //
     * any other outstanding methods. For example, this can be used to re-establish                                    //
     * the appropriate authentication context on the connection.                                                       //
     * @locus Anywhere                                                                                                 //
     * @param {Function} callback The function to call. It will be called with a                                       //
     * single argument, the [connection object](#ddp_connect) that is reconnecting.                                    //
     */                                                                                                                //
                                                                                                                       //
DDP.onReconnect = function (callback) {                                                                                // 1775
  return DDP._reconnectHook.register(callback);                                                                        // 1776
}; // Hack for `spiderable` package: a way to see if the page is done                                                  // 1777
// loading all the data it needs.                                                                                      // 1780
//                                                                                                                     // 1781
                                                                                                                       //
                                                                                                                       //
allConnections = [];                                                                                                   // 1782
                                                                                                                       //
DDP._allSubscriptionsReady = function () {                                                                             // 1783
  return _.all(allConnections, function (conn) {                                                                       // 1784
    return _.all(conn._subscriptions, function (sub) {                                                                 // 1785
      return sub.ready;                                                                                                // 1786
    });                                                                                                                // 1787
  });                                                                                                                  // 1788
};                                                                                                                     // 1789
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/namespace.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
  DDP: function () {                                                                                                   // 1
    return DDP;                                                                                                        // 1
  },                                                                                                                   // 1
  LivedataTest: function () {                                                                                          // 1
    return LivedataTest;                                                                                               // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var DDP = {};                                                                                                          // 5
var LivedataTest = {};                                                                                                 // 6
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"id_map.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/id_map.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");                          //
                                                                                                                       //
var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);                                 //
                                                                                                                       //
var _inherits2 = require("babel-runtime/helpers/inherits");                                                            //
                                                                                                                       //
var _inherits3 = _interopRequireDefault(_inherits2);                                                                   //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  MongoIDMap: function () {                                                                                            // 1
    return MongoIDMap;                                                                                                 // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
                                                                                                                       //
var MongoIDMap = function (_IdMap) {                                                                                   //
  (0, _inherits3.default)(MongoIDMap, _IdMap);                                                                         //
                                                                                                                       //
  function MongoIDMap() {                                                                                              // 2
    (0, _classCallCheck3.default)(this, MongoIDMap);                                                                   // 2
    return (0, _possibleConstructorReturn3.default)(this, _IdMap.call(this, MongoID.idStringify, MongoID.idParse));    // 2
  }                                                                                                                    // 7
                                                                                                                       //
  return MongoIDMap;                                                                                                   //
}(IdMap);                                                                                                              //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("./node_modules/meteor/ddp-client/stream_client_nodejs.js");
require("./node_modules/meteor/ddp-client/stream_client_common.js");
require("./node_modules/meteor/ddp-client/livedata_common.js");
require("./node_modules/meteor/ddp-client/random_stream.js");
require("./node_modules/meteor/ddp-client/livedata_connection.js");
var exports = require("./node_modules/meteor/ddp-client/namespace.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['ddp-client'] = exports, {
  DDP: DDP
});

})();

//# sourceMappingURL=ddp-client.js.map

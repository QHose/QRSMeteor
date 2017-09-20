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
  var path = Npm.require('path');                                                                                      // 5
                                                                                                                       //
  var Fiber = Npm.require('fibers');                                                                                   // 6
                                                                                                                       //
  var Future = Npm.require(path.join('fibers', 'future'));                                                             // 7
} // @param url {String|Object} URL to Meteor app,                                                                     // 8
//   or an object as a test hook (see code)                                                                            // 11
// Options:                                                                                                            // 12
//   reloadWithOutstanding: is it OK to reload if there are outstanding methods?                                       // 13
//   headers: extra headers to send on the websockets connection, for                                                  // 14
//     server-to-server DDP only                                                                                       // 15
//   _sockjsOptions: Specifies options to pass through to the sockjs client                                            // 16
//   onDDPNegotiationVersionFailure: callback when version negotiation fails.                                          // 17
//                                                                                                                     // 18
// XXX There should be a way to destroy a DDP connection, causing all                                                  // 19
// outstanding method calls to fail.                                                                                   // 20
//                                                                                                                     // 21
// XXX Our current way of handling failure and reconnection is great                                                   // 22
// for an app (where we want to tolerate being disconnected as an                                                      // 23
// expect state, and keep trying forever to reconnect) but cumbersome                                                  // 24
// for something like a command line tool that wants to make a                                                         // 25
// connection, call a method, and print an error if connection                                                         // 26
// fails. We should have better usability in the latter case (while                                                    // 27
// still transparently reconnecting if it's just a transient failure                                                   // 28
// or the server migrating us).                                                                                        // 29
                                                                                                                       //
                                                                                                                       //
var Connection = function (url, options) {                                                                             // 30
  var self = this;                                                                                                     // 31
  options = _.extend({                                                                                                 // 32
    onConnected: function () {},                                                                                       // 33
    onDDPVersionNegotiationFailure: function (description) {                                                           // 34
      Meteor._debug(description);                                                                                      // 35
    },                                                                                                                 // 36
    heartbeatInterval: 17500,                                                                                          // 37
    heartbeatTimeout: 15000,                                                                                           // 38
    npmFayeOptions: {},                                                                                                // 39
    // These options are only for testing.                                                                             // 40
    reloadWithOutstanding: false,                                                                                      // 41
    supportedDDPVersions: DDPCommon.SUPPORTED_DDP_VERSIONS,                                                            // 42
    retry: true,                                                                                                       // 43
    respondToPings: true,                                                                                              // 44
    // When updates are coming within this ms interval, batch them together.                                           // 45
    bufferedWritesInterval: 5,                                                                                         // 46
    // Flush buffers immediately if writes are happening continuously for more than this many ms.                      // 47
    bufferedWritesMaxAge: 500                                                                                          // 48
  }, options); // If set, called when we reconnect, queuing method calls _before_ the                                  // 32
  // existing outstanding ones. This is the only data member that is part of the                                       // 52
  // public API!                                                                                                       // 53
                                                                                                                       //
  self.onReconnect = null; // as a test hook, allow passing a stream instead of a url.                                 // 54
                                                                                                                       //
  if ((typeof url === "undefined" ? "undefined" : (0, _typeof3.default)(url)) === "object") {                          // 57
    self._stream = url;                                                                                                // 58
  } else {                                                                                                             // 59
    self._stream = new LivedataTest.ClientStream(url, {                                                                // 60
      retry: options.retry,                                                                                            // 61
      headers: options.headers,                                                                                        // 62
      _sockjsOptions: options._sockjsOptions,                                                                          // 63
      // Used to keep some tests quiet, or for other cases in which                                                    // 64
      // the right thing to do with connection errors is to silently                                                   // 65
      // fail (e.g. sending package usage stats). At some point we                                                     // 66
      // should have a real API for handling client-stream-level                                                       // 67
      // errors.                                                                                                       // 68
      _dontPrintErrors: options._dontPrintErrors,                                                                      // 69
      connectTimeoutMs: options.connectTimeoutMs,                                                                      // 70
      npmFayeOptions: options.npmFayeOptions                                                                           // 71
    });                                                                                                                // 60
  }                                                                                                                    // 73
                                                                                                                       //
  self._lastSessionId = null;                                                                                          // 75
  self._versionSuggestion = null; // The last proposed DDP version.                                                    // 76
                                                                                                                       //
  self._version = null; // The DDP version agreed on by client and server.                                             // 77
                                                                                                                       //
  self._stores = {}; // name -> object with methods                                                                    // 78
                                                                                                                       //
  self._methodHandlers = {}; // name -> func                                                                           // 79
                                                                                                                       //
  self._nextMethodId = 1;                                                                                              // 80
  self._supportedDDPVersions = options.supportedDDPVersions;                                                           // 81
  self._heartbeatInterval = options.heartbeatInterval;                                                                 // 83
  self._heartbeatTimeout = options.heartbeatTimeout; // Tracks methods which the user has tried to call but which have not yet
  // called their user callback (ie, they are waiting on their result or for all                                       // 87
  // of their writes to be written to the local cache). Map from method ID to                                          // 88
  // MethodInvoker object.                                                                                             // 89
                                                                                                                       //
  self._methodInvokers = {}; // Tracks methods which the user has called but whose result messages have not            // 90
  // arrived yet.                                                                                                      // 93
  //                                                                                                                   // 94
  // _outstandingMethodBlocks is an array of blocks of methods. Each block                                             // 95
  // represents a set of methods that can run at the same time. The first block                                        // 96
  // represents the methods which are currently in flight; subsequent blocks                                           // 97
  // must wait for previous blocks to be fully finished before they can be sent                                        // 98
  // to the server.                                                                                                    // 99
  //                                                                                                                   // 100
  // Each block is an object with the following fields:                                                                // 101
  // - methods: a list of MethodInvoker objects                                                                        // 102
  // - wait: a boolean; if true, this block had a single method invoked with                                           // 103
  //         the "wait" option                                                                                         // 104
  //                                                                                                                   // 105
  // There will never be adjacent blocks with wait=false, because the only thing                                       // 106
  // that makes methods need to be serialized is a wait method.                                                        // 107
  //                                                                                                                   // 108
  // Methods are removed from the first block when their "result" is                                                   // 109
  // received. The entire first block is only removed when all of the in-flight                                        // 110
  // methods have received their results (so the "methods" list is empty) *AND*                                        // 111
  // all of the data written by those methods are visible in the local cache. So                                       // 112
  // it is possible for the first block's methods list to be empty, if we are                                          // 113
  // still waiting for some objects to quiesce.                                                                        // 114
  //                                                                                                                   // 115
  // Example:                                                                                                          // 116
  //  _outstandingMethodBlocks = [                                                                                     // 117
  //    {wait: false, methods: []},                                                                                    // 118
  //    {wait: true, methods: [<MethodInvoker for 'login'>]},                                                          // 119
  //    {wait: false, methods: [<MethodInvoker for 'foo'>,                                                             // 120
  //                            <MethodInvoker for 'bar'>]}]                                                           // 121
  // This means that there were some methods which were sent to the server and                                         // 122
  // which have returned their results, but some of the data written by                                                // 123
  // the methods may not be visible in the local cache. Once all that data is                                          // 124
  // visible, we will send a 'login' method. Once the login method has returned                                        // 125
  // and all the data is visible (including re-running subs if userId changes),                                        // 126
  // we will send the 'foo' and 'bar' methods in parallel.                                                             // 127
                                                                                                                       //
  self._outstandingMethodBlocks = []; // method ID -> array of objects with keys 'collection' and 'id', listing        // 128
  // documents written by a given method's stub. keys are associated with                                              // 131
  // methods whose stub wrote at least one document, and whose data-done message                                       // 132
  // has not yet been received.                                                                                        // 133
                                                                                                                       //
  self._documentsWrittenByStub = {}; // collection -> IdMap of "server document" object. A "server document" has:      // 134
  // - "document": the version of the document according the                                                           // 136
  //   server (ie, the snapshot before a stub wrote it, amended by any changes                                         // 137
  //   received from the server)                                                                                       // 138
  //   It is undefined if we think the document does not exist                                                         // 139
  // - "writtenByStubs": a set of method IDs whose stubs wrote to the document                                         // 140
  //   whose "data done" messages have not yet been processed                                                          // 141
                                                                                                                       //
  self._serverDocuments = {}; // Array of callbacks to be called after the next update of the local                    // 142
  // cache. Used for:                                                                                                  // 145
  //  - Calling methodInvoker.dataVisible and sub ready callbacks after                                                // 146
  //    the relevant data is flushed.                                                                                  // 147
  //  - Invoking the callbacks of "half-finished" methods after reconnect                                              // 148
  //    quiescence. Specifically, methods whose result was received over the old                                       // 149
  //    connection (so we don't re-send it) but whose data had not been made                                           // 150
  //    visible.                                                                                                       // 151
                                                                                                                       //
  self._afterUpdateCallbacks = []; // In two contexts, we buffer all incoming data messages and then process them      // 152
  // all at once in a single update:                                                                                   // 155
  //   - During reconnect, we buffer all data messages until all subs that had                                         // 156
  //     been ready before reconnect are ready again, and all methods that are                                         // 157
  //     active have returned their "data done message"; then                                                          // 158
  //   - During the execution of a "wait" method, we buffer all data messages                                          // 159
  //     until the wait method gets its "data done" message. (If the wait method                                       // 160
  //     occurs during reconnect, it doesn't get any special handling.)                                                // 161
  // all data messages are processed in one update.                                                                    // 162
  //                                                                                                                   // 163
  // The following fields are used for this "quiescence" process.                                                      // 164
  // This buffers the messages that aren't being processed yet.                                                        // 166
                                                                                                                       //
  self._messagesBufferedUntilQuiescence = []; // Map from method ID -> true. Methods are removed from this when their  // 167
  // "data done" message is received, and we will not quiesce until it is                                              // 169
  // empty.                                                                                                            // 170
                                                                                                                       //
  self._methodsBlockingQuiescence = {}; // map from sub ID -> true for subs that were ready (ie, called the sub        // 171
  // ready callback) before reconnect but haven't become ready again yet                                               // 173
                                                                                                                       //
  self._subsBeingRevived = {}; // map from sub._id -> true                                                             // 174
  // if true, the next data update should reset all stores. (set during                                                // 175
  // reconnect.)                                                                                                       // 176
                                                                                                                       //
  self._resetStores = false; // name -> array of updates for (yet to be created) collections                           // 177
                                                                                                                       //
  self._updatesForUnknownStores = {}; // if we're blocking a migration, the retry func                                 // 180
                                                                                                                       //
  self._retryMigrate = null;                                                                                           // 182
  self.__flushBufferedWrites = Meteor.bindEnvironment(self._flushBufferedWrites, "flushing DDP buffered writes", self); // Collection name -> array of messages.
                                                                                                                       //
  self._bufferedWrites = {}; // When current buffer of updates must be flushed at, in ms timestamp.                    // 187
                                                                                                                       //
  self._bufferedWritesFlushAt = null; // Timeout handle for the next processing of all pending writes                  // 189
                                                                                                                       //
  self._bufferedWritesFlushHandle = null;                                                                              // 191
  self._bufferedWritesInterval = options.bufferedWritesInterval;                                                       // 193
  self._bufferedWritesMaxAge = options.bufferedWritesMaxAge; // metadata for subscriptions.  Map from sub ID to object with keys:
  //   - id                                                                                                            // 197
  //   - name                                                                                                          // 198
  //   - params                                                                                                        // 199
  //   - inactive (if true, will be cleaned up if not reused in re-run)                                                // 200
  //   - ready (has the 'ready' message been received?)                                                                // 201
  //   - readyCallback (an optional callback to call when ready)                                                       // 202
  //   - errorCallback (an optional callback to call if the sub terminates with                                        // 203
  //                    an error, XXX COMPAT WITH 1.0.3.1)                                                             // 204
  //   - stopCallback (an optional callback to call when the sub terminates                                            // 205
  //     for any reason, with an error argument if an error triggered the stop)                                        // 206
                                                                                                                       //
  self._subscriptions = {}; // Reactive userId.                                                                        // 207
                                                                                                                       //
  self._userId = null;                                                                                                 // 210
  self._userIdDeps = new Tracker.Dependency(); // Block auto-reload while we're waiting for method responses.          // 211
                                                                                                                       //
  if (Meteor.isClient && Package.reload && !options.reloadWithOutstanding) {                                           // 214
    Package.reload.Reload._onMigrate(function (retry) {                                                                // 215
      if (!self._readyToMigrate()) {                                                                                   // 216
        if (self._retryMigrate) throw new Error("Two migrations in progress?");                                        // 217
        self._retryMigrate = retry;                                                                                    // 219
        return false;                                                                                                  // 220
      } else {                                                                                                         // 221
        return [true];                                                                                                 // 222
      }                                                                                                                // 223
    });                                                                                                                // 224
  }                                                                                                                    // 225
                                                                                                                       //
  var onMessage = function (raw_msg) {                                                                                 // 227
    try {                                                                                                              // 228
      var msg = DDPCommon.parseDDP(raw_msg);                                                                           // 229
    } catch (e) {                                                                                                      // 230
      Meteor._debug("Exception while parsing DDP", e);                                                                 // 231
                                                                                                                       //
      return;                                                                                                          // 232
    } // Any message counts as receiving a pong, as it demonstrates that                                               // 233
    // the server is still alive.                                                                                      // 236
                                                                                                                       //
                                                                                                                       //
    if (self._heartbeat) {                                                                                             // 237
      self._heartbeat.messageReceived();                                                                               // 238
    }                                                                                                                  // 239
                                                                                                                       //
    if (msg === null || !msg.msg) {                                                                                    // 241
      // XXX COMPAT WITH 0.6.6. ignore the old welcome message for back                                                // 242
      // compat.  Remove this 'if' once the server stops sending welcome                                               // 243
      // messages (stream_server.js).                                                                                  // 244
      if (!(msg && msg.server_id)) Meteor._debug("discarding invalid livedata message", msg);                          // 245
      return;                                                                                                          // 247
    }                                                                                                                  // 248
                                                                                                                       //
    if (msg.msg === 'connected') {                                                                                     // 250
      self._version = self._versionSuggestion;                                                                         // 251
                                                                                                                       //
      self._livedata_connected(msg);                                                                                   // 252
                                                                                                                       //
      options.onConnected();                                                                                           // 253
    } else if (msg.msg === 'failed') {                                                                                 // 254
      if (_.contains(self._supportedDDPVersions, msg.version)) {                                                       // 256
        self._versionSuggestion = msg.version;                                                                         // 257
                                                                                                                       //
        self._stream.reconnect({                                                                                       // 258
          _force: true                                                                                                 // 258
        });                                                                                                            // 258
      } else {                                                                                                         // 259
        var description = "DDP version negotiation failed; server requested version " + msg.version;                   // 260
                                                                                                                       //
        self._stream.disconnect({                                                                                      // 262
          _permanent: true,                                                                                            // 262
          _error: description                                                                                          // 262
        });                                                                                                            // 262
                                                                                                                       //
        options.onDDPVersionNegotiationFailure(description);                                                           // 263
      }                                                                                                                // 264
    } else if (msg.msg === 'ping' && options.respondToPings) {                                                         // 265
      self._send({                                                                                                     // 267
        msg: "pong",                                                                                                   // 267
        id: msg.id                                                                                                     // 267
      });                                                                                                              // 267
    } else if (msg.msg === 'pong') {// noop, as we assume everything's a pong                                          // 268
    } else if (_.include(['added', 'changed', 'removed', 'ready', 'updated'], msg.msg)) self._livedata_data(msg);else if (msg.msg === 'nosub') self._livedata_nosub(msg);else if (msg.msg === 'result') self._livedata_result(msg);else if (msg.msg === 'error') self._livedata_error(msg);else Meteor._debug("discarding unknown livedata message type", msg);
  };                                                                                                                   // 282
                                                                                                                       //
  var onReset = function () {                                                                                          // 284
    // Send a connect message at the beginning of the stream.                                                          // 285
    // NOTE: reset is called even on the first connection, so this is                                                  // 286
    // the only place we send this message.                                                                            // 287
    var msg = {                                                                                                        // 288
      msg: 'connect'                                                                                                   // 288
    };                                                                                                                 // 288
    if (self._lastSessionId) msg.session = self._lastSessionId;                                                        // 289
    msg.version = self._versionSuggestion || self._supportedDDPVersions[0];                                            // 291
    self._versionSuggestion = msg.version;                                                                             // 292
    msg.support = self._supportedDDPVersions;                                                                          // 293
                                                                                                                       //
    self._send(msg); // Mark non-retry calls as failed. This has to be done early as getting these methods out of the  // 294
    // current block is pretty important to making sure that quiescence is properly calculated, as                     // 297
    // well as possibly moving on to another useful block.                                                             // 298
    // Only bother testing if there is an outstandingMethodBlock (there might not be, especially if                    // 300
    // we are connecting for the first time.                                                                           // 301
                                                                                                                       //
                                                                                                                       //
    if (self._outstandingMethodBlocks.length > 0) {                                                                    // 302
      // If there is an outstanding method block, we only care about the first one as that is the                      // 303
      // one that could have already sent messages with no response, that are not allowed to retry.                    // 304
      var currentMethodBlock = self._outstandingMethodBlocks[0].methods;                                               // 305
      self._outstandingMethodBlocks[0].methods = currentMethodBlock.filter(function (methodInvoker) {                  // 306
        // Methods with 'noRetry' option set are not allowed to re-send after                                          // 308
        // recovering dropped connection.                                                                              // 309
        if (methodInvoker.sentMessage && methodInvoker.noRetry) {                                                      // 310
          // Make sure that the method is told that it failed.                                                         // 311
          methodInvoker.receiveResult(new Meteor.Error('invocation-failed', 'Method invocation might have failed due to dropped connection. ' + 'Failing because `noRetry` option was passed to Meteor.apply.'));
        } // Only keep a method if it wasn't sent or it's allowed to retry.                                            // 315
        // This may leave the block empty, but we don't move on to the next                                            // 318
        // block until the callback has been delivered, in _outstandingMethodFinished.                                 // 319
                                                                                                                       //
                                                                                                                       //
        return !(methodInvoker.sentMessage && methodInvoker.noRetry);                                                  // 320
      });                                                                                                              // 321
    } // Now, to minimize setup latency, go ahead and blast out all of                                                 // 322
    // our pending methods ands subscriptions before we've even taken                                                  // 325
    // the necessary RTT to know if we successfully reconnected. (1)                                                   // 326
    // They're supposed to be idempotent, and where they are not,                                                      // 327
    // they can block retry in apply; (2) even if we did reconnect,                                                    // 328
    // we're not sure what messages might have gotten lost                                                             // 329
    // (in either direction) since we were disconnected (TCP being                                                     // 330
    // sloppy about that.)                                                                                             // 331
    // If the current block of methods all got their results (but didn't all get                                       // 333
    // their data visible), discard the empty block now.                                                               // 334
                                                                                                                       //
                                                                                                                       //
    if (!_.isEmpty(self._outstandingMethodBlocks) && _.isEmpty(self._outstandingMethodBlocks[0].methods)) {            // 335
      self._outstandingMethodBlocks.shift();                                                                           // 337
    } // Mark all messages as unsent, they have not yet been sent on this                                              // 338
    // connection.                                                                                                     // 341
                                                                                                                       //
                                                                                                                       //
    _.each(self._methodInvokers, function (m) {                                                                        // 342
      m.sentMessage = false;                                                                                           // 343
    }); // If an `onReconnect` handler is set, call it first. Go through                                               // 344
    // some hoops to ensure that methods that are called from within                                                   // 347
    // `onReconnect` get executed _before_ ones that were originally                                                   // 348
    // outstanding (since `onReconnect` is used to re-establish auth                                                   // 349
    // certificates)                                                                                                   // 350
                                                                                                                       //
                                                                                                                       //
    if (self.onReconnect) self._callOnReconnectAndSendAppropriateOutstandingMethods();else self._sendOutstandingMethods(); // add new subscriptions at the end. this way they take effect after
    // the handlers and we don't see flicker.                                                                          // 357
                                                                                                                       //
    _.each(self._subscriptions, function (sub, id) {                                                                   // 358
      self._send({                                                                                                     // 359
        msg: 'sub',                                                                                                    // 360
        id: id,                                                                                                        // 361
        name: sub.name,                                                                                                // 362
        params: sub.params                                                                                             // 363
      });                                                                                                              // 359
    });                                                                                                                // 365
  };                                                                                                                   // 366
                                                                                                                       //
  var onDisconnect = function () {                                                                                     // 368
    if (self._heartbeat) {                                                                                             // 369
      self._heartbeat.stop();                                                                                          // 370
                                                                                                                       //
      self._heartbeat = null;                                                                                          // 371
    }                                                                                                                  // 372
  };                                                                                                                   // 373
                                                                                                                       //
  if (Meteor.isServer) {                                                                                               // 375
    self._stream.on('message', Meteor.bindEnvironment(onMessage, "handling DDP message"));                             // 376
                                                                                                                       //
    self._stream.on('reset', Meteor.bindEnvironment(onReset, "handling DDP reset"));                                   // 377
                                                                                                                       //
    self._stream.on('disconnect', Meteor.bindEnvironment(onDisconnect, "handling DDP disconnect"));                    // 378
  } else {                                                                                                             // 379
    self._stream.on('message', onMessage);                                                                             // 380
                                                                                                                       //
    self._stream.on('reset', onReset);                                                                                 // 381
                                                                                                                       //
    self._stream.on('disconnect', onDisconnect);                                                                       // 382
  }                                                                                                                    // 383
}; // A MethodInvoker manages sending a method to the server and calling the user's                                    // 384
// callbacks. On construction, it registers itself in the connection's                                                 // 387
// _methodInvokers map; it removes itself once the method is fully finished and                                        // 388
// the callback is invoked. This occurs when it has both received a result,                                            // 389
// and the data written by it is fully visible.                                                                        // 390
                                                                                                                       //
                                                                                                                       //
var MethodInvoker = function (options) {                                                                               // 391
  var self = this; // Public (within this file) fields.                                                                // 392
                                                                                                                       //
  self.methodId = options.methodId;                                                                                    // 395
  self.sentMessage = false;                                                                                            // 396
  self._callback = options.callback;                                                                                   // 398
  self._connection = options.connection;                                                                               // 399
  self._message = options.message;                                                                                     // 400
                                                                                                                       //
  self._onResultReceived = options.onResultReceived || function () {};                                                 // 401
                                                                                                                       //
  self._wait = options.wait;                                                                                           // 402
  self.noRetry = options.noRetry;                                                                                      // 403
  self._methodResult = null;                                                                                           // 404
  self._dataVisible = false; // Register with the connection.                                                          // 405
                                                                                                                       //
  self._connection._methodInvokers[self.methodId] = self;                                                              // 408
};                                                                                                                     // 409
                                                                                                                       //
_.extend(MethodInvoker.prototype, {                                                                                    // 410
  // Sends the method message to the server. May be called additional times if                                         // 411
  // we lose the connection and reconnect before receiving a result.                                                   // 412
  sendMessage: function () {                                                                                           // 413
    var self = this; // This function is called before sending a method (including resending on                        // 414
    // reconnect). We should only (re)send methods where we don't already have a                                       // 416
    // result!                                                                                                         // 417
                                                                                                                       //
    if (self.gotResult()) throw new Error("sendingMethod is called on method with result"); // If we're re-sending it, it doesn't matter if data was written the first
    // time.                                                                                                           // 423
                                                                                                                       //
    self._dataVisible = false;                                                                                         // 424
    self.sentMessage = true; // If this is a wait method, make all data messages be buffered until it is               // 425
    // done.                                                                                                           // 428
                                                                                                                       //
    if (self._wait) self._connection._methodsBlockingQuiescence[self.methodId] = true; // Actually send the message.   // 429
                                                                                                                       //
    self._connection._send(self._message);                                                                             // 433
  },                                                                                                                   // 434
  // Invoke the callback, if we have both a result and know that all data has                                          // 435
  // been written to the local cache.                                                                                  // 436
  _maybeInvokeCallback: function () {                                                                                  // 437
    var self = this;                                                                                                   // 438
                                                                                                                       //
    if (self._methodResult && self._dataVisible) {                                                                     // 439
      // Call the callback. (This won't throw: the callback was wrapped with                                           // 440
      // bindEnvironment.)                                                                                             // 441
      self._callback(self._methodResult[0], self._methodResult[1]); // Forget about this method.                       // 442
                                                                                                                       //
                                                                                                                       //
      delete self._connection._methodInvokers[self.methodId]; // Let the connection know that this method is finished, so it can try to
      // move on to the next block of methods.                                                                         // 448
                                                                                                                       //
      self._connection._outstandingMethodFinished();                                                                   // 449
    }                                                                                                                  // 450
  },                                                                                                                   // 451
  // Call with the result of the method from the server. Only may be called                                            // 452
  // once; once it is called, you should not call sendMessage again.                                                   // 453
  // If the user provided an onResultReceived callback, call it immediately.                                           // 454
  // Then invoke the main callback if data is also visible.                                                            // 455
  receiveResult: function (err, result) {                                                                              // 456
    var self = this;                                                                                                   // 457
    if (self.gotResult()) throw new Error("Methods should only receive results once");                                 // 458
    self._methodResult = [err, result];                                                                                // 460
                                                                                                                       //
    self._onResultReceived(err, result);                                                                               // 461
                                                                                                                       //
    self._maybeInvokeCallback();                                                                                       // 462
  },                                                                                                                   // 463
  // Call this when all data written by the method is visible. This means that                                         // 464
  // the method has returns its "data is done" message *AND* all server                                                // 465
  // documents that are buffered at that time have been written to the local                                           // 466
  // cache. Invokes the main callback if the result has been received.                                                 // 467
  dataVisible: function () {                                                                                           // 468
    var self = this;                                                                                                   // 469
    self._dataVisible = true;                                                                                          // 470
                                                                                                                       //
    self._maybeInvokeCallback();                                                                                       // 471
  },                                                                                                                   // 472
  // True if receiveResult has been called.                                                                            // 473
  gotResult: function () {                                                                                             // 474
    var self = this;                                                                                                   // 475
    return !!self._methodResult;                                                                                       // 476
  }                                                                                                                    // 477
});                                                                                                                    // 410
                                                                                                                       //
_.extend(Connection.prototype, {                                                                                       // 480
  // 'name' is the name of the data on the wire that should go in the                                                  // 481
  // store. 'wrappedStore' should be an object with methods beginUpdate, update,                                       // 482
  // endUpdate, saveOriginals, retrieveOriginals. see Collection for an example.                                       // 483
  registerStore: function (name, wrappedStore) {                                                                       // 484
    var self = this;                                                                                                   // 485
    if (name in self._stores) return false; // Wrap the input object in an object which makes any store method not     // 487
    // implemented by 'store' into a no-op.                                                                            // 491
                                                                                                                       //
    var store = {};                                                                                                    // 492
                                                                                                                       //
    _.each(['update', 'beginUpdate', 'endUpdate', 'saveOriginals', 'retrieveOriginals', 'getDoc', '_getCollection'], function (method) {
      store[method] = function () {                                                                                    // 496
        return wrappedStore[method] ? wrappedStore[method].apply(wrappedStore, arguments) : undefined;                 // 497
      };                                                                                                               // 500
    });                                                                                                                // 501
                                                                                                                       //
    self._stores[name] = store;                                                                                        // 503
    var queued = self._updatesForUnknownStores[name];                                                                  // 505
                                                                                                                       //
    if (queued) {                                                                                                      // 506
      store.beginUpdate(queued.length, false);                                                                         // 507
                                                                                                                       //
      _.each(queued, function (msg) {                                                                                  // 508
        store.update(msg);                                                                                             // 509
      });                                                                                                              // 510
                                                                                                                       //
      store.endUpdate();                                                                                               // 511
      delete self._updatesForUnknownStores[name];                                                                      // 512
    }                                                                                                                  // 513
                                                                                                                       //
    return true;                                                                                                       // 515
  },                                                                                                                   // 516
  /**                                                                                                                  // 518
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
    var self = this;                                                                                                   // 534
    var params = Array.prototype.slice.call(arguments, 1);                                                             // 536
    var callbacks = {};                                                                                                // 537
                                                                                                                       //
    if (params.length) {                                                                                               // 538
      var lastParam = params[params.length - 1];                                                                       // 539
                                                                                                                       //
      if (_.isFunction(lastParam)) {                                                                                   // 540
        callbacks.onReady = params.pop();                                                                              // 541
      } else if (lastParam && // XXX COMPAT WITH 1.0.3.1 onError used to exist, but now we use                         // 542
      // onStop with an error callback instead.                                                                        // 544
      _.any([lastParam.onReady, lastParam.onError, lastParam.onStop], _.isFunction)) {                                 // 545
        callbacks = params.pop();                                                                                      // 547
      }                                                                                                                // 548
    } // Is there an existing sub with the same name and param, run in an                                              // 549
    // invalidated Computation? This will happen if we are rerunning an                                                // 552
    // existing computation.                                                                                           // 553
    //                                                                                                                 // 554
    // For example, consider a rerun of:                                                                               // 555
    //                                                                                                                 // 556
    //     Tracker.autorun(function () {                                                                               // 557
    //       Meteor.subscribe("foo", Session.get("foo"));                                                              // 558
    //       Meteor.subscribe("bar", Session.get("bar"));                                                              // 559
    //     });                                                                                                         // 560
    //                                                                                                                 // 561
    // If "foo" has changed but "bar" has not, we will match the "bar"                                                 // 562
    // subcribe to an existing inactive subscription in order to not                                                   // 563
    // unsub and resub the subscription unnecessarily.                                                                 // 564
    //                                                                                                                 // 565
    // We only look for one such sub; if there are N apparently-identical subs                                         // 566
    // being invalidated, we will require N matching subscribe calls to keep                                           // 567
    // them all active.                                                                                                // 568
                                                                                                                       //
                                                                                                                       //
    var existing = _.find(self._subscriptions, function (sub) {                                                        // 569
      return sub.inactive && sub.name === name && EJSON.equals(sub.params, params);                                    // 570
    });                                                                                                                // 572
                                                                                                                       //
    var id;                                                                                                            // 574
                                                                                                                       //
    if (existing) {                                                                                                    // 575
      id = existing.id;                                                                                                // 576
      existing.inactive = false; // reactivate                                                                         // 577
                                                                                                                       //
      if (callbacks.onReady) {                                                                                         // 579
        // If the sub is not already ready, replace any ready callback with the                                        // 580
        // one provided now. (It's not really clear what users would expect for                                        // 581
        // an onReady callback inside an autorun; the semantics we provide is                                          // 582
        // that at the time the sub first becomes ready, we call the last                                              // 583
        // onReady callback provided, if any.)                                                                         // 584
        // If the sub is already ready, run the ready callback right away.                                             // 585
        // It seems that users would expect an onReady callback inside an                                              // 586
        // autorun to trigger once the the sub first becomes ready and also                                            // 587
        // when re-subs happens.                                                                                       // 588
        if (existing.ready) {                                                                                          // 589
          callbacks.onReady();                                                                                         // 590
        } else {                                                                                                       // 591
          existing.readyCallback = callbacks.onReady;                                                                  // 592
        }                                                                                                              // 593
      } // XXX COMPAT WITH 1.0.3.1 we used to have onError but now we call                                             // 594
      // onStop with an optional error argument                                                                        // 597
                                                                                                                       //
                                                                                                                       //
      if (callbacks.onError) {                                                                                         // 598
        // Replace existing callback if any, so that errors aren't                                                     // 599
        // double-reported.                                                                                            // 600
        existing.errorCallback = callbacks.onError;                                                                    // 601
      }                                                                                                                // 602
                                                                                                                       //
      if (callbacks.onStop) {                                                                                          // 604
        existing.stopCallback = callbacks.onStop;                                                                      // 605
      }                                                                                                                // 606
    } else {                                                                                                           // 607
      // New sub! Generate an id, save it locally, and send message.                                                   // 608
      id = Random.id();                                                                                                // 609
      self._subscriptions[id] = {                                                                                      // 610
        id: id,                                                                                                        // 611
        name: name,                                                                                                    // 612
        params: EJSON.clone(params),                                                                                   // 613
        inactive: false,                                                                                               // 614
        ready: false,                                                                                                  // 615
        readyDeps: new Tracker.Dependency(),                                                                           // 616
        readyCallback: callbacks.onReady,                                                                              // 617
        // XXX COMPAT WITH 1.0.3.1 #errorCallback                                                                      // 618
        errorCallback: callbacks.onError,                                                                              // 619
        stopCallback: callbacks.onStop,                                                                                // 620
        connection: self,                                                                                              // 621
        remove: function () {                                                                                          // 622
          delete this.connection._subscriptions[this.id];                                                              // 623
          this.ready && this.readyDeps.changed();                                                                      // 624
        },                                                                                                             // 625
        stop: function () {                                                                                            // 626
          this.connection._send({                                                                                      // 627
            msg: 'unsub',                                                                                              // 627
            id: id                                                                                                     // 627
          });                                                                                                          // 627
                                                                                                                       //
          this.remove();                                                                                               // 628
                                                                                                                       //
          if (callbacks.onStop) {                                                                                      // 630
            callbacks.onStop();                                                                                        // 631
          }                                                                                                            // 632
        }                                                                                                              // 633
      };                                                                                                               // 610
                                                                                                                       //
      self._send({                                                                                                     // 635
        msg: 'sub',                                                                                                    // 635
        id: id,                                                                                                        // 635
        name: name,                                                                                                    // 635
        params: params                                                                                                 // 635
      });                                                                                                              // 635
    } // return a handle to the application.                                                                           // 636
                                                                                                                       //
                                                                                                                       //
    var handle = {                                                                                                     // 639
      stop: function () {                                                                                              // 640
        if (!_.has(self._subscriptions, id)) return;                                                                   // 641
                                                                                                                       //
        self._subscriptions[id].stop();                                                                                // 644
      },                                                                                                               // 645
      ready: function () {                                                                                             // 646
        // return false if we've unsubscribed.                                                                         // 647
        if (!_.has(self._subscriptions, id)) return false;                                                             // 648
        var record = self._subscriptions[id];                                                                          // 650
        record.readyDeps.depend();                                                                                     // 651
        return record.ready;                                                                                           // 652
      },                                                                                                               // 653
      subscriptionId: id                                                                                               // 654
    };                                                                                                                 // 639
                                                                                                                       //
    if (Tracker.active) {                                                                                              // 657
      // We're in a reactive computation, so we'd like to unsubscribe when the                                         // 658
      // computation is invalidated... but not if the rerun just re-subscribes                                         // 659
      // to the same subscription!  When a rerun happens, we use onInvalidate                                          // 660
      // as a change to mark the subscription "inactive" so that it can                                                // 661
      // be reused from the rerun.  If it isn't reused, it's killed from                                               // 662
      // an afterFlush.                                                                                                // 663
      Tracker.onInvalidate(function (c) {                                                                              // 664
        if (_.has(self._subscriptions, id)) self._subscriptions[id].inactive = true;                                   // 665
        Tracker.afterFlush(function () {                                                                               // 668
          if (_.has(self._subscriptions, id) && self._subscriptions[id].inactive) handle.stop();                       // 669
        });                                                                                                            // 672
      });                                                                                                              // 673
    }                                                                                                                  // 674
                                                                                                                       //
    return handle;                                                                                                     // 676
  },                                                                                                                   // 677
  // options:                                                                                                          // 679
  // - onLateError {Function(error)} called if an error was received after the ready event.                            // 680
  //     (errors received before ready cause an error to be thrown)                                                    // 681
  _subscribeAndWait: function (name, args, options) {                                                                  // 682
    var self = this;                                                                                                   // 683
    var f = new Future();                                                                                              // 684
    var ready = false;                                                                                                 // 685
    var handle;                                                                                                        // 686
    args = args || [];                                                                                                 // 687
    args.push({                                                                                                        // 688
      onReady: function () {                                                                                           // 689
        ready = true;                                                                                                  // 690
        f['return']();                                                                                                 // 691
      },                                                                                                               // 692
      onError: function (e) {                                                                                          // 693
        if (!ready) f['throw'](e);else options && options.onLateError && options.onLateError(e);                       // 694
      }                                                                                                                // 698
    });                                                                                                                // 688
    handle = self.subscribe.apply(self, [name].concat(args));                                                          // 701
    f.wait();                                                                                                          // 702
    return handle;                                                                                                     // 703
  },                                                                                                                   // 704
  methods: function (methods) {                                                                                        // 706
    var self = this;                                                                                                   // 707
                                                                                                                       //
    _.each(methods, function (func, name) {                                                                            // 708
      if (typeof func !== 'function') throw new Error("Method '" + name + "' must be a function");                     // 709
      if (self._methodHandlers[name]) throw new Error("A method named '" + name + "' is already defined");             // 711
      self._methodHandlers[name] = func;                                                                               // 713
    });                                                                                                                // 714
  },                                                                                                                   // 715
  /**                                                                                                                  // 717
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   * @summary Invokes a method passing any number of arguments.                                                        //
   * @locus Anywhere                                                                                                   //
   * @param {String} name Name of method to invoke                                                                     //
   * @param {EJSONable} [arg1,arg2...] Optional method arguments                                                       //
   * @param {Function} [asyncCallback] Optional callback, which is called asynchronously with the error or result after the method is complete. If not provided, the method runs synchronously if possible (see below).
   */call: function (name /* .. [arguments] .. callback */) {                                                          //
    // if it's a function, the last argument is the result callback,                                                   // 727
    // not a parameter to the remote method.                                                                           // 728
    var args = Array.prototype.slice.call(arguments, 1);                                                               // 729
    if (args.length && typeof args[args.length - 1] === "function") var callback = args.pop();                         // 730
    return this.apply(name, args, callback);                                                                           // 732
  },                                                                                                                   // 733
  // @param options {Optional Object}                                                                                  // 735
  //   wait: Boolean - Should we wait to call this until all current methods                                           // 736
  //                   are fully finished, and block subsequent method calls                                           // 737
  //                   until this method is fully finished?                                                            // 738
  //                   (does not affect methods called from within this method)                                        // 739
  //   onResultReceived: Function - a callback to call as soon as the method                                           // 740
  //                                result is received. the data written by                                            // 741
  //                                the method may not yet be in the cache!                                            // 742
  //   returnStubValue: Boolean - If true then in cases where we would have                                            // 743
  //                              otherwise discarded the stub's return value                                          // 744
  //                              and returned undefined, instead we go ahead                                          // 745
  //                              and return it.  Specifically, this is any                                            // 746
  //                              time other than when (a) we are already                                              // 747
  //                              inside a stub or (b) we are in Node and no                                           // 748
  //                              callback was provided.  Currently we require                                         // 749
  //                              this flag to be explicitly passed to reduce                                          // 750
  //                              the likelihood that stub return values will                                          // 751
  //                              be confused with server return values; we                                            // 752
  //                              may improve this in future.                                                          // 753
  // @param callback {Optional Function}                                                                               // 754
  /**                                                                                                                  // 756
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
    var self = this; // We were passed 3 arguments. They may be either (name, args, options)                           // 771
    // or (name, args, callback)                                                                                       // 774
                                                                                                                       //
    if (!callback && typeof options === 'function') {                                                                  // 775
      callback = options;                                                                                              // 776
      options = {};                                                                                                    // 777
    }                                                                                                                  // 778
                                                                                                                       //
    options = options || {};                                                                                           // 779
                                                                                                                       //
    if (callback) {                                                                                                    // 781
      // XXX would it be better form to do the binding in stream.on,                                                   // 782
      // or caller, instead of here?                                                                                   // 783
      // XXX improve error message (and how we report it)                                                              // 784
      callback = Meteor.bindEnvironment(callback, "delivering result of invoking '" + name + "'");                     // 785
    } // Keep our args safe from mutation (eg if we don't send the message for a                                       // 789
    // while because of a wait method).                                                                                // 792
                                                                                                                       //
                                                                                                                       //
    args = EJSON.clone(args); // Lazily allocate method ID once we know that it'll be needed.                          // 793
                                                                                                                       //
    var methodId = function () {                                                                                       // 796
      var id;                                                                                                          // 797
      return function () {                                                                                             // 798
        if (id === undefined) id = '' + self._nextMethodId++;                                                          // 799
        return id;                                                                                                     // 801
      };                                                                                                               // 802
    }();                                                                                                               // 803
                                                                                                                       //
    var enclosing = DDP._CurrentMethodInvocation.get();                                                                // 805
                                                                                                                       //
    var alreadyInSimulation = enclosing && enclosing.isSimulation; // Lazily generate a randomSeed, only if it is requested by the stub.
    // The random streams only have utility if they're used on both the client                                         // 809
    // and the server; if the client doesn't generate any 'random' values                                              // 810
    // then we don't expect the server to generate any either.                                                         // 811
    // Less commonly, the server may perform different actions from the client,                                        // 812
    // and may in fact generate values where the client did not, but we don't                                          // 813
    // have any client-side values to match, so even here we may as well just                                          // 814
    // use a random seed on the server.  In that case, we don't pass the                                               // 815
    // randomSeed to save bandwidth, and we don't even generate it to save a                                           // 816
    // bit of CPU and to avoid consuming entropy.                                                                      // 817
                                                                                                                       //
    var randomSeed = null;                                                                                             // 818
                                                                                                                       //
    var randomSeedGenerator = function () {                                                                            // 819
      if (randomSeed === null) {                                                                                       // 820
        randomSeed = DDPCommon.makeRpcSeed(enclosing, name);                                                           // 821
      }                                                                                                                // 822
                                                                                                                       //
      return randomSeed;                                                                                               // 823
    }; // Run the stub, if we have one. The stub is supposed to make some                                              // 824
    // temporary writes to the database to give the user a smooth experience                                           // 827
    // until the actual result of executing the method comes back from the                                             // 828
    // server (whereupon the temporary writes to the database will be reversed                                         // 829
    // during the beginUpdate/endUpdate process.)                                                                      // 830
    //                                                                                                                 // 831
    // Normally, we ignore the return value of the stub (even if it is an                                              // 832
    // exception), in favor of the real return value from the server. The                                              // 833
    // exception is if the *caller* is a stub. In that case, we're not going                                           // 834
    // to do a RPC, so we use the return value of the stub as our return                                               // 835
    // value.                                                                                                          // 836
                                                                                                                       //
                                                                                                                       //
    var stub = self._methodHandlers[name];                                                                             // 838
                                                                                                                       //
    if (stub) {                                                                                                        // 839
      var setUserId = function (userId) {                                                                              // 840
        self.setUserId(userId);                                                                                        // 841
      };                                                                                                               // 842
                                                                                                                       //
      var invocation = new DDPCommon.MethodInvocation({                                                                // 844
        isSimulation: true,                                                                                            // 845
        userId: self.userId(),                                                                                         // 846
        setUserId: setUserId,                                                                                          // 847
        randomSeed: function () {                                                                                      // 848
          return randomSeedGenerator();                                                                                // 848
        }                                                                                                              // 848
      });                                                                                                              // 844
      if (!alreadyInSimulation) self._saveOriginals();                                                                 // 851
                                                                                                                       //
      try {                                                                                                            // 854
        // Note that unlike in the corresponding server code, we never audit                                           // 855
        // that stubs check() their arguments.                                                                         // 856
        var stubReturnValue = DDP._CurrentMethodInvocation.withValue(invocation, function () {                         // 857
          if (Meteor.isServer) {                                                                                       // 858
            // Because saveOriginals and retrieveOriginals aren't reentrant,                                           // 859
            // don't allow stubs to yield.                                                                             // 860
            return Meteor._noYieldsAllowed(function () {                                                               // 861
              // re-clone, so that the stub can't affect our caller's values                                           // 862
              return stub.apply(invocation, EJSON.clone(args));                                                        // 863
            });                                                                                                        // 864
          } else {                                                                                                     // 865
            return stub.apply(invocation, EJSON.clone(args));                                                          // 866
          }                                                                                                            // 867
        });                                                                                                            // 868
      } catch (e) {                                                                                                    // 869
        var exception = e;                                                                                             // 871
      }                                                                                                                // 872
                                                                                                                       //
      if (!alreadyInSimulation) self._retrieveAndStoreOriginals(methodId());                                           // 874
    } // If we're in a simulation, stop and return the result we have,                                                 // 876
    // rather than going on to do an RPC. If there was no stub,                                                        // 879
    // we'll end up returning undefined.                                                                               // 880
                                                                                                                       //
                                                                                                                       //
    if (alreadyInSimulation) {                                                                                         // 881
      if (callback) {                                                                                                  // 882
        callback(exception, stubReturnValue);                                                                          // 883
        return undefined;                                                                                              // 884
      }                                                                                                                // 885
                                                                                                                       //
      if (exception) throw exception;                                                                                  // 886
      return stubReturnValue;                                                                                          // 888
    } // If an exception occurred in a stub, and we're ignoring it                                                     // 889
    // because we're doing an RPC and want to use what the server                                                      // 892
    // returns instead, log it so the developer knows                                                                  // 893
    // (unless they explicitly ask to see the error).                                                                  // 894
    //                                                                                                                 // 895
    // Tests can set the 'expected' flag on an exception so it won't                                                   // 896
    // go to log.                                                                                                      // 897
                                                                                                                       //
                                                                                                                       //
    if (exception) {                                                                                                   // 898
      if (options.throwStubExceptions) {                                                                               // 899
        throw exception;                                                                                               // 900
      } else if (!exception.expected) {                                                                                // 901
        Meteor._debug("Exception while simulating the effect of invoking '" + name + "'", exception, exception.stack);
      }                                                                                                                // 904
    } // At this point we're definitely doing an RPC, and we're going to                                               // 905
    // return the value of the RPC to the caller.                                                                      // 909
    // If the caller didn't give a callback, decide what to do.                                                        // 911
                                                                                                                       //
                                                                                                                       //
    if (!callback) {                                                                                                   // 912
      if (Meteor.isClient) {                                                                                           // 913
        // On the client, we don't have fibers, so we can't block. The                                                 // 914
        // only thing we can do is to return undefined and discard the                                                 // 915
        // result of the RPC. If an error occurred then print the error                                                // 916
        // to the console.                                                                                             // 917
        callback = function (err) {                                                                                    // 918
          err && Meteor._debug("Error invoking Method '" + name + "':", err.message);                                  // 919
        };                                                                                                             // 921
      } else {                                                                                                         // 922
        // On the server, make the function synchronous. Throw on                                                      // 923
        // errors, return on success.                                                                                  // 924
        var future = new Future();                                                                                     // 925
        callback = future.resolver();                                                                                  // 926
      }                                                                                                                // 927
    } // Send the RPC. Note that on the client, it is important that the                                               // 928
    // stub have finished before we send the RPC, so that we know we have                                              // 930
    // a complete list of which local documents the stub wrote.                                                        // 931
                                                                                                                       //
                                                                                                                       //
    var message = {                                                                                                    // 932
      msg: 'method',                                                                                                   // 933
      method: name,                                                                                                    // 934
      params: args,                                                                                                    // 935
      id: methodId()                                                                                                   // 936
    }; // Send the randomSeed only if we used it                                                                       // 932
                                                                                                                       //
    if (randomSeed !== null) {                                                                                         // 940
      message.randomSeed = randomSeed;                                                                                 // 941
    }                                                                                                                  // 942
                                                                                                                       //
    var methodInvoker = new MethodInvoker({                                                                            // 944
      methodId: methodId(),                                                                                            // 945
      callback: callback,                                                                                              // 946
      connection: self,                                                                                                // 947
      onResultReceived: options.onResultReceived,                                                                      // 948
      wait: !!options.wait,                                                                                            // 949
      message: message,                                                                                                // 950
      noRetry: !!options.noRetry                                                                                       // 951
    });                                                                                                                // 944
                                                                                                                       //
    if (options.wait) {                                                                                                // 954
      // It's a wait method! Wait methods go in their own block.                                                       // 955
      self._outstandingMethodBlocks.push({                                                                             // 956
        wait: true,                                                                                                    // 957
        methods: [methodInvoker]                                                                                       // 957
      });                                                                                                              // 957
    } else {                                                                                                           // 958
      // Not a wait method. Start a new block if the previous block was a wait                                         // 959
      // block, and add it to the last block of methods.                                                               // 960
      if (_.isEmpty(self._outstandingMethodBlocks) || _.last(self._outstandingMethodBlocks).wait) self._outstandingMethodBlocks.push({
        wait: false,                                                                                                   // 963
        methods: []                                                                                                    // 963
      });                                                                                                              // 963
                                                                                                                       //
      _.last(self._outstandingMethodBlocks).methods.push(methodInvoker);                                               // 964
    } // If we added it to the first block, send it out now.                                                           // 965
                                                                                                                       //
                                                                                                                       //
    if (self._outstandingMethodBlocks.length === 1) methodInvoker.sendMessage(); // If we're using the default callback on the server,
    // block waiting for the result.                                                                                   // 972
                                                                                                                       //
    if (future) {                                                                                                      // 973
      return future.wait();                                                                                            // 974
    }                                                                                                                  // 975
                                                                                                                       //
    return options.returnStubValue ? stubReturnValue : undefined;                                                      // 976
  },                                                                                                                   // 977
  // Before calling a method stub, prepare all stores to track changes and allow                                       // 979
  // _retrieveAndStoreOriginals to get the original versions of changed                                                // 980
  // documents.                                                                                                        // 981
  _saveOriginals: function () {                                                                                        // 982
    var self = this;                                                                                                   // 983
    if (!self._waitingForQuiescence()) self._flushBufferedWrites();                                                    // 984
                                                                                                                       //
    _.each(self._stores, function (s) {                                                                                // 986
      s.saveOriginals();                                                                                               // 987
    });                                                                                                                // 988
  },                                                                                                                   // 989
  // Retrieves the original versions of all documents modified by the stub for                                         // 990
  // method 'methodId' from all stores and saves them to _serverDocuments (keyed                                       // 991
  // by document) and _documentsWrittenByStub (keyed by method ID).                                                    // 992
  _retrieveAndStoreOriginals: function (methodId) {                                                                    // 993
    var self = this;                                                                                                   // 994
    if (self._documentsWrittenByStub[methodId]) throw new Error("Duplicate methodId in _retrieveAndStoreOriginals");   // 995
    var docsWritten = [];                                                                                              // 998
                                                                                                                       //
    _.each(self._stores, function (s, collection) {                                                                    // 999
      var originals = s.retrieveOriginals(); // not all stores define retrieveOriginals                                // 1000
                                                                                                                       //
      if (!originals) return;                                                                                          // 1002
      originals.forEach(function (doc, id) {                                                                           // 1004
        docsWritten.push({                                                                                             // 1005
          collection: collection,                                                                                      // 1005
          id: id                                                                                                       // 1005
        });                                                                                                            // 1005
        if (!_.has(self._serverDocuments, collection)) self._serverDocuments[collection] = new MongoIDMap();           // 1006
                                                                                                                       //
        var serverDoc = self._serverDocuments[collection].setDefault(id, {});                                          // 1008
                                                                                                                       //
        if (serverDoc.writtenByStubs) {                                                                                // 1009
          // We're not the first stub to write this doc. Just add our method ID                                        // 1010
          // to the record.                                                                                            // 1011
          serverDoc.writtenByStubs[methodId] = true;                                                                   // 1012
        } else {                                                                                                       // 1013
          // First stub! Save the original value and our method ID.                                                    // 1014
          serverDoc.document = doc;                                                                                    // 1015
          serverDoc.flushCallbacks = [];                                                                               // 1016
          serverDoc.writtenByStubs = {};                                                                               // 1017
          serverDoc.writtenByStubs[methodId] = true;                                                                   // 1018
        }                                                                                                              // 1019
      });                                                                                                              // 1020
    });                                                                                                                // 1021
                                                                                                                       //
    if (!_.isEmpty(docsWritten)) {                                                                                     // 1022
      self._documentsWrittenByStub[methodId] = docsWritten;                                                            // 1023
    }                                                                                                                  // 1024
  },                                                                                                                   // 1025
  // This is very much a private function we use to make the tests                                                     // 1027
  // take up fewer server resources after they complete.                                                               // 1028
  _unsubscribeAll: function () {                                                                                       // 1029
    var self = this;                                                                                                   // 1030
                                                                                                                       //
    _.each(_.clone(self._subscriptions), function (sub, id) {                                                          // 1031
      // Avoid killing the autoupdate subscription so that developers                                                  // 1032
      // still get hot code pushes when writing tests.                                                                 // 1033
      //                                                                                                               // 1034
      // XXX it's a hack to encode knowledge about autoupdate here,                                                    // 1035
      // but it doesn't seem worth it yet to have a special API for                                                    // 1036
      // subscriptions to preserve after unit tests.                                                                   // 1037
      if (sub.name !== 'meteor_autoupdate_clientVersions') {                                                           // 1038
        self._subscriptions[id].stop();                                                                                // 1039
      }                                                                                                                // 1040
    });                                                                                                                // 1041
  },                                                                                                                   // 1042
  // Sends the DDP stringification of the given message object                                                         // 1044
  _send: function (obj) {                                                                                              // 1045
    var self = this;                                                                                                   // 1046
                                                                                                                       //
    self._stream.send(DDPCommon.stringifyDDP(obj));                                                                    // 1047
  },                                                                                                                   // 1048
  // We detected via DDP-level heartbeats that we've lost the                                                          // 1050
  // connection.  Unlike `disconnect` or `close`, a lost connection                                                    // 1051
  // will be automatically retried.                                                                                    // 1052
  _lostConnection: function (error) {                                                                                  // 1053
    var self = this;                                                                                                   // 1054
                                                                                                                       //
    self._stream._lostConnection(error);                                                                               // 1055
  },                                                                                                                   // 1056
  /**                                                                                                                  // 1058
   * @summary Get the current connection status. A reactive data source.                                               //
   * @locus Client                                                                                                     //
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   */status: function () /*passthrough args*/{                                                                         //
    var self = this;                                                                                                   // 1065
    return self._stream.status.apply(self._stream, arguments);                                                         // 1066
  },                                                                                                                   // 1067
  /**                                                                                                                  // 1069
   * @summary Force an immediate reconnection attempt if the client is not connected to the server.                    //
   This method does nothing if the client is already connected.                                                        //
   * @locus Client                                                                                                     //
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   */reconnect: function () /*passthrough args*/{                                                                      //
    var self = this;                                                                                                   // 1078
    return self._stream.reconnect.apply(self._stream, arguments);                                                      // 1079
  },                                                                                                                   // 1080
  /**                                                                                                                  // 1082
   * @summary Disconnect the client from the server.                                                                   //
   * @locus Client                                                                                                     //
   * @memberOf Meteor                                                                                                  //
   * @importFromPackage meteor                                                                                         //
   */disconnect: function () /*passthrough args*/{                                                                     //
    var self = this;                                                                                                   // 1089
    return self._stream.disconnect.apply(self._stream, arguments);                                                     // 1090
  },                                                                                                                   // 1091
  close: function () {                                                                                                 // 1093
    var self = this;                                                                                                   // 1094
    return self._stream.disconnect({                                                                                   // 1095
      _permanent: true                                                                                                 // 1095
    });                                                                                                                // 1095
  },                                                                                                                   // 1096
  ///                                                                                                                  // 1098
  /// Reactive user system                                                                                             // 1099
  ///                                                                                                                  // 1100
  userId: function () {                                                                                                // 1101
    var self = this;                                                                                                   // 1102
    if (self._userIdDeps) self._userIdDeps.depend();                                                                   // 1103
    return self._userId;                                                                                               // 1105
  },                                                                                                                   // 1106
  setUserId: function (userId) {                                                                                       // 1108
    var self = this; // Avoid invalidating dependents if setUserId is called with current value.                       // 1109
                                                                                                                       //
    if (self._userId === userId) return;                                                                               // 1111
    self._userId = userId;                                                                                             // 1113
    if (self._userIdDeps) self._userIdDeps.changed();                                                                  // 1114
  },                                                                                                                   // 1116
  // Returns true if we are in a state after reconnect of waiting for subs to be                                       // 1118
  // revived or early methods to finish their data, or we are waiting for a                                            // 1119
  // "wait" method to finish.                                                                                          // 1120
  _waitingForQuiescence: function () {                                                                                 // 1121
    var self = this;                                                                                                   // 1122
    return !_.isEmpty(self._subsBeingRevived) || !_.isEmpty(self._methodsBlockingQuiescence);                          // 1123
  },                                                                                                                   // 1125
  // Returns true if any method whose message has been sent to the server has                                          // 1127
  // not yet invoked its user callback.                                                                                // 1128
  _anyMethodsAreOutstanding: function () {                                                                             // 1129
    var self = this;                                                                                                   // 1130
    return _.any(_.pluck(self._methodInvokers, 'sentMessage'));                                                        // 1131
  },                                                                                                                   // 1132
  _livedata_connected: function (msg) {                                                                                // 1134
    var self = this;                                                                                                   // 1135
                                                                                                                       //
    if (self._version !== 'pre1' && self._heartbeatInterval !== 0) {                                                   // 1137
      self._heartbeat = new DDPCommon.Heartbeat({                                                                      // 1138
        heartbeatInterval: self._heartbeatInterval,                                                                    // 1139
        heartbeatTimeout: self._heartbeatTimeout,                                                                      // 1140
        onTimeout: function () {                                                                                       // 1141
          self._lostConnection(new DDP.ConnectionError("DDP heartbeat timed out"));                                    // 1142
        },                                                                                                             // 1144
        sendPing: function () {                                                                                        // 1145
          self._send({                                                                                                 // 1146
            msg: 'ping'                                                                                                // 1146
          });                                                                                                          // 1146
        }                                                                                                              // 1147
      });                                                                                                              // 1138
                                                                                                                       //
      self._heartbeat.start();                                                                                         // 1149
    } // If this is a reconnect, we'll have to reset all stores.                                                       // 1150
                                                                                                                       //
                                                                                                                       //
    if (self._lastSessionId) self._resetStores = true;                                                                 // 1153
                                                                                                                       //
    if (typeof msg.session === "string") {                                                                             // 1156
      var reconnectedToPreviousSession = self._lastSessionId === msg.session;                                          // 1157
      self._lastSessionId = msg.session;                                                                               // 1158
    }                                                                                                                  // 1159
                                                                                                                       //
    if (reconnectedToPreviousSession) {                                                                                // 1161
      // Successful reconnection -- pick up where we left off.  Note that right                                        // 1162
      // now, this never happens: the server never connects us to a previous                                           // 1163
      // session, because DDP doesn't provide enough data for the server to know                                       // 1164
      // what messages the client has processed. We need to improve DDP to make                                        // 1165
      // this possible, at which point we'll probably need more code here.                                             // 1166
      return;                                                                                                          // 1167
    } // Server doesn't have our data any more. Re-sync a new session.                                                 // 1168
    // Forget about messages we were buffering for unknown collections. They'll                                        // 1172
    // be resent if still relevant.                                                                                    // 1173
                                                                                                                       //
                                                                                                                       //
    self._updatesForUnknownStores = {};                                                                                // 1174
                                                                                                                       //
    if (self._resetStores) {                                                                                           // 1176
      // Forget about the effects of stubs. We'll be resetting all collections                                         // 1177
      // anyway.                                                                                                       // 1178
      self._documentsWrittenByStub = {};                                                                               // 1179
      self._serverDocuments = {};                                                                                      // 1180
    } // Clear _afterUpdateCallbacks.                                                                                  // 1181
                                                                                                                       //
                                                                                                                       //
    self._afterUpdateCallbacks = []; // Mark all named subscriptions which are ready (ie, we already called the        // 1184
    // ready callback) as needing to be revived.                                                                       // 1187
    // XXX We should also block reconnect quiescence until unnamed subscriptions                                       // 1188
    //     (eg, autopublish) are done re-publishing to avoid flicker!                                                  // 1189
                                                                                                                       //
    self._subsBeingRevived = {};                                                                                       // 1190
                                                                                                                       //
    _.each(self._subscriptions, function (sub, id) {                                                                   // 1191
      if (sub.ready) self._subsBeingRevived[id] = true;                                                                // 1192
    }); // Arrange for "half-finished" methods to have their callbacks run, and                                        // 1194
    // track methods that were sent on this connection so that we don't                                                // 1197
    // quiesce until they are all done.                                                                                // 1198
    //                                                                                                                 // 1199
    // Start by clearing _methodsBlockingQuiescence: methods sent before                                               // 1200
    // reconnect don't matter, and any "wait" methods sent on the new connection                                       // 1201
    // that we drop here will be restored by the loop below.                                                           // 1202
                                                                                                                       //
                                                                                                                       //
    self._methodsBlockingQuiescence = {};                                                                              // 1203
                                                                                                                       //
    if (self._resetStores) {                                                                                           // 1204
      _.each(self._methodInvokers, function (invoker) {                                                                // 1205
        if (invoker.gotResult()) {                                                                                     // 1206
          // This method already got its result, but it didn't call its callback                                       // 1207
          // because its data didn't become visible. We did not resend the                                             // 1208
          // method RPC. We'll call its callback when we get a full quiesce,                                           // 1209
          // since that's as close as we'll get to "data must be visible".                                             // 1210
          self._afterUpdateCallbacks.push(_.bind(invoker.dataVisible, invoker));                                       // 1211
        } else if (invoker.sentMessage) {                                                                              // 1212
          // This method has been sent on this connection (maybe as a resend                                           // 1213
          // from the last connection, maybe from onReconnect, maybe just very                                         // 1214
          // quickly before processing the connected message).                                                         // 1215
          //                                                                                                           // 1216
          // We don't need to do anything special to ensure its callbacks get                                          // 1217
          // called, but we'll count it as a method which is preventing                                                // 1218
          // reconnect quiescence. (eg, it might be a login method that was run                                        // 1219
          // from onReconnect, and we don't want to see flicker by seeing a                                            // 1220
          // logged-out state.)                                                                                        // 1221
          self._methodsBlockingQuiescence[invoker.methodId] = true;                                                    // 1222
        }                                                                                                              // 1223
      });                                                                                                              // 1224
    }                                                                                                                  // 1225
                                                                                                                       //
    self._messagesBufferedUntilQuiescence = []; // If we're not waiting on any methods or subs, we can reset the stores and
    // call the callbacks immediately.                                                                                 // 1230
                                                                                                                       //
    if (!self._waitingForQuiescence()) {                                                                               // 1231
      if (self._resetStores) {                                                                                         // 1232
        _.each(self._stores, function (s) {                                                                            // 1233
          s.beginUpdate(0, true);                                                                                      // 1234
          s.endUpdate();                                                                                               // 1235
        });                                                                                                            // 1236
                                                                                                                       //
        self._resetStores = false;                                                                                     // 1237
      }                                                                                                                // 1238
                                                                                                                       //
      self._runAfterUpdateCallbacks();                                                                                 // 1239
    }                                                                                                                  // 1240
  },                                                                                                                   // 1241
  _processOneDataMessage: function (msg, updates) {                                                                    // 1244
    var self = this; // Using underscore here so as not to need to capitalize.                                         // 1245
                                                                                                                       //
    self['_process_' + msg.msg](msg, updates);                                                                         // 1247
  },                                                                                                                   // 1248
  _livedata_data: function (msg) {                                                                                     // 1251
    var self = this;                                                                                                   // 1252
                                                                                                                       //
    if (self._waitingForQuiescence()) {                                                                                // 1254
      self._messagesBufferedUntilQuiescence.push(msg);                                                                 // 1255
                                                                                                                       //
      if (msg.msg === "nosub") delete self._subsBeingRevived[msg.id];                                                  // 1257
                                                                                                                       //
      _.each(msg.subs || [], function (subId) {                                                                        // 1260
        delete self._subsBeingRevived[subId];                                                                          // 1261
      });                                                                                                              // 1262
                                                                                                                       //
      _.each(msg.methods || [], function (methodId) {                                                                  // 1263
        delete self._methodsBlockingQuiescence[methodId];                                                              // 1264
      });                                                                                                              // 1265
                                                                                                                       //
      if (self._waitingForQuiescence()) return; // No methods or subs are blocking quiescence!                         // 1267
      // We'll now process and all of our buffered messages, reset all stores,                                         // 1271
      // and apply them all at once.                                                                                   // 1272
                                                                                                                       //
      _.each(self._messagesBufferedUntilQuiescence, function (bufferedMsg) {                                           // 1273
        self._processOneDataMessage(bufferedMsg, self._bufferedWrites);                                                // 1274
      });                                                                                                              // 1275
                                                                                                                       //
      self._messagesBufferedUntilQuiescence = [];                                                                      // 1276
    } else {                                                                                                           // 1277
      self._processOneDataMessage(msg, self._bufferedWrites);                                                          // 1278
    } // Immediately flush writes when:                                                                                // 1279
    //  1. Buffering is disabled. Or;                                                                                  // 1282
    //  2. any non-(added/changed/removed) message arrives.                                                            // 1283
                                                                                                                       //
                                                                                                                       //
    var standardWrite = _.include(['added', 'changed', 'removed'], msg.msg);                                           // 1284
                                                                                                                       //
    if (self._bufferedWritesInterval === 0 || !standardWrite) {                                                        // 1285
      self._flushBufferedWrites();                                                                                     // 1286
                                                                                                                       //
      return;                                                                                                          // 1287
    }                                                                                                                  // 1288
                                                                                                                       //
    if (self._bufferedWritesFlushAt === null) {                                                                        // 1290
      self._bufferedWritesFlushAt = new Date().valueOf() + self._bufferedWritesMaxAge;                                 // 1291
    } else if (self._bufferedWritesFlushAt < new Date().valueOf()) {                                                   // 1292
      self._flushBufferedWrites();                                                                                     // 1294
                                                                                                                       //
      return;                                                                                                          // 1295
    }                                                                                                                  // 1296
                                                                                                                       //
    if (self._bufferedWritesFlushHandle) {                                                                             // 1298
      clearTimeout(self._bufferedWritesFlushHandle);                                                                   // 1299
    }                                                                                                                  // 1300
                                                                                                                       //
    self._bufferedWritesFlushHandle = setTimeout(self.__flushBufferedWrites, self._bufferedWritesInterval);            // 1301
  },                                                                                                                   // 1303
  _flushBufferedWrites: function () {                                                                                  // 1305
    var self = this;                                                                                                   // 1306
                                                                                                                       //
    if (self._bufferedWritesFlushHandle) {                                                                             // 1307
      clearTimeout(self._bufferedWritesFlushHandle);                                                                   // 1308
      self._bufferedWritesFlushHandle = null;                                                                          // 1309
    }                                                                                                                  // 1310
                                                                                                                       //
    self._bufferedWritesFlushAt = null; // We need to clear the buffer before passing it to                            // 1312
    //  performWrites. As there's no guarantee that it                                                                 // 1314
    //  will exit cleanly.                                                                                             // 1315
                                                                                                                       //
    var writes = self._bufferedWrites;                                                                                 // 1316
    self._bufferedWrites = {};                                                                                         // 1317
                                                                                                                       //
    self._performWrites(writes);                                                                                       // 1318
  },                                                                                                                   // 1319
  _performWrites: function (updates) {                                                                                 // 1321
    var self = this;                                                                                                   // 1322
                                                                                                                       //
    if (self._resetStores || !_.isEmpty(updates)) {                                                                    // 1324
      // Begin a transactional update of each store.                                                                   // 1325
      _.each(self._stores, function (s, storeName) {                                                                   // 1326
        s.beginUpdate(_.has(updates, storeName) ? updates[storeName].length : 0, self._resetStores);                   // 1327
      });                                                                                                              // 1329
                                                                                                                       //
      self._resetStores = false;                                                                                       // 1330
                                                                                                                       //
      _.each(updates, function (updateMessages, storeName) {                                                           // 1332
        var store = self._stores[storeName];                                                                           // 1333
                                                                                                                       //
        if (store) {                                                                                                   // 1334
          _.each(updateMessages, function (updateMessage) {                                                            // 1335
            store.update(updateMessage);                                                                               // 1336
          });                                                                                                          // 1337
        } else {                                                                                                       // 1338
          // Nobody's listening for this data. Queue it up until                                                       // 1339
          // someone wants it.                                                                                         // 1340
          // XXX memory use will grow without bound if you forget to                                                   // 1341
          // create a collection or just don't care about it... going                                                  // 1342
          // to have to do something about that.                                                                       // 1343
          if (!_.has(self._updatesForUnknownStores, storeName)) self._updatesForUnknownStores[storeName] = [];         // 1344
          Array.prototype.push.apply(self._updatesForUnknownStores[storeName], updateMessages);                        // 1346
        }                                                                                                              // 1348
      }); // End update transaction.                                                                                   // 1349
                                                                                                                       //
                                                                                                                       //
      _.each(self._stores, function (s) {                                                                              // 1352
        s.endUpdate();                                                                                                 // 1352
      });                                                                                                              // 1352
    }                                                                                                                  // 1353
                                                                                                                       //
    self._runAfterUpdateCallbacks();                                                                                   // 1355
  },                                                                                                                   // 1356
  // Call any callbacks deferred with _runWhenAllServerDocsAreFlushed whose                                            // 1358
  // relevant docs have been flushed, as well as dataVisible callbacks at                                              // 1359
  // reconnect-quiescence time.                                                                                        // 1360
  _runAfterUpdateCallbacks: function () {                                                                              // 1361
    var self = this;                                                                                                   // 1362
    var callbacks = self._afterUpdateCallbacks;                                                                        // 1363
    self._afterUpdateCallbacks = [];                                                                                   // 1364
                                                                                                                       //
    _.each(callbacks, function (c) {                                                                                   // 1365
      c();                                                                                                             // 1366
    });                                                                                                                // 1367
  },                                                                                                                   // 1368
  _pushUpdate: function (updates, collection, msg) {                                                                   // 1370
    var self = this;                                                                                                   // 1371
                                                                                                                       //
    if (!_.has(updates, collection)) {                                                                                 // 1372
      updates[collection] = [];                                                                                        // 1373
    }                                                                                                                  // 1374
                                                                                                                       //
    updates[collection].push(msg);                                                                                     // 1375
  },                                                                                                                   // 1376
  _getServerDoc: function (collection, id) {                                                                           // 1378
    var self = this;                                                                                                   // 1379
    if (!_.has(self._serverDocuments, collection)) return null;                                                        // 1380
    var serverDocsForCollection = self._serverDocuments[collection];                                                   // 1382
    return serverDocsForCollection.get(id) || null;                                                                    // 1383
  },                                                                                                                   // 1384
  _process_added: function (msg, updates) {                                                                            // 1386
    var self = this;                                                                                                   // 1387
    var id = MongoID.idParse(msg.id);                                                                                  // 1388
                                                                                                                       //
    var serverDoc = self._getServerDoc(msg.collection, id);                                                            // 1389
                                                                                                                       //
    if (serverDoc) {                                                                                                   // 1390
      // Some outstanding stub wrote here.                                                                             // 1391
      var isExisting = serverDoc.document !== undefined;                                                               // 1392
      serverDoc.document = msg.fields || {};                                                                           // 1394
      serverDoc.document._id = id;                                                                                     // 1395
                                                                                                                       //
      if (self._resetStores) {                                                                                         // 1397
        // During reconnect the server is sending adds for existing ids.                                               // 1398
        // Always push an update so that document stays in the store after                                             // 1399
        // reset. Use current version of the document for this update, so                                              // 1400
        // that stub-written values are preserved.                                                                     // 1401
        var currentDoc = self._stores[msg.collection].getDoc(msg.id);                                                  // 1402
                                                                                                                       //
        if (currentDoc !== undefined) msg.fields = currentDoc;                                                         // 1403
                                                                                                                       //
        self._pushUpdate(updates, msg.collection, msg);                                                                // 1406
      } else if (isExisting) {                                                                                         // 1407
        throw new Error("Server sent add for existing id: " + msg.id);                                                 // 1408
      }                                                                                                                // 1409
    } else {                                                                                                           // 1410
      self._pushUpdate(updates, msg.collection, msg);                                                                  // 1411
    }                                                                                                                  // 1412
  },                                                                                                                   // 1413
  _process_changed: function (msg, updates) {                                                                          // 1415
    var self = this;                                                                                                   // 1416
                                                                                                                       //
    var serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));                                       // 1417
                                                                                                                       //
    if (serverDoc) {                                                                                                   // 1419
      if (serverDoc.document === undefined) throw new Error("Server sent changed for nonexisting id: " + msg.id);      // 1420
      DiffSequence.applyChanges(serverDoc.document, msg.fields);                                                       // 1422
    } else {                                                                                                           // 1423
      self._pushUpdate(updates, msg.collection, msg);                                                                  // 1424
    }                                                                                                                  // 1425
  },                                                                                                                   // 1426
  _process_removed: function (msg, updates) {                                                                          // 1428
    var self = this;                                                                                                   // 1429
                                                                                                                       //
    var serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));                                       // 1430
                                                                                                                       //
    if (serverDoc) {                                                                                                   // 1432
      // Some outstanding stub wrote here.                                                                             // 1433
      if (serverDoc.document === undefined) throw new Error("Server sent removed for nonexisting id:" + msg.id);       // 1434
      serverDoc.document = undefined;                                                                                  // 1436
    } else {                                                                                                           // 1437
      self._pushUpdate(updates, msg.collection, {                                                                      // 1438
        msg: 'removed',                                                                                                // 1439
        collection: msg.collection,                                                                                    // 1440
        id: msg.id                                                                                                     // 1441
      });                                                                                                              // 1438
    }                                                                                                                  // 1443
  },                                                                                                                   // 1444
  _process_updated: function (msg, updates) {                                                                          // 1446
    var self = this; // Process "method done" messages.                                                                // 1447
                                                                                                                       //
    _.each(msg.methods, function (methodId) {                                                                          // 1449
      _.each(self._documentsWrittenByStub[methodId], function (written) {                                              // 1450
        var serverDoc = self._getServerDoc(written.collection, written.id);                                            // 1451
                                                                                                                       //
        if (!serverDoc) throw new Error("Lost serverDoc for " + JSON.stringify(written));                              // 1452
        if (!serverDoc.writtenByStubs[methodId]) throw new Error("Doc " + JSON.stringify(written) + " not written by  method " + methodId);
        delete serverDoc.writtenByStubs[methodId];                                                                     // 1457
                                                                                                                       //
        if (_.isEmpty(serverDoc.writtenByStubs)) {                                                                     // 1458
          // All methods whose stubs wrote this method have completed! We can                                          // 1459
          // now copy the saved document to the database (reverting the stub's                                         // 1460
          // change if the server did not write to this object, or applying the                                        // 1461
          // server's writes if it did).                                                                               // 1462
          // This is a fake ddp 'replace' message.  It's just for talking                                              // 1464
          // between livedata connections and minimongo.  (We have to stringify                                        // 1465
          // the ID because it's supposed to look like a wire message.)                                                // 1466
          self._pushUpdate(updates, written.collection, {                                                              // 1467
            msg: 'replace',                                                                                            // 1468
            id: MongoID.idStringify(written.id),                                                                       // 1469
            replace: serverDoc.document                                                                                // 1470
          }); // Call all flush callbacks.                                                                             // 1467
                                                                                                                       //
                                                                                                                       //
          _.each(serverDoc.flushCallbacks, function (c) {                                                              // 1473
            c();                                                                                                       // 1474
          }); // Delete this completed serverDocument. Don't bother to GC empty                                        // 1475
          // IdMaps inside self._serverDocuments, since there probably aren't                                          // 1478
          // many collections and they'll be written repeatedly.                                                       // 1479
                                                                                                                       //
                                                                                                                       //
          self._serverDocuments[written.collection].remove(written.id);                                                // 1480
        }                                                                                                              // 1481
      });                                                                                                              // 1482
                                                                                                                       //
      delete self._documentsWrittenByStub[methodId]; // We want to call the data-written callback, but we can't do so until all
      // currently buffered messages are flushed.                                                                      // 1486
                                                                                                                       //
      var callbackInvoker = self._methodInvokers[methodId];                                                            // 1487
      if (!callbackInvoker) throw new Error("No callback invoker for method " + methodId);                             // 1488
                                                                                                                       //
      self._runWhenAllServerDocsAreFlushed(_.bind(callbackInvoker.dataVisible, callbackInvoker));                      // 1490
    });                                                                                                                // 1492
  },                                                                                                                   // 1493
  _process_ready: function (msg, updates) {                                                                            // 1495
    var self = this; // Process "sub ready" messages. "sub ready" messages don't take effect                           // 1496
    // until all current server documents have been flushed to the local                                               // 1498
    // database. We can use a write fence to implement this.                                                           // 1499
                                                                                                                       //
    _.each(msg.subs, function (subId) {                                                                                // 1500
      self._runWhenAllServerDocsAreFlushed(function () {                                                               // 1501
        var subRecord = self._subscriptions[subId]; // Did we already unsubscribe?                                     // 1502
                                                                                                                       //
        if (!subRecord) return; // Did we already receive a ready message? (Oops!)                                     // 1504
                                                                                                                       //
        if (subRecord.ready) return;                                                                                   // 1507
        subRecord.ready = true;                                                                                        // 1509
        subRecord.readyCallback && subRecord.readyCallback();                                                          // 1510
        subRecord.readyDeps.changed();                                                                                 // 1511
      });                                                                                                              // 1512
    });                                                                                                                // 1513
  },                                                                                                                   // 1514
  // Ensures that "f" will be called after all documents currently in                                                  // 1516
  // _serverDocuments have been written to the local cache. f will not be called                                       // 1517
  // if the connection is lost before then!                                                                            // 1518
  _runWhenAllServerDocsAreFlushed: function (f) {                                                                      // 1519
    var self = this;                                                                                                   // 1520
                                                                                                                       //
    var runFAfterUpdates = function () {                                                                               // 1521
      self._afterUpdateCallbacks.push(f);                                                                              // 1522
    };                                                                                                                 // 1523
                                                                                                                       //
    var unflushedServerDocCount = 0;                                                                                   // 1524
                                                                                                                       //
    var onServerDocFlush = function () {                                                                               // 1525
      --unflushedServerDocCount;                                                                                       // 1526
                                                                                                                       //
      if (unflushedServerDocCount === 0) {                                                                             // 1527
        // This was the last doc to flush! Arrange to run f after the updates                                          // 1528
        // have been applied.                                                                                          // 1529
        runFAfterUpdates();                                                                                            // 1530
      }                                                                                                                // 1531
    };                                                                                                                 // 1532
                                                                                                                       //
    _.each(self._serverDocuments, function (collectionDocs) {                                                          // 1533
      collectionDocs.forEach(function (serverDoc) {                                                                    // 1534
        var writtenByStubForAMethodWithSentMessage = _.any(serverDoc.writtenByStubs, function (dummy, methodId) {      // 1535
          var invoker = self._methodInvokers[methodId];                                                                // 1537
          return invoker && invoker.sentMessage;                                                                       // 1538
        });                                                                                                            // 1539
                                                                                                                       //
        if (writtenByStubForAMethodWithSentMessage) {                                                                  // 1540
          ++unflushedServerDocCount;                                                                                   // 1541
          serverDoc.flushCallbacks.push(onServerDocFlush);                                                             // 1542
        }                                                                                                              // 1543
      });                                                                                                              // 1544
    });                                                                                                                // 1545
                                                                                                                       //
    if (unflushedServerDocCount === 0) {                                                                               // 1546
      // There aren't any buffered docs --- we can call f as soon as the current                                       // 1547
      // round of updates is applied!                                                                                  // 1548
      runFAfterUpdates();                                                                                              // 1549
    }                                                                                                                  // 1550
  },                                                                                                                   // 1551
  _livedata_nosub: function (msg) {                                                                                    // 1553
    var self = this; // First pass it through _livedata_data, which only uses it to help get                           // 1554
    // towards quiescence.                                                                                             // 1557
                                                                                                                       //
    self._livedata_data(msg); // Do the rest of our processing immediately, with no                                    // 1558
    // buffering-until-quiescence.                                                                                     // 1561
    // we weren't subbed anyway, or we initiated the unsub.                                                            // 1563
                                                                                                                       //
                                                                                                                       //
    if (!_.has(self._subscriptions, msg.id)) return; // XXX COMPAT WITH 1.0.3.1 #errorCallback                         // 1564
                                                                                                                       //
    var errorCallback = self._subscriptions[msg.id].errorCallback;                                                     // 1568
    var stopCallback = self._subscriptions[msg.id].stopCallback;                                                       // 1569
                                                                                                                       //
    self._subscriptions[msg.id].remove();                                                                              // 1571
                                                                                                                       //
    var meteorErrorFromMsg = function (msgArg) {                                                                       // 1573
      return msgArg && msgArg.error && new Meteor.Error(msgArg.error.error, msgArg.error.reason, msgArg.error.details);
    }; // XXX COMPAT WITH 1.0.3.1 #errorCallback                                                                       // 1576
                                                                                                                       //
                                                                                                                       //
    if (errorCallback && msg.error) {                                                                                  // 1579
      errorCallback(meteorErrorFromMsg(msg));                                                                          // 1580
    }                                                                                                                  // 1581
                                                                                                                       //
    if (stopCallback) {                                                                                                // 1583
      stopCallback(meteorErrorFromMsg(msg));                                                                           // 1584
    }                                                                                                                  // 1585
  },                                                                                                                   // 1586
  _process_nosub: function () {// This is called as part of the "buffer until quiescence" process, but                 // 1588
    // nosub's effect is always immediate. It only goes in the buffer at all                                           // 1590
    // because it's possible for a nosub to be the thing that triggers                                                 // 1591
    // quiescence, if we were waiting for a sub to be revived and it dies                                              // 1592
    // instead.                                                                                                        // 1593
  },                                                                                                                   // 1594
  _livedata_result: function (msg) {                                                                                   // 1596
    // id, result or error. error has error (code), reason, details                                                    // 1597
    var self = this; // Lets make sure there are no buffered writes before returning result.                           // 1599
                                                                                                                       //
    if (!_.isEmpty(self._bufferedWrites)) {                                                                            // 1602
      self._flushBufferedWrites();                                                                                     // 1603
    } // find the outstanding request                                                                                  // 1604
    // should be O(1) in nearly all realistic use cases                                                                // 1607
                                                                                                                       //
                                                                                                                       //
    if (_.isEmpty(self._outstandingMethodBlocks)) {                                                                    // 1608
      Meteor._debug("Received method result but no methods outstanding");                                              // 1609
                                                                                                                       //
      return;                                                                                                          // 1610
    }                                                                                                                  // 1611
                                                                                                                       //
    var currentMethodBlock = self._outstandingMethodBlocks[0].methods;                                                 // 1612
    var m;                                                                                                             // 1613
                                                                                                                       //
    for (var i = 0; i < currentMethodBlock.length; i++) {                                                              // 1614
      m = currentMethodBlock[i];                                                                                       // 1615
      if (m.methodId === msg.id) break;                                                                                // 1616
    }                                                                                                                  // 1618
                                                                                                                       //
    if (!m) {                                                                                                          // 1620
      Meteor._debug("Can't match method response to original method call", msg);                                       // 1621
                                                                                                                       //
      return;                                                                                                          // 1622
    } // Remove from current method block. This may leave the block empty, but we                                      // 1623
    // don't move on to the next block until the callback has been delivered, in                                       // 1626
    // _outstandingMethodFinished.                                                                                     // 1627
                                                                                                                       //
                                                                                                                       //
    currentMethodBlock.splice(i, 1);                                                                                   // 1628
                                                                                                                       //
    if (_.has(msg, 'error')) {                                                                                         // 1630
      m.receiveResult(new Meteor.Error(msg.error.error, msg.error.reason, msg.error.details));                         // 1631
    } else {                                                                                                           // 1634
      // msg.result may be undefined if the method didn't return a                                                     // 1635
      // value                                                                                                         // 1636
      m.receiveResult(undefined, msg.result);                                                                          // 1637
    }                                                                                                                  // 1638
  },                                                                                                                   // 1639
  // Called by MethodInvoker after a method's callback is invoked.  If this was                                        // 1641
  // the last outstanding method in the current block, runs the next block. If                                         // 1642
  // there are no more methods, consider accepting a hot code push.                                                    // 1643
  _outstandingMethodFinished: function () {                                                                            // 1644
    var self = this;                                                                                                   // 1645
    if (self._anyMethodsAreOutstanding()) return; // No methods are outstanding. This should mean that the first block of
    // methods is empty. (Or it might not exist, if this was a method that                                             // 1650
    // half-finished before disconnect/reconnect.)                                                                     // 1651
                                                                                                                       //
    if (!_.isEmpty(self._outstandingMethodBlocks)) {                                                                   // 1652
      var firstBlock = self._outstandingMethodBlocks.shift();                                                          // 1653
                                                                                                                       //
      if (!_.isEmpty(firstBlock.methods)) throw new Error("No methods outstanding but nonempty block: " + JSON.stringify(firstBlock)); // Send the outstanding methods now in the first block.
                                                                                                                       //
      if (!_.isEmpty(self._outstandingMethodBlocks)) self._sendOutstandingMethods();                                   // 1659
    } // Maybe accept a hot code push.                                                                                 // 1661
                                                                                                                       //
                                                                                                                       //
    self._maybeMigrate();                                                                                              // 1664
  },                                                                                                                   // 1665
  // Sends messages for all the methods in the first block in                                                          // 1667
  // _outstandingMethodBlocks.                                                                                         // 1668
  _sendOutstandingMethods: function () {                                                                               // 1669
    var self = this;                                                                                                   // 1670
    if (_.isEmpty(self._outstandingMethodBlocks)) return;                                                              // 1671
                                                                                                                       //
    _.each(self._outstandingMethodBlocks[0].methods, function (m) {                                                    // 1673
      m.sendMessage();                                                                                                 // 1674
    });                                                                                                                // 1675
  },                                                                                                                   // 1676
  _livedata_error: function (msg) {                                                                                    // 1678
    Meteor._debug("Received error from server: ", msg.reason);                                                         // 1679
                                                                                                                       //
    if (msg.offendingMessage) Meteor._debug("For: ", msg.offendingMessage);                                            // 1680
  },                                                                                                                   // 1682
  _callOnReconnectAndSendAppropriateOutstandingMethods: function () {                                                  // 1684
    var self = this;                                                                                                   // 1685
    var oldOutstandingMethodBlocks = self._outstandingMethodBlocks;                                                    // 1686
    self._outstandingMethodBlocks = [];                                                                                // 1687
    self.onReconnect();                                                                                                // 1689
    if (_.isEmpty(oldOutstandingMethodBlocks)) return; // We have at least one block worth of old outstanding methods to try
    // again. First: did onReconnect actually send anything? If not, we just                                           // 1695
    // restore all outstanding methods and run the first block.                                                        // 1696
                                                                                                                       //
    if (_.isEmpty(self._outstandingMethodBlocks)) {                                                                    // 1697
      self._outstandingMethodBlocks = oldOutstandingMethodBlocks;                                                      // 1698
                                                                                                                       //
      self._sendOutstandingMethods();                                                                                  // 1699
                                                                                                                       //
      return;                                                                                                          // 1700
    } // OK, there are blocks on both sides. Special case: merge the last block of                                     // 1701
    // the reconnect methods with the first block of the original methods, if                                          // 1704
    // neither of them are "wait" blocks.                                                                              // 1705
                                                                                                                       //
                                                                                                                       //
    if (!_.last(self._outstandingMethodBlocks).wait && !oldOutstandingMethodBlocks[0].wait) {                          // 1706
      _.each(oldOutstandingMethodBlocks[0].methods, function (m) {                                                     // 1708
        _.last(self._outstandingMethodBlocks).methods.push(m); // If this "last block" is also the first block, send the message.
                                                                                                                       //
                                                                                                                       //
        if (self._outstandingMethodBlocks.length === 1) m.sendMessage();                                               // 1712
      });                                                                                                              // 1714
                                                                                                                       //
      oldOutstandingMethodBlocks.shift();                                                                              // 1716
    } // Now add the rest of the original blocks on.                                                                   // 1717
                                                                                                                       //
                                                                                                                       //
    _.each(oldOutstandingMethodBlocks, function (block) {                                                              // 1720
      self._outstandingMethodBlocks.push(block);                                                                       // 1721
    });                                                                                                                // 1722
  },                                                                                                                   // 1723
  // We can accept a hot code push if there are no methods in flight.                                                  // 1725
  _readyToMigrate: function () {                                                                                       // 1726
    var self = this;                                                                                                   // 1727
    return _.isEmpty(self._methodInvokers);                                                                            // 1728
  },                                                                                                                   // 1729
  // If we were blocking a migration, see if it's now possible to continue.                                            // 1731
  // Call whenever the set of outstanding/blocked methods shrinks.                                                     // 1732
  _maybeMigrate: function () {                                                                                         // 1733
    var self = this;                                                                                                   // 1734
                                                                                                                       //
    if (self._retryMigrate && self._readyToMigrate()) {                                                                // 1735
      self._retryMigrate();                                                                                            // 1736
                                                                                                                       //
      self._retryMigrate = null;                                                                                       // 1737
    }                                                                                                                  // 1738
  }                                                                                                                    // 1739
});                                                                                                                    // 480
                                                                                                                       //
LivedataTest.Connection = Connection; // @param url {String} URL to Meteor app,                                        // 1742
//     e.g.:                                                                                                           // 1745
//     "subdomain.meteor.com",                                                                                         // 1746
//     "http://subdomain.meteor.com",                                                                                  // 1747
//     "/",                                                                                                            // 1748
//     "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"                                                                  // 1749
/**                                                                                                                    // 1751
 * @summary Connect to the server of a different Meteor application to subscribe to its document sets and invoke its remote methods.
 * @locus Anywhere                                                                                                     //
 * @param {String} url The URL of another Meteor application.                                                          //
 */                                                                                                                    //
                                                                                                                       //
DDP.connect = function (url, options) {                                                                                // 1756
  var ret = new Connection(url, options);                                                                              // 1757
  allConnections.push(ret); // hack. see below.                                                                        // 1758
                                                                                                                       //
  return ret;                                                                                                          // 1759
}; // Hack for `spiderable` package: a way to see if the page is done                                                  // 1760
// loading all the data it needs.                                                                                      // 1763
//                                                                                                                     // 1764
                                                                                                                       //
                                                                                                                       //
allConnections = [];                                                                                                   // 1765
                                                                                                                       //
DDP._allSubscriptionsReady = function () {                                                                             // 1766
  return _.all(allConnections, function (conn) {                                                                       // 1767
    return _.all(conn._subscriptions, function (sub) {                                                                 // 1768
      return sub.ready;                                                                                                // 1769
    });                                                                                                                // 1770
  });                                                                                                                  // 1771
};                                                                                                                     // 1772
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

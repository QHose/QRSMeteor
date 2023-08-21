(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Retry = Package.retry.Retry;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var options;

var require = meteorInstall({"node_modules":{"meteor":{"socket-stream-client":{"node.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/node.js                                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
const module1 = module;
module1.export({
  ClientStream: () => ClientStream
});
let Meteor;
module1.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let toWebsocketUrl;
module1.watch(require("./urls.js"), {
  toWebsocketUrl(v) {
    toWebsocketUrl = v;
  }

}, 1);
let StreamClientCommon;
module1.watch(require("./common.js"), {
  StreamClientCommon(v) {
    StreamClientCommon = v;
  }

}, 2);

class ClientStream extends StreamClientCommon {
  constructor(endpoint, options) {
    super(options);
    this.client = null; // created in _launchConnection

    this.endpoint = endpoint;
    this.headers = this.options.headers || Object.create(null);
    this.npmFayeOptions = this.options.npmFayeOptions || Object.create(null);

    this._initCommon(this.options); //// Kickoff!


    this._launchConnection();
  } // data is a utf8 string. Data sent while not connected is dropped on
  // the floor, and it is up the user of this API to retransmit lost
  // messages on 'reset'


  send(data) {
    if (this.currentStatus.connected) {
      this.client.send(data);
    }
  } // Changes where this connection points


  _changeUrl(url) {
    this.endpoint = url;
  }

  _onConnect(client) {
    if (client !== this.client) {
      // This connection is not from the last call to _launchConnection.
      // But _launchConnection calls _cleanup which closes previous connections.
      // It's our belief that this stifles future 'open' events, but maybe
      // we are wrong?
      throw new Error('Got open from inactive client ' + !!this.client);
    }

    if (this._forcedToDisconnect) {
      // We were asked to disconnect between trying to open the connection and
      // actually opening it. Let's just pretend this never happened.
      this.client.close();
      this.client = null;
      return;
    }

    if (this.currentStatus.connected) {
      // We already have a connection. It must have been the case that we
      // started two parallel connection attempts (because we wanted to
      // 'reconnect now' on a hanging connection and we had no way to cancel the
      // connection attempt.) But this shouldn't happen (similarly to the client
      // !== this.client check above).
      throw new Error('Two parallel connections?');
    }

    this._clearConnectionTimer(); // update status


    this.currentStatus.status = 'connected';
    this.currentStatus.connected = true;
    this.currentStatus.retryCount = 0;
    this.statusChanged(); // fire resets. This must come after status change so that clients
    // can call send from within a reset callback.

    this.forEachCallback('reset', callback => {
      callback();
    });
  }

  _cleanup(maybeError) {
    this._clearConnectionTimer();

    if (this.client) {
      var client = this.client;
      this.client = null;
      client.close();
      this.forEachCallback('disconnect', callback => {
        callback(maybeError);
      });
    }
  }

  _clearConnectionTimer() {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  _getProxyUrl(targetUrl) {
    // Similar to code in tools/http-helpers.js.
    var proxy = process.env.HTTP_PROXY || process.env.http_proxy || null; // if we're going to a secure url, try the https_proxy env variable first.

    if (targetUrl.match(/^wss:/)) {
      proxy = process.env.HTTPS_PROXY || process.env.https_proxy || proxy;
    }

    return proxy;
  }

  _launchConnection() {
    this._cleanup(); // cleanup the old socket, if there was one.
    // Since server-to-server DDP is still an experimental feature, we only
    // require the module if we actually create a server-to-server
    // connection.


    var FayeWebSocket = Npm.require('faye-websocket');

    var deflate = Npm.require('permessage-deflate');

    var targetUrl = toWebsocketUrl(this.endpoint);
    var fayeOptions = {
      headers: this.headers,
      extensions: [deflate]
    };
    fayeOptions = Object.assign(fayeOptions, this.npmFayeOptions);

    var proxyUrl = this._getProxyUrl(targetUrl);

    if (proxyUrl) {
      fayeOptions.proxy = {
        origin: proxyUrl
      };
    } // We would like to specify 'ddp' as the subprotocol here. The npm module we
    // used to use as a client would fail the handshake if we ask for a
    // subprotocol and the server doesn't send one back (and sockjs doesn't).
    // Faye doesn't have that behavior; it's unclear from reading RFC 6455 if
    // Faye is erroneous or not.  So for now, we don't specify protocols.


    var subprotocols = [];
    var client = this.client = new FayeWebSocket.Client(targetUrl, subprotocols, fayeOptions);

    this._clearConnectionTimer();

    this.connectionTimer = Meteor.setTimeout(() => {
      this._lostConnection(new this.ConnectionError('DDP connection timed out'));
    }, this.CONNECT_TIMEOUT);
    this.client.on('open', Meteor.bindEnvironment(() => {
      return this._onConnect(client);
    }, 'stream connect callback'));

    var clientOnIfCurrent = (event, description, callback) => {
      this.client.on(event, Meteor.bindEnvironment((...args) => {
        // Ignore events from any connection we've already cleaned up.
        if (client !== this.client) return;
        callback(...args);
      }, description));
    };

    clientOnIfCurrent('error', 'stream error callback', error => {
      if (!this.options._dontPrintErrors) Meteor._debug('stream error', error.message); // Faye's 'error' object is not a JS error (and among other things,
      // doesn't stringify well). Convert it to one.

      this._lostConnection(new this.ConnectionError(error.message));
    });
    clientOnIfCurrent('close', 'stream close callback', () => {
      this._lostConnection();
    });
    clientOnIfCurrent('message', 'stream message callback', message => {
      // Ignore binary frames, where message.data is a Buffer
      if (typeof message.data !== 'string') return;
      this.forEachCallback('message', callback => {
        callback(message.data);
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/common.js                                                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  StreamClientCommon: () => StreamClientCommon
});
let Retry;
module.watch(require("meteor/retry"), {
  Retry(v) {
    Retry = v;
  }

}, 0);
const forcedReconnectError = new Error("forced reconnect");

class StreamClientCommon {
  constructor(options) {
    this.options = (0, _objectSpread2.default)({
      retry: true
    }, options || null);
    this.ConnectionError = options && options.ConnectionError || Error;
  } // Register for callbacks.


  on(name, callback) {
    if (name !== 'message' && name !== 'reset' && name !== 'disconnect') throw new Error('unknown event type: ' + name);
    if (!this.eventCallbacks[name]) this.eventCallbacks[name] = [];
    this.eventCallbacks[name].push(callback);
  }

  forEachCallback(name, cb) {
    if (!this.eventCallbacks[name] || !this.eventCallbacks[name].length) {
      return;
    }

    this.eventCallbacks[name].forEach(cb);
  }

  _initCommon(options) {
    options = options || Object.create(null); //// Constants
    // how long to wait until we declare the connection attempt
    // failed.

    this.CONNECT_TIMEOUT = options.connectTimeoutMs || 10000;
    this.eventCallbacks = Object.create(null); // name -> [callback]

    this._forcedToDisconnect = false; //// Reactive status

    this.currentStatus = {
      status: 'connecting',
      connected: false,
      retryCount: 0
    };

    if (Package.tracker) {
      this.statusListeners = new Package.tracker.Tracker.Dependency();
    }

    this.statusChanged = () => {
      if (this.statusListeners) {
        this.statusListeners.changed();
      }
    }; //// Retry logic


    this._retry = new Retry();
    this.connectionTimer = null;
  } // Trigger a reconnect.


  reconnect(options) {
    options = options || Object.create(null);

    if (options.url) {
      this._changeUrl(options.url);
    }

    if (options._sockjsOptions) {
      this.options._sockjsOptions = options._sockjsOptions;
    }

    if (this.currentStatus.connected) {
      if (options._force || options.url) {
        this._lostConnection(forcedReconnectError);
      }

      return;
    } // if we're mid-connection, stop it.


    if (this.currentStatus.status === 'connecting') {
      // Pretend it's a clean close.
      this._lostConnection();
    }

    this._retry.clear();

    this.currentStatus.retryCount -= 1; // don't count manual retries

    this._retryNow();
  }

  disconnect(options) {
    options = options || Object.create(null); // Failed is permanent. If we're failed, don't let people go back
    // online by calling 'disconnect' then 'reconnect'.

    if (this._forcedToDisconnect) return; // If _permanent is set, permanently disconnect a stream. Once a stream
    // is forced to disconnect, it can never reconnect. This is for
    // error cases such as ddp version mismatch, where trying again
    // won't fix the problem.

    if (options._permanent) {
      this._forcedToDisconnect = true;
    }

    this._cleanup();

    this._retry.clear();

    this.currentStatus = {
      status: options._permanent ? 'failed' : 'offline',
      connected: false,
      retryCount: 0
    };
    if (options._permanent && options._error) this.currentStatus.reason = options._error;
    this.statusChanged();
  } // maybeError is set unless it's a clean protocol-level close.


  _lostConnection(maybeError) {
    this._cleanup(maybeError);

    this._retryLater(maybeError); // sets status. no need to do it here.

  } // fired when we detect that we've gone online. try to reconnect
  // immediately.


  _online() {
    // if we've requested to be offline by disconnecting, don't reconnect.
    if (this.currentStatus.status != 'offline') this.reconnect();
  }

  _retryLater(maybeError) {
    var timeout = 0;

    if (this.options.retry || maybeError === forcedReconnectError) {
      timeout = this._retry.retryLater(this.currentStatus.retryCount, this._retryNow.bind(this));
      this.currentStatus.status = 'waiting';
      this.currentStatus.retryTime = new Date().getTime() + timeout;
    } else {
      this.currentStatus.status = 'failed';
      delete this.currentStatus.retryTime;
    }

    this.currentStatus.connected = false;
    this.statusChanged();
  }

  _retryNow() {
    if (this._forcedToDisconnect) return;
    this.currentStatus.retryCount += 1;
    this.currentStatus.status = 'connecting';
    this.currentStatus.connected = false;
    delete this.currentStatus.retryTime;
    this.statusChanged();

    this._launchConnection();
  } // Get current status. Reactive.


  status() {
    if (this.statusListeners) {
      this.statusListeners.depend();
    }

    return this.currentStatus;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"urls.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/urls.js                                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  toSockjsUrl: () => toSockjsUrl,
  toWebsocketUrl: () => toWebsocketUrl
});

// @param url {String} URL to Meteor app, eg:
//   "/" or "madewith.meteor.com" or "https://foo.meteor.com"
//   or "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"
// @returns {String} URL to the endpoint with the specific scheme and subPath, e.g.
// for scheme "http" and subPath "sockjs"
//   "http://subdomain.meteor.com/sockjs" or "/sockjs"
//   or "https://ddp--1234-foo.meteor.com/sockjs"
function translateUrl(url, newSchemeBase, subPath) {
  if (!newSchemeBase) {
    newSchemeBase = 'http';
  }

  if (subPath !== "sockjs" && url.startsWith("/")) {
    url = Meteor.absoluteUrl(url.substr(1));
  }

  var ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
  var httpUrlMatch = url.match(/^http(s?):\/\//);
  var newScheme;

  if (ddpUrlMatch) {
    // Remove scheme and split off the host.
    var urlAfterDDP = url.substr(ddpUrlMatch[0].length);
    newScheme = ddpUrlMatch[1] === 'i' ? newSchemeBase : newSchemeBase + 's';
    var slashPos = urlAfterDDP.indexOf('/');
    var host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);
    var rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos); // In the host (ONLY!), change '*' characters into random digits. This
    // allows different stream connections to connect to different hostnames
    // and avoid browser per-hostname connection limits.

    host = host.replace(/\*/g, () => Math.floor(Math.random() * 10));
    return newScheme + '://' + host + rest;
  } else if (httpUrlMatch) {
    newScheme = !httpUrlMatch[1] ? newSchemeBase : newSchemeBase + 's';
    var urlAfterHttp = url.substr(httpUrlMatch[0].length);
    url = newScheme + '://' + urlAfterHttp;
  } // Prefix FQDNs but not relative URLs


  if (url.indexOf('://') === -1 && !url.startsWith('/')) {
    url = newSchemeBase + '://' + url;
  } // XXX This is not what we should be doing: if I have a site
  // deployed at "/foo", then DDP.connect("/") should actually connect
  // to "/", not to "/foo". "/" is an absolute path. (Contrast: if
  // deployed at "/foo", it would be reasonable for DDP.connect("bar")
  // to connect to "/foo/bar").
  //
  // We should make this properly honor absolute paths rather than
  // forcing the path to be relative to the site root. Simultaneously,
  // we should set DDP_DEFAULT_CONNECTION_URL to include the site
  // root. See also client_convenience.js #RationalizingRelativeDDPURLs


  url = Meteor._relativeToSiteRootUrl(url);
  if (url.endsWith('/')) return url + subPath;else return url + '/' + subPath;
}

function toSockjsUrl(url) {
  return translateUrl(url, 'http', 'sockjs');
}

function toWebsocketUrl(url) {
  return translateUrl(url, 'ws', 'websocket');
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

/* Exports */
Package._define("socket-stream-client");

})();

//# sourceURL=meteor://💻app/packages/socket-stream-client.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc29ja2V0LXN0cmVhbS1jbGllbnQvbm9kZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc29ja2V0LXN0cmVhbS1jbGllbnQvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC91cmxzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZTEiLCJtb2R1bGUiLCJleHBvcnQiLCJDbGllbnRTdHJlYW0iLCJNZXRlb3IiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwidG9XZWJzb2NrZXRVcmwiLCJTdHJlYW1DbGllbnRDb21tb24iLCJjb25zdHJ1Y3RvciIsImVuZHBvaW50Iiwib3B0aW9ucyIsImNsaWVudCIsImhlYWRlcnMiLCJPYmplY3QiLCJjcmVhdGUiLCJucG1GYXllT3B0aW9ucyIsIl9pbml0Q29tbW9uIiwiX2xhdW5jaENvbm5lY3Rpb24iLCJzZW5kIiwiZGF0YSIsImN1cnJlbnRTdGF0dXMiLCJjb25uZWN0ZWQiLCJfY2hhbmdlVXJsIiwidXJsIiwiX29uQ29ubmVjdCIsIkVycm9yIiwiX2ZvcmNlZFRvRGlzY29ubmVjdCIsImNsb3NlIiwiX2NsZWFyQ29ubmVjdGlvblRpbWVyIiwic3RhdHVzIiwicmV0cnlDb3VudCIsInN0YXR1c0NoYW5nZWQiLCJmb3JFYWNoQ2FsbGJhY2siLCJjYWxsYmFjayIsIl9jbGVhbnVwIiwibWF5YmVFcnJvciIsImNvbm5lY3Rpb25UaW1lciIsImNsZWFyVGltZW91dCIsIl9nZXRQcm94eVVybCIsInRhcmdldFVybCIsInByb3h5IiwicHJvY2VzcyIsImVudiIsIkhUVFBfUFJPWFkiLCJodHRwX3Byb3h5IiwibWF0Y2giLCJIVFRQU19QUk9YWSIsImh0dHBzX3Byb3h5IiwiRmF5ZVdlYlNvY2tldCIsIk5wbSIsImRlZmxhdGUiLCJmYXllT3B0aW9ucyIsImV4dGVuc2lvbnMiLCJhc3NpZ24iLCJwcm94eVVybCIsIm9yaWdpbiIsInN1YnByb3RvY29scyIsIkNsaWVudCIsInNldFRpbWVvdXQiLCJfbG9zdENvbm5lY3Rpb24iLCJDb25uZWN0aW9uRXJyb3IiLCJDT05ORUNUX1RJTUVPVVQiLCJvbiIsImJpbmRFbnZpcm9ubWVudCIsImNsaWVudE9uSWZDdXJyZW50IiwiZXZlbnQiLCJkZXNjcmlwdGlvbiIsImFyZ3MiLCJlcnJvciIsIl9kb250UHJpbnRFcnJvcnMiLCJfZGVidWciLCJtZXNzYWdlIiwiUmV0cnkiLCJmb3JjZWRSZWNvbm5lY3RFcnJvciIsInJldHJ5IiwibmFtZSIsImV2ZW50Q2FsbGJhY2tzIiwicHVzaCIsImNiIiwibGVuZ3RoIiwiZm9yRWFjaCIsImNvbm5lY3RUaW1lb3V0TXMiLCJQYWNrYWdlIiwidHJhY2tlciIsInN0YXR1c0xpc3RlbmVycyIsIlRyYWNrZXIiLCJEZXBlbmRlbmN5IiwiY2hhbmdlZCIsIl9yZXRyeSIsInJlY29ubmVjdCIsIl9zb2NranNPcHRpb25zIiwiX2ZvcmNlIiwiY2xlYXIiLCJfcmV0cnlOb3ciLCJkaXNjb25uZWN0IiwiX3Blcm1hbmVudCIsIl9lcnJvciIsInJlYXNvbiIsIl9yZXRyeUxhdGVyIiwiX29ubGluZSIsInRpbWVvdXQiLCJyZXRyeUxhdGVyIiwiYmluZCIsInJldHJ5VGltZSIsIkRhdGUiLCJnZXRUaW1lIiwiZGVwZW5kIiwidG9Tb2NranNVcmwiLCJ0cmFuc2xhdGVVcmwiLCJuZXdTY2hlbWVCYXNlIiwic3ViUGF0aCIsInN0YXJ0c1dpdGgiLCJhYnNvbHV0ZVVybCIsInN1YnN0ciIsImRkcFVybE1hdGNoIiwiaHR0cFVybE1hdGNoIiwibmV3U2NoZW1lIiwidXJsQWZ0ZXJERFAiLCJzbGFzaFBvcyIsImluZGV4T2YiLCJob3N0IiwicmVzdCIsInJlcGxhY2UiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJ1cmxBZnRlckh0dHAiLCJfcmVsYXRpdmVUb1NpdGVSb290VXJsIiwiZW5kc1dpdGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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QUMsQ0FBeEIsSUFBNkIsQ0FBQ2hHLElBQUl3RixVQUFKLENBQWUsR0FBZixDQUFsQyxFQUF1RDtBQUNyRHhGLFVBQU1zRixnQkFBZ0IsS0FBaEIsR0FBd0J0RixHQUE5QjtBQUNELEdBbkNnRCxDQXFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBQSxRQUFNckIsT0FBTzZILHNCQUFQLENBQThCeEcsR0FBOUIsQ0FBTjtBQUVBLE1BQUlBLElBQUl5RyxRQUFKLENBQWEsR0FBYixDQUFKLEVBQXVCLE9BQU96RyxNQUFNdUYsT0FBYixDQUF2QixLQUNLLE9BQU92RixNQUFNLEdBQU4sR0FBWXVGLE9BQW5CO0FBQ047O0FBRU0sU0FBU0gsV0FBVCxDQUFxQnBGLEdBQXJCLEVBQTBCO0FBQy9CLFNBQU9xRixhQUFhckYsR0FBYixFQUFrQixNQUFsQixFQUEwQixRQUExQixDQUFQO0FBQ0Q7O0FBRU0sU0FBU2pCLGNBQVQsQ0FBd0JpQixHQUF4QixFQUE2QjtBQUNsQyxTQUFPcUYsYUFBYXJGLEdBQWIsRUFBa0IsSUFBbEIsRUFBd0IsV0FBeEIsQ0FBUDtBQUNELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3NvY2tldC1zdHJlYW0tY2xpZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSBcIm1ldGVvci9tZXRlb3JcIjtcbmltcG9ydCB7IHRvV2Vic29ja2V0VXJsIH0gZnJvbSBcIi4vdXJscy5qc1wiO1xuaW1wb3J0IHsgU3RyZWFtQ2xpZW50Q29tbW9uIH0gZnJvbSBcIi4vY29tbW9uLmpzXCI7XG5cbi8vIEBwYXJhbSBlbmRwb2ludCB7U3RyaW5nfSBVUkwgdG8gTWV0ZW9yIGFwcFxuLy8gICBcImh0dHA6Ly9zdWJkb21haW4ubWV0ZW9yLmNvbS9cIiBvciBcIi9cIiBvclxuLy8gICBcImRkcCtzb2NranM6Ly9mb28tKioubWV0ZW9yLmNvbS9zb2NranNcIlxuLy9cbi8vIFdlIGRvIHNvbWUgcmV3cml0aW5nIG9mIHRoZSBVUkwgdG8gZXZlbnR1YWxseSBtYWtlIGl0IFwid3M6Ly9cIiBvciBcIndzczovL1wiLFxuLy8gd2hhdGV2ZXIgd2FzIHBhc3NlZCBpbi4gIEF0IHRoZSB2ZXJ5IGxlYXN0LCB3aGF0IE1ldGVvci5hYnNvbHV0ZVVybCgpIHJldHVybnNcbi8vIHVzIHNob3VsZCB3b3JrLlxuLy9cbi8vIFdlIGRvbid0IGRvIGFueSBoZWFydGJlYXRpbmcuIChUaGUgbG9naWMgdGhhdCBkaWQgdGhpcyBpbiBzb2NranMgd2FzIHJlbW92ZWQsXG4vLyBiZWNhdXNlIGl0IHVzZWQgYSBidWlsdC1pbiBzb2NranMgbWVjaGFuaXNtLiBXZSBjb3VsZCBkbyBpdCB3aXRoIFdlYlNvY2tldFxuLy8gcGluZyBmcmFtZXMgb3Igd2l0aCBERFAtbGV2ZWwgbWVzc2FnZXMuKVxuZXhwb3J0IGNsYXNzIENsaWVudFN0cmVhbSBleHRlbmRzIFN0cmVhbUNsaWVudENvbW1vbiB7XG4gIGNvbnN0cnVjdG9yKGVuZHBvaW50LCBvcHRpb25zKSB7XG4gICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICB0aGlzLmNsaWVudCA9IG51bGw7IC8vIGNyZWF0ZWQgaW4gX2xhdW5jaENvbm5lY3Rpb25cbiAgICB0aGlzLmVuZHBvaW50ID0gZW5kcG9pbnQ7XG5cbiAgICB0aGlzLmhlYWRlcnMgPSB0aGlzLm9wdGlvbnMuaGVhZGVycyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMubnBtRmF5ZU9wdGlvbnMgPSB0aGlzLm9wdGlvbnMubnBtRmF5ZU9wdGlvbnMgfHwgT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIHRoaXMuX2luaXRDb21tb24odGhpcy5vcHRpb25zKTtcblxuICAgIC8vLy8gS2lja29mZiFcbiAgICB0aGlzLl9sYXVuY2hDb25uZWN0aW9uKCk7XG4gIH1cblxuICAvLyBkYXRhIGlzIGEgdXRmOCBzdHJpbmcuIERhdGEgc2VudCB3aGlsZSBub3QgY29ubmVjdGVkIGlzIGRyb3BwZWQgb25cbiAgLy8gdGhlIGZsb29yLCBhbmQgaXQgaXMgdXAgdGhlIHVzZXIgb2YgdGhpcyBBUEkgdG8gcmV0cmFuc21pdCBsb3N0XG4gIC8vIG1lc3NhZ2VzIG9uICdyZXNldCdcbiAgc2VuZChkYXRhKSB7XG4gICAgaWYgKHRoaXMuY3VycmVudFN0YXR1cy5jb25uZWN0ZWQpIHtcbiAgICAgIHRoaXMuY2xpZW50LnNlbmQoZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hhbmdlcyB3aGVyZSB0aGlzIGNvbm5lY3Rpb24gcG9pbnRzXG4gIF9jaGFuZ2VVcmwodXJsKSB7XG4gICAgdGhpcy5lbmRwb2ludCA9IHVybDtcbiAgfVxuXG4gIF9vbkNvbm5lY3QoY2xpZW50KSB7XG4gICAgaWYgKGNsaWVudCAhPT0gdGhpcy5jbGllbnQpIHtcbiAgICAgIC8vIFRoaXMgY29ubmVjdGlvbiBpcyBub3QgZnJvbSB0aGUgbGFzdCBjYWxsIHRvIF9sYXVuY2hDb25uZWN0aW9uLlxuICAgICAgLy8gQnV0IF9sYXVuY2hDb25uZWN0aW9uIGNhbGxzIF9jbGVhbnVwIHdoaWNoIGNsb3NlcyBwcmV2aW91cyBjb25uZWN0aW9ucy5cbiAgICAgIC8vIEl0J3Mgb3VyIGJlbGllZiB0aGF0IHRoaXMgc3RpZmxlcyBmdXR1cmUgJ29wZW4nIGV2ZW50cywgYnV0IG1heWJlXG4gICAgICAvLyB3ZSBhcmUgd3Jvbmc/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdCBvcGVuIGZyb20gaW5hY3RpdmUgY2xpZW50ICcgKyAhIXRoaXMuY2xpZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZm9yY2VkVG9EaXNjb25uZWN0KSB7XG4gICAgICAvLyBXZSB3ZXJlIGFza2VkIHRvIGRpc2Nvbm5lY3QgYmV0d2VlbiB0cnlpbmcgdG8gb3BlbiB0aGUgY29ubmVjdGlvbiBhbmRcbiAgICAgIC8vIGFjdHVhbGx5IG9wZW5pbmcgaXQuIExldCdzIGp1c3QgcHJldGVuZCB0aGlzIG5ldmVyIGhhcHBlbmVkLlxuICAgICAgdGhpcy5jbGllbnQuY2xvc2UoKTtcbiAgICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RhdHVzLmNvbm5lY3RlZCkge1xuICAgICAgLy8gV2UgYWxyZWFkeSBoYXZlIGEgY29ubmVjdGlvbi4gSXQgbXVzdCBoYXZlIGJlZW4gdGhlIGNhc2UgdGhhdCB3ZVxuICAgICAgLy8gc3RhcnRlZCB0d28gcGFyYWxsZWwgY29ubmVjdGlvbiBhdHRlbXB0cyAoYmVjYXVzZSB3ZSB3YW50ZWQgdG9cbiAgICAgIC8vICdyZWNvbm5lY3Qgbm93JyBvbiBhIGhhbmdpbmcgY29ubmVjdGlvbiBhbmQgd2UgaGFkIG5vIHdheSB0byBjYW5jZWwgdGhlXG4gICAgICAvLyBjb25uZWN0aW9uIGF0dGVtcHQuKSBCdXQgdGhpcyBzaG91bGRuJ3QgaGFwcGVuIChzaW1pbGFybHkgdG8gdGhlIGNsaWVudFxuICAgICAgLy8gIT09IHRoaXMuY2xpZW50IGNoZWNrIGFib3ZlKS5cbiAgICAgIHRocm93IG5ldyBFcnJvcignVHdvIHBhcmFsbGVsIGNvbm5lY3Rpb25zPycpO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyQ29ubmVjdGlvblRpbWVyKCk7XG5cbiAgICAvLyB1cGRhdGUgc3RhdHVzXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLnN0YXR1cyA9ICdjb25uZWN0ZWQnO1xuICAgIHRoaXMuY3VycmVudFN0YXR1cy5jb25uZWN0ZWQgPSB0cnVlO1xuICAgIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeUNvdW50ID0gMDtcbiAgICB0aGlzLnN0YXR1c0NoYW5nZWQoKTtcblxuICAgIC8vIGZpcmUgcmVzZXRzLiBUaGlzIG11c3QgY29tZSBhZnRlciBzdGF0dXMgY2hhbmdlIHNvIHRoYXQgY2xpZW50c1xuICAgIC8vIGNhbiBjYWxsIHNlbmQgZnJvbSB3aXRoaW4gYSByZXNldCBjYWxsYmFjay5cbiAgICB0aGlzLmZvckVhY2hDYWxsYmFjaygncmVzZXQnLCBjYWxsYmFjayA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgX2NsZWFudXAobWF5YmVFcnJvcikge1xuICAgIHRoaXMuX2NsZWFyQ29ubmVjdGlvblRpbWVyKCk7XG4gICAgaWYgKHRoaXMuY2xpZW50KSB7XG4gICAgICB2YXIgY2xpZW50ID0gdGhpcy5jbGllbnQ7XG4gICAgICB0aGlzLmNsaWVudCA9IG51bGw7XG4gICAgICBjbGllbnQuY2xvc2UoKTtcblxuICAgICAgdGhpcy5mb3JFYWNoQ2FsbGJhY2soJ2Rpc2Nvbm5lY3QnLCBjYWxsYmFjayA9PiB7XG4gICAgICAgIGNhbGxiYWNrKG1heWJlRXJyb3IpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX2NsZWFyQ29ubmVjdGlvblRpbWVyKCkge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25UaW1lcikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVyKTtcbiAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBfZ2V0UHJveHlVcmwodGFyZ2V0VXJsKSB7XG4gICAgLy8gU2ltaWxhciB0byBjb2RlIGluIHRvb2xzL2h0dHAtaGVscGVycy5qcy5cbiAgICB2YXIgcHJveHkgPSBwcm9jZXNzLmVudi5IVFRQX1BST1hZIHx8IHByb2Nlc3MuZW52Lmh0dHBfcHJveHkgfHwgbnVsbDtcbiAgICAvLyBpZiB3ZSdyZSBnb2luZyB0byBhIHNlY3VyZSB1cmwsIHRyeSB0aGUgaHR0cHNfcHJveHkgZW52IHZhcmlhYmxlIGZpcnN0LlxuICAgIGlmICh0YXJnZXRVcmwubWF0Y2goL153c3M6LykpIHtcbiAgICAgIHByb3h5ID0gcHJvY2Vzcy5lbnYuSFRUUFNfUFJPWFkgfHwgcHJvY2Vzcy5lbnYuaHR0cHNfcHJveHkgfHwgcHJveHk7XG4gICAgfVxuICAgIHJldHVybiBwcm94eTtcbiAgfVxuXG4gIF9sYXVuY2hDb25uZWN0aW9uKCkge1xuICAgIHRoaXMuX2NsZWFudXAoKTsgLy8gY2xlYW51cCB0aGUgb2xkIHNvY2tldCwgaWYgdGhlcmUgd2FzIG9uZS5cblxuICAgIC8vIFNpbmNlIHNlcnZlci10by1zZXJ2ZXIgRERQIGlzIHN0aWxsIGFuIGV4cGVyaW1lbnRhbCBmZWF0dXJlLCB3ZSBvbmx5XG4gICAgLy8gcmVxdWlyZSB0aGUgbW9kdWxlIGlmIHdlIGFjdHVhbGx5IGNyZWF0ZSBhIHNlcnZlci10by1zZXJ2ZXJcbiAgICAvLyBjb25uZWN0aW9uLlxuICAgIHZhciBGYXllV2ViU29ja2V0ID0gTnBtLnJlcXVpcmUoJ2ZheWUtd2Vic29ja2V0Jyk7XG4gICAgdmFyIGRlZmxhdGUgPSBOcG0ucmVxdWlyZSgncGVybWVzc2FnZS1kZWZsYXRlJyk7XG5cbiAgICB2YXIgdGFyZ2V0VXJsID0gdG9XZWJzb2NrZXRVcmwodGhpcy5lbmRwb2ludCk7XG4gICAgdmFyIGZheWVPcHRpb25zID0ge1xuICAgICAgaGVhZGVyczogdGhpcy5oZWFkZXJzLFxuICAgICAgZXh0ZW5zaW9uczogW2RlZmxhdGVdXG4gICAgfTtcbiAgICBmYXllT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oZmF5ZU9wdGlvbnMsIHRoaXMubnBtRmF5ZU9wdGlvbnMpO1xuICAgIHZhciBwcm94eVVybCA9IHRoaXMuX2dldFByb3h5VXJsKHRhcmdldFVybCk7XG4gICAgaWYgKHByb3h5VXJsKSB7XG4gICAgICBmYXllT3B0aW9ucy5wcm94eSA9IHsgb3JpZ2luOiBwcm94eVVybCB9O1xuICAgIH1cblxuICAgIC8vIFdlIHdvdWxkIGxpa2UgdG8gc3BlY2lmeSAnZGRwJyBhcyB0aGUgc3VicHJvdG9jb2wgaGVyZS4gVGhlIG5wbSBtb2R1bGUgd2VcbiAgICAvLyB1c2VkIHRvIHVzZSBhcyBhIGNsaWVudCB3b3VsZCBmYWlsIHRoZSBoYW5kc2hha2UgaWYgd2UgYXNrIGZvciBhXG4gICAgLy8gc3VicHJvdG9jb2wgYW5kIHRoZSBzZXJ2ZXIgZG9lc24ndCBzZW5kIG9uZSBiYWNrIChhbmQgc29ja2pzIGRvZXNuJ3QpLlxuICAgIC8vIEZheWUgZG9lc24ndCBoYXZlIHRoYXQgYmVoYXZpb3I7IGl0J3MgdW5jbGVhciBmcm9tIHJlYWRpbmcgUkZDIDY0NTUgaWZcbiAgICAvLyBGYXllIGlzIGVycm9uZW91cyBvciBub3QuICBTbyBmb3Igbm93LCB3ZSBkb24ndCBzcGVjaWZ5IHByb3RvY29scy5cbiAgICB2YXIgc3VicHJvdG9jb2xzID0gW107XG5cbiAgICB2YXIgY2xpZW50ID0gKHRoaXMuY2xpZW50ID0gbmV3IEZheWVXZWJTb2NrZXQuQ2xpZW50KFxuICAgICAgdGFyZ2V0VXJsLFxuICAgICAgc3VicHJvdG9jb2xzLFxuICAgICAgZmF5ZU9wdGlvbnNcbiAgICApKTtcblxuICAgIHRoaXMuX2NsZWFyQ29ubmVjdGlvblRpbWVyKCk7XG4gICAgdGhpcy5jb25uZWN0aW9uVGltZXIgPSBNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl9sb3N0Q29ubmVjdGlvbihuZXcgdGhpcy5Db25uZWN0aW9uRXJyb3IoJ0REUCBjb25uZWN0aW9uIHRpbWVkIG91dCcpKTtcbiAgICB9LCB0aGlzLkNPTk5FQ1RfVElNRU9VVCk7XG5cbiAgICB0aGlzLmNsaWVudC5vbihcbiAgICAgICdvcGVuJyxcbiAgICAgIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fb25Db25uZWN0KGNsaWVudCk7XG4gICAgICB9LCAnc3RyZWFtIGNvbm5lY3QgY2FsbGJhY2snKVxuICAgICk7XG5cbiAgICB2YXIgY2xpZW50T25JZkN1cnJlbnQgPSAoZXZlbnQsIGRlc2NyaXB0aW9uLCBjYWxsYmFjaykgPT4ge1xuICAgICAgdGhpcy5jbGllbnQub24oXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBNZXRlb3IuYmluZEVudmlyb25tZW50KCguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgLy8gSWdub3JlIGV2ZW50cyBmcm9tIGFueSBjb25uZWN0aW9uIHdlJ3ZlIGFscmVhZHkgY2xlYW5lZCB1cC5cbiAgICAgICAgICBpZiAoY2xpZW50ICE9PSB0aGlzLmNsaWVudCkgcmV0dXJuO1xuICAgICAgICAgIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgICAgICB9LCBkZXNjcmlwdGlvbilcbiAgICAgICk7XG4gICAgfTtcblxuICAgIGNsaWVudE9uSWZDdXJyZW50KCdlcnJvcicsICdzdHJlYW0gZXJyb3IgY2FsbGJhY2snLCBlcnJvciA9PiB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5fZG9udFByaW50RXJyb3JzKVxuICAgICAgICBNZXRlb3IuX2RlYnVnKCdzdHJlYW0gZXJyb3InLCBlcnJvci5tZXNzYWdlKTtcblxuICAgICAgLy8gRmF5ZSdzICdlcnJvcicgb2JqZWN0IGlzIG5vdCBhIEpTIGVycm9yIChhbmQgYW1vbmcgb3RoZXIgdGhpbmdzLFxuICAgICAgLy8gZG9lc24ndCBzdHJpbmdpZnkgd2VsbCkuIENvbnZlcnQgaXQgdG8gb25lLlxuICAgICAgdGhpcy5fbG9zdENvbm5lY3Rpb24obmV3IHRoaXMuQ29ubmVjdGlvbkVycm9yKGVycm9yLm1lc3NhZ2UpKTtcbiAgICB9KTtcblxuICAgIGNsaWVudE9uSWZDdXJyZW50KCdjbG9zZScsICdzdHJlYW0gY2xvc2UgY2FsbGJhY2snLCAoKSA9PiB7XG4gICAgICB0aGlzLl9sb3N0Q29ubmVjdGlvbigpO1xuICAgIH0pO1xuXG4gICAgY2xpZW50T25JZkN1cnJlbnQoJ21lc3NhZ2UnLCAnc3RyZWFtIG1lc3NhZ2UgY2FsbGJhY2snLCBtZXNzYWdlID0+IHtcbiAgICAgIC8vIElnbm9yZSBiaW5hcnkgZnJhbWVzLCB3aGVyZSBtZXNzYWdlLmRhdGEgaXMgYSBCdWZmZXJcbiAgICAgIGlmICh0eXBlb2YgbWVzc2FnZS5kYXRhICE9PSAnc3RyaW5nJykgcmV0dXJuO1xuXG4gICAgICB0aGlzLmZvckVhY2hDYWxsYmFjaygnbWVzc2FnZScsIGNhbGxiYWNrID0+IHtcbiAgICAgICAgY2FsbGJhY2sobWVzc2FnZS5kYXRhKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBSZXRyeSB9IGZyb20gJ21ldGVvci9yZXRyeSc7XG5cbmNvbnN0IGZvcmNlZFJlY29ubmVjdEVycm9yID0gbmV3IEVycm9yKFwiZm9yY2VkIHJlY29ubmVjdFwiKTtcblxuZXhwb3J0IGNsYXNzIFN0cmVhbUNsaWVudENvbW1vbiB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICByZXRyeTogdHJ1ZSxcbiAgICAgIC4uLihvcHRpb25zIHx8IG51bGwpLFxuICAgIH07XG5cbiAgICB0aGlzLkNvbm5lY3Rpb25FcnJvciA9XG4gICAgICBvcHRpb25zICYmIG9wdGlvbnMuQ29ubmVjdGlvbkVycm9yIHx8IEVycm9yO1xuICB9XG5cbiAgLy8gUmVnaXN0ZXIgZm9yIGNhbGxiYWNrcy5cbiAgb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAobmFtZSAhPT0gJ21lc3NhZ2UnICYmIG5hbWUgIT09ICdyZXNldCcgJiYgbmFtZSAhPT0gJ2Rpc2Nvbm5lY3QnKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGV2ZW50IHR5cGU6ICcgKyBuYW1lKTtcblxuICAgIGlmICghdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXSkgdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXSA9IFtdO1xuICAgIHRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBmb3JFYWNoQ2FsbGJhY2sobmFtZSwgY2IpIHtcbiAgICBpZiAoIXRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0gfHwgIXRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0ubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXS5mb3JFYWNoKGNiKTtcbiAgfVxuXG4gIF9pbml0Q29tbW9uKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgLy8vLyBDb25zdGFudHNcblxuICAgIC8vIGhvdyBsb25nIHRvIHdhaXQgdW50aWwgd2UgZGVjbGFyZSB0aGUgY29ubmVjdGlvbiBhdHRlbXB0XG4gICAgLy8gZmFpbGVkLlxuICAgIHRoaXMuQ09OTkVDVF9USU1FT1VUID0gb3B0aW9ucy5jb25uZWN0VGltZW91dE1zIHx8IDEwMDAwO1xuXG4gICAgdGhpcy5ldmVudENhbGxiYWNrcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7IC8vIG5hbWUgLT4gW2NhbGxiYWNrXVxuXG4gICAgdGhpcy5fZm9yY2VkVG9EaXNjb25uZWN0ID0gZmFsc2U7XG5cbiAgICAvLy8vIFJlYWN0aXZlIHN0YXR1c1xuICAgIHRoaXMuY3VycmVudFN0YXR1cyA9IHtcbiAgICAgIHN0YXR1czogJ2Nvbm5lY3RpbmcnLFxuICAgICAgY29ubmVjdGVkOiBmYWxzZSxcbiAgICAgIHJldHJ5Q291bnQ6IDBcbiAgICB9O1xuXG4gICAgaWYgKFBhY2thZ2UudHJhY2tlcikge1xuICAgICAgdGhpcy5zdGF0dXNMaXN0ZW5lcnMgPSBuZXcgUGFja2FnZS50cmFja2VyLlRyYWNrZXIuRGVwZW5kZW5jeSgpO1xuICAgIH1cblxuICAgIHRoaXMuc3RhdHVzQ2hhbmdlZCA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLnN0YXR1c0xpc3RlbmVycykge1xuICAgICAgICB0aGlzLnN0YXR1c0xpc3RlbmVycy5jaGFuZ2VkKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vLy8gUmV0cnkgbG9naWNcbiAgICB0aGlzLl9yZXRyeSA9IG5ldyBSZXRyeSgpO1xuICAgIHRoaXMuY29ubmVjdGlvblRpbWVyID0gbnVsbDtcbiAgfVxuXG4gIC8vIFRyaWdnZXIgYSByZWNvbm5lY3QuXG4gIHJlY29ubmVjdChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIGlmIChvcHRpb25zLnVybCkge1xuICAgICAgdGhpcy5fY2hhbmdlVXJsKG9wdGlvbnMudXJsKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5fc29ja2pzT3B0aW9ucykge1xuICAgICAgdGhpcy5vcHRpb25zLl9zb2NranNPcHRpb25zID0gb3B0aW9ucy5fc29ja2pzT3B0aW9ucztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RhdHVzLmNvbm5lY3RlZCkge1xuICAgICAgaWYgKG9wdGlvbnMuX2ZvcmNlIHx8IG9wdGlvbnMudXJsKSB7XG4gICAgICAgIHRoaXMuX2xvc3RDb25uZWN0aW9uKGZvcmNlZFJlY29ubmVjdEVycm9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSdyZSBtaWQtY29ubmVjdGlvbiwgc3RvcCBpdC5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RhdHVzLnN0YXR1cyA9PT0gJ2Nvbm5lY3RpbmcnKSB7XG4gICAgICAvLyBQcmV0ZW5kIGl0J3MgYSBjbGVhbiBjbG9zZS5cbiAgICAgIHRoaXMuX2xvc3RDb25uZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcmV0cnkuY2xlYXIoKTtcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMucmV0cnlDb3VudCAtPSAxOyAvLyBkb24ndCBjb3VudCBtYW51YWwgcmV0cmllc1xuICAgIHRoaXMuX3JldHJ5Tm93KCk7XG4gIH1cblxuICBkaXNjb25uZWN0KG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgLy8gRmFpbGVkIGlzIHBlcm1hbmVudC4gSWYgd2UncmUgZmFpbGVkLCBkb24ndCBsZXQgcGVvcGxlIGdvIGJhY2tcbiAgICAvLyBvbmxpbmUgYnkgY2FsbGluZyAnZGlzY29ubmVjdCcgdGhlbiAncmVjb25uZWN0Jy5cbiAgICBpZiAodGhpcy5fZm9yY2VkVG9EaXNjb25uZWN0KSByZXR1cm47XG5cbiAgICAvLyBJZiBfcGVybWFuZW50IGlzIHNldCwgcGVybWFuZW50bHkgZGlzY29ubmVjdCBhIHN0cmVhbS4gT25jZSBhIHN0cmVhbVxuICAgIC8vIGlzIGZvcmNlZCB0byBkaXNjb25uZWN0LCBpdCBjYW4gbmV2ZXIgcmVjb25uZWN0LiBUaGlzIGlzIGZvclxuICAgIC8vIGVycm9yIGNhc2VzIHN1Y2ggYXMgZGRwIHZlcnNpb24gbWlzbWF0Y2gsIHdoZXJlIHRyeWluZyBhZ2FpblxuICAgIC8vIHdvbid0IGZpeCB0aGUgcHJvYmxlbS5cbiAgICBpZiAob3B0aW9ucy5fcGVybWFuZW50KSB7XG4gICAgICB0aGlzLl9mb3JjZWRUb0Rpc2Nvbm5lY3QgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFudXAoKTtcbiAgICB0aGlzLl9yZXRyeS5jbGVhcigpO1xuXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzID0ge1xuICAgICAgc3RhdHVzOiBvcHRpb25zLl9wZXJtYW5lbnQgPyAnZmFpbGVkJyA6ICdvZmZsaW5lJyxcbiAgICAgIGNvbm5lY3RlZDogZmFsc2UsXG4gICAgICByZXRyeUNvdW50OiAwXG4gICAgfTtcblxuICAgIGlmIChvcHRpb25zLl9wZXJtYW5lbnQgJiYgb3B0aW9ucy5fZXJyb3IpXG4gICAgICB0aGlzLmN1cnJlbnRTdGF0dXMucmVhc29uID0gb3B0aW9ucy5fZXJyb3I7XG5cbiAgICB0aGlzLnN0YXR1c0NoYW5nZWQoKTtcbiAgfVxuXG4gIC8vIG1heWJlRXJyb3IgaXMgc2V0IHVubGVzcyBpdCdzIGEgY2xlYW4gcHJvdG9jb2wtbGV2ZWwgY2xvc2UuXG4gIF9sb3N0Q29ubmVjdGlvbihtYXliZUVycm9yKSB7XG4gICAgdGhpcy5fY2xlYW51cChtYXliZUVycm9yKTtcbiAgICB0aGlzLl9yZXRyeUxhdGVyKG1heWJlRXJyb3IpOyAvLyBzZXRzIHN0YXR1cy4gbm8gbmVlZCB0byBkbyBpdCBoZXJlLlxuICB9XG5cbiAgLy8gZmlyZWQgd2hlbiB3ZSBkZXRlY3QgdGhhdCB3ZSd2ZSBnb25lIG9ubGluZS4gdHJ5IHRvIHJlY29ubmVjdFxuICAvLyBpbW1lZGlhdGVseS5cbiAgX29ubGluZSgpIHtcbiAgICAvLyBpZiB3ZSd2ZSByZXF1ZXN0ZWQgdG8gYmUgb2ZmbGluZSBieSBkaXNjb25uZWN0aW5nLCBkb24ndCByZWNvbm5lY3QuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0YXR1cy5zdGF0dXMgIT0gJ29mZmxpbmUnKSB0aGlzLnJlY29ubmVjdCgpO1xuICB9XG5cbiAgX3JldHJ5TGF0ZXIobWF5YmVFcnJvcikge1xuICAgIHZhciB0aW1lb3V0ID0gMDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnJldHJ5IHx8XG4gICAgICAgIG1heWJlRXJyb3IgPT09IGZvcmNlZFJlY29ubmVjdEVycm9yKSB7XG4gICAgICB0aW1lb3V0ID0gdGhpcy5fcmV0cnkucmV0cnlMYXRlcihcbiAgICAgICAgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5Q291bnQsXG4gICAgICAgIHRoaXMuX3JldHJ5Tm93LmJpbmQodGhpcylcbiAgICAgICk7XG4gICAgICB0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID0gJ3dhaXRpbmcnO1xuICAgICAgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgdGltZW91dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jdXJyZW50U3RhdHVzLnN0YXR1cyA9ICdmYWlsZWQnO1xuICAgICAgZGVsZXRlIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeVRpbWU7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuc3RhdHVzQ2hhbmdlZCgpO1xuICB9XG5cbiAgX3JldHJ5Tm93KCkge1xuICAgIGlmICh0aGlzLl9mb3JjZWRUb0Rpc2Nvbm5lY3QpIHJldHVybjtcblxuICAgIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeUNvdW50ICs9IDE7XG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLnN0YXR1cyA9ICdjb25uZWN0aW5nJztcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgZGVsZXRlIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeVRpbWU7XG4gICAgdGhpcy5zdGF0dXNDaGFuZ2VkKCk7XG5cbiAgICB0aGlzLl9sYXVuY2hDb25uZWN0aW9uKCk7XG4gIH1cblxuICAvLyBHZXQgY3VycmVudCBzdGF0dXMuIFJlYWN0aXZlLlxuICBzdGF0dXMoKSB7XG4gICAgaWYgKHRoaXMuc3RhdHVzTGlzdGVuZXJzKSB7XG4gICAgICB0aGlzLnN0YXR1c0xpc3RlbmVycy5kZXBlbmQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN0YXR1cztcbiAgfVxufVxuIiwiLy8gQHBhcmFtIHVybCB7U3RyaW5nfSBVUkwgdG8gTWV0ZW9yIGFwcCwgZWc6XG4vLyAgIFwiL1wiIG9yIFwibWFkZXdpdGgubWV0ZW9yLmNvbVwiIG9yIFwiaHR0cHM6Ly9mb28ubWV0ZW9yLmNvbVwiXG4vLyAgIG9yIFwiZGRwK3NvY2tqczovL2RkcC0tKioqKi1mb28ubWV0ZW9yLmNvbS9zb2NranNcIlxuLy8gQHJldHVybnMge1N0cmluZ30gVVJMIHRvIHRoZSBlbmRwb2ludCB3aXRoIHRoZSBzcGVjaWZpYyBzY2hlbWUgYW5kIHN1YlBhdGgsIGUuZy5cbi8vIGZvciBzY2hlbWUgXCJodHRwXCIgYW5kIHN1YlBhdGggXCJzb2NranNcIlxuLy8gICBcImh0dHA6Ly9zdWJkb21haW4ubWV0ZW9yLmNvbS9zb2NranNcIiBvciBcIi9zb2NranNcIlxuLy8gICBvciBcImh0dHBzOi8vZGRwLS0xMjM0LWZvby5tZXRlb3IuY29tL3NvY2tqc1wiXG5mdW5jdGlvbiB0cmFuc2xhdGVVcmwodXJsLCBuZXdTY2hlbWVCYXNlLCBzdWJQYXRoKSB7XG4gIGlmICghbmV3U2NoZW1lQmFzZSkge1xuICAgIG5ld1NjaGVtZUJhc2UgPSAnaHR0cCc7XG4gIH1cblxuICBpZiAoc3ViUGF0aCAhPT0gXCJzb2NranNcIiAmJiB1cmwuc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICB1cmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwodXJsLnN1YnN0cigxKSk7XG4gIH1cblxuICB2YXIgZGRwVXJsTWF0Y2ggPSB1cmwubWF0Y2goL15kZHAoaT8pXFwrc29ja2pzOlxcL1xcLy8pO1xuICB2YXIgaHR0cFVybE1hdGNoID0gdXJsLm1hdGNoKC9eaHR0cChzPyk6XFwvXFwvLyk7XG4gIHZhciBuZXdTY2hlbWU7XG4gIGlmIChkZHBVcmxNYXRjaCkge1xuICAgIC8vIFJlbW92ZSBzY2hlbWUgYW5kIHNwbGl0IG9mZiB0aGUgaG9zdC5cbiAgICB2YXIgdXJsQWZ0ZXJERFAgPSB1cmwuc3Vic3RyKGRkcFVybE1hdGNoWzBdLmxlbmd0aCk7XG4gICAgbmV3U2NoZW1lID0gZGRwVXJsTWF0Y2hbMV0gPT09ICdpJyA/IG5ld1NjaGVtZUJhc2UgOiBuZXdTY2hlbWVCYXNlICsgJ3MnO1xuICAgIHZhciBzbGFzaFBvcyA9IHVybEFmdGVyRERQLmluZGV4T2YoJy8nKTtcbiAgICB2YXIgaG9zdCA9IHNsYXNoUG9zID09PSAtMSA/IHVybEFmdGVyRERQIDogdXJsQWZ0ZXJERFAuc3Vic3RyKDAsIHNsYXNoUG9zKTtcbiAgICB2YXIgcmVzdCA9IHNsYXNoUG9zID09PSAtMSA/ICcnIDogdXJsQWZ0ZXJERFAuc3Vic3RyKHNsYXNoUG9zKTtcblxuICAgIC8vIEluIHRoZSBob3N0IChPTkxZISksIGNoYW5nZSAnKicgY2hhcmFjdGVycyBpbnRvIHJhbmRvbSBkaWdpdHMuIFRoaXNcbiAgICAvLyBhbGxvd3MgZGlmZmVyZW50IHN0cmVhbSBjb25uZWN0aW9ucyB0byBjb25uZWN0IHRvIGRpZmZlcmVudCBob3N0bmFtZXNcbiAgICAvLyBhbmQgYXZvaWQgYnJvd3NlciBwZXItaG9zdG5hbWUgY29ubmVjdGlvbiBsaW1pdHMuXG4gICAgaG9zdCA9IGhvc3QucmVwbGFjZSgvXFwqL2csICgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSk7XG5cbiAgICByZXR1cm4gbmV3U2NoZW1lICsgJzovLycgKyBob3N0ICsgcmVzdDtcbiAgfSBlbHNlIGlmIChodHRwVXJsTWF0Y2gpIHtcbiAgICBuZXdTY2hlbWUgPSAhaHR0cFVybE1hdGNoWzFdID8gbmV3U2NoZW1lQmFzZSA6IG5ld1NjaGVtZUJhc2UgKyAncyc7XG4gICAgdmFyIHVybEFmdGVySHR0cCA9IHVybC5zdWJzdHIoaHR0cFVybE1hdGNoWzBdLmxlbmd0aCk7XG4gICAgdXJsID0gbmV3U2NoZW1lICsgJzovLycgKyB1cmxBZnRlckh0dHA7XG4gIH1cblxuICAvLyBQcmVmaXggRlFETnMgYnV0IG5vdCByZWxhdGl2ZSBVUkxzXG4gIGlmICh1cmwuaW5kZXhPZignOi8vJykgPT09IC0xICYmICF1cmwuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgdXJsID0gbmV3U2NoZW1lQmFzZSArICc6Ly8nICsgdXJsO1xuICB9XG5cbiAgLy8gWFhYIFRoaXMgaXMgbm90IHdoYXQgd2Ugc2hvdWxkIGJlIGRvaW5nOiBpZiBJIGhhdmUgYSBzaXRlXG4gIC8vIGRlcGxveWVkIGF0IFwiL2Zvb1wiLCB0aGVuIEREUC5jb25uZWN0KFwiL1wiKSBzaG91bGQgYWN0dWFsbHkgY29ubmVjdFxuICAvLyB0byBcIi9cIiwgbm90IHRvIFwiL2Zvb1wiLiBcIi9cIiBpcyBhbiBhYnNvbHV0ZSBwYXRoLiAoQ29udHJhc3Q6IGlmXG4gIC8vIGRlcGxveWVkIGF0IFwiL2Zvb1wiLCBpdCB3b3VsZCBiZSByZWFzb25hYmxlIGZvciBERFAuY29ubmVjdChcImJhclwiKVxuICAvLyB0byBjb25uZWN0IHRvIFwiL2Zvby9iYXJcIikuXG4gIC8vXG4gIC8vIFdlIHNob3VsZCBtYWtlIHRoaXMgcHJvcGVybHkgaG9ub3IgYWJzb2x1dGUgcGF0aHMgcmF0aGVyIHRoYW5cbiAgLy8gZm9yY2luZyB0aGUgcGF0aCB0byBiZSByZWxhdGl2ZSB0byB0aGUgc2l0ZSByb290LiBTaW11bHRhbmVvdXNseSxcbiAgLy8gd2Ugc2hvdWxkIHNldCBERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCB0byBpbmNsdWRlIHRoZSBzaXRlXG4gIC8vIHJvb3QuIFNlZSBhbHNvIGNsaWVudF9jb252ZW5pZW5jZS5qcyAjUmF0aW9uYWxpemluZ1JlbGF0aXZlRERQVVJMc1xuICB1cmwgPSBNZXRlb3IuX3JlbGF0aXZlVG9TaXRlUm9vdFVybCh1cmwpO1xuXG4gIGlmICh1cmwuZW5kc1dpdGgoJy8nKSkgcmV0dXJuIHVybCArIHN1YlBhdGg7XG4gIGVsc2UgcmV0dXJuIHVybCArICcvJyArIHN1YlBhdGg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1NvY2tqc1VybCh1cmwpIHtcbiAgcmV0dXJuIHRyYW5zbGF0ZVVybCh1cmwsICdodHRwJywgJ3NvY2tqcycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9XZWJzb2NrZXRVcmwodXJsKSB7XG4gIHJldHVybiB0cmFuc2xhdGVVcmwodXJsLCAnd3MnLCAnd2Vic29ja2V0Jyk7XG59XG4iXX0=

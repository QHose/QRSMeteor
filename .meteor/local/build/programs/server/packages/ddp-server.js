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
var Retry = Package.retry.Retry;
var MongoID = Package['mongo-id'].MongoID;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPCommon = Package['ddp-common'].DDPCommon;
var DDP = Package['ddp-client'].DDP;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var Hook = Package['callback-hook'].Hook;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var StreamServer, DDPServer, Server;

var require = meteorInstall({"node_modules":{"meteor":{"ddp-server":{"stream_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/stream_server.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var url = Npm.require('url'); // By default, we use the permessage-deflate extension with default
// configuration. If $SERVER_WEBSOCKET_COMPRESSION is set, then it must be valid
// JSON. If it represents a falsey value, then we do not use permessage-deflate
// at all; otherwise, the JSON value is used as an argument to deflate's
// configure method; see
// https://github.com/faye/permessage-deflate-node/blob/master/README.md
//
// (We do this in an _.once instead of at startup, because we don't want to
// crash the tool during isopacket load if your JSON doesn't parse. This is only
// a problem because the tool has to load the DDP server code just in order to
// be a DDP client; see https://github.com/meteor/meteor/issues/3452 .)


var websocketExtensions = _.once(function () {
  var extensions = [];
  var websocketCompressionConfig = process.env.SERVER_WEBSOCKET_COMPRESSION ? JSON.parse(process.env.SERVER_WEBSOCKET_COMPRESSION) : {};

  if (websocketCompressionConfig) {
    extensions.push(Npm.require('permessage-deflate').configure(websocketCompressionConfig));
  }

  return extensions;
});

var pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "";

StreamServer = function () {
  var self = this;
  self.registration_callbacks = [];
  self.open_sockets = []; // Because we are installing directly onto WebApp.httpServer instead of using
  // WebApp.app, we have to process the path prefix ourselves.

  self.prefix = pathPrefix + '/sockjs';
  RoutePolicy.declare(self.prefix + '/', 'network'); // set up sockjs

  var sockjs = Npm.require('sockjs');

  var serverOptions = {
    prefix: self.prefix,
    log: function () {},
    // this is the default, but we code it explicitly because we depend
    // on it in stream_client:HEARTBEAT_TIMEOUT
    heartbeat_delay: 45000,
    // The default disconnect_delay is 5 seconds, but if the server ends up CPU
    // bound for that much time, SockJS might not notice that the user has
    // reconnected because the timer (of disconnect_delay ms) can fire before
    // SockJS processes the new connection. Eventually we'll fix this by not
    // combining CPU-heavy processing with SockJS termination (eg a proxy which
    // converts to Unix sockets) but for now, raise the delay.
    disconnect_delay: 60 * 1000,
    // Set the USE_JSESSIONID environment variable to enable setting the
    // JSESSIONID cookie. This is useful for setting up proxies with
    // session affinity.
    jsessionid: !!process.env.USE_JSESSIONID
  }; // If you know your server environment (eg, proxies) will prevent websockets
  // from ever working, set $DISABLE_WEBSOCKETS and SockJS clients (ie,
  // browsers) will not waste time attempting to use them.
  // (Your server will still have a /websocket endpoint.)

  if (process.env.DISABLE_WEBSOCKETS) {
    serverOptions.websocket = false;
  } else {
    serverOptions.faye_server_options = {
      extensions: websocketExtensions()
    };
  }

  self.server = sockjs.createServer(serverOptions); // Install the sockjs handlers, but we want to keep around our own particular
  // request handler that adjusts idle timeouts while we have an outstanding
  // request.  This compensates for the fact that sockjs removes all listeners
  // for "request" to add its own.

  WebApp.httpServer.removeListener('request', WebApp._timeoutAdjustmentRequestCallback);
  self.server.installHandlers(WebApp.httpServer);
  WebApp.httpServer.addListener('request', WebApp._timeoutAdjustmentRequestCallback); // Support the /websocket endpoint

  self._redirectWebsocketEndpoint();

  self.server.on('connection', function (socket) {
    // We want to make sure that if a client connects to us and does the initial
    // Websocket handshake but never gets to the DDP handshake, that we
    // eventually kill the socket.  Once the DDP handshake happens, DDP
    // heartbeating will work. And before the Websocket handshake, the timeouts
    // we set at the server level in webapp_server.js will work. But
    // faye-websocket calls setTimeout(0) on any socket it takes over, so there
    // is an "in between" state where this doesn't happen.  We work around this
    // by explicitly setting the socket timeout to a relatively large time here,
    // and setting it back to zero when we set up the heartbeat in
    // livedata_server.js.
    socket.setWebsocketTimeout = function (timeout) {
      if ((socket.protocol === 'websocket' || socket.protocol === 'websocket-raw') && socket._session.recv) {
        socket._session.recv.connection.setTimeout(timeout);
      }
    };

    socket.setWebsocketTimeout(45 * 1000);

    socket.send = function (data) {
      socket.write(data);
    };

    socket.on('close', function () {
      self.open_sockets = _.without(self.open_sockets, socket);
    });
    self.open_sockets.push(socket); // XXX COMPAT WITH 0.6.6. Send the old style welcome message, which
    // will force old clients to reload. Remove this once we're not
    // concerned about people upgrading from a pre-0.7.0 release. Also,
    // remove the clause in the client that ignores the welcome message
    // (livedata_connection.js)

    socket.send(JSON.stringify({
      server_id: "0"
    })); // call all our callbacks when we get a new socket. they will do the
    // work of setting up handlers and such for specific messages.

    _.each(self.registration_callbacks, function (callback) {
      callback(socket);
    });
  });
};

_.extend(StreamServer.prototype, {
  // call my callback when a new socket connects.
  // also call it for all current connections.
  register: function (callback) {
    var self = this;
    self.registration_callbacks.push(callback);

    _.each(self.all_sockets(), function (socket) {
      callback(socket);
    });
  },
  // get a list of all sockets
  all_sockets: function () {
    var self = this;
    return _.values(self.open_sockets);
  },
  // Redirect /websocket to /sockjs/websocket in order to not expose
  // sockjs to clients that want to use raw websockets
  _redirectWebsocketEndpoint: function () {
    var self = this; // Unfortunately we can't use a connect middleware here since
    // sockjs installs itself prior to all existing listeners
    // (meaning prior to any connect middlewares) so we need to take
    // an approach similar to overshadowListeners in
    // https://github.com/sockjs/sockjs-node/blob/cf820c55af6a9953e16558555a31decea554f70e/src/utils.coffee

    _.each(['request', 'upgrade'], function (event) {
      var httpServer = WebApp.httpServer;
      var oldHttpServerListeners = httpServer.listeners(event).slice(0);
      httpServer.removeAllListeners(event); // request and upgrade have different arguments passed but
      // we only care about the first one which is always request

      var newListener = function (request
      /*, moreArguments */
      ) {
        // Store arguments for use within the closure below
        var args = arguments; // Rewrite /websocket and /websocket/ urls to /sockjs/websocket while
        // preserving query string.

        var parsedUrl = url.parse(request.url);

        if (parsedUrl.pathname === pathPrefix + '/websocket' || parsedUrl.pathname === pathPrefix + '/websocket/') {
          parsedUrl.pathname = self.prefix + '/websocket';
          request.url = url.format(parsedUrl);
        }

        _.each(oldHttpServerListeners, function (oldListener) {
          oldListener.apply(httpServer, args);
        });
      };

      httpServer.addListener(event, newListener);
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livedata_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/livedata_server.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
DDPServer = {};

var Fiber = Npm.require('fibers'); // This file contains classes:
// * Session - The server's connection to a single DDP client
// * Subscription - A single subscription for a single client
// * Server - An entire server that may talk to > 1 client. A DDP endpoint.
//
// Session and Subscription are file scope. For now, until we freeze
// the interface, Server is package scope (in the future it should be
// exported.)
// Represents a single document in a SessionCollectionView


var SessionDocumentView = function () {
  var self = this;
  self.existsIn = {}; // set of subscriptionHandle

  self.dataByKey = {}; // key-> [ {subscriptionHandle, value} by precedence]
};

DDPServer._SessionDocumentView = SessionDocumentView;

_.extend(SessionDocumentView.prototype, {
  getFields: function () {
    var self = this;
    var ret = {};

    _.each(self.dataByKey, function (precedenceList, key) {
      ret[key] = precedenceList[0].value;
    });

    return ret;
  },
  clearField: function (subscriptionHandle, key, changeCollector) {
    var self = this; // Publish API ignores _id if present in fields

    if (key === "_id") return;
    var precedenceList = self.dataByKey[key]; // It's okay to clear fields that didn't exist. No need to throw
    // an error.

    if (!precedenceList) return;
    var removedValue = undefined;

    for (var i = 0; i < precedenceList.length; i++) {
      var precedence = precedenceList[i];

      if (precedence.subscriptionHandle === subscriptionHandle) {
        // The view's value can only change if this subscription is the one that
        // used to have precedence.
        if (i === 0) removedValue = precedence.value;
        precedenceList.splice(i, 1);
        break;
      }
    }

    if (_.isEmpty(precedenceList)) {
      delete self.dataByKey[key];
      changeCollector[key] = undefined;
    } else if (removedValue !== undefined && !EJSON.equals(removedValue, precedenceList[0].value)) {
      changeCollector[key] = precedenceList[0].value;
    }
  },
  changeField: function (subscriptionHandle, key, value, changeCollector, isAdd) {
    var self = this; // Publish API ignores _id if present in fields

    if (key === "_id") return; // Don't share state with the data passed in by the user.

    value = EJSON.clone(value);

    if (!_.has(self.dataByKey, key)) {
      self.dataByKey[key] = [{
        subscriptionHandle: subscriptionHandle,
        value: value
      }];
      changeCollector[key] = value;
      return;
    }

    var precedenceList = self.dataByKey[key];
    var elt;

    if (!isAdd) {
      elt = _.find(precedenceList, function (precedence) {
        return precedence.subscriptionHandle === subscriptionHandle;
      });
    }

    if (elt) {
      if (elt === precedenceList[0] && !EJSON.equals(value, elt.value)) {
        // this subscription is changing the value of this field.
        changeCollector[key] = value;
      }

      elt.value = value;
    } else {
      // this subscription is newly caring about this field
      precedenceList.push({
        subscriptionHandle: subscriptionHandle,
        value: value
      });
    }
  }
});
/**
 * Represents a client's view of a single collection
 * @param {String} collectionName Name of the collection it represents
 * @param {Object.<String, Function>} sessionCallbacks The callbacks for added, changed, removed
 * @class SessionCollectionView
 */


var SessionCollectionView = function (collectionName, sessionCallbacks) {
  var self = this;
  self.collectionName = collectionName;
  self.documents = {};
  self.callbacks = sessionCallbacks;
};

DDPServer._SessionCollectionView = SessionCollectionView;

_.extend(SessionCollectionView.prototype, {
  isEmpty: function () {
    var self = this;
    return _.isEmpty(self.documents);
  },
  diff: function (previous) {
    var self = this;
    DiffSequence.diffObjects(previous.documents, self.documents, {
      both: _.bind(self.diffDocument, self),
      rightOnly: function (id, nowDV) {
        self.callbacks.added(self.collectionName, id, nowDV.getFields());
      },
      leftOnly: function (id, prevDV) {
        self.callbacks.removed(self.collectionName, id);
      }
    });
  },
  diffDocument: function (id, prevDV, nowDV) {
    var self = this;
    var fields = {};
    DiffSequence.diffObjects(prevDV.getFields(), nowDV.getFields(), {
      both: function (key, prev, now) {
        if (!EJSON.equals(prev, now)) fields[key] = now;
      },
      rightOnly: function (key, now) {
        fields[key] = now;
      },
      leftOnly: function (key, prev) {
        fields[key] = undefined;
      }
    });
    self.callbacks.changed(self.collectionName, id, fields);
  },
  added: function (subscriptionHandle, id, fields) {
    var self = this;
    var docView = self.documents[id];
    var added = false;

    if (!docView) {
      added = true;
      docView = new SessionDocumentView();
      self.documents[id] = docView;
    }

    docView.existsIn[subscriptionHandle] = true;
    var changeCollector = {};

    _.each(fields, function (value, key) {
      docView.changeField(subscriptionHandle, key, value, changeCollector, true);
    });

    if (added) self.callbacks.added(self.collectionName, id, changeCollector);else self.callbacks.changed(self.collectionName, id, changeCollector);
  },
  changed: function (subscriptionHandle, id, changed) {
    var self = this;
    var changedResult = {};
    var docView = self.documents[id];
    if (!docView) throw new Error("Could not find element with id " + id + " to change");

    _.each(changed, function (value, key) {
      if (value === undefined) docView.clearField(subscriptionHandle, key, changedResult);else docView.changeField(subscriptionHandle, key, value, changedResult);
    });

    self.callbacks.changed(self.collectionName, id, changedResult);
  },
  removed: function (subscriptionHandle, id) {
    var self = this;
    var docView = self.documents[id];

    if (!docView) {
      var err = new Error("Removed nonexistent document " + id);
      throw err;
    }

    delete docView.existsIn[subscriptionHandle];

    if (_.isEmpty(docView.existsIn)) {
      // it is gone from everyone
      self.callbacks.removed(self.collectionName, id);
      delete self.documents[id];
    } else {
      var changed = {}; // remove this subscription from every precedence list
      // and record the changes

      _.each(docView.dataByKey, function (precedenceList, key) {
        docView.clearField(subscriptionHandle, key, changed);
      });

      self.callbacks.changed(self.collectionName, id, changed);
    }
  }
});
/******************************************************************************/

/* Session                                                                    */

/******************************************************************************/


var Session = function (server, version, socket, options) {
  var self = this;
  self.id = Random.id();
  self.server = server;
  self.version = version;
  self.initialized = false;
  self.socket = socket; // set to null when the session is destroyed. multiple places below
  // use this to determine if the session is alive or not.

  self.inQueue = new Meteor._DoubleEndedQueue();
  self.blocked = false;
  self.workerRunning = false; // Sub objects for active subscriptions

  self._namedSubs = {};
  self._universalSubs = [];
  self.userId = null;
  self.collectionViews = {}; // Set this to false to not send messages when collectionViews are
  // modified. This is done when rerunning subs in _setUserId and those messages
  // are calculated via a diff instead.

  self._isSending = true; // If this is true, don't start a newly-created universal publisher on this
  // session. The session will take care of starting it when appropriate.

  self._dontStartNewUniversalSubs = false; // when we are rerunning subscriptions, any ready messages
  // we want to buffer up for when we are done rerunning subscriptions

  self._pendingReady = []; // List of callbacks to call when this connection is closed.

  self._closeCallbacks = []; // XXX HACK: If a sockjs connection, save off the URL. This is
  // temporary and will go away in the near future.

  self._socketUrl = socket.url; // Allow tests to disable responding to pings.

  self._respondToPings = options.respondToPings; // This object is the public interface to the session. In the public
  // API, it is called the `connection` object.  Internally we call it
  // a `connectionHandle` to avoid ambiguity.

  self.connectionHandle = {
    id: self.id,
    close: function () {
      self.close();
    },
    onClose: function (fn) {
      var cb = Meteor.bindEnvironment(fn, "connection onClose callback");

      if (self.inQueue) {
        self._closeCallbacks.push(cb);
      } else {
        // if we're already closed, call the callback.
        Meteor.defer(cb);
      }
    },
    clientAddress: self._clientAddress(),
    httpHeaders: self.socket.headers
  };
  self.send({
    msg: 'connected',
    session: self.id
  }); // On initial connect, spin up all the universal publishers.

  Fiber(function () {
    self.startUniversalSubs();
  }).run();

  if (version !== 'pre1' && options.heartbeatInterval !== 0) {
    // We no longer need the low level timeout because we have heartbeating.
    socket.setWebsocketTimeout(0);
    self.heartbeat = new DDPCommon.Heartbeat({
      heartbeatInterval: options.heartbeatInterval,
      heartbeatTimeout: options.heartbeatTimeout,
      onTimeout: function () {
        self.close();
      },
      sendPing: function () {
        self.send({
          msg: 'ping'
        });
      }
    });
    self.heartbeat.start();
  }

  Package.facts && Package.facts.Facts.incrementServerFact("livedata", "sessions", 1);
};

_.extend(Session.prototype, {
  sendReady: function (subscriptionIds) {
    var self = this;
    if (self._isSending) self.send({
      msg: "ready",
      subs: subscriptionIds
    });else {
      _.each(subscriptionIds, function (subscriptionId) {
        self._pendingReady.push(subscriptionId);
      });
    }
  },
  sendAdded: function (collectionName, id, fields) {
    var self = this;
    if (self._isSending) self.send({
      msg: "added",
      collection: collectionName,
      id: id,
      fields: fields
    });
  },
  sendChanged: function (collectionName, id, fields) {
    var self = this;
    if (_.isEmpty(fields)) return;

    if (self._isSending) {
      self.send({
        msg: "changed",
        collection: collectionName,
        id: id,
        fields: fields
      });
    }
  },
  sendRemoved: function (collectionName, id) {
    var self = this;
    if (self._isSending) self.send({
      msg: "removed",
      collection: collectionName,
      id: id
    });
  },
  getSendCallbacks: function () {
    var self = this;
    return {
      added: _.bind(self.sendAdded, self),
      changed: _.bind(self.sendChanged, self),
      removed: _.bind(self.sendRemoved, self)
    };
  },
  getCollectionView: function (collectionName) {
    var self = this;

    if (_.has(self.collectionViews, collectionName)) {
      return self.collectionViews[collectionName];
    }

    var ret = new SessionCollectionView(collectionName, self.getSendCallbacks());
    self.collectionViews[collectionName] = ret;
    return ret;
  },
  added: function (subscriptionHandle, collectionName, id, fields) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.added(subscriptionHandle, id, fields);
  },
  removed: function (subscriptionHandle, collectionName, id) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.removed(subscriptionHandle, id);

    if (view.isEmpty()) {
      delete self.collectionViews[collectionName];
    }
  },
  changed: function (subscriptionHandle, collectionName, id, fields) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.changed(subscriptionHandle, id, fields);
  },
  startUniversalSubs: function () {
    var self = this; // Make a shallow copy of the set of universal handlers and start them. If
    // additional universal publishers start while we're running them (due to
    // yielding), they will run separately as part of Server.publish.

    var handlers = _.clone(self.server.universal_publish_handlers);

    _.each(handlers, function (handler) {
      self._startSubscription(handler);
    });
  },
  // Destroy this session and unregister it at the server.
  close: function () {
    var self = this; // Destroy this session, even if it's not registered at the
    // server. Stop all processing and tear everything down. If a socket
    // was attached, close it.
    // Already destroyed.

    if (!self.inQueue) return; // Drop the merge box data immediately.

    self.inQueue = null;
    self.collectionViews = {};

    if (self.heartbeat) {
      self.heartbeat.stop();
      self.heartbeat = null;
    }

    if (self.socket) {
      self.socket.close();
      self.socket._meteorSession = null;
    }

    Package.facts && Package.facts.Facts.incrementServerFact("livedata", "sessions", -1);
    Meteor.defer(function () {
      // stop callbacks can yield, so we defer this on close.
      // sub._isDeactivated() detects that we set inQueue to null and
      // treats it as semi-deactivated (it will ignore incoming callbacks, etc).
      self._deactivateAllSubscriptions(); // Defer calling the close callbacks, so that the caller closing
      // the session isn't waiting for all the callbacks to complete.


      _.each(self._closeCallbacks, function (callback) {
        callback();
      });
    }); // Unregister the session.

    self.server._removeSession(self);
  },
  // Send a message (doing nothing if no socket is connected right now.)
  // It should be a JSON object (it will be stringified.)
  send: function (msg) {
    var self = this;

    if (self.socket) {
      if (Meteor._printSentDDP) Meteor._debug("Sent DDP", DDPCommon.stringifyDDP(msg));
      self.socket.send(DDPCommon.stringifyDDP(msg));
    }
  },
  // Send a connection error.
  sendError: function (reason, offendingMessage) {
    var self = this;
    var msg = {
      msg: 'error',
      reason: reason
    };
    if (offendingMessage) msg.offendingMessage = offendingMessage;
    self.send(msg);
  },
  // Process 'msg' as an incoming message. (But as a guard against
  // race conditions during reconnection, ignore the message if
  // 'socket' is not the currently connected socket.)
  //
  // We run the messages from the client one at a time, in the order
  // given by the client. The message handler is passed an idempotent
  // function 'unblock' which it may call to allow other messages to
  // begin running in parallel in another fiber (for example, a method
  // that wants to yield.) Otherwise, it is automatically unblocked
  // when it returns.
  //
  // Actually, we don't have to 'totally order' the messages in this
  // way, but it's the easiest thing that's correct. (unsub needs to
  // be ordered against sub, methods need to be ordered against each
  // other.)
  processMessage: function (msg_in) {
    var self = this;
    if (!self.inQueue) // we have been destroyed.
      return; // Respond to ping and pong messages immediately without queuing.
    // If the negotiated DDP version is "pre1" which didn't support
    // pings, preserve the "pre1" behavior of responding with a "bad
    // request" for the unknown messages.
    //
    // Fibers are needed because heartbeat uses Meteor.setTimeout, which
    // needs a Fiber. We could actually use regular setTimeout and avoid
    // these new fibers, but it is easier to just make everything use
    // Meteor.setTimeout and not think too hard.
    //
    // Any message counts as receiving a pong, as it demonstrates that
    // the client is still alive.

    if (self.heartbeat) {
      Fiber(function () {
        self.heartbeat.messageReceived();
      }).run();
    }

    if (self.version !== 'pre1' && msg_in.msg === 'ping') {
      if (self._respondToPings) self.send({
        msg: "pong",
        id: msg_in.id
      });
      return;
    }

    if (self.version !== 'pre1' && msg_in.msg === 'pong') {
      // Since everything is a pong, nothing to do
      return;
    }

    self.inQueue.push(msg_in);
    if (self.workerRunning) return;
    self.workerRunning = true;

    var processNext = function () {
      var msg = self.inQueue && self.inQueue.shift();

      if (!msg) {
        self.workerRunning = false;
        return;
      }

      Fiber(function () {
        var blocked = true;

        var unblock = function () {
          if (!blocked) return; // idempotent

          blocked = false;
          processNext();
        };

        self.server.onMessageHook.each(function (callback) {
          callback(msg, self);
          return true;
        });
        if (_.has(self.protocol_handlers, msg.msg)) self.protocol_handlers[msg.msg].call(self, msg, unblock);else self.sendError('Bad request', msg);
        unblock(); // in case the handler didn't already do it
      }).run();
    };

    processNext();
  },
  protocol_handlers: {
    sub: function (msg) {
      var self = this; // reject malformed messages

      if (typeof msg.id !== "string" || typeof msg.name !== "string" || 'params' in msg && !(msg.params instanceof Array)) {
        self.sendError("Malformed subscription", msg);
        return;
      }

      if (!self.server.publish_handlers[msg.name]) {
        self.send({
          msg: 'nosub',
          id: msg.id,
          error: new Meteor.Error(404, `Subscription '${msg.name}' not found`)
        });
        return;
      }

      if (_.has(self._namedSubs, msg.id)) // subs are idempotent, or rather, they are ignored if a sub
        // with that id already exists. this is important during
        // reconnect.
        return; // XXX It'd be much better if we had generic hooks where any package can
      // hook into subscription handling, but in the mean while we special case
      // ddp-rate-limiter package. This is also done for weak requirements to
      // add the ddp-rate-limiter package in case we don't have Accounts. A
      // user trying to use the ddp-rate-limiter must explicitly require it.

      if (Package['ddp-rate-limiter']) {
        var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
        var rateLimiterInput = {
          userId: self.userId,
          clientAddress: self.connectionHandle.clientAddress,
          type: "subscription",
          name: msg.name,
          connectionId: self.id
        };

        DDPRateLimiter._increment(rateLimiterInput);

        var rateLimitResult = DDPRateLimiter._check(rateLimiterInput);

        if (!rateLimitResult.allowed) {
          self.send({
            msg: 'nosub',
            id: msg.id,
            error: new Meteor.Error('too-many-requests', DDPRateLimiter.getErrorMessage(rateLimitResult), {
              timeToReset: rateLimitResult.timeToReset
            })
          });
          return;
        }
      }

      var handler = self.server.publish_handlers[msg.name];

      self._startSubscription(handler, msg.id, msg.params, msg.name);
    },
    unsub: function (msg) {
      var self = this;

      self._stopSubscription(msg.id);
    },
    method: function (msg, unblock) {
      var self = this; // reject malformed messages
      // For now, we silently ignore unknown attributes,
      // for forwards compatibility.

      if (typeof msg.id !== "string" || typeof msg.method !== "string" || 'params' in msg && !(msg.params instanceof Array) || 'randomSeed' in msg && typeof msg.randomSeed !== "string") {
        self.sendError("Malformed method invocation", msg);
        return;
      }

      var randomSeed = msg.randomSeed || null; // set up to mark the method as satisfied once all observers
      // (and subscriptions) have reacted to any writes that were
      // done.

      var fence = new DDPServer._WriteFence();
      fence.onAllCommitted(function () {
        // Retire the fence so that future writes are allowed.
        // This means that callbacks like timers are free to use
        // the fence, and if they fire before it's armed (for
        // example, because the method waits for them) their
        // writes will be included in the fence.
        fence.retire();
        self.send({
          msg: 'updated',
          methods: [msg.id]
        });
      }); // find the handler

      var handler = self.server.method_handlers[msg.method];

      if (!handler) {
        self.send({
          msg: 'result',
          id: msg.id,
          error: new Meteor.Error(404, `Method '${msg.method}' not found`)
        });
        fence.arm();
        return;
      }

      var setUserId = function (userId) {
        self._setUserId(userId);
      };

      var invocation = new DDPCommon.MethodInvocation({
        isSimulation: false,
        userId: self.userId,
        setUserId: setUserId,
        unblock: unblock,
        connection: self.connectionHandle,
        randomSeed: randomSeed
      });
      const promise = new Promise((resolve, reject) => {
        // XXX It'd be better if we could hook into method handlers better but
        // for now, we need to check if the ddp-rate-limiter exists since we
        // have a weak requirement for the ddp-rate-limiter package to be added
        // to our application.
        if (Package['ddp-rate-limiter']) {
          var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
          var rateLimiterInput = {
            userId: self.userId,
            clientAddress: self.connectionHandle.clientAddress,
            type: "method",
            name: msg.method,
            connectionId: self.id
          };

          DDPRateLimiter._increment(rateLimiterInput);

          var rateLimitResult = DDPRateLimiter._check(rateLimiterInput);

          if (!rateLimitResult.allowed) {
            reject(new Meteor.Error("too-many-requests", DDPRateLimiter.getErrorMessage(rateLimitResult), {
              timeToReset: rateLimitResult.timeToReset
            }));
            return;
          }
        }

        resolve(DDPServer._CurrentWriteFence.withValue(fence, () => DDP._CurrentMethodInvocation.withValue(invocation, () => maybeAuditArgumentChecks(handler, invocation, msg.params, "call to '" + msg.method + "'"))));
      });

      function finish() {
        fence.arm();
        unblock();
      }

      const payload = {
        msg: "result",
        id: msg.id
      };
      promise.then(result => {
        finish();

        if (result !== undefined) {
          payload.result = result;
        }

        self.send(payload);
      }, exception => {
        finish();
        payload.error = wrapInternalException(exception, `while invoking method '${msg.method}'`);
        self.send(payload);
      });
    }
  },
  _eachSub: function (f) {
    var self = this;

    _.each(self._namedSubs, f);

    _.each(self._universalSubs, f);
  },
  _diffCollectionViews: function (beforeCVs) {
    var self = this;
    DiffSequence.diffObjects(beforeCVs, self.collectionViews, {
      both: function (collectionName, leftValue, rightValue) {
        rightValue.diff(leftValue);
      },
      rightOnly: function (collectionName, rightValue) {
        _.each(rightValue.documents, function (docView, id) {
          self.sendAdded(collectionName, id, docView.getFields());
        });
      },
      leftOnly: function (collectionName, leftValue) {
        _.each(leftValue.documents, function (doc, id) {
          self.sendRemoved(collectionName, id);
        });
      }
    });
  },
  // Sets the current user id in all appropriate contexts and reruns
  // all subscriptions
  _setUserId: function (userId) {
    var self = this;
    if (userId !== null && typeof userId !== "string") throw new Error("setUserId must be called on string or null, not " + typeof userId); // Prevent newly-created universal subscriptions from being added to our
    // session; they will be found below when we call startUniversalSubs.
    //
    // (We don't have to worry about named subscriptions, because we only add
    // them when we process a 'sub' message. We are currently processing a
    // 'method' message, and the method did not unblock, because it is illegal
    // to call setUserId after unblock. Thus we cannot be concurrently adding a
    // new named subscription.)

    self._dontStartNewUniversalSubs = true; // Prevent current subs from updating our collectionViews and call their
    // stop callbacks. This may yield.

    self._eachSub(function (sub) {
      sub._deactivate();
    }); // All subs should now be deactivated. Stop sending messages to the client,
    // save the state of the published collections, reset to an empty view, and
    // update the userId.


    self._isSending = false;
    var beforeCVs = self.collectionViews;
    self.collectionViews = {};
    self.userId = userId; // _setUserId is normally called from a Meteor method with
    // DDP._CurrentMethodInvocation set. But DDP._CurrentMethodInvocation is not
    // expected to be set inside a publish function, so we temporary unset it.
    // Inside a publish function DDP._CurrentPublicationInvocation is set.

    DDP._CurrentMethodInvocation.withValue(undefined, function () {
      // Save the old named subs, and reset to having no subscriptions.
      var oldNamedSubs = self._namedSubs;
      self._namedSubs = {};
      self._universalSubs = [];

      _.each(oldNamedSubs, function (sub, subscriptionId) {
        self._namedSubs[subscriptionId] = sub._recreate(); // nb: if the handler throws or calls this.error(), it will in fact
        // immediately send its 'nosub'. This is OK, though.

        self._namedSubs[subscriptionId]._runHandler();
      }); // Allow newly-created universal subs to be started on our connection in
      // parallel with the ones we're spinning up here, and spin up universal
      // subs.


      self._dontStartNewUniversalSubs = false;
      self.startUniversalSubs();
    }); // Start sending messages again, beginning with the diff from the previous
    // state of the world to the current state. No yields are allowed during
    // this diff, so that other changes cannot interleave.


    Meteor._noYieldsAllowed(function () {
      self._isSending = true;

      self._diffCollectionViews(beforeCVs);

      if (!_.isEmpty(self._pendingReady)) {
        self.sendReady(self._pendingReady);
        self._pendingReady = [];
      }
    });
  },
  _startSubscription: function (handler, subId, params, name) {
    var self = this;
    var sub = new Subscription(self, handler, subId, params, name);
    if (subId) self._namedSubs[subId] = sub;else self._universalSubs.push(sub);

    sub._runHandler();
  },
  // tear down specified subscription
  _stopSubscription: function (subId, error) {
    var self = this;
    var subName = null;

    if (subId && self._namedSubs[subId]) {
      subName = self._namedSubs[subId]._name;

      self._namedSubs[subId]._removeAllDocuments();

      self._namedSubs[subId]._deactivate();

      delete self._namedSubs[subId];
    }

    var response = {
      msg: 'nosub',
      id: subId
    };

    if (error) {
      response.error = wrapInternalException(error, subName ? "from sub " + subName + " id " + subId : "from sub id " + subId);
    }

    self.send(response);
  },
  // tear down all subscriptions. Note that this does NOT send removed or nosub
  // messages, since we assume the client is gone.
  _deactivateAllSubscriptions: function () {
    var self = this;

    _.each(self._namedSubs, function (sub, id) {
      sub._deactivate();
    });

    self._namedSubs = {};

    _.each(self._universalSubs, function (sub) {
      sub._deactivate();
    });

    self._universalSubs = [];
  },
  // Determine the remote client's IP address, based on the
  // HTTP_FORWARDED_COUNT environment variable representing how many
  // proxies the server is behind.
  _clientAddress: function () {
    var self = this; // For the reported client address for a connection to be correct,
    // the developer must set the HTTP_FORWARDED_COUNT environment
    // variable to an integer representing the number of hops they
    // expect in the `x-forwarded-for` header. E.g., set to "1" if the
    // server is behind one proxy.
    //
    // This could be computed once at startup instead of every time.

    var httpForwardedCount = parseInt(process.env['HTTP_FORWARDED_COUNT']) || 0;
    if (httpForwardedCount === 0) return self.socket.remoteAddress;
    var forwardedFor = self.socket.headers["x-forwarded-for"];
    if (!_.isString(forwardedFor)) return null;
    forwardedFor = forwardedFor.trim().split(/\s*,\s*/); // Typically the first value in the `x-forwarded-for` header is
    // the original IP address of the client connecting to the first
    // proxy.  However, the end user can easily spoof the header, in
    // which case the first value(s) will be the fake IP address from
    // the user pretending to be a proxy reporting the original IP
    // address value.  By counting HTTP_FORWARDED_COUNT back from the
    // end of the list, we ensure that we get the IP address being
    // reported by *our* first proxy.

    if (httpForwardedCount < 0 || httpForwardedCount > forwardedFor.length) return null;
    return forwardedFor[forwardedFor.length - httpForwardedCount];
  }
});
/******************************************************************************/

/* Subscription                                                               */

/******************************************************************************/
// ctor for a sub handle: the input to each publish function
// Instance name is this because it's usually referred to as this inside a
// publish

/**
 * @summary The server's side of a subscription
 * @class Subscription
 * @instanceName this
 * @showInstanceName true
 */


var Subscription = function (session, handler, subscriptionId, params, name) {
  var self = this;
  self._session = session; // type is Session

  /**
   * @summary Access inside the publish function. The incoming [connection](#meteor_onconnection) for this subscription.
   * @locus Server
   * @name  connection
   * @memberOf Subscription
   * @instance
   */

  self.connection = session.connectionHandle; // public API object

  self._handler = handler; // my subscription ID (generated by client, undefined for universal subs).

  self._subscriptionId = subscriptionId; // undefined for universal subs

  self._name = name;
  self._params = params || []; // Only named subscriptions have IDs, but we need some sort of string
  // internally to keep track of all subscriptions inside
  // SessionDocumentViews. We use this subscriptionHandle for that.

  if (self._subscriptionId) {
    self._subscriptionHandle = 'N' + self._subscriptionId;
  } else {
    self._subscriptionHandle = 'U' + Random.id();
  } // has _deactivate been called?


  self._deactivated = false; // stop callbacks to g/c this sub.  called w/ zero arguments.

  self._stopCallbacks = []; // the set of (collection, documentid) that this subscription has
  // an opinion about

  self._documents = {}; // remember if we are ready.

  self._ready = false; // Part of the public API: the user of this sub.

  /**
   * @summary Access inside the publish function. The id of the logged-in user, or `null` if no user is logged in.
   * @locus Server
   * @memberOf Subscription
   * @name  userId
   * @instance
   */

  self.userId = session.userId; // For now, the id filter is going to default to
  // the to/from DDP methods on MongoID, to
  // specifically deal with mongo/minimongo ObjectIds.
  // Later, you will be able to make this be "raw"
  // if you want to publish a collection that you know
  // just has strings for keys and no funny business, to
  // a ddp consumer that isn't minimongo

  self._idFilter = {
    idStringify: MongoID.idStringify,
    idParse: MongoID.idParse
  };
  Package.facts && Package.facts.Facts.incrementServerFact("livedata", "subscriptions", 1);
};

_.extend(Subscription.prototype, {
  _runHandler: function () {
    // XXX should we unblock() here? Either before running the publish
    // function, or before running _publishCursor.
    //
    // Right now, each publish function blocks all future publishes and
    // methods waiting on data from Mongo (or whatever else the function
    // blocks on). This probably slows page load in common cases.
    var self = this;

    try {
      var res = DDP._CurrentPublicationInvocation.withValue(self, () => maybeAuditArgumentChecks(self._handler, self, EJSON.clone(self._params), // It's OK that this would look weird for universal subscriptions,
      // because they have no arguments so there can never be an
      // audit-argument-checks failure.
      "publisher '" + self._name + "'"));
    } catch (e) {
      self.error(e);
      return;
    } // Did the handler call this.error or this.stop?


    if (self._isDeactivated()) return;

    self._publishHandlerResult(res);
  },
  _publishHandlerResult: function (res) {
    // SPECIAL CASE: Instead of writing their own callbacks that invoke
    // this.added/changed/ready/etc, the user can just return a collection
    // cursor or array of cursors from the publish function; we call their
    // _publishCursor method which starts observing the cursor and publishes the
    // results. Note that _publishCursor does NOT call ready().
    //
    // XXX This uses an undocumented interface which only the Mongo cursor
    // interface publishes. Should we make this interface public and encourage
    // users to implement it themselves? Arguably, it's unnecessary; users can
    // already write their own functions like
    //   var publishMyReactiveThingy = function (name, handler) {
    //     Meteor.publish(name, function () {
    //       var reactiveThingy = handler();
    //       reactiveThingy.publishMe();
    //     });
    //   };
    var self = this;

    var isCursor = function (c) {
      return c && c._publishCursor;
    };

    if (isCursor(res)) {
      try {
        res._publishCursor(self);
      } catch (e) {
        self.error(e);
        return;
      } // _publishCursor only returns after the initial added callbacks have run.
      // mark subscription as ready.


      self.ready();
    } else if (_.isArray(res)) {
      // check all the elements are cursors
      if (!_.all(res, isCursor)) {
        self.error(new Error("Publish function returned an array of non-Cursors"));
        return;
      } // find duplicate collection names
      // XXX we should support overlapping cursors, but that would require the
      // merge box to allow overlap within a subscription


      var collectionNames = {};

      for (var i = 0; i < res.length; ++i) {
        var collectionName = res[i]._getCollectionName();

        if (_.has(collectionNames, collectionName)) {
          self.error(new Error("Publish function returned multiple cursors for collection " + collectionName));
          return;
        }

        collectionNames[collectionName] = true;
      }

      ;

      try {
        _.each(res, function (cur) {
          cur._publishCursor(self);
        });
      } catch (e) {
        self.error(e);
        return;
      }

      self.ready();
    } else if (res) {
      // truthy values other than cursors or arrays are probably a
      // user mistake (possible returning a Mongo document via, say,
      // `coll.findOne()`).
      self.error(new Error("Publish function can only return a Cursor or " + "an array of Cursors"));
    }
  },
  // This calls all stop callbacks and prevents the handler from updating any
  // SessionCollectionViews further. It's used when the user unsubscribes or
  // disconnects, as well as during setUserId re-runs. It does *NOT* send
  // removed messages for the published objects; if that is necessary, call
  // _removeAllDocuments first.
  _deactivate: function () {
    var self = this;
    if (self._deactivated) return;
    self._deactivated = true;

    self._callStopCallbacks();

    Package.facts && Package.facts.Facts.incrementServerFact("livedata", "subscriptions", -1);
  },
  _callStopCallbacks: function () {
    var self = this; // tell listeners, so they can clean up

    var callbacks = self._stopCallbacks;
    self._stopCallbacks = [];

    _.each(callbacks, function (callback) {
      callback();
    });
  },
  // Send remove messages for every document.
  _removeAllDocuments: function () {
    var self = this;

    Meteor._noYieldsAllowed(function () {
      _.each(self._documents, function (collectionDocs, collectionName) {
        // Iterate over _.keys instead of the dictionary itself, since we'll be
        // mutating it.
        _.each(_.keys(collectionDocs), function (strId) {
          self.removed(collectionName, self._idFilter.idParse(strId));
        });
      });
    });
  },
  // Returns a new Subscription for the same session with the same
  // initial creation parameters. This isn't a clone: it doesn't have
  // the same _documents cache, stopped state or callbacks; may have a
  // different _subscriptionHandle, and gets its userId from the
  // session, not from this object.
  _recreate: function () {
    var self = this;
    return new Subscription(self._session, self._handler, self._subscriptionId, self._params, self._name);
  },

  /**
   * @summary Call inside the publish function.  Stops this client's subscription, triggering a call on the client to the `onStop` callback passed to [`Meteor.subscribe`](#meteor_subscribe), if any. If `error` is not a [`Meteor.Error`](#meteor_error), it will be [sanitized](#meteor_error).
   * @locus Server
   * @param {Error} error The error to pass to the client.
   * @instance
   * @memberOf Subscription
   */
  error: function (error) {
    var self = this;
    if (self._isDeactivated()) return;

    self._session._stopSubscription(self._subscriptionId, error);
  },
  // Note that while our DDP client will notice that you've called stop() on the
  // server (and clean up its _subscriptions table) we don't actually provide a
  // mechanism for an app to notice this (the subscribe onError callback only
  // triggers if there is an error).

  /**
   * @summary Call inside the publish function.  Stops this client's subscription and invokes the client's `onStop` callback with no error.
   * @locus Server
   * @instance
   * @memberOf Subscription
   */
  stop: function () {
    var self = this;
    if (self._isDeactivated()) return;

    self._session._stopSubscription(self._subscriptionId);
  },

  /**
   * @summary Call inside the publish function.  Registers a callback function to run when the subscription is stopped.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {Function} func The callback function
   */
  onStop: function (callback) {
    var self = this;
    callback = Meteor.bindEnvironment(callback, 'onStop callback', self);
    if (self._isDeactivated()) callback();else self._stopCallbacks.push(callback);
  },
  // This returns true if the sub has been deactivated, *OR* if the session was
  // destroyed but the deferred call to _deactivateAllSubscriptions hasn't
  // happened yet.
  _isDeactivated: function () {
    var self = this;
    return self._deactivated || self._session.inQueue === null;
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that a document has been added to the record set.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {String} collection The name of the collection that contains the new document.
   * @param {String} id The new document's ID.
   * @param {Object} fields The fields in the new document.  If `_id` is present it is ignored.
   */
  added: function (collectionName, id, fields) {
    var self = this;
    if (self._isDeactivated()) return;
    id = self._idFilter.idStringify(id);
    Meteor._ensure(self._documents, collectionName)[id] = true;

    self._session.added(self._subscriptionHandle, collectionName, id, fields);
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that a document in the record set has been modified.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {String} collection The name of the collection that contains the changed document.
   * @param {String} id The changed document's ID.
   * @param {Object} fields The fields in the document that have changed, together with their new values.  If a field is not present in `fields` it was left unchanged; if it is present in `fields` and has a value of `undefined` it was removed from the document.  If `_id` is present it is ignored.
   */
  changed: function (collectionName, id, fields) {
    var self = this;
    if (self._isDeactivated()) return;
    id = self._idFilter.idStringify(id);

    self._session.changed(self._subscriptionHandle, collectionName, id, fields);
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that a document has been removed from the record set.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {String} collection The name of the collection that the document has been removed from.
   * @param {String} id The ID of the document that has been removed.
   */
  removed: function (collectionName, id) {
    var self = this;
    if (self._isDeactivated()) return;
    id = self._idFilter.idStringify(id); // We don't bother to delete sets of things in a collection if the
    // collection is empty.  It could break _removeAllDocuments.

    delete self._documents[collectionName][id];

    self._session.removed(self._subscriptionHandle, collectionName, id);
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that an initial, complete snapshot of the record set has been sent.  This will trigger a call on the client to the `onReady` callback passed to  [`Meteor.subscribe`](#meteor_subscribe), if any.
   * @locus Server
   * @memberOf Subscription
   * @instance
   */
  ready: function () {
    var self = this;
    if (self._isDeactivated()) return;
    if (!self._subscriptionId) return; // unnecessary but ignored for universal sub

    if (!self._ready) {
      self._session.sendReady([self._subscriptionId]);

      self._ready = true;
    }
  }
});
/******************************************************************************/

/* Server                                                                     */

/******************************************************************************/


Server = function (options) {
  var self = this; // The default heartbeat interval is 30 seconds on the server and 35
  // seconds on the client.  Since the client doesn't need to send a
  // ping as long as it is receiving pings, this means that pings
  // normally go from the server to the client.
  //
  // Note: Troposphere depends on the ability to mutate
  // Meteor.server.options.heartbeatTimeout! This is a hack, but it's life.

  self.options = _.defaults(options || {}, {
    heartbeatInterval: 15000,
    heartbeatTimeout: 15000,
    // For testing, allow responding to pings to be disabled.
    respondToPings: true
  }); // Map of callbacks to call when a new connection comes in to the
  // server and completes DDP version negotiation. Use an object instead
  // of an array so we can safely remove one from the list while
  // iterating over it.

  self.onConnectionHook = new Hook({
    debugPrintExceptions: "onConnection callback"
  }); // Map of callbacks to call when a new message comes in.

  self.onMessageHook = new Hook({
    debugPrintExceptions: "onMessage callback"
  });
  self.publish_handlers = {};
  self.universal_publish_handlers = [];
  self.method_handlers = {};
  self.sessions = {}; // map from id to session

  self.stream_server = new StreamServer();
  self.stream_server.register(function (socket) {
    // socket implements the SockJSConnection interface
    socket._meteorSession = null;

    var sendError = function (reason, offendingMessage) {
      var msg = {
        msg: 'error',
        reason: reason
      };
      if (offendingMessage) msg.offendingMessage = offendingMessage;
      socket.send(DDPCommon.stringifyDDP(msg));
    };

    socket.on('data', function (raw_msg) {
      if (Meteor._printReceivedDDP) {
        Meteor._debug("Received DDP", raw_msg);
      }

      try {
        try {
          var msg = DDPCommon.parseDDP(raw_msg);
        } catch (err) {
          sendError('Parse error');
          return;
        }

        if (msg === null || !msg.msg) {
          sendError('Bad request', msg);
          return;
        }

        if (msg.msg === 'connect') {
          if (socket._meteorSession) {
            sendError("Already connected", msg);
            return;
          }

          Fiber(function () {
            self._handleConnect(socket, msg);
          }).run();
          return;
        }

        if (!socket._meteorSession) {
          sendError('Must connect first', msg);
          return;
        }

        socket._meteorSession.processMessage(msg);
      } catch (e) {
        // XXX print stack nicely
        Meteor._debug("Internal exception while processing message", msg, e.message, e.stack);
      }
    });
    socket.on('close', function () {
      if (socket._meteorSession) {
        Fiber(function () {
          socket._meteorSession.close();
        }).run();
      }
    });
  });
};

_.extend(Server.prototype, {
  /**
   * @summary Register a callback to be called when a new DDP connection is made to the server.
   * @locus Server
   * @param {function} callback The function to call when a new DDP connection is established.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  onConnection: function (fn) {
    var self = this;
    return self.onConnectionHook.register(fn);
  },

  /**
   * @summary Register a callback to be called when a new DDP message is received.
   * @locus Server
   * @param {function} callback The function to call when a new DDP message is received.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  onMessage: function (fn) {
    var self = this;
    return self.onMessageHook.register(fn);
  },
  _handleConnect: function (socket, msg) {
    var self = this; // The connect message must specify a version and an array of supported
    // versions, and it must claim to support what it is proposing.

    if (!(typeof msg.version === 'string' && _.isArray(msg.support) && _.all(msg.support, _.isString) && _.contains(msg.support, msg.version))) {
      socket.send(DDPCommon.stringifyDDP({
        msg: 'failed',
        version: DDPCommon.SUPPORTED_DDP_VERSIONS[0]
      }));
      socket.close();
      return;
    } // In the future, handle session resumption: something like:
    //  socket._meteorSession = self.sessions[msg.session]


    var version = calculateVersion(msg.support, DDPCommon.SUPPORTED_DDP_VERSIONS);

    if (msg.version !== version) {
      // The best version to use (according to the client's stated preferences)
      // is not the one the client is trying to use. Inform them about the best
      // version to use.
      socket.send(DDPCommon.stringifyDDP({
        msg: 'failed',
        version: version
      }));
      socket.close();
      return;
    } // Yay, version matches! Create a new session.
    // Note: Troposphere depends on the ability to mutate
    // Meteor.server.options.heartbeatTimeout! This is a hack, but it's life.


    socket._meteorSession = new Session(self, version, socket, self.options);
    self.sessions[socket._meteorSession.id] = socket._meteorSession;
    self.onConnectionHook.each(function (callback) {
      if (socket._meteorSession) callback(socket._meteorSession.connectionHandle);
      return true;
    });
  },

  /**
   * Register a publish handler function.
   *
   * @param name {String} identifier for query
   * @param handler {Function} publish handler
   * @param options {Object}
   *
   * Server will call handler function on each new subscription,
   * either when receiving DDP sub message for a named subscription, or on
   * DDP connect for a universal subscription.
   *
   * If name is null, this will be a subscription that is
   * automatically established and permanently on for all connected
   * client, instead of a subscription that can be turned on and off
   * with subscribe().
   *
   * options to contain:
   *  - (mostly internal) is_auto: true if generated automatically
   *    from an autopublish hook. this is for cosmetic purposes only
   *    (it lets us determine whether to print a warning suggesting
   *    that you turn off autopublish.)
   */

  /**
   * @summary Publish a record set.
   * @memberOf Meteor
   * @importFromPackage meteor
   * @locus Server
   * @param {String|Object} name If String, name of the record set.  If Object, publications Dictionary of publish functions by name.  If `null`, the set has no name, and the record set is automatically sent to all connected clients.
   * @param {Function} func Function called on the server each time a client subscribes.  Inside the function, `this` is the publish handler object, described below.  If the client passed arguments to `subscribe`, the function is called with the same arguments.
   */
  publish: function (name, handler, options) {
    var self = this;

    if (!_.isObject(name)) {
      options = options || {};

      if (name && name in self.publish_handlers) {
        Meteor._debug("Ignoring duplicate publish named '" + name + "'");

        return;
      }

      if (Package.autopublish && !options.is_auto) {
        // They have autopublish on, yet they're trying to manually
        // picking stuff to publish. They probably should turn off
        // autopublish. (This check isn't perfect -- if you create a
        // publish before you turn on autopublish, it won't catch
        // it. But this will definitely handle the simple case where
        // you've added the autopublish package to your app, and are
        // calling publish from your app code.)
        if (!self.warned_about_autopublish) {
          self.warned_about_autopublish = true;

          Meteor._debug("** You've set up some data subscriptions with Meteor.publish(), but\n" + "** you still have autopublish turned on. Because autopublish is still\n" + "** on, your Meteor.publish() calls won't have much effect. All data\n" + "** will still be sent to all clients.\n" + "**\n" + "** Turn off autopublish by removing the autopublish package:\n" + "**\n" + "**   $ meteor remove autopublish\n" + "**\n" + "** .. and make sure you have Meteor.publish() and Meteor.subscribe() calls\n" + "** for each collection that you want clients to see.\n");
        }
      }

      if (name) self.publish_handlers[name] = handler;else {
        self.universal_publish_handlers.push(handler); // Spin up the new publisher on any existing session too. Run each
        // session's subscription in a new Fiber, so that there's no change for
        // self.sessions to change while we're running this loop.

        _.each(self.sessions, function (session) {
          if (!session._dontStartNewUniversalSubs) {
            Fiber(function () {
              session._startSubscription(handler);
            }).run();
          }
        });
      }
    } else {
      _.each(name, function (value, key) {
        self.publish(key, value, {});
      });
    }
  },
  _removeSession: function (session) {
    var self = this;

    if (self.sessions[session.id]) {
      delete self.sessions[session.id];
    }
  },

  /**
   * @summary Defines functions that can be invoked over the network by clients.
   * @locus Anywhere
   * @param {Object} methods Dictionary whose keys are method names and values are functions.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  methods: function (methods) {
    var self = this;

    _.each(methods, function (func, name) {
      if (typeof func !== 'function') throw new Error("Method '" + name + "' must be a function");
      if (self.method_handlers[name]) throw new Error("A method named '" + name + "' is already defined");
      self.method_handlers[name] = func;
    });
  },
  call: function (name, ...args) {
    if (args.length && typeof args[args.length - 1] === "function") {
      // If it's a function, the last argument is the result callback, not
      // a parameter to the remote method.
      var callback = args.pop();
    }

    return this.apply(name, args, callback);
  },
  // A version of the call method that always returns a Promise.
  callAsync: function (name, ...args) {
    return this.applyAsync(name, args);
  },
  apply: function (name, args, options, callback) {
    // We were passed 3 arguments. They may be either (name, args, options)
    // or (name, args, callback)
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    const promise = this.applyAsync(name, args, options); // Return the result in whichever way the caller asked for it. Note that we
    // do NOT block on the write fence in an analogous way to how the client
    // blocks on the relevant data being visible, so you are NOT guaranteed that
    // cursor observe callbacks have fired when your callback is invoked. (We
    // can change this if there's a real use case.)

    if (callback) {
      promise.then(result => callback(undefined, result), exception => callback(exception));
    } else {
      return promise.await();
    }
  },
  // @param options {Optional Object}
  applyAsync: function (name, args, options) {
    // Run the handler
    var handler = this.method_handlers[name];

    if (!handler) {
      return Promise.reject(new Meteor.Error(404, `Method '${name}' not found`));
    } // If this is a method call from within another method or publish function,
    // get the user state from the outer method or publish function, otherwise
    // don't allow setUserId to be called


    var userId = null;

    var setUserId = function () {
      throw new Error("Can't call setUserId on a server initiated method call");
    };

    var connection = null;

    var currentMethodInvocation = DDP._CurrentMethodInvocation.get();

    var currentPublicationInvocation = DDP._CurrentPublicationInvocation.get();

    var randomSeed = null;

    if (currentMethodInvocation) {
      userId = currentMethodInvocation.userId;

      setUserId = function (userId) {
        currentMethodInvocation.setUserId(userId);
      };

      connection = currentMethodInvocation.connection;
      randomSeed = DDPCommon.makeRpcSeed(currentMethodInvocation, name);
    } else if (currentPublicationInvocation) {
      userId = currentPublicationInvocation.userId;

      setUserId = function (userId) {
        currentPublicationInvocation._session._setUserId(userId);
      };

      connection = currentPublicationInvocation.connection;
    }

    var invocation = new DDPCommon.MethodInvocation({
      isSimulation: false,
      userId,
      setUserId,
      connection,
      randomSeed
    });
    return new Promise(resolve => resolve(DDP._CurrentMethodInvocation.withValue(invocation, () => maybeAuditArgumentChecks(handler, invocation, EJSON.clone(args), "internal call to '" + name + "'")))).then(EJSON.clone);
  },
  _urlForSession: function (sessionId) {
    var self = this;
    var session = self.sessions[sessionId];
    if (session) return session._socketUrl;else return null;
  }
});

var calculateVersion = function (clientSupportedVersions, serverSupportedVersions) {
  var correctVersion = _.find(clientSupportedVersions, function (version) {
    return _.contains(serverSupportedVersions, version);
  });

  if (!correctVersion) {
    correctVersion = serverSupportedVersions[0];
  }

  return correctVersion;
};

DDPServer._calculateVersion = calculateVersion; // "blind" exceptions other than those that were deliberately thrown to signal
// errors to the client

var wrapInternalException = function (exception, context) {
  if (!exception) return exception; // To allow packages to throw errors intended for the client but not have to
  // depend on the Meteor.Error class, `isClientSafe` can be set to true on any
  // error before it is thrown.

  if (exception.isClientSafe) {
    if (!(exception instanceof Meteor.Error)) {
      const originalMessage = exception.message;
      exception = new Meteor.Error(exception.error, exception.reason, exception.details);
      exception.message = originalMessage;
    }

    return exception;
  } // Tests can set the '_expectedByTest' flag on an exception so it won't go to 
  // the server log.


  if (!exception._expectedByTest) {
    Meteor._debug("Exception " + context, exception.stack);

    if (exception.sanitizedError) {
      Meteor._debug("Sanitized and reported to the client as:", exception.sanitizedError.message);

      Meteor._debug();
    }
  } // Did the error contain more details that could have been useful if caught in
  // server code (or if thrown from non-client-originated code), but also
  // provided a "sanitized" version with more context than 500 Internal server
  // error? Use that.


  if (exception.sanitizedError) {
    if (exception.sanitizedError.isClientSafe) return exception.sanitizedError;

    Meteor._debug("Exception " + context + " provides a sanitizedError that " + "does not have isClientSafe property set; ignoring");
  }

  return new Meteor.Error(500, "Internal server error");
}; // Audit argument checks, if the audit-argument-checks package exists (it is a
// weak dependency of this package).


var maybeAuditArgumentChecks = function (f, context, args, description) {
  args = args || [];

  if (Package['audit-argument-checks']) {
    return Match._failIfArgumentsAreNotAllChecked(f, context, args, description);
  }

  return f.apply(context, args);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"writefence.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/writefence.js                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Future = Npm.require('fibers/future'); // A write fence collects a group of writes, and provides a callback
// when all of the writes are fully committed and propagated (all
// observers have been notified of the write and acknowledged it.)
//


DDPServer._WriteFence = function () {
  var self = this;
  self.armed = false;
  self.fired = false;
  self.retired = false;
  self.outstanding_writes = 0;
  self.before_fire_callbacks = [];
  self.completion_callbacks = [];
}; // The current write fence. When there is a current write fence, code
// that writes to databases should register their writes with it using
// beginWrite().
//


DDPServer._CurrentWriteFence = new Meteor.EnvironmentVariable();

_.extend(DDPServer._WriteFence.prototype, {
  // Start tracking a write, and return an object to represent it. The
  // object has a single method, committed(). This method should be
  // called when the write is fully committed and propagated. You can
  // continue to add writes to the WriteFence up until it is triggered
  // (calls its callbacks because all writes have committed.)
  beginWrite: function () {
    var self = this;
    if (self.retired) return {
      committed: function () {}
    };
    if (self.fired) throw new Error("fence has already activated -- too late to add writes");
    self.outstanding_writes++;
    var committed = false;
    return {
      committed: function () {
        if (committed) throw new Error("committed called twice on the same write");
        committed = true;
        self.outstanding_writes--;

        self._maybeFire();
      }
    };
  },
  // Arm the fence. Once the fence is armed, and there are no more
  // uncommitted writes, it will activate.
  arm: function () {
    var self = this;
    if (self === DDPServer._CurrentWriteFence.get()) throw Error("Can't arm the current fence");
    self.armed = true;

    self._maybeFire();
  },
  // Register a function to be called once before firing the fence.
  // Callback function can add new writes to the fence, in which case
  // it won't fire until those writes are done as well.
  onBeforeFire: function (func) {
    var self = this;
    if (self.fired) throw new Error("fence has already activated -- too late to " + "add a callback");
    self.before_fire_callbacks.push(func);
  },
  // Register a function to be called when the fence fires.
  onAllCommitted: function (func) {
    var self = this;
    if (self.fired) throw new Error("fence has already activated -- too late to " + "add a callback");
    self.completion_callbacks.push(func);
  },
  // Convenience function. Arms the fence, then blocks until it fires.
  armAndWait: function () {
    var self = this;
    var future = new Future();
    self.onAllCommitted(function () {
      future['return']();
    });
    self.arm();
    future.wait();
  },
  _maybeFire: function () {
    var self = this;
    if (self.fired) throw new Error("write fence already activated?");

    if (self.armed && !self.outstanding_writes) {
      function invokeCallback(func) {
        try {
          func(self);
        } catch (err) {
          Meteor._debug("exception in write fence callback:", err);
        }
      }

      self.outstanding_writes++;

      while (self.before_fire_callbacks.length > 0) {
        var callbacks = self.before_fire_callbacks;
        self.before_fire_callbacks = [];

        _.each(callbacks, invokeCallback);
      }

      self.outstanding_writes--;

      if (!self.outstanding_writes) {
        self.fired = true;
        var callbacks = self.completion_callbacks;
        self.completion_callbacks = [];

        _.each(callbacks, invokeCallback);
      }
    }
  },
  // Deactivate this fence so that adding more writes has no effect.
  // The fence must have already fired.
  retire: function () {
    var self = this;
    if (!self.fired) throw new Error("Can't retire a fence that hasn't fired.");
    self.retired = true;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"crossbar.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/crossbar.js                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// A "crossbar" is a class that provides structured notification registration.
// See _match for the definition of how a notification matches a trigger.
// All notifications and triggers must have a string key named 'collection'.
DDPServer._Crossbar = function (options) {
  var self = this;
  options = options || {};
  self.nextId = 1; // map from collection name (string) -> listener id -> object. each object has
  // keys 'trigger', 'callback'.  As a hack, the empty string means "no
  // collection".

  self.listenersByCollection = {};
  self.factPackage = options.factPackage || "livedata";
  self.factName = options.factName || null;
};

_.extend(DDPServer._Crossbar.prototype, {
  // msg is a trigger or a notification
  _collectionForMessage: function (msg) {
    var self = this;

    if (!_.has(msg, 'collection')) {
      return '';
    } else if (typeof msg.collection === 'string') {
      if (msg.collection === '') throw Error("Message has empty collection!");
      return msg.collection;
    } else {
      throw Error("Message has non-string collection!");
    }
  },
  // Listen for notification that match 'trigger'. A notification
  // matches if it has the key-value pairs in trigger as a
  // subset. When a notification matches, call 'callback', passing
  // the actual notification.
  //
  // Returns a listen handle, which is an object with a method
  // stop(). Call stop() to stop listening.
  //
  // XXX It should be legal to call fire() from inside a listen()
  // callback?
  listen: function (trigger, callback) {
    var self = this;
    var id = self.nextId++;

    var collection = self._collectionForMessage(trigger);

    var record = {
      trigger: EJSON.clone(trigger),
      callback: callback
    };

    if (!_.has(self.listenersByCollection, collection)) {
      self.listenersByCollection[collection] = {};
    }

    self.listenersByCollection[collection][id] = record;

    if (self.factName && Package.facts) {
      Package.facts.Facts.incrementServerFact(self.factPackage, self.factName, 1);
    }

    return {
      stop: function () {
        if (self.factName && Package.facts) {
          Package.facts.Facts.incrementServerFact(self.factPackage, self.factName, -1);
        }

        delete self.listenersByCollection[collection][id];

        if (_.isEmpty(self.listenersByCollection[collection])) {
          delete self.listenersByCollection[collection];
        }
      }
    };
  },
  // Fire the provided 'notification' (an object whose attribute
  // values are all JSON-compatibile) -- inform all matching listeners
  // (registered with listen()).
  //
  // If fire() is called inside a write fence, then each of the
  // listener callbacks will be called inside the write fence as well.
  //
  // The listeners may be invoked in parallel, rather than serially.
  fire: function (notification) {
    var self = this;

    var collection = self._collectionForMessage(notification);

    if (!_.has(self.listenersByCollection, collection)) {
      return;
    }

    var listenersForCollection = self.listenersByCollection[collection];
    var callbackIds = [];

    _.each(listenersForCollection, function (l, id) {
      if (self._matches(notification, l.trigger)) {
        callbackIds.push(id);
      }
    }); // Listener callbacks can yield, so we need to first find all the ones that
    // match in a single iteration over self.listenersByCollection (which can't
    // be mutated during this iteration), and then invoke the matching
    // callbacks, checking before each call to ensure they haven't stopped.
    // Note that we don't have to check that
    // self.listenersByCollection[collection] still === listenersForCollection,
    // because the only way that stops being true is if listenersForCollection
    // first gets reduced down to the empty object (and then never gets
    // increased again).


    _.each(callbackIds, function (id) {
      if (_.has(listenersForCollection, id)) {
        listenersForCollection[id].callback(notification);
      }
    });
  },
  // A notification matches a trigger if all keys that exist in both are equal.
  //
  // Examples:
  //  N:{collection: "C"} matches T:{collection: "C"}
  //    (a non-targeted write to a collection matches a
  //     non-targeted query)
  //  N:{collection: "C", id: "X"} matches T:{collection: "C"}
  //    (a targeted write to a collection matches a non-targeted query)
  //  N:{collection: "C"} matches T:{collection: "C", id: "X"}
  //    (a non-targeted write to a collection matches a
  //     targeted query)
  //  N:{collection: "C", id: "X"} matches T:{collection: "C", id: "X"}
  //    (a targeted write to a collection matches a targeted query targeted
  //     at the same document)
  //  N:{collection: "C", id: "X"} does not match T:{collection: "C", id: "Y"}
  //    (a targeted write to a collection does not match a targeted query
  //     targeted at a different document)
  _matches: function (notification, trigger) {
    // Most notifications that use the crossbar have a string `collection` and
    // maybe an `id` that is a string or ObjectID. We're already dividing up
    // triggers by collection, but let's fast-track "nope, different ID" (and
    // avoid the overly generic EJSON.equals). This makes a noticeable
    // performance difference; see https://github.com/meteor/meteor/pull/3697
    if (typeof notification.id === 'string' && typeof trigger.id === 'string' && notification.id !== trigger.id) {
      return false;
    }

    if (notification.id instanceof MongoID.ObjectID && trigger.id instanceof MongoID.ObjectID && !notification.id.equals(trigger.id)) {
      return false;
    }

    return _.all(trigger, function (triggerValue, key) {
      return !_.has(notification, key) || EJSON.equals(triggerValue, notification[key]);
    });
  }
}); // The "invalidation crossbar" is a specific instance used by the DDP server to
// implement write fence notifications. Listener callbacks on this crossbar
// should call beginWrite on the current write fence before they return, if they
// want to delay the write fence from firing (ie, the DDP method-data-updated
// message from being sent).


DDPServer._InvalidationCrossbar = new DDPServer._Crossbar({
  factName: "invalidation-crossbar-listeners"
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server_convenience.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/server_convenience.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
if (process.env.DDP_DEFAULT_CONNECTION_URL) {
  __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = process.env.DDP_DEFAULT_CONNECTION_URL;
}

Meteor.server = new Server();

Meteor.refresh = function (notification) {
  DDPServer._InvalidationCrossbar.fire(notification);
}; // Proxy the public methods of Meteor.server so they can
// be called directly on Meteor.


_.each(['publish', 'methods', 'call', 'apply', 'onConnection', 'onMessage'], function (name) {
  Meteor[name] = _.bind(Meteor.server[name], Meteor.server);
}); // Meteor.server used to be called Meteor.default_server. Provide
// backcompat as a courtesy even though it was never documented.
// XXX COMPAT WITH 0.6.4


Meteor.default_server = Meteor.server;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/ddp-server/stream_server.js");
require("/node_modules/meteor/ddp-server/livedata_server.js");
require("/node_modules/meteor/ddp-server/writefence.js");
require("/node_modules/meteor/ddp-server/crossbar.js");
require("/node_modules/meteor/ddp-server/server_convenience.js");

/* Exports */
Package._define("ddp-server", {
  DDPServer: DDPServer
});

})();

//# sourceURL=meteor://💻app/packages/ddp-server.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGRwLXNlcnZlci9zdHJlYW1fc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtc2VydmVyL2xpdmVkYXRhX3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGRwLXNlcnZlci93cml0ZWZlbmNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtc2VydmVyL2Nyb3NzYmFyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtc2VydmVyL3NlcnZlcl9jb252ZW5pZW5jZS5qcyJdLCJuYW1lcyI6WyJ1cmwiLCJOcG0iLCJyZXF1aXJlIiwid2Vic29ja2V0RXh0ZW5zaW9ucyIsIl8iLCJvbmNlIiwiZXh0ZW5zaW9ucyIsIndlYnNvY2tldENvbXByZXNzaW9uQ29uZmlnIiwicHJvY2VzcyIsImVudiIsIlNFUlZFUl9XRUJTT0NLRVRfQ09NUFJFU1NJT04iLCJKU09OIiwicGFyc2UiLCJwdXNoIiwiY29uZmlndXJlIiwicGF0aFByZWZpeCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsIlN0cmVhbVNlcnZlciIsInNlbGYiLCJyZWdpc3RyYXRpb25fY2FsbGJhY2tzIiwib3Blbl9zb2NrZXRzIiwicHJlZml4IiwiUm91dGVQb2xpY3kiLCJkZWNsYXJlIiwic29ja2pzIiwic2VydmVyT3B0aW9ucyIsImxvZyIsImhlYXJ0YmVhdF9kZWxheSIsImRpc2Nvbm5lY3RfZGVsYXkiLCJqc2Vzc2lvbmlkIiwiVVNFX0pTRVNTSU9OSUQiLCJESVNBQkxFX1dFQlNPQ0tFVFMiLCJ3ZWJzb2NrZXQiLCJmYXllX3NlcnZlcl9vcHRpb25zIiwic2VydmVyIiwiY3JlYXRlU2VydmVyIiwiV2ViQXBwIiwiaHR0cFNlcnZlciIsInJlbW92ZUxpc3RlbmVyIiwiX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrIiwiaW5zdGFsbEhhbmRsZXJzIiwiYWRkTGlzdGVuZXIiLCJfcmVkaXJlY3RXZWJzb2NrZXRFbmRwb2ludCIsIm9uIiwic29ja2V0Iiwic2V0V2Vic29ja2V0VGltZW91dCIsInRpbWVvdXQiLCJwcm90b2NvbCIsIl9zZXNzaW9uIiwicmVjdiIsImNvbm5lY3Rpb24iLCJzZXRUaW1lb3V0Iiwic2VuZCIsImRhdGEiLCJ3cml0ZSIsIndpdGhvdXQiLCJzdHJpbmdpZnkiLCJzZXJ2ZXJfaWQiLCJlYWNoIiwiY2FsbGJhY2siLCJleHRlbmQiLCJwcm90b3R5cGUiLCJyZWdpc3RlciIsImFsbF9zb2NrZXRzIiwidmFsdWVzIiwiZXZlbnQiLCJvbGRIdHRwU2VydmVyTGlzdGVuZXJzIiwibGlzdGVuZXJzIiwic2xpY2UiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJuZXdMaXN0ZW5lciIsInJlcXVlc3QiLCJhcmdzIiwiYXJndW1lbnRzIiwicGFyc2VkVXJsIiwicGF0aG5hbWUiLCJmb3JtYXQiLCJvbGRMaXN0ZW5lciIsImFwcGx5IiwiRERQU2VydmVyIiwiRmliZXIiLCJTZXNzaW9uRG9jdW1lbnRWaWV3IiwiZXhpc3RzSW4iLCJkYXRhQnlLZXkiLCJfU2Vzc2lvbkRvY3VtZW50VmlldyIsImdldEZpZWxkcyIsInJldCIsInByZWNlZGVuY2VMaXN0Iiwia2V5IiwidmFsdWUiLCJjbGVhckZpZWxkIiwic3Vic2NyaXB0aW9uSGFuZGxlIiwiY2hhbmdlQ29sbGVjdG9yIiwicmVtb3ZlZFZhbHVlIiwidW5kZWZpbmVkIiwiaSIsImxlbmd0aCIsInByZWNlZGVuY2UiLCJzcGxpY2UiLCJpc0VtcHR5IiwiRUpTT04iLCJlcXVhbHMiLCJjaGFuZ2VGaWVsZCIsImlzQWRkIiwiY2xvbmUiLCJoYXMiLCJlbHQiLCJmaW5kIiwiU2Vzc2lvbkNvbGxlY3Rpb25WaWV3IiwiY29sbGVjdGlvbk5hbWUiLCJzZXNzaW9uQ2FsbGJhY2tzIiwiZG9jdW1lbnRzIiwiY2FsbGJhY2tzIiwiX1Nlc3Npb25Db2xsZWN0aW9uVmlldyIsImRpZmYiLCJwcmV2aW91cyIsIkRpZmZTZXF1ZW5jZSIsImRpZmZPYmplY3RzIiwiYm90aCIsImJpbmQiLCJkaWZmRG9jdW1lbnQiLCJyaWdodE9ubHkiLCJpZCIsIm5vd0RWIiwiYWRkZWQiLCJsZWZ0T25seSIsInByZXZEViIsInJlbW92ZWQiLCJmaWVsZHMiLCJwcmV2Iiwibm93IiwiY2hhbmdlZCIsImRvY1ZpZXciLCJjaGFuZ2VkUmVzdWx0IiwiRXJyb3IiLCJlcnIiLCJTZXNzaW9uIiwidmVyc2lvbiIsIm9wdGlvbnMiLCJSYW5kb20iLCJpbml0aWFsaXplZCIsImluUXVldWUiLCJNZXRlb3IiLCJfRG91YmxlRW5kZWRRdWV1ZSIsImJsb2NrZWQiLCJ3b3JrZXJSdW5uaW5nIiwiX25hbWVkU3VicyIsIl91bml2ZXJzYWxTdWJzIiwidXNlcklkIiwiY29sbGVjdGlvblZpZXdzIiwiX2lzU2VuZGluZyIsIl9kb250U3RhcnROZXdVbml2ZXJzYWxTdWJzIiwiX3BlbmRpbmdSZWFkeSIsIl9jbG9zZUNhbGxiYWNrcyIsIl9zb2NrZXRVcmwiLCJfcmVzcG9uZFRvUGluZ3MiLCJyZXNwb25kVG9QaW5ncyIsImNvbm5lY3Rpb25IYW5kbGUiLCJjbG9zZSIsIm9uQ2xvc2UiLCJmbiIsImNiIiwiYmluZEVudmlyb25tZW50IiwiZGVmZXIiLCJjbGllbnRBZGRyZXNzIiwiX2NsaWVudEFkZHJlc3MiLCJodHRwSGVhZGVycyIsImhlYWRlcnMiLCJtc2ciLCJzZXNzaW9uIiwic3RhcnRVbml2ZXJzYWxTdWJzIiwicnVuIiwiaGVhcnRiZWF0SW50ZXJ2YWwiLCJoZWFydGJlYXQiLCJERFBDb21tb24iLCJIZWFydGJlYXQiLCJoZWFydGJlYXRUaW1lb3V0Iiwib25UaW1lb3V0Iiwic2VuZFBpbmciLCJzdGFydCIsIlBhY2thZ2UiLCJmYWN0cyIsIkZhY3RzIiwiaW5jcmVtZW50U2VydmVyRmFjdCIsInNlbmRSZWFkeSIsInN1YnNjcmlwdGlvbklkcyIsInN1YnMiLCJzdWJzY3JpcHRpb25JZCIsInNlbmRBZGRlZCIsImNvbGxlY3Rpb24iLCJzZW5kQ2hhbmdlZCIsInNlbmRSZW1vdmVkIiwiZ2V0U2VuZENhbGxiYWNrcyIsImdldENvbGxlY3Rpb25WaWV3IiwidmlldyIsImhhbmRsZXJzIiwidW5pdmVyc2FsX3B1Ymxpc2hfaGFuZGxlcnMiLCJoYW5kbGVyIiwiX3N0YXJ0U3Vic2NyaXB0aW9uIiwic3RvcCIsIl9tZXRlb3JTZXNzaW9uIiwiX2RlYWN0aXZhdGVBbGxTdWJzY3JpcHRpb25zIiwiX3JlbW92ZVNlc3Npb24iLCJfcHJpbnRTZW50RERQIiwiX2RlYnVnIiwic3RyaW5naWZ5RERQIiwic2VuZEVycm9yIiwicmVhc29uIiwib2ZmZW5kaW5nTWVzc2FnZSIsInByb2Nlc3NNZXNzYWdlIiwibXNnX2luIiwibWVzc2FnZVJlY2VpdmVkIiwicHJvY2Vzc05leHQiLCJzaGlmdCIsInVuYmxvY2siLCJvbk1lc3NhZ2VIb29rIiwicHJvdG9jb2xfaGFuZGxlcnMiLCJjYWxsIiwic3ViIiwibmFtZSIsInBhcmFtcyIsIkFycmF5IiwicHVibGlzaF9oYW5kbGVycyIsImVycm9yIiwiRERQUmF0ZUxpbWl0ZXIiLCJyYXRlTGltaXRlcklucHV0IiwidHlwZSIsImNvbm5lY3Rpb25JZCIsIl9pbmNyZW1lbnQiLCJyYXRlTGltaXRSZXN1bHQiLCJfY2hlY2siLCJhbGxvd2VkIiwiZ2V0RXJyb3JNZXNzYWdlIiwidGltZVRvUmVzZXQiLCJ1bnN1YiIsIl9zdG9wU3Vic2NyaXB0aW9uIiwibWV0aG9kIiwicmFuZG9tU2VlZCIsImZlbmNlIiwiX1dyaXRlRmVuY2UiLCJvbkFsbENvbW1pdHRlZCIsInJldGlyZSIsIm1ldGhvZHMiLCJtZXRob2RfaGFuZGxlcnMiLCJhcm0iLCJzZXRVc2VySWQiLCJfc2V0VXNlcklkIiwiaW52b2NhdGlvbiIsIk1ldGhvZEludm9jYXRpb24iLCJpc1NpbXVsYXRpb24iLCJwcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJfQ3VycmVudFdyaXRlRmVuY2UiLCJ3aXRoVmFsdWUiLCJERFAiLCJfQ3VycmVudE1ldGhvZEludm9jYXRpb24iLCJtYXliZUF1ZGl0QXJndW1lbnRDaGVja3MiLCJmaW5pc2giLCJwYXlsb2FkIiwidGhlbiIsInJlc3VsdCIsImV4Y2VwdGlvbiIsIndyYXBJbnRlcm5hbEV4Y2VwdGlvbiIsIl9lYWNoU3ViIiwiZiIsIl9kaWZmQ29sbGVjdGlvblZpZXdzIiwiYmVmb3JlQ1ZzIiwibGVmdFZhbHVlIiwicmlnaHRWYWx1ZSIsImRvYyIsIl9kZWFjdGl2YXRlIiwib2xkTmFtZWRTdWJzIiwiX3JlY3JlYXRlIiwiX3J1bkhhbmRsZXIiLCJfbm9ZaWVsZHNBbGxvd2VkIiwic3ViSWQiLCJTdWJzY3JpcHRpb24iLCJzdWJOYW1lIiwiX25hbWUiLCJfcmVtb3ZlQWxsRG9jdW1lbnRzIiwicmVzcG9uc2UiLCJodHRwRm9yd2FyZGVkQ291bnQiLCJwYXJzZUludCIsInJlbW90ZUFkZHJlc3MiLCJmb3J3YXJkZWRGb3IiLCJpc1N0cmluZyIsInRyaW0iLCJzcGxpdCIsIl9oYW5kbGVyIiwiX3N1YnNjcmlwdGlvbklkIiwiX3BhcmFtcyIsIl9zdWJzY3JpcHRpb25IYW5kbGUiLCJfZGVhY3RpdmF0ZWQiLCJfc3RvcENhbGxiYWNrcyIsIl9kb2N1bWVudHMiLCJfcmVhZHkiLCJfaWRGaWx0ZXIiLCJpZFN0cmluZ2lmeSIsIk1vbmdvSUQiLCJpZFBhcnNlIiwicmVzIiwiX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24iLCJlIiwiX2lzRGVhY3RpdmF0ZWQiLCJfcHVibGlzaEhhbmRsZXJSZXN1bHQiLCJpc0N1cnNvciIsImMiLCJfcHVibGlzaEN1cnNvciIsInJlYWR5IiwiaXNBcnJheSIsImFsbCIsImNvbGxlY3Rpb25OYW1lcyIsIl9nZXRDb2xsZWN0aW9uTmFtZSIsImN1ciIsIl9jYWxsU3RvcENhbGxiYWNrcyIsImNvbGxlY3Rpb25Eb2NzIiwia2V5cyIsInN0cklkIiwib25TdG9wIiwiX2Vuc3VyZSIsIlNlcnZlciIsImRlZmF1bHRzIiwib25Db25uZWN0aW9uSG9vayIsIkhvb2siLCJkZWJ1Z1ByaW50RXhjZXB0aW9ucyIsInNlc3Npb25zIiwic3RyZWFtX3NlcnZlciIsInJhd19tc2ciLCJfcHJpbnRSZWNlaXZlZEREUCIsInBhcnNlRERQIiwiX2hhbmRsZUNvbm5lY3QiLCJtZXNzYWdlIiwic3RhY2siLCJvbkNvbm5lY3Rpb24iLCJvbk1lc3NhZ2UiLCJzdXBwb3J0IiwiY29udGFpbnMiLCJTVVBQT1JURURfRERQX1ZFUlNJT05TIiwiY2FsY3VsYXRlVmVyc2lvbiIsInB1Ymxpc2giLCJpc09iamVjdCIsImF1dG9wdWJsaXNoIiwiaXNfYXV0byIsIndhcm5lZF9hYm91dF9hdXRvcHVibGlzaCIsImZ1bmMiLCJwb3AiLCJjYWxsQXN5bmMiLCJhcHBseUFzeW5jIiwiYXdhaXQiLCJjdXJyZW50TWV0aG9kSW52b2NhdGlvbiIsImdldCIsImN1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24iLCJtYWtlUnBjU2VlZCIsIl91cmxGb3JTZXNzaW9uIiwic2Vzc2lvbklkIiwiY2xpZW50U3VwcG9ydGVkVmVyc2lvbnMiLCJzZXJ2ZXJTdXBwb3J0ZWRWZXJzaW9ucyIsImNvcnJlY3RWZXJzaW9uIiwiX2NhbGN1bGF0ZVZlcnNpb24iLCJjb250ZXh0IiwiaXNDbGllbnRTYWZlIiwib3JpZ2luYWxNZXNzYWdlIiwiZGV0YWlscyIsIl9leHBlY3RlZEJ5VGVzdCIsInNhbml0aXplZEVycm9yIiwiZGVzY3JpcHRpb24iLCJNYXRjaCIsIl9mYWlsSWZBcmd1bWVudHNBcmVOb3RBbGxDaGVja2VkIiwiRnV0dXJlIiwiYXJtZWQiLCJmaXJlZCIsInJldGlyZWQiLCJvdXRzdGFuZGluZ193cml0ZXMiLCJiZWZvcmVfZmlyZV9jYWxsYmFja3MiLCJjb21wbGV0aW9uX2NhbGxiYWNrcyIsIkVudmlyb25tZW50VmFyaWFibGUiLCJiZWdpbldyaXRlIiwiY29tbWl0dGVkIiwiX21heWJlRmlyZSIsIm9uQmVmb3JlRmlyZSIsImFybUFuZFdhaXQiLCJmdXR1cmUiLCJ3YWl0IiwiaW52b2tlQ2FsbGJhY2siLCJfQ3Jvc3NiYXIiLCJuZXh0SWQiLCJsaXN0ZW5lcnNCeUNvbGxlY3Rpb24iLCJmYWN0UGFja2FnZSIsImZhY3ROYW1lIiwiX2NvbGxlY3Rpb25Gb3JNZXNzYWdlIiwibGlzdGVuIiwidHJpZ2dlciIsInJlY29yZCIsImZpcmUiLCJub3RpZmljYXRpb24iLCJsaXN0ZW5lcnNGb3JDb2xsZWN0aW9uIiwiY2FsbGJhY2tJZHMiLCJsIiwiX21hdGNoZXMiLCJPYmplY3RJRCIsInRyaWdnZXJWYWx1ZSIsIl9JbnZhbGlkYXRpb25Dcm9zc2JhciIsIkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMIiwicmVmcmVzaCIsImRlZmF1bHRfc2VydmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFNQyxJQUFJQyxPQUFKLENBQVksS0FBWixDQUFWLEMsQ0FFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxJQUFJQyxzQkFBc0JDLEVBQUVDLElBQUYsQ0FBTyxZQUFZO0FBQzNDLE1BQUlDLGFBQWEsRUFBakI7QUFFQSxNQUFJQyw2QkFBNkJDLFFBQVFDLEdBQVIsQ0FBWUMsNEJBQVosR0FDekJDLEtBQUtDLEtBQUwsQ0FBV0osUUFBUUMsR0FBUixDQUFZQyw0QkFBdkIsQ0FEeUIsR0FDOEIsRUFEL0Q7O0FBRUEsTUFBSUgsMEJBQUosRUFBZ0M7QUFDOUJELGVBQVdPLElBQVgsQ0FBZ0JaLElBQUlDLE9BQUosQ0FBWSxvQkFBWixFQUFrQ1ksU0FBbEMsQ0FDZFAsMEJBRGMsQ0FBaEI7QUFHRDs7QUFFRCxTQUFPRCxVQUFQO0FBQ0QsQ0FaeUIsQ0FBMUI7O0FBY0EsSUFBSVMsYUFBYUMsMEJBQTBCQyxvQkFBMUIsSUFBbUQsRUFBcEU7O0FBRUFDLGVBQWUsWUFBWTtBQUN6QixNQUFJQyxPQUFPLElBQVg7QUFDQUEsT0FBS0Msc0JBQUwsR0FBOEIsRUFBOUI7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WyJ2YXIgdXJsID0gTnBtLnJlcXVpcmUoJ3VybCcpO1xuXG4vLyBCeSBkZWZhdWx0LCB3ZSB1c2UgdGhlIHBlcm1lc3NhZ2UtZGVmbGF0ZSBleHRlbnNpb24gd2l0aCBkZWZhdWx0XG4vLyBjb25maWd1cmF0aW9uLiBJZiAkU0VSVkVSX1dFQlNPQ0tFVF9DT01QUkVTU0lPTiBpcyBzZXQsIHRoZW4gaXQgbXVzdCBiZSB2YWxpZFxuLy8gSlNPTi4gSWYgaXQgcmVwcmVzZW50cyBhIGZhbHNleSB2YWx1ZSwgdGhlbiB3ZSBkbyBub3QgdXNlIHBlcm1lc3NhZ2UtZGVmbGF0ZVxuLy8gYXQgYWxsOyBvdGhlcndpc2UsIHRoZSBKU09OIHZhbHVlIGlzIHVzZWQgYXMgYW4gYXJndW1lbnQgdG8gZGVmbGF0ZSdzXG4vLyBjb25maWd1cmUgbWV0aG9kOyBzZWVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYXllL3Blcm1lc3NhZ2UtZGVmbGF0ZS1ub2RlL2Jsb2IvbWFzdGVyL1JFQURNRS5tZFxuLy9cbi8vIChXZSBkbyB0aGlzIGluIGFuIF8ub25jZSBpbnN0ZWFkIG9mIGF0IHN0YXJ0dXAsIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCB0b1xuLy8gY3Jhc2ggdGhlIHRvb2wgZHVyaW5nIGlzb3BhY2tldCBsb2FkIGlmIHlvdXIgSlNPTiBkb2Vzbid0IHBhcnNlLiBUaGlzIGlzIG9ubHlcbi8vIGEgcHJvYmxlbSBiZWNhdXNlIHRoZSB0b29sIGhhcyB0byBsb2FkIHRoZSBERFAgc2VydmVyIGNvZGUganVzdCBpbiBvcmRlciB0b1xuLy8gYmUgYSBERFAgY2xpZW50OyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzM0NTIgLilcbnZhciB3ZWJzb2NrZXRFeHRlbnNpb25zID0gXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4dGVuc2lvbnMgPSBbXTtcblxuICB2YXIgd2Vic29ja2V0Q29tcHJlc3Npb25Db25maWcgPSBwcm9jZXNzLmVudi5TRVJWRVJfV0VCU09DS0VUX0NPTVBSRVNTSU9OXG4gICAgICAgID8gSlNPTi5wYXJzZShwcm9jZXNzLmVudi5TRVJWRVJfV0VCU09DS0VUX0NPTVBSRVNTSU9OKSA6IHt9O1xuICBpZiAod2Vic29ja2V0Q29tcHJlc3Npb25Db25maWcpIHtcbiAgICBleHRlbnNpb25zLnB1c2goTnBtLnJlcXVpcmUoJ3Blcm1lc3NhZ2UtZGVmbGF0ZScpLmNvbmZpZ3VyZShcbiAgICAgIHdlYnNvY2tldENvbXByZXNzaW9uQ29uZmlnXG4gICAgKSk7XG4gIH1cblxuICByZXR1cm4gZXh0ZW5zaW9ucztcbn0pO1xuXG52YXIgcGF0aFByZWZpeCA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggfHwgIFwiXCI7XG5cblN0cmVhbVNlcnZlciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLnJlZ2lzdHJhdGlvbl9jYWxsYmFja3MgPSBbXTtcbiAgc2VsZi5vcGVuX3NvY2tldHMgPSBbXTtcblxuICAvLyBCZWNhdXNlIHdlIGFyZSBpbnN0YWxsaW5nIGRpcmVjdGx5IG9udG8gV2ViQXBwLmh0dHBTZXJ2ZXIgaW5zdGVhZCBvZiB1c2luZ1xuICAvLyBXZWJBcHAuYXBwLCB3ZSBoYXZlIHRvIHByb2Nlc3MgdGhlIHBhdGggcHJlZml4IG91cnNlbHZlcy5cbiAgc2VsZi5wcmVmaXggPSBwYXRoUHJlZml4ICsgJy9zb2NranMnO1xuICBSb3V0ZVBvbGljeS5kZWNsYXJlKHNlbGYucHJlZml4ICsgJy8nLCAnbmV0d29yaycpO1xuXG4gIC8vIHNldCB1cCBzb2NranNcbiAgdmFyIHNvY2tqcyA9IE5wbS5yZXF1aXJlKCdzb2NranMnKTtcbiAgdmFyIHNlcnZlck9wdGlvbnMgPSB7XG4gICAgcHJlZml4OiBzZWxmLnByZWZpeCxcbiAgICBsb2c6IGZ1bmN0aW9uKCkge30sXG4gICAgLy8gdGhpcyBpcyB0aGUgZGVmYXVsdCwgYnV0IHdlIGNvZGUgaXQgZXhwbGljaXRseSBiZWNhdXNlIHdlIGRlcGVuZFxuICAgIC8vIG9uIGl0IGluIHN0cmVhbV9jbGllbnQ6SEVBUlRCRUFUX1RJTUVPVVRcbiAgICBoZWFydGJlYXRfZGVsYXk6IDQ1MDAwLFxuICAgIC8vIFRoZSBkZWZhdWx0IGRpc2Nvbm5lY3RfZGVsYXkgaXMgNSBzZWNvbmRzLCBidXQgaWYgdGhlIHNlcnZlciBlbmRzIHVwIENQVVxuICAgIC8vIGJvdW5kIGZvciB0aGF0IG11Y2ggdGltZSwgU29ja0pTIG1pZ2h0IG5vdCBub3RpY2UgdGhhdCB0aGUgdXNlciBoYXNcbiAgICAvLyByZWNvbm5lY3RlZCBiZWNhdXNlIHRoZSB0aW1lciAob2YgZGlzY29ubmVjdF9kZWxheSBtcykgY2FuIGZpcmUgYmVmb3JlXG4gICAgLy8gU29ja0pTIHByb2Nlc3NlcyB0aGUgbmV3IGNvbm5lY3Rpb24uIEV2ZW50dWFsbHkgd2UnbGwgZml4IHRoaXMgYnkgbm90XG4gICAgLy8gY29tYmluaW5nIENQVS1oZWF2eSBwcm9jZXNzaW5nIHdpdGggU29ja0pTIHRlcm1pbmF0aW9uIChlZyBhIHByb3h5IHdoaWNoXG4gICAgLy8gY29udmVydHMgdG8gVW5peCBzb2NrZXRzKSBidXQgZm9yIG5vdywgcmFpc2UgdGhlIGRlbGF5LlxuICAgIGRpc2Nvbm5lY3RfZGVsYXk6IDYwICogMTAwMCxcbiAgICAvLyBTZXQgdGhlIFVTRV9KU0VTU0lPTklEIGVudmlyb25tZW50IHZhcmlhYmxlIHRvIGVuYWJsZSBzZXR0aW5nIHRoZVxuICAgIC8vIEpTRVNTSU9OSUQgY29va2llLiBUaGlzIGlzIHVzZWZ1bCBmb3Igc2V0dGluZyB1cCBwcm94aWVzIHdpdGhcbiAgICAvLyBzZXNzaW9uIGFmZmluaXR5LlxuICAgIGpzZXNzaW9uaWQ6ICEhcHJvY2Vzcy5lbnYuVVNFX0pTRVNTSU9OSURcbiAgfTtcblxuICAvLyBJZiB5b3Uga25vdyB5b3VyIHNlcnZlciBlbnZpcm9ubWVudCAoZWcsIHByb3hpZXMpIHdpbGwgcHJldmVudCB3ZWJzb2NrZXRzXG4gIC8vIGZyb20gZXZlciB3b3JraW5nLCBzZXQgJERJU0FCTEVfV0VCU09DS0VUUyBhbmQgU29ja0pTIGNsaWVudHMgKGllLFxuICAvLyBicm93c2Vycykgd2lsbCBub3Qgd2FzdGUgdGltZSBhdHRlbXB0aW5nIHRvIHVzZSB0aGVtLlxuICAvLyAoWW91ciBzZXJ2ZXIgd2lsbCBzdGlsbCBoYXZlIGEgL3dlYnNvY2tldCBlbmRwb2ludC4pXG4gIGlmIChwcm9jZXNzLmVudi5ESVNBQkxFX1dFQlNPQ0tFVFMpIHtcbiAgICBzZXJ2ZXJPcHRpb25zLndlYnNvY2tldCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHNlcnZlck9wdGlvbnMuZmF5ZV9zZXJ2ZXJfb3B0aW9ucyA9IHtcbiAgICAgIGV4dGVuc2lvbnM6IHdlYnNvY2tldEV4dGVuc2lvbnMoKVxuICAgIH07XG4gIH1cblxuICBzZWxmLnNlcnZlciA9IHNvY2tqcy5jcmVhdGVTZXJ2ZXIoc2VydmVyT3B0aW9ucyk7XG5cbiAgLy8gSW5zdGFsbCB0aGUgc29ja2pzIGhhbmRsZXJzLCBidXQgd2Ugd2FudCB0byBrZWVwIGFyb3VuZCBvdXIgb3duIHBhcnRpY3VsYXJcbiAgLy8gcmVxdWVzdCBoYW5kbGVyIHRoYXQgYWRqdXN0cyBpZGxlIHRpbWVvdXRzIHdoaWxlIHdlIGhhdmUgYW4gb3V0c3RhbmRpbmdcbiAgLy8gcmVxdWVzdC4gIFRoaXMgY29tcGVuc2F0ZXMgZm9yIHRoZSBmYWN0IHRoYXQgc29ja2pzIHJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICAvLyBmb3IgXCJyZXF1ZXN0XCIgdG8gYWRkIGl0cyBvd24uXG4gIFdlYkFwcC5odHRwU2VydmVyLnJlbW92ZUxpc3RlbmVyKFxuICAgICdyZXF1ZXN0JywgV2ViQXBwLl90aW1lb3V0QWRqdXN0bWVudFJlcXVlc3RDYWxsYmFjayk7XG4gIHNlbGYuc2VydmVyLmluc3RhbGxIYW5kbGVycyhXZWJBcHAuaHR0cFNlcnZlcik7XG4gIFdlYkFwcC5odHRwU2VydmVyLmFkZExpc3RlbmVyKFxuICAgICdyZXF1ZXN0JywgV2ViQXBwLl90aW1lb3V0QWRqdXN0bWVudFJlcXVlc3RDYWxsYmFjayk7XG5cbiAgLy8gU3VwcG9ydCB0aGUgL3dlYnNvY2tldCBlbmRwb2ludFxuICBzZWxmLl9yZWRpcmVjdFdlYnNvY2tldEVuZHBvaW50KCk7XG5cbiAgc2VsZi5zZXJ2ZXIub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbiAoc29ja2V0KSB7XG4gICAgLy8gV2Ugd2FudCB0byBtYWtlIHN1cmUgdGhhdCBpZiBhIGNsaWVudCBjb25uZWN0cyB0byB1cyBhbmQgZG9lcyB0aGUgaW5pdGlhbFxuICAgIC8vIFdlYnNvY2tldCBoYW5kc2hha2UgYnV0IG5ldmVyIGdldHMgdG8gdGhlIEREUCBoYW5kc2hha2UsIHRoYXQgd2VcbiAgICAvLyBldmVudHVhbGx5IGtpbGwgdGhlIHNvY2tldC4gIE9uY2UgdGhlIEREUCBoYW5kc2hha2UgaGFwcGVucywgRERQXG4gICAgLy8gaGVhcnRiZWF0aW5nIHdpbGwgd29yay4gQW5kIGJlZm9yZSB0aGUgV2Vic29ja2V0IGhhbmRzaGFrZSwgdGhlIHRpbWVvdXRzXG4gICAgLy8gd2Ugc2V0IGF0IHRoZSBzZXJ2ZXIgbGV2ZWwgaW4gd2ViYXBwX3NlcnZlci5qcyB3aWxsIHdvcmsuIEJ1dFxuICAgIC8vIGZheWUtd2Vic29ja2V0IGNhbGxzIHNldFRpbWVvdXQoMCkgb24gYW55IHNvY2tldCBpdCB0YWtlcyBvdmVyLCBzbyB0aGVyZVxuICAgIC8vIGlzIGFuIFwiaW4gYmV0d2VlblwiIHN0YXRlIHdoZXJlIHRoaXMgZG9lc24ndCBoYXBwZW4uICBXZSB3b3JrIGFyb3VuZCB0aGlzXG4gICAgLy8gYnkgZXhwbGljaXRseSBzZXR0aW5nIHRoZSBzb2NrZXQgdGltZW91dCB0byBhIHJlbGF0aXZlbHkgbGFyZ2UgdGltZSBoZXJlLFxuICAgIC8vIGFuZCBzZXR0aW5nIGl0IGJhY2sgdG8gemVybyB3aGVuIHdlIHNldCB1cCB0aGUgaGVhcnRiZWF0IGluXG4gICAgLy8gbGl2ZWRhdGFfc2VydmVyLmpzLlxuICAgIHNvY2tldC5zZXRXZWJzb2NrZXRUaW1lb3V0ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICAgIGlmICgoc29ja2V0LnByb3RvY29sID09PSAnd2Vic29ja2V0JyB8fFxuICAgICAgICAgICBzb2NrZXQucHJvdG9jb2wgPT09ICd3ZWJzb2NrZXQtcmF3JylcbiAgICAgICAgICAmJiBzb2NrZXQuX3Nlc3Npb24ucmVjdikge1xuICAgICAgICBzb2NrZXQuX3Nlc3Npb24ucmVjdi5jb25uZWN0aW9uLnNldFRpbWVvdXQodGltZW91dCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBzb2NrZXQuc2V0V2Vic29ja2V0VGltZW91dCg0NSAqIDEwMDApO1xuXG4gICAgc29ja2V0LnNlbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgc29ja2V0LndyaXRlKGRhdGEpO1xuICAgIH07XG4gICAgc29ja2V0Lm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYub3Blbl9zb2NrZXRzID0gXy53aXRob3V0KHNlbGYub3Blbl9zb2NrZXRzLCBzb2NrZXQpO1xuICAgIH0pO1xuICAgIHNlbGYub3Blbl9zb2NrZXRzLnB1c2goc29ja2V0KTtcblxuICAgIC8vIFhYWCBDT01QQVQgV0lUSCAwLjYuNi4gU2VuZCB0aGUgb2xkIHN0eWxlIHdlbGNvbWUgbWVzc2FnZSwgd2hpY2hcbiAgICAvLyB3aWxsIGZvcmNlIG9sZCBjbGllbnRzIHRvIHJlbG9hZC4gUmVtb3ZlIHRoaXMgb25jZSB3ZSdyZSBub3RcbiAgICAvLyBjb25jZXJuZWQgYWJvdXQgcGVvcGxlIHVwZ3JhZGluZyBmcm9tIGEgcHJlLTAuNy4wIHJlbGVhc2UuIEFsc28sXG4gICAgLy8gcmVtb3ZlIHRoZSBjbGF1c2UgaW4gdGhlIGNsaWVudCB0aGF0IGlnbm9yZXMgdGhlIHdlbGNvbWUgbWVzc2FnZVxuICAgIC8vIChsaXZlZGF0YV9jb25uZWN0aW9uLmpzKVxuICAgIHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHtzZXJ2ZXJfaWQ6IFwiMFwifSkpO1xuXG4gICAgLy8gY2FsbCBhbGwgb3VyIGNhbGxiYWNrcyB3aGVuIHdlIGdldCBhIG5ldyBzb2NrZXQuIHRoZXkgd2lsbCBkbyB0aGVcbiAgICAvLyB3b3JrIG9mIHNldHRpbmcgdXAgaGFuZGxlcnMgYW5kIHN1Y2ggZm9yIHNwZWNpZmljIG1lc3NhZ2VzLlxuICAgIF8uZWFjaChzZWxmLnJlZ2lzdHJhdGlvbl9jYWxsYmFja3MsIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soc29ja2V0KTtcbiAgICB9KTtcbiAgfSk7XG5cbn07XG5cbl8uZXh0ZW5kKFN0cmVhbVNlcnZlci5wcm90b3R5cGUsIHtcbiAgLy8gY2FsbCBteSBjYWxsYmFjayB3aGVuIGEgbmV3IHNvY2tldCBjb25uZWN0cy5cbiAgLy8gYWxzbyBjYWxsIGl0IGZvciBhbGwgY3VycmVudCBjb25uZWN0aW9ucy5cbiAgcmVnaXN0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLnJlZ2lzdHJhdGlvbl9jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgXy5lYWNoKHNlbGYuYWxsX3NvY2tldHMoKSwgZnVuY3Rpb24gKHNvY2tldCkge1xuICAgICAgY2FsbGJhY2soc29ja2V0KTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBnZXQgYSBsaXN0IG9mIGFsbCBzb2NrZXRzXG4gIGFsbF9zb2NrZXRzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBfLnZhbHVlcyhzZWxmLm9wZW5fc29ja2V0cyk7XG4gIH0sXG5cbiAgLy8gUmVkaXJlY3QgL3dlYnNvY2tldCB0byAvc29ja2pzL3dlYnNvY2tldCBpbiBvcmRlciB0byBub3QgZXhwb3NlXG4gIC8vIHNvY2tqcyB0byBjbGllbnRzIHRoYXQgd2FudCB0byB1c2UgcmF3IHdlYnNvY2tldHNcbiAgX3JlZGlyZWN0V2Vic29ja2V0RW5kcG9pbnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBVbmZvcnR1bmF0ZWx5IHdlIGNhbid0IHVzZSBhIGNvbm5lY3QgbWlkZGxld2FyZSBoZXJlIHNpbmNlXG4gICAgLy8gc29ja2pzIGluc3RhbGxzIGl0c2VsZiBwcmlvciB0byBhbGwgZXhpc3RpbmcgbGlzdGVuZXJzXG4gICAgLy8gKG1lYW5pbmcgcHJpb3IgdG8gYW55IGNvbm5lY3QgbWlkZGxld2FyZXMpIHNvIHdlIG5lZWQgdG8gdGFrZVxuICAgIC8vIGFuIGFwcHJvYWNoIHNpbWlsYXIgdG8gb3ZlcnNoYWRvd0xpc3RlbmVycyBpblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NranMvc29ja2pzLW5vZGUvYmxvYi9jZjgyMGM1NWFmNmE5OTUzZTE2NTU4NTU1YTMxZGVjZWE1NTRmNzBlL3NyYy91dGlscy5jb2ZmZWVcbiAgICBfLmVhY2goWydyZXF1ZXN0JywgJ3VwZ3JhZGUnXSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBodHRwU2VydmVyID0gV2ViQXBwLmh0dHBTZXJ2ZXI7XG4gICAgICB2YXIgb2xkSHR0cFNlcnZlckxpc3RlbmVycyA9IGh0dHBTZXJ2ZXIubGlzdGVuZXJzKGV2ZW50KS5zbGljZSgwKTtcbiAgICAgIGh0dHBTZXJ2ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KTtcblxuICAgICAgLy8gcmVxdWVzdCBhbmQgdXBncmFkZSBoYXZlIGRpZmZlcmVudCBhcmd1bWVudHMgcGFzc2VkIGJ1dFxuICAgICAgLy8gd2Ugb25seSBjYXJlIGFib3V0IHRoZSBmaXJzdCBvbmUgd2hpY2ggaXMgYWx3YXlzIHJlcXVlc3RcbiAgICAgIHZhciBuZXdMaXN0ZW5lciA9IGZ1bmN0aW9uKHJlcXVlc3QgLyosIG1vcmVBcmd1bWVudHMgKi8pIHtcbiAgICAgICAgLy8gU3RvcmUgYXJndW1lbnRzIGZvciB1c2Ugd2l0aGluIHRoZSBjbG9zdXJlIGJlbG93XG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICAgIC8vIFJld3JpdGUgL3dlYnNvY2tldCBhbmQgL3dlYnNvY2tldC8gdXJscyB0byAvc29ja2pzL3dlYnNvY2tldCB3aGlsZVxuICAgICAgICAvLyBwcmVzZXJ2aW5nIHF1ZXJ5IHN0cmluZy5cbiAgICAgICAgdmFyIHBhcnNlZFVybCA9IHVybC5wYXJzZShyZXF1ZXN0LnVybCk7XG4gICAgICAgIGlmIChwYXJzZWRVcmwucGF0aG5hbWUgPT09IHBhdGhQcmVmaXggKyAnL3dlYnNvY2tldCcgfHxcbiAgICAgICAgICAgIHBhcnNlZFVybC5wYXRobmFtZSA9PT0gcGF0aFByZWZpeCArICcvd2Vic29ja2V0LycpIHtcbiAgICAgICAgICBwYXJzZWRVcmwucGF0aG5hbWUgPSBzZWxmLnByZWZpeCArICcvd2Vic29ja2V0JztcbiAgICAgICAgICByZXF1ZXN0LnVybCA9IHVybC5mb3JtYXQocGFyc2VkVXJsKTtcbiAgICAgICAgfVxuICAgICAgICBfLmVhY2gob2xkSHR0cFNlcnZlckxpc3RlbmVycywgZnVuY3Rpb24ob2xkTGlzdGVuZXIpIHtcbiAgICAgICAgICBvbGRMaXN0ZW5lci5hcHBseShodHRwU2VydmVyLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgaHR0cFNlcnZlci5hZGRMaXN0ZW5lcihldmVudCwgbmV3TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9XG59KTtcbiIsIkREUFNlcnZlciA9IHt9O1xuXG52YXIgRmliZXIgPSBOcG0ucmVxdWlyZSgnZmliZXJzJyk7XG5cbi8vIFRoaXMgZmlsZSBjb250YWlucyBjbGFzc2VzOlxuLy8gKiBTZXNzaW9uIC0gVGhlIHNlcnZlcidzIGNvbm5lY3Rpb24gdG8gYSBzaW5nbGUgRERQIGNsaWVudFxuLy8gKiBTdWJzY3JpcHRpb24gLSBBIHNpbmdsZSBzdWJzY3JpcHRpb24gZm9yIGEgc2luZ2xlIGNsaWVudFxuLy8gKiBTZXJ2ZXIgLSBBbiBlbnRpcmUgc2VydmVyIHRoYXQgbWF5IHRhbGsgdG8gPiAxIGNsaWVudC4gQSBERFAgZW5kcG9pbnQuXG4vL1xuLy8gU2Vzc2lvbiBhbmQgU3Vic2NyaXB0aW9uIGFyZSBmaWxlIHNjb3BlLiBGb3Igbm93LCB1bnRpbCB3ZSBmcmVlemVcbi8vIHRoZSBpbnRlcmZhY2UsIFNlcnZlciBpcyBwYWNrYWdlIHNjb3BlIChpbiB0aGUgZnV0dXJlIGl0IHNob3VsZCBiZVxuLy8gZXhwb3J0ZWQuKVxuXG4vLyBSZXByZXNlbnRzIGEgc2luZ2xlIGRvY3VtZW50IGluIGEgU2Vzc2lvbkNvbGxlY3Rpb25WaWV3XG52YXIgU2Vzc2lvbkRvY3VtZW50VmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmV4aXN0c0luID0ge307IC8vIHNldCBvZiBzdWJzY3JpcHRpb25IYW5kbGVcbiAgc2VsZi5kYXRhQnlLZXkgPSB7fTsgLy8ga2V5LT4gWyB7c3Vic2NyaXB0aW9uSGFuZGxlLCB2YWx1ZX0gYnkgcHJlY2VkZW5jZV1cbn07XG5cbkREUFNlcnZlci5fU2Vzc2lvbkRvY3VtZW50VmlldyA9IFNlc3Npb25Eb2N1bWVudFZpZXc7XG5cblxuXy5leHRlbmQoU2Vzc2lvbkRvY3VtZW50Vmlldy5wcm90b3R5cGUsIHtcblxuICBnZXRGaWVsZHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHJldCA9IHt9O1xuICAgIF8uZWFjaChzZWxmLmRhdGFCeUtleSwgZnVuY3Rpb24gKHByZWNlZGVuY2VMaXN0LCBrZXkpIHtcbiAgICAgIHJldFtrZXldID0gcHJlY2VkZW5jZUxpc3RbMF0udmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICBjbGVhckZpZWxkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBrZXksIGNoYW5nZUNvbGxlY3Rvcikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBQdWJsaXNoIEFQSSBpZ25vcmVzIF9pZCBpZiBwcmVzZW50IGluIGZpZWxkc1xuICAgIGlmIChrZXkgPT09IFwiX2lkXCIpXG4gICAgICByZXR1cm47XG4gICAgdmFyIHByZWNlZGVuY2VMaXN0ID0gc2VsZi5kYXRhQnlLZXlba2V5XTtcblxuICAgIC8vIEl0J3Mgb2theSB0byBjbGVhciBmaWVsZHMgdGhhdCBkaWRuJ3QgZXhpc3QuIE5vIG5lZWQgdG8gdGhyb3dcbiAgICAvLyBhbiBlcnJvci5cbiAgICBpZiAoIXByZWNlZGVuY2VMaXN0KVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIHJlbW92ZWRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWNlZGVuY2VMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcHJlY2VkZW5jZSA9IHByZWNlZGVuY2VMaXN0W2ldO1xuICAgICAgaWYgKHByZWNlZGVuY2Uuc3Vic2NyaXB0aW9uSGFuZGxlID09PSBzdWJzY3JpcHRpb25IYW5kbGUpIHtcbiAgICAgICAgLy8gVGhlIHZpZXcncyB2YWx1ZSBjYW4gb25seSBjaGFuZ2UgaWYgdGhpcyBzdWJzY3JpcHRpb24gaXMgdGhlIG9uZSB0aGF0XG4gICAgICAgIC8vIHVzZWQgdG8gaGF2ZSBwcmVjZWRlbmNlLlxuICAgICAgICBpZiAoaSA9PT0gMClcbiAgICAgICAgICByZW1vdmVkVmFsdWUgPSBwcmVjZWRlbmNlLnZhbHVlO1xuICAgICAgICBwcmVjZWRlbmNlTGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXy5pc0VtcHR5KHByZWNlZGVuY2VMaXN0KSkge1xuICAgICAgZGVsZXRlIHNlbGYuZGF0YUJ5S2V5W2tleV07XG4gICAgICBjaGFuZ2VDb2xsZWN0b3Jba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2UgaWYgKHJlbW92ZWRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAhRUpTT04uZXF1YWxzKHJlbW92ZWRWYWx1ZSwgcHJlY2VkZW5jZUxpc3RbMF0udmFsdWUpKSB7XG4gICAgICBjaGFuZ2VDb2xsZWN0b3Jba2V5XSA9IHByZWNlZGVuY2VMaXN0WzBdLnZhbHVlO1xuICAgIH1cbiAgfSxcblxuICBjaGFuZ2VGaWVsZDogZnVuY3Rpb24gKHN1YnNjcmlwdGlvbkhhbmRsZSwga2V5LCB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDb2xsZWN0b3IsIGlzQWRkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIFB1Ymxpc2ggQVBJIGlnbm9yZXMgX2lkIGlmIHByZXNlbnQgaW4gZmllbGRzXG4gICAgaWYgKGtleSA9PT0gXCJfaWRcIilcbiAgICAgIHJldHVybjtcblxuICAgIC8vIERvbid0IHNoYXJlIHN0YXRlIHdpdGggdGhlIGRhdGEgcGFzc2VkIGluIGJ5IHRoZSB1c2VyLlxuICAgIHZhbHVlID0gRUpTT04uY2xvbmUodmFsdWUpO1xuXG4gICAgaWYgKCFfLmhhcyhzZWxmLmRhdGFCeUtleSwga2V5KSkge1xuICAgICAgc2VsZi5kYXRhQnlLZXlba2V5XSA9IFt7c3Vic2NyaXB0aW9uSGFuZGxlOiBzdWJzY3JpcHRpb25IYW5kbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWV9XTtcbiAgICAgIGNoYW5nZUNvbGxlY3RvcltrZXldID0gdmFsdWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcmVjZWRlbmNlTGlzdCA9IHNlbGYuZGF0YUJ5S2V5W2tleV07XG4gICAgdmFyIGVsdDtcbiAgICBpZiAoIWlzQWRkKSB7XG4gICAgICBlbHQgPSBfLmZpbmQocHJlY2VkZW5jZUxpc3QsIGZ1bmN0aW9uIChwcmVjZWRlbmNlKSB7XG4gICAgICAgIHJldHVybiBwcmVjZWRlbmNlLnN1YnNjcmlwdGlvbkhhbmRsZSA9PT0gc3Vic2NyaXB0aW9uSGFuZGxlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGVsdCkge1xuICAgICAgaWYgKGVsdCA9PT0gcHJlY2VkZW5jZUxpc3RbMF0gJiYgIUVKU09OLmVxdWFscyh2YWx1ZSwgZWx0LnZhbHVlKSkge1xuICAgICAgICAvLyB0aGlzIHN1YnNjcmlwdGlvbiBpcyBjaGFuZ2luZyB0aGUgdmFsdWUgb2YgdGhpcyBmaWVsZC5cbiAgICAgICAgY2hhbmdlQ29sbGVjdG9yW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGVsdC52YWx1ZSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyB0aGlzIHN1YnNjcmlwdGlvbiBpcyBuZXdseSBjYXJpbmcgYWJvdXQgdGhpcyBmaWVsZFxuICAgICAgcHJlY2VkZW5jZUxpc3QucHVzaCh7c3Vic2NyaXB0aW9uSGFuZGxlOiBzdWJzY3JpcHRpb25IYW5kbGUsIHZhbHVlOiB2YWx1ZX0pO1xuICAgIH1cblxuICB9XG59KTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY2xpZW50J3MgdmlldyBvZiBhIHNpbmdsZSBjb2xsZWN0aW9uXG4gKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbk5hbWUgTmFtZSBvZiB0aGUgY29sbGVjdGlvbiBpdCByZXByZXNlbnRzXG4gKiBAcGFyYW0ge09iamVjdC48U3RyaW5nLCBGdW5jdGlvbj59IHNlc3Npb25DYWxsYmFja3MgVGhlIGNhbGxiYWNrcyBmb3IgYWRkZWQsIGNoYW5nZWQsIHJlbW92ZWRcbiAqIEBjbGFzcyBTZXNzaW9uQ29sbGVjdGlvblZpZXdcbiAqL1xudmFyIFNlc3Npb25Db2xsZWN0aW9uVmlldyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgc2Vzc2lvbkNhbGxiYWNrcykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uTmFtZTtcbiAgc2VsZi5kb2N1bWVudHMgPSB7fTtcbiAgc2VsZi5jYWxsYmFja3MgPSBzZXNzaW9uQ2FsbGJhY2tzO1xufTtcblxuRERQU2VydmVyLl9TZXNzaW9uQ29sbGVjdGlvblZpZXcgPSBTZXNzaW9uQ29sbGVjdGlvblZpZXc7XG5cblxuXy5leHRlbmQoU2Vzc2lvbkNvbGxlY3Rpb25WaWV3LnByb3RvdHlwZSwge1xuXG4gIGlzRW1wdHk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIF8uaXNFbXB0eShzZWxmLmRvY3VtZW50cyk7XG4gIH0sXG5cbiAgZGlmZjogZnVuY3Rpb24gKHByZXZpb3VzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIERpZmZTZXF1ZW5jZS5kaWZmT2JqZWN0cyhwcmV2aW91cy5kb2N1bWVudHMsIHNlbGYuZG9jdW1lbnRzLCB7XG4gICAgICBib3RoOiBfLmJpbmQoc2VsZi5kaWZmRG9jdW1lbnQsIHNlbGYpLFxuXG4gICAgICByaWdodE9ubHk6IGZ1bmN0aW9uIChpZCwgbm93RFYpIHtcbiAgICAgICAgc2VsZi5jYWxsYmFja3MuYWRkZWQoc2VsZi5jb2xsZWN0aW9uTmFtZSwgaWQsIG5vd0RWLmdldEZpZWxkcygpKTtcbiAgICAgIH0sXG5cbiAgICAgIGxlZnRPbmx5OiBmdW5jdGlvbiAoaWQsIHByZXZEVikge1xuICAgICAgICBzZWxmLmNhbGxiYWNrcy5yZW1vdmVkKHNlbGYuY29sbGVjdGlvbk5hbWUsIGlkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBkaWZmRG9jdW1lbnQ6IGZ1bmN0aW9uIChpZCwgcHJldkRWLCBub3dEVikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZmllbGRzID0ge307XG4gICAgRGlmZlNlcXVlbmNlLmRpZmZPYmplY3RzKHByZXZEVi5nZXRGaWVsZHMoKSwgbm93RFYuZ2V0RmllbGRzKCksIHtcbiAgICAgIGJvdGg6IGZ1bmN0aW9uIChrZXksIHByZXYsIG5vdykge1xuICAgICAgICBpZiAoIUVKU09OLmVxdWFscyhwcmV2LCBub3cpKVxuICAgICAgICAgIGZpZWxkc1trZXldID0gbm93O1xuICAgICAgfSxcbiAgICAgIHJpZ2h0T25seTogZnVuY3Rpb24gKGtleSwgbm93KSB7XG4gICAgICAgIGZpZWxkc1trZXldID0gbm93O1xuICAgICAgfSxcbiAgICAgIGxlZnRPbmx5OiBmdW5jdGlvbihrZXksIHByZXYpIHtcbiAgICAgICAgZmllbGRzW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2VsZi5jYWxsYmFja3MuY2hhbmdlZChzZWxmLmNvbGxlY3Rpb25OYW1lLCBpZCwgZmllbGRzKTtcbiAgfSxcblxuICBhZGRlZDogZnVuY3Rpb24gKHN1YnNjcmlwdGlvbkhhbmRsZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZG9jVmlldyA9IHNlbGYuZG9jdW1lbnRzW2lkXTtcbiAgICB2YXIgYWRkZWQgPSBmYWxzZTtcbiAgICBpZiAoIWRvY1ZpZXcpIHtcbiAgICAgIGFkZGVkID0gdHJ1ZTtcbiAgICAgIGRvY1ZpZXcgPSBuZXcgU2Vzc2lvbkRvY3VtZW50VmlldygpO1xuICAgICAgc2VsZi5kb2N1bWVudHNbaWRdID0gZG9jVmlldztcbiAgICB9XG4gICAgZG9jVmlldy5leGlzdHNJbltzdWJzY3JpcHRpb25IYW5kbGVdID0gdHJ1ZTtcbiAgICB2YXIgY2hhbmdlQ29sbGVjdG9yID0ge307XG4gICAgXy5lYWNoKGZpZWxkcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIGRvY1ZpZXcuY2hhbmdlRmllbGQoXG4gICAgICAgIHN1YnNjcmlwdGlvbkhhbmRsZSwga2V5LCB2YWx1ZSwgY2hhbmdlQ29sbGVjdG9yLCB0cnVlKTtcbiAgICB9KTtcbiAgICBpZiAoYWRkZWQpXG4gICAgICBzZWxmLmNhbGxiYWNrcy5hZGRlZChzZWxmLmNvbGxlY3Rpb25OYW1lLCBpZCwgY2hhbmdlQ29sbGVjdG9yKTtcbiAgICBlbHNlXG4gICAgICBzZWxmLmNhbGxiYWNrcy5jaGFuZ2VkKHNlbGYuY29sbGVjdGlvbk5hbWUsIGlkLCBjaGFuZ2VDb2xsZWN0b3IpO1xuICB9LFxuXG4gIGNoYW5nZWQ6IGZ1bmN0aW9uIChzdWJzY3JpcHRpb25IYW5kbGUsIGlkLCBjaGFuZ2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBjaGFuZ2VkUmVzdWx0ID0ge307XG4gICAgdmFyIGRvY1ZpZXcgPSBzZWxmLmRvY3VtZW50c1tpZF07XG4gICAgaWYgKCFkb2NWaWV3KVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgZWxlbWVudCB3aXRoIGlkIFwiICsgaWQgKyBcIiB0byBjaGFuZ2VcIik7XG4gICAgXy5lYWNoKGNoYW5nZWQsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgZG9jVmlldy5jbGVhckZpZWxkKHN1YnNjcmlwdGlvbkhhbmRsZSwga2V5LCBjaGFuZ2VkUmVzdWx0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgZG9jVmlldy5jaGFuZ2VGaWVsZChzdWJzY3JpcHRpb25IYW5kbGUsIGtleSwgdmFsdWUsIGNoYW5nZWRSZXN1bHQpO1xuICAgIH0pO1xuICAgIHNlbGYuY2FsbGJhY2tzLmNoYW5nZWQoc2VsZi5jb2xsZWN0aW9uTmFtZSwgaWQsIGNoYW5nZWRSZXN1bHQpO1xuICB9LFxuXG4gIHJlbW92ZWQ6IGZ1bmN0aW9uIChzdWJzY3JpcHRpb25IYW5kbGUsIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkb2NWaWV3ID0gc2VsZi5kb2N1bWVudHNbaWRdO1xuICAgIGlmICghZG9jVmlldykge1xuICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcihcIlJlbW92ZWQgbm9uZXhpc3RlbnQgZG9jdW1lbnQgXCIgKyBpZCk7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIGRlbGV0ZSBkb2NWaWV3LmV4aXN0c0luW3N1YnNjcmlwdGlvbkhhbmRsZV07XG4gICAgaWYgKF8uaXNFbXB0eShkb2NWaWV3LmV4aXN0c0luKSkge1xuICAgICAgLy8gaXQgaXMgZ29uZSBmcm9tIGV2ZXJ5b25lXG4gICAgICBzZWxmLmNhbGxiYWNrcy5yZW1vdmVkKHNlbGYuY29sbGVjdGlvbk5hbWUsIGlkKTtcbiAgICAgIGRlbGV0ZSBzZWxmLmRvY3VtZW50c1tpZF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjaGFuZ2VkID0ge307XG4gICAgICAvLyByZW1vdmUgdGhpcyBzdWJzY3JpcHRpb24gZnJvbSBldmVyeSBwcmVjZWRlbmNlIGxpc3RcbiAgICAgIC8vIGFuZCByZWNvcmQgdGhlIGNoYW5nZXNcbiAgICAgIF8uZWFjaChkb2NWaWV3LmRhdGFCeUtleSwgZnVuY3Rpb24gKHByZWNlZGVuY2VMaXN0LCBrZXkpIHtcbiAgICAgICAgZG9jVmlldy5jbGVhckZpZWxkKHN1YnNjcmlwdGlvbkhhbmRsZSwga2V5LCBjaGFuZ2VkKTtcbiAgICAgIH0pO1xuXG4gICAgICBzZWxmLmNhbGxiYWNrcy5jaGFuZ2VkKHNlbGYuY29sbGVjdGlvbk5hbWUsIGlkLCBjaGFuZ2VkKTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogU2Vzc2lvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbnZhciBTZXNzaW9uID0gZnVuY3Rpb24gKHNlcnZlciwgdmVyc2lvbiwgc29ja2V0LCBvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5pZCA9IFJhbmRvbS5pZCgpO1xuXG4gIHNlbGYuc2VydmVyID0gc2VydmVyO1xuICBzZWxmLnZlcnNpb24gPSB2ZXJzaW9uO1xuXG4gIHNlbGYuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgc2VsZi5zb2NrZXQgPSBzb2NrZXQ7XG5cbiAgLy8gc2V0IHRvIG51bGwgd2hlbiB0aGUgc2Vzc2lvbiBpcyBkZXN0cm95ZWQuIG11bHRpcGxlIHBsYWNlcyBiZWxvd1xuICAvLyB1c2UgdGhpcyB0byBkZXRlcm1pbmUgaWYgdGhlIHNlc3Npb24gaXMgYWxpdmUgb3Igbm90LlxuICBzZWxmLmluUXVldWUgPSBuZXcgTWV0ZW9yLl9Eb3VibGVFbmRlZFF1ZXVlKCk7XG5cbiAgc2VsZi5ibG9ja2VkID0gZmFsc2U7XG4gIHNlbGYud29ya2VyUnVubmluZyA9IGZhbHNlO1xuXG4gIC8vIFN1YiBvYmplY3RzIGZvciBhY3RpdmUgc3Vic2NyaXB0aW9uc1xuICBzZWxmLl9uYW1lZFN1YnMgPSB7fTtcbiAgc2VsZi5fdW5pdmVyc2FsU3VicyA9IFtdO1xuXG4gIHNlbGYudXNlcklkID0gbnVsbDtcblxuICBzZWxmLmNvbGxlY3Rpb25WaWV3cyA9IHt9O1xuXG4gIC8vIFNldCB0aGlzIHRvIGZhbHNlIHRvIG5vdCBzZW5kIG1lc3NhZ2VzIHdoZW4gY29sbGVjdGlvblZpZXdzIGFyZVxuICAvLyBtb2RpZmllZC4gVGhpcyBpcyBkb25lIHdoZW4gcmVydW5uaW5nIHN1YnMgaW4gX3NldFVzZXJJZCBhbmQgdGhvc2UgbWVzc2FnZXNcbiAgLy8gYXJlIGNhbGN1bGF0ZWQgdmlhIGEgZGlmZiBpbnN0ZWFkLlxuICBzZWxmLl9pc1NlbmRpbmcgPSB0cnVlO1xuXG4gIC8vIElmIHRoaXMgaXMgdHJ1ZSwgZG9uJ3Qgc3RhcnQgYSBuZXdseS1jcmVhdGVkIHVuaXZlcnNhbCBwdWJsaXNoZXIgb24gdGhpc1xuICAvLyBzZXNzaW9uLiBUaGUgc2Vzc2lvbiB3aWxsIHRha2UgY2FyZSBvZiBzdGFydGluZyBpdCB3aGVuIGFwcHJvcHJpYXRlLlxuICBzZWxmLl9kb250U3RhcnROZXdVbml2ZXJzYWxTdWJzID0gZmFsc2U7XG5cbiAgLy8gd2hlbiB3ZSBhcmUgcmVydW5uaW5nIHN1YnNjcmlwdGlvbnMsIGFueSByZWFkeSBtZXNzYWdlc1xuICAvLyB3ZSB3YW50IHRvIGJ1ZmZlciB1cCBmb3Igd2hlbiB3ZSBhcmUgZG9uZSByZXJ1bm5pbmcgc3Vic2NyaXB0aW9uc1xuICBzZWxmLl9wZW5kaW5nUmVhZHkgPSBbXTtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyB0byBjYWxsIHdoZW4gdGhpcyBjb25uZWN0aW9uIGlzIGNsb3NlZC5cbiAgc2VsZi5fY2xvc2VDYWxsYmFja3MgPSBbXTtcblxuXG4gIC8vIFhYWCBIQUNLOiBJZiBhIHNvY2tqcyBjb25uZWN0aW9uLCBzYXZlIG9mZiB0aGUgVVJMLiBUaGlzIGlzXG4gIC8vIHRlbXBvcmFyeSBhbmQgd2lsbCBnbyBhd2F5IGluIHRoZSBuZWFyIGZ1dHVyZS5cbiAgc2VsZi5fc29ja2V0VXJsID0gc29ja2V0LnVybDtcblxuICAvLyBBbGxvdyB0ZXN0cyB0byBkaXNhYmxlIHJlc3BvbmRpbmcgdG8gcGluZ3MuXG4gIHNlbGYuX3Jlc3BvbmRUb1BpbmdzID0gb3B0aW9ucy5yZXNwb25kVG9QaW5ncztcblxuICAvLyBUaGlzIG9iamVjdCBpcyB0aGUgcHVibGljIGludGVyZmFjZSB0byB0aGUgc2Vzc2lvbi4gSW4gdGhlIHB1YmxpY1xuICAvLyBBUEksIGl0IGlzIGNhbGxlZCB0aGUgYGNvbm5lY3Rpb25gIG9iamVjdC4gIEludGVybmFsbHkgd2UgY2FsbCBpdFxuICAvLyBhIGBjb25uZWN0aW9uSGFuZGxlYCB0byBhdm9pZCBhbWJpZ3VpdHkuXG4gIHNlbGYuY29ubmVjdGlvbkhhbmRsZSA9IHtcbiAgICBpZDogc2VsZi5pZCxcbiAgICBjbG9zZTogZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5jbG9zZSgpO1xuICAgIH0sXG4gICAgb25DbG9zZTogZnVuY3Rpb24gKGZuKSB7XG4gICAgICB2YXIgY2IgPSBNZXRlb3IuYmluZEVudmlyb25tZW50KGZuLCBcImNvbm5lY3Rpb24gb25DbG9zZSBjYWxsYmFja1wiKTtcbiAgICAgIGlmIChzZWxmLmluUXVldWUpIHtcbiAgICAgICAgc2VsZi5fY2xvc2VDYWxsYmFja3MucHVzaChjYik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpZiB3ZSdyZSBhbHJlYWR5IGNsb3NlZCwgY2FsbCB0aGUgY2FsbGJhY2suXG4gICAgICAgIE1ldGVvci5kZWZlcihjYik7XG4gICAgICB9XG4gICAgfSxcbiAgICBjbGllbnRBZGRyZXNzOiBzZWxmLl9jbGllbnRBZGRyZXNzKCksXG4gICAgaHR0cEhlYWRlcnM6IHNlbGYuc29ja2V0LmhlYWRlcnNcbiAgfTtcblxuICBzZWxmLnNlbmQoeyBtc2c6ICdjb25uZWN0ZWQnLCBzZXNzaW9uOiBzZWxmLmlkIH0pO1xuXG4gIC8vIE9uIGluaXRpYWwgY29ubmVjdCwgc3BpbiB1cCBhbGwgdGhlIHVuaXZlcnNhbCBwdWJsaXNoZXJzLlxuICBGaWJlcihmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5zdGFydFVuaXZlcnNhbFN1YnMoKTtcbiAgfSkucnVuKCk7XG5cbiAgaWYgKHZlcnNpb24gIT09ICdwcmUxJyAmJiBvcHRpb25zLmhlYXJ0YmVhdEludGVydmFsICE9PSAwKSB7XG4gICAgLy8gV2Ugbm8gbG9uZ2VyIG5lZWQgdGhlIGxvdyBsZXZlbCB0aW1lb3V0IGJlY2F1c2Ugd2UgaGF2ZSBoZWFydGJlYXRpbmcuXG4gICAgc29ja2V0LnNldFdlYnNvY2tldFRpbWVvdXQoMCk7XG5cbiAgICBzZWxmLmhlYXJ0YmVhdCA9IG5ldyBERFBDb21tb24uSGVhcnRiZWF0KHtcbiAgICAgIGhlYXJ0YmVhdEludGVydmFsOiBvcHRpb25zLmhlYXJ0YmVhdEludGVydmFsLFxuICAgICAgaGVhcnRiZWF0VGltZW91dDogb3B0aW9ucy5oZWFydGJlYXRUaW1lb3V0LFxuICAgICAgb25UaW1lb3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuY2xvc2UoKTtcbiAgICAgIH0sXG4gICAgICBzZW5kUGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnNlbmQoe21zZzogJ3BpbmcnfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2VsZi5oZWFydGJlYXQuc3RhcnQoKTtcbiAgfVxuXG4gIFBhY2thZ2UuZmFjdHMgJiYgUGFja2FnZS5mYWN0cy5GYWN0cy5pbmNyZW1lbnRTZXJ2ZXJGYWN0KFxuICAgIFwibGl2ZWRhdGFcIiwgXCJzZXNzaW9uc1wiLCAxKTtcbn07XG5cbl8uZXh0ZW5kKFNlc3Npb24ucHJvdG90eXBlLCB7XG5cbiAgc2VuZFJlYWR5OiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSWRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9pc1NlbmRpbmcpXG4gICAgICBzZWxmLnNlbmQoe21zZzogXCJyZWFkeVwiLCBzdWJzOiBzdWJzY3JpcHRpb25JZHN9KTtcbiAgICBlbHNlIHtcbiAgICAgIF8uZWFjaChzdWJzY3JpcHRpb25JZHMsIGZ1bmN0aW9uIChzdWJzY3JpcHRpb25JZCkge1xuICAgICAgICBzZWxmLl9wZW5kaW5nUmVhZHkucHVzaChzdWJzY3JpcHRpb25JZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgc2VuZEFkZGVkOiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGlkLCBmaWVsZHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzU2VuZGluZylcbiAgICAgIHNlbGYuc2VuZCh7bXNnOiBcImFkZGVkXCIsIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLCBpZDogaWQsIGZpZWxkczogZmllbGRzfSk7XG4gIH0sXG5cbiAgc2VuZENoYW5nZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoXy5pc0VtcHR5KGZpZWxkcykpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoc2VsZi5faXNTZW5kaW5nKSB7XG4gICAgICBzZWxmLnNlbmQoe1xuICAgICAgICBtc2c6IFwiY2hhbmdlZFwiLFxuICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBmaWVsZHM6IGZpZWxkc1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHNlbmRSZW1vdmVkOiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9pc1NlbmRpbmcpXG4gICAgICBzZWxmLnNlbmQoe21zZzogXCJyZW1vdmVkXCIsIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLCBpZDogaWR9KTtcbiAgfSxcblxuICBnZXRTZW5kQ2FsbGJhY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBhZGRlZDogXy5iaW5kKHNlbGYuc2VuZEFkZGVkLCBzZWxmKSxcbiAgICAgIGNoYW5nZWQ6IF8uYmluZChzZWxmLnNlbmRDaGFuZ2VkLCBzZWxmKSxcbiAgICAgIHJlbW92ZWQ6IF8uYmluZChzZWxmLnNlbmRSZW1vdmVkLCBzZWxmKVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0Q29sbGVjdGlvblZpZXc6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoXy5oYXMoc2VsZi5jb2xsZWN0aW9uVmlld3MsIGNvbGxlY3Rpb25OYW1lKSkge1xuICAgICAgcmV0dXJuIHNlbGYuY29sbGVjdGlvblZpZXdzW2NvbGxlY3Rpb25OYW1lXTtcbiAgICB9XG4gICAgdmFyIHJldCA9IG5ldyBTZXNzaW9uQ29sbGVjdGlvblZpZXcoY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5nZXRTZW5kQ2FsbGJhY2tzKCkpO1xuICAgIHNlbGYuY29sbGVjdGlvblZpZXdzW2NvbGxlY3Rpb25OYW1lXSA9IHJldDtcbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG4gIGFkZGVkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdmlldyA9IHNlbGYuZ2V0Q29sbGVjdGlvblZpZXcoY29sbGVjdGlvbk5hbWUpO1xuICAgIHZpZXcuYWRkZWQoc3Vic2NyaXB0aW9uSGFuZGxlLCBpZCwgZmllbGRzKTtcbiAgfSxcblxuICByZW1vdmVkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBjb2xsZWN0aW9uTmFtZSwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHZpZXcgPSBzZWxmLmdldENvbGxlY3Rpb25WaWV3KGNvbGxlY3Rpb25OYW1lKTtcbiAgICB2aWV3LnJlbW92ZWQoc3Vic2NyaXB0aW9uSGFuZGxlLCBpZCk7XG4gICAgaWYgKHZpZXcuaXNFbXB0eSgpKSB7XG4gICAgICBkZWxldGUgc2VsZi5jb2xsZWN0aW9uVmlld3NbY29sbGVjdGlvbk5hbWVdO1xuICAgIH1cbiAgfSxcblxuICBjaGFuZ2VkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdmlldyA9IHNlbGYuZ2V0Q29sbGVjdGlvblZpZXcoY29sbGVjdGlvbk5hbWUpO1xuICAgIHZpZXcuY2hhbmdlZChzdWJzY3JpcHRpb25IYW5kbGUsIGlkLCBmaWVsZHMpO1xuICB9LFxuXG4gIHN0YXJ0VW5pdmVyc2FsU3ViczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBNYWtlIGEgc2hhbGxvdyBjb3B5IG9mIHRoZSBzZXQgb2YgdW5pdmVyc2FsIGhhbmRsZXJzIGFuZCBzdGFydCB0aGVtLiBJZlxuICAgIC8vIGFkZGl0aW9uYWwgdW5pdmVyc2FsIHB1Ymxpc2hlcnMgc3RhcnQgd2hpbGUgd2UncmUgcnVubmluZyB0aGVtIChkdWUgdG9cbiAgICAvLyB5aWVsZGluZyksIHRoZXkgd2lsbCBydW4gc2VwYXJhdGVseSBhcyBwYXJ0IG9mIFNlcnZlci5wdWJsaXNoLlxuICAgIHZhciBoYW5kbGVycyA9IF8uY2xvbmUoc2VsZi5zZXJ2ZXIudW5pdmVyc2FsX3B1Ymxpc2hfaGFuZGxlcnMpO1xuICAgIF8uZWFjaChoYW5kbGVycywgZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgIHNlbGYuX3N0YXJ0U3Vic2NyaXB0aW9uKGhhbmRsZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIERlc3Ryb3kgdGhpcyBzZXNzaW9uIGFuZCB1bnJlZ2lzdGVyIGl0IGF0IHRoZSBzZXJ2ZXIuXG4gIGNsb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gRGVzdHJveSB0aGlzIHNlc3Npb24sIGV2ZW4gaWYgaXQncyBub3QgcmVnaXN0ZXJlZCBhdCB0aGVcbiAgICAvLyBzZXJ2ZXIuIFN0b3AgYWxsIHByb2Nlc3NpbmcgYW5kIHRlYXIgZXZlcnl0aGluZyBkb3duLiBJZiBhIHNvY2tldFxuICAgIC8vIHdhcyBhdHRhY2hlZCwgY2xvc2UgaXQuXG5cbiAgICAvLyBBbHJlYWR5IGRlc3Ryb3llZC5cbiAgICBpZiAoISBzZWxmLmluUXVldWUpXG4gICAgICByZXR1cm47XG5cbiAgICAvLyBEcm9wIHRoZSBtZXJnZSBib3ggZGF0YSBpbW1lZGlhdGVseS5cbiAgICBzZWxmLmluUXVldWUgPSBudWxsO1xuICAgIHNlbGYuY29sbGVjdGlvblZpZXdzID0ge307XG5cbiAgICBpZiAoc2VsZi5oZWFydGJlYXQpIHtcbiAgICAgIHNlbGYuaGVhcnRiZWF0LnN0b3AoKTtcbiAgICAgIHNlbGYuaGVhcnRiZWF0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIHNlbGYuc29ja2V0LmNsb3NlKCk7XG4gICAgICBzZWxmLnNvY2tldC5fbWV0ZW9yU2Vzc2lvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgUGFja2FnZS5mYWN0cyAmJiBQYWNrYWdlLmZhY3RzLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICBcImxpdmVkYXRhXCIsIFwic2Vzc2lvbnNcIiwgLTEpO1xuXG4gICAgTWV0ZW9yLmRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHN0b3AgY2FsbGJhY2tzIGNhbiB5aWVsZCwgc28gd2UgZGVmZXIgdGhpcyBvbiBjbG9zZS5cbiAgICAgIC8vIHN1Yi5faXNEZWFjdGl2YXRlZCgpIGRldGVjdHMgdGhhdCB3ZSBzZXQgaW5RdWV1ZSB0byBudWxsIGFuZFxuICAgICAgLy8gdHJlYXRzIGl0IGFzIHNlbWktZGVhY3RpdmF0ZWQgKGl0IHdpbGwgaWdub3JlIGluY29taW5nIGNhbGxiYWNrcywgZXRjKS5cbiAgICAgIHNlbGYuX2RlYWN0aXZhdGVBbGxTdWJzY3JpcHRpb25zKCk7XG5cbiAgICAgIC8vIERlZmVyIGNhbGxpbmcgdGhlIGNsb3NlIGNhbGxiYWNrcywgc28gdGhhdCB0aGUgY2FsbGVyIGNsb3NpbmdcbiAgICAgIC8vIHRoZSBzZXNzaW9uIGlzbid0IHdhaXRpbmcgZm9yIGFsbCB0aGUgY2FsbGJhY2tzIHRvIGNvbXBsZXRlLlxuICAgICAgXy5lYWNoKHNlbGYuX2Nsb3NlQ2FsbGJhY2tzLCBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gVW5yZWdpc3RlciB0aGUgc2Vzc2lvbi5cbiAgICBzZWxmLnNlcnZlci5fcmVtb3ZlU2Vzc2lvbihzZWxmKTtcbiAgfSxcblxuICAvLyBTZW5kIGEgbWVzc2FnZSAoZG9pbmcgbm90aGluZyBpZiBubyBzb2NrZXQgaXMgY29ubmVjdGVkIHJpZ2h0IG5vdy4pXG4gIC8vIEl0IHNob3VsZCBiZSBhIEpTT04gb2JqZWN0IChpdCB3aWxsIGJlIHN0cmluZ2lmaWVkLilcbiAgc2VuZDogZnVuY3Rpb24gKG1zZykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIGlmIChNZXRlb3IuX3ByaW50U2VudEREUClcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIlNlbnQgRERQXCIsIEREUENvbW1vbi5zdHJpbmdpZnlERFAobXNnKSk7XG4gICAgICBzZWxmLnNvY2tldC5zZW5kKEREUENvbW1vbi5zdHJpbmdpZnlERFAobXNnKSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIFNlbmQgYSBjb25uZWN0aW9uIGVycm9yLlxuICBzZW5kRXJyb3I6IGZ1bmN0aW9uIChyZWFzb24sIG9mZmVuZGluZ01lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG1zZyA9IHttc2c6ICdlcnJvcicsIHJlYXNvbjogcmVhc29ufTtcbiAgICBpZiAob2ZmZW5kaW5nTWVzc2FnZSlcbiAgICAgIG1zZy5vZmZlbmRpbmdNZXNzYWdlID0gb2ZmZW5kaW5nTWVzc2FnZTtcbiAgICBzZWxmLnNlbmQobXNnKTtcbiAgfSxcblxuICAvLyBQcm9jZXNzICdtc2cnIGFzIGFuIGluY29taW5nIG1lc3NhZ2UuIChCdXQgYXMgYSBndWFyZCBhZ2FpbnN0XG4gIC8vIHJhY2UgY29uZGl0aW9ucyBkdXJpbmcgcmVjb25uZWN0aW9uLCBpZ25vcmUgdGhlIG1lc3NhZ2UgaWZcbiAgLy8gJ3NvY2tldCcgaXMgbm90IHRoZSBjdXJyZW50bHkgY29ubmVjdGVkIHNvY2tldC4pXG4gIC8vXG4gIC8vIFdlIHJ1biB0aGUgbWVzc2FnZXMgZnJvbSB0aGUgY2xpZW50IG9uZSBhdCBhIHRpbWUsIGluIHRoZSBvcmRlclxuICAvLyBnaXZlbiBieSB0aGUgY2xpZW50LiBUaGUgbWVzc2FnZSBoYW5kbGVyIGlzIHBhc3NlZCBhbiBpZGVtcG90ZW50XG4gIC8vIGZ1bmN0aW9uICd1bmJsb2NrJyB3aGljaCBpdCBtYXkgY2FsbCB0byBhbGxvdyBvdGhlciBtZXNzYWdlcyB0b1xuICAvLyBiZWdpbiBydW5uaW5nIGluIHBhcmFsbGVsIGluIGFub3RoZXIgZmliZXIgKGZvciBleGFtcGxlLCBhIG1ldGhvZFxuICAvLyB0aGF0IHdhbnRzIHRvIHlpZWxkLikgT3RoZXJ3aXNlLCBpdCBpcyBhdXRvbWF0aWNhbGx5IHVuYmxvY2tlZFxuICAvLyB3aGVuIGl0IHJldHVybnMuXG4gIC8vXG4gIC8vIEFjdHVhbGx5LCB3ZSBkb24ndCBoYXZlIHRvICd0b3RhbGx5IG9yZGVyJyB0aGUgbWVzc2FnZXMgaW4gdGhpc1xuICAvLyB3YXksIGJ1dCBpdCdzIHRoZSBlYXNpZXN0IHRoaW5nIHRoYXQncyBjb3JyZWN0LiAodW5zdWIgbmVlZHMgdG9cbiAgLy8gYmUgb3JkZXJlZCBhZ2FpbnN0IHN1YiwgbWV0aG9kcyBuZWVkIHRvIGJlIG9yZGVyZWQgYWdhaW5zdCBlYWNoXG4gIC8vIG90aGVyLilcbiAgcHJvY2Vzc01lc3NhZ2U6IGZ1bmN0aW9uIChtc2dfaW4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCFzZWxmLmluUXVldWUpIC8vIHdlIGhhdmUgYmVlbiBkZXN0cm95ZWQuXG4gICAgICByZXR1cm47XG5cbiAgICAvLyBSZXNwb25kIHRvIHBpbmcgYW5kIHBvbmcgbWVzc2FnZXMgaW1tZWRpYXRlbHkgd2l0aG91dCBxdWV1aW5nLlxuICAgIC8vIElmIHRoZSBuZWdvdGlhdGVkIEREUCB2ZXJzaW9uIGlzIFwicHJlMVwiIHdoaWNoIGRpZG4ndCBzdXBwb3J0XG4gICAgLy8gcGluZ3MsIHByZXNlcnZlIHRoZSBcInByZTFcIiBiZWhhdmlvciBvZiByZXNwb25kaW5nIHdpdGggYSBcImJhZFxuICAgIC8vIHJlcXVlc3RcIiBmb3IgdGhlIHVua25vd24gbWVzc2FnZXMuXG4gICAgLy9cbiAgICAvLyBGaWJlcnMgYXJlIG5lZWRlZCBiZWNhdXNlIGhlYXJ0YmVhdCB1c2VzIE1ldGVvci5zZXRUaW1lb3V0LCB3aGljaFxuICAgIC8vIG5lZWRzIGEgRmliZXIuIFdlIGNvdWxkIGFjdHVhbGx5IHVzZSByZWd1bGFyIHNldFRpbWVvdXQgYW5kIGF2b2lkXG4gICAgLy8gdGhlc2UgbmV3IGZpYmVycywgYnV0IGl0IGlzIGVhc2llciB0byBqdXN0IG1ha2UgZXZlcnl0aGluZyB1c2VcbiAgICAvLyBNZXRlb3Iuc2V0VGltZW91dCBhbmQgbm90IHRoaW5rIHRvbyBoYXJkLlxuICAgIC8vXG4gICAgLy8gQW55IG1lc3NhZ2UgY291bnRzIGFzIHJlY2VpdmluZyBhIHBvbmcsIGFzIGl0IGRlbW9uc3RyYXRlcyB0aGF0XG4gICAgLy8gdGhlIGNsaWVudCBpcyBzdGlsbCBhbGl2ZS5cbiAgICBpZiAoc2VsZi5oZWFydGJlYXQpIHtcbiAgICAgIEZpYmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5oZWFydGJlYXQubWVzc2FnZVJlY2VpdmVkKCk7XG4gICAgICB9KS5ydW4oKTtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi52ZXJzaW9uICE9PSAncHJlMScgJiYgbXNnX2luLm1zZyA9PT0gJ3BpbmcnKSB7XG4gICAgICBpZiAoc2VsZi5fcmVzcG9uZFRvUGluZ3MpXG4gICAgICAgIHNlbGYuc2VuZCh7bXNnOiBcInBvbmdcIiwgaWQ6IG1zZ19pbi5pZH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoc2VsZi52ZXJzaW9uICE9PSAncHJlMScgJiYgbXNnX2luLm1zZyA9PT0gJ3BvbmcnKSB7XG4gICAgICAvLyBTaW5jZSBldmVyeXRoaW5nIGlzIGEgcG9uZywgbm90aGluZyB0byBkb1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuaW5RdWV1ZS5wdXNoKG1zZ19pbik7XG4gICAgaWYgKHNlbGYud29ya2VyUnVubmluZylcbiAgICAgIHJldHVybjtcbiAgICBzZWxmLndvcmtlclJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIHByb2Nlc3NOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG1zZyA9IHNlbGYuaW5RdWV1ZSAmJiBzZWxmLmluUXVldWUuc2hpZnQoKTtcbiAgICAgIGlmICghbXNnKSB7XG4gICAgICAgIHNlbGYud29ya2VyUnVubmluZyA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIEZpYmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGJsb2NrZWQgPSB0cnVlO1xuXG4gICAgICAgIHZhciB1bmJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICghYmxvY2tlZClcbiAgICAgICAgICAgIHJldHVybjsgLy8gaWRlbXBvdGVudFxuICAgICAgICAgIGJsb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICBwcm9jZXNzTmV4dCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuc2VydmVyLm9uTWVzc2FnZUhvb2suZWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjayhtc2csIHNlbGYpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoXy5oYXMoc2VsZi5wcm90b2NvbF9oYW5kbGVycywgbXNnLm1zZykpXG4gICAgICAgICAgc2VsZi5wcm90b2NvbF9oYW5kbGVyc1ttc2cubXNnXS5jYWxsKHNlbGYsIG1zZywgdW5ibG9jayk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzZWxmLnNlbmRFcnJvcignQmFkIHJlcXVlc3QnLCBtc2cpO1xuICAgICAgICB1bmJsb2NrKCk7IC8vIGluIGNhc2UgdGhlIGhhbmRsZXIgZGlkbid0IGFscmVhZHkgZG8gaXRcbiAgICAgIH0pLnJ1bigpO1xuICAgIH07XG5cbiAgICBwcm9jZXNzTmV4dCgpO1xuICB9LFxuXG4gIHByb3RvY29sX2hhbmRsZXJzOiB7XG4gICAgc3ViOiBmdW5jdGlvbiAobXNnKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIHJlamVjdCBtYWxmb3JtZWQgbWVzc2FnZXNcbiAgICAgIGlmICh0eXBlb2YgKG1zZy5pZCkgIT09IFwic3RyaW5nXCIgfHxcbiAgICAgICAgICB0eXBlb2YgKG1zZy5uYW1lKSAhPT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICAgICgoJ3BhcmFtcycgaW4gbXNnKSAmJiAhKG1zZy5wYXJhbXMgaW5zdGFuY2VvZiBBcnJheSkpKSB7XG4gICAgICAgIHNlbGYuc2VuZEVycm9yKFwiTWFsZm9ybWVkIHN1YnNjcmlwdGlvblwiLCBtc2cpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghc2VsZi5zZXJ2ZXIucHVibGlzaF9oYW5kbGVyc1ttc2cubmFtZV0pIHtcbiAgICAgICAgc2VsZi5zZW5kKHtcbiAgICAgICAgICBtc2c6ICdub3N1YicsIGlkOiBtc2cuaWQsXG4gICAgICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDA0LCBgU3Vic2NyaXB0aW9uICcke21zZy5uYW1lfScgbm90IGZvdW5kYCl9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5oYXMoc2VsZi5fbmFtZWRTdWJzLCBtc2cuaWQpKVxuICAgICAgICAvLyBzdWJzIGFyZSBpZGVtcG90ZW50LCBvciByYXRoZXIsIHRoZXkgYXJlIGlnbm9yZWQgaWYgYSBzdWJcbiAgICAgICAgLy8gd2l0aCB0aGF0IGlkIGFscmVhZHkgZXhpc3RzLiB0aGlzIGlzIGltcG9ydGFudCBkdXJpbmdcbiAgICAgICAgLy8gcmVjb25uZWN0LlxuICAgICAgICByZXR1cm47XG5cbiAgICAgIC8vIFhYWCBJdCdkIGJlIG11Y2ggYmV0dGVyIGlmIHdlIGhhZCBnZW5lcmljIGhvb2tzIHdoZXJlIGFueSBwYWNrYWdlIGNhblxuICAgICAgLy8gaG9vayBpbnRvIHN1YnNjcmlwdGlvbiBoYW5kbGluZywgYnV0IGluIHRoZSBtZWFuIHdoaWxlIHdlIHNwZWNpYWwgY2FzZVxuICAgICAgLy8gZGRwLXJhdGUtbGltaXRlciBwYWNrYWdlLiBUaGlzIGlzIGFsc28gZG9uZSBmb3Igd2VhayByZXF1aXJlbWVudHMgdG9cbiAgICAgIC8vIGFkZCB0aGUgZGRwLXJhdGUtbGltaXRlciBwYWNrYWdlIGluIGNhc2Ugd2UgZG9uJ3QgaGF2ZSBBY2NvdW50cy4gQVxuICAgICAgLy8gdXNlciB0cnlpbmcgdG8gdXNlIHRoZSBkZHAtcmF0ZS1saW1pdGVyIG11c3QgZXhwbGljaXRseSByZXF1aXJlIGl0LlxuICAgICAgaWYgKFBhY2thZ2VbJ2RkcC1yYXRlLWxpbWl0ZXInXSkge1xuICAgICAgICB2YXIgRERQUmF0ZUxpbWl0ZXIgPSBQYWNrYWdlWydkZHAtcmF0ZS1saW1pdGVyJ10uRERQUmF0ZUxpbWl0ZXI7XG4gICAgICAgIHZhciByYXRlTGltaXRlcklucHV0ID0ge1xuICAgICAgICAgIHVzZXJJZDogc2VsZi51c2VySWQsXG4gICAgICAgICAgY2xpZW50QWRkcmVzczogc2VsZi5jb25uZWN0aW9uSGFuZGxlLmNsaWVudEFkZHJlc3MsXG4gICAgICAgICAgdHlwZTogXCJzdWJzY3JpcHRpb25cIixcbiAgICAgICAgICBuYW1lOiBtc2cubmFtZSxcbiAgICAgICAgICBjb25uZWN0aW9uSWQ6IHNlbGYuaWRcbiAgICAgICAgfTtcblxuICAgICAgICBERFBSYXRlTGltaXRlci5faW5jcmVtZW50KHJhdGVMaW1pdGVySW5wdXQpO1xuICAgICAgICB2YXIgcmF0ZUxpbWl0UmVzdWx0ID0gRERQUmF0ZUxpbWl0ZXIuX2NoZWNrKHJhdGVMaW1pdGVySW5wdXQpO1xuICAgICAgICBpZiAoIXJhdGVMaW1pdFJlc3VsdC5hbGxvd2VkKSB7XG4gICAgICAgICAgc2VsZi5zZW5kKHtcbiAgICAgICAgICAgIG1zZzogJ25vc3ViJywgaWQ6IG1zZy5pZCxcbiAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgICAgICAgICAndG9vLW1hbnktcmVxdWVzdHMnLFxuICAgICAgICAgICAgICBERFBSYXRlTGltaXRlci5nZXRFcnJvck1lc3NhZ2UocmF0ZUxpbWl0UmVzdWx0KSxcbiAgICAgICAgICAgICAge3RpbWVUb1Jlc2V0OiByYXRlTGltaXRSZXN1bHQudGltZVRvUmVzZXR9KVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgaGFuZGxlciA9IHNlbGYuc2VydmVyLnB1Ymxpc2hfaGFuZGxlcnNbbXNnLm5hbWVdO1xuXG4gICAgICBzZWxmLl9zdGFydFN1YnNjcmlwdGlvbihoYW5kbGVyLCBtc2cuaWQsIG1zZy5wYXJhbXMsIG1zZy5uYW1lKTtcblxuICAgIH0sXG5cbiAgICB1bnN1YjogZnVuY3Rpb24gKG1zZykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBzZWxmLl9zdG9wU3Vic2NyaXB0aW9uKG1zZy5pZCk7XG4gICAgfSxcblxuICAgIG1ldGhvZDogZnVuY3Rpb24gKG1zZywgdW5ibG9jaykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyByZWplY3QgbWFsZm9ybWVkIG1lc3NhZ2VzXG4gICAgICAvLyBGb3Igbm93LCB3ZSBzaWxlbnRseSBpZ25vcmUgdW5rbm93biBhdHRyaWJ1dGVzLFxuICAgICAgLy8gZm9yIGZvcndhcmRzIGNvbXBhdGliaWxpdHkuXG4gICAgICBpZiAodHlwZW9mIChtc2cuaWQpICE9PSBcInN0cmluZ1wiIHx8XG4gICAgICAgICAgdHlwZW9mIChtc2cubWV0aG9kKSAhPT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICAgICgoJ3BhcmFtcycgaW4gbXNnKSAmJiAhKG1zZy5wYXJhbXMgaW5zdGFuY2VvZiBBcnJheSkpIHx8XG4gICAgICAgICAgKCgncmFuZG9tU2VlZCcgaW4gbXNnKSAmJiAodHlwZW9mIG1zZy5yYW5kb21TZWVkICE9PSBcInN0cmluZ1wiKSkpIHtcbiAgICAgICAgc2VsZi5zZW5kRXJyb3IoXCJNYWxmb3JtZWQgbWV0aG9kIGludm9jYXRpb25cIiwgbXNnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmFuZG9tU2VlZCA9IG1zZy5yYW5kb21TZWVkIHx8IG51bGw7XG5cbiAgICAgIC8vIHNldCB1cCB0byBtYXJrIHRoZSBtZXRob2QgYXMgc2F0aXNmaWVkIG9uY2UgYWxsIG9ic2VydmVyc1xuICAgICAgLy8gKGFuZCBzdWJzY3JpcHRpb25zKSBoYXZlIHJlYWN0ZWQgdG8gYW55IHdyaXRlcyB0aGF0IHdlcmVcbiAgICAgIC8vIGRvbmUuXG4gICAgICB2YXIgZmVuY2UgPSBuZXcgRERQU2VydmVyLl9Xcml0ZUZlbmNlO1xuICAgICAgZmVuY2Uub25BbGxDb21taXR0ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBSZXRpcmUgdGhlIGZlbmNlIHNvIHRoYXQgZnV0dXJlIHdyaXRlcyBhcmUgYWxsb3dlZC5cbiAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IGNhbGxiYWNrcyBsaWtlIHRpbWVycyBhcmUgZnJlZSB0byB1c2VcbiAgICAgICAgLy8gdGhlIGZlbmNlLCBhbmQgaWYgdGhleSBmaXJlIGJlZm9yZSBpdCdzIGFybWVkIChmb3JcbiAgICAgICAgLy8gZXhhbXBsZSwgYmVjYXVzZSB0aGUgbWV0aG9kIHdhaXRzIGZvciB0aGVtKSB0aGVpclxuICAgICAgICAvLyB3cml0ZXMgd2lsbCBiZSBpbmNsdWRlZCBpbiB0aGUgZmVuY2UuXG4gICAgICAgIGZlbmNlLnJldGlyZSgpO1xuICAgICAgICBzZWxmLnNlbmQoe1xuICAgICAgICAgIG1zZzogJ3VwZGF0ZWQnLCBtZXRob2RzOiBbbXNnLmlkXX0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGZpbmQgdGhlIGhhbmRsZXJcbiAgICAgIHZhciBoYW5kbGVyID0gc2VsZi5zZXJ2ZXIubWV0aG9kX2hhbmRsZXJzW21zZy5tZXRob2RdO1xuICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgIHNlbGYuc2VuZCh7XG4gICAgICAgICAgbXNnOiAncmVzdWx0JywgaWQ6IG1zZy5pZCxcbiAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDQsIGBNZXRob2QgJyR7bXNnLm1ldGhvZH0nIG5vdCBmb3VuZGApfSk7XG4gICAgICAgIGZlbmNlLmFybSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBzZXRVc2VySWQgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgICAgc2VsZi5fc2V0VXNlcklkKHVzZXJJZCk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgaW52b2NhdGlvbiA9IG5ldyBERFBDb21tb24uTWV0aG9kSW52b2NhdGlvbih7XG4gICAgICAgIGlzU2ltdWxhdGlvbjogZmFsc2UsXG4gICAgICAgIHVzZXJJZDogc2VsZi51c2VySWQsXG4gICAgICAgIHNldFVzZXJJZDogc2V0VXNlcklkLFxuICAgICAgICB1bmJsb2NrOiB1bmJsb2NrLFxuICAgICAgICBjb25uZWN0aW9uOiBzZWxmLmNvbm5lY3Rpb25IYW5kbGUsXG4gICAgICAgIHJhbmRvbVNlZWQ6IHJhbmRvbVNlZWRcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyBYWFggSXQnZCBiZSBiZXR0ZXIgaWYgd2UgY291bGQgaG9vayBpbnRvIG1ldGhvZCBoYW5kbGVycyBiZXR0ZXIgYnV0XG4gICAgICAgIC8vIGZvciBub3csIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIGRkcC1yYXRlLWxpbWl0ZXIgZXhpc3RzIHNpbmNlIHdlXG4gICAgICAgIC8vIGhhdmUgYSB3ZWFrIHJlcXVpcmVtZW50IGZvciB0aGUgZGRwLXJhdGUtbGltaXRlciBwYWNrYWdlIHRvIGJlIGFkZGVkXG4gICAgICAgIC8vIHRvIG91ciBhcHBsaWNhdGlvbi5cbiAgICAgICAgaWYgKFBhY2thZ2VbJ2RkcC1yYXRlLWxpbWl0ZXInXSkge1xuICAgICAgICAgIHZhciBERFBSYXRlTGltaXRlciA9IFBhY2thZ2VbJ2RkcC1yYXRlLWxpbWl0ZXInXS5ERFBSYXRlTGltaXRlcjtcbiAgICAgICAgICB2YXIgcmF0ZUxpbWl0ZXJJbnB1dCA9IHtcbiAgICAgICAgICAgIHVzZXJJZDogc2VsZi51c2VySWQsXG4gICAgICAgICAgICBjbGllbnRBZGRyZXNzOiBzZWxmLmNvbm5lY3Rpb25IYW5kbGUuY2xpZW50QWRkcmVzcyxcbiAgICAgICAgICAgIHR5cGU6IFwibWV0aG9kXCIsXG4gICAgICAgICAgICBuYW1lOiBtc2cubWV0aG9kLFxuICAgICAgICAgICAgY29ubmVjdGlvbklkOiBzZWxmLmlkXG4gICAgICAgICAgfTtcbiAgICAgICAgICBERFBSYXRlTGltaXRlci5faW5jcmVtZW50KHJhdGVMaW1pdGVySW5wdXQpO1xuICAgICAgICAgIHZhciByYXRlTGltaXRSZXN1bHQgPSBERFBSYXRlTGltaXRlci5fY2hlY2socmF0ZUxpbWl0ZXJJbnB1dClcbiAgICAgICAgICBpZiAoIXJhdGVMaW1pdFJlc3VsdC5hbGxvd2VkKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1ldGVvci5FcnJvcihcbiAgICAgICAgICAgICAgXCJ0b28tbWFueS1yZXF1ZXN0c1wiLFxuICAgICAgICAgICAgICBERFBSYXRlTGltaXRlci5nZXRFcnJvck1lc3NhZ2UocmF0ZUxpbWl0UmVzdWx0KSxcbiAgICAgICAgICAgICAge3RpbWVUb1Jlc2V0OiByYXRlTGltaXRSZXN1bHQudGltZVRvUmVzZXR9XG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlKEREUFNlcnZlci5fQ3VycmVudFdyaXRlRmVuY2Uud2l0aFZhbHVlKFxuICAgICAgICAgIGZlbmNlLFxuICAgICAgICAgICgpID0+IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24ud2l0aFZhbHVlKFxuICAgICAgICAgICAgaW52b2NhdGlvbixcbiAgICAgICAgICAgICgpID0+IG1heWJlQXVkaXRBcmd1bWVudENoZWNrcyhcbiAgICAgICAgICAgICAgaGFuZGxlciwgaW52b2NhdGlvbiwgbXNnLnBhcmFtcyxcbiAgICAgICAgICAgICAgXCJjYWxsIHRvICdcIiArIG1zZy5tZXRob2QgKyBcIidcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKSk7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgICAgICBmZW5jZS5hcm0oKTtcbiAgICAgICAgdW5ibG9jaygpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICBtc2c6IFwicmVzdWx0XCIsXG4gICAgICAgIGlkOiBtc2cuaWRcbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIGZpbmlzaCgpO1xuICAgICAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwYXlsb2FkLnJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLnNlbmQocGF5bG9hZCk7XG4gICAgICB9LCAoZXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGZpbmlzaCgpO1xuICAgICAgICBwYXlsb2FkLmVycm9yID0gd3JhcEludGVybmFsRXhjZXB0aW9uKFxuICAgICAgICAgIGV4Y2VwdGlvbixcbiAgICAgICAgICBgd2hpbGUgaW52b2tpbmcgbWV0aG9kICcke21zZy5tZXRob2R9J2BcbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi5zZW5kKHBheWxvYWQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIF9lYWNoU3ViOiBmdW5jdGlvbiAoZikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBfLmVhY2goc2VsZi5fbmFtZWRTdWJzLCBmKTtcbiAgICBfLmVhY2goc2VsZi5fdW5pdmVyc2FsU3VicywgZik7XG4gIH0sXG5cbiAgX2RpZmZDb2xsZWN0aW9uVmlld3M6IGZ1bmN0aW9uIChiZWZvcmVDVnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgRGlmZlNlcXVlbmNlLmRpZmZPYmplY3RzKGJlZm9yZUNWcywgc2VsZi5jb2xsZWN0aW9uVmlld3MsIHtcbiAgICAgIGJvdGg6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgbGVmdFZhbHVlLCByaWdodFZhbHVlKSB7XG4gICAgICAgIHJpZ2h0VmFsdWUuZGlmZihsZWZ0VmFsdWUpO1xuICAgICAgfSxcbiAgICAgIHJpZ2h0T25seTogZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCByaWdodFZhbHVlKSB7XG4gICAgICAgIF8uZWFjaChyaWdodFZhbHVlLmRvY3VtZW50cywgZnVuY3Rpb24gKGRvY1ZpZXcsIGlkKSB7XG4gICAgICAgICAgc2VsZi5zZW5kQWRkZWQoY29sbGVjdGlvbk5hbWUsIGlkLCBkb2NWaWV3LmdldEZpZWxkcygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgbGVmdE9ubHk6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgbGVmdFZhbHVlKSB7XG4gICAgICAgIF8uZWFjaChsZWZ0VmFsdWUuZG9jdW1lbnRzLCBmdW5jdGlvbiAoZG9jLCBpZCkge1xuICAgICAgICAgIHNlbGYuc2VuZFJlbW92ZWQoY29sbGVjdGlvbk5hbWUsIGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gU2V0cyB0aGUgY3VycmVudCB1c2VyIGlkIGluIGFsbCBhcHByb3ByaWF0ZSBjb250ZXh0cyBhbmQgcmVydW5zXG4gIC8vIGFsbCBzdWJzY3JpcHRpb25zXG4gIF9zZXRVc2VySWQ6IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh1c2VySWQgIT09IG51bGwgJiYgdHlwZW9mIHVzZXJJZCAhPT0gXCJzdHJpbmdcIilcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNldFVzZXJJZCBtdXN0IGJlIGNhbGxlZCBvbiBzdHJpbmcgb3IgbnVsbCwgbm90IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdXNlcklkKTtcblxuICAgIC8vIFByZXZlbnQgbmV3bHktY3JlYXRlZCB1bml2ZXJzYWwgc3Vic2NyaXB0aW9ucyBmcm9tIGJlaW5nIGFkZGVkIHRvIG91clxuICAgIC8vIHNlc3Npb247IHRoZXkgd2lsbCBiZSBmb3VuZCBiZWxvdyB3aGVuIHdlIGNhbGwgc3RhcnRVbml2ZXJzYWxTdWJzLlxuICAgIC8vXG4gICAgLy8gKFdlIGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXQgbmFtZWQgc3Vic2NyaXB0aW9ucywgYmVjYXVzZSB3ZSBvbmx5IGFkZFxuICAgIC8vIHRoZW0gd2hlbiB3ZSBwcm9jZXNzIGEgJ3N1YicgbWVzc2FnZS4gV2UgYXJlIGN1cnJlbnRseSBwcm9jZXNzaW5nIGFcbiAgICAvLyAnbWV0aG9kJyBtZXNzYWdlLCBhbmQgdGhlIG1ldGhvZCBkaWQgbm90IHVuYmxvY2ssIGJlY2F1c2UgaXQgaXMgaWxsZWdhbFxuICAgIC8vIHRvIGNhbGwgc2V0VXNlcklkIGFmdGVyIHVuYmxvY2suIFRodXMgd2UgY2Fubm90IGJlIGNvbmN1cnJlbnRseSBhZGRpbmcgYVxuICAgIC8vIG5ldyBuYW1lZCBzdWJzY3JpcHRpb24uKVxuICAgIHNlbGYuX2RvbnRTdGFydE5ld1VuaXZlcnNhbFN1YnMgPSB0cnVlO1xuXG4gICAgLy8gUHJldmVudCBjdXJyZW50IHN1YnMgZnJvbSB1cGRhdGluZyBvdXIgY29sbGVjdGlvblZpZXdzIGFuZCBjYWxsIHRoZWlyXG4gICAgLy8gc3RvcCBjYWxsYmFja3MuIFRoaXMgbWF5IHlpZWxkLlxuICAgIHNlbGYuX2VhY2hTdWIoZnVuY3Rpb24gKHN1Yikge1xuICAgICAgc3ViLl9kZWFjdGl2YXRlKCk7XG4gICAgfSk7XG5cbiAgICAvLyBBbGwgc3VicyBzaG91bGQgbm93IGJlIGRlYWN0aXZhdGVkLiBTdG9wIHNlbmRpbmcgbWVzc2FnZXMgdG8gdGhlIGNsaWVudCxcbiAgICAvLyBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgcHVibGlzaGVkIGNvbGxlY3Rpb25zLCByZXNldCB0byBhbiBlbXB0eSB2aWV3LCBhbmRcbiAgICAvLyB1cGRhdGUgdGhlIHVzZXJJZC5cbiAgICBzZWxmLl9pc1NlbmRpbmcgPSBmYWxzZTtcbiAgICB2YXIgYmVmb3JlQ1ZzID0gc2VsZi5jb2xsZWN0aW9uVmlld3M7XG4gICAgc2VsZi5jb2xsZWN0aW9uVmlld3MgPSB7fTtcbiAgICBzZWxmLnVzZXJJZCA9IHVzZXJJZDtcblxuICAgIC8vIF9zZXRVc2VySWQgaXMgbm9ybWFsbHkgY2FsbGVkIGZyb20gYSBNZXRlb3IgbWV0aG9kIHdpdGhcbiAgICAvLyBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uIHNldC4gQnV0IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24gaXMgbm90XG4gICAgLy8gZXhwZWN0ZWQgdG8gYmUgc2V0IGluc2lkZSBhIHB1Ymxpc2ggZnVuY3Rpb24sIHNvIHdlIHRlbXBvcmFyeSB1bnNldCBpdC5cbiAgICAvLyBJbnNpZGUgYSBwdWJsaXNoIGZ1bmN0aW9uIEREUC5fQ3VycmVudFB1YmxpY2F0aW9uSW52b2NhdGlvbiBpcyBzZXQuXG4gICAgRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbi53aXRoVmFsdWUodW5kZWZpbmVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBTYXZlIHRoZSBvbGQgbmFtZWQgc3VicywgYW5kIHJlc2V0IHRvIGhhdmluZyBubyBzdWJzY3JpcHRpb25zLlxuICAgICAgdmFyIG9sZE5hbWVkU3VicyA9IHNlbGYuX25hbWVkU3VicztcbiAgICAgIHNlbGYuX25hbWVkU3VicyA9IHt9O1xuICAgICAgc2VsZi5fdW5pdmVyc2FsU3VicyA9IFtdO1xuXG4gICAgICBfLmVhY2gob2xkTmFtZWRTdWJzLCBmdW5jdGlvbiAoc3ViLCBzdWJzY3JpcHRpb25JZCkge1xuICAgICAgICBzZWxmLl9uYW1lZFN1YnNbc3Vic2NyaXB0aW9uSWRdID0gc3ViLl9yZWNyZWF0ZSgpO1xuICAgICAgICAvLyBuYjogaWYgdGhlIGhhbmRsZXIgdGhyb3dzIG9yIGNhbGxzIHRoaXMuZXJyb3IoKSwgaXQgd2lsbCBpbiBmYWN0XG4gICAgICAgIC8vIGltbWVkaWF0ZWx5IHNlbmQgaXRzICdub3N1YicuIFRoaXMgaXMgT0ssIHRob3VnaC5cbiAgICAgICAgc2VsZi5fbmFtZWRTdWJzW3N1YnNjcmlwdGlvbklkXS5fcnVuSGFuZGxlcigpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEFsbG93IG5ld2x5LWNyZWF0ZWQgdW5pdmVyc2FsIHN1YnMgdG8gYmUgc3RhcnRlZCBvbiBvdXIgY29ubmVjdGlvbiBpblxuICAgICAgLy8gcGFyYWxsZWwgd2l0aCB0aGUgb25lcyB3ZSdyZSBzcGlubmluZyB1cCBoZXJlLCBhbmQgc3BpbiB1cCB1bml2ZXJzYWxcbiAgICAgIC8vIHN1YnMuXG4gICAgICBzZWxmLl9kb250U3RhcnROZXdVbml2ZXJzYWxTdWJzID0gZmFsc2U7XG4gICAgICBzZWxmLnN0YXJ0VW5pdmVyc2FsU3VicygpO1xuICAgIH0pO1xuXG4gICAgLy8gU3RhcnQgc2VuZGluZyBtZXNzYWdlcyBhZ2FpbiwgYmVnaW5uaW5nIHdpdGggdGhlIGRpZmYgZnJvbSB0aGUgcHJldmlvdXNcbiAgICAvLyBzdGF0ZSBvZiB0aGUgd29ybGQgdG8gdGhlIGN1cnJlbnQgc3RhdGUuIE5vIHlpZWxkcyBhcmUgYWxsb3dlZCBkdXJpbmdcbiAgICAvLyB0aGlzIGRpZmYsIHNvIHRoYXQgb3RoZXIgY2hhbmdlcyBjYW5ub3QgaW50ZXJsZWF2ZS5cbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLl9pc1NlbmRpbmcgPSB0cnVlO1xuICAgICAgc2VsZi5fZGlmZkNvbGxlY3Rpb25WaWV3cyhiZWZvcmVDVnMpO1xuICAgICAgaWYgKCFfLmlzRW1wdHkoc2VsZi5fcGVuZGluZ1JlYWR5KSkge1xuICAgICAgICBzZWxmLnNlbmRSZWFkeShzZWxmLl9wZW5kaW5nUmVhZHkpO1xuICAgICAgICBzZWxmLl9wZW5kaW5nUmVhZHkgPSBbXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBfc3RhcnRTdWJzY3JpcHRpb246IGZ1bmN0aW9uIChoYW5kbGVyLCBzdWJJZCwgcGFyYW1zLCBuYW1lKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHN1YiA9IG5ldyBTdWJzY3JpcHRpb24oXG4gICAgICBzZWxmLCBoYW5kbGVyLCBzdWJJZCwgcGFyYW1zLCBuYW1lKTtcbiAgICBpZiAoc3ViSWQpXG4gICAgICBzZWxmLl9uYW1lZFN1YnNbc3ViSWRdID0gc3ViO1xuICAgIGVsc2VcbiAgICAgIHNlbGYuX3VuaXZlcnNhbFN1YnMucHVzaChzdWIpO1xuXG4gICAgc3ViLl9ydW5IYW5kbGVyKCk7XG4gIH0sXG5cbiAgLy8gdGVhciBkb3duIHNwZWNpZmllZCBzdWJzY3JpcHRpb25cbiAgX3N0b3BTdWJzY3JpcHRpb246IGZ1bmN0aW9uIChzdWJJZCwgZXJyb3IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgc3ViTmFtZSA9IG51bGw7XG5cbiAgICBpZiAoc3ViSWQgJiYgc2VsZi5fbmFtZWRTdWJzW3N1YklkXSkge1xuICAgICAgc3ViTmFtZSA9IHNlbGYuX25hbWVkU3Vic1tzdWJJZF0uX25hbWU7XG4gICAgICBzZWxmLl9uYW1lZFN1YnNbc3ViSWRdLl9yZW1vdmVBbGxEb2N1bWVudHMoKTtcbiAgICAgIHNlbGYuX25hbWVkU3Vic1tzdWJJZF0uX2RlYWN0aXZhdGUoKTtcbiAgICAgIGRlbGV0ZSBzZWxmLl9uYW1lZFN1YnNbc3ViSWRdO1xuICAgIH1cblxuICAgIHZhciByZXNwb25zZSA9IHttc2c6ICdub3N1YicsIGlkOiBzdWJJZH07XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlc3BvbnNlLmVycm9yID0gd3JhcEludGVybmFsRXhjZXB0aW9uKFxuICAgICAgICBlcnJvcixcbiAgICAgICAgc3ViTmFtZSA/IChcImZyb20gc3ViIFwiICsgc3ViTmFtZSArIFwiIGlkIFwiICsgc3ViSWQpXG4gICAgICAgICAgOiAoXCJmcm9tIHN1YiBpZCBcIiArIHN1YklkKSk7XG4gICAgfVxuXG4gICAgc2VsZi5zZW5kKHJlc3BvbnNlKTtcbiAgfSxcblxuICAvLyB0ZWFyIGRvd24gYWxsIHN1YnNjcmlwdGlvbnMuIE5vdGUgdGhhdCB0aGlzIGRvZXMgTk9UIHNlbmQgcmVtb3ZlZCBvciBub3N1YlxuICAvLyBtZXNzYWdlcywgc2luY2Ugd2UgYXNzdW1lIHRoZSBjbGllbnQgaXMgZ29uZS5cbiAgX2RlYWN0aXZhdGVBbGxTdWJzY3JpcHRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgXy5lYWNoKHNlbGYuX25hbWVkU3VicywgZnVuY3Rpb24gKHN1YiwgaWQpIHtcbiAgICAgIHN1Yi5fZGVhY3RpdmF0ZSgpO1xuICAgIH0pO1xuICAgIHNlbGYuX25hbWVkU3VicyA9IHt9O1xuXG4gICAgXy5lYWNoKHNlbGYuX3VuaXZlcnNhbFN1YnMsIGZ1bmN0aW9uIChzdWIpIHtcbiAgICAgIHN1Yi5fZGVhY3RpdmF0ZSgpO1xuICAgIH0pO1xuICAgIHNlbGYuX3VuaXZlcnNhbFN1YnMgPSBbXTtcbiAgfSxcblxuICAvLyBEZXRlcm1pbmUgdGhlIHJlbW90ZSBjbGllbnQncyBJUCBhZGRyZXNzLCBiYXNlZCBvbiB0aGVcbiAgLy8gSFRUUF9GT1JXQVJERURfQ09VTlQgZW52aXJvbm1lbnQgdmFyaWFibGUgcmVwcmVzZW50aW5nIGhvdyBtYW55XG4gIC8vIHByb3hpZXMgdGhlIHNlcnZlciBpcyBiZWhpbmQuXG4gIF9jbGllbnRBZGRyZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gRm9yIHRoZSByZXBvcnRlZCBjbGllbnQgYWRkcmVzcyBmb3IgYSBjb25uZWN0aW9uIHRvIGJlIGNvcnJlY3QsXG4gICAgLy8gdGhlIGRldmVsb3BlciBtdXN0IHNldCB0aGUgSFRUUF9GT1JXQVJERURfQ09VTlQgZW52aXJvbm1lbnRcbiAgICAvLyB2YXJpYWJsZSB0byBhbiBpbnRlZ2VyIHJlcHJlc2VudGluZyB0aGUgbnVtYmVyIG9mIGhvcHMgdGhleVxuICAgIC8vIGV4cGVjdCBpbiB0aGUgYHgtZm9yd2FyZGVkLWZvcmAgaGVhZGVyLiBFLmcuLCBzZXQgdG8gXCIxXCIgaWYgdGhlXG4gICAgLy8gc2VydmVyIGlzIGJlaGluZCBvbmUgcHJveHkuXG4gICAgLy9cbiAgICAvLyBUaGlzIGNvdWxkIGJlIGNvbXB1dGVkIG9uY2UgYXQgc3RhcnR1cCBpbnN0ZWFkIG9mIGV2ZXJ5IHRpbWUuXG4gICAgdmFyIGh0dHBGb3J3YXJkZWRDb3VudCA9IHBhcnNlSW50KHByb2Nlc3MuZW52WydIVFRQX0ZPUldBUkRFRF9DT1VOVCddKSB8fCAwO1xuXG4gICAgaWYgKGh0dHBGb3J3YXJkZWRDb3VudCA9PT0gMClcbiAgICAgIHJldHVybiBzZWxmLnNvY2tldC5yZW1vdGVBZGRyZXNzO1xuXG4gICAgdmFyIGZvcndhcmRlZEZvciA9IHNlbGYuc29ja2V0LmhlYWRlcnNbXCJ4LWZvcndhcmRlZC1mb3JcIl07XG4gICAgaWYgKCEgXy5pc1N0cmluZyhmb3J3YXJkZWRGb3IpKVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgZm9yd2FyZGVkRm9yID0gZm9yd2FyZGVkRm9yLnRyaW0oKS5zcGxpdCgvXFxzKixcXHMqLyk7XG5cbiAgICAvLyBUeXBpY2FsbHkgdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBgeC1mb3J3YXJkZWQtZm9yYCBoZWFkZXIgaXNcbiAgICAvLyB0aGUgb3JpZ2luYWwgSVAgYWRkcmVzcyBvZiB0aGUgY2xpZW50IGNvbm5lY3RpbmcgdG8gdGhlIGZpcnN0XG4gICAgLy8gcHJveHkuICBIb3dldmVyLCB0aGUgZW5kIHVzZXIgY2FuIGVhc2lseSBzcG9vZiB0aGUgaGVhZGVyLCBpblxuICAgIC8vIHdoaWNoIGNhc2UgdGhlIGZpcnN0IHZhbHVlKHMpIHdpbGwgYmUgdGhlIGZha2UgSVAgYWRkcmVzcyBmcm9tXG4gICAgLy8gdGhlIHVzZXIgcHJldGVuZGluZyB0byBiZSBhIHByb3h5IHJlcG9ydGluZyB0aGUgb3JpZ2luYWwgSVBcbiAgICAvLyBhZGRyZXNzIHZhbHVlLiAgQnkgY291bnRpbmcgSFRUUF9GT1JXQVJERURfQ09VTlQgYmFjayBmcm9tIHRoZVxuICAgIC8vIGVuZCBvZiB0aGUgbGlzdCwgd2UgZW5zdXJlIHRoYXQgd2UgZ2V0IHRoZSBJUCBhZGRyZXNzIGJlaW5nXG4gICAgLy8gcmVwb3J0ZWQgYnkgKm91ciogZmlyc3QgcHJveHkuXG5cbiAgICBpZiAoaHR0cEZvcndhcmRlZENvdW50IDwgMCB8fCBodHRwRm9yd2FyZGVkQ291bnQgPiBmb3J3YXJkZWRGb3IubGVuZ3RoKVxuICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4gZm9yd2FyZGVkRm9yW2ZvcndhcmRlZEZvci5sZW5ndGggLSBodHRwRm9yd2FyZGVkQ291bnRdO1xuICB9XG59KTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIFN1YnNjcmlwdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBjdG9yIGZvciBhIHN1YiBoYW5kbGU6IHRoZSBpbnB1dCB0byBlYWNoIHB1Ymxpc2ggZnVuY3Rpb25cblxuLy8gSW5zdGFuY2UgbmFtZSBpcyB0aGlzIGJlY2F1c2UgaXQncyB1c3VhbGx5IHJlZmVycmVkIHRvIGFzIHRoaXMgaW5zaWRlIGFcbi8vIHB1Ymxpc2hcbi8qKlxuICogQHN1bW1hcnkgVGhlIHNlcnZlcidzIHNpZGUgb2YgYSBzdWJzY3JpcHRpb25cbiAqIEBjbGFzcyBTdWJzY3JpcHRpb25cbiAqIEBpbnN0YW5jZU5hbWUgdGhpc1xuICogQHNob3dJbnN0YW5jZU5hbWUgdHJ1ZVxuICovXG52YXIgU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24gKFxuICAgIHNlc3Npb24sIGhhbmRsZXIsIHN1YnNjcmlwdGlvbklkLCBwYXJhbXMsIG5hbWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLl9zZXNzaW9uID0gc2Vzc2lvbjsgLy8gdHlwZSBpcyBTZXNzaW9uXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEFjY2VzcyBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uIFRoZSBpbmNvbWluZyBbY29ubmVjdGlvbl0oI21ldGVvcl9vbmNvbm5lY3Rpb24pIGZvciB0aGlzIHN1YnNjcmlwdGlvbi5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbmFtZSAgY29ubmVjdGlvblxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKi9cbiAgc2VsZi5jb25uZWN0aW9uID0gc2Vzc2lvbi5jb25uZWN0aW9uSGFuZGxlOyAvLyBwdWJsaWMgQVBJIG9iamVjdFxuXG4gIHNlbGYuX2hhbmRsZXIgPSBoYW5kbGVyO1xuXG4gIC8vIG15IHN1YnNjcmlwdGlvbiBJRCAoZ2VuZXJhdGVkIGJ5IGNsaWVudCwgdW5kZWZpbmVkIGZvciB1bml2ZXJzYWwgc3VicykuXG4gIHNlbGYuX3N1YnNjcmlwdGlvbklkID0gc3Vic2NyaXB0aW9uSWQ7XG4gIC8vIHVuZGVmaW5lZCBmb3IgdW5pdmVyc2FsIHN1YnNcbiAgc2VsZi5fbmFtZSA9IG5hbWU7XG5cbiAgc2VsZi5fcGFyYW1zID0gcGFyYW1zIHx8IFtdO1xuXG4gIC8vIE9ubHkgbmFtZWQgc3Vic2NyaXB0aW9ucyBoYXZlIElEcywgYnV0IHdlIG5lZWQgc29tZSBzb3J0IG9mIHN0cmluZ1xuICAvLyBpbnRlcm5hbGx5IHRvIGtlZXAgdHJhY2sgb2YgYWxsIHN1YnNjcmlwdGlvbnMgaW5zaWRlXG4gIC8vIFNlc3Npb25Eb2N1bWVudFZpZXdzLiBXZSB1c2UgdGhpcyBzdWJzY3JpcHRpb25IYW5kbGUgZm9yIHRoYXQuXG4gIGlmIChzZWxmLl9zdWJzY3JpcHRpb25JZCkge1xuICAgIHNlbGYuX3N1YnNjcmlwdGlvbkhhbmRsZSA9ICdOJyArIHNlbGYuX3N1YnNjcmlwdGlvbklkO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuX3N1YnNjcmlwdGlvbkhhbmRsZSA9ICdVJyArIFJhbmRvbS5pZCgpO1xuICB9XG5cbiAgLy8gaGFzIF9kZWFjdGl2YXRlIGJlZW4gY2FsbGVkP1xuICBzZWxmLl9kZWFjdGl2YXRlZCA9IGZhbHNlO1xuXG4gIC8vIHN0b3AgY2FsbGJhY2tzIHRvIGcvYyB0aGlzIHN1Yi4gIGNhbGxlZCB3LyB6ZXJvIGFyZ3VtZW50cy5cbiAgc2VsZi5fc3RvcENhbGxiYWNrcyA9IFtdO1xuXG4gIC8vIHRoZSBzZXQgb2YgKGNvbGxlY3Rpb24sIGRvY3VtZW50aWQpIHRoYXQgdGhpcyBzdWJzY3JpcHRpb24gaGFzXG4gIC8vIGFuIG9waW5pb24gYWJvdXRcbiAgc2VsZi5fZG9jdW1lbnRzID0ge307XG5cbiAgLy8gcmVtZW1iZXIgaWYgd2UgYXJlIHJlYWR5LlxuICBzZWxmLl9yZWFkeSA9IGZhbHNlO1xuXG4gIC8vIFBhcnQgb2YgdGhlIHB1YmxpYyBBUEk6IHRoZSB1c2VyIG9mIHRoaXMgc3ViLlxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBBY2Nlc3MgaW5zaWRlIHRoZSBwdWJsaXNoIGZ1bmN0aW9uLiBUaGUgaWQgb2YgdGhlIGxvZ2dlZC1pbiB1c2VyLCBvciBgbnVsbGAgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4uXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIFN1YnNjcmlwdGlvblxuICAgKiBAbmFtZSAgdXNlcklkXG4gICAqIEBpbnN0YW5jZVxuICAgKi9cbiAgc2VsZi51c2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcblxuICAvLyBGb3Igbm93LCB0aGUgaWQgZmlsdGVyIGlzIGdvaW5nIHRvIGRlZmF1bHQgdG9cbiAgLy8gdGhlIHRvL2Zyb20gRERQIG1ldGhvZHMgb24gTW9uZ29JRCwgdG9cbiAgLy8gc3BlY2lmaWNhbGx5IGRlYWwgd2l0aCBtb25nby9taW5pbW9uZ28gT2JqZWN0SWRzLlxuXG4gIC8vIExhdGVyLCB5b3Ugd2lsbCBiZSBhYmxlIHRvIG1ha2UgdGhpcyBiZSBcInJhd1wiXG4gIC8vIGlmIHlvdSB3YW50IHRvIHB1Ymxpc2ggYSBjb2xsZWN0aW9uIHRoYXQgeW91IGtub3dcbiAgLy8ganVzdCBoYXMgc3RyaW5ncyBmb3Iga2V5cyBhbmQgbm8gZnVubnkgYnVzaW5lc3MsIHRvXG4gIC8vIGEgZGRwIGNvbnN1bWVyIHRoYXQgaXNuJ3QgbWluaW1vbmdvXG5cbiAgc2VsZi5faWRGaWx0ZXIgPSB7XG4gICAgaWRTdHJpbmdpZnk6IE1vbmdvSUQuaWRTdHJpbmdpZnksXG4gICAgaWRQYXJzZTogTW9uZ29JRC5pZFBhcnNlXG4gIH07XG5cbiAgUGFja2FnZS5mYWN0cyAmJiBQYWNrYWdlLmZhY3RzLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgXCJsaXZlZGF0YVwiLCBcInN1YnNjcmlwdGlvbnNcIiwgMSk7XG59O1xuXG5fLmV4dGVuZChTdWJzY3JpcHRpb24ucHJvdG90eXBlLCB7XG4gIF9ydW5IYW5kbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gWFhYIHNob3VsZCB3ZSB1bmJsb2NrKCkgaGVyZT8gRWl0aGVyIGJlZm9yZSBydW5uaW5nIHRoZSBwdWJsaXNoXG4gICAgLy8gZnVuY3Rpb24sIG9yIGJlZm9yZSBydW5uaW5nIF9wdWJsaXNoQ3Vyc29yLlxuICAgIC8vXG4gICAgLy8gUmlnaHQgbm93LCBlYWNoIHB1Ymxpc2ggZnVuY3Rpb24gYmxvY2tzIGFsbCBmdXR1cmUgcHVibGlzaGVzIGFuZFxuICAgIC8vIG1ldGhvZHMgd2FpdGluZyBvbiBkYXRhIGZyb20gTW9uZ28gKG9yIHdoYXRldmVyIGVsc2UgdGhlIGZ1bmN0aW9uXG4gICAgLy8gYmxvY2tzIG9uKS4gVGhpcyBwcm9iYWJseSBzbG93cyBwYWdlIGxvYWQgaW4gY29tbW9uIGNhc2VzLlxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRyeSB7XG4gICAgICB2YXIgcmVzID0gRERQLl9DdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uLndpdGhWYWx1ZShcbiAgICAgICAgc2VsZixcbiAgICAgICAgKCkgPT4gbWF5YmVBdWRpdEFyZ3VtZW50Q2hlY2tzKFxuICAgICAgICAgIHNlbGYuX2hhbmRsZXIsIHNlbGYsIEVKU09OLmNsb25lKHNlbGYuX3BhcmFtcyksXG4gICAgICAgICAgLy8gSXQncyBPSyB0aGF0IHRoaXMgd291bGQgbG9vayB3ZWlyZCBmb3IgdW5pdmVyc2FsIHN1YnNjcmlwdGlvbnMsXG4gICAgICAgICAgLy8gYmVjYXVzZSB0aGV5IGhhdmUgbm8gYXJndW1lbnRzIHNvIHRoZXJlIGNhbiBuZXZlciBiZSBhblxuICAgICAgICAgIC8vIGF1ZGl0LWFyZ3VtZW50LWNoZWNrcyBmYWlsdXJlLlxuICAgICAgICAgIFwicHVibGlzaGVyICdcIiArIHNlbGYuX25hbWUgKyBcIidcIlxuICAgICAgICApXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHNlbGYuZXJyb3IoZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRGlkIHRoZSBoYW5kbGVyIGNhbGwgdGhpcy5lcnJvciBvciB0aGlzLnN0b3A/XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcblxuICAgIHNlbGYuX3B1Ymxpc2hIYW5kbGVyUmVzdWx0KHJlcyk7XG4gIH0sXG5cbiAgX3B1Ymxpc2hIYW5kbGVyUmVzdWx0OiBmdW5jdGlvbiAocmVzKSB7XG4gICAgLy8gU1BFQ0lBTCBDQVNFOiBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlaXIgb3duIGNhbGxiYWNrcyB0aGF0IGludm9rZVxuICAgIC8vIHRoaXMuYWRkZWQvY2hhbmdlZC9yZWFkeS9ldGMsIHRoZSB1c2VyIGNhbiBqdXN0IHJldHVybiBhIGNvbGxlY3Rpb25cbiAgICAvLyBjdXJzb3Igb3IgYXJyYXkgb2YgY3Vyc29ycyBmcm9tIHRoZSBwdWJsaXNoIGZ1bmN0aW9uOyB3ZSBjYWxsIHRoZWlyXG4gICAgLy8gX3B1Ymxpc2hDdXJzb3IgbWV0aG9kIHdoaWNoIHN0YXJ0cyBvYnNlcnZpbmcgdGhlIGN1cnNvciBhbmQgcHVibGlzaGVzIHRoZVxuICAgIC8vIHJlc3VsdHMuIE5vdGUgdGhhdCBfcHVibGlzaEN1cnNvciBkb2VzIE5PVCBjYWxsIHJlYWR5KCkuXG4gICAgLy9cbiAgICAvLyBYWFggVGhpcyB1c2VzIGFuIHVuZG9jdW1lbnRlZCBpbnRlcmZhY2Ugd2hpY2ggb25seSB0aGUgTW9uZ28gY3Vyc29yXG4gICAgLy8gaW50ZXJmYWNlIHB1Ymxpc2hlcy4gU2hvdWxkIHdlIG1ha2UgdGhpcyBpbnRlcmZhY2UgcHVibGljIGFuZCBlbmNvdXJhZ2VcbiAgICAvLyB1c2VycyB0byBpbXBsZW1lbnQgaXQgdGhlbXNlbHZlcz8gQXJndWFibHksIGl0J3MgdW5uZWNlc3Nhcnk7IHVzZXJzIGNhblxuICAgIC8vIGFscmVhZHkgd3JpdGUgdGhlaXIgb3duIGZ1bmN0aW9ucyBsaWtlXG4gICAgLy8gICB2YXIgcHVibGlzaE15UmVhY3RpdmVUaGluZ3kgPSBmdW5jdGlvbiAobmFtZSwgaGFuZGxlcikge1xuICAgIC8vICAgICBNZXRlb3IucHVibGlzaChuYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gICAgICAgdmFyIHJlYWN0aXZlVGhpbmd5ID0gaGFuZGxlcigpO1xuICAgIC8vICAgICAgIHJlYWN0aXZlVGhpbmd5LnB1Ymxpc2hNZSgpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIH07XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGlzQ3Vyc29yID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgIHJldHVybiBjICYmIGMuX3B1Ymxpc2hDdXJzb3I7XG4gICAgfTtcbiAgICBpZiAoaXNDdXJzb3IocmVzKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzLl9wdWJsaXNoQ3Vyc29yKHNlbGYpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLmVycm9yKGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBfcHVibGlzaEN1cnNvciBvbmx5IHJldHVybnMgYWZ0ZXIgdGhlIGluaXRpYWwgYWRkZWQgY2FsbGJhY2tzIGhhdmUgcnVuLlxuICAgICAgLy8gbWFyayBzdWJzY3JpcHRpb24gYXMgcmVhZHkuXG4gICAgICBzZWxmLnJlYWR5KCk7XG4gICAgfSBlbHNlIGlmIChfLmlzQXJyYXkocmVzKSkge1xuICAgICAgLy8gY2hlY2sgYWxsIHRoZSBlbGVtZW50cyBhcmUgY3Vyc29yc1xuICAgICAgaWYgKCEgXy5hbGwocmVzLCBpc0N1cnNvcikpIHtcbiAgICAgICAgc2VsZi5lcnJvcihuZXcgRXJyb3IoXCJQdWJsaXNoIGZ1bmN0aW9uIHJldHVybmVkIGFuIGFycmF5IG9mIG5vbi1DdXJzb3JzXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gZmluZCBkdXBsaWNhdGUgY29sbGVjdGlvbiBuYW1lc1xuICAgICAgLy8gWFhYIHdlIHNob3VsZCBzdXBwb3J0IG92ZXJsYXBwaW5nIGN1cnNvcnMsIGJ1dCB0aGF0IHdvdWxkIHJlcXVpcmUgdGhlXG4gICAgICAvLyBtZXJnZSBib3ggdG8gYWxsb3cgb3ZlcmxhcCB3aXRoaW4gYSBzdWJzY3JpcHRpb25cbiAgICAgIHZhciBjb2xsZWN0aW9uTmFtZXMgPSB7fTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjb2xsZWN0aW9uTmFtZSA9IHJlc1tpXS5fZ2V0Q29sbGVjdGlvbk5hbWUoKTtcbiAgICAgICAgaWYgKF8uaGFzKGNvbGxlY3Rpb25OYW1lcywgY29sbGVjdGlvbk5hbWUpKSB7XG4gICAgICAgICAgc2VsZi5lcnJvcihuZXcgRXJyb3IoXG4gICAgICAgICAgICBcIlB1Ymxpc2ggZnVuY3Rpb24gcmV0dXJuZWQgbXVsdGlwbGUgY3Vyc29ycyBmb3IgY29sbGVjdGlvbiBcIiArXG4gICAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25OYW1lc1tjb2xsZWN0aW9uTmFtZV0gPSB0cnVlO1xuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgXy5lYWNoKHJlcywgZnVuY3Rpb24gKGN1cikge1xuICAgICAgICAgIGN1ci5fcHVibGlzaEN1cnNvcihzZWxmKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHNlbGYuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlbGYucmVhZHkoKTtcbiAgICB9IGVsc2UgaWYgKHJlcykge1xuICAgICAgLy8gdHJ1dGh5IHZhbHVlcyBvdGhlciB0aGFuIGN1cnNvcnMgb3IgYXJyYXlzIGFyZSBwcm9iYWJseSBhXG4gICAgICAvLyB1c2VyIG1pc3Rha2UgKHBvc3NpYmxlIHJldHVybmluZyBhIE1vbmdvIGRvY3VtZW50IHZpYSwgc2F5LFxuICAgICAgLy8gYGNvbGwuZmluZE9uZSgpYCkuXG4gICAgICBzZWxmLmVycm9yKG5ldyBFcnJvcihcIlB1Ymxpc2ggZnVuY3Rpb24gY2FuIG9ubHkgcmV0dXJuIGEgQ3Vyc29yIG9yIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiYW4gYXJyYXkgb2YgQ3Vyc29yc1wiKSk7XG4gICAgfVxuICB9LFxuXG4gIC8vIFRoaXMgY2FsbHMgYWxsIHN0b3AgY2FsbGJhY2tzIGFuZCBwcmV2ZW50cyB0aGUgaGFuZGxlciBmcm9tIHVwZGF0aW5nIGFueVxuICAvLyBTZXNzaW9uQ29sbGVjdGlvblZpZXdzIGZ1cnRoZXIuIEl0J3MgdXNlZCB3aGVuIHRoZSB1c2VyIHVuc3Vic2NyaWJlcyBvclxuICAvLyBkaXNjb25uZWN0cywgYXMgd2VsbCBhcyBkdXJpbmcgc2V0VXNlcklkIHJlLXJ1bnMuIEl0IGRvZXMgKk5PVCogc2VuZFxuICAvLyByZW1vdmVkIG1lc3NhZ2VzIGZvciB0aGUgcHVibGlzaGVkIG9iamVjdHM7IGlmIHRoYXQgaXMgbmVjZXNzYXJ5LCBjYWxsXG4gIC8vIF9yZW1vdmVBbGxEb2N1bWVudHMgZmlyc3QuXG4gIF9kZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2RlYWN0aXZhdGVkKVxuICAgICAgcmV0dXJuO1xuICAgIHNlbGYuX2RlYWN0aXZhdGVkID0gdHJ1ZTtcbiAgICBzZWxmLl9jYWxsU3RvcENhbGxiYWNrcygpO1xuICAgIFBhY2thZ2UuZmFjdHMgJiYgUGFja2FnZS5mYWN0cy5GYWN0cy5pbmNyZW1lbnRTZXJ2ZXJGYWN0KFxuICAgICAgXCJsaXZlZGF0YVwiLCBcInN1YnNjcmlwdGlvbnNcIiwgLTEpO1xuICB9LFxuXG4gIF9jYWxsU3RvcENhbGxiYWNrczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyB0ZWxsIGxpc3RlbmVycywgc28gdGhleSBjYW4gY2xlYW4gdXBcbiAgICB2YXIgY2FsbGJhY2tzID0gc2VsZi5fc3RvcENhbGxiYWNrcztcbiAgICBzZWxmLl9zdG9wQ2FsbGJhY2tzID0gW107XG4gICAgXy5lYWNoKGNhbGxiYWNrcywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIFNlbmQgcmVtb3ZlIG1lc3NhZ2VzIGZvciBldmVyeSBkb2N1bWVudC5cbiAgX3JlbW92ZUFsbERvY3VtZW50czogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICBfLmVhY2goc2VsZi5fZG9jdW1lbnRzLCBmdW5jdGlvbihjb2xsZWN0aW9uRG9jcywgY29sbGVjdGlvbk5hbWUpIHtcbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIF8ua2V5cyBpbnN0ZWFkIG9mIHRoZSBkaWN0aW9uYXJ5IGl0c2VsZiwgc2luY2Ugd2UnbGwgYmVcbiAgICAgICAgLy8gbXV0YXRpbmcgaXQuXG4gICAgICAgIF8uZWFjaChfLmtleXMoY29sbGVjdGlvbkRvY3MpLCBmdW5jdGlvbiAoc3RySWQpIHtcbiAgICAgICAgICBzZWxmLnJlbW92ZWQoY29sbGVjdGlvbk5hbWUsIHNlbGYuX2lkRmlsdGVyLmlkUGFyc2Uoc3RySWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBSZXR1cm5zIGEgbmV3IFN1YnNjcmlwdGlvbiBmb3IgdGhlIHNhbWUgc2Vzc2lvbiB3aXRoIHRoZSBzYW1lXG4gIC8vIGluaXRpYWwgY3JlYXRpb24gcGFyYW1ldGVycy4gVGhpcyBpc24ndCBhIGNsb25lOiBpdCBkb2Vzbid0IGhhdmVcbiAgLy8gdGhlIHNhbWUgX2RvY3VtZW50cyBjYWNoZSwgc3RvcHBlZCBzdGF0ZSBvciBjYWxsYmFja3M7IG1heSBoYXZlIGFcbiAgLy8gZGlmZmVyZW50IF9zdWJzY3JpcHRpb25IYW5kbGUsIGFuZCBnZXRzIGl0cyB1c2VySWQgZnJvbSB0aGVcbiAgLy8gc2Vzc2lvbiwgbm90IGZyb20gdGhpcyBvYmplY3QuXG4gIF9yZWNyZWF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbihcbiAgICAgIHNlbGYuX3Nlc3Npb24sIHNlbGYuX2hhbmRsZXIsIHNlbGYuX3N1YnNjcmlwdGlvbklkLCBzZWxmLl9wYXJhbXMsXG4gICAgICBzZWxmLl9uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBTdG9wcyB0aGlzIGNsaWVudCdzIHN1YnNjcmlwdGlvbiwgdHJpZ2dlcmluZyBhIGNhbGwgb24gdGhlIGNsaWVudCB0byB0aGUgYG9uU3RvcGAgY2FsbGJhY2sgcGFzc2VkIHRvIFtgTWV0ZW9yLnN1YnNjcmliZWBdKCNtZXRlb3Jfc3Vic2NyaWJlKSwgaWYgYW55LiBJZiBgZXJyb3JgIGlzIG5vdCBhIFtgTWV0ZW9yLkVycm9yYF0oI21ldGVvcl9lcnJvciksIGl0IHdpbGwgYmUgW3Nhbml0aXplZF0oI21ldGVvcl9lcnJvcikuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtFcnJvcn0gZXJyb3IgVGhlIGVycm9yIHRvIHBhc3MgdG8gdGhlIGNsaWVudC5cbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBTdWJzY3JpcHRpb25cbiAgICovXG4gIGVycm9yOiBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBzZWxmLl9zZXNzaW9uLl9zdG9wU3Vic2NyaXB0aW9uKHNlbGYuX3N1YnNjcmlwdGlvbklkLCBlcnJvcik7XG4gIH0sXG5cbiAgLy8gTm90ZSB0aGF0IHdoaWxlIG91ciBERFAgY2xpZW50IHdpbGwgbm90aWNlIHRoYXQgeW91J3ZlIGNhbGxlZCBzdG9wKCkgb24gdGhlXG4gIC8vIHNlcnZlciAoYW5kIGNsZWFuIHVwIGl0cyBfc3Vic2NyaXB0aW9ucyB0YWJsZSkgd2UgZG9uJ3QgYWN0dWFsbHkgcHJvdmlkZSBhXG4gIC8vIG1lY2hhbmlzbSBmb3IgYW4gYXBwIHRvIG5vdGljZSB0aGlzICh0aGUgc3Vic2NyaWJlIG9uRXJyb3IgY2FsbGJhY2sgb25seVxuICAvLyB0cmlnZ2VycyBpZiB0aGVyZSBpcyBhbiBlcnJvcikuXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IENhbGwgaW5zaWRlIHRoZSBwdWJsaXNoIGZ1bmN0aW9uLiAgU3RvcHMgdGhpcyBjbGllbnQncyBzdWJzY3JpcHRpb24gYW5kIGludm9rZXMgdGhlIGNsaWVudCdzIGBvblN0b3BgIGNhbGxiYWNrIHdpdGggbm8gZXJyb3IuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBTdWJzY3JpcHRpb25cbiAgICovXG4gIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBzZWxmLl9zZXNzaW9uLl9zdG9wU3Vic2NyaXB0aW9uKHNlbGYuX3N1YnNjcmlwdGlvbklkKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBSZWdpc3RlcnMgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBydW4gd2hlbiB0aGUgc3Vic2NyaXB0aW9uIGlzIHN0b3BwZWQuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIFN1YnNjcmlwdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG4gIG9uU3RvcDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGNhbGxiYWNrID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjaywgJ29uU3RvcCBjYWxsYmFjaycsIHNlbGYpO1xuICAgIGlmIChzZWxmLl9pc0RlYWN0aXZhdGVkKCkpXG4gICAgICBjYWxsYmFjaygpO1xuICAgIGVsc2VcbiAgICAgIHNlbGYuX3N0b3BDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gIH0sXG5cbiAgLy8gVGhpcyByZXR1cm5zIHRydWUgaWYgdGhlIHN1YiBoYXMgYmVlbiBkZWFjdGl2YXRlZCwgKk9SKiBpZiB0aGUgc2Vzc2lvbiB3YXNcbiAgLy8gZGVzdHJveWVkIGJ1dCB0aGUgZGVmZXJyZWQgY2FsbCB0byBfZGVhY3RpdmF0ZUFsbFN1YnNjcmlwdGlvbnMgaGFzbid0XG4gIC8vIGhhcHBlbmVkIHlldC5cbiAgX2lzRGVhY3RpdmF0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIHNlbGYuX2RlYWN0aXZhdGVkIHx8IHNlbGYuX3Nlc3Npb24uaW5RdWV1ZSA9PT0gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBJbmZvcm1zIHRoZSBzdWJzY3JpYmVyIHRoYXQgYSBkb2N1bWVudCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgcmVjb3JkIHNldC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbiBUaGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiB0aGF0IGNvbnRhaW5zIHRoZSBuZXcgZG9jdW1lbnQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgbmV3IGRvY3VtZW50J3MgSUQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZHMgVGhlIGZpZWxkcyBpbiB0aGUgbmV3IGRvY3VtZW50LiAgSWYgYF9pZGAgaXMgcHJlc2VudCBpdCBpcyBpZ25vcmVkLlxuICAgKi9cbiAgYWRkZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5faXNEZWFjdGl2YXRlZCgpKVxuICAgICAgcmV0dXJuO1xuICAgIGlkID0gc2VsZi5faWRGaWx0ZXIuaWRTdHJpbmdpZnkoaWQpO1xuICAgIE1ldGVvci5fZW5zdXJlKHNlbGYuX2RvY3VtZW50cywgY29sbGVjdGlvbk5hbWUpW2lkXSA9IHRydWU7XG4gICAgc2VsZi5fc2Vzc2lvbi5hZGRlZChzZWxmLl9zdWJzY3JpcHRpb25IYW5kbGUsIGNvbGxlY3Rpb25OYW1lLCBpZCwgZmllbGRzKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBJbmZvcm1zIHRoZSBzdWJzY3JpYmVyIHRoYXQgYSBkb2N1bWVudCBpbiB0aGUgcmVjb3JkIHNldCBoYXMgYmVlbiBtb2RpZmllZC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbiBUaGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiB0aGF0IGNvbnRhaW5zIHRoZSBjaGFuZ2VkIGRvY3VtZW50LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgVGhlIGNoYW5nZWQgZG9jdW1lbnQncyBJRC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGZpZWxkcyBUaGUgZmllbGRzIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhdmUgY2hhbmdlZCwgdG9nZXRoZXIgd2l0aCB0aGVpciBuZXcgdmFsdWVzLiAgSWYgYSBmaWVsZCBpcyBub3QgcHJlc2VudCBpbiBgZmllbGRzYCBpdCB3YXMgbGVmdCB1bmNoYW5nZWQ7IGlmIGl0IGlzIHByZXNlbnQgaW4gYGZpZWxkc2AgYW5kIGhhcyBhIHZhbHVlIG9mIGB1bmRlZmluZWRgIGl0IHdhcyByZW1vdmVkIGZyb20gdGhlIGRvY3VtZW50LiAgSWYgYF9pZGAgaXMgcHJlc2VudCBpdCBpcyBpZ25vcmVkLlxuICAgKi9cbiAgY2hhbmdlZDogZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCBpZCwgZmllbGRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9pc0RlYWN0aXZhdGVkKCkpXG4gICAgICByZXR1cm47XG4gICAgaWQgPSBzZWxmLl9pZEZpbHRlci5pZFN0cmluZ2lmeShpZCk7XG4gICAgc2VsZi5fc2Vzc2lvbi5jaGFuZ2VkKHNlbGYuX3N1YnNjcmlwdGlvbkhhbmRsZSwgY29sbGVjdGlvbk5hbWUsIGlkLCBmaWVsZHMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDYWxsIGluc2lkZSB0aGUgcHVibGlzaCBmdW5jdGlvbi4gIEluZm9ybXMgdGhlIHN1YnNjcmliZXIgdGhhdCBhIGRvY3VtZW50IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgcmVjb3JkIHNldC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbiBUaGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiB0aGF0IHRoZSBkb2N1bWVudCBoYXMgYmVlbiByZW1vdmVkIGZyb20uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50IHRoYXQgaGFzIGJlZW4gcmVtb3ZlZC5cbiAgICovXG4gIHJlbW92ZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBpZCA9IHNlbGYuX2lkRmlsdGVyLmlkU3RyaW5naWZ5KGlkKTtcbiAgICAvLyBXZSBkb24ndCBib3RoZXIgdG8gZGVsZXRlIHNldHMgb2YgdGhpbmdzIGluIGEgY29sbGVjdGlvbiBpZiB0aGVcbiAgICAvLyBjb2xsZWN0aW9uIGlzIGVtcHR5LiAgSXQgY291bGQgYnJlYWsgX3JlbW92ZUFsbERvY3VtZW50cy5cbiAgICBkZWxldGUgc2VsZi5fZG9jdW1lbnRzW2NvbGxlY3Rpb25OYW1lXVtpZF07XG4gICAgc2VsZi5fc2Vzc2lvbi5yZW1vdmVkKHNlbGYuX3N1YnNjcmlwdGlvbkhhbmRsZSwgY29sbGVjdGlvbk5hbWUsIGlkKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBJbmZvcm1zIHRoZSBzdWJzY3JpYmVyIHRoYXQgYW4gaW5pdGlhbCwgY29tcGxldGUgc25hcHNob3Qgb2YgdGhlIHJlY29yZCBzZXQgaGFzIGJlZW4gc2VudC4gIFRoaXMgd2lsbCB0cmlnZ2VyIGEgY2FsbCBvbiB0aGUgY2xpZW50IHRvIHRoZSBgb25SZWFkeWAgY2FsbGJhY2sgcGFzc2VkIHRvICBbYE1ldGVvci5zdWJzY3JpYmVgXSgjbWV0ZW9yX3N1YnNjcmliZSksIGlmIGFueS5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKi9cbiAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBpZiAoIXNlbGYuX3N1YnNjcmlwdGlvbklkKVxuICAgICAgcmV0dXJuOyAgLy8gdW5uZWNlc3NhcnkgYnV0IGlnbm9yZWQgZm9yIHVuaXZlcnNhbCBzdWJcbiAgICBpZiAoIXNlbGYuX3JlYWR5KSB7XG4gICAgICBzZWxmLl9zZXNzaW9uLnNlbmRSZWFkeShbc2VsZi5fc3Vic2NyaXB0aW9uSWRdKTtcbiAgICAgIHNlbGYuX3JlYWR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogU2VydmVyICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblNlcnZlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBUaGUgZGVmYXVsdCBoZWFydGJlYXQgaW50ZXJ2YWwgaXMgMzAgc2Vjb25kcyBvbiB0aGUgc2VydmVyIGFuZCAzNVxuICAvLyBzZWNvbmRzIG9uIHRoZSBjbGllbnQuICBTaW5jZSB0aGUgY2xpZW50IGRvZXNuJ3QgbmVlZCB0byBzZW5kIGFcbiAgLy8gcGluZyBhcyBsb25nIGFzIGl0IGlzIHJlY2VpdmluZyBwaW5ncywgdGhpcyBtZWFucyB0aGF0IHBpbmdzXG4gIC8vIG5vcm1hbGx5IGdvIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50LlxuICAvL1xuICAvLyBOb3RlOiBUcm9wb3NwaGVyZSBkZXBlbmRzIG9uIHRoZSBhYmlsaXR5IHRvIG11dGF0ZVxuICAvLyBNZXRlb3Iuc2VydmVyLm9wdGlvbnMuaGVhcnRiZWF0VGltZW91dCEgVGhpcyBpcyBhIGhhY2ssIGJ1dCBpdCdzIGxpZmUuXG4gIHNlbGYub3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucyB8fCB7fSwge1xuICAgIGhlYXJ0YmVhdEludGVydmFsOiAxNTAwMCxcbiAgICBoZWFydGJlYXRUaW1lb3V0OiAxNTAwMCxcbiAgICAvLyBGb3IgdGVzdGluZywgYWxsb3cgcmVzcG9uZGluZyB0byBwaW5ncyB0byBiZSBkaXNhYmxlZC5cbiAgICByZXNwb25kVG9QaW5nczogdHJ1ZVxuICB9KTtcblxuICAvLyBNYXAgb2YgY2FsbGJhY2tzIHRvIGNhbGwgd2hlbiBhIG5ldyBjb25uZWN0aW9uIGNvbWVzIGluIHRvIHRoZVxuICAvLyBzZXJ2ZXIgYW5kIGNvbXBsZXRlcyBERFAgdmVyc2lvbiBuZWdvdGlhdGlvbi4gVXNlIGFuIG9iamVjdCBpbnN0ZWFkXG4gIC8vIG9mIGFuIGFycmF5IHNvIHdlIGNhbiBzYWZlbHkgcmVtb3ZlIG9uZSBmcm9tIHRoZSBsaXN0IHdoaWxlXG4gIC8vIGl0ZXJhdGluZyBvdmVyIGl0LlxuICBzZWxmLm9uQ29ubmVjdGlvbkhvb2sgPSBuZXcgSG9vayh7XG4gICAgZGVidWdQcmludEV4Y2VwdGlvbnM6IFwib25Db25uZWN0aW9uIGNhbGxiYWNrXCJcbiAgfSk7XG5cbiAgLy8gTWFwIG9mIGNhbGxiYWNrcyB0byBjYWxsIHdoZW4gYSBuZXcgbWVzc2FnZSBjb21lcyBpbi5cbiAgc2VsZi5vbk1lc3NhZ2VIb29rID0gbmV3IEhvb2soe1xuICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiBcIm9uTWVzc2FnZSBjYWxsYmFja1wiXG4gIH0pO1xuXG4gIHNlbGYucHVibGlzaF9oYW5kbGVycyA9IHt9O1xuICBzZWxmLnVuaXZlcnNhbF9wdWJsaXNoX2hhbmRsZXJzID0gW107XG5cbiAgc2VsZi5tZXRob2RfaGFuZGxlcnMgPSB7fTtcblxuICBzZWxmLnNlc3Npb25zID0ge307IC8vIG1hcCBmcm9tIGlkIHRvIHNlc3Npb25cblxuICBzZWxmLnN0cmVhbV9zZXJ2ZXIgPSBuZXcgU3RyZWFtU2VydmVyO1xuXG4gIHNlbGYuc3RyZWFtX3NlcnZlci5yZWdpc3RlcihmdW5jdGlvbiAoc29ja2V0KSB7XG4gICAgLy8gc29ja2V0IGltcGxlbWVudHMgdGhlIFNvY2tKU0Nvbm5lY3Rpb24gaW50ZXJmYWNlXG4gICAgc29ja2V0Ll9tZXRlb3JTZXNzaW9uID0gbnVsbDtcblxuICAgIHZhciBzZW5kRXJyb3IgPSBmdW5jdGlvbiAocmVhc29uLCBvZmZlbmRpbmdNZXNzYWdlKSB7XG4gICAgICB2YXIgbXNnID0ge21zZzogJ2Vycm9yJywgcmVhc29uOiByZWFzb259O1xuICAgICAgaWYgKG9mZmVuZGluZ01lc3NhZ2UpXG4gICAgICAgIG1zZy5vZmZlbmRpbmdNZXNzYWdlID0gb2ZmZW5kaW5nTWVzc2FnZTtcbiAgICAgIHNvY2tldC5zZW5kKEREUENvbW1vbi5zdHJpbmdpZnlERFAobXNnKSk7XG4gICAgfTtcblxuICAgIHNvY2tldC5vbignZGF0YScsIGZ1bmN0aW9uIChyYXdfbXNnKSB7XG4gICAgICBpZiAoTWV0ZW9yLl9wcmludFJlY2VpdmVkRERQKSB7XG4gICAgICAgIE1ldGVvci5fZGVidWcoXCJSZWNlaXZlZCBERFBcIiwgcmF3X21zZyk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBtc2cgPSBERFBDb21tb24ucGFyc2VERFAocmF3X21zZyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHNlbmRFcnJvcignUGFyc2UgZXJyb3InKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1zZyA9PT0gbnVsbCB8fCAhbXNnLm1zZykge1xuICAgICAgICAgIHNlbmRFcnJvcignQmFkIHJlcXVlc3QnLCBtc2cpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtc2cubXNnID09PSAnY29ubmVjdCcpIHtcbiAgICAgICAgICBpZiAoc29ja2V0Ll9tZXRlb3JTZXNzaW9uKSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoXCJBbHJlYWR5IGNvbm5lY3RlZFwiLCBtc2cpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBGaWJlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLl9oYW5kbGVDb25uZWN0KHNvY2tldCwgbXNnKTtcbiAgICAgICAgICB9KS5ydW4oKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNvY2tldC5fbWV0ZW9yU2Vzc2lvbikge1xuICAgICAgICAgIHNlbmRFcnJvcignTXVzdCBjb25uZWN0IGZpcnN0JywgbXNnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc29ja2V0Ll9tZXRlb3JTZXNzaW9uLnByb2Nlc3NNZXNzYWdlKG1zZyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFhYWCBwcmludCBzdGFjayBuaWNlbHlcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIkludGVybmFsIGV4Y2VwdGlvbiB3aGlsZSBwcm9jZXNzaW5nIG1lc3NhZ2VcIiwgbXNnLFxuICAgICAgICAgICAgICAgICAgICAgIGUubWVzc2FnZSwgZS5zdGFjayk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNvY2tldC5fbWV0ZW9yU2Vzc2lvbikge1xuICAgICAgICBGaWJlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc29ja2V0Ll9tZXRlb3JTZXNzaW9uLmNsb3NlKCk7XG4gICAgICAgIH0pLnJ1bigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn07XG5cbl8uZXh0ZW5kKFNlcnZlci5wcm90b3R5cGUsIHtcblxuICAvKipcbiAgICogQHN1bW1hcnkgUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhIG5ldyBERFAgY29ubmVjdGlvbiBpcyBtYWRlIHRvIHRoZSBzZXJ2ZXIuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhIG5ldyBERFAgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZC5cbiAgICogQG1lbWJlck9mIE1ldGVvclxuICAgKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gICAqL1xuICBvbkNvbm5lY3Rpb246IGZ1bmN0aW9uIChmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gc2VsZi5vbkNvbm5lY3Rpb25Ib29rLnJlZ2lzdGVyKGZuKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhIG5ldyBERFAgbWVzc2FnZSBpcyByZWNlaXZlZC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IEREUCBtZXNzYWdlIGlzIHJlY2VpdmVkLlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICovXG4gIG9uTWVzc2FnZTogZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBzZWxmLm9uTWVzc2FnZUhvb2sucmVnaXN0ZXIoZm4pO1xuICB9LFxuXG4gIF9oYW5kbGVDb25uZWN0OiBmdW5jdGlvbiAoc29ja2V0LCBtc2cpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBUaGUgY29ubmVjdCBtZXNzYWdlIG11c3Qgc3BlY2lmeSBhIHZlcnNpb24gYW5kIGFuIGFycmF5IG9mIHN1cHBvcnRlZFxuICAgIC8vIHZlcnNpb25zLCBhbmQgaXQgbXVzdCBjbGFpbSB0byBzdXBwb3J0IHdoYXQgaXQgaXMgcHJvcG9zaW5nLlxuICAgIGlmICghKHR5cGVvZiAobXNnLnZlcnNpb24pID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgIF8uaXNBcnJheShtc2cuc3VwcG9ydCkgJiZcbiAgICAgICAgICBfLmFsbChtc2cuc3VwcG9ydCwgXy5pc1N0cmluZykgJiZcbiAgICAgICAgICBfLmNvbnRhaW5zKG1zZy5zdXBwb3J0LCBtc2cudmVyc2lvbikpKSB7XG4gICAgICBzb2NrZXQuc2VuZChERFBDb21tb24uc3RyaW5naWZ5RERQKHttc2c6ICdmYWlsZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBERFBDb21tb24uU1VQUE9SVEVEX0REUF9WRVJTSU9OU1swXX0pKTtcbiAgICAgIHNvY2tldC5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEluIHRoZSBmdXR1cmUsIGhhbmRsZSBzZXNzaW9uIHJlc3VtcHRpb246IHNvbWV0aGluZyBsaWtlOlxuICAgIC8vICBzb2NrZXQuX21ldGVvclNlc3Npb24gPSBzZWxmLnNlc3Npb25zW21zZy5zZXNzaW9uXVxuICAgIHZhciB2ZXJzaW9uID0gY2FsY3VsYXRlVmVyc2lvbihtc2cuc3VwcG9ydCwgRERQQ29tbW9uLlNVUFBPUlRFRF9ERFBfVkVSU0lPTlMpO1xuXG4gICAgaWYgKG1zZy52ZXJzaW9uICE9PSB2ZXJzaW9uKSB7XG4gICAgICAvLyBUaGUgYmVzdCB2ZXJzaW9uIHRvIHVzZSAoYWNjb3JkaW5nIHRvIHRoZSBjbGllbnQncyBzdGF0ZWQgcHJlZmVyZW5jZXMpXG4gICAgICAvLyBpcyBub3QgdGhlIG9uZSB0aGUgY2xpZW50IGlzIHRyeWluZyB0byB1c2UuIEluZm9ybSB0aGVtIGFib3V0IHRoZSBiZXN0XG4gICAgICAvLyB2ZXJzaW9uIHRvIHVzZS5cbiAgICAgIHNvY2tldC5zZW5kKEREUENvbW1vbi5zdHJpbmdpZnlERFAoe21zZzogJ2ZhaWxlZCcsIHZlcnNpb246IHZlcnNpb259KSk7XG4gICAgICBzb2NrZXQuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBZYXksIHZlcnNpb24gbWF0Y2hlcyEgQ3JlYXRlIGEgbmV3IHNlc3Npb24uXG4gICAgLy8gTm90ZTogVHJvcG9zcGhlcmUgZGVwZW5kcyBvbiB0aGUgYWJpbGl0eSB0byBtdXRhdGVcbiAgICAvLyBNZXRlb3Iuc2VydmVyLm9wdGlvbnMuaGVhcnRiZWF0VGltZW91dCEgVGhpcyBpcyBhIGhhY2ssIGJ1dCBpdCdzIGxpZmUuXG4gICAgc29ja2V0Ll9tZXRlb3JTZXNzaW9uID0gbmV3IFNlc3Npb24oc2VsZiwgdmVyc2lvbiwgc29ja2V0LCBzZWxmLm9wdGlvbnMpO1xuICAgIHNlbGYuc2Vzc2lvbnNbc29ja2V0Ll9tZXRlb3JTZXNzaW9uLmlkXSA9IHNvY2tldC5fbWV0ZW9yU2Vzc2lvbjtcbiAgICBzZWxmLm9uQ29ubmVjdGlvbkhvb2suZWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgIGlmIChzb2NrZXQuX21ldGVvclNlc3Npb24pXG4gICAgICAgIGNhbGxiYWNrKHNvY2tldC5fbWV0ZW9yU2Vzc2lvbi5jb25uZWN0aW9uSGFuZGxlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBwdWJsaXNoIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIHtTdHJpbmd9IGlkZW50aWZpZXIgZm9yIHF1ZXJ5XG4gICAqIEBwYXJhbSBoYW5kbGVyIHtGdW5jdGlvbn0gcHVibGlzaCBoYW5kbGVyXG4gICAqIEBwYXJhbSBvcHRpb25zIHtPYmplY3R9XG4gICAqXG4gICAqIFNlcnZlciB3aWxsIGNhbGwgaGFuZGxlciBmdW5jdGlvbiBvbiBlYWNoIG5ldyBzdWJzY3JpcHRpb24sXG4gICAqIGVpdGhlciB3aGVuIHJlY2VpdmluZyBERFAgc3ViIG1lc3NhZ2UgZm9yIGEgbmFtZWQgc3Vic2NyaXB0aW9uLCBvciBvblxuICAgKiBERFAgY29ubmVjdCBmb3IgYSB1bml2ZXJzYWwgc3Vic2NyaXB0aW9uLlxuICAgKlxuICAgKiBJZiBuYW1lIGlzIG51bGwsIHRoaXMgd2lsbCBiZSBhIHN1YnNjcmlwdGlvbiB0aGF0IGlzXG4gICAqIGF1dG9tYXRpY2FsbHkgZXN0YWJsaXNoZWQgYW5kIHBlcm1hbmVudGx5IG9uIGZvciBhbGwgY29ubmVjdGVkXG4gICAqIGNsaWVudCwgaW5zdGVhZCBvZiBhIHN1YnNjcmlwdGlvbiB0aGF0IGNhbiBiZSB0dXJuZWQgb24gYW5kIG9mZlxuICAgKiB3aXRoIHN1YnNjcmliZSgpLlxuICAgKlxuICAgKiBvcHRpb25zIHRvIGNvbnRhaW46XG4gICAqICAtIChtb3N0bHkgaW50ZXJuYWwpIGlzX2F1dG86IHRydWUgaWYgZ2VuZXJhdGVkIGF1dG9tYXRpY2FsbHlcbiAgICogICAgZnJvbSBhbiBhdXRvcHVibGlzaCBob29rLiB0aGlzIGlzIGZvciBjb3NtZXRpYyBwdXJwb3NlcyBvbmx5XG4gICAqICAgIChpdCBsZXRzIHVzIGRldGVybWluZSB3aGV0aGVyIHRvIHByaW50IGEgd2FybmluZyBzdWdnZXN0aW5nXG4gICAqICAgIHRoYXQgeW91IHR1cm4gb2ZmIGF1dG9wdWJsaXNoLilcbiAgICovXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFB1Ymxpc2ggYSByZWNvcmQgc2V0LlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG5hbWUgSWYgU3RyaW5nLCBuYW1lIG9mIHRoZSByZWNvcmQgc2V0LiAgSWYgT2JqZWN0LCBwdWJsaWNhdGlvbnMgRGljdGlvbmFyeSBvZiBwdWJsaXNoIGZ1bmN0aW9ucyBieSBuYW1lLiAgSWYgYG51bGxgLCB0aGUgc2V0IGhhcyBubyBuYW1lLCBhbmQgdGhlIHJlY29yZCBzZXQgaXMgYXV0b21hdGljYWxseSBzZW50IHRvIGFsbCBjb25uZWN0ZWQgY2xpZW50cy5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBGdW5jdGlvbiBjYWxsZWQgb24gdGhlIHNlcnZlciBlYWNoIHRpbWUgYSBjbGllbnQgc3Vic2NyaWJlcy4gIEluc2lkZSB0aGUgZnVuY3Rpb24sIGB0aGlzYCBpcyB0aGUgcHVibGlzaCBoYW5kbGVyIG9iamVjdCwgZGVzY3JpYmVkIGJlbG93LiAgSWYgdGhlIGNsaWVudCBwYXNzZWQgYXJndW1lbnRzIHRvIGBzdWJzY3JpYmVgLCB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzLlxuICAgKi9cbiAgcHVibGlzaDogZnVuY3Rpb24gKG5hbWUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoISBfLmlzT2JqZWN0KG5hbWUpKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgaWYgKG5hbWUgJiYgbmFtZSBpbiBzZWxmLnB1Ymxpc2hfaGFuZGxlcnMpIHtcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIklnbm9yaW5nIGR1cGxpY2F0ZSBwdWJsaXNoIG5hbWVkICdcIiArIG5hbWUgKyBcIidcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKFBhY2thZ2UuYXV0b3B1Ymxpc2ggJiYgIW9wdGlvbnMuaXNfYXV0bykge1xuICAgICAgICAvLyBUaGV5IGhhdmUgYXV0b3B1Ymxpc2ggb24sIHlldCB0aGV5J3JlIHRyeWluZyB0byBtYW51YWxseVxuICAgICAgICAvLyBwaWNraW5nIHN0dWZmIHRvIHB1Ymxpc2guIFRoZXkgcHJvYmFibHkgc2hvdWxkIHR1cm4gb2ZmXG4gICAgICAgIC8vIGF1dG9wdWJsaXNoLiAoVGhpcyBjaGVjayBpc24ndCBwZXJmZWN0IC0tIGlmIHlvdSBjcmVhdGUgYVxuICAgICAgICAvLyBwdWJsaXNoIGJlZm9yZSB5b3UgdHVybiBvbiBhdXRvcHVibGlzaCwgaXQgd29uJ3QgY2F0Y2hcbiAgICAgICAgLy8gaXQuIEJ1dCB0aGlzIHdpbGwgZGVmaW5pdGVseSBoYW5kbGUgdGhlIHNpbXBsZSBjYXNlIHdoZXJlXG4gICAgICAgIC8vIHlvdSd2ZSBhZGRlZCB0aGUgYXV0b3B1Ymxpc2ggcGFja2FnZSB0byB5b3VyIGFwcCwgYW5kIGFyZVxuICAgICAgICAvLyBjYWxsaW5nIHB1Ymxpc2ggZnJvbSB5b3VyIGFwcCBjb2RlLilcbiAgICAgICAgaWYgKCFzZWxmLndhcm5lZF9hYm91dF9hdXRvcHVibGlzaCkge1xuICAgICAgICAgIHNlbGYud2FybmVkX2Fib3V0X2F1dG9wdWJsaXNoID0gdHJ1ZTtcbiAgICAgICAgICBNZXRlb3IuX2RlYnVnKFxuICAgIFwiKiogWW91J3ZlIHNldCB1cCBzb21lIGRhdGEgc3Vic2NyaXB0aW9ucyB3aXRoIE1ldGVvci5wdWJsaXNoKCksIGJ1dFxcblwiICtcbiAgICBcIioqIHlvdSBzdGlsbCBoYXZlIGF1dG9wdWJsaXNoIHR1cm5lZCBvbi4gQmVjYXVzZSBhdXRvcHVibGlzaCBpcyBzdGlsbFxcblwiICtcbiAgICBcIioqIG9uLCB5b3VyIE1ldGVvci5wdWJsaXNoKCkgY2FsbHMgd29uJ3QgaGF2ZSBtdWNoIGVmZmVjdC4gQWxsIGRhdGFcXG5cIiArXG4gICAgXCIqKiB3aWxsIHN0aWxsIGJlIHNlbnQgdG8gYWxsIGNsaWVudHMuXFxuXCIgK1xuICAgIFwiKipcXG5cIiArXG4gICAgXCIqKiBUdXJuIG9mZiBhdXRvcHVibGlzaCBieSByZW1vdmluZyB0aGUgYXV0b3B1Ymxpc2ggcGFja2FnZTpcXG5cIiArXG4gICAgXCIqKlxcblwiICtcbiAgICBcIioqICAgJCBtZXRlb3IgcmVtb3ZlIGF1dG9wdWJsaXNoXFxuXCIgK1xuICAgIFwiKipcXG5cIiArXG4gICAgXCIqKiAuLiBhbmQgbWFrZSBzdXJlIHlvdSBoYXZlIE1ldGVvci5wdWJsaXNoKCkgYW5kIE1ldGVvci5zdWJzY3JpYmUoKSBjYWxsc1xcblwiICtcbiAgICBcIioqIGZvciBlYWNoIGNvbGxlY3Rpb24gdGhhdCB5b3Ugd2FudCBjbGllbnRzIHRvIHNlZS5cXG5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5hbWUpXG4gICAgICAgIHNlbGYucHVibGlzaF9oYW5kbGVyc1tuYW1lXSA9IGhhbmRsZXI7XG4gICAgICBlbHNlIHtcbiAgICAgICAgc2VsZi51bml2ZXJzYWxfcHVibGlzaF9oYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAvLyBTcGluIHVwIHRoZSBuZXcgcHVibGlzaGVyIG9uIGFueSBleGlzdGluZyBzZXNzaW9uIHRvby4gUnVuIGVhY2hcbiAgICAgICAgLy8gc2Vzc2lvbidzIHN1YnNjcmlwdGlvbiBpbiBhIG5ldyBGaWJlciwgc28gdGhhdCB0aGVyZSdzIG5vIGNoYW5nZSBmb3JcbiAgICAgICAgLy8gc2VsZi5zZXNzaW9ucyB0byBjaGFuZ2Ugd2hpbGUgd2UncmUgcnVubmluZyB0aGlzIGxvb3AuXG4gICAgICAgIF8uZWFjaChzZWxmLnNlc3Npb25zLCBmdW5jdGlvbiAoc2Vzc2lvbikge1xuICAgICAgICAgIGlmICghc2Vzc2lvbi5fZG9udFN0YXJ0TmV3VW5pdmVyc2FsU3Vicykge1xuICAgICAgICAgICAgRmliZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlc3Npb24uX3N0YXJ0U3Vic2NyaXB0aW9uKGhhbmRsZXIpO1xuICAgICAgICAgICAgfSkucnVuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIF8uZWFjaChuYW1lLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHNlbGYucHVibGlzaChrZXksIHZhbHVlLCB7fSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX3JlbW92ZVNlc3Npb246IGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLnNlc3Npb25zW3Nlc3Npb24uaWRdKSB7XG4gICAgICBkZWxldGUgc2VsZi5zZXNzaW9uc1tzZXNzaW9uLmlkXTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IERlZmluZXMgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIGludm9rZWQgb3ZlciB0aGUgbmV0d29yayBieSBjbGllbnRzLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQHBhcmFtIHtPYmplY3R9IG1ldGhvZHMgRGljdGlvbmFyeSB3aG9zZSBrZXlzIGFyZSBtZXRob2QgbmFtZXMgYW5kIHZhbHVlcyBhcmUgZnVuY3Rpb25zLlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICovXG4gIG1ldGhvZHM6IGZ1bmN0aW9uIChtZXRob2RzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIF8uZWFjaChtZXRob2RzLCBmdW5jdGlvbiAoZnVuYywgbmFtZSkge1xuICAgICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2QgJ1wiICsgbmFtZSArIFwiJyBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICBpZiAoc2VsZi5tZXRob2RfaGFuZGxlcnNbbmFtZV0pXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgbWV0aG9kIG5hbWVkICdcIiArIG5hbWUgKyBcIicgaXMgYWxyZWFkeSBkZWZpbmVkXCIpO1xuICAgICAgc2VsZi5tZXRob2RfaGFuZGxlcnNbbmFtZV0gPSBmdW5jO1xuICAgIH0pO1xuICB9LFxuXG4gIGNhbGw6IGZ1bmN0aW9uIChuYW1lLCAuLi5hcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoICYmIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gSWYgaXQncyBhIGZ1bmN0aW9uLCB0aGUgbGFzdCBhcmd1bWVudCBpcyB0aGUgcmVzdWx0IGNhbGxiYWNrLCBub3RcbiAgICAgIC8vIGEgcGFyYW1ldGVyIHRvIHRoZSByZW1vdGUgbWV0aG9kLlxuICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hcHBseShuYW1lLCBhcmdzLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgLy8gQSB2ZXJzaW9uIG9mIHRoZSBjYWxsIG1ldGhvZCB0aGF0IGFsd2F5cyByZXR1cm5zIGEgUHJvbWlzZS5cbiAgY2FsbEFzeW5jOiBmdW5jdGlvbiAobmFtZSwgLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLmFwcGx5QXN5bmMobmFtZSwgYXJncyk7XG4gIH0sXG5cbiAgYXBwbHk6IGZ1bmN0aW9uIChuYW1lLCBhcmdzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIC8vIFdlIHdlcmUgcGFzc2VkIDMgYXJndW1lbnRzLiBUaGV5IG1heSBiZSBlaXRoZXIgKG5hbWUsIGFyZ3MsIG9wdGlvbnMpXG4gICAgLy8gb3IgKG5hbWUsIGFyZ3MsIGNhbGxiYWNrKVxuICAgIGlmICghIGNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLmFwcGx5QXN5bmMobmFtZSwgYXJncywgb3B0aW9ucyk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIHJlc3VsdCBpbiB3aGljaGV2ZXIgd2F5IHRoZSBjYWxsZXIgYXNrZWQgZm9yIGl0LiBOb3RlIHRoYXQgd2VcbiAgICAvLyBkbyBOT1QgYmxvY2sgb24gdGhlIHdyaXRlIGZlbmNlIGluIGFuIGFuYWxvZ291cyB3YXkgdG8gaG93IHRoZSBjbGllbnRcbiAgICAvLyBibG9ja3Mgb24gdGhlIHJlbGV2YW50IGRhdGEgYmVpbmcgdmlzaWJsZSwgc28geW91IGFyZSBOT1QgZ3VhcmFudGVlZCB0aGF0XG4gICAgLy8gY3Vyc29yIG9ic2VydmUgY2FsbGJhY2tzIGhhdmUgZmlyZWQgd2hlbiB5b3VyIGNhbGxiYWNrIGlzIGludm9rZWQuIChXZVxuICAgIC8vIGNhbiBjaGFuZ2UgdGhpcyBpZiB0aGVyZSdzIGEgcmVhbCB1c2UgY2FzZS4pXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBwcm9taXNlLnRoZW4oXG4gICAgICAgIHJlc3VsdCA9PiBjYWxsYmFjayh1bmRlZmluZWQsIHJlc3VsdCksXG4gICAgICAgIGV4Y2VwdGlvbiA9PiBjYWxsYmFjayhleGNlcHRpb24pXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJvbWlzZS5hd2FpdCgpO1xuICAgIH1cbiAgfSxcblxuICAvLyBAcGFyYW0gb3B0aW9ucyB7T3B0aW9uYWwgT2JqZWN0fVxuICBhcHBseUFzeW5jOiBmdW5jdGlvbiAobmFtZSwgYXJncywgb3B0aW9ucykge1xuICAgIC8vIFJ1biB0aGUgaGFuZGxlclxuICAgIHZhciBoYW5kbGVyID0gdGhpcy5tZXRob2RfaGFuZGxlcnNbbmFtZV07XG4gICAgaWYgKCEgaGFuZGxlcikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICBuZXcgTWV0ZW9yLkVycm9yKDQwNCwgYE1ldGhvZCAnJHtuYW1lfScgbm90IGZvdW5kYClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhpcyBpcyBhIG1ldGhvZCBjYWxsIGZyb20gd2l0aGluIGFub3RoZXIgbWV0aG9kIG9yIHB1Ymxpc2ggZnVuY3Rpb24sXG4gICAgLy8gZ2V0IHRoZSB1c2VyIHN0YXRlIGZyb20gdGhlIG91dGVyIG1ldGhvZCBvciBwdWJsaXNoIGZ1bmN0aW9uLCBvdGhlcndpc2VcbiAgICAvLyBkb24ndCBhbGxvdyBzZXRVc2VySWQgdG8gYmUgY2FsbGVkXG4gICAgdmFyIHVzZXJJZCA9IG51bGw7XG4gICAgdmFyIHNldFVzZXJJZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgY2FsbCBzZXRVc2VySWQgb24gYSBzZXJ2ZXIgaW5pdGlhdGVkIG1ldGhvZCBjYWxsXCIpO1xuICAgIH07XG4gICAgdmFyIGNvbm5lY3Rpb24gPSBudWxsO1xuICAgIHZhciBjdXJyZW50TWV0aG9kSW52b2NhdGlvbiA9IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24uZ2V0KCk7XG4gICAgdmFyIGN1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24gPSBERFAuX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24uZ2V0KCk7XG4gICAgdmFyIHJhbmRvbVNlZWQgPSBudWxsO1xuICAgIGlmIChjdXJyZW50TWV0aG9kSW52b2NhdGlvbikge1xuICAgICAgdXNlcklkID0gY3VycmVudE1ldGhvZEludm9jYXRpb24udXNlcklkO1xuICAgICAgc2V0VXNlcklkID0gZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICAgIGN1cnJlbnRNZXRob2RJbnZvY2F0aW9uLnNldFVzZXJJZCh1c2VySWQpO1xuICAgICAgfTtcbiAgICAgIGNvbm5lY3Rpb24gPSBjdXJyZW50TWV0aG9kSW52b2NhdGlvbi5jb25uZWN0aW9uO1xuICAgICAgcmFuZG9tU2VlZCA9IEREUENvbW1vbi5tYWtlUnBjU2VlZChjdXJyZW50TWV0aG9kSW52b2NhdGlvbiwgbmFtZSk7XG4gICAgfSBlbHNlIGlmIChjdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uKSB7XG4gICAgICB1c2VySWQgPSBjdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uLnVzZXJJZDtcbiAgICAgIHNldFVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgICBjdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uLl9zZXNzaW9uLl9zZXRVc2VySWQodXNlcklkKTtcbiAgICAgIH07XG4gICAgICBjb25uZWN0aW9uID0gY3VycmVudFB1YmxpY2F0aW9uSW52b2NhdGlvbi5jb25uZWN0aW9uO1xuICAgIH1cblxuICAgIHZhciBpbnZvY2F0aW9uID0gbmV3IEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uKHtcbiAgICAgIGlzU2ltdWxhdGlvbjogZmFsc2UsXG4gICAgICB1c2VySWQsXG4gICAgICBzZXRVc2VySWQsXG4gICAgICBjb25uZWN0aW9uLFxuICAgICAgcmFuZG9tU2VlZFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcmVzb2x2ZShcbiAgICAgIEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24ud2l0aFZhbHVlKFxuICAgICAgICBpbnZvY2F0aW9uLFxuICAgICAgICAoKSA9PiBtYXliZUF1ZGl0QXJndW1lbnRDaGVja3MoXG4gICAgICAgICAgaGFuZGxlciwgaW52b2NhdGlvbiwgRUpTT04uY2xvbmUoYXJncyksXG4gICAgICAgICAgXCJpbnRlcm5hbCBjYWxsIHRvICdcIiArIG5hbWUgKyBcIidcIlxuICAgICAgICApXG4gICAgICApXG4gICAgKSkudGhlbihFSlNPTi5jbG9uZSk7XG4gIH0sXG5cbiAgX3VybEZvclNlc3Npb246IGZ1bmN0aW9uIChzZXNzaW9uSWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHNlc3Npb24gPSBzZWxmLnNlc3Npb25zW3Nlc3Npb25JZF07XG4gICAgaWYgKHNlc3Npb24pXG4gICAgICByZXR1cm4gc2Vzc2lvbi5fc29ja2V0VXJsO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59KTtcblxudmFyIGNhbGN1bGF0ZVZlcnNpb24gPSBmdW5jdGlvbiAoY2xpZW50U3VwcG9ydGVkVmVyc2lvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJTdXBwb3J0ZWRWZXJzaW9ucykge1xuICB2YXIgY29ycmVjdFZlcnNpb24gPSBfLmZpbmQoY2xpZW50U3VwcG9ydGVkVmVyc2lvbnMsIGZ1bmN0aW9uICh2ZXJzaW9uKSB7XG4gICAgcmV0dXJuIF8uY29udGFpbnMoc2VydmVyU3VwcG9ydGVkVmVyc2lvbnMsIHZlcnNpb24pO1xuICB9KTtcbiAgaWYgKCFjb3JyZWN0VmVyc2lvbikge1xuICAgIGNvcnJlY3RWZXJzaW9uID0gc2VydmVyU3VwcG9ydGVkVmVyc2lvbnNbMF07XG4gIH1cbiAgcmV0dXJuIGNvcnJlY3RWZXJzaW9uO1xufTtcblxuRERQU2VydmVyLl9jYWxjdWxhdGVWZXJzaW9uID0gY2FsY3VsYXRlVmVyc2lvbjtcblxuXG4vLyBcImJsaW5kXCIgZXhjZXB0aW9ucyBvdGhlciB0aGFuIHRob3NlIHRoYXQgd2VyZSBkZWxpYmVyYXRlbHkgdGhyb3duIHRvIHNpZ25hbFxuLy8gZXJyb3JzIHRvIHRoZSBjbGllbnRcbnZhciB3cmFwSW50ZXJuYWxFeGNlcHRpb24gPSBmdW5jdGlvbiAoZXhjZXB0aW9uLCBjb250ZXh0KSB7XG4gIGlmICghZXhjZXB0aW9uKSByZXR1cm4gZXhjZXB0aW9uO1xuXG4gIC8vIFRvIGFsbG93IHBhY2thZ2VzIHRvIHRocm93IGVycm9ycyBpbnRlbmRlZCBmb3IgdGhlIGNsaWVudCBidXQgbm90IGhhdmUgdG9cbiAgLy8gZGVwZW5kIG9uIHRoZSBNZXRlb3IuRXJyb3IgY2xhc3MsIGBpc0NsaWVudFNhZmVgIGNhbiBiZSBzZXQgdG8gdHJ1ZSBvbiBhbnlcbiAgLy8gZXJyb3IgYmVmb3JlIGl0IGlzIHRocm93bi5cbiAgaWYgKGV4Y2VwdGlvbi5pc0NsaWVudFNhZmUpIHtcbiAgICBpZiAoIShleGNlcHRpb24gaW5zdGFuY2VvZiBNZXRlb3IuRXJyb3IpKSB7XG4gICAgICBjb25zdCBvcmlnaW5hbE1lc3NhZ2UgPSBleGNlcHRpb24ubWVzc2FnZTtcbiAgICAgIGV4Y2VwdGlvbiA9IG5ldyBNZXRlb3IuRXJyb3IoZXhjZXB0aW9uLmVycm9yLCBleGNlcHRpb24ucmVhc29uLCBleGNlcHRpb24uZGV0YWlscyk7XG4gICAgICBleGNlcHRpb24ubWVzc2FnZSA9IG9yaWdpbmFsTWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIGV4Y2VwdGlvbjtcbiAgfVxuXG4gIC8vIFRlc3RzIGNhbiBzZXQgdGhlICdfZXhwZWN0ZWRCeVRlc3QnIGZsYWcgb24gYW4gZXhjZXB0aW9uIHNvIGl0IHdvbid0IGdvIHRvIFxuICAvLyB0aGUgc2VydmVyIGxvZy5cbiAgaWYgKCFleGNlcHRpb24uX2V4cGVjdGVkQnlUZXN0KSB7XG4gICAgTWV0ZW9yLl9kZWJ1ZyhcIkV4Y2VwdGlvbiBcIiArIGNvbnRleHQsIGV4Y2VwdGlvbi5zdGFjayk7XG4gICAgaWYgKGV4Y2VwdGlvbi5zYW5pdGl6ZWRFcnJvcikge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIlNhbml0aXplZCBhbmQgcmVwb3J0ZWQgdG8gdGhlIGNsaWVudCBhczpcIiwgZXhjZXB0aW9uLnNhbml0aXplZEVycm9yLm1lc3NhZ2UpO1xuICAgICAgTWV0ZW9yLl9kZWJ1ZygpO1xuICAgIH1cbiAgfVxuXG4gIC8vIERpZCB0aGUgZXJyb3IgY29udGFpbiBtb3JlIGRldGFpbHMgdGhhdCBjb3VsZCBoYXZlIGJlZW4gdXNlZnVsIGlmIGNhdWdodCBpblxuICAvLyBzZXJ2ZXIgY29kZSAob3IgaWYgdGhyb3duIGZyb20gbm9uLWNsaWVudC1vcmlnaW5hdGVkIGNvZGUpLCBidXQgYWxzb1xuICAvLyBwcm92aWRlZCBhIFwic2FuaXRpemVkXCIgdmVyc2lvbiB3aXRoIG1vcmUgY29udGV4dCB0aGFuIDUwMCBJbnRlcm5hbCBzZXJ2ZXJcbiAgLy8gZXJyb3I/IFVzZSB0aGF0LlxuICBpZiAoZXhjZXB0aW9uLnNhbml0aXplZEVycm9yKSB7XG4gICAgaWYgKGV4Y2VwdGlvbi5zYW5pdGl6ZWRFcnJvci5pc0NsaWVudFNhZmUpXG4gICAgICByZXR1cm4gZXhjZXB0aW9uLnNhbml0aXplZEVycm9yO1xuICAgIE1ldGVvci5fZGVidWcoXCJFeGNlcHRpb24gXCIgKyBjb250ZXh0ICsgXCIgcHJvdmlkZXMgYSBzYW5pdGl6ZWRFcnJvciB0aGF0IFwiICtcbiAgICAgICAgICAgICAgICAgIFwiZG9lcyBub3QgaGF2ZSBpc0NsaWVudFNhZmUgcHJvcGVydHkgc2V0OyBpZ25vcmluZ1wiKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIik7XG59O1xuXG5cbi8vIEF1ZGl0IGFyZ3VtZW50IGNoZWNrcywgaWYgdGhlIGF1ZGl0LWFyZ3VtZW50LWNoZWNrcyBwYWNrYWdlIGV4aXN0cyAoaXQgaXMgYVxuLy8gd2VhayBkZXBlbmRlbmN5IG9mIHRoaXMgcGFja2FnZSkuXG52YXIgbWF5YmVBdWRpdEFyZ3VtZW50Q2hlY2tzID0gZnVuY3Rpb24gKGYsIGNvbnRleHQsIGFyZ3MsIGRlc2NyaXB0aW9uKSB7XG4gIGFyZ3MgPSBhcmdzIHx8IFtdO1xuICBpZiAoUGFja2FnZVsnYXVkaXQtYXJndW1lbnQtY2hlY2tzJ10pIHtcbiAgICByZXR1cm4gTWF0Y2guX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQoXG4gICAgICBmLCBjb250ZXh0LCBhcmdzLCBkZXNjcmlwdGlvbik7XG4gIH1cbiAgcmV0dXJuIGYuYXBwbHkoY29udGV4dCwgYXJncyk7XG59O1xuIiwidmFyIEZ1dHVyZSA9IE5wbS5yZXF1aXJlKCdmaWJlcnMvZnV0dXJlJyk7XG5cbi8vIEEgd3JpdGUgZmVuY2UgY29sbGVjdHMgYSBncm91cCBvZiB3cml0ZXMsIGFuZCBwcm92aWRlcyBhIGNhbGxiYWNrXG4vLyB3aGVuIGFsbCBvZiB0aGUgd3JpdGVzIGFyZSBmdWxseSBjb21taXR0ZWQgYW5kIHByb3BhZ2F0ZWQgKGFsbFxuLy8gb2JzZXJ2ZXJzIGhhdmUgYmVlbiBub3RpZmllZCBvZiB0aGUgd3JpdGUgYW5kIGFja25vd2xlZGdlZCBpdC4pXG4vL1xuRERQU2VydmVyLl9Xcml0ZUZlbmNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgc2VsZi5hcm1lZCA9IGZhbHNlO1xuICBzZWxmLmZpcmVkID0gZmFsc2U7XG4gIHNlbGYucmV0aXJlZCA9IGZhbHNlO1xuICBzZWxmLm91dHN0YW5kaW5nX3dyaXRlcyA9IDA7XG4gIHNlbGYuYmVmb3JlX2ZpcmVfY2FsbGJhY2tzID0gW107XG4gIHNlbGYuY29tcGxldGlvbl9jYWxsYmFja3MgPSBbXTtcbn07XG5cbi8vIFRoZSBjdXJyZW50IHdyaXRlIGZlbmNlLiBXaGVuIHRoZXJlIGlzIGEgY3VycmVudCB3cml0ZSBmZW5jZSwgY29kZVxuLy8gdGhhdCB3cml0ZXMgdG8gZGF0YWJhc2VzIHNob3VsZCByZWdpc3RlciB0aGVpciB3cml0ZXMgd2l0aCBpdCB1c2luZ1xuLy8gYmVnaW5Xcml0ZSgpLlxuLy9cbkREUFNlcnZlci5fQ3VycmVudFdyaXRlRmVuY2UgPSBuZXcgTWV0ZW9yLkVudmlyb25tZW50VmFyaWFibGU7XG5cbl8uZXh0ZW5kKEREUFNlcnZlci5fV3JpdGVGZW5jZS5wcm90b3R5cGUsIHtcbiAgLy8gU3RhcnQgdHJhY2tpbmcgYSB3cml0ZSwgYW5kIHJldHVybiBhbiBvYmplY3QgdG8gcmVwcmVzZW50IGl0LiBUaGVcbiAgLy8gb2JqZWN0IGhhcyBhIHNpbmdsZSBtZXRob2QsIGNvbW1pdHRlZCgpLiBUaGlzIG1ldGhvZCBzaG91bGQgYmVcbiAgLy8gY2FsbGVkIHdoZW4gdGhlIHdyaXRlIGlzIGZ1bGx5IGNvbW1pdHRlZCBhbmQgcHJvcGFnYXRlZC4gWW91IGNhblxuICAvLyBjb250aW51ZSB0byBhZGQgd3JpdGVzIHRvIHRoZSBXcml0ZUZlbmNlIHVwIHVudGlsIGl0IGlzIHRyaWdnZXJlZFxuICAvLyAoY2FsbHMgaXRzIGNhbGxiYWNrcyBiZWNhdXNlIGFsbCB3cml0ZXMgaGF2ZSBjb21taXR0ZWQuKVxuICBiZWdpbldyaXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHNlbGYucmV0aXJlZClcbiAgICAgIHJldHVybiB7IGNvbW1pdHRlZDogZnVuY3Rpb24gKCkge30gfTtcblxuICAgIGlmIChzZWxmLmZpcmVkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmVuY2UgaGFzIGFscmVhZHkgYWN0aXZhdGVkIC0tIHRvbyBsYXRlIHRvIGFkZCB3cml0ZXNcIik7XG5cbiAgICBzZWxmLm91dHN0YW5kaW5nX3dyaXRlcysrO1xuICAgIHZhciBjb21taXR0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgY29tbWl0dGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb21taXR0ZWQpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY29tbWl0dGVkIGNhbGxlZCB0d2ljZSBvbiB0aGUgc2FtZSB3cml0ZVwiKTtcbiAgICAgICAgY29tbWl0dGVkID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5vdXRzdGFuZGluZ193cml0ZXMtLTtcbiAgICAgICAgc2VsZi5fbWF5YmVGaXJlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfSxcblxuICAvLyBBcm0gdGhlIGZlbmNlLiBPbmNlIHRoZSBmZW5jZSBpcyBhcm1lZCwgYW5kIHRoZXJlIGFyZSBubyBtb3JlXG4gIC8vIHVuY29tbWl0dGVkIHdyaXRlcywgaXQgd2lsbCBhY3RpdmF0ZS5cbiAgYXJtOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmID09PSBERFBTZXJ2ZXIuX0N1cnJlbnRXcml0ZUZlbmNlLmdldCgpKVxuICAgICAgdGhyb3cgRXJyb3IoXCJDYW4ndCBhcm0gdGhlIGN1cnJlbnQgZmVuY2VcIik7XG4gICAgc2VsZi5hcm1lZCA9IHRydWU7XG4gICAgc2VsZi5fbWF5YmVGaXJlKCk7XG4gIH0sXG5cbiAgLy8gUmVnaXN0ZXIgYSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb25jZSBiZWZvcmUgZmlyaW5nIHRoZSBmZW5jZS5cbiAgLy8gQ2FsbGJhY2sgZnVuY3Rpb24gY2FuIGFkZCBuZXcgd3JpdGVzIHRvIHRoZSBmZW5jZSwgaW4gd2hpY2ggY2FzZVxuICAvLyBpdCB3b24ndCBmaXJlIHVudGlsIHRob3NlIHdyaXRlcyBhcmUgZG9uZSBhcyB3ZWxsLlxuICBvbkJlZm9yZUZpcmU6IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLmZpcmVkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmVuY2UgaGFzIGFscmVhZHkgYWN0aXZhdGVkIC0tIHRvbyBsYXRlIHRvIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICBcImFkZCBhIGNhbGxiYWNrXCIpO1xuICAgIHNlbGYuYmVmb3JlX2ZpcmVfY2FsbGJhY2tzLnB1c2goZnVuYyk7XG4gIH0sXG5cbiAgLy8gUmVnaXN0ZXIgYSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZmVuY2UgZmlyZXMuXG4gIG9uQWxsQ29tbWl0dGVkOiBmdW5jdGlvbiAoZnVuYykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5maXJlZClcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImZlbmNlIGhhcyBhbHJlYWR5IGFjdGl2YXRlZCAtLSB0b28gbGF0ZSB0byBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgXCJhZGQgYSBjYWxsYmFja1wiKTtcbiAgICBzZWxmLmNvbXBsZXRpb25fY2FsbGJhY2tzLnB1c2goZnVuYyk7XG4gIH0sXG5cbiAgLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24uIEFybXMgdGhlIGZlbmNlLCB0aGVuIGJsb2NrcyB1bnRpbCBpdCBmaXJlcy5cbiAgYXJtQW5kV2FpdDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZnV0dXJlID0gbmV3IEZ1dHVyZTtcbiAgICBzZWxmLm9uQWxsQ29tbWl0dGVkKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1dHVyZVsncmV0dXJuJ10oKTtcbiAgICB9KTtcbiAgICBzZWxmLmFybSgpO1xuICAgIGZ1dHVyZS53YWl0KCk7XG4gIH0sXG5cbiAgX21heWJlRmlyZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5maXJlZClcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIndyaXRlIGZlbmNlIGFscmVhZHkgYWN0aXZhdGVkP1wiKTtcbiAgICBpZiAoc2VsZi5hcm1lZCAmJiAhc2VsZi5vdXRzdGFuZGluZ193cml0ZXMpIHtcbiAgICAgIGZ1bmN0aW9uIGludm9rZUNhbGxiYWNrIChmdW5jKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZnVuYyhzZWxmKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcImV4Y2VwdGlvbiBpbiB3cml0ZSBmZW5jZSBjYWxsYmFjazpcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLm91dHN0YW5kaW5nX3dyaXRlcysrO1xuICAgICAgd2hpbGUgKHNlbGYuYmVmb3JlX2ZpcmVfY2FsbGJhY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IHNlbGYuYmVmb3JlX2ZpcmVfY2FsbGJhY2tzO1xuICAgICAgICBzZWxmLmJlZm9yZV9maXJlX2NhbGxiYWNrcyA9IFtdO1xuICAgICAgICBfLmVhY2goY2FsbGJhY2tzLCBpbnZva2VDYWxsYmFjayk7XG4gICAgICB9XG4gICAgICBzZWxmLm91dHN0YW5kaW5nX3dyaXRlcy0tO1xuXG4gICAgICBpZiAoIXNlbGYub3V0c3RhbmRpbmdfd3JpdGVzKSB7XG4gICAgICAgIHNlbGYuZmlyZWQgPSB0cnVlO1xuICAgICAgICB2YXIgY2FsbGJhY2tzID0gc2VsZi5jb21wbGV0aW9uX2NhbGxiYWNrcztcbiAgICAgICAgc2VsZi5jb21wbGV0aW9uX2NhbGxiYWNrcyA9IFtdO1xuICAgICAgICBfLmVhY2goY2FsbGJhY2tzLCBpbnZva2VDYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIERlYWN0aXZhdGUgdGhpcyBmZW5jZSBzbyB0aGF0IGFkZGluZyBtb3JlIHdyaXRlcyBoYXMgbm8gZWZmZWN0LlxuICAvLyBUaGUgZmVuY2UgbXVzdCBoYXZlIGFscmVhZHkgZmlyZWQuXG4gIHJldGlyZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoISBzZWxmLmZpcmVkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcmV0aXJlIGEgZmVuY2UgdGhhdCBoYXNuJ3QgZmlyZWQuXCIpO1xuICAgIHNlbGYucmV0aXJlZCA9IHRydWU7XG4gIH1cbn0pO1xuIiwiLy8gQSBcImNyb3NzYmFyXCIgaXMgYSBjbGFzcyB0aGF0IHByb3ZpZGVzIHN0cnVjdHVyZWQgbm90aWZpY2F0aW9uIHJlZ2lzdHJhdGlvbi5cbi8vIFNlZSBfbWF0Y2ggZm9yIHRoZSBkZWZpbml0aW9uIG9mIGhvdyBhIG5vdGlmaWNhdGlvbiBtYXRjaGVzIGEgdHJpZ2dlci5cbi8vIEFsbCBub3RpZmljYXRpb25zIGFuZCB0cmlnZ2VycyBtdXN0IGhhdmUgYSBzdHJpbmcga2V5IG5hbWVkICdjb2xsZWN0aW9uJy5cblxuRERQU2VydmVyLl9Dcm9zc2JhciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgc2VsZi5uZXh0SWQgPSAxO1xuICAvLyBtYXAgZnJvbSBjb2xsZWN0aW9uIG5hbWUgKHN0cmluZykgLT4gbGlzdGVuZXIgaWQgLT4gb2JqZWN0LiBlYWNoIG9iamVjdCBoYXNcbiAgLy8ga2V5cyAndHJpZ2dlcicsICdjYWxsYmFjaycuICBBcyBhIGhhY2ssIHRoZSBlbXB0eSBzdHJpbmcgbWVhbnMgXCJub1xuICAvLyBjb2xsZWN0aW9uXCIuXG4gIHNlbGYubGlzdGVuZXJzQnlDb2xsZWN0aW9uID0ge307XG4gIHNlbGYuZmFjdFBhY2thZ2UgPSBvcHRpb25zLmZhY3RQYWNrYWdlIHx8IFwibGl2ZWRhdGFcIjtcbiAgc2VsZi5mYWN0TmFtZSA9IG9wdGlvbnMuZmFjdE5hbWUgfHwgbnVsbDtcbn07XG5cbl8uZXh0ZW5kKEREUFNlcnZlci5fQ3Jvc3NiYXIucHJvdG90eXBlLCB7XG4gIC8vIG1zZyBpcyBhIHRyaWdnZXIgb3IgYSBub3RpZmljYXRpb25cbiAgX2NvbGxlY3Rpb25Gb3JNZXNzYWdlOiBmdW5jdGlvbiAobXNnKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghIF8uaGFzKG1zZywgJ2NvbGxlY3Rpb24nKSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mKG1zZy5jb2xsZWN0aW9uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChtc2cuY29sbGVjdGlvbiA9PT0gJycpXG4gICAgICAgIHRocm93IEVycm9yKFwiTWVzc2FnZSBoYXMgZW1wdHkgY29sbGVjdGlvbiFcIik7XG4gICAgICByZXR1cm4gbXNnLmNvbGxlY3Rpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKFwiTWVzc2FnZSBoYXMgbm9uLXN0cmluZyBjb2xsZWN0aW9uIVwiKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gTGlzdGVuIGZvciBub3RpZmljYXRpb24gdGhhdCBtYXRjaCAndHJpZ2dlcicuIEEgbm90aWZpY2F0aW9uXG4gIC8vIG1hdGNoZXMgaWYgaXQgaGFzIHRoZSBrZXktdmFsdWUgcGFpcnMgaW4gdHJpZ2dlciBhcyBhXG4gIC8vIHN1YnNldC4gV2hlbiBhIG5vdGlmaWNhdGlvbiBtYXRjaGVzLCBjYWxsICdjYWxsYmFjaycsIHBhc3NpbmdcbiAgLy8gdGhlIGFjdHVhbCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vIFJldHVybnMgYSBsaXN0ZW4gaGFuZGxlLCB3aGljaCBpcyBhbiBvYmplY3Qgd2l0aCBhIG1ldGhvZFxuICAvLyBzdG9wKCkuIENhbGwgc3RvcCgpIHRvIHN0b3AgbGlzdGVuaW5nLlxuICAvL1xuICAvLyBYWFggSXQgc2hvdWxkIGJlIGxlZ2FsIHRvIGNhbGwgZmlyZSgpIGZyb20gaW5zaWRlIGEgbGlzdGVuKClcbiAgLy8gY2FsbGJhY2s/XG4gIGxpc3RlbjogZnVuY3Rpb24gKHRyaWdnZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBpZCA9IHNlbGYubmV4dElkKys7XG5cbiAgICB2YXIgY29sbGVjdGlvbiA9IHNlbGYuX2NvbGxlY3Rpb25Gb3JNZXNzYWdlKHRyaWdnZXIpO1xuICAgIHZhciByZWNvcmQgPSB7dHJpZ2dlcjogRUpTT04uY2xvbmUodHJpZ2dlciksIGNhbGxiYWNrOiBjYWxsYmFja307XG4gICAgaWYgKCEgXy5oYXMoc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb24sIGNvbGxlY3Rpb24pKSB7XG4gICAgICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uXSA9IHt9O1xuICAgIH1cbiAgICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uXVtpZF0gPSByZWNvcmQ7XG5cbiAgICBpZiAoc2VsZi5mYWN0TmFtZSAmJiBQYWNrYWdlLmZhY3RzKSB7XG4gICAgICBQYWNrYWdlLmZhY3RzLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICAgIHNlbGYuZmFjdFBhY2thZ2UsIHNlbGYuZmFjdE5hbWUsIDEpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxmLmZhY3ROYW1lICYmIFBhY2thZ2UuZmFjdHMpIHtcbiAgICAgICAgICBQYWNrYWdlLmZhY3RzLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICAgICAgICBzZWxmLmZhY3RQYWNrYWdlLCBzZWxmLmZhY3ROYW1lLCAtMSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIHNlbGYubGlzdGVuZXJzQnlDb2xsZWN0aW9uW2NvbGxlY3Rpb25dW2lkXTtcbiAgICAgICAgaWYgKF8uaXNFbXB0eShzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uXSkpIHtcbiAgICAgICAgICBkZWxldGUgc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb25bY29sbGVjdGlvbl07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9LFxuXG4gIC8vIEZpcmUgdGhlIHByb3ZpZGVkICdub3RpZmljYXRpb24nIChhbiBvYmplY3Qgd2hvc2UgYXR0cmlidXRlXG4gIC8vIHZhbHVlcyBhcmUgYWxsIEpTT04tY29tcGF0aWJpbGUpIC0tIGluZm9ybSBhbGwgbWF0Y2hpbmcgbGlzdGVuZXJzXG4gIC8vIChyZWdpc3RlcmVkIHdpdGggbGlzdGVuKCkpLlxuICAvL1xuICAvLyBJZiBmaXJlKCkgaXMgY2FsbGVkIGluc2lkZSBhIHdyaXRlIGZlbmNlLCB0aGVuIGVhY2ggb2YgdGhlXG4gIC8vIGxpc3RlbmVyIGNhbGxiYWNrcyB3aWxsIGJlIGNhbGxlZCBpbnNpZGUgdGhlIHdyaXRlIGZlbmNlIGFzIHdlbGwuXG4gIC8vXG4gIC8vIFRoZSBsaXN0ZW5lcnMgbWF5IGJlIGludm9rZWQgaW4gcGFyYWxsZWwsIHJhdGhlciB0aGFuIHNlcmlhbGx5LlxuICBmaXJlOiBmdW5jdGlvbiAobm90aWZpY2F0aW9uKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGNvbGxlY3Rpb24gPSBzZWxmLl9jb2xsZWN0aW9uRm9yTWVzc2FnZShub3RpZmljYXRpb24pO1xuXG4gICAgaWYgKCEgXy5oYXMoc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb24sIGNvbGxlY3Rpb24pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGxpc3RlbmVyc0ZvckNvbGxlY3Rpb24gPSBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uXTtcbiAgICB2YXIgY2FsbGJhY2tJZHMgPSBbXTtcbiAgICBfLmVhY2gobGlzdGVuZXJzRm9yQ29sbGVjdGlvbiwgZnVuY3Rpb24gKGwsIGlkKSB7XG4gICAgICBpZiAoc2VsZi5fbWF0Y2hlcyhub3RpZmljYXRpb24sIGwudHJpZ2dlcikpIHtcbiAgICAgICAgY2FsbGJhY2tJZHMucHVzaChpZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBMaXN0ZW5lciBjYWxsYmFja3MgY2FuIHlpZWxkLCBzbyB3ZSBuZWVkIHRvIGZpcnN0IGZpbmQgYWxsIHRoZSBvbmVzIHRoYXRcbiAgICAvLyBtYXRjaCBpbiBhIHNpbmdsZSBpdGVyYXRpb24gb3ZlciBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbiAod2hpY2ggY2FuJ3RcbiAgICAvLyBiZSBtdXRhdGVkIGR1cmluZyB0aGlzIGl0ZXJhdGlvbiksIGFuZCB0aGVuIGludm9rZSB0aGUgbWF0Y2hpbmdcbiAgICAvLyBjYWxsYmFja3MsIGNoZWNraW5nIGJlZm9yZSBlYWNoIGNhbGwgdG8gZW5zdXJlIHRoZXkgaGF2ZW4ndCBzdG9wcGVkLlxuICAgIC8vIE5vdGUgdGhhdCB3ZSBkb24ndCBoYXZlIHRvIGNoZWNrIHRoYXRcbiAgICAvLyBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uXSBzdGlsbCA9PT0gbGlzdGVuZXJzRm9yQ29sbGVjdGlvbixcbiAgICAvLyBiZWNhdXNlIHRoZSBvbmx5IHdheSB0aGF0IHN0b3BzIGJlaW5nIHRydWUgaXMgaWYgbGlzdGVuZXJzRm9yQ29sbGVjdGlvblxuICAgIC8vIGZpcnN0IGdldHMgcmVkdWNlZCBkb3duIHRvIHRoZSBlbXB0eSBvYmplY3QgKGFuZCB0aGVuIG5ldmVyIGdldHNcbiAgICAvLyBpbmNyZWFzZWQgYWdhaW4pLlxuICAgIF8uZWFjaChjYWxsYmFja0lkcywgZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoXy5oYXMobGlzdGVuZXJzRm9yQ29sbGVjdGlvbiwgaWQpKSB7XG4gICAgICAgIGxpc3RlbmVyc0ZvckNvbGxlY3Rpb25baWRdLmNhbGxiYWNrKG5vdGlmaWNhdGlvbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gQSBub3RpZmljYXRpb24gbWF0Y2hlcyBhIHRyaWdnZXIgaWYgYWxsIGtleXMgdGhhdCBleGlzdCBpbiBib3RoIGFyZSBlcXVhbC5cbiAgLy9cbiAgLy8gRXhhbXBsZXM6XG4gIC8vICBOOntjb2xsZWN0aW9uOiBcIkNcIn0gbWF0Y2hlcyBUOntjb2xsZWN0aW9uOiBcIkNcIn1cbiAgLy8gICAgKGEgbm9uLXRhcmdldGVkIHdyaXRlIHRvIGEgY29sbGVjdGlvbiBtYXRjaGVzIGFcbiAgLy8gICAgIG5vbi10YXJnZXRlZCBxdWVyeSlcbiAgLy8gIE46e2NvbGxlY3Rpb246IFwiQ1wiLCBpZDogXCJYXCJ9IG1hdGNoZXMgVDp7Y29sbGVjdGlvbjogXCJDXCJ9XG4gIC8vICAgIChhIHRhcmdldGVkIHdyaXRlIHRvIGEgY29sbGVjdGlvbiBtYXRjaGVzIGEgbm9uLXRhcmdldGVkIHF1ZXJ5KVxuICAvLyAgTjp7Y29sbGVjdGlvbjogXCJDXCJ9IG1hdGNoZXMgVDp7Y29sbGVjdGlvbjogXCJDXCIsIGlkOiBcIlhcIn1cbiAgLy8gICAgKGEgbm9uLXRhcmdldGVkIHdyaXRlIHRvIGEgY29sbGVjdGlvbiBtYXRjaGVzIGFcbiAgLy8gICAgIHRhcmdldGVkIHF1ZXJ5KVxuICAvLyAgTjp7Y29sbGVjdGlvbjogXCJDXCIsIGlkOiBcIlhcIn0gbWF0Y2hlcyBUOntjb2xsZWN0aW9uOiBcIkNcIiwgaWQ6IFwiWFwifVxuICAvLyAgICAoYSB0YXJnZXRlZCB3cml0ZSB0byBhIGNvbGxlY3Rpb24gbWF0Y2hlcyBhIHRhcmdldGVkIHF1ZXJ5IHRhcmdldGVkXG4gIC8vICAgICBhdCB0aGUgc2FtZSBkb2N1bWVudClcbiAgLy8gIE46e2NvbGxlY3Rpb246IFwiQ1wiLCBpZDogXCJYXCJ9IGRvZXMgbm90IG1hdGNoIFQ6e2NvbGxlY3Rpb246IFwiQ1wiLCBpZDogXCJZXCJ9XG4gIC8vICAgIChhIHRhcmdldGVkIHdyaXRlIHRvIGEgY29sbGVjdGlvbiBkb2VzIG5vdCBtYXRjaCBhIHRhcmdldGVkIHF1ZXJ5XG4gIC8vICAgICB0YXJnZXRlZCBhdCBhIGRpZmZlcmVudCBkb2N1bWVudClcbiAgX21hdGNoZXM6IGZ1bmN0aW9uIChub3RpZmljYXRpb24sIHRyaWdnZXIpIHtcbiAgICAvLyBNb3N0IG5vdGlmaWNhdGlvbnMgdGhhdCB1c2UgdGhlIGNyb3NzYmFyIGhhdmUgYSBzdHJpbmcgYGNvbGxlY3Rpb25gIGFuZFxuICAgIC8vIG1heWJlIGFuIGBpZGAgdGhhdCBpcyBhIHN0cmluZyBvciBPYmplY3RJRC4gV2UncmUgYWxyZWFkeSBkaXZpZGluZyB1cFxuICAgIC8vIHRyaWdnZXJzIGJ5IGNvbGxlY3Rpb24sIGJ1dCBsZXQncyBmYXN0LXRyYWNrIFwibm9wZSwgZGlmZmVyZW50IElEXCIgKGFuZFxuICAgIC8vIGF2b2lkIHRoZSBvdmVybHkgZ2VuZXJpYyBFSlNPTi5lcXVhbHMpLiBUaGlzIG1ha2VzIGEgbm90aWNlYWJsZVxuICAgIC8vIHBlcmZvcm1hbmNlIGRpZmZlcmVuY2U7IHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9wdWxsLzM2OTdcbiAgICBpZiAodHlwZW9mKG5vdGlmaWNhdGlvbi5pZCkgPT09ICdzdHJpbmcnICYmXG4gICAgICAgIHR5cGVvZih0cmlnZ2VyLmlkKSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgbm90aWZpY2F0aW9uLmlkICE9PSB0cmlnZ2VyLmlkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChub3RpZmljYXRpb24uaWQgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEICYmXG4gICAgICAgIHRyaWdnZXIuaWQgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEICYmXG4gICAgICAgICEgbm90aWZpY2F0aW9uLmlkLmVxdWFscyh0cmlnZ2VyLmlkKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBfLmFsbCh0cmlnZ2VyLCBmdW5jdGlvbiAodHJpZ2dlclZhbHVlLCBrZXkpIHtcbiAgICAgIHJldHVybiAhXy5oYXMobm90aWZpY2F0aW9uLCBrZXkpIHx8XG4gICAgICAgIEVKU09OLmVxdWFscyh0cmlnZ2VyVmFsdWUsIG5vdGlmaWNhdGlvbltrZXldKTtcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIFRoZSBcImludmFsaWRhdGlvbiBjcm9zc2JhclwiIGlzIGEgc3BlY2lmaWMgaW5zdGFuY2UgdXNlZCBieSB0aGUgRERQIHNlcnZlciB0b1xuLy8gaW1wbGVtZW50IHdyaXRlIGZlbmNlIG5vdGlmaWNhdGlvbnMuIExpc3RlbmVyIGNhbGxiYWNrcyBvbiB0aGlzIGNyb3NzYmFyXG4vLyBzaG91bGQgY2FsbCBiZWdpbldyaXRlIG9uIHRoZSBjdXJyZW50IHdyaXRlIGZlbmNlIGJlZm9yZSB0aGV5IHJldHVybiwgaWYgdGhleVxuLy8gd2FudCB0byBkZWxheSB0aGUgd3JpdGUgZmVuY2UgZnJvbSBmaXJpbmcgKGllLCB0aGUgRERQIG1ldGhvZC1kYXRhLXVwZGF0ZWRcbi8vIG1lc3NhZ2UgZnJvbSBiZWluZyBzZW50KS5cbkREUFNlcnZlci5fSW52YWxpZGF0aW9uQ3Jvc3NiYXIgPSBuZXcgRERQU2VydmVyLl9Dcm9zc2Jhcih7XG4gIGZhY3ROYW1lOiBcImludmFsaWRhdGlvbi1jcm9zc2Jhci1saXN0ZW5lcnNcIlxufSk7XG4iLCJpZiAocHJvY2Vzcy5lbnYuRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkwpIHtcbiAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCA9XG4gICAgcHJvY2Vzcy5lbnYuRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkw7XG59XG5cbk1ldGVvci5zZXJ2ZXIgPSBuZXcgU2VydmVyO1xuXG5NZXRlb3IucmVmcmVzaCA9IGZ1bmN0aW9uIChub3RpZmljYXRpb24pIHtcbiAgRERQU2VydmVyLl9JbnZhbGlkYXRpb25Dcm9zc2Jhci5maXJlKG5vdGlmaWNhdGlvbik7XG59O1xuXG4vLyBQcm94eSB0aGUgcHVibGljIG1ldGhvZHMgb2YgTWV0ZW9yLnNlcnZlciBzbyB0aGV5IGNhblxuLy8gYmUgY2FsbGVkIGRpcmVjdGx5IG9uIE1ldGVvci5cbl8uZWFjaChbJ3B1Ymxpc2gnLCAnbWV0aG9kcycsICdjYWxsJywgJ2FwcGx5JywgJ29uQ29ubmVjdGlvbicsICdvbk1lc3NhZ2UnXSxcbiAgICAgICBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgTWV0ZW9yW25hbWVdID0gXy5iaW5kKE1ldGVvci5zZXJ2ZXJbbmFtZV0sIE1ldGVvci5zZXJ2ZXIpO1xuICAgICAgIH0pO1xuXG4vLyBNZXRlb3Iuc2VydmVyIHVzZWQgdG8gYmUgY2FsbGVkIE1ldGVvci5kZWZhdWx0X3NlcnZlci4gUHJvdmlkZVxuLy8gYmFja2NvbXBhdCBhcyBhIGNvdXJ0ZXN5IGV2ZW4gdGhvdWdoIGl0IHdhcyBuZXZlciBkb2N1bWVudGVkLlxuLy8gWFhYIENPTVBBVCBXSVRIIDAuNi40XG5NZXRlb3IuZGVmYXVsdF9zZXJ2ZXIgPSBNZXRlb3Iuc2VydmVyO1xuIl19

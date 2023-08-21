(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
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

/* Package-scope variables */
var options, DDP;

var require = meteorInstall({"node_modules":{"meteor":{"ddp-client":{"server":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/server/server.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../common/namespace.js"), {
  DDP(v) {
    exports.DDP = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"common":{"MethodInvoker.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/common/MethodInvoker.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => MethodInvoker
});

class MethodInvoker {
  constructor(options) {
    // Public (within this file) fields.
    this.methodId = options.methodId;
    this.sentMessage = false;
    this._callback = options.callback;
    this._connection = options.connection;
    this._message = options.message;

    this._onResultReceived = options.onResultReceived || (() => {});

    this._wait = options.wait;
    this.noRetry = options.noRetry;
    this._methodResult = null;
    this._dataVisible = false; // Register with the connection.

    this._connection._methodInvokers[this.methodId] = this;
  } // Sends the method message to the server. May be called additional times if
  // we lose the connection and reconnect before receiving a result.


  sendMessage() {
    // This function is called before sending a method (including resending on
    // reconnect). We should only (re)send methods where we don't already have a
    // result!
    if (this.gotResult()) throw new Error('sendingMethod is called on method with result'); // If we're re-sending it, it doesn't matter if data was written the first
    // time.

    this._dataVisible = false;
    this.sentMessage = true; // If this is a wait method, make all data messages be buffered until it is
    // done.

    if (this._wait) this._connection._methodsBlockingQuiescence[this.methodId] = true; // Actually send the message.

    this._connection._send(this._message);
  } // Invoke the callback, if we have both a result and know that all data has
  // been written to the local cache.


  _maybeInvokeCallback() {
    if (this._methodResult && this._dataVisible) {
      // Call the callback. (This won't throw: the callback was wrapped with
      // bindEnvironment.)
      this._callback(this._methodResult[0], this._methodResult[1]); // Forget about this method.


      delete this._connection._methodInvokers[this.methodId]; // Let the connection know that this method is finished, so it can try to
      // move on to the next block of methods.

      this._connection._outstandingMethodFinished();
    }
  } // Call with the result of the method from the server. Only may be called
  // once; once it is called, you should not call sendMessage again.
  // If the user provided an onResultReceived callback, call it immediately.
  // Then invoke the main callback if data is also visible.


  receiveResult(err, result) {
    if (this.gotResult()) throw new Error('Methods should only receive results once');
    this._methodResult = [err, result];

    this._onResultReceived(err, result);

    this._maybeInvokeCallback();
  } // Call this when all data written by the method is visible. This means that
  // the method has returns its "data is done" message *AND* all server
  // documents that are buffered at that time have been written to the local
  // cache. Invokes the main callback if the result has been received.


  dataVisible() {
    this._dataVisible = true;

    this._maybeInvokeCallback();
  } // True if receiveResult has been called.


  gotResult() {
    return !!this._methodResult;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livedata_connection.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/common/livedata_connection.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  Connection: () => Connection
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let DDPCommon;
module.watch(require("meteor/ddp-common"), {
  DDPCommon(v) {
    DDPCommon = v;
  }

}, 1);
let Tracker;
module.watch(require("meteor/tracker"), {
  Tracker(v) {
    Tracker = v;
  }

}, 2);
let EJSON;
module.watch(require("meteor/ejson"), {
  EJSON(v) {
    EJSON = v;
  }

}, 3);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 4);
let Hook;
module.watch(require("meteor/callback-hook"), {
  Hook(v) {
    Hook = v;
  }

}, 5);
let MongoID;
module.watch(require("meteor/mongo-id"), {
  MongoID(v) {
    MongoID = v;
  }

}, 6);
let DDP;
module.watch(require("./namespace.js"), {
  DDP(v) {
    DDP = v;
  }

}, 7);
let MethodInvoker;
module.watch(require("./MethodInvoker.js"), {
  default(v) {
    MethodInvoker = v;
  }

}, 8);
let hasOwn, slice, keys, isEmpty, last;
module.watch(require("meteor/ddp-common/utils.js"), {
  hasOwn(v) {
    hasOwn = v;
  },

  slice(v) {
    slice = v;
  },

  keys(v) {
    keys = v;
  },

  isEmpty(v) {
    isEmpty = v;
  },

  last(v) {
    last = v;
  }

}, 9);

if (Meteor.isServer) {
  var Fiber = Npm.require('fibers');

  var Future = Npm.require('fibers/future');
}

class MongoIDMap extends IdMap {
  constructor() {
    super(MongoID.idStringify, MongoID.idParse);
  }

} // @param url {String|Object} URL to Meteor app,
//   or an object as a test hook (see code)
// Options:
//   reloadWithOutstanding: is it OK to reload if there are outstanding methods?
//   headers: extra headers to send on the websockets connection, for
//     server-to-server DDP only
//   _sockjsOptions: Specifies options to pass through to the sockjs client
//   onDDPNegotiationVersionFailure: callback when version negotiation fails.
//
// XXX There should be a way to destroy a DDP connection, causing all
// outstanding method calls to fail.
//
// XXX Our current way of handling failure and reconnection is great
// for an app (where we want to tolerate being disconnected as an
// expect state, and keep trying forever to reconnect) but cumbersome
// for something like a command line tool that wants to make a
// connection, call a method, and print an error if connection
// fails. We should have better usability in the latter case (while
// still transparently reconnecting if it's just a transient failure
// or the server migrating us).


class Connection {
  constructor(url, options) {
    var self = this;
    this.options = options = (0, _objectSpread2.default)({
      onConnected() {},

      onDDPVersionNegotiationFailure(description) {
        Meteor._debug(description);
      },

      heartbeatInterval: 17500,
      heartbeatTimeout: 15000,
      npmFayeOptions: Object.create(null),
      // These options are only for testing.
      reloadWithOutstanding: false,
      supportedDDPVersions: DDPCommon.SUPPORTED_DDP_VERSIONS,
      retry: true,
      respondToPings: true,
      // When updates are coming within this ms interval, batch them together.
      bufferedWritesInterval: 5,
      // Flush buffers immediately if writes are happening continuously for more than this many ms.
      bufferedWritesMaxAge: 500
    }, options); // If set, called when we reconnect, queuing method calls _before_ the
    // existing outstanding ones.
    // NOTE: This feature has been preserved for backwards compatibility. The
    // preferred method of setting a callback on reconnect is to use
    // DDP.onReconnect.

    self.onReconnect = null; // as a test hook, allow passing a stream instead of a url.

    if (typeof url === 'object') {
      self._stream = url;
    } else {
      const {
        ClientStream
      } = require("meteor/socket-stream-client");

      self._stream = new ClientStream(url, {
        retry: options.retry,
        ConnectionError: DDP.ConnectionError,
        headers: options.headers,
        _sockjsOptions: options._sockjsOptions,
        // Used to keep some tests quiet, or for other cases in which
        // the right thing to do with connection errors is to silently
        // fail (e.g. sending package usage stats). At some point we
        // should have a real API for handling client-stream-level
        // errors.
        _dontPrintErrors: options._dontPrintErrors,
        connectTimeoutMs: options.connectTimeoutMs,
        npmFayeOptions: options.npmFayeOptions
      });
    }

    self._lastSessionId = null;
    self._versionSuggestion = null; // The last proposed DDP version.

    self._version = null; // The DDP version agreed on by client and server.

    self._stores = Object.create(null); // name -> object with methods

    self._methodHandlers = Object.create(null); // name -> func

    self._nextMethodId = 1;
    self._supportedDDPVersions = options.supportedDDPVersions;
    self._heartbeatInterval = options.heartbeatInterval;
    self._heartbeatTimeout = options.heartbeatTimeout; // Tracks methods which the user has tried to call but which have not yet
    // called their user callback (ie, they are waiting on their result or for all
    // of their writes to be written to the local cache). Map from method ID to
    // MethodInvoker object.

    self._methodInvokers = Object.create(null); // Tracks methods which the user has called but whose result messages have not
    // arrived yet.
    //
    // _outstandingMethodBlocks is an array of blocks of methods. Each block
    // represents a set of methods that can run at the same time. The first block
    // represents the methods which are currently in flight; subsequent blocks
    // must wait for previous blocks to be fully finished before they can be sent
    // to the server.
    //
    // Each block is an object with the following fields:
    // - methods: a list of MethodInvoker objects
    // - wait: a boolean; if true, this block had a single method invoked with
    //         the "wait" option
    //
    // There will never be adjacent blocks with wait=false, because the only thing
    // that makes methods need to be serialized is a wait method.
    //
    // Methods are removed from the first block when their "result" is
    // received. The entire first block is only removed when all of the in-flight
    // methods have received their results (so the "methods" list is empty) *AND*
    // all of the data written by those methods are visible in the local cache. So
    // it is possible for the first block's methods list to be empty, if we are
    // still waiting for some objects to quiesce.
    //
    // Example:
    //  _outstandingMethodBlocks = [
    //    {wait: false, methods: []},
    //    {wait: true, methods: [<MethodInvoker for 'login'>]},
    //    {wait: false, methods: [<MethodInvoker for 'foo'>,
    //                            <MethodInvoker for 'bar'>]}]
    // This means that there were some methods which were sent to the server and
    // which have returned their results, but some of the data written by
    // the methods may not be visible in the local cache. Once all that data is
    // visible, we will send a 'login' method. Once the login method has returned
    // and all the data is visible (including re-running subs if userId changes),
    // we will send the 'foo' and 'bar' methods in parallel.

    self._outstandingMethodBlocks = []; // method ID -> array of objects with keys 'collection' and 'id', listing
    // documents written by a given method's stub. keys are associated with
    // methods whose stub wrote at least one document, and whose data-done message
    // has not yet been received.

    self._documentsWrittenByStub = Object.create(null); // collection -> IdMap of "server document" object. A "server document" has:
    // - "document": the version of the document according the
    //   server (ie, the snapshot before a stub wrote it, amended by any changes
    //   received from the server)
    //   It is undefined if we think the document does not exist
    // - "writtenByStubs": a set of method IDs whose stubs wrote to the document
    //   whose "data done" messages have not yet been processed

    self._serverDocuments = Object.create(null); // Array of callbacks to be called after the next update of the local
    // cache. Used for:
    //  - Calling methodInvoker.dataVisible and sub ready callbacks after
    //    the relevant data is flushed.
    //  - Invoking the callbacks of "half-finished" methods after reconnect
    //    quiescence. Specifically, methods whose result was received over the old
    //    connection (so we don't re-send it) but whose data had not been made
    //    visible.

    self._afterUpdateCallbacks = []; // In two contexts, we buffer all incoming data messages and then process them
    // all at once in a single update:
    //   - During reconnect, we buffer all data messages until all subs that had
    //     been ready before reconnect are ready again, and all methods that are
    //     active have returned their "data done message"; then
    //   - During the execution of a "wait" method, we buffer all data messages
    //     until the wait method gets its "data done" message. (If the wait method
    //     occurs during reconnect, it doesn't get any special handling.)
    // all data messages are processed in one update.
    //
    // The following fields are used for this "quiescence" process.
    // This buffers the messages that aren't being processed yet.

    self._messagesBufferedUntilQuiescence = []; // Map from method ID -> true. Methods are removed from this when their
    // "data done" message is received, and we will not quiesce until it is
    // empty.

    self._methodsBlockingQuiescence = Object.create(null); // map from sub ID -> true for subs that were ready (ie, called the sub
    // ready callback) before reconnect but haven't become ready again yet

    self._subsBeingRevived = Object.create(null); // map from sub._id -> true
    // if true, the next data update should reset all stores. (set during
    // reconnect.)

    self._resetStores = false; // name -> array of updates for (yet to be created) collections

    self._updatesForUnknownStores = Object.create(null); // if we're blocking a migration, the retry func

    self._retryMigrate = null;
    self.__flushBufferedWrites = Meteor.bindEnvironment(self._flushBufferedWrites, 'flushing DDP buffered writes', self); // Collection name -> array of messages.

    self._bufferedWrites = Object.create(null); // When current buffer of updates must be flushed at, in ms timestamp.

    self._bufferedWritesFlushAt = null; // Timeout handle for the next processing of all pending writes

    self._bufferedWritesFlushHandle = null;
    self._bufferedWritesInterval = options.bufferedWritesInterval;
    self._bufferedWritesMaxAge = options.bufferedWritesMaxAge; // metadata for subscriptions.  Map from sub ID to object with keys:
    //   - id
    //   - name
    //   - params
    //   - inactive (if true, will be cleaned up if not reused in re-run)
    //   - ready (has the 'ready' message been received?)
    //   - readyCallback (an optional callback to call when ready)
    //   - errorCallback (an optional callback to call if the sub terminates with
    //                    an error, XXX COMPAT WITH 1.0.3.1)
    //   - stopCallback (an optional callback to call when the sub terminates
    //     for any reason, with an error argument if an error triggered the stop)

    self._subscriptions = Object.create(null); // Reactive userId.

    self._userId = null;
    self._userIdDeps = new Tracker.Dependency(); // Block auto-reload while we're waiting for method responses.

    if (Meteor.isClient && Package.reload && !options.reloadWithOutstanding) {
      Package.reload.Reload._onMigrate(retry => {
        if (!self._readyToMigrate()) {
          if (self._retryMigrate) throw new Error('Two migrations in progress?');
          self._retryMigrate = retry;
          return false;
        } else {
          return [true];
        }
      });
    }

    var onDisconnect = () => {
      if (self._heartbeat) {
        self._heartbeat.stop();

        self._heartbeat = null;
      }
    };

    if (Meteor.isServer) {
      self._stream.on('message', Meteor.bindEnvironment(this.onMessage.bind(this), 'handling DDP message'));

      self._stream.on('reset', Meteor.bindEnvironment(this.onReset.bind(this), 'handling DDP reset'));

      self._stream.on('disconnect', Meteor.bindEnvironment(onDisconnect, 'handling DDP disconnect'));
    } else {
      self._stream.on('message', this.onMessage.bind(this));

      self._stream.on('reset', this.onReset.bind(this));

      self._stream.on('disconnect', onDisconnect);
    }
  } // 'name' is the name of the data on the wire that should go in the
  // store. 'wrappedStore' should be an object with methods beginUpdate, update,
  // endUpdate, saveOriginals, retrieveOriginals. see Collection for an example.


  registerStore(name, wrappedStore) {
    var self = this;
    if (name in self._stores) return false; // Wrap the input object in an object which makes any store method not
    // implemented by 'store' into a no-op.

    var store = Object.create(null);
    ['update', 'beginUpdate', 'endUpdate', 'saveOriginals', 'retrieveOriginals', 'getDoc', '_getCollection'].forEach(method => {
      store[method] = (...args) => {
        if (wrappedStore[method]) {
          return wrappedStore[method](...args);
        }
      };
    });
    self._stores[name] = store;
    var queued = self._updatesForUnknownStores[name];

    if (queued) {
      store.beginUpdate(queued.length, false);
      queued.forEach(msg => {
        store.update(msg);
      });
      store.endUpdate();
      delete self._updatesForUnknownStores[name];
    }

    return true;
  }
  /**
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.subscribe
   * @summary Subscribe to a record set.  Returns a handle that provides
   * `stop()` and `ready()` methods.
   * @locus Client
   * @param {String} name Name of the subscription.  Matches the name of the
   * server's `publish()` call.
   * @param {EJSONable} [arg1,arg2...] Optional arguments passed to publisher
   * function on server.
   * @param {Function|Object} [callbacks] Optional. May include `onStop`
   * and `onReady` callbacks. If there is an error, it is passed as an
   * argument to `onStop`. If a function is passed instead of an object, it
   * is interpreted as an `onReady` callback.
   */


  subscribe(name
  /* .. [arguments] .. (callback|callbacks) */
  ) {
    var self = this;
    var params = slice.call(arguments, 1);
    var callbacks = Object.create(null);

    if (params.length) {
      var lastParam = params[params.length - 1];

      if (typeof lastParam === 'function') {
        callbacks.onReady = params.pop();
      } else if (lastParam && [lastParam.onReady, // XXX COMPAT WITH 1.0.3.1 onError used to exist, but now we use
      // onStop with an error callback instead.
      lastParam.onError, lastParam.onStop].some(f => typeof f === "function")) {
        callbacks = params.pop();
      }
    } // Is there an existing sub with the same name and param, run in an
    // invalidated Computation? This will happen if we are rerunning an
    // existing computation.
    //
    // For example, consider a rerun of:
    //
    //     Tracker.autorun(function () {
    //       Meteor.subscribe("foo", Session.get("foo"));
    //       Meteor.subscribe("bar", Session.get("bar"));
    //     });
    //
    // If "foo" has changed but "bar" has not, we will match the "bar"
    // subcribe to an existing inactive subscription in order to not
    // unsub and resub the subscription unnecessarily.
    //
    // We only look for one such sub; if there are N apparently-identical subs
    // being invalidated, we will require N matching subscribe calls to keep
    // them all active.


    var existing;
    keys(self._subscriptions).some(id => {
      const sub = self._subscriptions[id];

      if (sub.inactive && sub.name === name && EJSON.equals(sub.params, params)) {
        return existing = sub;
      }
    });
    var id;

    if (existing) {
      id = existing.id;
      existing.inactive = false; // reactivate

      if (callbacks.onReady) {
        // If the sub is not already ready, replace any ready callback with the
        // one provided now. (It's not really clear what users would expect for
        // an onReady callback inside an autorun; the semantics we provide is
        // that at the time the sub first becomes ready, we call the last
        // onReady callback provided, if any.)
        // If the sub is already ready, run the ready callback right away.
        // It seems that users would expect an onReady callback inside an
        // autorun to trigger once the the sub first becomes ready and also
        // when re-subs happens.
        if (existing.ready) {
          callbacks.onReady();
        } else {
          existing.readyCallback = callbacks.onReady;
        }
      } // XXX COMPAT WITH 1.0.3.1 we used to have onError but now we call
      // onStop with an optional error argument


      if (callbacks.onError) {
        // Replace existing callback if any, so that errors aren't
        // double-reported.
        existing.errorCallback = callbacks.onError;
      }

      if (callbacks.onStop) {
        existing.stopCallback = callbacks.onStop;
      }
    } else {
      // New sub! Generate an id, save it locally, and send message.
      id = Random.id();
      self._subscriptions[id] = {
        id: id,
        name: name,
        params: EJSON.clone(params),
        inactive: false,
        ready: false,
        readyDeps: new Tracker.Dependency(),
        readyCallback: callbacks.onReady,
        // XXX COMPAT WITH 1.0.3.1 #errorCallback
        errorCallback: callbacks.onError,
        stopCallback: callbacks.onStop,
        connection: self,

        remove() {
          delete this.connection._subscriptions[this.id];
          this.ready && this.readyDeps.changed();
        },

        stop() {
          this.connection._send({
            msg: 'unsub',
            id: id
          });

          this.remove();

          if (callbacks.onStop) {
            callbacks.onStop();
          }
        }

      };

      self._send({
        msg: 'sub',
        id: id,
        name: name,
        params: params
      });
    } // return a handle to the application.


    var handle = {
      stop() {
        if (!hasOwn.call(self._subscriptions, id)) {
          return;
        }

        self._subscriptions[id].stop();
      },

      ready() {
        // return false if we've unsubscribed.
        if (!hasOwn.call(self._subscriptions, id)) {
          return false;
        }

        var record = self._subscriptions[id];
        record.readyDeps.depend();
        return record.ready;
      },

      subscriptionId: id
    };

    if (Tracker.active) {
      // We're in a reactive computation, so we'd like to unsubscribe when the
      // computation is invalidated... but not if the rerun just re-subscribes
      // to the same subscription!  When a rerun happens, we use onInvalidate
      // as a change to mark the subscription "inactive" so that it can
      // be reused from the rerun.  If it isn't reused, it's killed from
      // an afterFlush.
      Tracker.onInvalidate(c => {
        if (hasOwn.call(self._subscriptions, id)) {
          self._subscriptions[id].inactive = true;
        }

        Tracker.afterFlush(() => {
          if (hasOwn.call(self._subscriptions, id) && self._subscriptions[id].inactive) {
            handle.stop();
          }
        });
      });
    }

    return handle;
  } // options:
  // - onLateError {Function(error)} called if an error was received after the ready event.
  //     (errors received before ready cause an error to be thrown)


  _subscribeAndWait(name, args, options) {
    var self = this;
    var f = new Future();
    var ready = false;
    var handle;
    args = args || [];
    args.push({
      onReady() {
        ready = true;
        f['return']();
      },

      onError(e) {
        if (!ready) f['throw'](e);else options && options.onLateError && options.onLateError(e);
      }

    });
    handle = self.subscribe.apply(self, [name].concat(args));
    f.wait();
    return handle;
  }

  methods(methods) {
    keys(methods).forEach(name => {
      const func = methods[name];

      if (typeof func !== 'function') {
        throw new Error("Method '" + name + "' must be a function");
      }

      if (this._methodHandlers[name]) {
        throw new Error("A method named '" + name + "' is already defined");
      }

      this._methodHandlers[name] = func;
    });
  }
  /**
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.call
   * @summary Invokes a method passing any number of arguments.
   * @locus Anywhere
   * @param {String} name Name of method to invoke
   * @param {EJSONable} [arg1,arg2...] Optional method arguments
   * @param {Function} [asyncCallback] Optional callback, which is called asynchronously with the error or result after the method is complete. If not provided, the method runs synchronously if possible (see below).
   */


  call(name
  /* .. [arguments] .. callback */
  ) {
    // if it's a function, the last argument is the result callback,
    // not a parameter to the remote method.
    var args = slice.call(arguments, 1);
    if (args.length && typeof args[args.length - 1] === 'function') var callback = args.pop();
    return this.apply(name, args, callback);
  }
  /**
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.apply
   * @summary Invoke a method passing an array of arguments.
   * @locus Anywhere
   * @param {String} name Name of method to invoke
   * @param {EJSONable[]} args Method arguments
   * @param {Object} [options]
   * @param {Boolean} options.wait (Client only) If true, don't send this method until all previous method calls have completed, and don't send any subsequent method calls until this one is completed.
   * @param {Function} options.onResultReceived (Client only) This callback is invoked with the error or result of the method (just like `asyncCallback`) as soon as the error or result is available. The local cache may not yet reflect the writes performed by the method.
   * @param {Boolean} options.noRetry (Client only) if true, don't send this method again on reload, simply call the callback an error with the error code 'invocation-failed'.
   * @param {Boolean} options.throwStubExceptions (Client only) If true, exceptions thrown by method stubs will be thrown instead of logged, and the method will not be invoked on the server.
   * @param {Boolean} options.returnStubValue (Client only) If true then in cases where we would have otherwise discarded the stub's return value and returned undefined, instead we go ahead and return it. Specifically, this is any time other than when (a) we are already inside a stub or (b) we are in Node and no callback was provided. Currently we require this flag to be explicitly passed to reduce the likelihood that stub return values will be confused with server return values; we may improve this in future.
   * @param {Function} [asyncCallback] Optional callback; same semantics as in [`Meteor.call`](#meteor_call).
   */


  apply(name, args, options, callback) {
    var self = this; // We were passed 3 arguments. They may be either (name, args, options)
    // or (name, args, callback)

    if (!callback && typeof options === 'function') {
      callback = options;
      options = Object.create(null);
    }

    options = options || Object.create(null);

    if (callback) {
      // XXX would it be better form to do the binding in stream.on,
      // or caller, instead of here?
      // XXX improve error message (and how we report it)
      callback = Meteor.bindEnvironment(callback, "delivering result of invoking '" + name + "'");
    } // Keep our args safe from mutation (eg if we don't send the message for a
    // while because of a wait method).


    args = EJSON.clone(args);

    var enclosing = DDP._CurrentMethodInvocation.get();

    var alreadyInSimulation = enclosing && enclosing.isSimulation; // Lazily generate a randomSeed, only if it is requested by the stub.
    // The random streams only have utility if they're used on both the client
    // and the server; if the client doesn't generate any 'random' values
    // then we don't expect the server to generate any either.
    // Less commonly, the server may perform different actions from the client,
    // and may in fact generate values where the client did not, but we don't
    // have any client-side values to match, so even here we may as well just
    // use a random seed on the server.  In that case, we don't pass the
    // randomSeed to save bandwidth, and we don't even generate it to save a
    // bit of CPU and to avoid consuming entropy.

    var randomSeed = null;

    var randomSeedGenerator = () => {
      if (randomSeed === null) {
        randomSeed = DDPCommon.makeRpcSeed(enclosing, name);
      }

      return randomSeed;
    }; // Run the stub, if we have one. The stub is supposed to make some
    // temporary writes to the database to give the user a smooth experience
    // until the actual result of executing the method comes back from the
    // server (whereupon the temporary writes to the database will be reversed
    // during the beginUpdate/endUpdate process.)
    //
    // Normally, we ignore the return value of the stub (even if it is an
    // exception), in favor of the real return value from the server. The
    // exception is if the *caller* is a stub. In that case, we're not going
    // to do a RPC, so we use the return value of the stub as our return
    // value.


    var stub = self._methodHandlers[name];

    if (stub) {
      var setUserId = userId => {
        self.setUserId(userId);
      };

      var invocation = new DDPCommon.MethodInvocation({
        isSimulation: true,
        userId: self.userId(),
        setUserId: setUserId,

        randomSeed() {
          return randomSeedGenerator();
        }

      });
      if (!alreadyInSimulation) self._saveOriginals();

      try {
        // Note that unlike in the corresponding server code, we never audit
        // that stubs check() their arguments.
        var stubReturnValue = DDP._CurrentMethodInvocation.withValue(invocation, () => {
          if (Meteor.isServer) {
            // Because saveOriginals and retrieveOriginals aren't reentrant,
            // don't allow stubs to yield.
            return Meteor._noYieldsAllowed(() => {
              // re-clone, so that the stub can't affect our caller's values
              return stub.apply(invocation, EJSON.clone(args));
            });
          } else {
            return stub.apply(invocation, EJSON.clone(args));
          }
        });
      } catch (e) {
        var exception = e;
      }
    } // If we're in a simulation, stop and return the result we have,
    // rather than going on to do an RPC. If there was no stub,
    // we'll end up returning undefined.


    if (alreadyInSimulation) {
      if (callback) {
        callback(exception, stubReturnValue);
        return undefined;
      }

      if (exception) throw exception;
      return stubReturnValue;
    } // We only create the methodId here because we don't actually need one if
    // we're already in a simulation


    const methodId = '' + self._nextMethodId++;

    if (stub) {
      self._retrieveAndStoreOriginals(methodId);
    } // Generate the DDP message for the method call. Note that on the client,
    // it is important that the stub have finished before we send the RPC, so
    // that we know we have a complete list of which local documents the stub
    // wrote.


    var message = {
      msg: 'method',
      method: name,
      params: args,
      id: methodId
    }; // If an exception occurred in a stub, and we're ignoring it
    // because we're doing an RPC and want to use what the server
    // returns instead, log it so the developer knows
    // (unless they explicitly ask to see the error).
    //
    // Tests can set the '_expectedByTest' flag on an exception so it won't
    // go to log.

    if (exception) {
      if (options.throwStubExceptions) {
        throw exception;
      } else if (!exception._expectedByTest) {
        Meteor._debug("Exception while simulating the effect of invoking '" + name + "'", exception, exception.stack);
      }
    } // At this point we're definitely doing an RPC, and we're going to
    // return the value of the RPC to the caller.
    // If the caller didn't give a callback, decide what to do.


    if (!callback) {
      if (Meteor.isClient) {
        // On the client, we don't have fibers, so we can't block. The
        // only thing we can do is to return undefined and discard the
        // result of the RPC. If an error occurred then print the error
        // to the console.
        callback = err => {
          err && Meteor._debug("Error invoking Method '" + name + "':", err, err.stack);
        };
      } else {
        // On the server, make the function synchronous. Throw on
        // errors, return on success.
        var future = new Future();
        callback = future.resolver();
      }
    } // Send the randomSeed only if we used it


    if (randomSeed !== null) {
      message.randomSeed = randomSeed;
    }

    var methodInvoker = new MethodInvoker({
      methodId,
      callback: callback,
      connection: self,
      onResultReceived: options.onResultReceived,
      wait: !!options.wait,
      message: message,
      noRetry: !!options.noRetry
    });

    if (options.wait) {
      // It's a wait method! Wait methods go in their own block.
      self._outstandingMethodBlocks.push({
        wait: true,
        methods: [methodInvoker]
      });
    } else {
      // Not a wait method. Start a new block if the previous block was a wait
      // block, and add it to the last block of methods.
      if (isEmpty(self._outstandingMethodBlocks) || last(self._outstandingMethodBlocks).wait) {
        self._outstandingMethodBlocks.push({
          wait: false,
          methods: []
        });
      }

      last(self._outstandingMethodBlocks).methods.push(methodInvoker);
    } // If we added it to the first block, send it out now.


    if (self._outstandingMethodBlocks.length === 1) methodInvoker.sendMessage(); // If we're using the default callback on the server,
    // block waiting for the result.

    if (future) {
      return future.wait();
    }

    return options.returnStubValue ? stubReturnValue : undefined;
  } // Before calling a method stub, prepare all stores to track changes and allow
  // _retrieveAndStoreOriginals to get the original versions of changed
  // documents.


  _saveOriginals() {
    if (!this._waitingForQuiescence()) {
      this._flushBufferedWrites();
    }

    keys(this._stores).forEach(storeName => {
      this._stores[storeName].saveOriginals();
    });
  } // Retrieves the original versions of all documents modified by the stub for
  // method 'methodId' from all stores and saves them to _serverDocuments (keyed
  // by document) and _documentsWrittenByStub (keyed by method ID).


  _retrieveAndStoreOriginals(methodId) {
    var self = this;
    if (self._documentsWrittenByStub[methodId]) throw new Error('Duplicate methodId in _retrieveAndStoreOriginals');
    var docsWritten = [];
    keys(self._stores).forEach(collection => {
      var originals = self._stores[collection].retrieveOriginals(); // not all stores define retrieveOriginals


      if (!originals) return;
      originals.forEach((doc, id) => {
        docsWritten.push({
          collection,
          id
        });

        if (!hasOwn.call(self._serverDocuments, collection)) {
          self._serverDocuments[collection] = new MongoIDMap();
        }

        var serverDoc = self._serverDocuments[collection].setDefault(id, Object.create(null));

        if (serverDoc.writtenByStubs) {
          // We're not the first stub to write this doc. Just add our method ID
          // to the record.
          serverDoc.writtenByStubs[methodId] = true;
        } else {
          // First stub! Save the original value and our method ID.
          serverDoc.document = doc;
          serverDoc.flushCallbacks = [];
          serverDoc.writtenByStubs = Object.create(null);
          serverDoc.writtenByStubs[methodId] = true;
        }
      });
    });

    if (!isEmpty(docsWritten)) {
      self._documentsWrittenByStub[methodId] = docsWritten;
    }
  } // This is very much a private function we use to make the tests
  // take up fewer server resources after they complete.


  _unsubscribeAll() {
    keys(this._subscriptions).forEach(id => {
      const sub = this._subscriptions[id]; // Avoid killing the autoupdate subscription so that developers
      // still get hot code pushes when writing tests.
      //
      // XXX it's a hack to encode knowledge about autoupdate here,
      // but it doesn't seem worth it yet to have a special API for
      // subscriptions to preserve after unit tests.

      if (sub.name !== 'meteor_autoupdate_clientVersions') {
        sub.stop();
      }
    });
  } // Sends the DDP stringification of the given message object


  _send(obj) {
    this._stream.send(DDPCommon.stringifyDDP(obj));
  } // We detected via DDP-level heartbeats that we've lost the
  // connection.  Unlike `disconnect` or `close`, a lost connection
  // will be automatically retried.


  _lostConnection(error) {
    this._stream._lostConnection(error);
  }
  /**
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.status
   * @summary Get the current connection status. A reactive data source.
   * @locus Client
   */


  status(...args) {
    return this._stream.status(...args);
  }
  /**
   * @summary Force an immediate reconnection attempt if the client is not connected to the server.
   This method does nothing if the client is already connected.
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.reconnect
   * @locus Client
   */


  reconnect(...args) {
    return this._stream.reconnect(...args);
  }
  /**
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.disconnect
   * @summary Disconnect the client from the server.
   * @locus Client
   */


  disconnect(...args) {
    return this._stream.disconnect(...args);
  }

  close() {
    return this._stream.disconnect({
      _permanent: true
    });
  } ///
  /// Reactive user system
  ///


  userId() {
    if (this._userIdDeps) this._userIdDeps.depend();
    return this._userId;
  }

  setUserId(userId) {
    // Avoid invalidating dependents if setUserId is called with current value.
    if (this._userId === userId) return;
    this._userId = userId;
    if (this._userIdDeps) this._userIdDeps.changed();
  } // Returns true if we are in a state after reconnect of waiting for subs to be
  // revived or early methods to finish their data, or we are waiting for a
  // "wait" method to finish.


  _waitingForQuiescence() {
    return !isEmpty(this._subsBeingRevived) || !isEmpty(this._methodsBlockingQuiescence);
  } // Returns true if any method whose message has been sent to the server has
  // not yet invoked its user callback.


  _anyMethodsAreOutstanding() {
    const invokers = this._methodInvokers;
    return keys(invokers).some(id => {
      return invokers[id].sentMessage;
    });
  }

  _livedata_connected(msg) {
    var self = this;

    if (self._version !== 'pre1' && self._heartbeatInterval !== 0) {
      self._heartbeat = new DDPCommon.Heartbeat({
        heartbeatInterval: self._heartbeatInterval,
        heartbeatTimeout: self._heartbeatTimeout,

        onTimeout() {
          self._lostConnection(new DDP.ConnectionError('DDP heartbeat timed out'));
        },

        sendPing() {
          self._send({
            msg: 'ping'
          });
        }

      });

      self._heartbeat.start();
    } // If this is a reconnect, we'll have to reset all stores.


    if (self._lastSessionId) self._resetStores = true;

    if (typeof msg.session === 'string') {
      var reconnectedToPreviousSession = self._lastSessionId === msg.session;
      self._lastSessionId = msg.session;
    }

    if (reconnectedToPreviousSession) {
      // Successful reconnection -- pick up where we left off.  Note that right
      // now, this never happens: the server never connects us to a previous
      // session, because DDP doesn't provide enough data for the server to know
      // what messages the client has processed. We need to improve DDP to make
      // this possible, at which point we'll probably need more code here.
      return;
    } // Server doesn't have our data any more. Re-sync a new session.
    // Forget about messages we were buffering for unknown collections. They'll
    // be resent if still relevant.


    self._updatesForUnknownStores = Object.create(null);

    if (self._resetStores) {
      // Forget about the effects of stubs. We'll be resetting all collections
      // anyway.
      self._documentsWrittenByStub = Object.create(null);
      self._serverDocuments = Object.create(null);
    } // Clear _afterUpdateCallbacks.


    self._afterUpdateCallbacks = []; // Mark all named subscriptions which are ready (ie, we already called the
    // ready callback) as needing to be revived.
    // XXX We should also block reconnect quiescence until unnamed subscriptions
    //     (eg, autopublish) are done re-publishing to avoid flicker!

    self._subsBeingRevived = Object.create(null);
    keys(self._subscriptions).forEach(id => {
      if (self._subscriptions[id].ready) {
        self._subsBeingRevived[id] = true;
      }
    }); // Arrange for "half-finished" methods to have their callbacks run, and
    // track methods that were sent on this connection so that we don't
    // quiesce until they are all done.
    //
    // Start by clearing _methodsBlockingQuiescence: methods sent before
    // reconnect don't matter, and any "wait" methods sent on the new connection
    // that we drop here will be restored by the loop below.

    self._methodsBlockingQuiescence = Object.create(null);

    if (self._resetStores) {
      const invokers = self._methodInvokers;
      keys(invokers).forEach(id => {
        const invoker = invokers[id];

        if (invoker.gotResult()) {
          // This method already got its result, but it didn't call its callback
          // because its data didn't become visible. We did not resend the
          // method RPC. We'll call its callback when we get a full quiesce,
          // since that's as close as we'll get to "data must be visible".
          self._afterUpdateCallbacks.push((...args) => invoker.dataVisible(...args));
        } else if (invoker.sentMessage) {
          // This method has been sent on this connection (maybe as a resend
          // from the last connection, maybe from onReconnect, maybe just very
          // quickly before processing the connected message).
          //
          // We don't need to do anything special to ensure its callbacks get
          // called, but we'll count it as a method which is preventing
          // reconnect quiescence. (eg, it might be a login method that was run
          // from onReconnect, and we don't want to see flicker by seeing a
          // logged-out state.)
          self._methodsBlockingQuiescence[invoker.methodId] = true;
        }
      });
    }

    self._messagesBufferedUntilQuiescence = []; // If we're not waiting on any methods or subs, we can reset the stores and
    // call the callbacks immediately.

    if (!self._waitingForQuiescence()) {
      if (self._resetStores) {
        keys(self._stores).forEach(storeName => {
          const s = self._stores[storeName];
          s.beginUpdate(0, true);
          s.endUpdate();
        });
        self._resetStores = false;
      }

      self._runAfterUpdateCallbacks();
    }
  }

  _processOneDataMessage(msg, updates) {
    const messageType = msg.msg; // msg is one of ['added', 'changed', 'removed', 'ready', 'updated']

    if (messageType === 'added') {
      this._process_added(msg, updates);
    } else if (messageType === 'changed') {
      this._process_changed(msg, updates);
    } else if (messageType === 'removed') {
      this._process_removed(msg, updates);
    } else if (messageType === 'ready') {
      this._process_ready(msg, updates);
    } else if (messageType === 'updated') {
      this._process_updated(msg, updates);
    } else if (messageType === 'nosub') {// ignore this
    } else {
      Meteor._debug('discarding unknown livedata data message type', msg);
    }
  }

  _livedata_data(msg) {
    var self = this;

    if (self._waitingForQuiescence()) {
      self._messagesBufferedUntilQuiescence.push(msg);

      if (msg.msg === 'nosub') {
        delete self._subsBeingRevived[msg.id];
      }

      if (msg.subs) {
        msg.subs.forEach(subId => {
          delete self._subsBeingRevived[subId];
        });
      }

      if (msg.methods) {
        msg.methods.forEach(methodId => {
          delete self._methodsBlockingQuiescence[methodId];
        });
      }

      if (self._waitingForQuiescence()) {
        return;
      } // No methods or subs are blocking quiescence!
      // We'll now process and all of our buffered messages, reset all stores,
      // and apply them all at once.


      const bufferedMessages = self._messagesBufferedUntilQuiescence;
      keys(bufferedMessages).forEach(id => {
        self._processOneDataMessage(bufferedMessages[id], self._bufferedWrites);
      });
      self._messagesBufferedUntilQuiescence = [];
    } else {
      self._processOneDataMessage(msg, self._bufferedWrites);
    } // Immediately flush writes when:
    //  1. Buffering is disabled. Or;
    //  2. any non-(added/changed/removed) message arrives.


    var standardWrite = msg.msg === "added" || msg.msg === "changed" || msg.msg === "removed";

    if (self._bufferedWritesInterval === 0 || !standardWrite) {
      self._flushBufferedWrites();

      return;
    }

    if (self._bufferedWritesFlushAt === null) {
      self._bufferedWritesFlushAt = new Date().valueOf() + self._bufferedWritesMaxAge;
    } else if (self._bufferedWritesFlushAt < new Date().valueOf()) {
      self._flushBufferedWrites();

      return;
    }

    if (self._bufferedWritesFlushHandle) {
      clearTimeout(self._bufferedWritesFlushHandle);
    }

    self._bufferedWritesFlushHandle = setTimeout(self.__flushBufferedWrites, self._bufferedWritesInterval);
  }

  _flushBufferedWrites() {
    var self = this;

    if (self._bufferedWritesFlushHandle) {
      clearTimeout(self._bufferedWritesFlushHandle);
      self._bufferedWritesFlushHandle = null;
    }

    self._bufferedWritesFlushAt = null; // We need to clear the buffer before passing it to
    //  performWrites. As there's no guarantee that it
    //  will exit cleanly.

    var writes = self._bufferedWrites;
    self._bufferedWrites = Object.create(null);

    self._performWrites(writes);
  }

  _performWrites(updates) {
    var self = this;

    if (self._resetStores || !isEmpty(updates)) {
      // Begin a transactional update of each store.
      keys(self._stores).forEach(storeName => {
        self._stores[storeName].beginUpdate(hasOwn.call(updates, storeName) ? updates[storeName].length : 0, self._resetStores);
      });
      self._resetStores = false;
      keys(updates).forEach(storeName => {
        const updateMessages = updates[storeName];
        var store = self._stores[storeName];

        if (store) {
          updateMessages.forEach(updateMessage => {
            store.update(updateMessage);
          });
        } else {
          // Nobody's listening for this data. Queue it up until
          // someone wants it.
          // XXX memory use will grow without bound if you forget to
          // create a collection or just don't care about it... going
          // to have to do something about that.
          const updates = self._updatesForUnknownStores;

          if (!hasOwn.call(updates, storeName)) {
            updates[storeName] = [];
          }

          updates[storeName].push(...updateMessages);
        }
      }); // End update transaction.

      keys(self._stores).forEach(storeName => {
        self._stores[storeName].endUpdate();
      });
    }

    self._runAfterUpdateCallbacks();
  } // Call any callbacks deferred with _runWhenAllServerDocsAreFlushed whose
  // relevant docs have been flushed, as well as dataVisible callbacks at
  // reconnect-quiescence time.


  _runAfterUpdateCallbacks() {
    var self = this;
    var callbacks = self._afterUpdateCallbacks;
    self._afterUpdateCallbacks = [];
    callbacks.forEach(c => {
      c();
    });
  }

  _pushUpdate(updates, collection, msg) {
    if (!hasOwn.call(updates, collection)) {
      updates[collection] = [];
    }

    updates[collection].push(msg);
  }

  _getServerDoc(collection, id) {
    var self = this;

    if (!hasOwn.call(self._serverDocuments, collection)) {
      return null;
    }

    var serverDocsForCollection = self._serverDocuments[collection];
    return serverDocsForCollection.get(id) || null;
  }

  _process_added(msg, updates) {
    var self = this;
    var id = MongoID.idParse(msg.id);

    var serverDoc = self._getServerDoc(msg.collection, id);

    if (serverDoc) {
      // Some outstanding stub wrote here.
      var isExisting = serverDoc.document !== undefined;
      serverDoc.document = msg.fields || Object.create(null);
      serverDoc.document._id = id;

      if (self._resetStores) {
        // During reconnect the server is sending adds for existing ids.
        // Always push an update so that document stays in the store after
        // reset. Use current version of the document for this update, so
        // that stub-written values are preserved.
        var currentDoc = self._stores[msg.collection].getDoc(msg.id);

        if (currentDoc !== undefined) msg.fields = currentDoc;

        self._pushUpdate(updates, msg.collection, msg);
      } else if (isExisting) {
        throw new Error('Server sent add for existing id: ' + msg.id);
      }
    } else {
      self._pushUpdate(updates, msg.collection, msg);
    }
  }

  _process_changed(msg, updates) {
    var self = this;

    var serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));

    if (serverDoc) {
      if (serverDoc.document === undefined) throw new Error('Server sent changed for nonexisting id: ' + msg.id);
      DiffSequence.applyChanges(serverDoc.document, msg.fields);
    } else {
      self._pushUpdate(updates, msg.collection, msg);
    }
  }

  _process_removed(msg, updates) {
    var self = this;

    var serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));

    if (serverDoc) {
      // Some outstanding stub wrote here.
      if (serverDoc.document === undefined) throw new Error('Server sent removed for nonexisting id:' + msg.id);
      serverDoc.document = undefined;
    } else {
      self._pushUpdate(updates, msg.collection, {
        msg: 'removed',
        collection: msg.collection,
        id: msg.id
      });
    }
  }

  _process_updated(msg, updates) {
    var self = this; // Process "method done" messages.

    msg.methods.forEach(methodId => {
      const docs = self._documentsWrittenByStub[methodId];
      keys(docs).forEach(id => {
        const written = docs[id];

        const serverDoc = self._getServerDoc(written.collection, written.id);

        if (!serverDoc) {
          throw new Error('Lost serverDoc for ' + JSON.stringify(written));
        }

        if (!serverDoc.writtenByStubs[methodId]) {
          throw new Error('Doc ' + JSON.stringify(written) + ' not written by  method ' + methodId);
        }

        delete serverDoc.writtenByStubs[methodId];

        if (isEmpty(serverDoc.writtenByStubs)) {
          // All methods whose stubs wrote this method have completed! We can
          // now copy the saved document to the database (reverting the stub's
          // change if the server did not write to this object, or applying the
          // server's writes if it did).
          // This is a fake ddp 'replace' message.  It's just for talking
          // between livedata connections and minimongo.  (We have to stringify
          // the ID because it's supposed to look like a wire message.)
          self._pushUpdate(updates, written.collection, {
            msg: 'replace',
            id: MongoID.idStringify(written.id),
            replace: serverDoc.document
          }); // Call all flush callbacks.


          serverDoc.flushCallbacks.forEach(c => {
            c();
          }); // Delete this completed serverDocument. Don't bother to GC empty
          // IdMaps inside self._serverDocuments, since there probably aren't
          // many collections and they'll be written repeatedly.

          self._serverDocuments[written.collection].remove(written.id);
        }
      });
      delete self._documentsWrittenByStub[methodId]; // We want to call the data-written callback, but we can't do so until all
      // currently buffered messages are flushed.

      const callbackInvoker = self._methodInvokers[methodId];

      if (!callbackInvoker) {
        throw new Error('No callback invoker for method ' + methodId);
      }

      self._runWhenAllServerDocsAreFlushed((...args) => callbackInvoker.dataVisible(...args));
    });
  }

  _process_ready(msg, updates) {
    var self = this; // Process "sub ready" messages. "sub ready" messages don't take effect
    // until all current server documents have been flushed to the local
    // database. We can use a write fence to implement this.

    msg.subs.forEach(subId => {
      self._runWhenAllServerDocsAreFlushed(() => {
        var subRecord = self._subscriptions[subId]; // Did we already unsubscribe?

        if (!subRecord) return; // Did we already receive a ready message? (Oops!)

        if (subRecord.ready) return;
        subRecord.ready = true;
        subRecord.readyCallback && subRecord.readyCallback();
        subRecord.readyDeps.changed();
      });
    });
  } // Ensures that "f" will be called after all documents currently in
  // _serverDocuments have been written to the local cache. f will not be called
  // if the connection is lost before then!


  _runWhenAllServerDocsAreFlushed(f) {
    var self = this;

    var runFAfterUpdates = () => {
      self._afterUpdateCallbacks.push(f);
    };

    var unflushedServerDocCount = 0;

    var onServerDocFlush = () => {
      --unflushedServerDocCount;

      if (unflushedServerDocCount === 0) {
        // This was the last doc to flush! Arrange to run f after the updates
        // have been applied.
        runFAfterUpdates();
      }
    };

    keys(self._serverDocuments).forEach(collection => {
      self._serverDocuments[collection].forEach(serverDoc => {
        const writtenByStubForAMethodWithSentMessage = keys(serverDoc.writtenByStubs).some(methodId => {
          var invoker = self._methodInvokers[methodId];
          return invoker && invoker.sentMessage;
        });

        if (writtenByStubForAMethodWithSentMessage) {
          ++unflushedServerDocCount;
          serverDoc.flushCallbacks.push(onServerDocFlush);
        }
      });
    });

    if (unflushedServerDocCount === 0) {
      // There aren't any buffered docs --- we can call f as soon as the current
      // round of updates is applied!
      runFAfterUpdates();
    }
  }

  _livedata_nosub(msg) {
    var self = this; // First pass it through _livedata_data, which only uses it to help get
    // towards quiescence.

    self._livedata_data(msg); // Do the rest of our processing immediately, with no
    // buffering-until-quiescence.
    // we weren't subbed anyway, or we initiated the unsub.


    if (!hasOwn.call(self._subscriptions, msg.id)) {
      return;
    } // XXX COMPAT WITH 1.0.3.1 #errorCallback


    var errorCallback = self._subscriptions[msg.id].errorCallback;
    var stopCallback = self._subscriptions[msg.id].stopCallback;

    self._subscriptions[msg.id].remove();

    var meteorErrorFromMsg = msgArg => {
      return msgArg && msgArg.error && new Meteor.Error(msgArg.error.error, msgArg.error.reason, msgArg.error.details);
    }; // XXX COMPAT WITH 1.0.3.1 #errorCallback


    if (errorCallback && msg.error) {
      errorCallback(meteorErrorFromMsg(msg));
    }

    if (stopCallback) {
      stopCallback(meteorErrorFromMsg(msg));
    }
  }

  _livedata_result(msg) {
    // id, result or error. error has error (code), reason, details
    var self = this; // Lets make sure there are no buffered writes before returning result.

    if (!isEmpty(self._bufferedWrites)) {
      self._flushBufferedWrites();
    } // find the outstanding request
    // should be O(1) in nearly all realistic use cases


    if (isEmpty(self._outstandingMethodBlocks)) {
      Meteor._debug('Received method result but no methods outstanding');

      return;
    }

    var currentMethodBlock = self._outstandingMethodBlocks[0].methods;
    var m;

    for (var i = 0; i < currentMethodBlock.length; i++) {
      m = currentMethodBlock[i];
      if (m.methodId === msg.id) break;
    }

    if (!m) {
      Meteor._debug("Can't match method response to original method call", msg);

      return;
    } // Remove from current method block. This may leave the block empty, but we
    // don't move on to the next block until the callback has been delivered, in
    // _outstandingMethodFinished.


    currentMethodBlock.splice(i, 1);

    if (hasOwn.call(msg, 'error')) {
      m.receiveResult(new Meteor.Error(msg.error.error, msg.error.reason, msg.error.details));
    } else {
      // msg.result may be undefined if the method didn't return a
      // value
      m.receiveResult(undefined, msg.result);
    }
  } // Called by MethodInvoker after a method's callback is invoked.  If this was
  // the last outstanding method in the current block, runs the next block. If
  // there are no more methods, consider accepting a hot code push.


  _outstandingMethodFinished() {
    var self = this;
    if (self._anyMethodsAreOutstanding()) return; // No methods are outstanding. This should mean that the first block of
    // methods is empty. (Or it might not exist, if this was a method that
    // half-finished before disconnect/reconnect.)

    if (!isEmpty(self._outstandingMethodBlocks)) {
      var firstBlock = self._outstandingMethodBlocks.shift();

      if (!isEmpty(firstBlock.methods)) throw new Error('No methods outstanding but nonempty block: ' + JSON.stringify(firstBlock)); // Send the outstanding methods now in the first block.

      if (!isEmpty(self._outstandingMethodBlocks)) self._sendOutstandingMethods();
    } // Maybe accept a hot code push.


    self._maybeMigrate();
  } // Sends messages for all the methods in the first block in
  // _outstandingMethodBlocks.


  _sendOutstandingMethods() {
    var self = this;

    if (isEmpty(self._outstandingMethodBlocks)) {
      return;
    }

    self._outstandingMethodBlocks[0].methods.forEach(m => {
      m.sendMessage();
    });
  }

  _livedata_error(msg) {
    Meteor._debug('Received error from server: ', msg.reason);

    if (msg.offendingMessage) Meteor._debug('For: ', msg.offendingMessage);
  }

  _callOnReconnectAndSendAppropriateOutstandingMethods() {
    var self = this;
    var oldOutstandingMethodBlocks = self._outstandingMethodBlocks;
    self._outstandingMethodBlocks = [];
    self.onReconnect && self.onReconnect();

    DDP._reconnectHook.each(callback => {
      callback(self);
      return true;
    });

    if (isEmpty(oldOutstandingMethodBlocks)) return; // We have at least one block worth of old outstanding methods to try
    // again. First: did onReconnect actually send anything? If not, we just
    // restore all outstanding methods and run the first block.

    if (isEmpty(self._outstandingMethodBlocks)) {
      self._outstandingMethodBlocks = oldOutstandingMethodBlocks;

      self._sendOutstandingMethods();

      return;
    } // OK, there are blocks on both sides. Special case: merge the last block of
    // the reconnect methods with the first block of the original methods, if
    // neither of them are "wait" blocks.


    if (!last(self._outstandingMethodBlocks).wait && !oldOutstandingMethodBlocks[0].wait) {
      oldOutstandingMethodBlocks[0].methods.forEach(m => {
        last(self._outstandingMethodBlocks).methods.push(m); // If this "last block" is also the first block, send the message.

        if (self._outstandingMethodBlocks.length === 1) {
          m.sendMessage();
        }
      });
      oldOutstandingMethodBlocks.shift();
    } // Now add the rest of the original blocks on.


    oldOutstandingMethodBlocks.forEach(block => {
      self._outstandingMethodBlocks.push(block);
    });
  } // We can accept a hot code push if there are no methods in flight.


  _readyToMigrate() {
    return isEmpty(this._methodInvokers);
  } // If we were blocking a migration, see if it's now possible to continue.
  // Call whenever the set of outstanding/blocked methods shrinks.


  _maybeMigrate() {
    var self = this;

    if (self._retryMigrate && self._readyToMigrate()) {
      self._retryMigrate();

      self._retryMigrate = null;
    }
  }

  onMessage(raw_msg) {
    try {
      var msg = DDPCommon.parseDDP(raw_msg);
    } catch (e) {
      Meteor._debug('Exception while parsing DDP', e);

      return;
    } // Any message counts as receiving a pong, as it demonstrates that
    // the server is still alive.


    if (this._heartbeat) {
      this._heartbeat.messageReceived();
    }

    if (msg === null || !msg.msg) {
      // XXX COMPAT WITH 0.6.6. ignore the old welcome message for back
      // compat.  Remove this 'if' once the server stops sending welcome
      // messages (stream_server.js).
      if (!(msg && msg.server_id)) Meteor._debug('discarding invalid livedata message', msg);
      return;
    }

    if (msg.msg === 'connected') {
      this._version = this._versionSuggestion;

      this._livedata_connected(msg);

      this.options.onConnected();
    } else if (msg.msg === 'failed') {
      if (this._supportedDDPVersions.indexOf(msg.version) >= 0) {
        this._versionSuggestion = msg.version;

        this._stream.reconnect({
          _force: true
        });
      } else {
        var description = 'DDP version negotiation failed; server requested version ' + msg.version;

        this._stream.disconnect({
          _permanent: true,
          _error: description
        });

        this.options.onDDPVersionNegotiationFailure(description);
      }
    } else if (msg.msg === 'ping' && this.options.respondToPings) {
      this._send({
        msg: 'pong',
        id: msg.id
      });
    } else if (msg.msg === 'pong') {// noop, as we assume everything's a pong
    } else if (['added', 'changed', 'removed', 'ready', 'updated'].includes(msg.msg)) {
      this._livedata_data(msg);
    } else if (msg.msg === 'nosub') {
      this._livedata_nosub(msg);
    } else if (msg.msg === 'result') {
      this._livedata_result(msg);
    } else if (msg.msg === 'error') {
      this._livedata_error(msg);
    } else {
      Meteor._debug('discarding unknown livedata message type', msg);
    }
  }

  onReset() {
    // Send a connect message at the beginning of the stream.
    // NOTE: reset is called even on the first connection, so this is
    // the only place we send this message.
    var msg = {
      msg: 'connect'
    };
    if (this._lastSessionId) msg.session = this._lastSessionId;
    msg.version = this._versionSuggestion || this._supportedDDPVersions[0];
    this._versionSuggestion = msg.version;
    msg.support = this._supportedDDPVersions;

    this._send(msg); // Mark non-retry calls as failed. This has to be done early as getting these methods out of the
    // current block is pretty important to making sure that quiescence is properly calculated, as
    // well as possibly moving on to another useful block.
    // Only bother testing if there is an outstandingMethodBlock (there might not be, especially if
    // we are connecting for the first time.


    if (this._outstandingMethodBlocks.length > 0) {
      // If there is an outstanding method block, we only care about the first one as that is the
      // one that could have already sent messages with no response, that are not allowed to retry.
      const currentMethodBlock = this._outstandingMethodBlocks[0].methods;
      this._outstandingMethodBlocks[0].methods = currentMethodBlock.filter(methodInvoker => {
        // Methods with 'noRetry' option set are not allowed to re-send after
        // recovering dropped connection.
        if (methodInvoker.sentMessage && methodInvoker.noRetry) {
          // Make sure that the method is told that it failed.
          methodInvoker.receiveResult(new Meteor.Error('invocation-failed', 'Method invocation might have failed due to dropped connection. ' + 'Failing because `noRetry` option was passed to Meteor.apply.'));
        } // Only keep a method if it wasn't sent or it's allowed to retry.
        // This may leave the block empty, but we don't move on to the next
        // block until the callback has been delivered, in _outstandingMethodFinished.


        return !(methodInvoker.sentMessage && methodInvoker.noRetry);
      });
    } // Now, to minimize setup latency, go ahead and blast out all of
    // our pending methods ands subscriptions before we've even taken
    // the necessary RTT to know if we successfully reconnected. (1)
    // They're supposed to be idempotent, and where they are not,
    // they can block retry in apply; (2) even if we did reconnect,
    // we're not sure what messages might have gotten lost
    // (in either direction) since we were disconnected (TCP being
    // sloppy about that.)
    // If the current block of methods all got their results (but didn't all get
    // their data visible), discard the empty block now.


    if (this._outstandingMethodBlocks.length > 0 && this._outstandingMethodBlocks[0].methods.length === 0) {
      this._outstandingMethodBlocks.shift();
    } // Mark all messages as unsent, they have not yet been sent on this
    // connection.


    keys(this._methodInvokers).forEach(id => {
      this._methodInvokers[id].sentMessage = false;
    }); // If an `onReconnect` handler is set, call it first. Go through
    // some hoops to ensure that methods that are called from within
    // `onReconnect` get executed _before_ ones that were originally
    // outstanding (since `onReconnect` is used to re-establish auth
    // certificates)

    this._callOnReconnectAndSendAppropriateOutstandingMethods(); // add new subscriptions at the end. this way they take effect after
    // the handlers and we don't see flicker.


    keys(this._subscriptions).forEach(id => {
      const sub = this._subscriptions[id];

      this._send({
        msg: 'sub',
        id: id,
        name: sub.name,
        params: sub.params
      });
    });
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ddp-client/common/namespace.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  DDP: () => DDP
});
let DDPCommon;
module.watch(require("meteor/ddp-common"), {
  DDPCommon(v) {
    DDPCommon = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let keys;
module.watch(require("meteor/ddp-common/utils.js"), {
  keys(v) {
    keys = v;
  }

}, 2);
let Connection;
module.watch(require("./livedata_connection.js"), {
  Connection(v) {
    Connection = v;
  }

}, 3);
// This array allows the `_allSubscriptionsReady` method below, which
// is used by the `spiderable` package, to keep track of whether all
// data is ready.
const allConnections = [];
/**
 * @namespace DDP
 * @summary Namespace for DDP-related methods/classes.
 */

const DDP = {};
// This is private but it's used in a few places. accounts-base uses
// it to get the current user. Meteor.setTimeout and friends clear
// it. We can probably find a better way to factor this.
DDP._CurrentMethodInvocation = new Meteor.EnvironmentVariable();
DDP._CurrentPublicationInvocation = new Meteor.EnvironmentVariable(); // XXX: Keep DDP._CurrentInvocation for backwards-compatibility.

DDP._CurrentInvocation = DDP._CurrentMethodInvocation; // This is passed into a weird `makeErrorType` function that expects its thing
// to be a constructor

function connectionErrorConstructor(message) {
  this.message = message;
}

DDP.ConnectionError = Meteor.makeErrorType('DDP.ConnectionError', connectionErrorConstructor);
DDP.ForcedReconnectError = Meteor.makeErrorType('DDP.ForcedReconnectError', () => {}); // Returns the named sequence of pseudo-random values.
// The scope will be DDP._CurrentMethodInvocation.get(), so the stream will produce
// consistent values for method calls on the client and server.

DDP.randomStream = name => {
  var scope = DDP._CurrentMethodInvocation.get();

  return DDPCommon.RandomStream.get(scope, name);
}; // @param url {String} URL to Meteor app,
//     e.g.:
//     "subdomain.meteor.com",
//     "http://subdomain.meteor.com",
//     "/",
//     "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"

/**
 * @summary Connect to the server of a different Meteor application to subscribe to its document sets and invoke its remote methods.
 * @locus Anywhere
 * @param {String} url The URL of another Meteor application.
 */


DDP.connect = (url, options) => {
  var ret = new Connection(url, options);
  allConnections.push(ret); // hack. see below.

  return ret;
};

DDP._reconnectHook = new Hook({
  bindEnvironment: false
});
/**
 * @summary Register a function to call as the first step of
 * reconnecting. This function can call methods which will be executed before
 * any other outstanding methods. For example, this can be used to re-establish
 * the appropriate authentication context on the connection.
 * @locus Anywhere
 * @param {Function} callback The function to call. It will be called with a
 * single argument, the [connection object](#ddp_connect) that is reconnecting.
 */

DDP.onReconnect = callback => {
  return DDP._reconnectHook.register(callback);
}; // Hack for `spiderable` package: a way to see if the page is done
// loading all the data it needs.
//


DDP._allSubscriptionsReady = () => {
  return allConnections.every(conn => {
    return keys(conn._subscriptions).every(id => {
      return conn._subscriptions[id].ready;
    });
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ddp-client/server/server.js");

/* Exports */
Package._define("ddp-client", exports, {
  DDP: DDP
});

})();

//# sourceURL=meteor://💻app/packages/ddp-client.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGRwLWNsaWVudC9zZXJ2ZXIvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtY2xpZW50L2NvbW1vbi9NZXRob2RJbnZva2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtY2xpZW50L2NvbW1vbi9saXZlZGF0YV9jb25uZWN0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtY2xpZW50L2NvbW1vbi9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiRERQIiwidiIsImV4cG9ydHMiLCJleHBvcnQiLCJkZWZhdWx0IiwiTWV0aG9kSW52b2tlciIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsIm1ldGhvZElkIiwic2VudE1lc3NhZ2UiLCJfY2FsbGJhY2siLCJjYWxsYmFjayIsIl9jb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsIl9tZXNzYWdlIiwibWVzc2FnZSIsIl9vblJlc3VsdFJlY2VpdmVkIiwib25SZXN1bHRSZWNlaXZlZCIsIl93YWl0Iiwid2FpdCIsIm5vUmV0cnkiLCJfbWV0aG9kUmVzdWx0IiwiX2RhdGFWaXNpYmxlIiwiX21ldGhvZEludm9rZXJzIiwic2VuZE1lc3NhZ2UiLCJnb3RSZXN1bHQiLCJFcnJvciIsIl9tZXRob2RzQmxvY2tpbmdRdWllc2NlbmNlIiwiX3NlbmQiLCJfbWF5YmVJbnZva2VDYWxsYmFjayIsIl9vdXRzdGFuZGluZ01ldGhvZEZpbmlzaGVkIiwicmVjZWl2ZVJlc3VsdCIsImVyciIsInJlc3VsdCIsImRhdGFWaXNpYmxlIiwiQ29ubmVjdGlvbiIsIk1ldGVvciIsIkREUENvbW1vbiIsIlRyYWNrZXIiLCJFSlNPTiIsIlJhbmRvbSIsIkhvb2siLCJNb25nb0lEIiwiaGFzT3duIiwic2xpY2UiLCJrZXlzIiwiaXNFbXB0eSIsImxhc3QiLCJpc1NlcnZlciIsIkZpYmVyIiwiTnBtIiwiRnV0dXJlIiwiTW9uZ29JRE1hcCIsIklkTWFwIiwiaWRTdHJpbmdpZnkiLCJpZFBhcnNlIiwidXJsIiwic2VsZiIsIm9uQ29ubmVjdGVkIiwib25ERFBWZXJzaW9uTmVnb3RpYXRpb25GYWlsdXJlIiwiZGVzY3JpcHRpb24iLCJfZGVidWciLCJoZWFydGJlYXRJbnRlcnZhbCIsImhlYXJ0YmVhdFRpbWVvdXQiLCJucG1GYXllT3B0aW9ucyIsIk9iamVjdCIsImNyZWF0ZSIsInJlbG9hZFdpdGhPdXRzdGFuZGluZyIsInN1cHBvcnRlZEREUFZlcnNpb25zIiwiU1VQUE9SVEVEX0REUF9WRVJTSU9OUyIsInJldHJ5IiwicmVzcG9uZFRvUGluZ3MiLCJidWZmZXJlZFdyaXRlc0ludGVydmFsIiwiYnVmZmVyZWRXcml0ZXNNYXhBZ2UiLCJvblJlY29ubmVjdCIsIl9zdHJlYW0iLCJDbGllbnRTdHJlYW0iLCJDb25uZWN0aW9uRXJyb3IiLCJoZWFkZXJzIiwiX3NvY2tqc09wdGlvbnMiLCJfZG9udFByaW50RXJyb3JzIiwiY29ubmVjdFRpbWVvdXRNcyIsIl9sYXN0U2Vzc2lvbklkIiwiX3ZlcnNpb25TdWdnZXN0aW9uIiwiX3ZlcnNpb24iLCJfc3RvcmVzIiwiX21ldGhvZEhhbmRsZXJzIiwiX25leHRNZXRob2RJZCIsIl9zdXBwb3J0ZWRERFBWZXJzaW9ucyIsIl9oZWFydGJlYXRJbnRlcnZhbCIsIl9oZWFydGJlYXRUaW1lb3V0IiwiX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzIiwiX2RvY3VtZW50c1dyaXR0ZW5CeVN0dWIiLCJfc2VydmVyRG9jdW1lbnRzIiwiX2FmdGVyVXBkYXRlQ2FsbGJhY2tzIiwiX21lc3NhZ2VzQnVmZmVyZWRVbnRpbFF1aWVzY2VuY2UiLCJfc3Vic0JlaW5nUmV2aXZlZCIsIl9yZXNldFN0b3JlcyIsIl91cGRhdGVzRm9yVW5rbm93blN0b3JlcyIsIl9yZXRyeU1pZ3JhdGUiLCJfX2ZsdXNoQnVmZmVyZWRXcml0ZXMiLCJiaW5kRW52aXJvbm1lbnQiLCJfZmx1c2hCdWZmZXJlZFdyaXRlcyIsIl9idWZmZXJlZFdyaXRlcyIsIl9idWZmZXJlZFdyaXRlc0ZsdXNoQXQiLCJfYnVmZmVyZWRXcml0ZXNGbHVzaEhhbmRsZSIsIl9idWZmZXJlZFdyaXRlc0ludGVydmFsIiwiX2J1ZmZlcmVkV3JpdGVzTWF4QWdlIiwiX3N1YnNjcmlwdGlvbnMiLCJfdXNlcklkIiwiX3VzZXJJZERlcHMiLCJEZXBlbmRlbmN5IiwiaXNDbGllbnQiLCJQYWNrYWdlIiwicmVsb2FkIiwiUmVsb2FkIiwiX29uTWlncmF0ZSIsIl9yZWFkeVRvTWlncmF0ZSIsIm9uRGlzY29ubmVjdCIsIl9oZWFydGJlYXQiLCJzdG9wIiwib24iLCJvbk1lc3NhZ2UiLCJiaW5kIiwib25SZXNldCIsInJlZ2lzdGVyU3RvcmUiLCJuYW1lIiwid3JhcHBlZFN0b3JlIiwic3RvcmUiLCJmb3JFYWNoIiwibWV0aG9kIiwiYXJncyIsInF1ZXVlZCIsImJlZ2luVXBkYXRlIiwibGVuZ3RoIiwibXNnIiwidXBkYXRlIiwiZW5kVXBkYXRlIiwic3Vic2NyaWJlIiwicGFyYW1zIiwiY2FsbCIsImFyZ3VtZW50cyIsImNhbGxiYWNrcyIsImxhc3RQYXJhbSIsIm9uUmVhZHkiLCJwb3AiLCJvbkVycm9yIiwib25TdG9wIiwic29tZSIsImYiLCJleGlzdGluZyIsImlkIiwic3ViIiwiaW5hY3RpdmUiLCJlcXVhbHMiLCJyZWFkeSIsInJlYWR5Q2FsbGJhY2siLCJlcnJvckNhbGxiYWNrIiwic3RvcENhbGxiYWNrIiwiY2xvbmUiLCJyZWFkeURlcHMiLCJyZW1vdmUiLCJjaGFuZ2VkIiwiaGFuZGxlIiwicmVjb3JkIiwiZGVwZW5kIiwic3Vic2NyaXB0aW9uSWQiLCJhY3RpdmUiLCJvbkludmFsaWRhdGUiLCJjIiwiYWZ0ZXJGbHVzaCIsIl9zdWJzY3JpYmVBbmRXYWl0IiwicHVzaCIsImUiLCJvbkxhdGVFcnJvciIsImFwcGx5IiwiY29uY2F0IiwibWV0aG9kcyIsImZ1bmMiLCJlbmNsb3NpbmciLCJfQ3VycmVudE1ldGhvZEludm9jYXRpb24iLCJnZXQiLCJhbHJlYWR5SW5TaW11bGF0aW9uIiwiaXNTaW11bGF0aW9uIiwicmFuZG9tU2VlZCIsInJhbmRvbVNlZWRHZW5lcmF0b3IiLCJtYWtlUnBjU2VlZCIsInN0dWIiLCJzZXRVc2VySWQiLCJ1c2VySWQiLCJpbnZvY2F0aW9uIiwiTWV0aG9kSW52b2NhdGlvbiIsIl9zYXZlT3JpZ2luYWxzIiwic3R1YlJldHVyblZhbHVlIiwid2l0aFZhbHVlIiwiX25vWWllbGRzQWxsb3dlZCIsImV4Y2VwdGlvbiIsInVuZGVmaW5lZCIsIl9yZXRyaWV2ZUFuZFN0b3JlT3JpZ2luYWxzIiwidGhyb3dTdHViRXhjZXB0aW9ucyIsIl9leHBlY3RlZEJ5VGVzdCIsInN0YWNrIiwiZnV0dXJlIiwicmVzb2x2ZXIiLCJtZXRob2RJbnZva2VyIiwicmV0dXJuU3R1YlZhbHVlIiwiX3dhaXRpbmdGb3JRdWllc2NlbmNlIiwic3RvcmVOYW1lIiwic2F2ZU9yaWdpbmFscyIsImRvY3NXcml0dGVuIiwiY29sbGVjdGlvbiIsIm9yaWdpbmFscyIsInJldHJpZXZlT3JpZ2luYWxzIiwiZG9jIiwic2VydmVyRG9jIiwic2V0RGVmYXVsdCIsIndyaXR0ZW5CeVN0dWJzIiwiZG9jdW1lbnQiLCJmbHVzaENhbGxiYWNrcyIsIl91bnN1YnNjcmliZUFsbCIsIm9iaiIsInNlbmQiLCJzdHJpbmdpZnlERFAiLCJfbG9zdENvbm5lY3Rpb24iLCJlcnJvciIsInN0YXR1cyIsInJlY29ubmVjdCIsImRpc2Nvbm5lY3QiLCJjbG9zZSIsIl9wZXJtYW5lbnQiLCJfYW55TWV0aG9kc0FyZU91dHN0YW5kaW5nIiwiaW52b2tlcnMiLCJfbGl2ZWRhdGFfY29ubmVjdGVkIiwiSGVhcnRiZWF0Iiwib25UaW1lb3V0Iiwic2VuZFBpbmciLCJzdGFydCIsInNlc3Npb24iLCJyZWNvbm5lY3RlZFRvUHJldmlvdXNTZXNzaW9uIiwiaW52b2tlciIsInMiLCJfcnVuQWZ0ZXJVcGRhdGVDYWxsYmFja3MiLCJfcHJvY2Vzc09uZURhdGFNZXNzYWdlIiwidXBkYXRlcyIsIm1lc3NhZ2VUeXBlIiwiX3Byb2Nlc3NfYWRkZWQiLCJfcHJvY2Vzc19jaGFuZ2VkIiwiX3Byb2Nlc3NfcmVtb3ZlZCIsIl9wcm9jZXNzX3JlYWR5IiwiX3Byb2Nlc3NfdXBkYXRlZCIsIl9saXZlZGF0YV9kYXRhIiwic3VicyIsInN1YklkIiwiYnVmZmVyZWRNZXNzYWdlcyIsInN0YW5kYXJkV3JpdGUiLCJEYXRlIiwidmFsdWVPZiIsImNsZWFyVGltZW91dCIsInNldFRpbWVvdXQiLCJ3cml0ZXMiLCJfcGVyZm9ybVdyaXRlcyIsInVwZGF0ZU1lc3NhZ2VzIiwidXBkYXRlTWVzc2FnZSIsIl9wdXNoVXBkYXRlIiwiX2dldFNlcnZlckRvYyIsInNlcnZlckRvY3NGb3JDb2xsZWN0aW9uIiwiaXNFeGlzdGluZyIsImZpZWxkcyIsIl9pZCIsImN1cnJlbnREb2MiLCJnZXREb2MiLCJEaWZmU2VxdWVuY2UiLCJhcHBseUNoYW5nZXMiLCJkb2NzIiwid3JpdHRlbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXBsYWNlIiwiY2FsbGJhY2tJbnZva2VyIiwiX3J1bldoZW5BbGxTZXJ2ZXJEb2NzQXJlRmx1c2hlZCIsInN1YlJlY29yZCIsInJ1bkZBZnRlclVwZGF0ZXMiLCJ1bmZsdXNoZWRTZXJ2ZXJEb2NDb3VudCIsIm9uU2VydmVyRG9jRmx1c2giLCJ3cml0dGVuQnlTdHViRm9yQU1ldGhvZFdpdGhTZW50TWVzc2FnZSIsIl9saXZlZGF0YV9ub3N1YiIsIm1ldGVvckVycm9yRnJvbU1zZyIsIm1zZ0FyZyIsInJlYXNvbiIsImRldGFpbHMiLCJfbGl2ZWRhdGFfcmVzdWx0IiwiY3VycmVudE1ldGhvZEJsb2NrIiwibSIsImkiLCJzcGxpY2UiLCJmaXJzdEJsb2NrIiwic2hpZnQiLCJfc2VuZE91dHN0YW5kaW5nTWV0aG9kcyIsIl9tYXliZU1pZ3JhdGUiLCJfbGl2ZWRhdGFfZXJyb3IiLCJvZmZlbmRpbmdNZXNzYWdlIiwiX2NhbGxPblJlY29ubmVjdEFuZFNlbmRBcHByb3ByaWF0ZU91dHN0YW5kaW5nTWV0aG9kcyIsIm9sZE91dHN0YW5kaW5nTWV0aG9kQmxvY2tzIiwiX3JlY29ubmVjdEhvb2siLCJlYWNoIiwiYmxvY2siLCJyYXdfbXNnIiwicGFyc2VERFAiLCJtZXNzYWdlUmVjZWl2ZWQiLCJzZXJ2ZXJfaWQiLCJpbmRleE9mIiwidmVyc2lvbiIsIl9mb3JjZSIsIl9lcnJvciIsImluY2x1ZGVzIiwic3VwcG9ydCIsImZpbHRlciIsImFsbENvbm5lY3Rpb25zIiwiRW52aXJvbm1lbnRWYXJpYWJsZSIsIl9DdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uIiwiX0N1cnJlbnRJbnZvY2F0aW9uIiwiY29ubmVjdGlvbkVycm9yQ29uc3RydWN0b3IiLCJtYWtlRXJyb3JUeXBlIiwiRm9yY2VkUmVjb25uZWN0RXJyb3IiLCJyYW5kb21TdHJlYW0iLCJzY29wZSIsIlJhbmRvbVN0cmVhbSIsImNvbm5lY3QiLCJyZXQiLCJyZWdpc3RlciIsIl9hbGxTdWJzY3JpcHRpb25zUmVhZHkiLCJldmVyeSIsImNvbm4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHdCQUFSLENBQWIsRUFBK0M7QUFBQ0MsTUFBSUMsQ0FBSixFQUFNO0FBQUNDLFlBQVFGLEdBQVIsR0FBWUMsQ0FBWjtBQUFjOztBQUF0QixDQUEvQyxFQUF1RSxDQUF2RSxFOzs7Ozs7Ozs7OztBQ0FBSixPQUFPTSxNQUFQLENBQWM7QUFBQ0MsV0FBUSxNQUFJQztBQUFiLENBQWQ7O0FBS2UsTUFBTUEsYUFBTixDQUFvQjtBQUNqQ0MsY0FBWUMsT0FBWixFQUFxQjtBQUNuQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JELFFBQVFDLFFBQXhCO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixLQUFuQjtBQUVBLFNBQUtDLFNBQUwsR0FBaUJILFFBQVFJLFFBQXpCO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQkwsUUFBUU0sVUFBM0I7QUFDQSxTQUFL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LENBQW1CMEIsUUFBbkIsQ0FBNEI5VCxRQUE1QixDQUFQO0FBQ0QsQ0FGRCxDLENBSUE7QUFDQTtBQUNBOzs7QUFDQVgsSUFBSTBVLHNCQUFKLEdBQTZCLE1BQU07QUFDakMsU0FBT2IsZUFBZWMsS0FBZixDQUFxQkMsUUFBUTtBQUNsQyxXQUFPL1IsS0FBSytSLEtBQUtoTyxjQUFWLEVBQTBCK04sS0FBMUIsQ0FBZ0NwTCxNQUFNO0FBQzNDLGFBQU9xTCxLQUFLaE8sY0FBTCxDQUFvQjJDLEVBQXBCLEVBQXdCSSxLQUEvQjtBQUNELEtBRk0sQ0FBUDtBQUdELEdBSk0sQ0FBUDtBQUtELENBTkQsQyIsImZpbGUiOiIvcGFja2FnZXMvZGRwLWNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IEREUCB9IGZyb20gJy4uL2NvbW1vbi9uYW1lc3BhY2UuanMnO1xuIiwiLy8gQSBNZXRob2RJbnZva2VyIG1hbmFnZXMgc2VuZGluZyBhIG1ldGhvZCB0byB0aGUgc2VydmVyIGFuZCBjYWxsaW5nIHRoZSB1c2VyJ3Ncbi8vIGNhbGxiYWNrcy4gT24gY29uc3RydWN0aW9uLCBpdCByZWdpc3RlcnMgaXRzZWxmIGluIHRoZSBjb25uZWN0aW9uJ3Ncbi8vIF9tZXRob2RJbnZva2VycyBtYXA7IGl0IHJlbW92ZXMgaXRzZWxmIG9uY2UgdGhlIG1ldGhvZCBpcyBmdWxseSBmaW5pc2hlZCBhbmRcbi8vIHRoZSBjYWxsYmFjayBpcyBpbnZva2VkLiBUaGlzIG9jY3VycyB3aGVuIGl0IGhhcyBib3RoIHJlY2VpdmVkIGEgcmVzdWx0LFxuLy8gYW5kIHRoZSBkYXRhIHdyaXR0ZW4gYnkgaXQgaXMgZnVsbHkgdmlzaWJsZS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1ldGhvZEludm9rZXIge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgLy8gUHVibGljICh3aXRoaW4gdGhpcyBmaWxlKSBmaWVsZHMuXG4gICAgdGhpcy5tZXRob2RJZCA9IG9wdGlvbnMubWV0aG9kSWQ7XG4gICAgdGhpcy5zZW50TWVzc2FnZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBvcHRpb25zLmNvbm5lY3Rpb247XG4gICAgdGhpcy5fbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLl9vblJlc3VsdFJlY2VpdmVkID0gb3B0aW9ucy5vblJlc3VsdFJlY2VpdmVkIHx8ICgoKSA9PiB7fSk7XG4gICAgdGhpcy5fd2FpdCA9IG9wdGlvbnMud2FpdDtcbiAgICB0aGlzLm5vUmV0cnkgPSBvcHRpb25zLm5vUmV0cnk7XG4gICAgdGhpcy5fbWV0aG9kUmVzdWx0ID0gbnVsbDtcbiAgICB0aGlzLl9kYXRhVmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgLy8gUmVnaXN0ZXIgd2l0aCB0aGUgY29ubmVjdGlvbi5cbiAgICB0aGlzLl9jb25uZWN0aW9uLl9tZXRob2RJbnZva2Vyc1t0aGlzLm1ldGhvZElkXSA9IHRoaXM7XG4gIH1cbiAgLy8gU2VuZHMgdGhlIG1ldGhvZCBtZXNzYWdlIHRvIHRoZSBzZXJ2ZXIuIE1heSBiZSBjYWxsZWQgYWRkaXRpb25hbCB0aW1lcyBpZlxuICAvLyB3ZSBsb3NlIHRoZSBjb25uZWN0aW9uIGFuZCByZWNvbm5lY3QgYmVmb3JlIHJlY2VpdmluZyBhIHJlc3VsdC5cbiAgc2VuZE1lc3NhZ2UoKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYmVmb3JlIHNlbmRpbmcgYSBtZXRob2QgKGluY2x1ZGluZyByZXNlbmRpbmcgb25cbiAgICAvLyByZWNvbm5lY3QpLiBXZSBzaG91bGQgb25seSAocmUpc2VuZCBtZXRob2RzIHdoZXJlIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBhXG4gICAgLy8gcmVzdWx0IVxuICAgIGlmICh0aGlzLmdvdFJlc3VsdCgpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZW5kaW5nTWV0aG9kIGlzIGNhbGxlZCBvbiBtZXRob2Qgd2l0aCByZXN1bHQnKTtcblxuICAgIC8vIElmIHdlJ3JlIHJlLXNlbmRpbmcgaXQsIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIGRhdGEgd2FzIHdyaXR0ZW4gdGhlIGZpcnN0XG4gICAgLy8gdGltZS5cbiAgICB0aGlzLl9kYXRhVmlzaWJsZSA9IGZhbHNlO1xuICAgIHRoaXMuc2VudE1lc3NhZ2UgPSB0cnVlO1xuXG4gICAgLy8gSWYgdGhpcyBpcyBhIHdhaXQgbWV0aG9kLCBtYWtlIGFsbCBkYXRhIG1lc3NhZ2VzIGJlIGJ1ZmZlcmVkIHVudGlsIGl0IGlzXG4gICAgLy8gZG9uZS5cbiAgICBpZiAodGhpcy5fd2FpdClcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uX21ldGhvZHNCbG9ja2luZ1F1aWVzY2VuY2VbdGhpcy5tZXRob2RJZF0gPSB0cnVlO1xuXG4gICAgLy8gQWN0dWFsbHkgc2VuZCB0aGUgbWVzc2FnZS5cbiAgICB0aGlzLl9jb25uZWN0aW9uLl9zZW5kKHRoaXMuX21lc3NhZ2UpO1xuICB9XG4gIC8vIEludm9rZSB0aGUgY2FsbGJhY2ssIGlmIHdlIGhhdmUgYm90aCBhIHJlc3VsdCBhbmQga25vdyB0aGF0IGFsbCBkYXRhIGhhc1xuICAvLyBiZWVuIHdyaXR0ZW4gdG8gdGhlIGxvY2FsIGNhY2hlLlxuICBfbWF5YmVJbnZva2VDYWxsYmFjaygpIHtcbiAgICBpZiAodGhpcy5fbWV0aG9kUmVzdWx0ICYmIHRoaXMuX2RhdGFWaXNpYmxlKSB7XG4gICAgICAvLyBDYWxsIHRoZSBjYWxsYmFjay4gKFRoaXMgd29uJ3QgdGhyb3c6IHRoZSBjYWxsYmFjayB3YXMgd3JhcHBlZCB3aXRoXG4gICAgICAvLyBiaW5kRW52aXJvbm1lbnQuKVxuICAgICAgdGhpcy5fY2FsbGJhY2sodGhpcy5fbWV0aG9kUmVzdWx0WzBdLCB0aGlzLl9tZXRob2RSZXN1bHRbMV0pO1xuXG4gICAgICAvLyBGb3JnZXQgYWJvdXQgdGhpcyBtZXRob2QuXG4gICAgICBkZWxldGUgdGhpcy5fY29ubmVjdGlvbi5fbWV0aG9kSW52b2tlcnNbdGhpcy5tZXRob2RJZF07XG5cbiAgICAgIC8vIExldCB0aGUgY29ubmVjdGlvbiBrbm93IHRoYXQgdGhpcyBtZXRob2QgaXMgZmluaXNoZWQsIHNvIGl0IGNhbiB0cnkgdG9cbiAgICAgIC8vIG1vdmUgb24gdG8gdGhlIG5leHQgYmxvY2sgb2YgbWV0aG9kcy5cbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uX291dHN0YW5kaW5nTWV0aG9kRmluaXNoZWQoKTtcbiAgICB9XG4gIH1cbiAgLy8gQ2FsbCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG1ldGhvZCBmcm9tIHRoZSBzZXJ2ZXIuIE9ubHkgbWF5IGJlIGNhbGxlZFxuICAvLyBvbmNlOyBvbmNlIGl0IGlzIGNhbGxlZCwgeW91IHNob3VsZCBub3QgY2FsbCBzZW5kTWVzc2FnZSBhZ2Fpbi5cbiAgLy8gSWYgdGhlIHVzZXIgcHJvdmlkZWQgYW4gb25SZXN1bHRSZWNlaXZlZCBjYWxsYmFjaywgY2FsbCBpdCBpbW1lZGlhdGVseS5cbiAgLy8gVGhlbiBpbnZva2UgdGhlIG1haW4gY2FsbGJhY2sgaWYgZGF0YSBpcyBhbHNvIHZpc2libGUuXG4gIHJlY2VpdmVSZXN1bHQoZXJyLCByZXN1bHQpIHtcbiAgICBpZiAodGhpcy5nb3RSZXN1bHQoKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kcyBzaG91bGQgb25seSByZWNlaXZlIHJlc3VsdHMgb25jZScpO1xuICAgIHRoaXMuX21ldGhvZFJlc3VsdCA9IFtlcnIsIHJlc3VsdF07XG4gICAgdGhpcy5fb25SZXN1bHRSZWNlaXZlZChlcnIsIHJlc3VsdCk7XG4gICAgdGhpcy5fbWF5YmVJbnZva2VDYWxsYmFjaygpO1xuICB9XG4gIC8vIENhbGwgdGhpcyB3aGVuIGFsbCBkYXRhIHdyaXR0ZW4gYnkgdGhlIG1ldGhvZCBpcyB2aXNpYmxlLiBUaGlzIG1lYW5zIHRoYXRcbiAgLy8gdGhlIG1ldGhvZCBoYXMgcmV0dXJucyBpdHMgXCJkYXRhIGlzIGRvbmVcIiBtZXNzYWdlICpBTkQqIGFsbCBzZXJ2ZXJcbiAgLy8gZG9jdW1lbnRzIHRoYXQgYXJlIGJ1ZmZlcmVkIGF0IHRoYXQgdGltZSBoYXZlIGJlZW4gd3JpdHRlbiB0byB0aGUgbG9jYWxcbiAgLy8gY2FjaGUuIEludm9rZXMgdGhlIG1haW4gY2FsbGJhY2sgaWYgdGhlIHJlc3VsdCBoYXMgYmVlbiByZWNlaXZlZC5cbiAgZGF0YVZpc2libGUoKSB7XG4gICAgdGhpcy5fZGF0YVZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMuX21heWJlSW52b2tlQ2FsbGJhY2soKTtcbiAgfVxuICAvLyBUcnVlIGlmIHJlY2VpdmVSZXN1bHQgaGFzIGJlZW4gY2FsbGVkLlxuICBnb3RSZXN1bHQoKSB7XG4gICAgcmV0dXJuICEhdGhpcy5fbWV0aG9kUmVzdWx0O1xuICB9XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEREUENvbW1vbiB9IGZyb20gJ21ldGVvci9kZHAtY29tbW9uJztcbmltcG9ydCB7IFRyYWNrZXIgfSBmcm9tICdtZXRlb3IvdHJhY2tlcic7XG5pbXBvcnQgeyBFSlNPTiB9IGZyb20gJ21ldGVvci9lanNvbic7XG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICdtZXRlb3IvcmFuZG9tJztcbmltcG9ydCB7IEhvb2sgfSBmcm9tICdtZXRlb3IvY2FsbGJhY2staG9vayc7XG5pbXBvcnQgeyBNb25nb0lEIH0gZnJvbSAnbWV0ZW9yL21vbmdvLWlkJztcbmltcG9ydCB7IEREUCB9IGZyb20gJy4vbmFtZXNwYWNlLmpzJztcbmltcG9ydCBNZXRob2RJbnZva2VyIGZyb20gJy4vTWV0aG9kSW52b2tlci5qcyc7XG5pbXBvcnQge1xuICBoYXNPd24sXG4gIHNsaWNlLFxuICBrZXlzLFxuICBpc0VtcHR5LFxuICBsYXN0LFxufSBmcm9tIFwibWV0ZW9yL2RkcC1jb21tb24vdXRpbHMuanNcIjtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICB2YXIgRmliZXIgPSBOcG0ucmVxdWlyZSgnZmliZXJzJyk7XG4gIHZhciBGdXR1cmUgPSBOcG0ucmVxdWlyZSgnZmliZXJzL2Z1dHVyZScpO1xufVxuXG5jbGFzcyBNb25nb0lETWFwIGV4dGVuZHMgSWRNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihNb25nb0lELmlkU3RyaW5naWZ5LCBNb25nb0lELmlkUGFyc2UpO1xuICB9XG59XG5cbi8vIEBwYXJhbSB1cmwge1N0cmluZ3xPYmplY3R9IFVSTCB0byBNZXRlb3IgYXBwLFxuLy8gICBvciBhbiBvYmplY3QgYXMgYSB0ZXN0IGhvb2sgKHNlZSBjb2RlKVxuLy8gT3B0aW9uczpcbi8vICAgcmVsb2FkV2l0aE91dHN0YW5kaW5nOiBpcyBpdCBPSyB0byByZWxvYWQgaWYgdGhlcmUgYXJlIG91dHN0YW5kaW5nIG1ldGhvZHM/XG4vLyAgIGhlYWRlcnM6IGV4dHJhIGhlYWRlcnMgdG8gc2VuZCBvbiB0aGUgd2Vic29ja2V0cyBjb25uZWN0aW9uLCBmb3Jcbi8vICAgICBzZXJ2ZXItdG8tc2VydmVyIEREUCBvbmx5XG4vLyAgIF9zb2NranNPcHRpb25zOiBTcGVjaWZpZXMgb3B0aW9ucyB0byBwYXNzIHRocm91Z2ggdG8gdGhlIHNvY2tqcyBjbGllbnRcbi8vICAgb25ERFBOZWdvdGlhdGlvblZlcnNpb25GYWlsdXJlOiBjYWxsYmFjayB3aGVuIHZlcnNpb24gbmVnb3RpYXRpb24gZmFpbHMuXG4vL1xuLy8gWFhYIFRoZXJlIHNob3VsZCBiZSBhIHdheSB0byBkZXN0cm95IGEgRERQIGNvbm5lY3Rpb24sIGNhdXNpbmcgYWxsXG4vLyBvdXRzdGFuZGluZyBtZXRob2QgY2FsbHMgdG8gZmFpbC5cbi8vXG4vLyBYWFggT3VyIGN1cnJlbnQgd2F5IG9mIGhhbmRsaW5nIGZhaWx1cmUgYW5kIHJlY29ubmVjdGlvbiBpcyBncmVhdFxuLy8gZm9yIGFuIGFwcCAod2hlcmUgd2Ugd2FudCB0byB0b2xlcmF0ZSBiZWluZyBkaXNjb25uZWN0ZWQgYXMgYW5cbi8vIGV4cGVjdCBzdGF0ZSwgYW5kIGtlZXAgdHJ5aW5nIGZvcmV2ZXIgdG8gcmVjb25uZWN0KSBidXQgY3VtYmVyc29tZVxuLy8gZm9yIHNvbWV0aGluZyBsaWtlIGEgY29tbWFuZCBsaW5lIHRvb2wgdGhhdCB3YW50cyB0byBtYWtlIGFcbi8vIGNvbm5lY3Rpb24sIGNhbGwgYSBtZXRob2QsIGFuZCBwcmludCBhbiBlcnJvciBpZiBjb25uZWN0aW9uXG4vLyBmYWlscy4gV2Ugc2hvdWxkIGhhdmUgYmV0dGVyIHVzYWJpbGl0eSBpbiB0aGUgbGF0dGVyIGNhc2UgKHdoaWxlXG4vLyBzdGlsbCB0cmFuc3BhcmVudGx5IHJlY29ubmVjdGluZyBpZiBpdCdzIGp1c3QgYSB0cmFuc2llbnQgZmFpbHVyZVxuLy8gb3IgdGhlIHNlcnZlciBtaWdyYXRpbmcgdXMpLlxuZXhwb3J0IGNsYXNzIENvbm5lY3Rpb24ge1xuICBjb25zdHJ1Y3Rvcih1cmwsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0ge1xuICAgICAgb25Db25uZWN0ZWQoKSB7fSxcbiAgICAgIG9uRERQVmVyc2lvbk5lZ290aWF0aW9uRmFpbHVyZShkZXNjcmlwdGlvbikge1xuICAgICAgICBNZXRlb3IuX2RlYnVnKGRlc2NyaXB0aW9uKTtcbiAgICAgIH0sXG4gICAgICBoZWFydGJlYXRJbnRlcnZhbDogMTc1MDAsXG4gICAgICBoZWFydGJlYXRUaW1lb3V0OiAxNTAwMCxcbiAgICAgIG5wbUZheWVPcHRpb25zOiBPYmplY3QuY3JlYXRlKG51bGwpLFxuICAgICAgLy8gVGhlc2Ugb3B0aW9ucyBhcmUgb25seSBmb3IgdGVzdGluZy5cbiAgICAgIHJlbG9hZFdpdGhPdXRzdGFuZGluZzogZmFsc2UsXG4gICAgICBzdXBwb3J0ZWRERFBWZXJzaW9uczogRERQQ29tbW9uLlNVUFBPUlRFRF9ERFBfVkVSU0lPTlMsXG4gICAgICByZXRyeTogdHJ1ZSxcbiAgICAgIHJlc3BvbmRUb1BpbmdzOiB0cnVlLFxuICAgICAgLy8gV2hlbiB1cGRhdGVzIGFyZSBjb21pbmcgd2l0aGluIHRoaXMgbXMgaW50ZXJ2YWwsIGJhdGNoIHRoZW0gdG9nZXRoZXIuXG4gICAgICBidWZmZXJlZFdyaXRlc0ludGVydmFsOiA1LFxuICAgICAgLy8gRmx1c2ggYnVmZmVycyBpbW1lZGlhdGVseSBpZiB3cml0ZXMgYXJlIGhhcHBlbmluZyBjb250aW51b3VzbHkgZm9yIG1vcmUgdGhhbiB0aGlzIG1hbnkgbXMuXG4gICAgICBidWZmZXJlZFdyaXRlc01heEFnZTogNTAwLFxuXG4gICAgICAuLi5vcHRpb25zXG4gICAgfTtcblxuICAgIC8vIElmIHNldCwgY2FsbGVkIHdoZW4gd2UgcmVjb25uZWN0LCBxdWV1aW5nIG1ldGhvZCBjYWxscyBfYmVmb3JlXyB0aGVcbiAgICAvLyBleGlzdGluZyBvdXRzdGFuZGluZyBvbmVzLlxuICAgIC8vIE5PVEU6IFRoaXMgZmVhdHVyZSBoYXMgYmVlbiBwcmVzZXJ2ZWQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LiBUaGVcbiAgICAvLyBwcmVmZXJyZWQgbWV0aG9kIG9mIHNldHRpbmcgYSBjYWxsYmFjayBvbiByZWNvbm5lY3QgaXMgdG8gdXNlXG4gICAgLy8gRERQLm9uUmVjb25uZWN0LlxuICAgIHNlbGYub25SZWNvbm5lY3QgPSBudWxsO1xuXG4gICAgLy8gYXMgYSB0ZXN0IGhvb2ssIGFsbG93IHBhc3NpbmcgYSBzdHJlYW0gaW5zdGVhZCBvZiBhIHVybC5cbiAgICBpZiAodHlwZW9mIHVybCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHNlbGYuX3N0cmVhbSA9IHVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgeyBDbGllbnRTdHJlYW0gfSA9IHJlcXVpcmUoXCJtZXRlb3Ivc29ja2V0LXN0cmVhbS1jbGllbnRcIik7XG4gICAgICBzZWxmLl9zdHJlYW0gPSBuZXcgQ2xpZW50U3RyZWFtKHVybCwge1xuICAgICAgICByZXRyeTogb3B0aW9ucy5yZXRyeSxcbiAgICAgICAgQ29ubmVjdGlvbkVycm9yOiBERFAuQ29ubmVjdGlvbkVycm9yLFxuICAgICAgICBoZWFkZXJzOiBvcHRpb25zLmhlYWRlcnMsXG4gICAgICAgIF9zb2NranNPcHRpb25zOiBvcHRpb25zLl9zb2NranNPcHRpb25zLFxuICAgICAgICAvLyBVc2VkIHRvIGtlZXAgc29tZSB0ZXN0cyBxdWlldCwgb3IgZm9yIG90aGVyIGNhc2VzIGluIHdoaWNoXG4gICAgICAgIC8vIHRoZSByaWdodCB0aGluZyB0byBkbyB3aXRoIGNvbm5lY3Rpb24gZXJyb3JzIGlzIHRvIHNpbGVudGx5XG4gICAgICAgIC8vIGZhaWwgKGUuZy4gc2VuZGluZyBwYWNrYWdlIHVzYWdlIHN0YXRzKS4gQXQgc29tZSBwb2ludCB3ZVxuICAgICAgICAvLyBzaG91bGQgaGF2ZSBhIHJlYWwgQVBJIGZvciBoYW5kbGluZyBjbGllbnQtc3RyZWFtLWxldmVsXG4gICAgICAgIC8vIGVycm9ycy5cbiAgICAgICAgX2RvbnRQcmludEVycm9yczogb3B0aW9ucy5fZG9udFByaW50RXJyb3JzLFxuICAgICAgICBjb25uZWN0VGltZW91dE1zOiBvcHRpb25zLmNvbm5lY3RUaW1lb3V0TXMsXG4gICAgICAgIG5wbUZheWVPcHRpb25zOiBvcHRpb25zLm5wbUZheWVPcHRpb25zXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLl9sYXN0U2Vzc2lvbklkID0gbnVsbDtcbiAgICBzZWxmLl92ZXJzaW9uU3VnZ2VzdGlvbiA9IG51bGw7IC8vIFRoZSBsYXN0IHByb3Bvc2VkIEREUCB2ZXJzaW9uLlxuICAgIHNlbGYuX3ZlcnNpb24gPSBudWxsOyAvLyBUaGUgRERQIHZlcnNpb24gYWdyZWVkIG9uIGJ5IGNsaWVudCBhbmQgc2VydmVyLlxuICAgIHNlbGYuX3N0b3JlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7IC8vIG5hbWUgLT4gb2JqZWN0IHdpdGggbWV0aG9kc1xuICAgIHNlbGYuX21ldGhvZEhhbmRsZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTsgLy8gbmFtZSAtPiBmdW5jXG4gICAgc2VsZi5fbmV4dE1ldGhvZElkID0gMTtcbiAgICBzZWxmLl9zdXBwb3J0ZWRERFBWZXJzaW9ucyA9IG9wdGlvbnMuc3VwcG9ydGVkRERQVmVyc2lvbnM7XG5cbiAgICBzZWxmLl9oZWFydGJlYXRJbnRlcnZhbCA9IG9wdGlvbnMuaGVhcnRiZWF0SW50ZXJ2YWw7XG4gICAgc2VsZi5faGVhcnRiZWF0VGltZW91dCA9IG9wdGlvbnMuaGVhcnRiZWF0VGltZW91dDtcblxuICAgIC8vIFRyYWNrcyBtZXRob2RzIHdoaWNoIHRoZSB1c2VyIGhhcyB0cmllZCB0byBjYWxsIGJ1dCB3aGljaCBoYXZlIG5vdCB5ZXRcbiAgICAvLyBjYWxsZWQgdGhlaXIgdXNlciBjYWxsYmFjayAoaWUsIHRoZXkgYXJlIHdhaXRpbmcgb24gdGhlaXIgcmVzdWx0IG9yIGZvciBhbGxcbiAgICAvLyBvZiB0aGVpciB3cml0ZXMgdG8gYmUgd3JpdHRlbiB0byB0aGUgbG9jYWwgY2FjaGUpLiBNYXAgZnJvbSBtZXRob2QgSUQgdG9cbiAgICAvLyBNZXRob2RJbnZva2VyIG9iamVjdC5cbiAgICBzZWxmLl9tZXRob2RJbnZva2VycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAvLyBUcmFja3MgbWV0aG9kcyB3aGljaCB0aGUgdXNlciBoYXMgY2FsbGVkIGJ1dCB3aG9zZSByZXN1bHQgbWVzc2FnZXMgaGF2ZSBub3RcbiAgICAvLyBhcnJpdmVkIHlldC5cbiAgICAvL1xuICAgIC8vIF9vdXRzdGFuZGluZ01ldGhvZEJsb2NrcyBpcyBhbiBhcnJheSBvZiBibG9ja3Mgb2YgbWV0aG9kcy4gRWFjaCBibG9ja1xuICAgIC8vIHJlcHJlc2VudHMgYSBzZXQgb2YgbWV0aG9kcyB0aGF0IGNhbiBydW4gYXQgdGhlIHNhbWUgdGltZS4gVGhlIGZpcnN0IGJsb2NrXG4gICAgLy8gcmVwcmVzZW50cyB0aGUgbWV0aG9kcyB3aGljaCBhcmUgY3VycmVudGx5IGluIGZsaWdodDsgc3Vic2VxdWVudCBibG9ja3NcbiAgICAvLyBtdXN0IHdhaXQgZm9yIHByZXZpb3VzIGJsb2NrcyB0byBiZSBmdWxseSBmaW5pc2hlZCBiZWZvcmUgdGhleSBjYW4gYmUgc2VudFxuICAgIC8vIHRvIHRoZSBzZXJ2ZXIuXG4gICAgLy9cbiAgICAvLyBFYWNoIGJsb2NrIGlzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuICAgIC8vIC0gbWV0aG9kczogYSBsaXN0IG9mIE1ldGhvZEludm9rZXIgb2JqZWN0c1xuICAgIC8vIC0gd2FpdDogYSBib29sZWFuOyBpZiB0cnVlLCB0aGlzIGJsb2NrIGhhZCBhIHNpbmdsZSBtZXRob2QgaW52b2tlZCB3aXRoXG4gICAgLy8gICAgICAgICB0aGUgXCJ3YWl0XCIgb3B0aW9uXG4gICAgLy9cbiAgICAvLyBUaGVyZSB3aWxsIG5ldmVyIGJlIGFkamFjZW50IGJsb2NrcyB3aXRoIHdhaXQ9ZmFsc2UsIGJlY2F1c2UgdGhlIG9ubHkgdGhpbmdcbiAgICAvLyB0aGF0IG1ha2VzIG1ldGhvZHMgbmVlZCB0byBiZSBzZXJpYWxpemVkIGlzIGEgd2FpdCBtZXRob2QuXG4gICAgLy9cbiAgICAvLyBNZXRob2RzIGFyZSByZW1vdmVkIGZyb20gdGhlIGZpcnN0IGJsb2NrIHdoZW4gdGhlaXIgXCJyZXN1bHRcIiBpc1xuICAgIC8vIHJlY2VpdmVkLiBUaGUgZW50aXJlIGZpcnN0IGJsb2NrIGlzIG9ubHkgcmVtb3ZlZCB3aGVuIGFsbCBvZiB0aGUgaW4tZmxpZ2h0XG4gICAgLy8gbWV0aG9kcyBoYXZlIHJlY2VpdmVkIHRoZWlyIHJlc3VsdHMgKHNvIHRoZSBcIm1ldGhvZHNcIiBsaXN0IGlzIGVtcHR5KSAqQU5EKlxuICAgIC8vIGFsbCBvZiB0aGUgZGF0YSB3cml0dGVuIGJ5IHRob3NlIG1ldGhvZHMgYXJlIHZpc2libGUgaW4gdGhlIGxvY2FsIGNhY2hlLiBTb1xuICAgIC8vIGl0IGlzIHBvc3NpYmxlIGZvciB0aGUgZmlyc3QgYmxvY2sncyBtZXRob2RzIGxpc3QgdG8gYmUgZW1wdHksIGlmIHdlIGFyZVxuICAgIC8vIHN0aWxsIHdhaXRpbmcgZm9yIHNvbWUgb2JqZWN0cyB0byBxdWllc2NlLlxuICAgIC8vXG4gICAgLy8gRXhhbXBsZTpcbiAgICAvLyAgX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzID0gW1xuICAgIC8vICAgIHt3YWl0OiBmYWxzZSwgbWV0aG9kczogW119LFxuICAgIC8vICAgIHt3YWl0OiB0cnVlLCBtZXRob2RzOiBbPE1ldGhvZEludm9rZXIgZm9yICdsb2dpbic+XX0sXG4gICAgLy8gICAge3dhaXQ6IGZhbHNlLCBtZXRob2RzOiBbPE1ldGhvZEludm9rZXIgZm9yICdmb28nPixcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICA8TWV0aG9kSW52b2tlciBmb3IgJ2Jhcic+XX1dXG4gICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZXJlIHdlcmUgc29tZSBtZXRob2RzIHdoaWNoIHdlcmUgc2VudCB0byB0aGUgc2VydmVyIGFuZFxuICAgIC8vIHdoaWNoIGhhdmUgcmV0dXJuZWQgdGhlaXIgcmVzdWx0cywgYnV0IHNvbWUgb2YgdGhlIGRhdGEgd3JpdHRlbiBieVxuICAgIC8vIHRoZSBtZXRob2RzIG1heSBub3QgYmUgdmlzaWJsZSBpbiB0aGUgbG9jYWwgY2FjaGUuIE9uY2UgYWxsIHRoYXQgZGF0YSBpc1xuICAgIC8vIHZpc2libGUsIHdlIHdpbGwgc2VuZCBhICdsb2dpbicgbWV0aG9kLiBPbmNlIHRoZSBsb2dpbiBtZXRob2QgaGFzIHJldHVybmVkXG4gICAgLy8gYW5kIGFsbCB0aGUgZGF0YSBpcyB2aXNpYmxlIChpbmNsdWRpbmcgcmUtcnVubmluZyBzdWJzIGlmIHVzZXJJZCBjaGFuZ2VzKSxcbiAgICAvLyB3ZSB3aWxsIHNlbmQgdGhlICdmb28nIGFuZCAnYmFyJyBtZXRob2RzIGluIHBhcmFsbGVsLlxuICAgIHNlbGYuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzID0gW107XG5cbiAgICAvLyBtZXRob2QgSUQgLT4gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGtleXMgJ2NvbGxlY3Rpb24nIGFuZCAnaWQnLCBsaXN0aW5nXG4gICAgLy8gZG9jdW1lbnRzIHdyaXR0ZW4gYnkgYSBnaXZlbiBtZXRob2QncyBzdHViLiBrZXlzIGFyZSBhc3NvY2lhdGVkIHdpdGhcbiAgICAvLyBtZXRob2RzIHdob3NlIHN0dWIgd3JvdGUgYXQgbGVhc3Qgb25lIGRvY3VtZW50LCBhbmQgd2hvc2UgZGF0YS1kb25lIG1lc3NhZ2VcbiAgICAvLyBoYXMgbm90IHlldCBiZWVuIHJlY2VpdmVkLlxuICAgIHNlbGYuX2RvY3VtZW50c1dyaXR0ZW5CeVN0dWIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIC8vIGNvbGxlY3Rpb24gLT4gSWRNYXAgb2YgXCJzZXJ2ZXIgZG9jdW1lbnRcIiBvYmplY3QuIEEgXCJzZXJ2ZXIgZG9jdW1lbnRcIiBoYXM6XG4gICAgLy8gLSBcImRvY3VtZW50XCI6IHRoZSB2ZXJzaW9uIG9mIHRoZSBkb2N1bWVudCBhY2NvcmRpbmcgdGhlXG4gICAgLy8gICBzZXJ2ZXIgKGllLCB0aGUgc25hcHNob3QgYmVmb3JlIGEgc3R1YiB3cm90ZSBpdCwgYW1lbmRlZCBieSBhbnkgY2hhbmdlc1xuICAgIC8vICAgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyKVxuICAgIC8vICAgSXQgaXMgdW5kZWZpbmVkIGlmIHdlIHRoaW5rIHRoZSBkb2N1bWVudCBkb2VzIG5vdCBleGlzdFxuICAgIC8vIC0gXCJ3cml0dGVuQnlTdHVic1wiOiBhIHNldCBvZiBtZXRob2QgSURzIHdob3NlIHN0dWJzIHdyb3RlIHRvIHRoZSBkb2N1bWVudFxuICAgIC8vICAgd2hvc2UgXCJkYXRhIGRvbmVcIiBtZXNzYWdlcyBoYXZlIG5vdCB5ZXQgYmVlbiBwcm9jZXNzZWRcbiAgICBzZWxmLl9zZXJ2ZXJEb2N1bWVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgLy8gQXJyYXkgb2YgY2FsbGJhY2tzIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgbmV4dCB1cGRhdGUgb2YgdGhlIGxvY2FsXG4gICAgLy8gY2FjaGUuIFVzZWQgZm9yOlxuICAgIC8vICAtIENhbGxpbmcgbWV0aG9kSW52b2tlci5kYXRhVmlzaWJsZSBhbmQgc3ViIHJlYWR5IGNhbGxiYWNrcyBhZnRlclxuICAgIC8vICAgIHRoZSByZWxldmFudCBkYXRhIGlzIGZsdXNoZWQuXG4gICAgLy8gIC0gSW52b2tpbmcgdGhlIGNhbGxiYWNrcyBvZiBcImhhbGYtZmluaXNoZWRcIiBtZXRob2RzIGFmdGVyIHJlY29ubmVjdFxuICAgIC8vICAgIHF1aWVzY2VuY2UuIFNwZWNpZmljYWxseSwgbWV0aG9kcyB3aG9zZSByZXN1bHQgd2FzIHJlY2VpdmVkIG92ZXIgdGhlIG9sZFxuICAgIC8vICAgIGNvbm5lY3Rpb24gKHNvIHdlIGRvbid0IHJlLXNlbmQgaXQpIGJ1dCB3aG9zZSBkYXRhIGhhZCBub3QgYmVlbiBtYWRlXG4gICAgLy8gICAgdmlzaWJsZS5cbiAgICBzZWxmLl9hZnRlclVwZGF0ZUNhbGxiYWNrcyA9IFtdO1xuXG4gICAgLy8gSW4gdHdvIGNvbnRleHRzLCB3ZSBidWZmZXIgYWxsIGluY29taW5nIGRhdGEgbWVzc2FnZXMgYW5kIHRoZW4gcHJvY2VzcyB0aGVtXG4gICAgLy8gYWxsIGF0IG9uY2UgaW4gYSBzaW5nbGUgdXBkYXRlOlxuICAgIC8vICAgLSBEdXJpbmcgcmVjb25uZWN0LCB3ZSBidWZmZXIgYWxsIGRhdGEgbWVzc2FnZXMgdW50aWwgYWxsIHN1YnMgdGhhdCBoYWRcbiAgICAvLyAgICAgYmVlbiByZWFkeSBiZWZvcmUgcmVjb25uZWN0IGFyZSByZWFkeSBhZ2FpbiwgYW5kIGFsbCBtZXRob2RzIHRoYXQgYXJlXG4gICAgLy8gICAgIGFjdGl2ZSBoYXZlIHJldHVybmVkIHRoZWlyIFwiZGF0YSBkb25lIG1lc3NhZ2VcIjsgdGhlblxuICAgIC8vICAgLSBEdXJpbmcgdGhlIGV4ZWN1dGlvbiBvZiBhIFwid2FpdFwiIG1ldGhvZCwgd2UgYnVmZmVyIGFsbCBkYXRhIG1lc3NhZ2VzXG4gICAgLy8gICAgIHVudGlsIHRoZSB3YWl0IG1ldGhvZCBnZXRzIGl0cyBcImRhdGEgZG9uZVwiIG1lc3NhZ2UuIChJZiB0aGUgd2FpdCBtZXRob2RcbiAgICAvLyAgICAgb2NjdXJzIGR1cmluZyByZWNvbm5lY3QsIGl0IGRvZXNuJ3QgZ2V0IGFueSBzcGVjaWFsIGhhbmRsaW5nLilcbiAgICAvLyBhbGwgZGF0YSBtZXNzYWdlcyBhcmUgcHJvY2Vzc2VkIGluIG9uZSB1cGRhdGUuXG4gICAgLy9cbiAgICAvLyBUaGUgZm9sbG93aW5nIGZpZWxkcyBhcmUgdXNlZCBmb3IgdGhpcyBcInF1aWVzY2VuY2VcIiBwcm9jZXNzLlxuXG4gICAgLy8gVGhpcyBidWZmZXJzIHRoZSBtZXNzYWdlcyB0aGF0IGFyZW4ndCBiZWluZyBwcm9jZXNzZWQgeWV0LlxuICAgIHNlbGYuX21lc3NhZ2VzQnVmZmVyZWRVbnRpbFF1aWVzY2VuY2UgPSBbXTtcbiAgICAvLyBNYXAgZnJvbSBtZXRob2QgSUQgLT4gdHJ1ZS4gTWV0aG9kcyBhcmUgcmVtb3ZlZCBmcm9tIHRoaXMgd2hlbiB0aGVpclxuICAgIC8vIFwiZGF0YSBkb25lXCIgbWVzc2FnZSBpcyByZWNlaXZlZCwgYW5kIHdlIHdpbGwgbm90IHF1aWVzY2UgdW50aWwgaXQgaXNcbiAgICAvLyBlbXB0eS5cbiAgICBzZWxmLl9tZXRob2RzQmxvY2tpbmdRdWllc2NlbmNlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAvLyBtYXAgZnJvbSBzdWIgSUQgLT4gdHJ1ZSBmb3Igc3VicyB0aGF0IHdlcmUgcmVhZHkgKGllLCBjYWxsZWQgdGhlIHN1YlxuICAgIC8vIHJlYWR5IGNhbGxiYWNrKSBiZWZvcmUgcmVjb25uZWN0IGJ1dCBoYXZlbid0IGJlY29tZSByZWFkeSBhZ2FpbiB5ZXRcbiAgICBzZWxmLl9zdWJzQmVpbmdSZXZpdmVkID0gT2JqZWN0LmNyZWF0ZShudWxsKTsgLy8gbWFwIGZyb20gc3ViLl9pZCAtPiB0cnVlXG4gICAgLy8gaWYgdHJ1ZSwgdGhlIG5leHQgZGF0YSB1cGRhdGUgc2hvdWxkIHJlc2V0IGFsbCBzdG9yZXMuIChzZXQgZHVyaW5nXG4gICAgLy8gcmVjb25uZWN0LilcbiAgICBzZWxmLl9yZXNldFN0b3JlcyA9IGZhbHNlO1xuXG4gICAgLy8gbmFtZSAtPiBhcnJheSBvZiB1cGRhdGVzIGZvciAoeWV0IHRvIGJlIGNyZWF0ZWQpIGNvbGxlY3Rpb25zXG4gICAgc2VsZi5fdXBkYXRlc0ZvclVua25vd25TdG9yZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIC8vIGlmIHdlJ3JlIGJsb2NraW5nIGEgbWlncmF0aW9uLCB0aGUgcmV0cnkgZnVuY1xuICAgIHNlbGYuX3JldHJ5TWlncmF0ZSA9IG51bGw7XG5cbiAgICBzZWxmLl9fZmx1c2hCdWZmZXJlZFdyaXRlcyA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoXG4gICAgICBzZWxmLl9mbHVzaEJ1ZmZlcmVkV3JpdGVzLFxuICAgICAgJ2ZsdXNoaW5nIEREUCBidWZmZXJlZCB3cml0ZXMnLFxuICAgICAgc2VsZlxuICAgICk7XG4gICAgLy8gQ29sbGVjdGlvbiBuYW1lIC0+IGFycmF5IG9mIG1lc3NhZ2VzLlxuICAgIHNlbGYuX2J1ZmZlcmVkV3JpdGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAvLyBXaGVuIGN1cnJlbnQgYnVmZmVyIG9mIHVwZGF0ZXMgbXVzdCBiZSBmbHVzaGVkIGF0LCBpbiBtcyB0aW1lc3RhbXAuXG4gICAgc2VsZi5fYnVmZmVyZWRXcml0ZXNGbHVzaEF0ID0gbnVsbDtcbiAgICAvLyBUaW1lb3V0IGhhbmRsZSBmb3IgdGhlIG5leHQgcHJvY2Vzc2luZyBvZiBhbGwgcGVuZGluZyB3cml0ZXNcbiAgICBzZWxmLl9idWZmZXJlZFdyaXRlc0ZsdXNoSGFuZGxlID0gbnVsbDtcblxuICAgIHNlbGYuX2J1ZmZlcmVkV3JpdGVzSW50ZXJ2YWwgPSBvcHRpb25zLmJ1ZmZlcmVkV3JpdGVzSW50ZXJ2YWw7XG4gICAgc2VsZi5fYnVmZmVyZWRXcml0ZXNNYXhBZ2UgPSBvcHRpb25zLmJ1ZmZlcmVkV3JpdGVzTWF4QWdlO1xuXG4gICAgLy8gbWV0YWRhdGEgZm9yIHN1YnNjcmlwdGlvbnMuICBNYXAgZnJvbSBzdWIgSUQgdG8gb2JqZWN0IHdpdGgga2V5czpcbiAgICAvLyAgIC0gaWRcbiAgICAvLyAgIC0gbmFtZVxuICAgIC8vICAgLSBwYXJhbXNcbiAgICAvLyAgIC0gaW5hY3RpdmUgKGlmIHRydWUsIHdpbGwgYmUgY2xlYW5lZCB1cCBpZiBub3QgcmV1c2VkIGluIHJlLXJ1bilcbiAgICAvLyAgIC0gcmVhZHkgKGhhcyB0aGUgJ3JlYWR5JyBtZXNzYWdlIGJlZW4gcmVjZWl2ZWQ/KVxuICAgIC8vICAgLSByZWFkeUNhbGxiYWNrIChhbiBvcHRpb25hbCBjYWxsYmFjayB0byBjYWxsIHdoZW4gcmVhZHkpXG4gICAgLy8gICAtIGVycm9yQ2FsbGJhY2sgKGFuIG9wdGlvbmFsIGNhbGxiYWNrIHRvIGNhbGwgaWYgdGhlIHN1YiB0ZXJtaW5hdGVzIHdpdGhcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgYW4gZXJyb3IsIFhYWCBDT01QQVQgV0lUSCAxLjAuMy4xKVxuICAgIC8vICAgLSBzdG9wQ2FsbGJhY2sgKGFuIG9wdGlvbmFsIGNhbGxiYWNrIHRvIGNhbGwgd2hlbiB0aGUgc3ViIHRlcm1pbmF0ZXNcbiAgICAvLyAgICAgZm9yIGFueSByZWFzb24sIHdpdGggYW4gZXJyb3IgYXJndW1lbnQgaWYgYW4gZXJyb3IgdHJpZ2dlcmVkIHRoZSBzdG9wKVxuICAgIHNlbGYuX3N1YnNjcmlwdGlvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgLy8gUmVhY3RpdmUgdXNlcklkLlxuICAgIHNlbGYuX3VzZXJJZCA9IG51bGw7XG4gICAgc2VsZi5fdXNlcklkRGVwcyA9IG5ldyBUcmFja2VyLkRlcGVuZGVuY3koKTtcblxuICAgIC8vIEJsb2NrIGF1dG8tcmVsb2FkIHdoaWxlIHdlJ3JlIHdhaXRpbmcgZm9yIG1ldGhvZCByZXNwb25zZXMuXG4gICAgaWYgKE1ldGVvci5pc0NsaWVudCAmJlxuICAgICAgICBQYWNrYWdlLnJlbG9hZCAmJlxuICAgICAgICAhIG9wdGlvbnMucmVsb2FkV2l0aE91dHN0YW5kaW5nKSB7XG4gICAgICBQYWNrYWdlLnJlbG9hZC5SZWxvYWQuX29uTWlncmF0ZShyZXRyeSA9PiB7XG4gICAgICAgIGlmICghIHNlbGYuX3JlYWR5VG9NaWdyYXRlKCkpIHtcbiAgICAgICAgICBpZiAoc2VsZi5fcmV0cnlNaWdyYXRlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUd28gbWlncmF0aW9ucyBpbiBwcm9ncmVzcz8nKTtcbiAgICAgICAgICBzZWxmLl9yZXRyeU1pZ3JhdGUgPSByZXRyeTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFt0cnVlXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIG9uRGlzY29ubmVjdCA9ICgpID0+IHtcbiAgICAgIGlmIChzZWxmLl9oZWFydGJlYXQpIHtcbiAgICAgICAgc2VsZi5faGVhcnRiZWF0LnN0b3AoKTtcbiAgICAgICAgc2VsZi5faGVhcnRiZWF0ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgICAgc2VsZi5fc3RyZWFtLm9uKFxuICAgICAgICAnbWVzc2FnZScsXG4gICAgICAgIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoXG4gICAgICAgICAgdGhpcy5vbk1lc3NhZ2UuYmluZCh0aGlzKSxcbiAgICAgICAgICAnaGFuZGxpbmcgRERQIG1lc3NhZ2UnXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgICBzZWxmLl9zdHJlYW0ub24oXG4gICAgICAgICdyZXNldCcsXG4gICAgICAgIE1ldGVvci5iaW5kRW52aXJvbm1lbnQodGhpcy5vblJlc2V0LmJpbmQodGhpcyksICdoYW5kbGluZyBERFAgcmVzZXQnKVxuICAgICAgKTtcbiAgICAgIHNlbGYuX3N0cmVhbS5vbihcbiAgICAgICAgJ2Rpc2Nvbm5lY3QnLFxuICAgICAgICBNZXRlb3IuYmluZEVudmlyb25tZW50KG9uRGlzY29ubmVjdCwgJ2hhbmRsaW5nIEREUCBkaXNjb25uZWN0JylcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuX3N0cmVhbS5vbignbWVzc2FnZScsIHRoaXMub25NZXNzYWdlLmJpbmQodGhpcykpO1xuICAgICAgc2VsZi5fc3RyZWFtLm9uKCdyZXNldCcsIHRoaXMub25SZXNldC5iaW5kKHRoaXMpKTtcbiAgICAgIHNlbGYuX3N0cmVhbS5vbignZGlzY29ubmVjdCcsIG9uRGlzY29ubmVjdCk7XG4gICAgfVxuICB9XG5cbiAgLy8gJ25hbWUnIGlzIHRoZSBuYW1lIG9mIHRoZSBkYXRhIG9uIHRoZSB3aXJlIHRoYXQgc2hvdWxkIGdvIGluIHRoZVxuICAvLyBzdG9yZS4gJ3dyYXBwZWRTdG9yZScgc2hvdWxkIGJlIGFuIG9iamVjdCB3aXRoIG1ldGhvZHMgYmVnaW5VcGRhdGUsIHVwZGF0ZSxcbiAgLy8gZW5kVXBkYXRlLCBzYXZlT3JpZ2luYWxzLCByZXRyaWV2ZU9yaWdpbmFscy4gc2VlIENvbGxlY3Rpb24gZm9yIGFuIGV4YW1wbGUuXG4gIHJlZ2lzdGVyU3RvcmUobmFtZSwgd3JhcHBlZFN0b3JlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKG5hbWUgaW4gc2VsZi5fc3RvcmVzKSByZXR1cm4gZmFsc2U7XG5cbiAgICAvLyBXcmFwIHRoZSBpbnB1dCBvYmplY3QgaW4gYW4gb2JqZWN0IHdoaWNoIG1ha2VzIGFueSBzdG9yZSBtZXRob2Qgbm90XG4gICAgLy8gaW1wbGVtZW50ZWQgYnkgJ3N0b3JlJyBpbnRvIGEgbm8tb3AuXG4gICAgdmFyIHN0b3JlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBbICd1cGRhdGUnLFxuICAgICAgJ2JlZ2luVXBkYXRlJyxcbiAgICAgICdlbmRVcGRhdGUnLFxuICAgICAgJ3NhdmVPcmlnaW5hbHMnLFxuICAgICAgJ3JldHJpZXZlT3JpZ2luYWxzJyxcbiAgICAgICdnZXREb2MnLFxuICAgICAgJ19nZXRDb2xsZWN0aW9uJ1xuICAgIF0uZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgc3RvcmVbbWV0aG9kXSA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGlmICh3cmFwcGVkU3RvcmVbbWV0aG9kXSkge1xuICAgICAgICAgIHJldHVybiB3cmFwcGVkU3RvcmVbbWV0aG9kXSguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHNlbGYuX3N0b3Jlc1tuYW1lXSA9IHN0b3JlO1xuXG4gICAgdmFyIHF1ZXVlZCA9IHNlbGYuX3VwZGF0ZXNGb3JVbmtub3duU3RvcmVzW25hbWVdO1xuICAgIGlmIChxdWV1ZWQpIHtcbiAgICAgIHN0b3JlLmJlZ2luVXBkYXRlKHF1ZXVlZC5sZW5ndGgsIGZhbHNlKTtcbiAgICAgIHF1ZXVlZC5mb3JFYWNoKG1zZyA9PiB7XG4gICAgICAgIHN0b3JlLnVwZGF0ZShtc2cpO1xuICAgICAgfSk7XG4gICAgICBzdG9yZS5lbmRVcGRhdGUoKTtcbiAgICAgIGRlbGV0ZSBzZWxmLl91cGRhdGVzRm9yVW5rbm93blN0b3Jlc1tuYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICogQGFsaWFzIE1ldGVvci5zdWJzY3JpYmVcbiAgICogQHN1bW1hcnkgU3Vic2NyaWJlIHRvIGEgcmVjb3JkIHNldC4gIFJldHVybnMgYSBoYW5kbGUgdGhhdCBwcm92aWRlc1xuICAgKiBgc3RvcCgpYCBhbmQgYHJlYWR5KClgIG1ldGhvZHMuXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgc3Vic2NyaXB0aW9uLiAgTWF0Y2hlcyB0aGUgbmFtZSBvZiB0aGVcbiAgICogc2VydmVyJ3MgYHB1Ymxpc2goKWAgY2FsbC5cbiAgICogQHBhcmFtIHtFSlNPTmFibGV9IFthcmcxLGFyZzIuLi5dIE9wdGlvbmFsIGFyZ3VtZW50cyBwYXNzZWQgdG8gcHVibGlzaGVyXG4gICAqIGZ1bmN0aW9uIG9uIHNlcnZlci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbnxPYmplY3R9IFtjYWxsYmFja3NdIE9wdGlvbmFsLiBNYXkgaW5jbHVkZSBgb25TdG9wYFxuICAgKiBhbmQgYG9uUmVhZHlgIGNhbGxiYWNrcy4gSWYgdGhlcmUgaXMgYW4gZXJyb3IsIGl0IGlzIHBhc3NlZCBhcyBhblxuICAgKiBhcmd1bWVudCB0byBgb25TdG9wYC4gSWYgYSBmdW5jdGlvbiBpcyBwYXNzZWQgaW5zdGVhZCBvZiBhbiBvYmplY3QsIGl0XG4gICAqIGlzIGludGVycHJldGVkIGFzIGFuIGBvblJlYWR5YCBjYWxsYmFjay5cbiAgICovXG4gIHN1YnNjcmliZShuYW1lIC8qIC4uIFthcmd1bWVudHNdIC4uIChjYWxsYmFja3xjYWxsYmFja3MpICovKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHBhcmFtcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY2FsbGJhY2tzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBpZiAocGFyYW1zLmxlbmd0aCkge1xuICAgICAgdmFyIGxhc3RQYXJhbSA9IHBhcmFtc1twYXJhbXMubGVuZ3RoIC0gMV07XG4gICAgICBpZiAodHlwZW9mIGxhc3RQYXJhbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFja3Mub25SZWFkeSA9IHBhcmFtcy5wb3AoKTtcbiAgICAgIH0gZWxzZSBpZiAobGFzdFBhcmFtICYmIFtcbiAgICAgICAgbGFzdFBhcmFtLm9uUmVhZHksXG4gICAgICAgIC8vIFhYWCBDT01QQVQgV0lUSCAxLjAuMy4xIG9uRXJyb3IgdXNlZCB0byBleGlzdCwgYnV0IG5vdyB3ZSB1c2VcbiAgICAgICAgLy8gb25TdG9wIHdpdGggYW4gZXJyb3IgY2FsbGJhY2sgaW5zdGVhZC5cbiAgICAgICAgbGFzdFBhcmFtLm9uRXJyb3IsXG4gICAgICAgIGxhc3RQYXJhbS5vblN0b3BcbiAgICAgIF0uc29tZShmID0+IHR5cGVvZiBmID09PSBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgIGNhbGxiYWNrcyA9IHBhcmFtcy5wb3AoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJcyB0aGVyZSBhbiBleGlzdGluZyBzdWIgd2l0aCB0aGUgc2FtZSBuYW1lIGFuZCBwYXJhbSwgcnVuIGluIGFuXG4gICAgLy8gaW52YWxpZGF0ZWQgQ29tcHV0YXRpb24/IFRoaXMgd2lsbCBoYXBwZW4gaWYgd2UgYXJlIHJlcnVubmluZyBhblxuICAgIC8vIGV4aXN0aW5nIGNvbXB1dGF0aW9uLlxuICAgIC8vXG4gICAgLy8gRm9yIGV4YW1wbGUsIGNvbnNpZGVyIGEgcmVydW4gb2Y6XG4gICAgLy9cbiAgICAvLyAgICAgVHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgICBNZXRlb3Iuc3Vic2NyaWJlKFwiZm9vXCIsIFNlc3Npb24uZ2V0KFwiZm9vXCIpKTtcbiAgICAvLyAgICAgICBNZXRlb3Iuc3Vic2NyaWJlKFwiYmFyXCIsIFNlc3Npb24uZ2V0KFwiYmFyXCIpKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy9cbiAgICAvLyBJZiBcImZvb1wiIGhhcyBjaGFuZ2VkIGJ1dCBcImJhclwiIGhhcyBub3QsIHdlIHdpbGwgbWF0Y2ggdGhlIFwiYmFyXCJcbiAgICAvLyBzdWJjcmliZSB0byBhbiBleGlzdGluZyBpbmFjdGl2ZSBzdWJzY3JpcHRpb24gaW4gb3JkZXIgdG8gbm90XG4gICAgLy8gdW5zdWIgYW5kIHJlc3ViIHRoZSBzdWJzY3JpcHRpb24gdW5uZWNlc3NhcmlseS5cbiAgICAvL1xuICAgIC8vIFdlIG9ubHkgbG9vayBmb3Igb25lIHN1Y2ggc3ViOyBpZiB0aGVyZSBhcmUgTiBhcHBhcmVudGx5LWlkZW50aWNhbCBzdWJzXG4gICAgLy8gYmVpbmcgaW52YWxpZGF0ZWQsIHdlIHdpbGwgcmVxdWlyZSBOIG1hdGNoaW5nIHN1YnNjcmliZSBjYWxscyB0byBrZWVwXG4gICAgLy8gdGhlbSBhbGwgYWN0aXZlLlxuICAgIHZhciBleGlzdGluZztcbiAgICBrZXlzKHNlbGYuX3N1YnNjcmlwdGlvbnMpLnNvbWUoaWQgPT4ge1xuICAgICAgY29uc3Qgc3ViID0gc2VsZi5fc3Vic2NyaXB0aW9uc1tpZF07XG4gICAgICBpZiAoc3ViLmluYWN0aXZlICYmXG4gICAgICAgICAgc3ViLm5hbWUgPT09IG5hbWUgJiZcbiAgICAgICAgICBFSlNPTi5lcXVhbHMoc3ViLnBhcmFtcywgcGFyYW1zKSkge1xuICAgICAgICByZXR1cm4gZXhpc3RpbmcgPSBzdWI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgaWQ7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBpZCA9IGV4aXN0aW5nLmlkO1xuICAgICAgZXhpc3RpbmcuaW5hY3RpdmUgPSBmYWxzZTsgLy8gcmVhY3RpdmF0ZVxuXG4gICAgICBpZiAoY2FsbGJhY2tzLm9uUmVhZHkpIHtcbiAgICAgICAgLy8gSWYgdGhlIHN1YiBpcyBub3QgYWxyZWFkeSByZWFkeSwgcmVwbGFjZSBhbnkgcmVhZHkgY2FsbGJhY2sgd2l0aCB0aGVcbiAgICAgICAgLy8gb25lIHByb3ZpZGVkIG5vdy4gKEl0J3Mgbm90IHJlYWxseSBjbGVhciB3aGF0IHVzZXJzIHdvdWxkIGV4cGVjdCBmb3JcbiAgICAgICAgLy8gYW4gb25SZWFkeSBjYWxsYmFjayBpbnNpZGUgYW4gYXV0b3J1bjsgdGhlIHNlbWFudGljcyB3ZSBwcm92aWRlIGlzXG4gICAgICAgIC8vIHRoYXQgYXQgdGhlIHRpbWUgdGhlIHN1YiBmaXJzdCBiZWNvbWVzIHJlYWR5LCB3ZSBjYWxsIHRoZSBsYXN0XG4gICAgICAgIC8vIG9uUmVhZHkgY2FsbGJhY2sgcHJvdmlkZWQsIGlmIGFueS4pXG4gICAgICAgIC8vIElmIHRoZSBzdWIgaXMgYWxyZWFkeSByZWFkeSwgcnVuIHRoZSByZWFkeSBjYWxsYmFjayByaWdodCBhd2F5LlxuICAgICAgICAvLyBJdCBzZWVtcyB0aGF0IHVzZXJzIHdvdWxkIGV4cGVjdCBhbiBvblJlYWR5IGNhbGxiYWNrIGluc2lkZSBhblxuICAgICAgICAvLyBhdXRvcnVuIHRvIHRyaWdnZXIgb25jZSB0aGUgdGhlIHN1YiBmaXJzdCBiZWNvbWVzIHJlYWR5IGFuZCBhbHNvXG4gICAgICAgIC8vIHdoZW4gcmUtc3VicyBoYXBwZW5zLlxuICAgICAgICBpZiAoZXhpc3RpbmcucmVhZHkpIHtcbiAgICAgICAgICBjYWxsYmFja3Mub25SZWFkeSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4aXN0aW5nLnJlYWR5Q2FsbGJhY2sgPSBjYWxsYmFja3Mub25SZWFkeTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBYWFggQ09NUEFUIFdJVEggMS4wLjMuMSB3ZSB1c2VkIHRvIGhhdmUgb25FcnJvciBidXQgbm93IHdlIGNhbGxcbiAgICAgIC8vIG9uU3RvcCB3aXRoIGFuIG9wdGlvbmFsIGVycm9yIGFyZ3VtZW50XG4gICAgICBpZiAoY2FsbGJhY2tzLm9uRXJyb3IpIHtcbiAgICAgICAgLy8gUmVwbGFjZSBleGlzdGluZyBjYWxsYmFjayBpZiBhbnksIHNvIHRoYXQgZXJyb3JzIGFyZW4ndFxuICAgICAgICAvLyBkb3VibGUtcmVwb3J0ZWQuXG4gICAgICAgIGV4aXN0aW5nLmVycm9yQ2FsbGJhY2sgPSBjYWxsYmFja3Mub25FcnJvcjtcbiAgICAgIH1cblxuICAgICAgaWYgKGNhbGxiYWNrcy5vblN0b3ApIHtcbiAgICAgICAgZXhpc3Rpbmcuc3RvcENhbGxiYWNrID0gY2FsbGJhY2tzLm9uU3RvcDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTmV3IHN1YiEgR2VuZXJhdGUgYW4gaWQsIHNhdmUgaXQgbG9jYWxseSwgYW5kIHNlbmQgbWVzc2FnZS5cbiAgICAgIGlkID0gUmFuZG9tLmlkKCk7XG4gICAgICBzZWxmLl9zdWJzY3JpcHRpb25zW2lkXSA9IHtcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICBwYXJhbXM6IEVKU09OLmNsb25lKHBhcmFtcyksXG4gICAgICAgIGluYWN0aXZlOiBmYWxzZSxcbiAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICByZWFkeURlcHM6IG5ldyBUcmFja2VyLkRlcGVuZGVuY3koKSxcbiAgICAgICAgcmVhZHlDYWxsYmFjazogY2FsbGJhY2tzLm9uUmVhZHksXG4gICAgICAgIC8vIFhYWCBDT01QQVQgV0lUSCAxLjAuMy4xICNlcnJvckNhbGxiYWNrXG4gICAgICAgIGVycm9yQ2FsbGJhY2s6IGNhbGxiYWNrcy5vbkVycm9yLFxuICAgICAgICBzdG9wQ2FsbGJhY2s6IGNhbGxiYWNrcy5vblN0b3AsXG4gICAgICAgIGNvbm5lY3Rpb246IHNlbGYsXG4gICAgICAgIHJlbW92ZSgpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5jb25uZWN0aW9uLl9zdWJzY3JpcHRpb25zW3RoaXMuaWRdO1xuICAgICAgICAgIHRoaXMucmVhZHkgJiYgdGhpcy5yZWFkeURlcHMuY2hhbmdlZCgpO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wKCkge1xuICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5fc2VuZCh7IG1zZzogJ3Vuc3ViJywgaWQ6IGlkIH0pO1xuICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG5cbiAgICAgICAgICBpZiAoY2FsbGJhY2tzLm9uU3RvcCkge1xuICAgICAgICAgICAgY2FsbGJhY2tzLm9uU3RvcCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHNlbGYuX3NlbmQoeyBtc2c6ICdzdWInLCBpZDogaWQsIG5hbWU6IG5hbWUsIHBhcmFtczogcGFyYW1zIH0pO1xuICAgIH1cblxuICAgIC8vIHJldHVybiBhIGhhbmRsZSB0byB0aGUgYXBwbGljYXRpb24uXG4gICAgdmFyIGhhbmRsZSA9IHtcbiAgICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICghIGhhc093bi5jYWxsKHNlbGYuX3N1YnNjcmlwdGlvbnMsIGlkKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLl9zdWJzY3JpcHRpb25zW2lkXS5zdG9wKCk7XG4gICAgICB9LFxuICAgICAgcmVhZHkoKSB7XG4gICAgICAgIC8vIHJldHVybiBmYWxzZSBpZiB3ZSd2ZSB1bnN1YnNjcmliZWQuXG4gICAgICAgIGlmICghIGhhc093bi5jYWxsKHNlbGYuX3N1YnNjcmlwdGlvbnMsIGlkKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVjb3JkID0gc2VsZi5fc3Vic2NyaXB0aW9uc1tpZF07XG4gICAgICAgIHJlY29yZC5yZWFkeURlcHMuZGVwZW5kKCk7XG4gICAgICAgIHJldHVybiByZWNvcmQucmVhZHk7XG4gICAgICB9LFxuICAgICAgc3Vic2NyaXB0aW9uSWQ6IGlkXG4gICAgfTtcblxuICAgIGlmIChUcmFja2VyLmFjdGl2ZSkge1xuICAgICAgLy8gV2UncmUgaW4gYSByZWFjdGl2ZSBjb21wdXRhdGlvbiwgc28gd2UnZCBsaWtlIHRvIHVuc3Vic2NyaWJlIHdoZW4gdGhlXG4gICAgICAvLyBjb21wdXRhdGlvbiBpcyBpbnZhbGlkYXRlZC4uLiBidXQgbm90IGlmIHRoZSByZXJ1biBqdXN0IHJlLXN1YnNjcmliZXNcbiAgICAgIC8vIHRvIHRoZSBzYW1lIHN1YnNjcmlwdGlvbiEgIFdoZW4gYSByZXJ1biBoYXBwZW5zLCB3ZSB1c2Ugb25JbnZhbGlkYXRlXG4gICAgICAvLyBhcyBhIGNoYW5nZSB0byBtYXJrIHRoZSBzdWJzY3JpcHRpb24gXCJpbmFjdGl2ZVwiIHNvIHRoYXQgaXQgY2FuXG4gICAgICAvLyBiZSByZXVzZWQgZnJvbSB0aGUgcmVydW4uICBJZiBpdCBpc24ndCByZXVzZWQsIGl0J3Mga2lsbGVkIGZyb21cbiAgICAgIC8vIGFuIGFmdGVyRmx1c2guXG4gICAgICBUcmFja2VyLm9uSW52YWxpZGF0ZShjID0+IHtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHNlbGYuX3N1YnNjcmlwdGlvbnMsIGlkKSkge1xuICAgICAgICAgIHNlbGYuX3N1YnNjcmlwdGlvbnNbaWRdLmluYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIFRyYWNrZXIuYWZ0ZXJGbHVzaCgoKSA9PiB7XG4gICAgICAgICAgaWYgKGhhc093bi5jYWxsKHNlbGYuX3N1YnNjcmlwdGlvbnMsIGlkKSAmJlxuICAgICAgICAgICAgICBzZWxmLl9zdWJzY3JpcHRpb25zW2lkXS5pbmFjdGl2ZSkge1xuICAgICAgICAgICAgaGFuZGxlLnN0b3AoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhbmRsZTtcbiAgfVxuXG4gIC8vIG9wdGlvbnM6XG4gIC8vIC0gb25MYXRlRXJyb3Ige0Z1bmN0aW9uKGVycm9yKX0gY2FsbGVkIGlmIGFuIGVycm9yIHdhcyByZWNlaXZlZCBhZnRlciB0aGUgcmVhZHkgZXZlbnQuXG4gIC8vICAgICAoZXJyb3JzIHJlY2VpdmVkIGJlZm9yZSByZWFkeSBjYXVzZSBhbiBlcnJvciB0byBiZSB0aHJvd24pXG4gIF9zdWJzY3JpYmVBbmRXYWl0KG5hbWUsIGFyZ3MsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGYgPSBuZXcgRnV0dXJlKCk7XG4gICAgdmFyIHJlYWR5ID0gZmFsc2U7XG4gICAgdmFyIGhhbmRsZTtcbiAgICBhcmdzID0gYXJncyB8fCBbXTtcbiAgICBhcmdzLnB1c2goe1xuICAgICAgb25SZWFkeSgpIHtcbiAgICAgICAgcmVhZHkgPSB0cnVlO1xuICAgICAgICBmWydyZXR1cm4nXSgpO1xuICAgICAgfSxcbiAgICAgIG9uRXJyb3IoZSkge1xuICAgICAgICBpZiAoIXJlYWR5KSBmWyd0aHJvdyddKGUpO1xuICAgICAgICBlbHNlIG9wdGlvbnMgJiYgb3B0aW9ucy5vbkxhdGVFcnJvciAmJiBvcHRpb25zLm9uTGF0ZUVycm9yKGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaGFuZGxlID0gc2VsZi5zdWJzY3JpYmUuYXBwbHkoc2VsZiwgW25hbWVdLmNvbmNhdChhcmdzKSk7XG4gICAgZi53YWl0KCk7XG4gICAgcmV0dXJuIGhhbmRsZTtcbiAgfVxuXG4gIG1ldGhvZHMobWV0aG9kcykge1xuICAgIGtleXMobWV0aG9kcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGNvbnN0IGZ1bmMgPSBtZXRob2RzW25hbWVdO1xuICAgICAgaWYgKHR5cGVvZiBmdW5jICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9tZXRob2RIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIG1ldGhvZCBuYW1lZCAnXCIgKyBuYW1lICsgXCInIGlzIGFscmVhZHkgZGVmaW5lZFwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21ldGhvZEhhbmRsZXJzW25hbWVdID0gZnVuYztcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICogQGFsaWFzIE1ldGVvci5jYWxsXG4gICAqIEBzdW1tYXJ5IEludm9rZXMgYSBtZXRob2QgcGFzc2luZyBhbnkgbnVtYmVyIG9mIGFyZ3VtZW50cy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge0VKU09OYWJsZX0gW2FyZzEsYXJnMi4uLl0gT3B0aW9uYWwgbWV0aG9kIGFyZ3VtZW50c1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbYXN5bmNDYWxsYmFja10gT3B0aW9uYWwgY2FsbGJhY2ssIHdoaWNoIGlzIGNhbGxlZCBhc3luY2hyb25vdXNseSB3aXRoIHRoZSBlcnJvciBvciByZXN1bHQgYWZ0ZXIgdGhlIG1ldGhvZCBpcyBjb21wbGV0ZS4gSWYgbm90IHByb3ZpZGVkLCB0aGUgbWV0aG9kIHJ1bnMgc3luY2hyb25vdXNseSBpZiBwb3NzaWJsZSAoc2VlIGJlbG93KS5cbiAgICovXG4gIGNhbGwobmFtZSAvKiAuLiBbYXJndW1lbnRzXSAuLiBjYWxsYmFjayAqLykge1xuICAgIC8vIGlmIGl0J3MgYSBmdW5jdGlvbiwgdGhlIGxhc3QgYXJndW1lbnQgaXMgdGhlIHJlc3VsdCBjYWxsYmFjayxcbiAgICAvLyBub3QgYSBwYXJhbWV0ZXIgdG8gdGhlIHJlbW90ZSBtZXRob2QuXG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGFyZ3MubGVuZ3RoICYmIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicpXG4gICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgIHJldHVybiB0aGlzLmFwcGx5KG5hbWUsIGFyZ3MsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICogQGFsaWFzIE1ldGVvci5hcHBseVxuICAgKiBAc3VtbWFyeSBJbnZva2UgYSBtZXRob2QgcGFzc2luZyBhbiBhcnJheSBvZiBhcmd1bWVudHMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtFSlNPTmFibGVbXX0gYXJncyBNZXRob2QgYXJndW1lbnRzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLndhaXQgKENsaWVudCBvbmx5KSBJZiB0cnVlLCBkb24ndCBzZW5kIHRoaXMgbWV0aG9kIHVudGlsIGFsbCBwcmV2aW91cyBtZXRob2QgY2FsbHMgaGF2ZSBjb21wbGV0ZWQsIGFuZCBkb24ndCBzZW5kIGFueSBzdWJzZXF1ZW50IG1ldGhvZCBjYWxscyB1bnRpbCB0aGlzIG9uZSBpcyBjb21wbGV0ZWQuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMub25SZXN1bHRSZWNlaXZlZCAoQ2xpZW50IG9ubHkpIFRoaXMgY2FsbGJhY2sgaXMgaW52b2tlZCB3aXRoIHRoZSBlcnJvciBvciByZXN1bHQgb2YgdGhlIG1ldGhvZCAoanVzdCBsaWtlIGBhc3luY0NhbGxiYWNrYCkgYXMgc29vbiBhcyB0aGUgZXJyb3Igb3IgcmVzdWx0IGlzIGF2YWlsYWJsZS4gVGhlIGxvY2FsIGNhY2hlIG1heSBub3QgeWV0IHJlZmxlY3QgdGhlIHdyaXRlcyBwZXJmb3JtZWQgYnkgdGhlIG1ldGhvZC5cbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLm5vUmV0cnkgKENsaWVudCBvbmx5KSBpZiB0cnVlLCBkb24ndCBzZW5kIHRoaXMgbWV0aG9kIGFnYWluIG9uIHJlbG9hZCwgc2ltcGx5IGNhbGwgdGhlIGNhbGxiYWNrIGFuIGVycm9yIHdpdGggdGhlIGVycm9yIGNvZGUgJ2ludm9jYXRpb24tZmFpbGVkJy5cbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLnRocm93U3R1YkV4Y2VwdGlvbnMgKENsaWVudCBvbmx5KSBJZiB0cnVlLCBleGNlcHRpb25zIHRocm93biBieSBtZXRob2Qgc3R1YnMgd2lsbCBiZSB0aHJvd24gaW5zdGVhZCBvZiBsb2dnZWQsIGFuZCB0aGUgbWV0aG9kIHdpbGwgbm90IGJlIGludm9rZWQgb24gdGhlIHNlcnZlci5cbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLnJldHVyblN0dWJWYWx1ZSAoQ2xpZW50IG9ubHkpIElmIHRydWUgdGhlbiBpbiBjYXNlcyB3aGVyZSB3ZSB3b3VsZCBoYXZlIG90aGVyd2lzZSBkaXNjYXJkZWQgdGhlIHN0dWIncyByZXR1cm4gdmFsdWUgYW5kIHJldHVybmVkIHVuZGVmaW5lZCwgaW5zdGVhZCB3ZSBnbyBhaGVhZCBhbmQgcmV0dXJuIGl0LiBTcGVjaWZpY2FsbHksIHRoaXMgaXMgYW55IHRpbWUgb3RoZXIgdGhhbiB3aGVuIChhKSB3ZSBhcmUgYWxyZWFkeSBpbnNpZGUgYSBzdHViIG9yIChiKSB3ZSBhcmUgaW4gTm9kZSBhbmQgbm8gY2FsbGJhY2sgd2FzIHByb3ZpZGVkLiBDdXJyZW50bHkgd2UgcmVxdWlyZSB0aGlzIGZsYWcgdG8gYmUgZXhwbGljaXRseSBwYXNzZWQgdG8gcmVkdWNlIHRoZSBsaWtlbGlob29kIHRoYXQgc3R1YiByZXR1cm4gdmFsdWVzIHdpbGwgYmUgY29uZnVzZWQgd2l0aCBzZXJ2ZXIgcmV0dXJuIHZhbHVlczsgd2UgbWF5IGltcHJvdmUgdGhpcyBpbiBmdXR1cmUuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFthc3luY0NhbGxiYWNrXSBPcHRpb25hbCBjYWxsYmFjazsgc2FtZSBzZW1hbnRpY3MgYXMgaW4gW2BNZXRlb3IuY2FsbGBdKCNtZXRlb3JfY2FsbCkuXG4gICAqL1xuICBhcHBseShuYW1lLCBhcmdzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFdlIHdlcmUgcGFzc2VkIDMgYXJndW1lbnRzLiBUaGV5IG1heSBiZSBlaXRoZXIgKG5hbWUsIGFyZ3MsIG9wdGlvbnMpXG4gICAgLy8gb3IgKG5hbWUsIGFyZ3MsIGNhbGxiYWNrKVxuICAgIGlmICghY2FsbGJhY2sgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAvLyBYWFggd291bGQgaXQgYmUgYmV0dGVyIGZvcm0gdG8gZG8gdGhlIGJpbmRpbmcgaW4gc3RyZWFtLm9uLFxuICAgICAgLy8gb3IgY2FsbGVyLCBpbnN0ZWFkIG9mIGhlcmU/XG4gICAgICAvLyBYWFggaW1wcm92ZSBlcnJvciBtZXNzYWdlIChhbmQgaG93IHdlIHJlcG9ydCBpdClcbiAgICAgIGNhbGxiYWNrID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIFwiZGVsaXZlcmluZyByZXN1bHQgb2YgaW52b2tpbmcgJ1wiICsgbmFtZSArIFwiJ1wiXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEtlZXAgb3VyIGFyZ3Mgc2FmZSBmcm9tIG11dGF0aW9uIChlZyBpZiB3ZSBkb24ndCBzZW5kIHRoZSBtZXNzYWdlIGZvciBhXG4gICAgLy8gd2hpbGUgYmVjYXVzZSBvZiBhIHdhaXQgbWV0aG9kKS5cbiAgICBhcmdzID0gRUpTT04uY2xvbmUoYXJncyk7XG5cbiAgICB2YXIgZW5jbG9zaW5nID0gRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbi5nZXQoKTtcbiAgICB2YXIgYWxyZWFkeUluU2ltdWxhdGlvbiA9IGVuY2xvc2luZyAmJiBlbmNsb3NpbmcuaXNTaW11bGF0aW9uO1xuXG4gICAgLy8gTGF6aWx5IGdlbmVyYXRlIGEgcmFuZG9tU2VlZCwgb25seSBpZiBpdCBpcyByZXF1ZXN0ZWQgYnkgdGhlIHN0dWIuXG4gICAgLy8gVGhlIHJhbmRvbSBzdHJlYW1zIG9ubHkgaGF2ZSB1dGlsaXR5IGlmIHRoZXkncmUgdXNlZCBvbiBib3RoIHRoZSBjbGllbnRcbiAgICAvLyBhbmQgdGhlIHNlcnZlcjsgaWYgdGhlIGNsaWVudCBkb2Vzbid0IGdlbmVyYXRlIGFueSAncmFuZG9tJyB2YWx1ZXNcbiAgICAvLyB0aGVuIHdlIGRvbid0IGV4cGVjdCB0aGUgc2VydmVyIHRvIGdlbmVyYXRlIGFueSBlaXRoZXIuXG4gICAgLy8gTGVzcyBjb21tb25seSwgdGhlIHNlcnZlciBtYXkgcGVyZm9ybSBkaWZmZXJlbnQgYWN0aW9ucyBmcm9tIHRoZSBjbGllbnQsXG4gICAgLy8gYW5kIG1heSBpbiBmYWN0IGdlbmVyYXRlIHZhbHVlcyB3aGVyZSB0aGUgY2xpZW50IGRpZCBub3QsIGJ1dCB3ZSBkb24ndFxuICAgIC8vIGhhdmUgYW55IGNsaWVudC1zaWRlIHZhbHVlcyB0byBtYXRjaCwgc28gZXZlbiBoZXJlIHdlIG1heSBhcyB3ZWxsIGp1c3RcbiAgICAvLyB1c2UgYSByYW5kb20gc2VlZCBvbiB0aGUgc2VydmVyLiAgSW4gdGhhdCBjYXNlLCB3ZSBkb24ndCBwYXNzIHRoZVxuICAgIC8vIHJhbmRvbVNlZWQgdG8gc2F2ZSBiYW5kd2lkdGgsIGFuZCB3ZSBkb24ndCBldmVuIGdlbmVyYXRlIGl0IHRvIHNhdmUgYVxuICAgIC8vIGJpdCBvZiBDUFUgYW5kIHRvIGF2b2lkIGNvbnN1bWluZyBlbnRyb3B5LlxuICAgIHZhciByYW5kb21TZWVkID0gbnVsbDtcbiAgICB2YXIgcmFuZG9tU2VlZEdlbmVyYXRvciA9ICgpID0+IHtcbiAgICAgIGlmIChyYW5kb21TZWVkID09PSBudWxsKSB7XG4gICAgICAgIHJhbmRvbVNlZWQgPSBERFBDb21tb24ubWFrZVJwY1NlZWQoZW5jbG9zaW5nLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByYW5kb21TZWVkO1xuICAgIH07XG5cbiAgICAvLyBSdW4gdGhlIHN0dWIsIGlmIHdlIGhhdmUgb25lLiBUaGUgc3R1YiBpcyBzdXBwb3NlZCB0byBtYWtlIHNvbWVcbiAgICAvLyB0ZW1wb3Jhcnkgd3JpdGVzIHRvIHRoZSBkYXRhYmFzZSB0byBnaXZlIHRoZSB1c2VyIGEgc21vb3RoIGV4cGVyaWVuY2VcbiAgICAvLyB1bnRpbCB0aGUgYWN0dWFsIHJlc3VsdCBvZiBleGVjdXRpbmcgdGhlIG1ldGhvZCBjb21lcyBiYWNrIGZyb20gdGhlXG4gICAgLy8gc2VydmVyICh3aGVyZXVwb24gdGhlIHRlbXBvcmFyeSB3cml0ZXMgdG8gdGhlIGRhdGFiYXNlIHdpbGwgYmUgcmV2ZXJzZWRcbiAgICAvLyBkdXJpbmcgdGhlIGJlZ2luVXBkYXRlL2VuZFVwZGF0ZSBwcm9jZXNzLilcbiAgICAvL1xuICAgIC8vIE5vcm1hbGx5LCB3ZSBpZ25vcmUgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgc3R1YiAoZXZlbiBpZiBpdCBpcyBhblxuICAgIC8vIGV4Y2VwdGlvbiksIGluIGZhdm9yIG9mIHRoZSByZWFsIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBzZXJ2ZXIuIFRoZVxuICAgIC8vIGV4Y2VwdGlvbiBpcyBpZiB0aGUgKmNhbGxlciogaXMgYSBzdHViLiBJbiB0aGF0IGNhc2UsIHdlJ3JlIG5vdCBnb2luZ1xuICAgIC8vIHRvIGRvIGEgUlBDLCBzbyB3ZSB1c2UgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgc3R1YiBhcyBvdXIgcmV0dXJuXG4gICAgLy8gdmFsdWUuXG5cbiAgICB2YXIgc3R1YiA9IHNlbGYuX21ldGhvZEhhbmRsZXJzW25hbWVdO1xuICAgIGlmIChzdHViKSB7XG4gICAgICB2YXIgc2V0VXNlcklkID0gdXNlcklkID0+IHtcbiAgICAgICAgc2VsZi5zZXRVc2VySWQodXNlcklkKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBpbnZvY2F0aW9uID0gbmV3IEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uKHtcbiAgICAgICAgaXNTaW11bGF0aW9uOiB0cnVlLFxuICAgICAgICB1c2VySWQ6IHNlbGYudXNlcklkKCksXG4gICAgICAgIHNldFVzZXJJZDogc2V0VXNlcklkLFxuICAgICAgICByYW5kb21TZWVkKCkge1xuICAgICAgICAgIHJldHVybiByYW5kb21TZWVkR2VuZXJhdG9yKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIWFscmVhZHlJblNpbXVsYXRpb24pIHNlbGYuX3NhdmVPcmlnaW5hbHMoKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHVubGlrZSBpbiB0aGUgY29ycmVzcG9uZGluZyBzZXJ2ZXIgY29kZSwgd2UgbmV2ZXIgYXVkaXRcbiAgICAgICAgLy8gdGhhdCBzdHVicyBjaGVjaygpIHRoZWlyIGFyZ3VtZW50cy5cbiAgICAgICAgdmFyIHN0dWJSZXR1cm5WYWx1ZSA9IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24ud2l0aFZhbHVlKFxuICAgICAgICAgIGludm9jYXRpb24sXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgICAgICAgICAgICAvLyBCZWNhdXNlIHNhdmVPcmlnaW5hbHMgYW5kIHJldHJpZXZlT3JpZ2luYWxzIGFyZW4ndCByZWVudHJhbnQsXG4gICAgICAgICAgICAgIC8vIGRvbid0IGFsbG93IHN0dWJzIHRvIHlpZWxkLlxuICAgICAgICAgICAgICByZXR1cm4gTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIHJlLWNsb25lLCBzbyB0aGF0IHRoZSBzdHViIGNhbid0IGFmZmVjdCBvdXIgY2FsbGVyJ3MgdmFsdWVzXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0dWIuYXBwbHkoaW52b2NhdGlvbiwgRUpTT04uY2xvbmUoYXJncykpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHViLmFwcGx5KGludm9jYXRpb24sIEVKU09OLmNsb25lKGFyZ3MpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBleGNlcHRpb24gPSBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3JlIGluIGEgc2ltdWxhdGlvbiwgc3RvcCBhbmQgcmV0dXJuIHRoZSByZXN1bHQgd2UgaGF2ZSxcbiAgICAvLyByYXRoZXIgdGhhbiBnb2luZyBvbiB0byBkbyBhbiBSUEMuIElmIHRoZXJlIHdhcyBubyBzdHViLFxuICAgIC8vIHdlJ2xsIGVuZCB1cCByZXR1cm5pbmcgdW5kZWZpbmVkLlxuICAgIGlmIChhbHJlYWR5SW5TaW11bGF0aW9uKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soZXhjZXB0aW9uLCBzdHViUmV0dXJuVmFsdWUpO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgaWYgKGV4Y2VwdGlvbikgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgcmV0dXJuIHN0dWJSZXR1cm5WYWx1ZTtcbiAgICB9XG5cbiAgICAvLyBXZSBvbmx5IGNyZWF0ZSB0aGUgbWV0aG9kSWQgaGVyZSBiZWNhdXNlIHdlIGRvbid0IGFjdHVhbGx5IG5lZWQgb25lIGlmXG4gICAgLy8gd2UncmUgYWxyZWFkeSBpbiBhIHNpbXVsYXRpb25cbiAgICBjb25zdCBtZXRob2RJZCA9ICcnICsgc2VsZi5fbmV4dE1ldGhvZElkKys7XG4gICAgaWYgKHN0dWIpIHtcbiAgICAgIHNlbGYuX3JldHJpZXZlQW5kU3RvcmVPcmlnaW5hbHMobWV0aG9kSWQpO1xuICAgIH1cblxuICAgIC8vIEdlbmVyYXRlIHRoZSBERFAgbWVzc2FnZSBmb3IgdGhlIG1ldGhvZCBjYWxsLiBOb3RlIHRoYXQgb24gdGhlIGNsaWVudCxcbiAgICAvLyBpdCBpcyBpbXBvcnRhbnQgdGhhdCB0aGUgc3R1YiBoYXZlIGZpbmlzaGVkIGJlZm9yZSB3ZSBzZW5kIHRoZSBSUEMsIHNvXG4gICAgLy8gdGhhdCB3ZSBrbm93IHdlIGhhdmUgYSBjb21wbGV0ZSBsaXN0IG9mIHdoaWNoIGxvY2FsIGRvY3VtZW50cyB0aGUgc3R1YlxuICAgIC8vIHdyb3RlLlxuICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgbXNnOiAnbWV0aG9kJyxcbiAgICAgIG1ldGhvZDogbmFtZSxcbiAgICAgIHBhcmFtczogYXJncyxcbiAgICAgIGlkOiBtZXRob2RJZFxuICAgIH07XG5cbiAgICAvLyBJZiBhbiBleGNlcHRpb24gb2NjdXJyZWQgaW4gYSBzdHViLCBhbmQgd2UncmUgaWdub3JpbmcgaXRcbiAgICAvLyBiZWNhdXNlIHdlJ3JlIGRvaW5nIGFuIFJQQyBhbmQgd2FudCB0byB1c2Ugd2hhdCB0aGUgc2VydmVyXG4gICAgLy8gcmV0dXJucyBpbnN0ZWFkLCBsb2cgaXQgc28gdGhlIGRldmVsb3BlciBrbm93c1xuICAgIC8vICh1bmxlc3MgdGhleSBleHBsaWNpdGx5IGFzayB0byBzZWUgdGhlIGVycm9yKS5cbiAgICAvL1xuICAgIC8vIFRlc3RzIGNhbiBzZXQgdGhlICdfZXhwZWN0ZWRCeVRlc3QnIGZsYWcgb24gYW4gZXhjZXB0aW9uIHNvIGl0IHdvbid0XG4gICAgLy8gZ28gdG8gbG9nLlxuICAgIGlmIChleGNlcHRpb24pIHtcbiAgICAgIGlmIChvcHRpb25zLnRocm93U3R1YkV4Y2VwdGlvbnMpIHtcbiAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgfSBlbHNlIGlmICghZXhjZXB0aW9uLl9leHBlY3RlZEJ5VGVzdCkge1xuICAgICAgICBNZXRlb3IuX2RlYnVnKFxuICAgICAgICAgIFwiRXhjZXB0aW9uIHdoaWxlIHNpbXVsYXRpbmcgdGhlIGVmZmVjdCBvZiBpbnZva2luZyAnXCIgKyBuYW1lICsgXCInXCIsXG4gICAgICAgICAgZXhjZXB0aW9uLFxuICAgICAgICAgIGV4Y2VwdGlvbi5zdGFja1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEF0IHRoaXMgcG9pbnQgd2UncmUgZGVmaW5pdGVseSBkb2luZyBhbiBSUEMsIGFuZCB3ZSdyZSBnb2luZyB0b1xuICAgIC8vIHJldHVybiB0aGUgdmFsdWUgb2YgdGhlIFJQQyB0byB0aGUgY2FsbGVyLlxuXG4gICAgLy8gSWYgdGhlIGNhbGxlciBkaWRuJ3QgZ2l2ZSBhIGNhbGxiYWNrLCBkZWNpZGUgd2hhdCB0byBkby5cbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICAgIC8vIE9uIHRoZSBjbGllbnQsIHdlIGRvbid0IGhhdmUgZmliZXJzLCBzbyB3ZSBjYW4ndCBibG9jay4gVGhlXG4gICAgICAgIC8vIG9ubHkgdGhpbmcgd2UgY2FuIGRvIGlzIHRvIHJldHVybiB1bmRlZmluZWQgYW5kIGRpc2NhcmQgdGhlXG4gICAgICAgIC8vIHJlc3VsdCBvZiB0aGUgUlBDLiBJZiBhbiBlcnJvciBvY2N1cnJlZCB0aGVuIHByaW50IHRoZSBlcnJvclxuICAgICAgICAvLyB0byB0aGUgY29uc29sZS5cbiAgICAgICAgY2FsbGJhY2sgPSBlcnIgPT4ge1xuICAgICAgICAgIGVyciAmJlxuICAgICAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcbiAgICAgICAgICAgICAgXCJFcnJvciBpbnZva2luZyBNZXRob2QgJ1wiICsgbmFtZSArIFwiJzpcIixcbiAgICAgICAgICAgICAgZXJyLFxuICAgICAgICAgICAgICBlcnIuc3RhY2tcbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPbiB0aGUgc2VydmVyLCBtYWtlIHRoZSBmdW5jdGlvbiBzeW5jaHJvbm91cy4gVGhyb3cgb25cbiAgICAgICAgLy8gZXJyb3JzLCByZXR1cm4gb24gc3VjY2Vzcy5cbiAgICAgICAgdmFyIGZ1dHVyZSA9IG5ldyBGdXR1cmUoKTtcbiAgICAgICAgY2FsbGJhY2sgPSBmdXR1cmUucmVzb2x2ZXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZW5kIHRoZSByYW5kb21TZWVkIG9ubHkgaWYgd2UgdXNlZCBpdFxuICAgIGlmIChyYW5kb21TZWVkICE9PSBudWxsKSB7XG4gICAgICBtZXNzYWdlLnJhbmRvbVNlZWQgPSByYW5kb21TZWVkO1xuICAgIH1cblxuICAgIHZhciBtZXRob2RJbnZva2VyID0gbmV3IE1ldGhvZEludm9rZXIoe1xuICAgICAgbWV0aG9kSWQsXG4gICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICBjb25uZWN0aW9uOiBzZWxmLFxuICAgICAgb25SZXN1bHRSZWNlaXZlZDogb3B0aW9ucy5vblJlc3VsdFJlY2VpdmVkLFxuICAgICAgd2FpdDogISFvcHRpb25zLndhaXQsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgbm9SZXRyeTogISFvcHRpb25zLm5vUmV0cnlcbiAgICB9KTtcblxuICAgIGlmIChvcHRpb25zLndhaXQpIHtcbiAgICAgIC8vIEl0J3MgYSB3YWl0IG1ldGhvZCEgV2FpdCBtZXRob2RzIGdvIGluIHRoZWlyIG93biBibG9jay5cbiAgICAgIHNlbGYuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzLnB1c2goe1xuICAgICAgICB3YWl0OiB0cnVlLFxuICAgICAgICBtZXRob2RzOiBbbWV0aG9kSW52b2tlcl1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgYSB3YWl0IG1ldGhvZC4gU3RhcnQgYSBuZXcgYmxvY2sgaWYgdGhlIHByZXZpb3VzIGJsb2NrIHdhcyBhIHdhaXRcbiAgICAgIC8vIGJsb2NrLCBhbmQgYWRkIGl0IHRvIHRoZSBsYXN0IGJsb2NrIG9mIG1ldGhvZHMuXG4gICAgICBpZiAoaXNFbXB0eShzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2NrcykgfHxcbiAgICAgICAgICBsYXN0KHNlbGYuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzKS53YWl0KSB7XG4gICAgICAgIHNlbGYuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzLnB1c2goe1xuICAgICAgICAgIHdhaXQ6IGZhbHNlLFxuICAgICAgICAgIG1ldGhvZHM6IFtdLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgbGFzdChzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2NrcykubWV0aG9kcy5wdXNoKG1ldGhvZEludm9rZXIpO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGFkZGVkIGl0IHRvIHRoZSBmaXJzdCBibG9jaywgc2VuZCBpdCBvdXQgbm93LlxuICAgIGlmIChzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrcy5sZW5ndGggPT09IDEpIG1ldGhvZEludm9rZXIuc2VuZE1lc3NhZ2UoKTtcblxuICAgIC8vIElmIHdlJ3JlIHVzaW5nIHRoZSBkZWZhdWx0IGNhbGxiYWNrIG9uIHRoZSBzZXJ2ZXIsXG4gICAgLy8gYmxvY2sgd2FpdGluZyBmb3IgdGhlIHJlc3VsdC5cbiAgICBpZiAoZnV0dXJlKSB7XG4gICAgICByZXR1cm4gZnV0dXJlLndhaXQoKTtcbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnMucmV0dXJuU3R1YlZhbHVlID8gc3R1YlJldHVyblZhbHVlIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gQmVmb3JlIGNhbGxpbmcgYSBtZXRob2Qgc3R1YiwgcHJlcGFyZSBhbGwgc3RvcmVzIHRvIHRyYWNrIGNoYW5nZXMgYW5kIGFsbG93XG4gIC8vIF9yZXRyaWV2ZUFuZFN0b3JlT3JpZ2luYWxzIHRvIGdldCB0aGUgb3JpZ2luYWwgdmVyc2lvbnMgb2YgY2hhbmdlZFxuICAvLyBkb2N1bWVudHMuXG4gIF9zYXZlT3JpZ2luYWxzKCkge1xuICAgIGlmICghIHRoaXMuX3dhaXRpbmdGb3JRdWllc2NlbmNlKCkpIHtcbiAgICAgIHRoaXMuX2ZsdXNoQnVmZmVyZWRXcml0ZXMoKTtcbiAgICB9XG5cbiAgICBrZXlzKHRoaXMuX3N0b3JlcykuZm9yRWFjaChzdG9yZU5hbWUgPT4ge1xuICAgICAgdGhpcy5fc3RvcmVzW3N0b3JlTmFtZV0uc2F2ZU9yaWdpbmFscygpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gUmV0cmlldmVzIHRoZSBvcmlnaW5hbCB2ZXJzaW9ucyBvZiBhbGwgZG9jdW1lbnRzIG1vZGlmaWVkIGJ5IHRoZSBzdHViIGZvclxuICAvLyBtZXRob2QgJ21ldGhvZElkJyBmcm9tIGFsbCBzdG9yZXMgYW5kIHNhdmVzIHRoZW0gdG8gX3NlcnZlckRvY3VtZW50cyAoa2V5ZWRcbiAgLy8gYnkgZG9jdW1lbnQpIGFuZCBfZG9jdW1lbnRzV3JpdHRlbkJ5U3R1YiAoa2V5ZWQgYnkgbWV0aG9kIElEKS5cbiAgX3JldHJpZXZlQW5kU3RvcmVPcmlnaW5hbHMobWV0aG9kSWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2RvY3VtZW50c1dyaXR0ZW5CeVN0dWJbbWV0aG9kSWRdKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEdXBsaWNhdGUgbWV0aG9kSWQgaW4gX3JldHJpZXZlQW5kU3RvcmVPcmlnaW5hbHMnKTtcblxuICAgIHZhciBkb2NzV3JpdHRlbiA9IFtdO1xuXG4gICAga2V5cyhzZWxmLl9zdG9yZXMpLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICB2YXIgb3JpZ2luYWxzID0gc2VsZi5fc3RvcmVzW2NvbGxlY3Rpb25dLnJldHJpZXZlT3JpZ2luYWxzKCk7XG4gICAgICAvLyBub3QgYWxsIHN0b3JlcyBkZWZpbmUgcmV0cmlldmVPcmlnaW5hbHNcbiAgICAgIGlmICghIG9yaWdpbmFscykgcmV0dXJuO1xuICAgICAgb3JpZ2luYWxzLmZvckVhY2goKGRvYywgaWQpID0+IHtcbiAgICAgICAgZG9jc1dyaXR0ZW4ucHVzaCh7IGNvbGxlY3Rpb24sIGlkIH0pO1xuICAgICAgICBpZiAoISBoYXNPd24uY2FsbChzZWxmLl9zZXJ2ZXJEb2N1bWVudHMsIGNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgc2VsZi5fc2VydmVyRG9jdW1lbnRzW2NvbGxlY3Rpb25dID0gbmV3IE1vbmdvSURNYXAoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2VydmVyRG9jID0gc2VsZi5fc2VydmVyRG9jdW1lbnRzW2NvbGxlY3Rpb25dLnNldERlZmF1bHQoXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgICAgICApO1xuICAgICAgICBpZiAoc2VydmVyRG9jLndyaXR0ZW5CeVN0dWJzKSB7XG4gICAgICAgICAgLy8gV2UncmUgbm90IHRoZSBmaXJzdCBzdHViIHRvIHdyaXRlIHRoaXMgZG9jLiBKdXN0IGFkZCBvdXIgbWV0aG9kIElEXG4gICAgICAgICAgLy8gdG8gdGhlIHJlY29yZC5cbiAgICAgICAgICBzZXJ2ZXJEb2Mud3JpdHRlbkJ5U3R1YnNbbWV0aG9kSWRdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGaXJzdCBzdHViISBTYXZlIHRoZSBvcmlnaW5hbCB2YWx1ZSBhbmQgb3VyIG1ldGhvZCBJRC5cbiAgICAgICAgICBzZXJ2ZXJEb2MuZG9jdW1lbnQgPSBkb2M7XG4gICAgICAgICAgc2VydmVyRG9jLmZsdXNoQ2FsbGJhY2tzID0gW107XG4gICAgICAgICAgc2VydmVyRG9jLndyaXR0ZW5CeVN0dWJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICBzZXJ2ZXJEb2Mud3JpdHRlbkJ5U3R1YnNbbWV0aG9kSWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgaWYgKCEgaXNFbXB0eShkb2NzV3JpdHRlbikpIHtcbiAgICAgIHNlbGYuX2RvY3VtZW50c1dyaXR0ZW5CeVN0dWJbbWV0aG9kSWRdID0gZG9jc1dyaXR0ZW47XG4gICAgfVxuICB9XG5cbiAgLy8gVGhpcyBpcyB2ZXJ5IG11Y2ggYSBwcml2YXRlIGZ1bmN0aW9uIHdlIHVzZSB0byBtYWtlIHRoZSB0ZXN0c1xuICAvLyB0YWtlIHVwIGZld2VyIHNlcnZlciByZXNvdXJjZXMgYWZ0ZXIgdGhleSBjb21wbGV0ZS5cbiAgX3Vuc3Vic2NyaWJlQWxsKCkge1xuICAgIGtleXModGhpcy5fc3Vic2NyaXB0aW9ucykuZm9yRWFjaChpZCA9PiB7XG4gICAgICBjb25zdCBzdWIgPSB0aGlzLl9zdWJzY3JpcHRpb25zW2lkXTtcbiAgICAgIC8vIEF2b2lkIGtpbGxpbmcgdGhlIGF1dG91cGRhdGUgc3Vic2NyaXB0aW9uIHNvIHRoYXQgZGV2ZWxvcGVyc1xuICAgICAgLy8gc3RpbGwgZ2V0IGhvdCBjb2RlIHB1c2hlcyB3aGVuIHdyaXRpbmcgdGVzdHMuXG4gICAgICAvL1xuICAgICAgLy8gWFhYIGl0J3MgYSBoYWNrIHRvIGVuY29kZSBrbm93bGVkZ2UgYWJvdXQgYXV0b3VwZGF0ZSBoZXJlLFxuICAgICAgLy8gYnV0IGl0IGRvZXNuJ3Qgc2VlbSB3b3J0aCBpdCB5ZXQgdG8gaGF2ZSBhIHNwZWNpYWwgQVBJIGZvclxuICAgICAgLy8gc3Vic2NyaXB0aW9ucyB0byBwcmVzZXJ2ZSBhZnRlciB1bml0IHRlc3RzLlxuICAgICAgaWYgKHN1Yi5uYW1lICE9PSAnbWV0ZW9yX2F1dG91cGRhdGVfY2xpZW50VmVyc2lvbnMnKSB7XG4gICAgICAgIHN1Yi5zdG9wKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBTZW5kcyB0aGUgRERQIHN0cmluZ2lmaWNhdGlvbiBvZiB0aGUgZ2l2ZW4gbWVzc2FnZSBvYmplY3RcbiAgX3NlbmQob2JqKSB7XG4gICAgdGhpcy5fc3RyZWFtLnNlbmQoRERQQ29tbW9uLnN0cmluZ2lmeUREUChvYmopKTtcbiAgfVxuXG4gIC8vIFdlIGRldGVjdGVkIHZpYSBERFAtbGV2ZWwgaGVhcnRiZWF0cyB0aGF0IHdlJ3ZlIGxvc3QgdGhlXG4gIC8vIGNvbm5lY3Rpb24uICBVbmxpa2UgYGRpc2Nvbm5lY3RgIG9yIGBjbG9zZWAsIGEgbG9zdCBjb25uZWN0aW9uXG4gIC8vIHdpbGwgYmUgYXV0b21hdGljYWxseSByZXRyaWVkLlxuICBfbG9zdENvbm5lY3Rpb24oZXJyb3IpIHtcbiAgICB0aGlzLl9zdHJlYW0uX2xvc3RDb25uZWN0aW9uKGVycm9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICogQGFsaWFzIE1ldGVvci5zdGF0dXNcbiAgICogQHN1bW1hcnkgR2V0IHRoZSBjdXJyZW50IGNvbm5lY3Rpb24gc3RhdHVzLiBBIHJlYWN0aXZlIGRhdGEgc291cmNlLlxuICAgKiBAbG9jdXMgQ2xpZW50XG4gICAqL1xuICBzdGF0dXMoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLl9zdHJlYW0uc3RhdHVzKC4uLmFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEZvcmNlIGFuIGltbWVkaWF0ZSByZWNvbm5lY3Rpb24gYXR0ZW1wdCBpZiB0aGUgY2xpZW50IGlzIG5vdCBjb25uZWN0ZWQgdG8gdGhlIHNlcnZlci5cblxuICBUaGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcgaWYgdGhlIGNsaWVudCBpcyBhbHJlYWR5IGNvbm5lY3RlZC5cbiAgICogQG1lbWJlck9mIE1ldGVvclxuICAgKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gICAqIEBhbGlhcyBNZXRlb3IucmVjb25uZWN0XG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICovXG4gIHJlY29ubmVjdCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0cmVhbS5yZWNvbm5lY3QoLi4uYXJncyk7XG4gIH1cblxuICAvKipcbiAgICogQG1lbWJlck9mIE1ldGVvclxuICAgKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gICAqIEBhbGlhcyBNZXRlb3IuZGlzY29ubmVjdFxuICAgKiBAc3VtbWFyeSBEaXNjb25uZWN0IHRoZSBjbGllbnQgZnJvbSB0aGUgc2VydmVyLlxuICAgKiBAbG9jdXMgQ2xpZW50XG4gICAqL1xuICBkaXNjb25uZWN0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RyZWFtLmRpc2Nvbm5lY3QoLi4uYXJncyk7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RyZWFtLmRpc2Nvbm5lY3QoeyBfcGVybWFuZW50OiB0cnVlIH0pO1xuICB9XG5cbiAgLy8vXG4gIC8vLyBSZWFjdGl2ZSB1c2VyIHN5c3RlbVxuICAvLy9cbiAgdXNlcklkKCkge1xuICAgIGlmICh0aGlzLl91c2VySWREZXBzKSB0aGlzLl91c2VySWREZXBzLmRlcGVuZCgpO1xuICAgIHJldHVybiB0aGlzLl91c2VySWQ7XG4gIH1cblxuICBzZXRVc2VySWQodXNlcklkKSB7XG4gICAgLy8gQXZvaWQgaW52YWxpZGF0aW5nIGRlcGVuZGVudHMgaWYgc2V0VXNlcklkIGlzIGNhbGxlZCB3aXRoIGN1cnJlbnQgdmFsdWUuXG4gICAgaWYgKHRoaXMuX3VzZXJJZCA9PT0gdXNlcklkKSByZXR1cm47XG4gICAgdGhpcy5fdXNlcklkID0gdXNlcklkO1xuICAgIGlmICh0aGlzLl91c2VySWREZXBzKSB0aGlzLl91c2VySWREZXBzLmNoYW5nZWQoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdHJ1ZSBpZiB3ZSBhcmUgaW4gYSBzdGF0ZSBhZnRlciByZWNvbm5lY3Qgb2Ygd2FpdGluZyBmb3Igc3VicyB0byBiZVxuICAvLyByZXZpdmVkIG9yIGVhcmx5IG1ldGhvZHMgdG8gZmluaXNoIHRoZWlyIGRhdGEsIG9yIHdlIGFyZSB3YWl0aW5nIGZvciBhXG4gIC8vIFwid2FpdFwiIG1ldGhvZCB0byBmaW5pc2guXG4gIF93YWl0aW5nRm9yUXVpZXNjZW5jZSgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgISBpc0VtcHR5KHRoaXMuX3N1YnNCZWluZ1Jldml2ZWQpIHx8XG4gICAgICAhIGlzRW1wdHkodGhpcy5fbWV0aG9kc0Jsb2NraW5nUXVpZXNjZW5jZSlcbiAgICApO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0cnVlIGlmIGFueSBtZXRob2Qgd2hvc2UgbWVzc2FnZSBoYXMgYmVlbiBzZW50IHRvIHRoZSBzZXJ2ZXIgaGFzXG4gIC8vIG5vdCB5ZXQgaW52b2tlZCBpdHMgdXNlciBjYWxsYmFjay5cbiAgX2FueU1ldGhvZHNBcmVPdXRzdGFuZGluZygpIHtcbiAgICBjb25zdCBpbnZva2VycyA9IHRoaXMuX21ldGhvZEludm9rZXJzO1xuICAgIHJldHVybiBrZXlzKGludm9rZXJzKS5zb21lKGlkID0+IHtcbiAgICAgIHJldHVybiBpbnZva2Vyc1tpZF0uc2VudE1lc3NhZ2U7XG4gICAgfSk7XG4gIH1cblxuICBfbGl2ZWRhdGFfY29ubmVjdGVkKG1zZykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmIChzZWxmLl92ZXJzaW9uICE9PSAncHJlMScgJiYgc2VsZi5faGVhcnRiZWF0SW50ZXJ2YWwgIT09IDApIHtcbiAgICAgIHNlbGYuX2hlYXJ0YmVhdCA9IG5ldyBERFBDb21tb24uSGVhcnRiZWF0KHtcbiAgICAgICAgaGVhcnRiZWF0SW50ZXJ2YWw6IHNlbGYuX2hlYXJ0YmVhdEludGVydmFsLFxuICAgICAgICBoZWFydGJlYXRUaW1lb3V0OiBzZWxmLl9oZWFydGJlYXRUaW1lb3V0LFxuICAgICAgICBvblRpbWVvdXQoKSB7XG4gICAgICAgICAgc2VsZi5fbG9zdENvbm5lY3Rpb24oXG4gICAgICAgICAgICBuZXcgRERQLkNvbm5lY3Rpb25FcnJvcignRERQIGhlYXJ0YmVhdCB0aW1lZCBvdXQnKVxuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbmRQaW5nKCkge1xuICAgICAgICAgIHNlbGYuX3NlbmQoeyBtc2c6ICdwaW5nJyB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBzZWxmLl9oZWFydGJlYXQuc3RhcnQoKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGlzIGlzIGEgcmVjb25uZWN0LCB3ZSdsbCBoYXZlIHRvIHJlc2V0IGFsbCBzdG9yZXMuXG4gICAgaWYgKHNlbGYuX2xhc3RTZXNzaW9uSWQpIHNlbGYuX3Jlc2V0U3RvcmVzID0gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgbXNnLnNlc3Npb24gPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YXIgcmVjb25uZWN0ZWRUb1ByZXZpb3VzU2Vzc2lvbiA9IHNlbGYuX2xhc3RTZXNzaW9uSWQgPT09IG1zZy5zZXNzaW9uO1xuICAgICAgc2VsZi5fbGFzdFNlc3Npb25JZCA9IG1zZy5zZXNzaW9uO1xuICAgIH1cblxuICAgIGlmIChyZWNvbm5lY3RlZFRvUHJldmlvdXNTZXNzaW9uKSB7XG4gICAgICAvLyBTdWNjZXNzZnVsIHJlY29ubmVjdGlvbiAtLSBwaWNrIHVwIHdoZXJlIHdlIGxlZnQgb2ZmLiAgTm90ZSB0aGF0IHJpZ2h0XG4gICAgICAvLyBub3csIHRoaXMgbmV2ZXIgaGFwcGVuczogdGhlIHNlcnZlciBuZXZlciBjb25uZWN0cyB1cyB0byBhIHByZXZpb3VzXG4gICAgICAvLyBzZXNzaW9uLCBiZWNhdXNlIEREUCBkb2Vzbid0IHByb3ZpZGUgZW5vdWdoIGRhdGEgZm9yIHRoZSBzZXJ2ZXIgdG8ga25vd1xuICAgICAgLy8gd2hhdCBtZXNzYWdlcyB0aGUgY2xpZW50IGhhcyBwcm9jZXNzZWQuIFdlIG5lZWQgdG8gaW1wcm92ZSBERFAgdG8gbWFrZVxuICAgICAgLy8gdGhpcyBwb3NzaWJsZSwgYXQgd2hpY2ggcG9pbnQgd2UnbGwgcHJvYmFibHkgbmVlZCBtb3JlIGNvZGUgaGVyZS5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTZXJ2ZXIgZG9lc24ndCBoYXZlIG91ciBkYXRhIGFueSBtb3JlLiBSZS1zeW5jIGEgbmV3IHNlc3Npb24uXG5cbiAgICAvLyBGb3JnZXQgYWJvdXQgbWVzc2FnZXMgd2Ugd2VyZSBidWZmZXJpbmcgZm9yIHVua25vd24gY29sbGVjdGlvbnMuIFRoZXknbGxcbiAgICAvLyBiZSByZXNlbnQgaWYgc3RpbGwgcmVsZXZhbnQuXG4gICAgc2VsZi5fdXBkYXRlc0ZvclVua25vd25TdG9yZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgaWYgKHNlbGYuX3Jlc2V0U3RvcmVzKSB7XG4gICAgICAvLyBGb3JnZXQgYWJvdXQgdGhlIGVmZmVjdHMgb2Ygc3R1YnMuIFdlJ2xsIGJlIHJlc2V0dGluZyBhbGwgY29sbGVjdGlvbnNcbiAgICAgIC8vIGFueXdheS5cbiAgICAgIHNlbGYuX2RvY3VtZW50c1dyaXR0ZW5CeVN0dWIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgc2VsZi5fc2VydmVyRG9jdW1lbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhciBfYWZ0ZXJVcGRhdGVDYWxsYmFja3MuXG4gICAgc2VsZi5fYWZ0ZXJVcGRhdGVDYWxsYmFja3MgPSBbXTtcblxuICAgIC8vIE1hcmsgYWxsIG5hbWVkIHN1YnNjcmlwdGlvbnMgd2hpY2ggYXJlIHJlYWR5IChpZSwgd2UgYWxyZWFkeSBjYWxsZWQgdGhlXG4gICAgLy8gcmVhZHkgY2FsbGJhY2spIGFzIG5lZWRpbmcgdG8gYmUgcmV2aXZlZC5cbiAgICAvLyBYWFggV2Ugc2hvdWxkIGFsc28gYmxvY2sgcmVjb25uZWN0IHF1aWVzY2VuY2UgdW50aWwgdW5uYW1lZCBzdWJzY3JpcHRpb25zXG4gICAgLy8gICAgIChlZywgYXV0b3B1Ymxpc2gpIGFyZSBkb25lIHJlLXB1Ymxpc2hpbmcgdG8gYXZvaWQgZmxpY2tlciFcbiAgICBzZWxmLl9zdWJzQmVpbmdSZXZpdmVkID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBrZXlzKHNlbGYuX3N1YnNjcmlwdGlvbnMpLmZvckVhY2goaWQgPT4ge1xuICAgICAgaWYgKHNlbGYuX3N1YnNjcmlwdGlvbnNbaWRdLnJlYWR5KSB7XG4gICAgICAgIHNlbGYuX3N1YnNCZWluZ1Jldml2ZWRbaWRdID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFycmFuZ2UgZm9yIFwiaGFsZi1maW5pc2hlZFwiIG1ldGhvZHMgdG8gaGF2ZSB0aGVpciBjYWxsYmFja3MgcnVuLCBhbmRcbiAgICAvLyB0cmFjayBtZXRob2RzIHRoYXQgd2VyZSBzZW50IG9uIHRoaXMgY29ubmVjdGlvbiBzbyB0aGF0IHdlIGRvbid0XG4gICAgLy8gcXVpZXNjZSB1bnRpbCB0aGV5IGFyZSBhbGwgZG9uZS5cbiAgICAvL1xuICAgIC8vIFN0YXJ0IGJ5IGNsZWFyaW5nIF9tZXRob2RzQmxvY2tpbmdRdWllc2NlbmNlOiBtZXRob2RzIHNlbnQgYmVmb3JlXG4gICAgLy8gcmVjb25uZWN0IGRvbid0IG1hdHRlciwgYW5kIGFueSBcIndhaXRcIiBtZXRob2RzIHNlbnQgb24gdGhlIG5ldyBjb25uZWN0aW9uXG4gICAgLy8gdGhhdCB3ZSBkcm9wIGhlcmUgd2lsbCBiZSByZXN0b3JlZCBieSB0aGUgbG9vcCBiZWxvdy5cbiAgICBzZWxmLl9tZXRob2RzQmxvY2tpbmdRdWllc2NlbmNlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBpZiAoc2VsZi5fcmVzZXRTdG9yZXMpIHtcbiAgICAgIGNvbnN0IGludm9rZXJzID0gc2VsZi5fbWV0aG9kSW52b2tlcnM7XG4gICAgICBrZXlzKGludm9rZXJzKS5mb3JFYWNoKGlkID0+IHtcbiAgICAgICAgY29uc3QgaW52b2tlciA9IGludm9rZXJzW2lkXTtcbiAgICAgICAgaWYgKGludm9rZXIuZ290UmVzdWx0KCkpIHtcbiAgICAgICAgICAvLyBUaGlzIG1ldGhvZCBhbHJlYWR5IGdvdCBpdHMgcmVzdWx0LCBidXQgaXQgZGlkbid0IGNhbGwgaXRzIGNhbGxiYWNrXG4gICAgICAgICAgLy8gYmVjYXVzZSBpdHMgZGF0YSBkaWRuJ3QgYmVjb21lIHZpc2libGUuIFdlIGRpZCBub3QgcmVzZW5kIHRoZVxuICAgICAgICAgIC8vIG1ldGhvZCBSUEMuIFdlJ2xsIGNhbGwgaXRzIGNhbGxiYWNrIHdoZW4gd2UgZ2V0IGEgZnVsbCBxdWllc2NlLFxuICAgICAgICAgIC8vIHNpbmNlIHRoYXQncyBhcyBjbG9zZSBhcyB3ZSdsbCBnZXQgdG8gXCJkYXRhIG11c3QgYmUgdmlzaWJsZVwiLlxuICAgICAgICAgIHNlbGYuX2FmdGVyVXBkYXRlQ2FsbGJhY2tzLnB1c2goXG4gICAgICAgICAgICAoLi4uYXJncykgPT4gaW52b2tlci5kYXRhVmlzaWJsZSguLi5hcmdzKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW52b2tlci5zZW50TWVzc2FnZSkge1xuICAgICAgICAgIC8vIFRoaXMgbWV0aG9kIGhhcyBiZWVuIHNlbnQgb24gdGhpcyBjb25uZWN0aW9uIChtYXliZSBhcyBhIHJlc2VuZFxuICAgICAgICAgIC8vIGZyb20gdGhlIGxhc3QgY29ubmVjdGlvbiwgbWF5YmUgZnJvbSBvblJlY29ubmVjdCwgbWF5YmUganVzdCB2ZXJ5XG4gICAgICAgICAgLy8gcXVpY2tseSBiZWZvcmUgcHJvY2Vzc2luZyB0aGUgY29ubmVjdGVkIG1lc3NhZ2UpLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZyBzcGVjaWFsIHRvIGVuc3VyZSBpdHMgY2FsbGJhY2tzIGdldFxuICAgICAgICAgIC8vIGNhbGxlZCwgYnV0IHdlJ2xsIGNvdW50IGl0IGFzIGEgbWV0aG9kIHdoaWNoIGlzIHByZXZlbnRpbmdcbiAgICAgICAgICAvLyByZWNvbm5lY3QgcXVpZXNjZW5jZS4gKGVnLCBpdCBtaWdodCBiZSBhIGxvZ2luIG1ldGhvZCB0aGF0IHdhcyBydW5cbiAgICAgICAgICAvLyBmcm9tIG9uUmVjb25uZWN0LCBhbmQgd2UgZG9uJ3Qgd2FudCB0byBzZWUgZmxpY2tlciBieSBzZWVpbmcgYVxuICAgICAgICAgIC8vIGxvZ2dlZC1vdXQgc3RhdGUuKVxuICAgICAgICAgIHNlbGYuX21ldGhvZHNCbG9ja2luZ1F1aWVzY2VuY2VbaW52b2tlci5tZXRob2RJZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLl9tZXNzYWdlc0J1ZmZlcmVkVW50aWxRdWllc2NlbmNlID0gW107XG5cbiAgICAvLyBJZiB3ZSdyZSBub3Qgd2FpdGluZyBvbiBhbnkgbWV0aG9kcyBvciBzdWJzLCB3ZSBjYW4gcmVzZXQgdGhlIHN0b3JlcyBhbmRcbiAgICAvLyBjYWxsIHRoZSBjYWxsYmFja3MgaW1tZWRpYXRlbHkuXG4gICAgaWYgKCEgc2VsZi5fd2FpdGluZ0ZvclF1aWVzY2VuY2UoKSkge1xuICAgICAgaWYgKHNlbGYuX3Jlc2V0U3RvcmVzKSB7XG4gICAgICAgIGtleXMoc2VsZi5fc3RvcmVzKS5mb3JFYWNoKHN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgY29uc3QgcyA9IHNlbGYuX3N0b3Jlc1tzdG9yZU5hbWVdO1xuICAgICAgICAgIHMuYmVnaW5VcGRhdGUoMCwgdHJ1ZSk7XG4gICAgICAgICAgcy5lbmRVcGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNlbGYuX3Jlc2V0U3RvcmVzID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBzZWxmLl9ydW5BZnRlclVwZGF0ZUNhbGxiYWNrcygpO1xuICAgIH1cbiAgfVxuXG4gIF9wcm9jZXNzT25lRGF0YU1lc3NhZ2UobXNnLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgbWVzc2FnZVR5cGUgPSBtc2cubXNnO1xuXG4gICAgLy8gbXNnIGlzIG9uZSBvZiBbJ2FkZGVkJywgJ2NoYW5nZWQnLCAncmVtb3ZlZCcsICdyZWFkeScsICd1cGRhdGVkJ11cbiAgICBpZiAobWVzc2FnZVR5cGUgPT09ICdhZGRlZCcpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NfYWRkZWQobXNnLCB1cGRhdGVzKTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2VUeXBlID09PSAnY2hhbmdlZCcpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NfY2hhbmdlZChtc2csIHVwZGF0ZXMpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZVR5cGUgPT09ICdyZW1vdmVkJykge1xuICAgICAgdGhpcy5fcHJvY2Vzc19yZW1vdmVkKG1zZywgdXBkYXRlcyk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlVHlwZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgdGhpcy5fcHJvY2Vzc19yZWFkeShtc2csIHVwZGF0ZXMpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZVR5cGUgPT09ICd1cGRhdGVkJykge1xuICAgICAgdGhpcy5fcHJvY2Vzc191cGRhdGVkKG1zZywgdXBkYXRlcyk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlVHlwZSA9PT0gJ25vc3ViJykge1xuICAgICAgLy8gaWdub3JlIHRoaXNcbiAgICB9IGVsc2Uge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZygnZGlzY2FyZGluZyB1bmtub3duIGxpdmVkYXRhIGRhdGEgbWVzc2FnZSB0eXBlJywgbXNnKTtcbiAgICB9XG4gIH1cblxuICBfbGl2ZWRhdGFfZGF0YShtc2cpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoc2VsZi5fd2FpdGluZ0ZvclF1aWVzY2VuY2UoKSkge1xuICAgICAgc2VsZi5fbWVzc2FnZXNCdWZmZXJlZFVudGlsUXVpZXNjZW5jZS5wdXNoKG1zZyk7XG5cbiAgICAgIGlmIChtc2cubXNnID09PSAnbm9zdWInKSB7XG4gICAgICAgIGRlbGV0ZSBzZWxmLl9zdWJzQmVpbmdSZXZpdmVkW21zZy5pZF07XG4gICAgICB9XG5cbiAgICAgIGlmIChtc2cuc3Vicykge1xuICAgICAgICBtc2cuc3Vicy5mb3JFYWNoKHN1YklkID0+IHtcbiAgICAgICAgICBkZWxldGUgc2VsZi5fc3Vic0JlaW5nUmV2aXZlZFtzdWJJZF07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAobXNnLm1ldGhvZHMpIHtcbiAgICAgICAgbXNnLm1ldGhvZHMuZm9yRWFjaChtZXRob2RJZCA9PiB7XG4gICAgICAgICAgZGVsZXRlIHNlbGYuX21ldGhvZHNCbG9ja2luZ1F1aWVzY2VuY2VbbWV0aG9kSWRdO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGYuX3dhaXRpbmdGb3JRdWllc2NlbmNlKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBObyBtZXRob2RzIG9yIHN1YnMgYXJlIGJsb2NraW5nIHF1aWVzY2VuY2UhXG4gICAgICAvLyBXZSdsbCBub3cgcHJvY2VzcyBhbmQgYWxsIG9mIG91ciBidWZmZXJlZCBtZXNzYWdlcywgcmVzZXQgYWxsIHN0b3JlcyxcbiAgICAgIC8vIGFuZCBhcHBseSB0aGVtIGFsbCBhdCBvbmNlLlxuXG4gICAgICBjb25zdCBidWZmZXJlZE1lc3NhZ2VzID0gc2VsZi5fbWVzc2FnZXNCdWZmZXJlZFVudGlsUXVpZXNjZW5jZTtcbiAgICAgIGtleXMoYnVmZmVyZWRNZXNzYWdlcykuZm9yRWFjaChpZCA9PiB7XG4gICAgICAgIHNlbGYuX3Byb2Nlc3NPbmVEYXRhTWVzc2FnZShcbiAgICAgICAgICBidWZmZXJlZE1lc3NhZ2VzW2lkXSxcbiAgICAgICAgICBzZWxmLl9idWZmZXJlZFdyaXRlc1xuICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuX21lc3NhZ2VzQnVmZmVyZWRVbnRpbFF1aWVzY2VuY2UgPSBbXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLl9wcm9jZXNzT25lRGF0YU1lc3NhZ2UobXNnLCBzZWxmLl9idWZmZXJlZFdyaXRlcyk7XG4gICAgfVxuXG4gICAgLy8gSW1tZWRpYXRlbHkgZmx1c2ggd3JpdGVzIHdoZW46XG4gICAgLy8gIDEuIEJ1ZmZlcmluZyBpcyBkaXNhYmxlZC4gT3I7XG4gICAgLy8gIDIuIGFueSBub24tKGFkZGVkL2NoYW5nZWQvcmVtb3ZlZCkgbWVzc2FnZSBhcnJpdmVzLlxuICAgIHZhciBzdGFuZGFyZFdyaXRlID1cbiAgICAgIG1zZy5tc2cgPT09IFwiYWRkZWRcIiB8fFxuICAgICAgbXNnLm1zZyA9PT0gXCJjaGFuZ2VkXCIgfHxcbiAgICAgIG1zZy5tc2cgPT09IFwicmVtb3ZlZFwiO1xuXG4gICAgaWYgKHNlbGYuX2J1ZmZlcmVkV3JpdGVzSW50ZXJ2YWwgPT09IDAgfHwgISBzdGFuZGFyZFdyaXRlKSB7XG4gICAgICBzZWxmLl9mbHVzaEJ1ZmZlcmVkV3JpdGVzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHNlbGYuX2J1ZmZlcmVkV3JpdGVzRmx1c2hBdCA9PT0gbnVsbCkge1xuICAgICAgc2VsZi5fYnVmZmVyZWRXcml0ZXNGbHVzaEF0ID1cbiAgICAgICAgbmV3IERhdGUoKS52YWx1ZU9mKCkgKyBzZWxmLl9idWZmZXJlZFdyaXRlc01heEFnZTtcbiAgICB9IGVsc2UgaWYgKHNlbGYuX2J1ZmZlcmVkV3JpdGVzRmx1c2hBdCA8IG5ldyBEYXRlKCkudmFsdWVPZigpKSB7XG4gICAgICBzZWxmLl9mbHVzaEJ1ZmZlcmVkV3JpdGVzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHNlbGYuX2J1ZmZlcmVkV3JpdGVzRmx1c2hIYW5kbGUpIHtcbiAgICAgIGNsZWFyVGltZW91dChzZWxmLl9idWZmZXJlZFdyaXRlc0ZsdXNoSGFuZGxlKTtcbiAgICB9XG4gICAgc2VsZi5fYnVmZmVyZWRXcml0ZXNGbHVzaEhhbmRsZSA9IHNldFRpbWVvdXQoXG4gICAgICBzZWxmLl9fZmx1c2hCdWZmZXJlZFdyaXRlcyxcbiAgICAgIHNlbGYuX2J1ZmZlcmVkV3JpdGVzSW50ZXJ2YWxcbiAgICApO1xuICB9XG5cbiAgX2ZsdXNoQnVmZmVyZWRXcml0ZXMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9idWZmZXJlZFdyaXRlc0ZsdXNoSGFuZGxlKSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2VsZi5fYnVmZmVyZWRXcml0ZXNGbHVzaEhhbmRsZSk7XG4gICAgICBzZWxmLl9idWZmZXJlZFdyaXRlc0ZsdXNoSGFuZGxlID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZWxmLl9idWZmZXJlZFdyaXRlc0ZsdXNoQXQgPSBudWxsO1xuICAgIC8vIFdlIG5lZWQgdG8gY2xlYXIgdGhlIGJ1ZmZlciBiZWZvcmUgcGFzc2luZyBpdCB0b1xuICAgIC8vICBwZXJmb3JtV3JpdGVzLiBBcyB0aGVyZSdzIG5vIGd1YXJhbnRlZSB0aGF0IGl0XG4gICAgLy8gIHdpbGwgZXhpdCBjbGVhbmx5LlxuICAgIHZhciB3cml0ZXMgPSBzZWxmLl9idWZmZXJlZFdyaXRlcztcbiAgICBzZWxmLl9idWZmZXJlZFdyaXRlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgc2VsZi5fcGVyZm9ybVdyaXRlcyh3cml0ZXMpO1xuICB9XG5cbiAgX3BlcmZvcm1Xcml0ZXModXBkYXRlcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmIChzZWxmLl9yZXNldFN0b3JlcyB8fCAhIGlzRW1wdHkodXBkYXRlcykpIHtcbiAgICAgIC8vIEJlZ2luIGEgdHJhbnNhY3Rpb25hbCB1cGRhdGUgb2YgZWFjaCBzdG9yZS5cblxuICAgICAga2V5cyhzZWxmLl9zdG9yZXMpLmZvckVhY2goc3RvcmVOYW1lID0+IHtcbiAgICAgICAgc2VsZi5fc3RvcmVzW3N0b3JlTmFtZV0uYmVnaW5VcGRhdGUoXG4gICAgICAgICAgaGFzT3duLmNhbGwodXBkYXRlcywgc3RvcmVOYW1lKVxuICAgICAgICAgICAgPyB1cGRhdGVzW3N0b3JlTmFtZV0ubGVuZ3RoXG4gICAgICAgICAgICA6IDAsXG4gICAgICAgICAgc2VsZi5fcmVzZXRTdG9yZXNcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuXG4gICAgICBzZWxmLl9yZXNldFN0b3JlcyA9IGZhbHNlO1xuXG4gICAgICBrZXlzKHVwZGF0ZXMpLmZvckVhY2goc3RvcmVOYW1lID0+IHtcbiAgICAgICAgY29uc3QgdXBkYXRlTWVzc2FnZXMgPSB1cGRhdGVzW3N0b3JlTmFtZV07XG4gICAgICAgIHZhciBzdG9yZSA9IHNlbGYuX3N0b3Jlc1tzdG9yZU5hbWVdO1xuICAgICAgICBpZiAoc3RvcmUpIHtcbiAgICAgICAgICB1cGRhdGVNZXNzYWdlcy5mb3JFYWNoKHVwZGF0ZU1lc3NhZ2UgPT4ge1xuICAgICAgICAgICAgc3RvcmUudXBkYXRlKHVwZGF0ZU1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE5vYm9keSdzIGxpc3RlbmluZyBmb3IgdGhpcyBkYXRhLiBRdWV1ZSBpdCB1cCB1bnRpbFxuICAgICAgICAgIC8vIHNvbWVvbmUgd2FudHMgaXQuXG4gICAgICAgICAgLy8gWFhYIG1lbW9yeSB1c2Ugd2lsbCBncm93IHdpdGhvdXQgYm91bmQgaWYgeW91IGZvcmdldCB0b1xuICAgICAgICAgIC8vIGNyZWF0ZSBhIGNvbGxlY3Rpb24gb3IganVzdCBkb24ndCBjYXJlIGFib3V0IGl0Li4uIGdvaW5nXG4gICAgICAgICAgLy8gdG8gaGF2ZSB0byBkbyBzb21ldGhpbmcgYWJvdXQgdGhhdC5cbiAgICAgICAgICBjb25zdCB1cGRhdGVzID0gc2VsZi5fdXBkYXRlc0ZvclVua25vd25TdG9yZXM7XG5cbiAgICAgICAgICBpZiAoISBoYXNPd24uY2FsbCh1cGRhdGVzLCBzdG9yZU5hbWUpKSB7XG4gICAgICAgICAgICB1cGRhdGVzW3N0b3JlTmFtZV0gPSBbXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB1cGRhdGVzW3N0b3JlTmFtZV0ucHVzaCguLi51cGRhdGVNZXNzYWdlcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBFbmQgdXBkYXRlIHRyYW5zYWN0aW9uLlxuICAgICAga2V5cyhzZWxmLl9zdG9yZXMpLmZvckVhY2goc3RvcmVOYW1lID0+IHtcbiAgICAgICAgc2VsZi5fc3RvcmVzW3N0b3JlTmFtZV0uZW5kVXBkYXRlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLl9ydW5BZnRlclVwZGF0ZUNhbGxiYWNrcygpO1xuICB9XG5cbiAgLy8gQ2FsbCBhbnkgY2FsbGJhY2tzIGRlZmVycmVkIHdpdGggX3J1bldoZW5BbGxTZXJ2ZXJEb2NzQXJlRmx1c2hlZCB3aG9zZVxuICAvLyByZWxldmFudCBkb2NzIGhhdmUgYmVlbiBmbHVzaGVkLCBhcyB3ZWxsIGFzIGRhdGFWaXNpYmxlIGNhbGxiYWNrcyBhdFxuICAvLyByZWNvbm5lY3QtcXVpZXNjZW5jZSB0aW1lLlxuICBfcnVuQWZ0ZXJVcGRhdGVDYWxsYmFja3MoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBjYWxsYmFja3MgPSBzZWxmLl9hZnRlclVwZGF0ZUNhbGxiYWNrcztcbiAgICBzZWxmLl9hZnRlclVwZGF0ZUNhbGxiYWNrcyA9IFtdO1xuICAgIGNhbGxiYWNrcy5mb3JFYWNoKGMgPT4ge1xuICAgICAgYygpO1xuICAgIH0pO1xuICB9XG5cbiAgX3B1c2hVcGRhdGUodXBkYXRlcywgY29sbGVjdGlvbiwgbXNnKSB7XG4gICAgaWYgKCEgaGFzT3duLmNhbGwodXBkYXRlcywgY29sbGVjdGlvbikpIHtcbiAgICAgIHVwZGF0ZXNbY29sbGVjdGlvbl0gPSBbXTtcbiAgICB9XG4gICAgdXBkYXRlc1tjb2xsZWN0aW9uXS5wdXNoKG1zZyk7XG4gIH1cblxuICBfZ2V0U2VydmVyRG9jKGNvbGxlY3Rpb24sIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghIGhhc093bi5jYWxsKHNlbGYuX3NlcnZlckRvY3VtZW50cywgY29sbGVjdGlvbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgc2VydmVyRG9jc0ZvckNvbGxlY3Rpb24gPSBzZWxmLl9zZXJ2ZXJEb2N1bWVudHNbY29sbGVjdGlvbl07XG4gICAgcmV0dXJuIHNlcnZlckRvY3NGb3JDb2xsZWN0aW9uLmdldChpZCkgfHwgbnVsbDtcbiAgfVxuXG4gIF9wcm9jZXNzX2FkZGVkKG1zZywgdXBkYXRlcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgaWQgPSBNb25nb0lELmlkUGFyc2UobXNnLmlkKTtcbiAgICB2YXIgc2VydmVyRG9jID0gc2VsZi5fZ2V0U2VydmVyRG9jKG1zZy5jb2xsZWN0aW9uLCBpZCk7XG4gICAgaWYgKHNlcnZlckRvYykge1xuICAgICAgLy8gU29tZSBvdXRzdGFuZGluZyBzdHViIHdyb3RlIGhlcmUuXG4gICAgICB2YXIgaXNFeGlzdGluZyA9IHNlcnZlckRvYy5kb2N1bWVudCAhPT0gdW5kZWZpbmVkO1xuXG4gICAgICBzZXJ2ZXJEb2MuZG9jdW1lbnQgPSBtc2cuZmllbGRzIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICBzZXJ2ZXJEb2MuZG9jdW1lbnQuX2lkID0gaWQ7XG5cbiAgICAgIGlmIChzZWxmLl9yZXNldFN0b3Jlcykge1xuICAgICAgICAvLyBEdXJpbmcgcmVjb25uZWN0IHRoZSBzZXJ2ZXIgaXMgc2VuZGluZyBhZGRzIGZvciBleGlzdGluZyBpZHMuXG4gICAgICAgIC8vIEFsd2F5cyBwdXNoIGFuIHVwZGF0ZSBzbyB0aGF0IGRvY3VtZW50IHN0YXlzIGluIHRoZSBzdG9yZSBhZnRlclxuICAgICAgICAvLyByZXNldC4gVXNlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgZG9jdW1lbnQgZm9yIHRoaXMgdXBkYXRlLCBzb1xuICAgICAgICAvLyB0aGF0IHN0dWItd3JpdHRlbiB2YWx1ZXMgYXJlIHByZXNlcnZlZC5cbiAgICAgICAgdmFyIGN1cnJlbnREb2MgPSBzZWxmLl9zdG9yZXNbbXNnLmNvbGxlY3Rpb25dLmdldERvYyhtc2cuaWQpO1xuICAgICAgICBpZiAoY3VycmVudERvYyAhPT0gdW5kZWZpbmVkKSBtc2cuZmllbGRzID0gY3VycmVudERvYztcblxuICAgICAgICBzZWxmLl9wdXNoVXBkYXRlKHVwZGF0ZXMsIG1zZy5jb2xsZWN0aW9uLCBtc2cpO1xuICAgICAgfSBlbHNlIGlmIChpc0V4aXN0aW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmVyIHNlbnQgYWRkIGZvciBleGlzdGluZyBpZDogJyArIG1zZy5pZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuX3B1c2hVcGRhdGUodXBkYXRlcywgbXNnLmNvbGxlY3Rpb24sIG1zZyk7XG4gICAgfVxuICB9XG5cbiAgX3Byb2Nlc3NfY2hhbmdlZChtc2csIHVwZGF0ZXMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHNlcnZlckRvYyA9IHNlbGYuX2dldFNlcnZlckRvYyhtc2cuY29sbGVjdGlvbiwgTW9uZ29JRC5pZFBhcnNlKG1zZy5pZCkpO1xuICAgIGlmIChzZXJ2ZXJEb2MpIHtcbiAgICAgIGlmIChzZXJ2ZXJEb2MuZG9jdW1lbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXJ2ZXIgc2VudCBjaGFuZ2VkIGZvciBub25leGlzdGluZyBpZDogJyArIG1zZy5pZCk7XG4gICAgICBEaWZmU2VxdWVuY2UuYXBwbHlDaGFuZ2VzKHNlcnZlckRvYy5kb2N1bWVudCwgbXNnLmZpZWxkcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuX3B1c2hVcGRhdGUodXBkYXRlcywgbXNnLmNvbGxlY3Rpb24sIG1zZyk7XG4gICAgfVxuICB9XG5cbiAgX3Byb2Nlc3NfcmVtb3ZlZChtc2csIHVwZGF0ZXMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHNlcnZlckRvYyA9IHNlbGYuX2dldFNlcnZlckRvYyhtc2cuY29sbGVjdGlvbiwgTW9uZ29JRC5pZFBhcnNlKG1zZy5pZCkpO1xuICAgIGlmIChzZXJ2ZXJEb2MpIHtcbiAgICAgIC8vIFNvbWUgb3V0c3RhbmRpbmcgc3R1YiB3cm90ZSBoZXJlLlxuICAgICAgaWYgKHNlcnZlckRvYy5kb2N1bWVudCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlcnZlciBzZW50IHJlbW92ZWQgZm9yIG5vbmV4aXN0aW5nIGlkOicgKyBtc2cuaWQpO1xuICAgICAgc2VydmVyRG9jLmRvY3VtZW50ID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLl9wdXNoVXBkYXRlKHVwZGF0ZXMsIG1zZy5jb2xsZWN0aW9uLCB7XG4gICAgICAgIG1zZzogJ3JlbW92ZWQnLFxuICAgICAgICBjb2xsZWN0aW9uOiBtc2cuY29sbGVjdGlvbixcbiAgICAgICAgaWQ6IG1zZy5pZFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX3Byb2Nlc3NfdXBkYXRlZChtc2csIHVwZGF0ZXMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gUHJvY2VzcyBcIm1ldGhvZCBkb25lXCIgbWVzc2FnZXMuXG5cbiAgICBtc2cubWV0aG9kcy5mb3JFYWNoKG1ldGhvZElkID0+IHtcbiAgICAgIGNvbnN0IGRvY3MgPSBzZWxmLl9kb2N1bWVudHNXcml0dGVuQnlTdHViW21ldGhvZElkXTtcbiAgICAgIGtleXMoZG9jcykuZm9yRWFjaChpZCA9PiB7XG4gICAgICAgIGNvbnN0IHdyaXR0ZW4gPSBkb2NzW2lkXTtcbiAgICAgICAgY29uc3Qgc2VydmVyRG9jID0gc2VsZi5fZ2V0U2VydmVyRG9jKHdyaXR0ZW4uY29sbGVjdGlvbiwgd3JpdHRlbi5pZCk7XG4gICAgICAgIGlmICghIHNlcnZlckRvYykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTG9zdCBzZXJ2ZXJEb2MgZm9yICcgKyBKU09OLnN0cmluZ2lmeSh3cml0dGVuKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEgc2VydmVyRG9jLndyaXR0ZW5CeVN0dWJzW21ldGhvZElkXSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdEb2MgJyArXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHdyaXR0ZW4pICtcbiAgICAgICAgICAgICAgJyBub3Qgd3JpdHRlbiBieSAgbWV0aG9kICcgK1xuICAgICAgICAgICAgICBtZXRob2RJZFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIHNlcnZlckRvYy53cml0dGVuQnlTdHVic1ttZXRob2RJZF07XG4gICAgICAgIGlmIChpc0VtcHR5KHNlcnZlckRvYy53cml0dGVuQnlTdHVicykpIHtcbiAgICAgICAgICAvLyBBbGwgbWV0aG9kcyB3aG9zZSBzdHVicyB3cm90ZSB0aGlzIG1ldGhvZCBoYXZlIGNvbXBsZXRlZCEgV2UgY2FuXG4gICAgICAgICAgLy8gbm93IGNvcHkgdGhlIHNhdmVkIGRvY3VtZW50IHRvIHRoZSBkYXRhYmFzZSAocmV2ZXJ0aW5nIHRoZSBzdHViJ3NcbiAgICAgICAgICAvLyBjaGFuZ2UgaWYgdGhlIHNlcnZlciBkaWQgbm90IHdyaXRlIHRvIHRoaXMgb2JqZWN0LCBvciBhcHBseWluZyB0aGVcbiAgICAgICAgICAvLyBzZXJ2ZXIncyB3cml0ZXMgaWYgaXQgZGlkKS5cblxuICAgICAgICAgIC8vIFRoaXMgaXMgYSBmYWtlIGRkcCAncmVwbGFjZScgbWVzc2FnZS4gIEl0J3MganVzdCBmb3IgdGFsa2luZ1xuICAgICAgICAgIC8vIGJldHdlZW4gbGl2ZWRhdGEgY29ubmVjdGlvbnMgYW5kIG1pbmltb25nby4gIChXZSBoYXZlIHRvIHN0cmluZ2lmeVxuICAgICAgICAgIC8vIHRoZSBJRCBiZWNhdXNlIGl0J3Mgc3VwcG9zZWQgdG8gbG9vayBsaWtlIGEgd2lyZSBtZXNzYWdlLilcbiAgICAgICAgICBzZWxmLl9wdXNoVXBkYXRlKHVwZGF0ZXMsIHdyaXR0ZW4uY29sbGVjdGlvbiwge1xuICAgICAgICAgICAgbXNnOiAncmVwbGFjZScsXG4gICAgICAgICAgICBpZDogTW9uZ29JRC5pZFN0cmluZ2lmeSh3cml0dGVuLmlkKSxcbiAgICAgICAgICAgIHJlcGxhY2U6IHNlcnZlckRvYy5kb2N1bWVudFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIENhbGwgYWxsIGZsdXNoIGNhbGxiYWNrcy5cblxuICAgICAgICAgIHNlcnZlckRvYy5mbHVzaENhbGxiYWNrcy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgICAgYygpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gRGVsZXRlIHRoaXMgY29tcGxldGVkIHNlcnZlckRvY3VtZW50LiBEb24ndCBib3RoZXIgdG8gR0MgZW1wdHlcbiAgICAgICAgICAvLyBJZE1hcHMgaW5zaWRlIHNlbGYuX3NlcnZlckRvY3VtZW50cywgc2luY2UgdGhlcmUgcHJvYmFibHkgYXJlbid0XG4gICAgICAgICAgLy8gbWFueSBjb2xsZWN0aW9ucyBhbmQgdGhleSdsbCBiZSB3cml0dGVuIHJlcGVhdGVkbHkuXG4gICAgICAgICAgc2VsZi5fc2VydmVyRG9jdW1lbnRzW3dyaXR0ZW4uY29sbGVjdGlvbl0ucmVtb3ZlKHdyaXR0ZW4uaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBzZWxmLl9kb2N1bWVudHNXcml0dGVuQnlTdHViW21ldGhvZElkXTtcblxuICAgICAgLy8gV2Ugd2FudCB0byBjYWxsIHRoZSBkYXRhLXdyaXR0ZW4gY2FsbGJhY2ssIGJ1dCB3ZSBjYW4ndCBkbyBzbyB1bnRpbCBhbGxcbiAgICAgIC8vIGN1cnJlbnRseSBidWZmZXJlZCBtZXNzYWdlcyBhcmUgZmx1c2hlZC5cbiAgICAgIGNvbnN0IGNhbGxiYWNrSW52b2tlciA9IHNlbGYuX21ldGhvZEludm9rZXJzW21ldGhvZElkXTtcbiAgICAgIGlmICghIGNhbGxiYWNrSW52b2tlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGNhbGxiYWNrIGludm9rZXIgZm9yIG1ldGhvZCAnICsgbWV0aG9kSWQpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9ydW5XaGVuQWxsU2VydmVyRG9jc0FyZUZsdXNoZWQoXG4gICAgICAgICguLi5hcmdzKSA9PiBjYWxsYmFja0ludm9rZXIuZGF0YVZpc2libGUoLi4uYXJncylcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBfcHJvY2Vzc19yZWFkeShtc2csIHVwZGF0ZXMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gUHJvY2VzcyBcInN1YiByZWFkeVwiIG1lc3NhZ2VzLiBcInN1YiByZWFkeVwiIG1lc3NhZ2VzIGRvbid0IHRha2UgZWZmZWN0XG4gICAgLy8gdW50aWwgYWxsIGN1cnJlbnQgc2VydmVyIGRvY3VtZW50cyBoYXZlIGJlZW4gZmx1c2hlZCB0byB0aGUgbG9jYWxcbiAgICAvLyBkYXRhYmFzZS4gV2UgY2FuIHVzZSBhIHdyaXRlIGZlbmNlIHRvIGltcGxlbWVudCB0aGlzLlxuXG4gICAgbXNnLnN1YnMuZm9yRWFjaChzdWJJZCA9PiB7XG4gICAgICBzZWxmLl9ydW5XaGVuQWxsU2VydmVyRG9jc0FyZUZsdXNoZWQoKCkgPT4ge1xuICAgICAgICB2YXIgc3ViUmVjb3JkID0gc2VsZi5fc3Vic2NyaXB0aW9uc1tzdWJJZF07XG4gICAgICAgIC8vIERpZCB3ZSBhbHJlYWR5IHVuc3Vic2NyaWJlP1xuICAgICAgICBpZiAoIXN1YlJlY29yZCkgcmV0dXJuO1xuICAgICAgICAvLyBEaWQgd2UgYWxyZWFkeSByZWNlaXZlIGEgcmVhZHkgbWVzc2FnZT8gKE9vcHMhKVxuICAgICAgICBpZiAoc3ViUmVjb3JkLnJlYWR5KSByZXR1cm47XG4gICAgICAgIHN1YlJlY29yZC5yZWFkeSA9IHRydWU7XG4gICAgICAgIHN1YlJlY29yZC5yZWFkeUNhbGxiYWNrICYmIHN1YlJlY29yZC5yZWFkeUNhbGxiYWNrKCk7XG4gICAgICAgIHN1YlJlY29yZC5yZWFkeURlcHMuY2hhbmdlZCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBFbnN1cmVzIHRoYXQgXCJmXCIgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgYWxsIGRvY3VtZW50cyBjdXJyZW50bHkgaW5cbiAgLy8gX3NlcnZlckRvY3VtZW50cyBoYXZlIGJlZW4gd3JpdHRlbiB0byB0aGUgbG9jYWwgY2FjaGUuIGYgd2lsbCBub3QgYmUgY2FsbGVkXG4gIC8vIGlmIHRoZSBjb25uZWN0aW9uIGlzIGxvc3QgYmVmb3JlIHRoZW4hXG4gIF9ydW5XaGVuQWxsU2VydmVyRG9jc0FyZUZsdXNoZWQoZikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgcnVuRkFmdGVyVXBkYXRlcyA9ICgpID0+IHtcbiAgICAgIHNlbGYuX2FmdGVyVXBkYXRlQ2FsbGJhY2tzLnB1c2goZik7XG4gICAgfTtcbiAgICB2YXIgdW5mbHVzaGVkU2VydmVyRG9jQ291bnQgPSAwO1xuICAgIHZhciBvblNlcnZlckRvY0ZsdXNoID0gKCkgPT4ge1xuICAgICAgLS11bmZsdXNoZWRTZXJ2ZXJEb2NDb3VudDtcbiAgICAgIGlmICh1bmZsdXNoZWRTZXJ2ZXJEb2NDb3VudCA9PT0gMCkge1xuICAgICAgICAvLyBUaGlzIHdhcyB0aGUgbGFzdCBkb2MgdG8gZmx1c2ghIEFycmFuZ2UgdG8gcnVuIGYgYWZ0ZXIgdGhlIHVwZGF0ZXNcbiAgICAgICAgLy8gaGF2ZSBiZWVuIGFwcGxpZWQuXG4gICAgICAgIHJ1bkZBZnRlclVwZGF0ZXMoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAga2V5cyhzZWxmLl9zZXJ2ZXJEb2N1bWVudHMpLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICBzZWxmLl9zZXJ2ZXJEb2N1bWVudHNbY29sbGVjdGlvbl0uZm9yRWFjaChzZXJ2ZXJEb2MgPT4ge1xuICAgICAgICBjb25zdCB3cml0dGVuQnlTdHViRm9yQU1ldGhvZFdpdGhTZW50TWVzc2FnZSA9XG4gICAgICAgICAga2V5cyhzZXJ2ZXJEb2Mud3JpdHRlbkJ5U3R1YnMpLnNvbWUobWV0aG9kSWQgPT4ge1xuICAgICAgICAgICAgdmFyIGludm9rZXIgPSBzZWxmLl9tZXRob2RJbnZva2Vyc1ttZXRob2RJZF07XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlciAmJiBpbnZva2VyLnNlbnRNZXNzYWdlO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh3cml0dGVuQnlTdHViRm9yQU1ldGhvZFdpdGhTZW50TWVzc2FnZSkge1xuICAgICAgICAgICsrdW5mbHVzaGVkU2VydmVyRG9jQ291bnQ7XG4gICAgICAgICAgc2VydmVyRG9jLmZsdXNoQ2FsbGJhY2tzLnB1c2gob25TZXJ2ZXJEb2NGbHVzaCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGlmICh1bmZsdXNoZWRTZXJ2ZXJEb2NDb3VudCA9PT0gMCkge1xuICAgICAgLy8gVGhlcmUgYXJlbid0IGFueSBidWZmZXJlZCBkb2NzIC0tLSB3ZSBjYW4gY2FsbCBmIGFzIHNvb24gYXMgdGhlIGN1cnJlbnRcbiAgICAgIC8vIHJvdW5kIG9mIHVwZGF0ZXMgaXMgYXBwbGllZCFcbiAgICAgIHJ1bkZBZnRlclVwZGF0ZXMoKTtcbiAgICB9XG4gIH1cblxuICBfbGl2ZWRhdGFfbm9zdWIobXNnKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gRmlyc3QgcGFzcyBpdCB0aHJvdWdoIF9saXZlZGF0YV9kYXRhLCB3aGljaCBvbmx5IHVzZXMgaXQgdG8gaGVscCBnZXRcbiAgICAvLyB0b3dhcmRzIHF1aWVzY2VuY2UuXG4gICAgc2VsZi5fbGl2ZWRhdGFfZGF0YShtc2cpO1xuXG4gICAgLy8gRG8gdGhlIHJlc3Qgb2Ygb3VyIHByb2Nlc3NpbmcgaW1tZWRpYXRlbHksIHdpdGggbm9cbiAgICAvLyBidWZmZXJpbmctdW50aWwtcXVpZXNjZW5jZS5cblxuICAgIC8vIHdlIHdlcmVuJ3Qgc3ViYmVkIGFueXdheSwgb3Igd2UgaW5pdGlhdGVkIHRoZSB1bnN1Yi5cbiAgICBpZiAoISBoYXNPd24uY2FsbChzZWxmLl9zdWJzY3JpcHRpb25zLCBtc2cuaWQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gWFhYIENPTVBBVCBXSVRIIDEuMC4zLjEgI2Vycm9yQ2FsbGJhY2tcbiAgICB2YXIgZXJyb3JDYWxsYmFjayA9IHNlbGYuX3N1YnNjcmlwdGlvbnNbbXNnLmlkXS5lcnJvckNhbGxiYWNrO1xuICAgIHZhciBzdG9wQ2FsbGJhY2sgPSBzZWxmLl9zdWJzY3JpcHRpb25zW21zZy5pZF0uc3RvcENhbGxiYWNrO1xuXG4gICAgc2VsZi5fc3Vic2NyaXB0aW9uc1ttc2cuaWRdLnJlbW92ZSgpO1xuXG4gICAgdmFyIG1ldGVvckVycm9yRnJvbU1zZyA9IG1zZ0FyZyA9PiB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBtc2dBcmcgJiZcbiAgICAgICAgbXNnQXJnLmVycm9yICYmXG4gICAgICAgIG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAgICAgbXNnQXJnLmVycm9yLmVycm9yLFxuICAgICAgICAgIG1zZ0FyZy5lcnJvci5yZWFzb24sXG4gICAgICAgICAgbXNnQXJnLmVycm9yLmRldGFpbHNcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgLy8gWFhYIENPTVBBVCBXSVRIIDEuMC4zLjEgI2Vycm9yQ2FsbGJhY2tcbiAgICBpZiAoZXJyb3JDYWxsYmFjayAmJiBtc2cuZXJyb3IpIHtcbiAgICAgIGVycm9yQ2FsbGJhY2sobWV0ZW9yRXJyb3JGcm9tTXNnKG1zZykpO1xuICAgIH1cblxuICAgIGlmIChzdG9wQ2FsbGJhY2spIHtcbiAgICAgIHN0b3BDYWxsYmFjayhtZXRlb3JFcnJvckZyb21Nc2cobXNnKSk7XG4gICAgfVxuICB9XG5cbiAgX2xpdmVkYXRhX3Jlc3VsdChtc2cpIHtcbiAgICAvLyBpZCwgcmVzdWx0IG9yIGVycm9yLiBlcnJvciBoYXMgZXJyb3IgKGNvZGUpLCByZWFzb24sIGRldGFpbHNcblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIExldHMgbWFrZSBzdXJlIHRoZXJlIGFyZSBubyBidWZmZXJlZCB3cml0ZXMgYmVmb3JlIHJldHVybmluZyByZXN1bHQuXG4gICAgaWYgKCEgaXNFbXB0eShzZWxmLl9idWZmZXJlZFdyaXRlcykpIHtcbiAgICAgIHNlbGYuX2ZsdXNoQnVmZmVyZWRXcml0ZXMoKTtcbiAgICB9XG5cbiAgICAvLyBmaW5kIHRoZSBvdXRzdGFuZGluZyByZXF1ZXN0XG4gICAgLy8gc2hvdWxkIGJlIE8oMSkgaW4gbmVhcmx5IGFsbCByZWFsaXN0aWMgdXNlIGNhc2VzXG4gICAgaWYgKGlzRW1wdHkoc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MpKSB7XG4gICAgICBNZXRlb3IuX2RlYnVnKCdSZWNlaXZlZCBtZXRob2QgcmVzdWx0IGJ1dCBubyBtZXRob2RzIG91dHN0YW5kaW5nJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjdXJyZW50TWV0aG9kQmxvY2sgPSBzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrc1swXS5tZXRob2RzO1xuICAgIHZhciBtO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VycmVudE1ldGhvZEJsb2NrLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtID0gY3VycmVudE1ldGhvZEJsb2NrW2ldO1xuICAgICAgaWYgKG0ubWV0aG9kSWQgPT09IG1zZy5pZCkgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCFtKSB7XG4gICAgICBNZXRlb3IuX2RlYnVnKFwiQ2FuJ3QgbWF0Y2ggbWV0aG9kIHJlc3BvbnNlIHRvIG9yaWdpbmFsIG1ldGhvZCBjYWxsXCIsIG1zZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGZyb20gY3VycmVudCBtZXRob2QgYmxvY2suIFRoaXMgbWF5IGxlYXZlIHRoZSBibG9jayBlbXB0eSwgYnV0IHdlXG4gICAgLy8gZG9uJ3QgbW92ZSBvbiB0byB0aGUgbmV4dCBibG9jayB1bnRpbCB0aGUgY2FsbGJhY2sgaGFzIGJlZW4gZGVsaXZlcmVkLCBpblxuICAgIC8vIF9vdXRzdGFuZGluZ01ldGhvZEZpbmlzaGVkLlxuICAgIGN1cnJlbnRNZXRob2RCbG9jay5zcGxpY2UoaSwgMSk7XG5cbiAgICBpZiAoaGFzT3duLmNhbGwobXNnLCAnZXJyb3InKSkge1xuICAgICAgbS5yZWNlaXZlUmVzdWx0KFxuICAgICAgICBuZXcgTWV0ZW9yLkVycm9yKG1zZy5lcnJvci5lcnJvciwgbXNnLmVycm9yLnJlYXNvbiwgbXNnLmVycm9yLmRldGFpbHMpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBtc2cucmVzdWx0IG1heSBiZSB1bmRlZmluZWQgaWYgdGhlIG1ldGhvZCBkaWRuJ3QgcmV0dXJuIGFcbiAgICAgIC8vIHZhbHVlXG4gICAgICBtLnJlY2VpdmVSZXN1bHQodW5kZWZpbmVkLCBtc2cucmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxsZWQgYnkgTWV0aG9kSW52b2tlciBhZnRlciBhIG1ldGhvZCdzIGNhbGxiYWNrIGlzIGludm9rZWQuICBJZiB0aGlzIHdhc1xuICAvLyB0aGUgbGFzdCBvdXRzdGFuZGluZyBtZXRob2QgaW4gdGhlIGN1cnJlbnQgYmxvY2ssIHJ1bnMgdGhlIG5leHQgYmxvY2suIElmXG4gIC8vIHRoZXJlIGFyZSBubyBtb3JlIG1ldGhvZHMsIGNvbnNpZGVyIGFjY2VwdGluZyBhIGhvdCBjb2RlIHB1c2guXG4gIF9vdXRzdGFuZGluZ01ldGhvZEZpbmlzaGVkKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5fYW55TWV0aG9kc0FyZU91dHN0YW5kaW5nKCkpIHJldHVybjtcblxuICAgIC8vIE5vIG1ldGhvZHMgYXJlIG91dHN0YW5kaW5nLiBUaGlzIHNob3VsZCBtZWFuIHRoYXQgdGhlIGZpcnN0IGJsb2NrIG9mXG4gICAgLy8gbWV0aG9kcyBpcyBlbXB0eS4gKE9yIGl0IG1pZ2h0IG5vdCBleGlzdCwgaWYgdGhpcyB3YXMgYSBtZXRob2QgdGhhdFxuICAgIC8vIGhhbGYtZmluaXNoZWQgYmVmb3JlIGRpc2Nvbm5lY3QvcmVjb25uZWN0LilcbiAgICBpZiAoISBpc0VtcHR5KHNlbGYuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzKSkge1xuICAgICAgdmFyIGZpcnN0QmxvY2sgPSBzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrcy5zaGlmdCgpO1xuICAgICAgaWYgKCEgaXNFbXB0eShmaXJzdEJsb2NrLm1ldGhvZHMpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ05vIG1ldGhvZHMgb3V0c3RhbmRpbmcgYnV0IG5vbmVtcHR5IGJsb2NrOiAnICtcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGZpcnN0QmxvY2spXG4gICAgICAgICk7XG5cbiAgICAgIC8vIFNlbmQgdGhlIG91dHN0YW5kaW5nIG1ldGhvZHMgbm93IGluIHRoZSBmaXJzdCBibG9jay5cbiAgICAgIGlmICghIGlzRW1wdHkoc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MpKVxuICAgICAgICBzZWxmLl9zZW5kT3V0c3RhbmRpbmdNZXRob2RzKCk7XG4gICAgfVxuXG4gICAgLy8gTWF5YmUgYWNjZXB0IGEgaG90IGNvZGUgcHVzaC5cbiAgICBzZWxmLl9tYXliZU1pZ3JhdGUoKTtcbiAgfVxuXG4gIC8vIFNlbmRzIG1lc3NhZ2VzIGZvciBhbGwgdGhlIG1ldGhvZHMgaW4gdGhlIGZpcnN0IGJsb2NrIGluXG4gIC8vIF9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrcy5cbiAgX3NlbmRPdXRzdGFuZGluZ01ldGhvZHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKGlzRW1wdHkoc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3NbMF0ubWV0aG9kcy5mb3JFYWNoKG0gPT4ge1xuICAgICAgbS5zZW5kTWVzc2FnZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgX2xpdmVkYXRhX2Vycm9yKG1zZykge1xuICAgIE1ldGVvci5fZGVidWcoJ1JlY2VpdmVkIGVycm9yIGZyb20gc2VydmVyOiAnLCBtc2cucmVhc29uKTtcbiAgICBpZiAobXNnLm9mZmVuZGluZ01lc3NhZ2UpIE1ldGVvci5fZGVidWcoJ0ZvcjogJywgbXNnLm9mZmVuZGluZ01lc3NhZ2UpO1xuICB9XG5cbiAgX2NhbGxPblJlY29ubmVjdEFuZFNlbmRBcHByb3ByaWF0ZU91dHN0YW5kaW5nTWV0aG9kcygpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG9sZE91dHN0YW5kaW5nTWV0aG9kQmxvY2tzID0gc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3M7XG4gICAgc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MgPSBbXTtcblxuICAgIHNlbGYub25SZWNvbm5lY3QgJiYgc2VsZi5vblJlY29ubmVjdCgpO1xuICAgIEREUC5fcmVjb25uZWN0SG9vay5lYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgIGNhbGxiYWNrKHNlbGYpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoaXNFbXB0eShvbGRPdXRzdGFuZGluZ01ldGhvZEJsb2NrcykpIHJldHVybjtcblxuICAgIC8vIFdlIGhhdmUgYXQgbGVhc3Qgb25lIGJsb2NrIHdvcnRoIG9mIG9sZCBvdXRzdGFuZGluZyBtZXRob2RzIHRvIHRyeVxuICAgIC8vIGFnYWluLiBGaXJzdDogZGlkIG9uUmVjb25uZWN0IGFjdHVhbGx5IHNlbmQgYW55dGhpbmc/IElmIG5vdCwgd2UganVzdFxuICAgIC8vIHJlc3RvcmUgYWxsIG91dHN0YW5kaW5nIG1ldGhvZHMgYW5kIHJ1biB0aGUgZmlyc3QgYmxvY2suXG4gICAgaWYgKGlzRW1wdHkoc2VsZi5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MpKSB7XG4gICAgICBzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2NrcyA9IG9sZE91dHN0YW5kaW5nTWV0aG9kQmxvY2tzO1xuICAgICAgc2VsZi5fc2VuZE91dHN0YW5kaW5nTWV0aG9kcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE9LLCB0aGVyZSBhcmUgYmxvY2tzIG9uIGJvdGggc2lkZXMuIFNwZWNpYWwgY2FzZTogbWVyZ2UgdGhlIGxhc3QgYmxvY2sgb2ZcbiAgICAvLyB0aGUgcmVjb25uZWN0IG1ldGhvZHMgd2l0aCB0aGUgZmlyc3QgYmxvY2sgb2YgdGhlIG9yaWdpbmFsIG1ldGhvZHMsIGlmXG4gICAgLy8gbmVpdGhlciBvZiB0aGVtIGFyZSBcIndhaXRcIiBibG9ja3MuXG4gICAgaWYgKCEgbGFzdChzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrcykud2FpdCAmJlxuICAgICAgICAhIG9sZE91dHN0YW5kaW5nTWV0aG9kQmxvY2tzWzBdLndhaXQpIHtcbiAgICAgIG9sZE91dHN0YW5kaW5nTWV0aG9kQmxvY2tzWzBdLm1ldGhvZHMuZm9yRWFjaChtID0+IHtcbiAgICAgICAgbGFzdChzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2NrcykubWV0aG9kcy5wdXNoKG0pO1xuXG4gICAgICAgIC8vIElmIHRoaXMgXCJsYXN0IGJsb2NrXCIgaXMgYWxzbyB0aGUgZmlyc3QgYmxvY2ssIHNlbmQgdGhlIG1lc3NhZ2UuXG4gICAgICAgIGlmIChzZWxmLl9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICBtLnNlbmRNZXNzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBvbGRPdXRzdGFuZGluZ01ldGhvZEJsb2Nrcy5zaGlmdCgpO1xuICAgIH1cblxuICAgIC8vIE5vdyBhZGQgdGhlIHJlc3Qgb2YgdGhlIG9yaWdpbmFsIGJsb2NrcyBvbi5cbiAgICBvbGRPdXRzdGFuZGluZ01ldGhvZEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgIHNlbGYuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzLnB1c2goYmxvY2spO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gV2UgY2FuIGFjY2VwdCBhIGhvdCBjb2RlIHB1c2ggaWYgdGhlcmUgYXJlIG5vIG1ldGhvZHMgaW4gZmxpZ2h0LlxuICBfcmVhZHlUb01pZ3JhdGUoKSB7XG4gICAgcmV0dXJuIGlzRW1wdHkodGhpcy5fbWV0aG9kSW52b2tlcnMpO1xuICB9XG5cbiAgLy8gSWYgd2Ugd2VyZSBibG9ja2luZyBhIG1pZ3JhdGlvbiwgc2VlIGlmIGl0J3Mgbm93IHBvc3NpYmxlIHRvIGNvbnRpbnVlLlxuICAvLyBDYWxsIHdoZW5ldmVyIHRoZSBzZXQgb2Ygb3V0c3RhbmRpbmcvYmxvY2tlZCBtZXRob2RzIHNocmlua3MuXG4gIF9tYXliZU1pZ3JhdGUoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9yZXRyeU1pZ3JhdGUgJiYgc2VsZi5fcmVhZHlUb01pZ3JhdGUoKSkge1xuICAgICAgc2VsZi5fcmV0cnlNaWdyYXRlKCk7XG4gICAgICBzZWxmLl9yZXRyeU1pZ3JhdGUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIG9uTWVzc2FnZShyYXdfbXNnKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBtc2cgPSBERFBDb21tb24ucGFyc2VERFAocmF3X21zZyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZygnRXhjZXB0aW9uIHdoaWxlIHBhcnNpbmcgRERQJywgZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQW55IG1lc3NhZ2UgY291bnRzIGFzIHJlY2VpdmluZyBhIHBvbmcsIGFzIGl0IGRlbW9uc3RyYXRlcyB0aGF0XG4gICAgLy8gdGhlIHNlcnZlciBpcyBzdGlsbCBhbGl2ZS5cbiAgICBpZiAodGhpcy5faGVhcnRiZWF0KSB7XG4gICAgICB0aGlzLl9oZWFydGJlYXQubWVzc2FnZVJlY2VpdmVkKCk7XG4gICAgfVxuXG4gICAgaWYgKG1zZyA9PT0gbnVsbCB8fCAhbXNnLm1zZykge1xuICAgICAgLy8gWFhYIENPTVBBVCBXSVRIIDAuNi42LiBpZ25vcmUgdGhlIG9sZCB3ZWxjb21lIG1lc3NhZ2UgZm9yIGJhY2tcbiAgICAgIC8vIGNvbXBhdC4gIFJlbW92ZSB0aGlzICdpZicgb25jZSB0aGUgc2VydmVyIHN0b3BzIHNlbmRpbmcgd2VsY29tZVxuICAgICAgLy8gbWVzc2FnZXMgKHN0cmVhbV9zZXJ2ZXIuanMpLlxuICAgICAgaWYgKCEobXNnICYmIG1zZy5zZXJ2ZXJfaWQpKVxuICAgICAgICBNZXRlb3IuX2RlYnVnKCdkaXNjYXJkaW5nIGludmFsaWQgbGl2ZWRhdGEgbWVzc2FnZScsIG1zZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG1zZy5tc2cgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICB0aGlzLl92ZXJzaW9uID0gdGhpcy5fdmVyc2lvblN1Z2dlc3Rpb247XG4gICAgICB0aGlzLl9saXZlZGF0YV9jb25uZWN0ZWQobXNnKTtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkNvbm5lY3RlZCgpO1xuICAgIH0gZWxzZSBpZiAobXNnLm1zZyA9PT0gJ2ZhaWxlZCcpIHtcbiAgICAgIGlmICh0aGlzLl9zdXBwb3J0ZWRERFBWZXJzaW9ucy5pbmRleE9mKG1zZy52ZXJzaW9uKSA+PSAwKSB7XG4gICAgICAgIHRoaXMuX3ZlcnNpb25TdWdnZXN0aW9uID0gbXNnLnZlcnNpb247XG4gICAgICAgIHRoaXMuX3N0cmVhbS5yZWNvbm5lY3QoeyBfZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGVzY3JpcHRpb24gPVxuICAgICAgICAgICdERFAgdmVyc2lvbiBuZWdvdGlhdGlvbiBmYWlsZWQ7IHNlcnZlciByZXF1ZXN0ZWQgdmVyc2lvbiAnICtcbiAgICAgICAgICBtc2cudmVyc2lvbjtcbiAgICAgICAgdGhpcy5fc3RyZWFtLmRpc2Nvbm5lY3QoeyBfcGVybWFuZW50OiB0cnVlLCBfZXJyb3I6IGRlc2NyaXB0aW9uIH0pO1xuICAgICAgICB0aGlzLm9wdGlvbnMub25ERFBWZXJzaW9uTmVnb3RpYXRpb25GYWlsdXJlKGRlc2NyaXB0aW9uKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1zZy5tc2cgPT09ICdwaW5nJyAmJiB0aGlzLm9wdGlvbnMucmVzcG9uZFRvUGluZ3MpIHtcbiAgICAgIHRoaXMuX3NlbmQoeyBtc2c6ICdwb25nJywgaWQ6IG1zZy5pZCB9KTtcbiAgICB9IGVsc2UgaWYgKG1zZy5tc2cgPT09ICdwb25nJykge1xuICAgICAgLy8gbm9vcCwgYXMgd2UgYXNzdW1lIGV2ZXJ5dGhpbmcncyBhIHBvbmdcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgWydhZGRlZCcsICdjaGFuZ2VkJywgJ3JlbW92ZWQnLCAncmVhZHknLCAndXBkYXRlZCddLmluY2x1ZGVzKG1zZy5tc2cpXG4gICAgKSB7XG4gICAgICB0aGlzLl9saXZlZGF0YV9kYXRhKG1zZyk7XG4gICAgfSBlbHNlIGlmIChtc2cubXNnID09PSAnbm9zdWInKSB7XG4gICAgICB0aGlzLl9saXZlZGF0YV9ub3N1Yihtc2cpO1xuICAgIH0gZWxzZSBpZiAobXNnLm1zZyA9PT0gJ3Jlc3VsdCcpIHtcbiAgICAgIHRoaXMuX2xpdmVkYXRhX3Jlc3VsdChtc2cpO1xuICAgIH0gZWxzZSBpZiAobXNnLm1zZyA9PT0gJ2Vycm9yJykge1xuICAgICAgdGhpcy5fbGl2ZWRhdGFfZXJyb3IobXNnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZygnZGlzY2FyZGluZyB1bmtub3duIGxpdmVkYXRhIG1lc3NhZ2UgdHlwZScsIG1zZyk7XG4gICAgfVxuICB9XG5cbiAgb25SZXNldCgpIHtcbiAgICAvLyBTZW5kIGEgY29ubmVjdCBtZXNzYWdlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmVhbS5cbiAgICAvLyBOT1RFOiByZXNldCBpcyBjYWxsZWQgZXZlbiBvbiB0aGUgZmlyc3QgY29ubmVjdGlvbiwgc28gdGhpcyBpc1xuICAgIC8vIHRoZSBvbmx5IHBsYWNlIHdlIHNlbmQgdGhpcyBtZXNzYWdlLlxuICAgIHZhciBtc2cgPSB7IG1zZzogJ2Nvbm5lY3QnIH07XG4gICAgaWYgKHRoaXMuX2xhc3RTZXNzaW9uSWQpIG1zZy5zZXNzaW9uID0gdGhpcy5fbGFzdFNlc3Npb25JZDtcbiAgICBtc2cudmVyc2lvbiA9IHRoaXMuX3ZlcnNpb25TdWdnZXN0aW9uIHx8IHRoaXMuX3N1cHBvcnRlZEREUFZlcnNpb25zWzBdO1xuICAgIHRoaXMuX3ZlcnNpb25TdWdnZXN0aW9uID0gbXNnLnZlcnNpb247XG4gICAgbXNnLnN1cHBvcnQgPSB0aGlzLl9zdXBwb3J0ZWRERFBWZXJzaW9ucztcbiAgICB0aGlzLl9zZW5kKG1zZyk7XG5cbiAgICAvLyBNYXJrIG5vbi1yZXRyeSBjYWxscyBhcyBmYWlsZWQuIFRoaXMgaGFzIHRvIGJlIGRvbmUgZWFybHkgYXMgZ2V0dGluZyB0aGVzZSBtZXRob2RzIG91dCBvZiB0aGVcbiAgICAvLyBjdXJyZW50IGJsb2NrIGlzIHByZXR0eSBpbXBvcnRhbnQgdG8gbWFraW5nIHN1cmUgdGhhdCBxdWllc2NlbmNlIGlzIHByb3Blcmx5IGNhbGN1bGF0ZWQsIGFzXG4gICAgLy8gd2VsbCBhcyBwb3NzaWJseSBtb3Zpbmcgb24gdG8gYW5vdGhlciB1c2VmdWwgYmxvY2suXG5cbiAgICAvLyBPbmx5IGJvdGhlciB0ZXN0aW5nIGlmIHRoZXJlIGlzIGFuIG91dHN0YW5kaW5nTWV0aG9kQmxvY2sgKHRoZXJlIG1pZ2h0IG5vdCBiZSwgZXNwZWNpYWxseSBpZlxuICAgIC8vIHdlIGFyZSBjb25uZWN0aW5nIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICBpZiAodGhpcy5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MubGVuZ3RoID4gMCkge1xuICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gb3V0c3RhbmRpbmcgbWV0aG9kIGJsb2NrLCB3ZSBvbmx5IGNhcmUgYWJvdXQgdGhlIGZpcnN0IG9uZSBhcyB0aGF0IGlzIHRoZVxuICAgICAgLy8gb25lIHRoYXQgY291bGQgaGF2ZSBhbHJlYWR5IHNlbnQgbWVzc2FnZXMgd2l0aCBubyByZXNwb25zZSwgdGhhdCBhcmUgbm90IGFsbG93ZWQgdG8gcmV0cnkuXG4gICAgICBjb25zdCBjdXJyZW50TWV0aG9kQmxvY2sgPSB0aGlzLl9vdXRzdGFuZGluZ01ldGhvZEJsb2Nrc1swXS5tZXRob2RzO1xuICAgICAgdGhpcy5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3NbMF0ubWV0aG9kcyA9IGN1cnJlbnRNZXRob2RCbG9jay5maWx0ZXIoXG4gICAgICAgIG1ldGhvZEludm9rZXIgPT4ge1xuICAgICAgICAgIC8vIE1ldGhvZHMgd2l0aCAnbm9SZXRyeScgb3B0aW9uIHNldCBhcmUgbm90IGFsbG93ZWQgdG8gcmUtc2VuZCBhZnRlclxuICAgICAgICAgIC8vIHJlY292ZXJpbmcgZHJvcHBlZCBjb25uZWN0aW9uLlxuICAgICAgICAgIGlmIChtZXRob2RJbnZva2VyLnNlbnRNZXNzYWdlICYmIG1ldGhvZEludm9rZXIubm9SZXRyeSkge1xuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG1ldGhvZCBpcyB0b2xkIHRoYXQgaXQgZmFpbGVkLlxuICAgICAgICAgICAgbWV0aG9kSW52b2tlci5yZWNlaXZlUmVzdWx0KFxuICAgICAgICAgICAgICBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgICAgICAgICAgICdpbnZvY2F0aW9uLWZhaWxlZCcsXG4gICAgICAgICAgICAgICAgJ01ldGhvZCBpbnZvY2F0aW9uIG1pZ2h0IGhhdmUgZmFpbGVkIGR1ZSB0byBkcm9wcGVkIGNvbm5lY3Rpb24uICcgK1xuICAgICAgICAgICAgICAgICAgJ0ZhaWxpbmcgYmVjYXVzZSBgbm9SZXRyeWAgb3B0aW9uIHdhcyBwYXNzZWQgdG8gTWV0ZW9yLmFwcGx5LidcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBPbmx5IGtlZXAgYSBtZXRob2QgaWYgaXQgd2Fzbid0IHNlbnQgb3IgaXQncyBhbGxvd2VkIHRvIHJldHJ5LlxuICAgICAgICAgIC8vIFRoaXMgbWF5IGxlYXZlIHRoZSBibG9jayBlbXB0eSwgYnV0IHdlIGRvbid0IG1vdmUgb24gdG8gdGhlIG5leHRcbiAgICAgICAgICAvLyBibG9jayB1bnRpbCB0aGUgY2FsbGJhY2sgaGFzIGJlZW4gZGVsaXZlcmVkLCBpbiBfb3V0c3RhbmRpbmdNZXRob2RGaW5pc2hlZC5cbiAgICAgICAgICByZXR1cm4gIShtZXRob2RJbnZva2VyLnNlbnRNZXNzYWdlICYmIG1ldGhvZEludm9rZXIubm9SZXRyeSk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gTm93LCB0byBtaW5pbWl6ZSBzZXR1cCBsYXRlbmN5LCBnbyBhaGVhZCBhbmQgYmxhc3Qgb3V0IGFsbCBvZlxuICAgIC8vIG91ciBwZW5kaW5nIG1ldGhvZHMgYW5kcyBzdWJzY3JpcHRpb25zIGJlZm9yZSB3ZSd2ZSBldmVuIHRha2VuXG4gICAgLy8gdGhlIG5lY2Vzc2FyeSBSVFQgdG8ga25vdyBpZiB3ZSBzdWNjZXNzZnVsbHkgcmVjb25uZWN0ZWQuICgxKVxuICAgIC8vIFRoZXkncmUgc3VwcG9zZWQgdG8gYmUgaWRlbXBvdGVudCwgYW5kIHdoZXJlIHRoZXkgYXJlIG5vdCxcbiAgICAvLyB0aGV5IGNhbiBibG9jayByZXRyeSBpbiBhcHBseTsgKDIpIGV2ZW4gaWYgd2UgZGlkIHJlY29ubmVjdCxcbiAgICAvLyB3ZSdyZSBub3Qgc3VyZSB3aGF0IG1lc3NhZ2VzIG1pZ2h0IGhhdmUgZ290dGVuIGxvc3RcbiAgICAvLyAoaW4gZWl0aGVyIGRpcmVjdGlvbikgc2luY2Ugd2Ugd2VyZSBkaXNjb25uZWN0ZWQgKFRDUCBiZWluZ1xuICAgIC8vIHNsb3BweSBhYm91dCB0aGF0LilcblxuICAgIC8vIElmIHRoZSBjdXJyZW50IGJsb2NrIG9mIG1ldGhvZHMgYWxsIGdvdCB0aGVpciByZXN1bHRzIChidXQgZGlkbid0IGFsbCBnZXRcbiAgICAvLyB0aGVpciBkYXRhIHZpc2libGUpLCBkaXNjYXJkIHRoZSBlbXB0eSBibG9jayBub3cuXG4gICAgaWYgKFxuICAgICAgdGhpcy5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3MubGVuZ3RoID4gMCAmJlxuICAgICAgdGhpcy5fb3V0c3RhbmRpbmdNZXRob2RCbG9ja3NbMF0ubWV0aG9kcy5sZW5ndGggPT09IDBcbiAgICApIHtcbiAgICAgIHRoaXMuX291dHN0YW5kaW5nTWV0aG9kQmxvY2tzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgLy8gTWFyayBhbGwgbWVzc2FnZXMgYXMgdW5zZW50LCB0aGV5IGhhdmUgbm90IHlldCBiZWVuIHNlbnQgb24gdGhpc1xuICAgIC8vIGNvbm5lY3Rpb24uXG4gICAga2V5cyh0aGlzLl9tZXRob2RJbnZva2VycykuZm9yRWFjaChpZCA9PiB7XG4gICAgICB0aGlzLl9tZXRob2RJbnZva2Vyc1tpZF0uc2VudE1lc3NhZ2UgPSBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8vIElmIGFuIGBvblJlY29ubmVjdGAgaGFuZGxlciBpcyBzZXQsIGNhbGwgaXQgZmlyc3QuIEdvIHRocm91Z2hcbiAgICAvLyBzb21lIGhvb3BzIHRvIGVuc3VyZSB0aGF0IG1ldGhvZHMgdGhhdCBhcmUgY2FsbGVkIGZyb20gd2l0aGluXG4gICAgLy8gYG9uUmVjb25uZWN0YCBnZXQgZXhlY3V0ZWQgX2JlZm9yZV8gb25lcyB0aGF0IHdlcmUgb3JpZ2luYWxseVxuICAgIC8vIG91dHN0YW5kaW5nIChzaW5jZSBgb25SZWNvbm5lY3RgIGlzIHVzZWQgdG8gcmUtZXN0YWJsaXNoIGF1dGhcbiAgICAvLyBjZXJ0aWZpY2F0ZXMpXG4gICAgdGhpcy5fY2FsbE9uUmVjb25uZWN0QW5kU2VuZEFwcHJvcHJpYXRlT3V0c3RhbmRpbmdNZXRob2RzKCk7XG5cbiAgICAvLyBhZGQgbmV3IHN1YnNjcmlwdGlvbnMgYXQgdGhlIGVuZC4gdGhpcyB3YXkgdGhleSB0YWtlIGVmZmVjdCBhZnRlclxuICAgIC8vIHRoZSBoYW5kbGVycyBhbmQgd2UgZG9uJ3Qgc2VlIGZsaWNrZXIuXG4gICAga2V5cyh0aGlzLl9zdWJzY3JpcHRpb25zKS5mb3JFYWNoKGlkID0+IHtcbiAgICAgIGNvbnN0IHN1YiA9IHRoaXMuX3N1YnNjcmlwdGlvbnNbaWRdO1xuICAgICAgdGhpcy5fc2VuZCh7XG4gICAgICAgIG1zZzogJ3N1YicsXG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgbmFtZTogc3ViLm5hbWUsXG4gICAgICAgIHBhcmFtczogc3ViLnBhcmFtc1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEREUENvbW1vbiB9IGZyb20gJ21ldGVvci9kZHAtY29tbW9uJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsga2V5cyB9IGZyb20gXCJtZXRlb3IvZGRwLWNvbW1vbi91dGlscy5qc1wiO1xuXG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSAnLi9saXZlZGF0YV9jb25uZWN0aW9uLmpzJztcblxuLy8gVGhpcyBhcnJheSBhbGxvd3MgdGhlIGBfYWxsU3Vic2NyaXB0aW9uc1JlYWR5YCBtZXRob2QgYmVsb3csIHdoaWNoXG4vLyBpcyB1c2VkIGJ5IHRoZSBgc3BpZGVyYWJsZWAgcGFja2FnZSwgdG8ga2VlcCB0cmFjayBvZiB3aGV0aGVyIGFsbFxuLy8gZGF0YSBpcyByZWFkeS5cbmNvbnN0IGFsbENvbm5lY3Rpb25zID0gW107XG5cbi8qKlxuICogQG5hbWVzcGFjZSBERFBcbiAqIEBzdW1tYXJ5IE5hbWVzcGFjZSBmb3IgRERQLXJlbGF0ZWQgbWV0aG9kcy9jbGFzc2VzLlxuICovXG5leHBvcnQgY29uc3QgRERQID0ge307XG5cbi8vIFRoaXMgaXMgcHJpdmF0ZSBidXQgaXQncyB1c2VkIGluIGEgZmV3IHBsYWNlcy4gYWNjb3VudHMtYmFzZSB1c2VzXG4vLyBpdCB0byBnZXQgdGhlIGN1cnJlbnQgdXNlci4gTWV0ZW9yLnNldFRpbWVvdXQgYW5kIGZyaWVuZHMgY2xlYXJcbi8vIGl0LiBXZSBjYW4gcHJvYmFibHkgZmluZCBhIGJldHRlciB3YXkgdG8gZmFjdG9yIHRoaXMuXG5ERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uID0gbmV3IE1ldGVvci5FbnZpcm9ubWVudFZhcmlhYmxlKCk7XG5ERFAuX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24gPSBuZXcgTWV0ZW9yLkVudmlyb25tZW50VmFyaWFibGUoKTtcblxuLy8gWFhYOiBLZWVwIEREUC5fQ3VycmVudEludm9jYXRpb24gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5LlxuRERQLl9DdXJyZW50SW52b2NhdGlvbiA9IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb247XG5cbi8vIFRoaXMgaXMgcGFzc2VkIGludG8gYSB3ZWlyZCBgbWFrZUVycm9yVHlwZWAgZnVuY3Rpb24gdGhhdCBleHBlY3RzIGl0cyB0aGluZ1xuLy8gdG8gYmUgYSBjb25zdHJ1Y3RvclxuZnVuY3Rpb24gY29ubmVjdGlvbkVycm9yQ29uc3RydWN0b3IobWVzc2FnZSkge1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xufVxuXG5ERFAuQ29ubmVjdGlvbkVycm9yID0gTWV0ZW9yLm1ha2VFcnJvclR5cGUoXG4gICdERFAuQ29ubmVjdGlvbkVycm9yJyxcbiAgY29ubmVjdGlvbkVycm9yQ29uc3RydWN0b3Jcbik7XG5cbkREUC5Gb3JjZWRSZWNvbm5lY3RFcnJvciA9IE1ldGVvci5tYWtlRXJyb3JUeXBlKFxuICAnRERQLkZvcmNlZFJlY29ubmVjdEVycm9yJyxcbiAgKCkgPT4ge31cbik7XG5cbi8vIFJldHVybnMgdGhlIG5hbWVkIHNlcXVlbmNlIG9mIHBzZXVkby1yYW5kb20gdmFsdWVzLlxuLy8gVGhlIHNjb3BlIHdpbGwgYmUgRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbi5nZXQoKSwgc28gdGhlIHN0cmVhbSB3aWxsIHByb2R1Y2Vcbi8vIGNvbnNpc3RlbnQgdmFsdWVzIGZvciBtZXRob2QgY2FsbHMgb24gdGhlIGNsaWVudCBhbmQgc2VydmVyLlxuRERQLnJhbmRvbVN0cmVhbSA9IG5hbWUgPT4ge1xuICB2YXIgc2NvcGUgPSBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uLmdldCgpO1xuICByZXR1cm4gRERQQ29tbW9uLlJhbmRvbVN0cmVhbS5nZXQoc2NvcGUsIG5hbWUpO1xufTtcblxuLy8gQHBhcmFtIHVybCB7U3RyaW5nfSBVUkwgdG8gTWV0ZW9yIGFwcCxcbi8vICAgICBlLmcuOlxuLy8gICAgIFwic3ViZG9tYWluLm1ldGVvci5jb21cIixcbi8vICAgICBcImh0dHA6Ly9zdWJkb21haW4ubWV0ZW9yLmNvbVwiLFxuLy8gICAgIFwiL1wiLFxuLy8gICAgIFwiZGRwK3NvY2tqczovL2RkcC0tKioqKi1mb28ubWV0ZW9yLmNvbS9zb2NranNcIlxuXG4vKipcbiAqIEBzdW1tYXJ5IENvbm5lY3QgdG8gdGhlIHNlcnZlciBvZiBhIGRpZmZlcmVudCBNZXRlb3IgYXBwbGljYXRpb24gdG8gc3Vic2NyaWJlIHRvIGl0cyBkb2N1bWVudCBzZXRzIGFuZCBpbnZva2UgaXRzIHJlbW90ZSBtZXRob2RzLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSBVUkwgb2YgYW5vdGhlciBNZXRlb3IgYXBwbGljYXRpb24uXG4gKi9cbkREUC5jb25uZWN0ID0gKHVybCwgb3B0aW9ucykgPT4ge1xuICB2YXIgcmV0ID0gbmV3IENvbm5lY3Rpb24odXJsLCBvcHRpb25zKTtcbiAgYWxsQ29ubmVjdGlvbnMucHVzaChyZXQpOyAvLyBoYWNrLiBzZWUgYmVsb3cuXG4gIHJldHVybiByZXQ7XG59O1xuXG5ERFAuX3JlY29ubmVjdEhvb2sgPSBuZXcgSG9vayh7IGJpbmRFbnZpcm9ubWVudDogZmFsc2UgfSk7XG5cbi8qKlxuICogQHN1bW1hcnkgUmVnaXN0ZXIgYSBmdW5jdGlvbiB0byBjYWxsIGFzIHRoZSBmaXJzdCBzdGVwIG9mXG4gKiByZWNvbm5lY3RpbmcuIFRoaXMgZnVuY3Rpb24gY2FuIGNhbGwgbWV0aG9kcyB3aGljaCB3aWxsIGJlIGV4ZWN1dGVkIGJlZm9yZVxuICogYW55IG90aGVyIG91dHN0YW5kaW5nIG1ldGhvZHMuIEZvciBleGFtcGxlLCB0aGlzIGNhbiBiZSB1c2VkIHRvIHJlLWVzdGFibGlzaFxuICogdGhlIGFwcHJvcHJpYXRlIGF1dGhlbnRpY2F0aW9uIGNvbnRleHQgb24gdGhlIGNvbm5lY3Rpb24uXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBjYWxsLiBJdCB3aWxsIGJlIGNhbGxlZCB3aXRoIGFcbiAqIHNpbmdsZSBhcmd1bWVudCwgdGhlIFtjb25uZWN0aW9uIG9iamVjdF0oI2RkcF9jb25uZWN0KSB0aGF0IGlzIHJlY29ubmVjdGluZy5cbiAqL1xuRERQLm9uUmVjb25uZWN0ID0gY2FsbGJhY2sgPT4ge1xuICByZXR1cm4gRERQLl9yZWNvbm5lY3RIb29rLnJlZ2lzdGVyKGNhbGxiYWNrKTtcbn07XG5cbi8vIEhhY2sgZm9yIGBzcGlkZXJhYmxlYCBwYWNrYWdlOiBhIHdheSB0byBzZWUgaWYgdGhlIHBhZ2UgaXMgZG9uZVxuLy8gbG9hZGluZyBhbGwgdGhlIGRhdGEgaXQgbmVlZHMuXG4vL1xuRERQLl9hbGxTdWJzY3JpcHRpb25zUmVhZHkgPSAoKSA9PiB7XG4gIHJldHVybiBhbGxDb25uZWN0aW9ucy5ldmVyeShjb25uID0+IHtcbiAgICByZXR1cm4ga2V5cyhjb25uLl9zdWJzY3JpcHRpb25zKS5ldmVyeShpZCA9PiB7XG4gICAgICByZXR1cm4gY29ubi5fc3Vic2NyaXB0aW9uc1tpZF0ucmVhZHk7XG4gICAgfSk7XG4gIH0pO1xufTtcbiJdfQ==

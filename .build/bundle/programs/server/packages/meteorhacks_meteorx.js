(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var exposeLivedata, exposeMongoLivedata, Fibers, MeteorX;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/meteorhacks_meteorx/packages/meteorhacks_meteorx.js                                       //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/meteorhacks:meteorx/lib/livedata.js                                                 //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
exposeLivedata = function(namespace) {                                                          // 1
  //instrumenting session                                                                       // 2
  var fakeSocket = {send: function() {}, close: function() {}, headers: []};                    // 3
  var ddpConnectMessage = {msg: 'connect', version: 'pre1', support: ['pre1']};                 // 4
  Meteor.default_server._handleConnect(fakeSocket, ddpConnectMessage);                          // 5
                                                                                                // 6
  if(fakeSocket._meteorSession) { //for newer meteor versions                                   // 7
    namespace.Session = fakeSocket._meteorSession.constructor;                                  // 8
                                                                                                // 9
    exposeSubscription(fakeSocket._meteorSession, namespace);                                   // 10
    exposeSessionCollectionView(fakeSocket._meteorSession, namespace);                          // 11
                                                                                                // 12
    if(Meteor.default_server._closeSession) {                                                   // 13
      //0.7.x +                                                                                 // 14
      Meteor.default_server._closeSession(fakeSocket._meteorSession);                           // 15
    } else if(Meteor.default_server._destroySession) {                                          // 16
      //0.6.6.x                                                                                 // 17
      Meteor.default_server._destroySession(fakeSocket._meteorSession);                         // 18
    }                                                                                           // 19
  } else if(fakeSocket.meteor_session) { //support for 0.6.5.x                                  // 20
    namespace.Session = fakeSocket.meteor_session.constructor;                                  // 21
                                                                                                // 22
    //instrumenting subscription                                                                // 23
    exposeSubscription(fakeSocket.meteor_session, namespace);                                   // 24
    exposeSessionCollectionView(fakeSocket._meteorSession, namespace);                          // 25
                                                                                                // 26
    fakeSocket.meteor_session.detach(fakeSocket);                                               // 27
  } else {                                                                                      // 28
    console.error('expose: session exposing failed');                                           // 29
  }                                                                                             // 30
};                                                                                              // 31
                                                                                                // 32
function exposeSubscription(session, namespace) {                                               // 33
  var subId = Random.id();                                                                      // 34
  var publicationHandler = function() {this.ready()};                                           // 35
  var pubName = '__dummy_pub_' + Random.id();                                                   // 36
                                                                                                // 37
  session._startSubscription(publicationHandler, subId, [], pubName);                           // 38
  var subscription = session._namedSubs[subId];                                                 // 39
  namespace.Subscription = subscription.constructor;                                            // 40
                                                                                                // 41
  //cleaning up                                                                                 // 42
  session._stopSubscription(subId);                                                             // 43
}                                                                                               // 44
                                                                                                // 45
function exposeSessionCollectionView(session, namespace) {                                      // 46
  var documentView = session.getCollectionView();                                               // 47
  namespace.SessionCollectionView = documentView.constructor;                                   // 48
                                                                                                // 49
  var id = 'the-id';                                                                            // 50
  documentView.added('sample-handle', id, {aa: 10});                                            // 51
  namespace.SessionDocumentView = documentView.documents[id].constructor;                       // 52
}                                                                                               // 53
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/meteorhacks:meteorx/lib/mongo-livedata.js                                           //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
exposeMongoLivedata = function(namespace) {                                                     // 1
  var MongoColl = (typeof Mongo != "undefined")? Mongo.Collection: Meteor.Collection;           // 2
  var coll = new MongoColl('__dummy_coll_' + Random.id());                                      // 3
  //we need wait until db get connected with meteor, .findOne() does that                       // 4
  coll.findOne();                                                                               // 5
                                                                                                // 6
  namespace.MongoConnection = MongoInternals.defaultRemoteCollectionDriver().mongo.constructor; // 7
  var cursor = coll.find();                                                                     // 8
  namespace.MongoCursor = cursor.constructor;                                                   // 9
  exposeOplogDriver(namespace, coll);                                                           // 10
  exposePollingDriver(namespace, coll);                                                         // 11
  exposeMultiplexer(namespace, coll);                                                           // 12
}                                                                                               // 13
                                                                                                // 14
function exposeOplogDriver(namespace, coll) {                                                   // 15
  var driver = _getObserverDriver(coll.find({}));                                               // 16
  // verify observer driver is an oplog driver                                                  // 17
  if(driver && typeof driver.constructor.cursorSupported == 'function') {                       // 18
    namespace.MongoOplogDriver = driver.constructor;                                            // 19
  }                                                                                             // 20
}                                                                                               // 21
                                                                                                // 22
function exposePollingDriver(namespace, coll) {                                                 // 23
  var cursor = coll.find({}, {limit: 20, _disableOplog: true});                                 // 24
  var driver = _getObserverDriver(cursor);                                                      // 25
  // verify observer driver is a polling driver                                                 // 26
  if(driver && typeof driver.constructor.cursorSupported == 'undefined') {                      // 27
    namespace.MongoPollingDriver = driver.constructor;                                          // 28
  }                                                                                             // 29
}                                                                                               // 30
                                                                                                // 31
function exposeMultiplexer(namespace, coll) {                                                   // 32
  var multiplexer = _getMultiplexer(coll.find({}));                                             // 33
  if(multiplexer) {                                                                             // 34
    namespace.Multiplexer = multiplexer.constructor;                                            // 35
  }                                                                                             // 36
}                                                                                               // 37
                                                                                                // 38
function _getObserverDriver(cursor) {                                                           // 39
  var multiplexer = _getMultiplexer(cursor);                                                    // 40
  if(multiplexer && multiplexer._observeDriver) {                                               // 41
    return multiplexer._observeDriver;                                                          // 42
  }                                                                                             // 43
}                                                                                               // 44
                                                                                                // 45
function _getMultiplexer(cursor) {                                                              // 46
  var handler = cursor.observeChanges({added: Function.prototype});                             // 47
  handler.stop();                                                                               // 48
  return handler._multiplexer;                                                                  // 49
}                                                                                               // 50
                                                                                                // 51
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/meteorhacks:meteorx/lib/server.js                                                   //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
Fibers = Npm.require('fibers');                                                                 // 1
                                                                                                // 2
MeteorX = {};                                                                                   // 3
MeteorX._readyCallbacks = [];                                                                   // 4
MeteorX._ready = false;                                                                         // 5
                                                                                                // 6
MeteorX.onReady = function(cb) {                                                                // 7
  if(MeteorX._ready) return cb();                                                               // 8
                                                                                                // 9
  this._readyCallbacks.push(cb);                                                                // 10
};                                                                                              // 11
                                                                                                // 12
MeteorX.Server = Meteor.server.constructor;                                                     // 13
exposeLivedata(MeteorX);                                                                        // 14
                                                                                                // 15
// exposeMongoLivedata needs to wait until the DB is connecting                                 // 16
// But we don't need to wait other parts of the app for that                                    // 17
// That's why we've Meteor.onReady() callback                                                   // 18
Meteor.startup(function() {                                                                     // 19
  new Fibers(function() {                                                                       // 20
    exposeMongoLivedata(MeteorX);                                                               // 21
    MeteorX._readyCallbacks.forEach(function(fn) {                                              // 22
      fn();                                                                                     // 23
    });                                                                                         // 24
    MeteorX._ready = true;                                                                      // 25
  }).run();                                                                                     // 26
});                                                                                             // 27
                                                                                                // 28
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['meteorhacks:meteorx'] = {}, {
  MeteorX: MeteorX
});

})();

(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Autoupdate, ClientVersions;

var require = meteorInstall({"node_modules":{"meteor":{"autoupdate":{"autoupdate_server.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/autoupdate/autoupdate_server.js                                                                      //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
// Publish the current client versions to the client.  When a client
// sees the subscription change and that there is a new version of the
// client available on the server, it can reload.
//
// By default there are two current client versions. The refreshable client
// version is identified by a hash of the client resources seen by the browser
// that are refreshable, such as CSS, while the non refreshable client version
// is identified by a hash of the rest of the client assets
// (the HTML, code, and static files in the `public` directory).
//
// If the environment variable `AUTOUPDATE_VERSION` is set it will be
// used as the client id instead.  You can use this to control when
// the client reloads.  For example, if you want to only force a
// reload on major changes, you can use a custom AUTOUPDATE_VERSION
// which you only change when something worth pushing to clients
// immediately happens.
//
// The server publishes a `meteor_autoupdate_clientVersions`
// collection. There are two documents in this collection, a document
// with _id 'version' which represents the non refreshable client assets,
// and a document with _id 'version-refreshable' which represents the
// refreshable client assets. Each document has a 'version' field
// which is equivalent to the hash of the relevant assets. The refreshable
// document also contains a list of the refreshable assets, so that the client
// can swap in the new assets without forcing a page refresh. Clients can
// observe changes on these documents to detect when there is a new
// version available.
//
// In this implementation only two documents are present in the collection
// the current refreshable client version and the current nonRefreshable client
// version.  Developers can easily experiment with different versioning and
// updating models by forking this package.
var Future = Npm.require("fibers/future");

Autoupdate = {}; // The collection of acceptable client versions.

ClientVersions = new Mongo.Collection("meteor_autoupdate_clientVersions", {
  connection: null
}); // The client hash includes __meteor_runtime_config__, so wait until
// all packages have loaded and have had a chance to populate the
// runtime config before using the client hash as our default auto
// update version id.
// Note: Tests allow people to override Autoupdate.autoupdateVersion before
// startup.

Autoupdate.autoupdateVersion = null;
Autoupdate.autoupdateVersionRefreshable = null;
Autoupdate.autoupdateVersionCordova = null;
Autoupdate.appId = __meteor_runtime_config__.appId = process.env.APP_ID;
var syncQueue = new Meteor._SynchronousQueue(); // updateVersions can only be called after the server has fully loaded.

var updateVersions = function (shouldReloadClientProgram) {
  // Step 1: load the current client program on the server and update the
  // hash values in __meteor_runtime_config__.
  if (shouldReloadClientProgram) {
    WebAppInternals.reloadClientPrograms();
  } // If we just re-read the client program, or if we don't have an autoupdate
  // version, calculate it.


  if (shouldReloadClientProgram || Autoupdate.autoupdateVersion === null) {
    Autoupdate.autoupdateVersion = process.env.AUTOUPDATE_VERSION || WebApp.calculateClientHashNonRefreshable();
  } // If we just recalculated it OR if it was set by (eg) test-in-browser,
  // ensure it ends up in __meteor_runtime_config__.


  __meteor_runtime_config__.autoupdateVersion = Autoupdate.autoupdateVersion;
  Autoupdate.autoupdateVersionRefreshable = __meteor_runtime_config__.autoupdateVersionRefreshable = process.env.AUTOUPDATE_VERSION || WebApp.calculateClientHashRefreshable();
  Autoupdate.autoupdateVersionCordova = __meteor_runtime_config__.autoupdateVersionCordova = process.env.AUTOUPDATE_VERSION || WebApp.calculateClientHashCordova(); // Step 2: form the new client boilerplate which contains the updated
  // assets and __meteor_runtime_config__.

  if (shouldReloadClientProgram) {
    WebAppInternals.generateBoilerplate();
  } // XXX COMPAT WITH 0.8.3


  if (!ClientVersions.findOne({
    current: true
  })) {
    // To ensure apps with version of Meteor prior to 0.9.0 (in
    // which the structure of documents in `ClientVersions` was
    // different) also reload.
    ClientVersions.insert({
      current: true
    });
  }

  if (!ClientVersions.findOne({
    _id: "version"
  })) {
    ClientVersions.insert({
      _id: "version",
      version: Autoupdate.autoupdateVersion
    });
  } else {
    ClientVersions.update("version", {
      $set: {
        version: Autoupdate.autoupdateVersion
      }
    });
  }

  if (!ClientVersions.findOne({
    _id: "version-cordova"
  })) {
    ClientVersions.insert({
      _id: "version-cordova",
      version: Autoupdate.autoupdateVersionCordova,
      refreshable: false
    });
  } else {
    ClientVersions.update("version-cordova", {
      $set: {
        version: Autoupdate.autoupdateVersionCordova
      }
    });
  } // Use `onListening` here because we need to use
  // `WebAppInternals.refreshableAssets`, which is only set after
  // `WebApp.generateBoilerplate` is called by `main` in webapp.


  WebApp.onListening(function () {
    if (!ClientVersions.findOne({
      _id: "version-refreshable"
    })) {
      ClientVersions.insert({
        _id: "version-refreshable",
        version: Autoupdate.autoupdateVersionRefreshable,
        assets: WebAppInternals.refreshableAssets
      });
    } else {
      ClientVersions.update("version-refreshable", {
        $set: {
          version: Autoupdate.autoupdateVersionRefreshable,
          assets: WebAppInternals.refreshableAssets
        }
      });
    }
  });
};

Meteor.publish("meteor_autoupdate_clientVersions", function (appId) {
  // `null` happens when a client doesn't have an appId and passes
  // `undefined` to `Meteor.subscribe`. `undefined` is translated to
  // `null` as JSON doesn't have `undefined.
  check(appId, Match.OneOf(String, undefined, null)); // Don't notify clients using wrong appId such as mobile apps built with a
  // different server but pointing at the same local url

  if (Autoupdate.appId && appId && Autoupdate.appId !== appId) return [];
  return ClientVersions.find();
}, {
  is_auto: true
});
Meteor.startup(function () {
  updateVersions(false);
});
var fut = new Future(); // We only want 'refresh' to trigger 'updateVersions' AFTER onListen,
// so we add a queued task that waits for onListen before 'refresh' can queue
// tasks. Note that the `onListening` callbacks do not fire until after
// Meteor.startup, so there is no concern that the 'updateVersions' calls from
// 'refresh' will overlap with the `updateVersions` call from Meteor.startup.

syncQueue.queueTask(function () {
  fut.wait();
});
WebApp.onListening(function () {
  fut.return();
});

var enqueueVersionsRefresh = function () {
  syncQueue.queueTask(function () {
    updateVersions(true);
  });
}; // Listen for the special {refresh: 'client'} message, which signals that a
// client asset has changed.


process.on('message', Meteor.bindEnvironment(function (m) {
  if (m && m.refresh === 'client') {
    enqueueVersionsRefresh();
  }
}, "handling client refresh message")); // Another way to tell the process to refresh: send SIGHUP signal

process.on('SIGHUP', Meteor.bindEnvironment(function () {
  enqueueVersionsRefresh();
}, "handling SIGHUP signal for refresh"));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/autoupdate/autoupdate_server.js");

/* Exports */
Package._define("autoupdate", {
  Autoupdate: Autoupdate
});

})();

//# sourceURL=meteor://💻app/packages/autoupdate.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYXV0b3VwZGF0ZS9hdXRvdXBkYXRlX3NlcnZlci5qcyJdLCJuYW1lcyI6WyJGdXR1cmUiLCJOcG0iLCJyZXF1aXJlIiwiQXV0b3VwZGF0ZSIsIkNsaWVudFZlcnNpb25zIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiY29ubmVjdGlvbiIsImF1dG91cGRhdGVWZXJzaW9uIiwiYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSIsImF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSIsImFwcElkIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsInByb2Nlc3MiLCJlbnYiLCJBUFBfSUQiLCJzeW5jUXVldWUiLCJNZXRlb3IiLCJfU3luY2hyb25vdXNRdWV1ZSIsInVwZGF0ZVZlcnNpb25zIiwic2hvdWxkUmVsb2FkQ2xpZW50UHJvZ3JhbSIsIldlYkFwcEludGVybmFscyIsInJlbG9hZENsaWVudFByb2dyYW1zIiwiQVVUT1VQREFURV9WRVJTSU9OIiwiV2ViQXBwIiwiY2FsY3VsYXRlQ2xpZW50SGFzaE5vblJlZnJlc2hhYmxlIiwiY2FsY3VsYXRlQ2xpZW50SGFzaFJlZnJlc2hhYmxlIiwiY2FsY3VsYXRlQ2xpZW50SGFzaENvcmRvdmEiLCJnZW5lcmF0ZUJvaWxlcnBsYXRlIiwiZmluZE9uZSIsImN1cnJlbnQiLCJpbnNlcnQiLCJfaWQiLCJ2ZXJzaW9uIiwidXBkYXRlIiwiJHNldCIsInJlZnJlc2hhYmxlIiwib25MaXN0ZW5pbmciLCJhc3NldHMiLCJyZWZyZXNoYWJsZUFzc2V0cyIsInB1Ymxpc2giLCJjaGVjayIsIk1hdGNoIiwiT25lT2YiLCJTdHJpbmciLCJ1bmRlZmluZWQiLCJmaW5kIiwiaXNfYXV0byIsInN0YXJ0dXAiLCJmdXQiLCJxdWV1ZVRhc2siLCJ3YWl0IiwicmV0dXJuIiwiZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCIsIm9uIiwiYmluZEVudmlyb25tZW50IiwibSIsInJlZnJlc2giXSwibWFw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T2EsV0FBUCxDQUFtQixZQUFZO0FBQzdCWSxNQUFJRyxNQUFKO0FBQ0QsQ0FGRDs7QUFJQSxJQUFJQyx5QkFBeUIsWUFBWTtBQUN2Q3JDLFlBQVVrQyxTQUFWLENBQW9CLFlBQVk7QUFDOUIvQixtQkFBZSxJQUFmO0FBQ0QsR0FGRDtBQUdELENBSkQsQyxDQU1BO0FBQ0E7OztBQUNBTixRQUFReUMsRUFBUixDQUFXLFNBQVgsRUFBc0JyQyxPQUFPc0MsZUFBUCxDQUF1QixVQUFVQyxDQUFWLEVBQWE7QUFDeEQsTUFBSUEsS0FBS0EsRUFBRUMsT0FBRixLQUFjLFFBQXZCLEVBQWlDO0FBQy9CSjtBQUNEO0FBQ0YsQ0FKcUIsRUFJbkIsaUNBSm1CLENBQXRCLEUsQ0FNQTs7QUFDQXhDLFFBQVF5QyxFQUFSLENBQVcsUUFBWCxFQUFxQnJDLE9BQU9zQyxlQUFQLENBQXVCLFlBQVk7QUFDdERGO0FBQ0QsQ0FGb0IsRUFFbEIsb0NBRmtCLENBQXJCLEUiLCJmaWxlIjoiL3BhY2thZ2VzL2F1dG91cGRhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQdWJsaXNoIHRoZSBjdXJyZW50IGNsaWVudCB2ZXJzaW9ucyB0byB0aGUgY2xpZW50LiAgV2hlbiBhIGNsaWVudFxuLy8gc2VlcyB0aGUgc3Vic2NyaXB0aW9uIGNoYW5nZSBhbmQgdGhhdCB0aGVyZSBpcyBhIG5ldyB2ZXJzaW9uIG9mIHRoZVxuLy8gY2xpZW50IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyLCBpdCBjYW4gcmVsb2FkLlxuLy9cbi8vIEJ5IGRlZmF1bHQgdGhlcmUgYXJlIHR3byBjdXJyZW50IGNsaWVudCB2ZXJzaW9ucy4gVGhlIHJlZnJlc2hhYmxlIGNsaWVudFxuLy8gdmVyc2lvbiBpcyBpZGVudGlmaWVkIGJ5IGEgaGFzaCBvZiB0aGUgY2xpZW50IHJlc291cmNlcyBzZWVuIGJ5IHRoZSBicm93c2VyXG4vLyB0aGF0IGFyZSByZWZyZXNoYWJsZSwgc3VjaCBhcyBDU1MsIHdoaWxlIHRoZSBub24gcmVmcmVzaGFibGUgY2xpZW50IHZlcnNpb25cbi8vIGlzIGlkZW50aWZpZWQgYnkgYSBoYXNoIG9mIHRoZSByZXN0IG9mIHRoZSBjbGllbnQgYXNzZXRzXG4vLyAodGhlIEhUTUwsIGNvZGUsIGFuZCBzdGF0aWMgZmlsZXMgaW4gdGhlIGBwdWJsaWNgIGRpcmVjdG9yeSkuXG4vL1xuLy8gSWYgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlIGBBVVRPVVBEQVRFX1ZFUlNJT05gIGlzIHNldCBpdCB3aWxsIGJlXG4vLyB1c2VkIGFzIHRoZSBjbGllbnQgaWQgaW5zdGVhZC4gIFlvdSBjYW4gdXNlIHRoaXMgdG8gY29udHJvbCB3aGVuXG4vLyB0aGUgY2xpZW50IHJlbG9hZHMuICBGb3IgZXhhbXBsZSwgaWYgeW91IHdhbnQgdG8gb25seSBmb3JjZSBhXG4vLyByZWxvYWQgb24gbWFqb3IgY2hhbmdlcywgeW91IGNhbiB1c2UgYSBjdXN0b20gQVVUT1VQREFURV9WRVJTSU9OXG4vLyB3aGljaCB5b3Ugb25seSBjaGFuZ2Ugd2hlbiBzb21ldGhpbmcgd29ydGggcHVzaGluZyB0byBjbGllbnRzXG4vLyBpbW1lZGlhdGVseSBoYXBwZW5zLlxuLy9cbi8vIFRoZSBzZXJ2ZXIgcHVibGlzaGVzIGEgYG1ldGVvcl9hdXRvdXBkYXRlX2NsaWVudFZlcnNpb25zYFxuLy8gY29sbGVjdGlvbi4gVGhlcmUgYXJlIHR3byBkb2N1bWVudHMgaW4gdGhpcyBjb2xsZWN0aW9uLCBhIGRvY3VtZW50XG4vLyB3aXRoIF9pZCAndmVyc2lvbicgd2hpY2ggcmVwcmVzZW50cyB0aGUgbm9uIHJlZnJlc2hhYmxlIGNsaWVudCBhc3NldHMsXG4vLyBhbmQgYSBkb2N1bWVudCB3aXRoIF9pZCAndmVyc2lvbi1yZWZyZXNoYWJsZScgd2hpY2ggcmVwcmVzZW50cyB0aGVcbi8vIHJlZnJlc2hhYmxlIGNsaWVudCBhc3NldHMuIEVhY2ggZG9jdW1lbnQgaGFzIGEgJ3ZlcnNpb24nIGZpZWxkXG4vLyB3aGljaCBpcyBlcXVpdmFsZW50IHRvIHRoZSBoYXNoIG9mIHRoZSByZWxldmFudCBhc3NldHMuIFRoZSByZWZyZXNoYWJsZVxuLy8gZG9jdW1lbnQgYWxzbyBjb250YWlucyBhIGxpc3Qgb2YgdGhlIHJlZnJlc2hhYmxlIGFzc2V0cywgc28gdGhhdCB0aGUgY2xpZW50XG4vLyBjYW4gc3dhcCBpbiB0aGUgbmV3IGFzc2V0cyB3aXRob3V0IGZvcmNpbmcgYSBwYWdlIHJlZnJlc2guIENsaWVudHMgY2FuXG4vLyBvYnNlcnZlIGNoYW5nZXMgb24gdGhlc2UgZG9jdW1lbnRzIHRvIGRldGVjdCB3aGVuIHRoZXJlIGlzIGEgbmV3XG4vLyB2ZXJzaW9uIGF2YWlsYWJsZS5cbi8vXG4vLyBJbiB0aGlzIGltcGxlbWVudGF0aW9uIG9ubHkgdHdvIGRvY3VtZW50cyBhcmUgcHJlc2VudCBpbiB0aGUgY29sbGVjdGlvblxuLy8gdGhlIGN1cnJlbnQgcmVmcmVzaGFibGUgY2xpZW50IHZlcnNpb24gYW5kIHRoZSBjdXJyZW50IG5vblJlZnJlc2hhYmxlIGNsaWVudFxuLy8gdmVyc2lvbi4gIERldmVsb3BlcnMgY2FuIGVhc2lseSBleHBlcmltZW50IHdpdGggZGlmZmVyZW50IHZlcnNpb25pbmcgYW5kXG4vLyB1cGRhdGluZyBtb2RlbHMgYnkgZm9ya2luZyB0aGlzIHBhY2thZ2UuXG5cbnZhciBGdXR1cmUgPSBOcG0ucmVxdWlyZShcImZpYmVycy9mdXR1cmVcIik7XG5cbkF1dG91cGRhdGUgPSB7fTtcblxuLy8gVGhlIGNvbGxlY3Rpb24gb2YgYWNjZXB0YWJsZSBjbGllbnQgdmVyc2lvbnMuXG5DbGllbnRWZXJzaW9ucyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKFwibWV0ZW9yX2F1dG91cGRhdGVfY2xpZW50VmVyc2lvbnNcIixcbiAgeyBjb25uZWN0aW9uOiBudWxsIH0pO1xuXG4vLyBUaGUgY2xpZW50IGhhc2ggaW5jbHVkZXMgX19tZXRlb3JfcnVudGltZV9jb25maWdfXywgc28gd2FpdCB1bnRpbFxuLy8gYWxsIHBhY2thZ2VzIGhhdmUgbG9hZGVkIGFuZCBoYXZlIGhhZCBhIGNoYW5jZSB0byBwb3B1bGF0ZSB0aGVcbi8vIHJ1bnRpbWUgY29uZmlnIGJlZm9yZSB1c2luZyB0aGUgY2xpZW50IGhhc2ggYXMgb3VyIGRlZmF1bHQgYXV0b1xuLy8gdXBkYXRlIHZlcnNpb24gaWQuXG5cbi8vIE5vdGU6IFRlc3RzIGFsbG93IHBlb3BsZSB0byBvdmVycmlkZSBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIGJlZm9yZVxuLy8gc3RhcnR1cC5cbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb24gPSBudWxsO1xuQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvblJlZnJlc2hhYmxlID0gbnVsbDtcbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhID0gbnVsbDtcbkF1dG91cGRhdGUuYXBwSWQgPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmFwcElkID0gcHJvY2Vzcy5lbnYuQVBQX0lEO1xuXG52YXIgc3luY1F1ZXVlID0gbmV3IE1ldGVvci5fU3luY2hyb25vdXNRdWV1ZSgpO1xuXG4vLyB1cGRhdGVWZXJzaW9ucyBjYW4gb25seSBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHNlcnZlciBoYXMgZnVsbHkgbG9hZGVkLlxudmFyIHVwZGF0ZVZlcnNpb25zID0gZnVuY3Rpb24gKHNob3VsZFJlbG9hZENsaWVudFByb2dyYW0pIHtcbiAgLy8gU3RlcCAxOiBsb2FkIHRoZSBjdXJyZW50IGNsaWVudCBwcm9ncmFtIG9uIHRoZSBzZXJ2ZXIgYW5kIHVwZGF0ZSB0aGVcbiAgLy8gaGFzaCB2YWx1ZXMgaW4gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5cbiAgaWYgKHNob3VsZFJlbG9hZENsaWVudFByb2dyYW0pIHtcbiAgICBXZWJBcHBJbnRlcm5hbHMucmVsb2FkQ2xpZW50UHJvZ3JhbXMoKTtcbiAgfVxuXG4gIC8vIElmIHdlIGp1c3QgcmUtcmVhZCB0aGUgY2xpZW50IHByb2dyYW0sIG9yIGlmIHdlIGRvbid0IGhhdmUgYW4gYXV0b3VwZGF0ZVxuICAvLyB2ZXJzaW9uLCBjYWxjdWxhdGUgaXQuXG4gIGlmIChzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtIHx8IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb24gPT09IG51bGwpIHtcbiAgICBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uID1cbiAgICAgIHByb2Nlc3MuZW52LkFVVE9VUERBVEVfVkVSU0lPTiB8fFxuICAgICAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hOb25SZWZyZXNoYWJsZSgpO1xuICB9XG4gIC8vIElmIHdlIGp1c3QgcmVjYWxjdWxhdGVkIGl0IE9SIGlmIGl0IHdhcyBzZXQgYnkgKGVnKSB0ZXN0LWluLWJyb3dzZXIsXG4gIC8vIGVuc3VyZSBpdCBlbmRzIHVwIGluIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uXG4gIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZVZlcnNpb24gPVxuICAgIEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb247XG5cbiAgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvblJlZnJlc2hhYmxlID1cbiAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmF1dG91cGRhdGVWZXJzaW9uUmVmcmVzaGFibGUgPVxuICAgICAgcHJvY2Vzcy5lbnYuQVVUT1VQREFURV9WRVJTSU9OIHx8XG4gICAgICBXZWJBcHAuY2FsY3VsYXRlQ2xpZW50SGFzaFJlZnJlc2hhYmxlKCk7XG5cbiAgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbkNvcmRvdmEgPVxuICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhID1cbiAgICAgIHByb2Nlc3MuZW52LkFVVE9VUERBVEVfVkVSU0lPTiB8fFxuICAgICAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hDb3Jkb3ZhKCk7XG5cbiAgLy8gU3RlcCAyOiBmb3JtIHRoZSBuZXcgY2xpZW50IGJvaWxlcnBsYXRlIHdoaWNoIGNvbnRhaW5zIHRoZSB1cGRhdGVkXG4gIC8vIGFzc2V0cyBhbmQgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5cbiAgaWYgKHNob3VsZFJlbG9hZENsaWVudFByb2dyYW0pIHtcbiAgICBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZSgpO1xuICB9XG5cbiAgLy8gWFhYIENPTVBBVCBXSVRIIDAuOC4zXG4gIGlmICghIENsaWVudFZlcnNpb25zLmZpbmRPbmUoe2N1cnJlbnQ6IHRydWV9KSkge1xuICAgIC8vIFRvIGVuc3VyZSBhcHBzIHdpdGggdmVyc2lvbiBvZiBNZXRlb3IgcHJpb3IgdG8gMC45LjAgKGluXG4gICAgLy8gd2hpY2ggdGhlIHN0cnVjdHVyZSBvZiBkb2N1bWVudHMgaW4gYENsaWVudFZlcnNpb25zYCB3YXNcbiAgICAvLyBkaWZmZXJlbnQpIGFsc28gcmVsb2FkLlxuICAgIENsaWVudFZlcnNpb25zLmluc2VydCh7Y3VycmVudDogdHJ1ZX0pO1xuICB9XG5cbiAgaWYgKCEgQ2xpZW50VmVyc2lvbnMuZmluZE9uZSh7X2lkOiBcInZlcnNpb25cIn0pKSB7XG4gICAgQ2xpZW50VmVyc2lvbnMuaW5zZXJ0KHtcbiAgICAgIF9pZDogXCJ2ZXJzaW9uXCIsXG4gICAgICB2ZXJzaW9uOiBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgQ2xpZW50VmVyc2lvbnMudXBkYXRlKFwidmVyc2lvblwiLCB7ICRzZXQ6IHtcbiAgICAgIHZlcnNpb246IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25cbiAgICB9fSk7XG4gIH1cblxuICBpZiAoISBDbGllbnRWZXJzaW9ucy5maW5kT25lKHtfaWQ6IFwidmVyc2lvbi1jb3Jkb3ZhXCJ9KSkge1xuICAgIENsaWVudFZlcnNpb25zLmluc2VydCh7XG4gICAgICBfaWQ6IFwidmVyc2lvbi1jb3Jkb3ZhXCIsXG4gICAgICB2ZXJzaW9uOiBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSxcbiAgICAgIHJlZnJlc2hhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIENsaWVudFZlcnNpb25zLnVwZGF0ZShcInZlcnNpb24tY29yZG92YVwiLCB7ICRzZXQ6IHtcbiAgICAgIHZlcnNpb246IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhXG4gICAgfX0pO1xuICB9XG5cbiAgLy8gVXNlIGBvbkxpc3RlbmluZ2AgaGVyZSBiZWNhdXNlIHdlIG5lZWQgdG8gdXNlXG4gIC8vIGBXZWJBcHBJbnRlcm5hbHMucmVmcmVzaGFibGVBc3NldHNgLCB3aGljaCBpcyBvbmx5IHNldCBhZnRlclxuICAvLyBgV2ViQXBwLmdlbmVyYXRlQm9pbGVycGxhdGVgIGlzIGNhbGxlZCBieSBgbWFpbmAgaW4gd2ViYXBwLlxuICBXZWJBcHAub25MaXN0ZW5pbmcoZnVuY3Rpb24gKCkge1xuICAgIGlmICghIENsaWVudFZlcnNpb25zLmZpbmRPbmUoe19pZDogXCJ2ZXJzaW9uLXJlZnJlc2hhYmxlXCJ9KSkge1xuICAgICAgQ2xpZW50VmVyc2lvbnMuaW5zZXJ0KHtcbiAgICAgICAgX2lkOiBcInZlcnNpb24tcmVmcmVzaGFibGVcIixcbiAgICAgICAgdmVyc2lvbjogQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvblJlZnJlc2hhYmxlLFxuICAgICAgICBhc3NldHM6IFdlYkFwcEludGVybmFscy5yZWZyZXNoYWJsZUFzc2V0c1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIENsaWVudFZlcnNpb25zLnVwZGF0ZShcInZlcnNpb24tcmVmcmVzaGFibGVcIiwgeyAkc2V0OiB7XG4gICAgICAgIHZlcnNpb246IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSxcbiAgICAgICAgYXNzZXRzOiBXZWJBcHBJbnRlcm5hbHMucmVmcmVzaGFibGVBc3NldHNcbiAgICAgIH19KTtcbiAgICB9XG4gIH0pO1xufTtcblxuTWV0ZW9yLnB1Ymxpc2goXG4gIFwibWV0ZW9yX2F1dG91cGRhdGVfY2xpZW50VmVyc2lvbnNcIixcbiAgZnVuY3Rpb24gKGFwcElkKSB7XG4gICAgLy8gYG51bGxgIGhhcHBlbnMgd2hlbiBhIGNsaWVudCBkb2Vzbid0IGhhdmUgYW4gYXBwSWQgYW5kIHBhc3Nlc1xuICAgIC8vIGB1bmRlZmluZWRgIHRvIGBNZXRlb3Iuc3Vic2NyaWJlYC4gYHVuZGVmaW5lZGAgaXMgdHJhbnNsYXRlZCB0b1xuICAgIC8vIGBudWxsYCBhcyBKU09OIGRvZXNuJ3QgaGF2ZSBgdW5kZWZpbmVkLlxuICAgIGNoZWNrKGFwcElkLCBNYXRjaC5PbmVPZihTdHJpbmcsIHVuZGVmaW5lZCwgbnVsbCkpO1xuXG4gICAgLy8gRG9uJ3Qgbm90aWZ5IGNsaWVudHMgdXNpbmcgd3JvbmcgYXBwSWQgc3VjaCBhcyBtb2JpbGUgYXBwcyBidWlsdCB3aXRoIGFcbiAgICAvLyBkaWZmZXJlbnQgc2VydmVyIGJ1dCBwb2ludGluZyBhdCB0aGUgc2FtZSBsb2NhbCB1cmxcbiAgICBpZiAoQXV0b3VwZGF0ZS5hcHBJZCAmJiBhcHBJZCAmJiBBdXRvdXBkYXRlLmFwcElkICE9PSBhcHBJZClcbiAgICAgIHJldHVybiBbXTtcblxuICAgIHJldHVybiBDbGllbnRWZXJzaW9ucy5maW5kKCk7XG4gIH0sXG4gIHtpc19hdXRvOiB0cnVlfVxuKTtcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xuICB1cGRhdGVWZXJzaW9ucyhmYWxzZSk7XG59KTtcblxudmFyIGZ1dCA9IG5ldyBGdXR1cmUoKTtcblxuLy8gV2Ugb25seSB3YW50ICdyZWZyZXNoJyB0byB0cmlnZ2VyICd1cGRhdGVWZXJzaW9ucycgQUZURVIgb25MaXN0ZW4sXG4vLyBzbyB3ZSBhZGQgYSBxdWV1ZWQgdGFzayB0aGF0IHdhaXRzIGZvciBvbkxpc3RlbiBiZWZvcmUgJ3JlZnJlc2gnIGNhbiBxdWV1ZVxuLy8gdGFza3MuIE5vdGUgdGhhdCB0aGUgYG9uTGlzdGVuaW5nYCBjYWxsYmFja3MgZG8gbm90IGZpcmUgdW50aWwgYWZ0ZXJcbi8vIE1ldGVvci5zdGFydHVwLCBzbyB0aGVyZSBpcyBubyBjb25jZXJuIHRoYXQgdGhlICd1cGRhdGVWZXJzaW9ucycgY2FsbHMgZnJvbVxuLy8gJ3JlZnJlc2gnIHdpbGwgb3ZlcmxhcCB3aXRoIHRoZSBgdXBkYXRlVmVyc2lvbnNgIGNhbGwgZnJvbSBNZXRlb3Iuc3RhcnR1cC5cblxuc3luY1F1ZXVlLnF1ZXVlVGFzayhmdW5jdGlvbiAoKSB7XG4gIGZ1dC53YWl0KCk7XG59KTtcblxuV2ViQXBwLm9uTGlzdGVuaW5nKGZ1bmN0aW9uICgpIHtcbiAgZnV0LnJldHVybigpO1xufSk7XG5cbnZhciBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICBzeW5jUXVldWUucXVldWVUYXNrKGZ1bmN0aW9uICgpIHtcbiAgICB1cGRhdGVWZXJzaW9ucyh0cnVlKTtcbiAgfSk7XG59O1xuXG4vLyBMaXN0ZW4gZm9yIHRoZSBzcGVjaWFsIHtyZWZyZXNoOiAnY2xpZW50J30gbWVzc2FnZSwgd2hpY2ggc2lnbmFscyB0aGF0IGFcbi8vIGNsaWVudCBhc3NldCBoYXMgY2hhbmdlZC5cbnByb2Nlc3Mub24oJ21lc3NhZ2UnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChtKSB7XG4gIGlmIChtICYmIG0ucmVmcmVzaCA9PT0gJ2NsaWVudCcpIHtcbiAgICBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoKCk7XG4gIH1cbn0sIFwiaGFuZGxpbmcgY2xpZW50IHJlZnJlc2ggbWVzc2FnZVwiKSk7XG5cbi8vIEFub3RoZXIgd2F5IHRvIHRlbGwgdGhlIHByb2Nlc3MgdG8gcmVmcmVzaDogc2VuZCBTSUdIVVAgc2lnbmFsXG5wcm9jZXNzLm9uKCdTSUdIVVAnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uICgpIHtcbiAgZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCgpO1xufSwgXCJoYW5kbGluZyBTSUdIVVAgc2lnbmFsIGZvciByZWZyZXNoXCIpKTtcblxuIl19

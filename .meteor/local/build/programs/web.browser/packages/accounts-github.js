//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var Github = Package['github-oauth'].Github;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-github":{"notice.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-github/notice.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('github-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-github,\n" + "but didn't install the configuration UI for the GitHub\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add github-config-ui" + "\n");
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"github.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-github/github.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Accounts.oauth.registerService('github');

if (Meteor.isClient) {
  var loginWithGithub = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Github.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('github', loginWithGithub);

  Meteor.loginWithGithub = function () {
    return Accounts.applyLoginFunction('github', arguments);
  };
} else {
  Accounts.addAutopublishFields({
    // not sure whether the github api can be used from the browser,
    // thus not sure if we should be sending access tokens; but we do it
    // for all other oauth2 providers, and it may come in handy.
    forLoggedInUser: ['services.github'],
    forOtherUsers: ['services.github.username']
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-github/notice.js");
require("/node_modules/meteor/accounts-github/github.js");

/* Exports */
Package._define("accounts-github");

})();

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
var Twitter = Package['twitter-oauth'].Twitter;
var HTTP = Package.http.HTTP;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-twitter":{"notice.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-twitter/notice.js                                                                             //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('twitter-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-twitter,\n" + "but didn't install the configuration UI for Twitter\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add twitter-config-ui" + "\n");
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"twitter.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-twitter/twitter.js                                                                            //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
Accounts.oauth.registerService('twitter');

if (Meteor.isClient) {
  var loginWithTwitter = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Twitter.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('twitter', loginWithTwitter);

  Meteor.loginWithTwitter = function () {
    return Accounts.applyLoginFunction('twitter', arguments);
  };
} else {
  var autopublishedFields = _.map( // don't send access token. https://dev.twitter.com/discussions/5025
  Twitter.whitelistedFields.concat(['id', 'screenName']), function (subfield) {
    return 'services.twitter.' + subfield;
  });

  Accounts.addAutopublishFields({
    forLoggedInUser: autopublishedFields,
    forOtherUsers: autopublishedFields
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-twitter/notice.js");
require("/node_modules/meteor/accounts-twitter/twitter.js");

/* Exports */
Package._define("accounts-twitter");

})();

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
var _ = Package.underscore._;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Google = Package['google-oauth'].Google;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-google":{"notice.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-google/notice.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('google-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-google,\n" + "but didn't install the configuration UI for the Google\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add google-config-ui" + "\n");
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"google.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-google/google.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Accounts.oauth.registerService('google');

if (Meteor.isClient) {
  var loginWithGoogle = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    if (Meteor.isCordova && Google.signIn) {
      // After 20 April 2017, Google OAuth login will no longer work from
      // a WebView, so Cordova apps must use Google Sign-In instead.
      // https://github.com/meteor/meteor/issues/8253
      Google.signIn(options, callback);
      return;
    } // Use Google's domain-specific login page if we want to restrict creation to
    // a particular email domain. (Don't use it if restrictCreationByEmailDomain
    // is a function.) Note that all this does is change Google's UI ---
    // accounts-base/accounts_server.js still checks server-side that the server
    // has the proper email address after the OAuth conversation.


    if (typeof Accounts._options.restrictCreationByEmailDomain === 'string') {
      options = _.extend({}, options || {});
      options.loginUrlParameters = _.extend({}, options.loginUrlParameters || {});
      options.loginUrlParameters.hd = Accounts._options.restrictCreationByEmailDomain;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Google.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('google', loginWithGoogle);

  Meteor.loginWithGoogle = function () {
    return Accounts.applyLoginFunction('google', arguments);
  };
} else {
  Accounts.addAutopublishFields({
    forLoggedInUser: _.map( // publish access token since it can be used from the client (if
    // transmitted over ssl or on
    // localhost). https://developers.google.com/accounts/docs/OAuth2UserAgent
    // refresh token probably shouldn't be sent down.
    Google.whitelistedFields.concat(['accessToken', 'expiresAt']), // don't publish refresh token
    function (subfield) {
      return 'services.google.' + subfield;
    }),
    forOtherUsers: _.map( // even with autopublish, no legitimate web app should be
    // publishing all users' emails
    _.without(Google.whitelistedFields, 'email', 'verified_email'), function (subfield) {
      return 'services.google.' + subfield;
    })
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-google/notice.js");
require("/node_modules/meteor/accounts-google/google.js");

/* Exports */
Package._define("accounts-google");

})();

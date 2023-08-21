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
var Facebook = Package['facebook-oauth'].Facebook;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-facebook":{"notice.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-facebook/notice.js                                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('facebook-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-facebook,\n" + "but didn't install the configuration UI for the Facebook\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add facebook-config-ui" + "\n");
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-facebook/facebook.js                                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Accounts.oauth.registerService('facebook');

if (Meteor.isClient) {
  var loginWithFacebook = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Facebook.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('facebook', loginWithFacebook);

  Meteor.loginWithFacebook = function () {
    return Accounts.applyLoginFunction('facebook', arguments);
  };
} else {
  Accounts.addAutopublishFields({
    // publish all fields including access token, which can legitimately
    // be used from the client (if transmitted over ssl or on
    // localhost). https://developers.facebook.com/docs/concepts/login/access-tokens-and-types/,
    // "Sharing of Access Tokens"
    forLoggedInUser: ['services.facebook'],
    forOtherUsers: [// https://www.facebook.com/help/167709519956542
    'services.facebook.id', 'services.facebook.username', 'services.facebook.gender']
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-facebook/notice.js");
require("/node_modules/meteor/accounts-facebook/facebook.js");

/* Exports */
Package._define("accounts-facebook");

})();

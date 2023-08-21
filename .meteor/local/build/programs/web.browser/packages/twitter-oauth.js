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
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;

/* Package-scope variables */
var Twitter;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/twitter-oauth/twitter_common.js                                                           //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
Twitter = {};

Twitter.validParamsAuthenticate = [
  'force_login',
  'screen_name'
];

////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/twitter-oauth/twitter_client.js                                                           //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
// Request Twitter credentials for the user
// @param options {optional}  XXX support options.requestPermissions
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Twitter.requestCredential = function (options, credentialRequestCompleteCallback) {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({service: 'twitter'});
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError());
    return;
  }

  var credentialToken = Random.secret();
  // We need to keep credentialToken across the next two 'steps' so we're adding
  // a credentialToken parameter to the url and the callback url that we'll be returned
  // to by oauth provider

  var loginStyle = OAuth._loginStyle('twitter', config, options);

  // url to app, enters "step 1" as described in
  // packages/accounts-oauth1-helper/oauth1_server.js
  var loginPath = '_oauth/twitter/?requestTokenAndRedirect=true'
        + '&state=' + OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl);

  if (Meteor.isCordova) {
    loginPath = loginPath + "&cordova=true";
    if (/Android/i.test(navigator.userAgent)) {
      loginPath = loginPath + "&android=true";
    }
  }

  // Support additional, permitted parameters
  if (options) {
    var hasOwn = Object.prototype.hasOwnProperty;
    Twitter.validParamsAuthenticate.forEach(function (param) {
      if (hasOwn.call(options, param)) {
        loginPath += "&" + param + "=" + encodeURIComponent(options[param]);
      }
    });
  }

  var loginUrl = Meteor.absoluteUrl(loginPath);

  OAuth.launchLogin({
    loginService: "twitter",
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken
  });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("twitter-oauth", {
  Twitter: Twitter
});

})();

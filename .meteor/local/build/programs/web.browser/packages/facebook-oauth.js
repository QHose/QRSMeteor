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
var Facebook;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/facebook-oauth/facebook_client.js                                                        //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
Facebook = {};

// Request Facebook credentials for the user
//
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Facebook.requestCredential = function (options, credentialRequestCompleteCallback) {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({service: 'facebook'});
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError());
    return;
  }

  var credentialToken = Random.secret();
  var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  var display = mobile ? 'touch' : 'popup';

  var scope = "email";
  if (options && options.requestPermissions)
    scope = options.requestPermissions.join(',');

  var loginStyle = OAuth._loginStyle('facebook', config, options);

  var loginUrl =
        'https://www.facebook.com/v2.12/dialog/oauth?client_id=' + config.appId +
        '&redirect_uri=' + OAuth._redirectUri('facebook', config) +
        '&display=' + display + '&scope=' + scope +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl);

  // Handle authentication type (e.g. for force login you need auth_type: "reauthenticate")
  if (options && options.auth_type) {
    loginUrl += "&auth_type=" + encodeURIComponent(options.auth_type);
  }

  OAuth.launchLogin({
    loginService: "facebook",
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken
  });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("facebook-oauth", {
  Facebook: Facebook
});

})();

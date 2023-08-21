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
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var Reload = Package.reload.Reload;
var Base64 = Package.base64.Base64;
var URL = Package.url.URL;

/* Package-scope variables */
var OAuth, Oauth;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/oauth/oauth_client.js                                                       //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
// credentialToken -> credentialSecret. You must provide both the
// credentialToken and the credentialSecret to retrieve an access token from
// the _pendingCredentials collection.
var credentialSecrets = {};

OAuth = {};

OAuth.showPopup = function (url, callback, dimensions) {
  throw new Error("OAuth.showPopup must be implemented on this arch.");
};

// Determine the login style (popup or redirect) for this login flow.
//
//
OAuth._loginStyle = function (service, config, options) {

  if (Meteor.isCordova) {
    return "popup";
  }

  var loginStyle = (options && options.loginStyle) || config.loginStyle || 'popup';

  if (! _.contains(["popup", "redirect"], loginStyle))
    throw new Error("Invalid login style: " + loginStyle);

  // If we don't have session storage (for example, Safari in private
  // mode), the redirect login flow won't work, so fallback to the
  // popup style.
  if (loginStyle === 'redirect') {
    try {
      sessionStorage.setItem('Meteor.oauth.test', 'test');
      sessionStorage.removeItem('Meteor.oauth.test');
    } catch (e) {
      loginStyle = 'popup';
    }
  }

  return loginStyle;
};

OAuth._stateParam = function (loginStyle, credentialToken, redirectUrl) {
  var state = {
    loginStyle: loginStyle,
    credentialToken: credentialToken,
    isCordova: Meteor.isCordova
  };

  if (loginStyle === 'redirect')
    state.redirectUrl = redirectUrl || ('' + window.location);

  // Encode base64 as not all login services URI-encode the state
  // parameter when they pass it back to us.
  // Use the 'base64' package here because 'btoa' isn't supported in IE8/9.
  return Base64.encode(JSON.stringify(state));
};


// At the beginning of the redirect login flow, before we redirect to
// the login service, save the credential token for this login attempt
// in the reload migration data.
//
OAuth.saveDataForRedirect = function (loginService, credentialToken) {
  Reload._onMigrate('oauth', function () {
    return [true, {loginService: loginService, credentialToken: credentialToken}];
  });
  Reload._migrate(null, {immediateMigration: true});
};

// At the end of the redirect login flow, when we've redirected back
// to the application, retrieve the credentialToken and (if the login
// was successful) the credentialSecret.
//
// Called at application startup.  Returns null if this is normal
// application startup and we weren't just redirected at the end of
// the login flow.
//
OAuth.getDataAfterRedirect = function () {
  var migrationData = Reload._migrationData('oauth');

  if (! (migrationData && migrationData.credentialToken))
    return null;

  var credentialToken = migrationData.credentialToken;
  var key = OAuth._storageTokenPrefix + credentialToken;
  var credentialSecret;
  try {
    credentialSecret = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
  } catch (e) {
    Meteor._debug('error retrieving credentialSecret', e);
  }
  return {
    loginService: migrationData.loginService,
    credentialToken: credentialToken,
    credentialSecret: credentialSecret
  };
};

// Launch an OAuth login flow.  For the popup login style, show the
// popup.  For the redirect login style, save the credential token for
// this login attempt in the reload migration data, and redirect to
// the service for the login.
//
// options:
//  loginService: "facebook", "google", etc.
//  loginStyle: "popup" or "redirect"
//  loginUrl: The URL at the login service provider to start the OAuth flow.
//  credentialRequestCompleteCallback: for the popup flow, call when the popup
//    is closed and we have the credential from the login service.
//  credentialToken: our identifier for this login flow.
//
OAuth.launchLogin = function (options) {
  if (! options.loginService)
    throw new Error('loginService required');
  if (options.loginStyle === 'popup') {
    OAuth.showPopup(
      options.loginUrl,
      _.bind(options.credentialRequestCompleteCallback, null, options.credentialToken),
      options.popupOptions);
  } else if (options.loginStyle === 'redirect') {
    OAuth.saveDataForRedirect(options.loginService, options.credentialToken);
    window.location = options.loginUrl;
  } else {
    throw new Error('invalid login style');
  }
};

// XXX COMPAT WITH 0.7.0.1
// Private interface but probably used by many oauth clients in atmosphere.
OAuth.initiateLogin = function (credentialToken, url, callback, dimensions) {
  OAuth.showPopup(
    url,
    _.bind(callback, null, credentialToken),
    dimensions
  );
};

// Called by the popup when the OAuth flow is completed, right before
// the popup closes.
OAuth._handleCredentialSecret = function (credentialToken, secret) {
  check(credentialToken, String);
  check(secret, String);
  if (! _.has(credentialSecrets,credentialToken)) {
    credentialSecrets[credentialToken] = secret;
  } else {
    throw new Error("Duplicate credential token from OAuth login");
  }
};

// Used by accounts-oauth, which needs both a credentialToken and the
// corresponding to credential secret to call the `login` method over DDP.
OAuth._retrieveCredentialSecret = function (credentialToken) {
  // First check the secrets collected by OAuth._handleCredentialSecret,
  // then check localStorage. This matches what we do in
  // end_of_login_response.html.
  var secret = credentialSecrets[credentialToken];
  if (! secret) {
    var localStorageKey = OAuth._storageTokenPrefix + credentialToken;
    secret = Meteor._localStorage.getItem(localStorageKey);
    Meteor._localStorage.removeItem(localStorageKey);
  } else {
    delete credentialSecrets[credentialToken];
  }
  return secret;
};

//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/oauth/oauth_browser.js                                                      //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
// Browser specific code for the OAuth package.

// Open a popup window, centered on the screen, and call a callback when it
// closes.
//
// @param url {String} url to show
// @param callback {Function} Callback function to call on completion. Takes no
//   arguments.
// @param dimensions {optional Object(width, height)} The dimensions of
//   the popup. If not passed defaults to something sane.
OAuth.showPopup = function (url, callback, dimensions) {
  // default dimensions that worked well for facebook and google
  var popup = openCenteredPopup(
    url,
    (dimensions && dimensions.width) || 650,
    (dimensions && dimensions.height) || 331
  );

  var checkPopupOpen = setInterval(function() {
    try {
      // Fix for #328 - added a second test criteria (popup.closed === undefined)
      // to humour this Android quirk:
      // http://code.google.com/p/android/issues/detail?id=21061
      var popupClosed = popup.closed || popup.closed === undefined;
    } catch (e) {
      // For some unknown reason, IE9 (and others?) sometimes (when
      // the popup closes too quickly?) throws "SCRIPT16386: No such
      // interface supported" when trying to read 'popup.closed'. Try
      // again in 100ms.
      return;
    }

    if (popupClosed) {
      clearInterval(checkPopupOpen);
      callback();
    }
  }, 100);
};

var openCenteredPopup = function(url, width, height) {
  var screenX = typeof window.screenX !== 'undefined'
        ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY !== 'undefined'
        ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth !== 'undefined'
        ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight !== 'undefined'
        ? window.outerHeight : (document.body.clientHeight - 22);
  // XXX what is the 22?

  // Use `outerWidth - width` and `outerHeight - height` for help in
  // positioning the popup centered relative to the current window
  var left = screenX + (outerWidth - width) / 2;
  var top = screenY + (outerHeight - height) / 2;
  var features = ('width=' + width + ',height=' + height +
                  ',left=' + left + ',top=' + top + ',scrollbars=yes');

  var newwindow = window.open(url, 'Login', features);

  if (typeof newwindow === 'undefined') {
    // blocked by a popup blocker maybe?
    var err = new Error("The login popup was blocked by the browser");
    err.attemptedUrl = url;
    throw err;
  }

  if (newwindow.focus)
    newwindow.focus();
  
  return newwindow;
};
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/oauth/oauth_common.js                                                       //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
OAuth._storageTokenPrefix = "Meteor.oauth.credentialSecret-";

OAuth._redirectUri = function (serviceName, config, params, absoluteUrlOptions) {
  // XXX COMPAT WITH 0.9.0
  // The redirect URI used to have a "?close" query argument.  We
  // detect whether we need to be backwards compatible by checking for
  // the absence of the `loginStyle` field, which wasn't used in the
  // code which had the "?close" argument.
  // This logic is duplicated in the tool so that the tool can do OAuth
  // flow with <= 0.9.0 servers (tools/auth.js).
  var query = config.loginStyle ? null : "close";

  // Clone because we're going to mutate 'params'. The 'cordova' and
  // 'android' parameters are only used for picking the host of the
  // redirect URL, and not actually included in the redirect URL itself.
  var isCordova = false;
  var isAndroid = false;
  if (params) {
    params = _.clone(params);
    isCordova = params.cordova;
    isAndroid = params.android;
    delete params.cordova;
    delete params.android;
    if (_.isEmpty(params)) {
      params = undefined;
    }
  }

  if (Meteor.isServer && isCordova) {
    var rootUrl = process.env.MOBILE_ROOT_URL ||
          __meteor_runtime_config__.ROOT_URL;

    if (isAndroid) {
      // Match the replace that we do in cordova boilerplate
      // (boilerplate-generator package).
      // XXX Maybe we should put this in a separate package or something
      // that is used here and by boilerplate-generator? Or maybe
      // `Meteor.absoluteUrl` should know how to do this?
      var url = Npm.require("url");
      var parsedRootUrl = url.parse(rootUrl);
      if (parsedRootUrl.hostname === "localhost") {
        parsedRootUrl.hostname = "10.0.2.2";
        delete parsedRootUrl.host;
      }
      rootUrl = url.format(parsedRootUrl);
    }

    absoluteUrlOptions = _.extend({}, absoluteUrlOptions, {
      // For Cordova clients, redirect to the special Cordova root url
      // (likely a local IP in development mode).
      rootUrl: rootUrl
    });
  }

  return URL._constructUrl(
    Meteor.absoluteUrl('_oauth/' + serviceName, absoluteUrlOptions),
    query,
    params);
};

//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/oauth/deprecated.js                                                         //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
// XXX COMPAT WITH 0.8.0

Oauth = OAuth;

//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("oauth", {
  OAuth: OAuth,
  Oauth: Oauth
});

})();

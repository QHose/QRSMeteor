(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var Google;

var require = meteorInstall({"node_modules":{"meteor":{"google-oauth":{"google_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/google-oauth/google_server.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _extends2 = require("babel-runtime/helpers/extends");                                                             //
                                                                                                                      //
var _extends3 = _interopRequireDefault(_extends2);                                                                    //
                                                                                                                      //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                     //
                                                                                                                      //
var Google = require("./namespace.js");                                                                               // 1
                                                                                                                      //
var Accounts = require("meteor/accounts-base").Accounts;                                                              // 2
                                                                                                                      //
var hasOwn = Object.prototype.hasOwnProperty; // https://developers.google.com/accounts/docs/OAuth2Login#userinfocall
                                                                                                                      //
Google.whitelistedFields = ['id', 'email', 'verified_email', 'name', 'given_name', 'family_name', 'picture', 'locale', 'timezone', 'gender'];
                                                                                                                      //
function getServiceDataFromTokens(tokens) {                                                                           // 9
  var accessToken = tokens.accessToken;                                                                               // 10
  var idToken = tokens.idToken;                                                                                       // 11
  var scopes = getScopes(accessToken);                                                                                // 12
  var identity = getIdentity(accessToken);                                                                            // 13
  var serviceData = {                                                                                                 // 14
    accessToken: accessToken,                                                                                         // 15
    idToken: idToken,                                                                                                 // 16
    scope: scopes                                                                                                     // 17
  };                                                                                                                  // 14
                                                                                                                      //
  if (hasOwn.call(tokens, "expiresAt")) {                                                                             // 20
    serviceData.expiresAt = Date.now() + 1000 * parseInt(tokens.expiresIn, 10);                                       // 21
  }                                                                                                                   // 23
                                                                                                                      //
  var fields = Object.create(null);                                                                                   // 25
  Google.whitelistedFields.forEach(function (name) {                                                                  // 26
    if (hasOwn.call(identity, name)) {                                                                                // 27
      fields[name] = identity[name];                                                                                  // 28
    }                                                                                                                 // 29
  });                                                                                                                 // 30
  Object.assign(serviceData, fields); // only set the token in serviceData if it's there. this ensures                // 32
  // that we don't lose old ones (since we only get this on the first                                                 // 35
  // log in attempt)                                                                                                  // 36
                                                                                                                      //
  if (tokens.refreshToken) {                                                                                          // 37
    serviceData.refreshToken = tokens.refreshToken;                                                                   // 38
  }                                                                                                                   // 39
                                                                                                                      //
  return {                                                                                                            // 41
    serviceData: serviceData,                                                                                         // 42
    options: {                                                                                                        // 43
      profile: {                                                                                                      // 44
        name: identity.name                                                                                           // 45
      }                                                                                                               // 44
    }                                                                                                                 // 43
  };                                                                                                                  // 41
}                                                                                                                     // 49
                                                                                                                      //
Accounts.registerLoginHandler(function (request) {                                                                    // 51
  if (request.googleSignIn !== true) {                                                                                // 52
    return;                                                                                                           // 53
  }                                                                                                                   // 54
                                                                                                                      //
  var tokens = {                                                                                                      // 56
    accessToken: request.accessToken,                                                                                 // 57
    refreshToken: request.refreshToken,                                                                               // 58
    idToken: request.idToken                                                                                          // 59
  };                                                                                                                  // 56
                                                                                                                      //
  if (request.serverAuthCode) {                                                                                       // 62
    Object.assign(tokens, getTokens({                                                                                 // 63
      code: request.serverAuthCode                                                                                    // 64
    }));                                                                                                              // 63
  }                                                                                                                   // 66
                                                                                                                      //
  var result = getServiceDataFromTokens(tokens);                                                                      // 68
  return Accounts.updateOrCreateUserFromExternalService("google", (0, _extends3.default)({                            // 70
    id: request.userId,                                                                                               // 71
    idToken: request.idToken,                                                                                         // 72
    accessToken: request.accessToken,                                                                                 // 73
    email: request.email,                                                                                             // 74
    picture: request.imageUrl                                                                                         // 75
  }, result.serviceData), result.options);                                                                            // 70
});                                                                                                                   // 78
                                                                                                                      //
function getServiceData(query) {                                                                                      // 80
  return getServiceDataFromTokens(getTokens(query));                                                                  // 81
}                                                                                                                     // 82
                                                                                                                      //
OAuth.registerService('google', 2, null, getServiceData); // returns an object containing:                            // 84
// - accessToken                                                                                                      // 87
// - expiresIn: lifetime of token in seconds                                                                          // 88
// - refreshToken, if this is the first authorization request                                                         // 89
                                                                                                                      //
var getTokens = function (query) {                                                                                    // 90
  var config = ServiceConfiguration.configurations.findOne({                                                          // 91
    service: 'google'                                                                                                 // 91
  });                                                                                                                 // 91
  if (!config) throw new ServiceConfiguration.ConfigError();                                                          // 92
  var response;                                                                                                       // 95
                                                                                                                      //
  try {                                                                                                               // 96
    response = HTTP.post("https://accounts.google.com/o/oauth2/token", {                                              // 97
      params: {                                                                                                       // 98
        code: query.code,                                                                                             // 99
        client_id: config.clientId,                                                                                   // 100
        client_secret: OAuth.openSecret(config.secret),                                                               // 101
        redirect_uri: OAuth._redirectUri('google', config),                                                           // 102
        grant_type: 'authorization_code'                                                                              // 103
      }                                                                                                               // 98
    });                                                                                                               // 98
  } catch (err) {                                                                                                     // 105
    throw Object.assign(new Error("Failed to complete OAuth handshake with Google. " + err.message), {                // 106
      response: err.response                                                                                          // 108
    });                                                                                                               // 108
  }                                                                                                                   // 110
                                                                                                                      //
  if (response.data.error) {                                                                                          // 112
    // if the http response was a json object with an error attribute                                                 // 112
    throw new Error("Failed to complete OAuth handshake with Google. " + response.data.error);                        // 113
  } else {                                                                                                            // 114
    return {                                                                                                          // 115
      accessToken: response.data.access_token,                                                                        // 116
      refreshToken: response.data.refresh_token,                                                                      // 117
      expiresIn: response.data.expires_in,                                                                            // 118
      idToken: response.data.id_token                                                                                 // 119
    };                                                                                                                // 115
  }                                                                                                                   // 121
};                                                                                                                    // 122
                                                                                                                      //
var getIdentity = function (accessToken) {                                                                            // 124
  try {                                                                                                               // 125
    return HTTP.get("https://www.googleapis.com/oauth2/v1/userinfo", {                                                // 126
      params: {                                                                                                       // 128
        access_token: accessToken                                                                                     // 128
      }                                                                                                               // 128
    }).data;                                                                                                          // 128
  } catch (err) {                                                                                                     // 129
    throw Object.assign(new Error("Failed to fetch identity from Google. " + err.message), {                          // 130
      response: err.response                                                                                          // 132
    });                                                                                                               // 132
  }                                                                                                                   // 134
};                                                                                                                    // 135
                                                                                                                      //
var getScopes = function (accessToken) {                                                                              // 137
  try {                                                                                                               // 138
    return HTTP.get("https://www.googleapis.com/oauth2/v1/tokeninfo", {                                               // 139
      params: {                                                                                                       // 141
        access_token: accessToken                                                                                     // 141
      }                                                                                                               // 141
    }).data.scope.split(' ');                                                                                         // 141
  } catch (err) {                                                                                                     // 142
    throw Object.assign(new Error("Failed to fetch tokeninfo from Google. " + err.message), {                         // 143
      response: err.response                                                                                          // 145
    });                                                                                                               // 145
  }                                                                                                                   // 147
};                                                                                                                    // 148
                                                                                                                      //
Google.retrieveCredential = function (credentialToken, credentialSecret) {                                            // 150
  return OAuth.retrieveCredential(credentialToken, credentialSecret);                                                 // 151
};                                                                                                                    // 152
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/google-oauth/namespace.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// The module.exports object of this module becomes the Google namespace                                              // 1
// for other modules in this package.                                                                                 // 2
Google = module.exports; // So that api.export finds the "Google" property.                                           // 3
                                                                                                                      //
Google.Google = Google;                                                                                               // 6
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("./node_modules/meteor/google-oauth/google_server.js");
var exports = require("./node_modules/meteor/google-oauth/namespace.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['google-oauth'] = exports, {
  Google: Google
});

})();

//# sourceMappingURL=google-oauth.js.map

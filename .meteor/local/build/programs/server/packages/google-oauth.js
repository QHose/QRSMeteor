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

/* Package-scope variables */
var Google;

var require = meteorInstall({"node_modules":{"meteor":{"google-oauth":{"google_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/google-oauth/google_server.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

var Google = require("./namespace.js");

var Accounts = require("meteor/accounts-base").Accounts;

var hasOwn = Object.prototype.hasOwnProperty; // https://developers.google.com/accounts/docs/OAuth2Login#userinfocall

Google.whitelistedFields = ['id', 'email', 'verified_email', 'name', 'given_name', 'family_name', 'picture', 'locale', 'timezone', 'gender'];

function getServiceDataFromTokens(tokens) {
  var accessToken = tokens.accessToken;
  var idToken = tokens.idToken;
  var scopes = getScopes(accessToken);
  var identity = getIdentity(accessToken);
  var serviceData = {
    accessToken: accessToken,
    idToken: idToken,
    scope: scopes
  };

  if (hasOwn.call(tokens, "expiresIn")) {
    serviceData.expiresAt = Date.now() + 1000 * parseInt(tokens.expiresIn, 10);
  }

  var fields = Object.create(null);
  Google.whitelistedFields.forEach(function (name) {
    if (hasOwn.call(identity, name)) {
      fields[name] = identity[name];
    }
  });
  Object.assign(serviceData, fields); // only set the token in serviceData if it's there. this ensures
  // that we don't lose old ones (since we only get this on the first
  // log in attempt)

  if (tokens.refreshToken) {
    serviceData.refreshToken = tokens.refreshToken;
  }

  return {
    serviceData: serviceData,
    options: {
      profile: {
        name: identity.name
      }
    }
  };
}

Accounts.registerLoginHandler(function (request) {
  if (request.googleSignIn !== true) {
    return;
  }

  const tokens = {
    accessToken: request.accessToken,
    refreshToken: request.refreshToken,
    idToken: request.idToken
  };

  if (request.serverAuthCode) {
    Object.assign(tokens, getTokens({
      code: request.serverAuthCode
    }));
  }

  const result = getServiceDataFromTokens(tokens);
  return Accounts.updateOrCreateUserFromExternalService("google", (0, _objectSpread2.default)({
    id: request.userId,
    idToken: request.idToken,
    accessToken: request.accessToken,
    email: request.email,
    picture: request.imageUrl
  }, result.serviceData), result.options);
});

function getServiceData(query) {
  return getServiceDataFromTokens(getTokens(query));
}

OAuth.registerService('google', 2, null, getServiceData); // returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
// - refreshToken, if this is the first authorization request

var getTokens = function (query) {
  var config = ServiceConfiguration.configurations.findOne({
    service: 'google'
  });
  if (!config) throw new ServiceConfiguration.ConfigError();
  var response;

  try {
    response = HTTP.post("https://accounts.google.com/o/oauth2/token", {
      params: {
        code: query.code,
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('google', config),
        grant_type: 'authorization_code'
      }
    });
  } catch (err) {
    throw Object.assign(new Error("Failed to complete OAuth handshake with Google. " + err.message), {
      response: err.response
    });
  }

  if (response.data.error) {
    // if the http response was a json object with an error attribute
    throw new Error("Failed to complete OAuth handshake with Google. " + response.data.error);
  } else {
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      idToken: response.data.id_token
    };
  }
};

var getIdentity = function (accessToken) {
  try {
    return HTTP.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      params: {
        access_token: accessToken
      }
    }).data;
  } catch (err) {
    throw Object.assign(new Error("Failed to fetch identity from Google. " + err.message), {
      response: err.response
    });
  }
};

var getScopes = function (accessToken) {
  try {
    return HTTP.get("https://www.googleapis.com/oauth2/v1/tokeninfo", {
      params: {
        access_token: accessToken
      }
    }).data.scope.split(' ');
  } catch (err) {
    throw Object.assign(new Error("Failed to fetch tokeninfo from Google. " + err.message), {
      response: err.response
    });
  }
};

Google.retrieveCredential = function (credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/google-oauth/namespace.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// The module.exports object of this module becomes the Google namespace
// for other modules in this package.
Google = module.exports; // So that api.export finds the "Google" property.

Google.Google = Google;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/google-oauth/google_server.js");
var exports = require("/node_modules/meteor/google-oauth/namespace.js");

/* Exports */
Package._define("google-oauth", exports, {
  Google: Google
});

})();

//# sourceURL=meteor://💻app/packages/google-oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZ29vZ2xlLW9hdXRoL2dvb2dsZV9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2dvb2dsZS1vYXV0aC9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiR29vZ2xlIiwicmVxdWlyZSIsIkFjY291bnRzIiwiaGFzT3duIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJ3aGl0ZWxpc3RlZEZpZWxkcyIsImdldFNlcnZpY2VEYXRhRnJvbVRva2VucyIsInRva2VucyIsImFjY2Vzc1Rva2VuIiwiaWRUb2tlbiIsInNjb3BlcyIsImdldFNjb3BlcyIsImlkZW50aXR5IiwiZ2V0SWRlbnRpdHkiLCJzZXJ2aWNlRGF0YSIsInNjb3BlIiwiY2FsbCIsImV4cGlyZXNBdCIsIkRhdGUiLCJub3ciLCJwYXJzZUludCIsImV4cGlyZXNJbiIsImZpZWxkcyIsImNyZWF0ZSIsImZvckVhY2giLCJuYW1lIiwiYXNzaWduIiwicmVmcmVzaFRva2VuIiwib3B0aW9ucyIsInByb2ZpbGUiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsInJlcXVlc3QiLCJnb29nbGVTaWduSW4iLCJzZXJ2ZXJBdXRoQ29kZSIsImdldFRva2VucyIsImNvZGUiLCJyZXN1bHQiLCJ1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIiwiaWQiLCJ1c2VySWQiLCJlbWFpbCIsInBpY3R1cmUiLCJpbWFnZVVybCIsImdldFNlcnZpY2VEYXRhIiwicXVlcnkiLCJPQXV0aCIsInJlZ2lzdGVyU2VydmljZSIsImNvbmZpZyIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJmaW5kT25lIiwic2VydmljZSIsIkNvbmZpZ0Vycm9yIiwicmVzcG9uc2UiLCJIVFRQIiwicG9zdCIsInBhcmFtcyIsImNsaWVudF9pZCIsImNsaWVudElkIiwiY2xpZW50X3NlY3JldCIsIm9wZW5TZWNyZXQiLCJzZWNyZXQiLCJyZWRpcmVjdF91cmkiLCJfcmVkaXJlY3RVcmkiLCJncmFudF90eXBlIiwiZXJyIiwiRXJyb3IiLCJtZXNzYWdlIiwiZGF0YSIsImVycm9yIiwiYWNjZXNzX3Rva2VuIiwicmVmcmVzaF90b2tlbiIsImV4cGlyZXNfaW4iLCJpZF90b2tlbiIsImdldCIsInNwbGl0IiwicmV0cmlldmVDcmVkZW50aWFsIiwiY3JlZGVudGlhbFRva2VuIiwiY3JlZGVudGlhbFNlY3JldCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxTQUFTQyxRQUFRLGdCQUFSLENBQWI7O0FBQ0EsSUFBSUMsV0FBV0QsUUFBUSxzQkFBUixFQUFnQ0MsUUFBL0M7O0FBQ0EsSUFBSUMsU0FBU0MsT0FBT0MsU0FBUCxDQUFpQkMsY0FBOUIsQyxDQUVBOztBQUNBTixPQUFPTyxpQkFBUCxHQUEyQixDQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCLGdCQUFoQixFQUFrQyxNQUFsQyxFQUEwQyxZQUExQyxFQUNSLGFBRFEsRUFDTyxTQURQLEVBQ2tCLFFBRGxCLEVBQzRCLFVBRDVCLEVBQ3dDLFFBRHhDLENBQTNCOztBQUdBLFNBQVNDLHdCQUFULENBQWtDQyxNQUFsQyxFQUEwQztBQUN4QyxNQUFJQyxjQUFjRCxPQUFPQyxXQUF6QjtBQUNBLE1BQUlDLFVBQVVGLE9BQU9FLE9BQXJCO0FBQ0EsTUFBSUMsU0FBU0MsVUFBVUgsV0FBVixDQUFiO0FBQ0EsTUFBSUksV0FBV0MsWUFBWUwsV0FBWixDQUFmO0FBQ0EsTUFBSU0sY0FBYztBQUNoQk4saUJBQWFBLFdBREc7QUFFaEJDLGFBQVNBLE9BRk87QUFHaEJNLFdBQU9MO0FBSFMsR0FBbEI7O0FBTUEsTUFBSVQsT0FBT2UsSUFBUCxDQUFZVCxNQUFaLEVBQW9CLFdBQXBCLENBQUosRUFBc0M7QUFDcENPLGdCQUFZRyxTQUFaLEdBQ0VDLEtBQUtDLEdBQUwsS0FBYSxPQUFPQyxTQUFTYixP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LENBREksRUFFSjtBQUFFZCxnQkFBVVksSUFBSVo7QUFBaEIsS0FGSSxDQUFOO0FBSUQ7QUFDRixDQVhEOztBQWFBdkQsT0FBTzhFLGtCQUFQLEdBQTRCLFVBQVNDLGVBQVQsRUFBMEJDLGdCQUExQixFQUE0QztBQUN0RSxTQUFPakMsTUFBTStCLGtCQUFOLENBQXlCQyxlQUF6QixFQUEwQ0MsZ0JBQTFDLENBQVA7QUFDRCxDQUZELEM7Ozs7Ozs7Ozs7O0FDckpBO0FBQ0E7QUFDQWhGLFNBQVNpRixPQUFPQyxPQUFoQixDLENBRUE7O0FBQ0FsRixPQUFPQSxNQUFQLEdBQWdCQSxNQUFoQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9nb29nbGUtb2F1dGguanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgR29vZ2xlID0gcmVxdWlyZShcIi4vbmFtZXNwYWNlLmpzXCIpO1xudmFyIEFjY291bnRzID0gcmVxdWlyZShcIm1ldGVvci9hY2NvdW50cy1iYXNlXCIpLkFjY291bnRzO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2FjY291bnRzL2RvY3MvT0F1dGgyTG9naW4jdXNlcmluZm9jYWxsXG5Hb29nbGUud2hpdGVsaXN0ZWRGaWVsZHMgPSBbJ2lkJywgJ2VtYWlsJywgJ3ZlcmlmaWVkX2VtYWlsJywgJ25hbWUnLCAnZ2l2ZW5fbmFtZScsXG4gICAgICAgICAgICAgICAgICAgJ2ZhbWlseV9uYW1lJywgJ3BpY3R1cmUnLCAnbG9jYWxlJywgJ3RpbWV6b25lJywgJ2dlbmRlciddO1xuXG5mdW5jdGlvbiBnZXRTZXJ2aWNlRGF0YUZyb21Ub2tlbnModG9rZW5zKSB7XG4gIHZhciBhY2Nlc3NUb2tlbiA9IHRva2Vucy5hY2Nlc3NUb2tlbjtcbiAgdmFyIGlkVG9rZW4gPSB0b2tlbnMuaWRUb2tlbjtcbiAgdmFyIHNjb3BlcyA9IGdldFNjb3BlcyhhY2Nlc3NUb2tlbik7XG4gIHZhciBpZGVudGl0eSA9IGdldElkZW50aXR5KGFjY2Vzc1Rva2VuKTtcbiAgdmFyIHNlcnZpY2VEYXRhID0ge1xuICAgIGFjY2Vzc1Rva2VuOiBhY2Nlc3NUb2tlbixcbiAgICBpZFRva2VuOiBpZFRva2VuLFxuICAgIHNjb3BlOiBzY29wZXNcbiAgfTtcblxuICBpZiAoaGFzT3duLmNhbGwodG9rZW5zLCBcImV4cGlyZXNJblwiKSkge1xuICAgIHNlcnZpY2VEYXRhLmV4cGlyZXNBdCA9XG4gICAgICBEYXRlLm5vdygpICsgMTAwMCAqIHBhcnNlSW50KHRva2Vucy5leHBpcmVzSW4sIDEwKTtcbiAgfVxuXG4gIHZhciBmaWVsZHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBHb29nbGUud2hpdGVsaXN0ZWRGaWVsZHMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmIChoYXNPd24uY2FsbChpZGVudGl0eSwgbmFtZSkpIHtcbiAgICAgIGZpZWxkc1tuYW1lXSA9IGlkZW50aXR5W25hbWVdO1xuICAgIH1cbiAgfSk7XG5cbiAgT2JqZWN0LmFzc2lnbihzZXJ2aWNlRGF0YSwgZmllbGRzKTtcblxuICAvLyBvbmx5IHNldCB0aGUgdG9rZW4gaW4gc2VydmljZURhdGEgaWYgaXQncyB0aGVyZS4gdGhpcyBlbnN1cmVzXG4gIC8vIHRoYXQgd2UgZG9uJ3QgbG9zZSBvbGQgb25lcyAoc2luY2Ugd2Ugb25seSBnZXQgdGhpcyBvbiB0aGUgZmlyc3RcbiAgLy8gbG9nIGluIGF0dGVtcHQpXG4gIGlmICh0b2tlbnMucmVmcmVzaFRva2VuKSB7XG4gICAgc2VydmljZURhdGEucmVmcmVzaFRva2VuID0gdG9rZW5zLnJlZnJlc2hUb2tlbjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2VydmljZURhdGE6IHNlcnZpY2VEYXRhLFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIHByb2ZpbGU6IHtcbiAgICAgICAgbmFtZTogaWRlbnRpdHkubmFtZVxuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgaWYgKHJlcXVlc3QuZ29vZ2xlU2lnbkluICE9PSB0cnVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdG9rZW5zID0ge1xuICAgIGFjY2Vzc1Rva2VuOiByZXF1ZXN0LmFjY2Vzc1Rva2VuLFxuICAgIHJlZnJlc2hUb2tlbjogcmVxdWVzdC5yZWZyZXNoVG9rZW4sXG4gICAgaWRUb2tlbjogcmVxdWVzdC5pZFRva2VuLFxuICB9O1xuXG4gIGlmIChyZXF1ZXN0LnNlcnZlckF1dGhDb2RlKSB7XG4gICAgT2JqZWN0LmFzc2lnbih0b2tlbnMsIGdldFRva2Vucyh7XG4gICAgICBjb2RlOiByZXF1ZXN0LnNlcnZlckF1dGhDb2RlXG4gICAgfSkpO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gZ2V0U2VydmljZURhdGFGcm9tVG9rZW5zKHRva2Vucyk7XG5cbiAgcmV0dXJuIEFjY291bnRzLnVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UoXCJnb29nbGVcIiwge1xuICAgIGlkOiByZXF1ZXN0LnVzZXJJZCxcbiAgICBpZFRva2VuOiByZXF1ZXN0LmlkVG9rZW4sXG4gICAgYWNjZXNzVG9rZW46IHJlcXVlc3QuYWNjZXNzVG9rZW4sXG4gICAgZW1haWw6IHJlcXVlc3QuZW1haWwsXG4gICAgcGljdHVyZTogcmVxdWVzdC5pbWFnZVVybCxcbiAgICAuLi5yZXN1bHQuc2VydmljZURhdGEsXG4gIH0sIHJlc3VsdC5vcHRpb25zKTtcbn0pO1xuXG5mdW5jdGlvbiBnZXRTZXJ2aWNlRGF0YShxdWVyeSkge1xuICByZXR1cm4gZ2V0U2VydmljZURhdGFGcm9tVG9rZW5zKGdldFRva2VucyhxdWVyeSkpO1xufVxuXG5PQXV0aC5yZWdpc3RlclNlcnZpY2UoJ2dvb2dsZScsIDIsIG51bGwsIGdldFNlcnZpY2VEYXRhKTtcblxuLy8gcmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZzpcbi8vIC0gYWNjZXNzVG9rZW5cbi8vIC0gZXhwaXJlc0luOiBsaWZldGltZSBvZiB0b2tlbiBpbiBzZWNvbmRzXG4vLyAtIHJlZnJlc2hUb2tlbiwgaWYgdGhpcyBpcyB0aGUgZmlyc3QgYXV0aG9yaXphdGlvbiByZXF1ZXN0XG52YXIgZ2V0VG9rZW5zID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gIHZhciBjb25maWcgPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kT25lKHtzZXJ2aWNlOiAnZ29vZ2xlJ30pO1xuICBpZiAoIWNvbmZpZylcbiAgICB0aHJvdyBuZXcgU2VydmljZUNvbmZpZ3VyYXRpb24uQ29uZmlnRXJyb3IoKTtcblxuICB2YXIgcmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzcG9uc2UgPSBIVFRQLnBvc3QoXG4gICAgICBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi90b2tlblwiLCB7cGFyYW1zOiB7XG4gICAgICAgIGNvZGU6IHF1ZXJ5LmNvZGUsXG4gICAgICAgIGNsaWVudF9pZDogY29uZmlnLmNsaWVudElkLFxuICAgICAgICBjbGllbnRfc2VjcmV0OiBPQXV0aC5vcGVuU2VjcmV0KGNvbmZpZy5zZWNyZXQpLFxuICAgICAgICByZWRpcmVjdF91cmk6IE9BdXRoLl9yZWRpcmVjdFVyaSgnZ29vZ2xlJywgY29uZmlnKSxcbiAgICAgICAgZ3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZSdcbiAgICAgIH19KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgT2JqZWN0LmFzc2lnbihcbiAgICAgIG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb21wbGV0ZSBPQXV0aCBoYW5kc2hha2Ugd2l0aCBHb29nbGUuIFwiICsgZXJyLm1lc3NhZ2UpLFxuICAgICAgeyByZXNwb25zZTogZXJyLnJlc3BvbnNlIH1cbiAgICApO1xuICB9XG5cbiAgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IpIHsgLy8gaWYgdGhlIGh0dHAgcmVzcG9uc2Ugd2FzIGEganNvbiBvYmplY3Qgd2l0aCBhbiBlcnJvciBhdHRyaWJ1dGVcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29tcGxldGUgT0F1dGggaGFuZHNoYWtlIHdpdGggR29vZ2xlLiBcIiArIHJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7XG4gICAgICBhY2Nlc3NUb2tlbjogcmVzcG9uc2UuZGF0YS5hY2Nlc3NfdG9rZW4sXG4gICAgICByZWZyZXNoVG9rZW46IHJlc3BvbnNlLmRhdGEucmVmcmVzaF90b2tlbixcbiAgICAgIGV4cGlyZXNJbjogcmVzcG9uc2UuZGF0YS5leHBpcmVzX2luLFxuICAgICAgaWRUb2tlbjogcmVzcG9uc2UuZGF0YS5pZF90b2tlblxuICAgIH07XG4gIH1cbn07XG5cbnZhciBnZXRJZGVudGl0eSA9IGZ1bmN0aW9uIChhY2Nlc3NUb2tlbikge1xuICB0cnkge1xuICAgIHJldHVybiBIVFRQLmdldChcbiAgICAgIFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL3VzZXJpbmZvXCIsXG4gICAgICB7cGFyYW1zOiB7YWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlbn19KS5kYXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBPYmplY3QuYXNzaWduKFxuICAgICAgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGZldGNoIGlkZW50aXR5IGZyb20gR29vZ2xlLiBcIiArIGVyci5tZXNzYWdlKSxcbiAgICAgIHsgcmVzcG9uc2U6IGVyci5yZXNwb25zZSB9XG4gICAgKTtcbiAgfVxufTtcblxudmFyIGdldFNjb3BlcyA9IGZ1bmN0aW9uIChhY2Nlc3NUb2tlbikge1xuICB0cnkge1xuICAgIHJldHVybiBIVFRQLmdldChcbiAgICAgIFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL3Rva2VuaW5mb1wiLFxuICAgICAge3BhcmFtczoge2FjY2Vzc190b2tlbjogYWNjZXNzVG9rZW59fSkuZGF0YS5zY29wZS5zcGxpdCgnICcpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBPYmplY3QuYXNzaWduKFxuICAgICAgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGZldGNoIHRva2VuaW5mbyBmcm9tIEdvb2dsZS4gXCIgKyBlcnIubWVzc2FnZSksXG4gICAgICB7IHJlc3BvbnNlOiBlcnIucmVzcG9uc2UgfVxuICAgICk7XG4gIH1cbn07XG5cbkdvb2dsZS5yZXRyaWV2ZUNyZWRlbnRpYWwgPSBmdW5jdGlvbihjcmVkZW50aWFsVG9rZW4sIGNyZWRlbnRpYWxTZWNyZXQpIHtcbiAgcmV0dXJuIE9BdXRoLnJldHJpZXZlQ3JlZGVudGlhbChjcmVkZW50aWFsVG9rZW4sIGNyZWRlbnRpYWxTZWNyZXQpO1xufTtcbiIsIi8vIFRoZSBtb2R1bGUuZXhwb3J0cyBvYmplY3Qgb2YgdGhpcyBtb2R1bGUgYmVjb21lcyB0aGUgR29vZ2xlIG5hbWVzcGFjZVxuLy8gZm9yIG90aGVyIG1vZHVsZXMgaW4gdGhpcyBwYWNrYWdlLlxuR29vZ2xlID0gbW9kdWxlLmV4cG9ydHM7XG5cbi8vIFNvIHRoYXQgYXBpLmV4cG9ydCBmaW5kcyB0aGUgXCJHb29nbGVcIiBwcm9wZXJ0eS5cbkdvb2dsZS5Hb29nbGUgPSBHb29nbGU7XG4iXX0=

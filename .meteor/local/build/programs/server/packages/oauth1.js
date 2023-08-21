(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var OAuth1Binding, OAuth1Test;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/oauth1/oauth1_binding.js                                                                    //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
var crypto = Npm.require("crypto");
var querystring = Npm.require("querystring");
var urlModule = Npm.require("url");

// An OAuth1 wrapper around http calls which helps get tokens and
// takes care of HTTP headers
//
// @param config {Object}
//   - consumerKey (String): oauth consumer key
//   - secret (String): oauth consumer secret
// @param urls {Object}
//   - requestToken (String): url
//   - authorize (String): url
//   - accessToken (String): url
//   - authenticate (String): url
OAuth1Binding = function(config, urls) {
  this._config = config;
  this._urls = urls;
};

OAuth1Binding.prototype.prepareRequestToken = function(callbackUrl) {
  var self = this;

  var headers = self._buildHeader({
    oauth_callback: callbackUrl
  });

  var response = self._call('POST', self._urls.requestToken, headers);
  var tokens = querystring.parse(response.content);

  if (! tokens.oauth_callback_confirmed)
    throw _.extend(new Error("oauth_callback_confirmed false when requesting oauth1 token"),
                             {response: response});

  self.requestToken = tokens.oauth_token;
  self.requestTokenSecret = tokens.oauth_token_secret;
};

OAuth1Binding.prototype.prepareAccessToken = function(query, requestTokenSecret) {
  var self = this;

  // support implementations that use request token secrets. This is
  // read by self._call.
  //
  // XXX make it a param to call, not something stashed on self? It's
  // kinda confusing right now, everything except this is passed as
  // arguments, but this is stored.
  if (requestTokenSecret)
    self.accessTokenSecret = requestTokenSecret;

  var headers = self._buildHeader({
    oauth_token: query.oauth_token,
    oauth_verifier: query.oauth_verifier
  });

  var response = self._call('POST', self._urls.accessToken, headers);
  var tokens = querystring.parse(response.content);

  if (! tokens.oauth_token || ! tokens.oauth_token_secret) {
    var error = new Error("missing oauth token or secret");
    // We provide response only if no token is available, we do not want to leak any tokens
    if (! tokens.oauth_token && ! tokens.oauth_token_secret) {
      _.extend(error, {response: response});
    }
    throw error;
  }

  self.accessToken = tokens.oauth_token;
  self.accessTokenSecret = tokens.oauth_token_secret;
};

OAuth1Binding.prototype.call = function(method, url, params, callback) {
  var self = this;

  var headers = self._buildHeader({
    oauth_token: self.accessToken
  });

  if(! params) {
    params = {};
  }

  return self._call(method, url, headers, params, callback);
};

OAuth1Binding.prototype.get = function(url, params, callback) {
  return this.call('GET', url, params, callback);
};

OAuth1Binding.prototype.post = function(url, params, callback) {
  return this.call('POST', url, params, callback);
};

OAuth1Binding.prototype._buildHeader = function(headers) {
  var self = this;
  return _.extend({
    oauth_consumer_key: self._config.consumerKey,
    oauth_nonce: Random.secret().replace(/\W/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: (new Date().valueOf()/1000).toFixed().toString(),
    oauth_version: '1.0'
  }, headers);
};

OAuth1Binding.prototype._getSignature = function(method, url, rawHeaders, accessTokenSecret, params) {
  var self = this;
  var headers = self._encodeHeader(_.extend({}, rawHeaders, params));

  var parameters = _.map(headers, function(val, key) {
    return key + '=' + val;
  }).sort().join('&');

  var signatureBase = [
    method,
    self._encodeString(url),
    self._encodeString(parameters)
  ].join('&');

  var secret = OAuth.openSecret(self._config.secret);

  var signingKey = self._encodeString(secret) + '&';
  if (accessTokenSecret)
    signingKey += self._encodeString(accessTokenSecret);

  return crypto.createHmac('SHA1', signingKey).update(signatureBase).digest('base64');
};

OAuth1Binding.prototype._call = function(method, url, headers, params, callback) {
  var self = this;

  // all URLs to be functions to support parameters/customization
  if(typeof url === "function") {
    url = url(self);
  }

  headers = headers || {};
  params = params || {};

  // Extract all query string parameters from the provided URL
  var parsedUrl = urlModule.parse(url, true);
  // Merge them in a way that params given to the method call have precedence
  params = _.extend({}, parsedUrl.query, params);

  // Reconstruct the URL back without any query string parameters
  // (they are now in params)
  parsedUrl.query = {};
  parsedUrl.search = '';
  url = urlModule.format(parsedUrl);

  // Get the signature
  headers.oauth_signature =
    self._getSignature(method, url, headers, self.accessTokenSecret, params);

  // Make a authorization string according to oauth1 spec
  var authString = self._getAuthHeaderString(headers);

  // Make signed request
  try {
    var response = HTTP.call(method, url, {
      params: params,
      headers: {
        Authorization: authString
      }
    }, callback && function (error, response) {
      if (! error) {
        response.nonce = headers.oauth_nonce;
      }
      callback(error, response);
    });
    // We store nonce so that JWTs can be validated
    if (response)
      response.nonce = headers.oauth_nonce;
    return response;
  } catch (err) {
    throw _.extend(new Error("Failed to send OAuth1 request to " + url + ". " + err.message),
                   {response: err.response});
  }
};

OAuth1Binding.prototype._encodeHeader = function(header) {
  var self = this;
  return _.reduce(header, function(memo, val, key) {
    memo[self._encodeString(key)] = self._encodeString(val);
    return memo;
  }, {});
};

OAuth1Binding.prototype._encodeString = function(str) {
  return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
};

OAuth1Binding.prototype._getAuthHeaderString = function(headers) {
  var self = this;
  return 'OAuth ' +  _.map(headers, function(val, key) {
    return self._encodeString(key) + '="' + self._encodeString(val) + '"';
  }).sort().join(', ');
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/oauth1/oauth1_server.js                                                                     //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
var url = Npm.require("url");

OAuth._queryParamsWithAuthTokenUrl = function (authUrl, oauthBinding, params, whitelistedQueryParams) {
  params = params || {};
  var redirectUrlObj = url.parse(authUrl, true);

  _.extend(
    redirectUrlObj.query,
    _.pick(params.query, whitelistedQueryParams),
    {
      oauth_token: oauthBinding.requestToken,
    }
  );

  // Clear the `search` so it is rebuilt by Node's `url` from the `query` above.
  // Using previous versions of the Node `url` module, this was just set to ""
  // However, Node 6 docs seem to indicate that this should be `undefined`.
  delete redirectUrlObj.search;

  // Reconstruct the URL back with provided query parameters merged with oauth_token
  return url.format(redirectUrlObj);
};

// connect middleware
OAuth._requestHandlers['1'] = function (service, query, res) {
  var config = ServiceConfiguration.configurations.findOne({service: service.serviceName});
  if (! config) {
    throw new ServiceConfiguration.ConfigError(service.serviceName);
  }

  var urls = service.urls;
  var oauthBinding = new OAuth1Binding(config, urls);

  var credentialSecret;

  if (query.requestTokenAndRedirect) {
    // step 1 - get and store a request token
    var callbackUrl = OAuth._redirectUri(service.serviceName, config, {
      state: query.state,
      cordova: (query.cordova === "true"),
      android: (query.android === "true")
    });

    // Get a request token to start auth process
    oauthBinding.prepareRequestToken(callbackUrl);

    // Keep track of request token so we can verify it on the next step
    OAuth._storeRequestToken(
      OAuth._credentialTokenFromQuery(query),
      oauthBinding.requestToken,
      oauthBinding.requestTokenSecret);

    // support for scope/name parameters
    var redirectUrl;
    var authParams = {
      query: query
    };

    if(typeof urls.authenticate === "function") {
      redirectUrl = urls.authenticate(oauthBinding, authParams);
    } else {
      redirectUrl = OAuth._queryParamsWithAuthTokenUrl(
        urls.authenticate,
        oauthBinding,
        authParams
      );
    }

    // redirect to provider login, which will redirect back to "step 2" below

    res.writeHead(302, {'Location': redirectUrl});
    res.end();
  } else {
    // step 2, redirected from provider login - store the result
    // and close the window to allow the login handler to proceed

    // Get the user's request token so we can verify it and clear it
    var requestTokenInfo = OAuth._retrieveRequestToken(
      OAuth._credentialTokenFromQuery(query));

    if (! requestTokenInfo) {
      throw new Error("Unable to retrieve request token");
    }

    // Verify user authorized access and the oauth_token matches
    // the requestToken from previous step
    if (query.oauth_token && query.oauth_token === requestTokenInfo.requestToken) {

      // Prepare the login results before returning.  This way the
      // subsequent call to the `login` method will be immediate.

      // Get the access token for signing requests
      oauthBinding.prepareAccessToken(query, requestTokenInfo.requestTokenSecret);

      // Run service-specific handler.
      var oauthResult = service.handleOauthRequest(
        oauthBinding, { query: query });

      var credentialToken = OAuth._credentialTokenFromQuery(query);
      credentialSecret = Random.secret();

      // Store the login result so it can be retrieved in another
      // browser tab by the result handler
      OAuth._storePendingCredential(credentialToken, {
        serviceName: service.serviceName,
        serviceData: oauthResult.serviceData,
        options: oauthResult.options
      }, credentialSecret);
    }

    // Either close the window, redirect, or render nothing
    // if all else fails
    OAuth._renderOauthResults(res, query, credentialSecret);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/oauth1/oauth1_pending_request_tokens.js                                                     //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
//
// _pendingRequestTokens are request tokens that have been received
// but not yet fully authorized (processed).
//
// During the oauth1 authorization process, the Meteor App opens
// a pop-up, requests a request token from the oauth1 service, and
// redirects the browser to the oauth1 service for the user
// to grant authorization.  The user is then returned to the
// Meteor Apps' callback url and the request token is verified.
//
// When Meteor Apps run on multiple servers, it's possible that
// 2 different servers may be used to generate the request token
// and to verify it in the callback once the user has authorized.
//
// For this reason, the _pendingRequestTokens are stored in the database
// so they can be shared across Meteor App servers.
//
// XXX This code is fairly similar to oauth/pending_credentials.js --
// maybe we can combine them somehow.

// Collection containing pending request tokens
// Has key, requestToken, requestTokenSecret, and createdAt fields.
OAuth._pendingRequestTokens = new Mongo.Collection(
  "meteor_oauth_pendingRequestTokens", {
    _preventAutopublish: true
  });

OAuth._pendingRequestTokens._ensureIndex('key', {unique: 1});
OAuth._pendingRequestTokens._ensureIndex('createdAt');



// Periodically clear old entries that never got completed
var _cleanStaleResults = function() {
  // Remove request tokens older than 5 minute
  var timeCutoff = new Date();
  timeCutoff.setMinutes(timeCutoff.getMinutes() - 5);
  OAuth._pendingRequestTokens.remove({ createdAt: { $lt: timeCutoff } });
};
var _cleanupHandle = Meteor.setInterval(_cleanStaleResults, 60 * 1000);


// Stores the key and request token in the _pendingRequestTokens collection.
// Will throw an exception if `key` is not a string.
//
// @param key {string}
// @param requestToken {string}
// @param requestTokenSecret {string}
//
OAuth._storeRequestToken = function (key, requestToken, requestTokenSecret) {
  check(key, String);

  // We do an upsert here instead of an insert in case the user happens
  // to somehow send the same `state` parameter twice during an OAuth
  // login; we don't want a duplicate key error.
  OAuth._pendingRequestTokens.upsert({
    key: key
  }, {
    key: key,
    requestToken: OAuth.sealSecret(requestToken),
    requestTokenSecret: OAuth.sealSecret(requestTokenSecret),
    createdAt: new Date()
  });
};


// Retrieves and removes a request token from the _pendingRequestTokens collection
// Returns an object containing requestToken and requestTokenSecret properties
//
// @param key {string}
//
OAuth._retrieveRequestToken = function (key) {
  check(key, String);

  var pendingRequestToken = OAuth._pendingRequestTokens.findOne({ key: key });
  if (pendingRequestToken) {
    OAuth._pendingRequestTokens.remove({ _id: pendingRequestToken._id });
    return {
      requestToken: OAuth.openSecret(pendingRequestToken.requestToken),
      requestTokenSecret: OAuth.openSecret(
        pendingRequestToken.requestTokenSecret)
    };
  } else {
    return undefined;
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("oauth1", {
  OAuth1Binding: OAuth1Binding,
  OAuth1Test: OAuth1Test
});

})();

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
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Random = Package.random.Random;
var Hook = Package['callback-hook'].Hook;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var DDP = Package['ddp-client'].DDP;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

/* Package-scope variables */
var Accounts, EXPIRE_TOKENS_INTERVAL_MS, CONNECTION_CLOSE_DELAY_MS;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-base":{"client_main.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/client_main.js                                                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var module1 = module;
module1.export({
  AccountsClient: function () {
    return AccountsClient;
  },
  AccountsTest: function () {
    return AccountsTest;
  }
});
var AccountsClient;
module1.watch(require("./accounts_client.js"), {
  AccountsClient: function (v) {
    AccountsClient = v;
  }
}, 0);
var AccountsTest;
module1.watch(require("./url_client.js"), {
  AccountsTest: function (v) {
    AccountsTest = v;
  }
}, 1);
module1.watch(require("./localstorage_token.js"));

/**
 * @namespace Accounts
 * @summary The namespace for all client-side accounts-related methods.
 */
Accounts = new AccountsClient();
/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 * @importFromPackage meteor
 */

Meteor.users = Accounts.users;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_client.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/accounts_client.js                                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

module.export({
  AccountsClient: function () {
    return AccountsClient;
  }
});
var AccountsCommon;
module.watch(require("./accounts_common.js"), {
  AccountsCommon: function (v) {
    AccountsCommon = v;
  }
}, 0);

var AccountsClient =
/*#__PURE__*/
function (_AccountsCommon) {
  (0, _inheritsLoose2.default)(AccountsClient, _AccountsCommon);

  function AccountsClient(options) {
    var _this;

    _this = _AccountsCommon.call(this, options) || this;
    _this._loggingIn = new ReactiveVar(false);
    _this._loggingOut = new ReactiveVar(false);
    _this._loginServicesHandle = _this.connection.subscribe("meteor.loginServiceConfiguration");
    _this._pageLoadLoginCallbacks = [];
    _this._pageLoadLoginAttemptInfo = null; // Defined in url_client.js.

    _this._initUrlMatching(); // Defined in localstorage_token.js.


    _this._initLocalStorage(); // This is for .registerClientLoginFunction & .callLoginFunction.


    _this._loginFuncs = {};
    return _this;
  } ///
  /// CURRENT USER
  ///
  // @override


  var _proto = AccountsClient.prototype;

  _proto.userId = function () {
    function userId() {
      return this.connection.userId();
    }

    return userId;
  }(); // This is mostly just called within this file, but Meteor.loginWithPassword
  // also uses it to make loggingIn() be true during the beginPasswordExchange
  // method call too.


  _proto._setLoggingIn = function () {
    function _setLoggingIn(x) {
      this._loggingIn.set(x);
    }

    return _setLoggingIn;
  }();
  /**
   * @summary True if a login method (such as `Meteor.loginWithPassword`, `Meteor.loginWithFacebook`, or `Accounts.createUser`) is currently in progress. A reactive data source.
   * @locus Client
   */


  _proto.loggingIn = function () {
    function loggingIn() {
      return this._loggingIn.get();
    }

    return loggingIn;
  }();
  /**
   * @summary True if a logout method (such as `Meteor.logout`) is currently in progress. A reactive data source.
   * @locus Client
   */


  _proto.loggingOut = function () {
    function loggingOut() {
      return this._loggingOut.get();
    }

    return loggingOut;
  }();
  /**
   * @summary Register a new login function on the client. Intended for OAuth package authors. You can call the login function by using
   `Accounts.callLoginFunction` or `Accounts.callLoginFunction`.
   * @locus Client
   * @param {String} funcName The name of your login function. Used by `Accounts.callLoginFunction` and `Accounts.applyLoginFunction`.
   Should be the OAuth provider name accordingly.
   * @param {Function} func The actual function you want to call. Just write it in the manner of `loginWithFoo`.
   */


  _proto.registerClientLoginFunction = function () {
    function registerClientLoginFunction(funcName, func) {
      if (this._loginFuncs[funcName]) {
        throw new Error(funcName + " has been defined already");
      }

      this._loginFuncs[funcName] = func;
    }

    return registerClientLoginFunction;
  }();
  /**
   * @summary Call a login function defined using `Accounts.registerClientLoginFunction`. Excluding the first argument, all remaining
   arguments are passed to the login function accordingly. Use `applyLoginFunction` if you want to pass in an arguments array that contains
   all arguments for the login function.
   * @locus Client
   * @param {String} funcName The name of the login function you wanted to call.
   */


  _proto.callLoginFunction = function () {
    function callLoginFunction(funcName) {
      if (!this._loginFuncs[funcName]) {
        throw new Error(funcName + " was not defined");
      }

      for (var _len = arguments.length, funcArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        funcArgs[_key - 1] = arguments[_key];
      }

      return this._loginFuncs[funcName].apply(this, funcArgs);
    }

    return callLoginFunction;
  }();
  /**
   * @summary Same as ``callLoginFunction` but accept an `arguments` which contains all arguments for the login
   function.
   * @locus Client
   * @param {String} funcName The name of the login function you wanted to call.
   * @param {Array} funcArgs The `arguments` for the login function.
   */


  _proto.applyLoginFunction = function () {
    function applyLoginFunction(funcName, funcArgs) {
      if (!this._loginFuncs[funcName]) {
        throw new Error(funcName + " was not defined");
      }

      return this._loginFuncs[funcName].apply(this, funcArgs);
    }

    return applyLoginFunction;
  }();
  /**
   * @summary Log the user out.
   * @locus Client
   * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
   */


  _proto.logout = function () {
    function logout(callback) {
      var self = this;

      self._loggingOut.set(true);

      self.connection.apply('logout', [], {
        wait: true
      }, function (error, result) {
        self._loggingOut.set(false);

        if (error) {
          callback && callback(error);
        } else {
          self.makeClientLoggedOut();
          callback && callback();
        }
      });
    }

    return logout;
  }();
  /**
   * @summary Log out other clients logged in as the current user, but does not log out the client that calls this function.
   * @locus Client
   * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
   */


  _proto.logoutOtherClients = function () {
    function logoutOtherClients(callback) {
      var self = this; // We need to make two method calls: one to replace our current token,
      // and another to remove all tokens except the current one. We want to
      // call these two methods one after the other, without any other
      // methods running between them. For example, we don't want `logout`
      // to be called in between our two method calls (otherwise the second
      // method call would return an error). Another example: we don't want
      // logout to be called before the callback for `getNewToken`;
      // otherwise we would momentarily log the user out and then write a
      // new token to localStorage.
      //
      // To accomplish this, we make both calls as wait methods, and queue
      // them one after the other, without spinning off the event loop in
      // between. Even though we queue `removeOtherTokens` before
      // `getNewToken`, we won't actually send the `removeOtherTokens` call
      // until the `getNewToken` callback has finished running, because they
      // are both wait methods.

      self.connection.apply('getNewToken', [], {
        wait: true
      }, function (err, result) {
        if (!err) {
          self._storeLoginToken(self.userId(), result.token, result.tokenExpires);
        }
      });
      self.connection.apply('removeOtherTokens', [], {
        wait: true
      }, function (err) {
        callback && callback(err);
      });
    }

    return logoutOtherClients;
  }();

  return AccountsClient;
}(AccountsCommon);

;
var Ap = AccountsClient.prototype;
/**
 * @summary True if a login method (such as `Meteor.loginWithPassword`, `Meteor.loginWithFacebook`, or `Accounts.createUser`) is currently in progress. A reactive data source.
 * @locus Client
 * @importFromPackage meteor
 */

Meteor.loggingIn = function () {
  return Accounts.loggingIn();
};
/**
 * @summary True if a logout method (such as `Meteor.logout`) is currently in progress. A reactive data source.
 * @locus Client
 * @importFromPackage meteor
 */


Meteor.loggingOut = function () {
  return Accounts.loggingOut();
}; ///
/// LOGIN METHODS
///
// Call a login method on the server.
//
// A login method is a method which on success calls `this.setUserId(id)` and
// `Accounts._setLoginToken` on the server and returns an object with fields
// 'id' (containing the user id), 'token' (containing a resume token), and
// optionally `tokenExpires`.
//
// This function takes care of:
//   - Updating the Meteor.loggingIn() reactive data source
//   - Calling the method in 'wait' mode
//   - On success, saving the resume token to localStorage
//   - On success, calling Accounts.connection.setUserId()
//   - Setting up an onReconnect handler which logs in with
//     the resume token
//
// Options:
// - methodName: The method to call (default 'login')
// - methodArguments: The arguments for the method
// - validateResult: If provided, will be called with the result of the
//                 method. If it throws, the client will not be logged in (and
//                 its error will be passed to the callback).
// - userCallback: Will be called with no arguments once the user is fully
//                 logged in, or with the error on error.
//


Ap.callLoginMethod = function (options) {
  var self = this;
  options = _.extend({
    methodName: 'login',
    methodArguments: [{}],
    _suppressLoggingIn: false
  }, options); // Set defaults for callback arguments to no-op functions; make sure we
  // override falsey values too.

  _.each(['validateResult', 'userCallback'], function (f) {
    if (!options[f]) options[f] = function () {};
  }); // Prepare callbacks: user provided and onLogin/onLoginFailure hooks.


  var loginCallbacks = _.once(function (_ref) {
    var error = _ref.error,
        loginDetails = _ref.loginDetails;

    if (!error) {
      self._onLoginHook.each(function (callback) {
        callback(loginDetails);
        return true;
      });
    } else {
      self._onLoginFailureHook.each(function (callback) {
        callback({
          error: error
        });
        return true;
      });
    }

    options.userCallback(error, loginDetails);
  });

  var reconnected = false; // We want to set up onReconnect as soon as we get a result token back from
  // the server, without having to wait for subscriptions to rerun. This is
  // because if we disconnect and reconnect between getting the result and
  // getting the results of subscription rerun, we WILL NOT re-send this
  // method (because we never re-send methods whose results we've received)
  // but we WILL call loggedInAndDataReadyCallback at "reconnect quiesce"
  // time. This will lead to makeClientLoggedIn(result.id) even though we
  // haven't actually sent a login method!
  //
  // But by making sure that we send this "resume" login in that case (and
  // calling makeClientLoggedOut if it fails), we'll end up with an accurate
  // client-side userId. (It's important that livedata_connection guarantees
  // that the "reconnect quiesce"-time call to loggedInAndDataReadyCallback
  // will occur before the callback from the resume login call.)

  var onResultReceived = function (err, result) {
    if (err || !result || !result.token) {// Leave onReconnect alone if there was an error, so that if the user was
      // already logged in they will still get logged in on reconnect.
      // See issue #4970.
    } else {
      // First clear out any previously set Acccounts login onReconnect
      // callback (to make sure we don't keep piling up duplicate callbacks,
      // which would then all be triggered when reconnecting).
      if (self._reconnectStopper) {
        self._reconnectStopper.stop();
      }

      self._reconnectStopper = DDP.onReconnect(function (conn) {
        if (conn != self.connection) {
          return;
        }

        reconnected = true; // If our token was updated in storage, use the latest one.

        var storedToken = self._storedLoginToken();

        if (storedToken) {
          result = {
            token: storedToken,
            tokenExpires: self._storedLoginTokenExpires()
          };
        }

        if (!result.tokenExpires) result.tokenExpires = self._tokenExpiration(new Date());

        if (self._tokenExpiresSoon(result.tokenExpires)) {
          self.makeClientLoggedOut();
        } else {
          self.callLoginMethod({
            methodArguments: [{
              resume: result.token
            }],
            // Reconnect quiescence ensures that the user doesn't see an
            // intermediate state before the login method finishes. So we don't
            // need to show a logging-in animation.
            _suppressLoggingIn: true,
            userCallback: function (error, loginDetails) {
              var storedTokenNow = self._storedLoginToken();

              if (error) {
                // If we had a login error AND the current stored token is the
                // one that we tried to log in with, then declare ourselves
                // logged out. If there's a token in storage but it's not the
                // token that we tried to log in with, we don't know anything
                // about whether that token is valid or not, so do nothing. The
                // periodic localStorage poll will decide if we are logged in or
                // out with this token, if it hasn't already. Of course, even
                // with this check, another tab could insert a new valid token
                // immediately before we clear localStorage here, which would
                // lead to both tabs being logged out, but by checking the token
                // in storage right now we hope to make that unlikely to happen.
                //
                // If there is no token in storage right now, we don't have to
                // do anything; whatever code removed the token from storage was
                // responsible for calling `makeClientLoggedOut()`, or the
                // periodic localStorage poll will call `makeClientLoggedOut`
                // eventually if another tab wiped the token from storage.
                if (storedTokenNow && storedTokenNow === result.token) {
                  self.makeClientLoggedOut();
                }
              } // Possibly a weird callback to call, but better than nothing if
              // there is a reconnect between "login result received" and "data
              // ready".


              loginCallbacks({
                error: error,
                loginDetails: loginDetails
              });
            }
          });
        }
      });
    }
  }; // This callback is called once the local cache of the current-user
  // subscription (and all subscriptions, in fact) are guaranteed to be up to
  // date.


  var loggedInAndDataReadyCallback = function (error, result) {
    // If the login method returns its result but the connection is lost
    // before the data is in the local cache, it'll set an onReconnect (see
    // above). The onReconnect will try to log in using the token, and *it*
    // will call userCallback via its own version of this
    // loggedInAndDataReadyCallback. So we don't have to do anything here.
    if (reconnected) return; // Note that we need to call this even if _suppressLoggingIn is true,
    // because it could be matching a _setLoggingIn(true) from a
    // half-completed pre-reconnect login method.

    self._setLoggingIn(false);

    if (error || !result) {
      error = error || new Error("No result from call to " + options.methodName);
      loginCallbacks({
        error: error
      });
      return;
    }

    try {
      options.validateResult(result);
    } catch (e) {
      loginCallbacks({
        error: e
      });
      return;
    } // Make the client logged in. (The user data should already be loaded!)


    self.makeClientLoggedIn(result.id, result.token, result.tokenExpires);
    loginCallbacks({
      loginDetails: {
        type: result.type
      }
    });
  };

  if (!options._suppressLoggingIn) self._setLoggingIn(true);
  self.connection.apply(options.methodName, options.methodArguments, {
    wait: true,
    onResultReceived: onResultReceived
  }, loggedInAndDataReadyCallback);
};

Ap.makeClientLoggedOut = function () {
  // Ensure client was successfully logged in before running logout hooks.
  if (this.connection._userId) {
    this._onLogoutHook.each(function (callback) {
      callback();
      return true;
    });
  }

  this._unstoreLoginToken();

  this.connection.setUserId(null);
  this._reconnectStopper && this._reconnectStopper.stop();
};

Ap.makeClientLoggedIn = function (userId, token, tokenExpires) {
  this._storeLoginToken(userId, token, tokenExpires);

  this.connection.setUserId(userId);
};
/**
 * @summary Log the user out.
 * @locus Client
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 * @importFromPackage meteor
 */


Meteor.logout = function (callback) {
  return Accounts.logout(callback);
};
/**
 * @summary Log out other clients logged in as the current user, but does not log out the client that calls this function.
 * @locus Client
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 * @importFromPackage meteor
 */


Meteor.logoutOtherClients = function (callback) {
  return Accounts.logoutOtherClients(callback);
}; ///
/// LOGIN SERVICES
///
// A reactive function returning whether the loginServiceConfiguration
// subscription is ready. Used by accounts-ui to hide the login button
// until we have all the configuration loaded
//


Ap.loginServicesConfigured = function () {
  return this._loginServicesHandle.ready();
}; // Some login services such as the redirect login flow or the resume
// login handler can log the user in at page load time.  The
// Meteor.loginWithX functions have a callback argument, but the
// callback function instance won't be in memory any longer if the
// page was reloaded.  The `onPageLoadLogin` function allows a
// callback to be registered for the case where the login was
// initiated in a previous VM, and we now have the result of the login
// attempt in a new VM.
// Register a callback to be called if we have information about a
// login attempt at page load time.  Call the callback immediately if
// we already have the page load login attempt info, otherwise stash
// the callback to be called if and when we do get the attempt info.
//


Ap.onPageLoadLogin = function (f) {
  if (this._pageLoadLoginAttemptInfo) {
    f(this._pageLoadLoginAttemptInfo);
  } else {
    this._pageLoadLoginCallbacks.push(f);
  }
}; // Receive the information about the login attempt at page load time.
// Call registered callbacks, and also record the info in case
// someone's callback hasn't been registered yet.
//


Ap._pageLoadLogin = function (attemptInfo) {
  if (this._pageLoadLoginAttemptInfo) {
    Meteor._debug("Ignoring unexpected duplicate page load login attempt info");

    return;
  }

  _.each(this._pageLoadLoginCallbacks, function (callback) {
    callback(attemptInfo);
  });

  this._pageLoadLoginCallbacks = [];
  this._pageLoadLoginAttemptInfo = attemptInfo;
}; ///
/// HANDLEBARS HELPERS
///
// If our app has a Blaze, register the {{currentUser}} and {{loggingIn}}
// global helpers.


if (Package.blaze) {
  /**
   * @global
   * @name  currentUser
   * @isHelper true
   * @summary Calls [Meteor.user()](#meteor_user). Use `{{#if currentUser}}` to check whether the user is logged in.
   */
  Package.blaze.Blaze.Template.registerHelper('currentUser', function () {
    return Meteor.user();
  });
  /**
   * @global
   * @name  loggingIn
   * @isHelper true
   * @summary Calls [Meteor.loggingIn()](#meteor_loggingin).
   */

  Package.blaze.Blaze.Template.registerHelper('loggingIn', function () {
    return Meteor.loggingIn();
  });
  /**
   * @global
   * @name  loggingOut
   * @isHelper true
   * @summary Calls [Meteor.loggingOut()](#meteor_loggingout).
   */

  Package.blaze.Blaze.Template.registerHelper('loggingOut', function () {
    return Meteor.loggingOut();
  });
  /**
   * @global
   * @name  loggingInOrOut
   * @isHelper true
   * @summary Calls [Meteor.loggingIn()](#meteor_loggingin) or [Meteor.loggingOut()](#meteor_loggingout).
   */

  Package.blaze.Blaze.Template.registerHelper('loggingInOrOut', function () {
    return Meteor.loggingIn() || Meteor.loggingOut();
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_common.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/accounts_common.js                                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  AccountsCommon: function () {
    return AccountsCommon;
  }
});

var AccountsCommon =
/*#__PURE__*/
function () {
  function AccountsCommon(options) {
    // Currently this is read directly by packages like accounts-password
    // and accounts-ui-unstyled.
    this._options = {}; // Note that setting this.connection = null causes this.users to be a
    // LocalCollection, which is not what we want.

    this.connection = undefined;

    this._initConnection(options || {}); // There is an allow call in accounts_server.js that restricts writes to
    // this collection.


    this.users = new Mongo.Collection("users", {
      _preventAutopublish: true,
      connection: this.connection
    }); // Callback exceptions are printed with Meteor._debug and ignored.

    this._onLoginHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: "onLogin callback"
    });
    this._onLoginFailureHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: "onLoginFailure callback"
    });
    this._onLogoutHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: "onLogout callback"
    });
  }
  /**
   * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */


  var _proto = AccountsCommon.prototype;

  _proto.userId = function () {
    function userId() {
      throw new Error("userId method not implemented");
    }

    return userId;
  }();
  /**
   * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */


  _proto.user = function () {
    function user() {
      var userId = this.userId();
      return userId ? this.users.findOne(userId) : null;
    }

    return user;
  }(); // Set up config for the accounts system. Call this on both the client
  // and the server.
  //
  // Note that this method gets overridden on AccountsServer.prototype, but
  // the overriding method calls the overridden method.
  //
  // XXX we should add some enforcement that this is called on both the
  // client and the server. Otherwise, a user can
  // 'forbidClientAccountCreation' only on the client and while it looks
  // like their app is secure, the server will still accept createUser
  // calls. https://github.com/meteor/meteor/issues/828
  //
  // @param options {Object} an object with fields:
  // - sendVerificationEmail {Boolean}
  //     Send email address verification emails to new users created from
  //     client signups.
  // - forbidClientAccountCreation {Boolean}
  //     Do not allow clients to create accounts directly.
  // - restrictCreationByEmailDomain {Function or String}
  //     Require created users to have an email matching the function or
  //     having the string as domain.
  // - loginExpirationInDays {Number}
  //     Number of days since login until a user is logged out (login token
  //     expires).
  // - passwordResetTokenExpirationInDays {Number}
  //     Number of days since password reset token creation until the
  //     token cannt be used any longer (password reset token expires).
  // - ambiguousErrorMessages {Boolean}
  //     Return ambiguous error messages from login failures to prevent
  //     user enumeration.
  // - bcryptRounds {Number}
  //     Allows override of number of bcrypt rounds (aka work factor) used
  //     to store passwords.

  /**
   * @summary Set global accounts options.
   * @locus Anywhere
   * @param {Object} options
   * @param {Boolean} options.sendVerificationEmail New users with an email address will receive an address verification email.
   * @param {Boolean} options.forbidClientAccountCreation Calls to [`createUser`](#accounts_createuser) from the client will be rejected. In addition, if you are using [accounts-ui](#accountsui), the "Create account" link will not be available.
   * @param {String | Function} options.restrictCreationByEmailDomain If set to a string, only allows new users if the domain part of their email address matches the string. If set to a function, only allows new users if the function returns true.  The function is passed the full email address of the proposed new user.  Works with password-based sign-in and external services that expose email addresses (Google, Facebook, GitHub). All existing users still can log in after enabling this option. Example: `Accounts.config({ restrictCreationByEmailDomain: 'school.edu' })`.
   * @param {Number} options.loginExpirationInDays The number of days from when a user logs in until their token expires and they are logged out. Defaults to 90. Set to `null` to disable login expiration.
   * @param {String} options.oauthSecretKey When using the `oauth-encryption` package, the 16 byte key using to encrypt sensitive account credentials in the database, encoded in base64.  This option may only be specifed on the server.  See packages/oauth-encryption/README.md for details.
   * @param {Number} options.passwordResetTokenExpirationInDays The number of days from when a link to reset password is sent until token expires and user can't reset password with the link anymore. Defaults to 3.
   * @param {Number} options.passwordEnrollTokenExpirationInDays The number of days from when a link to set inital password is sent until token expires and user can't set password with the link anymore. Defaults to 30.
   * @param {Boolean} options.ambiguousErrorMessages Return ambiguous error messages from login failures to prevent user enumeration. Defaults to false.
   */


  _proto.config = function () {
    function config(options) {
      var self = this; // We don't want users to accidentally only call Accounts.config on the
      // client, where some of the options will have partial effects (eg removing
      // the "create account" button from accounts-ui if forbidClientAccountCreation
      // is set, or redirecting Google login to a specific-domain page) without
      // having their full effects.

      if (Meteor.isServer) {
        __meteor_runtime_config__.accountsConfigCalled = true;
      } else if (!__meteor_runtime_config__.accountsConfigCalled) {
        // XXX would be nice to "crash" the client and replace the UI with an error
        // message, but there's no trivial way to do this.
        Meteor._debug("Accounts.config was called on the client but not on the " + "server; some configuration options may not take effect.");
      } // We need to validate the oauthSecretKey option at the time
      // Accounts.config is called. We also deliberately don't store the
      // oauthSecretKey in Accounts._options.


      if (_.has(options, "oauthSecretKey")) {
        if (Meteor.isClient) throw new Error("The oauthSecretKey option may only be specified on the server");
        if (!Package["oauth-encryption"]) throw new Error("The oauth-encryption package must be loaded to set oauthSecretKey");
        Package["oauth-encryption"].OAuthEncryption.loadKey(options.oauthSecretKey);
        options = _.omit(options, "oauthSecretKey");
      } // validate option keys


      var VALID_KEYS = ["sendVerificationEmail", "forbidClientAccountCreation", "passwordEnrollTokenExpirationInDays", "restrictCreationByEmailDomain", "loginExpirationInDays", "passwordResetTokenExpirationInDays", "ambiguousErrorMessages", "bcryptRounds"];

      _.each(_.keys(options), function (key) {
        if (!_.contains(VALID_KEYS, key)) {
          throw new Error("Accounts.config: Invalid key: " + key);
        }
      }); // set values in Accounts._options


      _.each(VALID_KEYS, function (key) {
        if (key in options) {
          if (key in self._options) {
            throw new Error("Can't set `" + key + "` more than once");
          }

          self._options[key] = options[key];
        }
      });
    }

    return config;
  }();
  /**
   * @summary Register a callback to be called after a login attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when login is successful.
   *                        The callback receives a single object that
   *                        holds login details. This object contains the login
   *                        result type (password, resume, etc.) on both the
   *                        client and server. `onLogin` callbacks registered
   *                        on the server also receive extra data, such
   *                        as user details, connection information, etc.
   */


  _proto.onLogin = function () {
    function onLogin(func) {
      return this._onLoginHook.register(func);
    }

    return onLogin;
  }();
  /**
   * @summary Register a callback to be called after a login attempt fails.
   * @locus Anywhere
   * @param {Function} func The callback to be called after the login has failed.
   */


  _proto.onLoginFailure = function () {
    function onLoginFailure(func) {
      return this._onLoginFailureHook.register(func);
    }

    return onLoginFailure;
  }();
  /**
   * @summary Register a callback to be called after a logout attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when logout is successful.
   */


  _proto.onLogout = function () {
    function onLogout(func) {
      return this._onLogoutHook.register(func);
    }

    return onLogout;
  }();

  _proto._initConnection = function () {
    function _initConnection(options) {
      if (!Meteor.isClient) {
        return;
      } // The connection used by the Accounts system. This is the connection
      // that will get logged in by Meteor.login(), and this is the
      // connection whose login state will be reflected by Meteor.userId().
      //
      // It would be much preferable for this to be in accounts_client.js,
      // but it has to be here because it's needed to create the
      // Meteor.users collection.


      if (options.connection) {
        this.connection = options.connection;
      } else if (options.ddpUrl) {
        this.connection = DDP.connect(options.ddpUrl);
      } else if (typeof __meteor_runtime_config__ !== "undefined" && __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL) {
        // Temporary, internal hook to allow the server to point the client
        // to a different authentication server. This is for a very
        // particular use case that comes up when implementing a oauth
        // server. Unsupported and may go away at any point in time.
        //
        // We will eventually provide a general way to use account-base
        // against any DDP connection, not just one special one.
        this.connection = DDP.connect(__meteor_runtime_config__.ACCOUNTS_CONNECTION_URL);
      } else {
        this.connection = Meteor.connection;
      }
    }

    return _initConnection;
  }();

  _proto._getTokenLifetimeMs = function () {
    function _getTokenLifetimeMs() {
      // When loginExpirationInDays is set to null, we'll use a really high
      // number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an
      // unexpiring token.
      var loginExpirationInDays = this._options.loginExpirationInDays === null ? LOGIN_UNEXPIRING_TOKEN_DAYS : this._options.loginExpirationInDays;
      return (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
    }

    return _getTokenLifetimeMs;
  }();

  _proto._getPasswordResetTokenLifetimeMs = function () {
    function _getPasswordResetTokenLifetimeMs() {
      return (this._options.passwordResetTokenExpirationInDays || DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
    }

    return _getPasswordResetTokenLifetimeMs;
  }();

  _proto._getPasswordEnrollTokenLifetimeMs = function () {
    function _getPasswordEnrollTokenLifetimeMs() {
      return (this._options.passwordEnrollTokenExpirationInDays || DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
    }

    return _getPasswordEnrollTokenLifetimeMs;
  }();

  _proto._tokenExpiration = function () {
    function _tokenExpiration(when) {
      // We pass when through the Date constructor for backwards compatibility;
      // `when` used to be a number.
      return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
    }

    return _tokenExpiration;
  }();

  _proto._tokenExpiresSoon = function () {
    function _tokenExpiresSoon(when) {
      var minLifetimeMs = .1 * this._getTokenLifetimeMs();

      var minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;
      if (minLifetimeMs > minLifetimeCapMs) minLifetimeMs = minLifetimeCapMs;
      return new Date() > new Date(when) - minLifetimeMs;
    }

    return _tokenExpiresSoon;
  }();

  return AccountsCommon;
}();

var Ap = AccountsCommon.prototype; // Note that Accounts is defined separately in accounts_client.js and
// accounts_server.js.

/**
 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 */

Meteor.userId = function () {
  return Accounts.userId();
};
/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 */


Meteor.user = function () {
  return Accounts.user();
}; // how long (in days) until a login token expires


var DEFAULT_LOGIN_EXPIRATION_DAYS = 90; // Expose for testing.

Ap.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS; // how long (in days) until reset password token expires

var DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3; // how long (in days) until enrol password token expires

var DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30; // Clients don't try to auto-login with a token that is going to expire within
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.
// Tries to avoid abrupt disconnects from expiring tokens.

var MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
// how often (in milliseconds) we check for expired tokens

EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000; // 10 minutes
// how long we wait before logging out clients when Meteor.logoutOtherClients is
// called

CONNECTION_CLOSE_DELAY_MS = 10 * 1000; // A large number of expiration days (approximately 100 years worth) that is
// used when creating unexpiring tokens.

var LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100; // Expose for testing.

Ap.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS; // loginServiceConfiguration and ConfigError are maintained for backwards compatibility

Meteor.startup(function () {
  var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
  Ap.loginServiceConfiguration = ServiceConfiguration.configurations;
  Ap.ConfigError = ServiceConfiguration.ConfigError;
}); // Thrown when the user cancels the login process (eg, closes an oauth
// popup, declines retina scan, etc)

var lceName = 'Accounts.LoginCancelledError';
Ap.LoginCancelledError = Meteor.makeErrorType(lceName, function (description) {
  this.message = description;
});
Ap.LoginCancelledError.prototype.name = lceName; // This is used to transmit specific subclass errors over the wire. We should
// come up with a more generic way to do this (eg, with some sort of symbolic
// error code rather than a number).

Ap.LoginCancelledError.numericError = 0x8acdc2f;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"localstorage_token.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/localstorage_token.js                                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var AccountsClient;
module.watch(require("./accounts_client.js"), {
  AccountsClient: function (v) {
    AccountsClient = v;
  }
}, 0);
var Ap = AccountsClient.prototype; // This file deals with storing a login token and user id in the
// browser's localStorage facility. It polls local storage every few
// seconds to synchronize login state between multiple tabs in the same
// browser.
// Login with a Meteor access token. This is the only public function
// here.

Meteor.loginWithToken = function (token, callback) {
  return Accounts.loginWithToken(token, callback);
};

Ap.loginWithToken = function (token, callback) {
  this.callLoginMethod({
    methodArguments: [{
      resume: token
    }],
    userCallback: callback
  });
}; // Semi-internal API. Call this function to re-enable auto login after
// if it was disabled at startup.


Ap._enableAutoLogin = function () {
  this._autoLoginEnabled = true;

  this._pollStoredLoginToken();
}; ///
/// STORING
///
// Call this from the top level of the test file for any test that does
// logging in and out, to protect multiple tabs running the same tests
// simultaneously from interfering with each others' localStorage.


Ap._isolateLoginTokenForTest = function () {
  this.LOGIN_TOKEN_KEY = this.LOGIN_TOKEN_KEY + Random.id();
  this.USER_ID_KEY = this.USER_ID_KEY + Random.id();
};

Ap._storeLoginToken = function (userId, token, tokenExpires) {
  Meteor._localStorage.setItem(this.USER_ID_KEY, userId);

  Meteor._localStorage.setItem(this.LOGIN_TOKEN_KEY, token);

  if (!tokenExpires) tokenExpires = this._tokenExpiration(new Date());

  Meteor._localStorage.setItem(this.LOGIN_TOKEN_EXPIRES_KEY, tokenExpires); // to ensure that the localstorage poller doesn't end up trying to
  // connect a second time


  this._lastLoginTokenWhenPolled = token;
};

Ap._unstoreLoginToken = function () {
  Meteor._localStorage.removeItem(this.USER_ID_KEY);

  Meteor._localStorage.removeItem(this.LOGIN_TOKEN_KEY);

  Meteor._localStorage.removeItem(this.LOGIN_TOKEN_EXPIRES_KEY); // to ensure that the localstorage poller doesn't end up trying to
  // connect a second time


  this._lastLoginTokenWhenPolled = null;
}; // This is private, but it is exported for now because it is used by a
// test in accounts-password.
//


Ap._storedLoginToken = function () {
  return Meteor._localStorage.getItem(this.LOGIN_TOKEN_KEY);
};

Ap._storedLoginTokenExpires = function () {
  return Meteor._localStorage.getItem(this.LOGIN_TOKEN_EXPIRES_KEY);
};

Ap._storedUserId = function () {
  return Meteor._localStorage.getItem(this.USER_ID_KEY);
};

Ap._unstoreLoginTokenIfExpiresSoon = function () {
  var tokenExpires = this._storedLoginTokenExpires();

  if (tokenExpires && this._tokenExpiresSoon(new Date(tokenExpires))) {
    this._unstoreLoginToken();
  }
}; ///
/// AUTO-LOGIN
///


Ap._initLocalStorage = function () {
  var self = this; // Key names to use in localStorage

  self.LOGIN_TOKEN_KEY = "Meteor.loginToken";
  self.LOGIN_TOKEN_EXPIRES_KEY = "Meteor.loginTokenExpires";
  self.USER_ID_KEY = "Meteor.userId";
  var rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;

  if (rootUrlPathPrefix || this.connection !== Meteor.connection) {
    // We want to keep using the same keys for existing apps that do not
    // set a custom ROOT_URL_PATH_PREFIX, so that most users will not have
    // to log in again after an app updates to a version of Meteor that
    // contains this code, but it's generally preferable to namespace the
    // keys so that connections from distinct apps to distinct DDP URLs
    // will be distinct in Meteor._localStorage.
    var namespace = ":" + this.connection._stream.rawUrl;

    if (rootUrlPathPrefix) {
      namespace += ":" + rootUrlPathPrefix;
    }

    self.LOGIN_TOKEN_KEY += namespace;
    self.LOGIN_TOKEN_EXPIRES_KEY += namespace;
    self.USER_ID_KEY += namespace;
  }

  if (self._autoLoginEnabled) {
    // Immediately try to log in via local storage, so that any DDP
    // messages are sent after we have established our user account
    self._unstoreLoginTokenIfExpiresSoon();

    var token = self._storedLoginToken();

    if (token) {
      // On startup, optimistically present us as logged in while the
      // request is in flight. This reduces page flicker on startup.
      var userId = self._storedUserId();

      userId && self.connection.setUserId(userId);
      self.loginWithToken(token, function (err) {
        if (err) {
          Meteor._debug("Error logging in with token: " + err);

          self.makeClientLoggedOut();
        }

        self._pageLoadLogin({
          type: "resume",
          allowed: !err,
          error: err,
          methodName: "login",
          // XXX This is duplicate code with loginWithToken, but
          // loginWithToken can also be called at other times besides
          // page load.
          methodArguments: [{
            resume: token
          }]
        });
      });
    }
  } // Poll local storage every 3 seconds to login if someone logged in in
  // another tab


  self._lastLoginTokenWhenPolled = token;

  if (self._pollIntervalTimer) {
    // Unlikely that _initLocalStorage will be called more than once for
    // the same AccountsClient instance, but just in case...
    clearInterval(self._pollIntervalTimer);
  }

  self._pollIntervalTimer = setInterval(function () {
    self._pollStoredLoginToken();
  }, 3000);
};

Ap._pollStoredLoginToken = function () {
  var self = this;

  if (!self._autoLoginEnabled) {
    return;
  }

  var currentLoginToken = self._storedLoginToken(); // != instead of !== just to make sure undefined and null are treated the same


  if (self._lastLoginTokenWhenPolled != currentLoginToken) {
    if (currentLoginToken) {
      self.loginWithToken(currentLoginToken, function (err) {
        if (err) {
          self.makeClientLoggedOut();
        }
      });
    } else {
      self.logout();
    }
  }

  self._lastLoginTokenWhenPolled = currentLoginToken;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"url_client.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/url_client.js                                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  AccountsTest: function () {
    return AccountsTest;
  }
});
var AccountsClient;
module.watch(require("./accounts_client.js"), {
  AccountsClient: function (v) {
    AccountsClient = v;
  }
}, 0);
var Ap = AccountsClient.prototype; // All of the special hash URLs we support for accounts interactions

var accountsPaths = ["reset-password", "verify-email", "enroll-account"];
var savedHash = window.location.hash;

Ap._initUrlMatching = function () {
  // By default, allow the autologin process to happen.
  this._autoLoginEnabled = true; // We only support one callback per URL.

  this._accountsCallbacks = {}; // Try to match the saved value of window.location.hash.

  this._attemptToMatchHash();
}; // Separate out this functionality for testing


Ap._attemptToMatchHash = function () {
  attemptToMatchHash(this, savedHash, defaultSuccessHandler);
}; // Note that both arguments are optional and are currently only passed by
// accounts_url_tests.js.


function attemptToMatchHash(accounts, hash, success) {
  _.each(accountsPaths, function (urlPart) {
    var token;
    var tokenRegex = new RegExp("^\\#\\/" + urlPart + "\\/(.*)$");
    var match = hash.match(tokenRegex);

    if (match) {
      token = match[1]; // XXX COMPAT WITH 0.9.3

      if (urlPart === "reset-password") {
        accounts._resetPasswordToken = token;
      } else if (urlPart === "verify-email") {
        accounts._verifyEmailToken = token;
      } else if (urlPart === "enroll-account") {
        accounts._enrollAccountToken = token;
      }
    } else {
      return;
    } // If no handlers match the hash, then maybe it's meant to be consumed
    // by some entirely different code, so we only clear it the first time
    // a handler successfully matches. Note that later handlers reuse the
    // savedHash, so clearing window.location.hash here will not interfere
    // with their needs.


    window.location.hash = ""; // Do some stuff with the token we matched

    success.call(accounts, token, urlPart);
  });
}

function defaultSuccessHandler(token, urlPart) {
  var self = this; // put login in a suspended state to wait for the interaction to finish

  self._autoLoginEnabled = false; // wait for other packages to register callbacks

  Meteor.startup(function () {
    // if a callback has been registered for this kind of token, call it
    if (self._accountsCallbacks[urlPart]) {
      self._accountsCallbacks[urlPart](token, function () {
        self._enableAutoLogin();
      });
    }
  });
} // Export for testing


var AccountsTest = {
  attemptToMatchHash: function (hash, success) {
    return attemptToMatchHash(Accounts, hash, success);
  }
};

// XXX these should be moved to accounts-password eventually. Right now
// this is prevented by the need to set autoLoginEnabled=false, but in
// some bright future we won't need to do that anymore.

/**
 * @summary Register a function to call when a reset password link is clicked
 * in an email sent by
 * [`Accounts.sendResetPasswordEmail`](#accounts_sendresetpasswordemail).
 * This function should be called in top-level code, not inside
 * `Meteor.startup()`.
 * @memberof! Accounts
 * @name onResetPasswordLink
 * @param  {Function} callback The function to call. It is given two arguments:
 *
 * 1. `token`: A password reset token that can be passed to
 * [`Accounts.resetPassword`](#accounts_resetpassword).
 * 2. `done`: A function to call when the password reset UI flow is complete. The normal
 * login process is suspended until this function is called, so that the
 * password for user A can be reset even if user B was logged in.
 * @locus Client
 */
Ap.onResetPasswordLink = function (callback) {
  if (this._accountsCallbacks["reset-password"]) {
    Meteor._debug("Accounts.onResetPasswordLink was called more than once. " + "Only one callback added will be executed.");
  }

  this._accountsCallbacks["reset-password"] = callback;
};
/**
 * @summary Register a function to call when an email verification link is
 * clicked in an email sent by
 * [`Accounts.sendVerificationEmail`](#accounts_sendverificationemail).
 * This function should be called in top-level code, not inside
 * `Meteor.startup()`.
 * @memberof! Accounts
 * @name onEmailVerificationLink
 * @param  {Function} callback The function to call. It is given two arguments:
 *
 * 1. `token`: An email verification token that can be passed to
 * [`Accounts.verifyEmail`](#accounts_verifyemail).
 * 2. `done`: A function to call when the email verification UI flow is complete.
 * The normal login process is suspended until this function is called, so
 * that the user can be notified that they are verifying their email before
 * being logged in.
 * @locus Client
 */


Ap.onEmailVerificationLink = function (callback) {
  if (this._accountsCallbacks["verify-email"]) {
    Meteor._debug("Accounts.onEmailVerificationLink was called more than once. " + "Only one callback added will be executed.");
  }

  this._accountsCallbacks["verify-email"] = callback;
};
/**
 * @summary Register a function to call when an account enrollment link is
 * clicked in an email sent by
 * [`Accounts.sendEnrollmentEmail`](#accounts_sendenrollmentemail).
 * This function should be called in top-level code, not inside
 * `Meteor.startup()`.
 * @memberof! Accounts
 * @name onEnrollmentLink
 * @param  {Function} callback The function to call. It is given two arguments:
 *
 * 1. `token`: A password reset token that can be passed to
 * [`Accounts.resetPassword`](#accounts_resetpassword) to give the newly
 * enrolled account a password.
 * 2. `done`: A function to call when the enrollment UI flow is complete.
 * The normal login process is suspended until this function is called, so that
 * user A can be enrolled even if user B was logged in.
 * @locus Client
 */


Ap.onEnrollmentLink = function (callback) {
  if (this._accountsCallbacks["enroll-account"]) {
    Meteor._debug("Accounts.onEnrollmentLink was called more than once. " + "Only one callback added will be executed.");
  }

  this._accountsCallbacks["enroll-account"] = callback;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/accounts-base/client_main.js");

/* Exports */
Package._define("accounts-base", exports, {
  Accounts: Accounts
});

})();

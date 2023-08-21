(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var Hook = Package['callback-hook'].Hook;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Accounts, options, EXPIRE_TOKENS_INTERVAL_MS, CONNECTION_CLOSE_DELAY_MS;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-base":{"server_main.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-base/server_main.js                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const module1 = module;
module1.export({
  AccountsServer: () => AccountsServer
});
let AccountsServer;
module1.watch(require("./accounts_server.js"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);
module1.watch(require("./accounts_rate_limit.js"));
module1.watch(require("./url_server.js"));

/**
 * @namespace Accounts
 * @summary The namespace for all server-side accounts-related methods.
 */
Accounts = new AccountsServer(Meteor.server); // Users table. Don't use the normal autopublish, since we want to hide
// some fields. Code to autopublish this is in accounts_server.js.
// XXX Allow users to configure this collection name.

/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 * @importFromPackage meteor
*/

Meteor.users = Accounts.users;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_common.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-base/accounts_common.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AccountsCommon: () => AccountsCommon
});

class AccountsCommon {
  constructor(options) {
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


  userId() {
    throw new Error("userId method not implemented");
  }
  /**
   * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */


  user() {
    var userId = this.userId();
    return userId ? this.users.findOne(userId) : null;
  } // Set up config for the accounts system. Call this on both the client
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


  config(options) {
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


  onLogin(func) {
    return this._onLoginHook.register(func);
  }
  /**
   * @summary Register a callback to be called after a login attempt fails.
   * @locus Anywhere
   * @param {Function} func The callback to be called after the login has failed.
   */


  onLoginFailure(func) {
    return this._onLoginFailureHook.register(func);
  }
  /**
   * @summary Register a callback to be called after a logout attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when logout is successful.
   */


  onLogout(func) {
    return this._onLogoutHook.register(func);
  }

  _initConnection(options) {
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

  _getTokenLifetimeMs() {
    // When loginExpirationInDays is set to null, we'll use a really high
    // number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an
    // unexpiring token.
    const loginExpirationInDays = this._options.loginExpirationInDays === null ? LOGIN_UNEXPIRING_TOKEN_DAYS : this._options.loginExpirationInDays;
    return (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  _getPasswordResetTokenLifetimeMs() {
    return (this._options.passwordResetTokenExpirationInDays || DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  _getPasswordEnrollTokenLifetimeMs() {
    return (this._options.passwordEnrollTokenExpirationInDays || DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  _tokenExpiration(when) {
    // We pass when through the Date constructor for backwards compatibility;
    // `when` used to be a number.
    return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
  }

  _tokenExpiresSoon(when) {
    var minLifetimeMs = .1 * this._getTokenLifetimeMs();

    var minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;
    if (minLifetimeMs > minLifetimeCapMs) minLifetimeMs = minLifetimeCapMs;
    return new Date() > new Date(when) - minLifetimeMs;
  }

}

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


const DEFAULT_LOGIN_EXPIRATION_DAYS = 90; // Expose for testing.

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

const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100; // Expose for testing.

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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_rate_limit.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-base/accounts_rate_limit.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let AccountsCommon;
module.watch(require("./accounts_common.js"), {
  AccountsCommon(v) {
    AccountsCommon = v;
  }

}, 0);
var Ap = AccountsCommon.prototype;
var defaultRateLimiterRuleId; // Removes default rate limiting rule

Ap.removeDefaultRateLimit = function () {
  const resp = DDPRateLimiter.removeRule(defaultRateLimiterRuleId);
  defaultRateLimiterRuleId = null;
  return resp;
}; // Add a default rule of limiting logins, creating new users and password reset
// to 5 times every 10 seconds per connection.


Ap.addDefaultRateLimit = function () {
  if (!defaultRateLimiterRuleId) {
    defaultRateLimiterRuleId = DDPRateLimiter.addRule({
      userId: null,
      clientAddress: null,
      type: 'method',
      name: function (name) {
        return _.contains(['login', 'createUser', 'resetPassword', 'forgotPassword'], name);
      },
      connectionId: function (connectionId) {
        return true;
      }
    }, 5, 10000);
  }
};

Ap.addDefaultRateLimit();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-base/accounts_server.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  AccountsServer: () => AccountsServer
});
let AccountsCommon;
module.watch(require("./accounts_common.js"), {
  AccountsCommon(v) {
    AccountsCommon = v;
  }

}, 0);

var crypto = Npm.require('crypto');

class AccountsServer extends AccountsCommon {
  // Note that this constructor is less likely to be instantiated multiple
  // times than the `AccountsClient` constructor, because a single server
  // can provide only one set of methods.
  constructor(server) {
    super();
    this._server = server || Meteor.server; // Set up the server's methods, as if by calling Meteor.methods.

    this._initServerMethods();

    this._initAccountDataHooks(); // If autopublish is on, publish these user fields. Login service
    // packages (eg accounts-google) add to these by calling
    // addAutopublishFields.  Notably, this isn't implemented with multiple
    // publishes since DDP only merges only across top-level fields, not
    // subfields (such as 'services.facebook.accessToken')


    this._autopublishFields = {
      loggedInUser: ['profile', 'username', 'emails'],
      otherUsers: ['profile', 'username']
    };

    this._initServerPublications(); // connectionId -> {connection, loginToken}


    this._accountData = {}; // connection id -> observe handle for the login token that this connection is
    // currently associated with, or a number. The number indicates that we are in
    // the process of setting up the observe (using a number instead of a single
    // sentinel allows multiple attempts to set up the observe to identify which
    // one was theirs).

    this._userObservesForConnections = {};
    this._nextUserObserveNumber = 1; // for the number described above.
    // list of all registered handlers.

    this._loginHandlers = [];
    setupUsersCollection(this.users);
    setupDefaultLoginHandlers(this);
    setExpireTokensInterval(this);
    this._validateLoginHook = new Hook({
      bindEnvironment: false
    });
    this._validateNewUserHooks = [defaultValidateNewUserHook.bind(this)];

    this._deleteSavedTokensForAllUsersOnStartup();

    this._skipCaseInsensitiveChecksForTest = {};
  } ///
  /// CURRENT USER
  ///
  // @override of "abstract" non-implementation in accounts_common.js


  userId() {
    // This function only works if called inside a method or a pubication.
    // Using any of the infomation from Meteor.user() in a method or
    // publish function will always use the value from when the function first
    // runs. This is likely not what the user expects. The way to make this work
    // in a method or publish function is to do Meteor.find(this.userId).observe
    // and recompute when the user record changes.
    const currentInvocation = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get();

    if (!currentInvocation) throw new Error("Meteor.userId can only be invoked in method calls or publications.");
    return currentInvocation.userId;
  } ///
  /// LOGIN HOOKS
  ///

  /**
   * @summary Validate login attempts.
   * @locus Server
   * @param {Function} func Called whenever a login is attempted (either successful or unsuccessful).  A login can be aborted by returning a falsy value or throwing an exception.
   */


  validateLoginAttempt(func) {
    // Exceptions inside the hook callback are passed up to us.
    return this._validateLoginHook.register(func);
  }
  /**
   * @summary Set restrictions on new user creation.
   * @locus Server
   * @param {Function} func Called whenever a new user is created. Takes the new user object, and returns true to allow the creation or false to abort.
   */


  validateNewUser(func) {
    this._validateNewUserHooks.push(func);
  } ///
  /// CREATE USER HOOKS
  ///

  /**
   * @summary Customize new user creation.
   * @locus Server
   * @param {Function} func Called whenever a new user is created. Return the new user object, or throw an `Error` to abort the creation.
   */


  onCreateUser(func) {
    if (this._onCreateUserHook) {
      throw new Error("Can only call onCreateUser once");
    }

    this._onCreateUserHook = func;
  }
  /**
   * @summary Customize oauth user profile updates
   * @locus Server
   * @param {Function} func Called whenever a user is logged in via oauth. Return the profile object to be merged, or throw an `Error` to abort the creation.
   */


  onExternalLogin(func) {
    if (this._onExternalLoginHook) {
      throw new Error("Can only call onExternalLogin once");
    }

    this._onExternalLoginHook = func;
  }

}

;
var Ap = AccountsServer.prototype; // Give each login hook callback a fresh cloned copy of the attempt
// object, but don't clone the connection.
//

function cloneAttemptWithConnection(connection, attempt) {
  var clonedAttempt = EJSON.clone(attempt);
  clonedAttempt.connection = connection;
  return clonedAttempt;
}

Ap._validateLogin = function (connection, attempt) {
  this._validateLoginHook.each(function (callback) {
    var ret;

    try {
      ret = callback(cloneAttemptWithConnection(connection, attempt));
    } catch (e) {
      attempt.allowed = false; // XXX this means the last thrown error overrides previous error
      // messages. Maybe this is surprising to users and we should make
      // overriding errors more explicit. (see
      // https://github.com/meteor/meteor/issues/1960)

      attempt.error = e;
      return true;
    }

    if (!ret) {
      attempt.allowed = false; // don't override a specific error provided by a previous
      // validator or the initial attempt (eg "incorrect password").

      if (!attempt.error) attempt.error = new Meteor.Error(403, "Login forbidden");
    }

    return true;
  });
};

Ap._successfulLogin = function (connection, attempt) {
  this._onLoginHook.each(function (callback) {
    callback(cloneAttemptWithConnection(connection, attempt));
    return true;
  });
};

Ap._failedLogin = function (connection, attempt) {
  this._onLoginFailureHook.each(function (callback) {
    callback(cloneAttemptWithConnection(connection, attempt));
    return true;
  });
};

Ap._successfulLogout = function (connection, userId) {
  const user = userId && this.users.findOne(userId);

  this._onLogoutHook.each(function (callback) {
    callback({
      user,
      connection
    });
    return true;
  });
}; ///
/// LOGIN METHODS
///
// Login methods return to the client an object containing these
// fields when the user was logged in successfully:
//
//   id: userId
//   token: *
//   tokenExpires: *
//
// tokenExpires is optional and intends to provide a hint to the
// client as to when the token will expire. If not provided, the
// client will call Accounts._tokenExpiration, passing it the date
// that it received the token.
//
// The login method will throw an error back to the client if the user
// failed to log in.
//
//
// Login handlers and service specific login methods such as
// `createUser` internally return a `result` object containing these
// fields:
//
//   type:
//     optional string; the service name, overrides the handler
//     default if present.
//
//   error:
//     exception; if the user is not allowed to login, the reason why.
//
//   userId:
//     string; the user id of the user attempting to login (if
//     known), required for an allowed login.
//
//   options:
//     optional object merged into the result returned by the login
//     method; used by HAMK from SRP.
//
//   stampedLoginToken:
//     optional object with `token` and `when` indicating the login
//     token is already present in the database, returned by the
//     "resume" login handler.
//
// For convenience, login methods can also throw an exception, which
// is converted into an {error} result.  However, if the id of the
// user attempting the login is known, a {userId, error} result should
// be returned instead since the user id is not captured when an
// exception is thrown.
//
// This internal `result` object is automatically converted into the
// public {id, token, tokenExpires} object returned to the client.
// Try a login method, converting thrown exceptions into an {error}
// result.  The `type` argument is a default, inserted into the result
// object if not explicitly returned.
//


var tryLoginMethod = function (type, fn) {
  var result;

  try {
    result = fn();
  } catch (e) {
    result = {
      error: e
    };
  }

  if (result && !result.type && type) result.type = type;
  return result;
}; // Log in a user on a connection.
//
// We use the method invocation to set the user id on the connection,
// not the connection object directly. setUserId is tied to methods to
// enforce clear ordering of method application (using wait methods on
// the client, and a no setUserId after unblock restriction on the
// server)
//
// The `stampedLoginToken` parameter is optional.  When present, it
// indicates that the login token has already been inserted into the
// database and doesn't need to be inserted again.  (It's used by the
// "resume" login handler).


Ap._loginUser = function (methodInvocation, userId, stampedLoginToken) {
  var self = this;

  if (!stampedLoginToken) {
    stampedLoginToken = self._generateStampedLoginToken();

    self._insertLoginToken(userId, stampedLoginToken);
  } // This order (and the avoidance of yields) is important to make
  // sure that when publish functions are rerun, they see a
  // consistent view of the world: the userId is set and matches
  // the login token on the connection (not that there is
  // currently a public API for reading the login token on a
  // connection).


  Meteor._noYieldsAllowed(function () {
    self._setLoginToken(userId, methodInvocation.connection, self._hashLoginToken(stampedLoginToken.token));
  });

  methodInvocation.setUserId(userId);
  return {
    id: userId,
    token: stampedLoginToken.token,
    tokenExpires: self._tokenExpiration(stampedLoginToken.when)
  };
}; // After a login method has completed, call the login hooks.  Note
// that `attemptLogin` is called for *all* login attempts, even ones
// which aren't successful (such as an invalid password, etc).
//
// If the login is allowed and isn't aborted by a validate login hook
// callback, log in the user.
//


Ap._attemptLogin = function (methodInvocation, methodName, methodArgs, result) {
  if (!result) throw new Error("result is required"); // XXX A programming error in a login handler can lead to this occuring, and
  // then we don't call onLogin or onLoginFailure callbacks. Should
  // tryLoginMethod catch this case and turn it into an error?

  if (!result.userId && !result.error) throw new Error("A login method must specify a userId or an error");
  var user;
  if (result.userId) user = this.users.findOne(result.userId);
  var attempt = {
    type: result.type || "unknown",
    allowed: !!(result.userId && !result.error),
    methodName: methodName,
    methodArguments: _.toArray(methodArgs)
  };
  if (result.error) attempt.error = result.error;
  if (user) attempt.user = user; // _validateLogin may mutate `attempt` by adding an error and changing allowed
  // to false, but that's the only change it can make (and the user's callbacks
  // only get a clone of `attempt`).

  this._validateLogin(methodInvocation.connection, attempt);

  if (attempt.allowed) {
    var ret = _.extend(this._loginUser(methodInvocation, result.userId, result.stampedLoginToken), result.options || {});

    ret.type = attempt.type;

    this._successfulLogin(methodInvocation.connection, attempt);

    return ret;
  } else {
    this._failedLogin(methodInvocation.connection, attempt);

    throw attempt.error;
  }
}; // All service specific login methods should go through this function.
// Ensure that thrown exceptions are caught and that login hook
// callbacks are still called.
//


Ap._loginMethod = function (methodInvocation, methodName, methodArgs, type, fn) {
  return this._attemptLogin(methodInvocation, methodName, methodArgs, tryLoginMethod(type, fn));
}; // Report a login attempt failed outside the context of a normal login
// method. This is for use in the case where there is a multi-step login
// procedure (eg SRP based password login). If a method early in the
// chain fails, it should call this function to report a failure. There
// is no corresponding method for a successful login; methods that can
// succeed at logging a user in should always be actual login methods
// (using either Accounts._loginMethod or Accounts.registerLoginHandler).


Ap._reportLoginFailure = function (methodInvocation, methodName, methodArgs, result) {
  var attempt = {
    type: result.type || "unknown",
    allowed: false,
    error: result.error,
    methodName: methodName,
    methodArguments: _.toArray(methodArgs)
  };

  if (result.userId) {
    attempt.user = this.users.findOne(result.userId);
  }

  this._validateLogin(methodInvocation.connection, attempt);

  this._failedLogin(methodInvocation.connection, attempt); // _validateLogin may mutate attempt to set a new error message. Return
  // the modified version.


  return attempt;
}; ///
/// LOGIN HANDLERS
///
// The main entry point for auth packages to hook in to login.
//
// A login handler is a login method which can return `undefined` to
// indicate that the login request is not handled by this handler.
//
// @param name {String} Optional.  The service name, used by default
// if a specific service name isn't returned in the result.
//
// @param handler {Function} A function that receives an options object
// (as passed as an argument to the `login` method) and returns one of:
// - `undefined`, meaning don't handle;
// - a login method result object


Ap.registerLoginHandler = function (name, handler) {
  if (!handler) {
    handler = name;
    name = null;
  }

  this._loginHandlers.push({
    name: name,
    handler: handler
  });
}; // Checks a user's credentials against all the registered login
// handlers, and returns a login token if the credentials are valid. It
// is like the login method, except that it doesn't set the logged-in
// user on the connection. Throws a Meteor.Error if logging in fails,
// including the case where none of the login handlers handled the login
// request. Otherwise, returns {id: userId, token: *, tokenExpires: *}.
//
// For example, if you want to login with a plaintext password, `options` could be
//   { user: { username: <username> }, password: <password> }, or
//   { user: { email: <email> }, password: <password> }.
// Try all of the registered login handlers until one of them doesn't
// return `undefined`, meaning it handled this call to `login`. Return
// that return value.


Ap._runLoginHandlers = function (methodInvocation, options) {
  for (var i = 0; i < this._loginHandlers.length; ++i) {
    var handler = this._loginHandlers[i];
    var result = tryLoginMethod(handler.name, function () {
      return handler.handler.call(methodInvocation, options);
    });

    if (result) {
      return result;
    }

    if (result !== undefined) {
      throw new Meteor.Error(400, "A login handler should return a result or undefined");
    }
  }

  return {
    type: null,
    error: new Meteor.Error(400, "Unrecognized options for login request")
  };
}; // Deletes the given loginToken from the database.
//
// For new-style hashed token, this will cause all connections
// associated with the token to be closed.
//
// Any connections associated with old-style unhashed tokens will be
// in the process of becoming associated with hashed tokens and then
// they'll get closed.


Ap.destroyToken = function (userId, loginToken) {
  this.users.update(userId, {
    $pull: {
      "services.resume.loginTokens": {
        $or: [{
          hashedToken: loginToken
        }, {
          token: loginToken
        }]
      }
    }
  });
};

Ap._initServerMethods = function () {
  // The methods created in this function need to be created here so that
  // this variable is available in their scope.
  var accounts = this; // This object will be populated with methods and then passed to
  // accounts._server.methods further below.

  var methods = {}; // @returns {Object|null}
  //   If successful, returns {token: reconnectToken, id: userId}
  //   If unsuccessful (for example, if the user closed the oauth login popup),
  //     throws an error describing the reason

  methods.login = function (options) {
    var self = this; // Login handlers should really also check whatever field they look at in
    // options, but we don't enforce it.

    check(options, Object);

    var result = accounts._runLoginHandlers(self, options);

    return accounts._attemptLogin(self, "login", arguments, result);
  };

  methods.logout = function () {
    var token = accounts._getLoginToken(this.connection.id);

    accounts._setLoginToken(this.userId, this.connection, null);

    if (token && this.userId) accounts.destroyToken(this.userId, token);

    accounts._successfulLogout(this.connection, this.userId);

    this.setUserId(null);
  }; // Delete all the current user's tokens and close all open connections logged
  // in as this user. Returns a fresh new login token that this client can
  // use. Tests set Accounts._noConnectionCloseDelayForTest to delete tokens
  // immediately instead of using a delay.
  //
  // XXX COMPAT WITH 0.7.2
  // This single `logoutOtherClients` method has been replaced with two
  // methods, one that you call to get a new token, and another that you
  // call to remove all tokens except your own. The new design allows
  // clients to know when other clients have actually been logged
  // out. (The `logoutOtherClients` method guarantees the caller that
  // the other clients will be logged out at some point, but makes no
  // guarantees about when.) This method is left in for backwards
  // compatibility, especially since application code might be calling
  // this method directly.
  //
  // @returns {Object} Object with token and tokenExpires keys.


  methods.logoutOtherClients = function () {
    var self = this;
    var user = accounts.users.findOne(self.userId, {
      fields: {
        "services.resume.loginTokens": true
      }
    });

    if (user) {
      // Save the current tokens in the database to be deleted in
      // CONNECTION_CLOSE_DELAY_MS ms. This gives other connections in the
      // caller's browser time to find the fresh token in localStorage. We save
      // the tokens in the database in case we crash before actually deleting
      // them.
      var tokens = user.services.resume.loginTokens;

      var newToken = accounts._generateStampedLoginToken();

      var userId = self.userId;
      accounts.users.update(userId, {
        $set: {
          "services.resume.loginTokensToDelete": tokens,
          "services.resume.haveLoginTokensToDelete": true
        },
        $push: {
          "services.resume.loginTokens": accounts._hashStampedToken(newToken)
        }
      });
      Meteor.setTimeout(function () {
        // The observe on Meteor.users will take care of closing the connections
        // associated with `tokens`.
        accounts._deleteSavedTokensForUser(userId, tokens);
      }, accounts._noConnectionCloseDelayForTest ? 0 : CONNECTION_CLOSE_DELAY_MS); // We do not set the login token on this connection, but instead the
      // observe closes the connection and the client will reconnect with the
      // new token.

      return {
        token: newToken.token,
        tokenExpires: accounts._tokenExpiration(newToken.when)
      };
    } else {
      throw new Meteor.Error("You are not logged in.");
    }
  }; // Generates a new login token with the same expiration as the
  // connection's current token and saves it to the database. Associates
  // the connection with this new token and returns it. Throws an error
  // if called on a connection that isn't logged in.
  //
  // @returns Object
  //   If successful, returns { token: <new token>, id: <user id>,
  //   tokenExpires: <expiration date> }.


  methods.getNewToken = function () {
    var self = this;
    var user = accounts.users.findOne(self.userId, {
      fields: {
        "services.resume.loginTokens": 1
      }
    });

    if (!self.userId || !user) {
      throw new Meteor.Error("You are not logged in.");
    } // Be careful not to generate a new token that has a later
    // expiration than the curren token. Otherwise, a bad guy with a
    // stolen token could use this method to stop his stolen token from
    // ever expiring.


    var currentHashedToken = accounts._getLoginToken(self.connection.id);

    var currentStampedToken = _.find(user.services.resume.loginTokens, function (stampedToken) {
      return stampedToken.hashedToken === currentHashedToken;
    });

    if (!currentStampedToken) {
      // safety belt: this should never happen
      throw new Meteor.Error("Invalid login token");
    }

    var newStampedToken = accounts._generateStampedLoginToken();

    newStampedToken.when = currentStampedToken.when;

    accounts._insertLoginToken(self.userId, newStampedToken);

    return accounts._loginUser(self, self.userId, newStampedToken);
  }; // Removes all tokens except the token associated with the current
  // connection. Throws an error if the connection is not logged
  // in. Returns nothing on success.


  methods.removeOtherTokens = function () {
    var self = this;

    if (!self.userId) {
      throw new Meteor.Error("You are not logged in.");
    }

    var currentToken = accounts._getLoginToken(self.connection.id);

    accounts.users.update(self.userId, {
      $pull: {
        "services.resume.loginTokens": {
          hashedToken: {
            $ne: currentToken
          }
        }
      }
    });
  }; // Allow a one-time configuration for a login service. Modifications
  // to this collection are also allowed in insecure mode.


  methods.configureLoginService = function (options) {
    check(options, Match.ObjectIncluding({
      service: String
    })); // Don't let random users configure a service we haven't added yet (so
    // that when we do later add it, it's set up with their configuration
    // instead of ours).
    // XXX if service configuration is oauth-specific then this code should
    //     be in accounts-oauth; if it's not then the registry should be
    //     in this package

    if (!(accounts.oauth && _.contains(accounts.oauth.serviceNames(), options.service))) {
      throw new Meteor.Error(403, "Service unknown");
    }

    var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
    if (ServiceConfiguration.configurations.findOne({
      service: options.service
    })) throw new Meteor.Error(403, "Service " + options.service + " already configured");
    if (_.has(options, "secret") && usingOAuthEncryption()) options.secret = OAuthEncryption.seal(options.secret);
    ServiceConfiguration.configurations.insert(options);
  };

  accounts._server.methods(methods);
};

Ap._initAccountDataHooks = function () {
  var accounts = this;

  accounts._server.onConnection(function (connection) {
    accounts._accountData[connection.id] = {
      connection: connection
    };
    connection.onClose(function () {
      accounts._removeTokenFromConnection(connection.id);

      delete accounts._accountData[connection.id];
    });
  });
};

Ap._initServerPublications = function () {
  var accounts = this; // Publish all login service configuration fields other than secret.

  accounts._server.publish("meteor.loginServiceConfiguration", function () {
    var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
    return ServiceConfiguration.configurations.find({}, {
      fields: {
        secret: 0
      }
    });
  }, {
    is_auto: true
  }); // not techincally autopublish, but stops the warning.
  // Publish the current user's record to the client.


  accounts._server.publish(null, function () {
    if (this.userId) {
      return accounts.users.find({
        _id: this.userId
      }, {
        fields: {
          profile: 1,
          username: 1,
          emails: 1
        }
      });
    } else {
      return null;
    }
  },
  /*suppress autopublish warning*/
  {
    is_auto: true
  }); // Use Meteor.startup to give other packages a chance to call
  // addAutopublishFields.


  Package.autopublish && Meteor.startup(function () {
    // ['profile', 'username'] -> {profile: 1, username: 1}
    var toFieldSelector = function (fields) {
      return _.object(_.map(fields, function (field) {
        return [field, 1];
      }));
    };

    accounts._server.publish(null, function () {
      if (this.userId) {
        return accounts.users.find({
          _id: this.userId
        }, {
          fields: toFieldSelector(accounts._autopublishFields.loggedInUser)
        });
      } else {
        return null;
      }
    },
    /*suppress autopublish warning*/
    {
      is_auto: true
    }); // XXX this publish is neither dedup-able nor is it optimized by our special
    // treatment of queries on a specific _id. Therefore this will have O(n^2)
    // run-time performance every time a user document is changed (eg someone
    // logging in). If this is a problem, we can instead write a manual publish
    // function which filters out fields based on 'this.userId'.


    accounts._server.publish(null, function () {
      var selector = this.userId ? {
        _id: {
          $ne: this.userId
        }
      } : {};
      return accounts.users.find(selector, {
        fields: toFieldSelector(accounts._autopublishFields.otherUsers)
      });
    },
    /*suppress autopublish warning*/
    {
      is_auto: true
    });
  });
}; // Add to the list of fields or subfields to be automatically
// published if autopublish is on. Must be called from top-level
// code (ie, before Meteor.startup hooks run).
//
// @param opts {Object} with:
//   - forLoggedInUser {Array} Array of fields published to the logged-in user
//   - forOtherUsers {Array} Array of fields published to users that aren't logged in


Ap.addAutopublishFields = function (opts) {
  this._autopublishFields.loggedInUser.push.apply(this._autopublishFields.loggedInUser, opts.forLoggedInUser);

  this._autopublishFields.otherUsers.push.apply(this._autopublishFields.otherUsers, opts.forOtherUsers);
}; ///
/// ACCOUNT DATA
///
// HACK: This is used by 'meteor-accounts' to get the loginToken for a
// connection. Maybe there should be a public way to do that.


Ap._getAccountData = function (connectionId, field) {
  var data = this._accountData[connectionId];
  return data && data[field];
};

Ap._setAccountData = function (connectionId, field, value) {
  var data = this._accountData[connectionId]; // safety belt. shouldn't happen. accountData is set in onConnection,
  // we don't have a connectionId until it is set.

  if (!data) return;
  if (value === undefined) delete data[field];else data[field] = value;
}; ///
/// RECONNECT TOKENS
///
/// support reconnecting using a meteor login token


Ap._hashLoginToken = function (loginToken) {
  var hash = crypto.createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
}; // {token, when} => {hashedToken, when}


Ap._hashStampedToken = function (stampedToken) {
  return _.extend(_.omit(stampedToken, 'token'), {
    hashedToken: this._hashLoginToken(stampedToken.token)
  });
}; // Using $addToSet avoids getting an index error if another client
// logging in simultaneously has already inserted the new hashed
// token.


Ap._insertHashedLoginToken = function (userId, hashedToken, query) {
  query = query ? _.clone(query) : {};
  query._id = userId;
  this.users.update(query, {
    $addToSet: {
      "services.resume.loginTokens": hashedToken
    }
  });
}; // Exported for tests.


Ap._insertLoginToken = function (userId, stampedToken, query) {
  this._insertHashedLoginToken(userId, this._hashStampedToken(stampedToken), query);
};

Ap._clearAllLoginTokens = function (userId) {
  this.users.update(userId, {
    $set: {
      'services.resume.loginTokens': []
    }
  });
}; // test hook


Ap._getUserObserve = function (connectionId) {
  return this._userObservesForConnections[connectionId];
}; // Clean up this connection's association with the token: that is, stop
// the observe that we started when we associated the connection with
// this token.


Ap._removeTokenFromConnection = function (connectionId) {
  if (_.has(this._userObservesForConnections, connectionId)) {
    var observe = this._userObservesForConnections[connectionId];

    if (typeof observe === 'number') {
      // We're in the process of setting up an observe for this connection. We
      // can't clean up that observe yet, but if we delete the placeholder for
      // this connection, then the observe will get cleaned up as soon as it has
      // been set up.
      delete this._userObservesForConnections[connectionId];
    } else {
      delete this._userObservesForConnections[connectionId];
      observe.stop();
    }
  }
};

Ap._getLoginToken = function (connectionId) {
  return this._getAccountData(connectionId, 'loginToken');
}; // newToken is a hashed token.


Ap._setLoginToken = function (userId, connection, newToken) {
  var self = this;

  self._removeTokenFromConnection(connection.id);

  self._setAccountData(connection.id, 'loginToken', newToken);

  if (newToken) {
    // Set up an observe for this token. If the token goes away, we need
    // to close the connection.  We defer the observe because there's
    // no need for it to be on the critical path for login; we just need
    // to ensure that the connection will get closed at some point if
    // the token gets deleted.
    //
    // Initially, we set the observe for this connection to a number; this
    // signifies to other code (which might run while we yield) that we are in
    // the process of setting up an observe for this connection. Once the
    // observe is ready to go, we replace the number with the real observe
    // handle (unless the placeholder has been deleted or replaced by a
    // different placehold number, signifying that the connection was closed
    // already -- in this case we just clean up the observe that we started).
    var myObserveNumber = ++self._nextUserObserveNumber;
    self._userObservesForConnections[connection.id] = myObserveNumber;
    Meteor.defer(function () {
      // If something else happened on this connection in the meantime (it got
      // closed, or another call to _setLoginToken happened), just do
      // nothing. We don't need to start an observe for an old connection or old
      // token.
      if (self._userObservesForConnections[connection.id] !== myObserveNumber) {
        return;
      }

      var foundMatchingUser; // Because we upgrade unhashed login tokens to hashed tokens at
      // login time, sessions will only be logged in with a hashed
      // token. Thus we only need to observe hashed tokens here.

      var observe = self.users.find({
        _id: userId,
        'services.resume.loginTokens.hashedToken': newToken
      }, {
        fields: {
          _id: 1
        }
      }).observeChanges({
        added: function () {
          foundMatchingUser = true;
        },
        removed: function () {
          connection.close(); // The onClose callback for the connection takes care of
          // cleaning up the observe handle and any other state we have
          // lying around.
        }
      }); // If the user ran another login or logout command we were waiting for the
      // defer or added to fire (ie, another call to _setLoginToken occurred),
      // then we let the later one win (start an observe, etc) and just stop our
      // observe now.
      //
      // Similarly, if the connection was already closed, then the onClose
      // callback would have called _removeTokenFromConnection and there won't
      // be an entry in _userObservesForConnections. We can stop the observe.

      if (self._userObservesForConnections[connection.id] !== myObserveNumber) {
        observe.stop();
        return;
      }

      self._userObservesForConnections[connection.id] = observe;

      if (!foundMatchingUser) {
        // We've set up an observe on the user associated with `newToken`,
        // so if the new token is removed from the database, we'll close
        // the connection. But the token might have already been deleted
        // before we set up the observe, which wouldn't have closed the
        // connection because the observe wasn't running yet.
        connection.close();
      }
    });
  }
};

function setupDefaultLoginHandlers(accounts) {
  accounts.registerLoginHandler("resume", function (options) {
    return defaultResumeLoginHandler.call(this, accounts, options);
  });
} // Login handler for resume tokens.


function defaultResumeLoginHandler(accounts, options) {
  if (!options.resume) return undefined;
  check(options.resume, String);

  var hashedToken = accounts._hashLoginToken(options.resume); // First look for just the new-style hashed login token, to avoid
  // sending the unhashed token to the database in a query if we don't
  // need to.


  var user = accounts.users.findOne({
    "services.resume.loginTokens.hashedToken": hashedToken
  });

  if (!user) {
    // If we didn't find the hashed login token, try also looking for
    // the old-style unhashed token.  But we need to look for either
    // the old-style token OR the new-style token, because another
    // client connection logging in simultaneously might have already
    // converted the token.
    user = accounts.users.findOne({
      $or: [{
        "services.resume.loginTokens.hashedToken": hashedToken
      }, {
        "services.resume.loginTokens.token": options.resume
      }]
    });
  }

  if (!user) return {
    error: new Meteor.Error(403, "You've been logged out by the server. Please log in again.")
  }; // Find the token, which will either be an object with fields
  // {hashedToken, when} for a hashed token or {token, when} for an
  // unhashed token.

  var oldUnhashedStyleToken;

  var token = _.find(user.services.resume.loginTokens, function (token) {
    return token.hashedToken === hashedToken;
  });

  if (token) {
    oldUnhashedStyleToken = false;
  } else {
    token = _.find(user.services.resume.loginTokens, function (token) {
      return token.token === options.resume;
    });
    oldUnhashedStyleToken = true;
  }

  var tokenExpires = accounts._tokenExpiration(token.when);

  if (new Date() >= tokenExpires) return {
    userId: user._id,
    error: new Meteor.Error(403, "Your session has expired. Please log in again.")
  }; // Update to a hashed token when an unhashed token is encountered.

  if (oldUnhashedStyleToken) {
    // Only add the new hashed token if the old unhashed token still
    // exists (this avoids resurrecting the token if it was deleted
    // after we read it).  Using $addToSet avoids getting an index
    // error if another client logging in simultaneously has already
    // inserted the new hashed token.
    accounts.users.update({
      _id: user._id,
      "services.resume.loginTokens.token": options.resume
    }, {
      $addToSet: {
        "services.resume.loginTokens": {
          "hashedToken": hashedToken,
          "when": token.when
        }
      }
    }); // Remove the old token *after* adding the new, since otherwise
    // another client trying to login between our removing the old and
    // adding the new wouldn't find a token to login with.

    accounts.users.update(user._id, {
      $pull: {
        "services.resume.loginTokens": {
          "token": options.resume
        }
      }
    });
  }

  return {
    userId: user._id,
    stampedLoginToken: {
      token: options.resume,
      when: token.when
    }
  };
} // (Also used by Meteor Accounts server and tests).
//


Ap._generateStampedLoginToken = function () {
  return {
    token: Random.secret(),
    when: new Date()
  };
}; ///
/// TOKEN EXPIRATION
///


function expirePasswordToken(accounts, oldestValidDate, tokenFilter, userId) {
  const userFilter = userId ? {
    _id: userId
  } : {};
  const resetRangeOr = {
    $or: [{
      "services.password.reset.when": {
        $lt: oldestValidDate
      }
    }, {
      "services.password.reset.when": {
        $lt: +oldestValidDate
      }
    }]
  };
  const expireFilter = {
    $and: [tokenFilter, resetRangeOr]
  };
  accounts.users.update((0, _objectSpread2.default)({}, userFilter, expireFilter), {
    $unset: {
      "services.password.reset": ""
    }
  }, {
    multi: true
  });
} // Deletes expired tokens from the database and closes all open connections
// associated with these tokens.
//
// Exported for tests. Also, the arguments are only used by
// tests. oldestValidDate is simulate expiring tokens without waiting
// for them to actually expire. userId is used by tests to only expire
// tokens for the test user.


Ap._expireTokens = function (oldestValidDate, userId) {
  var tokenLifetimeMs = this._getTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!


  if (oldestValidDate && !userId || !oldestValidDate && userId) {
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");
  }

  oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
  var userFilter = userId ? {
    _id: userId
  } : {}; // Backwards compatible with older versions of meteor that stored login token
  // timestamps as numbers.

  this.users.update(_.extend(userFilter, {
    $or: [{
      "services.resume.loginTokens.when": {
        $lt: oldestValidDate
      }
    }, {
      "services.resume.loginTokens.when": {
        $lt: +oldestValidDate
      }
    }]
  }), {
    $pull: {
      "services.resume.loginTokens": {
        $or: [{
          when: {
            $lt: oldestValidDate
          }
        }, {
          when: {
            $lt: +oldestValidDate
          }
        }]
      }
    }
  }, {
    multi: true
  }); // The observe on Meteor.users will take care of closing connections for
  // expired tokens.
}; // Deletes expired password reset tokens from the database.
//
// Exported for tests. Also, the arguments are only used by
// tests. oldestValidDate is simulate expiring tokens without waiting
// for them to actually expire. userId is used by tests to only expire
// tokens for the test user.


Ap._expirePasswordResetTokens = function (oldestValidDate, userId) {
  var tokenLifetimeMs = this._getPasswordResetTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!


  if (oldestValidDate && !userId || !oldestValidDate && userId) {
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");
  }

  oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
  var tokenFilter = {
    $or: [{
      "services.password.reset.reason": "reset"
    }, {
      "services.password.reset.reason": {
        $exists: false
      }
    }]
  };
  expirePasswordToken(this, oldestValidDate, tokenFilter, userId);
}; // Deletes expired password enroll tokens from the database.
//
// Exported for tests. Also, the arguments are only used by
// tests. oldestValidDate is simulate expiring tokens without waiting
// for them to actually expire. userId is used by tests to only expire
// tokens for the test user.


Ap._expirePasswordEnrollTokens = function (oldestValidDate, userId) {
  var tokenLifetimeMs = this._getPasswordEnrollTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!


  if (oldestValidDate && !userId || !oldestValidDate && userId) {
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");
  }

  oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
  var tokenFilter = {
    "services.password.reset.reason": "enroll"
  };
  expirePasswordToken(this, oldestValidDate, tokenFilter, userId);
}; // @override from accounts_common.js


Ap.config = function (options) {
  // Call the overridden implementation of the method.
  var superResult = AccountsCommon.prototype.config.apply(this, arguments); // If the user set loginExpirationInDays to null, then we need to clear the
  // timer that periodically expires tokens.

  if (_.has(this._options, "loginExpirationInDays") && this._options.loginExpirationInDays === null && this.expireTokenInterval) {
    Meteor.clearInterval(this.expireTokenInterval);
    this.expireTokenInterval = null;
  }

  return superResult;
};

function setExpireTokensInterval(accounts) {
  accounts.expireTokenInterval = Meteor.setInterval(function () {
    accounts._expireTokens();

    accounts._expirePasswordResetTokens();

    accounts._expirePasswordEnrollTokens();
  }, EXPIRE_TOKENS_INTERVAL_MS);
} ///
/// OAuth Encryption Support
///


var OAuthEncryption = Package["oauth-encryption"] && Package["oauth-encryption"].OAuthEncryption;

function usingOAuthEncryption() {
  return OAuthEncryption && OAuthEncryption.keyIsLoaded();
} // OAuth service data is temporarily stored in the pending credentials
// collection during the oauth authentication process.  Sensitive data
// such as access tokens are encrypted without the user id because
// we don't know the user id yet.  We re-encrypt these fields with the
// user id included when storing the service data permanently in
// the users collection.
//


function pinEncryptedFieldsToUser(serviceData, userId) {
  _.each(_.keys(serviceData), function (key) {
    var value = serviceData[key];
    if (OAuthEncryption && OAuthEncryption.isSealed(value)) value = OAuthEncryption.seal(OAuthEncryption.open(value), userId);
    serviceData[key] = value;
  });
} // Encrypt unencrypted login service secrets when oauth-encryption is
// added.
//
// XXX For the oauthSecretKey to be available here at startup, the
// developer must call Accounts.config({oauthSecretKey: ...}) at load
// time, instead of in a Meteor.startup block, because the startup
// block in the app code will run after this accounts-base startup
// block.  Perhaps we need a post-startup callback?


Meteor.startup(function () {
  if (!usingOAuthEncryption()) {
    return;
  }

  var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
  ServiceConfiguration.configurations.find({
    $and: [{
      secret: {
        $exists: true
      }
    }, {
      "secret.algorithm": {
        $exists: false
      }
    }]
  }).forEach(function (config) {
    ServiceConfiguration.configurations.update(config._id, {
      $set: {
        secret: OAuthEncryption.seal(config.secret)
      }
    });
  });
}); // XXX see comment on Accounts.createUser in passwords_server about adding a
// second "server options" argument.

function defaultCreateUserHook(options, user) {
  if (options.profile) user.profile = options.profile;
  return user;
} // Called by accounts-password


Ap.insertUserDoc = function (options, user) {
  // - clone user document, to protect from modification
  // - add createdAt timestamp
  // - prepare an _id, so that you can modify other collections (eg
  // create a first task for every new user)
  //
  // XXX If the onCreateUser or validateNewUser hooks fail, we might
  // end up having modified some other collection
  // inappropriately. The solution is probably to have onCreateUser
  // accept two callbacks - one that gets called before inserting
  // the user document (in which you can modify its contents), and
  // one that gets called after (in which you should change other
  // collections)
  user = _.extend({
    createdAt: new Date(),
    _id: Random.id()
  }, user);

  if (user.services) {
    _.each(user.services, function (serviceData) {
      pinEncryptedFieldsToUser(serviceData, user._id);
    });
  }

  var fullUser;

  if (this._onCreateUserHook) {
    fullUser = this._onCreateUserHook(options, user); // This is *not* part of the API. We need this because we can't isolate
    // the global server environment between tests, meaning we can't test
    // both having a create user hook set and not having one set.

    if (fullUser === 'TEST DEFAULT HOOK') fullUser = defaultCreateUserHook(options, user);
  } else {
    fullUser = defaultCreateUserHook(options, user);
  }

  _.each(this._validateNewUserHooks, function (hook) {
    if (!hook(fullUser)) throw new Meteor.Error(403, "User validation failed");
  });

  var userId;

  try {
    userId = this.users.insert(fullUser);
  } catch (e) {
    // XXX string parsing sucks, maybe
    // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
    if (e.name !== 'MongoError') throw e;
    if (e.code !== 11000) throw e;
    if (e.errmsg.indexOf('emails.address') !== -1) throw new Meteor.Error(403, "Email already exists.");
    if (e.errmsg.indexOf('username') !== -1) throw new Meteor.Error(403, "Username already exists."); // XXX better error reporting for services.facebook.id duplicate, etc

    throw e;
  }

  return userId;
}; // Helper function: returns false if email does not match company domain from
// the configuration.


Ap._testEmailDomain = function (email) {
  var domain = this._options.restrictCreationByEmailDomain;
  return !domain || _.isFunction(domain) && domain(email) || _.isString(domain) && new RegExp('@' + Meteor._escapeRegExp(domain) + '$', 'i').test(email);
}; // Validate new user's email or Google/Facebook/GitHub account's email


function defaultValidateNewUserHook(user) {
  var self = this;
  var domain = self._options.restrictCreationByEmailDomain;
  if (!domain) return true;
  var emailIsGood = false;

  if (!_.isEmpty(user.emails)) {
    emailIsGood = _.any(user.emails, function (email) {
      return self._testEmailDomain(email.address);
    });
  } else if (!_.isEmpty(user.services)) {
    // Find any email of any service and check it
    emailIsGood = _.any(user.services, function (service) {
      return service.email && self._testEmailDomain(service.email);
    });
  }

  if (emailIsGood) return true;
  if (_.isString(domain)) throw new Meteor.Error(403, "@" + domain + " email required");else throw new Meteor.Error(403, "Email doesn't match the criteria.");
} ///
/// MANAGING USER OBJECTS
///
// Updates or creates a user after we authenticate with a 3rd party.
//
// @param serviceName {String} Service name (eg, twitter).
// @param serviceData {Object} Data to store in the user's record
//        under services[serviceName]. Must include an "id" field
//        which is a unique identifier for the user in the service.
// @param options {Object, optional} Other options to pass to insertUserDoc
//        (eg, profile)
// @returns {Object} Object with token and id keys, like the result
//        of the "login" method.
//


Ap.updateOrCreateUserFromExternalService = function (serviceName, serviceData, options) {
  options = _.clone(options || {});
  if (serviceName === "password" || serviceName === "resume") throw new Error("Can't use updateOrCreateUserFromExternalService with internal service " + serviceName);
  if (!_.has(serviceData, 'id')) throw new Error("Service data for service " + serviceName + " must include id"); // Look for a user with the appropriate service user id.

  var selector = {};
  var serviceIdKey = "services." + serviceName + ".id"; // XXX Temporary special case for Twitter. (Issue #629)
  //   The serviceData.id will be a string representation of an integer.
  //   We want it to match either a stored string or int representation.
  //   This is to cater to earlier versions of Meteor storing twitter
  //   user IDs in number form, and recent versions storing them as strings.
  //   This can be removed once migration technology is in place, and twitter
  //   users stored with integer IDs have been migrated to string IDs.

  if (serviceName === "twitter" && !isNaN(serviceData.id)) {
    selector["$or"] = [{}, {}];
    selector["$or"][0][serviceIdKey] = serviceData.id;
    selector["$or"][1][serviceIdKey] = parseInt(serviceData.id, 10);
  } else {
    selector[serviceIdKey] = serviceData.id;
  }

  var user = this.users.findOne(selector); // When creating a new user we pass through all options. When updating an
  // existing user, by default we only process/pass through the serviceData
  // (eg, so that we keep an unexpired access token and don't cache old email
  // addresses in serviceData.email). The onExternalLogin hook can be used when
  // creating or updating a user, to modify or pass through more options as
  // needed.

  var opts = user ? {} : options;

  if (this._onExternalLoginHook) {
    opts = this._onExternalLoginHook(options, user);
  }

  if (user) {
    pinEncryptedFieldsToUser(serviceData, user._id);
    var setAttrs = {};

    _.each(serviceData, function (value, key) {
      setAttrs["services." + serviceName + "." + key] = value;
    }); // XXX Maybe we should re-use the selector above and notice if the update
    //     touches nothing?


    setAttrs = _.extend({}, setAttrs, opts);
    this.users.update(user._id, {
      $set: setAttrs
    });
    return {
      type: serviceName,
      userId: user._id
    };
  } else {
    // Create a new user with the service data.
    user = {
      services: {}
    };
    user.services[serviceName] = serviceData;
    return {
      type: serviceName,
      userId: this.insertUserDoc(opts, user)
    };
  }
};

function setupUsersCollection(users) {
  ///
  /// RESTRICTING WRITES TO USER OBJECTS
  ///
  users.allow({
    // clients can modify the profile field of their own document, and
    // nothing else.
    update: function (userId, user, fields, modifier) {
      // make sure it is our record
      if (user._id !== userId) return false; // user can only modify the 'profile' field. sets to multiple
      // sub-keys (eg profile.foo and profile.bar) are merged into entry
      // in the fields list.

      if (fields.length !== 1 || fields[0] !== 'profile') return false;
      return true;
    },
    fetch: ['_id'] // we only look at _id.

  }); /// DEFAULT INDEXES ON USERS

  users._ensureIndex('username', {
    unique: 1,
    sparse: 1
  });

  users._ensureIndex('emails.address', {
    unique: 1,
    sparse: 1
  });

  users._ensureIndex('services.resume.loginTokens.hashedToken', {
    unique: 1,
    sparse: 1
  });

  users._ensureIndex('services.resume.loginTokens.token', {
    unique: 1,
    sparse: 1
  }); // For taking care of logoutOtherClients calls that crashed before the
  // tokens were deleted.


  users._ensureIndex('services.resume.haveLoginTokensToDelete', {
    sparse: 1
  }); // For expiring login tokens


  users._ensureIndex("services.resume.loginTokens.when", {
    sparse: 1
  }); // For expiring password tokens


  users._ensureIndex('services.password.reset.when', {
    sparse: 1
  });
} ///
/// CLEAN UP FOR `logoutOtherClients`
///


Ap._deleteSavedTokensForUser = function (userId, tokensToDelete) {
  if (tokensToDelete) {
    this.users.update(userId, {
      $unset: {
        "services.resume.haveLoginTokensToDelete": 1,
        "services.resume.loginTokensToDelete": 1
      },
      $pullAll: {
        "services.resume.loginTokens": tokensToDelete
      }
    });
  }
};

Ap._deleteSavedTokensForAllUsersOnStartup = function () {
  var self = this; // If we find users who have saved tokens to delete on startup, delete
  // them now. It's possible that the server could have crashed and come
  // back up before new tokens are found in localStorage, but this
  // shouldn't happen very often. We shouldn't put a delay here because
  // that would give a lot of power to an attacker with a stolen login
  // token and the ability to crash the server.

  Meteor.startup(function () {
    self.users.find({
      "services.resume.haveLoginTokensToDelete": true
    }, {
      "services.resume.loginTokensToDelete": 1
    }).forEach(function (user) {
      self._deleteSavedTokensForUser(user._id, user.services.resume.loginTokensToDelete);
    });
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"url_server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-base/url_server.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let AccountsServer;
module.watch(require("./accounts_server.js"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);
// XXX These should probably not actually be public?
AccountsServer.prototype.urls = {
  resetPassword: function (token) {
    return Meteor.absoluteUrl('#/reset-password/' + token);
  },
  verifyEmail: function (token) {
    return Meteor.absoluteUrl('#/verify-email/' + token);
  },
  enrollAccount: function (token) {
    return Meteor.absoluteUrl('#/enroll-account/' + token);
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/accounts-base/server_main.js");

/* Exports */
Package._define("accounts-base", exports, {
  Accounts: Accounts
});

})();

//# sourceURL=meteor://💻app/packages/accounts-base.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9zZXJ2ZXJfbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9hY2NvdW50c19jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FjY291bnRzLWJhc2UvYWNjb3VudHNfcmF0ZV9saW1pdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9hY2NvdW50c19zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FjY291bnRzLWJhc2UvdXJsX3NlcnZlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUxIiwibW9kdWxlIiwiZXhwb3J0IiwiQWNjb3VudHNTZXJ2ZXIiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiQWNjb3VudHMiLCJNZXRlb3IiLCJzZXJ2ZXIiLCJ1c2VycyIsIkFjY291bnRzQ29tbW9uIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiX29wdGlvbnMiLCJjb25uZWN0aW9uIiwidW5kZWZpbmVkIiwiX2luaXRDb25uZWN0aW9uIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiX3ByZXZlbnRBdXRvcHVibGlzaCIsIl9vbkxvZ2luSG9vayIsIkhvb2siLCJiaW5kRW52aXJvbm1lbnQiLCJkZWJ1Z1ByaW50RXhjZXB0aW9ucyIsIl9vbkxvZ2luRmFpbHVyZUhvb2siLCJfb25Mb2dvdXRIb29rIiwidXNlcklkIiwiRXJyb3IiLCJ1c2VyIiwiZmluZE9uZSIsImNvbmZpZyIsInNlbGYiLCJpc1NlcnZlciIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJhY2NvdW50c0NvbmZpZ0NhbGxlZCIsIl9kZWJ1ZyIsIl8iLCJoYXMiLCJpc0NsaWVudCIsIlBhY2thZ2UiLCJPQXV0aEVuY3J5cHRpb24iLCJsb2FkS2V5Iiwib2F1dGhTZWNyZXRLZXkiLCJvbWl0IiwiVkFMSURfS0VZUyIsImVhY2giLCJrZXlzIiwia2V5IiwiY29udGFpbnMiLCJvbkxvZ2luIiwiZnVuYyIsInJlZ2lzdGVyIiwib25Mb2dpbkZhaWx1cmUiLCJvbkxvZ291dCIsImRkcFVybCIsIkREUCIsImNvbm5lY3QiLCJBQ0NPVU5UU19DT05ORUNUSU9OX1VSTCIsIl9nZXRUb2tlbkxpZmV0aW1lTXMiLCJsb2dpbkV4cGlyYXRpb25JbkRheXMiLCJMT0dJTl9VTkVYUElSSU5HX1RPS0VOX0RBWVMiLCJERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUyIsIl9nZXRQYXNzd29yZFJlc2V0VG9rZW5MaWZldGltZU1zIiwicGFzc3dvcmRSZXNldFRva2VuRXhwaXJhdGlvbkluRGF5cyIsIkRFRkFVTFRfUEFTU1dPUkRfUkVTRVRfVE9LRU5fRVhQSVJBVElPTl9EQVlTIiwiX2dldFBhc3N3b3JkRW5yb2xsVG9rZW5MaWZldGltZU1zIiwicGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb25JbkRheXMiLCJERUZBVUxUX1BBU1NXT1JEX0VOUk9MTF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMiLCJfdG9rZW5FeHBpcmF0aW9uIiwid2hlbiIsIkRhdGUiLCJnZXRUaW1lIiwiX3Rva2VuRXhwaXJlc1Nvb24iLCJtaW5MaWZldGltZU1zIiwibWluTGlmZXRpbWVDYXBNcyIsIk1JTl9UT0tFTl9MSUZFVElNRV9DQVBfU0VDUyIsIkFwIiwicHJvdG90eXBlIiwiRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyIsIkNPTk5FQ1RJT05fQ0xPU0VfREVMQVlfTVMiLCJzdGFydHVwIiwiU2VydmljZUNvbmZpZ3VyYXRpb24iLCJsb2dpblNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJDb25maWdFcnJvciIsImxjZU5hbWUiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibWFrZUVycm9yVHlwZSIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsIm5hbWUiLCJudW1lcmljRXJyb3IiLCJkZWZhdWx0UmF0ZUxpbWl0ZXJSdWxlSWQiLCJyZW1vdmVEZWZhdWx0UmF0ZUxpbWl0IiwicmVzcCIsIkREUFJhdGVMaW1pdGVyIiwicmVtb3ZlUnVsZSIsImFkZERlZmF1bHRSYXRlTGltaXQiLCJhZGRSdWxlIiwiY2xpZW50QWRkcmVzcyIsInR5cGUiLCJjb25uZWN0aW9uSWQiLCJjcnlwdG8iLCJOcG0iLCJfc2VydmVyIiwiX2luaXRTZXJ2ZXJNZXRob2RzIiwiX2luaXRBY2NvdW50RGF0YUhvb2tzIiwiX2F1dG9wdWJsaXNoRmllbGRzIiwibG9nZ2VkSW5Vc2VyIiwib3RoZXJVc2VycyIsIl9pbml0U2VydmVyUHVibGljYXRpb25zIiwiX2FjY291bnREYXRhIiwiX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zIiwiX25leHRVc2VyT2JzZXJ2ZU51bWJlciIsIl9sb2dpbkhhbmRsZXJzIiwic2V0dXBVc2Vyc0NvbGxlY3Rpb24iLCJzZXR1cERlZmF1bHRMb2dpbkhhbmRsZXJzIiwic2V0RXhwaXJlVG9rZW5zSW50ZXJ2YWwiLCJfdmFsaWRhdGVMb2dpbkhvb2siLCJfdmFsaWRhdGVOZXdVc2VySG9va3MiLCJkZWZhdWx0VmFsaWRhdGVOZXdVc2VySG9vayIsImJpbmQiLCJfZGVsZXRlU2F2ZWRUb2tlbnNGb3JBbGxVc2Vyc09uU3RhcnR1cCIsIl9za2lwQ2FzZUluc2Vuc2l0aXZlQ2hlY2tzRm9yVGVzdCIsImN1cnJlbnRJbnZvY2F0aW9uIiwiX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uIiwiZ2V0IiwiX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24iLCJ2YWxpZGF0ZUxvZ2luQXR0ZW1wdCIsInZhbGlkYXRlTmV3VXNlciIsInB1c2giLCJvbkNyZWF0ZVVzZXIiLCJfb25DcmVhdGVVc2VySG9vayIsIm9uRXh0ZXJuYWxMb2dpbiIsIl9vbkV4dGVybmFsTG9naW5Ib29rIiwiY2xvbmVBdHRlbXB0V2l0aENvbm5lY3Rpb24iLCJhdHRlbXB0IiwiY2xvbmVkQXR0ZW1wdCIsIkVKU09OIiwiY2xvbmUiLCJfdmFsaWRhdGVMb2dpbiIsImNhbGxiYWNrIiwicmV0IiwiZSIsImFsbG93ZWQiLCJlcnJvciIsIl9zdWNjZXNzZnVsTG9naW4iLCJfZmFpbGVkTG9naW4iLCJfc3VjY2Vzc2Z1bExvZ291dCIsInRyeUxvZ2luTWV0aG9kIiwiZm4iLCJyZXN1bHQiLCJfbG9naW5Vc2VyIiwibWV0aG9kSW52b2NhdGlvbiIsInN0YW1wZWRMb2dpblRva2VuIiwiX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4iLCJfaW5zZXJ0TG9naW5Ub2tlbiIsIl9ub1lpZWxkc0FsbG93ZWQiLCJfc2V0TG9naW5Ub2tlbiIsIl9oYXNoTG9naW5Ub2tlbiIsInRva2VuIiwic2V0VXNlcklkIiwiaWQiLCJ0b2tlbkV4cGlyZXMiLCJfYXR0ZW1wdExvZ2luIiwibWV0aG9kTmFtZSIsIm1ldGhvZEFyZ3MiLCJtZXRob2RBcmd1bWVudHMiLCJ0b0FycmF5IiwiZXh0ZW5kIiwiX2xvZ2luTWV0aG9kIiwiX3JlcG9ydExvZ2luRmFpbHVyZSIsInJlZ2lzdGVyTG9naW5IYW5kbGVyIiwiaGFuZGxlciIsIl9ydW5Mb2dpbkhhbmRsZXJzIiwiaSIsImxlbmd0aCIsImNhbGwiLCJkZXN0cm95VG9rZW4iLCJsb2dpblRva2VuIiwidXBkYXRlIiwiJHB1bGwiLCIkb3IiLCJoYXNoZWRUb2tlbiIsImFjY291bnRzIiwibWV0aG9kcyIsImxvZ2luIiwiY2hlY2siLCJPYmplY3QiLCJhcmd1bWVudHMiLCJsb2dvdXQiLCJfZ2V0TG9naW5Ub2tlbiIsImxvZ291dE90aGVyQ2xpZW50cyIsImZpZWxkcyIsInRva2VucyIsInNlcnZpY2VzIiwicmVzdW1lIiwibG9naW5Ub2tlbnMiLCJuZXdUb2tlbiIsIiRzZXQiLCIkcHVzaCIsIl9oYXNoU3RhbXBlZFRva2VuIiwic2V0VGltZW91dCIsIl9kZWxldGVTYXZlZFRva2Vuc0ZvclVzZXIiLCJfbm9Db25uZWN0aW9uQ2xvc2VEZWxheUZvclRlc3QiLCJnZXROZXdUb2tlbiIsImN1cnJlbnRIYXNoZWRUb2tlbiIsImN1cnJlbnRTdGFtcGVkVG9rZW4iLCJmaW5kIiwic3RhbXBlZFRva2VuIiwibmV3U3RhbXBlZFRva2VuIiwicmVtb3ZlT3RoZXJUb2tlbnMiLCJjdXJyZW50VG9rZW4iLCIkbmUiLCJjb25maWd1cmVMb2dpblNlcnZpY2UiLCJNYXRjaCIsIk9iamVjdEluY2x1ZGluZyIsInNlcnZpY2UiLCJTdHJpbmciLCJvYXV0aCIsInNlcnZpY2VOYW1lcyIsInVzaW5nT0F1dGhFbmNyeXB0aW9uIiwic2VjcmV0Iiwic2VhbCIsImluc2VydCIsIm9uQ29ubmVjdGlvbiIsIm9uQ2xvc2UiLCJfcmVtb3ZlVG9rZW5Gcm9tQ29ubmVjdGlvbiIsInB1Ymxpc2giLCJpc19hdXRvIiwiX2lkIiwicHJvZmlsZSIsInVzZXJuYW1lIiwiZW1haWxzIiwiYXV0b3B1Ymxpc2giLCJ0b0ZpZWxkU2VsZWN0b3IiLCJvYmplY3QiLCJtYXAiLCJmaWVsZCIsInNlbGVjdG9yIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJvcHRzIiwiYXBwbHkiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwiX2dldEFjY291bnREYXRhIiwiZGF0YSIsIl9zZXRBY2NvdW50RGF0YSIsInZhbHVlIiwiaGFzaCIsImNyZWF0ZUhhc2giLCJkaWdlc3QiLCJfaW5zZXJ0SGFzaGVkTG9naW5Ub2tlbiIsInF1ZXJ5IiwiJGFkZFRvU2V0IiwiX2NsZWFyQWxsTG9naW5Ub2tlbnMiLCJfZ2V0VXNlck9ic2VydmUiLCJvYnNlcnZlIiwic3RvcCIsIm15T2JzZXJ2ZU51bWJlciIsImRlZmVyIiwiZm91bmRNYXRjaGluZ1VzZXIiLCJvYnNlcnZlQ2hhbmdlcyIsImFkZGVkIiwicmVtb3ZlZCIsImNsb3NlIiwiZGVmYXVsdFJlc3VtZUxvZ2luSGFuZGxlciIsIm9sZFVuaGFzaGVkU3R5bGVUb2tlbiIsIlJhbmRvbSIsImV4cGlyZVBhc3N3b3JkVG9rZW4iLCJvbGRlc3RWYWxpZERhdGUiLCJ0b2tlbkZpbHRlciIsInVzZXJGaWx0ZXIiLCJyZXNldFJhbmdlT3IiLCIkbHQiLCJleHBpcmVGaWx0ZXIiLCIkYW5kIiwiJHVuc2V0IiwibXVsdGkiLCJfZXhwaXJlVG9rZW5zIiwidG9rZW5MaWZldGltZU1zIiwiX2V4cGlyZVBhc3N3b3JkUmVzZXRUb2tlbnMiLCIkZXhpc3RzIiwiX2V4cGlyZVBhc3N3b3JkRW5yb2xsVG9rZW5zIiwic3VwZXJSZXN1bHQiLCJleHBpcmVUb2tlbkludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsInNldEludGVydmFsIiwia2V5SXNMb2FkZWQiLCJwaW5FbmNyeXB0ZWRGaWVsZHNUb1VzZXIiLCJzZXJ2aWNlRGF0YSIsImlzU2VhbGVkIiwib3BlbiIsImZvckVhY2giLCJkZWZhdWx0Q3JlYXRlVXNlckhvb2siLCJpbnNlcnRVc2VyRG9jIiwiY3JlYXRlZEF0IiwiZnVsbFVzZXIiLCJob29rIiwiY29kZSIsImVycm1zZyIsImluZGV4T2YiLCJfdGVzdEVtYWlsRG9tYWluIiwiZW1haWwiLCJkb21haW4iLCJyZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbiIsImlzRnVuY3Rpb24iLCJpc1N0cmluZyIsIlJlZ0V4cCIsIl9lc2NhcGVSZWdFeHAiLCJ0ZXN0IiwiZW1haWxJc0dvb2QiLCJpc0VtcHR5IiwiYW55IiwiYWRkcmVzcyIsInVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UiLCJzZXJ2aWNlTmFtZSIsInNlcnZpY2VJZEtleSIsImlzTmFOIiwicGFyc2VJbnQiLCJzZXRBdHRycyIsImFsbG93IiwibW9kaWZpZXIiLCJmZXRjaCIsIl9lbnN1cmVJbmRleCIsInVuaXF1ZSIsInNwYXJzZSIsInRva2Vuc1RvRGVsZXRlIiwiJHB1bGxBbGwiLCJsb2dpblRva2Vuc1RvRGVsZXRlIiwidXJscyIsInJlc2V0UGFzc3dvcmQiLCJhYnNvbHV0ZVVybCIsInZlcmlmeUVtYWlsIiwiZW5yb2xsQWNjb3VudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsTUFBTUEsVUFBUUMsTUFBZDtBQUFxQkQsUUFBUUUsTUFB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VUFBVTlLLEtBQVYsRUFBaUI7QUFDOUIsV0FBT3pKLE9BQU9xVSxXQUFQLENBQW1CLHNCQUFzQjVLLEtBQXpDLENBQVA7QUFDRDtBQVg2QixDQUFoQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9hY2NvdW50cy1iYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtBY2NvdW50c1NlcnZlcn0gZnJvbSBcIi4vYWNjb3VudHNfc2VydmVyLmpzXCI7XG5pbXBvcnQgXCIuL2FjY291bnRzX3JhdGVfbGltaXQuanNcIjtcbmltcG9ydCBcIi4vdXJsX3NlcnZlci5qc1wiO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgQWNjb3VudHNcbiAqIEBzdW1tYXJ5IFRoZSBuYW1lc3BhY2UgZm9yIGFsbCBzZXJ2ZXItc2lkZSBhY2NvdW50cy1yZWxhdGVkIG1ldGhvZHMuXG4gKi9cbkFjY291bnRzID0gbmV3IEFjY291bnRzU2VydmVyKE1ldGVvci5zZXJ2ZXIpO1xuXG4vLyBVc2VycyB0YWJsZS4gRG9uJ3QgdXNlIHRoZSBub3JtYWwgYXV0b3B1Ymxpc2gsIHNpbmNlIHdlIHdhbnQgdG8gaGlkZVxuLy8gc29tZSBmaWVsZHMuIENvZGUgdG8gYXV0b3B1Ymxpc2ggdGhpcyBpcyBpbiBhY2NvdW50c19zZXJ2ZXIuanMuXG4vLyBYWFggQWxsb3cgdXNlcnMgdG8gY29uZmlndXJlIHRoaXMgY29sbGVjdGlvbiBuYW1lLlxuXG4vKipcbiAqIEBzdW1tYXJ5IEEgW01vbmdvLkNvbGxlY3Rpb25dKCNjb2xsZWN0aW9ucykgY29udGFpbmluZyB1c2VyIGRvY3VtZW50cy5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHR5cGUge01vbmdvLkNvbGxlY3Rpb259XG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4qL1xuTWV0ZW9yLnVzZXJzID0gQWNjb3VudHMudXNlcnM7XG5cbmV4cG9ydCB7XG4gIC8vIFNpbmNlIHRoaXMgZmlsZSBpcyB0aGUgbWFpbiBtb2R1bGUgZm9yIHRoZSBzZXJ2ZXIgdmVyc2lvbiBvZiB0aGVcbiAgLy8gYWNjb3VudHMtYmFzZSBwYWNrYWdlLCBwcm9wZXJ0aWVzIG9mIG5vbi1lbnRyeS1wb2ludCBtb2R1bGVzIG5lZWQgdG9cbiAgLy8gYmUgcmUtZXhwb3J0ZWQgaW4gb3JkZXIgdG8gYmUgYWNjZXNzaWJsZSB0byBtb2R1bGVzIHRoYXQgaW1wb3J0IHRoZVxuICAvLyBhY2NvdW50cy1iYXNlIHBhY2thZ2UuXG4gIEFjY291bnRzU2VydmVyXG59O1xuIiwiLyoqXG4gKiBAc3VtbWFyeSBTdXBlci1jb25zdHJ1Y3RvciBmb3IgQWNjb3VudHNDbGllbnQgYW5kIEFjY291bnRzU2VydmVyLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAY2xhc3MgQWNjb3VudHNDb21tb25cbiAqIEBpbnN0YW5jZW5hbWUgYWNjb3VudHNDbGllbnRPclNlcnZlclxuICogQHBhcmFtIG9wdGlvbnMge09iamVjdH0gYW4gb2JqZWN0IHdpdGggZmllbGRzOlxuICogLSBjb25uZWN0aW9uIHtPYmplY3R9IE9wdGlvbmFsIEREUCBjb25uZWN0aW9uIHRvIHJldXNlLlxuICogLSBkZHBVcmwge1N0cmluZ30gT3B0aW9uYWwgVVJMIGZvciBjcmVhdGluZyBhIG5ldyBERFAgY29ubmVjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFjY291bnRzQ29tbW9uIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIC8vIEN1cnJlbnRseSB0aGlzIGlzIHJlYWQgZGlyZWN0bHkgYnkgcGFja2FnZXMgbGlrZSBhY2NvdW50cy1wYXNzd29yZFxuICAgIC8vIGFuZCBhY2NvdW50cy11aS11bnN0eWxlZC5cbiAgICB0aGlzLl9vcHRpb25zID0ge307XG5cbiAgICAvLyBOb3RlIHRoYXQgc2V0dGluZyB0aGlzLmNvbm5lY3Rpb24gPSBudWxsIGNhdXNlcyB0aGlzLnVzZXJzIHRvIGJlIGFcbiAgICAvLyBMb2NhbENvbGxlY3Rpb24sIHdoaWNoIGlzIG5vdCB3aGF0IHdlIHdhbnQuXG4gICAgdGhpcy5jb25uZWN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2luaXRDb25uZWN0aW9uKG9wdGlvbnMgfHwge30pO1xuXG4gICAgLy8gVGhlcmUgaXMgYW4gYWxsb3cgY2FsbCBpbiBhY2NvdW50c19zZXJ2ZXIuanMgdGhhdCByZXN0cmljdHMgd3JpdGVzIHRvXG4gICAgLy8gdGhpcyBjb2xsZWN0aW9uLlxuICAgIHRoaXMudXNlcnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbihcInVzZXJzXCIsIHtcbiAgICAgIF9wcmV2ZW50QXV0b3B1Ymxpc2g6IHRydWUsXG4gICAgICBjb25uZWN0aW9uOiB0aGlzLmNvbm5lY3Rpb25cbiAgICB9KTtcblxuICAgIC8vIENhbGxiYWNrIGV4Y2VwdGlvbnMgYXJlIHByaW50ZWQgd2l0aCBNZXRlb3IuX2RlYnVnIGFuZCBpZ25vcmVkLlxuICAgIHRoaXMuX29uTG9naW5Ib29rID0gbmV3IEhvb2soe1xuICAgICAgYmluZEVudmlyb25tZW50OiBmYWxzZSxcbiAgICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiBcIm9uTG9naW4gY2FsbGJhY2tcIlxuICAgIH0pO1xuXG4gICAgdGhpcy5fb25Mb2dpbkZhaWx1cmVIb29rID0gbmV3IEhvb2soe1xuICAgICAgYmluZEVudmlyb25tZW50OiBmYWxzZSxcbiAgICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiBcIm9uTG9naW5GYWlsdXJlIGNhbGxiYWNrXCJcbiAgICB9KTtcblxuICAgIHRoaXMuX29uTG9nb3V0SG9vayA9IG5ldyBIb29rKHtcbiAgICAgIGJpbmRFbnZpcm9ubWVudDogZmFsc2UsXG4gICAgICBkZWJ1Z1ByaW50RXhjZXB0aW9uczogXCJvbkxvZ291dCBjYWxsYmFja1wiXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0IHRoZSBjdXJyZW50IHVzZXIgaWQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi4gQSByZWFjdGl2ZSBkYXRhIHNvdXJjZS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqL1xuICB1c2VySWQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwidXNlcklkIG1ldGhvZCBub3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0IHRoZSBjdXJyZW50IHVzZXIgcmVjb3JkLCBvciBgbnVsbGAgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4uIEEgcmVhY3RpdmUgZGF0YSBzb3VyY2UuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKi9cbiAgdXNlcigpIHtcbiAgICB2YXIgdXNlcklkID0gdGhpcy51c2VySWQoKTtcbiAgICByZXR1cm4gdXNlcklkID8gdGhpcy51c2Vycy5maW5kT25lKHVzZXJJZCkgOiBudWxsO1xuICB9XG5cbiAgLy8gU2V0IHVwIGNvbmZpZyBmb3IgdGhlIGFjY291bnRzIHN5c3RlbS4gQ2FsbCB0aGlzIG9uIGJvdGggdGhlIGNsaWVudFxuICAvLyBhbmQgdGhlIHNlcnZlci5cbiAgLy9cbiAgLy8gTm90ZSB0aGF0IHRoaXMgbWV0aG9kIGdldHMgb3ZlcnJpZGRlbiBvbiBBY2NvdW50c1NlcnZlci5wcm90b3R5cGUsIGJ1dFxuICAvLyB0aGUgb3ZlcnJpZGluZyBtZXRob2QgY2FsbHMgdGhlIG92ZXJyaWRkZW4gbWV0aG9kLlxuICAvL1xuICAvLyBYWFggd2Ugc2hvdWxkIGFkZCBzb21lIGVuZm9yY2VtZW50IHRoYXQgdGhpcyBpcyBjYWxsZWQgb24gYm90aCB0aGVcbiAgLy8gY2xpZW50IGFuZCB0aGUgc2VydmVyLiBPdGhlcndpc2UsIGEgdXNlciBjYW5cbiAgLy8gJ2ZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbicgb25seSBvbiB0aGUgY2xpZW50IGFuZCB3aGlsZSBpdCBsb29rc1xuICAvLyBsaWtlIHRoZWlyIGFwcCBpcyBzZWN1cmUsIHRoZSBzZXJ2ZXIgd2lsbCBzdGlsbCBhY2NlcHQgY3JlYXRlVXNlclxuICAvLyBjYWxscy4gaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzgyOFxuICAvL1xuICAvLyBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCBmaWVsZHM6XG4gIC8vIC0gc2VuZFZlcmlmaWNhdGlvbkVtYWlsIHtCb29sZWFufVxuICAvLyAgICAgU2VuZCBlbWFpbCBhZGRyZXNzIHZlcmlmaWNhdGlvbiBlbWFpbHMgdG8gbmV3IHVzZXJzIGNyZWF0ZWQgZnJvbVxuICAvLyAgICAgY2xpZW50IHNpZ251cHMuXG4gIC8vIC0gZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uIHtCb29sZWFufVxuICAvLyAgICAgRG8gbm90IGFsbG93IGNsaWVudHMgdG8gY3JlYXRlIGFjY291bnRzIGRpcmVjdGx5LlxuICAvLyAtIHJlc3RyaWN0Q3JlYXRpb25CeUVtYWlsRG9tYWluIHtGdW5jdGlvbiBvciBTdHJpbmd9XG4gIC8vICAgICBSZXF1aXJlIGNyZWF0ZWQgdXNlcnMgdG8gaGF2ZSBhbiBlbWFpbCBtYXRjaGluZyB0aGUgZnVuY3Rpb24gb3JcbiAgLy8gICAgIGhhdmluZyB0aGUgc3RyaW5nIGFzIGRvbWFpbi5cbiAgLy8gLSBsb2dpbkV4cGlyYXRpb25JbkRheXMge051bWJlcn1cbiAgLy8gICAgIE51bWJlciBvZiBkYXlzIHNpbmNlIGxvZ2luIHVudGlsIGEgdXNlciBpcyBsb2dnZWQgb3V0IChsb2dpbiB0b2tlblxuICAvLyAgICAgZXhwaXJlcykuXG4gIC8vIC0gcGFzc3dvcmRSZXNldFRva2VuRXhwaXJhdGlvbkluRGF5cyB7TnVtYmVyfVxuICAvLyAgICAgTnVtYmVyIG9mIGRheXMgc2luY2UgcGFzc3dvcmQgcmVzZXQgdG9rZW4gY3JlYXRpb24gdW50aWwgdGhlXG4gIC8vICAgICB0b2tlbiBjYW5udCBiZSB1c2VkIGFueSBsb25nZXIgKHBhc3N3b3JkIHJlc2V0IHRva2VuIGV4cGlyZXMpLlxuICAvLyAtIGFtYmlndW91c0Vycm9yTWVzc2FnZXMge0Jvb2xlYW59XG4gIC8vICAgICBSZXR1cm4gYW1iaWd1b3VzIGVycm9yIG1lc3NhZ2VzIGZyb20gbG9naW4gZmFpbHVyZXMgdG8gcHJldmVudFxuICAvLyAgICAgdXNlciBlbnVtZXJhdGlvbi5cbiAgLy8gLSBiY3J5cHRSb3VuZHMge051bWJlcn1cbiAgLy8gICAgIEFsbG93cyBvdmVycmlkZSBvZiBudW1iZXIgb2YgYmNyeXB0IHJvdW5kcyAoYWthIHdvcmsgZmFjdG9yKSB1c2VkXG4gIC8vICAgICB0byBzdG9yZSBwYXNzd29yZHMuXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFNldCBnbG9iYWwgYWNjb3VudHMgb3B0aW9ucy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5zZW5kVmVyaWZpY2F0aW9uRW1haWwgTmV3IHVzZXJzIHdpdGggYW4gZW1haWwgYWRkcmVzcyB3aWxsIHJlY2VpdmUgYW4gYWRkcmVzcyB2ZXJpZmljYXRpb24gZW1haWwuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5mb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24gQ2FsbHMgdG8gW2BjcmVhdGVVc2VyYF0oI2FjY291bnRzX2NyZWF0ZXVzZXIpIGZyb20gdGhlIGNsaWVudCB3aWxsIGJlIHJlamVjdGVkLiBJbiBhZGRpdGlvbiwgaWYgeW91IGFyZSB1c2luZyBbYWNjb3VudHMtdWldKCNhY2NvdW50c3VpKSwgdGhlIFwiQ3JlYXRlIGFjY291bnRcIiBsaW5rIHdpbGwgbm90IGJlIGF2YWlsYWJsZS5cbiAgICogQHBhcmFtIHtTdHJpbmcgfCBGdW5jdGlvbn0gb3B0aW9ucy5yZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbiBJZiBzZXQgdG8gYSBzdHJpbmcsIG9ubHkgYWxsb3dzIG5ldyB1c2VycyBpZiB0aGUgZG9tYWluIHBhcnQgb2YgdGhlaXIgZW1haWwgYWRkcmVzcyBtYXRjaGVzIHRoZSBzdHJpbmcuIElmIHNldCB0byBhIGZ1bmN0aW9uLCBvbmx5IGFsbG93cyBuZXcgdXNlcnMgaWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZS4gIFRoZSBmdW5jdGlvbiBpcyBwYXNzZWQgdGhlIGZ1bGwgZW1haWwgYWRkcmVzcyBvZiB0aGUgcHJvcG9zZWQgbmV3IHVzZXIuICBXb3JrcyB3aXRoIHBhc3N3b3JkLWJhc2VkIHNpZ24taW4gYW5kIGV4dGVybmFsIHNlcnZpY2VzIHRoYXQgZXhwb3NlIGVtYWlsIGFkZHJlc3NlcyAoR29vZ2xlLCBGYWNlYm9vaywgR2l0SHViKS4gQWxsIGV4aXN0aW5nIHVzZXJzIHN0aWxsIGNhbiBsb2cgaW4gYWZ0ZXIgZW5hYmxpbmcgdGhpcyBvcHRpb24uIEV4YW1wbGU6IGBBY2NvdW50cy5jb25maWcoeyByZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbjogJ3NjaG9vbC5lZHUnIH0pYC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzIFRoZSBudW1iZXIgb2YgZGF5cyBmcm9tIHdoZW4gYSB1c2VyIGxvZ3MgaW4gdW50aWwgdGhlaXIgdG9rZW4gZXhwaXJlcyBhbmQgdGhleSBhcmUgbG9nZ2VkIG91dC4gRGVmYXVsdHMgdG8gOTAuIFNldCB0byBgbnVsbGAgdG8gZGlzYWJsZSBsb2dpbiBleHBpcmF0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5vYXV0aFNlY3JldEtleSBXaGVuIHVzaW5nIHRoZSBgb2F1dGgtZW5jcnlwdGlvbmAgcGFja2FnZSwgdGhlIDE2IGJ5dGUga2V5IHVzaW5nIHRvIGVuY3J5cHQgc2Vuc2l0aXZlIGFjY291bnQgY3JlZGVudGlhbHMgaW4gdGhlIGRhdGFiYXNlLCBlbmNvZGVkIGluIGJhc2U2NC4gIFRoaXMgb3B0aW9uIG1heSBvbmx5IGJlIHNwZWNpZmVkIG9uIHRoZSBzZXJ2ZXIuICBTZWUgcGFja2FnZXMvb2F1dGgtZW5jcnlwdGlvbi9SRUFETUUubWQgZm9yIGRldGFpbHMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLnBhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb25JbkRheXMgVGhlIG51bWJlciBvZiBkYXlzIGZyb20gd2hlbiBhIGxpbmsgdG8gcmVzZXQgcGFzc3dvcmQgaXMgc2VudCB1bnRpbCB0b2tlbiBleHBpcmVzIGFuZCB1c2VyIGNhbid0IHJlc2V0IHBhc3N3b3JkIHdpdGggdGhlIGxpbmsgYW55bW9yZS4gRGVmYXVsdHMgdG8gMy5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdGlvbnMucGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb25JbkRheXMgVGhlIG51bWJlciBvZiBkYXlzIGZyb20gd2hlbiBhIGxpbmsgdG8gc2V0IGluaXRhbCBwYXNzd29yZCBpcyBzZW50IHVudGlsIHRva2VuIGV4cGlyZXMgYW5kIHVzZXIgY2FuJ3Qgc2V0IHBhc3N3b3JkIHdpdGggdGhlIGxpbmsgYW55bW9yZS4gRGVmYXVsdHMgdG8gMzAuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5hbWJpZ3VvdXNFcnJvck1lc3NhZ2VzIFJldHVybiBhbWJpZ3VvdXMgZXJyb3IgbWVzc2FnZXMgZnJvbSBsb2dpbiBmYWlsdXJlcyB0byBwcmV2ZW50IHVzZXIgZW51bWVyYXRpb24uIERlZmF1bHRzIHRvIGZhbHNlLlxuICAgKi9cbiAgY29uZmlnKG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBXZSBkb24ndCB3YW50IHVzZXJzIHRvIGFjY2lkZW50YWxseSBvbmx5IGNhbGwgQWNjb3VudHMuY29uZmlnIG9uIHRoZVxuICAgIC8vIGNsaWVudCwgd2hlcmUgc29tZSBvZiB0aGUgb3B0aW9ucyB3aWxsIGhhdmUgcGFydGlhbCBlZmZlY3RzIChlZyByZW1vdmluZ1xuICAgIC8vIHRoZSBcImNyZWF0ZSBhY2NvdW50XCIgYnV0dG9uIGZyb20gYWNjb3VudHMtdWkgaWYgZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uXG4gICAgLy8gaXMgc2V0LCBvciByZWRpcmVjdGluZyBHb29nbGUgbG9naW4gdG8gYSBzcGVjaWZpYy1kb21haW4gcGFnZSkgd2l0aG91dFxuICAgIC8vIGhhdmluZyB0aGVpciBmdWxsIGVmZmVjdHMuXG4gICAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hY2NvdW50c0NvbmZpZ0NhbGxlZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICghX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hY2NvdW50c0NvbmZpZ0NhbGxlZCkge1xuICAgICAgLy8gWFhYIHdvdWxkIGJlIG5pY2UgdG8gXCJjcmFzaFwiIHRoZSBjbGllbnQgYW5kIHJlcGxhY2UgdGhlIFVJIHdpdGggYW4gZXJyb3JcbiAgICAgIC8vIG1lc3NhZ2UsIGJ1dCB0aGVyZSdzIG5vIHRyaXZpYWwgd2F5IHRvIGRvIHRoaXMuXG4gICAgICBNZXRlb3IuX2RlYnVnKFwiQWNjb3VudHMuY29uZmlnIHdhcyBjYWxsZWQgb24gdGhlIGNsaWVudCBidXQgbm90IG9uIHRoZSBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwic2VydmVyOyBzb21lIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBtYXkgbm90IHRha2UgZWZmZWN0LlwiKTtcbiAgICB9XG5cbiAgICAvLyBXZSBuZWVkIHRvIHZhbGlkYXRlIHRoZSBvYXV0aFNlY3JldEtleSBvcHRpb24gYXQgdGhlIHRpbWVcbiAgICAvLyBBY2NvdW50cy5jb25maWcgaXMgY2FsbGVkLiBXZSBhbHNvIGRlbGliZXJhdGVseSBkb24ndCBzdG9yZSB0aGVcbiAgICAvLyBvYXV0aFNlY3JldEtleSBpbiBBY2NvdW50cy5fb3B0aW9ucy5cbiAgICBpZiAoXy5oYXMob3B0aW9ucywgXCJvYXV0aFNlY3JldEtleVwiKSkge1xuICAgICAgaWYgKE1ldGVvci5pc0NsaWVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG9hdXRoU2VjcmV0S2V5IG9wdGlvbiBtYXkgb25seSBiZSBzcGVjaWZpZWQgb24gdGhlIHNlcnZlclwiKTtcbiAgICAgIGlmICghIFBhY2thZ2VbXCJvYXV0aC1lbmNyeXB0aW9uXCJdKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgb2F1dGgtZW5jcnlwdGlvbiBwYWNrYWdlIG11c3QgYmUgbG9hZGVkIHRvIHNldCBvYXV0aFNlY3JldEtleVwiKTtcbiAgICAgIFBhY2thZ2VbXCJvYXV0aC1lbmNyeXB0aW9uXCJdLk9BdXRoRW5jcnlwdGlvbi5sb2FkS2V5KG9wdGlvbnMub2F1dGhTZWNyZXRLZXkpO1xuICAgICAgb3B0aW9ucyA9IF8ub21pdChvcHRpb25zLCBcIm9hdXRoU2VjcmV0S2V5XCIpO1xuICAgIH1cblxuICAgIC8vIHZhbGlkYXRlIG9wdGlvbiBrZXlzXG4gICAgdmFyIFZBTElEX0tFWVMgPSBbXCJzZW5kVmVyaWZpY2F0aW9uRW1haWxcIiwgXCJmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb25cIiwgXCJwYXNzd29yZEVucm9sbFRva2VuRXhwaXJhdGlvbkluRGF5c1wiLFxuICAgICAgICAgICAgICAgICAgICAgIFwicmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW5cIiwgXCJsb2dpbkV4cGlyYXRpb25JbkRheXNcIiwgXCJwYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgXCJhbWJpZ3VvdXNFcnJvck1lc3NhZ2VzXCIsIFwiYmNyeXB0Um91bmRzXCJdO1xuICAgIF8uZWFjaChfLmtleXMob3B0aW9ucyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGlmICghXy5jb250YWlucyhWQUxJRF9LRVlTLCBrZXkpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnRzLmNvbmZpZzogSW52YWxpZCBrZXk6IFwiICsga2V5KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHNldCB2YWx1ZXMgaW4gQWNjb3VudHMuX29wdGlvbnNcbiAgICBfLmVhY2goVkFMSURfS0VZUywgZnVuY3Rpb24gKGtleSkge1xuICAgICAgaWYgKGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgIGlmIChrZXkgaW4gc2VsZi5fb3B0aW9ucykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHNldCBgXCIgKyBrZXkgKyBcImAgbW9yZSB0aGFuIG9uY2VcIik7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5fb3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIGEgbG9naW4gYXR0ZW1wdCBzdWNjZWVkcy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGxvZ2luIGlzIHN1Y2Nlc3NmdWwuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGNhbGxiYWNrIHJlY2VpdmVzIGEgc2luZ2xlIG9iamVjdCB0aGF0XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgaG9sZHMgbG9naW4gZGV0YWlscy4gVGhpcyBvYmplY3QgY29udGFpbnMgdGhlIGxvZ2luXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0IHR5cGUgKHBhc3N3b3JkLCByZXN1bWUsIGV0Yy4pIG9uIGJvdGggdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50IGFuZCBzZXJ2ZXIuIGBvbkxvZ2luYCBjYWxsYmFja3MgcmVnaXN0ZXJlZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIG9uIHRoZSBzZXJ2ZXIgYWxzbyByZWNlaXZlIGV4dHJhIGRhdGEsIHN1Y2hcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBhcyB1c2VyIGRldGFpbHMsIGNvbm5lY3Rpb24gaW5mb3JtYXRpb24sIGV0Yy5cbiAgICovXG4gIG9uTG9naW4oZnVuYykge1xuICAgIHJldHVybiB0aGlzLl9vbkxvZ2luSG9vay5yZWdpc3RlcihmdW5jKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciBhIGxvZ2luIGF0dGVtcHQgZmFpbHMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGxvZ2luIGhhcyBmYWlsZWQuXG4gICAqL1xuICBvbkxvZ2luRmFpbHVyZShmdW5jKSB7XG4gICAgcmV0dXJuIHRoaXMuX29uTG9naW5GYWlsdXJlSG9vay5yZWdpc3RlcihmdW5jKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciBhIGxvZ291dCBhdHRlbXB0IHN1Y2NlZWRzLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gbG9nb3V0IGlzIHN1Y2Nlc3NmdWwuXG4gICAqL1xuICBvbkxvZ291dChmdW5jKSB7XG4gICAgcmV0dXJuIHRoaXMuX29uTG9nb3V0SG9vay5yZWdpc3RlcihmdW5jKTtcbiAgfVxuXG4gIF9pbml0Q29ubmVjdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKCEgTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGhlIGNvbm5lY3Rpb24gdXNlZCBieSB0aGUgQWNjb3VudHMgc3lzdGVtLiBUaGlzIGlzIHRoZSBjb25uZWN0aW9uXG4gICAgLy8gdGhhdCB3aWxsIGdldCBsb2dnZWQgaW4gYnkgTWV0ZW9yLmxvZ2luKCksIGFuZCB0aGlzIGlzIHRoZVxuICAgIC8vIGNvbm5lY3Rpb24gd2hvc2UgbG9naW4gc3RhdGUgd2lsbCBiZSByZWZsZWN0ZWQgYnkgTWV0ZW9yLnVzZXJJZCgpLlxuICAgIC8vXG4gICAgLy8gSXQgd291bGQgYmUgbXVjaCBwcmVmZXJhYmxlIGZvciB0aGlzIHRvIGJlIGluIGFjY291bnRzX2NsaWVudC5qcyxcbiAgICAvLyBidXQgaXQgaGFzIHRvIGJlIGhlcmUgYmVjYXVzZSBpdCdzIG5lZWRlZCB0byBjcmVhdGUgdGhlXG4gICAgLy8gTWV0ZW9yLnVzZXJzIGNvbGxlY3Rpb24uXG5cbiAgICBpZiAob3B0aW9ucy5jb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLmNvbm5lY3Rpb24gPSBvcHRpb25zLmNvbm5lY3Rpb247XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmRkcFVybCkge1xuICAgICAgdGhpcy5jb25uZWN0aW9uID0gRERQLmNvbm5lY3Qob3B0aW9ucy5kZHBVcmwpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uQUNDT1VOVFNfQ09OTkVDVElPTl9VUkwpIHtcbiAgICAgIC8vIFRlbXBvcmFyeSwgaW50ZXJuYWwgaG9vayB0byBhbGxvdyB0aGUgc2VydmVyIHRvIHBvaW50IHRoZSBjbGllbnRcbiAgICAgIC8vIHRvIGEgZGlmZmVyZW50IGF1dGhlbnRpY2F0aW9uIHNlcnZlci4gVGhpcyBpcyBmb3IgYSB2ZXJ5XG4gICAgICAvLyBwYXJ0aWN1bGFyIHVzZSBjYXNlIHRoYXQgY29tZXMgdXAgd2hlbiBpbXBsZW1lbnRpbmcgYSBvYXV0aFxuICAgICAgLy8gc2VydmVyLiBVbnN1cHBvcnRlZCBhbmQgbWF5IGdvIGF3YXkgYXQgYW55IHBvaW50IGluIHRpbWUuXG4gICAgICAvL1xuICAgICAgLy8gV2Ugd2lsbCBldmVudHVhbGx5IHByb3ZpZGUgYSBnZW5lcmFsIHdheSB0byB1c2UgYWNjb3VudC1iYXNlXG4gICAgICAvLyBhZ2FpbnN0IGFueSBERFAgY29ubmVjdGlvbiwgbm90IGp1c3Qgb25lIHNwZWNpYWwgb25lLlxuICAgICAgdGhpcy5jb25uZWN0aW9uID1cbiAgICAgICAgRERQLmNvbm5lY3QoX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5BQ0NPVU5UU19DT05ORUNUSU9OX1VSTCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29ubmVjdGlvbiA9IE1ldGVvci5jb25uZWN0aW9uO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRUb2tlbkxpZmV0aW1lTXMoKSB7XG4gICAgLy8gV2hlbiBsb2dpbkV4cGlyYXRpb25JbkRheXMgaXMgc2V0IHRvIG51bGwsIHdlJ2xsIHVzZSBhIHJlYWxseSBoaWdoXG4gICAgLy8gbnVtYmVyIG9mIGRheXMgKExPR0lOX1VORVhQSVJBQkxFX1RPS0VOX0RBWVMpIHRvIHNpbXVsYXRlIGFuXG4gICAgLy8gdW5leHBpcmluZyB0b2tlbi5cbiAgICBjb25zdCBsb2dpbkV4cGlyYXRpb25JbkRheXMgPVxuICAgICAgKHRoaXMuX29wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzID09PSBudWxsKVxuICAgICAgICA/IExPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZU1xuICAgICAgICA6IHRoaXMuX29wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzO1xuICAgIHJldHVybiAobG9naW5FeHBpcmF0aW9uSW5EYXlzXG4gICAgICAgIHx8IERFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTKSAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG4gIH1cblxuICBfZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICByZXR1cm4gKHRoaXMuX29wdGlvbnMucGFzc3dvcmRSZXNldFRva2VuRXhwaXJhdGlvbkluRGF5cyB8fFxuICAgICAgICAgICAgREVGQVVMVF9QQVNTV09SRF9SRVNFVF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMpICogMjQgKiA2MCAqIDYwICogMTAwMDtcbiAgfVxuXG4gIF9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICByZXR1cm4gKHRoaXMuX29wdGlvbnMucGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb25JbkRheXMgfHxcbiAgICAgICAgREVGQVVMVF9QQVNTV09SRF9FTlJPTExfVE9LRU5fRVhQSVJBVElPTl9EQVlTKSAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG4gIH1cblxuICBfdG9rZW5FeHBpcmF0aW9uKHdoZW4pIHtcbiAgICAvLyBXZSBwYXNzIHdoZW4gdGhyb3VnaCB0aGUgRGF0ZSBjb25zdHJ1Y3RvciBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHk7XG4gICAgLy8gYHdoZW5gIHVzZWQgdG8gYmUgYSBudW1iZXIuXG4gICAgcmV0dXJuIG5ldyBEYXRlKChuZXcgRGF0ZSh3aGVuKSkuZ2V0VGltZSgpICsgdGhpcy5fZ2V0VG9rZW5MaWZldGltZU1zKCkpO1xuICB9XG5cbiAgX3Rva2VuRXhwaXJlc1Nvb24od2hlbikge1xuICAgIHZhciBtaW5MaWZldGltZU1zID0gLjEgKiB0aGlzLl9nZXRUb2tlbkxpZmV0aW1lTXMoKTtcbiAgICB2YXIgbWluTGlmZXRpbWVDYXBNcyA9IE1JTl9UT0tFTl9MSUZFVElNRV9DQVBfU0VDUyAqIDEwMDA7XG4gICAgaWYgKG1pbkxpZmV0aW1lTXMgPiBtaW5MaWZldGltZUNhcE1zKVxuICAgICAgbWluTGlmZXRpbWVNcyA9IG1pbkxpZmV0aW1lQ2FwTXM7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkgPiAobmV3IERhdGUod2hlbikgLSBtaW5MaWZldGltZU1zKTtcbiAgfVxufVxuXG52YXIgQXAgPSBBY2NvdW50c0NvbW1vbi5wcm90b3R5cGU7XG5cbi8vIE5vdGUgdGhhdCBBY2NvdW50cyBpcyBkZWZpbmVkIHNlcGFyYXRlbHkgaW4gYWNjb3VudHNfY2xpZW50LmpzIGFuZFxuLy8gYWNjb3VudHNfc2VydmVyLmpzLlxuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0aGUgY3VycmVudCB1c2VyIGlkLCBvciBgbnVsbGAgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4uIEEgcmVhY3RpdmUgZGF0YSBzb3VyY2UuXG4gKiBAbG9jdXMgQW55d2hlcmUgYnV0IHB1Ymxpc2ggZnVuY3Rpb25zXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gKi9cbk1ldGVvci51c2VySWQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBBY2NvdW50cy51c2VySWQoKTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgR2V0IHRoZSBjdXJyZW50IHVzZXIgcmVjb3JkLCBvciBgbnVsbGAgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4uIEEgcmVhY3RpdmUgZGF0YSBzb3VyY2UuXG4gKiBAbG9jdXMgQW55d2hlcmUgYnV0IHB1Ymxpc2ggZnVuY3Rpb25zXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gKi9cbk1ldGVvci51c2VyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gQWNjb3VudHMudXNlcigpO1xufTtcblxuLy8gaG93IGxvbmcgKGluIGRheXMpIHVudGlsIGEgbG9naW4gdG9rZW4gZXhwaXJlc1xuY29uc3QgREVGQVVMVF9MT0dJTl9FWFBJUkFUSU9OX0RBWVMgPSA5MDtcbi8vIEV4cG9zZSBmb3IgdGVzdGluZy5cbkFwLkRFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTID0gREVGQVVMVF9MT0dJTl9FWFBJUkFUSU9OX0RBWVM7XG5cbi8vIGhvdyBsb25nIChpbiBkYXlzKSB1bnRpbCByZXNldCBwYXNzd29yZCB0b2tlbiBleHBpcmVzXG52YXIgREVGQVVMVF9QQVNTV09SRF9SRVNFVF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMgPSAzO1xuLy8gaG93IGxvbmcgKGluIGRheXMpIHVudGlsIGVucm9sIHBhc3N3b3JkIHRva2VuIGV4cGlyZXNcbnZhciBERUZBVUxUX1BBU1NXT1JEX0VOUk9MTF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMgPSAzMDtcbi8vIENsaWVudHMgZG9uJ3QgdHJ5IHRvIGF1dG8tbG9naW4gd2l0aCBhIHRva2VuIHRoYXQgaXMgZ29pbmcgdG8gZXhwaXJlIHdpdGhpblxuLy8gLjEgKiBERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUywgY2FwcGVkIGF0IE1JTl9UT0tFTl9MSUZFVElNRV9DQVBfU0VDUy5cbi8vIFRyaWVzIHRvIGF2b2lkIGFicnVwdCBkaXNjb25uZWN0cyBmcm9tIGV4cGlyaW5nIHRva2Vucy5cbnZhciBNSU5fVE9LRU5fTElGRVRJTUVfQ0FQX1NFQ1MgPSAzNjAwOyAvLyBvbmUgaG91clxuLy8gaG93IG9mdGVuIChpbiBtaWxsaXNlY29uZHMpIHdlIGNoZWNrIGZvciBleHBpcmVkIHRva2Vuc1xuRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyA9IDYwMCAqIDEwMDA7IC8vIDEwIG1pbnV0ZXNcbi8vIGhvdyBsb25nIHdlIHdhaXQgYmVmb3JlIGxvZ2dpbmcgb3V0IGNsaWVudHMgd2hlbiBNZXRlb3IubG9nb3V0T3RoZXJDbGllbnRzIGlzXG4vLyBjYWxsZWRcbkNPTk5FQ1RJT05fQ0xPU0VfREVMQVlfTVMgPSAxMCAqIDEwMDA7XG5cbi8vIEEgbGFyZ2UgbnVtYmVyIG9mIGV4cGlyYXRpb24gZGF5cyAoYXBwcm94aW1hdGVseSAxMDAgeWVhcnMgd29ydGgpIHRoYXQgaXNcbi8vIHVzZWQgd2hlbiBjcmVhdGluZyB1bmV4cGlyaW5nIHRva2Vucy5cbmNvbnN0IExPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZUyA9IDM2NSAqIDEwMDtcbi8vIEV4cG9zZSBmb3IgdGVzdGluZy5cbkFwLkxPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZUyA9IExPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZUztcblxuLy8gbG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiBhbmQgQ29uZmlnRXJyb3IgYXJlIG1haW50YWluZWQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbiAoKSB7XG4gIHZhciBTZXJ2aWNlQ29uZmlndXJhdGlvbiA9XG4gICAgUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ10uU2VydmljZUNvbmZpZ3VyYXRpb247XG4gIEFwLmxvZ2luU2VydmljZUNvbmZpZ3VyYXRpb24gPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucztcbiAgQXAuQ29uZmlnRXJyb3IgPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5Db25maWdFcnJvcjtcbn0pO1xuXG4vLyBUaHJvd24gd2hlbiB0aGUgdXNlciBjYW5jZWxzIHRoZSBsb2dpbiBwcm9jZXNzIChlZywgY2xvc2VzIGFuIG9hdXRoXG4vLyBwb3B1cCwgZGVjbGluZXMgcmV0aW5hIHNjYW4sIGV0YylcbnZhciBsY2VOYW1lID0gJ0FjY291bnRzLkxvZ2luQ2FuY2VsbGVkRXJyb3InO1xuQXAuTG9naW5DYW5jZWxsZWRFcnJvciA9IE1ldGVvci5tYWtlRXJyb3JUeXBlKFxuICBsY2VOYW1lLFxuICBmdW5jdGlvbiAoZGVzY3JpcHRpb24pIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBkZXNjcmlwdGlvbjtcbiAgfVxuKTtcbkFwLkxvZ2luQ2FuY2VsbGVkRXJyb3IucHJvdG90eXBlLm5hbWUgPSBsY2VOYW1lO1xuXG4vLyBUaGlzIGlzIHVzZWQgdG8gdHJhbnNtaXQgc3BlY2lmaWMgc3ViY2xhc3MgZXJyb3JzIG92ZXIgdGhlIHdpcmUuIFdlIHNob3VsZFxuLy8gY29tZSB1cCB3aXRoIGEgbW9yZSBnZW5lcmljIHdheSB0byBkbyB0aGlzIChlZywgd2l0aCBzb21lIHNvcnQgb2Ygc3ltYm9saWNcbi8vIGVycm9yIGNvZGUgcmF0aGVyIHRoYW4gYSBudW1iZXIpLlxuQXAuTG9naW5DYW5jZWxsZWRFcnJvci5udW1lcmljRXJyb3IgPSAweDhhY2RjMmY7XG4iLCJpbXBvcnQge0FjY291bnRzQ29tbW9ufSBmcm9tIFwiLi9hY2NvdW50c19jb21tb24uanNcIjtcblxudmFyIEFwID0gQWNjb3VudHNDb21tb24ucHJvdG90eXBlO1xudmFyIGRlZmF1bHRSYXRlTGltaXRlclJ1bGVJZDtcbi8vIFJlbW92ZXMgZGVmYXVsdCByYXRlIGxpbWl0aW5nIHJ1bGVcbkFwLnJlbW92ZURlZmF1bHRSYXRlTGltaXQgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHJlc3AgPSBERFBSYXRlTGltaXRlci5yZW1vdmVSdWxlKGRlZmF1bHRSYXRlTGltaXRlclJ1bGVJZCk7XG4gIGRlZmF1bHRSYXRlTGltaXRlclJ1bGVJZCA9IG51bGw7XG4gIHJldHVybiByZXNwO1xufTtcblxuLy8gQWRkIGEgZGVmYXVsdCBydWxlIG9mIGxpbWl0aW5nIGxvZ2lucywgY3JlYXRpbmcgbmV3IHVzZXJzIGFuZCBwYXNzd29yZCByZXNldFxuLy8gdG8gNSB0aW1lcyBldmVyeSAxMCBzZWNvbmRzIHBlciBjb25uZWN0aW9uLlxuQXAuYWRkRGVmYXVsdFJhdGVMaW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCFkZWZhdWx0UmF0ZUxpbWl0ZXJSdWxlSWQpIHtcbiAgICBkZWZhdWx0UmF0ZUxpbWl0ZXJSdWxlSWQgPSBERFBSYXRlTGltaXRlci5hZGRSdWxlKHtcbiAgICAgIHVzZXJJZDogbnVsbCxcbiAgICAgIGNsaWVudEFkZHJlc3M6IG51bGwsXG4gICAgICB0eXBlOiAnbWV0aG9kJyxcbiAgICAgIG5hbWU6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBfLmNvbnRhaW5zKFsnbG9naW4nLCAnY3JlYXRlVXNlcicsICdyZXNldFBhc3N3b3JkJyxcbiAgICAgICAgICAnZm9yZ290UGFzc3dvcmQnXSwgbmFtZSk7XG4gICAgICB9LFxuICAgICAgY29ubmVjdGlvbklkOiBmdW5jdGlvbiAoY29ubmVjdGlvbklkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0sIDUsIDEwMDAwKTtcbiAgfVxufTtcblxuQXAuYWRkRGVmYXVsdFJhdGVMaW1pdCgpO1xuIiwidmFyIGNyeXB0byA9IE5wbS5yZXF1aXJlKCdjcnlwdG8nKTtcblxuaW1wb3J0IHtBY2NvdW50c0NvbW1vbn0gZnJvbSBcIi4vYWNjb3VudHNfY29tbW9uLmpzXCI7XG5cbi8qKlxuICogQHN1bW1hcnkgQ29uc3RydWN0b3IgZm9yIHRoZSBgQWNjb3VudHNgIG5hbWVzcGFjZSBvbiB0aGUgc2VydmVyLlxuICogQGxvY3VzIFNlcnZlclxuICogQGNsYXNzIEFjY291bnRzU2VydmVyXG4gKiBAZXh0ZW5kcyBBY2NvdW50c0NvbW1vblxuICogQGluc3RhbmNlbmFtZSBhY2NvdW50c1NlcnZlclxuICogQHBhcmFtIHtPYmplY3R9IHNlcnZlciBBIHNlcnZlciBvYmplY3Qgc3VjaCBhcyBgTWV0ZW9yLnNlcnZlcmAuXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2NvdW50c1NlcnZlciBleHRlbmRzIEFjY291bnRzQ29tbW9uIHtcbiAgLy8gTm90ZSB0aGF0IHRoaXMgY29uc3RydWN0b3IgaXMgbGVzcyBsaWtlbHkgdG8gYmUgaW5zdGFudGlhdGVkIG11bHRpcGxlXG4gIC8vIHRpbWVzIHRoYW4gdGhlIGBBY2NvdW50c0NsaWVudGAgY29uc3RydWN0b3IsIGJlY2F1c2UgYSBzaW5nbGUgc2VydmVyXG4gIC8vIGNhbiBwcm92aWRlIG9ubHkgb25lIHNldCBvZiBtZXRob2RzLlxuICBjb25zdHJ1Y3RvcihzZXJ2ZXIpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fc2VydmVyID0gc2VydmVyIHx8IE1ldGVvci5zZXJ2ZXI7XG4gICAgLy8gU2V0IHVwIHRoZSBzZXJ2ZXIncyBtZXRob2RzLCBhcyBpZiBieSBjYWxsaW5nIE1ldGVvci5tZXRob2RzLlxuICAgIHRoaXMuX2luaXRTZXJ2ZXJNZXRob2RzKCk7XG5cbiAgICB0aGlzLl9pbml0QWNjb3VudERhdGFIb29rcygpO1xuXG4gICAgLy8gSWYgYXV0b3B1Ymxpc2ggaXMgb24sIHB1Ymxpc2ggdGhlc2UgdXNlciBmaWVsZHMuIExvZ2luIHNlcnZpY2VcbiAgICAvLyBwYWNrYWdlcyAoZWcgYWNjb3VudHMtZ29vZ2xlKSBhZGQgdG8gdGhlc2UgYnkgY2FsbGluZ1xuICAgIC8vIGFkZEF1dG9wdWJsaXNoRmllbGRzLiAgTm90YWJseSwgdGhpcyBpc24ndCBpbXBsZW1lbnRlZCB3aXRoIG11bHRpcGxlXG4gICAgLy8gcHVibGlzaGVzIHNpbmNlIEREUCBvbmx5IG1lcmdlcyBvbmx5IGFjcm9zcyB0b3AtbGV2ZWwgZmllbGRzLCBub3RcbiAgICAvLyBzdWJmaWVsZHMgKHN1Y2ggYXMgJ3NlcnZpY2VzLmZhY2Vib29rLmFjY2Vzc1Rva2VuJylcbiAgICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcyA9IHtcbiAgICAgIGxvZ2dlZEluVXNlcjogWydwcm9maWxlJywgJ3VzZXJuYW1lJywgJ2VtYWlscyddLFxuICAgICAgb3RoZXJVc2VyczogWydwcm9maWxlJywgJ3VzZXJuYW1lJ11cbiAgICB9O1xuICAgIHRoaXMuX2luaXRTZXJ2ZXJQdWJsaWNhdGlvbnMoKTtcblxuICAgIC8vIGNvbm5lY3Rpb25JZCAtPiB7Y29ubmVjdGlvbiwgbG9naW5Ub2tlbn1cbiAgICB0aGlzLl9hY2NvdW50RGF0YSA9IHt9O1xuXG4gICAgLy8gY29ubmVjdGlvbiBpZCAtPiBvYnNlcnZlIGhhbmRsZSBmb3IgdGhlIGxvZ2luIHRva2VuIHRoYXQgdGhpcyBjb25uZWN0aW9uIGlzXG4gICAgLy8gY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCwgb3IgYSBudW1iZXIuIFRoZSBudW1iZXIgaW5kaWNhdGVzIHRoYXQgd2UgYXJlIGluXG4gICAgLy8gdGhlIHByb2Nlc3Mgb2Ygc2V0dGluZyB1cCB0aGUgb2JzZXJ2ZSAodXNpbmcgYSBudW1iZXIgaW5zdGVhZCBvZiBhIHNpbmdsZVxuICAgIC8vIHNlbnRpbmVsIGFsbG93cyBtdWx0aXBsZSBhdHRlbXB0cyB0byBzZXQgdXAgdGhlIG9ic2VydmUgdG8gaWRlbnRpZnkgd2hpY2hcbiAgICAvLyBvbmUgd2FzIHRoZWlycykuXG4gICAgdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9uZXh0VXNlck9ic2VydmVOdW1iZXIgPSAxOyAgLy8gZm9yIHRoZSBudW1iZXIgZGVzY3JpYmVkIGFib3ZlLlxuXG4gICAgLy8gbGlzdCBvZiBhbGwgcmVnaXN0ZXJlZCBoYW5kbGVycy5cbiAgICB0aGlzLl9sb2dpbkhhbmRsZXJzID0gW107XG5cbiAgICBzZXR1cFVzZXJzQ29sbGVjdGlvbih0aGlzLnVzZXJzKTtcbiAgICBzZXR1cERlZmF1bHRMb2dpbkhhbmRsZXJzKHRoaXMpO1xuICAgIHNldEV4cGlyZVRva2Vuc0ludGVydmFsKHRoaXMpO1xuXG4gICAgdGhpcy5fdmFsaWRhdGVMb2dpbkhvb2sgPSBuZXcgSG9vayh7IGJpbmRFbnZpcm9ubWVudDogZmFsc2UgfSk7XG4gICAgdGhpcy5fdmFsaWRhdGVOZXdVc2VySG9va3MgPSBbXG4gICAgICBkZWZhdWx0VmFsaWRhdGVOZXdVc2VySG9vay5iaW5kKHRoaXMpXG4gICAgXTtcblxuICAgIHRoaXMuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yQWxsVXNlcnNPblN0YXJ0dXAoKTtcblxuICAgIHRoaXMuX3NraXBDYXNlSW5zZW5zaXRpdmVDaGVja3NGb3JUZXN0ID0ge307XG4gIH1cblxuICAvLy9cbiAgLy8vIENVUlJFTlQgVVNFUlxuICAvLy9cblxuICAvLyBAb3ZlcnJpZGUgb2YgXCJhYnN0cmFjdFwiIG5vbi1pbXBsZW1lbnRhdGlvbiBpbiBhY2NvdW50c19jb21tb24uanNcbiAgdXNlcklkKCkge1xuICAgIC8vIFRoaXMgZnVuY3Rpb24gb25seSB3b3JrcyBpZiBjYWxsZWQgaW5zaWRlIGEgbWV0aG9kIG9yIGEgcHViaWNhdGlvbi5cbiAgICAvLyBVc2luZyBhbnkgb2YgdGhlIGluZm9tYXRpb24gZnJvbSBNZXRlb3IudXNlcigpIGluIGEgbWV0aG9kIG9yXG4gICAgLy8gcHVibGlzaCBmdW5jdGlvbiB3aWxsIGFsd2F5cyB1c2UgdGhlIHZhbHVlIGZyb20gd2hlbiB0aGUgZnVuY3Rpb24gZmlyc3RcbiAgICAvLyBydW5zLiBUaGlzIGlzIGxpa2VseSBub3Qgd2hhdCB0aGUgdXNlciBleHBlY3RzLiBUaGUgd2F5IHRvIG1ha2UgdGhpcyB3b3JrXG4gICAgLy8gaW4gYSBtZXRob2Qgb3IgcHVibGlzaCBmdW5jdGlvbiBpcyB0byBkbyBNZXRlb3IuZmluZCh0aGlzLnVzZXJJZCkub2JzZXJ2ZVxuICAgIC8vIGFuZCByZWNvbXB1dGUgd2hlbiB0aGUgdXNlciByZWNvcmQgY2hhbmdlcy5cbiAgICBjb25zdCBjdXJyZW50SW52b2NhdGlvbiA9IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24uZ2V0KCkgfHwgRERQLl9DdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uLmdldCgpO1xuICAgIGlmICghY3VycmVudEludm9jYXRpb24pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRlb3IudXNlcklkIGNhbiBvbmx5IGJlIGludm9rZWQgaW4gbWV0aG9kIGNhbGxzIG9yIHB1YmxpY2F0aW9ucy5cIik7XG4gICAgcmV0dXJuIGN1cnJlbnRJbnZvY2F0aW9uLnVzZXJJZDtcbiAgfVxuXG4gIC8vL1xuICAvLy8gTE9HSU4gSE9PS1NcbiAgLy8vXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFZhbGlkYXRlIGxvZ2luIGF0dGVtcHRzLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGEgbG9naW4gaXMgYXR0ZW1wdGVkIChlaXRoZXIgc3VjY2Vzc2Z1bCBvciB1bnN1Y2Nlc3NmdWwpLiAgQSBsb2dpbiBjYW4gYmUgYWJvcnRlZCBieSByZXR1cm5pbmcgYSBmYWxzeSB2YWx1ZSBvciB0aHJvd2luZyBhbiBleGNlcHRpb24uXG4gICAqL1xuICB2YWxpZGF0ZUxvZ2luQXR0ZW1wdChmdW5jKSB7XG4gICAgLy8gRXhjZXB0aW9ucyBpbnNpZGUgdGhlIGhvb2sgY2FsbGJhY2sgYXJlIHBhc3NlZCB1cCB0byB1cy5cbiAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVMb2dpbkhvb2sucmVnaXN0ZXIoZnVuYyk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgU2V0IHJlc3RyaWN0aW9ucyBvbiBuZXcgdXNlciBjcmVhdGlvbi5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIENhbGxlZCB3aGVuZXZlciBhIG5ldyB1c2VyIGlzIGNyZWF0ZWQuIFRha2VzIHRoZSBuZXcgdXNlciBvYmplY3QsIGFuZCByZXR1cm5zIHRydWUgdG8gYWxsb3cgdGhlIGNyZWF0aW9uIG9yIGZhbHNlIHRvIGFib3J0LlxuICAgKi9cbiAgdmFsaWRhdGVOZXdVc2VyKGZ1bmMpIHtcbiAgICB0aGlzLl92YWxpZGF0ZU5ld1VzZXJIb29rcy5wdXNoKGZ1bmMpO1xuICB9XG5cbiAgLy8vXG4gIC8vLyBDUkVBVEUgVVNFUiBIT09LU1xuICAvLy9cblxuICAvKipcbiAgICogQHN1bW1hcnkgQ3VzdG9taXplIG5ldyB1c2VyIGNyZWF0aW9uLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGEgbmV3IHVzZXIgaXMgY3JlYXRlZC4gUmV0dXJuIHRoZSBuZXcgdXNlciBvYmplY3QsIG9yIHRocm93IGFuIGBFcnJvcmAgdG8gYWJvcnQgdGhlIGNyZWF0aW9uLlxuICAgKi9cbiAgb25DcmVhdGVVc2VyKGZ1bmMpIHtcbiAgICBpZiAodGhpcy5fb25DcmVhdGVVc2VySG9vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgY2FsbCBvbkNyZWF0ZVVzZXIgb25jZVwiKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vbkNyZWF0ZVVzZXJIb29rID0gZnVuYztcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDdXN0b21pemUgb2F1dGggdXNlciBwcm9maWxlIHVwZGF0ZXNcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIENhbGxlZCB3aGVuZXZlciBhIHVzZXIgaXMgbG9nZ2VkIGluIHZpYSBvYXV0aC4gUmV0dXJuIHRoZSBwcm9maWxlIG9iamVjdCB0byBiZSBtZXJnZWQsIG9yIHRocm93IGFuIGBFcnJvcmAgdG8gYWJvcnQgdGhlIGNyZWF0aW9uLlxuICAgKi9cbiAgb25FeHRlcm5hbExvZ2luKGZ1bmMpIHtcbiAgICBpZiAodGhpcy5fb25FeHRlcm5hbExvZ2luSG9vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgY2FsbCBvbkV4dGVybmFsTG9naW4gb25jZVwiKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vbkV4dGVybmFsTG9naW5Ib29rID0gZnVuYztcbiAgfVxuXG59O1xuXG52YXIgQXAgPSBBY2NvdW50c1NlcnZlci5wcm90b3R5cGU7XG5cbi8vIEdpdmUgZWFjaCBsb2dpbiBob29rIGNhbGxiYWNrIGEgZnJlc2ggY2xvbmVkIGNvcHkgb2YgdGhlIGF0dGVtcHRcbi8vIG9iamVjdCwgYnV0IGRvbid0IGNsb25lIHRoZSBjb25uZWN0aW9uLlxuLy9cbmZ1bmN0aW9uIGNsb25lQXR0ZW1wdFdpdGhDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGF0dGVtcHQpIHtcbiAgdmFyIGNsb25lZEF0dGVtcHQgPSBFSlNPTi5jbG9uZShhdHRlbXB0KTtcbiAgY2xvbmVkQXR0ZW1wdC5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgcmV0dXJuIGNsb25lZEF0dGVtcHQ7XG59XG5cbkFwLl92YWxpZGF0ZUxvZ2luID0gZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGF0dGVtcHQpIHtcbiAgdGhpcy5fdmFsaWRhdGVMb2dpbkhvb2suZWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgcmV0O1xuICAgIHRyeSB7XG4gICAgICByZXQgPSBjYWxsYmFjayhjbG9uZUF0dGVtcHRXaXRoQ29ubmVjdGlvbihjb25uZWN0aW9uLCBhdHRlbXB0KSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBhdHRlbXB0LmFsbG93ZWQgPSBmYWxzZTtcbiAgICAgIC8vIFhYWCB0aGlzIG1lYW5zIHRoZSBsYXN0IHRocm93biBlcnJvciBvdmVycmlkZXMgcHJldmlvdXMgZXJyb3JcbiAgICAgIC8vIG1lc3NhZ2VzLiBNYXliZSB0aGlzIGlzIHN1cnByaXNpbmcgdG8gdXNlcnMgYW5kIHdlIHNob3VsZCBtYWtlXG4gICAgICAvLyBvdmVycmlkaW5nIGVycm9ycyBtb3JlIGV4cGxpY2l0LiAoc2VlXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvMTk2MClcbiAgICAgIGF0dGVtcHQuZXJyb3IgPSBlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICghIHJldCkge1xuICAgICAgYXR0ZW1wdC5hbGxvd2VkID0gZmFsc2U7XG4gICAgICAvLyBkb24ndCBvdmVycmlkZSBhIHNwZWNpZmljIGVycm9yIHByb3ZpZGVkIGJ5IGEgcHJldmlvdXNcbiAgICAgIC8vIHZhbGlkYXRvciBvciB0aGUgaW5pdGlhbCBhdHRlbXB0IChlZyBcImluY29ycmVjdCBwYXNzd29yZFwiKS5cbiAgICAgIGlmICghYXR0ZW1wdC5lcnJvcilcbiAgICAgICAgYXR0ZW1wdC5lcnJvciA9IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIkxvZ2luIGZvcmJpZGRlblwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xufTtcblxuXG5BcC5fc3VjY2Vzc2Z1bExvZ2luID0gZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGF0dGVtcHQpIHtcbiAgdGhpcy5fb25Mb2dpbkhvb2suZWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayhjbG9uZUF0dGVtcHRXaXRoQ29ubmVjdGlvbihjb25uZWN0aW9uLCBhdHRlbXB0KSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xufTtcblxuQXAuX2ZhaWxlZExvZ2luID0gZnVuY3Rpb24gKGNvbm5lY3Rpb24sIGF0dGVtcHQpIHtcbiAgdGhpcy5fb25Mb2dpbkZhaWx1cmVIb29rLmVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2soY2xvbmVBdHRlbXB0V2l0aENvbm5lY3Rpb24oY29ubmVjdGlvbiwgYXR0ZW1wdCkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn07XG5cbkFwLl9zdWNjZXNzZnVsTG9nb3V0ID0gZnVuY3Rpb24gKGNvbm5lY3Rpb24sIHVzZXJJZCkge1xuICBjb25zdCB1c2VyID0gdXNlcklkICYmIHRoaXMudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICB0aGlzLl9vbkxvZ291dEhvb2suZWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayh7IHVzZXIsIGNvbm5lY3Rpb24gfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xufTtcblxuLy8vXG4vLy8gTE9HSU4gTUVUSE9EU1xuLy8vXG5cbi8vIExvZ2luIG1ldGhvZHMgcmV0dXJuIHRvIHRoZSBjbGllbnQgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlc2Vcbi8vIGZpZWxkcyB3aGVuIHRoZSB1c2VyIHdhcyBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5OlxuLy9cbi8vICAgaWQ6IHVzZXJJZFxuLy8gICB0b2tlbjogKlxuLy8gICB0b2tlbkV4cGlyZXM6ICpcbi8vXG4vLyB0b2tlbkV4cGlyZXMgaXMgb3B0aW9uYWwgYW5kIGludGVuZHMgdG8gcHJvdmlkZSBhIGhpbnQgdG8gdGhlXG4vLyBjbGllbnQgYXMgdG8gd2hlbiB0aGUgdG9rZW4gd2lsbCBleHBpcmUuIElmIG5vdCBwcm92aWRlZCwgdGhlXG4vLyBjbGllbnQgd2lsbCBjYWxsIEFjY291bnRzLl90b2tlbkV4cGlyYXRpb24sIHBhc3NpbmcgaXQgdGhlIGRhdGVcbi8vIHRoYXQgaXQgcmVjZWl2ZWQgdGhlIHRva2VuLlxuLy9cbi8vIFRoZSBsb2dpbiBtZXRob2Qgd2lsbCB0aHJvdyBhbiBlcnJvciBiYWNrIHRvIHRoZSBjbGllbnQgaWYgdGhlIHVzZXJcbi8vIGZhaWxlZCB0byBsb2cgaW4uXG4vL1xuLy9cbi8vIExvZ2luIGhhbmRsZXJzIGFuZCBzZXJ2aWNlIHNwZWNpZmljIGxvZ2luIG1ldGhvZHMgc3VjaCBhc1xuLy8gYGNyZWF0ZVVzZXJgIGludGVybmFsbHkgcmV0dXJuIGEgYHJlc3VsdGAgb2JqZWN0IGNvbnRhaW5pbmcgdGhlc2Vcbi8vIGZpZWxkczpcbi8vXG4vLyAgIHR5cGU6XG4vLyAgICAgb3B0aW9uYWwgc3RyaW5nOyB0aGUgc2VydmljZSBuYW1lLCBvdmVycmlkZXMgdGhlIGhhbmRsZXJcbi8vICAgICBkZWZhdWx0IGlmIHByZXNlbnQuXG4vL1xuLy8gICBlcnJvcjpcbi8vICAgICBleGNlcHRpb247IGlmIHRoZSB1c2VyIGlzIG5vdCBhbGxvd2VkIHRvIGxvZ2luLCB0aGUgcmVhc29uIHdoeS5cbi8vXG4vLyAgIHVzZXJJZDpcbi8vICAgICBzdHJpbmc7IHRoZSB1c2VyIGlkIG9mIHRoZSB1c2VyIGF0dGVtcHRpbmcgdG8gbG9naW4gKGlmXG4vLyAgICAga25vd24pLCByZXF1aXJlZCBmb3IgYW4gYWxsb3dlZCBsb2dpbi5cbi8vXG4vLyAgIG9wdGlvbnM6XG4vLyAgICAgb3B0aW9uYWwgb2JqZWN0IG1lcmdlZCBpbnRvIHRoZSByZXN1bHQgcmV0dXJuZWQgYnkgdGhlIGxvZ2luXG4vLyAgICAgbWV0aG9kOyB1c2VkIGJ5IEhBTUsgZnJvbSBTUlAuXG4vL1xuLy8gICBzdGFtcGVkTG9naW5Ub2tlbjpcbi8vICAgICBvcHRpb25hbCBvYmplY3Qgd2l0aCBgdG9rZW5gIGFuZCBgd2hlbmAgaW5kaWNhdGluZyB0aGUgbG9naW5cbi8vICAgICB0b2tlbiBpcyBhbHJlYWR5IHByZXNlbnQgaW4gdGhlIGRhdGFiYXNlLCByZXR1cm5lZCBieSB0aGVcbi8vICAgICBcInJlc3VtZVwiIGxvZ2luIGhhbmRsZXIuXG4vL1xuLy8gRm9yIGNvbnZlbmllbmNlLCBsb2dpbiBtZXRob2RzIGNhbiBhbHNvIHRocm93IGFuIGV4Y2VwdGlvbiwgd2hpY2hcbi8vIGlzIGNvbnZlcnRlZCBpbnRvIGFuIHtlcnJvcn0gcmVzdWx0LiAgSG93ZXZlciwgaWYgdGhlIGlkIG9mIHRoZVxuLy8gdXNlciBhdHRlbXB0aW5nIHRoZSBsb2dpbiBpcyBrbm93biwgYSB7dXNlcklkLCBlcnJvcn0gcmVzdWx0IHNob3VsZFxuLy8gYmUgcmV0dXJuZWQgaW5zdGVhZCBzaW5jZSB0aGUgdXNlciBpZCBpcyBub3QgY2FwdHVyZWQgd2hlbiBhblxuLy8gZXhjZXB0aW9uIGlzIHRocm93bi5cbi8vXG4vLyBUaGlzIGludGVybmFsIGByZXN1bHRgIG9iamVjdCBpcyBhdXRvbWF0aWNhbGx5IGNvbnZlcnRlZCBpbnRvIHRoZVxuLy8gcHVibGljIHtpZCwgdG9rZW4sIHRva2VuRXhwaXJlc30gb2JqZWN0IHJldHVybmVkIHRvIHRoZSBjbGllbnQuXG5cblxuLy8gVHJ5IGEgbG9naW4gbWV0aG9kLCBjb252ZXJ0aW5nIHRocm93biBleGNlcHRpb25zIGludG8gYW4ge2Vycm9yfVxuLy8gcmVzdWx0LiAgVGhlIGB0eXBlYCBhcmd1bWVudCBpcyBhIGRlZmF1bHQsIGluc2VydGVkIGludG8gdGhlIHJlc3VsdFxuLy8gb2JqZWN0IGlmIG5vdCBleHBsaWNpdGx5IHJldHVybmVkLlxuLy9cbnZhciB0cnlMb2dpbk1ldGhvZCA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICB2YXIgcmVzdWx0O1xuICB0cnkge1xuICAgIHJlc3VsdCA9IGZuKCk7XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICByZXN1bHQgPSB7ZXJyb3I6IGV9O1xuICB9XG5cbiAgaWYgKHJlc3VsdCAmJiAhcmVzdWx0LnR5cGUgJiYgdHlwZSlcbiAgICByZXN1bHQudHlwZSA9IHR5cGU7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuLy8gTG9nIGluIGEgdXNlciBvbiBhIGNvbm5lY3Rpb24uXG4vL1xuLy8gV2UgdXNlIHRoZSBtZXRob2QgaW52b2NhdGlvbiB0byBzZXQgdGhlIHVzZXIgaWQgb24gdGhlIGNvbm5lY3Rpb24sXG4vLyBub3QgdGhlIGNvbm5lY3Rpb24gb2JqZWN0IGRpcmVjdGx5LiBzZXRVc2VySWQgaXMgdGllZCB0byBtZXRob2RzIHRvXG4vLyBlbmZvcmNlIGNsZWFyIG9yZGVyaW5nIG9mIG1ldGhvZCBhcHBsaWNhdGlvbiAodXNpbmcgd2FpdCBtZXRob2RzIG9uXG4vLyB0aGUgY2xpZW50LCBhbmQgYSBubyBzZXRVc2VySWQgYWZ0ZXIgdW5ibG9jayByZXN0cmljdGlvbiBvbiB0aGVcbi8vIHNlcnZlcilcbi8vXG4vLyBUaGUgYHN0YW1wZWRMb2dpblRva2VuYCBwYXJhbWV0ZXIgaXMgb3B0aW9uYWwuICBXaGVuIHByZXNlbnQsIGl0XG4vLyBpbmRpY2F0ZXMgdGhhdCB0aGUgbG9naW4gdG9rZW4gaGFzIGFscmVhZHkgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZVxuLy8gZGF0YWJhc2UgYW5kIGRvZXNuJ3QgbmVlZCB0byBiZSBpbnNlcnRlZCBhZ2Fpbi4gIChJdCdzIHVzZWQgYnkgdGhlXG4vLyBcInJlc3VtZVwiIGxvZ2luIGhhbmRsZXIpLlxuQXAuX2xvZ2luVXNlciA9IGZ1bmN0aW9uIChtZXRob2RJbnZvY2F0aW9uLCB1c2VySWQsIHN0YW1wZWRMb2dpblRva2VuKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoISBzdGFtcGVkTG9naW5Ub2tlbikge1xuICAgIHN0YW1wZWRMb2dpblRva2VuID0gc2VsZi5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICAgIHNlbGYuX2luc2VydExvZ2luVG9rZW4odXNlcklkLCBzdGFtcGVkTG9naW5Ub2tlbik7XG4gIH1cblxuICAvLyBUaGlzIG9yZGVyIChhbmQgdGhlIGF2b2lkYW5jZSBvZiB5aWVsZHMpIGlzIGltcG9ydGFudCB0byBtYWtlXG4gIC8vIHN1cmUgdGhhdCB3aGVuIHB1Ymxpc2ggZnVuY3Rpb25zIGFyZSByZXJ1biwgdGhleSBzZWUgYVxuICAvLyBjb25zaXN0ZW50IHZpZXcgb2YgdGhlIHdvcmxkOiB0aGUgdXNlcklkIGlzIHNldCBhbmQgbWF0Y2hlc1xuICAvLyB0aGUgbG9naW4gdG9rZW4gb24gdGhlIGNvbm5lY3Rpb24gKG5vdCB0aGF0IHRoZXJlIGlzXG4gIC8vIGN1cnJlbnRseSBhIHB1YmxpYyBBUEkgZm9yIHJlYWRpbmcgdGhlIGxvZ2luIHRva2VuIG9uIGFcbiAgLy8gY29ubmVjdGlvbikuXG4gIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLl9zZXRMb2dpblRva2VuKFxuICAgICAgdXNlcklkLFxuICAgICAgbWV0aG9kSW52b2NhdGlvbi5jb25uZWN0aW9uLFxuICAgICAgc2VsZi5faGFzaExvZ2luVG9rZW4oc3RhbXBlZExvZ2luVG9rZW4udG9rZW4pXG4gICAgKTtcbiAgfSk7XG5cbiAgbWV0aG9kSW52b2NhdGlvbi5zZXRVc2VySWQodXNlcklkKTtcblxuICByZXR1cm4ge1xuICAgIGlkOiB1c2VySWQsXG4gICAgdG9rZW46IHN0YW1wZWRMb2dpblRva2VuLnRva2VuLFxuICAgIHRva2VuRXhwaXJlczogc2VsZi5fdG9rZW5FeHBpcmF0aW9uKHN0YW1wZWRMb2dpblRva2VuLndoZW4pXG4gIH07XG59O1xuXG5cbi8vIEFmdGVyIGEgbG9naW4gbWV0aG9kIGhhcyBjb21wbGV0ZWQsIGNhbGwgdGhlIGxvZ2luIGhvb2tzLiAgTm90ZVxuLy8gdGhhdCBgYXR0ZW1wdExvZ2luYCBpcyBjYWxsZWQgZm9yICphbGwqIGxvZ2luIGF0dGVtcHRzLCBldmVuIG9uZXNcbi8vIHdoaWNoIGFyZW4ndCBzdWNjZXNzZnVsIChzdWNoIGFzIGFuIGludmFsaWQgcGFzc3dvcmQsIGV0YykuXG4vL1xuLy8gSWYgdGhlIGxvZ2luIGlzIGFsbG93ZWQgYW5kIGlzbid0IGFib3J0ZWQgYnkgYSB2YWxpZGF0ZSBsb2dpbiBob29rXG4vLyBjYWxsYmFjaywgbG9nIGluIHRoZSB1c2VyLlxuLy9cbkFwLl9hdHRlbXB0TG9naW4gPSBmdW5jdGlvbiAoXG4gIG1ldGhvZEludm9jYXRpb24sXG4gIG1ldGhvZE5hbWUsXG4gIG1ldGhvZEFyZ3MsXG4gIHJlc3VsdFxuKSB7XG4gIGlmICghcmVzdWx0KVxuICAgIHRocm93IG5ldyBFcnJvcihcInJlc3VsdCBpcyByZXF1aXJlZFwiKTtcblxuICAvLyBYWFggQSBwcm9ncmFtbWluZyBlcnJvciBpbiBhIGxvZ2luIGhhbmRsZXIgY2FuIGxlYWQgdG8gdGhpcyBvY2N1cmluZywgYW5kXG4gIC8vIHRoZW4gd2UgZG9uJ3QgY2FsbCBvbkxvZ2luIG9yIG9uTG9naW5GYWlsdXJlIGNhbGxiYWNrcy4gU2hvdWxkXG4gIC8vIHRyeUxvZ2luTWV0aG9kIGNhdGNoIHRoaXMgY2FzZSBhbmQgdHVybiBpdCBpbnRvIGFuIGVycm9yP1xuICBpZiAoIXJlc3VsdC51c2VySWQgJiYgIXJlc3VsdC5lcnJvcilcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIGxvZ2luIG1ldGhvZCBtdXN0IHNwZWNpZnkgYSB1c2VySWQgb3IgYW4gZXJyb3JcIik7XG5cbiAgdmFyIHVzZXI7XG4gIGlmIChyZXN1bHQudXNlcklkKVxuICAgIHVzZXIgPSB0aGlzLnVzZXJzLmZpbmRPbmUocmVzdWx0LnVzZXJJZCk7XG5cbiAgdmFyIGF0dGVtcHQgPSB7XG4gICAgdHlwZTogcmVzdWx0LnR5cGUgfHwgXCJ1bmtub3duXCIsXG4gICAgYWxsb3dlZDogISEgKHJlc3VsdC51c2VySWQgJiYgIXJlc3VsdC5lcnJvciksXG4gICAgbWV0aG9kTmFtZTogbWV0aG9kTmFtZSxcbiAgICBtZXRob2RBcmd1bWVudHM6IF8udG9BcnJheShtZXRob2RBcmdzKVxuICB9O1xuICBpZiAocmVzdWx0LmVycm9yKVxuICAgIGF0dGVtcHQuZXJyb3IgPSByZXN1bHQuZXJyb3I7XG4gIGlmICh1c2VyKVxuICAgIGF0dGVtcHQudXNlciA9IHVzZXI7XG5cbiAgLy8gX3ZhbGlkYXRlTG9naW4gbWF5IG11dGF0ZSBgYXR0ZW1wdGAgYnkgYWRkaW5nIGFuIGVycm9yIGFuZCBjaGFuZ2luZyBhbGxvd2VkXG4gIC8vIHRvIGZhbHNlLCBidXQgdGhhdCdzIHRoZSBvbmx5IGNoYW5nZSBpdCBjYW4gbWFrZSAoYW5kIHRoZSB1c2VyJ3MgY2FsbGJhY2tzXG4gIC8vIG9ubHkgZ2V0IGEgY2xvbmUgb2YgYGF0dGVtcHRgKS5cbiAgdGhpcy5fdmFsaWRhdGVMb2dpbihtZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb24sIGF0dGVtcHQpO1xuXG4gIGlmIChhdHRlbXB0LmFsbG93ZWQpIHtcbiAgICB2YXIgcmV0ID0gXy5leHRlbmQoXG4gICAgICB0aGlzLl9sb2dpblVzZXIoXG4gICAgICAgIG1ldGhvZEludm9jYXRpb24sXG4gICAgICAgIHJlc3VsdC51c2VySWQsXG4gICAgICAgIHJlc3VsdC5zdGFtcGVkTG9naW5Ub2tlblxuICAgICAgKSxcbiAgICAgIHJlc3VsdC5vcHRpb25zIHx8IHt9XG4gICAgKTtcbiAgICByZXQudHlwZSA9IGF0dGVtcHQudHlwZTtcbiAgICB0aGlzLl9zdWNjZXNzZnVsTG9naW4obWV0aG9kSW52b2NhdGlvbi5jb25uZWN0aW9uLCBhdHRlbXB0KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuX2ZhaWxlZExvZ2luKG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbiwgYXR0ZW1wdCk7XG4gICAgdGhyb3cgYXR0ZW1wdC5lcnJvcjtcbiAgfVxufTtcblxuXG4vLyBBbGwgc2VydmljZSBzcGVjaWZpYyBsb2dpbiBtZXRob2RzIHNob3VsZCBnbyB0aHJvdWdoIHRoaXMgZnVuY3Rpb24uXG4vLyBFbnN1cmUgdGhhdCB0aHJvd24gZXhjZXB0aW9ucyBhcmUgY2F1Z2h0IGFuZCB0aGF0IGxvZ2luIGhvb2tcbi8vIGNhbGxiYWNrcyBhcmUgc3RpbGwgY2FsbGVkLlxuLy9cbkFwLl9sb2dpbk1ldGhvZCA9IGZ1bmN0aW9uIChcbiAgbWV0aG9kSW52b2NhdGlvbixcbiAgbWV0aG9kTmFtZSxcbiAgbWV0aG9kQXJncyxcbiAgdHlwZSxcbiAgZm5cbikge1xuICByZXR1cm4gdGhpcy5fYXR0ZW1wdExvZ2luKFxuICAgIG1ldGhvZEludm9jYXRpb24sXG4gICAgbWV0aG9kTmFtZSxcbiAgICBtZXRob2RBcmdzLFxuICAgIHRyeUxvZ2luTWV0aG9kKHR5cGUsIGZuKVxuICApO1xufTtcblxuXG4vLyBSZXBvcnQgYSBsb2dpbiBhdHRlbXB0IGZhaWxlZCBvdXRzaWRlIHRoZSBjb250ZXh0IG9mIGEgbm9ybWFsIGxvZ2luXG4vLyBtZXRob2QuIFRoaXMgaXMgZm9yIHVzZSBpbiB0aGUgY2FzZSB3aGVyZSB0aGVyZSBpcyBhIG11bHRpLXN0ZXAgbG9naW5cbi8vIHByb2NlZHVyZSAoZWcgU1JQIGJhc2VkIHBhc3N3b3JkIGxvZ2luKS4gSWYgYSBtZXRob2QgZWFybHkgaW4gdGhlXG4vLyBjaGFpbiBmYWlscywgaXQgc2hvdWxkIGNhbGwgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgYSBmYWlsdXJlLiBUaGVyZVxuLy8gaXMgbm8gY29ycmVzcG9uZGluZyBtZXRob2QgZm9yIGEgc3VjY2Vzc2Z1bCBsb2dpbjsgbWV0aG9kcyB0aGF0IGNhblxuLy8gc3VjY2VlZCBhdCBsb2dnaW5nIGEgdXNlciBpbiBzaG91bGQgYWx3YXlzIGJlIGFjdHVhbCBsb2dpbiBtZXRob2RzXG4vLyAodXNpbmcgZWl0aGVyIEFjY291bnRzLl9sb2dpbk1ldGhvZCBvciBBY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcikuXG5BcC5fcmVwb3J0TG9naW5GYWlsdXJlID0gZnVuY3Rpb24gKFxuICBtZXRob2RJbnZvY2F0aW9uLFxuICBtZXRob2ROYW1lLFxuICBtZXRob2RBcmdzLFxuICByZXN1bHRcbikge1xuICB2YXIgYXR0ZW1wdCA9IHtcbiAgICB0eXBlOiByZXN1bHQudHlwZSB8fCBcInVua25vd25cIixcbiAgICBhbGxvd2VkOiBmYWxzZSxcbiAgICBlcnJvcjogcmVzdWx0LmVycm9yLFxuICAgIG1ldGhvZE5hbWU6IG1ldGhvZE5hbWUsXG4gICAgbWV0aG9kQXJndW1lbnRzOiBfLnRvQXJyYXkobWV0aG9kQXJncylcbiAgfTtcblxuICBpZiAocmVzdWx0LnVzZXJJZCkge1xuICAgIGF0dGVtcHQudXNlciA9IHRoaXMudXNlcnMuZmluZE9uZShyZXN1bHQudXNlcklkKTtcbiAgfVxuXG4gIHRoaXMuX3ZhbGlkYXRlTG9naW4obWV0aG9kSW52b2NhdGlvbi5jb25uZWN0aW9uLCBhdHRlbXB0KTtcbiAgdGhpcy5fZmFpbGVkTG9naW4obWV0aG9kSW52b2NhdGlvbi5jb25uZWN0aW9uLCBhdHRlbXB0KTtcblxuICAvLyBfdmFsaWRhdGVMb2dpbiBtYXkgbXV0YXRlIGF0dGVtcHQgdG8gc2V0IGEgbmV3IGVycm9yIG1lc3NhZ2UuIFJldHVyblxuICAvLyB0aGUgbW9kaWZpZWQgdmVyc2lvbi5cbiAgcmV0dXJuIGF0dGVtcHQ7XG59O1xuXG5cbi8vL1xuLy8vIExPR0lOIEhBTkRMRVJTXG4vLy9cblxuLy8gVGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIGF1dGggcGFja2FnZXMgdG8gaG9vayBpbiB0byBsb2dpbi5cbi8vXG4vLyBBIGxvZ2luIGhhbmRsZXIgaXMgYSBsb2dpbiBtZXRob2Qgd2hpY2ggY2FuIHJldHVybiBgdW5kZWZpbmVkYCB0b1xuLy8gaW5kaWNhdGUgdGhhdCB0aGUgbG9naW4gcmVxdWVzdCBpcyBub3QgaGFuZGxlZCBieSB0aGlzIGhhbmRsZXIuXG4vL1xuLy8gQHBhcmFtIG5hbWUge1N0cmluZ30gT3B0aW9uYWwuICBUaGUgc2VydmljZSBuYW1lLCB1c2VkIGJ5IGRlZmF1bHRcbi8vIGlmIGEgc3BlY2lmaWMgc2VydmljZSBuYW1lIGlzbid0IHJldHVybmVkIGluIHRoZSByZXN1bHQuXG4vL1xuLy8gQHBhcmFtIGhhbmRsZXIge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYW4gb3B0aW9ucyBvYmplY3Rcbi8vIChhcyBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIGBsb2dpbmAgbWV0aG9kKSBhbmQgcmV0dXJucyBvbmUgb2Y6XG4vLyAtIGB1bmRlZmluZWRgLCBtZWFuaW5nIGRvbid0IGhhbmRsZTtcbi8vIC0gYSBsb2dpbiBtZXRob2QgcmVzdWx0IG9iamVjdFxuXG5BcC5yZWdpc3RlckxvZ2luSGFuZGxlciA9IGZ1bmN0aW9uIChuYW1lLCBoYW5kbGVyKSB7XG4gIGlmICghIGhhbmRsZXIpIHtcbiAgICBoYW5kbGVyID0gbmFtZTtcbiAgICBuYW1lID0gbnVsbDtcbiAgfVxuXG4gIHRoaXMuX2xvZ2luSGFuZGxlcnMucHVzaCh7XG4gICAgbmFtZTogbmFtZSxcbiAgICBoYW5kbGVyOiBoYW5kbGVyXG4gIH0pO1xufTtcblxuXG4vLyBDaGVja3MgYSB1c2VyJ3MgY3JlZGVudGlhbHMgYWdhaW5zdCBhbGwgdGhlIHJlZ2lzdGVyZWQgbG9naW5cbi8vIGhhbmRsZXJzLCBhbmQgcmV0dXJucyBhIGxvZ2luIHRva2VuIGlmIHRoZSBjcmVkZW50aWFscyBhcmUgdmFsaWQuIEl0XG4vLyBpcyBsaWtlIHRoZSBsb2dpbiBtZXRob2QsIGV4Y2VwdCB0aGF0IGl0IGRvZXNuJ3Qgc2V0IHRoZSBsb2dnZWQtaW5cbi8vIHVzZXIgb24gdGhlIGNvbm5lY3Rpb24uIFRocm93cyBhIE1ldGVvci5FcnJvciBpZiBsb2dnaW5nIGluIGZhaWxzLFxuLy8gaW5jbHVkaW5nIHRoZSBjYXNlIHdoZXJlIG5vbmUgb2YgdGhlIGxvZ2luIGhhbmRsZXJzIGhhbmRsZWQgdGhlIGxvZ2luXG4vLyByZXF1ZXN0LiBPdGhlcndpc2UsIHJldHVybnMge2lkOiB1c2VySWQsIHRva2VuOiAqLCB0b2tlbkV4cGlyZXM6ICp9LlxuLy9cbi8vIEZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCB0byBsb2dpbiB3aXRoIGEgcGxhaW50ZXh0IHBhc3N3b3JkLCBgb3B0aW9uc2AgY291bGQgYmVcbi8vICAgeyB1c2VyOiB7IHVzZXJuYW1lOiA8dXNlcm5hbWU+IH0sIHBhc3N3b3JkOiA8cGFzc3dvcmQ+IH0sIG9yXG4vLyAgIHsgdXNlcjogeyBlbWFpbDogPGVtYWlsPiB9LCBwYXNzd29yZDogPHBhc3N3b3JkPiB9LlxuXG4vLyBUcnkgYWxsIG9mIHRoZSByZWdpc3RlcmVkIGxvZ2luIGhhbmRsZXJzIHVudGlsIG9uZSBvZiB0aGVtIGRvZXNuJ3Rcbi8vIHJldHVybiBgdW5kZWZpbmVkYCwgbWVhbmluZyBpdCBoYW5kbGVkIHRoaXMgY2FsbCB0byBgbG9naW5gLiBSZXR1cm5cbi8vIHRoYXQgcmV0dXJuIHZhbHVlLlxuQXAuX3J1bkxvZ2luSGFuZGxlcnMgPSBmdW5jdGlvbiAobWV0aG9kSW52b2NhdGlvbiwgb3B0aW9ucykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xvZ2luSGFuZGxlcnMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgaGFuZGxlciA9IHRoaXMuX2xvZ2luSGFuZGxlcnNbaV07XG5cbiAgICB2YXIgcmVzdWx0ID0gdHJ5TG9naW5NZXRob2QoXG4gICAgICBoYW5kbGVyLm5hbWUsXG4gICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVyLmhhbmRsZXIuY2FsbChtZXRob2RJbnZvY2F0aW9uLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIkEgbG9naW4gaGFuZGxlciBzaG91bGQgcmV0dXJuIGEgcmVzdWx0IG9yIHVuZGVmaW5lZFwiKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6IG51bGwsXG4gICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIlVucmVjb2duaXplZCBvcHRpb25zIGZvciBsb2dpbiByZXF1ZXN0XCIpXG4gIH07XG59O1xuXG4vLyBEZWxldGVzIHRoZSBnaXZlbiBsb2dpblRva2VuIGZyb20gdGhlIGRhdGFiYXNlLlxuLy9cbi8vIEZvciBuZXctc3R5bGUgaGFzaGVkIHRva2VuLCB0aGlzIHdpbGwgY2F1c2UgYWxsIGNvbm5lY3Rpb25zXG4vLyBhc3NvY2lhdGVkIHdpdGggdGhlIHRva2VuIHRvIGJlIGNsb3NlZC5cbi8vXG4vLyBBbnkgY29ubmVjdGlvbnMgYXNzb2NpYXRlZCB3aXRoIG9sZC1zdHlsZSB1bmhhc2hlZCB0b2tlbnMgd2lsbCBiZVxuLy8gaW4gdGhlIHByb2Nlc3Mgb2YgYmVjb21pbmcgYXNzb2NpYXRlZCB3aXRoIGhhc2hlZCB0b2tlbnMgYW5kIHRoZW5cbi8vIHRoZXknbGwgZ2V0IGNsb3NlZC5cbkFwLmRlc3Ryb3lUb2tlbiA9IGZ1bmN0aW9uICh1c2VySWQsIGxvZ2luVG9rZW4pIHtcbiAgdGhpcy51c2Vycy51cGRhdGUodXNlcklkLCB7XG4gICAgJHB1bGw6IHtcbiAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHtcbiAgICAgICAgJG9yOiBbXG4gICAgICAgICAgeyBoYXNoZWRUb2tlbjogbG9naW5Ub2tlbiB9LFxuICAgICAgICAgIHsgdG9rZW46IGxvZ2luVG9rZW4gfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfVxuICB9KTtcbn07XG5cbkFwLl9pbml0U2VydmVyTWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gVGhlIG1ldGhvZHMgY3JlYXRlZCBpbiB0aGlzIGZ1bmN0aW9uIG5lZWQgdG8gYmUgY3JlYXRlZCBoZXJlIHNvIHRoYXRcbiAgLy8gdGhpcyB2YXJpYWJsZSBpcyBhdmFpbGFibGUgaW4gdGhlaXIgc2NvcGUuXG4gIHZhciBhY2NvdW50cyA9IHRoaXM7XG5cbiAgLy8gVGhpcyBvYmplY3Qgd2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCBtZXRob2RzIGFuZCB0aGVuIHBhc3NlZCB0b1xuICAvLyBhY2NvdW50cy5fc2VydmVyLm1ldGhvZHMgZnVydGhlciBiZWxvdy5cbiAgdmFyIG1ldGhvZHMgPSB7fTtcblxuICAvLyBAcmV0dXJucyB7T2JqZWN0fG51bGx9XG4gIC8vICAgSWYgc3VjY2Vzc2Z1bCwgcmV0dXJucyB7dG9rZW46IHJlY29ubmVjdFRva2VuLCBpZDogdXNlcklkfVxuICAvLyAgIElmIHVuc3VjY2Vzc2Z1bCAoZm9yIGV4YW1wbGUsIGlmIHRoZSB1c2VyIGNsb3NlZCB0aGUgb2F1dGggbG9naW4gcG9wdXApLFxuICAvLyAgICAgdGhyb3dzIGFuIGVycm9yIGRlc2NyaWJpbmcgdGhlIHJlYXNvblxuICBtZXRob2RzLmxvZ2luID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBMb2dpbiBoYW5kbGVycyBzaG91bGQgcmVhbGx5IGFsc28gY2hlY2sgd2hhdGV2ZXIgZmllbGQgdGhleSBsb29rIGF0IGluXG4gICAgLy8gb3B0aW9ucywgYnV0IHdlIGRvbid0IGVuZm9yY2UgaXQuXG4gICAgY2hlY2sob3B0aW9ucywgT2JqZWN0KTtcblxuICAgIHZhciByZXN1bHQgPSBhY2NvdW50cy5fcnVuTG9naW5IYW5kbGVycyhzZWxmLCBvcHRpb25zKTtcblxuICAgIHJldHVybiBhY2NvdW50cy5fYXR0ZW1wdExvZ2luKHNlbGYsIFwibG9naW5cIiwgYXJndW1lbnRzLCByZXN1bHQpO1xuICB9O1xuXG4gIG1ldGhvZHMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0b2tlbiA9IGFjY291bnRzLl9nZXRMb2dpblRva2VuKHRoaXMuY29ubmVjdGlvbi5pZCk7XG4gICAgYWNjb3VudHMuX3NldExvZ2luVG9rZW4odGhpcy51c2VySWQsIHRoaXMuY29ubmVjdGlvbiwgbnVsbCk7XG4gICAgaWYgKHRva2VuICYmIHRoaXMudXNlcklkKVxuICAgICAgYWNjb3VudHMuZGVzdHJveVRva2VuKHRoaXMudXNlcklkLCB0b2tlbik7XG4gICAgYWNjb3VudHMuX3N1Y2Nlc3NmdWxMb2dvdXQodGhpcy5jb25uZWN0aW9uLCB0aGlzLnVzZXJJZCk7XG4gICAgdGhpcy5zZXRVc2VySWQobnVsbCk7XG4gIH07XG5cbiAgLy8gRGVsZXRlIGFsbCB0aGUgY3VycmVudCB1c2VyJ3MgdG9rZW5zIGFuZCBjbG9zZSBhbGwgb3BlbiBjb25uZWN0aW9ucyBsb2dnZWRcbiAgLy8gaW4gYXMgdGhpcyB1c2VyLiBSZXR1cm5zIGEgZnJlc2ggbmV3IGxvZ2luIHRva2VuIHRoYXQgdGhpcyBjbGllbnQgY2FuXG4gIC8vIHVzZS4gVGVzdHMgc2V0IEFjY291bnRzLl9ub0Nvbm5lY3Rpb25DbG9zZURlbGF5Rm9yVGVzdCB0byBkZWxldGUgdG9rZW5zXG4gIC8vIGltbWVkaWF0ZWx5IGluc3RlYWQgb2YgdXNpbmcgYSBkZWxheS5cbiAgLy9cbiAgLy8gWFhYIENPTVBBVCBXSVRIIDAuNy4yXG4gIC8vIFRoaXMgc2luZ2xlIGBsb2dvdXRPdGhlckNsaWVudHNgIG1ldGhvZCBoYXMgYmVlbiByZXBsYWNlZCB3aXRoIHR3b1xuICAvLyBtZXRob2RzLCBvbmUgdGhhdCB5b3UgY2FsbCB0byBnZXQgYSBuZXcgdG9rZW4sIGFuZCBhbm90aGVyIHRoYXQgeW91XG4gIC8vIGNhbGwgdG8gcmVtb3ZlIGFsbCB0b2tlbnMgZXhjZXB0IHlvdXIgb3duLiBUaGUgbmV3IGRlc2lnbiBhbGxvd3NcbiAgLy8gY2xpZW50cyB0byBrbm93IHdoZW4gb3RoZXIgY2xpZW50cyBoYXZlIGFjdHVhbGx5IGJlZW4gbG9nZ2VkXG4gIC8vIG91dC4gKFRoZSBgbG9nb3V0T3RoZXJDbGllbnRzYCBtZXRob2QgZ3VhcmFudGVlcyB0aGUgY2FsbGVyIHRoYXRcbiAgLy8gdGhlIG90aGVyIGNsaWVudHMgd2lsbCBiZSBsb2dnZWQgb3V0IGF0IHNvbWUgcG9pbnQsIGJ1dCBtYWtlcyBub1xuICAvLyBndWFyYW50ZWVzIGFib3V0IHdoZW4uKSBUaGlzIG1ldGhvZCBpcyBsZWZ0IGluIGZvciBiYWNrd2FyZHNcbiAgLy8gY29tcGF0aWJpbGl0eSwgZXNwZWNpYWxseSBzaW5jZSBhcHBsaWNhdGlvbiBjb2RlIG1pZ2h0IGJlIGNhbGxpbmdcbiAgLy8gdGhpcyBtZXRob2QgZGlyZWN0bHkuXG4gIC8vXG4gIC8vIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHRva2VuIGFuZCB0b2tlbkV4cGlyZXMga2V5cy5cbiAgbWV0aG9kcy5sb2dvdXRPdGhlckNsaWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciB1c2VyID0gYWNjb3VudHMudXNlcnMuZmluZE9uZShzZWxmLnVzZXJJZCwge1xuICAgICAgZmllbGRzOiB7XG4gICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodXNlcikge1xuICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCB0b2tlbnMgaW4gdGhlIGRhdGFiYXNlIHRvIGJlIGRlbGV0ZWQgaW5cbiAgICAgIC8vIENPTk5FQ1RJT05fQ0xPU0VfREVMQVlfTVMgbXMuIFRoaXMgZ2l2ZXMgb3RoZXIgY29ubmVjdGlvbnMgaW4gdGhlXG4gICAgICAvLyBjYWxsZXIncyBicm93c2VyIHRpbWUgdG8gZmluZCB0aGUgZnJlc2ggdG9rZW4gaW4gbG9jYWxTdG9yYWdlLiBXZSBzYXZlXG4gICAgICAvLyB0aGUgdG9rZW5zIGluIHRoZSBkYXRhYmFzZSBpbiBjYXNlIHdlIGNyYXNoIGJlZm9yZSBhY3R1YWxseSBkZWxldGluZ1xuICAgICAgLy8gdGhlbS5cbiAgICAgIHZhciB0b2tlbnMgPSB1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2VucztcbiAgICAgIHZhciBuZXdUb2tlbiA9IGFjY291bnRzLl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCk7XG4gICAgICB2YXIgdXNlcklkID0gc2VsZi51c2VySWQ7XG4gICAgICBhY2NvdW50cy51c2Vycy51cGRhdGUodXNlcklkLCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1RvRGVsZXRlXCI6IHRva2VucyxcbiAgICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5oYXZlTG9naW5Ub2tlbnNUb0RlbGV0ZVwiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgICRwdXNoOiB7IFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IGFjY291bnRzLl9oYXNoU3RhbXBlZFRva2VuKG5ld1Rva2VuKSB9XG4gICAgICB9KTtcbiAgICAgIE1ldGVvci5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gVGhlIG9ic2VydmUgb24gTWV0ZW9yLnVzZXJzIHdpbGwgdGFrZSBjYXJlIG9mIGNsb3NpbmcgdGhlIGNvbm5lY3Rpb25zXG4gICAgICAgIC8vIGFzc29jaWF0ZWQgd2l0aCBgdG9rZW5zYC5cbiAgICAgICAgYWNjb3VudHMuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yVXNlcih1c2VySWQsIHRva2Vucyk7XG4gICAgICB9LCBhY2NvdW50cy5fbm9Db25uZWN0aW9uQ2xvc2VEZWxheUZvclRlc3QgPyAwIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIENPTk5FQ1RJT05fQ0xPU0VfREVMQVlfTVMpO1xuICAgICAgLy8gV2UgZG8gbm90IHNldCB0aGUgbG9naW4gdG9rZW4gb24gdGhpcyBjb25uZWN0aW9uLCBidXQgaW5zdGVhZCB0aGVcbiAgICAgIC8vIG9ic2VydmUgY2xvc2VzIHRoZSBjb25uZWN0aW9uIGFuZCB0aGUgY2xpZW50IHdpbGwgcmVjb25uZWN0IHdpdGggdGhlXG4gICAgICAvLyBuZXcgdG9rZW4uXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b2tlbjogbmV3VG9rZW4udG9rZW4sXG4gICAgICAgIHRva2VuRXhwaXJlczogYWNjb3VudHMuX3Rva2VuRXhwaXJhdGlvbihuZXdUb2tlbi53aGVuKVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIllvdSBhcmUgbm90IGxvZ2dlZCBpbi5cIik7XG4gICAgfVxuICB9O1xuXG4gIC8vIEdlbmVyYXRlcyBhIG5ldyBsb2dpbiB0b2tlbiB3aXRoIHRoZSBzYW1lIGV4cGlyYXRpb24gYXMgdGhlXG4gIC8vIGNvbm5lY3Rpb24ncyBjdXJyZW50IHRva2VuIGFuZCBzYXZlcyBpdCB0byB0aGUgZGF0YWJhc2UuIEFzc29jaWF0ZXNcbiAgLy8gdGhlIGNvbm5lY3Rpb24gd2l0aCB0aGlzIG5ldyB0b2tlbiBhbmQgcmV0dXJucyBpdC4gVGhyb3dzIGFuIGVycm9yXG4gIC8vIGlmIGNhbGxlZCBvbiBhIGNvbm5lY3Rpb24gdGhhdCBpc24ndCBsb2dnZWQgaW4uXG4gIC8vXG4gIC8vIEByZXR1cm5zIE9iamVjdFxuICAvLyAgIElmIHN1Y2Nlc3NmdWwsIHJldHVybnMgeyB0b2tlbjogPG5ldyB0b2tlbj4sIGlkOiA8dXNlciBpZD4sXG4gIC8vICAgdG9rZW5FeHBpcmVzOiA8ZXhwaXJhdGlvbiBkYXRlPiB9LlxuICBtZXRob2RzLmdldE5ld1Rva2VuID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdXNlciA9IGFjY291bnRzLnVzZXJzLmZpbmRPbmUoc2VsZi51c2VySWQsIHtcbiAgICAgIGZpZWxkczogeyBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiAxIH1cbiAgICB9KTtcbiAgICBpZiAoISBzZWxmLnVzZXJJZCB8fCAhIHVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCJZb3UgYXJlIG5vdCBsb2dnZWQgaW4uXCIpO1xuICAgIH1cbiAgICAvLyBCZSBjYXJlZnVsIG5vdCB0byBnZW5lcmF0ZSBhIG5ldyB0b2tlbiB0aGF0IGhhcyBhIGxhdGVyXG4gICAgLy8gZXhwaXJhdGlvbiB0aGFuIHRoZSBjdXJyZW4gdG9rZW4uIE90aGVyd2lzZSwgYSBiYWQgZ3V5IHdpdGggYVxuICAgIC8vIHN0b2xlbiB0b2tlbiBjb3VsZCB1c2UgdGhpcyBtZXRob2QgdG8gc3RvcCBoaXMgc3RvbGVuIHRva2VuIGZyb21cbiAgICAvLyBldmVyIGV4cGlyaW5nLlxuICAgIHZhciBjdXJyZW50SGFzaGVkVG9rZW4gPSBhY2NvdW50cy5fZ2V0TG9naW5Ub2tlbihzZWxmLmNvbm5lY3Rpb24uaWQpO1xuICAgIHZhciBjdXJyZW50U3RhbXBlZFRva2VuID0gXy5maW5kKFxuICAgICAgdXNlci5zZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMsXG4gICAgICBmdW5jdGlvbiAoc3RhbXBlZFRva2VuKSB7XG4gICAgICAgIHJldHVybiBzdGFtcGVkVG9rZW4uaGFzaGVkVG9rZW4gPT09IGN1cnJlbnRIYXNoZWRUb2tlbjtcbiAgICAgIH1cbiAgICApO1xuICAgIGlmICghIGN1cnJlbnRTdGFtcGVkVG9rZW4pIHsgLy8gc2FmZXR5IGJlbHQ6IHRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlblxuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIkludmFsaWQgbG9naW4gdG9rZW5cIik7XG4gICAgfVxuICAgIHZhciBuZXdTdGFtcGVkVG9rZW4gPSBhY2NvdW50cy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICAgIG5ld1N0YW1wZWRUb2tlbi53aGVuID0gY3VycmVudFN0YW1wZWRUb2tlbi53aGVuO1xuICAgIGFjY291bnRzLl9pbnNlcnRMb2dpblRva2VuKHNlbGYudXNlcklkLCBuZXdTdGFtcGVkVG9rZW4pO1xuICAgIHJldHVybiBhY2NvdW50cy5fbG9naW5Vc2VyKHNlbGYsIHNlbGYudXNlcklkLCBuZXdTdGFtcGVkVG9rZW4pO1xuICB9O1xuXG4gIC8vIFJlbW92ZXMgYWxsIHRva2VucyBleGNlcHQgdGhlIHRva2VuIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudFxuICAvLyBjb25uZWN0aW9uLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIGNvbm5lY3Rpb24gaXMgbm90IGxvZ2dlZFxuICAvLyBpbi4gUmV0dXJucyBub3RoaW5nIG9uIHN1Y2Nlc3MuXG4gIG1ldGhvZHMucmVtb3ZlT3RoZXJUb2tlbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghIHNlbGYudXNlcklkKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiWW91IGFyZSBub3QgbG9nZ2VkIGluLlwiKTtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRUb2tlbiA9IGFjY291bnRzLl9nZXRMb2dpblRva2VuKHNlbGYuY29ubmVjdGlvbi5pZCk7XG4gICAgYWNjb3VudHMudXNlcnMudXBkYXRlKHNlbGYudXNlcklkLCB7XG4gICAgICAkcHVsbDoge1xuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiB7IGhhc2hlZFRva2VuOiB7ICRuZTogY3VycmVudFRva2VuIH0gfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIEFsbG93IGEgb25lLXRpbWUgY29uZmlndXJhdGlvbiBmb3IgYSBsb2dpbiBzZXJ2aWNlLiBNb2RpZmljYXRpb25zXG4gIC8vIHRvIHRoaXMgY29sbGVjdGlvbiBhcmUgYWxzbyBhbGxvd2VkIGluIGluc2VjdXJlIG1vZGUuXG4gIG1ldGhvZHMuY29uZmlndXJlTG9naW5TZXJ2aWNlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBjaGVjayhvcHRpb25zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe3NlcnZpY2U6IFN0cmluZ30pKTtcbiAgICAvLyBEb24ndCBsZXQgcmFuZG9tIHVzZXJzIGNvbmZpZ3VyZSBhIHNlcnZpY2Ugd2UgaGF2ZW4ndCBhZGRlZCB5ZXQgKHNvXG4gICAgLy8gdGhhdCB3aGVuIHdlIGRvIGxhdGVyIGFkZCBpdCwgaXQncyBzZXQgdXAgd2l0aCB0aGVpciBjb25maWd1cmF0aW9uXG4gICAgLy8gaW5zdGVhZCBvZiBvdXJzKS5cbiAgICAvLyBYWFggaWYgc2VydmljZSBjb25maWd1cmF0aW9uIGlzIG9hdXRoLXNwZWNpZmljIHRoZW4gdGhpcyBjb2RlIHNob3VsZFxuICAgIC8vICAgICBiZSBpbiBhY2NvdW50cy1vYXV0aDsgaWYgaXQncyBub3QgdGhlbiB0aGUgcmVnaXN0cnkgc2hvdWxkIGJlXG4gICAgLy8gICAgIGluIHRoaXMgcGFja2FnZVxuICAgIGlmICghKGFjY291bnRzLm9hdXRoXG4gICAgICAgICAgJiYgXy5jb250YWlucyhhY2NvdW50cy5vYXV0aC5zZXJ2aWNlTmFtZXMoKSwgb3B0aW9ucy5zZXJ2aWNlKSkpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlNlcnZpY2UgdW5rbm93blwiKTtcbiAgICB9XG5cbiAgICB2YXIgU2VydmljZUNvbmZpZ3VyYXRpb24gPVxuICAgICAgUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ10uU2VydmljZUNvbmZpZ3VyYXRpb247XG4gICAgaWYgKFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmRPbmUoe3NlcnZpY2U6IG9wdGlvbnMuc2VydmljZX0pKVxuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiU2VydmljZSBcIiArIG9wdGlvbnMuc2VydmljZSArIFwiIGFscmVhZHkgY29uZmlndXJlZFwiKTtcblxuICAgIGlmIChfLmhhcyhvcHRpb25zLCBcInNlY3JldFwiKSAmJiB1c2luZ09BdXRoRW5jcnlwdGlvbigpKVxuICAgICAgb3B0aW9ucy5zZWNyZXQgPSBPQXV0aEVuY3J5cHRpb24uc2VhbChvcHRpb25zLnNlY3JldCk7XG5cbiAgICBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5pbnNlcnQob3B0aW9ucyk7XG4gIH07XG5cbiAgYWNjb3VudHMuX3NlcnZlci5tZXRob2RzKG1ldGhvZHMpO1xufTtcblxuQXAuX2luaXRBY2NvdW50RGF0YUhvb2tzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYWNjb3VudHMgPSB0aGlzO1xuXG4gIGFjY291bnRzLl9zZXJ2ZXIub25Db25uZWN0aW9uKGZ1bmN0aW9uIChjb25uZWN0aW9uKSB7XG4gICAgYWNjb3VudHMuX2FjY291bnREYXRhW2Nvbm5lY3Rpb24uaWRdID0ge1xuICAgICAgY29ubmVjdGlvbjogY29ubmVjdGlvblxuICAgIH07XG5cbiAgICBjb25uZWN0aW9uLm9uQ2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgYWNjb3VudHMuX3JlbW92ZVRva2VuRnJvbUNvbm5lY3Rpb24oY29ubmVjdGlvbi5pZCk7XG4gICAgICBkZWxldGUgYWNjb3VudHMuX2FjY291bnREYXRhW2Nvbm5lY3Rpb24uaWRdO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbkFwLl9pbml0U2VydmVyUHVibGljYXRpb25zID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYWNjb3VudHMgPSB0aGlzO1xuXG4gIC8vIFB1Ymxpc2ggYWxsIGxvZ2luIHNlcnZpY2UgY29uZmlndXJhdGlvbiBmaWVsZHMgb3RoZXIgdGhhbiBzZWNyZXQuXG4gIGFjY291bnRzLl9zZXJ2ZXIucHVibGlzaChcIm1ldGVvci5sb2dpblNlcnZpY2VDb25maWd1cmF0aW9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgU2VydmljZUNvbmZpZ3VyYXRpb24gPVxuICAgICAgUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ10uU2VydmljZUNvbmZpZ3VyYXRpb247XG4gICAgcmV0dXJuIFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHtmaWVsZHM6IHtzZWNyZXQ6IDB9fSk7XG4gIH0sIHtpc19hdXRvOiB0cnVlfSk7IC8vIG5vdCB0ZWNoaW5jYWxseSBhdXRvcHVibGlzaCwgYnV0IHN0b3BzIHRoZSB3YXJuaW5nLlxuXG4gIC8vIFB1Ymxpc2ggdGhlIGN1cnJlbnQgdXNlcidzIHJlY29yZCB0byB0aGUgY2xpZW50LlxuICBhY2NvdW50cy5fc2VydmVyLnB1Ymxpc2gobnVsbCwgZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnVzZXJJZCkge1xuICAgICAgcmV0dXJuIGFjY291bnRzLnVzZXJzLmZpbmQoe1xuICAgICAgICBfaWQ6IHRoaXMudXNlcklkXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIHByb2ZpbGU6IDEsXG4gICAgICAgICAgdXNlcm5hbWU6IDEsXG4gICAgICAgICAgZW1haWxzOiAxXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0sIC8qc3VwcHJlc3MgYXV0b3B1Ymxpc2ggd2FybmluZyove2lzX2F1dG86IHRydWV9KTtcblxuICAvLyBVc2UgTWV0ZW9yLnN0YXJ0dXAgdG8gZ2l2ZSBvdGhlciBwYWNrYWdlcyBhIGNoYW5jZSB0byBjYWxsXG4gIC8vIGFkZEF1dG9wdWJsaXNoRmllbGRzLlxuICBQYWNrYWdlLmF1dG9wdWJsaXNoICYmIE1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBbJ3Byb2ZpbGUnLCAndXNlcm5hbWUnXSAtPiB7cHJvZmlsZTogMSwgdXNlcm5hbWU6IDF9XG4gICAgdmFyIHRvRmllbGRTZWxlY3RvciA9IGZ1bmN0aW9uIChmaWVsZHMpIHtcbiAgICAgIHJldHVybiBfLm9iamVjdChfLm1hcChmaWVsZHMsIGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICByZXR1cm4gW2ZpZWxkLCAxXTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgYWNjb3VudHMuX3NlcnZlci5wdWJsaXNoKG51bGwsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnVzZXJJZCkge1xuICAgICAgICByZXR1cm4gYWNjb3VudHMudXNlcnMuZmluZCh7XG4gICAgICAgICAgX2lkOiB0aGlzLnVzZXJJZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiB0b0ZpZWxkU2VsZWN0b3IoYWNjb3VudHMuX2F1dG9wdWJsaXNoRmllbGRzLmxvZ2dlZEluVXNlcilcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9LCAvKnN1cHByZXNzIGF1dG9wdWJsaXNoIHdhcm5pbmcqL3tpc19hdXRvOiB0cnVlfSk7XG5cbiAgICAvLyBYWFggdGhpcyBwdWJsaXNoIGlzIG5laXRoZXIgZGVkdXAtYWJsZSBub3IgaXMgaXQgb3B0aW1pemVkIGJ5IG91ciBzcGVjaWFsXG4gICAgLy8gdHJlYXRtZW50IG9mIHF1ZXJpZXMgb24gYSBzcGVjaWZpYyBfaWQuIFRoZXJlZm9yZSB0aGlzIHdpbGwgaGF2ZSBPKG5eMilcbiAgICAvLyBydW4tdGltZSBwZXJmb3JtYW5jZSBldmVyeSB0aW1lIGEgdXNlciBkb2N1bWVudCBpcyBjaGFuZ2VkIChlZyBzb21lb25lXG4gICAgLy8gbG9nZ2luZyBpbikuIElmIHRoaXMgaXMgYSBwcm9ibGVtLCB3ZSBjYW4gaW5zdGVhZCB3cml0ZSBhIG1hbnVhbCBwdWJsaXNoXG4gICAgLy8gZnVuY3Rpb24gd2hpY2ggZmlsdGVycyBvdXQgZmllbGRzIGJhc2VkIG9uICd0aGlzLnVzZXJJZCcuXG4gICAgYWNjb3VudHMuX3NlcnZlci5wdWJsaXNoKG51bGwsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxlY3RvciA9IHRoaXMudXNlcklkID8ge1xuICAgICAgICBfaWQ6IHsgJG5lOiB0aGlzLnVzZXJJZCB9XG4gICAgICB9IDoge307XG5cbiAgICAgIHJldHVybiBhY2NvdW50cy51c2Vycy5maW5kKHNlbGVjdG9yLCB7XG4gICAgICAgIGZpZWxkczogdG9GaWVsZFNlbGVjdG9yKGFjY291bnRzLl9hdXRvcHVibGlzaEZpZWxkcy5vdGhlclVzZXJzKVxuICAgICAgfSk7XG4gICAgfSwgLypzdXBwcmVzcyBhdXRvcHVibGlzaCB3YXJuaW5nKi97aXNfYXV0bzogdHJ1ZX0pO1xuICB9KTtcbn07XG5cbi8vIEFkZCB0byB0aGUgbGlzdCBvZiBmaWVsZHMgb3Igc3ViZmllbGRzIHRvIGJlIGF1dG9tYXRpY2FsbHlcbi8vIHB1Ymxpc2hlZCBpZiBhdXRvcHVibGlzaCBpcyBvbi4gTXVzdCBiZSBjYWxsZWQgZnJvbSB0b3AtbGV2ZWxcbi8vIGNvZGUgKGllLCBiZWZvcmUgTWV0ZW9yLnN0YXJ0dXAgaG9va3MgcnVuKS5cbi8vXG4vLyBAcGFyYW0gb3B0cyB7T2JqZWN0fSB3aXRoOlxuLy8gICAtIGZvckxvZ2dlZEluVXNlciB7QXJyYXl9IEFycmF5IG9mIGZpZWxkcyBwdWJsaXNoZWQgdG8gdGhlIGxvZ2dlZC1pbiB1c2VyXG4vLyAgIC0gZm9yT3RoZXJVc2VycyB7QXJyYXl9IEFycmF5IG9mIGZpZWxkcyBwdWJsaXNoZWQgdG8gdXNlcnMgdGhhdCBhcmVuJ3QgbG9nZ2VkIGluXG5BcC5hZGRBdXRvcHVibGlzaEZpZWxkcyA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIHRoaXMuX2F1dG9wdWJsaXNoRmllbGRzLmxvZ2dlZEluVXNlci5wdXNoLmFwcGx5KFxuICAgIHRoaXMuX2F1dG9wdWJsaXNoRmllbGRzLmxvZ2dlZEluVXNlciwgb3B0cy5mb3JMb2dnZWRJblVzZXIpO1xuICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcy5vdGhlclVzZXJzLnB1c2guYXBwbHkoXG4gICAgdGhpcy5fYXV0b3B1Ymxpc2hGaWVsZHMub3RoZXJVc2Vycywgb3B0cy5mb3JPdGhlclVzZXJzKTtcbn07XG5cbi8vL1xuLy8vIEFDQ09VTlQgREFUQVxuLy8vXG5cbi8vIEhBQ0s6IFRoaXMgaXMgdXNlZCBieSAnbWV0ZW9yLWFjY291bnRzJyB0byBnZXQgdGhlIGxvZ2luVG9rZW4gZm9yIGFcbi8vIGNvbm5lY3Rpb24uIE1heWJlIHRoZXJlIHNob3VsZCBiZSBhIHB1YmxpYyB3YXkgdG8gZG8gdGhhdC5cbkFwLl9nZXRBY2NvdW50RGF0YSA9IGZ1bmN0aW9uIChjb25uZWN0aW9uSWQsIGZpZWxkKSB7XG4gIHZhciBkYXRhID0gdGhpcy5fYWNjb3VudERhdGFbY29ubmVjdGlvbklkXTtcbiAgcmV0dXJuIGRhdGEgJiYgZGF0YVtmaWVsZF07XG59O1xuXG5BcC5fc2V0QWNjb3VudERhdGEgPSBmdW5jdGlvbiAoY29ubmVjdGlvbklkLCBmaWVsZCwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9hY2NvdW50RGF0YVtjb25uZWN0aW9uSWRdO1xuXG4gIC8vIHNhZmV0eSBiZWx0LiBzaG91bGRuJ3QgaGFwcGVuLiBhY2NvdW50RGF0YSBpcyBzZXQgaW4gb25Db25uZWN0aW9uLFxuICAvLyB3ZSBkb24ndCBoYXZlIGEgY29ubmVjdGlvbklkIHVudGlsIGl0IGlzIHNldC5cbiAgaWYgKCFkYXRhKVxuICAgIHJldHVybjtcblxuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICBkZWxldGUgZGF0YVtmaWVsZF07XG4gIGVsc2VcbiAgICBkYXRhW2ZpZWxkXSA9IHZhbHVlO1xufTtcblxuXG4vLy9cbi8vLyBSRUNPTk5FQ1QgVE9LRU5TXG4vLy9cbi8vLyBzdXBwb3J0IHJlY29ubmVjdGluZyB1c2luZyBhIG1ldGVvciBsb2dpbiB0b2tlblxuXG5BcC5faGFzaExvZ2luVG9rZW4gPSBmdW5jdGlvbiAobG9naW5Ub2tlbikge1xuICB2YXIgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcbiAgaGFzaC51cGRhdGUobG9naW5Ub2tlbik7XG4gIHJldHVybiBoYXNoLmRpZ2VzdCgnYmFzZTY0Jyk7XG59O1xuXG5cbi8vIHt0b2tlbiwgd2hlbn0gPT4ge2hhc2hlZFRva2VuLCB3aGVufVxuQXAuX2hhc2hTdGFtcGVkVG9rZW4gPSBmdW5jdGlvbiAoc3RhbXBlZFRva2VuKSB7XG4gIHJldHVybiBfLmV4dGVuZChfLm9taXQoc3RhbXBlZFRva2VuLCAndG9rZW4nKSwge1xuICAgIGhhc2hlZFRva2VuOiB0aGlzLl9oYXNoTG9naW5Ub2tlbihzdGFtcGVkVG9rZW4udG9rZW4pXG4gIH0pO1xufTtcblxuXG4vLyBVc2luZyAkYWRkVG9TZXQgYXZvaWRzIGdldHRpbmcgYW4gaW5kZXggZXJyb3IgaWYgYW5vdGhlciBjbGllbnRcbi8vIGxvZ2dpbmcgaW4gc2ltdWx0YW5lb3VzbHkgaGFzIGFscmVhZHkgaW5zZXJ0ZWQgdGhlIG5ldyBoYXNoZWRcbi8vIHRva2VuLlxuQXAuX2luc2VydEhhc2hlZExvZ2luVG9rZW4gPSBmdW5jdGlvbiAodXNlcklkLCBoYXNoZWRUb2tlbiwgcXVlcnkpIHtcbiAgcXVlcnkgPSBxdWVyeSA/IF8uY2xvbmUocXVlcnkpIDoge307XG4gIHF1ZXJ5Ll9pZCA9IHVzZXJJZDtcbiAgdGhpcy51c2Vycy51cGRhdGUocXVlcnksIHtcbiAgICAkYWRkVG9TZXQ6IHtcbiAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IGhhc2hlZFRva2VuXG4gICAgfVxuICB9KTtcbn07XG5cblxuLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLlxuQXAuX2luc2VydExvZ2luVG9rZW4gPSBmdW5jdGlvbiAodXNlcklkLCBzdGFtcGVkVG9rZW4sIHF1ZXJ5KSB7XG4gIHRoaXMuX2luc2VydEhhc2hlZExvZ2luVG9rZW4oXG4gICAgdXNlcklkLFxuICAgIHRoaXMuX2hhc2hTdGFtcGVkVG9rZW4oc3RhbXBlZFRva2VuKSxcbiAgICBxdWVyeVxuICApO1xufTtcblxuXG5BcC5fY2xlYXJBbGxMb2dpblRva2VucyA9IGZ1bmN0aW9uICh1c2VySWQpIHtcbiAgdGhpcy51c2Vycy51cGRhdGUodXNlcklkLCB7XG4gICAgJHNldDoge1xuICAgICAgJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucyc6IFtdXG4gICAgfVxuICB9KTtcbn07XG5cbi8vIHRlc3QgaG9va1xuQXAuX2dldFVzZXJPYnNlcnZlID0gZnVuY3Rpb24gKGNvbm5lY3Rpb25JZCkge1xuICByZXR1cm4gdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbklkXTtcbn07XG5cbi8vIENsZWFuIHVwIHRoaXMgY29ubmVjdGlvbidzIGFzc29jaWF0aW9uIHdpdGggdGhlIHRva2VuOiB0aGF0IGlzLCBzdG9wXG4vLyB0aGUgb2JzZXJ2ZSB0aGF0IHdlIHN0YXJ0ZWQgd2hlbiB3ZSBhc3NvY2lhdGVkIHRoZSBjb25uZWN0aW9uIHdpdGhcbi8vIHRoaXMgdG9rZW4uXG5BcC5fcmVtb3ZlVG9rZW5Gcm9tQ29ubmVjdGlvbiA9IGZ1bmN0aW9uIChjb25uZWN0aW9uSWQpIHtcbiAgaWYgKF8uaGFzKHRoaXMuX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zLCBjb25uZWN0aW9uSWQpKSB7XG4gICAgdmFyIG9ic2VydmUgPSB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uSWRdO1xuICAgIGlmICh0eXBlb2Ygb2JzZXJ2ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIFdlJ3JlIGluIHRoZSBwcm9jZXNzIG9mIHNldHRpbmcgdXAgYW4gb2JzZXJ2ZSBmb3IgdGhpcyBjb25uZWN0aW9uLiBXZVxuICAgICAgLy8gY2FuJ3QgY2xlYW4gdXAgdGhhdCBvYnNlcnZlIHlldCwgYnV0IGlmIHdlIGRlbGV0ZSB0aGUgcGxhY2Vob2xkZXIgZm9yXG4gICAgICAvLyB0aGlzIGNvbm5lY3Rpb24sIHRoZW4gdGhlIG9ic2VydmUgd2lsbCBnZXQgY2xlYW5lZCB1cCBhcyBzb29uIGFzIGl0IGhhc1xuICAgICAgLy8gYmVlbiBzZXQgdXAuXG4gICAgICBkZWxldGUgdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbklkXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHRoaXMuX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zW2Nvbm5lY3Rpb25JZF07XG4gICAgICBvYnNlcnZlLnN0b3AoKTtcbiAgICB9XG4gIH1cbn07XG5cbkFwLl9nZXRMb2dpblRva2VuID0gZnVuY3Rpb24gKGNvbm5lY3Rpb25JZCkge1xuICByZXR1cm4gdGhpcy5fZ2V0QWNjb3VudERhdGEoY29ubmVjdGlvbklkLCAnbG9naW5Ub2tlbicpO1xufTtcblxuLy8gbmV3VG9rZW4gaXMgYSBoYXNoZWQgdG9rZW4uXG5BcC5fc2V0TG9naW5Ub2tlbiA9IGZ1bmN0aW9uICh1c2VySWQsIGNvbm5lY3Rpb24sIG5ld1Rva2VuKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBzZWxmLl9yZW1vdmVUb2tlbkZyb21Db25uZWN0aW9uKGNvbm5lY3Rpb24uaWQpO1xuICBzZWxmLl9zZXRBY2NvdW50RGF0YShjb25uZWN0aW9uLmlkLCAnbG9naW5Ub2tlbicsIG5ld1Rva2VuKTtcblxuICBpZiAobmV3VG9rZW4pIHtcbiAgICAvLyBTZXQgdXAgYW4gb2JzZXJ2ZSBmb3IgdGhpcyB0b2tlbi4gSWYgdGhlIHRva2VuIGdvZXMgYXdheSwgd2UgbmVlZFxuICAgIC8vIHRvIGNsb3NlIHRoZSBjb25uZWN0aW9uLiAgV2UgZGVmZXIgdGhlIG9ic2VydmUgYmVjYXVzZSB0aGVyZSdzXG4gICAgLy8gbm8gbmVlZCBmb3IgaXQgdG8gYmUgb24gdGhlIGNyaXRpY2FsIHBhdGggZm9yIGxvZ2luOyB3ZSBqdXN0IG5lZWRcbiAgICAvLyB0byBlbnN1cmUgdGhhdCB0aGUgY29ubmVjdGlvbiB3aWxsIGdldCBjbG9zZWQgYXQgc29tZSBwb2ludCBpZlxuICAgIC8vIHRoZSB0b2tlbiBnZXRzIGRlbGV0ZWQuXG4gICAgLy9cbiAgICAvLyBJbml0aWFsbHksIHdlIHNldCB0aGUgb2JzZXJ2ZSBmb3IgdGhpcyBjb25uZWN0aW9uIHRvIGEgbnVtYmVyOyB0aGlzXG4gICAgLy8gc2lnbmlmaWVzIHRvIG90aGVyIGNvZGUgKHdoaWNoIG1pZ2h0IHJ1biB3aGlsZSB3ZSB5aWVsZCkgdGhhdCB3ZSBhcmUgaW5cbiAgICAvLyB0aGUgcHJvY2VzcyBvZiBzZXR0aW5nIHVwIGFuIG9ic2VydmUgZm9yIHRoaXMgY29ubmVjdGlvbi4gT25jZSB0aGVcbiAgICAvLyBvYnNlcnZlIGlzIHJlYWR5IHRvIGdvLCB3ZSByZXBsYWNlIHRoZSBudW1iZXIgd2l0aCB0aGUgcmVhbCBvYnNlcnZlXG4gICAgLy8gaGFuZGxlICh1bmxlc3MgdGhlIHBsYWNlaG9sZGVyIGhhcyBiZWVuIGRlbGV0ZWQgb3IgcmVwbGFjZWQgYnkgYVxuICAgIC8vIGRpZmZlcmVudCBwbGFjZWhvbGQgbnVtYmVyLCBzaWduaWZ5aW5nIHRoYXQgdGhlIGNvbm5lY3Rpb24gd2FzIGNsb3NlZFxuICAgIC8vIGFscmVhZHkgLS0gaW4gdGhpcyBjYXNlIHdlIGp1c3QgY2xlYW4gdXAgdGhlIG9ic2VydmUgdGhhdCB3ZSBzdGFydGVkKS5cbiAgICB2YXIgbXlPYnNlcnZlTnVtYmVyID0gKytzZWxmLl9uZXh0VXNlck9ic2VydmVOdW1iZXI7XG4gICAgc2VsZi5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbi5pZF0gPSBteU9ic2VydmVOdW1iZXI7XG4gICAgTWV0ZW9yLmRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIElmIHNvbWV0aGluZyBlbHNlIGhhcHBlbmVkIG9uIHRoaXMgY29ubmVjdGlvbiBpbiB0aGUgbWVhbnRpbWUgKGl0IGdvdFxuICAgICAgLy8gY2xvc2VkLCBvciBhbm90aGVyIGNhbGwgdG8gX3NldExvZ2luVG9rZW4gaGFwcGVuZWQpLCBqdXN0IGRvXG4gICAgICAvLyBub3RoaW5nLiBXZSBkb24ndCBuZWVkIHRvIHN0YXJ0IGFuIG9ic2VydmUgZm9yIGFuIG9sZCBjb25uZWN0aW9uIG9yIG9sZFxuICAgICAgLy8gdG9rZW4uXG4gICAgICBpZiAoc2VsZi5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbi5pZF0gIT09IG15T2JzZXJ2ZU51bWJlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBmb3VuZE1hdGNoaW5nVXNlcjtcbiAgICAgIC8vIEJlY2F1c2Ugd2UgdXBncmFkZSB1bmhhc2hlZCBsb2dpbiB0b2tlbnMgdG8gaGFzaGVkIHRva2VucyBhdFxuICAgICAgLy8gbG9naW4gdGltZSwgc2Vzc2lvbnMgd2lsbCBvbmx5IGJlIGxvZ2dlZCBpbiB3aXRoIGEgaGFzaGVkXG4gICAgICAvLyB0b2tlbi4gVGh1cyB3ZSBvbmx5IG5lZWQgdG8gb2JzZXJ2ZSBoYXNoZWQgdG9rZW5zIGhlcmUuXG4gICAgICB2YXIgb2JzZXJ2ZSA9IHNlbGYudXNlcnMuZmluZCh7XG4gICAgICAgIF9pZDogdXNlcklkLFxuICAgICAgICAnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuJzogbmV3VG9rZW5cbiAgICAgIH0sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pLm9ic2VydmVDaGFuZ2VzKHtcbiAgICAgICAgYWRkZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmb3VuZE1hdGNoaW5nVXNlciA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICAgICAgLy8gVGhlIG9uQ2xvc2UgY2FsbGJhY2sgZm9yIHRoZSBjb25uZWN0aW9uIHRha2VzIGNhcmUgb2ZcbiAgICAgICAgICAvLyBjbGVhbmluZyB1cCB0aGUgb2JzZXJ2ZSBoYW5kbGUgYW5kIGFueSBvdGhlciBzdGF0ZSB3ZSBoYXZlXG4gICAgICAgICAgLy8gbHlpbmcgYXJvdW5kLlxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gSWYgdGhlIHVzZXIgcmFuIGFub3RoZXIgbG9naW4gb3IgbG9nb3V0IGNvbW1hbmQgd2Ugd2VyZSB3YWl0aW5nIGZvciB0aGVcbiAgICAgIC8vIGRlZmVyIG9yIGFkZGVkIHRvIGZpcmUgKGllLCBhbm90aGVyIGNhbGwgdG8gX3NldExvZ2luVG9rZW4gb2NjdXJyZWQpLFxuICAgICAgLy8gdGhlbiB3ZSBsZXQgdGhlIGxhdGVyIG9uZSB3aW4gKHN0YXJ0IGFuIG9ic2VydmUsIGV0YykgYW5kIGp1c3Qgc3RvcCBvdXJcbiAgICAgIC8vIG9ic2VydmUgbm93LlxuICAgICAgLy9cbiAgICAgIC8vIFNpbWlsYXJseSwgaWYgdGhlIGNvbm5lY3Rpb24gd2FzIGFscmVhZHkgY2xvc2VkLCB0aGVuIHRoZSBvbkNsb3NlXG4gICAgICAvLyBjYWxsYmFjayB3b3VsZCBoYXZlIGNhbGxlZCBfcmVtb3ZlVG9rZW5Gcm9tQ29ubmVjdGlvbiBhbmQgdGhlcmUgd29uJ3RcbiAgICAgIC8vIGJlIGFuIGVudHJ5IGluIF91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9ucy4gV2UgY2FuIHN0b3AgdGhlIG9ic2VydmUuXG4gICAgICBpZiAoc2VsZi5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbi5pZF0gIT09IG15T2JzZXJ2ZU51bWJlcikge1xuICAgICAgICBvYnNlcnZlLnN0b3AoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uLmlkXSA9IG9ic2VydmU7XG5cbiAgICAgIGlmICghIGZvdW5kTWF0Y2hpbmdVc2VyKSB7XG4gICAgICAgIC8vIFdlJ3ZlIHNldCB1cCBhbiBvYnNlcnZlIG9uIHRoZSB1c2VyIGFzc29jaWF0ZWQgd2l0aCBgbmV3VG9rZW5gLFxuICAgICAgICAvLyBzbyBpZiB0aGUgbmV3IHRva2VuIGlzIHJlbW92ZWQgZnJvbSB0aGUgZGF0YWJhc2UsIHdlJ2xsIGNsb3NlXG4gICAgICAgIC8vIHRoZSBjb25uZWN0aW9uLiBCdXQgdGhlIHRva2VuIG1pZ2h0IGhhdmUgYWxyZWFkeSBiZWVuIGRlbGV0ZWRcbiAgICAgICAgLy8gYmVmb3JlIHdlIHNldCB1cCB0aGUgb2JzZXJ2ZSwgd2hpY2ggd291bGRuJ3QgaGF2ZSBjbG9zZWQgdGhlXG4gICAgICAgIC8vIGNvbm5lY3Rpb24gYmVjYXVzZSB0aGUgb2JzZXJ2ZSB3YXNuJ3QgcnVubmluZyB5ZXQuXG4gICAgICAgIGNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZnVuY3Rpb24gc2V0dXBEZWZhdWx0TG9naW5IYW5kbGVycyhhY2NvdW50cykge1xuICBhY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcihcInJlc3VtZVwiLCBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHJldHVybiBkZWZhdWx0UmVzdW1lTG9naW5IYW5kbGVyLmNhbGwodGhpcywgYWNjb3VudHMsIG9wdGlvbnMpO1xuICB9KTtcbn1cblxuLy8gTG9naW4gaGFuZGxlciBmb3IgcmVzdW1lIHRva2Vucy5cbmZ1bmN0aW9uIGRlZmF1bHRSZXN1bWVMb2dpbkhhbmRsZXIoYWNjb3VudHMsIG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zLnJlc3VtZSlcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuXG4gIGNoZWNrKG9wdGlvbnMucmVzdW1lLCBTdHJpbmcpO1xuXG4gIHZhciBoYXNoZWRUb2tlbiA9IGFjY291bnRzLl9oYXNoTG9naW5Ub2tlbihvcHRpb25zLnJlc3VtZSk7XG5cbiAgLy8gRmlyc3QgbG9vayBmb3IganVzdCB0aGUgbmV3LXN0eWxlIGhhc2hlZCBsb2dpbiB0b2tlbiwgdG8gYXZvaWRcbiAgLy8gc2VuZGluZyB0aGUgdW5oYXNoZWQgdG9rZW4gdG8gdGhlIGRhdGFiYXNlIGluIGEgcXVlcnkgaWYgd2UgZG9uJ3RcbiAgLy8gbmVlZCB0by5cbiAgdmFyIHVzZXIgPSBhY2NvdW50cy51c2Vycy5maW5kT25lKFxuICAgIHtcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlbn0pO1xuXG4gIGlmICghIHVzZXIpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCB0aGUgaGFzaGVkIGxvZ2luIHRva2VuLCB0cnkgYWxzbyBsb29raW5nIGZvclxuICAgIC8vIHRoZSBvbGQtc3R5bGUgdW5oYXNoZWQgdG9rZW4uICBCdXQgd2UgbmVlZCB0byBsb29rIGZvciBlaXRoZXJcbiAgICAvLyB0aGUgb2xkLXN0eWxlIHRva2VuIE9SIHRoZSBuZXctc3R5bGUgdG9rZW4sIGJlY2F1c2UgYW5vdGhlclxuICAgIC8vIGNsaWVudCBjb25uZWN0aW9uIGxvZ2dpbmcgaW4gc2ltdWx0YW5lb3VzbHkgbWlnaHQgaGF2ZSBhbHJlYWR5XG4gICAgLy8gY29udmVydGVkIHRoZSB0b2tlbi5cbiAgICB1c2VyID0gYWNjb3VudHMudXNlcnMuZmluZE9uZSh7XG4gICAgICAkb3I6IFtcbiAgICAgICAge1wic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuXCI6IGhhc2hlZFRva2VufSxcbiAgICAgICAge1wic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLnRva2VuXCI6IG9wdGlvbnMucmVzdW1lfVxuICAgICAgXVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKCEgdXNlcilcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIllvdSd2ZSBiZWVuIGxvZ2dlZCBvdXQgYnkgdGhlIHNlcnZlci4gUGxlYXNlIGxvZyBpbiBhZ2Fpbi5cIilcbiAgICB9O1xuXG4gIC8vIEZpbmQgdGhlIHRva2VuLCB3aGljaCB3aWxsIGVpdGhlciBiZSBhbiBvYmplY3Qgd2l0aCBmaWVsZHNcbiAgLy8ge2hhc2hlZFRva2VuLCB3aGVufSBmb3IgYSBoYXNoZWQgdG9rZW4gb3Ige3Rva2VuLCB3aGVufSBmb3IgYW5cbiAgLy8gdW5oYXNoZWQgdG9rZW4uXG4gIHZhciBvbGRVbmhhc2hlZFN0eWxlVG9rZW47XG4gIHZhciB0b2tlbiA9IF8uZmluZCh1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2VucywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgcmV0dXJuIHRva2VuLmhhc2hlZFRva2VuID09PSBoYXNoZWRUb2tlbjtcbiAgfSk7XG4gIGlmICh0b2tlbikge1xuICAgIG9sZFVuaGFzaGVkU3R5bGVUb2tlbiA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRva2VuID0gXy5maW5kKHVzZXIuc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgIHJldHVybiB0b2tlbi50b2tlbiA9PT0gb3B0aW9ucy5yZXN1bWU7XG4gICAgfSk7XG4gICAgb2xkVW5oYXNoZWRTdHlsZVRva2VuID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciB0b2tlbkV4cGlyZXMgPSBhY2NvdW50cy5fdG9rZW5FeHBpcmF0aW9uKHRva2VuLndoZW4pO1xuICBpZiAobmV3IERhdGUoKSA+PSB0b2tlbkV4cGlyZXMpXG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiWW91ciBzZXNzaW9uIGhhcyBleHBpcmVkLiBQbGVhc2UgbG9nIGluIGFnYWluLlwiKVxuICAgIH07XG5cbiAgLy8gVXBkYXRlIHRvIGEgaGFzaGVkIHRva2VuIHdoZW4gYW4gdW5oYXNoZWQgdG9rZW4gaXMgZW5jb3VudGVyZWQuXG4gIGlmIChvbGRVbmhhc2hlZFN0eWxlVG9rZW4pIHtcbiAgICAvLyBPbmx5IGFkZCB0aGUgbmV3IGhhc2hlZCB0b2tlbiBpZiB0aGUgb2xkIHVuaGFzaGVkIHRva2VuIHN0aWxsXG4gICAgLy8gZXhpc3RzICh0aGlzIGF2b2lkcyByZXN1cnJlY3RpbmcgdGhlIHRva2VuIGlmIGl0IHdhcyBkZWxldGVkXG4gICAgLy8gYWZ0ZXIgd2UgcmVhZCBpdCkuICBVc2luZyAkYWRkVG9TZXQgYXZvaWRzIGdldHRpbmcgYW4gaW5kZXhcbiAgICAvLyBlcnJvciBpZiBhbm90aGVyIGNsaWVudCBsb2dnaW5nIGluIHNpbXVsdGFuZW91c2x5IGhhcyBhbHJlYWR5XG4gICAgLy8gaW5zZXJ0ZWQgdGhlIG5ldyBoYXNoZWQgdG9rZW4uXG4gICAgYWNjb3VudHMudXNlcnMudXBkYXRlKFxuICAgICAge1xuICAgICAgICBfaWQ6IHVzZXIuX2lkLFxuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy50b2tlblwiOiBvcHRpb25zLnJlc3VtZVxuICAgICAgfSxcbiAgICAgIHskYWRkVG9TZXQ6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjoge1xuICAgICAgICAgIFwiaGFzaGVkVG9rZW5cIjogaGFzaGVkVG9rZW4sXG4gICAgICAgICAgXCJ3aGVuXCI6IHRva2VuLndoZW5cbiAgICAgICAgfVxuICAgICAgfX1cbiAgICApO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBvbGQgdG9rZW4gKmFmdGVyKiBhZGRpbmcgdGhlIG5ldywgc2luY2Ugb3RoZXJ3aXNlXG4gICAgLy8gYW5vdGhlciBjbGllbnQgdHJ5aW5nIHRvIGxvZ2luIGJldHdlZW4gb3VyIHJlbW92aW5nIHRoZSBvbGQgYW5kXG4gICAgLy8gYWRkaW5nIHRoZSBuZXcgd291bGRuJ3QgZmluZCBhIHRva2VuIHRvIGxvZ2luIHdpdGguXG4gICAgYWNjb3VudHMudXNlcnMudXBkYXRlKHVzZXIuX2lkLCB7XG4gICAgICAkcHVsbDoge1xuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiB7IFwidG9rZW5cIjogb3B0aW9ucy5yZXN1bWUgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgIHN0YW1wZWRMb2dpblRva2VuOiB7XG4gICAgICB0b2tlbjogb3B0aW9ucy5yZXN1bWUsXG4gICAgICB3aGVuOiB0b2tlbi53aGVuXG4gICAgfVxuICB9O1xufVxuXG4vLyAoQWxzbyB1c2VkIGJ5IE1ldGVvciBBY2NvdW50cyBzZXJ2ZXIgYW5kIHRlc3RzKS5cbi8vXG5BcC5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0b2tlbjogUmFuZG9tLnNlY3JldCgpLFxuICAgIHdoZW46IG5ldyBEYXRlXG4gIH07XG59O1xuXG4vLy9cbi8vLyBUT0tFTiBFWFBJUkFUSU9OXG4vLy9cblxuZnVuY3Rpb24gZXhwaXJlUGFzc3dvcmRUb2tlbihhY2NvdW50cywgb2xkZXN0VmFsaWREYXRlLCB0b2tlbkZpbHRlciwgdXNlcklkKSB7XG4gIGNvbnN0IHVzZXJGaWx0ZXIgPSB1c2VySWQgPyB7X2lkOiB1c2VySWR9IDoge307XG4gIGNvbnN0IHJlc2V0UmFuZ2VPciA9IHtcbiAgICAkb3I6IFtcbiAgICAgIHsgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC53aGVuXCI6IHsgJGx0OiBvbGRlc3RWYWxpZERhdGUgfSB9LFxuICAgICAgeyBcInNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LndoZW5cIjogeyAkbHQ6ICtvbGRlc3RWYWxpZERhdGUgfSB9XG4gICAgXVxuICB9O1xuICBjb25zdCBleHBpcmVGaWx0ZXIgPSB7ICRhbmQ6IFt0b2tlbkZpbHRlciwgcmVzZXRSYW5nZU9yXSB9O1xuXG4gIGFjY291bnRzLnVzZXJzLnVwZGF0ZSh7Li4udXNlckZpbHRlciwgLi4uZXhwaXJlRmlsdGVyfSwge1xuICAgICR1bnNldDoge1xuICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldFwiOiBcIlwiXG4gICAgfVxuICB9LCB7IG11bHRpOiB0cnVlIH0pO1xufVxuXG4vLyBEZWxldGVzIGV4cGlyZWQgdG9rZW5zIGZyb20gdGhlIGRhdGFiYXNlIGFuZCBjbG9zZXMgYWxsIG9wZW4gY29ubmVjdGlvbnNcbi8vIGFzc29jaWF0ZWQgd2l0aCB0aGVzZSB0b2tlbnMuXG4vL1xuLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLiBBbHNvLCB0aGUgYXJndW1lbnRzIGFyZSBvbmx5IHVzZWQgYnlcbi8vIHRlc3RzLiBvbGRlc3RWYWxpZERhdGUgaXMgc2ltdWxhdGUgZXhwaXJpbmcgdG9rZW5zIHdpdGhvdXQgd2FpdGluZ1xuLy8gZm9yIHRoZW0gdG8gYWN0dWFsbHkgZXhwaXJlLiB1c2VySWQgaXMgdXNlZCBieSB0ZXN0cyB0byBvbmx5IGV4cGlyZVxuLy8gdG9rZW5zIGZvciB0aGUgdGVzdCB1c2VyLlxuQXAuX2V4cGlyZVRva2VucyA9IGZ1bmN0aW9uIChvbGRlc3RWYWxpZERhdGUsIHVzZXJJZCkge1xuICB2YXIgdG9rZW5MaWZldGltZU1zID0gdGhpcy5fZ2V0VG9rZW5MaWZldGltZU1zKCk7XG5cbiAgLy8gd2hlbiBjYWxsaW5nIGZyb20gYSB0ZXN0IHdpdGggZXh0cmEgYXJndW1lbnRzLCB5b3UgbXVzdCBzcGVjaWZ5IGJvdGghXG4gIGlmICgob2xkZXN0VmFsaWREYXRlICYmICF1c2VySWQpIHx8ICghb2xkZXN0VmFsaWREYXRlICYmIHVzZXJJZCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgdGVzdC4gTXVzdCBzcGVjaWZ5IGJvdGggb2xkZXN0VmFsaWREYXRlIGFuZCB1c2VySWQuXCIpO1xuICB9XG5cbiAgb2xkZXN0VmFsaWREYXRlID0gb2xkZXN0VmFsaWREYXRlIHx8XG4gICAgKG5ldyBEYXRlKG5ldyBEYXRlKCkgLSB0b2tlbkxpZmV0aW1lTXMpKTtcbiAgdmFyIHVzZXJGaWx0ZXIgPSB1c2VySWQgPyB7X2lkOiB1c2VySWR9IDoge307XG5cblxuICAvLyBCYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIG9sZGVyIHZlcnNpb25zIG9mIG1ldGVvciB0aGF0IHN0b3JlZCBsb2dpbiB0b2tlblxuICAvLyB0aW1lc3RhbXBzIGFzIG51bWJlcnMuXG4gIHRoaXMudXNlcnMudXBkYXRlKF8uZXh0ZW5kKHVzZXJGaWx0ZXIsIHtcbiAgICAkb3I6IFtcbiAgICAgIHsgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMud2hlblwiOiB7ICRsdDogb2xkZXN0VmFsaWREYXRlIH0gfSxcbiAgICAgIHsgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMud2hlblwiOiB7ICRsdDogK29sZGVzdFZhbGlkRGF0ZSB9IH1cbiAgICBdXG4gIH0pLCB7XG4gICAgJHB1bGw6IHtcbiAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHtcbiAgICAgICAgJG9yOiBbXG4gICAgICAgICAgeyB3aGVuOiB7ICRsdDogb2xkZXN0VmFsaWREYXRlIH0gfSxcbiAgICAgICAgICB7IHdoZW46IHsgJGx0OiArb2xkZXN0VmFsaWREYXRlIH0gfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfVxuICB9LCB7IG11bHRpOiB0cnVlIH0pO1xuICAvLyBUaGUgb2JzZXJ2ZSBvbiBNZXRlb3IudXNlcnMgd2lsbCB0YWtlIGNhcmUgb2YgY2xvc2luZyBjb25uZWN0aW9ucyBmb3JcbiAgLy8gZXhwaXJlZCB0b2tlbnMuXG59O1xuXG4vLyBEZWxldGVzIGV4cGlyZWQgcGFzc3dvcmQgcmVzZXQgdG9rZW5zIGZyb20gdGhlIGRhdGFiYXNlLlxuLy9cbi8vIEV4cG9ydGVkIGZvciB0ZXN0cy4gQWxzbywgdGhlIGFyZ3VtZW50cyBhcmUgb25seSB1c2VkIGJ5XG4vLyB0ZXN0cy4gb2xkZXN0VmFsaWREYXRlIGlzIHNpbXVsYXRlIGV4cGlyaW5nIHRva2VucyB3aXRob3V0IHdhaXRpbmdcbi8vIGZvciB0aGVtIHRvIGFjdHVhbGx5IGV4cGlyZS4gdXNlcklkIGlzIHVzZWQgYnkgdGVzdHMgdG8gb25seSBleHBpcmVcbi8vIHRva2VucyBmb3IgdGhlIHRlc3QgdXNlci5cbkFwLl9leHBpcmVQYXNzd29yZFJlc2V0VG9rZW5zID0gZnVuY3Rpb24gKG9sZGVzdFZhbGlkRGF0ZSwgdXNlcklkKSB7XG4gIHZhciB0b2tlbkxpZmV0aW1lTXMgPSB0aGlzLl9nZXRQYXNzd29yZFJlc2V0VG9rZW5MaWZldGltZU1zKCk7XG5cbiAgLy8gd2hlbiBjYWxsaW5nIGZyb20gYSB0ZXN0IHdpdGggZXh0cmEgYXJndW1lbnRzLCB5b3UgbXVzdCBzcGVjaWZ5IGJvdGghXG4gIGlmICgob2xkZXN0VmFsaWREYXRlICYmICF1c2VySWQpIHx8ICghb2xkZXN0VmFsaWREYXRlICYmIHVzZXJJZCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgdGVzdC4gTXVzdCBzcGVjaWZ5IGJvdGggb2xkZXN0VmFsaWREYXRlIGFuZCB1c2VySWQuXCIpO1xuICB9XG5cbiAgb2xkZXN0VmFsaWREYXRlID0gb2xkZXN0VmFsaWREYXRlIHx8XG4gICAgKG5ldyBEYXRlKG5ldyBEYXRlKCkgLSB0b2tlbkxpZmV0aW1lTXMpKTtcblxuICB2YXIgdG9rZW5GaWx0ZXIgPSB7XG4gICAgJG9yOiBbXG4gICAgICB7IFwic2VydmljZXMucGFzc3dvcmQucmVzZXQucmVhc29uXCI6IFwicmVzZXRcIn0sXG4gICAgICB7IFwic2VydmljZXMucGFzc3dvcmQucmVzZXQucmVhc29uXCI6IHskZXhpc3RzOiBmYWxzZX19XG4gICAgXVxuICB9O1xuXG4gIGV4cGlyZVBhc3N3b3JkVG9rZW4odGhpcywgb2xkZXN0VmFsaWREYXRlLCB0b2tlbkZpbHRlciwgdXNlcklkKTtcbn1cblxuLy8gRGVsZXRlcyBleHBpcmVkIHBhc3N3b3JkIGVucm9sbCB0b2tlbnMgZnJvbSB0aGUgZGF0YWJhc2UuXG4vL1xuLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLiBBbHNvLCB0aGUgYXJndW1lbnRzIGFyZSBvbmx5IHVzZWQgYnlcbi8vIHRlc3RzLiBvbGRlc3RWYWxpZERhdGUgaXMgc2ltdWxhdGUgZXhwaXJpbmcgdG9rZW5zIHdpdGhvdXQgd2FpdGluZ1xuLy8gZm9yIHRoZW0gdG8gYWN0dWFsbHkgZXhwaXJlLiB1c2VySWQgaXMgdXNlZCBieSB0ZXN0cyB0byBvbmx5IGV4cGlyZVxuLy8gdG9rZW5zIGZvciB0aGUgdGVzdCB1c2VyLlxuQXAuX2V4cGlyZVBhc3N3b3JkRW5yb2xsVG9rZW5zID0gZnVuY3Rpb24gKG9sZGVzdFZhbGlkRGF0ZSwgdXNlcklkKSB7XG4gIHZhciB0b2tlbkxpZmV0aW1lTXMgPSB0aGlzLl9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpO1xuXG4gIC8vIHdoZW4gY2FsbGluZyBmcm9tIGEgdGVzdCB3aXRoIGV4dHJhIGFyZ3VtZW50cywgeW91IG11c3Qgc3BlY2lmeSBib3RoIVxuICBpZiAoKG9sZGVzdFZhbGlkRGF0ZSAmJiAhdXNlcklkKSB8fCAoIW9sZGVzdFZhbGlkRGF0ZSAmJiB1c2VySWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIHRlc3QuIE11c3Qgc3BlY2lmeSBib3RoIG9sZGVzdFZhbGlkRGF0ZSBhbmQgdXNlcklkLlwiKTtcbiAgfVxuXG4gIG9sZGVzdFZhbGlkRGF0ZSA9IG9sZGVzdFZhbGlkRGF0ZSB8fFxuICAgIChuZXcgRGF0ZShuZXcgRGF0ZSgpIC0gdG9rZW5MaWZldGltZU1zKSk7XG5cbiAgdmFyIHRva2VuRmlsdGVyID0ge1xuICAgIFwic2VydmljZXMucGFzc3dvcmQucmVzZXQucmVhc29uXCI6IFwiZW5yb2xsXCJcbiAgfTtcblxuICBleHBpcmVQYXNzd29yZFRva2VuKHRoaXMsIG9sZGVzdFZhbGlkRGF0ZSwgdG9rZW5GaWx0ZXIsIHVzZXJJZCk7XG59XG5cbi8vIEBvdmVycmlkZSBmcm9tIGFjY291bnRzX2NvbW1vbi5qc1xuQXAuY29uZmlnID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgLy8gQ2FsbCB0aGUgb3ZlcnJpZGRlbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgbWV0aG9kLlxuICB2YXIgc3VwZXJSZXN1bHQgPSBBY2NvdW50c0NvbW1vbi5wcm90b3R5cGUuY29uZmlnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgLy8gSWYgdGhlIHVzZXIgc2V0IGxvZ2luRXhwaXJhdGlvbkluRGF5cyB0byBudWxsLCB0aGVuIHdlIG5lZWQgdG8gY2xlYXIgdGhlXG4gIC8vIHRpbWVyIHRoYXQgcGVyaW9kaWNhbGx5IGV4cGlyZXMgdG9rZW5zLlxuICBpZiAoXy5oYXModGhpcy5fb3B0aW9ucywgXCJsb2dpbkV4cGlyYXRpb25JbkRheXNcIikgJiZcbiAgICAgIHRoaXMuX29wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzID09PSBudWxsICYmXG4gICAgICB0aGlzLmV4cGlyZVRva2VuSW50ZXJ2YWwpIHtcbiAgICBNZXRlb3IuY2xlYXJJbnRlcnZhbCh0aGlzLmV4cGlyZVRva2VuSW50ZXJ2YWwpO1xuICAgIHRoaXMuZXhwaXJlVG9rZW5JbnRlcnZhbCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gc3VwZXJSZXN1bHQ7XG59O1xuXG5mdW5jdGlvbiBzZXRFeHBpcmVUb2tlbnNJbnRlcnZhbChhY2NvdW50cykge1xuICBhY2NvdW50cy5leHBpcmVUb2tlbkludGVydmFsID0gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBhY2NvdW50cy5fZXhwaXJlVG9rZW5zKCk7XG4gICAgYWNjb3VudHMuX2V4cGlyZVBhc3N3b3JkUmVzZXRUb2tlbnMoKTtcbiAgICBhY2NvdW50cy5fZXhwaXJlUGFzc3dvcmRFbnJvbGxUb2tlbnMoKTtcbiAgfSwgRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyk7XG59XG5cblxuLy8vXG4vLy8gT0F1dGggRW5jcnlwdGlvbiBTdXBwb3J0XG4vLy9cblxudmFyIE9BdXRoRW5jcnlwdGlvbiA9XG4gIFBhY2thZ2VbXCJvYXV0aC1lbmNyeXB0aW9uXCJdICYmXG4gIFBhY2thZ2VbXCJvYXV0aC1lbmNyeXB0aW9uXCJdLk9BdXRoRW5jcnlwdGlvbjtcblxuZnVuY3Rpb24gdXNpbmdPQXV0aEVuY3J5cHRpb24oKSB7XG4gIHJldHVybiBPQXV0aEVuY3J5cHRpb24gJiYgT0F1dGhFbmNyeXB0aW9uLmtleUlzTG9hZGVkKCk7XG59XG5cblxuLy8gT0F1dGggc2VydmljZSBkYXRhIGlzIHRlbXBvcmFyaWx5IHN0b3JlZCBpbiB0aGUgcGVuZGluZyBjcmVkZW50aWFsc1xuLy8gY29sbGVjdGlvbiBkdXJpbmcgdGhlIG9hdXRoIGF1dGhlbnRpY2F0aW9uIHByb2Nlc3MuICBTZW5zaXRpdmUgZGF0YVxuLy8gc3VjaCBhcyBhY2Nlc3MgdG9rZW5zIGFyZSBlbmNyeXB0ZWQgd2l0aG91dCB0aGUgdXNlciBpZCBiZWNhdXNlXG4vLyB3ZSBkb24ndCBrbm93IHRoZSB1c2VyIGlkIHlldC4gIFdlIHJlLWVuY3J5cHQgdGhlc2UgZmllbGRzIHdpdGggdGhlXG4vLyB1c2VyIGlkIGluY2x1ZGVkIHdoZW4gc3RvcmluZyB0aGUgc2VydmljZSBkYXRhIHBlcm1hbmVudGx5IGluXG4vLyB0aGUgdXNlcnMgY29sbGVjdGlvbi5cbi8vXG5mdW5jdGlvbiBwaW5FbmNyeXB0ZWRGaWVsZHNUb1VzZXIoc2VydmljZURhdGEsIHVzZXJJZCkge1xuICBfLmVhY2goXy5rZXlzKHNlcnZpY2VEYXRhKSwgZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciB2YWx1ZSA9IHNlcnZpY2VEYXRhW2tleV07XG4gICAgaWYgKE9BdXRoRW5jcnlwdGlvbiAmJiBPQXV0aEVuY3J5cHRpb24uaXNTZWFsZWQodmFsdWUpKVxuICAgICAgdmFsdWUgPSBPQXV0aEVuY3J5cHRpb24uc2VhbChPQXV0aEVuY3J5cHRpb24ub3Blbih2YWx1ZSksIHVzZXJJZCk7XG4gICAgc2VydmljZURhdGFba2V5XSA9IHZhbHVlO1xuICB9KTtcbn1cblxuXG4vLyBFbmNyeXB0IHVuZW5jcnlwdGVkIGxvZ2luIHNlcnZpY2Ugc2VjcmV0cyB3aGVuIG9hdXRoLWVuY3J5cHRpb24gaXNcbi8vIGFkZGVkLlxuLy9cbi8vIFhYWCBGb3IgdGhlIG9hdXRoU2VjcmV0S2V5IHRvIGJlIGF2YWlsYWJsZSBoZXJlIGF0IHN0YXJ0dXAsIHRoZVxuLy8gZGV2ZWxvcGVyIG11c3QgY2FsbCBBY2NvdW50cy5jb25maWcoe29hdXRoU2VjcmV0S2V5OiAuLi59KSBhdCBsb2FkXG4vLyB0aW1lLCBpbnN0ZWFkIG9mIGluIGEgTWV0ZW9yLnN0YXJ0dXAgYmxvY2ssIGJlY2F1c2UgdGhlIHN0YXJ0dXBcbi8vIGJsb2NrIGluIHRoZSBhcHAgY29kZSB3aWxsIHJ1biBhZnRlciB0aGlzIGFjY291bnRzLWJhc2Ugc3RhcnR1cFxuLy8gYmxvY2suICBQZXJoYXBzIHdlIG5lZWQgYSBwb3N0LXN0YXJ0dXAgY2FsbGJhY2s/XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgaWYgKCEgdXNpbmdPQXV0aEVuY3J5cHRpb24oKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBTZXJ2aWNlQ29uZmlndXJhdGlvbiA9XG4gICAgUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ10uU2VydmljZUNvbmZpZ3VyYXRpb247XG5cbiAgU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMuZmluZCh7XG4gICAgJGFuZDogW3tcbiAgICAgIHNlY3JldDogeyAkZXhpc3RzOiB0cnVlIH1cbiAgICB9LCB7XG4gICAgICBcInNlY3JldC5hbGdvcml0aG1cIjogeyAkZXhpc3RzOiBmYWxzZSB9XG4gICAgfV1cbiAgfSkuZm9yRWFjaChmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBkYXRlKGNvbmZpZy5faWQsIHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgc2VjcmV0OiBPQXV0aEVuY3J5cHRpb24uc2VhbChjb25maWcuc2VjcmV0KVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pO1xuXG4vLyBYWFggc2VlIGNvbW1lbnQgb24gQWNjb3VudHMuY3JlYXRlVXNlciBpbiBwYXNzd29yZHNfc2VydmVyIGFib3V0IGFkZGluZyBhXG4vLyBzZWNvbmQgXCJzZXJ2ZXIgb3B0aW9uc1wiIGFyZ3VtZW50LlxuZnVuY3Rpb24gZGVmYXVsdENyZWF0ZVVzZXJIb29rKG9wdGlvbnMsIHVzZXIpIHtcbiAgaWYgKG9wdGlvbnMucHJvZmlsZSlcbiAgICB1c2VyLnByb2ZpbGUgPSBvcHRpb25zLnByb2ZpbGU7XG4gIHJldHVybiB1c2VyO1xufVxuXG4vLyBDYWxsZWQgYnkgYWNjb3VudHMtcGFzc3dvcmRcbkFwLmluc2VydFVzZXJEb2MgPSBmdW5jdGlvbiAob3B0aW9ucywgdXNlcikge1xuICAvLyAtIGNsb25lIHVzZXIgZG9jdW1lbnQsIHRvIHByb3RlY3QgZnJvbSBtb2RpZmljYXRpb25cbiAgLy8gLSBhZGQgY3JlYXRlZEF0IHRpbWVzdGFtcFxuICAvLyAtIHByZXBhcmUgYW4gX2lkLCBzbyB0aGF0IHlvdSBjYW4gbW9kaWZ5IG90aGVyIGNvbGxlY3Rpb25zIChlZ1xuICAvLyBjcmVhdGUgYSBmaXJzdCB0YXNrIGZvciBldmVyeSBuZXcgdXNlcilcbiAgLy9cbiAgLy8gWFhYIElmIHRoZSBvbkNyZWF0ZVVzZXIgb3IgdmFsaWRhdGVOZXdVc2VyIGhvb2tzIGZhaWwsIHdlIG1pZ2h0XG4gIC8vIGVuZCB1cCBoYXZpbmcgbW9kaWZpZWQgc29tZSBvdGhlciBjb2xsZWN0aW9uXG4gIC8vIGluYXBwcm9wcmlhdGVseS4gVGhlIHNvbHV0aW9uIGlzIHByb2JhYmx5IHRvIGhhdmUgb25DcmVhdGVVc2VyXG4gIC8vIGFjY2VwdCB0d28gY2FsbGJhY2tzIC0gb25lIHRoYXQgZ2V0cyBjYWxsZWQgYmVmb3JlIGluc2VydGluZ1xuICAvLyB0aGUgdXNlciBkb2N1bWVudCAoaW4gd2hpY2ggeW91IGNhbiBtb2RpZnkgaXRzIGNvbnRlbnRzKSwgYW5kXG4gIC8vIG9uZSB0aGF0IGdldHMgY2FsbGVkIGFmdGVyIChpbiB3aGljaCB5b3Ugc2hvdWxkIGNoYW5nZSBvdGhlclxuICAvLyBjb2xsZWN0aW9ucylcbiAgdXNlciA9IF8uZXh0ZW5kKHtcbiAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgX2lkOiBSYW5kb20uaWQoKVxuICB9LCB1c2VyKTtcblxuICBpZiAodXNlci5zZXJ2aWNlcykge1xuICAgIF8uZWFjaCh1c2VyLnNlcnZpY2VzLCBmdW5jdGlvbiAoc2VydmljZURhdGEpIHtcbiAgICAgIHBpbkVuY3J5cHRlZEZpZWxkc1RvVXNlcihzZXJ2aWNlRGF0YSwgdXNlci5faWQpO1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIGZ1bGxVc2VyO1xuICBpZiAodGhpcy5fb25DcmVhdGVVc2VySG9vaykge1xuICAgIGZ1bGxVc2VyID0gdGhpcy5fb25DcmVhdGVVc2VySG9vayhvcHRpb25zLCB1c2VyKTtcblxuICAgIC8vIFRoaXMgaXMgKm5vdCogcGFydCBvZiB0aGUgQVBJLiBXZSBuZWVkIHRoaXMgYmVjYXVzZSB3ZSBjYW4ndCBpc29sYXRlXG4gICAgLy8gdGhlIGdsb2JhbCBzZXJ2ZXIgZW52aXJvbm1lbnQgYmV0d2VlbiB0ZXN0cywgbWVhbmluZyB3ZSBjYW4ndCB0ZXN0XG4gICAgLy8gYm90aCBoYXZpbmcgYSBjcmVhdGUgdXNlciBob29rIHNldCBhbmQgbm90IGhhdmluZyBvbmUgc2V0LlxuICAgIGlmIChmdWxsVXNlciA9PT0gJ1RFU1QgREVGQVVMVCBIT09LJylcbiAgICAgIGZ1bGxVc2VyID0gZGVmYXVsdENyZWF0ZVVzZXJIb29rKG9wdGlvbnMsIHVzZXIpO1xuICB9IGVsc2Uge1xuICAgIGZ1bGxVc2VyID0gZGVmYXVsdENyZWF0ZVVzZXJIb29rKG9wdGlvbnMsIHVzZXIpO1xuICB9XG5cbiAgXy5lYWNoKHRoaXMuX3ZhbGlkYXRlTmV3VXNlckhvb2tzLCBmdW5jdGlvbiAoaG9vaykge1xuICAgIGlmICghIGhvb2soZnVsbFVzZXIpKVxuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciB2YWxpZGF0aW9uIGZhaWxlZFwiKTtcbiAgfSk7XG5cbiAgdmFyIHVzZXJJZDtcbiAgdHJ5IHtcbiAgICB1c2VySWQgPSB0aGlzLnVzZXJzLmluc2VydChmdWxsVXNlcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBYWFggc3RyaW5nIHBhcnNpbmcgc3Vja3MsIG1heWJlXG4gICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMzA2OSB3aWxsIGdldCBmaXhlZCBvbmUgZGF5XG4gICAgaWYgKGUubmFtZSAhPT0gJ01vbmdvRXJyb3InKSB0aHJvdyBlO1xuICAgIGlmIChlLmNvZGUgIT09IDExMDAwKSB0aHJvdyBlO1xuICAgIGlmIChlLmVycm1zZy5pbmRleE9mKCdlbWFpbHMuYWRkcmVzcycpICE9PSAtMSlcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIkVtYWlsIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICBpZiAoZS5lcnJtc2cuaW5kZXhPZigndXNlcm5hbWUnKSAhPT0gLTEpXG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJVc2VybmFtZSBhbHJlYWR5IGV4aXN0cy5cIik7XG4gICAgLy8gWFhYIGJldHRlciBlcnJvciByZXBvcnRpbmcgZm9yIHNlcnZpY2VzLmZhY2Vib29rLmlkIGR1cGxpY2F0ZSwgZXRjXG4gICAgdGhyb3cgZTtcbiAgfVxuICByZXR1cm4gdXNlcklkO1xufTtcblxuLy8gSGVscGVyIGZ1bmN0aW9uOiByZXR1cm5zIGZhbHNlIGlmIGVtYWlsIGRvZXMgbm90IG1hdGNoIGNvbXBhbnkgZG9tYWluIGZyb21cbi8vIHRoZSBjb25maWd1cmF0aW9uLlxuQXAuX3Rlc3RFbWFpbERvbWFpbiA9IGZ1bmN0aW9uIChlbWFpbCkge1xuICB2YXIgZG9tYWluID0gdGhpcy5fb3B0aW9ucy5yZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbjtcbiAgcmV0dXJuICFkb21haW4gfHxcbiAgICAoXy5pc0Z1bmN0aW9uKGRvbWFpbikgJiYgZG9tYWluKGVtYWlsKSkgfHxcbiAgICAoXy5pc1N0cmluZyhkb21haW4pICYmXG4gICAgICAobmV3IFJlZ0V4cCgnQCcgKyBNZXRlb3IuX2VzY2FwZVJlZ0V4cChkb21haW4pICsgJyQnLCAnaScpKS50ZXN0KGVtYWlsKSk7XG59O1xuXG4vLyBWYWxpZGF0ZSBuZXcgdXNlcidzIGVtYWlsIG9yIEdvb2dsZS9GYWNlYm9vay9HaXRIdWIgYWNjb3VudCdzIGVtYWlsXG5mdW5jdGlvbiBkZWZhdWx0VmFsaWRhdGVOZXdVc2VySG9vayh1c2VyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGRvbWFpbiA9IHNlbGYuX29wdGlvbnMucmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW47XG4gIGlmICghZG9tYWluKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHZhciBlbWFpbElzR29vZCA9IGZhbHNlO1xuICBpZiAoIV8uaXNFbXB0eSh1c2VyLmVtYWlscykpIHtcbiAgICBlbWFpbElzR29vZCA9IF8uYW55KHVzZXIuZW1haWxzLCBmdW5jdGlvbiAoZW1haWwpIHtcbiAgICAgIHJldHVybiBzZWxmLl90ZXN0RW1haWxEb21haW4oZW1haWwuYWRkcmVzcyk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIV8uaXNFbXB0eSh1c2VyLnNlcnZpY2VzKSkge1xuICAgIC8vIEZpbmQgYW55IGVtYWlsIG9mIGFueSBzZXJ2aWNlIGFuZCBjaGVjayBpdFxuICAgIGVtYWlsSXNHb29kID0gXy5hbnkodXNlci5zZXJ2aWNlcywgZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgICAgIHJldHVybiBzZXJ2aWNlLmVtYWlsICYmIHNlbGYuX3Rlc3RFbWFpbERvbWFpbihzZXJ2aWNlLmVtYWlsKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChlbWFpbElzR29vZClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoXy5pc1N0cmluZyhkb21haW4pKVxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIkBcIiArIGRvbWFpbiArIFwiIGVtYWlsIHJlcXVpcmVkXCIpO1xuICBlbHNlXG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiRW1haWwgZG9lc24ndCBtYXRjaCB0aGUgY3JpdGVyaWEuXCIpO1xufVxuXG4vLy9cbi8vLyBNQU5BR0lORyBVU0VSIE9CSkVDVFNcbi8vL1xuXG4vLyBVcGRhdGVzIG9yIGNyZWF0ZXMgYSB1c2VyIGFmdGVyIHdlIGF1dGhlbnRpY2F0ZSB3aXRoIGEgM3JkIHBhcnR5LlxuLy9cbi8vIEBwYXJhbSBzZXJ2aWNlTmFtZSB7U3RyaW5nfSBTZXJ2aWNlIG5hbWUgKGVnLCB0d2l0dGVyKS5cbi8vIEBwYXJhbSBzZXJ2aWNlRGF0YSB7T2JqZWN0fSBEYXRhIHRvIHN0b3JlIGluIHRoZSB1c2VyJ3MgcmVjb3JkXG4vLyAgICAgICAgdW5kZXIgc2VydmljZXNbc2VydmljZU5hbWVdLiBNdXN0IGluY2x1ZGUgYW4gXCJpZFwiIGZpZWxkXG4vLyAgICAgICAgd2hpY2ggaXMgYSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHVzZXIgaW4gdGhlIHNlcnZpY2UuXG4vLyBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0LCBvcHRpb25hbH0gT3RoZXIgb3B0aW9ucyB0byBwYXNzIHRvIGluc2VydFVzZXJEb2Ncbi8vICAgICAgICAoZWcsIHByb2ZpbGUpXG4vLyBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB0b2tlbiBhbmQgaWQga2V5cywgbGlrZSB0aGUgcmVzdWx0XG4vLyAgICAgICAgb2YgdGhlIFwibG9naW5cIiBtZXRob2QuXG4vL1xuQXAudXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSA9IGZ1bmN0aW9uIChcbiAgc2VydmljZU5hbWUsXG4gIHNlcnZpY2VEYXRhLFxuICBvcHRpb25zXG4pIHtcbiAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucyB8fCB7fSk7XG5cbiAgaWYgKHNlcnZpY2VOYW1lID09PSBcInBhc3N3b3JkXCIgfHwgc2VydmljZU5hbWUgPT09IFwicmVzdW1lXCIpXG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJDYW4ndCB1c2UgdXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSB3aXRoIGludGVybmFsIHNlcnZpY2UgXCJcbiAgICAgICAgKyBzZXJ2aWNlTmFtZSk7XG4gIGlmICghXy5oYXMoc2VydmljZURhdGEsICdpZCcpKVxuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiU2VydmljZSBkYXRhIGZvciBzZXJ2aWNlIFwiICsgc2VydmljZU5hbWUgKyBcIiBtdXN0IGluY2x1ZGUgaWRcIik7XG5cbiAgLy8gTG9vayBmb3IgYSB1c2VyIHdpdGggdGhlIGFwcHJvcHJpYXRlIHNlcnZpY2UgdXNlciBpZC5cbiAgdmFyIHNlbGVjdG9yID0ge307XG4gIHZhciBzZXJ2aWNlSWRLZXkgPSBcInNlcnZpY2VzLlwiICsgc2VydmljZU5hbWUgKyBcIi5pZFwiO1xuXG4gIC8vIFhYWCBUZW1wb3Jhcnkgc3BlY2lhbCBjYXNlIGZvciBUd2l0dGVyLiAoSXNzdWUgIzYyOSlcbiAgLy8gICBUaGUgc2VydmljZURhdGEuaWQgd2lsbCBiZSBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbiBpbnRlZ2VyLlxuICAvLyAgIFdlIHdhbnQgaXQgdG8gbWF0Y2ggZWl0aGVyIGEgc3RvcmVkIHN0cmluZyBvciBpbnQgcmVwcmVzZW50YXRpb24uXG4gIC8vICAgVGhpcyBpcyB0byBjYXRlciB0byBlYXJsaWVyIHZlcnNpb25zIG9mIE1ldGVvciBzdG9yaW5nIHR3aXR0ZXJcbiAgLy8gICB1c2VyIElEcyBpbiBudW1iZXIgZm9ybSwgYW5kIHJlY2VudCB2ZXJzaW9ucyBzdG9yaW5nIHRoZW0gYXMgc3RyaW5ncy5cbiAgLy8gICBUaGlzIGNhbiBiZSByZW1vdmVkIG9uY2UgbWlncmF0aW9uIHRlY2hub2xvZ3kgaXMgaW4gcGxhY2UsIGFuZCB0d2l0dGVyXG4gIC8vICAgdXNlcnMgc3RvcmVkIHdpdGggaW50ZWdlciBJRHMgaGF2ZSBiZWVuIG1pZ3JhdGVkIHRvIHN0cmluZyBJRHMuXG4gIGlmIChzZXJ2aWNlTmFtZSA9PT0gXCJ0d2l0dGVyXCIgJiYgIWlzTmFOKHNlcnZpY2VEYXRhLmlkKSkge1xuICAgIHNlbGVjdG9yW1wiJG9yXCJdID0gW3t9LHt9XTtcbiAgICBzZWxlY3RvcltcIiRvclwiXVswXVtzZXJ2aWNlSWRLZXldID0gc2VydmljZURhdGEuaWQ7XG4gICAgc2VsZWN0b3JbXCIkb3JcIl1bMV1bc2VydmljZUlkS2V5XSA9IHBhcnNlSW50KHNlcnZpY2VEYXRhLmlkLCAxMCk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZWN0b3Jbc2VydmljZUlkS2V5XSA9IHNlcnZpY2VEYXRhLmlkO1xuICB9XG5cbiAgdmFyIHVzZXIgPSB0aGlzLnVzZXJzLmZpbmRPbmUoc2VsZWN0b3IpO1xuXG4gIC8vIFdoZW4gY3JlYXRpbmcgYSBuZXcgdXNlciB3ZSBwYXNzIHRocm91Z2ggYWxsIG9wdGlvbnMuIFdoZW4gdXBkYXRpbmcgYW5cbiAgLy8gZXhpc3RpbmcgdXNlciwgYnkgZGVmYXVsdCB3ZSBvbmx5IHByb2Nlc3MvcGFzcyB0aHJvdWdoIHRoZSBzZXJ2aWNlRGF0YVxuICAvLyAoZWcsIHNvIHRoYXQgd2Uga2VlcCBhbiB1bmV4cGlyZWQgYWNjZXNzIHRva2VuIGFuZCBkb24ndCBjYWNoZSBvbGQgZW1haWxcbiAgLy8gYWRkcmVzc2VzIGluIHNlcnZpY2VEYXRhLmVtYWlsKS4gVGhlIG9uRXh0ZXJuYWxMb2dpbiBob29rIGNhbiBiZSB1c2VkIHdoZW5cbiAgLy8gY3JlYXRpbmcgb3IgdXBkYXRpbmcgYSB1c2VyLCB0byBtb2RpZnkgb3IgcGFzcyB0aHJvdWdoIG1vcmUgb3B0aW9ucyBhc1xuICAvLyBuZWVkZWQuXG4gIHZhciBvcHRzID0gdXNlciA/IHt9IDogb3B0aW9ucztcbiAgaWYgKHRoaXMuX29uRXh0ZXJuYWxMb2dpbkhvb2spIHtcbiAgICBvcHRzID0gdGhpcy5fb25FeHRlcm5hbExvZ2luSG9vayhvcHRpb25zLCB1c2VyKTtcbiAgfVxuXG4gIGlmICh1c2VyKSB7XG4gICAgcGluRW5jcnlwdGVkRmllbGRzVG9Vc2VyKHNlcnZpY2VEYXRhLCB1c2VyLl9pZCk7XG5cbiAgICB2YXIgc2V0QXR0cnMgPSB7fTtcbiAgICBfLmVhY2goc2VydmljZURhdGEsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICBzZXRBdHRyc1tcInNlcnZpY2VzLlwiICsgc2VydmljZU5hbWUgKyBcIi5cIiArIGtleV0gPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIC8vIFhYWCBNYXliZSB3ZSBzaG91bGQgcmUtdXNlIHRoZSBzZWxlY3RvciBhYm92ZSBhbmQgbm90aWNlIGlmIHRoZSB1cGRhdGVcbiAgICAvLyAgICAgdG91Y2hlcyBub3RoaW5nP1xuICAgIHNldEF0dHJzID0gXy5leHRlbmQoe30sIHNldEF0dHJzLCBvcHRzKTtcbiAgICB0aGlzLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwge1xuICAgICAgJHNldDogc2V0QXR0cnNcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBzZXJ2aWNlTmFtZSxcbiAgICAgIHVzZXJJZDogdXNlci5faWRcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSBhIG5ldyB1c2VyIHdpdGggdGhlIHNlcnZpY2UgZGF0YS5cbiAgICB1c2VyID0ge3NlcnZpY2VzOiB7fX07XG4gICAgdXNlci5zZXJ2aWNlc1tzZXJ2aWNlTmFtZV0gPSBzZXJ2aWNlRGF0YTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogc2VydmljZU5hbWUsXG4gICAgICB1c2VySWQ6IHRoaXMuaW5zZXJ0VXNlckRvYyhvcHRzLCB1c2VyKVxuICAgIH07XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNldHVwVXNlcnNDb2xsZWN0aW9uKHVzZXJzKSB7XG4gIC8vL1xuICAvLy8gUkVTVFJJQ1RJTkcgV1JJVEVTIFRPIFVTRVIgT0JKRUNUU1xuICAvLy9cbiAgdXNlcnMuYWxsb3coe1xuICAgIC8vIGNsaWVudHMgY2FuIG1vZGlmeSB0aGUgcHJvZmlsZSBmaWVsZCBvZiB0aGVpciBvd24gZG9jdW1lbnQsIGFuZFxuICAgIC8vIG5vdGhpbmcgZWxzZS5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uICh1c2VySWQsIHVzZXIsIGZpZWxkcywgbW9kaWZpZXIpIHtcbiAgICAgIC8vIG1ha2Ugc3VyZSBpdCBpcyBvdXIgcmVjb3JkXG4gICAgICBpZiAodXNlci5faWQgIT09IHVzZXJJZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAvLyB1c2VyIGNhbiBvbmx5IG1vZGlmeSB0aGUgJ3Byb2ZpbGUnIGZpZWxkLiBzZXRzIHRvIG11bHRpcGxlXG4gICAgICAvLyBzdWIta2V5cyAoZWcgcHJvZmlsZS5mb28gYW5kIHByb2ZpbGUuYmFyKSBhcmUgbWVyZ2VkIGludG8gZW50cnlcbiAgICAgIC8vIGluIHRoZSBmaWVsZHMgbGlzdC5cbiAgICAgIGlmIChmaWVsZHMubGVuZ3RoICE9PSAxIHx8IGZpZWxkc1swXSAhPT0gJ3Byb2ZpbGUnKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gICAgZmV0Y2g6IFsnX2lkJ10gLy8gd2Ugb25seSBsb29rIGF0IF9pZC5cbiAgfSk7XG5cbiAgLy8vIERFRkFVTFQgSU5ERVhFUyBPTiBVU0VSU1xuICB1c2Vycy5fZW5zdXJlSW5kZXgoJ3VzZXJuYW1lJywge3VuaXF1ZTogMSwgc3BhcnNlOiAxfSk7XG4gIHVzZXJzLl9lbnN1cmVJbmRleCgnZW1haWxzLmFkZHJlc3MnLCB7dW5pcXVlOiAxLCBzcGFyc2U6IDF9KTtcbiAgdXNlcnMuX2Vuc3VyZUluZGV4KCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nLFxuICAgICAgICAgICAgICAgICAgICAge3VuaXF1ZTogMSwgc3BhcnNlOiAxfSk7XG4gIHVzZXJzLl9lbnN1cmVJbmRleCgnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLnRva2VuJyxcbiAgICAgICAgICAgICAgICAgICAgIHt1bmlxdWU6IDEsIHNwYXJzZTogMX0pO1xuICAvLyBGb3IgdGFraW5nIGNhcmUgb2YgbG9nb3V0T3RoZXJDbGllbnRzIGNhbGxzIHRoYXQgY3Jhc2hlZCBiZWZvcmUgdGhlXG4gIC8vIHRva2VucyB3ZXJlIGRlbGV0ZWQuXG4gIHVzZXJzLl9lbnN1cmVJbmRleCgnc2VydmljZXMucmVzdW1lLmhhdmVMb2dpblRva2Vuc1RvRGVsZXRlJyxcbiAgICAgICAgICAgICAgICAgICAgIHsgc3BhcnNlOiAxIH0pO1xuICAvLyBGb3IgZXhwaXJpbmcgbG9naW4gdG9rZW5zXG4gIHVzZXJzLl9lbnN1cmVJbmRleChcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy53aGVuXCIsIHsgc3BhcnNlOiAxIH0pO1xuICAvLyBGb3IgZXhwaXJpbmcgcGFzc3dvcmQgdG9rZW5zXG4gIHVzZXJzLl9lbnN1cmVJbmRleCgnc2VydmljZXMucGFzc3dvcmQucmVzZXQud2hlbicsIHsgc3BhcnNlOiAxIH0pO1xufVxuXG4vLy9cbi8vLyBDTEVBTiBVUCBGT1IgYGxvZ291dE90aGVyQ2xpZW50c2Bcbi8vL1xuXG5BcC5fZGVsZXRlU2F2ZWRUb2tlbnNGb3JVc2VyID0gZnVuY3Rpb24gKHVzZXJJZCwgdG9rZW5zVG9EZWxldGUpIHtcbiAgaWYgKHRva2Vuc1RvRGVsZXRlKSB7XG4gICAgdGhpcy51c2Vycy51cGRhdGUodXNlcklkLCB7XG4gICAgICAkdW5zZXQ6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUuaGF2ZUxvZ2luVG9rZW5zVG9EZWxldGVcIjogMSxcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNUb0RlbGV0ZVwiOiAxXG4gICAgICB9LFxuICAgICAgJHB1bGxBbGw6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogdG9rZW5zVG9EZWxldGVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuQXAuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yQWxsVXNlcnNPblN0YXJ0dXAgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBJZiB3ZSBmaW5kIHVzZXJzIHdobyBoYXZlIHNhdmVkIHRva2VucyB0byBkZWxldGUgb24gc3RhcnR1cCwgZGVsZXRlXG4gIC8vIHRoZW0gbm93LiBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHNlcnZlciBjb3VsZCBoYXZlIGNyYXNoZWQgYW5kIGNvbWVcbiAgLy8gYmFjayB1cCBiZWZvcmUgbmV3IHRva2VucyBhcmUgZm91bmQgaW4gbG9jYWxTdG9yYWdlLCBidXQgdGhpc1xuICAvLyBzaG91bGRuJ3QgaGFwcGVuIHZlcnkgb2Z0ZW4uIFdlIHNob3VsZG4ndCBwdXQgYSBkZWxheSBoZXJlIGJlY2F1c2VcbiAgLy8gdGhhdCB3b3VsZCBnaXZlIGEgbG90IG9mIHBvd2VyIHRvIGFuIGF0dGFja2VyIHdpdGggYSBzdG9sZW4gbG9naW5cbiAgLy8gdG9rZW4gYW5kIHRoZSBhYmlsaXR5IHRvIGNyYXNoIHRoZSBzZXJ2ZXIuXG4gIE1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLnVzZXJzLmZpbmQoe1xuICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUuaGF2ZUxvZ2luVG9rZW5zVG9EZWxldGVcIjogdHJ1ZVxuICAgIH0sIHtcbiAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zVG9EZWxldGVcIjogMVxuICAgIH0pLmZvckVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHNlbGYuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yVXNlcihcbiAgICAgICAgdXNlci5faWQsXG4gICAgICAgIHVzZXIuc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zVG9EZWxldGVcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xufTtcbiIsImltcG9ydCB7QWNjb3VudHNTZXJ2ZXJ9IGZyb20gXCIuL2FjY291bnRzX3NlcnZlci5qc1wiO1xuXG4vLyBYWFggVGhlc2Ugc2hvdWxkIHByb2JhYmx5IG5vdCBhY3R1YWxseSBiZSBwdWJsaWM/XG5cbkFjY291bnRzU2VydmVyLnByb3RvdHlwZS51cmxzID0ge1xuICByZXNldFBhc3N3b3JkOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICByZXR1cm4gTWV0ZW9yLmFic29sdXRlVXJsKCcjL3Jlc2V0LXBhc3N3b3JkLycgKyB0b2tlbik7XG4gIH0sXG5cbiAgdmVyaWZ5RW1haWw6IGZ1bmN0aW9uICh0b2tlbikge1xuICAgIHJldHVybiBNZXRlb3IuYWJzb2x1dGVVcmwoJyMvdmVyaWZ5LWVtYWlsLycgKyB0b2tlbik7XG4gIH0sXG5cbiAgZW5yb2xsQWNjb3VudDogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgcmV0dXJuIE1ldGVvci5hYnNvbHV0ZVVybCgnIy9lbnJvbGwtYWNjb3VudC8nICsgdG9rZW4pO1xuICB9XG59O1xuIl19

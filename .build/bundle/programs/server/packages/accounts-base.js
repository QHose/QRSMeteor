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
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var Accounts, EXPIRE_TOKENS_INTERVAL_MS, CONNECTION_CLOSE_DELAY_MS;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-base":{"server_main.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/server_main.js                                                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var module1 = module;                                                                                                // 1
module1.export({                                                                                                     // 1
  AccountsServer: function () {                                                                                      // 1
    return AccountsServer;                                                                                           // 1
  }                                                                                                                  // 1
});                                                                                                                  // 1
var AccountsServer = void 0;                                                                                         // 1
module1.watch(require("./accounts_server.js"), {                                                                     // 1
  AccountsServer: function (v) {                                                                                     // 1
    AccountsServer = v;                                                                                              // 1
  }                                                                                                                  // 1
}, 0);                                                                                                               // 1
module1.watch(require("./accounts_rate_limit.js"));                                                                  // 1
module1.watch(require("./url_server.js"));                                                                           // 1
/**                                                                                                                  // 5
 * @namespace Accounts                                                                                               //
 * @summary The namespace for all server-side accounts-related methods.                                              //
 */Accounts = new AccountsServer(Meteor.server); // Users table. Don't use the normal autopublish, since we want to hide
// some fields. Code to autopublish this is in accounts_server.js.                                                   // 12
// XXX Allow users to configure this collection name.                                                                // 13
/**                                                                                                                  // 15
 * @summary A [Mongo.Collection](#collections) containing user documents.                                            //
 * @locus Anywhere                                                                                                   //
 * @type {Mongo.Collection}                                                                                          //
 * @importFromPackage meteor                                                                                         //
*/                                                                                                                   //
Meteor.users = Accounts.users;                                                                                       // 21
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_common.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/accounts_common.js                                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                              //
                                                                                                                     //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                     //
                                                                                                                     //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                    //
                                                                                                                     //
module.export({                                                                                                      // 1
  AccountsCommon: function () {                                                                                      // 1
    return AccountsCommon;                                                                                           // 1
  }                                                                                                                  // 1
});                                                                                                                  // 1
                                                                                                                     //
var AccountsCommon = function () {                                                                                   //
  function AccountsCommon(options) {                                                                                 // 11
    (0, _classCallCheck3.default)(this, AccountsCommon);                                                             // 11
    // Currently this is read directly by packages like accounts-password                                            // 12
    // and accounts-ui-unstyled.                                                                                     // 13
    this._options = {}; // Note that setting this.connection = null causes this.users to be a                        // 14
    // LocalCollection, which is not what we want.                                                                   // 17
                                                                                                                     //
    this.connection = undefined;                                                                                     // 18
                                                                                                                     //
    this._initConnection(options || {}); // There is an allow call in accounts_server.js that restricts writes to    // 19
    // this collection.                                                                                              // 22
                                                                                                                     //
                                                                                                                     //
    this.users = new Mongo.Collection("users", {                                                                     // 23
      _preventAutopublish: true,                                                                                     // 24
      connection: this.connection                                                                                    // 25
    }); // Callback exceptions are printed with Meteor._debug and ignored.                                           // 23
                                                                                                                     //
    this._onLoginHook = new Hook({                                                                                   // 29
      bindEnvironment: false,                                                                                        // 30
      debugPrintExceptions: "onLogin callback"                                                                       // 31
    });                                                                                                              // 29
    this._onLoginFailureHook = new Hook({                                                                            // 34
      bindEnvironment: false,                                                                                        // 35
      debugPrintExceptions: "onLoginFailure callback"                                                                // 36
    });                                                                                                              // 34
    this._onLogoutHook = new Hook({                                                                                  // 39
      bindEnvironment: false,                                                                                        // 40
      debugPrintExceptions: "onLogout callback"                                                                      // 41
    });                                                                                                              // 39
  } /**                                                                                                              // 43
     * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.                  //
     * @locus Anywhere                                                                                               //
     */                                                                                                              //
                                                                                                                     //
  AccountsCommon.prototype.userId = function () {                                                                    //
    function userId() {                                                                                              //
      throw new Error("userId method not implemented");                                                              // 50
    }                                                                                                                // 51
                                                                                                                     //
    return userId;                                                                                                   //
  }(); /**                                                                                                           //
        * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.           //
        * @locus Anywhere                                                                                            //
        */                                                                                                           //
                                                                                                                     //
  AccountsCommon.prototype.user = function () {                                                                      //
    function user() {                                                                                                //
      var userId = this.userId();                                                                                    // 58
      return userId ? this.users.findOne(userId) : null;                                                             // 59
    }                                                                                                                // 60
                                                                                                                     //
    return user;                                                                                                     //
  }(); // Set up config for the accounts system. Call this on both the client                                        //
  // and the server.                                                                                                 // 63
  //                                                                                                                 // 64
  // Note that this method gets overridden on AccountsServer.prototype, but                                          // 65
  // the overriding method calls the overridden method.                                                              // 66
  //                                                                                                                 // 67
  // XXX we should add some enforcement that this is called on both the                                              // 68
  // client and the server. Otherwise, a user can                                                                    // 69
  // 'forbidClientAccountCreation' only on the client and while it looks                                             // 70
  // like their app is secure, the server will still accept createUser                                               // 71
  // calls. https://github.com/meteor/meteor/issues/828                                                              // 72
  //                                                                                                                 // 73
  // @param options {Object} an object with fields:                                                                  // 74
  // - sendVerificationEmail {Boolean}                                                                               // 75
  //     Send email address verification emails to new users created from                                            // 76
  //     client signups.                                                                                             // 77
  // - forbidClientAccountCreation {Boolean}                                                                         // 78
  //     Do not allow clients to create accounts directly.                                                           // 79
  // - restrictCreationByEmailDomain {Function or String}                                                            // 80
  //     Require created users to have an email matching the function or                                             // 81
  //     having the string as domain.                                                                                // 82
  // - loginExpirationInDays {Number}                                                                                // 83
  //     Number of days since login until a user is logged out (login token                                          // 84
  //     expires).                                                                                                   // 85
  // - passwordResetTokenExpirationInDays {Number}                                                                   // 86
  //     Number of days since password reset token creation until the                                                // 87
  //     token cannt be used any longer (password reset token expires).                                              // 88
  // - ambiguousErrorMessages {Boolean}                                                                              // 89
  //     Return ambiguous error messages from login failures to prevent                                              // 90
  //     user enumeration.                                                                                           // 91
  /**                                                                                                                // 93
   * @summary Set global accounts options.                                                                           //
   * @locus Anywhere                                                                                                 //
   * @param {Object} options                                                                                         //
   * @param {Boolean} options.sendVerificationEmail New users with an email address will receive an address verification email.
   * @param {Boolean} options.forbidClientAccountCreation Calls to [`createUser`](#accounts_createuser) from the client will be rejected. In addition, if you are using [accounts-ui](#accountsui), the "Create account" link will not be available.
   * @param {String | Function} options.restrictCreationByEmailDomain If set to a string, only allows new users if the domain part of their email address matches the string. If set to a function, only allows new users if the function returns true.  The function is passed the full email address of the proposed new user.  Works with password-based sign-in and external services that expose email addresses (Google, Facebook, GitHub). All existing users still can log in after enabling this option. Example: `Accounts.config({ restrictCreationByEmailDomain: 'school.edu' })`.
   * @param {Number} options.loginExpirationInDays The number of days from when a user logs in until their token expires and they are logged out. Defaults to 90. Set to `null` to disable login expiration.
   * @param {String} options.oauthSecretKey When using the `oauth-encryption` package, the 16 byte key using to encrypt sensitive account credentials in the database, encoded in base64.  This option may only be specifed on the server.  See packages/oauth-encryption/README.md for details.
   * @param {Number} options.passwordResetTokenExpirationInDays The number of days from when a link to reset password is sent until token expires and user can't reset password with the link anymore. Defaults to 3.
   * @param {Number} options.passwordEnrollTokenExpirationInDays The number of days from when a link to set inital password is sent until token expires and user can't set password with the link anymore. Defaults to 30.
   * @param {Boolean} options.ambiguousErrorMessages Return ambiguous error messages from login failures to prevent user enumeration. Defaults to false.
   */                                                                                                                //
                                                                                                                     //
  AccountsCommon.prototype.config = function () {                                                                    //
    function config(options) {                                                                                       //
      var self = this; // We don't want users to accidentally only call Accounts.config on the                       // 107
      // client, where some of the options will have partial effects (eg removing                                    // 110
      // the "create account" button from accounts-ui if forbidClientAccountCreation                                 // 111
      // is set, or redirecting Google login to a specific-domain page) without                                      // 112
      // having their full effects.                                                                                  // 113
                                                                                                                     //
      if (Meteor.isServer) {                                                                                         // 114
        __meteor_runtime_config__.accountsConfigCalled = true;                                                       // 115
      } else if (!__meteor_runtime_config__.accountsConfigCalled) {                                                  // 116
        // XXX would be nice to "crash" the client and replace the UI with an error                                  // 117
        // message, but there's no trivial way to do this.                                                           // 118
        Meteor._debug("Accounts.config was called on the client but not on the " + "server; some configuration options may not take effect.");
      } // We need to validate the oauthSecretKey option at the time                                                 // 121
      // Accounts.config is called. We also deliberately don't store the                                             // 124
      // oauthSecretKey in Accounts._options.                                                                        // 125
                                                                                                                     //
                                                                                                                     //
      if (_.has(options, "oauthSecretKey")) {                                                                        // 126
        if (Meteor.isClient) throw new Error("The oauthSecretKey option may only be specified on the server");       // 127
        if (!Package["oauth-encryption"]) throw new Error("The oauth-encryption package must be loaded to set oauthSecretKey");
        Package["oauth-encryption"].OAuthEncryption.loadKey(options.oauthSecretKey);                                 // 131
        options = _.omit(options, "oauthSecretKey");                                                                 // 132
      } // validate option keys                                                                                      // 133
                                                                                                                     //
                                                                                                                     //
      var VALID_KEYS = ["sendVerificationEmail", "forbidClientAccountCreation", "passwordEnrollTokenExpirationInDays", "restrictCreationByEmailDomain", "loginExpirationInDays", "passwordResetTokenExpirationInDays", "ambiguousErrorMessages"];
                                                                                                                     //
      _.each(_.keys(options), function (key) {                                                                       // 139
        if (!_.contains(VALID_KEYS, key)) {                                                                          // 140
          throw new Error("Accounts.config: Invalid key: " + key);                                                   // 141
        }                                                                                                            // 142
      }); // set values in Accounts._options                                                                         // 143
                                                                                                                     //
                                                                                                                     //
      _.each(VALID_KEYS, function (key) {                                                                            // 146
        if (key in options) {                                                                                        // 147
          if (key in self._options) {                                                                                // 148
            throw new Error("Can't set `" + key + "` more than once");                                               // 149
          }                                                                                                          // 150
                                                                                                                     //
          self._options[key] = options[key];                                                                         // 151
        }                                                                                                            // 152
      });                                                                                                            // 153
    }                                                                                                                // 154
                                                                                                                     //
    return config;                                                                                                   //
  }(); /**                                                                                                           //
        * @summary Register a callback to be called after a login attempt succeeds.                                  //
        * @locus Anywhere                                                                                            //
        * @param {Function} func The callback to be called when login is successful.                                 //
        */                                                                                                           //
                                                                                                                     //
  AccountsCommon.prototype.onLogin = function () {                                                                   //
    function onLogin(func) {                                                                                         //
      return this._onLoginHook.register(func);                                                                       // 162
    }                                                                                                                // 163
                                                                                                                     //
    return onLogin;                                                                                                  //
  }(); /**                                                                                                           //
        * @summary Register a callback to be called after a login attempt fails.                                     //
        * @locus Anywhere                                                                                            //
        * @param {Function} func The callback to be called after the login has failed.                               //
        */                                                                                                           //
                                                                                                                     //
  AccountsCommon.prototype.onLoginFailure = function () {                                                            //
    function onLoginFailure(func) {                                                                                  //
      return this._onLoginFailureHook.register(func);                                                                // 171
    }                                                                                                                // 172
                                                                                                                     //
    return onLoginFailure;                                                                                           //
  }(); /**                                                                                                           //
        * @summary Register a callback to be called after a logout attempt succeeds.                                 //
        * @locus Anywhere                                                                                            //
        * @param {Function} func The callback to be called when logout is successful.                                //
        */                                                                                                           //
                                                                                                                     //
  AccountsCommon.prototype.onLogout = function () {                                                                  //
    function onLogout(func) {                                                                                        //
      return this._onLogoutHook.register(func);                                                                      // 180
    }                                                                                                                // 181
                                                                                                                     //
    return onLogout;                                                                                                 //
  }();                                                                                                               //
                                                                                                                     //
  AccountsCommon.prototype._initConnection = function () {                                                           //
    function _initConnection(options) {                                                                              //
      if (!Meteor.isClient) {                                                                                        // 184
        return;                                                                                                      // 185
      } // The connection used by the Accounts system. This is the connection                                        // 186
      // that will get logged in by Meteor.login(), and this is the                                                  // 189
      // connection whose login state will be reflected by Meteor.userId().                                          // 190
      //                                                                                                             // 191
      // It would be much preferable for this to be in accounts_client.js,                                           // 192
      // but it has to be here because it's needed to create the                                                     // 193
      // Meteor.users collection.                                                                                    // 194
                                                                                                                     //
                                                                                                                     //
      if (options.connection) {                                                                                      // 196
        this.connection = options.connection;                                                                        // 197
      } else if (options.ddpUrl) {                                                                                   // 198
        this.connection = DDP.connect(options.ddpUrl);                                                               // 199
      } else if (typeof __meteor_runtime_config__ !== "undefined" && __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL) {
        // Temporary, internal hook to allow the server to point the client                                          // 202
        // to a different authentication server. This is for a very                                                  // 203
        // particular use case that comes up when implementing a oauth                                               // 204
        // server. Unsupported and may go away at any point in time.                                                 // 205
        //                                                                                                           // 206
        // We will eventually provide a general way to use account-base                                              // 207
        // against any DDP connection, not just one special one.                                                     // 208
        this.connection = DDP.connect(__meteor_runtime_config__.ACCOUNTS_CONNECTION_URL);                            // 209
      } else {                                                                                                       // 211
        this.connection = Meteor.connection;                                                                         // 212
      }                                                                                                              // 213
    }                                                                                                                // 214
                                                                                                                     //
    return _initConnection;                                                                                          //
  }();                                                                                                               //
                                                                                                                     //
  AccountsCommon.prototype._getTokenLifetimeMs = function () {                                                       //
    function _getTokenLifetimeMs() {                                                                                 //
      // When loginExpirationInDays is set to null, we'll use a really high                                          // 217
      // number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an                                                // 218
      // unexpiring token.                                                                                           // 219
      var loginExpirationInDays = this._options.loginExpirationInDays === null ? LOGIN_UNEXPIRING_TOKEN_DAYS : this._options.loginExpirationInDays;
      return (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;                         // 224
    }                                                                                                                // 226
                                                                                                                     //
    return _getTokenLifetimeMs;                                                                                      //
  }();                                                                                                               //
                                                                                                                     //
  AccountsCommon.prototype._getPasswordResetTokenLifetimeMs = function () {                                          //
    function _getPasswordResetTokenLifetimeMs() {                                                                    //
      return (this._options.passwordResetTokenExpirationInDays || DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
    }                                                                                                                // 231
                                                                                                                     //
    return _getPasswordResetTokenLifetimeMs;                                                                         //
  }();                                                                                                               //
                                                                                                                     //
  AccountsCommon.prototype._getPasswordEnrollTokenLifetimeMs = function () {                                         //
    function _getPasswordEnrollTokenLifetimeMs() {                                                                   //
      return (this._options.passwordEnrollTokenExpirationInDays || DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
    }                                                                                                                // 236
                                                                                                                     //
    return _getPasswordEnrollTokenLifetimeMs;                                                                        //
  }();                                                                                                               //
                                                                                                                     //
  AccountsCommon.prototype._tokenExpiration = function () {                                                          //
    function _tokenExpiration(when) {                                                                                //
      // We pass when through the Date constructor for backwards compatibility;                                      // 239
      // `when` used to be a number.                                                                                 // 240
      return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());                                        // 241
    }                                                                                                                // 242
                                                                                                                     //
    return _tokenExpiration;                                                                                         //
  }();                                                                                                               //
                                                                                                                     //
  AccountsCommon.prototype._tokenExpiresSoon = function () {                                                         //
    function _tokenExpiresSoon(when) {                                                                               //
      var minLifetimeMs = .1 * this._getTokenLifetimeMs();                                                           // 245
                                                                                                                     //
      var minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;                                                     // 246
      if (minLifetimeMs > minLifetimeCapMs) minLifetimeMs = minLifetimeCapMs;                                        // 247
      return new Date() > new Date(when) - minLifetimeMs;                                                            // 249
    }                                                                                                                // 250
                                                                                                                     //
    return _tokenExpiresSoon;                                                                                        //
  }();                                                                                                               //
                                                                                                                     //
  return AccountsCommon;                                                                                             //
}();                                                                                                                 //
                                                                                                                     //
var Ap = AccountsCommon.prototype; // Note that Accounts is defined separately in accounts_client.js and             // 253
// accounts_server.js.                                                                                               // 256
/**                                                                                                                  // 258
 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.                      //
 * @locus Anywhere but publish functions                                                                             //
 * @importFromPackage meteor                                                                                         //
 */                                                                                                                  //
                                                                                                                     //
Meteor.userId = function () {                                                                                        // 263
  return Accounts.userId();                                                                                          // 264
}; /**                                                                                                               // 265
    * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.               //
    * @locus Anywhere but publish functions                                                                          //
    * @importFromPackage meteor                                                                                      //
    */                                                                                                               //
                                                                                                                     //
Meteor.user = function () {                                                                                          // 272
  return Accounts.user();                                                                                            // 273
}; // how long (in days) until a login token expires                                                                 // 274
                                                                                                                     //
                                                                                                                     //
var DEFAULT_LOGIN_EXPIRATION_DAYS = 90; // Expose for testing.                                                       // 277
                                                                                                                     //
Ap.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS; // how long (in days) until reset password token expires
                                                                                                                     //
var DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3; // how long (in days) until enrol password token expires       // 282
                                                                                                                     //
var DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30; // Clients don't try to auto-login with a token that is going to expire within
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.                                        // 286
// Tries to avoid abrupt disconnects from expiring tokens.                                                           // 287
                                                                                                                     //
var MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour                                                                  // 288
// how often (in milliseconds) we check for expired tokens                                                           // 289
                                                                                                                     //
EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000; // 10 minutes                                                                // 290
// how long we wait before logging out clients when Meteor.logoutOtherClients is                                     // 291
// called                                                                                                            // 292
                                                                                                                     //
CONNECTION_CLOSE_DELAY_MS = 10 * 1000; // A large number of expiration days (approximately 100 years worth) that is  // 293
// used when creating unexpiring tokens.                                                                             // 296
                                                                                                                     //
var LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100; // Expose for testing.                                                  // 297
                                                                                                                     //
Ap.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS; // loginServiceConfiguration and ConfigError are maintained for backwards compatibility
                                                                                                                     //
Meteor.startup(function () {                                                                                         // 302
  var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;                                  // 303
  Ap.loginServiceConfiguration = ServiceConfiguration.configurations;                                                // 305
  Ap.ConfigError = ServiceConfiguration.ConfigError;                                                                 // 306
}); // Thrown when the user cancels the login process (eg, closes an oauth                                           // 307
// popup, declines retina scan, etc)                                                                                 // 310
                                                                                                                     //
var lceName = 'Accounts.LoginCancelledError';                                                                        // 311
Ap.LoginCancelledError = Meteor.makeErrorType(lceName, function (description) {                                      // 312
  this.message = description;                                                                                        // 315
});                                                                                                                  // 316
Ap.LoginCancelledError.prototype.name = lceName; // This is used to transmit specific subclass errors over the wire. We should
// come up with a more generic way to do this (eg, with some sort of symbolic                                        // 321
// error code rather than a number).                                                                                 // 322
                                                                                                                     //
Ap.LoginCancelledError.numericError = 0x8acdc2f;                                                                     // 323
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_rate_limit.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/accounts_rate_limit.js                                                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var AccountsCommon = void 0;                                                                                         // 1
module.watch(require("./accounts_common.js"), {                                                                      // 1
  AccountsCommon: function (v) {                                                                                     // 1
    AccountsCommon = v;                                                                                              // 1
  }                                                                                                                  // 1
}, 0);                                                                                                               // 1
var Ap = AccountsCommon.prototype;                                                                                   // 3
var defaultRateLimiterRuleId; // Removes default rate limiting rule                                                  // 4
                                                                                                                     //
Ap.removeDefaultRateLimit = function () {                                                                            // 6
  var resp = DDPRateLimiter.removeRule(defaultRateLimiterRuleId);                                                    // 7
  defaultRateLimiterRuleId = null;                                                                                   // 8
  return resp;                                                                                                       // 9
}; // Add a default rule of limiting logins, creating new users and password reset                                   // 10
// to 5 times every 10 seconds per connection.                                                                       // 13
                                                                                                                     //
                                                                                                                     //
Ap.addDefaultRateLimit = function () {                                                                               // 14
  if (!defaultRateLimiterRuleId) {                                                                                   // 15
    defaultRateLimiterRuleId = DDPRateLimiter.addRule({                                                              // 16
      userId: null,                                                                                                  // 17
      clientAddress: null,                                                                                           // 18
      type: 'method',                                                                                                // 19
      name: function (name) {                                                                                        // 20
        return _.contains(['login', 'createUser', 'resetPassword', 'forgotPassword'], name);                         // 21
      },                                                                                                             // 23
      connectionId: function (connectionId) {                                                                        // 24
        return true;                                                                                                 // 25
      }                                                                                                              // 26
    }, 5, 10000);                                                                                                    // 16
  }                                                                                                                  // 28
};                                                                                                                   // 29
                                                                                                                     //
Ap.addDefaultRateLimit();                                                                                            // 31
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/accounts_server.js                                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var _extends2 = require("babel-runtime/helpers/extends");                                                            //
                                                                                                                     //
var _extends3 = _interopRequireDefault(_extends2);                                                                   //
                                                                                                                     //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                              //
                                                                                                                     //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                     //
                                                                                                                     //
var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");                        //
                                                                                                                     //
var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);                               //
                                                                                                                     //
var _inherits2 = require("babel-runtime/helpers/inherits");                                                          //
                                                                                                                     //
var _inherits3 = _interopRequireDefault(_inherits2);                                                                 //
                                                                                                                     //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                    //
                                                                                                                     //
module.export({                                                                                                      // 1
  AccountsServer: function () {                                                                                      // 1
    return AccountsServer;                                                                                           // 1
  }                                                                                                                  // 1
});                                                                                                                  // 1
var AccountsCommon = void 0;                                                                                         // 1
module.watch(require("./accounts_common.js"), {                                                                      // 1
  AccountsCommon: function (v) {                                                                                     // 1
    AccountsCommon = v;                                                                                              // 1
  }                                                                                                                  // 1
}, 0);                                                                                                               // 1
                                                                                                                     //
var crypto = Npm.require('crypto');                                                                                  // 1
                                                                                                                     //
var AccountsServer = function (_AccountsCommon) {                                                                    //
  (0, _inherits3.default)(AccountsServer, _AccountsCommon);                                                          //
                                                                                                                     //
  // Note that this constructor is less likely to be instantiated multiple                                           // 14
  // times than the `AccountsClient` constructor, because a single server                                            // 15
  // can provide only one set of methods.                                                                            // 16
  function AccountsServer(server) {                                                                                  // 17
    (0, _classCallCheck3.default)(this, AccountsServer);                                                             // 17
                                                                                                                     //
    var _this = (0, _possibleConstructorReturn3.default)(this, _AccountsCommon.call(this));                          // 17
                                                                                                                     //
    _this._server = server || Meteor.server; // Set up the server's methods, as if by calling Meteor.methods.        // 20
                                                                                                                     //
    _this._initServerMethods();                                                                                      // 22
                                                                                                                     //
    _this._initAccountDataHooks(); // If autopublish is on, publish these user fields. Login service                 // 24
    // packages (eg accounts-google) add to these by calling                                                         // 27
    // addAutopublishFields.  Notably, this isn't implemented with multiple                                          // 28
    // publishes since DDP only merges only across top-level fields, not                                             // 29
    // subfields (such as 'services.facebook.accessToken')                                                           // 30
                                                                                                                     //
                                                                                                                     //
    _this._autopublishFields = {                                                                                     // 31
      loggedInUser: ['profile', 'username', 'emails'],                                                               // 32
      otherUsers: ['profile', 'username']                                                                            // 33
    };                                                                                                               // 31
                                                                                                                     //
    _this._initServerPublications(); // connectionId -> {connection, loginToken}                                     // 35
                                                                                                                     //
                                                                                                                     //
    _this._accountData = {}; // connection id -> observe handle for the login token that this connection is          // 38
    // currently associated with, or a number. The number indicates that we are in                                   // 41
    // the process of setting up the observe (using a number instead of a single                                     // 42
    // sentinel allows multiple attempts to set up the observe to identify which                                     // 43
    // one was theirs).                                                                                              // 44
                                                                                                                     //
    _this._userObservesForConnections = {};                                                                          // 45
    _this._nextUserObserveNumber = 1; // for the number described above.                                             // 46
    // list of all registered handlers.                                                                              // 48
                                                                                                                     //
    _this._loginHandlers = [];                                                                                       // 49
    setupUsersCollection(_this.users);                                                                               // 51
    setupDefaultLoginHandlers(_this);                                                                                // 52
    setExpireTokensInterval(_this);                                                                                  // 53
    _this._validateLoginHook = new Hook({                                                                            // 55
      bindEnvironment: false                                                                                         // 55
    });                                                                                                              // 55
    _this._validateNewUserHooks = [defaultValidateNewUserHook.bind(_this)];                                          // 56
                                                                                                                     //
    _this._deleteSavedTokensForAllUsersOnStartup();                                                                  // 60
                                                                                                                     //
    _this._skipCaseInsensitiveChecksForTest = {};                                                                    // 62
    return _this;                                                                                                    // 17
  } ///                                                                                                              // 63
  /// CURRENT USER                                                                                                   // 66
  ///                                                                                                                // 67
  // @override of "abstract" non-implementation in accounts_common.js                                                // 69
                                                                                                                     //
                                                                                                                     //
  AccountsServer.prototype.userId = function () {                                                                    //
    function userId() {                                                                                              //
      // This function only works if called inside a method or a pubication.                                         // 71
      // Using any of the infomation from Meteor.user() in a method or                                               // 72
      // publish function will always use the value from when the function first                                     // 73
      // runs. This is likely not what the user expects. The way to make this work                                   // 74
      // in a method or publish function is to do Meteor.find(this.userId).observe                                   // 75
      // and recompute when the user record changes.                                                                 // 76
      var currentInvocation = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get();         // 77
                                                                                                                     //
      if (!currentInvocation) throw new Error("Meteor.userId can only be invoked in method calls or publications.");
      return currentInvocation.userId;                                                                               // 80
    }                                                                                                                // 81
                                                                                                                     //
    return userId;                                                                                                   //
  }(); ///                                                                                                           //
  /// LOGIN HOOKS                                                                                                    // 84
  ///                                                                                                                // 85
  /**                                                                                                                // 87
   * @summary Validate login attempts.                                                                               //
   * @locus Server                                                                                                   //
   * @param {Function} func Called whenever a login is attempted (either successful or unsuccessful).  A login can be aborted by returning a falsy value or throwing an exception.
   */                                                                                                                //
                                                                                                                     //
  AccountsServer.prototype.validateLoginAttempt = function () {                                                      //
    function validateLoginAttempt(func) {                                                                            //
      // Exceptions inside the hook callback are passed up to us.                                                    // 93
      return this._validateLoginHook.register(func);                                                                 // 94
    }                                                                                                                // 95
                                                                                                                     //
    return validateLoginAttempt;                                                                                     //
  }(); /**                                                                                                           //
        * @summary Set restrictions on new user creation.                                                            //
        * @locus Server                                                                                              //
        * @param {Function} func Called whenever a new user is created. Takes the new user object, and returns true to allow the creation or false to abort.
        */                                                                                                           //
                                                                                                                     //
  AccountsServer.prototype.validateNewUser = function () {                                                           //
    function validateNewUser(func) {                                                                                 //
      this._validateNewUserHooks.push(func);                                                                         // 103
    }                                                                                                                // 104
                                                                                                                     //
    return validateNewUser;                                                                                          //
  }(); ///                                                                                                           //
  /// CREATE USER HOOKS                                                                                              // 107
  ///                                                                                                                // 108
  /**                                                                                                                // 110
   * @summary Customize new user creation.                                                                           //
   * @locus Server                                                                                                   //
   * @param {Function} func Called whenever a new user is created. Return the new user object, or throw an `Error` to abort the creation.
   */                                                                                                                //
                                                                                                                     //
  AccountsServer.prototype.onCreateUser = function () {                                                              //
    function onCreateUser(func) {                                                                                    //
      if (this._onCreateUserHook) {                                                                                  // 116
        throw new Error("Can only call onCreateUser once");                                                          // 117
      }                                                                                                              // 118
                                                                                                                     //
      this._onCreateUserHook = func;                                                                                 // 120
    }                                                                                                                // 121
                                                                                                                     //
    return onCreateUser;                                                                                             //
  }();                                                                                                               //
                                                                                                                     //
  return AccountsServer;                                                                                             //
}(AccountsCommon);                                                                                                   //
                                                                                                                     //
;                                                                                                                    // 122
var Ap = AccountsServer.prototype; // Give each login hook callback a fresh cloned copy of the attempt               // 124
// object, but don't clone the connection.                                                                           // 127
//                                                                                                                   // 128
                                                                                                                     //
function cloneAttemptWithConnection(connection, attempt) {                                                           // 129
  var clonedAttempt = EJSON.clone(attempt);                                                                          // 130
  clonedAttempt.connection = connection;                                                                             // 131
  return clonedAttempt;                                                                                              // 132
}                                                                                                                    // 133
                                                                                                                     //
Ap._validateLogin = function (connection, attempt) {                                                                 // 135
  this._validateLoginHook.each(function (callback) {                                                                 // 136
    var ret;                                                                                                         // 137
                                                                                                                     //
    try {                                                                                                            // 138
      ret = callback(cloneAttemptWithConnection(connection, attempt));                                               // 139
    } catch (e) {                                                                                                    // 140
      attempt.allowed = false; // XXX this means the last thrown error overrides previous error                      // 142
      // messages. Maybe this is surprising to users and we should make                                              // 144
      // overriding errors more explicit. (see                                                                       // 145
      // https://github.com/meteor/meteor/issues/1960)                                                               // 146
                                                                                                                     //
      attempt.error = e;                                                                                             // 147
      return true;                                                                                                   // 148
    }                                                                                                                // 149
                                                                                                                     //
    if (!ret) {                                                                                                      // 150
      attempt.allowed = false; // don't override a specific error provided by a previous                             // 151
      // validator or the initial attempt (eg "incorrect password").                                                 // 153
                                                                                                                     //
      if (!attempt.error) attempt.error = new Meteor.Error(403, "Login forbidden");                                  // 154
    }                                                                                                                // 156
                                                                                                                     //
    return true;                                                                                                     // 157
  });                                                                                                                // 158
};                                                                                                                   // 159
                                                                                                                     //
Ap._successfulLogin = function (connection, attempt) {                                                               // 162
  this._onLoginHook.each(function (callback) {                                                                       // 163
    callback(cloneAttemptWithConnection(connection, attempt));                                                       // 164
    return true;                                                                                                     // 165
  });                                                                                                                // 166
};                                                                                                                   // 167
                                                                                                                     //
Ap._failedLogin = function (connection, attempt) {                                                                   // 169
  this._onLoginFailureHook.each(function (callback) {                                                                // 170
    callback(cloneAttemptWithConnection(connection, attempt));                                                       // 171
    return true;                                                                                                     // 172
  });                                                                                                                // 173
};                                                                                                                   // 174
                                                                                                                     //
Ap._successfulLogout = function (connection, userId) {                                                               // 176
  var user = userId && this.users.findOne(userId);                                                                   // 177
                                                                                                                     //
  this._onLogoutHook.each(function (callback) {                                                                      // 178
    callback({                                                                                                       // 179
      user: user,                                                                                                    // 179
      connection: connection                                                                                         // 179
    });                                                                                                              // 179
    return true;                                                                                                     // 180
  });                                                                                                                // 181
}; ///                                                                                                               // 182
/// LOGIN METHODS                                                                                                    // 185
///                                                                                                                  // 186
// Login methods return to the client an object containing these                                                     // 188
// fields when the user was logged in successfully:                                                                  // 189
//                                                                                                                   // 190
//   id: userId                                                                                                      // 191
//   token: *                                                                                                        // 192
//   tokenExpires: *                                                                                                 // 193
//                                                                                                                   // 194
// tokenExpires is optional and intends to provide a hint to the                                                     // 195
// client as to when the token will expire. If not provided, the                                                     // 196
// client will call Accounts._tokenExpiration, passing it the date                                                   // 197
// that it received the token.                                                                                       // 198
//                                                                                                                   // 199
// The login method will throw an error back to the client if the user                                               // 200
// failed to log in.                                                                                                 // 201
//                                                                                                                   // 202
//                                                                                                                   // 203
// Login handlers and service specific login methods such as                                                         // 204
// `createUser` internally return a `result` object containing these                                                 // 205
// fields:                                                                                                           // 206
//                                                                                                                   // 207
//   type:                                                                                                           // 208
//     optional string; the service name, overrides the handler                                                      // 209
//     default if present.                                                                                           // 210
//                                                                                                                   // 211
//   error:                                                                                                          // 212
//     exception; if the user is not allowed to login, the reason why.                                               // 213
//                                                                                                                   // 214
//   userId:                                                                                                         // 215
//     string; the user id of the user attempting to login (if                                                       // 216
//     known), required for an allowed login.                                                                        // 217
//                                                                                                                   // 218
//   options:                                                                                                        // 219
//     optional object merged into the result returned by the login                                                  // 220
//     method; used by HAMK from SRP.                                                                                // 221
//                                                                                                                   // 222
//   stampedLoginToken:                                                                                              // 223
//     optional object with `token` and `when` indicating the login                                                  // 224
//     token is already present in the database, returned by the                                                     // 225
//     "resume" login handler.                                                                                       // 226
//                                                                                                                   // 227
// For convenience, login methods can also throw an exception, which                                                 // 228
// is converted into an {error} result.  However, if the id of the                                                   // 229
// user attempting the login is known, a {userId, error} result should                                               // 230
// be returned instead since the user id is not captured when an                                                     // 231
// exception is thrown.                                                                                              // 232
//                                                                                                                   // 233
// This internal `result` object is automatically converted into the                                                 // 234
// public {id, token, tokenExpires} object returned to the client.                                                   // 235
// Try a login method, converting thrown exceptions into an {error}                                                  // 238
// result.  The `type` argument is a default, inserted into the result                                               // 239
// object if not explicitly returned.                                                                                // 240
//                                                                                                                   // 241
                                                                                                                     //
                                                                                                                     //
var tryLoginMethod = function (type, fn) {                                                                           // 242
  var result;                                                                                                        // 243
                                                                                                                     //
  try {                                                                                                              // 244
    result = fn();                                                                                                   // 245
  } catch (e) {                                                                                                      // 246
    result = {                                                                                                       // 248
      error: e                                                                                                       // 248
    };                                                                                                               // 248
  }                                                                                                                  // 249
                                                                                                                     //
  if (result && !result.type && type) result.type = type;                                                            // 251
  return result;                                                                                                     // 254
}; // Log in a user on a connection.                                                                                 // 255
//                                                                                                                   // 259
// We use the method invocation to set the user id on the connection,                                                // 260
// not the connection object directly. setUserId is tied to methods to                                               // 261
// enforce clear ordering of method application (using wait methods on                                               // 262
// the client, and a no setUserId after unblock restriction on the                                                   // 263
// server)                                                                                                           // 264
//                                                                                                                   // 265
// The `stampedLoginToken` parameter is optional.  When present, it                                                  // 266
// indicates that the login token has already been inserted into the                                                 // 267
// database and doesn't need to be inserted again.  (It's used by the                                                // 268
// "resume" login handler).                                                                                          // 269
                                                                                                                     //
                                                                                                                     //
Ap._loginUser = function (methodInvocation, userId, stampedLoginToken) {                                             // 270
  var self = this;                                                                                                   // 271
                                                                                                                     //
  if (!stampedLoginToken) {                                                                                          // 273
    stampedLoginToken = self._generateStampedLoginToken();                                                           // 274
                                                                                                                     //
    self._insertLoginToken(userId, stampedLoginToken);                                                               // 275
  } // This order (and the avoidance of yields) is important to make                                                 // 276
  // sure that when publish functions are rerun, they see a                                                          // 279
  // consistent view of the world: the userId is set and matches                                                     // 280
  // the login token on the connection (not that there is                                                            // 281
  // currently a public API for reading the login token on a                                                         // 282
  // connection).                                                                                                    // 283
                                                                                                                     //
                                                                                                                     //
  Meteor._noYieldsAllowed(function () {                                                                              // 284
    self._setLoginToken(userId, methodInvocation.connection, self._hashLoginToken(stampedLoginToken.token));         // 285
  });                                                                                                                // 290
                                                                                                                     //
  methodInvocation.setUserId(userId);                                                                                // 292
  return {                                                                                                           // 294
    id: userId,                                                                                                      // 295
    token: stampedLoginToken.token,                                                                                  // 296
    tokenExpires: self._tokenExpiration(stampedLoginToken.when)                                                      // 297
  };                                                                                                                 // 294
}; // After a login method has completed, call the login hooks.  Note                                                // 299
// that `attemptLogin` is called for *all* login attempts, even ones                                                 // 303
// which aren't successful (such as an invalid password, etc).                                                       // 304
//                                                                                                                   // 305
// If the login is allowed and isn't aborted by a validate login hook                                                // 306
// callback, log in the user.                                                                                        // 307
//                                                                                                                   // 308
                                                                                                                     //
                                                                                                                     //
Ap._attemptLogin = function (methodInvocation, methodName, methodArgs, result) {                                     // 309
  if (!result) throw new Error("result is required"); // XXX A programming error in a login handler can lead to this occuring, and
  // then we don't call onLogin or onLoginFailure callbacks. Should                                                  // 319
  // tryLoginMethod catch this case and turn it into an error?                                                       // 320
                                                                                                                     //
  if (!result.userId && !result.error) throw new Error("A login method must specify a userId or an error");          // 321
  var user;                                                                                                          // 324
  if (result.userId) user = this.users.findOne(result.userId);                                                       // 325
  var attempt = {                                                                                                    // 328
    type: result.type || "unknown",                                                                                  // 329
    allowed: !!(result.userId && !result.error),                                                                     // 330
    methodName: methodName,                                                                                          // 331
    methodArguments: _.toArray(methodArgs)                                                                           // 332
  };                                                                                                                 // 328
  if (result.error) attempt.error = result.error;                                                                    // 334
  if (user) attempt.user = user; // _validateLogin may mutate `attempt` by adding an error and changing allowed      // 336
  // to false, but that's the only change it can make (and the user's callbacks                                      // 340
  // only get a clone of `attempt`).                                                                                 // 341
                                                                                                                     //
  this._validateLogin(methodInvocation.connection, attempt);                                                         // 342
                                                                                                                     //
  if (attempt.allowed) {                                                                                             // 344
    var ret = _.extend(this._loginUser(methodInvocation, result.userId, result.stampedLoginToken), result.options || {});
                                                                                                                     //
    this._successfulLogin(methodInvocation.connection, attempt);                                                     // 353
                                                                                                                     //
    return ret;                                                                                                      // 354
  } else {                                                                                                           // 355
    this._failedLogin(methodInvocation.connection, attempt);                                                         // 357
                                                                                                                     //
    throw attempt.error;                                                                                             // 358
  }                                                                                                                  // 359
}; // All service specific login methods should go through this function.                                            // 360
// Ensure that thrown exceptions are caught and that login hook                                                      // 364
// callbacks are still called.                                                                                       // 365
//                                                                                                                   // 366
                                                                                                                     //
                                                                                                                     //
Ap._loginMethod = function (methodInvocation, methodName, methodArgs, type, fn) {                                    // 367
  return this._attemptLogin(methodInvocation, methodName, methodArgs, tryLoginMethod(type, fn));                     // 374
}; // Report a login attempt failed outside the context of a normal login                                            // 380
// method. This is for use in the case where there is a multi-step login                                             // 384
// procedure (eg SRP based password login). If a method early in the                                                 // 385
// chain fails, it should call this function to report a failure. There                                              // 386
// is no corresponding method for a successful login; methods that can                                               // 387
// succeed at logging a user in should always be actual login methods                                                // 388
// (using either Accounts._loginMethod or Accounts.registerLoginHandler).                                            // 389
                                                                                                                     //
                                                                                                                     //
Ap._reportLoginFailure = function (methodInvocation, methodName, methodArgs, result) {                               // 390
  var attempt = {                                                                                                    // 396
    type: result.type || "unknown",                                                                                  // 397
    allowed: false,                                                                                                  // 398
    error: result.error,                                                                                             // 399
    methodName: methodName,                                                                                          // 400
    methodArguments: _.toArray(methodArgs)                                                                           // 401
  };                                                                                                                 // 396
                                                                                                                     //
  if (result.userId) {                                                                                               // 404
    attempt.user = this.users.findOne(result.userId);                                                                // 405
  }                                                                                                                  // 406
                                                                                                                     //
  this._validateLogin(methodInvocation.connection, attempt);                                                         // 408
                                                                                                                     //
  this._failedLogin(methodInvocation.connection, attempt); // _validateLogin may mutate attempt to set a new error message. Return
  // the modified version.                                                                                           // 412
                                                                                                                     //
                                                                                                                     //
  return attempt;                                                                                                    // 413
}; ///                                                                                                               // 414
/// LOGIN HANDLERS                                                                                                   // 418
///                                                                                                                  // 419
// The main entry point for auth packages to hook in to login.                                                       // 421
//                                                                                                                   // 422
// A login handler is a login method which can return `undefined` to                                                 // 423
// indicate that the login request is not handled by this handler.                                                   // 424
//                                                                                                                   // 425
// @param name {String} Optional.  The service name, used by default                                                 // 426
// if a specific service name isn't returned in the result.                                                          // 427
//                                                                                                                   // 428
// @param handler {Function} A function that receives an options object                                              // 429
// (as passed as an argument to the `login` method) and returns one of:                                              // 430
// - `undefined`, meaning don't handle;                                                                              // 431
// - a login method result object                                                                                    // 432
                                                                                                                     //
                                                                                                                     //
Ap.registerLoginHandler = function (name, handler) {                                                                 // 434
  if (!handler) {                                                                                                    // 435
    handler = name;                                                                                                  // 436
    name = null;                                                                                                     // 437
  }                                                                                                                  // 438
                                                                                                                     //
  this._loginHandlers.push({                                                                                         // 440
    name: name,                                                                                                      // 441
    handler: handler                                                                                                 // 442
  });                                                                                                                // 440
}; // Checks a user's credentials against all the registered login                                                   // 444
// handlers, and returns a login token if the credentials are valid. It                                              // 448
// is like the login method, except that it doesn't set the logged-in                                                // 449
// user on the connection. Throws a Meteor.Error if logging in fails,                                                // 450
// including the case where none of the login handlers handled the login                                             // 451
// request. Otherwise, returns {id: userId, token: *, tokenExpires: *}.                                              // 452
//                                                                                                                   // 453
// For example, if you want to login with a plaintext password, `options` could be                                   // 454
//   { user: { username: <username> }, password: <password> }, or                                                    // 455
//   { user: { email: <email> }, password: <password> }.                                                             // 456
// Try all of the registered login handlers until one of them doesn't                                                // 458
// return `undefined`, meaning it handled this call to `login`. Return                                               // 459
// that return value.                                                                                                // 460
                                                                                                                     //
                                                                                                                     //
Ap._runLoginHandlers = function (methodInvocation, options) {                                                        // 461
  for (var i = 0; i < this._loginHandlers.length; ++i) {                                                             // 462
    var handler = this._loginHandlers[i];                                                                            // 463
    var result = tryLoginMethod(handler.name, function () {                                                          // 465
      return handler.handler.call(methodInvocation, options);                                                        // 468
    });                                                                                                              // 469
                                                                                                                     //
    if (result) {                                                                                                    // 472
      return result;                                                                                                 // 473
    }                                                                                                                // 474
                                                                                                                     //
    if (result !== undefined) {                                                                                      // 476
      throw new Meteor.Error(400, "A login handler should return a result or undefined");                            // 477
    }                                                                                                                // 478
  }                                                                                                                  // 479
                                                                                                                     //
  return {                                                                                                           // 481
    type: null,                                                                                                      // 482
    error: new Meteor.Error(400, "Unrecognized options for login request")                                           // 483
  };                                                                                                                 // 481
}; // Deletes the given loginToken from the database.                                                                // 485
//                                                                                                                   // 488
// For new-style hashed token, this will cause all connections                                                       // 489
// associated with the token to be closed.                                                                           // 490
//                                                                                                                   // 491
// Any connections associated with old-style unhashed tokens will be                                                 // 492
// in the process of becoming associated with hashed tokens and then                                                 // 493
// they'll get closed.                                                                                               // 494
                                                                                                                     //
                                                                                                                     //
Ap.destroyToken = function (userId, loginToken) {                                                                    // 495
  this.users.update(userId, {                                                                                        // 496
    $pull: {                                                                                                         // 497
      "services.resume.loginTokens": {                                                                               // 498
        $or: [{                                                                                                      // 499
          hashedToken: loginToken                                                                                    // 500
        }, {                                                                                                         // 500
          token: loginToken                                                                                          // 501
        }]                                                                                                           // 501
      }                                                                                                              // 498
    }                                                                                                                // 497
  });                                                                                                                // 496
};                                                                                                                   // 506
                                                                                                                     //
Ap._initServerMethods = function () {                                                                                // 508
  // The methods created in this function need to be created here so that                                            // 509
  // this variable is available in their scope.                                                                      // 510
  var accounts = this; // This object will be populated with methods and then passed to                              // 511
  // accounts._server.methods further below.                                                                         // 514
                                                                                                                     //
  var methods = {}; // @returns {Object|null}                                                                        // 515
  //   If successful, returns {token: reconnectToken, id: userId}                                                    // 518
  //   If unsuccessful (for example, if the user closed the oauth login popup),                                      // 519
  //     throws an error describing the reason                                                                       // 520
                                                                                                                     //
  methods.login = function (options) {                                                                               // 521
    var self = this; // Login handlers should really also check whatever field they look at in                       // 522
    // options, but we don't enforce it.                                                                             // 525
                                                                                                                     //
    check(options, Object);                                                                                          // 526
                                                                                                                     //
    var result = accounts._runLoginHandlers(self, options);                                                          // 528
                                                                                                                     //
    return accounts._attemptLogin(self, "login", arguments, result);                                                 // 530
  };                                                                                                                 // 531
                                                                                                                     //
  methods.logout = function () {                                                                                     // 533
    var token = accounts._getLoginToken(this.connection.id);                                                         // 534
                                                                                                                     //
    accounts._setLoginToken(this.userId, this.connection, null);                                                     // 535
                                                                                                                     //
    if (token && this.userId) accounts.destroyToken(this.userId, token);                                             // 536
                                                                                                                     //
    accounts._successfulLogout(this.connection, this.userId);                                                        // 538
                                                                                                                     //
    this.setUserId(null);                                                                                            // 539
  }; // Delete all the current user's tokens and close all open connections logged                                   // 540
  // in as this user. Returns a fresh new login token that this client can                                           // 543
  // use. Tests set Accounts._noConnectionCloseDelayForTest to delete tokens                                         // 544
  // immediately instead of using a delay.                                                                           // 545
  //                                                                                                                 // 546
  // XXX COMPAT WITH 0.7.2                                                                                           // 547
  // This single `logoutOtherClients` method has been replaced with two                                              // 548
  // methods, one that you call to get a new token, and another that you                                             // 549
  // call to remove all tokens except your own. The new design allows                                                // 550
  // clients to know when other clients have actually been logged                                                    // 551
  // out. (The `logoutOtherClients` method guarantees the caller that                                                // 552
  // the other clients will be logged out at some point, but makes no                                                // 553
  // guarantees about when.) This method is left in for backwards                                                    // 554
  // compatibility, especially since application code might be calling                                               // 555
  // this method directly.                                                                                           // 556
  //                                                                                                                 // 557
  // @returns {Object} Object with token and tokenExpires keys.                                                      // 558
                                                                                                                     //
                                                                                                                     //
  methods.logoutOtherClients = function () {                                                                         // 559
    var self = this;                                                                                                 // 560
    var user = accounts.users.findOne(self.userId, {                                                                 // 561
      fields: {                                                                                                      // 562
        "services.resume.loginTokens": true                                                                          // 563
      }                                                                                                              // 562
    });                                                                                                              // 561
                                                                                                                     //
    if (user) {                                                                                                      // 566
      // Save the current tokens in the database to be deleted in                                                    // 567
      // CONNECTION_CLOSE_DELAY_MS ms. This gives other connections in the                                           // 568
      // caller's browser time to find the fresh token in localStorage. We save                                      // 569
      // the tokens in the database in case we crash before actually deleting                                        // 570
      // them.                                                                                                       // 571
      var tokens = user.services.resume.loginTokens;                                                                 // 572
                                                                                                                     //
      var newToken = accounts._generateStampedLoginToken();                                                          // 573
                                                                                                                     //
      var userId = self.userId;                                                                                      // 574
      accounts.users.update(userId, {                                                                                // 575
        $set: {                                                                                                      // 576
          "services.resume.loginTokensToDelete": tokens,                                                             // 577
          "services.resume.haveLoginTokensToDelete": true                                                            // 578
        },                                                                                                           // 576
        $push: {                                                                                                     // 580
          "services.resume.loginTokens": accounts._hashStampedToken(newToken)                                        // 580
        }                                                                                                            // 580
      });                                                                                                            // 575
      Meteor.setTimeout(function () {                                                                                // 582
        // The observe on Meteor.users will take care of closing the connections                                     // 583
        // associated with `tokens`.                                                                                 // 584
        accounts._deleteSavedTokensForUser(userId, tokens);                                                          // 585
      }, accounts._noConnectionCloseDelayForTest ? 0 : CONNECTION_CLOSE_DELAY_MS); // We do not set the login token on this connection, but instead the
      // observe closes the connection and the client will reconnect with the                                        // 589
      // new token.                                                                                                  // 590
                                                                                                                     //
      return {                                                                                                       // 591
        token: newToken.token,                                                                                       // 592
        tokenExpires: accounts._tokenExpiration(newToken.when)                                                       // 593
      };                                                                                                             // 591
    } else {                                                                                                         // 595
      throw new Meteor.Error("You are not logged in.");                                                              // 596
    }                                                                                                                // 597
  }; // Generates a new login token with the same expiration as the                                                  // 598
  // connection's current token and saves it to the database. Associates                                             // 601
  // the connection with this new token and returns it. Throws an error                                              // 602
  // if called on a connection that isn't logged in.                                                                 // 603
  //                                                                                                                 // 604
  // @returns Object                                                                                                 // 605
  //   If successful, returns { token: <new token>, id: <user id>,                                                   // 606
  //   tokenExpires: <expiration date> }.                                                                            // 607
                                                                                                                     //
                                                                                                                     //
  methods.getNewToken = function () {                                                                                // 608
    var self = this;                                                                                                 // 609
    var user = accounts.users.findOne(self.userId, {                                                                 // 610
      fields: {                                                                                                      // 611
        "services.resume.loginTokens": 1                                                                             // 611
      }                                                                                                              // 611
    });                                                                                                              // 610
                                                                                                                     //
    if (!self.userId || !user) {                                                                                     // 613
      throw new Meteor.Error("You are not logged in.");                                                              // 614
    } // Be careful not to generate a new token that has a later                                                     // 615
    // expiration than the curren token. Otherwise, a bad guy with a                                                 // 617
    // stolen token could use this method to stop his stolen token from                                              // 618
    // ever expiring.                                                                                                // 619
                                                                                                                     //
                                                                                                                     //
    var currentHashedToken = accounts._getLoginToken(self.connection.id);                                            // 620
                                                                                                                     //
    var currentStampedToken = _.find(user.services.resume.loginTokens, function (stampedToken) {                     // 621
      return stampedToken.hashedToken === currentHashedToken;                                                        // 624
    });                                                                                                              // 625
                                                                                                                     //
    if (!currentStampedToken) {                                                                                      // 627
      // safety belt: this should never happen                                                                       // 627
      throw new Meteor.Error("Invalid login token");                                                                 // 628
    }                                                                                                                // 629
                                                                                                                     //
    var newStampedToken = accounts._generateStampedLoginToken();                                                     // 630
                                                                                                                     //
    newStampedToken.when = currentStampedToken.when;                                                                 // 631
                                                                                                                     //
    accounts._insertLoginToken(self.userId, newStampedToken);                                                        // 632
                                                                                                                     //
    return accounts._loginUser(self, self.userId, newStampedToken);                                                  // 633
  }; // Removes all tokens except the token associated with the current                                              // 634
  // connection. Throws an error if the connection is not logged                                                     // 637
  // in. Returns nothing on success.                                                                                 // 638
                                                                                                                     //
                                                                                                                     //
  methods.removeOtherTokens = function () {                                                                          // 639
    var self = this;                                                                                                 // 640
                                                                                                                     //
    if (!self.userId) {                                                                                              // 641
      throw new Meteor.Error("You are not logged in.");                                                              // 642
    }                                                                                                                // 643
                                                                                                                     //
    var currentToken = accounts._getLoginToken(self.connection.id);                                                  // 644
                                                                                                                     //
    accounts.users.update(self.userId, {                                                                             // 645
      $pull: {                                                                                                       // 646
        "services.resume.loginTokens": {                                                                             // 647
          hashedToken: {                                                                                             // 647
            $ne: currentToken                                                                                        // 647
          }                                                                                                          // 647
        }                                                                                                            // 647
      }                                                                                                              // 646
    });                                                                                                              // 645
  }; // Allow a one-time configuration for a login service. Modifications                                            // 650
  // to this collection are also allowed in insecure mode.                                                           // 653
                                                                                                                     //
                                                                                                                     //
  methods.configureLoginService = function (options) {                                                               // 654
    check(options, Match.ObjectIncluding({                                                                           // 655
      service: String                                                                                                // 655
    })); // Don't let random users configure a service we haven't added yet (so                                      // 655
    // that when we do later add it, it's set up with their configuration                                            // 657
    // instead of ours).                                                                                             // 658
    // XXX if service configuration is oauth-specific then this code should                                          // 659
    //     be in accounts-oauth; if it's not then the registry should be                                             // 660
    //     in this package                                                                                           // 661
                                                                                                                     //
    if (!(accounts.oauth && _.contains(accounts.oauth.serviceNames(), options.service))) {                           // 662
      throw new Meteor.Error(403, "Service unknown");                                                                // 664
    }                                                                                                                // 665
                                                                                                                     //
    var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;                                // 667
    if (ServiceConfiguration.configurations.findOne({                                                                // 669
      service: options.service                                                                                       // 669
    })) throw new Meteor.Error(403, "Service " + options.service + " already configured");                           // 669
    if (_.has(options, "secret") && usingOAuthEncryption()) options.secret = OAuthEncryption.seal(options.secret);   // 672
    ServiceConfiguration.configurations.insert(options);                                                             // 675
  };                                                                                                                 // 676
                                                                                                                     //
  accounts._server.methods(methods);                                                                                 // 678
};                                                                                                                   // 679
                                                                                                                     //
Ap._initAccountDataHooks = function () {                                                                             // 681
  var accounts = this;                                                                                               // 682
                                                                                                                     //
  accounts._server.onConnection(function (connection) {                                                              // 684
    accounts._accountData[connection.id] = {                                                                         // 685
      connection: connection                                                                                         // 686
    };                                                                                                               // 685
    connection.onClose(function () {                                                                                 // 689
      accounts._removeTokenFromConnection(connection.id);                                                            // 690
                                                                                                                     //
      delete accounts._accountData[connection.id];                                                                   // 691
    });                                                                                                              // 692
  });                                                                                                                // 693
};                                                                                                                   // 694
                                                                                                                     //
Ap._initServerPublications = function () {                                                                           // 696
  var accounts = this; // Publish all login service configuration fields other than secret.                          // 697
                                                                                                                     //
  accounts._server.publish("meteor.loginServiceConfiguration", function () {                                         // 700
    var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;                                // 701
    return ServiceConfiguration.configurations.find({}, {                                                            // 703
      fields: {                                                                                                      // 703
        secret: 0                                                                                                    // 703
      }                                                                                                              // 703
    });                                                                                                              // 703
  }, {                                                                                                               // 704
    is_auto: true                                                                                                    // 704
  }); // not techincally autopublish, but stops the warning.                                                         // 704
  // Publish the current user's record to the client.                                                                // 706
                                                                                                                     //
                                                                                                                     //
  accounts._server.publish(null, function () {                                                                       // 707
    if (this.userId) {                                                                                               // 708
      return accounts.users.find({                                                                                   // 709
        _id: this.userId                                                                                             // 710
      }, {                                                                                                           // 709
        fields: {                                                                                                    // 712
          profile: 1,                                                                                                // 713
          username: 1,                                                                                               // 714
          emails: 1                                                                                                  // 715
        }                                                                                                            // 712
      });                                                                                                            // 711
    } else {                                                                                                         // 718
      return null;                                                                                                   // 719
    }                                                                                                                // 720
  }, /*suppress autopublish warning*/{                                                                               // 721
    is_auto: true                                                                                                    // 721
  }); // Use Meteor.startup to give other packages a chance to call                                                  // 721
  // addAutopublishFields.                                                                                           // 724
                                                                                                                     //
                                                                                                                     //
  Package.autopublish && Meteor.startup(function () {                                                                // 725
    // ['profile', 'username'] -> {profile: 1, username: 1}                                                          // 726
    var toFieldSelector = function (fields) {                                                                        // 727
      return _.object(_.map(fields, function (field) {                                                               // 728
        return [field, 1];                                                                                           // 729
      }));                                                                                                           // 730
    };                                                                                                               // 731
                                                                                                                     //
    accounts._server.publish(null, function () {                                                                     // 733
      if (this.userId) {                                                                                             // 734
        return accounts.users.find({                                                                                 // 735
          _id: this.userId                                                                                           // 736
        }, {                                                                                                         // 735
          fields: toFieldSelector(accounts._autopublishFields.loggedInUser)                                          // 738
        });                                                                                                          // 737
      } else {                                                                                                       // 740
        return null;                                                                                                 // 741
      }                                                                                                              // 742
    }, /*suppress autopublish warning*/{                                                                             // 743
      is_auto: true                                                                                                  // 743
    }); // XXX this publish is neither dedup-able nor is it optimized by our special                                 // 743
    // treatment of queries on a specific _id. Therefore this will have O(n^2)                                       // 746
    // run-time performance every time a user document is changed (eg someone                                        // 747
    // logging in). If this is a problem, we can instead write a manual publish                                      // 748
    // function which filters out fields based on 'this.userId'.                                                     // 749
                                                                                                                     //
                                                                                                                     //
    accounts._server.publish(null, function () {                                                                     // 750
      var selector = this.userId ? {                                                                                 // 751
        _id: {                                                                                                       // 752
          $ne: this.userId                                                                                           // 752
        }                                                                                                            // 752
      } : {};                                                                                                        // 751
      return accounts.users.find(selector, {                                                                         // 755
        fields: toFieldSelector(accounts._autopublishFields.otherUsers)                                              // 756
      });                                                                                                            // 755
    }, /*suppress autopublish warning*/{                                                                             // 758
      is_auto: true                                                                                                  // 758
    });                                                                                                              // 758
  });                                                                                                                // 759
}; // Add to the list of fields or subfields to be automatically                                                     // 760
// published if autopublish is on. Must be called from top-level                                                     // 763
// code (ie, before Meteor.startup hooks run).                                                                       // 764
//                                                                                                                   // 765
// @param opts {Object} with:                                                                                        // 766
//   - forLoggedInUser {Array} Array of fields published to the logged-in user                                       // 767
//   - forOtherUsers {Array} Array of fields published to users that aren't logged in                                // 768
                                                                                                                     //
                                                                                                                     //
Ap.addAutopublishFields = function (opts) {                                                                          // 769
  this._autopublishFields.loggedInUser.push.apply(this._autopublishFields.loggedInUser, opts.forLoggedInUser);       // 770
                                                                                                                     //
  this._autopublishFields.otherUsers.push.apply(this._autopublishFields.otherUsers, opts.forOtherUsers);             // 772
}; ///                                                                                                               // 774
/// ACCOUNT DATA                                                                                                     // 777
///                                                                                                                  // 778
// HACK: This is used by 'meteor-accounts' to get the loginToken for a                                               // 780
// connection. Maybe there should be a public way to do that.                                                        // 781
                                                                                                                     //
                                                                                                                     //
Ap._getAccountData = function (connectionId, field) {                                                                // 782
  var data = this._accountData[connectionId];                                                                        // 783
  return data && data[field];                                                                                        // 784
};                                                                                                                   // 785
                                                                                                                     //
Ap._setAccountData = function (connectionId, field, value) {                                                         // 787
  var data = this._accountData[connectionId]; // safety belt. shouldn't happen. accountData is set in onConnection,  // 788
  // we don't have a connectionId until it is set.                                                                   // 791
                                                                                                                     //
  if (!data) return;                                                                                                 // 792
  if (value === undefined) delete data[field];else data[field] = value;                                              // 795
}; ///                                                                                                               // 799
/// RECONNECT TOKENS                                                                                                 // 803
///                                                                                                                  // 804
/// support reconnecting using a meteor login token                                                                  // 805
                                                                                                                     //
                                                                                                                     //
Ap._hashLoginToken = function (loginToken) {                                                                         // 807
  var hash = crypto.createHash('sha256');                                                                            // 808
  hash.update(loginToken);                                                                                           // 809
  return hash.digest('base64');                                                                                      // 810
}; // {token, when} => {hashedToken, when}                                                                           // 811
                                                                                                                     //
                                                                                                                     //
Ap._hashStampedToken = function (stampedToken) {                                                                     // 815
  return _.extend(_.omit(stampedToken, 'token'), {                                                                   // 816
    hashedToken: this._hashLoginToken(stampedToken.token)                                                            // 817
  });                                                                                                                // 816
}; // Using $addToSet avoids getting an index error if another client                                                // 819
// logging in simultaneously has already inserted the new hashed                                                     // 823
// token.                                                                                                            // 824
                                                                                                                     //
                                                                                                                     //
Ap._insertHashedLoginToken = function (userId, hashedToken, query) {                                                 // 825
  query = query ? _.clone(query) : {};                                                                               // 826
  query._id = userId;                                                                                                // 827
  this.users.update(query, {                                                                                         // 828
    $addToSet: {                                                                                                     // 829
      "services.resume.loginTokens": hashedToken                                                                     // 830
    }                                                                                                                // 829
  });                                                                                                                // 828
}; // Exported for tests.                                                                                            // 833
                                                                                                                     //
                                                                                                                     //
Ap._insertLoginToken = function (userId, stampedToken, query) {                                                      // 837
  this._insertHashedLoginToken(userId, this._hashStampedToken(stampedToken), query);                                 // 838
};                                                                                                                   // 843
                                                                                                                     //
Ap._clearAllLoginTokens = function (userId) {                                                                        // 846
  this.users.update(userId, {                                                                                        // 847
    $set: {                                                                                                          // 848
      'services.resume.loginTokens': []                                                                              // 849
    }                                                                                                                // 848
  });                                                                                                                // 847
}; // test hook                                                                                                      // 852
                                                                                                                     //
                                                                                                                     //
Ap._getUserObserve = function (connectionId) {                                                                       // 855
  return this._userObservesForConnections[connectionId];                                                             // 856
}; // Clean up this connection's association with the token: that is, stop                                           // 857
// the observe that we started when we associated the connection with                                                // 860
// this token.                                                                                                       // 861
                                                                                                                     //
                                                                                                                     //
Ap._removeTokenFromConnection = function (connectionId) {                                                            // 862
  if (_.has(this._userObservesForConnections, connectionId)) {                                                       // 863
    var observe = this._userObservesForConnections[connectionId];                                                    // 864
                                                                                                                     //
    if (typeof observe === 'number') {                                                                               // 865
      // We're in the process of setting up an observe for this connection. We                                       // 866
      // can't clean up that observe yet, but if we delete the placeholder for                                       // 867
      // this connection, then the observe will get cleaned up as soon as it has                                     // 868
      // been set up.                                                                                                // 869
      delete this._userObservesForConnections[connectionId];                                                         // 870
    } else {                                                                                                         // 871
      delete this._userObservesForConnections[connectionId];                                                         // 872
      observe.stop();                                                                                                // 873
    }                                                                                                                // 874
  }                                                                                                                  // 875
};                                                                                                                   // 876
                                                                                                                     //
Ap._getLoginToken = function (connectionId) {                                                                        // 878
  return this._getAccountData(connectionId, 'loginToken');                                                           // 879
}; // newToken is a hashed token.                                                                                    // 880
                                                                                                                     //
                                                                                                                     //
Ap._setLoginToken = function (userId, connection, newToken) {                                                        // 883
  var self = this;                                                                                                   // 884
                                                                                                                     //
  self._removeTokenFromConnection(connection.id);                                                                    // 886
                                                                                                                     //
  self._setAccountData(connection.id, 'loginToken', newToken);                                                       // 887
                                                                                                                     //
  if (newToken) {                                                                                                    // 889
    // Set up an observe for this token. If the token goes away, we need                                             // 890
    // to close the connection.  We defer the observe because there's                                                // 891
    // no need for it to be on the critical path for login; we just need                                             // 892
    // to ensure that the connection will get closed at some point if                                                // 893
    // the token gets deleted.                                                                                       // 894
    //                                                                                                               // 895
    // Initially, we set the observe for this connection to a number; this                                           // 896
    // signifies to other code (which might run while we yield) that we are in                                       // 897
    // the process of setting up an observe for this connection. Once the                                            // 898
    // observe is ready to go, we replace the number with the real observe                                           // 899
    // handle (unless the placeholder has been deleted or replaced by a                                              // 900
    // different placehold number, signifying that the connection was closed                                         // 901
    // already -- in this case we just clean up the observe that we started).                                        // 902
    var myObserveNumber = ++self._nextUserObserveNumber;                                                             // 903
    self._userObservesForConnections[connection.id] = myObserveNumber;                                               // 904
    Meteor.defer(function () {                                                                                       // 905
      // If something else happened on this connection in the meantime (it got                                       // 906
      // closed, or another call to _setLoginToken happened), just do                                                // 907
      // nothing. We don't need to start an observe for an old connection or old                                     // 908
      // token.                                                                                                      // 909
      if (self._userObservesForConnections[connection.id] !== myObserveNumber) {                                     // 910
        return;                                                                                                      // 911
      }                                                                                                              // 912
                                                                                                                     //
      var foundMatchingUser; // Because we upgrade unhashed login tokens to hashed tokens at                         // 914
      // login time, sessions will only be logged in with a hashed                                                   // 916
      // token. Thus we only need to observe hashed tokens here.                                                     // 917
                                                                                                                     //
      var observe = self.users.find({                                                                                // 918
        _id: userId,                                                                                                 // 919
        'services.resume.loginTokens.hashedToken': newToken                                                          // 920
      }, {                                                                                                           // 918
        fields: {                                                                                                    // 921
          _id: 1                                                                                                     // 921
        }                                                                                                            // 921
      }).observeChanges({                                                                                            // 921
        added: function () {                                                                                         // 922
          foundMatchingUser = true;                                                                                  // 923
        },                                                                                                           // 924
        removed: function () {                                                                                       // 925
          connection.close(); // The onClose callback for the connection takes care of                               // 926
          // cleaning up the observe handle and any other state we have                                              // 928
          // lying around.                                                                                           // 929
        }                                                                                                            // 930
      }); // If the user ran another login or logout command we were waiting for the                                 // 921
      // defer or added to fire (ie, another call to _setLoginToken occurred),                                       // 934
      // then we let the later one win (start an observe, etc) and just stop our                                     // 935
      // observe now.                                                                                                // 936
      //                                                                                                             // 937
      // Similarly, if the connection was already closed, then the onClose                                           // 938
      // callback would have called _removeTokenFromConnection and there won't                                       // 939
      // be an entry in _userObservesForConnections. We can stop the observe.                                        // 940
                                                                                                                     //
      if (self._userObservesForConnections[connection.id] !== myObserveNumber) {                                     // 941
        observe.stop();                                                                                              // 942
        return;                                                                                                      // 943
      }                                                                                                              // 944
                                                                                                                     //
      self._userObservesForConnections[connection.id] = observe;                                                     // 946
                                                                                                                     //
      if (!foundMatchingUser) {                                                                                      // 948
        // We've set up an observe on the user associated with `newToken`,                                           // 949
        // so if the new token is removed from the database, we'll close                                             // 950
        // the connection. But the token might have already been deleted                                             // 951
        // before we set up the observe, which wouldn't have closed the                                              // 952
        // connection because the observe wasn't running yet.                                                        // 953
        connection.close();                                                                                          // 954
      }                                                                                                              // 955
    });                                                                                                              // 956
  }                                                                                                                  // 957
};                                                                                                                   // 958
                                                                                                                     //
function setupDefaultLoginHandlers(accounts) {                                                                       // 960
  accounts.registerLoginHandler("resume", function (options) {                                                       // 961
    return defaultResumeLoginHandler.call(this, accounts, options);                                                  // 962
  });                                                                                                                // 963
} // Login handler for resume tokens.                                                                                // 964
                                                                                                                     //
                                                                                                                     //
function defaultResumeLoginHandler(accounts, options) {                                                              // 967
  if (!options.resume) return undefined;                                                                             // 968
  check(options.resume, String);                                                                                     // 971
                                                                                                                     //
  var hashedToken = accounts._hashLoginToken(options.resume); // First look for just the new-style hashed login token, to avoid
  // sending the unhashed token to the database in a query if we don't                                               // 976
  // need to.                                                                                                        // 977
                                                                                                                     //
                                                                                                                     //
  var user = accounts.users.findOne({                                                                                // 978
    "services.resume.loginTokens.hashedToken": hashedToken                                                           // 979
  });                                                                                                                // 979
                                                                                                                     //
  if (!user) {                                                                                                       // 981
    // If we didn't find the hashed login token, try also looking for                                                // 982
    // the old-style unhashed token.  But we need to look for either                                                 // 983
    // the old-style token OR the new-style token, because another                                                   // 984
    // client connection logging in simultaneously might have already                                                // 985
    // converted the token.                                                                                          // 986
    user = accounts.users.findOne({                                                                                  // 987
      $or: [{                                                                                                        // 988
        "services.resume.loginTokens.hashedToken": hashedToken                                                       // 989
      }, {                                                                                                           // 989
        "services.resume.loginTokens.token": options.resume                                                          // 990
      }]                                                                                                             // 990
    });                                                                                                              // 987
  }                                                                                                                  // 993
                                                                                                                     //
  if (!user) return {                                                                                                // 995
    error: new Meteor.Error(403, "You've been logged out by the server. Please log in again.")                       // 997
  }; // Find the token, which will either be an object with fields                                                   // 996
  // {hashedToken, when} for a hashed token or {token, when} for an                                                  // 1001
  // unhashed token.                                                                                                 // 1002
                                                                                                                     //
  var oldUnhashedStyleToken;                                                                                         // 1003
                                                                                                                     //
  var token = _.find(user.services.resume.loginTokens, function (token) {                                            // 1004
    return token.hashedToken === hashedToken;                                                                        // 1005
  });                                                                                                                // 1006
                                                                                                                     //
  if (token) {                                                                                                       // 1007
    oldUnhashedStyleToken = false;                                                                                   // 1008
  } else {                                                                                                           // 1009
    token = _.find(user.services.resume.loginTokens, function (token) {                                              // 1010
      return token.token === options.resume;                                                                         // 1011
    });                                                                                                              // 1012
    oldUnhashedStyleToken = true;                                                                                    // 1013
  }                                                                                                                  // 1014
                                                                                                                     //
  var tokenExpires = accounts._tokenExpiration(token.when);                                                          // 1016
                                                                                                                     //
  if (new Date() >= tokenExpires) return {                                                                           // 1017
    userId: user._id,                                                                                                // 1019
    error: new Meteor.Error(403, "Your session has expired. Please log in again.")                                   // 1020
  }; // Update to a hashed token when an unhashed token is encountered.                                              // 1018
                                                                                                                     //
  if (oldUnhashedStyleToken) {                                                                                       // 1024
    // Only add the new hashed token if the old unhashed token still                                                 // 1025
    // exists (this avoids resurrecting the token if it was deleted                                                  // 1026
    // after we read it).  Using $addToSet avoids getting an index                                                   // 1027
    // error if another client logging in simultaneously has already                                                 // 1028
    // inserted the new hashed token.                                                                                // 1029
    accounts.users.update({                                                                                          // 1030
      _id: user._id,                                                                                                 // 1032
      "services.resume.loginTokens.token": options.resume                                                            // 1033
    }, {                                                                                                             // 1031
      $addToSet: {                                                                                                   // 1035
        "services.resume.loginTokens": {                                                                             // 1036
          "hashedToken": hashedToken,                                                                                // 1037
          "when": token.when                                                                                         // 1038
        }                                                                                                            // 1036
      }                                                                                                              // 1035
    }); // Remove the old token *after* adding the new, since otherwise                                              // 1035
    // another client trying to login between our removing the old and                                               // 1044
    // adding the new wouldn't find a token to login with.                                                           // 1045
                                                                                                                     //
    accounts.users.update(user._id, {                                                                                // 1046
      $pull: {                                                                                                       // 1047
        "services.resume.loginTokens": {                                                                             // 1048
          "token": options.resume                                                                                    // 1048
        }                                                                                                            // 1048
      }                                                                                                              // 1047
    });                                                                                                              // 1046
  }                                                                                                                  // 1051
                                                                                                                     //
  return {                                                                                                           // 1053
    userId: user._id,                                                                                                // 1054
    stampedLoginToken: {                                                                                             // 1055
      token: options.resume,                                                                                         // 1056
      when: token.when                                                                                               // 1057
    }                                                                                                                // 1055
  };                                                                                                                 // 1053
} // (Also used by Meteor Accounts server and tests).                                                                // 1060
//                                                                                                                   // 1063
                                                                                                                     //
                                                                                                                     //
Ap._generateStampedLoginToken = function () {                                                                        // 1064
  return {                                                                                                           // 1065
    token: Random.secret(),                                                                                          // 1066
    when: new Date()                                                                                                 // 1067
  };                                                                                                                 // 1065
}; ///                                                                                                               // 1069
/// TOKEN EXPIRATION                                                                                                 // 1072
///                                                                                                                  // 1073
                                                                                                                     //
                                                                                                                     //
function expirePasswordToken(accounts, oldestValidDate, tokenFilter, userId) {                                       // 1075
  var userFilter = userId ? {                                                                                        // 1076
    _id: userId                                                                                                      // 1076
  } : {};                                                                                                            // 1076
  var resetRangeOr = {                                                                                               // 1077
    $or: [{                                                                                                          // 1078
      "services.password.reset.when": {                                                                              // 1079
        $lt: oldestValidDate                                                                                         // 1079
      }                                                                                                              // 1079
    }, {                                                                                                             // 1079
      "services.password.reset.when": {                                                                              // 1080
        $lt: +oldestValidDate                                                                                        // 1080
      }                                                                                                              // 1080
    }]                                                                                                               // 1080
  };                                                                                                                 // 1077
  var expireFilter = {                                                                                               // 1083
    $and: [tokenFilter, resetRangeOr]                                                                                // 1083
  };                                                                                                                 // 1083
  accounts.users.update((0, _extends3.default)({}, userFilter, expireFilter), {                                      // 1085
    $unset: {                                                                                                        // 1086
      "services.password.reset": ""                                                                                  // 1087
    }                                                                                                                // 1086
  }, {                                                                                                               // 1085
    multi: true                                                                                                      // 1089
  });                                                                                                                // 1089
} // Deletes expired tokens from the database and closes all open connections                                        // 1090
// associated with these tokens.                                                                                     // 1093
//                                                                                                                   // 1094
// Exported for tests. Also, the arguments are only used by                                                          // 1095
// tests. oldestValidDate is simulate expiring tokens without waiting                                                // 1096
// for them to actually expire. userId is used by tests to only expire                                               // 1097
// tokens for the test user.                                                                                         // 1098
                                                                                                                     //
                                                                                                                     //
Ap._expireTokens = function (oldestValidDate, userId) {                                                              // 1099
  var tokenLifetimeMs = this._getTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!
                                                                                                                     //
                                                                                                                     //
  if (oldestValidDate && !userId || !oldestValidDate && userId) {                                                    // 1103
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");                                      // 1104
  }                                                                                                                  // 1105
                                                                                                                     //
  oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);                                       // 1107
  var userFilter = userId ? {                                                                                        // 1109
    _id: userId                                                                                                      // 1109
  } : {}; // Backwards compatible with older versions of meteor that stored login token                              // 1109
  // timestamps as numbers.                                                                                          // 1113
                                                                                                                     //
  this.users.update(_.extend(userFilter, {                                                                           // 1114
    $or: [{                                                                                                          // 1115
      "services.resume.loginTokens.when": {                                                                          // 1116
        $lt: oldestValidDate                                                                                         // 1116
      }                                                                                                              // 1116
    }, {                                                                                                             // 1116
      "services.resume.loginTokens.when": {                                                                          // 1117
        $lt: +oldestValidDate                                                                                        // 1117
      }                                                                                                              // 1117
    }]                                                                                                               // 1117
  }), {                                                                                                              // 1114
    $pull: {                                                                                                         // 1120
      "services.resume.loginTokens": {                                                                               // 1121
        $or: [{                                                                                                      // 1122
          when: {                                                                                                    // 1123
            $lt: oldestValidDate                                                                                     // 1123
          }                                                                                                          // 1123
        }, {                                                                                                         // 1123
          when: {                                                                                                    // 1124
            $lt: +oldestValidDate                                                                                    // 1124
          }                                                                                                          // 1124
        }]                                                                                                           // 1124
      }                                                                                                              // 1121
    }                                                                                                                // 1120
  }, {                                                                                                               // 1119
    multi: true                                                                                                      // 1128
  }); // The observe on Meteor.users will take care of closing connections for                                       // 1128
  // expired tokens.                                                                                                 // 1130
}; // Deletes expired password reset tokens from the database.                                                       // 1131
//                                                                                                                   // 1134
// Exported for tests. Also, the arguments are only used by                                                          // 1135
// tests. oldestValidDate is simulate expiring tokens without waiting                                                // 1136
// for them to actually expire. userId is used by tests to only expire                                               // 1137
// tokens for the test user.                                                                                         // 1138
                                                                                                                     //
                                                                                                                     //
Ap._expirePasswordResetTokens = function (oldestValidDate, userId) {                                                 // 1139
  var tokenLifetimeMs = this._getPasswordResetTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!
                                                                                                                     //
                                                                                                                     //
  if (oldestValidDate && !userId || !oldestValidDate && userId) {                                                    // 1143
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");                                      // 1144
  }                                                                                                                  // 1145
                                                                                                                     //
  oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);                                       // 1147
  var tokenFilter = {                                                                                                // 1150
    $or: [{                                                                                                          // 1151
      "services.password.reset.reason": "reset"                                                                      // 1152
    }, {                                                                                                             // 1152
      "services.password.reset.reason": {                                                                            // 1153
        $exists: false                                                                                               // 1153
      }                                                                                                              // 1153
    }]                                                                                                               // 1153
  };                                                                                                                 // 1150
  expirePasswordToken(this, oldestValidDate, tokenFilter, userId);                                                   // 1157
}; // Deletes expired password enroll tokens from the database.                                                      // 1158
//                                                                                                                   // 1161
// Exported for tests. Also, the arguments are only used by                                                          // 1162
// tests. oldestValidDate is simulate expiring tokens without waiting                                                // 1163
// for them to actually expire. userId is used by tests to only expire                                               // 1164
// tokens for the test user.                                                                                         // 1165
                                                                                                                     //
                                                                                                                     //
Ap._expirePasswordEnrollTokens = function (oldestValidDate, userId) {                                                // 1166
  var tokenLifetimeMs = this._getPasswordEnrollTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!
                                                                                                                     //
                                                                                                                     //
  if (oldestValidDate && !userId || !oldestValidDate && userId) {                                                    // 1170
    throw new Error("Bad test. Must specify both oldestValidDate and userId.");                                      // 1171
  }                                                                                                                  // 1172
                                                                                                                     //
  oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);                                       // 1174
  var tokenFilter = {                                                                                                // 1177
    "services.password.reset.reason": "enroll"                                                                       // 1178
  };                                                                                                                 // 1177
  expirePasswordToken(this, oldestValidDate, tokenFilter, userId);                                                   // 1181
}; // @override from accounts_common.js                                                                              // 1182
                                                                                                                     //
                                                                                                                     //
Ap.config = function (options) {                                                                                     // 1185
  // Call the overridden implementation of the method.                                                               // 1186
  var superResult = AccountsCommon.prototype.config.apply(this, arguments); // If the user set loginExpirationInDays to null, then we need to clear the
  // timer that periodically expires tokens.                                                                         // 1190
                                                                                                                     //
  if (_.has(this._options, "loginExpirationInDays") && this._options.loginExpirationInDays === null && this.expireTokenInterval) {
    Meteor.clearInterval(this.expireTokenInterval);                                                                  // 1194
    this.expireTokenInterval = null;                                                                                 // 1195
  }                                                                                                                  // 1196
                                                                                                                     //
  return superResult;                                                                                                // 1198
};                                                                                                                   // 1199
                                                                                                                     //
function setExpireTokensInterval(accounts) {                                                                         // 1201
  accounts.expireTokenInterval = Meteor.setInterval(function () {                                                    // 1202
    accounts._expireTokens();                                                                                        // 1203
                                                                                                                     //
    accounts._expirePasswordResetTokens();                                                                           // 1204
                                                                                                                     //
    accounts._expirePasswordEnrollTokens();                                                                          // 1205
  }, EXPIRE_TOKENS_INTERVAL_MS);                                                                                     // 1206
} ///                                                                                                                // 1207
/// OAuth Encryption Support                                                                                         // 1211
///                                                                                                                  // 1212
                                                                                                                     //
                                                                                                                     //
var OAuthEncryption = Package["oauth-encryption"] && Package["oauth-encryption"].OAuthEncryption;                    // 1214
                                                                                                                     //
function usingOAuthEncryption() {                                                                                    // 1218
  return OAuthEncryption && OAuthEncryption.keyIsLoaded();                                                           // 1219
} // OAuth service data is temporarily stored in the pending credentials                                             // 1220
// collection during the oauth authentication process.  Sensitive data                                               // 1224
// such as access tokens are encrypted without the user id because                                                   // 1225
// we don't know the user id yet.  We re-encrypt these fields with the                                               // 1226
// user id included when storing the service data permanently in                                                     // 1227
// the users collection.                                                                                             // 1228
//                                                                                                                   // 1229
                                                                                                                     //
                                                                                                                     //
function pinEncryptedFieldsToUser(serviceData, userId) {                                                             // 1230
  _.each(_.keys(serviceData), function (key) {                                                                       // 1231
    var value = serviceData[key];                                                                                    // 1232
    if (OAuthEncryption && OAuthEncryption.isSealed(value)) value = OAuthEncryption.seal(OAuthEncryption.open(value), userId);
    serviceData[key] = value;                                                                                        // 1235
  });                                                                                                                // 1236
} // Encrypt unencrypted login service secrets when oauth-encryption is                                              // 1237
// added.                                                                                                            // 1241
//                                                                                                                   // 1242
// XXX For the oauthSecretKey to be available here at startup, the                                                   // 1243
// developer must call Accounts.config({oauthSecretKey: ...}) at load                                                // 1244
// time, instead of in a Meteor.startup block, because the startup                                                   // 1245
// block in the app code will run after this accounts-base startup                                                   // 1246
// block.  Perhaps we need a post-startup callback?                                                                  // 1247
                                                                                                                     //
                                                                                                                     //
Meteor.startup(function () {                                                                                         // 1249
  if (!usingOAuthEncryption()) {                                                                                     // 1250
    return;                                                                                                          // 1251
  }                                                                                                                  // 1252
                                                                                                                     //
  var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;                                  // 1254
  ServiceConfiguration.configurations.find({                                                                         // 1257
    $and: [{                                                                                                         // 1258
      secret: {                                                                                                      // 1259
        $exists: true                                                                                                // 1259
      }                                                                                                              // 1259
    }, {                                                                                                             // 1258
      "secret.algorithm": {                                                                                          // 1261
        $exists: false                                                                                               // 1261
      }                                                                                                              // 1261
    }]                                                                                                               // 1260
  }).forEach(function (config) {                                                                                     // 1257
    ServiceConfiguration.configurations.update(config._id, {                                                         // 1264
      $set: {                                                                                                        // 1265
        secret: OAuthEncryption.seal(config.secret)                                                                  // 1266
      }                                                                                                              // 1265
    });                                                                                                              // 1264
  });                                                                                                                // 1269
}); // XXX see comment on Accounts.createUser in passwords_server about adding a                                     // 1270
// second "server options" argument.                                                                                 // 1273
                                                                                                                     //
function defaultCreateUserHook(options, user) {                                                                      // 1274
  if (options.profile) user.profile = options.profile;                                                               // 1275
  return user;                                                                                                       // 1277
} // Called by accounts-password                                                                                     // 1278
                                                                                                                     //
                                                                                                                     //
Ap.insertUserDoc = function (options, user) {                                                                        // 1281
  // - clone user document, to protect from modification                                                             // 1282
  // - add createdAt timestamp                                                                                       // 1283
  // - prepare an _id, so that you can modify other collections (eg                                                  // 1284
  // create a first task for every new user)                                                                         // 1285
  //                                                                                                                 // 1286
  // XXX If the onCreateUser or validateNewUser hooks fail, we might                                                 // 1287
  // end up having modified some other collection                                                                    // 1288
  // inappropriately. The solution is probably to have onCreateUser                                                  // 1289
  // accept two callbacks - one that gets called before inserting                                                    // 1290
  // the user document (in which you can modify its contents), and                                                   // 1291
  // one that gets called after (in which you should change other                                                    // 1292
  // collections)                                                                                                    // 1293
  user = _.extend({                                                                                                  // 1294
    createdAt: new Date(),                                                                                           // 1295
    _id: Random.id()                                                                                                 // 1296
  }, user);                                                                                                          // 1294
                                                                                                                     //
  if (user.services) {                                                                                               // 1299
    _.each(user.services, function (serviceData) {                                                                   // 1300
      pinEncryptedFieldsToUser(serviceData, user._id);                                                               // 1301
    });                                                                                                              // 1302
  }                                                                                                                  // 1303
                                                                                                                     //
  var fullUser;                                                                                                      // 1305
                                                                                                                     //
  if (this._onCreateUserHook) {                                                                                      // 1306
    fullUser = this._onCreateUserHook(options, user); // This is *not* part of the API. We need this because we can't isolate
    // the global server environment between tests, meaning we can't test                                            // 1310
    // both having a create user hook set and not having one set.                                                    // 1311
                                                                                                                     //
    if (fullUser === 'TEST DEFAULT HOOK') fullUser = defaultCreateUserHook(options, user);                           // 1312
  } else {                                                                                                           // 1314
    fullUser = defaultCreateUserHook(options, user);                                                                 // 1315
  }                                                                                                                  // 1316
                                                                                                                     //
  _.each(this._validateNewUserHooks, function (hook) {                                                               // 1318
    if (!hook(fullUser)) throw new Meteor.Error(403, "User validation failed");                                      // 1319
  });                                                                                                                // 1321
                                                                                                                     //
  var userId;                                                                                                        // 1323
                                                                                                                     //
  try {                                                                                                              // 1324
    userId = this.users.insert(fullUser);                                                                            // 1325
  } catch (e) {                                                                                                      // 1326
    // XXX string parsing sucks, maybe                                                                               // 1327
    // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day                                            // 1328
    if (e.name !== 'MongoError') throw e;                                                                            // 1329
    if (e.code !== 11000) throw e;                                                                                   // 1330
    if (e.errmsg.indexOf('emails.address') !== -1) throw new Meteor.Error(403, "Email already exists.");             // 1331
    if (e.errmsg.indexOf('username') !== -1) throw new Meteor.Error(403, "Username already exists."); // XXX better error reporting for services.facebook.id duplicate, etc
                                                                                                                     //
    throw e;                                                                                                         // 1336
  }                                                                                                                  // 1337
                                                                                                                     //
  return userId;                                                                                                     // 1338
}; // Helper function: returns false if email does not match company domain from                                     // 1339
// the configuration.                                                                                                // 1342
                                                                                                                     //
                                                                                                                     //
Ap._testEmailDomain = function (email) {                                                                             // 1343
  var domain = this._options.restrictCreationByEmailDomain;                                                          // 1344
  return !domain || _.isFunction(domain) && domain(email) || _.isString(domain) && new RegExp('@' + Meteor._escapeRegExp(domain) + '$', 'i').test(email);
}; // Validate new user's email or Google/Facebook/GitHub account's email                                            // 1349
                                                                                                                     //
                                                                                                                     //
function defaultValidateNewUserHook(user) {                                                                          // 1352
  var self = this;                                                                                                   // 1353
  var domain = self._options.restrictCreationByEmailDomain;                                                          // 1354
  if (!domain) return true;                                                                                          // 1355
  var emailIsGood = false;                                                                                           // 1358
                                                                                                                     //
  if (!_.isEmpty(user.emails)) {                                                                                     // 1359
    emailIsGood = _.any(user.emails, function (email) {                                                              // 1360
      return self._testEmailDomain(email.address);                                                                   // 1361
    });                                                                                                              // 1362
  } else if (!_.isEmpty(user.services)) {                                                                            // 1363
    // Find any email of any service and check it                                                                    // 1364
    emailIsGood = _.any(user.services, function (service) {                                                          // 1365
      return service.email && self._testEmailDomain(service.email);                                                  // 1366
    });                                                                                                              // 1367
  }                                                                                                                  // 1368
                                                                                                                     //
  if (emailIsGood) return true;                                                                                      // 1370
  if (_.isString(domain)) throw new Meteor.Error(403, "@" + domain + " email required");else throw new Meteor.Error(403, "Email doesn't match the criteria.");
} ///                                                                                                                // 1377
/// MANAGING USER OBJECTS                                                                                            // 1380
///                                                                                                                  // 1381
// Updates or creates a user after we authenticate with a 3rd party.                                                 // 1383
//                                                                                                                   // 1384
// @param serviceName {String} Service name (eg, twitter).                                                           // 1385
// @param serviceData {Object} Data to store in the user's record                                                    // 1386
//        under services[serviceName]. Must include an "id" field                                                    // 1387
//        which is a unique identifier for the user in the service.                                                  // 1388
// @param options {Object, optional} Other options to pass to insertUserDoc                                          // 1389
//        (eg, profile)                                                                                              // 1390
// @returns {Object} Object with token and id keys, like the result                                                  // 1391
//        of the "login" method.                                                                                     // 1392
//                                                                                                                   // 1393
                                                                                                                     //
                                                                                                                     //
Ap.updateOrCreateUserFromExternalService = function (serviceName, serviceData, options) {                            // 1394
  options = _.clone(options || {});                                                                                  // 1399
  if (serviceName === "password" || serviceName === "resume") throw new Error("Can't use updateOrCreateUserFromExternalService with internal service " + serviceName);
  if (!_.has(serviceData, 'id')) throw new Error("Service data for service " + serviceName + " must include id"); // Look for a user with the appropriate service user id.
                                                                                                                     //
  var selector = {};                                                                                                 // 1410
  var serviceIdKey = "services." + serviceName + ".id"; // XXX Temporary special case for Twitter. (Issue #629)      // 1411
  //   The serviceData.id will be a string representation of an integer.                                             // 1414
  //   We want it to match either a stored string or int representation.                                             // 1415
  //   This is to cater to earlier versions of Meteor storing twitter                                                // 1416
  //   user IDs in number form, and recent versions storing them as strings.                                         // 1417
  //   This can be removed once migration technology is in place, and twitter                                        // 1418
  //   users stored with integer IDs have been migrated to string IDs.                                               // 1419
                                                                                                                     //
  if (serviceName === "twitter" && !isNaN(serviceData.id)) {                                                         // 1420
    selector["$or"] = [{}, {}];                                                                                      // 1421
    selector["$or"][0][serviceIdKey] = serviceData.id;                                                               // 1422
    selector["$or"][1][serviceIdKey] = parseInt(serviceData.id, 10);                                                 // 1423
  } else {                                                                                                           // 1424
    selector[serviceIdKey] = serviceData.id;                                                                         // 1425
  }                                                                                                                  // 1426
                                                                                                                     //
  var user = this.users.findOne(selector);                                                                           // 1428
                                                                                                                     //
  if (user) {                                                                                                        // 1430
    pinEncryptedFieldsToUser(serviceData, user._id); // We *don't* process options (eg, profile) for update, but we do replace
    // the serviceData (eg, so that we keep an unexpired access token and                                            // 1434
    // don't cache old email addresses in serviceData.email).                                                        // 1435
    // XXX provide an onUpdateUser hook which would let apps update                                                  // 1436
    //     the profile too                                                                                           // 1437
                                                                                                                     //
    var setAttrs = {};                                                                                               // 1438
                                                                                                                     //
    _.each(serviceData, function (value, key) {                                                                      // 1439
      setAttrs["services." + serviceName + "." + key] = value;                                                       // 1440
    }); // XXX Maybe we should re-use the selector above and notice if the update                                    // 1441
    //     touches nothing?                                                                                          // 1444
                                                                                                                     //
                                                                                                                     //
    this.users.update(user._id, {                                                                                    // 1445
      $set: setAttrs                                                                                                 // 1446
    });                                                                                                              // 1445
    return {                                                                                                         // 1449
      type: serviceName,                                                                                             // 1450
      userId: user._id                                                                                               // 1451
    };                                                                                                               // 1449
  } else {                                                                                                           // 1454
    // Create a new user with the service data. Pass other options through to                                        // 1455
    // insertUserDoc.                                                                                                // 1456
    user = {                                                                                                         // 1457
      services: {}                                                                                                   // 1457
    };                                                                                                               // 1457
    user.services[serviceName] = serviceData;                                                                        // 1458
    return {                                                                                                         // 1459
      type: serviceName,                                                                                             // 1460
      userId: this.insertUserDoc(options, user)                                                                      // 1461
    };                                                                                                               // 1459
  }                                                                                                                  // 1463
};                                                                                                                   // 1464
                                                                                                                     //
function setupUsersCollection(users) {                                                                               // 1466
  ///                                                                                                                // 1467
  /// RESTRICTING WRITES TO USER OBJECTS                                                                             // 1468
  ///                                                                                                                // 1469
  users.allow({                                                                                                      // 1470
    // clients can modify the profile field of their own document, and                                               // 1471
    // nothing else.                                                                                                 // 1472
    update: function (userId, user, fields, modifier) {                                                              // 1473
      // make sure it is our record                                                                                  // 1474
      if (user._id !== userId) return false; // user can only modify the 'profile' field. sets to multiple           // 1475
      // sub-keys (eg profile.foo and profile.bar) are merged into entry                                             // 1479
      // in the fields list.                                                                                         // 1480
                                                                                                                     //
      if (fields.length !== 1 || fields[0] !== 'profile') return false;                                              // 1481
      return true;                                                                                                   // 1484
    },                                                                                                               // 1485
    fetch: ['_id'] // we only look at _id.                                                                           // 1486
                                                                                                                     //
  }); /// DEFAULT INDEXES ON USERS                                                                                   // 1470
                                                                                                                     //
  users._ensureIndex('username', {                                                                                   // 1490
    unique: 1,                                                                                                       // 1490
    sparse: 1                                                                                                        // 1490
  });                                                                                                                // 1490
                                                                                                                     //
  users._ensureIndex('emails.address', {                                                                             // 1491
    unique: 1,                                                                                                       // 1491
    sparse: 1                                                                                                        // 1491
  });                                                                                                                // 1491
                                                                                                                     //
  users._ensureIndex('services.resume.loginTokens.hashedToken', {                                                    // 1492
    unique: 1,                                                                                                       // 1493
    sparse: 1                                                                                                        // 1493
  });                                                                                                                // 1493
                                                                                                                     //
  users._ensureIndex('services.resume.loginTokens.token', {                                                          // 1494
    unique: 1,                                                                                                       // 1495
    sparse: 1                                                                                                        // 1495
  }); // For taking care of logoutOtherClients calls that crashed before the                                         // 1495
  // tokens were deleted.                                                                                            // 1497
                                                                                                                     //
                                                                                                                     //
  users._ensureIndex('services.resume.haveLoginTokensToDelete', {                                                    // 1498
    sparse: 1                                                                                                        // 1499
  }); // For expiring login tokens                                                                                   // 1499
                                                                                                                     //
                                                                                                                     //
  users._ensureIndex("services.resume.loginTokens.when", {                                                           // 1501
    sparse: 1                                                                                                        // 1501
  }); // For expiring password tokens                                                                                // 1501
                                                                                                                     //
                                                                                                                     //
  users._ensureIndex('services.password.reset.when', {                                                               // 1503
    sparse: 1                                                                                                        // 1503
  });                                                                                                                // 1503
} ///                                                                                                                // 1504
/// CLEAN UP FOR `logoutOtherClients`                                                                                // 1507
///                                                                                                                  // 1508
                                                                                                                     //
                                                                                                                     //
Ap._deleteSavedTokensForUser = function (userId, tokensToDelete) {                                                   // 1510
  if (tokensToDelete) {                                                                                              // 1511
    this.users.update(userId, {                                                                                      // 1512
      $unset: {                                                                                                      // 1513
        "services.resume.haveLoginTokensToDelete": 1,                                                                // 1514
        "services.resume.loginTokensToDelete": 1                                                                     // 1515
      },                                                                                                             // 1513
      $pullAll: {                                                                                                    // 1517
        "services.resume.loginTokens": tokensToDelete                                                                // 1518
      }                                                                                                              // 1517
    });                                                                                                              // 1512
  }                                                                                                                  // 1521
};                                                                                                                   // 1522
                                                                                                                     //
Ap._deleteSavedTokensForAllUsersOnStartup = function () {                                                            // 1524
  var self = this; // If we find users who have saved tokens to delete on startup, delete                            // 1525
  // them now. It's possible that the server could have crashed and come                                             // 1528
  // back up before new tokens are found in localStorage, but this                                                   // 1529
  // shouldn't happen very often. We shouldn't put a delay here because                                              // 1530
  // that would give a lot of power to an attacker with a stolen login                                               // 1531
  // token and the ability to crash the server.                                                                      // 1532
                                                                                                                     //
  Meteor.startup(function () {                                                                                       // 1533
    self.users.find({                                                                                                // 1534
      "services.resume.haveLoginTokensToDelete": true                                                                // 1535
    }, {                                                                                                             // 1534
      "services.resume.loginTokensToDelete": 1                                                                       // 1537
    }).forEach(function (user) {                                                                                     // 1536
      self._deleteSavedTokensForUser(user._id, user.services.resume.loginTokensToDelete);                            // 1539
    });                                                                                                              // 1543
  });                                                                                                                // 1544
};                                                                                                                   // 1545
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"url_server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/accounts-base/url_server.js                                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var AccountsServer = void 0;                                                                                         // 1
module.watch(require("./accounts_server.js"), {                                                                      // 1
  AccountsServer: function (v) {                                                                                     // 1
    AccountsServer = v;                                                                                              // 1
  }                                                                                                                  // 1
}, 0);                                                                                                               // 1
// XXX These should probably not actually be public?                                                                 // 3
AccountsServer.prototype.urls = {                                                                                    // 5
  resetPassword: function (token) {                                                                                  // 6
    return Meteor.absoluteUrl('#/reset-password/' + token);                                                          // 7
  },                                                                                                                 // 8
  verifyEmail: function (token) {                                                                                    // 10
    return Meteor.absoluteUrl('#/verify-email/' + token);                                                            // 11
  },                                                                                                                 // 12
  enrollAccount: function (token) {                                                                                  // 14
    return Meteor.absoluteUrl('#/enroll-account/' + token);                                                          // 15
  }                                                                                                                  // 16
};                                                                                                                   // 5
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/accounts-base/server_main.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['accounts-base'] = exports, {
  Accounts: Accounts
});

})();

//# sourceMappingURL=accounts-base.js.map

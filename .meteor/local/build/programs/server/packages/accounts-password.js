(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var NpmModuleBcrypt = Package['npm-bcrypt'].NpmModuleBcrypt;
var Accounts = Package['accounts-base'].Accounts;
var SRP = Package.srp.SRP;
var SHA256 = Package.sha.SHA256;
var EJSON = Package.ejson.EJSON;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Email = Package.email.Email;
var EmailInternals = Package.email.EmailInternals;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-password":{"email_templates.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-password/email_templates.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
function greet(welcomeMsg) {
  return function (user, url) {
    var greeting = user.profile && user.profile.name ? "Hello " + user.profile.name + "," : "Hello,";
    return `${greeting}

${welcomeMsg}, simply click the link below.

${url}

Thanks.
`;
  };
}
/**
 * @summary Options to customize emails sent from the Accounts system.
 * @locus Server
 * @importFromPackage accounts-base
 */


Accounts.emailTemplates = {
  from: "Accounts Example <no-reply@example.com>",
  siteName: Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  resetPassword: {
    subject: function (user) {
      return "How to reset your password on " + Accounts.emailTemplates.siteName;
    },
    text: greet("To reset your password")
  },
  verifyEmail: {
    subject: function (user) {
      return "How to verify email address on " + Accounts.emailTemplates.siteName;
    },
    text: greet("To verify your account email")
  },
  enrollAccount: {
    subject: function (user) {
      return "An account has been created for you on " + Accounts.emailTemplates.siteName;
    },
    text: greet("To start using the service")
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"password_server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-password/password_server.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/// BCRYPT
var bcrypt = NpmModuleBcrypt;
var bcryptHash = Meteor.wrapAsync(bcrypt.hash);
var bcryptCompare = Meteor.wrapAsync(bcrypt.compare); // User records have a 'services.password.bcrypt' field on them to hold
// their hashed passwords (unless they have a 'services.password.srp'
// field, in which case they will be upgraded to bcrypt the next time
// they log in).
//
// When the client sends a password to the server, it can either be a
// string (the plaintext password) or an object with keys 'digest' and
// 'algorithm' (must be "sha-256" for now). The Meteor client always sends
// password objects { digest: *, algorithm: "sha-256" }, but DDP clients
// that don't have access to SHA can just send plaintext passwords as
// strings.
//
// When the server receives a plaintext password as a string, it always
// hashes it with SHA256 before passing it into bcrypt. When the server
// receives a password as an object, it asserts that the algorithm is
// "sha-256" and then passes the digest to bcrypt.

Accounts._bcryptRounds = () => Accounts._options.bcryptRounds || 10; // Given a 'password' from the client, extract the string that we should
// bcrypt. 'password' can be one of:
//  - String (the plaintext password)
//  - Object with 'digest' and 'algorithm' keys. 'algorithm' must be "sha-256".
//


var getPasswordString = function (password) {
  if (typeof password === "string") {
    password = SHA256(password);
  } else {
    // 'password' is an object
    if (password.algorithm !== "sha-256") {
      throw new Error("Invalid password hash algorithm. " + "Only 'sha-256' is allowed.");
    }

    password = password.digest;
  }

  return password;
}; // Use bcrypt to hash the password for storage in the database.
// `password` can be a string (in which case it will be run through
// SHA256 before bcrypt) or an object with properties `digest` and
// `algorithm` (in which case we bcrypt `password.digest`).
//


var hashPassword = function (password) {
  password = getPasswordString(password);
  return bcryptHash(password, Accounts._bcryptRounds());
}; // Extract the number of rounds used in the specified bcrypt hash.


const getRoundsFromBcryptHash = hash => {
  let rounds;

  if (hash) {
    const hashSegments = hash.split('$');

    if (hashSegments.length > 2) {
      rounds = parseInt(hashSegments[2], 10);
    }
  }

  return rounds;
}; // Check whether the provided password matches the bcrypt'ed password in
// the database user record. `password` can be a string (in which case
// it will be run through SHA256 before bcrypt) or an object with
// properties `digest` and `algorithm` (in which case we bcrypt
// `password.digest`).
//


Accounts._checkPassword = function (user, password) {
  var result = {
    userId: user._id
  };
  const formattedPassword = getPasswordString(password);
  const hash = user.services.password.bcrypt;
  const hashRounds = getRoundsFromBcryptHash(hash);

  if (!bcryptCompare(formattedPassword, hash)) {
    result.error = handleError("Incorrect password", false);
  } else if (hash && Accounts._bcryptRounds() != hashRounds) {
    // The password checks out, but the user's bcrypt hash needs to be updated.
    Meteor.defer(() => {
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          'services.password.bcrypt': bcryptHash(formattedPassword, Accounts._bcryptRounds())
        }
      });
    });
  }

  return result;
};

var checkPassword = Accounts._checkPassword; ///
/// ERROR HANDLER
///

const handleError = (msg, throwError = true) => {
  const error = new Meteor.Error(403, Accounts._options.ambiguousErrorMessages ? "Something went wrong. Please check your credentials." : msg);

  if (throwError) {
    throw error;
  }

  return error;
}; ///
/// LOGIN
///


Accounts._findUserByQuery = function (query) {
  var user = null;

  if (query.id) {
    user = Meteor.users.findOne({
      _id: query.id
    });
  } else {
    var fieldName;
    var fieldValue;

    if (query.username) {
      fieldName = 'username';
      fieldValue = query.username;
    } else if (query.email) {
      fieldName = 'emails.address';
      fieldValue = query.email;
    } else {
      throw new Error("shouldn't happen (validation missed something)");
    }

    var selector = {};
    selector[fieldName] = fieldValue;
    user = Meteor.users.findOne(selector); // If user is not found, try a case insensitive lookup

    if (!user) {
      selector = selectorForFastCaseInsensitiveLookup(fieldName, fieldValue);
      var candidateUsers = Meteor.users.find(selector).fetch(); // No match if multiple candidates are found

      if (candidateUsers.length === 1) {
        user = candidateUsers[0];
      }
    }
  }

  return user;
};
/**
 * @summary Finds the user with the specified username.
 * First tries to match username case sensitively; if that fails, it
 * tries case insensitively; but if more than one user matches the case
 * insensitive search, it returns null.
 * @locus Server
 * @param {String} username The username to look for
 * @returns {Object} A user if found, else null
 * @importFromPackage accounts-base
 */


Accounts.findUserByUsername = function (username) {
  return Accounts._findUserByQuery({
    username: username
  });
};
/**
 * @summary Finds the user with the specified email.
 * First tries to match email case sensitively; if that fails, it
 * tries case insensitively; but if more than one user matches the case
 * insensitive search, it returns null.
 * @locus Server
 * @param {String} email The email address to look for
 * @returns {Object} A user if found, else null
 * @importFromPackage accounts-base
 */


Accounts.findUserByEmail = function (email) {
  return Accounts._findUserByQuery({
    email: email
  });
}; // Generates a MongoDB selector that can be used to perform a fast case
// insensitive lookup for the given fieldName and string. Since MongoDB does
// not support case insensitive indexes, and case insensitive regex queries
// are slow, we construct a set of prefix selectors for all permutations of
// the first 4 characters ourselves. We first attempt to matching against
// these, and because 'prefix expression' regex queries do use indexes (see
// http://docs.mongodb.org/v2.6/reference/operator/query/regex/#index-use),
// this has been found to greatly improve performance (from 1200ms to 5ms in a
// test with 1.000.000 users).


var selectorForFastCaseInsensitiveLookup = function (fieldName, string) {
  // Performance seems to improve up to 4 prefix characters
  var prefix = string.substring(0, Math.min(string.length, 4));

  var orClause = _.map(generateCasePermutationsForString(prefix), function (prefixPermutation) {
    var selector = {};
    selector[fieldName] = new RegExp('^' + Meteor._escapeRegExp(prefixPermutation));
    return selector;
  });

  var caseInsensitiveClause = {};
  caseInsensitiveClause[fieldName] = new RegExp('^' + Meteor._escapeRegExp(string) + '$', 'i');
  return {
    $and: [{
      $or: orClause
    }, caseInsensitiveClause]
  };
}; // Generates permutations of all case variations of a given string.


var generateCasePermutationsForString = function (string) {
  var permutations = [''];

  for (var i = 0; i < string.length; i++) {
    var ch = string.charAt(i);
    permutations = _.flatten(_.map(permutations, function (prefix) {
      var lowerCaseChar = ch.toLowerCase();
      var upperCaseChar = ch.toUpperCase(); // Don't add unneccesary permutations when ch is not a letter

      if (lowerCaseChar === upperCaseChar) {
        return [prefix + ch];
      } else {
        return [prefix + lowerCaseChar, prefix + upperCaseChar];
      }
    }));
  }

  return permutations;
};

var checkForCaseInsensitiveDuplicates = function (fieldName, displayName, fieldValue, ownUserId) {
  // Some tests need the ability to add users with the same case insensitive
  // value, hence the _skipCaseInsensitiveChecksForTest check
  var skipCheck = _.has(Accounts._skipCaseInsensitiveChecksForTest, fieldValue);

  if (fieldValue && !skipCheck) {
    var matchedUsers = Meteor.users.find(selectorForFastCaseInsensitiveLookup(fieldName, fieldValue)).fetch();

    if (matchedUsers.length > 0 && ( // If we don't have a userId yet, any match we find is a duplicate
    !ownUserId || // Otherwise, check to see if there are multiple matches or a match
    // that is not us
    matchedUsers.length > 1 || matchedUsers[0]._id !== ownUserId)) {
      handleError(displayName + " already exists.");
    }
  }
}; // XXX maybe this belongs in the check package


var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length > 0;
});
var userQueryValidator = Match.Where(function (user) {
  check(user, {
    id: Match.Optional(NonEmptyString),
    username: Match.Optional(NonEmptyString),
    email: Match.Optional(NonEmptyString)
  });
  if (_.keys(user).length !== 1) throw new Match.Error("User property must have exactly one field");
  return true;
});
var passwordValidator = Match.OneOf(String, {
  digest: String,
  algorithm: String
}); // Handler to login with a password.
//
// The Meteor client sets options.password to an object with keys
// 'digest' (set to SHA256(password)) and 'algorithm' ("sha-256").
//
// For other DDP clients which don't have access to SHA, the handler
// also accepts the plaintext password in options.password as a string.
//
// (It might be nice if servers could turn the plaintext password
// option off. Or maybe it should be opt-in, not opt-out?
// Accounts.config option?)
//
// Note that neither password option is secure without SSL.
//

Accounts.registerLoginHandler("password", function (options) {
  if (!options.password || options.srp) return undefined; // don't handle

  check(options, {
    user: userQueryValidator,
    password: passwordValidator
  });

  var user = Accounts._findUserByQuery(options.user);

  if (!user) {
    handleError("User not found");
  }

  if (!user.services || !user.services.password || !(user.services.password.bcrypt || user.services.password.srp)) {
    handleError("User has no password set");
  }

  if (!user.services.password.bcrypt) {
    if (typeof options.password === "string") {
      // The client has presented a plaintext password, and the user is
      // not upgraded to bcrypt yet. We don't attempt to tell the client
      // to upgrade to bcrypt, because it might be a standalone DDP
      // client doesn't know how to do such a thing.
      var verifier = user.services.password.srp;
      var newVerifier = SRP.generateVerifier(options.password, {
        identity: verifier.identity,
        salt: verifier.salt
      });

      if (verifier.verifier !== newVerifier.verifier) {
        return {
          userId: Accounts._options.ambiguousErrorMessages ? null : user._id,
          error: handleError("Incorrect password", false)
        };
      }

      return {
        userId: user._id
      };
    } else {
      // Tell the client to use the SRP upgrade process.
      throw new Meteor.Error(400, "old password format", EJSON.stringify({
        format: 'srp',
        identity: user.services.password.srp.identity
      }));
    }
  }

  return checkPassword(user, options.password);
}); // Handler to login using the SRP upgrade path. To use this login
// handler, the client must provide:
//   - srp: H(identity + ":" + password)
//   - password: a string or an object with properties 'digest' and 'algorithm'
//
// We use `options.srp` to verify that the client knows the correct
// password without doing a full SRP flow. Once we've checked that, we
// upgrade the user to bcrypt and remove the SRP information from the
// user document.
//
// The client ends up using this login handler after trying the normal
// login handler (above), which throws an error telling the client to
// try the SRP upgrade path.
//
// XXX COMPAT WITH 0.8.1.3

Accounts.registerLoginHandler("password", function (options) {
  if (!options.srp || !options.password) {
    return undefined; // don't handle
  }

  check(options, {
    user: userQueryValidator,
    srp: String,
    password: passwordValidator
  });

  var user = Accounts._findUserByQuery(options.user);

  if (!user) {
    handleError("User not found");
  } // Check to see if another simultaneous login has already upgraded
  // the user record to bcrypt.


  if (user.services && user.services.password && user.services.password.bcrypt) {
    return checkPassword(user, options.password);
  }

  if (!(user.services && user.services.password && user.services.password.srp)) {
    handleError("User has no password set");
  }

  var v1 = user.services.password.srp.verifier;
  var v2 = SRP.generateVerifier(null, {
    hashedIdentityAndPassword: options.srp,
    salt: user.services.password.srp.salt
  }).verifier;

  if (v1 !== v2) {
    return {
      userId: Accounts._options.ambiguousErrorMessages ? null : user._id,
      error: handleError("Incorrect password", false)
    };
  } // Upgrade to bcrypt on successful login.


  var salted = hashPassword(options.password);
  Meteor.users.update(user._id, {
    $unset: {
      'services.password.srp': 1
    },
    $set: {
      'services.password.bcrypt': salted
    }
  });
  return {
    userId: user._id
  };
}); ///
/// CHANGING
///

/**
 * @summary Change a user's username. Use this instead of updating the
 * database directly. The operation will fail if there is an existing user
 * with a username only differing in case.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newUsername A new username for the user.
 * @importFromPackage accounts-base
 */

Accounts.setUsername = function (userId, newUsername) {
  check(userId, NonEmptyString);
  check(newUsername, NonEmptyString);
  var user = Meteor.users.findOne(userId);

  if (!user) {
    handleError("User not found");
  }

  var oldUsername = user.username; // Perform a case insensitive check for duplicates before update

  checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      username: newUsername
    }
  }); // Perform another check after update, in case a matching user has been
  // inserted in the meantime

  try {
    checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
  } catch (ex) {
    // Undo update if the check fails
    Meteor.users.update({
      _id: user._id
    }, {
      $set: {
        username: oldUsername
      }
    });
    throw ex;
  }
}; // Let the user change their own password if they know the old
// password. `oldPassword` and `newPassword` should be objects with keys
// `digest` and `algorithm` (representing the SHA256 of the password).
//
// XXX COMPAT WITH 0.8.1.3
// Like the login method, if the user hasn't been upgraded from SRP to
// bcrypt yet, then this method will throw an 'old password format'
// error. The client should call the SRP upgrade login handler and then
// retry this method again.
//
// UNLIKE the login method, there is no way to avoid getting SRP upgrade
// errors thrown. The reasoning for this is that clients using this
// method directly will need to be updated anyway because we no longer
// support the SRP flow that they would have been doing to use this
// method previously.


Meteor.methods({
  changePassword: function (oldPassword, newPassword) {
    check(oldPassword, passwordValidator);
    check(newPassword, passwordValidator);

    if (!this.userId) {
      throw new Meteor.Error(401, "Must be logged in");
    }

    var user = Meteor.users.findOne(this.userId);

    if (!user) {
      handleError("User not found");
    }

    if (!user.services || !user.services.password || !user.services.password.bcrypt && !user.services.password.srp) {
      handleError("User has no password set");
    }

    if (!user.services.password.bcrypt) {
      throw new Meteor.Error(400, "old password format", EJSON.stringify({
        format: 'srp',
        identity: user.services.password.srp.identity
      }));
    }

    var result = checkPassword(user, oldPassword);

    if (result.error) {
      throw result.error;
    }

    var hashed = hashPassword(newPassword); // It would be better if this removed ALL existing tokens and replaced
    // the token for the current connection with a new one, but that would
    // be tricky, so we'll settle for just replacing all tokens other than
    // the one for the current connection.

    var currentToken = Accounts._getLoginToken(this.connection.id);

    Meteor.users.update({
      _id: this.userId
    }, {
      $set: {
        'services.password.bcrypt': hashed
      },
      $pull: {
        'services.resume.loginTokens': {
          hashedToken: {
            $ne: currentToken
          }
        }
      },
      $unset: {
        'services.password.reset': 1
      }
    });
    return {
      passwordChanged: true
    };
  }
}); // Force change the users password.

/**
 * @summary Forcibly change the password for a user.
 * @locus Server
 * @param {String} userId The id of the user to update.
 * @param {String} newPassword A new password for the user.
 * @param {Object} [options]
 * @param {Object} options.logout Logout all current connections with this userId (default: true)
 * @importFromPackage accounts-base
 */

Accounts.setPassword = function (userId, newPlaintextPassword, options) {
  options = _.extend({
    logout: true
  }, options);
  var user = Meteor.users.findOne(userId);

  if (!user) {
    throw new Meteor.Error(403, "User not found");
  }

  var update = {
    $unset: {
      'services.password.srp': 1,
      // XXX COMPAT WITH 0.8.1.3
      'services.password.reset': 1
    },
    $set: {
      'services.password.bcrypt': hashPassword(newPlaintextPassword)
    }
  };

  if (options.logout) {
    update.$unset['services.resume.loginTokens'] = 1;
  }

  Meteor.users.update({
    _id: user._id
  }, update);
}; ///
/// RESETTING VIA EMAIL
///
// Method called by a user to request a password reset email. This is
// the start of the reset process.


Meteor.methods({
  forgotPassword: function (options) {
    check(options, {
      email: String
    });
    var user = Accounts.findUserByEmail(options.email);

    if (!user) {
      handleError("User not found");
    }

    const emails = _.pluck(user.emails || [], 'address');

    const caseSensitiveEmail = _.find(emails, email => {
      return email.toLowerCase() === options.email.toLowerCase();
    });

    Accounts.sendResetPasswordEmail(user._id, caseSensitiveEmail);
  }
});
/**
 * @summary Generates a reset token and saves it into the database.
 * @locus Server
 * @param {String} userId The id of the user to generate the reset token for.
 * @param {String} email Which address of the user to generate the reset token for. This address must be in the user's `emails` list. If `null`, defaults to the first email in the list.
 * @param {String} reason `resetPassword` or `enrollAccount`.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token} values.
 * @importFromPackage accounts-base
 */

Accounts.generateResetToken = function (userId, email, reason, extraTokenData) {
  // Make sure the user exists, and email is one of their addresses.
  var user = Meteor.users.findOne(userId);

  if (!user) {
    handleError("Can't find user");
  } // pick the first email if we weren't passed an email.


  if (!email && user.emails && user.emails[0]) {
    email = user.emails[0].address;
  } // make sure we have a valid email


  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email)) {
    handleError("No such email for user.");
  }

  var token = Random.secret();
  var tokenRecord = {
    token: token,
    email: email,
    when: new Date()
  };

  if (reason === 'resetPassword') {
    tokenRecord.reason = 'reset';
  } else if (reason === 'enrollAccount') {
    tokenRecord.reason = 'enroll';
  } else if (reason) {
    // fallback so that this function can be used for unknown reasons as well
    tokenRecord.reason = reason;
  }

  if (extraTokenData) {
    _.extend(tokenRecord, extraTokenData);
  }

  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      'services.password.reset': tokenRecord
    }
  }); // before passing to template, update user object with new token

  Meteor._ensure(user, 'services', 'password').reset = tokenRecord;
  return {
    email,
    user,
    token
  };
};
/**
 * @summary Generates an e-mail verification token and saves it into the database.
 * @locus Server
 * @param {String} userId The id of the user to generate the  e-mail verification token for.
 * @param {String} email Which address of the user to generate the e-mail verification token for. This address must be in the user's `emails` list. If `null`, defaults to the first unverified email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token} values.
 * @importFromPackage accounts-base
 */


Accounts.generateVerificationToken = function (userId, email, extraTokenData) {
  // Make sure the user exists, and email is one of their addresses.
  var user = Meteor.users.findOne(userId);

  if (!user) {
    handleError("Can't find user");
  } // pick the first unverified email if we weren't passed an email.


  if (!email) {
    var emailRecord = _.find(user.emails || [], function (e) {
      return !e.verified;
    });

    email = (emailRecord || {}).address;

    if (!email) {
      handleError("That user has no unverified email addresses.");
    }
  } // make sure we have a valid email


  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email)) {
    handleError("No such email for user.");
  }

  var token = Random.secret();
  var tokenRecord = {
    token: token,
    // TODO: This should probably be renamed to "email" to match reset token record.
    address: email,
    when: new Date()
  };

  if (extraTokenData) {
    _.extend(tokenRecord, extraTokenData);
  }

  Meteor.users.update({
    _id: user._id
  }, {
    $push: {
      'services.email.verificationTokens': tokenRecord
    }
  }); // before passing to template, update user object with new token

  Meteor._ensure(user, 'services', 'email');

  if (!user.services.email.verificationTokens) {
    user.services.email.verificationTokens = [];
  }

  user.services.email.verificationTokens.push(tokenRecord);
  return {
    email,
    user,
    token
  };
};
/**
 * @summary Creates options for email sending for reset password and enroll account emails.
 * You can use this function when customizing a reset password or enroll account email sending.
 * @locus Server
 * @param {Object} email Which address of the user's to send the email to.
 * @param {Object} user The user object to generate options for.
 * @param {String} url URL to which user is directed to confirm the email.
 * @param {String} reason `resetPassword` or `enrollAccount`.
 * @returns {Object} Options which can be passed to `Email.send`.
 * @importFromPackage accounts-base
 */


Accounts.generateOptionsForEmail = function (email, user, url, reason) {
  var options = {
    to: email,
    from: Accounts.emailTemplates[reason].from ? Accounts.emailTemplates[reason].from(user) : Accounts.emailTemplates.from,
    subject: Accounts.emailTemplates[reason].subject(user)
  };

  if (typeof Accounts.emailTemplates[reason].text === 'function') {
    options.text = Accounts.emailTemplates[reason].text(user, url);
  }

  if (typeof Accounts.emailTemplates[reason].html === 'function') {
    options.html = Accounts.emailTemplates[reason].html(user, url);
  }

  if (typeof Accounts.emailTemplates.headers === 'object') {
    options.headers = Accounts.emailTemplates.headers;
  }

  return options;
}; // send the user an email with a link that when opened allows the user
// to set a new password, without the old password.

/**
 * @summary Send an email with a link the user can use to reset their password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */


Accounts.sendResetPasswordEmail = function (userId, email, extraTokenData) {
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateResetToken(userId, email, 'resetPassword', extraTokenData);
  const url = Accounts.urls.resetPassword(token);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'resetPassword');
  Email.send(options);
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
}; // send the user an email informing them that their account was created, with
// a link that when opened both marks their email as verified and forces them
// to choose their password. The email must be one of the addresses in the
// user's emails field, or undefined to pick the first email automatically.
//
// This is not called automatically. It must be called manually if you
// want to use enrollment emails.

/**
 * @summary Send an email with a link the user can use to set their initial password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */


Accounts.sendEnrollmentEmail = function (userId, email, extraTokenData) {
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateResetToken(userId, email, 'enrollAccount', extraTokenData);
  const url = Accounts.urls.enrollAccount(token);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'enrollAccount');
  Email.send(options);
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
}; // Take token from sendResetPasswordEmail or sendEnrollmentEmail, change
// the users password, and log them in.


Meteor.methods({
  resetPassword: function (token, newPassword) {
    var self = this;
    return Accounts._loginMethod(self, "resetPassword", arguments, "password", function () {
      check(token, String);
      check(newPassword, passwordValidator);
      var user = Meteor.users.findOne({
        "services.password.reset.token": token
      });

      if (!user) {
        throw new Meteor.Error(403, "Token expired");
      }

      var when = user.services.password.reset.when;
      var reason = user.services.password.reset.reason;

      var tokenLifetimeMs = Accounts._getPasswordResetTokenLifetimeMs();

      if (reason === "enroll") {
        tokenLifetimeMs = Accounts._getPasswordEnrollTokenLifetimeMs();
      }

      var currentTimeMs = Date.now();
      if (currentTimeMs - when > tokenLifetimeMs) throw new Meteor.Error(403, "Token expired");
      var email = user.services.password.reset.email;
      if (!_.include(_.pluck(user.emails || [], 'address'), email)) return {
        userId: user._id,
        error: new Meteor.Error(403, "Token has invalid email address")
      };
      var hashed = hashPassword(newPassword); // NOTE: We're about to invalidate tokens on the user, who we might be
      // logged in as. Make sure to avoid logging ourselves out if this
      // happens. But also make sure not to leave the connection in a state
      // of having a bad token set if things fail.

      var oldToken = Accounts._getLoginToken(self.connection.id);

      Accounts._setLoginToken(user._id, self.connection, null);

      var resetToOldToken = function () {
        Accounts._setLoginToken(user._id, self.connection, oldToken);
      };

      try {
        // Update the user record by:
        // - Changing the password to the new one
        // - Forgetting about the reset token that was just used
        // - Verifying their email, since they got the password reset via email.
        var affectedRecords = Meteor.users.update({
          _id: user._id,
          'emails.address': email,
          'services.password.reset.token': token
        }, {
          $set: {
            'services.password.bcrypt': hashed,
            'emails.$.verified': true
          },
          $unset: {
            'services.password.reset': 1,
            'services.password.srp': 1
          }
        });
        if (affectedRecords !== 1) return {
          userId: user._id,
          error: new Meteor.Error(403, "Invalid email")
        };
      } catch (err) {
        resetToOldToken();
        throw err;
      } // Replace all valid login tokens with new ones (changing
      // password should invalidate existing sessions).


      Accounts._clearAllLoginTokens(user._id);

      return {
        userId: user._id
      };
    });
  }
}); ///
/// EMAIL VERIFICATION
///
// send the user an email with a link that when opened marks that
// address as verified

/**
 * @summary Send an email with a link the user can use verify their email address.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first unverified email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */

Accounts.sendVerificationEmail = function (userId, email, extraTokenData) {
  // XXX Also generate a link using which someone can delete this
  // account if they own said address but weren't those who created
  // this account.
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateVerificationToken(userId, email, extraTokenData);
  const url = Accounts.urls.verifyEmail(token);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'verifyEmail');
  Email.send(options);
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
}; // Take token from sendVerificationEmail, mark the email as verified,
// and log them in.


Meteor.methods({
  verifyEmail: function (token) {
    var self = this;
    return Accounts._loginMethod(self, "verifyEmail", arguments, "password", function () {
      check(token, String);
      var user = Meteor.users.findOne({
        'services.email.verificationTokens.token': token
      });
      if (!user) throw new Meteor.Error(403, "Verify email link expired");

      var tokenRecord = _.find(user.services.email.verificationTokens, function (t) {
        return t.token == token;
      });

      if (!tokenRecord) return {
        userId: user._id,
        error: new Meteor.Error(403, "Verify email link expired")
      };

      var emailsRecord = _.find(user.emails, function (e) {
        return e.address == tokenRecord.address;
      });

      if (!emailsRecord) return {
        userId: user._id,
        error: new Meteor.Error(403, "Verify email link is for unknown address")
      }; // By including the address in the query, we can use 'emails.$' in the
      // modifier to get a reference to the specific object in the emails
      // array. See
      // http://www.mongodb.org/display/DOCS/Updating/#Updating-The%24positionaloperator)
      // http://www.mongodb.org/display/DOCS/Updating#Updating-%24pull

      Meteor.users.update({
        _id: user._id,
        'emails.address': tokenRecord.address
      }, {
        $set: {
          'emails.$.verified': true
        },
        $pull: {
          'services.email.verificationTokens': {
            address: tokenRecord.address
          }
        }
      });
      return {
        userId: user._id
      };
    });
  }
});
/**
 * @summary Add an email address for a user. Use this instead of directly
 * updating the database. The operation will fail if there is a different user
 * with an email only differing in case. If the specified user has an existing
 * email only differing in case however, we replace it.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newEmail A new email address for the user.
 * @param {Boolean} [verified] Optional - whether the new email address should
 * be marked as verified. Defaults to false.
 * @importFromPackage accounts-base
 */

Accounts.addEmail = function (userId, newEmail, verified) {
  check(userId, NonEmptyString);
  check(newEmail, NonEmptyString);
  check(verified, Match.Optional(Boolean));

  if (_.isUndefined(verified)) {
    verified = false;
  }

  var user = Meteor.users.findOne(userId);
  if (!user) throw new Meteor.Error(403, "User not found"); // Allow users to change their own email to a version with a different case
  // We don't have to call checkForCaseInsensitiveDuplicates to do a case
  // insensitive check across all emails in the database here because: (1) if
  // there is no case-insensitive duplicate between this user and other users,
  // then we are OK and (2) if this would create a conflict with other users
  // then there would already be a case-insensitive duplicate and we can't fix
  // that in this code anyway.

  var caseInsensitiveRegExp = new RegExp('^' + Meteor._escapeRegExp(newEmail) + '$', 'i');

  var didUpdateOwnEmail = _.any(user.emails, function (email, index) {
    if (caseInsensitiveRegExp.test(email.address)) {
      Meteor.users.update({
        _id: user._id,
        'emails.address': email.address
      }, {
        $set: {
          'emails.$.address': newEmail,
          'emails.$.verified': verified
        }
      });
      return true;
    }

    return false;
  }); // In the other updates below, we have to do another call to
  // checkForCaseInsensitiveDuplicates to make sure that no conflicting values
  // were added to the database in the meantime. We don't have to do this for
  // the case where the user is updating their email address to one that is the
  // same as before, but only different because of capitalization. Read the
  // big comment above to understand why.


  if (didUpdateOwnEmail) {
    return;
  } // Perform a case insensitive check for duplicates before update


  checkForCaseInsensitiveDuplicates('emails.address', 'Email', newEmail, user._id);
  Meteor.users.update({
    _id: user._id
  }, {
    $addToSet: {
      emails: {
        address: newEmail,
        verified: verified
      }
    }
  }); // Perform another check after update, in case a matching user has been
  // inserted in the meantime

  try {
    checkForCaseInsensitiveDuplicates('emails.address', 'Email', newEmail, user._id);
  } catch (ex) {
    // Undo update if the check fails
    Meteor.users.update({
      _id: user._id
    }, {
      $pull: {
        emails: {
          address: newEmail
        }
      }
    });
    throw ex;
  }
};
/**
 * @summary Remove an email address for a user. Use this instead of updating
 * the database directly.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} email The email address to remove.
 * @importFromPackage accounts-base
 */


Accounts.removeEmail = function (userId, email) {
  check(userId, NonEmptyString);
  check(email, NonEmptyString);
  var user = Meteor.users.findOne(userId);
  if (!user) throw new Meteor.Error(403, "User not found");
  Meteor.users.update({
    _id: user._id
  }, {
    $pull: {
      emails: {
        address: email
      }
    }
  });
}; ///
/// CREATING USERS
///
// Shared createUser function called from the createUser method, both
// if originates in client or server code. Calls user provided hooks,
// does the actual user insertion.
//
// returns the user id


var createUser = function (options) {
  // Unknown keys allowed, because a onCreateUserHook can take arbitrary
  // options.
  check(options, Match.ObjectIncluding({
    username: Match.Optional(String),
    email: Match.Optional(String),
    password: Match.Optional(passwordValidator)
  }));
  var username = options.username;
  var email = options.email;
  if (!username && !email) throw new Meteor.Error(400, "Need to set a username or email");
  var user = {
    services: {}
  };

  if (options.password) {
    var hashed = hashPassword(options.password);
    user.services.password = {
      bcrypt: hashed
    };
  }

  if (username) user.username = username;
  if (email) user.emails = [{
    address: email,
    verified: false
  }]; // Perform a case insensitive check before insert

  checkForCaseInsensitiveDuplicates('username', 'Username', username);
  checkForCaseInsensitiveDuplicates('emails.address', 'Email', email);
  var userId = Accounts.insertUserDoc(options, user); // Perform another check after insert, in case a matching user has been
  // inserted in the meantime

  try {
    checkForCaseInsensitiveDuplicates('username', 'Username', username, userId);
    checkForCaseInsensitiveDuplicates('emails.address', 'Email', email, userId);
  } catch (ex) {
    // Remove inserted user if the check fails
    Meteor.users.remove(userId);
    throw ex;
  }

  return userId;
}; // method for create user. Requests come from the client.


Meteor.methods({
  createUser: function (options) {
    var self = this;
    return Accounts._loginMethod(self, "createUser", arguments, "password", function () {
      // createUser() above does more checking.
      check(options, Object);
      if (Accounts._options.forbidClientAccountCreation) return {
        error: new Meteor.Error(403, "Signups forbidden")
      }; // Create user. result contains id and token.

      var userId = createUser(options); // safety belt. createUser is supposed to throw on error. send 500 error
      // instead of sending a verification email with empty userid.

      if (!userId) throw new Error("createUser failed to insert new user"); // If `Accounts._options.sendVerificationEmail` is set, register
      // a token to verify the user's primary email, and send it to
      // that address.

      if (options.email && Accounts._options.sendVerificationEmail) Accounts.sendVerificationEmail(userId, options.email); // client gets logged in as the new user afterwards.

      return {
        userId: userId
      };
    });
  }
}); // Create user directly on the server.
//
// Unlike the client version, this does not log you in as this user
// after creation.
//
// returns userId or throws an error if it can't create
//
// XXX add another argument ("server options") that gets sent to onCreateUser,
// which is always empty when called from the createUser method? eg, "admin:
// true", which we want to prevent the client from setting, but which a custom
// method calling Accounts.createUser could set?
//

Accounts.createUser = function (options, callback) {
  options = _.clone(options); // XXX allow an optional callback?

  if (callback) {
    throw new Error("Accounts.createUser with callback not supported on the server yet.");
  }

  return createUser(options);
}; ///
/// PASSWORD-SPECIFIC INDEXES ON USERS
///


Meteor.users._ensureIndex('services.email.verificationTokens.token', {
  unique: 1,
  sparse: 1
});

Meteor.users._ensureIndex('services.password.reset.token', {
  unique: 1,
  sparse: 1
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-password/email_templates.js");
require("/node_modules/meteor/accounts-password/password_server.js");

/* Exports */
Package._define("accounts-password");

})();

//# sourceURL=meteor://💻app/packages/accounts-password.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtcGFzc3dvcmQvZW1haWxfdGVtcGxhdGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hY2NvdW50cy1wYXNzd29yZC9wYXNzd29yZF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiZ3JlZXQiLCJ3ZWxjb21lTXNnIiwidXNlciIsInVybCIsImdyZWV0aW5nIiwicHJvZmlsZSIsIm5hbWUiLCJBY2NvdW50cyIsImVtYWlsVGVtcGxhdGVzIiwiZnJvbSIsInNpdGVOYW1lIiwiTWV0ZW9yIiwiYWJzb2x1dGVVcmwiLCJyZXBsYWNlIiwicmVzZXRQYXNzd29yZCIsInN1YmplY3QiLCJ0ZXh0IiwidmVyaWZ5RW1haWwiLCJlbnJvbGxBY2NvdW50IiwiYmNyeXB0IiwiTnBtTW9kdWxlQmNyeXB0IiwiYmNyeXB0SGFzaCIsIndyYXBBc3luYyIsImhhc2giLCJiY3J5cHRDb21wYXJlIiwiY29tcGFyZSIsIl9iY3J5cHRSb3VuZHMiLCJfb3B0aW9ucyIsImJjcnlwdFJvdW5kcyIsImdldFBhc3N3b3JkU3RyaW5nIiwicGFzc3dvcmQiLCJTSEEyNTYiLCJhbGdvcml0aG0iLCJFcnJvciIsImRpZ2VzdCIsImhhc2hQYXNzd29yZCIsImdldFJvdW5kc0Zyb21CY3J5cHRIYXNoIiwicm91bmRzIiwiaGFzaFNlZ21lbnRzIiwic3BsaXQiLCJsZW5ndGgiLCJwYXJzZUludCIsIl9jaGVja1Bhc3N3b3JkIiwicmVzdWx0IiwidXNlcklkIiwiX2lkIiwiZm9ybWF0dGVkUGFzc3dvcmQiLCJzZXJ2aWNlcyIsImhhc2hSb3VuZHMiLCJlcnJvciIsImhhbmRsZUVycm9yIiwiZGVmZXIiLCJ1c2VycyIsInVwZGF0ZSIsIiRzZXQiLCJjaGVja1Bhc3N3b3JkIiwibXNnIiwidGhyb3dFcnJvciIsImFtYmlndW91c0Vycm9yTWVzc2FnZXMiLCJfZmluZFVzZXJCeVF1ZXJ5IiwicXVlcnkiLCJpZCIsImZpbmRPbmUiLCJmaWVsZE5hbWUiLCJmaWVsZFZhbHVlIiwidXNlcm5hbWUiLCJlbWFpbCIsInNlbGVjdG9yIiwic2VsZWN0b3JGb3JGYXN0Q2FzZUluc2Vuc2l0aXZlTG9va3VwIiwiY2FuZGlkYXRlVXNlcnMiLCJmaW5kIiwiZmV0Y2giLCJmaW5kVXNlckJ5VXNlcm5hbWUiLCJmaW5kVXNlckJ5RW1haWwiLCJzdHJpbmciLCJwcmVmaXgiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwib3JDbGF1c2UiLCJfIiwibWFwIiwiZ2VuZXJhdGVDYXNlUGVybXV0YXRpb25zRm9yU3RyaW5nIiwicHJlZml4UGVybXV0YXRpb24iLCJSZWdFeHAiLCJfZXNjYXBlUmVnRXhwIiwiY2FzZUluc2Vuc2l0aXZlQ2xhdXNlIiwiJGFuZCIsIiRvciIsInBlcm11dGF0aW9ucyIsImkiLCJjaCIsImNoYXJBdCIsImZsYXR0ZW4iLCJsb3dlckNhc2VDaGFyIiwidG9Mb3dlckNhc2UiLCJ1cHBlckNhc2VDaGFyIiwidG9VcHBlckNhc2UiLCJjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMiLCJkaXNwbGF5TmFtZSIsIm93blVzZXJJZCIsInNraXBDaGVjayIsImhhcyIsIl9za2lwQ2FzZUluc2Vuc2l0aXZlQ2hlY2tzRm9yVGVzdCIsIm1hdGNoZWRVc2VycyIsIk5vbkVtcHR5U3RyaW5nIiwiTWF0Y2giLCJXaGVyZSIsIngiLCJjaGVjayIsIlN0cmluZyIsInVzZXJRdWVyeVZhbGlkYXRvciIsIk9wdGlvbmFsIiwia2V5cyIsInBhc3N3b3JkVmFsaWRhdG9yIiwiT25lT2YiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJzcnAiLCJ1bmRlZmluZWQiLCJ2ZXJpZmllciIsIm5ld1ZlcmlmaWVyIiwiU1JQIiwiZ2VuZXJhdGVWZXJpZmllciIsImlkZW50aXR5Iiwic2FsdCIsIkVKU09OIiwic3RyaW5naWZ5IiwiZm9ybWF0IiwidjEiLCJ2MiIsImhhc2hlZElkZW50aXR5QW5kUGFzc3dvcmQiLCJzYWx0ZWQiLCIkdW5zZXQiLCJzZXRVc2VybmFtZSIsIm5ld1VzZXJuYW1lIiwib2xkVXNlcm5hbWUiLCJleCIsIm1ldGhvZHMiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJoYXNoZWQiLCJjdXJyZW50VG9rZW4iLCJfZ2V0TG9naW5Ub2tlbiIsImNvbm5lY3Rpb24iLCIkcHVsbCIsImhhc2hlZFRva2VuIiwiJG5lIiwicGFzc3dvcmRDaGFuZ2VkIiwic2V0UGFzc3dvcmQiLCJuZXdQbGFpbnRleHRQYXNzd29yZCIsImV4dGVuZCIsImxvZ291dCIsImZvcmdvdFBhc3N3b3JkIiwiZW1haWxzIiwicGx1Y2siLCJjYXNlU2Vuc2l0aXZlRW1haWwiLCJzZW5kUmVzZXRQYXNzd29yZEVtYWlsIiwiZ2VuZXJhdGVSZXNldFRva2VuIiwicmVhc29uIiwiZXh0cmFUb2tlbkRhdGEiLCJhZGRyZXNzIiwiY29udGFpbnMiLCJ0b2tlbiIsIlJhbmRvbSIsInNlY3JldCIsInRva2VuUmVjb3JkIiwid2hlbiIsIkRhdGUiLCJfZW5zdXJlIiwicmVzZXQiLCJnZW5lcmF0ZVZlcmlmaWNhdGlvblRva2VuIiwiZW1haWxSZWNvcmQiLCJlIiwidmVyaWZpZWQiLCIkcHVzaCIsInZlcmlmaWNhdGlvblRva2VucyIsInB1c2giLCJnZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbCIsInRvIiwiaHRtbCIsImhlYWRlcnMiLCJyZWFsRW1haWwiLCJ1cmxzIiwiRW1haWwiLCJzZW5kIiwic2VuZEVucm9sbG1lbnRFbWFpbCIsInNlbGYiLCJfbG9naW5NZXRob2QiLCJhcmd1bWVudHMiLCJ0b2tlbkxpZmV0aW1lTXMiLCJfZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcyIsIl9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcyIsImN1cnJlbnRUaW1lTXMiLCJub3ciLCJpbmNsdWRlIiwib2xkVG9rZW4iLCJfc2V0TG9naW5Ub2tlbiIsInJlc2V0VG9PbGRUb2tlbiIsImFmZmVjdGVkUmVjb3JkcyIsImVyciIsIl9jbGVhckFsbExvZ2luVG9rZW5zIiwic2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwidCIsImVtYWlsc1JlY29yZCIsImFkZEVtYWlsIiwibmV3RW1haWwiLCJCb29sZWFuIiwiaXNVbmRlZmluZWQiLCJjYXNlSW5zZW5zaXRpdmVSZWdFeHAiLCJkaWRVcGRhdGVPd25FbWFpbCIsImFueSIsImluZGV4IiwidGVzdCIsIiRhZGRUb1NldCIsInJlbW92ZUVtYWlsIiwiY3JlYXRlVXNlciIsIk9iamVjdEluY2x1ZGluZyIsImluc2VydFVzZXJEb2MiLCJyZW1vdmUiLCJPYmplY3QiLCJmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24iLCJjYWxsYmFjayIsImNsb25lIiwiX2Vuc3VyZUluZGV4IiwidW5pcXVlIiwic3BhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFNBQVNBLEtBQVQsQ0FBZUMsVUFBZixFQUEyQjtBQUN6QixTQUFPLFVBQVNDLElBQVQsRUFBZUMsR0FBZixFQUFvQjtBQUN2QixRQUFJQyxXQUFZRixLQUFLRyxPQUFMLElBQWdCSCxLQUFLRyxPQUFMLENBQWFDLElBQTlCLEdBQ1IsV0FBV0osS0FBS0csT0FBTCxDQUFhQyxJQUF4QixHQUErQixHQUR2QixHQUM4QixRQUQ3QztBQUVBLFdBQVEsR0FBRUYsUUFBUzs7RUFFdkJILFVBQVc7O0VBRVhFLEdBQUk7OztDQUpBO0FBUUgsR0FYRDtBQVlEO0FBRUQ7Ozs7Ozs7QUFLQUksU0FBU0MsY0FBVCxHQUEwQjtBQUN4QkMsUUFBTSx5Q0FEa0I7QUFFeEJDLFlBQVVDLE9BQU9DLFdBQVAsR0FBcUJDLE9BQXJCLENBQTZCLGNBQTdCLEVBQTZDLEVBQTdDLEVBQWlEQSxPQUFqRCxDQUF5RCxLQUF6RCxFQUFnRSxFQUFoRSxDQUZjO0FBSXhCQyxpQkFBZTtBQUNiQyxhQUFTLFVBQVNiLElBQVQsRUFBZTtBQUN0QixhQUFPLG1DQUFtQ0ssU0FBU0MsY0FBVCxDQUF3QkUsUUFBbEU7QUFDRCxL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Q0FUVSxDQVVWO0FBQ0E7O0FBQ0EsVUFBSSxDQUFFekUsTUFBTixFQUNFLE1BQU0sSUFBSVgsS0FBSixDQUFVLHNDQUFWLENBQU4sQ0FiUSxDQWVWO0FBQ0E7QUFDQTs7QUFDQSxVQUFJb0YsUUFBUW5ELEtBQVIsSUFBaUIzRCxTQUFTb0IsUUFBVCxDQUFrQmdMLHFCQUF2QyxFQUNFcE0sU0FBU29NLHFCQUFULENBQStCL0osTUFBL0IsRUFBdUN5RSxRQUFRbkQsS0FBL0MsRUFuQlEsQ0FxQlY7O0FBQ0EsYUFBTztBQUFDdEIsZ0JBQVFBO0FBQVQsT0FBUDtBQUNELEtBNUJJLENBQVA7QUE4QkQ7QUFoQ2MsQ0FBZixFLENBa0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQXJDLFNBQVNrTixVQUFULEdBQXNCLFVBQVVwRyxPQUFWLEVBQW1CMEcsUUFBbkIsRUFBNkI7QUFDakQxRyxZQUFVckMsRUFBRWdKLEtBQUYsQ0FBUTNHLE9BQVIsQ0FBVixDQURpRCxDQUdqRDs7QUFDQSxNQUFJMEcsUUFBSixFQUFjO0FBQ1osVUFBTSxJQUFJOUwsS0FBSixDQUFVLG9FQUFWLENBQU47QUFDRDs7QUFFRCxTQUFPd0wsV0FBV3BHLE9BQVgsQ0FBUDtBQUNELENBVEQsQyxDQVdBO0FBQ0E7QUFDQTs7O0FBQ0ExRyxPQUFPeUMsS0FBUCxDQUFhNkssWUFBYixDQUEwQix5Q0FBMUIsRUFDMEI7QUFBQ0MsVUFBUSxDQUFUO0FBQVlDLFVBQVE7QUFBcEIsQ0FEMUI7O0FBRUF4TixPQUFPeUMsS0FBUCxDQUFhNkssWUFBYixDQUEwQiwrQkFBMUIsRUFDMEI7QUFBQ0MsVUFBUSxDQUFUO0FBQVlDLFVBQVE7QUFBcEIsQ0FEMUIsRSIsImZpbGUiOiIvcGFja2FnZXMvYWNjb3VudHMtcGFzc3dvcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBncmVldCh3ZWxjb21lTXNnKSB7XG4gIHJldHVybiBmdW5jdGlvbih1c2VyLCB1cmwpIHtcbiAgICAgIHZhciBncmVldGluZyA9ICh1c2VyLnByb2ZpbGUgJiYgdXNlci5wcm9maWxlLm5hbWUpID9cbiAgICAgICAgICAgIChcIkhlbGxvIFwiICsgdXNlci5wcm9maWxlLm5hbWUgKyBcIixcIikgOiBcIkhlbGxvLFwiO1xuICAgICAgcmV0dXJuIGAke2dyZWV0aW5nfVxuXG4ke3dlbGNvbWVNc2d9LCBzaW1wbHkgY2xpY2sgdGhlIGxpbmsgYmVsb3cuXG5cbiR7dXJsfVxuXG5UaGFua3MuXG5gO1xuICB9O1xufVxuXG4vKipcbiAqIEBzdW1tYXJ5IE9wdGlvbnMgdG8gY3VzdG9taXplIGVtYWlscyBzZW50IGZyb20gdGhlIEFjY291bnRzIHN5c3RlbS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmVtYWlsVGVtcGxhdGVzID0ge1xuICBmcm9tOiBcIkFjY291bnRzIEV4YW1wbGUgPG5vLXJlcGx5QGV4YW1wbGUuY29tPlwiLFxuICBzaXRlTmFtZTogTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXmh0dHBzPzpcXC9cXC8vLCAnJykucmVwbGFjZSgvXFwvJC8sICcnKSxcblxuICByZXNldFBhc3N3b3JkOiB7XG4gICAgc3ViamVjdDogZnVuY3Rpb24odXNlcikge1xuICAgICAgcmV0dXJuIFwiSG93IHRvIHJlc2V0IHlvdXIgcGFzc3dvcmQgb24gXCIgKyBBY2NvdW50cy5lbWFpbFRlbXBsYXRlcy5zaXRlTmFtZTtcbiAgICB9LFxuICAgIHRleHQ6IGdyZWV0KFwiVG8gcmVzZXQgeW91ciBwYXNzd29yZFwiKVxuICB9LFxuICB2ZXJpZnlFbWFpbDoge1xuICAgIHN1YmplY3Q6IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHJldHVybiBcIkhvdyB0byB2ZXJpZnkgZW1haWwgYWRkcmVzcyBvbiBcIiArIEFjY291bnRzLmVtYWlsVGVtcGxhdGVzLnNpdGVOYW1lO1xuICAgIH0sXG4gICAgdGV4dDogZ3JlZXQoXCJUbyB2ZXJpZnkgeW91ciBhY2NvdW50IGVtYWlsXCIpXG4gIH0sXG4gIGVucm9sbEFjY291bnQ6IHtcbiAgICBzdWJqZWN0OiBmdW5jdGlvbih1c2VyKSB7XG4gICAgICByZXR1cm4gXCJBbiBhY2NvdW50IGhhcyBiZWVuIGNyZWF0ZWQgZm9yIHlvdSBvbiBcIiArIEFjY291bnRzLmVtYWlsVGVtcGxhdGVzLnNpdGVOYW1lO1xuICAgIH0sXG4gICAgdGV4dDogZ3JlZXQoXCJUbyBzdGFydCB1c2luZyB0aGUgc2VydmljZVwiKVxuICB9XG59O1xuIiwiLy8vIEJDUllQVFxuXG52YXIgYmNyeXB0ID0gTnBtTW9kdWxlQmNyeXB0O1xudmFyIGJjcnlwdEhhc2ggPSBNZXRlb3Iud3JhcEFzeW5jKGJjcnlwdC5oYXNoKTtcbnZhciBiY3J5cHRDb21wYXJlID0gTWV0ZW9yLndyYXBBc3luYyhiY3J5cHQuY29tcGFyZSk7XG5cbi8vIFVzZXIgcmVjb3JkcyBoYXZlIGEgJ3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCcgZmllbGQgb24gdGhlbSB0byBob2xkXG4vLyB0aGVpciBoYXNoZWQgcGFzc3dvcmRzICh1bmxlc3MgdGhleSBoYXZlIGEgJ3NlcnZpY2VzLnBhc3N3b3JkLnNycCdcbi8vIGZpZWxkLCBpbiB3aGljaCBjYXNlIHRoZXkgd2lsbCBiZSB1cGdyYWRlZCB0byBiY3J5cHQgdGhlIG5leHQgdGltZVxuLy8gdGhleSBsb2cgaW4pLlxuLy9cbi8vIFdoZW4gdGhlIGNsaWVudCBzZW5kcyBhIHBhc3N3b3JkIHRvIHRoZSBzZXJ2ZXIsIGl0IGNhbiBlaXRoZXIgYmUgYVxuLy8gc3RyaW5nICh0aGUgcGxhaW50ZXh0IHBhc3N3b3JkKSBvciBhbiBvYmplY3Qgd2l0aCBrZXlzICdkaWdlc3QnIGFuZFxuLy8gJ2FsZ29yaXRobScgKG11c3QgYmUgXCJzaGEtMjU2XCIgZm9yIG5vdykuIFRoZSBNZXRlb3IgY2xpZW50IGFsd2F5cyBzZW5kc1xuLy8gcGFzc3dvcmQgb2JqZWN0cyB7IGRpZ2VzdDogKiwgYWxnb3JpdGhtOiBcInNoYS0yNTZcIiB9LCBidXQgRERQIGNsaWVudHNcbi8vIHRoYXQgZG9uJ3QgaGF2ZSBhY2Nlc3MgdG8gU0hBIGNhbiBqdXN0IHNlbmQgcGxhaW50ZXh0IHBhc3N3b3JkcyBhc1xuLy8gc3RyaW5ncy5cbi8vXG4vLyBXaGVuIHRoZSBzZXJ2ZXIgcmVjZWl2ZXMgYSBwbGFpbnRleHQgcGFzc3dvcmQgYXMgYSBzdHJpbmcsIGl0IGFsd2F5c1xuLy8gaGFzaGVzIGl0IHdpdGggU0hBMjU2IGJlZm9yZSBwYXNzaW5nIGl0IGludG8gYmNyeXB0LiBXaGVuIHRoZSBzZXJ2ZXJcbi8vIHJlY2VpdmVzIGEgcGFzc3dvcmQgYXMgYW4gb2JqZWN0LCBpdCBhc3NlcnRzIHRoYXQgdGhlIGFsZ29yaXRobSBpc1xuLy8gXCJzaGEtMjU2XCIgYW5kIHRoZW4gcGFzc2VzIHRoZSBkaWdlc3QgdG8gYmNyeXB0LlxuXG5cbkFjY291bnRzLl9iY3J5cHRSb3VuZHMgPSAoKSA9PiBBY2NvdW50cy5fb3B0aW9ucy5iY3J5cHRSb3VuZHMgfHwgMTA7XG5cbi8vIEdpdmVuIGEgJ3Bhc3N3b3JkJyBmcm9tIHRoZSBjbGllbnQsIGV4dHJhY3QgdGhlIHN0cmluZyB0aGF0IHdlIHNob3VsZFxuLy8gYmNyeXB0LiAncGFzc3dvcmQnIGNhbiBiZSBvbmUgb2Y6XG4vLyAgLSBTdHJpbmcgKHRoZSBwbGFpbnRleHQgcGFzc3dvcmQpXG4vLyAgLSBPYmplY3Qgd2l0aCAnZGlnZXN0JyBhbmQgJ2FsZ29yaXRobScga2V5cy4gJ2FsZ29yaXRobScgbXVzdCBiZSBcInNoYS0yNTZcIi5cbi8vXG52YXIgZ2V0UGFzc3dvcmRTdHJpbmcgPSBmdW5jdGlvbiAocGFzc3dvcmQpIHtcbiAgaWYgKHR5cGVvZiBwYXNzd29yZCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHBhc3N3b3JkID0gU0hBMjU2KHBhc3N3b3JkKTtcbiAgfSBlbHNlIHsgLy8gJ3Bhc3N3b3JkJyBpcyBhbiBvYmplY3RcbiAgICBpZiAocGFzc3dvcmQuYWxnb3JpdGhtICE9PSBcInNoYS0yNTZcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBwYXNzd29yZCBoYXNoIGFsZ29yaXRobS4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIFwiT25seSAnc2hhLTI1NicgaXMgYWxsb3dlZC5cIik7XG4gICAgfVxuICAgIHBhc3N3b3JkID0gcGFzc3dvcmQuZGlnZXN0O1xuICB9XG4gIHJldHVybiBwYXNzd29yZDtcbn07XG5cbi8vIFVzZSBiY3J5cHQgdG8gaGFzaCB0aGUgcGFzc3dvcmQgZm9yIHN0b3JhZ2UgaW4gdGhlIGRhdGFiYXNlLlxuLy8gYHBhc3N3b3JkYCBjYW4gYmUgYSBzdHJpbmcgKGluIHdoaWNoIGNhc2UgaXQgd2lsbCBiZSBydW4gdGhyb3VnaFxuLy8gU0hBMjU2IGJlZm9yZSBiY3J5cHQpIG9yIGFuIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgYGRpZ2VzdGAgYW5kXG4vLyBgYWxnb3JpdGhtYCAoaW4gd2hpY2ggY2FzZSB3ZSBiY3J5cHQgYHBhc3N3b3JkLmRpZ2VzdGApLlxuLy9cbnZhciBoYXNoUGFzc3dvcmQgPSBmdW5jdGlvbiAocGFzc3dvcmQpIHtcbiAgcGFzc3dvcmQgPSBnZXRQYXNzd29yZFN0cmluZyhwYXNzd29yZCk7XG4gIHJldHVybiBiY3J5cHRIYXNoKHBhc3N3b3JkLCBBY2NvdW50cy5fYmNyeXB0Um91bmRzKCkpO1xufTtcblxuLy8gRXh0cmFjdCB0aGUgbnVtYmVyIG9mIHJvdW5kcyB1c2VkIGluIHRoZSBzcGVjaWZpZWQgYmNyeXB0IGhhc2guXG5jb25zdCBnZXRSb3VuZHNGcm9tQmNyeXB0SGFzaCA9IGhhc2ggPT4ge1xuICBsZXQgcm91bmRzO1xuICBpZiAoaGFzaCkge1xuICAgIGNvbnN0IGhhc2hTZWdtZW50cyA9IGhhc2guc3BsaXQoJyQnKTtcbiAgICBpZiAoaGFzaFNlZ21lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgIHJvdW5kcyA9IHBhcnNlSW50KGhhc2hTZWdtZW50c1syXSwgMTApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcm91bmRzO1xufTtcblxuLy8gQ2hlY2sgd2hldGhlciB0aGUgcHJvdmlkZWQgcGFzc3dvcmQgbWF0Y2hlcyB0aGUgYmNyeXB0J2VkIHBhc3N3b3JkIGluXG4vLyB0aGUgZGF0YWJhc2UgdXNlciByZWNvcmQuIGBwYXNzd29yZGAgY2FuIGJlIGEgc3RyaW5nIChpbiB3aGljaCBjYXNlXG4vLyBpdCB3aWxsIGJlIHJ1biB0aHJvdWdoIFNIQTI1NiBiZWZvcmUgYmNyeXB0KSBvciBhbiBvYmplY3Qgd2l0aFxuLy8gcHJvcGVydGllcyBgZGlnZXN0YCBhbmQgYGFsZ29yaXRobWAgKGluIHdoaWNoIGNhc2Ugd2UgYmNyeXB0XG4vLyBgcGFzc3dvcmQuZGlnZXN0YCkuXG4vL1xuQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQgPSBmdW5jdGlvbiAodXNlciwgcGFzc3dvcmQpIHtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICB1c2VySWQ6IHVzZXIuX2lkXG4gIH07XG5cbiAgY29uc3QgZm9ybWF0dGVkUGFzc3dvcmQgPSBnZXRQYXNzd29yZFN0cmluZyhwYXNzd29yZCk7XG4gIGNvbnN0IGhhc2ggPSB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdDtcbiAgY29uc3QgaGFzaFJvdW5kcyA9IGdldFJvdW5kc0Zyb21CY3J5cHRIYXNoKGhhc2gpO1xuXG4gIGlmICghIGJjcnlwdENvbXBhcmUoZm9ybWF0dGVkUGFzc3dvcmQsIGhhc2gpKSB7XG4gICAgcmVzdWx0LmVycm9yID0gaGFuZGxlRXJyb3IoXCJJbmNvcnJlY3QgcGFzc3dvcmRcIiwgZmFsc2UpO1xuICB9IGVsc2UgaWYgKGhhc2ggJiYgQWNjb3VudHMuX2JjcnlwdFJvdW5kcygpICE9IGhhc2hSb3VuZHMpIHtcbiAgICAvLyBUaGUgcGFzc3dvcmQgY2hlY2tzIG91dCwgYnV0IHRoZSB1c2VyJ3MgYmNyeXB0IGhhc2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7IF9pZDogdXNlci5faWQgfSwge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgJ3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6XG4gICAgICAgICAgICBiY3J5cHRIYXNoKGZvcm1hdHRlZFBhc3N3b3JkLCBBY2NvdW50cy5fYmNyeXB0Um91bmRzKCkpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG52YXIgY2hlY2tQYXNzd29yZCA9IEFjY291bnRzLl9jaGVja1Bhc3N3b3JkO1xuXG4vLy9cbi8vLyBFUlJPUiBIQU5ETEVSXG4vLy9cbmNvbnN0IGhhbmRsZUVycm9yID0gKG1zZywgdGhyb3dFcnJvciA9IHRydWUpID0+IHtcbiAgY29uc3QgZXJyb3IgPSBuZXcgTWV0ZW9yLkVycm9yKFxuICAgIDQwMyxcbiAgICBBY2NvdW50cy5fb3B0aW9ucy5hbWJpZ3VvdXNFcnJvck1lc3NhZ2VzXG4gICAgICA/IFwiU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBsZWFzZSBjaGVjayB5b3VyIGNyZWRlbnRpYWxzLlwiXG4gICAgICA6IG1zZ1xuICApO1xuICBpZiAodGhyb3dFcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn07XG5cbi8vL1xuLy8vIExPR0lOXG4vLy9cblxuQWNjb3VudHMuX2ZpbmRVc2VyQnlRdWVyeSA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICB2YXIgdXNlciA9IG51bGw7XG5cbiAgaWYgKHF1ZXJ5LmlkKSB7XG4gICAgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHsgX2lkOiBxdWVyeS5pZCB9KTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgZmllbGROYW1lO1xuICAgIHZhciBmaWVsZFZhbHVlO1xuICAgIGlmIChxdWVyeS51c2VybmFtZSkge1xuICAgICAgZmllbGROYW1lID0gJ3VzZXJuYW1lJztcbiAgICAgIGZpZWxkVmFsdWUgPSBxdWVyeS51c2VybmFtZTtcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5LmVtYWlsKSB7XG4gICAgICBmaWVsZE5hbWUgPSAnZW1haWxzLmFkZHJlc3MnO1xuICAgICAgZmllbGRWYWx1ZSA9IHF1ZXJ5LmVtYWlsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzaG91bGRuJ3QgaGFwcGVuICh2YWxpZGF0aW9uIG1pc3NlZCBzb21ldGhpbmcpXCIpO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0b3IgPSB7fTtcbiAgICBzZWxlY3RvcltmaWVsZE5hbWVdID0gZmllbGRWYWx1ZTtcbiAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoc2VsZWN0b3IpO1xuICAgIC8vIElmIHVzZXIgaXMgbm90IGZvdW5kLCB0cnkgYSBjYXNlIGluc2Vuc2l0aXZlIGxvb2t1cFxuICAgIGlmICghdXNlcikge1xuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvckZvckZhc3RDYXNlSW5zZW5zaXRpdmVMb29rdXAoZmllbGROYW1lLCBmaWVsZFZhbHVlKTtcbiAgICAgIHZhciBjYW5kaWRhdGVVc2VycyA9IE1ldGVvci51c2Vycy5maW5kKHNlbGVjdG9yKS5mZXRjaCgpO1xuICAgICAgLy8gTm8gbWF0Y2ggaWYgbXVsdGlwbGUgY2FuZGlkYXRlcyBhcmUgZm91bmRcbiAgICAgIGlmIChjYW5kaWRhdGVVc2Vycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdXNlciA9IGNhbmRpZGF0ZVVzZXJzWzBdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1c2VyO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBGaW5kcyB0aGUgdXNlciB3aXRoIHRoZSBzcGVjaWZpZWQgdXNlcm5hbWUuXG4gKiBGaXJzdCB0cmllcyB0byBtYXRjaCB1c2VybmFtZSBjYXNlIHNlbnNpdGl2ZWx5OyBpZiB0aGF0IGZhaWxzLCBpdFxuICogdHJpZXMgY2FzZSBpbnNlbnNpdGl2ZWx5OyBidXQgaWYgbW9yZSB0aGFuIG9uZSB1c2VyIG1hdGNoZXMgdGhlIGNhc2VcbiAqIGluc2Vuc2l0aXZlIHNlYXJjaCwgaXQgcmV0dXJucyBudWxsLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJuYW1lIFRoZSB1c2VybmFtZSB0byBsb29rIGZvclxuICogQHJldHVybnMge09iamVjdH0gQSB1c2VyIGlmIGZvdW5kLCBlbHNlIG51bGxcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmZpbmRVc2VyQnlVc2VybmFtZSA9IGZ1bmN0aW9uICh1c2VybmFtZSkge1xuICByZXR1cm4gQWNjb3VudHMuX2ZpbmRVc2VyQnlRdWVyeSh7XG4gICAgdXNlcm5hbWU6IHVzZXJuYW1lXG4gIH0pO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBGaW5kcyB0aGUgdXNlciB3aXRoIHRoZSBzcGVjaWZpZWQgZW1haWwuXG4gKiBGaXJzdCB0cmllcyB0byBtYXRjaCBlbWFpbCBjYXNlIHNlbnNpdGl2ZWx5OyBpZiB0aGF0IGZhaWxzLCBpdFxuICogdHJpZXMgY2FzZSBpbnNlbnNpdGl2ZWx5OyBidXQgaWYgbW9yZSB0aGFuIG9uZSB1c2VyIG1hdGNoZXMgdGhlIGNhc2VcbiAqIGluc2Vuc2l0aXZlIHNlYXJjaCwgaXQgcmV0dXJucyBudWxsLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsIFRoZSBlbWFpbCBhZGRyZXNzIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIHVzZXIgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuZmluZFVzZXJCeUVtYWlsID0gZnVuY3Rpb24gKGVtYWlsKSB7XG4gIHJldHVybiBBY2NvdW50cy5fZmluZFVzZXJCeVF1ZXJ5KHtcbiAgICBlbWFpbDogZW1haWxcbiAgfSk7XG59O1xuXG4vLyBHZW5lcmF0ZXMgYSBNb25nb0RCIHNlbGVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgdG8gcGVyZm9ybSBhIGZhc3QgY2FzZVxuLy8gaW5zZW5zaXRpdmUgbG9va3VwIGZvciB0aGUgZ2l2ZW4gZmllbGROYW1lIGFuZCBzdHJpbmcuIFNpbmNlIE1vbmdvREIgZG9lc1xuLy8gbm90IHN1cHBvcnQgY2FzZSBpbnNlbnNpdGl2ZSBpbmRleGVzLCBhbmQgY2FzZSBpbnNlbnNpdGl2ZSByZWdleCBxdWVyaWVzXG4vLyBhcmUgc2xvdywgd2UgY29uc3RydWN0IGEgc2V0IG9mIHByZWZpeCBzZWxlY3RvcnMgZm9yIGFsbCBwZXJtdXRhdGlvbnMgb2Zcbi8vIHRoZSBmaXJzdCA0IGNoYXJhY3RlcnMgb3Vyc2VsdmVzLiBXZSBmaXJzdCBhdHRlbXB0IHRvIG1hdGNoaW5nIGFnYWluc3Rcbi8vIHRoZXNlLCBhbmQgYmVjYXVzZSAncHJlZml4IGV4cHJlc3Npb24nIHJlZ2V4IHF1ZXJpZXMgZG8gdXNlIGluZGV4ZXMgKHNlZVxuLy8gaHR0cDovL2RvY3MubW9uZ29kYi5vcmcvdjIuNi9yZWZlcmVuY2Uvb3BlcmF0b3IvcXVlcnkvcmVnZXgvI2luZGV4LXVzZSksXG4vLyB0aGlzIGhhcyBiZWVuIGZvdW5kIHRvIGdyZWF0bHkgaW1wcm92ZSBwZXJmb3JtYW5jZSAoZnJvbSAxMjAwbXMgdG8gNW1zIGluIGFcbi8vIHRlc3Qgd2l0aCAxLjAwMC4wMDAgdXNlcnMpLlxudmFyIHNlbGVjdG9yRm9yRmFzdENhc2VJbnNlbnNpdGl2ZUxvb2t1cCA9IGZ1bmN0aW9uIChmaWVsZE5hbWUsIHN0cmluZykge1xuICAvLyBQZXJmb3JtYW5jZSBzZWVtcyB0byBpbXByb3ZlIHVwIHRvIDQgcHJlZml4IGNoYXJhY3RlcnNcbiAgdmFyIHByZWZpeCA9IHN0cmluZy5zdWJzdHJpbmcoMCwgTWF0aC5taW4oc3RyaW5nLmxlbmd0aCwgNCkpO1xuICB2YXIgb3JDbGF1c2UgPSBfLm1hcChnZW5lcmF0ZUNhc2VQZXJtdXRhdGlvbnNGb3JTdHJpbmcocHJlZml4KSxcbiAgICBmdW5jdGlvbiAocHJlZml4UGVybXV0YXRpb24pIHtcbiAgICAgIHZhciBzZWxlY3RvciA9IHt9O1xuICAgICAgc2VsZWN0b3JbZmllbGROYW1lXSA9XG4gICAgICAgIG5ldyBSZWdFeHAoJ14nICsgTWV0ZW9yLl9lc2NhcGVSZWdFeHAocHJlZml4UGVybXV0YXRpb24pKTtcbiAgICAgIHJldHVybiBzZWxlY3RvcjtcbiAgICB9KTtcbiAgdmFyIGNhc2VJbnNlbnNpdGl2ZUNsYXVzZSA9IHt9O1xuICBjYXNlSW5zZW5zaXRpdmVDbGF1c2VbZmllbGROYW1lXSA9XG4gICAgbmV3IFJlZ0V4cCgnXicgKyBNZXRlb3IuX2VzY2FwZVJlZ0V4cChzdHJpbmcpICsgJyQnLCAnaScpXG4gIHJldHVybiB7JGFuZDogW3skb3I6IG9yQ2xhdXNlfSwgY2FzZUluc2Vuc2l0aXZlQ2xhdXNlXX07XG59XG5cbi8vIEdlbmVyYXRlcyBwZXJtdXRhdGlvbnMgb2YgYWxsIGNhc2UgdmFyaWF0aW9ucyBvZiBhIGdpdmVuIHN0cmluZy5cbnZhciBnZW5lcmF0ZUNhc2VQZXJtdXRhdGlvbnNGb3JTdHJpbmcgPSBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gIHZhciBwZXJtdXRhdGlvbnMgPSBbJyddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjaCA9IHN0cmluZy5jaGFyQXQoaSk7XG4gICAgcGVybXV0YXRpb25zID0gXy5mbGF0dGVuKF8ubWFwKHBlcm11dGF0aW9ucywgZnVuY3Rpb24gKHByZWZpeCkge1xuICAgICAgdmFyIGxvd2VyQ2FzZUNoYXIgPSBjaC50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFyIHVwcGVyQ2FzZUNoYXIgPSBjaC50b1VwcGVyQ2FzZSgpO1xuICAgICAgLy8gRG9uJ3QgYWRkIHVubmVjY2VzYXJ5IHBlcm11dGF0aW9ucyB3aGVuIGNoIGlzIG5vdCBhIGxldHRlclxuICAgICAgaWYgKGxvd2VyQ2FzZUNoYXIgPT09IHVwcGVyQ2FzZUNoYXIpIHtcbiAgICAgICAgcmV0dXJuIFtwcmVmaXggKyBjaF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW3ByZWZpeCArIGxvd2VyQ2FzZUNoYXIsIHByZWZpeCArIHVwcGVyQ2FzZUNoYXJdO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfVxuICByZXR1cm4gcGVybXV0YXRpb25zO1xufVxuXG52YXIgY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzID0gZnVuY3Rpb24gKGZpZWxkTmFtZSwgZGlzcGxheU5hbWUsIGZpZWxkVmFsdWUsIG93blVzZXJJZCkge1xuICAvLyBTb21lIHRlc3RzIG5lZWQgdGhlIGFiaWxpdHkgdG8gYWRkIHVzZXJzIHdpdGggdGhlIHNhbWUgY2FzZSBpbnNlbnNpdGl2ZVxuICAvLyB2YWx1ZSwgaGVuY2UgdGhlIF9za2lwQ2FzZUluc2Vuc2l0aXZlQ2hlY2tzRm9yVGVzdCBjaGVja1xuICB2YXIgc2tpcENoZWNrID0gXy5oYXMoQWNjb3VudHMuX3NraXBDYXNlSW5zZW5zaXRpdmVDaGVja3NGb3JUZXN0LCBmaWVsZFZhbHVlKTtcblxuICBpZiAoZmllbGRWYWx1ZSAmJiAhc2tpcENoZWNrKSB7XG4gICAgdmFyIG1hdGNoZWRVc2VycyA9IE1ldGVvci51c2Vycy5maW5kKFxuICAgICAgc2VsZWN0b3JGb3JGYXN0Q2FzZUluc2Vuc2l0aXZlTG9va3VwKGZpZWxkTmFtZSwgZmllbGRWYWx1ZSkpLmZldGNoKCk7XG5cbiAgICBpZiAobWF0Y2hlZFVzZXJzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHVzZXJJZCB5ZXQsIGFueSBtYXRjaCB3ZSBmaW5kIGlzIGEgZHVwbGljYXRlXG4gICAgICAgICghb3duVXNlcklkIHx8XG4gICAgICAgIC8vIE90aGVyd2lzZSwgY2hlY2sgdG8gc2VlIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBtYXRjaGVzIG9yIGEgbWF0Y2hcbiAgICAgICAgLy8gdGhhdCBpcyBub3QgdXNcbiAgICAgICAgKG1hdGNoZWRVc2Vycy5sZW5ndGggPiAxIHx8IG1hdGNoZWRVc2Vyc1swXS5faWQgIT09IG93blVzZXJJZCkpKSB7XG4gICAgICBoYW5kbGVFcnJvcihkaXNwbGF5TmFtZSArIFwiIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIFhYWCBtYXliZSB0aGlzIGJlbG9uZ3MgaW4gdGhlIGNoZWNrIHBhY2thZ2VcbnZhciBOb25FbXB0eVN0cmluZyA9IE1hdGNoLldoZXJlKGZ1bmN0aW9uICh4KSB7XG4gIGNoZWNrKHgsIFN0cmluZyk7XG4gIHJldHVybiB4Lmxlbmd0aCA+IDA7XG59KTtcblxudmFyIHVzZXJRdWVyeVZhbGlkYXRvciA9IE1hdGNoLldoZXJlKGZ1bmN0aW9uICh1c2VyKSB7XG4gIGNoZWNrKHVzZXIsIHtcbiAgICBpZDogTWF0Y2guT3B0aW9uYWwoTm9uRW1wdHlTdHJpbmcpLFxuICAgIHVzZXJuYW1lOiBNYXRjaC5PcHRpb25hbChOb25FbXB0eVN0cmluZyksXG4gICAgZW1haWw6IE1hdGNoLk9wdGlvbmFsKE5vbkVtcHR5U3RyaW5nKVxuICB9KTtcbiAgaWYgKF8ua2V5cyh1c2VyKS5sZW5ndGggIT09IDEpXG4gICAgdGhyb3cgbmV3IE1hdGNoLkVycm9yKFwiVXNlciBwcm9wZXJ0eSBtdXN0IGhhdmUgZXhhY3RseSBvbmUgZmllbGRcIik7XG4gIHJldHVybiB0cnVlO1xufSk7XG5cbnZhciBwYXNzd29yZFZhbGlkYXRvciA9IE1hdGNoLk9uZU9mKFxuICBTdHJpbmcsXG4gIHsgZGlnZXN0OiBTdHJpbmcsIGFsZ29yaXRobTogU3RyaW5nIH1cbik7XG5cbi8vIEhhbmRsZXIgdG8gbG9naW4gd2l0aCBhIHBhc3N3b3JkLlxuLy9cbi8vIFRoZSBNZXRlb3IgY2xpZW50IHNldHMgb3B0aW9ucy5wYXNzd29yZCB0byBhbiBvYmplY3Qgd2l0aCBrZXlzXG4vLyAnZGlnZXN0JyAoc2V0IHRvIFNIQTI1NihwYXNzd29yZCkpIGFuZCAnYWxnb3JpdGhtJyAoXCJzaGEtMjU2XCIpLlxuLy9cbi8vIEZvciBvdGhlciBERFAgY2xpZW50cyB3aGljaCBkb24ndCBoYXZlIGFjY2VzcyB0byBTSEEsIHRoZSBoYW5kbGVyXG4vLyBhbHNvIGFjY2VwdHMgdGhlIHBsYWludGV4dCBwYXNzd29yZCBpbiBvcHRpb25zLnBhc3N3b3JkIGFzIGEgc3RyaW5nLlxuLy9cbi8vIChJdCBtaWdodCBiZSBuaWNlIGlmIHNlcnZlcnMgY291bGQgdHVybiB0aGUgcGxhaW50ZXh0IHBhc3N3b3JkXG4vLyBvcHRpb24gb2ZmLiBPciBtYXliZSBpdCBzaG91bGQgYmUgb3B0LWluLCBub3Qgb3B0LW91dD9cbi8vIEFjY291bnRzLmNvbmZpZyBvcHRpb24/KVxuLy9cbi8vIE5vdGUgdGhhdCBuZWl0aGVyIHBhc3N3b3JkIG9wdGlvbiBpcyBzZWN1cmUgd2l0aG91dCBTU0wuXG4vL1xuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoXCJwYXNzd29yZFwiLCBmdW5jdGlvbiAob3B0aW9ucykge1xuICBpZiAoISBvcHRpb25zLnBhc3N3b3JkIHx8IG9wdGlvbnMuc3JwKVxuICAgIHJldHVybiB1bmRlZmluZWQ7IC8vIGRvbid0IGhhbmRsZVxuXG4gIGNoZWNrKG9wdGlvbnMsIHtcbiAgICB1c2VyOiB1c2VyUXVlcnlWYWxpZGF0b3IsXG4gICAgcGFzc3dvcmQ6IHBhc3N3b3JkVmFsaWRhdG9yXG4gIH0pO1xuXG5cbiAgdmFyIHVzZXIgPSBBY2NvdW50cy5fZmluZFVzZXJCeVF1ZXJ5KG9wdGlvbnMudXNlcik7XG4gIGlmICghdXNlcikge1xuICAgIGhhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICBpZiAoIXVzZXIuc2VydmljZXMgfHwgIXVzZXIuc2VydmljZXMucGFzc3dvcmQgfHxcbiAgICAgICEodXNlci5zZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQgfHwgdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5zcnApKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIGhhcyBubyBwYXNzd29yZCBzZXRcIik7XG4gIH1cblxuICBpZiAoIXVzZXIuc2VydmljZXMucGFzc3dvcmQuYmNyeXB0KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnBhc3N3b3JkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAvLyBUaGUgY2xpZW50IGhhcyBwcmVzZW50ZWQgYSBwbGFpbnRleHQgcGFzc3dvcmQsIGFuZCB0aGUgdXNlciBpc1xuICAgICAgLy8gbm90IHVwZ3JhZGVkIHRvIGJjcnlwdCB5ZXQuIFdlIGRvbid0IGF0dGVtcHQgdG8gdGVsbCB0aGUgY2xpZW50XG4gICAgICAvLyB0byB1cGdyYWRlIHRvIGJjcnlwdCwgYmVjYXVzZSBpdCBtaWdodCBiZSBhIHN0YW5kYWxvbmUgRERQXG4gICAgICAvLyBjbGllbnQgZG9lc24ndCBrbm93IGhvdyB0byBkbyBzdWNoIGEgdGhpbmcuXG4gICAgICB2YXIgdmVyaWZpZXIgPSB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycDtcbiAgICAgIHZhciBuZXdWZXJpZmllciA9IFNSUC5nZW5lcmF0ZVZlcmlmaWVyKG9wdGlvbnMucGFzc3dvcmQsIHtcbiAgICAgICAgaWRlbnRpdHk6IHZlcmlmaWVyLmlkZW50aXR5LCBzYWx0OiB2ZXJpZmllci5zYWx0fSk7XG5cbiAgICAgIGlmICh2ZXJpZmllci52ZXJpZmllciAhPT0gbmV3VmVyaWZpZXIudmVyaWZpZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1c2VySWQ6IEFjY291bnRzLl9vcHRpb25zLmFtYmlndW91c0Vycm9yTWVzc2FnZXMgPyBudWxsIDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IGhhbmRsZUVycm9yKFwiSW5jb3JyZWN0IHBhc3N3b3JkXCIsIGZhbHNlKVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge3VzZXJJZDogdXNlci5faWR9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUZWxsIHRoZSBjbGllbnQgdG8gdXNlIHRoZSBTUlAgdXBncmFkZSBwcm9jZXNzLlxuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwib2xkIHBhc3N3b3JkIGZvcm1hdFwiLCBFSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBmb3JtYXQ6ICdzcnAnLFxuICAgICAgICBpZGVudGl0eTogdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5zcnAuaWRlbnRpdHlcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2hlY2tQYXNzd29yZChcbiAgICB1c2VyLFxuICAgIG9wdGlvbnMucGFzc3dvcmRcbiAgKTtcbn0pO1xuXG4vLyBIYW5kbGVyIHRvIGxvZ2luIHVzaW5nIHRoZSBTUlAgdXBncmFkZSBwYXRoLiBUbyB1c2UgdGhpcyBsb2dpblxuLy8gaGFuZGxlciwgdGhlIGNsaWVudCBtdXN0IHByb3ZpZGU6XG4vLyAgIC0gc3JwOiBIKGlkZW50aXR5ICsgXCI6XCIgKyBwYXNzd29yZClcbi8vICAgLSBwYXNzd29yZDogYSBzdHJpbmcgb3IgYW4gb2JqZWN0IHdpdGggcHJvcGVydGllcyAnZGlnZXN0JyBhbmQgJ2FsZ29yaXRobSdcbi8vXG4vLyBXZSB1c2UgYG9wdGlvbnMuc3JwYCB0byB2ZXJpZnkgdGhhdCB0aGUgY2xpZW50IGtub3dzIHRoZSBjb3JyZWN0XG4vLyBwYXNzd29yZCB3aXRob3V0IGRvaW5nIGEgZnVsbCBTUlAgZmxvdy4gT25jZSB3ZSd2ZSBjaGVja2VkIHRoYXQsIHdlXG4vLyB1cGdyYWRlIHRoZSB1c2VyIHRvIGJjcnlwdCBhbmQgcmVtb3ZlIHRoZSBTUlAgaW5mb3JtYXRpb24gZnJvbSB0aGVcbi8vIHVzZXIgZG9jdW1lbnQuXG4vL1xuLy8gVGhlIGNsaWVudCBlbmRzIHVwIHVzaW5nIHRoaXMgbG9naW4gaGFuZGxlciBhZnRlciB0cnlpbmcgdGhlIG5vcm1hbFxuLy8gbG9naW4gaGFuZGxlciAoYWJvdmUpLCB3aGljaCB0aHJvd3MgYW4gZXJyb3IgdGVsbGluZyB0aGUgY2xpZW50IHRvXG4vLyB0cnkgdGhlIFNSUCB1cGdyYWRlIHBhdGguXG4vL1xuLy8gWFhYIENPTVBBVCBXSVRIIDAuOC4xLjNcbkFjY291bnRzLnJlZ2lzdGVyTG9naW5IYW5kbGVyKFwicGFzc3dvcmRcIiwgZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zLnNycCB8fCAhb3B0aW9ucy5wYXNzd29yZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7IC8vIGRvbid0IGhhbmRsZVxuICB9XG5cbiAgY2hlY2sob3B0aW9ucywge1xuICAgIHVzZXI6IHVzZXJRdWVyeVZhbGlkYXRvcixcbiAgICBzcnA6IFN0cmluZyxcbiAgICBwYXNzd29yZDogcGFzc3dvcmRWYWxpZGF0b3JcbiAgfSk7XG5cbiAgdmFyIHVzZXIgPSBBY2NvdW50cy5fZmluZFVzZXJCeVF1ZXJ5KG9wdGlvbnMudXNlcik7XG4gIGlmICghdXNlcikge1xuICAgIGhhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICAvLyBDaGVjayB0byBzZWUgaWYgYW5vdGhlciBzaW11bHRhbmVvdXMgbG9naW4gaGFzIGFscmVhZHkgdXBncmFkZWRcbiAgLy8gdGhlIHVzZXIgcmVjb3JkIHRvIGJjcnlwdC5cbiAgaWYgKHVzZXIuc2VydmljZXMgJiYgdXNlci5zZXJ2aWNlcy5wYXNzd29yZCAmJiB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCkge1xuICAgIHJldHVybiBjaGVja1Bhc3N3b3JkKHVzZXIsIG9wdGlvbnMucGFzc3dvcmQpO1xuICB9XG5cbiAgaWYgKCEodXNlci5zZXJ2aWNlcyAmJiB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkICYmIHVzZXIuc2VydmljZXMucGFzc3dvcmQuc3JwKSkge1xuICAgIGhhbmRsZUVycm9yKFwiVXNlciBoYXMgbm8gcGFzc3dvcmQgc2V0XCIpO1xuICB9XG5cbiAgdmFyIHYxID0gdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5zcnAudmVyaWZpZXI7XG4gIHZhciB2MiA9IFNSUC5nZW5lcmF0ZVZlcmlmaWVyKFxuICAgIG51bGwsXG4gICAge1xuICAgICAgaGFzaGVkSWRlbnRpdHlBbmRQYXNzd29yZDogb3B0aW9ucy5zcnAsXG4gICAgICBzYWx0OiB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycC5zYWx0XG4gICAgfVxuICApLnZlcmlmaWVyO1xuICBpZiAodjEgIT09IHYyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXJJZDogQWNjb3VudHMuX29wdGlvbnMuYW1iaWd1b3VzRXJyb3JNZXNzYWdlcyA/IG51bGwgOiB1c2VyLl9pZCxcbiAgICAgIGVycm9yOiBoYW5kbGVFcnJvcihcIkluY29ycmVjdCBwYXNzd29yZFwiLCBmYWxzZSlcbiAgICB9O1xuICB9XG5cbiAgLy8gVXBncmFkZSB0byBiY3J5cHQgb24gc3VjY2Vzc2Z1bCBsb2dpbi5cbiAgdmFyIHNhbHRlZCA9IGhhc2hQYXNzd29yZChvcHRpb25zLnBhc3N3b3JkKTtcbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICB1c2VyLl9pZCxcbiAgICB7XG4gICAgICAkdW5zZXQ6IHsgJ3NlcnZpY2VzLnBhc3N3b3JkLnNycCc6IDEgfSxcbiAgICAgICRzZXQ6IHsgJ3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6IHNhbHRlZCB9XG4gICAgfVxuICApO1xuXG4gIHJldHVybiB7dXNlcklkOiB1c2VyLl9pZH07XG59KTtcblxuXG4vLy9cbi8vLyBDSEFOR0lOR1xuLy8vXG5cbi8qKlxuICogQHN1bW1hcnkgQ2hhbmdlIGEgdXNlcidzIHVzZXJuYW1lLiBVc2UgdGhpcyBpbnN0ZWFkIG9mIHVwZGF0aW5nIHRoZVxuICogZGF0YWJhc2UgZGlyZWN0bHkuIFRoZSBvcGVyYXRpb24gd2lsbCBmYWlsIGlmIHRoZXJlIGlzIGFuIGV4aXN0aW5nIHVzZXJcbiAqIHdpdGggYSB1c2VybmFtZSBvbmx5IGRpZmZlcmluZyBpbiBjYXNlLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gdXBkYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IG5ld1VzZXJuYW1lIEEgbmV3IHVzZXJuYW1lIGZvciB0aGUgdXNlci5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNldFVzZXJuYW1lID0gZnVuY3Rpb24gKHVzZXJJZCwgbmV3VXNlcm5hbWUpIHtcbiAgY2hlY2sodXNlcklkLCBOb25FbXB0eVN0cmluZyk7XG4gIGNoZWNrKG5ld1VzZXJuYW1lLCBOb25FbXB0eVN0cmluZyk7XG5cbiAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICBpZiAoIXVzZXIpIHtcbiAgICBoYW5kbGVFcnJvcihcIlVzZXIgbm90IGZvdW5kXCIpO1xuICB9XG5cbiAgdmFyIG9sZFVzZXJuYW1lID0gdXNlci51c2VybmFtZTtcblxuICAvLyBQZXJmb3JtIGEgY2FzZSBpbnNlbnNpdGl2ZSBjaGVjayBmb3IgZHVwbGljYXRlcyBiZWZvcmUgdXBkYXRlXG4gIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLCAnVXNlcm5hbWUnLCBuZXdVc2VybmFtZSwgdXNlci5faWQpO1xuXG4gIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LCB7JHNldDoge3VzZXJuYW1lOiBuZXdVc2VybmFtZX19KTtcblxuICAvLyBQZXJmb3JtIGFub3RoZXIgY2hlY2sgYWZ0ZXIgdXBkYXRlLCBpbiBjYXNlIGEgbWF0Y2hpbmcgdXNlciBoYXMgYmVlblxuICAvLyBpbnNlcnRlZCBpbiB0aGUgbWVhbnRpbWVcbiAgdHJ5IHtcbiAgICBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMoJ3VzZXJuYW1lJywgJ1VzZXJuYW1lJywgbmV3VXNlcm5hbWUsIHVzZXIuX2lkKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICAvLyBVbmRvIHVwZGF0ZSBpZiB0aGUgY2hlY2sgZmFpbHNcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgeyRzZXQ6IHt1c2VybmFtZTogb2xkVXNlcm5hbWV9fSk7XG4gICAgdGhyb3cgZXg7XG4gIH1cbn07XG5cbi8vIExldCB0aGUgdXNlciBjaGFuZ2UgdGhlaXIgb3duIHBhc3N3b3JkIGlmIHRoZXkga25vdyB0aGUgb2xkXG4vLyBwYXNzd29yZC4gYG9sZFBhc3N3b3JkYCBhbmQgYG5ld1Bhc3N3b3JkYCBzaG91bGQgYmUgb2JqZWN0cyB3aXRoIGtleXNcbi8vIGBkaWdlc3RgIGFuZCBgYWxnb3JpdGhtYCAocmVwcmVzZW50aW5nIHRoZSBTSEEyNTYgb2YgdGhlIHBhc3N3b3JkKS5cbi8vXG4vLyBYWFggQ09NUEFUIFdJVEggMC44LjEuM1xuLy8gTGlrZSB0aGUgbG9naW4gbWV0aG9kLCBpZiB0aGUgdXNlciBoYXNuJ3QgYmVlbiB1cGdyYWRlZCBmcm9tIFNSUCB0b1xuLy8gYmNyeXB0IHlldCwgdGhlbiB0aGlzIG1ldGhvZCB3aWxsIHRocm93IGFuICdvbGQgcGFzc3dvcmQgZm9ybWF0J1xuLy8gZXJyb3IuIFRoZSBjbGllbnQgc2hvdWxkIGNhbGwgdGhlIFNSUCB1cGdyYWRlIGxvZ2luIGhhbmRsZXIgYW5kIHRoZW5cbi8vIHJldHJ5IHRoaXMgbWV0aG9kIGFnYWluLlxuLy9cbi8vIFVOTElLRSB0aGUgbG9naW4gbWV0aG9kLCB0aGVyZSBpcyBubyB3YXkgdG8gYXZvaWQgZ2V0dGluZyBTUlAgdXBncmFkZVxuLy8gZXJyb3JzIHRocm93bi4gVGhlIHJlYXNvbmluZyBmb3IgdGhpcyBpcyB0aGF0IGNsaWVudHMgdXNpbmcgdGhpc1xuLy8gbWV0aG9kIGRpcmVjdGx5IHdpbGwgbmVlZCB0byBiZSB1cGRhdGVkIGFueXdheSBiZWNhdXNlIHdlIG5vIGxvbmdlclxuLy8gc3VwcG9ydCB0aGUgU1JQIGZsb3cgdGhhdCB0aGV5IHdvdWxkIGhhdmUgYmVlbiBkb2luZyB0byB1c2UgdGhpc1xuLy8gbWV0aG9kIHByZXZpb3VzbHkuXG5NZXRlb3IubWV0aG9kcyh7Y2hhbmdlUGFzc3dvcmQ6IGZ1bmN0aW9uIChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgY2hlY2sob2xkUGFzc3dvcmQsIHBhc3N3b3JkVmFsaWRhdG9yKTtcbiAgY2hlY2sobmV3UGFzc3dvcmQsIHBhc3N3b3JkVmFsaWRhdG9yKTtcblxuICBpZiAoIXRoaXMudXNlcklkKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwiTXVzdCBiZSBsb2dnZWQgaW5cIik7XG4gIH1cblxuICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHRoaXMudXNlcklkKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIGlmICghdXNlci5zZXJ2aWNlcyB8fCAhdXNlci5zZXJ2aWNlcy5wYXNzd29yZCB8fFxuICAgICAgKCF1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCAmJiAhdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5zcnApKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIGhhcyBubyBwYXNzd29yZCBzZXRcIik7XG4gIH1cblxuICBpZiAoISB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIm9sZCBwYXNzd29yZCBmb3JtYXRcIiwgRUpTT04uc3RyaW5naWZ5KHtcbiAgICAgIGZvcm1hdDogJ3NycCcsXG4gICAgICBpZGVudGl0eTogdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5zcnAuaWRlbnRpdHlcbiAgICB9KSk7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gY2hlY2tQYXNzd29yZCh1c2VyLCBvbGRQYXNzd29yZCk7XG4gIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICB0aHJvdyByZXN1bHQuZXJyb3I7XG4gIH1cblxuICB2YXIgaGFzaGVkID0gaGFzaFBhc3N3b3JkKG5ld1Bhc3N3b3JkKTtcblxuICAvLyBJdCB3b3VsZCBiZSBiZXR0ZXIgaWYgdGhpcyByZW1vdmVkIEFMTCBleGlzdGluZyB0b2tlbnMgYW5kIHJlcGxhY2VkXG4gIC8vIHRoZSB0b2tlbiBmb3IgdGhlIGN1cnJlbnQgY29ubmVjdGlvbiB3aXRoIGEgbmV3IG9uZSwgYnV0IHRoYXQgd291bGRcbiAgLy8gYmUgdHJpY2t5LCBzbyB3ZSdsbCBzZXR0bGUgZm9yIGp1c3QgcmVwbGFjaW5nIGFsbCB0b2tlbnMgb3RoZXIgdGhhblxuICAvLyB0aGUgb25lIGZvciB0aGUgY3VycmVudCBjb25uZWN0aW9uLlxuICB2YXIgY3VycmVudFRva2VuID0gQWNjb3VudHMuX2dldExvZ2luVG9rZW4odGhpcy5jb25uZWN0aW9uLmlkKTtcbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICB7IF9pZDogdGhpcy51c2VySWQgfSxcbiAgICB7XG4gICAgICAkc2V0OiB7ICdzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnOiBoYXNoZWQgfSxcbiAgICAgICRwdWxsOiB7XG4gICAgICAgICdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMnOiB7IGhhc2hlZFRva2VuOiB7ICRuZTogY3VycmVudFRva2VuIH0gfVxuICAgICAgfSxcbiAgICAgICR1bnNldDogeyAnc2VydmljZXMucGFzc3dvcmQucmVzZXQnOiAxIH1cbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIHtwYXNzd29yZENoYW5nZWQ6IHRydWV9O1xufX0pO1xuXG5cbi8vIEZvcmNlIGNoYW5nZSB0aGUgdXNlcnMgcGFzc3dvcmQuXG5cbi8qKlxuICogQHN1bW1hcnkgRm9yY2libHkgY2hhbmdlIHRoZSBwYXNzd29yZCBmb3IgYSB1c2VyLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gdXBkYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IG5ld1Bhc3N3b3JkIEEgbmV3IHBhc3N3b3JkIGZvciB0aGUgdXNlci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmxvZ291dCBMb2dvdXQgYWxsIGN1cnJlbnQgY29ubmVjdGlvbnMgd2l0aCB0aGlzIHVzZXJJZCAoZGVmYXVsdDogdHJ1ZSlcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNldFBhc3N3b3JkID0gZnVuY3Rpb24gKHVzZXJJZCwgbmV3UGxhaW50ZXh0UGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IF8uZXh0ZW5kKHtsb2dvdXQ6IHRydWV9LCBvcHRpb25zKTtcblxuICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG4gIGlmICghdXNlcikge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlVzZXIgbm90IGZvdW5kXCIpO1xuICB9XG5cbiAgdmFyIHVwZGF0ZSA9IHtcbiAgICAkdW5zZXQ6IHtcbiAgICAgICdzZXJ2aWNlcy5wYXNzd29yZC5zcnAnOiAxLCAvLyBYWFggQ09NUEFUIFdJVEggMC44LjEuM1xuICAgICAgJ3NlcnZpY2VzLnBhc3N3b3JkLnJlc2V0JzogMVxuICAgIH0sXG4gICAgJHNldDogeydzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnOiBoYXNoUGFzc3dvcmQobmV3UGxhaW50ZXh0UGFzc3dvcmQpfVxuICB9O1xuXG4gIGlmIChvcHRpb25zLmxvZ291dCkge1xuICAgIHVwZGF0ZS4kdW5zZXRbJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2VucyddID0gMTtcbiAgfVxuXG4gIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LCB1cGRhdGUpO1xufTtcblxuXG4vLy9cbi8vLyBSRVNFVFRJTkcgVklBIEVNQUlMXG4vLy9cblxuLy8gTWV0aG9kIGNhbGxlZCBieSBhIHVzZXIgdG8gcmVxdWVzdCBhIHBhc3N3b3JkIHJlc2V0IGVtYWlsLiBUaGlzIGlzXG4vLyB0aGUgc3RhcnQgb2YgdGhlIHJlc2V0IHByb2Nlc3MuXG5NZXRlb3IubWV0aG9kcyh7Zm9yZ290UGFzc3dvcmQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGNoZWNrKG9wdGlvbnMsIHtlbWFpbDogU3RyaW5nfSk7XG5cbiAgdmFyIHVzZXIgPSBBY2NvdW50cy5maW5kVXNlckJ5RW1haWwob3B0aW9ucy5lbWFpbCk7XG4gIGlmICghdXNlcikge1xuICAgIGhhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICBjb25zdCBlbWFpbHMgPSBfLnBsdWNrKHVzZXIuZW1haWxzIHx8IFtdLCAnYWRkcmVzcycpO1xuICBjb25zdCBjYXNlU2Vuc2l0aXZlRW1haWwgPSBfLmZpbmQoZW1haWxzLCBlbWFpbCA9PiB7XG4gICAgcmV0dXJuIGVtYWlsLnRvTG93ZXJDYXNlKCkgPT09IG9wdGlvbnMuZW1haWwudG9Mb3dlckNhc2UoKTtcbiAgfSk7XG5cbiAgQWNjb3VudHMuc2VuZFJlc2V0UGFzc3dvcmRFbWFpbCh1c2VyLl9pZCwgY2FzZVNlbnNpdGl2ZUVtYWlsKTtcbn19KTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZW5lcmF0ZXMgYSByZXNldCB0b2tlbiBhbmQgc2F2ZXMgaXQgaW50byB0aGUgZGF0YWJhc2UuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBnZW5lcmF0ZSB0aGUgcmVzZXQgdG9rZW4gZm9yLlxuICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIgdG8gZ2VuZXJhdGUgdGhlIHJlc2V0IHRva2VuIGZvci4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBJZiBgbnVsbGAsIGRlZmF1bHRzIHRvIHRoZSBmaXJzdCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb24gYHJlc2V0UGFzc3dvcmRgIG9yIGBlbnJvbGxBY2NvdW50YC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VufSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5nZW5lcmF0ZVJlc2V0VG9rZW4gPSBmdW5jdGlvbiAodXNlcklkLCBlbWFpbCwgcmVhc29uLCBleHRyYVRva2VuRGF0YSkge1xuICAvLyBNYWtlIHN1cmUgdGhlIHVzZXIgZXhpc3RzLCBhbmQgZW1haWwgaXMgb25lIG9mIHRoZWlyIGFkZHJlc3Nlcy5cbiAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICBpZiAoIXVzZXIpIHtcbiAgICBoYW5kbGVFcnJvcihcIkNhbid0IGZpbmQgdXNlclwiKTtcbiAgfVxuXG4gIC8vIHBpY2sgdGhlIGZpcnN0IGVtYWlsIGlmIHdlIHdlcmVuJ3QgcGFzc2VkIGFuIGVtYWlsLlxuICBpZiAoIWVtYWlsICYmIHVzZXIuZW1haWxzICYmIHVzZXIuZW1haWxzWzBdKSB7XG4gICAgZW1haWwgPSB1c2VyLmVtYWlsc1swXS5hZGRyZXNzO1xuICB9XG5cbiAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYSB2YWxpZCBlbWFpbFxuICBpZiAoIWVtYWlsIHx8ICFfLmNvbnRhaW5zKF8ucGx1Y2sodXNlci5lbWFpbHMgfHwgW10sICdhZGRyZXNzJyksIGVtYWlsKSkge1xuICAgIGhhbmRsZUVycm9yKFwiTm8gc3VjaCBlbWFpbCBmb3IgdXNlci5cIik7XG4gIH1cblxuICB2YXIgdG9rZW4gPSBSYW5kb20uc2VjcmV0KCk7XG4gIHZhciB0b2tlblJlY29yZCA9IHtcbiAgICB0b2tlbjogdG9rZW4sXG4gICAgZW1haWw6IGVtYWlsLFxuICAgIHdoZW46IG5ldyBEYXRlKClcbiAgfTtcblxuICBpZiAocmVhc29uID09PSAncmVzZXRQYXNzd29yZCcpIHtcbiAgICB0b2tlblJlY29yZC5yZWFzb24gPSAncmVzZXQnO1xuICB9IGVsc2UgaWYgKHJlYXNvbiA9PT0gJ2Vucm9sbEFjY291bnQnKSB7XG4gICAgdG9rZW5SZWNvcmQucmVhc29uID0gJ2Vucm9sbCc7XG4gIH0gZWxzZSBpZiAocmVhc29uKSB7XG4gICAgLy8gZmFsbGJhY2sgc28gdGhhdCB0aGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGZvciB1bmtub3duIHJlYXNvbnMgYXMgd2VsbFxuICAgIHRva2VuUmVjb3JkLnJlYXNvbiA9IHJlYXNvbjtcbiAgfVxuXG4gIGlmIChleHRyYVRva2VuRGF0YSkge1xuICAgIF8uZXh0ZW5kKHRva2VuUmVjb3JkLCBleHRyYVRva2VuRGF0YSk7XG4gIH1cblxuICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgeyRzZXQ6IHtcbiAgICAnc2VydmljZXMucGFzc3dvcmQucmVzZXQnOiB0b2tlblJlY29yZFxuICB9fSk7XG5cbiAgLy8gYmVmb3JlIHBhc3NpbmcgdG8gdGVtcGxhdGUsIHVwZGF0ZSB1c2VyIG9iamVjdCB3aXRoIG5ldyB0b2tlblxuICBNZXRlb3IuX2Vuc3VyZSh1c2VyLCAnc2VydmljZXMnLCAncGFzc3dvcmQnKS5yZXNldCA9IHRva2VuUmVjb3JkO1xuXG4gIHJldHVybiB7ZW1haWwsIHVzZXIsIHRva2VufTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgR2VuZXJhdGVzIGFuIGUtbWFpbCB2ZXJpZmljYXRpb24gdG9rZW4gYW5kIHNhdmVzIGl0IGludG8gdGhlIGRhdGFiYXNlLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gZ2VuZXJhdGUgdGhlICBlLW1haWwgdmVyaWZpY2F0aW9uIHRva2VuIGZvci5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbCBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyIHRvIGdlbmVyYXRlIHRoZSBlLW1haWwgdmVyaWZpY2F0aW9uIHRva2VuIGZvci4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBJZiBgbnVsbGAsIGRlZmF1bHRzIHRvIHRoZSBmaXJzdCB1bnZlcmlmaWVkIGVtYWlsIGluIHRoZSBsaXN0LlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVRva2VuRGF0YV0gT3B0aW9uYWwgYWRkaXRpb25hbCBkYXRhIHRvIGJlIGFkZGVkIGludG8gdGhlIHRva2VuIHJlY29yZC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW59IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmdlbmVyYXRlVmVyaWZpY2F0aW9uVG9rZW4gPSBmdW5jdGlvbiAodXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEpIHtcbiAgLy8gTWFrZSBzdXJlIHRoZSB1c2VyIGV4aXN0cywgYW5kIGVtYWlsIGlzIG9uZSBvZiB0aGVpciBhZGRyZXNzZXMuXG4gIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJDYW4ndCBmaW5kIHVzZXJcIik7XG4gIH1cblxuICAvLyBwaWNrIHRoZSBmaXJzdCB1bnZlcmlmaWVkIGVtYWlsIGlmIHdlIHdlcmVuJ3QgcGFzc2VkIGFuIGVtYWlsLlxuICBpZiAoIWVtYWlsKSB7XG4gICAgdmFyIGVtYWlsUmVjb3JkID0gXy5maW5kKHVzZXIuZW1haWxzIHx8IFtdLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gIWUudmVyaWZpZWQ7IH0pO1xuICAgIGVtYWlsID0gKGVtYWlsUmVjb3JkIHx8IHt9KS5hZGRyZXNzO1xuXG4gICAgaWYgKCFlbWFpbCkge1xuICAgICAgaGFuZGxlRXJyb3IoXCJUaGF0IHVzZXIgaGFzIG5vIHVudmVyaWZpZWQgZW1haWwgYWRkcmVzc2VzLlwiKTtcbiAgICB9XG4gIH1cblxuICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSBhIHZhbGlkIGVtYWlsXG4gIGlmICghZW1haWwgfHwgIV8uY29udGFpbnMoXy5wbHVjayh1c2VyLmVtYWlscyB8fCBbXSwgJ2FkZHJlc3MnKSwgZW1haWwpKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJObyBzdWNoIGVtYWlsIGZvciB1c2VyLlwiKTtcbiAgfVxuXG4gIHZhciB0b2tlbiA9IFJhbmRvbS5zZWNyZXQoKTtcbiAgdmFyIHRva2VuUmVjb3JkID0ge1xuICAgIHRva2VuOiB0b2tlbixcbiAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCBwcm9iYWJseSBiZSByZW5hbWVkIHRvIFwiZW1haWxcIiB0byBtYXRjaCByZXNldCB0b2tlbiByZWNvcmQuXG4gICAgYWRkcmVzczogZW1haWwsXG4gICAgd2hlbjogbmV3IERhdGUoKVxuICB9O1xuXG4gIGlmIChleHRyYVRva2VuRGF0YSkge1xuICAgIF8uZXh0ZW5kKHRva2VuUmVjb3JkLCBleHRyYVRva2VuRGF0YSk7XG4gIH1cblxuICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgeyRwdXNoOiB7XG4gICAgJ3NlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucyc6IHRva2VuUmVjb3JkXG4gIH19KTtcblxuICAvLyBiZWZvcmUgcGFzc2luZyB0byB0ZW1wbGF0ZSwgdXBkYXRlIHVzZXIgb2JqZWN0IHdpdGggbmV3IHRva2VuXG4gIE1ldGVvci5fZW5zdXJlKHVzZXIsICdzZXJ2aWNlcycsICdlbWFpbCcpO1xuICBpZiAoIXVzZXIuc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zKSB7XG4gICAgdXNlci5zZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMgPSBbXTtcbiAgfVxuICB1c2VyLnNlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucy5wdXNoKHRva2VuUmVjb3JkKTtcblxuICByZXR1cm4ge2VtYWlsLCB1c2VyLCB0b2tlbn07XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IENyZWF0ZXMgb3B0aW9ucyBmb3IgZW1haWwgc2VuZGluZyBmb3IgcmVzZXQgcGFzc3dvcmQgYW5kIGVucm9sbCBhY2NvdW50IGVtYWlscy5cbiAqIFlvdSBjYW4gdXNlIHRoaXMgZnVuY3Rpb24gd2hlbiBjdXN0b21pemluZyBhIHJlc2V0IHBhc3N3b3JkIG9yIGVucm9sbCBhY2NvdW50IGVtYWlsIHNlbmRpbmcuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge09iamVjdH0gZW1haWwgV2hpY2ggYWRkcmVzcyBvZiB0aGUgdXNlcidzIHRvIHNlbmQgdGhlIGVtYWlsIHRvLlxuICogQHBhcmFtIHtPYmplY3R9IHVzZXIgVGhlIHVzZXIgb2JqZWN0IHRvIGdlbmVyYXRlIG9wdGlvbnMgZm9yLlxuICogQHBhcmFtIHtTdHJpbmd9IHVybCBVUkwgdG8gd2hpY2ggdXNlciBpcyBkaXJlY3RlZCB0byBjb25maXJtIHRoZSBlbWFpbC5cbiAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb24gYHJlc2V0UGFzc3dvcmRgIG9yIGBlbnJvbGxBY2NvdW50YC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IE9wdGlvbnMgd2hpY2ggY2FuIGJlIHBhc3NlZCB0byBgRW1haWwuc2VuZGAuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5nZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbCA9IGZ1bmN0aW9uIChlbWFpbCwgdXNlciwgdXJsLCByZWFzb24pIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgdG86IGVtYWlsLFxuICAgIGZyb206IEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0uZnJvbVxuICAgICAgPyBBY2NvdW50cy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLmZyb20odXNlcilcbiAgICAgIDogQWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuZnJvbSxcbiAgICBzdWJqZWN0OiBBY2NvdW50cy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLnN1YmplY3QodXNlcilcbiAgfTtcblxuICBpZiAodHlwZW9mIEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0udGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9wdGlvbnMudGV4dCA9IEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0udGV4dCh1c2VyLCB1cmwpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBBY2NvdW50cy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLmh0bWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICBvcHRpb25zLmh0bWwgPSBBY2NvdW50cy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLmh0bWwodXNlciwgdXJsKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgQWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuaGVhZGVycyA9PT0gJ29iamVjdCcpIHtcbiAgICBvcHRpb25zLmhlYWRlcnMgPSBBY2NvdW50cy5lbWFpbFRlbXBsYXRlcy5oZWFkZXJzO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnM7XG59O1xuXG4vLyBzZW5kIHRoZSB1c2VyIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoYXQgd2hlbiBvcGVuZWQgYWxsb3dzIHRoZSB1c2VyXG4vLyB0byBzZXQgYSBuZXcgcGFzc3dvcmQsIHdpdGhvdXQgdGhlIG9sZCBwYXNzd29yZC5cblxuLyoqXG4gKiBAc3VtbWFyeSBTZW5kIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoZSB1c2VyIGNhbiB1c2UgdG8gcmVzZXQgdGhlaXIgcGFzc3dvcmQuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBzZW5kIGVtYWlsIHRvLlxuICogQHBhcmFtIHtTdHJpbmd9IFtlbWFpbF0gT3B0aW9uYWwuIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIncyB0byBzZW5kIHRoZSBlbWFpbCB0by4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBEZWZhdWx0cyB0byB0aGUgZmlyc3QgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHJldHVybnMge09iamVjdH0gT2JqZWN0IHdpdGgge2VtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zfSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5zZW5kUmVzZXRQYXNzd29yZEVtYWlsID0gZnVuY3Rpb24gKHVzZXJJZCwgZW1haWwsIGV4dHJhVG9rZW5EYXRhKSB7XG4gIGNvbnN0IHtlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbn0gPVxuICAgIEFjY291bnRzLmdlbmVyYXRlUmVzZXRUb2tlbih1c2VySWQsIGVtYWlsLCAncmVzZXRQYXNzd29yZCcsIGV4dHJhVG9rZW5EYXRhKTtcbiAgY29uc3QgdXJsID0gQWNjb3VudHMudXJscy5yZXNldFBhc3N3b3JkKHRva2VuKTtcbiAgY29uc3Qgb3B0aW9ucyA9IEFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsKHJlYWxFbWFpbCwgdXNlciwgdXJsLCAncmVzZXRQYXNzd29yZCcpO1xuICBFbWFpbC5zZW5kKG9wdGlvbnMpO1xuICByZXR1cm4ge2VtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9O1xufTtcblxuLy8gc2VuZCB0aGUgdXNlciBhbiBlbWFpbCBpbmZvcm1pbmcgdGhlbSB0aGF0IHRoZWlyIGFjY291bnQgd2FzIGNyZWF0ZWQsIHdpdGhcbi8vIGEgbGluayB0aGF0IHdoZW4gb3BlbmVkIGJvdGggbWFya3MgdGhlaXIgZW1haWwgYXMgdmVyaWZpZWQgYW5kIGZvcmNlcyB0aGVtXG4vLyB0byBjaG9vc2UgdGhlaXIgcGFzc3dvcmQuIFRoZSBlbWFpbCBtdXN0IGJlIG9uZSBvZiB0aGUgYWRkcmVzc2VzIGluIHRoZVxuLy8gdXNlcidzIGVtYWlscyBmaWVsZCwgb3IgdW5kZWZpbmVkIHRvIHBpY2sgdGhlIGZpcnN0IGVtYWlsIGF1dG9tYXRpY2FsbHkuXG4vL1xuLy8gVGhpcyBpcyBub3QgY2FsbGVkIGF1dG9tYXRpY2FsbHkuIEl0IG11c3QgYmUgY2FsbGVkIG1hbnVhbGx5IGlmIHlvdVxuLy8gd2FudCB0byB1c2UgZW5yb2xsbWVudCBlbWFpbHMuXG5cbi8qKlxuICogQHN1bW1hcnkgU2VuZCBhbiBlbWFpbCB3aXRoIGEgbGluayB0aGUgdXNlciBjYW4gdXNlIHRvIHNldCB0aGVpciBpbml0aWFsIHBhc3N3b3JkLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gc2VuZCBlbWFpbCB0by5cbiAqIEBwYXJhbSB7U3RyaW5nfSBbZW1haWxdIE9wdGlvbmFsLiBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyJ3MgdG8gc2VuZCB0aGUgZW1haWwgdG8uIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gRGVmYXVsdHMgdG8gdGhlIGZpcnN0IGVtYWlsIGluIHRoZSBsaXN0LlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVRva2VuRGF0YV0gT3B0aW9uYWwgYWRkaXRpb25hbCBkYXRhIHRvIGJlIGFkZGVkIGludG8gdGhlIHRva2VuIHJlY29yZC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc30gdmFsdWVzLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2VuZEVucm9sbG1lbnRFbWFpbCA9IGZ1bmN0aW9uICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSkge1xuICBjb25zdCB7ZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW59ID1cbiAgICBBY2NvdW50cy5nZW5lcmF0ZVJlc2V0VG9rZW4odXNlcklkLCBlbWFpbCwgJ2Vucm9sbEFjY291bnQnLCBleHRyYVRva2VuRGF0YSk7XG4gIGNvbnN0IHVybCA9IEFjY291bnRzLnVybHMuZW5yb2xsQWNjb3VudCh0b2tlbik7XG4gIGNvbnN0IG9wdGlvbnMgPSBBY2NvdW50cy5nZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbChyZWFsRW1haWwsIHVzZXIsIHVybCwgJ2Vucm9sbEFjY291bnQnKTtcbiAgRW1haWwuc2VuZChvcHRpb25zKTtcbiAgcmV0dXJuIHtlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zfTtcbn07XG5cblxuLy8gVGFrZSB0b2tlbiBmcm9tIHNlbmRSZXNldFBhc3N3b3JkRW1haWwgb3Igc2VuZEVucm9sbG1lbnRFbWFpbCwgY2hhbmdlXG4vLyB0aGUgdXNlcnMgcGFzc3dvcmQsIGFuZCBsb2cgdGhlbSBpbi5cbk1ldGVvci5tZXRob2RzKHtyZXNldFBhc3N3b3JkOiBmdW5jdGlvbiAodG9rZW4sIG5ld1Bhc3N3b3JkKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgcmV0dXJuIEFjY291bnRzLl9sb2dpbk1ldGhvZChcbiAgICBzZWxmLFxuICAgIFwicmVzZXRQYXNzd29yZFwiLFxuICAgIGFyZ3VtZW50cyxcbiAgICBcInBhc3N3b3JkXCIsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2sodG9rZW4sIFN0cmluZyk7XG4gICAgICBjaGVjayhuZXdQYXNzd29yZCwgcGFzc3dvcmRWYWxpZGF0b3IpO1xuXG4gICAgICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcbiAgICAgICAgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC50b2tlblwiOiB0b2tlbn0pO1xuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGV4cGlyZWRcIik7XG4gICAgICB9XG4gICAgICB2YXIgd2hlbiA9IHVzZXIuc2VydmljZXMucGFzc3dvcmQucmVzZXQud2hlbjtcbiAgICAgIHZhciByZWFzb24gPSB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LnJlYXNvbjtcbiAgICAgIHZhciB0b2tlbkxpZmV0aW1lTXMgPSBBY2NvdW50cy5fZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcygpO1xuICAgICAgaWYgKHJlYXNvbiA9PT0gXCJlbnJvbGxcIikge1xuICAgICAgICB0b2tlbkxpZmV0aW1lTXMgPSBBY2NvdW50cy5fZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMoKTtcbiAgICAgIH1cbiAgICAgIHZhciBjdXJyZW50VGltZU1zID0gRGF0ZS5ub3coKTtcbiAgICAgIGlmICgoY3VycmVudFRpbWVNcyAtIHdoZW4pID4gdG9rZW5MaWZldGltZU1zKVxuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJUb2tlbiBleHBpcmVkXCIpO1xuICAgICAgdmFyIGVtYWlsID0gdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5yZXNldC5lbWFpbDtcbiAgICAgIGlmICghXy5pbmNsdWRlKF8ucGx1Y2sodXNlci5lbWFpbHMgfHwgW10sICdhZGRyZXNzJyksIGVtYWlsKSlcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJUb2tlbiBoYXMgaW52YWxpZCBlbWFpbCBhZGRyZXNzXCIpXG4gICAgICAgIH07XG5cbiAgICAgIHZhciBoYXNoZWQgPSBoYXNoUGFzc3dvcmQobmV3UGFzc3dvcmQpO1xuXG4gICAgICAvLyBOT1RFOiBXZSdyZSBhYm91dCB0byBpbnZhbGlkYXRlIHRva2VucyBvbiB0aGUgdXNlciwgd2hvIHdlIG1pZ2h0IGJlXG4gICAgICAvLyBsb2dnZWQgaW4gYXMuIE1ha2Ugc3VyZSB0byBhdm9pZCBsb2dnaW5nIG91cnNlbHZlcyBvdXQgaWYgdGhpc1xuICAgICAgLy8gaGFwcGVucy4gQnV0IGFsc28gbWFrZSBzdXJlIG5vdCB0byBsZWF2ZSB0aGUgY29ubmVjdGlvbiBpbiBhIHN0YXRlXG4gICAgICAvLyBvZiBoYXZpbmcgYSBiYWQgdG9rZW4gc2V0IGlmIHRoaW5ncyBmYWlsLlxuICAgICAgdmFyIG9sZFRva2VuID0gQWNjb3VudHMuX2dldExvZ2luVG9rZW4oc2VsZi5jb25uZWN0aW9uLmlkKTtcbiAgICAgIEFjY291bnRzLl9zZXRMb2dpblRva2VuKHVzZXIuX2lkLCBzZWxmLmNvbm5lY3Rpb24sIG51bGwpO1xuICAgICAgdmFyIHJlc2V0VG9PbGRUb2tlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQWNjb3VudHMuX3NldExvZ2luVG9rZW4odXNlci5faWQsIHNlbGYuY29ubmVjdGlvbiwgb2xkVG9rZW4pO1xuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB1c2VyIHJlY29yZCBieTpcbiAgICAgICAgLy8gLSBDaGFuZ2luZyB0aGUgcGFzc3dvcmQgdG8gdGhlIG5ldyBvbmVcbiAgICAgICAgLy8gLSBGb3JnZXR0aW5nIGFib3V0IHRoZSByZXNldCB0b2tlbiB0aGF0IHdhcyBqdXN0IHVzZWRcbiAgICAgICAgLy8gLSBWZXJpZnlpbmcgdGhlaXIgZW1haWwsIHNpbmNlIHRoZXkgZ290IHRoZSBwYXNzd29yZCByZXNldCB2aWEgZW1haWwuXG4gICAgICAgIHZhciBhZmZlY3RlZFJlY29yZHMgPSBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIF9pZDogdXNlci5faWQsXG4gICAgICAgICAgICAnZW1haWxzLmFkZHJlc3MnOiBlbWFpbCxcbiAgICAgICAgICAgICdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC50b2tlbic6IHRva2VuXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7JHNldDogeydzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnOiBoYXNoZWQsXG4gICAgICAgICAgICAgICAgICAnZW1haWxzLiQudmVyaWZpZWQnOiB0cnVlfSxcbiAgICAgICAgICAgJHVuc2V0OiB7J3NlcnZpY2VzLnBhc3N3b3JkLnJlc2V0JzogMSxcbiAgICAgICAgICAgICAgICAgICAgJ3NlcnZpY2VzLnBhc3N3b3JkLnNycCc6IDF9fSk7XG4gICAgICAgIGlmIChhZmZlY3RlZFJlY29yZHMgIT09IDEpXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiSW52YWxpZCBlbWFpbFwiKVxuICAgICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzZXRUb09sZFRva2VuKCk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cblxuICAgICAgLy8gUmVwbGFjZSBhbGwgdmFsaWQgbG9naW4gdG9rZW5zIHdpdGggbmV3IG9uZXMgKGNoYW5naW5nXG4gICAgICAvLyBwYXNzd29yZCBzaG91bGQgaW52YWxpZGF0ZSBleGlzdGluZyBzZXNzaW9ucykuXG4gICAgICBBY2NvdW50cy5fY2xlYXJBbGxMb2dpblRva2Vucyh1c2VyLl9pZCk7XG5cbiAgICAgIHJldHVybiB7dXNlcklkOiB1c2VyLl9pZH07XG4gICAgfVxuICApO1xufX0pO1xuXG4vLy9cbi8vLyBFTUFJTCBWRVJJRklDQVRJT05cbi8vL1xuXG5cbi8vIHNlbmQgdGhlIHVzZXIgYW4gZW1haWwgd2l0aCBhIGxpbmsgdGhhdCB3aGVuIG9wZW5lZCBtYXJrcyB0aGF0XG4vLyBhZGRyZXNzIGFzIHZlcmlmaWVkXG5cbi8qKlxuICogQHN1bW1hcnkgU2VuZCBhbiBlbWFpbCB3aXRoIGEgbGluayB0aGUgdXNlciBjYW4gdXNlIHZlcmlmeSB0aGVpciBlbWFpbCBhZGRyZXNzLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gc2VuZCBlbWFpbCB0by5cbiAqIEBwYXJhbSB7U3RyaW5nfSBbZW1haWxdIE9wdGlvbmFsLiBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyJ3MgdG8gc2VuZCB0aGUgZW1haWwgdG8uIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gRGVmYXVsdHMgdG8gdGhlIGZpcnN0IHVudmVyaWZpZWQgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHJldHVybnMge09iamVjdH0gT2JqZWN0IHdpdGgge2VtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zfSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5zZW5kVmVyaWZpY2F0aW9uRW1haWwgPSBmdW5jdGlvbiAodXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEpIHtcbiAgLy8gWFhYIEFsc28gZ2VuZXJhdGUgYSBsaW5rIHVzaW5nIHdoaWNoIHNvbWVvbmUgY2FuIGRlbGV0ZSB0aGlzXG4gIC8vIGFjY291bnQgaWYgdGhleSBvd24gc2FpZCBhZGRyZXNzIGJ1dCB3ZXJlbid0IHRob3NlIHdobyBjcmVhdGVkXG4gIC8vIHRoaXMgYWNjb3VudC5cblxuICBjb25zdCB7ZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW59ID1cbiAgICBBY2NvdW50cy5nZW5lcmF0ZVZlcmlmaWNhdGlvblRva2VuKHVzZXJJZCwgZW1haWwsIGV4dHJhVG9rZW5EYXRhKTtcbiAgY29uc3QgdXJsID0gQWNjb3VudHMudXJscy52ZXJpZnlFbWFpbCh0b2tlbik7XG4gIGNvbnN0IG9wdGlvbnMgPSBBY2NvdW50cy5nZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbChyZWFsRW1haWwsIHVzZXIsIHVybCwgJ3ZlcmlmeUVtYWlsJyk7XG4gIEVtYWlsLnNlbmQob3B0aW9ucyk7XG4gIHJldHVybiB7ZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc307XG59O1xuXG4vLyBUYWtlIHRva2VuIGZyb20gc2VuZFZlcmlmaWNhdGlvbkVtYWlsLCBtYXJrIHRoZSBlbWFpbCBhcyB2ZXJpZmllZCxcbi8vIGFuZCBsb2cgdGhlbSBpbi5cbk1ldGVvci5tZXRob2RzKHt2ZXJpZnlFbWFpbDogZnVuY3Rpb24gKHRva2VuKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgcmV0dXJuIEFjY291bnRzLl9sb2dpbk1ldGhvZChcbiAgICBzZWxmLFxuICAgIFwidmVyaWZ5RW1haWxcIixcbiAgICBhcmd1bWVudHMsXG4gICAgXCJwYXNzd29yZFwiLFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG4gICAgICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKFxuICAgICAgICB7J3NlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucy50b2tlbic6IHRva2VufSk7XG4gICAgICBpZiAoIXVzZXIpXG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlZlcmlmeSBlbWFpbCBsaW5rIGV4cGlyZWRcIik7XG5cbiAgICAgIHZhciB0b2tlblJlY29yZCA9IF8uZmluZCh1c2VyLnNlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2VucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQudG9rZW4gPT0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICBpZiAoIXRva2VuUmVjb3JkKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlZlcmlmeSBlbWFpbCBsaW5rIGV4cGlyZWRcIilcbiAgICAgICAgfTtcblxuICAgICAgdmFyIGVtYWlsc1JlY29yZCA9IF8uZmluZCh1c2VyLmVtYWlscywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIGUuYWRkcmVzcyA9PSB0b2tlblJlY29yZC5hZGRyZXNzO1xuICAgICAgfSk7XG4gICAgICBpZiAoIWVtYWlsc1JlY29yZClcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJWZXJpZnkgZW1haWwgbGluayBpcyBmb3IgdW5rbm93biBhZGRyZXNzXCIpXG4gICAgICAgIH07XG5cbiAgICAgIC8vIEJ5IGluY2x1ZGluZyB0aGUgYWRkcmVzcyBpbiB0aGUgcXVlcnksIHdlIGNhbiB1c2UgJ2VtYWlscy4kJyBpbiB0aGVcbiAgICAgIC8vIG1vZGlmaWVyIHRvIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgc3BlY2lmaWMgb2JqZWN0IGluIHRoZSBlbWFpbHNcbiAgICAgIC8vIGFycmF5LiBTZWVcbiAgICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1VwZGF0aW5nLyNVcGRhdGluZy1UaGUlMjRwb3NpdGlvbmFsb3BlcmF0b3IpXG4gICAgICAvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Rpc3BsYXkvRE9DUy9VcGRhdGluZyNVcGRhdGluZy0lMjRwdWxsXG4gICAgICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgICAgICB7X2lkOiB1c2VyLl9pZCxcbiAgICAgICAgICdlbWFpbHMuYWRkcmVzcyc6IHRva2VuUmVjb3JkLmFkZHJlc3N9LFxuICAgICAgICB7JHNldDogeydlbWFpbHMuJC52ZXJpZmllZCc6IHRydWV9LFxuICAgICAgICAgJHB1bGw6IHsnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zJzoge2FkZHJlc3M6IHRva2VuUmVjb3JkLmFkZHJlc3N9fX0pO1xuXG4gICAgICByZXR1cm4ge3VzZXJJZDogdXNlci5faWR9O1xuICAgIH1cbiAgKTtcbn19KTtcblxuLyoqXG4gKiBAc3VtbWFyeSBBZGQgYW4gZW1haWwgYWRkcmVzcyBmb3IgYSB1c2VyLiBVc2UgdGhpcyBpbnN0ZWFkIG9mIGRpcmVjdGx5XG4gKiB1cGRhdGluZyB0aGUgZGF0YWJhc2UuIFRoZSBvcGVyYXRpb24gd2lsbCBmYWlsIGlmIHRoZXJlIGlzIGEgZGlmZmVyZW50IHVzZXJcbiAqIHdpdGggYW4gZW1haWwgb25seSBkaWZmZXJpbmcgaW4gY2FzZS4gSWYgdGhlIHNwZWNpZmllZCB1c2VyIGhhcyBhbiBleGlzdGluZ1xuICogZW1haWwgb25seSBkaWZmZXJpbmcgaW4gY2FzZSBob3dldmVyLCB3ZSByZXBsYWNlIGl0LlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gdXBkYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IG5ld0VtYWlsIEEgbmV3IGVtYWlsIGFkZHJlc3MgZm9yIHRoZSB1c2VyLlxuICogQHBhcmFtIHtCb29sZWFufSBbdmVyaWZpZWRdIE9wdGlvbmFsIC0gd2hldGhlciB0aGUgbmV3IGVtYWlsIGFkZHJlc3Mgc2hvdWxkXG4gKiBiZSBtYXJrZWQgYXMgdmVyaWZpZWQuIERlZmF1bHRzIHRvIGZhbHNlLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuYWRkRW1haWwgPSBmdW5jdGlvbiAodXNlcklkLCBuZXdFbWFpbCwgdmVyaWZpZWQpIHtcbiAgY2hlY2sodXNlcklkLCBOb25FbXB0eVN0cmluZyk7XG4gIGNoZWNrKG5ld0VtYWlsLCBOb25FbXB0eVN0cmluZyk7XG4gIGNoZWNrKHZlcmlmaWVkLCBNYXRjaC5PcHRpb25hbChCb29sZWFuKSk7XG5cbiAgaWYgKF8uaXNVbmRlZmluZWQodmVyaWZpZWQpKSB7XG4gICAgdmVyaWZpZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgaWYgKCF1c2VyKVxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlVzZXIgbm90IGZvdW5kXCIpO1xuXG4gIC8vIEFsbG93IHVzZXJzIHRvIGNoYW5nZSB0aGVpciBvd24gZW1haWwgdG8gYSB2ZXJzaW9uIHdpdGggYSBkaWZmZXJlbnQgY2FzZVxuXG4gIC8vIFdlIGRvbid0IGhhdmUgdG8gY2FsbCBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMgdG8gZG8gYSBjYXNlXG4gIC8vIGluc2Vuc2l0aXZlIGNoZWNrIGFjcm9zcyBhbGwgZW1haWxzIGluIHRoZSBkYXRhYmFzZSBoZXJlIGJlY2F1c2U6ICgxKSBpZlxuICAvLyB0aGVyZSBpcyBubyBjYXNlLWluc2Vuc2l0aXZlIGR1cGxpY2F0ZSBiZXR3ZWVuIHRoaXMgdXNlciBhbmQgb3RoZXIgdXNlcnMsXG4gIC8vIHRoZW4gd2UgYXJlIE9LIGFuZCAoMikgaWYgdGhpcyB3b3VsZCBjcmVhdGUgYSBjb25mbGljdCB3aXRoIG90aGVyIHVzZXJzXG4gIC8vIHRoZW4gdGhlcmUgd291bGQgYWxyZWFkeSBiZSBhIGNhc2UtaW5zZW5zaXRpdmUgZHVwbGljYXRlIGFuZCB3ZSBjYW4ndCBmaXhcbiAgLy8gdGhhdCBpbiB0aGlzIGNvZGUgYW55d2F5LlxuICB2YXIgY2FzZUluc2Vuc2l0aXZlUmVnRXhwID1cbiAgICBuZXcgUmVnRXhwKCdeJyArIE1ldGVvci5fZXNjYXBlUmVnRXhwKG5ld0VtYWlsKSArICckJywgJ2knKTtcblxuICB2YXIgZGlkVXBkYXRlT3duRW1haWwgPSBfLmFueSh1c2VyLmVtYWlscywgZnVuY3Rpb24oZW1haWwsIGluZGV4KSB7XG4gICAgaWYgKGNhc2VJbnNlbnNpdGl2ZVJlZ0V4cC50ZXN0KGVtYWlsLmFkZHJlc3MpKSB7XG4gICAgICBNZXRlb3IudXNlcnMudXBkYXRlKHtcbiAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgJ2VtYWlscy5hZGRyZXNzJzogZW1haWwuYWRkcmVzc1xuICAgICAgfSwgeyRzZXQ6IHtcbiAgICAgICAgJ2VtYWlscy4kLmFkZHJlc3MnOiBuZXdFbWFpbCxcbiAgICAgICAgJ2VtYWlscy4kLnZlcmlmaWVkJzogdmVyaWZpZWRcbiAgICAgIH19KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG5cbiAgLy8gSW4gdGhlIG90aGVyIHVwZGF0ZXMgYmVsb3csIHdlIGhhdmUgdG8gZG8gYW5vdGhlciBjYWxsIHRvXG4gIC8vIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyB0byBtYWtlIHN1cmUgdGhhdCBubyBjb25mbGljdGluZyB2YWx1ZXNcbiAgLy8gd2VyZSBhZGRlZCB0byB0aGUgZGF0YWJhc2UgaW4gdGhlIG1lYW50aW1lLiBXZSBkb24ndCBoYXZlIHRvIGRvIHRoaXMgZm9yXG4gIC8vIHRoZSBjYXNlIHdoZXJlIHRoZSB1c2VyIGlzIHVwZGF0aW5nIHRoZWlyIGVtYWlsIGFkZHJlc3MgdG8gb25lIHRoYXQgaXMgdGhlXG4gIC8vIHNhbWUgYXMgYmVmb3JlLCBidXQgb25seSBkaWZmZXJlbnQgYmVjYXVzZSBvZiBjYXBpdGFsaXphdGlvbi4gUmVhZCB0aGVcbiAgLy8gYmlnIGNvbW1lbnQgYWJvdmUgdG8gdW5kZXJzdGFuZCB3aHkuXG5cbiAgaWYgKGRpZFVwZGF0ZU93bkVtYWlsKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gUGVyZm9ybSBhIGNhc2UgaW5zZW5zaXRpdmUgY2hlY2sgZm9yIGR1cGxpY2F0ZXMgYmVmb3JlIHVwZGF0ZVxuICBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMoJ2VtYWlscy5hZGRyZXNzJywgJ0VtYWlsJywgbmV3RW1haWwsIHVzZXIuX2lkKTtcblxuICBNZXRlb3IudXNlcnMudXBkYXRlKHtcbiAgICBfaWQ6IHVzZXIuX2lkXG4gIH0sIHtcbiAgICAkYWRkVG9TZXQ6IHtcbiAgICAgIGVtYWlsczoge1xuICAgICAgICBhZGRyZXNzOiBuZXdFbWFpbCxcbiAgICAgICAgdmVyaWZpZWQ6IHZlcmlmaWVkXG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBQZXJmb3JtIGFub3RoZXIgY2hlY2sgYWZ0ZXIgdXBkYXRlLCBpbiBjYXNlIGEgbWF0Y2hpbmcgdXNlciBoYXMgYmVlblxuICAvLyBpbnNlcnRlZCBpbiB0aGUgbWVhbnRpbWVcbiAgdHJ5IHtcbiAgICBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMoJ2VtYWlscy5hZGRyZXNzJywgJ0VtYWlsJywgbmV3RW1haWwsIHVzZXIuX2lkKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICAvLyBVbmRvIHVwZGF0ZSBpZiB0aGUgY2hlY2sgZmFpbHNcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSxcbiAgICAgIHskcHVsbDoge2VtYWlsczoge2FkZHJlc3M6IG5ld0VtYWlsfX19KTtcbiAgICB0aHJvdyBleDtcbiAgfVxufVxuXG4vKipcbiAqIEBzdW1tYXJ5IFJlbW92ZSBhbiBlbWFpbCBhZGRyZXNzIGZvciBhIHVzZXIuIFVzZSB0aGlzIGluc3RlYWQgb2YgdXBkYXRpbmdcbiAqIHRoZSBkYXRhYmFzZSBkaXJlY3RseS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbCBUaGUgZW1haWwgYWRkcmVzcyB0byByZW1vdmUuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5yZW1vdmVFbWFpbCA9IGZ1bmN0aW9uICh1c2VySWQsIGVtYWlsKSB7XG4gIGNoZWNrKHVzZXJJZCwgTm9uRW1wdHlTdHJpbmcpO1xuICBjaGVjayhlbWFpbCwgTm9uRW1wdHlTdHJpbmcpO1xuXG4gIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgaWYgKCF1c2VyKVxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlVzZXIgbm90IGZvdW5kXCIpO1xuXG4gIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LFxuICAgIHskcHVsbDoge2VtYWlsczoge2FkZHJlc3M6IGVtYWlsfX19KTtcbn1cblxuLy8vXG4vLy8gQ1JFQVRJTkcgVVNFUlNcbi8vL1xuXG4vLyBTaGFyZWQgY3JlYXRlVXNlciBmdW5jdGlvbiBjYWxsZWQgZnJvbSB0aGUgY3JlYXRlVXNlciBtZXRob2QsIGJvdGhcbi8vIGlmIG9yaWdpbmF0ZXMgaW4gY2xpZW50IG9yIHNlcnZlciBjb2RlLiBDYWxscyB1c2VyIHByb3ZpZGVkIGhvb2tzLFxuLy8gZG9lcyB0aGUgYWN0dWFsIHVzZXIgaW5zZXJ0aW9uLlxuLy9cbi8vIHJldHVybnMgdGhlIHVzZXIgaWRcbnZhciBjcmVhdGVVc2VyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgLy8gVW5rbm93biBrZXlzIGFsbG93ZWQsIGJlY2F1c2UgYSBvbkNyZWF0ZVVzZXJIb29rIGNhbiB0YWtlIGFyYml0cmFyeVxuICAvLyBvcHRpb25zLlxuICBjaGVjayhvcHRpb25zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuICAgIHVzZXJuYW1lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgIGVtYWlsOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgIHBhc3N3b3JkOiBNYXRjaC5PcHRpb25hbChwYXNzd29yZFZhbGlkYXRvcilcbiAgfSkpO1xuXG4gIHZhciB1c2VybmFtZSA9IG9wdGlvbnMudXNlcm5hbWU7XG4gIHZhciBlbWFpbCA9IG9wdGlvbnMuZW1haWw7XG4gIGlmICghdXNlcm5hbWUgJiYgIWVtYWlsKVxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIk5lZWQgdG8gc2V0IGEgdXNlcm5hbWUgb3IgZW1haWxcIik7XG5cbiAgdmFyIHVzZXIgPSB7c2VydmljZXM6IHt9fTtcbiAgaWYgKG9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICB2YXIgaGFzaGVkID0gaGFzaFBhc3N3b3JkKG9wdGlvbnMucGFzc3dvcmQpO1xuICAgIHVzZXIuc2VydmljZXMucGFzc3dvcmQgPSB7IGJjcnlwdDogaGFzaGVkIH07XG4gIH1cblxuICBpZiAodXNlcm5hbWUpXG4gICAgdXNlci51c2VybmFtZSA9IHVzZXJuYW1lO1xuICBpZiAoZW1haWwpXG4gICAgdXNlci5lbWFpbHMgPSBbe2FkZHJlc3M6IGVtYWlsLCB2ZXJpZmllZDogZmFsc2V9XTtcblxuICAvLyBQZXJmb3JtIGEgY2FzZSBpbnNlbnNpdGl2ZSBjaGVjayBiZWZvcmUgaW5zZXJ0XG4gIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLCAnVXNlcm5hbWUnLCB1c2VybmFtZSk7XG4gIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLCAnRW1haWwnLCBlbWFpbCk7XG5cbiAgdmFyIHVzZXJJZCA9IEFjY291bnRzLmluc2VydFVzZXJEb2Mob3B0aW9ucywgdXNlcik7XG4gIC8vIFBlcmZvcm0gYW5vdGhlciBjaGVjayBhZnRlciBpbnNlcnQsIGluIGNhc2UgYSBtYXRjaGluZyB1c2VyIGhhcyBiZWVuXG4gIC8vIGluc2VydGVkIGluIHRoZSBtZWFudGltZVxuICB0cnkge1xuICAgIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLCAnVXNlcm5hbWUnLCB1c2VybmFtZSwgdXNlcklkKTtcbiAgICBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMoJ2VtYWlscy5hZGRyZXNzJywgJ0VtYWlsJywgZW1haWwsIHVzZXJJZCk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgLy8gUmVtb3ZlIGluc2VydGVkIHVzZXIgaWYgdGhlIGNoZWNrIGZhaWxzXG4gICAgTWV0ZW9yLnVzZXJzLnJlbW92ZSh1c2VySWQpO1xuICAgIHRocm93IGV4O1xuICB9XG4gIHJldHVybiB1c2VySWQ7XG59O1xuXG4vLyBtZXRob2QgZm9yIGNyZWF0ZSB1c2VyLiBSZXF1ZXN0cyBjb21lIGZyb20gdGhlIGNsaWVudC5cbk1ldGVvci5tZXRob2RzKHtjcmVhdGVVc2VyOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiBBY2NvdW50cy5fbG9naW5NZXRob2QoXG4gICAgc2VsZixcbiAgICBcImNyZWF0ZVVzZXJcIixcbiAgICBhcmd1bWVudHMsXG4gICAgXCJwYXNzd29yZFwiLFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGNyZWF0ZVVzZXIoKSBhYm92ZSBkb2VzIG1vcmUgY2hlY2tpbmcuXG4gICAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgICAgaWYgKEFjY291bnRzLl9vcHRpb25zLmZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiU2lnbnVwcyBmb3JiaWRkZW5cIilcbiAgICAgICAgfTtcblxuICAgICAgLy8gQ3JlYXRlIHVzZXIuIHJlc3VsdCBjb250YWlucyBpZCBhbmQgdG9rZW4uXG4gICAgICB2YXIgdXNlcklkID0gY3JlYXRlVXNlcihvcHRpb25zKTtcbiAgICAgIC8vIHNhZmV0eSBiZWx0LiBjcmVhdGVVc2VyIGlzIHN1cHBvc2VkIHRvIHRocm93IG9uIGVycm9yLiBzZW5kIDUwMCBlcnJvclxuICAgICAgLy8gaW5zdGVhZCBvZiBzZW5kaW5nIGEgdmVyaWZpY2F0aW9uIGVtYWlsIHdpdGggZW1wdHkgdXNlcmlkLlxuICAgICAgaWYgKCEgdXNlcklkKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjcmVhdGVVc2VyIGZhaWxlZCB0byBpbnNlcnQgbmV3IHVzZXJcIik7XG5cbiAgICAgIC8vIElmIGBBY2NvdW50cy5fb3B0aW9ucy5zZW5kVmVyaWZpY2F0aW9uRW1haWxgIGlzIHNldCwgcmVnaXN0ZXJcbiAgICAgIC8vIGEgdG9rZW4gdG8gdmVyaWZ5IHRoZSB1c2VyJ3MgcHJpbWFyeSBlbWFpbCwgYW5kIHNlbmQgaXQgdG9cbiAgICAgIC8vIHRoYXQgYWRkcmVzcy5cbiAgICAgIGlmIChvcHRpb25zLmVtYWlsICYmIEFjY291bnRzLl9vcHRpb25zLnNlbmRWZXJpZmljYXRpb25FbWFpbClcbiAgICAgICAgQWNjb3VudHMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKHVzZXJJZCwgb3B0aW9ucy5lbWFpbCk7XG5cbiAgICAgIC8vIGNsaWVudCBnZXRzIGxvZ2dlZCBpbiBhcyB0aGUgbmV3IHVzZXIgYWZ0ZXJ3YXJkcy5cbiAgICAgIHJldHVybiB7dXNlcklkOiB1c2VySWR9O1xuICAgIH1cbiAgKTtcbn19KTtcblxuLy8gQ3JlYXRlIHVzZXIgZGlyZWN0bHkgb24gdGhlIHNlcnZlci5cbi8vXG4vLyBVbmxpa2UgdGhlIGNsaWVudCB2ZXJzaW9uLCB0aGlzIGRvZXMgbm90IGxvZyB5b3UgaW4gYXMgdGhpcyB1c2VyXG4vLyBhZnRlciBjcmVhdGlvbi5cbi8vXG4vLyByZXR1cm5zIHVzZXJJZCBvciB0aHJvd3MgYW4gZXJyb3IgaWYgaXQgY2FuJ3QgY3JlYXRlXG4vL1xuLy8gWFhYIGFkZCBhbm90aGVyIGFyZ3VtZW50IChcInNlcnZlciBvcHRpb25zXCIpIHRoYXQgZ2V0cyBzZW50IHRvIG9uQ3JlYXRlVXNlcixcbi8vIHdoaWNoIGlzIGFsd2F5cyBlbXB0eSB3aGVuIGNhbGxlZCBmcm9tIHRoZSBjcmVhdGVVc2VyIG1ldGhvZD8gZWcsIFwiYWRtaW46XG4vLyB0cnVlXCIsIHdoaWNoIHdlIHdhbnQgdG8gcHJldmVudCB0aGUgY2xpZW50IGZyb20gc2V0dGluZywgYnV0IHdoaWNoIGEgY3VzdG9tXG4vLyBtZXRob2QgY2FsbGluZyBBY2NvdW50cy5jcmVhdGVVc2VyIGNvdWxkIHNldD9cbi8vXG5BY2NvdW50cy5jcmVhdGVVc2VyID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpO1xuXG4gIC8vIFhYWCBhbGxvdyBhbiBvcHRpb25hbCBjYWxsYmFjaz9cbiAgaWYgKGNhbGxiYWNrKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQWNjb3VudHMuY3JlYXRlVXNlciB3aXRoIGNhbGxiYWNrIG5vdCBzdXBwb3J0ZWQgb24gdGhlIHNlcnZlciB5ZXQuXCIpO1xuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZVVzZXIob3B0aW9ucyk7XG59O1xuXG4vLy9cbi8vLyBQQVNTV09SRC1TUEVDSUZJQyBJTkRFWEVTIE9OIFVTRVJTXG4vLy9cbk1ldGVvci51c2Vycy5fZW5zdXJlSW5kZXgoJ3NlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucy50b2tlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHt1bmlxdWU6IDEsIHNwYXJzZTogMX0pO1xuTWV0ZW9yLnVzZXJzLl9lbnN1cmVJbmRleCgnc2VydmljZXMucGFzc3dvcmQucmVzZXQudG9rZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dW5pcXVlOiAxLCBzcGFyc2U6IDF9KTtcbiJdfQ==

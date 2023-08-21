(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var AccountsPatchUi = Package['brettle:accounts-patch-ui'].AccountsPatchUi;
var LoginState = Package['brettle:accounts-login-state'].LoginState;

/* Package-scope variables */
var AccountsGuest, Moniker, res, GuestUsers, guestname, guest;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/artwells_accounts-guest/packages/artwells_accounts-guest.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/artwells:accounts-guest/accounts-guest.js                                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
AccountsGuest = {};                                                                                             // 1
if (typeof AccountsGuest.forced === "undefined") {                                                              // 2
	AccountsGuest.forced = true; /*default to making loginVisitor automatic, and on logout*/                       // 3
}                                                                                                               // 4
if (typeof AccountsGuest.enabled === "undefined") {                                                             // 5
	AccountsGuest.enabled = true; /* on 'false'  Meteor.loginVisitor() will fail */                                // 6
}                                                                                                               // 7
if (typeof AccountsGuest.name === "undefined") {                                                                // 8
  AccountsGuest.name = false; /* defaults to returning "null" for user's name */                                // 9
}                                                                                                               // 10
if (typeof AccountsGuest.anonymous === "undefined") {                                                           // 11
	AccountsGuest.anonymous = false; /* defaults to using guests with randomly generated usernames/emails */       // 12
}                                                                                                               // 13
                                                                                                                // 14
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/artwells:accounts-guest/accounts-guest-server.js                                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Moniker = Npm.require('moniker');                                                                               // 1
                                                                                                                // 2
Accounts.removeOldGuests = function (before) {                                                                  // 3
    if (typeof before === 'undefined') {                                                                        // 4
        before = new Date();                                                                                    // 5
        before.setHours(before.getHours() - 1);                                                                 // 6
    }                                                                                                           // 7
    res = Meteor.users.remove({createdAt: {$lte: before}, 'profile.guest': true});                              // 8
    return res;                                                                                                 // 9
};                                                                                                              // 10
Accounts.registerLoginHandler("guest", function (options) {                                                     // 11
    if (AccountsGuest.enabled === false || !options || !options.createGuest || Meteor.userId())                 // 12
        return undefined;                                                                                       // 13
                                                                                                                // 14
    var newUserId = null;                                                                                       // 15
                                                                                                                // 16
    if (AccountsGuest.anonymous) {                                                                              // 17
        if (options.email) {                                                                                    // 18
            throw new Error("Can't create a guest user with an email with AccountsGuest.anonymous == true.\n"); // 19
        }                                                                                                       // 20
        newUserId = Accounts.insertUserDoc(options, {profile: {guest: true}});                                  // 21
    } else if (!Accounts.createUser) {                                                                          // 22
        throw new Error("Can't create a guest user with falsey AccountsGuest.anonymous unless the accounts-password package is installed.\n" +
            "Either set AccountsGuest.anonymous or run 'meteor add accounts-password'.");                       // 24
    } else {                                                                                                    // 25
        var guestOptions = createGuestOptions(options.email);                                                   // 26
                                                                                                                // 27
        newUserId = Accounts.createUser(guestOptions);                                                          // 28
    }                                                                                                           // 29
    return {                                                                                                    // 30
        userId: newUserId                                                                                       // 31
    };                                                                                                          // 32
});                                                                                                             // 33
                                                                                                                // 34
                                                                                                                // 35
LoginState.addSignedUpInterceptor(function (user) {                                                             // 36
    if (user.profile && user.profile.guest && AccountsGuest.name === false) {                                   // 37
      user.loginStateSignedUp = false;                                                                          // 38
    }                                                                                                           // 39
});                                                                                                             // 40
                                                                                                                // 41
/**                                                                                                             // 42
 *  set profile.guest to false when guest adds a service                                                        // 43
 *                                                                                                              // 44
 */                                                                                                             // 45
var bamPkg = Package['brettle:accounts-multiple'];                                                              // 46
if (bamPkg) {                                                                                                   // 47
    bamPkg.AccountsMultiple.register({                                                                          // 48
        // brettle:accounts-add-service will cause onSwitchFailure to be called                                 // 49
        // when a service is added.                                                                             // 50
        // The new service will have been added to the attempting user.                                         // 51
        // In that case, we want to update profile.guest.                                                       // 52
        onSwitchFailure: function (attemptingUser, attempt) {                                                   // 53
            if (attemptingUser.profile && attemptingUser.profile.guest) {                                       // 54
                // Hide profile.guest so it doesn't effect LoginState.signedUp()                                // 55
                delete attemptingUser.profile.guest;                                                            // 56
                var signedUp = LoginState.signedUp(attemptingUser);                                             // 57
                                                                                                                // 58
                attemptingUser.profile.guest = (! signedUp);                                                    // 59
                Meteor.users.update(attemptingUser._id, {                                                       // 60
                    $set: {                                                                                     // 61
                        "profile.guest": attemptingUser.profile.guest                                           // 62
                    }                                                                                           // 63
                });                                                                                             // 64
            }                                                                                                   // 65
        }                                                                                                       // 66
    });                                                                                                         // 67
}                                                                                                               // 68
/**                                                                                                             // 69
 *  set profile.guest: drop guest user when visitor logs in as another user                                     // 70
 *                                                                                                              // 71
 */                                                                                                             // 72
GuestUsers = new Mongo.Collection('guestUsers');                                                                // 73
Accounts.onLogin(function(par){                                                                                 // 74
    if(par.user && par.user.username !== undefined && par.user.username.indexOf('guest') !== -1){               // 75
        if(!GuestUsers.findOne({connection_id: par.connection.id})){                                            // 76
            GuestUsers.insert({connection_id: par.connection.id, user_id: par.user._id});                       // 77
        }                                                                                                       // 78
    }                                                                                                           // 79
    else if(par.type !== 'resume'){                                                                             // 80
        var guest = GuestUsers.findOne({connection_id: par.connection.id});                                     // 81
        if (guest) {                                                                                            // 82
            Meteor.users.remove(guest.user_id);                                                                 // 83
            GuestUsers.remove(guest._id);                                                                       // 84
        }                                                                                                       // 85
    }                                                                                                           // 86
});                                                                                                             // 87
                                                                                                                // 88
/* adapted from pull-request https://github.com/dcsan                                                           // 89
* See https://github.com/artwells/meteor-accounts-guest/commit/28cbbf0eca2d80f78925ac619abf53d0769c0d9d         // 90
*/                                                                                                              // 91
Meteor.methods({                                                                                                // 92
    createGuest: function (email)                                                                               // 93
    {                                                                                                           // 94
        var guest = createGuestOptions(email);                                                                  // 95
        Accounts.createUser(guest);                                                                             // 96
        //    console.log("createGuest" + guestname);                                                           // 97
        return guest;                                                                                           // 98
    }                                                                                                           // 99
});                                                                                                             // 100
                                                                                                                // 101
                                                                                                                // 102
function createGuestOptions(email) {                                                                            // 103
        check(email, Match.OneOf(String, null, undefined));                                                     // 104
                                                                                                                // 105
        /* if explicitly disabled, happily do nothing */                                                        // 106
        if (AccountsGuest.enabled === false){                                                                   // 107
            return true;                                                                                        // 108
        }                                                                                                       // 109
                                                                                                                // 110
        //    count = Meteor.users.find().count() + 1                                                           // 111
        if (AccountsGuest.name === true) {                                                                      // 112
          guestname = Moniker.choose();                                                                         // 113
          // Just in case, let's make sure this name isn't taken                                                // 114
          while (Meteor.users.find({username:guestname}).count() > 0) {                                         // 115
            guestname = Moniker.choose();                                                                       // 116
          }                                                                                                     // 117
        } else {                                                                                                // 118
          guestname = "guest-#" + Random.id();                                                                  // 119
        }                                                                                                       // 120
                                                                                                                // 121
        if (!email) {                                                                                           // 122
            email = guestname + "@example.com";                                                                 // 123
        }                                                                                                       // 124
                                                                                                                // 125
        guest = {                                                                                               // 126
            username: guestname,                                                                                // 127
            email: email,                                                                                       // 128
            profile: {guest: true},                                                                             // 129
            password: Meteor.uuid(),                                                                            // 130
        };                                                                                                      // 131
        return guest;                                                                                           // 132
}                                                                                                               // 133
                                                                                                                // 134
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("artwells:accounts-guest", {
  AccountsGuest: AccountsGuest
});

})();

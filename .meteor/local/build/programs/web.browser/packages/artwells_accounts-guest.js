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
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var AccountsPatchUi = Package['brettle:accounts-patch-ui'].AccountsPatchUi;
var LoginState = Package['brettle:accounts-login-state'].LoginState;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var AccountsGuest;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/artwells_accounts-guest/packages/artwells_accounts-guest.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/artwells:accounts-guest/accounts-guest.js                                                     //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
AccountsGuest = {};                                                                                       // 1
if (typeof AccountsGuest.forced === "undefined") {                                                        // 2
	AccountsGuest.forced = true; /*default to making loginVisitor automatic, and on logout*/                 // 3
}                                                                                                         // 4
if (typeof AccountsGuest.enabled === "undefined") {                                                       // 5
	AccountsGuest.enabled = true; /* on 'false'  Meteor.loginVisitor() will fail */                          // 6
}                                                                                                         // 7
if (typeof AccountsGuest.name === "undefined") {                                                          // 8
  AccountsGuest.name = false; /* defaults to returning "null" for user's name */                          // 9
}                                                                                                         // 10
if (typeof AccountsGuest.anonymous === "undefined") {                                                     // 11
	AccountsGuest.anonymous = false; /* defaults to using guests with randomly generated usernames/emails */ // 12
}                                                                                                         // 13
                                                                                                          // 14
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/artwells:accounts-guest/accounts-guest-client.js                                              //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
/*****************                                                                                        // 1
 * special anonymous behavior so that visitors can                                                        // 2
 * manipulate their work                                                                                  // 3
 *                                                                                                        // 4
 */                                                                                                       // 5
                                                                                                          // 6
Meteor.loginVisitor = function (email, callback) {                                                        // 7
    if (!Meteor.userId()) {                                                                               // 8
        Accounts.callLoginMethod({                                                                        // 9
            methodArguments: [{                                                                           // 10
                email: email,                                                                             // 11
                createGuest: true                                                                         // 12
            }],                                                                                           // 13
            userCallback: function (error, result) {                                                      // 14
                if(error) {                                                                               // 15
                    callback && callback(error);                                                          // 16
                } else {                                                                                  // 17
                    callback && callback();                                                               // 18
                }                                                                                         // 19
            }                                                                                             // 20
        });                                                                                               // 21
    }                                                                                                     // 22
}                                                                                                         // 23
                                                                                                          // 24
//no non-logged in users                                                                                  // 25
/* you might need to limit this to avoid flooding the user db */                                          // 26
Meteor.startup(function(){                                                                                // 27
    Deps.autorun(function () {                                                                            // 28
        if (!Meteor.userId()) {                                                                           // 29
            if (AccountsGuest.forced === true) {                                                          // 30
                Meteor.loginVisitor();                                                                    // 31
            }                                                                                             // 32
        }                                                                                                 // 33
    });                                                                                                   // 34
});                                                                                                       // 35
                                                                                                          // 36
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("artwells:accounts-guest", {
  AccountsGuest: AccountsGuest
});

})();

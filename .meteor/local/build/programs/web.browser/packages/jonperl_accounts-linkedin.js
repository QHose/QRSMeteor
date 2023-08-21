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
var LinkedIn = Package['jonperl:linkedin'].LinkedIn;
var Linkedin = Package['jonperl:linkedin'].Linkedin;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jonperl_accounts-linkedin/packages/jonperl_accounts-linkedin.js                                      //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/jonperl:accounts-linkedin/linkedin.js                                                          //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
Accounts.oauth.registerService('linkedin');                                                                // 1
                                                                                                           // 2
if (Meteor.isClient) {                                                                                     // 3
    Meteor.loginWithLinkedin = function(options, callback) {                                               // 4
        // support a callback without options                                                              // 5
        if (!callback && typeof options === "function") {                                                  // 6
            callback = options;                                                                            // 7
            options = null;                                                                                // 8
        }                                                                                                  // 9
                                                                                                           // 10
        var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback); // 11
        LinkedIn.requestCredential(options, credentialRequestCompleteCallback);                            // 12
    };                                                                                                     // 13
} else {                                                                                                   // 14
    Accounts.addAutopublishFields({                                                                        // 15
        // publish all fields including access token, which can legitimately be used                       // 16
        // from the client (if transmitted over ssl or on localhost).                                      // 17
        // https://developer.linkedin.com/documents/authentication                                         // 18
        forLoggedInUser: ['services.linkedin'],                                                            // 19
        forOtherUsers: [                                                                                   // 20
            'services.linkedin.id', 'services.linkedin.firstName', 'services.linkedin.lastName'            // 21
        ]                                                                                                  // 22
    });                                                                                                    // 23
}                                                                                                          // 24
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("jonperl:accounts-linkedin");

})();

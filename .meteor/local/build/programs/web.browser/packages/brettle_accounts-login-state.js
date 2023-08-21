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
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;

/* Package-scope variables */
var LoginState;

(function(){

////////////////////////////////////////////////////////////////////////////
//                                                                        //
// packages/brettle_accounts-login-state/accounts-login-state-client.js   //
//                                                                        //
////////////////////////////////////////////////////////////////////////////
                                                                          //
"use strict";
/* globals LoginState: true, Hook */

function LoginStateConstructor() {
  var self = this;
  self._loggedIn = new ReactiveVar();
  Tracker.autorun(function () {
    self._loggedIn.set(!! Meteor.userId());
  });
  self._signedUp = new ReactiveVar();
  Tracker.autorun(function () {
    // If the user is not logged in then they can't be signed in. Period.
    if (!self.loggedIn()) {
      self._signedUp.set(false);
      return;
    }
    var user = Meteor.user();
    if (!user || user.loginStateSignedUp === undefined) {
      self._signedUp.set(false);
      return;
    }
    self._signedUp.set(user.loginStateSignedUp);
  });
}

LoginStateConstructor.prototype.loggedIn = function () {
  return this._loggedIn.get();
};

LoginStateConstructor.prototype.signedUp = function () {
  return this._signedUp.get();
};

LoginState = new LoginStateConstructor();

////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("brettle:accounts-login-state", {
  LoginState: LoginState
});

})();

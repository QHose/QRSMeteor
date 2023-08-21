(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var Router = Package['iron:router'].Router;
var RouteController = Package['iron:router'].RouteController;
var _ = Package.underscore._;
var AccountsTemplates = Package['useraccounts:core'].AccountsTemplates;
var Iron = Package['iron:core'].Iron;
var Accounts = Package['accounts-base'].Accounts;
var T9n = Package['softwarerero:accounts-t9n'].T9n;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/useraccounts_iron-routing/lib/core.js                                                              //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
/* global
  AccountsTemplates: false
*/
'use strict';

// ---------------------------------------------------------------------------------

// Patterns for methods" parameters

// ---------------------------------------------------------------------------------

// Route configuration pattern to be checked with check
var ROUTE_PAT = {
  name: Match.Optional(String),
  path: Match.Optional(String),
  template: Match.Optional(String),
  layoutTemplate: Match.Optional(String),
  redirect: Match.Optional(Match.OneOf(String, Match.Where(_.isFunction))),
};

/*
  Routes configuration can be done by calling AccountsTemplates.configureRoute with the route name and the
  following options in a separate object. E.g. AccountsTemplates.configureRoute("gingIn", option);
    name:           String (optional). A unique route"s name to be passed to iron-router
    path:           String (optional). A unique route"s path to be passed to iron-router
    template:       String (optional). The name of the template to be rendered
    layoutTemplate: String (optional). The name of the layout to be used
    redirect:       String (optional). The name of the route (or its path) where to redirect after form submit
*/


// Allowed routes along with theirs default configuration values
AccountsTemplates.ROUTE_DEFAULT = {
  changePwd:      { name: "atChangePwd",      path: "/change-password"},
  enrollAccount:  { name: "atEnrollAccount",  path: "/enroll-account"},
  ensureSignedIn: { name: "atEnsureSignedIn", path: null},
  forgotPwd:      { name: "atForgotPwd",      path: "/forgot-password"},
  resetPwd:       { name: "atResetPwd",       path: "/reset-password"},
  signIn:         { name: "atSignIn",         path: "/sign-in"},
  signUp:         { name: "atSignUp",         path: "/sign-up"},
  verifyEmail:    { name: "atVerifyEmail",    path: "/verify-email"},
  resendVerificationEmail: { name: "atResendVerificationEmail", path: "/send-again"},
};


// Current configuration values
// Redirects
AccountsTemplates.options.homeRoutePath = "/";
AccountsTemplates.options.redirectTimeout = 2000; // 2 seconds

// Known routes used to filter out previous path for redirects...
AccountsTemplates.knownRoutes = [];

// Configured routes
AccountsTemplates.routes = {};

AccountsTemplates.configureRoute = function(route, options) {
  check(route, String);
  check(options, Match.OneOf(undefined, Match.ObjectIncluding(ROUTE_PAT)));
  options = _.clone(options);
  // Route Configuration can be done only before initialization
  if (this._initialized) {
    throw new Error("Route Configuration can be done only before AccountsTemplates.init!");
  }
  // Only allowed routes can be configured
  if (!(route in this.ROUTE_DEFAULT)) {
    throw new Error("Unknown Route!");
  }
  // Allow route configuration only once
  if (route in this.routes) {
    throw new Error("Route already configured!");
  }

  // Possibly adds a initial / to the provided path
  if (options && options.path && options.path[0] !== "/") {
    options.path = "/" + options.path;
  }
  // Updates the current configuration
  options = _.defaults(options || {}, this.ROUTE_DEFAULT[route]);

  this.routes[route] = options;
  // Known routes are used to filter out previous path for redirects...
  AccountsTemplates.knownRoutes.push(options.path);

  if (Meteor.isServer){
    // Configures "reset password" email link
    if (route === "resetPwd"){
      var resetPwdPath = options.path.substr(1);
      Accounts.urls.resetPassword = function(token){
        return Meteor.absoluteUrl(resetPwdPath + "/" + token);
      };
    }
    // Configures "enroll account" email link
    if (route === "enrollAccount"){
      var enrollAccountPath = options.path.substr(1);
      Accounts.urls.enrollAccount = function(token){
        return Meteor.absoluteUrl(enrollAccountPath + "/" + token);
      };
    }
    // Configures "verify email" email link
    if (route === "verifyEmail"){
      var verifyEmailPath = options.path.substr(1);
      Accounts.urls.verifyEmail = function(token){
        return Meteor.absoluteUrl(verifyEmailPath + "/" + token);
      };
    }
  }

  if (route === "ensureSignedIn") {
    return;
  }
  if (route === "changePwd" && !AccountsTemplates.options.enablePasswordChange) {
    throw new Error("changePwd route configured but enablePasswordChange set to false!");
  }
  if (route === "forgotPwd" && !AccountsTemplates.options.showForgotPasswordLink) {
    throw new Error("forgotPwd route configured but showForgotPasswordLink set to false!");
  }
  if (route === "signUp" && AccountsTemplates.options.forbidClientAccountCreation) {
    throw new Error("signUp route configured but forbidClientAccountCreation set to true!");
  }

  // Determines the default layout to be used in case no specific one is specified for single routes
  var defaultLayout = AccountsTemplates.options.defaultLayout || Router.options.layoutTemplate;

  var name = options.name; // Default provided...
  var path = options.path; // Default provided...
  var template = options.template || "fullPageAtForm";
  var layoutTemplate = options.layoutTemplate || defaultLayout;
  var additionalOptions = _.omit(options, [
    "layoutTemplate", "name", "path", "redirect", "template"
  ]);

  // Possibly adds token parameter
  if (_.contains(["enrollAccount", "resetPwd", "verifyEmail"], route)){
    path += "/:paramToken";
    if (route === "verifyEmail") {
      Router.route(path, _.extend(additionalOptions, {
        name: name,
        template: template,
        layoutTemplate: layoutTemplate,
        onRun: function() {
          AccountsTemplates.setState(route);
          AccountsTemplates.setDisabled(true);
          var token = this.params.paramToken;
          Accounts.verifyEmail(token, function(error){
            AccountsTemplates.setDisabled(false);
            AccountsTemplates.submitCallback(error, route, function(){
              AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.emailVerified);
            });
          });

          this.next();
        },
        onStop: function() {
          AccountsTemplates.clearState();
        },
      }));
    }
    else {
      Router.route(path, _.extend(additionalOptions, {
        name: name,
        template: template,
        layoutTemplate: layoutTemplate,
        onBeforeAction: function() {
          AccountsTemplates.paramToken = this.params.paramToken;
          AccountsTemplates.setState(route);
          this.next();
        },
        onStop: function() {
          AccountsTemplates.clearState();
          AccountsTemplates.paramToken = null;
        }
      }));
    }
  }
  else {
    Router.route(path, _.extend(additionalOptions, {
      name: name,
      template: template,
      layoutTemplate: layoutTemplate,
      onBeforeAction: function() {
        var redirect = false;
        if (route === 'changePwd') {
          if (!Meteor.loggingIn() && !Meteor.userId()) {
            redirect = true;
          }
        }
        else if (Meteor.userId()) {
          redirect = true;
        }
        if (redirect) {
          AccountsTemplates.postSubmitRedirect(route);
          this.stop();
        }
        else {
          AccountsTemplates.setState(route);
          this.next();
        }
      },
      onStop: function() {
        AccountsTemplates.clearState();
      }
    }));
  }
};


AccountsTemplates.getRouteName = function(route) {
  if (route in this.routes) {
    return this.routes[route].name;
  }
  return null;
};

AccountsTemplates.getRoutePath = function(route) {
  if (route in this.routes) {
    return this.routes[route].path;
  }
  return "#";
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/useraccounts_iron-routing/lib/server.js                                                            //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
/* global
  Iron: false
*/
'use strict';


// Fake server-side IR plugin to allow for shared routing files
Iron.Router.plugins.ensureSignedIn = function (router, options) {};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("useraccounts:iron-routing");

})();

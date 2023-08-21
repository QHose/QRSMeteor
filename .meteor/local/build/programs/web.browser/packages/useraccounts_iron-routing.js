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
var check = Package.check.check;
var Match = Package.check.Match;
var Router = Package['iron:router'].Router;
var RouteController = Package['iron:router'].RouteController;
var _ = Package.underscore._;
var AccountsTemplates = Package['useraccounts:core'].AccountsTemplates;
var Iron = Package['iron:core'].Iron;
var Accounts = Package['accounts-base'].Accounts;
var T9n = Package['softwarerero:accounts-t9n'].T9n;
var Template = Package['templating-runtime'].Template;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_iron-routing/lib/core.js                                                                //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_iron-routing/lib/client.js                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/* global
  AccountsTemplates: false,
  grecaptcha: false,
  Iron: false,
  Router: false
*/
'use strict';


// Previous path used for redirect after form submit
AccountsTemplates._prevPath = null;

// Possibly keeps reference to the handle for the timed out redirect
// set on some routes
AccountsTemplates.timedOutRedirect = null;


AccountsTemplates.clearState = function() {
  _.each(this._fields, function(field){
    field.clearStatus();
  });
  var form = this.state.form;
  form.set('error', null);
  form.set('result', null);
  form.set('message', null);

  AccountsTemplates.setDisabled(false);

  // Possibly clears timed out redirects
  if (AccountsTemplates.timedOutRedirect !== null) {
    Meteor.clearTimeout(AccountsTemplates.timedOutRedirect);
    AccountsTemplates.timedOutRedirect = null;
  }
};

// Getter for previous route's path
AccountsTemplates.getPrevPath = function() {
    return this._prevPath;
};

// Setter for previous route's path
AccountsTemplates.setPrevPath = function(newPath) {
    check(newPath, String);
    this._prevPath = newPath;
};

var ensureSignedIn = function() {
  if (!Meteor.userId()) {
    Tracker.nonreactive(function () {
      AccountsTemplates.setPrevPath(Router.current().url);
    });
    AccountsTemplates.setState(AccountsTemplates.options.defaultState, function(){
      var err = AccountsTemplates.texts.errors.mustBeLoggedIn;
      AccountsTemplates.state.form.set('error', [err]);
    });
    AccountsTemplates.avoidRedirect = true;
    // render the login template but keep the url in the browser the same

    var options = AccountsTemplates.routes.ensureSignedIn;

    // Determines the template to be rendered in case no specific one was configured for ensureSignedIn
    var signInRouteTemplate = AccountsTemplates.routes.signIn && AccountsTemplates.routes.signIn.template;
    var template = (options && options.template) || signInRouteTemplate || 'fullPageAtForm';

    // Determines the layout to be used in case no specific one was configured for ensureSignedIn
    var defaultLayout = AccountsTemplates.options.defaultLayout || Router.options.layoutTemplate;
    var layoutTemplate = (options && options.layoutTemplate) || defaultLayout;

    this.layout(layoutTemplate);
    this.render(template);
    this.renderRegions();
  } else {
    AccountsTemplates.clearError();
    this.next();
  }
};

AccountsTemplates.ensureSignedIn = function() {
  console.warn(
    '[UserAccounts] AccountsTemplates.ensureSignedIn will be deprecated soon, please use the plugin version\n' +
    '               see https://github.com/meteor-useraccounts/core/blob/master/Guide.md#content-protection'
  );
  ensureSignedIn.call(this);
};


Iron.Router.plugins.ensureSignedIn = function (router, options) {
  // this loading plugin just creates an onBeforeAction hook
  router.onRun(function(){
    if (Meteor.loggingIn()) {
        this.renderRegions();
    } else {
        this.next();
    }
  }, options);

  router.onBeforeAction(
    ensureSignedIn,
    options
  );

  router.onStop(function(){
    AccountsTemplates.clearError();
  });
};



// Stores previous path on path change...
Router.onStop(function() {
  Tracker.nonreactive(function () {
    var currentPath = Router.current().url;
    var currentPathClean = currentPath.replace(/^\/+|\/+$/gm,'');
    var isKnownRoute = _.map(AccountsTemplates.knownRoutes, function(path){
      if (!path) {
        return false;
      }
      path = path.replace(/^\/+|\/+$/gm,'');
      var known = RegExp(path).test(currentPathClean);
      return known;
    });
    if (!_.some(isKnownRoute)) {
      AccountsTemplates.setPrevPath(currentPath);
    }
    AccountsTemplates.avoidRedirect = false;
  });
});


AccountsTemplates.linkClick = function(route){
  if (AccountsTemplates.disabled()) {
    return;
  }
  var path = AccountsTemplates.getRoutePath(route);
  if (path === '#' || AccountsTemplates.avoidRedirect ||
     (Router.current().route && path === Router.current().route.path())) {
    AccountsTemplates.setState(route);
  }
  else {
    Meteor.defer(function(){
      Router.go(path);
    });
  }

  var firstVisibleInput = _.find(this.getFields(), function(f){
    return _.contains(f.visible, route);
  });
  if (firstVisibleInput) {
    $('input#at-field-' + firstVisibleInput._id).focus();
  }
};

AccountsTemplates.logout = function(){
  var onLogoutHook = AccountsTemplates.options.onLogoutHook;
  var homeRoutePath = AccountsTemplates.options.homeRoutePath;
  Meteor.logout(function(){
    if (onLogoutHook) {
      onLogoutHook();
    }
    else if (homeRoutePath) {
      Router.go(homeRoutePath);
    }
  });
};

AccountsTemplates.postSubmitRedirect = function(route){
  if (AccountsTemplates.avoidRedirect) {
    AccountsTemplates.avoidRedirect = false;
  }
  else {
    var nextPath = AccountsTemplates.routes[route] && AccountsTemplates.routes[route].redirect;
    if (nextPath){
      if (_.isFunction(nextPath)) {
        nextPath();
      }
      else {
        Router.go(nextPath);
      }
    }else{
      var previousPath = AccountsTemplates.getPrevPath();
      if (previousPath && Router.current().route.path() !== previousPath) {
        Router.go(previousPath);
      }
      else{
        var homeRoutePath = AccountsTemplates.options.homeRoutePath;
        if (homeRoutePath) {
          Router.go(homeRoutePath);
        }
      }
    }
  }
};

AccountsTemplates.submitCallback = function(error, state, onSuccess){

  var onSubmitHook = AccountsTemplates.options.onSubmitHook;
  if(onSubmitHook) {
    onSubmitHook(error, state);
  }

  if (error) {
    if(_.isObject(error.details)) {
      // If error.details is an object, we may try to set fields errors from it
      _.each(error.details, function(error, fieldId){
          AccountsTemplates.getField(fieldId).setError(error);
      });
    }
    else {
      var err = 'error.accounts.Unknown error';
      if (error.reason) {
        err = error.reason;
      }
      if (err.substring(0, 15) !== 'error.accounts.') {
        err = 'error.accounts.' + err;
      }
      AccountsTemplates.state.form.set('error', [err]);
    }
    AccountsTemplates.setDisabled(false);
    // Possibly resets reCaptcha form
    if (state === 'signUp' && AccountsTemplates.options.showReCaptcha) {
      grecaptcha.reset();
    }
  }
  else{
    if (onSuccess) {
      onSuccess();
    }

    if (_.contains(['enrollAccount', 'forgotPwd', 'resetPwd', 'verifyEmail'], state)){
      var redirectTimeout = AccountsTemplates.options.redirectTimeout;
      if (redirectTimeout > 0) {
        AccountsTemplates.timedOutRedirect = Meteor.setTimeout(function(){
          AccountsTemplates.timedOutRedirect = null;
          AccountsTemplates.setDisabled(false);
          AccountsTemplates.postSubmitRedirect(state);
        }, redirectTimeout);
      }
    }
    else if (state){
      AccountsTemplates.setDisabled(false);
      AccountsTemplates.postSubmitRedirect(state);
    }
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_iron-routing/lib/templates_helpers/at_input.js                                          //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/* global
  AccountsTemplates: false,
  Router: false
*/
'use strict';

AccountsTemplates.atInputRendered.push(function(){
  var fieldId = this.data._id;
  var queryKey = this.data.options && this.data.options.queryKey || fieldId;
  var currentR = Router.current();
  var inputQueryVal = currentR && currentR.params && currentR.params.query && currentR.params.query[queryKey];
  if (inputQueryVal) {
    this.$("input#at-field-" + fieldId).val(inputQueryVal);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("useraccounts:iron-routing");

})();

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
var Template = Package['templating-runtime'].Template;
var LoginState = Package['brettle:accounts-login-state'].LoginState;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var HTML = Package.htmljs.HTML;
var Spacebars = Package.spacebars.Spacebars;

/* Package-scope variables */
var AccountsPatchUi;

(function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/brettle_accounts-patch-ui/accounts-patch-ui.js                         //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
"use strict";
/* globals AccountsPatchUi: true, LoginState */

// Remember the official Meteor versions of the functions we will be
// monkey patching.
var meteorUserIdFunc = Meteor.userId;
var meteorUserFunc = Meteor.user;

// A version of Meteor.userId() that returns null for users who have not signed
// up
var signedUpUserIdFunc = function() {
  var meteorUserId = meteorUserIdFunc.call(Meteor);
  if (!meteorUserId) {
    return null;
  }
  var user = Meteor.users.findOne(meteorUserId);
  if (!user) {
    // Meteor.userId() was not null, but the userId wasn't found locally. That
    // only happens before startup has finished and the Meteor.users
    // subscription is not yet ready. So, just act like regular Meteor.userId()
    // in this case (i.e. assume the user is signed up).
    return meteorUserId;
  }
  if (LoginState.signedUp()) {
    return meteorUserId;
  }
  return null;
};

// A version of Meteor.user() that returns null for user who have not signed up
var signedUpUserFunc = function() {
  if (LoginState.signedUp()) {
    return meteorUserFunc.call(Meteor);
  }
  return null;
};

function AccountsPatchUiConstructor() {
}

_.extend(AccountsPatchUiConstructor.prototype, {
  /** Returns a function that will execute the passed function with a version
   * `Meteor.userId()` and `Meteor.user()` that return null for users who have not
   * signed up.
   * @param {Function} func - the function to wrap.
   * @returns {Function} - the wrapped function
   */
  wrapWithSignedUp: function(func) {
    return function( /*arguments*/ ) {
      var savedUserIdFunc = Meteor.userId;
      var savedUserFunc = Meteor.user;
      Meteor.userId = signedUpUserIdFunc;
      Meteor.user = signedUpUserFunc;
      try {
        return func.apply(this, arguments);
      } finally {
        Meteor.userId = savedUserIdFunc;
        Meteor.user = savedUserFunc;
      }
    };
  },

  _signedUpUser: signedUpUserFunc,

  _wrapTemplateWithSignedUp: function(template) {
    var self = this;
    if (! template) {
      return;
    }
    self._wrapMethodsWithSignedUp(template.__helpers);
    if (! _.isArray(template.__eventMaps)) {
      throw new TypeError('__eventMaps not an Array');
    }
    _.each(template.__eventMaps, function(value, index, eventMaps) {
      self._wrapMethodsWithSignedUp(eventMaps[index]);
    });
  },

  _wrapMethodsWithSignedUp: function(obj) {
    if (obj === undefined) {
      return;
    }
    if (! _.isObject(obj)) {
      throw new TypeError('Not an object');
    }
    _.each(obj, function(value, key) {
      if (_.isFunction(value)) {
        obj[key] = AccountsPatchUi.wrapWithSignedUp(value);
      }
    });
  }
});

AccountsPatchUi = new AccountsPatchUiConstructor();

/////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/brettle_accounts-patch-ui/patch-accounts-ui-unstyled.js                //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
"use strict";
/* globals AccountsPatchUi */

if (Package['accounts-ui-unstyled'] && Template.loginButtons) {
  // Override global currentUser to hide users who are logged in but not
  // signed up, just for this template.
  Template.loginButtons.helpers({
    currentUser: AccountsPatchUi.wrapWithSignedUp(function () {
      return Meteor.user();
    })
  });
}

/////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/brettle_accounts-patch-ui/patch-ian_accounts-ui-bootstrap-3.js         //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
"use strict";
/* globals AccountsPatchUi */

if (Package['ian:accounts-ui-bootstrap-3'] && Template._loginButtons) {
  // Override global currentUser to hide users who are logged in but not
  // signed up, just for this template.
  Template._loginButtons.helpers({
    currentUser: AccountsPatchUi.wrapWithSignedUp(function () {
      return Meteor.user();
    })
  });
}

/////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/brettle_accounts-patch-ui/patch-useraccounts.js                        //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
"use strict";
/* globals AccountsPatchUi, Iron */

function wrapRouteHooksWithSignedUp(route) {
  _.each(Iron.Router.HOOK_TYPES, function(hookType) {
    if (_.isFunction(route.options[hookType])) {
      route.options[hookType] =
        AccountsPatchUi.wrapWithSignedUp(route.options[hookType]);
    }
  });
}

function wrapFlowRouteHooksWithSignedUp(route) {
  if (_.isFunction(route._action)) {
    route._action = AccountsPatchUi.wrapWithSignedUp(route._action);
  }
  _.each(['triggersEnter', 'triggersExit'], function(hookType) {
    if (_.isArray(route.options[hookType])) {
      _.each(route.options[hookType], function(cb, i, arr) {
        if (_.isFunction(cb)) {
          arr[i] = AccountsPatchUi.wrapWithSignedUp(cb);
        }
      });
    }
  });
}

AccountsPatchUi._wrapTemplateWithSignedUp(Template.atNavButton);
AccountsPatchUi._wrapTemplateWithSignedUp(Template.atForm);

var AccountsTemplates =
  Package['useraccounts:core'] &&
  Package['useraccounts:core'].AccountsTemplates;
if (Package['useraccounts:iron-routing']) {
  var IronRouter = Package['iron:router'] && Package['iron:router'].Router;
  if (AccountsTemplates && AccountsTemplates.routes && IronRouter) {
    _.each(AccountsTemplates.routes, function(r) {
      var route = IronRouter.routes[r.name];
      wrapRouteHooksWithSignedUp(route);
    });
  }

  if (AccountsTemplates && AccountsTemplates.configureRoute && IronRouter) {
    var origConfigureRoute = AccountsTemplates.configureRoute;
    AccountsTemplates.configureRoute = function(routeCode, options) {
      var ret = origConfigureRoute.call(this, routeCode, options);
      var route = IronRouter.routes[AccountsTemplates.routes[routeCode].name];
      wrapRouteHooksWithSignedUp(route);
      return ret;
    };

    var origEnsureSignedIn = AccountsTemplates.ensureSignedIn;
    AccountsTemplates.ensureSignedIn =
      AccountsPatchUi.wrapWithSignedUp(origEnsureSignedIn);

    var origEnsureSignedInPlugin = Iron.Router.plugins.ensureSignedIn;
    Iron.Router.plugins.ensureSignedIn = function(router, options) {
      var origMethods = {};
      _.each(['onBeforeAction', 'onAfterAction', 'onRerun', 'onRun', 'onStop'],
        function(methodName) {
          if (_.isFunction(router[methodName])) {
            origMethods[methodName] = router[methodName];
            router[methodName] = function(hook, options) {
              return origMethods[methodName].
                call(router, AccountsPatchUi.wrapWithSignedUp(hook), options);
            };
          }
        }
      );
      var ret;
      try {
        ret = origEnsureSignedInPlugin(router, options);
      } finally {
        _.each(_.keys(origMethods), function(methodName) {
          router[methodName] = origMethods[methodName];
        });
      }
      return ret;
    };
  }
} else if (Package['useraccounts:flow-routing']) {
  var FlowRouter =
    Package['kadira:flow-router'] && Package['kadira:flow-router'].FlowRouter;
  if (AccountsTemplates && AccountsTemplates.routes && FlowRouter) {
    _.each(AccountsTemplates.routes, function(r, key) {
      var route = lookupFlowRoute(r.name, key);
      wrapFlowRouteHooksWithSignedUp(route);
    });
  }

  if (AccountsTemplates && AccountsTemplates.configureRoute && FlowRouter) {
    var origConfigureRoute = AccountsTemplates.configureRoute;
    AccountsTemplates.configureRoute = function(routeCode, options) {
      var ret = origConfigureRoute.call(this, routeCode, options);
      var route =
        lookupFlowRoute(AccountsTemplates.routes[routeCode].name, routeCode);
      wrapFlowRouteHooksWithSignedUp(route);
      return ret;
    };

    var origEnsureSignedIn = AccountsTemplates.ensureSignedIn;
    AccountsTemplates.ensureSignedIn =
      AccountsPatchUi.wrapWithSignedUp(origEnsureSignedIn);
  }
}

function lookupFlowRoute(name, code) {
  var route = FlowRouter._routesMap[name];
  // Looks like configureRoute sometimes uses the route code instead of the
  // route name. Probably a bug.
  if (!route) {
    route = FlowRouter._routesMap[code];
  }
  return route;
}

/////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("brettle:accounts-patch-ui", {
  AccountsPatchUi: AccountsPatchUi
});

})();

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
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var _ = Package.underscore._;

/* Package-scope variables */
var __coffeescriptShare, ActiveRoute;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/zimme_active-route/packages/zimme_active-route.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/zimme:active-route/lib/activeroute.coffee.js                                                           //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var checkArgument, checkRouterPackages, errorMessages, fr, ir, test;             

fr = ir = null;

checkArgument = function(arg) {
  var error;
  try {
    return check(arg, Match.OneOf(RegExp, String));
  } catch (_error) {
    error = _error;
    throw new Error(errorMessages.invalidArgument);
  }
};

checkRouterPackages = function() {
  var _ref;
  fr = (_ref = Package['kadira:flow-router']) != null ? _ref : Package['meteorhacks:flow-router'];
  ir = Package['iron:router'];
  if (!(ir || fr)) {
    throw new Error(errorMessages.noSupportedRouter);
  }
};

errorMessages = {
  noSupportedRouter: 'No supported router installed. Please install ' + 'iron:router or meteorhacks:flow-router.',
  invalidArgument: 'Invalid argument, must be String or RegExp.'
};

share.config = new ReactiveDict('activeRouteConfig');

share.config.setDefault({
  activeClass: 'active',
  caseSensitive: true,
  disabledClass: 'disabled'
});

test = function(value, pattern) {
  var result;
  if (!value) {
    return false;
  }
  if (Match.test(pattern, RegExp)) {
    result = value.search(pattern);
    result = result > -1;
  } else if (Match.test(pattern, String)) {
    if (share.config.equals('caseSensitive', false)) {
      value = value.toLowerCase();
      pattern = pattern.toLowerCase();
    }
    result = value === pattern;
  }
  return result != null ? result : result = false;
};

ActiveRoute = {
  config: function() {
    return this.configure.apply(this, arguments);
  },
  configure: function(options) {
    if (Meteor.isServer) {
      return;
    }
    share.config.set(options);
  },
  name: function(routeName) {
    var currentRouteName, _ref, _ref1;
    checkRouterPackages();
    if (Meteor.isServer) {
      return;
    }
    checkArgument(routeName);
    if (ir) {
      currentRouteName = (_ref = ir.Router.current()) != null ? (_ref1 = _ref.route) != null ? typeof _ref1.getName === "function" ? _ref1.getName() : void 0 : void 0 : void 0;
    }
    if (fr) {
      if (currentRouteName == null) {
        currentRouteName = fr.FlowRouter.getRouteName();
      }
    }
    return test(currentRouteName, routeName);
  },
  path: function(path) {
    var controller, currentPath;
    checkRouterPackages();
    if (Meteor.isServer) {
      return;
    }
    checkArgument(path);
    if (ir) {
      controller = ir.Router.current();
      if (controller != null ? controller.route : void 0) {
        currentPath = controller != null ? controller.location.get().path : void 0;
      }
    }
    if (fr) {
      fr.FlowRouter.watchPathChange();
      if (currentPath == null) {
        currentPath = fr.FlowRouter.current().path;
      }
    }
    return test(currentPath, path);
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/zimme:active-route/client/helpers.coffee.js                                                            //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Template, func, helpers, isActive, name,
  __hasProp = {}.hasOwnProperty;

if (!Package.templating) {
  return;
}

Template = Package.templating.Template;

isActive = function(type, inverse) {
  var helperName;
  if (inverse == null) {
    inverse = false;
  }
  helperName = 'is';
  if (inverse) {
    helperName += 'Not';
  }
  helperName += "Active" + type;
  return function(options, attributes) {
    var className, isPath, name, path, pattern, regex, result, t, _ref;
    if (options == null) {
      options = {};
    }
    if (attributes == null) {
      attributes = {};
    }
    if (Match.test(options, Spacebars.kw)) {
      options = options.hash;
    }
    if (Match.test(attributes, Spacebars.kw)) {
      attributes = attributes.hash;
    }
    if (Match.test(options, String)) {
      if (share.config.equals('regex', true)) {
        options = {
          regex: options
        };
      } else if (type === 'Path') {
        options = {
          path: options
        };
      } else {
        options = {
          name: options
        };
      }
    }
    options = _.defaults(attributes, options);
    pattern = Match.ObjectIncluding({
      "class": Match.Optional(String),
      className: Match.Optional(String),
      regex: Match.Optional(Match.OneOf(RegExp, String)),
      name: Match.Optional(String),
      path: Match.Optional(String)
    });
    check(options, pattern);
    regex = options.regex, name = options.name, path = options.path;
    className = (_ref = options["class"]) != null ? _ref : options.className;
    if (type === 'Path') {
      name = null;
    } else {
      path = null;
    }
    if (!(regex || name || path)) {
      t = type === 'Route' ? 'name' : type;
      t = t.toLowerCase();
      console.error(("Invalid argument, " + helperName + " takes \"" + t + "\", ") + ("" + t + "=\"" + t + "\" or regex=\"regex\""));
      return false;
    }
    if (Match.test(regex, String)) {
      if (share.config.equals('caseSensitive', false)) {
        regex = new RegExp(regex, 'i');
      } else {
        regex = new RegExp(regex);
      }
    }
    if (regex == null) {
      regex = name || path;
    }
    if (inverse) {
      if (className == null) {
        className = share.config.get('disabledClass');
      }
    } else {
      if (className == null) {
        className = share.config.get('activeClass');
      }
    }
    if (type === 'Path') {
      isPath = true;
    }
    if (isPath) {
      result = ActiveRoute.path(regex);
    } else {
      result = ActiveRoute.name(regex);
    }
    if (inverse) {
      result = !result;
    }
    if (result) {
      return className;
    } else {
      return false;
    }
  };
};

helpers = {
  isActiveRoute: isActive('Route'),
  isActivePath: isActive('Path'),
  isNotActiveRoute: isActive('Route', true),
  isNotActivePath: isActive('Path', true)
};

for (name in helpers) {
  if (!__hasProp.call(helpers, name)) continue;
  func = helpers[name];
  Template.registerHelper(name, func);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("zimme:active-route", {
  ActiveRoute: ActiveRoute
});

})();

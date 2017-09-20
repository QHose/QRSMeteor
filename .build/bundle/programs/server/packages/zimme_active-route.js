(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var _ = Package.underscore._;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['zimme:active-route'] = {}, {
  ActiveRoute: ActiveRoute
});

})();

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
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Template = Package['templating-runtime'].Template;
var EJSON = Package.ejson.EJSON;
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Iron = Package['iron:core'].Iron;
var HTML = Package.htmljs.HTML;
var Spacebars = Package.spacebars.Spacebars;

/* Package-scope variables */
var CurrentOptions, HTTP_METHODS, RouteController, Route, Router;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/current_options.js                                                                //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
/**
 * Allows for dynamic scoping of options variables. Primarily intended to be
 * used in the RouteController.prototype.lookupOption method.
 */
CurrentOptions = new Meteor.EnvironmentVariable;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/http_methods.js                                                                   //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
HTTP_METHODS = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head'
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/route_controller.js                                                               //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Controller = Iron.Controller;
var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;
var assert = Iron.utils.assert;

/*****************************************************************************/
/* RouteController */
/*****************************************************************************/
RouteController = Controller.extend({
  constructor: function (options) {
    RouteController.__super__.constructor.apply(this, arguments);
    options = options || {};
    this.options = options;
    this._onStopCallbacks = [];
    this.route = options.route;
    this.params = [];

    // Sometimes the data property can be defined on route options,
    // or even on the global router config. And people will expect the
    // data function to be available on the controller instance if it
    // is defined anywhere in the chain. This ensure that if we have
    // a data function somewhere in the chain, you can call this.data().
    var data = this.lookupOption('data');

    if (typeof data === 'function')
      this.data = _.bind(data, this);
    else if (typeof data !== 'undefined')
      this.data = function () { return data; };

    this.init(options);
  }
});

/**
 * Returns an option value following an "options chain" which is this path:
 *
 *   this.options
 *   this (which includes the proto chain)
 *   this.route.options
 *   dynamic variable
 *   this.router.options
 */
RouteController.prototype.lookupOption = function (key) {
  // this.route.options
  // NOTE: we've debated whether route options should come before controller but
  // Tom has convinced me that it's easier for people to think about overriding
  // controller stuff at the route option level. However, this has the possibly
  // counterintuitive effect that if you define this.someprop = true on the
  // controller instance, and you have someprop defined as an option on your
  // Route, the route option will take precedence.
  if (this.route && this.route.options && _.has(this.route.options, key))
    return this.route.options[key];

  // this.options
  if (_.has(this.options, key))
    return this.options[key];

  // "this" object or its proto chain
  if (typeof this[key] !== 'undefined')
    return this[key];

  // see if we have the CurrentOptions dynamic variable set.
  var opts = CurrentOptions.get();
  if (opts && _.has(opts, key))
    return opts[key];

  // this.router.options
  if (this.router && this.router.options && _.has(this.router.options, key))
    return this.router.options[key];
};

RouteController.prototype.configureFromUrl = function (url, context, options) {
  assert(typeof url === 'string', 'url must be a string');
  context = context || {};
  this.request = context.request || {};
  this.response = context.response || {};
  this.url = context.url || url;
  this.originalUrl = context.originalUrl || url;
  this.method = this.request.method;
  if (this.route) {
    // pass options to that we can set reactive: false
    this.setParams(this.route.params(url), options);
  }
};

/**
 * Returns an array of hook functions for the given hook names. Hooks are
 * collected in this order:
 *
 * router global hooks
 * route option hooks
 * prototype of the controller
 * this object for the controller
 *
 * For example, this.collectHooks('onBeforeAction', 'before')
 * will return an array of hook functions where the key is either onBeforeAction
 * or before.
 *
 * Hook values can also be strings in which case they are looked up in the
 * Iron.Router.hooks object.
 *
 * TODO: Add an options last argument which can specify to only collect hooks
 * for a particular environment (client, server or both).
 */
RouteController.prototype._collectHooks = function (/* hook1, alias1, ... */) {
  var self = this;
  var hookNames = _.toArray(arguments);

  var getHookValues = function (value) {
    if (!value)
      return [];
    var lookupHook = self.router.lookupHook;
    var hooks = _.isArray(value) ? value : [value];
    return _.map(hooks, function (h) { return lookupHook(h); });
  };

  var collectInheritedHooks = function (ctor, hookName) {
    var hooks = [];

    if (ctor.__super__)
      hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor, hookName));

    return _.has(ctor.prototype, hookName) ?
      hooks.concat(getHookValues(ctor.prototype[hookName])) : hooks;
  };

  var eachHook = function (cb) {
    for (var i = 0; i < hookNames.length; i++) {
      cb(hookNames[i]);
    }
  };

  var routerHooks = [];
  eachHook(function (hook) {
    var name = self.route && self.route.getName();
    var hooks = self.router.getHooks(hook, name);
    routerHooks = routerHooks.concat(hooks);
  });

  var protoHooks = [];
  eachHook(function (hook) {
    var hooks = collectInheritedHooks(self.constructor, hook);
    protoHooks = protoHooks.concat(hooks);
  });

  var thisHooks = [];
  eachHook(function (hook) {
    if (_.has(self, hook)) {
      var hooks = getHookValues(self[hook]);
      thisHooks = thisHooks.concat(hooks);
    }
  });

  var routeHooks = [];
  if (self.route) {
    eachHook(function (hook) {
      var hooks = getHookValues(self.route.options[hook]);
      routeHooks = routeHooks.concat(hooks);
    });
  }

  var allHooks = routerHooks
    .concat(routeHooks)
    .concat(protoHooks)
    .concat(thisHooks);

  return allHooks;
};

/**
 * Runs each hook and returns the number of hooks that were run.
 */
RouteController.prototype.runHooks = function (/* hook, alias1, ...*/ ) {
  var hooks = this._collectHooks.apply(this, arguments);
  for (var i = 0, l = hooks.length; i < l; i++) {
    var h = hooks[i];
    h.call(this);
  }
  return hooks.length;
};

RouteController.prototype.getParams = function () {
  return this.params;
};

RouteController.prototype.setParams = function (value) {
  this.params = value;
  return this;
};

Iron.RouteController = RouteController;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/route_controller_client.js                                                        //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Controller = Iron.Controller;
var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;
var debug = Iron.utils.debug('iron-router:RouteController');

/*****************************************************************************/
/* RouteController */
/*****************************************************************************/
/**
 * Client specific initialization.
 */
RouteController.prototype.init = function (options) {
  RouteController.__super__.init.apply(this, arguments);
  this._computation = null;
  this._paramsDep = new Tracker.Dependency;
  this.location = Iron.Location;
};

RouteController.prototype.getParams = function () {
  this._paramsDep.depend();
  return this.params;
};

RouteController.prototype.setParams = function (value, options) {
  var equals = function (a, b) {
    if (!(a instanceof Array))
      throw new Error("you called equals with a non array value in setParams");
    if (!(b instanceof Array))
      return false;
    if (a.length !== b.length)
      return false;
    for (var i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options))
        return false;
    }

    // now check all of the hasOwn properties of params
    var aKeys = _.keys(a);
    var bKeys = _.keys(b);
    var key;

    if (aKeys.length !== bKeys.length)
      return false;

    for (var i = 0; i < aKeys.length; i++) {
      key = aKeys[i];
      if (!_.has(b, key))
        return false;
      if (!EJSON.equals(a[key], b[key]))
        return false;
    }

    return true;
  };

  // this won't work because the array values are the same
  // most of the time.
  if (equals(this.params, value))
    return;

  this.params = value;

  options = options || {};
  if (options.reactive !== false)
    this._paramsDep.changed();

  return this;
};

/**
 * Let this controller run a dispatch process. This function will be called
 * from the router. That way, any state associated with the dispatch can go on
 * the controller instance.
 */
RouteController.prototype.dispatch = function (stack, url, done) {
  if (this._computation && !this._computation.stopped)
    throw new Error("RouteController computation is already running. Stop it first.");

  var self = this;

  // break the computation chain with any parent comps
  Deps.nonreactive(function () {
    Deps.autorun(function (comp) {
      self._computation = comp;
      stack.dispatch(url, self, done);
    });
  });

  return self;
};

/**
 * Run a route. When the router runs its middleware stack, it can run regular
 * middleware functions or it can run a route. There should only one route
 * object per path as where there may be many middleware functions.
 *
 * For example:
 *
 *   "/some/path" => [middleware1, middleware2, route, middleware3]
 *
 * When a route is dispatched, it tells the controller to _runRoute so that
 * the controller can controll the process. At this point we should already be
 * in a dispatch so a computation should already exist.
 */
RouteController.prototype._runRoute = function (route, url, done) {
  var self = this;


  // this will now be where you can put your subscriptions
  // instead of waitOn. If you use waitOn, it will also
  // add the result to the wait list, but will also use
  // the loading hook.
  //
  // Similar to waitOn, we'll collect these just like hooks. See the comment
  // below on the waitOnList.
  //
  // If you don't want the subscription to affect the readiness of the waitlist
  // then just don't return the subscription handle from the function.
  var subsList = this._collectHooks('subscriptions');
  _.each(subsList, function (subFunc) {
    self.wait(subFunc.call(self));
  });


  // waitOn isn't really a 'hook' but we use the _collectHooks method here
  // because I want an array of values collected in the same order that we
  // collect regular hooks (router global, route option, controller proto,
  // controller inst object. Then we need to map over the results to make
  // sure the thisArg is set to the controller instance.
  var waitOnList = this._collectHooks('waitOn');

  _.each(waitOnList, function (waitOn) {
    self.wait(waitOn.call(self));
  });

  // if we have a waitOn option, the loading hook will be
  // added at the end of the before hook stack, right before
  // the action function.
  var useLoadingHook = waitOnList.length > 0;

  // start the rendering transaction so we record which regions were rendered
  // into so we can clear the unused regions later. the callback function will
  // get called automatically on the next flush, OR if beginRendering is called
  // again before the afterFlush callback.
  var previousLayout;
  var previousMainTemplate;

  var getLayout = function () {
    return Deps.nonreactive(function () {
      return self._layout.template();
    });
  };

  var getMainTemplate = function () {
    return Deps.nonreactive(function () {
      var region = self._layout._regions.main;
      return region && region.template();
    });
  };

  var prevLayout = getLayout();
  var prevMainTemplate = getMainTemplate();

  this.beginRendering(function onCompleteRenderingTransaction (usedRegions) {
    if (self.isStopped)
      return;

    var curLayout = getLayout();
    var curMainTemplate = getMainTemplate();

    // in the case where we're using the same layout and main template
    // across route changes don't automatically clear the unused regions
    // because we could have static content in them that we want to keep!
    if (prevLayout === curLayout && prevMainTemplate == curMainTemplate)
      return;

    var allRegions = self._layout.regionKeys();
    var unusedRegions = _.difference(allRegions, usedRegions);
    _.each(unusedRegions, function (r) { self._layout.clear(r); });
  });

  this.layout(this.lookupOption('layoutTemplate'), {
    data: this.lookupOption('data')
  });

  var stack = new MiddlewareStack;
  var onRunStack = new MiddlewareStack;
  var onRerunStack = new MiddlewareStack;

  onRunStack.append(this._collectHooks('onRun', 'load'), {where: 'client'});
  onRerunStack.append(this._collectHooks('onRerun'), {where: 'client'});

  stack.append(
    function onRun (req, res, next) {
      if (this._computation.firstRun && !RouteController._hasJustReloaded) {
        if (onRunStack.length > 0) {
          onRunStack.dispatch(req.url, this, next);
        } else {
          next();
        }
      } else {
        next();
      }
      RouteController._hasJustReloaded = false;
    },

    function onRerun (req, res, next) {
      if (!this._computation.firstRun) {
        if (onRerunStack.length > 0) {
          onRerunStack.dispatch(req.url, this, next);
        } else {
          next();
        }
      } else {
        next();
      }
    }
  , {where: 'client'});

  // make sure the loading hook is the first one to run
  // before any of the other onBeforeAction hooks.
  if (useLoadingHook) {
    stack.push(_.bind(Iron.Router.hooks.loading, self));
  }

  var beforeHooks = this._collectHooks('onBeforeAction', 'before');
  stack.append(beforeHooks, {where: 'client'});

  // make sure the action stack has at least one handler on it that defaults
  // to the 'action' method
  if (route._actionStack.length === 0)
    route._actionStack.push(route._path, 'action', route.options);

  stack = stack.concat(route._actionStack);

  // the "context" is the current instance of the RouteController
  this._rendered = false;
  stack.dispatch(url, this, done);
  // we put this in an afterFlush to let a redirected route have a chance to
  //   start and to stop this route.
  Deps.afterFlush(function() {
    Iron.utils.warn(self._rendered || self.isStopped,
      "Route dispatch never rendered. Did you forget to call this.next() in an onBeforeAction?");
  });

  // run the after hooks. Note, at this point we're out of the middleware
  // stack way of doing things. So after actions don't call this.next(). They
  // run just like a regular hook. In contrast, before hooks have to call
  // this.next() to progress to the next handler, just like Connect
  // middleware.
  this.runHooks('onAfterAction', 'after');
};

/**
 * The default action for the controller simply renders the main template.
 */
RouteController.prototype.action = function () {
  this.render();
};

/**
 * Returns the name of the main template for this controller. If no explicit
 * value is found we will guess the name of the template.
 */
RouteController.prototype.lookupTemplate = function () {
  return this.lookupOption('template') ||
    (this.router && this.router.toTemplateName(this.route.getName()));
};

/**
 * The regionTemplates for the RouteController.
 */
RouteController.prototype.lookupRegionTemplates = function () {
  return this.lookupOption('yieldRegions') ||
    // XXX: deprecated
    this.lookupOption('regionTemplates') ||
    this.lookupOption('yieldTemplates') || {};
};

/**
 * Overrides Controller.prototype.render to automatically render the
 * controller's main template and region templates or just render a region
 * template if the arguments are provided.
 */
RouteController.prototype.render = function (template, options) {
  this._rendered = true;
  if (arguments.length === 0) {
    var template = this.lookupTemplate();
    var result = RouteController.__super__.render.call(this, template);
    this.renderRegions();
    return result;
  } else {
    return RouteController.__super__.render.call(this, template, options);
  }
};

/**
 * Render all region templates into their respective regions in the layout.
 */
RouteController.prototype.renderRegions = function () {
  var self = this;
  var regionTemplates = this.lookupRegionTemplates();

  debug('regionTemplates: ' + JSON.stringify(regionTemplates));


  // regionTemplates =>
  //   {
  //     "MyTemplate": {to: 'MyRegion'}
  //   }
  _.each(regionTemplates, function (opts, templateName) {
    self.render(templateName, opts);
  });
};

/**
 * Stop the RouteController.
 */
RouteController.prototype.stop = function () {
  RouteController.__super__.stop.call(this);

  if (this._computation)
    this._computation.stop();
  this.runHooks('onStop', 'unload');
  this.isStopped = true;
};

/**
 * Just proxies to the go method of router.
 *
 * It used to have more significance. Keeping because people are used to it.
 */
RouteController.prototype.redirect = function () {
  return this.router.go.apply(this.router, arguments);
};

/**
 * Calls Meteor.subscribe but extends the handle with a wait() method.
 *
 * The wait method adds the subscription handle to this controller's
 * wait list. This is equivalent to returning a subscription handle
 * from the waitOn function. However, using the waitOn function has the
 * benefit that it will be called before any other hooks. So if you want
 * to use the "loading" hooks for example, you'll want the wait list populated
 * before the hook runs.
 *
 * Example:
 *
 *   this.subscribe('item', this.params._id).wait();
 *
 *   if (this.ready()) {
 *     ...
 *   } else {
 *     ...
 *   }
 */
RouteController.prototype.subscribe = function (/* same as Meteor.subscribe */) {
  var self = this;
  var handle = Meteor.subscribe.apply(this, arguments);
  return _.extend(handle, {
    wait: function () {
      self.wait(this);
    }
  });
};

if (Package.reload) {
  // just register the fact that a migration _has_ happened
  Package.reload.Reload._onMigrate('iron-router', function() { return [true, true] });

  // then when we come back up, check if it is set
  var data = Package.reload.Reload._migrationData('iron-router');
  RouteController._hasJustReloaded = data;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/route.js                                                                          //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;
var assert = Iron.utils.assert;

/*****************************************************************************/
/* Both */
/*****************************************************************************/
Route = function (path, fn, options) {
  var route = function (req, res, next) {
    var controller = this;
    controller.request = req;
    controller.response = res;
    route.dispatch(req.url, controller, next);
  }

  if (typeof fn === 'object') {
    options = fn;
    fn = options.action;
  }

  options = options || {};

  if (typeof path === 'string' && path.charAt(0) !== '/') {
    path = options.path ? options.path : '/' + path
  }

  // extend the route function with properties from this instance and its
  // prototype.
  _.extend(route, this.constructor.prototype);

  // always good to have options
  options = route.options = options || {};

  // the main action function as well as any HTTP VERB action functions will go
  // onto this stack.
  route._actionStack = new MiddlewareStack;

  // any before hooks will go onto this stack to make sure they get executed
  // before the action stack.
  route._beforeStack = new MiddlewareStack;
  route._beforeStack.append(route.options.onBeforeAction);
  route._beforeStack.append(route.options.before);

  // after hooks get run after the action stack
  route._afterStack = new MiddlewareStack;
  route._afterStack.append(route.options.onAfterAction);
  route._afterStack.append(route.options.after);


  // track which methods this route uses
  route._methods = {};

  if (typeof fn === 'string') {
    route._actionStack.push(path, _.extend(options, {
      template: fn
    }));
  } else if (typeof fn === 'function' || typeof fn === 'object') {
    route._actionStack.push(path, fn, options);
  }

  route._path = path;
  return route;
};

/**
 * The name of the route is actually stored on the handler since a route is a
 * function that has an unassignable "name" property.
 */
Route.prototype.getName = function () {
  return this.handler && this.handler.name;
};

/**
 * Returns an appropriate RouteController constructor the this Route.
 *
 * There are three possibilities:
 *
 *  1. controller option provided as a string on the route
 *  2. a controller in the global namespace with the converted name of the route
 *  3. a default RouteController
 *
 */
Route.prototype.findControllerConstructor = function () {
  var self = this;

  var resolve = function (name, opts) {
    opts = opts || {};
    var C = Iron.utils.resolve(name);
    if (!C || !RouteController.prototype.isPrototypeOf(C.prototype)) {
      if (opts.supressErrors !== true)
        throw new Error("RouteController '" + name + "' is not defined.");
      else
        return undefined;
    } else {
      return C;
    }
  };

  var convert = function (name) {
    return self.router.toControllerName(name);
  };

  var result;
  var name = this.getName();

  // the controller was set directly
  if (typeof this.options.controller === 'function')
    return this.options.controller;

  // was the controller specified precisely by name? then resolve to an actual
  // javascript constructor value
  else if (typeof this.options.controller === 'string')
    return resolve(this.options.controller);

  // is there a default route controller configured?
  else if (this.router && this.router.options.controller) {
    if (typeof this.router.options.controller === 'function')
      return this.router.options.controller;

    else if (typeof this.router.options.controller === 'string')
      return resolve(this.router.options.controller);
  }

  // otherwise do we have a name? try to convert the name to a controller name
  // and resolve it to a value
  else if (name && (result = resolve(convert(name), {supressErrors: true})))
    return result;

  // otherwise just use an anonymous route controller
  else
    return RouteController;
};


/**
 * Create a new controller for the route.
 */
Route.prototype.createController = function (options) {
  options = options || {};
  var C = this.findControllerConstructor();
  options.route = this;
  var instance = new C(options);
  return instance;
};

Route.prototype.setControllerParams = function (controller, url) {
};

/**
 * Dispatch into the route's middleware stack.
 */
Route.prototype.dispatch = function (url, context, done) {
  // call runRoute on the controller which will behave similarly to the previous
  // version of IR.
  assert(context._runRoute, "context doesn't have a _runRoute method");
  return context._runRoute(this, url, done);
};

/**
 * Returns a relative path for the route.
 */
Route.prototype.path = function (params, options) {
  return this.handler.resolve(params, options);
};

/**
 * Return a fully qualified url for the route, given a set of parmeters and
 * options like hash and query.
 */
Route.prototype.url = function (params, options) {
  var path = this.path(params, options);
  var host = (options && options.host) || Meteor.absoluteUrl();

  if (host.charAt(host.length-1) === '/')
    host = host.slice(0, host.length-1);
  return host + path;
};

/**
 * Return a params object for the route given a path.
 */
Route.prototype.params = function (path) {
  return this.handler.params(path);
};

/**
 * Add convenience methods for each HTTP verb.
 *
 * Example:
 *  var route = router.route('/item')
 *    .get(function () { })
 *    .post(function () { })
 *    .put(function () { })
 */
_.each(HTTP_METHODS, function (method) {
  Route.prototype[method] = function (fn) {
    // track the method being used for OPTIONS requests.
    this._methods[method] = true;

    this._actionStack.push(this._path, fn, {
      // give each method a unique name so it doesn't clash with the route's
      // name in the action stack
      name: this.getName() + '_' + method.toLowerCase(),
      method: method,

      // for now just make the handler where the same as the route, presumably a
      // server route.
      where: this.handler.where,
      mount: false
    });

    return this;
  };
});

Iron.Route = Route;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/router.js                                                                         //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var MiddlewareStack = Iron.MiddlewareStack;
var Url = Iron.Url;
var Layout = Iron.Layout;
var warn = Iron.utils.warn;
var assert = Iron.utils.assert;

Router = function (options) {
  // keep the same api throughout which is:
  // fn(url, context, done);
  function router (req, res, next) {
    //XXX this assumes no other routers on the parent stack which we should probably fix
    router.dispatch(req.url, {
      request: req,
      response: res
    }, next);
  }

  // the main router stack
  router._stack = new MiddlewareStack;

  // for storing global hooks like before, after, etc.
  router._globalHooks = {};

  // backward compat and quicker lookup of Route handlers vs. regular function
  // handlers.
  router.routes = [];

  // to make sure we don't have more than one route per path
  router.routes._byPath = {};

  // always good to have options
  this.configure.call(router, options);

  // add proto properties to the router function
  _.extend(router, this.constructor.prototype);

  // let client and server side routing doing different things here
  this.init.call(router, options);

  Meteor.startup(function () {
    Meteor.defer(function () {
      if (router.options.autoStart !== false)
        router.start();
    });
  });

  return router;
};

Router.prototype.init = function (options) {};

Router.prototype.configure = function (options) {
  var self = this;

  options = options || {};

  var toArray = function (value) {
    if (!value)
      return [];

    if (_.isArray(value))
      return value;

    return [value];
  };

  // e.g. before: fn OR before: [fn1, fn2]
  _.each(Iron.Router.HOOK_TYPES, function eachHookType (type) {
    if (options[type]) {
      _.each(toArray(options[type]), function eachHook (hook) {
        self.addHook(type, hook);
      });

      delete options[type];
    }
  });

  this.options = this.options || {};
  _.extend(this.options, options);

  return this;
};

/**
 * Just to support legacy calling. Doesn't really serve much purpose.
 */
Router.prototype.map = function (fn) {
  return fn.call(this);
};

/*
 * XXX removing for now until this is thought about more carefully.
Router.prototype.use = function (path, fn, opts) {
  if (typeof path === 'function') {
    opts = fn || {};
    opts.mount = true;
    opts.where = opts.where || 'server';
    this._stack.push(path, opts);
  } else {
    opts = opts || {};
    opts.mount = true;
    opts.where = opts.where || 'server';
    this._stack.push(path, fn, opts);
  }

  return this;
};
*/

//XXX seems like we could put a params method on the route directly and make it reactive
Router.prototype.route = function (path, fn, opts) {
  var typeOf = function (val) { return Object.prototype.toString.call(val); };
  assert(typeOf(path) === '[object String]' || typeOf(path) === '[object RegExp]', "Router.route requires a path that is a string or regular expression.");

  if (typeof fn === 'object') {
    opts = fn;
    fn = opts.action;
  }

  var route = new Route(path, fn, opts);

  opts = opts || {};

  // don't mount the route
  opts.mount = false;

  // stack expects a function which is exactly what a new Route returns!
  var handler = this._stack.push(path, route, opts);

  handler.route = route;
  route.handler = handler;
  route.router = this;

  assert(!this.routes._byPath[handler.path],
    "A route for the path " + JSON.stringify(handler.path) + " already exists by the name of " + JSON.stringify(handler.name) + ".");
  this.routes._byPath[handler.path] = route;

  this.routes.push(route);

  if (typeof handler.name === 'string')
    this.routes[handler.name] = route;

  return route;
};

/**
 * Find the first route for the given url and options.
 */
Router.prototype.findFirstRoute = function (url) {
  var isMatch;
  var route;
  for (var i = 0; i < this.routes.length; i++) {
    route = this.routes[i];

    // only matches if the url matches AND the
    // current environment matches.
    isMatch = route.handler.test(url, {
      where: Meteor.isServer ? 'server' : 'client'
    });

    if (isMatch)
      return route;
  }

  return null;
};

Router.prototype.path = function (routeName, params, options) {
  var route = this.routes[routeName];
  warn(route, "You called Router.path for a route named " + JSON.stringify(routeName) + " but that route doesn't seem to exist. Are you sure you created it?");
  return route && route.path(params, options);
};

Router.prototype.url = function (routeName, params, options) {
  var route = this.routes[routeName];
  warn(route, "You called Router.url for a route named " + JSON.stringify(routeName) + " but that route doesn't seem to exist. Are you sure you created it?");
  return route && route.url(params, options);
};

/**
 * Create a new controller for a dispatch.
 */
Router.prototype.createController = function (url, context) {
  // see if there's a route for this url and environment
  // it's possible that we find a route but it's a client
  // route so we don't instantiate its controller and instead
  // use an anonymous controller to run the route.
  var route = this.findFirstRoute(url);
  var controller;

  context = context || {};

  if (route)
    // let the route decide what controller to use
    controller = route.createController({layout: this._layout});
  else
    // create an anonymous controller
    controller = new RouteController({layout: this._layout});

  controller.router = this;
  controller.configureFromUrl(url, context, {reactive: false});
  return controller;
};

Router.prototype.setTemplateNameConverter = function (fn) {
  this._templateNameConverter = fn;
  return this;
};

Router.prototype.setControllerNameConverter = function (fn) {
  this._controllerNameConverter = fn;
  return this;
};

Router.prototype.toTemplateName = function (str) {
  if (this._templateNameConverter)
    return this._templateNameConverter(str);
  else
    return Iron.utils.classCase(str);
};

Router.prototype.toControllerName = function (str) {
  if (this._controllerNameConverter)
    return this._controllerNameConverter(str);
  else
    return Iron.utils.classCase(str) + 'Controller';
};

/**
 *
 * Add a hook to all routes. The hooks will apply to all routes,
 * unless you name routes to include or exclude via `only` and `except` options
 *
 * @param {String} [type] one of 'load', 'unload', 'before' or 'after'
 * @param {Object} [options] Options to controll the hooks [optional]
 * @param {Function} [hook] Callback to run
 * @return {IronRouter}
 * @api public
 *
 */

Router.prototype.addHook = function(type, hook, options) {
  var self = this;

  options = options || {};

  var toArray = function (input) {
    if (!input)
      return [];
    else if (_.isArray(input))
      return input;
    else
      return [input];
  }

  if (options.only)
    options.only = toArray(options.only);
  if (options.except)
    options.except = toArray(options.except);

  var hooks = this._globalHooks[type] = this._globalHooks[type] || [];

  var hookWithOptions = function () {
    var thisArg = this;
    var args = arguments;
    // this allows us to bind hooks to options that get looked up when you call
    // this.lookupOption from within the hook. And it looks better to keep
    // plugin/hook related options close to their definitions instead of
    // Router.configure. But we use a dynamic variable so we don't have to
    // pass the options explicitly as an argument and plugin creators can
    // just use this.lookupOption which will follow the proper lookup chain from
    // "this", local options, dynamic variable options, route, router, etc.
    return CurrentOptions.withValue(options, function () {
      return self.lookupHook(hook).apply(thisArg, args);
    });
  };

  hooks.push({options: options, hook: hookWithOptions});
  return this;
};

/**
 * If the argument is a function return it directly. If it's a string, see if
 * there is a function in the Iron.Router.hooks namespace. Throw an error if we
 * can't find the hook.
 */
Router.prototype.lookupHook = function (nameOrFn) {
  var fn = nameOrFn;

  // if we already have a func just return it
  if (_.isFunction(fn))
    return fn;

  // look up one of the out-of-box hooks like
  // 'loaded or 'dataNotFound' if the nameOrFn is a
  // string
  if (_.isString(fn)) {
    if (_.isFunction(Iron.Router.hooks[fn]))
      return Iron.Router.hooks[fn];
  }

  // we couldn't find it so throw an error
  throw new Error("No hook found named: " + nameOrFn);
};

/**
 *
 * Fetch the list of global hooks that apply to the given route name.
 * Hooks are defined by the .addHook() function above.
 *
 * @param {String} [type] one of IronRouter.HOOK_TYPES
 * @param {String} [name] the name of the route we are interested in
 * @return {[Function]} [hooks] an array of hooks to run
 * @api public
 *
 */

Router.prototype.getHooks = function(type, name) {
  var self = this;
  var hooks = [];

  _.each(this._globalHooks[type], function(hook) {
    var options = hook.options;

    if (options.except && _.include(options.except, name))
      return [];

    if (options.only && ! _.include(options.only, name))
      return [];

    hooks.push(hook.hook);
  });

  return hooks;
};

Router.HOOK_TYPES = [
  'onRun',
  'onRerun',
  'onBeforeAction',
  'onAfterAction',
  'onStop',

  // not technically a hook but we'll use it
  // in a similar way. This will cause waitOn
  // to be added as a method to the Router and then
  // it can be selectively applied to specific routes
  'waitOn',
  'subscriptions',

  // legacy hook types but we'll let them slide
  'load', // onRun
  'before', // onBeforeAction
  'after', // onAfterAction
  'unload' // onStop
];

/**
 * A namespace for hooks keyed by name.
 */
Router.hooks = {};


/**
 * A namespace for plugin functions keyed by name.
 */
Router.plugins = {};

/**
 * Auto add helper mtehods for all the hooks.
 */

_.each(Router.HOOK_TYPES, function (type) {
  Router.prototype[type] = function (hook, options) {
    this.addHook(type, hook, options);
  };
});

/**
 * Add a plugin to the router instance.
 */
Router.prototype.plugin = function (nameOrFn, options) {
  var func;

  if (typeof nameOrFn === 'function')
    func = nameOrFn;
  else if (typeof nameOrFn === 'string')
    func = Iron.Router.plugins[nameOrFn];

  if (!func)
    throw new Error("No plugin found named " + JSON.stringify(nameOrFn));

  // fn(router, options)
  func.call(this, this, options);

  return this;
};

Iron.Router = Router;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/hooks.js                                                                          //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
if (typeof Template !== 'undefined') {
  /**
   * The default anonymous loading template.
   */
  var defaultLoadingTemplate = new Template('DefaultLoadingTemplate', function () {
    return 'Loading...';
  });

  /**
   * The default anonymous data not found template.
   */
  var defaultDataNotFoundTemplate = new Template('DefaultDataNotFoundTemplate', function () {
    return 'Data not found...';
  });
}

/**
 * Automatically render a loading template into the main region if the
 * controller is not ready (i.e. this.ready() is false). If no loadingTemplate
 * is defined use some default text.
 */

Router.hooks.loading = function () {
  // if we're ready just pass through
  if (this.ready()) {
    this.next();
    return;
  }

  var template = this.lookupOption('loadingTemplate');
  this.render(template || defaultLoadingTemplate);
  this.renderRegions();
};

/**
 * Render a "data not found" template if a global data function returns a falsey
 * value
 */
Router.hooks.dataNotFound = function () {
  if (!this.ready()) {
    this.next();
    return;
  }

  var data = this.lookupOption('data');
  var dataValue;
  var template = this.lookupOption('notFoundTemplate');

  if (typeof data === 'function') {
    if (!(dataValue = data.call(this))) {
      this.render(template || defaultDataNotFoundTemplate);
      this.renderRegions();
      return;
    }
  }

  // okay never mind just pass along now
  this.next();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/helpers.js                                                                        //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var warn = Iron.utils.warn;
var DynamicTemplate = Iron.DynamicTemplate;
var debug = Iron.utils.debug('iron:router <helpers>');

/*****************************************************************************/
/* UI Helpers */
/*****************************************************************************/

/**
 * Render the Router to a specific location on the page instead of the
 * document.body. 
 */
UI.registerHelper('Router', new Blaze.Template('Router', function () {
  return Router.createView();
}));

/**
 * Returns a relative path given a route name, data context and optional query
 * and hash parameters.
 */
UI.registerHelper('pathFor', function (options) {
  var routeName;

  if (arguments.length > 1) {
    routeName = arguments[0];
    options = arguments[1] || {};
  } 

  var opts = options && options.hash;

  opts = opts || {};

  var path = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = routeName || opts.route;
  var data = _.extend({}, opts.data || this);

  var route = Router.routes[routeName];
  warn(route, "pathFor couldn't find a route named " + JSON.stringify(routeName));

  if (route) {
    _.each(route.handler.compiledUrl.keys, function (keyConfig) {
      var key = keyConfig.name;
      if (_.has(opts, key)) {
        data[key] = EJSON.clone(opts[key]);

        // so the option doesn't end up on the element as an attribute
        delete opts[key];
      }
    });

    path = route.path(data, {query: query, hash: hash});
  }

  return path;
});

/**
 * Returns a relative path given a route name, data context and optional query
 * and hash parameters.
 */
UI.registerHelper('urlFor', function (options) {
  var routeName;

  if (arguments.length > 1) {
    routeName = arguments[0];
    options = arguments[1] || {};
  } 

  var opts = options && options.hash;

  opts = opts || {};
  var url = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = routeName || opts.route;
  var data = _.extend({}, opts.data || this);

  var route = Router.routes[routeName];
  warn(route, "urlFor couldn't find a route named " + JSON.stringify(routeName));

  if (route) {
    _.each(route.handler.compiledUrl.keys, function (keyConfig) {
      var key = keyConfig.name;
      if (_.has(opts, key)) {
        data[key] = EJSON.clone(opts[key]);

        // so the option doesn't end up on the element as an attribute
        delete opts[key];
      }
    });

    url = route.url(data, {query: query, hash: hash});
  }

  return url;
});

/**
 * Create a link with optional content block.
 *
 * Example:
 *   {{#linkTo route="one" query="query" hash="hash" class="my-cls"}}
 *    <div>My Custom Link Content</div>
 *   {{/linkTo}}
 */
UI.registerHelper('linkTo', new Blaze.Template('linkTo', function () {
  var self = this;
  var opts = DynamicTemplate.getInclusionArguments(this);

  if (typeof opts !== 'object')
    throw new Error("linkTo options must be key value pairs such as {{#linkTo route='my.route.name'}}. You passed: " + JSON.stringify(opts));

  opts = opts || {};
  var path = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = opts.route;
  var data = _.extend({}, opts.data || DynamicTemplate.getParentDataContext(this));
  var route = Router.routes[routeName];
  var paramKeys;

  warn(route, "linkTo couldn't find a route named " + JSON.stringify(routeName));

  if (route) {
    _.each(route.handler.compiledUrl.keys, function (keyConfig) {
      var key = keyConfig.name;
      if (_.has(opts, key)) {
        data[key] = EJSON.clone(opts[key]);

        // so the option doesn't end up on the element as an attribute
        delete opts[key];
      }
    });

    path = route.path(data, {query: query, hash: hash});
  }

  // anything that isn't one of our keywords we'll assume is an attributed
  // intended for the <a> tag
  var attrs = _.omit(opts, 'route', 'query', 'hash', 'data');
  attrs.href = path;

  return Blaze.With(function () {
    return DynamicTemplate.getParentDataContext(self);
  }, function () {
    return HTML.A(attrs, self.templateContentBlock);
  });
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/router_client.js                                                                  //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
var MiddlewareStack = Iron.MiddlewareStack;
var Url = Iron.Url;
var Layout = Iron.Layout;
var assert = Iron.utils.assert;
var DEFAULT_NOT_FOUND_TEMPLATE = '__IronRouterNotFound__';
var NO_ROUTES_TEMPLATE = '__IronRouterNoRoutes__';

/**
 * Client specific initialization.
 */
Router.prototype.init = function (options) {
  var self = this;

  // the current RouteController from a dispatch
  self._currentController = null;

  // the current route
  self._currentRoute = null;

  // the current() dep
  self._currentDep = new Deps.Dependency;

  // the location computation
  self._locationComputation = null;

  // the ui layout for the router
  self._layout = new Layout({template: self.options.layoutTemplate});

  Meteor.startup(function () {
    setTimeout(function maybeAutoInsertRouter () {
      if (self.options.autoRender !== false)
        self.insert({el: document.body});
    });
  });
};

/**
 * Programmatically insert the router into document.body or a particular
 * element with {el: 'selector'}
 */
Router.prototype.insert = function (options) {
  this._layout.insert(options);
  return this;
};

/**
 * Returns a layout view that can be used in a UI helper to render the router
 * to a particular place.
 */
Router.prototype.createView = function () {
  return this._layout.create();
};

Router.prototype.lookupNotFoundTemplate = function () {
  if (this.options.notFoundTemplate)
    return this.options.notFoundTemplate;

  return (this.routes.length === 0) ? NO_ROUTES_TEMPLATE : DEFAULT_NOT_FOUND_TEMPLATE;
};

Router.prototype.lookupLayoutTemplate = function () {
  return this.options.layoutTemplate;
};

Router.prototype.dispatch = function (url, context, done) {
  var self = this;

  assert(typeof url === 'string', "expected url string in router dispatch");

  var controller = this._currentController;
  var route = this.findFirstRoute(url);
  var prevRoute = this._currentRoute;

  this._currentRoute = route;


  // even if we already have an existing controller we'll stop it
  // and start it again. But since the actual controller instance
  // hasn't changed, the helpers won't need to rerun.
  if (this._currentController)
    this._currentController.stop();

  //XXX Instead of this, let's consider making all RouteControllers
  //    singletons that get configured at dispatch. Will revisit this
  //    after v1.0.
  if (controller && route && prevRoute === route) {
    // this will change the parameters dep so anywhere you call
    // this.getParams will rerun if the parameters have changed
    controller.configureFromUrl(url, context);
  } else {
    // Looks like we're on a new route so we'll create a new
    // controller from scratch.
    controller = this.createController(url, context);
  }

  this._currentController = controller;

  controller.dispatch(self._stack, url, function onRouterDispatchCompleted (err) {
    if (err)
      throw err;
    else {
      if (!controller.isHandled()) {
        // if we aren't at the initial state, we haven't yet given the server
        //   a true chance to handle this URL. We'll try.
        //   if the server CAN'T handle the router, we'll be back,
        //   but as the very first route handled on the client,
        //   and so initial will be true.
        var state = Deps.nonreactive(function () { return controller.location.get().options.historyState; });

        if (state && state.initial === true) {
          // looks like there's no handlers so let's give a default
          // not found message! Use the layout defined in global config
          // if we have one.
          //
          // NOTE: this => controller
          this.layout(this.lookupOption('layoutTemplate'), {data: {url: this.url}});

          var errorTemplate;

          if (self.routes.length === 0) {
            errorTemplate = this.lookupOption('noRoutesTemplate') || NO_ROUTES_TEMPLATE;
          } else {
            errorTemplate = this.lookupOption('notFoundTemplate') || DEFAULT_NOT_FOUND_TEMPLATE;
          }

          this.render(errorTemplate, {data: {url: this.url}});
          this.renderRegions();

          // kind of janky but will work for now. this makes sure
          // that any downstream functions see that this route has been
          // handled so we don't get into an infinite loop with the
          // server.
          controller.isHandled = function () { return true; };
        }

        return done && done.call(controller);
      }
    }
  });

  // Note: even if the controller didn't actually change I change the
  // currentDep since if we did a dispatch, the url changed and that
  // means either we have a new controller OR the parameters for an
  // existing controller have changed.
  if (this._currentController == controller)
    this._currentDep.changed();

  return controller;
};

/**
 * The current controller object.
 */
Router.prototype.current = function () {
  this._currentDep.depend();
  return this._currentController;
};

/*
 * Scroll to a specific location on the page.
 * Overridable by applications that want to customize this behavior.
 */
Router.prototype._scrollToHash = function (hashValue) {
  try {
    var $target = $(hashValue);
    $('html, body').scrollTop($target.offset().top);
  } catch (e) {
    // in case the hashValue is bogus just bail out
  }
};

/**
 * Start reacting to location changes.
 */
Router.prototype.start = function () {
  var self = this;
  var prevLocation;

  self._locationComputation = Deps.autorun(function onLocationChange (c) {
    var controller;
    var loc = Iron.Location.get();
    var hash, pathname, search;
    var current = self._currentController;

    if (!current || (prevLocation && prevLocation.path !== loc.path)) {
      controller = self.dispatch(loc.href, null, function onRouterStartDispatchCompleted (error) {
        // if we're going to the server cancel the url change
        if (!this.isHandled()) {
          loc.cancelUrlChange();
          window.location = loc.path;
        }
      });
    } else {
      self._scrollToHash(loc.hash);
      // either the query or hash has changed so configure the current
      // controller again.
      current.configureFromUrl(loc.href);
    }

    prevLocation = loc;
  });
};

/**
 * Stop all computations and put us in a not started state.
 */
Router.prototype.stop = function () {
  if (!this._isStarted)
    return;

  if (this._locationComputation)
    this._locationComputation.stop();

  if (this._currentController)
    this._currentController.stop();

  this._isStarted = false;
};

/**
 * Go to a given path or route name, optinally pass parameters and options.
 *
 * Example:
 * router.go('itemsShowRoute', {_id: 5}, {hash: 'frag', query: 'string});
 */
Router.prototype.go = function (routeNameOrPath, params, options) {
  var self = this;
  var isPath = /^\/|http/;
  var path;

  options = options || {};

  if (isPath.test(routeNameOrPath)) {
    // it's a path!
    path = routeNameOrPath;
  } else {
    // it's a route name!
    var route = self.routes[routeNameOrPath];
    assert(route, "No route found named " + JSON.stringify(routeNameOrPath));
    path = route.path(params, _.extend(options, {throwOnMissingParams: true}));
  }

  // let Iron Location handle it and we'll pick up the change in
  // Iron.Location.get() computation.
  Iron.Location.go(path, options);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/plugins.js                                                                        //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
/**
 * Simple plugin wrapper around the loading hook.
 */
Router.plugins.loading = function (router, options) {
  router.onBeforeAction('loading', options);
};

/**
 * Simple plugin wrapper around the dataNotFound hook.
 */
Router.plugins.dataNotFound = function (router, options) {
  router.onBeforeAction('dataNotFound', options);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/global_router.js                                                                  //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
Router = new Iron.Router;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/iron_router/lib/template.templates.js                                                             //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //

Template.__checkName("__IronRouterNotFound__");
Template["__IronRouterNotFound__"] = new Template("Template.__IronRouterNotFound__", (function() {
  var view = this;
  return HTML.DIV({
    style: "width: 600px; margin: 0 auto; padding: 20px;"
  }, "\n    ", HTML.DIV({
    style: "font-size: 18pt; color: #999;"
  }, "\n      Oops, looks like there's no route on the client or the server for url: \"", Blaze.View("lookup:url", function() {
    return Spacebars.mustache(view.lookup("url"));
  }), '."\n    '), "\n  ");
}));

Template.__checkName("__IronRouterNoRoutes__");
Template["__IronRouterNoRoutes__"] = new Template("Template.__IronRouterNoRoutes__", (function() {
  var view = this;
  return HTML.Raw('<div style="font-family: helvetica; color: #777; max-width: 600px; margin: 20px auto;">\n      <h1 style="text-align: center; margin: 0; font-size: 48pt;">\n        iron:router\n      </h1>\n      <p style="text-align: center; font-size: 1.3em; color: red;">\n        No route definitions found.\n      </p>\n      <div style="margin: 50px 0px;">\n        <p>To create a route:</p>\n        <pre style="background: #f2f2f2; margin: 0; padding: 10px;">\nRouter.route(\'/\', function () {\n  this.render(\'Home\', {\n    data: function () { return Items.findOne({_id: this.params._id}); }\n  });\n});\n        </pre>\n        <p style="text-align:center"><small>To hide this page, set \'noRoutesTemplate\' in <a href="http://iron-meteor.github.io/iron-router/#global-default-options" target="_blank">Router.configure()</a></small></p>\n      </div>\n      <div style="margin: 50px 0px; text-align: center;">\n        Check it out on Github:<br>\n        <a href="https://github.com/iron-meteor/iron-router/" target="_blank">https://github.com/iron-meteor/iron-router/</a>\n        <br>\n        <br>\n        And check out the new Guide:<br>\n        <a href="https://iron-meteor.github.io/iron-router" target="_blank">\n          https://iron-meteor.github.io/iron-router\n        </a>\n      </div>\n    </div>');
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("iron:router", {
  Router: Router,
  RouteController: RouteController
});

})();

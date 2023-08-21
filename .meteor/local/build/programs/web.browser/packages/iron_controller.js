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
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Template = Package['templating-runtime'].Template;
var Iron = Package['iron:core'].Iron;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var WaitList, Controller;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/iron_controller/lib/wait_list.js                                               //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var assert = Iron.utils.assert;

/*****************************************************************************/
/* Private */
/*****************************************************************************/

/**
 * Returns an object of computation ids starting with
 * the current computation and including all ancestor
 * computations. The data structure is an object
 * so we can index by id and do quick checks.
 */
var parentComputations = function () {
  var list = {};
  var c = Deps.currentComputation;

  while (c) {
    list[String(c._id)] = true;
    c = c._parent;
  }

  return list;
};

/**
 * Check whether the user has called ready() and then called wait(). This
 * can cause a condition that can be simplified to this:
 *
 * dep = new Deps.Dependency;
 *
 * Deps.autorun(function () {
 *   dep.depend();
 *   dep.changed();
 * });
 */
var assertNoInvalidationLoop = function (dependency) {
  var parentComps = parentComputations();
  var depCompIds = _.keys(dependency._dependentsById);

  _.each(depCompIds, function (id) {
    assert(!parentComps[id], "\n\n\
You called wait() after calling ready() inside the same computation tree.\
\n\n\
You can fix this problem in two possible ways:\n\n\
1) Put all of your wait() calls before any ready() calls.\n\
2) Put your ready() call in its own computation with Deps.autorun."
    );
  });
};


/*****************************************************************************/
/* WaitList */
/*****************************************************************************/
/**
 * A WaitList tracks a list of reactive functions, each in its own computation.
 * The list is ready() when all of the functions return true. This list is not
 * ready (i.e. this.ready() === false) if at least one function returns false.
 *
 * You add functions by calling the wait(fn) method. Each function is run its
 * own computation. The ready() method is a reactive method but only calls the
 * deps changed function if the overall state of the list changes from true to
 * false or from false to true.
 */
WaitList = function () {
  this._readyDep = new Deps.Dependency;
  this._comps = [];
  this._notReadyCount = 0;
};

/**
 * Pass a function that returns true or false.
 */
WaitList.prototype.wait = function (fn) {
  var self = this;

  var activeComp = Deps.currentComputation;

  assertNoInvalidationLoop(self._readyDep);

  // break with parent computation and grab the new comp
  Deps.nonreactive(function () {

    // store the cached result so we can see if it's different from one run to
    // the next.
    var cachedResult = null;

    // create a computation for this handle
    var comp = Deps.autorun(function (c) {
      // let's get the new result coerced into a true or false value.
      var result = !!fn();

      var oldNotReadyCount = self._notReadyCount;

      // if it's the first run and we're false then inc
      if (c.firstRun && !result)
        self._notReadyCount++;
      else if (cachedResult !== null && result !== cachedResult && result === true)
        self._notReadyCount--;
      else if (cachedResult !== null && result !== cachedResult && result === false)
        self._notReadyCount++;

      cachedResult = result;

      if (oldNotReadyCount === 0 && self._notReadyCount > 0)
        self._readyDep.changed();
      else if (oldNotReadyCount > 0 && self._notReadyCount === 0)
        self._readyDep.changed();
    });

    self._comps.push(comp);

    if (activeComp) {
      activeComp.onInvalidate(function () {
        // keep the old computation and notReadyCount the same for one
        // flush cycle so that we don't end up in an intermediate state
        // where list.ready() is not correct.

        // keep the state the same until the flush cycle is complete
        Deps.afterFlush(function () {
          // stop the computation
          comp.stop();

          // remove the computation from the list
          self._comps.splice(_.indexOf(self._comps, comp), 1);

          if (cachedResult === false) {
            self._notReadyCount--;

            if (self._notReadyCount === 0)
              self._readyDep.changed();
          }
        });
      });
    }
  });
};

WaitList.prototype.ready = function () {
  this._readyDep.depend();
  return this._notReadyCount === 0;
};

WaitList.prototype.stop = function () {
  _.each(this._comps, function (c) { c.stop(); });
  this._comps = [];
};

Iron.WaitList = WaitList;

/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/iron_controller/lib/controller.js                                              //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var debug = Iron.utils.debug('iron:controller');
var Layout = Iron.Layout;
var DynamicTemplate = Iron.DynamicTemplate;

/*****************************************************************************/
/* Private */
/*****************************************************************************/
var bindData = function (value, thisArg) {
  return function () {
    return (typeof value === 'function') ? value.apply(thisArg, arguments) : value;
  };
};

/*****************************************************************************/
/* Controller */
/*****************************************************************************/
Controller = function (options) {
  var self = this;
  this.options = options || {};
  this._layout = this.options.layout || new Layout(this.options);
  this._isController = true;
  this._layout._setLookupHost(this);

  // grab the event map from the Controller constructor which was
  // set if the user does MyController.events({...});
  var eventMap = Controller._collectEventMaps.call(this.constructor);
  this._layout.events(eventMap, this);

  this.init(options);
};

/**
 * Set or get the layout's template and optionally its data context.
 */
Controller.prototype.layout = function (template, options) {
  var self = this;

  this._layout.template(template);

  // check whether options has a data property
  if (options && (_.has(options, 'data')))
    this._layout.data(bindData(options.data, this));

  return {
    data: function (val) {
      return self._layout.data(bindData(val, self));
    }
  };
};

/**
 * Render a template into a region of the layout.
 */
Controller.prototype.render = function (template, options) {
  var self = this;

  if (options && (typeof options.data !== 'undefined'))
    options.data = bindData(options.data, this);

  var tmpl = this._layout.render(template, options);

  // allow caller to do: this.render('MyTemplate').data(function () {...});
  return {
    data: function (func) {
      return tmpl.data(bindData(func, self));
    }
  };
};

/**
 * Begin recording rendered regions.
 */
Controller.prototype.beginRendering = function (onComplete) {
  return this._layout.beginRendering(onComplete);
};

/*****************************************************************************/
/* Controller Static Methods */
/*****************************************************************************/
/**
 * Inherit from Controller.
 *
 * Note: The inheritance function in Meteor._inherits is broken. Static
 * properties on functions don't get copied.
 */
Controller.extend = function (props) {
  return Iron.utils.extend(this, props); 
};

Controller.events = function (events) {
  this._eventMap = events;
  return this;
};

/**
 * Returns a single event map merged from super to child.
 * Called from the constructor function like this:
 *
 * this.constructor._collectEventMaps()
 */

var mergeStaticInheritedObjectProperty = function (ctor, prop) {
  var merge = {};

  if (ctor.__super__)
    _.extend(merge, mergeStaticInheritedObjectProperty(ctor.__super__.constructor, prop));
  
  return _.has(ctor, prop) ? _.extend(merge, ctor[prop]) : merge;
};

Controller._collectEventMaps = function () {
  return mergeStaticInheritedObjectProperty(this, '_eventMap');
};

// NOTE: helpers are not inherited from one controller to another, for now.
Controller._helpers = {};
Controller.helpers = function (helpers) {
  _.extend(this._helpers, helpers);
  return this;
};

/*****************************************************************************/
/* Global Helpers */
/*****************************************************************************/
if (typeof Template !== 'undefined') {
  /**
   * Returns the nearest controller for a template instance. You can call this
   * function from inside a template helper.
   *
   * Example:
   * Template.MyPage.helpers({
   *   greeting: function () {
   *    var controller = Iron.controller();
   *    return controller.state.get('greeting');
   *   }
   * });
   */
  Iron.controller = function () {
    //XXX establishes a reactive dependency which causes helper to run
    return DynamicTemplate.findLookupHostWithProperty(Blaze.getView(), '_isController');
  };

  /**
   * Find a lookup host with a state key and return it reactively if we have
   * it.
   */
  Template.registerHelper('get', function (key) {
    var controller = Iron.controller();
    if (controller && controller.state)
      return controller.state.get(key);
  });
}
/*****************************************************************************/
/* Namespacing */
/*****************************************************************************/
Iron.Controller = Controller;

/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/iron_controller/lib/controller_client.js                                       //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Layout = Iron.Layout;
var debug = Iron.utils.debug('iron:controller');
var defaultValue = Iron.utils.defaultValue;

/*****************************************************************************/
/* Private */
/*****************************************************************************/
var bindData = function (value, thisArg) {
  return function () {
    return (typeof value === 'function') ? value.apply(thisArg, arguments) : value;
  };
};

/*****************************************************************************/
/* Controller Client */
/*****************************************************************************/
/**
 * Client specific init code.
 */
Controller.prototype.init = function (options) {
  this._waitlist = new WaitList;
  this.state = new ReactiveDict;
};

/**
 * Insert the controller's layout into the DOM.
 */
Controller.prototype.insert = function (options) {
  return this._layout.insert.apply(this._layout, arguments);
};

/**
 * Add an item to the waitlist.
 */
Controller.prototype.wait = function (fn) {
  var self = this;

  if (!fn)
    // it's possible fn is just undefined but we'll just return instead
    // of throwing an error, to make it easier to call this function
    // with waitOn which might not return anything.
    return;

  if (_.isArray(fn)) {
    _.each(fn, function eachWait (fnOrHandle) {
      self.wait(fnOrHandle);
    });
  } else if (fn.ready) {
    this._waitlist.wait(function () { return fn.ready(); });
  } else {
    this._waitlist.wait(fn);
  }

  return this;
};

/**
 * Returns true if all items in the waitlist are ready.
 */
Controller.prototype.ready = function () {
  return this._waitlist.ready();
};

/**
 * Clean up the controller and stop the waitlist.
 */
Controller.prototype.stop = function () {
  this._waitlist.stop();
};

/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("iron:controller");

})();

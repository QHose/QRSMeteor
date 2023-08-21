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
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var Iron = Package['iron:core'].Iron;

/* Package-scope variables */
var urlToHashStyle, urlFromHashStyle, fixHashPath, State, Location;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/iron_location/lib/utils.js                                                                      //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
var Url = Iron.Url;
var HASH_PARAM_NAME='__hash__';

/**
 * Given:
 *   http://host:port/some/pathname/?query=string#bar
 *
 * Return:
 *   http://host:port#!some/pathname/?query=string&__hash__=bar
 */
urlToHashStyle = function (url) {
  var parts = Url.parse(url);
  var hash = parts.hash && parts.hash.replace('#', '');
  var search = parts.search;
  var pathname = parts.pathname;
  var root = parts.rootUrl; 

  // do we have another hash value that isn't a path?
  if (hash && hash.charAt(0) !== '!') {
    var hashQueryString = HASH_PARAM_NAME + '=' + hash;
    search = search ? (search + '&') : '?';
    search += hashQueryString;
    hash = '';
  }

  // if we don't already have a path on the hash create one
  if (! hash && pathname) {
    hash = '#!' + pathname.substring(1);
  } else if (hash) {
    hash = '#' + hash;
  }

  return [
    root,
    hash,
    search
  ].join('');
};

/**
 * Given a url that uses the hash style (see above), return a new url that uses
 * the hash path as a normal pathname.
 *
 * Given:
 *   http://host:port#!some/pathname/?query=string&__hash__=bar
 * 
 * Return:
 *   http://host:port/some/pathname/?query=string#bar
 */
urlFromHashStyle = function (url) {
  var parts = Url.parse(url);
  var pathname = parts.hash && parts.hash.replace('#!', '/');
  var search = parts.search;
  var root = parts.rootUrl;
  var hash;

  // see if there's a __hash__=value in the query string in which case put it 
  // back in the normal hash position and delete it from the search string.
  if (_.has(parts.queryObject, HASH_PARAM_NAME)) {
    hash = '#' + parts.queryObject[HASH_PARAM_NAME];
    delete parts.queryObject[HASH_PARAM_NAME];
  } else {
    hash = '';
  }

  return [
    root,
    pathname,
    Url.toQueryString(parts.queryObject),
    hash
  ].join('');
};

/**
 * Fix up a pathname intended for use with a hash path by moving any hash
 * fragments into the query string.
 */
fixHashPath = function (pathname) {
  var parts = Url.parse(pathname);
  var query = parts.queryObject;
  
  // if there's a hash in the path move that to the query string
  if (parts.hash) {
    query[HASH_PARAM_NAME] = parts.hash.replace('#', '')
  }

  return [
    '!',
    parts.pathname.substring(1),
    Url.toQueryString(query)
  ].join('');
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/iron_location/lib/state.js                                                                      //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
var Url = Iron.Url;

State = function (url, options) {
  _.extend(this, Url.parse(url), {options: options || {}});
};

// XXX: should this compare options (e.g. history.state?)
State.prototype.equals = function (other) {
  if (!other)
    return false;

  if (!(other instanceof State))
    return false;

  if (other.pathname == this.pathname &&
     other.search == this.search &&
     other.hash == this.hash &&
     other.options.historyState === this.options.historyState)
    return true;

  return false;
};

State.prototype.isCancelled = function () {
  return !!this._isCancelled;
};

State.prototype.cancelUrlChange = function () {
  this._isCancelled = true;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/iron_location/lib/location.js                                                                   //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Url = Iron.Url;

/*****************************************************************************/
/* Private */
/*****************************************************************************/
var current = null;
var dep = new Deps.Dependency;
var handlers = {go: [], popState: []};

var isIE9 = function () {
  return /MSIE 9/.test(navigator.appVersion);
};

var isIE8 = function () {
  return /MSIE 8/.test(navigator.appVersion);
};

var usingAppcache = function() {
  return !! Package.appcache;
}

var replaceStateUndefined = function() {
  return (typeof history === "undefined")  || (typeof history.pushState !== "function");
}

var shouldUseHashPaths = function () {
  return Location.options.useHashPaths || isIE8() || isIE9() || usingAppcache() || replaceStateUndefined();
};

var isUsingHashPaths = function () {
  return !!Location.options.useHashPaths;
};

var runHandlers = function(name, state) {
  _.each(handlers[name], function(cb) {
    cb.call(state);
  });
}

var set = function (state) {
  if (!(state instanceof State))
    throw new Error("Expected a State instance");

  if (!state.equals(current)) {
    current = state;
    dep.changed();

    // return true to indicate state was set to a new value.
    return true;
  }

  // state not set
  return false;
};

var setStateFromEventHandler = function () {
  var href = location.href;
  var state;

  if (isUsingHashPaths()) {
    state = new State(urlFromHashStyle(href));
  } else {
    state = new State(href, {historyState: history.state});
  }

  runHandlers('popState', state);
  set(state);
};

var fireOnClick = function (e) {
  var handler = onClickHandler;
  handler && handler(e);
};

/**
 * Go to a url.
 */
var go = function (url, options) {
  options = options || {};

  var state = new State(url, options);

  runHandlers('go', state);

  if (set(state)) {
    Deps.afterFlush(function () {
      // if after we've flushed if nobody has cancelled the state then change
      // the url.
      if (!state.isCancelled()) {
        if (isUsingHashPaths()) {
          location.hash = fixHashPath(url);
        } else {
          if (options.replaceState === true)
            history.replaceState(options.historyState, null, url);
          else
            history.pushState(options.historyState, null, url);
        }
      }
    });
  }
};

var onClickHandler = function (e) {
  try {
    var el = e.currentTarget;
    var href = el.href;
    var path = el.pathname + el.search + el.hash;

    // ie9 omits the leading slash in pathname - so patch up if it's missing
    path = path.replace(/(^\/?)/,"/");

    // haven't been cancelled already
    if (e.isDefaultPrevented()) {
      e.preventDefault();
      return;
    }

    // with no meta key pressed
    if (e.metaKey || e.ctrlKey || e.shiftKey)
      return;

    // aren't targeting a new window
    if (el.target)
      return;

    // aren't external to the app
    if (!Url.isSameOrigin(href, location.href))
      return;

    // note that we _do_ handle links which point to the current URL
    // and links which only change the hash.
    e.preventDefault();

    // manage setting the new state and maybe pushing onto the pushState stack
    go(path);
  } catch (err) {
    // make sure we can see any errors that are thrown before going to the
    // server.
    e.preventDefault();
    throw err;
  }
};

/*****************************************************************************/
/* Location API */
/*****************************************************************************/

/**
 * Main Location object. Reactively respond to url changes. Normalized urls
 * between hash style (ie8/9) and normal style using pushState.
 */
Location = {};

/**
 * Default options.
 */
Location.options = {
  linkSelector: 'a[href]',
  useHashPaths: false
};

/**
 * Set options on the Location object.
 */
Location.configure = function (options) {
  _.extend(this.options, options || {});
};

/**
 * Reactively get the current state.
 */
Location.get = function () {
  dep.depend();
  return current;
};

/**
 * Set the initial state and start listening for url events.
 */
Location.start = function () {
  if (this._isStarted)
    return;

  var parts = Url.parse(location.href);

  // if we're using the /#/items/5 style then start off at the root url but
  // store away the pathname, query and hash into the hash fragment so when the
  // client gets the response we can render the correct page.
  if (shouldUseHashPaths()) {
    // if we have any pathname like /items/5 take a trip to the server to get us
    // back a root url.
    if (parts.pathname.length > 1) {
      var url = urlToHashStyle(location.href);
      window.location = url;
    }

    // ok good to go
    this.configure({useHashPaths: true});
  }
  // set initial state
  var href = location.href;

  if (isUsingHashPaths()) {
    var state = new State(urlFromHashStyle(href));
    set(state);
  } else {
    // if we started at a URL in the /#!items/5 style then we have picked up a
    // URL from an non-HTML5 user. Let's redirect to /items/5
    if (parts.hash.replace('#', '')[0] === '!') {
      var href = urlFromHashStyle(href);
    }
    
    // store the fact that this is the first route we hit.
    // this serves two purposes
    //   1. We can tell when we've reached an unhandled route and need to show a
    //      404 (rather than bailing out to let the server handle it)
    //   2. Users can look at the state to tell if the history.back() will stay
    //      inside the app (this is important for mobile apps).
    var historyState = {initial: true}
    history.replaceState(historyState, null, href);
    var state = new State(href, {historyState: historyState});
    set(state);
  }

  // bind the event handlers
  $(window).on('popstate.iron-location', setStateFromEventHandler);
  $(window).on('hashchange.iron-location', setStateFromEventHandler);

  // make sure we have a document before binding the click handler
  Meteor.startup(function () {
    $(document).on('click.iron-location', Location.options.linkSelector, fireOnClick);
  });
  
  this._isStarted = true;
};

/**
 * Stop the Location from listening for url changes.
 */
Location.stop = function () {
  if (!this._isStarted)
    return;

  $(window).on('popstate.iron-location');
  $(window).on('hashchange.iron-location');
  $(document).off('click.iron-location');

  this._isStarted = false;
};

/**
 * Assign a different click handler.
 */
Location.onClick = function (fn) {
  onClickHandler = fn;
};

/**
 * Go to a new url.
 */
Location.go = function (url, options) {
  return go(url, options);
};

/**
 * Run the supplied callback whenever we "go" to a new location.
 *
 * Argument: cb - function, called with no arguments,
 * `this` is the state that's being set, _may_ be modified.
 */
Location.onGo = function (cb) {
  handlers.go.push(cb);
};

/**
 * Run the supplied callback whenever we "popState" to an old location.
 *
 * Argument: cb - function, called with no arguments,
 * `this` is the state that's being set, _may_ be modified.
 */
Location.onPopState = function (cb) {
  handlers.popState.push(cb);
};

/**
 * Automatically start Iron.Location
 */
Location.start();

/*****************************************************************************/
/* Namespacing */
/*****************************************************************************/
Iron.Location = Location;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("iron:location", {
  urlToHashStyle: urlToHashStyle,
  urlFromHashStyle: urlFromHashStyle
});

})();

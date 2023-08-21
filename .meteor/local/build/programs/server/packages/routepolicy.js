(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var RoutePolicy;

var require = meteorInstall({"node_modules":{"meteor":{"routepolicy":{"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/routepolicy/main.js                                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  RoutePolicy: () => RoutePolicy
});
let RoutePolicyConstructor;
module.watch(require("./routepolicy"), {
  default(v) {
    RoutePolicyConstructor = v;
  }

}, 0);
const RoutePolicy = new RoutePolicyConstructor();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routepolicy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/routepolicy/routepolicy.js                                                                         //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  default: () => RoutePolicy
});

class RoutePolicy {
  constructor() {
    // maps prefix to a type
    this.urlPrefixTypes = {};
  }

  urlPrefixMatches(urlPrefix, url) {
    return url.startsWith(urlPrefix);
  }

  checkType(type) {
    if (!['network', 'static-online'].includes(type)) {
      return 'the route type must be "network" or "static-online"';
    }

    return null;
  }

  checkUrlPrefix(urlPrefix, type) {
    if (!urlPrefix.startsWith('/')) {
      return 'a route URL prefix must begin with a slash';
    }

    if (urlPrefix === '/') {
      return 'a route URL prefix cannot be /';
    }

    const existingType = this.urlPrefixTypes[urlPrefix];

    if (existingType && existingType !== type) {
      return `the route URL prefix ${urlPrefix} has already been declared ` + `to be of type ${existingType}`;
    }

    return null;
  }

  checkForConflictWithStatic(urlPrefix, type, _testManifest) {
    if (type === 'static-online') {
      return null;
    }

    if (!Package.webapp || !Package.webapp.WebApp || !Package.webapp.WebApp.clientPrograms || !Package.webapp.WebApp.clientPrograms[Package.webapp.WebApp.defaultArch].manifest) {
      // Hack: If we don't have a manifest, deal with it
      // gracefully. This lets us load livedata into a nodejs
      // environment that doesn't have a HTTP server (eg, a
      // command-line tool).
      return null;
    }

    const WebApp = Package.webapp.WebApp;
    const manifest = _testManifest || WebApp.clientPrograms[WebApp.defaultArch].manifest;
    const conflict = manifest.find(resource => resource.type === 'static' && resource.where === 'client' && this.urlPrefixMatches(urlPrefix, resource.url));

    if (conflict) {
      return `static resource ${conflict.url} conflicts with ${type} ` + `route ${urlPrefix}`;
    }

    return null;
  }

  declare(urlPrefix, type) {
    const problem = this.checkType(type) || this.checkUrlPrefix(urlPrefix, type) || this.checkForConflictWithStatic(urlPrefix, type);

    if (problem) {
      throw new Error(problem);
    } // TODO overlapping prefixes, e.g. /foo/ and /foo/bar/


    this.urlPrefixTypes[urlPrefix] = type;
  }

  isValidUrl(url) {
    return url.startsWith('/');
  }

  classify(url) {
    if (!this.isValidUrl(url)) {
      throw new Error(`url must be a relative URL: ${url}`);
    }

    const prefix = Object.keys(this.urlPrefixTypes).find(prefix => this.urlPrefixMatches(prefix, url));
    return prefix ? this.urlPrefixTypes[prefix] : null;
  }

  urlPrefixesFor(type) {
    return Object.entries(this.urlPrefixTypes).filter(([_prefix, _type]) => _type === type).map(([_prefix]) => _prefix).sort();
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/routepolicy/main.js");

/* Exports */
Package._define("routepolicy", exports, {
  RoutePolicy: RoutePolicy
});

})();

//# sourceURL=meteor://💻app/packages/routepolicy.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm91dGVwb2xpY3kvbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm91dGVwb2xpY3kvcm91dGVwb2xpY3kuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiUm91dGVQb2xpY3kiLCJSb3V0ZVBvbGljeUNvbnN0cnVjdG9yIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJjb25zdHJ1Y3RvciIsInVybFByZWZpeFR5cGVzIiwidXJsUHJlZml4TWF0Y2hlcyIsInVybFByZWZpeCIsInVybCIsInN0YXJ0c1dpdGgiLCJjaGVja1R5cGUiLCJ0eXBlIiwiaW5jbHVkZXMiLCJjaGVja1VybFByZWZpeCIsImV4aXN0aW5nVHlwZSIsImNoZWNrRm9yQ29uZmxpY3RXaXRoU3RhdGljIiwiX3Rlc3RNYW5pZmVzdCIsIlBhY2thZ2UiLCJ3ZWJhcHAiLCJXZWJBcHAiLCJjbGllbnRQcm9ncmFtcyIsImRlZmF1bHRBcmNoIiwibWFuaWZlc3QiLCJjb25mbGljdCIsImZpbmQiLCJyZXNvdXJjZSIsIndoZXJlIiwiZGVjbGFyZSIsInByb2JsZW0iLCJFcnJvciIsImlzVmFsaWRVcmwiLCJjbGFzc2lmeSIsInByZWZpeCIsIk9iamVjdCIsImtleXMiLCJ1cmxQcmVmaXhlc0ZvciIsImVudHJpZXMiLCJmaWx0ZXIiLCJfcHJlZml4IiwiX3R5cGUiLCJtYXAiLCJzb3J0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsZUFBWSxNQUFJQTtBQUFqQixDQUFkO0FBQTZDLElBQUlDLHNCQUFKO0FBQTJCSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDSiw2QkFBdUJJLENBQXZCO0FBQXlCOztBQUFyQyxDQUF0QyxFQUE2RSxDQUE3RTtBQUNqRSxNQUFNTCxj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LENBQWUsR0FBZixDQUFQO0FBQ0Q7O0FBRURzQixXQUFTdkIsR0FBVCxFQUFjO0FBQ1osUUFBSSxDQUFDLEtBQUtzQixVQUFMLENBQWdCdEIsR0FBaEIsQ0FBTCxFQUEyQjtBQUN6QixZQUFNLElBQUlxQixLQUFKLENBQVcsK0JBQThCckIsR0FBSSxFQUE3QyxDQUFOO0FBQ0Q7O0FBRUQsVUFBTXdCLFNBQVNDLE9BQU9DLElBQVAsQ0FBWSxLQUFLN0IsY0FBakIsRUFBaUNtQixJQUFqQyxDQUFzQ1EsVUFDbkQsS0FBSzFCLGdCQUFMLENBQXNCMEIsTUFBdEIsRUFBOEJ4QixHQUE5QixDQURhLENBQWY7QUFJQSxXQUFPd0IsU0FBUyxLQUFLM0IsY0FBTCxDQUFvQjJCLE1BQXBCLENBQVQsR0FBdUMsSUFBOUM7QUFDRDs7QUFFREcsaUJBQWV4QixJQUFmLEVBQXFCO0FBQ25CLFdBQU9zQixPQUFPRyxPQUFQLENBQWUsS0FBSy9CLGNBQXBCLEVBQ0pnQyxNQURJLENBQ0csQ0FBQyxDQUFDQyxPQUFELEVBQVVDLEtBQVYsQ0FBRCxLQUFzQkEsVUFBVTVCLElBRG5DLEVBRUo2QixHQUZJLENBRUEsQ0FBQyxDQUFDRixPQUFELENBQUQsS0FBZUEsT0FGZixFQUdKRyxJQUhJLEVBQVA7QUFJRDs7QUFyRzhCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvdXRlcG9saWN5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVmYXVsdCBhcyBSb3V0ZVBvbGljeUNvbnN0cnVjdG9yIH0gZnJvbSAnLi9yb3V0ZXBvbGljeSc7XG5leHBvcnQgY29uc3QgUm91dGVQb2xpY3kgPSBuZXcgUm91dGVQb2xpY3lDb25zdHJ1Y3RvcigpO1xuIiwiLy8gSW4gYWRkaXRpb24gdG8gbGlzdGluZyBzcGVjaWZpYyBmaWxlcyB0byBiZSBjYWNoZWQsIHRoZSBicm93c2VyXG4vLyBhcHBsaWNhdGlvbiBjYWNoZSBtYW5pZmVzdCBhbGxvd3MgVVJMcyB0byBiZSBkZXNpZ25hdGVkIGFzIE5FVFdPUktcbi8vIChhbHdheXMgZmV0Y2hlZCBmcm9tIHRoZSBJbnRlcm5ldCkgYW5kIEZBTExCQUNLICh3aGljaCB3ZSB1c2UgdG9cbi8vIHNlcnZlIGFwcCBIVE1MIG9uIGFyYml0cmFyeSBVUkxzKS5cbi8vXG4vLyBUaGUgbGltaXRhdGlvbiBvZiB0aGUgbWFuaWZlc3QgZmlsZSBmb3JtYXQgaXMgdGhhdCB0aGUgZGVzaWduYXRpb25zXG4vLyBhcmUgYnkgcHJlZml4IG9ubHk6IGlmIFwiL2Zvb1wiIGlzIGRlY2xhcmVkIE5FVFdPUksgdGhlbiBcIi9mb29iYXJcIlxuLy8gd2lsbCBhbHNvIGJlIHRyZWF0ZWQgYXMgYSBuZXR3b3JrIHJvdXRlLlxuLy9cbi8vIFJvdXRlUG9saWN5IGlzIGEgbG93LWxldmVsIEFQSSBmb3IgZGVjbGFyaW5nIHRoZSByb3V0ZSB0eXBlIG9mIFVSTCBwcmVmaXhlczpcbi8vXG4vLyBcIm5ldHdvcmtcIjogZm9yIG5ldHdvcmsgcm91dGVzIHRoYXQgc2hvdWxkIG5vdCBjb25mbGljdCB3aXRoIHN0YXRpY1xuLy8gcmVzb3VyY2VzLiAgKEZvciBleGFtcGxlLCBpZiBcIi9zb2NranMvXCIgaXMgYSBuZXR3b3JrIHJvdXRlLCB3ZVxuLy8gc2hvdWxkbid0IGhhdmUgXCIvc29ja2pzL3JlZC1zb2NrLmpwZ1wiIGFzIGEgc3RhdGljIHJlc291cmNlKS5cbi8vXG4vLyBcInN0YXRpYy1vbmxpbmVcIjogZm9yIHN0YXRpYyByZXNvdXJjZXMgd2hpY2ggc2hvdWxkIG5vdCBiZSBjYWNoZWQgaW5cbi8vIHRoZSBhcHAgY2FjaGUuICBUaGlzIGlzIGltcGxlbWVudGVkIGJ5IGFsc28gYWRkaW5nIHRoZW0gdG8gdGhlXG4vLyBORVRXT1JLIHNlY3Rpb24gKGFzIG90aGVyd2lzZSB0aGUgYnJvd3NlciB3b3VsZCByZWNlaXZlIGFwcCBIVE1MXG4vLyBmb3IgdGhlbSBiZWNhdXNlIG9mIHRoZSBGQUxMQkFDSyBzZWN0aW9uKSwgYnV0IHN0YXRpYy1vbmxpbmUgcm91dGVzXG4vLyBkb24ndCBuZWVkIHRvIGJlIGNoZWNrZWQgZm9yIGNvbmZsaWN0IHdpdGggc3RhdGljIHJlc291cmNlcy5cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSb3V0ZVBvbGljeSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIG1hcHMgcHJlZml4IHRvIGEgdHlwZVxuICAgIHRoaXMudXJsUHJlZml4VHlwZXMgPSB7fTtcbiAgfVxuXG4gIHVybFByZWZpeE1hdGNoZXModXJsUHJlZml4LCB1cmwpIHtcbiAgICByZXR1cm4gdXJsLnN0YXJ0c1dpdGgodXJsUHJlZml4KTtcbiAgfVxuXG4gIGNoZWNrVHlwZSh0eXBlKSB7XG4gICAgaWYgKCFbJ25ldHdvcmsnLCAnc3RhdGljLW9ubGluZSddLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICByZXR1cm4gJ3RoZSByb3V0ZSB0eXBlIG11c3QgYmUgXCJuZXR3b3JrXCIgb3IgXCJzdGF0aWMtb25saW5lXCInO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNoZWNrVXJsUHJlZml4KHVybFByZWZpeCwgdHlwZSkge1xuICAgIGlmICghdXJsUHJlZml4LnN0YXJ0c1dpdGgoJy8nKSkge1xuICAgICAgcmV0dXJuICdhIHJvdXRlIFVSTCBwcmVmaXggbXVzdCBiZWdpbiB3aXRoIGEgc2xhc2gnO1xuICAgIH1cblxuICAgIGlmICh1cmxQcmVmaXggPT09ICcvJykge1xuICAgICAgcmV0dXJuICdhIHJvdXRlIFVSTCBwcmVmaXggY2Fubm90IGJlIC8nO1xuICAgIH1cblxuICAgIGNvbnN0IGV4aXN0aW5nVHlwZSA9IHRoaXMudXJsUHJlZml4VHlwZXNbdXJsUHJlZml4XTtcbiAgICBpZiAoZXhpc3RpbmdUeXBlICYmIGV4aXN0aW5nVHlwZSAhPT0gdHlwZSkge1xuICAgICAgcmV0dXJuIGB0aGUgcm91dGUgVVJMIHByZWZpeCAke3VybFByZWZpeH0gaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZCBgICtcbiAgICAgICAgYHRvIGJlIG9mIHR5cGUgJHtleGlzdGluZ1R5cGV9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNoZWNrRm9yQ29uZmxpY3RXaXRoU3RhdGljKHVybFByZWZpeCwgdHlwZSwgX3Rlc3RNYW5pZmVzdCkge1xuICAgIGlmICh0eXBlID09PSAnc3RhdGljLW9ubGluZScpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghUGFja2FnZS53ZWJhcHAgfHxcbiAgICAgICAgIVBhY2thZ2Uud2ViYXBwLldlYkFwcCB8fFxuICAgICAgICAhUGFja2FnZS53ZWJhcHAuV2ViQXBwLmNsaWVudFByb2dyYW1zIHx8XG4gICAgICAgICFQYWNrYWdlLndlYmFwcC5XZWJBcHAuY2xpZW50UHJvZ3JhbXNbXG4gICAgICAgICAgUGFja2FnZS53ZWJhcHAuV2ViQXBwLmRlZmF1bHRBcmNoXS5tYW5pZmVzdCkge1xuICAgICAgLy8gSGFjazogSWYgd2UgZG9uJ3QgaGF2ZSBhIG1hbmlmZXN0LCBkZWFsIHdpdGggaXRcbiAgICAgIC8vIGdyYWNlZnVsbHkuIFRoaXMgbGV0cyB1cyBsb2FkIGxpdmVkYXRhIGludG8gYSBub2RlanNcbiAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIGEgSFRUUCBzZXJ2ZXIgKGVnLCBhXG4gICAgICAvLyBjb21tYW5kLWxpbmUgdG9vbCkuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBXZWJBcHAgPSBQYWNrYWdlLndlYmFwcC5XZWJBcHA7XG4gICAgY29uc3QgbWFuaWZlc3QgPVxuICAgICAgX3Rlc3RNYW5pZmVzdCB8fCBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbV2ViQXBwLmRlZmF1bHRBcmNoXS5tYW5pZmVzdDtcbiAgICBjb25zdCBjb25mbGljdCA9IG1hbmlmZXN0LmZpbmQocmVzb3VyY2UgPT4gKFxuICAgICAgcmVzb3VyY2UudHlwZSA9PT0gJ3N0YXRpYycgJiZcbiAgICAgIHJlc291cmNlLndoZXJlID09PSAnY2xpZW50JyAmJlxuICAgICAgdGhpcy51cmxQcmVmaXhNYXRjaGVzKHVybFByZWZpeCwgcmVzb3VyY2UudXJsKVxuICAgICkpO1xuXG4gICAgaWYgKGNvbmZsaWN0KSB7XG4gICAgICByZXR1cm4gYHN0YXRpYyByZXNvdXJjZSAke2NvbmZsaWN0LnVybH0gY29uZmxpY3RzIHdpdGggJHt0eXBlfSBgICtcbiAgICAgICAgYHJvdXRlICR7dXJsUHJlZml4fWA7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZGVjbGFyZSh1cmxQcmVmaXgsIHR5cGUpIHtcbiAgICBjb25zdCBwcm9ibGVtID1cbiAgICAgIHRoaXMuY2hlY2tUeXBlKHR5cGUpIHx8XG4gICAgICB0aGlzLmNoZWNrVXJsUHJlZml4KHVybFByZWZpeCwgdHlwZSkgfHxcbiAgICAgIHRoaXMuY2hlY2tGb3JDb25mbGljdFdpdGhTdGF0aWModXJsUHJlZml4LCB0eXBlKTtcbiAgICBpZiAocHJvYmxlbSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHByb2JsZW0pO1xuICAgIH1cbiAgICAvLyBUT0RPIG92ZXJsYXBwaW5nIHByZWZpeGVzLCBlLmcuIC9mb28vIGFuZCAvZm9vL2Jhci9cbiAgICB0aGlzLnVybFByZWZpeFR5cGVzW3VybFByZWZpeF0gPSB0eXBlO1xuICB9XG5cbiAgaXNWYWxpZFVybCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnN0YXJ0c1dpdGgoJy8nKTtcbiAgfVxuXG4gIGNsYXNzaWZ5KHVybCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkVXJsKHVybCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdXJsIG11c3QgYmUgYSByZWxhdGl2ZSBVUkw6ICR7dXJsfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHByZWZpeCA9IE9iamVjdC5rZXlzKHRoaXMudXJsUHJlZml4VHlwZXMpLmZpbmQocHJlZml4ID0+XG4gICAgICB0aGlzLnVybFByZWZpeE1hdGNoZXMocHJlZml4LCB1cmwpXG4gICAgKTtcblxuICAgIHJldHVybiBwcmVmaXggPyB0aGlzLnVybFByZWZpeFR5cGVzW3ByZWZpeF0gOiBudWxsO1xuICB9XG5cbiAgdXJsUHJlZml4ZXNGb3IodHlwZSkge1xuICAgIHJldHVybiBPYmplY3QuZW50cmllcyh0aGlzLnVybFByZWZpeFR5cGVzKVxuICAgICAgLmZpbHRlcigoW19wcmVmaXgsIF90eXBlXSkgPT4gX3R5cGUgPT09IHR5cGUpXG4gICAgICAubWFwKChbX3ByZWZpeF0pID0+IF9wcmVmaXgpXG4gICAgICAuc29ydCgpO1xuICB9XG59XG4iXX0=

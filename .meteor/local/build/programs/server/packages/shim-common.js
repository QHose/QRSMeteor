(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"shim-common":{"server.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/shim-common/server.js                                                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
"use strict";

module.export({
  hasOwn: () => hasOwn,
  doNotNeedShim: () => doNotNeedShim,
  makeScript: () => makeScript
});
const hasOwn = Object.prototype.hasOwnProperty;

function doNotNeedShim( // The HTTP request object, as exposed (for example) by sink.request.
request, // Map from lowercase browser names to the minimum major version of that
minimumMajorVersions = {}, // Optional URL query parameter that can be used to force the shim to be
queryForceParam) {
  const {
    browser,
    url
  } = request;

  if (queryForceParam) {
    const query = url && url.query;
    const forced = query && query[queryForceParam];

    if (forced) {
      return false;
    }
  }

  if (browser && hasOwn.call(minimumMajorVersions, browser.name) && browser.major >= minimumMajorVersions[browser.name]) {
    return true;
  }

  return false;
}

function makeScript(packagePath) {
  return '\n<script src="/packages/' + packagePath + (Meteor.isProduction ? ".min.js" : ".js") + '"></script>';
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/shim-common/server.js");

/* Exports */
Package._define("shim-common", exports);

})();

//# sourceURL=meteor://💻app/packages/shim-common.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc2hpbS1jb21tb24vc2VydmVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsImhhc093biIsImRvTm90TmVlZFNoaW0iLCJtYWtlU2NyaXB0IiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJyZXF1ZXN0IiwibWluaW11bU1ham9yVmVyc2lvbnMiLCJxdWVyeUZvcmNlUGFyYW0iLCJicm93c2VyIiwidXJsIiwicXVlcnkiLCJmb3JjZWQiLCJjYWxsIiwibmFtZSIsIm1ham9yIiwicGFja2FnZVBhdGgiLCJNZXRlb3IiLCJpc1Byb2R1Y3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLFVBQU8sTUFBSUEsTUFBWjtBQUFtQkMsaUJBQWMsTUFBSUEsYUFBckM7QUFBbURDLGNBQVcsTUFBSUE7QUFBbEUsQ0FBZDtBQUVPLE1BQU1GLFNBQVNHLE9BQU9DLFNBQVAsQ0FBaUJDLGNBQWhDOztBQUVBLFNBQVNKLGFBQVQsRUFDTDtBQUNBSyxPQUZLLEVBR0w7QUFFQUMsdUJBQXVCLEVBTGxCLEVBTUw7QUFFQUMsZUFSSyxFQVNMO0FBQ0EsUUFBTTtBQUFFQyxXQUFGO0FBQVdDO0FBQVgsTUFBbUJKLE9BQXpCOztBQUVBLE1BQUlFLGVBQUosRUFBcUI7QUFDbkIsVUFBTUcsUUFBUUQsT0FBT0EsSUFBSUMsS0FBekI7QUFDQSxVQUFNQyxTQUFTRCxTQUFTQSxNQUFNSCxlQUFOLENBQXhCOztBQUNBLFFBQUlJLE1BQUosRUFBWTtBQUNWLGFBQU8sS0FBUDtBQUNEO0FBQ0Y7O0FBRUQsTUFBSUgsV0FDQVQsT0FBT2EsSUFBUCxDQUFZTixvQkFBWixFQUFrQ0UsUUFBUUssSUFBMUMsQ0FEQSxJQUVBTCxRQUFRTSxLQUFSLElBQWlCUixxQkFBcUJFLFFBQVFLLElBQTdCLENBRnJCLEVBRXlEO0FBQ3ZELFdBQU8sSUFBUDtBQUNEOztBQUVELFNBQU8sS0FBUDtBQUNEOztBQUVNLFNBQVNaLFVBQVQsQ0FBb0JjLFdBQXBCLEVBQWlDO0FBQ3RDLFNBQU8sOEJBQThCQSxXQUE5QixJQUNMQyxPQUFPQyxZQUFQLEdBQXNCLFNBQXRCLEdBQWtDLEtBRDdCLElBRUgsYUFGSjtBQUdELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3NoaW0tY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydCBjb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5leHBvcnQgZnVuY3Rpb24gZG9Ob3ROZWVkU2hpbShcbiAgLy8gVGhlIEhUVFAgcmVxdWVzdCBvYmplY3QsIGFzIGV4cG9zZWQgKGZvciBleGFtcGxlKSBieSBzaW5rLnJlcXVlc3QuXG4gIHJlcXVlc3QsXG4gIC8vIE1hcCBmcm9tIGxvd2VyY2FzZSBicm93c2VyIG5hbWVzIHRvIHRoZSBtaW5pbXVtIG1ham9yIHZlcnNpb24gb2YgdGhhdFxuICAvLyBicm93c2VyIHRoYXQgbm8gbG9uZ2VyIG5lZWRzIHRoZSBzaGltLlxuICBtaW5pbXVtTWFqb3JWZXJzaW9ucyA9IHt9LFxuICAvLyBPcHRpb25hbCBVUkwgcXVlcnkgcGFyYW1ldGVyIHRoYXQgY2FuIGJlIHVzZWQgdG8gZm9yY2UgdGhlIHNoaW0gdG8gYmVcbiAgLy8gaW5qZWN0ZWQgaW50byB0aGUgSFRUUCByZXNwb25zZS5cbiAgcXVlcnlGb3JjZVBhcmFtLFxuKSB7XG4gIGNvbnN0IHsgYnJvd3NlciwgdXJsIH0gPSByZXF1ZXN0O1xuXG4gIGlmIChxdWVyeUZvcmNlUGFyYW0pIHtcbiAgICBjb25zdCBxdWVyeSA9IHVybCAmJiB1cmwucXVlcnk7XG4gICAgY29uc3QgZm9yY2VkID0gcXVlcnkgJiYgcXVlcnlbcXVlcnlGb3JjZVBhcmFtXTtcbiAgICBpZiAoZm9yY2VkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJyb3dzZXIgJiZcbiAgICAgIGhhc093bi5jYWxsKG1pbmltdW1NYWpvclZlcnNpb25zLCBicm93c2VyLm5hbWUpICYmXG4gICAgICBicm93c2VyLm1ham9yID49IG1pbmltdW1NYWpvclZlcnNpb25zW2Jyb3dzZXIubmFtZV0pIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VTY3JpcHQocGFja2FnZVBhdGgpIHtcbiAgcmV0dXJuICdcXG48c2NyaXB0IHNyYz1cIi9wYWNrYWdlcy8nICsgcGFja2FnZVBhdGggKyAoXG4gICAgTWV0ZW9yLmlzUHJvZHVjdGlvbiA/IFwiLm1pbi5qc1wiIDogXCIuanNcIlxuICApICsgJ1wiPjwvc2NyaXB0Pic7XG59XG4iXX0=

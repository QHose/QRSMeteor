(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"es5-shim":{"server.js":function(require){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/es5-shim/server.js                                       //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
const { onPageLoad } = require("meteor/server-render");
const {
  doNotNeedShim,
  makeScript,
} = require("meteor/shim-common");

const minimumMajorVersions = {
  chrome: 23,
  firefox: 21,
  ie: 10,
  safari: 6,
  phantomjs: 2,
};

onPageLoad(sink => {
  if (doNotNeedShim(sink.request,
                    minimumMajorVersions,
                    "force_es5_shim")) {
    return;
  }
  sink.appendToHead(
    makeScript("es5-shim/es5-shim-sham")
  );
});

///////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/es5-shim/server.js");

/* Exports */
Package._define("es5-shim", exports);

})();

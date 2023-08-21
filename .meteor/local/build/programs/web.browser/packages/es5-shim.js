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
var meteorInstall = Package.modules.meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"es5-shim":{"console.js":function(){

////////////////////////////////////////////////////////////////////////////
//                                                                        //
// packages/es5-shim/console.js                                           //
//                                                                        //
////////////////////////////////////////////////////////////////////////////
                                                                          //
var hasOwn = Object.prototype.hasOwnProperty;

function wrap(method) {
  var original = console[method];
  if (original && typeof original === "object") {
    // Turn callable console method objects into actual functions.
    console[method] = function () {
      return Function.prototype.apply.call(
        original, console, arguments
      );
    };
  }
}

if (typeof console === "object" &&
    // In older Internet Explorers, methods like console.log are actually
    // callable objects rather than functions.
    typeof console.log === "object") {
  for (var method in console) {
    // In most browsers, this hasOwn check will fail for all console
    // methods anyway, but fortunately in IE8 the method objects we care
    // about are own properties.
    if (hasOwn.call(console, method)) {
      wrap(method);
    }
  }
}

////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/es5-shim/console.js");

/* Exports */
Package._define("es5-shim");

})();

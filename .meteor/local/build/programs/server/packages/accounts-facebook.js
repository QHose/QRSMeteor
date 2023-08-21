(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Accounts = Package['accounts-base'].Accounts;
var Facebook = Package['facebook-oauth'].Facebook;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-facebook":{"notice.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-facebook/notice.js                                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('facebook-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-facebook,\n" + "but didn't install the configuration UI for the Facebook\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add facebook-config-ui" + "\n");
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-facebook/facebook.js                                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Accounts.oauth.registerService('facebook');

if (Meteor.isClient) {
  const loginWithFacebook = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Facebook.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('facebook', loginWithFacebook);

  Meteor.loginWithFacebook = function () {
    return Accounts.applyLoginFunction('facebook', arguments);
  };
} else {
  Accounts.addAutopublishFields({
    // publish all fields including access token, which can legitimately
    // be used from the client (if transmitted over ssl or on
    // localhost). https://developers.facebook.com/docs/concepts/login/access-tokens-and-types/,
    // "Sharing of Access Tokens"
    forLoggedInUser: ['services.facebook'],
    forOtherUsers: [// https://www.facebook.com/help/167709519956542
    'services.facebook.id', 'services.facebook.username', 'services.facebook.gender']
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-facebook/notice.js");
require("/node_modules/meteor/accounts-facebook/facebook.js");

/* Exports */
Package._define("accounts-facebook");

})();

//# sourceURL=meteor://💻app/packages/accounts-facebook.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtZmFjZWJvb2svbm90aWNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hY2NvdW50cy1mYWNlYm9vay9mYWNlYm9vay5qcyJdLCJuYW1lcyI6WyJQYWNrYWdlIiwiaGFzT3duUHJvcGVydHkiLCJjb25zb2xlIiwid2FybiIsIkFjY291bnRzIiwib2F1dGgiLCJyZWdpc3RlclNlcnZpY2UiLCJNZXRlb3IiLCJpc0NsaWVudCIsImxvZ2luV2l0aEZhY2Vib29rIiwib3B0aW9ucyIsImNhbGxiYWNrIiwiY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUNhbGxiYWNrIiwiY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUhhbmRsZXIiLCJGYWNlYm9vayIsInJlcXVlc3RDcmVkZW50aWFsIiwicmVnaXN0ZXJDbGllbnRMb2dpbkZ1bmN0aW9uIiwiYXBwbHlMb2dpbkZ1bmN0aW9uIiwiYXJndW1lbnRzIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxRQUFRLGFBQVIsS0FDRyxDQUFDQSxRQUFRLHVCQUFSLENBREosSUFFRyxDQUFDQSxRQUFRQyxjQUFSLENBQXVCLG9CQUF2QixDQUZSLEVBRXNEO0FBQ3BEQyxVQUFRQyxJQUFSLENBQ0UsNERBQ0EsNERBREEsR0FFQSxtQ0FGQSxHQUdBLElBSEEsR0FJQSxtQ0FKQSxHQUtBLElBTkY7QUFRRCxDOzs7Ozs7Ozs7OztBQ1hEQyxTQUFTQyxLQUFULENBQWVDLGVBQWYsQ0FBK0IsVUFBL0I7O0FBRUEsSUFBSUMsT0FBT0MsUUFBWCxFQUFxQjtBQUNuQixRQUFNQyxvQkFBb0IsVUFBU0MsT0FBVCxFQUFrQkMsUUFBbEIsRUFBNEI7QUFDcEQ7QUFDQSxRQUFJLENBQUVBLFFBQUYsSUFBYyxPQUFPRCxPQUFQLEtBQW1CLFVBQXJDLEVBQWlEO0FBQy9DQyxpQkFBV0QsT0FBWDtBQUNBQSxnQkFBVSxJQUFWO0FBQ0Q7O0FBRUQsUUFBSUUsb0NBQW9DUixTQUFTQyxLQUFULENBQWVRLGdDQUFmLENBQWdERixRQUFoRCxDQUF4QztBQUNBRyxhQUFTQyxpQkFBVCxDQUEyQkwsT0FBM0IsRUFBb0NFLGlDQUFwQztBQUNELEdBVEQ7O0FBVUFSLFdBQVNZLDJCQUFULENBQXFDLFVBQXJDLEVBQWlEUCxpQkFBakQ7O0FBQ0FGLFNBQU9FLGlCQUFQLEdBQTJCLFlBQVk7QUFDckMsV0FBT0wsU0FBU2Esa0JBQVQsQ0FBNEIsVUFBNUIsRUFBd0NDLFNBQXhDLENBQVA7QUFDRCxHQUZEO0FBR0QsQ0FmRCxNQWVPO0FBQ0xkLFdBQVNlLG9CQUFULENBQThCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLHFCQUFpQixDQUFDLG1CQUFELENBTFc7QUFNNUJDLG1CQUFlLENBQ2I7QUFDQSwwQkFGYSxFQUVXLDRCQUZYLEVBRXlDLDBCQUZ6QztBQU5hLEdBQTlCO0FBV0QsQyIsImZpbGUiOiIvcGFja2FnZXMvYWNjb3VudHMtZmFjZWJvb2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAoUGFja2FnZVsnYWNjb3VudHMtdWknXVxuICAgICYmICFQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXVxuICAgICYmICFQYWNrYWdlLmhhc093blByb3BlcnR5KCdmYWNlYm9vay1jb25maWctdWknKSkge1xuICBjb25zb2xlLndhcm4oXG4gICAgXCJOb3RlOiBZb3UncmUgdXNpbmcgYWNjb3VudHMtdWkgYW5kIGFjY291bnRzLWZhY2Vib29rLFxcblwiICtcbiAgICBcImJ1dCBkaWRuJ3QgaW5zdGFsbCB0aGUgY29uZmlndXJhdGlvbiBVSSBmb3IgdGhlIEZhY2Vib29rXFxuXCIgK1xuICAgIFwiT0F1dGguIFlvdSBjYW4gaW5zdGFsbCBpdCB3aXRoOlxcblwiICtcbiAgICBcIlxcblwiICtcbiAgICBcIiAgICBtZXRlb3IgYWRkIGZhY2Vib29rLWNvbmZpZy11aVwiICtcbiAgICBcIlxcblwiXG4gICk7XG59XG4iLCJBY2NvdW50cy5vYXV0aC5yZWdpc3RlclNlcnZpY2UoJ2ZhY2Vib29rJyk7XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgY29uc3QgbG9naW5XaXRoRmFjZWJvb2sgPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIC8vIHN1cHBvcnQgYSBjYWxsYmFjayB3aXRob3V0IG9wdGlvbnNcbiAgICBpZiAoISBjYWxsYmFjayAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUNhbGxiYWNrID0gQWNjb3VudHMub2F1dGguY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUhhbmRsZXIoY2FsbGJhY2spO1xuICAgIEZhY2Vib29rLnJlcXVlc3RDcmVkZW50aWFsKG9wdGlvbnMsIGNyZWRlbnRpYWxSZXF1ZXN0Q29tcGxldGVDYWxsYmFjayk7XG4gIH07XG4gIEFjY291bnRzLnJlZ2lzdGVyQ2xpZW50TG9naW5GdW5jdGlvbignZmFjZWJvb2snLCBsb2dpbldpdGhGYWNlYm9vayk7XG4gIE1ldGVvci5sb2dpbldpdGhGYWNlYm9vayA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQWNjb3VudHMuYXBwbHlMb2dpbkZ1bmN0aW9uKCdmYWNlYm9vaycsIGFyZ3VtZW50cyk7XG4gIH07XG59IGVsc2Uge1xuICBBY2NvdW50cy5hZGRBdXRvcHVibGlzaEZpZWxkcyh7XG4gICAgLy8gcHVibGlzaCBhbGwgZmllbGRzIGluY2x1ZGluZyBhY2Nlc3MgdG9rZW4sIHdoaWNoIGNhbiBsZWdpdGltYXRlbHlcbiAgICAvLyBiZSB1c2VkIGZyb20gdGhlIGNsaWVudCAoaWYgdHJhbnNtaXR0ZWQgb3ZlciBzc2wgb3Igb25cbiAgICAvLyBsb2NhbGhvc3QpLiBodHRwczovL2RldmVsb3BlcnMuZmFjZWJvb2suY29tL2RvY3MvY29uY2VwdHMvbG9naW4vYWNjZXNzLXRva2Vucy1hbmQtdHlwZXMvLFxuICAgIC8vIFwiU2hhcmluZyBvZiBBY2Nlc3MgVG9rZW5zXCJcbiAgICBmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMuZmFjZWJvb2snXSxcbiAgICBmb3JPdGhlclVzZXJzOiBbXG4gICAgICAvLyBodHRwczovL3d3dy5mYWNlYm9vay5jb20vaGVscC8xNjc3MDk1MTk5NTY1NDJcbiAgICAgICdzZXJ2aWNlcy5mYWNlYm9vay5pZCcsICdzZXJ2aWNlcy5mYWNlYm9vay51c2VybmFtZScsICdzZXJ2aWNlcy5mYWNlYm9vay5nZW5kZXInXG4gICAgXVxuICB9KTtcbn1cbiJdfQ==

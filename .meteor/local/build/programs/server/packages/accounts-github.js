(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Accounts = Package['accounts-base'].Accounts;
var Github = Package['github-oauth'].Github;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-github":{"notice.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-github/notice.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('github-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-github,\n" + "but didn't install the configuration UI for the GitHub\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add github-config-ui" + "\n");
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"github.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-github/github.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Accounts.oauth.registerService('github');

if (Meteor.isClient) {
  const loginWithGithub = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Github.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('github', loginWithGithub);

  Meteor.loginWithGithub = function () {
    return Accounts.applyLoginFunction('github', arguments);
  };
} else {
  Accounts.addAutopublishFields({
    // not sure whether the github api can be used from the browser,
    // thus not sure if we should be sending access tokens; but we do it
    // for all other oauth2 providers, and it may come in handy.
    forLoggedInUser: ['services.github'],
    forOtherUsers: ['services.github.username']
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-github/notice.js");
require("/node_modules/meteor/accounts-github/github.js");

/* Exports */
Package._define("accounts-github");

})();

//# sourceURL=meteor://💻app/packages/accounts-github.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtZ2l0aHViL25vdGljZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtZ2l0aHViL2dpdGh1Yi5qcyJdLCJuYW1lcyI6WyJQYWNrYWdlIiwiaGFzT3duUHJvcGVydHkiLCJjb25zb2xlIiwid2FybiIsIkFjY291bnRzIiwib2F1dGgiLCJyZWdpc3RlclNlcnZpY2UiLCJNZXRlb3IiLCJpc0NsaWVudCIsImxvZ2luV2l0aEdpdGh1YiIsIm9wdGlvbnMiLCJjYWxsYmFjayIsImNyZWRlbnRpYWxSZXF1ZXN0Q29tcGxldGVDYWxsYmFjayIsImNyZWRlbnRpYWxSZXF1ZXN0Q29tcGxldGVIYW5kbGVyIiwiR2l0aHViIiwicmVxdWVzdENyZWRlbnRpYWwiLCJyZWdpc3RlckNsaWVudExvZ2luRnVuY3Rpb24iLCJhcHBseUxvZ2luRnVuY3Rpb24iLCJhcmd1bWVudHMiLCJhZGRBdXRvcHVibGlzaEZpZWxkcyIsImZvckxvZ2dlZEluVXNlciIsImZvck90aGVyVXNlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLFFBQVEsYUFBUixLQUNHLENBQUNBLFFBQVEsdUJBQVIsQ0FESixJQUVHLENBQUNBLFFBQVFDLGNBQVIsQ0FBdUIsa0JBQXZCLENBRlIsRUFFb0Q7QUFDbERDLFVBQVFDLElBQVIsQ0FDRSwwREFDQSwwREFEQSxHQUVBLG1DQUZBLEdBR0EsSUFIQSxHQUlBLGlDQUpBLEdBS0EsSUFORjtBQVFELEM7Ozs7Ozs7Ozs7O0FDWERDLFNBQVNDLEtBQVQsQ0FBZUMsZUFBZixDQUErQixRQUEvQjs7QUFFQSxJQUFJQyxPQUFPQyxRQUFYLEVBQXFCO0FBQ25CLFFBQU1DLGtCQUFrQixVQUFTQyxPQUFULEVBQWtCQyxRQUFsQixFQUE0QjtBQUNsRDtBQUNBLFFBQUksQ0FBRUEsUUFBRixJQUFjLE9BQU9ELE9BQVAsS0FBbUIsVUFBckMsRUFBaUQ7QUFDL0NDLGlCQUFXRCxPQUFYO0FBQ0FBLGdCQUFVLElBQVY7QUFDRDs7QUFFRCxRQUFJRSxvQ0FBb0NSLFNBQVNDLEtBQVQsQ0FBZVEsZ0NBQWYsQ0FBZ0RGLFFBQWhELENBQXhDO0FBQ0FHLFdBQU9DLGlCQUFQLENBQXlCTCxPQUF6QixFQUFrQ0UsaUNBQWxDO0FBQ0QsR0FURDs7QUFVQVIsV0FBU1ksMkJBQVQsQ0FBcUMsUUFBckMsRUFBK0NQLGVBQS9DOztBQUNBRixTQUFPRSxlQUFQLEdBQXlCLFlBQVk7QUFDbkMsV0FBT0wsU0FBU2Esa0JBQVQsQ0FBNEIsUUFBNUIsRUFBc0NDLFNBQXRDLENBQVA7QUFDRCxHQUZEO0FBR0QsQ0FmRCxNQWVPO0FBQ0xkLFdBQVNlLG9CQUFULENBQThCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBQyxxQkFBaUIsQ0FBQyxpQkFBRCxDQUpXO0FBSzVCQyxtQkFBZSxDQUFDLDBCQUFEO0FBTGEsR0FBOUI7QUFPRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9hY2NvdW50cy1naXRodWIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAoUGFja2FnZVsnYWNjb3VudHMtdWknXVxuICAgICYmICFQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXVxuICAgICYmICFQYWNrYWdlLmhhc093blByb3BlcnR5KCdnaXRodWItY29uZmlnLXVpJykpIHtcbiAgY29uc29sZS53YXJuKFxuICAgIFwiTm90ZTogWW91J3JlIHVzaW5nIGFjY291bnRzLXVpIGFuZCBhY2NvdW50cy1naXRodWIsXFxuXCIgK1xuICAgIFwiYnV0IGRpZG4ndCBpbnN0YWxsIHRoZSBjb25maWd1cmF0aW9uIFVJIGZvciB0aGUgR2l0SHViXFxuXCIgK1xuICAgIFwiT0F1dGguIFlvdSBjYW4gaW5zdGFsbCBpdCB3aXRoOlxcblwiICtcbiAgICBcIlxcblwiICtcbiAgICBcIiAgICBtZXRlb3IgYWRkIGdpdGh1Yi1jb25maWctdWlcIiArXG4gICAgXCJcXG5cIlxuICApO1xufVxuIiwiQWNjb3VudHMub2F1dGgucmVnaXN0ZXJTZXJ2aWNlKCdnaXRodWInKTtcblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBjb25zdCBsb2dpbldpdGhHaXRodWIgPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIC8vIHN1cHBvcnQgYSBjYWxsYmFjayB3aXRob3V0IG9wdGlvbnNcbiAgICBpZiAoISBjYWxsYmFjayAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUNhbGxiYWNrID0gQWNjb3VudHMub2F1dGguY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUhhbmRsZXIoY2FsbGJhY2spO1xuICAgIEdpdGh1Yi5yZXF1ZXN0Q3JlZGVudGlhbChvcHRpb25zLCBjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlQ2FsbGJhY2spO1xuICB9O1xuICBBY2NvdW50cy5yZWdpc3RlckNsaWVudExvZ2luRnVuY3Rpb24oJ2dpdGh1YicsIGxvZ2luV2l0aEdpdGh1Yik7XG4gIE1ldGVvci5sb2dpbldpdGhHaXRodWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEFjY291bnRzLmFwcGx5TG9naW5GdW5jdGlvbignZ2l0aHViJywgYXJndW1lbnRzKTtcbiAgfTtcbn0gZWxzZSB7XG4gIEFjY291bnRzLmFkZEF1dG9wdWJsaXNoRmllbGRzKHtcbiAgICAvLyBub3Qgc3VyZSB3aGV0aGVyIHRoZSBnaXRodWIgYXBpIGNhbiBiZSB1c2VkIGZyb20gdGhlIGJyb3dzZXIsXG4gICAgLy8gdGh1cyBub3Qgc3VyZSBpZiB3ZSBzaG91bGQgYmUgc2VuZGluZyBhY2Nlc3MgdG9rZW5zOyBidXQgd2UgZG8gaXRcbiAgICAvLyBmb3IgYWxsIG90aGVyIG9hdXRoMiBwcm92aWRlcnMsIGFuZCBpdCBtYXkgY29tZSBpbiBoYW5keS5cbiAgICBmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMuZ2l0aHViJ10sXG4gICAgZm9yT3RoZXJVc2VyczogWydzZXJ2aWNlcy5naXRodWIudXNlcm5hbWUnXVxuICB9KTtcbn1cbiJdfQ==

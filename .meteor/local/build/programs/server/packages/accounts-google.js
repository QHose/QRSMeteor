(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Google = Package['google-oauth'].Google;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-google":{"notice.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-google/notice.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('google-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-google,\n" + "but didn't install the configuration UI for the Google\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add google-config-ui" + "\n");
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"google.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/accounts-google/google.js                                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Accounts.oauth.registerService('google');

if (Meteor.isClient) {
  const loginWithGoogle = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    if (Meteor.isCordova && Google.signIn) {
      // After 20 April 2017, Google OAuth login will no longer work from
      // a WebView, so Cordova apps must use Google Sign-In instead.
      // https://github.com/meteor/meteor/issues/8253
      Google.signIn(options, callback);
      return;
    } // Use Google's domain-specific login page if we want to restrict creation to
    // a particular email domain. (Don't use it if restrictCreationByEmailDomain
    // is a function.) Note that all this does is change Google's UI ---
    // accounts-base/accounts_server.js still checks server-side that the server
    // has the proper email address after the OAuth conversation.


    if (typeof Accounts._options.restrictCreationByEmailDomain === 'string') {
      options = _.extend({}, options || {});
      options.loginUrlParameters = _.extend({}, options.loginUrlParameters || {});
      options.loginUrlParameters.hd = Accounts._options.restrictCreationByEmailDomain;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Google.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('google', loginWithGoogle);

  Meteor.loginWithGoogle = function () {
    return Accounts.applyLoginFunction('google', arguments);
  };
} else {
  Accounts.addAutopublishFields({
    forLoggedInUser: _.map( // publish access token since it can be used from the client (if
    // transmitted over ssl or on
    // localhost). https://developers.google.com/accounts/docs/OAuth2UserAgent
    // refresh token probably shouldn't be sent down.
    Google.whitelistedFields.concat(['accessToken', 'expiresAt']), // don't publish refresh token
    function (subfield) {
      return 'services.google.' + subfield;
    }),
    forOtherUsers: _.map( // even with autopublish, no legitimate web app should be
    // publishing all users' emails
    _.without(Google.whitelistedFields, 'email', 'verified_email'), function (subfield) {
      return 'services.google.' + subfield;
    })
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-google/notice.js");
require("/node_modules/meteor/accounts-google/google.js");

/* Exports */
Package._define("accounts-google");

})();

//# sourceURL=meteor://💻app/packages/accounts-google.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtZ29vZ2xlL25vdGljZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtZ29vZ2xlL2dvb2dsZS5qcyJdLCJuYW1lcyI6WyJQYWNrYWdlIiwiaGFzT3duUHJvcGVydHkiLCJjb25zb2xlIiwid2FybiIsIkFjY291bnRzIiwib2F1dGgiLCJyZWdpc3RlclNlcnZpY2UiLCJNZXRlb3IiLCJpc0NsaWVudCIsImxvZ2luV2l0aEdvb2dsZSIsIm9wdGlvbnMiLCJjYWxsYmFjayIsImlzQ29yZG92YSIsIkdvb2dsZSIsInNpZ25JbiIsIl9vcHRpb25zIiwicmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW4iLCJfIiwiZXh0ZW5kIiwibG9naW5VcmxQYXJhbWV0ZXJzIiwiaGQiLCJjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlQ2FsbGJhY2siLCJjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlSGFuZGxlciIsInJlcXVlc3RDcmVkZW50aWFsIiwicmVnaXN0ZXJDbGllbnRMb2dpbkZ1bmN0aW9uIiwiYXBwbHlMb2dpbkZ1bmN0aW9uIiwiYXJndW1lbnRzIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJtYXAiLCJ3aGl0ZWxpc3RlZEZpZWxkcyIsImNvbmNhdCIsInN1YmZpZWxkIiwiZm9yT3RoZXJVc2VycyIsIndpdGhvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsUUFBUSxhQUFSLEtBQ0csQ0FBQ0EsUUFBUSx1QkFBUixDQURKLElBRUcsQ0FBQ0EsUUFBUUMsY0FBUixDQUF1QixrQkFBdkIsQ0FGUixFQUVvRDtBQUNsREMsVUFBUUMsSUFBUixDQUNFLDBEQUNBLDBEQURBLEdBRUEsbUNBRkEsR0FHQSxJQUhBLEdBSUEsaUNBSkEsR0FLQSxJQU5GO0FBUUQsQzs7Ozs7Ozs7Ozs7QUNYREMsU0FBU0MsS0FBVCxDQUFlQyxlQUFmLENBQStCLFFBQS9COztBQUVBLElBQUlDLE9BQU9DLFFBQVgsRUFBcUI7QUFDbkIsUUFBTUMsa0JBQWtCLFVBQVNDLE9BQVQsRUFBa0JDLFFBQWxCLEVBQTRCO0FBQ2xEO0FBQ0EsUUFBSSxDQUFFQSxRQUFGLElBQWMsT0FBT0QsT0FBUCxLQUFtQixVQUFyQyxFQUFpRDtBQUMvQ0MsaUJBQVdELE9BQVg7QUFDQUEsZ0JBQVUsSUFBVjtBQUNEOztBQUVELFFBQUlILE9BQU9LLFNBQVAsSUFDQUMsT0FBT0MsTUFEWCxFQUNtQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQUQsYUFBT0MsTUFBUCxDQUFjSixPQUFkLEVBQXVCQyxRQUF2QjtBQUNBO0FBQ0QsS0FkaUQsQ0FnQmxEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLFFBQUksT0FBT1AsU0FBU1csUUFBVCxDQUFrQkMsNkJBQXpCLEtBQTJELFFBQS9ELEVBQXlFO0FBQ3ZFTixnQkFBVU8sRUFBRUMsTUFBRixDQUFTLEVBQVQsRUFBYVIsV0FBVyxFQUF4QixDQUFWO0FBQ0FBLGNBQVFTLGtCQUFSLEdBQTZCRixFQUFFQyxNQUFGLENBQVMsRUFBVCxFQUFhUixRQUFRUyxrQkFBUixJQUE4QixFQUEzQyxDQUE3QjtBQUNBVCxjQUFRUyxrQkFBUixDQUEyQkMsRUFBM0IsR0FBZ0NoQixTQUFTVyxRQUFULENBQWtCQyw2QkFBbEQ7QUFDRDs7QUFDRCxRQUFJSyxvQ0FBb0NqQixTQUFTQyxLQUFULENBQWVpQixnQ0FBZixDQUFnRFgsUUFBaEQsQ0FBeEM7QUFDQUUsV0FBT1UsaUJBQVAsQ0FBeUJiLE9BQXpCLEVBQWtDVyxpQ0FBbEM7QUFDRCxHQTVCRDs7QUE2QkFqQixXQUFTb0IsMkJBQVQsQ0FBcUMsUUFBckMsRUFBK0NmLGVBQS9DOztBQUNBRixTQUFPRSxlQUFQLEdBQXlCLFlBQVk7QUFDbkMsV0FBT0wsU0FBU3FCLGtCQUFULENBQTRCLFFBQTVCLEVBQXNDQyxTQUF0QyxDQUFQO0FBQ0QsR0FGRDtBQUdELENBbENELE1Ba0NPO0FBQ0x0QixXQUFTdUIsb0JBQVQsQ0FBOEI7QUFDNUJDLHFCQUFpQlgsRUFBRVksR0FBRixFQUNmO0FBQ0E7QUFDQTtBQUNBO0FBQ0FoQixXQUFPaUIsaUJBQVAsQ0FBeUJDLE1BQXpCLENBQWdDLENBQUMsYUFBRCxFQUFnQixXQUFoQixDQUFoQyxDQUxlLEVBS2dEO0FBQy9ELGNBQVVDLFFBQVYsRUFBb0I7QUFBRSxhQUFPLHFCQUFxQkEsUUFBNUI7QUFBdUMsS0FOOUMsQ0FEVztBQVM1QkMsbUJBQWVoQixFQUFFWSxHQUFGLEVBQ2I7QUFDQTtBQUNBWixNQUFFaUIsT0FBRixDQUFVckIsT0FBT2lCLGlCQUFqQixFQUFvQyxPQUFwQyxFQUE2QyxnQkFBN0MsQ0FIYSxFQUliLFVBQVVFLFFBQVYsRUFBb0I7QUFBRSxhQUFPLHFCQUFxQkEsUUFBNUI7QUFBdUMsS0FKaEQ7QUFUYSxHQUE5QjtBQWVELEMiLCJmaWxlIjoiL3BhY2thZ2VzL2FjY291bnRzLWdvb2dsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmIChQYWNrYWdlWydhY2NvdW50cy11aSddXG4gICAgJiYgIVBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddXG4gICAgJiYgIVBhY2thZ2UuaGFzT3duUHJvcGVydHkoJ2dvb2dsZS1jb25maWctdWknKSkge1xuICBjb25zb2xlLndhcm4oXG4gICAgXCJOb3RlOiBZb3UncmUgdXNpbmcgYWNjb3VudHMtdWkgYW5kIGFjY291bnRzLWdvb2dsZSxcXG5cIiArXG4gICAgXCJidXQgZGlkbid0IGluc3RhbGwgdGhlIGNvbmZpZ3VyYXRpb24gVUkgZm9yIHRoZSBHb29nbGVcXG5cIiArXG4gICAgXCJPQXV0aC4gWW91IGNhbiBpbnN0YWxsIGl0IHdpdGg6XFxuXCIgK1xuICAgIFwiXFxuXCIgK1xuICAgIFwiICAgIG1ldGVvciBhZGQgZ29vZ2xlLWNvbmZpZy11aVwiICtcbiAgICBcIlxcblwiXG4gICk7XG59XG4iLCJBY2NvdW50cy5vYXV0aC5yZWdpc3RlclNlcnZpY2UoJ2dvb2dsZScpO1xuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIGNvbnN0IGxvZ2luV2l0aEdvb2dsZSA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgLy8gc3VwcG9ydCBhIGNhbGxiYWNrIHdpdGhvdXQgb3B0aW9uc1xuICAgIGlmICghIGNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChNZXRlb3IuaXNDb3Jkb3ZhICYmXG4gICAgICAgIEdvb2dsZS5zaWduSW4pIHtcbiAgICAgIC8vIEFmdGVyIDIwIEFwcmlsIDIwMTcsIEdvb2dsZSBPQXV0aCBsb2dpbiB3aWxsIG5vIGxvbmdlciB3b3JrIGZyb21cbiAgICAgIC8vIGEgV2ViVmlldywgc28gQ29yZG92YSBhcHBzIG11c3QgdXNlIEdvb2dsZSBTaWduLUluIGluc3RlYWQuXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvODI1M1xuICAgICAgR29vZ2xlLnNpZ25JbihvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVXNlIEdvb2dsZSdzIGRvbWFpbi1zcGVjaWZpYyBsb2dpbiBwYWdlIGlmIHdlIHdhbnQgdG8gcmVzdHJpY3QgY3JlYXRpb24gdG9cbiAgICAvLyBhIHBhcnRpY3VsYXIgZW1haWwgZG9tYWluLiAoRG9uJ3QgdXNlIGl0IGlmIHJlc3RyaWN0Q3JlYXRpb25CeUVtYWlsRG9tYWluXG4gICAgLy8gaXMgYSBmdW5jdGlvbi4pIE5vdGUgdGhhdCBhbGwgdGhpcyBkb2VzIGlzIGNoYW5nZSBHb29nbGUncyBVSSAtLS1cbiAgICAvLyBhY2NvdW50cy1iYXNlL2FjY291bnRzX3NlcnZlci5qcyBzdGlsbCBjaGVja3Mgc2VydmVyLXNpZGUgdGhhdCB0aGUgc2VydmVyXG4gICAgLy8gaGFzIHRoZSBwcm9wZXIgZW1haWwgYWRkcmVzcyBhZnRlciB0aGUgT0F1dGggY29udmVyc2F0aW9uLlxuICAgIGlmICh0eXBlb2YgQWNjb3VudHMuX29wdGlvbnMucmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIG9wdGlvbnMgfHwge30pO1xuICAgICAgb3B0aW9ucy5sb2dpblVybFBhcmFtZXRlcnMgPSBfLmV4dGVuZCh7fSwgb3B0aW9ucy5sb2dpblVybFBhcmFtZXRlcnMgfHwge30pO1xuICAgICAgb3B0aW9ucy5sb2dpblVybFBhcmFtZXRlcnMuaGQgPSBBY2NvdW50cy5fb3B0aW9ucy5yZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbjtcbiAgICB9XG4gICAgdmFyIGNyZWRlbnRpYWxSZXF1ZXN0Q29tcGxldGVDYWxsYmFjayA9IEFjY291bnRzLm9hdXRoLmNyZWRlbnRpYWxSZXF1ZXN0Q29tcGxldGVIYW5kbGVyKGNhbGxiYWNrKTtcbiAgICBHb29nbGUucmVxdWVzdENyZWRlbnRpYWwob3B0aW9ucywgY3JlZGVudGlhbFJlcXVlc3RDb21wbGV0ZUNhbGxiYWNrKTtcbiAgfTtcbiAgQWNjb3VudHMucmVnaXN0ZXJDbGllbnRMb2dpbkZ1bmN0aW9uKCdnb29nbGUnLCBsb2dpbldpdGhHb29nbGUpO1xuICBNZXRlb3IubG9naW5XaXRoR29vZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBBY2NvdW50cy5hcHBseUxvZ2luRnVuY3Rpb24oJ2dvb2dsZScsIGFyZ3VtZW50cyk7XG4gIH07XG59IGVsc2Uge1xuICBBY2NvdW50cy5hZGRBdXRvcHVibGlzaEZpZWxkcyh7XG4gICAgZm9yTG9nZ2VkSW5Vc2VyOiBfLm1hcChcbiAgICAgIC8vIHB1Ymxpc2ggYWNjZXNzIHRva2VuIHNpbmNlIGl0IGNhbiBiZSB1c2VkIGZyb20gdGhlIGNsaWVudCAoaWZcbiAgICAgIC8vIHRyYW5zbWl0dGVkIG92ZXIgc3NsIG9yIG9uXG4gICAgICAvLyBsb2NhbGhvc3QpLiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hY2NvdW50cy9kb2NzL09BdXRoMlVzZXJBZ2VudFxuICAgICAgLy8gcmVmcmVzaCB0b2tlbiBwcm9iYWJseSBzaG91bGRuJ3QgYmUgc2VudCBkb3duLlxuICAgICAgR29vZ2xlLndoaXRlbGlzdGVkRmllbGRzLmNvbmNhdChbJ2FjY2Vzc1Rva2VuJywgJ2V4cGlyZXNBdCddKSwgLy8gZG9uJ3QgcHVibGlzaCByZWZyZXNoIHRva2VuXG4gICAgICBmdW5jdGlvbiAoc3ViZmllbGQpIHsgcmV0dXJuICdzZXJ2aWNlcy5nb29nbGUuJyArIHN1YmZpZWxkOyB9KSxcblxuICAgIGZvck90aGVyVXNlcnM6IF8ubWFwKFxuICAgICAgLy8gZXZlbiB3aXRoIGF1dG9wdWJsaXNoLCBubyBsZWdpdGltYXRlIHdlYiBhcHAgc2hvdWxkIGJlXG4gICAgICAvLyBwdWJsaXNoaW5nIGFsbCB1c2VycycgZW1haWxzXG4gICAgICBfLndpdGhvdXQoR29vZ2xlLndoaXRlbGlzdGVkRmllbGRzLCAnZW1haWwnLCAndmVyaWZpZWRfZW1haWwnKSxcbiAgICAgIGZ1bmN0aW9uIChzdWJmaWVsZCkgeyByZXR1cm4gJ3NlcnZpY2VzLmdvb2dsZS4nICsgc3ViZmllbGQ7IH0pXG4gIH0pO1xufVxuIl19

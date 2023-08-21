(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var Accounts = Package['accounts-base'].Accounts;
var Twitter = Package['twitter-oauth'].Twitter;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-twitter":{"notice.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-twitter/notice.js                                                                             //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('twitter-config-ui')) {
  console.warn("Note: You're using accounts-ui and accounts-twitter,\n" + "but didn't install the configuration UI for Twitter\n" + "OAuth. You can install it with:\n" + "\n" + "    meteor add twitter-config-ui" + "\n");
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"twitter.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-twitter/twitter.js                                                                            //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
Accounts.oauth.registerService('twitter');

if (Meteor.isClient) {
  const loginWithTwitter = function (options, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Twitter.requestCredential(options, credentialRequestCompleteCallback);
  };

  Accounts.registerClientLoginFunction('twitter', loginWithTwitter);

  Meteor.loginWithTwitter = function () {
    return Accounts.applyLoginFunction('twitter', arguments);
  };
} else {
  var autopublishedFields = _.map( // don't send access token. https://dev.twitter.com/discussions/5025
  Twitter.whitelistedFields.concat(['id', 'screenName']), function (subfield) {
    return 'services.twitter.' + subfield;
  });

  Accounts.addAutopublishFields({
    forLoggedInUser: autopublishedFields,
    forOtherUsers: autopublishedFields
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/accounts-twitter/notice.js");
require("/node_modules/meteor/accounts-twitter/twitter.js");

/* Exports */
Package._define("accounts-twitter");

})();

//# sourceURL=meteor://💻app/packages/accounts-twitter.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtdHdpdHRlci9ub3RpY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FjY291bnRzLXR3aXR0ZXIvdHdpdHRlci5qcyJdLCJuYW1lcyI6WyJQYWNrYWdlIiwiaGFzT3duUHJvcGVydHkiLCJjb25zb2xlIiwid2FybiIsIkFjY291bnRzIiwib2F1dGgiLCJyZWdpc3RlclNlcnZpY2UiLCJNZXRlb3IiLCJpc0NsaWVudCIsImxvZ2luV2l0aFR3aXR0ZXIiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlQ2FsbGJhY2siLCJjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlSGFuZGxlciIsIlR3aXR0ZXIiLCJyZXF1ZXN0Q3JlZGVudGlhbCIsInJlZ2lzdGVyQ2xpZW50TG9naW5GdW5jdGlvbiIsImFwcGx5TG9naW5GdW5jdGlvbiIsImFyZ3VtZW50cyIsImF1dG9wdWJsaXNoZWRGaWVsZHMiLCJfIiwibWFwIiwid2hpdGVsaXN0ZWRGaWVsZHMiLCJjb25jYXQiLCJzdWJmaWVsZCIsImFkZEF1dG9wdWJsaXNoRmllbGRzIiwiZm9yTG9nZ2VkSW5Vc2VyIiwiZm9yT3RoZXJVc2VycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsUUFBUSxhQUFSLEtBQ0csQ0FBQ0EsUUFBUSx1QkFBUixDQURKLElBRUcsQ0FBQ0EsUUFBUUMsY0FBUixDQUF1QixtQkFBdkIsQ0FGUixFQUVxRDtBQUNuREMsVUFBUUMsSUFBUixDQUNFLDJEQUNBLHVEQURBLEdBRUEsbUNBRkEsR0FHQSxJQUhBLEdBSUEsa0NBSkEsR0FLQSxJQU5GO0FBUUQsQzs7Ozs7Ozs7Ozs7QUNYREMsU0FBU0MsS0FBVCxDQUFlQyxlQUFmLENBQStCLFNBQS9COztBQUVBLElBQUlDLE9BQU9DLFFBQVgsRUFBcUI7QUFDbkIsUUFBTUMsbUJBQW1CLFVBQVNDLE9BQVQsRUFBa0JDLFFBQWxCLEVBQTRCO0FBQ25EO0FBQ0EsUUFBSSxDQUFFQSxRQUFGLElBQWMsT0FBT0QsT0FBUCxLQUFtQixVQUFyQyxFQUFpRDtBQUMvQ0MsaUJBQVdELE9BQVg7QUFDQUEsZ0JBQVUsSUFBVjtBQUNEOztBQUVELFFBQUlFLG9DQUFvQ1IsU0FBU0MsS0FBVCxDQUFlUSxnQ0FBZixDQUFnREYsUUFBaEQsQ0FBeEM7QUFDQUcsWUFBUUMsaUJBQVIsQ0FBMEJMLE9BQTFCLEVBQW1DRSxpQ0FBbkM7QUFDRCxHQVREOztBQVVBUixXQUFTWSwyQkFBVCxDQUFxQyxTQUFyQyxFQUFnRFAsZ0JBQWhEOztBQUNBRixTQUFPRSxnQkFBUCxHQUEwQixZQUFZO0FBQ3BDLFdBQU9MLFNBQVNhLGtCQUFULENBQTRCLFNBQTVCLEVBQXVDQyxTQUF2QyxDQUFQO0FBQ0QsR0FGRDtBQUdELENBZkQsTUFlTztBQUNMLE1BQUlDLHNCQUFzQkMsRUFBRUMsR0FBRixFQUN4QjtBQUNBUCxVQUFRUSxpQkFBUixDQUEwQkMsTUFBMUIsQ0FBaUMsQ0FBQyxJQUFELEVBQU8sWUFBUCxDQUFqQyxDQUZ3QixFQUd4QixVQUFVQyxRQUFWLEVBQW9CO0FBQUUsV0FBTyxzQkFBc0JBLFFBQTdCO0FBQXdDLEdBSHRDLENBQTFCOztBQUtBcEIsV0FBU3FCLG9CQUFULENBQThCO0FBQzVCQyxxQkFBaUJQLG1CQURXO0FBRTVCUSxtQkFBZVI7QUFGYSxHQUE5QjtBQUlELEMiLCJmaWxlIjoiL3BhY2thZ2VzL2FjY291bnRzLXR3aXR0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAoUGFja2FnZVsnYWNjb3VudHMtdWknXVxuICAgICYmICFQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXVxuICAgICYmICFQYWNrYWdlLmhhc093blByb3BlcnR5KCd0d2l0dGVyLWNvbmZpZy11aScpKSB7XG4gIGNvbnNvbGUud2FybihcbiAgICBcIk5vdGU6IFlvdSdyZSB1c2luZyBhY2NvdW50cy11aSBhbmQgYWNjb3VudHMtdHdpdHRlcixcXG5cIiArXG4gICAgXCJidXQgZGlkbid0IGluc3RhbGwgdGhlIGNvbmZpZ3VyYXRpb24gVUkgZm9yIFR3aXR0ZXJcXG5cIiArXG4gICAgXCJPQXV0aC4gWW91IGNhbiBpbnN0YWxsIGl0IHdpdGg6XFxuXCIgK1xuICAgIFwiXFxuXCIgK1xuICAgIFwiICAgIG1ldGVvciBhZGQgdHdpdHRlci1jb25maWctdWlcIiArXG4gICAgXCJcXG5cIlxuICApO1xufVxuIiwiQWNjb3VudHMub2F1dGgucmVnaXN0ZXJTZXJ2aWNlKCd0d2l0dGVyJyk7XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgY29uc3QgbG9naW5XaXRoVHdpdHRlciA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgLy8gc3VwcG9ydCBhIGNhbGxiYWNrIHdpdGhvdXQgb3B0aW9uc1xuICAgIGlmICghIGNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlQ2FsbGJhY2sgPSBBY2NvdW50cy5vYXV0aC5jcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlSGFuZGxlcihjYWxsYmFjayk7XG4gICAgVHdpdHRlci5yZXF1ZXN0Q3JlZGVudGlhbChvcHRpb25zLCBjcmVkZW50aWFsUmVxdWVzdENvbXBsZXRlQ2FsbGJhY2spO1xuICB9O1xuICBBY2NvdW50cy5yZWdpc3RlckNsaWVudExvZ2luRnVuY3Rpb24oJ3R3aXR0ZXInLCBsb2dpbldpdGhUd2l0dGVyKTtcbiAgTWV0ZW9yLmxvZ2luV2l0aFR3aXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEFjY291bnRzLmFwcGx5TG9naW5GdW5jdGlvbigndHdpdHRlcicsIGFyZ3VtZW50cyk7XG4gIH07XG59IGVsc2Uge1xuICB2YXIgYXV0b3B1Ymxpc2hlZEZpZWxkcyA9IF8ubWFwKFxuICAgIC8vIGRvbid0IHNlbmQgYWNjZXNzIHRva2VuLiBodHRwczovL2Rldi50d2l0dGVyLmNvbS9kaXNjdXNzaW9ucy81MDI1XG4gICAgVHdpdHRlci53aGl0ZWxpc3RlZEZpZWxkcy5jb25jYXQoWydpZCcsICdzY3JlZW5OYW1lJ10pLFxuICAgIGZ1bmN0aW9uIChzdWJmaWVsZCkgeyByZXR1cm4gJ3NlcnZpY2VzLnR3aXR0ZXIuJyArIHN1YmZpZWxkOyB9KTtcblxuICBBY2NvdW50cy5hZGRBdXRvcHVibGlzaEZpZWxkcyh7XG4gICAgZm9yTG9nZ2VkSW5Vc2VyOiBhdXRvcHVibGlzaGVkRmllbGRzLFxuICAgIGZvck90aGVyVXNlcnM6IGF1dG9wdWJsaXNoZWRGaWVsZHNcbiAgfSk7XG59XG4iXX0=

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
var Template = Package['templating-runtime'].Template;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                          //
// packages/google-config-ui/template.google_configure.js                                   //
//                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////
                                                                                            //

Template.__checkName("configureLoginServiceDialogForGoogle");
Template["configureLoginServiceDialogForGoogle"] = new Template("Template.configureLoginServiceDialogForGoogle", (function() {
  var view = this;
  return [ HTML.Raw("<p>\n    First, you'll need to get a Google Client ID. Follow these steps:\n  </p>\n  "), HTML.OL("\n    ", HTML.Raw('<li>\n      Visit <a href="https://console.developers.google.com/" target="blank">https://console.developers.google.com/</a>\n    </li>'), "\n    ", HTML.Raw('<li>\n      "Create Project", if needed. Wait for Google to finish provisioning.\n    </li>'), "\n    ", HTML.Raw('<li>\n      On the left sidebar, go to "Credentials" and, on the right, "OAuth consent screen". Make sure to enter an email address and a product name, and save.\n    </li>'), "\n    ", HTML.Raw('<li>\n      On the left sidebar, go to "Credentials". Click the "Create credentials" button, then select "OAuth client ID" as the type.\n    </li>'), "\n    ", HTML.Raw('<li>\n      Select "Web application" as your application type.\n    </li>'), "\n    ", HTML.LI("\n     Set Authorized Javascript Origins to: ", HTML.SPAN({
    class: "url"
  }, Blaze.View("lookup:siteUrl", function() {
    return Spacebars.mustache(view.lookup("siteUrl"));
  })), "\n    "), "\n    ", HTML.LI("\n      Set Authorized Redirect URI to: ", HTML.SPAN({
    class: "url"
  }, Blaze.View("lookup:siteUrl", function() {
    return Spacebars.mustache(view.lookup("siteUrl"));
  }), "/_oauth/google"), "\n    "), "\n    ", HTML.Raw('<li>\n      Finish by clicking "Create".\n    </li>'), "\n  ") ];
}));

//////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                          //
// packages/google-config-ui/google_configure.js                                            //
//                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////
                                                                                            //
Template.configureLoginServiceDialogForGoogle.helpers({
  siteUrl: function () {
    var url = Meteor.absoluteUrl();
    if (url.slice(-1) === "/") {
      url = url.slice(0,-1)
    }
    return url;
  }
});

Template.configureLoginServiceDialogForGoogle.fields = function () {
  return [
    {property: 'clientId', label: 'Client ID'},
    {property: 'secret', label: 'Client secret'}
  ];
};

//////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("google-config-ui");

})();

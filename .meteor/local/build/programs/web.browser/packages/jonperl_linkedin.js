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
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var _ = Package.underscore._;
var Random = Package.random.Random;
var Template = Package['templating-runtime'].Template;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var LinkedIn, Linkedin;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/jonperl_linkedin/packages/jonperl_linkedin.js                                  //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
(function () {

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/jonperl:linkedin/linkedin_common.js                                      //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
LinkedIn = {};                                                                       // 1
                                                                                     // 2
// For compatibility with mondora                                                    // 3
Linkedin = LinkedIn;                                                                 // 4
///////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/jonperl:linkedin/linkedin_client.js                                      //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
// Request LinkedIn credentials for the user                                         // 1
// @param options {optional}                                                         // 2
// @param credentialRequestCompleteCallback {Function} Callback function to call on  // 3
//   completion. Takes one argument, credentialToken on success, or Error on         // 4
//   error.                                                                          // 5
LinkedIn.requestCredential = function (options, credentialRequestCompleteCallback) { // 6
    // support a callback without options                                            // 7
    if (!credentialRequestCompleteCallback && typeof options === 'function') {       // 8
        credentialRequestCompleteCallback = options;                                 // 9
        options = {};                                                                // 10
    }                                                                                // 11
                                                                                     // 12
    var config = ServiceConfiguration.configurations.findOne({                       // 13
        service: 'linkedin'                                                          // 14
    });                                                                              // 15
    if (!config) {                                                                   // 16
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
        return;                                                                      // 18
    }                                                                                // 19
                                                                                     // 20
    var credentialToken = Random.secret();                                           // 21
                                                                                     // 22
    var loginStyle = OAuth._loginStyle('linkedin', config, options);                 // 23
                                                                                     // 24
    var scope = [];                                                                  // 25
    if (options && options.requestPermissions) {                                     // 26
        scope = options.requestPermissions.join('+');                                // 27
    }                                                                                // 28
                                                                                     // 29
    var loginUrl =                                                                   // 30
        'https://www.linkedin.com/uas/oauth2/authorization?' +                       // 31
            'state=' + OAuth._stateParam(loginStyle, credentialToken) +              // 32
            '&response_type=code&' +                                                 // 33
            'client_id=' + config.clientId +                                         // 34
            '&scope=' + scope;                                                       // 35
                                                                                     // 36
    loginUrl += '&redirect_uri=' + OAuth._redirectUri('linkedin', config);           // 37
                                                                                     // 38
    OAuth.launchLogin({                                                              // 39
        loginService: 'linkedin',                                                    // 40
        loginStyle: loginStyle,                                                      // 41
        loginUrl: loginUrl,                                                          // 42
        credentialRequestCompleteCallback: credentialRequestCompleteCallback,        // 43
        credentialToken: credentialToken,                                            // 44
        popupOptions: {width: 470, height: 420}                                      // 45
    });                                                                              // 46
};                                                                                   // 47
                                                                                     // 48
///////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/jonperl:linkedin/template.linkedin_configure.js                          //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
                                                                                     // 1
Template.__checkName("configureLoginServiceDialogForLinkedin");                      // 2
Template["configureLoginServiceDialogForLinkedin"] = new Template("Template.configureLoginServiceDialogForLinkedin", (function() {
  var view = this;                                                                   // 4
  return HTML.Raw('<p>\n    First, you\'ll need to register your app on Linkedin. Follow these steps:\n  </p>\n  <ol>\n    <li>\n      Visit <a href="https://www.linkedin.com/secure/developer?newapp=" target="_blank">https://www.linkedin.com/secure/developer?newapp=</a>\n    </li>\n  </ol>');
}));                                                                                 // 6
                                                                                     // 7
///////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/jonperl:linkedin/linkedin_configure.js                                   //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
Template.configureLoginServiceDialogForLinkedin.siteUrl = function () {              // 1
  return Meteor.absoluteUrl();                                                       // 2
};                                                                                   // 3
                                                                                     // 4
Template.configureLoginServiceDialogForLinkedin.fields = function () {               // 5
  return [                                                                           // 6
    {property: 'clientId', label: 'API Key'},                                        // 7
    {property: 'secret', label: 'Secret Key'}                                        // 8
  ];                                                                                 // 9
};                                                                                   // 10
                                                                                     // 11
///////////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("jonperl:linkedin", {
  LinkedIn: LinkedIn,
  Linkedin: Linkedin
});

})();

(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
// packages/dferber_prerender/server/prerender.js                                        //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
                                                                                         //
var prerenderio = Npm.require('prerender-node');
var token;
var serviceUrl;
var protocol;
var settings = Meteor.settings.PrerenderIO;


token = process.env.PRERENDERIO_TOKEN || (settings && settings.token);
protocol = process.env.PRERENDERIO_PROTOCOL || (settings && settings.protocol);

// service url (support `prerenderServiceUrl` (for historical reasons) and `serviceUrl`)
serviceUrl = settings && (settings.prerenderServiceUrl || settings.serviceUrl);
serviceUrl = process.env.PRERENDERIO_SERVICE_URL || serviceUrl;


if (token) {
  if (serviceUrl) prerenderio.set('prerenderServiceUrl', serviceUrl);
  prerenderio.set('prerenderToken', token);
  if (protocol) prerenderio.set('protocol', protocol);

  prerenderio.set('afterRender', function afterRender(error) {
    if (error) {
      console.log('prerenderio error', error); // eslint-disable-line no-console
      return;
    }
  });

  WebApp.rawConnectHandlers.use(prerenderio);
}

///////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("dferber:prerender");

})();

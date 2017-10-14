//SETUP PROXY SERVER TO RUN METEOR QRS AND WEB INTEGRATION DEMO BOTH ON PORT 80

var proxy = require('redbird')({ port: Meteor.settings.public.proxyPort, ntlm: true, bunyan: false }); //bunyan:true for logging output in the console    
// Route to any local ip, for example from docker containers.

Meteor.startup(() => {
    proxy.register(Meteor.settings.public.qlikSenseHost, "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
    proxy.register(Meteor.settings.public.webIntegrationHost, "http://localhost:3030"); //need subdomain otherwise meteor root-URL does not work
    proxy.register('slides.qlik.com', "http://localhost:3060"); //need subdomain otherwise meteor root-URL does not work
    proxy.register('integration.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
    proxy.register('saasdemo.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
});
//SETUP PROXY SERVER TO RUN METEOR QRS AND WEB INTEGRATION DEMO BOTH ON PORT 80

var proxy = require('redbird')({ port: 80, ntlm: true, bunyan: false }); //bunyan:true for logging output in the console    
// Route to any local ip, for example from docker containers.

proxy.register(Meteor.settings.public.host, "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
proxy.register(Meteor.settings.public.webIntegrationHost, "http://localhost:3030"); //need subdomain otherwise meteor root-URL does not work
proxy.register('slides.qlik.com', "http://localhost:3000/integration"); //need subdomain otherwise meteor root-URL does not work
proxy.register('www.integration.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
proxy.register('integration.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
proxy.register('saasdemo.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
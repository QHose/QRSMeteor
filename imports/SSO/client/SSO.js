 import { Meteor } from 'meteor/meteor';
 import { Apps, TemplateApps } from '/imports/api/apps.js'
 import { REST_Log } from '/imports/api/APILogs';
 import { http } from 'meteor/meteor';
 import { Session } from 'meteor/session';


 Template.SSO.helpers({
     receivedParamsQlikSense: function() {
         return Session.get('senseParams');
     }
 });

 Template.SSO.events({
     'click button': (event, template) => {
         $(event.currentTarget).html('Redirecting ...');
         // console.log('SSO template, button clicked, now request a ticket server side');
         //logging only
         var call = {};
         call.action = 'Client side SSO'
         call.request = 'Qlik Sense proxy redirected the users browser to the /sso page client side. Here we can check which user is currently logged in, and call the server using this UserID (Meteor knows the userID if a client makes a server method call)';
         REST_Log(call);

         call.action = 'SSO Sense parameters'
         call.request = 'Qlik Sense proxy provided these parameters', Router.current().params.query;
         REST_Log(call);

         var senseParams = Session.get('senseParams');
         console.log('call the server with options:', senseParams);

         Meteor.call('getRedirectUrl',senseParams.proxyRestUri, senseParams.targetId, (error, redirectUrl) => {
             call.action = 'forward the user back to Sense';
             call.request = 'The browser received this redirectUrl, so replace the current url in the browser with this new one: ' + redirectUrl;
             REST_Log(call);
             window.location.replace(redirectUrl);
         });


     }
 });

 Template.SSO.onCreated(function() {
     /*
          From within a route, use:
             
              // URL: http://example.com/page/?myquerykey=true
              this.params.query   // returns the full query object
              this.params.query.myquerykey   // returns a particular query value
              Similarly, outside of the route (but still inside the client code), and inside your template, use:

              // URL: http://example.com/page/?myquerykey=true
              Router.current().params.query
              Router.current().params.query.myquerykey
              */
     const senseParams = Router.current().params.query;
     console.log('template sso onCreated, we received these params from Qlik Sense', senseParams);
     Session.set('senseParams', senseParams);
 })

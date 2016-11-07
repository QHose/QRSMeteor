 import { Meteor } from 'meteor/meteor';
 import { Apps, TemplateApps } from '/imports/api/apps.js'
 import { REST_Log } from '/imports/api/APILogs';
 import { http } from 'meteor/meteor';
 import { Session } from 'meteor/session';
 import { senseConfig } from '/imports/api/config.js';


 Template.SSO.helpers({
     receivedParamsQlikSense: function() {
         return Session.get('senseParams');
     }
 });

 Template.SSO.events({
     'click button': (event, template) => {
         $(event.currentTarget).html('Redirecting ...');
         redirectUser();
     }
 });

 function redirectUser() {
     // console.log('SSO template, button clicked, now request a ticket server side');
     //logging only
     var call = {};
     call.action = 'STEP 1: Client side SSO'
     call.request = 'Qlik Sense proxy redirected the users browser to the /sso page client side. Here we can check which user is currently logged in, and call the server using this UserID (Meteor knows the userID if a client makes a server method call)';
     REST_Log(call);

     call.action = 'STEP 2: Get request QPS parameters'
     call.request = 'UserId logged in user: ' + Meteor.userId() + '. Qlik Sense proxy provided these parameters:' + JSON.stringify(Router.current().params.query);
     REST_Log(call);

     var senseParams = Session.get('senseParams');
     console.log('call the server with options reveived from Qlik Sense QPS response: ', senseParams);

     Meteor.call('getRedirectUrl', senseParams.proxyRestUri, senseParams.targetId, Meteor.userId(), (error, redirectUrl) => {
         call.action = 'Redirect URL received';
         call.request = 'The browser received a redirectUrl, so replace the current url in the browser with this new one: ' + redirectUrl;
         REST_Log(call);
         window.location.replace(redirectUrl);
     });
 };

 Template.SSO.onCreated(function() {
     const senseParams = Router.current().params.query;
     Session.set('senseParams', senseParams);
     redirectUser();
 })

 Template.SSO.onRendered(function() {
     Template.instance()
         .$('.ui.accordion')
         .accordion();

     Template.instance().$('.dimmer')
         .dimmer('show')
 })

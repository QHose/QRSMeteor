  import { Meteor } from 'meteor/meteor';
  import { Apps, TemplateApps } from '/imports/api/apps.js'
  import { REST_Log } from '/imports/api/APILogs';
  import { http } from 'meteor/meteor';
  import { Session } from 'meteor/session';
  import { senseConfig } from '/imports/api/config.js';
  import { HTTP } from 'meteor/http';
  import { gitHubLinks } from '/imports/ui/UIHelpers';


  //if the user is redirected from the virtual proxy to
  // * /sso login a demo user
  // * /ssopresentation

  //<script src=https://<sense-server>/<virtual-proxy-if-any>/resources/translate/en-US/common.js></script>
  //try to execute this script to make sure a session cookie is set. DIV tag integration together with ticketing directly does not work.
  // import {*} from 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/resources/translate/en-US/common.js';

  Template.SSO.onCreated(function() {
      const senseParams = Router.current().params.query;
      Session.set('senseParams', senseParams);
      Session.set('SSOLoading', true);
      redirectUser();
  })

  Template.SSO.onRendered(function() {
      Template.instance()
          .$('.ui.accordion')
          .accordion();

      Template.instance().$('.dimmer')
          .dimmer('show')
  })

  Template.SSO.helpers({
      receivedParamsQlikSense: function() {
          return Session.get('senseParams');
      },
      ssoLoading: function() {
          return Session.get('SSOLoading');
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
      check(Meteor.userId(), String); //check if the user is logged in in meteor before requesting tickets on his behalf. we use the meteor userID as UDC.
      var message = "Qlik Sense proxy redirected the users browser to the /sso page client side. Here we can check which user is currently logged in, and call the server using this UserID (Meteor knows the userID if a client makes a server method call)";
      // console.log(message);
      var call = {};
      call.action = 'STEP 1: Proxy redirected the browser your SaaS platforms authentication page';
      call.url = '/images/QPS - authentication redirect flow in browser for dummies.png';
      call.request = message;
      REST_Log(call, Meteor.userId());

      call.action = 'STEP 2: Read parameters which Qlik Sense proxy provided'
      call.request = 'One parameter is the REST endpoint URL to request a ticket. Parameters:' + JSON.stringify(Router.current().params.query);
      REST_Log(call, Meteor.userId());

      var senseParams = Session.get('senseParams');
      // console.log('call the server with options reveived from Qlik Sense QPS response: ', senseParams);
      var currentPage = Router.current().route.getName();
      // console.log('router current route ',Router.current().route.getName());
      if (currentPage === 'presentationsso') {
          // console.log('PRESENTATION TICKET REQUEST: request a ticket for the user logged in into integration.qlik.com (meteorJS)');
          redirectPresentationUser(senseParams);
      } else { //login a dummy user of step 4 or for the ssbi demo
          redirectDummyUser(senseParams);
      }
  };

  //step 4 of the demo logs in a dummy user, not the user that has e.g. logged in with facebook
  function redirectDummyUser(senseParams) {
      Meteor.call('getRedirectUrl', senseParams.proxyRestUri, senseParams.targetId, Meteor.userId(), (error, redirectUrl) => {
          Session.set('SSOLoading', false);
          if (error) {
              sAlert.error(error);
              console.error('Meteor SSO page, could not get a redirectUrl from Qlik Sense', error)
          } else {
              var call = {};
              call.action = 'STEP 6: Redirect URL received';
              call.url = gitHubLinks.redirectURLReceived;
              call.request = 'The browser received a redirectUrl (where should we forward to user to? Now that he received an access ticket for Qlik Sense? This URL was initially stored in the targetId parameter.) from the server, so replace the current url in the browser with this new one: ';
              call.response = redirectUrl;
              REST_Log(call, Meteor.userId());
              window.location.replace(redirectUrl);
          }
      });
  }

  //really login the real user from facebook, or google via a ticket in qlik sense
  function redirectPresentationUser(senseParams) {
      console.log('SSO client side, really login the real user from facebook, or google via a ticket in qlik sense');

      const userProperties = {};
      userProperties.user = Meteor.userId(); //the logged in user
      userProperties.group = Session.get('groupForPresentation'); //make sure dummy users don;t get access to this app
      console.log('presentation group is ', userProperties.group);

      Meteor.call('loginUserForPresentation', senseParams.proxyRestUri, senseParams.targetId, userProperties, (error, redirectUrl) => {
          Session.set('SSOLoading', false);
          if (error) {
              sAlert.error(error);
              console.error('Meteor SSO page, could not get a redirectUrl from Qlik Sense', error)
              // Router.go('presentation'); //GO TO THE SLIDE landing page first
          } else {
              console.log('redirect URL received, now change the URL of the browser back to the slide generator page');
              Session.setAuth('authenticatedSlideGenerator', true);
              window.location.replace(redirectUrl);
          }
      });
  };

import { senseConfig, authHeaders } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';
var showdown = require('showdown');
var Cookies = require('js-cookie');
const enigma = require('enigma.js');
const qixschema = senseConfig.QIXSchema;
var appId = Meteor.settings.public.IntegrationPresentationApp;
var IntegrationPresentationSelectionSheet = Meteor.settings.public.IntegrationPresentationSelectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.IntegrationPresentationSlideObject;
var intervalId = {};

Template.landingPage.onCreated(function() {
    //set a var so the sso ticket request page knows he has to login the real user and not some dummy user of step 4
    //after the user is redirected to the sso page, we put this var to false. in that way we can still request dummy users for step 4 of the demo
    // Session.setAuth('loginUserForPresentation', true);
    Session.setAuth('groupForPresentation', null);
    Session.setAuth('userLoggedInSense', null);
    Cookies.set('showSlideSorter', 'false');
    console.log('first logout the current presentation user in Qlik Sense. After the logout, we try to open the Iframe URL, and request a new ticket with a new group: generic or technical, using section access we restrict the slides...');
    Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation users
    // logoutCurrentSenseUserClientSide();
    intervalId = Meteor.setInterval(userLoggedInSense, 500);
})
Template.presentationDimmer.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show')
})
Template.landingPage.onRendered(function() {
    //show a popup so the user can select whether he is technical or not...
    this.$('#userSelectPresentationModal').modal('show')
        .modal({
            observeChanges: true,
            onDeny: function() {
                console.log('group has been set to TECHNICAL, we use this group to request a ticket in Qlik Sense. Using Section access we limit what a user can see. Now the iframe can be shown which tries to open the presentation virtual proxy');
                Session.setAuth('groupForPresentation', 'TECHNICAL');
            },
            onApprove: function() {
                Session.setAuth('groupForPresentation', 'GENERIC');
                console.log('group has been set to GENERIC. This group is used in the ticket to limit section access (Rows)');
            }
        });
    refreshModal();

    function refreshModal() {
        Meteor.setTimeout(function() { refreshModal() }, 1);
        this.$('#userSelectPresentationModal').modal('refresh');
    }
    Session.set('landingPageAlreadySeen', true);
})
Template.landingPage.onDestroyed(function() {
    Meteor.clearInterval(intervalId);
})

Template.landingPage.helpers({
    authenticatedSlideGenerator: function() {
        return Session.get('userLoggedInSense');
    },
    userSelectedGroup: function(){
        return Session.get('groupForPresentation');
    }
})

Template.landingPage.events({
    'click #slideSorter': function(event) {
        console.log('slide button click');
        Session.set('showSlideSorter', true);
        Router.go('slideGenerator'); //GO TO THE SLIDE GENERATOR
    }
})

function userLoggedInSense() {
    // console.log('checking Qlik Sense access... is the user logged in?');

    enigma.getService('qix', {
            schema: qixschema,
            appId: appId,
            session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                host: senseConfig.host,
                prefix: Meteor.settings.public.IntegrationPresentationProxy,
                port: senseConfig.port,
                unsecure: true
            }
        })
        .then(qix => {
            console.log('user is authenticated in Qlik Sense');
            Session.set('userLoggedInSense', true);
            Meteor.clearInterval(intervalId);
        })
        .catch((ignore) => {
            // we are not yet authenticated via the iframe that tried to open qlik sense
        });
}



export function logoutCurrentSenseUserClientSide() {
    Cookies.remove('X-Qlik-Session-presentation', { path: '' });
    // delete_cookie('X-Qlik-Session-presentation','', Meteor.settings.public.host);
    //http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Personal-Delete.htm
    try {
        const call = {};
        const RESTCALL = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.IntegrationPresentationProxy + '/qps/user';
        $.ajax({
            method: 'DELETE',
            url: RESTCALL
        }).done(function(res) {
            //logging only
            call.action = 'Logout current Qlik Sense user'; //
            call.request = RESTCALL;
            call.url = 'http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Personal-Delete.htm';
            call.response = res;
            REST_Log(call, Meteor.userId());
        });
    } catch(err) {
        console.error(err);
        sAlert.Error('Failed to logout the user via the personal API', err.message);
    }
}

Template.selectSlide.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})
Template.selectSlide.helpers({
    slideObjectURL: function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.IntegrationPresentationProxy + '/single/?appid=' + appId + '&obj=' + slideObject;
    }
})

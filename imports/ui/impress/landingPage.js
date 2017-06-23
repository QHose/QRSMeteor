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

const config = {
    schema: qixschema,
    appId: appId,
    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
        host: senseConfig.host,
        prefix: Meteor.settings.public.IntegrationPresentationProxy,
        port: senseConfig.port,
        unsecure: true
    }
};

Template.landingPage.onCreated(function() {
    //set a var so the sso ticket request page knows he has to login the real user and not some dummy user of step 4
    //after the user is redirected to the sso page, we put this var to false. in that way we can still request dummy users for step 4 of the demo
    // Session.setAuth('loginUserForPresentation', true);
    Session.setAuth('groupForPresentation', null);
    Session.setAuth('userLoggedInSense', null);
    Cookies.set('showSlideSorter', 'false');
    Cookies.set('authenticatedSlideGenerator', 'false');
    console.log('first logout the current presentation user in Qlik Sense. After the logout, we try to open the Iframe URL, and request a new ticket with a new group: generic or technical, using section access we restrict the slides...');
    Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation users
    // logoutCurrentSenseUserClientSide();
    intervalId = Meteor.setInterval(userLoggedInSense, 2000);
    console.log('Qlik Sense presentation session cookie:', Cookies.get('X-Qlik-Session-presentationsso'));
    console.log('All cookies available for Javascript:');
    console.log(listCookies());
})

function listCookies() {
    var theCookies = document.cookie.split(';');
    var aString = '';
    for(var i = 1; i <= theCookies.length; i++) {
        aString += i + ' ' + theCookies[i - 1] + "\n";
    }
    return aString;
}
Template.presentationDimmer.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show')
})
Template.landingPage.onRendered(function() {
    //show a popup so the user can select whether he is technical or not...
    this.$('#userSelectPresentationModal')
        .modal({
            // observeChanges: true,
            onDeny: function() {
                console.log('group has been set to TECHNICAL, we use this group to request a ticket in Qlik Sense. Using Section access we limit what a user can see. Now the iframe can be shown which tries to open the presentation virtual proxy');
                Session.setAuth('groupForPresentation', 'TECHNICAL');
            },
            onApprove: function() {
                Session.setAuth('groupForPresentation', 'GENERIC');
                console.log('group has been set to GENERIC. This group is used in the ticket to limit section access (Rows)');
            }
        })
        .modal('show')
        .css({
            position: "fixed",
            top: '35%',
            height: 300
        });
    
    Session.set('landingPageAlreadySeen', true);
})
Template.landingPage.onDestroyed(function() {
    Meteor.clearInterval(intervalId);
})

Template.landingPage.helpers({
    authenticatedSlideGenerator: function() {
        return Session.get('userLoggedInSense');
    },
    userSelectedGroup: function() {
        return Session.get('groupForPresentation');
    }
})

Template.landingPage.events({
    'click #slideSorter': function(event) {
        Cookies.set('showSlideSorter', 'true');
        window.open("/slideSorter"); //GO TO THE SLIDE Sorter in a new tab
        // Router.go('slideSorter'); 
    }
})
Template.slideGeneratorSelectionScreen.onRendered(function() {
    this.$('.screen')
        .transition({
            animation: 'fade in',
            duration: '5s',
        });
})

function userLoggedInSense() {
    // console.log('checking Qlik Sense access... is the user logged in?');
    enigma.getService('qix', config)
        .then(qix => {
            console.log('user is authenticated in Qlik Sense. QIX object:', qix);
            Session.set('userLoggedInSense', true);
            Meteor.clearInterval(intervalId);
        }).catch((error) => {
            console.info('info: user not yet able to connect to the app via the enigma.js: ', error);
        });
}

export function logoutCurrentSenseUserClientSide() {
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

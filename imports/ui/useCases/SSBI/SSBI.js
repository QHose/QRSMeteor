import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '/imports/api/customers';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';
import _ from 'meteor/underscore';
import { insertTemplateAndDummyCustomers } from '/imports/ui/generation/OEMPartnerSide/OEMPartner';

import './SSBI.html';

const server = 'http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage;
const QMCUrl = server + '/qmc';
const hubUrl = server + '/hub';
const sheetUrl = server + '/sense/app/' + Meteor.settings.public.SSBIApp;
const appUrl = server + '/sense/app/' + Meteor.settings.public.SSBIAppSheetString;


Template.SSBISenseApp.helpers({
    show() {
        console.log('show iframe?: ', showIFrame());
        return showIFrame();
    }
});

function showIFrame() {
    return Session.get('currentUser') && !Session.equals('loadingIndicator', 'loading') ? 'Yes' : null;
}

Template.SSBISenseIFrame.onRendered(function() {
    this.$('.IFrameSense')
        .transition('slide in right');
})

Template.SSBISenseIFrame.helpers({
    appURL() {
        console.log('SSBISenseIFrame: de app url is: ', appUrl);
        return appUrl;
    },
});

Template.SSBIUsers.helpers({
    userType(type) {
        console.log('usertype: ', Session.get('userType'));
        return Session.equals('userType', type) ? true : '';
    },
    currentUser() {
        if (Session.get('currentUser')) {
            return '(' + Session.get('currentUser') + ' currently logged in)';
        }
    },
    user() {
        return Session.get('currentUser');
    },
    showSenseButtons() {
        return Session.get('currentUser') && !Session.equals('loadingIndicator', 'loading') ? 'Yes' : null;
    }
})

Template.SSBIUsers.events({
    'click .consumer' () {
        login('John');
    },
    'click .contributor' () {
        login('Linda');
    },
    'click .developer' () {
        login('Martin');
    },
    'click .admin' () {
        login('Paul');
    },
    'click .selfservice ' () {
        $('.ui.modal.SSBI')
            .modal('show');
    },
    'click .button.hub ' () {
        refreshIframe(hubUrl);
    },
    'click .button.sheet ' () {
        refreshIframe(sheetUrl);
    },
    'click .button.app ' () {
        refreshIframe(appUrl);
    },
    'click .button.QMC ' () {
        refreshIframe(QMCUrl);
    }
});

Template.SSBIUsers.onCreated(function() {
    // Meteor.call('resetLoggedInUser');
})

Template.SSBIUsers.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

Template.userCards.onRendered(function() {
    Session.set('userType', null);
    this.$('.dimmable.image').dimmer({
        on: 'hover'
    });
    this.$('.column')
        .transition('scale in');
})

Template.senseButtons.onRendered(function() {
    this.$('.SenseIframe')
        .transition('swing up');
})

Template.senseButtons.onRendered(function() {
    this.$('.SenseIframe')
        .transition('scale in');
})

function login(user) {
    console.log('login ', user, Meteor.userId());
    try {
        Session.set('loadingIndicator', 'loading');
        Session.set('currentUser', user);

        var URLtoOpen = appUrl;
        Meteor.call('simulateUserLogin', user, (error, result) => {
            if (error) {
                sAlert.error(error);
                console.log(error);
            } else {
                console.log('All other users logged out, and we inserted the new user ' + user + ' in the local database');

                if (user === 'Paul') {
                    console.log('user is paul, so change url to QMC');
                    URLtoOpen = server + '/qmc';
                } else if (user === 'Martin') {
                    var id = Meteor.settings.public.SSBIApp;
                    URLtoOpen = hubUrl;
                }
                Session.set('loadingIndicator', '');
                //refreshIframe(URLtoOpen);
                sAlert.success(user + ' is now logged in into Qlik Sense');
            }
        })
    } catch (err) {
        sAlert.error(err.message);
    }
};

function refreshIframe(URLtoOpen) {
    console.log('refresh Iframe url', URLtoOpen);
    $("iframe").attr("src", URLtoOpen);
    var myFrame = document.querySelector('iframe');
    console.log('refresh this Iframe DIV in Dom', myFrame);
    myFrame.parentNode.replaceChild(myFrame.cloneNode(), myFrame);
};

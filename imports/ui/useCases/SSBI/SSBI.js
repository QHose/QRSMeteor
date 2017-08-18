import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '/imports/api/customers';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';
import _ from 'meteor/underscore';
import { insertTemplateAndDummyCustomers } from '/imports/ui/generation/OEMPartnerSide/OEMPartner';

import './SSBI.html';

const server = 'http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage;
console.log('server', server)
const QMCUrl = server + '/qmc';
const hubUrl = server + '/hub';
const sheetUrl = server + '/sense/app/' + config.SSBIAppId;
const appUrl = server + '/' + config.SSBIAppId + "/sheet/" + Meteor.settings.SSBI.sheetId + "/state/analysis";


Template.SSBISenseApp.helpers({
    show() {
        // console.log('SSBISenseApp helper, show iframe?: ', showIFrame());
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
        // console.log('SSBISenseIFrame helper: de app url is: ', Session.get('appUrl'));
        return Session.get('appUrl');
    },
});

Template.SSBIUsers.helpers({
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
            .modal('show')
            .modal('refresh')
            .modal('refresh');

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
    Session.set('appUrl', appUrl);
})

Template.SSBIUsers.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

Template.userCards.onRendered(function() {
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

// Template.senseButtons.onRendered(function() {
//     this.$('.SenseIframe')
//         .transition('scale in');
// })

function login(user) {
    // console.log('login ', user, Meteor.userId());
    try {
        Session.set('loadingIndicator', 'loading');
        Session.set('currentUser', user);

        var URLtoOpen = Session.get('appUrl');
        console.log('login: the url to open from session is: ', URLtoOpen);
        Meteor.call('simulateUserLogin', user, (error, result) => {
            if (error) {
                sAlert.error(error);
                console.log(error);
            } else {
                console.log('All other users logged out, and we inserted the new user ' + user + ' in the local database');
                Session.set('loadingIndicator', '');
                refreshIframe(URLtoOpen);
                sAlert.success(user + ' is now logged in into Qlik Sense');
            }
        })
    } catch (err) {
        console.error(err);
        sAlert.error(err.message);
    }
};

function refreshIframe(URLtoOpen) {
    Session.set('appUrl', URLtoOpen);
    Session.set('loadingIndicator', 'loading');
    console.log('function refresh Iframe,  url', URLtoOpen);
    Session.set('loadingIndicator', '');
};
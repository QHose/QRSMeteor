import {
    Template
} from 'meteor/templating';
import {
    Customers,
    dummyCustomers
} from '/imports/api/customers';
import {
    Session
} from 'meteor/session';
import {
    senseConfig
} from '/imports/api/config';
import '/imports/ui/UIHelpers';
import _ from 'meteor/underscore';
import {
    insertTemplateAndDummyCustomers
} from '/imports/ui/generation/OEMPartnerSide/OEMPartner';

import './SSBI.html';

var server, QMCUrl, hubUrl, sheetUrl, appUrl = '';

Template.SSBISenseApp.helpers({
    show() {
        // console.log('SSBISenseApp helper, show iframe?: ', showIFrame());
        return showIFrame();
    }
});

function showIFrame() {
    return Session.get('currentUser') && !Session.equals('loadingIndicator', 'loading') ? 'Yes' : null;
}


Template.SSBIUsers.onCreated(function() {
    Session.set('loadingIndicator', '');
    Session.set('currentUser', null);
    console.log('------------------------------------');
    console.log('SSBISenseIFrame created');
    console.log('------------------------------------');
    server = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.slideGenerator.virtualProxy;
    console.log('server', server)
    QMCUrl = server + '/qmc';
    hubUrl = server + '/hub';
    sheetUrl = server + '/sense/app/' + Session.get('SSBIAppId');
    console.log('sheetUrl', sheetUrl)
    appUrl = server + "/sense/app/" + Session.get('SSBIAppId') + "/sheet/" + Meteor.settings.public.SSBI.sheetId + "/state/analysis";
    console.log('SSBIApp URL', appUrl);

})

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
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'John',
            'Attributes': [{
                    'group': 'CONSUMER'
                },
                {
                    'group': 'GERMANY'
                },
            ],
        };
        login(passport);
    },
    'click .contributor' () {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'Linda',
            'Attributes': [{
                    'group': 'CONTRIBUTOR'
                },
                {
                    'group': 'UNITED STATES'
                },
            ],
        };
        login(passport)
    },
    'click .developer' () {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'Martin',
            'Attributes': [{
                'group': 'DEVELOPER'
            }],
        };
        login(passport);
    },
    'click .admin' (e, t) {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'Paul',
            'Attributes': [{
                    'group': 'ADMIN'
                },
                {
                    'group': 'ITALY'
                },
            ],
        };
        login(passport);
    },
    'click .selfservice ' () {
        $('.ui.modal.SSBI')
            .modal('show')
            .modal('refresh')
            .modal('refresh');

    },
    'click .button.hub ' () {
        Session.set('appUrl', hubUrl);
    },
    'click .button.sheet ' () {
        Session.set('appUrl', sheetUrl);
    },
    'click .button.app ' () {
        Session.set('appUrl', appUrl);
    },
    'click .button.QMC ' () {
        Session.set('appUrl', QMCUrl);
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

async function login(passport) {
    try {
        //logout the current user in the browser via a server side call
        // var currentUser = getCurrentUserLoggedInSense()
        // console.log('currentUser', currentUser)
        Meteor.call('logoutPresentationUser', Meteor.userId(), Session.get('currentUser'));

        Session.set('currentUser', passport.UserId);
        //update the user collection for the saas provisioning demo, to keep in sync... 
        // Meteor.callPromise('simulateUserLogin', passport.UserId);
        var URLtoOpen = Session.get('appUrl');
        var ticket = await Meteor.callPromise('requestTicketWithPassport', Meteor.settings.public.slideGenerator.virtualProxy, passport);
        URLtoOpen += '?QlikTicket=' + ticket;
        console.log('login: the url to open is: ', URLtoOpen);

        getCurrentUserLoggedInSense();
        sAlert.success(passport.UserId + ' is now logged in into Qlik Sense');
        $('.SSBI .image.' + passport.UserId).css('background', '#62AC1E');
    } catch (err) {
        console.error(err);
        sAlert.error('Login error', err.message);
    }
};


async function getCurrentUserLoggedInSense() {
    try {
        const RESTCALL = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.slideGenerator.virtualProxy + '/qps/user';
        console.log('REST call to logout the user: ', RESTCALL)
        var result = await HTTP.getPromise(RESTCALL)
        console.log('current user in Sense', result);
    } catch (err) {
        console.error(err);
        sAlert.Error('Failed to get the user via the personal API', err.message);
    }
}
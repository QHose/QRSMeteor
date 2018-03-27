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

<<<<<<< HEAD
const server = 'http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage;
const QMCUrl = server + '/qmc';
const hubUrl = server + '/hub';
const sheetUrl = server + '/sense/app/' + Meteor.settings.public.SSBIApp;
const appUrl = server + '/sense/app/' + Meteor.settings.public.SSBIAppSheetString;

=======
var server, QMCUrl, hubUrl, sheetUrl, appUrl = '';
>>>>>>> simplify-settings-file

Template.SSBISenseApp.helpers({
    show() {
        // console.log('SSBISenseApp helper, show iframe?: ', showIFrame());
        return Session.get('currentUser') && !Session.equals('loadingIndicator', 'loading') ? 'Yes' : null;
    }
});



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
        return Session.get('IFrameUrl');
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
        Session.set('IFrameUrl', hubUrl);
    },
    'click .button.sheet ' () {
        Session.set('IFrameUrl', sheetUrl);
    },
    'click .button.app ' () {
        Session.set('IFrameUrl', appUrl);
    },
    'click .button.QMC ' () {
        Session.set('IFrameUrl', QMCUrl);
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
        var URLtoOpen = Session.get('appUrl');
<<<<<<< HEAD
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
        }
        catch (err) {
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
=======
        var ticket = await Meteor.callPromise('requestTicketWithPassport', Meteor.settings.public.slideGenerator.virtualProxy, passport);
        console.log('------------------------------------');
        console.log('requesting requestTicketWithPassport at virtual proxy: ' + Meteor.settings.public.slideGenerator.virtualProxy + ' with passport: ' + passport);
        console.log('------------------------------------');
        URLtoOpen += '?QlikTicket=' + ticket;
        console.log('login: the url to open is: ', URLtoOpen);

        // getCurrentUserLoggedInSense();
        sAlert.success(passport.UserId + ' is now logged in into Qlik Sense');
        Session.set('IFrameUrl', URLtoOpen);
        // $('.SSBI .image.' + passport.UserId).css('background', '#62AC1E');
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
>>>>>>> simplify-settings-file

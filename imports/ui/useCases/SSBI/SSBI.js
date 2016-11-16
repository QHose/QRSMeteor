import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '/imports/api/customers';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

import './SSBI.html';

Template.SSBISenseApp.helpers({
    appURL() {
        var appURL = 'http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage + '/sense/app/' + Meteor.settings.public.SSBIAppSheetString;
        console.log(appURL)
        return appURL;
    }
});

Template.SSBIUsers.events({
    'click .consumer' () {
        login('John');
    },
    'click .contributor' () {
        console.log('login contributor');
        login('Linda');
    },
    'click .developer' () {
        login('Martin');
    },
    'click .admin' () {
        login('Paul');
    }
});

Template.SSBIUsers.onRendered(function() {
    this.$('.special.cards .image').dimmer({
        on: 'hover'
    });
})

function login(user) {
    console.log('login ', user, Meteor.userId());
    try {
        Meteor.call('resetLoggedInUser');
        Meteor.call('simulateUserLogin', user);
    } catch (err) {
        sAlert.error(err.message);
    }
};

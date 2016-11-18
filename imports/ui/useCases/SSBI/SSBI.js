import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '/imports/api/customers';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';
import _ from 'meteor/underscore';

import './SSBI.html';

Template.SSBISenseApp.helpers({
    appURL() {
        var appURL = 'http://presales1:81/meteor/hub'; //Session.get('appURL');

        // var appURL = 'http://presales1:81/meteor/sense/app/40ef70c9-be76-4844-ac6a-d53195146c85/sheet/puEpZK/state/analysis';//Session.get('appURL');
        console.log('de app url is: ', appURL);
        if (appURL) {
            return appURL;
        }
    }
});

Template.SSBIUsers.helpers({
    userType(type) {
        console.log('usertype: ', Session.get('userType'));
        return Session.equals('userType', type) ? true : '';
    }
})

Template.SSBIUsers.events({
    'click .consumer' () {
        console.log('click login consumer');
        Session.set('userType', 'consumer');
        login('John');
    },
    'click .contributor' () {
        console.log('login contributor');
        Session.set('userType', 'contributor');
        login('Linda');
    },
    'click .developer' () {
        console.log('click login contributor');
        Session.set('userType', 'developer');
        login('Martin');
    },
    'click .admin' () {
        Session.set('userType', 'admin');
        console.log('click login admin');
        login('Paul');
    }
});

Template.SSBIUsers.onRendered(function() {
    Session.set('userType', null);
    this.$('.dimmable.image').dimmer({
        on: 'hover'
    });
})

function successmessage() {

}

function login(user) {
    console.log('login ', user, Meteor.userId());
    try {
        Meteor.call('simulateUserLogin', user, (error, result) => {
            if (error) {
                sAlert.error(error);
                console.log(error);
            } else {
                console.log('All other users logged out, and we inserted the new user ' + user + ' in the local database');
                var server = 'http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage;
                var appURL = server + '/sense/app/' + Meteor.settings.public.SSBIAppSheetString;
                if (user === 'Paul') {
                    console.log('user is paul, so change url to QMC');
                    appURL = server + '/qmc';
                } else if (user === 'Martin') {
                    var id = Meteor.settings.public.SSBIApp;
                    appURL = server + '/hub';
                }

                $("iframe").attr("src", appURL);
                var myFrame = document.querySelector('iframe');
                console.log('refresh Iframe url', myFrame);
                // myFrame.contentWindow.location.reload(true);
                myFrame.parentNode.replaceChild(myFrame.cloneNode(), myFrame);
                sAlert.success('We switched the user in Qlik Sense');
            }
        })
    } catch (err) {
        sAlert.error(err.message);
    }
};

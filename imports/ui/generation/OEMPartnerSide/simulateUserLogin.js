import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';

import './simulateUserLogin.html';

Template.simulateUserLogin.onRendered(function() {
    $('.ui.dropdown')
        .dropdown();
});

Template.simulateUserLogin.events({
    'change #currentUser' (event, template) {
        var currentUser = template.$("#currentUser")
            .val();
        console.log('helper: user made a selection in the simulateUserLogin box, for user: ' + currentUser + ' with Meteor.userId():' + Meteor.userId());
        try {
            Meteor.call('simulateUserLogin', currentUser);
        } catch (err) {
            sAlert.error(err.message);
        }
    },
    'click .selfservice' () {
        $('.ui.modal.SSBI')
            .modal('show');
    },
    'click .button.webIntegrationDemo' (event, template) {
        // Prevent default browser form submit
        event.preventDefault();
        var currentUser = template.$("#currentUser")
            .val();
        if (!currentUser) {
            sAlert.error('No user, please select a user in the dropdown');
            return;
        } else {
            window.open('http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort+'/hub');
        }
    },
});

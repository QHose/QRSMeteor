import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';

import './simulateUserLogin.html';

Template.simulateUserLogin.onRendered(function() {
    this.$('.ui.dropdown')
        .dropdown();
    this.$('.message')
        .transition('scale in');
});

Template.simulateUserLogin.events({
    'change #currentUser' (event, template) {
        var currentUser = template.$("#currentUser")
            .val();
        Session.set('currentUser', currentUser);
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
    }
});

import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import './layout.html';
import './checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';
// import './pages/modals.html';

Template.layout.helpers({
    NoSenseConnection() {
        return Session.get('NoSenseConnection');
    }
});

Template.layout.events({
    'click': function(event, template) {
        Template.instance().$('.button').popup('remove popup')
    },
    'click .stepByStep' () {
        $('.ui.modal.stepByStep')
            .modal('show');
    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show');
    },
    'click .selfservice' () {
        $('.ui.modal.SSBI')
            .modal('show');
    },
    'click .APIAutomation' () {
        $('.ui.modal.APIAutomation')
            .modal('show');
    },
})



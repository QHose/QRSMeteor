import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import './layout.html';
import '../checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';
// import './pages/modals.html';

Template.layout.helpers({
    NoSenseConnection() {
        return Session.get('NoSenseConnection');
    }
});

Template.presentationLayout.helpers({
    userSelectionMade() {
        return Session.get('groupForPresentation'); //if the user selected a presentation type try to login
    }
});

Template.layout.events({
    'keydown, click': function(event, template) {
        Template.instance().$('*').popup('remove popup')
    },
    'click .stepByStep' () {
        $('.ui.modal.stepByStep')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .selfservice' () {
        $('.ui.modal.SSBI')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .APIAutomation' () {
        $('.ui.modal.APIAutomation')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
})

Template.layout.onCreated(function() {
    //see https://guide.meteor.com/data-loading.html
    this.subscribe('streams');
    this.subscribe('customers');

    const templateAppsHandle = Meteor.subscribe('templateApps');
    const apiLogsHandle = Meteor.subscribe('apiLogs');
    const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {
            // if (freshEnvironment()) {
            //     console.log('There is a freshEnvironment');
            //     insertTemplateAndDummyCustomers()
            //     Session.setAuth('currentStep', 3);
            // };
        },
        onError: function() { console.log("onError", arguments); }
    });
});



import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';

import './layout.html';
import './presentation.html';
import './presentation';
import '../checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';
import { getQix } from '/imports/ui/useCases/useCaseSelection';


const webIntegrationDemo = 'http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort;

Template.layout.helpers({
    NoSenseConnection() {
        return Session.get('NoSenseConnection');
    }
});

Template.loginDimmer.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show');
});

Template.modalSaaSautomation.onRendered(function() {
    this.$('.ui.embed').embed();
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


Template.slideSelectionSheet.onRendered(function() {
    $('#myModal').on('hidden.bs.modal', async function() {
        console.log('slide selection modal closed');
        var ticket = 'dummy, user should already be authenticated at this point...'
        var qix = await getQix(ticket);
        qix.app.abortModal(true);
    })
})
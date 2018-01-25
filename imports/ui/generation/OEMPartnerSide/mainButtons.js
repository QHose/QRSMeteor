import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '/imports/api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { APILogs } from '/imports/api/APILogs';

import './mainButtons.html'



Template.mainButtons.events({
    'click .forwardToSSOStep' () {
        console.log('forward to step 4 sso clicked');
        // Session.setAuth('generated?', true);
        Session.setAuth('currentStep', 4);
    },
    'click .backToStep3' () {
        Session.setAuth('currentStep', 3);
    },
    'click .backToStep2' () {
        Session.setAuth('currentStep', 2);
    },
    'click .backToStep1' () {
        Session.setAuth('currentStep', 1);
        FlowRouter.go('users');
    },
    'click .oneStepBack' () {
        Session.setAuth('currentStep', Session.get('currentStep') - 1);
    },
    'click .deleteAllCustomers' () {
        Meteor.call('removeAllCustomers', function(err, result) {
            if (err) {
                sAlert.error(err);
            } else {
                sAlert.success('All customers have been deleted from the local database of the SaaS platform');
            }
        });
    },
    'click .toggleAllCustomers' () {
        // console.log('deSelect all dummyCustomers clicked');

        _.each(Customers.find({})
            .fetch(),
            function(customer) {
                Customers.update(customer._id, {
                    $set: { checked: !customer.checked },
                });
            })
    },
    'click .button.webIntegrationDemo' (event, template) {
        // Prevent default browser form submit
        event.preventDefault();
        var currentUser = Session.get('currentUser');

        if (!currentUser) {
            sAlert.error('No user, please select a user in the dropdown');
            return;
        } else {
            window.open('http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort + '/hub');
        }
    },
})

Template.mainButtons.onRendered(function() {
    Template.instance()
        .$('.ui.dropdown')
        .dropdown();

    this.$('.resetEnvironment')
        .popup({
            title: 'Reset demo',
            content: 'Delete all apps and streams you have generated.'
        });

    this.$('.button.generateStreamAndApp')
        .popup({
            title: 'Start provisioning',
            content: 'Create the selected apps for each customer.'
        });


})
Template.step2Buttons.onRendered(function() {
    this.$('.backToStep1')
        .popup({
            title: 'Back to step 1',
            content: 'Go back one step, in order to maintain the customers and users.'
        });
})

Template.APIButton.onRendered(function() {
    this.$('.button.ApiLogsTable')
        .popup({
            title: 'API Calls',
            content: 'View the API calls between this demo platform and Qlik Sense.'
        });
})

Template.step3Buttons.onRendered(function() {
    this.$('.backToStep2')
        .popup({
            title: 'Back to step 2',
            content: 'Go back on step, in order to select the template apps.'
        });
    this.$('.forwardToSSOStep')
        .popup({
            title: 'Go to step 4',
            content: 'Go forward one step without generating first, this lets you test the single sign on using the users and their groups.'
        });


});

Template.step4Buttons.helpers({
    userSelected() {
        return Session.get('currentUser');
    }
})

Template.step4Buttons.onRendered(function() {
    this.$('.backToStep3')
        .popup({
            title: 'Back to step 3',
            content: 'Go back one step, this enables you to start restart the generation of streams and apps (provisioning).'
        });
});
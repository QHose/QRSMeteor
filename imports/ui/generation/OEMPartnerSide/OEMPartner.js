import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '/imports/api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { APILogs } from '/imports/api/APILogs';
import { freshEnvironment } from '/imports/ui/UIHelpers';

import './OEMPartner.html';
import './customerOverview.js';
import './simulateUserLogin.js';
import './step2';
import './step3';
import './step4';
import './mainButtons';

import lodash from 'lodash';
_ = lodash;



Template.OEMPartner.helpers({
    linkToApp() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/sense/app/' + this.id
    },
    RESTCallSettings: function() {
        return {
            rowsPerPage: 6,
            responsive: true,
            autoWidth: false,
            showFilter: false,
            showNavigation: 'never',
            showColumnToggles: false,
            fields: [{
                    key: 'action',
                    label: 'Activities that are currently being executed via API calls'
                },
                // {
                //     key: 'request',
                //     label: 'Request',
                //     cellClass: "overflow: hidden; text - overflow: ellipsis"
                // },
                {
                    key: 'createDate',
                    hidden: true,
                    label: 'Create Date',
                    sortOrder: 0,
                    sortDirection: 'descending'
                }
            ]
        };
    },
    restrictedApiLogs: function() {
        return APILogs.find({}, { fields: { 'response.content': 0 } });
    }
});


Template.OEMPartner.events({
    'submit .new-customer' (event) {
        // Prevent default browser form submit
        event.preventDefault();
        // Get value from form element
        const target = event.target;
        const customerName = target.text.value;
        // Insert a task into the collection
        Customers.insert({
            name: customerName,
            checked: true,
            createdAt: new Date(), // current time
            createdBy: Meteor.user()
        });
        // Clear form
        target.text.value = '';
    },
    'click .resetEnvironment' () {
        Session.set('loadingIndicator', 'loading');
        Meteor.call('resetEnvironment', function(err, res) {
            if (err) {
                sAlert.error(err);
                console.log(err);
                Session.set('loadingIndicator', '');
            } else {
                Session.set('loadingIndicator', '');
                sAlert.success("Qlik Sense has been cleaned up. We've removed all streams and apps");
            }
        });
        Session.set('currentStep', 0);
        Session.set('generated?', false);
        // Session.set('goToSt', false);
    },
    'click .generateStreamAndApp' () {
        Session.set('loadingIndicator', 'loading');

        var selectedCustomers = Customers.find({ generationUserId: Meteor.userId(), checked: true })
            .fetch();

        Meteor.call('generateStreamAndApp', selectedCustomers, function(err, result) {
            if (err) {
                sAlert.error(err);
                console.log(err);
                Session.set('loadingIndicator', '');
                Session.setAuth('generated?', false);
            } else {
                Session.set('loadingIndicator', '');
                Session.setAuth('generated?', true);
                Session.setAuth('currentStep', 4);
                console.log('generateStreamAndApp succes', result);
                sAlert.success('We have created "a copy" of the template app for each customer. And to group the apps, we created a stream with the name of the customer');
            }
        });
    },
    'click .insertDummyCustomers' (event) {
        event.preventDefault();
        insertTemplateAndDummyCustomers();
    },
    'click .goToStep3' (event) {
        if (TemplateApps.find().count()) {
            Session.setAuth('currentStep', 3);
            sAlert.success('We have now selected the customers and the apps they need. Now press start to create the apps in Qlik Sense');
        } else {
            sAlert.error('Please select at least one template');
        }
    },

}); //end Meteor events


export function insertTemplateAndDummyCustomers() {
    _.each(dummyCustomers, function(customer) {
        customer.generationUserId = Meteor.userId();
        Customers.insert(customer);
    })

    // const templateAppId = Meteor.settings.public.templateAppId;
    // console.log('Insert insertTemplateAndDummyCustomers, with templateAppId', templateAppId);
    Session.setAuth('currentStep', 2);

    // TemplateApps.insert({
    //     name: "My first template",
    //     id: templateAppId,
    //     generationUserId: Meteor.userId(),
    //     checked: true
    // });

    sAlert.success('We have pre-selected some fictitious customers. Which apps will you provide your customers?');
}


// Template.OEMPartner.onCreated(function() {
//     //see https://guide.meteor.com/data-loading.html
//     const templateAppsHandle = Meteor.subscribe('templateApps');
//     const apiLogsHandle = Meteor.subscribe('apiLogs');
//     const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
//         onReady: function() {
//             // if (freshEnvironment()) {
//             //     console.log('There is a freshEnvironment');
//             //     insertTemplateAndDummyCustomers()
//             //     Session.setAuth('currentStep', 3);
//             // };
//         },
//         onError: function() { console.log("onError", arguments); }
//     });
// });

Template.OEMPartner.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();
})


Template.templateCheckBox.onRendered(function() {
    Template.instance()
        .$('.ui.toggle.checkbox')
        .checkbox();
})

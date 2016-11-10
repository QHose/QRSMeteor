import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { APILogs } from '/imports/api/APILogs';
import { freshEnvironment } from '/imports/ui/UIHelpers';

import './OEMPartner.html';

Template.OEMPartner.helpers({
    loading() {
        return Session.get('loadingIndicator');
    },
    linkToApp() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/sense/app/' + this.id
    },
    appsInTemplateStream() {
        console.log('apps found', Apps.find({ "stream.name": "Templates" }).fetch());
        return Apps.find({ "stream.name": "Templates" });
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
                    label: 'Action'
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
                sAlert.success('We have deleted all the previously generated streams and apps, so you have a fresh demo environment.');
            }
        });
        Session.set('currentStep', 1);
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
                console.log('generateStreamAndApp succes', result);
                sAlert.success('For each selected customer a stream equal to the name of the customer has been made, and a copy of the template has been published in this stream');
            }
        });
    },
    'click .insertDummyCustomers' (event) {
        event.preventDefault();
        insertTemplateAndDummyCustomers();
    },
    'click .goToStep3' (event) {
        Session.set('currentStep', 3);
    },

}); //end Meteor events

Template.templateCheckBox.events({
    'change .checkbox.template' (event) {
        console.log('selectie box change, this heeft waarde ', this);
        var currentApp = this;

        TemplateApps.upsert(currentApp.id, {
            $set: {
                name: currentApp.name,
                id: currentApp.id,
                generationUserId: Meteor.userId(),
                checked: !this.checked
            },
        });
    }
})

Template.templateOverview.helpers({
    templateApps() {
        return TemplateApps.find();
    },
    NrTemplates() {
        return TemplateApps.find()
            .count();
    },
})

Template.templateOverview.events({
    'click .removeTemplateApp' () {
        TemplateApps.remove(this._id);
    },

})

Template.customerOverview.helpers({
    NrCustomers() {
        return Customers.find()
            .count();
    },
})

Template.customerOverview.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

Template.templateOverview.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

function insertTemplateAndDummyCustomers() {
    _.each(dummyCustomers, function(customer) {
        customer.generationUserId = Meteor.userId();
        Customers.insert(customer);
    })

    const templateAppId = Meteor.settings.public.templateAppId;
    console.log('Insert insertTemplateAndDummyCustomers, with templateAppId', templateAppId);
    Session.set('currentStep', 3);
    TemplateApps.insert({
        name: "My first template",
        id: templateAppId,
        generationUserId: Meteor.userId(),
        checked: true
    });
}

Template.mainButtonsCustomers.events({
    'click .forwardToSSOStep' () {
        console.log('forward to step 4 sso clicked');
        Session.set('generated?', true);
    },
    'click .backToStep3' () {
        Session.set('generated?', false);
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
    }
})

Template.OEMPartner.onCreated(function() {
    //see https://guide.meteor.com/data-loading.html
    const templateAppsHandle = Meteor.subscribe('templateApps');
    const apiLogsHandle = Meteor.subscribe('apiLogs');
    const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {
            if (freshEnvironment()) {
                console.log('There is a freshEnvironment');
                insertTemplateAndDummyCustomers()
            };
        },
        onError: function() { console.log("onError", arguments); }
    });
});

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


Template.mainButtonsCustomers.onRendered(function() {
    Template.instance()
        .$('.ui.dropdown')
        .dropdown();

    this.$('.resetEnvironment')
        .popup({
            content: 'Delete all apps and streams you have generated'
        });

    this.$('.forwardToSSOStep')
        .popup({
            content: 'Go forward one step without generating first, this lets you test the single sign on using the users and their groups.'
        });
})

Template.forwardToSSOStep.onRendered(function() {
    this.$('.forwardToSSOStep')
        .popup({
            content: 'Go forward one step without generating first, this lets you test the single sign on using the users and their groups. Choose the row level security app for example.'
        });
})

Template.step4Buttons.onRendered(function() {
    this.$('.backToStep3')
        .popup({
            content: 'Go back one step, this lets you generate the apps and streams again'
        });
    this.$('.ApiLogsTable')
        .popup({
            content: 'View the API calls'
        });
})

Template.step4.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

Template.step3.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();

})

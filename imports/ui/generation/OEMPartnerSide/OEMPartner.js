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
import './step3';
import './step4';
import './mainButtons';

import lodash from 'lodash';
_ = lodash;



Template.OEMPartner.helpers({
    linkToApp() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/sense/app/' + this.id
    },
    appsInTemplateStream() {
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

Template.templateCheckBox.helpers({
    checked() {
        var selectedTemplates = TemplateApps.find().fetch();
        var templateSelected = _.some(selectedTemplates, ['id', this.id]);
        return templateSelected ? 'checked' : '';
    },
})

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
                sAlert.success('Using the APIs, we have deleted all the previously generated streams and apps, so you have a fresh demo environment.');
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
                Session.setAuth('currentStep', 4);
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
        if (TemplateApps.find().count()) {
            Session.setAuth('currentStep', 3);
        }else
        {
            sAlert.error('Please select at least one template');
        }
    },

}); //end Meteor events

Template.templateCheckBox.events({
    'change .checkbox.template' (event, template) {
        var currentApp = this;
        var selector = {
            'generationUserId': Meteor.userId(),
            'id': currentApp.id
        };

        if (event.target.checked) {
            Meteor.call('upsertTemplate', selector, currentApp);

        } else {
            Meteor.call('removeTemplate', selector, currentApp);
        }
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
    Session.setAuth('currentStep', 3);
    TemplateApps.insert({
        name: "My first template",
        id: templateAppId,
        generationUserId: Meteor.userId(),
        checked: true
    });

    sAlert.success('We inserted some dummy customers and selected a template app for you. Now you can press start to start the provisioning of your SaaS platform');

}


Template.OEMPartner.onCreated(function() {
    //see https://guide.meteor.com/data-loading.html
    const templateAppsHandle = Meteor.subscribe('templateApps');
    const apiLogsHandle = Meteor.subscribe('apiLogs');
    const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {
            if (freshEnvironment()) {
                console.log('There is a freshEnvironment');
                insertTemplateAndDummyCustomers()
                Session.setAuth('currentStep', 3);
            };
        },
        onError: function() { console.log("onError", arguments); }
    });
});

Template.OEMPartner.onRendered(function() {
    if (!Session.get('currentStep')) { Session.set('currentStep', 3); }
    Template.instance()
        .$('.ui.embed')
        .embed();
})


Template.templateCheckBox.onRendered(function() {
    Template.instance()
        .$('.ui.toggle.checkbox')
        .checkbox();
})

import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { APILogs } from '/imports/api/APILogs';

import './OEMPartner.html';

Template.OEMPartner.helpers({
    templateApps() {
        return TemplateApps.find();
    },
    loading() {
        return Session.get('loadingIndicator');
    },
    NrCustomers() {
        return Customers.find()
            .count();
    },
    linkToApp() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/sense/app/' + this.id
    },
    RESTCallSettings: function() {
        return {
            rowsPerPage: 3,
            responsive: true,
            autoWidth: true,
            showFilter: false,
            showNavigation: 'never',
            showColumnToggles: false,
            fields: [{
                key: 'action',
                label: 'Action'
            }, {
                key: 'request',
                label: 'Request',
                cellClass: "overflow: hidden; text - overflow: ellipsis"
            }, {
                key: 'createDate',
                hidden: true,
                label: 'Create Date',
                sortOrder: 0,
                sortDirection: 'descending'
            }]
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
        Session.set('generated?', false);
    },
    'click .generateStreamAndApp' () {
        console.log('click event generateStreamAndApp');
        Session.set('loadingIndicator', 'loading');

        var selectedCustomers = Customers.find({ checked: true })
            .fetch();

        Meteor.call('generateStreamAndApp', selectedCustomers, function(err, result) {
            if (err) {
                sAlert.error(err);
                console.log(err);
                Session.set('loadingIndicator', '');
                Session.set('generated?', false);
            } else {
                Session.set('loadingIndicator', '');
                Session.set('generated?', true);
                console.log('generateStreamAndApp succes', result);
                sAlert.success('For each selected customer a stream equal to the name of the customer has been made, and a copy of the template has been published in this stream');
                Meteor.call('updateLocalSenseCopy');
            }
        });
    },
    'click .removeTemplateApp' () {
        TemplateApps.remove(this._id);
    },
    'click .insertDummyCustomers' (event) {
        event.preventDefault();
        _.each(dummyCustomers, function(customer) {
            Customers.insert(customer);
            console.log("Inserted " + customer.name);
        })
    },
    'click .deleteAllCustomers' () {
        console.log('delete all dummyCustomers clicked');
        Meteor.call('removeAllCustomers', function(err, result) {
            if (err) {
                sAlert.error(err);
            } else {
                sAlert.success('All customers have been deleted from the local database of the SaaS platform');
            }
        });
    },
    'click .toggleAllCustomers' () {
        console.log('deSelect all dummyCustomers clicked');

        _.each(Customers.find({})
            .fetch(),
            function(customer) {
                Customers.update(customer._id, {
                    $set: { checked: !customer.checked },
                });
            })
    },
    'click .selfservice' () {
        $('.ui.modal.SSBI')
            .modal('show');
    },
    'click .APIAutomation' () {
        $('.ui.modal.APIAutomation')
            .modal('show');
    }
}); //end Meteor events



Template.OEMPartner.onRendered(function() {
    const templateAppsHandle = Meteor.subscribe('templateApps');
    const apiLogsHandle = Meteor.subscribe('apiLogs');

    Template.instance()
        .$('.ui.embed')
        .embed();

    Template.instance()
        .$('.ui.dropdown')
        .dropdown();
})

Template.step4.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();

})

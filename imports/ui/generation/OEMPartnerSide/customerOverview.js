import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '/imports/api/customers.js';
import './customerOverview.html';

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

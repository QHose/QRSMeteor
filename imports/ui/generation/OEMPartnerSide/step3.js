import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '/imports/api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { APILogs } from '/imports/api/APILogs';
import './step3.html';

Template.step3.helpers({
    templateApps() {
        return TemplateApps.find();
    },
})

Template.step3.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

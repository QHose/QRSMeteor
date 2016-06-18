import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'


Template.users.helpers({
    customers() {
        return Customers.find({}, { sort: { checked: -1 } });
    }
})

Template.users.events({
    'click .delete' () {
        Customers.remove(this._id);
    }

});


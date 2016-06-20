import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
// import { senseConfig as config } from '/imports/api/config.js';
// import { Apps, TemplateApps } from '/imports/api/apps.js'
// import { Customers, dummyCustomers } from '../api/customers.js';
// import { Streams } from '/imports/api/streams.js'


Template.nav.onRendered(function() {
    console.log('nav onRendered');
    this.$('.ui.menu')
     .popup()
});

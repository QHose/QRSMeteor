import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'

Template.simulateUserLogin.onRendered(function() {
   $('.ui.dropdown')
  .dropdown()
;
});

Template.simulateUserLogin.events({
    'change #currentUser' (event, template) {
        var currentUser = template.$("#currentUser")
            .val();
        console.log('helper: user made a selection in the simulateUserLogin box, for user: ' + currentUser);
        try {
            Meteor.call('simulateUserLogin', currentUser);
        } catch (err) {
            sAlert.error(err.message);
        }
    }
});
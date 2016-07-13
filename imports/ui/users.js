import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { ironRouter } from 'meteor/iron:router';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import '/imports/ui/UIHelpers';

AutoForm.addHooks(['insertCustomerForm'], {
    onSuccess: function(operation, result, template) {
        sAlert.success('We inserted the customer into our local Mongo Database');
        //Router.go("/posts");
    }
});




// Template.users.helpers({
//     customersWithUsers() {
//         var customers = Customers.find({})
//         var users = _.map(customers, function(customer) {
//             _.map(customer.users, function(user) {
//                 var user = {};
//                 user.customer = customer.name
//                 user.name = user.name
//                     return user;
//             })

//         })
//     }
// });

Template.users.events({
    'click .delete' () {
        Customers.remove(this._id);
    },
    'click .backToGeneration' () {
        Router.go('generation');
    }

});

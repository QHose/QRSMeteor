import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { ironRouter } from 'meteor/iron:router';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import '/imports/ui/UIHelpers';


//http://www.webtempest.com/meteor-js-autoform-tutorial
AutoForm.addHooks(['insertCustomerForm'], {
    onSuccess: function(operation, result, template) {
        sAlert.success('We inserted the customer into your local MongoDB, we will forward this user to Qlik Sense via a security ticket.');
        //Router.go("/posts");
    },
    before: {
        // Replace `formType` with the form `type` attribute to which this hook applies
        insert: function(customer) {
            // Potentially alter the doc
            if (Meteor.userId()) {
                customer.generationUserId = Meteor.userId();
                customer.checked = true;
            }
            console.log('insert users add hook', customer);
            return customer;
        }
    },
});

Template.users.helpers({
    autoSaveMode: function() {
        //return Session.get("autoSaveMode") ? true : false;
        return true;
    },
    selectedCustomerDoc: function() {
        return Customers.findOne(Session.get("selectedCustomer"));
    },
    isSelectedCustomer: function() {
        return Session.equals("selectedCustomer", this._id);
    },
    formType: function() {
        if (Session.get("selectedCustomer")) {
            return "update";
        } else {
            return "disabled";
        }
    },
    disableButtons: function() {
        return !Session.get("selectedCustomer");
    },
    ribbon: function() {
        return Session.equals("selectedCustomer", this._id) ? "ui ribbon label" : '';
    },
    active: function() {
        return Session.equals("activeCustomer", this._id) ? "active" : '';
    },
});


Template.users.events({
    '.customer-row' (event, template) {
        console.log('mouseenter event user table');
        // var row = event.currentTarget;
        Session.set("activeCustomer", this._id);
    },
    'click .delete' () {
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
        Customers.remove(this._id);        
        Session.set("selectedCustomer", '');
    },
    'click .backToGeneration' () {
        Router.go('generation');
    },
    'click .customer-row': function() {
        Session.set("selectedCustomer", this._id);
        console.log('customer click, selectedCustomer', this._id);
    },
    'change' () {
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
    }
});

Template.users.onRendered(function() {  
    AutoForm.setDefaultTemplate("semanticUI");
})

Template.users.onCreated(function() {
    this.subscribe('customers');
})

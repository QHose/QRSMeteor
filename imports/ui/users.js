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

Template.users.helpers({
    autoSaveMode: function() {
        //return Session.get("autoSaveMode") ? true : false;
        return true;
    },
    selectedPersonDoc: function() {
        return Customers.findOne(Session.get("selectedCustomer"));
    },
    isSelectedPerson: function() {
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
    }
});


Template.users.events({
    'click .delete' () {
        Customers.remove(this._id);
    },
    'click .backToGeneration' () {
        Router.go('generation');
    },
    'click .customer-row': function() {
        Session.set("selectedCustomer", this._id);
        console.log('customer click, selectedCustomer', this._id);
    },
    'change .autosave-toggle': function() {
        Session.set("autoSaveMode", !Session.get("autoSaveMode"));
    }

});

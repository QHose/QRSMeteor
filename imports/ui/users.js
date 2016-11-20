import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { ironRouter } from 'meteor/iron:router';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import '/imports/ui/UIHelpers';
import { insertTemplateAndDummyCustomers } from '/imports/ui/generation/OEMPartnerSide/OEMPartner';


//http://www.webtempest.com/meteor-js-autoform-tutorial
AutoForm.addHooks(['insertCustomerForm'], {
    onSuccess: function(operation, result, template) {
        sAlert.success('We inserted the customer into your local MongoDB.');
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
            // console.log('insert users add hook', customer);
            return customer;
        }
    },
});

SimpleSchema.debug = true;

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
        console.log('go to step 2 clicked')
        Session.set('currentStep', 2);
        Router.go('generation');
    },
    'click .customer-row': function() {
        Session.set("selectedCustomer", this._id);
        console.log('customer click, selectedCustomer', this._id);
    },
    'change' () {
        console.log('something changed resetLoggedInUser');
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
    },
    'click .insertDummyCustomers' (event) {
        event.preventDefault();
        insertTemplateAndDummyCustomers();
    },
    'click .insertNewCustomer' () {
        $('.ui.modal.insertCustomer')
            .modal('show');
        Meteor.setTimeout(function(){refreshModal()}, 1);
        Meteor.setTimeout(function(){refreshModal()}, 2);
    }
});


function refreshModal() {
    return $('.ui.modal.insertCustomer').modal('refresh');
}
Template.insertCustomer.events({
    'keypress ' () {
        console.log('something changed');
        $('.ui.modal.insertCustomer').modal('refresh');
    },
    'click .closeInsertModal'(){
       $('.ui.modal.insertCustomer').modal('hide'); 
    }
})

Template.modalRefresher.onRendered(function() {
    $('.ui.modal.insertCustomer').modal('refresh');
});

Template.users.onRendered(function() {  
    AutoForm.setDefaultTemplate("semanticUI");
})

Template.insertCustomer.onRendered(function() {  
    this.$('.ui.modal.insertCustomer').modal('refresh');
})


Template.users.onCreated(function() {
    this.subscribe('customers');
    Session.set('currentStep', 1);
})

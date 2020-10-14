import {
    Template
} from 'meteor/templating';
import {
    senseConfig as config
} from '/imports/api/config.js';
import {
    ironRouter
} from 'meteor/iron:router';
import {
    Apps,
    TemplateApps
} from '/imports/api/apps.js'
import {
    Customers,
    dummyCustomers
} from '/imports/api/customers.js';
import {
    Streams
} from '/imports/api/streams.js'
import '/imports/ui/UIHelpers';
import {
    insertTemplateAndDummyCustomers
} from '/imports/ui/generation/OEMPartnerSide/OEMPartner';

import './users.html';


//http://www.webtempest.com/meteor-js-autoform-tutorial
AutoForm.addHooks(['insertCustomerForm'], {
    onSuccess: function(operation, result, template) {
        // sAlert.success('We inserted the customer into your local MongoDB.');
        //Router.go("/posts");
    },
    // before: {
    //     // Replace `formType` with the form `type` attribute to which this hook applies
    //     insert: function(customer) {
    //         // Potentially alter the doc
    //         if (Meteor.userId()) {
    //             customer.generationUserId = Meteor.userId();
    //             customer.checked = true;
    //         }
    //         console.log('insert users add hook', customer);
    //         return customer;
    //     }
    // },
});

SimpleSchema.debug = false;

Template.users.helpers({
    autoSaveMode: function() {
        //return Session.get("autoSaveMode") ? true : false;
        return true;
    },
    isselectedCustomer: function() {
        return Session.equals("selectedCustomerStep1", this._id);
    },
    formType: function() {
        if (Session.get("selectedCustomerStep1")) {
            return "update";
        } else {
            return "disabled";
        }
    },
    showUpdateScreen: function() {
        return Session.get("selectedCustomerStep1");
    },
    ribbon: function() {
        return Session.equals("selectedCustomerStep1", this._id) ? "ui ribbon label" : '';
    },
    active: function() {
        return Session.equals("activeCustomer", this._id) ? "active" : '';
    },
    isChrome: function() { //update screen does not work with edge and firefox because of a bug somehwere
        var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        console.log('user is using Chrome? ', isChrome);
        return isChrome;
    }
});

Template.displayUsers.helpers({
    selectedCustomerDoc: function() {
        // console.log('selectedCustomerStep1 helper doc ', Customers.findOne(Session.get("selectedCustomerStep1")));
        return Customers.findOne(Session.get("selectedCustomerStep1"));
    },
})

Template.updateUserFormStep1.helpers({
    selectedCustomerDoc: function() {
        // console.log('selectedCustomerStep1 helper doc ', Customers.findOne(Session.get("selectedCustomerStep1")));
        return Customers.findOne(Session.get("selectedCustomerStep1"));
    },
})


Template.updateGroupsFormStep1.events({
    'change' (evt, template) {
        //will give you your data context also
        console.log('form changed');

        try {
            //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
            Meteor.call('resetLoggedInUser');
        } catch (err) {}

        var updatedUser = {
            name: Template.currentData().name,
            group: template.find("[name='group']").value,
            country: template.find("[name='country']").value,
            currentlyLoggedIn: false
        };

        Meteor.call('updateUserForCustomer', updatedUser);
        // sAlert.success('Groups are updated for ' + updatedUser.name);
    }
});

Template.users.events({
    '.customer-row' (event, template) {
        console.log('mouseenter event user table');
        // var row = event.currentTarget;
        Session.set("activeCustomer", this._id);
    },
    'click .delete' () {
        try {
            Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
        } catch (err) {
            //ignore
        }
        Customers.remove(this._id);
        Session.set("selectedCustomerStep1", '');
    },
    'click .backToGeneration' () {
        console.log('go to step 2 clicked')
        event.preventDefault();
        Session.set('currentStep', 2);
        Router.go('generation_embedded');
    },
    'click .customer-row': function() {
        Session.set("selectedCustomerStep1", this._id);
    },
    'click .insertDummyCustomers' (event) {
        event.preventDefault();
        insertTemplateAndDummyCustomers();
    },
    'click .insertNewCustomer' () {
        $('#insertCustomer').modal('show')
            .modal({
                observeChanges: true
            });
        refreshModal();
    }

});


function refreshModal() {
    Meteor.setTimeout(function() {
        refreshModal()
    }, 1);
    return $('#insertCustomer').modal('refresh');
}
Template.insertCustomer.events({
    'click .closeInsertModal' () {
        $('#insertCustomer').modal('hide');
    }
})

Template.modalRefresher.onRendered(function() {
    $('#insertCustomer').modal('refresh');
});

Template.users.onRendered(function() {  
    AutoForm.setDefaultTemplate("semanticUI");
})

Template.updateGroupsFormStep1.onRendered(function() {  
    this.$('.ui.dropdown')
        .dropdown();

    // setTimeout(function() {
    //     template.$('.ui.dropdown.country')
    //         .dropdown('set text', this.data.country);
    //     template.$('.ui.dropdown.group')
    //         .dropdown('set text', this.data.group);
    //     // console.log('set group box to', updatedUser.group);
    // }, 300)

})

Template.insertCustomer.onRendered(function() {  
    this.$('#insertCustomer').modal('refresh');
})


Template.users.onCreated(function() {
    // this.subscribe('customers');
    Session.set('currentStep', 1);

    //see https://guide.meteor.com/data-loading.html     
    const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {},
        onError: function() {
            console.log("onError", arguments);
        }
    });

})
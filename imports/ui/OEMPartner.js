import { Template } from 'meteor/templating';
import { EngineConfig } from '/imports/api/config.js';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { updateSenseInfo } from './body.js';
import { Streams } from '/imports/api/streams.js'

import './OEMPartner.html';


Template.OEMPartner.helpers({    
    engineConfig() {        
        return EngineConfig.findOne({});            
    },
    engineConfigCollection(){        
        return EngineConfig;
    },
    customers() {
        return Customers.find({}, { sort: { checked: -1 } });
    },   
    templateApps() {
        return TemplateApps.find();
    },
    
});

Template.OEMPartner.events({
    'submit .new-customer' (event) {
        // Prevent default browser form submit
        event.preventDefault();
        // Get value from form element
        const target = event.target;
        const customerName = target.text.value;
        // Insert a task into the collection
        Customers.insert({
            name: customerName,
            createdAt: new Date(), // current time
        });
        // Clear form
        target.text.value = '';
    },
    'click .generateStreamAndApp' () {
        console.log('click event generateStreamAndApp');

        var selectedCustomers = Customers.find({ checked: true })
            .fetch();
        // console.log('get customers from database, and pass them to the generateStreamAndApp method', selectedCustomers);

        Meteor.call('generateStreamAndApp', selectedCustomers, function(err, result) {
            if (err) {
                sAlert.error(err);
                console.log(err);
            } else {
                console.log('generateStreamAndApp succes', result);
                sAlert.success('For each selected customer a stream equal to the name of the customer has been made, and a copy of the template has been published in this stream');
                updateSenseInfo();
            }
        });
    },   
    'click .removeTemplateApp' () {
        TemplateApps.remove(this._id);
    },
    'click .insertDummyCustomers' () {
        _.each(dummyCustomers, function(customer) {
            Customers.insert(customer);
            console.log("Inserted " + customer.name);
        })
    },
    'click .deleteAllCustomers' () {
        console.log('delete all dummyCustomers clicked');        
        Meteor.call('removeAllCustomers', function(err, result) {
            if (err) {
                sAlert.error(err);                
            } else {                
                sAlert.success('All customers have been deleted from the local database of the SaaS platform');            
            }
        });
    },
    'click .toggleAllCustomers' () {
        console.log('deSelect all dummyCustomers clicked');

        _.each(Customers.find({})
            .fetch(),
            function(customer) {
                Customers.update(customer._id, {
                    $set: { checked: !customer.checked },
                });
            })
    }
}); //end Meteor events

Template.OEMPartner.onRendered(function() {
    this.$(".dropdown")
        .dropdown();
});

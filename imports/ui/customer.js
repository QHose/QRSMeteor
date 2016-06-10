import { Template } from 'meteor/templating';
import { Customers } from '../api/customers.js';
import { TemplateApps } from '../api/apps.js';

import './customer.html';


Template.customer.events({
  'click .toggle-checked'() {
    // Set the checked property to the opposite of its current value
    Customers.update(this._id, {
      $set: { checked: ! this.checked },
    });
  },
  'click .delete'() {
    Customers.remove(this._id);
    //todo: remove the stream too
    // updateSenseInfo();
  }
  ,
  'click .generateStream'() {
  	var customerName = this.name;
    Meteor.call('createStream',customerName, function(err, result) {
      if (err) {
        sAlert.error(err);        
      } else {        
        sAlert.success('Stream created for customer: '+customerName); 
        updateSenseInfo();
      }
    })
  },
  // 'click .copyApp'() {
  //   console.log('copyApp clicked');
  //   var customer = this; //if you click on a row in the customer template, the current customer is available in this

  //   Meteor.call('copyAppSelectedCustomers', function(err, result) {
  //     if (err) {
  //       sAlert.error(err);
  //       console.log(err);
  //     } else {
  //       console.log('copy app succes', result);
  //       sAlert.success('App copied for customer: '+customerName); //, and apps have been published into the customer stream ');
  //       updateSenseInfo();
  //     }
  //   });
  // }
  
});




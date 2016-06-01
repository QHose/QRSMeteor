import { Template } from 'meteor/templating';
import { Customers } from '../api/customers.js';
import { updateSenseInfo } from './body.js';

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
        console.log(err);
      } else {
        console.log('generateStream succes', result);
        sAlert.success('Streams created for this customer'+customerName); //, and apps have been published into the customer stream ');
        updateSenseInfo();
      }
    });
  },
  'click .generateApp'() {
    var customerName = this.name;
    Meteor.call('copyApp',customerName, function(err, result) {
      if (err) {
        sAlert.error(err);
        console.log(err);
      } else {
        console.log('generateApp succes', result);
        sAlert.success('Streams created for this customer'+customerName); //, and apps have been published into the customer stream ');
        updateSenseInfo();
      }
    });
  }
  
});




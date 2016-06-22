import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import './layout.html';
import './checkConfig.html';

Template.layout.helpers({
    NoSenseConnection() {
        // const instance = Template.instance();      
        // return instance.connection.get();
        return Session.get('NoSenseConnection');
    }
});


Template.layout.onRendered(function() {
  // const instance = this;
  // instance.connection = new ReactiveVar();
  console.log('UI HELPER: Check if we have a connection to Sense?');
  Meteor.call('getStreams', (error, result) => {
    if (error) {      
      console.error(error);
      Session.set('NoSenseConnection', true);
      sAlert.error("We can't connect to Qlik Sense, is your Sense VM running, all services started? , virtual proxy 'hdr' configured?");
    } else {
      var message = "Connected to Qlik Sense via the REST API's, we have tested this by requesting the list of streams via the QRS REST API."; 
      console.log(message);
      sAlert.info(message);
      Session.set('NoSenseConnection', false);
    }
  });
});
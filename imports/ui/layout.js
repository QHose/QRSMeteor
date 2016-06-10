import { Template } from 'meteor/templating';

import './layout.html';
import './checkConfig.html';

Template.layout.helpers({
    NoSenseConnection() {
        const instance = Template.instance();      
        // return instance.connection.get();
        return Session.get('NoSenseConnection');
    }
});


Template.layout.onCreated(function() {
  const instance = this;
  instance.connection = new ReactiveVar();
  console.log('UI HELPER: Check if we have a connection to Sense?');
  Meteor.call('getStreams', (error, result) => {
    if (error) {      
      console.error(error);
      Session.set('NoSenseConnection', true);
      sAlert.error("We can't connect to Qlik Sense, is sense running, virtual proxy configured?");
    } else {
      console.log('OK: This tool can connect to Qlik Sense, we tested the HTTP REST CALL by getting the applist');
      sAlert.info("Connected to Qlik Sense via the REST API's, we send and obtain JSON objects and present them in this page");
      Session.set('NoSenseConnection', false);
    }
  });
});
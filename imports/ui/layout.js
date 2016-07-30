import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import './layout.html';
import './checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';

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
  console.log('Layout onRendered: Check if we have a connection to Sense?');
  Meteor.call('getStreams', (error, result) => {
    if (error) {      
      console.error(error);
      Session.set('NoSenseConnection', true);
      sAlert.error("We can't connect to Qlik Sense, is your Sense VM running, all services started?, virtual proxy 'hdr' configured? Check the host settings in settings-XYZ.json in the root folder");
    } else {
      var message = "Connected to Qlik Sense via the REST API's, we have tested this by requesting the list of streams via the QRS REST API."; 
      console.log(message);
      sAlert.info(message);
      Session.set('NoSenseConnection', false);
    }
  });
});


user.environment.group="Developer"
and
(
(resource.resourcetype = "App" and resource.stream.HasPrivilege("read")) 
or 
(resource.resourcetype = "App.Object" 
and 
resource.app.HasPrivilege("read")
)
)
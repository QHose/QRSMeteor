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
 
});

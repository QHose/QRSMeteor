import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import './layout.html';
import './checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';

Template.layout.helpers({
    NoSenseConnection() {
        return Session.get('NoSenseConnection');
    }
});

Template.layout.events({
    'click': function(event, template) {
        Template.instance().$('.button').popup('remove popup')
    }
})

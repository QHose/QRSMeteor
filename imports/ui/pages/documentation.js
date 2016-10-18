import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.documentation.onRendered(function() {
    this.$('.menu .item')
        .tab();
});
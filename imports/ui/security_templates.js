import { Accounts } from 'meteor/accounts-base';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';

Template.register.events({
    'submit form': function(event) {
        event.preventDefault();
        var email = $('[name=email]')
            .val();
        var password = $('[name=password]')
            .val();
        Accounts.createUser({
            email: email,
            password: password
        });
    }
});

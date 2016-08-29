import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';

Template.securityRules.helpers({
    securityRulesSettings: function() {
        return {
            rowsPerPage: 10,
            showFilter: true,
            showColumnToggles: true
        };
    },
    getSecurityRules: function() {
        console.log(Session.get('securityRules'));
        return Session.get('securityRules');
    },
    active() {
        return Session.get('loadingIndicator');
    },

})

Template.securityRules.events({
    'click .selfservice ' () {        
        $('.ui.modal.SSBI')
            .modal('show');
    }
})

Template.securityRules.onRendered(function() {
    console.log('Get the system rules from Sense');
    $('.dimmer')
        .dimmer('show');

    Meteor.call('getSecurityRules', (error, result) => {
        if (error) {
            console.error(error);
            Session.set('loadingIndicator', '');
        } else {
            console.log('********* onRendered, System rules received from Sense: ', result);
            Session.set('securityRules', result);
        }
        $('.dimmer')
            .dimmer('hide');
    });

})

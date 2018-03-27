import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';

Template.securityRules.helpers({
    securityRulesSettings: function() {
        return {
            rowsPerPage: 10,
            responsive: true,
            autoWidth: true,
            showFilter: true,
            showColumnToggles: true,
            fields: [{
                key: 'name',
                label: 'name',
                sortOrder: 1,
                sortDirection: 'descending'
            }, 'rule', 'resourceFilter', 'comment'],
        };
    },
    getSecurityRules: function() {
        // console.log(Session.get('securityRules'));
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
    this.$('.dimmer')
        .dimmer('show');

    Meteor.call('getSecurityRules', (error, result) => {
        if (error) {
            console.error(error);
            Session.set('loadingIndicator', '');
        } else {
            Session.set('securityRules', result);
            console.log('result', result)
        }
        $('.dimmer')
            .dimmer('hide');
    });
    var inputBox = this.$('.reactive-table-input.form-control');
    inputBox.val('Z_');
    var e = jQuery.Event("keydown");
    e.which = 13; // # Some key code value
    inputBox.trigger(e)
})
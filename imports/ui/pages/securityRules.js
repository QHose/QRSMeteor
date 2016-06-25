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
    getSecurityRules: function(){
        console.log(Session.get('securityRules'));
        return Session.get('securityRules');

    }

})

Template.securityRules.onRendered(function() {
    console.log('Get the system rules from Sense');
  Meteor.call('getSecurityRules', (error, result) => {
    if (error) {      
      console.error(error);      
      sAlert.error("We can't connect to Qlik Sense, is your Sense VM running, all services started? , virtual proxy 'hdr' configured?");
    } else {
      Session.set('securityRules', result);
    }
  });
})

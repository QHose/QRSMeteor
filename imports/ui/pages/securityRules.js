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
        return Session.get('securityRules');
    }

})

Template.securityRules.onRendered(function() {
    console.log('Get the security Rules from Sense');
  Meteor.call('getSecurityRules', (error, result) => {
    if (error) {      
      console.error(error);      
      sAlert.error("We can't connect to Qlik Sense, is your Sense VM running, all services started? , virtual proxy 'hdr' configured?");
    } else {
      console.log('we received these security rules; ', securityRules);
      Session.set('securityRules', result);
    }
  });
})

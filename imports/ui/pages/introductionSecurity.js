import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';


Template.introductionSecurity.onRendered(function() {
     Template.instance().$('.ui.embed').embed();  
})

Template.SecurityDeepDive.onRendered(function() {
     Template.instance().$('.ui.embed').embed();  
})

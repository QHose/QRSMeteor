import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';


Template.introductionSecurity.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.architecture.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.introductionSecurity.events({
    'click .mindMapSecurity' () {
        $('.ui.modal.mindMapSecurity')
            .modal('show');
    },
     'click .integratedFlowModal' () {
        $('.ui.modal.integratedFlowModal')
            .modal('show');
    }
})

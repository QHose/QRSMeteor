import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';


Template.webIntegration.events({
    'click .webIntegrationMindMap' () {
        $('.ui.modal.webIntegrationMindMap')
            .modal('show');
    }
})

Template.webIntegration.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();
})

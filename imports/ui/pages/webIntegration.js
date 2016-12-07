import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';


Template.webIntegration.events({
    'click .webIntegrationMindMap' () {
        $('.ui.modal.webIntegrationMindMap')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    }
})

Template.webIntegration.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();

    // // lazy load images
    // Template.instance()
    //     .$('.image')
    //     .visibility({
    //         type: 'image',
    //         transition: 'vertical flip in',
    //         duration: 500
    //     });
})

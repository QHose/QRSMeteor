
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';

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

Template.introductionSecurity.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();

    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });

})

Template.architecture.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.introductionArchitecturePage.onRendered(function() {

    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });
})

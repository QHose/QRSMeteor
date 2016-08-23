import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';




Template.introduction.events({
    'click .stepByStep' () {
        $('.ui.modal.stepByStep')
            .modal('show');
    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show');
    }
});

Template.introduction.onRendered(function() {
    // console.log('introduction onRendered');

    Template.instance()
        .$('.ui.embed')
        .embed();

    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });

})

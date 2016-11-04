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
    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });

    Template.instance().$('.ui.positive.button')
        .popup({
            title: 'Multi-tenant demo',
            content: 'Press "register" on the bottom of the next page to create an account. This ensures you will get your own demo space within Qlik Sense. To help you we already selected some dummy customers and template app for you.',
            delay: {
                show: 100,
                hide: 0
            }
        });

})

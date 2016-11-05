import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';




Template.introduction.events({
   
});

Template.introduction.onRendered(function() {
    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });

    Template.instance().$('.ui.positive.button')
        .popup({
            title: 'Register first',
            content: 'Press "register" on the bottom of the next page to create an account (not linked to Qlik.com). To get you started we already selected some dummy customers and a template app for you.',
            delay: {
                show: 100,
                hide: 0
            }
        });
    Template.instance()
        .$('.ui.embed')
        .embed();

})

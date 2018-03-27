import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';

Template.introduction.onRendered(function() {
    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });

    Template.instance()
        .$('.ui.embed')
        .embed();

})
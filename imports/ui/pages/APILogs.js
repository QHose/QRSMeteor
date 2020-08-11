import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';
import './sequenceDiagrams.html'
import './sequenceDiagrams.js'
import hljs from 'highlight.js'
import moment from 'moment';


Template.ApiLogsTable.helpers({
    restrictedApiLogs: function() {
        return APILogs.find({}, {
            fields: {
                'response.content': 0,
            },
            sort: { createDate: -1 }
        });
    },
    formattedResponse: function(value) {
        return formatResponse(value)
    }

})

//convert a js object to a html string with extra classes added. 
function formatResponse(value) {
    if (value) {
        var objectToString = new Spacebars.SafeString(JSON.stringify(value, undefined, 2));
        return objectToString;
        // var highlighted = hljs.highlightAuto(objectToString.string).value;
        // return highlighted;
    }
}

Template.APILogs.onRendered(function() {
    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });
    Template.instance()
        .$('.ui.embed')
        .embed();
});

Template.ApiLogsTable.onCreated(function() {
    const apiLogsHandle = Meteor.subscribe('apiLogs');
});
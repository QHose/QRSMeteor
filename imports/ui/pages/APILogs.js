import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';
import './sequenceDiagrams.html'
import './sequenceDiagrams.js'
import hljs from 'highlight.js'
import moment from 'moment';


Template.ApiLogsTable.helpers({
    // RESTCallSettings: function() {
    //     return {
    //         rowsPerPage: 20,
    //         responsive: false,
    //         autoWidth: false,
    //         showFilter: true,
    //         showColumnToggles: true,
    //         fields: [
    //             { key: 'action', label: 'Action' },
    //             { key: 'request', label: 'Request from SaaS platform' }, {
    //                 key: 'response',
    //                 label: 'Response from Qlik Sense',
    //                 fn: function(value) {
    //                     return formatResponse()
    //                 }
    //             }, {
    //                 key: 'createDate',
    //                 label: 'Date',
    //                 sortDirection: 'descending',
    //                 fn: function(value) {
    //                     return value.toLocaleDateString();
    //                 }
    //             }, {
    //                 key: 'createDate',
    //                 label: 'Time',
    //                 sortDirection: 'descending',
    //                 fn: function(value) {
    //                     return value.toLocaleTimeString();
    //                 }
    //             }, {
    //                 key: 'createDate',
    //                 label: 'Time',
    //                 hidden: true,
    //                 sortOrder: 0,
    //                 sortDirection: 'descending'
    //             }
    //         ]
    //     };
    // },
    restrictedApiLogs: function() {
        return APILogs.find({}, {
            fields: {
                'response.content': 0,
                // 'response.headers.set-cookie': 0 
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
    if(value) {
        var objectToString = new Spacebars.SafeString(JSON.stringify(value, undefined, 2));
        var highlighted = hljs.highlightAuto(objectToString.string).value;
        return highlighted;
    }
}

Template.APILogs.events({
    'click .sequenceOverview' () {
        $('.ui.modal.sequenceOverview')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
        // .modal({
        //     // observeChanges: true,
        //     detachable: false
        // })


    },
    'click .sequenceGeneration' () {
        $('.ui.modal.sequenceGeneration')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .APIIntegrationMindMap' () {
        $('.ui.modal.APIIntegrationMindMap')
            .modal('show')
            // .modal('refresh')
            .modal('refresh');
    }
})

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

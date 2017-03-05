import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';
import './sequenceDiagrams.html'
import './sequenceDiagrams.js'
import hljs from 'highlight.js'
import moment from 'moment';


Template.ApiLogsTable.helpers({
    RESTCallSettings: function() {
        return {
            rowsPerPage: 20,
            responsive: false,
            autoWidth: false,
            showFilter: true,
            showColumnToggles: true,
            fields: [
                { key: 'action', label: 'Action' },
                { key: 'request', label: 'Request from SaaS platform' }, {
                    key: 'response',
                    label: 'Response from Qlik Sense',
                    fn: function(value) {
                        if (value) {
                            return new Spacebars.SafeString('<pre id="json">' + JSON.stringify(value, undefined, 2) + '</pre>')
                        }
                    }
                }, {
                    key: 'createDate',
                    label: 'Date',
                    sortDirection: 'descending',
                    fn: function(value) {
                        return value.toLocaleDateString();
                    }
                }, {
                    key: 'createDate',
                    label: 'Time',
                    sortDirection: 'descending',
                    fn: function(value) {
                        return value.toLocaleTimeString();
                    }
                }, {
                    key: 'createDate',
                    label: 'Time',
                    hidden: true,
                    sortOrder: 0,
                    sortDirection: 'descending'
                }
            ]
        };
    },
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
        //make sure all code gets highlighted using highlight.js                
        if (value) {
            return new Spacebars.SafeString(JSON.stringify(value, undefined, 2));
        }
    }

})

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
            .modal('refresh')
            .modal('refresh');
    }
})

Template.APILogs.onRendered(function() {
    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });

    Tracker.autorun(function() {
        console.log('API log table changed so, tracker runs after which we can update the code using highlight.js');
        var temp = APILogs.find();
        $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    });


});


Template.ApiLogsTable.onCreated(function() {
    const apiLogsHandle = Meteor.subscribe('apiLogs');
});

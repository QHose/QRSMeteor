import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';
import './sequenceDiagrams.html'
import './sequenceDiagrams.js'
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
            }
        });
    },
    formattedResponse: function(value) {
        if (value) {
            return new Spacebars.SafeString('<pre id="json">' + JSON.stringify(value, undefined, 2) + '</pre>')
        }
    }

})

Template.APILogs.events({
    'click .sequenceOverview' () {
        $('.ui.modal.sequenceOverview')
            // .modal({
            //     // observeChanges: true,
            //     detachable: false
            // })
            .modal('show')
            // .modal('refresh');
    },
    'click .sequenceGeneration' () {
        $('.ui.modal.sequenceGeneration')
            .modal('show')
            // .modal('refresh');

    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show');
    },
    'click .APIIntegrationMindMap' () {
        $('.ui.modal.APIIntegrationMindMap')
            .modal('show');
    }
})

Template.APILogs.onRendered(function() {
    Template.instance()
        .$('.ui.accordion')
        .accordion({ exclusive: false });
});


Template.ApiLogsTable.onCreated(function() {
    const apiLogsHandle = Meteor.subscribe('apiLogs');
});

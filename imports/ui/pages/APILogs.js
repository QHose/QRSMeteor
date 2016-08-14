import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import _ from 'underscore';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';
import '/imports/ui/external/raphael-min';
import '/imports/ui/external/sequence-diagram-min';
// import '/imports/ui/external/underscore-min';

console.log('de value of _', _);

Template.APILogs.helpers({
    RESTCallSettings: function() {
        return {
            collection: APILogs,
            rowsPerPage: 10,
            responsive: true,
            autoWidth: false,
            showFilter: true,
            showColumnToggles: true,
            fields: [
                { key: 'action', label: 'Action' },
                { key: 'request', label: 'Request' }, {
                    key: 'response',
                    label: 'Response',
                    fn: function(value) {
                        return new Spacebars.SafeString('<pre id="json">' + JSON.stringify(value, undefined, 2) + '</pre>')
                    }
                },
                { key: 'createDate', label: 'Date', sortOrder: 0, sortDirection: 'descending'  },
                { key: 'createdBy', label: 'Created by' },
            ]
        };
    }
})

Template.APILogs.onRendered(function() {
    $(".diagram").sequenceDiagram({theme: 'hand'});
});
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import '/imports/ui/UIHelpers';
import { APILogs } from '/imports/api/APILogs';

Template.APILogs.helpers({
    RESTCallSettings: function() {
        return {
            collection: APILogs,
            rowsPerPage: 10,
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
                { key: 'createDate', label: 'Date' },
                { key: 'createdBy', label: 'Created by' },
            ]
        };
    }
})

import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '../api/customers';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';


import './generation.html';
import { Apps, TemplateApps } from '/imports/api/apps';
import { APILogs } from '/imports/api/APILogs';
import { Streams } from '/imports/api/streams';
import './customer';
import './OEMPartner';
import moment from 'moment';
import lodash from 'lodash';
_ = lodash;

Template.APILogs.helpers({
    RESTCallSettings: function() {
        return {
            collection: APILogs,
            rowsPerPage: 5,
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

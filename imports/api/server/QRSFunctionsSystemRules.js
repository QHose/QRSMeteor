import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import { APILogs } from '/imports/api/APILogs';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
import { myQRS } from '/imports/api/server/QRSAPI';
var qrs = new myQRS();


getSecurityRules();

export function getSecurityRules() {
    return qrs.get('/qrs/systemrule').data;
};
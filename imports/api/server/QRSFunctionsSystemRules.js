import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';


export function getSecurityRules() {    
    try {
        const result = HTTP.get('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/system/full', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }            
        })
        // console.log(result.data);
        return result.data;
    } catch (err) {
        throw new Meteor.Error('get system rules failed', err.message);
    }
};

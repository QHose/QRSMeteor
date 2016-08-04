import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';
import { REST_Log } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, certs, authHeadersCertificate, certicate_communication_options } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;


/*
When communicating with the QPS APIs, the URL is as follows:
https://<QPS machine name>:4243/<path>

Each proxy has its own session cookie, so you have to logout the users per proxy used.
*/

export function logoutUser(name) {
    console.log('******** QPS Functions: logout the current: '+ name+ ' on proxy: '+senseConfig.virtualProxyClientUsage);

    if (name) {
        console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: ');//, certicate_communication_options);
        console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/'+senseConfig.virtualProxyClientUsage+'/user/' + senseConfig.UDC + '/' + name);
        try {
            const call = {};
            call.action = 'logout user: ' + name;
            call.request = 'https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/'+senseConfig.virtualProxyClientUsage+'/user/' + senseConfig.UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey
            call.response = HTTP.call('DELETE', call.request, { 'npmRequestOptions': certicate_communication_options })
            
            REST_Log(call);
            // console.log('The HTTP REQUEST to Sense QPS API:', call.request);
            // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);

        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Logout user failed', err.message);
        }
    }
};

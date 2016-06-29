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
*/

export function logoutUser(name) {
    console.log('QPS Functions: logout the current user');

    if (name) {
        console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTP call: ', certicate_communication_options);

        try {
            const call = {};
            call.action = 'logout user: ' + name;
            call.response = HTTP.call('DELETE', 'https://' + senseConfig.host + ':4243/qps/user/' + senseConfig.UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey, { 'npmRequestOptions': certicate_communication_options })

            //logging purposes only:
            call.request = 'HTTP.del(https://' + senseConfig.host + ':4243/qps/user/' + senseConfig.UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey;
            REST_Log(call);
            console.log('The HTTP REQUEST to Sense QPS API:', call.request);
            console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);

        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Logout user failed', err.message);
        }
    }

}

};

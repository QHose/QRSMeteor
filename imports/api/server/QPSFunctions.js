import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';
import { REST_Log } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, certs, authHeaders } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;


export function logoutUser() {
        console.log('logout the current user');
        
        try {
            const call ={};
            call.action = 'logout the current user'; 
            call.request = 'HTTP.del(http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qps/user';
            call.response = HTTP.del('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qps/user', {
                headers: authHeaders,
                params: { 'xrfkey': senseConfig.xrfkey }
            })
            REST_Log(call);
             
        } catch (err) {
            throw new Meteor.Error('Logout user failed', err.message);
        }
};

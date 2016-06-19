import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';
import { APILogs } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, certs, authHeaders } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;


export function logoutUser() {
        console.log('logout the current user: method delete HTTP://server/qps/user ');
        
        try {
            const call ={};
            call.request = 'HTTP.del(http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qps/user';
            call.response = HTTP.del('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qps/user', {
                headers: authHeaders,
                params: { 'xrfkey': senseConfig.xrfkey }
            })
            APILogs.insert(call);
             
        } catch (err) {
            throw new Meteor.Error('Logout user failed', err.message);
        }
};

import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';
import { REST_Log } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, certs, authHeadersCertificate, certicate_communication_options } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;


export function logoutUser() {
    console.log('QPS Functions: logout the current user');
    var customer = Customers.findOne({ 'users.currentlyLoggedIn': true });
    var user = _.find(customer.users, { 'currentlyLoggedIn': true });
    console.log('We will try the logout the user via the Qlik Sense logout API, we have read the simulated currently logged in user from the database: ', user.name);

    console.log('We will try to authenticate to Sense using the options object in the HTTP call', certicate_communication_options);

    try {
        const call = {};
        call.action = 'logout the current user: ' + user.name;
        // call.request = 'HTTP.del(http://' + senseConfig.host + '/qps/' + senseConfig.virtualProxy + '/user/' + senseConfig.UDC + '/' + user.name;
        call.response = HTTP.call('DELETE' ,'http://' + senseConfig.host + '/qps/user/' + senseConfig.UDC + '/' + user.name + '?xrfkey=' + senseConfig.xrfkey,        
            {npmRequestOptions: certicate_communication_options}
        )
        REST_Log(call);
        console.log(call.request);
        console.log(call.response);

    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Logout user failed', err.message);
    }
};

import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS
import { senseConfig, certs, authHeaders } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;


export function logoutUser() {
    // var customer = Customers.findOne({ 'users.currentlyLoggedIn': true });
    var customer = Customers.find().fetch();  //returns undefined
	console.log('logout for customer ', customer);
    if (customer) {
        console.log('#: ', customer.find()
            .count());
        console.log('logout for customer ', customer);
        var user = _.find(customer.users, { 'currentlyLoggedIn': true });
        console.log('Logout for current user: ', user.name);
        try {
            const result = HTTP.del('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qps/user/' + senseConfig.UDC + '/' + user.name, {
                headers: authHeaders,
                params: { 'xrfkey': senseConfig.xrfkey }
            })
            console.log(result);
        } catch (err) {
            throw new Meteor.Error('Logout user failed', err.message);
        }
    }


};

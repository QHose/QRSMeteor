import { Meteor } from 'meteor/meteor';
import qlikauth from 'qlik-auth';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { senseConfig, engineConfig, _certs, authHeaders } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';

Router.route('/sso', function(request, response, next) {

    console.log("Meteor's authentication module qlikAuthSSO.js received the forwarded request from Qlik Sense proxy.");
    console.log("Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.");


    //first find the customers that have a logged in users (mongo returns a complete document)
    var customer = Customers.findOne({ 'users.currentlyLoggedIn': true });
    console.log('In our local database we can find the customer with the currentlyLoggedIn set to true, the customer which contains the user that we selected with the dropdown: ', customer);

    //now we have the document, we can look in the array of users, to find the one that is logged in.
    if (!customer) {
        console.error('You have not selected a user you want to simulate the Single Sign on with. Please select a user on the left side of the screen');
        this.response.end("You have not selected a user you want to simulate the Single Sign on with. Please select a user on the left side of the screen");
    } else {
        var user = _.find(customer.users, { 'currentlyLoggedIn': true });

        //Create a paspoort (ticket) request: user directory, user identity and attributes
        var passport = {
            'UserDirectory': senseConfig.UDC, //Specify a dummy value to ensure userID's are unique E.g. "Dummy"
            'UserId': user.name, //the current user that we are going to login with
            'Attributes': [{ 'group': customer.name.toUpperCase() }, //attributes supply the group membership from the source system to Qlik Sense
                { 'group': user.country.toUpperCase() },
                { 'group': user.group.toUpperCase() }
            ]
        }
        console.log('Request ticket for this user passport": ', passport);

        //logging only
        var call = {};
        call.action = 'Request ticket (SSO)'
        call.request = 'Request ticket for this user passport: ": ' + JSON.stringify(passport);
        REST_Log(call);

        var options = {
            'Certificate': _certs.cert, //'C:/Users/Qlik/Meteor projects/qlikauth-meteor/node_modules/qlik-auth/client.pfx',
            'CertificateKey': _certs.key,
            'PassPhrase': ''
        }
        console.log('Make call for ticket request with these options: ', options);
        qlikauth.requestTicket(request, response, passport, options);

        //logging only        
        call.action = 'Ticket request config (SSO)'
        call.request = 'Make call for ticket request with these options: ', options;
        REST_Log(call);

    }
}, { where: 'server' });

Router.route('/updateSenseInfo/apps', function(request, response, next) {
    // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed');
    //logging only
    var call = {};
    call.action = 'Notification apps'
    call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
    REST_Log(call);
    Meteor.call('updateLocalSenseCopyApps');
}, { where: 'server' });

Router.route('/updateSenseInfo/streams', function(request, response, next) {
    // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for STREAMS, this means the Sense Repository has changed');
    //logging only
    var call = {};
    call.action = 'Notification streams'
    call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
    REST_Log(call);
    Meteor.call('updateLocalSenseCopyStreams');
}, { where: 'server' });

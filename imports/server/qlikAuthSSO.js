import { Meteor } from 'meteor/meteor';
import qlikauth from 'qlik-auth';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';

Router.route('/sso', function(request, response, next) {

    console.log("Meteor's authentication module qlikAuthSSO.js received the forwarded request from Qlik Sense proxy. Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships");
    // console.log(request);

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
        var options = {
                'Certificate': senseConfig.cert, //'C:/Users/Qlik/Meteor projects/qlikauth-meteor/node_modules/qlik-auth/client.pfx',
                'PassPhrase': ''
            }
            //Make call for ticket request
        qlikauth.requestTicket(request, response, passport, options);
    }
}, { where: 'server' });

Router.route('/updateSenseInfo', function(request, response, next) {
    console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler, this means the Sense Repository has changed');
    Meteor.call('updateLocalSenseCopy');
}, { where: 'server' });


import { Meteor } from 'meteor/meteor';
import { Customers, dummyCustomers } from '/imports/api/customers';
import { REST_Log } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, _certs, authHeadersCertificate, authHeaders, certicate_communication_options } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;


/*
When communicating with the QPS APIs, the URL is as follows:
https://<QPS machine name>:4243/<path>

Each proxy has its own session cookie, so you have to logout the users per proxy used.
*/

Meteor.methods({
    currentlyLoggedInUser() {
        // console.log("Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.");
        var call = {};
        call.action = 'STEP 3: Server getRedirectUrl method'
        call.request = 'Meteor server side method getRedirectUrl received a incoming method call from the meteor client. Meteor server will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.';
        REST_Log(call);

        //first find the customers that have a logged in users (mongo returns a complete document)
        var customer = Customers.findOne({ generationUserId:  Meteor.userId(), 'users.currentlyLoggedIn': true });
        // console.log('In our local database we can find the customer with the currentlyLoggedIn set to true for user: ' + loggedInUser + ', the customer which contains the user that the user selected with the dropdown: ', customer);

        //now we have the document, we can look in the array of users, to find the one that is logged in.
        if (!customer) {
            const error = 'You have not selected a user you want to simulate the Single Sign on with. Please select a user on the left side of the screen';
            throw new Meteor.Error('No user', error);
        } else {
            var user = _.find(customer.users, { 'currentlyLoggedIn': true });
            var response = {};
            response.user = user;
            response.customer = customer;
            return response;
        }
    },
    getRedirectUrl(proxyRestUri, targetId, loggedInUser) {
        var response = Meteor.call('currentlyLoggedInUser');
        var customer =response.customer;
        var user = response.user;

        // console.log('UserID currently logged in in the demo platform: ' + loggedInUser + '. Meteor server side thinks the meteor.userId is ' + Meteor.userId() + '. We use this as the UDC name');
        //Create a paspoort (ticket) request: user directory, user identity and attributes
        var passport = {
            'UserDirectory': Meteor.userId(), //Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
            'UserId': user.name, //the current user that we are going to login with
            'Attributes': [{ 'group': customer.name.toUpperCase() }, //attributes supply the group membership from the source system to Qlik Sense
                { 'group': user.country.toUpperCase() },
                { 'group': user.group.toUpperCase() }
            ]
        }

        //logging only
        var call = {};
        call.action = 'STEP 4: Request ticket (SSO)';
        call.request = 'Request ticket for this user passport: ": ' + JSON.stringify(passport);
        REST_Log(call);

        return getRedirectURL(passport, proxyRestUri, targetId);
    },
    resetLoggedInUser() {
        // console.log("***Method resetLoggedInUsers");
        // console.log('call the QPS logout api, to invalidate the session cookie for each user in our local database');

        //reset the local database. set all users to not logged in. We need this code because we do a simulation of the login and not a real end user login.
        Customers.find({ 'generationUserId': Meteor.userId() })
            .forEach(function(customer) {
                var updatedUsers = _.map(customer.users, function(user) {
                    user.currentlyLoggedIn = false;

                    //and just logout everybody in the user list                            
                    logoutUser(Meteor.userId(), user.name);
                    return user;
                })

                Customers.update(customer._id, {
                    $set: { users: updatedUsers },
                });

            });
    },
    simulateUserLogin(name) {
        check(name, String);
        Meteor.call('resetLoggedInUser');
        // console.log('*** Reset all logged in user done, now write in our local database the name for the current simulated user: generationUserId: ' + Meteor.userId() + ' & users.name:' + name);
        var query = [
            { 'generationUserId': Meteor.userId(), "users.name": name }, {
                $set: {
                    'users.$.currentlyLoggedIn': true
                }
            }
        ];

        Customers.update({ 'generationUserId': Meteor.userId(), "users.name": name }, {
            $set: {
                'users.$.currentlyLoggedIn': true
            }
        }, {}, function(error, numberAffectedDocuments) {
            if (numberAffectedDocuments === 0) { //if nothing is updated, insert some dummy customers
                // console.log('simulateUserLogin numberAffectedDocuments: ', numberAffectedDocuments);
                //name does not yet exist in the customers created by the current demo user. So insert our dummy customers.numberAffectedDocuments
                insertDummyCustomers(Meteor.userId());
                Customers.update({ 'generationUserId': Meteor.userId(), "users.name": name }, {
                    $set: {
                        'users.$.currentlyLoggedIn': true
                    }
                });
            }
        })
    }
})

function insertDummyCustomers(generationUserId) {
    _.each(dummyCustomers, function(customer) {
        customer.generationUserId = generationUserId;
        Customers.insert(customer);
    })
}

export function logoutUser(UDC, name) {
    // //console.log('******** QPS Functions: logout the current: ' + name + ' on proxy: ' + senseConfig.virtualProxyClientUsage);

    if (name) {
        // //console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: '); //, certicate_communication_options);
        // //console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name);
        try {
            const call = {};
            call.action = 'Logout user: ' + name;
            call.request = 'https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey
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

//based on Rikard Braathen's QlikAuth module
export function getRedirectURL(passport, proxyRestUri, targetId) {
    check(passport, Object);
    check(proxyRestUri, String);
    check(targetId, String);

    // console.log('entered server side requestTicket module for user and passport', passport, proxyRestUri);
    //see https://help.qlik.com/en-US/sense-developer/3.0/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm

    var ticketRequestBody = passport;
    ticketRequestBody.TargetId = targetId;
    // console.log('The passport for requesting a ticket: ', passport);

    try {
        var call = {};
        call.action = 'STEP 5: Request ticket';
        call.request = proxyRestUri + 'ticket'; //we use the proxy rest uri which we got from the redirect from the proxy (the first bounce)
        call.response = HTTP.call('POST', call.request, {
            'npmRequestOptions': certicate_communication_options,
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: passport //the user and group info for which we want to create a ticket
        });
        REST_Log(call);
    } catch (err) {
        console.error('REST call to request a ticket failed', err);
        throw new Meteor.Error('Request ticket failed', err.message);
    }

    // //console.log('The HTTP REQUEST to Sense QPS API:', call.request);
    // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);
    var ticketResponse = call.response.data;
    call.action = 'STEP 6: Use Ticket response to create redirect url';
    call.request = 'Use the redirect url we got back and the ticket string to make a redirect url for the client. Format: ' + ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket + '. JSON received: ' + ticketResponse
    REST_Log(call);


    //Build redirect URL for the client including the ticket
    if (ticketResponse.TargetUri.indexOf("?") > 0) {
        redirectURI = ticketResponse.TargetUri + '&QlikTicket=' + ticketResponse.Ticket;
    } else {
        redirectURI = ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket;
    }

    if (!redirectURI) { redirectURI = "http://" + senseConfig.host + ":" + senseConfig.port + "/" + senseConfig.virtualProxyClientUsage + "/" + hub; }
    // console.log('Meteor server side created this redirect url: ', redirectURI);
    return redirectURI;
}

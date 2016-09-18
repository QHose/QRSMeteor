import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import { APILogs, REST_Log } from '/imports/api/APILogs';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import * as QSApp from '/imports/api/server/QRSFunctionsApp';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import * as QSProxy from '/imports/api/server/QPSFunctions';
import * as QSSystem from '/imports/api/server/QRSFunctionsSystemRules';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config';
import '/imports/startup/accounts-config.js';


//install NPM modules
var fs = require('fs');
var qsocks = require('qsocks');

Meteor.startup(function() {
    process.env.ROOT_URL = 'http://' + Meteor.settings.public.host;
    //console.log('********* Meteor runs on host ROOT_URL: ', process.env.ROOT_URL);


    //console.log('********* On meteor startup, Meteor tool registers itself at Qlik Sense to get notifications from Sense on changes to apps and streams.');
    //console.log('********* we try to register a notification on this URL: HTTP post to http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app');
    //console.log('********* The notification URL for Streams is: ' + Meteor.settings.private.notificationURL + '/streams');
    try {
        const resultApp = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: Meteor.settings.private.notificationURL + '/apps'
        })

        const resultStream = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=stream', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: Meteor.settings.private.notificationURL + '/streams'
        })
        //console.log('Register notication success');
        // //console.log('the result from sense register App notification was: ', resultApp);
        // //console.log('the result from sense register Stream notification was: ', resultStream);
    } catch (err) {
        console.error('Create notification subscription in sense qrs failed', err);
        // throw new Meteor.Error('Create notification subscription in sense qrs failed', err);
    }
});

Meteor.methods({
    getRedirectUrl(proxyRestUri, targetId) {
        //console.log("Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.");
        var call = {};
        call.action = 'Server SSO'
        call.request = 'Meteor server side method getRedirectUrl received a incoming method call from the meteor client. Meteor server will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.';
        REST_Log(call);

        //first find the customers that have a logged in users (mongo returns a complete document)
        var customer = Customers.findOne({ generationUserId: Meteor.userId(), 'users.currentlyLoggedIn': true });
        //console.log('In our local database we can find the customer with the currentlyLoggedIn set to true for user: ' + Meteor.userId() + ', the customer which contains the user that the user selected with the dropdown: ', customer);

        //now we have the document, we can look in the array of users, to find the one that is logged in.
        if (!customer) {
            const error = 'You have not selected a user you want to simulate the Single Sign on with. Please select a user on the left side of the screen';
            throw new Meteor.Error('No user', error);
        } else {
            var user = _.find(customer.users, { 'currentlyLoggedIn': true });

            //Create a paspoort (ticket) request: user directory, user identity and attributes
            var passport = {
                'UserDirectory': Meteor.userId(), //Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
                'UserId': user.name, //the current user that we are going to login with
                'Attributes': [{ 'group': customer.name.toUpperCase() }, //attributes supply the group membership from the source system to Qlik Sense
                    { 'group': user.country.toUpperCase() },
                    { 'group': user.group.toUpperCase() }
                ]
            }

            // //console.log('Request ticket for this user passport": ', passport);

            //logging only
            call.action = 'Request ticket (SSO)'
            call.request = 'Request ticket for this user passport: ": ' + JSON.stringify(passport);
            REST_Log(call);

            return QSProxy.getRedirectURL(passport, proxyRestUri, targetId);
        }
    },
    generateStreamAndApp(customers) {
        // //console.log('generateStreamAndApp');
        check(customers, Array);

        Meteor.call('removeGeneratedResources'); //first clean the environment
        return QSApp.generateStreamAndApp(customers, this.userId); //then, create the new stuff

    },
    resetEnvironment() {
        Meteor.call('removeGeneratedResources');
        TemplateApps.remove({ 'generationUserId': Meteor.userId() });
        Customers.remove({ 'generationUserId': Meteor.userId() });
        APILogs.remove({ 'generationUserId': Meteor.userId() });
    },
    removeGeneratedResources() {
        //console.log('remove GeneratedResources method, before we make new ones');
        //logging only
        const call = {};
        call.action = 'Remove generated resources';
        call.request = 'Remove all apps and streams in Qlik Sense for userId: ' + Meteor.userId();
        REST_Log(call);

        GeneratedResources.find({ 'generationUserId': Meteor.userId() })
            .forEach(function(resource) {
                //console.log('resetEnvironment for userId', Meteor.userId());
                try {
                    Meteor.call('deleteStream', resource.streamId);
                } catch (err) {
                    console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
                } //don't bother if generated resources do not exists, just continue
                try {
                    Meteor.call('deleteApp', resource.appId);
                } catch (err) {
                    console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
                }
            })
        GeneratedResources.remove({ 'generationUserId': Meteor.userId() });
        APILogs.remove({ 'generationUserId': Meteor.userId() });
    },
    resetLoggedInUser() {
        //console.log("***Method resetLoggedInUsers");
        //console.log('call the QPS logout api, to invalidate the session cookie for each user in our local database');

        //reset the local database. set all users to not logged in. We need this code because we do a simulation of the login and not a real end user login.
        Customers.find({ 'generationUserId': Meteor.userId() })
            .forEach(function(customer) {
                var updatedUsers = _.map(customer.users, function(user) {
                    user.currentlyLoggedIn = false;

                    //and just logout everybody in the user list                            
                    QSProxy.logoutUser(Meteor.userId(), user.name);

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
        //console.log('*** Reset all logged in user done, now write in our local database the name for the current simulated user: ' + name);
        Customers.update({ "users.name": name }, {
            $set: {
                'users.$.currentlyLoggedIn': true
            }
        })
    },
    copyApp(guid, name) {
        check(guid, String);
        check(name, String);
        return QSApp.copyApp(guid, name);
    },
    copyAppSelectedCustomers(currentApp) { //the app the user clicked on        
        if (!currentApp) {
            throw new Meteor.Error('no App selected to copy')
        };

        customers = Customers.find({ checked: true }); //all selected customers
        if (!customers) {
            throw new Meteor.Error('no customers selected to copy the app for')
        };

        customers
            .forEach(customer => {
                Meteor.call('copyApp', currentApp.id, customer.name + '-' + currentApp.name);
            });
    },
    deleteApp(guid) {
        check(guid, String);
        //console.log('method deleteApp');
        //logging only
        const call = {};
        call.action = 'Delete app';
        call.request = 'Delete app: ' + guid;
        REST_Log(call);

        return QSApp.deleteApp(guid);
    },
    removeAllCustomers: function() {
        return Customers.remove({});
    },

    //STREAM METHODS
    deleteStream(guid) {
        check(guid, String);
        //logging only
        const call = {};
        call.action = 'Delete stream';
        call.request = 'Delete stream: ' + guid;
        REST_Log(call);

        return QSStream.deleteStream(guid);
    },
    createStream(name) {
        return QSStream.createStream(name);
    },
    getStreams() {
        return QSStream.getStreams();
    },
    getSecurityRules() {
        return QSSystem.getSecurityRules();
    },

    updateLocalSenseCopyApps() {
        //delete the local content of the database before updating it
        Apps.remove({});

        //Update the Apps with fresh info from Sense        
        _.each(QSApp.getApps(), app => {
            Apps.insert(app);
        });
    },
    updateLocalSenseCopyStreams() {
        //delete the local content of the database before updating it        
        Streams.remove({});

        //Update the Streams with fresh info from Sense        
        _.each(QSStream.getStreams(), stream => {
            Streams.insert(stream);
        });
    },

    updateLocalSenseCopy() {
        // //console.log('Method: update the local mongoDB with fresh data from Qlik Sense: call QRS API getStreams and getApps');
        //delete the local content of the database before updating it
        Apps.remove({});
        Streams.remove({});

        //Update the Apps and Streams with fresh info from Sense        
        _.each(QSApp.getApps(), app => {
            Apps.insert(app);
        });

        _.each(QSStream.getStreams(), stream => {
            Streams.insert(stream);
        });
    },
    // checkSenseIsReady() {
    //     //console.log('Method: checkSenseIsReady, TRY TO SEE IF WE CAN CONNECT TO QLIK SENSE ENGINE VIA QSOCKS');

    //     // try {
    //     // qsocks.Connect(engineConfig)
    //     //     .then(function(global) {
    //     //         // Connected
    //     //         //console.log('Meteor is connected via Qsocks to Sense Engine API using certificate authentication');
    //     //         return true;
    //     //     }, function(err) {
    //     //         // Something went wrong
    //     //         console.error('Meteor could not connect to Sense with the config settings specified. The error is: ', err.message);
    //     //         console.error('the settings are: ', engineConfig)
    //     //         return false
    //     //         // throw new Meteor.Error('Could not connect to Sense Engine API', err.message);
    //     //     });

    //     //TRY TO SEE IF WE CAN CONNECT TO SENSE VIA HTTP
    //     try{
    //         const result = HTTP.get('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/app/full', { //?xrfkey=' + senseConfig.xrfkey, {
    //             headers: authHeaders,
    //             params: { 'xrfkey': senseConfig.xrfkey }
    //         })//http get
    //         //console.log(result);
    //         if(result.statuscode === 200){
    //             //console.log('We got a result back from Sense with statuscode 200: Success')
    //             return true;}
    //         else{return false}
    //     } catch (err) {
    //         return false;
    //         // throw new Meteor.Error('Could not connect via HTTP to Qlik Sense: Is Sense running? Are the firewalls open? Have you exported the certificate for this host? virtualProxy setup?');
    //     }
    // }
});



//GET APPS USING QSOCKS (FOR DEMO PURPOSE ONLY, CAN ALSO BE DONE WITH QRS API)
// getApps() {
//     return QSApp.getApps();
//     // appListSync = Meteor.wrapAsync(qsocks.Connect(engineConfig)
//     //     .then(function(global) {
//     //         global.getDocList()
//     //             .then(function(docList) {
//     //                 return (docList);
//     //             });
//     //     })
//     //     .catch(err => {
//     //         throw new Meteor.Error(err)
//     //     }));
//     // result = appListSync();
//     // return result;

// },

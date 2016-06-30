import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import * as QSApp from '/imports/api/server/QRSFunctionsApp';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import * as QSProxy from '/imports/api/server/QPSFunctions';
import * as QSSystem from '/imports/api/server/QRSFunctionsSystemRules';
import qlikauth from 'qlik-auth';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config';
import '/imports/server/qlikAuthSSO.js';


//install NPM modules
var fs = require('fs');
var qsocks = require('qsocks');

Meteor.methods({
    resetEnvironment() {
        console.log('resetEnvironment method');
        GeneratedResources.find()
            .forEach(function(resource) {
                console.log('resetEnvironment for resource', resource);
                Meteor.call('deleteApp', resource.appId);
                Meteor.call('deleteStream', resource.streamId);
            })
        GeneratedResources.remove({});

    },
    resetLoggedInUser() {
        console.log("***Method resetLoggedInUsers");
        console.log('call the QPS logout api, to invalidate the session cookie for each user in our local database');

        //reset the local database. set all users to not logged in. We need this code because we do a simulation of the login and not a real end user login.
        Customers.find()
            .forEach(function(customer) {
                var updatedUsers = _.map(customer.users, function(user) {
                    user.currentlyLoggedIn = false;

                    //and just logout everybody in the user list                            
                    QSProxy.logoutUser(user.name);

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
        console.log('*** Reset all logged in user done, now write in our local database the name for the current simulated user: ' + name);
        Customers.update({ "users.name": name }, {
            $set: {
                'users.$.currentlyLoggedIn': true
            }
        })
    },
    generateStreamAndApp(customers) {
        console.log('generateStreamAndApp');
        check(customers, Array);
        return QSApp.generateStreamAndApp(customers);

    },
    copyApp(guid, name) {
        check(guid, String);
        check(name, String);
        Meteor.call('updateLocalSenseCopy');
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
        console.log('method deleteApp');

        return QSApp.deleteApp(guid);
    },
    removeAllCustomers: function() {
        return Customers.remove({});
    },

    //STREAM METHODS
    deleteStream(guid) {
        check(guid, String);
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
    updateLocalSenseCopy() {
        console.log('Method: update the local mongoDB with fresh data from Qlik Sense: call QRS API getStreams and getApps');
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
    //     console.log('Method: checkSenseIsReady, TRY TO SEE IF WE CAN CONNECT TO QLIK SENSE ENGINE VIA QSOCKS');

    //     // try {
    //     // qsocks.Connect(engineConfig)
    //     //     .then(function(global) {
    //     //         // Connected
    //     //         console.log('Meteor is connected via Qsocks to Sense Engine API using certificate authentication');
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
    //         const result = HTTP.get('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/full', { //?xrfkey=' + senseConfig.xrfkey, {
    //             headers: authHeaders,
    //             params: { 'xrfkey': senseConfig.xrfkey }
    //         })//http get
    //         console.log(result);
    //         if(result.statuscode === 200){
    //             console.log('We got a result back from Sense with statuscode 200: Success')
    //             return true;}
    //         else{return false}
    //     } catch (err) {
    //         return false;
    //         // throw new Meteor.Error('Could not connect via HTTP to Qlik Sense: Is Sense running? Are the firewalls open? Have you exported the certificate for this host? virtualProxy setup?');
    //     }
    // }
});

// Meteor.startup(() => {
//     Meteor.call('updateLocalSenseCopy');
// });

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

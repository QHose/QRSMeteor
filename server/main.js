import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import * as QSApp from '/imports/api/QRSFunctionsApp';
import * as QSStream from '/imports/api/QRSFunctionsStream';
import * as QSSystem from '/imports/api/QRSFunctionsSystemRules';
import qlikauth from 'qlik-auth';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
import '/imports/server/qlikAuthSSO.js';


//install NPM modules
var fs = require('fs');
var qsocks = require('qsocks');
var QRS = require('qrs');
// var Promise = require("bluebird");
var qrs = null;

Meteor.methods({
    resetLoggedInUser() {
        console.log("Method resetLoggedInUsers");

        Customers.find()
            .forEach(function(customer) {
                var updatedUsers = _.map(customer.users, function(user) {
                    user.currentlyLoggedIn = false;
                    return user;
                })

                Customers.update(customer._id, {
                    $set: { users: updatedUsers },
                });
            })
    },
    simulateUserLogin(name) {
        check(name, String);
        Meteor.call('resetLoggedInUser');
        console.log('method: simulateUserLogin');
        Customers.update({ "users.name": name }, {
            $set: {
                'users.$.currentlyLoggedIn': true
            }
        })
    },
    generateStreamAndApp(customers) {
        check(customers, Array);
        return QSApp.generateStreamAndApp(customers);

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
    //NPM QRS CALLS
    countApps() {
        return qrs.get('/qrs/app/count');
    },
    countStreams() {
        return qrs.get('/qrs/stream/count');
    },
    updateLocalSenseCopy() {
        console.log('Method: update the local mongoDB with fresh data from Qlik Sense');
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

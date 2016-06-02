import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import * as QSApp from '/imports/api/QRSFunctionsApp';
import * as QSStream from '/imports/api/QRSFunctionsStream';

//import config for Qlik Sense QRS and Engine API
import { config, engineConfig, certs } from '/imports/api/config.js';
// import {  } from '/imports/api/config.js'; 
// import { certs } from '/imports/api/config.js'; 


//insyall NPM modules
var fs = require('fs');
var qsocks = require('qsocks');
var QRS = require('qrs');
// var Promise = require("bluebird");
var qrs = null;

Meteor.methods({
    generateStreamAndApp(customers) {
        check(customers, Array);
        QSApp.generateStreamAndApp(customers)
            .then(
                function fulfilled(result) {
                    console.log('generation promise fulfilled, result of promise', result);
                    // resolve('Generation success ');
                    return 'Generation success';
                },
                function Rejected(error) {
                    console.error('Promise Rejected: Error when trying generate the apps', error);
                    throw new Meteor.Error('Generation failed', 'Promise Rejected: Error when trying to generate the apps');
                })
    },
    //GET APPS USING QSOCKS (FOR DEMO PURPOSE ONLY, CAN ALSO BE DONE WITH QRS API)
    getApps() {
        return new Promise((resolve, reject) => {
                qsocks.Connect(engineConfig)
                    .then(function(global) {
                        global.getDocList()
                            .then(function(docList) {
                                resolve(docList);
                            });
                    })
            })
            .catch(err => {
                throw new Meteor.Error(err)
            })
    },
    copyApp(guid, name) {
        check(guid, String);
        check(name, String);
        return QSApp.copyApp(guid, name);
    },
    deleteApp(guid) {
        check(guid, String);
        console.log('method deleteApp');
        return QSApp.deleteApp(guid);
    },
    removeAllCustomers: function() {
        return QSApp.Customers.remove({});
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
        return QSApp.getSecurityRules();
    },
    //NPM QRS CALLS
    countApps() {
        return qrs.get('/qrs/app/count');
    },
    countStreams() {
        return qrs.get('/qrs/stream/count');
    }
    // updateAppsCollection() {
    //     console.log('Method: update the local mongoDB with fresh data from Qlik Sense');

    //     try {
    //         Apps.remove();
    //     } catch (error) {
    //         throw new Meteor.Error('Unable to remove apps from collection', error.message)
    //     };

    //     var myPromise = qrs.get('/qrs/app/full')
    //         .then(
    //             function fulfilled(docList) {
    //                 try {
    //                     console.log('try to insert document array into mongo');
    //                     docList.forEach(doc => {
    //                         Apps.insert(doc);
    //                         console.log('inserted document ', doc.qDocName);
    //                     });
    //                 } catch (error) { console.log(error) }

    //             },
    //             function Rejected(error) {
    //                 console.error('uh oh: ', error); // 'uh oh: something bad happened’
    //             })
    //         .catch(function(error) {
    //             console.log('Caught!', error);
    //             throw new Meteor.Error('Unable to get streams from Sense', error.message);
    //         });
    // }
});

// Meteor.startup(() => {
//     qrs = new QRS(config);
// });




//CODE WITH NPM QRS, THAT GENERATES DOUBLE APPS
// function copyApp (guid, name) {
//  console.log('Copy template: '+guid+' to new app: '+name);
//  check(guid, String);
//  check(name, String);
//  return qrs.post('/qrs/app/'+guid+'/copy', [{"key": "name", "value": name}])
//  .then(
//      function fulfilled (result) {
//          console.log('result of copy app promise', result);
//          return result;
//      },
//      function Rejected (error){
//          console.error('Promise Rejected: Error when trying to copy the app', error);
//          throw new Meteor.Error('App copy failed', 'App copy failed');
//      })
// };


// return 
// qsocks.Connect(engineConfig)
// .then(function(global) {
//  console.log(global);
//  return global.getDocList()
// }).then(function(docList){
//  console.log('DE DOC LIST IS: ', docList);
//  return docList;
// })

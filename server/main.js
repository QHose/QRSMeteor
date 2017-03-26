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
    console.log('********* Meteor runs on host ROOT_URL: ', process.env.ROOT_URL);
    //console.log('********* On meteor startup, Meteor tool registers itself at Qlik Sense to get notifications from Sense on changes to apps and streams.');
    //console.log('********* we try to register a notification on this URL: HTTP post to http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app');
    //console.log('********* The notification URL for Streams is: ' + Meteor.settings.private.notificationURL + '/streams');

    // //Create notification listener in Qlik sense https://help.qlik.com/en-US/sense-developer/3.1/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Notification-Remove-Change-Subscription.htm
    // try {
    //     const resultApp = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app', {
    //         headers: authHeaders,
    //         params: { 'xrfkey': senseConfig.xrfkey },
    //         data: Meteor.settings.private.notificationURL + '/apps'
    //     })

    //     const resultStream = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=stream', {
    //             headers: authHeaders,
    //             params: { 'xrfkey': senseConfig.xrfkey },
    //             data: Meteor.settings.private.notificationURL + '/streams'
    //         })
    //         //console.log('Register notication success');
    //         // //console.log('the result from sense register App notification was: ', resultApp);
    //         // //console.log('the result from sense register Stream notification was: ', resultStream);
    // } catch (err) {
    //     console.error('Create notification subscription in sense qrs failed', err);
    //     // throw new Meteor.Error('Create notification subscription in sense qrs failed', err);
    // }


    console.log('## setting up mongo indexes on generationUserId in the generated resources, customers and other collections, to increase mongo performance');
    TemplateApps._ensureIndex({ "generationUserId": 1, "id": 1 });
    GeneratedResources._ensureIndex({ "generationUserId": 1, "id": 1 });
    Apps._ensureIndex({ "id": 1 });
    Customers._ensureIndex({ "generationUserId": 1 });
    Streams._ensureIndex({ "id": 1 });
    APILogs._ensureIndex({ "createdBy": 1 });
    APILogs._ensureIndex({ "createDate": 1 });

    console.log('remove the all generated resources on each server start');
    Meteor.setTimeout(function() {
        console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
        Meteor.call('removeGeneratedResources', {});
    }, 0); //remove all logs directly at startup

    Meteor.setInterval(function() {
        console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
        Meteor.call('removeGeneratedResources', {});
    }, 1 * 86400000); //remove all logs every 1 day
});



Meteor.methods({
    generateStreamAndApp(customers) {
        // //console.log('generateStreamAndApp');
        check(customers, Array);

        Meteor.call('removeGeneratedResources', { 'generationUserId': Meteor.userId() }); //first clean the environment
        QSApp.generateStreamAndApp(customers, this.userId); //then, create the new stuff
        Meteor.call('updateLocalSenseCopy');
        return;
    },
    resetEnvironment() {
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
        Meteor.call('removeGeneratedResources', { 'generationUserId': Meteor.userId() });
        TemplateApps.remove({ 'generationUserId': Meteor.userId() });
        Customers.remove({ 'generationUserId': Meteor.userId() });
        APILogs.remove({ 'generationUserId': Meteor.userId() });
    },
    upsertTemplate(selector, currentApp) {
        console.log('upsert template')
        TemplateApps.upsert(selector, {
            $set: {
                name: currentApp.name,
                id: currentApp.id,
                generationUserId: Meteor.userId(),
            },
        });
    },
    removeTemplate(selector, currentApp) {
        console.log('remove template')
        TemplateApps.remove(selector);
    },
    removeGeneratedResources(generationUserSelection) {
        //console.log('remove GeneratedResources method, before we make new ones');
        //logging only
        if (generationUserSelection) {
            const call = {};
            call.action = 'Remove generated resources';
            call.request = 'Remove all apps and streams in Qlik Sense for userId: ' + generationUserSelection.generationUserId;
            REST_Log(call);
        }
        GeneratedResources.find(generationUserSelection)
            .forEach(function(resource) {
                // this.unblock()
                //console.log('resetEnvironment for userId', Meteor.userId());generationUserSelection.generationUserId

                //If not selection was given, we want to reset the whole environment, so also delete the streams.
                // if (!generationUserSelection.generationUserId) {
                try {
                    Meteor.call('deleteStream', resource.streamId); //added random company names, so this should not be an issue //26-9 can't delete stream, because each user creates a stream with the same name...
                } catch (err) {
                    //console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
                } //don't bother if generated resources do not exists, just continue
                // }
                //delete apps always
                try {
                    Meteor.call('deleteApp', resource.appId);
                } catch (err) {
                    //console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
                }
            })
        GeneratedResources.remove(generationUserSelection);
        APILogs.remove(generationUserSelection);
    },
    copyApp(guid, name) {
        check(guid, String);
        check(name, String);
        const id = QSApp.copyApp(guid, name);
        Meteor.call('updateLocalSenseCopy');
        return id;
    },
    copyAppSelectedCustomers(currentApp) { //the app the user clicked on        
        if (!currentApp) {
            throw new Meteor.Error('No App selected to copy')
        };

        customers = Customers.find({ 'generationUserId': Meteor.userId(), checked: true }); //all selected customers
        if (!customers) {
            throw new Meteor.Error('No customers selected to copy the app for')
        };

        customers
            .forEach(customer => {
                const newAppId = Meteor.call('copyApp', currentApp.id, customer.name + '-' + currentApp.name);
                Meteor.call('updateLocalSenseCopy');

                //store in the database that the user generated something, so we can later on remove it.
                GeneratedResources.insert({
                    'generationUserId': Meteor.userId(),
                    'customer': null,
                    'streamId': null,
                    'appId': newAppId
                });
            });
    },
    deleteApp(guid) {
        check(guid, String);
        if (guid !== Meteor.settings.public.templateAppId) {
            //logging only
            const call = {};
            call.action = 'Delete app';
            call.request = 'Delete app: ' + guid;
            REST_Log(call);

            const id = QSApp.deleteApp(guid);
            Meteor.call('updateLocalSenseCopy');
            return id;
        } else {
            throw new Meteor.Error("you can't delete the template app with guid: ", guid);
        }
    },
    removeAllCustomers: function() {
        return Customers.remove({ 'generationUserId': Meteor.userId() });
    },

    //STREAM METHODS
    deleteStream(guid) {
        check(guid, String);
        //logging only
        const call = {};
        call.action = 'Delete stream';
        call.request = 'Delete stream: ' + guid;
        REST_Log(call);

        const id = QSStream.deleteStream(guid);
        Meteor.call('updateLocalSenseCopy');
        return id;
    },
    createStream(name) {
        const streamId = QSStream.createStream(name);
        Meteor.call('updateLocalSenseCopy');

        //store in the database that the user generated something, so we can later on remove it.
        GeneratedResources.insert({
            'generationUserId': Meteor.userId(),
            'customer': null,
            'streamId': streamId.data.id,
            'appId': null
        });
        return streamId;
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

});



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

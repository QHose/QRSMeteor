import {
    Meteor
} from 'meteor/meteor';
import {
    http
} from 'meteor/meteor';
import {
    Apps,
    TemplateApps,
    GeneratedResources
} from '/imports/api/apps';
import {
    APILogs,
    REST_Log
} from '/imports/api/APILogs';

//import meteor collections
import {
    Streams
} from '/imports/api/streams';
import {
    Customers
} from '/imports/api/customers';

import * as QSApp from '/imports/api/server/QRSFunctionsApp';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import * as QSLic from '/imports/api/server/QRSFunctionsLicense';
import * as QSProxy from '/imports/api/server/QPSFunctions';
import * as QSSystem from '/imports/api/server/QRSFunctionsSystemRules';
import * as QSExtensions from '/imports/api/server/QRSFunctionsExtension';
import * as QSCustomProps from '/imports/api/server/QRSFunctionsCustomProperties';


//import config for Qlik Sense QRS and Engine API
import {
    senseConfig,
    authHeaders
} from '/imports/api/config';
import '/imports/startup/accounts-config.js';

Meteor.startup(function() {
    process.env.ROOT_URL = 'http://' + Meteor.settings.public.host;
    console.log('********* We expect Qlik Sense to run on host: ', process.env.ROOT_URL + ':' + Meteor.settings.public.port);

    initQlikSense();
    removeGeneratedResources();
    optimizeMongoDB();
});


//
// ─── SETUP QLIK SENSE AFTER A CLEAN QlIK SENSE INSTALL ─────────────────────────────────────
//

//Check if Qlik Sense has been properly setup for this MeteorQRS tool
async function initQlikSense() {
    console.log('------------------------------------');
    console.log('INIT QLIK SENSE');
    console.log('------------------------------------');
    Meteor.call('updateLocalSenseCopy');

    //By checking if a stream exist we try to figure out if this is a fresh or already existing Qlik Sense installation.//
    var QlikConfigured = QSStream.getStreamByName(Meteor.settings.public.TemplateAppStreamName);
    if (!QlikConfigured || Meteor.settings.broker.runInitialQlikSenseSetup) {

        console.log('Template stream does not yet exist or the runInitialQlikSenseSetup setting has been set to true, so we expect to have a fresh Qlik Sense installation for which we now automatically populate with the apps, streams, license, security rules etc.');
        // QSLic.insertLicense();
        // QSLic.insertUserAccessRule();
        // await QSSystem.createSecurityRules();
        //// QSSystem.disableDefaultSecurityRules(); //DOES NOT WORK YET...
        // await QSProxy.createVirtualProxies();
        // QSStream.initSenseStreams();
        // await QSApp.uploadAndPublishTemplateApps();        
        //// QSExtensions.automaticUploadExtensions(); //Does not work yet, maybe not even optimal to download and use untested extensions.
        // QSExtensions.uploadExtensions();

        //set the app Id for the self service bi and the slide generator app, for use in the IFrames etc.
        QSApp.setAppIDs();
    }

}

//
// ─── REMOVE STREAMS AND APPS CREATED DURING THE SAAS DEMO ───────────────────────
//

function removeGeneratedResources() {
    // console.log('remove the all generated resources on each server start');
    // Meteor.setTimeout(function() {
    //     console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
    //     Meteor.call('removeGeneratedResources', {});
    // }, 0); //remove all logs directly at startup
    if (Meteor.settings.broker.automaticCleanUpGeneratedApps === "Yes") {
        Meteor.setInterval(function() {
            console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
            Meteor.call('removeGeneratedResources', {});
        }, 1 * 86400000); //remove all logs every 1 day
    }
}

function optimizeMongoDB() {
    // console.log('## setting up mongo indexes on generationUserId in the generated resources, customers and other collections, to increase mongo performance');
    TemplateApps._ensureIndex({
        "generationUserId": 1,
        "id": 1
    });
    GeneratedResources._ensureIndex({
        "generationUserId": 1,
        "id": 1
    });
    Apps._ensureIndex({
        "id": 1
    });
    Customers._ensureIndex({
        "generationUserId": 1
    });
    Streams._ensureIndex({
        "id": 1
    });
    APILogs._ensureIndex({
        "createdBy": 1
    });
    APILogs._ensureIndex({
        "createDate": 1
    });
}

//
// ─── GET AN UPDATE WHEN QLIK SENSE HAS CHANGED ──────────────────────────────────
//


// function createNotificationListeners() {
//     //Create notification listener in Qlik sense https://help.qlik.com/en-US/sense-developer/3.1/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Notification-Remove-Change-Subscription.htm
//     //console.log('********* On meteor startup, Meteor tool registers itself at Qlik Sense to get notifications from Sense on changes to apps and streams.');
//     //console.log('********* we try to register a notification on this URL: HTTP post to http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app');
//     //console.log('********* The notification URL for Streams is: ' + Meteor.settings.private.notificationURL + '/streams');

//     try {
//         const resultApp = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app', {
//             headers: authHeaders,
//             params: { 'xrfkey': senseConfig.xrfkey },
//             data: Meteor.settings.private.notificationURL + '/apps'
//         })

//         const resultStream = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=stream', {
//                 headers: authHeaders,
//                 params: { 'xrfkey': senseConfig.xrfkey },
//                 data: Meteor.settings.private.notificationURL + '/streams'
//             })
//             //console.log('Register notication success');
//             // //console.log('the result from sense register App notification was: ', resultApp);
//             // //console.log('the result from sense register Stream notification was: ', resultStream);
//     } catch (err) {
//         console.error('Create notification subscription in sense qrs failed', err);
//         // throw new Meteor.Error('Create notification subscription in sense qrs failed', err);
//     }
// }

//
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────
//


Meteor.methods({
    getAppIDs() {
        return {
            SSBI: senseConfig.SSBIApp, // QSApp.getApps(Meteor.settings.public.SSBI.name, Meteor.settings.public.SSBI.stream)[0].id,
            slideGenerator: senseConfig.IntegrationPresentationApp //QSApp.getApps(Meteor.settings.public.slideGenerator.name, Meteor.settings.public.slideGenerator.stream)[0].id
        };
    },
    generateStreamAndApp(customers) {
        check(customers, Array);

        Meteor.call('removeGeneratedResources', {
            'generationUserId': Meteor.userId()
        }); //first clean the environment
        QSApp.generateStreamAndApp(customers, this.userId); //then, create the new stuff

        if (!Meteor.settings.multiTenantScenario) { //on premise installation for a single tenant (e.g. with MS Active Directory)
            var customerNames = customers.map(function(c) { return c.name; });
            QSCustomProps.createCustomProperty('customers', customerNames); //for non OEM scenarios (with MS AD), people like to use custom properties for authorization instead of the groups via a ticket.
        }
        Meteor.call('updateLocalSenseCopy');
    },
    resetEnvironment() {
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
        Meteor.call('removeGeneratedResources', {
            'generationUserId': Meteor.userId()
        });
        TemplateApps.remove({
            'generationUserId': Meteor.userId()
        });
        Customers.remove({
            'generationUserId': Meteor.userId()
        });
        APILogs.remove({
            'generationUserId': Meteor.userId()
        });
        if (!Meteor.settings.multiTenantScenario) { //on premise installation for a single tenant (e.g. with MS Active Directory)
            QSCustomProps.deleteCustomProperty('customers');
        }
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
            REST_Log(call, generationUserSelection);
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

        customers = Customers.find({
            'generationUserId': Meteor.userId(),
            checked: true
        }); //all selected customers
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
        return Customers.remove({
            'generationUserId': Meteor.userId()
        });
    }
})

Meteor.methods({
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
    getSecurityRules() {
        return QSSystem.getSecurityRules();
    }
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
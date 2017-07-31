import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import { gitHubLinks } from '/imports/ui/UIHelpers';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, QRSconfig, certs, authHeaders } from '/imports/api/config.js';
import { APILogs, REST_Log } from '/imports/api/APILogs';
import lodash from 'lodash';
_ = lodash;

//install NPM modules
const fs = require('fs-extra');
const enigma = require('enigma.js');
const bluebird = require('bluebird');
const WebSocket = require('ws');
const qlikServer = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy;

export async function checkTemplateAppExist() {
    //get all apps from sense
    Meteor.call('updateLocalSenseCopy');

    //see if there are any apps published in the templates streams
    // if (!Apps.find({ "stream.name": "Templates" }).count()) {
    console.log('no template apps found, so upload from the templates dir.', QRSconfig);


    // }
}

export function generateStreamAndApp(customers, generationUserId) {
    // console.log('METHOD called: generateStreamAndApp for the template apps as stored in the database of the fictive OEM');

    var templateApps = checkTemplateAppExists(generationUserId); //is a template app selected, and does the guid still exist in Sense? if yes, return the valid templates
    checkCustomersAreSelected(customers); //have we selected a  customer to do the generation for?
    for (const customer of customers) {
        for (const templateApp of templateApps) {
            generateAppForTemplate(templateApp, customer, generationUserId);
        }
    };
};

function generateAppForTemplate(templateApp, customer, generationUserId) {
    // console.log(templateApp);
    // console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name + ' FOR generationUserId: ' + generationUserId);
    const call = {};
    call.action = 'Start of generation of app ' + templateApp.name + ' for ' + customer.name;
    call.createdBy = generationUserId;
    call.request = 'Start creating app ' + templateApp.name + ' for customer ' + customer.name;
    REST_Log(call, generationUserId);

    try {
        var streamId = checkStreamStatus(customer, generationUserId) //create a stream for the customer if it not already exists 
        var customerDataFolder = createDirectory(customer.name); //for data like XLS/qvd specific for a customer
        var newAppId = copyApp(templateApp.id, templateApp.name, generationUserId);
        var result = reloadAppAndReplaceScriptviaEngine(newAppId, templateApp.name, streamId, customer, customerDataFolder, '', generationUserId);
        var publishedAppId = publishApp(newAppId, templateApp.name, streamId, customer.name, generationUserId);

        //logging only
        const call = {};
        call.action = 'Finished generation for ' + customer.name;
        call.request = templateApp.name + ' has been created and reloaded with data from the ' + customer.name + ' database';
        REST_Log(call, generationUserId);
        // console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
        GeneratedResources.insert({
            'generationUserId': generationUserId,
            'customer': customer.name,
            'streamId': streamId,
            'appId': newAppId
        });
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Generation failed', 'The server has an internal error, please check the server command logs');
    }
    return;
};


//Example to demo that you can also use the Engine API to get all the apps, or reload an app, set the script etc.
//source based on loic's work: https://github.com/pouc/qlik-elastic/blob/master/app.js
async function reloadAppAndReplaceScriptviaEngine(appId, newAppName, streamId, customer, customerDataFolder, scriptReplace, generationUserId) {
    var customerDataFolder = "C:\\Users\\Qlikexternal\\Documents\\GitHub\\QRSMeteor\\customerData\\Cartwright, Boyer and Hahn";
    console.log('setting config for Engine');
    // check(customer, Object);
    // check(customerDataFolder, String);
    // check(generationUserId, String);
    // check(appId, String);

    const config = {
        schema: engineConfig.QIXSchema,
        appId: appId,
        session: {
            host: engineConfig.host,
            port: engineConfig.port,
        },
        Promise: bluebird,
        createSocket(url) {
            return new WebSocket(url, {
                ca: engineConfig.ca,
                key: engineConfig.key,
                cert: engineConfig.cert,
                headers: {
                    'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
                },
            });
        },
        handleLog: logRow => console.log(JSON.stringify(logRow)),
    }

    // console.log('Connecting to Engine', config);

    try {
        //connect to the engine
        var qix = await enigma.getService('qix', config);
        console.log('############### Connected');
        var call = {};
        call.action = 'Connect to Qlik Sense Engine API';
        call.request = 'Connect to Engine (using EnigmaJS) with a new appname parameter when you call global.openDoc: ', engineConfig.appname;
        call.url = gitHubLinks.replaceAndReloadApp;
        REST_Log(call, generationUserId);

        //create folder connection
        var folder =
            // qConnection: {
            //     "qName": customer.name,
            //     "qType": "folder",
            //     "qConnectionString": customerDataFolder,
            //     "qLogOn": 0
            // }
            {
                "qName": "Connection01",
                "qMeta": {},
                "qConnectionString": "C:\\",
                "qType": "folder"
            };
        console.log('folder is ', qix.app);
        var qConnectionId = await qix.app.createConnection(folder);
        console.log('created folder connection: ', qConnectionId);

        //get the script
        console.log('get script');
        var script = await qix.app.getScript();
        call.action = 'Get data load script';
        call.url = gitHubLinks.getScript;
        call.request = 'We extracted the following load script from the app';
        call.response = script;
        REST_Log(call, generationUserId);

        //set the new script
        console.log('set script');
        call.response = await qix.app.setScript(replaceScript(script)) //we now just include the old script in this app
        call.action = 'Insert customer specific data load script for its database';
        call.url = gitHubLinks.setScript;
        call.request = 'The script of the app has been replaced with a customer specific one. Normally you would replace the database connection for each customer. Or you can insert a customer specific script to enable customization per customer. ';
        REST_Log(call, generationUserId);

        //reload the app
        call.response = await qix.app.doReload()
        call.action = 'Reload the app';
        call.url = gitHubLinks.reloadApp;
        call.request = 'Has the app been reloaded with customer specific data?';
        REST_Log(call, generationUserId);

        //save the app
        call.action = 'Save app'
        call.url = gitHubLinks.saveApp;
        call.request = 'App with GUID ' + appId + ' has been saved to disk';
        REST_Log(call, generationUserId);
        await qix.app.doSave();

        // //publish the app        
        // // console.log('publish app config', publishObj);
        // call.response = await qix.app.publish(streamId, newAppName);
        // call.action = 'Publish app';
        // call.request = 'qix.app.publish({ qAppId: appId, qName: newAppName, qStreamId: streamId })';
        // call.url = gitHubLinks.publishApp;
        REST_Log(call, generationUserId);
    } catch (error) {
        console.error('error in reloadAppAndReplaceScriptviaEngine via Enigma.JS, did you used the correct schema definition in the settings.json file?', error);
    }

    function replaceScript(script) {
        //var scriptMarker = '§dummyDatabaseString§';
        // if you want to replace the database connection per customer use the script below.
        //return doc.setScript(script.replace(scriptMarker, scriptReplace)).then(function (result) {
        //you can also change the sense database connection: https://github.com/mindspank/qsocks/blob/master/examples/App/create-dataconnection.js
        return script;
    }
}

function createDirectory(dirName) {
    const dir = Meteor.settings.private.customerDataDir + dirName;
    fs.ensureDir(dir, err => {
        console.error(err) // => null
    });
    return dir;
}

function checkCustomersAreSelected(customers) {
    if (!customers.length) { // = 0
        throw new Meteor.Error('No customers', 'user has not specified at least one customer for which an app can be generated');
    }
};

function checkTemplateAppExists(generationUserId) {
    //These are the apps that the OEM partner has in his database, but do they still exists on the qliks sense side?
    var templateApps = TemplateApps.find({ 'generationUserId': Meteor.userId() })
        .fetch();
    if (templateApps.length === 0) { //user has not specified a template
        throw new Meteor.Error('No Template', 'user has not specified a template for which apps can be generated');
    }

    currentAppsInSense = getApps();
    _.each(templateApps, function(templateApp) {
        var templateFound = _.some(currentAppsInSense, ['id', templateApp.id]);

        if (!templateFound) {
            throw new Meteor.Error('You have selected a Qlik Sense App: ' + templateApp.name + ' with guid: ' + templateApp.id + ' which does not exist in Sense anymore. Have you deleted the template in Sense?');
        } else {
            // console.log('checkTemplateAppExists: True, template guid exist: ', templateApp.id);
        }
    })
    return templateApps;
};


export function copyApp(guid, name, generationUserId) {
    check(guid, String);
    check(name, String);
    // console.log('QRS Functions copy App, copy the app id: ' + guid + ' to app with name: ', name);

    const call = {};
    call.request = qlikServer + '/qrs/app/' + guid + '/copy';

    try {
        call.action = 'Copy app';
        call.url = gitHubLinks.copyApp;
        call.response = HTTP.post(call.request, {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey, "name": name },
            data: {}
        })
        REST_Log(call, generationUserId);
        var newGuid = call.response.data.id;
        // console.log('Step 2: the new app id is: ', newGuid);
        //addTag('App', newGuid);
        return newGuid;
    } catch (err) {
        console.error(err);
        call.action = 'Copy app FAILED';
        call.response = err.message;
        REST_Log(call, generationUserId);
        throw new Meteor.Error('Copy app for selected customers failed', err.message);
    }
};


function checkStreamStatus(customer, generationUserId) {
    // console.log('checkStreamStatus for: ' + customer.name);
    var stream = Streams.findOne({ name: customer.name }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object
    var streamId = '';
    if (stream) {
        // console.log('Stream already exists: ', stream.id);
        streamId = stream.id;
    } else {
        // console.log('No stream for customer exist, so create one: ' + customer.name);
        streamId = QSStream.createStream(customer.name, generationUserId)
            .data.id;
        // console.log('Step 1: the (new) stream ID for ' + customer.name + ' is: ', streamId);
    }

    return streamId;
}


// export function getAppsViaEngine() {
//     // console.log('server: QSSOCKS getApps');
//     return qsocks.Connect(engineConfig)
//         .then(function(global) {
//             //We can now interact with the global class, for example fetch the document list.
//             //qsocks mimics the Engine API, refer to the Engine API documentation or the engine api explorer for available methods.
//             global.getDocList()
//                 .then(function(docList) {
//                     return docList;
//                 });

//         });
// };

export function getApps() {
    try {
        const call = {};
        call.action = 'Get list of apps';
        call.request = qlikServer + '/qrs/app/full)';
        call.response = HTTP.get(qlikServer + '/qrs/app/full', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }
        });
        // REST_Log(call,generationUserId);
        return call.response.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getApps failed', err.message);
    }
};


export function deleteApp(guid, generationUserId = 'Not defined') {
    console.log('QRSApp deleteApp: ', guid);
    try {
        const call = {};
        const result = HTTP.del(qlikServer + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey, {
                headers: authHeaders
            })
            // Meteor.call('updateLocalSenseCopy');

        //logging only
        call.action = 'Delete app';
        call.request = 'HTTP.del(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey;
        call.url = gitHubLinks.deleteApp;
        call.response = result;
        REST_Log(call, generationUserId);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('App delete failed', err.message);
    }
};

export function publishApp(appGuid, appName, streamId, customerName, generationUserId) {
    // console.log('Publish app: ' + appName + ' to stream: ' + streamId);
    check(appGuid, String);
    check(appName, String);
    check(streamId, String);

    try {
        const result = HTTP.put(qlikServer + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey, {
            headers: {
                'hdr-usr': senseConfig.headerValue,
                'X-Qlik-xrfkey': senseConfig.xrfkey
            }
        });

        //logging into database
        const call = {};
        call.action = 'Publish app';
        call.request = 'HTTP.call(put, http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey + ", {headers: {'hdr-usr': " + senseConfig.headerValue, +'X-Qlik-xrfkey:' + senseConfig.xrfkey + '}';
        call.response = result;
        call.url = gitHubLinks.publishApp;
        REST_Log(call, generationUserId);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
    }
};


function createTag(name) {
    check(name, String);
    // console.log('QRS Functions Appp, create a tag: ' + name);

    try {
        const result = HTTP.post(qlikServer + '/qrs/Tag', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { "name": name }
        })

        //logging only
        const call = {};
        call.action = 'create Tag';
        call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/tag';
        call.response = result;
        REST_Log(call, generationUserId);

        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Tag: ' + name + ' create failed ', err.message);
    }
};

function addTag(type, guid, tagName) {
    check(type, String);
    check(guid, String);

    //check if tag with tagName already exists

    var selectionId = createSelection(type, guid);
    addTagViaSyntheticToType('App', selectionId, tagGuid)

}

function createSelection(type, guid) {
    check(type, String);
    check(guid, String);
    console.log('QRS Functions APP, create selection for type: ', type + ' ' + guid);

    try {
        const result = HTTP.post(qlikServer + '/qrs/Selection', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { items: [{ type: type, objectID: guid }] }
        })
        console.log('the result of selection for type: ', type + ' ' + guid);
        console.log(result);
        return result.id;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Selection: ' + type + ' failed for guid ' + guid, err.message);
    }
};

function deleteSelection(selectionId) {
    check(selectionId, String);
    console.log('QRS Functions APP, deleteSelection selection for selectionId: ', selectionId);

    try {
        const result = HTTP.delete(qlikServer + '/qrs/Selection/' + selectionId, {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }
        })
        console.log(result);
        return result.id;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Selection delete failed: ', err.message);
    }
};

function buildModDate() {
    var d = new Date();
    return d.toISOString();
}

function addTagViaSyntheticToType(type, selectionId, tagGuid) {
    check(type, String);
    check(guid, String);
    console.log('QRS Functions Appp, Update all entities of a specific type: ' + type + ' in the selection set identified by {id} ' + selectionId + ' based on an existing synthetic object. : ');

    try {
        const result = HTTP.put(qlikServer + '/qrs/Selection/' + selectionId + '/' + type + '/synthetic', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: {
                "latestModifiedDate": buildModDate(),
                "properties": [{
                    "name": "refList_Tag",
                    "value": {
                        "added": [tagGuid]
                    },
                    "valueIsModified": true
                }],
                "type": type
            }
        })
        console.log('the result of selection for type: ', type + ' ' + guid);
        console.log(result);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Selection: ' + type + ' failed for guid ' + guid, err.message);
    }
};
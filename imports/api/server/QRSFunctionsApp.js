import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
import { APILogs, REST_Log } from '/imports/api/APILogs';
import lodash from 'lodash';
_ = lodash;


//install NPM modules
var fs = require('fs');
var qsocks = require('qsocks');

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
    call.action = 'Start of generation of app '+templateApp.name+' for '+customer.name;
    call.createdBy = generationUserId;
    call.request = 'Start creating app ' + templateApp.name + ' for customer ' + customer.name;
    REST_Log(call, generationUserId);

    try {
        var streamId = checkStreamStatus(customer) //create a stream for the customer if it not already exists    
        var newAppId = copyApp(templateApp.id, templateApp.name, generationUserId);
        var result = reloadAppAndReplaceScriptviaEngine(newAppId, '', generationUserId);
        var publishedAppId = publishApp(newAppId, templateApp.name, streamId, customer.name, generationUserId);

        //logging only
        const call = {};
        call.action = 'Finished generation for '+customer.name;
        call.request = templateApp.name + ' has been created and reloaded with data from the ' + customer.name+' database';
        REST_Log(call, generationUserId);
        // console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
    } catch (err) {
        console.error(err);
         throw new Meteor.Error('Generation failed', 'The server has an internal error, please check the server command logs');
    }
    GeneratedResources.insert({
        'generationUserId': generationUserId,
        'customer': customer.name,
        'streamId': streamId,
        'appId': newAppId
    });
    // Meteor.call('updateLocalSenseCopy');
    return;
};


//Example to demo that you can also use the Engine API to get all the apps, or reload an app, set the script etc.
async function reloadAppAndReplaceScriptviaEngine(appId, scriptReplace) {
    // console.log('server: QSSOCKS reloadAppviaEngine');

    //source based on loic's work: https://github.com/pouc/qlik-elastic/blob/master/app.js
    var scriptMarker = '§dummyDatabaseString§';
    var _global = {};

    engineConfig.appname = appId; //(String) Scoped connection to app. see https://github.com/mindspank/qsocks
    // console.log('Connect to Engine with a new appname parameter when you call global,openDoc: ', engineConfig.appname);
    var call = {};
    call.action = 'Connect to engine API (QSocks)';
    call.request = 'Connect to Engine with a new appname parameter when you call global,openDoc: ', engineConfig.appname;
    REST_Log(call);

    //use ES7 await function so this code will run in synchronous mode
    return await qsocks.Connect(engineConfig)
        .then(function(global) {
            // console.log('connected to Qsocks');
            _global = global;
            return global.openDoc(appId, '', '', '', true) //global.openDoc(appId), this code opens the app without data, that is faster!
        })
        .then(function(doc) {
            // console.log('** getAppsViaEngine, QSocks opened and now tries to set the script for appId: ', appId);
            return doc.getScript()
                .then(function(script) {
                    // console.log('get Script success, ', script);

                    var call = {};
                    call.action = 'Extract current script';
                    call.request = 'We extracted the following script from the app: ' + script;
                    REST_Log(call);
                    // if you want to replace the database connection per customer use the script below.
                    //return doc.setScript(script.replace(scriptMarker, scriptReplace)).then(function (result) {
                    //you can also change the sense database connection: https://github.com/mindspank/qsocks/blob/master/examples/App/create-dataconnection.js
                    return doc.setScript(script) //we now just include the old script in this app
                        .then(function(result) {    
                            var call = {};
                            call.action = 'Replace the data load (ETL) script'
                            call.request = 'The script of the app has been replaced with a customer specific one';
                            REST_Log(call);
                            // console.log('Script replaced');
                            return doc;
                        })
                });
        })
        .then(function(doc) {
            return doc.doReload()
                .then(function(result) {
                    var call = {};
                    call.action = 'Reload app'
                    call.request = 'The app has been reloaded: ' + result;
                    REST_Log(call);
                    // console.log('Reload : ' + result);
                    return doc.doSave()
                        .then(function(result) {
                            var call = {};
                            call.action = 'Save app'
                            call.request = 'App ' + appId + ' saved success';
                            REST_Log(call);
                            // console.log('Save : ', result);
                            _global.connection.close();
                            return doc;
                        });
                })
        })
        .catch((error) => {
            console.error('ERROR while reloading the new app: ', error);
            throw new Meteor.error(error);
        });
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
            console.log('checkTemplateAppExists: True, template guid exist: ', templateApp.id);
        }
    })
    return templateApps;
};

function createTag(name) {
    check(name, String);
    console.log('QRS Functions Appp, create a tag: ' + name);

    try {
        const result = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/Tag', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { "name": name }
        })


        //logging only
        const call = {};
        call.action = 'create Tag';
        call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/tag';
        call.response = result;
        REST_Log(call);

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
        const result = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/Selection', {
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
        const result = HTTP.delete('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/Selection/' + selectionId, {
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
        const result = HTTP.put('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/Selection/' + selectionId + '/' + type + '/synthetic', {
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


export function copyApp(guid, name, generationUserId) {
    check(guid, String);
    check(name, String);
    // console.log('QRS Functions Appp, copy the app id' + guid + 'to app with name: ', name);

    try {
        const call = {};
        call.action = 'Copy app';
        call.request = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '/copy?'

        call.result = HTTP.post(call.request, {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey, 'name': name }, //probably a redundant name here...
            data: { "name": name }
        })
        REST_Log(call, generationUserId);
        var newGuid = call.result.data.id;
        // console.log('Step 2: the new app id is: ', newGuid);
        //addTag('App', newGuid);
        return newGuid;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Copy app for selected customers failed', err.message);
    }
};


function checkStreamStatus(customer) {
    // console.log('checkStreamStatus for: ' + customer.name);
    var stream = Streams.findOne({ name: customer.name }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object
    var streamId = '';
    if (stream) {
        // console.log('Stream already exists: ', stream.id);
        streamId = stream.id;
    } else {
        console.log('No stream for customer exist, so create one: ' + customer.name);
        streamId = QSStream.createStream(customer.name)
            .data.id;
        // console.log('Step 1: the (new) stream ID for ' + customer.name + ' is: ', streamId);
    }
    return streamId;
}


export function getAppsViaEngine() {
    // console.log('server: QSSOCKS getApps');
    return qsocks.Connect(engineConfig)
        .then(function(global) {
            //We can now interact with the global class, for example fetch the document list.
            //qsocks mimics the Engine API, refer to the Engine API documentation or the engine api explorer for available methods.
            global.getDocList()
                .then(function(docList) {
                    return docList;
                });

        });
};

export function getApps() {
    try {
        const call = {};
        call.action = 'Get list of apps';
        call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/full)';
        call.response = HTTP.get('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/full', { //?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }
        });
        REST_Log(call);
        return call.response.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getApps failed', err.message);
    }
};


export function deleteApp(guid) {
    console.log('QRSApp deleteApp: ', guid);
    try {
        const call = {};
        const result = HTTP.del('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders
        })
        // Meteor.call('updateLocalSenseCopy');

        //logging only
        call.action = 'Delete app';
        call.request = 'HTTP.del(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey;
        call.response = result;
        REST_Log(call);
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
        const result = HTTP.call('put', 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey, {
                headers: {
                    'hdr-usr': senseConfig.headerValue,
                    'X-Qlik-xrfkey': senseConfig.xrfkey
                }
            })
            //logging into database
        const call = {};
        call.action = 'Publish app';
        call.request = 'HTTP.call(put, http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey + ", {headers: {'hdr-usr': " + senseConfig.headerValue, +'X-Qlik-xrfkey:' + senseConfig.xrfkey + '}';
        call.response = result;
        REST_Log(call, generationUserId);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
    }
};

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
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import {
    gitHubLinks
} from '/imports/ui/UIHelpers';

//import meteor collections
import {
    Streams
} from '/imports/api/streams';
import {
    Customers
} from '/imports/api/customers';

import {
    createVirtualProxies
} from '/imports/api/server/QPSFunctions';


//import config for Qlik Sense QRS and Engine API//
import {
    qlikHDRServer, // Qlik sense QRS endpoint via header authentication
    senseConfig,
    enigmaServerConfig,
    authHeaders,
    qrsSrv,
    QRSconfig,
    _SSBIApp,
    certicate_communication_options,
    _IntegrationPresentationApp
} from '/imports/api/config.js';
import {
    APILogs,
    REST_Log
} from '/imports/api/APILogs';
import lodash from 'lodash';
_ = lodash;

//
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────
//

const fs = require('fs-extra');
const enigma = require('enigma.js');
var QRS = require('qrs');
var promise = require('bluebird');
var request = require('request');

//
// ─── UPLOAD APPS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────
//


// UPLOAD TEMPLATES APPS FROM FOLDER, AND PUBLISH INTO THE TEMPLATES STREAM
export async function uploadAndPublishTemplateApps() {
    var newFolder = Meteor.settings.private.templateAppsFrom;
    console.log('--------------------------INIT QLIK SENSE');
    console.log('uploadAndPublishTemplateApps: Read all files in the template apps folder "' + newFolder + '" and upload them to Qlik Sense.');

    //GET THE ID OF THE IMPORTANT STREAM (streams that QRSMeteor needs)
    var everyOneStreamId = QSStream.getStreamByName(Meteor.settings.public.EveryoneAppStreamName).id;
    var templateStreamId = QSStream.getStreamByName(Meteor.settings.public.TemplateAppStreamName).id;
    var APIAppsStreamID = QSStream.getStreamByName(Meteor.settings.public.APIAppStreamName).id;
    try {
        check(newFolder, String);
        check(everyOneStreamId, String);
        check(templateStreamId, String);
        check(APIAppsStreamID, String);
    } catch (err) {
        console.error('You did not specify the templateAppsFrom, everyone, api apps or template stream name in the settings.json file?');
        throw new Meteor.Error('Missing Settings', 'You did not specify the everone, api apps or template stream name in the settings.json file?');
    }

    // LOAD ALL SENSE APPS IN FOLDER
    var appsInFolder = await fs.readdir(newFolder);

    // FOR EACH APP FOUND: PUBLISH IT    
    await Promise.all(appsInFolder.map(async(QVF) => {
        try {
            //GET THE NAME OF THE APP AND CREATE A FILEPATH
            var appName = QVF.substr(0, QVF.indexOf('.'));
            var filePath = newFolder + '\\' + QVF;

            //UPLOAD THE APP, GET THE APP ID BACK
            var appId = await uploadApp(filePath, appName);

            //BASED ON THE APP WE WANT TO PUBLISH IT INTO A DIFFERENT STREAM                      
            if (appName === 'SSBI') { //should be published in the everyone stream
                _SSBIApp = appId; // for the client side HTML/IFrames etc.
                publishApp(appId, appName, everyOneStreamId);
            } else if (appName === 'Sales') { //THIS ONE NEEDS TO BE COPIED AND PUBLISHED INTO 2 STREAMS: AS TEMPLATE AND FOR THE EVERYONE STREAM.
                publishApp(appId, appName, everyOneStreamId);
                var copiedAppId = copyApp(appId, appName);
                publishApp(copiedAppId, appName, templateStreamId);
            } else if (appName === 'Slide generator') {
                _IntegrationPresentationApp = appId
                publishApp(appId, appName, APIAppsStreamID);
            } else {
                //Insert into template apps stream
                publishApp(appId, appName, templateStreamId);
            }
        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Unable to upload the app to Qlik Sense. ', err)
        }
    }))
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
    console.log('--------------------------GENERATE APPS FOR TEMPLATE');
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
    console.log('--------------------------REPLACE SCRIPT AND RELOAD APP');
    check(appId, String);
    check(customer.name, String);
    check(customerDataFolder, String);
    check(generationUserId, String);

    //set the app ID to be used in the enigma connection to the engine API
    var config = Object.assign({}, enigmaServerConfig);
    config.appId = appId;

    try {
        //connect to the engine
        var qix = await enigma.getService('qix', config);
        var call = {};
        call.action = 'Connect to Qlik Sense';
        call.request = 'Connect to Engine API (using Enigma.js) using an appID: ' + appId;
        call.url = gitHubLinks.replaceAndReloadApp;
        REST_Log(call, generationUserId);

        try {
            //create folder connection            
            var qConnectionId = await qix.app.createConnection({
                "qName": customer.name,
                "qType": "folder",
                "qConnectionString": customerDataFolder
            })
            console.log('created folder connection: ', qConnectionId);
        } catch (error) {
            console.info('No issue, existing customer so his data folder connection already exists', error);
        }

        //get the script
        console.log('get script');
        var script = await qix.app.getScript();
        var call = {};
        call.action = 'Get data load script';
        call.url = gitHubLinks.getScript;
        call.request = 'We extracted the following load script from the app';
        call.response = script;
        REST_Log(call, generationUserId);

        //set the new script
        console.log('set script');
        var call = {};
        call.response = await qix.app.setScript(replaceScript(script)) //we now just include the old script in this app
        call.action = 'Insert customer specific data load script for its database';
        call.url = gitHubLinks.setScript;
        call.request = 'The script of the app has been replaced with a customer specific one. Normally you would replace the database connection for each customer. Or you can insert a customer specific script to enable customization per customer. ';
        REST_Log(call, generationUserId);

        //reload the app
        var call = {};
        call.response = await qix.app.doReload()
        call.action = 'Reload the app';
        call.url = gitHubLinks.reloadApp;
        call.request = 'Has the app been reloaded with customer specific data?';
        REST_Log(call, generationUserId);

        //save the app
        var call = {};
        call.action = 'Save app'
        call.url = gitHubLinks.saveApp;
        call.request = 'App with GUID ' + appId + ' has been saved to disk';
        REST_Log(call, generationUserId);
        await qix.app.doSave();

        // //publish the app, must be done via QRS API (depreciated)
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

function createDirectory(customerName) {
    const dir = Meteor.settings.private.customerDataDir + customerName;
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

// CHECK IF SELECTED TEMPLATE APP EXISTS IN QLIK SENSE
//These are the apps that the OEM partner has in his database, but do they still exists on the qliks sense side?
function checkTemplateAppExists(generationUserId) {
    var templateApps = TemplateApps.find({
            'generationUserId': Meteor.userId()
        })
        .fetch();
    if (templateApps.length === 0) { //user has not specified a template
        throw new Meteor.Error('No Template', 'user has not specified a template for which apps can be generated');
    }

    currentAppsInSense = getApps();
    if (!currentAppsInSense) {
        throw new Meteor.Error('No apps have been received from Qlik Sense. Therefore you have selected a Qlik Sense App: ' + templateApp.name + ' with guid: ' + templateApp.id + ' which does not exist in Sense anymore. Have you deleted the template in Sense?');
    }
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

// UPLOAD APP
async function uploadApp(filePath, appName) {
    console.log('--------------------------UPLOAD APP');
    console.log('uploadApp: try to upload app: ' + appName + ' from path: ' + filePath);
    return await new Promise(function(resolve, reject) {
        var formData = {
            my_file: fs.createReadStream(filePath)
        };

        request.post({
            url: qlikHDRServer + '/qrs/app/upload?name=' + appName + '&xrfkey=' + senseConfig.xrfkey,
            headers: {
                'Content-Type': 'application/vnd.qlik.sense.app',
                'hdr-usr': senseConfig.headerValue,
                'X-Qlik-xrfkey': senseConfig.xrfkey
            },
            formData: formData
        }, function(error, res, body) {
            if (!error) {
                var appId = JSON.parse(body).id;
                console.log('Uploaded "' + appName + '.qvf" to Qlik Sense and got appID: ' + appId);
                resolve(appId);
            } else {
                console.error(error);
                reject(error);
            }
        });
    });
}

export function copyApp(guid, name, generationUserId) {
    check(guid, String);
    check(name, String);
    // console.log('QRS Functions copy App, copy the app id: ' + guid + ' to app with name: ', name);

    const call = {};
    call.request = qlikHDRServer + '/qrs/app/' + guid + '/copy';

    try {
        call.action = 'Copy app';
        call.url = gitHubLinks.copyApp;
        call.response = HTTP.post(call.request, {
            headers: authHeaders,
            params: {
                'xrfkey': senseConfig.xrfkey,
                "name": name
            },
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
    var stream = Streams.findOne({
        name: customer.name
    }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object
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

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Get-All-As-Full.htm
export function getApps() {
    try {
        const call = {};
        call.action = 'Get list of apps';
        call.request = qrsSrv + '/qrs/app/full/?xrfkey=' + senseConfig.xrfkey;
        console.log('call.request', call.request)
        call.response = HTTP.get(call.request, {
            'npmRequestOptions': certicate_communication_options
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
        const result = HTTP.del(qlikHDRServer + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey, {
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
    console.log('--------------------------PUBLISH');
    console.log('Publish app: ' + appName + ' to stream: ' + streamId);
    check(appGuid, String);
    check(appName, String);
    check(streamId, String);

    try {
        const result = HTTP.put(qlikHDRServer + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey, {
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

        // // IF APP ALREADY EXISTED TRY TO PUBLISH OVERWRITE IT (REPLACE)
        // if(err.response.statusCode == 400){
        //     replaceApp()
        // }
        // console.error('statusCode:', err.response.statusCode);
        // console.info('Try to PUBLISH OVERWRITE THE APP, SINCE IT WAS ALREADY PUBLISHED');
        throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
    }
};

// REPLACE APP 
export function replaceApp(targetApp, replaceByApp, generationUserId) {
    console.log('Function: Replace app: ' + targetApp + ' by app ' + targetApp);
    check(appGuid, String);
    check(replaceByApp, String);

    try {
        const result = HTTP.put(qlikHDRServer + '/qrs/app/' + replaceByApp + '/replace?app=' + targetApp + '&xrfkey=' + senseConfig.xrfkey, {
            headers: {
                'hdr-usr': senseConfig.headerValue,
                'X-Qlik-xrfkey': senseConfig.xrfkey
            }
        });

        //logging into database
        const call = {};
        call.action = 'Replace app';
        call.request = 'HTTP.put(' + qlikHDRServer + '/qrs/app/' + replaceByApp + '/replace?app=' + targetApp + '&xrfkey=' + senseConfig.xrfkey;
        call.response = result;
        call.url = 'http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-App-Replace.htm';
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
        const result = HTTP.post(qlikHDRServer + '/qrs/Tag', {
            headers: authHeaders,
            params: {
                'xrfkey': senseConfig.xrfkey
            },
            data: {
                "name": name
            }
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
        const result = HTTP.post(qlikHDRServer + '/qrs/Selection', {
            headers: authHeaders,
            params: {
                'xrfkey': senseConfig.xrfkey
            },
            data: {
                items: [{
                    type: type,
                    objectID: guid
                }]
            }
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
        const result = HTTP.delete(qlikHDRServer + '/qrs/Selection/' + selectionId, {
            headers: authHeaders,
            params: {
                'xrfkey': senseConfig.xrfkey
            }
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
        const result = HTTP.put(qlikHDRServer + '/qrs/Selection/' + selectionId + '/' + type + '/synthetic', {
            headers: authHeaders,
            params: {
                'xrfkey': senseConfig.xrfkey
            },
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


// async function uploadPublishTemplateApps() {
//     //check if template apps have been uploaded and published in the templates stream
//     // if (true) { // (!Apps.find({ "stream.name": "Templates" }).count()) {
//     console.warn('no template apps found, so upload from the templates dir.');
//     var folder = Meteor.settings.private.templateAppsFrom;
//     // var folder = await copyTemplatesToQRSFolder();
//     console.log('apps folder', folder);
//     uploadAndPublishApps(folder);
//     // } else {}
// }

// //upload and publish all apps found in the folder to the templates stream
// async function copyTemplatesToQRSFolder() {
//     var newFolder = Meteor.settings.private.templateAppsTo + '\\' + process.env.USERDOMAIN + '\\' + process.env.USERNAME;
//     try {
//         await fs.copy(Meteor.settings.private.templateAppsFrom, newFolder, {
//             overwrite: true
//         }); //"QLIK-AB0Q2URN5T\\Qlikexternal",
//         return newFolder
//     } catch (err) {
//         console.error('error copy Templates from ' + Meteor.settings.private.templateAppsFrom + ' To QRSFolder ' + Meteor.settings.private.templateAppsDir, err);
//     }
// }

// For a system service account, the app must be in the %ProgramData%\Qlik\Sense\Repository\DefaultApps folder.
// For any other account, the app must be in the %ProgramData%\Qlik\Sense\Apps\<login domain>\<login user> folder.
//so you have to copy your apps there first. in a fresh sense installation.
export function importApp(fileName, name, generationUserId = 'no user set') {
    // check(fileName, String);
    // check(name, String);
    // console.log('QRS Functions import App, with name ' + name + ', with fileName: ', fileName);

    // try {
    //     const call = {};
    //     call.action = 'Import app';
    //     call.url = 'http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-App-Import-App.htm'
    //     call.request = qlikHDRServer + '/qrs/app/import?keepData=true&name=' + name + '&xrfkey=' + senseConfig.xrfkey; //using header auth.
    //     call.response = HTTP.post(call.request, {
    //         headers: {
    //             'hdr-usr': senseConfig.headerValue,
    //             'X-Qlik-xrfkey': senseConfig.xrfkey
    //         },
    //         data: '"Sales.qvf"'
    //     });

    //     REST_Log(call, generationUserId);
    //     var newGuid = call.response.data.id;
    //     return newGuid;
    // } catch (err) {
    //     console.error(err);
    //     const call = {};
    //     call.action = 'Import app FAILED';
    //     call.response = err.message;
    //     REST_Log(call, generationUserId);
    //     throw new Meteor.Error('Import app failed', err.message);
    // }
};

//https://www.npmjs.com/package/request#forms
// function uploadApp(filePath, fileSize, appName) {
//     console.log('QRS Functions upload App, with name ' + appName + ', with fileSize: ', fileSize + ' and filePath ' + filePath);
//     var formData = {
//         my_file: fs.createReadStream(filePath)
//     };
//     request.post({
//         url: qlikHDRServer + '/qrs/app/upload?name=' + appName + '&xrfkey=' + senseConfig.xrfkey,
//         headers: {
//             'Content-Type': 'application/vnd.qlik.sense.app',
//             'hdr-usr': senseConfig.headerValue,
//             'X-Qlik-xrfkey': senseConfig.xrfkey
//         },
//         formData: formData
//     }, function optionalCallback(err, httpResponse, body) {
//         if (err) {
//             return console.error('upload failed:', err);
//         }
//         console.log('Upload successful!  Server responded with:', body);
//     });
// }
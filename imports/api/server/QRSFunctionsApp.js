import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';
import lodash from 'lodash';
_ = lodash;


//install NPM modules
var fs = require('fs');
var qsocks = require('qsocks');

export function generateStreamAndApp(customers) {
    console.log('METHOD called: generateStreamAndApp for the template apps as stored in the database of the fictive OEM');

    var templateApps = checkTemplateAppExists(); //is a template app selected, and does the guid still exist in Sense? if yes, return the valid templates
    checkCustomersAreSelected(customers); //have we selected a  customer to do the generation for?

    customers.forEach(function(customer) {
        templateApps.forEach(function(templateApp) {
            generateAppForTemplate(templateApp, customer);
        })
    });
};

function generateAppForTemplate(templateApp, customer) {
    console.log(templateApp);
    console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
    var streamId = checkStreamStatus(customer) //create a stream for the customer if it not already exists    
    var newAppId = copyApp(templateApp.id, customer.name + ' - ' + templateApp.name);
    var publishedAppId = publishApp(newAppId, templateApp.name, streamId, customer.name);
    console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);

    GeneratedResources.insert({
        'customer': customer.name,
        'streamId': streamId,
        'appId': newAppId
    })
};

function checkCustomersAreSelected(customers) {
    if (!customers.length) { // = 0
        throw new Meteor.Error('No customers', 'user has not specified at least one customer for which an app can be generated');
    }
};

function checkTemplateAppExists() {
    //These are the apps that the OEM partner has in his database, but do they still exists on the qliks sense side?
    var templateApps = TemplateApps.find()
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
        const result = HTTP.post('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/Tag', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { "name": name }
        })
        console.log('the result of tag creation');
        console.log(result);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Tag: ' + name + ' create failed ', err.message);
    }
};


export function copyApp(guid, name) {
    check(guid, String);
    check(name, String);
    console.log('QRS Functions Appp, copy the app id' + guid + 'to app with name: ', name);

    try {
        const result = HTTP.post('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '/copy?', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey, 'name': name },
            data: { "name": name }
        })
        console.log('Step 2: the new app id is: ', result.data.id);
        return result.data.id;
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
        console.log('Stream already exists: ', stream.id);
        streamId = stream.id;
    } else {
        console.log('No stream for customer exist, so create one: ' + customer.name);
        streamId = QSStream.createStream(customer.name)
            .data.id;
    }
    console.log('Step 1: the (new) stream ID for ' + customer.name + ' is: ', streamId);
    return streamId;
}

//Example to demo that you can also use the Engine API to get all the apps, or reload an app, set the script etc.
export function getAppsViaEngine() {
    console.log('server: QSSOCKS getApps');
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
        call.action = 'Get the current list of apps';
        call.request = 'HTTP.get(http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/full';
        const result = HTTP.get('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/full', { //?xrfkey=' + senseConfig.xrfkey, {
                headers: authHeaders,
                params: { 'xrfkey': senseConfig.xrfkey }
            })
            // console.log('http get result %j',result);
        call.response = result;
        REST_Log(call);
        return result.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getApps failed', err.message);
    }
};


export function deleteApp(guid) {
    console.log('QRSApp sync deleteApp: ', guid);
    try {
        const call = {};

        const result = HTTP.del('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders
        })
        
        //logging only
        call.action = 'Delete app';
        call.request = 'HTTP.del(http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey;
        call.response = result;
        REST_Log(call);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('App delete failed', err.message);
    }
};

export function publishApp(appGuid, appName, streamId, customerName) {
    console.log('Publish app: ' + appName + ' to stream: ' + streamId);
    check(appGuid, String);
    check(appName, String);
    check(streamId, String);

    try {
        const result = HTTP.call('put', 'http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey, {
                headers: {
                    'hdr-usr': senseConfig.headerValue,
                    'X-Qlik-xrfkey': senseConfig.xrfkey
                }
            })
            //logging into database
        const call = {};
        call.action = 'Publish app';
        call.request = 'HTTP.call(put, http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey + ", {headers: {'hdr-usr': " + senseConfig.headerValue, +'X-Qlik-xrfkey:' + senseConfig.xrfkey + '}';
        call.response = result;
        REST_Log(call);
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
    }
};

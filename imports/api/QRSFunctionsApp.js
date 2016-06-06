import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps';
import * as QSStream from '/imports/api/QRSFunctionsStream';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';


//insyall NPM modules
var fs = require('fs');
var qsocks = require('qsocks');
var QRS = require('qrs');
qrs = new QRS(senseConfig);
// var Promise = require("bluebird");


export function generateStreamAndApp(customers) {
    console.log('METHOD called: generateStreamAndApp for the template apps as stored in the database of the fictive OEM');

    var templateApps = TemplateApps.find()
        .fetch();
    if (!TemplateApps.find()
        .count()) { //user has not specified a template
        throw new Meteor.Error('No Template', 'user has not specified a template for which apps can be generated');
    }
    if (!customers.length) { // = 0
        throw new Meteor.Error('No customers', 'user has not specified at least one customer for which an app can be generated');
    }

    customers.forEach(function(customer) {
        templateApps.forEach(function(templateApp) {
            generateAppForTemplate(templateApp, customer);
        })
    });
};


/* APP GENERATION:
    -for each customer
    - create stream if not already exist
    - copy app
    - publish to stream
    - @TODO add 'generated' tag
    - @TODO add reload task
*/

function generateAppForTemplate(templateApp, customer) {
    var result = {};
    console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);

    var streamId = checkStreamStatus(customer) //create a stream for the customer if it not already exists
    
    var newAppId = copyApp(templateApp.guid, customer.name + ' - ' + templateApp.name).data.id;
    console.log('result from step 2: the new app id is: ', newAppId);
    
    var publishedAppId = publishApp(newAppId, templateApp.name, streamId, customer.name); 
    console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
};






export function copyApp(guid, name) {
    check(guid, String);
    check(name, String);
    console.log('QRS sync Functions Appp, copy the app id' + guid + 'to app with name: ', name);

    try {
        const result = HTTP.post('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '/copy?', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey, 'name': name },
            data: { "name": name }
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('Copy app for selected customers failed', err.message);
    }
};

function checkStreamStatus(customer) {
    console.log('checkStreamStatus for: ' + customer.name);
    var stream = Streams.findOne({ name: customer.name }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object
    if (stream) {
        console.log('Stream already exists: ', stream.id);
        return stream.id
    } else {
        console.log('No stream for customer exist, so create one: ' + customer.name);
        return QSStream.createStream(customer.name).data.id;
    }
}

//Example to demo that you can also use the Engine API to get all the apps, or reload an app, set the script etc.
export function getApps() {
    console.log('server: getApps');
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


export function deleteApp(guid) {
    console.log('QRSApp sync deleteApp');
    try {
        const result = HTTP.del('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('App delete failed', err.message);
    }
};

export function publishApp(appGuid, appName, streamId, customerName) {
    console.log('Publish app: ' + appName + ' to stream: ' + streamId);
    check(appGuid, String);
    check(appName, String);
    check(streamId, String);

    console.log('de customerName is:' + customerName);
    try {
        const result = HTTP.call('put', 'http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + senseConfig.xrfkey, {
            headers: {
                'hdr-usr': senseConfig.headerValue,
                'X-Qlik-xrfkey': senseConfig.xrfkey
            }
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
    }
};

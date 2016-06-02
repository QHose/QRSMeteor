import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps';
import * as QSStream from '/imports/api/QRSFunctionsStream';

//import meteor collections
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

//import config for Qlik Sense QRS and Engine API
import { config, engineConfig, certs } from '/imports/api/config.js';


//insyall NPM modules
var fs = require('fs');
var qsocks = require('qsocks');
var QRS = require('qrs');
qrs = new QRS(config);
var Promise = require("bluebird");


/* APP GENERATION:
	-for each customer
	- create stream if not already exist
	- copy app
	- publish to stream
	- @TODO add 'generated' tag
	- @TODO add reload task
*/

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

    //FOR EACH TEPMPLATE
    var generationEndedPromise = Promise.all(Promise.map(templateApps, function(templateApp) {
                // console.log('the current template app: ', templateApp.name);

                //FOR EACH CUSTOMER
                return Promise.all(Promise.map(customers, function(customer) {
                        // return Promise.all(_.map(customers, function(customer){	
                        console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);

                        checkStreamStatus(customer) //create a stream for the customer if it not already exists
                            .then(function(resultOfStreamStep) { //Copy the APP
                                console.log('STEP 2 COPY the app: result Of create Stream Step: ', resultOfStreamStep);                                
                                return copyApp(templateApp.guid, customer.name + ' - ' + templateApp.name)
                            })
                            // .then(function(appGuid){ //Publish into streamId
                            // 	console.log('STEP 3 PUBLISH: APP HAS BEEN COPIED AND HAS RECEIVED GUID', appGuid);
                            // 	return publishApp(appGuid, templateApp.name, streamId) //return publishApp(appGuid, templateApp.name+' - ' +customer.name , streamId)
                            // })
                            .then(function() {
                                console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
                                console.log('	');
                            })
                            .catch(function(err) {
                                console.error(err);
                                // throw new Meteor.Error('Catch error app generation chain: App generation failed', 'err');
                            })
                    }, { concurrency: 1 })) //each customer Promise.all
            }) //each template
        ) //promise all generation total

    return generationEndedPromise;
};

export function copyApp(guid, name) {
    console.log('Copy template: ' + guid + ' to new app: ' + name);
    check(guid, String);
    check(name, String);

    var convertAsyncToSync = Meteor.wrapAsync(HTTP.call),
        resultOfAsyncToSync = convertAsyncToSync('post', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/app/' + guid + '/copy?name=' + name + '&xrfkey=' + config.xrfkey, {
            headers: {
                'hdr-usr': config.headerValue,
                'X-Qlik-xrfkey': config.xrfkey
            }
        });     
    return resultOfAsyncToSync;
};


function checkStreamStatus(customer) {
    console.log('checkStreamStatus for: ' + customer.name);
    var stream = Streams.findOne({ name: customer.name }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object
    if (stream) {
        var streamId = stream.id;
    }
    return new Promise(function(resolve, reject) {
        if (!streamId) {
            console.log('No stream for customer exist, so create one: ' + customer.name);
            return QSStream.createStream(customer.name);
        } else {
            resolve('No need to createa a stream, already exists' + Streams.find({ name: customer.name })
                .count() + ' time(s)');
        }
    })
}

export function getApps() {
    console.log('server: getApps');
    return qsocks.Connect(engineConfig)
        .then(function(global) {

            //We can now interact with the global class, for example fetch the document list.
            //qsocks mimics the Engine API, refer to the Engine API documentation for available methods.
            global.getDocList()
                .then(function(docList) {

                    // docList.forEach(function(doc) {
                    // 	console.log(doc.qDocName);
                    // });
                    return docList;
                });

        });

};



export function publishApp(appGuid, appName, streamId) {
    console.log('Publish app: ' + appName + ' to stream: ' + streamId);
    check(appGuid, String);
    check(appName, String);
    check(streamId, String);

    return new Promise(function(resolve, reject) {
        HTTP.call('put', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId + '&xrfkey=' + config.xrfkey, {
            headers: {
                'hdr-usr': config.headerValue,
                'X-Qlik-xrfkey': config.xrfkey
            }
        }, function(error, response) {
            if (error) {
                console.error('error publishApp', error);
                throw new Meteor.Error('error publish App', error)
                reject(error);
            } else {
                // console.log( response );
                resolve('publishApp success');
            }
        });
    })
};


export function deleteApp(guid) {
    return HTTP.call('DELETE', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/app/' + guid + '?xrfkey=' + config.xrfkey, {
        headers: {
            'hdr-usr': config.headerValue,
            'X-Qlik-xrfkey': config.xrfkey
        }
    }, function(error, response) {
        if (error) {
            console.error(error);
            throw new Meteor.Error('error app delete', error)
        } else {
            console.log(response);
            return response;
        }
    });
};

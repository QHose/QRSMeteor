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
// var Promise = require("bluebird");


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

    templateApp = {
            "_id": "TfN3XCoxCNEi4dFk4",
            "name": "Executive Performance Mgmt",
            "guid": 'effa6799-49f2-4da0-9a9c-aaa47252da18'
        }
        // //FOR EACH TEPMPLATE
        // return Promise.all( //wait till ALL promises are ended (resolved or rejected) (everything, each iteration over the templateApps) is finished before you send the result back to the client
        //         templateApps.reduce(function(templateApp, next) {
        //             return templateApp.then(function() {

    //FOR EACH CUSTOMER
    return Promise.all(
            customers.reduce(function(prev, curr) {
                return prev.then(function() {
                    return generateAppForTemplate(templateApp, curr)
                })
            }, Promise.resolve())
            .then(function() {}) //reduce, 
        ) //each customer Promise.all,
        //             }) //templateApp.then
        //     }) //each template
        // ) //promise all generation total
};

function generateAppForTemplate(templateApp, customer) {
    var result = {};
    console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);

    checkStreamStatus(customer) //create a stream for the customer if it not already exists
        .then(function(streamId) { //Copy the APP
            console.log('STEP 2 COPY the app: result Of create Stream step: stream has id: ', streamId);
            result.streamId = streamId;
            return copyApp(templateApp.guid, customer.name + ' - ' + templateApp.name)
        })
        .then(function(appGuid) { //Publish into streamId
            console.log('STEP 3 PUBLISH: APP HAS BEEN COPIED AND HAS RECEIVED GUID', appGuid);
            return publishApp(appGuid, templateApp.name, result.streamId, customer.name) //return publishApp(appGuid, templateApp.name+' - ' +customer.name , streamId)
        })
        .then(function() {
            console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
            console.log('	');
            return Promise.resolve('FINISHED');
        })
        .catch(function(err) {
            console.error(err);
            throw new Meteor.Error('Catch error app generation chain: App generation failed', err.message);
        })
};

function copyApp (guid, name) {
	// console.log('Copy template: '+guid+' to new app: '+name);
	check(guid, String);
	check(name, String);

	return new Promise(function(resolve, reject){ 
		HTTP.call( 'post', 'http://'+config.host+'/'+config.virtualProxy+'/qrs/app/'+guid+'/copy?name='+name+'&xrfkey='+config.xrfkey, 
		{
			headers: {
				'hdr-usr' : config.headerValue,
				'X-Qlik-xrfkey': config.xrfkey
			}
		}, function( error, response ) {
			if ( error ) {
				console.error('error app copy',  error );
				throw new Meteor.Error('error app copy', error)
				reject(error);
			} else {
				// console.log('Copy app:  HTTP request gave response', response.data );
				console.log('Copy app HTTP call success:  the generated guid: ', response.data.id);				
				resolve(response.data.id); //return app Guid
			}
		});
	})
};


// export function copyApp(guid, name) {
//     console.log('Copy template: ' + guid + ' to new app: ' + name);
//     check(guid, String);
//     check(name, String);

//     var convertAsyncToSync = Meteor.wrapAsync(HTTP.call),
//         resultOfAsyncToSync = convertAsyncToSync('post', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/app/' + guid + '/copy?name=' + name + '&xrfkey=' + config.xrfkey, {
//             headers: {
//                 'hdr-usr': config.headerValue,
//                 'X-Qlik-xrfkey': config.xrfkey
//             }
//         });
//     return resultOfAsyncToSync.data.id;
// };


function checkStreamStatus(customer) {
    console.log('checkStreamStatus for: ' + customer.name);
    var stream = Streams.findOne({ name: customer.name }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object
    if (stream) {
    	console.log('Stream already exists: ', stream.id);
        return Promise.resolve(stream.id);
    } else {
        console.log('No stream for customer exist, so create one: ' + customer.name);
        return QSStream.createStream(customer.name);
    }
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


export function publishApp(appGuid, appName, streamId, customerName) {
    console.log('Publish app: ' + appName + ' to stream: ' + streamId);
    check(appGuid, String);
    check(appName, String);
    check(streamId, String);

    console.log('de customerName is:'+customerName);

    return new Promise(function(resolve, reject) {
        HTTP.call('put', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/app/' + appGuid + '/publish', {
            headers: {
                'hdr-usr': config.headerValue,
                'X-Qlik-xrfkey': config.xrfkey
            },
            params:{
            	'xrfkey': config.xrfkey,
            	'stream': streamId,
            	'name': appName
            },
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

import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import config for Qlik Sense QRS and Engine API
import { config, engineConfig, certs } from '/imports/api/config.js';


//install NPM modules
var QRS = require('qrs');
var qrs = new QRS(config);
// var Promise = require("bluebird");


//STREAM FUNCTIONS
export function deleteStream(guid) {
    return HTTP.call('DELETE', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/stream/' + guid + '?xrfkey=' + config.xrfkey, {
        headers: {
            'hdr-usr': config.headerValue,
            'X-Qlik-xrfkey': config.xrfkey
        }
    }, function(error, response) {
        if (error) {
            console.error(error);
            throw new Meteor.Error('error stream delete', error)
        } else {
            console.log(response);
            return response;
        }
    });
};

export function getStreams() {
    return qrs.get('/qrs/stream/full');
};


export function createStream(name) {
    console.log('QRS Functions Stream, create the stream with name', name);

    return new Promise(function(resolve, reject) {
        HTTP.call('post', 'http://' + config.host + '/' + config.virtualProxy + '/qrs/stream',  {
            headers: {
                'hdr-usr': config.headerValue,
                'X-Qlik-xrfkey': config.xrfkey
            },
            params:{'xrfkey': config.xrfkey},
            data:{ "name": name }
        }, function(error, response) {
            if (error) {
                console.error('error createStream', error);
                throw new Meteor.Error('error stream create', error.message)
                reject(error);
            } else {
                // console.log('Copy app:  HTTP request gave response', response.data );
                console.log('create stream HTTP call success:  the generated guid: ', response.data.id);
                resolve(response.data.id); //return stream Guid
            }
        });
    })


};


// export function createStream(name) {
//     console.log('QRS Functions Stream, create the stream with name', name);
//     return qrs.post('/qrs/stream', null, { "name": name })
//         .then(
//             function fulfilled(result) {
//                 streamId = result.id;
//                 console.log('call to NPM qrs.post(/qrs/stream to create a stream fulfilled, the result QRS promise is: ', streamId);
//                 return streamId;
//             },
//             function Rejected(error) {
//                 // console.error('Promise Rejected: Error when trying to copy the app', error);
//                 throw new Meteor.Error('create stream failed', error.message);
//                 reject('Promise Rejected: Error when trying to create a stream');
//             })
// };

import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import config for Qlik Sense QRS and Engine API
import { config, engineConfig, certs, authHeaders } from '/imports/api/config.js';


//install NPM modules
var QRS = require('qrs');
var qrs = new QRS(config);
// var Promise = require("bluebird");


//STREAM FUNCTIONS
export function deleteStream(guid) {
    try {
        const result = HTTP.del('http://' + config.host + '/' + config.virtualProxy + '/qrs/stream/' + guid+'?xrfkey=' + config.xrfkey, {
            headers: authHeaders                       
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('Create stream failed', err.message);
    }
};

export function getStreams() {
    return qrs.get('/qrs/stream/full');
};


export function createStream(name) {
    console.log('QRS sync Functions Stream, create the stream with name', name);

    try {
        const result = HTTP.post('http://' + config.host + '/' + config.virtualProxy + '/qrs/stream', {
            headers: authHeaders,
            params: { 'xrfkey': config.xrfkey },
            data: { "name": name }
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('Create stream failed', err.message);
    }
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

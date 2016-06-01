import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import meteor collections
import { Streams } from '/imports/api/streams.js';
import { Customers } from '/imports/api/customers.js';

//import config for Qlik Sense QRS and Engine API
import { config, engineConfig, certs } from '/imports/api/config.js';


//insyall NPM modules
var fs = require('fs');
var qsocks = require('qsocks');
var QRS = require('qrs');
qrs = new QRS(config);
var Promise = require("bluebird");


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
    console.log('create the stream with name', name);
    return qrs.post('/qrs/stream', null, { "name": name })
        .then(
            function fulfilled(result) {
                // console.log('stream create promosi fulfilled, result of create stream promise', result);
                streamId = result.id;
                resolve('created stream with id ' + result.id);
            },
            function Rejected(error) {
                // console.error('Promise Rejected: Error when trying to copy the app', error);
                reject('Promise Rejected: Error when trying to create a stream');
            })
};

import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';


//install NPM modules
var QRS = require('qrs');
var qrs = new QRS(senseConfig);
// var Promise = require("bluebird");


//STREAM FUNCTIONS
export function deleteStream(guid) {
    try {
        const result = HTTP.del('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/stream/' + guid+'?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders                       
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('Create stream failed', err.message);
    }
};

export function getStreams() {    
    try {
        const result = HTTP.get('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/stream/full', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }            
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('getStreams failed', err.message);
    }
};


export function createStream(name) {
    console.log('QRS sync Functions Stream, create the stream with name', name);

    try {
        const result = HTTP.post('http://' + senseConfig.host + '/' + senseConfig.virtualProxy + '/qrs/stream', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { "name": name }
        })
        return result;
    } catch (err) {
        throw new Meteor.Error('Create stream failed', err.message);
    }
};

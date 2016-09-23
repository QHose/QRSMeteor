import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';

//STREAM FUNCTIONS
export function deleteStream(guid) {
    console.log('deleteStream: ', guid)
    try {
        const result = HTTP.del('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/' + guid+'?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders                       
        })
        const call = {};
        call.action = 'Delete stream'; 
        call.request = "HTTP.del('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/' + guid+'?xrfkey=' + senseConfig.xrfkey";
        call.response = result;
        REST_Log(call);        
        Meteor.call('updateLocalSenseCopy');
        return result;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Delete stream failed', err.message);
    }
};

export function getStreams() {    
    try {
        const call = {};
        call.action = 'Get list of streams'; 
        call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/full';
        // console.log('Try to get the stream from Sense at this url: ' , call.request);
        call.response = HTTP.get('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/full', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }            
        })        
        REST_Log(call);        
        return call.response.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getStreams failed', err.message);
    }
};


export function createStream(name) {
    console.log('QRS sync Functions Stream, create the stream with name', name);

    try {     
        const result = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { "name": name }
        })
        Meteor.call('updateLocalSenseCopy');
        //logging
        const call = {};
        call.action = 'Create stream'; 
        call.request = "HTTP.post('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream', { headers: "+authHeaders+ ", params: { 'xrfkey': "+senseConfig.xrfkey +"}, data: { name: " + name +"}})"; 
        call.response = result;
        REST_Log(call);        
        return call.response;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Create stream failed ', err.message);
    }
};

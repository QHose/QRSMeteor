import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';
import { gitHubLinks } from '/imports/ui/UIHelpers';

//import config for Qlik Sense QRS and Engine API
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';

<<<<<<< HEAD
//STREAM FUNCTIONS
=======
const qlikServer = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy;


//
// ─── CREATE STREAMS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────
//


export function initSenseStreams() {
    console.log('------------------------------------');
    console.log('Create initial streams');
    console.log('------------------------------------');

    for (const streamName of Meteor.settings.broker.qlikSense.StreamsToCreateAutomatically) {
        try {
            console.log('Try to create stream: ' + streamName + ' if it not already exists');
            if (!getStreamByName(streamName)) {
                createStream(streamName)
            }
        } catch (err) {
            console.log(err);
        }
    }
}

//
// ─── GENERIC STREAM FUNCTIONS ───────────────────────────────────────────────────
//


>>>>>>> simplify-settings-file
export function deleteStream(guid, generationUserId) {
    console.log('deleteStream: ', guid)
    try {
        const result = HTTP.del('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/' + guid+'?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders                       
        })
        const call = {};
        call.action = 'Delete stream'; 
        call.request = "HTTP.del('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/' + guid+'?xrfkey=' + senseConfig.xrfkey";
        call.response = result;
        REST_Log(call, generationUserId);        
        Meteor.call('updateLocalSenseCopy');
        return result;
    } catch (err) {
        // console.error(err);
        // throw new Meteor.Error('Delete stream failed', err.message);
    }
};

<<<<<<< HEAD
export function getStreams() {    
=======

//
// ─── GET STREAM BY NAME ────────────────────────────────────────────────────────────
//


export function getStreamByName(name) {
    try {
        var request = qrsSrv + "/qrs/stream/full?filter=Name eq '" + name + "'";
        console.log('getStreamByName request', request)
        var response = HTTP.get(request, {
            params: { xrfkey: senseConfig.xrfkey },
            npmRequestOptions: configCerticates,
            data: {}
        });

        return response.data[0];
    } catch (err) {
        console.error(err);
        throw Error('get streamByName failed', err.message);
    }
}

//
// ─── GET STREAMS ─────────────────────────────────────────────────────────────────
//


export function getStreams() {
>>>>>>> simplify-settings-file
    try {
        const call = {};
        call.action = 'Get list of streams'; 
        call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/full';
        // console.log('Try to get the stream from Sense at this url: ' , call.request);
        call.response = HTTP.get('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream/full', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }            
        })        
        // REST_Log(call);        
        return call.response.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getStreams failed', err.message);
    }
};


export function createStream(name, generationUserId) {
<<<<<<< HEAD
    // console.log('QRS sync Functions Stream, create the stream with name', name);

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
        call.url = gitHubLinks.createStream;
        call.request = "HTTP.post('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/stream', { headers: "+JSON.stringify(authHeaders)+ ", params: { 'xrfkey': "+senseConfig.xrfkey +"}, data: { name: " + name +"}}) --> USE OF HEADER AUTH ONLY FOR DEMO/REVERSE PROXY PURPOSES"; 
        call.response = result;
        REST_Log(call, generationUserId);        
=======
    console.log('QRS Functions Stream, create the stream with name', name);


    try {
        check(name, String);
        var response = qrs.post('/qrs/stream', null, { name: name });

        // Meteor.call('updateLocalSenseCopy');
        //logging
        const call = {
            action: 'Create stream',
            url: gitHubLinks.createStream,
            request: "HTTP.post(qlikServer + '/qrs/stream', { headers: " + JSON.stringify(authHeaders) + ", params: { 'xrfkey': " + senseConfig.xrfkey + "}, data: { name: " + name + "}}) --> USE OF HEADER AUTH ONLY FOR DEMO/REVERSE PROXY PURPOSES",
            response: response
        };

        REST_Log(call, generationUserId);
        console.log('Create stream call.response;', call.response)
>>>>>>> simplify-settings-file
        return call.response;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Create stream failed ', err.message);
    }
};

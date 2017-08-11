import { Meteor } from 'meteor/meteor';
import { http } from 'meteor/meteor';
import { Apps, TemplateApps } from '/imports/api/apps.js';
import { gitHubLinks } from '/imports/ui/UIHelpers';

// import config for Qlik Sense QRS and Engine API
import { senseConfig, authHeaders, qrsSrv, certicate_communication_options } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';

const qlikServer = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy;

//
// ─── CREATE STREAMS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────
//


export function initSenseStreams() {


    for (const streamName of Meteor.settings.public.StreamsToCreateAutomatically) {
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


export function deleteStream(guid, generationUserId) {
    console.log('deleteStream: ', guid);
    try {
        const result = HTTP.del(qlikServer + '/qrs/stream/' + guid + '?xrfkey=' + senseConfig.xrfkey, {
            headers: authHeaders
        })
        const call = {};
        call.action = 'Delete stream';
        call.request = "HTTP.del(" + qlikServer + '/qrs/stream/' + guid + '?xrfkey=' + senseConfig.xrfkey;
        call.response = result;
        REST_Log(call, generationUserId);
        Meteor.call('updateLocalSenseCopy');
        return result;
    } catch (err) {
        // console.error(err);
        // throw new Meteor.Error('Delete stream failed', err.message);
    }
};

export function getStreamByName(name) {
    try {
        var response = HTTP.get(qlikServer + "/qrs/stream/full?filter=Name eq '" + name + "'", {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey }
        })
        return response.data[0];
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('get template stream failed', err.message);
    }
}

export function getStreams() {
    try {
        const call = {};
        // call.action = 'Get list of streams';
        // call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/stream/full';
        // // console.log('Try to get the stream from Sense at this url: ' , call.request);
        // call.response = HTTP.get(qlikServer + '/qrs/stream/full', {
        //         headers: authHeaders,
        //         params: { 'xrfkey': senseConfig.xrfkey }
        //     })

        call.action = 'Get list of streams';
        call.request = qrsSrv + '/qrs/stream/full?xrfkey=' + senseConfig.xrfkey;
        console.log('call.request', call.request)
        call.response = HTTP.get(call.request, {
            'npmRequestOptions': certicate_communication_options,
        });
        // REST_Log(call);        
        return call.response.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getStreams failed', err.message);
    }
};


export function createStream(name, generationUserId) {
    console.log('QRS sync Functions Stream, create the stream with name', name);

    try {
        const result = HTTP.post(qlikServer + '/qrs/stream', {
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: { "name": name }
        })
        Meteor.call('updateLocalSenseCopy');
        //logging
        const call = {};
        call.action = 'Create stream';
        call.url = gitHubLinks.createStream;
        call.request = "HTTP.post(qlikServer + '/qrs/stream', { headers: " + JSON.stringify(authHeaders) + ", params: { 'xrfkey': " + senseConfig.xrfkey + "}, data: { name: " + name + "}}) --> USE OF HEADER AUTH ONLY FOR DEMO/REVERSE PROXY PURPOSES";
        call.response = result;
        REST_Log(call, generationUserId);
        return call.response;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Create stream failed ', err.message);
    }
};
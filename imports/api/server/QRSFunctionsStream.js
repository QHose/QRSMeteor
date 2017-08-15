import { Meteor } from 'meteor/meteor';
import { GeneratedResources } from '/imports/api/apps.js';
import { gitHubLinks } from '/imports/ui/UIHelpers';

// import config for Qlik Sense QRS and Engine API
import { senseConfig, authHeaders, qrsSrv, certicate_communication_options } from '/imports/api/config.js';
import { myQRS } from '/imports/api/server/QRSAPI';
import { REST_Log } from '/imports/api/APILogs';

const qlikServer = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy;

var qrs = new myQRS();

// var res = qrs.get('/qrs/stream/full');
var res = createStream('biesdd');
console.log('res', res)

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

        var request = qrsSrv + '/qrs/stream/' + guid;
        var response = HTTP.del(request, {
            'npmRequestOptions': certicate_communication_options,
        });

        // Logging
        const call = {};
        call.action = 'Delete stream';
        call.request = "HTTP.del(" + qlikServer + '/qrs/stream/' + guid + '?xrfkey=' + senseConfig.xrfkey;
        call.response = response;
        REST_Log(call, generationUserId);
        Meteor.call('updateLocalSenseCopy');
        return response;
    } catch (err) {
        // console.error(err);
        // throw new Meteor.Error('Delete stream failed', err.message);
    }
};


//
// ─── GET STREAM BY NAME ────────────────────────────────────────────────────────────
//


export function getStreamByName(name) {
    try {
        var request = qrsSrv + "/qrs/stream/full?filter=Name eq '" + name + "'";
        var response = HTTP.get(request, {
            params: { xrfkey: senseConfig.xrfkey },
            npmRequestOptions: certicate_communication_options,
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
    try {
        const call = {};
        call.action = 'Get list of streams';
        call.request = qrsSrv + '/qrs/stream/full';
        call.response = HTTP.get(call.request, {
            params: { xrfkey: senseConfig.xrfkey },
            npmRequestOptions: certicate_communication_options,
            data: {}
        });
        // REST_Log(call);        
        return call.response.data;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('getStreams failed', err.message);
    }
};

//
// ─── CREATE STREAM ──────────────────────────────────────────────────────────────
//


export function createStream(name, generationUserId) {
    console.log('QRS sync Functions Stream, create the stream with name', name);


    try {
        check(name, String);
        var response = qrs.post('/qrs/stream', { name: name });

        // Meteor.call('updateLocalSenseCopy');
        //logging
        const call = {
            action: 'Create stream',
            url: gitHubLinks.createStream,
            request: "HTTP.post(qlikServer + '/qrs/stream', { headers: " + JSON.stringify(authHeaders) + ", params: { 'xrfkey': " + senseConfig.xrfkey + "}, data: { name: " + name + "}}) --> USE OF HEADER AUTH ONLY FOR DEMO/REVERSE PROXY PURPOSES",
            response: response
        };

        REST_Log(call, generationUserId);
        return call.response;
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Create stream failed ', err.message);
    }
};


Meteor.methods({
    deleteStream(guid) {
        check(guid, String);
        //logging only
        const call = {};
        call.action = 'Delete stream';
        call.request = 'Delete stream: ' + guid;
        REST_Log(call);

        const id = deleteStream(guid, Meteor.userId());
        Meteor.call('updateLocalSenseCopy');
        return id;
    },
    createStream(name) {
        const streamId = createStream(name);
        Meteor.call('updateLocalSenseCopy');

        //store in the database that the user generated something, so we can later on remove it.
        GeneratedResources.insert({
            'generationUserId': Meteor.userId(),
            'customer': null,
            'streamId': streamId.data.id,
            'appId': null
        });
        return streamId;
    },
    getStreams() {
        return getStreams();
    }
});
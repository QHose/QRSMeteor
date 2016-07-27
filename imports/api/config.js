import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import _ from 'meteor/underscore';



//This is the config that we need to make available on the client (the webpage)
if (Meteor.isClient) {
    var _senseConfig = {
        "host": Meteor.settings.public.host,
        "port": Meteor.settings.public.port,
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "UDC": Meteor.settings.public.UDC,
        "webIntegrationDemoPort": Meteor.settings.public.webIntegrationDemoPort,
    };

}

if (Meteor.isServer) {
    console.log('This Sense SaaS demo tool uses this config as defined in the settings-XYZ.json file in the root folder: ', Meteor.settings.public);
    import crypto from 'crypto';
    import fs from 'fs';

    var _senseConfig = {
        "host": Meteor.settings.private.host,
        "SenseServerInternalLanIP": Meteor.settings.private.SenseServerInternalLanIP,
        "port": Meteor.settings.private.port,
        "useSSL": Meteor.settings.private.useSSL,
        "xrfkey": generateXrfkey(),
        "authentication": Meteor.settings.private.authentication,
        "virtualProxy": Meteor.settings.private.virtualProxy, //used to connect via REST to Sense, we authenticate via a http header. not for production!!!
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "headerKey": Meteor.settings.private.headerKey,
        "headerValue": Meteor.settings.private.headerValue,
        "isSecure": Meteor.settings.private.isSecure,
        "UDC": Meteor.settings.private.UDC
    };

    if (!_senseConfig.host) {
        throw new Meteor.Error('You have not started this meteor project with: meteor --settings settings-development.json ? You missed the reference to this settings file, or it is empty?');
    }

    //CONFIG FOR HTTP MODULE WITH HEADER AUTH (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS)
    export const authHeaders = {
        'hdr-usr': _senseConfig.headerValue,
        'X-Qlik-xrfkey': _senseConfig.xrfkey
    }

    export const _certs = {
        // server_key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server_key.pem'),
        // server_cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server.pem'),
        key: fs.readFileSync(Meteor.settings.private.certificatesDirectory+'/client_key.pem'),
        cert: fs.readFileSync(Meteor.settings.private.certificatesDirectory+'/client.pem'),
        // ca: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/root.pem')
    }

    export var certicate_communication_options = {
        rejectUnauthorized: false,
        hostname: _senseConfig.SenseServerInternalLanIP,
        headers: {
            'x-qlik-xrfkey': _senseConfig.xrfkey,
            'X-Qlik-User': Meteor.settings.private.engineHeaders,
            'Content-Type': 'application/json'
        },
        key: _certs.key,
        cert: _certs.cert
    };



    export const securityInfo = {
        'xrfkey': _senseConfig.xrfkey,
        'key': _certs.key,
        'cert': _certs.cert,
        'port': 4243,
    }

//used for QSocks, the engine API javascript wrapper
var _engineConfig = {
        host: _senseConfig.SenseServerInternalLanIP,
        isSecure: _senseConfig.isSecure,
        port: Meteor.settings.private.enginePort,
        headers: {
            'X-Qlik-User': Meteor.settings.private.engineHeaders,
        },
        key: _certs.key,
        cert: _certs.cert,        
        passphrase: Meteor.settings.private.passphrase,
        rejectUnauthorized: false, // Don't reject self-signed certs
        appname: null
    };
}

// console.log(' ############ _ heeft waarde', _);

function generateXrfkey() {
    return Random.hexString(16);
}

export const engineConfig = _engineConfig; //EngineConfig.findOne();
export const senseConfig = _senseConfig;

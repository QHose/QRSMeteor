import { Mongo } from 'meteor/mongo';


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
        "host": Meteor.settings.public.host,
        "SenseServerInternalLanIP": Meteor.settings.public.SenseServerInternalLanIP,
        "port": Meteor.settings.public.port,
        "useSSL": Meteor.settings.public.useSSL,
        "xrfkey": generateXrfkey(),
        "authentication": Meteor.settings.public.authentication,
        "virtualProxy": Meteor.settings.public.virtualProxy, //used to connect via REST to Sense, we authenticate via a http header. not for production!!!
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "headerKey": Meteor.settings.public.headerKey,
        "headerValue": Meteor.settings.public.headerValue,
        "isSecure": Meteor.settings.public.isSecure,
        "UDC": Meteor.settings.public.UDC
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
        key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client_key.pem'),
        cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client.pem'),
        // ca: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/root.pem')
    }

    export var certicate_communication_options = {
        rejectUnauthorized: false,
        hostname: _senseConfig.SenseServerInternalLanIP,
        headers: {
            'x-qlik-xrfkey': _senseConfig.xrfkey,
            'X-Qlik-User': Meteor.settings.public.engineHeaders,
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


    var _engineConfig = {
        host: _senseConfig.host,
        isSecure: _senseConfig.isSecure,
        port: Meteor.settings.public.enginePort,
        headers: {
            'X-Qlik-User': Meteor.settings.public.engineHeaders,
        },
        key: _certs.key,
        cert: _certs.cert,
        ca: _certs.ca,
        passphrase: Meteor.settings.public.passphrase,
        rejectUnauthorized: false // Don't reject self-signed certs
    };
}

function generateXrfkey(size, chars) {
    size = size || 16;
    chars = chars || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';

    var rnd = crypto.randomBytes(size),
        value = new Array(size),
        len = chars.length;

    for (var i = 0; i < size; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}

export const engineConfig = _engineConfig; //EngineConfig.findOne();
export const senseConfig = _senseConfig;

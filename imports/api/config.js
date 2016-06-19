import { Mongo } from 'meteor/mongo';

//config for QRS

var _senseConfig = {
        "host": Meteor.settings.public.host,
        "port": Meteor.settings.public.port,
        "useSSL": Meteor.settings.public.useSSL,
        "xrfkey": Meteor.settings.public.xrfkey,
        "authentication": Meteor.settings.public.authentication,
        "virtualProxy": Meteor.settings.public.virtualProxy, //used to connect via REST to Sense, we authenticate via a http header. not for production!!!
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "headerKey": Meteor.settings.public.headerKey,
        "headerValue": Meteor.settings.public.headerValue,
        "isSecure": Meteor.settings.public.isSecure,
        "UDC": Meteor.settings.public.UDC
    };

//CONFIG FOR HTTP MODULE (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS)
export const authHeaders = {
    'hdr-usr': _senseConfig.headerValue,
    'X-Qlik-xrfkey': _senseConfig.xrfkey
}

console.log('This Sense SaaS demo tool uses this config as defined in the settings-XYZ.json file in the root folder: ', Meteor.settings.public);

export const senseConfig = _senseConfig;

if (Meteor.isServer) {
    var fs = require('fs');
    var _certs = {
        // server_key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server_key.pem'),
        // server_cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server.pem'),
        // key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client_key.pem'),
        cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client.pem'),
        // ca: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/root.pem')
    }

    //@todo: this engine config works, so this one can be created by creating a new object and filling it with properties from senseConfig and cert values

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

export const engineConfig = _engineConfig; //EngineConfig.findOne();


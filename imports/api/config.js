import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import _ from 'meteor/underscore';
const _QIXSchema = require('/node_modules/enigma.js/schemas/qix/12.20.0/schema.json');
export var _SSBIApp = ''; //will be set automatically after meteor server has uploaded the apps into Sense. 
export var _IntegrationPresentationApp = '';

//This is the config that we need to make available on the client (the webpage)
if (Meteor.isClient) {
    var _senseConfig = {
        "host": Meteor.settings.public.host,
        "port": Meteor.settings.public.port,
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "webIntegrationDemoPort": Meteor.settings.public.webIntegrationDemoPort,
        "QIXSchema": _QIXSchema,
        "SSBIApp": _SSBIApp,
        "IntegrationPresentationApp": _IntegrationPresentationApp
    };
}


//SERVER SIDE
if (Meteor.isServer) {
    console.log('This Sense SaaS demo tool uses this config as defined in the settings-XYZ.json file in the root folder: ', Meteor.settings.private);
    import crypto from 'crypto';
    import fs from 'fs';
    import { myQRS } from '/imports/api/server/QRSAPI';
    const bluebird = require('bluebird');
    const WebSocket = require('ws');

    var _senseConfig = {
        "host": Meteor.settings.public.host,
        "SenseServerInternalLanIP": Meteor.settings.private.SenseServerInternalLanIP,
        "port": Meteor.settings.public.port,
        "useSSL": Meteor.settings.private.useSSL,
        "xrfkey": generateXrfkey(),
        "virtualProxy": Meteor.settings.private.virtualProxy, //used to connect via REST to Sense, we authenticate via a http header. not for production!!!
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "headerKey": Meteor.settings.private.headerKey,
        "headerValue": process.env.USERDOMAIN + '\\' + process.env.USERNAME, //"QLIK-AB0Q2URN5T\\Qlikexternal",
        "isSecure": Meteor.settings.private.isSecure,
        "qrsPort": Meteor.settings.private.qrsPort,
        "enginePort": Meteor.settings.private.enginePort
    };


    if (missingParameters(_senseConfig)) {
        throw 'Missing parameters in _senseConfig, you did not populate the settings.json file in the project root of MeteorQRS, or with docker: did you mount the volume with the config including the settings.json file? (with the correct name)';
    }

    if (!_senseConfig.host) {
        throw new Meteor.Error('You have not started this meteor project with: meteor --settings settings-development.json ? You missed the reference to this settings file, or it is empty?');
    }

    //CONFIG FOR HTTP MODULE WITH HEADER AUTH (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS)
    export const authHeaders = {
        'hdr-usr': _senseConfig.headerValue,
        'X-Qlik-xrfkey': _senseConfig.xrfkey
    }

    export const _certs = {
        ca: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/root.pem'),
        key: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client_key.pem'),
        cert: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client.pem'),
    }

    export var certicate_communication_options = {
        rejectUnauthorized: false,
        hostname: _senseConfig.SenseServerInternalLanIP,
        headers: {
            'x-qlik-xrfkey': _senseConfig.xrfkey,
            'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
            'Content-Type': 'application/json'
        },
        key: _certs.key,
        cert: _certs.cert,
        ca: _certs.ca
    };

    export function validateJSON(body) {
        try {
            var data = JSON.parse(body);
            // if came to here, then valid
            return data;
        } catch (e) {
            // failed to parse
            return null;
        }
    }

    //https://nodejs.org/api/http.html#http_http_request_options_callback
    // export var QRSCertConfig = {
    //     url: 'https://' + _senseConfig.SenseServerInternalLanIP,
    //     port: Meteor.settings.private.qrsPort, //4242,
    //     qrsPath: '/qrs/app',
    //     path: function() {
    //         if (qrsPath.includes('?')) {
    //             return qrsPath + '&xrfkey=abcdefghijklmnop'
    //         } else {
    //             return qrsPath + '?xrfkey=abcdefghijklmnop'
    //         }
    //     },
    //     method: 'GET',
    //     agentOptions: {
    //         ca: _certs.ca,
    //         key: _certs.key,
    //         cert: _certs.cert
    //     },
    //     headers: {
    //         'x-qlik-xrfkey': 'abcdefghijklmnop',
    //         'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
    //     }
    // };

    //used for engimaJS, the engine API javascript wrapper
    var _engineConfig = {
        host: _senseConfig.SenseServerInternalLanIP,
        isSecure: _senseConfig.isSecure,
        port: Meteor.settings.private.enginePort,
        headers: {
            'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
        },
        ca: _certs.ca,
        key: _certs.key,
        cert: _certs.cert,
        passphrase: Meteor.settings.private.passphrase,
        rejectUnauthorized: false, // Don't reject self-signed certs
        appname: null,
        QIXSchema: _QIXSchema
    };

    export const enigmaServerConfig = {
        schema: _engineConfig.QIXSchema,
        // appId: appId,
        session: {
            host: _engineConfig.host,
            port: _engineConfig.port,
        },
        Promise: bluebird,
        createSocket(url) {
            return new WebSocket(url, {
                ca: _certs.ca,
                key: _certs.key,
                cert: _certs.cert,
                headers: {
                    'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
                },
            });
        },
        // handleLog: logRow => console.log(JSON.stringify(logRow)),
    }

    //for enigma.js
    export const engineConfig = _engineConfig;
    //for general (mostly client side) stuff

    // Qlik sense QRS endpoint via header authentication
    export const qlikHDRServer = 'http://' + _senseConfig.SenseServerInternalLanIP + ':' + _senseConfig.port + '/' + _senseConfig.virtualProxy;
    export const qrsSrv = 'https://' + _senseConfig.SenseServerInternalLanIP + ':' + _senseConfig.qrsPort;

    export const qrs = new myQRS();

    function generateXrfkey() {
        return Random.hexString(16);
    }

    // //https://www.npmjs.com/package/qrs
    //HEADER AUTHENTICATION
    export const QRSconfig = {
        authentication: 'header',
        host: _senseConfig.host,
        port: _senseConfig.port,
        useSSL: false,
        virtualProxy: _senseConfig.virtualProxy, //header proxy
        headerKey: _senseConfig.headerKey,
        headerValue: _senseConfig.headerValue, //'mydomain\\justme'
    };

}

export const senseConfig = _senseConfig;

// console.log('--- HEADER AUTHENTICATION using config: ', QRSconfig);

// //certificates did not work
// export const QRSconfig = {
//     authentication: 'certificates',
//     host: senseConfig.host,
//     useSSL: false,
//     ca: _engineConfig.ca,
//     key: _engineConfig.key,
//     cert: _engineConfig.cert,
//     port: Meteor.settings.private.qrsPort, //4242
//     headerKey: 'X-Qlik-User',
//     headerValue: `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`
// };

export function missingParameters(obj) {
    for (var key in obj) {
        if (obj[key] !== null && obj[key] != "")
            return false;
    }
    return true;
}
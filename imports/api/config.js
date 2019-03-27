import {
    Mongo
} from 'meteor/mongo';
import {
    Random
} from 'meteor/random';
import _ from 'meteor/underscore';
const _QIXSchema = require('/node_modules/enigma.js/schemas/qix/12.20.0/schema.json');

//This is the config that we need to make available on the client (the webpage)
if (Meteor.isClient) {
    var _senseConfig = {
        "host": Meteor.settings.public.qlikSenseHost,
        "port": Meteor.settings.public.qlikSensePort,
        "useSSL": Meteor.settings.public.useSSL,
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
        "virtualProxySlideGenerator": Meteor.settings.public.slideGenerator.virtualProxy,
        "webIntegrationDemoPort": Meteor.settings.public.webIntegrationDemoPort,
        "QIXSchema": _QIXSchema,
        //ssbi and slide generator app id are set automatically on main.js (client side, via a call to the server)
        // config.SSBIAppId = 
        // config.slideGeneratorAppId = 
    };
}


//SERVER SIDE
if (Meteor.isServer) {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    import sslRootCas from 'ssl-root-cas/latest';
    sslRootCas.inject();
    
    console.log('This tool uses this config as defined in the settings-XYZ.json file in the root folder: ', Meteor.settings);
    import crypto from 'crypto';
    var fs = require('fs-extra');
    const path = require('path');
    var os = require('os');
    // import fs from 'fs';
    import {
        myQRS
    } from '/imports/api/server/QRSAPI';
    const bluebird = require('bluebird');
    const WebSocket = require('ws');

    if (!Meteor.settings.public.qlikSenseHost) {
        Meteor.settings.public.qlikSenseHost = os.hostname();
    }
    if (!Meteor.settings.public.SenseServerInternalLanIP) {
        Meteor.settings.public.SenseServerInternalLanIP = os.hostname();
    }
    if (!Meteor.settings.public.webIntegrationHost) {
        Meteor.settings.public.webIntegrationHost = os.hostname();
    }

    var _senseConfig = {
        "host": Meteor.settings.public.qlikSenseHost,
        "SenseServerInternalLanIP": Meteor.settings.public.SenseServerInternalLanIP,
        "port": Meteor.settings.public.qlikSensePort,
        "useSSL": Meteor.settings.public.useSSL,
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
        throw new Meteor.Error('Missing parameters in _senseConfig, you did not populate the settings.json file in the project root of MeteorQRS, or with docker: did you mount the volume with the config including the settings.json file? (with the correct name)');
    }

    if (!_senseConfig.host) {
        throw new Meteor.Error('You have not started this meteor project with: meteor --settings settings-development.json ? You missed the reference to this settings file, or it is empty?');
    }

    //CONFIG FOR HTTP MODULE WITH HEADER AUTH (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS).
    export const authHeaders = {
            'hdr-usr': _senseConfig.headerValue,
            'X-Qlik-xrfkey': _senseConfig.xrfkey
        } //
    if (!Meteor.settings.private.certificatesDirectory) {
        Meteor.settings.private.certificatesDirectory = 'C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates';
        console.log('Meteor.settings.private.certificatesDirectory was empty, setting it to default: ', Meteor.settings.private.certificatesDirectory)
    }

    try {
        export const _certs = {
            ca: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/root.pem'),
            key: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client_key.pem'),
            cert: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client.pem'),
        }

        //if you use windows and this tool runs on the same machine, you can keep the parameters empty
        // and we use the user the node service runs under... .
        var qlikUserDomain = '';
        var qlikUser = '';

        if (!Meteor.settings.broker.qlikSense.connectToSenseAsUserDirectory) {
            qlikUserDomain = process.env.USERDOMAIN;
            qlikUser = process.env.USERNAME;
        } else {
            qlikUserDomain = Meteor.settings.broker.qlikSense.connectToSenseAsUserDirectory;
            qlikUser = Meteor.settings.broker.qlikSense.connectToSenseAsUser
        }

        export var configCerticates = {
            rejectUnauthorized: false,
            hostname: _senseConfig.SenseServerInternalLanIP,
            headers: {
                'x-qlik-xrfkey': _senseConfig.xrfkey,
                'X-Qlik-User': `UserDirectory=${qlikUserDomain};UserId=${qlikUser}`, //`UserDirectory=INTERNAL;UserId=sa_repository` you need to give this user extra roles before this works
                'Content-Type': 'application/json'
            },
            key: _certs.key,
            cert: _certs.cert,
            ca: _certs.ca
        };
        console.log('configCerticates: we connect to Qlik Sense via certificates using these credentials: ', configCerticates);

        //used for engimaJS, the engine API javascript wrapper
        var _engineConfig = {
            host: _senseConfig.SenseServerInternalLanIP,
            isSecure: _senseConfig.isSecure,
            port: Meteor.settings.private.enginePort,
            headers: {
                'X-Qlik-User': `UserDirectory=${qlikUserDomain};UserId=${qlikUser}`,
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
                        'X-Qlik-User': `UserDirectory=${qlikUserDomain};UserId=${qlikUser}`,
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
    } catch (error) {
        console.warn('Make sure you run the "QRS START.BAT" as administrator? Please note that Qlik Sense is not installed, or certificate directory wrong in the settings.json file.');
        // throw new Meteor.Error(500, 'We can not connect to Sense yet: Because we can not find the Sense certificates yet in the ' + Meteor.settings.private.certificatesDirectory + '. This can happen if Sense has not yet been installed....');

    } //END CODE THAT NEEDS CERTIFICATES

    function generateXrfkey() {
        return Random.hexString(16);
    }

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

    try {
        Meteor.startup(async function() {
            console.log('------------------------------------');
            console.log('Validate settings.json parameters');
            console.log('------------------------------------');
            Meteor.absolutePath = path.resolve('.').split(path.sep + '.meteor')[0];
            console.log('Meteor tries to find the settings-development-example.json file in Meteor.absolutePath:', Meteor.absolutePath)
            var file = path.join(Meteor.absolutePath, 'settings-development-example.json');			

            // READ THE FILE 
            try {
                var exampleSettingsFile = await fs.readJson(file);                
				console.log('TCL: exampleSettingsFile', exampleSettingsFile)
            } catch (error) {
                throw new Error('Meteor can not find your example settings file: ' + file);
            }

            // VALIDATE JSON OF SETTINGS FILE AGAINST EXAMPLE SETTINGS FILE
            try {
                validateJSON(exampleSettingsFile)
            } catch (err) {
                console.log(err);
                throw new Error('Meteor wants to check your settings.json with the parameters in the example settings.json in the project root. Error: Cant read the example settings definitions file (not valid JSON): ' + file, err);
            }

            var keysEqual = compareKeys(Meteor.settings, exampleSettingsFile);
            console.log('Settings file has all the keys as specified in the example json file?', keysEqual)
            if (!keysEqual) {
                throw new Error('Settings.json file does not have all keys as defined in the settings-development-example.json (in your project root), Please verify if you have all the keys as specified in the settings-development-example.json in the project root folder. In my dev environment: C:\\Users\\Qlikexternal\\Documents\\GitHub\\QRSMeteor');
            }
        })

    } catch (error) {
        throw new Error(error);
    }
} //exit server side config

export const senseConfig = _senseConfig;

export function missingParameters(obj) {
    for (var key in obj) {
        if (obj[key] !== null && obj[key] != "")
            return false;
    }
    return true;
}

function hasSameProps(obj1, obj2) {
    return Object.keys(obj1).every(function(prop) {
        return obj2.hasOwnProperty(prop);
    });
}

function compareKeys(...objects) {
    const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
    const union = new Set(allKeys);
    return objects.every(object => union.size === Object.keys(object).length);
}
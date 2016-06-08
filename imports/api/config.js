import { Mongo } from 'meteor/mongo';

//SETUP NPM QRS MODULE 
export const QRSConfig = new Mongo.Collection('QRSConfig');
//config for QRS

var _senseConfig = {
        "host": '2008ENT',
        "useSSL": false,
        "xrfkey": 'ABCDEFG123456789',
        "authentication": "header",
        "virtualProxy": "hdr",
        "headerKey": 'hdr-usr',
        "headerValue": '2008ENT\\Qlik',
        isSecure: true
    };

if (QRSConfig.find()
    .count() === 0) {    
    QRSConfig.insert(_senseConfig);
    console.log("Inserted config for NPM module NPM QRS: " + _senseConfig);
}

export const senseConfig = QRSConfig.findOne({});

//config for the ENGINE API WITH QSOCKS
export const EngineConfig = new Mongo.Collection('engineConfig');
export const CertsConfig = new Mongo.Collection('certsConfig');

//SSL CERTIFICATES CONFIG
/**
 * Location for Qlik Sense certs.
 * No need to change on a standard Qlik Sense installation
 */


//Attach a database schema so we can auto create insert and update forms in the front end, and can validate the input
QRSConfig.attachSchema(new SimpleSchema({
    host: {
        type: String,
        label: "Host where Sense runs (ensure you have also put this name in the proxy whitelist",
    },
    useSSL: {
        type: Boolean,
        label: "Use HTTPS to connect to Sense?"
    },
    port: {
        type: Number,
        label: "Port to connect to the virtualProxy of Sense, see virtualProxy QMC settings for this"
    },
    xrfkey: {
        type: String,
        label: "XRFKEY: For demo purpose only: This key should be in the Request header and parameters"
    },
    authentication: {
        type: String,
        label: "authentication"
    },
    virtualProxy: {
        type: String,
        label: "virtualProxy"
    },
    headerKey: {
        type: String,
        label: "headerKey"
    },    
     
    isSecure: {
        type: Boolean,
        label: "isSecure"
    }
}));


if (Meteor.isServer) {
    var fs = require('fs');
    /**
     * Connects directly to the QIX Engine, bypassing the Qlik Sense Proxy.
     * This method of connecting requires access to the Qlik Sense Certificates in PFX format and uses a service account.
     */
    var _certs = {
        server_key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server_key.pem'),
        server_cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server.pem'),
        key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client_key.pem'),
        cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client.pem'),
        ca: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/root.pem')
    }

    //@todo: this engine config works, so this one can be created by creating a new object and filling it with properties from senseConfig and cert values
    var _engineConfig = {
        host: senseConfig.host,
        isSecure: senseConfig.isSecure,
        port: '4747',
        headers: {
            'X-Qlik-User': 'UserDirectory=2008ENT;UserId=Qlik'
        },
        key: _certs.key,
        cert: _certs.cert,
        ca: _certs.ca,
        passphrase: null,
        rejectUnauthorized: false // Don't reject self-signed certs
    };

    if (EngineConfig.find()
        .count() === 0) {
        EngineConfig.insert(_engineConfig);
        console.log("Inserted config for NPM module QSOCKS: ", _engineConfig);
        CertsConfig.insert(_certs);
    }
}


export const engineConfig = _engineConfig; //EngineConfig.findOne();


//CONFIG FOR HTTP MODULE (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS)

export const authHeaders = {
    'hdr-usr': senseConfig.headerValue,
    'X-Qlik-xrfkey': senseConfig.xrfkey
}


export const certs = CertsConfig.findOne({});

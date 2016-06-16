import { Mongo } from 'meteor/mongo';

//SETUP NPM QRS MODULE 
export const QRSConfig = new Mongo.Collection('QRSConfig');
export const EngineConfig = new Mongo.Collection('engineConfig');
//config for QRS

var _senseConfig = {
        "host": Meteor.settings.host,
        "port":Meteor.settings.port,
        "useSSL": Meteor.settings.useSSL,
        "xrfkey": Meteor.settings.xrfkey,
        "authentication": Meteor.settings.authentication,
        "virtualProxy": Meteor.settings.virtualProxy, //used to connect via REST to Sense, we authenticate via a http header. not for production!!!
        "virtualProxyClientUsage": Meteor.settings.virtualProxyClientUsage,
        "headerKey": Meteor.settings.headerKey,
        "headerValue": Meteor.settings.headerValue,
        "isSecure": Meteor.settings.isSecure,
    };

//CONFIG FOR HTTP MODULE (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS)
export const authHeaders = {
    'hdr-usr': _senseConfig.headerValue,
    'X-Qlik-xrfkey': _senseConfig.xrfkey
}


if (Meteor.isServer) {
    QRSConfig.remove({});
    QRSConfig.insert(_senseConfig);
    console.log("Inserted config to connect to Sense via HTTP REST calls: ");
    console.log(_senseConfig);
}

export const senseConfig = _senseConfig;

//Attach a database schema so we can auto create insert and update forms in the front end, and can validate the input
QRSConfig.attachSchema(new SimpleSchema({
    host: {
        type: String,
        label: "Host where Sense runs (ensure you have also put this name in the proxy whitelist)",
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
    headerValue: {
        type: String,
        label: "Format: UDC\\user, enter the user that will execute the REST calls on the Sense server. Ensure the user has rootAdmin role and a license."
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
      //Get and verify parameters from qlik auth
        options.Certificate = options.Certificate || 'client.pem';
        options.CertificateKey = options.CertificateKey || 'client_key.pem';
        options.PassPhrase = options.PassPhrase || '';
     */
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
        port: Meteor.settings.enginePort,
        headers: {
            'X-Qlik-User': Meteor.settings.engineHeaders,
        },
        key: _certs.key,
        cert: _certs.cert,
        ca: _certs.ca,
        passphrase: Meteor.settings.passphrase,
        rejectUnauthorized: false // Don't reject self-signed certs
    };    
}


export const engineConfig = _engineConfig; //EngineConfig.findOne();


import { Mongo } from 'meteor/mongo';
var fs = require('fs');

export const Config = new Mongo.Collection('config');

/**
 * Location for Qlik Sense certs.
 * No need to change on a standard Qlik Sense installation
 */

var _certs;


_certs = {
    server_key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server_key.pem'),
    server_cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/server.pem'),
    key: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client_key.pem'),
    cert: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/client.pem'),
    ca: fs.readFileSync('C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/root.pem')
}

//config for QRS
var _QRSconfig = {
    "host": '2008ENT',
    "useSSL": false,
    "xrfkey": 'ABCDEFG123456789',
    "authentication": "header",
    "virtualProxy": "hdr",
    "headerKey": 'hdr-usr',
    "headerValue": '2008ENT\\Qlik',
    isSecure: true
};

//config for QSOCKS
var _engineConfig = {
    host: _QRSconfig.host,
    isSecure: _QRSconfig.isSecure,
    port: '4747',
    headers: {
        'X-Qlik-User': 'UserDirectory=2008ENT;UserId=Qlik'
    },
    key: _certs.key,
    cert: _certs.cert,
    ca: _certs.ca
};

if (Config.find()
    .count() === 0) {

    Config.insert({
        name: 'QRSConfig',
        config: _QRSconfig
    });
    console.log("Inserted config for NPM module QRS: " + _QRSconfig);

    Config.insert({
        name: 'engineConfig',
        config: _engineConfig
    });
    console.log("Inserted config for NPM module QSOCKS: " + _engineConfig);

    Config.insert({
        name: 'certs',
        config: certs
    });
    console.log("Inserted config for NPM module QRS: " + _QRSconfig);
}


// console.log('engineConfig from database is ', Config.findOne({name: 'engineConfig'}));
export const engineConfig = _engineConfig;
// export const config = Config.findOne({name: 'QRSConfig'}).config
export const config = _QRSconfig;
export const certs = certs;

export const authHeaders = {
    'hdr-usr': config.headerValue,
    'X-Qlik-xrfkey': config.xrfkey
}


// export const config = Config.findOne({''})

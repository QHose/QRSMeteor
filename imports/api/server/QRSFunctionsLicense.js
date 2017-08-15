import { Meteor } from 'meteor/meteor';
import { myQRS } from '/imports/api/server/QRSAPI';


//
// ─── IMPORT CONFIG FOR QLIK SENSE QRS AND ENGINE API ────────────────────────────
//


import {
    qlikHDRServer, // Qlik sense QRS endpoint via header authentication
    senseConfig,
    enigmaServerConfig,
    authHeaders,
    qrsSrv,
    QRSconfig,
    _SSBIApp,
    certicate_communication_options,
    _IntegrationPresentationApp
} from '/imports/api/config.js';

//
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────
//

const fs = require('fs-extra');
const path = require('path');
const enigma = require('enigma.js');
var QRS = require('qrs');
var promise = require('bluebird');
var request = require('request');

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-License-Add.htm

var qrs = new myQRS();
insertLicense();

export function getLicense() {
    return qrs.get('/qrs/license');

}

export function insertLicense() {
    if (!getLicense()) {
        var lic = Meteor.settings.private.license;
        var response = qrs.post('/qrs/license', lic, { control: Meteor.settings.private.LicenseControlNumber });
    } else {
        throw Error('You are trying to insert a license while the Qlik Sense is already licensed, please remove the existing one in the QMC');
    }
}

export function updateLicense() {

}
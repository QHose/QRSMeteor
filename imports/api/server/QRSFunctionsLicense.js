import { Meteor } from 'meteor/meteor';
import { myQRS } from '/imports/api/server/QRSAPI';


//
// ─── IMPORT CONFIG FOR QLIK SENSE QRS AND ENGINE API ────────────────────────────
//


import {
    qlikHDRServer, // Qlik sense QRS endpoint via header authentication
    senseConfig
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
// getLicense();

export function getLicense() {
    var lic = qrs.get('/qrs/license');
    console.log('lic', lic)
    return lic;

}

export function insertLicense() {
    var existingLicense = qrs.get('/qrs/license');
    var newLicense = Meteor.settings.private.license;

    try {
        console.log('Update the existing license');
        newLicense.id = existingLicense.id;
        var response = qrs.del('/qrs/license/' + existingLicense.id);
        // var response = qrs.put('/qrs/license/' + newLicense.id, newLicense, { control: Meteor.settings.private.LicenseControlNumber });
        // console.error('Stop license insertion, license for ' + lic.organization + ' is already included: ', lic.serial);
        // throw Error('You are trying to insert a license while the Qlik Sense is already licensed, please remove the existing one in the QMC');
    } catch (err) {
        // lic did not already exist
    }
    var response = qrs.post('/qrs/license', newLicense, { control: Meteor.settings.private.LicenseControlNumber });

}
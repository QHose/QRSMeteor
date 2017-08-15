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


var qrs = new myQRS();


export async function uploadExtensions() {
    console.log('--------------------------UPLOAD EXTENSIONS');
    // LOAD ALL EXTENSIONS IN FOLDER
    var extensionsFolder = '';
    try {
        extensionsFolder = path.join(Meteor.settings.private.automationBaseFolder, 'extensions');
        console.log('extensionsFolder', extensionsFolder)
        var extensions = await fs.readdir(extensionsFolder);
    } catch (err) {
        throw error('error loading all extensions in folder.', err);
    }

    // FOR EACH EXTENSION FOUND, UPLOAD IT    
    await Promise.all(extensions.map(async(extension) => {
        console.log('Current extension', extension)
        try {
            //CREATE A FILEPATH          
            var filePath = path.join(extensionsFolder, extension);

            //UPLOAD THE APP, GET THE APP ID BACK
            var result = await uploadExtension('', filePath);
        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Unable to upload the app to Qlik Sense. ', err)
        }
    }))

}


async function uploadExtension(password, filePath) {

    console.log('uploadApp: try to upload extension from path: ' + filePath);
    var formData = {
        my_file: fs.createReadStream(filePath)
    };

    // qrs.post('/qrs/extension/upload?pwd=' + password, data)
    return await new Promise(function(resolve, reject) {

        request.post({
            url: qlikHDRServer + '/qrs/extension/upload?&xrfkey=' + senseConfig.xrfkey, //removed password parameter, assume blank
            headers: {
                'hdr-usr': senseConfig.headerValue,
                'X-Qlik-xrfkey': senseConfig.xrfkey
            },
            formData: formData
        }, function(error, res, body) {
            if (!error) {
                try {
                    var id = JSON.parse(body).id;
                    console.log('Uploaded "' + path.basename(filePath) + ' to Qlik Sense and got id: ' + id); //
                } catch (err) {
                    console.log('Qlik Sense reported: ', body)
                }

                resolve();
            } else {
                reject(error);
            }
        });
    });

}
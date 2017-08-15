import { Meteor } from 'meteor/meteor';
import { myQRS } from '/imports/api/server/QRSAPI';
//
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────
//

const fs = require('fs-extra');
const enigma = require('enigma.js');
var QRS = require('qrs');
var promise = require('bluebird');
var request = require('request');


var qrs = new myQRS();


export async function uploadExtensions() {
    // LOAD ALL EXTENSIONS IN FOLDER
    var extensionsInFolder = await fs.readdir(newFolder);

}


export function uploadExtension(password, data) {
    qrs.post('/qrs/extension/upload?pwd=' + password, data)
}
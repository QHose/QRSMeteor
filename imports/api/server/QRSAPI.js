import {
    Meteor,
} from 'meteor/meteor';
import {
    http,
} from 'meteor/meteor';

//
// ─── IMPORT CONFIG FOR QLIK SENSE QRS ───────────────────────────────────────────
//


import { certicate_communication_options, senseConfig, authHeaders, qrsSrv } from '/imports/api/config';

//
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────
//

// const fs = require('fs-extra');
// var QRS = require('qrs');
// var promise = require('bluebird');
// var request = require('request');

var myQRS = function myQRS() {
    this.get = function(path, params, data) {
        var newPath = checkPath(path);

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);

        var request = qrsSrv + path;
        var response = http.post(request, {
            npmRequestOptions: certicate_communication_options,
            params: newParams,
            data: {},
        });
    };

    this.post = function(path) {};
};

function checkPath(path) {
    try {
        check(path, String);
    } catch (err) { throw Error("Rootpath for QRS API can't be created, settings.json correct?") }

    return qrsSrv + path;
}
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

export var myQRS = function myQRSMain() {

    this.get = function(path, params = {}, data = {}) {
        var endpoint = checkPath(path);
        console.log('endpoint', endpoint)

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        console.log('nelicwParams', newParams)
        try {
            var response = HTTP.get(endpoint, {
                npmRequestOptions: certicate_communication_options,
                params: newParams,
                data: {},
            });
            return response.data;
        } catch (err) {
            console.error('HTTP GET FAILED FOR ' + endpoint, err);
        }
    };

    this.post = function(path, data = {}, params = {}) {
        var endpoint = checkPath(path);
        console.log('endpoint', endpoint)
        console.log('data', data)

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        console.log('newParams', newParams)
        try {
            var response = HTTP.post(endpoint, {
                npmRequestOptions: certicate_communication_options,
                params: newParams,
                data: data,
            });
            console.log('response', response)
            return response.data;
        } catch (err) {
            console.error('HTTP POST FAILED FOR ' + endpoint, err);
        }
    };
};

function checkPath(path) {
    try {
        check(path, String);
    } catch (err) { throw Error("Rootpath for QRS API can't be created, settings.json correct?") }

    return qrsSrv + path;
}

// module.exports = myQRS;
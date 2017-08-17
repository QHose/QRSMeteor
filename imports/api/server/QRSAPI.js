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

    this.get = function get(path, params = {}, data = {}) {
        var endpoint = checkPath(path);
        console.log('QRS module received get request for endpoint', endpoint);

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        try {
            var response = HTTP.get(endpoint, {
                npmRequestOptions: certicate_communication_options,
                params: newParams,
                data: {},
            });
            return response.data;
        } catch (err) {
            var error = 'HTTP GET FAILED FOR ' + endpoint;
            console.error(error);
            throw new Meteor.Error(500, error);
        }
    };

    this.post = function post(path, data = {}, params = {}) {
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

    this.del = function del(path, data = {}, params = {}) {
        var endpoint = checkPath(path);
        console.log('endpoint', endpoint)
        console.log('data', data)

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        console.log('newParams', newParams)
        try {
            var response = HTTP.del(endpoint, {
                npmRequestOptions: certicate_communication_options,
                params: newParams,
                data: data,
            });
            console.log('response', response)
            return response.data;
        } catch (err) {
            console.error('HTTP DEL FAILED FOR ' + endpoint, err);
        }
    };

    this.put = function put(path, data = {}, params = {}) {
        var endpoint = checkPath(path);
        console.log('endpoint', endpoint)
        console.log('data', data)

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        console.log('newParams', newParams)
        try {
            var response = HTTP.put(endpoint, {
                npmRequestOptions: certicate_communication_options,
                params: newParams,
                data: data,
            });
            console.log('response', response)
            return response.data;
        } catch (err) {
            console.error('HTTP PUT FAILED FOR ' + endpoint, err);
        }
    };

};

function checkPath(path) {
    try {
        check(path, String);
    } catch (err) { throw Error("Rootpath: " + path + " for QRS API can't be created, settings.json correct?") }

    return qrsSrv + path;
}

// module.exports = myQRS;
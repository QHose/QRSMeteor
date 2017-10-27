import {
    Meteor,
} from 'meteor/meteor';
import {
    http,
} from 'meteor/meteor';

import { configCerticates, senseConfig, authHeaders, qrsSrv } from '/imports/api/config';

export var myQRS = function myQRSMain() {

    this.get = function get(path, params = {}, data = {}) {
        var endpoint = checkPath(path);
        console.log('QRS module received GET request for endpoint', endpoint);

        // copy the params to one object
        var newParams = Object.assign({ xrfkey: senseConfig.xrfkey }, params);
        try {
            var response = HTTP.get(endpoint, {
                npmRequestOptions: configCerticates,
                params: newParams,
                data: {},
            });
            return response.data;
        } catch (err) {
            var error = 'QRS HTTP GET FAILED FOR ' + endpoint;
            console.error(err);
            throw new Meteor.Error(500, 'This node server can not connect to Qlik Sense. Sometimes you have to wait 10 minutes after restarting... ' + error);
        }
    };

    this.post = function post(path, params = {}, data = {}) {
        var endpoint = checkPath(path);

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        try {
            var response = HTTP.post(endpoint, {
                npmRequestOptions: configCerticates,
                params: newParams,
                data: data,
            });
            return response.data;
        } catch (err) {
            console.error('HTTP POST FAILED FOR ' + endpoint, err);
        }
    };

    this.del = function del(path, params = {}, data = {}) {
        var endpoint = checkPath(path);
        console.log('endpoint', endpoint)
        console.log('data', data)

        // copy the params to one object.
        var newParams = Object.assign({ xrfkey: senseConfig.xrfkey }, params);
        try {
            var response = HTTP.del(endpoint, {
                npmRequestOptions: configCerticates,
                params: newParams,
                data: data,
            });
            // console.log('response', response)
            return response.data;
        } catch (err) {
            console.error('QRS HTTP DEL FAILED FOR ' + endpoint, err);
        }
    };

    this.put = function put(path, params = {}, data = {}) {
        var endpoint = checkPath(path);

        // copy the params to one object
        var newParams = Object.assign({ 'xrfkey': senseConfig.xrfkey }, params);
        try {
            var response = HTTP.put(endpoint, {
                npmRequestOptions: configCerticates,
                params: newParams,
                data: data,
            });
            return response.data;
        } catch (err) {
            console.error('HTTP PUT FAILED FOR ' + endpoint, err);
        }
    };

};

function checkPath(path) {
    try {
        check(path, String);
    } catch (err) {
        throw Error("QRS module can use path: " + path + " for the QRS API, settings.json correct?")
    }
    return qrsSrv + path;
}
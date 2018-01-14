import {
    Meteor,
} from 'meteor/meteor';
import {
    http,
} from 'meteor/meteor';

import {
    configCerticates,
    senseConfig,
    authHeaders,
    qrsSrv
} from '/imports/api/config';

export var myQRS = function myQRSMain() {

    this.get = function get(path, params = {}, data = {}) {
        var endpoint = checkPath(path);
        console.log('QRS module received GET request for endpoint', endpoint);

        // copy the params to one object
        var newParams = Object.assign({
            xrfkey: senseConfig.xrfkey
        }, params);
        try {
            var response = HTTP.get(endpoint, {
                npmRequestOptions: configCerticates,
                params: newParams,
                data: {},
            });

            try {
                console.log('QRS GET result: response.data length: ', response.data.length);
                 return response.data;
            } catch (error) {
                console.log('------------------------------------');
                console.error('We did not get any data back from Qlik Sense (empty array). If you do not expect this, make sure you check the udc, username in the settings file.');
                console.log('------------------------------------');
            }           
        } catch (err) {
            var error = 'QRS HTTP GET FAILED FOR ' + endpoint;
            console.error(err);
            throw new Meteor.Error(500, 'This node server can not connect to Qlik Sense. Sometimes you have to wait 10 minutes after restarting... ' + error);
        }
    };

    this.post = function post(path, params = {}, data = {}) {
        var endpoint = checkPath(path);

        // copy the params to one object
        var newParams = Object.assign({
            'xrfkey': senseConfig.xrfkey
        }, params);
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
        var newParams = Object.assign({
            xrfkey: senseConfig.xrfkey
        }, params);
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
        var newParams = Object.assign({
            'xrfkey': senseConfig.xrfkey
        }, params);
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
    console.log('checkPath: path', path);
    console.log('checkPath: qrsSrv', qrsSrv);

    try {
        check(path, String);
        check(qrsSrv, String);
    } catch (err) {
        throw Error("QRS module can not use an empty server: " + qrsSrv + " or path: " + path + " for the QRS API, settings.json correct?")
    }
    return qrsSrv + path;
}
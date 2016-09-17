import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';
import { REST_Log } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, _certs, authHeadersCertificate, certicate_communication_options } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;
var url = require('url');
var fs = require('fs');
var http = require('http');
var https = require('https');
var crypto = require('crypto');
var util = require('util');
import { Random } from 'meteor/random';
var urljoin = require('url-join');
var _ = require("underscore");



/*
When communicating with the QPS APIs, the URL is as follows:
https://<QPS machine name>:4243/<path>

Each proxy has its own session cookie, so you have to logout the users per proxy used.
*/

export function logoutUser(name) {
    console.log('******** QPS Functions: logout the current: ' + name + ' on proxy: ' + senseConfig.virtualProxyClientUsage);

    if (name) {
        console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: '); //, certicate_communication_options);
        console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name);
        try {
            const call = {};
            call.action = 'logout user: ' + name;
            call.request = 'https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey
            call.response = HTTP.call('DELETE', call.request, { 'npmRequestOptions': certicate_communication_options })

            REST_Log(call);
            // console.log('The HTTP REQUEST to Sense QPS API:', call.request);
            // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);

        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Logout user failed', err.message);
        }
    }
};


export function getRedirectURL(passport, proxyRestUri, targetId) {
    var options = {
                'Certificate': _certs.cert, //'C:/Users/Qlik/Meteor projects/qlikauth-meteor/node_modules/qlik-auth/client.pfx',
                'CertificateKey': _certs.key,
                'PassPhrase': ''
            }

    console.log('entered server side requestTicket module');
    //see https://help.qlik.com/en-US/sense-developer/3.0/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm

    
    //Get and verify parameters
    options.Certificate = options.Certificate || 'client.pem';
    options.CertificateKey = options.CertificateKey || 'client_key.pem';
    options.PassPhrase = options.PassPhrase || '';
    options.ProxyRestUri = proxyRestUri; 
    options.TargetId = targetId || '';

    console.log('The options for requesting a ticket are: ', options)

    // check(options.Certificate, Object);
    // check(options.CertificateKey, String);
    check(options.ProxyRestUri, String);


    //Configure parameters for the ticket request
    var settings = {
        path: urljoin(url.parse(options.ProxyRestUri).path, 'ticket?xrfkey=' + xrfkey),
        method: 'POST',
        headers: { 'X-Qlik-Xrfkey': xrfkey, 'Content-Type': 'application/json' },
        passphrase: options.PassPhrase,
        rejectUnauthorized: false,
        agent: false
    };


    //check if certificate is filled, and create separate cert object
    
    var cert = {};
    cert.cert = options.Certificate;
    cert.key = options.CertificateKey;
    settings = _.extend(settings, cert);

    console.log('proxyRestUri: ', options.ProxyRestUri);
    //Send ticket request
    try {
        const call = {};
        call.action = 'Request ticket';
        call.request = options.ProxyRestUri+'ticket?xrfkey=' +certicate_communication_options.x-qlik-xrfkey;
        call.response = HTTP.call('POST', call.request, { 'npmRequestOptions': certicate_communication_options })

        REST_Log(call);
        console.log('The HTTP REQUEST to Sense QPS API:', call.request);
        console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);

    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Logout user failed', err.message);
    }


    // var ticketreq = https.request(settings, function(ticketres) {
    //     ticketres.on('data', function(d) {
    //         //Parse ticket response
    //         var ticket = JSON.parse(d.toString());

    //         //Build redirect including ticket
    //         if (ticket.TargetUri.indexOf("?") > 0) {
    //             redirectURI = ticket.TargetUri + '&QlikTicket=' + ticket.Ticket;
    //         } else {
    //             redirectURI = ticket.TargetUri + '?QlikTicket=' + ticket.Ticket;
    //         }

    //         console.log('Meteor server side create this redirect url: ', redirectURI);
    //         return redirectURI;
    //         //in the code below you would redirect the request server side, in my case I have to do it client side, so I 
    //         //just return the redirectURI to the client
    //         // res.writeHead(302, {'Location': redirectURI});
    //         // res.end();
    //     });
    // });
}

function generateXrfkey() {
    return Random.hexString(16);
};

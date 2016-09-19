import { Meteor } from 'meteor/meteor';
import { Customers } from '/imports/api/customers';
import { REST_Log } from '/imports/api/APILogs';

//import config for Qlik Sense QRS
import { senseConfig, _certs, authHeadersCertificate, authHeaders, certicate_communication_options } from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;
// var url = require('url');
// var fs = require('fs');
// var http = require('http');
// var https = require('https');
// var crypto = require('crypto');
// var util = require('util');
// import { Random } from 'meteor/random';
// var urljoin = require('url-join');
// var _ = require("underscore");



/*
When communicating with the QPS APIs, the URL is as follows:
https://<QPS machine name>:4243/<path>

Each proxy has its own session cookie, so you have to logout the users per proxy used.
*/

export function logoutUser(UDC, name) {
    // //console.log('******** QPS Functions: logout the current: ' + name + ' on proxy: ' + senseConfig.virtualProxyClientUsage);

    if (name) {
        // //console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: '); //, certicate_communication_options);
        // //console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name);
        try {
            const call = {};
            call.action = 'logout user: ' + name;
            call.request = 'https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey
            call.response = HTTP.call('DELETE', call.request, { 'npmRequestOptions': certicate_communication_options })

            REST_Log(call);
            // //console.log('The HTTP REQUEST to Sense QPS API:', call.request);
            // //console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);

        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Logout user failed', err.message);
        }
    }
};


export function getRedirectURL(passport, proxyRestUri, targetId) {
    check(passport, Object);
    check(proxyRestUri, String);
    check(targetId, String);

    console.log('entered server side requestTicket module for user and passport', passport, proxyRestUri);
    //see https://help.qlik.com/en-US/sense-developer/3.0/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm

    var ticketRequestBody = passport;
    ticketRequestBody.TargetId = targetId;
    console.log('The passport for requesting a ticket: ', passport);

    try {
        var call = {};
        call.action = 'Request ticket';
        call.request = proxyRestUri + 'ticket'; //we use the proxy rest uri which we got from the redirect from the proxy (the first bounce)
        call.response = HTTP.call('POST', call.request, {
            'npmRequestOptions': certicate_communication_options,
            headers: authHeaders,
            params: { 'xrfkey': senseConfig.xrfkey },
            data: passport //the user and group info for which we want to create a ticket
        });
        REST_Log(call);
    } catch (err) {
        console.error('REST call to request a ticket failed', err);
        throw new Meteor.Error('Request ticket failed', err.message);
    }

    // //console.log('The HTTP REQUEST to Sense QPS API:', call.request);
    console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);
    var ticketResponse = call.response.data;
    call.action = 'Ticket response';
    call.request = JSON.stringify(ticketResponse);
    call.response = '';
    REST_Log(call);


    //Build redirect URL for the client including the ticket
    if (ticketResponse.TargetUri.indexOf("?") > 0) {
        redirectURI = ticketResponse.TargetUri + '&QlikTicket=' + ticketResponse.Ticket;
    } else {
        redirectURI = ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket;
    }

    //console.log('Meteor server side created this redirect url: ', redirectURI);
    return redirectURI;
}

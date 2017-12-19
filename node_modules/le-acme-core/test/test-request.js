/*!
 * le-acme-core
 * Author: Kelly Johnson
 * Copyright 2017
 * Apache-2.0 OR MIT (and hence also MPL 2.0)
 */
'use strict';

const acmeRequest = require('../lib/le-acme-request');
const debugRequest = require('request-debug');
const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const productId = 'Daplie Greenlock';
const UA = 'User-Agent';

function checkRequest(req, done, tester) {
  debugRequest(req, function dbg(type, data, r) {
    if (type !== 'request') return;  // Only interested in the request
    expect(data.headers).to.have.property(UA);
    let uaString = data.headers[UA];
    tester(uaString);
    req.stopDebugging();
    done();
  });
  req('http://www.google.com', function (error, response, body) {
  });
}

describe('le-acme-request', function () {

  beforeEach(function () {
    acmeRequest.resetUa();
  });

  it('should build User-Agent string', function () {
    let uaString = acmeRequest.getUaString();
    expect(uaString).to.startsWith(productId);
  });

  it('should have proper User-Agent in request', function (done) {
    let request = acmeRequest.create();
    checkRequest(request, done, function (uaString) {
      expect(uaString).to.startsWith(productId);
    });
  });

  it('should add custom string to User Agent', function (done) {
    let testStr = 'check it';
    acmeRequest.addUaString(testStr);
    let request = acmeRequest.create();
    checkRequest(request, done, function (uaString) {
      // Added space to ensure str was properly appended
      expect(uaString).to.endsWith(` ${testStr}`);
    });
  });

  it('should remove all items from User Agent', function (done) {
    acmeRequest.omitUaProperties({all: true});
    let request = acmeRequest.create();
    checkRequest(request, done, function (uaString) {
      expect(uaString).to.be.empty;
    });
  });

  it('should remove one item from User Agent', function (done) {
    acmeRequest.omitUaProperties({pkg: true});
    const request = acmeRequest.create();
    checkRequest(request, done, function (uaString) {
      expect(uaString).to.not.have.string(productId);
    });
  });
});

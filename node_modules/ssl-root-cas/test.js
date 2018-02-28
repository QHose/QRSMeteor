'use strict';

testDefault();

// backwards compat
function testDefault() {
  require('https').globalAgent.options.ca = null;
  var rootCas = require('./latest');
  var request = require('request');

  require('https').globalAgent.options.ca = rootCas;
  request.get('https://coolaj86.com/404.html', function (err, resp, body) {
    if (err) {
      throw err;
    }

    testInject();
  });
}

function testInject() {
  require('https').globalAgent.options.ca = null;
  var rootCas = require('./latest').inject();
  var request = require('request');

  require('https').globalAgent.options.ca = rootCas;
  request.get('https://coolaj86.com/404.html', function (err, resp, body) {
    if (err) {
      throw err;
    }

    testCreate();
  });
}

function testCreate() {
  require('https').globalAgent.options.ca = null;
  var rootCas = require('./latest').create();
  var request = require('request');

  require('https').globalAgent.options.ca = rootCas;
  request.get('https://coolaj86.com/404.html', function (err, resp, body) {
    if (err) {
      throw err;
    }

    console.log(body);
  });
}

// TODO test with a company certificate

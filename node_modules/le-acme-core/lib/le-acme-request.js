/*!
 * le-acme-core
 * Author: Kelly Johnson
 * Copyright 2017
 * Apache-2.0 OR MIT (and hence also MPL 2.0)
 */
'use strict';

const request = require('request');
const pkgJSON = require('../package.json');
const version = pkgJSON.version;
const os = require('os');

const uaDefaults = {
  pkg: `Daplie Greenlock/${version}`
  , os: ` (${os.type()}; ${process.arch} ${os.platform()} ${os.release()})`
  , node: ` Node.js/${process.version}`
  , user: ''
}

let currentUAProps;

function getUaString() {
  let userAgent = '';
  for (let key in currentUAProps) {
    userAgent += currentUAProps[key];
  }
  return userAgent.trim();
}

function getRequest() {
  return request.defaults({
    headers: {
      'User-Agent': getUaString()
    }
  });
}

function resetUa() {
  currentUAProps = {};
  for (let key in uaDefaults) {
    currentUAProps[key] = uaDefaults[key];
  }
}

function addUaString(string) {
  currentUAProps.user += ` ${string}`;
}

function omitUaProperties(opts) {
  if (opts.all) {
    currentUAProps = {};
  } else {
    for (let key in opts) {
      currentUAProps[key] = '';
    }
  }
}

// Set our UA to begin with
resetUa();

module.exports = {
  create: function create() {
    // get deps and modify here if need be
    return getRequest();
  }
  , addUaString: addUaString
  , omitUaProperties: omitUaProperties
  , resetUa: resetUa
  , getUaString: getUaString
};

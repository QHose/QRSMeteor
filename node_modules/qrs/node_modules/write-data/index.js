/*!
 * write-data <https://github.com/jonschlinkert/write-data>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var utils = require('./utils');

/**
 * Asynchronously write JSON or YAML to disk, creating any
 * intermediary directories if they don't exist. Data
 * type is determined by the `dest` file extension.
 *
 * ```js
 * writeData('foo.yml', {foo: "bar"}, function(err) {
 *   if (err) return console.log(err);
 * });
 * ```
 * @param  {String} `dest` Destination filepath.
 * @param  {Object} `data` The data object to write.
 * @param  {Options} `options`
 * @param  {Function} `cb` Callback function
 * @api public
 */

module.exports = function(dest, data, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (typeof cb !== 'function') {
    throw new TypeError('write-data async expects a callback function.');
  }
  if (typeof dest !== 'string') {
    return cb(new TypeError('write-data async expects dest to be a string.'));
  }
  if (typeof data !== 'object') {
    return cb(new TypeError('write-data async expects data to be an object.'));
  }

  var defaults = {ext: path.extname(dest), indent: 2};
  var opts = utils.extend({}, defaults, options);

  var ext = opts.ext;
  if (ext.charAt(0) === '.') {
    ext = ext.slice(1);
  }

  switch (ext) {
    case 'json':
      return utils.writeJson(dest, data, cb);
    case 'yml':
    case 'yaml':
      return utils.writeYaml(dest, data, opts, cb);
    default: {
      cb(new Error('writeData does not support file extension: ' + ext));
      return;
    }
  }
};

/**
 * Synchronously write JSON or YAML to disk, creating any
 * intermediary directories if they don't exist. Data
 * type is determined by the `dest` file extension.
 *
 * ```js
 * writeData.sync('foo.yml', {foo: "bar"});
 * ```
 *
 * @param  {String} `dest` Destination filepath.
 * @param  {Object} `data` The data object to write.
 * @param  {Options} `options`
 * @api public
 */

module.exports.sync = function(dest, data, options) {
  if (typeof dest !== 'string') {
    throw new TypeError('write-data expects dest path to be a string.');
  }
  if (typeof data !== 'object') {
    throw new TypeError('write-data expects data to be an object.');
  }

  var defaults = {ext: path.extname(dest), indent: 2};
  var opts = utils.extend({}, defaults, options);

  var ext = opts.ext;
  if (ext.charAt(0) === '.') {
    ext = ext.slice(1);
  }

  var writer = utils.writeJson.sync;
  switch (ext) {
    case 'json':
      writer = utils.writeJson.sync;
      break;
    case 'yml':
    case 'yaml':
      writer = utils.writeYaml.sync;
      break;
    default: {
      throw new Error('writeDataSync does not support file extension: ' + ext);
    }
  }
  return writer(dest, data, opts);
};

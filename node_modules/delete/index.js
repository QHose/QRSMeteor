/*!
 * delete <https://github.com/jonschlinkert/delete>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var lazy = require('lazy-cache')(require);
var rimraf = lazy('rimraf');
var promise = lazy('bluebird');
var utils = require('./lib/utils');

function del(fp, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  try {
    assertDirectory(fp, options);
    return rimraf()(fp, next);
  } catch(err) {
    return next(err);
  }
}


del.sync = function delSync(fp, options) {
  try {
    assertDirectory(fp, options);
    rimraf().sync(fp);
    return fp;
  } catch (err) {
    throw err;
  }
};


del.promise = function delPromise(fp, options) {
  assertDirectory(fp, options);
  var Promise = promise();

  return new Promise(function (resolve, reject) {
    rimraf()(fp, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};


function assertDirectory(fp, options) {
  options = options || {};
  if (options && options.force) return;

  if (utils.isCurrentDir(fp) === true) {
    throw new Error('Whoooaaa there! If you\'re sure you want to do this, define `options.force` to delete the current working directory.');
  }

  if (utils.insideCurrentDir(fp) === false) {
    throw new Error('Yikes!! Take care! `options.force` must be defined to delete files or folders outside the current working directory.');
  }
}

/**
 * Expose `del`
 */

module.exports = del;

'use strict';

var path = require('path');

/**
 * Utils
 */

var utils = module.exports;

utils.insideCurrentDir = function insideCurrentDir(fp) {
  var cwd = utils.stripSlash(process.cwd());
  fp = utils.stripSlash(path.resolve(fp));
  if (path.sep === '\\') {
    cwd = cwd.toLowerCase();
    fp = fp.toLowerCase();
  }
  return fp.substr(0, cwd.length) === cwd;
};

utils.stripSlash = function stripSlash(fp) {
  if (fp.substr(-1) === '/') {
    return fp.slice(0, -1);
  }
  return fp
};

utils.isCurrentDir = function isCurrentDir(fp) {
  if (process.cwd() === path.resolve(fp)) {
    return true;
  }
  return fp === './' || fp === '.';
};

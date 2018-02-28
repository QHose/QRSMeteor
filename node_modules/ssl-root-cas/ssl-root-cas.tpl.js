/**
 * Mozilla's root CA store
 *
 * generated from https://mxr.mozilla.org/nss/source/lib/ckfw/builtins/certdata.txt?raw=1
 */
'use strict';

var originalCas = [
/*TPL*/
];
module.exports = originalCas.slice(0); // backwards compat
module.exports.rootCas = module.exports;
module.exports.rootCas.inject = function (/*context*/) {
  var rootCas = this || module.exports.rootCas;
  var opts = /*context ||*/ require('https').globalAgent.options;
  if (!opts.ca || !opts.ca.__injected) { opts.ca = (opts.ca||[]).concat(rootCas); }
  opts.ca.__injected = true;
  return rootCas;
};
module.exports.rootCas.addFile = function (filepath) {
  // BEGIN TODO
  // What is this filepath stuff all about?
  // (maybe be a leftover MS Windows hack ??)
  // Can we get rid of it?
  var path = require('path');
  var root = (filepath[0] === '/' ? '/' : '');
  var filepaths = filepath.split(/\//g);
  if (root) { filepaths.unshift(root); }
  filepath = path.join.apply(null, filepaths);
  // END TODO

  var httpsOpts = require('https').globalAgent.options;
  var rootCas = this || module.exports.rootCas;
  var buf = require('fs').readFileSync(filepath);
  rootCas.push(buf);
  // backwards compat
  if (rootCas !== httpsOpts.ca) {
    httpsOpts.ca = httpsOpts.ca || [];
    httpsOpts.ca.push(buf);
  }
  return rootCas;
};
module.exports.create = function () {
  var rootCas = originalCas.slice(0);

  rootCas.inject = module.exports.inject;
  rootCas.addFile = module.exports.addFile;

  return rootCas;
};

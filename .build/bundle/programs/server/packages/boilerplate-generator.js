(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

/* Package-scope variables */
var Boilerplate;

var require = meteorInstall({"node_modules":{"meteor":{"boilerplate-generator":{"generator.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/boilerplate-generator/generator.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _extends2 = require("babel-runtime/helpers/extends");                                                              //
                                                                                                                       //
var _extends3 = _interopRequireDefault(_extends2);                                                                     //
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
  Boilerplate: function () {                                                                                           // 1
    return Boilerplate;                                                                                                // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var readFile = void 0;                                                                                                 // 1
module.watch(require("fs"), {                                                                                          // 1
  readFile: function (v) {                                                                                             // 1
    readFile = v;                                                                                                      // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var WebBrowserTemplate = void 0;                                                                                       // 1
module.watch(require("./template-web.browser"), {                                                                      // 1
  "default": function (v) {                                                                                            // 1
    WebBrowserTemplate = v;                                                                                            // 1
  }                                                                                                                    // 1
}, 1);                                                                                                                 // 1
var WebCordovaTemplate = void 0;                                                                                       // 1
module.watch(require("./template-web.cordova"), {                                                                      // 1
  "default": function (v) {                                                                                            // 1
    WebCordovaTemplate = v;                                                                                            // 1
  }                                                                                                                    // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
// Copied from webapp_server                                                                                           // 6
var readUtf8FileSync = function (filename) {                                                                           // 7
  return Meteor.wrapAsync(readFile)(filename, 'utf8');                                                                 // 7
};                                                                                                                     // 7
                                                                                                                       //
var Boilerplate = function () {                                                                                        //
  function Boilerplate(arch, manifest) {                                                                               // 10
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                              // 10
    (0, _classCallCheck3.default)(this, Boilerplate);                                                                  // 10
    this.template = _getTemplate(arch);                                                                                // 11
    this.baseData = null;                                                                                              // 12
                                                                                                                       //
    this._generateBoilerplateFromManifest(manifest, options);                                                          // 14
  } // The 'extraData' argument can be used to extend 'self.baseData'. Its                                             // 18
  // purpose is to allow you to specify data that you might not know at                                                // 21
  // the time that you construct the Boilerplate object. (e.g. it is used                                              // 22
  // by 'webapp' to specify data that is only known at request-time).                                                  // 23
                                                                                                                       //
                                                                                                                       //
  Boilerplate.prototype.toHTML = function () {                                                                         //
    function toHTML(extraData) {                                                                                       //
      if (!this.baseData || !this.template) {                                                                          // 25
        throw new Error('Boilerplate did not instantiate correctly.');                                                 // 26
      }                                                                                                                // 27
                                                                                                                       //
      return "<!DOCTYPE html>\n" + this.template((0, _extends3.default)({}, this.baseData, extraData));                // 29
    }                                                                                                                  // 31
                                                                                                                       //
    return toHTML;                                                                                                     //
  }(); // XXX Exported to allow client-side only changes to rebuild the boilerplate                                    //
  // without requiring a full server restart.                                                                          // 34
  // Produces an HTML string with given manifest and boilerplateSource.                                                // 35
  // Optionally takes urlMapper in case urls from manifest need to be prefixed                                         // 36
  // or rewritten.                                                                                                     // 37
  // Optionally takes pathMapper for resolving relative file system paths.                                             // 38
  // Optionally allows to override fields of the data context.                                                         // 39
                                                                                                                       //
                                                                                                                       //
  Boilerplate.prototype._generateBoilerplateFromManifest = function () {                                               //
    function _generateBoilerplateFromManifest(manifest) {                                                              //
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},                               // 45
          _ref$urlMapper = _ref.urlMapper,                                                                             // 45
          urlMapper = _ref$urlMapper === undefined ? _.identity : _ref$urlMapper,                                      // 45
          _ref$pathMapper = _ref.pathMapper,                                                                           // 45
          pathMapper = _ref$pathMapper === undefined ? _.identity : _ref$pathMapper,                                   // 45
          baseDataExtension = _ref.baseDataExtension,                                                                  // 45
          inline = _ref.inline;                                                                                        // 45
                                                                                                                       //
      var boilerplateBaseData = (0, _extends3.default)({                                                               // 47
        css: [],                                                                                                       // 48
        js: [],                                                                                                        // 49
        head: '',                                                                                                      // 50
        body: '',                                                                                                      // 51
        meteorManifest: JSON.stringify(manifest)                                                                       // 52
      }, baseDataExtension);                                                                                           // 47
                                                                                                                       //
      _.each(manifest, function (item) {                                                                               // 56
        var urlPath = urlMapper(item.url);                                                                             // 57
        var itemObj = {                                                                                                // 58
          url: urlPath                                                                                                 // 58
        };                                                                                                             // 58
                                                                                                                       //
        if (inline) {                                                                                                  // 60
          itemObj.scriptContent = readUtf8FileSync(pathMapper(item.path));                                             // 61
          itemObj.inline = true;                                                                                       // 63
        }                                                                                                              // 64
                                                                                                                       //
        if (item.type === 'css' && item.where === 'client') {                                                          // 66
          boilerplateBaseData.css.push(itemObj);                                                                       // 67
        }                                                                                                              // 68
                                                                                                                       //
        if (item.type === 'js' && item.where === 'client' && // Dynamic JS modules should not be loaded eagerly in the
        // initial HTML of the app.                                                                                    // 72
        !item.path.startsWith('dynamic/')) {                                                                           // 73
          boilerplateBaseData.js.push(itemObj);                                                                        // 74
        }                                                                                                              // 75
                                                                                                                       //
        if (item.type === 'head') {                                                                                    // 77
          boilerplateBaseData.head = readUtf8FileSync(pathMapper(item.path));                                          // 78
        }                                                                                                              // 80
                                                                                                                       //
        if (item.type === 'body') {                                                                                    // 82
          boilerplateBaseData.body = readUtf8FileSync(pathMapper(item.path));                                          // 83
        }                                                                                                              // 85
      });                                                                                                              // 86
                                                                                                                       //
      this.baseData = boilerplateBaseData;                                                                             // 88
    }                                                                                                                  // 89
                                                                                                                       //
    return _generateBoilerplateFromManifest;                                                                           //
  }();                                                                                                                 //
                                                                                                                       //
  return Boilerplate;                                                                                                  //
}();                                                                                                                   //
                                                                                                                       //
; // Returns a template function that, when called, produces the boilerplate                                           // 90
// html as a string.                                                                                                   // 93
                                                                                                                       //
var _getTemplate = function (arch) {                                                                                   // 94
  if (arch === 'web.browser') {                                                                                        // 95
    return WebBrowserTemplate;                                                                                         // 96
  } else if (arch === 'web.cordova') {                                                                                 // 97
    return WebCordovaTemplate;                                                                                         // 98
  } else {                                                                                                             // 99
    throw new Error('Unsupported arch: ' + arch);                                                                      // 100
  }                                                                                                                    // 101
};                                                                                                                     // 102
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.browser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/boilerplate-generator/template-web.browser.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exportDefault(function (_ref) {                                                                                 // 1
  var meteorRuntimeConfig = _ref.meteorRuntimeConfig,                                                                  // 16
      rootUrlPathPrefix = _ref.rootUrlPathPrefix,                                                                      // 16
      inlineScriptsAllowed = _ref.inlineScriptsAllowed,                                                                // 16
      css = _ref.css,                                                                                                  // 16
      js = _ref.js,                                                                                                    // 16
      additionalStaticJs = _ref.additionalStaticJs,                                                                    // 16
      htmlAttributes = _ref.htmlAttributes,                                                                            // 16
      bundledJsCssUrlRewriteHook = _ref.bundledJsCssUrlRewriteHook,                                                    // 16
      head = _ref.head,                                                                                                // 16
      body = _ref.body,                                                                                                // 16
      dynamicHead = _ref.dynamicHead,                                                                                  // 16
      dynamicBody = _ref.dynamicBody;                                                                                  // 16
  return [].concat(['<html' + _.map(htmlAttributes, function (value, key) {                                            // 17
    return _.template(' <%= attrName %>="<%- attrValue %>"')({                                                         // 19
      attrName: key,                                                                                                   // 21
      attrValue: value                                                                                                 // 22
    });                                                                                                                // 20
  }).join('') + '>', '<head>'], _.map(css, function (_ref2) {                                                          // 19
    var url = _ref2.url;                                                                                               // 28
    return _.template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>">')({         // 28
      href: bundledJsCssUrlRewriteHook(url)                                                                            // 30
    });                                                                                                                // 29
  }), [head, dynamicHead, '</head>', '<body>', body, dynamicBody, '', inlineScriptsAllowed ? _.template('  <script type="text/javascript">__meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>))</script>')({
    conf: meteorRuntimeConfig                                                                                          // 44
  }) : _.template('  <script type="text/javascript" src="<%- src %>/meteor_runtime_config.js"></script>')({            // 43
    src: rootUrlPathPrefix                                                                                             // 47
  }), ''], _.map(js, function (_ref3) {                                                                                // 46
    var url = _ref3.url;                                                                                               // 53
    return _.template('  <script type="text/javascript" src="<%- src %>"></script>')({                                 // 53
      src: bundledJsCssUrlRewriteHook(url)                                                                             // 55
    });                                                                                                                // 54
  }), _.map(additionalStaticJs, function (_ref4) {                                                                     // 53
    var contents = _ref4.contents,                                                                                     // 59
        pathname = _ref4.pathname;                                                                                     // 59
    return inlineScriptsAllowed ? _.template('  <script><%= contents %></script>')({                                   // 59
      contents: contents                                                                                               // 62
    }) : _.template('  <script type="text/javascript" src="<%- src %>"></script>')({                                   // 61
      src: rootUrlPathPrefix + pathname                                                                                // 65
    });                                                                                                                // 64
  }), ['', '', '</body>', '</html>']).join('\n');                                                                      // 59
});                                                                                                                    // 75
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.cordova.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/boilerplate-generator/template-web.cordova.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exportDefault(function (_ref) {                                                                                 // 1
  var meteorRuntimeConfig = _ref.meteorRuntimeConfig,                                                                  // 16
      rootUrlPathPrefix = _ref.rootUrlPathPrefix,                                                                      // 16
      inlineScriptsAllowed = _ref.inlineScriptsAllowed,                                                                // 16
      css = _ref.css,                                                                                                  // 16
      js = _ref.js,                                                                                                    // 16
      additionalStaticJs = _ref.additionalStaticJs,                                                                    // 16
      htmlAttributes = _ref.htmlAttributes,                                                                            // 16
      bundledJsCssUrlRewriteHook = _ref.bundledJsCssUrlRewriteHook,                                                    // 16
      head = _ref.head,                                                                                                // 16
      body = _ref.body,                                                                                                // 16
      dynamicHead = _ref.dynamicHead,                                                                                  // 16
      dynamicBody = _ref.dynamicBody;                                                                                  // 16
  return [].concat(['<html>', '<head>', '  <meta charset="utf-8">', '  <meta name="format-detection" content="telephone=no">', '  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height">', '  <meta name="msapplication-tap-highlight" content="no">', '  <meta http-equiv="Content-Security-Policy" content="default-src * gap: data: blob: \'unsafe-inline\' \'unsafe-eval\' ws: wss:;">'], // We are explicitly not using bundledJsCssUrlRewriteHook: in cordova we serve assets up directly from disk, so rewriting the URL does not make sense
  _.map(css, function (_ref2) {                                                                                        // 28
    var url = _ref2.url;                                                                                               // 28
    return _.template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>">')({         // 28
      href: url                                                                                                        // 30
    });                                                                                                                // 29
  }), ['  <script type="text/javascript">', _.template('    __meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>));')({
    conf: meteorRuntimeConfig                                                                                          // 36
  }), '    if (/Android/i.test(navigator.userAgent)) {', // When Android app is emulated, it cannot connect to localhost,
  // instead it should connect to 10.0.2.2                                                                             // 40
  // (unless we\'re using an http proxy; then it works!)                                                               // 41
  '      if (!__meteor_runtime_config__.httpProxyPort) {', '        __meteor_runtime_config__.ROOT_URL = (__meteor_runtime_config__.ROOT_URL || \'\').replace(/localhost/i, \'10.0.2.2\');', '        __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = (__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL || \'\').replace(/localhost/i, \'10.0.2.2\');', '      }', '    }', '  </script>', '', '  <script type="text/javascript" src="/cordova.js"></script>'], _.map(js, function (_ref3) {
    var url = _ref3.url;                                                                                               // 51
    return _.template('  <script type="text/javascript" src="<%- src %>"></script>')({                                 // 51
      src: url                                                                                                         // 53
    });                                                                                                                // 52
  }), _.map(additionalStaticJs, function (_ref4) {                                                                     // 51
    var contents = _ref4.contents,                                                                                     // 57
        pathname = _ref4.pathname;                                                                                     // 57
    return inlineScriptsAllowed ? _.template('  <script><%= contents %></script>')({                                   // 57
      contents: contents                                                                                               // 60
    }) : _.template('  <script type="text/javascript" src="<%- src %>"></script>')({                                   // 59
      src: rootUrlPathPrefix + pathname                                                                                // 63
    });                                                                                                                // 62
  }), ['', head, '</head>', '', '<body>', body, '</body>', '</html>']).join('\n');                                     // 57
});                                                                                                                    // 78
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/boilerplate-generator/generator.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['boilerplate-generator'] = exports, {
  Boilerplate: Boilerplate
});

})();

//# sourceMappingURL=boilerplate-generator.js.map

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

/* Package-scope variables */
var Boilerplate;

var require = meteorInstall({"node_modules":{"meteor":{"boilerplate-generator":{"generator.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/boilerplate-generator/generator.js                                                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  Boilerplate: () => Boilerplate
});
let readFile;
module.watch(require("fs"), {
  readFile(v) {
    readFile = v;
  }

}, 0);
let createStream;
module.watch(require("combined-stream2"), {
  create(v) {
    createStream = v;
  }

}, 1);
let WebBrowserTemplate;
module.watch(require("./template-web.browser"), {
  default(v) {
    WebBrowserTemplate = v;
  }

}, 2);
let WebCordovaTemplate;
module.watch(require("./template-web.cordova"), {
  default(v) {
    WebCordovaTemplate = v;
  }

}, 3);

// Copied from webapp_server
const readUtf8FileSync = filename => Meteor.wrapAsync(readFile)(filename, 'utf8');

const identity = value => value;

function appendToStream(chunk, stream) {
  if (typeof chunk === "string") {
    stream.append(Buffer.from(chunk, "utf8"));
  } else if (Buffer.isBuffer(chunk) || typeof chunk.read === "function") {
    stream.append(chunk);
  }
}

let shouldWarnAboutToHTMLDeprecation = !Meteor.isProduction;

class Boilerplate {
  constructor(arch, manifest, options = {}) {
    const {
      headTemplate,
      closeTemplate
    } = _getTemplate(arch);

    this.headTemplate = headTemplate;
    this.closeTemplate = closeTemplate;
    this.baseData = null;

    this._generateBoilerplateFromManifest(manifest, options);
  }

  toHTML(extraData) {
    if (shouldWarnAboutToHTMLDeprecation) {
      shouldWarnAboutToHTMLDeprecation = false;
      console.error("The Boilerplate#toHTML method has been deprecated. " + "Please use Boilerplate#toHTMLStream instead.");
      console.trace();
    } // Calling .await() requires a Fiber.


    return toHTMLAsync(extraData).await();
  } // Returns a Promise that resolves to a string of HTML.


  toHTMLAsync(extraData) {
    return new Promise((resolve, reject) => {
      const stream = this.toHTMLStream(extraData);
      const chunks = [];
      stream.on("data", chunk => chunks.push(chunk));
      stream.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8"));
      });
      stream.on("error", reject);
    });
  } // The 'extraData' argument can be used to extend 'self.baseData'. Its
  // purpose is to allow you to specify data that you might not know at
  // the time that you construct the Boilerplate object. (e.g. it is used
  // by 'webapp' to specify data that is only known at request-time).
  // this returns a stream


  toHTMLStream(extraData) {
    if (!this.baseData || !this.headTemplate || !this.closeTemplate) {
      throw new Error('Boilerplate did not instantiate correctly.');
    }

    const data = (0, _objectSpread2.default)({}, this.baseData, extraData);
    const start = "<!DOCTYPE html>\n" + this.headTemplate(data);
    const {
      body,
      dynamicBody
    } = data;
    const end = this.closeTemplate(data);
    const response = createStream();
    appendToStream(start, response);

    if (body) {
      appendToStream(body, response);
    }

    if (dynamicBody) {
      appendToStream(dynamicBody, response);
    }

    appendToStream(end, response);
    return response;
  } // XXX Exported to allow client-side only changes to rebuild the boilerplate
  // without requiring a full server restart.
  // Produces an HTML string with given manifest and boilerplateSource.
  // Optionally takes urlMapper in case urls from manifest need to be prefixed
  // or rewritten.
  // Optionally takes pathMapper for resolving relative file system paths.
  // Optionally allows to override fields of the data context.


  _generateBoilerplateFromManifest(manifest, {
    urlMapper = identity,
    pathMapper = identity,
    baseDataExtension,
    inline
  } = {}) {
    const boilerplateBaseData = (0, _objectSpread2.default)({
      css: [],
      js: [],
      head: '',
      body: '',
      meteorManifest: JSON.stringify(manifest)
    }, baseDataExtension);
    manifest.forEach(item => {
      const urlPath = urlMapper(item.url);
      const itemObj = {
        url: urlPath
      };

      if (inline) {
        itemObj.scriptContent = readUtf8FileSync(pathMapper(item.path));
        itemObj.inline = true;
      }

      if (item.type === 'css' && item.where === 'client') {
        boilerplateBaseData.css.push(itemObj);
      }

      if (item.type === 'js' && item.where === 'client' && // Dynamic JS modules should not be loaded eagerly in the
      // initial HTML of the app.
      !item.path.startsWith('dynamic/')) {
        boilerplateBaseData.js.push(itemObj);
      }

      if (item.type === 'head') {
        boilerplateBaseData.head = readUtf8FileSync(pathMapper(item.path));
      }

      if (item.type === 'body') {
        boilerplateBaseData.body = readUtf8FileSync(pathMapper(item.path));
      }
    });
    this.baseData = boilerplateBaseData;
  }

}

; // Returns a template function that, when called, produces the boilerplate
// html as a string.

const _getTemplate = arch => {
  if (arch === 'web.browser') {
    return WebBrowserTemplate;
  } else if (arch === 'web.cordova') {
    return WebCordovaTemplate;
  } else {
    throw new Error('Unsupported arch: ' + arch);
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.browser.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/boilerplate-generator/template-web.browser.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  headTemplate: () => headTemplate,
  closeTemplate: () => closeTemplate
});
let template;
module.watch(require("./template"), {
  default(v) {
    template = v;
  }

}, 0);

const headTemplate = ({
  css,
  htmlAttributes,
  bundledJsCssUrlRewriteHook,
  head,
  dynamicHead
}) => ['<html' + Object.keys(htmlAttributes || {}).map(key => template(' <%= attrName %>="<%- attrValue %>"')({
  attrName: key,
  attrValue: htmlAttributes[key]
})).join('') + '>', '<head>', ...(css || []).map(file => template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>">')({
  href: bundledJsCssUrlRewriteHook(file.url)
})), head, dynamicHead, '</head>', '<body>'].join('\n');

const closeTemplate = ({
  meteorRuntimeConfig,
  rootUrlPathPrefix,
  inlineScriptsAllowed,
  js,
  additionalStaticJs,
  bundledJsCssUrlRewriteHook
}) => ['', inlineScriptsAllowed ? template('  <script type="text/javascript">__meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>))</script>')({
  conf: meteorRuntimeConfig
}) : template('  <script type="text/javascript" src="<%- src %>/meteor_runtime_config.js"></script>')({
  src: rootUrlPathPrefix
}), '', ...(js || []).map(file => template('  <script type="text/javascript" src="<%- src %>"></script>')({
  src: bundledJsCssUrlRewriteHook(file.url)
})), ...(additionalStaticJs || []).map(({
  contents,
  pathname
}) => inlineScriptsAllowed ? template('  <script><%= contents %></script>')({
  contents
}) : template('  <script type="text/javascript" src="<%- src %>"></script>')({
  src: rootUrlPathPrefix + pathname
})), '', '', '</body>', '</html>'].join('\n');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.cordova.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/boilerplate-generator/template-web.cordova.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  headTemplate: () => headTemplate,
  closeTemplate: () => closeTemplate
});
let template;
module.watch(require("./template"), {
  default(v) {
    template = v;
  }

}, 0);

const headTemplate = ({
  meteorRuntimeConfig,
  rootUrlPathPrefix,
  inlineScriptsAllowed,
  css,
  js,
  additionalStaticJs,
  htmlAttributes,
  bundledJsCssUrlRewriteHook,
  head,
  dynamicHead
}) => ['<html>', '<head>', '  <meta charset="utf-8">', '  <meta name="format-detection" content="telephone=no">', '  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, viewport-fit=cover">', '  <meta name="msapplication-tap-highlight" content="no">', '  <meta http-equiv="Content-Security-Policy" content="default-src * gap: data: blob: \'unsafe-inline\' \'unsafe-eval\' ws: wss:;">', // We are explicitly not using bundledJsCssUrlRewriteHook: in cordova we serve assets up directly from disk, so rewriting the URL does not make sense
...(css || []).map(file => template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>">')({
  href: file.url
})), '  <script type="text/javascript">', template('    __meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>));')({
  conf: meteorRuntimeConfig
}), '    if (/Android/i.test(navigator.userAgent)) {', // When Android app is emulated, it cannot connect to localhost,
// instead it should connect to 10.0.2.2
// (unless we\'re using an http proxy; then it works!)
'      if (!__meteor_runtime_config__.httpProxyPort) {', '        __meteor_runtime_config__.ROOT_URL = (__meteor_runtime_config__.ROOT_URL || \'\').replace(/localhost/i, \'10.0.2.2\');', '        __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = (__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL || \'\').replace(/localhost/i, \'10.0.2.2\');', '      }', '    }', '  </script>', '', '  <script type="text/javascript" src="/cordova.js"></script>', ...(js || []).map(file => template('  <script type="text/javascript" src="<%- src %>"></script>')({
  src: file.url
})), ...(additionalStaticJs || []).map(({
  contents,
  pathname
}) => inlineScriptsAllowed ? template('  <script><%= contents %></script>')({
  contents
}) : template('  <script type="text/javascript" src="<%- src %>"></script>')({
  src: rootUrlPathPrefix + pathname
})), '', head, '</head>', '', '<body>'].join('\n');

function closeTemplate() {
  return "</body>\n</html>";
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/boilerplate-generator/template.js                                                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  default: () => template
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);

function template(text) {
  return _.template(text, null, {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  });
}

;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"combined-stream2":{"package.json":function(require,exports){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/boilerplate-generator/node_modules/combined-stream2/package.json                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
exports.name = "combined-stream2";
exports.version = "1.1.2";
exports.main = "index.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/boilerplate-generator/node_modules/combined-stream2/index.js                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = require("./lib/combined-stream2");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/boilerplate-generator/generator.js");

/* Exports */
Package._define("boilerplate-generator", exports, {
  Boilerplate: Boilerplate
});

})();

//# sourceURL=meteor://💻app/packages/boilerplate-generator.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL2dlbmVyYXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL3RlbXBsYXRlLXdlYi5icm93c2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9ib2lsZXJwbGF0ZS1nZW5lcmF0b3IvdGVtcGxhdGUtd2ViLmNvcmRvdmEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2JvaWxlcnBsYXRlLWdlbmVyYXRvci90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJCb2lsZXJwbGF0ZSIsInJlYWRGaWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsImNyZWF0ZVN0cmVhbSIsImNyZWF0ZSIsIldlYkJyb3dzZXJUZW1wbGF0ZSIsImRlZmF1bHQiLCJXZWJDb3Jkb3ZhVGVtcGxhdGUiLCJyZWFkVXRmOEZpbGVTeW5jIiwiZmlsZW5hbWUiLCJNZXRlb3IiLCJ3cmFwQXN5bmMiLCJpZGVudGl0eSIsInZhbHVlIiwiYXBwZW5kVG9TdHJlYW0iLCJjaHVuayIsInN0cmVhbSIsImFwcGVuZCIsIkJ1ZmZlciIsImZyb20iLCJpc0J1ZmZlciIsInJlYWQiLCJzaG91bGRXYXJuQWJvdXRUb0hUTUxEZXByZWNhdGlvbiIsImlzUHJvZHVjdGlvbiIsImNvbnN0cnVjdG9yIiwiYXJjaCIsIm1hbmlmZXN0Iiwib3B0aW9ucyIsImhlYWRUZW1wbGF0ZSIsImNsb3NlVGVtcGxhdGUiLCJfZ2V0VGVtcGxhdGUiLCJiYXNlRGF0YSIsIl9nZW5lcmF0ZUJvaWxlcnBsYXRlRnJvbU1hbmlmZXN0IiwidG9IVE1MIiwiZXh0cmFEYXRhIiwiY29uc29sZSIsImVycm9yIiwidHJhY2UiLCJ0b0hUTUxBc3luYyIsImF3YWl0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0b0hUTUxTdHJlYW0iLCJjaHVua3MiLCJvbiIsInB1c2giLCJjb25jYXQiLCJ0b1N0cmluZyIsIkVycm9yIiwiZGF0YSIsInN0YXJ0IiwiYm9keSIsImR5bmFtaWNCb2R5IiwiZW5kIiwicmVzcG9uc2UiLCJ1cmxNYXBwZXIiLCJwYXRoTWFwcGVyIiwiYmFzZURhdGFFeHRlbnNpb24iLCJpbmxpbmUiLCJib2lsZXJwbGF0ZUJhc2VEYXRhIiwiY3NzIiwianMiLCJoZWFkIiwibWV0ZW9yTWFuaWZlc3QiLCJKU09OIiwic3RyaW5naWZ5IiwiZm9yRWFjaCIsIml0ZW0iLCJ1cmxQYXRoIiwidXJsIiwiaXRlbU9iaiIsInNjcmlwdENvbnRlbnQiLCJwYXRoIiwidHlwZSIsIndoZXJlIiwic3RhcnRzV2l0aCIsInRlbXBsYXRlIiwiaHRtbEF0dHJpYnV0ZXMiLCJidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayIsImR5bmFtaWNIZWFkIiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsImtleSIsImF0dHJOYW1lIiwiYXR0clZhbHVlIiwiam9pbiIsImZpbGUiLCJocmVmIiwibWV0ZW9yUnVudGltZUNvbmZpZyIsInJvb3RVcmxQYXRoUHJlZml4IiwiaW5saW5lU2NyaXB0c0FsbG93ZWQiLCJhZGRpdGlvbmFsU3RhdGljSnMiLCJjb25mIiwic3JjIiwiY29udGVudHMiLCJwYXRobmFtZSIsIl8iLCJ0ZXh0IiwiZXZhbHVhdGUiLCJpbnRlcnBvbGF0ZSIsImVzY2FwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7QUFBNkMsSUFBSUMsUUFBSjtBQUFhSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsSUFBUixDQUFiLEVBQTJCO0FBQUNGLFdBQVNHLENBQVQsRUFBVztBQUFDSCxlQUFTRyxDQUFUO0FBQVc7O0FBQXhCLENBQTNCLEVBQXFELENBQXJEO0FBQXdELElBQUlDLFlBQUo7QUFBaUJQLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixD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QUFBYixDQUFkOztBQUFzQyxJQUFJcUIsQ0FBSjs7QUFBTXRHLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNpRyxJQUFFaEcsQ0FBRixFQUFJO0FBQUNnRyxRQUFFaEcsQ0FBRjtBQUFJOztBQUFWLENBQTFDLEVBQXNELENBQXREOztBQU83QixTQUFTMkUsUUFBVCxDQUFrQnNCLElBQWxCLEVBQXdCO0FBQ3JDLFNBQU9ELEVBQUVyQixRQUFGLENBQVdzQixJQUFYLEVBQWlCLElBQWpCLEVBQXVCO0FBQzVCQyxjQUFjLGlCQURjO0FBRTVCQyxpQkFBYyxrQkFGYztBQUc1QkMsWUFBYztBQUhjLEdBQXZCLENBQVA7QUFLRDs7QUFBQSxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9ib2lsZXJwbGF0ZS1nZW5lcmF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGNyZWF0ZSBhcyBjcmVhdGVTdHJlYW0gfSBmcm9tIFwiY29tYmluZWQtc3RyZWFtMlwiO1xuXG5pbXBvcnQgV2ViQnJvd3NlclRlbXBsYXRlIGZyb20gJy4vdGVtcGxhdGUtd2ViLmJyb3dzZXInO1xuaW1wb3J0IFdlYkNvcmRvdmFUZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlLXdlYi5jb3Jkb3ZhJztcblxuLy8gQ29waWVkIGZyb20gd2ViYXBwX3NlcnZlclxuY29uc3QgcmVhZFV0ZjhGaWxlU3luYyA9IGZpbGVuYW1lID0+IE1ldGVvci53cmFwQXN5bmMocmVhZEZpbGUpKGZpbGVuYW1lLCAndXRmOCcpO1xuXG5jb25zdCBpZGVudGl0eSA9IHZhbHVlID0+IHZhbHVlO1xuXG5mdW5jdGlvbiBhcHBlbmRUb1N0cmVhbShjaHVuaywgc3RyZWFtKSB7XG4gIGlmICh0eXBlb2YgY2h1bmsgPT09IFwic3RyaW5nXCIpIHtcbiAgICBzdHJlYW0uYXBwZW5kKEJ1ZmZlci5mcm9tKGNodW5rLCBcInV0ZjhcIikpO1xuICB9IGVsc2UgaWYgKEJ1ZmZlci5pc0J1ZmZlcihjaHVuaykgfHxcbiAgICAgICAgICAgICB0eXBlb2YgY2h1bmsucmVhZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgc3RyZWFtLmFwcGVuZChjaHVuayk7XG4gIH1cbn1cblxubGV0IHNob3VsZFdhcm5BYm91dFRvSFRNTERlcHJlY2F0aW9uID0gISBNZXRlb3IuaXNQcm9kdWN0aW9uO1xuXG5leHBvcnQgY2xhc3MgQm9pbGVycGxhdGUge1xuICBjb25zdHJ1Y3RvcihhcmNoLCBtYW5pZmVzdCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgeyBoZWFkVGVtcGxhdGUsIGNsb3NlVGVtcGxhdGUgfSA9IF9nZXRUZW1wbGF0ZShhcmNoKTtcbiAgICB0aGlzLmhlYWRUZW1wbGF0ZSA9IGhlYWRUZW1wbGF0ZTtcbiAgICB0aGlzLmNsb3NlVGVtcGxhdGUgPSBjbG9zZVRlbXBsYXRlO1xuICAgIHRoaXMuYmFzZURhdGEgPSBudWxsO1xuXG4gICAgdGhpcy5fZ2VuZXJhdGVCb2lsZXJwbGF0ZUZyb21NYW5pZmVzdChcbiAgICAgIG1hbmlmZXN0LFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gIH1cblxuICB0b0hUTUwoZXh0cmFEYXRhKSB7XG4gICAgaWYgKHNob3VsZFdhcm5BYm91dFRvSFRNTERlcHJlY2F0aW9uKSB7XG4gICAgICBzaG91bGRXYXJuQWJvdXRUb0hUTUxEZXByZWNhdGlvbiA9IGZhbHNlO1xuICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgXCJUaGUgQm9pbGVycGxhdGUjdG9IVE1MIG1ldGhvZCBoYXMgYmVlbiBkZXByZWNhdGVkLiBcIiArXG4gICAgICAgICAgXCJQbGVhc2UgdXNlIEJvaWxlcnBsYXRlI3RvSFRNTFN0cmVhbSBpbnN0ZWFkLlwiXG4gICAgICApO1xuICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgIH1cblxuICAgIC8vIENhbGxpbmcgLmF3YWl0KCkgcmVxdWlyZXMgYSBGaWJlci5cbiAgICByZXR1cm4gdG9IVE1MQXN5bmMoZXh0cmFEYXRhKS5hd2FpdCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIHN0cmluZyBvZiBIVE1MLlxuICB0b0hUTUxBc3luYyhleHRyYURhdGEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgc3RyZWFtID0gdGhpcy50b0hUTUxTdHJlYW0oZXh0cmFEYXRhKTtcbiAgICAgIGNvbnN0IGNodW5rcyA9IFtdO1xuICAgICAgc3RyZWFtLm9uKFwiZGF0YVwiLCBjaHVuayA9PiBjaHVua3MucHVzaChjaHVuaykpO1xuICAgICAgc3RyZWFtLm9uKFwiZW5kXCIsICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGY4XCIpKTtcbiAgICAgIH0pO1xuICAgICAgc3RyZWFtLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFRoZSAnZXh0cmFEYXRhJyBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byBleHRlbmQgJ3NlbGYuYmFzZURhdGEnLiBJdHNcbiAgLy8gcHVycG9zZSBpcyB0byBhbGxvdyB5b3UgdG8gc3BlY2lmeSBkYXRhIHRoYXQgeW91IG1pZ2h0IG5vdCBrbm93IGF0XG4gIC8vIHRoZSB0aW1lIHRoYXQgeW91IGNvbnN0cnVjdCB0aGUgQm9pbGVycGxhdGUgb2JqZWN0LiAoZS5nLiBpdCBpcyB1c2VkXG4gIC8vIGJ5ICd3ZWJhcHAnIHRvIHNwZWNpZnkgZGF0YSB0aGF0IGlzIG9ubHkga25vd24gYXQgcmVxdWVzdC10aW1lKS5cbiAgLy8gdGhpcyByZXR1cm5zIGEgc3RyZWFtXG4gIHRvSFRNTFN0cmVhbShleHRyYURhdGEpIHtcbiAgICBpZiAoIXRoaXMuYmFzZURhdGEgfHwgIXRoaXMuaGVhZFRlbXBsYXRlIHx8ICF0aGlzLmNsb3NlVGVtcGxhdGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQm9pbGVycGxhdGUgZGlkIG5vdCBpbnN0YW50aWF0ZSBjb3JyZWN0bHkuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YSA9IHsuLi50aGlzLmJhc2VEYXRhLCAuLi5leHRyYURhdGF9O1xuICAgIGNvbnN0IHN0YXJ0ID0gXCI8IURPQ1RZUEUgaHRtbD5cXG5cIiArIHRoaXMuaGVhZFRlbXBsYXRlKGRhdGEpO1xuXG4gICAgY29uc3QgeyBib2R5LCBkeW5hbWljQm9keSB9ID0gZGF0YTtcblxuICAgIGNvbnN0IGVuZCA9IHRoaXMuY2xvc2VUZW1wbGF0ZShkYXRhKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGNyZWF0ZVN0cmVhbSgpO1xuXG4gICAgYXBwZW5kVG9TdHJlYW0oc3RhcnQsIHJlc3BvbnNlKTtcblxuICAgIGlmIChib2R5KSB7XG4gICAgICBhcHBlbmRUb1N0cmVhbShib2R5LCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgaWYgKGR5bmFtaWNCb2R5KSB7XG4gICAgICBhcHBlbmRUb1N0cmVhbShkeW5hbWljQm9keSwgcmVzcG9uc2UpO1xuICAgIH1cblxuICAgIGFwcGVuZFRvU3RyZWFtKGVuZCwgcmVzcG9uc2UpO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgLy8gWFhYIEV4cG9ydGVkIHRvIGFsbG93IGNsaWVudC1zaWRlIG9ubHkgY2hhbmdlcyB0byByZWJ1aWxkIHRoZSBib2lsZXJwbGF0ZVxuICAvLyB3aXRob3V0IHJlcXVpcmluZyBhIGZ1bGwgc2VydmVyIHJlc3RhcnQuXG4gIC8vIFByb2R1Y2VzIGFuIEhUTUwgc3RyaW5nIHdpdGggZ2l2ZW4gbWFuaWZlc3QgYW5kIGJvaWxlcnBsYXRlU291cmNlLlxuICAvLyBPcHRpb25hbGx5IHRha2VzIHVybE1hcHBlciBpbiBjYXNlIHVybHMgZnJvbSBtYW5pZmVzdCBuZWVkIHRvIGJlIHByZWZpeGVkXG4gIC8vIG9yIHJld3JpdHRlbi5cbiAgLy8gT3B0aW9uYWxseSB0YWtlcyBwYXRoTWFwcGVyIGZvciByZXNvbHZpbmcgcmVsYXRpdmUgZmlsZSBzeXN0ZW0gcGF0aHMuXG4gIC8vIE9wdGlvbmFsbHkgYWxsb3dzIHRvIG92ZXJyaWRlIGZpZWxkcyBvZiB0aGUgZGF0YSBjb250ZXh0LlxuICBfZ2VuZXJhdGVCb2lsZXJwbGF0ZUZyb21NYW5pZmVzdChtYW5pZmVzdCwge1xuICAgIHVybE1hcHBlciA9IGlkZW50aXR5LFxuICAgIHBhdGhNYXBwZXIgPSBpZGVudGl0eSxcbiAgICBiYXNlRGF0YUV4dGVuc2lvbixcbiAgICBpbmxpbmUsXG4gIH0gPSB7fSkge1xuXG4gICAgY29uc3QgYm9pbGVycGxhdGVCYXNlRGF0YSA9IHtcbiAgICAgIGNzczogW10sXG4gICAgICBqczogW10sXG4gICAgICBoZWFkOiAnJyxcbiAgICAgIGJvZHk6ICcnLFxuICAgICAgbWV0ZW9yTWFuaWZlc3Q6IEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0KSxcbiAgICAgIC4uLmJhc2VEYXRhRXh0ZW5zaW9uLFxuICAgIH07XG5cbiAgICBtYW5pZmVzdC5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgY29uc3QgdXJsUGF0aCA9IHVybE1hcHBlcihpdGVtLnVybCk7XG4gICAgICBjb25zdCBpdGVtT2JqID0geyB1cmw6IHVybFBhdGggfTtcblxuICAgICAgaWYgKGlubGluZSkge1xuICAgICAgICBpdGVtT2JqLnNjcmlwdENvbnRlbnQgPSByZWFkVXRmOEZpbGVTeW5jKFxuICAgICAgICAgIHBhdGhNYXBwZXIoaXRlbS5wYXRoKSk7XG4gICAgICAgIGl0ZW1PYmouaW5saW5lID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2NzcycgJiYgaXRlbS53aGVyZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgICAgYm9pbGVycGxhdGVCYXNlRGF0YS5jc3MucHVzaChpdGVtT2JqKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2pzJyAmJiBpdGVtLndoZXJlID09PSAnY2xpZW50JyAmJlxuICAgICAgICAvLyBEeW5hbWljIEpTIG1vZHVsZXMgc2hvdWxkIG5vdCBiZSBsb2FkZWQgZWFnZXJseSBpbiB0aGVcbiAgICAgICAgLy8gaW5pdGlhbCBIVE1MIG9mIHRoZSBhcHAuXG4gICAgICAgICFpdGVtLnBhdGguc3RhcnRzV2l0aCgnZHluYW1pYy8nKSkge1xuICAgICAgICBib2lsZXJwbGF0ZUJhc2VEYXRhLmpzLnB1c2goaXRlbU9iaik7XG4gICAgICB9XG5cbiAgICAgIGlmIChpdGVtLnR5cGUgPT09ICdoZWFkJykge1xuICAgICAgICBib2lsZXJwbGF0ZUJhc2VEYXRhLmhlYWQgPVxuICAgICAgICAgIHJlYWRVdGY4RmlsZVN5bmMocGF0aE1hcHBlcihpdGVtLnBhdGgpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2JvZHknKSB7XG4gICAgICAgIGJvaWxlcnBsYXRlQmFzZURhdGEuYm9keSA9XG4gICAgICAgICAgcmVhZFV0ZjhGaWxlU3luYyhwYXRoTWFwcGVyKGl0ZW0ucGF0aCkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5iYXNlRGF0YSA9IGJvaWxlcnBsYXRlQmFzZURhdGE7XG4gIH1cbn07XG5cbi8vIFJldHVybnMgYSB0ZW1wbGF0ZSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgcHJvZHVjZXMgdGhlIGJvaWxlcnBsYXRlXG4vLyBodG1sIGFzIGEgc3RyaW5nLlxuY29uc3QgX2dldFRlbXBsYXRlID0gYXJjaCA9PiB7XG4gIGlmIChhcmNoID09PSAnd2ViLmJyb3dzZXInKSB7XG4gICAgcmV0dXJuIFdlYkJyb3dzZXJUZW1wbGF0ZTtcbiAgfSBlbHNlIGlmIChhcmNoID09PSAnd2ViLmNvcmRvdmEnKSB7XG4gICAgcmV0dXJuIFdlYkNvcmRvdmFUZW1wbGF0ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGFyY2g6ICcgKyBhcmNoKTtcbiAgfVxufTtcbiIsImltcG9ydCB0ZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlJztcblxuZXhwb3J0IGNvbnN0IGhlYWRUZW1wbGF0ZSA9ICh7XG4gIGNzcyxcbiAgaHRtbEF0dHJpYnV0ZXMsXG4gIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rLFxuICBoZWFkLFxuICBkeW5hbWljSGVhZCxcbn0pID0+IFtcbiAgJzxodG1sJyArIE9iamVjdC5rZXlzKGh0bWxBdHRyaWJ1dGVzIHx8IHt9KS5tYXAoXG4gICAga2V5ID0+IHRlbXBsYXRlKCcgPCU9IGF0dHJOYW1lICU+PVwiPCUtIGF0dHJWYWx1ZSAlPlwiJykoe1xuICAgICAgYXR0ck5hbWU6IGtleSxcbiAgICAgIGF0dHJWYWx1ZTogaHRtbEF0dHJpYnV0ZXNba2V5XSxcbiAgICB9KVxuICApLmpvaW4oJycpICsgJz4nLFxuICAnPGhlYWQ+JyxcblxuICAuLi4oY3NzIHx8IFtdKS5tYXAoZmlsZSA9PlxuICAgIHRlbXBsYXRlKCcgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBjbGFzcz1cIl9fbWV0ZW9yLWNzc19fXCIgaHJlZj1cIjwlLSBocmVmICU+XCI+Jykoe1xuICAgICAgaHJlZjogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxuICAgIH0pXG4gICksXG5cbiAgaGVhZCxcbiAgZHluYW1pY0hlYWQsXG4gICc8L2hlYWQ+JyxcbiAgJzxib2R5PicsXG5dLmpvaW4oJ1xcbicpO1xuXG4vLyBUZW1wbGF0ZSBmdW5jdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBib2lsZXJwbGF0ZSBodG1sIGZvciBicm93c2Vyc1xuZXhwb3J0IGNvbnN0IGNsb3NlVGVtcGxhdGUgPSAoe1xuICBtZXRlb3JSdW50aW1lQ29uZmlnLFxuICByb290VXJsUGF0aFByZWZpeCxcbiAgaW5saW5lU2NyaXB0c0FsbG93ZWQsXG4gIGpzLFxuICBhZGRpdGlvbmFsU3RhdGljSnMsXG4gIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rLFxufSkgPT4gW1xuICAnJyxcbiAgaW5saW5lU2NyaXB0c0FsbG93ZWRcbiAgICA/IHRlbXBsYXRlKCcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gPSBKU09OLnBhcnNlKGRlY29kZVVSSUNvbXBvbmVudCg8JT0gY29uZiAlPikpPC9zY3JpcHQ+Jykoe1xuICAgICAgY29uZjogbWV0ZW9yUnVudGltZUNvbmZpZyxcbiAgICB9KVxuICAgIDogdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPi9tZXRlb3JfcnVudGltZV9jb25maWcuanNcIj48L3NjcmlwdD4nKSh7XG4gICAgICBzcmM6IHJvb3RVcmxQYXRoUHJlZml4LFxuICAgIH0pLFxuICAnJyxcblxuICAuLi4oanMgfHwgW10pLm1hcChmaWxlID0+XG4gICAgdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcbiAgICAgIHNyYzogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxuICAgIH0pXG4gICksXG5cbiAgLi4uKGFkZGl0aW9uYWxTdGF0aWNKcyB8fCBbXSkubWFwKCh7IGNvbnRlbnRzLCBwYXRobmFtZSB9KSA9PiAoXG4gICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcbiAgICAgID8gdGVtcGxhdGUoJyAgPHNjcmlwdD48JT0gY29udGVudHMgJT48L3NjcmlwdD4nKSh7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgfSlcbiAgICAgIDogdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcbiAgICAgICAgc3JjOiByb290VXJsUGF0aFByZWZpeCArIHBhdGhuYW1lLFxuICAgICAgfSlcbiAgKSksXG5cbiAgJycsXG4gICcnLFxuICAnPC9ib2R5PicsXG4gICc8L2h0bWw+J1xuXS5qb2luKCdcXG4nKTtcbiIsImltcG9ydCB0ZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlJztcblxuLy8gVGVtcGxhdGUgZnVuY3Rpb24gZm9yIHJlbmRlcmluZyB0aGUgYm9pbGVycGxhdGUgaHRtbCBmb3IgY29yZG92YVxuZXhwb3J0IGNvbnN0IGhlYWRUZW1wbGF0ZSA9ICh7XG4gIG1ldGVvclJ1bnRpbWVDb25maWcsXG4gIHJvb3RVcmxQYXRoUHJlZml4LFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZCxcbiAgY3NzLFxuICBqcyxcbiAgYWRkaXRpb25hbFN0YXRpY0pzLFxuICBodG1sQXR0cmlidXRlcyxcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXG4gIGhlYWQsXG4gIGR5bmFtaWNIZWFkLFxufSkgPT4gW1xuICAnPGh0bWw+JyxcbiAgJzxoZWFkPicsXG4gICcgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiPicsXG4gICcgIDxtZXRhIG5hbWU9XCJmb3JtYXQtZGV0ZWN0aW9uXCIgY29udGVudD1cInRlbGVwaG9uZT1ub1wiPicsXG4gICcgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ1c2VyLXNjYWxhYmxlPW5vLCBpbml0aWFsLXNjYWxlPTEsIG1heGltdW0tc2NhbGU9MSwgbWluaW11bS1zY2FsZT0xLCB3aWR0aD1kZXZpY2Utd2lkdGgsIGhlaWdodD1kZXZpY2UtaGVpZ2h0LCB2aWV3cG9ydC1maXQ9Y292ZXJcIj4nLFxuICAnICA8bWV0YSBuYW1lPVwibXNhcHBsaWNhdGlvbi10YXAtaGlnaGxpZ2h0XCIgY29udGVudD1cIm5vXCI+JyxcbiAgJyAgPG1ldGEgaHR0cC1lcXVpdj1cIkNvbnRlbnQtU2VjdXJpdHktUG9saWN5XCIgY29udGVudD1cImRlZmF1bHQtc3JjICogZ2FwOiBkYXRhOiBibG9iOiBcXCd1bnNhZmUtaW5saW5lXFwnIFxcJ3Vuc2FmZS1ldmFsXFwnIHdzOiB3c3M6O1wiPicsXG5cbiAgLy8gV2UgYXJlIGV4cGxpY2l0bHkgbm90IHVzaW5nIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rOiBpbiBjb3Jkb3ZhIHdlIHNlcnZlIGFzc2V0cyB1cCBkaXJlY3RseSBmcm9tIGRpc2ssIHNvIHJld3JpdGluZyB0aGUgVVJMIGRvZXMgbm90IG1ha2Ugc2Vuc2VcbiAgLi4uKGNzcyB8fCBbXSkubWFwKGZpbGUgPT5cbiAgICB0ZW1wbGF0ZSgnICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgY2xhc3M9XCJfX21ldGVvci1jc3NfX1wiIGhyZWY9XCI8JS0gaHJlZiAlPlwiPicpKHtcbiAgICAgIGhyZWY6IGZpbGUudXJsLFxuICAgIH0pXG4gICksXG5cbiAgJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCI+JyxcbiAgdGVtcGxhdGUoJyAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fID0gSlNPTi5wYXJzZShkZWNvZGVVUklDb21wb25lbnQoPCU9IGNvbmYgJT4pKTsnKSh7XG4gICAgY29uZjogbWV0ZW9yUnVudGltZUNvbmZpZyxcbiAgfSksXG4gICcgICAgaWYgKC9BbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgeycsXG4gIC8vIFdoZW4gQW5kcm9pZCBhcHAgaXMgZW11bGF0ZWQsIGl0IGNhbm5vdCBjb25uZWN0IHRvIGxvY2FsaG9zdCxcbiAgLy8gaW5zdGVhZCBpdCBzaG91bGQgY29ubmVjdCB0byAxMC4wLjIuMlxuICAvLyAodW5sZXNzIHdlXFwncmUgdXNpbmcgYW4gaHR0cCBwcm94eTsgdGhlbiBpdCB3b3JrcyEpXG4gICcgICAgICBpZiAoIV9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uaHR0cFByb3h5UG9ydCkgeycsXG4gICcgICAgICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkwgPSAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTCB8fCBcXCdcXCcpLnJlcGxhY2UoL2xvY2FsaG9zdC9pLCBcXCcxMC4wLjIuMlxcJyk7JyxcbiAgJyAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCA9IChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMIHx8IFxcJ1xcJykucmVwbGFjZSgvbG9jYWxob3N0L2ksIFxcJzEwLjAuMi4yXFwnKTsnLFxuICAnICAgICAgfScsXG4gICcgICAgfScsXG4gICcgIDwvc2NyaXB0PicsXG4gICcnLFxuICAnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCIvY29yZG92YS5qc1wiPjwvc2NyaXB0PicsXG5cbiAgLi4uKGpzIHx8IFtdKS5tYXAoZmlsZSA9PlxuICAgIHRlbXBsYXRlKCcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIjwlLSBzcmMgJT5cIj48L3NjcmlwdD4nKSh7XG4gICAgICBzcmM6IGZpbGUudXJsLFxuICAgIH0pXG4gICksXG5cbiAgLi4uKGFkZGl0aW9uYWxTdGF0aWNKcyB8fCBbXSkubWFwKCh7IGNvbnRlbnRzLCBwYXRobmFtZSB9KSA9PiAoXG4gICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcbiAgICAgID8gdGVtcGxhdGUoJyAgPHNjcmlwdD48JT0gY29udGVudHMgJT48L3NjcmlwdD4nKSh7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgfSlcbiAgICAgIDogdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcbiAgICAgICAgc3JjOiByb290VXJsUGF0aFByZWZpeCArIHBhdGhuYW1lXG4gICAgICB9KVxuICApKSxcbiAgJycsXG4gIGhlYWQsXG4gICc8L2hlYWQ+JyxcbiAgJycsXG4gICc8Ym9keT4nLFxuXS5qb2luKCdcXG4nKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlVGVtcGxhdGUoKSB7XG4gIHJldHVybiBcIjwvYm9keT5cXG48L2h0bWw+XCI7XG59XG4iLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuXG4vLyBBcyBpZGVudGlmaWVkIGluIGlzc3VlICM5MTQ5LCB3aGVuIGFuIGFwcGxpY2F0aW9uIG92ZXJyaWRlcyB0aGUgZGVmYXVsdFxuLy8gXy50ZW1wbGF0ZSBzZXR0aW5ncyB1c2luZyBfLnRlbXBsYXRlU2V0dGluZ3MsIHRob3NlIG5ldyBzZXR0aW5ncyBhcmVcbi8vIHVzZWQgYW55d2hlcmUgXy50ZW1wbGF0ZSBpcyB1c2VkLCBpbmNsdWRpbmcgd2l0aGluIHRoZVxuLy8gYm9pbGVycGxhdGUtZ2VuZXJhdG9yLiBUbyBoYW5kbGUgdGhpcywgXy50ZW1wbGF0ZSBzZXR0aW5ncyB0aGF0IGhhdmVcbi8vIGJlZW4gdmVyaWZpZWQgdG8gd29yayBhcmUgb3ZlcnJpZGRlbiBoZXJlIG9uIGVhY2ggXy50ZW1wbGF0ZSBjYWxsLlxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVtcGxhdGUodGV4dCkge1xuICByZXR1cm4gXy50ZW1wbGF0ZSh0ZXh0LCBudWxsLCB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZyxcbiAgfSk7XG59O1xuIl19

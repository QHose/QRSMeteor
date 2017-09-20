(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-server'].Symbol;
var Map = Package['ecmascript-runtime-server'].Map;
var Set = Package['ecmascript-runtime-server'].Set;

var require = meteorInstall({"node_modules":{"meteor":{"shell-server":{"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/shell-server/main.js                                                                                   //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.watch(require("./shell-server.js"), {                                                                       // 1
  "*": module.makeNsSetter()                                                                                       // 1
}, 0);                                                                                                             // 1
var listen = void 0;                                                                                               // 1
module.watch(require("./shell-server.js"), {                                                                       // 1
  listen: function (v) {                                                                                           // 1
    listen = v;                                                                                                    // 1
  }                                                                                                                // 1
}, 1);                                                                                                             // 1
var shellDir = process.env.METEOR_SHELL_DIR;                                                                       // 4
                                                                                                                   //
if (shellDir) {                                                                                                    // 5
  listen(shellDir);                                                                                                // 6
}                                                                                                                  // 7
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"shell-server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/shell-server/shell-server.js                                                                           //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                            //
                                                                                                                   //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                   //
                                                                                                                   //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                            //
                                                                                                                   //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                   //
                                                                                                                   //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                  //
                                                                                                                   //
var module1 = module;                                                                                              // 1
module1.export({                                                                                                   // 1
  listen: function () {                                                                                            // 1
    return listen;                                                                                                 // 1
  },                                                                                                               // 1
  disable: function () {                                                                                           // 1
    return disable;                                                                                                // 1
  }                                                                                                                // 1
});                                                                                                                // 1
                                                                                                                   //
var assert = require("assert");                                                                                    // 1
                                                                                                                   //
var path = require("path");                                                                                        // 2
                                                                                                                   //
var stream = require("stream");                                                                                    // 3
                                                                                                                   //
var fs = require("fs");                                                                                            // 4
                                                                                                                   //
var net = require("net");                                                                                          // 5
                                                                                                                   //
var vm = require("vm");                                                                                            // 6
                                                                                                                   //
var _ = require("underscore");                                                                                     // 7
                                                                                                                   //
var INFO_FILE_MODE = parseInt("600", 8); // Only the owner can read or write.                                      // 8
                                                                                                                   //
var EXITING_MESSAGE = "Shell exiting..."; // Invoked by the server process to listen for incoming connections from
// shell clients. Each connection gets its own REPL instance.                                                      // 12
                                                                                                                   //
function listen(shellDir) {                                                                                        // 13
  function callback() {                                                                                            // 14
    new Server(shellDir).listen();                                                                                 // 15
  } // If the server is still in the very early stages of starting up,                                             // 16
  // Meteor.startup may not available yet.                                                                         // 19
                                                                                                                   //
                                                                                                                   //
  if ((typeof Meteor === "undefined" ? "undefined" : (0, _typeof3.default)(Meteor)) === "object") {                // 20
    Meteor.startup(callback);                                                                                      // 21
  } else if ((typeof __meteor_bootstrap__ === "undefined" ? "undefined" : (0, _typeof3.default)(__meteor_bootstrap__)) === "object") {
    var hooks = __meteor_bootstrap__.startupHooks;                                                                 // 23
                                                                                                                   //
    if (hooks) {                                                                                                   // 24
      hooks.push(callback);                                                                                        // 25
    } else {                                                                                                       // 26
      // As a fallback, just call the callback asynchronously.                                                     // 27
      setImmediate(callback);                                                                                      // 28
    }                                                                                                              // 29
  }                                                                                                                // 30
}                                                                                                                  // 31
                                                                                                                   //
function disable(shellDir) {                                                                                       // 34
  try {                                                                                                            // 35
    // Replace info.json with a file that says the shell server is                                                 // 36
    // disabled, so that any connected shell clients will fail to                                                  // 37
    // reconnect after the server process closes their sockets.                                                    // 38
    fs.writeFileSync(getInfoFile(shellDir), JSON.stringify({                                                       // 39
      status: "disabled",                                                                                          // 42
      reason: "Shell server has shut down."                                                                        // 43
    }) + "\n", {                                                                                                   // 41
      mode: INFO_FILE_MODE                                                                                         // 45
    });                                                                                                            // 45
  } catch (ignored) {}                                                                                             // 47
}                                                                                                                  // 48
                                                                                                                   //
var Server = function () {                                                                                         //
  function Server(shellDir) {                                                                                      // 51
    (0, _classCallCheck3.default)(this, Server);                                                                   // 51
    var self = this;                                                                                               // 52
    assert.ok(self instanceof Server);                                                                             // 53
    self.shellDir = shellDir;                                                                                      // 55
    self.key = Math.random().toString(36).slice(2);                                                                // 56
    self.server = net.createServer(function (socket) {                                                             // 58
      self.onConnection(socket);                                                                                   // 59
    }).on("error", function (err) {                                                                                // 60
      console.error(err.stack);                                                                                    // 61
    });                                                                                                            // 62
  }                                                                                                                // 63
                                                                                                                   //
  Server.prototype.listen = function () {                                                                          //
    function listen() {                                                                                            //
      var self = this;                                                                                             // 66
      var infoFile = getInfoFile(self.shellDir);                                                                   // 67
      fs.unlink(infoFile, function () {                                                                            // 69
        self.server.listen(0, "127.0.0.1", function () {                                                           // 70
          fs.writeFileSync(infoFile, JSON.stringify({                                                              // 71
            status: "enabled",                                                                                     // 72
            port: self.server.address().port,                                                                      // 73
            key: self.key                                                                                          // 74
          }) + "\n", {                                                                                             // 71
            mode: INFO_FILE_MODE                                                                                   // 76
          });                                                                                                      // 75
        });                                                                                                        // 78
      });                                                                                                          // 79
    }                                                                                                              // 80
                                                                                                                   //
    return listen;                                                                                                 //
  }();                                                                                                             //
                                                                                                                   //
  Server.prototype.onConnection = function () {                                                                    //
    function onConnection(socket) {                                                                                //
      var self = this; // Make sure this function doesn't try to write anything to the socket                      // 83
      // after it has been closed.                                                                                 // 86
                                                                                                                   //
      socket.on("close", function () {                                                                             // 87
        socket = null;                                                                                             // 88
      }); // If communication is not established within 1000ms of the first                                        // 89
      // connection, forcibly close the socket.                                                                    // 92
                                                                                                                   //
      var timeout = setTimeout(function () {                                                                       // 93
        if (socket) {                                                                                              // 94
          socket.removeAllListeners("data");                                                                       // 95
          socket.end(EXITING_MESSAGE + "\n");                                                                      // 96
        }                                                                                                          // 97
      }, 1000); // Let connecting clients configure certain REPL options by sending a                              // 98
      // JSON object over the socket. For example, only the client knows                                           // 101
      // whether it's running a TTY or an Emacs subshell or some other kind of                                     // 102
      // terminal, so the client must decide the value of options.terminal.                                        // 103
                                                                                                                   //
      readJSONFromStream(socket, function (error, options, replInputSocket) {                                      // 104
        clearTimeout(timeout);                                                                                     // 105
                                                                                                                   //
        if (error) {                                                                                               // 107
          socket = null;                                                                                           // 108
          console.error(error.stack);                                                                              // 109
          return;                                                                                                  // 110
        }                                                                                                          // 111
                                                                                                                   //
        if (options.key !== self.key) {                                                                            // 113
          if (socket) {                                                                                            // 114
            socket.end(EXITING_MESSAGE + "\n");                                                                    // 115
          }                                                                                                        // 116
                                                                                                                   //
          return;                                                                                                  // 117
        }                                                                                                          // 118
                                                                                                                   //
        delete options.key; // Set the columns to what is being requested by the client.                           // 119
                                                                                                                   //
        if (options.columns && socket) {                                                                           // 122
          socket.columns = options.columns;                                                                        // 123
        }                                                                                                          // 124
                                                                                                                   //
        delete options.columns;                                                                                    // 125
                                                                                                                   //
        if (options.evaluateAndExit) {                                                                             // 127
          evalCommand.call(Object.create(null), // Dummy repl object without ._RecoverableError.                   // 128
          options.evaluateAndExit.command, null, // evalCommand ignores the context parameter, anyway              // 130
          options.evaluateAndExit.filename || "<meteor shell>", function (error, result) {                         // 132
            if (socket) {                                                                                          // 134
              var message = error ? {                                                                              // 135
                error: error + "",                                                                                 // 136
                code: 1                                                                                            // 137
              } : {                                                                                                // 135
                result: result                                                                                     // 139
              }; // Sending back a JSON payload allows the client to                                               // 138
              // distinguish between errors and successful results.                                                // 143
                                                                                                                   //
              socket.end(JSON.stringify(message) + "\n");                                                          // 144
            }                                                                                                      // 145
          });                                                                                                      // 146
          return;                                                                                                  // 148
        }                                                                                                          // 149
                                                                                                                   //
        delete options.evaluateAndExit; // Immutable options.                                                      // 150
                                                                                                                   //
        _.extend(options, {                                                                                        // 153
          input: replInputSocket,                                                                                  // 154
          output: socket                                                                                           // 155
        }); // Overridable options.                                                                                // 153
                                                                                                                   //
                                                                                                                   //
        _.defaults(options, {                                                                                      // 159
          prompt: "> ",                                                                                            // 160
          terminal: true,                                                                                          // 161
          useColors: true,                                                                                         // 162
          useGlobal: true,                                                                                         // 163
          ignoreUndefined: true                                                                                    // 164
        });                                                                                                        // 159
                                                                                                                   //
        self.startREPL(options);                                                                                   // 167
      });                                                                                                          // 168
    }                                                                                                              // 169
                                                                                                                   //
    return onConnection;                                                                                           //
  }();                                                                                                             //
                                                                                                                   //
  Server.prototype.startREPL = function () {                                                                       //
    function startREPL(options) {                                                                                  //
      var self = this; // Make sure this function doesn't try to write anything to the output                      // 172
      // stream after it has been closed.                                                                          // 175
                                                                                                                   //
      options.output.on("close", function () {                                                                     // 176
        options.output = null;                                                                                     // 177
      });                                                                                                          // 178
                                                                                                                   //
      var repl = self.repl = require("repl").start(options); // History persists across shell sessions!            // 180
                                                                                                                   //
                                                                                                                   //
      self.initializeHistory(); // Save the global `_` object in the server.  This is probably defined by the      // 183
      // underscore package.  It is unlikely to be the same object as the `var _ =                                 // 186
      // require('underscore')` in this file!                                                                      // 187
                                                                                                                   //
      var originalUnderscore = repl.context._;                                                                     // 188
      Object.defineProperty(repl.context, "_", {                                                                   // 190
        // Force the global _ variable to remain bound to underscore.                                              // 191
        get: function () {                                                                                         // 192
          return originalUnderscore;                                                                               // 192
        },                                                                                                         // 192
        // Expose the last REPL result as __ instead of _.                                                         // 194
        set: function (lastResult) {                                                                               // 195
          repl.context.__ = lastResult;                                                                            // 196
        },                                                                                                         // 197
        enumerable: true,                                                                                          // 199
        // Allow this property to be (re)defined more than once (e.g. each                                         // 201
        // time the server restarts).                                                                              // 202
        configurable: true                                                                                         // 203
      });                                                                                                          // 190
      setRequireAndModule(repl.context);                                                                           // 206
      repl.context.repl = repl; // Some improvements to the existing help messages.                                // 208
                                                                                                                   //
      function addHelp(cmd, helpText) {                                                                            // 211
        var info = repl.commands[cmd] || repl.commands["." + cmd];                                                 // 212
                                                                                                                   //
        if (info) {                                                                                                // 213
          info.help = helpText;                                                                                    // 214
        }                                                                                                          // 215
      }                                                                                                            // 216
                                                                                                                   //
      addHelp("break", "Terminate current command input and display new prompt");                                  // 217
      addHelp("exit", "Disconnect from server and leave shell");                                                   // 218
      addHelp("help", "Show this help information"); // When the REPL exits, signal the attached client to exit by sending it
      // the special EXITING_MESSAGE.                                                                              // 222
                                                                                                                   //
      repl.on("exit", function () {                                                                                // 223
        if (options.output) {                                                                                      // 224
          options.output.write(EXITING_MESSAGE + "\n");                                                            // 225
          options.output.end();                                                                                    // 226
        }                                                                                                          // 227
      }); // When the server process exits, end the output stream but do not                                       // 228
      // signal the attached client to exit.                                                                       // 231
                                                                                                                   //
      process.on("exit", function () {                                                                             // 232
        if (options.output) {                                                                                      // 233
          options.output.end();                                                                                    // 234
        }                                                                                                          // 235
      }); // This Meteor-specific shell command rebuilds the application as if a                                   // 236
      // change was made to server code.                                                                           // 239
                                                                                                                   //
      repl.defineCommand("reload", {                                                                               // 240
        help: "Restart the server and the shell",                                                                  // 241
        action: function () {                                                                                      // 242
          process.exit(0);                                                                                         // 243
        }                                                                                                          // 244
      }); // TODO: Node 6: Revisit this as repl._RecoverableError is now exported.                                 // 240
      //       as `Recoverable` from `repl`.  Maybe revisit this entirely                                          // 248
      //       as the docs have been updated too:                                                                  // 249
      //       https://nodejs.org/api/repl.html#repl_custom_evaluation_functions                                   // 250
      //       https://github.com/nodejs/node/blob/v6.x/lib/repl.js#L1398                                          // 251
      // Trigger one recoverable error using the default eval function, just                                       // 252
      // to capture the Recoverable error constructor, so that our custom                                          // 253
      // evalCommand function can wrap recoverable errors properly.                                                // 254
                                                                                                                   //
      repl.eval("{", null, "<meteor shell>", function (error) {                                                    // 255
        // Capture the Recoverable error constructor.                                                              // 258
        repl._RecoverableError = error && error.constructor; // Now set repl.eval to the actual evalCommand function that we want
        // to use, bound to repl._domain if necessary.                                                             // 262
                                                                                                                   //
        repl.eval = repl._domain ? repl._domain.bind(evalCommand) : evalCommand; // Terminate the partial evaluation of the { command.
                                                                                                                   //
        repl.commands["break"].action.call(repl);                                                                  // 268
      });                                                                                                          // 269
    }                                                                                                              // 271
                                                                                                                   //
    return startREPL;                                                                                              //
  }(); // This function allows a persistent history of shell commands to be saved                                  //
  // to and loaded from .meteor/local/shell-history.                                                               // 274
                                                                                                                   //
                                                                                                                   //
  Server.prototype.initializeHistory = function () {                                                               //
    function initializeHistory() {                                                                                 //
      var self = this;                                                                                             // 276
      var rli = self.repl.rli;                                                                                     // 277
      var historyFile = getHistoryFile(self.shellDir);                                                             // 278
      var historyFd = fs.openSync(historyFile, "a+");                                                              // 279
      var historyLines = fs.readFileSync(historyFile, "utf8").split("\n");                                         // 280
      var seenLines = Object.create(null);                                                                         // 281
                                                                                                                   //
      if (!rli.history) {                                                                                          // 283
        rli.history = [];                                                                                          // 284
        rli.historyIndex = -1;                                                                                     // 285
      }                                                                                                            // 286
                                                                                                                   //
      while (rli.history && historyLines.length > 0) {                                                             // 288
        var line = historyLines.pop();                                                                             // 289
                                                                                                                   //
        if (line && /\S/.test(line) && !seenLines[line]) {                                                         // 290
          rli.history.push(line);                                                                                  // 291
          seenLines[line] = true;                                                                                  // 292
        }                                                                                                          // 293
      }                                                                                                            // 294
                                                                                                                   //
      rli.addListener("line", function (line) {                                                                    // 296
        if (historyFd >= 0 && /\S/.test(line)) {                                                                   // 297
          fs.writeSync(historyFd, line + "\n");                                                                    // 298
        }                                                                                                          // 299
      });                                                                                                          // 300
      self.repl.on("exit", function () {                                                                           // 302
        fs.closeSync(historyFd);                                                                                   // 303
        historyFd = -1;                                                                                            // 304
      });                                                                                                          // 305
    }                                                                                                              // 306
                                                                                                                   //
    return initializeHistory;                                                                                      //
  }();                                                                                                             //
                                                                                                                   //
  return Server;                                                                                                   //
}();                                                                                                               //
                                                                                                                   //
function readJSONFromStream(inputStream, callback) {                                                               // 309
  var outputStream = new stream.PassThrough();                                                                     // 310
  var dataSoFar = "";                                                                                              // 311
                                                                                                                   //
  function onData(buffer) {                                                                                        // 313
    var lines = buffer.toString("utf8").split("\n");                                                               // 314
                                                                                                                   //
    while (lines.length > 0) {                                                                                     // 316
      dataSoFar += lines.shift();                                                                                  // 317
                                                                                                                   //
      try {                                                                                                        // 319
        var json = JSON.parse(dataSoFar);                                                                          // 320
      } catch (error) {                                                                                            // 321
        if (error instanceof SyntaxError) {                                                                        // 322
          continue;                                                                                                // 323
        }                                                                                                          // 324
                                                                                                                   //
        return finish(error);                                                                                      // 326
      }                                                                                                            // 327
                                                                                                                   //
      if (lines.length > 0) {                                                                                      // 329
        outputStream.write(lines.join("\n"));                                                                      // 330
      }                                                                                                            // 331
                                                                                                                   //
      inputStream.pipe(outputStream);                                                                              // 333
      return finish(null, json);                                                                                   // 335
    }                                                                                                              // 336
  }                                                                                                                // 337
                                                                                                                   //
  function onClose() {                                                                                             // 339
    finish(new Error("stream unexpectedly closed"));                                                               // 340
  }                                                                                                                // 341
                                                                                                                   //
  var finished = false;                                                                                            // 343
                                                                                                                   //
  function finish(error, json) {                                                                                   // 344
    if (!finished) {                                                                                               // 345
      finished = true;                                                                                             // 346
      inputStream.removeListener("data", onData);                                                                  // 347
      inputStream.removeListener("error", finish);                                                                 // 348
      inputStream.removeListener("close", onClose);                                                                // 349
      callback(error, json, outputStream);                                                                         // 350
    }                                                                                                              // 351
  }                                                                                                                // 352
                                                                                                                   //
  inputStream.on("data", onData);                                                                                  // 354
  inputStream.on("error", finish);                                                                                 // 355
  inputStream.on("close", onClose);                                                                                // 356
}                                                                                                                  // 357
                                                                                                                   //
function getInfoFile(shellDir) {                                                                                   // 359
  return path.join(shellDir, "info.json");                                                                         // 360
}                                                                                                                  // 361
                                                                                                                   //
function getHistoryFile(shellDir) {                                                                                // 363
  return path.join(shellDir, "history");                                                                           // 364
} // Shell commands need to be executed in a Fiber in case they call into                                          // 365
// code that yields. Using a Promise is an even better idea, since it runs                                         // 368
// its callbacks in Fibers drawn from a pool, so the Fibers are recycled.                                          // 369
                                                                                                                   //
                                                                                                                   //
var evalCommandPromise = Promise.resolve();                                                                        // 370
                                                                                                                   //
function evalCommand(command, context, filename, callback) {                                                       // 372
  var repl = this;                                                                                                 // 373
                                                                                                                   //
  function wrapErrorIfRecoverable(error) {                                                                         // 375
    if (repl._RecoverableError && isRecoverableError(error, repl)) {                                               // 376
      return new repl._RecoverableError(error);                                                                    // 378
    } else {                                                                                                       // 379
      return error;                                                                                                // 380
    }                                                                                                              // 381
  }                                                                                                                // 382
                                                                                                                   //
  if (Package.ecmascript) {                                                                                        // 384
    var noParens = stripParens(command);                                                                           // 385
                                                                                                                   //
    if (noParens !== command) {                                                                                    // 386
      var classMatch = /^\s*class\s+(\w+)/.exec(noParens);                                                         // 387
                                                                                                                   //
      if (classMatch && classMatch[1] !== "extends") {                                                             // 388
        // If the command looks like a named ES2015 class, we remove the                                           // 389
        // extra layer of parentheses added by the REPL so that the                                                // 390
        // command will be evaluated as a class declaration rather than as                                         // 391
        // a named class expression. Note that you can still type (class A                                         // 392
        // {}) explicitly to evaluate a named class expression. The REPL                                           // 393
        // code that calls evalCommand handles named function expressions                                          // 394
        // similarly (first with and then without parentheses), but that                                           // 395
        // code doesn't know about ES2015 classes, which is why we have to                                         // 396
        // handle them here.                                                                                       // 397
        command = noParens;                                                                                        // 398
      }                                                                                                            // 399
    }                                                                                                              // 400
                                                                                                                   //
    try {                                                                                                          // 402
      command = Package.ecmascript.ECMAScript.compileForShell(command);                                            // 403
    } catch (error) {                                                                                              // 404
      callback(wrapErrorIfRecoverable(error));                                                                     // 405
      return;                                                                                                      // 406
    }                                                                                                              // 407
  }                                                                                                                // 408
                                                                                                                   //
  try {                                                                                                            // 410
    var script = new vm.Script(command, {                                                                          // 411
      filename: filename,                                                                                          // 412
      displayErrors: false                                                                                         // 413
    });                                                                                                            // 411
  } catch (parseError) {                                                                                           // 415
    callback(wrapErrorIfRecoverable(parseError));                                                                  // 416
    return;                                                                                                        // 417
  }                                                                                                                // 418
                                                                                                                   //
  evalCommandPromise.then(function () {                                                                            // 420
    if (repl.input) {                                                                                              // 421
      callback(null, script.runInThisContext());                                                                   // 422
    } else {                                                                                                       // 423
      // If repl didn't start, `require` and `module` are not visible                                              // 424
      // in the vm context.                                                                                        // 425
      setRequireAndModule(global);                                                                                 // 426
      callback(null, script.runInThisContext());                                                                   // 427
    }                                                                                                              // 428
  }).catch(callback);                                                                                              // 429
}                                                                                                                  // 430
                                                                                                                   //
function stripParens(command) {                                                                                    // 432
  if (command.charAt(0) === "(" && command.charAt(command.length - 1) === ")") {                                   // 433
    return command.slice(1, command.length - 1);                                                                   // 435
  }                                                                                                                // 436
                                                                                                                   //
  return command;                                                                                                  // 437
} // The bailOnIllegalToken and isRecoverableError functions are taken from                                        // 438
// https://github.com/nodejs/node/blob/c9e670ea2a/lib/repl.js#L1227-L1253                                          // 441
                                                                                                                   //
                                                                                                                   //
function bailOnIllegalToken(parser) {                                                                              // 442
  return parser._literal === null && !parser.blockComment && !parser.regExpLiteral;                                // 443
} // If the error is that we've unexpectedly ended the input,                                                      // 446
// then let the user try to recover by adding more input.                                                          // 449
                                                                                                                   //
                                                                                                                   //
function isRecoverableError(e, repl) {                                                                             // 450
  if (e && e.name === 'SyntaxError') {                                                                             // 451
    var message = e.message;                                                                                       // 452
                                                                                                                   //
    if (message === 'Unterminated template literal' || message === 'Missing } in template expression') {           // 453
      repl._inTemplateLiteral = true;                                                                              // 455
      return true;                                                                                                 // 456
    }                                                                                                              // 457
                                                                                                                   //
    if (message.startsWith('Unexpected end of input') || message.startsWith('missing ) after argument list') || message.startsWith('Unexpected token')) {
      return true;                                                                                                 // 462
    }                                                                                                              // 463
                                                                                                                   //
    if (message === 'Invalid or unexpected token') {                                                               // 465
      return !bailOnIllegalToken(repl.lineParser);                                                                 // 466
    }                                                                                                              // 467
  }                                                                                                                // 468
                                                                                                                   //
  return false;                                                                                                    // 470
}                                                                                                                  // 471
                                                                                                                   //
function setRequireAndModule(context) {                                                                            // 473
  if (Package.modules) {                                                                                           // 474
    // Use the same `require` function and `module` object visible to the                                          // 475
    // application.                                                                                                // 476
    var toBeInstalled = {};                                                                                        // 477
    var shellModuleName = "meteor-shell-" + Math.random().toString(36).slice(2) + ".js";                           // 478
                                                                                                                   //
    toBeInstalled[shellModuleName] = function (require, exports, module) {                                         // 481
      context.module = module;                                                                                     // 482
      context.require = require; // Tab completion sometimes uses require.extensions, but only for                 // 483
      // the keys.                                                                                                 // 486
                                                                                                                   //
      require.extensions = {                                                                                       // 487
        ".js": true,                                                                                               // 488
        ".json": true,                                                                                             // 489
        ".node": true                                                                                              // 490
      };                                                                                                           // 487
    }; // This populates repl.context.{module,require} by evaluating the                                           // 492
    // module defined above.                                                                                       // 495
                                                                                                                   //
                                                                                                                   //
    Package.modules.meteorInstall(toBeInstalled)("./" + shellModuleName);                                          // 496
  }                                                                                                                // 497
}                                                                                                                  // 498
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("./node_modules/meteor/shell-server/main.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['shell-server'] = exports;

})();

//# sourceMappingURL=shell-server.js.map

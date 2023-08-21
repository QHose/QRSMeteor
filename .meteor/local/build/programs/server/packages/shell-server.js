(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var socket;

var require = meteorInstall({"node_modules":{"meteor":{"shell-server":{"main.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/shell-server/main.js                                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.watch(require("./shell-server.js"), {
  "*": module.makeNsSetter()
}, 0);
let listen;
module.watch(require("./shell-server.js"), {
  listen(v) {
    listen = v;
  }

}, 1);
const shellDir = process.env.METEOR_SHELL_DIR;

if (shellDir) {
  listen(shellDir);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"shell-server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/shell-server/shell-server.js                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const module1 = module;
module1.export({
  listen: () => listen,
  disable: () => disable
});
let assert;
module1.watch(require("assert"), {
  default(v) {
    assert = v;
  }

}, 0);
let pathJoin;
module1.watch(require("path"), {
  join(v) {
    pathJoin = v;
  }

}, 1);
let PassThrough;
module1.watch(require("stream"), {
  PassThrough(v) {
    PassThrough = v;
  }

}, 2);
let closeSync, openSync, readFileSync, unlink, writeFileSync, writeSync;
module1.watch(require("fs"), {
  closeSync(v) {
    closeSync = v;
  },

  openSync(v) {
    openSync = v;
  },

  readFileSync(v) {
    readFileSync = v;
  },

  unlink(v) {
    unlink = v;
  },

  writeFileSync(v) {
    writeFileSync = v;
  },

  writeSync(v) {
    writeSync = v;
  }

}, 3);
let createServer;
module1.watch(require("net"), {
  createServer(v) {
    createServer = v;
  }

}, 4);
let replStart;
module1.watch(require("repl"), {
  start(v) {
    replStart = v;
  }

}, 5);
const INFO_FILE_MODE = parseInt("600", 8); // Only the owner can read or write.

const EXITING_MESSAGE = "Shell exiting..."; // Invoked by the server process to listen for incoming connections from
// shell clients. Each connection gets its own REPL instance.

function listen(shellDir) {
  function callback() {
    new Server(shellDir).listen();
  } // If the server is still in the very early stages of starting up,
  // Meteor.startup may not available yet.


  if (typeof Meteor === "object") {
    Meteor.startup(callback);
  } else if (typeof __meteor_bootstrap__ === "object") {
    const hooks = __meteor_bootstrap__.startupHooks;

    if (hooks) {
      hooks.push(callback);
    } else {
      // As a fallback, just call the callback asynchronously.
      setImmediate(callback);
    }
  }
}

function disable(shellDir) {
  try {
    // Replace info.json with a file that says the shell server is
    // disabled, so that any connected shell clients will fail to
    // reconnect after the server process closes their sockets.
    writeFileSync(getInfoFile(shellDir), JSON.stringify({
      status: "disabled",
      reason: "Shell server has shut down."
    }) + "\n", {
      mode: INFO_FILE_MODE
    });
  } catch (ignored) {}
}

// Shell commands need to be executed in a Fiber in case they call into
// code that yields. Using a Promise is an even better idea, since it runs
// its callbacks in Fibers drawn from a pool, so the Fibers are recycled.
const evalCommandPromise = Promise.resolve();

class Server {
  constructor(shellDir) {
    assert.ok(this instanceof Server);
    this.shellDir = shellDir;
    this.key = Math.random().toString(36).slice(2);
    this.server = createServer(socket => {
      this.onConnection(socket);
    }).on("error", err => {
      console.error(err.stack);
    });
  }

  listen() {
    const infoFile = getInfoFile(this.shellDir);
    unlink(infoFile, () => {
      this.server.listen(0, "127.0.0.1", () => {
        writeFileSync(infoFile, JSON.stringify({
          status: "enabled",
          port: this.server.address().port,
          key: this.key
        }) + "\n", {
          mode: INFO_FILE_MODE
        });
      });
    });
  }

  onConnection(socket) {
    // Make sure this function doesn't try to write anything to the socket
    // after it has been closed.
    socket.on("close", function () {
      socket = null;
    }); // If communication is not established within 1000ms of the first
    // connection, forcibly close the socket.

    const timeout = setTimeout(function () {
      if (socket) {
        socket.removeAllListeners("data");
        socket.end(EXITING_MESSAGE + "\n");
      }
    }, 1000); // Let connecting clients configure certain REPL options by sending a
    // JSON object over the socket. For example, only the client knows
    // whether it's running a TTY or an Emacs subshell or some other kind of
    // terminal, so the client must decide the value of options.terminal.

    readJSONFromStream(socket, (error, options, replInputSocket) => {
      clearTimeout(timeout);

      if (error) {
        socket = null;
        console.error(error.stack);
        return;
      }

      if (options.key !== this.key) {
        if (socket) {
          socket.end(EXITING_MESSAGE + "\n");
        }

        return;
      }

      delete options.key; // Set the columns to what is being requested by the client.

      if (options.columns && socket) {
        socket.columns = options.columns;
      }

      delete options.columns;
      options = Object.assign(Object.create(null), // Defaults for configurable options.
      {
        prompt: "> ",
        terminal: true,
        useColors: true,
        ignoreUndefined: true
      }, // Configurable options
      options, // Immutable options.
      {
        input: replInputSocket,
        useGlobal: false,
        output: socket
      }); // The prompt during an evaluateAndExit must be blank to ensure
      // that the prompt doesn't inadvertently get parsed as part of
      // the JSON communication channel.

      if (options.evaluateAndExit) {
        options.prompt = "";
      } // Start the REPL.


      this.startREPL(options);

      if (options.evaluateAndExit) {
        this._wrappedDefaultEval.call(Object.create(null), options.evaluateAndExit.command, global, options.evaluateAndExit.filename || "<meteor shell>", function (error, result) {
          if (socket) {
            function sendResultToSocket(message) {
              // Sending back a JSON payload allows the client to
              // distinguish between errors and successful results.
              socket.end(JSON.stringify(message) + "\n");
            }

            if (error) {
              sendResultToSocket({
                error: error.toString(),
                code: 1
              });
            } else {
              sendResultToSocket({
                result
              });
            }
          }
        });

        return;
      }

      delete options.evaluateAndExit;
      this.enableInteractiveMode(options);
    });
  }

  startREPL(options) {
    // Make sure this function doesn't try to write anything to the output
    // stream after it has been closed.
    options.output.on("close", function () {
      options.output = null;
    });
    const repl = this.repl = replStart(options); // This is technique of setting `repl.context` is similar to how the
    // `useGlobal` option would work during a normal `repl.start()` and
    // allows shell access (and tab completion!) to Meteor globals (i.e.
    // Underscore _, Meteor, etc.). By using this technique, which changes
    // the context after startup, we avoid stomping on the special `_`
    // variable (in `repl` this equals the value of the last command) from
    // being overridden in the client/server socket-handshaking.  Furthermore,
    // by setting `useGlobal` back to true, we allow the default eval function
    // to use the desired `runInThisContext` method (https://git.io/vbvAB).

    repl.context = global;
    repl.useGlobal = true;
    setRequireAndModule(repl.context); // In order to avoid duplicating code here, specifically the complexities
    // of catching so-called "Recoverable Errors" (https://git.io/vbvbl),
    // we will wrap the default eval, run it in a Fiber (via a Promise), and
    // give it the opportunity to decide if the user is mid-code-block.

    const defaultEval = repl.eval;

    function wrappedDefaultEval(code, context, file, callback) {
      if (Package.ecmascript) {
        try {
          code = Package.ecmascript.ECMAScript.compileForShell(code);
        } catch (err) {// Any Babel error here might be just fine since it's
          // possible the code was incomplete (multi-line code on the REPL).
          // The defaultEval below will use its own functionality to determine
          // if this error is "recoverable".
        }
      }

      evalCommandPromise.then(() => defaultEval(code, context, file, callback)).catch(callback);
    } // Have the REPL use the newly wrapped function instead and store the
    // _wrappedDefaultEval so that evalulateAndExit calls can use it directly.


    repl.eval = this._wrappedDefaultEval = wrappedDefaultEval;
  }

  enableInteractiveMode(options) {
    // History persists across shell sessions!
    this.initializeHistory();
    const repl = this.repl; // Implement an alternate means of fetching the return value,
    // via `__` (double underscore) as originally implemented in:
    // https://github.com/meteor/meteor/commit/2443d832265c7d1c

    Object.defineProperty(repl.context, "__", {
      get: () => repl.last,
      set: val => {
        repl.last = val;
      },
      // Allow this property to be (re)defined more than once (e.g. each
      // time the server restarts).
      configurable: true
    }); // Some improvements to the existing help messages.

    function addHelp(cmd, helpText) {
      const info = repl.commands[cmd] || repl.commands["." + cmd];

      if (info) {
        info.help = helpText;
      }
    }

    addHelp("break", "Terminate current command input and display new prompt");
    addHelp("exit", "Disconnect from server and leave shell");
    addHelp("help", "Show this help information"); // When the REPL exits, signal the attached client to exit by sending it
    // the special EXITING_MESSAGE.

    repl.on("exit", function () {
      if (options.output) {
        options.output.write(EXITING_MESSAGE + "\n");
        options.output.end();
      }
    }); // When the server process exits, end the output stream but do not
    // signal the attached client to exit.

    process.on("exit", function () {
      if (options.output) {
        options.output.end();
      }
    }); // This Meteor-specific shell command rebuilds the application as if a
    // change was made to server code.

    repl.defineCommand("reload", {
      help: "Restart the server and the shell",
      action: function () {
        process.exit(0);
      }
    });
  } // This function allows a persistent history of shell commands to be saved
  // to and loaded from .meteor/local/shell-history.


  initializeHistory() {
    const rli = this.repl.rli;
    const historyFile = getHistoryFile(this.shellDir);
    let historyFd = openSync(historyFile, "a+");
    const historyLines = readFileSync(historyFile, "utf8").split("\n");
    const seenLines = Object.create(null);

    if (!rli.history) {
      rli.history = [];
      rli.historyIndex = -1;
    }

    while (rli.history && historyLines.length > 0) {
      const line = historyLines.pop();

      if (line && /\S/.test(line) && !seenLines[line]) {
        rli.history.push(line);
        seenLines[line] = true;
      }
    }

    rli.addListener("line", function (line) {
      if (historyFd >= 0 && /\S/.test(line)) {
        writeSync(historyFd, line + "\n");
      }
    });
    this.repl.on("exit", function () {
      closeSync(historyFd);
      historyFd = -1;
    });
  }

}

function readJSONFromStream(inputStream, callback) {
  const outputStream = new PassThrough();
  let dataSoFar = "";

  function onData(buffer) {
    const lines = buffer.toString("utf8").split("\n");

    while (lines.length > 0) {
      dataSoFar += lines.shift();
      let json;

      try {
        json = JSON.parse(dataSoFar);
      } catch (error) {
        if (error instanceof SyntaxError) {
          continue;
        }

        return finish(error);
      }

      if (lines.length > 0) {
        outputStream.write(lines.join("\n"));
      }

      inputStream.pipe(outputStream);
      return finish(null, json);
    }
  }

  function onClose() {
    finish(new Error("stream unexpectedly closed"));
  }

  let finished = false;

  function finish(error, json) {
    if (!finished) {
      finished = true;
      inputStream.removeListener("data", onData);
      inputStream.removeListener("error", finish);
      inputStream.removeListener("close", onClose);
      callback(error, json, outputStream);
    }
  }

  inputStream.on("data", onData);
  inputStream.on("error", finish);
  inputStream.on("close", onClose);
}

function getInfoFile(shellDir) {
  return pathJoin(shellDir, "info.json");
}

function getHistoryFile(shellDir) {
  return pathJoin(shellDir, "history");
}

function setRequireAndModule(context) {
  if (Package.modules) {
    // Use the same `require` function and `module` object visible to the
    // application.
    const toBeInstalled = {};
    const shellModuleName = "meteor-shell-" + Math.random().toString(36).slice(2) + ".js";

    toBeInstalled[shellModuleName] = function (require, exports, module) {
      context.module = module;
      context.require = require; // Tab completion sometimes uses require.extensions, but only for
      // the keys.

      require.extensions = {
        ".js": true,
        ".json": true,
        ".node": true
      };
    }; // This populates repl.context.{module,require} by evaluating the
    // module defined above.


    Package.modules.meteorInstall(toBeInstalled)("./" + shellModuleName);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/shell-server/main.js");

/* Exports */
Package._define("shell-server", exports);

})();

//# sourceURL=meteor://💻app/packages/shell-server.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc2hlbGwtc2VydmVyL21haW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NoZWxsLXNlcnZlci9zaGVsbC1zZXJ2ZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwibWFrZU5zU2V0dGVyIiwibGlzdGVuIiwidiIsInNoZWxsRGlyIiwicHJvY2VzcyIsImVudiIsIk1FVEVPUl9TSEVMTF9ESVIiLCJtb2R1bGUxIiwiZXhwb3J0IiwiZGlzYWJsZSIsImFzc2VydCIsImRlZmF1bHQiLCJwYXRoSm9pbiIsImpvaW4iLCJQYXNzVGhyb3VnaCIsImNsb3NlU3luYyIsIm9wZW5TeW5jIiwicmVhZEZpbGVTeW5jIiwidW5saW5rIiwid3JpdGVGaWxlU3luYyIsIndyaXRlU3luYyIsImNyZWF0ZVNlcnZlciIsInJlcGxTdGFydCIsInN0YXJ0IiwiSU5GT19GSUxFX01PREUiLCJwYXJzZUludCIsIkVYSVRJTkdfTUVTU0FHRSIsImNhbGxiYWNrIiwiU2VydmVyIiwiTWV0ZW9yIiwic3RhcnR1cCIsIl9fbWV0ZW9yX2Jvb3RzdHJhcF9fIiwiaG9va3MiLCJzdGFydHVwSG9va3MiLCJwdXNoIiwic2V0SW1tZWRpYXRlIiwiZ2V0SW5mb0ZpbGUiLCJKU09OIiwic3RyaW5naWZ5Iiwic3RhdHVzIiwicmVhc29uIiwibW9kZSIsImlnbm9yZWQiLCJldmFsQ29tbWFuZFByb21pc2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNvbnN0cnVjdG9yIiwib2siLCJrZXkiLCJNYXRoIiwicmFuZG9tIiwidG9TdHJpbmciLCJzbGljZSIsInNlcnZlciIsInNvY2tldCIsIm9uQ29ubmVjdGlvbiIsIm9uIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwic3RhY2siLCJpbmZvRmlsZSIsInBvcnQiLCJhZGRyZXNzIiwidGltZW91dCIsInNldFRpbWVvdXQiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJlbmQiLCJyZWFkSlNPTkZyb21TdHJlYW0iLCJvcHRpb25zIiwicmVwbElucHV0U29ja2V0IiwiY2xlYXJUaW1lb3V0IiwiY29sdW1ucyIsIk9iamVjdCIsImFzc2lnbiIsImNyZWF0ZSIsInByb21wdCIsInRlcm1pbmFsIiwidXNlQ29sb3JzIiwiaWdub3JlVW5kZWZpbmVkIiwiaW5wdXQiLCJ1c2VHbG9iYWwiLCJvdXRwdXQiLCJldmFsdWF0ZUFuZEV4aXQiLCJzdGFydFJFUEwiLCJfd3JhcHBlZERlZmF1bHRFdmFsIiwiY2FsbCIsImNvbW1hbmQiLCJnbG9iYWwiLCJmaWxlbmFtZSIsInJlc3VsdCIsInNlbmRSZXN1bHRUb1NvY2tldCIsIm1lc3NhZ2UiLCJjb2RlIiwiZW5hYmxlSW50ZXJhY3RpdmVNb2RlIiwicmVwbCIsImNvbnRleHQiLCJzZXRSZXF1aXJlQW5kTW9kdWxlIiwiZGVmYXVsdEV2YWwiLCJldmFsIiwid3JhcHBlZERlZmF1bHRFdmFsIiwiZmlsZSIsIlBhY2thZ2UiLCJlY21hc2NyaXB0IiwiRUNNQVNjcmlwdCIsImNvbXBpbGVGb3JTaGVsbCIsInRoZW4iLCJjYXRjaCIsImluaXRpYWxpemVIaXN0b3J5IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJsYXN0Iiwic2V0IiwidmFsIiwiY29uZmlndXJhYmxlIiwiYWRkSGVscCIsImNtZCIsImhlbHBUZXh0IiwiaW5mbyIsImNvbW1hbmRzIiwiaGVscCIsIndyaXRlIiwiZGVmaW5lQ29tbWFuZCIsImFjdGlvbiIsImV4aXQiLCJybGkiLCJoaXN0b3J5RmlsZSIsImdldEhpc3RvcnlGaWxlIiwiaGlzdG9yeUZkIiwiaGlzdG9yeUxpbmVzIiwic3BsaXQiLCJzZWVuTGluZXMiLCJoaXN0b3J5IiwiaGlzdG9yeUluZGV4IiwibGVuZ3RoIiwibGluZSIsInBvcCIsInRlc3QiLCJhZGRMaXN0ZW5lciIsImlucHV0U3RyZWFtIiwib3V0cHV0U3RyZWFtIiwiZGF0YVNvRmFyIiwib25EYXRhIiwiYnVmZmVyIiwibGluZXMiLCJzaGlmdCIsImpzb24iLCJwYXJzZSIsIlN5bnRheEVycm9yIiwiZmluaXNoIiwicGlwZSIsIm9uQ2xvc2UiLCJFcnJvciIsImZpbmlzaGVkIiwicmVtb3ZlTGlzdGVuZXIiLCJtb2R1bGVzIiwidG9CZUluc3RhbGxlZCIsInNoZWxsTW9kdWxlTmFtZSIsImV4cG9ydHMiLCJleHRlbnNpb25zIiwibWV0ZW9ySW5zdGFsbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDLE9BQUlGLE9BQU9HLFlBQVA7QUFBTCxDQUExQyxFQUFzRSxDQUF0RTtBQUF5RSxJQUFJQyxNQUFKO0FBQVdKLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNFLFNBQU9DLENBQVAsRUFBUztBQUFDRCxhQUFPQyxDQUFQO0FBQVM7O0FBQXBCLENBQTFDLEVBQWdFLENBQWhFO0FBR3BGLE1BQU1DLFdBQVdDLFFBQVFDLEdBQVIsQ0FBWUMsZ0JBQTdCOztBQUNBLElBQUlILFFBQUosRUFBYztBQUNaRixTQUFPRSxRQUFQO0FBQ0QsQzs7Ozs7Ozs7Ozs7QUNORCxNQUFNSSxVQUFRVixNQUFkO0FBQXFCVSxRQUFRQyxNQUFSLENBQWU7QUFBQ1AsVUFBTyxNQUFJQSxNQUFaO0FBQW1CUSxXQUFRLE1BQUlBO0FBQS9CLENBQWY7QUFBd0QsSUFBSUMsTUFBSjtBQUFXSCxRQUFRVCxLQUFSLENBQWNDLFFBQVEsUUFBUixDQUFkLEVBQWdDO0FBQUNZLFVBQVFULENBQVIsRUFBVTtBQUFDUSxhQUFPUixDQUFQO0FBQVM7O0FBQXJCLENBQWhDLEVBQXVELENBQXZEO0FBQTBELElBQUlVLFFBQUo7QUFBYUwsUUFBUVQsS0FBUixDQUFjQyxRQUFRLE1BQVIsQ0FBZCxFQUE4QjtBQUFDYyxPQUFLWCxDQUFMLEVBQU87QUFBQ1UsZUFBU1YsQ0FBVDtBQUFXOztBQUFwQixDQUE5QixFQUFvRCxDQUFwRDtBQUF1RCxJQUFJWSxXQUFKO0FBQWdC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QXdCNUgsUUFBeEIsRUFBa0M7QUFDaEMsU0FBT1MsU0FBU1QsUUFBVCxFQUFtQixTQUFuQixDQUFQO0FBQ0Q7O0FBR0QsU0FBUzhGLG1CQUFULENBQTZCRCxPQUE3QixFQUFzQztBQUNwQyxNQUFJTSxRQUFRcUQsT0FBWixFQUFxQjtBQUNuQjtBQUNBO0FBQ0EsVUFBTUMsZ0JBQWdCLEVBQXRCO0FBQ0EsVUFBTUMsa0JBQWtCLGtCQUN0QjVHLEtBQUtDLE1BQUwsR0FBY0MsUUFBZCxDQUF1QixFQUF2QixFQUEyQkMsS0FBM0IsQ0FBaUMsQ0FBakMsQ0FEc0IsR0FDZ0IsS0FEeEM7O0FBR0F3RyxrQkFBY0MsZUFBZCxJQUFpQyxVQUFVOUosT0FBVixFQUFtQitKLE9BQW5CLEVBQTRCakssTUFBNUIsRUFBb0M7QUFDbkVtRyxjQUFRbkcsTUFBUixHQUFpQkEsTUFBakI7QUFDQW1HLGNBQVFqRyxPQUFSLEdBQWtCQSxPQUFsQixDQUZtRSxDQUluRTtBQUNBOztBQUNBQSxjQUFRZ0ssVUFBUixHQUFxQjtBQUNuQixlQUFPLElBRFk7QUFFbkIsaUJBQVMsSUFGVTtBQUduQixpQkFBUztBQUhVLE9BQXJCO0FBS0QsS0FYRCxDQVBtQixDQW9CbkI7QUFDQTs7O0FBQ0F6RCxZQUFRcUQsT0FBUixDQUFnQkssYUFBaEIsQ0FBOEJKLGFBQTlCLEVBQTZDLE9BQU9DLGVBQXBEO0FBQ0Q7QUFDRixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zaGVsbC1zZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgKiBmcm9tIFwiLi9zaGVsbC1zZXJ2ZXIuanNcIjtcbmltcG9ydCB7IGxpc3RlbiB9IGZyb20gXCIuL3NoZWxsLXNlcnZlci5qc1wiO1xuXG5jb25zdCBzaGVsbERpciA9IHByb2Nlc3MuZW52Lk1FVEVPUl9TSEVMTF9ESVI7XG5pZiAoc2hlbGxEaXIpIHtcbiAgbGlzdGVuKHNoZWxsRGlyKTtcbn1cbiIsImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IHsgam9pbiBhcyBwYXRoSm9pbiB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBQYXNzVGhyb3VnaCB9IGZyb20gXCJzdHJlYW1cIjtcbmltcG9ydCB7XG4gIGNsb3NlU3luYyxcbiAgb3BlblN5bmMsXG4gIHJlYWRGaWxlU3luYyxcbiAgdW5saW5rLFxuICB3cml0ZUZpbGVTeW5jLFxuICB3cml0ZVN5bmMsXG59IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgY3JlYXRlU2VydmVyIH0gZnJvbSBcIm5ldFwiO1xuaW1wb3J0IHsgc3RhcnQgYXMgcmVwbFN0YXJ0IH0gZnJvbSBcInJlcGxcIjtcblxuY29uc3QgSU5GT19GSUxFX01PREUgPSBwYXJzZUludChcIjYwMFwiLCA4KTsgLy8gT25seSB0aGUgb3duZXIgY2FuIHJlYWQgb3Igd3JpdGUuXG5jb25zdCBFWElUSU5HX01FU1NBR0UgPSBcIlNoZWxsIGV4aXRpbmcuLi5cIjtcblxuLy8gSW52b2tlZCBieSB0aGUgc2VydmVyIHByb2Nlc3MgdG8gbGlzdGVuIGZvciBpbmNvbWluZyBjb25uZWN0aW9ucyBmcm9tXG4vLyBzaGVsbCBjbGllbnRzLiBFYWNoIGNvbm5lY3Rpb24gZ2V0cyBpdHMgb3duIFJFUEwgaW5zdGFuY2UuXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuKHNoZWxsRGlyKSB7XG4gIGZ1bmN0aW9uIGNhbGxiYWNrKCkge1xuICAgIG5ldyBTZXJ2ZXIoc2hlbGxEaXIpLmxpc3RlbigpO1xuICB9XG5cbiAgLy8gSWYgdGhlIHNlcnZlciBpcyBzdGlsbCBpbiB0aGUgdmVyeSBlYXJseSBzdGFnZXMgb2Ygc3RhcnRpbmcgdXAsXG4gIC8vIE1ldGVvci5zdGFydHVwIG1heSBub3QgYXZhaWxhYmxlIHlldC5cbiAgaWYgKHR5cGVvZiBNZXRlb3IgPT09IFwib2JqZWN0XCIpIHtcbiAgICBNZXRlb3Iuc3RhcnR1cChjYWxsYmFjayk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIF9fbWV0ZW9yX2Jvb3RzdHJhcF9fID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3QgaG9va3MgPSBfX21ldGVvcl9ib290c3RyYXBfXy5zdGFydHVwSG9va3M7XG4gICAgaWYgKGhvb2tzKSB7XG4gICAgICBob29rcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQXMgYSBmYWxsYmFjaywganVzdCBjYWxsIHRoZSBjYWxsYmFjayBhc3luY2hyb25vdXNseS5cbiAgICAgIHNldEltbWVkaWF0ZShjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cbi8vIERpc2FibGluZyB0aGUgc2hlbGwgY2F1c2VzIGFsbCBhdHRhY2hlZCBjbGllbnRzIHRvIGRpc2Nvbm5lY3QgYW5kIGV4aXQuXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZShzaGVsbERpcikge1xuICB0cnkge1xuICAgIC8vIFJlcGxhY2UgaW5mby5qc29uIHdpdGggYSBmaWxlIHRoYXQgc2F5cyB0aGUgc2hlbGwgc2VydmVyIGlzXG4gICAgLy8gZGlzYWJsZWQsIHNvIHRoYXQgYW55IGNvbm5lY3RlZCBzaGVsbCBjbGllbnRzIHdpbGwgZmFpbCB0b1xuICAgIC8vIHJlY29ubmVjdCBhZnRlciB0aGUgc2VydmVyIHByb2Nlc3MgY2xvc2VzIHRoZWlyIHNvY2tldHMuXG4gICAgd3JpdGVGaWxlU3luYyhcbiAgICAgIGdldEluZm9GaWxlKHNoZWxsRGlyKSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc3RhdHVzOiBcImRpc2FibGVkXCIsXG4gICAgICAgIHJlYXNvbjogXCJTaGVsbCBzZXJ2ZXIgaGFzIHNodXQgZG93bi5cIlxuICAgICAgfSkgKyBcIlxcblwiLFxuICAgICAgeyBtb2RlOiBJTkZPX0ZJTEVfTU9ERSB9XG4gICAgKTtcbiAgfSBjYXRjaCAoaWdub3JlZCkge31cbn1cblxuLy8gU2hlbGwgY29tbWFuZHMgbmVlZCB0byBiZSBleGVjdXRlZCBpbiBhIEZpYmVyIGluIGNhc2UgdGhleSBjYWxsIGludG9cbi8vIGNvZGUgdGhhdCB5aWVsZHMuIFVzaW5nIGEgUHJvbWlzZSBpcyBhbiBldmVuIGJldHRlciBpZGVhLCBzaW5jZSBpdCBydW5zXG4vLyBpdHMgY2FsbGJhY2tzIGluIEZpYmVycyBkcmF3biBmcm9tIGEgcG9vbCwgc28gdGhlIEZpYmVycyBhcmUgcmVjeWNsZWQuXG5jb25zdCBldmFsQ29tbWFuZFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcblxuY2xhc3MgU2VydmVyIHtcbiAgY29uc3RydWN0b3Ioc2hlbGxEaXIpIHtcbiAgICBhc3NlcnQub2sodGhpcyBpbnN0YW5jZW9mIFNlcnZlcik7XG5cbiAgICB0aGlzLnNoZWxsRGlyID0gc2hlbGxEaXI7XG4gICAgdGhpcy5rZXkgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcblxuICAgIHRoaXMuc2VydmVyID1cbiAgICAgIGNyZWF0ZVNlcnZlcigoc29ja2V0KSA9PiB7XG4gICAgICAgIHRoaXMub25Db25uZWN0aW9uKHNvY2tldCk7XG4gICAgICB9KVxuICAgICAgLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGxpc3RlbigpIHtcbiAgICBjb25zdCBpbmZvRmlsZSA9IGdldEluZm9GaWxlKHRoaXMuc2hlbGxEaXIpO1xuXG4gICAgdW5saW5rKGluZm9GaWxlLCAoKSA9PiB7XG4gICAgICB0aGlzLnNlcnZlci5saXN0ZW4oMCwgXCIxMjcuMC4wLjFcIiwgKCkgPT4ge1xuICAgICAgICB3cml0ZUZpbGVTeW5jKGluZm9GaWxlLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgc3RhdHVzOiBcImVuYWJsZWRcIixcbiAgICAgICAgICBwb3J0OiB0aGlzLnNlcnZlci5hZGRyZXNzKCkucG9ydCxcbiAgICAgICAgICBrZXk6IHRoaXMua2V5XG4gICAgICAgIH0pICsgXCJcXG5cIiwge1xuICAgICAgICAgIG1vZGU6IElORk9fRklMRV9NT0RFXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNvbm5lY3Rpb24oc29ja2V0KSB7XG4gICAgLy8gTWFrZSBzdXJlIHRoaXMgZnVuY3Rpb24gZG9lc24ndCB0cnkgdG8gd3JpdGUgYW55dGhpbmcgdG8gdGhlIHNvY2tldFxuICAgIC8vIGFmdGVyIGl0IGhhcyBiZWVuIGNsb3NlZC5cbiAgICBzb2NrZXQub24oXCJjbG9zZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgIHNvY2tldCA9IG51bGw7XG4gICAgfSk7XG5cbiAgICAvLyBJZiBjb21tdW5pY2F0aW9uIGlzIG5vdCBlc3RhYmxpc2hlZCB3aXRoaW4gMTAwMG1zIG9mIHRoZSBmaXJzdFxuICAgIC8vIGNvbm5lY3Rpb24sIGZvcmNpYmx5IGNsb3NlIHRoZSBzb2NrZXQuXG4gICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc29ja2V0KSB7XG4gICAgICAgIHNvY2tldC5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJkYXRhXCIpO1xuICAgICAgICBzb2NrZXQuZW5kKEVYSVRJTkdfTUVTU0FHRSArIFwiXFxuXCIpO1xuICAgICAgfVxuICAgIH0sIDEwMDApO1xuXG4gICAgLy8gTGV0IGNvbm5lY3RpbmcgY2xpZW50cyBjb25maWd1cmUgY2VydGFpbiBSRVBMIG9wdGlvbnMgYnkgc2VuZGluZyBhXG4gICAgLy8gSlNPTiBvYmplY3Qgb3ZlciB0aGUgc29ja2V0LiBGb3IgZXhhbXBsZSwgb25seSB0aGUgY2xpZW50IGtub3dzXG4gICAgLy8gd2hldGhlciBpdCdzIHJ1bm5pbmcgYSBUVFkgb3IgYW4gRW1hY3Mgc3Vic2hlbGwgb3Igc29tZSBvdGhlciBraW5kIG9mXG4gICAgLy8gdGVybWluYWwsIHNvIHRoZSBjbGllbnQgbXVzdCBkZWNpZGUgdGhlIHZhbHVlIG9mIG9wdGlvbnMudGVybWluYWwuXG4gICAgcmVhZEpTT05Gcm9tU3RyZWFtKHNvY2tldCwgKGVycm9yLCBvcHRpb25zLCByZXBsSW5wdXRTb2NrZXQpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHNvY2tldCA9IG51bGw7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3Iuc3RhY2spO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmtleSAhPT0gdGhpcy5rZXkpIHtcbiAgICAgICAgaWYgKHNvY2tldCkge1xuICAgICAgICAgIHNvY2tldC5lbmQoRVhJVElOR19NRVNTQUdFICsgXCJcXG5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGVsZXRlIG9wdGlvbnMua2V5O1xuXG4gICAgICAvLyBTZXQgdGhlIGNvbHVtbnMgdG8gd2hhdCBpcyBiZWluZyByZXF1ZXN0ZWQgYnkgdGhlIGNsaWVudC5cbiAgICAgIGlmIChvcHRpb25zLmNvbHVtbnMgJiYgc29ja2V0KSB7XG4gICAgICAgIHNvY2tldC5jb2x1bW5zID0gb3B0aW9ucy5jb2x1bW5zO1xuICAgICAgfVxuICAgICAgZGVsZXRlIG9wdGlvbnMuY29sdW1ucztcblxuICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgIE9iamVjdC5jcmVhdGUobnVsbCksXG5cbiAgICAgICAgLy8gRGVmYXVsdHMgZm9yIGNvbmZpZ3VyYWJsZSBvcHRpb25zLlxuICAgICAgICB7XG4gICAgICAgICAgcHJvbXB0OiBcIj4gXCIsXG4gICAgICAgICAgdGVybWluYWw6IHRydWUsXG4gICAgICAgICAgdXNlQ29sb3JzOiB0cnVlLFxuICAgICAgICAgIGlnbm9yZVVuZGVmaW5lZDogdHJ1ZSxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBDb25maWd1cmFibGUgb3B0aW9uc1xuICAgICAgICBvcHRpb25zLFxuXG4gICAgICAgIC8vIEltbXV0YWJsZSBvcHRpb25zLlxuICAgICAgICB7XG4gICAgICAgICAgaW5wdXQ6IHJlcGxJbnB1dFNvY2tldCxcbiAgICAgICAgICB1c2VHbG9iYWw6IGZhbHNlLFxuICAgICAgICAgIG91dHB1dDogc29ja2V0XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIC8vIFRoZSBwcm9tcHQgZHVyaW5nIGFuIGV2YWx1YXRlQW5kRXhpdCBtdXN0IGJlIGJsYW5rIHRvIGVuc3VyZVxuICAgICAgLy8gdGhhdCB0aGUgcHJvbXB0IGRvZXNuJ3QgaW5hZHZlcnRlbnRseSBnZXQgcGFyc2VkIGFzIHBhcnQgb2ZcbiAgICAgIC8vIHRoZSBKU09OIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAgICAgIGlmIChvcHRpb25zLmV2YWx1YXRlQW5kRXhpdCkge1xuICAgICAgICBvcHRpb25zLnByb21wdCA9IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0YXJ0IHRoZSBSRVBMLlxuICAgICAgdGhpcy5zdGFydFJFUEwob3B0aW9ucyk7XG5cbiAgICAgIGlmIChvcHRpb25zLmV2YWx1YXRlQW5kRXhpdCkge1xuICAgICAgICB0aGlzLl93cmFwcGVkRGVmYXVsdEV2YWwuY2FsbChcbiAgICAgICAgICBPYmplY3QuY3JlYXRlKG51bGwpLFxuICAgICAgICAgIG9wdGlvbnMuZXZhbHVhdGVBbmRFeGl0LmNvbW1hbmQsXG4gICAgICAgICAgZ2xvYmFsLFxuICAgICAgICAgIG9wdGlvbnMuZXZhbHVhdGVBbmRFeGl0LmZpbGVuYW1lIHx8IFwiPG1ldGVvciBzaGVsbD5cIixcbiAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IsIHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKHNvY2tldCkge1xuICAgICAgICAgICAgICBmdW5jdGlvbiBzZW5kUmVzdWx0VG9Tb2NrZXQobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIC8vIFNlbmRpbmcgYmFjayBhIEpTT04gcGF5bG9hZCBhbGxvd3MgdGhlIGNsaWVudCB0b1xuICAgICAgICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIGJldHdlZW4gZXJyb3JzIGFuZCBzdWNjZXNzZnVsIHJlc3VsdHMuXG4gICAgICAgICAgICAgICAgc29ja2V0LmVuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSArIFwiXFxuXCIpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3VsdFRvU29ja2V0KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgY29kZTogMVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXN1bHRUb1NvY2tldCh7XG4gICAgICAgICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSBvcHRpb25zLmV2YWx1YXRlQW5kRXhpdDtcblxuICAgICAgdGhpcy5lbmFibGVJbnRlcmFjdGl2ZU1vZGUob3B0aW9ucyk7XG4gICAgfSk7XG4gIH1cblxuICBzdGFydFJFUEwob3B0aW9ucykge1xuICAgIC8vIE1ha2Ugc3VyZSB0aGlzIGZ1bmN0aW9uIGRvZXNuJ3QgdHJ5IHRvIHdyaXRlIGFueXRoaW5nIHRvIHRoZSBvdXRwdXRcbiAgICAvLyBzdHJlYW0gYWZ0ZXIgaXQgaGFzIGJlZW4gY2xvc2VkLlxuICAgIG9wdGlvbnMub3V0cHV0Lm9uKFwiY2xvc2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBvcHRpb25zLm91dHB1dCA9IG51bGw7XG4gICAgfSk7XG5cbiAgICBjb25zdCByZXBsID0gdGhpcy5yZXBsID0gcmVwbFN0YXJ0KG9wdGlvbnMpO1xuXG4gICAgLy8gVGhpcyBpcyB0ZWNobmlxdWUgb2Ygc2V0dGluZyBgcmVwbC5jb250ZXh0YCBpcyBzaW1pbGFyIHRvIGhvdyB0aGVcbiAgICAvLyBgdXNlR2xvYmFsYCBvcHRpb24gd291bGQgd29yayBkdXJpbmcgYSBub3JtYWwgYHJlcGwuc3RhcnQoKWAgYW5kXG4gICAgLy8gYWxsb3dzIHNoZWxsIGFjY2VzcyAoYW5kIHRhYiBjb21wbGV0aW9uISkgdG8gTWV0ZW9yIGdsb2JhbHMgKGkuZS5cbiAgICAvLyBVbmRlcnNjb3JlIF8sIE1ldGVvciwgZXRjLikuIEJ5IHVzaW5nIHRoaXMgdGVjaG5pcXVlLCB3aGljaCBjaGFuZ2VzXG4gICAgLy8gdGhlIGNvbnRleHQgYWZ0ZXIgc3RhcnR1cCwgd2UgYXZvaWQgc3RvbXBpbmcgb24gdGhlIHNwZWNpYWwgYF9gXG4gICAgLy8gdmFyaWFibGUgKGluIGByZXBsYCB0aGlzIGVxdWFscyB0aGUgdmFsdWUgb2YgdGhlIGxhc3QgY29tbWFuZCkgZnJvbVxuICAgIC8vIGJlaW5nIG92ZXJyaWRkZW4gaW4gdGhlIGNsaWVudC9zZXJ2ZXIgc29ja2V0LWhhbmRzaGFraW5nLiAgRnVydGhlcm1vcmUsXG4gICAgLy8gYnkgc2V0dGluZyBgdXNlR2xvYmFsYCBiYWNrIHRvIHRydWUsIHdlIGFsbG93IHRoZSBkZWZhdWx0IGV2YWwgZnVuY3Rpb25cbiAgICAvLyB0byB1c2UgdGhlIGRlc2lyZWQgYHJ1bkluVGhpc0NvbnRleHRgIG1ldGhvZCAoaHR0cHM6Ly9naXQuaW8vdmJ2QUIpLlxuICAgIHJlcGwuY29udGV4dCA9IGdsb2JhbDtcbiAgICByZXBsLnVzZUdsb2JhbCA9IHRydWU7XG5cbiAgICBzZXRSZXF1aXJlQW5kTW9kdWxlKHJlcGwuY29udGV4dCk7XG5cbiAgICAvLyBJbiBvcmRlciB0byBhdm9pZCBkdXBsaWNhdGluZyBjb2RlIGhlcmUsIHNwZWNpZmljYWxseSB0aGUgY29tcGxleGl0aWVzXG4gICAgLy8gb2YgY2F0Y2hpbmcgc28tY2FsbGVkIFwiUmVjb3ZlcmFibGUgRXJyb3JzXCIgKGh0dHBzOi8vZ2l0LmlvL3ZidmJsKSxcbiAgICAvLyB3ZSB3aWxsIHdyYXAgdGhlIGRlZmF1bHQgZXZhbCwgcnVuIGl0IGluIGEgRmliZXIgKHZpYSBhIFByb21pc2UpLCBhbmRcbiAgICAvLyBnaXZlIGl0IHRoZSBvcHBvcnR1bml0eSB0byBkZWNpZGUgaWYgdGhlIHVzZXIgaXMgbWlkLWNvZGUtYmxvY2suXG4gICAgY29uc3QgZGVmYXVsdEV2YWwgPSByZXBsLmV2YWw7XG5cbiAgICBmdW5jdGlvbiB3cmFwcGVkRGVmYXVsdEV2YWwoY29kZSwgY29udGV4dCwgZmlsZSwgY2FsbGJhY2spIHtcbiAgICAgIGlmIChQYWNrYWdlLmVjbWFzY3JpcHQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb2RlID0gUGFja2FnZS5lY21hc2NyaXB0LkVDTUFTY3JpcHQuY29tcGlsZUZvclNoZWxsKGNvZGUpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBBbnkgQmFiZWwgZXJyb3IgaGVyZSBtaWdodCBiZSBqdXN0IGZpbmUgc2luY2UgaXQnc1xuICAgICAgICAgIC8vIHBvc3NpYmxlIHRoZSBjb2RlIHdhcyBpbmNvbXBsZXRlIChtdWx0aS1saW5lIGNvZGUgb24gdGhlIFJFUEwpLlxuICAgICAgICAgIC8vIFRoZSBkZWZhdWx0RXZhbCBiZWxvdyB3aWxsIHVzZSBpdHMgb3duIGZ1bmN0aW9uYWxpdHkgdG8gZGV0ZXJtaW5lXG4gICAgICAgICAgLy8gaWYgdGhpcyBlcnJvciBpcyBcInJlY292ZXJhYmxlXCIuXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZXZhbENvbW1hbmRQcm9taXNlXG4gICAgICAgIC50aGVuKCgpID0+IGRlZmF1bHRFdmFsKGNvZGUsIGNvbnRleHQsIGZpbGUsIGNhbGxiYWNrKSlcbiAgICAgICAgLmNhdGNoKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICAvLyBIYXZlIHRoZSBSRVBMIHVzZSB0aGUgbmV3bHkgd3JhcHBlZCBmdW5jdGlvbiBpbnN0ZWFkIGFuZCBzdG9yZSB0aGVcbiAgICAvLyBfd3JhcHBlZERlZmF1bHRFdmFsIHNvIHRoYXQgZXZhbHVsYXRlQW5kRXhpdCBjYWxscyBjYW4gdXNlIGl0IGRpcmVjdGx5LlxuICAgIHJlcGwuZXZhbCA9IHRoaXMuX3dyYXBwZWREZWZhdWx0RXZhbCA9IHdyYXBwZWREZWZhdWx0RXZhbDtcbiAgfVxuXG4gIGVuYWJsZUludGVyYWN0aXZlTW9kZShvcHRpb25zKSB7XG4gICAgLy8gSGlzdG9yeSBwZXJzaXN0cyBhY3Jvc3Mgc2hlbGwgc2Vzc2lvbnMhXG4gICAgdGhpcy5pbml0aWFsaXplSGlzdG9yeSgpO1xuXG4gICAgY29uc3QgcmVwbCA9IHRoaXMucmVwbDtcblxuICAgIC8vIEltcGxlbWVudCBhbiBhbHRlcm5hdGUgbWVhbnMgb2YgZmV0Y2hpbmcgdGhlIHJldHVybiB2YWx1ZSxcbiAgICAvLyB2aWEgYF9fYCAoZG91YmxlIHVuZGVyc2NvcmUpIGFzIG9yaWdpbmFsbHkgaW1wbGVtZW50ZWQgaW46XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvY29tbWl0LzI0NDNkODMyMjY1YzdkMWNcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVwbC5jb250ZXh0LCBcIl9fXCIsIHtcbiAgICAgIGdldDogKCkgPT4gcmVwbC5sYXN0LFxuICAgICAgc2V0OiAodmFsKSA9PiB7XG4gICAgICAgIHJlcGwubGFzdCA9IHZhbDtcbiAgICAgIH0sXG5cbiAgICAgIC8vIEFsbG93IHRoaXMgcHJvcGVydHkgdG8gYmUgKHJlKWRlZmluZWQgbW9yZSB0aGFuIG9uY2UgKGUuZy4gZWFjaFxuICAgICAgLy8gdGltZSB0aGUgc2VydmVyIHJlc3RhcnRzKS5cbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgLy8gU29tZSBpbXByb3ZlbWVudHMgdG8gdGhlIGV4aXN0aW5nIGhlbHAgbWVzc2FnZXMuXG4gICAgZnVuY3Rpb24gYWRkSGVscChjbWQsIGhlbHBUZXh0KSB7XG4gICAgICBjb25zdCBpbmZvID0gcmVwbC5jb21tYW5kc1tjbWRdIHx8IHJlcGwuY29tbWFuZHNbXCIuXCIgKyBjbWRdO1xuICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgaW5mby5oZWxwID0gaGVscFRleHQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFkZEhlbHAoXCJicmVha1wiLCBcIlRlcm1pbmF0ZSBjdXJyZW50IGNvbW1hbmQgaW5wdXQgYW5kIGRpc3BsYXkgbmV3IHByb21wdFwiKTtcbiAgICBhZGRIZWxwKFwiZXhpdFwiLCBcIkRpc2Nvbm5lY3QgZnJvbSBzZXJ2ZXIgYW5kIGxlYXZlIHNoZWxsXCIpO1xuICAgIGFkZEhlbHAoXCJoZWxwXCIsIFwiU2hvdyB0aGlzIGhlbHAgaW5mb3JtYXRpb25cIik7XG5cbiAgICAvLyBXaGVuIHRoZSBSRVBMIGV4aXRzLCBzaWduYWwgdGhlIGF0dGFjaGVkIGNsaWVudCB0byBleGl0IGJ5IHNlbmRpbmcgaXRcbiAgICAvLyB0aGUgc3BlY2lhbCBFWElUSU5HX01FU1NBR0UuXG4gICAgcmVwbC5vbihcImV4aXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAob3B0aW9ucy5vdXRwdXQpIHtcbiAgICAgICAgb3B0aW9ucy5vdXRwdXQud3JpdGUoRVhJVElOR19NRVNTQUdFICsgXCJcXG5cIik7XG4gICAgICAgIG9wdGlvbnMub3V0cHV0LmVuZCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2hlbiB0aGUgc2VydmVyIHByb2Nlc3MgZXhpdHMsIGVuZCB0aGUgb3V0cHV0IHN0cmVhbSBidXQgZG8gbm90XG4gICAgLy8gc2lnbmFsIHRoZSBhdHRhY2hlZCBjbGllbnQgdG8gZXhpdC5cbiAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChvcHRpb25zLm91dHB1dCkge1xuICAgICAgICBvcHRpb25zLm91dHB1dC5lbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRoaXMgTWV0ZW9yLXNwZWNpZmljIHNoZWxsIGNvbW1hbmQgcmVidWlsZHMgdGhlIGFwcGxpY2F0aW9uIGFzIGlmIGFcbiAgICAvLyBjaGFuZ2Ugd2FzIG1hZGUgdG8gc2VydmVyIGNvZGUuXG4gICAgcmVwbC5kZWZpbmVDb21tYW5kKFwicmVsb2FkXCIsIHtcbiAgICAgIGhlbHA6IFwiUmVzdGFydCB0aGUgc2VydmVyIGFuZCB0aGUgc2hlbGxcIixcbiAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gYWxsb3dzIGEgcGVyc2lzdGVudCBoaXN0b3J5IG9mIHNoZWxsIGNvbW1hbmRzIHRvIGJlIHNhdmVkXG4gIC8vIHRvIGFuZCBsb2FkZWQgZnJvbSAubWV0ZW9yL2xvY2FsL3NoZWxsLWhpc3RvcnkuXG4gIGluaXRpYWxpemVIaXN0b3J5KCkge1xuICAgIGNvbnN0IHJsaSA9IHRoaXMucmVwbC5ybGk7XG4gICAgY29uc3QgaGlzdG9yeUZpbGUgPSBnZXRIaXN0b3J5RmlsZSh0aGlzLnNoZWxsRGlyKTtcbiAgICBsZXQgaGlzdG9yeUZkID0gb3BlblN5bmMoaGlzdG9yeUZpbGUsIFwiYStcIik7XG4gICAgY29uc3QgaGlzdG9yeUxpbmVzID0gcmVhZEZpbGVTeW5jKGhpc3RvcnlGaWxlLCBcInV0ZjhcIikuc3BsaXQoXCJcXG5cIik7XG4gICAgY29uc3Qgc2VlbkxpbmVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIGlmICghIHJsaS5oaXN0b3J5KSB7XG4gICAgICBybGkuaGlzdG9yeSA9IFtdO1xuICAgICAgcmxpLmhpc3RvcnlJbmRleCA9IC0xO1xuICAgIH1cblxuICAgIHdoaWxlIChybGkuaGlzdG9yeSAmJiBoaXN0b3J5TGluZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbGluZSA9IGhpc3RvcnlMaW5lcy5wb3AoKTtcbiAgICAgIGlmIChsaW5lICYmIC9cXFMvLnRlc3QobGluZSkgJiYgISBzZWVuTGluZXNbbGluZV0pIHtcbiAgICAgICAgcmxpLmhpc3RvcnkucHVzaChsaW5lKTtcbiAgICAgICAgc2VlbkxpbmVzW2xpbmVdID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBybGkuYWRkTGlzdGVuZXIoXCJsaW5lXCIsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIGlmIChoaXN0b3J5RmQgPj0gMCAmJiAvXFxTLy50ZXN0KGxpbmUpKSB7XG4gICAgICAgIHdyaXRlU3luYyhoaXN0b3J5RmQsIGxpbmUgKyBcIlxcblwiKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucmVwbC5vbihcImV4aXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBjbG9zZVN5bmMoaGlzdG9yeUZkKTtcbiAgICAgIGhpc3RvcnlGZCA9IC0xO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRKU09ORnJvbVN0cmVhbShpbnB1dFN0cmVhbSwgY2FsbGJhY2spIHtcbiAgY29uc3Qgb3V0cHV0U3RyZWFtID0gbmV3IFBhc3NUaHJvdWdoKCk7XG4gIGxldCBkYXRhU29GYXIgPSBcIlwiO1xuXG4gIGZ1bmN0aW9uIG9uRGF0YShidWZmZXIpIHtcbiAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlci50b1N0cmluZyhcInV0ZjhcIikuc3BsaXQoXCJcXG5cIik7XG5cbiAgICB3aGlsZSAobGluZXMubGVuZ3RoID4gMCkge1xuICAgICAgZGF0YVNvRmFyICs9IGxpbmVzLnNoaWZ0KCk7XG5cbiAgICAgIGxldCBqc29uO1xuICAgICAgdHJ5IHtcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoZGF0YVNvRmFyKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmluaXNoKGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgb3V0cHV0U3RyZWFtLndyaXRlKGxpbmVzLmpvaW4oXCJcXG5cIikpO1xuICAgICAgfVxuXG4gICAgICBpbnB1dFN0cmVhbS5waXBlKG91dHB1dFN0cmVhbSk7XG5cbiAgICAgIHJldHVybiBmaW5pc2gobnVsbCwganNvbik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25DbG9zZSgpIHtcbiAgICBmaW5pc2gobmV3IEVycm9yKFwic3RyZWFtIHVuZXhwZWN0ZWRseSBjbG9zZWRcIikpO1xuICB9XG5cbiAgbGV0IGZpbmlzaGVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGZpbmlzaChlcnJvciwganNvbikge1xuICAgIGlmICghIGZpbmlzaGVkKSB7XG4gICAgICBmaW5pc2hlZCA9IHRydWU7XG4gICAgICBpbnB1dFN0cmVhbS5yZW1vdmVMaXN0ZW5lcihcImRhdGFcIiwgb25EYXRhKTtcbiAgICAgIGlucHV0U3RyZWFtLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIiwgZmluaXNoKTtcbiAgICAgIGlucHV0U3RyZWFtLnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIiwgb25DbG9zZSk7XG4gICAgICBjYWxsYmFjayhlcnJvciwganNvbiwgb3V0cHV0U3RyZWFtKTtcbiAgICB9XG4gIH1cblxuICBpbnB1dFN0cmVhbS5vbihcImRhdGFcIiwgb25EYXRhKTtcbiAgaW5wdXRTdHJlYW0ub24oXCJlcnJvclwiLCBmaW5pc2gpO1xuICBpbnB1dFN0cmVhbS5vbihcImNsb3NlXCIsIG9uQ2xvc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRJbmZvRmlsZShzaGVsbERpcikge1xuICByZXR1cm4gcGF0aEpvaW4oc2hlbGxEaXIsIFwiaW5mby5qc29uXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRIaXN0b3J5RmlsZShzaGVsbERpcikge1xuICByZXR1cm4gcGF0aEpvaW4oc2hlbGxEaXIsIFwiaGlzdG9yeVwiKTtcbn1cblxuXG5mdW5jdGlvbiBzZXRSZXF1aXJlQW5kTW9kdWxlKGNvbnRleHQpIHtcbiAgaWYgKFBhY2thZ2UubW9kdWxlcykge1xuICAgIC8vIFVzZSB0aGUgc2FtZSBgcmVxdWlyZWAgZnVuY3Rpb24gYW5kIGBtb2R1bGVgIG9iamVjdCB2aXNpYmxlIHRvIHRoZVxuICAgIC8vIGFwcGxpY2F0aW9uLlxuICAgIGNvbnN0IHRvQmVJbnN0YWxsZWQgPSB7fTtcbiAgICBjb25zdCBzaGVsbE1vZHVsZU5hbWUgPSBcIm1ldGVvci1zaGVsbC1cIiArXG4gICAgICBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKSArIFwiLmpzXCI7XG5cbiAgICB0b0JlSW5zdGFsbGVkW3NoZWxsTW9kdWxlTmFtZV0gPSBmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG4gICAgICBjb250ZXh0Lm1vZHVsZSA9IG1vZHVsZTtcbiAgICAgIGNvbnRleHQucmVxdWlyZSA9IHJlcXVpcmU7XG5cbiAgICAgIC8vIFRhYiBjb21wbGV0aW9uIHNvbWV0aW1lcyB1c2VzIHJlcXVpcmUuZXh0ZW5zaW9ucywgYnV0IG9ubHkgZm9yXG4gICAgICAvLyB0aGUga2V5cy5cbiAgICAgIHJlcXVpcmUuZXh0ZW5zaW9ucyA9IHtcbiAgICAgICAgXCIuanNcIjogdHJ1ZSxcbiAgICAgICAgXCIuanNvblwiOiB0cnVlLFxuICAgICAgICBcIi5ub2RlXCI6IHRydWUsXG4gICAgICB9O1xuICAgIH07XG5cbiAgICAvLyBUaGlzIHBvcHVsYXRlcyByZXBsLmNvbnRleHQue21vZHVsZSxyZXF1aXJlfSBieSBldmFsdWF0aW5nIHRoZVxuICAgIC8vIG1vZHVsZSBkZWZpbmVkIGFib3ZlLlxuICAgIFBhY2thZ2UubW9kdWxlcy5tZXRlb3JJbnN0YWxsKHRvQmVJbnN0YWxsZWQpKFwiLi9cIiArIHNoZWxsTW9kdWxlTmFtZSk7XG4gIH1cbn1cbiJdfQ==

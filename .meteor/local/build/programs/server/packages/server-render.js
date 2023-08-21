(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"server-render":{"server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/server-render/server.js                                                                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  onPageLoad: () => onPageLoad
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
module.watch(require("./server-register.js"));
const startupPromise = new Promise(Meteor.startup);
const pageLoadCallbacks = new Set();

function onPageLoad(callback) {
  if (typeof callback === "function") {
    pageLoadCallbacks.add(callback);
  } // Return the callback so that it can be more easily removed later.


  return callback;
}

onPageLoad.remove = function (callback) {
  pageLoadCallbacks.delete(callback);
};

onPageLoad.clear = function () {
  pageLoadCallbacks.clear();
};

onPageLoad.chain = function (handler) {
  return startupPromise.then(() => {
    let promise = Promise.resolve();
    pageLoadCallbacks.forEach(callback => {
      promise = promise.then(() => handler(callback));
    });
    return promise;
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server-register.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/server-render/server-register.js                                                                      //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let WebAppInternals;
module.watch(require("meteor/webapp"), {
  WebAppInternals(v) {
    WebAppInternals = v;
  }

}, 0);
let MagicString;
module.watch(require("magic-string"), {
  default(v) {
    MagicString = v;
  }

}, 1);
let SAXParser;
module.watch(require("parse5"), {
  SAXParser(v) {
    SAXParser = v;
  }

}, 2);
let createStream;
module.watch(require("combined-stream2"), {
  create(v) {
    createStream = v;
  }

}, 3);
let ServerSink, isReadable;
module.watch(require("./server-sink.js"), {
  ServerSink(v) {
    ServerSink = v;
  },

  isReadable(v) {
    isReadable = v;
  }

}, 4);
let onPageLoad;
module.watch(require("./server.js"), {
  onPageLoad(v) {
    onPageLoad = v;
  }

}, 5);
WebAppInternals.registerBoilerplateDataCallback("meteor/server-render", (request, data, arch) => {
  const sink = new ServerSink(request, arch);
  return onPageLoad.chain(callback => callback(sink, request)).then(() => {
    if (!sink.maybeMadeChanges) {
      return false;
    }

    let reallyMadeChanges = false;

    function rewrite(property) {
      const html = data[property];

      if (typeof html !== "string") {
        return;
      }

      const magic = new MagicString(html);
      const parser = new SAXParser({
        locationInfo: true
      });
      data[property] = parser;

      if (Object.keys(sink.htmlById).length) {
        const stream = createStream();
        let lastStart = magic.start;
        parser.on("startTag", (name, attrs, selfClosing, loc) => {
          attrs.some(attr => {
            if (attr.name === "id") {
              let html = sink.htmlById[attr.value];

              if (html) {
                reallyMadeChanges = true;
                const start = magic.slice(lastStart, loc.endOffset);
                stream.append(Buffer.from(start, "utf8"));
                stream.append(typeof html === "string" ? Buffer.from(html, "utf8") : html);
                lastStart = loc.endOffset;
              }

              return true;
            }
          });
        });
        parser.on("endTag", (name, location) => {
          if (location.endOffset === html.length) {
            // reached the end of the template
            const end = magic.slice(lastStart);
            stream.append(Buffer.from(end, "utf8"));
          }
        });
        data[property] = stream;
      }

      parser.write(html, parser.end.bind(parser));
    }

    if (sink.head) {
      data.dynamicHead = (data.dynamicHead || "") + sink.head;
      reallyMadeChanges = true;
    }

    if (Object.keys(sink.htmlById).length > 0) {
      // We don't currently allow injecting HTML into the <head> except
      // by calling sink.appendHead(html).
      rewrite("body");
      rewrite("dynamicBody");
    }

    if (sink.body) {
      data.dynamicBody = (data.dynamicBody || "") + sink.body;
      reallyMadeChanges = true;
    }

    if (sink.statusCode) {
      data.statusCode = sink.statusCode;
      reallyMadeChanges = true;
    }

    if (Object.keys(sink.responseHeaders)) {
      data.headers = sink.responseHeaders;
      reallyMadeChanges = true;
    }

    return reallyMadeChanges;
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server-sink.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/server-render/server-sink.js                                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  ServerSink: () => ServerSink,
  isReadable: () => isReadable
});

class ServerSink {
  constructor(request, arch) {
    this.request = request;
    this.arch = arch;
    this.head = "";
    this.body = "";
    this.htmlById = Object.create(null);
    this.maybeMadeChanges = false;
    this.statusCode = null;
    this.responseHeaders = {};
  }

  appendToHead(html) {
    if (appendContent(this, "head", html)) {
      this.maybeMadeChanges = true;
    }
  }

  appendToBody(html) {
    if (appendContent(this, "body", html)) {
      this.maybeMadeChanges = true;
    }
  }

  appendToElementById(id, html) {
    if (appendContent(this.htmlById, id, html)) {
      this.maybeMadeChanges = true;
    }
  }

  renderIntoElementById(id, html) {
    this.htmlById[id] = "";
    this.appendToElementById(id, html);
  }

  redirect(location, code = 301) {
    this.maybeMadeChanges = true;
    this.statusCode = code;
    this.responseHeaders.Location = location;
  } // server only methods


  setStatusCode(code) {
    this.maybeMadeChanges = true;
    this.statusCode = code;
  }

  setHeader(key, value) {
    this.maybeMadeChanges = true;
    this.responseHeaders[key] = value;
  }

  getHeaders() {
    return this.request.headers;
  }

  getCookies() {
    return this.request.cookies;
  }

}

function isReadable(stream) {
  return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function' && stream.readable !== false && typeof stream._read === 'function' && typeof stream._readableState === 'object';
}

function appendContent(object, property, content) {
  let madeChanges = false;

  if (Array.isArray(content)) {
    content.forEach(elem => {
      if (appendContent(object, property, elem)) {
        madeChanges = true;
      }
    });
  } else if (isReadable(content)) {
    object[property] = content;
    madeChanges = true;
  } else if (content = content && content.toString("utf8")) {
    object[property] = (object[property] || "") + content;
    madeChanges = true;
  }

  return madeChanges;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"magic-string":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/server-render/node_modules/magic-string/package.json                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
exports.name = "magic-string";
exports.version = "0.21.3";
exports.main = "dist/magic-string.cjs.js";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"magic-string.cjs.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/server-render/node_modules/magic-string/dist/magic-string.cjs.js                           //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
'use strict';

var vlq = require('vlq');

function Chunk ( start, end, content ) {
	this.start = start;
	this.end = end;
	this.original = content;

	this.intro = '';
	this.outro = '';

	this.content = content;
	this.storeName = false;
	this.edited = false;

	// we make these non-enumerable, for sanity while debugging
	Object.defineProperties( this, {
		previous: { writable: true, value: null },
		next: { writable: true, value: null }
	});
}

Chunk.prototype = {
	appendLeft: function appendLeft ( content ) {
		this.outro += content;
	},

	appendRight: function appendRight ( content ) {
		this.intro = this.intro + content;
	},

	clone: function clone () {
		var chunk = new Chunk( this.start, this.end, this.original );

		chunk.intro = this.intro;
		chunk.outro = this.outro;
		chunk.content = this.content;
		chunk.storeName = this.storeName;
		chunk.edited = this.edited;

		return chunk;
	},

	contains: function contains ( index ) {
		return this.start < index && index < this.end;
	},

	eachNext: function eachNext ( fn ) {
		var chunk = this;
		while ( chunk ) {
			fn( chunk );
			chunk = chunk.next;
		}
	},

	eachPrevious: function eachPrevious ( fn ) {
		var chunk = this;
		while ( chunk ) {
			fn( chunk );
			chunk = chunk.previous;
		}
	},

	edit: function edit ( content, storeName, contentOnly ) {
		this.content = content;
		if ( !contentOnly ) {
			this.intro = '';
			this.outro = '';
		}
		this.storeName = storeName;

		this.edited = true;

		return this;
	},

	prependLeft: function prependLeft ( content ) {
		this.outro = content + this.outro;
	},

	prependRight: function prependRight ( content ) {
		this.intro = content + this.intro;
	},

	split: function split ( index ) {
		var sliceIndex = index - this.start;

		var originalBefore = this.original.slice( 0, sliceIndex );
		var originalAfter = this.original.slice( sliceIndex );

		this.original = originalBefore;

		var newChunk = new Chunk( index, this.end, originalAfter );
		newChunk.outro = this.outro;
		this.outro = '';

		this.end = index;

		if ( this.edited ) {
			// TODO is this block necessary?...
			newChunk.edit( '', false );
			this.content = '';
		} else {
			this.content = originalBefore;
		}

		newChunk.next = this.next;
		if ( newChunk.next ) { newChunk.next.previous = newChunk; }
		newChunk.previous = this;
		this.next = newChunk;

		return newChunk;
	},

	toString: function toString () {
		return this.intro + this.content + this.outro;
	},

	trimEnd: function trimEnd ( rx ) {
		this.outro = this.outro.replace( rx, '' );
		if ( this.outro.length ) { return true; }

		var trimmed = this.content.replace( rx, '' );

		if ( trimmed.length ) {
			if ( trimmed !== this.content ) {
				this.split( this.start + trimmed.length ).edit( '', false );
			}

			return true;
		} else {
			this.edit( '', false );

			this.intro = this.intro.replace( rx, '' );
			if ( this.intro.length ) { return true; }
		}
	},

	trimStart: function trimStart ( rx ) {
		this.intro = this.intro.replace( rx, '' );
		if ( this.intro.length ) { return true; }

		var trimmed = this.content.replace( rx, '' );

		if ( trimmed.length ) {
			if ( trimmed !== this.content ) {
				this.split( this.end - trimmed.length );
				this.edit( '', false );
			}

			return true;
		} else {
			this.edit( '', false );

			this.outro = this.outro.replace( rx, '' );
			if ( this.outro.length ) { return true; }
		}
	}
};

var _btoa;

if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
	_btoa = window.btoa;
} else if ( typeof Buffer === 'function' ) {
	_btoa = function (str) { return new Buffer( str ).toString( 'base64' ); };
} else {
	_btoa = function () {
		throw new Error( 'Unsupported environment: `window.btoa` or `Buffer` should be supported.' );
	};
}

var btoa = _btoa;

function SourceMap ( properties ) {
	this.version = 3;

	this.file           = properties.file;
	this.sources        = properties.sources;
	this.sourcesContent = properties.sourcesContent;
	this.names          = properties.names;
	this.mappings       = properties.mappings;
}

SourceMap.prototype = {
	toString: function toString () {
		return JSON.stringify( this );
	},

	toUrl: function toUrl () {
		return 'data:application/json;charset=utf-8;base64,' + btoa( this.toString() );
	}
};

function guessIndent ( code ) {
	var lines = code.split( '\n' );

	var tabbed = lines.filter( function (line) { return /^\t+/.test( line ); } );
	var spaced = lines.filter( function (line) { return /^ {2,}/.test( line ); } );

	if ( tabbed.length === 0 && spaced.length === 0 ) {
		return null;
	}

	// More lines tabbed than spaced? Assume tabs, and
	// default to tabs in the case of a tie (or nothing
	// to go on)
	if ( tabbed.length >= spaced.length ) {
		return '\t';
	}

	// Otherwise, we need to guess the multiple
	var min = spaced.reduce( function ( previous, current ) {
		var numSpaces = /^ +/.exec( current )[0].length;
		return Math.min( numSpaces, previous );
	}, Infinity );

	return new Array( min + 1 ).join( ' ' );
}

function getRelativePath ( from, to ) {
	var fromParts = from.split( /[\/\\]/ );
	var toParts = to.split( /[\/\\]/ );

	fromParts.pop(); // get dirname

	while ( fromParts[0] === toParts[0] ) {
		fromParts.shift();
		toParts.shift();
	}

	if ( fromParts.length ) {
		var i = fromParts.length;
		while ( i-- ) { fromParts[i] = '..'; }
	}

	return fromParts.concat( toParts ).join( '/' );
}

var toString$1 = Object.prototype.toString;

function isObject ( thing ) {
	return toString$1.call( thing ) === '[object Object]';
}

function getLocator ( source ) {
	var originalLines = source.split( '\n' );

	var start = 0;
	var lineRanges = originalLines.map( function ( line, i ) {
		var end = start + line.length + 1;
		var range = { start: start, end: end, line: i };

		start = end;
		return range;
	});

	var i = 0;

	function rangeContains ( range, index ) {
		return range.start <= index && index < range.end;
	}

	function getLocation ( range, index ) {
		return { line: range.line, column: index - range.start };
	}

	return function locate ( index ) {
		var range = lineRanges[i];

		var d = index >= range.end ? 1 : -1;

		while ( range ) {
			if ( rangeContains( range, index ) ) { return getLocation( range, index ); }

			i += d;
			range = lineRanges[i];
		}
	};
}

function Mappings ( hires ) {
	var this$1 = this;

	var offsets = {
		generatedCodeColumn: 0,
		sourceIndex: 0,
		sourceCodeLine: 0,
		sourceCodeColumn: 0,
		sourceCodeName: 0
	};

	var generatedCodeLine = 0;
	var generatedCodeColumn = 0;

	this.raw = [];
	var rawSegments = this.raw[ generatedCodeLine ] = [];

	var pending = null;

	this.addEdit = function ( sourceIndex, content, original, loc, nameIndex ) {
		if ( content.length ) {
			rawSegments.push([
				generatedCodeColumn,
				sourceIndex,
				loc.line,
				loc.column,
				nameIndex ]);
		} else if ( pending ) {
			rawSegments.push( pending );
		}

		this$1.advance( content );
		pending = null;
	};

	this.addUneditedChunk = function ( sourceIndex, chunk, original, loc, sourcemapLocations ) {
		var originalCharIndex = chunk.start;
		var first = true;

		while ( originalCharIndex < chunk.end ) {
			if ( hires || first || sourcemapLocations[ originalCharIndex ] ) {
				rawSegments.push([
					generatedCodeColumn,
					sourceIndex,
					loc.line,
					loc.column,
					-1
				]);
			}

			if ( original[ originalCharIndex ] === '\n' ) {
				loc.line += 1;
				loc.column = 0;
				generatedCodeLine += 1;
				this$1.raw[ generatedCodeLine ] = rawSegments = [];
				generatedCodeColumn = 0;
			} else {
				loc.column += 1;
				generatedCodeColumn += 1;
			}

			originalCharIndex += 1;
			first = false;
		}

		pending = [
			generatedCodeColumn,
			sourceIndex,
			loc.line,
			loc.column,
			-1 ];
	};

	this.advance = function (str) {
		if ( !str ) { return; }

		var lines = str.split( '\n' );
		var lastLine = lines.pop();

		if ( lines.length ) {
			generatedCodeLine += lines.length;
			this$1.raw[ generatedCodeLine ] = rawSegments = [];
			generatedCodeColumn = lastLine.length;
		} else {
			generatedCodeColumn += lastLine.length;
		}
	};

	this.encode = function () {
		return this$1.raw.map( function (segments) {
			var generatedCodeColumn = 0;

			return segments.map( function (segment) {
				var arr = [
					segment[0] - generatedCodeColumn,
					segment[1] - offsets.sourceIndex,
					segment[2] - offsets.sourceCodeLine,
					segment[3] - offsets.sourceCodeColumn
				];

				generatedCodeColumn = segment[0];
				offsets.sourceIndex = segment[1];
				offsets.sourceCodeLine = segment[2];
				offsets.sourceCodeColumn = segment[3];

				if ( ~segment[4] ) {
					arr.push( segment[4] - offsets.sourceCodeName );
					offsets.sourceCodeName = segment[4];
				}

				return vlq.encode( arr );
			}).join( ',' );
		}).join( ';' );
	};
}

var Stats = function Stats () {
	Object.defineProperties( this, {
		startTimes: { value: {} }
	});
};

Stats.prototype.time = function time ( label ) {
	this.startTimes[ label ] = process.hrtime();
};

Stats.prototype.timeEnd = function timeEnd ( label ) {
	var elapsed = process.hrtime( this.startTimes[ label ] );

	if ( !this[ label ] ) { this[ label ] = 0; }
	this[ label ] += elapsed[0] * 1e3 + elapsed[1] * 1e-6;
};

var warned = {
	insertLeft: false,
	insertRight: false,
	storeName: false
};

function MagicString$1 ( string, options ) {
	if ( options === void 0 ) options = {};

	var chunk = new Chunk( 0, string.length, string );

	Object.defineProperties( this, {
		original:              { writable: true, value: string },
		outro:                 { writable: true, value: '' },
		intro:                 { writable: true, value: '' },
		firstChunk:            { writable: true, value: chunk },
		lastChunk:             { writable: true, value: chunk },
		lastSearchedChunk:     { writable: true, value: chunk },
		byStart:               { writable: true, value: {} },
		byEnd:                 { writable: true, value: {} },
		filename:              { writable: true, value: options.filename },
		indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
		sourcemapLocations:    { writable: true, value: {} },
		storedNames:           { writable: true, value: {} },
		indentStr:             { writable: true, value: guessIndent( string ) }
	});

	this.byStart[ 0 ] = chunk;
	this.byEnd[ string.length ] = chunk;
}

MagicString$1.prototype = {
	addSourcemapLocation: function addSourcemapLocation ( char ) {
		this.sourcemapLocations[ char ] = true;
	},

	append: function append ( content ) {
		if ( typeof content !== 'string' ) { throw new TypeError( 'outro content must be a string' ); }

		this.outro += content;
		return this;
	},

	appendLeft: function appendLeft ( index, content ) {
		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

		this._split( index );

		var chunk = this.byEnd[ index ];

		if ( chunk ) {
			chunk.appendLeft( content );
		} else {
			this.intro += content;
		}

		return this;
	},

	appendRight: function appendRight ( index, content ) {
		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

		this._split( index );

		var chunk = this.byStart[ index ];

		if ( chunk ) {
			chunk.appendRight( content );
		} else {
			this.outro += content;
		}

		return this;
	},

	clone: function clone () {
		var cloned = new MagicString$1( this.original, { filename: this.filename });

		var originalChunk = this.firstChunk;
		var clonedChunk = cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone();

		while ( originalChunk ) {
			cloned.byStart[ clonedChunk.start ] = clonedChunk;
			cloned.byEnd[ clonedChunk.end ] = clonedChunk;

			var nextOriginalChunk = originalChunk.next;
			var nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

			if ( nextClonedChunk ) {
				clonedChunk.next = nextClonedChunk;
				nextClonedChunk.previous = clonedChunk;

				clonedChunk = nextClonedChunk;
			}

			originalChunk = nextOriginalChunk;
		}

		cloned.lastChunk = clonedChunk;

		if ( this.indentExclusionRanges ) {
			cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
		}

		Object.keys( this.sourcemapLocations ).forEach( function (loc) {
			cloned.sourcemapLocations[ loc ] = true;
		});

		return cloned;
	},

	generateMap: function generateMap ( options ) {
		var this$1 = this;

		options = options || {};

		var sourceIndex = 0;
		var names = Object.keys( this.storedNames );
		var mappings = new Mappings( options.hires );

		var locate = getLocator( this.original );

		if ( this.intro ) {
			mappings.advance( this.intro );
		}

		this.firstChunk.eachNext( function (chunk) {
			var loc = locate( chunk.start );

			if ( chunk.intro.length ) { mappings.advance( chunk.intro ); }

			if ( chunk.edited ) {
				mappings.addEdit( sourceIndex, chunk.content, chunk.original, loc, chunk.storeName ? names.indexOf( chunk.original ) : -1 );
			} else {
				mappings.addUneditedChunk( sourceIndex, chunk, this$1.original, loc, this$1.sourcemapLocations );
			}

			if ( chunk.outro.length ) { mappings.advance( chunk.outro ); }
		});

		var map = new SourceMap({
			file: ( options.file ? options.file.split( /[\/\\]/ ).pop() : null ),
			sources: [ options.source ? getRelativePath( options.file || '', options.source ) : null ],
			sourcesContent: options.includeContent ? [ this.original ] : [ null ],
			names: names,
			mappings: mappings.encode()
		});
		return map;
	},

	getIndentString: function getIndentString () {
		return this.indentStr === null ? '\t' : this.indentStr;
	},

	indent: function indent ( indentStr, options ) {
		var this$1 = this;

		var pattern = /^[^\r\n]/gm;

		if ( isObject( indentStr ) ) {
			options = indentStr;
			indentStr = undefined;
		}

		indentStr = indentStr !== undefined ? indentStr : ( this.indentStr || '\t' );

		if ( indentStr === '' ) { return this; } // noop

		options = options || {};

		// Process exclusion ranges
		var isExcluded = {};

		if ( options.exclude ) {
			var exclusions = typeof options.exclude[0] === 'number' ? [ options.exclude ] : options.exclude;
			exclusions.forEach( function (exclusion) {
				for ( var i = exclusion[0]; i < exclusion[1]; i += 1 ) {
					isExcluded[i] = true;
				}
			});
		}

		var shouldIndentNextCharacter = options.indentStart !== false;
		var replacer = function (match) {
			if ( shouldIndentNextCharacter ) { return ("" + indentStr + match); }
			shouldIndentNextCharacter = true;
			return match;
		};

		this.intro = this.intro.replace( pattern, replacer );

		var charIndex = 0;

		var chunk = this.firstChunk;

		while ( chunk ) {
			var end = chunk.end;

			if ( chunk.edited ) {
				if ( !isExcluded[ charIndex ] ) {
					chunk.content = chunk.content.replace( pattern, replacer );

					if ( chunk.content.length ) {
						shouldIndentNextCharacter = chunk.content[ chunk.content.length - 1 ] === '\n';
					}
				}
			} else {
				charIndex = chunk.start;

				while ( charIndex < end ) {
					if ( !isExcluded[ charIndex ] ) {
						var char = this$1.original[ charIndex ];

						if ( char === '\n' ) {
							shouldIndentNextCharacter = true;
						} else if ( char !== '\r' && shouldIndentNextCharacter ) {
							shouldIndentNextCharacter = false;

							if ( charIndex === chunk.start ) {
								chunk.prependRight( indentStr );
							} else {
								var rhs = chunk.split( charIndex );
								rhs.prependRight( indentStr );

								this$1.byStart[ charIndex ] = rhs;
								this$1.byEnd[ charIndex ] = chunk;

								chunk = rhs;
							}
						}
					}

					charIndex += 1;
				}
			}

			charIndex = chunk.end;
			chunk = chunk.next;
		}

		this.outro = this.outro.replace( pattern, replacer );

		return this;
	},

	insert: function insert () {
		throw new Error( 'magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)' );
	},

	insertLeft: function insertLeft ( index, content ) {
		if ( !warned.insertLeft ) {
			console.warn( 'magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead' ); // eslint-disable-line no-console
			warned.insertLeft = true;
		}

		return this.appendLeft( index, content );
	},

	insertRight: function insertRight ( index, content ) {
		if ( !warned.insertRight ) {
			console.warn( 'magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead' ); // eslint-disable-line no-console
			warned.insertRight = true;
		}

		return this.prependRight( index, content );
	},

	move: function move ( start, end, index ) {
		if ( index >= start && index <= end ) { throw new Error( 'Cannot move a selection inside itself' ); }

		this._split( start );
		this._split( end );
		this._split( index );

		var first = this.byStart[ start ];
		var last = this.byEnd[ end ];

		var oldLeft = first.previous;
		var oldRight = last.next;

		var newRight = this.byStart[ index ];
		if ( !newRight && last === this.lastChunk ) { return this; }
		var newLeft = newRight ? newRight.previous : this.lastChunk;

		if ( oldLeft ) { oldLeft.next = oldRight; }
		if ( oldRight ) { oldRight.previous = oldLeft; }

		if ( newLeft ) { newLeft.next = first; }
		if ( newRight ) { newRight.previous = last; }

		if ( !first.previous ) { this.firstChunk = last.next; }
		if ( !last.next ) {
			this.lastChunk = first.previous;
			this.lastChunk.next = null;
		}

		first.previous = newLeft;
		last.next = newRight;

		if ( !newLeft ) { this.firstChunk = first; }
		if ( !newRight ) { this.lastChunk = last; }

		return this;
	},

	overwrite: function overwrite ( start, end, content, options ) {
		var this$1 = this;

		if ( typeof content !== 'string' ) { throw new TypeError( 'replacement content must be a string' ); }

		while ( start < 0 ) { start += this$1.original.length; }
		while ( end < 0 ) { end += this$1.original.length; }

		if ( end > this.original.length ) { throw new Error( 'end is out of bounds' ); }
		if ( start === end ) { throw new Error( 'Cannot overwrite a zero-length range – use appendLeft or prependRight instead' ); }

		this._split( start );
		this._split( end );

		if ( options === true ) {
			if ( !warned.storeName ) {
				console.warn( 'The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string' ); // eslint-disable-line no-console
				warned.storeName = true;
			}

			options = { storeName: true };
		}
		var storeName = options !== undefined ? options.storeName : false;
		var contentOnly = options !== undefined ? options.contentOnly : false;

		if ( storeName ) {
			var original = this.original.slice( start, end );
			this.storedNames[ original ] = true;
		}

		var first = this.byStart[ start ];
		var last = this.byEnd[ end ];

		if ( first ) {
			if ( end > first.end && first.next !== this.byStart[ first.end ] ) {
				throw new Error( 'Cannot overwrite across a split point' );
			}

			first.edit( content, storeName, contentOnly );

			if ( last ) {
				first.next = last.next;
			} else {
				first.next = null;
				this.lastChunk = first;
			}

			first.original = this.original.slice( start, end );
			first.end = end;
		}

		else {
			// must be inserting at the end
			var newChunk = new Chunk( start, end, '' ).edit( content, storeName );

			// TODO last chunk in the array may not be the last chunk, if it's moved...
			last.next = newChunk;
			newChunk.previous = last;
		}

		return this;
	},

	prepend: function prepend ( content ) {
		if ( typeof content !== 'string' ) { throw new TypeError( 'outro content must be a string' ); }

		this.intro = content + this.intro;
		return this;
	},

	prependLeft: function prependLeft ( index, content ) {
		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

		this._split( index );

		var chunk = this.byEnd[ index ];

		if ( chunk ) {
			chunk.prependLeft( content );
		} else {
			this.intro = content + this.intro;
		}

		return this;
	},

	prependRight: function prependRight ( index, content ) {
		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

		this._split( index );

		var chunk = this.byStart[ index ];

		if ( chunk ) {
			chunk.prependRight( content );
		} else {
			this.outro = content + this.outro;
		}

		return this;
	},

	remove: function remove ( start, end ) {
		var this$1 = this;

		while ( start < 0 ) { start += this$1.original.length; }
		while ( end < 0 ) { end += this$1.original.length; }

		if ( start === end ) { return this; }

		if ( start < 0 || end > this.original.length ) { throw new Error( 'Character is out of bounds' ); }
		if ( start > end ) { throw new Error( 'end must be greater than start' ); }

		this._split( start );
		this._split( end );

		var chunk = this.byStart[ start ];

		while ( chunk ) {
			chunk.intro = '';
			chunk.outro = '';
			chunk.edit( '' );

			chunk = end > chunk.end ? this$1.byStart[ chunk.end ] : null;
		}

		return this;
	},

	slice: function slice ( start, end ) {
		var this$1 = this;
		if ( start === void 0 ) start = 0;
		if ( end === void 0 ) end = this.original.length;

		while ( start < 0 ) { start += this$1.original.length; }
		while ( end < 0 ) { end += this$1.original.length; }

		var result = '';

		// find start chunk
		var chunk = this.firstChunk;
		while ( chunk && ( chunk.start > start || chunk.end <= start ) ) {

			// found end chunk before start
			if ( chunk.start < end && chunk.end >= end ) {
				return result;
			}

			chunk = chunk.next;
		}

		if ( chunk && chunk.edited && chunk.start !== start ) { throw new Error(("Cannot use replaced character " + start + " as slice start anchor.")); }

		var startChunk = chunk;
		while ( chunk ) {
			if ( chunk.intro && ( startChunk !== chunk || chunk.start === start ) ) {
				result += chunk.intro;
			}

			var containsEnd = chunk.start < end && chunk.end >= end;
			if ( containsEnd && chunk.edited && chunk.end !== end ) { throw new Error(("Cannot use replaced character " + end + " as slice end anchor.")); }

			var sliceStart = startChunk === chunk ? start - chunk.start : 0;
			var sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;

			result += chunk.content.slice( sliceStart, sliceEnd );

			if ( chunk.outro && ( !containsEnd || chunk.end === end ) ) {
				result += chunk.outro;
			}

			if ( containsEnd ) {
				break;
			}

			chunk = chunk.next;
		}

		return result;
	},

	// TODO deprecate this? not really very useful
	snip: function snip ( start, end ) {
		var clone = this.clone();
		clone.remove( 0, start );
		clone.remove( end, clone.original.length );

		return clone;
	},

	_split: function _split ( index ) {
		var this$1 = this;

		if ( this.byStart[ index ] || this.byEnd[ index ] ) { return; }

		var chunk = this.lastSearchedChunk;
		var searchForward = index > chunk.end;

		while ( true ) {
			if ( chunk.contains( index ) ) { return this$1._splitChunk( chunk, index ); }

			chunk = searchForward ?
				this$1.byStart[ chunk.end ] :
				this$1.byEnd[ chunk.start ];
		}
	},

	_splitChunk: function _splitChunk ( chunk, index ) {
		if ( chunk.edited && chunk.content.length ) { // zero-length edited chunks are a special case (overlapping replacements)
			var loc = getLocator( this.original )( index );
			throw new Error( ("Cannot split a chunk that has already been edited (" + (loc.line) + ":" + (loc.column) + " – \"" + (chunk.original) + "\")") );
		}

		var newChunk = chunk.split( index );

		this.byEnd[ index ] = chunk;
		this.byStart[ index ] = newChunk;
		this.byEnd[ newChunk.end ] = newChunk;

		if ( chunk === this.lastChunk ) { this.lastChunk = newChunk; }

		this.lastSearchedChunk = chunk;
		return true;
	},

	toString: function toString () {
		var str = this.intro;

		var chunk = this.firstChunk;
		while ( chunk ) {
			str += chunk.toString();
			chunk = chunk.next;
		}

		return str + this.outro;
	},

	trimLines: function trimLines () {
		return this.trim('[\\r\\n]');
	},

	trim: function trim ( charType ) {
		return this.trimStart( charType ).trimEnd( charType );
	},

	trimEnd: function trimEnd ( charType ) {
		var this$1 = this;

		var rx = new RegExp( ( charType || '\\s' ) + '+$' );

		this.outro = this.outro.replace( rx, '' );
		if ( this.outro.length ) { return this; }

		var chunk = this.lastChunk;

		do {
			var end = chunk.end;
			var aborted = chunk.trimEnd( rx );

			// if chunk was trimmed, we have a new lastChunk
			if ( chunk.end !== end ) {
				this$1.lastChunk = chunk.next;

				this$1.byEnd[ chunk.end ] = chunk;
				this$1.byStart[ chunk.next.start ] = chunk.next;
			}

			if ( aborted ) { return this$1; }
			chunk = chunk.previous;
		} while ( chunk );

		return this;
	},

	trimStart: function trimStart ( charType ) {
		var this$1 = this;

		var rx = new RegExp( '^' + ( charType || '\\s' ) + '+' );

		this.intro = this.intro.replace( rx, '' );
		if ( this.intro.length ) { return this; }

		var chunk = this.firstChunk;

		do {
			var end = chunk.end;
			var aborted = chunk.trimStart( rx );

			if ( chunk.end !== end ) {
				// special case...
				if ( chunk === this$1.lastChunk ) { this$1.lastChunk = chunk.next; }

				this$1.byEnd[ chunk.end ] = chunk;
				this$1.byStart[ chunk.next.start ] = chunk.next;
			}

			if ( aborted ) { return this$1; }
			chunk = chunk.next;
		} while ( chunk );

		return this;
	}
};

var hasOwnProp = Object.prototype.hasOwnProperty;

function Bundle ( options ) {
	if ( options === void 0 ) options = {};

	this.intro = options.intro || '';
	this.separator = options.separator !== undefined ? options.separator : '\n';

	this.sources = [];

	this.uniqueSources = [];
	this.uniqueSourceIndexByFilename = {};
}

Bundle.prototype = {
	addSource: function addSource ( source ) {
		if ( source instanceof MagicString$1 ) {
			return this.addSource({
				content: source,
				filename: source.filename,
				separator: this.separator
			});
		}

		if ( !isObject( source ) || !source.content ) {
			throw new Error( 'bundle.addSource() takes an object with a `content` property, which should be an instance of MagicString, and an optional `filename`' );
		}

		[ 'filename', 'indentExclusionRanges', 'separator' ].forEach( function (option) {
			if ( !hasOwnProp.call( source, option ) ) { source[ option ] = source.content[ option ]; }
		});

		if ( source.separator === undefined ) { // TODO there's a bunch of this sort of thing, needs cleaning up
			source.separator = this.separator;
		}

		if ( source.filename ) {
			if ( !hasOwnProp.call( this.uniqueSourceIndexByFilename, source.filename ) ) {
				this.uniqueSourceIndexByFilename[ source.filename ] = this.uniqueSources.length;
				this.uniqueSources.push({ filename: source.filename, content: source.content.original });
			} else {
				var uniqueSource = this.uniqueSources[ this.uniqueSourceIndexByFilename[ source.filename ] ];
				if ( source.content.original !== uniqueSource.content ) {
					throw new Error( ("Illegal source: same filename (" + (source.filename) + "), different contents") );
				}
			}
		}

		this.sources.push( source );
		return this;
	},

	append: function append ( str, options ) {
		this.addSource({
			content: new MagicString$1( str ),
			separator: ( options && options.separator ) || ''
		});

		return this;
	},

	clone: function clone () {
		var bundle = new Bundle({
			intro: this.intro,
			separator: this.separator
		});

		this.sources.forEach( function (source) {
			bundle.addSource({
				filename: source.filename,
				content: source.content.clone(),
				separator: source.separator
			});
		});

		return bundle;
	},

	generateMap: function generateMap ( options ) {
		var this$1 = this;
		if ( options === void 0 ) options = {};

		var names = [];
		this.sources.forEach( function (source) {
			Object.keys( source.content.storedNames ).forEach( function (name) {
				if ( !~names.indexOf( name ) ) { names.push( name ); }
			});
		});

		var mappings = new Mappings( options.hires );

		if ( this.intro ) {
			mappings.advance( this.intro );
		}

		this.sources.forEach( function ( source, i ) {
			if ( i > 0 ) {
				mappings.advance( this$1.separator );
			}

			var sourceIndex = source.filename ? this$1.uniqueSourceIndexByFilename[ source.filename ] : -1;
			var magicString = source.content;
			var locate = getLocator( magicString.original );

			if ( magicString.intro ) {
				mappings.advance( magicString.intro );
			}

			magicString.firstChunk.eachNext( function (chunk) {
				var loc = locate( chunk.start );

				if ( chunk.intro.length ) { mappings.advance( chunk.intro ); }

				if ( source.filename ) {
					if ( chunk.edited ) {
						mappings.addEdit( sourceIndex, chunk.content, chunk.original, loc, chunk.storeName ? names.indexOf( chunk.original ) : -1 );
					} else {
						mappings.addUneditedChunk( sourceIndex, chunk, magicString.original, loc, magicString.sourcemapLocations );
					}
				}

				else {
					mappings.advance( chunk.content );
				}

				if ( chunk.outro.length ) { mappings.advance( chunk.outro ); }
			});

			if ( magicString.outro ) {
				mappings.advance( magicString.outro );
			}
		});

		return new SourceMap({
			file: ( options.file ? options.file.split( /[\/\\]/ ).pop() : null ),
			sources: this.uniqueSources.map( function (source) {
				return options.file ? getRelativePath( options.file, source.filename ) : source.filename;
			}),
			sourcesContent: this.uniqueSources.map( function (source) {
				return options.includeContent ? source.content : null;
			}),
			names: names,
			mappings: mappings.encode()
		});
	},

	getIndentString: function getIndentString () {
		var indentStringCounts = {};

		this.sources.forEach( function (source) {
			var indentStr = source.content.indentStr;

			if ( indentStr === null ) { return; }

			if ( !indentStringCounts[ indentStr ] ) { indentStringCounts[ indentStr ] = 0; }
			indentStringCounts[ indentStr ] += 1;
		});

		return ( Object.keys( indentStringCounts ).sort( function ( a, b ) {
			return indentStringCounts[a] - indentStringCounts[b];
		})[0] ) || '\t';
	},

	indent: function indent ( indentStr ) {
		var this$1 = this;

		if ( !arguments.length ) {
			indentStr = this.getIndentString();
		}

		if ( indentStr === '' ) { return this; } // noop

		var trailingNewline = !this.intro || this.intro.slice( -1 ) === '\n';

		this.sources.forEach( function ( source, i ) {
			var separator = source.separator !== undefined ? source.separator : this$1.separator;
			var indentStart = trailingNewline || ( i > 0 && /\r?\n$/.test( separator ) );

			source.content.indent( indentStr, {
				exclude: source.indentExclusionRanges,
				indentStart: indentStart//: trailingNewline || /\r?\n$/.test( separator )  //true///\r?\n/.test( separator )
			});

			// TODO this is a very slow way to determine this
			trailingNewline = source.content.toString().slice( 0, -1 ) === '\n';
		});

		if ( this.intro ) {
			this.intro = indentStr + this.intro.replace( /^[^\n]/gm, function ( match, index ) {
				return index > 0 ? indentStr + match : match;
			});
		}

		return this;
	},

	prepend: function prepend ( str ) {
		this.intro = str + this.intro;
		return this;
	},

	toString: function toString () {
		var this$1 = this;

		var body = this.sources.map( function ( source, i ) {
			var separator = source.separator !== undefined ? source.separator : this$1.separator;
			var str = ( i > 0 ? separator : '' ) + source.content.toString();

			return str;
		}).join( '' );

		return this.intro + body;
	},

	trimLines: function trimLines () {
		return this.trim('[\\r\\n]');
	},

	trim: function trim ( charType ) {
		return this.trimStart( charType ).trimEnd( charType );
	},

	trimStart: function trimStart ( charType ) {
		var this$1 = this;

		var rx = new RegExp( '^' + ( charType || '\\s' ) + '+' );
		this.intro = this.intro.replace( rx, '' );

		if ( !this.intro ) {
			var source;
			var i = 0;

			do {
				source = this$1.sources[i];

				if ( !source ) {
					break;
				}

				source.content.trimStart( charType );
				i += 1;
			} while ( source.content.toString() === '' ); // TODO faster way to determine non-empty source?
		}

		return this;
	},

	trimEnd: function trimEnd ( charType ) {
		var this$1 = this;

		var rx = new RegExp( ( charType || '\\s' ) + '+$' );

		var source;
		var i = this.sources.length - 1;

		do {
			source = this$1.sources[i];

			if ( !source ) {
				this$1.intro = this$1.intro.replace( rx, '' );
				break;
			}

			source.content.trimEnd( charType );
			i -= 1;
		} while ( source.content.toString() === '' ); // TODO faster way to determine non-empty source?

		return this;
	}
};

MagicString$1.Bundle = Bundle;
MagicString$1.default = MagicString$1; // work around TypeScript bug https://github.com/Rich-Harris/magic-string/pull/121

module.exports = MagicString$1;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"parse5":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/server-render/node_modules/parse5/package.json                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
exports.name = "parse5";
exports.version = "3.0.2";
exports.main = "./lib/index.js";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/server-render/node_modules/parse5/lib/index.js                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
'use strict';

var Parser = require('./parser'),
    Serializer = require('./serializer');


// Shorthands
exports.parse = function parse(html, options) {
    var parser = new Parser(options);

    return parser.parse(html);
};

exports.parseFragment = function parseFragment(fragmentContext, html, options) {
    if (typeof fragmentContext === 'string') {
        options = html;
        html = fragmentContext;
        fragmentContext = null;
    }

    var parser = new Parser(options);

    return parser.parseFragment(html, fragmentContext);
};

exports.serialize = function (node, options) {
    var serializer = new Serializer(node, options);

    return serializer.serialize();
};


// Tree adapters
exports.treeAdapters = {
    default: require('./tree_adapters/default'),
    htmlparser2: require('./tree_adapters/htmlparser2')
};


// Streaming
exports.ParserStream = require('./parser/parser_stream');
exports.PlainTextConversionStream = require('./parser/plain_text_conversion_stream');
exports.SerializerStream = require('./serializer/serializer_stream');
exports.SAXParser = require('./sax');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"combined-stream2":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/server-render/node_modules/combined-stream2/package.json                                   //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
exports.name = "combined-stream2";
exports.version = "1.1.2";
exports.main = "index.js";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/server-render/node_modules/combined-stream2/index.js                                       //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.exports = require("./lib/combined-stream2");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/server-render/server.js");

/* Exports */
Package._define("server-render", exports);

})();

//# sourceURL=meteor://💻app/packages/server-render.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc2VydmVyLXJlbmRlci9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NlcnZlci1yZW5kZXIvc2VydmVyLXJlZ2lzdGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zZXJ2ZXItcmVuZGVyL3NlcnZlci1zaW5rLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIm9uUGFnZUxvYWQiLCJNZXRlb3IiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2Iiwic3RhcnR1cFByb21pc2UiLCJQcm9taXNlIiwic3RhcnR1cCIsInBhZ2VMb2FkQ2FsbGJhY2tzIiwiU2V0IiwiY2FsbGJhY2siLCJhZGQiLCJyZW1vdmUiLCJkZWxldGUiLCJjbGVhciIsImNoYWluIiwiaGFuZGxlciIsInRoZW4iLCJwcm9taXNlIiwicmVzb2x2ZSIsImZvckVhY2giLCJXZWJBcHBJbnRlcm5hbHMiLCJNYWdpY1N0cmluZyIsImRlZmF1bHQiLCJTQVhQYXJzZXIiLCJjcmVhdGVTdHJlYW0iLCJjcmVhdGUiLCJTZXJ2ZXJTaW5rIiwiaXNSZWFkYWJsZSIsInJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2siLCJyZXF1ZXN0IiwiZGF0YSIsImFyY2giLCJzaW5rIiwibWF5YmVNYWRlQ2hhbmdlcyIsInJlYWxseU1hZGVDaGFuZ2VzIiwicmV3cml0ZSIsInByb3BlcnR5IiwiaHRtbCIsIm1hZ2ljIiwicGFyc2VyIiwibG9jYXRpb25JbmZvIiwiT2JqZWN0Iiwia2V5cyIsImh0bWxCeUlkIiwibGVuZ3RoIiwic3RyZWFtIiwibGFzdFN0YXJ0Iiwic3RhcnQiLCJvbiIsIm5hbWUiLCJhdHRycyIsInNlbGZDbG9zaW5nIiwibG9jIiwic29tZSIsImF0dHIiLCJ2YWx1ZSIsInNsaWNlIiwiZW5kT2Zmc2V0IiwiYXBwZW5kIiwiQnVmZmVyIiwiZnJvbSIsImxvY2F0aW9uIiwiZW5kIiwid3JpdGUiLCJiaW5kIiwiaGVhZCIsImR5bmFtaWNIZWFkIiwiYm9keSIsImR5bmFtaWNCb2R5Iiwic3RhdHVzQ29kZSIsInJlc3BvbnNlSGVhZGVycyIsImhlYWRlcnMiLCJjb25zdHJ1Y3RvciIsImFwcGVuZFRvSGVhZCIsImFwcGVuZENvbnRlbnQiLCJhcHBlbmRUb0JvZHkiLCJhcHBlbmRUb0VsZW1lbnRCeUlkIiwiaWQiLCJyZW5kZXJJbnRvRWxlbWVudEJ5SWQiLCJyZWRpcmVjdCIsImNvZGUiLCJMb2NhdGlvbiIsInNldFN0YXR1c0NvZGUiLCJzZXRIZWFkZXIiLCJrZXkiLCJnZXRIZWFkZXJzIiwiZ2V0Q29va2llcyIsImNvb2tpZXMiLCJwaXBlIiwicmVhZGFibGUiLCJfcmVhZCIsIl9yZWFkYWJsZVN0YXRlIiwib2JqZWN0IiwiY29udGVudCIsIm1hZGVDaGFuZ2VzIiwiQXJyYXkiLCJpc0FycmF5IiwiZWxlbSIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxjQUFXLE1BQUlBO0FBQWhCLENBQWQ7QUFBMkMsSUFBSUMsTUFBSjtBQUFXSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNGLFNBQU9HLENBQVAsRUFBUztBQUFDSCxhQUFPRyxDQUFQO0FBQVM7O0FBQXBCLENBQXRDLEVBQTRELENBQTVEO0FBQStETixPQUFPSSxLQUFQLENBQWFDLFFBQVEsc0JBQVIsQ0FBYjtBQUdySCxNQUFNRSxpQkFBaUIsSUFBSUMsT0FBSixDQUFZTCxPQUFPTSxPQUFuQixDQUF2QjtBQUNBLE1BQU1DLG9CQUFvQixJQUFJQyxHQUFKLEVBQTFCOztBQUVPLFNBQVNULFVBQVQsQ0FBb0JVLFFBQXBCLEVBQThCO0FBQ25DLE1BQUksT0FBT0EsUUFBUCxLQUFvQixVQUF4QixFQUFvQztBQUNsQ0Ysc0JBQWtCRyxHQUFsQixDQUFzQkQsUUFBdEI7QUFDRCxHQUhrQyxDQUtuQzs7O0FBQ0EsU0FBT0EsUUFBUDtBQUNEOztB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QnhELFFBQXRCLEVBQWdDNkQsSUFBaEMsQ0FBSixFQUEyQztBQUN6Q0gsc0JBQWMsSUFBZDtBQUNEO0FBQ0YsS0FKRDtBQUtELEdBTkQsTUFNTyxJQUFJbkUsV0FBV2tFLE9BQVgsQ0FBSixFQUF5QjtBQUM5QkQsV0FBT3hELFFBQVAsSUFBbUJ5RCxPQUFuQjtBQUNBQyxrQkFBYyxJQUFkO0FBQ0QsR0FITSxNQUdBLElBQUtELFVBQVVBLFdBQVdBLFFBQVFLLFFBQVIsQ0FBaUIsTUFBakIsQ0FBMUIsRUFBcUQ7QUFDMUROLFdBQU94RCxRQUFQLElBQW1CLENBQUN3RCxPQUFPeEQsUUFBUCxLQUFvQixFQUFyQixJQUEyQnlELE9BQTlDO0FBQ0FDLGtCQUFjLElBQWQ7QUFDRDs7QUFDRCxTQUFPQSxXQUFQO0FBQ0QsQyIsImZpbGUiOiIvcGFja2FnZXMvc2VydmVyLXJlbmRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gXCJtZXRlb3IvbWV0ZW9yXCI7XG5pbXBvcnQgXCIuL3NlcnZlci1yZWdpc3Rlci5qc1wiO1xuXG5jb25zdCBzdGFydHVwUHJvbWlzZSA9IG5ldyBQcm9taXNlKE1ldGVvci5zdGFydHVwKTtcbmNvbnN0IHBhZ2VMb2FkQ2FsbGJhY2tzID0gbmV3IFNldDtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uUGFnZUxvYWQoY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcGFnZUxvYWRDYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgY2FsbGJhY2sgc28gdGhhdCBpdCBjYW4gYmUgbW9yZSBlYXNpbHkgcmVtb3ZlZCBsYXRlci5cbiAgcmV0dXJuIGNhbGxiYWNrO1xufVxuXG5vblBhZ2VMb2FkLnJlbW92ZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICBwYWdlTG9hZENhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xufTtcblxub25QYWdlTG9hZC5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgcGFnZUxvYWRDYWxsYmFja3MuY2xlYXIoKTtcbn07XG5cbm9uUGFnZUxvYWQuY2hhaW4gPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICByZXR1cm4gc3RhcnR1cFByb21pc2UudGhlbigoKSA9PiB7XG4gICAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICBwYWdlTG9hZENhbGxiYWNrcy5mb3JFYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oKCkgPT4gaGFuZGxlcihjYWxsYmFjaykpO1xuICAgIH0pO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9KTtcbn07XG4iLCJpbXBvcnQgeyBXZWJBcHBJbnRlcm5hbHMgfSBmcm9tIFwibWV0ZW9yL3dlYmFwcFwiO1xuaW1wb3J0IE1hZ2ljU3RyaW5nIGZyb20gXCJtYWdpYy1zdHJpbmdcIjtcbmltcG9ydCB7IFNBWFBhcnNlciB9IGZyb20gXCJwYXJzZTVcIjtcbmltcG9ydCB7IGNyZWF0ZSBhcyBjcmVhdGVTdHJlYW0gfSBmcm9tIFwiY29tYmluZWQtc3RyZWFtMlwiO1xuaW1wb3J0IHsgU2VydmVyU2luaywgaXNSZWFkYWJsZSB9IGZyb20gXCIuL3NlcnZlci1zaW5rLmpzXCI7XG5pbXBvcnQgeyBvblBhZ2VMb2FkIH0gZnJvbSBcIi4vc2VydmVyLmpzXCI7XG5cbldlYkFwcEludGVybmFscy5yZWdpc3RlckJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrKFxuICBcIm1ldGVvci9zZXJ2ZXItcmVuZGVyXCIsXG4gIChyZXF1ZXN0LCBkYXRhLCBhcmNoKSA9PiB7XG4gICAgY29uc3Qgc2luayA9IG5ldyBTZXJ2ZXJTaW5rKHJlcXVlc3QsIGFyY2gpO1xuXG4gICAgcmV0dXJuIG9uUGFnZUxvYWQuY2hhaW4oXG4gICAgICBjYWxsYmFjayA9PiBjYWxsYmFjayhzaW5rLCByZXF1ZXN0KVxuICAgICkudGhlbigoKSA9PiB7XG4gICAgICBpZiAoISBzaW5rLm1heWJlTWFkZUNoYW5nZXMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBsZXQgcmVhbGx5TWFkZUNoYW5nZXMgPSBmYWxzZTtcblxuICAgICAgZnVuY3Rpb24gcmV3cml0ZShwcm9wZXJ0eSkge1xuICAgICAgICBjb25zdCBodG1sID0gZGF0YVtwcm9wZXJ0eV07XG4gICAgICAgIGlmICh0eXBlb2YgaHRtbCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1hZ2ljID0gbmV3IE1hZ2ljU3RyaW5nKGh0bWwpO1xuICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgU0FYUGFyc2VyKHtcbiAgICAgICAgICBsb2NhdGlvbkluZm86IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGF0YVtwcm9wZXJ0eV0gPSBwYXJzZXI7XG5cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHNpbmsuaHRtbEJ5SWQpLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGNyZWF0ZVN0cmVhbSgpO1xuXG4gICAgICAgICAgbGV0IGxhc3RTdGFydCA9IG1hZ2ljLnN0YXJ0O1xuICAgICAgICAgIHBhcnNlci5vbihcInN0YXJ0VGFnXCIsIChuYW1lLCBhdHRycywgc2VsZkNsb3NpbmcsIGxvYykgPT4ge1xuICAgICAgICAgICAgYXR0cnMuc29tZShhdHRyID0+IHtcbiAgICAgICAgICAgICAgaWYgKGF0dHIubmFtZSA9PT0gXCJpZFwiKSB7XG4gICAgICAgICAgICAgICAgbGV0IGh0bWwgPSBzaW5rLmh0bWxCeUlkW2F0dHIudmFsdWVdO1xuICAgICAgICAgICAgICAgIGlmIChodG1sKSB7XG4gICAgICAgICAgICAgICAgICByZWFsbHlNYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IG1hZ2ljLnNsaWNlKGxhc3RTdGFydCwgbG9jLmVuZE9mZnNldCk7XG4gICAgICAgICAgICAgICAgICBzdHJlYW0uYXBwZW5kKEJ1ZmZlci5mcm9tKHN0YXJ0LCBcInV0ZjhcIikpO1xuICAgICAgICAgICAgICAgICAgc3RyZWFtLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGh0bWwgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICA/IEJ1ZmZlci5mcm9tKGh0bWwsIFwidXRmOFwiKVxuICAgICAgICAgICAgICAgICAgICAgIDogaHRtbFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGxhc3RTdGFydCA9IGxvYy5lbmRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHBhcnNlci5vbihcImVuZFRhZ1wiLCAobmFtZSwgbG9jYXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbi5lbmRPZmZzZXQgPT09IGh0bWwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIC8vIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgICAgICAgICAgY29uc3QgZW5kID0gbWFnaWMuc2xpY2UobGFzdFN0YXJ0KTtcbiAgICAgICAgICAgICAgc3RyZWFtLmFwcGVuZChCdWZmZXIuZnJvbShlbmQsIFwidXRmOFwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGRhdGFbcHJvcGVydHldID0gc3RyZWFtO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyc2VyLndyaXRlKGh0bWwsIHBhcnNlci5lbmQuYmluZChwYXJzZXIpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNpbmsuaGVhZCkge1xuICAgICAgICBkYXRhLmR5bmFtaWNIZWFkID0gKGRhdGEuZHluYW1pY0hlYWQgfHwgXCJcIikgKyBzaW5rLmhlYWQ7XG4gICAgICAgIHJlYWxseU1hZGVDaGFuZ2VzID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKE9iamVjdC5rZXlzKHNpbmsuaHRtbEJ5SWQpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gV2UgZG9uJ3QgY3VycmVudGx5IGFsbG93IGluamVjdGluZyBIVE1MIGludG8gdGhlIDxoZWFkPiBleGNlcHRcbiAgICAgICAgLy8gYnkgY2FsbGluZyBzaW5rLmFwcGVuZEhlYWQoaHRtbCkuXG4gICAgICAgIHJld3JpdGUoXCJib2R5XCIpO1xuICAgICAgICByZXdyaXRlKFwiZHluYW1pY0JvZHlcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaW5rLmJvZHkpIHtcbiAgICAgICAgZGF0YS5keW5hbWljQm9keSA9IChkYXRhLmR5bmFtaWNCb2R5IHx8IFwiXCIpICsgc2luay5ib2R5O1xuICAgICAgICByZWFsbHlNYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaW5rLnN0YXR1c0NvZGUpIHtcbiAgICAgICAgZGF0YS5zdGF0dXNDb2RlID0gc2luay5zdGF0dXNDb2RlO1xuICAgICAgICByZWFsbHlNYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChPYmplY3Qua2V5cyhzaW5rLnJlc3BvbnNlSGVhZGVycykpe1xuICAgICAgICBkYXRhLmhlYWRlcnMgPSBzaW5rLnJlc3BvbnNlSGVhZGVycztcbiAgICAgICAgcmVhbGx5TWFkZUNoYW5nZXMgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVhbGx5TWFkZUNoYW5nZXM7XG4gICAgfSk7XG4gIH1cbik7XG4iLCJleHBvcnQgY2xhc3MgU2VydmVyU2luayB7XG4gIGNvbnN0cnVjdG9yKHJlcXVlc3QsIGFyY2gpIHtcbiAgICB0aGlzLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgIHRoaXMuYXJjaCA9IGFyY2g7XG4gICAgdGhpcy5oZWFkID0gXCJcIjtcbiAgICB0aGlzLmJvZHkgPSBcIlwiO1xuICAgIHRoaXMuaHRtbEJ5SWQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMubWF5YmVNYWRlQ2hhbmdlcyA9IGZhbHNlO1xuICAgIHRoaXMuc3RhdHVzQ29kZSA9IG51bGw7XG4gICAgdGhpcy5yZXNwb25zZUhlYWRlcnMgPSB7fTtcbiAgfVxuXG4gIGFwcGVuZFRvSGVhZChodG1sKSB7XG4gICAgaWYgKGFwcGVuZENvbnRlbnQodGhpcywgXCJoZWFkXCIsIGh0bWwpKSB7XG4gICAgICB0aGlzLm1heWJlTWFkZUNoYW5nZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFwcGVuZFRvQm9keShodG1sKSB7XG4gICAgaWYgKGFwcGVuZENvbnRlbnQodGhpcywgXCJib2R5XCIsIGh0bWwpKSB7XG4gICAgICB0aGlzLm1heWJlTWFkZUNoYW5nZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFwcGVuZFRvRWxlbWVudEJ5SWQoaWQsIGh0bWwpIHtcbiAgICBpZiAoYXBwZW5kQ29udGVudCh0aGlzLmh0bWxCeUlkLCBpZCwgaHRtbCkpIHtcbiAgICAgIHRoaXMubWF5YmVNYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVySW50b0VsZW1lbnRCeUlkKGlkLCBodG1sKSB7XG4gICAgdGhpcy5odG1sQnlJZFtpZF0gPSBcIlwiO1xuICAgIHRoaXMuYXBwZW5kVG9FbGVtZW50QnlJZChpZCwgaHRtbCk7XG4gIH1cblxuICByZWRpcmVjdChsb2NhdGlvbiwgY29kZSA9IDMwMSkge1xuICAgIHRoaXMubWF5YmVNYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgdGhpcy5zdGF0dXNDb2RlID0gY29kZTtcbiAgICB0aGlzLnJlc3BvbnNlSGVhZGVycy5Mb2NhdGlvbiA9IGxvY2F0aW9uO1xuICB9XG5cbiAgLy8gc2VydmVyIG9ubHkgbWV0aG9kc1xuICBzZXRTdGF0dXNDb2RlKGNvZGUpIHtcbiAgICB0aGlzLm1heWJlTWFkZUNoYW5nZXMgPSB0cnVlO1xuICAgIHRoaXMuc3RhdHVzQ29kZSA9IGNvZGU7XG4gIH1cblxuICBzZXRIZWFkZXIoa2V5LCB2YWx1ZSkge1xuICAgIHRoaXMubWF5YmVNYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgdGhpcy5yZXNwb25zZUhlYWRlcnNba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0SGVhZGVycygpIHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0LmhlYWRlcnM7XG4gIH1cblxuICBnZXRDb29raWVzKCkge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QuY29va2llcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNSZWFkYWJsZShzdHJlYW0pIHtcbiAgcmV0dXJuIChcbiAgICBzdHJlYW0gIT09IG51bGwgJiZcbiAgICB0eXBlb2Ygc3RyZWFtID09PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiBzdHJlYW0ucGlwZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHN0cmVhbS5yZWFkYWJsZSAhPT0gZmFsc2UgJiZcbiAgICB0eXBlb2Ygc3RyZWFtLl9yZWFkID09PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIHN0cmVhbS5fcmVhZGFibGVTdGF0ZSA9PT0gJ29iamVjdCdcbiAgKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ29udGVudChvYmplY3QsIHByb3BlcnR5LCBjb250ZW50KSB7XG4gIGxldCBtYWRlQ2hhbmdlcyA9IGZhbHNlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGNvbnRlbnQpKSB7XG4gICAgY29udGVudC5mb3JFYWNoKGVsZW0gPT4ge1xuICAgICAgaWYgKGFwcGVuZENvbnRlbnQob2JqZWN0LCBwcm9wZXJ0eSwgZWxlbSkpIHtcbiAgICAgICAgbWFkZUNoYW5nZXMgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKGlzUmVhZGFibGUoY29udGVudCkpIHtcbiAgICBvYmplY3RbcHJvcGVydHldID0gY29udGVudDtcbiAgICBtYWRlQ2hhbmdlcyA9IHRydWU7XG4gIH0gZWxzZSBpZiAoKGNvbnRlbnQgPSBjb250ZW50ICYmIGNvbnRlbnQudG9TdHJpbmcoXCJ1dGY4XCIpKSkge1xuICAgIG9iamVjdFtwcm9wZXJ0eV0gPSAob2JqZWN0W3Byb3BlcnR5XSB8fCBcIlwiKSArIGNvbnRlbnQ7XG4gICAgbWFkZUNoYW5nZXMgPSB0cnVlO1xuICB9IFxuICByZXR1cm4gbWFkZUNoYW5nZXM7XG59XG4iXX0=

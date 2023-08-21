//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/amplify/packages/amplify.js                                                                 //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/amplify/amplify.js                                                                   //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
/*!                                                                                              // 1
 * Amplify 1.1.2                                                                                 // 2
 *                                                                                               // 3
 * Copyright 2011 - 2013 appendTo LLC. (http://appendto.com/team)                                // 4
 * Dual licensed under the MIT or GPL licenses.                                                  // 5
 * http://appendto.com/open-source-licenses                                                      // 6
 *                                                                                               // 7
 * http://amplifyjs.com                                                                          // 8
 */                                                                                              // 9
(function( global, undefined ) {                                                                 // 10
                                                                                                 // 11
var slice = [].slice,                                                                            // 12
	subscriptions = {};                                                                             // 13
                                                                                                 // 14
var amplify = global.amplify = {                                                                 // 15
	publish: function( topic ) {                                                                    // 16
		if ( typeof topic !== "string" ) {                                                             // 17
			throw new Error( "You must provide a valid topic to publish." );                              // 18
		}                                                                                              // 19
                                                                                                 // 20
		var args = slice.call( arguments, 1 ),                                                         // 21
			topicSubscriptions,                                                                           // 22
			subscription,                                                                                 // 23
			length,                                                                                       // 24
			i = 0,                                                                                        // 25
			ret;                                                                                          // 26
                                                                                                 // 27
		if ( !subscriptions[ topic ] ) {                                                               // 28
			return true;                                                                                  // 29
		}                                                                                              // 30
                                                                                                 // 31
		topicSubscriptions = subscriptions[ topic ].slice();                                           // 32
		for ( length = topicSubscriptions.length; i < length; i++ ) {                                  // 33
			subscription = topicSubscriptions[ i ];                                                       // 34
			ret = subscription.callback.apply( subscription.context, args );                              // 35
			if ( ret === false ) {                                                                        // 36
				break;                                                                                       // 37
			}                                                                                             // 38
		}                                                                                              // 39
		return ret !== false;                                                                          // 40
	},                                                                                              // 41
                                                                                                 // 42
	subscribe: function( topic, context, callback, priority ) {                                     // 43
		if ( typeof topic !== "string" ) {                                                             // 44
			throw new Error( "You must provide a valid topic to create a subscription." );                // 45
		}                                                                                              // 46
                                                                                                 // 47
		if ( arguments.length === 3 && typeof callback === "number" ) {                                // 48
			priority = callback;                                                                          // 49
			callback = context;                                                                           // 50
			context = null;                                                                               // 51
		}                                                                                              // 52
		if ( arguments.length === 2 ) {                                                                // 53
			callback = context;                                                                           // 54
			context = null;                                                                               // 55
		}                                                                                              // 56
		priority = priority || 10;                                                                     // 57
                                                                                                 // 58
		var topicIndex = 0,                                                                            // 59
			topics = topic.split( /\s/ ),                                                                 // 60
			topicLength = topics.length,                                                                  // 61
			added;                                                                                        // 62
		for ( ; topicIndex < topicLength; topicIndex++ ) {                                             // 63
			topic = topics[ topicIndex ];                                                                 // 64
			added = false;                                                                                // 65
			if ( !subscriptions[ topic ] ) {                                                              // 66
				subscriptions[ topic ] = [];                                                                 // 67
			}                                                                                             // 68
                                                                                                 // 69
			var i = subscriptions[ topic ].length - 1,                                                    // 70
				subscriptionInfo = {                                                                         // 71
					callback: callback,                                                                         // 72
					context: context,                                                                           // 73
					priority: priority                                                                          // 74
				};                                                                                           // 75
                                                                                                 // 76
			for ( ; i >= 0; i-- ) {                                                                       // 77
				if ( subscriptions[ topic ][ i ].priority <= priority ) {                                    // 78
					subscriptions[ topic ].splice( i + 1, 0, subscriptionInfo );                                // 79
					added = true;                                                                               // 80
					break;                                                                                      // 81
				}                                                                                            // 82
			}                                                                                             // 83
                                                                                                 // 84
			if ( !added ) {                                                                               // 85
				subscriptions[ topic ].unshift( subscriptionInfo );                                          // 86
			}                                                                                             // 87
		}                                                                                              // 88
                                                                                                 // 89
		return callback;                                                                               // 90
	},                                                                                              // 91
                                                                                                 // 92
	unsubscribe: function( topic, context, callback ) {                                             // 93
		if ( typeof topic !== "string" ) {                                                             // 94
			throw new Error( "You must provide a valid topic to remove a subscription." );                // 95
		}                                                                                              // 96
                                                                                                 // 97
		if ( arguments.length === 2 ) {                                                                // 98
			callback = context;                                                                           // 99
			context = null;                                                                               // 100
		}                                                                                              // 101
                                                                                                 // 102
		if ( !subscriptions[ topic ] ) {                                                               // 103
			return;                                                                                       // 104
		}                                                                                              // 105
                                                                                                 // 106
		var length = subscriptions[ topic ].length,                                                    // 107
			i = 0;                                                                                        // 108
                                                                                                 // 109
		for ( ; i < length; i++ ) {                                                                    // 110
			if ( subscriptions[ topic ][ i ].callback === callback ) {                                    // 111
				if ( !context || subscriptions[ topic ][ i ].context === context ) {                         // 112
					subscriptions[ topic ].splice( i, 1 );                                                      // 113
					                                                                                            // 114
					// Adjust counter and length for removed item                                               // 115
					i--;                                                                                        // 116
					length--;                                                                                   // 117
				}                                                                                            // 118
			}                                                                                             // 119
		}                                                                                              // 120
	}                                                                                               // 121
};                                                                                               // 122
                                                                                                 // 123
}( this ) );                                                                                     // 124
                                                                                                 // 125
(function( amplify, undefined ) {                                                                // 126
                                                                                                 // 127
var store = amplify.store = function( key, value, options ) {                                    // 128
	var type = store.type;                                                                          // 129
	if ( options && options.type && options.type in store.types ) {                                 // 130
		type = options.type;                                                                           // 131
	}                                                                                               // 132
	return store.types[ type ]( key, value, options || {} );                                        // 133
};                                                                                               // 134
                                                                                                 // 135
store.types = {};                                                                                // 136
store.type = null;                                                                               // 137
store.addType = function( type, storage ) {                                                      // 138
	if ( !store.type ) {                                                                            // 139
		store.type = type;                                                                             // 140
	}                                                                                               // 141
                                                                                                 // 142
	store.types[ type ] = storage;                                                                  // 143
	store[ type ] = function( key, value, options ) {                                               // 144
		options = options || {};                                                                       // 145
		options.type = type;                                                                           // 146
		return store( key, value, options );                                                           // 147
	};                                                                                              // 148
};                                                                                               // 149
store.error = function() {                                                                       // 150
	return "amplify.store quota exceeded";                                                          // 151
};                                                                                               // 152
                                                                                                 // 153
var rprefix = /^__amplify__/;                                                                    // 154
function createFromStorageInterface( storageType, storage ) {                                    // 155
	store.addType( storageType, function( key, value, options ) {                                   // 156
		var storedValue, parsed, i, remove,                                                            // 157
			ret = value,                                                                                  // 158
			now = (new Date()).getTime();                                                                 // 159
                                                                                                 // 160
		if ( !key ) {                                                                                  // 161
			ret = {};                                                                                     // 162
			remove = [];                                                                                  // 163
			i = 0;                                                                                        // 164
			try {                                                                                         // 165
				// accessing the length property works around a localStorage bug                             // 166
				// in Firefox 4.0 where the keys don't update cross-page                                     // 167
				// we assign to key just to avoid Closure Compiler from removing                             // 168
				// the access as "useless code"                                                              // 169
				// https://bugzilla.mozilla.org/show_bug.cgi?id=662511                                       // 170
				key = storage.length;                                                                        // 171
                                                                                                 // 172
				while ( key = storage.key( i++ ) ) {                                                         // 173
					if ( rprefix.test( key ) ) {                                                                // 174
						parsed = JSON.parse( storage.getItem( key ) );                                             // 175
						if ( parsed.expires && parsed.expires <= now ) {                                           // 176
							remove.push( key );                                                                       // 177
						} else {                                                                                   // 178
							ret[ key.replace( rprefix, "" ) ] = parsed.data;                                          // 179
						}                                                                                          // 180
					}                                                                                           // 181
				}                                                                                            // 182
				while ( key = remove.pop() ) {                                                               // 183
					storage.removeItem( key );                                                                  // 184
				}                                                                                            // 185
			} catch ( error ) {}                                                                          // 186
			return ret;                                                                                   // 187
		}                                                                                              // 188
                                                                                                 // 189
		// protect against name collisions with direct storage                                         // 190
		key = "__amplify__" + key;                                                                     // 191
                                                                                                 // 192
		if ( value === undefined ) {                                                                   // 193
			storedValue = storage.getItem( key );                                                         // 194
			parsed = storedValue ? JSON.parse( storedValue ) : { expires: -1 };                           // 195
			if ( parsed.expires && parsed.expires <= now ) {                                              // 196
				storage.removeItem( key );                                                                   // 197
			} else {                                                                                      // 198
				return parsed.data;                                                                          // 199
			}                                                                                             // 200
		} else {                                                                                       // 201
			if ( value === null ) {                                                                       // 202
				storage.removeItem( key );                                                                   // 203
			} else {                                                                                      // 204
				parsed = JSON.stringify({                                                                    // 205
					data: value,                                                                                // 206
					expires: options.expires ? now + options.expires : null                                     // 207
				});                                                                                          // 208
				try {                                                                                        // 209
					storage.setItem( key, parsed );                                                             // 210
				// quota exceeded                                                                            // 211
				} catch( error ) {                                                                           // 212
					// expire old data and try again                                                            // 213
					store[ storageType ]();                                                                     // 214
					try {                                                                                       // 215
						storage.setItem( key, parsed );                                                            // 216
					} catch( error ) {                                                                          // 217
						throw store.error();                                                                       // 218
					}                                                                                           // 219
				}                                                                                            // 220
			}                                                                                             // 221
		}                                                                                              // 222
                                                                                                 // 223
		return ret;                                                                                    // 224
	});                                                                                             // 225
}                                                                                                // 226
                                                                                                 // 227
// localStorage + sessionStorage                                                                 // 228
// IE 8+, Firefox 3.5+, Safari 4+, Chrome 4+, Opera 10.5+, iPhone 2+, Android 2+                 // 229
for ( var webStorageType in { localStorage: 1, sessionStorage: 1 } ) {                           // 230
	// try/catch for file protocol in Firefox and Private Browsing in Safari 5                      // 231
	try {                                                                                           // 232
		// Safari 5 in Private Browsing mode exposes localStorage                                      // 233
		// but doesn't allow storing data, so we attempt to store and remove an item.                  // 234
		// This will unfortunately give us a false negative if we're at the limit.                     // 235
		window[ webStorageType ].setItem( "__amplify__", "x" );                                        // 236
		window[ webStorageType ].removeItem( "__amplify__" );                                          // 237
		createFromStorageInterface( webStorageType, window[ webStorageType ] );                        // 238
	} catch( e ) {}                                                                                 // 239
}                                                                                                // 240
                                                                                                 // 241
// globalStorage                                                                                 // 242
// non-standard: Firefox 2+                                                                      // 243
// https://developer.mozilla.org/en/dom/storage#globalStorage                                    // 244
if ( !store.types.localStorage && window.globalStorage ) {                                       // 245
	// try/catch for file protocol in Firefox                                                       // 246
	try {                                                                                           // 247
		createFromStorageInterface( "globalStorage",                                                   // 248
			window.globalStorage[ window.location.hostname ] );                                           // 249
		// Firefox 2.0 and 3.0 have sessionStorage and globalStorage                                   // 250
		// make sure we default to globalStorage                                                       // 251
		// but don't default to globalStorage in 3.5+ which also has localStorage                      // 252
		if ( store.type === "sessionStorage" ) {                                                       // 253
			store.type = "globalStorage";                                                                 // 254
		}                                                                                              // 255
	} catch( e ) {}                                                                                 // 256
}                                                                                                // 257
                                                                                                 // 258
// userData                                                                                      // 259
// non-standard: IE 5+                                                                           // 260
// http://msdn.microsoft.com/en-us/library/ms531424(v=vs.85).aspx                                // 261
(function() {                                                                                    // 262
	// IE 9 has quirks in userData that are a huge pain                                             // 263
	// rather than finding a way to detect these quirks                                             // 264
	// we just don't register userData if we have localStorage                                      // 265
	if ( store.types.localStorage ) {                                                               // 266
		return;                                                                                        // 267
	}                                                                                               // 268
                                                                                                 // 269
	// append to html instead of body so we can do this from the head                               // 270
	var div = document.createElement( "div" ),                                                      // 271
		attrKey = "amplify";                                                                           // 272
	div.style.display = "none";                                                                     // 273
	document.getElementsByTagName( "head" )[ 0 ].appendChild( div );                                // 274
                                                                                                 // 275
	// we can't feature detect userData support                                                     // 276
	// so just try and see if it fails                                                              // 277
	// surprisingly, even just adding the behavior isn't enough for a failure                       // 278
	// so we need to load the data as well                                                          // 279
	try {                                                                                           // 280
		div.addBehavior( "#default#userdata" );                                                        // 281
		div.load( attrKey );                                                                           // 282
	} catch( e ) {                                                                                  // 283
		div.parentNode.removeChild( div );                                                             // 284
		return;                                                                                        // 285
	}                                                                                               // 286
                                                                                                 // 287
	store.addType( "userData", function( key, value, options ) {                                    // 288
		div.load( attrKey );                                                                           // 289
		var attr, parsed, prevValue, i, remove,                                                        // 290
			ret = value,                                                                                  // 291
			now = (new Date()).getTime();                                                                 // 292
                                                                                                 // 293
		if ( !key ) {                                                                                  // 294
			ret = {};                                                                                     // 295
			remove = [];                                                                                  // 296
			i = 0;                                                                                        // 297
			while ( attr = div.XMLDocument.documentElement.attributes[ i++ ] ) {                          // 298
				parsed = JSON.parse( attr.value );                                                           // 299
				if ( parsed.expires && parsed.expires <= now ) {                                             // 300
					remove.push( attr.name );                                                                   // 301
				} else {                                                                                     // 302
					ret[ attr.name ] = parsed.data;                                                             // 303
				}                                                                                            // 304
			}                                                                                             // 305
			while ( key = remove.pop() ) {                                                                // 306
				div.removeAttribute( key );                                                                  // 307
			}                                                                                             // 308
			div.save( attrKey );                                                                          // 309
			return ret;                                                                                   // 310
		}                                                                                              // 311
                                                                                                 // 312
		// convert invalid characters to dashes                                                        // 313
		// http://www.w3.org/TR/REC-xml/#NT-Name                                                       // 314
		// simplified to assume the starting character is valid                                        // 315
		// also removed colon as it is invalid in HTML attribute names                                 // 316
		key = key.replace( /[^\-._0-9A-Za-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c-\u200d\u203f\u2040\u2070-\u218f]/g, "-" );
		// adjust invalid starting character to deal with our simplified sanitization                  // 318
		key = key.replace( /^-/, "_-" );                                                               // 319
                                                                                                 // 320
		if ( value === undefined ) {                                                                   // 321
			attr = div.getAttribute( key );                                                               // 322
			parsed = attr ? JSON.parse( attr ) : { expires: -1 };                                         // 323
			if ( parsed.expires && parsed.expires <= now ) {                                              // 324
				div.removeAttribute( key );                                                                  // 325
			} else {                                                                                      // 326
				return parsed.data;                                                                          // 327
			}                                                                                             // 328
		} else {                                                                                       // 329
			if ( value === null ) {                                                                       // 330
				div.removeAttribute( key );                                                                  // 331
			} else {                                                                                      // 332
				// we need to get the previous value in case we need to rollback                             // 333
				prevValue = div.getAttribute( key );                                                         // 334
				parsed = JSON.stringify({                                                                    // 335
					data: value,                                                                                // 336
					expires: (options.expires ? (now + options.expires) : null)                                 // 337
				});                                                                                          // 338
				div.setAttribute( key, parsed );                                                             // 339
			}                                                                                             // 340
		}                                                                                              // 341
                                                                                                 // 342
		try {                                                                                          // 343
			div.save( attrKey );                                                                          // 344
		// quota exceeded                                                                              // 345
		} catch ( error ) {                                                                            // 346
			// roll the value back to the previous value                                                  // 347
			if ( prevValue === null ) {                                                                   // 348
				div.removeAttribute( key );                                                                  // 349
			} else {                                                                                      // 350
				div.setAttribute( key, prevValue );                                                          // 351
			}                                                                                             // 352
                                                                                                 // 353
			// expire old data and try again                                                              // 354
			store.userData();                                                                             // 355
			try {                                                                                         // 356
				div.setAttribute( key, parsed );                                                             // 357
				div.save( attrKey );                                                                         // 358
			} catch ( error ) {                                                                           // 359
				// roll the value back to the previous value                                                 // 360
				if ( prevValue === null ) {                                                                  // 361
					div.removeAttribute( key );                                                                 // 362
				} else {                                                                                     // 363
					div.setAttribute( key, prevValue );                                                         // 364
				}                                                                                            // 365
				throw store.error();                                                                         // 366
			}                                                                                             // 367
		}                                                                                              // 368
		return ret;                                                                                    // 369
	});                                                                                             // 370
}() );                                                                                           // 371
                                                                                                 // 372
// in-memory storage                                                                             // 373
// fallback for all browsers to enable the API even if we can't persist data                     // 374
(function() {                                                                                    // 375
	var memory = {},                                                                                // 376
		timeout = {};                                                                                  // 377
                                                                                                 // 378
	function copy( obj ) {                                                                          // 379
		return obj === undefined ? undefined : JSON.parse( JSON.stringify( obj ) );                    // 380
	}                                                                                               // 381
                                                                                                 // 382
	store.addType( "memory", function( key, value, options ) {                                      // 383
		if ( !key ) {                                                                                  // 384
			return copy( memory );                                                                        // 385
		}                                                                                              // 386
                                                                                                 // 387
		if ( value === undefined ) {                                                                   // 388
			return copy( memory[ key ] );                                                                 // 389
		}                                                                                              // 390
                                                                                                 // 391
		if ( timeout[ key ] ) {                                                                        // 392
			clearTimeout( timeout[ key ] );                                                               // 393
			delete timeout[ key ];                                                                        // 394
		}                                                                                              // 395
                                                                                                 // 396
		if ( value === null ) {                                                                        // 397
			delete memory[ key ];                                                                         // 398
			return null;                                                                                  // 399
		}                                                                                              // 400
                                                                                                 // 401
		memory[ key ] = value;                                                                         // 402
		if ( options.expires ) {                                                                       // 403
			timeout[ key ] = setTimeout(function() {                                                      // 404
				delete memory[ key ];                                                                        // 405
				delete timeout[ key ];                                                                       // 406
			}, options.expires );                                                                         // 407
		}                                                                                              // 408
                                                                                                 // 409
		return value;                                                                                  // 410
	});                                                                                             // 411
}() );                                                                                           // 412
                                                                                                 // 413
}( this.amplify = this.amplify || {} ) );                                                        // 414
                                                                                                 // 415
/*global amplify*/                                                                               // 416
                                                                                                 // 417
(function( amplify, undefined ) {                                                                // 418
'use strict';                                                                                    // 419
                                                                                                 // 420
function noop() {}                                                                               // 421
function isFunction( obj ) {                                                                     // 422
	return ({}).toString.call( obj ) === "[object Function]";                                       // 423
}                                                                                                // 424
                                                                                                 // 425
function async( fn ) {                                                                           // 426
	var isAsync = false;                                                                            // 427
	setTimeout(function() {                                                                         // 428
		isAsync = true;                                                                                // 429
	}, 1 );                                                                                         // 430
	return function() {                                                                             // 431
		var that = this,                                                                               // 432
			args = arguments;                                                                             // 433
		if ( isAsync ) {                                                                               // 434
			fn.apply( that, args );                                                                       // 435
		} else {                                                                                       // 436
			setTimeout(function() {                                                                       // 437
				fn.apply( that, args );                                                                      // 438
			}, 1 );                                                                                       // 439
		}                                                                                              // 440
	};                                                                                              // 441
}                                                                                                // 442
                                                                                                 // 443
amplify.request = function( resourceId, data, callback ) {                                       // 444
	// default to an empty hash just so we can handle a missing resourceId                          // 445
	// in one place                                                                                 // 446
	var settings = resourceId || {};                                                                // 447
                                                                                                 // 448
	if ( typeof settings === "string" ) {                                                           // 449
		if ( isFunction( data ) ) {                                                                    // 450
			callback = data;                                                                              // 451
			data = {};                                                                                    // 452
		}                                                                                              // 453
		settings = {                                                                                   // 454
			resourceId: resourceId,                                                                       // 455
			data: data || {},                                                                             // 456
			success: callback                                                                             // 457
		};                                                                                             // 458
	}                                                                                               // 459
                                                                                                 // 460
	var request = { abort: noop },                                                                  // 461
		resource = amplify.request.resources[ settings.resourceId ],                                   // 462
		success = settings.success || noop,                                                            // 463
		error = settings.error || noop;                                                                // 464
                                                                                                 // 465
	settings.success = async( function( data, status ) {                                            // 466
		status = status || "success";                                                                  // 467
		amplify.publish( "request.success", settings, data, status );                                  // 468
		amplify.publish( "request.complete", settings, data, status );                                 // 469
		success( data, status );                                                                       // 470
	});                                                                                             // 471
                                                                                                 // 472
	settings.error = async( function( data, status ) {                                              // 473
		status = status || "error";                                                                    // 474
		amplify.publish( "request.error", settings, data, status );                                    // 475
		amplify.publish( "request.complete", settings, data, status );                                 // 476
		error( data, status );                                                                         // 477
	});                                                                                             // 478
                                                                                                 // 479
	if ( !resource ) {                                                                              // 480
		if ( !settings.resourceId ) {                                                                  // 481
			throw "amplify.request: no resourceId provided";                                              // 482
		}                                                                                              // 483
		throw "amplify.request: unknown resourceId: " + settings.resourceId;                           // 484
	}                                                                                               // 485
                                                                                                 // 486
	if ( !amplify.publish( "request.before", settings ) ) {                                         // 487
		settings.error( null, "abort" );                                                               // 488
		return;                                                                                        // 489
	}                                                                                               // 490
                                                                                                 // 491
	amplify.request.resources[ settings.resourceId ]( settings, request );                          // 492
	return request;                                                                                 // 493
};                                                                                               // 494
                                                                                                 // 495
amplify.request.types = {};                                                                      // 496
amplify.request.resources = {};                                                                  // 497
amplify.request.define = function( resourceId, type, settings ) {                                // 498
	if ( typeof type === "string" ) {                                                               // 499
		if ( !( type in amplify.request.types ) ) {                                                    // 500
			throw "amplify.request.define: unknown type: " + type;                                        // 501
		}                                                                                              // 502
                                                                                                 // 503
		settings.resourceId = resourceId;                                                              // 504
		amplify.request.resources[ resourceId ] =                                                      // 505
			amplify.request.types[ type ]( settings );                                                    // 506
	} else {                                                                                        // 507
		// no pre-processor or settings for one-off types (don't invoke)                               // 508
		amplify.request.resources[ resourceId ] = type;                                                // 509
	}                                                                                               // 510
};                                                                                               // 511
                                                                                                 // 512
}( amplify ) );                                                                                  // 513
                                                                                                 // 514
                                                                                                 // 515
(function( amplify, $, undefined ) {                                                             // 516
'use strict';                                                                                    // 517
                                                                                                 // 518
var xhrProps = [ "status", "statusText", "responseText", "responseXML", "readyState" ],          // 519
		rurlData = /\{([^\}]+)\}/g;                                                                    // 520
                                                                                                 // 521
amplify.request.types.ajax = function( defnSettings ) {                                          // 522
	defnSettings = $.extend({                                                                       // 523
		type: "GET"                                                                                    // 524
	}, defnSettings );                                                                              // 525
                                                                                                 // 526
	return function( settings, request ) {                                                          // 527
		var xhr, handleResponse,                                                                       // 528
			url = defnSettings.url,                                                                       // 529
			abort = request.abort,                                                                        // 530
			ajaxSettings = $.extend( true, {}, defnSettings, { data: settings.data } ),                   // 531
			aborted = false,                                                                              // 532
			ampXHR = {                                                                                    // 533
				readyState: 0,                                                                               // 534
				setRequestHeader: function( name, value ) {                                                  // 535
					return xhr.setRequestHeader( name, value );                                                 // 536
				},                                                                                           // 537
				getAllResponseHeaders: function() {                                                          // 538
					return xhr.getAllResponseHeaders();                                                         // 539
				},                                                                                           // 540
				getResponseHeader: function( key ) {                                                         // 541
					return xhr.getResponseHeader( key );                                                        // 542
				},                                                                                           // 543
				overrideMimeType: function( type ) {                                                         // 544
					return xhr.overrideMimeType( type );                                                        // 545
				},                                                                                           // 546
				abort: function() {                                                                          // 547
					aborted = true;                                                                             // 548
					try {                                                                                       // 549
						xhr.abort();                                                                               // 550
					// IE 7 throws an error when trying to abort                                                // 551
					} catch( e ) {}                                                                             // 552
					handleResponse( null, "abort" );                                                            // 553
				},                                                                                           // 554
				success: function( data, status ) {                                                          // 555
					settings.success( data, status );                                                           // 556
				},                                                                                           // 557
				error: function( data, status ) {                                                            // 558
					settings.error( data, status );                                                             // 559
				}                                                                                            // 560
			};                                                                                            // 561
                                                                                                 // 562
		handleResponse = function( data, status ) {                                                    // 563
			$.each( xhrProps, function( i, key ) {                                                        // 564
				try {                                                                                        // 565
					ampXHR[ key ] = xhr[ key ];                                                                 // 566
				} catch( e ) {}                                                                              // 567
			});                                                                                           // 568
			// Playbook returns "HTTP/1.1 200 OK"                                                         // 569
			// TODO: something also returns "OK", what?                                                   // 570
			if ( /OK$/.test( ampXHR.statusText ) ) {                                                      // 571
				ampXHR.statusText = "success";                                                               // 572
			}                                                                                             // 573
			if ( data === undefined ) {                                                                   // 574
				// TODO: add support for ajax errors with data                                               // 575
				data = null;                                                                                 // 576
			}                                                                                             // 577
			if ( aborted ) {                                                                              // 578
				status = "abort";                                                                            // 579
			}                                                                                             // 580
			if ( /timeout|error|abort/.test( status ) ) {                                                 // 581
				ampXHR.error( data, status );                                                                // 582
			} else {                                                                                      // 583
				ampXHR.success( data, status );                                                              // 584
			}                                                                                             // 585
			// avoid handling a response multiple times                                                   // 586
			// this can happen if a request is aborted                                                    // 587
			// TODO: figure out if this breaks polling or multi-part responses                            // 588
			handleResponse = $.noop;                                                                      // 589
		};                                                                                             // 590
                                                                                                 // 591
		amplify.publish( "request.ajax.preprocess",                                                    // 592
			defnSettings, settings, ajaxSettings, ampXHR );                                               // 593
                                                                                                 // 594
		$.extend( ajaxSettings, {                                                                      // 595
			isJSONP: function () {                                                                        // 596
				return (/jsonp/gi).test(this.dataType);                                                      // 597
			},                                                                                            // 598
			cacheURL: function () {                                                                       // 599
				if (!this.isJSONP()) {                                                                       // 600
					return this.url;                                                                            // 601
				}                                                                                            // 602
                                                                                                 // 603
				var callbackName = 'callback';                                                               // 604
                                                                                                 // 605
				// possible for the callback function name to be overridden                                  // 606
				if (this.hasOwnProperty('jsonp')) {                                                          // 607
					if (this.jsonp !== false) {                                                                 // 608
						callbackName = this.jsonp;                                                                 // 609
					} else {                                                                                    // 610
						if (this.hasOwnProperty('jsonpCallback')) {                                                // 611
							callbackName = this.jsonpCallback;                                                        // 612
						}                                                                                          // 613
					}                                                                                           // 614
				}                                                                                            // 615
                                                                                                 // 616
				// search and replace callback parameter in query string with empty string                   // 617
				var callbackRegex = new RegExp('&?' + callbackName + '=[^&]*&?', 'gi');                      // 618
				return this.url.replace(callbackRegex, '');                                                  // 619
			},                                                                                            // 620
			success: function( data, status ) {                                                           // 621
				handleResponse( data, status );                                                              // 622
			},                                                                                            // 623
			error: function( _xhr, status ) {                                                             // 624
				handleResponse( null, status );                                                              // 625
			},                                                                                            // 626
			beforeSend: function( _xhr, _ajaxSettings ) {                                                 // 627
				xhr = _xhr;                                                                                  // 628
				ajaxSettings = _ajaxSettings;                                                                // 629
				var ret = defnSettings.beforeSend ?                                                          // 630
					defnSettings.beforeSend.call( this, ampXHR, ajaxSettings ) : true;                          // 631
				return ret && amplify.publish( "request.before.ajax",                                        // 632
					defnSettings, settings, ajaxSettings, ampXHR );                                             // 633
			}                                                                                             // 634
		});                                                                                            // 635
                                                                                                 // 636
		// cache all JSONP requests                                                                    // 637
		if (ajaxSettings.cache && ajaxSettings.isJSONP()) {                                            // 638
			$.extend(ajaxSettings, {                                                                      // 639
				cache: true                                                                                  // 640
			});                                                                                           // 641
		}                                                                                              // 642
                                                                                                 // 643
		$.ajax( ajaxSettings );                                                                        // 644
                                                                                                 // 645
		request.abort = function() {                                                                   // 646
			ampXHR.abort();                                                                               // 647
			abort.call( this );                                                                           // 648
		};                                                                                             // 649
	};                                                                                              // 650
};                                                                                               // 651
                                                                                                 // 652
                                                                                                 // 653
                                                                                                 // 654
amplify.subscribe( "request.ajax.preprocess", function( defnSettings, settings, ajaxSettings ) { // 655
	var mappedKeys = [],                                                                            // 656
		data = ajaxSettings.data;                                                                      // 657
                                                                                                 // 658
	if ( typeof data === "string" ) {                                                               // 659
		return;                                                                                        // 660
	}                                                                                               // 661
                                                                                                 // 662
	data = $.extend( true, {}, defnSettings.data, data );                                           // 663
                                                                                                 // 664
	ajaxSettings.url = ajaxSettings.url.replace( rurlData, function ( m, key ) {                    // 665
		if ( key in data ) {                                                                           // 666
			mappedKeys.push( key );                                                                       // 667
			return data[ key ];                                                                           // 668
		}                                                                                              // 669
	});                                                                                             // 670
                                                                                                 // 671
	// We delete the keys later so duplicates are still replaced                                    // 672
	$.each( mappedKeys, function ( i, key ) {                                                       // 673
		delete data[ key ];                                                                            // 674
	});                                                                                             // 675
                                                                                                 // 676
	ajaxSettings.data = data;                                                                       // 677
});                                                                                              // 678
                                                                                                 // 679
                                                                                                 // 680
                                                                                                 // 681
amplify.subscribe( "request.ajax.preprocess", function( defnSettings, settings, ajaxSettings ) { // 682
	var data = ajaxSettings.data,                                                                   // 683
		dataMap = defnSettings.dataMap;                                                                // 684
                                                                                                 // 685
	if ( !dataMap || typeof data === "string" ) {                                                   // 686
		return;                                                                                        // 687
	}                                                                                               // 688
                                                                                                 // 689
	if ( $.isFunction( dataMap ) ) {                                                                // 690
		ajaxSettings.data = dataMap( data );                                                           // 691
	} else {                                                                                        // 692
		$.each( defnSettings.dataMap, function( orig, replace ) {                                      // 693
			if ( orig in data ) {                                                                         // 694
				data[ replace ] = data[ orig ];                                                              // 695
				delete data[ orig ];                                                                         // 696
			}                                                                                             // 697
		});                                                                                            // 698
		ajaxSettings.data = data;                                                                      // 699
	}                                                                                               // 700
});                                                                                              // 701
                                                                                                 // 702
                                                                                                 // 703
                                                                                                 // 704
var cache = amplify.request.cache = {                                                            // 705
	_key: function( resourceId, url, data ) {                                                       // 706
		data = url + data;                                                                             // 707
		var length = data.length,                                                                      // 708
			i = 0;                                                                                        // 709
                                                                                                 // 710
		/*jshint bitwise:false*/                                                                       // 711
		function chunk() {                                                                             // 712
			return data.charCodeAt( i++ ) << 24 |                                                         // 713
				data.charCodeAt( i++ ) << 16 |                                                               // 714
				data.charCodeAt( i++ ) << 8 |                                                                // 715
				data.charCodeAt( i++ ) << 0;                                                                 // 716
		}                                                                                              // 717
                                                                                                 // 718
		var checksum = chunk();                                                                        // 719
		while ( i < length ) {                                                                         // 720
			checksum ^= chunk();                                                                          // 721
		}                                                                                              // 722
		/*jshint bitwise:true*/                                                                        // 723
                                                                                                 // 724
		return "request-" + resourceId + "-" + checksum;                                               // 725
	},                                                                                              // 726
                                                                                                 // 727
	_default: (function() {                                                                         // 728
		var memoryStore = {};                                                                          // 729
		return function( resource, settings, ajaxSettings, ampXHR ) {                                  // 730
			// data is already converted to a string by the time we get here                              // 731
			var cacheKey = cache._key( settings.resourceId,                                               // 732
					ajaxSettings.cacheURL(), ajaxSettings.data ),                                               // 733
				duration = resource.cache;                                                                   // 734
                                                                                                 // 735
			if ( cacheKey in memoryStore ) {                                                              // 736
				ampXHR.success( memoryStore[ cacheKey ] );                                                   // 737
				return false;                                                                                // 738
			}                                                                                             // 739
			var success = ampXHR.success;                                                                 // 740
			ampXHR.success = function( data ) {                                                           // 741
				memoryStore[ cacheKey ] = data;                                                              // 742
				if ( typeof duration === "number" ) {                                                        // 743
					setTimeout(function() {                                                                     // 744
						delete memoryStore[ cacheKey ];                                                            // 745
					}, duration );                                                                              // 746
				}                                                                                            // 747
				success.apply( this, arguments );                                                            // 748
			};                                                                                            // 749
		};                                                                                             // 750
	}())                                                                                            // 751
};                                                                                               // 752
                                                                                                 // 753
if ( amplify.store ) {                                                                           // 754
	$.each( amplify.store.types, function( type ) {                                                 // 755
		cache[ type ] = function( resource, settings, ajaxSettings, ampXHR ) {                         // 756
			var cacheKey = cache._key( settings.resourceId,                                               // 757
					ajaxSettings.cacheURL(), ajaxSettings.data ),                                               // 758
				cached = amplify.store[ type ]( cacheKey );                                                  // 759
                                                                                                 // 760
			if ( cached ) {                                                                               // 761
				ajaxSettings.success( cached );                                                              // 762
				return false;                                                                                // 763
			}                                                                                             // 764
			var success = ampXHR.success;                                                                 // 765
			ampXHR.success = function( data ) {                                                           // 766
				amplify.store[ type ]( cacheKey, data, { expires: resource.cache.expires } );                // 767
				success.apply( this, arguments );                                                            // 768
			};                                                                                            // 769
		};                                                                                             // 770
	});                                                                                             // 771
	cache.persist = cache[ amplify.store.type ];                                                    // 772
}                                                                                                // 773
                                                                                                 // 774
amplify.subscribe( "request.before.ajax", function( resource ) {                                 // 775
	var cacheType = resource.cache;                                                                 // 776
	if ( cacheType ) {                                                                              // 777
		// normalize between objects and strings/booleans/numbers                                      // 778
		cacheType = cacheType.type || cacheType;                                                       // 779
		return cache[ cacheType in cache ? cacheType : "_default" ]                                    // 780
			.apply( this, arguments );                                                                    // 781
	}                                                                                               // 782
});                                                                                              // 783
                                                                                                 // 784
                                                                                                 // 785
                                                                                                 // 786
amplify.request.decoders = {                                                                     // 787
	// http://labs.omniti.com/labs/jsend                                                            // 788
	jsend: function( data, status, ampXHR, success, error ) {                                       // 789
		if ( data.status === "success" ) {                                                             // 790
			success( data.data );                                                                         // 791
		} else if ( data.status === "fail" ) {                                                         // 792
			error( data.data, "fail" );                                                                   // 793
		} else if ( data.status === "error" ) {                                                        // 794
			delete data.status;                                                                           // 795
			error( data, "error" );                                                                       // 796
		} else {                                                                                       // 797
			error( null, "error" );                                                                       // 798
		}                                                                                              // 799
	}                                                                                               // 800
};                                                                                               // 801
                                                                                                 // 802
amplify.subscribe( "request.before.ajax", function( resource, settings, ajaxSettings, ampXHR ) { // 803
	var _success = ampXHR.success,                                                                  // 804
		_error = ampXHR.error,                                                                         // 805
		decoder = $.isFunction( resource.decoder ) ?                                                   // 806
			resource.decoder :                                                                            // 807
			resource.decoder in amplify.request.decoders ?                                                // 808
				amplify.request.decoders[ resource.decoder ] :                                               // 809
				amplify.request.decoders._default;                                                           // 810
                                                                                                 // 811
	if ( !decoder ) {                                                                               // 812
		return;                                                                                        // 813
	}                                                                                               // 814
                                                                                                 // 815
	function success( data, status ) {                                                              // 816
		_success( data, status );                                                                      // 817
	}                                                                                               // 818
	function error( data, status ) {                                                                // 819
		_error( data, status );                                                                        // 820
	}                                                                                               // 821
	ampXHR.success = function( data, status ) {                                                     // 822
		decoder( data, status, ampXHR, success, error );                                               // 823
	};                                                                                              // 824
	ampXHR.error = function( data, status ) {                                                       // 825
		decoder( data, status, ampXHR, success, error );                                               // 826
	};                                                                                              // 827
});                                                                                              // 828
                                                                                                 // 829
}( amplify, jQuery ) );                                                                          // 830
                                                                                                 // 831
///////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("amplify");

})();

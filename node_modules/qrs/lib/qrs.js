'use strict';
var extend = require( 'extend-shallow' );
var _ = require( 'lodash' );
var Q = require( 'q' );
var request = require( 'request' );
var S = require( 'string' );
var fs = require( 'fs' );
var path = require( 'path' );
var glob = require( 'glob' );
//var configValidator = require( './config-validator' );

/**
 * Work with Qlik Sense's REST based Repository API (qrs) from within node.js.
 *
 * **Configuration options:**
 * ```js
 * var QRS = require('qrs');
 * var config =  {
		host: '127.0.0.1',
		useSSL: false,
		xrfkey: 'ABCDEFG123456789',
		authentication: 'windows',
		headerKey: '',
		headerValue: '',
		virtualProxy: ''
	};
 *
 * var qrs = new QRS( config );
 *
 * ```
 *
 * @param {Object} `qrsConfig` Global configuration options
 *
 * @api public
 */
var qrs = function qrs ( qrsConfig ) {

	var that = this;
	this.config = null;
	this.defaultConfig = {
		host: '127.0.0.1',
		useSSL: false,
		xrfkey: 'ABCDEFG123456789',
		authentication: 'windows',
		headerKey: '',
		headerValue: '',
		virtualProxy: ''
	};
	if ( qrsConfig && !_.isEmpty( qrsConfig ) ) {
		this.config = extend( that.defaultConfig, qrsConfig );
	}

	/**
	 * (Internal) generic method to send requests to QRS.
	 * Typically this method is only used internally, use `get`, `post`, `put` or `delete`.
	 *
	 * ```js
	 * var QRS = require('qrs');
	 *
	 * var qrsConfig = ...; // Set configuration options
	 * var qrs = new QRS( qrsConfig );
	 *
	 * qrs.request( 'GET', 'qrs/about', null, null)
	 *    .then( function( data ) {
	 * 			console.log( 'about', data );
	 * 		}, function ( err ) {
	 *			console.error( 'An error occurred: ', err);
	 * 		});
	 * ```
	 *
	 * @param {String} `method` Http method, can be `GET`, `POST`, `PUT` or `DELETE` (defaults to `GET`).
	 * @param {String} `endpoint` Endpoint to be used. Check the online documentation of the Qlik Sense Repository API to get a list of all endpoints available.
	 * @param {Array<string,object>} `urlParams` Additional URL parameters, defined as key/value array, for example  `[{"key": "foo", "value": valueObj}]`.
	 * @param {Object} `jsonBody` JSON object to be used as the body for the Http request.
	 * @param {String} `body` Body, if not defined as Json object, body needs to be passed as a buffer to e.g. upload a file.
	 * @param {Object} `additionalRequestOptions` Additional request options.
	 * @param {Object} `additionalHeaders` Additional headers.
	 * @returns {promise} Returns a promise.
	 * @api public
	 */
	this.request = function ( method, endpoint, urlParams, jsonBody, body, additionalRequestOptions, additionalHeaders ) {

		var defer = Q.defer();
		var validConfig = _validateConfig();

		if ( !validConfig ) {
			defer.reject( {error: {errorMsg: 'Invalid configuration', errSource: 'qrs.request'}} );
		} else {

			var url = this.getUrl( S( endpoint ).chompLeft( '/' ), urlParams );
			var headers = _getHeaders( additionalHeaders );

			var requestOptions = {
				method: method || 'GET',
				url: url,
				headers: headers,
				proxy: that.config.fiddler ? 'http://127.0.0.1:8888' : null,
				timeout: 2000
			};

			if ( !_.isEmpty( jsonBody ) ) {
				requestOptions.json = jsonBody;
			}
			if ( !_.isEmpty( body ) ) {
				requestOptions.body = body;
			}

			//Todo: Encapsulate cert-file loading.
			//Todo: Support default local certificates.
			if ( that.config.authentication === 'certificates' ) {
				/*jshint ignore:start*/
				if ( that.config['cert'] ) {
					requestOptions.cert = (typeof that.config['cert'] === 'object' ? that.config['cert'] : fs.readFileSync( that.config['cert'] ) );
				}
				if ( that.config['key'] ) {
					requestOptions.key = (typeof that.config['key'] === 'object' ? that.config['key'] : fs.readFileSync( that.config['key'] ) );
				}
				if ( that.config['ca'] ) {
					requestOptions.ca = (typeof that.config['ca'] === 'object' ? that.config['ca'] : fs.readFileSync( that.config['ca'] ) );
				}
				/*jshint ignore:end*/
				if ( that.config.passphrase && !_.isEmpty( that.config.passphrase ) ) {requestOptions.passphrase = that.config.passphrase;}
			}

			requestOptions = _.extend( requestOptions, additionalRequestOptions || {} );

			request( requestOptions, function ( error, response, responseBody ) {

					//Todo: encapsulate content fetching
					if ( error || (response.statusCode < 200 || response.statusCode > 299) ) {
						defer.reject( {
							error: error,
							response: response
						} );
					} else {
						var r = null;
						if ( response.statusCode !== 204 ) {
							if ( _.isObject( responseBody ) ) {
								r = responseBody;
							} else {
								try {
									r = JSON.parse( responseBody );
								} catch ( e ) {
									r = responseBody;
								}
							}
						}
						defer.resolve( r );
					}
				}
			);
		}
		return defer.promise;
	};

	/**
	 * Same as `request()` but with `method: 'GET'`.
	 *
	 * ```js
	 * qrs.get( 'qrs/about')
	 *        .then( function ( data) {
	 * 			console.log('about: ', data );
	 * 		}, function ( err ) {
	 * 			console.error( err );
	 * 		});
	 * ```
	 * @param {String} `endpoint` QRS endpoint to be used.
	 * @param {Array<string,object>} `urlParams` Additional URL parameters, defined as key/value array, for example  `[{"key": "foo", "value": valueObj}]`.
	 * @returns {promise} Returns a promise.
	 * @api public
	 */
	this.get = function ( endpoint, urlParams ) {
		return this.request( 'GET', endpoint, urlParams );
	};

	/**
	 * Same as `request()` but with `method: 'POST'`.
	 *
	 * @param {String} `endpoint` QRS endpoint to be used.
	 * @param {Array<string,object>} `urlParams` Additional URL parameters, defined as key/value array, for example  `[{"key": "foo", "value": valueObj}]`.
	 * @param {Object} `jsonBody` Body to be posted, defined as JSON object.
	 * @returns {promise} Returns a promise.
	 * @api public
	 */
	this.post = function ( endpoint, urlParams, jsonBody ) {
		return this.request( 'POST', endpoint, urlParams, jsonBody );
	};

	/**
	 * Post a file, actually same as `post()`, instead of posting a JSON body, posts a file buffer.
	 *
	 * @param {String} `endpoint` QRS endpoint to be used.
	 * @param {Array<string,object>} `urlParams` Additional URL parameters, defined as key/value array, for example  `[{"key": "foo", "value": valueObj}]`
	 * @param {String} filePath Absolute or relative file path.
	 * @returns {promise} Returns a promise.
	 * @api public
	 */
	this.postFile = function ( endpoint, urlParams, filePath ) {

		var fileBuffer = fs.readFileSync( filePath );
		var additionalHeaders = {};
		additionalHeaders['Content-Type'] = 'application/octet-stream';
		var additionalRequestOptions = {
			'encoding': null
		};
		return this.request( 'POST', endpoint, urlParams, null, fileBuffer, additionalRequestOptions, additionalHeaders );
	};

	/**
	 * Same as `request()` but with `method: 'PUT'`.
	 *
	 * @api public
	 */
	this.put = function ( endpoint, id, urlParams, jsonBody ) {
		var finalEndpoint = S( endpoint ).ensureRight( '/' ) + id;
		return this.request( 'PUT', finalEndpoint, urlParams, jsonBody );
	};

	/**
	 * Same as `request()` but with `method: 'DELETE'`.
	 *
	 * @api public
	 */
	this.delete = function ( endpoint, id, urlParams ) {
		var finalEndpoint = S( endpoint ).ensureRight( '/' ) + id;
		return this.request( 'DELETE', finalEndpoint, urlParams );
	};

	/**
	 * Return the Url for the REST call considering the given configuration options
	 *
	 * @param {string} `endpoint` Endpoint for the qrs call.
	 * @param {Object[]} `urlParams` Additional URL parameters as key/value array.
	 * @param {String} `urlParam.key` Key.
	 * @param {Object} `urlParam.value` Value.
	 * @return {String} The constructed Url.
	 * @api public
	 */
	this.getUrl = function ( endpoint, urlParams ) {

		if ( !_.isEmpty( urlParams ) && !_.isArray( urlParams ) ) {
			throw new Error( 'Parameter urlParams needs to be an array' );
		}
		var params = urlParams || [];

		var url = ((that.config.useSSL) ? 'https://' : 'http://');                                                            				// http://
		url += that.config.host;                                                                                              				// http://host
		url += (that.config.port && !isNaN( that.config.port ) && that.config.port !== 0) ? ':' + that.config.port : '';  					// http[s]://host[:port]
		url += '/';                                                                                                          				// http[s]://host[:port]/
		url += ((that.config.virtualProxy && !_.isEmpty( that.config.virtualProxy )) ? that.config.virtualProxy + '/' : '');  				// http[s]://host[:port]/[vp/]
		url += S( endpoint ).chompLeft( '/' );
		url += '/?';

		params.push( {'key': 'xrfkey', 'value': that.config.xrfkey} );
		params.forEach( function ( param ) {																								// parameters
			url += param.key + '=' + param.value + '&';
		} );
		url = S( url ).chompRight( '&' ).s;

		return url;
	};

	/**
	 * Set global configurations options for qrs. Can be used to change the configuration options after `qrs` has been initialized.
	 *
	 * ```js
	 * var QRS = require('qrs');
	 * var configCert = {
	 * 	authentication: 'certificates',
	 * 	...
	 * };
	 * var qrs = new QRS( configCert );
	 *
	 * // Talking to the server using certificates
	 * qrs.get('qrs/about', function( result ) {
	 * 	// ...
	 * });
	 *
	 * // Change configuration options, e.g.
	 * var configHeader = {
	 * 	authentication: 'header',
	 * 	...
	 * };
	 *
	 * qrs.setConfig( configHeader);
	 *
	 * // Talking to the server, now using header authentication.
	 * qrs.get('qrs/about', function( result ) {
	 *  // ...
	 * });
	 * ```
	 *
	 * @param {Object} `qrsConfig` Global configuration options
	 * @api public
	 */
	this.setConfig = function ( qrsConfig ) {
		if ( typeof qrsConfig !== 'undefined' && !_.isEmpty( qrsConfig ) ) {
			that.config = extend( that.defaultConfig, qrsConfig );
		}
		return that.config;
	};

	/**
	 * Return the current configuration options.
	 *
	 * ```js
	 * var QRS = require('qrs');
	 * var config = {
	 * 	host: 'myserver.domain.com';
	 * };
	 * var qrs = new QRS( config );
	 * var host = qrs.getConfig( 'host' );
	 * console.log(host); //<== 'myserver.domain.com'
	 * ```
	 *
	 * @returns {qrsConfig} `qrsConfig` Configuration object.
	 * @api public
	 */
	this.getConfig = function () {
		return that.config || that.defaultConfig;
	};

	/**
	 * Change a single configuration property.
	 *
	 * ```js
	 * var QRS = require('qrs');
	 * var config = {
	 * 	host: 'myserver.domain.com';
	 * };
	 * var qrs = new QRS( config );
	 *
	 * qrs.get('qrs/about', function( result ) {
	 * 	// about from myserver.domain.com
	 * });
	 *
	 * qrs.set('host', 'mysecondserver.domain.com');
	 * qrs.get('qrs/about', function( result ) {
	 *  // about from mysecondserver.domain.com
	 * });
	 * ```
	 *
	 * @param {String} `key` Key of the property
	 * @param {Object} `val` Value
	 * @api public
	 */
	this.set = function ( key, val ) {
		that.config[key] = val;
	};

	/**
	 * Retrieve a single configuration property.
	 *
	 * @param {String} `key`  Key of the property
	 * @returns {Object} Value of the requested property, otherwise undefined.
	 * @api public
	 */
	this.getConfigValue = function ( key ) {
		return that.config[key];
	};

	// ****************************************************************************************
	// Plugins
	// ****************************************************************************************

	/**
	 * Returns an array of loaded plugins. Use `registerPlugin()` to load a plugin.
	 *
	 * @type {Array}
	 * @api public
	 */
	this.plugins = [];

	/**
	 * Register a plugin to work with the base class of `qrs`.
	 * Have a look at some of the already existing plugins like `./lib/sugar/ep-mime.js`
	 *
	 *
	 * ```js
	 *
	 * // -----------------------------------------------------------
	 * // Define the plugin.
	 * // ~~
	 * // Purpose: Do something great with extensions.
	 * // Filename: ep-extension.js
	 * // -----------------------------------------------------------
	 *
	 * function Extension ( base ) {
	 *
	 * 	function doSomething() {
	 * 		base.get( 'qrs/extension/schema')
	 * 			.then( function( result ) {
	 * 				// result now holding the result from the server
	 * 			}, function (err) {
	 * 				// error handling
	 * 			});
	 *
	 * 		return {
	 *			doSomething: doSomething
	 * 		};
	 * }
	 *
	 * module.exports = Extension;
	 *
	 * // -----------------------------------------------------------
	 * // Register and use it
	 * // -----------------------------------------------------------
	 *
	 * var qrs = new QRS( config );
	 * qrs.registerPlugin('./ep-extension.js');
	 *
	 * // Use the plugin
	 * qrs.extension.upload( myFile, function( result ) {
	 * 		// The file has been uploaded
	 * });
	 *
	 * ```
	 *
	 * @param {Object} plugin
	 * @api public
	 */
	this.registerPlugin = function ( plugin ) {
		if ( !this[plugin.name.toLowerCase()] ) {
			/*jshint -W055 */
			var o = new plugin( this );
			/*jshint +W055 */
			this.plugins[plugin.name.toLowerCase()] = o;
			this[plugin.name.toLowerCase()] = o;
		} else {
			throw new Error( 'Plugin cannot be registered. Namespace for qrs.' + plugin.name.toLowerCase() + ' is already reserved.' );
		}
	};

	var matches = glob.sync( path.join( __dirname, './sugar/ep-*.js' ) );
	for ( var i = 0; i < matches.length; i++ ) {
		var m = require( matches[i] );
		that.registerPlugin( m );
	}

	// ****************************************************************************************
	// Internal Helper
	// ****************************************************************************************
	var _getHeaders = function ( additionalHeaders ) {

		var header = {
			'X-Qlik-xrfkey': that.config.xrfkey
		};
		if ( that.config.headerKey && that.config.headerValue ) {
			header[that.config.headerKey] = that.config.headerValue;
		}
		_.extend( header, additionalHeaders || {} );
		return header;

	};

	// ****************************************************************************************
	// Validation
	//Todo: implement a more generic validation
	// ****************************************************************************************
	var _validateConfig = function () {

		var required = [];
		switch ( that.config.authentication ) {
			case 'header':
				required = ['headerKey', 'headerValue', 'xrfkey', 'useSSL', 'virtualProxy'];
				return _validateConfigMissing( that.config, required );
			case 'ntlm':
				return true;
			case 'certificates':
				required = ['cert', 'key', 'ca'];
				return _validateConfigMissing( that.config, required );
			default:
				return true;
		}
	};

	var _validateConfigMissing = function ( configs, required ) {

		var missing = [];
		_.each( required, function ( item ) {
			if ( !configs.hasOwnProperty( item ) ) {
				missing.push( item );
			}
		} );
		return (missing.length === 0);
	};

};
module.exports = qrs;

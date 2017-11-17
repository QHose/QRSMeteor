'use strict';
var Q = require( 'q' );
var _ = require( 'lodash' );
var fs = require( 'fs' );

/**
 * Mime type definition
 * @typedef {object} mimeTypeDef.
 * @property {string} mime - Mime type, e.g. "application/markdown".
 * @property {string} extensions - Comma delimited string of supported file extensions, e.g. "md,markdown".
 * @property {boolean} additionalHeaders - Additional headers, defaults to null.
 * @property {boolean} binary - Whether this is a binary file type or not.
 * @api public
 */

/**
 * Handle Mime types in QRS.
 *
 * @param {qrs} base - Base class, instance of `qrs`.
 * @constructor
 * @api public
 */
function Mime ( base ) {

	/**
	 * Adds a mime type.
	 *
	 * When adding the mime type, the following validation logic will be performed:
	 * - All existing mime types will be grouped by mime, additionalHeaders and binary.
	 * - If there is already a mime type with the same information compared to the given one, the field extension will be updated.
	 *
	 * An example is listed below.
	 *
	 *
	 * ```js
	 * // -----------------------------------------------------------------
	 * // Inserting logic
	 * // -----------------------------------------------------------------	 *
	 *
	 * // Assuming that the following mime type is already stored:
	 * {
	 * 	extensions: "md"
	 * 	mime: "application/markdown",
	 * 	additionalHeaders: null,
	 * 	binary: false
	 * }
	 * // If you add the following mime type
	 * {
	 * 	extensions: "markdown"
	 * 	mime: "application/markdown",
	 * 	additionalHeaders: null,
	 * 	binary: false
	 * }
	 * //this would then result into:
	 * {
	 * 	extensions: "md,markdown"
	 * 	mime: "application/markdown",
	 * 	additionalHeaders: null,
	 * 	binary: false
	 * }
	 *
	 * // -----------------------------------------------------------------
	 * // Adding a mime type:
	 * // -----------------------------------------------------------------
	 *
	 * var mimeType = {
	 * 	extensions: "md"
	 * 	mime: "application/markdown",
	 * 	additionalHeaders: null,
	 * 	binary: false
	 * }
	 *
	 * qrs.mime.add( mimeType )
	 * 		.then( function (result ) {
	 *			// work with the result
	 * 		}, function (err) {
	 * 			// error handling
	 * });
	 *
	 * ```
	 *
	 * @param {Object} mimeTypeDef
	 * @param {string} mimeTypeDef.mime - Mime type, e.g. "application/markdown".
	 * @param {string} mimeTypeDef.extensions - Comma delimited string of supported file extensions, e.g. "md,markdown".
	 * @param {boolean} mimeTypeDef.additionalHeaders - Additional headers, defaults to null.
	 * @param {boolean} mimeTypeDef.binary - Whether this is a binary file type or not.
	 * @return {promise}
	 * @api public
	 */
	var add = function ( mimeTypeDef ) {

		var defer = Q.defer();
		if ( _.isEmpty(mimeTypeDef.mime)) {
			defer.reject('Mime type cannot be empty');
		}
		if ( _.isEmpty(mimeTypeDef.extensions)) {
			defer.reject('Extensions cannot be empty');
		}
		get()
			.then( function ( mimeList ) {
				var o = getUpdateOrInsert( mimeTypeDef, mimeList );
				if ( o.isUpdate ) {
					_update( o.def.id, o.def ).then( function ( data ) {
						defer.resolve( data );
					}, function ( err ) {
						defer.reject( err );
					} );
				} else {
					_add( o.def ).then( function ( data ) {
						defer.resolve( data );
					}, function ( err ) {
						defer.reject( err );
					} );
				}
			}, function ( err ) {
				defer.reject( err );
			} );
		return defer.promise;
	};
	var _add = function ( mimeTypeDef ) {
		return base.post( '/qrs/mimetype', null, mimeTypeDef );
	};

	/**
	 * Returns a list of existing mime types.
	 *
	 * The list can be filtered by the file-extensions as shown in the example.
	 *
	 * ```js
	 * getMimeTypes( 'html')
	 *    .then( function (data) {
	 *
	 * 		// data now contains an array of mime types where the field extensions contains "html"
	 * 		// Results: html, xhtml, etc.
	 *
	 * 	})
	 * ```
	 *
	 * @param {string} filter
	 * @returns {promise}
	 * @api public
	 */
	var get = function ( filter ) {

		var queryParams = [];
		if ( !_.isEmpty( filter ) ) {
			queryParams.push( {'key': 'filter', 'value': filter} );
		}
		return base.get( '/qrs/mimetype/full', queryParams );
	};

	/**
	 * Adds an array of mime types
	 * (See `add` for more information about `mimeTypeDef`).
	 *
	 * @param {mimeTypeDef[]} mimeTypeDefs - Array of mime type definitions.
	 * @returns {promise}
	 * @api public
	 */
	var addMultiple = function ( mimeTypeDefs ) {

		var defer = Q.defer();
		var results = [];

		defer.resolve();

		if ( mimeTypeDefs && _.isArray( mimeTypeDefs ) ) {

			var promises = [];
			mimeTypeDefs.forEach( function ( mimeTypeDef ) {
				promises.push( add.bind( null, mimeTypeDef ) );
			} );

			return _.reduce( mimeTypeDefs, function ( memo, value ) {
				return memo.then( function () {
					return add( value );
				} ).then( function ( result ) {
					results.push( result );
				} );
			}, defer.promise ).then( function () {
				return results;
			} );

		}
	};

	/**
	 * Add mime types defined in a file.
	 * Every line in the file is defined by the following entries, delimited by a semi-colon (;):
	 * - extensions - {string} file extension, multiple values separated by a comma, e.g. "md,markdown"
	 * - mime - {string} Mime type
	 * - additionalHeaders - {boolean} Additional defined headers, leave blank if unsure
	 * - binary - {boolean} Whether this is a binary format or not.
	 *
	 * ```bash
	 * md;application/markdown;;false
	 * yml;text/yml;;false
	 * woff2;application/font-woff2;;true
	 * ```
	 *
	 * @param {String} filePath - Absolute file path.
	 * @returns {promise}
	 * @api public
	 */
	var addFromFile = function ( filePath ) {

		var defer = Q.defer();
		if ( !fs.existsSync( filePath ) ) {
			defer.reject( 'File does not exist' );
		}
		var data = fs.readFileSync( filePath, {encoding: 'utf-8'} );

		var lines = data.match( /[^\r\n]+/g );
		var mimeTypeDefs = [];
		lines.forEach( function ( line ) {
			var items = line.split( ';' );
			mimeTypeDefs.push( {
				'extensions': items[0],
				'mime': items[1],
				'additionalHeaders': _.isEmpty( items[2] ) ? null : items[2],
				'binary': items[4] === 'true'
			} );
		} );
		addMultiple( mimeTypeDefs )
			.then( function ( data ) {
				defer.resolve( data );
			}, function ( err ) {
				defer.reject( err );
			} );
		return defer.promise;
	};

	/**
	 * Delete a mime entry from the Qlik Sense Repository by its given Id.
	 * @param {String} id
	 * @returns {promise}
	 * @api public
	 */
	var deleteById = function ( id ) {
		return base.delete( '/qrs/mimetype', id );
	};

	var _update = function ( id, mimeTypeDef ) {
		return base.put( '/qrs/mimetype', id, null, mimeTypeDef );
	};

	var createExport = function ( filePath ) {

		var defer = Q.defer();
		base.get( '/qrs/mimetype/full' )
			.then( function ( data ) {

				var s = '';
				for ( var i = 0; i < data.length; i++ ) {
					s += data[i].extensions + ';' ;
					s += data[i].mime + ';';
					s += ((!_.isEmpty(data[i].additionalHeaders)) ? data[i].additionalHeaders : '') + ';';
					s += data[i].binary + '\n';
				}
				fs.writeFile( filePath, s, function ( err ) {
					if ( err ) {
						defer.reject( err );
					} else {
						defer.resolve( filePath );
					}
				} );

			}, function ( err ) {
				defer.reject( err );
			} );
		return defer.promise;
	};

	var createExportPerFileExt = function ( filePath ) {
		var defer = Q.defer();
		base.get( '/qrs/mimetype/full' )
			.then( function ( data ) {

				var ext = [];
				for ( var i = 0; i < data.length; i++ ) {
					var e = data[i].extensions.split(',');
					ext = ext.concat(e);
				}

				fs.writeFile( filePath, JSON.stringify(ext), function ( err ) {
					if ( err ) {
						defer.reject( err );
					} else {
						defer.resolve( filePath );
					}
				} );

			}, function ( err ) {
				defer.reject( err );
			} );
		return defer.promise;
	};

	/**
	 * Returns whether the mime type already exists or not.
	 *
	 * @param {mimeTypeDef} mimeTypeDef
	 * @returns {object} result - Returned result.
	 * @returns {boolean} result.isUpdate - Whether to update or add.
	 * @api public
	 */
	var getUpdateOrInsert = function ( mimeTypeDef, listMimeTypes ) {

		var result = {
			isUpdate: false,
			def: {}
		};

		var tmp = _.filter( listMimeTypes, function ( m ) {
			return m.mime === mimeTypeDef.mime && m.binary === mimeTypeDef.binary || false && ((m.additionalHeaders || null) === (mimeTypeDef.additionalHeaders || null));
		} );

		if ( tmp.length === 1 ) {
			result.isUpdate = true;
			var updatedDef = tmp[0];
			updatedDef.extensions = _.uniq( updatedDef.extensions.split( ',' ).concat( mimeTypeDef.extensions.split( ',' ) ) ).join( ',' );
			result.def = updatedDef;
		} else if ( tmp.length === 0 ) {
			result.def = mimeTypeDef;
			result.isUpdate = false;
		} else if ( tmp.length > 1 ) {
			throw new Error( 'More than on mime type found to update' );
		}

		return result;
	};

	return {
		add: add,
		addFromFile: addFromFile,
		addMultiple: addMultiple,
		createExport: createExport,
		createExportPerFileExt: createExportPerFileExt,
		get: get,
		getUpdateOrInsert: getUpdateOrInsert,
		deleteById: deleteById
	};
}

module.exports = Mime;




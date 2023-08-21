(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Base64 = Package.base64.Base64;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var v, EJSON;

var require = meteorInstall({"node_modules":{"meteor":{"ejson":{"ejson.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/ejson/ejson.js                                                                                     //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  EJSON: () => EJSON
});

/**
 * @namespace
 * @summary Namespace for EJSON functions
 */
const EJSON = {}; // Custom type interface definition

/**
 * @class CustomType
 * @instanceName customType
 * @memberOf EJSON
 * @summary The interface that a class must satisfy to be able to become an
 * EJSON custom type via EJSON.addType.
 */

/**
 * @function typeName
 * @memberOf EJSON.CustomType
 * @summary Return the tag used to identify this type.  This must match the
 *          tag used to register this type with
 *          [`EJSON.addType`](#ejson_add_type).
 * @locus Anywhere
 * @instance
 */

/**
 * @function toJSONValue
 * @memberOf EJSON.CustomType
 * @summary Serialize this instance into a JSON-compatible value.
 * @locus Anywhere
 * @instance
 */

/**
 * @function clone
 * @memberOf EJSON.CustomType
 * @summary Return a value `r` such that `this.equals(r)` is true, and
 *          modifications to `r` do not affect `this` and vice versa.
 * @locus Anywhere
 * @instance
 */

/**
 * @function equals
 * @memberOf EJSON.CustomType
 * @summary Return `true` if `other` has a value equal to `this`; `false`
 *          otherwise.
 * @locus Anywhere
 * @param {Object} other Another object to compare this to.
 * @instance
 */

const customTypes = {};

const hasOwn = (obj, prop) => ({}).hasOwnProperty.call(obj, prop);

const isArguments = obj => obj != null && hasOwn(obj, 'callee');

const isInfOrNan = obj => Number.isNaN(obj) || obj === Infinity || obj === -Infinity; // Add a custom type, using a method of your choice to get to and
// from a basic JSON-able representation.  The factory argument
// is a function of JSON-able --> your object
// The type you add must have:
// - A toJSONValue() method, so that Meteor can serialize it
// - a typeName() method, to show how to look it up in our type table.
// It is okay if these methods are monkey-patched on.
// EJSON.clone will use toJSONValue and the given factory to produce
// a clone, but you may specify a method clone() that will be
// used instead.
// Similarly, EJSON.equals will use toJSONValue to make comparisons,
// but you may provide a method equals() instead.

/**
 * @summary Add a custom datatype to EJSON.
 * @locus Anywhere
 * @param {String} name A tag for your custom type; must be unique among
 *                      custom data types defined in your project, and must
 *                      match the result of your type's `typeName` method.
 * @param {Function} factory A function that deserializes a JSON-compatible
 *                           value into an instance of your type.  This should
 *                           match the serialization performed by your
 *                           type's `toJSONValue` method.
 */


EJSON.addType = (name, factory) => {
  if (hasOwn(customTypes, name)) {
    throw new Error(`Type ${name} already present`);
  }

  customTypes[name] = factory;
};

const builtinConverters = [{
  // Date
  matchJSONValue(obj) {
    return hasOwn(obj, '$date') && Object.keys(obj).length === 1;
  },

  matchObject(obj) {
    return obj instanceof Date;
  },

  toJSONValue(obj) {
    return {
      $date: obj.getTime()
    };
  },

  fromJSONValue(obj) {
    return new Date(obj.$date);
  }

}, {
  // RegExp
  matchJSONValue(obj) {
    return hasOwn(obj, '$regexp') && hasOwn(obj, '$flags') && Object.keys(obj).length === 2;
  },

  matchObject(obj) {
    return obj instanceof RegExp;
  },

  toJSONValue(regexp) {
    return {
      $regexp: regexp.source,
      $flags: regexp.flags
    };
  },

  fromJSONValue(obj) {
    // Replaces duplicate / invalid flags.
    return new RegExp(obj.$regexp, obj.$flags // Cut off flags at 50 chars to avoid abusing RegExp for DOS.
    .slice(0, 50).replace(/[^gimuy]/g, '').replace(/(.)(?=.*\1)/g, ''));
  }

}, {
  // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'
  // which we match.)
  matchJSONValue(obj) {
    return hasOwn(obj, '$InfNaN') && Object.keys(obj).length === 1;
  },

  matchObject: isInfOrNan,

  toJSONValue(obj) {
    let sign;

    if (Number.isNaN(obj)) {
      sign = 0;
    } else if (obj === Infinity) {
      sign = 1;
    } else {
      sign = -1;
    }

    return {
      $InfNaN: sign
    };
  },

  fromJSONValue(obj) {
    return obj.$InfNaN / 0;
  }

}, {
  // Binary
  matchJSONValue(obj) {
    return hasOwn(obj, '$binary') && Object.keys(obj).length === 1;
  },

  matchObject(obj) {
    return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && hasOwn(obj, '$Uint8ArrayPolyfill');
  },

  toJSONValue(obj) {
    return {
      $binary: Base64.encode(obj)
    };
  },

  fromJSONValue(obj) {
    return Base64.decode(obj.$binary);
  }

}, {
  // Escaping one level
  matchJSONValue(obj) {
    return hasOwn(obj, '$escape') && Object.keys(obj).length === 1;
  },

  matchObject(obj) {
    let match = false;

    if (obj) {
      const keyCount = Object.keys(obj).length;

      if (keyCount === 1 || keyCount === 2) {
        match = builtinConverters.some(converter => converter.matchJSONValue(obj));
      }
    }

    return match;
  },

  toJSONValue(obj) {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      newObj[key] = EJSON.toJSONValue(obj[key]);
    });
    return {
      $escape: newObj
    };
  },

  fromJSONValue(obj) {
    const newObj = {};
    Object.keys(obj.$escape).forEach(key => {
      newObj[key] = EJSON.fromJSONValue(obj.$escape[key]);
    });
    return newObj;
  }

}, {
  // Custom
  matchJSONValue(obj) {
    return hasOwn(obj, '$type') && hasOwn(obj, '$value') && Object.keys(obj).length === 2;
  },

  matchObject(obj) {
    return EJSON._isCustomType(obj);
  },

  toJSONValue(obj) {
    const jsonValue = Meteor._noYieldsAllowed(() => obj.toJSONValue());

    return {
      $type: obj.typeName(),
      $value: jsonValue
    };
  },

  fromJSONValue(obj) {
    const typeName = obj.$type;

    if (!hasOwn(customTypes, typeName)) {
      throw new Error(`Custom EJSON type ${typeName} is not defined`);
    }

    const converter = customTypes[typeName];
    return Meteor._noYieldsAllowed(() => converter(obj.$value));
  }

}];

EJSON._isCustomType = obj => obj && typeof obj.toJSONValue === 'function' && typeof obj.typeName === 'function' && hasOwn(customTypes, obj.typeName());

EJSON._getTypes = () => customTypes;

EJSON._getConverters = () => builtinConverters; // Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)


const toJSONValueHelper = item => {
  for (let i = 0; i < builtinConverters.length; i++) {
    const converter = builtinConverters[i];

    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }

  return undefined;
}; // for both arrays and objects, in-place modification.


const adjustTypesToJSONValue = obj => {
  // Is it an atom that we need to adjust?
  if (obj === null) {
    return null;
  }

  const maybeChanged = toJSONValueHelper(obj);

  if (maybeChanged !== undefined) {
    return maybeChanged;
  } // Other atoms are unchanged.


  if (typeof obj !== 'object') {
    return obj;
  } // Iterate over array or object structure.


  Object.keys(obj).forEach(key => {
    const value = obj[key];

    if (typeof value !== 'object' && value !== undefined && !isInfOrNan(value)) {
      return; // continue
    }

    const changed = toJSONValueHelper(value);

    if (changed) {
      obj[key] = changed;
      return; // on to the next key
    } // if we get here, value is an object but not adjustable
    // at this level.  recurse.


    adjustTypesToJSONValue(value);
  });
  return obj;
};

EJSON._adjustTypesToJSONValue = adjustTypesToJSONValue;
/**
 * @summary Serialize an EJSON-compatible value into its plain JSON
 *          representation.
 * @locus Anywhere
 * @param {EJSON} val A value to serialize to plain JSON.
 */

EJSON.toJSONValue = item => {
  const changed = toJSONValueHelper(item);

  if (changed !== undefined) {
    return changed;
  }

  let newItem = item;

  if (typeof item === 'object') {
    newItem = EJSON.clone(item);
    adjustTypesToJSONValue(newItem);
  }

  return newItem;
}; // Either return the argument changed to have the non-json
// rep of itself (the Object version) or the argument itself.
// DOES NOT RECURSE.  For actually getting the fully-changed value, use
// EJSON.fromJSONValue


const fromJSONValueHelper = value => {
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);

    if (keys.length <= 2 && keys.every(k => typeof k === 'string' && k.substr(0, 1) === '$')) {
      for (let i = 0; i < builtinConverters.length; i++) {
        const converter = builtinConverters[i];

        if (converter.matchJSONValue(value)) {
          return converter.fromJSONValue(value);
        }
      }
    }
  }

  return value;
}; // for both arrays and objects. Tries its best to just
// use the object you hand it, but may return something
// different if the object you hand it itself needs changing.


const adjustTypesFromJSONValue = obj => {
  if (obj === null) {
    return null;
  }

  const maybeChanged = fromJSONValueHelper(obj);

  if (maybeChanged !== obj) {
    return maybeChanged;
  } // Other atoms are unchanged.


  if (typeof obj !== 'object') {
    return obj;
  }

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    if (typeof value === 'object') {
      const changed = fromJSONValueHelper(value);

      if (value !== changed) {
        obj[key] = changed;
        return;
      } // if we get here, value is an object but not adjustable
      // at this level.  recurse.


      adjustTypesFromJSONValue(value);
    }
  });
  return obj;
};

EJSON._adjustTypesFromJSONValue = adjustTypesFromJSONValue;
/**
 * @summary Deserialize an EJSON value from its plain JSON representation.
 * @locus Anywhere
 * @param {JSONCompatible} val A value to deserialize into EJSON.
 */

EJSON.fromJSONValue = item => {
  let changed = fromJSONValueHelper(item);

  if (changed === item && typeof item === 'object') {
    changed = EJSON.clone(item);
    adjustTypesFromJSONValue(changed);
  }

  return changed;
};
/**
 * @summary Serialize a value to a string. For EJSON values, the serialization
 *          fully represents the value. For non-EJSON values, serializes the
 *          same way as `JSON.stringify`.
 * @locus Anywhere
 * @param {EJSON} val A value to stringify.
 * @param {Object} [options]
 * @param {Boolean | Integer | String} options.indent Indents objects and
 * arrays for easy readability.  When `true`, indents by 2 spaces; when an
 * integer, indents by that number of spaces; and when a string, uses the
 * string as the indentation pattern.
 * @param {Boolean} options.canonical When `true`, stringifies keys in an
 *                                    object in sorted order.
 */


EJSON.stringify = (item, options) => {
  let serialized;
  const json = EJSON.toJSONValue(item);

  if (options && (options.canonical || options.indent)) {
    let canonicalStringify;
    module.watch(require("./stringify"), {
      default(v) {
        canonicalStringify = v;
      }

    }, 0);
    serialized = canonicalStringify(json, options);
  } else {
    serialized = JSON.stringify(json);
  }

  return serialized;
};
/**
 * @summary Parse a string into an EJSON value. Throws an error if the string
 *          is not valid EJSON.
 * @locus Anywhere
 * @param {String} str A string to parse into an EJSON value.
 */


EJSON.parse = item => {
  if (typeof item !== 'string') {
    throw new Error('EJSON.parse argument should be a string');
  }

  return EJSON.fromJSONValue(JSON.parse(item));
};
/**
 * @summary Returns true if `x` is a buffer of binary data, as returned from
 *          [`EJSON.newBinary`](#ejson_new_binary).
 * @param {Object} x The variable to check.
 * @locus Anywhere
 */


EJSON.isBinary = obj => {
  return !!(typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && obj.$Uint8ArrayPolyfill);
};
/**
 * @summary Return true if `a` and `b` are equal to each other.  Return false
 *          otherwise.  Uses the `equals` method on `a` if present, otherwise
 *          performs a deep comparison.
 * @locus Anywhere
 * @param {EJSON} a
 * @param {EJSON} b
 * @param {Object} [options]
 * @param {Boolean} options.keyOrderSensitive Compare in key sensitive order,
 * if supported by the JavaScript implementation.  For example, `{a: 1, b: 2}`
 * is equal to `{b: 2, a: 1}` only when `keyOrderSensitive` is `false`.  The
 * default is `false`.
 */


EJSON.equals = (a, b, options) => {
  let i;
  const keyOrderSensitive = !!(options && options.keyOrderSensitive);

  if (a === b) {
    return true;
  } // This differs from the IEEE spec for NaN equality, b/c we don't want
  // anything ever with a NaN to be poisoned from becoming equal to anything.


  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  } // if either one is falsy, they'd have to be === to be equal


  if (!a || !b) {
    return false;
  }

  if (!(typeof a === 'object' && typeof b === 'object')) {
    return false;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.valueOf() === b.valueOf();
  }

  if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  if (typeof a.equals === 'function') {
    return a.equals(b, options);
  }

  if (typeof b.equals === 'function') {
    return b.equals(a, options);
  }

  if (a instanceof Array) {
    if (!(b instanceof Array)) {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    for (i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options)) {
        return false;
      }
    }

    return true;
  } // fallback for custom types that don't implement their own equals


  switch (EJSON._isCustomType(a) + EJSON._isCustomType(b)) {
    case 1:
      return false;

    case 2:
      return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));

    default: // Do nothing

  } // fall back to structural equality of objects


  let ret;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (keyOrderSensitive) {
    i = 0;
    ret = aKeys.every(key => {
      if (i >= bKeys.length) {
        return false;
      }

      if (key !== bKeys[i]) {
        return false;
      }

      if (!EJSON.equals(a[key], b[bKeys[i]], options)) {
        return false;
      }

      i++;
      return true;
    });
  } else {
    i = 0;
    ret = aKeys.every(key => {
      if (!hasOwn(b, key)) {
        return false;
      }

      if (!EJSON.equals(a[key], b[key], options)) {
        return false;
      }

      i++;
      return true;
    });
  }

  return ret && i === bKeys.length;
};
/**
 * @summary Return a deep copy of `val`.
 * @locus Anywhere
 * @param {EJSON} val A value to copy.
 */


EJSON.clone = v => {
  let ret;

  if (typeof v !== 'object') {
    return v;
  }

  if (v === null) {
    return null; // null has typeof "object"
  }

  if (v instanceof Date) {
    return new Date(v.getTime());
  } // RegExps are not really EJSON elements (eg we don't define a serialization
  // for them), but they're immutable anyway, so we can support them in clone.


  if (v instanceof RegExp) {
    return v;
  }

  if (EJSON.isBinary(v)) {
    ret = EJSON.newBinary(v.length);

    for (let i = 0; i < v.length; i++) {
      ret[i] = v[i];
    }

    return ret;
  }

  if (Array.isArray(v)) {
    return v.map(value => EJSON.clone(value));
  }

  if (isArguments(v)) {
    return Array.from(v).map(value => EJSON.clone(value));
  } // handle general user-defined typed Objects if they have a clone method


  if (typeof v.clone === 'function') {
    return v.clone();
  } // handle other custom types


  if (EJSON._isCustomType(v)) {
    return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)), true);
  } // handle other objects


  ret = {};
  Object.keys(v).forEach(key => {
    ret[key] = EJSON.clone(v[key]);
  });
  return ret;
};
/**
 * @summary Allocate a new buffer of binary data that EJSON can serialize.
 * @locus Anywhere
 * @param {Number} size The number of bytes of binary data to allocate.
 */
// EJSON.newBinary is the public documented API for this functionality,
// but the implementation is in the 'base64' package to avoid
// introducing a circular dependency. (If the implementation were here,
// then 'base64' would have to use EJSON.newBinary, and 'ejson' would
// also have to use 'base64'.)


EJSON.newBinary = Base64.newBinary;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stringify.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/ejson/stringify.js                                                                                 //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
// Based on json2.js from https://github.com/douglascrockford/JSON-js
//
//    json2.js
//    2012-10-08
//
//    Public Domain.
//
//    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
function quote(string) {
  return JSON.stringify(string);
}

const str = (key, holder, singleIndent, outerIndent, canonical) => {
  const value = holder[key]; // What happens next depends on the value's type.

  switch (typeof value) {
    case 'string':
      return quote(value);

    case 'number':
      // JSON numbers must be finite. Encode non-finite numbers as null.
      return isFinite(value) ? String(value) : 'null';

    case 'boolean':
      return String(value);
    // If the type is 'object', we might be dealing with an object or an array or
    // null.

    case 'object':
      // Due to a specification blunder in ECMAScript, typeof null is 'object',
      // so watch out for that case.
      if (!value) {
        return 'null';
      } // Make an array to hold the partial results of stringifying this object
      // value.


      const innerIndent = outerIndent + singleIndent;
      const partial = []; // Is the value an array?

      if (Array.isArray(value) || {}.hasOwnProperty.call(value, 'callee')) {
        // The value is an array. Stringify every element. Use null as a
        // placeholder for non-JSON values.
        const length = value.length;

        for (let i = 0; i < length; i += 1) {
          partial[i] = str(i, value, singleIndent, innerIndent, canonical) || 'null';
        } // Join all of the elements together, separated with commas, and wrap
        // them in brackets.


        let v;

        if (partial.length === 0) {
          v = '[]';
        } else if (innerIndent) {
          v = '[\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + ']';
        } else {
          v = '[' + partial.join(',') + ']';
        }

        return v;
      } // Iterate through all of the keys in the object.


      let keys = Object.keys(value);

      if (canonical) {
        keys = keys.sort();
      }

      keys.forEach(k => {
        v = str(k, value, singleIndent, innerIndent, canonical);

        if (v) {
          partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);
        }
      }); // Join all of the member texts together, separated with commas,
      // and wrap them in braces.

      if (partial.length === 0) {
        v = '{}';
      } else if (innerIndent) {
        v = '{\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + '}';
      } else {
        v = '{' + partial.join(',') + '}';
      }

      return v;

    default: // Do nothing

  }
}; // If the JSON object does not yet have a stringify method, give it one.


const canonicalStringify = (value, options) => {
  // Make a fake root object containing our value under the key of ''.
  // Return the result of stringifying the value.
  const allOptions = Object.assign({
    indent: '',
    canonical: false
  }, options);

  if (allOptions.indent === true) {
    allOptions.indent = '  ';
  } else if (typeof allOptions.indent === 'number') {
    let newIndent = '';

    for (let i = 0; i < allOptions.indent; i++) {
      newIndent += ' ';
    }

    allOptions.indent = newIndent;
  }

  return str('', {
    '': value
  }, allOptions.indent, '', allOptions.canonical);
};

module.exportDefault(canonicalStringify);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ejson/ejson.js");

/* Exports */
Package._define("ejson", exports, {
  EJSON: EJSON
});

})();

//# sourceURL=meteor://💻app/packages/ejson.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWpzb24vZWpzb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2Vqc29uL3N0cmluZ2lmeS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJFSlNPTiIsImN1c3RvbVR5cGVzIiwiaGFzT3duIiwib2JqIiwicHJvcCIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImlzQXJndW1lbnRzIiwiaXNJbmZPck5hbiIsIk51bWJlciIsImlzTmFOIiwiSW5maW5pdHkiLCJhZGRUeXBlIiwibmFtZSIsImZhY3RvcnkiLCJFcnJvciIsImJ1aWx0aW5Db252ZXJ0ZXJzIiwibWF0Y2hKU09OVmFsdWUiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwibWF0Y2hPYmplY3QiLCJEYXRlIiwidG9KU09OVmFsdWUiLCIkZGF0ZSIsImdldFRpbWUiLCJmcm9tSlNPTlZhbHVlIiwiUmVnRXhwIiwicmVnZXhwIiwiJHJlZ2V4cCIsInNvdXJjZSIsIiRmbGFncyIsImZsYWdzIiwic2xpY2UiLCJyZXBsYWNlIiwic2lnbiIsIiRJbmZOYU4iLCJVaW50OEFycmF5IiwiJGJpbmFyeSIsIkJhc2U2NCIsImVuY29kZSIsImRlY29kZSIsIm1hdGNoIiwia2V5Q291bnQiLCJzb21lIiwiY29udmVydGVyIiwibmV3T2JqIiwiZm9yRWFjaCIsImtleSIsIiRlc2NhcGUiLCJfaXNDdXN0b21UeXBlIiwianNvblZhbHVlIiwiTWV0ZW9yIiwiX25vWWllbGRzQWxsb3dlZCIsIiR0eXBlIiwidHlwZU5hbWUiLCIkdmFsdWUiLCJfZ2V0VHlwZXMiLCJfZ2V0Q29udmVydGVycyIsInRvSlNPTlZhbHVlSGVscGVyIiwiaXRlbSIsImkiLCJ1bmRlZmluZWQiLCJhZGp1c3RUeXBlc1RvSlNPTlZhbHVlIiwibWF5YmVDaGFuZ2VkIiwidmFsdWUiLCJjaGFuZ2VkIiwiX2FkanVzdFR5cGVzVG9KU09OVmFsdWUiLCJuZXdJdGVtIiwiY2xvbmUiLCJmcm9tSlNPTlZhbHVlSGVscGVyIiwiZXZlcnkiLCJrIiwic3Vic3RyIiwiYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlIiwiX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSIsInN0cmluZ2lmeSIsIm9wdGlvbnMiLCJzZXJpYWxpemVkIiwianNvbiIsImNhbm9uaWNhbCIsImluZGVudCIsImNhbm9uaWNhbFN0cmluZ2lmeSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiSlNPTiIsInBhcnNlIiwiaXNCaW5hcnkiLCIkVWludDhBcnJheVBvbHlmaWxsIiwiZXF1YWxzIiwiYSIsImIiLCJrZXlPcmRlclNlbnNpdGl2ZSIsInZhbHVlT2YiLCJBcnJheSIsInJldCIsImFLZXlzIiwiYktleXMiLCJuZXdCaW5hcnkiLCJpc0FycmF5IiwibWFwIiwiZnJvbSIsInF1b3RlIiwic3RyaW5nIiwic3RyIiwiaG9sZGVyIiwic2luZ2xlSW5kZW50Iiwib3V0ZXJJbmRlbnQiLCJpc0Zpbml0ZSIsIlN0cmluZyIsImlubmVySW5kZW50IiwicGFydGlhbCIsImpvaW4iLCJzb3J0IiwicHVzaCIsImFsbE9wdGlvbnMiLCJhc3NpZ24iLCJuZXdJbmRlbnQiLCJleHBvcnREZWZhdWx0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsU0FBTSxNQUFJQTtBQUFYLENBQWQ7O0FBQUE7Ozs7QUFJQSxNQUFNQSxRQUFRLEVBQWQsQyxDQUVBOztBQUNBOzs7Ozs7OztBQVFBOzs7Ozs7Ozs7O0FBVUE7Ozs7Ozs7O0FBUUE7Ozs7Ozs7OztBQVNBOzs7Ozs7Ozs7O0FBVUEsTUFBTUMsY0FBYyxFQUFwQjs7QUFFQSxNQUFNQyxTQUFTLENBQUNDLEdBQUQsRUFBTUMsSUFBTixLQUFlLENBQUMsRUFBRCxFQUFLQyxjQUFMLENBQW9CQyxJQUFwQixDQUF5QkgsR0FBekIsRUFBOEJDLElBQTlCLENBQTlCOztBQUVBLE1BQU1HLGNBQWNKLE9BQU9BLE9BQU8s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QUFDTHZCLFlBQUksTUFBTTJCLFFBQVFDLElBQVIsQ0FBYSxHQUFiLENBQU4sR0FBMEIsR0FBOUI7QUFDRDs7QUFDRCxhQUFPNUIsQ0FBUDs7QUFFRixZQS9FQSxDQStFUzs7QUEvRVQ7QUFpRkQsQ0FyRkQsQyxDQXVGQTs7O0FBQ0EsTUFBTUoscUJBQXFCLENBQUNqQixLQUFELEVBQVFZLE9BQVIsS0FBb0I7QUFDN0M7QUFDQTtBQUNBLFFBQU13QyxhQUFhbkcsT0FBT29HLE1BQVAsQ0FBYztBQUMvQnJDLFlBQVEsRUFEdUI7QUFFL0JELGVBQVc7QUFGb0IsR0FBZCxFQUdoQkgsT0FIZ0IsQ0FBbkI7O0FBSUEsTUFBSXdDLFdBQVdwQyxNQUFYLEtBQXNCLElBQTFCLEVBQWdDO0FBQzlCb0MsZUFBV3BDLE1BQVgsR0FBb0IsSUFBcEI7QUFDRCxHQUZELE1BRU8sSUFBSSxPQUFPb0MsV0FBV3BDLE1BQWxCLEtBQTZCLFFBQWpDLEVBQTJDO0FBQ2hELFFBQUlzQyxZQUFZLEVBQWhCOztBQUNBLFNBQUssSUFBSTFELElBQUksQ0FBYixFQUFnQkEsSUFBSXdELFdBQVdwQyxNQUEvQixFQUF1Q3BCLEdBQXZDLEVBQTRDO0FBQzFDMEQsbUJBQWEsR0FBYjtBQUNEOztBQUNERixlQUFXcEMsTUFBWCxHQUFvQnNDLFNBQXBCO0FBQ0Q7O0FBQ0QsU0FBT2IsSUFBSSxFQUFKLEVBQVE7QUFBQyxRQUFJekM7QUFBTCxHQUFSLEVBQXFCb0QsV0FBV3BDLE1BQWhDLEVBQXdDLEVBQXhDLEVBQTRDb0MsV0FBV3JDLFNBQXZELENBQVA7QUFDRCxDQWpCRDs7QUFyR0FsRixPQUFPMEgsYUFBUCxDQXdIZXRDLGtCQXhIZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9lanNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZVxuICogQHN1bW1hcnkgTmFtZXNwYWNlIGZvciBFSlNPTiBmdW5jdGlvbnNcbiAqL1xuY29uc3QgRUpTT04gPSB7fTtcblxuLy8gQ3VzdG9tIHR5cGUgaW50ZXJmYWNlIGRlZmluaXRpb25cbi8qKlxuICogQGNsYXNzIEN1c3RvbVR5cGVcbiAqIEBpbnN0YW5jZU5hbWUgY3VzdG9tVHlwZVxuICogQG1lbWJlck9mIEVKU09OXG4gKiBAc3VtbWFyeSBUaGUgaW50ZXJmYWNlIHRoYXQgYSBjbGFzcyBtdXN0IHNhdGlzZnkgdG8gYmUgYWJsZSB0byBiZWNvbWUgYW5cbiAqIEVKU09OIGN1c3RvbSB0eXBlIHZpYSBFSlNPTi5hZGRUeXBlLlxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIHR5cGVOYW1lXG4gKiBAbWVtYmVyT2YgRUpTT04uQ3VzdG9tVHlwZVxuICogQHN1bW1hcnkgUmV0dXJuIHRoZSB0YWcgdXNlZCB0byBpZGVudGlmeSB0aGlzIHR5cGUuICBUaGlzIG11c3QgbWF0Y2ggdGhlXG4gKiAgICAgICAgICB0YWcgdXNlZCB0byByZWdpc3RlciB0aGlzIHR5cGUgd2l0aFxuICogICAgICAgICAgW2BFSlNPTi5hZGRUeXBlYF0oI2Vqc29uX2FkZF90eXBlKS5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGluc3RhbmNlXG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gdG9KU09OVmFsdWVcbiAqIEBtZW1iZXJPZiBFSlNPTi5DdXN0b21UeXBlXG4gKiBAc3VtbWFyeSBTZXJpYWxpemUgdGhpcyBpbnN0YW5jZSBpbnRvIGEgSlNPTi1jb21wYXRpYmxlIHZhbHVlLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAaW5zdGFuY2VcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBjbG9uZVxuICogQG1lbWJlck9mIEVKU09OLkN1c3RvbVR5cGVcbiAqIEBzdW1tYXJ5IFJldHVybiBhIHZhbHVlIGByYCBzdWNoIHRoYXQgYHRoaXMuZXF1YWxzKHIpYCBpcyB0cnVlLCBhbmRcbiAqICAgICAgICAgIG1vZGlmaWNhdGlvbnMgdG8gYHJgIGRvIG5vdCBhZmZlY3QgYHRoaXNgIGFuZCB2aWNlIHZlcnNhLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAaW5zdGFuY2VcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBlcXVhbHNcbiAqIEBtZW1iZXJPZiBFSlNPTi5DdXN0b21UeXBlXG4gKiBAc3VtbWFyeSBSZXR1cm4gYHRydWVgIGlmIGBvdGhlcmAgaGFzIGEgdmFsdWUgZXF1YWwgdG8gYHRoaXNgOyBgZmFsc2VgXG4gKiAgICAgICAgICBvdGhlcndpc2UuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBBbm90aGVyIG9iamVjdCB0byBjb21wYXJlIHRoaXMgdG8uXG4gKiBAaW5zdGFuY2VcbiAqL1xuXG5jb25zdCBjdXN0b21UeXBlcyA9IHt9O1xuXG5jb25zdCBoYXNPd24gPSAob2JqLCBwcm9wKSA9PiAoe30pLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcblxuY29uc3QgaXNBcmd1bWVudHMgPSBvYmogPT4gb2JqICE9IG51bGwgJiYgaGFzT3duKG9iaiwgJ2NhbGxlZScpO1xuXG5jb25zdCBpc0luZk9yTmFuID1cbiAgb2JqID0+IE51bWJlci5pc05hTihvYmopIHx8IG9iaiA9PT0gSW5maW5pdHkgfHwgb2JqID09PSAtSW5maW5pdHk7XG5cbi8vIEFkZCBhIGN1c3RvbSB0eXBlLCB1c2luZyBhIG1ldGhvZCBvZiB5b3VyIGNob2ljZSB0byBnZXQgdG8gYW5kXG4vLyBmcm9tIGEgYmFzaWMgSlNPTi1hYmxlIHJlcHJlc2VudGF0aW9uLiAgVGhlIGZhY3RvcnkgYXJndW1lbnRcbi8vIGlzIGEgZnVuY3Rpb24gb2YgSlNPTi1hYmxlIC0tPiB5b3VyIG9iamVjdFxuLy8gVGhlIHR5cGUgeW91IGFkZCBtdXN0IGhhdmU6XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG4vLyBFSlNPTi5jbG9uZSB3aWxsIHVzZSB0b0pTT05WYWx1ZSBhbmQgdGhlIGdpdmVuIGZhY3RvcnkgdG8gcHJvZHVjZVxuLy8gYSBjbG9uZSwgYnV0IHlvdSBtYXkgc3BlY2lmeSBhIG1ldGhvZCBjbG9uZSgpIHRoYXQgd2lsbCBiZVxuLy8gdXNlZCBpbnN0ZWFkLlxuLy8gU2ltaWxhcmx5LCBFSlNPTi5lcXVhbHMgd2lsbCB1c2UgdG9KU09OVmFsdWUgdG8gbWFrZSBjb21wYXJpc29ucyxcbi8vIGJ1dCB5b3UgbWF5IHByb3ZpZGUgYSBtZXRob2QgZXF1YWxzKCkgaW5zdGVhZC5cbi8qKlxuICogQHN1bW1hcnkgQWRkIGEgY3VzdG9tIGRhdGF0eXBlIHRvIEVKU09OLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBBIHRhZyBmb3IgeW91ciBjdXN0b20gdHlwZTsgbXVzdCBiZSB1bmlxdWUgYW1vbmdcbiAqICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbSBkYXRhIHR5cGVzIGRlZmluZWQgaW4geW91ciBwcm9qZWN0LCBhbmQgbXVzdFxuICogICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggdGhlIHJlc3VsdCBvZiB5b3VyIHR5cGUncyBgdHlwZU5hbWVgIG1ldGhvZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZhY3RvcnkgQSBmdW5jdGlvbiB0aGF0IGRlc2VyaWFsaXplcyBhIEpTT04tY29tcGF0aWJsZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpbnRvIGFuIGluc3RhbmNlIG9mIHlvdXIgdHlwZS4gIFRoaXMgc2hvdWxkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoIHRoZSBzZXJpYWxpemF0aW9uIHBlcmZvcm1lZCBieSB5b3VyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUncyBgdG9KU09OVmFsdWVgIG1ldGhvZC5cbiAqL1xuRUpTT04uYWRkVHlwZSA9IChuYW1lLCBmYWN0b3J5KSA9PiB7XG4gIGlmIChoYXNPd24oY3VzdG9tVHlwZXMsIG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUeXBlICR7bmFtZX0gYWxyZWFkeSBwcmVzZW50YCk7XG4gIH1cbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxuY29uc3QgYnVpbHRpbkNvbnZlcnRlcnMgPSBbXG4gIHsgLy8gRGF0ZVxuICAgIG1hdGNoSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIGhhc093bihvYmosICckZGF0ZScpICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Qob2JqKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai4kZGF0ZSk7XG4gICAgfSxcbiAgfSxcbiAgeyAvLyBSZWdFeHBcbiAgICBtYXRjaEpTT05WYWx1ZShvYmopIHtcbiAgICAgIHJldHVybiBoYXNPd24ob2JqLCAnJHJlZ2V4cCcpXG4gICAgICAgICYmIGhhc093bihvYmosICckZmxhZ3MnKVxuICAgICAgICAmJiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0KG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIFJlZ0V4cDtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlKHJlZ2V4cCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJHJlZ2V4cDogcmVnZXhwLnNvdXJjZSxcbiAgICAgICAgJGZsYWdzOiByZWdleHAuZmxhZ3NcbiAgICAgIH07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgLy8gUmVwbGFjZXMgZHVwbGljYXRlIC8gaW52YWxpZCBmbGFncy5cbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKFxuICAgICAgICBvYmouJHJlZ2V4cCxcbiAgICAgICAgb2JqLiRmbGFnc1xuICAgICAgICAgIC8vIEN1dCBvZmYgZmxhZ3MgYXQgNTAgY2hhcnMgdG8gYXZvaWQgYWJ1c2luZyBSZWdFeHAgZm9yIERPUy5cbiAgICAgICAgICAuc2xpY2UoMCwgNTApXG4gICAgICAgICAgLnJlcGxhY2UoL1teZ2ltdXldL2csJycpXG4gICAgICAgICAgLnJlcGxhY2UoLyguKSg/PS4qXFwxKS9nLCAnJylcbiAgICAgICk7XG4gICAgfSxcbiAgfSxcbiAgeyAvLyBOYU4sIEluZiwgLUluZi4gKFRoZXNlIGFyZSB0aGUgb25seSBvYmplY3RzIHdpdGggdHlwZW9mICE9PSAnb2JqZWN0J1xuICAgIC8vIHdoaWNoIHdlIG1hdGNoLilcbiAgICBtYXRjaEpTT05WYWx1ZShvYmopIHtcbiAgICAgIHJldHVybiBoYXNPd24ob2JqLCAnJEluZk5hTicpICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGlzSW5mT3JOYW4sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICBsZXQgc2lnbjtcbiAgICAgIGlmIChOdW1iZXIuaXNOYU4ob2JqKSkge1xuICAgICAgICBzaWduID0gMDtcbiAgICAgIH0gZWxzZSBpZiAob2JqID09PSBJbmZpbml0eSkge1xuICAgICAgICBzaWduID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpZ24gPSAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7JEluZk5hTjogc2lnbn07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIG9iai4kSW5mTmFOIC8gMDtcbiAgICB9LFxuICB9LFxuICB7IC8vIEJpbmFyeVxuICAgIG1hdGNoSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIGhhc093bihvYmosICckYmluYXJ5JykgJiYgT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdChvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICB8fCAob2JqICYmIGhhc093bihvYmosICckVWludDhBcnJheVBvbHlmaWxsJykpO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEJhc2U2NC5lbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIEJhc2U2NC5kZWNvZGUob2JqLiRiaW5hcnkpO1xuICAgIH0sXG4gIH0sXG4gIHsgLy8gRXNjYXBpbmcgb25lIGxldmVsXG4gICAgbWF0Y2hKU09OVmFsdWUob2JqKSB7XG4gICAgICByZXR1cm4gaGFzT3duKG9iaiwgJyRlc2NhcGUnKSAmJiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0KG9iaikge1xuICAgICAgbGV0IG1hdGNoID0gZmFsc2U7XG4gICAgICBpZiAob2JqKSB7XG4gICAgICAgIGNvbnN0IGtleUNvdW50ID0gT2JqZWN0LmtleXMob2JqKS5sZW5ndGg7XG4gICAgICAgIGlmIChrZXlDb3VudCA9PT0gMSB8fCBrZXlDb3VudCA9PT0gMikge1xuICAgICAgICAgIG1hdGNoID1cbiAgICAgICAgICAgIGJ1aWx0aW5Db252ZXJ0ZXJzLnNvbWUoY29udmVydGVyID0+IGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZShvYmopKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICBjb25zdCBuZXdPYmogPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLnRvSlNPTlZhbHVlKG9ialtrZXldKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHskZXNjYXBlOiBuZXdPYmp9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZShvYmopIHtcbiAgICAgIGNvbnN0IG5ld09iaiA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMob2JqLiRlc2NhcGUpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi5mcm9tSlNPTlZhbHVlKG9iai4kZXNjYXBlW2tleV0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH0sXG4gIH0sXG4gIHsgLy8gQ3VzdG9tXG4gICAgbWF0Y2hKU09OVmFsdWUob2JqKSB7XG4gICAgICByZXR1cm4gaGFzT3duKG9iaiwgJyR0eXBlJylcbiAgICAgICAgJiYgaGFzT3duKG9iaiwgJyR2YWx1ZScpICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAyO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Qob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICBjb25zdCBqc29uVmFsdWUgPSBNZXRlb3IuX25vWWllbGRzQWxsb3dlZCgoKSA9PiBvYmoudG9KU09OVmFsdWUoKSk7XG4gICAgICByZXR1cm4geyR0eXBlOiBvYmoudHlwZU5hbWUoKSwgJHZhbHVlOiBqc29uVmFsdWV9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZShvYmopIHtcbiAgICAgIGNvbnN0IHR5cGVOYW1lID0gb2JqLiR0eXBlO1xuICAgICAgaWYgKCFoYXNPd24oY3VzdG9tVHlwZXMsIHR5cGVOYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEN1c3RvbSBFSlNPTiB0eXBlICR7dHlwZU5hbWV9IGlzIG5vdCBkZWZpbmVkYCk7XG4gICAgICB9XG4gICAgICBjb25zdCBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoKCkgPT4gY29udmVydGVyKG9iai4kdmFsdWUpKTtcbiAgICB9LFxuICB9LFxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IChvYmopID0+IChcbiAgb2JqICYmXG4gIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgdHlwZW9mIG9iai50eXBlTmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICBoYXNPd24oY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKVxuKTtcblxuRUpTT04uX2dldFR5cGVzID0gKCkgPT4gY3VzdG9tVHlwZXM7XG5cbkVKU09OLl9nZXRDb252ZXJ0ZXJzID0gKCkgPT4gYnVpbHRpbkNvbnZlcnRlcnM7XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIEpTT04tY29tcGF0aWJsZSB2ZXJzaW9uIG9mIHRoZSBhcmd1bWVudCwgb3IgdW5kZWZpbmVkIChpZlxuLy8gdGhlIGl0ZW0gaXNuJ3QgaXRzZWxmIHJlcGxhY2VhYmxlLCBidXQgbWF5YmUgc29tZSBmaWVsZHMgaW4gaXQgYXJlKVxuY29uc3QgdG9KU09OVmFsdWVIZWxwZXIgPSBpdGVtID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hPYmplY3QoaXRlbSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIudG9KU09OVmFsdWUoaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG4vLyBmb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbmNvbnN0IGFkanVzdFR5cGVzVG9KU09OVmFsdWUgPSBvYmogPT4ge1xuICAvLyBJcyBpdCBhbiBhdG9tIHRoYXQgd2UgbmVlZCB0byBhZGp1c3Q/XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1heWJlQ2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIH1cblxuICAvLyBPdGhlciBhdG9tcyBhcmUgdW5jaGFuZ2VkLlxuICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgLy8gSXRlcmF0ZSBvdmVyIGFycmF5IG9yIG9iamVjdCBzdHJ1Y3R1cmUuXG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrZXkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAhaXNJbmZPck5hbih2YWx1ZSkpIHtcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB9XG5cbiAgICBjb25zdCBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICByZXR1cm47IC8vIG9uIHRvIHRoZSBuZXh0IGtleVxuICAgIH1cbiAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gYWRqdXN0VHlwZXNUb0pTT05WYWx1ZTtcblxuLyoqXG4gKiBAc3VtbWFyeSBTZXJpYWxpemUgYW4gRUpTT04tY29tcGF0aWJsZSB2YWx1ZSBpbnRvIGl0cyBwbGFpbiBKU09OXG4gKiAgICAgICAgICByZXByZXNlbnRhdGlvbi5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtFSlNPTn0gdmFsIEEgdmFsdWUgdG8gc2VyaWFsaXplIHRvIHBsYWluIEpTT04uXG4gKi9cbkVKU09OLnRvSlNPTlZhbHVlID0gaXRlbSA9PiB7XG4gIGNvbnN0IGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgbGV0IG5ld0l0ZW0gPSBpdGVtO1xuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgbmV3SXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUobmV3SXRlbSk7XG4gIH1cbiAgcmV0dXJuIG5ld0l0ZW07XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG4vLyBET0VTIE5PVCBSRUNVUlNFLiAgRm9yIGFjdHVhbGx5IGdldHRpbmcgdGhlIGZ1bGx5LWNoYW5nZWQgdmFsdWUsIHVzZVxuLy8gRUpTT04uZnJvbUpTT05WYWx1ZVxuY29uc3QgZnJvbUpTT05WYWx1ZUhlbHBlciA9IHZhbHVlID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICAgIGlmIChrZXlzLmxlbmd0aCA8PSAyXG4gICAgICAgICYmIGtleXMuZXZlcnkoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgJiYgay5zdWJzdHIoMCwgMSkgPT09ICckJykpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG4vLyBmb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbmNvbnN0IGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IG9iaiA9PiB7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKSB7XG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgfVxuXG4gIC8vIE90aGVyIGF0b21zIGFyZSB1bmNoYW5nZWQuXG4gIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goa2V5ID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5FSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID0gYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlO1xuXG4vKipcbiAqIEBzdW1tYXJ5IERlc2VyaWFsaXplIGFuIEVKU09OIHZhbHVlIGZyb20gaXRzIHBsYWluIEpTT04gcmVwcmVzZW50YXRpb24uXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7SlNPTkNvbXBhdGlibGV9IHZhbCBBIHZhbHVlIHRvIGRlc2VyaWFsaXplIGludG8gRUpTT04uXG4gKi9cbkVKU09OLmZyb21KU09OVmFsdWUgPSBpdGVtID0+IHtcbiAgbGV0IGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBjaGFuZ2VkID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGNoYW5nZWQpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBTZXJpYWxpemUgYSB2YWx1ZSB0byBhIHN0cmluZy4gRm9yIEVKU09OIHZhbHVlcywgdGhlIHNlcmlhbGl6YXRpb25cbiAqICAgICAgICAgIGZ1bGx5IHJlcHJlc2VudHMgdGhlIHZhbHVlLiBGb3Igbm9uLUVKU09OIHZhbHVlcywgc2VyaWFsaXplcyB0aGVcbiAqICAgICAgICAgIHNhbWUgd2F5IGFzIGBKU09OLnN0cmluZ2lmeWAuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7RUpTT059IHZhbCBBIHZhbHVlIHRvIHN0cmluZ2lmeS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7Qm9vbGVhbiB8IEludGVnZXIgfCBTdHJpbmd9IG9wdGlvbnMuaW5kZW50IEluZGVudHMgb2JqZWN0cyBhbmRcbiAqIGFycmF5cyBmb3IgZWFzeSByZWFkYWJpbGl0eS4gIFdoZW4gYHRydWVgLCBpbmRlbnRzIGJ5IDIgc3BhY2VzOyB3aGVuIGFuXG4gKiBpbnRlZ2VyLCBpbmRlbnRzIGJ5IHRoYXQgbnVtYmVyIG9mIHNwYWNlczsgYW5kIHdoZW4gYSBzdHJpbmcsIHVzZXMgdGhlXG4gKiBzdHJpbmcgYXMgdGhlIGluZGVudGF0aW9uIHBhdHRlcm4uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuY2Fub25pY2FsIFdoZW4gYHRydWVgLCBzdHJpbmdpZmllcyBrZXlzIGluIGFuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdCBpbiBzb3J0ZWQgb3JkZXIuXG4gKi9cbkVKU09OLnN0cmluZ2lmeSA9IChpdGVtLCBvcHRpb25zKSA9PiB7XG4gIGxldCBzZXJpYWxpemVkO1xuICBjb25zdCBqc29uID0gRUpTT04udG9KU09OVmFsdWUoaXRlbSk7XG4gIGlmIChvcHRpb25zICYmIChvcHRpb25zLmNhbm9uaWNhbCB8fCBvcHRpb25zLmluZGVudCkpIHtcbiAgICBpbXBvcnQgY2Fub25pY2FsU3RyaW5naWZ5IGZyb20gJy4vc3RyaW5naWZ5JztcbiAgICBzZXJpYWxpemVkID0gY2Fub25pY2FsU3RyaW5naWZ5KGpzb24sIG9wdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeShqc29uKTtcbiAgfVxuICByZXR1cm4gc2VyaWFsaXplZDtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUGFyc2UgYSBzdHJpbmcgaW50byBhbiBFSlNPTiB2YWx1ZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBzdHJpbmdcbiAqICAgICAgICAgIGlzIG5vdCB2YWxpZCBFSlNPTi5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBBIHN0cmluZyB0byBwYXJzZSBpbnRvIGFuIEVKU09OIHZhbHVlLlxuICovXG5FSlNPTi5wYXJzZSA9IGl0ZW0gPT4ge1xuICBpZiAodHlwZW9mIGl0ZW0gIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFSlNPTi5wYXJzZSBhcmd1bWVudCBzaG91bGQgYmUgYSBzdHJpbmcnKTtcbiAgfVxuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUmV0dXJucyB0cnVlIGlmIGB4YCBpcyBhIGJ1ZmZlciBvZiBiaW5hcnkgZGF0YSwgYXMgcmV0dXJuZWQgZnJvbVxuICogICAgICAgICAgW2BFSlNPTi5uZXdCaW5hcnlgXSgjZWpzb25fbmV3X2JpbmFyeSkuXG4gKiBAcGFyYW0ge09iamVjdH0geCBUaGUgdmFyaWFibGUgdG8gY2hlY2suXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqL1xuRUpTT04uaXNCaW5hcnkgPSBvYmogPT4ge1xuICByZXR1cm4gISEoKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpKTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUmV0dXJuIHRydWUgaWYgYGFgIGFuZCBgYmAgYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIuICBSZXR1cm4gZmFsc2VcbiAqICAgICAgICAgIG90aGVyd2lzZS4gIFVzZXMgdGhlIGBlcXVhbHNgIG1ldGhvZCBvbiBgYWAgaWYgcHJlc2VudCwgb3RoZXJ3aXNlXG4gKiAgICAgICAgICBwZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbi5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtFSlNPTn0gYVxuICogQHBhcmFtIHtFSlNPTn0gYlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmtleU9yZGVyU2Vuc2l0aXZlIENvbXBhcmUgaW4ga2V5IHNlbnNpdGl2ZSBvcmRlcixcbiAqIGlmIHN1cHBvcnRlZCBieSB0aGUgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbi4gIEZvciBleGFtcGxlLCBge2E6IDEsIGI6IDJ9YFxuICogaXMgZXF1YWwgdG8gYHtiOiAyLCBhOiAxfWAgb25seSB3aGVuIGBrZXlPcmRlclNlbnNpdGl2ZWAgaXMgYGZhbHNlYC4gIFRoZVxuICogZGVmYXVsdCBpcyBgZmFsc2VgLlxuICovXG5FSlNPTi5lcXVhbHMgPSAoYSwgYiwgb3B0aW9ucykgPT4ge1xuICBsZXQgaTtcbiAgY29uc3Qga2V5T3JkZXJTZW5zaXRpdmUgPSAhIShvcHRpb25zICYmIG9wdGlvbnMua2V5T3JkZXJTZW5zaXRpdmUpO1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gVGhpcyBkaWZmZXJzIGZyb20gdGhlIElFRUUgc3BlYyBmb3IgTmFOIGVxdWFsaXR5LCBiL2Mgd2UgZG9uJ3Qgd2FudFxuICAvLyBhbnl0aGluZyBldmVyIHdpdGggYSBOYU4gdG8gYmUgcG9pc29uZWQgZnJvbSBiZWNvbWluZyBlcXVhbCB0byBhbnl0aGluZy5cbiAgaWYgKE51bWJlci5pc05hTihhKSAmJiBOdW1iZXIuaXNOYU4oYikpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICBpZiAoIWEgfHwgIWIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoISh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gIH1cblxuICBpZiAoRUpTT04uaXNCaW5hcnkoYSkgJiYgRUpTT04uaXNCaW5hcnkoYikpIHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGEuZXF1YWxzKGIsIG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAoYi5lcXVhbHMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGIuZXF1YWxzKGEsIG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGZhbGxiYWNrIGZvciBjdXN0b20gdHlwZXMgdGhhdCBkb24ndCBpbXBsZW1lbnQgdGhlaXIgb3duIGVxdWFsc1xuICBzd2l0Y2ggKEVKU09OLl9pc0N1c3RvbVR5cGUoYSkgKyBFSlNPTi5faXNDdXN0b21UeXBlKGIpKSB7XG4gICAgY2FzZSAxOiByZXR1cm4gZmFsc2U7XG4gICAgY2FzZSAyOiByZXR1cm4gRUpTT04uZXF1YWxzKEVKU09OLnRvSlNPTlZhbHVlKGEpLCBFSlNPTi50b0pTT05WYWx1ZShiKSk7XG4gICAgZGVmYXVsdDogLy8gRG8gbm90aGluZ1xuICB9XG5cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICBsZXQgcmV0O1xuICBjb25zdCBhS2V5cyA9IE9iamVjdC5rZXlzKGEpO1xuICBjb25zdCBiS2V5cyA9IE9iamVjdC5rZXlzKGIpO1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICBpID0gMDtcbiAgICByZXQgPSBhS2V5cy5ldmVyeShrZXkgPT4ge1xuICAgICAgaWYgKGkgPj0gYktleXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChrZXkgIT09IGJLZXlzW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFba2V5XSwgYltiS2V5c1tpXV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICAgIHJldCA9IGFLZXlzLmV2ZXJ5KGtleSA9PiB7XG4gICAgICBpZiAoIWhhc093bihiLCBrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFba2V5XSwgYltrZXldLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmV0ICYmIGkgPT09IGJLZXlzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUmV0dXJuIGEgZGVlcCBjb3B5IG9mIGB2YWxgLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge0VKU09OfSB2YWwgQSB2YWx1ZSB0byBjb3B5LlxuICovXG5FSlNPTi5jbG9uZSA9IHYgPT4ge1xuICBsZXQgcmV0O1xuICBpZiAodHlwZW9mIHYgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBpZiAodiA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsOyAvLyBudWxsIGhhcyB0eXBlb2YgXCJvYmplY3RcIlxuICB9XG5cbiAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHYuZ2V0VGltZSgpKTtcbiAgfVxuXG4gIC8vIFJlZ0V4cHMgYXJlIG5vdCByZWFsbHkgRUpTT04gZWxlbWVudHMgKGVnIHdlIGRvbid0IGRlZmluZSBhIHNlcmlhbGl6YXRpb25cbiAgLy8gZm9yIHRoZW0pLCBidXQgdGhleSdyZSBpbW11dGFibGUgYW55d2F5LCBzbyB3ZSBjYW4gc3VwcG9ydCB0aGVtIGluIGNsb25lLlxuICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKSB7XG4gICAgcmV0ID0gRUpTT04ubmV3QmluYXJ5KHYubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHZbaV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgIHJldHVybiB2Lm1hcCh2YWx1ZSA9PiBFSlNPTi5jbG9uZSh2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKGlzQXJndW1lbnRzKHYpKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odikubWFwKHZhbHVlID0+IEVKU09OLmNsb25lKHZhbHVlKSk7XG4gIH1cblxuICAvLyBoYW5kbGUgZ2VuZXJhbCB1c2VyLWRlZmluZWQgdHlwZWQgT2JqZWN0cyBpZiB0aGV5IGhhdmUgYSBjbG9uZSBtZXRob2RcbiAgaWYgKHR5cGVvZiB2LmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHYuY2xvbmUoKTtcbiAgfVxuXG4gIC8vIGhhbmRsZSBvdGhlciBjdXN0b20gdHlwZXNcbiAgaWYgKEVKU09OLl9pc0N1c3RvbVR5cGUodikpIHtcbiAgICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShFSlNPTi5jbG9uZShFSlNPTi50b0pTT05WYWx1ZSh2KSksIHRydWUpO1xuICB9XG5cbiAgLy8gaGFuZGxlIG90aGVyIG9iamVjdHNcbiAgcmV0ID0ge307XG4gIE9iamVjdC5rZXlzKHYpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHJldFtrZXldID0gRUpTT04uY2xvbmUodltrZXldKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEFsbG9jYXRlIGEgbmV3IGJ1ZmZlciBvZiBiaW5hcnkgZGF0YSB0aGF0IEVKU09OIGNhbiBzZXJpYWxpemUuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7TnVtYmVyfSBzaXplIFRoZSBudW1iZXIgb2YgYnl0ZXMgb2YgYmluYXJ5IGRhdGEgdG8gYWxsb2NhdGUuXG4gKi9cbi8vIEVKU09OLm5ld0JpbmFyeSBpcyB0aGUgcHVibGljIGRvY3VtZW50ZWQgQVBJIGZvciB0aGlzIGZ1bmN0aW9uYWxpdHksXG4vLyBidXQgdGhlIGltcGxlbWVudGF0aW9uIGlzIGluIHRoZSAnYmFzZTY0JyBwYWNrYWdlIHRvIGF2b2lkXG4vLyBpbnRyb2R1Y2luZyBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuIChJZiB0aGUgaW1wbGVtZW50YXRpb24gd2VyZSBoZXJlLFxuLy8gdGhlbiAnYmFzZTY0JyB3b3VsZCBoYXZlIHRvIHVzZSBFSlNPTi5uZXdCaW5hcnksIGFuZCAnZWpzb24nIHdvdWxkXG4vLyBhbHNvIGhhdmUgdG8gdXNlICdiYXNlNjQnLilcbkVKU09OLm5ld0JpbmFyeSA9IEJhc2U2NC5uZXdCaW5hcnk7XG5cbmV4cG9ydCB7IEVKU09OIH07XG4iLCIvLyBCYXNlZCBvbiBqc29uMi5qcyBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanNcbi8vXG4vLyAgICBqc29uMi5qc1xuLy8gICAgMjAxMi0xMC0wOFxuLy9cbi8vICAgIFB1YmxpYyBEb21haW4uXG4vL1xuLy8gICAgTk8gV0FSUkFOVFkgRVhQUkVTU0VEIE9SIElNUExJRUQuIFVTRSBBVCBZT1VSIE9XTiBSSVNLLlxuXG5mdW5jdGlvbiBxdW90ZShzdHJpbmcpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0cmluZyk7XG59XG5cbmNvbnN0IHN0ciA9IChrZXksIGhvbGRlciwgc2luZ2xlSW5kZW50LCBvdXRlckluZGVudCwgY2Fub25pY2FsKSA9PiB7XG4gIGNvbnN0IHZhbHVlID0gaG9sZGVyW2tleV07XG5cbiAgLy8gV2hhdCBoYXBwZW5zIG5leHQgZGVwZW5kcyBvbiB0aGUgdmFsdWUncyB0eXBlLlxuICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICBjYXNlICdzdHJpbmcnOlxuICAgIHJldHVybiBxdW90ZSh2YWx1ZSk7XG4gIGNhc2UgJ251bWJlcic6XG4gICAgLy8gSlNPTiBudW1iZXJzIG11c3QgYmUgZmluaXRlLiBFbmNvZGUgbm9uLWZpbml0ZSBudW1iZXJzIGFzIG51bGwuXG4gICAgcmV0dXJuIGlzRmluaXRlKHZhbHVlKSA/IFN0cmluZyh2YWx1ZSkgOiAnbnVsbCc7XG4gIGNhc2UgJ2Jvb2xlYW4nOlxuICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAvLyBJZiB0aGUgdHlwZSBpcyAnb2JqZWN0Jywgd2UgbWlnaHQgYmUgZGVhbGluZyB3aXRoIGFuIG9iamVjdCBvciBhbiBhcnJheSBvclxuICAvLyBudWxsLlxuICBjYXNlICdvYmplY3QnOlxuICAgIC8vIER1ZSB0byBhIHNwZWNpZmljYXRpb24gYmx1bmRlciBpbiBFQ01BU2NyaXB0LCB0eXBlb2YgbnVsbCBpcyAnb2JqZWN0JyxcbiAgICAvLyBzbyB3YXRjaCBvdXQgZm9yIHRoYXQgY2FzZS5cbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICByZXR1cm4gJ251bGwnO1xuICAgIH1cbiAgICAvLyBNYWtlIGFuIGFycmF5IHRvIGhvbGQgdGhlIHBhcnRpYWwgcmVzdWx0cyBvZiBzdHJpbmdpZnlpbmcgdGhpcyBvYmplY3RcbiAgICAvLyB2YWx1ZS5cbiAgICBjb25zdCBpbm5lckluZGVudCA9IG91dGVySW5kZW50ICsgc2luZ2xlSW5kZW50O1xuICAgIGNvbnN0IHBhcnRpYWwgPSBbXTtcblxuICAgIC8vIElzIHRoZSB2YWx1ZSBhbiBhcnJheT9cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBpcyBhbiBhcnJheS4gU3RyaW5naWZ5IGV2ZXJ5IGVsZW1lbnQuIFVzZSBudWxsIGFzIGFcbiAgICAgIC8vIHBsYWNlaG9sZGVyIGZvciBub24tSlNPTiB2YWx1ZXMuXG4gICAgICBjb25zdCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHBhcnRpYWxbaV0gPVxuICAgICAgICAgIHN0cihpLCB2YWx1ZSwgc2luZ2xlSW5kZW50LCBpbm5lckluZGVudCwgY2Fub25pY2FsKSB8fCAnbnVsbCc7XG4gICAgICB9XG5cbiAgICAgIC8vIEpvaW4gYWxsIG9mIHRoZSBlbGVtZW50cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLCBhbmQgd3JhcFxuICAgICAgLy8gdGhlbSBpbiBicmFja2V0cy5cbiAgICAgIGxldCB2O1xuICAgICAgaWYgKHBhcnRpYWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHYgPSAnW10nO1xuICAgICAgfSBlbHNlIGlmIChpbm5lckluZGVudCkge1xuICAgICAgICB2ID0gJ1tcXG4nICtcbiAgICAgICAgICBpbm5lckluZGVudCArXG4gICAgICAgICAgcGFydGlhbC5qb2luKCcsXFxuJyArXG4gICAgICAgICAgaW5uZXJJbmRlbnQpICtcbiAgICAgICAgICAnXFxuJyArXG4gICAgICAgICAgb3V0ZXJJbmRlbnQgK1xuICAgICAgICAgICddJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHYgPSAnWycgKyBwYXJ0aWFsLmpvaW4oJywnKSArICddJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB2O1xuICAgIH1cblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgb2YgdGhlIGtleXMgaW4gdGhlIG9iamVjdC5cbiAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgICBpZiAoY2Fub25pY2FsKSB7XG4gICAgICBrZXlzID0ga2V5cy5zb3J0KCk7XG4gICAgfVxuICAgIGtleXMuZm9yRWFjaChrID0+IHtcbiAgICAgIHYgPSBzdHIoaywgdmFsdWUsIHNpbmdsZUluZGVudCwgaW5uZXJJbmRlbnQsIGNhbm9uaWNhbCk7XG4gICAgICBpZiAodikge1xuICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoaW5uZXJJbmRlbnQgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSm9pbiBhbGwgb2YgdGhlIG1lbWJlciB0ZXh0cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLFxuICAgIC8vIGFuZCB3cmFwIHRoZW0gaW4gYnJhY2VzLlxuICAgIGlmIChwYXJ0aWFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdiA9ICd7fSc7XG4gICAgfSBlbHNlIGlmIChpbm5lckluZGVudCkge1xuICAgICAgdiA9ICd7XFxuJyArXG4gICAgICAgIGlubmVySW5kZW50ICtcbiAgICAgICAgcGFydGlhbC5qb2luKCcsXFxuJyArXG4gICAgICAgIGlubmVySW5kZW50KSArXG4gICAgICAgICdcXG4nICtcbiAgICAgICAgb3V0ZXJJbmRlbnQgK1xuICAgICAgICAnfSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHYgPSAneycgKyBwYXJ0aWFsLmpvaW4oJywnKSArICd9JztcbiAgICB9XG4gICAgcmV0dXJuIHY7XG5cbiAgZGVmYXVsdDogLy8gRG8gbm90aGluZ1xuICB9XG59O1xuXG4vLyBJZiB0aGUgSlNPTiBvYmplY3QgZG9lcyBub3QgeWV0IGhhdmUgYSBzdHJpbmdpZnkgbWV0aG9kLCBnaXZlIGl0IG9uZS5cbmNvbnN0IGNhbm9uaWNhbFN0cmluZ2lmeSA9ICh2YWx1ZSwgb3B0aW9ucykgPT4ge1xuICAvLyBNYWtlIGEgZmFrZSByb290IG9iamVjdCBjb250YWluaW5nIG91ciB2YWx1ZSB1bmRlciB0aGUga2V5IG9mICcnLlxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdCBvZiBzdHJpbmdpZnlpbmcgdGhlIHZhbHVlLlxuICBjb25zdCBhbGxPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgaW5kZW50OiAnJyxcbiAgICBjYW5vbmljYWw6IGZhbHNlLFxuICB9LCBvcHRpb25zKTtcbiAgaWYgKGFsbE9wdGlvbnMuaW5kZW50ID09PSB0cnVlKSB7XG4gICAgYWxsT3B0aW9ucy5pbmRlbnQgPSAnICAnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBhbGxPcHRpb25zLmluZGVudCA9PT0gJ251bWJlcicpIHtcbiAgICBsZXQgbmV3SW5kZW50ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGxPcHRpb25zLmluZGVudDsgaSsrKSB7XG4gICAgICBuZXdJbmRlbnQgKz0gJyAnO1xuICAgIH1cbiAgICBhbGxPcHRpb25zLmluZGVudCA9IG5ld0luZGVudDtcbiAgfVxuICByZXR1cm4gc3RyKCcnLCB7Jyc6IHZhbHVlfSwgYWxsT3B0aW9ucy5pbmRlbnQsICcnLCBhbGxPcHRpb25zLmNhbm9uaWNhbCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjYW5vbmljYWxTdHJpbmdpZnk7XG4iXX0=

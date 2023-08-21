(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var GeoJSON = Package['geojson-utils'].GeoJSON;
var IdMap = Package['id-map'].IdMap;
var MongoID = Package['mongo-id'].MongoID;
var OrderedDict = Package['ordered-dict'].OrderedDict;
var Random = Package.random.Random;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var operand, selectorValue, MinimongoTest, MinimongoError, selector, doc, callback, options, oldResults, a, b, LocalCollection, Minimongo;

var require = meteorInstall({"node_modules":{"meteor":{"minimongo":{"minimongo_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/minimongo_server.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./minimongo_common.js"));
let hasOwn, isNumericKey, isOperatorObject, pathsToTree, projectionDetails;
module.watch(require("./common.js"), {
  hasOwn(v) {
    hasOwn = v;
  },

  isNumericKey(v) {
    isNumericKey = v;
  },

  isOperatorObject(v) {
    isOperatorObject = v;
  },

  pathsToTree(v) {
    pathsToTree = v;
  },

  projectionDetails(v) {
    projectionDetails = v;
  }

}, 0);

Minimongo._pathsElidingNumericKeys = paths => paths.map(path => path.split('.').filter(part => !isNumericKey(part)).join('.')); // Returns true if the modifier applied to some document may change the result
// of matching the document by selector
// The modifier is always in a form of Object:
//  - $set
//    - 'a.b.22.z': value
//    - 'foo.bar': 42
//  - $unset
//    - 'abc.d': 1


Minimongo.Matcher.prototype.affectedByModifier = function (modifier) {
  // safe check for $set/$unset being objects
  modifier = Object.assign({
    $set: {},
    $unset: {}
  }, modifier);

  const meaningfulPaths = this._getPaths();

  const modifiedPaths = [].concat(Object.keys(modifier.$set), Object.keys(modifier.$unset));
  return modifiedPaths.some(path => {
    const mod = path.split('.');
    return meaningfulPaths.some(meaningfulPath => {
      const sel = meaningfulPath.split('.');
      let i = 0,
          j = 0;

      while (i < sel.length && j < mod.length) {
        if (isNumericKey(sel[i]) && isNumericKey(mod[j])) {
          // foo.4.bar selector affected by foo.4 modifier
          // foo.3.bar selector unaffected by foo.4 modifier
          if (sel[i] === mod[j]) {
            i++;
            j++;
          } else {
            return false;
          }
        } else if (isNumericKey(sel[i])) {
          // foo.4.bar selector unaffected by foo.bar modifier
          return false;
        } else if (isNumericKey(mod[j])) {
          j++;
        } else if (sel[i] === mod[j]) {
          i++;
          j++;
        } else {
          return false;
        }
      } // One is a prefix of another, taking numeric fields into account


      return true;
    });
  });
}; // @param modifier - Object: MongoDB-styled modifier with `$set`s and `$unsets`
//                           only. (assumed to come from oplog)
// @returns - Boolean: if after applying the modifier, selector can start
//                     accepting the modified value.
// NOTE: assumes that document affected by modifier didn't match this Matcher
// before, so if modifier can't convince selector in a positive change it would
// stay 'false'.
// Currently doesn't support $-operators and numeric indices precisely.


Minimongo.Matcher.prototype.canBecomeTrueByModifier = function (modifier) {
  if (!this.affectedByModifier(modifier)) {
    return false;
  }

  if (!this.isSimple()) {
    return true;
  }

  modifier = Object.assign({
    $set: {},
    $unset: {}
  }, modifier);
  const modifierPaths = [].concat(Object.keys(modifier.$set), Object.keys(modifier.$unset));

  if (this._getPaths().some(pathHasNumericKeys) || modifierPaths.some(pathHasNumericKeys)) {
    return true;
  } // check if there is a $set or $unset that indicates something is an
  // object rather than a scalar in the actual object where we saw $-operator
  // NOTE: it is correct since we allow only scalars in $-operators
  // Example: for selector {'a.b': {$gt: 5}} the modifier {'a.b.c':7} would
  // definitely set the result to false as 'a.b' appears to be an object.


  const expectedScalarIsObject = Object.keys(this._selector).some(path => {
    if (!isOperatorObject(this._selector[path])) {
      return false;
    }

    return modifierPaths.some(modifierPath => modifierPath.startsWith(`${path}.`));
  });

  if (expectedScalarIsObject) {
    return false;
  } // See if we can apply the modifier on the ideally matching object. If it
  // still matches the selector, then the modifier could have turned the real
  // object in the database into something matching.


  const matchingDocument = EJSON.clone(this.matchingDocument()); // The selector is too complex, anything can happen.

  if (matchingDocument === null) {
    return true;
  }

  try {
    LocalCollection._modify(matchingDocument, modifier);
  } catch (error) {
    // Couldn't set a property on a field which is a scalar or null in the
    // selector.
    // Example:
    // real document: { 'a.b': 3 }
    // selector: { 'a': 12 }
    // converted selector (ideal document): { 'a': 12 }
    // modifier: { $set: { 'a.b': 4 } }
    // We don't know what real document was like but from the error raised by
    // $set on a scalar field we can reason that the structure of real document
    // is completely different.
    if (error.name === 'MinimongoError' && error.setPropertyError) {
      return false;
    }

    throw error;
  }

  return this.documentMatches(matchingDocument).result;
}; // Knows how to combine a mongo selector and a fields projection to a new fields
// projection taking into account active fields from the passed selector.
// @returns Object - projection object (same as fields option of mongo cursor)


Minimongo.Matcher.prototype.combineIntoProjection = function (projection) {
  const selectorPaths = Minimongo._pathsElidingNumericKeys(this._getPaths()); // Special case for $where operator in the selector - projection should depend
  // on all fields of the document. getSelectorPaths returns a list of paths
  // selector depends on. If one of the paths is '' (empty string) representing
  // the root or the whole document, complete projection should be returned.


  if (selectorPaths.includes('')) {
    return {};
  }

  return combineImportantPathsIntoProjection(selectorPaths, projection);
}; // Returns an object that would match the selector if possible or null if the
// selector is too complex for us to analyze
// { 'a.b': { ans: 42 }, 'foo.bar': null, 'foo.baz': "something" }
// => { a: { b: { ans: 42 } }, foo: { bar: null, baz: "something" } }


Minimongo.Matcher.prototype.matchingDocument = function () {
  // check if it was computed before
  if (this._matchingDocument !== undefined) {
    return this._matchingDocument;
  } // If the analysis of this selector is too hard for our implementation
  // fallback to "YES"


  let fallback = false;
  this._matchingDocument = pathsToTree(this._getPaths(), path => {
    const valueSelector = this._selector[path];

    if (isOperatorObject(valueSelector)) {
      // if there is a strict equality, there is a good
      // chance we can use one of those as "matching"
      // dummy value
      if (valueSelector.$eq) {
        return valueSelector.$eq;
      }

      if (valueSelector.$in) {
        const matcher = new Minimongo.Matcher({
          placeholder: valueSelector
        }); // Return anything from $in that matches the whole selector for this
        // path. If nothing matches, returns `undefined` as nothing can make
        // this selector into `true`.

        return valueSelector.$in.find(placeholder => matcher.documentMatches({
          placeholder
        }).result);
      }

      if (onlyContainsKeys(valueSelector, ['$gt', '$gte', '$lt', '$lte'])) {
        let lowerBound = -Infinity;
        let upperBound = Infinity;
        ['$lte', '$lt'].forEach(op => {
          if (hasOwn.call(valueSelector, op) && valueSelector[op] < upperBound) {
            upperBound = valueSelector[op];
          }
        });
        ['$gte', '$gt'].forEach(op => {
          if (hasOwn.call(valueSelector, op) && valueSelector[op] > lowerBound) {
            lowerBound = valueSelector[op];
          }
        });
        const middle = (lowerBound + upperBound) / 2;
        const matcher = new Minimongo.Matcher({
          placeholder: valueSelector
        });

        if (!matcher.documentMatches({
          placeholder: middle
        }).result && (middle === lowerBound || middle === upperBound)) {
          fallback = true;
        }

        return middle;
      }

      if (onlyContainsKeys(valueSelector, ['$nin', '$ne'])) {
        // Since this._isSimple makes sure $nin and $ne are not combined with
        // objects or arrays, we can confidently return an empty object as it
        // never matches any scalar.
        return {};
      }

      fallback = true;
    }

    return this._selector[path];
  }, x => x);

  if (fallback) {
    this._matchingDocument = null;
  }

  return this._matchingDocument;
}; // Minimongo.Sorter gets a similar method, which delegates to a Matcher it made
// for this exact purpose.


Minimongo.Sorter.prototype.affectedByModifier = function (modifier) {
  return this._selectorForAffectedByModifier.affectedByModifier(modifier);
};

Minimongo.Sorter.prototype.combineIntoProjection = function (projection) {
  return combineImportantPathsIntoProjection(Minimongo._pathsElidingNumericKeys(this._getPaths()), projection);
};

function combineImportantPathsIntoProjection(paths, projection) {
  const details = projectionDetails(projection); // merge the paths to include

  const tree = pathsToTree(paths, path => true, (node, path, fullPath) => true, details.tree);
  const mergedProjection = treeToPaths(tree);

  if (details.including) {
    // both selector and projection are pointing on fields to include
    // so we can just return the merged tree
    return mergedProjection;
  } // selector is pointing at fields to include
  // projection is pointing at fields to exclude
  // make sure we don't exclude important paths


  const mergedExclProjection = {};
  Object.keys(mergedProjection).forEach(path => {
    if (!mergedProjection[path]) {
      mergedExclProjection[path] = false;
    }
  });
  return mergedExclProjection;
}

function getPaths(selector) {
  return Object.keys(new Minimongo.Matcher(selector)._paths); // XXX remove it?
  // return Object.keys(selector).map(k => {
  //   // we don't know how to handle $where because it can be anything
  //   if (k === '$where') {
  //     return ''; // matches everything
  //   }
  //   // we branch from $or/$and/$nor operator
  //   if (['$or', '$and', '$nor'].includes(k)) {
  //     return selector[k].map(getPaths);
  //   }
  //   // the value is a literal or some comparison operator
  //   return k;
  // })
  //   .reduce((a, b) => a.concat(b), [])
  //   .filter((a, b, c) => c.indexOf(a) === b);
} // A helper to ensure object has only certain keys


function onlyContainsKeys(obj, keys) {
  return Object.keys(obj).every(k => keys.includes(k));
}

function pathHasNumericKeys(path) {
  return path.split('.').some(isNumericKey);
} // Returns a set of key paths similar to
// { 'foo.bar': 1, 'a.b.c': 1 }


function treeToPaths(tree, prefix = '') {
  const result = {};
  Object.keys(tree).forEach(key => {
    const value = tree[key];

    if (value === Object(value)) {
      Object.assign(result, treeToPaths(value, `${prefix + key}.`));
    } else {
      result[prefix + key] = value;
    }
  });
  return result;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/common.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  hasOwn: () => hasOwn,
  ELEMENT_OPERATORS: () => ELEMENT_OPERATORS,
  compileDocumentSelector: () => compileDocumentSelector,
  equalityElementMatcher: () => equalityElementMatcher,
  expandArraysInBranches: () => expandArraysInBranches,
  isIndexable: () => isIndexable,
  isNumericKey: () => isNumericKey,
  isOperatorObject: () => isOperatorObject,
  makeLookupFunction: () => makeLookupFunction,
  nothingMatcher: () => nothingMatcher,
  pathsToTree: () => pathsToTree,
  populateDocumentWithQueryFields: () => populateDocumentWithQueryFields,
  projectionDetails: () => projectionDetails,
  regexpElementMatcher: () => regexpElementMatcher
});
let LocalCollection;
module.watch(require("./local_collection.js"), {
  default(v) {
    LocalCollection = v;
  }

}, 0);
const hasOwn = Object.prototype.hasOwnProperty;
const ELEMENT_OPERATORS = {
  $lt: makeInequality(cmpValue => cmpValue < 0),
  $gt: makeInequality(cmpValue => cmpValue > 0),
  $lte: makeInequality(cmpValue => cmpValue <= 0),
  $gte: makeInequality(cmpValue => cmpValue >= 0),
  $mod: {
    compileElementSelector(operand) {
      if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
        throw Error('argument to $mod must be an array of two numbers');
      } // XXX could require to be ints or round or something


      const divisor = operand[0];
      const remainder = operand[1];
      return value => typeof value === 'number' && value % divisor === remainder;
    }

  },
  $in: {
    compileElementSelector(operand) {
      if (!Array.isArray(operand)) {
        throw Error('$in needs an array');
      }

      const elementMatchers = operand.map(option => {
        if (option instanceof RegExp) {
          return regexpElementMatcher(option);
        }

        if (isOperatorObject(option)) {
          throw Error('cannot nest $ under $in');
        }

        return equalityElementMatcher(option);
      });
      return value => {
        // Allow {a: {$in: [null]}} to match when 'a' does not exist.
        if (value === undefined) {
          value = null;
        }

        return elementMatchers.some(matcher => matcher(value));
      };
    }

  },
  $size: {
    // {a: [[5, 5]]} must match {a: {$size: 1}} but not {a: {$size: 2}}, so we
    // don't want to consider the element [5,5] in the leaf array [[5,5]] as a
    // possible value.
    dontExpandLeafArrays: true,

    compileElementSelector(operand) {
      if (typeof operand === 'string') {
        // Don't ask me why, but by experimentation, this seems to be what Mongo
        // does.
        operand = 0;
      } else if (typeof operand !== 'number') {
        throw Error('$size needs a number');
      }

      return value => Array.isArray(value) && value.length === operand;
    }

  },
  $type: {
    // {a: [5]} must not match {a: {$type: 4}} (4 means array), but it should
    // match {a: {$type: 1}} (1 means number), and {a: [[5]]} must match {$a:
    // {$type: 4}}. Thus, when we see a leaf array, we *should* expand it but
    // should *not* include it itself.
    dontIncludeLeafArrays: true,

    compileElementSelector(operand) {
      if (typeof operand === 'string') {
        const operandAliasMap = {
          'double': 1,
          'string': 2,
          'object': 3,
          'array': 4,
          'binData': 5,
          'undefined': 6,
          'objectId': 7,
          'bool': 8,
          'date': 9,
          'null': 10,
          'regex': 11,
          'dbPointer': 12,
          'javascript': 13,
          'symbol': 14,
          'javascriptWithScope': 15,
          'int': 16,
          'timestamp': 17,
          'long': 18,
          'decimal': 19,
          'minKey': -1,
          'maxKey': 127
        };

        if (!hasOwn.call(operandAliasMap, operand)) {
          throw Error(`unknown string alias for $type: ${operand}`);
        }

        operand = operandAliasMap[operand];
      } else if (typeof operand === 'number') {
        if (operand === 0 || operand < -1 || operand > 19 && operand !== 127) {
          throw Error(`Invalid numerical $type code: ${operand}`);
        }
      } else {
        throw Error('argument to $type is not a number or a string');
      }

      return value => value !== undefined && LocalCollection._f._type(value) === operand;
    }

  },
  $bitsAllSet: {
    compileElementSelector(operand) {
      const mask = getOperandBitmask(operand, '$bitsAllSet');
      return value => {
        const bitmask = getValueBitmask(value, mask.length);
        return bitmask && mask.every((byte, i) => (bitmask[i] & byte) === byte);
      };
    }

  },
  $bitsAnySet: {
    compileElementSelector(operand) {
      const mask = getOperandBitmask(operand, '$bitsAnySet');
      return value => {
        const bitmask = getValueBitmask(value, mask.length);
        return bitmask && mask.some((byte, i) => (~bitmask[i] & byte) !== byte);
      };
    }

  },
  $bitsAllClear: {
    compileElementSelector(operand) {
      const mask = getOperandBitmask(operand, '$bitsAllClear');
      return value => {
        const bitmask = getValueBitmask(value, mask.length);
        return bitmask && mask.every((byte, i) => !(bitmask[i] & byte));
      };
    }

  },
  $bitsAnyClear: {
    compileElementSelector(operand) {
      const mask = getOperandBitmask(operand, '$bitsAnyClear');
      return value => {
        const bitmask = getValueBitmask(value, mask.length);
        return bitmask && mask.some((byte, i) => (bitmask[i] & byte) !== byte);
      };
    }

  },
  $regex: {
    compileElementSelector(operand, valueSelector) {
      if (!(typeof operand === 'string' || operand instanceof RegExp)) {
        throw Error('$regex has to be a string or RegExp');
      }

      let regexp;

      if (valueSelector.$options !== undefined) {
        // Options passed in $options (even the empty string) always overrides
        // options in the RegExp object itself.
        // Be clear that we only support the JS-supported options, not extended
        // ones (eg, Mongo supports x and s). Ideally we would implement x and s
        // by transforming the regexp, but not today...
        if (/[^gim]/.test(valueSelector.$options)) {
          throw new Error('Only the i, m, and g regexp options are supported');
        }

        const source = operand instanceof RegExp ? operand.source : operand;
        regexp = new RegExp(source, valueSelector.$options);
      } else if (operand instanceof RegExp) {
        regexp = operand;
      } else {
        regexp = new RegExp(operand);
      }

      return regexpElementMatcher(regexp);
    }

  },
  $elemMatch: {
    dontExpandLeafArrays: true,

    compileElementSelector(operand, valueSelector, matcher) {
      if (!LocalCollection._isPlainObject(operand)) {
        throw Error('$elemMatch need an object');
      }

      const isDocMatcher = !isOperatorObject(Object.keys(operand).filter(key => !hasOwn.call(LOGICAL_OPERATORS, key)).reduce((a, b) => Object.assign(a, {
        [b]: operand[b]
      }), {}), true);
      let subMatcher;

      if (isDocMatcher) {
        // This is NOT the same as compileValueSelector(operand), and not just
        // because of the slightly different calling convention.
        // {$elemMatch: {x: 3}} means "an element has a field x:3", not
        // "consists only of a field x:3". Also, regexps and sub-$ are allowed.
        subMatcher = compileDocumentSelector(operand, matcher, {
          inElemMatch: true
        });
      } else {
        subMatcher = compileValueSelector(operand, matcher);
      }

      return value => {
        if (!Array.isArray(value)) {
          return false;
        }

        for (let i = 0; i < value.length; ++i) {
          const arrayElement = value[i];
          let arg;

          if (isDocMatcher) {
            // We can only match {$elemMatch: {b: 3}} against objects.
            // (We can also match against arrays, if there's numeric indices,
            // eg {$elemMatch: {'0.b': 3}} or {$elemMatch: {0: 3}}.)
            if (!isIndexable(arrayElement)) {
              return false;
            }

            arg = arrayElement;
          } else {
            // dontIterate ensures that {a: {$elemMatch: {$gt: 5}}} matches
            // {a: [8]} but not {a: [[8]]}
            arg = [{
              value: arrayElement,
              dontIterate: true
            }];
          } // XXX support $near in $elemMatch by propagating $distance?


          if (subMatcher(arg).result) {
            return i; // specially understood to mean "use as arrayIndices"
          }
        }

        return false;
      };
    }

  }
};
// Operators that appear at the top level of a document selector.
const LOGICAL_OPERATORS = {
  $and(subSelector, matcher, inElemMatch) {
    return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));
  },

  $or(subSelector, matcher, inElemMatch) {
    const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch); // Special case: if there is only one matcher, use it directly, *preserving*
    // any arrayIndices it returns.

    if (matchers.length === 1) {
      return matchers[0];
    }

    return doc => {
      const result = matchers.some(fn => fn(doc).result); // $or does NOT set arrayIndices when it has multiple
      // sub-expressions. (Tested against MongoDB.)

      return {
        result
      };
    };
  },

  $nor(subSelector, matcher, inElemMatch) {
    const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
    return doc => {
      const result = matchers.every(fn => !fn(doc).result); // Never set arrayIndices, because we only match if nothing in particular
      // 'matched' (and because this is consistent with MongoDB).

      return {
        result
      };
    };
  },

  $where(selectorValue, matcher) {
    // Record that *any* path may be used.
    matcher._recordPathUsed('');

    matcher._hasWhere = true;

    if (!(selectorValue instanceof Function)) {
      // XXX MongoDB seems to have more complex logic to decide where or or not
      // to add 'return'; not sure exactly what it is.
      selectorValue = Function('obj', `return ${selectorValue}`);
    } // We make the document available as both `this` and `obj`.
    // // XXX not sure what we should do if this throws


    return doc => ({
      result: selectorValue.call(doc, doc)
    });
  },

  // This is just used as a comment in the query (in MongoDB, it also ends up in
  // query logs); it has no effect on the actual selection.
  $comment() {
    return () => ({
      result: true
    });
  }

}; // Operators that (unlike LOGICAL_OPERATORS) pertain to individual paths in a
// document, but (unlike ELEMENT_OPERATORS) do not have a simple definition as
// "match each branched value independently and combine with
// convertElementMatcherToBranchedMatcher".

const VALUE_OPERATORS = {
  $eq(operand) {
    return convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));
  },

  $not(operand, valueSelector, matcher) {
    return invertBranchedMatcher(compileValueSelector(operand, matcher));
  },

  $ne(operand) {
    return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));
  },

  $nin(operand) {
    return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand)));
  },

  $exists(operand) {
    const exists = convertElementMatcherToBranchedMatcher(value => value !== undefined);
    return operand ? exists : invertBranchedMatcher(exists);
  },

  // $options just provides options for $regex; its logic is inside $regex
  $options(operand, valueSelector) {
    if (!hasOwn.call(valueSelector, '$regex')) {
      throw Error('$options needs a $regex');
    }

    return everythingMatcher;
  },

  // $maxDistance is basically an argument to $near
  $maxDistance(operand, valueSelector) {
    if (!valueSelector.$near) {
      throw Error('$maxDistance needs a $near');
    }

    return everythingMatcher;
  },

  $all(operand, valueSelector, matcher) {
    if (!Array.isArray(operand)) {
      throw Error('$all requires array');
    } // Not sure why, but this seems to be what MongoDB does.


    if (operand.length === 0) {
      return nothingMatcher;
    }

    const branchedMatchers = operand.map(criterion => {
      // XXX handle $all/$elemMatch combination
      if (isOperatorObject(criterion)) {
        throw Error('no $ expressions in $all');
      } // This is always a regexp or equality selector.


      return compileValueSelector(criterion, matcher);
    }); // andBranchedMatchers does NOT require all selectors to return true on the
    // SAME branch.

    return andBranchedMatchers(branchedMatchers);
  },

  $near(operand, valueSelector, matcher, isRoot) {
    if (!isRoot) {
      throw Error('$near can\'t be inside another $ operator');
    }

    matcher._hasGeoQuery = true; // There are two kinds of geodata in MongoDB: legacy coordinate pairs and
    // GeoJSON. They use different distance metrics, too. GeoJSON queries are
    // marked with a $geometry property, though legacy coordinates can be
    // matched using $geometry.

    let maxDistance, point, distance;

    if (LocalCollection._isPlainObject(operand) && hasOwn.call(operand, '$geometry')) {
      // GeoJSON "2dsphere" mode.
      maxDistance = operand.$maxDistance;
      point = operand.$geometry;

      distance = value => {
        // XXX: for now, we don't calculate the actual distance between, say,
        // polygon and circle. If people care about this use-case it will get
        // a priority.
        if (!value) {
          return null;
        }

        if (!value.type) {
          return GeoJSON.pointDistance(point, {
            type: 'Point',
            coordinates: pointToArray(value)
          });
        }

        if (value.type === 'Point') {
          return GeoJSON.pointDistance(point, value);
        }

        return GeoJSON.geometryWithinRadius(value, point, maxDistance) ? 0 : maxDistance + 1;
      };
    } else {
      maxDistance = valueSelector.$maxDistance;

      if (!isIndexable(operand)) {
        throw Error('$near argument must be coordinate pair or GeoJSON');
      }

      point = pointToArray(operand);

      distance = value => {
        if (!isIndexable(value)) {
          return null;
        }

        return distanceCoordinatePairs(point, value);
      };
    }

    return branchedValues => {
      // There might be multiple points in the document that match the given
      // field. Only one of them needs to be within $maxDistance, but we need to
      // evaluate all of them and use the nearest one for the implicit sort
      // specifier. (That's why we can't just use ELEMENT_OPERATORS here.)
      //
      // Note: This differs from MongoDB's implementation, where a document will
      // actually show up *multiple times* in the result set, with one entry for
      // each within-$maxDistance branching point.
      const result = {
        result: false
      };
      expandArraysInBranches(branchedValues).every(branch => {
        // if operation is an update, don't skip branches, just return the first
        // one (#3599)
        let curDistance;

        if (!matcher._isUpdate) {
          if (!(typeof branch.value === 'object')) {
            return true;
          }

          curDistance = distance(branch.value); // Skip branches that aren't real points or are too far away.

          if (curDistance === null || curDistance > maxDistance) {
            return true;
          } // Skip anything that's a tie.


          if (result.distance !== undefined && result.distance <= curDistance) {
            return true;
          }
        }

        result.result = true;
        result.distance = curDistance;

        if (branch.arrayIndices) {
          result.arrayIndices = branch.arrayIndices;
        } else {
          delete result.arrayIndices;
        }

        return !matcher._isUpdate;
      });
      return result;
    };
  }

}; // NB: We are cheating and using this function to implement 'AND' for both
// 'document matchers' and 'branched matchers'. They both return result objects
// but the argument is different: for the former it's a whole doc, whereas for
// the latter it's an array of 'branched values'.

function andSomeMatchers(subMatchers) {
  if (subMatchers.length === 0) {
    return everythingMatcher;
  }

  if (subMatchers.length === 1) {
    return subMatchers[0];
  }

  return docOrBranches => {
    const match = {};
    match.result = subMatchers.every(fn => {
      const subResult = fn(docOrBranches); // Copy a 'distance' number out of the first sub-matcher that has
      // one. Yes, this means that if there are multiple $near fields in a
      // query, something arbitrary happens; this appears to be consistent with
      // Mongo.

      if (subResult.result && subResult.distance !== undefined && match.distance === undefined) {
        match.distance = subResult.distance;
      } // Similarly, propagate arrayIndices from sub-matchers... but to match
      // MongoDB behavior, this time the *last* sub-matcher with arrayIndices
      // wins.


      if (subResult.result && subResult.arrayIndices) {
        match.arrayIndices = subResult.arrayIndices;
      }

      return subResult.result;
    }); // If we didn't actually match, forget any extra metadata we came up with.

    if (!match.result) {
      delete match.distance;
      delete match.arrayIndices;
    }

    return match;
  };
}

const andDocumentMatchers = andSomeMatchers;
const andBranchedMatchers = andSomeMatchers;

function compileArrayOfDocumentSelectors(selectors, matcher, inElemMatch) {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    throw Error('$and/$or/$nor must be nonempty array');
  }

  return selectors.map(subSelector => {
    if (!LocalCollection._isPlainObject(subSelector)) {
      throw Error('$or/$and/$nor entries need to be full objects');
    }

    return compileDocumentSelector(subSelector, matcher, {
      inElemMatch
    });
  });
} // Takes in a selector that could match a full document (eg, the original
// selector). Returns a function mapping document->result object.
//
// matcher is the Matcher object we are compiling.
//
// If this is the root document selector (ie, not wrapped in $and or the like),
// then isRoot is true. (This is used by $near.)


function compileDocumentSelector(docSelector, matcher, options = {}) {
  const docMatchers = Object.keys(docSelector).map(key => {
    const subSelector = docSelector[key];

    if (key.substr(0, 1) === '$') {
      // Outer operators are either logical operators (they recurse back into
      // this function), or $where.
      if (!hasOwn.call(LOGICAL_OPERATORS, key)) {
        throw new Error(`Unrecognized logical operator: ${key}`);
      }

      matcher._isSimple = false;
      return LOGICAL_OPERATORS[key](subSelector, matcher, options.inElemMatch);
    } // Record this path, but only if we aren't in an elemMatcher, since in an
    // elemMatch this is a path inside an object in an array, not in the doc
    // root.


    if (!options.inElemMatch) {
      matcher._recordPathUsed(key);
    } // Don't add a matcher if subSelector is a function -- this is to match
    // the behavior of Meteor on the server (inherited from the node mongodb
    // driver), which is to ignore any part of a selector which is a function.


    if (typeof subSelector === 'function') {
      return undefined;
    }

    const lookUpByIndex = makeLookupFunction(key);
    const valueMatcher = compileValueSelector(subSelector, matcher, options.isRoot);
    return doc => valueMatcher(lookUpByIndex(doc));
  }).filter(Boolean);
  return andDocumentMatchers(docMatchers);
}

// Takes in a selector that could match a key-indexed value in a document; eg,
// {$gt: 5, $lt: 9}, or a regular expression, or any non-expression object (to
// indicate equality).  Returns a branched matcher: a function mapping
// [branched value]->result object.
function compileValueSelector(valueSelector, matcher, isRoot) {
  if (valueSelector instanceof RegExp) {
    matcher._isSimple = false;
    return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));
  }

  if (isOperatorObject(valueSelector)) {
    return operatorBranchedMatcher(valueSelector, matcher, isRoot);
  }

  return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));
} // Given an element matcher (which evaluates a single value), returns a branched
// value (which evaluates the element matcher on all the branches and returns a
// more structured return value possibly including arrayIndices).


function convertElementMatcherToBranchedMatcher(elementMatcher, options = {}) {
  return branches => {
    const expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);
    const match = {};
    match.result = expanded.some(element => {
      let matched = elementMatcher(element.value); // Special case for $elemMatch: it means "true, and use this as an array
      // index if I didn't already have one".

      if (typeof matched === 'number') {
        // XXX This code dates from when we only stored a single array index
        // (for the outermost array). Should we be also including deeper array
        // indices from the $elemMatch match?
        if (!element.arrayIndices) {
          element.arrayIndices = [matched];
        }

        matched = true;
      } // If some element matched, and it's tagged with array indices, include
      // those indices in our result object.


      if (matched && element.arrayIndices) {
        match.arrayIndices = element.arrayIndices;
      }

      return matched;
    });
    return match;
  };
} // Helpers for $near.


function distanceCoordinatePairs(a, b) {
  const pointA = pointToArray(a);
  const pointB = pointToArray(b);
  return Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);
} // Takes something that is not an operator object and returns an element matcher
// for equality with that thing.


function equalityElementMatcher(elementSelector) {
  if (isOperatorObject(elementSelector)) {
    throw Error('Can\'t create equalityValueSelector for operator object');
  } // Special-case: null and undefined are equal (if you got undefined in there
  // somewhere, or if you got it due to some branch being non-existent in the
  // weird special case), even though they aren't with EJSON.equals.
  // undefined or null


  if (elementSelector == null) {
    return value => value == null;
  }

  return value => LocalCollection._f._equal(elementSelector, value);
}

function everythingMatcher(docOrBranchedValues) {
  return {
    result: true
  };
}

function expandArraysInBranches(branches, skipTheArrays) {
  const branchesOut = [];
  branches.forEach(branch => {
    const thisIsArray = Array.isArray(branch.value); // We include the branch itself, *UNLESS* we it's an array that we're going
    // to iterate and we're told to skip arrays.  (That's right, we include some
    // arrays even skipTheArrays is true: these are arrays that were found via
    // explicit numerical indices.)

    if (!(skipTheArrays && thisIsArray && !branch.dontIterate)) {
      branchesOut.push({
        arrayIndices: branch.arrayIndices,
        value: branch.value
      });
    }

    if (thisIsArray && !branch.dontIterate) {
      branch.value.forEach((value, i) => {
        branchesOut.push({
          arrayIndices: (branch.arrayIndices || []).concat(i),
          value
        });
      });
    }
  });
  return branchesOut;
}

// Helpers for $bitsAllSet/$bitsAnySet/$bitsAllClear/$bitsAnyClear.
function getOperandBitmask(operand, selector) {
  // numeric bitmask
  // You can provide a numeric bitmask to be matched against the operand field.
  // It must be representable as a non-negative 32-bit signed integer.
  // Otherwise, $bitsAllSet will return an error.
  if (Number.isInteger(operand) && operand >= 0) {
    return new Uint8Array(new Int32Array([operand]).buffer);
  } // bindata bitmask
  // You can also use an arbitrarily large BinData instance as a bitmask.


  if (EJSON.isBinary(operand)) {
    return new Uint8Array(operand.buffer);
  } // position list
  // If querying a list of bit positions, each <position> must be a non-negative
  // integer. Bit positions start at 0 from the least significant bit.


  if (Array.isArray(operand) && operand.every(x => Number.isInteger(x) && x >= 0)) {
    const buffer = new ArrayBuffer((Math.max(...operand) >> 3) + 1);
    const view = new Uint8Array(buffer);
    operand.forEach(x => {
      view[x >> 3] |= 1 << (x & 0x7);
    });
    return view;
  } // bad operand


  throw Error(`operand to ${selector} must be a numeric bitmask (representable as a ` + 'non-negative 32-bit signed integer), a bindata bitmask or an array with ' + 'bit positions (non-negative integers)');
}

function getValueBitmask(value, length) {
  // The field value must be either numerical or a BinData instance. Otherwise,
  // $bits... will not match the current document.
  // numerical
  if (Number.isSafeInteger(value)) {
    // $bits... will not match numerical values that cannot be represented as a
    // signed 64-bit integer. This can be the case if a value is either too
    // large or small to fit in a signed 64-bit integer, or if it has a
    // fractional component.
    const buffer = new ArrayBuffer(Math.max(length, 2 * Uint32Array.BYTES_PER_ELEMENT));
    let view = new Uint32Array(buffer, 0, 2);
    view[0] = value % ((1 << 16) * (1 << 16)) | 0;
    view[1] = value / ((1 << 16) * (1 << 16)) | 0; // sign extension

    if (value < 0) {
      view = new Uint8Array(buffer, 2);
      view.forEach((byte, i) => {
        view[i] = 0xff;
      });
    }

    return new Uint8Array(buffer);
  } // bindata


  if (EJSON.isBinary(value)) {
    return new Uint8Array(value.buffer);
  } // no match


  return false;
} // Actually inserts a key value into the selector document
// However, this checks there is no ambiguity in setting
// the value for the given key, throws otherwise


function insertIntoDocument(document, key, value) {
  Object.keys(document).forEach(existingKey => {
    if (existingKey.length > key.length && existingKey.indexOf(`${key}.`) === 0 || key.length > existingKey.length && key.indexOf(`${existingKey}.`) === 0) {
      throw new Error(`cannot infer query fields to set, both paths '${existingKey}' and ` + `'${key}' are matched`);
    } else if (existingKey === key) {
      throw new Error(`cannot infer query fields to set, path '${key}' is matched twice`);
    }
  });
  document[key] = value;
} // Returns a branched matcher that matches iff the given matcher does not.
// Note that this implicitly "deMorganizes" the wrapped function.  ie, it
// means that ALL branch values need to fail to match innerBranchedMatcher.


function invertBranchedMatcher(branchedMatcher) {
  return branchValues => {
    // We explicitly choose to strip arrayIndices here: it doesn't make sense to
    // say "update the array element that does not match something", at least
    // in mongo-land.
    return {
      result: !branchedMatcher(branchValues).result
    };
  };
}

function isIndexable(obj) {
  return Array.isArray(obj) || LocalCollection._isPlainObject(obj);
}

function isNumericKey(s) {
  return /^[0-9]+$/.test(s);
}

function isOperatorObject(valueSelector, inconsistentOK) {
  if (!LocalCollection._isPlainObject(valueSelector)) {
    return false;
  }

  let theseAreOperators = undefined;
  Object.keys(valueSelector).forEach(selKey => {
    const thisIsOperator = selKey.substr(0, 1) === '$';

    if (theseAreOperators === undefined) {
      theseAreOperators = thisIsOperator;
    } else if (theseAreOperators !== thisIsOperator) {
      if (!inconsistentOK) {
        throw new Error(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
      }

      theseAreOperators = false;
    }
  });
  return !!theseAreOperators; // {} has no operators
}

// Helper for $lt/$gt/$lte/$gte.
function makeInequality(cmpValueComparator) {
  return {
    compileElementSelector(operand) {
      // Arrays never compare false with non-arrays for any inequality.
      // XXX This was behavior we observed in pre-release MongoDB 2.5, but
      //     it seems to have been reverted.
      //     See https://jira.mongodb.org/browse/SERVER-11444
      if (Array.isArray(operand)) {
        return () => false;
      } // Special case: consider undefined and null the same (so true with
      // $gte/$lte).


      if (operand === undefined) {
        operand = null;
      }

      const operandType = LocalCollection._f._type(operand);

      return value => {
        if (value === undefined) {
          value = null;
        } // Comparisons are never true among things of different type (except
        // null vs undefined).


        if (LocalCollection._f._type(value) !== operandType) {
          return false;
        }

        return cmpValueComparator(LocalCollection._f._cmp(value, operand));
      };
    }

  };
} // makeLookupFunction(key) returns a lookup function.
//
// A lookup function takes in a document and returns an array of matching
// branches.  If no arrays are found while looking up the key, this array will
// have exactly one branches (possibly 'undefined', if some segment of the key
// was not found).
//
// If arrays are found in the middle, this can have more than one element, since
// we 'branch'. When we 'branch', if there are more key segments to look up,
// then we only pursue branches that are plain objects (not arrays or scalars).
// This means we can actually end up with no branches!
//
// We do *NOT* branch on arrays that are found at the end (ie, at the last
// dotted member of the key). We just return that array; if you want to
// effectively 'branch' over the array's values, post-process the lookup
// function with expandArraysInBranches.
//
// Each branch is an object with keys:
//  - value: the value at the branch
//  - dontIterate: an optional bool; if true, it means that 'value' is an array
//    that expandArraysInBranches should NOT expand. This specifically happens
//    when there is a numeric index in the key, and ensures the
//    perhaps-surprising MongoDB behavior where {'a.0': 5} does NOT
//    match {a: [[5]]}.
//  - arrayIndices: if any array indexing was done during lookup (either due to
//    explicit numeric indices or implicit branching), this will be an array of
//    the array indices used, from outermost to innermost; it is falsey or
//    absent if no array index is used. If an explicit numeric index is used,
//    the index will be followed in arrayIndices by the string 'x'.
//
//    Note: arrayIndices is used for two purposes. First, it is used to
//    implement the '$' modifier feature, which only ever looks at its first
//    element.
//
//    Second, it is used for sort key generation, which needs to be able to tell
//    the difference between different paths. Moreover, it needs to
//    differentiate between explicit and implicit branching, which is why
//    there's the somewhat hacky 'x' entry: this means that explicit and
//    implicit array lookups will have different full arrayIndices paths. (That
//    code only requires that different paths have different arrayIndices; it
//    doesn't actually 'parse' arrayIndices. As an alternative, arrayIndices
//    could contain objects with flags like 'implicit', but I think that only
//    makes the code surrounding them more complex.)
//
//    (By the way, this field ends up getting passed around a lot without
//    cloning, so never mutate any arrayIndices field/var in this package!)
//
//
// At the top level, you may only pass in a plain object or array.
//
// See the test 'minimongo - lookup' for some examples of what lookup functions
// return.


function makeLookupFunction(key, options = {}) {
  const parts = key.split('.');
  const firstPart = parts.length ? parts[0] : '';
  const lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'));

  const omitUnnecessaryFields = result => {
    if (!result.dontIterate) {
      delete result.dontIterate;
    }

    if (result.arrayIndices && !result.arrayIndices.length) {
      delete result.arrayIndices;
    }

    return result;
  }; // Doc will always be a plain object or an array.
  // apply an explicit numeric index, an array.


  return (doc, arrayIndices = []) => {
    if (Array.isArray(doc)) {
      // If we're being asked to do an invalid lookup into an array (non-integer
      // or out-of-bounds), return no results (which is different from returning
      // a single undefined result, in that `null` equality checks won't match).
      if (!(isNumericKey(firstPart) && firstPart < doc.length)) {
        return [];
      } // Remember that we used this array index. Include an 'x' to indicate that
      // the previous index came from being considered as an explicit array
      // index (not branching).


      arrayIndices = arrayIndices.concat(+firstPart, 'x');
    } // Do our first lookup.


    const firstLevel = doc[firstPart]; // If there is no deeper to dig, return what we found.
    //
    // If what we found is an array, most value selectors will choose to treat
    // the elements of the array as matchable values in their own right, but
    // that's done outside of the lookup function. (Exceptions to this are $size
    // and stuff relating to $elemMatch.  eg, {a: {$size: 2}} does not match {a:
    // [[1, 2]]}.)
    //
    // That said, if we just did an *explicit* array lookup (on doc) to find
    // firstLevel, and firstLevel is an array too, we do NOT want value
    // selectors to iterate over it.  eg, {'a.0': 5} does not match {a: [[5]]}.
    // So in that case, we mark the return value as 'don't iterate'.

    if (!lookupRest) {
      return [omitUnnecessaryFields({
        arrayIndices,
        dontIterate: Array.isArray(doc) && Array.isArray(firstLevel),
        value: firstLevel
      })];
    } // We need to dig deeper.  But if we can't, because what we've found is not
    // an array or plain object, we're done. If we just did a numeric index into
    // an array, we return nothing here (this is a change in Mongo 2.5 from
    // Mongo 2.4, where {'a.0.b': null} stopped matching {a: [5]}). Otherwise,
    // return a single `undefined` (which can, for example, match via equality
    // with `null`).


    if (!isIndexable(firstLevel)) {
      if (Array.isArray(doc)) {
        return [];
      }

      return [omitUnnecessaryFields({
        arrayIndices,
        value: undefined
      })];
    }

    const result = [];

    const appendToResult = more => {
      result.push(...more);
    }; // Dig deeper: look up the rest of the parts on whatever we've found.
    // (lookupRest is smart enough to not try to do invalid lookups into
    // firstLevel if it's an array.)


    appendToResult(lookupRest(firstLevel, arrayIndices)); // If we found an array, then in *addition* to potentially treating the next
    // part as a literal integer lookup, we should also 'branch': try to look up
    // the rest of the parts on each array element in parallel.
    //
    // In this case, we *only* dig deeper into array elements that are plain
    // objects. (Recall that we only got this far if we have further to dig.)
    // This makes sense: we certainly don't dig deeper into non-indexable
    // objects. And it would be weird to dig into an array: it's simpler to have
    // a rule that explicit integer indexes only apply to an outer array, not to
    // an array you find after a branching search.
    //
    // In the special case of a numeric part in a *sort selector* (not a query
    // selector), we skip the branching: we ONLY allow the numeric part to mean
    // 'look up this index' in that case, not 'also look up this index in all
    // the elements of the array'.

    if (Array.isArray(firstLevel) && !(isNumericKey(parts[1]) && options.forSort)) {
      firstLevel.forEach((branch, arrayIndex) => {
        if (LocalCollection._isPlainObject(branch)) {
          appendToResult(lookupRest(branch, arrayIndices.concat(arrayIndex)));
        }
      });
    }

    return result;
  };
}

// Object exported only for unit testing.
// Use it to export private functions to test in Tinytest.
MinimongoTest = {
  makeLookupFunction
};

MinimongoError = (message, options = {}) => {
  if (typeof message === 'string' && options.field) {
    message += ` for field '${options.field}'`;
  }

  const error = new Error(message);
  error.name = 'MinimongoError';
  return error;
};

function nothingMatcher(docOrBranchedValues) {
  return {
    result: false
  };
}

// Takes an operator object (an object with $ keys) and returns a branched
// matcher for it.
function operatorBranchedMatcher(valueSelector, matcher, isRoot) {
  // Each valueSelector works separately on the various branches.  So one
  // operator can match one branch and another can match another branch.  This
  // is OK.
  const operatorMatchers = Object.keys(valueSelector).map(operator => {
    const operand = valueSelector[operator];
    const simpleRange = ['$lt', '$lte', '$gt', '$gte'].includes(operator) && typeof operand === 'number';
    const simpleEquality = ['$ne', '$eq'].includes(operator) && operand !== Object(operand);
    const simpleInclusion = ['$in', '$nin'].includes(operator) && Array.isArray(operand) && !operand.some(x => x === Object(x));

    if (!(simpleRange || simpleInclusion || simpleEquality)) {
      matcher._isSimple = false;
    }

    if (hasOwn.call(VALUE_OPERATORS, operator)) {
      return VALUE_OPERATORS[operator](operand, valueSelector, matcher, isRoot);
    }

    if (hasOwn.call(ELEMENT_OPERATORS, operator)) {
      const options = ELEMENT_OPERATORS[operator];
      return convertElementMatcherToBranchedMatcher(options.compileElementSelector(operand, valueSelector, matcher), options);
    }

    throw new Error(`Unrecognized operator: ${operator}`);
  });
  return andBranchedMatchers(operatorMatchers);
} // paths - Array: list of mongo style paths
// newLeafFn - Function: of form function(path) should return a scalar value to
//                       put into list created for that path
// conflictFn - Function: of form function(node, path, fullPath) is called
//                        when building a tree path for 'fullPath' node on
//                        'path' was already a leaf with a value. Must return a
//                        conflict resolution.
// initial tree - Optional Object: starting tree.
// @returns - Object: tree represented as a set of nested objects


function pathsToTree(paths, newLeafFn, conflictFn, root = {}) {
  paths.forEach(path => {
    const pathArray = path.split('.');
    let tree = root; // use .every just for iteration with break

    const success = pathArray.slice(0, -1).every((key, i) => {
      if (!hasOwn.call(tree, key)) {
        tree[key] = {};
      } else if (tree[key] !== Object(tree[key])) {
        tree[key] = conflictFn(tree[key], pathArray.slice(0, i + 1).join('.'), path); // break out of loop if we are failing for this path

        if (tree[key] !== Object(tree[key])) {
          return false;
        }
      }

      tree = tree[key];
      return true;
    });

    if (success) {
      const lastKey = pathArray[pathArray.length - 1];

      if (hasOwn.call(tree, lastKey)) {
        tree[lastKey] = conflictFn(tree[lastKey], path, path);
      } else {
        tree[lastKey] = newLeafFn(path);
      }
    }
  });
  return root;
}

// Makes sure we get 2 elements array and assume the first one to be x and
// the second one to y no matter what user passes.
// In case user passes { lon: x, lat: y } returns [x, y]
function pointToArray(point) {
  return Array.isArray(point) ? point.slice() : [point.x, point.y];
} // Creating a document from an upsert is quite tricky.
// E.g. this selector: {"$or": [{"b.foo": {"$all": ["bar"]}}]}, should result
// in: {"b.foo": "bar"}
// But this selector: {"$or": [{"b": {"foo": {"$all": ["bar"]}}}]} should throw
// an error
// Some rules (found mainly with trial & error, so there might be more):
// - handle all childs of $and (or implicit $and)
// - handle $or nodes with exactly 1 child
// - ignore $or nodes with more than 1 child
// - ignore $nor and $not nodes
// - throw when a value can not be set unambiguously
// - every value for $all should be dealt with as separate $eq-s
// - threat all children of $all as $eq setters (=> set if $all.length === 1,
//   otherwise throw error)
// - you can not mix '$'-prefixed keys and non-'$'-prefixed keys
// - you can only have dotted keys on a root-level
// - you can not have '$'-prefixed keys more than one-level deep in an object
// Handles one key/value pair to put in the selector document


function populateDocumentWithKeyValue(document, key, value) {
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    populateDocumentWithObject(document, key, value);
  } else if (!(value instanceof RegExp)) {
    insertIntoDocument(document, key, value);
  }
} // Handles a key, value pair to put in the selector document
// if the value is an object


function populateDocumentWithObject(document, key, value) {
  const keys = Object.keys(value);
  const unprefixedKeys = keys.filter(op => op[0] !== '$');

  if (unprefixedKeys.length > 0 || !keys.length) {
    // Literal (possibly empty) object ( or empty object )
    // Don't allow mixing '$'-prefixed with non-'$'-prefixed fields
    if (keys.length !== unprefixedKeys.length) {
      throw new Error(`unknown operator: ${unprefixedKeys[0]}`);
    }

    validateObject(value, key);
    insertIntoDocument(document, key, value);
  } else {
    Object.keys(value).forEach(op => {
      const object = value[op];

      if (op === '$eq') {
        populateDocumentWithKeyValue(document, key, object);
      } else if (op === '$all') {
        // every value for $all should be dealt with as separate $eq-s
        object.forEach(element => populateDocumentWithKeyValue(document, key, element));
      }
    });
  }
} // Fills a document with certain fields from an upsert selector


function populateDocumentWithQueryFields(query, document = {}) {
  if (Object.getPrototypeOf(query) === Object.prototype) {
    // handle implicit $and
    Object.keys(query).forEach(key => {
      const value = query[key];

      if (key === '$and') {
        // handle explicit $and
        value.forEach(element => populateDocumentWithQueryFields(element, document));
      } else if (key === '$or') {
        // handle $or nodes with exactly 1 child
        if (value.length === 1) {
          populateDocumentWithQueryFields(value[0], document);
        }
      } else if (key[0] !== '$') {
        // Ignore other '$'-prefixed logical selectors
        populateDocumentWithKeyValue(document, key, value);
      }
    });
  } else {
    // Handle meteor-specific shortcut for selecting _id
    if (LocalCollection._selectorIsId(query)) {
      insertIntoDocument(document, '_id', query);
    }
  }

  return document;
}

function projectionDetails(fields) {
  // Find the non-_id keys (_id is handled specially because it is included
  // unless explicitly excluded). Sort the keys, so that our code to detect
  // overlaps like 'foo' and 'foo.bar' can assume that 'foo' comes first.
  let fieldsKeys = Object.keys(fields).sort(); // If _id is the only field in the projection, do not remove it, since it is
  // required to determine if this is an exclusion or exclusion. Also keep an
  // inclusive _id, since inclusive _id follows the normal rules about mixing
  // inclusive and exclusive fields. If _id is not the only field in the
  // projection and is exclusive, remove it so it can be handled later by a
  // special case, since exclusive _id is always allowed.

  if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id)) {
    fieldsKeys = fieldsKeys.filter(key => key !== '_id');
  }

  let including = null; // Unknown

  fieldsKeys.forEach(keyPath => {
    const rule = !!fields[keyPath];

    if (including === null) {
      including = rule;
    } // This error message is copied from MongoDB shell


    if (including !== rule) {
      throw MinimongoError('You cannot currently mix including and excluding fields.');
    }
  });
  const projectionRulesTree = pathsToTree(fieldsKeys, path => including, (node, path, fullPath) => {
    // Check passed projection fields' keys: If you have two rules such as
    // 'foo.bar' and 'foo.bar.baz', then the result becomes ambiguous. If
    // that happens, there is a probability you are doing something wrong,
    // framework should notify you about such mistake earlier on cursor
    // compilation step than later during runtime.  Note, that real mongo
    // doesn't do anything about it and the later rule appears in projection
    // project, more priority it takes.
    //
    // Example, assume following in mongo shell:
    // > db.coll.insert({ a: { b: 23, c: 44 } })
    // > db.coll.find({}, { 'a': 1, 'a.b': 1 })
    // {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23}}
    // > db.coll.find({}, { 'a.b': 1, 'a': 1 })
    // {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23, "c": 44}}
    //
    // Note, how second time the return set of keys is different.
    const currentPath = fullPath;
    const anotherPath = path;
    throw MinimongoError(`both ${currentPath} and ${anotherPath} found in fields option, ` + 'using both of them may trigger unexpected behavior. Did you mean to ' + 'use only one of them?');
  });
  return {
    including,
    tree: projectionRulesTree
  };
}

function regexpElementMatcher(regexp) {
  return value => {
    if (value instanceof RegExp) {
      return value.toString() === regexp.toString();
    } // Regexps only work against strings.


    if (typeof value !== 'string') {
      return false;
    } // Reset regexp's state to avoid inconsistent matching for objects with the
    // same value on consecutive calls of regexp.test. This happens only if the
    // regexp has the 'g' flag. Also note that ES6 introduces a new flag 'y' for
    // which we should *not* change the lastIndex but MongoDB doesn't support
    // either of these flags.


    regexp.lastIndex = 0;
    return regexp.test(value);
  };
}

// Validates the key in a path.
// Objects that are nested more then 1 level cannot have dotted fields
// or fields starting with '$'
function validateKeyInPath(key, path) {
  if (key.includes('.')) {
    throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
  }

  if (key[0] === '$') {
    throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
  }
} // Recursively validates an object that is nested more than one level deep


function validateObject(object, path) {
  if (object && Object.getPrototypeOf(object) === Object.prototype) {
    Object.keys(object).forEach(key => {
      validateKeyInPath(key, path);
      validateObject(object[key], path + '.' + key);
    });
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/cursor.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => Cursor
});
let LocalCollection;
module.watch(require("./local_collection.js"), {
  default(v) {
    LocalCollection = v;
  }

}, 0);
let hasOwn;
module.watch(require("./common.js"), {
  hasOwn(v) {
    hasOwn = v;
  }

}, 1);

class Cursor {
  // don't call this ctor directly.  use LocalCollection.find().
  constructor(collection, selector, options = {}) {
    this.collection = collection;
    this.sorter = null;
    this.matcher = new Minimongo.Matcher(selector);

    if (LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
      // stash for fast _id and { _id }
      this._selectorId = hasOwn.call(selector, '_id') ? selector._id : selector;
    } else {
      this._selectorId = undefined;

      if (this.matcher.hasGeoQuery() || options.sort) {
        this.sorter = new Minimongo.Sorter(options.sort || [], {
          matcher: this.matcher
        });
      }
    }

    this.skip = options.skip || 0;
    this.limit = options.limit;
    this.fields = options.fields;
    this._projectionFn = LocalCollection._compileProjection(this.fields || {});
    this._transform = LocalCollection.wrapTransform(options.transform); // by default, queries register w/ Tracker when it is available.

    if (typeof Tracker !== 'undefined') {
      this.reactive = options.reactive === undefined ? true : options.reactive;
    }
  }
  /**
   * @summary Returns the number of documents that match a query.
   * @memberOf Mongo.Cursor
   * @method  count
   * @param {boolean} [applySkipLimit=true] If set to `false`, the value
   *                                         returned will reflect the total
   *                                         number of matching documents,
   *                                         ignoring any value supplied for
   *                                         limit
   * @instance
   * @locus Anywhere
   * @returns {Number}
   */


  count(applySkipLimit = true) {
    if (this.reactive) {
      // allow the observe to be unordered
      this._depend({
        added: true,
        removed: true
      }, true);
    }

    return this._getRawObjects({
      ordered: true,
      applySkipLimit
    }).length;
  }
  /**
   * @summary Return all matching documents as an Array.
   * @memberOf Mongo.Cursor
   * @method  fetch
   * @instance
   * @locus Anywhere
   * @returns {Object[]}
   */


  fetch() {
    const result = [];
    this.forEach(doc => {
      result.push(doc);
    });
    return result;
  }

  [Symbol.iterator]() {
    if (this.reactive) {
      this._depend({
        addedBefore: true,
        removed: true,
        changed: true,
        movedBefore: true
      });
    }

    let index = 0;

    const objects = this._getRawObjects({
      ordered: true
    });

    return {
      next: () => {
        if (index < objects.length) {
          // This doubles as a clone operation.
          let element = this._projectionFn(objects[index++]);

          if (this._transform) element = this._transform(element);
          return {
            value: element
          };
        }

        return {
          done: true
        };
      }
    };
  }
  /**
   * @callback IterationCallback
   * @param {Object} doc
   * @param {Number} index
   */

  /**
   * @summary Call `callback` once for each matching document, sequentially and
   *          synchronously.
   * @locus Anywhere
   * @method  forEach
   * @instance
   * @memberOf Mongo.Cursor
   * @param {IterationCallback} callback Function to call. It will be called
   *                                     with three arguments: the document, a
   *                                     0-based index, and <em>cursor</em>
   *                                     itself.
   * @param {Any} [thisArg] An object which will be the value of `this` inside
   *                        `callback`.
   */


  forEach(callback, thisArg) {
    if (this.reactive) {
      this._depend({
        addedBefore: true,
        removed: true,
        changed: true,
        movedBefore: true
      });
    }

    this._getRawObjects({
      ordered: true
    }).forEach((element, i) => {
      // This doubles as a clone operation.
      element = this._projectionFn(element);

      if (this._transform) {
        element = this._transform(element);
      }

      callback.call(thisArg, element, i, this);
    });
  }

  getTransform() {
    return this._transform;
  }
  /**
   * @summary Map callback over all matching documents.  Returns an Array.
   * @locus Anywhere
   * @method map
   * @instance
   * @memberOf Mongo.Cursor
   * @param {IterationCallback} callback Function to call. It will be called
   *                                     with three arguments: the document, a
   *                                     0-based index, and <em>cursor</em>
   *                                     itself.
   * @param {Any} [thisArg] An object which will be the value of `this` inside
   *                        `callback`.
   */


  map(callback, thisArg) {
    const result = [];
    this.forEach((doc, i) => {
      result.push(callback.call(thisArg, doc, i, this));
    });
    return result;
  } // options to contain:
  //  * callbacks for observe():
  //    - addedAt (document, atIndex)
  //    - added (document)
  //    - changedAt (newDocument, oldDocument, atIndex)
  //    - changed (newDocument, oldDocument)
  //    - removedAt (document, atIndex)
  //    - removed (document)
  //    - movedTo (document, oldIndex, newIndex)
  //
  // attributes available on returned query handle:
  //  * stop(): end updates
  //  * collection: the collection this query is querying
  //
  // iff x is a returned query handle, (x instanceof
  // LocalCollection.ObserveHandle) is true
  //
  // initial results delivered through added callback
  // XXX maybe callbacks should take a list of objects, to expose transactions?
  // XXX maybe support field limiting (to limit what you're notified on)

  /**
   * @summary Watch a query.  Receive callbacks as the result set changes.
   * @locus Anywhere
   * @memberOf Mongo.Cursor
   * @instance
   * @param {Object} callbacks Functions to call to deliver the result set as it
   *                           changes
   */


  observe(options) {
    return LocalCollection._observeFromObserveChanges(this, options);
  }
  /**
   * @summary Watch a query. Receive callbacks as the result set changes. Only
   *          the differences between the old and new documents are passed to
   *          the callbacks.
   * @locus Anywhere
   * @memberOf Mongo.Cursor
   * @instance
   * @param {Object} callbacks Functions to call to deliver the result set as it
   *                           changes
   */


  observeChanges(options) {
    const ordered = LocalCollection._observeChangesCallbacksAreOrdered(options); // there are several places that assume you aren't combining skip/limit with
    // unordered observe.  eg, update's EJSON.clone, and the "there are several"
    // comment in _modifyAndNotify
    // XXX allow skip/limit with unordered observe


    if (!options._allow_unordered && !ordered && (this.skip || this.limit)) {
      throw new Error("Must use an ordered observe with skip or limit (i.e. 'addedBefore' " + "for observeChanges or 'addedAt' for observe, instead of 'added').");
    }

    if (this.fields && (this.fields._id === 0 || this.fields._id === false)) {
      throw Error('You may not observe a cursor with {fields: {_id: 0}}');
    }

    const distances = this.matcher.hasGeoQuery() && ordered && new LocalCollection._IdMap();
    const query = {
      cursor: this,
      dirty: false,
      distances,
      matcher: this.matcher,
      // not fast pathed
      ordered,
      projectionFn: this._projectionFn,
      resultsSnapshot: null,
      sorter: ordered && this.sorter
    };
    let qid; // Non-reactive queries call added[Before] and then never call anything
    // else.

    if (this.reactive) {
      qid = this.collection.next_qid++;
      this.collection.queries[qid] = query;
    }

    query.results = this._getRawObjects({
      ordered,
      distances: query.distances
    });

    if (this.collection.paused) {
      query.resultsSnapshot = ordered ? [] : new LocalCollection._IdMap();
    } // wrap callbacks we were passed. callbacks only fire when not paused and
    // are never undefined
    // Filters out blacklisted fields according to cursor's projection.
    // XXX wrong place for this?
    // furthermore, callbacks enqueue until the operation we're working on is
    // done.


    const wrapCallback = fn => {
      if (!fn) {
        return () => {};
      }

      const self = this;
      return function ()
      /* args*/
      {
        if (self.collection.paused) {
          return;
        }

        const args = arguments;

        self.collection._observeQueue.queueTask(() => {
          fn.apply(this, args);
        });
      };
    };

    query.added = wrapCallback(options.added);
    query.changed = wrapCallback(options.changed);
    query.removed = wrapCallback(options.removed);

    if (ordered) {
      query.addedBefore = wrapCallback(options.addedBefore);
      query.movedBefore = wrapCallback(options.movedBefore);
    }

    if (!options._suppress_initial && !this.collection.paused) {
      const results = ordered ? query.results : query.results._map;
      Object.keys(results).forEach(key => {
        const doc = results[key];
        const fields = EJSON.clone(doc);
        delete fields._id;

        if (ordered) {
          query.addedBefore(doc._id, this._projectionFn(fields), null);
        }

        query.added(doc._id, this._projectionFn(fields));
      });
    }

    const handle = Object.assign(new LocalCollection.ObserveHandle(), {
      collection: this.collection,
      stop: () => {
        if (this.reactive) {
          delete this.collection.queries[qid];
        }
      }
    });

    if (this.reactive && Tracker.active) {
      // XXX in many cases, the same observe will be recreated when
      // the current autorun is rerun.  we could save work by
      // letting it linger across rerun and potentially get
      // repurposed if the same observe is performed, using logic
      // similar to that of Meteor.subscribe.
      Tracker.onInvalidate(() => {
        handle.stop();
      });
    } // run the observe callbacks resulting from the initial contents
    // before we leave the observe.


    this.collection._observeQueue.drain();

    return handle;
  } // Since we don't actually have a "nextObject" interface, there's really no
  // reason to have a "rewind" interface.  All it did was make multiple calls
  // to fetch/map/forEach return nothing the second time.
  // XXX COMPAT WITH 0.8.1


  rewind() {} // XXX Maybe we need a version of observe that just calls a callback if
  // anything changed.


  _depend(changers, _allow_unordered) {
    if (Tracker.active) {
      const dependency = new Tracker.Dependency();
      const notify = dependency.changed.bind(dependency);
      dependency.depend();
      const options = {
        _allow_unordered,
        _suppress_initial: true
      };
      ['added', 'addedBefore', 'changed', 'movedBefore', 'removed'].forEach(fn => {
        if (changers[fn]) {
          options[fn] = notify;
        }
      }); // observeChanges will stop() when this computation is invalidated

      this.observeChanges(options);
    }
  }

  _getCollectionName() {
    return this.collection.name;
  } // Returns a collection of matching objects, but doesn't deep copy them.
  //
  // If ordered is set, returns a sorted array, respecting sorter, skip, and
  // limit properties of the query provided that options.applySkipLimit is
  // not set to false (#1201). If sorter is falsey, no sort -- you get the
  // natural order.
  //
  // If ordered is not set, returns an object mapping from ID to doc (sorter,
  // skip and limit should not be set).
  //
  // If ordered is set and this cursor is a $near geoquery, then this function
  // will use an _IdMap to track each distance from the $near argument point in
  // order to use it as a sort key. If an _IdMap is passed in the 'distances'
  // argument, this function will clear it and use it for this purpose
  // (otherwise it will just create its own _IdMap). The observeChanges
  // implementation uses this to remember the distances after this function
  // returns.


  _getRawObjects(options = {}) {
    // By default this method will respect skip and limit because .fetch(),
    // .forEach() etc... expect this behaviour. It can be forced to ignore
    // skip and limit by setting applySkipLimit to false (.count() does this,
    // for example)
    const applySkipLimit = options.applySkipLimit !== false; // XXX use OrderedDict instead of array, and make IdMap and OrderedDict
    // compatible

    const results = options.ordered ? [] : new LocalCollection._IdMap(); // fast path for single ID value

    if (this._selectorId !== undefined) {
      // If you have non-zero skip and ask for a single id, you get nothing.
      // This is so it matches the behavior of the '{_id: foo}' path.
      if (applySkipLimit && this.skip) {
        return results;
      }

      const selectedDoc = this.collection._docs.get(this._selectorId);

      if (selectedDoc) {
        if (options.ordered) {
          results.push(selectedDoc);
        } else {
          results.set(this._selectorId, selectedDoc);
        }
      }

      return results;
    } // slow path for arbitrary selector, sort, skip, limit
    // in the observeChanges case, distances is actually part of the "query"
    // (ie, live results set) object.  in other cases, distances is only used
    // inside this function.


    let distances;

    if (this.matcher.hasGeoQuery() && options.ordered) {
      if (options.distances) {
        distances = options.distances;
        distances.clear();
      } else {
        distances = new LocalCollection._IdMap();
      }
    }

    this.collection._docs.forEach((doc, id) => {
      const matchResult = this.matcher.documentMatches(doc);

      if (matchResult.result) {
        if (options.ordered) {
          results.push(doc);

          if (distances && matchResult.distance !== undefined) {
            distances.set(id, matchResult.distance);
          }
        } else {
          results.set(id, doc);
        }
      } // Override to ensure all docs are matched if ignoring skip & limit


      if (!applySkipLimit) {
        return true;
      } // Fast path for limited unsorted queries.
      // XXX 'length' check here seems wrong for ordered


      return !this.limit || this.skip || this.sorter || results.length !== this.limit;
    });

    if (!options.ordered) {
      return results;
    }

    if (this.sorter) {
      results.sort(this.sorter.getComparator({
        distances
      }));
    } // Return the full set of results if there is no skip or limit or if we're
    // ignoring them


    if (!applySkipLimit || !this.limit && !this.skip) {
      return results;
    }

    return results.slice(this.skip, this.limit ? this.limit + this.skip : results.length);
  }

  _publishCursor(subscription) {
    // XXX minimongo should not depend on mongo-livedata!
    if (!Package.mongo) {
      throw new Error('Can\'t publish from Minimongo without the `mongo` package.');
    }

    if (!this.collection.name) {
      throw new Error('Can\'t publish a cursor from a collection without a name.');
    }

    return Package.mongo.Mongo.Collection._publishCursor(this, subscription, this.collection.name);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"local_collection.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/local_collection.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => LocalCollection
});
let Cursor;
module.watch(require("./cursor.js"), {
  default(v) {
    Cursor = v;
  }

}, 0);
let ObserveHandle;
module.watch(require("./observe_handle.js"), {
  default(v) {
    ObserveHandle = v;
  }

}, 1);
let hasOwn, isIndexable, isNumericKey, isOperatorObject, populateDocumentWithQueryFields, projectionDetails;
module.watch(require("./common.js"), {
  hasOwn(v) {
    hasOwn = v;
  },

  isIndexable(v) {
    isIndexable = v;
  },

  isNumericKey(v) {
    isNumericKey = v;
  },

  isOperatorObject(v) {
    isOperatorObject = v;
  },

  populateDocumentWithQueryFields(v) {
    populateDocumentWithQueryFields = v;
  },

  projectionDetails(v) {
    projectionDetails = v;
  }

}, 2);

class LocalCollection {
  constructor(name) {
    this.name = name; // _id -> document (also containing id)

    this._docs = new LocalCollection._IdMap();
    this._observeQueue = new Meteor._SynchronousQueue();
    this.next_qid = 1; // live query id generator
    // qid -> live query object. keys:
    //  ordered: bool. ordered queries have addedBefore/movedBefore callbacks.
    //  results: array (ordered) or object (unordered) of current results
    //    (aliased with this._docs!)
    //  resultsSnapshot: snapshot of results. null if not paused.
    //  cursor: Cursor object for the query.
    //  selector, sorter, (callbacks): functions

    this.queries = Object.create(null); // null if not saving originals; an IdMap from id to original document value
    // if saving originals. See comments before saveOriginals().

    this._savedOriginals = null; // True when observers are paused and we should not send callbacks.

    this.paused = false;
  } // options may include sort, skip, limit, reactive
  // sort may be any of these forms:
  //     {a: 1, b: -1}
  //     [["a", "asc"], ["b", "desc"]]
  //     ["a", ["b", "desc"]]
  //   (in the first form you're beholden to key enumeration order in
  //   your javascript VM)
  //
  // reactive: if given, and false, don't register with Tracker (default
  // is true)
  //
  // XXX possibly should support retrieving a subset of fields? and
  // have it be a hint (ignored on the client, when not copying the
  // doc?)
  //
  // XXX sort does not yet support subkeys ('a.b') .. fix that!
  // XXX add one more sort form: "key"
  // XXX tests


  find(selector, options) {
    // default syntax for everything is to omit the selector argument.
    // but if selector is explicitly passed in as false or undefined, we
    // want a selector that matches nothing.
    if (arguments.length === 0) {
      selector = {};
    }

    return new LocalCollection.Cursor(this, selector, options);
  }

  findOne(selector, options = {}) {
    if (arguments.length === 0) {
      selector = {};
    } // NOTE: by setting limit 1 here, we end up using very inefficient
    // code that recomputes the whole query on each update. The upside is
    // that when you reactively depend on a findOne you only get
    // invalidated when the found object changes, not any object in the
    // collection. Most findOne will be by id, which has a fast path, so
    // this might not be a big deal. In most cases, invalidation causes
    // the called to re-query anyway, so this should be a net performance
    // improvement.


    options.limit = 1;
    return this.find(selector, options).fetch()[0];
  } // XXX possibly enforce that 'undefined' does not appear (we assume
  // this in our handling of null and $exists)


  insert(doc, callback) {
    doc = EJSON.clone(doc);
    assertHasValidFieldNames(doc); // if you really want to use ObjectIDs, set this global.
    // Mongo.Collection specifies its own ids and does not use this code.

    if (!hasOwn.call(doc, '_id')) {
      doc._id = LocalCollection._useOID ? new MongoID.ObjectID() : Random.id();
    }

    const id = doc._id;

    if (this._docs.has(id)) {
      throw MinimongoError(`Duplicate _id '${id}'`);
    }

    this._saveOriginal(id, undefined);

    this._docs.set(id, doc);

    const queriesToRecompute = []; // trigger live queries that match

    Object.keys(this.queries).forEach(qid => {
      const query = this.queries[qid];

      if (query.dirty) {
        return;
      }

      const matchResult = query.matcher.documentMatches(doc);

      if (matchResult.result) {
        if (query.distances && matchResult.distance !== undefined) {
          query.distances.set(id, matchResult.distance);
        }

        if (query.cursor.skip || query.cursor.limit) {
          queriesToRecompute.push(qid);
        } else {
          LocalCollection._insertInResults(query, doc);
        }
      }
    });
    queriesToRecompute.forEach(qid => {
      if (this.queries[qid]) {
        this._recomputeResults(this.queries[qid]);
      }
    });

    this._observeQueue.drain(); // Defer because the caller likely doesn't expect the callback to be run
    // immediately.


    if (callback) {
      Meteor.defer(() => {
        callback(null, id);
      });
    }

    return id;
  } // Pause the observers. No callbacks from observers will fire until
  // 'resumeObservers' is called.


  pauseObservers() {
    // No-op if already paused.
    if (this.paused) {
      return;
    } // Set the 'paused' flag such that new observer messages don't fire.


    this.paused = true; // Take a snapshot of the query results for each query.

    Object.keys(this.queries).forEach(qid => {
      const query = this.queries[qid];
      query.resultsSnapshot = EJSON.clone(query.results);
    });
  }

  remove(selector, callback) {
    // Easy special case: if we're not calling observeChanges callbacks and
    // we're not saving originals and we got asked to remove everything, then
    // just empty everything directly.
    if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
      const result = this._docs.size();

      this._docs.clear();

      Object.keys(this.queries).forEach(qid => {
        const query = this.queries[qid];

        if (query.ordered) {
          query.results = [];
        } else {
          query.results.clear();
        }
      });

      if (callback) {
        Meteor.defer(() => {
          callback(null, result);
        });
      }

      return result;
    }

    const matcher = new Minimongo.Matcher(selector);
    const remove = [];

    this._eachPossiblyMatchingDoc(selector, (doc, id) => {
      if (matcher.documentMatches(doc).result) {
        remove.push(id);
      }
    });

    const queriesToRecompute = [];
    const queryRemove = [];

    for (let i = 0; i < remove.length; i++) {
      const removeId = remove[i];

      const removeDoc = this._docs.get(removeId);

      Object.keys(this.queries).forEach(qid => {
        const query = this.queries[qid];

        if (query.dirty) {
          return;
        }

        if (query.matcher.documentMatches(removeDoc).result) {
          if (query.cursor.skip || query.cursor.limit) {
            queriesToRecompute.push(qid);
          } else {
            queryRemove.push({
              qid,
              doc: removeDoc
            });
          }
        }
      });

      this._saveOriginal(removeId, removeDoc);

      this._docs.remove(removeId);
    } // run live query callbacks _after_ we've removed the documents.


    queryRemove.forEach(remove => {
      const query = this.queries[remove.qid];

      if (query) {
        query.distances && query.distances.remove(remove.doc._id);

        LocalCollection._removeFromResults(query, remove.doc);
      }
    });
    queriesToRecompute.forEach(qid => {
      const query = this.queries[qid];

      if (query) {
        this._recomputeResults(query);
      }
    });

    this._observeQueue.drain();

    const result = remove.length;

    if (callback) {
      Meteor.defer(() => {
        callback(null, result);
      });
    }

    return result;
  } // Resume the observers. Observers immediately receive change
  // notifications to bring them to the current state of the
  // database. Note that this is not just replaying all the changes that
  // happened during the pause, it is a smarter 'coalesced' diff.


  resumeObservers() {
    // No-op if not paused.
    if (!this.paused) {
      return;
    } // Unset the 'paused' flag. Make sure to do this first, otherwise
    // observer methods won't actually fire when we trigger them.


    this.paused = false;
    Object.keys(this.queries).forEach(qid => {
      const query = this.queries[qid];

      if (query.dirty) {
        query.dirty = false; // re-compute results will perform `LocalCollection._diffQueryChanges`
        // automatically.

        this._recomputeResults(query, query.resultsSnapshot);
      } else {
        // Diff the current results against the snapshot and send to observers.
        // pass the query object for its observer callbacks.
        LocalCollection._diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query, {
          projectionFn: query.projectionFn
        });
      }

      query.resultsSnapshot = null;
    });

    this._observeQueue.drain();
  }

  retrieveOriginals() {
    if (!this._savedOriginals) {
      throw new Error('Called retrieveOriginals without saveOriginals');
    }

    const originals = this._savedOriginals;
    this._savedOriginals = null;
    return originals;
  } // To track what documents are affected by a piece of code, call
  // saveOriginals() before it and retrieveOriginals() after it.
  // retrieveOriginals returns an object whose keys are the ids of the documents
  // that were affected since the call to saveOriginals(), and the values are
  // equal to the document's contents at the time of saveOriginals. (In the case
  // of an inserted document, undefined is the value.) You must alternate
  // between calls to saveOriginals() and retrieveOriginals().


  saveOriginals() {
    if (this._savedOriginals) {
      throw new Error('Called saveOriginals twice without retrieveOriginals');
    }

    this._savedOriginals = new LocalCollection._IdMap();
  } // XXX atomicity: if multi is true, and one modification fails, do
  // we rollback the whole operation, or what?


  update(selector, mod, options, callback) {
    if (!callback && options instanceof Function) {
      callback = options;
      options = null;
    }

    if (!options) {
      options = {};
    }

    const matcher = new Minimongo.Matcher(selector, true); // Save the original results of any query that we might need to
    // _recomputeResults on, because _modifyAndNotify will mutate the objects in
    // it. (We don't need to save the original results of paused queries because
    // they already have a resultsSnapshot and we won't be diffing in
    // _recomputeResults.)

    const qidToOriginalResults = {}; // We should only clone each document once, even if it appears in multiple
    // queries

    const docMap = new LocalCollection._IdMap();

    const idsMatched = LocalCollection._idsMatchedBySelector(selector);

    Object.keys(this.queries).forEach(qid => {
      const query = this.queries[qid];

      if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
        // Catch the case of a reactive `count()` on a cursor with skip
        // or limit, which registers an unordered observe. This is a
        // pretty rare case, so we just clone the entire result set with
        // no optimizations for documents that appear in these result
        // sets and other queries.
        if (query.results instanceof LocalCollection._IdMap) {
          qidToOriginalResults[qid] = query.results.clone();
          return;
        }

        if (!(query.results instanceof Array)) {
          throw new Error('Assertion failed: query.results not an array');
        } // Clones a document to be stored in `qidToOriginalResults`
        // because it may be modified before the new and old result sets
        // are diffed. But if we know exactly which document IDs we're
        // going to modify, then we only need to clone those.


        const memoizedCloneIfNeeded = doc => {
          if (docMap.has(doc._id)) {
            return docMap.get(doc._id);
          }

          const docToMemoize = idsMatched && !idsMatched.some(id => EJSON.equals(id, doc._id)) ? doc : EJSON.clone(doc);
          docMap.set(doc._id, docToMemoize);
          return docToMemoize;
        };

        qidToOriginalResults[qid] = query.results.map(memoizedCloneIfNeeded);
      }
    });
    const recomputeQids = {};
    let updateCount = 0;

    this._eachPossiblyMatchingDoc(selector, (doc, id) => {
      const queryResult = matcher.documentMatches(doc);

      if (queryResult.result) {
        // XXX Should we save the original even if mod ends up being a no-op?
        this._saveOriginal(id, doc);

        this._modifyAndNotify(doc, mod, recomputeQids, queryResult.arrayIndices);

        ++updateCount;

        if (!options.multi) {
          return false; // break
        }
      }

      return true;
    });

    Object.keys(recomputeQids).forEach(qid => {
      const query = this.queries[qid];

      if (query) {
        this._recomputeResults(query, qidToOriginalResults[qid]);
      }
    });

    this._observeQueue.drain(); // If we are doing an upsert, and we didn't modify any documents yet, then
    // it's time to do an insert. Figure out what document we are inserting, and
    // generate an id for it.


    let insertedId;

    if (updateCount === 0 && options.upsert) {
      const doc = LocalCollection._createUpsertDocument(selector, mod);

      if (!doc._id && options.insertedId) {
        doc._id = options.insertedId;
      }

      insertedId = this.insert(doc);
      updateCount = 1;
    } // Return the number of affected documents, or in the upsert case, an object
    // containing the number of affected docs and the id of the doc that was
    // inserted, if any.


    let result;

    if (options._returnObject) {
      result = {
        numberAffected: updateCount
      };

      if (insertedId !== undefined) {
        result.insertedId = insertedId;
      }
    } else {
      result = updateCount;
    }

    if (callback) {
      Meteor.defer(() => {
        callback(null, result);
      });
    }

    return result;
  } // A convenience wrapper on update. LocalCollection.upsert(sel, mod) is
  // equivalent to LocalCollection.update(sel, mod, {upsert: true,
  // _returnObject: true}).


  upsert(selector, mod, options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.update(selector, mod, Object.assign({}, options, {
      upsert: true,
      _returnObject: true
    }), callback);
  } // Iterates over a subset of documents that could match selector; calls
  // fn(doc, id) on each of them.  Specifically, if selector specifies
  // specific _id's, it only looks at those.  doc is *not* cloned: it is the
  // same object that is in _docs.


  _eachPossiblyMatchingDoc(selector, fn) {
    const specificIds = LocalCollection._idsMatchedBySelector(selector);

    if (specificIds) {
      specificIds.some(id => {
        const doc = this._docs.get(id);

        if (doc) {
          return fn(doc, id) === false;
        }
      });
    } else {
      this._docs.forEach(fn);
    }
  }

  _modifyAndNotify(doc, mod, recomputeQids, arrayIndices) {
    const matched_before = {};
    Object.keys(this.queries).forEach(qid => {
      const query = this.queries[qid];

      if (query.dirty) {
        return;
      }

      if (query.ordered) {
        matched_before[qid] = query.matcher.documentMatches(doc).result;
      } else {
        // Because we don't support skip or limit (yet) in unordered queries, we
        // can just do a direct lookup.
        matched_before[qid] = query.results.has(doc._id);
      }
    });
    const old_doc = EJSON.clone(doc);

    LocalCollection._modify(doc, mod, {
      arrayIndices
    });

    Object.keys(this.queries).forEach(qid => {
      const query = this.queries[qid];

      if (query.dirty) {
        return;
      }

      const afterMatch = query.matcher.documentMatches(doc);
      const after = afterMatch.result;
      const before = matched_before[qid];

      if (after && query.distances && afterMatch.distance !== undefined) {
        query.distances.set(doc._id, afterMatch.distance);
      }

      if (query.cursor.skip || query.cursor.limit) {
        // We need to recompute any query where the doc may have been in the
        // cursor's window either before or after the update. (Note that if skip
        // or limit is set, "before" and "after" being true do not necessarily
        // mean that the document is in the cursor's output after skip/limit is
        // applied... but if they are false, then the document definitely is NOT
        // in the output. So it's safe to skip recompute if neither before or
        // after are true.)
        if (before || after) {
          recomputeQids[qid] = true;
        }
      } else if (before && !after) {
        LocalCollection._removeFromResults(query, doc);
      } else if (!before && after) {
        LocalCollection._insertInResults(query, doc);
      } else if (before && after) {
        LocalCollection._updateInResults(query, doc, old_doc);
      }
    });
  } // Recomputes the results of a query and runs observe callbacks for the
  // difference between the previous results and the current results (unless
  // paused). Used for skip/limit queries.
  //
  // When this is used by insert or remove, it can just use query.results for
  // the old results (and there's no need to pass in oldResults), because these
  // operations don't mutate the documents in the collection. Update needs to
  // pass in an oldResults which was deep-copied before the modifier was
  // applied.
  //
  // oldResults is guaranteed to be ignored if the query is not paused.


  _recomputeResults(query, oldResults) {
    if (this.paused) {
      // There's no reason to recompute the results now as we're still paused.
      // By flagging the query as "dirty", the recompute will be performed
      // when resumeObservers is called.
      query.dirty = true;
      return;
    }

    if (!this.paused && !oldResults) {
      oldResults = query.results;
    }

    if (query.distances) {
      query.distances.clear();
    }

    query.results = query.cursor._getRawObjects({
      distances: query.distances,
      ordered: query.ordered
    });

    if (!this.paused) {
      LocalCollection._diffQueryChanges(query.ordered, oldResults, query.results, query, {
        projectionFn: query.projectionFn
      });
    }
  }

  _saveOriginal(id, doc) {
    // Are we even trying to save originals?
    if (!this._savedOriginals) {
      return;
    } // Have we previously mutated the original (and so 'doc' is not actually
    // original)?  (Note the 'has' check rather than truth: we store undefined
    // here for inserted docs!)


    if (this._savedOriginals.has(id)) {
      return;
    }

    this._savedOriginals.set(id, EJSON.clone(doc));
  }

}

LocalCollection.Cursor = Cursor;
LocalCollection.ObserveHandle = ObserveHandle; // XXX maybe move these into another ObserveHelpers package or something
// _CachingChangeObserver is an object which receives observeChanges callbacks
// and keeps a cache of the current cursor state up to date in this.docs. Users
// of this class should read the docs field but not modify it. You should pass
// the "applyChange" field as the callbacks to the underlying observeChanges
// call. Optionally, you can specify your own observeChanges callbacks which are
// invoked immediately before the docs field is updated; this object is made
// available as `this` to those callbacks.

LocalCollection._CachingChangeObserver = class _CachingChangeObserver {
  constructor(options = {}) {
    const orderedFromCallbacks = options.callbacks && LocalCollection._observeChangesCallbacksAreOrdered(options.callbacks);

    if (hasOwn.call(options, 'ordered')) {
      this.ordered = options.ordered;

      if (options.callbacks && options.ordered !== orderedFromCallbacks) {
        throw Error('ordered option doesn\'t match callbacks');
      }
    } else if (options.callbacks) {
      this.ordered = orderedFromCallbacks;
    } else {
      throw Error('must provide ordered or callbacks');
    }

    const callbacks = options.callbacks || {};

    if (this.ordered) {
      this.docs = new OrderedDict(MongoID.idStringify);
      this.applyChange = {
        addedBefore: (id, fields, before) => {
          const doc = EJSON.clone(fields);
          doc._id = id;

          if (callbacks.addedBefore) {
            callbacks.addedBefore.call(this, id, fields, before);
          } // This line triggers if we provide added with movedBefore.


          if (callbacks.added) {
            callbacks.added.call(this, id, fields);
          } // XXX could `before` be a falsy ID?  Technically
          // idStringify seems to allow for them -- though
          // OrderedDict won't call stringify on a falsy arg.


          this.docs.putBefore(id, doc, before || null);
        },
        movedBefore: (id, before) => {
          const doc = this.docs.get(id);

          if (callbacks.movedBefore) {
            callbacks.movedBefore.call(this, id, before);
          }

          this.docs.moveBefore(id, before || null);
        }
      };
    } else {
      this.docs = new LocalCollection._IdMap();
      this.applyChange = {
        added: (id, fields) => {
          const doc = EJSON.clone(fields);

          if (callbacks.added) {
            callbacks.added.call(this, id, fields);
          }

          doc._id = id;
          this.docs.set(id, doc);
        }
      };
    } // The methods in _IdMap and OrderedDict used by these callbacks are
    // identical.


    this.applyChange.changed = (id, fields) => {
      const doc = this.docs.get(id);

      if (!doc) {
        throw new Error(`Unknown id for changed: ${id}`);
      }

      if (callbacks.changed) {
        callbacks.changed.call(this, id, EJSON.clone(fields));
      }

      DiffSequence.applyChanges(doc, fields);
    };

    this.applyChange.removed = id => {
      if (callbacks.removed) {
        callbacks.removed.call(this, id);
      }

      this.docs.remove(id);
    };
  }

};
LocalCollection._IdMap = class _IdMap extends IdMap {
  constructor() {
    super(MongoID.idStringify, MongoID.idParse);
  }

}; // Wrap a transform function to return objects that have the _id field
// of the untransformed document. This ensures that subsystems such as
// the observe-sequence package that call `observe` can keep track of
// the documents identities.
//
// - Require that it returns objects
// - If the return value has an _id field, verify that it matches the
//   original _id field
// - If the return value doesn't have an _id field, add it back.

LocalCollection.wrapTransform = transform => {
  if (!transform) {
    return null;
  } // No need to doubly-wrap transforms.


  if (transform.__wrappedTransform__) {
    return transform;
  }

  const wrapped = doc => {
    if (!hasOwn.call(doc, '_id')) {
      // XXX do we ever have a transform on the oplog's collection? because that
      // collection has no _id.
      throw new Error('can only transform documents with _id');
    }

    const id = doc._id; // XXX consider making tracker a weak dependency and checking
    // Package.tracker here

    const transformed = Tracker.nonreactive(() => transform(doc));

    if (!LocalCollection._isPlainObject(transformed)) {
      throw new Error('transform must return object');
    }

    if (hasOwn.call(transformed, '_id')) {
      if (!EJSON.equals(transformed._id, id)) {
        throw new Error('transformed document can\'t have different _id');
      }
    } else {
      transformed._id = id;
    }

    return transformed;
  };

  wrapped.__wrappedTransform__ = true;
  return wrapped;
}; // XXX the sorted-query logic below is laughably inefficient. we'll
// need to come up with a better datastructure for this.
//
// XXX the logic for observing with a skip or a limit is even more
// laughably inefficient. we recompute the whole results every time!
// This binary search puts a value between any equal values, and the first
// lesser value.


LocalCollection._binarySearch = (cmp, array, value) => {
  let first = 0;
  let range = array.length;

  while (range > 0) {
    const halfRange = Math.floor(range / 2);

    if (cmp(value, array[first + halfRange]) >= 0) {
      first += halfRange + 1;
      range -= halfRange + 1;
    } else {
      range = halfRange;
    }
  }

  return first;
};

LocalCollection._checkSupportedProjection = fields => {
  if (fields !== Object(fields) || Array.isArray(fields)) {
    throw MinimongoError('fields option must be an object');
  }

  Object.keys(fields).forEach(keyPath => {
    if (keyPath.split('.').includes('$')) {
      throw MinimongoError('Minimongo doesn\'t support $ operator in projections yet.');
    }

    const value = fields[keyPath];

    if (typeof value === 'object' && ['$elemMatch', '$meta', '$slice'].some(key => hasOwn.call(value, key))) {
      throw MinimongoError('Minimongo doesn\'t support operators in projections yet.');
    }

    if (![1, 0, true, false].includes(value)) {
      throw MinimongoError('Projection values should be one of 1, 0, true, or false');
    }
  });
}; // Knows how to compile a fields projection to a predicate function.
// @returns - Function: a closure that filters out an object according to the
//            fields projection rules:
//            @param obj - Object: MongoDB-styled document
//            @returns - Object: a document with the fields filtered out
//                       according to projection rules. Doesn't retain subfields
//                       of passed argument.


LocalCollection._compileProjection = fields => {
  LocalCollection._checkSupportedProjection(fields);

  const _idProjection = fields._id === undefined ? true : fields._id;

  const details = projectionDetails(fields); // returns transformed doc according to ruleTree

  const transform = (doc, ruleTree) => {
    // Special case for "sets"
    if (Array.isArray(doc)) {
      return doc.map(subdoc => transform(subdoc, ruleTree));
    }

    const result = details.including ? {} : EJSON.clone(doc);
    Object.keys(ruleTree).forEach(key => {
      if (!hasOwn.call(doc, key)) {
        return;
      }

      const rule = ruleTree[key];

      if (rule === Object(rule)) {
        // For sub-objects/subsets we branch
        if (doc[key] === Object(doc[key])) {
          result[key] = transform(doc[key], rule);
        }
      } else if (details.including) {
        // Otherwise we don't even touch this subfield
        result[key] = EJSON.clone(doc[key]);
      } else {
        delete result[key];
      }
    });
    return result;
  };

  return doc => {
    const result = transform(doc, details.tree);

    if (_idProjection && hasOwn.call(doc, '_id')) {
      result._id = doc._id;
    }

    if (!_idProjection && hasOwn.call(result, '_id')) {
      delete result._id;
    }

    return result;
  };
}; // Calculates the document to insert in case we're doing an upsert and the
// selector does not match any elements


LocalCollection._createUpsertDocument = (selector, modifier) => {
  const selectorDocument = populateDocumentWithQueryFields(selector);

  const isModify = LocalCollection._isModificationMod(modifier);

  const newDoc = {};

  if (selectorDocument._id) {
    newDoc._id = selectorDocument._id;
    delete selectorDocument._id;
  } // This double _modify call is made to help with nested properties (see issue
  // #8631). We do this even if it's a replacement for validation purposes (e.g.
  // ambiguous id's)


  LocalCollection._modify(newDoc, {
    $set: selectorDocument
  });

  LocalCollection._modify(newDoc, modifier, {
    isInsert: true
  });

  if (isModify) {
    return newDoc;
  } // Replacement can take _id from query document


  const replacement = Object.assign({}, modifier);

  if (newDoc._id) {
    replacement._id = newDoc._id;
  }

  return replacement;
};

LocalCollection._diffObjects = (left, right, callbacks) => {
  return DiffSequence.diffObjects(left, right, callbacks);
}; // ordered: bool.
// old_results and new_results: collections of documents.
//    if ordered, they are arrays.
//    if unordered, they are IdMaps


LocalCollection._diffQueryChanges = (ordered, oldResults, newResults, observer, options) => DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);

LocalCollection._diffQueryOrderedChanges = (oldResults, newResults, observer, options) => DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);

LocalCollection._diffQueryUnorderedChanges = (oldResults, newResults, observer, options) => DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);

LocalCollection._findInOrderedResults = (query, doc) => {
  if (!query.ordered) {
    throw new Error('Can\'t call _findInOrderedResults on unordered query');
  }

  for (let i = 0; i < query.results.length; i++) {
    if (query.results[i] === doc) {
      return i;
    }
  }

  throw Error('object missing from query');
}; // If this is a selector which explicitly constrains the match by ID to a finite
// number of documents, returns a list of their IDs.  Otherwise returns
// null. Note that the selector may have other restrictions so it may not even
// match those document!  We care about $in and $and since those are generated
// access-controlled update and remove.


LocalCollection._idsMatchedBySelector = selector => {
  // Is the selector just an ID?
  if (LocalCollection._selectorIsId(selector)) {
    return [selector];
  }

  if (!selector) {
    return null;
  } // Do we have an _id clause?


  if (hasOwn.call(selector, '_id')) {
    // Is the _id clause just an ID?
    if (LocalCollection._selectorIsId(selector._id)) {
      return [selector._id];
    } // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?


    if (selector._id && Array.isArray(selector._id.$in) && selector._id.$in.length && selector._id.$in.every(LocalCollection._selectorIsId)) {
      return selector._id.$in;
    }

    return null;
  } // If this is a top-level $and, and any of the clauses constrain their
  // documents, then the whole selector is constrained by any one clause's
  // constraint. (Well, by their intersection, but that seems unlikely.)


  if (Array.isArray(selector.$and)) {
    for (let i = 0; i < selector.$and.length; ++i) {
      const subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);

      if (subIds) {
        return subIds;
      }
    }
  }

  return null;
};

LocalCollection._insertInResults = (query, doc) => {
  const fields = EJSON.clone(doc);
  delete fields._id;

  if (query.ordered) {
    if (!query.sorter) {
      query.addedBefore(doc._id, query.projectionFn(fields), null);
      query.results.push(doc);
    } else {
      const i = LocalCollection._insertInSortedList(query.sorter.getComparator({
        distances: query.distances
      }), query.results, doc);

      let next = query.results[i + 1];

      if (next) {
        next = next._id;
      } else {
        next = null;
      }

      query.addedBefore(doc._id, query.projectionFn(fields), next);
    }

    query.added(doc._id, query.projectionFn(fields));
  } else {
    query.added(doc._id, query.projectionFn(fields));
    query.results.set(doc._id, doc);
  }
};

LocalCollection._insertInSortedList = (cmp, array, value) => {
  if (array.length === 0) {
    array.push(value);
    return 0;
  }

  const i = LocalCollection._binarySearch(cmp, array, value);

  array.splice(i, 0, value);
  return i;
};

LocalCollection._isModificationMod = mod => {
  let isModify = false;
  let isReplace = false;
  Object.keys(mod).forEach(key => {
    if (key.substr(0, 1) === '$') {
      isModify = true;
    } else {
      isReplace = true;
    }
  });

  if (isModify && isReplace) {
    throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
  }

  return isModify;
}; // XXX maybe this should be EJSON.isObject, though EJSON doesn't know about
// RegExp
// XXX note that _type(undefined) === 3!!!!


LocalCollection._isPlainObject = x => {
  return x && LocalCollection._f._type(x) === 3;
}; // XXX need a strategy for passing the binding of $ into this
// function, from the compiled selector
//
// maybe just {key.up.to.just.before.dollarsign: array_index}
//
// XXX atomicity: if one modification fails, do we roll back the whole
// change?
//
// options:
//   - isInsert is set when _modify is being called to compute the document to
//     insert as part of an upsert operation. We use this primarily to figure
//     out when to set the fields in $setOnInsert, if present.


LocalCollection._modify = (doc, modifier, options = {}) => {
  if (!LocalCollection._isPlainObject(modifier)) {
    throw MinimongoError('Modifier must be an object');
  } // Make sure the caller can't mutate our data structures.


  modifier = EJSON.clone(modifier);
  const isModifier = isOperatorObject(modifier);
  const newDoc = isModifier ? EJSON.clone(doc) : modifier;

  if (isModifier) {
    // apply modifiers to the doc.
    Object.keys(modifier).forEach(operator => {
      // Treat $setOnInsert as $set if this is an insert.
      const setOnInsert = options.isInsert && operator === '$setOnInsert';
      const modFunc = MODIFIERS[setOnInsert ? '$set' : operator];
      const operand = modifier[operator];

      if (!modFunc) {
        throw MinimongoError(`Invalid modifier specified ${operator}`);
      }

      Object.keys(operand).forEach(keypath => {
        const arg = operand[keypath];

        if (keypath === '') {
          throw MinimongoError('An empty update path is not valid.');
        }

        const keyparts = keypath.split('.');

        if (!keyparts.every(Boolean)) {
          throw MinimongoError(`The update path '${keypath}' contains an empty field name, ` + 'which is not allowed.');
        }

        const target = findModTarget(newDoc, keyparts, {
          arrayIndices: options.arrayIndices,
          forbidArray: operator === '$rename',
          noCreate: NO_CREATE_MODIFIERS[operator]
        });
        modFunc(target, keyparts.pop(), arg, keypath, newDoc);
      });
    });

    if (doc._id && !EJSON.equals(doc._id, newDoc._id)) {
      throw MinimongoError(`After applying the update to the document {_id: "${doc._id}", ...},` + ' the (immutable) field \'_id\' was found to have been altered to ' + `_id: "${newDoc._id}"`);
    }
  } else {
    if (doc._id && modifier._id && !EJSON.equals(doc._id, modifier._id)) {
      throw MinimongoError(`The _id field cannot be changed from {_id: "${doc._id}"} to ` + `{_id: "${modifier._id}"}`);
    } // replace the whole document


    assertHasValidFieldNames(modifier);
  } // move new document into place.


  Object.keys(doc).forEach(key => {
    // Note: this used to be for (var key in doc) however, this does not
    // work right in Opera. Deleting from a doc while iterating over it
    // would sometimes cause opera to skip some keys.
    if (key !== '_id') {
      delete doc[key];
    }
  });
  Object.keys(newDoc).forEach(key => {
    doc[key] = newDoc[key];
  });
};

LocalCollection._observeFromObserveChanges = (cursor, observeCallbacks) => {
  const transform = cursor.getTransform() || (doc => doc);

  let suppressed = !!observeCallbacks._suppress_initial;
  let observeChangesCallbacks;

  if (LocalCollection._observeCallbacksAreOrdered(observeCallbacks)) {
    // The "_no_indices" option sets all index arguments to -1 and skips the
    // linear scans required to generate them.  This lets observers that don't
    // need absolute indices benefit from the other features of this API --
    // relative order, transforms, and applyChanges -- without the speed hit.
    const indices = !observeCallbacks._no_indices;
    observeChangesCallbacks = {
      addedBefore(id, fields, before) {
        if (suppressed || !(observeCallbacks.addedAt || observeCallbacks.added)) {
          return;
        }

        const doc = transform(Object.assign(fields, {
          _id: id
        }));

        if (observeCallbacks.addedAt) {
          observeCallbacks.addedAt(doc, indices ? before ? this.docs.indexOf(before) : this.docs.size() : -1, before);
        } else {
          observeCallbacks.added(doc);
        }
      },

      changed(id, fields) {
        if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
          return;
        }

        let doc = EJSON.clone(this.docs.get(id));

        if (!doc) {
          throw new Error(`Unknown id for changed: ${id}`);
        }

        const oldDoc = transform(EJSON.clone(doc));
        DiffSequence.applyChanges(doc, fields);

        if (observeCallbacks.changedAt) {
          observeCallbacks.changedAt(transform(doc), oldDoc, indices ? this.docs.indexOf(id) : -1);
        } else {
          observeCallbacks.changed(transform(doc), oldDoc);
        }
      },

      movedBefore(id, before) {
        if (!observeCallbacks.movedTo) {
          return;
        }

        const from = indices ? this.docs.indexOf(id) : -1;
        let to = indices ? before ? this.docs.indexOf(before) : this.docs.size() : -1; // When not moving backwards, adjust for the fact that removing the
        // document slides everything back one slot.

        if (to > from) {
          --to;
        }

        observeCallbacks.movedTo(transform(EJSON.clone(this.docs.get(id))), from, to, before || null);
      },

      removed(id) {
        if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
          return;
        } // technically maybe there should be an EJSON.clone here, but it's about
        // to be removed from this.docs!


        const doc = transform(this.docs.get(id));

        if (observeCallbacks.removedAt) {
          observeCallbacks.removedAt(doc, indices ? this.docs.indexOf(id) : -1);
        } else {
          observeCallbacks.removed(doc);
        }
      }

    };
  } else {
    observeChangesCallbacks = {
      added(id, fields) {
        if (!suppressed && observeCallbacks.added) {
          observeCallbacks.added(transform(Object.assign(fields, {
            _id: id
          })));
        }
      },

      changed(id, fields) {
        if (observeCallbacks.changed) {
          const oldDoc = this.docs.get(id);
          const doc = EJSON.clone(oldDoc);
          DiffSequence.applyChanges(doc, fields);
          observeCallbacks.changed(transform(doc), transform(EJSON.clone(oldDoc)));
        }
      },

      removed(id) {
        if (observeCallbacks.removed) {
          observeCallbacks.removed(transform(this.docs.get(id)));
        }
      }

    };
  }

  const changeObserver = new LocalCollection._CachingChangeObserver({
    callbacks: observeChangesCallbacks
  });
  const handle = cursor.observeChanges(changeObserver.applyChange);
  suppressed = false;
  return handle;
};

LocalCollection._observeCallbacksAreOrdered = callbacks => {
  if (callbacks.added && callbacks.addedAt) {
    throw new Error('Please specify only one of added() and addedAt()');
  }

  if (callbacks.changed && callbacks.changedAt) {
    throw new Error('Please specify only one of changed() and changedAt()');
  }

  if (callbacks.removed && callbacks.removedAt) {
    throw new Error('Please specify only one of removed() and removedAt()');
  }

  return !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);
};

LocalCollection._observeChangesCallbacksAreOrdered = callbacks => {
  if (callbacks.added && callbacks.addedBefore) {
    throw new Error('Please specify only one of added() and addedBefore()');
  }

  return !!(callbacks.addedBefore || callbacks.movedBefore);
};

LocalCollection._removeFromResults = (query, doc) => {
  if (query.ordered) {
    const i = LocalCollection._findInOrderedResults(query, doc);

    query.removed(doc._id);
    query.results.splice(i, 1);
  } else {
    const id = doc._id; // in case callback mutates doc

    query.removed(doc._id);
    query.results.remove(id);
  }
}; // Is this selector just shorthand for lookup by _id?


LocalCollection._selectorIsId = selector => typeof selector === 'number' || typeof selector === 'string' || selector instanceof MongoID.ObjectID; // Is the selector just lookup by _id (shorthand or not)?


LocalCollection._selectorIsIdPerhapsAsObject = selector => LocalCollection._selectorIsId(selector) || LocalCollection._selectorIsId(selector && selector._id) && Object.keys(selector).length === 1;

LocalCollection._updateInResults = (query, doc, old_doc) => {
  if (!EJSON.equals(doc._id, old_doc._id)) {
    throw new Error('Can\'t change a doc\'s _id while updating');
  }

  const projectionFn = query.projectionFn;
  const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));

  if (!query.ordered) {
    if (Object.keys(changedFields).length) {
      query.changed(doc._id, changedFields);
      query.results.set(doc._id, doc);
    }

    return;
  }

  const old_idx = LocalCollection._findInOrderedResults(query, doc);

  if (Object.keys(changedFields).length) {
    query.changed(doc._id, changedFields);
  }

  if (!query.sorter) {
    return;
  } // just take it out and put it back in again, and see if the index changes


  query.results.splice(old_idx, 1);

  const new_idx = LocalCollection._insertInSortedList(query.sorter.getComparator({
    distances: query.distances
  }), query.results, doc);

  if (old_idx !== new_idx) {
    let next = query.results[new_idx + 1];

    if (next) {
      next = next._id;
    } else {
      next = null;
    }

    query.movedBefore && query.movedBefore(doc._id, next);
  }
};

const MODIFIERS = {
  $currentDate(target, field, arg) {
    if (typeof arg === 'object' && hasOwn.call(arg, '$type')) {
      if (arg.$type !== 'date') {
        throw MinimongoError('Minimongo does currently only support the date type in ' + '$currentDate modifiers', {
          field
        });
      }
    } else if (arg !== true) {
      throw MinimongoError('Invalid $currentDate modifier', {
        field
      });
    }

    target[field] = new Date();
  },

  $min(target, field, arg) {
    if (typeof arg !== 'number') {
      throw MinimongoError('Modifier $min allowed for numbers only', {
        field
      });
    }

    if (field in target) {
      if (typeof target[field] !== 'number') {
        throw MinimongoError('Cannot apply $min modifier to non-number', {
          field
        });
      }

      if (target[field] > arg) {
        target[field] = arg;
      }
    } else {
      target[field] = arg;
    }
  },

  $max(target, field, arg) {
    if (typeof arg !== 'number') {
      throw MinimongoError('Modifier $max allowed for numbers only', {
        field
      });
    }

    if (field in target) {
      if (typeof target[field] !== 'number') {
        throw MinimongoError('Cannot apply $max modifier to non-number', {
          field
        });
      }

      if (target[field] < arg) {
        target[field] = arg;
      }
    } else {
      target[field] = arg;
    }
  },

  $inc(target, field, arg) {
    if (typeof arg !== 'number') {
      throw MinimongoError('Modifier $inc allowed for numbers only', {
        field
      });
    }

    if (field in target) {
      if (typeof target[field] !== 'number') {
        throw MinimongoError('Cannot apply $inc modifier to non-number', {
          field
        });
      }

      target[field] += arg;
    } else {
      target[field] = arg;
    }
  },

  $set(target, field, arg) {
    if (target !== Object(target)) {
      // not an array or an object
      const error = MinimongoError('Cannot set property on non-object field', {
        field
      });
      error.setPropertyError = true;
      throw error;
    }

    if (target === null) {
      const error = MinimongoError('Cannot set property on null', {
        field
      });
      error.setPropertyError = true;
      throw error;
    }

    assertHasValidFieldNames(arg);
    target[field] = arg;
  },

  $setOnInsert(target, field, arg) {// converted to `$set` in `_modify`
  },

  $unset(target, field, arg) {
    if (target !== undefined) {
      if (target instanceof Array) {
        if (field in target) {
          target[field] = null;
        }
      } else {
        delete target[field];
      }
    }
  },

  $push(target, field, arg) {
    if (target[field] === undefined) {
      target[field] = [];
    }

    if (!(target[field] instanceof Array)) {
      throw MinimongoError('Cannot apply $push modifier to non-array', {
        field
      });
    }

    if (!(arg && arg.$each)) {
      // Simple mode: not $each
      assertHasValidFieldNames(arg);
      target[field].push(arg);
      return;
    } // Fancy mode: $each (and maybe $slice and $sort and $position)


    const toPush = arg.$each;

    if (!(toPush instanceof Array)) {
      throw MinimongoError('$each must be an array', {
        field
      });
    }

    assertHasValidFieldNames(toPush); // Parse $position

    let position = undefined;

    if ('$position' in arg) {
      if (typeof arg.$position !== 'number') {
        throw MinimongoError('$position must be a numeric value', {
          field
        });
      } // XXX should check to make sure integer


      if (arg.$position < 0) {
        throw MinimongoError('$position in $push must be zero or positive', {
          field
        });
      }

      position = arg.$position;
    } // Parse $slice.


    let slice = undefined;

    if ('$slice' in arg) {
      if (typeof arg.$slice !== 'number') {
        throw MinimongoError('$slice must be a numeric value', {
          field
        });
      } // XXX should check to make sure integer


      slice = arg.$slice;
    } // Parse $sort.


    let sortFunction = undefined;

    if (arg.$sort) {
      if (slice === undefined) {
        throw MinimongoError('$sort requires $slice to be present', {
          field
        });
      } // XXX this allows us to use a $sort whose value is an array, but that's
      // actually an extension of the Node driver, so it won't work
      // server-side. Could be confusing!
      // XXX is it correct that we don't do geo-stuff here?


      sortFunction = new Minimongo.Sorter(arg.$sort).getComparator();
      toPush.forEach(element => {
        if (LocalCollection._f._type(element) !== 3) {
          throw MinimongoError('$push like modifiers using $sort require all elements to be ' + 'objects', {
            field
          });
        }
      });
    } // Actually push.


    if (position === undefined) {
      toPush.forEach(element => {
        target[field].push(element);
      });
    } else {
      const spliceArguments = [position, 0];
      toPush.forEach(element => {
        spliceArguments.push(element);
      });
      target[field].splice(...spliceArguments);
    } // Actually sort.


    if (sortFunction) {
      target[field].sort(sortFunction);
    } // Actually slice.


    if (slice !== undefined) {
      if (slice === 0) {
        target[field] = []; // differs from Array.slice!
      } else if (slice < 0) {
        target[field] = target[field].slice(slice);
      } else {
        target[field] = target[field].slice(0, slice);
      }
    }
  },

  $pushAll(target, field, arg) {
    if (!(typeof arg === 'object' && arg instanceof Array)) {
      throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only');
    }

    assertHasValidFieldNames(arg);
    const toPush = target[field];

    if (toPush === undefined) {
      target[field] = arg;
    } else if (!(toPush instanceof Array)) {
      throw MinimongoError('Cannot apply $pushAll modifier to non-array', {
        field
      });
    } else {
      toPush.push(...arg);
    }
  },

  $addToSet(target, field, arg) {
    let isEach = false;

    if (typeof arg === 'object') {
      // check if first key is '$each'
      const keys = Object.keys(arg);

      if (keys[0] === '$each') {
        isEach = true;
      }
    }

    const values = isEach ? arg.$each : [arg];
    assertHasValidFieldNames(values);
    const toAdd = target[field];

    if (toAdd === undefined) {
      target[field] = values;
    } else if (!(toAdd instanceof Array)) {
      throw MinimongoError('Cannot apply $addToSet modifier to non-array', {
        field
      });
    } else {
      values.forEach(value => {
        if (toAdd.some(element => LocalCollection._f._equal(value, element))) {
          return;
        }

        toAdd.push(value);
      });
    }
  },

  $pop(target, field, arg) {
    if (target === undefined) {
      return;
    }

    const toPop = target[field];

    if (toPop === undefined) {
      return;
    }

    if (!(toPop instanceof Array)) {
      throw MinimongoError('Cannot apply $pop modifier to non-array', {
        field
      });
    }

    if (typeof arg === 'number' && arg < 0) {
      toPop.splice(0, 1);
    } else {
      toPop.pop();
    }
  },

  $pull(target, field, arg) {
    if (target === undefined) {
      return;
    }

    const toPull = target[field];

    if (toPull === undefined) {
      return;
    }

    if (!(toPull instanceof Array)) {
      throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', {
        field
      });
    }

    let out;

    if (arg != null && typeof arg === 'object' && !(arg instanceof Array)) {
      // XXX would be much nicer to compile this once, rather than
      // for each document we modify.. but usually we're not
      // modifying that many documents, so we'll let it slide for
      // now
      // XXX Minimongo.Matcher isn't up for the job, because we need
      // to permit stuff like {$pull: {a: {$gt: 4}}}.. something
      // like {$gt: 4} is not normally a complete selector.
      // same issue as $elemMatch possibly?
      const matcher = new Minimongo.Matcher(arg);
      out = toPull.filter(element => !matcher.documentMatches(element).result);
    } else {
      out = toPull.filter(element => !LocalCollection._f._equal(element, arg));
    }

    target[field] = out;
  },

  $pullAll(target, field, arg) {
    if (!(typeof arg === 'object' && arg instanceof Array)) {
      throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only', {
        field
      });
    }

    if (target === undefined) {
      return;
    }

    const toPull = target[field];

    if (toPull === undefined) {
      return;
    }

    if (!(toPull instanceof Array)) {
      throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', {
        field
      });
    }

    target[field] = toPull.filter(object => !arg.some(element => LocalCollection._f._equal(object, element)));
  },

  $rename(target, field, arg, keypath, doc) {
    // no idea why mongo has this restriction..
    if (keypath === arg) {
      throw MinimongoError('$rename source must differ from target', {
        field
      });
    }

    if (target === null) {
      throw MinimongoError('$rename source field invalid', {
        field
      });
    }

    if (typeof arg !== 'string') {
      throw MinimongoError('$rename target must be a string', {
        field
      });
    }

    if (arg.includes('\0')) {
      // Null bytes are not allowed in Mongo field names
      // https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names
      throw MinimongoError('The \'to\' field for $rename cannot contain an embedded null byte', {
        field
      });
    }

    if (target === undefined) {
      return;
    }

    const object = target[field];
    delete target[field];
    const keyparts = arg.split('.');
    const target2 = findModTarget(doc, keyparts, {
      forbidArray: true
    });

    if (target2 === null) {
      throw MinimongoError('$rename target field invalid', {
        field
      });
    }

    target2[keyparts.pop()] = object;
  },

  $bit(target, field, arg) {
    // XXX mongo only supports $bit on integers, and we only support
    // native javascript numbers (doubles) so far, so we can't support $bit
    throw MinimongoError('$bit is not supported', {
      field
    });
  },

  $v() {// As discussed in https://github.com/meteor/meteor/issues/9623,
    // the `$v` operator is not needed by Meteor, but problems can occur if
    // it's not at least callable (as of Mongo >= 3.6). It's defined here as
    // a no-op to work around these problems.
  }

};
const NO_CREATE_MODIFIERS = {
  $pop: true,
  $pull: true,
  $pullAll: true,
  $rename: true,
  $unset: true
}; // Make sure field names do not contain Mongo restricted
// characters ('.', '$', '\0').
// https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names

const invalidCharMsg = {
  $: 'start with \'$\'',
  '.': 'contain \'.\'',
  '\0': 'contain null bytes'
}; // checks if all field names in an object are valid

function assertHasValidFieldNames(doc) {
  if (doc && typeof doc === 'object') {
    JSON.stringify(doc, (key, value) => {
      assertIsValidFieldName(key);
      return value;
    });
  }
}

function assertIsValidFieldName(key) {
  let match;

  if (typeof key === 'string' && (match = key.match(/^\$|\.|\0/))) {
    throw MinimongoError(`Key ${key} must not ${invalidCharMsg[match[0]]}`);
  }
} // for a.b.c.2.d.e, keyparts should be ['a', 'b', 'c', '2', 'd', 'e'],
// and then you would operate on the 'e' property of the returned
// object.
//
// if options.noCreate is falsey, creates intermediate levels of
// structure as necessary, like mkdir -p (and raises an exception if
// that would mean giving a non-numeric property to an array.) if
// options.noCreate is true, return undefined instead.
//
// may modify the last element of keyparts to signal to the caller that it needs
// to use a different value to index into the returned object (for example,
// ['a', '01'] -> ['a', 1]).
//
// if forbidArray is true, return null if the keypath goes through an array.
//
// if options.arrayIndices is set, use its first element for the (first) '$' in
// the path.


function findModTarget(doc, keyparts, options = {}) {
  let usedArrayIndex = false;

  for (let i = 0; i < keyparts.length; i++) {
    const last = i === keyparts.length - 1;
    let keypart = keyparts[i];

    if (!isIndexable(doc)) {
      if (options.noCreate) {
        return undefined;
      }

      const error = MinimongoError(`cannot use the part '${keypart}' to traverse ${doc}`);
      error.setPropertyError = true;
      throw error;
    }

    if (doc instanceof Array) {
      if (options.forbidArray) {
        return null;
      }

      if (keypart === '$') {
        if (usedArrayIndex) {
          throw MinimongoError('Too many positional (i.e. \'$\') elements');
        }

        if (!options.arrayIndices || !options.arrayIndices.length) {
          throw MinimongoError('The positional operator did not find the match needed from the ' + 'query');
        }

        keypart = options.arrayIndices[0];
        usedArrayIndex = true;
      } else if (isNumericKey(keypart)) {
        keypart = parseInt(keypart);
      } else {
        if (options.noCreate) {
          return undefined;
        }

        throw MinimongoError(`can't append to array using string field name [${keypart}]`);
      }

      if (last) {
        keyparts[i] = keypart; // handle 'a.01'
      }

      if (options.noCreate && keypart >= doc.length) {
        return undefined;
      }

      while (doc.length < keypart) {
        doc.push(null);
      }

      if (!last) {
        if (doc.length === keypart) {
          doc.push({});
        } else if (typeof doc[keypart] !== 'object') {
          throw MinimongoError(`can't modify field '${keyparts[i + 1]}' of list value ` + JSON.stringify(doc[keypart]));
        }
      }
    } else {
      assertIsValidFieldName(keypart);

      if (!(keypart in doc)) {
        if (options.noCreate) {
          return undefined;
        }

        if (!last) {
          doc[keypart] = {};
        }
      }
    }

    if (last) {
      return doc;
    }

    doc = doc[keypart];
  } // notreached

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"matcher.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/matcher.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => Matcher
});
let LocalCollection;
module.watch(require("./local_collection.js"), {
  default(v) {
    LocalCollection = v;
  }

}, 0);
let compileDocumentSelector, hasOwn, nothingMatcher;
module.watch(require("./common.js"), {
  compileDocumentSelector(v) {
    compileDocumentSelector = v;
  },

  hasOwn(v) {
    hasOwn = v;
  },

  nothingMatcher(v) {
    nothingMatcher = v;
  }

}, 1);

class Matcher {
  constructor(selector, isUpdate) {
    // A set (object mapping string -> *) of all of the document paths looked
    // at by the selector. Also includes the empty string if it may look at any
    // path (eg, $where).
    this._paths = {}; // Set to true if compilation finds a $near.

    this._hasGeoQuery = false; // Set to true if compilation finds a $where.

    this._hasWhere = false; // Set to false if compilation finds anything other than a simple equality
    // or one or more of '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin' used
    // with scalars as operands.

    this._isSimple = true; // Set to a dummy document which always matches this Matcher. Or set to null
    // if such document is too hard to find.

    this._matchingDocument = undefined; // A clone of the original selector. It may just be a function if the user
    // passed in a function; otherwise is definitely an object (eg, IDs are
    // translated into {_id: ID} first. Used by canBecomeTrueByModifier and
    // Sorter._useWithMatcher.

    this._selector = null;
    this._docMatcher = this._compileSelector(selector); // Set to true if selection is done for an update operation
    // Default is false
    // Used for $near array update (issue #3599)

    this._isUpdate = isUpdate;
  }

  documentMatches(doc) {
    if (doc !== Object(doc)) {
      throw Error('documentMatches needs a document');
    }

    return this._docMatcher(doc);
  }

  hasGeoQuery() {
    return this._hasGeoQuery;
  }

  hasWhere() {
    return this._hasWhere;
  }

  isSimple() {
    return this._isSimple;
  } // Given a selector, return a function that takes one argument, a
  // document. It returns a result object.


  _compileSelector(selector) {
    // you can pass a literal function instead of a selector
    if (selector instanceof Function) {
      this._isSimple = false;
      this._selector = selector;

      this._recordPathUsed('');

      return doc => ({
        result: !!selector.call(doc)
      });
    } // shorthand -- scalar _id


    if (LocalCollection._selectorIsId(selector)) {
      this._selector = {
        _id: selector
      };

      this._recordPathUsed('_id');

      return doc => ({
        result: EJSON.equals(doc._id, selector)
      });
    } // protect against dangerous selectors.  falsey and {_id: falsey} are both
    // likely programmer error, and not what you want, particularly for
    // destructive operations.


    if (!selector || hasOwn.call(selector, '_id') && !selector._id) {
      this._isSimple = false;
      return nothingMatcher;
    } // Top level can't be an array or true or binary.


    if (Array.isArray(selector) || EJSON.isBinary(selector) || typeof selector === 'boolean') {
      throw new Error(`Invalid selector: ${selector}`);
    }

    this._selector = EJSON.clone(selector);
    return compileDocumentSelector(selector, this, {
      isRoot: true
    });
  } // Returns a list of key paths the given selector is looking for. It includes
  // the empty string if there is a $where.


  _getPaths() {
    return Object.keys(this._paths);
  }

  _recordPathUsed(path) {
    this._paths[path] = true;
  }

}

// helpers used by compiled selector code
LocalCollection._f = {
  // XXX for _all and _in, consider building 'inquery' at compile time..
  _type(v) {
    if (typeof v === 'number') {
      return 1;
    }

    if (typeof v === 'string') {
      return 2;
    }

    if (typeof v === 'boolean') {
      return 8;
    }

    if (Array.isArray(v)) {
      return 4;
    }

    if (v === null) {
      return 10;
    } // note that typeof(/x/) === "object"


    if (v instanceof RegExp) {
      return 11;
    }

    if (typeof v === 'function') {
      return 13;
    }

    if (v instanceof Date) {
      return 9;
    }

    if (EJSON.isBinary(v)) {
      return 5;
    }

    if (v instanceof MongoID.ObjectID) {
      return 7;
    } // object


    return 3; // XXX support some/all of these:
    // 14, symbol
    // 15, javascript code with scope
    // 16, 18: 32-bit/64-bit integer
    // 17, timestamp
    // 255, minkey
    // 127, maxkey
  },

  // deep equality test: use for literal document and array matches
  _equal(a, b) {
    return EJSON.equals(a, b, {
      keyOrderSensitive: true
    });
  },

  // maps a type code to a value that can be used to sort values of different
  // types
  _typeorder(t) {
    // http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types
    // XXX what is the correct sort position for Javascript code?
    // ('100' in the matrix below)
    // XXX minkey/maxkey
    return [-1, // (not a type)
    1, // number
    2, // string
    3, // object
    4, // array
    5, // binary
    -1, // deprecated
    6, // ObjectID
    7, // bool
    8, // Date
    0, // null
    9, // RegExp
    -1, // deprecated
    100, // JS code
    2, // deprecated (symbol)
    100, // JS code
    1, // 32-bit int
    8, // Mongo timestamp
    1 // 64-bit int
    ][t];
  },

  // compare two values of unknown type according to BSON ordering
  // semantics. (as an extension, consider 'undefined' to be less than
  // any other value.) return negative if a is less, positive if b is
  // less, or 0 if equal
  _cmp(a, b) {
    if (a === undefined) {
      return b === undefined ? 0 : -1;
    }

    if (b === undefined) {
      return 1;
    }

    let ta = LocalCollection._f._type(a);

    let tb = LocalCollection._f._type(b);

    const oa = LocalCollection._f._typeorder(ta);

    const ob = LocalCollection._f._typeorder(tb);

    if (oa !== ob) {
      return oa < ob ? -1 : 1;
    } // XXX need to implement this if we implement Symbol or integers, or
    // Timestamp


    if (ta !== tb) {
      throw Error('Missing type coercion logic in _cmp');
    }

    if (ta === 7) {
      // ObjectID
      // Convert to string.
      ta = tb = 2;
      a = a.toHexString();
      b = b.toHexString();
    }

    if (ta === 9) {
      // Date
      // Convert to millis.
      ta = tb = 1;
      a = a.getTime();
      b = b.getTime();
    }

    if (ta === 1) // double
      return a - b;
    if (tb === 2) // string
      return a < b ? -1 : a === b ? 0 : 1;

    if (ta === 3) {
      // Object
      // this could be much more efficient in the expected case ...
      const toArray = object => {
        const result = [];
        Object.keys(object).forEach(key => {
          result.push(key, object[key]);
        });
        return result;
      };

      return LocalCollection._f._cmp(toArray(a), toArray(b));
    }

    if (ta === 4) {
      // Array
      for (let i = 0;; i++) {
        if (i === a.length) {
          return i === b.length ? 0 : -1;
        }

        if (i === b.length) {
          return 1;
        }

        const s = LocalCollection._f._cmp(a[i], b[i]);

        if (s !== 0) {
          return s;
        }
      }
    }

    if (ta === 5) {
      // binary
      // Surprisingly, a small binary blob is always less than a large one in
      // Mongo.
      if (a.length !== b.length) {
        return a.length - b.length;
      }

      for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) {
          return -1;
        }

        if (a[i] > b[i]) {
          return 1;
        }
      }

      return 0;
    }

    if (ta === 8) {
      // boolean
      if (a) {
        return b ? 0 : 1;
      }

      return b ? -1 : 0;
    }

    if (ta === 10) // null
      return 0;
    if (ta === 11) // regexp
      throw Error('Sorting not supported on regular expression'); // XXX
    // 13: javascript code
    // 14: symbol
    // 15: javascript code with scope
    // 16: 32-bit integer
    // 17: timestamp
    // 18: 64-bit integer
    // 255: minkey
    // 127: maxkey

    if (ta === 13) // javascript code
      throw Error('Sorting not supported on Javascript code'); // XXX

    throw Error('Unknown type to sort');
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"minimongo_common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/minimongo_common.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LocalCollection_;
module.watch(require("./local_collection.js"), {
  default(v) {
    LocalCollection_ = v;
  }

}, 0);
let Matcher;
module.watch(require("./matcher.js"), {
  default(v) {
    Matcher = v;
  }

}, 1);
let Sorter;
module.watch(require("./sorter.js"), {
  default(v) {
    Sorter = v;
  }

}, 2);
LocalCollection = LocalCollection_;
Minimongo = {
  LocalCollection: LocalCollection_,
  Matcher,
  Sorter
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_handle.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/observe_handle.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => ObserveHandle
});

class ObserveHandle {}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sorter.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/sorter.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => Sorter
});
let ELEMENT_OPERATORS, equalityElementMatcher, expandArraysInBranches, hasOwn, isOperatorObject, makeLookupFunction, regexpElementMatcher;
module.watch(require("./common.js"), {
  ELEMENT_OPERATORS(v) {
    ELEMENT_OPERATORS = v;
  },

  equalityElementMatcher(v) {
    equalityElementMatcher = v;
  },

  expandArraysInBranches(v) {
    expandArraysInBranches = v;
  },

  hasOwn(v) {
    hasOwn = v;
  },

  isOperatorObject(v) {
    isOperatorObject = v;
  },

  makeLookupFunction(v) {
    makeLookupFunction = v;
  },

  regexpElementMatcher(v) {
    regexpElementMatcher = v;
  }

}, 0);

class Sorter {
  constructor(spec, options = {}) {
    this._sortSpecParts = [];
    this._sortFunction = null;

    const addSpecPart = (path, ascending) => {
      if (!path) {
        throw Error('sort keys must be non-empty');
      }

      if (path.charAt(0) === '$') {
        throw Error(`unsupported sort key: ${path}`);
      }

      this._sortSpecParts.push({
        ascending,
        lookup: makeLookupFunction(path, {
          forSort: true
        }),
        path
      });
    };

    if (spec instanceof Array) {
      spec.forEach(element => {
        if (typeof element === 'string') {
          addSpecPart(element, true);
        } else {
          addSpecPart(element[0], element[1] !== 'desc');
        }
      });
    } else if (typeof spec === 'object') {
      Object.keys(spec).forEach(key => {
        addSpecPart(key, spec[key] >= 0);
      });
    } else if (typeof spec === 'function') {
      this._sortFunction = spec;
    } else {
      throw Error(`Bad sort specification: ${JSON.stringify(spec)}`);
    } // If a function is specified for sorting, we skip the rest.


    if (this._sortFunction) {
      return;
    } // To implement affectedByModifier, we piggy-back on top of Matcher's
    // affectedByModifier code; we create a selector that is affected by the
    // same modifiers as this sort order. This is only implemented on the
    // server.


    if (this.affectedByModifier) {
      const selector = {};

      this._sortSpecParts.forEach(spec => {
        selector[spec.path] = 1;
      });

      this._selectorForAffectedByModifier = new Minimongo.Matcher(selector);
    }

    this._keyComparator = composeComparators(this._sortSpecParts.map((spec, i) => this._keyFieldComparator(i))); // If you specify a matcher for this Sorter, _keyFilter may be set to a
    // function which selects whether or not a given "sort key" (tuple of values
    // for the different sort spec fields) is compatible with the selector.

    this._keyFilter = null;

    if (options.matcher) {
      this._useWithMatcher(options.matcher);
    }
  }

  getComparator(options) {
    // If sort is specified or have no distances, just use the comparator from
    // the source specification (which defaults to "everything is equal".
    // issue #3599
    // https://docs.mongodb.com/manual/reference/operator/query/near/#sort-operation
    // sort effectively overrides $near
    if (this._sortSpecParts.length || !options || !options.distances) {
      return this._getBaseComparator();
    }

    const distances = options.distances; // Return a comparator which compares using $near distances.

    return (a, b) => {
      if (!distances.has(a._id)) {
        throw Error(`Missing distance for ${a._id}`);
      }

      if (!distances.has(b._id)) {
        throw Error(`Missing distance for ${b._id}`);
      }

      return distances.get(a._id) - distances.get(b._id);
    };
  } // Takes in two keys: arrays whose lengths match the number of spec
  // parts. Returns negative, 0, or positive based on using the sort spec to
  // compare fields.


  _compareKeys(key1, key2) {
    if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {
      throw Error('Key has wrong length');
    }

    return this._keyComparator(key1, key2);
  } // Iterates over each possible "key" from doc (ie, over each branch), calling
  // 'cb' with the key.


  _generateKeysFromDoc(doc, cb) {
    if (this._sortSpecParts.length === 0) {
      throw new Error('can\'t generate keys without a spec');
    }

    const pathFromIndices = indices => `${indices.join(',')},`;

    let knownPaths = null; // maps index -> ({'' -> value} or {path -> value})

    const valuesByIndexAndPath = this._sortSpecParts.map(spec => {
      // Expand any leaf arrays that we find, and ignore those arrays
      // themselves.  (We never sort based on an array itself.)
      let branches = expandArraysInBranches(spec.lookup(doc), true); // If there are no values for a key (eg, key goes to an empty array),
      // pretend we found one null value.

      if (!branches.length) {
        branches = [{
          value: null
        }];
      }

      const element = Object.create(null);
      let usedPaths = false;
      branches.forEach(branch => {
        if (!branch.arrayIndices) {
          // If there are no array indices for a branch, then it must be the
          // only branch, because the only thing that produces multiple branches
          // is the use of arrays.
          if (branches.length > 1) {
            throw Error('multiple branches but no array used?');
          }

          element[''] = branch.value;
          return;
        }

        usedPaths = true;
        const path = pathFromIndices(branch.arrayIndices);

        if (hasOwn.call(element, path)) {
          throw Error(`duplicate path: ${path}`);
        }

        element[path] = branch.value; // If two sort fields both go into arrays, they have to go into the
        // exact same arrays and we have to find the same paths.  This is
        // roughly the same condition that makes MongoDB throw this strange
        // error message.  eg, the main thing is that if sort spec is {a: 1,
        // b:1} then a and b cannot both be arrays.
        //
        // (In MongoDB it seems to be OK to have {a: 1, 'a.x.y': 1} where 'a'
        // and 'a.x.y' are both arrays, but we don't allow this for now.
        // #NestedArraySort
        // XXX achieve full compatibility here

        if (knownPaths && !hasOwn.call(knownPaths, path)) {
          throw Error('cannot index parallel arrays');
        }
      });

      if (knownPaths) {
        // Similarly to above, paths must match everywhere, unless this is a
        // non-array field.
        if (!hasOwn.call(element, '') && Object.keys(knownPaths).length !== Object.keys(element).length) {
          throw Error('cannot index parallel arrays!');
        }
      } else if (usedPaths) {
        knownPaths = {};
        Object.keys(element).forEach(path => {
          knownPaths[path] = true;
        });
      }

      return element;
    });

    if (!knownPaths) {
      // Easy case: no use of arrays.
      const soleKey = valuesByIndexAndPath.map(values => {
        if (!hasOwn.call(values, '')) {
          throw Error('no value in sole key case?');
        }

        return values[''];
      });
      cb(soleKey);
      return;
    }

    Object.keys(knownPaths).forEach(path => {
      const key = valuesByIndexAndPath.map(values => {
        if (hasOwn.call(values, '')) {
          return values[''];
        }

        if (!hasOwn.call(values, path)) {
          throw Error('missing path?');
        }

        return values[path];
      });
      cb(key);
    });
  } // Returns a comparator that represents the sort specification (but not
  // including a possible geoquery distance tie-breaker).


  _getBaseComparator() {
    if (this._sortFunction) {
      return this._sortFunction;
    } // If we're only sorting on geoquery distance and no specs, just say
    // everything is equal.


    if (!this._sortSpecParts.length) {
      return (doc1, doc2) => 0;
    }

    return (doc1, doc2) => {
      const key1 = this._getMinKeyFromDoc(doc1);

      const key2 = this._getMinKeyFromDoc(doc2);

      return this._compareKeys(key1, key2);
    };
  } // Finds the minimum key from the doc, according to the sort specs.  (We say
  // "minimum" here but this is with respect to the sort spec, so "descending"
  // sort fields mean we're finding the max for that field.)
  //
  // Note that this is NOT "find the minimum value of the first field, the
  // minimum value of the second field, etc"... it's "choose the
  // lexicographically minimum value of the key vector, allowing only keys which
  // you can find along the same paths".  ie, for a doc {a: [{x: 0, y: 5}, {x:
  // 1, y: 3}]} with sort spec {'a.x': 1, 'a.y': 1}, the only keys are [0,5] and
  // [1,3], and the minimum key is [0,5]; notably, [0,3] is NOT a key.


  _getMinKeyFromDoc(doc) {
    let minKey = null;

    this._generateKeysFromDoc(doc, key => {
      if (!this._keyCompatibleWithSelector(key)) {
        return;
      }

      if (minKey === null) {
        minKey = key;
        return;
      }

      if (this._compareKeys(key, minKey) < 0) {
        minKey = key;
      }
    }); // This could happen if our key filter somehow filters out all the keys even
    // though somehow the selector matches.


    if (minKey === null) {
      throw Error('sort selector found no keys in doc?');
    }

    return minKey;
  }

  _getPaths() {
    return this._sortSpecParts.map(part => part.path);
  }

  _keyCompatibleWithSelector(key) {
    return !this._keyFilter || this._keyFilter(key);
  } // Given an index 'i', returns a comparator that compares two key arrays based
  // on field 'i'.


  _keyFieldComparator(i) {
    const invert = !this._sortSpecParts[i].ascending;
    return (key1, key2) => {
      const compare = LocalCollection._f._cmp(key1[i], key2[i]);

      return invert ? -compare : compare;
    };
  } // In MongoDB, if you have documents
  //    {_id: 'x', a: [1, 10]} and
  //    {_id: 'y', a: [5, 15]},
  // then C.find({}, {sort: {a: 1}}) puts x before y (1 comes before 5).
  // But  C.find({a: {$gt: 3}}, {sort: {a: 1}}) puts y before x (1 does not
  // match the selector, and 5 comes before 10).
  //
  // The way this works is pretty subtle!  For example, if the documents
  // are instead {_id: 'x', a: [{x: 1}, {x: 10}]}) and
  //             {_id: 'y', a: [{x: 5}, {x: 15}]}),
  // then C.find({'a.x': {$gt: 3}}, {sort: {'a.x': 1}}) and
  //      C.find({a: {$elemMatch: {x: {$gt: 3}}}}, {sort: {'a.x': 1}})
  // both follow this rule (y before x).  (ie, you do have to apply this
  // through $elemMatch.)
  //
  // So if you pass a matcher to this sorter's constructor, we will attempt to
  // skip sort keys that don't match the selector. The logic here is pretty
  // subtle and undocumented; we've gotten as close as we can figure out based
  // on our understanding of Mongo's behavior.


  _useWithMatcher(matcher) {
    if (this._keyFilter) {
      throw Error('called _useWithMatcher twice?');
    } // If we are only sorting by distance, then we're not going to bother to
    // build a key filter.
    // XXX figure out how geoqueries interact with this stuff


    if (!this._sortSpecParts.length) {
      return;
    }

    const selector = matcher._selector; // If the user just passed a falsey selector to find(),
    // then we can't get a key filter from it.

    if (!selector) {
      return;
    } // If the user just passed a literal function to find(), then we can't get a
    // key filter from it.


    if (selector instanceof Function) {
      return;
    }

    const constraintsByPath = {};

    this._sortSpecParts.forEach(spec => {
      constraintsByPath[spec.path] = [];
    });

    Object.keys(selector).forEach(key => {
      const subSelector = selector[key]; // XXX support $and and $or

      const constraints = constraintsByPath[key];

      if (!constraints) {
        return;
      } // XXX it looks like the real MongoDB implementation isn't "does the
      // regexp match" but "does the value fall into a range named by the
      // literal prefix of the regexp", ie "foo" in /^foo(bar|baz)+/  But
      // "does the regexp match" is a good approximation.


      if (subSelector instanceof RegExp) {
        // As far as we can tell, using either of the options that both we and
        // MongoDB support ('i' and 'm') disables use of the key filter. This
        // makes sense: MongoDB mostly appears to be calculating ranges of an
        // index to use, which means it only cares about regexps that match
        // one range (with a literal prefix), and both 'i' and 'm' prevent the
        // literal prefix of the regexp from actually meaning one range.
        if (subSelector.ignoreCase || subSelector.multiline) {
          return;
        }

        constraints.push(regexpElementMatcher(subSelector));
        return;
      }

      if (isOperatorObject(subSelector)) {
        Object.keys(subSelector).forEach(operator => {
          const operand = subSelector[operator];

          if (['$lt', '$lte', '$gt', '$gte'].includes(operator)) {
            // XXX this depends on us knowing that these operators don't use any
            // of the arguments to compileElementSelector other than operand.
            constraints.push(ELEMENT_OPERATORS[operator].compileElementSelector(operand));
          } // See comments in the RegExp block above.


          if (operator === '$regex' && !subSelector.$options) {
            constraints.push(ELEMENT_OPERATORS.$regex.compileElementSelector(operand, subSelector));
          } // XXX support {$exists: true}, $mod, $type, $in, $elemMatch

        });
        return;
      } // OK, it's an equality thing.


      constraints.push(equalityElementMatcher(subSelector));
    }); // It appears that the first sort field is treated differently from the
    // others; we shouldn't create a key filter unless the first sort field is
    // restricted, though after that point we can restrict the other sort fields
    // or not as we wish.

    if (!constraintsByPath[this._sortSpecParts[0].path].length) {
      return;
    }

    this._keyFilter = key => this._sortSpecParts.every((specPart, index) => constraintsByPath[specPart.path].every(fn => fn(key[index])));
  }

}

// Given an array of comparators
// (functions (a,b)->(negative or positive or zero)), returns a single
// comparator which uses each comparator in order and returns the first
// non-zero value.
function composeComparators(comparatorArray) {
  return (a, b) => {
    for (let i = 0; i < comparatorArray.length; ++i) {
      const compare = comparatorArray[i](a, b);

      if (compare !== 0) {
        return compare;
      }
    }

    return 0;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/minimongo/minimongo_server.js");

/* Exports */
Package._define("minimongo", exports, {
  LocalCollection: LocalCollection,
  Minimongo: Minimongo,
  MinimongoTest: MinimongoTest,
  MinimongoError: MinimongoError
});

})();

//# sourceURL=meteor://💻app/packages/minimongo.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaW1vbmdvL21pbmltb25nb19zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9jdXJzb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9sb2NhbF9jb2xsZWN0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9taW5pbW9uZ28vbWF0Y2hlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaW1vbmdvL21pbmltb25nb19jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9vYnNlcnZlX2hhbmRsZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaW1vbmdvL3NvcnRlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJoYXNPd24iLCJpc051bWVyaWNLZXkiLCJpc09wZXJhdG9yT2JqZWN0IiwicGF0aHNUb1RyZWUiLCJwcm9qZWN0aW9uRGV0YWlscyIsInYiLCJNaW5pbW9uZ28iLCJfcGF0aHNFbGlkaW5nTnVtZXJpY0tleXMiLCJwYXRocyIsIm1hcCIsInBhdGgiLCJzcGxpdCIsImZpbHRlciIsInBhcnQiLCJqb2luIiwiTWF0Y2hlciIsInByb3RvdHlwZSIsImFmZmVjdGVkQnlNb2RpZmllciIsIm1vZGlmaWVyIiwiT2JqZWN0IiwiYXNzaWduIiwiJHNldCIsIiR1bnNldCIsIm1lYW5pbmdmdWxQYXRocyIsIl9nZXRQYXRocyIsIm1vZGlmaWVkUGF0aHMiLCJjb25jYXQiLCJrZXlzIiwic29tZSIsIm1vZCIsIm1lYW5pbmdmdWxQYXRoIiwic2VsIiwiaSIsImoiLCJsZW5ndGgiLCJjYW5CZWNvbWVUcnVlQnlNb2RpZmllciIsImlzU2ltcGxlIiwibW9kaWZpZXJQYXRocyIsInBhdGhIYXNOdW1lcmljS2V5cyIsImV4cGVjdGVkU2NhbGFySXNPYmplY3QiLCJfc2VsZWN0b3IiLCJtb2RpZmllclBhdGgiLCJzdGFydHNXaXRoIiwibWF0Y2hpbmdEb2N1bWVudCIsIkVKU09OIiwiY2xvbmUiLCJMb2NhbENvbGxlY3Rpb24iLCJfbW9kaWZ5IiwiZXJyb3IiLCJuYW1lIiwic2V0UHJvcGVydHlFcnJvciIsImRvY3VtZW50TWF0Y2hlcyIsInJlc3VsdCIsImNvbWJpbmVJbnRvUHJvamVjdGlvbiIsInByb2plY3Rpb24iLCJzZWxlY3RvclBhdGhzIiwiaW5jbHVkZXMiLCJjb21iaW5lSW1wb3J0YW50UGF0aHNJbnRvUHJvamVjdGlvbiIsIl9tYXRjaGluZ0RvY3VtZW50IiwidW5kZWZpbmVkIiwiZmFsbGJhY2siLCJ2YWx1ZVNlbGVjdG9yIiwiJGVxIiwiJGluIiwibWF0Y2hlciIsInBsYWNlaG9sZGVyIiwiZmluZCIsIm9ubHlDb250YWluc0tleXMiLCJsb3dlckJvdW5kIiwiSW5maW5pdHkiLCJ1cHBlckJvdW5kIiwiZm9yRWFjaCIsIm9wIiwiY2FsbCIsIm1pZGRsZSIsIngiLCJTb3J0ZXIiLCJfc2VsZWN0b3JGb3JBZmZlY3RlZEJ5TW9kaWZpZXIiLCJkZXRhaWxzIiwidHJlZSIsIm5vZGUiLCJmdWxsUGF0aCIsIm1lcmdlZFByb2plY3Rpb24iLCJ0cmVlVG9QYXRocyIsImluY2x1ZGluZyIsIm1lcmdlZEV4Y2xQcm9qZWN0aW9uIiwiZ2V0UGF0aHMiLCJzZWxlY3RvciIsIl9wYXRocyIsIm9iaiIsImV2ZXJ5IiwiayIsInByZWZpeCIsImtleSIsInZhbHVlIiwiZXhwb3J0IiwiRUxFTUVOVF9PUEVSQVRPUlMiLCJjb21waWxlRG9jdW1lbnRTZWxlY3RvciIsImVxdWFsaXR5RWxlbWVudE1hdGNoZXIiLCJleHBhbmRBcnJheXNJbkJyYW5jaGVzIiwiaXNJbmRleGFibGUiLCJtYWtlTG9va3VwRnVuY3Rpb24iLCJub3RoaW5nTWF0Y2hlciIsInBvcHVsYXRlRG9jdW1lbnRXaXRoUXVlcnlGaWVsZHMiLCJyZWdleHBFbGVtZW50TWF0Y2hlciIsImRlZmF1bHQiLCJoYXNPd25Qcm9wZXJ0eSIsIiRsdCIsIm1ha2VJbmVxdWFsaXR5IiwiY21wVmFsdWUiLCIkZ3QiLCIkbHRlIiwiJGd0ZSIsIiRtb2QiLCJjb21waWxlRWxlbWVudFNlbGVjdG9yIiwib3BlcmFuZCIsIkFycmF5IiwiaXNBcnJheSIsIkVycm9yIiwiZGl2aXNvciIsInJlbWFpbmRlciIsImVsZW1lbnRNYXRjaGVycyIsIm9wdGlvbiIsIlJlZ0V4cCIsIiRzaXplIiwiZG9udEV4cGFuZExlYWZBcnJheXMiLCIkdHlwZSIsImRvbnRJbmNsdWRlTGVhZkFycmF5cyIsIm9wZXJhbmRBbGlhc01hcCIsIl9mIiwiX3R5cGUiLCIkYml0c0FsbFNldCIsIm1hc2siLCJnZXRPcGVyYW5kQml0bWFzayIsImJpdG1hc2siLCJnZXRWYWx1ZUJpdG1hc2siLCJieXRlIiwiJGJpdHNBbnlTZXQiLCIkYml0c0FsbENsZWFyIiwiJGJpdHNBbnlDbGVhciIsIiRyZWdleCIsInJlZ2V4cCIsIiRvcHRpb25zIiwidGVzdCIsInNvdXJjZSIsIiRlbGVtTWF0Y2giLCJfaXNQbGFpbk9iamVjdCIsImlzRG9jTWF0Y2hlciIsIkxPR0lDQUxfT1BFUkFUT1JTIiwicmVkdWNlIiwiYSIsImIiLCJzdWJNYXRjaGVyIiwiaW5FbGVtTWF0Y2giLCJjb21waWxlVmFsdWVTZWxlY3RvciIsImFycmF5RWxlbWVudCIsImFyZyIsImRvbnRJdGVyYXRlIiwiJGFuZCIsInN1YlNlbGVjdG9yIiwiYW5kRG9jdW1lbnRNYXRjaGVycyIsImNvbXBpbGVBcnJheU9mRG9jdW1lbnRTZWxlY3RvcnMiLCIkb3IiLCJtYXRjaGVycyIsImRvYyIsImZuIiwiJG5vciIsIiR3aGVyZSIsInNlbGVjdG9yVmFsdWUiLCJfcmVjb3JkUGF0aFVzZWQiLCJfaGFzV2hlcmUiLCJGdW5jdGlvbiIsIiRjb21tZW50IiwiVkFMVUVfT1BFUkFUT1JTIiwiY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIiLCIkbm90IiwiaW52ZXJ0QnJhbmNoZWRNYXRjaGVyIiwiJG5lIiwiJG5pbiIsIiRleGlzdHMiLCJleGlzdHMiLCJldmVyeXRoaW5nTWF0Y2hlciIsIiRtYXhEaXN0YW5jZSIsIiRuZWFyIiwiJGFsbCIsImJyYW5jaGVkTWF0Y2hlcnMiLCJjcml0ZXJpb24iLCJhbmRCcmFuY2hlZE1hdGNoZXJzIiwiaXNSb290IiwiX2hhc0dlb1F1ZXJ5IiwibWF4RGlzdGFuY2UiLCJwb2ludCIsImRpc3RhbmNlIiwiJGdlb21ldHJ5IiwidHlwZSIsIkdlb0pTT04iLCJwb2ludERpc3RhbmNlIiwiY29vcmRpbmF0ZXMiLCJwb2ludFRvQXJyYXkiLCJnZW9tZXRyeVdpdGhpblJhZGl1cyIsImRpc3RhbmNlQ29vcmRpbmF0ZVBhaXJzIiwiYnJhbmNoZWRWYWx1ZXMiLCJicmFuY2giLCJjdXJEaXN0YW5jZSIsIl9pc1VwZGF0ZSIsImFycmF5SW5kaWNlcyIsImFuZFNvbWVNYXRjaGVycyIsInN1Yk1hdGNoZXJzIiwiZG9jT3JCcmFuY2hlcyIsIm1hdGNoIiwic3ViUmVzdWx0Iiwic2VsZWN0b3JzIiwiZG9jU2VsZWN0b3IiLCJvcHRpb25zIiwiZG9jTWF0Y2hlcnMiLCJzdWJzdHIiLCJfaXNTaW1wbGUiLCJsb29rVXBCeUluZGV4IiwidmFsdWVNYXRjaGVyIiwiQm9vbGVhbiIsIm9wZXJhdG9yQnJhbmNoZWRNYXRjaGVyIiwiZWxlbWVudE1hdGNoZXIiLCJicmFuY2hlcyIsImV4cGFuZGVkIiwiZWxlbWVudCIsIm1hdGNoZWQiLCJwb2ludEEiLCJwb2ludEIiLCJNYXRoIiwiaHlwb3QiLCJlbGVtZW50U2VsZWN0b3IiLCJfZXF1YWwiLCJkb2NPckJyYW5jaGVkVmFsdWVzIiwic2tpcFRoZUFycmF5cyIsImJyYW5jaGVzT3V0IiwidGhpc0lzQXJyYXkiLCJwdXNoIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwiVWludDhBcnJheSIsIkludDMyQXJyYXkiLCJidWZmZXIiLCJpc0JpbmFyeSIsIkFycmF5QnVmZmVyIiwibWF4IiwidmlldyIsImlzU2FmZUludGVnZXIiLCJVaW50MzJBcnJheSIsIkJZVEVTX1BFUl9FTEVNRU5UIiwiaW5zZXJ0SW50b0RvY3VtZW50IiwiZG9jdW1lbnQiLCJleGlzdGluZ0tleSIsImluZGV4T2YiLCJicmFuY2hlZE1hdGNoZXIiLCJicmFuY2hWYWx1ZXMiLCJzIiwiaW5jb25zaXN0ZW50T0siLCJ0aGVzZUFyZU9wZXJhdG9ycyIsInNlbEtleSIsInRoaXNJc09wZXJhdG9yIiwiSlNPTiIsInN0cmluZ2lmeSIsImNtcFZhbHVlQ29tcGFyYXRvciIsIm9wZXJhbmRUeXBlIiwiX2NtcCIsInBhcnRzIiwiZmlyc3RQYXJ0IiwibG9va3VwUmVzdCIsInNsaWNlIiwib21pdFVubmVjZXNzYXJ5RmllbGRzIiwiZmlyc3RMZXZlbCIsImFwcGVuZFRvUmVzdWx0IiwibW9yZSIsImZvclNvcnQiLCJhcnJheUluZGV4IiwiTWluaW1vbmdvVGVzdCIsIk1pbmltb25nb0Vycm9yIiwibWVzc2FnZSIsImZpZWxkIiwib3BlcmF0b3JNYXRjaGVycyIsIm9wZXJhdG9yIiwic2ltcGxlUmFuZ2UiLCJzaW1wbGVFcXVhbGl0eSIsInNpbXBsZUluY2x1c2lvbiIsIm5ld0xlYWZGbiIsImNvbmZsaWN0Rm4iLCJyb290IiwicGF0aEFycmF5Iiwic3VjY2VzcyIsImxhc3RLZXkiLCJ5IiwicG9wdWxhdGVEb2N1bWVudFdpdGhLZXlWYWx1ZSIsImdldFByb3RvdHlwZU9mIiwicG9wdWxhdGVEb2N1bWVudFdpdGhPYmplY3QiLCJ1bnByZWZpeGVkS2V5cyIsInZhbGlkYXRlT2JqZWN0Iiwib2JqZWN0IiwicXVlcnkiLCJfc2VsZWN0b3JJc0lkIiwiZmllbGRzIiwiZmllbGRzS2V5cyIsInNvcnQiLCJfaWQiLCJrZXlQYXRoIiwicnVsZSIsInByb2plY3Rpb25SdWxlc1RyZWUiLCJjdXJyZW50UGF0aCIsImFub3RoZXJQYXRoIiwidG9TdHJpbmciLCJsYXN0SW5kZXgiLCJ2YWxpZGF0ZUtleUluUGF0aCIsIkN1cnNvciIsImNvbnN0cnVjdG9yIiwiY29sbGVjdGlvbiIsInNvcnRlciIsIl9zZWxlY3RvcklzSWRQZXJoYXBzQXNPYmplY3QiLCJfc2VsZWN0b3JJZCIsImhhc0dlb1F1ZXJ5Iiwic2tpcCIsImxpbWl0IiwiX3Byb2plY3Rpb25GbiIsIl9jb21waWxlUHJvamVjdGlvbiIsIl90cmFuc2Zvcm0iLCJ3cmFwVHJhbnNmb3JtIiwidHJhbnNmb3JtIiwiVHJhY2tlciIsInJlYWN0aXZlIiwiY291bnQiLCJhcHBseVNraXBMaW1pdCIsIl9kZXBlbmQiLCJhZGRlZCIsInJlbW92ZWQiLCJfZ2V0UmF3T2JqZWN0cyIsIm9yZGVyZWQiLCJmZXRjaCIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiYWRkZWRCZWZvcmUiLCJjaGFuZ2VkIiwibW92ZWRCZWZvcmUiLCJpbmRleCIsIm9iamVjdHMiLCJuZXh0IiwiZG9uZSIsImNhbGxiYWNrIiwidGhpc0FyZyIsImdldFRyYW5zZm9ybSIsIm9ic2VydmUiLCJfb2JzZXJ2ZUZyb21PYnNlcnZlQ2hhbmdlcyIsIm9ic2VydmVDaGFuZ2VzIiwiX29ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzQXJlT3JkZXJlZCIsIl9hbGxvd191bm9yZGVyZWQiLCJkaXN0YW5jZXMiLCJfSWRNYXAiLCJjdXJzb3IiLCJkaXJ0eSIsInByb2plY3Rpb25GbiIsInJlc3VsdHNTbmFwc2hvdCIsInFpZCIsIm5leHRfcWlkIiwicXVlcmllcyIsInJlc3VsdHMiLCJwYXVzZWQiLCJ3cmFwQ2FsbGJhY2siLCJzZWxmIiwiYXJncyIsImFyZ3VtZW50cyIsIl9vYnNlcnZlUXVldWUiLCJxdWV1ZVRhc2siLCJhcHBseSIsIl9zdXBwcmVzc19pbml0aWFsIiwiX21hcCIsImhhbmRsZSIsIk9ic2VydmVIYW5kbGUiLCJzdG9wIiwiYWN0aXZlIiwib25JbnZhbGlkYXRlIiwiZHJhaW4iLCJyZXdpbmQiLCJjaGFuZ2VycyIsImRlcGVuZGVuY3kiLCJEZXBlbmRlbmN5Iiwibm90aWZ5IiwiYmluZCIsImRlcGVuZCIsIl9nZXRDb2xsZWN0aW9uTmFtZSIsInNlbGVjdGVkRG9jIiwiX2RvY3MiLCJnZXQiLCJzZXQiLCJjbGVhciIsImlkIiwibWF0Y2hSZXN1bHQiLCJnZXRDb21wYXJhdG9yIiwiX3B1Ymxpc2hDdXJzb3IiLCJzdWJzY3JpcHRpb24iLCJQYWNrYWdlIiwibW9uZ28iLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJNZXRlb3IiLCJfU3luY2hyb25vdXNRdWV1ZSIsImNyZWF0ZSIsIl9zYXZlZE9yaWdpbmFscyIsImZpbmRPbmUiLCJpbnNlcnQiLCJhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXMiLCJfdXNlT0lEIiwiTW9uZ29JRCIsIk9iamVjdElEIiwiUmFuZG9tIiwiaGFzIiwiX3NhdmVPcmlnaW5hbCIsInF1ZXJpZXNUb1JlY29tcHV0ZSIsIl9pbnNlcnRJblJlc3VsdHMiLCJfcmVjb21wdXRlUmVzdWx0cyIsImRlZmVyIiwicGF1c2VPYnNlcnZlcnMiLCJyZW1vdmUiLCJlcXVhbHMiLCJzaXplIiwiX2VhY2hQb3NzaWJseU1hdGNoaW5nRG9jIiwicXVlcnlSZW1vdmUiLCJyZW1vdmVJZCIsInJlbW92ZURvYyIsIl9yZW1vdmVGcm9tUmVzdWx0cyIsInJlc3VtZU9ic2VydmVycyIsIl9kaWZmUXVlcnlDaGFuZ2VzIiwicmV0cmlldmVPcmlnaW5hbHMiLCJvcmlnaW5hbHMiLCJzYXZlT3JpZ2luYWxzIiwidXBkYXRlIiwicWlkVG9PcmlnaW5hbFJlc3VsdHMiLCJkb2NNYXAiLCJpZHNNYXRjaGVkIiwiX2lkc01hdGNoZWRCeVNlbGVjdG9yIiwibWVtb2l6ZWRDbG9uZUlmTmVlZGVkIiwiZG9jVG9NZW1vaXplIiwicmVjb21wdXRlUWlkcyIsInVwZGF0ZUNvdW50IiwicXVlcnlSZXN1bHQiLCJfbW9kaWZ5QW5kTm90aWZ5IiwibXVsdGkiLCJpbnNlcnRlZElkIiwidXBzZXJ0IiwiX2NyZWF0ZVVwc2VydERvY3VtZW50IiwiX3JldHVybk9iamVjdCIsIm51bWJlckFmZmVjdGVkIiwic3BlY2lmaWNJZHMiLCJtYXRjaGVkX2JlZm9yZSIsIm9sZF9kb2MiLCJhZnRlck1hdGNoIiwiYWZ0ZXIiLCJiZWZvcmUiLCJfdXBkYXRlSW5SZXN1bHRzIiwib2xkUmVzdWx0cyIsIl9DYWNoaW5nQ2hhbmdlT2JzZXJ2ZXIiLCJvcmRlcmVkRnJvbUNhbGxiYWNrcyIsImNhbGxiYWNrcyIsImRvY3MiLCJPcmRlcmVkRGljdCIsImlkU3RyaW5naWZ5IiwiYXBwbHlDaGFuZ2UiLCJwdXRCZWZvcmUiLCJtb3ZlQmVmb3JlIiwiRGlmZlNlcXVlbmNlIiwiYXBwbHlDaGFuZ2VzIiwiSWRNYXAiLCJpZFBhcnNlIiwiX193cmFwcGVkVHJhbnNmb3JtX18iLCJ3cmFwcGVkIiwidHJhbnNmb3JtZWQiLCJub25yZWFjdGl2ZSIsIl9iaW5hcnlTZWFyY2giLCJjbXAiLCJhcnJheSIsImZpcnN0IiwicmFuZ2UiLCJoYWxmUmFuZ2UiLCJmbG9vciIsIl9jaGVja1N1cHBvcnRlZFByb2plY3Rpb24iLCJfaWRQcm9qZWN0aW9uIiwicnVsZVRyZWUiLCJzdWJkb2MiLCJzZWxlY3RvckRvY3VtZW50IiwiaXNNb2RpZnkiLCJfaXNNb2RpZmljYXRpb25Nb2QiLCJuZXdEb2MiLCJpc0luc2VydCIsInJlcGxhY2VtZW50IiwiX2RpZmZPYmplY3RzIiwibGVmdCIsInJpZ2h0IiwiZGlmZk9iamVjdHMiLCJuZXdSZXN1bHRzIiwib2JzZXJ2ZXIiLCJkaWZmUXVlcnlDaGFuZ2VzIiwiX2RpZmZRdWVyeU9yZGVyZWRDaGFuZ2VzIiwiZGlmZlF1ZXJ5T3JkZXJlZENoYW5nZXMiLCJfZGlmZlF1ZXJ5VW5vcmRlcmVkQ2hhbmdlcyIsImRpZmZRdWVyeVVub3JkZXJlZENoYW5nZXMiLCJfZmluZEluT3JkZXJlZFJlc3VsdHMiLCJzdWJJZHMiLCJfaW5zZXJ0SW5Tb3J0ZWRMaXN0Iiwic3BsaWNlIiwiaXNSZXBsYWNlIiwiaXNNb2RpZmllciIsInNldE9uSW5zZXJ0IiwibW9kRnVuYyIsIk1PRElGSUVSUyIsImtleXBhdGgiLCJrZXlwYXJ0cyIsInRhcmdldCIsImZpbmRNb2RUYXJnZXQiLCJmb3JiaWRBcnJheSIsIm5vQ3JlYXRlIiwiTk9fQ1JFQVRFX01PRElGSUVSUyIsInBvcCIsIm9ic2VydmVDYWxsYmFja3MiLCJzdXBwcmVzc2VkIiwib2JzZXJ2ZUNoYW5nZXNDYWxsYmFja3MiLCJfb2JzZXJ2ZUNhbGxiYWNrc0FyZU9yZGVyZWQiLCJpbmRpY2VzIiwiX25vX2luZGljZXMiLCJhZGRlZEF0IiwiY2hhbmdlZEF0Iiwib2xkRG9jIiwibW92ZWRUbyIsImZyb20iLCJ0byIsInJlbW92ZWRBdCIsImNoYW5nZU9ic2VydmVyIiwiY2hhbmdlZEZpZWxkcyIsIm1ha2VDaGFuZ2VkRmllbGRzIiwib2xkX2lkeCIsIm5ld19pZHgiLCIkY3VycmVudERhdGUiLCJEYXRlIiwiJG1pbiIsIiRtYXgiLCIkaW5jIiwiJHNldE9uSW5zZXJ0IiwiJHB1c2giLCIkZWFjaCIsInRvUHVzaCIsInBvc2l0aW9uIiwiJHBvc2l0aW9uIiwiJHNsaWNlIiwic29ydEZ1bmN0aW9uIiwiJHNvcnQiLCJzcGxpY2VBcmd1bWVudHMiLCIkcHVzaEFsbCIsIiRhZGRUb1NldCIsImlzRWFjaCIsInZhbHVlcyIsInRvQWRkIiwiJHBvcCIsInRvUG9wIiwiJHB1bGwiLCJ0b1B1bGwiLCJvdXQiLCIkcHVsbEFsbCIsIiRyZW5hbWUiLCJ0YXJnZXQyIiwiJGJpdCIsIiR2IiwiaW52YWxpZENoYXJNc2ciLCIkIiwiYXNzZXJ0SXNWYWxpZEZpZWxkTmFtZSIsInVzZWRBcnJheUluZGV4IiwibGFzdCIsImtleXBhcnQiLCJwYXJzZUludCIsImlzVXBkYXRlIiwiX2RvY01hdGNoZXIiLCJfY29tcGlsZVNlbGVjdG9yIiwiaGFzV2hlcmUiLCJrZXlPcmRlclNlbnNpdGl2ZSIsIl90eXBlb3JkZXIiLCJ0IiwidGEiLCJ0YiIsIm9hIiwib2IiLCJ0b0hleFN0cmluZyIsImdldFRpbWUiLCJ0b0FycmF5IiwiTG9jYWxDb2xsZWN0aW9uXyIsInNwZWMiLCJfc29ydFNwZWNQYXJ0cyIsIl9zb3J0RnVuY3Rpb24iLCJhZGRTcGVjUGFydCIsImFzY2VuZGluZyIsImNoYXJBdCIsImxvb2t1cCIsIl9rZXlDb21wYXJhdG9yIiwiY29tcG9zZUNvbXBhcmF0b3JzIiwiX2tleUZpZWxkQ29tcGFyYXRvciIsIl9rZXlGaWx0ZXIiLCJfdXNlV2l0aE1hdGNoZXIiLCJfZ2V0QmFzZUNvbXBhcmF0b3IiLCJfY29tcGFyZUtleXMiLCJrZXkxIiwia2V5MiIsIl9nZW5lcmF0ZUtleXNGcm9tRG9jIiwiY2IiLCJwYXRoRnJvbUluZGljZXMiLCJrbm93blBhdGhzIiwidmFsdWVzQnlJbmRleEFuZFBhdGgiLCJ1c2VkUGF0aHMiLCJzb2xlS2V5IiwiZG9jMSIsImRvYzIiLCJfZ2V0TWluS2V5RnJvbURvYyIsIm1pbktleSIsIl9rZXlDb21wYXRpYmxlV2l0aFNlbGVjdG9yIiwiaW52ZXJ0IiwiY29tcGFyZSIsImNvbnN0cmFpbnRzQnlQYXRoIiwiY29uc3RyYWludHMiLCJpZ25vcmVDYXNlIiwibXVsdGlsaW5lIiwic3BlY1BhcnQiLCJjb21wYXJhdG9yQXJyYXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFSLENBQWI7QUFBK0MsSUFBSUMsTUFBSixFQUFXQyxZQUFYLEVBQXdCQyxnQkFBeEIsRUFBeUNDLFdBQXpDLEVBQXFEQyxpQkFBckQ7QUFBdUVQLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWIsRUFBb0M7QUFBQ0MsU0FBT0ssQ0FBUCxFQUFTO0FBQUNMLGFBQU9LLENBQVA7QUFBUyxHQUFwQjs7QUFBcUJKLGVBQWFJLENBQWIsRUFBZTtBQUFDSixtQkFBYUksQ0FBYjtBQUFlLEdBQXBEOztBQUFxREgsbUJBQWlCRyxDQUFqQixFQUFtQjtBQUFDSCx1QkFBaUJHLENBQWpCO0FBQW1CLEdBQTVGOztBQUE2RkYsY0FBWUUsQ0FBWixFQUFjO0FBQUNGLGtCQUFZRSxDQUFaO0FBQWMsR0FBMUg7O0FBQTJIRCxv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LFlBQU15a0IsVUFBVU0sZ0JBQWdCL2tCLENBQWhCLEVBQW1Cc0gsQ0FBbkIsRUFBc0JDLENBQXRCLENBQWhCOztBQUNBLFVBQUlrZCxZQUFZLENBQWhCLEVBQW1CO0FBQ2pCLGVBQU9BLE9BQVA7QUFDRDtBQUNGOztBQUVELFdBQU8sQ0FBUDtBQUNELEdBVEQ7QUFVRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9taW5pbW9uZ28uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJy4vbWluaW1vbmdvX2NvbW1vbi5qcyc7XG5pbXBvcnQge1xuICBoYXNPd24sXG4gIGlzTnVtZXJpY0tleSxcbiAgaXNPcGVyYXRvck9iamVjdCxcbiAgcGF0aHNUb1RyZWUsXG4gIHByb2plY3Rpb25EZXRhaWxzLFxufSBmcm9tICcuL2NvbW1vbi5qcyc7XG5cbk1pbmltb25nby5fcGF0aHNFbGlkaW5nTnVtZXJpY0tleXMgPSBwYXRocyA9PiBwYXRocy5tYXAocGF0aCA9PlxuICBwYXRoLnNwbGl0KCcuJykuZmlsdGVyKHBhcnQgPT4gIWlzTnVtZXJpY0tleShwYXJ0KSkuam9pbignLicpXG4pO1xuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIG1vZGlmaWVyIGFwcGxpZWQgdG8gc29tZSBkb2N1bWVudCBtYXkgY2hhbmdlIHRoZSByZXN1bHRcbi8vIG9mIG1hdGNoaW5nIHRoZSBkb2N1bWVudCBieSBzZWxlY3RvclxuLy8gVGhlIG1vZGlmaWVyIGlzIGFsd2F5cyBpbiBhIGZvcm0gb2YgT2JqZWN0OlxuLy8gIC0gJHNldFxuLy8gICAgLSAnYS5iLjIyLnonOiB2YWx1ZVxuLy8gICAgLSAnZm9vLmJhcic6IDQyXG4vLyAgLSAkdW5zZXRcbi8vICAgIC0gJ2FiYy5kJzogMVxuTWluaW1vbmdvLk1hdGNoZXIucHJvdG90eXBlLmFmZmVjdGVkQnlNb2RpZmllciA9IGZ1bmN0aW9uKG1vZGlmaWVyKSB7XG4gIC8vIHNhZmUgY2hlY2sgZm9yICRzZXQvJHVuc2V0IGJlaW5nIG9iamVjdHNcbiAgbW9kaWZpZXIgPSBPYmplY3QuYXNzaWduKHskc2V0OiB7fSwgJHVuc2V0OiB7fX0sIG1vZGlmaWVyKTtcblxuICBjb25zdCBtZWFuaW5nZnVsUGF0aHMgPSB0aGlzLl9nZXRQYXRocygpO1xuICBjb25zdCBtb2RpZmllZFBhdGhzID0gW10uY29uY2F0KFxuICAgIE9iamVjdC5rZXlzKG1vZGlmaWVyLiRzZXQpLFxuICAgIE9iamVjdC5rZXlzKG1vZGlmaWVyLiR1bnNldClcbiAgKTtcblxuICByZXR1cm4gbW9kaWZpZWRQYXRocy5zb21lKHBhdGggPT4ge1xuICAgIGNvbnN0IG1vZCA9IHBhdGguc3BsaXQoJy4nKTtcblxuICAgIHJldHVybiBtZWFuaW5nZnVsUGF0aHMuc29tZShtZWFuaW5nZnVsUGF0aCA9PiB7XG4gICAgICBjb25zdCBzZWwgPSBtZWFuaW5nZnVsUGF0aC5zcGxpdCgnLicpO1xuXG4gICAgICBsZXQgaSA9IDAsIGogPSAwO1xuXG4gICAgICB3aGlsZSAoaSA8IHNlbC5sZW5ndGggJiYgaiA8IG1vZC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGlzTnVtZXJpY0tleShzZWxbaV0pICYmIGlzTnVtZXJpY0tleShtb2Rbal0pKSB7XG4gICAgICAgICAgLy8gZm9vLjQuYmFyIHNlbGVjdG9yIGFmZmVjdGVkIGJ5IGZvby40IG1vZGlmaWVyXG4gICAgICAgICAgLy8gZm9vLjMuYmFyIHNlbGVjdG9yIHVuYWZmZWN0ZWQgYnkgZm9vLjQgbW9kaWZpZXJcbiAgICAgICAgICBpZiAoc2VsW2ldID09PSBtb2Rbal0pIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpc051bWVyaWNLZXkoc2VsW2ldKSkge1xuICAgICAgICAgIC8vIGZvby40LmJhciBzZWxlY3RvciB1bmFmZmVjdGVkIGJ5IGZvby5iYXIgbW9kaWZpZXJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNOdW1lcmljS2V5KG1vZFtqXSkpIHtcbiAgICAgICAgICBqKys7XG4gICAgICAgIH0gZWxzZSBpZiAoc2VsW2ldID09PSBtb2Rbal0pIHtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgaisrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBPbmUgaXMgYSBwcmVmaXggb2YgYW5vdGhlciwgdGFraW5nIG51bWVyaWMgZmllbGRzIGludG8gYWNjb3VudFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLy8gQHBhcmFtIG1vZGlmaWVyIC0gT2JqZWN0OiBNb25nb0RCLXN0eWxlZCBtb2RpZmllciB3aXRoIGAkc2V0YHMgYW5kIGAkdW5zZXRzYFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICBvbmx5LiAoYXNzdW1lZCB0byBjb21lIGZyb20gb3Bsb2cpXG4vLyBAcmV0dXJucyAtIEJvb2xlYW46IGlmIGFmdGVyIGFwcGx5aW5nIHRoZSBtb2RpZmllciwgc2VsZWN0b3IgY2FuIHN0YXJ0XG4vLyAgICAgICAgICAgICAgICAgICAgIGFjY2VwdGluZyB0aGUgbW9kaWZpZWQgdmFsdWUuXG4vLyBOT1RFOiBhc3N1bWVzIHRoYXQgZG9jdW1lbnQgYWZmZWN0ZWQgYnkgbW9kaWZpZXIgZGlkbid0IG1hdGNoIHRoaXMgTWF0Y2hlclxuLy8gYmVmb3JlLCBzbyBpZiBtb2RpZmllciBjYW4ndCBjb252aW5jZSBzZWxlY3RvciBpbiBhIHBvc2l0aXZlIGNoYW5nZSBpdCB3b3VsZFxuLy8gc3RheSAnZmFsc2UnLlxuLy8gQ3VycmVudGx5IGRvZXNuJ3Qgc3VwcG9ydCAkLW9wZXJhdG9ycyBhbmQgbnVtZXJpYyBpbmRpY2VzIHByZWNpc2VseS5cbk1pbmltb25nby5NYXRjaGVyLnByb3RvdHlwZS5jYW5CZWNvbWVUcnVlQnlNb2RpZmllciA9IGZ1bmN0aW9uKG1vZGlmaWVyKSB7XG4gIGlmICghdGhpcy5hZmZlY3RlZEJ5TW9kaWZpZXIobW9kaWZpZXIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCF0aGlzLmlzU2ltcGxlKCkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG1vZGlmaWVyID0gT2JqZWN0LmFzc2lnbih7JHNldDoge30sICR1bnNldDoge319LCBtb2RpZmllcik7XG5cbiAgY29uc3QgbW9kaWZpZXJQYXRocyA9IFtdLmNvbmNhdChcbiAgICBPYmplY3Qua2V5cyhtb2RpZmllci4kc2V0KSxcbiAgICBPYmplY3Qua2V5cyhtb2RpZmllci4kdW5zZXQpXG4gICk7XG5cbiAgaWYgKHRoaXMuX2dldFBhdGhzKCkuc29tZShwYXRoSGFzTnVtZXJpY0tleXMpIHx8XG4gICAgICBtb2RpZmllclBhdGhzLnNvbWUocGF0aEhhc051bWVyaWNLZXlzKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgYSAkc2V0IG9yICR1bnNldCB0aGF0IGluZGljYXRlcyBzb21ldGhpbmcgaXMgYW5cbiAgLy8gb2JqZWN0IHJhdGhlciB0aGFuIGEgc2NhbGFyIGluIHRoZSBhY3R1YWwgb2JqZWN0IHdoZXJlIHdlIHNhdyAkLW9wZXJhdG9yXG4gIC8vIE5PVEU6IGl0IGlzIGNvcnJlY3Qgc2luY2Ugd2UgYWxsb3cgb25seSBzY2FsYXJzIGluICQtb3BlcmF0b3JzXG4gIC8vIEV4YW1wbGU6IGZvciBzZWxlY3RvciB7J2EuYic6IHskZ3Q6IDV9fSB0aGUgbW9kaWZpZXIgeydhLmIuYyc6N30gd291bGRcbiAgLy8gZGVmaW5pdGVseSBzZXQgdGhlIHJlc3VsdCB0byBmYWxzZSBhcyAnYS5iJyBhcHBlYXJzIHRvIGJlIGFuIG9iamVjdC5cbiAgY29uc3QgZXhwZWN0ZWRTY2FsYXJJc09iamVjdCA9IE9iamVjdC5rZXlzKHRoaXMuX3NlbGVjdG9yKS5zb21lKHBhdGggPT4ge1xuICAgIGlmICghaXNPcGVyYXRvck9iamVjdCh0aGlzLl9zZWxlY3RvcltwYXRoXSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW9kaWZpZXJQYXRocy5zb21lKG1vZGlmaWVyUGF0aCA9PlxuICAgICAgbW9kaWZpZXJQYXRoLnN0YXJ0c1dpdGgoYCR7cGF0aH0uYClcbiAgICApO1xuICB9KTtcblxuICBpZiAoZXhwZWN0ZWRTY2FsYXJJc09iamVjdCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFNlZSBpZiB3ZSBjYW4gYXBwbHkgdGhlIG1vZGlmaWVyIG9uIHRoZSBpZGVhbGx5IG1hdGNoaW5nIG9iamVjdC4gSWYgaXRcbiAgLy8gc3RpbGwgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsIHRoZW4gdGhlIG1vZGlmaWVyIGNvdWxkIGhhdmUgdHVybmVkIHRoZSByZWFsXG4gIC8vIG9iamVjdCBpbiB0aGUgZGF0YWJhc2UgaW50byBzb21ldGhpbmcgbWF0Y2hpbmcuXG4gIGNvbnN0IG1hdGNoaW5nRG9jdW1lbnQgPSBFSlNPTi5jbG9uZSh0aGlzLm1hdGNoaW5nRG9jdW1lbnQoKSk7XG5cbiAgLy8gVGhlIHNlbGVjdG9yIGlzIHRvbyBjb21wbGV4LCBhbnl0aGluZyBjYW4gaGFwcGVuLlxuICBpZiAobWF0Y2hpbmdEb2N1bWVudCA9PT0gbnVsbCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBMb2NhbENvbGxlY3Rpb24uX21vZGlmeShtYXRjaGluZ0RvY3VtZW50LCBtb2RpZmllcik7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gQ291bGRuJ3Qgc2V0IGEgcHJvcGVydHkgb24gYSBmaWVsZCB3aGljaCBpcyBhIHNjYWxhciBvciBudWxsIGluIHRoZVxuICAgIC8vIHNlbGVjdG9yLlxuICAgIC8vIEV4YW1wbGU6XG4gICAgLy8gcmVhbCBkb2N1bWVudDogeyAnYS5iJzogMyB9XG4gICAgLy8gc2VsZWN0b3I6IHsgJ2EnOiAxMiB9XG4gICAgLy8gY29udmVydGVkIHNlbGVjdG9yIChpZGVhbCBkb2N1bWVudCk6IHsgJ2EnOiAxMiB9XG4gICAgLy8gbW9kaWZpZXI6IHsgJHNldDogeyAnYS5iJzogNCB9IH1cbiAgICAvLyBXZSBkb24ndCBrbm93IHdoYXQgcmVhbCBkb2N1bWVudCB3YXMgbGlrZSBidXQgZnJvbSB0aGUgZXJyb3IgcmFpc2VkIGJ5XG4gICAgLy8gJHNldCBvbiBhIHNjYWxhciBmaWVsZCB3ZSBjYW4gcmVhc29uIHRoYXQgdGhlIHN0cnVjdHVyZSBvZiByZWFsIGRvY3VtZW50XG4gICAgLy8gaXMgY29tcGxldGVseSBkaWZmZXJlbnQuXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdNaW5pbW9uZ29FcnJvcicgJiYgZXJyb3Iuc2V0UHJvcGVydHlFcnJvcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRocm93IGVycm9yO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuZG9jdW1lbnRNYXRjaGVzKG1hdGNoaW5nRG9jdW1lbnQpLnJlc3VsdDtcbn07XG5cbi8vIEtub3dzIGhvdyB0byBjb21iaW5lIGEgbW9uZ28gc2VsZWN0b3IgYW5kIGEgZmllbGRzIHByb2plY3Rpb24gdG8gYSBuZXcgZmllbGRzXG4vLyBwcm9qZWN0aW9uIHRha2luZyBpbnRvIGFjY291bnQgYWN0aXZlIGZpZWxkcyBmcm9tIHRoZSBwYXNzZWQgc2VsZWN0b3IuXG4vLyBAcmV0dXJucyBPYmplY3QgLSBwcm9qZWN0aW9uIG9iamVjdCAoc2FtZSBhcyBmaWVsZHMgb3B0aW9uIG9mIG1vbmdvIGN1cnNvcilcbk1pbmltb25nby5NYXRjaGVyLnByb3RvdHlwZS5jb21iaW5lSW50b1Byb2plY3Rpb24gPSBmdW5jdGlvbihwcm9qZWN0aW9uKSB7XG4gIGNvbnN0IHNlbGVjdG9yUGF0aHMgPSBNaW5pbW9uZ28uX3BhdGhzRWxpZGluZ051bWVyaWNLZXlzKHRoaXMuX2dldFBhdGhzKCkpO1xuXG4gIC8vIFNwZWNpYWwgY2FzZSBmb3IgJHdoZXJlIG9wZXJhdG9yIGluIHRoZSBzZWxlY3RvciAtIHByb2plY3Rpb24gc2hvdWxkIGRlcGVuZFxuICAvLyBvbiBhbGwgZmllbGRzIG9mIHRoZSBkb2N1bWVudC4gZ2V0U2VsZWN0b3JQYXRocyByZXR1cm5zIGEgbGlzdCBvZiBwYXRoc1xuICAvLyBzZWxlY3RvciBkZXBlbmRzIG9uLiBJZiBvbmUgb2YgdGhlIHBhdGhzIGlzICcnIChlbXB0eSBzdHJpbmcpIHJlcHJlc2VudGluZ1xuICAvLyB0aGUgcm9vdCBvciB0aGUgd2hvbGUgZG9jdW1lbnQsIGNvbXBsZXRlIHByb2plY3Rpb24gc2hvdWxkIGJlIHJldHVybmVkLlxuICBpZiAoc2VsZWN0b3JQYXRocy5pbmNsdWRlcygnJykpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICByZXR1cm4gY29tYmluZUltcG9ydGFudFBhdGhzSW50b1Byb2plY3Rpb24oc2VsZWN0b3JQYXRocywgcHJvamVjdGlvbik7XG59O1xuXG4vLyBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IHdvdWxkIG1hdGNoIHRoZSBzZWxlY3RvciBpZiBwb3NzaWJsZSBvciBudWxsIGlmIHRoZVxuLy8gc2VsZWN0b3IgaXMgdG9vIGNvbXBsZXggZm9yIHVzIHRvIGFuYWx5emVcbi8vIHsgJ2EuYic6IHsgYW5zOiA0MiB9LCAnZm9vLmJhcic6IG51bGwsICdmb28uYmF6JzogXCJzb21ldGhpbmdcIiB9XG4vLyA9PiB7IGE6IHsgYjogeyBhbnM6IDQyIH0gfSwgZm9vOiB7IGJhcjogbnVsbCwgYmF6OiBcInNvbWV0aGluZ1wiIH0gfVxuTWluaW1vbmdvLk1hdGNoZXIucHJvdG90eXBlLm1hdGNoaW5nRG9jdW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgLy8gY2hlY2sgaWYgaXQgd2FzIGNvbXB1dGVkIGJlZm9yZVxuICBpZiAodGhpcy5fbWF0Y2hpbmdEb2N1bWVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuX21hdGNoaW5nRG9jdW1lbnQ7XG4gIH1cblxuICAvLyBJZiB0aGUgYW5hbHlzaXMgb2YgdGhpcyBzZWxlY3RvciBpcyB0b28gaGFyZCBmb3Igb3VyIGltcGxlbWVudGF0aW9uXG4gIC8vIGZhbGxiYWNrIHRvIFwiWUVTXCJcbiAgbGV0IGZhbGxiYWNrID0gZmFsc2U7XG5cbiAgdGhpcy5fbWF0Y2hpbmdEb2N1bWVudCA9IHBhdGhzVG9UcmVlKFxuICAgIHRoaXMuX2dldFBhdGhzKCksXG4gICAgcGF0aCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZVNlbGVjdG9yID0gdGhpcy5fc2VsZWN0b3JbcGF0aF07XG5cbiAgICAgIGlmIChpc09wZXJhdG9yT2JqZWN0KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc3RyaWN0IGVxdWFsaXR5LCB0aGVyZSBpcyBhIGdvb2RcbiAgICAgICAgLy8gY2hhbmNlIHdlIGNhbiB1c2Ugb25lIG9mIHRob3NlIGFzIFwibWF0Y2hpbmdcIlxuICAgICAgICAvLyBkdW1teSB2YWx1ZVxuICAgICAgICBpZiAodmFsdWVTZWxlY3Rvci4kZXEpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci4kZXE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVTZWxlY3Rvci4kaW4pIHtcbiAgICAgICAgICBjb25zdCBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHtwbGFjZWhvbGRlcjogdmFsdWVTZWxlY3Rvcn0pO1xuXG4gICAgICAgICAgLy8gUmV0dXJuIGFueXRoaW5nIGZyb20gJGluIHRoYXQgbWF0Y2hlcyB0aGUgd2hvbGUgc2VsZWN0b3IgZm9yIHRoaXNcbiAgICAgICAgICAvLyBwYXRoLiBJZiBub3RoaW5nIG1hdGNoZXMsIHJldHVybnMgYHVuZGVmaW5lZGAgYXMgbm90aGluZyBjYW4gbWFrZVxuICAgICAgICAgIC8vIHRoaXMgc2VsZWN0b3IgaW50byBgdHJ1ZWAuXG4gICAgICAgICAgcmV0dXJuIHZhbHVlU2VsZWN0b3IuJGluLmZpbmQocGxhY2Vob2xkZXIgPT5cbiAgICAgICAgICAgIG1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKHtwbGFjZWhvbGRlcn0pLnJlc3VsdFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob25seUNvbnRhaW5zS2V5cyh2YWx1ZVNlbGVjdG9yLCBbJyRndCcsICckZ3RlJywgJyRsdCcsICckbHRlJ10pKSB7XG4gICAgICAgICAgbGV0IGxvd2VyQm91bmQgPSAtSW5maW5pdHk7XG4gICAgICAgICAgbGV0IHVwcGVyQm91bmQgPSBJbmZpbml0eTtcblxuICAgICAgICAgIFsnJGx0ZScsICckbHQnXS5mb3JFYWNoKG9wID0+IHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbCh2YWx1ZVNlbGVjdG9yLCBvcCkgJiZcbiAgICAgICAgICAgICAgICB2YWx1ZVNlbGVjdG9yW29wXSA8IHVwcGVyQm91bmQpIHtcbiAgICAgICAgICAgICAgdXBwZXJCb3VuZCA9IHZhbHVlU2VsZWN0b3Jbb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgWyckZ3RlJywgJyRndCddLmZvckVhY2gob3AgPT4ge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKHZhbHVlU2VsZWN0b3IsIG9wKSAmJlxuICAgICAgICAgICAgICAgIHZhbHVlU2VsZWN0b3Jbb3BdID4gbG93ZXJCb3VuZCkge1xuICAgICAgICAgICAgICBsb3dlckJvdW5kID0gdmFsdWVTZWxlY3RvcltvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zdCBtaWRkbGUgPSAobG93ZXJCb3VuZCArIHVwcGVyQm91bmQpIC8gMjtcbiAgICAgICAgICBjb25zdCBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHtwbGFjZWhvbGRlcjogdmFsdWVTZWxlY3Rvcn0pO1xuXG4gICAgICAgICAgaWYgKCFtYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyh7cGxhY2Vob2xkZXI6IG1pZGRsZX0pLnJlc3VsdCAmJlxuICAgICAgICAgICAgICAobWlkZGxlID09PSBsb3dlckJvdW5kIHx8IG1pZGRsZSA9PT0gdXBwZXJCb3VuZCkpIHtcbiAgICAgICAgICAgIGZhbGxiYWNrID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbWlkZGxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9ubHlDb250YWluc0tleXModmFsdWVTZWxlY3RvciwgWyckbmluJywgJyRuZSddKSkge1xuICAgICAgICAgIC8vIFNpbmNlIHRoaXMuX2lzU2ltcGxlIG1ha2VzIHN1cmUgJG5pbiBhbmQgJG5lIGFyZSBub3QgY29tYmluZWQgd2l0aFxuICAgICAgICAgIC8vIG9iamVjdHMgb3IgYXJyYXlzLCB3ZSBjYW4gY29uZmlkZW50bHkgcmV0dXJuIGFuIGVtcHR5IG9iamVjdCBhcyBpdFxuICAgICAgICAgIC8vIG5ldmVyIG1hdGNoZXMgYW55IHNjYWxhci5cbiAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cblxuICAgICAgICBmYWxsYmFjayA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9zZWxlY3RvcltwYXRoXTtcbiAgICB9LFxuICAgIHggPT4geCk7XG5cbiAgaWYgKGZhbGxiYWNrKSB7XG4gICAgdGhpcy5fbWF0Y2hpbmdEb2N1bWVudCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdGhpcy5fbWF0Y2hpbmdEb2N1bWVudDtcbn07XG5cbi8vIE1pbmltb25nby5Tb3J0ZXIgZ2V0cyBhIHNpbWlsYXIgbWV0aG9kLCB3aGljaCBkZWxlZ2F0ZXMgdG8gYSBNYXRjaGVyIGl0IG1hZGVcbi8vIGZvciB0aGlzIGV4YWN0IHB1cnBvc2UuXG5NaW5pbW9uZ28uU29ydGVyLnByb3RvdHlwZS5hZmZlY3RlZEJ5TW9kaWZpZXIgPSBmdW5jdGlvbihtb2RpZmllcikge1xuICByZXR1cm4gdGhpcy5fc2VsZWN0b3JGb3JBZmZlY3RlZEJ5TW9kaWZpZXIuYWZmZWN0ZWRCeU1vZGlmaWVyKG1vZGlmaWVyKTtcbn07XG5cbk1pbmltb25nby5Tb3J0ZXIucHJvdG90eXBlLmNvbWJpbmVJbnRvUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHByb2plY3Rpb24pIHtcbiAgcmV0dXJuIGNvbWJpbmVJbXBvcnRhbnRQYXRoc0ludG9Qcm9qZWN0aW9uKFxuICAgIE1pbmltb25nby5fcGF0aHNFbGlkaW5nTnVtZXJpY0tleXModGhpcy5fZ2V0UGF0aHMoKSksXG4gICAgcHJvamVjdGlvblxuICApO1xufTtcblxuZnVuY3Rpb24gY29tYmluZUltcG9ydGFudFBhdGhzSW50b1Byb2plY3Rpb24ocGF0aHMsIHByb2plY3Rpb24pIHtcbiAgY29uc3QgZGV0YWlscyA9IHByb2plY3Rpb25EZXRhaWxzKHByb2plY3Rpb24pO1xuXG4gIC8vIG1lcmdlIHRoZSBwYXRocyB0byBpbmNsdWRlXG4gIGNvbnN0IHRyZWUgPSBwYXRoc1RvVHJlZShcbiAgICBwYXRocyxcbiAgICBwYXRoID0+IHRydWUsXG4gICAgKG5vZGUsIHBhdGgsIGZ1bGxQYXRoKSA9PiB0cnVlLFxuICAgIGRldGFpbHMudHJlZVxuICApO1xuICBjb25zdCBtZXJnZWRQcm9qZWN0aW9uID0gdHJlZVRvUGF0aHModHJlZSk7XG5cbiAgaWYgKGRldGFpbHMuaW5jbHVkaW5nKSB7XG4gICAgLy8gYm90aCBzZWxlY3RvciBhbmQgcHJvamVjdGlvbiBhcmUgcG9pbnRpbmcgb24gZmllbGRzIHRvIGluY2x1ZGVcbiAgICAvLyBzbyB3ZSBjYW4ganVzdCByZXR1cm4gdGhlIG1lcmdlZCB0cmVlXG4gICAgcmV0dXJuIG1lcmdlZFByb2plY3Rpb247XG4gIH1cblxuICAvLyBzZWxlY3RvciBpcyBwb2ludGluZyBhdCBmaWVsZHMgdG8gaW5jbHVkZVxuICAvLyBwcm9qZWN0aW9uIGlzIHBvaW50aW5nIGF0IGZpZWxkcyB0byBleGNsdWRlXG4gIC8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBleGNsdWRlIGltcG9ydGFudCBwYXRoc1xuICBjb25zdCBtZXJnZWRFeGNsUHJvamVjdGlvbiA9IHt9O1xuXG4gIE9iamVjdC5rZXlzKG1lcmdlZFByb2plY3Rpb24pLmZvckVhY2gocGF0aCA9PiB7XG4gICAgaWYgKCFtZXJnZWRQcm9qZWN0aW9uW3BhdGhdKSB7XG4gICAgICBtZXJnZWRFeGNsUHJvamVjdGlvbltwYXRoXSA9IGZhbHNlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG1lcmdlZEV4Y2xQcm9qZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRQYXRocyhzZWxlY3Rvcikge1xuICByZXR1cm4gT2JqZWN0LmtleXMobmV3IE1pbmltb25nby5NYXRjaGVyKHNlbGVjdG9yKS5fcGF0aHMpO1xuXG4gIC8vIFhYWCByZW1vdmUgaXQ/XG4gIC8vIHJldHVybiBPYmplY3Qua2V5cyhzZWxlY3RvcikubWFwKGsgPT4ge1xuICAvLyAgIC8vIHdlIGRvbid0IGtub3cgaG93IHRvIGhhbmRsZSAkd2hlcmUgYmVjYXVzZSBpdCBjYW4gYmUgYW55dGhpbmdcbiAgLy8gICBpZiAoayA9PT0gJyR3aGVyZScpIHtcbiAgLy8gICAgIHJldHVybiAnJzsgLy8gbWF0Y2hlcyBldmVyeXRoaW5nXG4gIC8vICAgfVxuXG4gIC8vICAgLy8gd2UgYnJhbmNoIGZyb20gJG9yLyRhbmQvJG5vciBvcGVyYXRvclxuICAvLyAgIGlmIChbJyRvcicsICckYW5kJywgJyRub3InXS5pbmNsdWRlcyhrKSkge1xuICAvLyAgICAgcmV0dXJuIHNlbGVjdG9yW2tdLm1hcChnZXRQYXRocyk7XG4gIC8vICAgfVxuXG4gIC8vICAgLy8gdGhlIHZhbHVlIGlzIGEgbGl0ZXJhbCBvciBzb21lIGNvbXBhcmlzb24gb3BlcmF0b3JcbiAgLy8gICByZXR1cm4gaztcbiAgLy8gfSlcbiAgLy8gICAucmVkdWNlKChhLCBiKSA9PiBhLmNvbmNhdChiKSwgW10pXG4gIC8vICAgLmZpbHRlcigoYSwgYiwgYykgPT4gYy5pbmRleE9mKGEpID09PSBiKTtcbn1cblxuLy8gQSBoZWxwZXIgdG8gZW5zdXJlIG9iamVjdCBoYXMgb25seSBjZXJ0YWluIGtleXNcbmZ1bmN0aW9uIG9ubHlDb250YWluc0tleXMob2JqLCBrZXlzKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmV2ZXJ5KGsgPT4ga2V5cy5pbmNsdWRlcyhrKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGhIYXNOdW1lcmljS2V5cyhwYXRoKSB7XG4gIHJldHVybiBwYXRoLnNwbGl0KCcuJykuc29tZShpc051bWVyaWNLZXkpO1xufVxuXG4vLyBSZXR1cm5zIGEgc2V0IG9mIGtleSBwYXRocyBzaW1pbGFyIHRvXG4vLyB7ICdmb28uYmFyJzogMSwgJ2EuYi5jJzogMSB9XG5mdW5jdGlvbiB0cmVlVG9QYXRocyh0cmVlLCBwcmVmaXggPSAnJykge1xuICBjb25zdCByZXN1bHQgPSB7fTtcblxuICBPYmplY3Qua2V5cyh0cmVlKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmVlW2tleV07XG4gICAgaWYgKHZhbHVlID09PSBPYmplY3QodmFsdWUpKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHJlc3VsdCwgdHJlZVRvUGF0aHModmFsdWUsIGAke3ByZWZpeCArIGtleX0uYCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHRbcHJlZml4ICsga2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsImltcG9ydCBMb2NhbENvbGxlY3Rpb24gZnJvbSAnLi9sb2NhbF9jb2xsZWN0aW9uLmpzJztcblxuZXhwb3J0IGNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIEVhY2ggZWxlbWVudCBzZWxlY3RvciBjb250YWluczpcbi8vICAtIGNvbXBpbGVFbGVtZW50U2VsZWN0b3IsIGEgZnVuY3Rpb24gd2l0aCBhcmdzOlxuLy8gICAgLSBvcGVyYW5kIC0gdGhlIFwicmlnaHQgaGFuZCBzaWRlXCIgb2YgdGhlIG9wZXJhdG9yXG4vLyAgICAtIHZhbHVlU2VsZWN0b3IgLSB0aGUgXCJjb250ZXh0XCIgZm9yIHRoZSBvcGVyYXRvciAoc28gdGhhdCAkcmVnZXggY2FuIGZpbmRcbi8vICAgICAgJG9wdGlvbnMpXG4vLyAgICAtIG1hdGNoZXIgLSB0aGUgTWF0Y2hlciB0aGlzIGlzIGdvaW5nIGludG8gKHNvIHRoYXQgJGVsZW1NYXRjaCBjYW4gY29tcGlsZVxuLy8gICAgICBtb3JlIHRoaW5ncylcbi8vICAgIHJldHVybmluZyBhIGZ1bmN0aW9uIG1hcHBpbmcgYSBzaW5nbGUgdmFsdWUgdG8gYm9vbC5cbi8vICAtIGRvbnRFeHBhbmRMZWFmQXJyYXlzLCBhIGJvb2wgd2hpY2ggcHJldmVudHMgZXhwYW5kQXJyYXlzSW5CcmFuY2hlcyBmcm9tXG4vLyAgICBiZWluZyBjYWxsZWRcbi8vICAtIGRvbnRJbmNsdWRlTGVhZkFycmF5cywgYSBib29sIHdoaWNoIGNhdXNlcyBhbiBhcmd1bWVudCB0byBiZSBwYXNzZWQgdG9cbi8vICAgIGV4cGFuZEFycmF5c0luQnJhbmNoZXMgaWYgaXQgaXMgY2FsbGVkXG5leHBvcnQgY29uc3QgRUxFTUVOVF9PUEVSQVRPUlMgPSB7XG4gICRsdDogbWFrZUluZXF1YWxpdHkoY21wVmFsdWUgPT4gY21wVmFsdWUgPCAwKSxcbiAgJGd0OiBtYWtlSW5lcXVhbGl0eShjbXBWYWx1ZSA9PiBjbXBWYWx1ZSA+IDApLFxuICAkbHRlOiBtYWtlSW5lcXVhbGl0eShjbXBWYWx1ZSA9PiBjbXBWYWx1ZSA8PSAwKSxcbiAgJGd0ZTogbWFrZUluZXF1YWxpdHkoY21wVmFsdWUgPT4gY21wVmFsdWUgPj0gMCksXG4gICRtb2Q6IHtcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIGlmICghKEFycmF5LmlzQXJyYXkob3BlcmFuZCkgJiYgb3BlcmFuZC5sZW5ndGggPT09IDJcbiAgICAgICAgICAgICYmIHR5cGVvZiBvcGVyYW5kWzBdID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgJiYgdHlwZW9mIG9wZXJhbmRbMV0gPT09ICdudW1iZXInKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignYXJndW1lbnQgdG8gJG1vZCBtdXN0IGJlIGFuIGFycmF5IG9mIHR3byBudW1iZXJzJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFhYWCBjb3VsZCByZXF1aXJlIHRvIGJlIGludHMgb3Igcm91bmQgb3Igc29tZXRoaW5nXG4gICAgICBjb25zdCBkaXZpc29yID0gb3BlcmFuZFswXTtcbiAgICAgIGNvbnN0IHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgICByZXR1cm4gdmFsdWUgPT4gKFxuICAgICAgICB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIHZhbHVlICUgZGl2aXNvciA9PT0gcmVtYWluZGVyXG4gICAgICApO1xuICAgIH0sXG4gIH0sXG4gICRpbjoge1xuICAgIGNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCkge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmQpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCckaW4gbmVlZHMgYW4gYXJyYXknKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZWxlbWVudE1hdGNoZXJzID0gb3BlcmFuZC5tYXAob3B0aW9uID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgIHJldHVybiByZWdleHBFbGVtZW50TWF0Y2hlcihvcHRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzT3BlcmF0b3JPYmplY3Qob3B0aW9uKSkge1xuICAgICAgICAgIHRocm93IEVycm9yKCdjYW5ub3QgbmVzdCAkIHVuZGVyICRpbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVxdWFsaXR5RWxlbWVudE1hdGNoZXIob3B0aW9uKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICAvLyBBbGxvdyB7YTogeyRpbjogW251bGxdfX0gdG8gbWF0Y2ggd2hlbiAnYScgZG9lcyBub3QgZXhpc3QuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnRNYXRjaGVycy5zb21lKG1hdGNoZXIgPT4gbWF0Y2hlcih2YWx1ZSkpO1xuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAkc2l6ZToge1xuICAgIC8vIHthOiBbWzUsIDVdXX0gbXVzdCBtYXRjaCB7YTogeyRzaXplOiAxfX0gYnV0IG5vdCB7YTogeyRzaXplOiAyfX0sIHNvIHdlXG4gICAgLy8gZG9uJ3Qgd2FudCB0byBjb25zaWRlciB0aGUgZWxlbWVudCBbNSw1XSBpbiB0aGUgbGVhZiBhcnJheSBbWzUsNV1dIGFzIGFcbiAgICAvLyBwb3NzaWJsZSB2YWx1ZS5cbiAgICBkb250RXhwYW5kTGVhZkFycmF5czogdHJ1ZSxcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3BlcmFuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gRG9uJ3QgYXNrIG1lIHdoeSwgYnV0IGJ5IGV4cGVyaW1lbnRhdGlvbiwgdGhpcyBzZWVtcyB0byBiZSB3aGF0IE1vbmdvXG4gICAgICAgIC8vIGRvZXMuXG4gICAgICAgIG9wZXJhbmQgPSAwO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BlcmFuZCAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJyRzaXplIG5lZWRzIGEgbnVtYmVyJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWx1ZSA9PiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IG9wZXJhbmQ7XG4gICAgfSxcbiAgfSxcbiAgJHR5cGU6IHtcbiAgICAvLyB7YTogWzVdfSBtdXN0IG5vdCBtYXRjaCB7YTogeyR0eXBlOiA0fX0gKDQgbWVhbnMgYXJyYXkpLCBidXQgaXQgc2hvdWxkXG4gICAgLy8gbWF0Y2gge2E6IHskdHlwZTogMX19ICgxIG1lYW5zIG51bWJlciksIGFuZCB7YTogW1s1XV19IG11c3QgbWF0Y2ggeyRhOlxuICAgIC8vIHskdHlwZTogNH19LiBUaHVzLCB3aGVuIHdlIHNlZSBhIGxlYWYgYXJyYXksIHdlICpzaG91bGQqIGV4cGFuZCBpdCBidXRcbiAgICAvLyBzaG91bGQgKm5vdCogaW5jbHVkZSBpdCBpdHNlbGYuXG4gICAgZG9udEluY2x1ZGVMZWFmQXJyYXlzOiB0cnVlLFxuICAgIGNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCkge1xuICAgICAgaWYgKHR5cGVvZiBvcGVyYW5kID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBvcGVyYW5kQWxpYXNNYXAgPSB7XG4gICAgICAgICAgJ2RvdWJsZSc6IDEsXG4gICAgICAgICAgJ3N0cmluZyc6IDIsXG4gICAgICAgICAgJ29iamVjdCc6IDMsXG4gICAgICAgICAgJ2FycmF5JzogNCxcbiAgICAgICAgICAnYmluRGF0YSc6IDUsXG4gICAgICAgICAgJ3VuZGVmaW5lZCc6IDYsXG4gICAgICAgICAgJ29iamVjdElkJzogNyxcbiAgICAgICAgICAnYm9vbCc6IDgsXG4gICAgICAgICAgJ2RhdGUnOiA5LFxuICAgICAgICAgICdudWxsJzogMTAsXG4gICAgICAgICAgJ3JlZ2V4JzogMTEsXG4gICAgICAgICAgJ2RiUG9pbnRlcic6IDEyLFxuICAgICAgICAgICdqYXZhc2NyaXB0JzogMTMsXG4gICAgICAgICAgJ3N5bWJvbCc6IDE0LFxuICAgICAgICAgICdqYXZhc2NyaXB0V2l0aFNjb3BlJzogMTUsXG4gICAgICAgICAgJ2ludCc6IDE2LFxuICAgICAgICAgICd0aW1lc3RhbXAnOiAxNyxcbiAgICAgICAgICAnbG9uZyc6IDE4LFxuICAgICAgICAgICdkZWNpbWFsJzogMTksXG4gICAgICAgICAgJ21pbktleSc6IC0xLFxuICAgICAgICAgICdtYXhLZXknOiAxMjcsXG4gICAgICAgIH07XG4gICAgICAgIGlmICghaGFzT3duLmNhbGwob3BlcmFuZEFsaWFzTWFwLCBvcGVyYW5kKSkge1xuICAgICAgICAgIHRocm93IEVycm9yKGB1bmtub3duIHN0cmluZyBhbGlhcyBmb3IgJHR5cGU6ICR7b3BlcmFuZH1gKTtcbiAgICAgICAgfVxuICAgICAgICBvcGVyYW5kID0gb3BlcmFuZEFsaWFzTWFwW29wZXJhbmRdO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BlcmFuZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKG9wZXJhbmQgPT09IDAgfHwgb3BlcmFuZCA8IC0xXG4gICAgICAgICAgfHwgKG9wZXJhbmQgPiAxOSAmJiBvcGVyYW5kICE9PSAxMjcpKSB7XG4gICAgICAgICAgdGhyb3cgRXJyb3IoYEludmFsaWQgbnVtZXJpY2FsICR0eXBlIGNvZGU6ICR7b3BlcmFuZH1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2FyZ3VtZW50IHRvICR0eXBlIGlzIG5vdCBhIG51bWJlciBvciBhIHN0cmluZycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWUgPT4gKFxuICAgICAgICB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZSh2YWx1ZSkgPT09IG9wZXJhbmRcbiAgICAgICk7XG4gICAgfSxcbiAgfSxcbiAgJGJpdHNBbGxTZXQ6IHtcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIGNvbnN0IG1hc2sgPSBnZXRPcGVyYW5kQml0bWFzayhvcGVyYW5kLCAnJGJpdHNBbGxTZXQnKTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PiB7XG4gICAgICAgIGNvbnN0IGJpdG1hc2sgPSBnZXRWYWx1ZUJpdG1hc2sodmFsdWUsIG1hc2subGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIGJpdG1hc2sgJiYgbWFzay5ldmVyeSgoYnl0ZSwgaSkgPT4gKGJpdG1hc2tbaV0gJiBieXRlKSA9PT0gYnl0ZSk7XG4gICAgICB9O1xuICAgIH0sXG4gIH0sXG4gICRiaXRzQW55U2V0OiB7XG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKSB7XG4gICAgICBjb25zdCBtYXNrID0gZ2V0T3BlcmFuZEJpdG1hc2sob3BlcmFuZCwgJyRiaXRzQW55U2V0Jyk7XG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICBjb25zdCBiaXRtYXNrID0gZ2V0VmFsdWVCaXRtYXNrKHZhbHVlLCBtYXNrLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBiaXRtYXNrICYmIG1hc2suc29tZSgoYnl0ZSwgaSkgPT4gKH5iaXRtYXNrW2ldICYgYnl0ZSkgIT09IGJ5dGUpO1xuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAkYml0c0FsbENsZWFyOiB7XG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKSB7XG4gICAgICBjb25zdCBtYXNrID0gZ2V0T3BlcmFuZEJpdG1hc2sob3BlcmFuZCwgJyRiaXRzQWxsQ2xlYXInKTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PiB7XG4gICAgICAgIGNvbnN0IGJpdG1hc2sgPSBnZXRWYWx1ZUJpdG1hc2sodmFsdWUsIG1hc2subGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIGJpdG1hc2sgJiYgbWFzay5ldmVyeSgoYnl0ZSwgaSkgPT4gIShiaXRtYXNrW2ldICYgYnl0ZSkpO1xuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAkYml0c0FueUNsZWFyOiB7XG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKSB7XG4gICAgICBjb25zdCBtYXNrID0gZ2V0T3BlcmFuZEJpdG1hc2sob3BlcmFuZCwgJyRiaXRzQW55Q2xlYXInKTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PiB7XG4gICAgICAgIGNvbnN0IGJpdG1hc2sgPSBnZXRWYWx1ZUJpdG1hc2sodmFsdWUsIG1hc2subGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIGJpdG1hc2sgJiYgbWFzay5zb21lKChieXRlLCBpKSA9PiAoYml0bWFza1tpXSAmIGJ5dGUpICE9PSBieXRlKTtcbiAgICAgIH07XG4gICAgfSxcbiAgfSxcbiAgJHJlZ2V4OiB7XG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yKSB7XG4gICAgICBpZiAoISh0eXBlb2Ygb3BlcmFuZCA9PT0gJ3N0cmluZycgfHwgb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJyRyZWdleCBoYXMgdG8gYmUgYSBzdHJpbmcgb3IgUmVnRXhwJyk7XG4gICAgICB9XG5cbiAgICAgIGxldCByZWdleHA7XG4gICAgICBpZiAodmFsdWVTZWxlY3Rvci4kb3B0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIE9wdGlvbnMgcGFzc2VkIGluICRvcHRpb25zIChldmVuIHRoZSBlbXB0eSBzdHJpbmcpIGFsd2F5cyBvdmVycmlkZXNcbiAgICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgICAgLy8gQmUgY2xlYXIgdGhhdCB3ZSBvbmx5IHN1cHBvcnQgdGhlIEpTLXN1cHBvcnRlZCBvcHRpb25zLCBub3QgZXh0ZW5kZWRcbiAgICAgICAgLy8gb25lcyAoZWcsIE1vbmdvIHN1cHBvcnRzIHggYW5kIHMpLiBJZGVhbGx5IHdlIHdvdWxkIGltcGxlbWVudCB4IGFuZCBzXG4gICAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICAgIGlmICgvW15naW1dLy50ZXN0KHZhbHVlU2VsZWN0b3IuJG9wdGlvbnMpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IHRoZSBpLCBtLCBhbmQgZyByZWdleHAgb3B0aW9ucyBhcmUgc3VwcG9ydGVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3VyY2UgPSBvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwID8gb3BlcmFuZC5zb3VyY2UgOiBvcGVyYW5kO1xuICAgICAgICByZWdleHAgPSBuZXcgUmVnRXhwKHNvdXJjZSwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucyk7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgcmVnZXhwID0gb3BlcmFuZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAob3BlcmFuZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWdleHBFbGVtZW50TWF0Y2hlcihyZWdleHApO1xuICAgIH0sXG4gIH0sXG4gICRlbGVtTWF0Y2g6IHtcbiAgICBkb250RXhwYW5kTGVhZkFycmF5czogdHJ1ZSxcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIpIHtcbiAgICAgIGlmICghTG9jYWxDb2xsZWN0aW9uLl9pc1BsYWluT2JqZWN0KG9wZXJhbmQpKSB7XG4gICAgICAgIHRocm93IEVycm9yKCckZWxlbU1hdGNoIG5lZWQgYW4gb2JqZWN0Jyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRG9jTWF0Y2hlciA9ICFpc09wZXJhdG9yT2JqZWN0KFxuICAgICAgICBPYmplY3Qua2V5cyhvcGVyYW5kKVxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+ICFoYXNPd24uY2FsbChMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgICAucmVkdWNlKChhLCBiKSA9PiBPYmplY3QuYXNzaWduKGEsIHtbYl06IG9wZXJhbmRbYl19KSwge30pLFxuICAgICAgICB0cnVlKTtcblxuICAgICAgbGV0IHN1Yk1hdGNoZXI7XG4gICAgICBpZiAoaXNEb2NNYXRjaGVyKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgTk9UIHRoZSBzYW1lIGFzIGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpLCBhbmQgbm90IGp1c3RcbiAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGUgc2xpZ2h0bHkgZGlmZmVyZW50IGNhbGxpbmcgY29udmVudGlvbi5cbiAgICAgICAgLy8geyRlbGVtTWF0Y2g6IHt4OiAzfX0gbWVhbnMgXCJhbiBlbGVtZW50IGhhcyBhIGZpZWxkIHg6M1wiLCBub3RcbiAgICAgICAgLy8gXCJjb25zaXN0cyBvbmx5IG9mIGEgZmllbGQgeDozXCIuIEFsc28sIHJlZ2V4cHMgYW5kIHN1Yi0kIGFyZSBhbGxvd2VkLlxuICAgICAgICBzdWJNYXRjaGVyID1cbiAgICAgICAgICBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kLCBtYXRjaGVyLCB7aW5FbGVtTWF0Y2g6IHRydWV9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1Yk1hdGNoZXIgPSBjb21waWxlVmFsdWVTZWxlY3RvcihvcGVyYW5kLCBtYXRjaGVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBjb25zdCBhcnJheUVsZW1lbnQgPSB2YWx1ZVtpXTtcbiAgICAgICAgICBsZXQgYXJnO1xuICAgICAgICAgIGlmIChpc0RvY01hdGNoZXIpIHtcbiAgICAgICAgICAgIC8vIFdlIGNhbiBvbmx5IG1hdGNoIHskZWxlbU1hdGNoOiB7YjogM319IGFnYWluc3Qgb2JqZWN0cy5cbiAgICAgICAgICAgIC8vIChXZSBjYW4gYWxzbyBtYXRjaCBhZ2FpbnN0IGFycmF5cywgaWYgdGhlcmUncyBudW1lcmljIGluZGljZXMsXG4gICAgICAgICAgICAvLyBlZyB7JGVsZW1NYXRjaDogeycwLmInOiAzfX0gb3IgeyRlbGVtTWF0Y2g6IHswOiAzfX0uKVxuICAgICAgICAgICAgaWYgKCFpc0luZGV4YWJsZShhcnJheUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXJnID0gYXJyYXlFbGVtZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkb250SXRlcmF0ZSBlbnN1cmVzIHRoYXQge2E6IHskZWxlbU1hdGNoOiB7JGd0OiA1fX19IG1hdGNoZXNcbiAgICAgICAgICAgIC8vIHthOiBbOF19IGJ1dCBub3Qge2E6IFtbOF1dfVxuICAgICAgICAgICAgYXJnID0gW3t2YWx1ZTogYXJyYXlFbGVtZW50LCBkb250SXRlcmF0ZTogdHJ1ZX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBYWFggc3VwcG9ydCAkbmVhciBpbiAkZWxlbU1hdGNoIGJ5IHByb3BhZ2F0aW5nICRkaXN0YW5jZT9cbiAgICAgICAgICBpZiAoc3ViTWF0Y2hlcihhcmcpLnJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7IC8vIHNwZWNpYWxseSB1bmRlcnN0b29kIHRvIG1lYW4gXCJ1c2UgYXMgYXJyYXlJbmRpY2VzXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuICAgIH0sXG4gIH0sXG59O1xuXG4vLyBPcGVyYXRvcnMgdGhhdCBhcHBlYXIgYXQgdGhlIHRvcCBsZXZlbCBvZiBhIGRvY3VtZW50IHNlbGVjdG9yLlxuY29uc3QgTE9HSUNBTF9PUEVSQVRPUlMgPSB7XG4gICRhbmQoc3ViU2VsZWN0b3IsIG1hdGNoZXIsIGluRWxlbU1hdGNoKSB7XG4gICAgcmV0dXJuIGFuZERvY3VtZW50TWF0Y2hlcnMoXG4gICAgICBjb21waWxlQXJyYXlPZkRvY3VtZW50U2VsZWN0b3JzKHN1YlNlbGVjdG9yLCBtYXRjaGVyLCBpbkVsZW1NYXRjaClcbiAgICApO1xuICB9LFxuXG4gICRvcihzdWJTZWxlY3RvciwgbWF0Y2hlciwgaW5FbGVtTWF0Y2gpIHtcbiAgICBjb25zdCBtYXRjaGVycyA9IGNvbXBpbGVBcnJheU9mRG9jdW1lbnRTZWxlY3RvcnMoXG4gICAgICBzdWJTZWxlY3RvcixcbiAgICAgIG1hdGNoZXIsXG4gICAgICBpbkVsZW1NYXRjaFxuICAgICk7XG5cbiAgICAvLyBTcGVjaWFsIGNhc2U6IGlmIHRoZXJlIGlzIG9ubHkgb25lIG1hdGNoZXIsIHVzZSBpdCBkaXJlY3RseSwgKnByZXNlcnZpbmcqXG4gICAgLy8gYW55IGFycmF5SW5kaWNlcyBpdCByZXR1cm5zLlxuICAgIGlmIChtYXRjaGVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBtYXRjaGVyc1swXTtcbiAgICB9XG5cbiAgICByZXR1cm4gZG9jID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IG1hdGNoZXJzLnNvbWUoZm4gPT4gZm4oZG9jKS5yZXN1bHQpO1xuICAgICAgLy8gJG9yIGRvZXMgTk9UIHNldCBhcnJheUluZGljZXMgd2hlbiBpdCBoYXMgbXVsdGlwbGVcbiAgICAgIC8vIHN1Yi1leHByZXNzaW9ucy4gKFRlc3RlZCBhZ2FpbnN0IE1vbmdvREIuKVxuICAgICAgcmV0dXJuIHtyZXN1bHR9O1xuICAgIH07XG4gIH0sXG5cbiAgJG5vcihzdWJTZWxlY3RvciwgbWF0Y2hlciwgaW5FbGVtTWF0Y2gpIHtcbiAgICBjb25zdCBtYXRjaGVycyA9IGNvbXBpbGVBcnJheU9mRG9jdW1lbnRTZWxlY3RvcnMoXG4gICAgICBzdWJTZWxlY3RvcixcbiAgICAgIG1hdGNoZXIsXG4gICAgICBpbkVsZW1NYXRjaFxuICAgICk7XG4gICAgcmV0dXJuIGRvYyA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBtYXRjaGVycy5ldmVyeShmbiA9PiAhZm4oZG9jKS5yZXN1bHQpO1xuICAgICAgLy8gTmV2ZXIgc2V0IGFycmF5SW5kaWNlcywgYmVjYXVzZSB3ZSBvbmx5IG1hdGNoIGlmIG5vdGhpbmcgaW4gcGFydGljdWxhclxuICAgICAgLy8gJ21hdGNoZWQnIChhbmQgYmVjYXVzZSB0aGlzIGlzIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCKS5cbiAgICAgIHJldHVybiB7cmVzdWx0fTtcbiAgICB9O1xuICB9LFxuXG4gICR3aGVyZShzZWxlY3RvclZhbHVlLCBtYXRjaGVyKSB7XG4gICAgLy8gUmVjb3JkIHRoYXQgKmFueSogcGF0aCBtYXkgYmUgdXNlZC5cbiAgICBtYXRjaGVyLl9yZWNvcmRQYXRoVXNlZCgnJyk7XG4gICAgbWF0Y2hlci5faGFzV2hlcmUgPSB0cnVlO1xuXG4gICAgaWYgKCEoc2VsZWN0b3JWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgLy8gWFhYIE1vbmdvREIgc2VlbXMgdG8gaGF2ZSBtb3JlIGNvbXBsZXggbG9naWMgdG8gZGVjaWRlIHdoZXJlIG9yIG9yIG5vdFxuICAgICAgLy8gdG8gYWRkICdyZXR1cm4nOyBub3Qgc3VyZSBleGFjdGx5IHdoYXQgaXQgaXMuXG4gICAgICBzZWxlY3RvclZhbHVlID0gRnVuY3Rpb24oJ29iaicsIGByZXR1cm4gJHtzZWxlY3RvclZhbHVlfWApO1xuICAgIH1cblxuICAgIC8vIFdlIG1ha2UgdGhlIGRvY3VtZW50IGF2YWlsYWJsZSBhcyBib3RoIGB0aGlzYCBhbmQgYG9iamAuXG4gICAgLy8gLy8gWFhYIG5vdCBzdXJlIHdoYXQgd2Ugc2hvdWxkIGRvIGlmIHRoaXMgdGhyb3dzXG4gICAgcmV0dXJuIGRvYyA9PiAoe3Jlc3VsdDogc2VsZWN0b3JWYWx1ZS5jYWxsKGRvYywgZG9jKX0pO1xuICB9LFxuXG4gIC8vIFRoaXMgaXMganVzdCB1c2VkIGFzIGEgY29tbWVudCBpbiB0aGUgcXVlcnkgKGluIE1vbmdvREIsIGl0IGFsc28gZW5kcyB1cCBpblxuICAvLyBxdWVyeSBsb2dzKTsgaXQgaGFzIG5vIGVmZmVjdCBvbiB0aGUgYWN0dWFsIHNlbGVjdGlvbi5cbiAgJGNvbW1lbnQoKSB7XG4gICAgcmV0dXJuICgpID0+ICh7cmVzdWx0OiB0cnVlfSk7XG4gIH0sXG59O1xuXG4vLyBPcGVyYXRvcnMgdGhhdCAodW5saWtlIExPR0lDQUxfT1BFUkFUT1JTKSBwZXJ0YWluIHRvIGluZGl2aWR1YWwgcGF0aHMgaW4gYVxuLy8gZG9jdW1lbnQsIGJ1dCAodW5saWtlIEVMRU1FTlRfT1BFUkFUT1JTKSBkbyBub3QgaGF2ZSBhIHNpbXBsZSBkZWZpbml0aW9uIGFzXG4vLyBcIm1hdGNoIGVhY2ggYnJhbmNoZWQgdmFsdWUgaW5kZXBlbmRlbnRseSBhbmQgY29tYmluZSB3aXRoXG4vLyBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlclwiLlxuY29uc3QgVkFMVUVfT1BFUkFUT1JTID0ge1xuICAkZXEob3BlcmFuZCkge1xuICAgIHJldHVybiBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlcihcbiAgICAgIGVxdWFsaXR5RWxlbWVudE1hdGNoZXIob3BlcmFuZClcbiAgICApO1xuICB9LFxuICAkbm90KG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIpIHtcbiAgICByZXR1cm4gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQsIG1hdGNoZXIpKTtcbiAgfSxcbiAgJG5lKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKFxuICAgICAgY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoZXF1YWxpdHlFbGVtZW50TWF0Y2hlcihvcGVyYW5kKSlcbiAgICApO1xuICB9LFxuICAkbmluKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKFxuICAgICAgY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoXG4gICAgICAgIEVMRU1FTlRfT1BFUkFUT1JTLiRpbi5jb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpXG4gICAgICApXG4gICAgKTtcbiAgfSxcbiAgJGV4aXN0cyhvcGVyYW5kKSB7XG4gICAgY29uc3QgZXhpc3RzID0gY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoXG4gICAgICB2YWx1ZSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkXG4gICAgKTtcbiAgICByZXR1cm4gb3BlcmFuZCA/IGV4aXN0cyA6IGludmVydEJyYW5jaGVkTWF0Y2hlcihleGlzdHMpO1xuICB9LFxuICAvLyAkb3B0aW9ucyBqdXN0IHByb3ZpZGVzIG9wdGlvbnMgZm9yICRyZWdleDsgaXRzIGxvZ2ljIGlzIGluc2lkZSAkcmVnZXhcbiAgJG9wdGlvbnMob3BlcmFuZCwgdmFsdWVTZWxlY3Rvcikge1xuICAgIGlmICghaGFzT3duLmNhbGwodmFsdWVTZWxlY3RvciwgJyRyZWdleCcpKSB7XG4gICAgICB0aHJvdyBFcnJvcignJG9wdGlvbnMgbmVlZHMgYSAkcmVnZXgnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXZlcnl0aGluZ01hdGNoZXI7XG4gIH0sXG4gIC8vICRtYXhEaXN0YW5jZSBpcyBiYXNpY2FsbHkgYW4gYXJndW1lbnQgdG8gJG5lYXJcbiAgJG1heERpc3RhbmNlKG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IpIHtcbiAgICBpZiAoIXZhbHVlU2VsZWN0b3IuJG5lYXIpIHtcbiAgICAgIHRocm93IEVycm9yKCckbWF4RGlzdGFuY2UgbmVlZHMgYSAkbmVhcicpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVyeXRoaW5nTWF0Y2hlcjtcbiAgfSxcbiAgJGFsbChvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yLCBtYXRjaGVyKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmQpKSB7XG4gICAgICB0aHJvdyBFcnJvcignJGFsbCByZXF1aXJlcyBhcnJheScpO1xuICAgIH1cblxuICAgIC8vIE5vdCBzdXJlIHdoeSwgYnV0IHRoaXMgc2VlbXMgdG8gYmUgd2hhdCBNb25nb0RCIGRvZXMuXG4gICAgaWYgKG9wZXJhbmQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbm90aGluZ01hdGNoZXI7XG4gICAgfVxuXG4gICAgY29uc3QgYnJhbmNoZWRNYXRjaGVycyA9IG9wZXJhbmQubWFwKGNyaXRlcmlvbiA9PiB7XG4gICAgICAvLyBYWFggaGFuZGxlICRhbGwvJGVsZW1NYXRjaCBjb21iaW5hdGlvblxuICAgICAgaWYgKGlzT3BlcmF0b3JPYmplY3QoY3JpdGVyaW9uKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignbm8gJCBleHByZXNzaW9ucyBpbiAkYWxsJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgYWx3YXlzIGEgcmVnZXhwIG9yIGVxdWFsaXR5IHNlbGVjdG9yLlxuICAgICAgcmV0dXJuIGNvbXBpbGVWYWx1ZVNlbGVjdG9yKGNyaXRlcmlvbiwgbWF0Y2hlcik7XG4gICAgfSk7XG5cbiAgICAvLyBhbmRCcmFuY2hlZE1hdGNoZXJzIGRvZXMgTk9UIHJlcXVpcmUgYWxsIHNlbGVjdG9ycyB0byByZXR1cm4gdHJ1ZSBvbiB0aGVcbiAgICAvLyBTQU1FIGJyYW5jaC5cbiAgICByZXR1cm4gYW5kQnJhbmNoZWRNYXRjaGVycyhicmFuY2hlZE1hdGNoZXJzKTtcbiAgfSxcbiAgJG5lYXIob3BlcmFuZCwgdmFsdWVTZWxlY3RvciwgbWF0Y2hlciwgaXNSb290KSB7XG4gICAgaWYgKCFpc1Jvb3QpIHtcbiAgICAgIHRocm93IEVycm9yKCckbmVhciBjYW5cXCd0IGJlIGluc2lkZSBhbm90aGVyICQgb3BlcmF0b3InKTtcbiAgICB9XG5cbiAgICBtYXRjaGVyLl9oYXNHZW9RdWVyeSA9IHRydWU7XG5cbiAgICAvLyBUaGVyZSBhcmUgdHdvIGtpbmRzIG9mIGdlb2RhdGEgaW4gTW9uZ29EQjogbGVnYWN5IGNvb3JkaW5hdGUgcGFpcnMgYW5kXG4gICAgLy8gR2VvSlNPTi4gVGhleSB1c2UgZGlmZmVyZW50IGRpc3RhbmNlIG1ldHJpY3MsIHRvby4gR2VvSlNPTiBxdWVyaWVzIGFyZVxuICAgIC8vIG1hcmtlZCB3aXRoIGEgJGdlb21ldHJ5IHByb3BlcnR5LCB0aG91Z2ggbGVnYWN5IGNvb3JkaW5hdGVzIGNhbiBiZVxuICAgIC8vIG1hdGNoZWQgdXNpbmcgJGdlb21ldHJ5LlxuICAgIGxldCBtYXhEaXN0YW5jZSwgcG9pbnQsIGRpc3RhbmNlO1xuICAgIGlmIChMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3Qob3BlcmFuZCkgJiYgaGFzT3duLmNhbGwob3BlcmFuZCwgJyRnZW9tZXRyeScpKSB7XG4gICAgICAvLyBHZW9KU09OIFwiMmRzcGhlcmVcIiBtb2RlLlxuICAgICAgbWF4RGlzdGFuY2UgPSBvcGVyYW5kLiRtYXhEaXN0YW5jZTtcbiAgICAgIHBvaW50ID0gb3BlcmFuZC4kZ2VvbWV0cnk7XG4gICAgICBkaXN0YW5jZSA9IHZhbHVlID0+IHtcbiAgICAgICAgLy8gWFhYOiBmb3Igbm93LCB3ZSBkb24ndCBjYWxjdWxhdGUgdGhlIGFjdHVhbCBkaXN0YW5jZSBiZXR3ZWVuLCBzYXksXG4gICAgICAgIC8vIHBvbHlnb24gYW5kIGNpcmNsZS4gSWYgcGVvcGxlIGNhcmUgYWJvdXQgdGhpcyB1c2UtY2FzZSBpdCB3aWxsIGdldFxuICAgICAgICAvLyBhIHByaW9yaXR5LlxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbHVlLnR5cGUpIHtcbiAgICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludERpc3RhbmNlKFxuICAgICAgICAgICAgcG9pbnQsXG4gICAgICAgICAgICB7dHlwZTogJ1BvaW50JywgY29vcmRpbmF0ZXM6IHBvaW50VG9BcnJheSh2YWx1ZSl9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS50eXBlID09PSAnUG9pbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIEdlb0pTT04ucG9pbnREaXN0YW5jZShwb2ludCwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEdlb0pTT04uZ2VvbWV0cnlXaXRoaW5SYWRpdXModmFsdWUsIHBvaW50LCBtYXhEaXN0YW5jZSlcbiAgICAgICAgICA/IDBcbiAgICAgICAgICA6IG1heERpc3RhbmNlICsgMTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG1heERpc3RhbmNlID0gdmFsdWVTZWxlY3Rvci4kbWF4RGlzdGFuY2U7XG5cbiAgICAgIGlmICghaXNJbmRleGFibGUob3BlcmFuZCkpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJyRuZWFyIGFyZ3VtZW50IG11c3QgYmUgY29vcmRpbmF0ZSBwYWlyIG9yIEdlb0pTT04nKTtcbiAgICAgIH1cblxuICAgICAgcG9pbnQgPSBwb2ludFRvQXJyYXkob3BlcmFuZCk7XG5cbiAgICAgIGRpc3RhbmNlID0gdmFsdWUgPT4ge1xuICAgICAgICBpZiAoIWlzSW5kZXhhYmxlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRpc3RhbmNlQ29vcmRpbmF0ZVBhaXJzKHBvaW50LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBicmFuY2hlZFZhbHVlcyA9PiB7XG4gICAgICAvLyBUaGVyZSBtaWdodCBiZSBtdWx0aXBsZSBwb2ludHMgaW4gdGhlIGRvY3VtZW50IHRoYXQgbWF0Y2ggdGhlIGdpdmVuXG4gICAgICAvLyBmaWVsZC4gT25seSBvbmUgb2YgdGhlbSBuZWVkcyB0byBiZSB3aXRoaW4gJG1heERpc3RhbmNlLCBidXQgd2UgbmVlZCB0b1xuICAgICAgLy8gZXZhbHVhdGUgYWxsIG9mIHRoZW0gYW5kIHVzZSB0aGUgbmVhcmVzdCBvbmUgZm9yIHRoZSBpbXBsaWNpdCBzb3J0XG4gICAgICAvLyBzcGVjaWZpZXIuIChUaGF0J3Mgd2h5IHdlIGNhbid0IGp1c3QgdXNlIEVMRU1FTlRfT1BFUkFUT1JTIGhlcmUuKVxuICAgICAgLy9cbiAgICAgIC8vIE5vdGU6IFRoaXMgZGlmZmVycyBmcm9tIE1vbmdvREIncyBpbXBsZW1lbnRhdGlvbiwgd2hlcmUgYSBkb2N1bWVudCB3aWxsXG4gICAgICAvLyBhY3R1YWxseSBzaG93IHVwICptdWx0aXBsZSB0aW1lcyogaW4gdGhlIHJlc3VsdCBzZXQsIHdpdGggb25lIGVudHJ5IGZvclxuICAgICAgLy8gZWFjaCB3aXRoaW4tJG1heERpc3RhbmNlIGJyYW5jaGluZyBwb2ludC5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtyZXN1bHQ6IGZhbHNlfTtcbiAgICAgIGV4cGFuZEFycmF5c0luQnJhbmNoZXMoYnJhbmNoZWRWYWx1ZXMpLmV2ZXJ5KGJyYW5jaCA9PiB7XG4gICAgICAgIC8vIGlmIG9wZXJhdGlvbiBpcyBhbiB1cGRhdGUsIGRvbid0IHNraXAgYnJhbmNoZXMsIGp1c3QgcmV0dXJuIHRoZSBmaXJzdFxuICAgICAgICAvLyBvbmUgKCMzNTk5KVxuICAgICAgICBsZXQgY3VyRGlzdGFuY2U7XG4gICAgICAgIGlmICghbWF0Y2hlci5faXNVcGRhdGUpIHtcbiAgICAgICAgICBpZiAoISh0eXBlb2YgYnJhbmNoLnZhbHVlID09PSAnb2JqZWN0JykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGN1ckRpc3RhbmNlID0gZGlzdGFuY2UoYnJhbmNoLnZhbHVlKTtcblxuICAgICAgICAgIC8vIFNraXAgYnJhbmNoZXMgdGhhdCBhcmVuJ3QgcmVhbCBwb2ludHMgb3IgYXJlIHRvbyBmYXIgYXdheS5cbiAgICAgICAgICBpZiAoY3VyRGlzdGFuY2UgPT09IG51bGwgfHwgY3VyRGlzdGFuY2UgPiBtYXhEaXN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2tpcCBhbnl0aGluZyB0aGF0J3MgYSB0aWUuXG4gICAgICAgICAgaWYgKHJlc3VsdC5kaXN0YW5jZSAhPT0gdW5kZWZpbmVkICYmIHJlc3VsdC5kaXN0YW5jZSA8PSBjdXJEaXN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0LnJlc3VsdCA9IHRydWU7XG4gICAgICAgIHJlc3VsdC5kaXN0YW5jZSA9IGN1ckRpc3RhbmNlO1xuXG4gICAgICAgIGlmIChicmFuY2guYXJyYXlJbmRpY2VzKSB7XG4gICAgICAgICAgcmVzdWx0LmFycmF5SW5kaWNlcyA9IGJyYW5jaC5hcnJheUluZGljZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIHJlc3VsdC5hcnJheUluZGljZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIW1hdGNoZXIuX2lzVXBkYXRlO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfSxcbn07XG5cbi8vIE5COiBXZSBhcmUgY2hlYXRpbmcgYW5kIHVzaW5nIHRoaXMgZnVuY3Rpb24gdG8gaW1wbGVtZW50ICdBTkQnIGZvciBib3RoXG4vLyAnZG9jdW1lbnQgbWF0Y2hlcnMnIGFuZCAnYnJhbmNoZWQgbWF0Y2hlcnMnLiBUaGV5IGJvdGggcmV0dXJuIHJlc3VsdCBvYmplY3RzXG4vLyBidXQgdGhlIGFyZ3VtZW50IGlzIGRpZmZlcmVudDogZm9yIHRoZSBmb3JtZXIgaXQncyBhIHdob2xlIGRvYywgd2hlcmVhcyBmb3Jcbi8vIHRoZSBsYXR0ZXIgaXQncyBhbiBhcnJheSBvZiAnYnJhbmNoZWQgdmFsdWVzJy5cbmZ1bmN0aW9uIGFuZFNvbWVNYXRjaGVycyhzdWJNYXRjaGVycykge1xuICBpZiAoc3ViTWF0Y2hlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGV2ZXJ5dGhpbmdNYXRjaGVyO1xuICB9XG5cbiAgaWYgKHN1Yk1hdGNoZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBzdWJNYXRjaGVyc1swXTtcbiAgfVxuXG4gIHJldHVybiBkb2NPckJyYW5jaGVzID0+IHtcbiAgICBjb25zdCBtYXRjaCA9IHt9O1xuICAgIG1hdGNoLnJlc3VsdCA9IHN1Yk1hdGNoZXJzLmV2ZXJ5KGZuID0+IHtcbiAgICAgIGNvbnN0IHN1YlJlc3VsdCA9IGZuKGRvY09yQnJhbmNoZXMpO1xuXG4gICAgICAvLyBDb3B5IGEgJ2Rpc3RhbmNlJyBudW1iZXIgb3V0IG9mIHRoZSBmaXJzdCBzdWItbWF0Y2hlciB0aGF0IGhhc1xuICAgICAgLy8gb25lLiBZZXMsIHRoaXMgbWVhbnMgdGhhdCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgJG5lYXIgZmllbGRzIGluIGFcbiAgICAgIC8vIHF1ZXJ5LCBzb21ldGhpbmcgYXJiaXRyYXJ5IGhhcHBlbnM7IHRoaXMgYXBwZWFycyB0byBiZSBjb25zaXN0ZW50IHdpdGhcbiAgICAgIC8vIE1vbmdvLlxuICAgICAgaWYgKHN1YlJlc3VsdC5yZXN1bHQgJiZcbiAgICAgICAgICBzdWJSZXN1bHQuZGlzdGFuY2UgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgIG1hdGNoLmRpc3RhbmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWF0Y2guZGlzdGFuY2UgPSBzdWJSZXN1bHQuZGlzdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbWlsYXJseSwgcHJvcGFnYXRlIGFycmF5SW5kaWNlcyBmcm9tIHN1Yi1tYXRjaGVycy4uLiBidXQgdG8gbWF0Y2hcbiAgICAgIC8vIE1vbmdvREIgYmVoYXZpb3IsIHRoaXMgdGltZSB0aGUgKmxhc3QqIHN1Yi1tYXRjaGVyIHdpdGggYXJyYXlJbmRpY2VzXG4gICAgICAvLyB3aW5zLlxuICAgICAgaWYgKHN1YlJlc3VsdC5yZXN1bHQgJiYgc3ViUmVzdWx0LmFycmF5SW5kaWNlcykge1xuICAgICAgICBtYXRjaC5hcnJheUluZGljZXMgPSBzdWJSZXN1bHQuYXJyYXlJbmRpY2VzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3ViUmVzdWx0LnJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8vIElmIHdlIGRpZG4ndCBhY3R1YWxseSBtYXRjaCwgZm9yZ2V0IGFueSBleHRyYSBtZXRhZGF0YSB3ZSBjYW1lIHVwIHdpdGguXG4gICAgaWYgKCFtYXRjaC5yZXN1bHQpIHtcbiAgICAgIGRlbGV0ZSBtYXRjaC5kaXN0YW5jZTtcbiAgICAgIGRlbGV0ZSBtYXRjaC5hcnJheUluZGljZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9O1xufVxuXG5jb25zdCBhbmREb2N1bWVudE1hdGNoZXJzID0gYW5kU29tZU1hdGNoZXJzO1xuY29uc3QgYW5kQnJhbmNoZWRNYXRjaGVycyA9IGFuZFNvbWVNYXRjaGVycztcblxuZnVuY3Rpb24gY29tcGlsZUFycmF5T2ZEb2N1bWVudFNlbGVjdG9ycyhzZWxlY3RvcnMsIG1hdGNoZXIsIGluRWxlbU1hdGNoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShzZWxlY3RvcnMpIHx8IHNlbGVjdG9ycy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBFcnJvcignJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5Jyk7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3JzLm1hcChzdWJTZWxlY3RvciA9PiB7XG4gICAgaWYgKCFMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3Qoc3ViU2VsZWN0b3IpKSB7XG4gICAgICB0aHJvdyBFcnJvcignJG9yLyRhbmQvJG5vciBlbnRyaWVzIG5lZWQgdG8gYmUgZnVsbCBvYmplY3RzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHN1YlNlbGVjdG9yLCBtYXRjaGVyLCB7aW5FbGVtTWF0Y2h9KTtcbiAgfSk7XG59XG5cbi8vIFRha2VzIGluIGEgc2VsZWN0b3IgdGhhdCBjb3VsZCBtYXRjaCBhIGZ1bGwgZG9jdW1lbnQgKGVnLCB0aGUgb3JpZ2luYWxcbi8vIHNlbGVjdG9yKS4gUmV0dXJucyBhIGZ1bmN0aW9uIG1hcHBpbmcgZG9jdW1lbnQtPnJlc3VsdCBvYmplY3QuXG4vL1xuLy8gbWF0Y2hlciBpcyB0aGUgTWF0Y2hlciBvYmplY3Qgd2UgYXJlIGNvbXBpbGluZy5cbi8vXG4vLyBJZiB0aGlzIGlzIHRoZSByb290IGRvY3VtZW50IHNlbGVjdG9yIChpZSwgbm90IHdyYXBwZWQgaW4gJGFuZCBvciB0aGUgbGlrZSksXG4vLyB0aGVuIGlzUm9vdCBpcyB0cnVlLiAoVGhpcyBpcyB1c2VkIGJ5ICRuZWFyLilcbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcihkb2NTZWxlY3RvciwgbWF0Y2hlciwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGRvY01hdGNoZXJzID0gT2JqZWN0LmtleXMoZG9jU2VsZWN0b3IpLm1hcChrZXkgPT4ge1xuICAgIGNvbnN0IHN1YlNlbGVjdG9yID0gZG9jU2VsZWN0b3Jba2V5XTtcblxuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFoYXNPd24uY2FsbChMT0dJQ0FMX09QRVJBVE9SUywga2V5KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBsb2dpY2FsIG9wZXJhdG9yOiAke2tleX1gKTtcbiAgICAgIH1cblxuICAgICAgbWF0Y2hlci5faXNTaW1wbGUgPSBmYWxzZTtcbiAgICAgIHJldHVybiBMT0dJQ0FMX09QRVJBVE9SU1trZXldKHN1YlNlbGVjdG9yLCBtYXRjaGVyLCBvcHRpb25zLmluRWxlbU1hdGNoKTtcbiAgICB9XG5cbiAgICAvLyBSZWNvcmQgdGhpcyBwYXRoLCBidXQgb25seSBpZiB3ZSBhcmVuJ3QgaW4gYW4gZWxlbU1hdGNoZXIsIHNpbmNlIGluIGFuXG4gICAgLy8gZWxlbU1hdGNoIHRoaXMgaXMgYSBwYXRoIGluc2lkZSBhbiBvYmplY3QgaW4gYW4gYXJyYXksIG5vdCBpbiB0aGUgZG9jXG4gICAgLy8gcm9vdC5cbiAgICBpZiAoIW9wdGlvbnMuaW5FbGVtTWF0Y2gpIHtcbiAgICAgIG1hdGNoZXIuX3JlY29yZFBhdGhVc2VkKGtleSk7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgYWRkIGEgbWF0Y2hlciBpZiBzdWJTZWxlY3RvciBpcyBhIGZ1bmN0aW9uIC0tIHRoaXMgaXMgdG8gbWF0Y2hcbiAgICAvLyB0aGUgYmVoYXZpb3Igb2YgTWV0ZW9yIG9uIHRoZSBzZXJ2ZXIgKGluaGVyaXRlZCBmcm9tIHRoZSBub2RlIG1vbmdvZGJcbiAgICAvLyBkcml2ZXIpLCB3aGljaCBpcyB0byBpZ25vcmUgYW55IHBhcnQgb2YgYSBzZWxlY3RvciB3aGljaCBpcyBhIGZ1bmN0aW9uLlxuICAgIGlmICh0eXBlb2Ygc3ViU2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgbG9va1VwQnlJbmRleCA9IG1ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgIGNvbnN0IHZhbHVlTWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKFxuICAgICAgc3ViU2VsZWN0b3IsXG4gICAgICBtYXRjaGVyLFxuICAgICAgb3B0aW9ucy5pc1Jvb3RcbiAgICApO1xuXG4gICAgcmV0dXJuIGRvYyA9PiB2YWx1ZU1hdGNoZXIobG9va1VwQnlJbmRleChkb2MpKTtcbiAgfSkuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIHJldHVybiBhbmREb2N1bWVudE1hdGNoZXJzKGRvY01hdGNoZXJzKTtcbn1cblxuLy8gVGFrZXMgaW4gYSBzZWxlY3RvciB0aGF0IGNvdWxkIG1hdGNoIGEga2V5LWluZGV4ZWQgdmFsdWUgaW4gYSBkb2N1bWVudDsgZWcsXG4vLyB7JGd0OiA1LCAkbHQ6IDl9LCBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgb3IgYW55IG5vbi1leHByZXNzaW9uIG9iamVjdCAodG9cbi8vIGluZGljYXRlIGVxdWFsaXR5KS4gIFJldHVybnMgYSBicmFuY2hlZCBtYXRjaGVyOiBhIGZ1bmN0aW9uIG1hcHBpbmdcbi8vIFticmFuY2hlZCB2YWx1ZV0tPnJlc3VsdCBvYmplY3QuXG5mdW5jdGlvbiBjb21waWxlVmFsdWVTZWxlY3Rvcih2YWx1ZVNlbGVjdG9yLCBtYXRjaGVyLCBpc1Jvb3QpIHtcbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICBtYXRjaGVyLl9pc1NpbXBsZSA9IGZhbHNlO1xuICAgIHJldHVybiBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlcihcbiAgICAgIHJlZ2V4cEVsZW1lbnRNYXRjaGVyKHZhbHVlU2VsZWN0b3IpXG4gICAgKTtcbiAgfVxuXG4gIGlmIChpc09wZXJhdG9yT2JqZWN0KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIG9wZXJhdG9yQnJhbmNoZWRNYXRjaGVyKHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIsIGlzUm9vdCk7XG4gIH1cblxuICByZXR1cm4gY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoXG4gICAgZXF1YWxpdHlFbGVtZW50TWF0Y2hlcih2YWx1ZVNlbGVjdG9yKVxuICApO1xufVxuXG4vLyBHaXZlbiBhbiBlbGVtZW50IG1hdGNoZXIgKHdoaWNoIGV2YWx1YXRlcyBhIHNpbmdsZSB2YWx1ZSksIHJldHVybnMgYSBicmFuY2hlZFxuLy8gdmFsdWUgKHdoaWNoIGV2YWx1YXRlcyB0aGUgZWxlbWVudCBtYXRjaGVyIG9uIGFsbCB0aGUgYnJhbmNoZXMgYW5kIHJldHVybnMgYVxuLy8gbW9yZSBzdHJ1Y3R1cmVkIHJldHVybiB2YWx1ZSBwb3NzaWJseSBpbmNsdWRpbmcgYXJyYXlJbmRpY2VzKS5cbmZ1bmN0aW9uIGNvbnZlcnRFbGVtZW50TWF0Y2hlclRvQnJhbmNoZWRNYXRjaGVyKGVsZW1lbnRNYXRjaGVyLCBvcHRpb25zID0ge30pIHtcbiAgcmV0dXJuIGJyYW5jaGVzID0+IHtcbiAgICBjb25zdCBleHBhbmRlZCA9IG9wdGlvbnMuZG9udEV4cGFuZExlYWZBcnJheXNcbiAgICAgID8gYnJhbmNoZXNcbiAgICAgIDogZXhwYW5kQXJyYXlzSW5CcmFuY2hlcyhicmFuY2hlcywgb3B0aW9ucy5kb250SW5jbHVkZUxlYWZBcnJheXMpO1xuXG4gICAgY29uc3QgbWF0Y2ggPSB7fTtcbiAgICBtYXRjaC5yZXN1bHQgPSBleHBhbmRlZC5zb21lKGVsZW1lbnQgPT4ge1xuICAgICAgbGV0IG1hdGNoZWQgPSBlbGVtZW50TWF0Y2hlcihlbGVtZW50LnZhbHVlKTtcblxuICAgICAgLy8gU3BlY2lhbCBjYXNlIGZvciAkZWxlbU1hdGNoOiBpdCBtZWFucyBcInRydWUsIGFuZCB1c2UgdGhpcyBhcyBhbiBhcnJheVxuICAgICAgLy8gaW5kZXggaWYgSSBkaWRuJ3QgYWxyZWFkeSBoYXZlIG9uZVwiLlxuICAgICAgaWYgKHR5cGVvZiBtYXRjaGVkID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBYWFggVGhpcyBjb2RlIGRhdGVzIGZyb20gd2hlbiB3ZSBvbmx5IHN0b3JlZCBhIHNpbmdsZSBhcnJheSBpbmRleFxuICAgICAgICAvLyAoZm9yIHRoZSBvdXRlcm1vc3QgYXJyYXkpLiBTaG91bGQgd2UgYmUgYWxzbyBpbmNsdWRpbmcgZGVlcGVyIGFycmF5XG4gICAgICAgIC8vIGluZGljZXMgZnJvbSB0aGUgJGVsZW1NYXRjaCBtYXRjaD9cbiAgICAgICAgaWYgKCFlbGVtZW50LmFycmF5SW5kaWNlcykge1xuICAgICAgICAgIGVsZW1lbnQuYXJyYXlJbmRpY2VzID0gW21hdGNoZWRdO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHNvbWUgZWxlbWVudCBtYXRjaGVkLCBhbmQgaXQncyB0YWdnZWQgd2l0aCBhcnJheSBpbmRpY2VzLCBpbmNsdWRlXG4gICAgICAvLyB0aG9zZSBpbmRpY2VzIGluIG91ciByZXN1bHQgb2JqZWN0LlxuICAgICAgaWYgKG1hdGNoZWQgJiYgZWxlbWVudC5hcnJheUluZGljZXMpIHtcbiAgICAgICAgbWF0Y2guYXJyYXlJbmRpY2VzID0gZWxlbWVudC5hcnJheUluZGljZXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9O1xufVxuXG4vLyBIZWxwZXJzIGZvciAkbmVhci5cbmZ1bmN0aW9uIGRpc3RhbmNlQ29vcmRpbmF0ZVBhaXJzKGEsIGIpIHtcbiAgY29uc3QgcG9pbnRBID0gcG9pbnRUb0FycmF5KGEpO1xuICBjb25zdCBwb2ludEIgPSBwb2ludFRvQXJyYXkoYik7XG5cbiAgcmV0dXJuIE1hdGguaHlwb3QocG9pbnRBWzBdIC0gcG9pbnRCWzBdLCBwb2ludEFbMV0gLSBwb2ludEJbMV0pO1xufVxuXG4vLyBUYWtlcyBzb21ldGhpbmcgdGhhdCBpcyBub3QgYW4gb3BlcmF0b3Igb2JqZWN0IGFuZCByZXR1cm5zIGFuIGVsZW1lbnQgbWF0Y2hlclxuLy8gZm9yIGVxdWFsaXR5IHdpdGggdGhhdCB0aGluZy5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbGl0eUVsZW1lbnRNYXRjaGVyKGVsZW1lbnRTZWxlY3Rvcikge1xuICBpZiAoaXNPcGVyYXRvck9iamVjdChlbGVtZW50U2VsZWN0b3IpKSB7XG4gICAgdGhyb3cgRXJyb3IoJ0NhblxcJ3QgY3JlYXRlIGVxdWFsaXR5VmFsdWVTZWxlY3RvciBmb3Igb3BlcmF0b3Igb2JqZWN0Jyk7XG4gIH1cblxuICAvLyBTcGVjaWFsLWNhc2U6IG51bGwgYW5kIHVuZGVmaW5lZCBhcmUgZXF1YWwgKGlmIHlvdSBnb3QgdW5kZWZpbmVkIGluIHRoZXJlXG4gIC8vIHNvbWV3aGVyZSwgb3IgaWYgeW91IGdvdCBpdCBkdWUgdG8gc29tZSBicmFuY2ggYmVpbmcgbm9uLWV4aXN0ZW50IGluIHRoZVxuICAvLyB3ZWlyZCBzcGVjaWFsIGNhc2UpLCBldmVuIHRob3VnaCB0aGV5IGFyZW4ndCB3aXRoIEVKU09OLmVxdWFscy5cbiAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgaWYgKGVsZW1lbnRTZWxlY3RvciA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHZhbHVlID0+IHZhbHVlID09IG51bGw7XG4gIH1cblxuICByZXR1cm4gdmFsdWUgPT4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChlbGVtZW50U2VsZWN0b3IsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZXZlcnl0aGluZ01hdGNoZXIoZG9jT3JCcmFuY2hlZFZhbHVlcykge1xuICByZXR1cm4ge3Jlc3VsdDogdHJ1ZX07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRBcnJheXNJbkJyYW5jaGVzKGJyYW5jaGVzLCBza2lwVGhlQXJyYXlzKSB7XG4gIGNvbnN0IGJyYW5jaGVzT3V0ID0gW107XG5cbiAgYnJhbmNoZXMuZm9yRWFjaChicmFuY2ggPT4ge1xuICAgIGNvbnN0IHRoaXNJc0FycmF5ID0gQXJyYXkuaXNBcnJheShicmFuY2gudmFsdWUpO1xuXG4gICAgLy8gV2UgaW5jbHVkZSB0aGUgYnJhbmNoIGl0c2VsZiwgKlVOTEVTUyogd2UgaXQncyBhbiBhcnJheSB0aGF0IHdlJ3JlIGdvaW5nXG4gICAgLy8gdG8gaXRlcmF0ZSBhbmQgd2UncmUgdG9sZCB0byBza2lwIGFycmF5cy4gIChUaGF0J3MgcmlnaHQsIHdlIGluY2x1ZGUgc29tZVxuICAgIC8vIGFycmF5cyBldmVuIHNraXBUaGVBcnJheXMgaXMgdHJ1ZTogdGhlc2UgYXJlIGFycmF5cyB0aGF0IHdlcmUgZm91bmQgdmlhXG4gICAgLy8gZXhwbGljaXQgbnVtZXJpY2FsIGluZGljZXMuKVxuICAgIGlmICghKHNraXBUaGVBcnJheXMgJiYgdGhpc0lzQXJyYXkgJiYgIWJyYW5jaC5kb250SXRlcmF0ZSkpIHtcbiAgICAgIGJyYW5jaGVzT3V0LnB1c2goe2FycmF5SW5kaWNlczogYnJhbmNoLmFycmF5SW5kaWNlcywgdmFsdWU6IGJyYW5jaC52YWx1ZX0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzSXNBcnJheSAmJiAhYnJhbmNoLmRvbnRJdGVyYXRlKSB7XG4gICAgICBicmFuY2gudmFsdWUuZm9yRWFjaCgodmFsdWUsIGkpID0+IHtcbiAgICAgICAgYnJhbmNoZXNPdXQucHVzaCh7XG4gICAgICAgICAgYXJyYXlJbmRpY2VzOiAoYnJhbmNoLmFycmF5SW5kaWNlcyB8fCBbXSkuY29uY2F0KGkpLFxuICAgICAgICAgIHZhbHVlXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gYnJhbmNoZXNPdXQ7XG59XG5cbi8vIEhlbHBlcnMgZm9yICRiaXRzQWxsU2V0LyRiaXRzQW55U2V0LyRiaXRzQWxsQ2xlYXIvJGJpdHNBbnlDbGVhci5cbmZ1bmN0aW9uIGdldE9wZXJhbmRCaXRtYXNrKG9wZXJhbmQsIHNlbGVjdG9yKSB7XG4gIC8vIG51bWVyaWMgYml0bWFza1xuICAvLyBZb3UgY2FuIHByb3ZpZGUgYSBudW1lcmljIGJpdG1hc2sgdG8gYmUgbWF0Y2hlZCBhZ2FpbnN0IHRoZSBvcGVyYW5kIGZpZWxkLlxuICAvLyBJdCBtdXN0IGJlIHJlcHJlc2VudGFibGUgYXMgYSBub24tbmVnYXRpdmUgMzItYml0IHNpZ25lZCBpbnRlZ2VyLlxuICAvLyBPdGhlcndpc2UsICRiaXRzQWxsU2V0IHdpbGwgcmV0dXJuIGFuIGVycm9yLlxuICBpZiAoTnVtYmVyLmlzSW50ZWdlcihvcGVyYW5kKSAmJiBvcGVyYW5kID49IDApIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobmV3IEludDMyQXJyYXkoW29wZXJhbmRdKS5idWZmZXIpO1xuICB9XG5cbiAgLy8gYmluZGF0YSBiaXRtYXNrXG4gIC8vIFlvdSBjYW4gYWxzbyB1c2UgYW4gYXJiaXRyYXJpbHkgbGFyZ2UgQmluRGF0YSBpbnN0YW5jZSBhcyBhIGJpdG1hc2suXG4gIGlmIChFSlNPTi5pc0JpbmFyeShvcGVyYW5kKSkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShvcGVyYW5kLmJ1ZmZlcik7XG4gIH1cblxuICAvLyBwb3NpdGlvbiBsaXN0XG4gIC8vIElmIHF1ZXJ5aW5nIGEgbGlzdCBvZiBiaXQgcG9zaXRpb25zLCBlYWNoIDxwb3NpdGlvbj4gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZVxuICAvLyBpbnRlZ2VyLiBCaXQgcG9zaXRpb25zIHN0YXJ0IGF0IDAgZnJvbSB0aGUgbGVhc3Qgc2lnbmlmaWNhbnQgYml0LlxuICBpZiAoQXJyYXkuaXNBcnJheShvcGVyYW5kKSAmJlxuICAgICAgb3BlcmFuZC5ldmVyeSh4ID0+IE51bWJlci5pc0ludGVnZXIoeCkgJiYgeCA+PSAwKSkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigoTWF0aC5tYXgoLi4ub3BlcmFuZCkgPj4gMykgKyAxKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcblxuICAgIG9wZXJhbmQuZm9yRWFjaCh4ID0+IHtcbiAgICAgIHZpZXdbeCA+PiAzXSB8PSAxIDw8ICh4ICYgMHg3KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB2aWV3O1xuICB9XG5cbiAgLy8gYmFkIG9wZXJhbmRcbiAgdGhyb3cgRXJyb3IoXG4gICAgYG9wZXJhbmQgdG8gJHtzZWxlY3Rvcn0gbXVzdCBiZSBhIG51bWVyaWMgYml0bWFzayAocmVwcmVzZW50YWJsZSBhcyBhIGAgK1xuICAgICdub24tbmVnYXRpdmUgMzItYml0IHNpZ25lZCBpbnRlZ2VyKSwgYSBiaW5kYXRhIGJpdG1hc2sgb3IgYW4gYXJyYXkgd2l0aCAnICtcbiAgICAnYml0IHBvc2l0aW9ucyAobm9uLW5lZ2F0aXZlIGludGVnZXJzKSdcbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0VmFsdWVCaXRtYXNrKHZhbHVlLCBsZW5ndGgpIHtcbiAgLy8gVGhlIGZpZWxkIHZhbHVlIG11c3QgYmUgZWl0aGVyIG51bWVyaWNhbCBvciBhIEJpbkRhdGEgaW5zdGFuY2UuIE90aGVyd2lzZSxcbiAgLy8gJGJpdHMuLi4gd2lsbCBub3QgbWF0Y2ggdGhlIGN1cnJlbnQgZG9jdW1lbnQuXG5cbiAgLy8gbnVtZXJpY2FsXG4gIGlmIChOdW1iZXIuaXNTYWZlSW50ZWdlcih2YWx1ZSkpIHtcbiAgICAvLyAkYml0cy4uLiB3aWxsIG5vdCBtYXRjaCBudW1lcmljYWwgdmFsdWVzIHRoYXQgY2Fubm90IGJlIHJlcHJlc2VudGVkIGFzIGFcbiAgICAvLyBzaWduZWQgNjQtYml0IGludGVnZXIuIFRoaXMgY2FuIGJlIHRoZSBjYXNlIGlmIGEgdmFsdWUgaXMgZWl0aGVyIHRvb1xuICAgIC8vIGxhcmdlIG9yIHNtYWxsIHRvIGZpdCBpbiBhIHNpZ25lZCA2NC1iaXQgaW50ZWdlciwgb3IgaWYgaXQgaGFzIGFcbiAgICAvLyBmcmFjdGlvbmFsIGNvbXBvbmVudC5cbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoXG4gICAgICBNYXRoLm1heChsZW5ndGgsIDIgKiBVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVClcbiAgICApO1xuXG4gICAgbGV0IHZpZXcgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyLCAwLCAyKTtcbiAgICB2aWV3WzBdID0gdmFsdWUgJSAoKDEgPDwgMTYpICogKDEgPDwgMTYpKSB8IDA7XG4gICAgdmlld1sxXSA9IHZhbHVlIC8gKCgxIDw8IDE2KSAqICgxIDw8IDE2KSkgfCAwO1xuXG4gICAgLy8gc2lnbiBleHRlbnNpb25cbiAgICBpZiAodmFsdWUgPCAwKSB7XG4gICAgICB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCAyKTtcbiAgICAgIHZpZXcuZm9yRWFjaCgoYnl0ZSwgaSkgPT4ge1xuICAgICAgICB2aWV3W2ldID0gMHhmZjtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICB9XG5cbiAgLy8gYmluZGF0YVxuICBpZiAoRUpTT04uaXNCaW5hcnkodmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHZhbHVlLmJ1ZmZlcik7XG4gIH1cblxuICAvLyBubyBtYXRjaFxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIEFjdHVhbGx5IGluc2VydHMgYSBrZXkgdmFsdWUgaW50byB0aGUgc2VsZWN0b3IgZG9jdW1lbnRcbi8vIEhvd2V2ZXIsIHRoaXMgY2hlY2tzIHRoZXJlIGlzIG5vIGFtYmlndWl0eSBpbiBzZXR0aW5nXG4vLyB0aGUgdmFsdWUgZm9yIHRoZSBnaXZlbiBrZXksIHRocm93cyBvdGhlcndpc2VcbmZ1bmN0aW9uIGluc2VydEludG9Eb2N1bWVudChkb2N1bWVudCwga2V5LCB2YWx1ZSkge1xuICBPYmplY3Qua2V5cyhkb2N1bWVudCkuZm9yRWFjaChleGlzdGluZ0tleSA9PiB7XG4gICAgaWYgKFxuICAgICAgKGV4aXN0aW5nS2V5Lmxlbmd0aCA+IGtleS5sZW5ndGggJiYgZXhpc3RpbmdLZXkuaW5kZXhPZihgJHtrZXl9LmApID09PSAwKSB8fFxuICAgICAgKGtleS5sZW5ndGggPiBleGlzdGluZ0tleS5sZW5ndGggJiYga2V5LmluZGV4T2YoYCR7ZXhpc3RpbmdLZXl9LmApID09PSAwKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgY2Fubm90IGluZmVyIHF1ZXJ5IGZpZWxkcyB0byBzZXQsIGJvdGggcGF0aHMgJyR7ZXhpc3RpbmdLZXl9JyBhbmQgYCArXG4gICAgICAgIGAnJHtrZXl9JyBhcmUgbWF0Y2hlZGBcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChleGlzdGluZ0tleSA9PT0ga2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBjYW5ub3QgaW5mZXIgcXVlcnkgZmllbGRzIHRvIHNldCwgcGF0aCAnJHtrZXl9JyBpcyBtYXRjaGVkIHR3aWNlYFxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRvY3VtZW50W2tleV0gPSB2YWx1ZTtcbn1cblxuLy8gUmV0dXJucyBhIGJyYW5jaGVkIG1hdGNoZXIgdGhhdCBtYXRjaGVzIGlmZiB0aGUgZ2l2ZW4gbWF0Y2hlciBkb2VzIG5vdC5cbi8vIE5vdGUgdGhhdCB0aGlzIGltcGxpY2l0bHkgXCJkZU1vcmdhbml6ZXNcIiB0aGUgd3JhcHBlZCBmdW5jdGlvbi4gIGllLCBpdFxuLy8gbWVhbnMgdGhhdCBBTEwgYnJhbmNoIHZhbHVlcyBuZWVkIHRvIGZhaWwgdG8gbWF0Y2ggaW5uZXJCcmFuY2hlZE1hdGNoZXIuXG5mdW5jdGlvbiBpbnZlcnRCcmFuY2hlZE1hdGNoZXIoYnJhbmNoZWRNYXRjaGVyKSB7XG4gIHJldHVybiBicmFuY2hWYWx1ZXMgPT4ge1xuICAgIC8vIFdlIGV4cGxpY2l0bHkgY2hvb3NlIHRvIHN0cmlwIGFycmF5SW5kaWNlcyBoZXJlOiBpdCBkb2Vzbid0IG1ha2Ugc2Vuc2UgdG9cbiAgICAvLyBzYXkgXCJ1cGRhdGUgdGhlIGFycmF5IGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCBzb21ldGhpbmdcIiwgYXQgbGVhc3RcbiAgICAvLyBpbiBtb25nby1sYW5kLlxuICAgIHJldHVybiB7cmVzdWx0OiAhYnJhbmNoZWRNYXRjaGVyKGJyYW5jaFZhbHVlcykucmVzdWx0fTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhhYmxlKG9iaikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShvYmopIHx8IExvY2FsQ29sbGVjdGlvbi5faXNQbGFpbk9iamVjdChvYmopO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1lcmljS2V5KHMpIHtcbiAgcmV0dXJuIC9eWzAtOV0rJC8udGVzdChzKTtcbn1cblxuLy8gUmV0dXJucyB0cnVlIGlmIHRoaXMgaXMgYW4gb2JqZWN0IHdpdGggYXQgbGVhc3Qgb25lIGtleSBhbmQgYWxsIGtleXMgYmVnaW5cbi8vIHdpdGggJC4gIFVubGVzcyBpbmNvbnNpc3RlbnRPSyBpcyBzZXQsIHRocm93cyBpZiBzb21lIGtleXMgYmVnaW4gd2l0aCAkIGFuZFxuLy8gb3RoZXJzIGRvbid0LlxuZXhwb3J0IGZ1bmN0aW9uIGlzT3BlcmF0b3JPYmplY3QodmFsdWVTZWxlY3RvciwgaW5jb25zaXN0ZW50T0spIHtcbiAgaWYgKCFMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3QodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgdGhlc2VBcmVPcGVyYXRvcnMgPSB1bmRlZmluZWQ7XG4gIE9iamVjdC5rZXlzKHZhbHVlU2VsZWN0b3IpLmZvckVhY2goc2VsS2V5ID0+IHtcbiAgICBjb25zdCB0aGlzSXNPcGVyYXRvciA9IHNlbEtleS5zdWJzdHIoMCwgMSkgPT09ICckJztcblxuICAgIGlmICh0aGVzZUFyZU9wZXJhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGVzZUFyZU9wZXJhdG9ycyA9IHRoaXNJc09wZXJhdG9yO1xuICAgIH0gZWxzZSBpZiAodGhlc2VBcmVPcGVyYXRvcnMgIT09IHRoaXNJc09wZXJhdG9yKSB7XG4gICAgICBpZiAoIWluY29uc2lzdGVudE9LKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSW5jb25zaXN0ZW50IG9wZXJhdG9yOiAke0pTT04uc3RyaW5naWZ5KHZhbHVlU2VsZWN0b3IpfWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgdGhlc2VBcmVPcGVyYXRvcnMgPSBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiAhIXRoZXNlQXJlT3BlcmF0b3JzOyAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59XG5cbi8vIEhlbHBlciBmb3IgJGx0LyRndC8kbHRlLyRndGUuXG5mdW5jdGlvbiBtYWtlSW5lcXVhbGl0eShjbXBWYWx1ZUNvbXBhcmF0b3IpIHtcbiAgcmV0dXJuIHtcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIC8vIEFycmF5cyBuZXZlciBjb21wYXJlIGZhbHNlIHdpdGggbm9uLWFycmF5cyBmb3IgYW55IGluZXF1YWxpdHkuXG4gICAgICAvLyBYWFggVGhpcyB3YXMgYmVoYXZpb3Igd2Ugb2JzZXJ2ZWQgaW4gcHJlLXJlbGVhc2UgTW9uZ29EQiAyLjUsIGJ1dFxuICAgICAgLy8gICAgIGl0IHNlZW1zIHRvIGhhdmUgYmVlbiByZXZlcnRlZC5cbiAgICAgIC8vICAgICBTZWUgaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMTE0NDRcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wZXJhbmQpKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gU3BlY2lhbCBjYXNlOiBjb25zaWRlciB1bmRlZmluZWQgYW5kIG51bGwgdGhlIHNhbWUgKHNvIHRydWUgd2l0aFxuICAgICAgLy8gJGd0ZS8kbHRlKS5cbiAgICAgIGlmIChvcGVyYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9wZXJhbmRUeXBlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKG9wZXJhbmQpO1xuXG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbXBhcmlzb25zIGFyZSBuZXZlciB0cnVlIGFtb25nIHRoaW5ncyBvZiBkaWZmZXJlbnQgdHlwZSAoZXhjZXB0XG4gICAgICAgIC8vIG51bGwgdnMgdW5kZWZpbmVkKS5cbiAgICAgICAgaWYgKExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZSh2YWx1ZSkgIT09IG9wZXJhbmRUeXBlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNtcFZhbHVlQ29tcGFyYXRvcihMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh2YWx1ZSwgb3BlcmFuZCkpO1xuICAgICAgfTtcbiAgICB9LFxuICB9O1xufVxuXG4vLyBtYWtlTG9va3VwRnVuY3Rpb24oa2V5KSByZXR1cm5zIGEgbG9va3VwIGZ1bmN0aW9uLlxuLy9cbi8vIEEgbG9va3VwIGZ1bmN0aW9uIHRha2VzIGluIGEgZG9jdW1lbnQgYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmdcbi8vIGJyYW5jaGVzLiAgSWYgbm8gYXJyYXlzIGFyZSBmb3VuZCB3aGlsZSBsb29raW5nIHVwIHRoZSBrZXksIHRoaXMgYXJyYXkgd2lsbFxuLy8gaGF2ZSBleGFjdGx5IG9uZSBicmFuY2hlcyAocG9zc2libHkgJ3VuZGVmaW5lZCcsIGlmIHNvbWUgc2VnbWVudCBvZiB0aGUga2V5XG4vLyB3YXMgbm90IGZvdW5kKS5cbi8vXG4vLyBJZiBhcnJheXMgYXJlIGZvdW5kIGluIHRoZSBtaWRkbGUsIHRoaXMgY2FuIGhhdmUgbW9yZSB0aGFuIG9uZSBlbGVtZW50LCBzaW5jZVxuLy8gd2UgJ2JyYW5jaCcuIFdoZW4gd2UgJ2JyYW5jaCcsIGlmIHRoZXJlIGFyZSBtb3JlIGtleSBzZWdtZW50cyB0byBsb29rIHVwLFxuLy8gdGhlbiB3ZSBvbmx5IHB1cnN1ZSBicmFuY2hlcyB0aGF0IGFyZSBwbGFpbiBvYmplY3RzIChub3QgYXJyYXlzIG9yIHNjYWxhcnMpLlxuLy8gVGhpcyBtZWFucyB3ZSBjYW4gYWN0dWFsbHkgZW5kIHVwIHdpdGggbm8gYnJhbmNoZXMhXG4vL1xuLy8gV2UgZG8gKk5PVCogYnJhbmNoIG9uIGFycmF5cyB0aGF0IGFyZSBmb3VuZCBhdCB0aGUgZW5kIChpZSwgYXQgdGhlIGxhc3Rcbi8vIGRvdHRlZCBtZW1iZXIgb2YgdGhlIGtleSkuIFdlIGp1c3QgcmV0dXJuIHRoYXQgYXJyYXk7IGlmIHlvdSB3YW50IHRvXG4vLyBlZmZlY3RpdmVseSAnYnJhbmNoJyBvdmVyIHRoZSBhcnJheSdzIHZhbHVlcywgcG9zdC1wcm9jZXNzIHRoZSBsb29rdXBcbi8vIGZ1bmN0aW9uIHdpdGggZXhwYW5kQXJyYXlzSW5CcmFuY2hlcy5cbi8vXG4vLyBFYWNoIGJyYW5jaCBpcyBhbiBvYmplY3Qgd2l0aCBrZXlzOlxuLy8gIC0gdmFsdWU6IHRoZSB2YWx1ZSBhdCB0aGUgYnJhbmNoXG4vLyAgLSBkb250SXRlcmF0ZTogYW4gb3B0aW9uYWwgYm9vbDsgaWYgdHJ1ZSwgaXQgbWVhbnMgdGhhdCAndmFsdWUnIGlzIGFuIGFycmF5XG4vLyAgICB0aGF0IGV4cGFuZEFycmF5c0luQnJhbmNoZXMgc2hvdWxkIE5PVCBleHBhbmQuIFRoaXMgc3BlY2lmaWNhbGx5IGhhcHBlbnNcbi8vICAgIHdoZW4gdGhlcmUgaXMgYSBudW1lcmljIGluZGV4IGluIHRoZSBrZXksIGFuZCBlbnN1cmVzIHRoZVxuLy8gICAgcGVyaGFwcy1zdXJwcmlzaW5nIE1vbmdvREIgYmVoYXZpb3Igd2hlcmUgeydhLjAnOiA1fSBkb2VzIE5PVFxuLy8gICAgbWF0Y2gge2E6IFtbNV1dfS5cbi8vICAtIGFycmF5SW5kaWNlczogaWYgYW55IGFycmF5IGluZGV4aW5nIHdhcyBkb25lIGR1cmluZyBsb29rdXAgKGVpdGhlciBkdWUgdG9cbi8vICAgIGV4cGxpY2l0IG51bWVyaWMgaW5kaWNlcyBvciBpbXBsaWNpdCBicmFuY2hpbmcpLCB0aGlzIHdpbGwgYmUgYW4gYXJyYXkgb2Zcbi8vICAgIHRoZSBhcnJheSBpbmRpY2VzIHVzZWQsIGZyb20gb3V0ZXJtb3N0IHRvIGlubmVybW9zdDsgaXQgaXMgZmFsc2V5IG9yXG4vLyAgICBhYnNlbnQgaWYgbm8gYXJyYXkgaW5kZXggaXMgdXNlZC4gSWYgYW4gZXhwbGljaXQgbnVtZXJpYyBpbmRleCBpcyB1c2VkLFxuLy8gICAgdGhlIGluZGV4IHdpbGwgYmUgZm9sbG93ZWQgaW4gYXJyYXlJbmRpY2VzIGJ5IHRoZSBzdHJpbmcgJ3gnLlxuLy9cbi8vICAgIE5vdGU6IGFycmF5SW5kaWNlcyBpcyB1c2VkIGZvciB0d28gcHVycG9zZXMuIEZpcnN0LCBpdCBpcyB1c2VkIHRvXG4vLyAgICBpbXBsZW1lbnQgdGhlICckJyBtb2RpZmllciBmZWF0dXJlLCB3aGljaCBvbmx5IGV2ZXIgbG9va3MgYXQgaXRzIGZpcnN0XG4vLyAgICBlbGVtZW50LlxuLy9cbi8vICAgIFNlY29uZCwgaXQgaXMgdXNlZCBmb3Igc29ydCBrZXkgZ2VuZXJhdGlvbiwgd2hpY2ggbmVlZHMgdG8gYmUgYWJsZSB0byB0ZWxsXG4vLyAgICB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGRpZmZlcmVudCBwYXRocy4gTW9yZW92ZXIsIGl0IG5lZWRzIHRvXG4vLyAgICBkaWZmZXJlbnRpYXRlIGJldHdlZW4gZXhwbGljaXQgYW5kIGltcGxpY2l0IGJyYW5jaGluZywgd2hpY2ggaXMgd2h5XG4vLyAgICB0aGVyZSdzIHRoZSBzb21ld2hhdCBoYWNreSAneCcgZW50cnk6IHRoaXMgbWVhbnMgdGhhdCBleHBsaWNpdCBhbmRcbi8vICAgIGltcGxpY2l0IGFycmF5IGxvb2t1cHMgd2lsbCBoYXZlIGRpZmZlcmVudCBmdWxsIGFycmF5SW5kaWNlcyBwYXRocy4gKFRoYXRcbi8vICAgIGNvZGUgb25seSByZXF1aXJlcyB0aGF0IGRpZmZlcmVudCBwYXRocyBoYXZlIGRpZmZlcmVudCBhcnJheUluZGljZXM7IGl0XG4vLyAgICBkb2Vzbid0IGFjdHVhbGx5ICdwYXJzZScgYXJyYXlJbmRpY2VzLiBBcyBhbiBhbHRlcm5hdGl2ZSwgYXJyYXlJbmRpY2VzXG4vLyAgICBjb3VsZCBjb250YWluIG9iamVjdHMgd2l0aCBmbGFncyBsaWtlICdpbXBsaWNpdCcsIGJ1dCBJIHRoaW5rIHRoYXQgb25seVxuLy8gICAgbWFrZXMgdGhlIGNvZGUgc3Vycm91bmRpbmcgdGhlbSBtb3JlIGNvbXBsZXguKVxuLy9cbi8vICAgIChCeSB0aGUgd2F5LCB0aGlzIGZpZWxkIGVuZHMgdXAgZ2V0dGluZyBwYXNzZWQgYXJvdW5kIGEgbG90IHdpdGhvdXRcbi8vICAgIGNsb25pbmcsIHNvIG5ldmVyIG11dGF0ZSBhbnkgYXJyYXlJbmRpY2VzIGZpZWxkL3ZhciBpbiB0aGlzIHBhY2thZ2UhKVxuLy9cbi8vXG4vLyBBdCB0aGUgdG9wIGxldmVsLCB5b3UgbWF5IG9ubHkgcGFzcyBpbiBhIHBsYWluIG9iamVjdCBvciBhcnJheS5cbi8vXG4vLyBTZWUgdGhlIHRlc3QgJ21pbmltb25nbyAtIGxvb2t1cCcgZm9yIHNvbWUgZXhhbXBsZXMgb2Ygd2hhdCBsb29rdXAgZnVuY3Rpb25zXG4vLyByZXR1cm4uXG5leHBvcnQgZnVuY3Rpb24gbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHBhcnRzID0ga2V5LnNwbGl0KCcuJyk7XG4gIGNvbnN0IGZpcnN0UGFydCA9IHBhcnRzLmxlbmd0aCA/IHBhcnRzWzBdIDogJyc7XG4gIGNvbnN0IGxvb2t1cFJlc3QgPSAoXG4gICAgcGFydHMubGVuZ3RoID4gMSAmJlxuICAgIG1ha2VMb29rdXBGdW5jdGlvbihwYXJ0cy5zbGljZSgxKS5qb2luKCcuJykpXG4gICk7XG5cbiAgY29uc3Qgb21pdFVubmVjZXNzYXJ5RmllbGRzID0gcmVzdWx0ID0+IHtcbiAgICBpZiAoIXJlc3VsdC5kb250SXRlcmF0ZSkge1xuICAgICAgZGVsZXRlIHJlc3VsdC5kb250SXRlcmF0ZTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LmFycmF5SW5kaWNlcyAmJiAhcmVzdWx0LmFycmF5SW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgIGRlbGV0ZSByZXN1bHQuYXJyYXlJbmRpY2VzO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gRG9jIHdpbGwgYWx3YXlzIGJlIGEgcGxhaW4gb2JqZWN0IG9yIGFuIGFycmF5LlxuICAvLyBhcHBseSBhbiBleHBsaWNpdCBudW1lcmljIGluZGV4LCBhbiBhcnJheS5cbiAgcmV0dXJuIChkb2MsIGFycmF5SW5kaWNlcyA9IFtdKSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgLy8gSWYgd2UncmUgYmVpbmcgYXNrZWQgdG8gZG8gYW4gaW52YWxpZCBsb29rdXAgaW50byBhbiBhcnJheSAobm9uLWludGVnZXJcbiAgICAgIC8vIG9yIG91dC1vZi1ib3VuZHMpLCByZXR1cm4gbm8gcmVzdWx0cyAod2hpY2ggaXMgZGlmZmVyZW50IGZyb20gcmV0dXJuaW5nXG4gICAgICAvLyBhIHNpbmdsZSB1bmRlZmluZWQgcmVzdWx0LCBpbiB0aGF0IGBudWxsYCBlcXVhbGl0eSBjaGVja3Mgd29uJ3QgbWF0Y2gpLlxuICAgICAgaWYgKCEoaXNOdW1lcmljS2V5KGZpcnN0UGFydCkgJiYgZmlyc3RQYXJ0IDwgZG9jLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1lbWJlciB0aGF0IHdlIHVzZWQgdGhpcyBhcnJheSBpbmRleC4gSW5jbHVkZSBhbiAneCcgdG8gaW5kaWNhdGUgdGhhdFxuICAgICAgLy8gdGhlIHByZXZpb3VzIGluZGV4IGNhbWUgZnJvbSBiZWluZyBjb25zaWRlcmVkIGFzIGFuIGV4cGxpY2l0IGFycmF5XG4gICAgICAvLyBpbmRleCAobm90IGJyYW5jaGluZykuXG4gICAgICBhcnJheUluZGljZXMgPSBhcnJheUluZGljZXMuY29uY2F0KCtmaXJzdFBhcnQsICd4Jyk7XG4gICAgfVxuXG4gICAgLy8gRG8gb3VyIGZpcnN0IGxvb2t1cC5cbiAgICBjb25zdCBmaXJzdExldmVsID0gZG9jW2ZpcnN0UGFydF07XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBubyBkZWVwZXIgdG8gZGlnLCByZXR1cm4gd2hhdCB3ZSBmb3VuZC5cbiAgICAvL1xuICAgIC8vIElmIHdoYXQgd2UgZm91bmQgaXMgYW4gYXJyYXksIG1vc3QgdmFsdWUgc2VsZWN0b3JzIHdpbGwgY2hvb3NlIHRvIHRyZWF0XG4gICAgLy8gdGhlIGVsZW1lbnRzIG9mIHRoZSBhcnJheSBhcyBtYXRjaGFibGUgdmFsdWVzIGluIHRoZWlyIG93biByaWdodCwgYnV0XG4gICAgLy8gdGhhdCdzIGRvbmUgb3V0c2lkZSBvZiB0aGUgbG9va3VwIGZ1bmN0aW9uLiAoRXhjZXB0aW9ucyB0byB0aGlzIGFyZSAkc2l6ZVxuICAgIC8vIGFuZCBzdHVmZiByZWxhdGluZyB0byAkZWxlbU1hdGNoLiAgZWcsIHthOiB7JHNpemU6IDJ9fSBkb2VzIG5vdCBtYXRjaCB7YTpcbiAgICAvLyBbWzEsIDJdXX0uKVxuICAgIC8vXG4gICAgLy8gVGhhdCBzYWlkLCBpZiB3ZSBqdXN0IGRpZCBhbiAqZXhwbGljaXQqIGFycmF5IGxvb2t1cCAob24gZG9jKSB0byBmaW5kXG4gICAgLy8gZmlyc3RMZXZlbCwgYW5kIGZpcnN0TGV2ZWwgaXMgYW4gYXJyYXkgdG9vLCB3ZSBkbyBOT1Qgd2FudCB2YWx1ZVxuICAgIC8vIHNlbGVjdG9ycyB0byBpdGVyYXRlIG92ZXIgaXQuICBlZywgeydhLjAnOiA1fSBkb2VzIG5vdCBtYXRjaCB7YTogW1s1XV19LlxuICAgIC8vIFNvIGluIHRoYXQgY2FzZSwgd2UgbWFyayB0aGUgcmV0dXJuIHZhbHVlIGFzICdkb24ndCBpdGVyYXRlJy5cbiAgICBpZiAoIWxvb2t1cFJlc3QpIHtcbiAgICAgIHJldHVybiBbb21pdFVubmVjZXNzYXJ5RmllbGRzKHtcbiAgICAgICAgYXJyYXlJbmRpY2VzLFxuICAgICAgICBkb250SXRlcmF0ZTogQXJyYXkuaXNBcnJheShkb2MpICYmIEFycmF5LmlzQXJyYXkoZmlyc3RMZXZlbCksXG4gICAgICAgIHZhbHVlOiBmaXJzdExldmVsXG4gICAgICB9KV07XG4gICAgfVxuXG4gICAgLy8gV2UgbmVlZCB0byBkaWcgZGVlcGVyLiAgQnV0IGlmIHdlIGNhbid0LCBiZWNhdXNlIHdoYXQgd2UndmUgZm91bmQgaXMgbm90XG4gICAgLy8gYW4gYXJyYXkgb3IgcGxhaW4gb2JqZWN0LCB3ZSdyZSBkb25lLiBJZiB3ZSBqdXN0IGRpZCBhIG51bWVyaWMgaW5kZXggaW50b1xuICAgIC8vIGFuIGFycmF5LCB3ZSByZXR1cm4gbm90aGluZyBoZXJlICh0aGlzIGlzIGEgY2hhbmdlIGluIE1vbmdvIDIuNSBmcm9tXG4gICAgLy8gTW9uZ28gMi40LCB3aGVyZSB7J2EuMC5iJzogbnVsbH0gc3RvcHBlZCBtYXRjaGluZyB7YTogWzVdfSkuIE90aGVyd2lzZSxcbiAgICAvLyByZXR1cm4gYSBzaW5nbGUgYHVuZGVmaW5lZGAgKHdoaWNoIGNhbiwgZm9yIGV4YW1wbGUsIG1hdGNoIHZpYSBlcXVhbGl0eVxuICAgIC8vIHdpdGggYG51bGxgKS5cbiAgICBpZiAoIWlzSW5kZXhhYmxlKGZpcnN0TGV2ZWwpKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtvbWl0VW5uZWNlc3NhcnlGaWVsZHMoe2FycmF5SW5kaWNlcywgdmFsdWU6IHVuZGVmaW5lZH0pXTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICBjb25zdCBhcHBlbmRUb1Jlc3VsdCA9IG1vcmUgPT4ge1xuICAgICAgcmVzdWx0LnB1c2goLi4ubW9yZSk7XG4gICAgfTtcblxuICAgIC8vIERpZyBkZWVwZXI6IGxvb2sgdXAgdGhlIHJlc3Qgb2YgdGhlIHBhcnRzIG9uIHdoYXRldmVyIHdlJ3ZlIGZvdW5kLlxuICAgIC8vIChsb29rdXBSZXN0IGlzIHNtYXJ0IGVub3VnaCB0byBub3QgdHJ5IHRvIGRvIGludmFsaWQgbG9va3VwcyBpbnRvXG4gICAgLy8gZmlyc3RMZXZlbCBpZiBpdCdzIGFuIGFycmF5LilcbiAgICBhcHBlbmRUb1Jlc3VsdChsb29rdXBSZXN0KGZpcnN0TGV2ZWwsIGFycmF5SW5kaWNlcykpO1xuXG4gICAgLy8gSWYgd2UgZm91bmQgYW4gYXJyYXksIHRoZW4gaW4gKmFkZGl0aW9uKiB0byBwb3RlbnRpYWxseSB0cmVhdGluZyB0aGUgbmV4dFxuICAgIC8vIHBhcnQgYXMgYSBsaXRlcmFsIGludGVnZXIgbG9va3VwLCB3ZSBzaG91bGQgYWxzbyAnYnJhbmNoJzogdHJ5IHRvIGxvb2sgdXBcbiAgICAvLyB0aGUgcmVzdCBvZiB0aGUgcGFydHMgb24gZWFjaCBhcnJheSBlbGVtZW50IGluIHBhcmFsbGVsLlxuICAgIC8vXG4gICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSAqb25seSogZGlnIGRlZXBlciBpbnRvIGFycmF5IGVsZW1lbnRzIHRoYXQgYXJlIHBsYWluXG4gICAgLy8gb2JqZWN0cy4gKFJlY2FsbCB0aGF0IHdlIG9ubHkgZ290IHRoaXMgZmFyIGlmIHdlIGhhdmUgZnVydGhlciB0byBkaWcuKVxuICAgIC8vIFRoaXMgbWFrZXMgc2Vuc2U6IHdlIGNlcnRhaW5seSBkb24ndCBkaWcgZGVlcGVyIGludG8gbm9uLWluZGV4YWJsZVxuICAgIC8vIG9iamVjdHMuIEFuZCBpdCB3b3VsZCBiZSB3ZWlyZCB0byBkaWcgaW50byBhbiBhcnJheTogaXQncyBzaW1wbGVyIHRvIGhhdmVcbiAgICAvLyBhIHJ1bGUgdGhhdCBleHBsaWNpdCBpbnRlZ2VyIGluZGV4ZXMgb25seSBhcHBseSB0byBhbiBvdXRlciBhcnJheSwgbm90IHRvXG4gICAgLy8gYW4gYXJyYXkgeW91IGZpbmQgYWZ0ZXIgYSBicmFuY2hpbmcgc2VhcmNoLlxuICAgIC8vXG4gICAgLy8gSW4gdGhlIHNwZWNpYWwgY2FzZSBvZiBhIG51bWVyaWMgcGFydCBpbiBhICpzb3J0IHNlbGVjdG9yKiAobm90IGEgcXVlcnlcbiAgICAvLyBzZWxlY3RvciksIHdlIHNraXAgdGhlIGJyYW5jaGluZzogd2UgT05MWSBhbGxvdyB0aGUgbnVtZXJpYyBwYXJ0IHRvIG1lYW5cbiAgICAvLyAnbG9vayB1cCB0aGlzIGluZGV4JyBpbiB0aGF0IGNhc2UsIG5vdCAnYWxzbyBsb29rIHVwIHRoaXMgaW5kZXggaW4gYWxsXG4gICAgLy8gdGhlIGVsZW1lbnRzIG9mIHRoZSBhcnJheScuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmlyc3RMZXZlbCkgJiZcbiAgICAgICAgIShpc051bWVyaWNLZXkocGFydHNbMV0pICYmIG9wdGlvbnMuZm9yU29ydCkpIHtcbiAgICAgIGZpcnN0TGV2ZWwuZm9yRWFjaCgoYnJhbmNoLCBhcnJheUluZGV4KSA9PiB7XG4gICAgICAgIGlmIChMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3QoYnJhbmNoKSkge1xuICAgICAgICAgIGFwcGVuZFRvUmVzdWx0KGxvb2t1cFJlc3QoYnJhbmNoLCBhcnJheUluZGljZXMuY29uY2F0KGFycmF5SW5kZXgpKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbi8vIE9iamVjdCBleHBvcnRlZCBvbmx5IGZvciB1bml0IHRlc3RpbmcuXG4vLyBVc2UgaXQgdG8gZXhwb3J0IHByaXZhdGUgZnVuY3Rpb25zIHRvIHRlc3QgaW4gVGlueXRlc3QuXG5NaW5pbW9uZ29UZXN0ID0ge21ha2VMb29rdXBGdW5jdGlvbn07XG5NaW5pbW9uZ29FcnJvciA9IChtZXNzYWdlLCBvcHRpb25zID0ge30pID0+IHtcbiAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJyAmJiBvcHRpb25zLmZpZWxkKSB7XG4gICAgbWVzc2FnZSArPSBgIGZvciBmaWVsZCAnJHtvcHRpb25zLmZpZWxkfSdgO1xuICB9XG5cbiAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIGVycm9yLm5hbWUgPSAnTWluaW1vbmdvRXJyb3InO1xuICByZXR1cm4gZXJyb3I7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm90aGluZ01hdGNoZXIoZG9jT3JCcmFuY2hlZFZhbHVlcykge1xuICByZXR1cm4ge3Jlc3VsdDogZmFsc2V9O1xufVxuXG4vLyBUYWtlcyBhbiBvcGVyYXRvciBvYmplY3QgKGFuIG9iamVjdCB3aXRoICQga2V5cykgYW5kIHJldHVybnMgYSBicmFuY2hlZFxuLy8gbWF0Y2hlciBmb3IgaXQuXG5mdW5jdGlvbiBvcGVyYXRvckJyYW5jaGVkTWF0Y2hlcih2YWx1ZVNlbGVjdG9yLCBtYXRjaGVyLCBpc1Jvb3QpIHtcbiAgLy8gRWFjaCB2YWx1ZVNlbGVjdG9yIHdvcmtzIHNlcGFyYXRlbHkgb24gdGhlIHZhcmlvdXMgYnJhbmNoZXMuICBTbyBvbmVcbiAgLy8gb3BlcmF0b3IgY2FuIG1hdGNoIG9uZSBicmFuY2ggYW5kIGFub3RoZXIgY2FuIG1hdGNoIGFub3RoZXIgYnJhbmNoLiAgVGhpc1xuICAvLyBpcyBPSy5cbiAgY29uc3Qgb3BlcmF0b3JNYXRjaGVycyA9IE9iamVjdC5rZXlzKHZhbHVlU2VsZWN0b3IpLm1hcChvcGVyYXRvciA9PiB7XG4gICAgY29uc3Qgb3BlcmFuZCA9IHZhbHVlU2VsZWN0b3Jbb3BlcmF0b3JdO1xuXG4gICAgY29uc3Qgc2ltcGxlUmFuZ2UgPSAoXG4gICAgICBbJyRsdCcsICckbHRlJywgJyRndCcsICckZ3RlJ10uaW5jbHVkZXMob3BlcmF0b3IpICYmXG4gICAgICB0eXBlb2Ygb3BlcmFuZCA9PT0gJ251bWJlcidcbiAgICApO1xuXG4gICAgY29uc3Qgc2ltcGxlRXF1YWxpdHkgPSAoXG4gICAgICBbJyRuZScsICckZXEnXS5pbmNsdWRlcyhvcGVyYXRvcikgJiZcbiAgICAgIG9wZXJhbmQgIT09IE9iamVjdChvcGVyYW5kKVxuICAgICk7XG5cbiAgICBjb25zdCBzaW1wbGVJbmNsdXNpb24gPSAoXG4gICAgICBbJyRpbicsICckbmluJ10uaW5jbHVkZXMob3BlcmF0b3IpXG4gICAgICAmJiBBcnJheS5pc0FycmF5KG9wZXJhbmQpXG4gICAgICAmJiAhb3BlcmFuZC5zb21lKHggPT4geCA9PT0gT2JqZWN0KHgpKVxuICAgICk7XG5cbiAgICBpZiAoIShzaW1wbGVSYW5nZSB8fCBzaW1wbGVJbmNsdXNpb24gfHwgc2ltcGxlRXF1YWxpdHkpKSB7XG4gICAgICBtYXRjaGVyLl9pc1NpbXBsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChoYXNPd24uY2FsbChWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSkge1xuICAgICAgcmV0dXJuIFZBTFVFX09QRVJBVE9SU1tvcGVyYXRvcl0ob3BlcmFuZCwgdmFsdWVTZWxlY3RvciwgbWF0Y2hlciwgaXNSb290KTtcbiAgICB9XG5cbiAgICBpZiAoaGFzT3duLmNhbGwoRUxFTUVOVF9PUEVSQVRPUlMsIG9wZXJhdG9yKSkge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IEVMRU1FTlRfT1BFUkFUT1JTW29wZXJhdG9yXTtcbiAgICAgIHJldHVybiBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlcihcbiAgICAgICAgb3B0aW9ucy5jb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIpLFxuICAgICAgICBvcHRpb25zXG4gICAgICApO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIG9wZXJhdG9yOiAke29wZXJhdG9yfWApO1xuICB9KTtcblxuICByZXR1cm4gYW5kQnJhbmNoZWRNYXRjaGVycyhvcGVyYXRvck1hdGNoZXJzKTtcbn1cblxuLy8gcGF0aHMgLSBBcnJheTogbGlzdCBvZiBtb25nbyBzdHlsZSBwYXRoc1xuLy8gbmV3TGVhZkZuIC0gRnVuY3Rpb246IG9mIGZvcm0gZnVuY3Rpb24ocGF0aCkgc2hvdWxkIHJldHVybiBhIHNjYWxhciB2YWx1ZSB0b1xuLy8gICAgICAgICAgICAgICAgICAgICAgIHB1dCBpbnRvIGxpc3QgY3JlYXRlZCBmb3IgdGhhdCBwYXRoXG4vLyBjb25mbGljdEZuIC0gRnVuY3Rpb246IG9mIGZvcm0gZnVuY3Rpb24obm9kZSwgcGF0aCwgZnVsbFBhdGgpIGlzIGNhbGxlZFxuLy8gICAgICAgICAgICAgICAgICAgICAgICB3aGVuIGJ1aWxkaW5nIGEgdHJlZSBwYXRoIGZvciAnZnVsbFBhdGgnIG5vZGUgb25cbi8vICAgICAgICAgICAgICAgICAgICAgICAgJ3BhdGgnIHdhcyBhbHJlYWR5IGEgbGVhZiB3aXRoIGEgdmFsdWUuIE11c3QgcmV0dXJuIGFcbi8vICAgICAgICAgICAgICAgICAgICAgICAgY29uZmxpY3QgcmVzb2x1dGlvbi5cbi8vIGluaXRpYWwgdHJlZSAtIE9wdGlvbmFsIE9iamVjdDogc3RhcnRpbmcgdHJlZS5cbi8vIEByZXR1cm5zIC0gT2JqZWN0OiB0cmVlIHJlcHJlc2VudGVkIGFzIGEgc2V0IG9mIG5lc3RlZCBvYmplY3RzXG5leHBvcnQgZnVuY3Rpb24gcGF0aHNUb1RyZWUocGF0aHMsIG5ld0xlYWZGbiwgY29uZmxpY3RGbiwgcm9vdCA9IHt9KSB7XG4gIHBhdGhzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgY29uc3QgcGF0aEFycmF5ID0gcGF0aC5zcGxpdCgnLicpO1xuICAgIGxldCB0cmVlID0gcm9vdDtcblxuICAgIC8vIHVzZSAuZXZlcnkganVzdCBmb3IgaXRlcmF0aW9uIHdpdGggYnJlYWtcbiAgICBjb25zdCBzdWNjZXNzID0gcGF0aEFycmF5LnNsaWNlKDAsIC0xKS5ldmVyeSgoa2V5LCBpKSA9PiB7XG4gICAgICBpZiAoIWhhc093bi5jYWxsKHRyZWUsIGtleSkpIHtcbiAgICAgICAgdHJlZVtrZXldID0ge307XG4gICAgICB9IGVsc2UgaWYgKHRyZWVba2V5XSAhPT0gT2JqZWN0KHRyZWVba2V5XSkpIHtcbiAgICAgICAgdHJlZVtrZXldID0gY29uZmxpY3RGbihcbiAgICAgICAgICB0cmVlW2tleV0sXG4gICAgICAgICAgcGF0aEFycmF5LnNsaWNlKDAsIGkgKyAxKS5qb2luKCcuJyksXG4gICAgICAgICAgcGF0aFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIGJyZWFrIG91dCBvZiBsb29wIGlmIHdlIGFyZSBmYWlsaW5nIGZvciB0aGlzIHBhdGhcbiAgICAgICAgaWYgKHRyZWVba2V5XSAhPT0gT2JqZWN0KHRyZWVba2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHJlZSA9IHRyZWVba2V5XTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgY29uc3QgbGFzdEtleSA9IHBhdGhBcnJheVtwYXRoQXJyYXkubGVuZ3RoIC0gMV07XG4gICAgICBpZiAoaGFzT3duLmNhbGwodHJlZSwgbGFzdEtleSkpIHtcbiAgICAgICAgdHJlZVtsYXN0S2V5XSA9IGNvbmZsaWN0Rm4odHJlZVtsYXN0S2V5XSwgcGF0aCwgcGF0aCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmVlW2xhc3RLZXldID0gbmV3TGVhZkZuKHBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJvb3Q7XG59XG5cbi8vIE1ha2VzIHN1cmUgd2UgZ2V0IDIgZWxlbWVudHMgYXJyYXkgYW5kIGFzc3VtZSB0aGUgZmlyc3Qgb25lIHRvIGJlIHggYW5kXG4vLyB0aGUgc2Vjb25kIG9uZSB0byB5IG5vIG1hdHRlciB3aGF0IHVzZXIgcGFzc2VzLlxuLy8gSW4gY2FzZSB1c2VyIHBhc3NlcyB7IGxvbjogeCwgbGF0OiB5IH0gcmV0dXJucyBbeCwgeV1cbmZ1bmN0aW9uIHBvaW50VG9BcnJheShwb2ludCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShwb2ludCkgPyBwb2ludC5zbGljZSgpIDogW3BvaW50LngsIHBvaW50LnldO1xufVxuXG4vLyBDcmVhdGluZyBhIGRvY3VtZW50IGZyb20gYW4gdXBzZXJ0IGlzIHF1aXRlIHRyaWNreS5cbi8vIEUuZy4gdGhpcyBzZWxlY3Rvcjoge1wiJG9yXCI6IFt7XCJiLmZvb1wiOiB7XCIkYWxsXCI6IFtcImJhclwiXX19XX0sIHNob3VsZCByZXN1bHRcbi8vIGluOiB7XCJiLmZvb1wiOiBcImJhclwifVxuLy8gQnV0IHRoaXMgc2VsZWN0b3I6IHtcIiRvclwiOiBbe1wiYlwiOiB7XCJmb29cIjoge1wiJGFsbFwiOiBbXCJiYXJcIl19fX1dfSBzaG91bGQgdGhyb3dcbi8vIGFuIGVycm9yXG5cbi8vIFNvbWUgcnVsZXMgKGZvdW5kIG1haW5seSB3aXRoIHRyaWFsICYgZXJyb3IsIHNvIHRoZXJlIG1pZ2h0IGJlIG1vcmUpOlxuLy8gLSBoYW5kbGUgYWxsIGNoaWxkcyBvZiAkYW5kIChvciBpbXBsaWNpdCAkYW5kKVxuLy8gLSBoYW5kbGUgJG9yIG5vZGVzIHdpdGggZXhhY3RseSAxIGNoaWxkXG4vLyAtIGlnbm9yZSAkb3Igbm9kZXMgd2l0aCBtb3JlIHRoYW4gMSBjaGlsZFxuLy8gLSBpZ25vcmUgJG5vciBhbmQgJG5vdCBub2Rlc1xuLy8gLSB0aHJvdyB3aGVuIGEgdmFsdWUgY2FuIG5vdCBiZSBzZXQgdW5hbWJpZ3VvdXNseVxuLy8gLSBldmVyeSB2YWx1ZSBmb3IgJGFsbCBzaG91bGQgYmUgZGVhbHQgd2l0aCBhcyBzZXBhcmF0ZSAkZXEtc1xuLy8gLSB0aHJlYXQgYWxsIGNoaWxkcmVuIG9mICRhbGwgYXMgJGVxIHNldHRlcnMgKD0+IHNldCBpZiAkYWxsLmxlbmd0aCA9PT0gMSxcbi8vICAgb3RoZXJ3aXNlIHRocm93IGVycm9yKVxuLy8gLSB5b3UgY2FuIG5vdCBtaXggJyQnLXByZWZpeGVkIGtleXMgYW5kIG5vbi0nJCctcHJlZml4ZWQga2V5c1xuLy8gLSB5b3UgY2FuIG9ubHkgaGF2ZSBkb3R0ZWQga2V5cyBvbiBhIHJvb3QtbGV2ZWxcbi8vIC0geW91IGNhbiBub3QgaGF2ZSAnJCctcHJlZml4ZWQga2V5cyBtb3JlIHRoYW4gb25lLWxldmVsIGRlZXAgaW4gYW4gb2JqZWN0XG5cbi8vIEhhbmRsZXMgb25lIGtleS92YWx1ZSBwYWlyIHRvIHB1dCBpbiB0aGUgc2VsZWN0b3IgZG9jdW1lbnRcbmZ1bmN0aW9uIHBvcHVsYXRlRG9jdW1lbnRXaXRoS2V5VmFsdWUoZG9jdW1lbnQsIGtleSwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSkgPT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICBwb3B1bGF0ZURvY3VtZW50V2l0aE9iamVjdChkb2N1bWVudCwga2V5LCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICBpbnNlcnRJbnRvRG9jdW1lbnQoZG9jdW1lbnQsIGtleSwgdmFsdWUpO1xuICB9XG59XG5cbi8vIEhhbmRsZXMgYSBrZXksIHZhbHVlIHBhaXIgdG8gcHV0IGluIHRoZSBzZWxlY3RvciBkb2N1bWVudFxuLy8gaWYgdGhlIHZhbHVlIGlzIGFuIG9iamVjdFxuZnVuY3Rpb24gcG9wdWxhdGVEb2N1bWVudFdpdGhPYmplY3QoZG9jdW1lbnQsIGtleSwgdmFsdWUpIHtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgY29uc3QgdW5wcmVmaXhlZEtleXMgPSBrZXlzLmZpbHRlcihvcCA9PiBvcFswXSAhPT0gJyQnKTtcblxuICBpZiAodW5wcmVmaXhlZEtleXMubGVuZ3RoID4gMCB8fCAha2V5cy5sZW5ndGgpIHtcbiAgICAvLyBMaXRlcmFsIChwb3NzaWJseSBlbXB0eSkgb2JqZWN0ICggb3IgZW1wdHkgb2JqZWN0IClcbiAgICAvLyBEb24ndCBhbGxvdyBtaXhpbmcgJyQnLXByZWZpeGVkIHdpdGggbm9uLSckJy1wcmVmaXhlZCBmaWVsZHNcbiAgICBpZiAoa2V5cy5sZW5ndGggIT09IHVucHJlZml4ZWRLZXlzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIG9wZXJhdG9yOiAke3VucHJlZml4ZWRLZXlzWzBdfWApO1xuICAgIH1cblxuICAgIHZhbGlkYXRlT2JqZWN0KHZhbHVlLCBrZXkpO1xuICAgIGluc2VydEludG9Eb2N1bWVudChkb2N1bWVudCwga2V5LCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgT2JqZWN0LmtleXModmFsdWUpLmZvckVhY2gob3AgPT4ge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdmFsdWVbb3BdO1xuXG4gICAgICBpZiAob3AgPT09ICckZXEnKSB7XG4gICAgICAgIHBvcHVsYXRlRG9jdW1lbnRXaXRoS2V5VmFsdWUoZG9jdW1lbnQsIGtleSwgb2JqZWN0KTtcbiAgICAgIH0gZWxzZSBpZiAob3AgPT09ICckYWxsJykge1xuICAgICAgICAvLyBldmVyeSB2YWx1ZSBmb3IgJGFsbCBzaG91bGQgYmUgZGVhbHQgd2l0aCBhcyBzZXBhcmF0ZSAkZXEtc1xuICAgICAgICBvYmplY3QuZm9yRWFjaChlbGVtZW50ID0+XG4gICAgICAgICAgcG9wdWxhdGVEb2N1bWVudFdpdGhLZXlWYWx1ZShkb2N1bWVudCwga2V5LCBlbGVtZW50KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8vIEZpbGxzIGEgZG9jdW1lbnQgd2l0aCBjZXJ0YWluIGZpZWxkcyBmcm9tIGFuIHVwc2VydCBzZWxlY3RvclxuZXhwb3J0IGZ1bmN0aW9uIHBvcHVsYXRlRG9jdW1lbnRXaXRoUXVlcnlGaWVsZHMocXVlcnksIGRvY3VtZW50ID0ge30pIHtcbiAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihxdWVyeSkgPT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICAvLyBoYW5kbGUgaW1wbGljaXQgJGFuZFxuICAgIE9iamVjdC5rZXlzKHF1ZXJ5KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHF1ZXJ5W2tleV07XG5cbiAgICAgIGlmIChrZXkgPT09ICckYW5kJykge1xuICAgICAgICAvLyBoYW5kbGUgZXhwbGljaXQgJGFuZFxuICAgICAgICB2YWx1ZS5mb3JFYWNoKGVsZW1lbnQgPT5cbiAgICAgICAgICBwb3B1bGF0ZURvY3VtZW50V2l0aFF1ZXJ5RmllbGRzKGVsZW1lbnQsIGRvY3VtZW50KVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICckb3InKSB7XG4gICAgICAgIC8vIGhhbmRsZSAkb3Igbm9kZXMgd2l0aCBleGFjdGx5IDEgY2hpbGRcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHBvcHVsYXRlRG9jdW1lbnRXaXRoUXVlcnlGaWVsZHModmFsdWVbMF0sIGRvY3VtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrZXlbMF0gIT09ICckJykge1xuICAgICAgICAvLyBJZ25vcmUgb3RoZXIgJyQnLXByZWZpeGVkIGxvZ2ljYWwgc2VsZWN0b3JzXG4gICAgICAgIHBvcHVsYXRlRG9jdW1lbnRXaXRoS2V5VmFsdWUoZG9jdW1lbnQsIGtleSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIC8vIEhhbmRsZSBtZXRlb3Itc3BlY2lmaWMgc2hvcnRjdXQgZm9yIHNlbGVjdGluZyBfaWRcbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQocXVlcnkpKSB7XG4gICAgICBpbnNlcnRJbnRvRG9jdW1lbnQoZG9jdW1lbnQsICdfaWQnLCBxdWVyeSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRvY3VtZW50O1xufVxuXG4vLyBUcmF2ZXJzZXMgdGhlIGtleXMgb2YgcGFzc2VkIHByb2plY3Rpb24gYW5kIGNvbnN0cnVjdHMgYSB0cmVlIHdoZXJlIGFsbFxuLy8gbGVhdmVzIGFyZSBlaXRoZXIgYWxsIFRydWUgb3IgYWxsIEZhbHNlXG4vLyBAcmV0dXJucyBPYmplY3Q6XG4vLyAgLSB0cmVlIC0gT2JqZWN0IC0gdHJlZSByZXByZXNlbnRhdGlvbiBvZiBrZXlzIGludm9sdmVkIGluIHByb2plY3Rpb25cbi8vICAoZXhjZXB0aW9uIGZvciAnX2lkJyBhcyBpdCBpcyBhIHNwZWNpYWwgY2FzZSBoYW5kbGVkIHNlcGFyYXRlbHkpXG4vLyAgLSBpbmNsdWRpbmcgLSBCb29sZWFuIC0gXCJ0YWtlIG9ubHkgY2VydGFpbiBmaWVsZHNcIiB0eXBlIG9mIHByb2plY3Rpb25cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uRGV0YWlscyhmaWVsZHMpIHtcbiAgLy8gRmluZCB0aGUgbm9uLV9pZCBrZXlzIChfaWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYmVjYXVzZSBpdCBpcyBpbmNsdWRlZFxuICAvLyB1bmxlc3MgZXhwbGljaXRseSBleGNsdWRlZCkuIFNvcnQgdGhlIGtleXMsIHNvIHRoYXQgb3VyIGNvZGUgdG8gZGV0ZWN0XG4gIC8vIG92ZXJsYXBzIGxpa2UgJ2ZvbycgYW5kICdmb28uYmFyJyBjYW4gYXNzdW1lIHRoYXQgJ2ZvbycgY29tZXMgZmlyc3QuXG4gIGxldCBmaWVsZHNLZXlzID0gT2JqZWN0LmtleXMoZmllbGRzKS5zb3J0KCk7XG5cbiAgLy8gSWYgX2lkIGlzIHRoZSBvbmx5IGZpZWxkIGluIHRoZSBwcm9qZWN0aW9uLCBkbyBub3QgcmVtb3ZlIGl0LCBzaW5jZSBpdCBpc1xuICAvLyByZXF1aXJlZCB0byBkZXRlcm1pbmUgaWYgdGhpcyBpcyBhbiBleGNsdXNpb24gb3IgZXhjbHVzaW9uLiBBbHNvIGtlZXAgYW5cbiAgLy8gaW5jbHVzaXZlIF9pZCwgc2luY2UgaW5jbHVzaXZlIF9pZCBmb2xsb3dzIHRoZSBub3JtYWwgcnVsZXMgYWJvdXQgbWl4aW5nXG4gIC8vIGluY2x1c2l2ZSBhbmQgZXhjbHVzaXZlIGZpZWxkcy4gSWYgX2lkIGlzIG5vdCB0aGUgb25seSBmaWVsZCBpbiB0aGVcbiAgLy8gcHJvamVjdGlvbiBhbmQgaXMgZXhjbHVzaXZlLCByZW1vdmUgaXQgc28gaXQgY2FuIGJlIGhhbmRsZWQgbGF0ZXIgYnkgYVxuICAvLyBzcGVjaWFsIGNhc2UsIHNpbmNlIGV4Y2x1c2l2ZSBfaWQgaXMgYWx3YXlzIGFsbG93ZWQuXG4gIGlmICghKGZpZWxkc0tleXMubGVuZ3RoID09PSAxICYmIGZpZWxkc0tleXNbMF0gPT09ICdfaWQnKSAmJlxuICAgICAgIShmaWVsZHNLZXlzLmluY2x1ZGVzKCdfaWQnKSAmJiBmaWVsZHMuX2lkKSkge1xuICAgIGZpZWxkc0tleXMgPSBmaWVsZHNLZXlzLmZpbHRlcihrZXkgPT4ga2V5ICE9PSAnX2lkJyk7XG4gIH1cblxuICBsZXQgaW5jbHVkaW5nID0gbnVsbDsgLy8gVW5rbm93blxuXG4gIGZpZWxkc0tleXMuZm9yRWFjaChrZXlQYXRoID0+IHtcbiAgICBjb25zdCBydWxlID0gISFmaWVsZHNba2V5UGF0aF07XG5cbiAgICBpZiAoaW5jbHVkaW5nID09PSBudWxsKSB7XG4gICAgICBpbmNsdWRpbmcgPSBydWxlO1xuICAgIH1cblxuICAgIC8vIFRoaXMgZXJyb3IgbWVzc2FnZSBpcyBjb3BpZWQgZnJvbSBNb25nb0RCIHNoZWxsXG4gICAgaWYgKGluY2x1ZGluZyAhPT0gcnVsZSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdZb3UgY2Fubm90IGN1cnJlbnRseSBtaXggaW5jbHVkaW5nIGFuZCBleGNsdWRpbmcgZmllbGRzLidcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBwcm9qZWN0aW9uUnVsZXNUcmVlID0gcGF0aHNUb1RyZWUoXG4gICAgZmllbGRzS2V5cyxcbiAgICBwYXRoID0+IGluY2x1ZGluZyxcbiAgICAobm9kZSwgcGF0aCwgZnVsbFBhdGgpID0+IHtcbiAgICAgIC8vIENoZWNrIHBhc3NlZCBwcm9qZWN0aW9uIGZpZWxkcycga2V5czogSWYgeW91IGhhdmUgdHdvIHJ1bGVzIHN1Y2ggYXNcbiAgICAgIC8vICdmb28uYmFyJyBhbmQgJ2Zvby5iYXIuYmF6JywgdGhlbiB0aGUgcmVzdWx0IGJlY29tZXMgYW1iaWd1b3VzLiBJZlxuICAgICAgLy8gdGhhdCBoYXBwZW5zLCB0aGVyZSBpcyBhIHByb2JhYmlsaXR5IHlvdSBhcmUgZG9pbmcgc29tZXRoaW5nIHdyb25nLFxuICAgICAgLy8gZnJhbWV3b3JrIHNob3VsZCBub3RpZnkgeW91IGFib3V0IHN1Y2ggbWlzdGFrZSBlYXJsaWVyIG9uIGN1cnNvclxuICAgICAgLy8gY29tcGlsYXRpb24gc3RlcCB0aGFuIGxhdGVyIGR1cmluZyBydW50aW1lLiAgTm90ZSwgdGhhdCByZWFsIG1vbmdvXG4gICAgICAvLyBkb2Vzbid0IGRvIGFueXRoaW5nIGFib3V0IGl0IGFuZCB0aGUgbGF0ZXIgcnVsZSBhcHBlYXJzIGluIHByb2plY3Rpb25cbiAgICAgIC8vIHByb2plY3QsIG1vcmUgcHJpb3JpdHkgaXQgdGFrZXMuXG4gICAgICAvL1xuICAgICAgLy8gRXhhbXBsZSwgYXNzdW1lIGZvbGxvd2luZyBpbiBtb25nbyBzaGVsbDpcbiAgICAgIC8vID4gZGIuY29sbC5pbnNlcnQoeyBhOiB7IGI6IDIzLCBjOiA0NCB9IH0pXG4gICAgICAvLyA+IGRiLmNvbGwuZmluZCh7fSwgeyAnYSc6IDEsICdhLmInOiAxIH0pXG4gICAgICAvLyB7XCJfaWRcIjogT2JqZWN0SWQoXCI1MjBiZmU0NTYwMjQ2MDhlOGVmMjRhZjNcIiksIFwiYVwiOiB7XCJiXCI6IDIzfX1cbiAgICAgIC8vID4gZGIuY29sbC5maW5kKHt9LCB7ICdhLmInOiAxLCAnYSc6IDEgfSlcbiAgICAgIC8vIHtcIl9pZFwiOiBPYmplY3RJZChcIjUyMGJmZTQ1NjAyNDYwOGU4ZWYyNGFmM1wiKSwgXCJhXCI6IHtcImJcIjogMjMsIFwiY1wiOiA0NH19XG4gICAgICAvL1xuICAgICAgLy8gTm90ZSwgaG93IHNlY29uZCB0aW1lIHRoZSByZXR1cm4gc2V0IG9mIGtleXMgaXMgZGlmZmVyZW50LlxuICAgICAgY29uc3QgY3VycmVudFBhdGggPSBmdWxsUGF0aDtcbiAgICAgIGNvbnN0IGFub3RoZXJQYXRoID0gcGF0aDtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICBgYm90aCAke2N1cnJlbnRQYXRofSBhbmQgJHthbm90aGVyUGF0aH0gZm91bmQgaW4gZmllbGRzIG9wdGlvbiwgYCArXG4gICAgICAgICd1c2luZyBib3RoIG9mIHRoZW0gbWF5IHRyaWdnZXIgdW5leHBlY3RlZCBiZWhhdmlvci4gRGlkIHlvdSBtZWFuIHRvICcgK1xuICAgICAgICAndXNlIG9ubHkgb25lIG9mIHRoZW0/J1xuICAgICAgKTtcbiAgICB9KTtcblxuICByZXR1cm4ge2luY2x1ZGluZywgdHJlZTogcHJvamVjdGlvblJ1bGVzVHJlZX07XG59XG5cbi8vIFRha2VzIGEgUmVnRXhwIG9iamVjdCBhbmQgcmV0dXJucyBhbiBlbGVtZW50IG1hdGNoZXIuXG5leHBvcnQgZnVuY3Rpb24gcmVnZXhwRWxlbWVudE1hdGNoZXIocmVnZXhwKSB7XG4gIHJldHVybiB2YWx1ZSA9PiB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKSA9PT0gcmVnZXhwLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgLy8gUmVnZXhwcyBvbmx5IHdvcmsgYWdhaW5zdCBzdHJpbmdzLlxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgcmVnZXhwJ3Mgc3RhdGUgdG8gYXZvaWQgaW5jb25zaXN0ZW50IG1hdGNoaW5nIGZvciBvYmplY3RzIHdpdGggdGhlXG4gICAgLy8gc2FtZSB2YWx1ZSBvbiBjb25zZWN1dGl2ZSBjYWxscyBvZiByZWdleHAudGVzdC4gVGhpcyBoYXBwZW5zIG9ubHkgaWYgdGhlXG4gICAgLy8gcmVnZXhwIGhhcyB0aGUgJ2cnIGZsYWcuIEFsc28gbm90ZSB0aGF0IEVTNiBpbnRyb2R1Y2VzIGEgbmV3IGZsYWcgJ3knIGZvclxuICAgIC8vIHdoaWNoIHdlIHNob3VsZCAqbm90KiBjaGFuZ2UgdGhlIGxhc3RJbmRleCBidXQgTW9uZ29EQiBkb2Vzbid0IHN1cHBvcnRcbiAgICAvLyBlaXRoZXIgb2YgdGhlc2UgZmxhZ3MuXG4gICAgcmVnZXhwLmxhc3RJbmRleCA9IDA7XG5cbiAgICByZXR1cm4gcmVnZXhwLnRlc3QodmFsdWUpO1xuICB9O1xufVxuXG4vLyBWYWxpZGF0ZXMgdGhlIGtleSBpbiBhIHBhdGguXG4vLyBPYmplY3RzIHRoYXQgYXJlIG5lc3RlZCBtb3JlIHRoZW4gMSBsZXZlbCBjYW5ub3QgaGF2ZSBkb3R0ZWQgZmllbGRzXG4vLyBvciBmaWVsZHMgc3RhcnRpbmcgd2l0aCAnJCdcbmZ1bmN0aW9uIHZhbGlkYXRlS2V5SW5QYXRoKGtleSwgcGF0aCkge1xuICBpZiAoa2V5LmluY2x1ZGVzKCcuJykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgVGhlIGRvdHRlZCBmaWVsZCAnJHtrZXl9JyBpbiAnJHtwYXRofS4ke2tleX0gaXMgbm90IHZhbGlkIGZvciBzdG9yYWdlLmBcbiAgICApO1xuICB9XG5cbiAgaWYgKGtleVswXSA9PT0gJyQnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFRoZSBkb2xsYXIgKCQpIHByZWZpeGVkIGZpZWxkICAnJHtwYXRofS4ke2tleX0gaXMgbm90IHZhbGlkIGZvciBzdG9yYWdlLmBcbiAgICApO1xuICB9XG59XG5cbi8vIFJlY3Vyc2l2ZWx5IHZhbGlkYXRlcyBhbiBvYmplY3QgdGhhdCBpcyBuZXN0ZWQgbW9yZSB0aGFuIG9uZSBsZXZlbCBkZWVwXG5mdW5jdGlvbiB2YWxpZGF0ZU9iamVjdChvYmplY3QsIHBhdGgpIHtcbiAgaWYgKG9iamVjdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KSA9PT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIE9iamVjdC5rZXlzKG9iamVjdCkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgdmFsaWRhdGVLZXlJblBhdGgoa2V5LCBwYXRoKTtcbiAgICAgIHZhbGlkYXRlT2JqZWN0KG9iamVjdFtrZXldLCBwYXRoICsgJy4nICsga2V5KTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IExvY2FsQ29sbGVjdGlvbiBmcm9tICcuL2xvY2FsX2NvbGxlY3Rpb24uanMnO1xuaW1wb3J0IHsgaGFzT3duIH0gZnJvbSAnLi9jb21tb24uanMnO1xuXG4vLyBDdXJzb3I6IGEgc3BlY2lmaWNhdGlvbiBmb3IgYSBwYXJ0aWN1bGFyIHN1YnNldCBvZiBkb2N1bWVudHMsIHcvIGEgZGVmaW5lZFxuLy8gb3JkZXIsIGxpbWl0LCBhbmQgb2Zmc2V0LiAgY3JlYXRpbmcgYSBDdXJzb3Igd2l0aCBMb2NhbENvbGxlY3Rpb24uZmluZCgpLFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3Vyc29yIHtcbiAgLy8gZG9uJ3QgY2FsbCB0aGlzIGN0b3IgZGlyZWN0bHkuICB1c2UgTG9jYWxDb2xsZWN0aW9uLmZpbmQoKS5cbiAgY29uc3RydWN0b3IoY29sbGVjdGlvbiwgc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgdGhpcy5zb3J0ZXIgPSBudWxsO1xuICAgIHRoaXMubWF0Y2hlciA9IG5ldyBNaW5pbW9uZ28uTWF0Y2hlcihzZWxlY3Rvcik7XG5cbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWRQZXJoYXBzQXNPYmplY3Qoc2VsZWN0b3IpKSB7XG4gICAgICAvLyBzdGFzaCBmb3IgZmFzdCBfaWQgYW5kIHsgX2lkIH1cbiAgICAgIHRoaXMuX3NlbGVjdG9ySWQgPSBoYXNPd24uY2FsbChzZWxlY3RvciwgJ19pZCcpXG4gICAgICAgID8gc2VsZWN0b3IuX2lkXG4gICAgICAgIDogc2VsZWN0b3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlbGVjdG9ySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmICh0aGlzLm1hdGNoZXIuaGFzR2VvUXVlcnkoKSB8fCBvcHRpb25zLnNvcnQpIHtcbiAgICAgICAgdGhpcy5zb3J0ZXIgPSBuZXcgTWluaW1vbmdvLlNvcnRlcihcbiAgICAgICAgICBvcHRpb25zLnNvcnQgfHwgW10sXG4gICAgICAgICAge21hdGNoZXI6IHRoaXMubWF0Y2hlcn1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNraXAgPSBvcHRpb25zLnNraXAgfHwgMDtcbiAgICB0aGlzLmxpbWl0ID0gb3B0aW9ucy5saW1pdDtcbiAgICB0aGlzLmZpZWxkcyA9IG9wdGlvbnMuZmllbGRzO1xuXG4gICAgdGhpcy5fcHJvamVjdGlvbkZuID0gTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlUHJvamVjdGlvbih0aGlzLmZpZWxkcyB8fCB7fSk7XG5cbiAgICB0aGlzLl90cmFuc2Zvcm0gPSBMb2NhbENvbGxlY3Rpb24ud3JhcFRyYW5zZm9ybShvcHRpb25zLnRyYW5zZm9ybSk7XG5cbiAgICAvLyBieSBkZWZhdWx0LCBxdWVyaWVzIHJlZ2lzdGVyIHcvIFRyYWNrZXIgd2hlbiBpdCBpcyBhdmFpbGFibGUuXG4gICAgaWYgKHR5cGVvZiBUcmFja2VyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5yZWFjdGl2ZSA9IG9wdGlvbnMucmVhY3RpdmUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBvcHRpb25zLnJlYWN0aXZlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIHRoZSBudW1iZXIgb2YgZG9jdW1lbnRzIHRoYXQgbWF0Y2ggYSBxdWVyeS5cbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAbWV0aG9kICBjb3VudFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthcHBseVNraXBMaW1pdD10cnVlXSBJZiBzZXQgdG8gYGZhbHNlYCwgdGhlIHZhbHVlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5lZCB3aWxsIHJlZmxlY3QgdGhlIHRvdGFsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1iZXIgb2YgbWF0Y2hpbmcgZG9jdW1lbnRzLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JpbmcgYW55IHZhbHVlIHN1cHBsaWVkIGZvclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGltaXRcbiAgICogQGluc3RhbmNlXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgKi9cbiAgY291bnQoYXBwbHlTa2lwTGltaXQgPSB0cnVlKSB7XG4gICAgaWYgKHRoaXMucmVhY3RpdmUpIHtcbiAgICAgIC8vIGFsbG93IHRoZSBvYnNlcnZlIHRvIGJlIHVub3JkZXJlZFxuICAgICAgdGhpcy5fZGVwZW5kKHthZGRlZDogdHJ1ZSwgcmVtb3ZlZDogdHJ1ZX0sIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9nZXRSYXdPYmplY3RzKHtcbiAgICAgIG9yZGVyZWQ6IHRydWUsXG4gICAgICBhcHBseVNraXBMaW1pdFxuICAgIH0pLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZXR1cm4gYWxsIG1hdGNoaW5nIGRvY3VtZW50cyBhcyBhbiBBcnJheS5cbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAbWV0aG9kICBmZXRjaFxuICAgKiBAaW5zdGFuY2VcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEByZXR1cm5zIHtPYmplY3RbXX1cbiAgICovXG4gIGZldGNoKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gICAgdGhpcy5mb3JFYWNoKGRvYyA9PiB7XG4gICAgICByZXN1bHQucHVzaChkb2MpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIGlmICh0aGlzLnJlYWN0aXZlKSB7XG4gICAgICB0aGlzLl9kZXBlbmQoe1xuICAgICAgICBhZGRlZEJlZm9yZTogdHJ1ZSxcbiAgICAgICAgcmVtb3ZlZDogdHJ1ZSxcbiAgICAgICAgY2hhbmdlZDogdHJ1ZSxcbiAgICAgICAgbW92ZWRCZWZvcmU6IHRydWV9KTtcbiAgICB9XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIGNvbnN0IG9iamVjdHMgPSB0aGlzLl9nZXRSYXdPYmplY3RzKHtvcmRlcmVkOiB0cnVlfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICBpZiAoaW5kZXggPCBvYmplY3RzLmxlbmd0aCkge1xuICAgICAgICAgIC8vIFRoaXMgZG91YmxlcyBhcyBhIGNsb25lIG9wZXJhdGlvbi5cbiAgICAgICAgICBsZXQgZWxlbWVudCA9IHRoaXMuX3Byb2plY3Rpb25GbihvYmplY3RzW2luZGV4KytdKTtcblxuICAgICAgICAgIGlmICh0aGlzLl90cmFuc2Zvcm0pXG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5fdHJhbnNmb3JtKGVsZW1lbnQpO1xuXG4gICAgICAgICAgcmV0dXJuIHt2YWx1ZTogZWxlbWVudH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge2RvbmU6IHRydWV9O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQGNhbGxiYWNrIEl0ZXJhdGlvbkNhbGxiYWNrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkb2NcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqL1xuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBgY2FsbGJhY2tgIG9uY2UgZm9yIGVhY2ggbWF0Y2hpbmcgZG9jdW1lbnQsIHNlcXVlbnRpYWxseSBhbmRcbiAgICogICAgICAgICAgc3luY2hyb25vdXNseS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZXRob2QgIGZvckVhY2hcbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQHBhcmFtIHtJdGVyYXRpb25DYWxsYmFja30gY2FsbGJhY2sgRnVuY3Rpb24gdG8gY2FsbC4gSXQgd2lsbCBiZSBjYWxsZWRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aHJlZSBhcmd1bWVudHM6IHRoZSBkb2N1bWVudCwgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLWJhc2VkIGluZGV4LCBhbmQgPGVtPmN1cnNvcjwvZW0+XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0c2VsZi5cbiAgICogQHBhcmFtIHtBbnl9IFt0aGlzQXJnXSBBbiBvYmplY3Qgd2hpY2ggd2lsbCBiZSB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIGBjYWxsYmFja2AuXG4gICAqL1xuICBmb3JFYWNoKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgaWYgKHRoaXMucmVhY3RpdmUpIHtcbiAgICAgIHRoaXMuX2RlcGVuZCh7XG4gICAgICAgIGFkZGVkQmVmb3JlOiB0cnVlLFxuICAgICAgICByZW1vdmVkOiB0cnVlLFxuICAgICAgICBjaGFuZ2VkOiB0cnVlLFxuICAgICAgICBtb3ZlZEJlZm9yZTogdHJ1ZX0pO1xuICAgIH1cblxuICAgIHRoaXMuX2dldFJhd09iamVjdHMoe29yZGVyZWQ6IHRydWV9KS5mb3JFYWNoKChlbGVtZW50LCBpKSA9PiB7XG4gICAgICAvLyBUaGlzIGRvdWJsZXMgYXMgYSBjbG9uZSBvcGVyYXRpb24uXG4gICAgICBlbGVtZW50ID0gdGhpcy5fcHJvamVjdGlvbkZuKGVsZW1lbnQpO1xuXG4gICAgICBpZiAodGhpcy5fdHJhbnNmb3JtKSB7XG4gICAgICAgIGVsZW1lbnQgPSB0aGlzLl90cmFuc2Zvcm0oZWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgZWxlbWVudCwgaSwgdGhpcyk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRUcmFuc2Zvcm0oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBNYXAgY2FsbGJhY2sgb3ZlciBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzLiAgUmV0dXJucyBhbiBBcnJheS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZXRob2QgbWFwXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAbWVtYmVyT2YgTW9uZ28uQ3Vyc29yXG4gICAqIEBwYXJhbSB7SXRlcmF0aW9uQ2FsbGJhY2t9IGNhbGxiYWNrIEZ1bmN0aW9uIHRvIGNhbGwuIEl0IHdpbGwgYmUgY2FsbGVkXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGggdGhyZWUgYXJndW1lbnRzOiB0aGUgZG9jdW1lbnQsIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMC1iYXNlZCBpbmRleCwgYW5kIDxlbT5jdXJzb3I8L2VtPlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdHNlbGYuXG4gICAqIEBwYXJhbSB7QW55fSBbdGhpc0FyZ10gQW4gb2JqZWN0IHdoaWNoIHdpbGwgYmUgdGhlIHZhbHVlIG9mIGB0aGlzYCBpbnNpZGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBgY2FsbGJhY2tgLlxuICAgKi9cbiAgbWFwKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgICB0aGlzLmZvckVhY2goKGRvYywgaSkgPT4ge1xuICAgICAgcmVzdWx0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzQXJnLCBkb2MsIGksIHRoaXMpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBvcHRpb25zIHRvIGNvbnRhaW46XG4gIC8vICAqIGNhbGxiYWNrcyBmb3Igb2JzZXJ2ZSgpOlxuICAvLyAgICAtIGFkZGVkQXQgKGRvY3VtZW50LCBhdEluZGV4KVxuICAvLyAgICAtIGFkZGVkIChkb2N1bWVudClcbiAgLy8gICAgLSBjaGFuZ2VkQXQgKG5ld0RvY3VtZW50LCBvbGREb2N1bWVudCwgYXRJbmRleClcbiAgLy8gICAgLSBjaGFuZ2VkIChuZXdEb2N1bWVudCwgb2xkRG9jdW1lbnQpXG4gIC8vICAgIC0gcmVtb3ZlZEF0IChkb2N1bWVudCwgYXRJbmRleClcbiAgLy8gICAgLSByZW1vdmVkIChkb2N1bWVudClcbiAgLy8gICAgLSBtb3ZlZFRvIChkb2N1bWVudCwgb2xkSW5kZXgsIG5ld0luZGV4KVxuICAvL1xuICAvLyBhdHRyaWJ1dGVzIGF2YWlsYWJsZSBvbiByZXR1cm5lZCBxdWVyeSBoYW5kbGU6XG4gIC8vICAqIHN0b3AoKTogZW5kIHVwZGF0ZXNcbiAgLy8gICogY29sbGVjdGlvbjogdGhlIGNvbGxlY3Rpb24gdGhpcyBxdWVyeSBpcyBxdWVyeWluZ1xuICAvL1xuICAvLyBpZmYgeCBpcyBhIHJldHVybmVkIHF1ZXJ5IGhhbmRsZSwgKHggaW5zdGFuY2VvZlxuICAvLyBMb2NhbENvbGxlY3Rpb24uT2JzZXJ2ZUhhbmRsZSkgaXMgdHJ1ZVxuICAvL1xuICAvLyBpbml0aWFsIHJlc3VsdHMgZGVsaXZlcmVkIHRocm91Z2ggYWRkZWQgY2FsbGJhY2tcbiAgLy8gWFhYIG1heWJlIGNhbGxiYWNrcyBzaG91bGQgdGFrZSBhIGxpc3Qgb2Ygb2JqZWN0cywgdG8gZXhwb3NlIHRyYW5zYWN0aW9ucz9cbiAgLy8gWFhYIG1heWJlIHN1cHBvcnQgZmllbGQgbGltaXRpbmcgKHRvIGxpbWl0IHdoYXQgeW91J3JlIG5vdGlmaWVkIG9uKVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBXYXRjaCBhIHF1ZXJ5LiAgUmVjZWl2ZSBjYWxsYmFja3MgYXMgdGhlIHJlc3VsdCBzZXQgY2hhbmdlcy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjYWxsYmFja3MgRnVuY3Rpb25zIHRvIGNhbGwgdG8gZGVsaXZlciB0aGUgcmVzdWx0IHNldCBhcyBpdFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXNcbiAgICovXG4gIG9ic2VydmUob3B0aW9ucykge1xuICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX29ic2VydmVGcm9tT2JzZXJ2ZUNoYW5nZXModGhpcywgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgV2F0Y2ggYSBxdWVyeS4gUmVjZWl2ZSBjYWxsYmFja3MgYXMgdGhlIHJlc3VsdCBzZXQgY2hhbmdlcy4gT25seVxuICAgKiAgICAgICAgICB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgb2xkIGFuZCBuZXcgZG9jdW1lbnRzIGFyZSBwYXNzZWQgdG9cbiAgICogICAgICAgICAgdGhlIGNhbGxiYWNrcy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjYWxsYmFja3MgRnVuY3Rpb25zIHRvIGNhbGwgdG8gZGVsaXZlciB0aGUgcmVzdWx0IHNldCBhcyBpdFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXNcbiAgICovXG4gIG9ic2VydmVDaGFuZ2VzKG9wdGlvbnMpIHtcbiAgICBjb25zdCBvcmRlcmVkID0gTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQob3B0aW9ucyk7XG5cbiAgICAvLyB0aGVyZSBhcmUgc2V2ZXJhbCBwbGFjZXMgdGhhdCBhc3N1bWUgeW91IGFyZW4ndCBjb21iaW5pbmcgc2tpcC9saW1pdCB3aXRoXG4gICAgLy8gdW5vcmRlcmVkIG9ic2VydmUuICBlZywgdXBkYXRlJ3MgRUpTT04uY2xvbmUsIGFuZCB0aGUgXCJ0aGVyZSBhcmUgc2V2ZXJhbFwiXG4gICAgLy8gY29tbWVudCBpbiBfbW9kaWZ5QW5kTm90aWZ5XG4gICAgLy8gWFhYIGFsbG93IHNraXAvbGltaXQgd2l0aCB1bm9yZGVyZWQgb2JzZXJ2ZVxuICAgIGlmICghb3B0aW9ucy5fYWxsb3dfdW5vcmRlcmVkICYmICFvcmRlcmVkICYmICh0aGlzLnNraXAgfHwgdGhpcy5saW1pdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJNdXN0IHVzZSBhbiBvcmRlcmVkIG9ic2VydmUgd2l0aCBza2lwIG9yIGxpbWl0IChpLmUuICdhZGRlZEJlZm9yZScgXCIgK1xuICAgICAgICBcImZvciBvYnNlcnZlQ2hhbmdlcyBvciAnYWRkZWRBdCcgZm9yIG9ic2VydmUsIGluc3RlYWQgb2YgJ2FkZGVkJykuXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZmllbGRzICYmICh0aGlzLmZpZWxkcy5faWQgPT09IDAgfHwgdGhpcy5maWVsZHMuX2lkID09PSBmYWxzZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdZb3UgbWF5IG5vdCBvYnNlcnZlIGEgY3Vyc29yIHdpdGgge2ZpZWxkczoge19pZDogMH19Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgZGlzdGFuY2VzID0gKFxuICAgICAgdGhpcy5tYXRjaGVyLmhhc0dlb1F1ZXJ5KCkgJiZcbiAgICAgIG9yZGVyZWQgJiZcbiAgICAgIG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwXG4gICAgKTtcblxuICAgIGNvbnN0IHF1ZXJ5ID0ge1xuICAgICAgY3Vyc29yOiB0aGlzLFxuICAgICAgZGlydHk6IGZhbHNlLFxuICAgICAgZGlzdGFuY2VzLFxuICAgICAgbWF0Y2hlcjogdGhpcy5tYXRjaGVyLCAvLyBub3QgZmFzdCBwYXRoZWRcbiAgICAgIG9yZGVyZWQsXG4gICAgICBwcm9qZWN0aW9uRm46IHRoaXMuX3Byb2plY3Rpb25GbixcbiAgICAgIHJlc3VsdHNTbmFwc2hvdDogbnVsbCxcbiAgICAgIHNvcnRlcjogb3JkZXJlZCAmJiB0aGlzLnNvcnRlclxuICAgIH07XG5cbiAgICBsZXQgcWlkO1xuXG4gICAgLy8gTm9uLXJlYWN0aXZlIHF1ZXJpZXMgY2FsbCBhZGRlZFtCZWZvcmVdIGFuZCB0aGVuIG5ldmVyIGNhbGwgYW55dGhpbmdcbiAgICAvLyBlbHNlLlxuICAgIGlmICh0aGlzLnJlYWN0aXZlKSB7XG4gICAgICBxaWQgPSB0aGlzLmNvbGxlY3Rpb24ubmV4dF9xaWQrKztcbiAgICAgIHRoaXMuY29sbGVjdGlvbi5xdWVyaWVzW3FpZF0gPSBxdWVyeTtcbiAgICB9XG5cbiAgICBxdWVyeS5yZXN1bHRzID0gdGhpcy5fZ2V0UmF3T2JqZWN0cyh7b3JkZXJlZCwgZGlzdGFuY2VzOiBxdWVyeS5kaXN0YW5jZXN9KTtcblxuICAgIGlmICh0aGlzLmNvbGxlY3Rpb24ucGF1c2VkKSB7XG4gICAgICBxdWVyeS5yZXN1bHRzU25hcHNob3QgPSBvcmRlcmVkID8gW10gOiBuZXcgTG9jYWxDb2xsZWN0aW9uLl9JZE1hcDtcbiAgICB9XG5cbiAgICAvLyB3cmFwIGNhbGxiYWNrcyB3ZSB3ZXJlIHBhc3NlZC4gY2FsbGJhY2tzIG9ubHkgZmlyZSB3aGVuIG5vdCBwYXVzZWQgYW5kXG4gICAgLy8gYXJlIG5ldmVyIHVuZGVmaW5lZFxuICAgIC8vIEZpbHRlcnMgb3V0IGJsYWNrbGlzdGVkIGZpZWxkcyBhY2NvcmRpbmcgdG8gY3Vyc29yJ3MgcHJvamVjdGlvbi5cbiAgICAvLyBYWFggd3JvbmcgcGxhY2UgZm9yIHRoaXM/XG5cbiAgICAvLyBmdXJ0aGVybW9yZSwgY2FsbGJhY2tzIGVucXVldWUgdW50aWwgdGhlIG9wZXJhdGlvbiB3ZSdyZSB3b3JraW5nIG9uIGlzXG4gICAgLy8gZG9uZS5cbiAgICBjb25zdCB3cmFwQ2FsbGJhY2sgPSBmbiA9PiB7XG4gICAgICBpZiAoIWZuKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7fTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oLyogYXJncyovKSB7XG4gICAgICAgIGlmIChzZWxmLmNvbGxlY3Rpb24ucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgICBzZWxmLmNvbGxlY3Rpb24uX29ic2VydmVRdWV1ZS5xdWV1ZVRhc2soKCkgPT4ge1xuICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHF1ZXJ5LmFkZGVkID0gd3JhcENhbGxiYWNrKG9wdGlvbnMuYWRkZWQpO1xuICAgIHF1ZXJ5LmNoYW5nZWQgPSB3cmFwQ2FsbGJhY2sob3B0aW9ucy5jaGFuZ2VkKTtcbiAgICBxdWVyeS5yZW1vdmVkID0gd3JhcENhbGxiYWNrKG9wdGlvbnMucmVtb3ZlZCk7XG5cbiAgICBpZiAob3JkZXJlZCkge1xuICAgICAgcXVlcnkuYWRkZWRCZWZvcmUgPSB3cmFwQ2FsbGJhY2sob3B0aW9ucy5hZGRlZEJlZm9yZSk7XG4gICAgICBxdWVyeS5tb3ZlZEJlZm9yZSA9IHdyYXBDYWxsYmFjayhvcHRpb25zLm1vdmVkQmVmb3JlKTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnMuX3N1cHByZXNzX2luaXRpYWwgJiYgIXRoaXMuY29sbGVjdGlvbi5wYXVzZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBvcmRlcmVkID8gcXVlcnkucmVzdWx0cyA6IHF1ZXJ5LnJlc3VsdHMuX21hcDtcblxuICAgICAgT2JqZWN0LmtleXMocmVzdWx0cykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBjb25zdCBkb2MgPSByZXN1bHRzW2tleV07XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IEVKU09OLmNsb25lKGRvYyk7XG5cbiAgICAgICAgZGVsZXRlIGZpZWxkcy5faWQ7XG5cbiAgICAgICAgaWYgKG9yZGVyZWQpIHtcbiAgICAgICAgICBxdWVyeS5hZGRlZEJlZm9yZShkb2MuX2lkLCB0aGlzLl9wcm9qZWN0aW9uRm4oZmllbGRzKSwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBxdWVyeS5hZGRlZChkb2MuX2lkLCB0aGlzLl9wcm9qZWN0aW9uRm4oZmllbGRzKSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGUgPSBPYmplY3QuYXNzaWduKG5ldyBMb2NhbENvbGxlY3Rpb24uT2JzZXJ2ZUhhbmRsZSwge1xuICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxuICAgICAgc3RvcDogKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5yZWFjdGl2ZSkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLmNvbGxlY3Rpb24ucXVlcmllc1txaWRdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5yZWFjdGl2ZSAmJiBUcmFja2VyLmFjdGl2ZSkge1xuICAgICAgLy8gWFhYIGluIG1hbnkgY2FzZXMsIHRoZSBzYW1lIG9ic2VydmUgd2lsbCBiZSByZWNyZWF0ZWQgd2hlblxuICAgICAgLy8gdGhlIGN1cnJlbnQgYXV0b3J1biBpcyByZXJ1bi4gIHdlIGNvdWxkIHNhdmUgd29yayBieVxuICAgICAgLy8gbGV0dGluZyBpdCBsaW5nZXIgYWNyb3NzIHJlcnVuIGFuZCBwb3RlbnRpYWxseSBnZXRcbiAgICAgIC8vIHJlcHVycG9zZWQgaWYgdGhlIHNhbWUgb2JzZXJ2ZSBpcyBwZXJmb3JtZWQsIHVzaW5nIGxvZ2ljXG4gICAgICAvLyBzaW1pbGFyIHRvIHRoYXQgb2YgTWV0ZW9yLnN1YnNjcmliZS5cbiAgICAgIFRyYWNrZXIub25JbnZhbGlkYXRlKCgpID0+IHtcbiAgICAgICAgaGFuZGxlLnN0b3AoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHJ1biB0aGUgb2JzZXJ2ZSBjYWxsYmFja3MgcmVzdWx0aW5nIGZyb20gdGhlIGluaXRpYWwgY29udGVudHNcbiAgICAvLyBiZWZvcmUgd2UgbGVhdmUgdGhlIG9ic2VydmUuXG4gICAgdGhpcy5jb2xsZWN0aW9uLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcblxuICAgIHJldHVybiBoYW5kbGU7XG4gIH1cblxuICAvLyBTaW5jZSB3ZSBkb24ndCBhY3R1YWxseSBoYXZlIGEgXCJuZXh0T2JqZWN0XCIgaW50ZXJmYWNlLCB0aGVyZSdzIHJlYWxseSBub1xuICAvLyByZWFzb24gdG8gaGF2ZSBhIFwicmV3aW5kXCIgaW50ZXJmYWNlLiAgQWxsIGl0IGRpZCB3YXMgbWFrZSBtdWx0aXBsZSBjYWxsc1xuICAvLyB0byBmZXRjaC9tYXAvZm9yRWFjaCByZXR1cm4gbm90aGluZyB0aGUgc2Vjb25kIHRpbWUuXG4gIC8vIFhYWCBDT01QQVQgV0lUSCAwLjguMVxuICByZXdpbmQoKSB7fVxuXG4gIC8vIFhYWCBNYXliZSB3ZSBuZWVkIGEgdmVyc2lvbiBvZiBvYnNlcnZlIHRoYXQganVzdCBjYWxscyBhIGNhbGxiYWNrIGlmXG4gIC8vIGFueXRoaW5nIGNoYW5nZWQuXG4gIF9kZXBlbmQoY2hhbmdlcnMsIF9hbGxvd191bm9yZGVyZWQpIHtcbiAgICBpZiAoVHJhY2tlci5hY3RpdmUpIHtcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSBuZXcgVHJhY2tlci5EZXBlbmRlbmN5O1xuICAgICAgY29uc3Qgbm90aWZ5ID0gZGVwZW5kZW5jeS5jaGFuZ2VkLmJpbmQoZGVwZW5kZW5jeSk7XG5cbiAgICAgIGRlcGVuZGVuY3kuZGVwZW5kKCk7XG5cbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7X2FsbG93X3Vub3JkZXJlZCwgX3N1cHByZXNzX2luaXRpYWw6IHRydWV9O1xuXG4gICAgICBbJ2FkZGVkJywgJ2FkZGVkQmVmb3JlJywgJ2NoYW5nZWQnLCAnbW92ZWRCZWZvcmUnLCAncmVtb3ZlZCddXG4gICAgICAgIC5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICBpZiAoY2hhbmdlcnNbZm5dKSB7XG4gICAgICAgICAgICBvcHRpb25zW2ZuXSA9IG5vdGlmeTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAvLyBvYnNlcnZlQ2hhbmdlcyB3aWxsIHN0b3AoKSB3aGVuIHRoaXMgY29tcHV0YXRpb24gaXMgaW52YWxpZGF0ZWRcbiAgICAgIHRoaXMub2JzZXJ2ZUNoYW5nZXMob3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgX2dldENvbGxlY3Rpb25OYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb24ubmFtZTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBjb2xsZWN0aW9uIG9mIG1hdGNoaW5nIG9iamVjdHMsIGJ1dCBkb2Vzbid0IGRlZXAgY29weSB0aGVtLlxuICAvL1xuICAvLyBJZiBvcmRlcmVkIGlzIHNldCwgcmV0dXJucyBhIHNvcnRlZCBhcnJheSwgcmVzcGVjdGluZyBzb3J0ZXIsIHNraXAsIGFuZFxuICAvLyBsaW1pdCBwcm9wZXJ0aWVzIG9mIHRoZSBxdWVyeSBwcm92aWRlZCB0aGF0IG9wdGlvbnMuYXBwbHlTa2lwTGltaXQgaXNcbiAgLy8gbm90IHNldCB0byBmYWxzZSAoIzEyMDEpLiBJZiBzb3J0ZXIgaXMgZmFsc2V5LCBubyBzb3J0IC0tIHlvdSBnZXQgdGhlXG4gIC8vIG5hdHVyYWwgb3JkZXIuXG4gIC8vXG4gIC8vIElmIG9yZGVyZWQgaXMgbm90IHNldCwgcmV0dXJucyBhbiBvYmplY3QgbWFwcGluZyBmcm9tIElEIHRvIGRvYyAoc29ydGVyLFxuICAvLyBza2lwIGFuZCBsaW1pdCBzaG91bGQgbm90IGJlIHNldCkuXG4gIC8vXG4gIC8vIElmIG9yZGVyZWQgaXMgc2V0IGFuZCB0aGlzIGN1cnNvciBpcyBhICRuZWFyIGdlb3F1ZXJ5LCB0aGVuIHRoaXMgZnVuY3Rpb25cbiAgLy8gd2lsbCB1c2UgYW4gX0lkTWFwIHRvIHRyYWNrIGVhY2ggZGlzdGFuY2UgZnJvbSB0aGUgJG5lYXIgYXJndW1lbnQgcG9pbnQgaW5cbiAgLy8gb3JkZXIgdG8gdXNlIGl0IGFzIGEgc29ydCBrZXkuIElmIGFuIF9JZE1hcCBpcyBwYXNzZWQgaW4gdGhlICdkaXN0YW5jZXMnXG4gIC8vIGFyZ3VtZW50LCB0aGlzIGZ1bmN0aW9uIHdpbGwgY2xlYXIgaXQgYW5kIHVzZSBpdCBmb3IgdGhpcyBwdXJwb3NlXG4gIC8vIChvdGhlcndpc2UgaXQgd2lsbCBqdXN0IGNyZWF0ZSBpdHMgb3duIF9JZE1hcCkuIFRoZSBvYnNlcnZlQ2hhbmdlc1xuICAvLyBpbXBsZW1lbnRhdGlvbiB1c2VzIHRoaXMgdG8gcmVtZW1iZXIgdGhlIGRpc3RhbmNlcyBhZnRlciB0aGlzIGZ1bmN0aW9uXG4gIC8vIHJldHVybnMuXG4gIF9nZXRSYXdPYmplY3RzKG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIEJ5IGRlZmF1bHQgdGhpcyBtZXRob2Qgd2lsbCByZXNwZWN0IHNraXAgYW5kIGxpbWl0IGJlY2F1c2UgLmZldGNoKCksXG4gICAgLy8gLmZvckVhY2goKSBldGMuLi4gZXhwZWN0IHRoaXMgYmVoYXZpb3VyLiBJdCBjYW4gYmUgZm9yY2VkIHRvIGlnbm9yZVxuICAgIC8vIHNraXAgYW5kIGxpbWl0IGJ5IHNldHRpbmcgYXBwbHlTa2lwTGltaXQgdG8gZmFsc2UgKC5jb3VudCgpIGRvZXMgdGhpcyxcbiAgICAvLyBmb3IgZXhhbXBsZSlcbiAgICBjb25zdCBhcHBseVNraXBMaW1pdCA9IG9wdGlvbnMuYXBwbHlTa2lwTGltaXQgIT09IGZhbHNlO1xuXG4gICAgLy8gWFhYIHVzZSBPcmRlcmVkRGljdCBpbnN0ZWFkIG9mIGFycmF5LCBhbmQgbWFrZSBJZE1hcCBhbmQgT3JkZXJlZERpY3RcbiAgICAvLyBjb21wYXRpYmxlXG4gICAgY29uc3QgcmVzdWx0cyA9IG9wdGlvbnMub3JkZXJlZCA/IFtdIDogbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG5cbiAgICAvLyBmYXN0IHBhdGggZm9yIHNpbmdsZSBJRCB2YWx1ZVxuICAgIGlmICh0aGlzLl9zZWxlY3RvcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIElmIHlvdSBoYXZlIG5vbi16ZXJvIHNraXAgYW5kIGFzayBmb3IgYSBzaW5nbGUgaWQsIHlvdSBnZXQgbm90aGluZy5cbiAgICAgIC8vIFRoaXMgaXMgc28gaXQgbWF0Y2hlcyB0aGUgYmVoYXZpb3Igb2YgdGhlICd7X2lkOiBmb299JyBwYXRoLlxuICAgICAgaWYgKGFwcGx5U2tpcExpbWl0ICYmIHRoaXMuc2tpcCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZWN0ZWREb2MgPSB0aGlzLmNvbGxlY3Rpb24uX2RvY3MuZ2V0KHRoaXMuX3NlbGVjdG9ySWQpO1xuXG4gICAgICBpZiAoc2VsZWN0ZWREb2MpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMub3JkZXJlZCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChzZWxlY3RlZERvYyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5zZXQodGhpcy5fc2VsZWN0b3JJZCwgc2VsZWN0ZWREb2MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8vIHNsb3cgcGF0aCBmb3IgYXJiaXRyYXJ5IHNlbGVjdG9yLCBzb3J0LCBza2lwLCBsaW1pdFxuXG4gICAgLy8gaW4gdGhlIG9ic2VydmVDaGFuZ2VzIGNhc2UsIGRpc3RhbmNlcyBpcyBhY3R1YWxseSBwYXJ0IG9mIHRoZSBcInF1ZXJ5XCJcbiAgICAvLyAoaWUsIGxpdmUgcmVzdWx0cyBzZXQpIG9iamVjdC4gIGluIG90aGVyIGNhc2VzLCBkaXN0YW5jZXMgaXMgb25seSB1c2VkXG4gICAgLy8gaW5zaWRlIHRoaXMgZnVuY3Rpb24uXG4gICAgbGV0IGRpc3RhbmNlcztcbiAgICBpZiAodGhpcy5tYXRjaGVyLmhhc0dlb1F1ZXJ5KCkgJiYgb3B0aW9ucy5vcmRlcmVkKSB7XG4gICAgICBpZiAob3B0aW9ucy5kaXN0YW5jZXMpIHtcbiAgICAgICAgZGlzdGFuY2VzID0gb3B0aW9ucy5kaXN0YW5jZXM7XG4gICAgICAgIGRpc3RhbmNlcy5jbGVhcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlzdGFuY2VzID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXAoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbGxlY3Rpb24uX2RvY3MuZm9yRWFjaCgoZG9jLCBpZCkgPT4ge1xuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSB0aGlzLm1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGRvYyk7XG5cbiAgICAgIGlmIChtYXRjaFJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMub3JkZXJlZCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChkb2MpO1xuXG4gICAgICAgICAgaWYgKGRpc3RhbmNlcyAmJiBtYXRjaFJlc3VsdC5kaXN0YW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkaXN0YW5jZXMuc2V0KGlkLCBtYXRjaFJlc3VsdC5kaXN0YW5jZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMuc2V0KGlkLCBkb2MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE92ZXJyaWRlIHRvIGVuc3VyZSBhbGwgZG9jcyBhcmUgbWF0Y2hlZCBpZiBpZ25vcmluZyBza2lwICYgbGltaXRcbiAgICAgIGlmICghYXBwbHlTa2lwTGltaXQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEZhc3QgcGF0aCBmb3IgbGltaXRlZCB1bnNvcnRlZCBxdWVyaWVzLlxuICAgICAgLy8gWFhYICdsZW5ndGgnIGNoZWNrIGhlcmUgc2VlbXMgd3JvbmcgZm9yIG9yZGVyZWRcbiAgICAgIHJldHVybiAoXG4gICAgICAgICF0aGlzLmxpbWl0IHx8XG4gICAgICAgIHRoaXMuc2tpcCB8fFxuICAgICAgICB0aGlzLnNvcnRlciB8fFxuICAgICAgICByZXN1bHRzLmxlbmd0aCAhPT0gdGhpcy5saW1pdFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGlmICghb3B0aW9ucy5vcmRlcmVkKSB7XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zb3J0ZXIpIHtcbiAgICAgIHJlc3VsdHMuc29ydCh0aGlzLnNvcnRlci5nZXRDb21wYXJhdG9yKHtkaXN0YW5jZXN9KSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBmdWxsIHNldCBvZiByZXN1bHRzIGlmIHRoZXJlIGlzIG5vIHNraXAgb3IgbGltaXQgb3IgaWYgd2UncmVcbiAgICAvLyBpZ25vcmluZyB0aGVtXG4gICAgaWYgKCFhcHBseVNraXBMaW1pdCB8fCAoIXRoaXMubGltaXQgJiYgIXRoaXMuc2tpcCkpIHtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzLnNsaWNlKFxuICAgICAgdGhpcy5za2lwLFxuICAgICAgdGhpcy5saW1pdCA/IHRoaXMubGltaXQgKyB0aGlzLnNraXAgOiByZXN1bHRzLmxlbmd0aFxuICAgICk7XG4gIH1cblxuICBfcHVibGlzaEN1cnNvcihzdWJzY3JpcHRpb24pIHtcbiAgICAvLyBYWFggbWluaW1vbmdvIHNob3VsZCBub3QgZGVwZW5kIG9uIG1vbmdvLWxpdmVkYXRhIVxuICAgIGlmICghUGFja2FnZS5tb25nbykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2FuXFwndCBwdWJsaXNoIGZyb20gTWluaW1vbmdvIHdpdGhvdXQgdGhlIGBtb25nb2AgcGFja2FnZS4nXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb2xsZWN0aW9uLm5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0NhblxcJ3QgcHVibGlzaCBhIGN1cnNvciBmcm9tIGEgY29sbGVjdGlvbiB3aXRob3V0IGEgbmFtZS4nXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBQYWNrYWdlLm1vbmdvLk1vbmdvLkNvbGxlY3Rpb24uX3B1Ymxpc2hDdXJzb3IoXG4gICAgICB0aGlzLFxuICAgICAgc3Vic2NyaXB0aW9uLFxuICAgICAgdGhpcy5jb2xsZWN0aW9uLm5hbWVcbiAgICApO1xuICB9XG59XG4iLCJpbXBvcnQgQ3Vyc29yIGZyb20gJy4vY3Vyc29yLmpzJztcbmltcG9ydCBPYnNlcnZlSGFuZGxlIGZyb20gJy4vb2JzZXJ2ZV9oYW5kbGUuanMnO1xuaW1wb3J0IHtcbiAgaGFzT3duLFxuICBpc0luZGV4YWJsZSxcbiAgaXNOdW1lcmljS2V5LFxuICBpc09wZXJhdG9yT2JqZWN0LFxuICBwb3B1bGF0ZURvY3VtZW50V2l0aFF1ZXJ5RmllbGRzLFxuICBwcm9qZWN0aW9uRGV0YWlscyxcbn0gZnJvbSAnLi9jb21tb24uanMnO1xuXG4vLyBYWFggdHlwZSBjaGVja2luZyBvbiBzZWxlY3RvcnMgKGdyYWNlZnVsIGVycm9yIGlmIG1hbGZvcm1lZClcblxuLy8gTG9jYWxDb2xsZWN0aW9uOiBhIHNldCBvZiBkb2N1bWVudHMgdGhhdCBzdXBwb3J0cyBxdWVyaWVzIGFuZCBtb2RpZmllcnMuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2NhbENvbGxlY3Rpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAvLyBfaWQgLT4gZG9jdW1lbnQgKGFsc28gY29udGFpbmluZyBpZClcbiAgICB0aGlzLl9kb2NzID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG5cbiAgICB0aGlzLl9vYnNlcnZlUXVldWUgPSBuZXcgTWV0ZW9yLl9TeW5jaHJvbm91c1F1ZXVlKCk7XG5cbiAgICB0aGlzLm5leHRfcWlkID0gMTsgLy8gbGl2ZSBxdWVyeSBpZCBnZW5lcmF0b3JcblxuICAgIC8vIHFpZCAtPiBsaXZlIHF1ZXJ5IG9iamVjdC4ga2V5czpcbiAgICAvLyAgb3JkZXJlZDogYm9vbC4gb3JkZXJlZCBxdWVyaWVzIGhhdmUgYWRkZWRCZWZvcmUvbW92ZWRCZWZvcmUgY2FsbGJhY2tzLlxuICAgIC8vICByZXN1bHRzOiBhcnJheSAob3JkZXJlZCkgb3Igb2JqZWN0ICh1bm9yZGVyZWQpIG9mIGN1cnJlbnQgcmVzdWx0c1xuICAgIC8vICAgIChhbGlhc2VkIHdpdGggdGhpcy5fZG9jcyEpXG4gICAgLy8gIHJlc3VsdHNTbmFwc2hvdDogc25hcHNob3Qgb2YgcmVzdWx0cy4gbnVsbCBpZiBub3QgcGF1c2VkLlxuICAgIC8vICBjdXJzb3I6IEN1cnNvciBvYmplY3QgZm9yIHRoZSBxdWVyeS5cbiAgICAvLyAgc2VsZWN0b3IsIHNvcnRlciwgKGNhbGxiYWNrcyk6IGZ1bmN0aW9uc1xuICAgIHRoaXMucXVlcmllcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAvLyBudWxsIGlmIG5vdCBzYXZpbmcgb3JpZ2luYWxzOyBhbiBJZE1hcCBmcm9tIGlkIHRvIG9yaWdpbmFsIGRvY3VtZW50IHZhbHVlXG4gICAgLy8gaWYgc2F2aW5nIG9yaWdpbmFscy4gU2VlIGNvbW1lbnRzIGJlZm9yZSBzYXZlT3JpZ2luYWxzKCkuXG4gICAgdGhpcy5fc2F2ZWRPcmlnaW5hbHMgPSBudWxsO1xuXG4gICAgLy8gVHJ1ZSB3aGVuIG9ic2VydmVycyBhcmUgcGF1c2VkIGFuZCB3ZSBzaG91bGQgbm90IHNlbmQgY2FsbGJhY2tzLlxuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gIH1cblxuICAvLyBvcHRpb25zIG1heSBpbmNsdWRlIHNvcnQsIHNraXAsIGxpbWl0LCByZWFjdGl2ZVxuICAvLyBzb3J0IG1heSBiZSBhbnkgb2YgdGhlc2UgZm9ybXM6XG4gIC8vICAgICB7YTogMSwgYjogLTF9XG4gIC8vICAgICBbW1wiYVwiLCBcImFzY1wiXSwgW1wiYlwiLCBcImRlc2NcIl1dXG4gIC8vICAgICBbXCJhXCIsIFtcImJcIiwgXCJkZXNjXCJdXVxuICAvLyAgIChpbiB0aGUgZmlyc3QgZm9ybSB5b3UncmUgYmVob2xkZW4gdG8ga2V5IGVudW1lcmF0aW9uIG9yZGVyIGluXG4gIC8vICAgeW91ciBqYXZhc2NyaXB0IFZNKVxuICAvL1xuICAvLyByZWFjdGl2ZTogaWYgZ2l2ZW4sIGFuZCBmYWxzZSwgZG9uJ3QgcmVnaXN0ZXIgd2l0aCBUcmFja2VyIChkZWZhdWx0XG4gIC8vIGlzIHRydWUpXG4gIC8vXG4gIC8vIFhYWCBwb3NzaWJseSBzaG91bGQgc3VwcG9ydCByZXRyaWV2aW5nIGEgc3Vic2V0IG9mIGZpZWxkcz8gYW5kXG4gIC8vIGhhdmUgaXQgYmUgYSBoaW50IChpZ25vcmVkIG9uIHRoZSBjbGllbnQsIHdoZW4gbm90IGNvcHlpbmcgdGhlXG4gIC8vIGRvYz8pXG4gIC8vXG4gIC8vIFhYWCBzb3J0IGRvZXMgbm90IHlldCBzdXBwb3J0IHN1YmtleXMgKCdhLmInKSAuLiBmaXggdGhhdCFcbiAgLy8gWFhYIGFkZCBvbmUgbW9yZSBzb3J0IGZvcm06IFwia2V5XCJcbiAgLy8gWFhYIHRlc3RzXG4gIGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICAvLyBkZWZhdWx0IHN5bnRheCBmb3IgZXZlcnl0aGluZyBpcyB0byBvbWl0IHRoZSBzZWxlY3RvciBhcmd1bWVudC5cbiAgICAvLyBidXQgaWYgc2VsZWN0b3IgaXMgZXhwbGljaXRseSBwYXNzZWQgaW4gYXMgZmFsc2Ugb3IgdW5kZWZpbmVkLCB3ZVxuICAgIC8vIHdhbnQgYSBzZWxlY3RvciB0aGF0IG1hdGNoZXMgbm90aGluZy5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2VsZWN0b3IgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IExvY2FsQ29sbGVjdGlvbi5DdXJzb3IodGhpcywgc2VsZWN0b3IsIG9wdGlvbnMpO1xuICB9XG5cbiAgZmluZE9uZShzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbGVjdG9yID0ge307XG4gICAgfVxuXG4gICAgLy8gTk9URTogYnkgc2V0dGluZyBsaW1pdCAxIGhlcmUsIHdlIGVuZCB1cCB1c2luZyB2ZXJ5IGluZWZmaWNpZW50XG4gICAgLy8gY29kZSB0aGF0IHJlY29tcHV0ZXMgdGhlIHdob2xlIHF1ZXJ5IG9uIGVhY2ggdXBkYXRlLiBUaGUgdXBzaWRlIGlzXG4gICAgLy8gdGhhdCB3aGVuIHlvdSByZWFjdGl2ZWx5IGRlcGVuZCBvbiBhIGZpbmRPbmUgeW91IG9ubHkgZ2V0XG4gICAgLy8gaW52YWxpZGF0ZWQgd2hlbiB0aGUgZm91bmQgb2JqZWN0IGNoYW5nZXMsIG5vdCBhbnkgb2JqZWN0IGluIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24uIE1vc3QgZmluZE9uZSB3aWxsIGJlIGJ5IGlkLCB3aGljaCBoYXMgYSBmYXN0IHBhdGgsIHNvXG4gICAgLy8gdGhpcyBtaWdodCBub3QgYmUgYSBiaWcgZGVhbC4gSW4gbW9zdCBjYXNlcywgaW52YWxpZGF0aW9uIGNhdXNlc1xuICAgIC8vIHRoZSBjYWxsZWQgdG8gcmUtcXVlcnkgYW55d2F5LCBzbyB0aGlzIHNob3VsZCBiZSBhIG5ldCBwZXJmb3JtYW5jZVxuICAgIC8vIGltcHJvdmVtZW50LlxuICAgIG9wdGlvbnMubGltaXQgPSAxO1xuXG4gICAgcmV0dXJuIHRoaXMuZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2goKVswXTtcbiAgfVxuXG4gIC8vIFhYWCBwb3NzaWJseSBlbmZvcmNlIHRoYXQgJ3VuZGVmaW5lZCcgZG9lcyBub3QgYXBwZWFyICh3ZSBhc3N1bWVcbiAgLy8gdGhpcyBpbiBvdXIgaGFuZGxpbmcgb2YgbnVsbCBhbmQgJGV4aXN0cylcbiAgaW5zZXJ0KGRvYywgY2FsbGJhY2spIHtcbiAgICBkb2MgPSBFSlNPTi5jbG9uZShkb2MpO1xuXG4gICAgYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzKGRvYyk7XG5cbiAgICAvLyBpZiB5b3UgcmVhbGx5IHdhbnQgdG8gdXNlIE9iamVjdElEcywgc2V0IHRoaXMgZ2xvYmFsLlxuICAgIC8vIE1vbmdvLkNvbGxlY3Rpb24gc3BlY2lmaWVzIGl0cyBvd24gaWRzIGFuZCBkb2VzIG5vdCB1c2UgdGhpcyBjb2RlLlxuICAgIGlmICghaGFzT3duLmNhbGwoZG9jLCAnX2lkJykpIHtcbiAgICAgIGRvYy5faWQgPSBMb2NhbENvbGxlY3Rpb24uX3VzZU9JRCA/IG5ldyBNb25nb0lELk9iamVjdElEKCkgOiBSYW5kb20uaWQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IGRvYy5faWQ7XG5cbiAgICBpZiAodGhpcy5fZG9jcy5oYXMoaWQpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihgRHVwbGljYXRlIF9pZCAnJHtpZH0nYCk7XG4gICAgfVxuXG4gICAgdGhpcy5fc2F2ZU9yaWdpbmFsKGlkLCB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2RvY3Muc2V0KGlkLCBkb2MpO1xuXG4gICAgY29uc3QgcXVlcmllc1RvUmVjb21wdXRlID0gW107XG5cbiAgICAvLyB0cmlnZ2VyIGxpdmUgcXVlcmllcyB0aGF0IG1hdGNoXG4gICAgT2JqZWN0LmtleXModGhpcy5xdWVyaWVzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkuZGlydHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHF1ZXJ5Lm1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGRvYyk7XG5cbiAgICAgIGlmIChtYXRjaFJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgaWYgKHF1ZXJ5LmRpc3RhbmNlcyAmJiBtYXRjaFJlc3VsdC5kaXN0YW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcXVlcnkuZGlzdGFuY2VzLnNldChpZCwgbWF0Y2hSZXN1bHQuZGlzdGFuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHF1ZXJ5LmN1cnNvci5za2lwIHx8IHF1ZXJ5LmN1cnNvci5saW1pdCkge1xuICAgICAgICAgIHF1ZXJpZXNUb1JlY29tcHV0ZS5wdXNoKHFpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTG9jYWxDb2xsZWN0aW9uLl9pbnNlcnRJblJlc3VsdHMocXVlcnksIGRvYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHF1ZXJpZXNUb1JlY29tcHV0ZS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBpZiAodGhpcy5xdWVyaWVzW3FpZF0pIHtcbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUmVzdWx0cyh0aGlzLnF1ZXJpZXNbcWlkXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcblxuICAgIC8vIERlZmVyIGJlY2F1c2UgdGhlIGNhbGxlciBsaWtlbHkgZG9lc24ndCBleHBlY3QgdGhlIGNhbGxiYWNrIHRvIGJlIHJ1blxuICAgIC8vIGltbWVkaWF0ZWx5LlxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgTWV0ZW9yLmRlZmVyKCgpID0+IHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgaWQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgLy8gUGF1c2UgdGhlIG9ic2VydmVycy4gTm8gY2FsbGJhY2tzIGZyb20gb2JzZXJ2ZXJzIHdpbGwgZmlyZSB1bnRpbFxuICAvLyAncmVzdW1lT2JzZXJ2ZXJzJyBpcyBjYWxsZWQuXG4gIHBhdXNlT2JzZXJ2ZXJzKCkge1xuICAgIC8vIE5vLW9wIGlmIGFscmVhZHkgcGF1c2VkLlxuICAgIGlmICh0aGlzLnBhdXNlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgJ3BhdXNlZCcgZmxhZyBzdWNoIHRoYXQgbmV3IG9ic2VydmVyIG1lc3NhZ2VzIGRvbid0IGZpcmUuXG4gICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xuXG4gICAgLy8gVGFrZSBhIHNuYXBzaG90IG9mIHRoZSBxdWVyeSByZXN1bHRzIGZvciBlYWNoIHF1ZXJ5LlxuICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcbiAgICAgIHF1ZXJ5LnJlc3VsdHNTbmFwc2hvdCA9IEVKU09OLmNsb25lKHF1ZXJ5LnJlc3VsdHMpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlKHNlbGVjdG9yLCBjYWxsYmFjaykge1xuICAgIC8vIEVhc3kgc3BlY2lhbCBjYXNlOiBpZiB3ZSdyZSBub3QgY2FsbGluZyBvYnNlcnZlQ2hhbmdlcyBjYWxsYmFja3MgYW5kXG4gICAgLy8gd2UncmUgbm90IHNhdmluZyBvcmlnaW5hbHMgYW5kIHdlIGdvdCBhc2tlZCB0byByZW1vdmUgZXZlcnl0aGluZywgdGhlblxuICAgIC8vIGp1c3QgZW1wdHkgZXZlcnl0aGluZyBkaXJlY3RseS5cbiAgICBpZiAodGhpcy5wYXVzZWQgJiYgIXRoaXMuX3NhdmVkT3JpZ2luYWxzICYmIEVKU09OLmVxdWFscyhzZWxlY3Rvciwge30pKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kb2NzLnNpemUoKTtcblxuICAgICAgdGhpcy5fZG9jcy5jbGVhcigpO1xuXG4gICAgICBPYmplY3Qua2V5cyh0aGlzLnF1ZXJpZXMpLmZvckVhY2gocWlkID0+IHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgICBpZiAocXVlcnkub3JkZXJlZCkge1xuICAgICAgICAgIHF1ZXJ5LnJlc3VsdHMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyeS5yZXN1bHRzLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgTWV0ZW9yLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHNlbGVjdG9yKTtcbiAgICBjb25zdCByZW1vdmUgPSBbXTtcblxuICAgIHRoaXMuX2VhY2hQb3NzaWJseU1hdGNoaW5nRG9jKHNlbGVjdG9yLCAoZG9jLCBpZCkgPT4ge1xuICAgICAgaWYgKG1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGRvYykucmVzdWx0KSB7XG4gICAgICAgIHJlbW92ZS5wdXNoKGlkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHF1ZXJpZXNUb1JlY29tcHV0ZSA9IFtdO1xuICAgIGNvbnN0IHF1ZXJ5UmVtb3ZlID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcmVtb3ZlSWQgPSByZW1vdmVbaV07XG4gICAgICBjb25zdCByZW1vdmVEb2MgPSB0aGlzLl9kb2NzLmdldChyZW1vdmVJZCk7XG5cbiAgICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICAgIGlmIChxdWVyeS5kaXJ0eSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWVyeS5tYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhyZW1vdmVEb2MpLnJlc3VsdCkge1xuICAgICAgICAgIGlmIChxdWVyeS5jdXJzb3Iuc2tpcCB8fCBxdWVyeS5jdXJzb3IubGltaXQpIHtcbiAgICAgICAgICAgIHF1ZXJpZXNUb1JlY29tcHV0ZS5wdXNoKHFpZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHF1ZXJ5UmVtb3ZlLnB1c2goe3FpZCwgZG9jOiByZW1vdmVEb2N9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9zYXZlT3JpZ2luYWwocmVtb3ZlSWQsIHJlbW92ZURvYyk7XG4gICAgICB0aGlzLl9kb2NzLnJlbW92ZShyZW1vdmVJZCk7XG4gICAgfVxuXG4gICAgLy8gcnVuIGxpdmUgcXVlcnkgY2FsbGJhY2tzIF9hZnRlcl8gd2UndmUgcmVtb3ZlZCB0aGUgZG9jdW1lbnRzLlxuICAgIHF1ZXJ5UmVtb3ZlLmZvckVhY2gocmVtb3ZlID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3JlbW92ZS5xaWRdO1xuXG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgcXVlcnkuZGlzdGFuY2VzICYmIHF1ZXJ5LmRpc3RhbmNlcy5yZW1vdmUocmVtb3ZlLmRvYy5faWQpO1xuICAgICAgICBMb2NhbENvbGxlY3Rpb24uX3JlbW92ZUZyb21SZXN1bHRzKHF1ZXJ5LCByZW1vdmUuZG9jKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHF1ZXJpZXNUb1JlY29tcHV0ZS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUmVzdWx0cyhxdWVyeSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHJlbW92ZS5sZW5ndGg7XG5cbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIE1ldGVvci5kZWZlcigoKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gUmVzdW1lIHRoZSBvYnNlcnZlcnMuIE9ic2VydmVycyBpbW1lZGlhdGVseSByZWNlaXZlIGNoYW5nZVxuICAvLyBub3RpZmljYXRpb25zIHRvIGJyaW5nIHRoZW0gdG8gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlXG4gIC8vIGRhdGFiYXNlLiBOb3RlIHRoYXQgdGhpcyBpcyBub3QganVzdCByZXBsYXlpbmcgYWxsIHRoZSBjaGFuZ2VzIHRoYXRcbiAgLy8gaGFwcGVuZWQgZHVyaW5nIHRoZSBwYXVzZSwgaXQgaXMgYSBzbWFydGVyICdjb2FsZXNjZWQnIGRpZmYuXG4gIHJlc3VtZU9ic2VydmVycygpIHtcbiAgICAvLyBOby1vcCBpZiBub3QgcGF1c2VkLlxuICAgIGlmICghdGhpcy5wYXVzZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVbnNldCB0aGUgJ3BhdXNlZCcgZmxhZy4gTWFrZSBzdXJlIHRvIGRvIHRoaXMgZmlyc3QsIG90aGVyd2lzZVxuICAgIC8vIG9ic2VydmVyIG1ldGhvZHMgd29uJ3QgYWN0dWFsbHkgZmlyZSB3aGVuIHdlIHRyaWdnZXIgdGhlbS5cbiAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5xdWVyaWVzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkuZGlydHkpIHtcbiAgICAgICAgcXVlcnkuZGlydHkgPSBmYWxzZTtcblxuICAgICAgICAvLyByZS1jb21wdXRlIHJlc3VsdHMgd2lsbCBwZXJmb3JtIGBMb2NhbENvbGxlY3Rpb24uX2RpZmZRdWVyeUNoYW5nZXNgXG4gICAgICAgIC8vIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgIHRoaXMuX3JlY29tcHV0ZVJlc3VsdHMocXVlcnksIHF1ZXJ5LnJlc3VsdHNTbmFwc2hvdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEaWZmIHRoZSBjdXJyZW50IHJlc3VsdHMgYWdhaW5zdCB0aGUgc25hcHNob3QgYW5kIHNlbmQgdG8gb2JzZXJ2ZXJzLlxuICAgICAgICAvLyBwYXNzIHRoZSBxdWVyeSBvYmplY3QgZm9yIGl0cyBvYnNlcnZlciBjYWxsYmFja3MuXG4gICAgICAgIExvY2FsQ29sbGVjdGlvbi5fZGlmZlF1ZXJ5Q2hhbmdlcyhcbiAgICAgICAgICBxdWVyeS5vcmRlcmVkLFxuICAgICAgICAgIHF1ZXJ5LnJlc3VsdHNTbmFwc2hvdCxcbiAgICAgICAgICBxdWVyeS5yZXN1bHRzLFxuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIHtwcm9qZWN0aW9uRm46IHF1ZXJ5LnByb2plY3Rpb25Gbn1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcXVlcnkucmVzdWx0c1NuYXBzaG90ID0gbnVsbDtcbiAgICB9KTtcblxuICAgIHRoaXMuX29ic2VydmVRdWV1ZS5kcmFpbigpO1xuICB9XG5cbiAgcmV0cmlldmVPcmlnaW5hbHMoKSB7XG4gICAgaWYgKCF0aGlzLl9zYXZlZE9yaWdpbmFscykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYWxsZWQgcmV0cmlldmVPcmlnaW5hbHMgd2l0aG91dCBzYXZlT3JpZ2luYWxzJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3JpZ2luYWxzID0gdGhpcy5fc2F2ZWRPcmlnaW5hbHM7XG5cbiAgICB0aGlzLl9zYXZlZE9yaWdpbmFscyA9IG51bGw7XG5cbiAgICByZXR1cm4gb3JpZ2luYWxzO1xuICB9XG5cbiAgLy8gVG8gdHJhY2sgd2hhdCBkb2N1bWVudHMgYXJlIGFmZmVjdGVkIGJ5IGEgcGllY2Ugb2YgY29kZSwgY2FsbFxuICAvLyBzYXZlT3JpZ2luYWxzKCkgYmVmb3JlIGl0IGFuZCByZXRyaWV2ZU9yaWdpbmFscygpIGFmdGVyIGl0LlxuICAvLyByZXRyaWV2ZU9yaWdpbmFscyByZXR1cm5zIGFuIG9iamVjdCB3aG9zZSBrZXlzIGFyZSB0aGUgaWRzIG9mIHRoZSBkb2N1bWVudHNcbiAgLy8gdGhhdCB3ZXJlIGFmZmVjdGVkIHNpbmNlIHRoZSBjYWxsIHRvIHNhdmVPcmlnaW5hbHMoKSwgYW5kIHRoZSB2YWx1ZXMgYXJlXG4gIC8vIGVxdWFsIHRvIHRoZSBkb2N1bWVudCdzIGNvbnRlbnRzIGF0IHRoZSB0aW1lIG9mIHNhdmVPcmlnaW5hbHMuIChJbiB0aGUgY2FzZVxuICAvLyBvZiBhbiBpbnNlcnRlZCBkb2N1bWVudCwgdW5kZWZpbmVkIGlzIHRoZSB2YWx1ZS4pIFlvdSBtdXN0IGFsdGVybmF0ZVxuICAvLyBiZXR3ZWVuIGNhbGxzIHRvIHNhdmVPcmlnaW5hbHMoKSBhbmQgcmV0cmlldmVPcmlnaW5hbHMoKS5cbiAgc2F2ZU9yaWdpbmFscygpIHtcbiAgICBpZiAodGhpcy5fc2F2ZWRPcmlnaW5hbHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FsbGVkIHNhdmVPcmlnaW5hbHMgdHdpY2Ugd2l0aG91dCByZXRyaWV2ZU9yaWdpbmFscycpO1xuICAgIH1cblxuICAgIHRoaXMuX3NhdmVkT3JpZ2luYWxzID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG4gIH1cblxuICAvLyBYWFggYXRvbWljaXR5OiBpZiBtdWx0aSBpcyB0cnVlLCBhbmQgb25lIG1vZGlmaWNhdGlvbiBmYWlscywgZG9cbiAgLy8gd2Ugcm9sbGJhY2sgdGhlIHdob2xlIG9wZXJhdGlvbiwgb3Igd2hhdD9cbiAgdXBkYXRlKHNlbGVjdG9yLCBtb2QsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCEgY2FsbGJhY2sgJiYgb3B0aW9ucyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHNlbGVjdG9yLCB0cnVlKTtcblxuICAgIC8vIFNhdmUgdGhlIG9yaWdpbmFsIHJlc3VsdHMgb2YgYW55IHF1ZXJ5IHRoYXQgd2UgbWlnaHQgbmVlZCB0b1xuICAgIC8vIF9yZWNvbXB1dGVSZXN1bHRzIG9uLCBiZWNhdXNlIF9tb2RpZnlBbmROb3RpZnkgd2lsbCBtdXRhdGUgdGhlIG9iamVjdHMgaW5cbiAgICAvLyBpdC4gKFdlIGRvbid0IG5lZWQgdG8gc2F2ZSB0aGUgb3JpZ2luYWwgcmVzdWx0cyBvZiBwYXVzZWQgcXVlcmllcyBiZWNhdXNlXG4gICAgLy8gdGhleSBhbHJlYWR5IGhhdmUgYSByZXN1bHRzU25hcHNob3QgYW5kIHdlIHdvbid0IGJlIGRpZmZpbmcgaW5cbiAgICAvLyBfcmVjb21wdXRlUmVzdWx0cy4pXG4gICAgY29uc3QgcWlkVG9PcmlnaW5hbFJlc3VsdHMgPSB7fTtcblxuICAgIC8vIFdlIHNob3VsZCBvbmx5IGNsb25lIGVhY2ggZG9jdW1lbnQgb25jZSwgZXZlbiBpZiBpdCBhcHBlYXJzIGluIG11bHRpcGxlXG4gICAgLy8gcXVlcmllc1xuICAgIGNvbnN0IGRvY01hcCA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICAgIGNvbnN0IGlkc01hdGNoZWQgPSBMb2NhbENvbGxlY3Rpb24uX2lkc01hdGNoZWRCeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgaWYgKChxdWVyeS5jdXJzb3Iuc2tpcCB8fCBxdWVyeS5jdXJzb3IubGltaXQpICYmICEgdGhpcy5wYXVzZWQpIHtcbiAgICAgICAgLy8gQ2F0Y2ggdGhlIGNhc2Ugb2YgYSByZWFjdGl2ZSBgY291bnQoKWAgb24gYSBjdXJzb3Igd2l0aCBza2lwXG4gICAgICAgIC8vIG9yIGxpbWl0LCB3aGljaCByZWdpc3RlcnMgYW4gdW5vcmRlcmVkIG9ic2VydmUuIFRoaXMgaXMgYVxuICAgICAgICAvLyBwcmV0dHkgcmFyZSBjYXNlLCBzbyB3ZSBqdXN0IGNsb25lIHRoZSBlbnRpcmUgcmVzdWx0IHNldCB3aXRoXG4gICAgICAgIC8vIG5vIG9wdGltaXphdGlvbnMgZm9yIGRvY3VtZW50cyB0aGF0IGFwcGVhciBpbiB0aGVzZSByZXN1bHRcbiAgICAgICAgLy8gc2V0cyBhbmQgb3RoZXIgcXVlcmllcy5cbiAgICAgICAgaWYgKHF1ZXJ5LnJlc3VsdHMgaW5zdGFuY2VvZiBMb2NhbENvbGxlY3Rpb24uX0lkTWFwKSB7XG4gICAgICAgICAgcWlkVG9PcmlnaW5hbFJlc3VsdHNbcWlkXSA9IHF1ZXJ5LnJlc3VsdHMuY2xvbmUoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShxdWVyeS5yZXN1bHRzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBc3NlcnRpb24gZmFpbGVkOiBxdWVyeS5yZXN1bHRzIG5vdCBhbiBhcnJheScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xvbmVzIGEgZG9jdW1lbnQgdG8gYmUgc3RvcmVkIGluIGBxaWRUb09yaWdpbmFsUmVzdWx0c2BcbiAgICAgICAgLy8gYmVjYXVzZSBpdCBtYXkgYmUgbW9kaWZpZWQgYmVmb3JlIHRoZSBuZXcgYW5kIG9sZCByZXN1bHQgc2V0c1xuICAgICAgICAvLyBhcmUgZGlmZmVkLiBCdXQgaWYgd2Uga25vdyBleGFjdGx5IHdoaWNoIGRvY3VtZW50IElEcyB3ZSdyZVxuICAgICAgICAvLyBnb2luZyB0byBtb2RpZnksIHRoZW4gd2Ugb25seSBuZWVkIHRvIGNsb25lIHRob3NlLlxuICAgICAgICBjb25zdCBtZW1vaXplZENsb25lSWZOZWVkZWQgPSBkb2MgPT4ge1xuICAgICAgICAgIGlmIChkb2NNYXAuaGFzKGRvYy5faWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jTWFwLmdldChkb2MuX2lkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBkb2NUb01lbW9pemUgPSAoXG4gICAgICAgICAgICBpZHNNYXRjaGVkICYmXG4gICAgICAgICAgICAhaWRzTWF0Y2hlZC5zb21lKGlkID0+IEVKU09OLmVxdWFscyhpZCwgZG9jLl9pZCkpXG4gICAgICAgICAgKSA/IGRvYyA6IEVKU09OLmNsb25lKGRvYyk7XG5cbiAgICAgICAgICBkb2NNYXAuc2V0KGRvYy5faWQsIGRvY1RvTWVtb2l6ZSk7XG5cbiAgICAgICAgICByZXR1cm4gZG9jVG9NZW1vaXplO1xuICAgICAgICB9O1xuXG4gICAgICAgIHFpZFRvT3JpZ2luYWxSZXN1bHRzW3FpZF0gPSBxdWVyeS5yZXN1bHRzLm1hcChtZW1vaXplZENsb25lSWZOZWVkZWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVjb21wdXRlUWlkcyA9IHt9O1xuXG4gICAgbGV0IHVwZGF0ZUNvdW50ID0gMDtcblxuICAgIHRoaXMuX2VhY2hQb3NzaWJseU1hdGNoaW5nRG9jKHNlbGVjdG9yLCAoZG9jLCBpZCkgPT4ge1xuICAgICAgY29uc3QgcXVlcnlSZXN1bHQgPSBtYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhkb2MpO1xuXG4gICAgICBpZiAocXVlcnlSZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIC8vIFhYWCBTaG91bGQgd2Ugc2F2ZSB0aGUgb3JpZ2luYWwgZXZlbiBpZiBtb2QgZW5kcyB1cCBiZWluZyBhIG5vLW9wP1xuICAgICAgICB0aGlzLl9zYXZlT3JpZ2luYWwoaWQsIGRvYyk7XG4gICAgICAgIHRoaXMuX21vZGlmeUFuZE5vdGlmeShcbiAgICAgICAgICBkb2MsXG4gICAgICAgICAgbW9kLFxuICAgICAgICAgIHJlY29tcHV0ZVFpZHMsXG4gICAgICAgICAgcXVlcnlSZXN1bHQuYXJyYXlJbmRpY2VzXG4gICAgICAgICk7XG5cbiAgICAgICAgKyt1cGRhdGVDb3VudDtcblxuICAgICAgICBpZiAoIW9wdGlvbnMubXVsdGkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyhyZWNvbXB1dGVRaWRzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUmVzdWx0cyhxdWVyeSwgcWlkVG9PcmlnaW5hbFJlc3VsdHNbcWlkXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcblxuICAgIC8vIElmIHdlIGFyZSBkb2luZyBhbiB1cHNlcnQsIGFuZCB3ZSBkaWRuJ3QgbW9kaWZ5IGFueSBkb2N1bWVudHMgeWV0LCB0aGVuXG4gICAgLy8gaXQncyB0aW1lIHRvIGRvIGFuIGluc2VydC4gRmlndXJlIG91dCB3aGF0IGRvY3VtZW50IHdlIGFyZSBpbnNlcnRpbmcsIGFuZFxuICAgIC8vIGdlbmVyYXRlIGFuIGlkIGZvciBpdC5cbiAgICBsZXQgaW5zZXJ0ZWRJZDtcbiAgICBpZiAodXBkYXRlQ291bnQgPT09IDAgJiYgb3B0aW9ucy51cHNlcnQpIHtcbiAgICAgIGNvbnN0IGRvYyA9IExvY2FsQ29sbGVjdGlvbi5fY3JlYXRlVXBzZXJ0RG9jdW1lbnQoc2VsZWN0b3IsIG1vZCk7XG4gICAgICBpZiAoISBkb2MuX2lkICYmIG9wdGlvbnMuaW5zZXJ0ZWRJZCkge1xuICAgICAgICBkb2MuX2lkID0gb3B0aW9ucy5pbnNlcnRlZElkO1xuICAgICAgfVxuXG4gICAgICBpbnNlcnRlZElkID0gdGhpcy5pbnNlcnQoZG9jKTtcbiAgICAgIHVwZGF0ZUNvdW50ID0gMTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBhZmZlY3RlZCBkb2N1bWVudHMsIG9yIGluIHRoZSB1cHNlcnQgY2FzZSwgYW4gb2JqZWN0XG4gICAgLy8gY29udGFpbmluZyB0aGUgbnVtYmVyIG9mIGFmZmVjdGVkIGRvY3MgYW5kIHRoZSBpZCBvZiB0aGUgZG9jIHRoYXQgd2FzXG4gICAgLy8gaW5zZXJ0ZWQsIGlmIGFueS5cbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmIChvcHRpb25zLl9yZXR1cm5PYmplY3QpIHtcbiAgICAgIHJlc3VsdCA9IHtudW1iZXJBZmZlY3RlZDogdXBkYXRlQ291bnR9O1xuXG4gICAgICBpZiAoaW5zZXJ0ZWRJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRlZElkID0gaW5zZXJ0ZWRJZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gdXBkYXRlQ291bnQ7XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIEEgY29udmVuaWVuY2Ugd3JhcHBlciBvbiB1cGRhdGUuIExvY2FsQ29sbGVjdGlvbi51cHNlcnQoc2VsLCBtb2QpIGlzXG4gIC8vIGVxdWl2YWxlbnQgdG8gTG9jYWxDb2xsZWN0aW9uLnVwZGF0ZShzZWwsIG1vZCwge3Vwc2VydDogdHJ1ZSxcbiAgLy8gX3JldHVybk9iamVjdDogdHJ1ZX0pLlxuICB1cHNlcnQoc2VsZWN0b3IsIG1vZCwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBpZiAoIWNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlKFxuICAgICAgc2VsZWN0b3IsXG4gICAgICBtb2QsXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7dXBzZXJ0OiB0cnVlLCBfcmV0dXJuT2JqZWN0OiB0cnVlfSksXG4gICAgICBjYWxsYmFja1xuICAgICk7XG4gIH1cblxuICAvLyBJdGVyYXRlcyBvdmVyIGEgc3Vic2V0IG9mIGRvY3VtZW50cyB0aGF0IGNvdWxkIG1hdGNoIHNlbGVjdG9yOyBjYWxsc1xuICAvLyBmbihkb2MsIGlkKSBvbiBlYWNoIG9mIHRoZW0uICBTcGVjaWZpY2FsbHksIGlmIHNlbGVjdG9yIHNwZWNpZmllc1xuICAvLyBzcGVjaWZpYyBfaWQncywgaXQgb25seSBsb29rcyBhdCB0aG9zZS4gIGRvYyBpcyAqbm90KiBjbG9uZWQ6IGl0IGlzIHRoZVxuICAvLyBzYW1lIG9iamVjdCB0aGF0IGlzIGluIF9kb2NzLlxuICBfZWFjaFBvc3NpYmx5TWF0Y2hpbmdEb2Moc2VsZWN0b3IsIGZuKSB7XG4gICAgY29uc3Qgc3BlY2lmaWNJZHMgPSBMb2NhbENvbGxlY3Rpb24uX2lkc01hdGNoZWRCeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIGlmIChzcGVjaWZpY0lkcykge1xuICAgICAgc3BlY2lmaWNJZHMuc29tZShpZCA9PiB7XG4gICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuX2RvY3MuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGRvYywgaWQpID09PSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2RvY3MuZm9yRWFjaChmbik7XG4gICAgfVxuICB9XG5cbiAgX21vZGlmeUFuZE5vdGlmeShkb2MsIG1vZCwgcmVjb21wdXRlUWlkcywgYXJyYXlJbmRpY2VzKSB7XG4gICAgY29uc3QgbWF0Y2hlZF9iZWZvcmUgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgaWYgKHF1ZXJ5LmRpcnR5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHF1ZXJ5Lm9yZGVyZWQpIHtcbiAgICAgICAgbWF0Y2hlZF9iZWZvcmVbcWlkXSA9IHF1ZXJ5Lm1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGRvYykucmVzdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQmVjYXVzZSB3ZSBkb24ndCBzdXBwb3J0IHNraXAgb3IgbGltaXQgKHlldCkgaW4gdW5vcmRlcmVkIHF1ZXJpZXMsIHdlXG4gICAgICAgIC8vIGNhbiBqdXN0IGRvIGEgZGlyZWN0IGxvb2t1cC5cbiAgICAgICAgbWF0Y2hlZF9iZWZvcmVbcWlkXSA9IHF1ZXJ5LnJlc3VsdHMuaGFzKGRvYy5faWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgb2xkX2RvYyA9IEVKU09OLmNsb25lKGRvYyk7XG5cbiAgICBMb2NhbENvbGxlY3Rpb24uX21vZGlmeShkb2MsIG1vZCwge2FycmF5SW5kaWNlc30pO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5xdWVyaWVzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkuZGlydHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhZnRlck1hdGNoID0gcXVlcnkubWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoZG9jKTtcbiAgICAgIGNvbnN0IGFmdGVyID0gYWZ0ZXJNYXRjaC5yZXN1bHQ7XG4gICAgICBjb25zdCBiZWZvcmUgPSBtYXRjaGVkX2JlZm9yZVtxaWRdO1xuXG4gICAgICBpZiAoYWZ0ZXIgJiYgcXVlcnkuZGlzdGFuY2VzICYmIGFmdGVyTWF0Y2guZGlzdGFuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBxdWVyeS5kaXN0YW5jZXMuc2V0KGRvYy5faWQsIGFmdGVyTWF0Y2guZGlzdGFuY2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAocXVlcnkuY3Vyc29yLnNraXAgfHwgcXVlcnkuY3Vyc29yLmxpbWl0KSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcmVjb21wdXRlIGFueSBxdWVyeSB3aGVyZSB0aGUgZG9jIG1heSBoYXZlIGJlZW4gaW4gdGhlXG4gICAgICAgIC8vIGN1cnNvcidzIHdpbmRvdyBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSB1cGRhdGUuIChOb3RlIHRoYXQgaWYgc2tpcFxuICAgICAgICAvLyBvciBsaW1pdCBpcyBzZXQsIFwiYmVmb3JlXCIgYW5kIFwiYWZ0ZXJcIiBiZWluZyB0cnVlIGRvIG5vdCBuZWNlc3NhcmlseVxuICAgICAgICAvLyBtZWFuIHRoYXQgdGhlIGRvY3VtZW50IGlzIGluIHRoZSBjdXJzb3IncyBvdXRwdXQgYWZ0ZXIgc2tpcC9saW1pdCBpc1xuICAgICAgICAvLyBhcHBsaWVkLi4uIGJ1dCBpZiB0aGV5IGFyZSBmYWxzZSwgdGhlbiB0aGUgZG9jdW1lbnQgZGVmaW5pdGVseSBpcyBOT1RcbiAgICAgICAgLy8gaW4gdGhlIG91dHB1dC4gU28gaXQncyBzYWZlIHRvIHNraXAgcmVjb21wdXRlIGlmIG5laXRoZXIgYmVmb3JlIG9yXG4gICAgICAgIC8vIGFmdGVyIGFyZSB0cnVlLilcbiAgICAgICAgaWYgKGJlZm9yZSB8fCBhZnRlcikge1xuICAgICAgICAgIHJlY29tcHV0ZVFpZHNbcWlkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYmVmb3JlICYmICFhZnRlcikge1xuICAgICAgICBMb2NhbENvbGxlY3Rpb24uX3JlbW92ZUZyb21SZXN1bHRzKHF1ZXJ5LCBkb2MpO1xuICAgICAgfSBlbHNlIGlmICghYmVmb3JlICYmIGFmdGVyKSB7XG4gICAgICAgIExvY2FsQ29sbGVjdGlvbi5faW5zZXJ0SW5SZXN1bHRzKHF1ZXJ5LCBkb2MpO1xuICAgICAgfSBlbHNlIGlmIChiZWZvcmUgJiYgYWZ0ZXIpIHtcbiAgICAgICAgTG9jYWxDb2xsZWN0aW9uLl91cGRhdGVJblJlc3VsdHMocXVlcnksIGRvYywgb2xkX2RvYyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBSZWNvbXB1dGVzIHRoZSByZXN1bHRzIG9mIGEgcXVlcnkgYW5kIHJ1bnMgb2JzZXJ2ZSBjYWxsYmFja3MgZm9yIHRoZVxuICAvLyBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHByZXZpb3VzIHJlc3VsdHMgYW5kIHRoZSBjdXJyZW50IHJlc3VsdHMgKHVubGVzc1xuICAvLyBwYXVzZWQpLiBVc2VkIGZvciBza2lwL2xpbWl0IHF1ZXJpZXMuXG4gIC8vXG4gIC8vIFdoZW4gdGhpcyBpcyB1c2VkIGJ5IGluc2VydCBvciByZW1vdmUsIGl0IGNhbiBqdXN0IHVzZSBxdWVyeS5yZXN1bHRzIGZvclxuICAvLyB0aGUgb2xkIHJlc3VsdHMgKGFuZCB0aGVyZSdzIG5vIG5lZWQgdG8gcGFzcyBpbiBvbGRSZXN1bHRzKSwgYmVjYXVzZSB0aGVzZVxuICAvLyBvcGVyYXRpb25zIGRvbid0IG11dGF0ZSB0aGUgZG9jdW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uLiBVcGRhdGUgbmVlZHMgdG9cbiAgLy8gcGFzcyBpbiBhbiBvbGRSZXN1bHRzIHdoaWNoIHdhcyBkZWVwLWNvcGllZCBiZWZvcmUgdGhlIG1vZGlmaWVyIHdhc1xuICAvLyBhcHBsaWVkLlxuICAvL1xuICAvLyBvbGRSZXN1bHRzIGlzIGd1YXJhbnRlZWQgdG8gYmUgaWdub3JlZCBpZiB0aGUgcXVlcnkgaXMgbm90IHBhdXNlZC5cbiAgX3JlY29tcHV0ZVJlc3VsdHMocXVlcnksIG9sZFJlc3VsdHMpIHtcbiAgICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICAgIC8vIFRoZXJlJ3Mgbm8gcmVhc29uIHRvIHJlY29tcHV0ZSB0aGUgcmVzdWx0cyBub3cgYXMgd2UncmUgc3RpbGwgcGF1c2VkLlxuICAgICAgLy8gQnkgZmxhZ2dpbmcgdGhlIHF1ZXJ5IGFzIFwiZGlydHlcIiwgdGhlIHJlY29tcHV0ZSB3aWxsIGJlIHBlcmZvcm1lZFxuICAgICAgLy8gd2hlbiByZXN1bWVPYnNlcnZlcnMgaXMgY2FsbGVkLlxuICAgICAgcXVlcnkuZGlydHkgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5wYXVzZWQgJiYgIW9sZFJlc3VsdHMpIHtcbiAgICAgIG9sZFJlc3VsdHMgPSBxdWVyeS5yZXN1bHRzO1xuICAgIH1cblxuICAgIGlmIChxdWVyeS5kaXN0YW5jZXMpIHtcbiAgICAgIHF1ZXJ5LmRpc3RhbmNlcy5jbGVhcigpO1xuICAgIH1cblxuICAgIHF1ZXJ5LnJlc3VsdHMgPSBxdWVyeS5jdXJzb3IuX2dldFJhd09iamVjdHMoe1xuICAgICAgZGlzdGFuY2VzOiBxdWVyeS5kaXN0YW5jZXMsXG4gICAgICBvcmRlcmVkOiBxdWVyeS5vcmRlcmVkXG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgICBMb2NhbENvbGxlY3Rpb24uX2RpZmZRdWVyeUNoYW5nZXMoXG4gICAgICAgIHF1ZXJ5Lm9yZGVyZWQsXG4gICAgICAgIG9sZFJlc3VsdHMsXG4gICAgICAgIHF1ZXJ5LnJlc3VsdHMsXG4gICAgICAgIHF1ZXJ5LFxuICAgICAgICB7cHJvamVjdGlvbkZuOiBxdWVyeS5wcm9qZWN0aW9uRm59XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIF9zYXZlT3JpZ2luYWwoaWQsIGRvYykge1xuICAgIC8vIEFyZSB3ZSBldmVuIHRyeWluZyB0byBzYXZlIG9yaWdpbmFscz9cbiAgICBpZiAoIXRoaXMuX3NhdmVkT3JpZ2luYWxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSGF2ZSB3ZSBwcmV2aW91c2x5IG11dGF0ZWQgdGhlIG9yaWdpbmFsIChhbmQgc28gJ2RvYycgaXMgbm90IGFjdHVhbGx5XG4gICAgLy8gb3JpZ2luYWwpPyAgKE5vdGUgdGhlICdoYXMnIGNoZWNrIHJhdGhlciB0aGFuIHRydXRoOiB3ZSBzdG9yZSB1bmRlZmluZWRcbiAgICAvLyBoZXJlIGZvciBpbnNlcnRlZCBkb2NzISlcbiAgICBpZiAodGhpcy5fc2F2ZWRPcmlnaW5hbHMuaGFzKGlkKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NhdmVkT3JpZ2luYWxzLnNldChpZCwgRUpTT04uY2xvbmUoZG9jKSk7XG4gIH1cbn1cblxuTG9jYWxDb2xsZWN0aW9uLkN1cnNvciA9IEN1cnNvcjtcblxuTG9jYWxDb2xsZWN0aW9uLk9ic2VydmVIYW5kbGUgPSBPYnNlcnZlSGFuZGxlO1xuXG4vLyBYWFggbWF5YmUgbW92ZSB0aGVzZSBpbnRvIGFub3RoZXIgT2JzZXJ2ZUhlbHBlcnMgcGFja2FnZSBvciBzb21ldGhpbmdcblxuLy8gX0NhY2hpbmdDaGFuZ2VPYnNlcnZlciBpcyBhbiBvYmplY3Qgd2hpY2ggcmVjZWl2ZXMgb2JzZXJ2ZUNoYW5nZXMgY2FsbGJhY2tzXG4vLyBhbmQga2VlcHMgYSBjYWNoZSBvZiB0aGUgY3VycmVudCBjdXJzb3Igc3RhdGUgdXAgdG8gZGF0ZSBpbiB0aGlzLmRvY3MuIFVzZXJzXG4vLyBvZiB0aGlzIGNsYXNzIHNob3VsZCByZWFkIHRoZSBkb2NzIGZpZWxkIGJ1dCBub3QgbW9kaWZ5IGl0LiBZb3Ugc2hvdWxkIHBhc3Ncbi8vIHRoZSBcImFwcGx5Q2hhbmdlXCIgZmllbGQgYXMgdGhlIGNhbGxiYWNrcyB0byB0aGUgdW5kZXJseWluZyBvYnNlcnZlQ2hhbmdlc1xuLy8gY2FsbC4gT3B0aW9uYWxseSwgeW91IGNhbiBzcGVjaWZ5IHlvdXIgb3duIG9ic2VydmVDaGFuZ2VzIGNhbGxiYWNrcyB3aGljaCBhcmVcbi8vIGludm9rZWQgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb2NzIGZpZWxkIGlzIHVwZGF0ZWQ7IHRoaXMgb2JqZWN0IGlzIG1hZGVcbi8vIGF2YWlsYWJsZSBhcyBgdGhpc2AgdG8gdGhvc2UgY2FsbGJhY2tzLlxuTG9jYWxDb2xsZWN0aW9uLl9DYWNoaW5nQ2hhbmdlT2JzZXJ2ZXIgPSBjbGFzcyBfQ2FjaGluZ0NoYW5nZU9ic2VydmVyIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3Qgb3JkZXJlZEZyb21DYWxsYmFja3MgPSAoXG4gICAgICBvcHRpb25zLmNhbGxiYWNrcyAmJlxuICAgICAgTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQob3B0aW9ucy5jYWxsYmFja3MpXG4gICAgKTtcblxuICAgIGlmIChoYXNPd24uY2FsbChvcHRpb25zLCAnb3JkZXJlZCcpKSB7XG4gICAgICB0aGlzLm9yZGVyZWQgPSBvcHRpb25zLm9yZGVyZWQ7XG5cbiAgICAgIGlmIChvcHRpb25zLmNhbGxiYWNrcyAmJiBvcHRpb25zLm9yZGVyZWQgIT09IG9yZGVyZWRGcm9tQ2FsbGJhY2tzKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdvcmRlcmVkIG9wdGlvbiBkb2VzblxcJ3QgbWF0Y2ggY2FsbGJhY2tzJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmNhbGxiYWNrcykge1xuICAgICAgdGhpcy5vcmRlcmVkID0gb3JkZXJlZEZyb21DYWxsYmFja3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCdtdXN0IHByb3ZpZGUgb3JkZXJlZCBvciBjYWxsYmFja3MnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsYmFja3MgPSBvcHRpb25zLmNhbGxiYWNrcyB8fCB7fTtcblxuICAgIGlmICh0aGlzLm9yZGVyZWQpIHtcbiAgICAgIHRoaXMuZG9jcyA9IG5ldyBPcmRlcmVkRGljdChNb25nb0lELmlkU3RyaW5naWZ5KTtcbiAgICAgIHRoaXMuYXBwbHlDaGFuZ2UgPSB7XG4gICAgICAgIGFkZGVkQmVmb3JlOiAoaWQsIGZpZWxkcywgYmVmb3JlKSA9PiB7XG4gICAgICAgICAgY29uc3QgZG9jID0gRUpTT04uY2xvbmUoZmllbGRzKTtcblxuICAgICAgICAgIGRvYy5faWQgPSBpZDtcblxuICAgICAgICAgIGlmIChjYWxsYmFja3MuYWRkZWRCZWZvcmUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5hZGRlZEJlZm9yZS5jYWxsKHRoaXMsIGlkLCBmaWVsZHMsIGJlZm9yZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVGhpcyBsaW5lIHRyaWdnZXJzIGlmIHdlIHByb3ZpZGUgYWRkZWQgd2l0aCBtb3ZlZEJlZm9yZS5cbiAgICAgICAgICBpZiAoY2FsbGJhY2tzLmFkZGVkKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MuYWRkZWQuY2FsbCh0aGlzLCBpZCwgZmllbGRzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBYWFggY291bGQgYGJlZm9yZWAgYmUgYSBmYWxzeSBJRD8gIFRlY2huaWNhbGx5XG4gICAgICAgICAgLy8gaWRTdHJpbmdpZnkgc2VlbXMgdG8gYWxsb3cgZm9yIHRoZW0gLS0gdGhvdWdoXG4gICAgICAgICAgLy8gT3JkZXJlZERpY3Qgd29uJ3QgY2FsbCBzdHJpbmdpZnkgb24gYSBmYWxzeSBhcmcuXG4gICAgICAgICAgdGhpcy5kb2NzLnB1dEJlZm9yZShpZCwgZG9jLCBiZWZvcmUgfHwgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1vdmVkQmVmb3JlOiAoaWQsIGJlZm9yZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuZG9jcy5nZXQoaWQpO1xuXG4gICAgICAgICAgaWYgKGNhbGxiYWNrcy5tb3ZlZEJlZm9yZSkge1xuICAgICAgICAgICAgY2FsbGJhY2tzLm1vdmVkQmVmb3JlLmNhbGwodGhpcywgaWQsIGJlZm9yZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kb2NzLm1vdmVCZWZvcmUoaWQsIGJlZm9yZSB8fCBudWxsKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG9jcyA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICAgICAgdGhpcy5hcHBseUNoYW5nZSA9IHtcbiAgICAgICAgYWRkZWQ6IChpZCwgZmllbGRzKSA9PiB7XG4gICAgICAgICAgY29uc3QgZG9jID0gRUpTT04uY2xvbmUoZmllbGRzKTtcblxuICAgICAgICAgIGlmIChjYWxsYmFja3MuYWRkZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5hZGRlZC5jYWxsKHRoaXMsIGlkLCBmaWVsZHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRvYy5faWQgPSBpZDtcblxuICAgICAgICAgIHRoaXMuZG9jcy5zZXQoaWQsICBkb2MpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBUaGUgbWV0aG9kcyBpbiBfSWRNYXAgYW5kIE9yZGVyZWREaWN0IHVzZWQgYnkgdGhlc2UgY2FsbGJhY2tzIGFyZVxuICAgIC8vIGlkZW50aWNhbC5cbiAgICB0aGlzLmFwcGx5Q2hhbmdlLmNoYW5nZWQgPSAoaWQsIGZpZWxkcykgPT4ge1xuICAgICAgY29uc3QgZG9jID0gdGhpcy5kb2NzLmdldChpZCk7XG5cbiAgICAgIGlmICghZG9jKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBpZCBmb3IgY2hhbmdlZDogJHtpZH1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNhbGxiYWNrcy5jaGFuZ2VkKSB7XG4gICAgICAgIGNhbGxiYWNrcy5jaGFuZ2VkLmNhbGwodGhpcywgaWQsIEVKU09OLmNsb25lKGZpZWxkcykpO1xuICAgICAgfVxuXG4gICAgICBEaWZmU2VxdWVuY2UuYXBwbHlDaGFuZ2VzKGRvYywgZmllbGRzKTtcbiAgICB9O1xuXG4gICAgdGhpcy5hcHBseUNoYW5nZS5yZW1vdmVkID0gaWQgPT4ge1xuICAgICAgaWYgKGNhbGxiYWNrcy5yZW1vdmVkKSB7XG4gICAgICAgIGNhbGxiYWNrcy5yZW1vdmVkLmNhbGwodGhpcywgaWQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRvY3MucmVtb3ZlKGlkKTtcbiAgICB9O1xuICB9XG59O1xuXG5Mb2NhbENvbGxlY3Rpb24uX0lkTWFwID0gY2xhc3MgX0lkTWFwIGV4dGVuZHMgSWRNYXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihNb25nb0lELmlkU3RyaW5naWZ5LCBNb25nb0lELmlkUGFyc2UpO1xuICB9XG59O1xuXG4vLyBXcmFwIGEgdHJhbnNmb3JtIGZ1bmN0aW9uIHRvIHJldHVybiBvYmplY3RzIHRoYXQgaGF2ZSB0aGUgX2lkIGZpZWxkXG4vLyBvZiB0aGUgdW50cmFuc2Zvcm1lZCBkb2N1bWVudC4gVGhpcyBlbnN1cmVzIHRoYXQgc3Vic3lzdGVtcyBzdWNoIGFzXG4vLyB0aGUgb2JzZXJ2ZS1zZXF1ZW5jZSBwYWNrYWdlIHRoYXQgY2FsbCBgb2JzZXJ2ZWAgY2FuIGtlZXAgdHJhY2sgb2Zcbi8vIHRoZSBkb2N1bWVudHMgaWRlbnRpdGllcy5cbi8vXG4vLyAtIFJlcXVpcmUgdGhhdCBpdCByZXR1cm5zIG9iamVjdHNcbi8vIC0gSWYgdGhlIHJldHVybiB2YWx1ZSBoYXMgYW4gX2lkIGZpZWxkLCB2ZXJpZnkgdGhhdCBpdCBtYXRjaGVzIHRoZVxuLy8gICBvcmlnaW5hbCBfaWQgZmllbGRcbi8vIC0gSWYgdGhlIHJldHVybiB2YWx1ZSBkb2Vzbid0IGhhdmUgYW4gX2lkIGZpZWxkLCBhZGQgaXQgYmFjay5cbkxvY2FsQ29sbGVjdGlvbi53cmFwVHJhbnNmb3JtID0gdHJhbnNmb3JtID0+IHtcbiAgaWYgKCF0cmFuc2Zvcm0pIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIE5vIG5lZWQgdG8gZG91Ymx5LXdyYXAgdHJhbnNmb3Jtcy5cbiAgaWYgKHRyYW5zZm9ybS5fX3dyYXBwZWRUcmFuc2Zvcm1fXykge1xuICAgIHJldHVybiB0cmFuc2Zvcm07XG4gIH1cblxuICBjb25zdCB3cmFwcGVkID0gZG9jID0+IHtcbiAgICBpZiAoIWhhc093bi5jYWxsKGRvYywgJ19pZCcpKSB7XG4gICAgICAvLyBYWFggZG8gd2UgZXZlciBoYXZlIGEgdHJhbnNmb3JtIG9uIHRoZSBvcGxvZydzIGNvbGxlY3Rpb24/IGJlY2F1c2UgdGhhdFxuICAgICAgLy8gY29sbGVjdGlvbiBoYXMgbm8gX2lkLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW4gb25seSB0cmFuc2Zvcm0gZG9jdW1lbnRzIHdpdGggX2lkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgaWQgPSBkb2MuX2lkO1xuXG4gICAgLy8gWFhYIGNvbnNpZGVyIG1ha2luZyB0cmFja2VyIGEgd2VhayBkZXBlbmRlbmN5IGFuZCBjaGVja2luZ1xuICAgIC8vIFBhY2thZ2UudHJhY2tlciBoZXJlXG4gICAgY29uc3QgdHJhbnNmb3JtZWQgPSBUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHRyYW5zZm9ybShkb2MpKTtcblxuICAgIGlmICghTG9jYWxDb2xsZWN0aW9uLl9pc1BsYWluT2JqZWN0KHRyYW5zZm9ybWVkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0cmFuc2Zvcm0gbXVzdCByZXR1cm4gb2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgaWYgKGhhc093bi5jYWxsKHRyYW5zZm9ybWVkLCAnX2lkJykpIHtcbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHRyYW5zZm9ybWVkLl9pZCwgaWQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndHJhbnNmb3JtZWQgZG9jdW1lbnQgY2FuXFwndCBoYXZlIGRpZmZlcmVudCBfaWQnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdHJhbnNmb3JtZWQuX2lkID0gaWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYW5zZm9ybWVkO1xuICB9O1xuXG4gIHdyYXBwZWQuX193cmFwcGVkVHJhbnNmb3JtX18gPSB0cnVlO1xuXG4gIHJldHVybiB3cmFwcGVkO1xufTtcblxuLy8gWFhYIHRoZSBzb3J0ZWQtcXVlcnkgbG9naWMgYmVsb3cgaXMgbGF1Z2hhYmx5IGluZWZmaWNpZW50LiB3ZSdsbFxuLy8gbmVlZCB0byBjb21lIHVwIHdpdGggYSBiZXR0ZXIgZGF0YXN0cnVjdHVyZSBmb3IgdGhpcy5cbi8vXG4vLyBYWFggdGhlIGxvZ2ljIGZvciBvYnNlcnZpbmcgd2l0aCBhIHNraXAgb3IgYSBsaW1pdCBpcyBldmVuIG1vcmVcbi8vIGxhdWdoYWJseSBpbmVmZmljaWVudC4gd2UgcmVjb21wdXRlIHRoZSB3aG9sZSByZXN1bHRzIGV2ZXJ5IHRpbWUhXG5cbi8vIFRoaXMgYmluYXJ5IHNlYXJjaCBwdXRzIGEgdmFsdWUgYmV0d2VlbiBhbnkgZXF1YWwgdmFsdWVzLCBhbmQgdGhlIGZpcnN0XG4vLyBsZXNzZXIgdmFsdWUuXG5Mb2NhbENvbGxlY3Rpb24uX2JpbmFyeVNlYXJjaCA9IChjbXAsIGFycmF5LCB2YWx1ZSkgPT4ge1xuICBsZXQgZmlyc3QgPSAwO1xuICBsZXQgcmFuZ2UgPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKHJhbmdlID4gMCkge1xuICAgIGNvbnN0IGhhbGZSYW5nZSA9IE1hdGguZmxvb3IocmFuZ2UgLyAyKTtcblxuICAgIGlmIChjbXAodmFsdWUsIGFycmF5W2ZpcnN0ICsgaGFsZlJhbmdlXSkgPj0gMCkge1xuICAgICAgZmlyc3QgKz0gaGFsZlJhbmdlICsgMTtcbiAgICAgIHJhbmdlIC09IGhhbGZSYW5nZSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlID0gaGFsZlJhbmdlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmaXJzdDtcbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5fY2hlY2tTdXBwb3J0ZWRQcm9qZWN0aW9uID0gZmllbGRzID0+IHtcbiAgaWYgKGZpZWxkcyAhPT0gT2JqZWN0KGZpZWxkcykgfHwgQXJyYXkuaXNBcnJheShmaWVsZHMpKSB7XG4gICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ2ZpZWxkcyBvcHRpb24gbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgfVxuXG4gIE9iamVjdC5rZXlzKGZpZWxkcykuZm9yRWFjaChrZXlQYXRoID0+IHtcbiAgICBpZiAoa2V5UGF0aC5zcGxpdCgnLicpLmluY2x1ZGVzKCckJykpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnTWluaW1vbmdvIGRvZXNuXFwndCBzdXBwb3J0ICQgb3BlcmF0b3IgaW4gcHJvamVjdGlvbnMgeWV0LidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWUgPSBmaWVsZHNba2V5UGF0aF07XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgICBbJyRlbGVtTWF0Y2gnLCAnJG1ldGEnLCAnJHNsaWNlJ10uc29tZShrZXkgPT5cbiAgICAgICAgICBoYXNPd24uY2FsbCh2YWx1ZSwga2V5KVxuICAgICAgICApKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ01pbmltb25nbyBkb2VzblxcJ3Qgc3VwcG9ydCBvcGVyYXRvcnMgaW4gcHJvamVjdGlvbnMgeWV0LidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFbMSwgMCwgdHJ1ZSwgZmFsc2VdLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdQcm9qZWN0aW9uIHZhbHVlcyBzaG91bGQgYmUgb25lIG9mIDEsIDAsIHRydWUsIG9yIGZhbHNlJ1xuICAgICAgKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLy8gS25vd3MgaG93IHRvIGNvbXBpbGUgYSBmaWVsZHMgcHJvamVjdGlvbiB0byBhIHByZWRpY2F0ZSBmdW5jdGlvbi5cbi8vIEByZXR1cm5zIC0gRnVuY3Rpb246IGEgY2xvc3VyZSB0aGF0IGZpbHRlcnMgb3V0IGFuIG9iamVjdCBhY2NvcmRpbmcgdG8gdGhlXG4vLyAgICAgICAgICAgIGZpZWxkcyBwcm9qZWN0aW9uIHJ1bGVzOlxuLy8gICAgICAgICAgICBAcGFyYW0gb2JqIC0gT2JqZWN0OiBNb25nb0RCLXN0eWxlZCBkb2N1bWVudFxuLy8gICAgICAgICAgICBAcmV0dXJucyAtIE9iamVjdDogYSBkb2N1bWVudCB3aXRoIHRoZSBmaWVsZHMgZmlsdGVyZWQgb3V0XG4vLyAgICAgICAgICAgICAgICAgICAgICAgYWNjb3JkaW5nIHRvIHByb2plY3Rpb24gcnVsZXMuIERvZXNuJ3QgcmV0YWluIHN1YmZpZWxkc1xuLy8gICAgICAgICAgICAgICAgICAgICAgIG9mIHBhc3NlZCBhcmd1bWVudC5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVByb2plY3Rpb24gPSBmaWVsZHMgPT4ge1xuICBMb2NhbENvbGxlY3Rpb24uX2NoZWNrU3VwcG9ydGVkUHJvamVjdGlvbihmaWVsZHMpO1xuXG4gIGNvbnN0IF9pZFByb2plY3Rpb24gPSBmaWVsZHMuX2lkID09PSB1bmRlZmluZWQgPyB0cnVlIDogZmllbGRzLl9pZDtcbiAgY29uc3QgZGV0YWlscyA9IHByb2plY3Rpb25EZXRhaWxzKGZpZWxkcyk7XG5cbiAgLy8gcmV0dXJucyB0cmFuc2Zvcm1lZCBkb2MgYWNjb3JkaW5nIHRvIHJ1bGVUcmVlXG4gIGNvbnN0IHRyYW5zZm9ybSA9IChkb2MsIHJ1bGVUcmVlKSA9PiB7XG4gICAgLy8gU3BlY2lhbCBjYXNlIGZvciBcInNldHNcIlxuICAgIGlmIChBcnJheS5pc0FycmF5KGRvYykpIHtcbiAgICAgIHJldHVybiBkb2MubWFwKHN1YmRvYyA9PiB0cmFuc2Zvcm0oc3ViZG9jLCBydWxlVHJlZSkpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGRldGFpbHMuaW5jbHVkaW5nID8ge30gOiBFSlNPTi5jbG9uZShkb2MpO1xuXG4gICAgT2JqZWN0LmtleXMocnVsZVRyZWUpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmICghaGFzT3duLmNhbGwoZG9jLCBrZXkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcnVsZSA9IHJ1bGVUcmVlW2tleV07XG5cbiAgICAgIGlmIChydWxlID09PSBPYmplY3QocnVsZSkpIHtcbiAgICAgICAgLy8gRm9yIHN1Yi1vYmplY3RzL3N1YnNldHMgd2UgYnJhbmNoXG4gICAgICAgIGlmIChkb2Nba2V5XSA9PT0gT2JqZWN0KGRvY1trZXldKSkge1xuICAgICAgICAgIHJlc3VsdFtrZXldID0gdHJhbnNmb3JtKGRvY1trZXldLCBydWxlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkZXRhaWxzLmluY2x1ZGluZykge1xuICAgICAgICAvLyBPdGhlcndpc2Ugd2UgZG9uJ3QgZXZlbiB0b3VjaCB0aGlzIHN1YmZpZWxkXG4gICAgICAgIHJlc3VsdFtrZXldID0gRUpTT04uY2xvbmUoZG9jW2tleV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHJlc3VsdFtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICByZXR1cm4gZG9jID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSB0cmFuc2Zvcm0oZG9jLCBkZXRhaWxzLnRyZWUpO1xuXG4gICAgaWYgKF9pZFByb2plY3Rpb24gJiYgaGFzT3duLmNhbGwoZG9jLCAnX2lkJykpIHtcbiAgICAgIHJlc3VsdC5faWQgPSBkb2MuX2lkO1xuICAgIH1cblxuICAgIGlmICghX2lkUHJvamVjdGlvbiAmJiBoYXNPd24uY2FsbChyZXN1bHQsICdfaWQnKSkge1xuICAgICAgZGVsZXRlIHJlc3VsdC5faWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn07XG5cbi8vIENhbGN1bGF0ZXMgdGhlIGRvY3VtZW50IHRvIGluc2VydCBpbiBjYXNlIHdlJ3JlIGRvaW5nIGFuIHVwc2VydCBhbmQgdGhlXG4vLyBzZWxlY3RvciBkb2VzIG5vdCBtYXRjaCBhbnkgZWxlbWVudHNcbkxvY2FsQ29sbGVjdGlvbi5fY3JlYXRlVXBzZXJ0RG9jdW1lbnQgPSAoc2VsZWN0b3IsIG1vZGlmaWVyKSA9PiB7XG4gIGNvbnN0IHNlbGVjdG9yRG9jdW1lbnQgPSBwb3B1bGF0ZURvY3VtZW50V2l0aFF1ZXJ5RmllbGRzKHNlbGVjdG9yKTtcbiAgY29uc3QgaXNNb2RpZnkgPSBMb2NhbENvbGxlY3Rpb24uX2lzTW9kaWZpY2F0aW9uTW9kKG1vZGlmaWVyKTtcblxuICBjb25zdCBuZXdEb2MgPSB7fTtcblxuICBpZiAoc2VsZWN0b3JEb2N1bWVudC5faWQpIHtcbiAgICBuZXdEb2MuX2lkID0gc2VsZWN0b3JEb2N1bWVudC5faWQ7XG4gICAgZGVsZXRlIHNlbGVjdG9yRG9jdW1lbnQuX2lkO1xuICB9XG5cbiAgLy8gVGhpcyBkb3VibGUgX21vZGlmeSBjYWxsIGlzIG1hZGUgdG8gaGVscCB3aXRoIG5lc3RlZCBwcm9wZXJ0aWVzIChzZWUgaXNzdWVcbiAgLy8gIzg2MzEpLiBXZSBkbyB0aGlzIGV2ZW4gaWYgaXQncyBhIHJlcGxhY2VtZW50IGZvciB2YWxpZGF0aW9uIHB1cnBvc2VzIChlLmcuXG4gIC8vIGFtYmlndW91cyBpZCdzKVxuICBMb2NhbENvbGxlY3Rpb24uX21vZGlmeShuZXdEb2MsIHskc2V0OiBzZWxlY3RvckRvY3VtZW50fSk7XG4gIExvY2FsQ29sbGVjdGlvbi5fbW9kaWZ5KG5ld0RvYywgbW9kaWZpZXIsIHtpc0luc2VydDogdHJ1ZX0pO1xuXG4gIGlmIChpc01vZGlmeSkge1xuICAgIHJldHVybiBuZXdEb2M7XG4gIH1cblxuICAvLyBSZXBsYWNlbWVudCBjYW4gdGFrZSBfaWQgZnJvbSBxdWVyeSBkb2N1bWVudFxuICBjb25zdCByZXBsYWNlbWVudCA9IE9iamVjdC5hc3NpZ24oe30sIG1vZGlmaWVyKTtcbiAgaWYgKG5ld0RvYy5faWQpIHtcbiAgICByZXBsYWNlbWVudC5faWQgPSBuZXdEb2MuX2lkO1xuICB9XG5cbiAgcmV0dXJuIHJlcGxhY2VtZW50O1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9kaWZmT2JqZWN0cyA9IChsZWZ0LCByaWdodCwgY2FsbGJhY2tzKSA9PiB7XG4gIHJldHVybiBEaWZmU2VxdWVuY2UuZGlmZk9iamVjdHMobGVmdCwgcmlnaHQsIGNhbGxiYWNrcyk7XG59O1xuXG4vLyBvcmRlcmVkOiBib29sLlxuLy8gb2xkX3Jlc3VsdHMgYW5kIG5ld19yZXN1bHRzOiBjb2xsZWN0aW9ucyBvZiBkb2N1bWVudHMuXG4vLyAgICBpZiBvcmRlcmVkLCB0aGV5IGFyZSBhcnJheXMuXG4vLyAgICBpZiB1bm9yZGVyZWQsIHRoZXkgYXJlIElkTWFwc1xuTG9jYWxDb2xsZWN0aW9uLl9kaWZmUXVlcnlDaGFuZ2VzID0gKG9yZGVyZWQsIG9sZFJlc3VsdHMsIG5ld1Jlc3VsdHMsIG9ic2VydmVyLCBvcHRpb25zKSA9PlxuICBEaWZmU2VxdWVuY2UuZGlmZlF1ZXJ5Q2hhbmdlcyhvcmRlcmVkLCBvbGRSZXN1bHRzLCBuZXdSZXN1bHRzLCBvYnNlcnZlciwgb3B0aW9ucylcbjtcblxuTG9jYWxDb2xsZWN0aW9uLl9kaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcyA9IChvbGRSZXN1bHRzLCBuZXdSZXN1bHRzLCBvYnNlcnZlciwgb3B0aW9ucykgPT5cbiAgRGlmZlNlcXVlbmNlLmRpZmZRdWVyeU9yZGVyZWRDaGFuZ2VzKG9sZFJlc3VsdHMsIG5ld1Jlc3VsdHMsIG9ic2VydmVyLCBvcHRpb25zKVxuO1xuXG5Mb2NhbENvbGxlY3Rpb24uX2RpZmZRdWVyeVVub3JkZXJlZENoYW5nZXMgPSAob2xkUmVzdWx0cywgbmV3UmVzdWx0cywgb2JzZXJ2ZXIsIG9wdGlvbnMpID0+XG4gIERpZmZTZXF1ZW5jZS5kaWZmUXVlcnlVbm9yZGVyZWRDaGFuZ2VzKG9sZFJlc3VsdHMsIG5ld1Jlc3VsdHMsIG9ic2VydmVyLCBvcHRpb25zKVxuO1xuXG5Mb2NhbENvbGxlY3Rpb24uX2ZpbmRJbk9yZGVyZWRSZXN1bHRzID0gKHF1ZXJ5LCBkb2MpID0+IHtcbiAgaWYgKCFxdWVyeS5vcmRlcmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IGNhbGwgX2ZpbmRJbk9yZGVyZWRSZXN1bHRzIG9uIHVub3JkZXJlZCBxdWVyeScpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVyeS5yZXN1bHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHF1ZXJ5LnJlc3VsdHNbaV0gPT09IGRvYykge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgRXJyb3IoJ29iamVjdCBtaXNzaW5nIGZyb20gcXVlcnknKTtcbn07XG5cbi8vIElmIHRoaXMgaXMgYSBzZWxlY3RvciB3aGljaCBleHBsaWNpdGx5IGNvbnN0cmFpbnMgdGhlIG1hdGNoIGJ5IElEIHRvIGEgZmluaXRlXG4vLyBudW1iZXIgb2YgZG9jdW1lbnRzLCByZXR1cm5zIGEgbGlzdCBvZiB0aGVpciBJRHMuICBPdGhlcndpc2UgcmV0dXJuc1xuLy8gbnVsbC4gTm90ZSB0aGF0IHRoZSBzZWxlY3RvciBtYXkgaGF2ZSBvdGhlciByZXN0cmljdGlvbnMgc28gaXQgbWF5IG5vdCBldmVuXG4vLyBtYXRjaCB0aG9zZSBkb2N1bWVudCEgIFdlIGNhcmUgYWJvdXQgJGluIGFuZCAkYW5kIHNpbmNlIHRob3NlIGFyZSBnZW5lcmF0ZWRcbi8vIGFjY2Vzcy1jb250cm9sbGVkIHVwZGF0ZSBhbmQgcmVtb3ZlLlxuTG9jYWxDb2xsZWN0aW9uLl9pZHNNYXRjaGVkQnlTZWxlY3RvciA9IHNlbGVjdG9yID0+IHtcbiAgLy8gSXMgdGhlIHNlbGVjdG9yIGp1c3QgYW4gSUQ/XG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikpIHtcbiAgICByZXR1cm4gW3NlbGVjdG9yXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIERvIHdlIGhhdmUgYW4gX2lkIGNsYXVzZT9cbiAgaWYgKGhhc093bi5jYWxsKHNlbGVjdG9yLCAnX2lkJykpIHtcbiAgICAvLyBJcyB0aGUgX2lkIGNsYXVzZSBqdXN0IGFuIElEP1xuICAgIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3Rvci5faWQpKSB7XG4gICAgICByZXR1cm4gW3NlbGVjdG9yLl9pZF07XG4gICAgfVxuXG4gICAgLy8gSXMgdGhlIF9pZCBjbGF1c2Uge19pZDogeyRpbjogW1wieFwiLCBcInlcIiwgXCJ6XCJdfX0/XG4gICAgaWYgKHNlbGVjdG9yLl9pZFxuICAgICAgICAmJiBBcnJheS5pc0FycmF5KHNlbGVjdG9yLl9pZC4kaW4pXG4gICAgICAgICYmIHNlbGVjdG9yLl9pZC4kaW4ubGVuZ3RoXG4gICAgICAgICYmIHNlbGVjdG9yLl9pZC4kaW4uZXZlcnkoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQpKSB7XG4gICAgICByZXR1cm4gc2VsZWN0b3IuX2lkLiRpbjtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHRoaXMgaXMgYSB0b3AtbGV2ZWwgJGFuZCwgYW5kIGFueSBvZiB0aGUgY2xhdXNlcyBjb25zdHJhaW4gdGhlaXJcbiAgLy8gZG9jdW1lbnRzLCB0aGVuIHRoZSB3aG9sZSBzZWxlY3RvciBpcyBjb25zdHJhaW5lZCBieSBhbnkgb25lIGNsYXVzZSdzXG4gIC8vIGNvbnN0cmFpbnQuIChXZWxsLCBieSB0aGVpciBpbnRlcnNlY3Rpb24sIGJ1dCB0aGF0IHNlZW1zIHVubGlrZWx5LilcbiAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZWN0b3IuJGFuZCkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLiRhbmQubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvbnN0IHN1YklkcyA9IExvY2FsQ29sbGVjdGlvbi5faWRzTWF0Y2hlZEJ5U2VsZWN0b3Ioc2VsZWN0b3IuJGFuZFtpXSk7XG5cbiAgICAgIGlmIChzdWJJZHMpIHtcbiAgICAgICAgcmV0dXJuIHN1YklkcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5faW5zZXJ0SW5SZXN1bHRzID0gKHF1ZXJ5LCBkb2MpID0+IHtcbiAgY29uc3QgZmllbGRzID0gRUpTT04uY2xvbmUoZG9jKTtcblxuICBkZWxldGUgZmllbGRzLl9pZDtcblxuICBpZiAocXVlcnkub3JkZXJlZCkge1xuICAgIGlmICghcXVlcnkuc29ydGVyKSB7XG4gICAgICBxdWVyeS5hZGRlZEJlZm9yZShkb2MuX2lkLCBxdWVyeS5wcm9qZWN0aW9uRm4oZmllbGRzKSwgbnVsbCk7XG4gICAgICBxdWVyeS5yZXN1bHRzLnB1c2goZG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaSA9IExvY2FsQ29sbGVjdGlvbi5faW5zZXJ0SW5Tb3J0ZWRMaXN0KFxuICAgICAgICBxdWVyeS5zb3J0ZXIuZ2V0Q29tcGFyYXRvcih7ZGlzdGFuY2VzOiBxdWVyeS5kaXN0YW5jZXN9KSxcbiAgICAgICAgcXVlcnkucmVzdWx0cyxcbiAgICAgICAgZG9jXG4gICAgICApO1xuXG4gICAgICBsZXQgbmV4dCA9IHF1ZXJ5LnJlc3VsdHNbaSArIDFdO1xuICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgbmV4dCA9IG5leHQuX2lkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHF1ZXJ5LmFkZGVkQmVmb3JlKGRvYy5faWQsIHF1ZXJ5LnByb2plY3Rpb25GbihmaWVsZHMpLCBuZXh0KTtcbiAgICB9XG5cbiAgICBxdWVyeS5hZGRlZChkb2MuX2lkLCBxdWVyeS5wcm9qZWN0aW9uRm4oZmllbGRzKSk7XG4gIH0gZWxzZSB7XG4gICAgcXVlcnkuYWRkZWQoZG9jLl9pZCwgcXVlcnkucHJvamVjdGlvbkZuKGZpZWxkcykpO1xuICAgIHF1ZXJ5LnJlc3VsdHMuc2V0KGRvYy5faWQsIGRvYyk7XG4gIH1cbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5faW5zZXJ0SW5Tb3J0ZWRMaXN0ID0gKGNtcCwgYXJyYXksIHZhbHVlKSA9PiB7XG4gIGlmIChhcnJheS5sZW5ndGggPT09IDApIHtcbiAgICBhcnJheS5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGNvbnN0IGkgPSBMb2NhbENvbGxlY3Rpb24uX2JpbmFyeVNlYXJjaChjbXAsIGFycmF5LCB2YWx1ZSk7XG5cbiAgYXJyYXkuc3BsaWNlKGksIDAsIHZhbHVlKTtcblxuICByZXR1cm4gaTtcbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5faXNNb2RpZmljYXRpb25Nb2QgPSBtb2QgPT4ge1xuICBsZXQgaXNNb2RpZnkgPSBmYWxzZTtcbiAgbGV0IGlzUmVwbGFjZSA9IGZhbHNlO1xuXG4gIE9iamVjdC5rZXlzKG1vZCkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIGlzTW9kaWZ5ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNSZXBsYWNlID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChpc01vZGlmeSAmJiBpc1JlcGxhY2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnVXBkYXRlIHBhcmFtZXRlciBjYW5ub3QgaGF2ZSBib3RoIG1vZGlmaWVyIGFuZCBub24tbW9kaWZpZXIgZmllbGRzLidcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGlzTW9kaWZ5O1xufTtcblxuLy8gWFhYIG1heWJlIHRoaXMgc2hvdWxkIGJlIEVKU09OLmlzT2JqZWN0LCB0aG91Z2ggRUpTT04gZG9lc24ndCBrbm93IGFib3V0XG4vLyBSZWdFeHBcbi8vIFhYWCBub3RlIHRoYXQgX3R5cGUodW5kZWZpbmVkKSA9PT0gMyEhISFcbkxvY2FsQ29sbGVjdGlvbi5faXNQbGFpbk9iamVjdCA9IHggPT4ge1xuICByZXR1cm4geCAmJiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IDM7XG59O1xuXG4vLyBYWFggbmVlZCBhIHN0cmF0ZWd5IGZvciBwYXNzaW5nIHRoZSBiaW5kaW5nIG9mICQgaW50byB0aGlzXG4vLyBmdW5jdGlvbiwgZnJvbSB0aGUgY29tcGlsZWQgc2VsZWN0b3Jcbi8vXG4vLyBtYXliZSBqdXN0IHtrZXkudXAudG8uanVzdC5iZWZvcmUuZG9sbGFyc2lnbjogYXJyYXlfaW5kZXh9XG4vL1xuLy8gWFhYIGF0b21pY2l0eTogaWYgb25lIG1vZGlmaWNhdGlvbiBmYWlscywgZG8gd2Ugcm9sbCBiYWNrIHRoZSB3aG9sZVxuLy8gY2hhbmdlP1xuLy9cbi8vIG9wdGlvbnM6XG4vLyAgIC0gaXNJbnNlcnQgaXMgc2V0IHdoZW4gX21vZGlmeSBpcyBiZWluZyBjYWxsZWQgdG8gY29tcHV0ZSB0aGUgZG9jdW1lbnQgdG9cbi8vICAgICBpbnNlcnQgYXMgcGFydCBvZiBhbiB1cHNlcnQgb3BlcmF0aW9uLiBXZSB1c2UgdGhpcyBwcmltYXJpbHkgdG8gZmlndXJlXG4vLyAgICAgb3V0IHdoZW4gdG8gc2V0IHRoZSBmaWVsZHMgaW4gJHNldE9uSW5zZXJ0LCBpZiBwcmVzZW50LlxuTG9jYWxDb2xsZWN0aW9uLl9tb2RpZnkgPSAoZG9jLCBtb2RpZmllciwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gIGlmICghTG9jYWxDb2xsZWN0aW9uLl9pc1BsYWluT2JqZWN0KG1vZGlmaWVyKSkge1xuICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdNb2RpZmllciBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICB9XG5cbiAgLy8gTWFrZSBzdXJlIHRoZSBjYWxsZXIgY2FuJ3QgbXV0YXRlIG91ciBkYXRhIHN0cnVjdHVyZXMuXG4gIG1vZGlmaWVyID0gRUpTT04uY2xvbmUobW9kaWZpZXIpO1xuXG4gIGNvbnN0IGlzTW9kaWZpZXIgPSBpc09wZXJhdG9yT2JqZWN0KG1vZGlmaWVyKTtcbiAgY29uc3QgbmV3RG9jID0gaXNNb2RpZmllciA/IEVKU09OLmNsb25lKGRvYykgOiBtb2RpZmllcjtcblxuICBpZiAoaXNNb2RpZmllcikge1xuICAgIC8vIGFwcGx5IG1vZGlmaWVycyB0byB0aGUgZG9jLlxuICAgIE9iamVjdC5rZXlzKG1vZGlmaWVyKS5mb3JFYWNoKG9wZXJhdG9yID0+IHtcbiAgICAgIC8vIFRyZWF0ICRzZXRPbkluc2VydCBhcyAkc2V0IGlmIHRoaXMgaXMgYW4gaW5zZXJ0LlxuICAgICAgY29uc3Qgc2V0T25JbnNlcnQgPSBvcHRpb25zLmlzSW5zZXJ0ICYmIG9wZXJhdG9yID09PSAnJHNldE9uSW5zZXJ0JztcbiAgICAgIGNvbnN0IG1vZEZ1bmMgPSBNT0RJRklFUlNbc2V0T25JbnNlcnQgPyAnJHNldCcgOiBvcGVyYXRvcl07XG4gICAgICBjb25zdCBvcGVyYW5kID0gbW9kaWZpZXJbb3BlcmF0b3JdO1xuXG4gICAgICBpZiAoIW1vZEZ1bmMpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoYEludmFsaWQgbW9kaWZpZXIgc3BlY2lmaWVkICR7b3BlcmF0b3J9YCk7XG4gICAgICB9XG5cbiAgICAgIE9iamVjdC5rZXlzKG9wZXJhbmQpLmZvckVhY2goa2V5cGF0aCA9PiB7XG4gICAgICAgIGNvbnN0IGFyZyA9IG9wZXJhbmRba2V5cGF0aF07XG5cbiAgICAgICAgaWYgKGtleXBhdGggPT09ICcnKSB7XG4gICAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ0FuIGVtcHR5IHVwZGF0ZSBwYXRoIGlzIG5vdCB2YWxpZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleXBhcnRzID0ga2V5cGF0aC5zcGxpdCgnLicpO1xuXG4gICAgICAgIGlmICgha2V5cGFydHMuZXZlcnkoQm9vbGVhbikpIHtcbiAgICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAgIGBUaGUgdXBkYXRlIHBhdGggJyR7a2V5cGF0aH0nIGNvbnRhaW5zIGFuIGVtcHR5IGZpZWxkIG5hbWUsIGAgK1xuICAgICAgICAgICAgJ3doaWNoIGlzIG5vdCBhbGxvd2VkLidcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZmluZE1vZFRhcmdldChuZXdEb2MsIGtleXBhcnRzLCB7XG4gICAgICAgICAgYXJyYXlJbmRpY2VzOiBvcHRpb25zLmFycmF5SW5kaWNlcyxcbiAgICAgICAgICBmb3JiaWRBcnJheTogb3BlcmF0b3IgPT09ICckcmVuYW1lJyxcbiAgICAgICAgICBub0NyZWF0ZTogTk9fQ1JFQVRFX01PRElGSUVSU1tvcGVyYXRvcl1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbW9kRnVuYyh0YXJnZXQsIGtleXBhcnRzLnBvcCgpLCBhcmcsIGtleXBhdGgsIG5ld0RvYyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmIChkb2MuX2lkICYmICFFSlNPTi5lcXVhbHMoZG9jLl9pZCwgbmV3RG9jLl9pZCkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICBgQWZ0ZXIgYXBwbHlpbmcgdGhlIHVwZGF0ZSB0byB0aGUgZG9jdW1lbnQge19pZDogXCIke2RvYy5faWR9XCIsIC4uLn0sYCArXG4gICAgICAgICcgdGhlIChpbW11dGFibGUpIGZpZWxkIFxcJ19pZFxcJyB3YXMgZm91bmQgdG8gaGF2ZSBiZWVuIGFsdGVyZWQgdG8gJyArXG4gICAgICAgIGBfaWQ6IFwiJHtuZXdEb2MuX2lkfVwiYFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRvYy5faWQgJiYgbW9kaWZpZXIuX2lkICYmICFFSlNPTi5lcXVhbHMoZG9jLl9pZCwgbW9kaWZpZXIuX2lkKSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgIGBUaGUgX2lkIGZpZWxkIGNhbm5vdCBiZSBjaGFuZ2VkIGZyb20ge19pZDogXCIke2RvYy5faWR9XCJ9IHRvIGAgK1xuICAgICAgICBge19pZDogXCIke21vZGlmaWVyLl9pZH1cIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIHJlcGxhY2UgdGhlIHdob2xlIGRvY3VtZW50XG4gICAgYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzKG1vZGlmaWVyKTtcbiAgfVxuXG4gIC8vIG1vdmUgbmV3IGRvY3VtZW50IGludG8gcGxhY2UuXG4gIE9iamVjdC5rZXlzKGRvYykuZm9yRWFjaChrZXkgPT4ge1xuICAgIC8vIE5vdGU6IHRoaXMgdXNlZCB0byBiZSBmb3IgKHZhciBrZXkgaW4gZG9jKSBob3dldmVyLCB0aGlzIGRvZXMgbm90XG4gICAgLy8gd29yayByaWdodCBpbiBPcGVyYS4gRGVsZXRpbmcgZnJvbSBhIGRvYyB3aGlsZSBpdGVyYXRpbmcgb3ZlciBpdFxuICAgIC8vIHdvdWxkIHNvbWV0aW1lcyBjYXVzZSBvcGVyYSB0byBza2lwIHNvbWUga2V5cy5cbiAgICBpZiAoa2V5ICE9PSAnX2lkJykge1xuICAgICAgZGVsZXRlIGRvY1trZXldO1xuICAgIH1cbiAgfSk7XG5cbiAgT2JqZWN0LmtleXMobmV3RG9jKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgZG9jW2tleV0gPSBuZXdEb2Nba2V5XTtcbiAgfSk7XG59O1xuXG5Mb2NhbENvbGxlY3Rpb24uX29ic2VydmVGcm9tT2JzZXJ2ZUNoYW5nZXMgPSAoY3Vyc29yLCBvYnNlcnZlQ2FsbGJhY2tzKSA9PiB7XG4gIGNvbnN0IHRyYW5zZm9ybSA9IGN1cnNvci5nZXRUcmFuc2Zvcm0oKSB8fCAoZG9jID0+IGRvYyk7XG4gIGxldCBzdXBwcmVzc2VkID0gISFvYnNlcnZlQ2FsbGJhY2tzLl9zdXBwcmVzc19pbml0aWFsO1xuXG4gIGxldCBvYnNlcnZlQ2hhbmdlc0NhbGxiYWNrcztcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fb2JzZXJ2ZUNhbGxiYWNrc0FyZU9yZGVyZWQob2JzZXJ2ZUNhbGxiYWNrcykpIHtcbiAgICAvLyBUaGUgXCJfbm9faW5kaWNlc1wiIG9wdGlvbiBzZXRzIGFsbCBpbmRleCBhcmd1bWVudHMgdG8gLTEgYW5kIHNraXBzIHRoZVxuICAgIC8vIGxpbmVhciBzY2FucyByZXF1aXJlZCB0byBnZW5lcmF0ZSB0aGVtLiAgVGhpcyBsZXRzIG9ic2VydmVycyB0aGF0IGRvbid0XG4gICAgLy8gbmVlZCBhYnNvbHV0ZSBpbmRpY2VzIGJlbmVmaXQgZnJvbSB0aGUgb3RoZXIgZmVhdHVyZXMgb2YgdGhpcyBBUEkgLS1cbiAgICAvLyByZWxhdGl2ZSBvcmRlciwgdHJhbnNmb3JtcywgYW5kIGFwcGx5Q2hhbmdlcyAtLSB3aXRob3V0IHRoZSBzcGVlZCBoaXQuXG4gICAgY29uc3QgaW5kaWNlcyA9ICFvYnNlcnZlQ2FsbGJhY2tzLl9ub19pbmRpY2VzO1xuXG4gICAgb2JzZXJ2ZUNoYW5nZXNDYWxsYmFja3MgPSB7XG4gICAgICBhZGRlZEJlZm9yZShpZCwgZmllbGRzLCBiZWZvcmUpIHtcbiAgICAgICAgaWYgKHN1cHByZXNzZWQgfHwgIShvYnNlcnZlQ2FsbGJhY2tzLmFkZGVkQXQgfHwgb2JzZXJ2ZUNhbGxiYWNrcy5hZGRlZCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2MgPSB0cmFuc2Zvcm0oT2JqZWN0LmFzc2lnbihmaWVsZHMsIHtfaWQ6IGlkfSkpO1xuXG4gICAgICAgIGlmIChvYnNlcnZlQ2FsbGJhY2tzLmFkZGVkQXQpIHtcbiAgICAgICAgICBvYnNlcnZlQ2FsbGJhY2tzLmFkZGVkQXQoXG4gICAgICAgICAgICBkb2MsXG4gICAgICAgICAgICBpbmRpY2VzXG4gICAgICAgICAgICAgID8gYmVmb3JlXG4gICAgICAgICAgICAgICAgPyB0aGlzLmRvY3MuaW5kZXhPZihiZWZvcmUpXG4gICAgICAgICAgICAgICAgOiB0aGlzLmRvY3Muc2l6ZSgpXG4gICAgICAgICAgICAgIDogLTEsXG4gICAgICAgICAgICBiZWZvcmVcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuYWRkZWQoZG9jKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNoYW5nZWQoaWQsIGZpZWxkcykge1xuICAgICAgICBpZiAoIShvYnNlcnZlQ2FsbGJhY2tzLmNoYW5nZWRBdCB8fCBvYnNlcnZlQ2FsbGJhY2tzLmNoYW5nZWQpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRvYyA9IEVKU09OLmNsb25lKHRoaXMuZG9jcy5nZXQoaWQpKTtcbiAgICAgICAgaWYgKCFkb2MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaWQgZm9yIGNoYW5nZWQ6ICR7aWR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvbGREb2MgPSB0cmFuc2Zvcm0oRUpTT04uY2xvbmUoZG9jKSk7XG5cbiAgICAgICAgRGlmZlNlcXVlbmNlLmFwcGx5Q2hhbmdlcyhkb2MsIGZpZWxkcyk7XG5cbiAgICAgICAgaWYgKG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZEF0KSB7XG4gICAgICAgICAgb2JzZXJ2ZUNhbGxiYWNrcy5jaGFuZ2VkQXQoXG4gICAgICAgICAgICB0cmFuc2Zvcm0oZG9jKSxcbiAgICAgICAgICAgIG9sZERvYyxcbiAgICAgICAgICAgIGluZGljZXMgPyB0aGlzLmRvY3MuaW5kZXhPZihpZCkgOiAtMVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2JzZXJ2ZUNhbGxiYWNrcy5jaGFuZ2VkKHRyYW5zZm9ybShkb2MpLCBvbGREb2MpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbW92ZWRCZWZvcmUoaWQsIGJlZm9yZSkge1xuICAgICAgICBpZiAoIW9ic2VydmVDYWxsYmFja3MubW92ZWRUbykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZyb20gPSBpbmRpY2VzID8gdGhpcy5kb2NzLmluZGV4T2YoaWQpIDogLTE7XG4gICAgICAgIGxldCB0byA9IGluZGljZXNcbiAgICAgICAgICA/IGJlZm9yZVxuICAgICAgICAgICAgPyB0aGlzLmRvY3MuaW5kZXhPZihiZWZvcmUpXG4gICAgICAgICAgICA6IHRoaXMuZG9jcy5zaXplKClcbiAgICAgICAgICA6IC0xO1xuXG4gICAgICAgIC8vIFdoZW4gbm90IG1vdmluZyBiYWNrd2FyZHMsIGFkanVzdCBmb3IgdGhlIGZhY3QgdGhhdCByZW1vdmluZyB0aGVcbiAgICAgICAgLy8gZG9jdW1lbnQgc2xpZGVzIGV2ZXJ5dGhpbmcgYmFjayBvbmUgc2xvdC5cbiAgICAgICAgaWYgKHRvID4gZnJvbSkge1xuICAgICAgICAgIC0tdG87XG4gICAgICAgIH1cblxuICAgICAgICBvYnNlcnZlQ2FsbGJhY2tzLm1vdmVkVG8oXG4gICAgICAgICAgdHJhbnNmb3JtKEVKU09OLmNsb25lKHRoaXMuZG9jcy5nZXQoaWQpKSksXG4gICAgICAgICAgZnJvbSxcbiAgICAgICAgICB0byxcbiAgICAgICAgICBiZWZvcmUgfHwgbnVsbFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZWQoaWQpIHtcbiAgICAgICAgaWYgKCEob2JzZXJ2ZUNhbGxiYWNrcy5yZW1vdmVkQXQgfHwgb2JzZXJ2ZUNhbGxiYWNrcy5yZW1vdmVkKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRlY2huaWNhbGx5IG1heWJlIHRoZXJlIHNob3VsZCBiZSBhbiBFSlNPTi5jbG9uZSBoZXJlLCBidXQgaXQncyBhYm91dFxuICAgICAgICAvLyB0byBiZSByZW1vdmVkIGZyb20gdGhpcy5kb2NzIVxuICAgICAgICBjb25zdCBkb2MgPSB0cmFuc2Zvcm0odGhpcy5kb2NzLmdldChpZCkpO1xuXG4gICAgICAgIGlmIChvYnNlcnZlQ2FsbGJhY2tzLnJlbW92ZWRBdCkge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MucmVtb3ZlZEF0KGRvYywgaW5kaWNlcyA/IHRoaXMuZG9jcy5pbmRleE9mKGlkKSA6IC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvYnNlcnZlQ2FsbGJhY2tzLnJlbW92ZWQoZG9jKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIG9ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzID0ge1xuICAgICAgYWRkZWQoaWQsIGZpZWxkcykge1xuICAgICAgICBpZiAoIXN1cHByZXNzZWQgJiYgb2JzZXJ2ZUNhbGxiYWNrcy5hZGRlZCkge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuYWRkZWQodHJhbnNmb3JtKE9iamVjdC5hc3NpZ24oZmllbGRzLCB7X2lkOiBpZH0pKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcbiAgICAgICAgaWYgKG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZCkge1xuICAgICAgICAgIGNvbnN0IG9sZERvYyA9IHRoaXMuZG9jcy5nZXQoaWQpO1xuICAgICAgICAgIGNvbnN0IGRvYyA9IEVKU09OLmNsb25lKG9sZERvYyk7XG5cbiAgICAgICAgICBEaWZmU2VxdWVuY2UuYXBwbHlDaGFuZ2VzKGRvYywgZmllbGRzKTtcblxuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZChcbiAgICAgICAgICAgIHRyYW5zZm9ybShkb2MpLFxuICAgICAgICAgICAgdHJhbnNmb3JtKEVKU09OLmNsb25lKG9sZERvYykpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJlbW92ZWQoaWQpIHtcbiAgICAgICAgaWYgKG9ic2VydmVDYWxsYmFja3MucmVtb3ZlZCkge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MucmVtb3ZlZCh0cmFuc2Zvcm0odGhpcy5kb2NzLmdldChpZCkpKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2hhbmdlT2JzZXJ2ZXIgPSBuZXcgTG9jYWxDb2xsZWN0aW9uLl9DYWNoaW5nQ2hhbmdlT2JzZXJ2ZXIoe1xuICAgIGNhbGxiYWNrczogb2JzZXJ2ZUNoYW5nZXNDYWxsYmFja3NcbiAgfSk7XG5cbiAgY29uc3QgaGFuZGxlID0gY3Vyc29yLm9ic2VydmVDaGFuZ2VzKGNoYW5nZU9ic2VydmVyLmFwcGx5Q2hhbmdlKTtcblxuICBzdXBwcmVzc2VkID0gZmFsc2U7XG5cbiAgcmV0dXJuIGhhbmRsZTtcbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5fb2JzZXJ2ZUNhbGxiYWNrc0FyZU9yZGVyZWQgPSBjYWxsYmFja3MgPT4ge1xuICBpZiAoY2FsbGJhY2tzLmFkZGVkICYmIGNhbGxiYWNrcy5hZGRlZEF0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBvbmx5IG9uZSBvZiBhZGRlZCgpIGFuZCBhZGRlZEF0KCknKTtcbiAgfVxuXG4gIGlmIChjYWxsYmFja3MuY2hhbmdlZCAmJiBjYWxsYmFja3MuY2hhbmdlZEF0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBvbmx5IG9uZSBvZiBjaGFuZ2VkKCkgYW5kIGNoYW5nZWRBdCgpJyk7XG4gIH1cblxuICBpZiAoY2FsbGJhY2tzLnJlbW92ZWQgJiYgY2FsbGJhY2tzLnJlbW92ZWRBdCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgb25seSBvbmUgb2YgcmVtb3ZlZCgpIGFuZCByZW1vdmVkQXQoKScpO1xuICB9XG5cbiAgcmV0dXJuICEhKFxuICAgIGNhbGxiYWNrcy5hZGRlZEF0IHx8XG4gICAgY2FsbGJhY2tzLmNoYW5nZWRBdCB8fFxuICAgIGNhbGxiYWNrcy5tb3ZlZFRvIHx8XG4gICAgY2FsbGJhY2tzLnJlbW92ZWRBdFxuICApO1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQgPSBjYWxsYmFja3MgPT4ge1xuICBpZiAoY2FsbGJhY2tzLmFkZGVkICYmIGNhbGxiYWNrcy5hZGRlZEJlZm9yZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgb25seSBvbmUgb2YgYWRkZWQoKSBhbmQgYWRkZWRCZWZvcmUoKScpO1xuICB9XG5cbiAgcmV0dXJuICEhKGNhbGxiYWNrcy5hZGRlZEJlZm9yZSB8fCBjYWxsYmFja3MubW92ZWRCZWZvcmUpO1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9yZW1vdmVGcm9tUmVzdWx0cyA9IChxdWVyeSwgZG9jKSA9PiB7XG4gIGlmIChxdWVyeS5vcmRlcmVkKSB7XG4gICAgY29uc3QgaSA9IExvY2FsQ29sbGVjdGlvbi5fZmluZEluT3JkZXJlZFJlc3VsdHMocXVlcnksIGRvYyk7XG5cbiAgICBxdWVyeS5yZW1vdmVkKGRvYy5faWQpO1xuICAgIHF1ZXJ5LnJlc3VsdHMuc3BsaWNlKGksIDEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGlkID0gZG9jLl9pZDsgIC8vIGluIGNhc2UgY2FsbGJhY2sgbXV0YXRlcyBkb2NcblxuICAgIHF1ZXJ5LnJlbW92ZWQoZG9jLl9pZCk7XG4gICAgcXVlcnkucmVzdWx0cy5yZW1vdmUoaWQpO1xuICB9XG59O1xuXG4vLyBJcyB0aGlzIHNlbGVjdG9yIGp1c3Qgc2hvcnRoYW5kIGZvciBsb29rdXAgYnkgX2lkP1xuTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQgPSBzZWxlY3RvciA9PlxuICB0eXBlb2Ygc2VsZWN0b3IgPT09ICdudW1iZXInIHx8XG4gIHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycgfHxcbiAgc2VsZWN0b3IgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEXG47XG5cbi8vIElzIHRoZSBzZWxlY3RvciBqdXN0IGxvb2t1cCBieSBfaWQgKHNob3J0aGFuZCBvciBub3QpP1xuTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWRQZXJoYXBzQXNPYmplY3QgPSBzZWxlY3RvciA9PlxuICBMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikgfHxcbiAgTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IgJiYgc2VsZWN0b3IuX2lkKSAmJlxuICBPYmplY3Qua2V5cyhzZWxlY3RvcikubGVuZ3RoID09PSAxXG47XG5cbkxvY2FsQ29sbGVjdGlvbi5fdXBkYXRlSW5SZXN1bHRzID0gKHF1ZXJ5LCBkb2MsIG9sZF9kb2MpID0+IHtcbiAgaWYgKCFFSlNPTi5lcXVhbHMoZG9jLl9pZCwgb2xkX2RvYy5faWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IGNoYW5nZSBhIGRvY1xcJ3MgX2lkIHdoaWxlIHVwZGF0aW5nJyk7XG4gIH1cblxuICBjb25zdCBwcm9qZWN0aW9uRm4gPSBxdWVyeS5wcm9qZWN0aW9uRm47XG4gIGNvbnN0IGNoYW5nZWRGaWVsZHMgPSBEaWZmU2VxdWVuY2UubWFrZUNoYW5nZWRGaWVsZHMoXG4gICAgcHJvamVjdGlvbkZuKGRvYyksXG4gICAgcHJvamVjdGlvbkZuKG9sZF9kb2MpXG4gICk7XG5cbiAgaWYgKCFxdWVyeS5vcmRlcmVkKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZWRGaWVsZHMpLmxlbmd0aCkge1xuICAgICAgcXVlcnkuY2hhbmdlZChkb2MuX2lkLCBjaGFuZ2VkRmllbGRzKTtcbiAgICAgIHF1ZXJ5LnJlc3VsdHMuc2V0KGRvYy5faWQsIGRvYyk7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgb2xkX2lkeCA9IExvY2FsQ29sbGVjdGlvbi5fZmluZEluT3JkZXJlZFJlc3VsdHMocXVlcnksIGRvYyk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZWRGaWVsZHMpLmxlbmd0aCkge1xuICAgIHF1ZXJ5LmNoYW5nZWQoZG9jLl9pZCwgY2hhbmdlZEZpZWxkcyk7XG4gIH1cblxuICBpZiAoIXF1ZXJ5LnNvcnRlcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGp1c3QgdGFrZSBpdCBvdXQgYW5kIHB1dCBpdCBiYWNrIGluIGFnYWluLCBhbmQgc2VlIGlmIHRoZSBpbmRleCBjaGFuZ2VzXG4gIHF1ZXJ5LnJlc3VsdHMuc3BsaWNlKG9sZF9pZHgsIDEpO1xuXG4gIGNvbnN0IG5ld19pZHggPSBMb2NhbENvbGxlY3Rpb24uX2luc2VydEluU29ydGVkTGlzdChcbiAgICBxdWVyeS5zb3J0ZXIuZ2V0Q29tcGFyYXRvcih7ZGlzdGFuY2VzOiBxdWVyeS5kaXN0YW5jZXN9KSxcbiAgICBxdWVyeS5yZXN1bHRzLFxuICAgIGRvY1xuICApO1xuXG4gIGlmIChvbGRfaWR4ICE9PSBuZXdfaWR4KSB7XG4gICAgbGV0IG5leHQgPSBxdWVyeS5yZXN1bHRzW25ld19pZHggKyAxXTtcbiAgICBpZiAobmV4dCkge1xuICAgICAgbmV4dCA9IG5leHQuX2lkO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBxdWVyeS5tb3ZlZEJlZm9yZSAmJiBxdWVyeS5tb3ZlZEJlZm9yZShkb2MuX2lkLCBuZXh0KTtcbiAgfVxufTtcblxuY29uc3QgTU9ESUZJRVJTID0ge1xuICAkY3VycmVudERhdGUodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGhhc093bi5jYWxsKGFyZywgJyR0eXBlJykpIHtcbiAgICAgIGlmIChhcmcuJHR5cGUgIT09ICdkYXRlJykge1xuICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAnTWluaW1vbmdvIGRvZXMgY3VycmVudGx5IG9ubHkgc3VwcG9ydCB0aGUgZGF0ZSB0eXBlIGluICcgK1xuICAgICAgICAgICckY3VycmVudERhdGUgbW9kaWZpZXJzJyxcbiAgICAgICAgICB7ZmllbGR9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhcmcgIT09IHRydWUpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdJbnZhbGlkICRjdXJyZW50RGF0ZSBtb2RpZmllcicsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIHRhcmdldFtmaWVsZF0gPSBuZXcgRGF0ZSgpO1xuICB9LFxuICAkbWluKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ01vZGlmaWVyICRtaW4gYWxsb3dlZCBmb3IgbnVtYmVycyBvbmx5Jywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgaWYgKGZpZWxkIGluIHRhcmdldCkge1xuICAgICAgaWYgKHR5cGVvZiB0YXJnZXRbZmllbGRdICE9PSAnbnVtYmVyJykge1xuICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAnQ2Fubm90IGFwcGx5ICRtaW4gbW9kaWZpZXIgdG8gbm9uLW51bWJlcicsXG4gICAgICAgICAge2ZpZWxkfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFyZ2V0W2ZpZWxkXSA+IGFyZykge1xuICAgICAgICB0YXJnZXRbZmllbGRdID0gYXJnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRbZmllbGRdID0gYXJnO1xuICAgIH1cbiAgfSxcbiAgJG1heCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdNb2RpZmllciAkbWF4IGFsbG93ZWQgZm9yIG51bWJlcnMgb25seScsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGlmIChmaWVsZCBpbiB0YXJnZXQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0W2ZpZWxkXSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBhcHBseSAkbWF4IG1vZGlmaWVyIHRvIG5vbi1udW1iZXInLFxuICAgICAgICAgIHtmaWVsZH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhcmdldFtmaWVsZF0gPCBhcmcpIHtcbiAgICAgICAgdGFyZ2V0W2ZpZWxkXSA9IGFyZztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGFyZ2V0W2ZpZWxkXSA9IGFyZztcbiAgICB9XG4gIH0sXG4gICRpbmModGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignTW9kaWZpZXIgJGluYyBhbGxvd2VkIGZvciBudW1iZXJzIG9ubHknLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICBpZiAoZmllbGQgaW4gdGFyZ2V0KSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldFtmaWVsZF0gIT09ICdudW1iZXInKSB7XG4gICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAgICdDYW5ub3QgYXBwbHkgJGluYyBtb2RpZmllciB0byBub24tbnVtYmVyJyxcbiAgICAgICAgICB7ZmllbGR9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRhcmdldFtmaWVsZF0gKz0gYXJnO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRbZmllbGRdID0gYXJnO1xuICAgIH1cbiAgfSxcbiAgJHNldCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAodGFyZ2V0ICE9PSBPYmplY3QodGFyZ2V0KSkgeyAvLyBub3QgYW4gYXJyYXkgb3IgYW4gb2JqZWN0XG4gICAgICBjb25zdCBlcnJvciA9IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnQ2Fubm90IHNldCBwcm9wZXJ0eSBvbiBub24tb2JqZWN0IGZpZWxkJyxcbiAgICAgICAge2ZpZWxkfVxuICAgICAgKTtcbiAgICAgIGVycm9yLnNldFByb3BlcnR5RXJyb3IgPSB0cnVlO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgaWYgKHRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgZXJyb3IgPSBNaW5pbW9uZ29FcnJvcignQ2Fubm90IHNldCBwcm9wZXJ0eSBvbiBudWxsJywge2ZpZWxkfSk7XG4gICAgICBlcnJvci5zZXRQcm9wZXJ0eUVycm9yID0gdHJ1ZTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIGFzc2VydEhhc1ZhbGlkRmllbGROYW1lcyhhcmcpO1xuXG4gICAgdGFyZ2V0W2ZpZWxkXSA9IGFyZztcbiAgfSxcbiAgJHNldE9uSW5zZXJ0KHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIC8vIGNvbnZlcnRlZCB0byBgJHNldGAgaW4gYF9tb2RpZnlgXG4gIH0sXG4gICR1bnNldCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAodGFyZ2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBpZiAoZmllbGQgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgdGFyZ2V0W2ZpZWxkXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSB0YXJnZXRbZmllbGRdO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJHB1c2godGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHRhcmdldFtmaWVsZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFyZ2V0W2ZpZWxkXSA9IFtdO1xuICAgIH1cblxuICAgIGlmICghKHRhcmdldFtmaWVsZF0gaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdDYW5ub3QgYXBwbHkgJHB1c2ggbW9kaWZpZXIgdG8gbm9uLWFycmF5Jywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgaWYgKCEoYXJnICYmIGFyZy4kZWFjaCkpIHtcbiAgICAgIC8vIFNpbXBsZSBtb2RlOiBub3QgJGVhY2hcbiAgICAgIGFzc2VydEhhc1ZhbGlkRmllbGROYW1lcyhhcmcpO1xuXG4gICAgICB0YXJnZXRbZmllbGRdLnB1c2goYXJnKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEZhbmN5IG1vZGU6ICRlYWNoIChhbmQgbWF5YmUgJHNsaWNlIGFuZCAkc29ydCBhbmQgJHBvc2l0aW9uKVxuICAgIGNvbnN0IHRvUHVzaCA9IGFyZy4kZWFjaDtcbiAgICBpZiAoISh0b1B1c2ggaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCckZWFjaCBtdXN0IGJlIGFuIGFycmF5Jywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzKHRvUHVzaCk7XG5cbiAgICAvLyBQYXJzZSAkcG9zaXRpb25cbiAgICBsZXQgcG9zaXRpb24gPSB1bmRlZmluZWQ7XG4gICAgaWYgKCckcG9zaXRpb24nIGluIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhcmcuJHBvc2l0aW9uICE9PSAnbnVtYmVyJykge1xuICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignJHBvc2l0aW9uIG11c3QgYmUgYSBudW1lcmljIHZhbHVlJywge2ZpZWxkfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFhYWCBzaG91bGQgY2hlY2sgdG8gbWFrZSBzdXJlIGludGVnZXJcbiAgICAgIGlmIChhcmcuJHBvc2l0aW9uIDwgMCkge1xuICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAnJHBvc2l0aW9uIGluICRwdXNoIG11c3QgYmUgemVybyBvciBwb3NpdGl2ZScsXG4gICAgICAgICAge2ZpZWxkfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBwb3NpdGlvbiA9IGFyZy4kcG9zaXRpb247XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgJHNsaWNlLlxuICAgIGxldCBzbGljZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAoJyRzbGljZScgaW4gYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFyZy4kc2xpY2UgIT09ICdudW1iZXInKSB7XG4gICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCckc2xpY2UgbXVzdCBiZSBhIG51bWVyaWMgdmFsdWUnLCB7ZmllbGR9KTtcbiAgICAgIH1cblxuICAgICAgLy8gWFhYIHNob3VsZCBjaGVjayB0byBtYWtlIHN1cmUgaW50ZWdlclxuICAgICAgc2xpY2UgPSBhcmcuJHNsaWNlO1xuICAgIH1cblxuICAgIC8vIFBhcnNlICRzb3J0LlxuICAgIGxldCBzb3J0RnVuY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgaWYgKGFyZy4kc29ydCkge1xuICAgICAgaWYgKHNsaWNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRzb3J0IHJlcXVpcmVzICRzbGljZSB0byBiZSBwcmVzZW50Jywge2ZpZWxkfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFhYWCB0aGlzIGFsbG93cyB1cyB0byB1c2UgYSAkc29ydCB3aG9zZSB2YWx1ZSBpcyBhbiBhcnJheSwgYnV0IHRoYXQnc1xuICAgICAgLy8gYWN0dWFsbHkgYW4gZXh0ZW5zaW9uIG9mIHRoZSBOb2RlIGRyaXZlciwgc28gaXQgd29uJ3Qgd29ya1xuICAgICAgLy8gc2VydmVyLXNpZGUuIENvdWxkIGJlIGNvbmZ1c2luZyFcbiAgICAgIC8vIFhYWCBpcyBpdCBjb3JyZWN0IHRoYXQgd2UgZG9uJ3QgZG8gZ2VvLXN0dWZmIGhlcmU/XG4gICAgICBzb3J0RnVuY3Rpb24gPSBuZXcgTWluaW1vbmdvLlNvcnRlcihhcmcuJHNvcnQpLmdldENvbXBhcmF0b3IoKTtcblxuICAgICAgdG9QdXNoLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmIChMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoZWxlbWVudCkgIT09IDMpIHtcbiAgICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAgICckcHVzaCBsaWtlIG1vZGlmaWVycyB1c2luZyAkc29ydCByZXF1aXJlIGFsbCBlbGVtZW50cyB0byBiZSAnICtcbiAgICAgICAgICAgICdvYmplY3RzJyxcbiAgICAgICAgICAgIHtmaWVsZH1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBY3R1YWxseSBwdXNoLlxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0b1B1c2guZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgdGFyZ2V0W2ZpZWxkXS5wdXNoKGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNwbGljZUFyZ3VtZW50cyA9IFtwb3NpdGlvbiwgMF07XG5cbiAgICAgIHRvUHVzaC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBzcGxpY2VBcmd1bWVudHMucHVzaChlbGVtZW50KTtcbiAgICAgIH0pO1xuXG4gICAgICB0YXJnZXRbZmllbGRdLnNwbGljZSguLi5zcGxpY2VBcmd1bWVudHMpO1xuICAgIH1cblxuICAgIC8vIEFjdHVhbGx5IHNvcnQuXG4gICAgaWYgKHNvcnRGdW5jdGlvbikge1xuICAgICAgdGFyZ2V0W2ZpZWxkXS5zb3J0KHNvcnRGdW5jdGlvbik7XG4gICAgfVxuXG4gICAgLy8gQWN0dWFsbHkgc2xpY2UuXG4gICAgaWYgKHNsaWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChzbGljZSA9PT0gMCkge1xuICAgICAgICB0YXJnZXRbZmllbGRdID0gW107IC8vIGRpZmZlcnMgZnJvbSBBcnJheS5zbGljZSFcbiAgICAgIH0gZWxzZSBpZiAoc2xpY2UgPCAwKSB7XG4gICAgICAgIHRhcmdldFtmaWVsZF0gPSB0YXJnZXRbZmllbGRdLnNsaWNlKHNsaWNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFtmaWVsZF0gPSB0YXJnZXRbZmllbGRdLnNsaWNlKDAsIHNsaWNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gICRwdXNoQWxsKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICghKHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ01vZGlmaWVyICRwdXNoQWxsL3B1bGxBbGwgYWxsb3dlZCBmb3IgYXJyYXlzIG9ubHknKTtcbiAgICB9XG5cbiAgICBhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXMoYXJnKTtcblxuICAgIGNvbnN0IHRvUHVzaCA9IHRhcmdldFtmaWVsZF07XG5cbiAgICBpZiAodG9QdXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhcmdldFtmaWVsZF0gPSBhcmc7XG4gICAgfSBlbHNlIGlmICghKHRvUHVzaCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdDYW5ub3QgYXBwbHkgJHB1c2hBbGwgbW9kaWZpZXIgdG8gbm9uLWFycmF5JyxcbiAgICAgICAge2ZpZWxkfVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdG9QdXNoLnB1c2goLi4uYXJnKTtcbiAgICB9XG4gIH0sXG4gICRhZGRUb1NldCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBsZXQgaXNFYWNoID0gZmFsc2U7XG5cbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIC8vIGNoZWNrIGlmIGZpcnN0IGtleSBpcyAnJGVhY2gnXG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXJnKTtcbiAgICAgIGlmIChrZXlzWzBdID09PSAnJGVhY2gnKSB7XG4gICAgICAgIGlzRWFjaCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWVzID0gaXNFYWNoID8gYXJnLiRlYWNoIDogW2FyZ107XG5cbiAgICBhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXModmFsdWVzKTtcblxuICAgIGNvbnN0IHRvQWRkID0gdGFyZ2V0W2ZpZWxkXTtcbiAgICBpZiAodG9BZGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFyZ2V0W2ZpZWxkXSA9IHZhbHVlcztcbiAgICB9IGVsc2UgaWYgKCEodG9BZGQgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnQ2Fubm90IGFwcGx5ICRhZGRUb1NldCBtb2RpZmllciB0byBub24tYXJyYXknLFxuICAgICAgICB7ZmllbGR9XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICh0b0FkZC5zb21lKGVsZW1lbnQgPT4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZSwgZWxlbWVudCkpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9BZGQucHVzaCh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG4gICRwb3AodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdG9Qb3AgPSB0YXJnZXRbZmllbGRdO1xuXG4gICAgaWYgKHRvUG9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISh0b1BvcCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ0Nhbm5vdCBhcHBseSAkcG9wIG1vZGlmaWVyIHRvIG5vbi1hcnJheScsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJyAmJiBhcmcgPCAwKSB7XG4gICAgICB0b1BvcC5zcGxpY2UoMCwgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvUG9wLnBvcCgpO1xuICAgIH1cbiAgfSxcbiAgJHB1bGwodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdG9QdWxsID0gdGFyZ2V0W2ZpZWxkXTtcbiAgICBpZiAodG9QdWxsID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISh0b1B1bGwgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnQ2Fubm90IGFwcGx5ICRwdWxsL3B1bGxBbGwgbW9kaWZpZXIgdG8gbm9uLWFycmF5JyxcbiAgICAgICAge2ZpZWxkfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgb3V0O1xuICAgIGlmIChhcmcgIT0gbnVsbCAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiAhKGFyZyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgLy8gWFhYIHdvdWxkIGJlIG11Y2ggbmljZXIgdG8gY29tcGlsZSB0aGlzIG9uY2UsIHJhdGhlciB0aGFuXG4gICAgICAvLyBmb3IgZWFjaCBkb2N1bWVudCB3ZSBtb2RpZnkuLiBidXQgdXN1YWxseSB3ZSdyZSBub3RcbiAgICAgIC8vIG1vZGlmeWluZyB0aGF0IG1hbnkgZG9jdW1lbnRzLCBzbyB3ZSdsbCBsZXQgaXQgc2xpZGUgZm9yXG4gICAgICAvLyBub3dcblxuICAgICAgLy8gWFhYIE1pbmltb25nby5NYXRjaGVyIGlzbid0IHVwIGZvciB0aGUgam9iLCBiZWNhdXNlIHdlIG5lZWRcbiAgICAgIC8vIHRvIHBlcm1pdCBzdHVmZiBsaWtlIHskcHVsbDoge2E6IHskZ3Q6IDR9fX0uLiBzb21ldGhpbmdcbiAgICAgIC8vIGxpa2UgeyRndDogNH0gaXMgbm90IG5vcm1hbGx5IGEgY29tcGxldGUgc2VsZWN0b3IuXG4gICAgICAvLyBzYW1lIGlzc3VlIGFzICRlbGVtTWF0Y2ggcG9zc2libHk/XG4gICAgICBjb25zdCBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKGFyZyk7XG5cbiAgICAgIG91dCA9IHRvUHVsbC5maWx0ZXIoZWxlbWVudCA9PiAhbWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoZWxlbWVudCkucmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gdG9QdWxsLmZpbHRlcihlbGVtZW50ID0+ICFMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKGVsZW1lbnQsIGFyZykpO1xuICAgIH1cblxuICAgIHRhcmdldFtmaWVsZF0gPSBvdXQ7XG4gIH0sXG4gICRwdWxsQWxsKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICghKHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdNb2RpZmllciAkcHVzaEFsbC9wdWxsQWxsIGFsbG93ZWQgZm9yIGFycmF5cyBvbmx5JyxcbiAgICAgICAge2ZpZWxkfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0b1B1bGwgPSB0YXJnZXRbZmllbGRdO1xuXG4gICAgaWYgKHRvUHVsbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCEodG9QdWxsIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ0Nhbm5vdCBhcHBseSAkcHVsbC9wdWxsQWxsIG1vZGlmaWVyIHRvIG5vbi1hcnJheScsXG4gICAgICAgIHtmaWVsZH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGFyZ2V0W2ZpZWxkXSA9IHRvUHVsbC5maWx0ZXIob2JqZWN0ID0+XG4gICAgICAhYXJnLnNvbWUoZWxlbWVudCA9PiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9iamVjdCwgZWxlbWVudCkpXG4gICAgKTtcbiAgfSxcbiAgJHJlbmFtZSh0YXJnZXQsIGZpZWxkLCBhcmcsIGtleXBhdGgsIGRvYykge1xuICAgIC8vIG5vIGlkZWEgd2h5IG1vbmdvIGhhcyB0aGlzIHJlc3RyaWN0aW9uLi5cbiAgICBpZiAoa2V5cGF0aCA9PT0gYXJnKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignJHJlbmFtZSBzb3VyY2UgbXVzdCBkaWZmZXIgZnJvbSB0YXJnZXQnLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignJHJlbmFtZSBzb3VyY2UgZmllbGQgaW52YWxpZCcsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRyZW5hbWUgdGFyZ2V0IG11c3QgYmUgYSBzdHJpbmcnLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICBpZiAoYXJnLmluY2x1ZGVzKCdcXDAnKSkge1xuICAgICAgLy8gTnVsbCBieXRlcyBhcmUgbm90IGFsbG93ZWQgaW4gTW9uZ28gZmllbGQgbmFtZXNcbiAgICAgIC8vIGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL2xpbWl0cy8jUmVzdHJpY3Rpb25zLW9uLUZpZWxkLU5hbWVzXG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ1RoZSBcXCd0b1xcJyBmaWVsZCBmb3IgJHJlbmFtZSBjYW5ub3QgY29udGFpbiBhbiBlbWJlZGRlZCBudWxsIGJ5dGUnLFxuICAgICAgICB7ZmllbGR9XG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG9iamVjdCA9IHRhcmdldFtmaWVsZF07XG5cbiAgICBkZWxldGUgdGFyZ2V0W2ZpZWxkXTtcblxuICAgIGNvbnN0IGtleXBhcnRzID0gYXJnLnNwbGl0KCcuJyk7XG4gICAgY29uc3QgdGFyZ2V0MiA9IGZpbmRNb2RUYXJnZXQoZG9jLCBrZXlwYXJ0cywge2ZvcmJpZEFycmF5OiB0cnVlfSk7XG5cbiAgICBpZiAodGFyZ2V0MiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRyZW5hbWUgdGFyZ2V0IGZpZWxkIGludmFsaWQnLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICB0YXJnZXQyW2tleXBhcnRzLnBvcCgpXSA9IG9iamVjdDtcbiAgfSxcbiAgJGJpdCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICAvLyBYWFggbW9uZ28gb25seSBzdXBwb3J0cyAkYml0IG9uIGludGVnZXJzLCBhbmQgd2Ugb25seSBzdXBwb3J0XG4gICAgLy8gbmF0aXZlIGphdmFzY3JpcHQgbnVtYmVycyAoZG91Ymxlcykgc28gZmFyLCBzbyB3ZSBjYW4ndCBzdXBwb3J0ICRiaXRcbiAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignJGJpdCBpcyBub3Qgc3VwcG9ydGVkJywge2ZpZWxkfSk7XG4gIH0sXG4gICR2KCkge1xuICAgIC8vIEFzIGRpc2N1c3NlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvOTYyMyxcbiAgICAvLyB0aGUgYCR2YCBvcGVyYXRvciBpcyBub3QgbmVlZGVkIGJ5IE1ldGVvciwgYnV0IHByb2JsZW1zIGNhbiBvY2N1ciBpZlxuICAgIC8vIGl0J3Mgbm90IGF0IGxlYXN0IGNhbGxhYmxlIChhcyBvZiBNb25nbyA+PSAzLjYpLiBJdCdzIGRlZmluZWQgaGVyZSBhc1xuICAgIC8vIGEgbm8tb3AgdG8gd29yayBhcm91bmQgdGhlc2UgcHJvYmxlbXMuXG4gIH1cbn07XG5cbmNvbnN0IE5PX0NSRUFURV9NT0RJRklFUlMgPSB7XG4gICRwb3A6IHRydWUsXG4gICRwdWxsOiB0cnVlLFxuICAkcHVsbEFsbDogdHJ1ZSxcbiAgJHJlbmFtZTogdHJ1ZSxcbiAgJHVuc2V0OiB0cnVlXG59O1xuXG4vLyBNYWtlIHN1cmUgZmllbGQgbmFtZXMgZG8gbm90IGNvbnRhaW4gTW9uZ28gcmVzdHJpY3RlZFxuLy8gY2hhcmFjdGVycyAoJy4nLCAnJCcsICdcXDAnKS5cbi8vIGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL2xpbWl0cy8jUmVzdHJpY3Rpb25zLW9uLUZpZWxkLU5hbWVzXG5jb25zdCBpbnZhbGlkQ2hhck1zZyA9IHtcbiAgJDogJ3N0YXJ0IHdpdGggXFwnJFxcJycsXG4gICcuJzogJ2NvbnRhaW4gXFwnLlxcJycsXG4gICdcXDAnOiAnY29udGFpbiBudWxsIGJ5dGVzJ1xufTtcblxuLy8gY2hlY2tzIGlmIGFsbCBmaWVsZCBuYW1lcyBpbiBhbiBvYmplY3QgYXJlIHZhbGlkXG5mdW5jdGlvbiBhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXMoZG9jKSB7XG4gIGlmIChkb2MgJiYgdHlwZW9mIGRvYyA9PT0gJ29iamVjdCcpIHtcbiAgICBKU09OLnN0cmluZ2lmeShkb2MsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICBhc3NlcnRJc1ZhbGlkRmllbGROYW1lKGtleSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0SXNWYWxpZEZpZWxkTmFtZShrZXkpIHtcbiAgbGV0IG1hdGNoO1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgKG1hdGNoID0ga2V5Lm1hdGNoKC9eXFwkfFxcLnxcXDAvKSkpIHtcbiAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihgS2V5ICR7a2V5fSBtdXN0IG5vdCAke2ludmFsaWRDaGFyTXNnW21hdGNoWzBdXX1gKTtcbiAgfVxufVxuXG4vLyBmb3IgYS5iLmMuMi5kLmUsIGtleXBhcnRzIHNob3VsZCBiZSBbJ2EnLCAnYicsICdjJywgJzInLCAnZCcsICdlJ10sXG4vLyBhbmQgdGhlbiB5b3Ugd291bGQgb3BlcmF0ZSBvbiB0aGUgJ2UnIHByb3BlcnR5IG9mIHRoZSByZXR1cm5lZFxuLy8gb2JqZWN0LlxuLy9cbi8vIGlmIG9wdGlvbnMubm9DcmVhdGUgaXMgZmFsc2V5LCBjcmVhdGVzIGludGVybWVkaWF0ZSBsZXZlbHMgb2Zcbi8vIHN0cnVjdHVyZSBhcyBuZWNlc3NhcnksIGxpa2UgbWtkaXIgLXAgKGFuZCByYWlzZXMgYW4gZXhjZXB0aW9uIGlmXG4vLyB0aGF0IHdvdWxkIG1lYW4gZ2l2aW5nIGEgbm9uLW51bWVyaWMgcHJvcGVydHkgdG8gYW4gYXJyYXkuKSBpZlxuLy8gb3B0aW9ucy5ub0NyZWF0ZSBpcyB0cnVlLCByZXR1cm4gdW5kZWZpbmVkIGluc3RlYWQuXG4vL1xuLy8gbWF5IG1vZGlmeSB0aGUgbGFzdCBlbGVtZW50IG9mIGtleXBhcnRzIHRvIHNpZ25hbCB0byB0aGUgY2FsbGVyIHRoYXQgaXQgbmVlZHNcbi8vIHRvIHVzZSBhIGRpZmZlcmVudCB2YWx1ZSB0byBpbmRleCBpbnRvIHRoZSByZXR1cm5lZCBvYmplY3QgKGZvciBleGFtcGxlLFxuLy8gWydhJywgJzAxJ10gLT4gWydhJywgMV0pLlxuLy9cbi8vIGlmIGZvcmJpZEFycmF5IGlzIHRydWUsIHJldHVybiBudWxsIGlmIHRoZSBrZXlwYXRoIGdvZXMgdGhyb3VnaCBhbiBhcnJheS5cbi8vXG4vLyBpZiBvcHRpb25zLmFycmF5SW5kaWNlcyBpcyBzZXQsIHVzZSBpdHMgZmlyc3QgZWxlbWVudCBmb3IgdGhlIChmaXJzdCkgJyQnIGluXG4vLyB0aGUgcGF0aC5cbmZ1bmN0aW9uIGZpbmRNb2RUYXJnZXQoZG9jLCBrZXlwYXJ0cywgb3B0aW9ucyA9IHt9KSB7XG4gIGxldCB1c2VkQXJyYXlJbmRleCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBsYXN0ID0gaSA9PT0ga2V5cGFydHMubGVuZ3RoIC0gMTtcbiAgICBsZXQga2V5cGFydCA9IGtleXBhcnRzW2ldO1xuXG4gICAgaWYgKCFpc0luZGV4YWJsZShkb2MpKSB7XG4gICAgICBpZiAob3B0aW9ucy5ub0NyZWF0ZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBlcnJvciA9IE1pbmltb25nb0Vycm9yKFxuICAgICAgICBgY2Fubm90IHVzZSB0aGUgcGFydCAnJHtrZXlwYXJ0fScgdG8gdHJhdmVyc2UgJHtkb2N9YFxuICAgICAgKTtcbiAgICAgIGVycm9yLnNldFByb3BlcnR5RXJyb3IgPSB0cnVlO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgaWYgKGRvYyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBpZiAob3B0aW9ucy5mb3JiaWRBcnJheSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGtleXBhcnQgPT09ICckJykge1xuICAgICAgICBpZiAodXNlZEFycmF5SW5kZXgpIHtcbiAgICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignVG9vIG1hbnkgcG9zaXRpb25hbCAoaS5lLiBcXCckXFwnKSBlbGVtZW50cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvcHRpb25zLmFycmF5SW5kaWNlcyB8fCAhb3B0aW9ucy5hcnJheUluZGljZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgICAnVGhlIHBvc2l0aW9uYWwgb3BlcmF0b3IgZGlkIG5vdCBmaW5kIHRoZSBtYXRjaCBuZWVkZWQgZnJvbSB0aGUgJyArXG4gICAgICAgICAgICAncXVlcnknXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtleXBhcnQgPSBvcHRpb25zLmFycmF5SW5kaWNlc1swXTtcbiAgICAgICAgdXNlZEFycmF5SW5kZXggPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChpc051bWVyaWNLZXkoa2V5cGFydCkpIHtcbiAgICAgICAga2V5cGFydCA9IHBhcnNlSW50KGtleXBhcnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubm9DcmVhdGUpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgYGNhbid0IGFwcGVuZCB0byBhcnJheSB1c2luZyBzdHJpbmcgZmllbGQgbmFtZSBbJHtrZXlwYXJ0fV1gXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgIGtleXBhcnRzW2ldID0ga2V5cGFydDsgLy8gaGFuZGxlICdhLjAxJ1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5ub0NyZWF0ZSAmJiBrZXlwYXJ0ID49IGRvYy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKGRvYy5sZW5ndGggPCBrZXlwYXJ0KSB7XG4gICAgICAgIGRvYy5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWxhc3QpIHtcbiAgICAgICAgaWYgKGRvYy5sZW5ndGggPT09IGtleXBhcnQpIHtcbiAgICAgICAgICBkb2MucHVzaCh7fSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRvY1trZXlwYXJ0XSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAgIGBjYW4ndCBtb2RpZnkgZmllbGQgJyR7a2V5cGFydHNbaSArIDFdfScgb2YgbGlzdCB2YWx1ZSBgICtcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGRvY1trZXlwYXJ0XSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2VydElzVmFsaWRGaWVsZE5hbWUoa2V5cGFydCk7XG5cbiAgICAgIGlmICghKGtleXBhcnQgaW4gZG9jKSkge1xuICAgICAgICBpZiAob3B0aW9ucy5ub0NyZWF0ZSkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWxhc3QpIHtcbiAgICAgICAgICBkb2Nba2V5cGFydF0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsYXN0KSB7XG4gICAgICByZXR1cm4gZG9jO1xuICAgIH1cblxuICAgIGRvYyA9IGRvY1trZXlwYXJ0XTtcbiAgfVxuXG4gIC8vIG5vdHJlYWNoZWRcbn1cbiIsImltcG9ydCBMb2NhbENvbGxlY3Rpb24gZnJvbSAnLi9sb2NhbF9jb2xsZWN0aW9uLmpzJztcbmltcG9ydCB7XG4gIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yLFxuICBoYXNPd24sXG4gIG5vdGhpbmdNYXRjaGVyLFxufSBmcm9tICcuL2NvbW1vbi5qcyc7XG5cbi8vIFRoZSBtaW5pbW9uZ28gc2VsZWN0b3IgY29tcGlsZXIhXG5cbi8vIFRlcm1pbm9sb2d5OlxuLy8gIC0gYSAnc2VsZWN0b3InIGlzIHRoZSBFSlNPTiBvYmplY3QgcmVwcmVzZW50aW5nIGEgc2VsZWN0b3Jcbi8vICAtIGEgJ21hdGNoZXInIGlzIGl0cyBjb21waWxlZCBmb3JtICh3aGV0aGVyIGEgZnVsbCBNaW5pbW9uZ28uTWF0Y2hlclxuLy8gICAgb2JqZWN0IG9yIG9uZSBvZiB0aGUgY29tcG9uZW50IGxhbWJkYXMgdGhhdCBtYXRjaGVzIHBhcnRzIG9mIGl0KVxuLy8gIC0gYSAncmVzdWx0IG9iamVjdCcgaXMgYW4gb2JqZWN0IHdpdGggYSAncmVzdWx0JyBmaWVsZCBhbmQgbWF5YmVcbi8vICAgIGRpc3RhbmNlIGFuZCBhcnJheUluZGljZXMuXG4vLyAgLSBhICdicmFuY2hlZCB2YWx1ZScgaXMgYW4gb2JqZWN0IHdpdGggYSAndmFsdWUnIGZpZWxkIGFuZCBtYXliZVxuLy8gICAgJ2RvbnRJdGVyYXRlJyBhbmQgJ2FycmF5SW5kaWNlcycuXG4vLyAgLSBhICdkb2N1bWVudCcgaXMgYSB0b3AtbGV2ZWwgb2JqZWN0IHRoYXQgY2FuIGJlIHN0b3JlZCBpbiBhIGNvbGxlY3Rpb24uXG4vLyAgLSBhICdsb29rdXAgZnVuY3Rpb24nIGlzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zXG4vLyAgICBhbiBhcnJheSBvZiAnYnJhbmNoZWQgdmFsdWVzJy5cbi8vICAtIGEgJ2JyYW5jaGVkIG1hdGNoZXInIG1hcHMgZnJvbSBhbiBhcnJheSBvZiBicmFuY2hlZCB2YWx1ZXMgdG8gYSByZXN1bHRcbi8vICAgIG9iamVjdC5cbi8vICAtIGFuICdlbGVtZW50IG1hdGNoZXInIG1hcHMgZnJvbSBhIHNpbmdsZSB2YWx1ZSB0byBhIGJvb2wuXG5cbi8vIE1haW4gZW50cnkgcG9pbnQuXG4vLyAgIHZhciBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHthOiB7JGd0OiA1fX0pO1xuLy8gICBpZiAobWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoe2E6IDd9KSkgLi4uXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXRjaGVyIHtcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3IsIGlzVXBkYXRlKSB7XG4gICAgLy8gQSBzZXQgKG9iamVjdCBtYXBwaW5nIHN0cmluZyAtPiAqKSBvZiBhbGwgb2YgdGhlIGRvY3VtZW50IHBhdGhzIGxvb2tlZFxuICAgIC8vIGF0IGJ5IHRoZSBzZWxlY3Rvci4gQWxzbyBpbmNsdWRlcyB0aGUgZW1wdHkgc3RyaW5nIGlmIGl0IG1heSBsb29rIGF0IGFueVxuICAgIC8vIHBhdGggKGVnLCAkd2hlcmUpLlxuICAgIHRoaXMuX3BhdGhzID0ge307XG4gICAgLy8gU2V0IHRvIHRydWUgaWYgY29tcGlsYXRpb24gZmluZHMgYSAkbmVhci5cbiAgICB0aGlzLl9oYXNHZW9RdWVyeSA9IGZhbHNlO1xuICAgIC8vIFNldCB0byB0cnVlIGlmIGNvbXBpbGF0aW9uIGZpbmRzIGEgJHdoZXJlLlxuICAgIHRoaXMuX2hhc1doZXJlID0gZmFsc2U7XG4gICAgLy8gU2V0IHRvIGZhbHNlIGlmIGNvbXBpbGF0aW9uIGZpbmRzIGFueXRoaW5nIG90aGVyIHRoYW4gYSBzaW1wbGUgZXF1YWxpdHlcbiAgICAvLyBvciBvbmUgb3IgbW9yZSBvZiAnJGd0JywgJyRndGUnLCAnJGx0JywgJyRsdGUnLCAnJG5lJywgJyRpbicsICckbmluJyB1c2VkXG4gICAgLy8gd2l0aCBzY2FsYXJzIGFzIG9wZXJhbmRzLlxuICAgIHRoaXMuX2lzU2ltcGxlID0gdHJ1ZTtcbiAgICAvLyBTZXQgdG8gYSBkdW1teSBkb2N1bWVudCB3aGljaCBhbHdheXMgbWF0Y2hlcyB0aGlzIE1hdGNoZXIuIE9yIHNldCB0byBudWxsXG4gICAgLy8gaWYgc3VjaCBkb2N1bWVudCBpcyB0b28gaGFyZCB0byBmaW5kLlxuICAgIHRoaXMuX21hdGNoaW5nRG9jdW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgLy8gQSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgc2VsZWN0b3IuIEl0IG1heSBqdXN0IGJlIGEgZnVuY3Rpb24gaWYgdGhlIHVzZXJcbiAgICAvLyBwYXNzZWQgaW4gYSBmdW5jdGlvbjsgb3RoZXJ3aXNlIGlzIGRlZmluaXRlbHkgYW4gb2JqZWN0IChlZywgSURzIGFyZVxuICAgIC8vIHRyYW5zbGF0ZWQgaW50byB7X2lkOiBJRH0gZmlyc3QuIFVzZWQgYnkgY2FuQmVjb21lVHJ1ZUJ5TW9kaWZpZXIgYW5kXG4gICAgLy8gU29ydGVyLl91c2VXaXRoTWF0Y2hlci5cbiAgICB0aGlzLl9zZWxlY3RvciA9IG51bGw7XG4gICAgdGhpcy5fZG9jTWF0Y2hlciA9IHRoaXMuX2NvbXBpbGVTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgLy8gU2V0IHRvIHRydWUgaWYgc2VsZWN0aW9uIGlzIGRvbmUgZm9yIGFuIHVwZGF0ZSBvcGVyYXRpb25cbiAgICAvLyBEZWZhdWx0IGlzIGZhbHNlXG4gICAgLy8gVXNlZCBmb3IgJG5lYXIgYXJyYXkgdXBkYXRlIChpc3N1ZSAjMzU5OSlcbiAgICB0aGlzLl9pc1VwZGF0ZSA9IGlzVXBkYXRlO1xuICB9XG5cbiAgZG9jdW1lbnRNYXRjaGVzKGRvYykge1xuICAgIGlmIChkb2MgIT09IE9iamVjdChkb2MpKSB7XG4gICAgICB0aHJvdyBFcnJvcignZG9jdW1lbnRNYXRjaGVzIG5lZWRzIGEgZG9jdW1lbnQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZG9jTWF0Y2hlcihkb2MpO1xuICB9XG5cbiAgaGFzR2VvUXVlcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc0dlb1F1ZXJ5O1xuICB9XG5cbiAgaGFzV2hlcmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc1doZXJlO1xuICB9XG5cbiAgaXNTaW1wbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzU2ltcGxlO1xuICB9XG5cbiAgLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbiAgLy8gZG9jdW1lbnQuIEl0IHJldHVybnMgYSByZXN1bHQgb2JqZWN0LlxuICBfY29tcGlsZVNlbGVjdG9yKHNlbGVjdG9yKSB7XG4gICAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgdGhpcy5faXNTaW1wbGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICB0aGlzLl9yZWNvcmRQYXRoVXNlZCgnJyk7XG5cbiAgICAgIHJldHVybiBkb2MgPT4gKHtyZXN1bHQ6ICEhc2VsZWN0b3IuY2FsbChkb2MpfSk7XG4gICAgfVxuXG4gICAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhciBfaWRcbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IpKSB7XG4gICAgICB0aGlzLl9zZWxlY3RvciA9IHtfaWQ6IHNlbGVjdG9yfTtcbiAgICAgIHRoaXMuX3JlY29yZFBhdGhVc2VkKCdfaWQnKTtcblxuICAgICAgcmV0dXJuIGRvYyA9PiAoe3Jlc3VsdDogRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKX0pO1xuICAgIH1cblxuICAgIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gICAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAgIC8vIGRlc3RydWN0aXZlIG9wZXJhdGlvbnMuXG4gICAgaWYgKCFzZWxlY3RvciB8fCBoYXNPd24uY2FsbChzZWxlY3RvciwgJ19pZCcpICYmICFzZWxlY3Rvci5faWQpIHtcbiAgICAgIHRoaXMuX2lzU2ltcGxlID0gZmFsc2U7XG4gICAgICByZXR1cm4gbm90aGluZ01hdGNoZXI7XG4gICAgfVxuXG4gICAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikgfHxcbiAgICAgICAgdHlwZW9mIHNlbGVjdG9yID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn1gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZWxlY3RvciA9IEVKU09OLmNsb25lKHNlbGVjdG9yKTtcblxuICAgIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3RvciwgdGhpcywge2lzUm9vdDogdHJ1ZX0pO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGxpc3Qgb2Yga2V5IHBhdGhzIHRoZSBnaXZlbiBzZWxlY3RvciBpcyBsb29raW5nIGZvci4gSXQgaW5jbHVkZXNcbiAgLy8gdGhlIGVtcHR5IHN0cmluZyBpZiB0aGVyZSBpcyBhICR3aGVyZS5cbiAgX2dldFBhdGhzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9wYXRocyk7XG4gIH1cblxuICBfcmVjb3JkUGF0aFVzZWQocGF0aCkge1xuICAgIHRoaXMuX3BhdGhzW3BhdGhdID0gdHJ1ZTtcbiAgfVxufVxuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG4gIF90eXBlKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHYgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gMjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHYgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIDg7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiA0O1xuICAgIH1cblxuICAgIGlmICh2ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gMTA7XG4gICAgfVxuXG4gICAgLy8gbm90ZSB0aGF0IHR5cGVvZigveC8pID09PSBcIm9iamVjdFwiXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIHJldHVybiAxMTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAxMztcbiAgICB9XG5cbiAgICBpZiAodiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIHJldHVybiA5O1xuICAgIH1cblxuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSkge1xuICAgICAgcmV0dXJuIDU7XG4gICAgfVxuXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEKSB7XG4gICAgICByZXR1cm4gNztcbiAgICB9XG5cbiAgICAvLyBvYmplY3RcbiAgICByZXR1cm4gMztcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKGEsIGIsIHtrZXlPcmRlclNlbnNpdGl2ZTogdHJ1ZX0pO1xuICB9LFxuXG4gIC8vIG1hcHMgYSB0eXBlIGNvZGUgdG8gYSB2YWx1ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNvcnQgdmFsdWVzIG9mIGRpZmZlcmVudFxuICAvLyB0eXBlc1xuICBfdHlwZW9yZGVyKHQpIHtcbiAgICAvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Rpc3BsYXkvRE9DUy9XaGF0K2lzK3RoZStDb21wYXJlK09yZGVyK2ZvcitCU09OK1R5cGVzXG4gICAgLy8gWFhYIHdoYXQgaXMgdGhlIGNvcnJlY3Qgc29ydCBwb3NpdGlvbiBmb3IgSmF2YXNjcmlwdCBjb2RlP1xuICAgIC8vICgnMTAwJyBpbiB0aGUgbWF0cml4IGJlbG93KVxuICAgIC8vIFhYWCBtaW5rZXkvbWF4a2V5XG4gICAgcmV0dXJuIFtcbiAgICAgIC0xLCAgLy8gKG5vdCBhIHR5cGUpXG4gICAgICAxLCAgIC8vIG51bWJlclxuICAgICAgMiwgICAvLyBzdHJpbmdcbiAgICAgIDMsICAgLy8gb2JqZWN0XG4gICAgICA0LCAgIC8vIGFycmF5XG4gICAgICA1LCAgIC8vIGJpbmFyeVxuICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICA2LCAgIC8vIE9iamVjdElEXG4gICAgICA3LCAgIC8vIGJvb2xcbiAgICAgIDgsICAgLy8gRGF0ZVxuICAgICAgMCwgICAvLyBudWxsXG4gICAgICA5LCAgIC8vIFJlZ0V4cFxuICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgIDIsICAgLy8gZGVwcmVjYXRlZCAoc3ltYm9sKVxuICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAxLCAgIC8vIDMyLWJpdCBpbnRcbiAgICAgIDgsICAgLy8gTW9uZ28gdGltZXN0YW1wXG4gICAgICAxICAgIC8vIDY0LWJpdCBpbnRcbiAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXAoYSwgYikge1xuICAgIGlmIChhID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgfVxuXG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgbGV0IHRhID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGEpO1xuICAgIGxldCB0YiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShiKTtcblxuICAgIGNvbnN0IG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIGNvbnN0IG9iID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGIpO1xuXG4gICAgaWYgKG9hICE9PSBvYikge1xuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgfVxuXG4gICAgLy8gWFhYIG5lZWQgdG8gaW1wbGVtZW50IHRoaXMgaWYgd2UgaW1wbGVtZW50IFN5bWJvbCBvciBpbnRlZ2Vycywgb3JcbiAgICAvLyBUaW1lc3RhbXBcbiAgICBpZiAodGEgIT09IHRiKSB7XG4gICAgICB0aHJvdyBFcnJvcignTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXAnKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDcpIHsgLy8gT2JqZWN0SURcbiAgICAgIC8vIENvbnZlcnQgdG8gc3RyaW5nLlxuICAgICAgdGEgPSB0YiA9IDI7XG4gICAgICBhID0gYS50b0hleFN0cmluZygpO1xuICAgICAgYiA9IGIudG9IZXhTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDkpIHsgLy8gRGF0ZVxuICAgICAgLy8gQ29udmVydCB0byBtaWxsaXMuXG4gICAgICB0YSA9IHRiID0gMTtcbiAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEpIC8vIGRvdWJsZVxuICAgICAgcmV0dXJuIGEgLSBiO1xuXG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA9PT0gYiA/IDAgOiAxO1xuXG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgY29uc3QgdG9BcnJheSA9IG9iamVjdCA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKG9iamVjdCkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGtleSwgb2JqZWN0W2tleV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHRvQXJyYXkoYSksIHRvQXJyYXkoYikpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gNCkgeyAvLyBBcnJheVxuICAgICAgZm9yIChsZXQgaSA9IDA7IDsgaSsrKSB7XG4gICAgICAgIGlmIChpID09PSBhLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBpID09PSBiLmxlbmd0aCA/IDAgOiAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcyA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKGFbaV0sIGJbaV0pO1xuICAgICAgICBpZiAocyAhPT0gMCkge1xuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRhID09PSA1KSB7IC8vIGJpbmFyeVxuICAgICAgLy8gU3VycHJpc2luZ2x5LCBhIHNtYWxsIGJpbmFyeSBibG9iIGlzIGFsd2F5cyBsZXNzIHRoYW4gYSBsYXJnZSBvbmUgaW5cbiAgICAgIC8vIE1vbmdvLlxuICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldIDwgYltpXSkge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhW2ldID4gYltpXSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkge1xuICAgICAgICByZXR1cm4gYiA/IDAgOiAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYiA/IC0xIDogMDtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcblxuICAgIGlmICh0YSA9PT0gMTEpIC8vIHJlZ2V4cFxuICAgICAgdGhyb3cgRXJyb3IoJ1NvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiByZWd1bGFyIGV4cHJlc3Npb24nKTsgLy8gWFhYXG5cbiAgICAvLyAxMzogamF2YXNjcmlwdCBjb2RlXG4gICAgLy8gMTQ6IHN5bWJvbFxuICAgIC8vIDE1OiBqYXZhc2NyaXB0IGNvZGUgd2l0aCBzY29wZVxuICAgIC8vIDE2OiAzMi1iaXQgaW50ZWdlclxuICAgIC8vIDE3OiB0aW1lc3RhbXBcbiAgICAvLyAxODogNjQtYml0IGludGVnZXJcbiAgICAvLyAyNTU6IG1pbmtleVxuICAgIC8vIDEyNzogbWF4a2V5XG4gICAgaWYgKHRhID09PSAxMykgLy8gamF2YXNjcmlwdCBjb2RlXG4gICAgICB0aHJvdyBFcnJvcignU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIEphdmFzY3JpcHQgY29kZScpOyAvLyBYWFhcblxuICAgIHRocm93IEVycm9yKCdVbmtub3duIHR5cGUgdG8gc29ydCcpO1xuICB9LFxufTtcbiIsImltcG9ydCBMb2NhbENvbGxlY3Rpb25fIGZyb20gJy4vbG9jYWxfY29sbGVjdGlvbi5qcyc7XG5pbXBvcnQgTWF0Y2hlciBmcm9tICcuL21hdGNoZXIuanMnO1xuaW1wb3J0IFNvcnRlciBmcm9tICcuL3NvcnRlci5qcyc7XG5cbkxvY2FsQ29sbGVjdGlvbiA9IExvY2FsQ29sbGVjdGlvbl87XG5NaW5pbW9uZ28gPSB7XG4gICAgTG9jYWxDb2xsZWN0aW9uOiBMb2NhbENvbGxlY3Rpb25fLFxuICAgIE1hdGNoZXIsXG4gICAgU29ydGVyXG59O1xuIiwiLy8gT2JzZXJ2ZUhhbmRsZTogdGhlIHJldHVybiB2YWx1ZSBvZiBhIGxpdmUgcXVlcnkuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNlcnZlSGFuZGxlIHt9XG4iLCJpbXBvcnQge1xuICBFTEVNRU5UX09QRVJBVE9SUyxcbiAgZXF1YWxpdHlFbGVtZW50TWF0Y2hlcixcbiAgZXhwYW5kQXJyYXlzSW5CcmFuY2hlcyxcbiAgaGFzT3duLFxuICBpc09wZXJhdG9yT2JqZWN0LFxuICBtYWtlTG9va3VwRnVuY3Rpb24sXG4gIHJlZ2V4cEVsZW1lbnRNYXRjaGVyLFxufSBmcm9tICcuL2NvbW1vbi5qcyc7XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU29ydGVyIHtcbiAgY29uc3RydWN0b3Ioc3BlYywgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5fc29ydFNwZWNQYXJ0cyA9IFtdO1xuICAgIHRoaXMuX3NvcnRGdW5jdGlvbiA9IG51bGw7XG5cbiAgICBjb25zdCBhZGRTcGVjUGFydCA9IChwYXRoLCBhc2NlbmRpbmcpID0+IHtcbiAgICAgIGlmICghcGF0aCkge1xuICAgICAgICB0aHJvdyBFcnJvcignc29ydCBrZXlzIG11c3QgYmUgbm9uLWVtcHR5Jyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXRoLmNoYXJBdCgwKSA9PT0gJyQnKSB7XG4gICAgICAgIHRocm93IEVycm9yKGB1bnN1cHBvcnRlZCBzb3J0IGtleTogJHtwYXRofWApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICBhc2NlbmRpbmcsXG4gICAgICAgIGxvb2t1cDogbWFrZUxvb2t1cEZ1bmN0aW9uKHBhdGgsIHtmb3JTb3J0OiB0cnVlfSksXG4gICAgICAgIHBhdGhcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBpZiAoc3BlYyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBzcGVjLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBhZGRTcGVjUGFydChlbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRTcGVjUGFydChlbGVtZW50WzBdLCBlbGVtZW50WzFdICE9PSAnZGVzYycpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09PSAnb2JqZWN0Jykge1xuICAgICAgT2JqZWN0LmtleXMoc3BlYykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBhZGRTcGVjUGFydChrZXksIHNwZWNba2V5XSA+PSAwKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuX3NvcnRGdW5jdGlvbiA9IHNwZWM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKGBCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiAke0pTT04uc3RyaW5naWZ5KHNwZWMpfWApO1xuICAgIH1cblxuICAgIC8vIElmIGEgZnVuY3Rpb24gaXMgc3BlY2lmaWVkIGZvciBzb3J0aW5nLCB3ZSBza2lwIHRoZSByZXN0LlxuICAgIGlmICh0aGlzLl9zb3J0RnVuY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUbyBpbXBsZW1lbnQgYWZmZWN0ZWRCeU1vZGlmaWVyLCB3ZSBwaWdneS1iYWNrIG9uIHRvcCBvZiBNYXRjaGVyJ3NcbiAgICAvLyBhZmZlY3RlZEJ5TW9kaWZpZXIgY29kZTsgd2UgY3JlYXRlIGEgc2VsZWN0b3IgdGhhdCBpcyBhZmZlY3RlZCBieSB0aGVcbiAgICAvLyBzYW1lIG1vZGlmaWVycyBhcyB0aGlzIHNvcnQgb3JkZXIuIFRoaXMgaXMgb25seSBpbXBsZW1lbnRlZCBvbiB0aGVcbiAgICAvLyBzZXJ2ZXIuXG4gICAgaWYgKHRoaXMuYWZmZWN0ZWRCeU1vZGlmaWVyKSB7XG4gICAgICBjb25zdCBzZWxlY3RvciA9IHt9O1xuXG4gICAgICB0aGlzLl9zb3J0U3BlY1BhcnRzLmZvckVhY2goc3BlYyA9PiB7XG4gICAgICAgIHNlbGVjdG9yW3NwZWMucGF0aF0gPSAxO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX3NlbGVjdG9yRm9yQWZmZWN0ZWRCeU1vZGlmaWVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHNlbGVjdG9yKTtcbiAgICB9XG5cbiAgICB0aGlzLl9rZXlDb21wYXJhdG9yID0gY29tcG9zZUNvbXBhcmF0b3JzKFxuICAgICAgdGhpcy5fc29ydFNwZWNQYXJ0cy5tYXAoKHNwZWMsIGkpID0+IHRoaXMuX2tleUZpZWxkQ29tcGFyYXRvcihpKSlcbiAgICApO1xuXG4gICAgLy8gSWYgeW91IHNwZWNpZnkgYSBtYXRjaGVyIGZvciB0aGlzIFNvcnRlciwgX2tleUZpbHRlciBtYXkgYmUgc2V0IHRvIGFcbiAgICAvLyBmdW5jdGlvbiB3aGljaCBzZWxlY3RzIHdoZXRoZXIgb3Igbm90IGEgZ2l2ZW4gXCJzb3J0IGtleVwiICh0dXBsZSBvZiB2YWx1ZXNcbiAgICAvLyBmb3IgdGhlIGRpZmZlcmVudCBzb3J0IHNwZWMgZmllbGRzKSBpcyBjb21wYXRpYmxlIHdpdGggdGhlIHNlbGVjdG9yLlxuICAgIHRoaXMuX2tleUZpbHRlciA9IG51bGw7XG5cbiAgICBpZiAob3B0aW9ucy5tYXRjaGVyKSB7XG4gICAgICB0aGlzLl91c2VXaXRoTWF0Y2hlcihvcHRpb25zLm1hdGNoZXIpO1xuICAgIH1cbiAgfVxuXG4gIGdldENvbXBhcmF0b3Iob3B0aW9ucykge1xuICAgIC8vIElmIHNvcnQgaXMgc3BlY2lmaWVkIG9yIGhhdmUgbm8gZGlzdGFuY2VzLCBqdXN0IHVzZSB0aGUgY29tcGFyYXRvciBmcm9tXG4gICAgLy8gdGhlIHNvdXJjZSBzcGVjaWZpY2F0aW9uICh3aGljaCBkZWZhdWx0cyB0byBcImV2ZXJ5dGhpbmcgaXMgZXF1YWxcIi5cbiAgICAvLyBpc3N1ZSAjMzU5OVxuICAgIC8vIGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL29wZXJhdG9yL3F1ZXJ5L25lYXIvI3NvcnQtb3BlcmF0aW9uXG4gICAgLy8gc29ydCBlZmZlY3RpdmVseSBvdmVycmlkZXMgJG5lYXJcbiAgICBpZiAodGhpcy5fc29ydFNwZWNQYXJ0cy5sZW5ndGggfHwgIW9wdGlvbnMgfHwgIW9wdGlvbnMuZGlzdGFuY2VzKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QmFzZUNvbXBhcmF0b3IoKTtcbiAgICB9XG5cbiAgICBjb25zdCBkaXN0YW5jZXMgPSBvcHRpb25zLmRpc3RhbmNlcztcblxuICAgIC8vIFJldHVybiBhIGNvbXBhcmF0b3Igd2hpY2ggY29tcGFyZXMgdXNpbmcgJG5lYXIgZGlzdGFuY2VzLlxuICAgIHJldHVybiAoYSwgYikgPT4ge1xuICAgICAgaWYgKCFkaXN0YW5jZXMuaGFzKGEuX2lkKSkge1xuICAgICAgICB0aHJvdyBFcnJvcihgTWlzc2luZyBkaXN0YW5jZSBmb3IgJHthLl9pZH1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFkaXN0YW5jZXMuaGFzKGIuX2lkKSkge1xuICAgICAgICB0aHJvdyBFcnJvcihgTWlzc2luZyBkaXN0YW5jZSBmb3IgJHtiLl9pZH1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRpc3RhbmNlcy5nZXQoYS5faWQpIC0gZGlzdGFuY2VzLmdldChiLl9pZCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFRha2VzIGluIHR3byBrZXlzOiBhcnJheXMgd2hvc2UgbGVuZ3RocyBtYXRjaCB0aGUgbnVtYmVyIG9mIHNwZWNcbiAgLy8gcGFydHMuIFJldHVybnMgbmVnYXRpdmUsIDAsIG9yIHBvc2l0aXZlIGJhc2VkIG9uIHVzaW5nIHRoZSBzb3J0IHNwZWMgdG9cbiAgLy8gY29tcGFyZSBmaWVsZHMuXG4gIF9jb21wYXJlS2V5cyhrZXkxLCBrZXkyKSB7XG4gICAgaWYgKGtleTEubGVuZ3RoICE9PSB0aGlzLl9zb3J0U3BlY1BhcnRzLmxlbmd0aCB8fFxuICAgICAgICBrZXkyLmxlbmd0aCAhPT0gdGhpcy5fc29ydFNwZWNQYXJ0cy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKCdLZXkgaGFzIHdyb25nIGxlbmd0aCcpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9rZXlDb21wYXJhdG9yKGtleTEsIGtleTIpO1xuICB9XG5cbiAgLy8gSXRlcmF0ZXMgb3ZlciBlYWNoIHBvc3NpYmxlIFwia2V5XCIgZnJvbSBkb2MgKGllLCBvdmVyIGVhY2ggYnJhbmNoKSwgY2FsbGluZ1xuICAvLyAnY2InIHdpdGggdGhlIGtleS5cbiAgX2dlbmVyYXRlS2V5c0Zyb21Eb2MoZG9jLCBjYikge1xuICAgIGlmICh0aGlzLl9zb3J0U3BlY1BhcnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5cXCd0IGdlbmVyYXRlIGtleXMgd2l0aG91dCBhIHNwZWMnKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXRoRnJvbUluZGljZXMgPSBpbmRpY2VzID0+IGAke2luZGljZXMuam9pbignLCcpfSxgO1xuXG4gICAgbGV0IGtub3duUGF0aHMgPSBudWxsO1xuXG4gICAgLy8gbWFwcyBpbmRleCAtPiAoeycnIC0+IHZhbHVlfSBvciB7cGF0aCAtPiB2YWx1ZX0pXG4gICAgY29uc3QgdmFsdWVzQnlJbmRleEFuZFBhdGggPSB0aGlzLl9zb3J0U3BlY1BhcnRzLm1hcChzcGVjID0+IHtcbiAgICAgIC8vIEV4cGFuZCBhbnkgbGVhZiBhcnJheXMgdGhhdCB3ZSBmaW5kLCBhbmQgaWdub3JlIHRob3NlIGFycmF5c1xuICAgICAgLy8gdGhlbXNlbHZlcy4gIChXZSBuZXZlciBzb3J0IGJhc2VkIG9uIGFuIGFycmF5IGl0c2VsZi4pXG4gICAgICBsZXQgYnJhbmNoZXMgPSBleHBhbmRBcnJheXNJbkJyYW5jaGVzKHNwZWMubG9va3VwKGRvYyksIHRydWUpO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gdmFsdWVzIGZvciBhIGtleSAoZWcsIGtleSBnb2VzIHRvIGFuIGVtcHR5IGFycmF5KSxcbiAgICAgIC8vIHByZXRlbmQgd2UgZm91bmQgb25lIG51bGwgdmFsdWUuXG4gICAgICBpZiAoIWJyYW5jaGVzLmxlbmd0aCkge1xuICAgICAgICBicmFuY2hlcyA9IFt7dmFsdWU6IG51bGx9XTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZWxlbWVudCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICBsZXQgdXNlZFBhdGhzID0gZmFsc2U7XG5cbiAgICAgIGJyYW5jaGVzLmZvckVhY2goYnJhbmNoID0+IHtcbiAgICAgICAgaWYgKCFicmFuY2guYXJyYXlJbmRpY2VzKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIGFycmF5IGluZGljZXMgZm9yIGEgYnJhbmNoLCB0aGVuIGl0IG11c3QgYmUgdGhlXG4gICAgICAgICAgLy8gb25seSBicmFuY2gsIGJlY2F1c2UgdGhlIG9ubHkgdGhpbmcgdGhhdCBwcm9kdWNlcyBtdWx0aXBsZSBicmFuY2hlc1xuICAgICAgICAgIC8vIGlzIHRoZSB1c2Ugb2YgYXJyYXlzLlxuICAgICAgICAgIGlmIChicmFuY2hlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignbXVsdGlwbGUgYnJhbmNoZXMgYnV0IG5vIGFycmF5IHVzZWQ/Jyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudFsnJ10gPSBicmFuY2gudmFsdWU7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXNlZFBhdGhzID0gdHJ1ZTtcblxuICAgICAgICBjb25zdCBwYXRoID0gcGF0aEZyb21JbmRpY2VzKGJyYW5jaC5hcnJheUluZGljZXMpO1xuXG4gICAgICAgIGlmIChoYXNPd24uY2FsbChlbGVtZW50LCBwYXRoKSkge1xuICAgICAgICAgIHRocm93IEVycm9yKGBkdXBsaWNhdGUgcGF0aDogJHtwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudFtwYXRoXSA9IGJyYW5jaC52YWx1ZTtcblxuICAgICAgICAvLyBJZiB0d28gc29ydCBmaWVsZHMgYm90aCBnbyBpbnRvIGFycmF5cywgdGhleSBoYXZlIHRvIGdvIGludG8gdGhlXG4gICAgICAgIC8vIGV4YWN0IHNhbWUgYXJyYXlzIGFuZCB3ZSBoYXZlIHRvIGZpbmQgdGhlIHNhbWUgcGF0aHMuICBUaGlzIGlzXG4gICAgICAgIC8vIHJvdWdobHkgdGhlIHNhbWUgY29uZGl0aW9uIHRoYXQgbWFrZXMgTW9uZ29EQiB0aHJvdyB0aGlzIHN0cmFuZ2VcbiAgICAgICAgLy8gZXJyb3IgbWVzc2FnZS4gIGVnLCB0aGUgbWFpbiB0aGluZyBpcyB0aGF0IGlmIHNvcnQgc3BlYyBpcyB7YTogMSxcbiAgICAgICAgLy8gYjoxfSB0aGVuIGEgYW5kIGIgY2Fubm90IGJvdGggYmUgYXJyYXlzLlxuICAgICAgICAvL1xuICAgICAgICAvLyAoSW4gTW9uZ29EQiBpdCBzZWVtcyB0byBiZSBPSyB0byBoYXZlIHthOiAxLCAnYS54LnknOiAxfSB3aGVyZSAnYSdcbiAgICAgICAgLy8gYW5kICdhLngueScgYXJlIGJvdGggYXJyYXlzLCBidXQgd2UgZG9uJ3QgYWxsb3cgdGhpcyBmb3Igbm93LlxuICAgICAgICAvLyAjTmVzdGVkQXJyYXlTb3J0XG4gICAgICAgIC8vIFhYWCBhY2hpZXZlIGZ1bGwgY29tcGF0aWJpbGl0eSBoZXJlXG4gICAgICAgIGlmIChrbm93blBhdGhzICYmICFoYXNPd24uY2FsbChrbm93blBhdGhzLCBwYXRoKSkge1xuICAgICAgICAgIHRocm93IEVycm9yKCdjYW5ub3QgaW5kZXggcGFyYWxsZWwgYXJyYXlzJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoa25vd25QYXRocykge1xuICAgICAgICAvLyBTaW1pbGFybHkgdG8gYWJvdmUsIHBhdGhzIG11c3QgbWF0Y2ggZXZlcnl3aGVyZSwgdW5sZXNzIHRoaXMgaXMgYVxuICAgICAgICAvLyBub24tYXJyYXkgZmllbGQuXG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoZWxlbWVudCwgJycpICYmXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhrbm93blBhdGhzKS5sZW5ndGggIT09IE9iamVjdC5rZXlzKGVsZW1lbnQpLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IEVycm9yKCdjYW5ub3QgaW5kZXggcGFyYWxsZWwgYXJyYXlzIScpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHVzZWRQYXRocykge1xuICAgICAgICBrbm93blBhdGhzID0ge307XG5cbiAgICAgICAgT2JqZWN0LmtleXMoZWxlbWVudCkuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgICAgICBrbm93blBhdGhzW3BhdGhdID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH0pO1xuXG4gICAgaWYgKCFrbm93blBhdGhzKSB7XG4gICAgICAvLyBFYXN5IGNhc2U6IG5vIHVzZSBvZiBhcnJheXMuXG4gICAgICBjb25zdCBzb2xlS2V5ID0gdmFsdWVzQnlJbmRleEFuZFBhdGgubWFwKHZhbHVlcyA9PiB7XG4gICAgICAgIGlmICghaGFzT3duLmNhbGwodmFsdWVzLCAnJykpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcignbm8gdmFsdWUgaW4gc29sZSBrZXkgY2FzZT8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZXNbJyddO1xuICAgICAgfSk7XG5cbiAgICAgIGNiKHNvbGVLZXkpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoa25vd25QYXRocykuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IHZhbHVlc0J5SW5kZXhBbmRQYXRoLm1hcCh2YWx1ZXMgPT4ge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwodmFsdWVzLCAnJykpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVzWycnXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGFzT3duLmNhbGwodmFsdWVzLCBwYXRoKSkge1xuICAgICAgICAgIHRocm93IEVycm9yKCdtaXNzaW5nIHBhdGg/Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWVzW3BhdGhdO1xuICAgICAgfSk7XG5cbiAgICAgIGNiKGtleSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBSZXR1cm5zIGEgY29tcGFyYXRvciB0aGF0IHJlcHJlc2VudHMgdGhlIHNvcnQgc3BlY2lmaWNhdGlvbiAoYnV0IG5vdFxuICAvLyBpbmNsdWRpbmcgYSBwb3NzaWJsZSBnZW9xdWVyeSBkaXN0YW5jZSB0aWUtYnJlYWtlcikuXG4gIF9nZXRCYXNlQ29tcGFyYXRvcigpIHtcbiAgICBpZiAodGhpcy5fc29ydEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc29ydEZ1bmN0aW9uO1xuICAgIH1cblxuICAgIC8vIElmIHdlJ3JlIG9ubHkgc29ydGluZyBvbiBnZW9xdWVyeSBkaXN0YW5jZSBhbmQgbm8gc3BlY3MsIGp1c3Qgc2F5XG4gICAgLy8gZXZlcnl0aGluZyBpcyBlcXVhbC5cbiAgICBpZiAoIXRoaXMuX3NvcnRTcGVjUGFydHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gKGRvYzEsIGRvYzIpID0+IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIChkb2MxLCBkb2MyKSA9PiB7XG4gICAgICBjb25zdCBrZXkxID0gdGhpcy5fZ2V0TWluS2V5RnJvbURvYyhkb2MxKTtcbiAgICAgIGNvbnN0IGtleTIgPSB0aGlzLl9nZXRNaW5LZXlGcm9tRG9jKGRvYzIpO1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBhcmVLZXlzKGtleTEsIGtleTIpO1xuICAgIH07XG4gIH1cblxuICAvLyBGaW5kcyB0aGUgbWluaW11bSBrZXkgZnJvbSB0aGUgZG9jLCBhY2NvcmRpbmcgdG8gdGhlIHNvcnQgc3BlY3MuICAoV2Ugc2F5XG4gIC8vIFwibWluaW11bVwiIGhlcmUgYnV0IHRoaXMgaXMgd2l0aCByZXNwZWN0IHRvIHRoZSBzb3J0IHNwZWMsIHNvIFwiZGVzY2VuZGluZ1wiXG4gIC8vIHNvcnQgZmllbGRzIG1lYW4gd2UncmUgZmluZGluZyB0aGUgbWF4IGZvciB0aGF0IGZpZWxkLilcbiAgLy9cbiAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgTk9UIFwiZmluZCB0aGUgbWluaW11bSB2YWx1ZSBvZiB0aGUgZmlyc3QgZmllbGQsIHRoZVxuICAvLyBtaW5pbXVtIHZhbHVlIG9mIHRoZSBzZWNvbmQgZmllbGQsIGV0Y1wiLi4uIGl0J3MgXCJjaG9vc2UgdGhlXG4gIC8vIGxleGljb2dyYXBoaWNhbGx5IG1pbmltdW0gdmFsdWUgb2YgdGhlIGtleSB2ZWN0b3IsIGFsbG93aW5nIG9ubHkga2V5cyB3aGljaFxuICAvLyB5b3UgY2FuIGZpbmQgYWxvbmcgdGhlIHNhbWUgcGF0aHNcIi4gIGllLCBmb3IgYSBkb2Mge2E6IFt7eDogMCwgeTogNX0sIHt4OlxuICAvLyAxLCB5OiAzfV19IHdpdGggc29ydCBzcGVjIHsnYS54JzogMSwgJ2EueSc6IDF9LCB0aGUgb25seSBrZXlzIGFyZSBbMCw1XSBhbmRcbiAgLy8gWzEsM10sIGFuZCB0aGUgbWluaW11bSBrZXkgaXMgWzAsNV07IG5vdGFibHksIFswLDNdIGlzIE5PVCBhIGtleS5cbiAgX2dldE1pbktleUZyb21Eb2MoZG9jKSB7XG4gICAgbGV0IG1pbktleSA9IG51bGw7XG5cbiAgICB0aGlzLl9nZW5lcmF0ZUtleXNGcm9tRG9jKGRvYywga2V5ID0+IHtcbiAgICAgIGlmICghdGhpcy5fa2V5Q29tcGF0aWJsZVdpdGhTZWxlY3RvcihrZXkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG1pbktleSA9PT0gbnVsbCkge1xuICAgICAgICBtaW5LZXkgPSBrZXk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2NvbXBhcmVLZXlzKGtleSwgbWluS2V5KSA8IDApIHtcbiAgICAgICAgbWluS2V5ID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVGhpcyBjb3VsZCBoYXBwZW4gaWYgb3VyIGtleSBmaWx0ZXIgc29tZWhvdyBmaWx0ZXJzIG91dCBhbGwgdGhlIGtleXMgZXZlblxuICAgIC8vIHRob3VnaCBzb21laG93IHRoZSBzZWxlY3RvciBtYXRjaGVzLlxuICAgIGlmIChtaW5LZXkgPT09IG51bGwpIHtcbiAgICAgIHRocm93IEVycm9yKCdzb3J0IHNlbGVjdG9yIGZvdW5kIG5vIGtleXMgaW4gZG9jPycpO1xuICAgIH1cblxuICAgIHJldHVybiBtaW5LZXk7XG4gIH1cblxuICBfZ2V0UGF0aHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NvcnRTcGVjUGFydHMubWFwKHBhcnQgPT4gcGFydC5wYXRoKTtcbiAgfVxuXG4gIF9rZXlDb21wYXRpYmxlV2l0aFNlbGVjdG9yKGtleSkge1xuICAgIHJldHVybiAhdGhpcy5fa2V5RmlsdGVyIHx8IHRoaXMuX2tleUZpbHRlcihrZXkpO1xuICB9XG5cbiAgLy8gR2l2ZW4gYW4gaW5kZXggJ2knLCByZXR1cm5zIGEgY29tcGFyYXRvciB0aGF0IGNvbXBhcmVzIHR3byBrZXkgYXJyYXlzIGJhc2VkXG4gIC8vIG9uIGZpZWxkICdpJy5cbiAgX2tleUZpZWxkQ29tcGFyYXRvcihpKSB7XG4gICAgY29uc3QgaW52ZXJ0ID0gIXRoaXMuX3NvcnRTcGVjUGFydHNbaV0uYXNjZW5kaW5nO1xuXG4gICAgcmV0dXJuIChrZXkxLCBrZXkyKSA9PiB7XG4gICAgICBjb25zdCBjb21wYXJlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoa2V5MVtpXSwga2V5MltpXSk7XG4gICAgICByZXR1cm4gaW52ZXJ0ID8gLWNvbXBhcmUgOiBjb21wYXJlO1xuICAgIH07XG4gIH1cblxuICAvLyBJbiBNb25nb0RCLCBpZiB5b3UgaGF2ZSBkb2N1bWVudHNcbiAgLy8gICAge19pZDogJ3gnLCBhOiBbMSwgMTBdfSBhbmRcbiAgLy8gICAge19pZDogJ3knLCBhOiBbNSwgMTVdfSxcbiAgLy8gdGhlbiBDLmZpbmQoe30sIHtzb3J0OiB7YTogMX19KSBwdXRzIHggYmVmb3JlIHkgKDEgY29tZXMgYmVmb3JlIDUpLlxuICAvLyBCdXQgIEMuZmluZCh7YTogeyRndDogM319LCB7c29ydDoge2E6IDF9fSkgcHV0cyB5IGJlZm9yZSB4ICgxIGRvZXMgbm90XG4gIC8vIG1hdGNoIHRoZSBzZWxlY3RvciwgYW5kIDUgY29tZXMgYmVmb3JlIDEwKS5cbiAgLy9cbiAgLy8gVGhlIHdheSB0aGlzIHdvcmtzIGlzIHByZXR0eSBzdWJ0bGUhICBGb3IgZXhhbXBsZSwgaWYgdGhlIGRvY3VtZW50c1xuICAvLyBhcmUgaW5zdGVhZCB7X2lkOiAneCcsIGE6IFt7eDogMX0sIHt4OiAxMH1dfSkgYW5kXG4gIC8vICAgICAgICAgICAgIHtfaWQ6ICd5JywgYTogW3t4OiA1fSwge3g6IDE1fV19KSxcbiAgLy8gdGhlbiBDLmZpbmQoeydhLngnOiB7JGd0OiAzfX0sIHtzb3J0OiB7J2EueCc6IDF9fSkgYW5kXG4gIC8vICAgICAgQy5maW5kKHthOiB7JGVsZW1NYXRjaDoge3g6IHskZ3Q6IDN9fX19LCB7c29ydDogeydhLngnOiAxfX0pXG4gIC8vIGJvdGggZm9sbG93IHRoaXMgcnVsZSAoeSBiZWZvcmUgeCkuICAoaWUsIHlvdSBkbyBoYXZlIHRvIGFwcGx5IHRoaXNcbiAgLy8gdGhyb3VnaCAkZWxlbU1hdGNoLilcbiAgLy9cbiAgLy8gU28gaWYgeW91IHBhc3MgYSBtYXRjaGVyIHRvIHRoaXMgc29ydGVyJ3MgY29uc3RydWN0b3IsIHdlIHdpbGwgYXR0ZW1wdCB0b1xuICAvLyBza2lwIHNvcnQga2V5cyB0aGF0IGRvbid0IG1hdGNoIHRoZSBzZWxlY3Rvci4gVGhlIGxvZ2ljIGhlcmUgaXMgcHJldHR5XG4gIC8vIHN1YnRsZSBhbmQgdW5kb2N1bWVudGVkOyB3ZSd2ZSBnb3R0ZW4gYXMgY2xvc2UgYXMgd2UgY2FuIGZpZ3VyZSBvdXQgYmFzZWRcbiAgLy8gb24gb3VyIHVuZGVyc3RhbmRpbmcgb2YgTW9uZ28ncyBiZWhhdmlvci5cbiAgX3VzZVdpdGhNYXRjaGVyKG1hdGNoZXIpIHtcbiAgICBpZiAodGhpcy5fa2V5RmlsdGVyKSB7XG4gICAgICB0aHJvdyBFcnJvcignY2FsbGVkIF91c2VXaXRoTWF0Y2hlciB0d2ljZT8nKTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBhcmUgb25seSBzb3J0aW5nIGJ5IGRpc3RhbmNlLCB0aGVuIHdlJ3JlIG5vdCBnb2luZyB0byBib3RoZXIgdG9cbiAgICAvLyBidWlsZCBhIGtleSBmaWx0ZXIuXG4gICAgLy8gWFhYIGZpZ3VyZSBvdXQgaG93IGdlb3F1ZXJpZXMgaW50ZXJhY3Qgd2l0aCB0aGlzIHN0dWZmXG4gICAgaWYgKCF0aGlzLl9zb3J0U3BlY1BhcnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdG9yID0gbWF0Y2hlci5fc2VsZWN0b3I7XG5cbiAgICAvLyBJZiB0aGUgdXNlciBqdXN0IHBhc3NlZCBhIGZhbHNleSBzZWxlY3RvciB0byBmaW5kKCksXG4gICAgLy8gdGhlbiB3ZSBjYW4ndCBnZXQgYSBrZXkgZmlsdGVyIGZyb20gaXQuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSB1c2VyIGp1c3QgcGFzc2VkIGEgbGl0ZXJhbCBmdW5jdGlvbiB0byBmaW5kKCksIHRoZW4gd2UgY2FuJ3QgZ2V0IGFcbiAgICAvLyBrZXkgZmlsdGVyIGZyb20gaXQuXG4gICAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb25zdHJhaW50c0J5UGF0aCA9IHt9O1xuXG4gICAgdGhpcy5fc29ydFNwZWNQYXJ0cy5mb3JFYWNoKHNwZWMgPT4ge1xuICAgICAgY29uc3RyYWludHNCeVBhdGhbc3BlYy5wYXRoXSA9IFtdO1xuICAgIH0pO1xuXG4gICAgT2JqZWN0LmtleXMoc2VsZWN0b3IpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGNvbnN0IHN1YlNlbGVjdG9yID0gc2VsZWN0b3Jba2V5XTtcblxuICAgICAgLy8gWFhYIHN1cHBvcnQgJGFuZCBhbmQgJG9yXG4gICAgICBjb25zdCBjb25zdHJhaW50cyA9IGNvbnN0cmFpbnRzQnlQYXRoW2tleV07XG4gICAgICBpZiAoIWNvbnN0cmFpbnRzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gWFhYIGl0IGxvb2tzIGxpa2UgdGhlIHJlYWwgTW9uZ29EQiBpbXBsZW1lbnRhdGlvbiBpc24ndCBcImRvZXMgdGhlXG4gICAgICAvLyByZWdleHAgbWF0Y2hcIiBidXQgXCJkb2VzIHRoZSB2YWx1ZSBmYWxsIGludG8gYSByYW5nZSBuYW1lZCBieSB0aGVcbiAgICAgIC8vIGxpdGVyYWwgcHJlZml4IG9mIHRoZSByZWdleHBcIiwgaWUgXCJmb29cIiBpbiAvXmZvbyhiYXJ8YmF6KSsvICBCdXRcbiAgICAgIC8vIFwiZG9lcyB0aGUgcmVnZXhwIG1hdGNoXCIgaXMgYSBnb29kIGFwcHJveGltYXRpb24uXG4gICAgICBpZiAoc3ViU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgLy8gQXMgZmFyIGFzIHdlIGNhbiB0ZWxsLCB1c2luZyBlaXRoZXIgb2YgdGhlIG9wdGlvbnMgdGhhdCBib3RoIHdlIGFuZFxuICAgICAgICAvLyBNb25nb0RCIHN1cHBvcnQgKCdpJyBhbmQgJ20nKSBkaXNhYmxlcyB1c2Ugb2YgdGhlIGtleSBmaWx0ZXIuIFRoaXNcbiAgICAgICAgLy8gbWFrZXMgc2Vuc2U6IE1vbmdvREIgbW9zdGx5IGFwcGVhcnMgdG8gYmUgY2FsY3VsYXRpbmcgcmFuZ2VzIG9mIGFuXG4gICAgICAgIC8vIGluZGV4IHRvIHVzZSwgd2hpY2ggbWVhbnMgaXQgb25seSBjYXJlcyBhYm91dCByZWdleHBzIHRoYXQgbWF0Y2hcbiAgICAgICAgLy8gb25lIHJhbmdlICh3aXRoIGEgbGl0ZXJhbCBwcmVmaXgpLCBhbmQgYm90aCAnaScgYW5kICdtJyBwcmV2ZW50IHRoZVxuICAgICAgICAvLyBsaXRlcmFsIHByZWZpeCBvZiB0aGUgcmVnZXhwIGZyb20gYWN0dWFsbHkgbWVhbmluZyBvbmUgcmFuZ2UuXG4gICAgICAgIGlmIChzdWJTZWxlY3Rvci5pZ25vcmVDYXNlIHx8IHN1YlNlbGVjdG9yLm11bHRpbGluZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cmFpbnRzLnB1c2gocmVnZXhwRWxlbWVudE1hdGNoZXIoc3ViU2VsZWN0b3IpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNPcGVyYXRvck9iamVjdChzdWJTZWxlY3RvcikpIHtcbiAgICAgICAgT2JqZWN0LmtleXMoc3ViU2VsZWN0b3IpLmZvckVhY2gob3BlcmF0b3IgPT4ge1xuICAgICAgICAgIGNvbnN0IG9wZXJhbmQgPSBzdWJTZWxlY3RvcltvcGVyYXRvcl07XG5cbiAgICAgICAgICBpZiAoWyckbHQnLCAnJGx0ZScsICckZ3QnLCAnJGd0ZSddLmluY2x1ZGVzKG9wZXJhdG9yKSkge1xuICAgICAgICAgICAgLy8gWFhYIHRoaXMgZGVwZW5kcyBvbiB1cyBrbm93aW5nIHRoYXQgdGhlc2Ugb3BlcmF0b3JzIGRvbid0IHVzZSBhbnlcbiAgICAgICAgICAgIC8vIG9mIHRoZSBhcmd1bWVudHMgdG8gY29tcGlsZUVsZW1lbnRTZWxlY3RvciBvdGhlciB0aGFuIG9wZXJhbmQuXG4gICAgICAgICAgICBjb25zdHJhaW50cy5wdXNoKFxuICAgICAgICAgICAgICBFTEVNRU5UX09QRVJBVE9SU1tvcGVyYXRvcl0uY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTZWUgY29tbWVudHMgaW4gdGhlIFJlZ0V4cCBibG9jayBhYm92ZS5cbiAgICAgICAgICBpZiAob3BlcmF0b3IgPT09ICckcmVnZXgnICYmICFzdWJTZWxlY3Rvci4kb3B0aW9ucykge1xuICAgICAgICAgICAgY29uc3RyYWludHMucHVzaChcbiAgICAgICAgICAgICAgRUxFTUVOVF9PUEVSQVRPUlMuJHJlZ2V4LmNvbXBpbGVFbGVtZW50U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgb3BlcmFuZCxcbiAgICAgICAgICAgICAgICBzdWJTZWxlY3RvclxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFhYWCBzdXBwb3J0IHskZXhpc3RzOiB0cnVlfSwgJG1vZCwgJHR5cGUsICRpbiwgJGVsZW1NYXRjaFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIE9LLCBpdCdzIGFuIGVxdWFsaXR5IHRoaW5nLlxuICAgICAgY29uc3RyYWludHMucHVzaChlcXVhbGl0eUVsZW1lbnRNYXRjaGVyKHN1YlNlbGVjdG9yKSk7XG4gICAgfSk7XG5cbiAgICAvLyBJdCBhcHBlYXJzIHRoYXQgdGhlIGZpcnN0IHNvcnQgZmllbGQgaXMgdHJlYXRlZCBkaWZmZXJlbnRseSBmcm9tIHRoZVxuICAgIC8vIG90aGVyczsgd2Ugc2hvdWxkbid0IGNyZWF0ZSBhIGtleSBmaWx0ZXIgdW5sZXNzIHRoZSBmaXJzdCBzb3J0IGZpZWxkIGlzXG4gICAgLy8gcmVzdHJpY3RlZCwgdGhvdWdoIGFmdGVyIHRoYXQgcG9pbnQgd2UgY2FuIHJlc3RyaWN0IHRoZSBvdGhlciBzb3J0IGZpZWxkc1xuICAgIC8vIG9yIG5vdCBhcyB3ZSB3aXNoLlxuICAgIGlmICghY29uc3RyYWludHNCeVBhdGhbdGhpcy5fc29ydFNwZWNQYXJ0c1swXS5wYXRoXS5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9rZXlGaWx0ZXIgPSBrZXkgPT5cbiAgICAgIHRoaXMuX3NvcnRTcGVjUGFydHMuZXZlcnkoKHNwZWNQYXJ0LCBpbmRleCkgPT5cbiAgICAgICAgY29uc3RyYWludHNCeVBhdGhbc3BlY1BhcnQucGF0aF0uZXZlcnkoZm4gPT4gZm4oa2V5W2luZGV4XSkpXG4gICAgICApXG4gICAgO1xuICB9XG59XG5cbi8vIEdpdmVuIGFuIGFycmF5IG9mIGNvbXBhcmF0b3JzXG4vLyAoZnVuY3Rpb25zIChhLGIpLT4obmVnYXRpdmUgb3IgcG9zaXRpdmUgb3IgemVybykpLCByZXR1cm5zIGEgc2luZ2xlXG4vLyBjb21wYXJhdG9yIHdoaWNoIHVzZXMgZWFjaCBjb21wYXJhdG9yIGluIG9yZGVyIGFuZCByZXR1cm5zIHRoZSBmaXJzdFxuLy8gbm9uLXplcm8gdmFsdWUuXG5mdW5jdGlvbiBjb21wb3NlQ29tcGFyYXRvcnMoY29tcGFyYXRvckFycmF5KSB7XG4gIHJldHVybiAoYSwgYikgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcGFyYXRvckFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBjb21wYXJlID0gY29tcGFyYXRvckFycmF5W2ldKGEsIGIpO1xuICAgICAgaWYgKGNvbXBhcmUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH07XG59XG4iXX0=

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
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var check = Package.check.check;
var Match = Package.check.Match;
var DDP = Package['ddp-client'].DDP;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Template = Package['templating-runtime'].Template;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var EJSON = Package.ejson.EJSON;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Random = Package.random.Random;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var moment = Package['momentjs:moment'].moment;
var HTML = Package.htmljs.HTML;
var Spacebars = Package.spacebars.Spacebars;

/* Package-scope variables */
var Utility, FormPreserve, res, Hooks, FormData, ArrayTracker, AutoForm, arrayTracker, globalDefaultTemplate, defaultTypeTemplates, deps, validateField, getFlatDocOfFieldValues, getInputValue, getInputData, updateTrackedFieldValue, updateAllTrackedFieldValues, getAllFieldsInForm, setDefaults;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-common.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// This is the only file that is run on the server, too

// Extend the schema options allowed by SimpleSchema
SimpleSchema.extendOptions({
  autoform: Match.Optional(Object)
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/utility.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global Utility:true, MongoObject, AutoForm, moment, SimpleSchema */

Utility = {
  componentTypeList: ['afArrayField', 'afEachArrayItem', 'afFieldInput', 'afFormGroup', 'afObjectField', 'afQuickField', 'afQuickFields', 'autoForm', 'quickForm'],
  /**
   * @method Utility.cleanNulls
   * @private
   * @param {Object} doc - Source object
   * @returns {Object}
   *
   * Returns an object in which all properties with null, undefined, or empty
   * string values have been removed, recursively.
   */
  cleanNulls: function cleanNulls(doc, isArray, keepEmptyStrings) {
    var newDoc = isArray ? [] : {};
    _.each(doc, function(val, key) {
      if (!_.isArray(val) && isBasicObject(val)) {
        val = cleanNulls(val, false, keepEmptyStrings); //recurse into plain objects
        if (!_.isEmpty(val)) {
          newDoc[key] = val;
        }
      } else if (_.isArray(val)) {
        val = cleanNulls(val, true, keepEmptyStrings); //recurse into non-typed arrays
        if (!_.isEmpty(val)) {
          newDoc[key] = val;
        }
      } else if (!Utility.isNullUndefinedOrEmptyString(val)) {
        newDoc[key] = val;
      } else if (keepEmptyStrings && typeof val === "string" && val.length === 0) {
        newDoc[key] = val;
      }
    });
    return newDoc;
  },
  /**
   * @method Utility.reportNulls
   * @private
   * @param {Object} flatDoc - An object with no properties that are also objects.
   * @returns {Object} An object in which the keys represent the keys in the
   * original object that were null, undefined, or empty strings, and the value
   * of each key is "".
   */
  reportNulls: function reportNulls(flatDoc, keepEmptyStrings) {
    var nulls = {};
    // Loop through the flat doc
    _.each(flatDoc, function(val, key) {
      // If value is undefined, null, or an empty string, report this as null so it will be unset
      if (val === null) {
        nulls[key] = "";
      } else if (val === void 0) {
        nulls[key] = "";
      } else if (!keepEmptyStrings && typeof val === "string" && val.length === 0) {
        nulls[key] = "";
      }
      // If value is an array in which all the values recursively are undefined, null, or an empty string, report this as null so it will be unset
      else if (_.isArray(val) && Utility.cleanNulls(val, true, keepEmptyStrings).length === 0) {
        nulls[key] = "";
      }
    });
    return nulls;
  },
  /**
   * @method Utility.docToModifier
   * @private
   * @param {Object} doc - An object to be converted into a MongoDB modifier
   * @param {Object} [options] - Options
   * @param {Boolean} [options.keepEmptyStrings] - Pass `true` to keep empty strings in the $set. Otherwise $unset them.
   * @param {Boolean} [options.keepArrays] - Pass `true` to $set entire arrays. Otherwise the modifier will $set individual array items.
   * @returns {Object} A MongoDB modifier.
   *
   * Converts an object into a modifier by flattening it, putting keys with
   * null, undefined, and empty string values into `modifier.$unset`, and
   * putting the rest of the keys into `modifier.$set`.
   */
  docToModifier: function docToModifier(doc, options) {
    var modifier = {}, mDoc, flatDoc, nulls;
    options = options || {};

    // Flatten doc
    mDoc = new MongoObject(doc);
    flatDoc = mDoc.getFlatObject({keepArrays: !!options.keepArrays});
    // Get a list of null, undefined, and empty string values so we can unset them instead
    nulls = Utility.reportNulls(flatDoc, !!options.keepEmptyStrings);
    flatDoc = Utility.cleanNulls(flatDoc, false, !!options.keepEmptyStrings);

    if (!_.isEmpty(flatDoc)) {
      modifier.$set = flatDoc;
    }
    if (!_.isEmpty(nulls)) {
      modifier.$unset = nulls;
    }
    return modifier;
  },
  /**
   * @method Utility.getSelectValues
   * @private
   * @param {Element} select - DOM Element from which to get current values
   * @returns {string[]}
   *
   * Gets a string array of all the selected values in a given `select` DOM element.
   */
  getSelectValues: function getSelectValues(select) {
    var result = [];
    var options = select && select.options || [];
    var opt;

    for (var i = 0, ln = options.length; i < ln; i++) {
      opt = options[i];

      if (opt.selected) {
        result.push(opt.value || opt.text);
      }
    }
    return result;
  },
  /*
   * Get select options
   */
  getSelectOptions: function getSelectOptions(defs, hash) {
    var schemaType = defs.type;
    var selectOptions = hash.options;

    // Handle options="allowed"
    if (selectOptions === "allowed") {
      selectOptions = _.map(defs.allowedValues, function(v) {
        var label = v;
        if (hash.capitalize && v.length > 0 && schemaType === String) {
          label = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
        }

        return {label: label, value: v};
      });
    }

    // Hashtable
    else if (_.isObject(selectOptions) && !_.isArray(selectOptions)) {
      selectOptions = _.map(selectOptions, function(v, k) {
        return {label: v, value: schemaType(k)};
      });
    }

    return selectOptions;
  },
  /**
   * @method Utility.lookup
   * @private
   * @param {Any} obj
   * @returns {Any}
   *
   * If `obj` is a string, returns the value of the property with that
   * name on the `window` object. Otherwise returns `obj`.
   */
  lookup: function lookup(obj) {
    var ref = window, arr;
    if (typeof obj === "string") {
      arr = obj.split(".");
      while(arr.length && (ref = ref[arr.shift()]));
      if (!ref) {
        throw new Error(obj + " is not in the window scope");
      }
      return ref;
    }
    return obj;
  },
  /**
   * @method Utility.getDefs
   * @private
   * @param {SimpleSchema} ss
   * @param {String} name
   * @return {Object} Schema definitions object
   *
   * Returns the schema definitions object from a SimpleSchema instance. Equivalent to calling
   * `ss.schema(name)` but handles throwing errors if `name` is not a string or is not a valid
   * field name for this SimpleSchema instance.
   */
  getDefs: function getDefs(ss, name) {
    if (typeof name !== "string") {
      throw new Error("Invalid field name: (not a string)");
    }

    var defs = ss.schema(name);
    if (!defs) {
      throw new Error("Invalid field name: " + name);
    }
    return defs;
  },
  /**
   * @method Utility.objAffectsKey
   * @private
   * @param  {Object} obj
   * @param  {String} key
   * @return {Boolean}
   * @todo should make this a static method in MongoObject
   */
  objAffectsKey: function objAffectsKey(obj, key) {
    var mDoc = new MongoObject(obj);
    return mDoc.affectsKey(key);
  },
  /**
   * @method Utility.expandObj
   * @private
   * @param  {Object} doc
   * @return {Object}
   *
   * Takes a flat object and returns an expanded version of it.
   */
  expandObj: function expandObj(doc) {
    var newDoc = {}, subkeys, subkey, subkeylen, nextPiece, current;
    _.each(doc, function(val, key) {
      subkeys = key.split(".");
      subkeylen = subkeys.length;
      current = newDoc;
      for (var i = 0; i < subkeylen; i++) {
        subkey = subkeys[i];
        if (typeof current[subkey] !== "undefined" && !_.isObject(current[subkey])) {
          break; //already set for some reason; leave it alone
        }
        if (i === subkeylen - 1) {
          //last iteration; time to set the value
          current[subkey] = val;
        } else {
          //see if the next piece is a number
          nextPiece = subkeys[i + 1];
          nextPiece = parseInt(nextPiece, 10);
          if (isNaN(nextPiece) && !_.isObject(current[subkey])) {
            current[subkey] = {};
          } else if (!isNaN(nextPiece) && !_.isArray(current[subkey])) {
            current[subkey] = [];
          }
        }
        current = current[subkey];
      }
    });
    return newDoc;
  },
  /**
   * @method Utility.compactArrays
   * @private
   * @param  {Object} obj
   * @return {undefined}
   *
   * Edits the object by reference, compacting any arrays at any level recursively.
   */
  compactArrays: function compactArrays(obj) {
    if (_.isObject(obj)) {
      _.each(obj, function (val, key) {
        if (_.isArray(val)) {
          obj[key] = _.without(val, void 0, null);
          _.each(obj[key], function (arrayItem) {
            compactArrays(arrayItem);
          });
        } else if (!(val instanceof Date) && _.isObject(val)) {
          //recurse into objects
          compactArrays(val);
        }
      });
    }
  },
  /**
   * @method Utility.bubbleEmpty
   * @private
   * @param  {Object} obj
   * @return {undefined}
   *
   * Edits the object by reference.
   */
  bubbleEmpty: function bubbleEmpty(obj, keepEmptyStrings) {
    if (_.isObject(obj)) {
      _.each(obj, function (val, key) {
        if (_.isArray(val)) {
          _.each(val, function (arrayItem) {
            bubbleEmpty(arrayItem);
          });
        } else if (isBasicObject(val)) {
          var allEmpty = _.all(val, function (prop) {
            return (prop === void 0 || prop === null || (!keepEmptyStrings && typeof prop === "string" && prop.length === 0));
          });
          if (_.isEmpty(val) || allEmpty) {
            obj[key] = null;
          } else {
            //recurse into objects
            bubbleEmpty(val);
          }
        }
      });
    }
  },
  /**
   * @method Utility.isNullUndefinedOrEmptyString
   * @private
   * @param  {Any} val
   * @return {Boolean}
   *
   * Returns `true` if the value is null, undefined, or an empty string
   */
  isNullUndefinedOrEmptyString: function isNullUndefinedOrEmptyString(val) {
    return (val === void 0 || val === null || (typeof val === "string" && val.length === 0));
  },
  /**
   * @method Utility.isValidDateString
   * @private
   * @param  {String}  dateString
   * @return {Boolean}
   *
   * Returns `true` if dateString is a "valid date string"
   */
  isValidDateString: function isValidDateString(dateString) {
    var m = moment(dateString, 'YYYY-MM-DD', true);
    return m && m.isValid();
  },
  /**
   * @method Utility.isValidTimeString
   * @private
   * @param  {String}  timeString
   * @return {Boolean}
   *
   * Returns `true` if timeString is a "valid time string"
   */
  isValidTimeString: function isValidTimeString(timeString) {
    if (typeof timeString !== "string") {
      return false;
    }

    //this reg ex actually allows a few invalid hours/minutes/seconds, but
    //we can catch that when parsing
    var regEx = /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9](\.[0-9]{1,3})?)?$/;
    return regEx.test(timeString);
  },
  /**
   * @method  Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString
   * @private
   * @param  {String} dateString
   * @return {Boolean}
   *
   * Returns true if dateString is a "valid normalized forced-UTC global date and time string"
   */
  isValidNormalizedForcedUtcGlobalDateAndTimeString: function isValidNormalizedForcedUtcGlobalDateAndTimeString(dateString) {
    if (typeof dateString !== "string") {
      return false;
    }

    var datePart = dateString.substring(0, 10);
    var tPart = dateString.substring(10, 11);
    var timePart = dateString.substring(11, dateString.length - 1);
    var zPart = dateString.substring(dateString.length - 1);
    return Utility.isValidDateString(datePart) && tPart === "T" && Utility.isValidTimeString(timePart) && zPart === "Z";
  },
  /**
   * @method  Utility.isValidNormalizedLocalDateAndTimeString
   * @private
   * @param  {String} dtString
   * @return {Boolean}
   *
   * Returns true if dtString is a "valid normalized local date and time string"
   */
  isValidNormalizedLocalDateAndTimeString: function isValidNormalizedLocalDateAndTimeString(dtString) {
    if (typeof dtString !== "string") {
      return false;
    }

    var datePart = dtString.substring(0, 10);
    var tPart = dtString.substring(10, 11);
    var timePart = dtString.substring(11, dtString.length);
    return Utility.isValidDateString(datePart) && tPart === "T" && Utility.isValidTimeString(timePart);
  },
  /**
   * @method Utility.getComponentContext
   * @private
   * @param  {Object} context A context (`this`) object
   * @param {String} name The name of the helper or component we're calling from.
   * @return {Object} Normalized context object
   *
   * Returns an object with `atts` and `defs` properties, normalized from whatever object is passed in.
   * This helps deal with the fact that we have to pass the ancestor autoform's context to different
   * helpers and components in different ways, but in all cases we want to get access to it and throw
   * an error if we can't find an autoform context.
   */
  getComponentContext: function autoFormGetComponentContext(context, name) {
    var atts, defs = {}, formComponentAttributes, fieldAttributes, fieldAttributesForComponentType, ss;

    atts = _.clone(context || {});
    ss = AutoForm.getFormSchema();

    // The component might not exist in the schema anymore
    try{
      defs = Utility.getDefs(ss, atts.name); //defs will not be undefined
    }catch(e){}

    // Look up the tree if we're in a helper, checking to see if any ancestor components
    // had a <componentType>-attribute specified.
    formComponentAttributes = AutoForm.findAttributesWithPrefix(name + "-");

    // Get any field-specific attributes defined in the schema.
    // They can be in autoform.attrName or autoform.componentType.attrName, with
    // the latter overriding the former.
    fieldAttributes = _.clone(defs.autoform) || {};
    fieldAttributesForComponentType = fieldAttributes[name] || {};
    fieldAttributes = _.omit(fieldAttributes, Utility.componentTypeList);
    fieldAttributes = _.extend({}, fieldAttributes, fieldAttributesForComponentType);

    // "autoform" option in the schema provides default atts
    atts = _.extend({}, formComponentAttributes, fieldAttributes, atts);

    // eval any attribute that is provided as a function
    var evaluatedAtts = {};
    _.each(atts, function (v, k) {
      if (typeof v === 'function') {
        evaluatedAtts[k] = v.call({
          name: atts.name
        });
      } else {
        evaluatedAtts[k] = v;
      }
    });

    return {
      atts: evaluatedAtts,
      defs: defs
    };
  },
  /**
   * @method Utility.stringToArray
   * @private
   * @param {String|Array} s A variable that might be a string or an array.
   * @param {String} errorMessage Error message to use if it's not a string or an array.
   * @return {Array} The array, building it from a comma-delimited string if necessary.
   */
  stringToArray: function stringToArray(s, errorMessage) {
    if (typeof s === "string") {
      return s.replace(/ /g, '').split(',');
    } else if (!_.isArray(s)) {
      throw new Error(errorMessage);
    } else {
      return s;
    }
  },
  /**
   * @method Utility.addClass
   * @private
   * @param {Object} atts An object that might have a "class" property
   * @param {String} klass The class string to add
   * @return {Object} The object with klass added to the "class" property, creating the property if necessary
   */
  addClass: function addClass(atts, klass) {
    if (typeof atts["class"] === "string") {
      atts["class"] += " " + klass;
    } else {
      atts["class"] = klass;
    }
    return atts;
  },
  /**
   * @method Utility.getFormTypeDef
   * @private
   * @param {String} formType The form type
   * @return {Object} The definition. Throws an error if type hasn't been defined.
   */
  getFormTypeDef: function getFormTypeDef(formType) {
    var ftd = AutoForm._formTypeDefinitions[formType];
    if (!ftd) {
      throw new Error('AutoForm: Form type "' + formType + '" has not been defined');
    }
    return ftd;
  },
  checkTemplate: function checkTemplate(template) {
    return !!(template &&
            template.view &&
            template.view._domrange &&
            !template.view.isDestroyed);
  }
};

// getPrototypeOf polyfill
if (typeof Object.getPrototypeOf !== "function") {
  if (typeof "".__proto__ === "object") {
    Object.getPrototypeOf = function(object) {
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object) {
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}

/* Tests whether "obj" is an Object as opposed to
 * something that inherits from Object
 *
 * @param {any} obj
 * @returns {Boolean}
 */
var isBasicObject = function(obj) {
  return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

/*
 * Extend SS for now; TODO put this in SS package
 */
if (typeof SimpleSchema.prototype.getAllowedValuesForKey !== 'function') {
  SimpleSchema.prototype.getAllowedValuesForKey = function (key) {
    var defs = this.getDefinition(key, ['type', 'allowedValues']);

    // For array fields, `allowedValues` is on the array item definition
    if (defs.type === Array) {
      defs = this.getDefinition(key+".$", ['allowedValues']);
    }

    return defs.allowedValues;
  };
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/form-preserve.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * @constructor
 * @private
 * @param {String} migrationName
 *
 * Internal helper object to preserve form inputs across Hot Code Push
 * and across "pages" navigation if the option is enabled.
 */
FormPreserve = function formPreserveConstructor(migrationName) {
  var self = this;
  if (! _.isString(migrationName))
    throw Error("You must define an unique migration name of type String");
  self.registeredForms = {};
  self.retrievedDocuments = {};
  if (Package.reload) {
    var Reload = Package.reload.Reload;
    self.retrievedDocuments = Reload._migrationData(migrationName) || '{}';

    // Currently migration does not seem to support proper storage
    // of Date type. It comes back as a string, so we need to store
    // EJSON instead.
    if (typeof self.retrievedDocuments === 'string') {
      self.retrievedDocuments = EJSON.parse(self.retrievedDocuments);
    }

    Reload._onMigrate(migrationName, function () {
      var doc = self._retrieveRegisteredDocuments();
      return [true, EJSON.stringify(doc)];
    });
  }
};

FormPreserve.prototype.getDocument = function (formId) {
  var self = this, doc;
  if (! _.has(self.retrievedDocuments, formId)) {
    return false;
  }

  return self.retrievedDocuments[formId];
};

FormPreserve.prototype.clearDocument = function (formId) {
  delete this.retrievedDocuments[formId];
};

FormPreserve.prototype.registerForm = function (formId, retrieveFunc) {
  this.registeredForms[formId] = retrieveFunc;
};

FormPreserve.prototype.formIsRegistered = function (formId) {
  return !!this.registeredForms[formId];
};

FormPreserve.prototype.unregisterForm = function (formId) {
  delete this.registeredForms[formId];
  delete this.retrievedDocuments[formId];
};

FormPreserve.prototype.unregisterAllForms = function () {
  var self = this;
  self.registeredForms = {};
  self.retrievedDocuments = {};
};

FormPreserve.prototype._retrieveRegisteredDocuments = function () {
  var self = this;
  res = {};
  _.each(self.registeredForms, function (retrieveFunc, formId) {
    res[formId] = retrieveFunc();
  });
  return res;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-hooks.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Manages all hooks, supporting append/replace, get

Hooks = {
  form: {}
};

// The names of all supported hooks, excluding "before" and "after".
var hookNames = ['formToDoc', 'formToModifier', 'docToForm', 'onSubmit', 'onSuccess', 'onError',
    'beginSubmit', 'endSubmit'];

Hooks.getDefault = function() {
  var hooks = {
    before: {},
    after: {}
  };
  _.each(hookNames, function(hookName) {
    hooks[hookName] = [];
  });
  return hooks;
};

Hooks.global = Hooks.getDefault();

Hooks.addHooksToList = function addHooksToList(hooksList, hooks, replace) {
  // Add before hooks
  hooks.before && _.each(hooks.before, function autoFormBeforeHooksEach(func, type) {
    if (typeof func !== "function") {
      throw new Error("AutoForm before hook must be a function, not " + typeof func);
    }
    hooksList.before[type] = (!replace && hooksList.before[type]) ? hooksList.before[type] : [];
    hooksList.before[type].push(func);
  });

  // Add after hooks
  hooks.after && _.each(hooks.after, function autoFormAfterHooksEach(func, type) {
    if (typeof func !== "function") {
      throw new Error("AutoForm after hook must be a function, not " + typeof func);
    }
    hooksList.after[type] = (!replace && hooksList.after[type]) ? hooksList.after[type] : [];
    hooksList.after[type].push(func);
  });

  // Add all other hooks
  _.each(hookNames, function autoFormHooksEach(name) {
    if (hooks[name]) {
      if (typeof hooks[name] !== "function") {
        throw new Error("AutoForm " + name + " hook must be a function, not " + typeof hooks[name]);
      }

      if(replace) {
          hooksList[name] = [];
      }

      hooksList[name].push(hooks[name]);
    }
  });
};

Hooks.getHooks = function getHooks(formId, type, subtype) {
  var f, g;
  if (subtype) {
    f = Hooks.form[formId] && Hooks.form[formId][type] && Hooks.form[formId][type][subtype] || [];
    g = Hooks.global[type] && Hooks.global[type][subtype] || [];
  } else {
    f = Hooks.form[formId] && Hooks.form[formId][type] || [];
    g = Hooks.global[type] || [];
  }
  return f.concat(g);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-formdata.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global FormData:true */

/*
 * Tracks form data with reactivity. This is similar to
 * ReactiveDict, but we need to store typed objects and
 * keep their type upon retrieval.
 */

FormData = function () {
  var self = this;
  self.forms = {};
};

/**
 * Initializes tracking for a given form, if not already done.
 * @param {String} formId The form's `id` attribute
 */
FormData.prototype.initForm = function (formId) {
  var self = this;

  if (self.forms[formId]) {
    return;
  }

  self.forms[formId] = {
    sourceDoc: null,
    deps: {
      sourceDoc: new Tracker.Dependency()
    }
  };
};

/**
 * Initializes tracking for a given form, if not already done.
 * @param {String} formId The form's `id` attribute
 */

/**
 * Gets or sets a source doc for the given form. Reactive.
 * @param   {String}                formId    The form's `id` attribute
 * @param   {MongoObject|null}      sourceDoc The mDoc for the form or `null` if no doc.
 * @returns {MongoObject|undefined} Returns the form's MongoObject if getting.
 */
FormData.prototype.sourceDoc = function (formId, sourceDoc) {
  var self = this;
  self.initForm(formId);

  if (sourceDoc || sourceDoc === null) {
    //setter
    self.forms[formId].sourceDoc = sourceDoc;
    self.forms[formId].deps.sourceDoc.changed();
  } else {
    //getter
    self.forms[formId].deps.sourceDoc.depend();
    return self.forms[formId].sourceDoc;
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-arrays.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Track arrays; this allows us to add/remove fields or groups of fields for an array
// but still easily respect minCount and maxCount, and properly add/remove the same
// items from the database once the form is submitted.

ArrayTracker = function afArrayTracker() {
  var self = this;
  self.info = {};
};

ArrayTracker.prototype.getMinMax = function atGetMinMax(ss, field, overrideMinCount, overrideMaxCount) {
  var defs = AutoForm.Utility.getDefs(ss, field);

  // minCount is set by the schema, but can be set higher on the field attribute
  overrideMinCount = overrideMinCount || 0;
  var minCount = defs.minCount || 0;
  minCount = Math.max(overrideMinCount, minCount);

  // maxCount is set by the schema, but can be set lower on the field attribute
  overrideMaxCount = overrideMaxCount || Infinity;
  var maxCount = defs.maxCount || Infinity;
  maxCount = Math.min(overrideMaxCount, maxCount);

  return {minCount: minCount, maxCount: maxCount};
};

ArrayTracker.prototype.initForm = function atInitForm(formId) {
	var self = this;

	if (self.info[formId])
		return;

	self.info[formId] = {};
};

ArrayTracker.prototype.getForm = function atInitForm(formId) {
	var self = this;
	self.initForm(formId);
	return self.info[formId];
};

ArrayTracker.prototype.ensureField = function atEnsureField(formId, field) {
	var self = this;
	self.initForm(formId);

	if (!self.info[formId][field]) {
		self.resetField(formId, field);
	}
};

ArrayTracker.prototype.initField = function atInitField(formId, field, ss, docCount, overrideMinCount, overrideMaxCount) {
	var self = this;
	self.ensureField(formId, field);

	if (self.info[formId][field].array != null)
		return;

	// If we have a doc: The count should be the maximum of docCount or schema minCount or field minCount or 1.
	// If we don't have a doc: The count should be the maximum of schema minCount or field minCount or 1.
	var range = self.getMinMax(ss, field, overrideMinCount, overrideMaxCount);
	var arrayCount = Math.max(range.minCount, (docCount == null) ? 1 : docCount);

	// If this is an array of objects, collect names of object props
	var childKeys = [];
	if (ss.schema(field + '.$').type === Object) {
    childKeys = ss.objectKeys(SimpleSchema._makeGeneric(field) + '.$');
	}

	var loopArray = [];
	for (var i = 0; i < arrayCount; i++) {
		var loopCtx = createLoopCtx(formId, field, i, childKeys, overrideMinCount, overrideMaxCount);
		loopArray.push(loopCtx);
	};

	self.info[formId][field].array = loopArray;
	var count = loopArray.length;
	self.info[formId][field].count = count;
	self.info[formId][field].visibleCount = count;
	self.info[formId][field].deps.changed();
};

ArrayTracker.prototype.resetField = function atResetField(formId, field) {
	var self = this;
	self.initForm(formId);

	if (!self.info[formId][field]) {
		self.info[formId][field] = {
			deps: new Tracker.Dependency()
		};
	}

	self.info[formId][field].array = null;
	self.info[formId][field].count = 0;
	self.info[formId][field].visibleCount = 0;
	self.info[formId][field].deps.changed();
};

ArrayTracker.prototype.resetForm = function atResetForm(formId) {
	var self = this;
	_.each(self.info[formId], function (info, field) {
		self.resetField(formId, field);
	});
};

ArrayTracker.prototype.untrackForm = function atUntrackForm(formId) {
	var self = this;
	self.info[formId] = {};
};

ArrayTracker.prototype.tracksField = function atTracksField(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return !!self.info[formId][field].array;
};

ArrayTracker.prototype.getField = function atGetField(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return self.info[formId][field].array;
};

ArrayTracker.prototype.getCount = function atGetCount(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return self.info[formId][field].count;
};

ArrayTracker.prototype.getVisibleCount = function atGetVisibleCount(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return self.info[formId][field].visibleCount;
};

ArrayTracker.prototype.isFirstFieldlVisible = function atIsFirstFieldlVisible(formId, field, currentIndex) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	var firstVisibleField = _.find(self.info[formId][field].array, function(currentField) {
		return !currentField.removed;
	});
	return (firstVisibleField && firstVisibleField.index === currentIndex);
};

ArrayTracker.prototype.isLastFieldlVisible = function atIsLastFieldlVisible(formId, field, currentIndex) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	var lastVisibleField = _.last(_.filter(self.info[formId][field].array, function(currentField) {
		return !currentField.removed;
	}));
	return (lastVisibleField && lastVisibleField.index === currentIndex);
};

ArrayTracker.prototype.addOneToField = function atAddOneToField(formId, field, ss, overrideMinCount, overrideMaxCount) {
  var self = this;
  self.ensureField(formId, field);

  if (!self.info[formId][field].array) {
  	return;
  }

  var currentCount = self.info[formId][field].visibleCount
  var maxCount = self.getMinMax(ss, field, overrideMinCount, overrideMaxCount).maxCount;

  if (currentCount < maxCount) {
	  var i = self.info[formId][field].array.length;

	  // If this is an array of objects, collect names of object props
	  var childKeys = [];
	  if (ss.schema(field + '.$').type === Object) {
      childKeys = ss.objectKeys(SimpleSchema._makeGeneric(field) + '.$');
	  }

	  var loopCtx = createLoopCtx(formId, field, i, childKeys, overrideMinCount, overrideMaxCount);

	  self.info[formId][field].array.push(loopCtx);
	  self.info[formId][field].count++;
	  self.info[formId][field].visibleCount++;
	  self.info[formId][field].deps.changed();
  }
};

ArrayTracker.prototype.removeFromFieldAtIndex = function atRemoveFromFieldAtIndex(formId, field, index, ss, overrideMinCount, overrideMaxCount) {
  var self = this;
  self.ensureField(formId, field);

  if (!self.info[formId][field].array) {
  	return;
  }

  var currentCount = self.info[formId][field].visibleCount;
  var minCount = self.getMinMax(ss, field, overrideMinCount, overrideMaxCount).minCount;

  if (currentCount > minCount) {
    self.info[formId][field].array[index].removed = true;
    self.info[formId][field].count--;
    self.info[formId][field].visibleCount--;
    self.info[formId][field].deps.changed();
  }
}

/*
 * PRIVATE
 */
var createLoopCtx = function(formId, field, index, childKeys, overrideMinCount, overrideMaxCount) {
  var loopCtx = {
  	formId:         formId,
  	arrayFieldName: field, 
  	name:           field + '.' + index,
  	index:          index, 
  	minCount:       overrideMinCount,
  	maxCount:       overrideMaxCount
  };

  // If this is an array of objects, add child key names under loopCtx.current[childName] = fullKeyName
  if (childKeys.length) {
    loopCtx.current = {};
	_.each(childKeys, function (k) {
	  loopCtx.current[k] = field + '.' + index + '.' + k;
    });
  }

  return loopCtx;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm:true, FormPreserve */

AutoForm = AutoForm || {};

// formPreserve is used to keep current form data across hot code
// reloads for any forms that are currently rendered
AutoForm.formPreserve = new FormPreserve("autoforms");

AutoForm.reactiveFormData = new FormData();

AutoForm._inputTypeDefinitions = {}; //for storing input type definitions added by AutoForm.addInputType
AutoForm._formTypeDefinitions = {}; //for storing submit type definitions added by AutoForm.addFormType

arrayTracker = new ArrayTracker();

// Used by AutoForm._forceResetFormValues; temporary hack
AutoForm._destroyForm = {};

// reactive templates
globalDefaultTemplate = "bootstrap3";
defaultTypeTemplates = {};
deps = {
  defaultTemplate: new Tracker.Dependency(),
  defaultTypeTemplates: {}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-helpers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global arrayTracker, SimpleSchema, AutoForm */

function parseOptions(options) {
  var hash = (options || {}).hash || {};
  // Find the form's schema
  var ss = AutoForm.getFormSchema();
  return _.extend({}, hash, {ss: ss});
}

/*
 * Global template helpers (exported to app)
 */

/*
 * afFieldMessage
 */
Template.registerHelper('afFieldMessage', function autoFormFieldMessage(options) {
  options = parseOptions(options, 'afFieldMessage');
  var formId = AutoForm.getFormId();

  return options.ss.namedContext(formId).keyErrorMessage(options.name);
});

/*
 * afFieldIsInvalid
 */
Template.registerHelper('afFieldIsInvalid', function autoFormFieldIsInvalid(options) {
  options = parseOptions(options, 'afFieldIsInvalid');
  var formId = AutoForm.getFormId();

  return options.ss.namedContext(formId).keyIsInvalid(options.name);
});

/*
 * afArrayFieldHasMoreThanMinimum
 */
Template.registerHelper('afArrayFieldHasMoreThanMinimum', function autoFormArrayFieldHasMoreThanMinimum(options) {
  options = parseOptions(options, 'afArrayFieldHasMoreThanMinimum');
  var form = AutoForm.getCurrentDataPlusExtrasForForm();

  // Registered form types can disable adding/removing array items
  if (form.formTypeDef.hideArrayItemButtons) {
    return false;
  }

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(form.id, options.name);
  return (visibleCount > range.minCount);
});

/*
 * afArrayFieldHasLessThanMaximum
 */
Template.registerHelper('afArrayFieldHasLessThanMaximum', function autoFormArrayFieldHasLessThanMaximum(options) {
  options = parseOptions(options, 'afArrayFieldHasLessThanMaximum');
  var form = AutoForm.getCurrentDataPlusExtrasForForm();

  // Registered form types can disable adding/removing array items
  if (form.formTypeDef.hideArrayItemButtons) {
    return false;
  }

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(form.id, options.name);
  return (visibleCount < range.maxCount);
});

/*
 * afFieldValueIs
 */
Template.registerHelper('afFieldValueIs', function autoFormFieldValueIs(options) {
  options = parseOptions(options, 'afFieldValueIs');

  var currentValue = AutoForm.getFieldValue(options.name, options.formId);
  return currentValue === options.value;
});

/*
 * afArrayFieldIsFirstVisible
 */
Template.registerHelper('afArrayFieldIsFirstVisible', function autoFormArrayFieldIsFirstVisible() {
  var context = this;
  return arrayTracker.isFirstFieldlVisible(context.formId, context.arrayFieldName, context.index);
});

/*
 * afArrayFieldIsLastVisible
 */
Template.registerHelper('afArrayFieldIsLastVisible', function autoFormArrayFieldIsLastVisible() {
  var context = this;
  return arrayTracker.isLastFieldlVisible(context.formId, context.arrayFieldName, context.index);
});

/*
 * afFieldValueContains
 */
Template.registerHelper('afFieldValueContains', function autoFormFieldValueContains(options) {
  options = parseOptions(options, 'afFieldValueContains');

  var currentValue = AutoForm.getFieldValue(options.name, options.formId);
  return _.isArray(currentValue) && (_.contains(currentValue, options.value) || options.values && _.intersection(currentValue, options.values.split(",")));
});

/*
 * afFieldLabelText
 */
Template.registerHelper('afFieldLabelText', function autoFormFieldLabelText(options) {
  options = parseOptions(options, 'afFieldLabelText');
  return AutoForm.getLabelForField(options.name);
});

/*
 * afFieldNames
 */
Template.registerHelper("afFieldNames", function autoFormFieldNames(options) {
  options = parseOptions(options, 'afFieldNames');
  var ss = options.ss, name = options.name, namePlusDot, genericName, genericNamePlusDot;
  var form = AutoForm.getCurrentDataForForm();

  if (name) {
    namePlusDot = name + ".";
    genericName = SimpleSchema._makeGeneric(name);
    genericNamePlusDot = genericName + ".";
  }

  // Get the list of fields we want included
  var fieldList = options.fields, usedAncestorFieldList = false;
  if (fieldList) {
    fieldList = AutoForm.Utility.stringToArray(fieldList, 'AutoForm: fields attribute must be an array or a string containing a comma-delimited list of fields');
  }

  var ancestorFieldList = AutoForm.findAttribute("fields");
  if (ancestorFieldList) {
    ancestorFieldList = AutoForm.Utility.stringToArray(ancestorFieldList, 'AutoForm: fields attribute must be an array or a string containing a comma-delimited list of fields');

    // Use the ancestor field list as backup, unless there is
    // a name and that name is listed in the ancestor field list
    if (!fieldList) {
      fieldList = ancestorFieldList;
      usedAncestorFieldList = true;
    }
  }

  if (fieldList) {

    // Take only those fields in the fieldList that are descendants of the `name` field
    if (name) {
      // Replace generic name with real name. We assume that field names
      // with $ apply to all array items. Field list will now have the
      // correct array field item number instead of $.
      if (genericName !== name) {
        fieldList = _.map(fieldList, function (field) {
          if (field.indexOf(genericNamePlusDot) === 0) {
            return namePlusDot + field.slice(genericNamePlusDot.length);
          }
          return field;
        });
      }

      fieldList = _.filter(fieldList, function filterFieldsByName(field) {
        return field.indexOf(namePlusDot) === 0;
      });
    }

    // If top level fields, be sure to remove any with $ in them
    else {
      fieldList = _.filter(fieldList, function filterArrayFields(field) {
        return (field.slice(-2) !== '.$' && field.indexOf('.$.') === -1);
      });
    }

    // First we filter out any fields that are subobjects where the
    // parent object is also in the fieldList and is NOT the current
    // field name.
    // This means that if you do `fields="address,address.city"` we
    // will use an afObjectField for address and include only the
    // "city" field within that, but if you instead do `fields="address.city"`
    // we will use a single field for the city, with no afObjectField
    // template around it.
    fieldList = _.reject(fieldList, function (field) {
      var lastDotPos = field.lastIndexOf(".");
      if (lastDotPos === -1) {
        return false; //keep
      }

      var parentField = field.slice(0, lastDotPos);
      if (parentField.slice(-2) === ".$") {
        parentField = parentField.slice(0, -2);
      }
      return _.contains(fieldList, parentField) && parentField !== name && parentField !== genericName;
    });
  }

  if (!fieldList || (fieldList.length === 0 && usedAncestorFieldList)) {
    // Get list of field names that are descendants of this field's name.
    // If name/genericName is undefined, this will return top-level
    // schema keys.
    fieldList = ss.objectKeys(genericName);

    if (name) {
      // Tack child field name on to end of parent field name. This
      // ensures that we keep the desired array index for array items.
      fieldList = _.map(fieldList, function (field) {
        return name + "." + field;
      });
    }
  }

  // If user wants to omit some fields, remove those from the array
  var omitFields = options.omitFields || AutoForm.findAttribute("omitFields");
  if (omitFields) {
    omitFields = AutoForm.Utility.stringToArray(omitFields, 'AutoForm: omitFields attribute must be an array or a string containing a comma-delimited list of fields');
    fieldList = _.difference(fieldList, omitFields);
    // If omitFields contains generic field names (with $) we omit those too
    fieldList = _.reject(fieldList, function (f) {
      return _.contains(omitFields, SimpleSchema._makeGeneric(f));
    });
  }

  // Filter out fields we never want
  fieldList = _.filter(fieldList, function shouldIncludeField(field) {
    var fieldDefs = ss.schema(field);

    // Don't include fields that are not in the schema
    if (!fieldDefs) {
      return false;
    }

    // Don't include fields with autoform.omit=true
    if (fieldDefs.autoform && fieldDefs.autoform.omit === true) {
      return false;
    }

    // Don't include fields with denyInsert=true when it's an insert form
    if (fieldDefs.denyInsert && form.type === "insert") {
      return false;
    }

    // Don't include fields with denyUpdate=true when it's an update form
    if (fieldDefs.denyUpdate && form.type === "update") {
      return false;
    }

    return true;
  });

  // Ensure fields are not added more than once
  fieldList = _.unique(fieldList);

  // We return it as an array of objects because that
  // works better with Blaze contexts
  fieldList = _.map(fieldList, function (name) {
    return {name: name};
  });

  return fieldList;
});


/*
 * afSelectOptionAtts
 */
Template.registerHelper('afSelectOptionAtts', function afSelectOptionAtts() {
  var atts = _.pick(this, 'value');
  if (this.selected) {
    atts.selected = "";
  }
  if (this.htmlAtts) {
    _.extend(atts, this.htmlAtts);
  }
  return atts;
});

// Expects to be called with this.name available
Template.registerHelper('afOptionsFromSchema', function afOptionsFromSchema() {
  return AutoForm._getOptionsForField(this.name);
});

/*
 * afTemplateName
 * Deprecated. Don't use this. Eventually remove it.
 */
Template.registerHelper('afTemplateName', function afTemplateNameHelper(templateType, templateName) {
  var self = this;
  console.log('The afTemplateName template helper is deprecated. Use AutoForm.getTemplateName method in your own helper.');
  return AutoForm.getTemplateName(templateType, templateName, self.atts && self.atts.name);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-validation.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, validateField:true */

function _validateField(key, formId, skipEmpty, onlyIfAlreadyInvalid) {
  var docToValidate;

  // Due to throttling, this can be called after the autoForm template is destroyed.
  // If that happens, we exit without error.
  var template = AutoForm.templateInstanceForForm(formId);

  // If form is not currently rendered, return true
  if (!Utility.checkTemplate(template)) return true;

  var form = AutoForm.getCurrentDataForForm(formId);
  var ss = AutoForm.getFormSchema(formId, form);

  if (!ss) return true;

  // Skip validation if onlyIfAlreadyInvalid is true and the form is
  // currently valid.
  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return true; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  // Get the form type definition
  var ftd = Utility.getFormTypeDef(form.type);

  // Clean and validate doc
  docToValidate = AutoForm.getFormValues(formId, template, ss, !!ftd.usesModifier);

  // If form is not currently rendered, return true
  if (!docToValidate) {
    return true;
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !AutoForm.Utility.objAffectsKey(docToValidate, key)) {
    return true; //skip validation
  }

  return AutoForm._validateFormDoc(docToValidate, !!ftd.usesModifier, formId, ss, form, key);
}

// Throttle field validation to occur at most every 300ms,
// with leading and trailing calls.
validateField = _.throttle(_validateField, 300);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-inputs.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, getInputValue:true, getAllFieldsInForm:true, getInputData:true, updateTrackedFieldValue:true, updateAllTrackedFieldValues:true, getFlatDocOfFieldValues:true */

getFlatDocOfFieldValues = function getFlatDocOfFieldValues(fields, ss) {
  var doc = {};
  fields.each(function () {
    var fieldName, val = AutoForm.getInputValue(this, ss);
    if (val !== void 0) {
      // Get the field/schema key name
      fieldName = $(this).attr("data-schema-key");
      doc[fieldName] = val;
    }
  });
  return doc;
};

/*
 * package scope functions
 */

/*
 * Gets the value that should be shown/selected in the input. Returns
 * a string, a boolean, or an array of strings. The value used,
 * in order of preference, is one of:
 * * The `value` attribute provided
 * * The value that is set in the `doc` provided on the containing autoForm
 * * The `defaultValue` from the schema
 */
getInputValue = function getInputValue(atts, value, mDoc, schemaDefaultValue, fieldDefaultValue, typeDefs) {

  if (typeof value === "undefined") {
    // Get the value for this key in the current document
    if (mDoc) {
      var valueInfo = mDoc.getInfoForKey(atts.name);
      if (valueInfo) {
        value = valueInfo.value;
      } else {
        value = fieldDefaultValue;
      }
    }

    // Only if there is no current document, use the schema defaultValue
    else {
      // Use the field default value if provided
      if (typeof fieldDefaultValue !== 'undefined') {
        value = fieldDefaultValue;
      }
      // Or use the defaultValue in the schema
      else {
        value = schemaDefaultValue;
      }
    }
  }

  // Change null or undefined to an empty string
  value = (value === null || value === void 0) ? '' : value;

  // If the component expects the value to be an array, and it's not, make it one
  if (typeDefs.valueIsArray && !_.isArray(value)) {
    if (typeof value === "string") {
      value = value.split(',');
    } else {
      value = [value];
    }
  }

  // At this point we have a value or an array of values.
  // Run through the components valueIn function if we have one.
  // It should then be in whatever format the component expects.
  if (typeof typeDefs.valueIn === "function") {
    value = typeDefs.valueIn(value, atts);
  }

  return value;
};

/*
 * Builds the data context that the input component will have.
 */
getInputData = function getInputData(defs, hash, value, label, formType) {

  /*
   * Get HTML attributes
   */

  // We don't want to alter the original hash, so we clone it and
  // remove some stuff that should not be HTML attributes.
  var inputAtts = _.omit(hash,
          "type",
          "value",
          "noselect",
          "options",
          "template",
          "defaultValue",
          "data");

  // Add required if required
  if (typeof inputAtts.required === "undefined" && !defs.optional) {
    inputAtts.required = "";
  }

   // Add data-schema-key to every type of element
  inputAtts['data-schema-key'] = inputAtts.name;

  // Set placeholder to label from schema if requested.
  // We check hash.placeholder instead of inputAtts.placeholder because
  // we're setting inputAtts.placeholder, so it wouldn't be the same on
  // subsequent reactive runs of this function.
  if (hash.placeholder === "schemaLabel") {
    inputAtts.placeholder = label;
  }

  // To enable reactively toggling boolean attributes
  // in a simple way, we add the attributes to the HTML
  // only if their value is `true`. That is, unlike in
  // HTML, their mere presence does not matter.
  _.each(["disabled", "readonly", "checked", "required", "autofocus"], function (booleanProp) {
    if (!_.has(hash, booleanProp)) {
      return;
    }

    // For historical reasons, we treat the string "true" and an empty string as `true`, too.
    // But an empty string value results in the cleanest rendered output for boolean props,
    // so we standardize as that.
    if (hash[booleanProp] === true || hash[booleanProp] === "true" || hash[booleanProp] === "") {
      inputAtts[booleanProp] = "";
    } else {
      // If the value is anything else, we don't render it
      delete inputAtts[booleanProp];
    }
  });

  /*
   * Set up the context. This is the object that becomes `this` in the
   * input type template.
   */

  var inputTypeContext = {
    name: inputAtts.name,
    schemaType: defs.type,
    min: (typeof defs.min === "function") ? defs.min() : defs.min,
    max: (typeof defs.max === "function") ? defs.max() : defs.max,
    decimal: defs.decimal,
    value: value,
    atts: inputAtts,
    selectOptions: AutoForm.Utility.getSelectOptions(defs, hash)
  };

  /*
   * Merge data property from the field schema with the context.
   * We do not want these turned into HTML attributes.
   */
  if(hash.data){
    _.extend(inputTypeContext, hash.data);
  }

  // Before returning the context, we allow the registered form type to
  // adjust it if necessary.
  var ftd = Utility.getFormTypeDef(formType);
  if (typeof ftd.adjustInputContext === 'function') {
    inputTypeContext = ftd.adjustInputContext(inputTypeContext);
  }

  return inputTypeContext;
};

function markChanged(template, fieldName) {
  // We always want to be sure to wait for DOM updates to
  // finish before we indicate that values have changed.
  // Using a value of 0 here did not work, but 100 seems to
  // work in testing. We'll need to keep an eye on this.
  // Not an ideal solution.
  setTimeout(function () {
    // Template or view may have disappeared while
    // we waited to run this
    if (template &&
        template.view &&
        template.view._domrange &&
        !template.view.isDestroyed &&
        template.formValues[fieldName]) {

      template.formValues[fieldName].changed();
      template.formValues[fieldName].requestInProgress = false;

    }
  }, 100);
}

updateTrackedFieldValue = function updateTrackedFieldValue(template, fieldName) {
  if (!template) return;

  template.formValues = template.formValues || {};
  if (!template.formValues[fieldName]) {
    template.formValues[fieldName] = new Tracker.Dependency();
  }
  // In case we call updateTrackedFieldValue from multiple places at once,
  // call .changed() only once
  if (template.formValues[fieldName].requestInProgress) {
    return;
  }
  template.formValues[fieldName].requestInProgress = true;

  markChanged(template, fieldName);

  // To properly handle array fields, we'll mark the ancestors as changed, too
  // XXX Might be a more elegant way to handle this
  var dotPos = fieldName.lastIndexOf('.');
  while (dotPos !== -1) {
    fieldName = fieldName.slice(0, dotPos);

    if (!template.formValues[fieldName]) {
      template.formValues[fieldName] = new Tracker.Dependency();
    }

    markChanged(template, fieldName);

    dotPos = fieldName.lastIndexOf('.');
  }
};

updateAllTrackedFieldValues = function updateAllTrackedFieldValues(template) {
  if (template && template.formValues) {
    _.each(template.formValues, function (o, fieldName) {
      updateTrackedFieldValue(template, fieldName);
    });
  }
};

getAllFieldsInForm = function getAllFieldsInForm(template) {
  // Get all elements with `data-schema-key` attribute, unless disabled
  return template.$("[data-schema-key]").not("[disabled]");
  // Exclude fields in sub-forms, since they will belong to a different AutoForm and schema.
  // TODO need some selector/filter that actually works correctly for excluding subforms
  // return template.$('[data-schema-key]').not("[disabled]").not(template.$('form form [data-schema-key]'));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-api.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm:true, SimpleSchema, Utility, Hooks, deps, globalDefaultTemplate:true, defaultTypeTemplates:true, validateField, arrayTracker, ReactiveVar, getAllFieldsInForm, setDefaults:true, getFlatDocOfFieldValues, MongoObject */

// This file defines the public, exported API

AutoForm = AutoForm || {}; //exported

/**
 * @property AutoForm.Utility
 * @public
 */
AutoForm.Utility = Utility;

/**
 * @method AutoForm.addHooks
 * @public
 * @param {String[]|String|null} formIds Form `id` or array of form IDs to which these hooks apply. Specify `null` to add hooks that will run for every form.
 * @param {Object} hooks Hooks to add, where supported names are "before", "after", "formToDoc", "docToForm", "onSubmit", "onSuccess", and "onError".
 * @returns {undefined}
 *
 * Defines hooks to be used by one or more forms. Extends hooks lists if called multiple times for the same
 * form.
 */
AutoForm.addHooks = function autoFormAddHooks(formIds, hooks, replace) {
  if (typeof formIds === "string") {
    formIds = [formIds];
  }

  // If formIds is null, add global hooks
  if (!formIds) {
    Hooks.addHooksToList(Hooks.global, hooks, replace);
  } else {
    _.each(formIds, function (formId) {

      // Init the hooks object if not done yet
      Hooks.form[formId] = Hooks.form[formId] || Hooks.getDefault();

      Hooks.addHooksToList(Hooks.form[formId], hooks, replace);
    });
  }
};

/**
 * @method AutoForm.hooks
 * @public
 * @param {Object} hooks
 * @returns {undefined}
 *
 * Defines hooks by form id. Extends hooks lists if called multiple times for the same
 * form.
 */
AutoForm.hooks = function autoFormHooks(hooks, replace) {
  _.each(hooks, function(hooksObj, formId) {
    AutoForm.addHooks(formId, hooksObj, replace);
  });
};

/**
 * @property AutoForm._hooks
 * @public
 *
 * Hooks list to aid automated testing
 */
AutoForm._hooks = Hooks.form;

/**
 * @property AutoForm._globalHooks
 * @public
 *
 * Global hooks list to aid automated testing
 */
AutoForm._globalHooks = Hooks.global;

/**
 * @method AutoForm._forceResetFormValues
 * @public
 * @param {String} formId
 * @returns {undefined}
 *
 * Forces an AutoForm's values to properly update.
 * See https://github.com/meteor/meteor/issues/2431
 */
AutoForm._forceResetFormValues = function autoFormForceResetFormValues(formId) {
  AutoForm._destroyForm[formId] = AutoForm._destroyForm[formId] || new ReactiveVar(false);

  AutoForm._destroyForm[formId].set(true);
  setTimeout(function () {
    AutoForm._destroyForm[formId].set(false);
  }, 0);
};

/**
 * @method AutoForm.resetForm
 * @public
 * @param {String} formId
 * @param {TemplateInstance} [template] Looked up if not provided. Pass in for efficiency.
 * @returns {undefined}
 *
 * Resets an autoform, including resetting validation errors. The same as clicking the reset button for an autoform.
 */
AutoForm.resetForm = function autoFormResetForm(formId, template) {
  template = template || AutoForm.templateInstanceForForm(formId);
  if (!Utility.checkTemplate(template)) return;
  template.$("form")[0].reset();
};

/**
 * @method AutoForm.setDefaultTemplate
 * @public
 * @param {String} template
 */
AutoForm.setDefaultTemplate = function autoFormSetDefaultTemplate(template) {
  globalDefaultTemplate = template;
  deps.defaultTemplate.changed();
};

/**
 * @method AutoForm.getDefaultTemplate
 * @public
 *
 * Reactive.
 */
AutoForm.getDefaultTemplate = function autoFormGetDefaultTemplate() {
  deps.defaultTemplate.depend();
  return globalDefaultTemplate;
};

/**
 * @method AutoForm.setDefaultTemplateForType
 * @public
 * @param {String} type
 * @param {String} template
 */
AutoForm.setDefaultTemplateForType = function autoFormSetDefaultTemplateForType(type, template) {
  if (!deps.defaultTypeTemplates[type]) {
    deps.defaultTypeTemplates[type] = new Tracker.Dependency();
  }
  if (template !== null && !Template[type + "_" + template]) {
    throw new Error("setDefaultTemplateForType can't set default template to \"" + template + "\" for type \"" + type + "\" because there is no defined template with the name \"" + type + "_" + template + "\"");
  }
  defaultTypeTemplates[type] = template;
  deps.defaultTypeTemplates[type].changed();
};

/**
 * @method AutoForm.getDefaultTemplateForType
 * @public
 * @param {String} type
 * @return {String} Template name
 *
 * Reactive.
 */
AutoForm.getDefaultTemplateForType = function autoFormGetDefaultTemplateForType(type) {
  if (!deps.defaultTypeTemplates[type]) {
    deps.defaultTypeTemplates[type] = new Tracker.Dependency();
  }
  deps.defaultTypeTemplates[type].depend();
  return defaultTypeTemplates[type];
};

/**
 * @method AutoForm.getTemplateName
 * @public
 * @param {String} templateType
 * @param {String} templateName
 * @param {String} [fieldName]
 * @param {Boolean} [skipExistsCheck] Pass `true` to return a template name even if that template hasn't been defined.
 * @return {String} Template name
 *
 * Returns the full template name. In the simplest scenario, this is templateType_templateName
 * as passed in. However, if templateName is not provided, it is looked up in the following
 * manner:
 *
 * 1. autoform.<componentType>.template from the schema (field+type override for all forms)
 * 2. autoform.template from the schema (field override for all forms)
 * 3. template-<componentType> attribute on an ancestor component within the same form (form+type for all fields)
 * 4. template attribute on an ancestor component within the same form (form specificity for all types and fields)
 * 5. Default template for component type, as set by AutoForm.setDefaultTemplateForType
 * 6. Default template, as set by AutoForm.setDefaultTemplate.
 * 7. Built-in default template, currently bootstrap-3.
 */
AutoForm.getTemplateName = function autoFormGetTemplateName(templateType, templateName, fieldName, skipExistsCheck) {
  var schemaAutoFormDefs, templateFromAncestor, defaultTemplate;

  function templateExists(t) {
    return !!(skipExistsCheck || Template[t]);
  }

  // Default case: use the `template` attribute provided
  if (templateName && templateExists(templateType + '_' + templateName)) {
    return templateType + '_' + templateName;
  }

  // If the attributes provided a templateName but that template didn't exist, show a warning
  if (templateName && AutoForm._debug) {
    console.warn(templateType + ': "' + templateName + '" is not a valid template name. Falling back to a different template.');
  }

  // Get `autoform` object from the schema, if present.
  // Skip for quickForm because it renders a form and not a field.
  if (templateType !== 'quickForm' && fieldName) {
    var fieldSchema = AutoForm.getSchemaForField(fieldName);
    schemaAutoFormDefs = fieldSchema && fieldSchema.autoform;
  }

  // Fallback #1: autoform.<componentType>.template from the schema
  if (schemaAutoFormDefs && schemaAutoFormDefs[templateType] && schemaAutoFormDefs[templateType].template && templateExists(templateType + '_' + schemaAutoFormDefs[templateType].template)) {
    return templateType + '_' + schemaAutoFormDefs[templateType].template;
  }

  // Fallback #2: autoform.template from the schema
  if (schemaAutoFormDefs && schemaAutoFormDefs.template && templateExists(templateType + '_' + schemaAutoFormDefs.template)) {
    return templateType + '_' + schemaAutoFormDefs.template;
  }

  // Fallback #3: template-<componentType> attribute on an ancestor component within the same form
  templateFromAncestor = AutoForm.findAttribute("template-" + templateType);
  if (templateFromAncestor && templateExists(templateType + '_' + templateFromAncestor)) {
    return templateType + '_' + templateFromAncestor;
  }

  // Fallback #4: template attribute on an ancestor component within the same form
  templateFromAncestor = AutoForm.findAttribute("template");
  if (templateFromAncestor && templateExists(templateType + '_' + templateFromAncestor)) {
    return templateType + '_' + templateFromAncestor;
  }

  // Fallback #5: Default template for component type, as set by AutoForm.setDefaultTemplateForType
  defaultTemplate = AutoForm.getDefaultTemplateForType(templateType);
  if (defaultTemplate && templateExists(templateType + '_' + defaultTemplate)) {
    return templateType + '_' + defaultTemplate;
  }

  // Fallback #6: Default template, as set by AutoForm.setDefaultTemplate
  defaultTemplate = AutoForm.getDefaultTemplate();
  if (defaultTemplate && templateExists(templateType + '_' + defaultTemplate)) {
    return templateType + '_' + defaultTemplate;
  }

  // Found nothing. Return undefined
  return;
};

/**
 * @method AutoForm.getFormValues
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want current values for.
 * @param {Template} [template] The template instance, if already known, as a performance optimization.
 * @param {SimpleSchema} [ss] The SimpleSchema instance, if already known, as a performance optimization.
 * @param {Boolean} [getModifier] Set to `true` to return a modifier object or `false` to return a normal object. For backwards compatibility, and object containing both is returned if this is undefined.
 * @return {Object|null}
 *
 * Returns an object representing the current values of all schema-based fields in the form.
 * The returned object is either a normal object or a MongoDB modifier, based on the `getModifier` argument. Return value may be `null` if the form is not currently rendered on screen.
 */
AutoForm.getFormValues = function autoFormGetFormValues(formId, template, ss, getModifier) {
  var insertDoc, updateDoc, transforms;

  template = template || AutoForm.templateInstanceForForm(formId);
  if (!template ||
      !template.view ||
      // We check for domrange later in this function
      template.view.isDestroyed) {
    return null;
  }

  // Get a reference to the SimpleSchema instance that should be used for
  // determining what types we want back for each field.
  ss = ss || AutoForm.getFormSchema(formId);

  var form = AutoForm.getCurrentDataForForm(formId);

  // By default, we do not keep empty strings
  var keepEmptyStrings = false;
  if (form.removeEmptyStrings === false) {
    keepEmptyStrings = true;
  }
  // By default, we do filter
  var filter = true;
  if (form.filter === false) {
    filter = false;
  }
  // By default, we do autoConvert
  var autoConvert = true;
  if (form.autoConvert === false) {
    autoConvert = false;
  }
  // By default, we do trimStrings
  var trimStrings = true;
  if (form.trimStrings === false) {
    trimStrings = false;
  }
  // By default, we do keepArrays
  // We need keepArrays: false when we need update fields
  // like "foo.2.bar" to update the proper index. But in
  // most cases, we need to keep arrays together due to the mongo
  // bug that creates objects rather than arrays if the array
  // does not already exist in the db.
  var keepArrays = true;
  if (form.setArrayItems === true) {
    keepArrays = false;
  }

  var hookCtx = {
    template: template,
    formId: formId,
    schema: ss
  };

  // Get a preliminary doc based on the form
  var doc;

  if (template.view._domrange) {
    // Build a flat document from field values
    doc = getFlatDocOfFieldValues(getAllFieldsInForm(template), ss);

    // Expand the flat document
    doc = AutoForm.Utility.expandObj(doc);

    // When all fields that comprise a sub-object are empty, we should unset
    // the whole subobject and not complain about required fields in it. For example,
    // if `profile.address` has several properties but they are all null or undefined,
    // we will set `profile.address=null`. This ensures that we don't get incorrect validation
    // errors about required fields that are children of optional objects.
    AutoForm.Utility.bubbleEmpty(doc, keepEmptyStrings);
  } else {
    // If the form is not yet rendered, use the form.doc
    doc = form.doc || {};
  }

  // Create and clean insert doc.
  if (getModifier !== true) {
    // Delete any properties that are null, undefined, or empty strings,
    // unless the form has requested to keep empty string.
    // Do not add autoValues at this stage.
    insertDoc = AutoForm.Utility.cleanNulls(doc, false, keepEmptyStrings);

    // As array items are removed, gaps can appear in the numbering,
    // which results in arrays that have undefined items. Here we
    // remove any array items that are undefined.
    //
    // We do this to the insertDoc, but we don't want to do it earlier to the
    // doc, because that would cause the update modifier to have $sets for
    // the wrong array indexes.
    AutoForm.Utility.compactArrays(insertDoc);

    ss.clean(insertDoc, {
      isModifier: false,
      getAutoValues: false,
      filter: filter,
      autoConvert: autoConvert,
      trimStrings: trimStrings
    });

    // Pass expanded doc through formToDoc hooks
    transforms = Hooks.getHooks(formId, 'formToDoc');
    _.each(transforms, function formValuesTransform(transform) {
      insertDoc = transform.call(hookCtx, insertDoc, ss);
    });
  }

  // Create and clean update modifier.
  if (getModifier !== false) {
    // Converts to modifier object with $set and $unset.
    // Do not add autoValues at this stage.
    updateDoc = AutoForm.Utility.docToModifier(doc, {
      keepEmptyStrings: keepEmptyStrings,
      keepArrays: keepArrays
    });

    ss.clean(updateDoc, {
      isModifier: true,
      getAutoValues: false,
      filter: filter,
      autoConvert: autoConvert,
      trimStrings: trimStrings
    });

    // Pass modifier through formToModifier hooks
    transforms = Hooks.getHooks(formId, 'formToModifier');
    _.each(transforms, function formValuesTransform(transform) {
      updateDoc = transform.call(hookCtx, updateDoc);
    });
  }

  if (getModifier === true) {
    return updateDoc;
  } else if (getModifier === false) {
    return insertDoc;
  } else {
    // We return insertDoc and updateDoc when getModifier
    // is undefined for backwards compatibility
    return {
      insertDoc: insertDoc,
      updateDoc: updateDoc
    };
  }
};

/**
 * @method AutoForm.getFieldValue
 * @public
 * @param {String} fieldName The name of the field for which you want the current value.
 * @param {String} [formId] The `id` attribute of the `autoForm` you want current values for. Default is the closest form from the current context.
 * @return {Any|undefined}
 *
 * Returns the value of the field (the value that would be used if the form were submitted right now).
 * This is a reactive method that will rerun whenever the current value of the requested field changes. Return value will be undefined if the field is not currently rendered.
 */
AutoForm.getFieldValue = function autoFormGetFieldValue(fieldName, formId) {
  // find AutoForm template
  var template = Tracker.nonreactive(function () {
    return AutoForm.templateInstanceForForm(formId);
  });

  if (!template) {
    if (formId) {
      AutoForm.rerunWhenFormRenderedOrDestroyed(formId);
    }
    return;
  }

  // reactive dependency
  template.formValues = template.formValues || {};
  if (!template.formValues[fieldName]) {
    template.formValues[fieldName] = new Tracker.Dependency();
  }
  template.formValues[fieldName].depend();

  var doc = AutoForm.getFormValues(formId, template, null, false);
  if (!doc) return;

  var mDoc = new MongoObject(doc);
  return mDoc.getValueForKey(fieldName);
};

/**
 * @method AutoForm.getInputTypeTemplateNameForElement
 * @public
 * @param {DOMElement} element The input DOM element, generated by an autoform input control
 * @return {String}
 *
 * Returns the name of the template used to render the element.
 */
AutoForm.getInputTypeTemplateNameForElement = function autoFormGetInputTypeTemplateNameForElement(element) {
  // get the enclosing view
  var view = Blaze.getView(element);
  // if the enclosing view is not a template, perhaps because
  // the template contains a block helper like if, with, each,
  // then look up the view chain until we arrive at a template
  while (view &&
         view.name.indexOf('Template.') !== 0 &&
         view.name.indexOf('BlazeComponent.') !== 0) {
    view = view.originalParentView || view.parentView;
  }

  if (!view) return;

  // View names have "Template." or "BlazeComponent." at the beginning so we slice that off.
  return view.name.slice(view.name.indexOf('.') + 1);
};

/**
 * @method AutoForm.getInputValue
 * @public
 * @param {DOMElement} element The input DOM element, generated by an autoform input control, which must have a `data-schema-key` attribute set to the correct schema key name.
 * @param {SimpleSchema} [ss] Provide the SimpleSchema instance if you already have it.
 * @return {Any}
 *
 * Returns the value of the field (the value that would be used if the form were submitted right now).
 * Unlike `AutoForm.getFieldValue`, this function is not reactive.
 */
AutoForm.getInputValue = function autoFormGetInputValue(element, ss) {
  var field, fieldName, fieldType, fieldSchema, arrayItemFieldType, val, typeDef, inputTypeTemplate, dataContext, autoConvert;

  Tracker.nonreactive(function() {
    //don't rerun when data context of element changes, can cause infinite loops

    dataContext = Blaze.getData(element);
    if (dataContext && dataContext.atts) {
      autoConvert = dataContext.atts.autoConvert;
    }
  });

  // Get jQuery field reference
  field = $(element);

  // Get the field/schema key name
  fieldName = field.attr("data-schema-key");

  // If we have a schema, we can autoconvert to the correct data type
  if (ss) {
    fieldSchema = ss.schema(fieldName);
    if (fieldSchema) {
      fieldType = fieldSchema.type;
    }
  }

  // Get the name of the input type template used to render the input element
  inputTypeTemplate = AutoForm.getInputTypeTemplateNameForElement(element);

  // Slice off the potential theme template, after the last underscore.
  var lastUnderscore = inputTypeTemplate.lastIndexOf('_');
  if (lastUnderscore !== -1) {
    inputTypeTemplate = inputTypeTemplate.slice(0, lastUnderscore);
  }

  // Figure out what registered input type was used to render this element
  typeDef = _.where(AutoForm._inputTypeDefinitions, {template: inputTypeTemplate})[0];

  // If field has a "data-null-value" attribute, value should always be null
  if (field.attr("data-null-value") !== void 0) {
    val = null;
  }
  // Otherwise get the field's value using the input type's `valueOut` function if provided
  else if (typeDef && typeDef.valueOut) {
    val = typeDef.valueOut.call(field);
  }
  // Otherwise get the field's value in a default way
  else {
    val = field.val();
  }

  // run through input's type converter if provided
  if (val !== void 0 && autoConvert !== false && typeDef && typeDef.valueConverters && fieldType) {
    var converterFunc;
    if (fieldType === String) {
      converterFunc = typeDef.valueConverters.string;
    } else if (fieldType === Number) {
      converterFunc = typeDef.valueConverters.number;
    } else if (fieldType === Boolean) {
      converterFunc = typeDef.valueConverters.boolean;
    } else if (fieldType === Date) {
      converterFunc = typeDef.valueConverters.date;
    } else if (fieldType === Array) {
      arrayItemFieldType = ss.schema(fieldName + ".$").type;
      if (arrayItemFieldType === String) {
        converterFunc = typeDef.valueConverters.stringArray;
      } else if (arrayItemFieldType === Number) {
        converterFunc = typeDef.valueConverters.numberArray;
      } else if (arrayItemFieldType === Boolean) {
        converterFunc = typeDef.valueConverters.booleanArray;
      } else if (arrayItemFieldType === Date) {
        converterFunc = typeDef.valueConverters.dateArray;
      }
    }

    if (typeof converterFunc === "function") {
      val = converterFunc.call(field, val);
    }
  }

  return val;
};

/**
 * @method AutoForm.addInputType
 * @public
 * @param {String} name The type string that this definition is for.
 * @param {Object} definition Defines how the input type should be rendered.
 * @param {String} definition.componentName The component name. A template with the name <componentName>_bootstrap3, and potentially others, must be defined.
 * @return {undefined}
 *
 * Use this method to add custom input components.
 */
AutoForm.addInputType = function afAddInputType(name, definition) {
  var obj = {};
  obj[name] = definition;
  _.extend(AutoForm._inputTypeDefinitions, obj);
};

/**
 * @method AutoForm.addFormType
 * @public
 * @param {String} name The type string that this definition is for.
 * @param {Object} definition Defines how the submit type should work
 * @param {Function} [definition.adjustInputContext] A function that accepts a single argument, which is the context with which an input template in the form will be called, potentially changes the context object, and then returns it. For example, the "readonly" and "disabled" form types use this function to add the "readonly" or "disabled" attribute, respectively, to every input within the form.
 * @param {Function} [definition.adjustSchema] A function that accepts a single argument, which is the form schema, and potentially uses that to return a different schema to use instead. For example, the "update-pushArray" form type uses this function to build and return a schema that is limited by the `scope` attribute on the form. When this function is called, `this` contains useful information about the form.
 * @param {Boolean} [definition.hideArrayItemButtons] Set to `true` if this form type should not show buttons for adding and removing items in an array field. The "disabled" and "readonly" form types do this.
 * @param {Function} definition.onSubmit A function that does whatever should happen upon submission of this form type. When this function is called, `this` contains useful information about the form. At a minimum, you probably want to call `this.event.preventDefault()` to prevent the browser from submitting the form. Your submission logic may want to rely on additional custom form attributes, which will be available in `this.formAttributes`. If you do any additional validation and it fails, you should call `this.failedValidation()`. When your logic is done, you should call `this.result(error, result)`. If you want to end the submission process without providing a result, call `this.endSubmission()`. If you don't call `this.result()` or `this.endSubmission()`, `endSubmit` hooks won't be called, so for example the submit button might remain disabled. `onError` hooks will be called only if you pass an error to `this.result()`. `onSuccess` hooks will be called only if you do not pass an error to `this.result()`.
 * @param {Function} [definition.shouldPrevalidate] A function that returns `true` if validation against the form schema should happen before the `onSubmit` function is called, or `false` if not. When this function is called, `this` contains useful information about the form. If this function is not provided for a form type, the default is `true`.
 * @param {Function} definition.validateForm A function that validates the form and returns `true` if valid or `false` if not. This can happen during submission but also at other times. When this function is called, `this` contains useful information about the form and the validation options.
 * @return {undefined}
 *
 * Use this method to add custom form types.
 */
AutoForm.addFormType = function afAddFormType(name, definition) {
  var obj = {};
  obj[name] = definition;
  _.extend(AutoForm._formTypeDefinitions, obj);
};

/**
 * @method AutoForm.validateField
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want to validate.
 * @param {String} fieldName The name of the field within the `autoForm` you want to validate.
 * @param {Boolean} [skipEmpty=false] Set to `true` to skip validation if the field has no value. Useful for preventing `required` errors in form fields that the user has not yet filled out.
 * @return {Boolean} Is it valid?
 *
 * In addition to returning a boolean that indicates whether the field is currently valid,
 * this method causes the reactive validation messages to appear.
 */
AutoForm.validateField = function autoFormValidateField(formId, fieldName, skipEmpty) {
  return validateField(fieldName, formId, skipEmpty, false);
};

/**
 * @method AutoForm.validateForm
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want to validate.
 * @return {Boolean} Is it valid?
 *
 * In addition to returning a boolean that indicates whether the form is currently valid,
 * this method causes the reactive validation messages to appear.
 */
AutoForm.validateForm = function autoFormValidateForm(formId) {
  var form = AutoForm.getCurrentDataForForm(formId);
  var formDoc, formType = form.type;

  var ftd = Utility.getFormTypeDef(formType);

  // Gather all form values
  if (ftd.needsModifierAndDoc) {
    formDoc = AutoForm.getFormValues(formId, null, null);
  } else if (ftd.usesModifier) {
    formDoc = AutoForm.getFormValues(formId, null, null, true);
  } else {
    formDoc = AutoForm.getFormValues(formId, null, null, false);
  }

  // If form is not currently rendered, return true
  if (!formDoc) {
    return true;
  }

  return (form.validation === 'none') || ftd.validateForm.call({
    form: form,
    formDoc: formDoc,
    useCollectionSchema: false
  });
};

/**
 * @method AutoForm.getValidationContext
 * @public
 * @param {String} [formId] The `id` attribute of the `autoForm` for which you want the validation context
 * @return {SimpleSchemaValidationContext} The SimpleSchema validation context object.
 *
 * Use this method to get the validation context, which can be used to check
 * the current invalid fields, manually invalidate fields, etc.
 */
AutoForm.getValidationContext = function autoFormGetValidationContext(formId) {
  var form = AutoForm.getCurrentDataForForm(formId);
  var ss = form._resolvedSchema;
  if (!ss) return;
  // formId may not be passed in, but we MUST pass it into namedContext to get back proper context
  formId = formId || form.id;
  return ss.namedContext(formId);
};

/**
 * @method AutoForm.findAttribute
 * @public
 * @param {String} attrName Attribute name
 * @return {Any|undefined} Searches for the given attribute, looking up the parent context tree until the closest autoform is reached.
 *
 * Call this method from a UI helper. Might return undefined.
 */
AutoForm.findAttribute = function autoFormFindAttribute(attrName) {
  var val, view, viewData;

  function checkView() {
    // Is the attribute we're looking for on here?
    // If so, stop searching
    viewData = Blaze.getData(view);
    if (viewData && viewData.atts && viewData.atts[attrName] !== void 0) {
      val = viewData.atts[attrName];
    } else if (viewData && viewData[attrName] !== void 0) {
      // When searching for "template", make sure we didn't just
      // find the one that's on Template.dynamic
      if (attrName !== 'template' || !('data' in viewData)) {
        val = viewData[attrName];
      }
    }
  }

  // Loop
  view = Blaze.currentView;
  while (val === undefined && view && view.name !== 'Template.autoForm') {
    checkView();
    view = view.originalParentView || view.parentView;
  }

  // If we've reached the form, check there, too
  if (val === undefined && view && view.name === 'Template.autoForm') {
    checkView();
  }

  return val;
};

/**
 * @method AutoForm.findAttributesWithPrefix
 * @public
 * @param {String} prefix Attribute prefix
 * @return {Object} An object containing all of the found attributes and their values, with the prefix removed from the keys.
 *
 * Call this method from a UI helper. Searches for attributes that start with the given prefix, looking up the parent context tree until the closest autoform is reached.
 */
AutoForm.findAttributesWithPrefix = function autoFormFindAttributesWithPrefix(prefix) {
  var result = {}, view, viewData, searchObj;

  function checkView() {
    // Is the attribute we're looking for on here?
    // If so, add to result object.
    viewData = Blaze.getData(view);
    if (viewData && viewData.atts) {
      searchObj = viewData.atts;
    } else {
      searchObj = viewData;
    }
    // We need an isArray check, too because _.isObject([{}]) comes back true
    if (_.isObject(searchObj) && !_.isArray(searchObj)) {
      _.each(searchObj, function (v, k) {
        if (k.indexOf(prefix) === 0) {
          result[k.slice(prefix.length)] = v;
        }
      });
    }
  }

  // Loop
  view = Blaze.currentView;
  while (view && view.name !== 'Template.autoForm') {
    checkView();
    view = view.originalParentView || view.parentView;
  }

  // If we've reached the form, check there, too
  if (view && view.name === 'Template.autoForm') {
    checkView();
  }

  return result;
};

/**
 * @method AutoForm.debug
 * @public
 *
 * Call this method in client code while developing to turn on extra logging.
 * You need to call it just one time, usually in top level client code.
 */
AutoForm.debug = function autoFormDebug() {
  SimpleSchema.debug = true;
  AutoForm._debug = true;
  AutoForm.addHooks(null, {
    onError: function (operation, error) {
      console.log("Error in " + this.formId, operation, error);
    }
  });
};

/**
 * @property AutoForm.arrayTracker
 * @public
 */
AutoForm.arrayTracker = arrayTracker;

/**
 * @method AutoForm.getInputType
 * @param {Object} atts The attributes provided to afFieldInput.
 * @public
 * @return {String} The input type. Most are the same as the `type` attributes for HTML input elements, but some are special strings that autoform interprets.
 *
 * Call this method from a UI helper to get the type string for the input control.
 */
AutoForm.getInputType = function getInputType(atts) {
  var expectsArray = false, defs, schemaType, type;

  atts = AutoForm.Utility.getComponentContext(atts, 'afFieldInput').atts;

  // If a `type` attribute is specified, we just use that
  if (atts.type) {
    return atts.type;
  }

  // Get schema definition, using the item definition for array fields
  defs = AutoForm.getSchemaForField(atts.name);
  schemaType = defs && defs.type;
  if (schemaType === Array) {
    expectsArray = true;
    defs = AutoForm.getSchemaForField(atts.name + ".$");
    schemaType = defs && defs.type;
  }

  if (!schemaType) return 'text';

  // Based on the `type` attribute, the `type` from the schema, and/or
  // other characteristics such as regEx and whether an array is expected,
  // choose which type string to return.

  // If options were provided, noselect is `true`, and the schema
  // expects the value of the field to be an array, use "select-checkbox".
  if (atts.options && atts.noselect === true && expectsArray) {
    type = 'select-checkbox';
  }

  // If options were provided, noselect is `true`, and the schema
  // does not expect the value of the field to be an array, use "select-radio".
  else if (atts.options && atts.noselect === true && !expectsArray) {
    type = 'select-radio';
  }

  // If options were provided, noselect is not `true`, and the schema
  // expects the value of the field to be an array, use "select-multiple".
  else if (atts.options && atts.noselect !== true && expectsArray) {
    type = 'select-multiple';
  }

  // If options were provided, noselect is not `true`, and the schema
  // does not expect the value of the field to be an array, use "select".
  else if (atts.options && atts.noselect !== true && !expectsArray) {
    type = 'select';
  }

  // If the schema expects the value of the field to be a string and
  // the `rows` attribute is provided, use "textarea"
  else if (schemaType === String && atts.rows === +atts.rows) {
    type = 'textarea';
  }

  // If the schema expects the value of the field to be a number,
  // use "number"
  else if (schemaType === Number) {
    type = 'number';
  }

  // If the schema expects the value of the field to be a Date instance,
  // use "date"
  else if (schemaType === Date) {
    type = 'date';
  }

  // If the schema expects the value of the field to be a boolean,
  // use "boolean-checkbox"
  else if (schemaType === Boolean) {
    type = 'boolean-checkbox';
  }

  // Default is "text"
  else {
    type = 'text';
  }

  return type;
};

/**
 * @method AutoForm.getSchemaForField
 * @public
 * @param {String} name The field name attribute / schema key.
 * @return {Object|undefined}
 *
 * Call this method from a UI helper to get the field definitions based on the schema used by the closest containing autoForm.
 */
AutoForm.getSchemaForField = function autoFormGetSchemaForField(name) {
  var ss = AutoForm.getFormSchema();
  if (!ss) return;
  return ss.schema(name); // might be undefined
};

/**
 * @method AutoForm._getOptionsForField
 * @public
 * @param {String} name The field name attribute / schema key.
 * @return {Array(Object)|String|undefined}
 *
 * Call this method from a UI helper to get the select options for the field. Might return the string "allowed".
 */
AutoForm._getOptionsForField = function autoFormGetOptionsForField(name) {
  var ss, def, saf, allowedValues;

  ss = AutoForm.getFormSchema();
  if (!ss) return;

  def = ss.getDefinition(name);
  if (!def) return;

  // If options in schema, use those
  saf = def.autoform;
  if (saf) {
    if (saf.afFieldInput && saf.afFieldInput.options) {
      return saf.afFieldInput.options;
    } else if (saf.afQuickField && saf.afQuickField.options) {
      return saf.afQuickField.options;
    } else if (saf.options) {
      return saf.options;
    }
  }

  // If schema has allowedValues, use those
  allowedValues = ss.getAllowedValuesForKey(name);
  if (allowedValues) return 'allowed';
};

/**
 * @method AutoForm.getLabelForField
 * @public
 * @param {String} name The field name attribute / schema key.
 * @return {Object}
 *
 * Call this method from a UI helper to get the field definitions based on the schema used by the closest containing autoForm.
 */
AutoForm.getLabelForField = function autoFormGetLabelForField(name) {
  var ss = AutoForm.getFormSchema(), label = ss.label(name);
  // for array items we don't want to inflect the label because
  // we will end up with a number;
  // TODO this check should probably be in the SimpleSchema code
  if (SimpleSchema._makeGeneric(name).slice(-1) === "$" && !isNaN(parseInt(label, 10))) {
    label = null;
  }
  return label;
};

/**
 * @method AutoForm.templateInstanceForForm
 * @public
 * @param {String} [formId] The form's `id` attribute
 * @returns {TemplateInstance|undefined} The template instance.
 *
 * Gets the template instance for the form with formId or the closest form to the current context.
 */
AutoForm.templateInstanceForForm = function (formId) {
  var view = AutoForm.viewForForm(formId);

  if (!view) return;

  return view.templateInstance();
};

/**
 * @method AutoForm.viewForForm
 * @public
 * @param {String} [formId] The form's `id` attribute. Do not pass this if calling from within a form context.
 * @returns {Blaze.View|undefined} The `Blaze.View` instance for the autoForm.
 *
 * Gets the `Blaze.View` instance for the form with formId or the closest form to the current context.
 */
AutoForm.viewForForm = function (formId) {
  var formElement, view;

  if (formId) {
    formElement = document.getElementById(formId);
    if (!formElement) {
      return;
    }
  }

  // If formElement is undefined, Blaze.getView returns the current view.
  try {
    view = Blaze.getView(formElement);
  } catch (err) {}

  while (view && view.name !== 'Template.autoForm') {
    view = view.originalParentView || view.parentView;
  }

  if (!view || view.name !== 'Template.autoForm') {
    return;
  }

  return view;
};

/**
 * @method AutoForm.getArrayCountFromDocForField
 * @public
 * @param {String} formId The form's `id` attribute
 * @param {String} field  The field name (schema key)
 * @returns {Number|undefined} Array count in the attached document.
 *
 * Looks in the document attached to the form to see if the
 * requested field exists and is an array. If so, returns the
 * length (count) of the array. Otherwise returns undefined.
 */
AutoForm.getArrayCountFromDocForField = function (formId, field) {
  var mDoc = AutoForm.reactiveFormData.sourceDoc(formId);
  var docCount;
  if (mDoc) {
    var keyInfo = mDoc.getInfoForKey(field);
    if (keyInfo && _.isArray(keyInfo.value)) {
      docCount = keyInfo.value.length;
    }
  }
  return docCount;
};

/**
 * @method AutoForm.parseData
 * @public
 * @param {Object} data Current data context for the form, or an empty object. Usually this is used from a quickForm, since the autoForm won't be rendered yet. Otherwise you should use AutoForm.getCurrentDataForForm if you can.
 * @returns {Object} Current data context for the form, or an empty object.
 *
 * Parses and alters the current data context for a form. It will have default values added and a `_resolvedSchema` property that has the schema the form should use.
 */
AutoForm.parseData = function (data) {
  return setDefaults(data);
};

/**
 * @method AutoForm.getCurrentDataForForm
 * @public
 * @param {String} formId The form's `id` attribute
 * @returns {Object} Current data context for the form, or an empty object.
 *
 * Returns the current data context for a form.
 * You can call this without a formId from within a helper and
 * the data for the nearest containing form will be returned.
 */
AutoForm.getCurrentDataForForm = function (formId) {
  var view = AutoForm.viewForForm(formId);

  if (!view) return;

  var data = Blaze.getData(view);

  if (!data) return;

  return setDefaults(data);
};

/**
 * @method AutoForm.getCurrentDataPlusExtrasForForm
 * @public
 * @param   {String} [formId] The form's `id` attribute
 * @returns {Object} Current data context for the form, or an empty object.
 *
 * Returns the current data context for a form plus some extra properties.
 * You can call this without a formId from within a helper and
 * the data for the nearest containing form will be returned.
 */
AutoForm.getCurrentDataPlusExtrasForForm = function (formId) {
  var data = AutoForm.getCurrentDataForForm(formId);

  data = _.clone(data);

  // add form type definition
  var formType = data.type || 'normal';
  data.formTypeDef = Utility.getFormTypeDef(formType);

  return data;
};

/**
 * @method AutoForm.getFormCollection
 * @public
 * @param {String} formId The form's `id` attribute
 * @returns {Mongo.Collection|undefined} The Collection instance
 *
 * Gets the collection for a form from the `collection` attribute
 */
AutoForm.getFormCollection = function (formId) {
  var data = AutoForm.getCurrentDataForForm(formId);
  return AutoForm.Utility.lookup(data.collection);
};

/**
 * @method AutoForm.getFormSchema
 * @public
 * @param {String} formId The form's `id` attribute
 * @param {Object} [form] Pass the form data context as an optimization or if the form is not yet rendered.
 * @returns {SimpleSchema|undefined} The SimpleSchema instance
 *
 * Gets the schema for a form, from the `schema` attribute if
 * provided, or from the schema attached to the `Mongo.Collection`
 * specified in the `collection` attribute. The form must be
 * currently rendered.
 */
AutoForm.getFormSchema = function (formId, form) {
  form = form ? setDefaults(form) : AutoForm.getCurrentDataForForm(formId);
  return form._resolvedSchema;
};

/**
 * @method AutoForm.getFormId
 * @public
 * @returns {String} The containing form's `id` attribute value
 *
 * Call in a helper to get the containing form's `id` attribute. Reactive.
 */
AutoForm.getFormId = function () {
  return AutoForm.getCurrentDataForForm().id;
};

/**
 * @method AutoForm.selectFirstInvalidField
 * @public
 * @param {String} formId The `id` attribute of the form
 * @param {SimpleSchema} ss The SimpleSchema instance that was used to create the form's validation context.
 * @returns {undefined}
 *
 * Selects the focus the first field (in DOM order) with an error.
 */
AutoForm.selectFirstInvalidField = function selectFirstInvalidField(formId, ss) {
  var ctx = ss.namedContext(formId), template, fields;
  if (!ctx.isValid()) {
    template = AutoForm.templateInstanceForForm(formId);
    fields = getAllFieldsInForm(template);
    fields.each(function () {
      var f = $(this);
      if (ctx.keyIsInvalid(f.attr('data-schema-key'))) {
        f.focus();
        return false;
      }
    });
  }
};

AutoForm.addStickyValidationError = function addStickyValidationError(formId, key, type, value) {
  var template = AutoForm.templateInstanceForForm(formId);
  if (!template) return;

  // Add error
  template._stickyErrors[key] = {
    type: type,
    value: value
  };

  // Revalidate that field
  validateField(key, formId, false, false);
};

AutoForm.removeStickyValidationError = function removeStickyValidationError(formId, key) {
  var template = AutoForm.templateInstanceForForm(formId);
  if (!template) return;

  // Remove errors
  delete template._stickyErrors[key];

  // Revalidate that field
  validateField(key, formId, false, false);
};

/**
 * @method AutoForm._validateFormDoc
 * @public
 *
 * If creating a form type, you will often want to call this from the `validateForm` function. It provides the generic form validation logic that does not typically change between form types.
 *
 * @param {Object} doc The document with the gathered form values to validate.
 * @param {Boolean} isModifier Is `doc` actually a mongo modifier object?
 * @param {String} formId The form `id` attribute
 * @param {SimpleSchema} ss The SimpleSchema instance against which to validate.
 * @param {Object} form The form context object
 * @param {String} [key] Optionally, a specific schema key to validate.
 * @returns {Boolean} Is the form valid?
 */
AutoForm._validateFormDoc = function validateFormDoc(doc, isModifier, formId, ss, form, key) {
  var isValid;
  var ec = {
    userId: (Meteor.userId && Meteor.userId()) || null,
    isInsert: !isModifier,
    isUpdate: !!isModifier,
    isUpsert: false,
    isFromTrustedCode: false,
    docId: (form.doc && form.doc._id) || null
  };

  // Get a version of the doc that has auto values to validate here. We
  // don't want to actually send any auto values to the server because
  // we ultimately want them generated on the server
  var docForValidation = _.clone(doc);
  ss.clean(docForValidation, {
    isModifier: isModifier,
    filter: false,
    autoConvert: false,
    trimStrings: false,
    extendAutoValueContext: ec
  });

  // Get form's validation context
  var vc = ss.namedContext(formId);

  // Validate
  // If `key` is provided, we validate that key/field only
  if (key) {
    isValid = vc.validateOne(docForValidation, key, {
      modifier: isModifier,
      extendedCustomContext: ec
    });

    // Add sticky error for this key if there is one
    var stickyError = AutoForm.templateInstanceForForm(formId)._stickyErrors[key];
    if (stickyError) {
      isValid = false;
      vc.addInvalidKeys([
        {name: key, type: stickyError.type, value: stickyError.value}
      ]);
    }
  } else {
    isValid = vc.validate(docForValidation, {
      modifier: isModifier,
      extendedCustomContext: ec
    });

    // Add sticky errors for all keys if any
    var stickyErrors = AutoForm.templateInstanceForForm(formId)._stickyErrors;
    if (!_.isEmpty(stickyErrors)) {
      isValid = false;
      stickyErrors = _.map(stickyErrors, function (obj, k) {
        return {name: k, type: obj.type, value: obj.value};
      });
      vc.addInvalidKeys(stickyErrors);
    }

    if (!isValid) {
      AutoForm.selectFirstInvalidField(formId, ss);
    }
  }

  return isValid;
};

/**
 * Sets defaults for the form data context
 * @private
 * @returns {String} The data context with property defaults added.
 */
setDefaults = function setDefaults(data) {
  if (!data) data = {};

  // default form type is "normal"
  if (typeof data.type !== 'string') {
    data.type = 'normal';
  }

  // default form validation is "submitThenKeyup"
  if (typeof data.validation !== 'string') {
    data.validation = 'submitThenKeyup';
  }

  // Resolve form schema
  if (!data._resolvedSchema) {
    var formType = data.type;
    var schema = data.schema;
    if (schema) {
      schema = AutoForm.Utility.lookup(schema);
    } else {
      var collection = AutoForm.Utility.lookup(data.collection);
      if (collection && typeof collection.simpleSchema === 'function') {
        schema = collection.simpleSchema();
      }
    }

    // Form type definition can optionally alter the schema
    var ftd = Utility.getFormTypeDef(formType);

    if (typeof ftd.adjustSchema === 'function') {
      schema = ftd.adjustSchema.call({form: data}, schema);
    }

    // If we have a schema, cache it
    if (schema) {
      data._resolvedSchema = schema;
    }
  }

  return data;
};

var waitingForForms = {};
AutoForm.rerunWhenFormRenderedOrDestroyed = function (formId) {
  if (!_.has(waitingForForms, formId)) {
    waitingForForms[formId] = new Tracker.Dependency();
  }
  waitingForForms[formId].depend();
};

AutoForm.triggerFormRenderedDestroyedReruns = function (formId) {
  if (!_.has(waitingForForms, formId)) {
    waitingForForms[formId] = new Tracker.Dependency();
  }
  waitingForForms[formId].changed();
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/insert.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

AutoForm.addFormType('insert', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    // Make sure we have a collection
    var collection = this.collection;
    if (!collection) {
      throw new Error("AutoForm: You must specify a collection when form type is insert.");
    }

    // See if the collection has a schema attached
    var collectionHasSchema = (typeof collection.simpleSchema === "function" &&
                               collection.simpleSchema() != null);

    // Run "before.insert" hooks
    this.runBeforeHooks(this.insertDoc, function (doc) {
      // Perform insert
      if (collectionHasSchema) {
        // If the collection2 pkg is used and a schema is attached, we pass a validationContext
        collection.insert(doc, c.validationOptions, c.result);
      } else {
        // If the collection2 pkg is not used or no schema is attached, we don't pass options
        // because core Meteor's `insert` function does not accept
        // an options argument.
        collection.insert(doc, c.result);
      }
    });
  },
  validateForm: function () {
    // Get SimpleSchema
    var ss = AutoForm.getFormSchema(this.form.id);
    // Validate
    return AutoForm._validateFormDoc(this.formDoc, false, this.form.id, ss, this.form);
  },
  shouldPrevalidate: function () {
    // Prevalidate only if there is both a `schema` attribute and a `collection` attribute
    return !!this.formAttributes.collection && !!this.formAttributes.schema;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/update.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

AutoForm.addFormType('update', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    // Make sure we have a collection
    var collection = this.collection;
    if (!collection) {
      throw new Error("AutoForm: You must specify a collection when form type is update.");
    }

    // Run "before.update" hooks
    this.runBeforeHooks(this.updateDoc, function (modifier) {
      if (_.isEmpty(modifier)) { // make sure this check stays after the before hooks
        // Nothing to update. Just treat it as a successful update.
        c.result(null, 0);
      } else {
        // Perform update
        collection.update({_id: c.docId}, modifier, c.validationOptions, c.result);
      }
    });
  },
  usesModifier: true,
  validateForm: function () {
    // Get SimpleSchema
    var ss = AutoForm.getFormSchema(this.form.id);
    // We validate the modifier. We don't want to throw errors about missing required fields, etc.
    return AutoForm._validateFormDoc(this.formDoc, true, this.form.id, ss, this.form);
  },
  shouldPrevalidate: function () {
    // Prevalidate only if there is both a `schema` attribute and a `collection` attribute
    return !!this.formAttributes.collection && !!this.formAttributes.schema;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/update-pushArray.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, SimpleSchema */

AutoForm.addFormType('update-pushArray', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    // Make sure we have a collection
    var collection = this.collection;
    if (!collection) {
      throw new Error("AutoForm: You must specify a collection when form type is update-pushArray.");
    }

    // Make sure we have a scope
    var scope = c.formAttributes.scope;
    if (!scope) {
      throw new Error("AutoForm: You must specify a scope when form type is update-pushArray.");
    }

    // Run "before.update" hooks
    this.runBeforeHooks(this.insertDoc, function (doc) {
      if (_.isEmpty(doc)) { // make sure this check stays after the before hooks
        // Nothing to update. Just treat it as a successful update.
        c.result(null, 0);
      } else {
        var modifer = {$push: {}};
        modifer.$push[scope] = doc;
        // Perform update
        collection.update({_id: c.docId}, modifer, c.validationOptions, c.result);
      }
    });
  },
  validateForm: function () {
    // Get SimpleSchema
    var ss = AutoForm.getFormSchema(this.form.id);
    // We validate as if it's an insert form
    return AutoForm._validateFormDoc(this.formDoc, false, this.form.id, ss, this.form);
  },
  adjustSchema: function (ss) {
    var scope = this.form.scope, newSchemaDef = {};
    var searchString = SimpleSchema._makeGeneric(scope) + '.$.';

    // create new SS instance with only the fields that begin with `scope`
    _.each(ss.schema(), function (val, key) {
      if (key.indexOf(searchString) === 0) {
        newSchemaDef[key.slice(searchString.length)] = val;
      }
    });

    return new SimpleSchema(newSchemaDef);
  },
  shouldPrevalidate: function () {
    // Prevalidate because the form is generated with a schema
    // that has keys different from the collection schema
    return true;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/method.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

AutoForm.addFormType('method', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    if (!this.formAttributes.meteormethod) {
      throw new Error('When form type is "method", you must also provide a "meteormethod" attribute');
    }

    // Run "before.method" hooks
    this.runBeforeHooks(this.insertDoc, function (doc) {
      // Validate. If both schema and collection were provided, then we validate
      // against the collection schema here. Otherwise we validate against whichever
      // one was passed.
      var valid = (c.formAttributes.validation === 'none') ||
          c.formTypeDefinition.validateForm.call({
            form: c.formAttributes,
            formDoc: doc,
            useCollectionSchema: c.ssIsOverride
          });

      if (valid === false) {
        c.failedValidation();
      } else {
        // Call the method. If a ddp connection was provided, use
        // that instead of the default Meteor connection
        var ddp = c.formAttributes.ddp;
        ddp = (ddp && typeof ddp.call === 'function') ? ddp : Meteor;
        ddp.call(c.formAttributes.meteormethod, doc, c.result);
      }
    });
  },
  validateForm: function () {
    // Get SimpleSchema
    var ss = AutoForm.getFormSchema(this.form.id);

    var collection = AutoForm.getFormCollection(this.form.id);
    // If there is a `schema` attribute but you want to force validation against the
    // collection's schema instead, pass useCollectionSchema=true
    ss = (this.useCollectionSchema && collection) ? collection.simpleSchema() : ss;

    // Validate
    return AutoForm._validateFormDoc(this.formDoc, false, this.form.id, ss, this.form);
  },
  shouldPrevalidate: function () {
    // Prevalidate only if there is both a `schema` attribute and a `collection` attribute
    return !!this.formAttributes.collection && !!this.formAttributes.schema;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/method-update.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

AutoForm.addFormType('method-update', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    if (!this.formAttributes.meteormethod) {
      throw new Error('When form type is "method-update", you must also provide a "meteormethod" attribute');
    }

    // Run "before.method" hooks
    this.runBeforeHooks(this.updateDoc, function (updateDoc) {
      // Validate. If both schema and collection were provided, then we validate
      // against the collection schema here. Otherwise we validate against whichever
      // one was passed.
      var valid = (c.formAttributes.validation === 'none') ||
          c.formTypeDefinition.validateForm.call({
            form: c.formAttributes,
            formDoc: updateDoc,
            useCollectionSchema: c.ssIsOverride
          });

      if (valid === false) {
        c.failedValidation();
      } else {
        // Call the method. If a ddp connection was provided, use
        // that instead of the default Meteor connection
        var ddp = c.formAttributes.ddp;
        ddp = (ddp && typeof ddp.call === 'function') ? ddp : Meteor;
        // If singleMethodArgument=true, we call with a single object argument
        // for compatibility with validated-method
        if (c.formAttributes.singleMethodArgument === true) {
          ddp.call(c.formAttributes.meteormethod, {
            _id: c.docId,
            modifier: updateDoc,
          }, c.result);
        } else {
          ddp.call(c.formAttributes.meteormethod, updateDoc, c.docId, c.result);
        }
      }
    });
  },
  usesModifier: true,
  validateForm: function () {
    // Get SimpleSchema
    var ss = AutoForm.getFormSchema(this.form.id);

    var collection = AutoForm.getFormCollection(this.form.id);
    // If there is a `schema` attribute but you want to force validation against the
    // collection's schema instead, pass useCollectionSchema=true
    ss = (this.useCollectionSchema && collection) ? collection.simpleSchema() : ss;

    // We validate the modifier. We don't want to throw errors about missing required fields, etc.
    return AutoForm._validateFormDoc(this.formDoc, true, this.form.id, ss, this.form);
  },
  shouldPrevalidate: function () {
    // Prevalidate only if there is both a `schema` attribute and a `collection` attribute
    return !!this.formAttributes.collection && !!this.formAttributes.schema;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/normal.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, Hooks */

AutoForm.addFormType('normal', {
  onSubmit: function () {
    var c = this;

    // Get onSubmit hooks
    // These are called differently from the before hooks because
    // they run async, but they can run in parallel and we need the
    // result of all of them immediately because they can return
    // false to stop normal form submission.
    var hooks = Hooks.getHooks(this.formId, 'onSubmit');

    var hookCount = hooks.length, doneCount = 0, submitError, submitResult;

    if (hookCount === 0) {
      // we haven't called preventDefault, so normal browser
      // submission will now happen
      this.endSubmission();
      return;
    }

    // Set up onSubmit hook context
    var ctx = _.extend({
      done: function (error, result) {
        doneCount++;
        if (!submitError && error) {
          submitError = error;
        }
        if (!submitResult && result) {
          submitResult = result;
        }
        if (doneCount === hookCount) {
          // run onError, onSuccess, endSubmit
          c.result(submitError, submitResult);
        }
      }
    }, this.hookContext);

    // Call all hooks at once.
    // Pass both types of doc plus the doc attached to the form.
    // If any return false, we stop normal submission, but we don't
    // run onError, onSuccess, endSubmit hooks until they all call this.done().
    var shouldStop = false;
    _.each(hooks, function eachOnSubmit(hook) {
      var result = hook.call(ctx, c.insertDoc, c.updateDoc, c.currentDoc);
      if (shouldStop === false && result === false) {
        shouldStop = true;
      }
    });
    if (shouldStop) {
      this.event.preventDefault();
      this.event.stopPropagation();
    }
  },
  needsModifierAndDoc: true,
  validateForm: function () {
    // Get SimpleSchema
    var ss = AutoForm.getFormSchema(this.form.id);
    // Validate
    return AutoForm._validateFormDoc(this.formDoc.insertDoc, false, this.form.id, ss, this.form);
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/readonly.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

AutoForm.addFormType('readonly', {
  onSubmit: function () {
    // Prevent browser form submission
    this.event.preventDefault();
    // Nothing else
  },
  validateForm: function () {
    // Always valid
    return true;
  },
  adjustInputContext: function (ctx) {
    ctx.atts.readonly = "";
    return ctx;
  },
  hideArrayItemButtons: true
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/formTypes/disabled.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

AutoForm.addFormType('disabled', {
  onSubmit: function () {
    // Prevent browser form submission
    this.event.preventDefault();
    // Nothing else
  },
  validateForm: function () {
    // Always valid
    return true;
  },
  adjustInputContext: function (ctx) {
    ctx.atts.disabled = "";
    return ctx;
  },
  hideArrayItemButtons: true
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/value-converters.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*
 * The conversion functions in this file can be used by input types to convert their outgoing values into the data type expected by the schema
 */

AutoForm.valueConverters = {
  booleanToString: function booleanToString(val) {
    if (val === true) {
      return "TRUE";
    } else if (val === false) {
      return "FALSE";
    }
    return val;
  },
  booleanToStringArray: function booleanToStringArray(val) {
    if (val === true) {
      return ["TRUE"];
    } else if (val === false) {
      return ["FALSE"];
    }
    return val;
  },
  booleanToNumber: function booleanToNumber(val) {
    if (val === true) {
      return 1;
    } else if (val === false) {
      return 0;
    }
    return val;
  },
  booleanToNumberArray: function booleanToNumberArray(val) {
    if (val === true) {
      return [1];
    } else if (val === false) {
      return [0];
    }
    return val;
  },
  /**
   * @method  AutoForm.valueConverters.dateToDateString
   * @private
   * @param  {Date} date
   * @return {String}
   *
   * Returns a "valid date string" representing the local date.
   */
  dateToDateString: function dateToDateString(val) {
    return (val instanceof Date) ? moment(val).format("YYYY-MM-DD") : val;
  },
  /**
   * @method  AutoForm.valueConverters.dateToDateStringUTC
   * @private
   * @param  {Date} date
   * @return {String}
   *
   * Returns a "valid date string" representing the date converted to the UTC time zone.
   */
  dateToDateStringUTC: function dateToDateStringUTC(val) {
    return (val instanceof Date) ? moment.utc(val).format("YYYY-MM-DD") : val;
  },
  dateToDateStringUTCArray: function dateToDateStringUTCArray(val) {
    if (val instanceof Date) {
      return [AutoForm.valueConverters.dateToDateStringUTC(val)];
    }
    return val;
  },
  /**
   * @method  AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString
   * @private
   * @param  {Date} date
   * @return {String}
   *
   * Returns a "valid normalized forced-UTC global date and time string" representing the time
   * converted to the UTC time zone and expressed as the shortest possible string for the given
   * time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute).
   *
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#date-and-time-state-(type=datetime)
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-normalized-forced-utc-global-date-and-time-string
   */
  dateToNormalizedForcedUtcGlobalDateAndTimeString: function dateToNormalizedForcedUtcGlobalDateAndTimeString(val) {
    return (val instanceof Date) ? moment(val).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") : val;
  },
  dateToNormalizedForcedUtcGlobalDateAndTimeStringArray: function dateToNormalizedForcedUtcGlobalDateAndTimeStringArray(val) {
    if (val instanceof Date) {
      return [AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString(val)];
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString
   * @private
   * @param {Date} date The Date object
   * @param {String} [timezoneId] A valid timezoneId that moment-timezone understands, e.g., "America/Los_Angeles"
   * @return {String}
   *
   * Returns a "valid normalized local date and time string".
   */
  dateToNormalizedLocalDateAndTimeString: function dateToNormalizedLocalDateAndTimeString(date, timezoneId) {
    var m = moment(date);
    // by default, we assume local timezone; add moment-timezone to app and pass timezoneId
    // to use a different timezone
    if (typeof timezoneId === "string") {
      if (typeof m.tz !== "function") {
        throw new Error("If you specify a timezoneId, make sure that you've added a moment-timezone package to your app");
      }
      m.tz(timezoneId);
    }
    return m.format("YYYY-MM-DD[T]HH:mm:ss.SSS");
  },
  dateToNumber: function dateToNumber(val) {
    return (val instanceof Date) ? val.getTime() : val;
  },
  dateToNumberArray: function dateToNumberArray(val) {
    if (val instanceof Date) {
      return [val.getTime()];
    }
    return val;
  },
  dateToDateArray: function dateToDateArray(val) {
    if (val instanceof Date) {
      return [val];
    }
    return val;
  },
  stringToStringArray: function stringToStringArray(val) {
    if (typeof val === "string") {
      val = val.split(",");
      return _.map(val, function (item) {
        return $.trim(item);
      });
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.stringToNumber
   * @public
   * @param {String} val A string or null or undefined.
   * @return {Number|String} The string converted to a Number or the original value.
   *
   * For strings, returns Number(val) unless the result is NaN. Otherwise returns val.
   */
  stringToNumber: function stringToNumber(val) {
    if (typeof val === "string" && val.length > 0) {
      var numVal = Number(val);
      if (!isNaN(numVal)) {
        return numVal;
      }
    }
    return val;
  },
  stringToNumberArray: function stringToNumberArray(val) {
    if (typeof val === "string") {
      val = val.split(",");
      return _.map(val, function (item) {
        item = $.trim(item);
        return AutoForm.valueConverters.stringToNumber(item);
      });
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.stringToBoolean
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Boolean|String} The string converted to a Boolean.
   *
   * If the string is "true" or "1", returns `true`. If the string is "false" or "0", returns `false`. Otherwise returns the original string.
   */
  stringToBoolean: function stringToBoolean(val) {
    if (typeof val === "string" && val.length > 0) {
      var lval = val.toLowerCase();
      if (lval === "true" || lval === "1") {
        return true;
      } else if (lval === "false" || lval === "0") {
        return false;
      }
    }
    return val;
  },
  stringToBooleanArray: function stringToBooleanArray(val) {
    if (typeof val === "string") {
      val = val.split(",");
      return _.map(val, function (item) {
        item = $.trim(item);
        return AutoForm.valueConverters.stringToBoolean(item);
      });
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.stringToDate
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Date|String} The string converted to a Date instance.
   *
   * Returns new Date(val) as long as val is a string with at least one character. Otherwise returns the original string.
   */
  stringToDate: function stringToDate(val) {
    if (typeof val === "string" && val.length > 0) {
      return new Date(val);
    }
    return val;
  },
  stringToDateArray: function stringToDateArray(val) {
    if (typeof val === "string") {
      val = val.split(",");
      return _.map(val, function (item) {
        item = $.trim(item);
        return AutoForm.valueConverters.stringToDate(item);
      });
    }
    return val;
  },
  numberToString: function numberToString(val) {
    if (typeof val === "number") {
      return val.toString();
    }
    return val;
  },
  numberToStringArray: function numberToStringArray(val) {
    if (typeof val === "number") {
      return [val.toString()];
    }
    return val;
  },
  numberToNumberArray: function numberToNumberArray(val) {
    if (typeof val === "number") {
      return [val];
    }
    return val;
  },
  numberToBoolean: function numberToBoolean(val) {
    if (val === 0) {
      return false;
    } else if (val === 1) {
      return true;
    }
    return val;
  },
  numberToBooleanArray: function numberToBooleanArray(val) {
    if (val === 0) {
      return [false];
    } else if (val === 1) {
      return [true];
    }
    return val;
  }
};

// BACKWARDS COMPATIBILITY - some of these were formerly on the Utility object
Utility.dateToDateString = AutoForm.valueConverters.dateToDateString;
Utility.dateToDateStringUTC = AutoForm.valueConverters.dateToDateStringUTC;
Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString = AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString;
Utility.dateToNormalizedLocalDateAndTimeString = AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString;
Utility.stringToBool = AutoForm.valueConverters.stringToBoolean;
Utility.stringToNumber = AutoForm.valueConverters.stringToNumber;
Utility.stringToDate = AutoForm.valueConverters.stringToDate;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/boolean-checkbox/template.boolean-checkbox.js                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckbox");
Template["afCheckbox"] = new Template("Template.afCheckbox", (function() {
  var view = this;
  return HTML.DIV(HTML.LABEL(HTML.INPUT(HTML.Attrs({
    type: "checkbox",
    value: "true"
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  })), " ", Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  })));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/boolean-checkbox/boolean-checkbox.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("boolean-checkbox", {
  template: "afCheckbox",
  valueOut: function () {
    return !!this.is(":checked");
  },
  valueConverters: {
    "string": AutoForm.valueConverters.booleanToString,
    "stringArray": AutoForm.valueConverters.booleanToStringArray,
    "number": AutoForm.valueConverters.booleanToNumber,
    "numberArray": AutoForm.valueConverters.booleanToNumberArray
  },
  contextAdjust: function (context) {
    if (context.value === true) {
      context.atts.checked = "";
    }
    //don't add required attribute to checkboxes because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
    delete context.atts.required;
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/boolean-radios/template.boolean-radios.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afBooleanRadioGroup");
Template["afBooleanRadioGroup"] = new Template("Template.afBooleanRadioGroup", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", HTML.DIV("\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
    type: "radio",
    value: "false",
    name: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("falseAtts"));
  })), " ", Spacebars.With(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "falseLabel"));
  }, function() {
    return Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    });
  }, function() {
    return "False";
  })), "\n    "), "\n    ", HTML.DIV("\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
    type: "radio",
    value: "true",
    name: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("trueAtts"));
  })), " ", Spacebars.With(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "trueLabel"));
  }, function() {
    return Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    });
  }, function() {
    return "True";
  })), "\n    "), "\n    ", Blaze.If(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "nullLabel"));
  }, function() {
    return [ "\n    ", HTML.DIV("\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: "null",
      name: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("nullAtts"));
    })), " ", Blaze.View("lookup:..atts.nullLabel", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "nullLabel"));
    })), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/boolean-radios/boolean-radios.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("boolean-radios", {
  template: "afBooleanRadioGroup",
  valueOut: function () {
    if (this.find('input[value=false]').is(":checked")) {
      return false;
    } else if (this.find('input[value=true]').is(":checked")) {
      return true;
    } else if (this.find('input[value=null]').is(":checked")) {
      return null;
    }
  },
  valueConverters: {
    "string": AutoForm.valueConverters.booleanToString,
    "stringArray": AutoForm.valueConverters.booleanToStringArray,
    "number": AutoForm.valueConverters.booleanToNumber,
    "numberArray": AutoForm.valueConverters.booleanToNumberArray
  }
});

Template.afBooleanRadioGroup.helpers({
  falseAtts: function falseAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'data-schema-key');
    if (this.value === false) {
      atts.checked = "";
    }
    return atts;
  },
  trueAtts: function trueAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'data-schema-key');
    if (this.value === true) {
      atts.checked = "";
    }
    return atts;
  },
  nullAtts: function nullAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'data-schema-key');
    if (this.value !== true && this.value !== false) {
      atts.checked = "";
    }
    return atts;
  },
  dsk: function () {
    return {'data-schema-key': this.atts['data-schema-key']};
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/boolean-select/template.boolean-select.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afBooleanSelect");
Template["afBooleanSelect"] = new Template("Template.afBooleanSelect", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs(function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.OPTION(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
    }), Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    })), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/boolean-select/boolean-select.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("boolean-select", {
  template: "afBooleanSelect",
  valueOut: function () {
    var val = this.val();
    if (val === "true") {
      return true;
    } else if (val === "false") {
      return false;
    }
  },
  valueConverters: {
    "string": AutoForm.valueConverters.booleanToString,
    "stringArray": AutoForm.valueConverters.booleanToStringArray,
    "number": AutoForm.valueConverters.booleanToNumber,
    "numberArray": AutoForm.valueConverters.booleanToNumberArray
  },
  contextAdjust: function (context) {
    var atts = _.omit(context.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'firstOption');

    // build items list
    context.items = [
      {
        name: context.name,
        value: "",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "",
        selected: (context.value !== false && context.value !== true),
        label: context.atts.nullLabel || context.atts.firstOption || "(Select One)",
        atts: atts
      },
      {
        name: context.name,
        value: "false",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "false",
        selected: (context.value === false),
        label: context.atts.falseLabel || "False",
        atts: atts
      },
      {
        name: context.name,
        value: "true",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "true",
        selected: (context.value === true),
        label: context.atts.trueLabel || "True",
        atts: atts
      }
    ];

    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/button/template.button.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputButton");
Template["afInputButton"] = new Template("Template.afInputButton", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "button",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/button/button.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("button", {
  template: "afInputButton"
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/color/template.color.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputColor");
Template["afInputColor"] = new Template("Template.afInputColor", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "color",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/color/color.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("color", {
  template: "afInputColor"
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/contenteditable/template.contenteditable.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afContenteditable");
Template["afContenteditable"] = new Template("Template.afContenteditable", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    contenteditable: "true"
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/contenteditable/contenteditable.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("contenteditable", {
  template: "afContenteditable",
  valueOut: function () {
    return this.html();
  },
  contextAdjust: function (context) {
    if (typeof context.atts['data-maxlength'] === "undefined" && typeof context.max === "number") {
      context.atts['data-maxlength'] = context.max;
    }
    return context;
  }
});

Template.afContenteditable.events({
  'blur div[contenteditable=true]': function (event, template) {
    template.$(event.target).change();
  }
});

Template.afContenteditable.helpers({
  getValue: function (value) {
    if(Template.instance().view.isRendered){
      Template.instance().$('[contenteditable]').html(value);
    }
  }
});

Template.afContenteditable.onRendered(function () {
  var template = this;

  template.autorun(function () {
    var data = Template.currentData();
    template.$('[contenteditable]').html(data.value);
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/date/template.date.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDate");
Template["afInputDate"] = new Template("Template.afInputDate", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "date",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/date/date.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("date", {
  template: "afInputDate",
  valueIn: function (val) {
    //convert Date to string value
    return AutoForm.valueConverters.dateToDateStringUTC(val);
  },
  valueOut: function () {
    var val = this.val();
    if (AutoForm.Utility.isValidDateString(val)) {
      //Date constructor will interpret val as UTC and create
      //date at mignight in the morning of val date in UTC time zone
      return new Date(val);
    } else {
      return null;
    }
  },
  valueConverters: {
    "string": AutoForm.valueConverters.dateToDateStringUTC,
    "stringArray": AutoForm.valueConverters.dateToDateStringUTCArray,
    "number": AutoForm.valueConverters.dateToNumber,
    "numberArray": AutoForm.valueConverters.dateToNumberArray,
    "dateArray": AutoForm.valueConverters.dateToDateArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
      context.atts.max = AutoForm.valueConverters.dateToDateStringUTC(context.max);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = AutoForm.valueConverters.dateToDateStringUTC(context.min);
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/datetime/template.datetime.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDateTime");
Template["afInputDateTime"] = new Template("Template.afInputDateTime", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "datetime",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/datetime/datetime.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("datetime", {
  template: "afInputDateTime",
  valueIn: function (val) {
    //convert Date to string value
    return AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString(val);
  },
  valueOut: function () {
    var val = this.val();
    val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
    if (AutoForm.Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
      //Date constructor will interpret val as UTC due to ending "Z"
      return new Date(val);
    } else {
      return null;
    }
  },
  valueConverters: {
    "string": AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString,
    "stringArray": AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeStringArray,
    "number": AutoForm.valueConverters.dateToNumber,
    "numberArray": AutoForm.valueConverters.dateToNumberArray,
    "dateArray": AutoForm.valueConverters.dateToDateArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
      context.atts.max = AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.max);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.min);
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/datetime-local/template.datetime-local.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDateTimeLocal");
Template["afInputDateTimeLocal"] = new Template("Template.afInputDateTimeLocal", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "datetime-local",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/datetime-local/datetime-local.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("datetime-local", {
  template: "afInputDateTimeLocal",
  valueIn: function (val, atts) {
    //convert Date to string value
    return (val instanceof Date) ? AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(val, atts.timezoneId) : val;
  },
  valueOut: function () {
    var val = this.val();
    val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
    if (AutoForm.Utility.isValidNormalizedLocalDateAndTimeString(val)) {
      var timezoneId = this.attr("data-timezone-id");
      // default is local, but if there's a timezoneId, we use that
      if (typeof timezoneId === "string") {
        if (typeof moment.tz !== "function") {
          throw new Error("If you specify a timezoneId, make sure that you've added a moment-timezone package to your app");
        }
        return moment.tz(val, timezoneId).toDate();
      } else {
        return moment(val).toDate();
      }
    } else {
      return this.val();
    }
  },
  valueConverters: {
    "string": function dateToNormalizedLocalDateAndTimeString(val) {
      return (val instanceof Date) ? AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(val, this.attr("data-timezone-id")) : val;
    },
    "stringArray": function dateToNormalizedLocalDateAndTimeStringArray(val) {
      if (val instanceof Date) {
        return [AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(val, this.attr("data-timezone-id"))];
      }
      return val;
    },
    "number": AutoForm.valueConverters.dateToNumber,
    "numberArray": AutoForm.valueConverters.dateToNumberArray,
    "dateArray": AutoForm.valueConverters.dateToDateArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
      context.atts.max = AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(context.max, context.atts.timezoneId);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(context.min, context.atts.timezoneId);
    }
    if (context.atts.timezoneId) {
      context.atts["data-timezone-id"] = context.atts.timezoneId;
    }
    delete context.atts.timezoneId;
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/email/template.email.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputEmail");
Template["afInputEmail"] = new Template("Template.afInputEmail", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "email",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/email/email.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("email", {
  template: "afInputEmail",
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/file/template.file.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputFile");
Template["afInputFile"] = new Template("Template.afInputFile", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "file",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/file/file.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("file", {
  template: "afInputFile"
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/hidden/template.hidden.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputHidden");
Template["afInputHidden"] = new Template("Template.afInputHidden", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "hidden",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/hidden/hidden.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("hidden", {
  template: "afInputHidden",
  isHidden: true,
  valueOut: function () {
    return this.val();
  },
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray,
    "number": AutoForm.valueConverters.stringToNumber,
    "numberArray": AutoForm.valueConverters.stringToNumberArray,
    "boolean": AutoForm.valueConverters.stringToBoolean,
    "booleanArray": AutoForm.valueConverters.stringToBooleanArray,
    "date": AutoForm.valueConverters.stringToDate,
    "dateArray": AutoForm.valueConverters.stringToDateArray
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/image/template.image.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputImage");
Template["afInputImage"] = new Template("Template.afInputImage", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "image",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/image/image.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("image", {
  template: "afInputImage"
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/month/template.month.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputMonth");
Template["afInputMonth"] = new Template("Template.afInputMonth", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "month",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/month/month.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("month", {
  template: "afInputMonth",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/number/template.number.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputNumber");
Template["afInputNumber"] = new Template("Template.afInputNumber", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "number",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/number/number.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("number", {
  template: "afInputNumber",
  valueOut: function () {
    return AutoForm.valueConverters.stringToNumber(this.val());
  },
  valueConverters: {
    "string": AutoForm.valueConverters.numberToString,
    "stringArray": AutoForm.valueConverters.numberToStringArray,
    "numberArray": AutoForm.valueConverters.numberToNumberArray,
    "boolean": AutoForm.valueConverters.numberToBoolean,
    "booleanArray": AutoForm.valueConverters.numberToBooleanArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && typeof context.max === "number") {
      context.atts.max = context.max;
    }
    if (typeof context.atts.min === "undefined" && typeof context.min === "number") {
      context.atts.min = context.min;
    }
    if (typeof context.atts.step === "undefined" && context.decimal) {
      context.atts.step = '0.01';
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/password/template.password.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputPassword");
Template["afInputPassword"] = new Template("Template.afInputPassword", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "password",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/password/password.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("password", {
  template: "afInputPassword",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/radio/template.radio.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadio");
Template["afRadio"] = new Template("Template.afRadio", (function() {
  var view = this;
  return HTML.DIV(HTML.LABEL(HTML.INPUT(HTML.Attrs({
    type: "checkbox",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  })), " ", Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  })));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/radio/radio.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("radio", {
  template: "afRadio",
  valueOut: function () {
    if (this.is(":checked")) {
      return this.val();
    }
  },
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  }
});

Template["afRadio"].helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/range/template.range.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputRange");
Template["afInputRange"] = new Template("Template.afInputRange", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "range",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/range/range.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("range", {
  template: "afInputRange",
  valueOut: function () {
    return AutoForm.valueConverters.stringToNumber(this.val());
  },
  valueConverters: {
    "string": AutoForm.valueConverters.numberToString,
    "stringArray": AutoForm.valueConverters.numberToStringArray,
    "numberArray": AutoForm.valueConverters.numberToNumberArray,
    "boolean": AutoForm.valueConverters.numberToBoolean,
    "booleanArray": AutoForm.valueConverters.numberToBooleanArray
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/reset/template.reset.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputReset");
Template["afInputReset"] = new Template("Template.afInputReset", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "reset",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/reset/reset.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("reset", {
  template: "afInputReset"
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/search/template.search.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputSearch");
Template["afInputSearch"] = new Template("Template.afInputSearch", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "search",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/search/search.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("search", {
  template: "afInputSearch",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select/template.select.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afSelect");
Template["afSelect"] = new Template("Template.afSelect", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs(function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "optgroup"));
    }, function() {
      return [ "\n        ", HTML.OPTGROUP({
        label: function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "optgroup"));
        }
      }, "\n        ", Blaze.Each(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
      }, function() {
        return [ "\n        ", HTML.OPTION(HTML.Attrs(function() {
          return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
        }), Blaze.View("lookup:..label", function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
        })), "\n        " ];
      }), "\n        "), "\n      " ];
    }, function() {
      return [ "\n        ", HTML.OPTION(HTML.Attrs(function() {
        return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
      }), Blaze.View("lookup:..label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
      })), "\n      " ];
    }), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select/select.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select", {
  template: "afSelect",
  valueOut: function () {
    return this.val();
  },
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray,
    "number": AutoForm.valueConverters.stringToNumber,
    "numberArray": AutoForm.valueConverters.stringToNumberArray,
    "boolean": AutoForm.valueConverters.stringToBoolean,
    "booleanArray": AutoForm.valueConverters.stringToBooleanArray,
    "date": AutoForm.valueConverters.stringToDate,
    "dateArray": AutoForm.valueConverters.stringToDateArray
  },
  contextAdjust: function (context) {
    //can fix issues with some browsers selecting the firstOption instead of the selected option
    context.atts.autocomplete = "off";

    var itemAtts = _.omit(context.atts, 'firstOption');
    var firstOption = context.atts.firstOption;

    // build items list
    context.items = [];

    // If a firstOption was provided, add that to the items list first
    if (firstOption !== false) {
      context.items.push({
        name: context.name,
        label: (typeof firstOption === "string" ? firstOption : "(Select One)"),
        value: "",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        //
        // Setting this to an empty string caused problems if option with value
        // 1 was in the options list because Spacebars evaluates "" to 1 and
        // considers that a duplicate.
        // See https://github.com/aldeed/meteor-autoform/issues/656
        _id: "AUTOFORM_EMPTY_FIRST_OPTION",
        selected: false,
        atts: itemAtts
      });
    }

    // Add all defined options
    _.each(context.selectOptions, function(opt) {
      if (opt.optgroup) {
        var subItems = _.map(opt.options, function(subOpt) {
          return {
            name: context.name,
            label: subOpt.label,
            value: subOpt.value,
            htmlAtts: _.omit(subOpt, 'label', 'value'),
            // _id must be included because it is a special property that
            // #each uses to track unique list items when adding and removing them
            // See https://github.com/meteor/meteor/issues/2174
            //
            // The toString() is necessary because otherwise Spacebars evaluates
            // any string to 1 if the other values are numbers, and then considers
            // that a duplicate.
            // See https://github.com/aldeed/meteor-autoform/issues/656
            _id: subOpt.value.toString(),
            selected: (subOpt.value === context.value),
            atts: itemAtts
          };
        });
        context.items.push({
          optgroup: opt.optgroup,
          items: subItems
        });
      } else {
        context.items.push({
          name: context.name,
          label: opt.label,
          value: opt.value,
          htmlAtts: _.omit(opt, 'label', 'value'),
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          //
          // The toString() is necessary because otherwise Spacebars evaluates
          // any string to 1 if the other values are numbers, and then considers
          // that a duplicate.
          // See https://github.com/aldeed/meteor-autoform/issues/656
          _id: opt.value.toString(),
          selected: (opt.value === context.value),
          atts: itemAtts
        });
      }
    });

    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-checkbox/template.select-checkbox.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckboxGroup");
Template["afCheckboxGroup"] = new Template("Template.afCheckboxGroup", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-checkbox-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", HTML.DIV(HTML.LABEL(HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), " ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    }))), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-checkbox/select-checkbox.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select-checkbox", {
  template: "afCheckboxGroup",
  valueIsArray: true,
  valueOut: function () {
    var val = [];
    this.find('input[type=checkbox]').each(function () {
      if ($(this).is(":checked")) {
        val.push($(this).val());
      }
    });
    return val;
  },
  contextAdjust: function (context) {
    var itemAtts = _.omit(context.atts);

    // build items list
    context.items = [];

    // Add all defined options
    _.each(context.selectOptions, function(opt) {
      context.items.push({
        name: context.name,
        label: opt.label,
        value: opt.value,
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: opt.value,
        selected: (_.contains(context.value, opt.value)),
        atts: itemAtts
      });
    });

    return context;
  }
});

Template.afCheckboxGroup.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    }
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-checkbox-inline/template.select-checkbox-inline.js                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckboxGroupInline");
Template["afCheckboxGroupInline"] = new Template("Template.afCheckboxGroupInline", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-checkbox-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), " ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    })), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-checkbox-inline/select-checkbox-inline.js                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select-checkbox-inline", {
  template: "afCheckboxGroupInline",
  valueIsArray: true,
  valueOut: function () {
    var val = [];
    this.find('input[type=checkbox]').each(function () {
      if ($(this).is(":checked")) {
        val.push($(this).val());
      }
    });
    return val;
  },
  contextAdjust: function (context) {
    var itemAtts = _.omit(context.atts);

    // build items list
    context.items = [];

    // Add all defined options
    _.each(context.selectOptions, function(opt) {
      context.items.push({
        name: context.name,
        label: opt.label,
        value: opt.value,
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: opt.value,
        selected: (_.contains(context.value, opt.value)),
        atts: itemAtts
      });
    });

    return context;
  }
});

Template.afCheckboxGroupInline.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-multiple/template.select-multiple.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afSelectMultiple");
Template["afSelectMultiple"] = new Template("Template.afSelectMultiple", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs({
    multiple: ""
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "optgroup"));
    }, function() {
      return [ "\n        ", HTML.OPTGROUP({
        label: function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "optgroup"));
        }
      }, "\n        ", Blaze.Each(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
      }, function() {
        return [ "\n        ", HTML.OPTION(HTML.Attrs(function() {
          return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
        }), Blaze.View("lookup:..label", function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
        })), "\n        " ];
      }), "\n        "), "\n      " ];
    }, function() {
      return [ "\n        ", HTML.OPTION(HTML.Attrs(function() {
        return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
      }), Blaze.View("lookup:..label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
      })), "\n      " ];
    }), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-multiple/select-multiple.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select-multiple", {
  template: "afSelectMultiple",
  valueIsArray: true,
  valueOut: function () {
    return AutoForm.Utility.getSelectValues(this[0]);
  },
  contextAdjust: function (context) {
    // build items list
    context.items = _.map(context.selectOptions, function(opt) {
      if (opt.optgroup) {
        var subItems = _.map(opt.options, function(subOpt) {
          return {
            name: context.name,
            label: subOpt.label,
            value: subOpt.value,
            htmlAtts: _.omit(subOpt, 'label', 'value'),
            // _id must be included because it is a special property that
            // #each uses to track unique list items when adding and removing them
            // See https://github.com/meteor/meteor/issues/2174
            _id: subOpt.value,
            selected: _.contains(context.value, subOpt.value),
            atts: context.atts
          };
        });
        return {
          optgroup: opt.optgroup,
          items: subItems
        };
      } else {
        return {
          name: context.name,
          label: opt.label,
          value: opt.value,
          htmlAtts: _.omit(opt, 'label', 'value'),
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: opt.value,
          selected: _.contains(context.value, opt.value),
          atts: context.atts
        };
      }
    });

    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-radio/template.select-radio.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadioGroup");
Template["afRadioGroup"] = new Template("Template.afRadioGroup", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-radio-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n  ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.DIV(HTML.LABEL(HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), " ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    }))), "\n  " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-radio/select-radio.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select-radio", {
  template: "afRadioGroup",
  valueOut: function () {
    return this.find('input[type=radio]:checked').val();
  },
  contextAdjust: function (context) {
    var itemAtts = _.omit(context.atts);

    // build items list
    context.items = [];

    // Add all defined options
    _.each(context.selectOptions, function(opt) {
      context.items.push({
        name: context.name,
        label: opt.label,
        value: opt.value,
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: opt.value,
        selected: (opt.value === context.value),
        atts: itemAtts
      });
    });

    return context;
  }
});

Template.afRadioGroup.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-radio-inline/template.select-radio-inline.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadioGroupInline");
Template["afRadioGroupInline"] = new Template("Template.afRadioGroupInline", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-radio-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n  ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), " ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    })), "\n  " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/select-radio-inline/select-radio-inline.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select-radio-inline", {
  template: "afRadioGroupInline",
  valueOut: function () {
    return this.find('input[type=radio]:checked').val();
  },
  contextAdjust: function (context) {
    var itemAtts = _.omit(context.atts);

    // build items list
    context.items = [];

    // Add all defined options
    _.each(context.selectOptions, function(opt) {
      context.items.push({
        name: context.name,
        label: opt.label,
        value: opt.value,
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: opt.value,
        selected: (opt.value === context.value),
        atts: itemAtts
      });
    });

    return context;
  }
});

Template.afRadioGroupInline.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/submit/template.submit.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputSubmit");
Template["afInputSubmit"] = new Template("Template.afInputSubmit", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "submit",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/submit/submit.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("submit", {
  template: "afInputSubmit"
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/tel/template.tel.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputTel");
Template["afInputTel"] = new Template("Template.afInputTel", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "tel",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/tel/tel.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("tel", {
  template: "afInputTel",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/text/template.text.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputText");
Template["afInputText"] = new Template("Template.afInputText", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "text",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/text/text.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("text", {
  template: "afInputText",
  valueOut: function () {
    return this.val();
  },
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray,
    "number": AutoForm.valueConverters.stringToNumber,
    "numberArray": AutoForm.valueConverters.stringToNumberArray,
    "boolean": AutoForm.valueConverters.stringToBoolean,
    "booleanArray": AutoForm.valueConverters.stringToBooleanArray,
    "date": AutoForm.valueConverters.stringToDate,
    "dateArray": AutoForm.valueConverters.stringToDateArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/textarea/template.textarea.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afTextarea");
Template["afTextarea"] = new Template("Template.afTextarea", (function() {
  var view = this;
  return HTML.TEXTAREA(HTML.Attrs(function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }, {
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/textarea/textarea.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("textarea", {
  template: "afTextarea",
  valueConverters: {
    "stringArray": function (val) {
      if (typeof val === "string" && val.length > 0) {
        return linesToArray(val);
      }
      return val;
    },
    "number": AutoForm.valueConverters.stringToNumber,
    "numberArray": AutoForm.valueConverters.stringToNumberArray,
    "boolean": AutoForm.valueConverters.stringToBoolean,
    "booleanArray": function (val) {
      if (typeof val === "string" && val.length > 0) {
        var arr = linesToArray(val);
        return _.map(arr, function (item) {
          return AutoForm.valueConverters.stringToBoolean(item);
        });
      }
      return val;
    },
    "date": AutoForm.valueConverters.stringToDate,
    "dateArray": function (val) {
      if (typeof val === "string" && val.length > 0) {
        var arr = linesToArray(val);
        return _.map(arr, function (item) {
          return AutoForm.valueConverters.stringToDate(item);
        });
      }
      return val;
    }
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});

function linesToArray(text) {
  text = text.split('\n');
  var lines = [];
  _.each(text, function (line) {
    line = $.trim(line);
    if (line.length) {
      lines.push(line);
    }
  });
  return lines;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/time/template.time.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputTime");
Template["afInputTime"] = new Template("Template.afInputTime", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "time",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/time/time.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("time", {
  template: "afInputTime",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/url/template.url.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputUrl");
Template["afInputUrl"] = new Template("Template.afInputUrl", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "url",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/url/url.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("url", {
  template: "afInputUrl",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/week/template.week.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputWeek");
Template["afInputWeek"] = new Template("Template.afInputWeek", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "week",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/inputTypes/week/week.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("week", {
  template: "afInputWeek",
  valueConverters: {
    "stringArray": AutoForm.valueConverters.stringToStringArray
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/autoForm/template.autoForm.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("autoForm");
Template["autoForm"] = new Template("Template.autoForm", (function() {
  var view = this;
  return Blaze.Unless(function() {
    return Spacebars.dataMustache(view.lookup("afDestroyUpdateForm"), Spacebars.dot(view.lookup("."), "id"));
  }, function() {
    return [ "\n  \n  \n  ", HTML.FORM(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    }), "\n    ", Blaze._InOuterTemplateScope(view, function() {
      return Blaze._TemplateWith(function() {
        return Spacebars.call(view.lookup(".."));
      }, function() {
        return Spacebars.include(function() {
          return Spacebars.call(view.templateContentBlock);
        });
      });
    }), "\n  "), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/autoForm/autoForm.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, ReactiveVar, arrayTracker, Hooks, MongoObject, Utility, setDefaults */

Template.autoForm.helpers({
  atts: function autoFormTplAtts() {
    // After removing all of the props we know about, everything else should
    // become a form attribute unless it's an array or object.
    var val, htmlAttributes = {}, context = this;
    var removeProps = [
      "schema",
      "collection",
      "validation",
      "doc",
      "resetOnSuccess",
      "type",
      "template",
      "autosave",
      "autosaveOnKeyup",
      "meteormethod",
      "filter",
      "autoConvert",
      "removeEmptyStrings",
      "trimStrings"
    ];

    // Filter out any attributes that have a component prefix
    function hasComponentPrefix(prop) {
      return _.any(Utility.componentTypeList, function (componentType) {
        return prop.indexOf(componentType + '-') === 0;
      });
    }

    // Filter out arrays and objects, which are obviously not meant to be
    // HTML attributes.
    for (var prop in context) {
      if (context.hasOwnProperty(prop) &&
          !_.contains(removeProps, prop) &&
          !hasComponentPrefix(prop)) {
        val = context[prop];
        if (!_.isArray(val) && !_.isObject(val)) {
          htmlAttributes[prop] = val;
        }
      }
    }

    // By default, we add the `novalidate="novalidate"` attribute to our form,
    // unless the user passes `validation="browser"`.
    if (this.validation !== "browser" && !htmlAttributes.novalidate) {
      htmlAttributes.novalidate = "novalidate";
    }

    return htmlAttributes;
  },
  afDestroyUpdateForm: function (formId) {
    AutoForm._destroyForm[formId] = AutoForm._destroyForm[formId] || new ReactiveVar(false);
    return AutoForm._destroyForm[formId].get();
  }
});

Template.autoForm.created = function autoFormCreated() {
  var template = this;

  // We'll add tracker dependencies for reactive field values
  // to this object as necessary
  template.formValues = template.formValues || {};

  // We'll store "sticky" errors here. These are errors added
  // manually based on server validation, which we don't want to
  // be wiped out by further client validation.
  template._stickyErrors = {};

  template.autorun(function (c) {
    var data = Template.currentData(); // rerun when current data changes
    var formId = data.id;

    if (!formId) {
      throw new Error('Every autoForm and quickForm must have an "id" attribute set to a unique string.');
    }

    // When we change the form, loading a different doc, reloading the current doc, etc.,
    // we also want to reset the array counts for the form
    arrayTracker.resetForm(formId);

    data = setDefaults(data);

    // Clone the doc so that docToForm and other modifications do not change
    // the original referenced object.
    var doc = data.doc ? EJSON.clone(data.doc) : null;

    // Update cached form values for hot code reload persistence
    if (data.preserveForm === false) {
      AutoForm.formPreserve.unregisterForm(formId);
    } else {
      // Even if we have already registered, we reregister to ensure that the
      // closure values of template, formId, and ss remain correct after each
      // reaction
      AutoForm.formPreserve.registerForm(formId, function autoFormRegFormCallback() {
        return AutoForm.getFormValues(formId, template, data._resolvedSchema, false);
      });
    }

    // Retain doc values after a "hot code push", if possible
    if (c.firstRun) {
      var retrievedDoc = AutoForm.formPreserve.getDocument(formId);
      if (retrievedDoc !== false) {
        // Ensure we keep the _id property which may not be present in retrievedDoc.
        doc = _.extend(doc || {}, retrievedDoc || {});
      }
    }

    var mDoc;
    if (doc && !_.isEmpty(doc)) {
      var hookCtx = {formId: formId};
      // Pass doc through docToForm hooks
      _.each(Hooks.getHooks(formId, 'docToForm'), function autoFormEachDocToForm(hook) {
        doc = hook.call(hookCtx, doc, data._resolvedSchema);
        if (!doc) {
          throw new Error('Oops! Did you forget to return the modified document from your docToForm hook for the ' + formId + ' form?');
        }
      });

      // Create a "flat doc" that can be used to easily get values for corresponding
      // form fields.
      mDoc = new MongoObject(doc);
      AutoForm.reactiveFormData.sourceDoc(formId, mDoc);
    } else {
      AutoForm.reactiveFormData.sourceDoc(formId, null);
    }
  });
};

Template.autoForm.rendered = function autoFormRendered() {
  var lastId;
  this.autorun(function () {
    var data = Template.currentData(); // rerun when current data changes

    if (data.id === lastId) return;
    lastId = data.id;

    AutoForm.triggerFormRenderedDestroyedReruns(data.id);
  });
};

Template.autoForm.destroyed = function autoFormDestroyed() {
  var self = this;
  var formId = self.data.id;

  // TODO if formId was changing reactively during life of instance,
  // some data won't be removed by the calls below.

  // Remove from array fields list
  arrayTracker.untrackForm(formId);

  // Unregister form preservation
  AutoForm.formPreserve.unregisterForm(formId);

  // Trigger value reruns
  AutoForm.triggerFormRenderedDestroyedReruns(formId);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/quickForm/template.quickForm.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm");
Template["quickForm"] = new Template("Template.quickForm", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      template: Spacebars.call(view.lookup("getTemplateName")),
      data: Spacebars.call(view.lookup("innerContext"))
    };
  }, function() {
    return Spacebars.include(function() {
      return Spacebars.call(Template.__dynamic);
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/quickForm/quickForm.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template.quickForm.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('quickForm', this.template);
  },
  innerContext: function quickFormContext() {
    var atts = this;
    var adjustedData = AutoForm.parseData(_.clone(this));
    var simpleSchema = adjustedData._resolvedSchema;
    var sortedSchema = {};
    var fieldGroups = [];
    var grouplessFieldContext;

    // --------------- A. Schema --------------- //

    var fieldList = atts.fields;
    if (fieldList) {
      fieldList = AutoForm.Utility.stringToArray(fieldList, 'AutoForm: fields attribute must be an array or a string containing a comma-delimited list of fields');

      // get the schema object, but sorted into the same order as the field list
      fieldList.forEach(function (fieldName) {
        sortedSchema[fieldName] = simpleSchema.schema(fieldName);
      });
    } else {
      sortedSchema = simpleSchema.schema();
    }

    // --------------- B. Field With No Groups --------------- //

    var grouplessFields = getFieldsWithNoGroup(sortedSchema);
    if (grouplessFields.length > 0) {
      grouplessFieldContext = {
        atts: _.extend({}, atts, {fields: grouplessFields}),
        fields: grouplessFields
      };
    }

    // --------------- C. Field With Groups --------------- //

    // get sorted list of field groups
    var fieldGroupNames = getSortedFieldGroupNames(sortedSchema);

    // Loop through the list and make a field group context for each
    _.each(fieldGroupNames, function (fieldGroupName) {
      var fieldsForGroup = getFieldsForGroup(fieldGroupName, sortedSchema);

      if (fieldsForGroup.length > 0) {
        fieldGroups.push({
          name: fieldGroupName,
          atts: _.extend({}, atts, {fields: fieldsForGroup}),
          fields: fieldsForGroup
        });
      }
    });

    // --------------- D. Context --------------- //

    // Pass along quickForm context to autoForm context, minus a few
    // properties that are specific to quickForms.
    var qfAutoFormContext = _.omit(atts,
                                   'buttonContent',
                                   'buttonClasses',
                                   'fields',
                                   'omitFields',
                                   'id-prefix');

    // Determine whether we want to render a submit button
    var qfShouldRenderButton = (atts.buttonContent !== false && atts.type !== 'readonly' && atts.type !== 'disabled');

    var context = {
      qfAutoFormContext: qfAutoFormContext,
      atts: atts,
      qfShouldRenderButton: qfShouldRenderButton,
      fieldGroups: fieldGroups,
      grouplessFields: grouplessFieldContext
    };
    return context;
  }
});

/* Private Functions */

/**
 * Takes a schema object and returns a sorted array of field group names for it
 *
 * @param   {Object}   schemaObj Like from mySimpleSchema.schema()
 * @returns {String[]} Array of field group names
 */
function getSortedFieldGroupNames(schemaObj) {
  var names = _.map(schemaObj, function (field) {
    return field.autoform && field.autoform.group;
  });

  // Remove undefined
  names = _.compact(names);

  // Remove duplicate names
  names = _.unique(names);

  return names.sort();
}

/**
 * Returns the schema field names that belong in the group.
 *
 * @param   {String}   groupName The group name
 * @param   {Object}   schemaObj Like from mySimpleSchema.schema()
 * @returns {String[]} Array of field names (schema keys)
 */
function getFieldsForGroup(groupName, schemaObj) {
  var fields = _.map(schemaObj, function (field, fieldName) {
    return (fieldName.slice(-2) !== '.$') &&
      field.autoform &&
      field.autoform.group === groupName &&
      fieldName;
  });

  // Remove undefined
  fields = _.compact(fields);

  return fields;
}

/**
 * Returns the schema field names that don't belong to a group
 *
 * @param   {Object}   schemaObj Like from mySimpleSchema.schema()
 * @returns {String[]} Array of field names (schema keys)
 */
function getFieldsWithNoGroup(schemaObj) {
  var fields = _.map(schemaObj, function (field, fieldName) {
    return (fieldName.slice(-2) !== '.$') &&
      (!field.autoform || !field.autoform.group) &&
      fieldName;
  });

  // Remove undefined
  fields = _.compact(fields);

  return fields;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afArrayField/template.afArrayField.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afArrayField");
Template["afArrayField"] = new Template("Template.afArrayField", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      template: Spacebars.call(view.lookup("getTemplateName")),
      data: Spacebars.call(view.lookup("innerContext"))
    };
  }, function() {
    return Spacebars.include(function() {
      return Spacebars.call(Template.__dynamic);
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afArrayField/afArrayField.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, arrayTracker */

Template.afArrayField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afArrayField', this.template, this.name);
  },
  innerContext: function afArrayFieldContext() {
    var c = AutoForm.Utility.getComponentContext(this, "afArrayField");
    var name = c.atts.name;
    var fieldMinCount = c.atts.minCount || 0;
    var fieldMaxCount = c.atts.maxCount || Infinity;
    var ss = AutoForm.getFormSchema();
    var formId = AutoForm.getFormId();

    // Init the array tracking for this field
    var docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount);

    return {
      atts: c.atts
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afEachArrayItem/template.afEachArrayItem.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afEachArrayItem");
Template["afEachArrayItem"] = new Template("Template.afEachArrayItem", (function() {
  var view = this;
  return [ "\n  ", Spacebars.With(function() {
    return Spacebars.call(view.lookup("innerContext"));
  }, function() {
    return [ "\n    ", Blaze.Each(function() {
      return Spacebars.call(view.lookup("."));
    }, function() {
      return [ "\n    ", Blaze.If(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "removed"));
      }, function() {
        return [ "\n    ", HTML.INPUT({
          type: "hidden",
          name: function() {
            return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
          },
          "data-schema-key": function() {
            return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
          },
          "data-null-value": "true",
          value: ""
        }), "\n    " ];
      }, function() {
        return [ "\n    ", Blaze._InOuterTemplateScope(view, function() {
          return Blaze._TemplateWith(function() {
            return Spacebars.call(view.lookup("."));
          }, function() {
            return Spacebars.include(function() {
              return Spacebars.call(view.templateContentBlock);
            });
          });
        }), "\n    " ];
      }), "\n    " ];
    }), "\n  " ];
  }) ];
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afEachArrayItem/afEachArrayItem.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, arrayTracker */

Template.afEachArrayItem.helpers({
  innerContext: function afEachArrayItemContext() {
    var c = AutoForm.Utility.getComponentContext(this, "afEachArrayItem");
    var formId = AutoForm.getFormId();
    var ss = AutoForm.getFormSchema();
    var name = c.atts.name;

    var docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, c.atts.minCount, c.atts.maxCount);
    
    return arrayTracker.getField(formId, name);
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afFieldInput/template.afFieldInput.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afFieldInput");
Template["afFieldInput"] = new Template("Template.afFieldInput", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      template: Spacebars.call(view.lookup("getTemplateName")),
      data: Spacebars.call(view.lookup("innerContext"))
    };
  }, function() {
    return Spacebars.include(function() {
      return Spacebars.call(Template.__dynamic);
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afFieldInput/afFieldInput.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, getInputValue, getInputData, updateTrackedFieldValue */

Template.afFieldInput.helpers({
  // similar to AutoForm.getTemplateName, but we have fewer layers of fallback, and we fall back
  // lastly to a template without an _ piece at the end
  getTemplateName: function getTemplateName() {
    var self = this;

    // Determine what `type` attribute should be if not set
    var inputType = AutoForm.getInputType(this);
    var componentDef = AutoForm._inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
    }

    var inputTemplateName = componentDef.template;
    var styleTemplateName = this.template;

    // We skip the check for existence here so that we can get the `_plain` string
    // even though they don't exist.
    var templateName = AutoForm.getTemplateName(inputTemplateName, styleTemplateName, self.name, true);

    // Special case: the built-in "plain" template uses the basic input templates for
    // everything, so if we found _plain, we use inputTemplateName instead
    if (templateName.indexOf('_plain') !== -1) {
      templateName = null;
    }

    // If no override templateName found, use the exact name from the input type definition
    if (!templateName || !Template[templateName]) {
      templateName = inputTemplateName;
    }

    return templateName;
  },
  innerContext: function afFieldInputContext() {
    var c = AutoForm.Utility.getComponentContext(this, "afFieldInput");
    var form = AutoForm.getCurrentDataForForm();
    var formId = form.id;
    var ss = AutoForm.getFormSchema();
    var defs = c.defs;

    // Get schema default value.
    // We must do this before adjusting defs for arrays.
    var schemaDefaultValue = defs.defaultValue;

    // Adjust for array fields if necessary
    if (defs.type === Array) {
      defs = ss.schema(c.atts.name + ".$");
    }

    // Determine what `type` attribute should be if not set
    var inputType = AutoForm.getInputType(this);
    var componentDef = AutoForm._inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
    }

    // Get reactive mDoc
    var mDoc = AutoForm.reactiveFormData.sourceDoc(formId);

    // Get input value
    var value = getInputValue(c.atts, c.atts.value, mDoc, schemaDefaultValue, c.atts.defaultValue, componentDef);

    // Mark field value as changed for reactive updates
    // We need to defer this until the element will be
    // added to the DOM. Otherwise, AutoForm.getFieldValue
    // will not pick up the new value when there are #if etc.
    // blocks involved.
    // See https://github.com/aldeed/meteor-autoform/issues/461
    var template = AutoForm.templateInstanceForForm();
    if (template.view.isRendered) {
      // No need to do this on first run because we'll rerun the value functions
      // once the form is rendered anyway
      updateTrackedFieldValue(template, c.atts.name);
    }

    // Build input data context
    var iData = getInputData(defs, c.atts, value, ss.label(c.atts.name), form.type);

    // Adjust and return context
    return (typeof componentDef.contextAdjust === "function") ? componentDef.contextAdjust(iData) : iData;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afFormGroup/template.afFormGroup.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afFormGroup");
Template["afFormGroup"] = new Template("Template.afFormGroup", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      template: Spacebars.call(view.lookup("getTemplateName")),
      data: Spacebars.call(view.lookup("innerContext"))
    };
  }, function() {
    return Spacebars.include(function() {
      return Spacebars.call(Template.__dynamic);
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afFormGroup/afFormGroup.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template.afFormGroup.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afFormGroup', this.template, this.name);
  },
  innerContext: function afFormGroupContext() {
    var c = AutoForm.Utility.getComponentContext(this, 'afFormGroup');
    var afFormGroupAtts = formGroupAtts(c.atts);
    var afFieldLabelAtts = formGroupLabelAtts(c.atts);
    var afFieldInputAtts = formGroupInputAtts(c.atts);

    // Construct an `id` attribute for the input, optionally
    // adding a user-provided prefix. Since id attribute is
    // supposed to be unique in the DOM and templates can be
    // included multiple times, it's best not to provide an `id`
    // and generate a random one here for accessibility reasons.
    var id = c.atts.id || Random.id();
    var idPrefix = c.atts['id-prefix'];
    if (idPrefix && idPrefix.length > 0) {
      id = idPrefix + '-' + id;
    }

    // Set the input's `id` attribute and the label's `for` attribute to
    // the same ID.
    // NOTE: `afFieldLabelAtts.for` causes exception in IE8
    afFieldLabelAtts['for'] = afFieldInputAtts.id = id;

    // Get the field's schema definition
    var fieldSchema = AutoForm.getSchemaForField(c.atts.name);

    return {
      skipLabel: (c.atts.label === false),
      afFormGroupClass: c.atts['formgroup-class'],
      afFormGroupAtts: afFormGroupAtts,
      afFieldLabelAtts: afFieldLabelAtts,
      afFieldInputAtts: afFieldInputAtts,
      name: c.atts.name,
      required: fieldSchema ? !fieldSchema.optional : false,
      labelText: (typeof c.atts.label === 'string') ? c.atts.label : null
    };
  }
});

/*
 * Private
 */

function formGroupAtts(atts) {
  // Separate formgroup options from input options; formgroup items begin with 'formgroup-'
  var labelAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (key.indexOf('formgroup-') === 0 && key != 'formgroup-class') {
      labelAtts[key.substring(10)] = val;
    }
  });
  return labelAtts;
}

function formGroupLabelAtts(atts) {
  // Separate label options from input options; label items begin with 'label-'
  var labelAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (key.indexOf('label-') === 0) {
      labelAtts[key.substring(6)] = val;
    }
  });
  return labelAtts;
}

function formGroupInputAtts(atts) {
  // Separate input options from label and formgroup options
  // We also don't want the 'label' option
  var inputAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (['id-prefix', 'id', 'label'].indexOf(key) === -1 && key.indexOf('label-') !== 0 && key.indexOf('formgroup-') !== 0) {
      inputAtts[key] = val;
    }
  });
  return inputAtts;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afObjectField/template.afObjectField.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afObjectField");
Template["afObjectField"] = new Template("Template.afObjectField", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      template: Spacebars.call(view.lookup("getTemplateName")),
      data: Spacebars.call(view.lookup("innerContext"))
    };
  }, function() {
    return Spacebars.include(function() {
      return Spacebars.call(Template.__dynamic);
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afObjectField/afObjectField.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template.afObjectField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afObjectField', this.template, this.name);
  },
  innerContext: function() {
    var c = AutoForm.Utility.getComponentContext(this, 'afObjectField');
    return _.extend({}, this, c.atts);
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afQuickField/template.afQuickField.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afQuickField");
Template["afQuickField"] = new Template("Template.afQuickField", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("isGroup"));
  }, function() {
    return [ "\n    ", Spacebars.include(view.lookupTemplate("afObjectField")), "\n  " ];
  }, function() {
    return [ "\n    ", Blaze.If(function() {
      return Spacebars.call(view.lookup("isFieldArray"));
    }, function() {
      return [ "\n      ", Spacebars.include(view.lookupTemplate("afArrayField")), "\n    " ];
    }, function() {
      return [ "\n      ", Blaze.If(function() {
        return Spacebars.call(view.lookup("isHiddenInput"));
      }, function() {
        return [ "\n        \n        ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("groupAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afFieldInput"));
        }), "\n      " ];
      }, function() {
        return [ "\n        ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("groupAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afFormGroup"));
        }), "\n      " ];
      }), "\n    " ];
    }), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afQuickField/afQuickField.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template.afQuickField.helpers({
  isGroup: function afQuickFieldIsGroup() {
    var c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    // Render a group of fields if we expect an Object and we don't have options
    // and we have not overridden the type
    return (c.defs.type === Object && !c.atts.options && !c.atts.type);
  },
  isFieldArray: function afQuickFieldIsFieldArray() {
    var c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    // Render an array of fields if we expect an Array and we don't have options
    // and we have not overridden the type
    return (c.defs.type === Array && !c.atts.options && !c.atts.type);
  },
  groupAtts: function afQuickFieldGroupAtts() {
    // afQuickField passes `fields` and `omitFields` on to `afObjectField`
    // and `afArrayField`, but not to `afFormGroup`
    return _.omit(this, 'fields', 'omitFields');
  },
  isHiddenInput: function afQuickFieldIsHiddenInput() {
    var c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    var inputType = c.atts.type;
    if (inputType) {
      var componentDef = AutoForm._inputTypeDefinitions[inputType];
      if (!componentDef) {
        throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
      }
      return componentDef.isHidden;
    }

    return false;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afQuickFields/template.afQuickFields.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afQuickFields");
Template["afQuickFields"] = new Template("Template.afQuickFields", (function() {
  var view = this;
  return Blaze.Each(function() {
    return Spacebars.dataMustache(view.lookup("afFieldNames"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n    ", Blaze._TemplateWith(function() {
      return Spacebars.call(view.lookup("quickFieldAtts"));
    }, function() {
      return Spacebars.include(view.lookupTemplate("afQuickField"));
    }), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/components/afQuickFields/afQuickFields.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template.afQuickFields.helpers({
  quickFieldAtts: function afQuickFieldsQuickFieldAtts() {
    var afQuickFieldsComponentAtts, defaultOptions, atts = {};

    // Get the attributes that were on the afQuickFields component
    afQuickFieldsComponentAtts = Template.parentData(1);
    // It's possible to call {{> afQuickFields}} with no attributes, in which case we
    // don't want the "attributes" because they're really just the parent context.
    if (!afQuickFieldsComponentAtts || afQuickFieldsComponentAtts.atts) {
      afQuickFieldsComponentAtts = {};
    }

    // Add default options from schema/allowed
    defaultOptions = AutoForm._getOptionsForField(this.name);
    if (defaultOptions) {
      atts.options = defaultOptions;
    }

    return _.extend(atts, afQuickFieldsComponentAtts, this);
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/autoform-events.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm, Hooks, validateField, updateTrackedFieldValue, arrayTracker, updateAllTrackedFieldValues, SimpleSchema */

// all form events handled here
var lastAutoSaveElement = null;
var lastKeyVal = null;

function beginSubmit(formId, template, hookContext) {
  if (!Utility.checkTemplate(template)) return;

  // Get user-defined hooks
  var hooks = Hooks.getHooks(formId, 'beginSubmit');
  if (hooks.length) {
    _.each(hooks, function beginSubmitHooks(hook) {
      hook.call(hookContext);
    });
  } else {
    // If there are no user-defined hooks, by default we disable the submit button during submission
    var submitButton = template.find("button[type=submit]") || template.find("input[type=submit]");
    if (submitButton) {
      submitButton.disabled = true;
    }
  }
}

function endSubmit(formId, template, hookContext) {
  if (!Utility.checkTemplate(template)) return;

  // Try to avoid incorrect reporting of which input caused autosave
  lastAutoSaveElement = null;
  // Get user-defined hooks
  var hooks = Hooks.getHooks(formId, 'endSubmit');
  if (hooks.length) {
    _.each(hooks, function endSubmitHooks(hook) {
      hook.call(hookContext);
    });
  } else {
    // If there are no user-defined hooks, by default we disable the submit button during submission
    var submitButton = template.find("button[type=submit]") || template.find("input[type=submit]");
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function adjustKeyForArrays(key) {
  var gKey = SimpleSchema._makeGeneric(key);
  if (gKey.slice(-2) === '.$' || gKey.indexOf('.$.') !== -1) {
    key = gKey.slice(0, gKey.indexOf('.$'));
  }
  return key;
}

/**
 * Returns `true` if the specified validation type should
 * be revalidated only when the form is already invalid.
 * @param {String} validationType The validation type string.
 */
function onlyIfAlreadyInvalid(validationType) {
  return validationType === 'submitThenKeyup' ||
    validationType === 'submitThenBlur';
}

/**
 * Given an element, returns the schema key for it, using the
 * `data-schema-key` attribute on the element or on the closest
 * element that has one.
 *
 * @param   {Element}          element The DOM element
 * @returns {String|undefined} The schema key
 */
function getKeyForElement(element) {
  var key = element.getAttribute("data-schema-key");
  if (!key) {
    key = $(element).closest('[data-schema-key]').attr("data-schema-key");
  }
  return key;
}

//throttle autosave, at most autosave every 500ms
var throttleAutosave = _.throttle(function(event) {
  lastAutoSaveElement = event.target;
  $(event.currentTarget).submit();
}, 500, {leading: false});

Template.autoForm.events({
  'submit form': function autoFormSubmitHandler(event, template) {
    var formDoc;
    // Gather necessary form info
    var formId = this.id;
    var form = AutoForm.getCurrentDataForForm(formId);
    var formType = form.type;
    // ss will be the schema for the `schema` attribute if present,
    // else the schema for the collection
    var ss = AutoForm.getFormSchema(formId);
    var collection = AutoForm.getFormCollection(formId);
    var ssIsOverride = !!(collection && form.schema);

    var currentDoc = form.doc;
    var docId = currentDoc ? currentDoc._id : null;
    var isValid;

    var validationOptions = {
      validationContext: formId,
      filter: form.filter,
      autoConvert: form.autoConvert,
      removeEmptyStrings: form.removeEmptyStrings,
      trimStrings: form.trimStrings
    };

    // Get the form type definition
    var ftd;
    try {
      ftd = Utility.getFormTypeDef(formType);
    } catch (err) {
      event.preventDefault();
      throw err;
    }

    // Gather hooks
    var onSuccessHooks = Hooks.getHooks(formId, 'onSuccess');
    var onErrorHooks = Hooks.getHooks(formId, 'onError');
    var beforeHooks = Hooks.getHooks(formId, 'before', formType);
    var afterHooks = Hooks.getHooks(formId, 'after', formType);

    // Prep context with which hooks are called
    var hookContext = {
      addStickyValidationError: function (key, type, value) {
        AutoForm.addStickyValidationError(formId, key, type, value);
      },
      autoSaveChangedElement: lastAutoSaveElement,
      collection: collection,
      currentDoc: currentDoc,
      docId: docId,
      event: event,
      formAttributes: form,
      formId: formId,
      formTypeDefinition: ftd,
      removeStickyValidationError: function (key) {
        AutoForm.removeStickyValidationError(formId, key);
      },
      resetForm: function () {
        AutoForm.resetForm(formId, template);
      },
      ss: ss,
      ssIsOverride: ssIsOverride,
      template: template,
      validationContext: AutoForm.getValidationContext(formId)
    };

    // Gather all form values
    if (ftd.needsModifierAndDoc) {
      formDoc = AutoForm.getFormValues(formId, template, ss);
      hookContext.updateDoc = formDoc.updateDoc;
      hookContext.insertDoc = formDoc.insertDoc;
    } else if (ftd.usesModifier) {
      formDoc = AutoForm.getFormValues(formId, template, ss, true);
      hookContext.updateDoc = formDoc;
    } else {
      formDoc = AutoForm.getFormValues(formId, template, ss, false);
      hookContext.insertDoc = formDoc;
    }

    // It is pretty unlikely since we are submitting it, but if
    // for some reason this form is not currently rendered, we exit.
    if (!formDoc) {
      event.preventDefault();
      return;
    }

    function endSubmission() {
      // Run endSubmit hooks (re-enabled submit button or form, etc.)
      endSubmit(formId, template, hookContext);
    }

    function failedValidation() {
      // add invalidKeys array as a property
      // of the Error object before we call
      // onError hooks
      var ec = ss.namedContext(formId);
      var ik = ec.invalidKeys(), error;
      if (ik) {
        if (ik.length) {
          // We add `message` prop to the invalidKeys.
          // Maybe SS pkg should just add that property back in?
          ik = _.map(ik, function (o) {
            return _.extend({message: ec.keyErrorMessage(o.name)}, o);
          });
          error = new Error(ik[0].message);
        } else {
          error = new Error('form failed validation');
        }
        error.invalidKeys = ik;
      } else {
        error = new Error('form failed validation');
      }
      _.each(onErrorHooks, function onErrorEach(hook) {
        hook.call(hookContext, 'pre-submit validation', error);
      });
      event.preventDefault();
      event.stopPropagation();
      endSubmission();
    }

    // Prep function that calls before hooks.
    function runBeforeHooks(doc, next) {
      // We call the hooks recursively, in order added,
      // passing the result of the first hook to the
      // second hook, etc.
      function runHook(i, doc) {
        var hook = beforeHooks[i];

        if (!hook) {
          // We've run all hooks; continue submission
          next(doc);
          return;
        }

        // Define a `result` function
        var cb = function (d) {
          // If the hook returns false, we cancel
          if (d === false) {
            endSubmission();
          } else if (!_.isObject(d)) {
            throw new Error("A 'before' hook must return an object");
          } else {
            runHook(i+1, d);
          }
        };

        // Add the `result` function to the before hook context
        var ctx = _.extend({
          result: _.once(cb)
        }, hookContext);

        var result = hook.call(ctx, doc);

        // If the hook returns undefined, we wait for it
        // to call this.result()
        if (result !== void 0) {
          ctx.result(result);
        }
      }

      runHook(0, doc);
    }

    // Prep function that calls after, onError, and onSuccess hooks.
    // Also resets the form on success.
    function resultCallback(error, result) {
      if (error) {
        if (onErrorHooks && onErrorHooks.length) {
          _.each(onErrorHooks, function onErrorEach(hook) {
            hook.call(hookContext, formType, error);
          });
        } else if ((!afterHooks || !afterHooks.length) && ss.namedContext(formId).isValid()) {
          // if there are no onError or "after" hooks or validation errors, log the error
          // because it must be some other error from the server
          console.log(error);
        }
      } else {
        // By default, we reset form after successful submit, but
        // you can opt out. We should never reset after submit
        // when autosaving.
        if (form.resetOnSuccess !== false && form.autosave !== true) {
          AutoForm.resetForm(formId, template);
        }
        // Set docId in the context for insert forms, too
        if (formType === "insert") {
          hookContext.docId = result;
        }
        _.each(onSuccessHooks, function onSuccessEach(hook) {
          hook.call(hookContext, formType, result);
        });
      }
      _.each(afterHooks, function afterHooksEach(hook) {
        hook.call(hookContext, error, result);
      });
      endSubmission();
    }

    // Run beginSubmit hooks (disable submit button or form, etc.)
    // NOTE: This needs to stay after getFormValues in case a
    // beginSubmit hook disables inputs. We don't get values for
    // disabled inputs, but if they are just disabling during submission,
    // then we actually do want the values.
    //
    // Also keep this before prevalidation so that sticky errors can be
    // removed in this hook.
    beginSubmit(formId, template, hookContext);

    // Ask form type definition whether we should prevalidate. By default we do.
    var shouldPrevalidate = ftd.shouldPrevalidate ? ftd.shouldPrevalidate.call(hookContext) : true;

    if (shouldPrevalidate) {
      // This validation pass happens before any "before" hooks run. We
      // validate against the form schema. Then before hooks can add any missing
      // properties before we validate against the full collection schema.
      try {
        isValid = (form.validation === 'none') ||
          ftd.validateForm.call({
            form: form,
            formDoc: formDoc,
            useCollectionSchema: false
          });
      } catch (e) {
        // Catch exceptions in validation functions which will bubble up here, cause a form with
        // onSubmit() to submit prematurely and prevent the error from being reported
        // (due to a page refresh).
        console.error('Validation error', e);
        isValid = false;
      }
      // If we failed pre-submit validation, we stop submission.
      if (isValid === false) {
        failedValidation();
        return;
      }
    }

    // Call onSubmit from the form type definition
    ftd.onSubmit.call(_.extend({
      runBeforeHooks: runBeforeHooks,
      result: resultCallback,
      endSubmission: endSubmission,
      failedValidation: failedValidation,
      validationOptions: validationOptions,
      hookContext: hookContext
    }, hookContext));
  },
  'keyup [data-schema-key]': function autoFormKeyUpHandler(event) {
    // Ignore enter/return, shift, ctrl, cmd, tab, arrows, etc.
    // Most of these are just optimizations, but without ignoring Enter, errors can fail to show up
    // because of conflicts between running onSubmit handlers and this around the same time.
    if (_.contains([13, 9, 16, 20, 17, 91, 37, 38, 39, 40], event.keyCode)) return;

    // validateField is throttled, so we need to get the nearest form's
    // ID here, while we're still in the correct context
    var formId = AutoForm.getFormId();

    // Get current form data context
    var form = AutoForm.getCurrentDataForForm(formId);

    var validationType = form.validation;
    var skipEmpty = !(event.keyCode === 8 || event.keyCode === 46); //if deleting or backspacing, don't skip empty

    if ((validationType === 'keyup' || validationType === 'submitThenKeyup')) {
      var key = getKeyForElement(event.currentTarget);
      if (!key) return;

      validateField(key, formId, skipEmpty, onlyIfAlreadyInvalid(validationType));

      // If it's an array field, we also want to validate the entire topmost array
      // in case there are minCount/maxCount errors, etc.
      var arrayKey = adjustKeyForArrays(key);
      if (arrayKey !== key) {
        validateField(arrayKey, formId, skipEmpty, onlyIfAlreadyInvalid(validationType));
      }

      // If the form should be auto-saved whenever updated, we do that on field
      // changes instead of validating the field
      if (form.autosaveOnKeyup === true) {
        throttleAutosave(event);
      }
    }
  },
  'blur [data-schema-key]': function autoFormBlurHandler(event) {
    // validateField is throttled, so we need to get the nearest form's
    // ID here, while we're still in the correct context
    var formId = AutoForm.getFormId();

    // Get current form data context
    var form = AutoForm.getCurrentDataForForm(formId);
    var validationType = form.validation;

    if (validationType === 'keyup' ||
        validationType === 'blur' ||
        validationType === 'submitThenKeyup' ||
        validationType === 'submitThenBlur') {
      var key = getKeyForElement(event.currentTarget);
      if (!key) {return;}

      validateField(key, formId, false, onlyIfAlreadyInvalid(validationType));

      // If it's an array field, we also want to validate the entire topmost array
      // in case there are minCount/maxCount errors, etc.
      var arrayKey = adjustKeyForArrays(key);
      if (arrayKey !== key) {
        validateField(arrayKey, formId, false, onlyIfAlreadyInvalid(validationType));
      }
    }
  },
  'change form': function autoFormChangeHandler(event, template) {
    var key = getKeyForElement(event.target);
    if (!key) {return;}

    // Some plugins, like jquery.inputmask, can cause infinite
    // loops by continually saying the field changed when it did not,
    // especially in an autosave situation. This is an attempt to
    // prevent that from happening.
    var $target = $(event.target);
    var keyVal = $target.val();
    if (event.target.type === 'checkbox') {
      // Special handling for checkboxes, which always have the same value
      keyVal = keyVal + '_' + $target.prop('checked');
    }

    keyVal = key + '___' + keyVal;

    if (keyVal === lastKeyVal) {
      return;
    }
    lastKeyVal = keyVal;

    var formId = this.id;

    // Mark field value as changed for reactive updates
    updateTrackedFieldValue(template, key);

    // Get current form data context
    var form = AutoForm.getCurrentDataForForm(formId);

    // If the form should be auto-saved whenever updated, we do that on field
    // changes instead of validating the field
    if (form.autosave === true || form.autosaveOnKeyup === true) {
      lastAutoSaveElement = event.target;
      $(event.currentTarget).submit();
      return;
    }

    var validationType = form.validation;

    if (validationType === 'keyup' ||
        validationType === 'blur' ||
        validationType === 'submitThenKeyup' ||
        validationType === 'submitThenBlur') {

      validateField(key, formId, false, onlyIfAlreadyInvalid(validationType));

      // If it's an array field, we also want to validate the entire topmost array
      // in case there are minCount/maxCount errors, etc.
      var arrayKey = adjustKeyForArrays(key);
      if (arrayKey !== key) {
        validateField(arrayKey, formId, false, onlyIfAlreadyInvalid(validationType));
      }
    }
  },
  'reset form': function autoFormResetHandler(event, template) {
    var formId = this.id;

    AutoForm.formPreserve.clearDocument(formId);

    // Reset array counts
    arrayTracker.resetForm(formId);

    var vc = AutoForm.getValidationContext(formId);
    if (vc) {
      vc.resetValidation();
      // If simpleSchema is undefined, we haven't yet rendered the form, and therefore
      // there is no need to reset validation for it. No error need be thrown.
    }

    if (this.doc) {
      event.preventDefault();
      AutoForm._forceResetFormValues(formId);
    }

    // Mark all fields as changed
    updateAllTrackedFieldValues(template);
    // Focus the autofocus element
    template.$("[autofocus]").focus();

  },
  'keydown .autoform-array-item input': function (event) {
    // When enter is pressed in an array item field, default behavior
    // seems to be to "click" the remove item button. This doesn't make
    // sense so we stop it.
    if (event.keyCode === 13) {
      event.preventDefault();
    }
  },
  'click .autoform-remove-item': function autoFormClickRemoveItem(event, template) {
    var self = this; // This type of button must be used within an afEachArrayItem block, so we know the context

    event.preventDefault();

    var name = self.arrayFieldName;
    var minCount = self.minCount; // optional, overrides schema
    var maxCount = self.maxCount; // optional, overrides schema
    var index = self.index;
    var data = template.data;
    var formId = data && data.id;
    var ss = AutoForm.getFormSchema(formId);

    // remove the item we clicked
    arrayTracker.removeFromFieldAtIndex(formId, name, index, ss, minCount, maxCount);
  },
  'click .autoform-add-item': function autoFormClickAddItem(event, template) {
    event.preventDefault();

    // We pull from data attributes because the button could be manually
    // added anywhere, so we don't know the data context.
    var btn = $(event.currentTarget);
    var name = btn.attr("data-autoform-field");
    var minCount = btn.attr("data-autoform-minCount"); // optional, overrides schema
    var maxCount = btn.attr("data-autoform-maxCount"); // optional, overrides schema

    var data = template.data;
    var formId = data && data.id;
    var ss = AutoForm.getFormSchema(formId);

    arrayTracker.addOneToField(formId, name, ss, minCount, maxCount);
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/bootstrap3.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

/*
 * Template helpers for "bootstrap3" templates
 */

Template.registerHelper('attsPlusFormControlClass', function attsPlusFormControlClass() {
  var atts = _.clone(this.atts);
  // Add bootstrap class
  atts = AutoForm.Utility.addClass(atts, "form-control");
  return atts;
});

Template.registerHelper('attsPlusBtnClass', function attsPlusBtnClass() {
  var atts = _.clone(this.atts);
  // Add bootstrap class
  atts = AutoForm.Utility.addClass(atts, "btn");
  return atts;
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/quickForm/template.quickForm.js                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm_bootstrap3");
Template["quickForm_bootstrap3"] = new Template("Template.quickForm_bootstrap3", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("qfAutoFormContext"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("autoForm"), function() {
      return [ "\n\n    ", Spacebars.With(function() {
        return Spacebars.call(view.lookup("grouplessFields"));
      }, function() {
        return [ "\n      ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n    " ];
      }), "\n\n    ", Blaze.Each(function() {
        return Spacebars.call(view.lookup("fieldGroups"));
      }, function() {
        return [ "\n      ", HTML.FIELDSET({
          class: "af-fieldGroup"
        }, "\n        ", Spacebars.With(function() {
          return Spacebars.call(view.lookup("fieldGroupLabel"));
        }, function() {
          return [ "\n          ", HTML.LEGEND({
            class: "af-fieldGroup-heading"
          }, Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          })), "\n        " ];
        }), "\n        ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n      "), "\n    " ];
      }), "\n\n    ", Blaze.If(function() {
        return Spacebars.call(view.lookup("qfShouldRenderButton"));
      }, function() {
        return [ "\n      ", HTML.DIV({
          class: "form-group"
        }, "\n        ", HTML.BUTTON(HTML.Attrs({
          type: "submit"
        }, function() {
          return Spacebars.attrMustache(view.lookup("submitButtonAtts"));
        }), "\n          ", Spacebars.With(function() {
          return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "buttonContent"));
        }, function() {
          return [ "\n          ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), "\n          " ];
        }, function() {
          return "\n          Submit\n          ";
        }), "\n        "), "\n      "), "\n    " ];
      }), "\n\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/quickForm/quickForm.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.quickForm_bootstrap3.helpers({
  fieldGroupLabel: function () {
    var name = this.name;

    // if field group name is of the form XY_abcde where "XY" is a number, remove prefix
    if (!isNaN(parseInt(name.substr(0,2), 10)) && name.charAt(2) === "_") {
      name = name.substr(3);
    }

    // if SimpleSchema.defaultLabel is defined, use it
    if (typeof SimpleSchema.defaultLabel === "function") {
      return SimpleSchema.defaultLabel(name);
    } else {
      // else, just capitalise name
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  },
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'fields', 'id-prefix', 'input-col-class', 'label-class');
  },
  submitButtonAtts: function bsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === 'string') {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary';
    }
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/afArrayField/template.afArrayField.js                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afArrayField_bootstrap3");
Template["afArrayField_bootstrap3"] = new Template("Template.afArrayField_bootstrap3", (function() {
  var view = this;
  return HTML.DIV({
    class: "panel panel-default"
  }, "\n    ", HTML.DIV({
    class: "panel-heading"
  }, Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  })), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "panel-body has-error"
    }, "\n      ", HTML.SPAN({
      class: "help-block"
    }, Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "atts", "name")
      })));
    })), "\n    "), "\n    " ];
  }), "\n    ", HTML.UL({
    class: "list-group"
  }, "\n      ", Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "name")),
      minCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "minCount")),
      maxCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "maxCount"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("afEachArrayItem"), function() {
      return [ "\n      ", HTML.LI({
        class: "list-group-item autoform-array-item"
      }, "\n        ", HTML.DIV("\n          ", HTML.DIV({
        class: "autoform-remove-item-wrap"
      }, "\n            ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afArrayFieldHasMoreThanMinimum"), Spacebars.kw({
          name: Spacebars.dot(view.lookup(".."), "atts", "name"),
          minCount: Spacebars.dot(view.lookup(".."), "atts", "minCount"),
          maxCount: Spacebars.dot(view.lookup(".."), "atts", "maxCount")
        }));
      }, function() {
        return [ "\n            ", HTML.BUTTON({
          type: "button",
          class: "btn btn-primary autoform-remove-item"
        }, HTML.SPAN({
          class: "glyphicon glyphicon-minus"
        })), "\n            " ];
      }), "\n          "), "\n          ", HTML.DIV({
        class: "autoform-array-item-body"
      }, "\n            ", Blaze._TemplateWith(function() {
        return {
          name: Spacebars.call(Spacebars.dot(view.lookup("."), "name")),
          label: Spacebars.call(false),
          options: Spacebars.call(view.lookup("afOptionsFromSchema"))
        };
      }, function() {
        return Spacebars.include(view.lookupTemplate("afQuickField"));
      }), "\n          "), "\n        "), "\n      "), "\n      " ];
    });
  }), "\n      ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afArrayFieldHasLessThanMaximum"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name"),
      minCount: Spacebars.dot(view.lookup("."), "atts", "minCount"),
      maxCount: Spacebars.dot(view.lookup("."), "atts", "maxCount")
    }));
  }, function() {
    return [ "\n      ", HTML.LI({
      class: "list-group-item"
    }, "\n        ", HTML.BUTTON({
      type: "button",
      class: "btn btn-primary autoform-add-item",
      "data-autoform-field": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "name"));
      },
      "data-autoform-mincount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "minCount"));
      },
      "data-autoform-maxcount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "maxCount"));
      }
    }, HTML.SPAN({
      class: "glyphicon glyphicon-plus"
    })), "\n      "), "\n      " ];
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/afFormGroup/template.afFormGroup.js                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afFormGroup_bootstrap3");
Template["afFormGroup_bootstrap3"] = new Template("Template.afFormGroup_bootstrap3", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: function() {
      return [ "form-group ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return "has-error";
      }), " ", Spacebars.mustache(view.lookup("afFormGroupClass")) ];
    },
    "data-required": function() {
      return Spacebars.mustache(view.lookup("required"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("afFormGroupAtts"));
  }), "\n    ", Blaze.Unless(function() {
    return Spacebars.call(view.lookup("skipLabel"));
  }, function() {
    return [ "\n    ", HTML.LABEL(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("bsFieldLabelAtts"));
    }), Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "labelText"));
    }, function() {
      return Blaze.View("lookup:..labelText", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "labelText"));
      });
    }, function() {
      return Blaze.View("lookup:afFieldLabelText", function() {
        return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      });
    })), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "afFieldInputAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afFieldInput"));
  }), "\n    ", HTML.SPAN({
    class: "help-block"
  }, Blaze.View("lookup:afFieldMessage", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    })));
  })), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/afFormGroup/afFormGroup.js                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afFormGroup_bootstrap3.helpers({
  skipLabel: function bsFormGroupSkipLabel() {
    var self = this;

    var type = AutoForm.getInputType(self.afFieldInputAtts);
    return (self.skipLabel || type === "boolean-checkbox");
  },
  bsFieldLabelAtts: function bsFieldLabelAtts() {
    var atts = _.clone(this.afFieldLabelAtts);
    // Add bootstrap class
    atts = AutoForm.Utility.addClass(atts, "control-label");
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/afObjectField/template.afObjectField.js                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afObjectField_bootstrap3");
Template["afObjectField_bootstrap3"] = new Template("Template.afObjectField_bootstrap3", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "panel ", Spacebars.mustache(view.lookup("panelClass")) ];
    }
  }, "\n    ", Spacebars.With(function() {
    return Spacebars.dataMustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: function() {
        return [ "panel-heading ", Spacebars.mustache(view.lookup("headingClass")) ];
      }
    }, "\n      ", HTML.H3({
      class: "panel-title"
    }, Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    })), "\n    "), "\n    " ];
  }), "\n    ", HTML.DIV({
    class: function() {
      return [ "panel-body ", Spacebars.mustache(view.lookup("bodyClass")) ];
    }
  }, "\n      ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n      ", HTML.SPAN({
      class: "help-block"
    }, Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "name")
      })));
    })), "\n      " ];
  }), "\n      ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("quickFieldsAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afQuickFields"));
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/components/afObjectField/afObjectField.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afObjectField_bootstrap3.helpers({
  quickFieldsAtts: function () {
    return _.pick(this, 'name', 'id-prefix');
  },
  panelClass: function() {
    return this.panelClass || 'panel-default';
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/boolean-checkbox/template.boolean-checkbox.js              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckbox_bootstrap3");
Template["afCheckbox_bootstrap3"] = new Template("Template.afCheckbox_bootstrap3", (function() {
  var view = this;
  return HTML.DIV({
    class: "checkbox"
  }, "\n    ", HTML.LABEL("\n      ", HTML.INPUT(HTML.Attrs({
    type: "checkbox",
    value: "true"
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  })), "\n      ", Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/boolean-radios/template.boolean-radios.js                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afBooleanRadioGroup_bootstrap3");
Template["afBooleanRadioGroup_bootstrap3"] = new Template("Template.afBooleanRadioGroup_bootstrap3", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", HTML.DIV({
    class: "radio"
  }, "\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
    type: "radio",
    value: "false",
    name: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("falseAtts"));
  })), " ", Spacebars.With(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "falseLabel"));
  }, function() {
    return Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    });
  }, function() {
    return "False";
  })), "\n    "), "\n    ", HTML.DIV({
    class: "radio"
  }, "\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
    type: "radio",
    value: "true",
    name: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("trueAtts"));
  })), " ", Spacebars.With(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "trueLabel"));
  }, function() {
    return Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    });
  }, function() {
    return "True";
  })), "\n    "), "\n    ", Blaze.If(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "nullLabel"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "radio"
    }, "\n      ", HTML.LABEL(HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: "null",
      name: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "name"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("nullAtts"));
    })), " ", Blaze.View("lookup:..atts.nullLabel", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "nullLabel"));
    })), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/boolean-radios/boolean-radios.js                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afBooleanRadioGroup_bootstrap3.helpers({
  falseAtts: function falseAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'data-schema-key');
    if (this.value === false) {
      atts.checked = "";
    }
    return atts;
  },
  trueAtts: function trueAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'data-schema-key');
    if (this.value === true) {
      atts.checked = "";
    }
    return atts;
  },
  nullAtts: function nullAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'nullLabel', 'data-schema-key');
    if (this.value !== true && this.value !== false) {
      atts.checked = "";
    }
    return atts;
  },
  dsk: function () {
    return {'data-schema-key': this.atts['data-schema-key']};
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/boolean-select/template.boolean-select.js                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afBooleanSelect_bootstrap3");
Template["afBooleanSelect_bootstrap3"] = new Template("Template.afBooleanSelect_bootstrap3", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.OPTION(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
    }), Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    })), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/button/template.button.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputButton_bootstrap3");
Template["afInputButton_bootstrap3"] = new Template("Template.afInputButton_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "button",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusBtnClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/color/template.color.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputColor_bootstrap3");
Template["afInputColor_bootstrap3"] = new Template("Template.afInputColor_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "color",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/date/template.date.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDate_bootstrap3");
Template["afInputDate_bootstrap3"] = new Template("Template.afInputDate_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "date",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/datetime/template.datetime.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDateTime_bootstrap3");
Template["afInputDateTime_bootstrap3"] = new Template("Template.afInputDateTime_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "datetime",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/datetime-local/template.datetime-local.js                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDateTimeLocal_bootstrap3");
Template["afInputDateTimeLocal_bootstrap3"] = new Template("Template.afInputDateTimeLocal_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "datetime-local",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/email/template.email.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputEmail_bootstrap3");
Template["afInputEmail_bootstrap3"] = new Template("Template.afInputEmail_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "email",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/month/template.month.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputMonth_bootstrap3");
Template["afInputMonth_bootstrap3"] = new Template("Template.afInputMonth_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "month",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/number/template.number.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputNumber_bootstrap3");
Template["afInputNumber_bootstrap3"] = new Template("Template.afInputNumber_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "number",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/password/template.password.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputPassword_bootstrap3");
Template["afInputPassword_bootstrap3"] = new Template("Template.afInputPassword_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "password",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/radio/template.radio.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadio_bootstrap3");
Template["afRadio_bootstrap3"] = new Template("Template.afRadio_bootstrap3", (function() {
  var view = this;
  return HTML.DIV({
    class: "radio"
  }, "\n    ", HTML.LABEL("\n      ", HTML.INPUT(HTML.Attrs({
    type: "radio",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  })), "\n      ", Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/radio/radio.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afRadio_bootstrap3.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/range/template.range.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputRange_bootstrap3");
Template["afInputRange_bootstrap3"] = new Template("Template.afInputRange_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "range",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/reset/template.reset.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputReset_bootstrap3");
Template["afInputReset_bootstrap3"] = new Template("Template.afInputReset_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "reset",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusBtnClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/search/template.search.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputSearch_bootstrap3");
Template["afInputSearch_bootstrap3"] = new Template("Template.afInputSearch_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "search",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select/template.select.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afSelect_bootstrap3");
Template["afSelect_bootstrap3"] = new Template("Template.afSelect_bootstrap3", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "optgroup"));
    }, function() {
      return [ "\n    ", HTML.OPTGROUP({
        label: function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "optgroup"));
        }
      }, "\n      ", Blaze.Each(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
      }, function() {
        return [ "\n      ", HTML.OPTION(HTML.Attrs(function() {
          return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
        }), Blaze.View("lookup:..label", function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
        })), "\n      " ];
      }), "\n    "), "\n    " ];
    }, function() {
      return [ "\n    ", HTML.OPTION(HTML.Attrs(function() {
        return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
      }), Blaze.View("lookup:..label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
      })), "\n    " ];
    }), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-checkbox/template.select-checkbox.js                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckboxGroup_bootstrap3");
Template["afCheckboxGroup_bootstrap3"] = new Template("Template.afCheckboxGroup_bootstrap3", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-checkbox-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "checkbox"
    }, "\n      ", HTML.LABEL("\n        ", HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n        ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    }), "\n      "), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-checkbox/select-checkbox.js                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afCheckboxGroup_bootstrap3.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-checkbox-inline/template.select-checkbox-inline.js  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckboxGroupInline_bootstrap3");
Template["afCheckboxGroupInline_bootstrap3"] = new Template("Template.afCheckboxGroupInline_bootstrap3", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-checkbox-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.LABEL({
      class: "checkbox-inline fix-indent"
    }, "\n      ", HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n      ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    }), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-checkbox-inline/select-checkbox-inline.js           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afCheckboxGroupInline_bootstrap3.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-multiple/template.select-multiple.js                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afSelectMultiple_bootstrap3");
Template["afSelectMultiple_bootstrap3"] = new Template("Template.afSelectMultiple_bootstrap3", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs({
    multiple: ""
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "optgroup"));
    }, function() {
      return [ "\n    ", HTML.OPTGROUP({
        label: function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "optgroup"));
        }
      }, "\n      ", Blaze.Each(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
      }, function() {
        return [ "\n      ", HTML.OPTION(HTML.Attrs(function() {
          return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
        }), Blaze.View("lookup:..label", function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
        })), "\n      " ];
      }), "\n    "), "\n    " ];
    }, function() {
      return [ "\n    ", HTML.OPTION(HTML.Attrs(function() {
        return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
      }), Blaze.View("lookup:..label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
      })), "\n    " ];
    }), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-radio/template.select-radio.js                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadioGroup_bootstrap3");
Template["afRadioGroup_bootstrap3"] = new Template("Template.afRadioGroup_bootstrap3", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-radio-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "radio"
    }, "\n      ", HTML.LABEL("\n        ", HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n        ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    }), "\n      "), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-radio/select-radio.js                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afRadioGroup_bootstrap3.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-radio-inline/template.select-radio-inline.js        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadioGroupInline_bootstrap3");
Template["afRadioGroupInline_bootstrap3"] = new Template("Template.afRadioGroupInline_bootstrap3", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "af-radio-group"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.LABEL({
      class: "radio-inline fix-indent"
    }, "\n      ", HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n      ", Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    }), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/select-radio-inline/select-radio-inline.js                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afRadioGroupInline_bootstrap3.helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function dsk() {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/submit/template.submit.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputSubmit_bootstrap3");
Template["afInputSubmit_bootstrap3"] = new Template("Template.afInputSubmit_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "submit",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusBtnClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/tel/template.tel.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputTel_bootstrap3");
Template["afInputTel_bootstrap3"] = new Template("Template.afInputTel_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "tel",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/text/template.text.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputText_bootstrap3");
Template["afInputText_bootstrap3"] = new Template("Template.afInputText_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "text",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/textarea/template.textarea.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afTextarea_bootstrap3");
Template["afTextarea_bootstrap3"] = new Template("Template.afTextarea_bootstrap3", (function() {
  var view = this;
  return HTML.TEXTAREA(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }, {
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/time/template.time.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputTime_bootstrap3");
Template["afInputTime_bootstrap3"] = new Template("Template.afInputTime_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "time",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/url/template.url.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputUrl_bootstrap3");
Template["afInputUrl_bootstrap3"] = new Template("Template.afInputUrl_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "url",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3/inputTypes/week/template.week.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputWeek_bootstrap3");
Template["afInputWeek_bootstrap3"] = new Template("Template.afInputWeek_bootstrap3", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "week",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("attsPlusFormControlClass"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/quickForm/template.quickForm.js                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm_bootstrap3-horizontal");
Template["quickForm_bootstrap3-horizontal"] = new Template("Template.quickForm_bootstrap3-horizontal", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("qfAutoFormContext"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("autoForm"), function() {
      return [ "\n\n    ", Spacebars.With(function() {
        return Spacebars.call(view.lookup("grouplessFields"));
      }, function() {
        return [ "\n      ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n    " ];
      }), "\n\n    ", Blaze.Each(function() {
        return Spacebars.call(view.lookup("fieldGroups"));
      }, function() {
        return [ "\n      ", HTML.FIELDSET({
          class: "af-fieldGroup"
        }, "\n        ", Spacebars.With(function() {
          return Spacebars.call(view.lookup("fieldGroupLabel"));
        }, function() {
          return [ "\n          ", HTML.LEGEND({
            class: "af-fieldGroup-heading"
          }, Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          })), "\n        " ];
        }), "\n        ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n      "), "\n    " ];
      }), "\n\n    ", Blaze.If(function() {
        return Spacebars.call(view.lookup("qfShouldRenderButton"));
      }, function() {
        return [ "\n    ", HTML.DIV({
          class: "form-group"
        }, "\n      ", HTML.DIV({
          class: function() {
            return Spacebars.mustache(view.lookup("labelClass"));
          }
        }), "\n      ", HTML.DIV({
          class: function() {
            return Spacebars.mustache(view.lookup("inputClass"));
          }
        }, "\n        ", HTML.BUTTON(HTML.Attrs({
          type: "submit"
        }, function() {
          return Spacebars.attrMustache(view.lookup("submitButtonAtts"));
        }), "\n          ", Spacebars.With(function() {
          return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "buttonContent"));
        }, function() {
          return [ "\n          ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), "\n          " ];
        }, function() {
          return "\n          Submit\n          ";
        }), "\n        "), "\n      "), "\n    "), "\n    " ];
      }), "\n\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/quickForm/quickForm.js                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template['quickForm_bootstrap3-horizontal'].helpers({
  inputClass: function () {
    return this.atts["input-col-class"];
  },
  labelClass: function () {
    return this.atts["label-class"];
  },
  fieldGroupLabel: function () {
    var name = this.name;

    // if field group name is of the form XY_abcde where "XY" is a number, remove prefix
    if (!isNaN(parseInt(name.substr(0,2), 10)) && name.charAt(2) === "_") {
      name = name.substr(3);
    }

    // if SimpleSchema.defaultLabel is defined, use it
    if (typeof SimpleSchema.defaultLabel === "function") {
      return SimpleSchema.defaultLabel(name);
    } else {
      // else, just capitalise name
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  },
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'fields', 'id-prefix', 'input-col-class', 'label-class');
  },
  submitButtonAtts: function () {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary';
    }
    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext || {});
    ctx = AutoForm.Utility.addClass(ctx, 'form-horizontal');

    // input-col-class and label-class attributes are unique to this template so they will
    // not have been removed by AutoForm core. We remove them from the autoForm context
    // because they are attributes supported only by quickFields, quickField,
    // afObjectField, afArrayField, and afFormGroup.
    delete ctx['input-col-class'];
    delete ctx['label-class'];

    return ctx;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/afArrayField/template.afArrayField.js           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afArrayField_bootstrap3-horizontal");
Template["afArrayField_bootstrap3-horizontal"] = new Template("Template.afArrayField_bootstrap3-horizontal", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "form-group", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "atts", "name")
        }));
      }, function() {
        return " has-error";
      }) ];
    }
  }, "\n    ", HTML.LABEL(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("afFieldLabelAtts"));
  }), Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  })), "\n    ", HTML.DIV({
    class: function() {
      return Spacebars.mustache(view.lookup("rightColumnClass"));
    }
  }, "\n      ", HTML.DIV({
    class: "panel panel-default autoform-padding-fix"
  }, "\n        ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  }, function() {
    return [ "\n        ", HTML.DIV({
      class: "panel-body has-error"
    }, "\n          ", HTML.SPAN({
      class: "help-block"
    }, Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "atts", "name")
      })));
    })), "\n        "), "\n        " ];
  }), "\n        ", HTML.UL({
    class: "list-group"
  }, "\n          ", Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "name")),
      minCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "minCount")),
      maxCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "maxCount"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("afEachArrayItem"), function() {
      return [ "\n          ", HTML.LI({
        class: "list-group-item autoform-array-item"
      }, "\n            ", HTML.DIV("\n              ", HTML.DIV({
        class: "autoform-remove-item-wrap"
      }, "\n                ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afArrayFieldHasMoreThanMinimum"), Spacebars.kw({
          name: Spacebars.dot(view.lookup(".."), "atts", "name"),
          minCount: Spacebars.dot(view.lookup(".."), "atts", "minCount"),
          maxCount: Spacebars.dot(view.lookup(".."), "atts", "maxCount")
        }));
      }, function() {
        return [ "\n                ", HTML.BUTTON({
          type: "button",
          class: "btn btn-primary autoform-remove-item"
        }, HTML.SPAN({
          class: "glyphicon glyphicon-minus"
        })), "\n                " ];
      }), "\n              "), "\n              ", HTML.DIV({
        class: "autoform-array-item-body"
      }, "\n                ", Blaze._TemplateWith(function() {
        return {
          name: Spacebars.call(Spacebars.dot(view.lookup("."), "name")),
          label: Spacebars.call(false),
          options: Spacebars.call(view.lookup("afOptionsFromSchema"))
        };
      }, function() {
        return Spacebars.include(view.lookupTemplate("afQuickField"));
      }), "\n              "), "\n            "), "\n          "), "\n          " ];
    });
  }), "\n          ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afArrayFieldHasLessThanMaximum"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name"),
      minCount: Spacebars.dot(view.lookup("."), "atts", "minCount"),
      maxCount: Spacebars.dot(view.lookup("."), "atts", "maxCount")
    }));
  }, function() {
    return [ "\n          ", HTML.LI({
      class: "list-group-item"
    }, "\n            ", HTML.BUTTON({
      type: "button",
      class: "btn btn-primary autoform-add-item",
      "data-autoform-field": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "name"));
      },
      "data-autoform-mincount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "minCount"));
      },
      "data-autoform-maxcount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "maxCount"));
      }
    }, HTML.SPAN({
      class: "glyphicon glyphicon-plus"
    })), "\n          "), "\n          " ];
  }), "\n        "), "\n      "), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/afArrayField/afArrayField.js                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template["afArrayField_bootstrap3-horizontal"].helpers({
  rightColumnClass: function () {
    var atts = this.atts || {};
    return atts['input-col-class'] || "";
  },
  afFieldLabelAtts: function () {
    // Use only atts beginning with label-
    var labelAtts = {};
    _.each(this.atts, function (val, key) {
      if (key.indexOf("label-") === 0) {
        labelAtts[key.substring(6)] = val;
      }
    });
    // Add bootstrap class
    labelAtts = AutoForm.Utility.addClass(labelAtts, "control-label");
    return labelAtts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/afFormGroup/template.afFormGroup.js             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afFormGroup_bootstrap3-horizontal");
Template["afFormGroup_bootstrap3-horizontal"] = new Template("Template.afFormGroup_bootstrap3-horizontal", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: function() {
      return [ "form-group ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return "has-error";
      }), " ", Spacebars.mustache(view.lookup("afFormGroupClass")) ];
    },
    "data-required": function() {
      return Spacebars.mustache(view.lookup("required"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("afFormGroupAtts"));
  }), "\n    ", Blaze.If(function() {
    return Spacebars.call(view.lookup("skipLabel"));
  }, function() {
    return [ "\n    \n    ", HTML.LABEL(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("afFieldLabelAtts"));
    })), "\n    " ];
  }, function() {
    return [ "\n    ", HTML.LABEL(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("afFieldLabelAtts"));
    }), Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "labelText"));
    }, function() {
      return Blaze.View("lookup:..labelText", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "labelText"));
      });
    }, function() {
      return Blaze.View("lookup:afFieldLabelText", function() {
        return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      });
    })), "\n    " ];
  }), "\n    ", HTML.DIV({
    class: function() {
      return Spacebars.mustache(view.lookup("rightColumnClass"));
    }
  }, "\n      ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("afFieldInputAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afFieldInput"));
  }), "\n      ", HTML.SPAN({
    class: "help-block"
  }, Blaze.View("lookup:afFieldMessage", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    })));
  })), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/afFormGroup/afFormGroup.js                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template["afFormGroup_bootstrap3-horizontal"].helpers({
  afFieldInputAtts: function () {
    var atts = _.omit(this.afFieldInputAtts || {}, 'input-col-class');
    // We have a special template for check boxes, but otherwise we
    // want to use the same as those defined for bootstrap3 template.
    if (AutoForm.getInputType(this.afFieldInputAtts) === "boolean-checkbox") {
      atts.template = "bootstrap3-horizontal";
    } else {
      atts.template = "bootstrap3";
    }
    return atts;
  },
  afFieldLabelAtts: function () {
    var atts = _.clone(this.afFieldLabelAtts || {});
    // Add bootstrap class
    atts = AutoForm.Utility.addClass(atts, "control-label");
    return atts;
  },
  rightColumnClass: function () {
    var atts = this.afFieldInputAtts || {};
    return atts['input-col-class'] || "";
  },
  skipLabel: function () {
    var self = this;

    var type = AutoForm.getInputType(self.afFieldInputAtts);
    return (self.skipLabel || (type === "boolean-checkbox" && !self.afFieldInputAtts.leftLabel));
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/afObjectField/template.afObjectField.js         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afObjectField_bootstrap3-horizontal");
Template["afObjectField_bootstrap3-horizontal"] = new Template("Template.afObjectField_bootstrap3-horizontal", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "form-group ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return "has-error";
      }) ];
    }
  }, "\n    ", HTML.LABEL(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("afFieldLabelAtts"));
  }), Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  })), "\n    ", HTML.DIV({
    class: function() {
      return Spacebars.mustache(view.lookup("rightColumnClass"));
    }
  }, "\n      ", HTML.DIV({
    class: function() {
      return [ "panel panel-default autoform-padding-fix ", Spacebars.mustache(view.lookup("panelClass")) ];
    }
  }, "\n        ", HTML.DIV({
    class: function() {
      return [ "panel-body ", Spacebars.mustache(view.lookup("bodyClass")) ];
    }
  }, "\n          ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("quickFieldsAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afQuickFields"));
  }), "\n        "), "\n      "), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/components/afObjectField/afObjectField.js                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template["afObjectField_bootstrap3-horizontal"].helpers({
  rightColumnClass: function () {
    return this['input-col-class'] || "";
  },
  afFieldLabelAtts: function () {
    // Use only atts beginning with label-
    var labelAtts = {};
    _.each(this, function (val, key) {
      if (key.indexOf("label-") === 0) {
        labelAtts[key.substring(6)] = val;
      }
    });
    // Add bootstrap class
    labelAtts = AutoForm.Utility.addClass(labelAtts, "control-label");
    return labelAtts;
  },
  quickFieldsAtts: function () {
    var atts = _.pick(this, 'name', 'id-prefix');
    // We want to default to using bootstrap3 template below this point
    // because we don't want horizontal within horizontal
    atts.template = 'bootstrap3';
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/inputTypes/boolean-checkbox/template.boolean-checkbox.js   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckbox_bootstrap3-horizontal");
Template["afCheckbox_bootstrap3-horizontal"] = new Template("Template.afCheckbox_bootstrap3-horizontal", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("useLeftLabel"));
  }, function() {
    return [ "\n  \n  ", HTML.DIV({
      class: "checkbox"
    }, "\n    ", HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: "true"
    }, function() {
      return Spacebars.attrMustache(view.lookup("attsPlusSpecialClass"));
    })), "\n  "), "\n  " ];
  }, function() {
    return [ "\n  ", HTML.DIV({
      class: "checkbox"
    }, "\n    ", HTML.LABEL("\n      ", HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: "true"
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n      ", Blaze.View("lookup:afFieldLabelText", function() {
      return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "name")
      }));
    }), "\n    "), "\n  "), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-horizontal/inputTypes/boolean-checkbox/boolean-checkbox.js            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template["afCheckbox_bootstrap3-horizontal"].helpers({
  attsPlusSpecialClass: function () {
    var atts = _.clone(this.atts);
    atts = AutoForm.Utility.addClass(atts, "autoform-checkbox-margin-fix");
    return atts;
  },
  useLeftLabel: function () {
    return this.atts.leftLabel;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-inline/template.bootstrap3-inline.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm_bootstrap3-inline");
Template["quickForm_bootstrap3-inline"] = new Template("Template.quickForm_bootstrap3-inline", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("qfAutoFormContext"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("autoForm"), function() {
      return [ "\n    ", Blaze._TemplateWith(function() {
        return Spacebars.call(view.lookup("quickFieldsAtts"));
      }, function() {
        return Spacebars.include(view.lookupTemplate("afQuickFields"));
      }), "\n    ", Blaze.If(function() {
        return Spacebars.call(view.lookup("qfShouldRenderButton"));
      }, function() {
        return [ "\n    ", HTML.BUTTON(HTML.Attrs({
          type: "submit"
        }, function() {
          return Spacebars.attrMustache(view.lookup("submitButtonAtts"));
        }), "\n    ", Spacebars.With(function() {
          return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "buttonContent"));
        }, function() {
          return [ "\n    ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), "\n    " ];
        }, function() {
          return "\n    Submit\n    ";
        }), "\n    "), "\n    " ];
      }), "\n  " ];
    });
  });
}));

Template.__checkName("afFormGroup_bootstrap3-inline");
Template["afFormGroup_bootstrap3-inline"] = new Template("Template.afFormGroup_bootstrap3-inline", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: function() {
      return [ "form-group ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return "has-error";
      }), " ", Spacebars.mustache(view.lookup("afFormGroupClass")) ];
    },
    "data-required": function() {
      return Spacebars.mustache(view.lookup("required"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("afFormGroupAtts"));
  }), "\n    ", Blaze.Unless(function() {
    return Spacebars.call(view.lookup("skipLabel"));
  }, function() {
    return [ "\n    ", HTML.LABEL(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("afFieldLabelAtts"));
    }), Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "labelText"));
    }, function() {
      return Blaze.View("lookup:..labelText", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "labelText"));
      });
    }, function() {
      return Blaze.View("lookup:afFieldLabelText", function() {
        return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      });
    })), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("afFieldInputAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afFieldInput"));
  }), "\n    ", HTML.SPAN({
    class: "help-block"
  }, Blaze.View("lookup:afFieldMessage", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    })));
  })), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/bootstrap3-inline/bootstrap3-inline.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */

Template['quickForm_bootstrap3-inline'].helpers({
  submitButtonAtts: function () {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === 'string') {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary autoform-inline-align';
    }
    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext || {});
    ctx = AutoForm.Utility.addClass(ctx, 'form-inline');

    // label-class attribute is unique to this template so it will
    // not have been removed by AutoForm core. We remove it from the autoForm context
    // because it is an attribute supported only by quickFields, quickField,
    // afObjectField, afArrayField, and afFormGroup.
    delete ctx['label-class'];

    return ctx;
  },
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'id-prefix', 'label-class');
  }
});

Template['afFormGroup_bootstrap3-inline'].helpers({
  afFieldInputAtts: function () {
    var atts = _.clone(this.afFieldInputAtts || {});
    // Use the same templates as those defined for bootstrap3 template.
    atts.template = 'bootstrap3';
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain/components/quickForm/template.quickForm.js                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm_plain");
Template["quickForm_plain"] = new Template("Template.quickForm_plain", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("qfAutoFormContext"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("autoForm"), function() {
      return [ "\n\n    ", Spacebars.With(function() {
        return Spacebars.call(view.lookup("grouplessFields"));
      }, function() {
        return [ "\n      ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n    " ];
      }), "\n\n    ", Blaze.Each(function() {
        return Spacebars.call(view.lookup("fieldGroups"));
      }, function() {
        return [ "\n      ", HTML.FIELDSET({
          class: "af-fieldGroup"
        }, "\n        ", Spacebars.With(function() {
          return Spacebars.call(view.lookup("fieldGroupLabel"));
        }, function() {
          return [ "\n          ", HTML.LEGEND({
            class: "af-fieldGroup-heading"
          }, Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          })), "\n        " ];
        }), "\n        ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n      "), "\n    " ];
      }), "\n\n    ", Blaze.If(function() {
        return Spacebars.call(view.lookup("qfShouldRenderButton"));
      }, function() {
        return [ "\n    ", HTML.DIV("\n      ", HTML.BUTTON(HTML.Attrs({
          type: "submit"
        }, function() {
          return Spacebars.attrMustache(view.lookup("submitButtonAtts"));
        }), "\n      ", Spacebars.With(function() {
          return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "buttonContent"));
        }, function() {
          return [ "\n      ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), "\n      " ];
        }, function() {
          return "\n      Submit\n      ";
        }), "\n      "), "\n    "), "\n    " ];
      }), "\n\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain/components/quickForm/quickForm.js                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.quickForm_plain.helpers({
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'id-prefix');
  },
  submitButtonAtts: function plQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    }
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain/components/afArrayField/template.afArrayField.js                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afArrayField_plain");
Template["afArrayField_plain"] = new Template("Template.afArrayField_plain", (function() {
  var view = this;
  return HTML.FIELDSET("\n    ", HTML.LEGEND(Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  })), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "autoform-array-field-error"
    }, "\n      ", Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "atts", "name")
      })));
    }), "\n    "), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "name")),
      minCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "minCount")),
      maxCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "maxCount"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("afEachArrayItem"), function() {
      return [ "\n    ", HTML.DIV({
        class: "autoform-array-item"
      }, "\n      ", Blaze._TemplateWith(function() {
        return {
          name: Spacebars.call(Spacebars.dot(view.lookup("."), "name")),
          label: Spacebars.call(false)
        };
      }, function() {
        return Spacebars.include(view.lookupTemplate("afQuickField"));
      }), "\n      ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afArrayFieldHasMoreThanMinimum"), Spacebars.kw({
          name: Spacebars.dot(view.lookup(".."), "atts", "name"),
          minCount: Spacebars.dot(view.lookup(".."), "atts", "minCount"),
          maxCount: Spacebars.dot(view.lookup(".."), "atts", "maxCount")
        }));
      }, function() {
        return [ "\n      ", HTML.BUTTON({
          type: "button",
          class: "autoform-remove-item"
        }, "Remove"), "\n      " ];
      }), "\n    "), "\n    " ];
    });
  }), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afArrayFieldHasLessThanMaximum"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name"),
      minCount: Spacebars.dot(view.lookup("."), "atts", "minCount"),
      maxCount: Spacebars.dot(view.lookup("."), "atts", "maxCount")
    }));
  }, function() {
    return [ "\n    ", HTML.DIV({
      style: "margin-top: 20px;"
    }, "\n      ", HTML.BUTTON({
      type: "button",
      class: "autoform-add-item",
      "data-autoform-field": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "name"));
      },
      "data-autoform-mincount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "minCount"));
      },
      "data-autoform-maxcount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "maxCount"));
      }
    }, "Add"), "\n    "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain/components/afFormGroup/template.afFormGroup.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afFormGroup_plain");
Template["afFormGroup_plain"] = new Template("Template.afFormGroup_plain", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: function() {
      return [ Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return "has-error";
      }), " ", Spacebars.mustache(view.lookup("afFormGroupClass")) ];
    },
    "data-required": function() {
      return Spacebars.mustache(view.lookup("required"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("afFormGroupAtts"));
  }), "\n    ", Blaze.Unless(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "skipLabel"));
  }, function() {
    return [ "\n    ", HTML.LABEL(HTML.Attrs(function() {
      return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "afFieldLabelAtts"));
    }), Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "labelText"));
    }, function() {
      return Blaze.View("lookup:..labelText", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "labelText"));
      });
    }, function() {
      return Blaze.View("lookup:afFieldLabelText", function() {
        return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      });
    })), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "afFieldInputAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afFieldInput"));
  }), "\n    ", HTML.SPAN(Blaze.View("lookup:afFieldMessage", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    })));
  })), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain/components/afObjectField/template.afObjectField.js                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afObjectField_plain");
Template["afObjectField_plain"] = new Template("Template.afObjectField_plain", (function() {
  var view = this;
  return HTML.FIELDSET("\n    ", Spacebars.With(function() {
    return Spacebars.dataMustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n    ", HTML.LEGEND(Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    })), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("quickFieldsAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afQuickFields"));
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain/components/afObjectField/afObjectField.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afObjectField_plain.helpers({
  quickFieldsAtts: function () {
    return _.pick(this, 'name', 'id-prefix');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain-fieldset/template.plain-fieldset.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm_plain-fieldset");
Template["quickForm_plain-fieldset"] = new Template("Template.quickForm_plain-fieldset", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("qfAutoFormContext"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("autoForm"), function() {
      return [ "\n    ", HTML.FIELDSET("\n      ", Spacebars.With(function() {
        return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "legend"));
      }, function() {
        return [ "\n      ", HTML.LEGEND(Blaze.View("lookup:.", function() {
          return Spacebars.mustache(view.lookup("."));
        })), "\n      " ];
      }), "\n      ", Blaze._TemplateWith(function() {
        return Spacebars.call(view.lookup("quickFieldsAtts"));
      }, function() {
        return Spacebars.include(view.lookupTemplate("afQuickFields"));
      }), "\n    "), "\n    ", Blaze.If(function() {
        return Spacebars.call(view.lookup("qfShouldRenderButton"));
      }, function() {
        return [ "\n    ", HTML.DIV("\n      ", HTML.BUTTON(HTML.Attrs({
          type: "submit"
        }, function() {
          return Spacebars.attrMustache(view.lookup("submitButtonAtts"));
        }), "\n        ", Spacebars.With(function() {
          return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "buttonContent"));
        }, function() {
          return [ "\n        ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), "\n        " ];
        }, function() {
          return "\n        Submit\n        ";
        }), "\n      "), "\n    "), "\n    " ];
      }), "\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/aldeed_autoform/templates/plain-fieldset/plain-fieldset.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template['quickForm_plain-fieldset'].helpers({
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'id-prefix');
  },
  submitButtonAtts: function plfsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    }
    return atts;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("aldeed:autoform", {
  AutoForm: AutoForm,
  Utility: Utility
});

})();

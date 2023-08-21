(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;

/* Package-scope variables */
var getFilterQuery, ReactiveTable, dependOnFilters, getFilterStrings, getFilterFields;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/aslagle_reactive-table/lib/filter.js                                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
var parseFilterString = function (filterString) {
  var startQuoteRegExp = /^[\'\"]/;
  var endQuoteRegExp = /[\'\"]$/;
  var filters = [];
  var words = filterString.split(' ');

  var inQuote = false;
  var quotedWord = '';
  _.each(words, function (word) {
    if (inQuote) {
      if (endQuoteRegExp.test(word)) {
        filters.push(quotedWord + ' ' + word.slice(0, word.length - 1));
        inQuote = false;
        quotedWord = '';
      } else {
        quotedWord = quotedWord + ' ' + word;
      }
    } else if (startQuoteRegExp.test(word)) {
      if (endQuoteRegExp.test(word)) {
        filters.push(word.slice(1, word.length - 1));
      } else {
        inQuote = true;
        quotedWord = word.slice(1, word.length);
      }
    } else {
      filters.push(word);
    }
  });
  return filters;
};

var escapeRegex = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

var getFieldMatches = function (field) {
  var fieldMatches = [];
  var keys = field.split('.');
  var previousKeys = '';
  _.each(keys, function (key) {
    fieldMatches.push(previousKeys + key);
    previousKeys += key + '.';
  });
  var extraMatch = field.replace(/\.\d+\./g, ".");
  if (fieldMatches.indexOf(extraMatch) === -1) fieldMatches.push(extraMatch);
  return fieldMatches;
};

getFilterQuery = function (filterInputs, filterFields, settings) {
  settings = settings || {};
  if (settings.enableRegex === undefined) {
    settings.enableRegex = false;
  }
  if (settings.filterOperator === undefined) {
    settings.filterOperator = "$and";
  }
  if (settings.fields) {
    _.each(filterInputs, function (filter, index) {
      if (_.any(settings.fields, function (include) { return include; })) {
        filterFields[index] = _.filter(filterFields[index], function (field) {
          return _.any(getFieldMatches(field), function (fieldMatch) {
            // ensure that the _id field is filtered on, even if it is not explicitly mentioned
            if (fieldMatch === "_id") return true;
            return settings.fields[fieldMatch];
          });
        });
      } else {
        filterFields[index] = _.filter(filterFields[index], function (field) {
          return _.all(getFieldMatches(field), function (fieldMatch) {
            return _.isUndefined(settings.fields[fieldMatch]) || settings.fields[fieldMatch];
          });
        });
      }
    });
  }
  var numberRegExp = /^\d+$/;
  var queryList = [];
  _.each(filterInputs, function (filter, index) {
    if (filter) {
      if (_.isObject(filter)) {
        var fieldQueries = _.map(filterFields[index], function (field) {
          var query = {};
          query[field] = filter;
          return query;
        });
        if (fieldQueries.length) {
            queryList.push({'$or': fieldQueries});
          }
      } else {
        var filters = parseFilterString(filter);
        _.each(filters, function (filterWord) {
          if (settings.enableRegex === false) {
            filterWord = escapeRegex(filterWord);
          }
          var filterQueryList = [];
          _.each(filterFields[index], function (field) {
            var filterRegExp = new RegExp(filterWord, 'i');
            var query = {};
            query[field] = filterRegExp;
            filterQueryList.push(query);

            if (numberRegExp.test(filterWord)) {
              var numberQuery = {};
              numberQuery[field] = parseInt(filterWord, 10);
              filterQueryList.push(numberQuery);
            }

            if (filterWord === "true") {
              var boolQuery = {};
              boolQuery[field] = true;
              filterQueryList.push(boolQuery);
            } else if (filterWord === "false") {
              var boolQuery = {};
              boolQuery[field] = false;
              filterQueryList.push(boolQuery);
            }
          });

          if (filterQueryList.length) {
            var filterQuery = {'$or': filterQueryList};
            queryList.push(filterQuery);
          }
        });
      }
    }
  });

  var query = {};

  if(queryList.length) {
    query[settings.filterOperator] = queryList;
  }

  return query;
};

if (Meteor.isClient) {
  ReactiveTable = ReactiveTable || {};

  var reactiveTableFilters = {};
  var callbacks = {};

  ReactiveTable.Filter = function (id, fields) {
    if (reactiveTableFilters[id]) {
      reactiveTableFilters[id].fields = fields;
      return reactiveTableFilters[id];
    }

    var filter = new ReactiveVar();

    this.fields = fields;

    this.get = function () {
      return filter.get() || '';
    };

    this.set = function (filterString) {
      filter.set(filterString);
      _.each(callbacks[id], function (callback) {
        callback();
      });
    };

    reactiveTableFilters[id] = this;
  };

  ReactiveTable.clearFilters = function (filterIds) {
    _.each(filterIds, function (filterId) {
      if (reactiveTableFilters[filterId]) {
        reactiveTableFilters[filterId].set('');
      }
    });
  };

  dependOnFilters = function (filterIds, callback) {
    _.each(filterIds, function (filterId) {
      if (_.isUndefined(callbacks[filterId])) {
        callbacks[filterId] = [];
      }
      callbacks[filterId].push(callback);
    });
  };

  getFilterStrings = function (filterIds) {
    return _.map(filterIds, function (filterId) {
      if (_.isUndefined(reactiveTableFilters[filterId])) {
        reactiveTableFilters[filterId] = new ReactiveTable.Filter(filterId);
      }
      return reactiveTableFilters[filterId].get();
    });
  };

  getFilterFields = function (filterIds, allFields) {
    return _.map(filterIds, function (filterId) {
      if (_.isUndefined(reactiveTableFilters[filterId])) {
        return _.map(allFields, function (field) { return field.key; });
      } else if (_.isEmpty(reactiveTableFilters[filterId].fields)) {
        return _.map(allFields, function (field) { return field.key; });
      } else {
        return reactiveTableFilters[filterId].fields;
      }
    });
  };

  Template.reactiveTableFilter.helpers({
    'class': function () {
      return this.class || 'input-group';
    },

    'filter': function () {
      if (_.isUndefined(reactiveTableFilters[this.id])) {
        new ReactiveTable.Filter(this.id, this.fields);
      } else if (_.isUndefined(reactiveTableFilters[this.id].fields)) {
        reactiveTableFilters[this.id].fields = this.fields;
      }
      return reactiveTableFilters[this.id].get();
    }
  });

  var updateFilter = _.debounce(function (template, filterText) {
    reactiveTableFilters[template.data.id].set(filterText);
  }, 200);

  Template.reactiveTableFilter.events({
    'keyup .reactive-table-input, input .reactive-table-input': function (event) {
      var template = Template.instance();
      var filterText = $(event.target).val();
      updateFilter(template, filterText);
    },
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/aslagle_reactive-table/lib/server.js                                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
ReactiveTable = {};

ReactiveTable.publish = function (name, collectionOrFunction, selectorOrFunction, settings) {
    Meteor.publish("reactive-table-" + name, function (publicationId, filters, fields, options, rowsPerPage) {
      check(publicationId, String);
      check(filters, [Match.OneOf(String, Object, Mongo.ObjectID)]);
      check(fields, [[String]]);
      check(options, {skip: Match.Integer, limit: Match.Integer, sort: Object});
      check(rowsPerPage, Match.Integer);

      var collection;
      var selector;

      if (_.isFunction(collectionOrFunction)) {
        collection = collectionOrFunction.call(this);
      } else {
        collection = collectionOrFunction;
      }

      if (!(collection instanceof Mongo.Collection)) {
        console.log("ReactiveTable.publish: no collection to publish");
        return [];
      }

      if (_.isFunction(selectorOrFunction)) {
        selector = selectorOrFunction.call(this);
      } else {
        selector = selectorOrFunction;
      }
      var self = this;
      var filterQuery = _.extend(getFilterQuery(filters, fields, settings), selector);
      if (settings && settings.fields) {
        options.fields = settings.fields;
      }
      var pageCursor = collection.find(filterQuery, options);
      var fullCursor = collection.find(filterQuery);
      var count = fullCursor.count();

      var getRow = function (row, index) {
        return _.extend({
          "reactive-table-id": publicationId,
          "reactive-table-sort": index
        }, row);
      };

      var getRows = function () {
        return _.map(pageCursor.fetch(), getRow);
      };
      var rows = {};
      _.each(getRows(), function (row) {
        rows[row._id] = row;
      });

      var updateRows = function () {
        var newRows = getRows();
        _.each(newRows, function (row, index) {
          var oldRow = rows[row._id];
          if (oldRow) {
            if (!_.isEqual(oldRow, row)) {
              self.changed("reactive-table-rows-" + publicationId, row._id, row);
              rows[row._id] = row;
            }
          } else {
            self.added("reactive-table-rows-" + publicationId, row._id, row);
            rows[row._id] = row;
          }
        });
      };

      self.added("reactive-table-counts", publicationId, {count: count});
      _.each(rows, function (row) {
        self.added("reactive-table-rows-" + publicationId, row._id, row);
      });

      if (!(settings || {}).disableRowReactivity) {
        var initializing = true;

        var handle = pageCursor.observeChanges({
          added: function (id, fields) {
            if (!initializing) {
              updateRows();
            }
          },

          removed: function (id, fields) {
            self.removed("reactive-table-rows-" + publicationId, id);
            delete rows[id];
            updateRows();
          },

          changed: function (id, fields) {
            updateRows();
          }

        });
      }

      if (!(settings || {}).disablePageCountReactivity) {
        var countHandle = fullCursor.observeChanges({
          added: function (id, fields) {
            if (!initializing) {
              self.changed("reactive-table-counts", publicationId, {count: fullCursor.count()});
            }
          },

          removed: function (id, fields) {
            self.changed("reactive-table-counts", publicationId, {count: fullCursor.count()});
          }
        });
      }
      initializing = false;

      self.ready();

      self.onStop(function () {
        if (handle) handle.stop();
        if (countHandle) countHandle.stop();
      });
    });
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("aslagle:reactive-table", {
  ReactiveTable: ReactiveTable
});

})();

(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var check = Package.check.check;
var Match = Package.check.Match;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"aldeed:schema-index":{"lib":{"indexing.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/aldeed_schema-index/lib/indexing.js                                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
// Extend the schema options allowed by SimpleSchema
SimpleSchema.extendOptions({
  index: Match.Optional(Match.OneOf(Number, String, Boolean)),
  unique: Match.Optional(Boolean),
  sparse: Match.Optional(Boolean)
}); // Define validation error messages (legacy)

if (!SimpleSchema.version || SimpleSchema.version < 2) {
  SimpleSchema.messages({
    notUnique: '[label] must be unique'
  });
}

if (Meteor.isServer) {
  Collection2.on('schema.attached', function (collection, ss) {
    // Define validation error messages
    if (ss.version >= 2) {
      ss.messageBox.messages({
        notUnique: '{{label}} must be unique'
      });
    }

    function ensureIndex(index, indexName, unique, sparse) {
      Meteor.startup(function () {
        collection._collection._ensureIndex(index, {
          background: true,
          name: indexName,
          unique: unique,
          sparse: sparse
        });
      });
    }

    function dropIndex(indexName) {
      Meteor.startup(function () {
        try {
          collection._collection._dropIndex(indexName);
        } catch (err) {// no index with that name, which is what we want
        }
      });
    }

    const propName = ss.version === 2 ? 'mergedSchema' : 'schema'; // Loop over fields definitions and ensure collection indexes (server side only)

    _.each(ss[propName](), function (definition, fieldName) {
      if ('index' in definition || definition.unique === true) {
        var index = {},
            indexValue; // If they specified `unique: true` but not `index`,
        // we assume `index: 1` to set up the unique index in mongo

        if ('index' in definition) {
          indexValue = definition.index;
          if (indexValue === true) indexValue = 1;
        } else {
          indexValue = 1;
        }

        var indexName = 'c2_' + fieldName; // In the index object, we want object array keys without the ".$" piece

        var idxFieldName = fieldName.replace(/\.\$\./g, ".");
        index[idxFieldName] = indexValue;
        var unique = !!definition.unique && (indexValue === 1 || indexValue === -1);
        var sparse = definition.sparse || false; // If unique and optional, force sparse to prevent errors

        if (!sparse && unique && definition.optional) sparse = true;

        if (indexValue === false) {
          dropIndex(indexName);
        } else {
          ensureIndex(index, indexName, unique, sparse);
        }
      }
    });
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/aldeed:schema-index/lib/indexing.js");

/* Exports */
Package._define("aldeed:schema-index");

})();

//# sourceURL=meteor://💻app/packages/aldeed_schema-index.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxkZWVkOnNjaGVtYS1pbmRleC9saWIvaW5kZXhpbmcuanMiXSwibmFtZXMiOlsiU2ltcGxlU2NoZW1hIiwiZXh0ZW5kT3B0aW9ucyIsImluZGV4IiwiTWF0Y2giLCJPcHRpb25hbCIsIk9uZU9mIiwiTnVtYmVyIiwiU3RyaW5nIiwiQm9vbGVhbiIsInVuaXF1ZSIsInNwYXJzZSIsInZlcnNpb24iLCJtZXNzYWdlcyIsIm5vdFVuaXF1ZSIsIk1ldGVvciIsImlzU2VydmVyIiwiQ29sbGVjdGlvbjIiLCJvbiIsImNvbGxlY3Rpb24iLCJzcyIsIm1lc3NhZ2VCb3giLCJlbnN1cmVJbmRleCIsImluZGV4TmFtZSIsInN0YXJ0dXAiLCJfY29sbGVjdGlvbiIsIl9lbnN1cmVJbmRleCIsImJhY2tncm91bmQiLCJuYW1lIiwiZHJvcEluZGV4IiwiX2Ryb3BJbmRleCIsImVyciIsInByb3BOYW1lIiwiXyIsImVhY2giLCJkZWZpbml0aW9uIiwiZmllbGROYW1lIiwiaW5kZXhWYWx1ZSIsImlkeEZpZWxkTmFtZSIsInJlcGxhY2UiLCJvcHRpb25hbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxhQUFhQyxhQUFiLENBQTJCO0FBQ3pCQyxTQUFPQyxNQUFNQyxRQUFOLENBQWVELE1BQU1FLEtBQU4sQ0FBWUMsTUFBWixFQUFvQkMsTUFBcEIsRUFBNEJDLE9BQTVCLENBQWYsQ0FEa0I7QUFFekJDLFVBQVFOLE1BQU1DLFFBQU4sQ0FBZUksT0FBZixDQUZpQjtBQUd6QkUsVUFBUVAsTUFBTUMsUUFBTixDQUFlSSxPQUFmO0FBSGlCLENBQTNCLEUsQ0FNQTs7QUFDQSxJQUFJLENBQUNSLGFBQWFXLE9BQWQsSUFBeUJYLGFBQWFXLE9BQWIsR0FBdUIsQ0FBcEQsRUFBdUQ7QUFDckRYLGVBQWFZLFFBQWIsQ0FBc0I7QUFDcEJDLGVBQVc7QUFEUyxHQUF0QjtBQUdEOztBQUVELElBQUlDLE9BQU9DLFFBQVgsRUFBcUI7QUFDbkJDLGNBQVlDLEVBQVosQ0FBZSxpQkFBZixFQUFrQyxVQUFVQyxVQUFWLEVBQXNCQyxFQUF0QixFQUEwQjtBQUMxRDtBQUNBLFFBQUlBLEdBQUdSLE9BQUgsSUFBYyxDQUFsQixFQUFxQjtBQUNuQlEsU0FBR0MsVUFBSCxDQUFjUixRQUFkLENBQXVCO0FBQ3JCQyxtQkFBVztBQURVLE9BQXZCO0FBR0Q7O0FBRUQsYUFBU1EsV0FBVCxDQUFxQm5CLEtBQXJCLEVBQTRCb0IsU0FBNUIsRUFBdUNiLE1BQXZDLEVBQStDQyxNQUEvQyxFQUF1RDtBQUNyREksYUFBT1MsT0FBUCxDQUFlLFlBQVk7QUFDekJMLG1CQUFXTSxXQUFYLENBQXVCQyxZQUF2QixDQUFvQ3ZCLEtBQXBDLEVBQTJDO0FBQ3pDd0Isc0JBQVksSUFENkI7QUFFekNDLGdCQUFNTCxTQUZtQztBQUd6Q2Isa0JBQVFBLE1BSGlDO0FBSXpDQyxrQkFBUUE7QUFKaUMsU0FBM0M7QUFNRCxPQVBEO0FBUUQ7O0FBRUQsYUFBU2tCLFNBQVQsQ0FBbUJOLFNBQW5CLEVBQThCO0FBQzVCUixhQUFPUyxPQUFQLENBQWUsWUFBWTtBQUN6QixZQUFJO0FBQ0ZMLHFCQUFXTSxXQUFYLENBQXVCSyxVQUF2QixDQUFrQ1AsU0FBbEM7QUFDRCxTQUZELENBRUUsT0FBT1EsR0FBUCxFQUFZLENBQ1o7QUFDRDtBQUNGLE9BTkQ7QUFPRDs7QUFFRCxVQUFNQyxXQUFXWixHQUFHUixPQUFILEtBQWUsQ0FBZixHQUFtQixjQUFuQixHQUFvQyxRQUFyRCxDQTdCMEQsQ0ErQjFEOztBQUNBcUIsTUFBRUMsSUFBRixDQUFPZCxHQUFHWSxRQUFILEdBQVAsRUFBdUIsVUFBU0csVUFBVCxFQUFxQkMsU0FBckIsRUFBZ0M7QUFDckQsVUFBSSxXQUFXRCxVQUFYLElBQXlCQSxXQUFXekIsTUFBWCxLQUFzQixJQUFuRCxFQUF5RDtBQUN2RCxZQUFJUCxRQUFRLEVBQVo7QUFBQSxZQUFnQmtDLFVBQWhCLENBRHVELENBRXZEO0FBQ0E7O0FBQ0EsWUFBSSxXQUFXRixVQUFmLEVBQTJCO0FBQ3pCRSx1QkFBYUYsV0FBV2hDLEtBQXhCO0FBQ0EsY0FBSWtDLGVBQWUsSUFBbkIsRUFBeUJBLGFBQWEsQ0FBYjtBQUMxQixTQUhELE1BR087QUFDTEEsdUJBQWEsQ0FBYjtBQUNEOztBQUNELFlBQUlkLFlBQVksUUFBUWEsU0FBeEIsQ0FWdUQsQ0FXdkQ7O0FBQ0EsWUFBSUUsZUFBZUYsVUFBVUcsT0FBVixDQUFrQixTQUFsQixFQUE2QixHQUE3QixDQUFuQjtBQUNBcEMsY0FBTW1DLFlBQU4sSUFBc0JELFVBQXRCO0FBQ0EsWUFBSTNCLFNBQVMsQ0FBQyxDQUFDeUIsV0FBV3pCLE1BQWIsS0FBd0IyQixlQUFlLENBQWYsSUFBb0JBLGVBQWUsQ0FBQyxDQUE1RCxDQUFiO0FBQ0EsWUFBSTFCLFNBQVN3QixXQUFXeEIsTUFBWCxJQUFxQixLQUFsQyxDQWZ1RCxDQWlCdkQ7O0FBQ0EsWUFBSSxDQUFDQSxNQUFELElBQVdELE1BQVgsSUFBcUJ5QixXQUFXSyxRQUFwQyxFQUE4QzdCLFNBQVMsSUFBVDs7QUFFOUMsWUFBSTBCLGVBQWUsS0FBbkIsRUFBMEI7QUFDeEJSLG9CQUFVTixTQUFWO0FBQ0QsU0FGRCxNQUVPO0FBQ0xELHNCQUFZbkIsS0FBWixFQUFtQm9CLFNBQW5CLEVBQThCYixNQUE5QixFQUFzQ0MsTUFBdEM7QUFDRDtBQUNGO0FBQ0YsS0EzQkQ7QUE0QkQsR0E1REQ7QUE2REQsQyIsImZpbGUiOiIvcGFja2FnZXMvYWxkZWVkX3NjaGVtYS1pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEV4dGVuZCB0aGUgc2NoZW1hIG9wdGlvbnMgYWxsb3dlZCBieSBTaW1wbGVTY2hlbWFcblNpbXBsZVNjaGVtYS5leHRlbmRPcHRpb25zKHtcbiAgaW5kZXg6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKE51bWJlciwgU3RyaW5nLCBCb29sZWFuKSksXG4gIHVuaXF1ZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHNwYXJzZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG59KTtcblxuLy8gRGVmaW5lIHZhbGlkYXRpb24gZXJyb3IgbWVzc2FnZXMgKGxlZ2FjeSlcbmlmICghU2ltcGxlU2NoZW1hLnZlcnNpb24gfHwgU2ltcGxlU2NoZW1hLnZlcnNpb24gPCAyKSB7XG4gIFNpbXBsZVNjaGVtYS5tZXNzYWdlcyh7XG4gICAgbm90VW5pcXVlOiAnW2xhYmVsXSBtdXN0IGJlIHVuaXF1ZScsXG4gIH0pO1xufVxuXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gIENvbGxlY3Rpb24yLm9uKCdzY2hlbWEuYXR0YWNoZWQnLCBmdW5jdGlvbiAoY29sbGVjdGlvbiwgc3MpIHtcbiAgICAvLyBEZWZpbmUgdmFsaWRhdGlvbiBlcnJvciBtZXNzYWdlc1xuICAgIGlmIChzcy52ZXJzaW9uID49IDIpIHtcbiAgICAgIHNzLm1lc3NhZ2VCb3gubWVzc2FnZXMoe1xuICAgICAgICBub3RVbmlxdWU6ICd7e2xhYmVsfX0gbXVzdCBiZSB1bmlxdWUnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5zdXJlSW5kZXgoaW5kZXgsIGluZGV4TmFtZSwgdW5pcXVlLCBzcGFyc2UpIHtcbiAgICAgIE1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29sbGVjdGlvbi5fY29sbGVjdGlvbi5fZW5zdXJlSW5kZXgoaW5kZXgsIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0cnVlLFxuICAgICAgICAgIG5hbWU6IGluZGV4TmFtZSxcbiAgICAgICAgICB1bmlxdWU6IHVuaXF1ZSxcbiAgICAgICAgICBzcGFyc2U6IHNwYXJzZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRyb3BJbmRleChpbmRleE5hbWUpIHtcbiAgICAgIE1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb2xsZWN0aW9uLl9jb2xsZWN0aW9uLl9kcm9wSW5kZXgoaW5kZXhOYW1lKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gbm8gaW5kZXggd2l0aCB0aGF0IG5hbWUsIHdoaWNoIGlzIHdoYXQgd2Ugd2FudFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wTmFtZSA9IHNzLnZlcnNpb24gPT09IDIgPyAnbWVyZ2VkU2NoZW1hJyA6ICdzY2hlbWEnO1xuXG4gICAgLy8gTG9vcCBvdmVyIGZpZWxkcyBkZWZpbml0aW9ucyBhbmQgZW5zdXJlIGNvbGxlY3Rpb24gaW5kZXhlcyAoc2VydmVyIHNpZGUgb25seSlcbiAgICBfLmVhY2goc3NbcHJvcE5hbWVdKCksIGZ1bmN0aW9uKGRlZmluaXRpb24sIGZpZWxkTmFtZSkge1xuICAgICAgaWYgKCdpbmRleCcgaW4gZGVmaW5pdGlvbiB8fCBkZWZpbml0aW9uLnVuaXF1ZSA9PT0gdHJ1ZSkge1xuICAgICAgICB2YXIgaW5kZXggPSB7fSwgaW5kZXhWYWx1ZTtcbiAgICAgICAgLy8gSWYgdGhleSBzcGVjaWZpZWQgYHVuaXF1ZTogdHJ1ZWAgYnV0IG5vdCBgaW5kZXhgLFxuICAgICAgICAvLyB3ZSBhc3N1bWUgYGluZGV4OiAxYCB0byBzZXQgdXAgdGhlIHVuaXF1ZSBpbmRleCBpbiBtb25nb1xuICAgICAgICBpZiAoJ2luZGV4JyBpbiBkZWZpbml0aW9uKSB7XG4gICAgICAgICAgaW5kZXhWYWx1ZSA9IGRlZmluaXRpb24uaW5kZXg7XG4gICAgICAgICAgaWYgKGluZGV4VmFsdWUgPT09IHRydWUpIGluZGV4VmFsdWUgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4VmFsdWUgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleE5hbWUgPSAnYzJfJyArIGZpZWxkTmFtZTtcbiAgICAgICAgLy8gSW4gdGhlIGluZGV4IG9iamVjdCwgd2Ugd2FudCBvYmplY3QgYXJyYXkga2V5cyB3aXRob3V0IHRoZSBcIi4kXCIgcGllY2VcbiAgICAgICAgdmFyIGlkeEZpZWxkTmFtZSA9IGZpZWxkTmFtZS5yZXBsYWNlKC9cXC5cXCRcXC4vZywgXCIuXCIpO1xuICAgICAgICBpbmRleFtpZHhGaWVsZE5hbWVdID0gaW5kZXhWYWx1ZTtcbiAgICAgICAgdmFyIHVuaXF1ZSA9ICEhZGVmaW5pdGlvbi51bmlxdWUgJiYgKGluZGV4VmFsdWUgPT09IDEgfHwgaW5kZXhWYWx1ZSA9PT0gLTEpO1xuICAgICAgICB2YXIgc3BhcnNlID0gZGVmaW5pdGlvbi5zcGFyc2UgfHwgZmFsc2U7XG5cbiAgICAgICAgLy8gSWYgdW5pcXVlIGFuZCBvcHRpb25hbCwgZm9yY2Ugc3BhcnNlIHRvIHByZXZlbnQgZXJyb3JzXG4gICAgICAgIGlmICghc3BhcnNlICYmIHVuaXF1ZSAmJiBkZWZpbml0aW9uLm9wdGlvbmFsKSBzcGFyc2UgPSB0cnVlO1xuXG4gICAgICAgIGlmIChpbmRleFZhbHVlID09PSBmYWxzZSkge1xuICAgICAgICAgIGRyb3BJbmRleChpbmRleE5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVuc3VyZUluZGV4KGluZGV4LCBpbmRleE5hbWUsIHVuaXF1ZSwgc3BhcnNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0iXX0=

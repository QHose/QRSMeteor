(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var IdMap;

var require = meteorInstall({"node_modules":{"meteor":{"id-map":{"id-map.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/id-map/id-map.js                                                              //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
module.export({
  IdMap: () => IdMap
});
const hasOwn = Object.prototype.hasOwnProperty;

class IdMap {
  constructor(idStringify, idParse) {
    this.clear();
    this._idStringify = idStringify || JSON.stringify;
    this._idParse = idParse || JSON.parse;
  } // Some of these methods are designed to match methods on OrderedDict, since
  // (eg) ObserveMultiplex and _CachingChangeObserver use them interchangeably.
  // (Conceivably, this should be replaced with "UnorderedDict" with a specific
  // set of methods that overlap between the two.)


  get(id) {
    var key = this._idStringify(id);

    return this._map[key];
  }

  set(id, value) {
    var key = this._idStringify(id);

    this._map[key] = value;
  }

  remove(id) {
    var key = this._idStringify(id);

    delete this._map[key];
  }

  has(id) {
    var key = this._idStringify(id);

    return hasOwn.call(this._map, key);
  }

  empty() {
    for (let key in this._map) {
      return false;
    }

    return true;
  }

  clear() {
    this._map = Object.create(null);
  } // Iterates over the items in the map. Return `false` to break the loop.


  forEach(iterator) {
    // don't use _.each, because we can't break out of it.
    var keys = Object.keys(this._map);

    for (var i = 0; i < keys.length; i++) {
      var breakIfFalse = iterator.call(null, this._map[keys[i]], this._idParse(keys[i]));

      if (breakIfFalse === false) {
        return;
      }
    }
  }

  size() {
    return Object.keys(this._map).length;
  }

  setDefault(id, def) {
    var key = this._idStringify(id);

    if (hasOwn.call(this._map, key)) {
      return this._map[key];
    }

    this._map[key] = def;
    return def;
  } // Assumes that values are EJSON-cloneable, and that we don't need to clone
  // IDs (ie, that nobody is going to mutate an ObjectId).


  clone() {
    var clone = new IdMap(this._idStringify, this._idParse);
    this.forEach(function (value, id) {
      clone.set(id, EJSON.clone(value));
    });
    return clone;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/id-map/id-map.js");

/* Exports */
Package._define("id-map", exports, {
  IdMap: IdMap
});

})();

//# sourceURL=meteor://💻app/packages/id-map.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvaWQtbWFwL2lkLW1hcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJJZE1hcCIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY29uc3RydWN0b3IiLCJpZFN0cmluZ2lmeSIsImlkUGFyc2UiLCJjbGVhciIsIl9pZFN0cmluZ2lmeSIsIkpTT04iLCJzdHJpbmdpZnkiLCJfaWRQYXJzZSIsInBhcnNlIiwiZ2V0IiwiaWQiLCJrZXkiLCJfbWFwIiwic2V0IiwidmFsdWUiLCJyZW1vdmUiLCJoYXMiLCJjYWxsIiwiZW1wdHkiLCJjcmVhdGUiLCJmb3JFYWNoIiwiaXRlcmF0b3IiLCJrZXlzIiwiaSIsImxlbmd0aCIsImJyZWFrSWZGYWxzZSIsInNpemUiLCJzZXREZWZhdWx0IiwiZGVmIiwiY2xvbmUiLCJFSlNPTiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLFNBQU0sTUFBSUE7QUFBWCxDQUFkO0FBQUEsTUFBTUMsU0FBU0MsT0FBT0MsU0FBUCxDQUFpQkMsY0FBaEM7O0FBRU8sTUFBTUosS0FBTixDQUFZO0FBQ2pCSyxjQUFZQyxXQUFaLEVBQXlCQyxPQUF6QixFQUFrQztBQUNoQyxTQUFLQyxLQUFMO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQkgsZUFBZUksS0FBS0MsU0FBeEM7QUFDQSxTQUFLQyxRQUFMLEdBQWdCTCxXQUFXRyxLQUFLRyxLQUFoQztBQUNELEdBTGdCLENBT25CO0FBQ0E7QUFDQTtBQUNBOzs7QUFFRUMsTUFBSUMsRUFBSixFQUFRO0FBQ04sUUFBSUMsTUFBTSxLQUFLUCxZQUFMLENBQWtCTSxFQUFsQixDQUFWOztBQUNBLFdBQU8sS0FBS0UsSUFBTCxDQUFVRCxHQUFWLENBQVA7QUFDRDs7QUFFREUsTUFBSUgsRUFBSixFQUFRSSxLQUFSLEVBQWU7QUFDYixRQUFJSCxNQUFNLEtBQUtQLFlBQUwsQ0FBa0JNLEVBQWxCLENBQVY7O0FBQ0EsU0FBS0UsSUFBTCxDQUFVRCxHQUFWLElBQWlCRyxLQUFqQjtBQUNEOztBQUVEQyxTQUFPTCxFQUFQLEVBQVc7QUFDVCxRQUFJQyxNQUFNLEtBQUtQLFlBQUwsQ0FBa0JNLEVBQWxCLENBQVY7O0FBQ0EsV0FBTyxLQUFLRSxJQUFMLENBQVVELEdBQVYsQ0FBUDtBQUNEOztBQUVESyxNQUFJTixFQUFKLEVBQVE7QUFDTixRQUFJQyxNQUFNLEtBQUtQLFlBQUwsQ0FBa0JNLEVBQWxCLENBQVY7O0FBQ0EsV0FBT2QsT0FBT3FCLElBQVAsQ0FBWSxLQUFLTCxJQUFqQixFQUF1QkQsR0FBdkIsQ0FBUDtBQUNEOztBQUVETyxVQUFRO0FBQ04sU0FBSyxJQUFJUCxHQUFULElBQWdCLEtBQUtDLElBQXJCLEVBQTJCO0FBQ3pCLGFBQU8sS0FBUDtBQUNEOztBQUNELFdBQU8sSUFBUDtBQUNEOztBQUVEVCxVQUFRO0FBQ04sU0FBS1MsSUFBTCxHQUFZZixPQUFPc0IsTUFBUCxDQUFjLElBQWQsQ0FBWjtBQUNELEdBekNnQixDQTJDakI7OztBQUNBQyxVQUFRQyxRQUFSLEVBQWtCO0FBQ2hCO0FBQ0EsUUFBSUMsT0FBT3pCLE9BQU95QixJQUFQLENBQVksS0FBS1YsSUFBakIsQ0FBWDs7QUFDQSxTQUFLLElBQUlXLElBQUksQ0FBYixFQUFnQkEsSUFBSUQsS0FBS0UsTUFBekIsRUFBaUNELEdBQWpDLEVBQXNDO0FBQ3BDLFVBQUlFLGVBQWVKLFNBQVNKLElBQVQsQ0FDakIsSUFEaUIsRUFFakIsS0FBS0wsSUFBTCxDQUFVVSxLQUFLQyxDQUFMLENBQVYsQ0FGaUIsRUFHakIsS0FBS2hCLFFBQUwsQ0FBY2UsS0FBS0MsQ0FBTCxDQUFkLENBSGlCLENBQW5COztBQUtBLFVBQUlFLGlCQUFpQixLQUFyQixFQUE0QjtBQUMxQjtBQUNEO0FBQ0Y7QUFDRjs7QUFFREMsU0FBTztBQUNMLFdBQU83QixPQUFPeUIsSUFBUCxDQUFZLEtBQUtWLElBQWpCLEVBQXVCWSxNQUE5QjtBQUNEOztBQUVERyxhQUFXakIsRUFBWCxFQUFla0IsR0FBZixFQUFvQjtBQUNsQixRQUFJakIsTUFBTSxLQUFLUCxZQUFMLENBQWtCTSxFQUFsQixDQUFWOztBQUNBLFFBQUlkLE9BQU9xQixJQUFQLENBQVksS0FBS0wsSUFBakIsRUFBdUJELEdBQXZCLENBQUosRUFBaUM7QUFDL0IsYUFBTyxLQUFLQyxJQUFMLENBQVVELEdBQVYsQ0FBUDtBQUNEOztBQUNELFNBQUtDLElBQUwsQ0FBVUQsR0FBVixJQUFpQmlCLEdBQWpCO0FBQ0EsV0FBT0EsR0FBUDtBQUNELEdBdEVnQixDQXdFakI7QUFDQTs7O0FBQ0FDLFVBQVE7QUFDTixRQUFJQSxRQUFRLElBQUlsQyxLQUFKLENBQVUsS0FBS1MsWUFBZixFQUE2QixLQUFLRyxRQUFsQyxDQUFaO0FBQ0EsU0FBS2EsT0FBTCxDQUFhLFVBQVVOLEtBQVYsRUFBaUJKLEVBQWpCLEVBQXFCO0FBQ2hDbUIsWUFBTWhCLEdBQU4sQ0FBVUgsRUFBVixFQUFjb0IsTUFBTUQsS0FBTixDQUFZZixLQUFaLENBQWQ7QUFDRCxLQUZEO0FBR0EsV0FBT2UsS0FBUDtBQUNEOztBQWhGZ0IsQyIsImZpbGUiOiIvcGFja2FnZXMvaWQtbWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZXhwb3J0IGNsYXNzIElkTWFwIHtcbiAgY29uc3RydWN0b3IoaWRTdHJpbmdpZnksIGlkUGFyc2UpIHtcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5faWRTdHJpbmdpZnkgPSBpZFN0cmluZ2lmeSB8fCBKU09OLnN0cmluZ2lmeTtcbiAgICB0aGlzLl9pZFBhcnNlID0gaWRQYXJzZSB8fCBKU09OLnBhcnNlO1xuICB9XG5cbi8vIFNvbWUgb2YgdGhlc2UgbWV0aG9kcyBhcmUgZGVzaWduZWQgdG8gbWF0Y2ggbWV0aG9kcyBvbiBPcmRlcmVkRGljdCwgc2luY2Vcbi8vIChlZykgT2JzZXJ2ZU11bHRpcGxleCBhbmQgX0NhY2hpbmdDaGFuZ2VPYnNlcnZlciB1c2UgdGhlbSBpbnRlcmNoYW5nZWFibHkuXG4vLyAoQ29uY2VpdmFibHksIHRoaXMgc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGggXCJVbm9yZGVyZWREaWN0XCIgd2l0aCBhIHNwZWNpZmljXG4vLyBzZXQgb2YgbWV0aG9kcyB0aGF0IG92ZXJsYXAgYmV0d2VlbiB0aGUgdHdvLilcblxuICBnZXQoaWQpIHtcbiAgICB2YXIga2V5ID0gdGhpcy5faWRTdHJpbmdpZnkoaWQpO1xuICAgIHJldHVybiB0aGlzLl9tYXBba2V5XTtcbiAgfVxuXG4gIHNldChpZCwgdmFsdWUpIHtcbiAgICB2YXIga2V5ID0gdGhpcy5faWRTdHJpbmdpZnkoaWQpO1xuICAgIHRoaXMuX21hcFtrZXldID0gdmFsdWU7XG4gIH1cblxuICByZW1vdmUoaWQpIHtcbiAgICB2YXIga2V5ID0gdGhpcy5faWRTdHJpbmdpZnkoaWQpO1xuICAgIGRlbGV0ZSB0aGlzLl9tYXBba2V5XTtcbiAgfVxuXG4gIGhhcyhpZCkge1xuICAgIHZhciBrZXkgPSB0aGlzLl9pZFN0cmluZ2lmeShpZCk7XG4gICAgcmV0dXJuIGhhc093bi5jYWxsKHRoaXMuX21hcCwga2V5KTtcbiAgfVxuXG4gIGVtcHR5KCkge1xuICAgIGZvciAobGV0IGtleSBpbiB0aGlzLl9tYXApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLl9tYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB9XG5cbiAgLy8gSXRlcmF0ZXMgb3ZlciB0aGUgaXRlbXMgaW4gdGhlIG1hcC4gUmV0dXJuIGBmYWxzZWAgdG8gYnJlYWsgdGhlIGxvb3AuXG4gIGZvckVhY2goaXRlcmF0b3IpIHtcbiAgICAvLyBkb24ndCB1c2UgXy5lYWNoLCBiZWNhdXNlIHdlIGNhbid0IGJyZWFrIG91dCBvZiBpdC5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuX21hcCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYnJlYWtJZkZhbHNlID0gaXRlcmF0b3IuY2FsbChcbiAgICAgICAgbnVsbCxcbiAgICAgICAgdGhpcy5fbWFwW2tleXNbaV1dLFxuICAgICAgICB0aGlzLl9pZFBhcnNlKGtleXNbaV0pXG4gICAgICApO1xuICAgICAgaWYgKGJyZWFrSWZGYWxzZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNpemUoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX21hcCkubGVuZ3RoO1xuICB9XG5cbiAgc2V0RGVmYXVsdChpZCwgZGVmKSB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2lkU3RyaW5naWZ5KGlkKTtcbiAgICBpZiAoaGFzT3duLmNhbGwodGhpcy5fbWFwLCBrZXkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwW2tleV07XG4gICAgfVxuICAgIHRoaXMuX21hcFtrZXldID0gZGVmO1xuICAgIHJldHVybiBkZWY7XG4gIH1cblxuICAvLyBBc3N1bWVzIHRoYXQgdmFsdWVzIGFyZSBFSlNPTi1jbG9uZWFibGUsIGFuZCB0aGF0IHdlIGRvbid0IG5lZWQgdG8gY2xvbmVcbiAgLy8gSURzIChpZSwgdGhhdCBub2JvZHkgaXMgZ29pbmcgdG8gbXV0YXRlIGFuIE9iamVjdElkKS5cbiAgY2xvbmUoKSB7XG4gICAgdmFyIGNsb25lID0gbmV3IElkTWFwKHRoaXMuX2lkU3RyaW5naWZ5LCB0aGlzLl9pZFBhcnNlKTtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBpZCkge1xuICAgICAgY2xvbmUuc2V0KGlkLCBFSlNPTi5jbG9uZSh2YWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxufVxuIl19

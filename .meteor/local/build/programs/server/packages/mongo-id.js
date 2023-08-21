(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EJSON = Package.ejson.EJSON;
var IdMap = Package['id-map'].IdMap;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var hexString, MongoID;

var require = meteorInstall({"node_modules":{"meteor":{"mongo-id":{"id.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/mongo-id/id.js                                                                   //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
module.export({
  MongoID: () => MongoID
});
let EJSON;
module.watch(require("meteor/ejson"), {
  EJSON(v) {
    EJSON = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);
const MongoID = {};

MongoID._looksLikeObjectID = str => str.length === 24 && str.match(/^[0-9a-f]*$/);

MongoID.ObjectID = class ObjectID {
  constructor(hexString) {
    //random-based impl of Mongo ObjectID
    if (hexString) {
      hexString = hexString.toLowerCase();

      if (!MongoID._looksLikeObjectID(hexString)) {
        throw new Error('Invalid hexadecimal string for creating an ObjectID');
      } // meant to work with _.isEqual(), which relies on structural equality


      this._str = hexString;
    } else {
      this._str = Random.hexString(24);
    }
  }

  equals(other) {
    return other instanceof MongoID.ObjectID && this.valueOf() === other.valueOf();
  }

  toString() {
    return `ObjectID("${this._str}")`;
  }

  clone() {
    return new MongoID.ObjectID(this._str);
  }

  typeName() {
    return 'oid';
  }

  getTimestamp() {
    return Number.parseInt(this._str.substr(0, 8), 16);
  }

  valueOf() {
    return this._str;
  }

  toJSONValue() {
    return this.valueOf();
  }

  toHexString() {
    return this.valueOf();
  }

};
EJSON.addType('oid', str => new MongoID.ObjectID(str));

MongoID.idStringify = id => {
  if (id instanceof MongoID.ObjectID) {
    return id.valueOf();
  } else if (typeof id === 'string') {
    if (id === '') {
      return id;
    } else if (id.startsWith('-') || // escape previously dashed strings
    id.startsWith('~') || // escape escaped numbers, true, false
    MongoID._looksLikeObjectID(id) || // escape object-id-form strings
    id.startsWith('{')) {
      // escape object-form strings, for maybe implementing later
      return `-${id}`;
    } else {
      return id; // other strings go through unchanged.
    }
  } else if (id === undefined) {
    return '-';
  } else if (typeof id === 'object' && id !== null) {
    throw new Error('Meteor does not currently support objects other than ObjectID as ids');
  } else {
    // Numbers, true, false, null
    return `~${JSON.stringify(id)}`;
  }
};

MongoID.idParse = id => {
  if (id === '') {
    return id;
  } else if (id === '-') {
    return undefined;
  } else if (id.startsWith('-')) {
    return id.substr(1);
  } else if (id.startsWith('~')) {
    return JSON.parse(id.substr(1));
  } else if (MongoID._looksLikeObjectID(id)) {
    return new MongoID.ObjectID(id);
  } else {
    return id;
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/mongo-id/id.js");

/* Exports */
Package._define("mongo-id", exports, {
  MongoID: MongoID
});

})();

//# sourceURL=meteor://💻app/packages/mongo-id.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28taWQvaWQuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiTW9uZ29JRCIsIkVKU09OIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIlJhbmRvbSIsIl9sb29rc0xpa2VPYmplY3RJRCIsInN0ciIsImxlbmd0aCIsIm1hdGNoIiwiT2JqZWN0SUQiLCJjb25zdHJ1Y3RvciIsImhleFN0cmluZyIsInRvTG93ZXJDYXNlIiwiRXJyb3IiLCJfc3RyIiwiZXF1YWxzIiwib3RoZXIiLCJ2YWx1ZU9mIiwidG9TdHJpbmciLCJjbG9uZSIsInR5cGVOYW1lIiwiZ2V0VGltZXN0YW1wIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJzdWJzdHIiLCJ0b0pTT05WYWx1ZSIsInRvSGV4U3RyaW5nIiwiYWRkVHlwZSIsImlkU3RyaW5naWZ5IiwiaWQiLCJzdGFydHNXaXRoIiwidW5kZWZpbmVkIiwiSlNPTiIsInN0cmluZ2lmeSIsImlkUGFyc2UiLCJwYXJzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsV0FBUSxNQUFJQTtBQUFiLENBQWQ7QUFBcUMsSUFBSUMsS0FBSjtBQUFVSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNGLFFBQU1HLENBQU4sRUFBUTtBQUFDSCxZQUFNRyxDQUFOO0FBQVE7O0FBQWxCLENBQXJDLEVBQXlELENBQXpEO0FBQTRELElBQUlDLE1BQUo7QUFBV1AsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDRSxTQUFPRCxDQUFQLEVBQVM7QUFBQ0MsYUFBT0QsQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUd0SCxNQUFNSixVQUFVLEVBQWhCOztBQUVBQSxRQUFRTSxrQkFBUixHQUE2QkMsT0FBT0EsSUFBSUMsTUFBSixLQUFlLEVBQWYsSUFBcUJELElBQUlFLEtBQUosQ0FBVSxhQUFWLENBQXpEOztBQUVBVCxRQUFRVSxRQUFSLEdBQW1CLE1BQU1BLFFBQU4sQ0FBZTtBQUNoQ0MsY0FBYUMsU0FBYixFQUF3QjtBQUN0QjtBQUNBLFFBQUlBLFNBQUosRUFBZTtBQUNiQSxrQkFBWUEsVUFBVUMsV0FBVixFQUFaOztBQUNBLFVBQUksQ0FBQ2IsUUFBUU0sa0JBQVIsQ0FBMkJNLFNBQTNCLENBQUwsRUFBNEM7QUFDMUMsY0FBTSxJQUFJRSxLQUFKLENBQVUscURBQVYsQ0FBTjtBQUNELE9BSlksQ0FLYjs7O0FBQ0EsV0FBS0MsSUFBTCxHQUFZSCxTQUFaO0FBQ0QsS0FQRCxNQU9PO0FBQ0wsV0FBS0csSUFBTCxHQUFZVixPQUFPTyxTQUFQLENBQWlCLEVBQWpCLENBQVo7QUFDRDtBQUNGOztBQUVESSxTQUFPQyxLQUFQLEVBQWM7QUFDWixXQUFPQSxpQkFBaUJqQixRQUFRVSxRQUF6QixJQUNQLEtBQUtRLE9BQUwsT0FBbUJELE1BQU1DLE9BQU4sRUFEbkI7QUFFRDs7QUFFREMsYUFBVztBQUNULFdBQVEsYUFBWSxLQUFLSixJQUFLLElBQTlCO0FBQ0Q7O0FBRURLLFVBQVE7QUFDTixXQUFPLElBQUlwQixRQUFRVSxRQUFaLENBQXFCLEtBQUtLLElBQTFCLENBQVA7QUFDRDs7QUFFRE0sYUFBVztBQUNULFdBQU8sS0FBUDtBQUNEOztBQUVEQyxpQkFBZTtBQUNiLFdBQU9DLE9BQU9DLFFBQVAsQ0FBZ0IsS0FBS1QsSUFBTCxDQUFVVSxNQUFWLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQWhCLEVBQXdDLEVBQXhDLENBQVA7QUFDRDs7QUFFRFAsWUFBVTtBQUNSLFdBQU8sS0FBS0gsSUFBWjtBQUNEOztBQUVEVyxnQkFBYztBQUNaLFdBQU8sS0FBS1IsT0FBTCxFQUFQO0FBQ0Q7O0FBRURTLGdCQUFjO0FBQ1osV0FBTyxLQUFLVCxPQUFMLEVBQVA7QUFDRDs7QUE5QytCLENBQWxDO0FBa0RBakIsTUFBTTJCLE9BQU4sQ0FBYyxLQUFkLEVBQXFCckIsT0FBTyxJQUFJUCxRQUFRVSxRQUFaLENBQXFCSCxHQUFyQixDQUE1Qjs7QUFFQVAsUUFBUTZCLFdBQVIsR0FBdUJDLEVBQUQsSUFBUTtBQUM1QixNQUFJQSxjQUFjOUIsUUFBUVUsUUFBMUIsRUFBb0M7QUFDbEMsV0FBT29CLEdBQUdaLE9BQUgsRUFBUDtBQUNELEdBRkQsTUFFTyxJQUFJLE9BQU9ZLEVBQVAsS0FBYyxRQUFsQixFQUE0QjtBQUNqQyxRQUFJQSxPQUFPLEVBQVgsRUFBZTtBQUNiLGFBQU9BLEVBQVA7QUFDRCxLQUZELE1BRU8sSUFBSUEsR0FBR0MsVUFBSCxDQUFjLEdBQWQsS0FBc0I7QUFDdEJELE9BQUdDLFVBQUgsQ0FBYyxHQUFkLENBREEsSUFDc0I7QUFDdEIvQixZQUFRTSxrQkFBUixDQUEyQndCLEVBQTNCLENBRkEsSUFFa0M7QUFDbENBLE9BQUdDLFVBQUgsQ0FBYyxHQUFkLENBSEosRUFHd0I7QUFBRTtBQUMvQixhQUFRLElBQUdELEVBQUcsRUFBZDtBQUNELEtBTE0sTUFLQTtBQUNMLGFBQU9BLEVBQVAsQ0FESyxDQUNNO0FBQ1o7QUFDRixHQVhNLE1BV0EsSUFBSUEsT0FBT0UsU0FBWCxFQUFzQjtBQUMzQixXQUFPLEdBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSSxPQUFPRixFQUFQLEtBQWMsUUFBZCxJQUEwQkEsT0FBTyxJQUFyQyxFQUEyQztBQUNoRCxVQUFNLElBQUloQixLQUFKLENBQVUsc0VBQVYsQ0FBTjtBQUNELEdBRk0sTUFFQTtBQUFFO0FBQ1AsV0FBUSxJQUFHbUIsS0FBS0MsU0FBTCxDQUFlSixFQUFmLENBQW1CLEVBQTlCO0FBQ0Q7QUFDRixDQXJCRDs7QUF1QkE5QixRQUFRbUMsT0FBUixHQUFtQkwsRUFBRCxJQUFRO0FBQ3hCLE1BQUlBLE9BQU8sRUFBWCxFQUFlO0FBQ2IsV0FBT0EsRUFBUDtBQUNELEdBRkQsTUFFTyxJQUFJQSxPQUFPLEdBQVgsRUFBZ0I7QUFDckIsV0FBT0UsU0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixHQUFHQyxVQUFILENBQWMsR0FBZCxDQUFKLEVBQXdCO0FBQzdCLFdBQU9ELEdBQUdMLE1BQUgsQ0FBVSxDQUFWLENBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSUssR0FBR0MsVUFBSCxDQUFjLEdBQWQsQ0FBSixFQUF3QjtBQUM3QixXQUFPRSxLQUFLRyxLQUFMLENBQVdOLEdBQUdMLE1BQUgsQ0FBVSxDQUFWLENBQVgsQ0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJekIsUUFBUU0sa0JBQVIsQ0FBMkJ3QixFQUEzQixDQUFKLEVBQW9DO0FBQ3pDLFdBQU8sSUFBSTlCLFFBQVFVLFFBQVosQ0FBcUJvQixFQUFyQixDQUFQO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsV0FBT0EsRUFBUDtBQUNEO0FBQ0YsQ0FkRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9tb25nby1pZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVKU09OIH0gZnJvbSAnbWV0ZW9yL2Vqc29uJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuXG5jb25zdCBNb25nb0lEID0ge307XG5cbk1vbmdvSUQuX2xvb2tzTGlrZU9iamVjdElEID0gc3RyID0+IHN0ci5sZW5ndGggPT09IDI0ICYmIHN0ci5tYXRjaCgvXlswLTlhLWZdKiQvKTtcblxuTW9uZ29JRC5PYmplY3RJRCA9IGNsYXNzIE9iamVjdElEIHtcbiAgY29uc3RydWN0b3IgKGhleFN0cmluZykge1xuICAgIC8vcmFuZG9tLWJhc2VkIGltcGwgb2YgTW9uZ28gT2JqZWN0SURcbiAgICBpZiAoaGV4U3RyaW5nKSB7XG4gICAgICBoZXhTdHJpbmcgPSBoZXhTdHJpbmcudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmICghTW9uZ29JRC5fbG9va3NMaWtlT2JqZWN0SUQoaGV4U3RyaW5nKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4YWRlY2ltYWwgc3RyaW5nIGZvciBjcmVhdGluZyBhbiBPYmplY3RJRCcpO1xuICAgICAgfVxuICAgICAgLy8gbWVhbnQgdG8gd29yayB3aXRoIF8uaXNFcXVhbCgpLCB3aGljaCByZWxpZXMgb24gc3RydWN0dXJhbCBlcXVhbGl0eVxuICAgICAgdGhpcy5fc3RyID0gaGV4U3RyaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdHIgPSBSYW5kb20uaGV4U3RyaW5nKDI0KTtcbiAgICB9XG4gIH1cblxuICBlcXVhbHMob3RoZXIpIHtcbiAgICByZXR1cm4gb3RoZXIgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEICYmXG4gICAgdGhpcy52YWx1ZU9mKCkgPT09IG90aGVyLnZhbHVlT2YoKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgT2JqZWN0SUQoXCIke3RoaXMuX3N0cn1cIilgO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25nb0lELk9iamVjdElEKHRoaXMuX3N0cik7XG4gIH1cblxuICB0eXBlTmFtZSgpIHtcbiAgICByZXR1cm4gJ29pZCc7XG4gIH1cbiAgXG4gIGdldFRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gTnVtYmVyLnBhcnNlSW50KHRoaXMuX3N0ci5zdWJzdHIoMCwgOCksIDE2KTtcbiAgfVxuXG4gIHZhbHVlT2YoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0cjtcbiAgfVxuXG4gIHRvSlNPTlZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcbiAgfVxuXG4gIHRvSGV4U3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcbiAgfVxuXG59XG5cbkVKU09OLmFkZFR5cGUoJ29pZCcsIHN0ciA9PiBuZXcgTW9uZ29JRC5PYmplY3RJRChzdHIpKTtcblxuTW9uZ29JRC5pZFN0cmluZ2lmeSA9IChpZCkgPT4ge1xuICBpZiAoaWQgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEKSB7XG4gICAgcmV0dXJuIGlkLnZhbHVlT2YoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKGlkID09PSAnJykge1xuICAgICAgcmV0dXJuIGlkO1xuICAgIH0gZWxzZSBpZiAoaWQuc3RhcnRzV2l0aCgnLScpIHx8IC8vIGVzY2FwZSBwcmV2aW91c2x5IGRhc2hlZCBzdHJpbmdzXG4gICAgICAgICAgICAgICBpZC5zdGFydHNXaXRoKCd+JykgfHwgLy8gZXNjYXBlIGVzY2FwZWQgbnVtYmVycywgdHJ1ZSwgZmFsc2VcbiAgICAgICAgICAgICAgIE1vbmdvSUQuX2xvb2tzTGlrZU9iamVjdElEKGlkKSB8fCAvLyBlc2NhcGUgb2JqZWN0LWlkLWZvcm0gc3RyaW5nc1xuICAgICAgICAgICAgICAgaWQuc3RhcnRzV2l0aCgneycpKSB7IC8vIGVzY2FwZSBvYmplY3QtZm9ybSBzdHJpbmdzLCBmb3IgbWF5YmUgaW1wbGVtZW50aW5nIGxhdGVyXG4gICAgICByZXR1cm4gYC0ke2lkfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpZDsgLy8gb3RoZXIgc3RyaW5ncyBnbyB0aHJvdWdoIHVuY2hhbmdlZC5cbiAgICB9XG4gIH0gZWxzZSBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAnLSc7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGlkID09PSAnb2JqZWN0JyAmJiBpZCAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0ZW9yIGRvZXMgbm90IGN1cnJlbnRseSBzdXBwb3J0IG9iamVjdHMgb3RoZXIgdGhhbiBPYmplY3RJRCBhcyBpZHMnKTtcbiAgfSBlbHNlIHsgLy8gTnVtYmVycywgdHJ1ZSwgZmFsc2UsIG51bGxcbiAgICByZXR1cm4gYH4ke0pTT04uc3RyaW5naWZ5KGlkKX1gO1xuICB9XG59O1xuXG5Nb25nb0lELmlkUGFyc2UgPSAoaWQpID0+IHtcbiAgaWYgKGlkID09PSAnJykge1xuICAgIHJldHVybiBpZDtcbiAgfSBlbHNlIGlmIChpZCA9PT0gJy0nKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmIChpZC5zdGFydHNXaXRoKCctJykpIHtcbiAgICByZXR1cm4gaWQuc3Vic3RyKDEpO1xuICB9IGVsc2UgaWYgKGlkLnN0YXJ0c1dpdGgoJ34nKSkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGlkLnN1YnN0cigxKSk7XG4gIH0gZWxzZSBpZiAoTW9uZ29JRC5fbG9va3NMaWtlT2JqZWN0SUQoaWQpKSB7XG4gICAgcmV0dXJuIG5ldyBNb25nb0lELk9iamVjdElEKGlkKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbn07XG5cbmV4cG9ydCB7IE1vbmdvSUQgfTtcbiJdfQ==

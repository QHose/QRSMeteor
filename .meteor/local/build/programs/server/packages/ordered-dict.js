(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var OrderedDict;

var require = meteorInstall({"node_modules":{"meteor":{"ordered-dict":{"ordered_dict.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/ordered-dict/ordered_dict.js                                                                //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
module.export({
  OrderedDict: () => OrderedDict
});

// This file defines an ordered dictionary abstraction that is useful for
// maintaining a dataset backed by observeChanges.  It supports ordering items
// by specifying the item they now come before.
// The implementation is a dictionary that contains nodes of a doubly-linked
// list as its values.
// constructs a new element struct
// next and prev are whole elements, not keys.
function element(key, value, next, prev) {
  return {
    key: key,
    value: value,
    next: next,
    prev: prev
  };
}

class OrderedDict {
  constructor(...args) {
    this._dict = Object.create(null);
    this._first = null;
    this._last = null;
    this._size = 0;

    if (typeof args[0] === 'function') {
      this._stringify = args.shift();
    } else {
      this._stringify = function (x) {
        return x;
      };
    }

    args.forEach(kv => this.putBefore(kv[0], kv[1], null));
  } // the "prefix keys with a space" thing comes from here
  // https://github.com/documentcloud/underscore/issues/376#issuecomment-2815649


  _k(key) {
    return " " + this._stringify(key);
  }

  empty() {
    return !this._first;
  }

  size() {
    return this._size;
  }

  _linkEltIn(elt) {
    if (!elt.next) {
      elt.prev = this._last;
      if (this._last) this._last.next = elt;
      this._last = elt;
    } else {
      elt.prev = elt.next.prev;
      elt.next.prev = elt;
      if (elt.prev) elt.prev.next = elt;
    }

    if (this._first === null || this._first === elt.next) this._first = elt;
  }

  _linkEltOut(elt) {
    if (elt.next) elt.next.prev = elt.prev;
    if (elt.prev) elt.prev.next = elt.next;
    if (elt === this._last) this._last = elt.prev;
    if (elt === this._first) this._first = elt.next;
  }

  putBefore(key, item, before) {
    if (this._dict[this._k(key)]) throw new Error("Item " + key + " already present in OrderedDict");
    var elt = before ? element(key, item, this._dict[this._k(before)]) : element(key, item, null);
    if (typeof elt.next === "undefined") throw new Error("could not find item to put this one before");

    this._linkEltIn(elt);

    this._dict[this._k(key)] = elt;
    this._size++;
  }

  append(key, item) {
    this.putBefore(key, item, null);
  }

  remove(key) {
    var elt = this._dict[this._k(key)];

    if (typeof elt === "undefined") throw new Error("Item " + key + " not present in OrderedDict");

    this._linkEltOut(elt);

    this._size--;
    delete this._dict[this._k(key)];
    return elt.value;
  }

  get(key) {
    if (this.has(key)) {
      return this._dict[this._k(key)].value;
    }
  }

  has(key) {
    return Object.prototype.hasOwnProperty.call(this._dict, this._k(key));
  } // Iterate through the items in this dictionary in order, calling
  // iter(value, key, index) on each one.
  // Stops whenever iter returns OrderedDict.BREAK, or after the last element.


  forEach(iter, context = null) {
    var i = 0;
    var elt = this._first;

    while (elt !== null) {
      var b = iter.call(context, elt.value, elt.key, i);
      if (b === OrderedDict.BREAK) return;
      elt = elt.next;
      i++;
    }
  }

  first() {
    if (this.empty()) {
      return;
    }

    return this._first.key;
  }

  firstValue() {
    if (this.empty()) {
      return;
    }

    return this._first.value;
  }

  last() {
    if (this.empty()) {
      return;
    }

    return this._last.key;
  }

  lastValue() {
    if (this.empty()) {
      return;
    }

    return this._last.value;
  }

  prev(key) {
    if (this.has(key)) {
      var elt = this._dict[this._k(key)];

      if (elt.prev) return elt.prev.key;
    }

    return null;
  }

  next(key) {
    if (this.has(key)) {
      var elt = this._dict[this._k(key)];

      if (elt.next) return elt.next.key;
    }

    return null;
  }

  moveBefore(key, before) {
    var elt = this._dict[this._k(key)];

    var eltBefore = before ? this._dict[this._k(before)] : null;

    if (typeof elt === "undefined") {
      throw new Error("Item to move is not present");
    }

    if (typeof eltBefore === "undefined") {
      throw new Error("Could not find element to move this one before");
    }

    if (eltBefore === elt.next) // no moving necessary
      return; // remove from its old place

    this._linkEltOut(elt); // patch into its new place


    elt.next = eltBefore;

    this._linkEltIn(elt);
  } // Linear, sadly.


  indexOf(key) {
    var ret = null;
    this.forEach((v, k, i) => {
      if (this._k(k) === this._k(key)) {
        ret = i;
        return OrderedDict.BREAK;
      }

      return;
    });
    return ret;
  }

  _checkRep() {
    Object.keys(this._dict).forEach(k => {
      const v = this._dict[k];

      if (v.next === v) {
        throw new Error("Next is a loop");
      }

      if (v.prev === v) {
        throw new Error("Prev is a loop");
      }
    });
  }

}

OrderedDict.BREAK = {
  "break": true
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ordered-dict/ordered_dict.js");

/* Exports */
Package._define("ordered-dict", exports, {
  OrderedDict: OrderedDict
});

})();

//# sourceURL=meteor://💻app/packages/ordered-dict.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3JkZXJlZC1kaWN0L29yZGVyZWRfZGljdC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJPcmRlcmVkRGljdCIsImVsZW1lbnQiLCJrZXkiLCJ2YWx1ZSIsIm5leHQiLCJwcmV2IiwiY29uc3RydWN0b3IiLCJhcmdzIiwiX2RpY3QiLCJPYmplY3QiLCJjcmVhdGUiLCJfZmlyc3QiLCJfbGFzdCIsIl9zaXplIiwiX3N0cmluZ2lmeSIsInNoaWZ0IiwieCIsImZvckVhY2giLCJrdiIsInB1dEJlZm9yZSIsIl9rIiwiZW1wdHkiLCJzaXplIiwiX2xpbmtFbHRJbiIsImVsdCIsIl9saW5rRWx0T3V0IiwiaXRlbSIsImJlZm9yZSIsIkVycm9yIiwiYXBwZW5kIiwicmVtb3ZlIiwiZ2V0IiwiaGFzIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiaXRlciIsImNvbnRleHQiLCJpIiwiYiIsIkJSRUFLIiwiZmlyc3QiLCJmaXJzdFZhbHVlIiwibGFzdCIsImxhc3RWYWx1ZSIsIm1vdmVCZWZvcmUiLCJlbHRCZWZvcmUiLCJpbmRleE9mIiwicmV0IiwidiIsImsiLCJfY2hlY2tSZXAiLCJrZXlzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7O0FBQUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQSxTQUFTQyxPQUFULENBQWlCQyxHQUFqQixFQUFzQkMsS0FBdEIsRUFBNkJDLElBQTdCLEVBQW1DQyxJQUFuQyxFQUF5QztBQUN2QyxTQUFPO0FBQ0xILFNBQUtBLEdBREE7QUFFTEMsV0FBT0EsS0FGRjtBQUdMQyxVQUFNQSxJQUhEO0FBSUxDLFVBQU1BO0FBSkQsR0FBUDtBQU1EOztBQUVNLE1BQU1MLFdBQU4sQ0FBa0I7QUFDdkJNLGNBQVksR0FBR0MsSUFBZixF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QUNEOztBQUNEO0FBQ0QsS0FORDtBQU9BLFdBQU9RLEdBQVA7QUFDRDs7QUFFREcsY0FBWTtBQUNWMUMsV0FBTzJDLElBQVAsQ0FBWSxLQUFLNUMsS0FBakIsRUFBd0JTLE9BQXhCLENBQWdDaUMsS0FBSztBQUNuQyxZQUFNRCxJQUFJLEtBQUt6QyxLQUFMLENBQVcwQyxDQUFYLENBQVY7O0FBQ0EsVUFBSUQsRUFBRTdDLElBQUYsS0FBVzZDLENBQWYsRUFBa0I7QUFDaEIsY0FBTSxJQUFJckIsS0FBSixDQUFVLGdCQUFWLENBQU47QUFDRDs7QUFDRCxVQUFJcUIsRUFBRTVDLElBQUYsS0FBVzRDLENBQWYsRUFBa0I7QUFDaEIsY0FBTSxJQUFJckIsS0FBSixDQUFVLGdCQUFWLENBQU47QUFDRDtBQUNGLEtBUkQ7QUFTRDs7QUF2TXNCOztBQTBNekI1QixZQUFZd0MsS0FBWixHQUFvQjtBQUFDLFdBQVM7QUFBVixDQUFwQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9vcmRlcmVkLWRpY3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGlzIGZpbGUgZGVmaW5lcyBhbiBvcmRlcmVkIGRpY3Rpb25hcnkgYWJzdHJhY3Rpb24gdGhhdCBpcyB1c2VmdWwgZm9yXG4vLyBtYWludGFpbmluZyBhIGRhdGFzZXQgYmFja2VkIGJ5IG9ic2VydmVDaGFuZ2VzLiAgSXQgc3VwcG9ydHMgb3JkZXJpbmcgaXRlbXNcbi8vIGJ5IHNwZWNpZnlpbmcgdGhlIGl0ZW0gdGhleSBub3cgY29tZSBiZWZvcmUuXG5cbi8vIFRoZSBpbXBsZW1lbnRhdGlvbiBpcyBhIGRpY3Rpb25hcnkgdGhhdCBjb250YWlucyBub2RlcyBvZiBhIGRvdWJseS1saW5rZWRcbi8vIGxpc3QgYXMgaXRzIHZhbHVlcy5cblxuLy8gY29uc3RydWN0cyBhIG5ldyBlbGVtZW50IHN0cnVjdFxuLy8gbmV4dCBhbmQgcHJldiBhcmUgd2hvbGUgZWxlbWVudHMsIG5vdCBrZXlzLlxuZnVuY3Rpb24gZWxlbWVudChrZXksIHZhbHVlLCBuZXh0LCBwcmV2KSB7XG4gIHJldHVybiB7XG4gICAga2V5OiBrZXksXG4gICAgdmFsdWU6IHZhbHVlLFxuICAgIG5leHQ6IG5leHQsXG4gICAgcHJldjogcHJldlxuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgT3JkZXJlZERpY3Qge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgdGhpcy5fZGljdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5fZmlyc3QgPSBudWxsO1xuICAgIHRoaXMuX2xhc3QgPSBudWxsO1xuICAgIHRoaXMuX3NpemUgPSAwO1xuXG4gICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLl9zdHJpbmdpZnkgPSBhcmdzLnNoaWZ0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0cmluZ2lmeSA9IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9O1xuICAgIH1cblxuICAgIGFyZ3MuZm9yRWFjaChrdiA9PiB0aGlzLnB1dEJlZm9yZShrdlswXSwga3ZbMV0sIG51bGwpKTtcbiAgfVxuXG4gIC8vIHRoZSBcInByZWZpeCBrZXlzIHdpdGggYSBzcGFjZVwiIHRoaW5nIGNvbWVzIGZyb20gaGVyZVxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZG9jdW1lbnRjbG91ZC91bmRlcnNjb3JlL2lzc3Vlcy8zNzYjaXNzdWVjb21tZW50LTI4MTU2NDlcbiAgX2soa2V5KSB7XG4gICAgcmV0dXJuIFwiIFwiICsgdGhpcy5fc3RyaW5naWZ5KGtleSk7XG4gIH1cblxuICBlbXB0eSgpIHtcbiAgICByZXR1cm4gIXRoaXMuX2ZpcnN0O1xuICB9XG5cbiAgc2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcbiAgfVxuXG4gIF9saW5rRWx0SW4oZWx0KSB7XG4gICAgaWYgKCFlbHQubmV4dCkge1xuICAgICAgZWx0LnByZXYgPSB0aGlzLl9sYXN0O1xuICAgICAgaWYgKHRoaXMuX2xhc3QpXG4gICAgICAgIHRoaXMuX2xhc3QubmV4dCA9IGVsdDtcbiAgICAgIHRoaXMuX2xhc3QgPSBlbHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsdC5wcmV2ID0gZWx0Lm5leHQucHJldjtcbiAgICAgIGVsdC5uZXh0LnByZXYgPSBlbHQ7XG4gICAgICBpZiAoZWx0LnByZXYpXG4gICAgICAgIGVsdC5wcmV2Lm5leHQgPSBlbHQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9maXJzdCA9PT0gbnVsbCB8fCB0aGlzLl9maXJzdCA9PT0gZWx0Lm5leHQpXG4gICAgICB0aGlzLl9maXJzdCA9IGVsdDtcbiAgfVxuXG4gIF9saW5rRWx0T3V0KGVsdCkge1xuICAgIGlmIChlbHQubmV4dClcbiAgICAgIGVsdC5uZXh0LnByZXYgPSBlbHQucHJldjtcbiAgICBpZiAoZWx0LnByZXYpXG4gICAgICBlbHQucHJldi5uZXh0ID0gZWx0Lm5leHQ7XG4gICAgaWYgKGVsdCA9PT0gdGhpcy5fbGFzdClcbiAgICAgIHRoaXMuX2xhc3QgPSBlbHQucHJldjtcbiAgICBpZiAoZWx0ID09PSB0aGlzLl9maXJzdClcbiAgICAgIHRoaXMuX2ZpcnN0ID0gZWx0Lm5leHQ7XG4gIH1cblxuICBwdXRCZWZvcmUoa2V5LCBpdGVtLCBiZWZvcmUpIHtcbiAgICBpZiAodGhpcy5fZGljdFt0aGlzLl9rKGtleSldKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSXRlbSBcIiArIGtleSArIFwiIGFscmVhZHkgcHJlc2VudCBpbiBPcmRlcmVkRGljdFwiKTtcbiAgICB2YXIgZWx0ID0gYmVmb3JlID9cbiAgICAgIGVsZW1lbnQoa2V5LCBpdGVtLCB0aGlzLl9kaWN0W3RoaXMuX2soYmVmb3JlKV0pIDpcbiAgICAgIGVsZW1lbnQoa2V5LCBpdGVtLCBudWxsKTtcbiAgICBpZiAodHlwZW9mIGVsdC5uZXh0ID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IGZpbmQgaXRlbSB0byBwdXQgdGhpcyBvbmUgYmVmb3JlXCIpO1xuICAgIHRoaXMuX2xpbmtFbHRJbihlbHQpO1xuICAgIHRoaXMuX2RpY3RbdGhpcy5fayhrZXkpXSA9IGVsdDtcbiAgICB0aGlzLl9zaXplKys7XG4gIH1cblxuICBhcHBlbmQoa2V5LCBpdGVtKSB7XG4gICAgdGhpcy5wdXRCZWZvcmUoa2V5LCBpdGVtLCBudWxsKTtcbiAgfVxuXG4gIHJlbW92ZShrZXkpIHtcbiAgICB2YXIgZWx0ID0gdGhpcy5fZGljdFt0aGlzLl9rKGtleSldO1xuICAgIGlmICh0eXBlb2YgZWx0ID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSXRlbSBcIiArIGtleSArIFwiIG5vdCBwcmVzZW50IGluIE9yZGVyZWREaWN0XCIpO1xuICAgIHRoaXMuX2xpbmtFbHRPdXQoZWx0KTtcbiAgICB0aGlzLl9zaXplLS07XG4gICAgZGVsZXRlIHRoaXMuX2RpY3RbdGhpcy5fayhrZXkpXTtcbiAgICByZXR1cm4gZWx0LnZhbHVlO1xuICB9XG5cbiAgZ2V0KGtleSkge1xuICAgIGlmICh0aGlzLmhhcyhrZXkpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGljdFt0aGlzLl9rKGtleSldLnZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIGhhcyhrZXkpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKFxuICAgICAgdGhpcy5fZGljdCxcbiAgICAgIHRoaXMuX2soa2V5KVxuICAgICk7XG4gIH1cblxuICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGl0ZW1zIGluIHRoaXMgZGljdGlvbmFyeSBpbiBvcmRlciwgY2FsbGluZ1xuICAvLyBpdGVyKHZhbHVlLCBrZXksIGluZGV4KSBvbiBlYWNoIG9uZS5cblxuICAvLyBTdG9wcyB3aGVuZXZlciBpdGVyIHJldHVybnMgT3JkZXJlZERpY3QuQlJFQUssIG9yIGFmdGVyIHRoZSBsYXN0IGVsZW1lbnQuXG4gIGZvckVhY2goaXRlciwgY29udGV4dCA9IG51bGwpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGVsdCA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChlbHQgIT09IG51bGwpIHtcbiAgICAgIHZhciBiID0gaXRlci5jYWxsKGNvbnRleHQsIGVsdC52YWx1ZSwgZWx0LmtleSwgaSk7XG4gICAgICBpZiAoYiA9PT0gT3JkZXJlZERpY3QuQlJFQUspIHJldHVybjtcbiAgICAgIGVsdCA9IGVsdC5uZXh0O1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIGZpcnN0KCkge1xuICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2ZpcnN0LmtleTtcbiAgfVxuXG4gIGZpcnN0VmFsdWUoKSB7XG4gICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZmlyc3QudmFsdWU7XG4gIH1cblxuICBsYXN0KCkge1xuICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2xhc3Qua2V5O1xuICB9XG5cbiAgbGFzdFZhbHVlKCkge1xuICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2xhc3QudmFsdWU7XG4gIH1cblxuICBwcmV2KGtleSkge1xuICAgIGlmICh0aGlzLmhhcyhrZXkpKSB7XG4gICAgICB2YXIgZWx0ID0gdGhpcy5fZGljdFt0aGlzLl9rKGtleSldO1xuICAgICAgaWYgKGVsdC5wcmV2KVxuICAgICAgICByZXR1cm4gZWx0LnByZXYua2V5O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIG5leHQoa2V5KSB7XG4gICAgaWYgKHRoaXMuaGFzKGtleSkpIHtcbiAgICAgIHZhciBlbHQgPSB0aGlzLl9kaWN0W3RoaXMuX2soa2V5KV07XG4gICAgICBpZiAoZWx0Lm5leHQpXG4gICAgICAgIHJldHVybiBlbHQubmV4dC5rZXk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbW92ZUJlZm9yZShrZXksIGJlZm9yZSkge1xuICAgIHZhciBlbHQgPSB0aGlzLl9kaWN0W3RoaXMuX2soa2V5KV07XG4gICAgdmFyIGVsdEJlZm9yZSA9IGJlZm9yZSA/IHRoaXMuX2RpY3RbdGhpcy5fayhiZWZvcmUpXSA6IG51bGw7XG4gICAgaWYgKHR5cGVvZiBlbHQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkl0ZW0gdG8gbW92ZSBpcyBub3QgcHJlc2VudFwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbHRCZWZvcmUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIGVsZW1lbnQgdG8gbW92ZSB0aGlzIG9uZSBiZWZvcmVcIik7XG4gICAgfVxuICAgIGlmIChlbHRCZWZvcmUgPT09IGVsdC5uZXh0KSAvLyBubyBtb3ZpbmcgbmVjZXNzYXJ5XG4gICAgICByZXR1cm47XG4gICAgLy8gcmVtb3ZlIGZyb20gaXRzIG9sZCBwbGFjZVxuICAgIHRoaXMuX2xpbmtFbHRPdXQoZWx0KTtcbiAgICAvLyBwYXRjaCBpbnRvIGl0cyBuZXcgcGxhY2VcbiAgICBlbHQubmV4dCA9IGVsdEJlZm9yZTtcbiAgICB0aGlzLl9saW5rRWx0SW4oZWx0KTtcbiAgfVxuXG4gIC8vIExpbmVhciwgc2FkbHkuXG4gIGluZGV4T2Yoa2V5KSB7XG4gICAgdmFyIHJldCA9IG51bGw7XG4gICAgdGhpcy5mb3JFYWNoKCh2LCBrLCBpKSA9PiB7XG4gICAgICBpZiAodGhpcy5fayhrKSA9PT0gdGhpcy5fayhrZXkpKSB7XG4gICAgICAgIHJldCA9IGk7XG4gICAgICAgIHJldHVybiBPcmRlcmVkRGljdC5CUkVBSztcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgX2NoZWNrUmVwKCkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuX2RpY3QpLmZvckVhY2goayA9PiB7XG4gICAgICBjb25zdCB2ID0gdGhpcy5fZGljdFtrXTtcbiAgICAgIGlmICh2Lm5leHQgPT09IHYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmV4dCBpcyBhIGxvb3BcIik7XG4gICAgICB9XG4gICAgICBpZiAodi5wcmV2ID09PSB2KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZXYgaXMgYSBsb29wXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbk9yZGVyZWREaWN0LkJSRUFLID0ge1wiYnJlYWtcIjogdHJ1ZX07XG4iXX0=

(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Retry;

var require = meteorInstall({"node_modules":{"meteor":{"retry":{"retry.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/retry/retry.js                                                   //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
module.export({
  Retry: () => Retry
});

class Retry {
  constructor({
    baseTimeout = 1000,
    exponent = 2.2,
    // The default is high-ish to ensure a server can recover from a
    // failure caused by load.
    maxTimeout = 5 * 60 * 1000,
    minTimeout = 10,
    minCount = 2,
    fuzz = 0.5
  } = {}) {
    this.baseTimeout = baseTimeout;
    this.exponent = exponent;
    this.maxTimeout = maxTimeout;
    this.minTimeout = minTimeout;
    this.minCount = minCount;
    this.fuzz = fuzz;
    this.retryTimer = null;
  } // Reset a pending retry, if any.


  clear() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = null;
  } // Calculate how long to wait in milliseconds to retry, based on the
  // `count` of which retry this is.


  _timeout(count) {
    if (count < this.minCount) {
      return this.minTimeout;
    } // fuzz the timeout randomly, to avoid reconnect storms when a
    // server goes down.


    var timeout = Math.min(this.maxTimeout, this.baseTimeout * Math.pow(this.exponent, count)) * (Random.fraction() * this.fuzz + (1 - this.fuzz / 2));
    return timeout;
  } // Call `fn` after a delay, based on the `count` of which retry this is.


  retryLater(count, fn) {
    var timeout = this._timeout(count);

    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = Meteor.setTimeout(fn, timeout);
    return timeout;
  }

}
///////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/retry/retry.js");

/* Exports */
Package._define("retry", exports, {
  Retry: Retry
});

})();

//# sourceURL=meteor://💻app/packages/retry.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmV0cnkvcmV0cnkuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiUmV0cnkiLCJjb25zdHJ1Y3RvciIsImJhc2VUaW1lb3V0IiwiZXhwb25lbnQiLCJtYXhUaW1lb3V0IiwibWluVGltZW91dCIsIm1pbkNvdW50IiwiZnV6eiIsInJldHJ5VGltZXIiLCJjbGVhciIsImNsZWFyVGltZW91dCIsIl90aW1lb3V0IiwiY291bnQiLCJ0aW1lb3V0IiwiTWF0aCIsIm1pbiIsInBvdyIsIlJhbmRvbSIsImZyYWN0aW9uIiwicmV0cnlMYXRlciIsImZuIiwiTWV0ZW9yIiwic2V0VGltZW91dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLFNBQU0sTUFBSUE7QUFBWCxDQUFkOztBQVVPLE1BQU1BLEtBQU4sQ0FBWTtBQUNqQkMsY0FBWTtBQUNWQyxrQkFBYyxJQURKO0FBRVZDLGVBQVcsR0FGRDtBQUdWO0FBQ0E7QUFDQUMsaUJBQWEsSUFBSSxFQUFKLEdBQVMsSUFMWjtBQU1WQyxpQkFBYSxFQU5IO0FBT1ZDLGVBQVcsQ0FQRDtBQVFWQyxXQUFPO0FBUkcsTUFTUixFQVRKLEVBU1E7QUFDTixTQUFLTCxXQUFMLEdBQW1CQSxXQUFuQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQixJQUFsQjtBQUNELEdBbEJnQixDQW9CakI7OztBQUNBQyxVQUFRO0FBQ04sUUFBSSxLQUFLRCxVQUFULEVBQXFCO0FBQ25CRSxtQkFBYSxLQUFLRixVQUFsQjtBQUNEOztBQUNELFNBQUtBLFVBQUwsR0FBa0IsSUFBbEI7QUFDRCxHQTFCZ0IsQ0E0QmpCO0FBQ0E7OztBQUNBRyxXQUFTQyxLQUFULEVBQWdCO0FBQ2QsUUFBSUEsUUFBUSxLQUFLTixRQUFqQixFQUEyQjtBQUN6QixhQUFPLEtBQUtELFVBQVo7QUFDRCxLQUhhLENBS2Q7QUFDQTs7O0FBQ0EsUUFBSVEsVUFBVUMsS0FBS0MsR0FBTCxDQUNaLEtBQUtYLFVBRE8sRUFFWixLQUFLRixXQUFMLEdBQW1CWSxLQUFLRSxHQUFMLENBQVMsS0FBS2IsUUFBZCxFQUF3QlMsS0FBeEIsQ0FGUCxLQUlaSyxPQUFPQyxRQUFQLEtBQW9CLEtBQUtYLElBQXpCLElBQWlDLElBQUksS0FBS0EsSUFBTCxHQUFZLENBQWpELENBSlksQ0FBZDtBQU9BLFdBQU9NLE9BQVA7QUFDRCxHQTdDZ0IsQ0ErQ2pCOzs7QUFDQU0sYUFBV1AsS0FBWCxFQUFrQlEsRUFBbEIsRUFBc0I7QUFDcEIsUUFBSVAsVUFBVSxLQUFLRixRQUFMLENBQWNDLEtBQWQsQ0FBZDs7QUFDQSxRQUFJLEtBQUtKLFVBQVQsRUFDRUUsYUFBYSxLQUFLRixVQUFsQjtBQUNGLFNBQUtBLFVBQUwsR0FBa0JhLE9BQU9DLFVBQVAsQ0FBa0JGLEVBQWxCLEVBQXNCUCxPQUF0QixDQUFsQjtBQUNBLFdBQU9BLE9BQVA7QUFDRDs7QUF0RGdCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JldHJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUmV0cnkgbG9naWMgd2l0aCBhbiBleHBvbmVudGlhbCBiYWNrb2ZmLlxuLy9cbi8vIG9wdGlvbnM6XG4vLyAgYmFzZVRpbWVvdXQ6IHRpbWUgZm9yIGluaXRpYWwgcmVjb25uZWN0IGF0dGVtcHQgKG1zKS5cbi8vICBleHBvbmVudDogZXhwb25lbnRpYWwgZmFjdG9yIHRvIGluY3JlYXNlIHRpbWVvdXQgZWFjaCBhdHRlbXB0LlxuLy8gIG1heFRpbWVvdXQ6IG1heGltdW0gdGltZSBiZXR3ZWVuIHJldHJpZXMgKG1zKS5cbi8vICBtaW5Db3VudDogaG93IG1hbnkgdGltZXMgdG8gcmVjb25uZWN0IFwiaW5zdGFudGx5XCIuXG4vLyAgbWluVGltZW91dDogdGltZSB0byB3YWl0IGZvciB0aGUgZmlyc3QgYG1pbkNvdW50YCByZXRyaWVzIChtcykuXG4vLyAgZnV6ejogZmFjdG9yIHRvIHJhbmRvbWl6ZSByZXRyeSB0aW1lcyBieSAodG8gYXZvaWQgcmV0cnkgc3Rvcm1zKS5cblxuZXhwb3J0IGNsYXNzIFJldHJ5IHtcbiAgY29uc3RydWN0b3Ioe1xuICAgIGJhc2VUaW1lb3V0ID0gMTAwMCxcbiAgICBleHBvbmVudCA9IDIuMixcbiAgICAvLyBUaGUgZGVmYXVsdCBpcyBoaWdoLWlzaCB0byBlbnN1cmUgYSBzZXJ2ZXIgY2FuIHJlY292ZXIgZnJvbSBhXG4gICAgLy8gZmFpbHVyZSBjYXVzZWQgYnkgbG9hZC5cbiAgICBtYXhUaW1lb3V0ID0gNSAqIDYwICogMTAwMCxcbiAgICBtaW5UaW1lb3V0ID0gMTAsXG4gICAgbWluQ291bnQgPSAyLFxuICAgIGZ1enogPSAwLjUsXG4gIH0gPSB7fSkge1xuICAgIHRoaXMuYmFzZVRpbWVvdXQgPSBiYXNlVGltZW91dDtcbiAgICB0aGlzLmV4cG9uZW50ID0gZXhwb25lbnQ7XG4gICAgdGhpcy5tYXhUaW1lb3V0ID0gbWF4VGltZW91dDtcbiAgICB0aGlzLm1pblRpbWVvdXQgPSBtaW5UaW1lb3V0O1xuICAgIHRoaXMubWluQ291bnQgPSBtaW5Db3VudDtcbiAgICB0aGlzLmZ1enogPSBmdXp6O1xuICAgIHRoaXMucmV0cnlUaW1lciA9IG51bGw7XG4gIH1cblxuICAvLyBSZXNldCBhIHBlbmRpbmcgcmV0cnksIGlmIGFueS5cbiAgY2xlYXIoKSB7XG4gICAgaWYgKHRoaXMucmV0cnlUaW1lcikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucmV0cnlUaW1lcik7XG4gICAgfVxuICAgIHRoaXMucmV0cnlUaW1lciA9IG51bGw7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgaG93IGxvbmcgdG8gd2FpdCBpbiBtaWxsaXNlY29uZHMgdG8gcmV0cnksIGJhc2VkIG9uIHRoZVxuICAvLyBgY291bnRgIG9mIHdoaWNoIHJldHJ5IHRoaXMgaXMuXG4gIF90aW1lb3V0KGNvdW50KSB7XG4gICAgaWYgKGNvdW50IDwgdGhpcy5taW5Db3VudCkge1xuICAgICAgcmV0dXJuIHRoaXMubWluVGltZW91dDtcbiAgICB9XG5cbiAgICAvLyBmdXp6IHRoZSB0aW1lb3V0IHJhbmRvbWx5LCB0byBhdm9pZCByZWNvbm5lY3Qgc3Rvcm1zIHdoZW4gYVxuICAgIC8vIHNlcnZlciBnb2VzIGRvd24uXG4gICAgdmFyIHRpbWVvdXQgPSBNYXRoLm1pbihcbiAgICAgIHRoaXMubWF4VGltZW91dCxcbiAgICAgIHRoaXMuYmFzZVRpbWVvdXQgKiBNYXRoLnBvdyh0aGlzLmV4cG9uZW50LCBjb3VudClcbiAgICApICogKFxuICAgICAgUmFuZG9tLmZyYWN0aW9uKCkgKiB0aGlzLmZ1enogKyAoMSAtIHRoaXMuZnV6eiAvIDIpXG4gICAgKTtcblxuICAgIHJldHVybiB0aW1lb3V0O1xuICB9XG5cbiAgLy8gQ2FsbCBgZm5gIGFmdGVyIGEgZGVsYXksIGJhc2VkIG9uIHRoZSBgY291bnRgIG9mIHdoaWNoIHJldHJ5IHRoaXMgaXMuXG4gIHJldHJ5TGF0ZXIoY291bnQsIGZuKSB7XG4gICAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0KGNvdW50KTtcbiAgICBpZiAodGhpcy5yZXRyeVRpbWVyKVxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucmV0cnlUaW1lcik7XG4gICAgdGhpcy5yZXRyeVRpbWVyID0gTWV0ZW9yLnNldFRpbWVvdXQoZm4sIHRpbWVvdXQpO1xuICAgIHJldHVybiB0aW1lb3V0O1xuICB9XG59XG4iXX0=
